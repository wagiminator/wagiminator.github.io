/* Display Converter: pictures to pixel values (scaling, adjustments, dithering) and pixel values to
 * the byte layouts of the displays, and back. A frame is { w, h, fmt, v } with v one value per
 * pixel: mono 0/1 (1 = lit), grey4 0…15, rgb332 / rgb565 / rgb888 the packed colour value. */
(function (global) {
  "use strict";

  var FORMATS = {
    mono: { name: "Monochrome, 1 bit per pixel", bits: 1 },
    grey4: { name: "Greyscale, 4 bits per pixel", bits: 4 },
    rgb332: { name: "Colour RGB332, 8 bits per pixel", bits: 8 },
    rgb565: { name: "Colour RGB565, 16 bits per pixel", bits: 16 },
    rgb888: { name: "Colour RGB888, 24 bits per pixel", bits: 24 }
  };
  // byte layouts of the monochrome format
  var LAYOUTS = {
    vlsb: { name: "Vertical bytes, bit 0 at the top", use: "SSD1306, SH1106, SSD1309, ST7565, PCD8544 pages; MicroPython MONO_VLSB" },
    hmsb: { name: "Horizontal bytes, bit 7 at the left", use: "Adafruit GFX drawBitmap, u8g2 drawBitmap, e-paper; MicroPython MONO_HLSB" },
    hlsb: { name: "Horizontal bytes, bit 0 at the left", use: "XBM, u8g2 drawXBM; MicroPython MONO_HMSB" }
  };

  // ---------------------------------------------------------------- scaling into the target size
  /* src: drawable (image, bitmap, canvas) with width/height; o: { w, h, fit: contain|cover|stretch,
   * rotate: 0|90|180|270, flipH, flipV, bg: "#000"|"#fff", smooth } → ImageData of w × h */
  function render(src, o) {
    var c = document.createElement("canvas"); c.width = o.w; c.height = o.h;
    var g = c.getContext("2d", { willReadFrequently: true });
    g.fillStyle = o.bg || "#000"; g.fillRect(0, 0, o.w, o.h);
    var sw = src.width, sh = src.height, rot = ((o.rotate || 0) % 360 + 360) % 360, side = rot === 90 || rot === 270;
    var rw = side ? sh : sw, rh = side ? sw : sh;                 // size of the source after the rotation
    var sx = o.w / rw, sy = o.h / rh;
    if (o.fit === "contain") sx = sy = Math.min(sx, sy);
    else if (o.fit === "cover") sx = sy = Math.max(sx, sy);
    g.imageSmoothingEnabled = o.smooth !== false; g.imageSmoothingQuality = "high";
    g.translate(o.w / 2, o.h / 2);
    g.scale(o.flipH ? -1 : 1, o.flipV ? -1 : 1);
    g.rotate(rot * Math.PI / 180);
    // in the rotated frame the source's own axes are scaled
    var ax = side ? sy : sx, ay = side ? sx : sy;
    g.drawImage(src, -sw * ax / 2, -sh * ay / 2, sw * ax, sh * ay);
    return g.getImageData(0, 0, o.w, o.h);
  }

  // ---------------------------------------------------------------- adjustments and quantisation
  // brightness and contrast (−100 … 100), invert → Float32Array r,g,b per pixel (0 … 255)
  function adjust(img, a) {
    var d = img.data, n = img.width * img.height, out = new Float32Array(n * 3);
    var b = (a.brightness || 0) * 2.55, k = a.contrast || 0, f = k >= 0 ? 1 + k / 100 * 3 : 1 + k / 100;
    for (var i = 0; i < n; i++) for (var c = 0; c < 3; c++) {
      var v = (d[i * 4 + c] - 128) * f + 128 + b;
      if (a.invert) v = 255 - v;
      out[i * 3 + c] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
    return out;
  }
  // ordered dither matrices from the recursion M(2n) = [[4M, 4M + 2], [4M + 3, 4M + 1]]
  function bayer(n) {
    var m = [[0]];
    while (m.length < n) {
      var k = m.length, r = [];
      for (var y = 0; y < 2 * k; y++) { r.push([]); for (var x = 0; x < 2 * k; x++) r[y].push(4 * m[y % k][x % k] + [[0, 2], [3, 1]][y >= k ? 1 : 0][x >= k ? 1 : 0]); }
      m = r;
    }
    return [].concat.apply([], m);
  }
  var BAYER4 = bayer(4), BAYER8 = bayer(8);
  // error diffusion kernels: [dx, dy, weight] and the divisor
  var KERNELS = {
    fs: { k: [[1, 0, 7], [-1, 1, 3], [0, 1, 5], [1, 1, 1]], d: 16 },
    atkinson: { k: [[1, 0, 1], [2, 0, 1], [-1, 1, 1], [0, 1, 1], [1, 1, 1], [0, 2, 1]], d: 8 },
    sierra: { k: [[1, 0, 2], [-1, 1, 1], [0, 1, 1]], d: 4 }
  };
  var DITHER = { none: "None (threshold)", fs: "Floyd–Steinberg", atkinson: "Atkinson", sierra: "Sierra Lite", bayer4: "Ordered, Bayer 4 × 4", bayer8: "Ordered, Bayer 8 × 8" };

  /* channels: Float32Array (one or three values per pixel), quant(values) → { out: quantised
   * channel values, v: the pixel value }. Diffuses the error or adds ordered noise of step size. */
  function dither(ch, w, h, nc, method, quant, step) {
    var n = w * h, v = new Uint32Array(n), buf = method in KERNELS ? Float32Array.from(ch) : ch, K = KERNELS[method];
    var px = new Array(nc);
    for (var y = 0; y < h; y++) {
      var rev = K && (y & 1), x0 = rev ? w - 1 : 0, dx = rev ? -1 : 1;
      for (var s = 0, x = x0; s < w; s++, x += dx) {
        var i = y * w + x;
        for (var c = 0; c < nc; c++) px[c] = buf[i * nc + c];
        if (method === "bayer4" || method === "bayer8") {
          var t = method === "bayer4" ? (BAYER4[(y & 3) * 4 + (x & 3)] + 0.5) / 16 - 0.5 : (BAYER8[(y & 7) * 8 + (x & 7)] + 0.5) / 64 - 0.5;
          for (c = 0; c < nc; c++) px[c] += t * step[c];
        }
        var q = quant(px);
        v[i] = q.v;
        if (K) for (c = 0; c < nc; c++) {
          var err = px[c] - q.out[c];
          if (!err) continue;
          for (var k = 0; k < K.k.length; k++) {
            var ex = x + (rev ? -K.k[k][0] : K.k[k][0]), ey = y + K.k[k][1];
            if (ex < 0 || ex >= w || ey >= h) continue;
            buf[(ey * w + ex) * nc + c] += err * K.k[k][2] / K.d;
          }
        }
      }
    }
    return v;
  }

  /* img: ImageData; o: { fmt, dither, threshold (mono), brightness, contrast, invert } → frame */
  function quantize(img, o) {
    var w = img.width, h = img.height, n = w * h, rgb = adjust(img, o), fmt = o.fmt, m = o.dither || "none", v;
    if (fmt === "mono" || fmt === "grey4") {
      var L = new Float32Array(n);
      for (var i = 0; i < n; i++) L[i] = 0.299 * rgb[i * 3] + 0.587 * rgb[i * 3 + 1] + 0.114 * rgb[i * 3 + 2];
      if (fmt === "mono") {
        var thr = o.threshold == null ? 128 : o.threshold;
        v = dither(L, w, h, 1, m, function (p) { var on = p[0] >= thr; return { out: [on ? 255 : 0], v: on ? 1 : 0 }; }, [255]);
      } else {
        v = dither(L, w, h, 1, m, function (p) { var q = Math.max(0, Math.min(15, Math.round(p[0] / 17))); return { out: [q * 17], v: q }; }, [17]);
      }
    } else {
      var bits = fmt === "rgb332" ? [3, 3, 2] : fmt === "rgb565" ? [5, 6, 5] : [8, 8, 8];
      var max = bits.map(function (b) { return (1 << b) - 1; }), step = max.map(function (mx) { return 255 / mx; });
      v = dither(rgb, w, h, 3, m, function (p) {
        var q = [0, 0, 0], out = [0, 0, 0];
        for (var c = 0; c < 3; c++) { q[c] = Math.max(0, Math.min(max[c], Math.round(p[c] / step[c]))); out[c] = q[c] * step[c]; }
        return { out: out, v: (q[0] << (bits[1] + bits[2])) | (q[1] << bits[2]) | q[2] };
      }, step);
    }
    return { w: w, h: h, fmt: fmt, v: v };
  }

  // the colour of a pixel value as [r, g, b] (mono and grey as brightness 0 … 255)
  function toRGB(fmt, x) {
    if (fmt === "mono") return x ? [255, 255, 255] : [0, 0, 0];
    if (fmt === "grey4") return [x * 17, x * 17, x * 17];
    if (fmt === "rgb332") return [Math.round((x >> 5) * 255 / 7), Math.round(((x >> 2) & 7) * 255 / 7), Math.round((x & 3) * 255 / 3)];
    if (fmt === "rgb565") return [Math.round((x >> 11) * 255 / 31), Math.round(((x >> 5) & 63) * 255 / 63), Math.round((x & 31) * 255 / 31)];
    return [(x >> 16) & 255, (x >> 8) & 255, x & 255];
  }

  // ---------------------------------------------------------------- bytes
  /* frame → Uint8Array; o: { layout (mono), order: "be"|"le" (rgb565) } */
  function pack(f, o) {
    var w = f.w, h = f.h, v = f.v, out, x, y, i = 0;
    if (f.fmt === "mono") {
      var lay = o.layout || "vlsb";
      if (lay === "vlsb") {
        var pages = Math.ceil(h / 8); out = new Uint8Array(pages * w);
        for (var p = 0; p < pages; p++) for (x = 0; x < w; x++) {
          var b = 0;
          for (var k = 0; k < 8; k++) { y = p * 8 + k; if (y < h && v[y * w + x]) b |= 1 << k; }
          out[i++] = b;
        }
      } else {
        var bpr = Math.ceil(w / 8); out = new Uint8Array(bpr * h);
        for (y = 0; y < h; y++) for (x = 0; x < w; x++) if (v[y * w + x]) out[y * bpr + (x >> 3)] |= lay === "hmsb" ? 0x80 >> (x & 7) : 1 << (x & 7);
      }
    } else if (f.fmt === "grey4") {
      var bpr4 = Math.ceil(w / 2); out = new Uint8Array(bpr4 * h);
      for (y = 0; y < h; y++) for (x = 0; x < w; x++) out[y * bpr4 + (x >> 1)] |= (x & 1) ? v[y * w + x] : v[y * w + x] << 4;
    } else if (f.fmt === "rgb332") {
      out = Uint8Array.from(v);
    } else if (f.fmt === "rgb565") {
      out = new Uint8Array(w * h * 2);
      for (var j = 0; j < w * h; j++) { var hi = v[j] >> 8, lo = v[j] & 255; if (o.order === "le") { out[2 * j] = lo; out[2 * j + 1] = hi; } else { out[2 * j] = hi; out[2 * j + 1] = lo; } }
    } else {
      out = new Uint8Array(w * h * 3);
      for (var q = 0; q < w * h; q++) { out[3 * q] = v[q] >> 16; out[3 * q + 1] = (v[q] >> 8) & 255; out[3 * q + 2] = v[q] & 255; }
    }
    return out;
  }
  // bytes → frame (the reverse of pack); missing bytes count as 0
  function unpack(bytes, w, h, fmt, o) {
    var v = new Uint32Array(w * h), x, y, at = function (i) { return i < bytes.length ? bytes[i] : 0; };
    if (fmt === "mono") {
      var lay = o.layout || "vlsb", bpr = Math.ceil(w / 8);
      for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
        var bit = lay === "vlsb" ? (at((y >> 3) * w + x) >> (y & 7)) & 1 : lay === "hmsb" ? (at(y * bpr + (x >> 3)) >> (7 - (x & 7))) & 1 : (at(y * bpr + (x >> 3)) >> (x & 7)) & 1;
        v[y * w + x] = bit;
      }
    } else if (fmt === "grey4") {
      var b4 = Math.ceil(w / 2);
      for (y = 0; y < h; y++) for (x = 0; x < w; x++) { var by = at(y * b4 + (x >> 1)); v[y * w + x] = (x & 1) ? by & 15 : by >> 4; }
    } else if (fmt === "rgb332") {
      for (var i = 0; i < w * h; i++) v[i] = at(i);
    } else if (fmt === "rgb565") {
      for (var j = 0; j < w * h; j++) v[j] = o.order === "le" ? at(2 * j) | at(2 * j + 1) << 8 : at(2 * j) << 8 | at(2 * j + 1);
    } else {
      for (var k = 0; k < w * h; k++) v[k] = at(3 * k) << 16 | at(3 * k + 1) << 8 | at(3 * k + 2);
    }
    return { w: w, h: h, fmt: fmt, v: v };
  }
  // bytes per frame for a size and format
  function frameBytes(w, h, fmt, layout) {
    if (fmt === "mono") return layout === "vlsb" ? Math.ceil(h / 8) * w : Math.ceil(w / 8) * h;
    if (fmt === "grey4") return Math.ceil(w / 2) * h;
    return w * h * (fmt === "rgb332" ? 1 : fmt === "rgb565" ? 2 : 3);
  }
  // numbers out of pasted C, Python or plain text: 0x1F, 0b0101, 31, B00011111 (Arduino)
  function parseNumbers(text) {
    // drop comments and the brackets of array sizes, keep the initialiser part when there is one
    var t = String(text).replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/.*$/gm, " ").replace(/#.*$/gm, " ");
    var a = t.indexOf("{"), b = t.lastIndexOf("}");
    if (a >= 0 && b > a) t = t.slice(a + 1, b);
    else { var p = t.indexOf("("), q = t.lastIndexOf(")"); if (p >= 0 && q > p) t = t.slice(p + 1, q); }
    var out = [], re = /\b(0[xX][0-9a-fA-F]+|0[bB][01]+|B[01]{1,8}|\d+)\b/g, m;
    while ((m = re.exec(t))) {
      var s = m[1], n = /^0[xX]/.test(s) ? parseInt(s.slice(2), 16) : /^0[bB]/.test(s) ? parseInt(s.slice(2), 2) : s[0] === "B" ? parseInt(s.slice(1), 2) : parseInt(s, 10);
      out.push(n);
    }
    return out;
  }

  global.DC = { FORMATS: FORMATS, LAYOUTS: LAYOUTS, DITHER: DITHER, render: render, adjust: adjust, quantize: quantize, toRGB: toRGB, pack: pack, unpack: unpack, frameBytes: frameBytes, parseNumbers: parseNumbers };
})(window);
