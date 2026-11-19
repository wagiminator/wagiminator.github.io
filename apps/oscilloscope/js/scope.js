/* Oscilloscope: acquisition (captures with a software trigger, or a rolling stream for slow time
 * bases), conversion of the ADC bytes to volts, measurements and the spectrum (FFT). */
(function (global) {
  "use strict";
  var OSC = global.OSC;

  var TDIV = [];
  [1e-6, 1e-5, 1e-4, 1e-3, 1e-2, 1e-1].forEach(function (d) { [1, 2, 5].forEach(function (m) { TDIV.push(+(d * m).toPrecision(3)); }); });
  TDIV.push(1);
  var ROLL_FROM = 0.1;          // s/div: from here on the display rolls
  var FRAME_MAX = 20000;        // samples per screen and channel at most (automatic rate)
  var FIXED_MAX = 1e6;          // … with a chosen rate

  // the sample rate for a time base: as fast as possible with at most FRAME_MAX samples per screen
  function rateFor(tdiv, channels, fixed) {
    var max = OSC.MAX_RATE[channels], want = fixed ? Math.min(fixed, FIXED_MAX / (10 * tdiv)) : FRAME_MAX / (10 * tdiv);
    var list = OSC.RATES.map(function (r) { return r[0]; }).filter(function (r) { return r <= max; });
    for (var i = 0; i < list.length; i++) if (list[i] <= want * 1.0001) return list[i];
    return list[list.length - 1];
  }

  /* dev: Hantek or Sim; S: settings (see app.js); cb: { onFrame(frame), onState(text), onError(e) } */
  function Engine(dev, S, cb) { this.dev = dev; this.S = S; this.cb = cb; this.running = false; this.dirty = true; this.zero = {}; this.raw = null; }
  var E = Engine.prototype;
  E.plan = function () {
    var S = this.S, chs = S.ch[1].on ? 2 : 1, rate = rateFor(S.tdiv, chs, S.rate === "auto" ? 0 : +S.rate);
    var n = Math.max(16, Math.round(10 * S.tdiv * rate));
    return { channels: chs, rate: rate, n: n, roll: S.tdiv >= ROLL_FROM, range: [S.ch[0].range, S.ch[1].range], coupling: [S.ch[0].coupling, S.ch[1].coupling], calFreq: S.calFreq };
  };
  // volts from the raw bytes of channel c
  E.volts = function (raw, p, c) {
    var dev = this.dev, kind = dev.kind || "std", g = p.range[c], k = OSC.SCALE[kind][g], probe = this.S.ch[c].probe || 1;
    var off = 128, gain = 1, cal = dev.cal, z = this.zero[(dev.prof ? dev.prof.id : "") + ":" + c + ":" + g];
    if (cal) { var o = (p.rate >= 30e6 ? cal.hs : cal.ls)[c][g]; if (o != null) off = o; gain = cal.gain[c][g] || 1; }
    if (z != null) off = z;
    var ch = p.channels, n = Math.floor(raw.length / ch), out = new Float32Array(n), clip = false, f = gain * probe / k;
    for (var i = 0, j = c; i < n; i++, j += ch) { var b = raw[j]; if (b === 0 || b === 255) clip = true; out[i] = (b - off) * f; }
    out.clip = clip;
    return out;
  };
  E.start = function () { if (this.running) return; this.running = true; this.single = this.S.trig.mode === "single"; this.loopP = this.loop(); };
  E.stop = function () { this.running = false; };
  // stop and wait until the device is idle
  E.halt = async function () { this.running = false; if (this.loopP) await this.loopP; };
  E.loop = async function () {
    var self = this;
    try {
      while (this.running) {
        var p = this.plan();
        if (this.dirty || !this.cfg || JSON.stringify(p) !== this.cfg) {
          this.dirty = false; this.cfg = JSON.stringify(p);
          await this.dev.configure(p);
        }
        if (p.roll) await this.roll(p);
        else await this.frame(p);
        await new Promise(function (r) { setTimeout(r, 0); });
      }
    } catch (e) {
      this.running = false;
      if (this.cb.onError) this.cb.onError(e);
    }
    if (this.cb.onState) this.cb.onState(self.running ? "" : "stopped");
  };
  // one screen with the trigger
  E.frame = async function (p) {
    var S = this.S, n = p.n, pre = Math.round(n * S.hpos / 100), post = n - pre;
    var len = Math.max(2 * n + 64, 8192 / p.channels), raw = await this.dev.capture(len * p.channels);
    if (!this.running) return;
    var v = [this.volts(raw, p, 0), p.channels > 1 ? this.volts(raw, p, 1) : null];
    var src = v[Math.min(S.trig.src, p.channels - 1)] || v[0], N = src.length;
    var at = this.findTrigger(src, Math.max(pre, 1), N - post - 1, p);
    var mode = S.trig.mode;
    if (at === null && mode !== "auto") { if (this.cb.onState) this.cb.onState("waiting"); return; }
    var s0 = at === null ? Math.max(0, N - n) : Math.floor(at) - pre;
    var frac = at === null ? 0 : at - Math.floor(at);
    var f = { rate: p.rate, n: n, pre: pre, frac: frac, triggered: at !== null, roll: false, channels: p.channels, ch: [] };
    for (var c = 0; c < 2; c++) {
      if (!v[c] || !S.ch[c].on) { f.ch.push(null); continue; }
      var d = v[c].subarray(s0, s0 + n); d.clip = v[c].clip;
      f.ch.push(d);
    }
    if (this.cb.onFrame) this.cb.onFrame(f);
    if (this.single && at !== null) { this.running = false; if (this.cb.onState) this.cb.onState("single"); }
  };
  // index (with fraction) of the first trigger point in a…b, or null
  E.findTrigger = function (d, a, b, p) {
    var S = this.S, lvl = S.trig.level, rise = S.trig.slope !== "fall", g = p.range[S.trig.src], vdiv = OSC.VDIV[g] * (S.ch[S.trig.src].probe || 1);
    var hyst = Math.max(vdiv * 0.08, 1e-4), armed = false;
    for (var i = Math.max(1, a - 200); i <= b; i++) {
      var x = d[i];
      if (rise) {
        if (x < lvl - hyst) armed = true;
        else if (armed && x >= lvl && d[i - 1] < lvl && i >= a) return i - 1 + (lvl - d[i - 1]) / (x - d[i - 1] || 1);
      } else {
        if (x > lvl + hyst) armed = true;
        else if (armed && x <= lvl && d[i - 1] > lvl && i >= a) return i - 1 + (d[i - 1] - lvl) / (d[i - 1] - x || 1);
      }
    }
    return null;
  };
  // rolling display: the newest samples come in at the right
  E.roll = async function (p) {
    var self = this, n = p.n, ring = [new Float32Array(n), new Float32Array(n)], fill = 0, head = 0, last = 0, stamp = this.cfg;
    var onData = function (raw) {
      var a = self.volts(raw, p, 0), b = p.channels > 1 ? self.volts(raw, p, 1) : null;
      for (var i = 0; i < a.length; i++) { ring[0][head] = a[i]; if (b) ring[1][head] = b[i]; head = (head + 1) % n; if (fill < n) fill++; }
      var now = performance.now();
      if (now - last > 40) {
        last = now;
        var f = { rate: p.rate, n: n, pre: 0, frac: 0, triggered: false, roll: true, fill: fill, channels: p.channels, ch: [] };
        for (var c = 0; c < 2; c++) {
          if (!self.S.ch[c].on || (c === 1 && !b)) { f.ch.push(null); continue; }
          var out = new Float32Array(fill), r = ring[c];
          for (var k = 0; k < fill; k++) out[k] = r[(head - fill + k + n) % n];
          out.clip = false;
          f.ch.push(out);
        }
        if (self.cb.onFrame) self.cb.onFrame(f);
      }
    };
    var size = Math.max(512, Math.round(p.rate * p.channels * 0.04));
    await this.dev.stream(size, onData, function () { return !self.running || JSON.stringify(self.plan()) !== stamp || self.dirty; });
  };
  // zero calibration: the inputs connected to ground, every range measured
  E.calibrateZero = async function (progress) {
    var S = this.S, out = {}, dev = this.dev, id = dev.prof ? dev.prof.id : "";
    for (var g = 0; g < 8; g++) {
      if (progress) progress(g);
      var p = { channels: 2, rate: 1e6, n: 20000, roll: false, range: [g, g], coupling: ["DC", "DC"], calFreq: S.calFreq };
      await dev.configure(p);
      var raw = await dev.capture(40000);
      for (var c = 0; c < 2; c++) { var s = 0, k = 0; for (var i = c; i < raw.length; i += 2) { s += raw[i]; k++; } out[id + ":" + c + ":" + g] = s / k; }
    }
    this.cfg = null;
    return out;
  };

  // ================================================================ measurements
  // minPP: below this peak-to-peak voltage no frequency is measured (noise only)
  function measure(d, rate, minPP) {
    var n = d.length; if (!n) return null;
    var mn = Infinity, mx = -Infinity, sum = 0, sq = 0;
    for (var i = 0; i < n; i++) { var v = d[i]; if (v < mn) mn = v; if (v > mx) mx = v; sum += v; sq += v * v; }
    var mean = sum / n, rms = Math.sqrt(sq / n), pp = mx - mn, m = { min: mn, max: mx, pp: pp, mean: mean, rms: rms, acrms: Math.sqrt(Math.max(0, sq / n - mean * mean)) };
    // frequency from the rising crossings of the middle level, with hysteresis
    if (pp > 0 && pp >= (minPP || 0)) {
      var mid = (mx + mn) / 2, h = pp * 0.1, high = d[0] > mid + h, rises = [], rise = -1, highSum = 0, highs = 0;
      for (var k = 1; k < n; k++) {
        var x = d[k];
        if (!high && x > mid + h) {
          high = true;
          rise = k - 1 + (mid - d[k - 1]) / ((x - d[k - 1]) || 1);
          rises.push(rise);
        } else if (high && x < mid - h) {
          high = false;
          if (rise >= 0) { highSum += k - 1 + (d[k - 1] - mid) / ((d[k - 1] - x) || 1) - rise; highs++; }
        }
      }
      if (rises.length >= 2) {
        var per = (rises[rises.length - 1] - rises[0]) / (rises.length - 1);
        m.period = per / rate; m.freq = rate / per;
        if (highs) m.duty = Math.min(1, Math.max(0, highSum / highs / per));
      }
    }
    return m;
  }

  // ================================================================ spectrum
  function fft(re, im) {
    var n = re.length, i, j = 0, k, m;
    for (i = 1; i < n; i++) { var bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { var t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
    for (var len = 2; len <= n; len <<= 1) {
      var ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
      for (i = 0; i < n; i += len) {
        var cr = 1, ci = 0;
        for (k = 0; k < len / 2; k++) {
          var a = i + k, b = a + len / 2, xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr;
          re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
          m = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = m;
        }
      }
    }
  }
  // spectrum in dBV (RMS) with a Hann window: { db: Float32Array, df, peak: {f, db} }
  function spectrum(d, rate) {
    var n = 1; while (n * 2 <= d.length && n < 16384) n *= 2;
    if (n < 64) return null;
    var re = new Float64Array(n), im = new Float64Array(n), ws = 0, mean = 0, o = d.length - n;
    for (var i = 0; i < n; i++) mean += d[o + i];
    mean /= n;
    for (i = 0; i < n; i++) { var w = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (n - 1)); ws += w; re[i] = (d[o + i] - mean) * w; }
    fft(re, im);
    var h = n / 2, db = new Float32Array(h), peak = { f: 0, db: -Infinity };
    for (i = 1; i < h; i++) {
      var a = Math.sqrt(re[i] * re[i] + im[i] * im[i]) * 2 / ws / Math.SQRT2;
      db[i] = 20 * Math.log10(Math.max(a, 1e-9));
      if (db[i] > peak.db) peak = { i: i, f: i * rate / n, db: db[i] };
    }
    // the peak between the bins (parabola through the three highest points)
    if (peak.i > 1 && peak.i < h - 1) {
      var y0 = db[peak.i - 1], y1 = db[peak.i], y2 = db[peak.i + 1], den = y0 - 2 * y1 + y2;
      if (den < 0) { var dlt = 0.5 * (y0 - y2) / den; peak.f = (peak.i + dlt) * rate / n; peak.db = y1 - 0.25 * (y0 - y2) * dlt; }
    }
    db[0] = 20 * Math.log10(Math.max(Math.abs(mean), 1e-9));
    return { db: db, df: rate / n, peak: peak, n: n };
  }

  Object.assign(OSC, { Engine: Engine, TDIV: TDIV, ROLL_FROM: ROLL_FROM, rateFor: rateFor, measure: measure, spectrum: spectrum });
})(window);
