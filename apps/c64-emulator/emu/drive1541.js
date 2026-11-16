/* Commodore 1541 floppy drive, emulated down to the disk surface:
 * 6502 with 2 KB RAM and the 16 KB DOS ROM, two 6522 VIAs (serial bus and disk
 * controller), stepper motor with half tracks, and a bit-level GCR read head
 * with SYNC detection and BYTE READY on the CPU's SO pin. Writes go back into
 * the GCR track data. Needs the original DOS ROM (not distributable).
 */
(function (global) {
  "use strict";

  var DRIVE_CLOCK = 1000000;
  var BIT_TIME = [4, 3.75, 3.5, 3.25];          // cycles per bit for speed zones 0..3

  // ------------------------------------------------------------------ 6522 VIA
  function VIA(name) {
    this.name = name;
    this.readPA = function () { return 0xFF; };
    this.readPB = function () { return 0xFF; };
    this.onWrite = function () {};
    this.onIrq = function () {};
    this.reset();
  }
  var V = VIA.prototype;
  V.reset = function () {
    this.ora = 0; this.orb = 0; this.ddra = 0; this.ddrb = 0;
    this.t1 = 0xFFFF; this.t1latch = 0xFFFF; this.t1armed = false;
    this.t2 = 0xFFFF; this.t2latchLo = 0xFF; this.t2armed = false;
    this.sr = 0; this.acr = 0; this.pcr = 0; this.ifr = 0; this.ier = 0;
    this.ca1 = 0; this.irqOut = 0;
    this.pa = 0xFF;   // latched input
  };
  V.updateIrq = function () {
    var l = (this.ifr & this.ier & 0x7F) ? 1 : 0;
    if (l !== this.irqOut) { this.irqOut = l; this.onIrq(l); }
  };
  V.setCA1 = function (level) {
    level = level ? 1 : 0;
    if (level === this.ca1) return;
    var pos = this.pcr & 0x01;
    if ((pos && level) || (!pos && !level)) { this.ifr |= 0x02; this.updateIrq(); }
    this.ca1 = level;
  };
  V.tick = function (n) {
    this.t1 -= n;
    if (this.t1 < 0) {
      if (this.t1armed) {
        this.ifr |= 0x40; this.updateIrq();
        if (!(this.acr & 0x40)) this.t1armed = false;
      }
      if (this.acr & 0x40) { var per = this.t1latch + 2; while (this.t1 < 0) this.t1 += per; }
      else this.t1 += 0x10000;
    }
    if (!(this.acr & 0x20)) {
      this.t2 -= n;
      if (this.t2 < 0) {
        if (this.t2armed) { this.ifr |= 0x20; this.updateIrq(); this.t2armed = false; }
        this.t2 += 0x10000;
      }
    }
  };
  V.read = function (r) {
    switch (r & 0x0F) {
      case 0x0: this.ifr &= ~0x18; this.updateIrq();
        return ((this.orb & this.ddrb) | (this.readPB() & ~this.ddrb)) & 0xFF;
      case 0x1: this.ifr &= ~0x03; this.updateIrq();
      /* falls through */
      case 0xF: return ((this.ora & this.ddra) | (this.readPA() & ~this.ddra)) & 0xFF;
      case 0x2: return this.ddrb;
      case 0x3: return this.ddra;
      case 0x4: this.ifr &= ~0x40; this.updateIrq(); return this.t1 & 0xFF;
      case 0x5: return (this.t1 >> 8) & 0xFF;
      case 0x6: return this.t1latch & 0xFF;
      case 0x7: return this.t1latch >> 8;
      case 0x8: this.ifr &= ~0x20; this.updateIrq(); return this.t2 & 0xFF;
      case 0x9: return (this.t2 >> 8) & 0xFF;
      case 0xA: return this.sr;
      case 0xB: return this.acr;
      case 0xC: return this.pcr;
      case 0xD: return this.ifr | (this.irqOut ? 0x80 : 0);
      case 0xE: return this.ier | 0x80;
    }
    return 0xFF;
  };
  V.write = function (r, v) {
    switch (r & 0x0F) {
      case 0x0: this.orb = v; this.ifr &= ~0x18; this.updateIrq(); this.onWrite(); break;
      case 0x1: this.ifr &= ~0x03; this.updateIrq();
      /* falls through */
      case 0xF: this.ora = v; this.onWrite(); break;
      case 0x2: this.ddrb = v; this.onWrite(); break;
      case 0x3: this.ddra = v; this.onWrite(); break;
      case 0x4: case 0x6: this.t1latch = (this.t1latch & 0xFF00) | v; break;
      case 0x5:
        this.t1latch = (this.t1latch & 0x00FF) | (v << 8);
        this.t1 = this.t1latch + 1; this.t1armed = true;
        this.ifr &= ~0x40; this.updateIrq();
        break;
      case 0x7: this.t1latch = (this.t1latch & 0x00FF) | (v << 8); this.ifr &= ~0x40; this.updateIrq(); break;
      case 0x8: this.t2latchLo = v; break;
      case 0x9:
        this.t2 = (this.t2latchLo | (v << 8)) + 1; this.t2armed = true;
        this.ifr &= ~0x20; this.updateIrq();
        break;
      case 0xA: this.sr = v; break;
      case 0xB: this.acr = v; break;
      case 0xC: this.pcr = v; this.onWrite(); break;
      case 0xD: this.ifr &= ~v & 0x7F; this.updateIrq(); break;
      case 0xE:
        if (v & 0x80) this.ier |= v & 0x7F; else this.ier &= ~v & 0x7F;
        this.updateIrq();
        break;
    }
  };
  V.saveState = function () {
    var o = {}; for (var k in this) if (Object.prototype.hasOwnProperty.call(this, k) && typeof this[k] !== "function") o[k] = this[k];
    return o;
  };
  V.loadState = function (o) { for (var k in o) this[k] = o[k]; };

  // ------------------------------------------------------------------ drive
  function Drive1541(c64, rom) {
    var self = this;
    this.c64 = c64;
    this.hle = !rom;                      // no DOS ROM: virtual drive (see below)
    this.rom = rom || stubRom();          // 16 KB
    this.ram = new Uint8Array(0x800);
    this.cpu = new global.CPU6502(this);
    this.via1 = new VIA("VIA1");
    this.via2 = new VIA("VIA2");
    this.via1.onIrq = function (l) { if (l) self.cpu.irq |= 1; else self.cpu.irq &= ~1; };
    this.via2.onIrq = function (l) { if (l) self.cpu.irq |= 2; else self.cpu.irq &= ~2; };
    this.via1.readPB = function () { return self.via1PB(); };
    this.via2.readPB = function () { return self.via2PB(); };
    this.via2.readPA = function () { return self.readLatch; };
    this.via2.onWrite = function () { self.via2Changed(); };
    this.disk = null;
    this.ratio = DRIVE_CLOCK / global.C64.CLOCK;
    this.onLed = null;
    this.reset();
  }
  var D = Drive1541.prototype;

  D.reset = function () {
    this.ram.fill(0);
    this.via1.reset(); this.via2.reset();
    this.cpu.irq = 0;
    this.cpu.reset();
    this.halfTrack = 36;                  // track 18
    this.bitPos = 0;
    this.bitAcc = 0;
    this.shift = 0; this.ones = 0; this.bitCount = 0;
    this.readLatch = 0;
    this.sync = false;
    this.motor = false; this.led = false;
    this.phase = 0;
    this.writeMode = false;
    this.soe = true;
    this.clk = 0;
    if (this.hle) {
      // what the DOS would have set up
      this.via1.ddrb = 0x1A; this.via1.orb = 0x00;
      this.via2.ddrb = 0x6F; this.via2.orb = 0x00;
      this.via2.pcr = 0xEE;
      this.via2Changed();
      this.hleReset();
    }
  };
  D.syncBase = function (c64clk) { this.base = c64clk; this.clk = 0; };

  D.insert = function (disk) { this.disk = disk; this.bitPos = 0; };
  D.eject = function () { this.disk = null; };

  // ---- memory
  D.read = function (a) {
    if (a < 0x1800) return this.ram[a & 0x7FF];
    if (a < 0x1C00) return this.via1.read(a);
    if (a < 0x2000) return this.via2.read(a);
    if (a >= 0x8000) return this.rom[a & 0x3FFF];
    return a >> 8;
  };
  D.write = function (a, v) {
    if (a < 0x1800) this.ram[a & 0x7FF] = v;
    else if (a < 0x1C00) this.via1.write(a, v);
    else if (a < 0x2000) this.via2.write(a, v);
  };

  // ---- serial bus
  D.busOut = function () {
    if (this.hle && this.idle()) return { clk: this.oClk, data: this.oData };
    var v = this.via1, out = (v.orb | ~v.ddrb) & 0xFF;
    var atna = (out >> 4) & 1;
    return { clk: (out >> 3) & 1, data: ((out >> 1) & 1) | (atna ^ this.c64.iec.atn) };
  };
  D.busChanged = function () {
    this.via1.setCA1(this.c64.iec.atn);
  };
  D.via1PB = function () {
    var iec = this.c64.iec, own = this.busOut();
    var dataLow = iec.data | own.data, clkLow = iec.clk | own.clk;
    // bit 0 DATA in, bit 2 CLK in, bit 7 ATN in (1 = line low); device 8: bits 5/6 = 0
    return (dataLow ? 0x01 : 0) | (clkLow ? 0x04 : 0) | (iec.atn ? 0x80 : 0) | 0x1A;
  };

  // ---- disk controller (VIA2)
  D.via2PB = function () {
    var wp = this.disk && this.disk.writeProtect ? 0 : 0x10;
    return (this.sync ? 0 : 0x80) | wp | 0x6F;
  };
  D.via2Changed = function () {
    var v = this.via2, out = (v.orb | ~v.ddrb) & 0xFF;
    // stepper motor
    var ph = out & 3;
    if (ph !== this.phase) {
      var old = this.halfTrack;
      if (ph === ((this.phase + 1) & 3) && this.halfTrack < 83) this.halfTrack++;
      else if (ph === ((this.phase - 1) & 3) && this.halfTrack > 2) this.halfTrack--;
      this.phase = ph;
      if (old !== this.halfTrack) this.trackChanged(old);
    }
    this.motor = !!(out & 0x04);
    var led = !!(out & 0x08);
    if (led !== this.led) { this.led = led; if (this.onLed) this.onLed(led); }
    this.zone = (out >> 5) & 3;
    // PCR: CA2 = SO enable, CB2 = read (high) / write (low)
    var pcr = v.pcr;
    this.soe = (pcr & 0x0E) !== 0x0C;
    this.writeMode = (pcr & 0xE0) === 0xC0;
  };
  D.trackChanged = function (old) {
    var a = this.track(old), b = this.track(this.halfTrack);
    if (a && b) this.bitPos = Math.floor(this.bitPos * b.length / a.length) % (b.length * 8);
    else this.bitPos = 0;
  };
  D.track = function (ht) {
    return this.disk ? (this.disk.gcr[ht] || null) : null;
  };

  // Advance the disk by one bit
  D.bit = function (tr) {
    var len = tr.length * 8;
    var pos = this.bitPos;
    if (this.writeMode) {
      if (++this.bitCount >= 8) {
        this.bitCount = 0;
        var v = this.via2, byte = (v.ora | ~v.ddra) & 0xFF;
        var bi = (pos >> 3) % tr.length;
        if (!this.disk.writeProtect) { tr[bi] = byte; this.disk.dirty = true; }
        this.byteReady();
      }
      this.sync = false;
    } else {
      var b = (tr[pos >> 3] >> (7 - (pos & 7))) & 1;
      this.shift = ((this.shift << 1) | b) & 0x3FF;
      if (b) this.ones++; else this.ones = 0;
      if (this.ones >= 10) {
        this.sync = true;
        this.bitCount = 0;
      } else {
        if (this.sync && !b) { this.sync = false; this.bitCount = 0; }
        if (++this.bitCount >= 8) {
          this.bitCount = 0;
          this.readLatch = this.shift & 0xFF;
          this.byteReady();
        }
      }
    }
    pos++;
    if (pos >= len) pos = 0;
    this.bitPos = pos;
  };
  D.byteReady = function () {
    if (this.soe) this.cpu.v = 1;
    this.via2.setCA1(0); this.via2.setCA1(1);
  };

  D.runTo = function (c64clk) {
    var target = (c64clk - (this.base || 0)) * this.ratio;
    var cpu = this.cpu, v1 = this.via1, v2 = this.via2;
    if (this.hle) {
      if (this.idle()) { this.hleBus(c64clk); this.clk = target; return; }
      this.hleRunning = true;
    }
    while (this.clk < target) {
      if (this.hle) {
        if (this.idle()) { this.codeDone(c64clk); this.clk = target; return; }
        this.checkJobs();
      }
      var n = cpu.step();
      this.clk += n;
      v1.tick(n); v2.tick(n);
      if (this.motor) {
        var tr = this.track(this.halfTrack);
        if (tr) {
          this.bitAcc += n;
          var bt = BIT_TIME[this.zone || 0];
          while (this.bitAcc >= bt) { this.bitAcc -= bt; this.bit(tr); }
        } else this.sync = false;
      }
    }
  };

  D.saveState = function () {
    return { ram: Array.from(this.ram), cpu: this.cpu.saveState(), via1: this.via1.saveState(), via2: this.via2.saveState(),
      halfTrack: this.halfTrack, bitPos: this.bitPos, phase: this.phase, motor: this.motor, zone: this.zone, clk: this.clk, base: this.base };
  };
  D.loadState = function (o) {
    this.ram.set(o.ram); this.cpu.loadState(o.cpu); this.via1.loadState(o.via1); this.via2.loadState(o.via2);
    this.halfTrack = o.halfTrack; this.bitPos = o.bitPos; this.phase = o.phase; this.motor = o.motor; this.zone = o.zone;
    this.clk = o.clk; this.base = o.base;
    this.via2Changed();
  };

  // ==================================================================
  // Virtual drive (no DOS ROM). The serial bus protocol (listener and
  // talker, ATN commands), the command channel (M-W, M-R, M-E, U3-U8, UI,
  // status), file channels for LOAD/SAVE/OPEN and the DOS job queue are done
  // in JavaScript. Code uploaded with M-W and started with M-E runs on the
  // emulated 1541 hardware (CPU, VIAs, disk), so drive-based fast loaders work.
  // ==================================================================
  var IDLE = 0xFF00;
  function stubRom() {
    var r = new Uint8Array(0x4000).fill(0xEA);
    r.set([0x4C, 0x00, 0xFF], 0x3F00);            // $FF00: JMP $FF00 (idle loop)
    r[0x3F10] = 0x40;                             // $FF10: RTI
    r.set([0x10, 0xFF, 0x00, 0xFF, 0x10, 0xFF], 0x3FFA);
    return r;
  }
  var ST_OK = "00, OK,00,00\r";

  D.idle = function () { var pc = this.cpu.pc; return pc >= IDLE && pc < IDLE + 3; };

  D.hleReset = function () {
    this.oClk = 0; this.oData = 0;
    this.st = "idle"; this.atnSeen = false;
    this.listening = false; this.talking = false; this.sa = 0; this.saCmd = 0;
    this.chan = {};
    this.cmd = [];
    this.openName = null;
    this.status = "73,CBM DOS V2.6 1541,00,00\r";
    this.statusBytes = null;
    this.pendingExec = -1;
    this.jobT = [0, 0, 0, 0, 0, 0];
    this.hleRunning = false;
    this.jobsDone = 0;
    this.headTrack = 18;
  };

  D.setStatus = function (code, text, t, s) {
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    this.status = pad(code) + "," + text + "," + pad(t || 0) + "," + pad(s || 0) + "\r";
    this.statusBytes = null;
  };

  // drive code returned (RTS to the idle loop)
  D.codeDone = function (now) {
    this.hleRunning = false;
    this.oClk = 0; this.oData = 0;
    this.st = this.c64.iec.atn ? "atn" : "idle";
    if (this.led && this.onLed) { this.led = false; this.onLed(false); }
    this.hleBus(now);
  };

  D.execute = function (addr) {
    var cpu = this.cpu;
    cpu.s = 0xFF;
    cpu.push((IDLE - 1) >> 8); cpu.push((IDLE - 1) & 0xFF);
    cpu.pc = addr & 0xFFFF;
    cpu.i = 0;
    this.oClk = 0; this.oData = 0;
    this.st = "idle";
    this.hleRunning = true;
    this.jobsDone = 0;
  };

  // ---- DOS job queue ($00-$05 job codes, $06/$07... track/sector, buffers at $0300)
  var ERR_JOB = { 20: 2, 21: 3, 22: 4, 23: 5, 27: 9, 29: 11 };
  D.checkJobs = function () {
    var ram = this.ram;
    for (var n = 0; n < 6; n++) {
      var j = ram[n];
      if (!(j & 0x80)) { this.jobT[n] = 0; continue; }
      if (!this.jobT[n]) {
        // realistic duration: half a revolution on average, more for the first job and head steps
        var t = ram[6 + 2 * n], dt = this.jobsDone ? 20000 : 100000;
        if (t && this.headTrack) dt += Math.abs(t - this.headTrack) * 12000;
        this.jobT[n] = this.clk + dt;
        if (this.onLed && !this.led) { this.led = true; this.onLed(true); }
        continue;
      }
      if (this.clk < this.jobT[n]) continue;
      this.jobT[n] = 0;
      ram[n] = this.doJob(n, j & 0xF0);
      this.jobsDone++;
      if (ram[6 + 2 * n]) { this.headTrack = ram[6 + 2 * n]; this.halfTrack = this.headTrack * 2; }
    }
  };
  D.doJob = function (n, job) {
    var d = this.disk, ram = this.ram;
    if (!d || !d.sectors) return 0x0F;                          // drive not ready
    var t = ram[6 + 2 * n], s = ram[7 + 2 * n], buf = 0x300 + 0x100 * n;
    if (job === 0xB0 || job === 0xC0) return 1;                  // seek, bump
    var sec = d.sector(t, s);
    if (!sec) return 2;                                          // header block not found
    if (d.errors) {
      var idx = d.offset(t, s) >> 8, e = d.errors[idx];
      if (ERR_JOB[e] && job !== 0x90) return ERR_JOB[e];
    }
    if (job === 0x80 || job === 0xA0) {
      if (buf + 256 <= 0x800) ram.set(sec, buf);
      return 1;
    }
    if (job === 0x90) {
      if (d.writeProtect) return 8;
      if (buf + 256 <= 0x800) sec.set(ram.subarray(buf, buf + 256));
      d.dirty = true; d.readFiles(); d.gcrStale = true;
      return 1;
    }
    return 1;                                                    // execute jobs are not supported
  };

  // ---- serial bus protocol (times in C64 cycles)
  D.hleBus = function (now) {
    var iec = this.c64.iec;
    // ATN starts a command sequence at any time
    if (iec.atn && !this.atnSeen) {
      this.atnSeen = true;
      this.oData = 1; this.oClk = 0;
      this.underAtn = true;
      this.st = "rAtn";
    } else if (!iec.atn && this.atnSeen) {
      this.atnSeen = false;
      this.underAtn = false;
      this.atnDone(now);
    }
    for (var guard = 0; guard < 4; guard++) {
      var st = this.st;
      this.step(now);
      if (this.st === st) break;
    }
  };

  D.step = function (now) {
    var iec = this.c64.iec;
    switch (this.st) {
      // -------- listener
      case "rAtn":                            // ATN: wait until the C64 pulls CLK
        if (iec.clk) this.st = "rReady";
        break;
      case "rReady":                          // wait until the talker is ready to send
        if (!iec.clk) { this.oData = 0; this.t = now; this.eoi = false; this.st = "rWait"; }
        break;
      case "rWait":                           // wait for the first bit (or signal EOI)
        if (iec.clk) { this.bits = 0; this.byte = 0; this.st = "rBitHi"; }
        else if (!this.eoi && now - this.t > 200) { this.oData = 1; this.t = now; this.st = "rEoi"; }
        break;
      case "rEoi":
        if (now - this.t >= 60) { this.oData = 0; this.eoi = true; this.st = "rWait"; }
        break;
      case "rBitHi":
        if (!iec.clk) {
          if (!iec.data) this.byte |= 1 << this.bits;
          this.bits++;
          this.st = "rBitLo";
        }
        break;
      case "rBitLo":
        if (iec.clk) {
          if (this.bits >= 8) {
            this.oData = 1;                  // frame handshake
            this.st = "rReady";
            this.received(this.byte, this.eoi, this.underAtn);
          } else this.st = "rBitHi";
        }
        break;
      // -------- talker
      case "tTurn":                           // C64 releases CLK, we take it over
        if (!iec.clk) { this.oClk = 1; this.oData = 0; this.t = now; this.st = "tNext"; }
        break;
      case "tNext":
        if (now - this.t < 80) break;
        this.cur = this.nextByte();
        if (!this.cur) { this.oClk = 0; this.oData = 0; this.st = "idle"; break; }
        this.oClk = 0; this.st = "tWaitL";     // ready to send
        break;
      case "tWaitL":                          // listener ready for data
        if (!iec.data) { this.t = now; this.st = this.cur.eoi ? "tEoi1" : "tSend"; }
        break;
      case "tEoi1": if (iec.data) this.st = "tEoi2"; break;
      case "tEoi2": if (!iec.data) { this.t = now; this.st = "tSend"; } break;
      case "tSend":
        if (now - this.t < 20) break;
        this.oClk = 1; this.bit = 0; this.t = now; this.st = "tBitSet";
        break;
      case "tBitSet":                         // CLK low phase and bit high phase are ~80 cycles
        // each, long enough to survive a bad line on the C64; the first bit comes later, as
        // some KERNALs check that DATA is free again after their own release of it
        if (now - this.t < (this.bit ? 40 : 70)) break;
        this.oData = (this.cur.v >> this.bit) & 1 ? 0 : 1;
        this.t = now; this.st = "tBitHi";
        break;
      case "tBitHi":
        if (now - this.t < 40) break;
        this.oClk = 0; this.t = now; this.st = "tBitLo";
        break;
      case "tBitLo":
        if (now - this.t < 80) break;
        this.oClk = 1; this.t = now;
        if (++this.bit < 8) this.st = "tBitSet";
        else { this.oData = 0; this.st = "tAck"; }
        break;
      case "tAck":                            // listener acknowledges the byte
        if (iec.data) { this.t = now; this.st = this.cur.eoi ? "tDone" : "tNext"; this.byteSent(); }
        else if (now - this.t > 1000) { this.oClk = 0; this.oData = 0; this.st = "idle"; }
        break;
      case "tDone":
        if (now - this.t > 60) { this.oClk = 0; this.st = "idle"; }
        break;
    }
  };

  D.atnDone = function (now) {
    if (this.pendingExec >= 0) { var a = this.pendingExec; this.pendingExec = -1; this.oData = 0; this.execute(a); return; }
    if (this.listening) { this.oData = 1; this.st = "rReady"; }
    else if (this.talking) { this.st = "tTurn"; }
    else { this.oData = 0; this.oClk = 0; this.st = "idle"; }
  };

  D.received = function (b, eoi, atn) {
    if (atn) {
      var cmd = b & 0xE0, sa = b & 0x0F, hi = b & 0xF0;
      if (b === 0x3F) { if (this.listening) this.unlisten(); this.listening = false; }
      else if (b === 0x5F) { this.talking = false; }
      else if (cmd === 0x20) { this.listening = (b & 0x1F) === 8; this.talking = false; }
      else if (cmd === 0x40) { this.talking = (b & 0x1F) === 8; this.listening = false; }
      else if (hi === 0x60) { this.sa = sa; this.saCmd = 0x60; }
      else if (hi === 0xE0) { if (this.listening) this.closeChannel(sa); this.saCmd = 0xE0; }
      else if (hi === 0xF0) { this.sa = sa; this.saCmd = 0xF0; this.openName = []; }
      return;
    }
    if (!this.listening) return;
    if (this.saCmd === 0xF0) this.openName.push(b);
    else if (this.sa === 15) { this.cmd.push(b); if (eoi) { this.command(this.cmd); this.cmd = []; } }
    else {
      var ch = this.chan[this.sa];
      if (!ch) ch = this.chan[this.sa] = { write: [], name: [0x40] };
      if (ch.write) ch.write.push(b);
    }
  };

  D.unlisten = function () {
    if (this.saCmd === 0xF0 && this.openName) {
      if (this.sa === 15) { if (this.openName.length) this.command(this.openName); }
      else this.openChannel(this.sa, this.openName);
      this.openName = null; this.saCmd = 0;
    } else if (this.sa === 15 && this.cmd.length) { this.command(this.cmd); this.cmd = []; }
  };

  D.openChannel = function (sa, nameBytes) {
    var Media = global.C64Media, name = Array.from(nameBytes), write = sa === 1;
    var comma = name.indexOf(0x2C);
    if (comma >= 0) {
      var rest = String.fromCharCode.apply(null, name.slice(comma));
      if (/,W/.test(rest)) write = true;
      name = name.slice(0, comma);
    }
    if (write) { this.chan[sa] = { write: [], name: name }; this.setStatus(0, " OK"); return; }
    if (!this.disk) { this.chan[sa] = { data: new Uint8Array(0), pos: 0 }; this.setStatus(74, "DRIVE NOT READY"); return; }
    var f = Media.findFile(this.disk, name);
    if (!f) { this.chan[sa] = { data: new Uint8Array(0), pos: 0 }; this.setStatus(62, "FILE NOT FOUND"); return; }
    this.chan[sa] = { data: f.data, pos: 0 };
    this.setStatus(0, " OK");
  };

  D.closeChannel = function (sa) {
    var ch = this.chan[sa];
    delete this.chan[sa];
    if (!ch || !ch.write || !ch.write.length || !this.disk || !this.disk.saveFile) return;
    var ok = this.disk.saveFile(ch.name, new Uint8Array(ch.write));
    if (ok) { this.disk.gcrStale = false; this.setStatus(0, " OK"); } else this.setStatus(72, "DISK FULL");
  };

  D.nextByte = function () {
    if (this.sa === 15) {
      if (!this.statusBytes) { this.statusBytes = this.status; this.statusPos = 0; }
      var sb = this.statusBytes, i = this.statusPos;
      if (i >= sb.length) return null;
      return { v: typeof sb === "string" ? sb.charCodeAt(i) : sb[i], eoi: i === sb.length - 1 };
    }
    var ch = this.chan[this.sa];
    if (!ch || !ch.data || ch.pos >= ch.data.length) return null;
    return { v: ch.data[ch.pos], eoi: ch.pos === ch.data.length - 1 };
  };
  D.byteSent = function () {
    if (this.sa === 15) {
      if (++this.statusPos >= this.statusBytes.length) { this.status = ST_OK; this.statusBytes = null; }
      return;
    }
    var ch = this.chan[this.sa];
    if (ch) ch.pos++;
  };

  D.command = function (bytes) {
    var b = Array.from(bytes);
    while (b.length && b[b.length - 1] === 13) b.pop();
    if (!b.length) return;
    var txt = String.fromCharCode.apply(null, b.slice(0, 3));
    if (txt === "M-W") {
      var a = b[3] | (b[4] << 8), n = b[5];
      for (var i = 0; i < n && 6 + i < b.length; i++) this.write((a + i) & 0xFFFF, b[6 + i]);
      this.setStatus(0, " OK"); return;
    }
    if (txt === "M-R") {
      var ar = b[3] | (b[4] << 8), nr = b.length > 5 ? b[5] || 256 : 1, out = [];
      for (var k = 0; k < nr; k++) out.push(this.read((ar + k) & 0xFFFF));
      this.status = out; this.statusBytes = null; return;
    }
    if (txt === "M-E") { this.pendingExec = b[3] | (b[4] << 8); return; }
    if (b[0] === 0x55) {                                         // U commands
      var u = b[1];
      if (u >= 0x33 && u <= 0x38) { this.pendingExec = 0x500 + (u - 0x33) * 3; return; }
      if (u >= 0x43 && u <= 0x48) { this.pendingExec = 0x500 + (u - 0x43) * 3; return; }
      if (u === 0x49 || u === 0x4A || u === 0x3A || u === 0x3B) { this.setStatus(73, "CBM DOS V2.6 1541"); return; }
    }
    if (b[0] === 0x49 || b[0] === 0x56) { this.setStatus(0, " OK"); return; }   // I, V
    this.setStatus(31, "SYNTAX ERROR");
  };

  global.Drive1541 = Drive1541;
  global.VIA6522 = VIA;
})(typeof window !== "undefined" ? window : globalThis);
