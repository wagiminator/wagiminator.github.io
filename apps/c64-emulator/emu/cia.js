/* MOS 6526 CIA: two 16-bit timers, time-of-day clock, serial port, I/O ports.
 * tick() advances one phi2 cycle. Port pins are provided by callbacks of the machine.
 */
(function (global) {
  "use strict";

  function CIA(name) {
    this.name = name;
    this.readPA = function () { return 0xFF; };   // external pin levels
    this.readPB = function () { return 0xFF; };
    this.onWritePort = function () {};           // called after PRA/PRB/DDR writes
    this.onIrq = function () {};                 // (level)
    this.reset();
  }
  var P = CIA.prototype;

  P.reset = function () {
    this.pra = 0; this.prb = 0; this.ddra = 0; this.ddrb = 0;
    this.ta = 0xFFFF; this.tb = 0xFFFF; this.latchA = 0xFFFF; this.latchB = 0xFFFF;
    this.cra = 0; this.crb = 0;
    this.delayA = 0; this.delayB = 0;
    this.icr = 0; this.mask = 0; this.irqOut = 0;
    this.sdr = 0; this.sdrBits = 0; this.sdrPending = false;
    // time of day (BCD)
    this.tod = [0, 0, 0, 1];          // tenths, seconds, minutes, hours (12h, bit 7 = PM)
    this.alarm = [0, 0, 0, 0];
    this.todLatch = null;
    this.todStopped = true;
    this.todDiv = 0;
    this.cntHigh = true;
  };

  P.updateIrq = function () {
    var lvl = (this.icr & this.mask & 0x1F) ? 1 : 0;
    if (lvl !== this.irqOut) { this.irqOut = lvl; this.onIrq(lvl); }
  };
  P.setFlag = function (bit) { this.icr |= bit; this.updateIrq(); };

  // FLAG pin: negative edge (cassette read / serial ATN on CIA2)
  P.flag = function () { this.setFlag(0x10); };

  P.underflowA = function () {
    this.setFlag(0x01);
    if (this.cra & 0x08) this.cra &= ~0x01;            // one-shot: stop
    this.ta = this.latchA;
    // serial port output: shift one bit every second underflow
    if ((this.cra & 0x40) && this.sdrPending) {
      if (++this.sdrBits >= 16) { this.sdrBits = 0; this.sdrPending = false; this.setFlag(0x08); }
    }
    var m = this.crb & 0x61;
    if (m === 0x41 || (m === 0x61 && this.cntHigh)) this.countB();
  };
  P.countB = function () {
    if (this.delayB) return;
    if (this.tb === 0) {
      this.setFlag(0x02);
      if (this.crb & 0x08) this.crb &= ~0x01;
      this.tb = this.latchB;
    } else this.tb--;
  };

  P.tick = function () {
    if (this.cra & 0x01) {
      if (this.delayA) this.delayA--;
      else if (!(this.cra & 0x20)) {
        if (this.ta === 0) this.underflowA(); else this.ta--;
      }
    }
    if (this.crb & 0x01) {
      if (this.delayB) this.delayB--;
      else if (!(this.crb & 0x60)) {
        if (this.tb === 0) {
          this.setFlag(0x02);
          if (this.crb & 0x08) this.crb &= ~0x01;
          this.tb = this.latchB;
        } else this.tb--;
      }
    }
  };

  // Fast path for many idle cycles (both timers stopped or counting phi2)
  P.run = function (n) {
    for (var i = 0; i < n; i++) this.tick();
  };

  // 50 Hz mains tick for the TOD clock
  P.todTick = function () {
    if (this.todStopped) return;
    var div = (this.cra & 0x80) ? 5 : 6;
    if (++this.todDiv < div) return;
    this.todDiv = 0;
    var t = this.tod;
    t[0] = (t[0] + 1) & 0x0F;
    if (t[0] > 9) {
      t[0] = 0;
      t[1] = bcdInc(t[1]);
      if (t[1] > 0x59) {
        t[1] = 0;
        t[2] = bcdInc(t[2]);
        if (t[2] > 0x59) {
          t[2] = 0;
          var pm = t[3] & 0x80, h = t[3] & 0x1F;
          if (h === 0x11) { pm ^= 0x80; h = 0x12; }
          else if (h === 0x12) h = 0x01;
          else h = bcdInc(h);
          t[3] = pm | h;
        }
      }
    }
    if (t[0] === this.alarm[0] && t[1] === this.alarm[1] && t[2] === this.alarm[2] && t[3] === this.alarm[3]) this.setFlag(0x04);
  };
  function bcdInc(v) { v++; if ((v & 0x0F) > 9) v = (v & 0xF0) + 0x10; return v; }

  P.read = function (r) {
    var v;
    switch (r & 0x0F) {
      case 0x0: return (this.pra | ~this.ddra) & this.readPA() & 0xFF;
      case 0x1: return (this.prb | ~this.ddrb) & this.readPB() & 0xFF;
      case 0x2: return this.ddra;
      case 0x3: return this.ddrb;
      case 0x4: return this.ta & 0xFF;
      case 0x5: return this.ta >> 8;
      case 0x6: return this.tb & 0xFF;
      case 0x7: return this.tb >> 8;
      case 0x8:
        v = (this.todLatch || this.tod)[0];
        this.todLatch = null;
        return v;
      case 0x9: return (this.todLatch || this.tod)[1];
      case 0xA: return (this.todLatch || this.tod)[2];
      case 0xB:
        this.todLatch = this.tod.slice();
        return this.todLatch[3];
      case 0xC: return this.sdr;
      case 0xD:
        v = this.icr | (this.irqOut ? 0x80 : 0);
        this.icr = 0;
        this.updateIrq();
        return v;
      case 0xE: return this.cra & ~0x10;
      case 0xF: return this.crb & ~0x10;
    }
    return 0xFF;
  };

  // Read without side effects (debugger / snapshot)
  P.peek = function (r) {
    r &= 0x0F;
    if (r === 0xD) return this.icr;
    if (r === 0x8 || r === 0xB) return this.tod[r === 0x8 ? 0 : 3];
    return this.read(r);
  };

  P.write = function (r, v) {
    switch (r & 0x0F) {
      case 0x0: this.pra = v; this.onWritePort(); break;
      case 0x1: this.prb = v; this.onWritePort(); break;
      case 0x2: this.ddra = v; this.onWritePort(); break;
      case 0x3: this.ddrb = v; this.onWritePort(); break;
      case 0x4: this.latchA = (this.latchA & 0xFF00) | v; break;
      case 0x5:
        this.latchA = (this.latchA & 0x00FF) | (v << 8);
        if (!(this.cra & 0x01)) {
          this.ta = this.latchA;
          if (this.cra & 0x08) { this.cra |= 0x01; this.delayA = 2; }   // one-shot: start
        }
        break;
      case 0x6: this.latchB = (this.latchB & 0xFF00) | v; break;
      case 0x7:
        this.latchB = (this.latchB & 0x00FF) | (v << 8);
        if (!(this.crb & 0x01)) {
          this.tb = this.latchB;
          if (this.crb & 0x08) { this.crb |= 0x01; this.delayB = 2; }
        }
        break;
      case 0x8:
        v &= 0x0F;
        if (this.crb & 0x80) this.alarm[0] = v;
        else { this.tod[0] = v; this.todStopped = false; }
        break;
      case 0x9: v &= 0x7F; if (this.crb & 0x80) this.alarm[1] = v; else this.tod[1] = v; break;
      case 0xA: v &= 0x7F; if (this.crb & 0x80) this.alarm[2] = v; else this.tod[2] = v; break;
      case 0xB:
        v &= 0x9F;
        if (this.crb & 0x80) this.alarm[3] = v;
        else {
          if ((v & 0x1F) === 0x12) v ^= 0x80;        // hardware quirk: writing 12 flips AM/PM
          this.tod[3] = v; this.todStopped = true;
        }
        break;
      case 0xC:
        this.sdr = v;
        if (this.cra & 0x40) { this.sdrPending = true; this.sdrBits = 0; }
        break;
      case 0xD:
        if (v & 0x80) this.mask |= v & 0x1F; else this.mask &= ~v & 0x1F;
        this.updateIrq();
        break;
      case 0xE:
        if ((v & 0x01) && !(this.cra & 0x01)) this.delayA = 2;
        if (v & 0x10) this.ta = this.latchA;
        this.cra = v & ~0x10;
        break;
      case 0xF:
        if ((v & 0x01) && !(this.crb & 0x01)) this.delayB = 2;
        if (v & 0x10) this.tb = this.latchB;
        this.crb = v & ~0x10;
        break;
    }
  };

  P.saveState = function () {
    var o = {};
    for (var k in this) if (Object.prototype.hasOwnProperty.call(this, k) && typeof this[k] !== "function") o[k] = this[k];
    o.tod = this.tod.slice(); o.alarm = this.alarm.slice(); o.todLatch = this.todLatch ? this.todLatch.slice() : null;
    delete o.name;
    return o;
  };
  P.loadState = function (o) {
    for (var k in o) this[k] = Array.isArray(o[k]) ? o[k].slice() : o[k];
  };

  global.CIA6526 = CIA;
})(typeof window !== "undefined" ? window : globalThis);
