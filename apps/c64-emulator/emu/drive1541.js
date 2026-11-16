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
    this.rom = rom;                       // 16 KB
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
    while (this.clk < target) {
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

  global.Drive1541 = Drive1541;
  global.VIA6522 = VIA;
})(typeof window !== "undefined" ? window : globalThis);
