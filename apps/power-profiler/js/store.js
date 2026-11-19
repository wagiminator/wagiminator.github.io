/* Power Profiler: the recording. Current (A) and the 8 logic channels per sample, kept in chunks
 * that grow while recording, with a pyramid of block summaries (min, max, sum, count, OR and AND
 * of the logic bits) so that any stretch can be summed up quickly, from 10 µs to hours. */
(function (global) {
  "use strict";

  var CH = 1 << 16;          // samples per chunk
  var B0 = 32, F = 8;        // block size of the first level, factor between the levels

  function Grow(T, n) { this.T = T; this.a = new T(n || 1024); this.n = 0; }
  Grow.prototype.push = function (v) {
    if (this.n === this.a.length) { var b = new this.T(this.a.length * 2); b.set(this.a); this.a = b; }
    this.a[this.n++] = v;
  };

  function Level(bs) {
    this.bs = bs;
    this.min = new Grow(Float32Array); this.max = new Grow(Float32Array);
    this.sum = new Grow(Float64Array); this.cnt = new Grow(Uint32Array);
    this.or = new Grow(Uint8Array); this.and = new Grow(Uint8Array);
    this.reset();
  }
  Level.prototype.reset = function () { this.k = 0; this.lo = Infinity; this.hi = -Infinity; this.s = 0; this.c = 0; this.o = 0; this.a = 255; this.any = false; };
  Level.prototype.add = function (lo, hi, s, c, o, a, any) {
    if (lo < this.lo) this.lo = lo;
    if (hi > this.hi) this.hi = hi;
    this.s += s; this.c += c;
    if (any) { this.o |= o; this.a &= a; this.any = true; }
  };
  Level.prototype.flush = function () {
    this.min.push(this.lo); this.max.push(this.hi); this.sum.push(this.s); this.cnt.push(this.c);
    this.or.push(this.any ? this.o : 0); this.and.push(this.any ? this.a : 0);
    var r = [this.lo, this.hi, this.s, this.c, this.o, this.a, this.any];
    this.reset();
    return r;
  };

  /* rate: samples per second; max: the most samples to keep */
  function Store(rate, max) {
    this.rate = rate;
    this.max = max || Infinity;
    this.n = 0;
    this.cur = []; this.bits = [];
    this.levels = [new Level(B0)];
    this.lost = 0;
  }
  var P = Store.prototype;
  // one sample: current in A (NaN when lost), logic bits; false when the store is full
  P.push = function (v, b) {
    if (this.n >= this.max) return false;
    var c = this.n >> 16, i = this.n & (CH - 1);
    if (i === 0) { this.cur.push(new Float32Array(CH)); this.bits.push(new Uint8Array(CH)); }
    this.cur[c][i] = v; this.bits[c][i] = b;
    this.n++;
    var L = this.levels[0], ok = v === v;
    if (ok) { if (v < L.lo) L.lo = v; if (v > L.hi) L.hi = v; L.s += v; L.c++; L.o |= b; L.a &= b; L.any = true; }
    else this.lost++;
    if (++L.k === B0) this.cascade(0);
    return true;
  };
  P.cascade = function (k) {
    var r = this.levels[k].flush();
    if (!this.levels[k + 1]) this.levels.push(new Level(this.levels[k].bs * F));
    var U = this.levels[k + 1];
    U.add(r[0], r[1], r[2], r[3], r[4], r[5], r[6]);
    if (++U.k === F) this.cascade(k + 1);
  };
  P.at = function (i) { return this.cur[i >> 16][i & (CH - 1)]; };
  P.bitsAt = function (i) { return this.bits[i >> 16][i & (CH - 1)]; };
  P.duration = function () { return this.n / this.rate; };
  // summary of the samples s0 … s1-1: { min, max, sum, cnt, or, and }
  P.range = function (s0, s1, out) {
    out = out || {};
    s0 = Math.max(0, Math.floor(s0)); s1 = Math.min(this.n, Math.ceil(s1));
    var lo = Infinity, hi = -Infinity, sum = 0, cnt = 0, or = 0, and = 255, any = false, L = this.levels;
    var top = L.length - 1;
    while (top >= 0 && (L[top].bs > s1 - s0 || L[top].min.n === 0)) top--;
    while (s0 < s1) {
      var k = top;
      for (; k >= 0; k--) { var bs = L[k].bs; if (s0 % bs === 0 && s0 + bs <= s1 && s0 / bs < L[k].min.n) break; }
      if (k < 0) {
        var v = this.at(s0), b = this.bitsAt(s0);
        if (v === v) { if (v < lo) lo = v; if (v > hi) hi = v; sum += v; cnt++; or |= b; and &= b; any = true; }
        s0++;
      } else {
        var lv = L[k], j = s0 / lv.bs;
        if (lv.cnt.a[j]) {
          if (lv.min.a[j] < lo) lo = lv.min.a[j];
          if (lv.max.a[j] > hi) hi = lv.max.a[j];
          sum += lv.sum.a[j]; cnt += lv.cnt.a[j]; or |= lv.or.a[j]; and &= lv.and.a[j]; any = true;
        }
        s0 += lv.bs;
      }
    }
    out.min = lo; out.max = hi; out.sum = sum; out.cnt = cnt; out.or = any ? or : 0; out.and = any ? and : 0; out.any = any;
    return out;
  };
  P.bytes = function () { return this.n * 5; };

  // a store from saved arrays
  Store.from = function (rate, cur, bits) {
    var s = new Store(rate, cur.length);
    for (var i = 0; i < cur.length; i++) s.push(cur[i], bits[i]);
    return s;
  };

  global.PP = global.PP || {};
  global.PP.Store = Store;
})(window);
