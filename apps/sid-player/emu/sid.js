/* MOS 6581/8580 SID sound chip (SID Player version: the core of the C64 emulator, extended
 * by the output of every single voice for the oscilloscopes and by muting voices).
 * Three oscillators (24-bit accumulators, triangle/saw/pulse/noise, ring modulation,
 * hard sync), ADSR envelopes with the real rate and exponential tables, and a
 * state-variable filter. The chip is clocked lazily: clockTo(cycle) runs it in
 * small steps up to the given CPU cycle and box-filters the result to the output rate.
 */
(function (global) {
  "use strict";

  var STEP = 4;                      // internal resolution in CPU cycles
  var RATE = [9, 32, 63, 95, 149, 220, 267, 313, 392, 977, 1954, 3126, 3907, 11720, 19532, 31251];
  var EXP = new Uint8Array(256);
  (function () {
    for (var i = 0; i < 256; i++) {
      EXP[i] = i >= 94 ? 1 : i >= 55 ? 2 : i >= 27 ? 4 : i >= 15 ? 8 : i >= 7 ? 16 : i >= 1 ? 30 : 1;
    }
  })();

  function Voice() {
    this.acc = 0; this.freq = 0; this.pw = 0; this.ctrl = 0;
    this.ad = 0; this.sr = 0;
    this.lfsr = 0x7FFFF8;
    this.env = 0; this.state = 2; this.rateCnt = 0; this.expCnt = 0;
    this.rose = false; this.raw = 0; this.wave = 0;
  }

  function SID(clockHz, sampleRate) {
    this.clockHz = clockHz;
    this.model = 6581;
    this.setSampleRate(sampleRate || 44100);
    this.v = [new Voice(), new Voice(), new Voice()];
    this.reset();
  }
  var P = SID.prototype;

  P.setSampleRate = function (rate) {
    this.sampleRate = rate;
    this.cps = this.clockHz / rate;       // CPU cycles per output sample
    this.fs = this.clockHz / STEP;        // internal rate
    this.updateFilter && this.updateFilter();
  };

  P.reset = function () {
    for (var i = 0; i < 3; i++) {
      var v = this.v[i];
      v.acc = 0; v.freq = 0; v.pw = 0; v.ctrl = 0; v.ad = 0; v.sr = 0;
      v.lfsr = 0x7FFFF8; v.env = 0; v.state = 2; v.rateCnt = 0; v.expCnt = 0;
    }
    this.regs = new Uint8Array(32);
    this.fc = 0; this.res = 0; this.filt = 0; this.mode = 0; this.vol = 0;
    this.lp = 0; this.bp = 0; this.hp = 0;
    this.clk = 0; this.stepAcc = 0;
    this.sAcc = 0; this.sSum = 0;
    this.out = new Float32Array(4096); this.outLen = 0;
    this.vout = [new Float32Array(4096), new Float32Array(4096), new Float32Array(4096)];
    this.vs = [0, 0, 0]; this.vSum = [0, 0, 0];
    this.mute = 0;                       // bit mask of muted voices
    this.dcX = 0; this.dcY = 0;
    this.lastWrite = 0;
    this.updateFilter();
  };

  P.setModel = function (m) { this.model = m; this.updateFilter(); };

  P.updateFilter = function () {
    var f;
    if (this.model === 8580) f = 30 + this.fc * 5.8;
    else f = 220 * Math.pow(2, (this.fc / 2047) * 5.3);
    f = Math.min(f, 16000);
    this.w0 = 2 * Math.sin(Math.PI * f / this.fs);
    var q = 0.707 + (this.res / 15) * (this.model === 8580 ? 1.9 : 1.4);
    this.damp = 1 / q;
  };

  P.write = function (r, val) {
    r &= 0x1F;
    this.regs[r] = val;
    this.lastWrite = val;
    if (r < 21) {
      var v = this.v[(r / 7) | 0];
      switch (r % 7) {
        case 0: v.freq = (v.freq & 0xFF00) | val; break;
        case 1: v.freq = (v.freq & 0x00FF) | (val << 8); break;
        case 2: v.pw = (v.pw & 0xF00) | val; break;
        case 3: v.pw = (v.pw & 0x0FF) | ((val & 0x0F) << 8); break;
        case 4:
          if ((val & 1) && !(v.ctrl & 1)) { v.state = 0; v.rateCnt = 0; }
          else if (!(val & 1) && (v.ctrl & 1)) { v.state = 2; }
          if (val & 8) { v.acc = 0; v.lfsr = 0x7FFFF8; }
          v.ctrl = val;
          break;
        case 5: v.ad = val; break;
        case 6: v.sr = val; break;
      }
    } else {
      switch (r) {
        case 21: this.fc = (this.fc & 0x7F8) | (val & 7); this.updateFilter(); break;
        case 22: this.fc = (this.fc & 7) | (val << 3); this.updateFilter(); break;
        case 23: this.res = val >> 4; this.filt = val & 0x0F; this.updateFilter(); break;
        case 24: this.mode = val & 0xF0; this.vol = val & 0x0F; break;
      }
    }
  };

  P.read = function (r) {
    r &= 0x1F;
    if (r === 25 || r === 26) return 0xFF;               // paddles (not connected)
    if (r === 27) return (this.v[2].wave >> 4) & 0xFF;     // OSC3
    if (r === 28) return this.v[2].env;                    // ENV3
    return this.lastWrite;
  };

  function waveOut(v, src) {
    var c = v.ctrl, acc = v.acc, o = 0xFFF, any = false;
    if (c & 0x10) {
      var msb = (c & 0x04) ? ((acc ^ src.acc) & 0x800000) : (acc & 0x800000);
      o &= ((msb ? ~acc : acc) >> 11) & 0xFFF; any = true;
    }
    if (c & 0x20) { o &= acc >> 12; any = true; }
    if (c & 0x40) { o &= ((c & 0x08) || (acc >> 12) >= v.pw) ? 0xFFF : 0; any = true; }
    if (c & 0x80) {
      var l = v.lfsr;
      o &= ((l >> 11) & 0x800) | ((l >> 10) & 0x400) | ((l >> 7) & 0x200) | ((l >> 5) & 0x100) |
           ((l >> 4) & 0x080) | ((l >> 1) & 0x040) | ((l << 1) & 0x020) | ((l << 2) & 0x010);
      any = true;
    }
    return any ? o : 0;
  }

  P.stepEnv = function (v, n) {
    v.rateCnt += n;
    var per = RATE[v.state === 0 ? v.ad >> 4 : v.state === 1 ? v.ad & 15 : v.sr & 15];
    while (v.rateCnt >= per) {
      v.rateCnt -= per;
      if (v.state === 0) {
        if (v.env < 255) v.env++;
        if (v.env === 255) v.state = 1;
      } else {
        if (++v.expCnt >= EXP[v.env]) {
          v.expCnt = 0;
          if (v.state === 1) {
            var sus = (v.sr >> 4) * 17;
            if (v.env > sus) v.env--;
          } else if (v.env > 0) v.env--;
        }
      }
    }
  };

  P.step = function (n) {
    var vs = this.v, i, v;
    // oscillators
    for (i = 0; i < 3; i++) {
      v = vs[i];
      if (v.ctrl & 8) { v.raw = 0; v.rose = false; continue; }
      var raw = v.acc + v.freq * n;
      v.rose = Math.floor((raw + 0x800000) / 0x1000000) > Math.floor((v.acc + 0x800000) / 0x1000000);
      var clocks = Math.floor((raw + 0x80000) / 0x100000) - Math.floor((v.acc + 0x80000) / 0x100000);
      if (clocks > 0) {
        var l = v.lfsr;
        if (clocks > 23) clocks = 23;
        while (clocks--) l = ((l << 1) | (((l >> 22) ^ (l >> 17)) & 1)) & 0x7FFFFF;
        v.lfsr = l;
      }
      v.raw = raw;
    }
    for (i = 0; i < 3; i++) {
      v = vs[i];
      if (v.ctrl & 8) continue;
      var src = vs[(i + 2) % 3];
      if ((v.ctrl & 0x02) && src.rose) v.acc = 0; else v.acc = v.raw & 0xFFFFFF;
    }
    // envelopes and mixing
    var filtIn = 0, direct = 0;
    for (i = 0; i < 3; i++) {
      v = vs[i];
      this.stepEnv(v, n);
      v.wave = waveOut(v, vs[(i + 2) % 3]);
      var s = (v.wave - 0x800) * v.env / 255;
      this.vs[i] = s;
      if (this.mute & (1 << i)) continue;
      if (this.filt & (1 << i)) filtIn += s;
      else if (!(i === 2 && (this.mode & 0x80))) direct += s;
    }
    // state-variable filter
    var w0 = this.w0;
    this.hp = filtIn - this.lp - this.damp * this.bp;
    this.bp += w0 * this.hp;
    this.lp += w0 * this.bp;
    var fo = 0, m = this.mode;
    if (m & 0x10) fo += this.lp;
    if (m & 0x20) fo += this.bp;
    if (m & 0x40) fo += this.hp;
    var dc = this.model === 8580 ? 0 : 1600;
    return (direct + fo + dc) * this.vol / 15 / 7000;
  };

  P.clockTo = function (t) {
    var d = t - this.clk;
    if (d <= 0) return;
    this.clk = t;
    this.stepAcc += d;
    var cps = this.cps;
    while (this.stepAcc >= STEP) {
      this.stepAcc -= STEP;
      var val = this.step(STEP);
      var rem = STEP, vs = this.vs, vSum = this.vSum;
      while (rem > 0) {
        var need = cps - this.sAcc;
        if (rem >= need) {
          this.sSum += val * need;
          vSum[0] += vs[0] * need; vSum[1] += vs[1] * need; vSum[2] += vs[2] * need;
          this.emit(this.sSum / cps, vSum[0] / cps, vSum[1] / cps, vSum[2] / cps);
          this.sSum = 0; this.sAcc = 0; rem -= need;
          vSum[0] = vSum[1] = vSum[2] = 0;
        } else {
          this.sSum += val * rem; this.sAcc += rem;
          vSum[0] += vs[0] * rem; vSum[1] += vs[1] * rem; vSum[2] += vs[2] * rem;
          rem = 0;
        }
      }
    }
  };

  P.emit = function (x, a, b, c) {
    // DC blocker (the C64 audio output is AC coupled)
    var y = x - this.dcX + 0.9985 * this.dcY;
    this.dcX = x; this.dcY = y;
    if (this.outLen >= this.out.length) {
      var n = new Float32Array(this.out.length * 2); n.set(this.out); this.out = n;
      for (var k = 0; k < 3; k++) { var m = new Float32Array(this.out.length); m.set(this.vout[k]); this.vout[k] = m; }
    }
    var i = this.outLen++;
    this.out[i] = y;
    // single voices, scaled to -1..1 (before volume and filter)
    this.vout[0][i] = a / 2048; this.vout[1][i] = b / 2048; this.vout[2][i] = c / 2048;
  };

  // Take the samples generated so far (mix, and the three single voices)
  P.takeSamples = function () {
    var n = this.outLen, s = this.out.slice(0, n);
    this.lastVoices = [this.vout[0].slice(0, n), this.vout[1].slice(0, n), this.vout[2].slice(0, n)];
    this.outLen = 0;
    return s;
  };

  P.saveState = function () {
    return {
      regs: Array.from(this.regs), voices: this.v.map(function (v) { return Object.assign({}, v); }),
      fc: this.fc, res: this.res, filt: this.filt, mode: this.mode, vol: this.vol, clk: this.clk, model: this.model
    };
  };
  P.loadState = function (o) {
    this.regs.set(o.regs);
    for (var i = 0; i < 3; i++) Object.assign(this.v[i], o.voices[i]);
    this.fc = o.fc; this.res = o.res; this.filt = o.filt; this.mode = o.mode; this.vol = o.vol; this.clk = o.clk;
    this.model = o.model; this.lp = this.bp = this.hp = 0; this.sAcc = 0; this.sSum = 0;
    this.updateFilter();
  };

  global.SID6581 = SID;
})(typeof window !== "undefined" ? window : globalThis);
