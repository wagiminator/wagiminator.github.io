/* C64 Packer: the Exomizer 3 format (bit stream with Elias gamma codes and tables of bit
 * counts that are chosen for each file; packs small, unpacks more slowly).
 *
 * The bit stream is the one of Exomizer 3 by Magnus Lind ("raw" mode, protocol flags -P,
 * default 39). The packer here is its own: an optimal parse with the cost of the current
 * tables, then new tables from the parse, a few times over. The data unpacks with the
 * Exomizer decrunchers (exodecrunch.s, exomizer raw -d) set to the same flags.
 */
(function (global) {
  "use strict";

  var BE = 1, GT7 = 2, IMPL1 = 4, ALIGN = 8, FOUR = 16, REUSE = 32;
  var INF = 1e15;

  // ---------------------------------------------------------------- unpacking (forward)
  // hook(kind, length, bytes read before the item): for the in-place check
  function unpack(inp, flags, hook) {
    var pos = 0, bitbuf = 0, out = [];
    function byte() {
      if (pos >= inp.length) throw new Error("The packed data ends too early.");
      return inp[pos++];
    }
    function rotate(carry) {
      var c;
      if (flags & BE) { c = (bitbuf >> 7) & 1; bitbuf = ((bitbuf << 1) | carry) & 0xFF; }
      else { c = bitbuf & 1; bitbuf = (bitbuf >> 1) | (carry << 7); }
      return c;
    }
    function bits(count) {
      var copy = 0, val = 0;
      if ((flags & GT7) && count > 7) { copy = count >> 3; count &= 7; }
      while (count-- > 0) {
        var c = rotate(0);
        if (bitbuf === 0) { bitbuf = byte(); c = rotate(1); }
        val = (val << 1) | c;
      }
      while (copy-- > 0) val = (val << 8) | byte();
      return val;
    }
    function gamma() { var g = 0; while (bits(1) === 0) g++; return g; }
    bitbuf = (flags & ALIGN) ? 0 : byte();
    // the tables
    var four = flags & FOUR, end = four ? 68 : 52;
    var tbit = four ? [2, 4, 4, 4] : [2, 4, 4], toff = four ? [64, 48, 32, 16] : [48, 32, 16];
    var bi = [], base = [], a = 0, b = 0;
    for (var i = 0; i < end; i++) {
      a = (i & 15) ? a + (1 << b) : 1;
      base[i] = a;
      b = (flags & GT7) ? bits(3) | (bits(1) << 3) : bits(4);
      bi[i] = b;
    }
    var thr = four ? 4 : 3, state = 1, literal = 1, offset = 0, first = !!(flags & IMPL1);
    for (;;) {
      var len, src = -1, isLit = false, c0 = pos;
      if (first) { first = false; isLit = true; len = 1; }
      else {
        state = ((state << 1) | literal) & 0xFF;
        if (bits(1)) { isLit = true; len = 1; }
        else {
          var g = gamma();
          if (g === 16) break;
          if (g === 17) { len = bits(16); isLit = true; }
          else {
            len = base[g] + bits(bi[g]);
            var reuse = 0;
            if ((flags & REUSE) && (state & 3) === 1) reuse = bits(1);
            if (!reuse) {
              var j = Math.min(len, thr) - 1, idx = toff[j] + bits(tbit[j]);
              offset = base[idx] + bits(bi[idx]);
            }
            src = out.length - offset;
            if (src < 0) throw new Error("The packed data is broken.");
          }
        }
      }
      literal = isLit ? 1 : 0;
      if (hook) hook(isLit ? "lit" : "match", len, c0);
      for (var k = 0; k < len; k++) out.push(isLit ? byte() : out[src + k]);
    }
    return new Uint8Array(out);
  }

  // ---------------------------------------------------------------- bit writer (forward)
  function Writer(flags) {
    this.flags = flags; this.out = []; this.slot = -1; this.n = 0; this.cap = 8; this.init = -1;
    if (!(flags & ALIGN)) { this.out.push(0); this.slot = 0; this.cap = 7; this.init = 0; }
  }
  Writer.prototype.bit = function (b) {
    if (this.slot < 0 || this.n >= this.cap) { this.close(); this.out.push(0); this.slot = this.out.length - 1; this.n = 0; this.cap = 8; }
    if (b) this.out[this.slot] |= (this.flags & BE) ? 0x80 >> this.n : 1 << this.n;
    this.n++;
  };
  // the first byte ends with a marker bit right after its data bits
  Writer.prototype.close = function () {
    if (this.slot === this.init && this.init >= 0) {
      this.out[this.init] |= (this.flags & BE) ? 0x80 >> this.n : 1 << this.n;
      this.init = -1;
    }
  };
  Writer.prototype.bits = function (count, val) {
    var copy = 0;
    if ((this.flags & GT7) && count > 7) { copy = count >> 3; count &= 7; }
    for (var i = count - 1; i >= 0; i--) this.bit((val >> (i + 8 * copy)) & 1);
    for (i = copy - 1; i >= 0; i--) this.out.push((val >> (8 * i)) & 0xFF);
  };
  Writer.prototype.gamma = function (g) { for (var i = 0; i < g; i++) this.bit(0); this.bit(1); };
  Writer.prototype.byte = function (b) { this.out.push(b & 0xFF); };
  Writer.prototype.done = function () { this.close(); return new Uint8Array(this.out); };

  // ---------------------------------------------------------------- tables
  // a table: 16 (or 4) bit counts; value v is in bucket i when base[i] <= v < base[i] + 2^bits[i]
  function makeTable(bitsList) {
    var base = [], a = 1;
    for (var i = 0; i < bitsList.length; i++) { base.push(a); a += 1 << bitsList[i]; }
    return { bits: bitsList, base: base, end: a };
  }
  // bits to write value v with a table (prefix: bits to choose the bucket), or INF
  function costTable(t, v, gammaPrefix, prefixBits) {
    if (v < 1 || v >= t.end) return INF;
    var b = t.base, i = b.length - 1;
    while (b[i] > v) i--;
    return (gammaPrefix ? i + 1 : prefixBits) + t.bits[i];
  }
  // the best bit counts for a histogram of values (counts[v]); prefix cost of bucket i
  function optimiseTable(counts, size, prefix) {
    var max = counts.length - 1;
    while (max > 0 && !counts[max]) max--;
    var P = new Float64Array(counts.length + 1);
    for (var v = 0; v < counts.length; v++) P[v + 1] = P[v] + (counts[v] || 0);
    function sum(a, b) { a = Math.min(a, counts.length); b = Math.min(b, counts.length); return a >= b ? 0 : P[b] - P[a]; }
    // f[i][s]: cheapest cost for values >= s with buckets i..size-1
    var lim = Math.min(65536, max + 1) + 1;
    var f = [], ch = [];
    for (var i = size; i >= 0; i--) { f[i] = new Float64Array(lim + 1); ch[i] = new Int8Array(lim + 1); }
    for (var s = 0; s <= lim; s++) f[size][s] = s > max ? 0 : INF;
    for (i = size - 1; i >= 0; i--) {
      for (s = 1; s <= lim; s++) {
        if (s > max) { f[i][s] = 0; ch[i][s] = 0; continue; }
        var best = INF, bb = 0;
        for (var b = 0; b < 16; b++) {
          var e = s + (1 << b), c = sum(s, e) * (prefix(i) + b) + f[i + 1][Math.min(e, lim)];
          if (c < best) { best = c; bb = b; }
          if (e > max) break;
        }
        f[i][s] = best; ch[i][s] = bb;
      }
    }
    var res = [], st = 1;
    for (i = 0; i < size; i++) { var bi = st <= lim ? ch[i][Math.min(st, lim)] : 0; res.push(bi); st += 1 << bi; }
    return res;
  }

  // ---------------------------------------------------------------- matches
  // for every position: the matches worth looking at, as [length, offset] pairs
  function findMatches(src, maxChain) {
    var n = src.length, head = new Int32Array(65536).fill(-1), prev = new Int32Array(n).fill(-1);
    var lastByte = new Int32Array(256).fill(-1);
    var res = new Array(n);
    for (var i = 0; i < n; i++) {
      var list = [];
      // one byte, from close by
      if (lastByte[src[i]] >= 0) list.push([1, i - lastByte[src[i]]]);
      lastByte[src[i]] = i;
      if (i + 1 < n) {
        var key = src[i] | (src[i + 1] << 8), j = head[key], steps = 0, bestLen = 1;
        var maxLen = Math.min(65535, n - i);
        while (j >= 0 && i - j <= 65535 && steps++ < maxChain) {
          if (src[j + bestLen] === src[i + bestLen] || bestLen === 1) {
            var l = 2;
            while (l < maxLen && src[j + l] === src[i + l]) l++;
            if (l > bestLen) { list.push([l, i - j]); bestLen = l; if (l >= maxLen) break; }
          }
          j = prev[j];
        }
        prev[i] = head[key]; head[key] = i;
      }
      res[i] = list;
    }
    return res;
  }

  // ---------------------------------------------------------------- packing
  function Tables(flags, len, offs) {
    this.len = makeTable(len);
    this.offs = offs.map(makeTable);       // by length: 1, 2, (3,) the rest
    this.four = !!(flags & FOUR);
  }
  Tables.prototype.lenCost = function (l) { return costTable(this.len, l, true); };
  Tables.prototype.offCost = function (l, o) {
    var j = Math.min(l, this.four ? 4 : 3) - 1;
    return costTable(this.offs[j], o, false, j === 0 ? 2 : 4);
  };

  function parse(src, matches, T, flags) {
    var n = src.length, cost = new Float64Array(n + 1).fill(INF);
    var from = new Int32Array(n + 1).fill(-1), what = new Array(n + 1);
    var kind = new Int8Array(n + 1), pkind = new Int8Array(n + 1), last = new Int32Array(n + 1);
    var reuse = !!(flags & REUSE), start = 0;
    if (flags & IMPL1) { cost[1] = 8; from[1] = 0; what[1] = { lit: 1 }; kind[1] = 1; pkind[1] = 1; start = 1; }
    else { cost[0] = 0; kind[0] = 1; pkind[0] = 1; }
    // literal runs: 1 + 18 + 16 + 8 per byte; the best start so far
    var seqBest = -1, seqVal = INF;
    function set(u, v, c, w, k, lo) {
      if (c < cost[v]) { cost[v] = c; from[v] = u; what[v] = w; kind[v] = k; pkind[v] = kind[u]; last[v] = lo; }
    }
    var lenSteps = [];
    for (var i = 0; i < 16; i++) { lenSteps.push(T.len.base[i]); lenSteps.push(T.len.base[i] + (1 << T.len.bits[i]) - 1); }
    for (var u = start; u < n; u++) {
      if (cost[u] >= INF) continue;
      // a literal run starting here could reach further positions
      var sv = cost[u] - 8 * u;
      if (sv < seqVal) { seqVal = sv; seqBest = u; }
      // one literal
      set(u, u + 1, cost[u] + 9, { lit: 1 }, 1, last[u]);
      var canReuse = reuse && kind[u] === 1 && pkind[u] === 0;
      var list = matches[u];
      if (canReuse && last[u] > 0 && last[u] <= u) {
        // the offset of the last match costs one bit
        var ro = last[u], rl = 0, rmax = Math.min(65535, n - u);
        while (rl < rmax && src[u + rl] === src[u + rl - ro]) rl++;
        if (rl > 0) list = list.concat([[rl, ro, true]]);
      }
      for (var m = 0; m < list.length; m++) {
        var L = list[m][0], o = list[m][1];
        if (o > u) continue;
        var lens = L <= 32 ? null : lenSteps;
        var lo = list[m][2] ? 1 : m > 0 ? list[m - 1][0] + 1 : 1;
        var tryLen = function (l) {
          if (l < 1 || l > L || l < lo) return;
          var lc = T.lenCost(l);
          if (lc >= INF) return;
          var oc, c2;
          if (canReuse && o === last[u]) oc = 1;
          else { oc = T.offCost(l, o); if (oc >= INF) return; if (canReuse) oc += 1; }
          c2 = cost[u] + 1 + lc + oc;
          set(u, u + l, c2, { len: l, off: o }, 0, o);
        };
        if (!lens) for (var l = lo; l <= L; l++) tryLen(l);
        else {
          for (l = lo; l <= Math.min(L, 32); l++) tryLen(l);
          for (var s = 0; s < lens.length; s++) if (lens[s] > 32) tryLen(lens[s]);
          tryLen(L);
        }
      }
      // a literal run ending at u + 1 (from seqBest): only worth it for long runs
      var v = u + 1;
      if (seqBest >= 0 && v - seqBest >= 2 && v - seqBest <= 65535) {
        var cs = seqVal + 35 + 8 * v;
        if (cs < cost[v]) {
          cost[v] = cs; from[v] = seqBest; what[v] = { lit: v - seqBest }; kind[v] = 1; pkind[v] = kind[seqBest]; last[v] = last[seqBest];
        }
      }
    }
    var items = [];
    for (v = n; v > 0 && from[v] >= 0; v = from[v]) items.push({ pos: from[v], w: what[v] });
    if (v !== 0) throw new Error("The packer found no way through the data.");
    items.reverse();
    return { items: items, cost: cost[n] };
  }

  function histograms(items, flags) {
    var four = flags & FOUR, lens = new Float64Array(65537), offs = [];
    for (var k = 0; k < (four ? 4 : 3); k++) offs.push(new Float64Array(65537));
    var kindPrev = 1, kindPrev2 = 1, lastOff = 0;
    items.forEach(function (it, i) {
      var w = it.w;
      if (w.lit) { kindPrev2 = kindPrev; kindPrev = 1; return; }
      lens[w.len]++;
      var reused = (flags & REUSE) && kindPrev === 1 && kindPrev2 === 0 && w.off === lastOff;
      if (!reused) offs[Math.min(w.len, four ? 4 : 3) - 1][w.off]++;
      lastOff = w.off; kindPrev2 = kindPrev; kindPrev = 0;
    });
    return { lens: lens, offs: offs };
  }

  // flags: protocol flags (default 39); opts.maxChain, opts.passes
  function pack(src, flags, opts) {
    if (flags == null) flags = 39;
    opts = opts || {};
    if (!src.length) throw new Error("There is nothing to pack.");
    var four = flags & FOUR;
    var full = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    var T = new Tables(flags, full, four ? [[0, 1, 2, 3], full, full, full] : [[0, 1, 2, 3], full, full]);
    var matches = findMatches(src, opts.maxChain || 256);
    var best = null, bestCost = INF;
    for (var pass = 0; pass < (opts.passes || 8); pass++) {
      var r = parse(src, matches, T, flags);
      if (r.cost >= bestCost - 0.5) break;
      best = { items: r.items, T: T }; bestCost = r.cost;
      var h = histograms(r.items, flags);
      var nlen = optimiseTable(h.lens, 16, function (i) { return i + 1; });
      var noffs = h.offs.map(function (c, j) { return optimiseTable(c, j === 0 ? 4 : 16, function () { return j === 0 ? 2 : 4; }); });
      T = new Tables(flags, nlen, noffs);
    }
    return write(src, best.items, best.T, flags);
  }

  function write(src, items, T, flags) {
    var w = new Writer(flags), four = flags & FOUR, i;
    // the tables: lengths, then offsets for the longest group down to length 1
    var order = [T.len].concat(T.offs.slice().reverse());
    order.forEach(function (t, k) {
      var size = k === order.length - 1 ? 4 : 16;
      for (i = 0; i < size; i++) {
        var b = t.bits[i] || 0;
        if (flags & GT7) { w.bits(3, b & 7); w.bits(1, b >> 3); } else w.bits(4, b);
      }
    });
    var kindPrev = 1, kindPrev2 = 1, lastOff = 0, first = !!(flags & IMPL1);
    items.forEach(function (it) {
      var x = it.w;
      if (x.lit) {
        if (first) { first = false; w.byte(src[it.pos]); kindPrev2 = kindPrev; kindPrev = 1; return; }
        if (x.lit === 1) { w.bit(1); w.byte(src[it.pos]); }
        else {
          w.bit(0); w.gamma(17); w.bits(16, x.lit);
          for (var k = 0; k < x.lit; k++) w.byte(src[it.pos + k]);
        }
        kindPrev2 = kindPrev; kindPrev = 1;
        return;
      }
      var l = x.len, o = x.off, t = T.len, g = 15;
      while (t.base[g] > l) g--;
      w.bit(0); w.gamma(g); w.bits(t.bits[g], l - t.base[g]);
      var canReuse = (flags & REUSE) && kindPrev === 1 && kindPrev2 === 0;
      var reused = canReuse && o === lastOff;
      if (canReuse) w.bit(reused ? 1 : 0);
      if (!reused) {
        var j = Math.min(l, four ? 4 : 3) - 1, ot = T.offs[j], n = ot.bits.length - 1;
        while (ot.base[n] > o) n--;
        w.bits(j === 0 ? 2 : 4, n);
        w.bits(ot.bits[n], o - ot.base[n]);
      }
      lastOff = o; kindPrev2 = kindPrev; kindPrev = 0;
    });
    w.bit(0); w.gamma(16);
    return w.done();
  }

  global.Exomizer = { pack: pack, unpack: unpack, FLAGS: { BE: BE, GT7: GT7, IMPL1: IMPL1, ALIGN: ALIGN, FOUR: FOUR, REUSE: REUSE } };
})(typeof window !== "undefined" ? window : globalThis);
