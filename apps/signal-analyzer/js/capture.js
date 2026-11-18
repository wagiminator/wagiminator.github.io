/* Signal Analyzer: a capture, its channels and fast queries over millions of samples.
 *
 * Digital channels are packed: bit i of every word in a WordStore is one channel.
 * Both stores keep a pyramid of block summaries (AND/OR of the words, or min/max of
 * the values), so drawing and edge search never have to touch every sample. */
(function (global) {
  "use strict";

  var B0 = 16, F = 4;   // the first level sums up 16 samples, every further level 4 blocks

  // ================================================================ digital words
  function WordStore(data) {
    this.data = data;
    this.n = data.length;
    this.levels = [];
    this.cache = {};
    this.build();
  }
  WordStore.prototype.build = function () {
    var d = this.data, n = d.length, T = d.constructor, bs = B0, cnt = Math.ceil(n / bs), i = 0, b;
    this.levels = []; this.cache = {};
    if (!cnt) return;
    var A = new T(cnt), O = new T(cnt);
    for (b = 0; b < cnt; b++) {
      var e = i + bs > n ? n : i + bs, a = d[i], o = a;
      for (i++; i < e; i++) { var v = d[i]; a &= v; o |= v; }
      A[b] = a; O[b] = o;
    }
    this.levels.push({ bs: bs, and: A, or: O });
    while (cnt > 4) {
      var c2 = Math.ceil(cnt / F), A2 = new T(c2), O2 = new T(c2);
      for (b = 0; b < c2; b++) {
        var j = b * F, je = j + F > cnt ? cnt : j + F, a2 = A[j], o2 = O[j];
        for (j++; j < je; j++) { a2 &= A[j]; o2 |= O[j]; }
        A2[b] = a2; O2[b] = o2;
      }
      bs *= F; A = A2; O = O2; cnt = c2;
      this.levels.push({ bs: bs, and: A, or: O });
    }
  };
  // AND and OR of all words in [s0, s1): a bit that differs between them changes in the range
  WordStore.prototype.range = function (s0, s1, out) {
    var d = this.data, L = this.levels, a = -1, o = 0, top = L.length - 1;
    if (s0 < 0) s0 = 0;
    if (s1 > this.n) s1 = this.n;
    while (top >= 0 && L[top].bs > s1 - s0) top--;
    while (s0 < s1) {
      var k = top;
      for (; k >= 0; k--) { var bs = L[k].bs; if (s0 % bs === 0 && s0 + bs <= s1) break; }
      if (k < 0) { var v = d[s0++]; a &= v; o |= v; }
      else { var lv = L[k], idx = s0 / lv.bs; a &= lv.and[idx]; o |= lv.or[idx]; s0 += lv.bs; }
    }
    out.and = a; out.or = o;
    return out;
  };
  // all sample indices where the bit changes (the index of the first sample with the new value)
  WordStore.prototype.edges = function (bit) {
    if (this.cache[bit]) return this.cache[bit];
    var d = this.data, n = this.n, L = this.levels, out = new Int32Array(1024), cnt = 0;
    if (!n) return (this.cache[bit] = out.subarray(0, 0));
    var prev = (d[0] >>> bit) & 1, s = 1;
    while (s < n) {
      if ((s & 15) === 0) {
        var skipped = false;
        for (var k = L.length - 1; k >= 0; k--) {
          var lv = L[k], bs = lv.bs;
          if (s % bs !== 0 || s + bs > n) continue;
          var idx = s / bs, A = (lv.and[idx] >>> bit) & 1, O = (lv.or[idx] >>> bit) & 1;
          if (A === O && A === prev) { s += bs; skipped = true; break; }
        }
        if (skipped) continue;
      }
      var v = (d[s] >>> bit) & 1;
      if (v !== prev) {
        if (cnt === out.length) { var o2 = new Int32Array(out.length * 2); o2.set(out); out = o2; }
        out[cnt++] = s; prev = v;
      }
      s++;
    }
    return (this.cache[bit] = out.subarray(0, cnt));
  };

  // ================================================================ analog values
  function AnalogStore(data) {
    this.data = data;
    this.n = data.length;
    this.levels = [];
    this.build();
  }
  AnalogStore.prototype.build = function () {
    var d = this.data, n = d.length, bs = B0, cnt = Math.ceil(n / bs), i = 0, b;
    this.levels = [];
    this.min = Infinity; this.max = -Infinity;
    if (!cnt) { this.min = 0; this.max = 0; return; }
    var MI = new Float32Array(cnt), MA = new Float32Array(cnt);
    for (b = 0; b < cnt; b++) {
      var e = i + bs > n ? n : i + bs, lo = d[i], hi = lo;
      for (i++; i < e; i++) { var v = d[i]; if (v < lo) lo = v; else if (v > hi) hi = v; }
      MI[b] = lo; MA[b] = hi;
      if (lo < this.min) this.min = lo;
      if (hi > this.max) this.max = hi;
    }
    this.levels.push({ bs: bs, min: MI, max: MA });
    while (cnt > 4) {
      var c2 = Math.ceil(cnt / F), M2 = new Float32Array(c2), X2 = new Float32Array(c2);
      for (b = 0; b < c2; b++) {
        var j = b * F, je = j + F > cnt ? cnt : j + F, lo2 = MI[j], hi2 = MA[j];
        for (j++; j < je; j++) { if (MI[j] < lo2) lo2 = MI[j]; if (MA[j] > hi2) hi2 = MA[j]; }
        M2[b] = lo2; X2[b] = hi2;
      }
      bs *= F; MI = M2; MA = X2; cnt = c2;
      this.levels.push({ bs: bs, min: MI, max: MA });
    }
  };
  AnalogStore.prototype.range = function (s0, s1, out) {
    var d = this.data, L = this.levels, lo = Infinity, hi = -Infinity, top = L.length - 1;
    if (s0 < 0) s0 = 0;
    if (s1 > this.n) s1 = this.n;
    while (top >= 0 && L[top].bs > s1 - s0) top--;
    while (s0 < s1) {
      var k = top;
      for (; k >= 0; k--) { var bs = L[k].bs; if (s0 % bs === 0 && s0 + bs <= s1) break; }
      if (k < 0) { var v = d[s0++]; if (v < lo) lo = v; if (v > hi) hi = v; }
      else { var lv = L[k], idx = s0 / lv.bs; if (lv.min[idx] < lo) lo = lv.min[idx]; if (lv.max[idx] > hi) hi = lv.max[idx]; s0 += lv.bs; }
    }
    out.min = lo; out.max = hi;
    return out;
  };

  // ================================================================ channel colours
  // the resistor colour code, as on many probe cables (black is shown light grey)
  var COLOURS = ["#9aa4b2", "#b5763c", "#e5484d", "#f08c2e", "#f2d03b", "#3fb950", "#4c9aff", "#b48cf2", "#c5c8d0", "#f5f7fa"];
  var ANALOG = ["#ff7eb6", "#56d4dd", "#ffb86b", "#a5e075", "#9db4ff", "#ff9b8f", "#e6c07b", "#c3a6ff"];

  // ================================================================ the capture
  /* o: { rate, n, words (typed array, may be null), digital: [{id, name}], analog: [{id, name, data, unit}],
   *      trigger (sample index or null), source (text) } */
  function Capture(o) {
    this.rate = o.rate;
    this.n = o.n;
    this.trigger = o.trigger == null ? null : o.trigger;
    this.source = o.source || "";
    this.date = o.date || new Date();
    this.channels = [];
    var self = this;
    if (o.words && o.digital && o.digital.length) {
      var ws = new WordStore(o.words);
      o.digital.forEach(function (c, i) {
        self.channels.push({ id: c.id, name: c.name || c.id, kind: "d", store: ws, bit: c.bit != null ? c.bit : i,
          color: c.color || COLOURS[(c.bit != null ? c.bit : i) % COLOURS.length], visible: c.visible !== false });
      });
    }
    (o.analog || []).forEach(function (c, i) {
      self.channels.push({ id: c.id, name: c.name || c.id, kind: "a", store: new AnalogStore(c.data), unit: c.unit || "",
        color: c.color || ANALOG[i % ANALOG.length], visible: c.visible !== false, fixedMin: c.fixedMin, fixedMax: c.fixedMax });
    });
  }
  Capture.prototype.channel = function (id) {
    for (var i = 0; i < this.channels.length; i++) if (this.channels[i].id === id) return this.channels[i];
    return null;
  };
  Capture.prototype.duration = function () { return this.n / this.rate; };
  // a digital channel made from an analog one with a threshold and some hysteresis
  Capture.prototype.addThreshold = function (aid, level, hyst) {
    var a = this.channel(aid);
    if (!a || a.kind !== "a") return null;
    var d = a.store.data, n = d.length, out = new Uint8Array(n);
    var hi = level + hyst / 2, lo = level - hyst / 2, v = d[0] > level ? 1 : 0;
    for (var i = 0; i < n; i++) {
      var x = d[i];
      if (v) { if (x < lo) v = 0; } else if (x > hi) v = 1;
      out[i] = v;
    }
    var id = aid + "~", old = this.channel(id), ch = { id: id, name: a.name + " (digital)", kind: "d", store: new WordStore(out), bit: 0,
      color: a.color, visible: true, from: aid, level: level, hyst: hyst };
    if (old) { ch.name = old.name; ch.color = old.color; this.channels[this.channels.indexOf(old)] = ch; }
    else this.channels.splice(this.channels.indexOf(a) + 1, 0, ch);
    return ch;
  };
  Capture.prototype.removeChannel = function (id) {
    var c = this.channel(id);
    if (c) this.channels.splice(this.channels.indexOf(c), 1);
  };
  // what decoders see
  Capture.prototype.signal = function () {
    var self = this;
    return {
      rate: this.rate, n: this.n,
      has: function (id) { var c = self.channel(id); return !!(c && c.kind === "d"); },
      edges: function (id) { var c = self.channel(id); return c.store.edges(c.bit); },
      at: function (id, s) {
        var c = self.channel(id);
        if (s < 0) s = 0; else if (s >= self.n) s = self.n - 1;
        return (c.store.data[s] >>> c.bit) & 1;
      }
    };
  };
  // value of a digital channel at a sample
  Capture.prototype.bitAt = function (c, s) {
    if (s < 0) s = 0; else if (s >= this.n) s = this.n - 1;
    return (c.store.data[s] >>> c.bit) & 1;
  };

  // ================================================================ helpers
  // first index in a sorted array with arr[i] >= v
  function lowerBound(arr, v, lo, hi) {
    lo = lo || 0; hi = hi == null ? arr.length : hi;
    while (lo < hi) { var m = (lo + hi) >>> 1; if (arr[m] < v) lo = m + 1; else hi = m; }
    return lo;
  }
  var UNITS = [[1, "s"], [1e-3, "ms"], [1e-6, "µs"], [1e-9, "ns"], [1e-12, "ps"]];
  function fmtTime(t, digits) {
    if (t === 0) return "0 s";
    var a = Math.abs(t), u = UNITS[UNITS.length - 1];
    for (var i = 0; i < UNITS.length; i++) if (a >= UNITS[i][0] * 0.9995) { u = UNITS[i]; break; }
    var v = t / u[0], d = digits == null ? (Math.abs(v) >= 100 ? 1 : Math.abs(v) >= 10 ? 2 : 3) : digits;
    return (+v.toFixed(d)).toString() + " " + u[1];
  }
  function fmtFreq(f) {
    if (!isFinite(f) || f <= 0) return "–";
    var u = f >= 1e6 ? [1e6, "MHz"] : f >= 1e3 ? [1e3, "kHz"] : [1, "Hz"], v = f / u[0];
    return (+v.toFixed(v >= 100 ? 1 : v >= 10 ? 2 : 3)).toString() + " " + u[1];
  }
  function fmtRate(r) { return fmtFreq(r).replace("Hz", "S/s").replace("kS/s", "kS/s"); }
  function fmtCount(n) {
    if (n >= 1e6 && n % 1e5 === 0) return n / 1e6 + " M";
    if (n >= 1e3 && n % 100 === 0) return n / 1e3 + " k";
    return String(n);
  }

  global.SA = global.SA || {};
  global.SA.WordStore = WordStore;
  global.SA.AnalogStore = AnalogStore;
  global.SA.Capture = Capture;
  global.SA.COLOURS = COLOURS;
  global.SA.lowerBound = lowerBound;
  global.SA.fmtTime = fmtTime;
  global.SA.fmtFreq = fmtFreq;
  global.SA.fmtRate = fmtRate;
  global.SA.fmtCount = fmtCount;
})(typeof window !== "undefined" ? window : globalThis);
