/* C64 Packer: the TSCrunch format (byte-aligned LZ and RLE, fast to unpack on the 6502).
 *
 * The format and the optimal parse follow TSCrunch 1.3 by Antonio Savona
 * (https://github.com/tonysavon/TSCrunch, Apache License 2.0, see LICENSE-tscrunch.txt);
 * this is a JavaScript port of its C encoder, so the packed data is the same.
 *
 * Tokens (unpacked from the front):
 *   $01-$1F n          n literal bytes follow
 *   $20                end of the data
 *   $21-$7E            2 bytes from 127 - token back
 *   $81                a run of zeros (the length is in the header or the unpacker)
 *   $83-$FF (bit 0 set) b   run: (token >> 1 & $3F) + 1 times byte b
 *   bit 1 set, bit 0 clear  o   short match: length (token >> 2 & $1F) + 1, offset o
 *   bits 0-1 clear     lo hi   long match: length ((token >> 2 & $1F) << 1 | hi >> 7) + 1,
 *                              offset -(lo | (hi & $7F) << 8)
 */
(function (global) {
  "use strict";

  var LONGESTRLE = 64, LONGESTLONGLZ = 64, LONGESTLZ = 32, LONGESTLITERAL = 31;
  var MINRLE = 2, MINLZ = 3, MINLZOFFSET = 2, LZOFFSET = 256, LONGLZOFFSET = 32767, LZ2OFFSET = 94;
  var TERMINATOR = LONGESTLITERAL + 1;
  var LIT = 0, RLE = 1, LZ = 2, LZ2 = 3, ZERO = 4;
  var MDIV = 4294967296;          // 2^32: bytes first, decoding time breaks ties

  function optimalZero(src, len) {
    var counts = new Int32Array(257), first = new Int32Array(257).fill(-1), order = 0, i = 0;
    while (i < len - 1) {
      if (src[i] === 0) {
        var j = i + 1;
        while (j < len && src[j] === 0 && j - i < 256) j++;
        var run = j - i;
        if (run >= MINRLE && run <= 256) { if (first[run] < 0) first[run] = order++; counts[run]++; }
        i = j;
      } else i++;
    }
    var best = LONGESTRLE, bestScore = 0, bestFirst = Infinity;
    for (var r = MINRLE; r <= 256; r++) {
      if (!counts[r]) continue;
      var score = r * Math.pow(counts[r], 1.1);
      if (score > bestScore || (score === bestScore && first[r] >= 0 && first[r] < bestFirst)) { bestScore = score; best = r; bestFirst = first[r]; }
    }
    return best;
  }
  function isLong(t) { return t.offset >= LZOFFSET || t.size > LONGESTLZ; }
  function cost(t) {
    var s = t.size;
    switch (t.type) {
      case LZ: return isLong(t) ? MDIV * 3 + 196 + 31 * s - 7 * (s & 1) : MDIV * 2 + 156 + 31 * s - 7 * (s & 1);
      case RLE: return MDIV * 2 + 112 + 19 * s - (s & 1);
      case ZERO: return MDIV + 112 + 19 * s;
      case LZ2: return MDIV + 148;
      case LIT: return MDIV * (s + 1) + 78 + 29 * s + 5 * (s & 1);
    }
    return MDIV * 10;
  }
  // the nearest earlier position with the same three bytes
  function prefixChains(src, len) {
    var prev = new Int32Array(len).fill(-1), heads = new Map();
    for (var i = 0; i + MINLZ <= len; i++) {
      var key = (src[i] << 16) | (src[i + 1] << 8) | src[i + 2];
      var h = heads.get(key);
      prev[i] = h === undefined ? -1 : h;
      heads.set(key, i);
    }
    return prev;
  }

  // Pack data; header: true puts the length of a zero run in front (the "mem" format),
  // false leaves it out (the unpacker gets it on its own, like the self-extracting files).
  // Returns { data, zeroRun }
  function pack(src, header) {
    var len = src.length, zeroRun = optimalZero(src, len);
    var chains = prefixChains(src, len);
    // the best way to every position (dist in a Float64: exact up to 2^53)
    var dist = new Float64Array(len + 1).fill(Infinity), prev = new Int32Array(len + 1).fill(-1), tok = new Array(len + 1);
    dist[0] = 0;
    function relax(u, v, t) {
      var alt = dist[u] + cost(t), better = alt < dist[v];
      if (alt === dist[v] && prev[v] >= 0) better = dist[u] < dist[prev[v]];
      if (better) { dist[v] = alt; prev[v] = u; tok[v] = t; }
    }
    for (var u = 0; u < len; u++) {
      if (dist[u] === Infinity) continue;
      var edges = {}, sizes = [], k;
      // runs
      var rle = 0;
      while (u + rle < len && rle < LONGESTRLE + 1 && src[u + rle] === src[u]) rle++;
      var rleCap = Math.min(rle, LONGESTRLE);
      // matches
      var sm = { size: 0, offset: 0 }, lm = { size: 0, offset: 0 };
      if (rleCap < LONGESTLONGLZ - 1) {
        var minlz = Math.max(rleCap + 1, MINLZ);
        if (len - u >= minlz) {
          var x0 = Math.max(0, u - LONGLZOFFSET), j = chains[u];
          while (j >= x0) {
            var ok = true;
            for (k = 0; k < minlz; k++) if (src[j + k] !== src[u + k]) { ok = false; break; }
            if (ok) {
              var off = u - j;
              if (off >= MINLZOFFSET) {
                var l = minlz;
                while (u + l < len && l < LONGESTLONGLZ && src[j + l] === src[u + l]) l++;
                if (off < LZOFFSET) {
                  var sl = Math.min(l, LONGESTLZ);
                  if (sl > sm.size || (sl === sm.size && off < sm.offset)) sm = { size: sl, offset: off };
                }
                if (l > lm.size || (l === lm.size && off < lm.offset)) lm = { size: l, offset: off };
              }
            }
            j = chains[j];
          }
        }
      }
      for (k = sm.size; k >= MINLZ && k > rleCap; k--) edges[k] = { type: LZ, pos: u, size: k, offset: sm.offset };
      var longMin = Math.max(MINLZ, rleCap + 1, sm.size + 1);
      for (k = lm.size; k >= longMin; k--) edges[k] = { type: LZ, pos: u, size: k, offset: lm.offset };
      if (rle > LONGESTRLE) edges[LONGESTRLE] = { type: RLE, pos: u, size: LONGESTRLE, rlebyte: src[u] };
      else for (k = rle; k >= MINRLE; k--) edges[k] = { type: RLE, pos: u, size: k, rlebyte: src[u] };
      // two bytes from close by
      if (u + 2 <= len) {
        for (j = u - 1; j >= Math.max(0, u - LZ2OFFSET); j--) {
          if (src[j] === src[u] && src[j + 1] === src[u + 1]) { edges[2] = { type: LZ2, pos: u, size: 2, offset: u - j }; break; }
        }
      }
      // the zero run of the header
      if (u + zeroRun <= len) {
        var zr = true;
        for (k = 0; k < zeroRun; k++) if (src[u + k] !== 0) { zr = false; break; }
        if (zr) edges[zeroRun] = { type: ZERO, pos: u, size: zeroRun };
      }
      var lits = 0;
      for (k = 1; k <= 256; k++) {
        var t = edges[k];
        if (!t || u + k > len) continue;
        relax(u, u + k, t);
        if (k <= LONGESTLITERAL) lits |= 1 << k;
      }
      var litMax = Math.min(LONGESTLITERAL, len - u);
      for (k = 1; k <= litMax; k++) {
        if (lits & (1 << k)) continue;
        relax(u, u + k, { type: LIT, pos: u, size: k });
      }
    }
    var list = [];
    for (var v = len; v > 0; v = prev[v]) list.push(tok[v]);
    list.reverse();
    var out = [];
    if (header) out.push(zeroRun - 1);
    list.forEach(function (t) {
      switch (t.type) {
        case LIT: out.push(t.size & 0x1F); for (var i = 0; i < t.size; i++) out.push(src[t.pos + i]); break;
        case RLE: out.push(0x81 | (((t.size - 1) << 1) & 0x7F), t.rlebyte); break;
        case ZERO: out.push(0x81); break;
        case LZ2: out.push(127 - t.offset); break;
        case LZ:
          if (isLong(t)) {
            var neg = (0x10000 - t.offset) & 0xFFFF;
            out.push(0x80 | ((((t.size - 1) >> 1) << 2) & 0x7F), neg & 0xFF, ((neg >> 8) & 0x7F) | (((t.size - 1) & 1) << 7));
          } else out.push(0x80 | (((t.size - 1) << 2) & 0x7F) | 2, t.offset & 0xFF);
          break;
      }
    });
    out.push(TERMINATOR);
    return { data: new Uint8Array(out), zeroRun: zeroRun, tokens: list.length };
  }

  // Unpack (for checking); zeroRun: null when the data has the header byte
  function unpack(p, zeroRun) {
    var i = 0, out = [];
    if (zeroRun == null) zeroRun = p[i++] + 1;
    for (;;) {
      var b = p[i++];
      if (b === undefined) throw new Error("The packed data ends too early.");
      if (b < 0x80) {
        if (b < 0x20) { for (var k = 0; k < b; k++) out.push(p[i++]); }
        else if (b === 0x20) break;
        else { var o = 127 - b, s = out.length - o; out.push(out[s]); out.push(out[s + 1]); }
      } else if (b & 1) {
        if (b === 0x81) for (k = 0; k < zeroRun; k++) out.push(0);
        else { var n = ((b >> 1) & 0x3F) + 1, v = p[i++]; for (k = 0; k < n; k++) out.push(v); }
      } else {
        var len, off;
        if (b & 2) { len = ((b >> 2) & 0x1F) + 1; off = p[i++]; }
        else {
          var lo = p[i++], hi = p[i++];
          len = ((((b >> 2) & 0x1F) << 1) | (hi >> 7)) + 1;
          off = 0x10000 - (lo | (((hi & 0x7F) | 0x80) << 8));
        }
        s = out.length - off;
        for (k = 0; k < len; k++) out.push(out[s + k]);
      }
    }
    return new Uint8Array(out);
  }

  global.TSCrunch = { pack: pack, unpack: unpack };
})(typeof window !== "undefined" ? window : globalThis);
