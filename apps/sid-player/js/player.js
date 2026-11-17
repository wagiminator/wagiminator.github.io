/* SID Player: the playback machine. A complete C64 (CPU, VIC-II, CIAs, Open ROMs) from the
 * C64 emulator runs the tune; up to three SIDs are mapped into the I/O area. PSID tunes get
 * their init and play routines called like SIDPLAY does; RSID tunes run in a real C64
 * environment with their own interrupts. Besides the sound, the player records the SID
 * registers of every tick for the analysis views.
 */
(function (global) {
  "use strict";

  var C64 = global.C64, SID = global.SID6581, PSID = global.PSID;
  var PAL = 985248, NTSC = 1022727;
  var TRAP = 0xFFF0;                 // return address of init/play: the CPU idles here

  function Player(rate) {
    this.rate = rate || 44100;
    var c = (this.c64 = new C64(global.C64_OPEN_ROMS));
    // boot once to the READY prompt and keep that state: every tune starts from it
    for (var i = 0; i < 170; i++) c.runFrame();
    c.sid.takeSamples();
    this.boot = c.saveState();
    c.vic.noGfx = true;           // the player needs the VIC timing, not its picture
    this.sids = [c.sid];
    this.tune = null;
    this.models = [6581];
    this.history = [];            // ticks: { sample, regs: [Uint8Array(25) per SID], gates, writes }
    this.maxHistory = 6000;
    this.produced = 0;            // samples handed out so far
    this.cycDebt = 0;
    this.mute = [0, 0, 0];
    this.jammed = false;
    var self = this;
    // route writes and reads of the extra SIDs; count register writes for the analysis
    var ioW = c.ioWrite.bind(c), ioR = c.ioRead.bind(c);
    c.ioWrite = function (a, v) {
      var k = self.sidIndex(a);
      if (k >= 0) {
        c.syncIO();
        var s = self.sids[k];
        s.clockTo(c.clk);
        var r = a & 0x1F;
        if (r < 21 && r % 7 === 4 && (v & 1) && !(s.regs[r] & 1)) self.gateRise[k] |= 1 << ((r / 7) | 0);
        self.writes[k]++;
        s.write(a, v);
        return;
      }
      ioW(a, v);
    };
    c.ioRead = function (a) {
      var k = self.sidIndex(a);
      if (k >= 0) { c.syncIO(); self.sids[k].clockTo(c.clk); return self.sids[k].read(a); }
      return ioR(a);
    };
    this.gateRise = [0, 0, 0];
    this.writes = [0, 0, 0];
  }
  var P = Player.prototype;

  // Which SID (0..2) answers at this address, or -1
  P.sidIndex = function (a) {
    if (a < 0xD400 || (a >= 0xD800 && a < 0xDE00)) return -1;
    var addr = this.addrs || [0xD400];
    for (var k = addr.length - 1; k > 0; k--) if ((a & 0xFFE0) === addr[k]) return k;
    return a < 0xD800 ? 0 : -1;               // the first SID is mirrored in $D400-$D7FF
  };

  P.setRate = function (rate) {
    this.rate = rate;
    this.sids.forEach(function (s) { s.setSampleRate(rate); });
  };
  // model: "auto", 6581 or 8580
  P.setModel = function (model) {
    this.modelPref = model;
    var t = this.tune;
    for (var k = 0; k < this.sids.length; k++) {
      var m = model === "auto" ? (t && t.models[k] === 2 ? 8580 : 6581) : +model;
      this.sids[k].setModel(m);
      this.models[k] = m;
    }
  };
  P.setMute = function (chip, mask) { this.mute[chip] = mask; if (this.sids[chip]) this.sids[chip].mute = mask; };

  // Start song n (1 based) of a parsed tune
  P.start = function (tune, n) {
    var c = this.c64;
    this.tune = tune;
    this.song = n || tune.startSong;
    c.loadState(this.boot);
    // the state brings the clock back to the boot time; the instruction start must follow,
    // or the first I/O access of the player runs the machine up to the old time
    c.instrStart = c.clk; c.pollAt = c.clk; c.cpu.cyc = 0;
    this.clock = tune.clock === 2 ? NTSC : PAL;
    this.addrs = tune.sidAddr.slice();
    // fresh SIDs, clocked like the tune expects
    this.sids = [];
    for (var k = 0; k < this.addrs.length; k++) {
      var s = new SID(this.clock, this.rate);
      s.clk = c.clk;
      s.mute = this.mute[k] || 0;
      this.sids.push(s);
    }
    c.sid = this.sids[0];
    this.setModel(this.modelPref || "auto");
    this.history = [];
    this.produced = 0; this.cycDebt = 0;
    this.gateRise = [0, 0, 0]; this.writes = [0, 0, 0];
    this.jammed = false;
    this.ticks = 0;
    var ram = c.ram, cpu = c.cpu;
    ram.set(tune.data, tune.load);
    var cia = PSID.songUsesCia(tune, this.song);
    this.frameCycles = tune.clock === 2 ? 263 * 65 : 312 * 63;
    if (tune.basic) {
      // a BASIC program: set the end of the program and RUN it
      var end = tune.load + tune.data.length;
      ram[0x2D] = ram[0x2F] = ram[0x31] = end & 0xFF;
      ram[0x2E] = ram[0x30] = ram[0x32] = end >> 8;
      ram[0x030C] = this.song - 1;              // the song number for the program (A register on SYS)
      c.type("RUN\r");
      this.mode = "basic";
    } else if (tune.rsid) {
      // a real C64 environment: the KERNAL interrupt keeps running
      this.call(tune.init, this.song - 1);
      this.mode = "rsid";
    } else {
      // PSID: no interrupt sources of their own, init and play are called by the player
      this.bank = tune.end < 0xA000 ? 0x37 : tune.end < 0xD000 ? 0x36 : tune.load >= 0xE000 ? 0x35 : 0x34;
      if (tune.load < 0xD000 && tune.end >= 0xD000 && tune.end < 0xE000) this.bank = 0x34;
      if (tune.play) {
        c.write(0xDC0D, 0x7F); c.read(0xDC0D);
        c.write(0xD01A, 0); c.write(0xD019, 0xFF);
        cpu.irq = 0;
      }
      c.write(1, this.bank);
      this.call(tune.init, this.song - 1);
      this.mode = tune.play ? "psid" : "psid-irq";
      this.cia = cia;
    }
    this.initDone = false;
    this.nextTick = c.clk + this.frameCycles;
    this.period = this.frameCycles;
    this.started = c.clk;
  };

  // Call a routine as a subroutine of the player: it returns to TRAP
  P.call = function (addr, a) {
    var cpu = this.c64.cpu;
    var ret = TRAP - 1;
    cpu.push(ret >> 8); cpu.push(ret & 0xFF);
    cpu.pc = addr; cpu.a = a & 0xFF; cpu.x = 0; cpu.y = 0;
    cpu.i = 1; cpu.pollI = 1;
  };

  // Run the machine for a number of CPU cycles
  P.runCycles = function (n) {
    var c = this.c64, cpu = c.cpu, vic = c.vic, end = c.clk + n;
    while (c.clk < end) {
      // the player's own timer: call play, and record a tick for the analysis
      if (c.clk >= this.nextTick) this.tick();
      if (cpu.pc === TRAP) {
        // idle: like a JMP * loop; an interrupt is taken once a poll could have seen it
        if (!this.initDone) this.afterInit();
        var take = cpu.nmiPending || (cpu.irq && !cpu.i && c.irqAt <= c.clk - 2);
        if (!take) {
          c.syncTo(Math.min(end, c.clk + (cpu.irq && !cpu.i ? 1 : 4), this.nextTick));
          this.frameTasks();
          continue;
        }
        c.instrStart = c.clk;
        cpu.irqHold = false; cpu.pollI = 0;
        var ki = cpu.step();
        c.pollAt = c.instrStart + ki - 2;
        c.syncTo(c.instrStart + ki);
        this.frameTasks();
        continue;
      }
      if (vic.baNow()) { c.syncTo(c.clk + 1); this.frameTasks(); continue; }
      c.instrStart = c.clk;
      cpu.irqHold = cpu.irq !== 0 && c.irqAt > c.pollAt;
      var k = cpu.step();
      c.pollAt = c.instrStart + k - 2;
      c.syncTo(c.instrStart + k);
      this.frameTasks();
      if (cpu.jammed) { this.jammed = true; cpu.jammed = false; cpu.pc = TRAP; cpu.i = 1; }
    }
    for (var s = 0; s < this.sids.length; s++) this.sids[s].clockTo(c.clk);
  };
  P.frameTasks = function () {
    var c = this.c64;
    if (!c.vic.frameDone) return;
    c.vic.frameDone = false;
    c.cia1.todTick(); c.cia2.todTick();
    c.frameTasks();
  };
  P.afterInit = function () {
    var c = this.c64, cpu = c.cpu;
    this.initDone = true;
    if (this.mode === "psid") {
      if (this.cia) {
        var latch = c.cia1.latchA;
        this.period = latch > 0x100 ? latch + 1 : 0x4025 + 1;
      } else this.period = this.frameCycles;
      this.nextTick = c.clk;              // first play call right away
    } else {
      cpu.i = 0; cpu.pollI = 0;           // own interrupts: idle with interrupts enabled
    }
  };
  P.tick = function () {
    var c = this.c64, cpu = c.cpu;
    // remember the register state of the last tick
    var regs = [], k;
    for (k = 0; k < this.sids.length; k++) {
      var s = this.sids[k];
      s.clockTo(c.clk);
      var r = new Uint8Array(29);
      r.set(s.regs.subarray(0, 25));
      r[25] = s.v[0].env; r[26] = s.v[1].env; r[27] = s.v[2].env; r[28] = this.writes[k] > 255 ? 255 : this.writes[k];
      regs.push(r);
    }
    this.history.push({ sample: this.produced + this.sids[0].outLen, regs: regs, gates: this.gateRise.slice(), n: this.ticks++ });
    if (this.history.length > this.maxHistory) this.history.splice(0, this.history.length - this.maxHistory);
    this.gateRise = [0, 0, 0]; this.writes = [0, 0, 0];
    if (this.mode === "psid" && this.initDone) {
      if (cpu.pc === TRAP) {
        c.write(1, this.bank);
        this.call(this.tune.play, 0);
      }
      this.nextTick += this.period;
    } else {
      this.nextTick += this.frameCycles;
    }
    if (this.nextTick <= c.clk) this.nextTick = c.clk + 1;
  };

  // Produce about n samples: returns { mix, voices: [[v1,v2,v3] per SID] }
  P.render = function (n) {
    var cps = this.clock / this.rate;
    var want = n * cps + this.cycDebt;
    var cyc = Math.floor(want);
    this.cycDebt = want - cyc;
    this.runCycles(cyc);
    var outs = this.sids.map(function (s) { return s.takeSamples(); });
    var len = outs[0].length, mix = new Float32Array(len), g = this.sids.length > 1 ? 0.7 / this.sids.length : 0.8;
    for (var k = 0; k < outs.length; k++) {
      var o = outs[k], m = Math.min(len, o.length);
      for (var i = 0; i < m; i++) mix[i] += o[i] * g;
    }
    this.produced += len;
    return { mix: mix, voices: this.sids.map(function (s) { return s.lastVoices; }) };
  };

  // The CPU clock of the tune and the time played so far
  P.seconds = function () { return this.produced / this.rate; };

  Player.PAL = PAL; Player.NTSC = NTSC;
  global.SIDPlayer = Player;
})(typeof window !== "undefined" ? window : globalThis);
