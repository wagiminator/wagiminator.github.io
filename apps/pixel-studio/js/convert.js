/* C64 Pixel Studio: image converter. Turns an RGB picture (already scaled to 160x200 for
 * multicolour or 320x200 for hires) into a C64 bitmap that keeps the colour limits:
 * multicolour: one background colour and three colours per 4x8 cell;
 * hires: two colours per 8x8 cell. */
(function (global) {
  "use strict";

  var G = global.C64G;
  var BAYER = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
               3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21];

  // brightness/contrast -100..100, saturation 0..200 (%)
  function adjust(src, o) {
    var d = new Float32Array(src.length / 4 * 3);
    var br = (o.brightness || 0) * 1.28, ct = 1 + (o.contrast || 0) / 100, sat = (o.saturation == null ? 100 : o.saturation) / 100;
    for (var i = 0, j = 0; i < src.length; i += 4, j += 3) {
      var a = src[i + 3] / 255, r = src[i] * a + 255 * (1 - a) * (o.alphaWhite ? 1 : 0), g = src[i + 1] * a + 255 * (1 - a) * (o.alphaWhite ? 1 : 0), b = src[i + 2] * a + 255 * (1 - a) * (o.alphaWhite ? 1 : 0);
      var l = 0.299 * r + 0.587 * g + 0.114 * b;
      r = l + (r - l) * sat; g = l + (g - l) * sat; b = l + (b - l) * sat;
      r = (r - 128) * ct + 128 + br; g = (g - 128) * ct + 128 + br; b = (b - 128) * ct + 128 + br;
      d[j] = r; d[j + 1] = g; d[j + 2] = b;
    }
    return d;
  }
  function dist(r, g, b, c) {
    var p = G.RGB[c], dr = r - p[0], dg = g - p[1], db = b - p[2];
    return dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11;
  }
  function nearestOf(r, g, b, list) {
    var best = list[0], bd = 1e12;
    for (var i = 0; i < list.length; i++) { var dd = dist(r, g, b, list[i]); if (dd < bd) { bd = dd; best = list[i]; } }
    return best;
  }
  var ALL = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

  // map every pixel to colours (allowed(x, y) -> list), with dithering
  function quantize(rgb, w, h, dither, allowed) {
    var out = new Uint8Array(w * h), err = dither === "fs" ? Float32Array.from(rgb) : rgb;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var i = (y * w + x) * 3, r = err[i], g = err[i + 1], b = err[i + 2];
        if (dither === "bayer") {
          var t = (BAYER[(y & 7) * 8 + (x & 7)] / 64 - 0.5) * 48;
          r += t; g += t; b += t;
        }
        var c = nearestOf(r, g, b, allowed(x, y));
        out[y * w + x] = c;
        if (dither === "fs") {
          var p = G.RGB[c], er = r - p[0], eg = g - p[1], eb = b - p[2];
          spread(err, w, h, x + 1, y, er, eg, eb, 7 / 16);
          spread(err, w, h, x - 1, y + 1, er, eg, eb, 3 / 16);
          spread(err, w, h, x, y + 1, er, eg, eb, 5 / 16);
          spread(err, w, h, x + 1, y + 1, er, eg, eb, 1 / 16);
        }
      }
    }
    return out;
  }
  function spread(e, w, h, x, y, r, g, b, f) {
    if (x < 0 || x >= w || y >= h) return;
    var i = (y * w + x) * 3;
    e[i] += r * f * 0.85; e[i + 1] += g * f * 0.85; e[i + 2] += b * f * 0.85;
  }

  // src: RGBA pixels of w x h (160x200 or 320x200). o: { mc, dither: none|bayer|fs, bg: "auto"|0..15, ... }
  function convert(src, o) {
    var mc = o.mc !== false, w = mc ? 160 : 320, h = 200, cw = mc ? 4 : 8;
    var rgb = adjust(src, o);
    // 1. every pixel to its nearest C64 colour
    var first = quantize(rgb, w, h, o.dither, function () { return ALL; });
    // 2. background: the most used colour (multicolour)
    var bg = 0;
    if (mc) {
      if (o.bg === "auto" || o.bg == null) {
        var cnt = new Array(16).fill(0);
        for (var i = 0; i < first.length; i++) cnt[first[i]]++;
        for (var k = 1; k < 16; k++) if (cnt[k] > cnt[bg]) bg = k;
      } else bg = o.bg & 15;
    }
    // 3. the colours of every cell: the most used ones
    var bm = global.PSModel.newBitmap(mc);
    bm.bg = bg; bm.border = mc ? bg : 0;
    var cellCols = [];
    for (var cell = 0; cell < 1000; cell++) {
      var cx = cell % 40, cy = (cell / 40) | 0, n = new Array(16).fill(0);
      for (var y = 0; y < 8; y++) for (var x = 0; x < cw; x++) n[first[(cy * 8 + y) * w + cx * cw + x]]++;
      if (mc) n[bg] = -1;
      var order = ALL.slice().sort(function (a, b) { return n[b] - n[a]; });
      var cols = order.slice(0, mc ? 3 : 2).filter(function (c) { return n[c] > 0; });
      while (cols.length < (mc ? 3 : 2)) cols.push(mc ? bg : (cols[0] === 0 ? 1 : 0));
      cellCols.push(mc ? [bg].concat(cols) : cols);
      if (mc) { bm.screen[cell] = (cols[0] << 4) | cols[1]; bm.color[cell] = cols[2]; }
      else bm.screen[cell] = (cols[0] << 4) | cols[1];
    }
    // 4. every pixel again, now only with the colours of its cell
    var final = quantize(rgb, w, h, o.dither, function (x, y) { return cellCols[(y >> 3) * 40 + ((x / cw) | 0)]; });
    for (var py = 0; py < h; py++) for (var px = 0; px < w; px++) {
      var c = final[py * w + px], cl = cellCols[(py >> 3) * 40 + ((px / cw) | 0)];
      var slot = mc ? cl.indexOf(c) : (c === cl[0] ? 1 : 0);
      G.bmSetBits(bm, px, py, slot < 0 ? 0 : slot);
    }
    return bm;
  }

  global.PSConvert = { convert: convert };
})(typeof window !== "undefined" ? window : globalThis);
