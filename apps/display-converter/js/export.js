/* Display Converter: source code out of the bytes. C/C++ (Arduino, CH32, AVR, ESP, STM32 …),
 * MicroPython (bytearray and framebuf) and Adafruit GFX fonts. */
(function (global) {
  "use strict";
  var DC = global.DC;

  function hex(n, digits, upper) { var s = n.toString(16).padStart(digits, "0"); return "0x" + (upper ? s.toUpperCase() : s); }
  // the values as lines of perLine, indented
  function lines(vals, o, digits, indent) {
    var out = [], per = o.perLine || 16;
    for (var i = 0; i < vals.length; i += per) out.push(indent + Array.prototype.slice.call(vals, i, i + per).map(function (v) { return hex(v, digits, o.upper); }).join(", ") + (i + per < vals.length ? "," : ""));
    return out;
  }
  function ident(s, fallback) {
    var n = String(s || "").replace(/\.[^.]*$/, "").replace(/[^A-Za-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
    if (!n) n = fallback;
    if (/^[0-9]/.test(n)) n = "_" + n;
    return n;
  }
  // 16-bit words as the bytes lie in the memory of a little-endian controller (AVR, ARM, RISC-V, ESP)
  function words(bytes) { var w = new Uint16Array(bytes.length >> 1); for (var i = 0; i < w.length; i++) w[i] = bytes[2 * i] | bytes[2 * i + 1] << 8; return w; }
  function charNote(code) {
    var ch = String.fromCodePoint(code), printable = code >= 32 && code !== 127 && !(code >= 128 && code < 160);
    return hex(code, code > 255 ? 4 : 2, true) + (printable ? " '" + ch + "'" : "");
  }
  function describe(fmt, o) {
    if (fmt === "mono") return "monochrome, " + DC.LAYOUTS[o.layout].name.toLowerCase();
    if (fmt === "grey4") return "4-bit greyscale, two pixels per byte (left pixel in the high nibble)";
    if (fmt === "rgb565") return "RGB565, " + (o.order === "le" ? "low byte first" : "high byte first (as the display receives it)");
    if (fmt === "rgb332") return "RGB332, one byte per pixel";
    return "RGB888, three bytes per pixel (red, green, blue)";
  }
  var MPY = { vlsb: "MONO_VLSB", hmsb: "MONO_HLSB", hlsb: "MONO_HMSB" };

  /* frames: [frame]; o: { name, source, fmt, layout, order, lang: "c"|"py", progmem, word16, sizeBytes, perLine, upper }
   * → { text, bytes: Uint8Array (all frames), perFrame, warn } */
  function image(frames, o) {
    var f0 = frames[0], name = ident(o.name, "image"), N = name.toUpperCase(), warn = "";
    var packed = frames.map(function (f) {
      var b = DC.pack(f, o);
      if (o.sizeBytes) { if (f.w > 255 || f.h > 255) warn = "Width and height do not fit into one byte each."; var t = new Uint8Array(b.length + 2); t[0] = f.w & 255; t[1] = f.h & 255; t.set(b, 2); b = t; }
      return b;
    });
    var per = packed[0].length, all = new Uint8Array(per * packed.length);
    packed.forEach(function (b, i) { all.set(b, i * per); });
    var useWords = o.lang === "c" && o.word16 && o.fmt === "rgb565" && !o.sizeBytes;
    var head = (o.source ? o.source + ": " : "") + f0.w + " × " + f0.h + " pixels, " + describe(o.fmt, o);
    var size = (frames.length > 1 ? frames.length + " frames of " + per + " bytes, " : "") + all.length + " bytes" + (o.sizeBytes ? ", each frame starts with its width and height" : "");
    var L = [];
    if (o.lang === "py") {
      L.push("# " + head, "# " + size, "import framebuf", "", N + "_WIDTH = " + f0.w, N + "_HEIGHT = " + f0.h);
      if (frames.length > 1) L.push(N + "_FRAMES = " + frames.length);
      var arr = function (b, ind) { return [ind + "bytearray(("].concat(lines(b, o, 2, ind + "    ")).concat([ind + "))"]); };
      if (frames.length === 1) { var a1 = arr(packed[0], ""); a1[0] = N + " = " + a1[0]; L = L.concat(a1); }
      else {
        L.push(N + " = [");
        packed.forEach(function (b, i) { var a = arr(b, "    "); a[a.length - 1] += ","; a[0] = a[0] + "  # frame " + (i + 1); L = L.concat(a); });
        L.push("]");
      }
      var fbfmt = o.fmt === "mono" ? MPY[o.layout] : o.fmt === "grey4" ? "GS4_HMSB" : o.fmt === "rgb565" && o.order === "le" ? "RGB565" : null;
      L.push("");
      if (o.sizeBytes) L.push("# The first two bytes of every frame are its width and height; start the frame buffer after them.");
      else if (fbfmt) L.push("fb = framebuf.FrameBuffer(" + N + (frames.length > 1 ? "[0]" : "") + ", " + N + "_WIDTH, " + N + "_HEIGHT, framebuf." + fbfmt + ")");
      else if (o.fmt === "rgb565") L.push("# framebuf.RGB565 needs the low byte first: choose that byte order to use it with framebuf.");
      else L.push("# framebuf has no format for this; send the bytes to the display as they are.");
      return { text: L.join("\n") + "\n", bytes: all, perFrame: per, warn: warn };
    }
    L.push("// " + head, "// " + size, "#include <stdint.h>");
    if (o.progmem) L.push("#include <avr/pgmspace.h>   // PROGMEM: AVR keeps the data in flash; other cores ignore it");
    L.push("", "#define " + N + "_WIDTH  " + f0.w, "#define " + N + "_HEIGHT " + f0.h);
    if (frames.length > 1) L.push("#define " + N + "_FRAMES " + frames.length);
    var type = useWords ? "uint16_t" : "uint8_t", pm = o.progmem ? " PROGMEM" : "", digits = useWords ? 4 : 2;
    var vals = function (b) { return useWords ? words(b) : b; };
    if (useWords) L.push("// 16-bit words as they lie in the memory of a little-endian controller");
    L.push("");
    if (frames.length === 1) {
      L.push("const " + type + " " + name + "[]" + pm + " = {");
      L = L.concat(lines(vals(packed[0]), o, digits, "  "));
      L.push("};");
    } else {
      L.push("const " + type + " " + name + "[" + N + "_FRAMES][" + (useWords ? per / 2 : per) + "]" + pm + " = {");
      packed.forEach(function (b, i) { L.push("  { // frame " + (i + 1)); L = L.concat(lines(vals(b), o, digits, "    ")); L.push("  }" + (i < packed.length - 1 ? "," : "")); });
      L.push("};");
    }
    return { text: L.join("\n") + "\n", bytes: all, perFrame: per, warn: warn };
  }

  /* gl: glyphs; o: { name, fontName, mode: "fixed"|"gfx", layout (fixed), lang, progmem, perLine, upper, yAdvance } */
  function font(gl, o) {
    var name = ident(o.name, "font"), N = name.toUpperCase(), pm = o.progmem ? " PROGMEM" : "", L = [], warn = "";
    if (!gl.length) return { text: "", bytes: new Uint8Array(0), warn: "No characters." };
    var codes = gl.map(function (g) { return g.code; }), contiguous = codes.every(function (c, i) { return !i || c === codes[i - 1] + 1; });
    if (o.mode === "gfx") {
      // the range first … last without gaps (missing characters become empty glyphs)
      var first = Math.min.apply(null, codes), last = Math.max.apply(null, codes), byCode = {};
      gl.forEach(function (g) { byCode[g.code] = g; });
      var bm = [], tab = [];
      for (var c = first; c <= last; c++) {
        var g = byCode[c] || { code: c, w: 0, h: 0, bits: new Uint8Array(0), xOff: 0, yOff: 0, adv: 0 };
        var b = DC.font.packGfx(g);
        tab.push({ g: g, off: bm.length, missing: !byCode[c] });
        for (var k = 0; k < b.length; k++) bm.push(b[k]);
        if (g.w > 255 || g.h > 255 || g.adv > 255 || g.xOff < -128 || g.xOff > 127 || g.yOff < -128 || g.yOff > 127) warn = "Some glyphs are too large for the GFX glyph table (8-bit values).";
      }
      if (bm.length > 65535) warn = "The bitmap is larger than 64 KB, more than a GFX font can address.";
      L.push("// " + o.fontName + ", Adafruit GFX font, characters " + charNote(first) + " … " + charNote(last) + (contiguous ? "" : " (missing ones are empty)"),
        "// " + bm.length + " bytes of bitmaps and a glyph table of " + tab.length + " characters (7 bytes each on AVR, 8 on 32-bit controllers)",
        "// Use: #include \"" + name + ".h\" and display.setFont(&" + name + ");",
        "#include <Adafruit_GFX.h>", "");
      L.push("const uint8_t " + name + "Bitmaps[]" + pm + " = {");
      L = L.concat(lines(bm, o, 2, "  "));
      L.push("};", "", "const GFXglyph " + name + "Glyphs[]" + pm + " = {", "  // offset, width, height, xAdvance, xOffset, yOffset");
      tab.forEach(function (t, i) {
        var g = t.g, cells = [t.off, g.w, g.h, g.adv, g.xOff, g.yOff].map(function (v, j) { return String(v).padStart(j ? 4 : 6); });
        L.push("  {" + cells.join(",") + " }" + (i < tab.length - 1 ? "," : " ") + "  // " + charNote(g.code) + (t.missing ? " (not in the selection)" : ""));
      });
      L.push("};", "", "const GFXfont " + name + pm + " = {", "  (uint8_t *)" + name + "Bitmaps, (GFXglyph *)" + name + "Glyphs, " + hex(first, 2, true) + ", " + hex(last, 2, true) + ", " + o.yAdvance + "", "};");
      return { text: L.join("\n") + "\n", bytes: Uint8Array.from(bm), warn: warn };
    }
    var w = gl[0].w, h = gl[0].h, packed = gl.map(function (g) { return DC.font.packFixed(g, o.layout); }), per = packed[0].length;
    var all = new Uint8Array(per * packed.length);
    packed.forEach(function (b, i) { all.set(b, i * per); });
    var how = o.layout === "vlsb" ? "vertical bytes (bit 0 at the top), " + (h > 8 ? "page by page: the top 8 rows of all columns first, " : "") + per + " bytes per character" : "horizontal bytes (bit 7 at the left), row by row, " + per + " bytes per character";
    var c0 = o.lang === "py" ? "# " : "// ";
    L.push(c0 + o.fontName + ", " + gl.length + " characters" + (contiguous ? " " + charNote(codes[0]) + " … " + charNote(codes[codes.length - 1]) : "") + ", cell " + w + " × " + h + " pixels",
      c0 + how + ", " + all.length + " bytes");
    if (o.lang === "py") {
      L.push(N + "_WIDTH = " + w, N + "_HEIGHT = " + h);
      if (contiguous) L.push(N + "_FIRST = " + codes[0], N + "_LAST = " + codes[codes.length - 1]);
      else L.push(N + "_CHARS = " + JSON.stringify(String.fromCodePoint.apply(null, codes)));
      L.push(N + " = bytearray((");
      packed.forEach(function (b, i) { var ls = lines(b, per <= 24 ? { perLine: per, upper: o.upper } : o, 2, "    "); ls[ls.length - 1] += (i < packed.length - 1 ? "," : "") + "  # " + charNote(gl[i].code); L = L.concat(ls); });
      L.push("))", "# character c starts at " + (contiguous ? "(ord(c) - " + N + "_FIRST) * " + per : N + "_CHARS.index(c) * " + per));
      return { text: L.join("\n") + "\n", bytes: all, warn: warn };
    }
    L.push("#include <stdint.h>");
    if (o.progmem) L.push("#include <avr/pgmspace.h>");
    L.push("", "#define " + N + "_WIDTH  " + w, "#define " + N + "_HEIGHT " + h);
    if (contiguous) L.push("#define " + N + "_FIRST  " + codes[0] + "    // character c starts at (c - " + N + "_FIRST) * " + per, "#define " + N + "_LAST   " + codes[codes.length - 1]);
    else {
      var big = codes.some(function (c) { return c > 255; });
      L.push("#define " + N + "_COUNT  " + codes.length, "// the characters in the order of the font", "const " + (big ? "uint16_t" : "uint8_t") + " " + name + "_codes[]" + pm + " = {");
      L = L.concat(lines(codes, { perLine: 16, upper: o.upper }, big ? 4 : 2, "  "));
      L.push("};");
    }
    L.push("", "const uint8_t " + name + "[]" + pm + " = {");
    packed.forEach(function (b, i) {
      var ls = lines(b, per <= 24 ? { perLine: per, upper: o.upper } : o, 2, "  ");
      ls[ls.length - 1] += (i < packed.length - 1 ? "," : " ") + "  // " + charNote(gl[i].code);
      L = L.concat(ls);
    });
    L.push("};");
    return { text: L.join("\n") + "\n", bytes: all, warn: warn };
  }

  DC.exporter = { image: image, font: font, ident: ident };
})(window);
