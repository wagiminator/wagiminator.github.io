/* Display Converter: fonts. The characters are drawn with the browser (installed fonts or a font
 * file), turned into pixels with a threshold and packed as fixed-width fonts (vertical or
 * horizontal bytes) or as Adafruit GFX font (proportional, with a glyph table). */
(function (global) {
  "use strict";
  var DC = global.DC;

  var SETS = {
    ascii: { name: "ASCII 32 … 126", text: range(32, 126) },
    ascii127: { name: "ASCII 32 … 127", text: range(32, 127) },
    latin1: { name: "Latin-1 32 … 255", text: range(32, 126) + range(160, 255) },
    digits: { name: "Digits and signs: 0 … 9 + − . , : % °", text: "0123456789+-.,:%°" },
    upper: { name: "Capitals, digits, space and signs", text: " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_" },
    custom: { name: "Own selection", text: "" }
  };
  function range(a, b) { var s = ""; for (var i = a; i <= b; i++) s += String.fromCharCode(i); return s; }
  // the characters of a set as code points, in order, without repeats
  function codes(text) {
    var out = [], seen = {};
    Array.from(text).forEach(function (ch) { var c = ch.codePointAt(0); if (!seen[c]) { seen[c] = 1; out.push(c); } });
    return out;
  }

  var loaded = {};
  // a font file → the family name to draw with
  async function loadFile(file) {
    var fam = "dc-font-" + (Object.keys(loaded).length + 1);
    var face = new FontFace(fam, await file.arrayBuffer());
    await face.load();
    document.fonts.add(face);
    loaded[fam] = file.name;
    return fam;
  }
  var GENERIC = /^(monospace|serif|sans-serif|system-ui|cursive|fantasy)$/;
  function css(o) {
    var fam = GENERIC.test(o.family) ? o.family : '"' + o.family.replace(/"/g, "") + '", monospace';
    return (o.italic ? "italic " : "") + (o.bold ? "bold " : "") + o.size + "px " + fam;
  }

  // size of the font for a character set: ascent and descent of the drawn pixels, widest advance
  function metrics(o, list) {
    var c = document.createElement("canvas").getContext("2d");
    c.font = css(o);
    var asc = 0, desc = 0, adv = 0;
    list.forEach(function (code) {
      var m = c.measureText(String.fromCodePoint(code));
      asc = Math.max(asc, Math.ceil(m.actualBoundingBoxAscent || 0));
      desc = Math.max(desc, Math.ceil(m.actualBoundingBoxDescent || 0));
      adv = Math.max(adv, Math.round(m.width));
    });
    var m0 = c.measureText("M");
    return { ascent: asc, descent: desc, advance: adv, line: Math.ceil((m0.fontBoundingBoxAscent || asc) + (m0.fontBoundingBoxDescent || desc)) };
  }

  /* o: { family, size, bold, italic, threshold, mode: "fixed"|"gfx", w, h, baseline, xoff, centre, spacing }
   * → [{ code, w, h, bits: Uint8Array, xOff, yOff, adv }] (fixed: every glyph has the cell size) */
  function glyphs(o, list) {
    var pad = Math.ceil(o.size * 1.5) + 4, W = Math.ceil(o.size * 3) + 2 * pad, H = Math.ceil(o.size * 2.5) + 2 * pad;
    var cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    var g = cv.getContext("2d", { willReadFrequently: true });
    var thr = o.threshold == null ? 128 : o.threshold, out = [];
    list.forEach(function (code) {
      var ch = String.fromCodePoint(code);
      g.clearRect(0, 0, W, H);
      g.font = css(o); g.textBaseline = "alphabetic"; g.fillStyle = "#000";
      var adv = Math.round(g.measureText(ch).width), x0, y0;
      if (o.mode === "fixed") { x0 = pad + (o.centre ? Math.round((o.w - adv) / 2) : o.xoff || 0); y0 = pad + o.baseline; }
      else { x0 = pad; y0 = pad + Math.ceil(o.size * 1.2); }
      g.fillText(ch, x0, y0);
      var d = g.getImageData(0, 0, W, H).data, on = function (x, y) { return d[(y * W + x) * 4 + 3] >= thr ? 1 : 0; };
      if (o.mode === "fixed") {
        var bits = new Uint8Array(o.w * o.h);
        for (var y = 0; y < o.h; y++) for (var x = 0; x < o.w; x++) bits[y * o.w + x] = on(pad + x, pad + y);
        out.push({ code: code, w: o.w, h: o.h, bits: bits, xOff: 0, yOff: -o.baseline, adv: o.w });
      } else {
        var minx = W, miny = H, maxx = -1, maxy = -1;
        for (var yy = 0; yy < H; yy++) for (var xx = 0; xx < W; xx++) if (on(xx, yy)) { if (xx < minx) minx = xx; if (xx > maxx) maxx = xx; if (yy < miny) miny = yy; if (yy > maxy) maxy = yy; }
        var gw = maxx < 0 ? 0 : maxx - minx + 1, gh = maxy < 0 ? 0 : maxy - miny + 1, gb = new Uint8Array(gw * gh);
        for (var y2 = 0; y2 < gh; y2++) for (var x2 = 0; x2 < gw; x2++) gb[y2 * gw + x2] = on(minx + x2, miny + y2);
        out.push({ code: code, w: gw, h: gh, bits: gb, xOff: gw ? minx - x0 : 0, yOff: gh ? miny - y0 : 0, adv: Math.max(0, adv + (o.spacing || 0)) });
      }
    });
    return out;
  }

  // ---------------------------------------------------------------- packing
  // one glyph of a fixed-width font: vertical bytes page by page, or horizontal rows (bit 7 left)
  function packFixed(gl, layout) {
    var w = gl.w, h = gl.h, f = { w: w, h: h, fmt: "mono", v: gl.bits };
    return DC.pack(f, { layout: layout });
  }
  // Adafruit GFX: the bits of a glyph one after another, row by row, bit 7 first; every glyph starts on a byte
  function packGfx(gl) {
    var n = gl.w * gl.h, out = new Uint8Array(Math.ceil(n / 8));
    for (var i = 0; i < n; i++) if (gl.bits[i]) out[i >> 3] |= 0x80 >> (i & 7);
    return out;
  }

  global.DC.font = { SETS: SETS, codes: codes, loadFile: loadFile, metrics: metrics, glyphs: glyphs, packFixed: packFixed, packGfx: packGfx, loaded: loaded, css: css };
})(window);
