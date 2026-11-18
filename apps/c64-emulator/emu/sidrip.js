/* SID ripper: finds the music routine of a running program and builds a PSID file.
 *
 * 1. Search (about 2 s): every SID register write is traced back through the call
 *    stack (JSR frames, interrupts). The play routine is the outermost subroutine that
 *    leads to all SID writes and does nothing else with the hardware (no VIC, CIA or
 *    colour RAM writes, no joystick reads), so the game around it is left out.
 * 2. Footprint (about 3 s): every byte the play routine and its subroutines execute,
 *    read or write, and how often it is called per frame.
 * 3. Right after a call of the play routine returns, the memory of the player is taken
 *    as it is. The PSID file gets this memory plus a small init routine that restores
 *    the zero-page bytes, the SID registers and, for faster tunes, the CIA timer; the
 *    tune then goes on from that moment.
 *
 * Runs while the emulator runs (C64.runFrameDebug calls tracer.before/after).
 */
(function (global) {
  "use strict";

  var SEARCH_FRAMES = 100, FOOT_FRAMES = 150;
  var hex = function (v, n) { return ("000" + v.toString(16).toUpperCase()).slice(-n); };

  function Ripper(c64, onDone) {
    this.c64 = c64;
    this.onDone = onDone;
    this.stack = [];                 // { kind: "jsr" | "irq" | "nmi", target, s }
    this.phase = "search";
    this.frame0 = c64.vic.frame;
    this.paths = {};                 // "root>target>target" -> SID writes
    this.calls = {};                 // target -> number of JSR calls
    this.dirty = {};                 // target -> 1 when its call tree touches other hardware
    this.sidWrites = 0;
    this.play = -1;
    this.inPlay = 0;
    this.access = new Uint8Array(0x10000);   // bit 0 read, 1 write, 2 code; bit 3: read before any write
    this.playCalls = 0;
    this.result = null;
    this.ownDbg = false;
    var self = this;
    // memory hooks (wrapping what is there now, e.g. debugger watchpoints)
    this.prevRead = Object.prototype.hasOwnProperty.call(c64, "read") ? c64.read : null;
    this.prevWrite = Object.prototype.hasOwnProperty.call(c64, "write") ? c64.write : null;
    var rd = c64.read, wr = c64.write;
    c64.read = function (a) {
      var v = rd.call(c64, a);
      if (self.inPlay) self.noteRead(a);
      else if ((a & 0xFF00) === 0xDC00 && (a & 0x0F) < 2 && c64.io[0xD] === 1) self.markDirty();   // keyboard / joystick
      return v;
    };
    c64.write = function (a, v) {
      self.noteWrite(a);
      wr.call(c64, a, v);
    };
    if (!c64.dbg) { this.dummy = c64.dbg = global.C64.newDebugState(); c64.dbg.stopJam = false; this.ownDbg = true; }
    c64.tracer = this;
  }
  var P = Ripper.prototype;

  P.stop = function () {
    var c64 = this.c64;
    if (c64.tracer === this) c64.tracer = null;
    if (this.prevRead) c64.read = this.prevRead; else delete c64.read;
    if (this.prevWrite) c64.write = this.prevWrite; else delete c64.write;
    if (this.ownDbg && c64.dbg === this.dummy) c64.dbg = null;
  };

  P.progress = function () {
    var f = this.c64.vic.frame - this.frame0;
    return Math.min(1, f / (SEARCH_FRAMES + FOOT_FRAMES));
  };

  // ---------------------------------------------------------------- call stack
  P.before = function (cpu, intr, nmi, op) {
    this.sBefore = cpu.s; this.intr = intr; this.nmi = nmi; this.op = op; this.pc = cpu.pc;
    if (this.inPlay && !intr) {
      var len = global.C64Disasm.LENGTHS[op];
      for (var i = 0; i < len; i++) this.access[(cpu.pc + i) & 0xFFFF] |= 4;
    }
  };
  P.after = function (cpu) {
    var st = this.stack, op = this.op;
    if (this.intr) st.push({ kind: this.nmi ? "nmi" : "irq", target: cpu.pc, s: this.sBefore });
    else if (op === 0x20) {
      st.push({ kind: "jsr", target: cpu.pc, s: this.sBefore });
      this.calls[cpu.pc] = (this.calls[cpu.pc] || 0) + 1;
      if (cpu.pc === this.play) { this.inPlay++; if (this.phase === "foot") this.playCalls++; }
    } else if (op === 0x60 || op === 0x40 || op === 0x9A) {
      // RTS / RTI / TXS: drop the frames we have left
      while (st.length && st[st.length - 1].s <= cpu.s) {
        var f = st.pop();
        if (f.kind === "jsr" && f.target === this.play) {
          this.inPlay--;
          if (this.phase === "capture" && !this.inPlay) { this.capture(); return; }
        }
      }
      if (st.length > 64) st.splice(0, st.length - 64);
    }
    this.checkPhase();
  };
  P.checkPhase = function () {
    var f = this.c64.vic.frame - this.frame0;
    if (this.phase === "search" && f >= SEARCH_FRAMES) this.choosePlay();
    else if (this.phase === "foot" && f >= SEARCH_FRAMES + FOOT_FRAMES) this.phase = "capture";
    else if (this.phase === "capture" && f >= SEARCH_FRAMES + FOOT_FRAMES + 150) this.finish({ error: "The play routine was not called any more (did the music stop?)." });
  };

  P.markDirty = function () {
    var st = this.stack;
    for (var i = 0; i < st.length; i++) if (st[i].kind === "jsr") this.dirty[st[i].target] = 1;
  };

  // ---------------------------------------------------------------- memory accesses
  P.noteWrite = function (a) {
    var c64 = this.c64, io = a >= 0xD000 && a < 0xE000 && c64.io[0xD] === 1;
    if (io) {
      var sid = a < 0xD800 && a >= 0xD400 && (a & 0x1F) < 25;
      if (sid) {
        if (this.phase === "search") this.notePath();
        this.sidWrites++;
      } else if (this.phase === "search") this.markDirty();
      return;
    }
    if (this.inPlay && (a < 0x100 || a >= 0x200)) this.access[a] |= 2;
  };
  P.noteRead = function (a) {
    var c64 = this.c64;
    if (a >= 0x100 && a < 0x200) return;
    var p = a >> 12;
    if (c64.rmap[p] !== c64.ram && a >= 2) return;        // ROM or I/O
    var f = this.access[a];
    if (!(f & 6)) this.access[a] = f | 9;                  // read before written (or executed)
    else this.access[a] = f | 1;
  };
  P.notePath = function () {
    var st = this.stack, root = "main", start = 0;
    for (var i = st.length - 1; i >= 0; i--) if (st[i].kind !== "jsr") { root = st[i].kind; start = i + 1; break; }
    var key = root;
    for (var j = start; j < st.length; j++) key += ">" + st[j].target;
    this.paths[key] = (this.paths[key] || 0) + 1;
  };

  // ---------------------------------------------------------------- the play routine
  P.choosePlay = function () {
    var keys = Object.keys(this.paths);
    if (!keys.length) return this.finish({ error: "The SID was not written while searching. Is music playing?" });
    // the context (IRQ, NMI or main program) with the most SID writes
    var byRoot = {};
    keys.forEach(function (k) { var r = k.split(">")[0]; byRoot[r] = (byRoot[r] || 0) + this.paths[k]; }, this);
    var root = Object.keys(byRoot).sort(function (a, b) { return byRoot[b] - byRoot[a]; })[0];
    var mine = keys.filter(function (k) { return k.split(">")[0] === root; });
    var total = byRoot[root];
    // per depth: the target taking the most writes; walk down while it takes (almost) all of them
    var chain = [], covered = total;
    for (var depth = 1; depth < 16; depth++) {
      var count = {};
      mine.forEach(function (k) {
        var p = k.split(">");
        if (p.length > depth && (depth === 1 || p.slice(1, depth).join(">") === chain.join(">"))) count[p[depth]] = (count[p[depth]] || 0) + this.paths[k];
      }, this);
      var best = Object.keys(count).sort(function (a, b) { return count[b] - count[a]; })[0];
      if (best === undefined || count[best] < covered * 0.9) break;
      chain.push(best); covered = count[best];
    }
    if (!chain.length) {
      return this.finish({ error: "The SID is written directly in the " + (root === "main" ? "main program" : "interrupt routine") +
        ", not in a subroutine that could be called as a play routine." });
    }
    // the outermost routine of the chain that does nothing but music
    var pick = -1;
    for (var i = 0; i < chain.length; i++) if (!this.dirty[chain[i]]) { pick = +chain[i]; break; }
    if (pick < 0) pick = +chain[chain.length - 1];
    this.play = pick;
    this.root = root;
    this.share = covered / Math.max(1, this.sidWrites);
    this.phase = "foot";
    this.footFrame = this.c64.vic.frame;
    // already inside the play routine? count the frames on the stack
    var self = this;
    this.inPlay = this.stack.filter(function (f) { return f.kind === "jsr" && f.target === self.play; }).length;
  };

  // ---------------------------------------------------------------- capture and build
  P.capture = function () {
    var c64 = this.c64, acc = this.access, lo = 0x10000, hi = -1, low = [];
    for (var a = 2; a < 0x10000; a++) {
      if (!acc[a]) continue;
      if (a < 0x800) { if (a >= 0x200 || a < 0x100) low.push(a); continue; }
      if (a < lo) lo = a;
      if (a > hi) hi = a;
    }
    if (hi < 0) return this.finish({ error: "The play routine was found, but no memory it uses." });
    var frames = this.c64.vic.frame - this.footFrame;
    var rate = this.playCalls / Math.max(1, frames);
    var ram = c64.ram;
    // music data often reaches past what a few seconds of playing touch: go on to the end
    // of the block (until 512 equal bytes), at most 8 KB further and not into the I/O area
    var limit = Math.min(hi + 0x2000, hi < 0xD000 ? 0xCFFF : 0xFFF0), end = hi;
    for (var e = hi + 1; e <= limit; e++) {
      var same = true;
      for (var k = 1; k < 512 && e + k <= limit; k++) if (ram[e + k] !== ram[e]) { same = false; break; }
      if (same) break;
      end = e;
    }
    var start = lo & 0xFF00;
    if (start < 0x800) start = 0x800;
    // init: restore the zero page and low-memory bytes, the SID registers and the timer
    var code = [];
    function sta(addr) { if (addr < 0x100) code.push(0x85, addr); else code.push(0x8D, addr & 0xFF, addr >> 8); }
    low.forEach(function (a2) { if (a2 !== 0 && a2 !== 1) { code.push(0xA9, ram[a2]); sta(a2); } });
    var sid = c64.sid.regs;
    for (var r = 0; r < 25; r++) { code.push(0xA9, sid[r]); sta(0xD400 + r); }
    var cia = Math.abs(rate - 1) > 0.15 && rate > 0.3;
    var latch = cia ? Math.round(global.C64.CYCLES_PER_FRAME / rate) - 1 : 0;
    if (cia) { code.push(0xA9, latch & 0xFF); sta(0xDC04); code.push(0xA9, latch >> 8); sta(0xDC05); code.push(0xA9, 0x11); sta(0xDC0E); }
    code.push(0x60);
    var initAt, dataStart = start, dataEnd = end;
    if (end + code.length < (end < 0xD000 ? 0xD000 : 0xFFFA)) { initAt = end + 1; dataEnd = end + code.length; }
    else if (start - code.length >= 0x800) { initAt = start - code.length; dataStart = initAt; }
    else return this.finish({ error: "There is no free space around the music for the init routine." });
    var data = new Uint8Array(dataEnd - dataStart + 1);
    for (var b = dataStart; b <= dataEnd; b++) data[b - dataStart] = ram[b];
    data.set(code, initAt - dataStart);
    this.finish({
      play: this.play, init: initAt, load: dataStart, end: dataEnd, data: data, rate: rate, cia: cia, latch: latch,
      root: this.root, share: this.share, zp: low.length, used: [lo, hi], size: data.length, sidModel: c64.sid.model
    });
  };

  P.finish = function (res) {
    this.phase = "done";
    this.result = res;
    this.stop();
    if (this.onDone) this.onDone(res);
  };

  // ---------------------------------------------------------------- PSID file (version 2)
  function psid(res, info) {
    var head = new Uint8Array(0x7C), data = res.data;
    function w16(o, v) { head[o] = (v >> 8) & 0xFF; head[o + 1] = v & 0xFF; }
    function str(o, s) { for (var i = 0; i < 32 && i < s.length; i++) head[o + i] = s.charCodeAt(i) & 0xFF; }
    head.set([0x50, 0x53, 0x49, 0x44]);          // "PSID"
    w16(4, 2); w16(6, 0x7C); w16(8, 0);           // version, data offset, load address in the data
    w16(0x0A, res.init); w16(0x0C, res.play);
    w16(0x0E, 1); w16(0x10, 1);                    // one song
    head[0x15] = res.cia ? 1 : 0;                  // speed: CIA timer or 50 Hz screen
    str(0x16, info.name || ""); str(0x36, info.author || ""); str(0x56, info.released || "");
    w16(0x76, 0x04 | (res.sidModel === 8580 ? 0x20 : 0x10));   // PAL, SID model
    var out = new Uint8Array(0x7C + 2 + data.length);
    out.set(head);
    out[0x7C] = res.load & 0xFF; out[0x7D] = res.load >> 8;
    out.set(data, 0x7E);
    return out;
  }

  global.C64SidRip = {
    start: function (c64, onDone) { return new Ripper(c64, onDone); },
    psid: psid,
    describe: function (res) {
      return "play $" + hex(res.play, 4) + ", init $" + hex(res.init, 4) + ", $" + hex(res.load, 4) + "–$" + hex(res.end, 4);
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
