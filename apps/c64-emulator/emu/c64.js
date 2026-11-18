/* Commodore 64 (PAL): memory map / PLA, I/O, keyboard, joysticks and the
 * cycle scheduler that ties CPU, VIC-II, CIAs, SID, datasette and 1541 together.
 *
 * Timing: the CPU runs whole instructions; before every I/O access the other
 * chips are clocked up to the cycle of that access (instruction start + base
 * cycles - 1), so register writes land on the right cycle within a few cycles.
 */
(function (global) {
  "use strict";

  var CLOCK = 985248;                 // PAL phi2
  var CYCLES_PER_FRAME = 63 * 312;

  // C64 keyboard matrix: [column (PA bit), row (PB bit)]
  var KEYS = {
    DEL: [0, 0], RETURN: [0, 1], CRSR_RIGHT: [0, 2], F7: [0, 3], F1: [0, 4], F3: [0, 5], F5: [0, 6], CRSR_DOWN: [0, 7],
    "3": [1, 0], W: [1, 1], A: [1, 2], "4": [1, 3], Z: [1, 4], S: [1, 5], E: [1, 6], LSHIFT: [1, 7],
    "5": [2, 0], R: [2, 1], D: [2, 2], "6": [2, 3], C: [2, 4], F: [2, 5], T: [2, 6], X: [2, 7],
    "7": [3, 0], Y: [3, 1], G: [3, 2], "8": [3, 3], B: [3, 4], H: [3, 5], U: [3, 6], V: [3, 7],
    "9": [4, 0], I: [4, 1], J: [4, 2], "0": [4, 3], M: [4, 4], K: [4, 5], O: [4, 6], N: [4, 7],
    PLUS: [5, 0], P: [5, 1], L: [5, 2], MINUS: [5, 3], PERIOD: [5, 4], COLON: [5, 5], AT: [5, 6], COMMA: [5, 7],
    POUND: [6, 0], ASTERISK: [6, 1], SEMICOLON: [6, 2], HOME: [6, 3], RSHIFT: [6, 4], EQUALS: [6, 5], UP_ARROW: [6, 6], SLASH: [6, 7],
    "1": [7, 0], LEFT_ARROW: [7, 1], CTRL: [7, 2], "2": [7, 3], SPACE: [7, 4], CBM: [7, 5], Q: [7, 6], RUN_STOP: [7, 7]
  };

  function C64(roms) {
    var self = this;
    this.ram = new Uint8Array(0x10000);
    this.colorRam = new Uint8Array(0x400);
    this.setRoms(roms);
    this.cpu = new global.CPU6502(this);
    this.vic = new global.VIC6569(this);
    this.sid = new global.SID6581(CLOCK, 44100);
    this.cia1 = new global.CIA6526("CIA1");
    this.cia2 = new global.CIA6526("CIA2");
    this.cia1.onIrq = function (l) { self.setIrq(1, l); };
    this.cia2.onIrq = function (l) { self.setNmi(1, l); };
    this.cia1.readPA = function () { return self.cia1PA(); };
    this.cia1.readPB = function () { return self.cia1PB(); };
    this.cia2.readPA = function () { return self.cia2PA(); };
    this.cia2.onWritePort = function () { self.cia2Changed(); };
    this.cols = new Uint8Array(8);          // pressed keys: per column a mask of rows
    this.joy = [0, 0];                      // joystick port 1 and 2: bit 0 up, 1 down, 2 left, 3 right, 4 fire
    this.nmiSrc = 0;
    this.cart = null;
    this.tape = null;                       // Datasette
    this.drive = null;                      // Drive1541 (true drive emulation)
    this.iec = { atn: 0, clk: 0, data: 0 }; // C64 side outputs (1 = pulling the line low)
    this.disk = null;                       // mounted disk image for the fast loader trap
    this.tapeImage = null;                  // T64 for trap loading from device 1
    this.trapLoad = 0;                      // address of the KERNAL load routine (vector $0330)
    this.typeQueue = [];
    this.rmap = new Array(16);
    this.roff = new Int32Array(16);
    this.io = new Uint8Array(16);
    this.clk = 0; this.cycNow = 0; this.irqAt = 0; this.pollAt = -1;
    this.instrStart = 0;
    this.warp = false;
    this.onLed = null;
    this.reset(true);
  }
  C64.CLOCK = CLOCK;
  C64.CYCLES_PER_FRAME = CYCLES_PER_FRAME;
  C64.KEYS = KEYS;
  var P = C64.prototype;

  P.setRoms = function (roms) {
    this.basic = roms.basic;
    this.kernal = roms.kernal;
    this.charRom = roms.chargen;
  };

  P.reset = function (hard) {
    if (hard) {
      // power-on RAM pattern
      for (var i = 0; i < 0x10000; i++) this.ram[i] = (i & 0x40) ? 0xFF : 0x00;
      for (var j = 0; j < 0x400; j++) this.colorRam[j] = (j * 7) & 15;
    }
    this.ddr = 0x2F; this.port = 0x37;
    this.vic.reset();
    this.sid.reset();
    this.cia1.reset();
    this.cia2.reset();
    this.cpu.irq = 0;
    this.nmiSrc = 0; this.cpu.setNMI(0);
    this.vicBank = 0;
    this.typeQueue = [];
    this.trapLoad = 0;
    this.iec.atn = this.iec.clk = this.iec.data = 0;
    if (this.cart) this.cart.reset();
    this.updateMap();
    this.cpu.reset();
    if (this.drive) this.drive.reset();
    this.clk = 0; this.cycNow = 0; this.irqAt = 0; this.pollAt = -1;
    this.sid.clk = 0;
    if (this.drive) this.drive.syncBase(0);
  };

  // ---------------------------------------------------------------- memory map
  P.updateMap = function () {
    var port = (this.port & this.ddr) | (~this.ddr & 0x17);
    var lo = port & 1, hi = port & 2, ch = port & 4;
    var cart = this.cart;
    var exrom = cart ? cart.exrom : 1, game = cart ? cart.game : 1;
    var m = this.rmap, o = this.roff, io = this.io, ram = this.ram, i;
    for (i = 0; i < 16; i++) { m[i] = ram; o[i] = 0; io[i] = 0; }
    this.ultimax = !game && exrom;
    if (this.ultimax) {
      for (i = 1; i < 8; i++) { m[i] = null; io[i] = 2; }          // open bus
      m[0x8] = m[0x9] = cart.roml; o[0x8] = o[0x9] = 0x8000;
      for (i = 0xA; i < 0xD; i++) { m[i] = null; io[i] = 2; }
      m[0xD] = null; io[0xD] = 1;
      m[0xE] = m[0xF] = cart.romh; o[0xE] = o[0xF] = 0xE000;
      return;
    }
    // BASIC / cartridge ROM L and H
    if (!exrom && lo && hi) { m[0x8] = m[0x9] = cart.roml; o[0x8] = o[0x9] = 0x8000; }
    if (!exrom && !game && hi) { m[0xA] = m[0xB] = cart.romh; o[0xA] = o[0xB] = 0xA000; }
    else if (lo && hi && (game || exrom)) { m[0xA] = m[0xB] = this.basic; o[0xA] = o[0xB] = 0xA000; }
    if (hi) { m[0xE] = m[0xF] = this.kernal; o[0xE] = o[0xF] = 0xE000; }
    if (lo || hi) {
      if (ch) { m[0xD] = null; io[0xD] = 1; }
      else { m[0xD] = this.charRom; o[0xD] = 0xD000; }
    }
    // 8K game mode hides nothing else; for 16K cartridges without HIRAM, $A000 is RAM
  };

  P.read = function (a) {
    if (a < 2) {
      if (a === 0) return this.ddr;
      var inp = 0x17 | (this.tape && this.tape.playing ? 0 : 0x10);
      if (this.tape && this.tape.playing) inp &= ~0x10;
      return ((this.port & this.ddr) | (inp & ~this.ddr)) & 0xFF;
    }
    var p = a >> 12, arr = this.rmap[p];
    if (arr !== null) return arr[a - this.roff[p]];
    if (this.io[p] === 2) return this.vicLast();
    return this.ioRead(a);
  };

  P.write = function (a, v) {
    if (a < 2) {
      if (a === 0) this.ddr = v; else this.port = v;
      this.ram[a] = v;     // the RAM below the port also gets the value (VIC can see it)
      this.updateMap();
      if (this.tape) this.tape.setMotor(!((this.port | ~this.ddr) & 0x20));
      return;
    }
    var p = a >> 12;
    if (this.io[p] === 1) { this.ioWrite(a, v); return; }
    if (this.io[p] === 2) return;
    this.ram[a] = v;
  };

  P.vicLast = function () { return 0xFF; };

  // VIC-II memory access (14-bit address in the current bank)
  P.vicRead = function (a) {
    if (this.vicCharRom && (a & 0x3000) === 0x1000) return this.charRom[a & 0x0FFF];
    if (this.ultimax && (a & 0x3000) === 0x3000) return this.cart.romh[a & 0x1FFF];
    return this.ram[this.vicBank | a];
  };

  // ---------------------------------------------------------------- I/O
  P.syncIO = function () {
    var t = this.instrStart + this.cpu.cyc - 1;
    if (t > this.clk) this.syncTo(t);
  };

  P.ioRead = function (a) {
    this.syncIO();
    switch ((a >> 8) & 0x0F) {
      case 0x0: case 0x1: case 0x2: case 0x3: return this.vic.read(a);
      case 0x4: case 0x5: case 0x6: case 0x7: this.sid.clockTo(this.clk); return this.sid.read(a);
      case 0x8: case 0x9: case 0xA: case 0xB: return (this.colorRam[a & 0x3FF] & 0x0F) | 0xF0;
      case 0xC: return this.cia1.read(a);
      case 0xD: return this.cia2.read(a);
      case 0xE: return this.cart ? this.cart.readIO1(a) : 0xFF;
      case 0xF: return this.cart ? this.cart.readIO2(a) : 0xFF;
    }
    return 0xFF;
  };

  P.ioWrite = function (a, v) {
    this.syncIO();
    switch ((a >> 8) & 0x0F) {
      case 0x0: case 0x1: case 0x2: case 0x3: this.vic.write(a, v); break;
      case 0x4: case 0x5: case 0x6: case 0x7: this.sid.clockTo(this.clk); this.sid.write(a, v); break;
      case 0x8: case 0x9: case 0xA: case 0xB: this.colorRam[a & 0x3FF] = v & 0x0F; break;
      case 0xC: this.cia1.write(a, v); break;
      case 0xD: this.cia2.write(a, v); break;
      case 0xE: if (this.cart) this.cart.writeIO1(a, v); break;
      case 0xF: if (this.cart) this.cart.writeIO2(a, v); break;
    }
  };

  P.setIrq = function (bit, level) {
    if (level && !this.cpu.irq) this.irqAt = this.cycNow;   // when the IRQ line went low
    if (level) this.cpu.irq |= bit; else this.cpu.irq &= ~bit;
  };
  P.setNmi = function (bit, level) {
    if (level) this.nmiSrc |= bit; else this.nmiSrc &= ~bit;
    this.cpu.setNMI(this.nmiSrc ? 1 : 0);
  };
  P.restoreKey = function (down) { this.setNmi(2, down); };

  // CIA1 ports: keyboard matrix and joysticks
  P.cia1PA = function () {
    var c = this.cia1, pbOut = (c.prb | ~c.ddrb) & 0xFF & ~this.joy[0];
    var v = 0xFF;
    // reverse scan: rows driven low on PB pull columns low
    for (var col = 0; col < 8; col++) if (this.cols[col] & ~pbOut & 0xFF) v &= ~(1 << col);
    return v & ~this.joy[1] & 0xFF;
  };
  P.cia1PB = function () {
    var c = this.cia1, paOut = (c.pra | ~c.ddra) & 0xFF & ~this.joy[1];
    var v = 0xFF;
    for (var col = 0; col < 8; col++) if (!(paOut & (1 << col))) v &= ~this.cols[col];
    return v & ~this.joy[0] & 0xFF;
  };

  // CIA2 port A: VIC bank and serial bus
  P.cia2Changed = function () {
    var c = this.cia2, out = (c.pra | ~c.ddra) & 0xFF;
    this.vicBank = (3 - (out & 3)) << 14;
    this.vicCharRom = (this.vicBank & 0x4000) === 0;
    var atn = (out >> 3) & 1, clk = (out >> 4) & 1, data = (out >> 5) & 1;
    if (atn !== this.iec.atn || clk !== this.iec.clk || data !== this.iec.data) {
      this.iec.atn = atn; this.iec.clk = clk; this.iec.data = data;
      if (this.drive) this.drive.busChanged();
    }
  };
  P.cia2PA = function () {
    // bit 6 = CLK in, bit 7 = DATA in (1 = line released)
    var clkLow = this.iec.clk, dataLow = this.iec.data;
    if (this.drive) {
      var d = this.drive.busOut();
      clkLow |= d.clk; dataLow |= d.data;
    }
    return 0x3F | (clkLow ? 0 : 0x40) | (dataLow ? 0 : 0x80);
  };

  // ---------------------------------------------------------------- scheduler
  P.syncTo = function (t) {
    var vic = this.vic, c1 = this.cia1, c2 = this.cia2, tape = this.tape;
    var n = t - this.clk;
    if (n <= 0) return;
    for (var i = 0; i < n; i++) {
      this.cycNow = this.clk + i;
      vic.cycle();
      c1.tick();
      c2.tick();
    }
    if (tape && tape.running) tape.advance(n, this.cia1);
    this.clk = t;
    this.cycNow = t;
    if (this.drive) this.drive.runTo(t);
  };

  P.runFrame = function () {
    if (this.dbg) return this.runFrameDebug();
    var cpu = this.cpu, vic = this.vic, kernalTrap = this.trapLoad;
    vic.frameDone = false;
    while (!vic.frameDone) {
      if (vic.baNow()) { this.syncTo(this.clk + 1); continue; }
      if (kernalTrap && (cpu.pc === kernalTrap || cpu.pc === this.trapSave) && this.rmap[0xF] === this.kernal) {
        if (cpu.pc === kernalTrap ? this.handleLoadTrap() : this.handleSaveTrap()) continue;
      }
      this.instrStart = this.clk;
      // an IRQ that arrived after the poll of the last instruction waits one more instruction
      cpu.irqHold = cpu.irq !== 0 && this.irqAt > this.pollAt;
      var n = cpu.step();
      this.pollAt = this.instrStart + n - 2;
      this.syncTo(this.instrStart + n);
    }
    this.endFrame();
    return true;
  };
  P.endFrame = function () {
    this.sid.clockTo(this.clk);
    this.cia1.todTick();
    this.cia2.todTick();
    this.frameTasks();
  };

  // ---------------------------------------------------------------- debugger
  // With a debugger attached (this.dbg, see newDebugState) the frame runs through this
  // slower loop, which checks breakpoints, watchpoints and step modes around every
  // instruction. It returns false when the machine stops (dbg.reason says why); the
  // next call continues exactly there.
  var HIST = 4096;
  C64.newDebugState = function () {
    return {
      exec: new Uint8Array(0x10000),    // 1 = stop before the instruction at this address
      watch: new Uint8Array(0x10000),   // bit 0 = stop after a read, bit 1 = after a write
      raster: new Uint8Array(312),      // 1 = stop when the beam reaches this line
      stopIrq: false, stopNmi: false, stopBrk: false, stopJam: true,
      mode: "run",                      // run | step | over | out | line | frame
      skip: -1,                         // address to pass once when continuing from a breakpoint
      tempAt: -1, tempS: 0, outS: 0,    // step over / run to / step out
      lastLine: -1, fetchLo: 0, fetchHi: 0, hit: null, reason: null,
      hist: { pc: new Int32Array(HIST), a: new Uint8Array(HIST), x: new Uint8Array(HIST), y: new Uint8Array(HIST),
              s: new Uint8Array(HIST), p: new Uint8Array(HIST), kind: new Uint8Array(HIST), line: new Uint16Array(HIST),
              clk: new Float64Array(HIST), pos: 0, count: 0, size: HIST }
    };
  };

  P.runFrameDebug = function () {
    var cpu = this.cpu, vic = this.vic, D = this.dbg, H = D.hist, lens = global.C64Disasm.LENGTHS;
    vic.frameDone = false;
    while (!vic.frameDone) {
      if (vic.baNow()) {
        this.syncTo(this.clk + 1);
        if (vic.raster !== D.lastLine && this.lineCheck()) return false;
        continue;
      }
      var kernalTrap = this.trapLoad;
      if (kernalTrap && (cpu.pc === kernalTrap || cpu.pc === this.trapSave) && this.rmap[0xF] === this.kernal) {
        if (cpu.pc === kernalTrap ? this.handleLoadTrap() : this.handleSaveTrap()) continue;
      }
      this.instrStart = this.clk;
      cpu.irqHold = cpu.irq !== 0 && this.irqAt > this.pollAt;
      var nmi = cpu.nmiPending, intr = nmi || (cpu.irq !== 0 && !cpu.pollI && !cpu.irqHold);
      var pc = cpu.pc, op = 0;
      if (!intr) {
        op = this.peek(pc);
        if (pc === D.skip) D.skip = -1;
        else if (D.exec[pc]) return this.dbgStop({ kind: "break", addr: pc });
        else if (op === 0x00 && D.stopBrk) return this.dbgStop({ kind: "brk", addr: pc });
        if (pc === D.tempAt && cpu.s >= D.tempS) return this.dbgStop({ kind: D.mode === "over" ? "step" : "cursor", addr: pc });
        D.skip = -1;
        D.fetchLo = pc; D.fetchHi = pc + lens[op];
      } else D.fetchLo = D.fetchHi = -1;
      // history of executed instructions (registers before the instruction)
      var k = H.pos;
      H.pc[k] = pc; H.a[k] = cpu.a; H.x[k] = cpu.x; H.y[k] = cpu.y; H.s[k] = cpu.s; H.p[k] = cpu.getP(false);
      H.kind[k] = intr ? (nmi ? 2 : 1) : 0; H.clk[k] = this.clk; H.line[k] = vic.raster;
      H.pos = (k + 1) % H.size; if (H.count < H.size) H.count++;
      var wasJammed = cpu.jammed;
      D.hit = null;
      var n = cpu.step();
      this.pollAt = this.instrStart + n - 2;
      this.syncTo(this.instrStart + n);
      // after the instruction
      var why = null;
      if (D.hit) why = D.hit;
      else if (cpu.jammed && !wasJammed && D.stopJam) why = { kind: "jam", addr: pc };
      else if (intr && nmi && D.stopNmi) why = { kind: "nmi", addr: cpu.pc };
      else if (intr && !nmi && D.stopIrq) why = { kind: "irq", addr: cpu.pc };
      else if (D.mode === "step") why = { kind: "step", addr: cpu.pc };
      else if (D.mode === "out" && !intr && (op === 0x60 || op === 0x40) && cpu.s > D.outS) why = { kind: "out", addr: cpu.pc };
      if (why) {
        if (vic.frameDone) this.endFrame();
        return this.dbgStop(why);
      }
      if (vic.raster !== D.lastLine && this.lineCheck()) {
        if (vic.frameDone) this.endFrame();
        return false;
      }
    }
    this.endFrame();
    if (D.mode === "frame") return this.dbgStop({ kind: "frame", addr: cpu.pc });
    return true;
  };
  // The beam started a new line: raster breakpoint or "next line"
  P.lineCheck = function () {
    var D = this.dbg, line = this.vic.raster;
    D.lastLine = line;
    if (D.mode === "line") { this.dbgStop({ kind: "line", line: line, addr: this.cpu.pc }); return true; }
    if (D.raster[line]) { this.dbgStop({ kind: "raster", line: line, addr: this.cpu.pc }); return true; }
    return false;
  };
  P.dbgStop = function (why) {
    var D = this.dbg;
    D.reason = why;
    D.mode = "run"; D.tempAt = -1; D.hit = null;
    this.sid.clockTo(this.clk);
    return false;
  };

  // Memory watchpoints: the read/write functions of this machine are wrapped while any are set
  P.setWatching = function (on) {
    var self = this;
    if (!on) { delete this.read; delete this.write; return; }
    var rd = P.read, wr = P.write;
    this.read = function (a) {
      var v = rd.call(self, a), D = self.dbg;
      if (D && (D.watch[a] & 1) && !(a >= D.fetchLo && a < D.fetchHi) && !D.hit) D.hit = { kind: "load", addr: self.instrPc(), mem: a, value: v };
      return v;
    };
    this.write = function (a, v) {
      var D = self.dbg;
      if (D && (D.watch[a] & 2) && !D.hit) D.hit = { kind: "store", addr: self.instrPc(), mem: a, value: v & 0xFF, old: self.peek(a) };
      wr.call(self, a, v);
    };
  };
  P.instrPc = function () { return this.dbg && this.dbg.fetchLo >= 0 ? this.dbg.fetchLo : this.cpu.pc; };

  // Read memory as the CPU sees it, without side effects (no I/O register is touched)
  P.peek = function (a) {
    a &= 0xFFFF;
    if (a < 2) return P.read.call(this, a);
    var p = a >> 12, arr = this.rmap[p];
    if (arr !== null) return arr[a - this.roff[p]];
    if (this.io[p] === 2) return 0xFF;
    switch ((a >> 8) & 0x0F) {
      case 0x0: case 0x1: case 0x2: case 0x3:
        var r = a & 0x3F;
        if (r === 0x1E) return this.vic.sprSpr;
        if (r === 0x1F) return this.vic.sprBg;
        return this.vic.read(r);
      case 0x4: case 0x5: case 0x6: case 0x7: return this.sid.read(a);
      case 0x8: case 0x9: case 0xA: case 0xB: return (this.colorRam[a & 0x3FF] & 0x0F) | 0xF0;
      case 0xC: return this.cia1.peek(a);
      case 0xD: return this.cia2.peek(a);
    }
    return 0xFF;
  };

  P.frameTasks = function () {
    var ram = this.ram;
    // remember the KERNAL load routine once the vectors are initialised
    if (!this.trapLoad && ram[0x0331] >= 0xE0 && this.rmap[0xF] === this.kernal && this.vic.frame > 20) {
      this.trapLoad = ram[0x0330] | (ram[0x0331] << 8);
      this.trapSave = ram[0x0332] | (ram[0x0333] << 8);
    }
    // feed queued text into the keyboard buffer
    if (this.typeQueue.length && this.vic.frame > 140) {
      if (this.typeDelay > 0) { this.typeDelay--; return; }
      var item = this.typeQueue[0];
      if (typeof item === "object") {
        this.typeQueue.shift();
        if (item.pause) this.typeDelay = item.pause;
        if (item.fn) item.fn();
        return;
      }
      if (ram[0xC6] === 0) {
        var n = 0;
        while (this.typeQueue.length && typeof this.typeQueue[0] === "number" && n < 10) {
          ram[0x0277 + n++] = this.typeQueue.shift();
        }
        ram[0xC6] = n;
      }
    }
  };

  // Queue PETSCII text for the keyboard buffer, optionally after a pause (frames).
  P.type = function (text, pauseFrames) {
    if (pauseFrames) this.typeQueue.push({ pause: pauseFrames });
    for (var i = 0; i < text.length; i++) {
      var ch = text.charCodeAt(i);
      if (ch === 10) ch = 13;
      if (ch >= 0x61 && ch <= 0x7A) ch -= 0x20;
      this.typeQueue.push(ch);
    }
  };

  // ---------------------------------------------------------------- keyboard / joystick
  P.key = function (name, down) {
    var k = KEYS[name];
    if (!k) return;
    if (down) this.cols[k[0]] |= 1 << k[1]; else this.cols[k[0]] &= ~(1 << k[1]);
  };
  P.releaseAllKeys = function () { this.cols.fill(0); };
  P.setJoystick = function (port, bits) { this.joy[port] = bits & 0x1F; };

  // ---------------------------------------------------------------- fast loader trap
  // Called with PC at the KERNAL LOAD routine (vector $0330). Loads from the
  // mounted disk image (device 8..11, no true drive) or T64 (device 1).
  P.handleLoadTrap = function () {
    var ram = this.ram, cpu = this.cpu;
    var dev = ram[0xBA], sa = ram[0xB9];
    var src = null;
    if (dev === 1 && this.tape && this.tape.image) return this.tapeLoadTrap();
    if (dev >= 8 && dev <= 11 && this.disk && (!this.drive || this.drive.hle)) src = this.disk;
    else if (dev === 1 && this.tapeImage && !(this.tape && this.tape.image)) src = this.tapeImage;
    if (!src) return false;
    var len = ram[0xB7], ptr = ram[0xBB] | (ram[0xBC] << 8);
    var name = [];
    for (var i = 0; i < len; i++) name.push(this.read((ptr + i) & 0xFFFF));
    var verify = cpu.a !== 0;
    var file = global.C64Media.findFile(src, name);
    ram[0x90] = 0;
    if (!file) {
      ram[0x90] = 0x42;
      cpu.a = 4; cpu.c = 1;         // FILE NOT FOUND
    } else {
      var data = file.data;
      var start = (sa === 0 || file.isDirectory) ? (ram[0xC3] | (ram[0xC4] << 8)) : (data[0] | (data[1] << 8));
      if (file.isDirectory && sa !== 0) start = data[0] | (data[1] << 8);
      var end = start;
      if (!verify) {
        for (var j = 2; j < data.length; j++) { ram[end & 0xFFFF] = data[j]; end++; }
      } else end = start + data.length - 2;
      end &= 0xFFFF;
      ram[0xAE] = end & 0xFF; ram[0xAF] = end >> 8;
      ram[0x90] = 0x40;
      cpu.x = end & 0xFF; cpu.y = end >> 8; cpu.c = 0; cpu.a = 0;
      if (this.onLoad) this.onLoad(file);
    }
    // RTS
    var lo = cpu.pull(), hi = cpu.pull();
    cpu.pc = (((hi << 8) | lo) + 1) & 0xFFFF;
    this.syncTo(this.clk + 200);
    return true;
  };

  // LOAD from a TAP image: the standard KERNAL blocks are decoded directly from the
  // pulses (works with any KERNAL and takes no time); the tape is then positioned
  // behind the program, so a turbo loader in it can go on reading in real time.
  P.tapeLoadTrap = function () {
    var ram = this.ram, cpu = this.cpu, tape = this.tape, Media = global.C64Media;
    var len = ram[0xB7], ptr = ram[0xBB] | (ram[0xBC] << 8), name = [];
    for (var i = 0; i < len; i++) name.push(this.read((ptr + i) & 0xFFFF));
    var f = Media.findTapeFile(tape.image, tape.pos, name);
    if (!f && tape.pos > 0) f = Media.findTapeFile(tape.image, 0, name);
    if (!f) return false;                           // not the standard format: let the KERNAL try
    // header into the cassette buffer, like the KERNAL does (some loaders live there)
    var buf = ram[0xB2] | (ram[0xB3] << 8);
    if (buf < 0x0200 || buf > 0xFF00) buf = 0x033C;
    for (var h = 0; h < f.header.length && h < 192; h++) ram[buf + h] = f.header[h];
    var sa = ram[0xB9];
    var start = (f.type === 3 || sa !== 0) ? f.start : (ram[0xC3] | (ram[0xC4] << 8));
    var end = start;
    if (cpu.a === 0) for (var j = 0; j < f.data.length; j++) { ram[end & 0xFFFF] = f.data[j]; end++; }
    else end += f.data.length;
    end &= 0xFFFF;
    ram[0xAE] = end & 0xFF; ram[0xAF] = end >> 8;
    ram[0x90] = 0;
    cpu.x = end & 0xFF; cpu.y = end >> 8; cpu.c = 0; cpu.a = 0;
    // tape continues behind the program
    var el = 0, P2 = tape.image.pulses;
    for (var k = 0; k < f.end && k < P2.length; k++) el += P2[k];
    tape.pos = Math.min(f.end, P2.length - 1);
    tape.rem = P2[tape.pos] || 0;
    tape.elapsed = el;
    tape.playing = true; tape.update();
    if (this.onLoad) this.onLoad({ name: f.name });
    var lo = cpu.pull(), hi = cpu.pull();
    cpu.pc = (((hi << 8) | lo) + 1) & 0xFFFF;
    this.syncTo(this.clk + 200);
    return true;
  };

  // SAVE to the mounted disk image (fast loader mode only)
  P.handleSaveTrap = function () {
    var ram = this.ram, cpu = this.cpu, dev = ram[0xBA];
    if (!(dev >= 8 && dev <= 11 && this.disk && (!this.drive || this.drive.hle) && this.disk.saveFile)) return false;
    var len = ram[0xB7], ptr = ram[0xBB] | (ram[0xBC] << 8), name = [];
    for (var i = 0; i < len; i++) name.push(this.read((ptr + i) & 0xFFFF));
    var start = ram[0xC1] | (ram[0xC2] << 8), end = ram[0xAE] | (ram[0xAF] << 8);   // set by $FFD8 before the vector
    var data = [start & 0xFF, start >> 8];
    for (var a = start; a < end; a++) data.push(this.read(a & 0xFFFF));
    var ok = this.disk.saveFile(name, new Uint8Array(data));
    ram[0x90] = ok ? 0 : 0x83;
    cpu.c = ok ? 0 : 1;
    if (!ok) cpu.a = 0x1C;   // ?DISK FULL / write error shows as I/O error
    if (ok && this.onSave) this.onSave();
    var lo = cpu.pull(), hi = cpu.pull();
    cpu.pc = (((hi << 8) | lo) + 1) & 0xFFFF;
    this.syncTo(this.clk + 200);
    return true;
  };

  // Put a program straight into memory (PRG autostart)
  P.injectPrg = function (data) {
    var start = data[0] | (data[1] << 8), ram = this.ram;
    for (var i = 2; i < data.length; i++) ram[(start + i - 2) & 0xFFFF] = data[i];
    var end = (start + data.length - 2) & 0xFFFF;
    if (start === 0x0801) {
      // BASIC pointers: start of variables, arrays and end of arrays
      ram[0x2D] = ram[0x2F] = ram[0x31] = end & 0xFF;
      ram[0x2E] = ram[0x30] = ram[0x32] = end >> 8;
      ram[0xAE] = end & 0xFF; ram[0xAF] = end >> 8;
    }
    return { start: start, end: end };
  };

  // ---------------------------------------------------------------- snapshots
  P.saveState = function () {
    return {
      v: 1,
      ram: this.ram.slice(), colorRam: this.colorRam.slice(), ddr: this.ddr, port: this.port,
      cpu: this.cpu.saveState(), vic: this.vic.saveState(), sid: this.sid.saveState(),
      cia1: this.cia1.saveState(), cia2: this.cia2.saveState(), clk: this.clk, nmiSrc: this.nmiSrc,
      iec: Object.assign({}, this.iec), trapLoad: this.trapLoad,
      cart: this.cart && this.cart.saveState ? this.cart.saveState() : null,
      drive: this.drive ? this.drive.saveState() : null,
      tape: this.tape ? this.tape.saveState() : null
    };
  };
  P.loadState = function (s) {
    this.ram.set(s.ram); this.colorRam.set(s.colorRam);
    this.ddr = s.ddr; this.port = s.port;
    this.cpu.loadState(s.cpu); this.vic.loadState(s.vic); this.sid.loadState(s.sid);
    this.cia1.loadState(s.cia1); this.cia2.loadState(s.cia2);
    this.clk = s.clk; this.cycNow = s.clk; this.irqAt = 0; this.pollAt = s.clk; this.nmiSrc = s.nmiSrc; this.iec = Object.assign({}, s.iec); this.trapLoad = s.trapLoad;
    if (this.cart && s.cart && this.cart.loadState) this.cart.loadState(s.cart);
    if (this.drive && s.drive) this.drive.loadState(s.drive);
    if (this.tape && s.tape) this.tape.loadState(s.tape);
    this.cpu.irq = (this.cia1.irqOut ? 1 : 0) | (this.vic.irqOut ? 2 : 0) | (this.cart && this.cart.irq ? 4 : 0);
    this.cia2Changed();
    this.updateMap();
    this.typeQueue = [];
  };

  global.C64 = C64;
})(typeof window !== "undefined" ? window : globalThis);
