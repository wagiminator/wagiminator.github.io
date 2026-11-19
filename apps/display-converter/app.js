/* Display Converter: the user interface. Conversion: js/convert.js, fonts: js/font.js, code: js/export.js. */
(function () {
  "use strict";
  var DC = window.DC, F = DC.font, X = DC.exporter, $ = function (id) { return document.getElementById(id); };

  // ---------------------------------------------------------------- data
  // id, label, width, height, format, look (null: keep)
  var PRESETS = [
    ["picture", "Size of the picture", 0, 0, null, null],
    ["own", "Own size", 0, 0, null, null],
    ["g-OLED, monochrome"],
    ["oled128x64", "128 × 64 SSD1306, SH1106 (0.96\", 1.3\")", 128, 64, "mono", "white"],
    ["oled128x32", "128 × 32 SSD1306 (0.91\")", 128, 32, "mono", "white"],
    ["oled72x40", "72 × 40 SSD1306 (0.42\")", 72, 40, "mono", "white"],
    ["oled64x48", "64 × 48 SSD1306 (0.66\")", 64, 48, "mono", "white"],
    ["oled64x32", "64 × 32 SSD1306 (0.49\")", 64, 32, "mono", "white"],
    ["oled96x16", "96 × 16 SSD1306", 96, 16, "mono", "white"],
    ["g-OLED, greyscale"],
    ["ssd1327", "128 × 128 SSD1327 (1.5\")", 128, 128, "grey4", "white"],
    ["ssd1322", "256 × 64 SSD1322 (2.8\")", 256, 64, "grey4", "yellow"],
    ["g-LCD and e-paper, monochrome"],
    ["pcd8544", "84 × 48 PCD8544 (Nokia 5110)", 84, 48, "mono", "lcd"],
    ["st7565", "128 × 64 ST7565, ST7567, ST7920", 128, 64, "mono", "lcd"],
    ["epd154", "200 × 200 e-paper (1.54\")", 200, 200, "mono", "paper"],
    ["epd213", "250 × 122 e-paper (2.13\")", 250, 122, "mono", "paper"],
    ["epd290", "296 × 128 e-paper (2.9\")", 296, 128, "mono", "paper"],
    ["g-TFT, colour"],
    ["st7735a", "160 × 80 ST7735 (0.96\")", 160, 80, "rgb565", null],
    ["st7735b", "128 × 128 ST7735 (1.44\")", 128, 128, "rgb565", null],
    ["st7735c", "160 × 128 ST7735 (1.8\")", 160, 128, "rgb565", null],
    ["st7789a", "240 × 135 ST7789 (1.14\")", 240, 135, "rgb565", null],
    ["st7789b", "240 × 240 ST7789 (1.3\", 1.54\")", 240, 240, "rgb565", null],
    ["st7789c", "320 × 170 ST7789 (1.9\")", 320, 170, "rgb565", null],
    ["ili9341", "320 × 240 ILI9341 (2.4\", 2.8\")", 320, 240, "rgb565", null],
    ["g-Icons and sprites"],
    ["i8", "8 × 8", 8, 8, null, null], ["i16", "16 × 16", 16, 16, null, null], ["i24", "24 × 24", 24, 24, null, null], ["i32", "32 × 32", 32, 32, null, null], ["i48", "48 × 48", 48, 48, null, null], ["i64", "64 × 64", 64, 64, null, null]
  ];
  // the look of a monochrome display: background, colour of a set pixel, of the top 16 rows; dark: set pixels are dark
  var LOOKS = {
    white: { name: "White OLED", bg: [0, 0, 0], on: [236, 242, 255] },
    blue: { name: "Blue OLED", bg: [0, 0, 0], on: [62, 182, 255] },
    yellowblue: { name: "Yellow and blue OLED", bg: [0, 0, 0], on: [62, 182, 255], top: [255, 208, 42] },
    yellow: { name: "Yellow OLED", bg: [0, 0, 0], on: [255, 196, 32] },
    lcd: { name: "Green LCD", bg: [168, 187, 132], on: [28, 40, 22], dark: true },
    paper: { name: "E-paper", bg: [233, 231, 225], on: [26, 26, 26], dark: true }
  };
  var LANGS = { c: ".h", py: ".py", bin: ".bin" };

  function defaults() {
    return {
      mode: "image", look: "white", zoom: 0, grid: true, sample: "Hello World! 0123456789",
      img: { preset: "oled128x64", w: 128, h: 64, fit: "contain", rotate: 0, flipH: false, flipV: false, smooth: 1, bg: "#000000", fmt: "mono", dither: "fs", thr: 128, bri: 0, con: 0, invert: false, tiles: false, tileW: 16, tileH: 16, name: "" },
      font: { family: "monospace", size: 16, thr: 128, bold: false, italic: false, set: "ascii", custom: "0123456789:. ", mode: "fixed", auto: true, cw: 6, ch: 8, base: 7, xoff: 0, centre: false, spacing: 0, yadv: "", name: "font" },
      out: { lang: "c", layout: "vlsb", order: "be", word16: false, progmem: false, sizebytes: false, perline: 16, upper: false }
    };
  }
  var KEY = "display-converter";
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } }
  var S = (function () {
    var d = defaults(), s = load();
    if (!s) return d;
    ["img", "font", "out"].forEach(function (k) { d[k] = Object.assign(d[k], s[k] || {}); });
    ["mode", "look", "zoom", "grid", "sample"].forEach(function (k) { if (s[k] != null) d[k] = s[k]; });
    if (!/^(monospace|sans-serif|serif)$/.test(d.font.family) && /^dc-font-/.test(d.font.family)) d.font.family = "monospace";
    return d;
  })();
  var saveT = 0;
  function save() { clearTimeout(saveT); saveT = setTimeout(function () { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* private mode */ } }, 300); }

  // ---------------------------------------------------------------- state
  var sources = [], srcName = "", frames = [], frameIdx = 0, edits = {}, editKey = "", result = null;
  var glyphs = [], gEdits = {}, fontLabel = "", fontFileName = "";

  // ---------------------------------------------------------------- helpers
  function pressed(group, v) { group.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.v === String(v))); }); }
  function segClick(id, fn) { $(id).addEventListener("click", function (e) { var b = e.target.closest("button"); if (b && !b.disabled) fn(b.dataset.v); }); }
  function num(id, lo, hi, fallback) { var v = parseInt($(id).value, 10); if (!isFinite(v)) return fallback; return Math.max(lo, Math.min(hi, v)); }
  var pend = 0;
  function update() { if (pend) return; pend = requestAnimationFrame(function () { pend = 0; run(); }); }

  // ---------------------------------------------------------------- the demo picture
  function demo() {
    var c = document.createElement("canvas"); c.width = 256; c.height = 128;
    var g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 256, 128);
    gr.addColorStop(0, "#0b1d3a"); gr.addColorStop(1, "#1f6fb2");
    g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
    var sun = g.createRadialGradient(196, 54, 4, 196, 54, 46);
    sun.addColorStop(0, "#fff6c8"); sun.addColorStop(0.5, "#ffc531"); sun.addColorStop(1, "rgba(255,140,0,0)");
    g.fillStyle = sun; g.fillRect(140, 0, 116, 110);
    g.fillStyle = "#e9eef7"; g.beginPath(); g.moveTo(0, 128); g.lineTo(0, 92); g.lineTo(44, 58); g.lineTo(72, 80); g.lineTo(112, 40); g.lineTo(170, 96); g.lineTo(256, 84); g.lineTo(256, 128); g.closePath(); g.fill();
    g.fillStyle = "#2e7d32"; g.beginPath(); g.moveTo(0, 128); g.lineTo(0, 110); g.quadraticCurveTo(80, 92, 150, 112); g.quadraticCurveTo(210, 126, 256, 106); g.lineTo(256, 128); g.closePath(); g.fill();
    g.fillStyle = "#ffffff"; g.font = "bold 22px sans-serif"; g.textBaseline = "top"; g.fillText("Hello!", 12, 12);
    return c;
  }

  // ---------------------------------------------------------------- loading pictures
  function loadImage(file) {
    return new Promise(function (ok, bad) {
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () { var c = document.createElement("canvas"); c.width = im.naturalWidth || 256; c.height = im.naturalHeight || 256; c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url); ok(c); };
      im.onerror = function () { URL.revokeObjectURL(url); bad(new Error(file.name + " is not a picture the browser can read.")); };
      im.src = url;
    });
  }
  // all frames of an animated GIF, WebP or PNG (ImageDecoder: Chrome, Edge), else null
  async function loadFrames(file) {
    if (!("ImageDecoder" in window) || !/^image\/(gif|webp|png|apng)$/.test(file.type)) return null;
    try {
      var dec = new ImageDecoder({ data: await file.arrayBuffer(), type: file.type });
      await dec.tracks.ready;
      var n = dec.tracks.selectedTrack ? dec.tracks.selectedTrack.frameCount : 1;
      if (n <= 1) { dec.close(); return null; }
      var out = [];
      for (var i = 0; i < Math.min(n, 500); i++) {
        var r = await dec.decode({ frameIndex: i }), vf = r.image, c = document.createElement("canvas");
        c.width = vf.displayWidth; c.height = vf.displayHeight; c.getContext("2d").drawImage(vf, 0, 0); vf.close(); out.push(c);
      }
      dec.close();
      return out;
    } catch (e) { return null; }
  }
  async function openFiles(list) {
    var files = Array.from(list).filter(function (f) { return /^image\//.test(f.type) || /\.svg$/i.test(f.name); });
    if (!files.length) return;
    files.sort(function (a, b) { return a.name.localeCompare(b.name, undefined, { numeric: true }); });
    var out = [], err = "";
    for (var i = 0; i < files.length; i++) {
      try {
        var fr = files.length === 1 ? await loadFrames(files[i]) : null;
        if (fr) out = out.concat(fr); else out.push(await loadImage(files[i]));
      } catch (e) { err = e.message; }
    }
    if (!out.length) { $("src-info").textContent = err; return; }
    sources = out; srcName = files.length === 1 ? files[0].name : files.length + " files";
    S.img.name = X.ident(files[0].name, "image");
    frameIdx = 0; $("name").value = S.img.name;
    afterSource(err);
  }
  function afterSource(err) {
    var s0 = sources[0];
    $("src-info").textContent = (srcName ? srcName + ": " : "") + s0.width + " × " + s0.height + " pixels" + (sources.length > 1 ? ", " + sources.length + " frames" : "") + (err ? ". " + err : "");
    if (S.img.preset === "picture") { S.img.w = s0.width; S.img.h = s0.height; syncImage(); }
    update();
  }
  $("open").addEventListener("click", function () { $("file").click(); });
  $("file").addEventListener("change", function () { openFiles(this.files); this.value = ""; });
  var drop = $("drop");
  ["dragenter", "dragover"].forEach(function (t) { document.addEventListener(t, function (e) { if (S.mode !== "image") return; e.preventDefault(); drop.classList.add("over"); }); });
  ["dragleave", "drop"].forEach(function (t) { document.addEventListener(t, function (e) { if (t === "dragleave" && e.relatedTarget) return; drop.classList.remove("over"); }); });
  document.addEventListener("drop", function (e) {
    e.preventDefault();
    if (!e.dataTransfer || !e.dataTransfer.files.length) return;
    if (S.mode === "font") { var f = e.dataTransfer.files[0]; if (/\.(ttf|otf|woff2?)$/i.test(f.name)) openFont(f); return; }
    openFiles(e.dataTransfer.files);
  });
  document.addEventListener("paste", function (e) {
    if (S.mode !== "image" || /^(INPUT|TEXTAREA)$/.test((e.target || {}).tagName || "")) return;
    var items = Array.from((e.clipboardData || {}).items || []).filter(function (i) { return i.kind === "file" && /^image\//.test(i.type); });
    if (!items.length) return;
    e.preventDefault();
    var f = items[0].getAsFile();
    openFiles([new File([f], "pasted.png", { type: f.type })]);
  });
  $("import").addEventListener("click", function () {
    var nums = DC.parseNumbers($("import-text").value), I = S.img, w = I.w, h = I.h, fmt = I.fmt;
    if (!nums.length) { $("src-info").textContent = "No numbers found in the text."; return; }
    if (I.preset === "picture") { $("src-info").textContent = "Choose a display or an own size first: the size of the array is not in the numbers."; return; }
    var bytes = [];
    // 16-bit words of RGB565 (values above 255) as little-endian bytes, the reverse of the word output
    nums.forEach(function (n) { if (n > 255) { bytes.push(n & 255, (n >> 8) & 255); } else bytes.push(n); });
    if (S.out.sizebytes && bytes.length >= 2) bytes = bytes.slice(2);
    var per = DC.frameBytes(w, h, fmt, S.out.layout), count = Math.max(1, Math.floor(bytes.length / per));
    sources = [];
    for (var k = 0; k < Math.min(count, 500); k++) {
      var f = DC.unpack(bytes.slice(k * per, (k + 1) * per), w, h, fmt, { layout: S.out.layout, order: S.out.order }), c = document.createElement("canvas");
      c.width = w; c.height = h;
      var g = c.getContext("2d"), id = g.createImageData(w, h);
      for (var i = 0; i < w * h; i++) { var rgb = DC.toRGB(fmt, f.v[i]); if (I.invert) rgb = rgb.map(function (x) { return 255 - x; }); /* undone again by the conversion */ id.data.set([rgb[0], rgb[1], rgb[2], 255], i * 4); }
      g.putImageData(id, 0, 0); sources.push(c);
    }
    srcName = "array"; frameIdx = 0;
    // read back 1:1: no dithering, nearest scaling
    I.dither = "none"; I.smooth = 0; I.bri = 0; I.con = 0; I.thr = 128; I.fit = "stretch"; I.rotate = 0; I.flipH = I.flipV = false;
    syncImage();
    $("src-info").textContent = "Array: " + bytes.length + " bytes, " + count + " frame" + (count > 1 ? "s" : "") + " of " + w + " × " + h + (bytes.length % per ? " (" + (bytes.length % per) + " bytes left over)" : "");
    update();
  });

  // ---------------------------------------------------------------- picture settings
  $("preset").innerHTML = (function () {
    var h = "", open = false;
    PRESETS.forEach(function (p) {
      if (p.length === 1) { h += (open ? "</optgroup>" : "") + '<optgroup label="' + p[0].slice(2) + '">'; open = true; return; }
      h += '<option value="' + p[0] + '">' + p[1] + "</option>";
    });
    return h + (open ? "</optgroup>" : "");
  })();
  $("fmt").innerHTML = Object.keys(DC.FORMATS).map(function (k) { return '<option value="' + k + '">' + DC.FORMATS[k].name + "</option>"; }).join("");
  $("look").innerHTML = Object.keys(LOOKS).map(function (k) { return '<option value="' + k + '">' + LOOKS[k].name + "</option>"; }).join("");
  $("layout").innerHTML = Object.keys(DC.LAYOUTS).map(function (k) { return '<option value="' + k + '">' + DC.LAYOUTS[k].name + "</option>"; }).join("");
  $("set").innerHTML = Object.keys(F.SETS).map(function (k) { return '<option value="' + k + '">' + F.SETS[k].name + "</option>"; }).join("");
  function syncDither() {
    var list = S.img.fmt === "mono" ? Object.keys(DC.DITHER) : S.img.fmt === "grey4" ? ["none", "fs", "atkinson", "sierra", "bayer4", "bayer8"] : ["none", "fs", "sierra", "bayer4", "bayer8"];
    if (list.indexOf(S.img.dither) < 0) S.img.dither = "none";
    $("dither").innerHTML = list.map(function (k) { return '<option value="' + k + '">' + (k === "none" && S.img.fmt !== "mono" ? "None" : DC.DITHER[k]) + "</option>"; }).join("");
    $("dither").value = S.img.dither;
  }
  function syncImage() {
    var I = S.img;
    $("preset").value = I.preset; $("w").value = I.w; $("h").value = I.h;
    $("w").disabled = $("h").disabled = I.preset === "picture";
    pressed($("fit"), I.fit); pressed($("rotate"), I.rotate); pressed($("bg"), I.bg);
    $("flip-h").checked = I.flipH; $("flip-v").checked = I.flipV; $("smooth").value = I.smooth;
    $("fmt").value = I.fmt; syncDither();
    $("look").disabled = S.mode === "image" && !(I.fmt === "mono" || I.fmt === "grey4");
    $("thr").value = I.thr; $("thr-o").textContent = I.thr; $("thr-f").hidden = I.fmt !== "mono";
    $("bri").value = I.bri; $("bri-o").textContent = (I.bri > 0 ? "+" : "") + I.bri; $("con").value = I.con; $("con-o").textContent = (I.con > 0 ? "+" : "") + I.con;
    $("invert").checked = I.invert;
    $("tiles").checked = I.tiles; $("tile-size").hidden = !I.tiles; $("tile-w").value = I.tileW; $("tile-h").value = I.tileH;
    syncOut();
  }
  $("preset").addEventListener("change", function () {
    var p = PRESETS.filter(function (x) { return x[0] === this.value; }, this)[0], I = S.img;
    I.preset = p[0];
    if (p[0] === "picture" && sources[0]) { I.w = sources[0].width; I.h = sources[0].height; }
    else if (p[2]) { I.w = p[2]; I.h = p[3]; }
    if (p[4]) I.fmt = p[4];
    if (p[5]) { S.look = p[5]; $("look").value = S.look; I.invert = !!LOOKS[p[5]].dark; I.bg = LOOKS[p[5]].dark ? "#ffffff" : "#000000"; }
    if (p[4] === "rgb565") { S.out.order = "be"; I.invert = false; I.bg = "#000000"; }
    if (I.fmt === "mono" && /^(st7565|pcd8544|oled)/.test(p[0])) S.out.layout = "vlsb";
    if (/^epd/.test(p[0])) S.out.layout = "hmsb";
    syncImage(); changed();
  });
  ["w", "h"].forEach(function (id) { $(id).addEventListener("change", function () { S.img[id] = num(id, 1, 2048, S.img[id]); S.img.preset = "own"; syncImage(); changed(); }); });
  segClick("fit", function (v) { S.img.fit = v; syncImage(); changed(); });
  segClick("rotate", function (v) { S.img.rotate = +v; syncImage(); changed(); });
  segClick("bg", function (v) { S.img.bg = v; syncImage(); changed(); });
  $("flip-h").addEventListener("change", function () { S.img.flipH = this.checked; changed(); });
  $("flip-v").addEventListener("change", function () { S.img.flipV = this.checked; changed(); });
  $("smooth").addEventListener("change", function () { S.img.smooth = +this.value; changed(); });
  $("fmt").addEventListener("change", function () { S.img.fmt = this.value; syncImage(); changed(); });
  $("dither").addEventListener("change", function () { S.img.dither = this.value; changed(); });
  [["thr", "thr"], ["bri", "bri"], ["con", "con"]].forEach(function (p) {
    $(p[0]).addEventListener("input", function () { S.img[p[1]] = +this.value; $(p[0] + "-o").textContent = (p[0] !== "thr" && +this.value > 0 ? "+" : "") + this.value; changed(); });
    $(p[0]).addEventListener("dblclick", function () { S.img[p[1]] = p[0] === "thr" ? 128 : 0; syncImage(); changed(); });
  });
  $("invert").addEventListener("change", function () { S.img.invert = this.checked; changed(); });
  $("tiles").addEventListener("change", function () { S.img.tiles = this.checked; $("tile-size").hidden = !this.checked; frameIdx = 0; changed(); });
  ["tile-w", "tile-h"].forEach(function (id) { $(id).addEventListener("change", function () { S.img[id === "tile-w" ? "tileW" : "tileH"] = num(id, 1, 2048, 16); frameIdx = 0; changed(); }); });

  // ---------------------------------------------------------------- font settings
  async function openFont(file) {
    try {
      var fam = await F.loadFile(file);
      S.font.family = fam; fontFileName = file.name; $("family").value = "";
      S.font.name = X.ident(file.name, "font");
      $("font-info").textContent = file.name; $("name").value = S.font.name;
      changed();
    } catch (e) { $("font-info").textContent = file.name + " cannot be read as a font."; }
  }
  $("font-open").addEventListener("click", function () { $("font-file").click(); });
  $("font-file").addEventListener("change", function () { if (this.files[0]) openFont(this.files[0]); this.value = ""; });
  $("family").addEventListener("change", function () { var v = this.value.trim(); if (!v) return; S.font.family = v; fontFileName = ""; $("font-info").textContent = ""; changed(); });
  $("fsize").addEventListener("change", function () { S.font.size = num("fsize", 4, 200, 8); this.value = S.font.size; changed(); });
  $("fthr").addEventListener("input", function () { S.font.thr = +this.value; $("fthr-o").textContent = this.value; changed(); });
  $("fthr").addEventListener("dblclick", function () { S.font.thr = 128; syncFont(); changed(); });
  $("bold").addEventListener("change", function () { S.font.bold = this.checked; changed(); });
  $("italic").addEventListener("change", function () { S.font.italic = this.checked; changed(); });
  $("set").addEventListener("change", function () { S.font.set = this.value; syncFont(); changed(); });
  $("custom").addEventListener("input", function () { S.font.custom = this.value; changed(); });
  segClick("fmode", function (v) { S.font.mode = v; if (v === "gfx" && S.out.lang !== "c") S.out.lang = "c"; syncFont(); changed(); });
  $("auto-cell").addEventListener("change", function () { S.font.auto = this.checked; syncFont(); changed(); });
  [["cw", "cw", 1, 255], ["ch", "ch", 1, 255], ["base", "base", 0, 255], ["xoff", "xoff", -64, 64], ["spacing", "spacing", -10, 20]].forEach(function (p) {
    $(p[0]).addEventListener("change", function () { S.font[p[1]] = num(p[0], p[2], p[3], S.font[p[1]]); this.value = S.font[p[1]]; changed(); });
  });
  $("yadv").addEventListener("change", function () { var v = parseInt(this.value, 10); S.font.yadv = isFinite(v) && v > 0 ? Math.min(255, v) : ""; changed(); });
  $("centre").addEventListener("change", function () { S.font.centre = this.checked; changed(); });
  $("sample").addEventListener("input", function () { S.sample = this.value; save(); drawFont(); });
  function syncFont() {
    var o = S.font;
    if (!/^dc-font-/.test(o.family)) $("family").value = o.family;
    $("fsize").value = o.size; $("fthr").value = o.thr; $("fthr-o").textContent = o.thr; $("bold").checked = o.bold; $("italic").checked = o.italic;
    $("set").value = o.set; $("custom").value = o.set === "custom" ? o.custom : F.SETS[o.set].text; $("custom").readOnly = o.set !== "custom";
    pressed($("fmode"), o.mode); $("fixed-opts").hidden = o.mode !== "fixed"; $("gfx-opts").hidden = o.mode !== "gfx";
    $("auto-cell").checked = o.auto; ["cw", "ch", "base"].forEach(function (id) { $(id).disabled = o.auto; $(id).value = o[id]; });
    $("xoff").value = o.xoff; $("xoff").disabled = o.centre; $("centre").checked = o.centre; $("spacing").value = o.spacing; $("yadv").value = o.yadv;
    syncOut();
  }

  // ---------------------------------------------------------------- output settings
  segClick("lang", function (v) { S.out.lang = v; syncOut(); changed(); });
  $("name").addEventListener("change", function () { var v = X.ident(this.value, S.mode === "font" ? "font" : "image"); this.value = v; (S.mode === "font" ? S.font : S.img).name = v; changed(); });
  $("layout").addEventListener("change", function () { S.out.layout = this.value; syncOut(); changed(); });
  segClick("order", function (v) { S.out.order = v; syncOut(); changed(); });
  [["word16", "word16"], ["progmem", "progmem"], ["sizebytes", "sizebytes"], ["upper", "upper"]].forEach(function (p) { $(p[0]).addEventListener("change", function () { S.out[p[1]] = this.checked; changed(); }); });
  $("perline").addEventListener("change", function () { S.out.perline = num("perline", 1, 64, 16); this.value = S.out.perline; changed(); });
  function syncOut() {
    var o = S.out, font = S.mode === "font", gfx = font && S.font.mode === "gfx", fmt = S.img.fmt;
    $("lang").querySelectorAll("button").forEach(function (b) { b.disabled = gfx && b.dataset.v !== "c"; });
    if (gfx) o.lang = "c";
    pressed($("lang"), o.lang);
    $("name").value = font ? S.font.name : S.img.name || "image";
    var showLayout = font ? !gfx : fmt === "mono";
    $("layout-f").hidden = !showLayout; $("layout").value = o.layout;
    $("layout-use").textContent = showLayout ? "For " + DC.LAYOUTS[o.layout].use + "." : "";
    $("order-f").hidden = font || fmt !== "rgb565"; pressed($("order"), o.order);
    $("word-f").hidden = font || fmt !== "rgb565" || o.lang !== "c"; $("word16").checked = o.word16;
    $("pm-f").hidden = o.lang !== "c"; $("progmem").checked = o.progmem;
    $("sz-f").hidden = font; $("sizebytes").checked = o.sizebytes;
    $("perline").value = o.perline; $("perline").closest(".pair").hidden = o.lang === "bin"; $("upper").checked = o.upper;
  }

  // ---------------------------------------------------------------- view settings
  $("look").addEventListener("change", function () { S.look = this.value; save(); draw(); });
  $("zoom").addEventListener("change", function () { S.zoom = +this.value; save(); draw(); });
  $("grid").addEventListener("change", function () { S.grid = this.checked; save(); draw(); });
  segClick("mode", function (v) { setMode(v); });
  function setMode(m) {
    S.mode = m; pressed($("mode"), m);
    document.querySelectorAll("[data-mode]").forEach(function (el) { el.hidden = el.dataset.mode !== m; });
    stopPlay();
    syncImage(); changed();
  }

  // ---------------------------------------------------------------- the conversion
  function changed() { save(); update(); }
  function tilesOf(c) {
    var I = S.img, tw = Math.min(I.tileW, c.width), th = Math.min(I.tileH, c.height), out = [];
    for (var y = 0; y + th <= c.height; y += th) for (var x = 0; x + tw <= c.width; x += tw) {
      var t = document.createElement("canvas"); t.width = tw; t.height = th; t.getContext("2d").drawImage(c, x, y, tw, th, 0, 0, tw, th); out.push(t);
      if (out.length >= 1024) return out;
    }
    return out;
  }
  function run() {
    if (S.mode === "font") { runFont(); return; }
    var I = S.img, list = [];
    if (!sources.length) { sources = [demo()]; srcName = "demo picture"; afterSource(); return; }
    sources.forEach(function (c) { list = list.concat(I.tiles ? tilesOf(c) : [c]); });
    if (I.preset === "picture") { I.w = list[0].width; I.h = list[0].height; $("w").value = I.w; $("h").value = I.h; }
    var key = [srcName, sources.length, I.w, I.h, I.fmt, I.tiles, I.tileW, I.tileH, list.length].join("|");
    if (key !== editKey) { edits = {}; editKey = key; }
    frames = list.map(function (c, i) {
      var img = DC.render(c, { w: I.w, h: I.h, fit: I.fit, rotate: I.rotate, flipH: I.flipH, flipV: I.flipV, bg: I.bg, smooth: !!I.smooth });
      var f = DC.quantize(img, { fmt: I.fmt, dither: I.dither, threshold: I.thr, brightness: I.bri, contrast: I.con, invert: I.invert });
      var e = edits[i];
      if (e) for (var k = 0; k < e.length; k++) if (e[k] >= 0) f.v[k] = e[k];
      return f;
    });
    if (frameIdx >= frames.length) frameIdx = 0;
    $("edit-clear").hidden = !Object.keys(edits).length;
    $("edit-hint").hidden = I.fmt !== "mono";
    exportImage();
    draw();
  }
  function exportImage() {
    var I = S.img, o = S.out;
    var opt = { name: I.name || "image", source: srcName, fmt: I.fmt, layout: o.layout, order: o.order, lang: o.lang === "py" ? "py" : "c", progmem: o.progmem, word16: o.word16, sizeBytes: o.sizebytes, perLine: o.perline, upper: o.upper };
    result = X.image(frames, opt);
    var f0 = frames[0];
    info(f0.w + " × " + f0.h + " pixels, " + (frames.length > 1 ? frames.length + " frames, " : "") + result.bytes.length.toLocaleString("en") + " bytes", result.warn);
    $("code").value = o.lang === "bin" ? hexdump(result.bytes) : result.text;
  }
  function info(t, warn) {
    var el = $("out-info"); el.textContent = t;
    if (warn) { var s = document.createElement("span"); s.className = "warn"; s.textContent = " " + warn; el.appendChild(s); }
  }
  function hexdump(b) {
    var L = ["// Binary file, " + b.length + " bytes. The download holds the bytes themselves; this is a look at them.", ""];
    var max = Math.min(b.length, 16 * 400);
    for (var i = 0; i < max; i += 16) {
      var row = Array.prototype.slice.call(b, i, i + 16);
      L.push(i.toString(16).padStart(6, "0") + "  " + row.map(function (x) { return x.toString(16).padStart(2, "0"); }).join(" ").padEnd(48) + "  " + row.map(function (x) { return x >= 32 && x < 127 ? String.fromCharCode(x) : "."; }).join(""));
    }
    if (b.length > max) L.push("…");
    return L.join("\n") + "\n";
  }

  function fontOpts() {
    var o = S.font;
    return { family: o.family, size: o.size, bold: o.bold, italic: o.italic, threshold: o.thr, mode: o.mode, w: o.cw, h: o.ch, baseline: o.base, xoff: o.xoff, centre: o.centre, spacing: o.spacing };
  }
  var yAdvance = 0;
  var fontKey = "";
  function runFont() {
    var o = S.font, text = o.set === "custom" ? o.custom : F.SETS[o.set].text, list = F.codes(text);
    $("chars-info").textContent = list.length + " characters";
    fontLabel = (fontFileName || o.family) + " " + o.size + " px" + (o.bold ? " bold" : "") + (o.italic ? " italic" : "");
    var m = F.metrics(fontOpts(), list.length ? list : [65]);
    if (o.auto) { o.cw = Math.max(1, m.advance); o.ch = Math.max(1, m.ascent + m.descent); o.base = m.ascent; ["cw", "ch", "base"].forEach(function (id) { $(id).value = o[id]; }); }
    var k = [o.family, o.size, o.bold, o.italic, o.thr, o.mode, o.cw, o.ch, o.base, o.xoff, o.centre].join("|");
    if (fontKey && k !== fontKey) gEdits = {};      // the edits belong to one set of font settings
    fontKey = k;
    yAdvance = o.yadv || Math.max(1, m.line);
    $("yadv").placeholder = String(Math.max(1, m.line));
    glyphs = F.glyphs(fontOpts(), list);
    glyphs.forEach(function (g) { var e = gEdits[g.code]; if (e && e.w === g.w && e.h === g.h) g.bits = e.bits.slice(); });
    $("gedit-clear").hidden = !Object.keys(gEdits).length;
    var r = X.font(glyphs, { name: o.name, fontName: fontLabel, mode: o.mode, layout: S.out.layout, lang: S.out.lang === "py" ? "py" : "c", progmem: S.out.progmem, perLine: S.out.perline, upper: S.out.upper, yAdvance: yAdvance });
    result = r;
    info(fontLabel + ", " + glyphs.length + " characters" + (o.mode === "fixed" ? ", cell " + o.cw + " × " + o.ch : "") + ", " + r.bytes.length.toLocaleString("en") + " bytes" + (o.mode === "gfx" ? " of bitmaps" : ""), r.warn);
    $("code").value = S.out.lang === "bin" ? hexdump(r.bytes) : r.text;
    drawFont();
  }

  // ---------------------------------------------------------------- drawing
  function colourOf(fmt, v, y) {
    if (fmt === "mono" || fmt === "grey4") {
      var L = LOOKS[S.look] || LOOKS.white, on = L.top && y < 16 ? L.top : L.on, t = fmt === "mono" ? v : v / 15;
      return [L.bg[0] + (on[0] - L.bg[0]) * t, L.bg[1] + (on[1] - L.bg[1]) * t, L.bg[2] + (on[2] - L.bg[2]) * t];
    }
    return DC.toRGB(fmt, v);
  }
  function fitScale(w, h, stage, maxH) {
    if (S.zoom) return S.zoom;
    var avail = stage.clientWidth - 28, s = Math.floor(Math.min(avail / w, maxH / h));
    return Math.max(1, Math.min(16, s));
  }
  // paint w × h pixels (colour function) scaled into canvas c
  function paint(c, w, h, sc, col, gridOn) {
    var d = window.devicePixelRatio || 1;
    c.width = Math.round(w * sc * d); c.height = Math.round(h * sc * d); c.style.width = w * sc + "px"; c.style.height = h * sc + "px";
    var off = document.createElement("canvas"); off.width = w; off.height = h;
    var og = off.getContext("2d"), id = og.createImageData(w, h);
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) { var p = col(x, y), i = (y * w + x) * 4; id.data[i] = p[0]; id.data[i + 1] = p[1]; id.data[i + 2] = p[2]; id.data[i + 3] = 255; }
    og.putImageData(id, 0, 0);
    var g = c.getContext("2d");
    g.setTransform(d, 0, 0, d, 0, 0); g.imageSmoothingEnabled = false;
    g.drawImage(off, 0, 0, w * sc, h * sc);
    if (gridOn && sc >= 5) {
      g.strokeStyle = "rgba(128,128,128,0.35)"; g.lineWidth = 1 / d; g.beginPath();
      for (var gx = 1; gx < w; gx++) { g.moveTo(gx * sc, 0); g.lineTo(gx * sc, h * sc); }
      for (var gy = 1; gy < h; gy++) { g.moveTo(0, gy * sc); g.lineTo(w * sc, gy * sc); }
      g.stroke();
    }
    return g;
  }
  var pvScale = 1;
  function draw() {
    if (S.mode === "font") { drawFont(); return; }
    var f = frames[frameIdx];
    if (!f) return;
    pvScale = fitScale(f.w, f.h, $("stage"), Math.max(200, window.innerHeight * 0.6));
    paint($("pv"), f.w, f.h, pvScale, function (x, y) { return colourOf(f.fmt, f.v[y * f.w + x], y); }, S.grid);
    $("frames").hidden = frames.length < 2;
    $("f-info").textContent = "Frame " + (frameIdx + 1) + " of " + frames.length;
  }
  var gLayout = null;
  function drawFont() {
    if (S.mode !== "font") return;
    var o = S.font, gfx = o.mode === "gfx", list = glyphs, look = function (on, y) { return colourOf("mono", on ? 1 : 0, y); };
    // the sample line
    var byCode = {}; list.forEach(function (g) { byCode[g.code] = g; });
    var chars = Array.from(S.sample || " ").map(function (ch) { return byCode[ch.codePointAt(0)]; });
    var asc = gfx ? Math.max(1, list.reduce(function (m, g) { return Math.max(m, -g.yOff); }, 0)) : 0;
    var H = gfx ? Math.max(yAdvance, asc + list.reduce(function (m, g) { return Math.max(m, g.h + g.yOff); }, 0)) : o.ch, W = 0;
    chars.forEach(function (g) { W += g ? (gfx ? g.adv : g.w) : o.cw; });
    W = Math.max(8, W + 2); H += 2;
    var px = new Uint8Array(W * H), pen = 1;
    chars.forEach(function (g) {
      if (!g) { pen += gfx ? Math.round(o.size / 2) : o.cw; return; }
      var ox = gfx ? pen + g.xOff : pen, oy = gfx ? 1 + asc + g.yOff : 1;
      for (var y = 0; y < g.h; y++) for (var x = 0; x < g.w; x++) if (g.bits[y * g.w + x]) { var X2 = ox + x, Y2 = oy + y; if (X2 >= 0 && X2 < W && Y2 >= 0 && Y2 < H) px[Y2 * W + X2] = 1; }
      pen += gfx ? g.adv : g.w;
    });
    var ss = fitScale(W, H, $("stage-s"), 160);
    paint($("pv-sample"), W, H, ss, function (x, y) { return look(px[y * W + x], y); }, false);
    // all characters in a grid of cells
    var cw = gfx ? Math.max(1, list.reduce(function (m, g) { return Math.max(m, g.xOff + g.w, g.adv); }, 1)) : o.cw;
    var chh = gfx ? H - 2 : o.ch, cols = Math.max(1, Math.min(16, list.length)), rows = Math.ceil(list.length / cols) || 1, gap = 1;
    var GW = cols * (cw + gap) + gap, GH = rows * (chh + gap) + gap, gs = fitScale(GW, GH, $("stage-g"), 2000);
    var cell = new Int16Array(GW * GH).fill(-1), map = new Int32Array(GW * GH).fill(-1);
    list.forEach(function (g, i) {
      var cx = gap + (i % cols) * (cw + gap), cy = gap + Math.floor(i / cols) * (chh + gap);
      for (var y = 0; y < chh; y++) for (var x = 0; x < cw; x++) cell[(cy + y) * GW + cx + x] = 0;
      var ox = gfx ? cx + Math.max(0, g.xOff) : cx, oy = gfx ? cy + asc + g.yOff : cy;
      for (var y2 = 0; y2 < g.h; y2++) for (var x2 = 0; x2 < g.w; x2++) {
        var X3 = ox + x2, Y3 = oy + y2;
        if (X3 < cx || X3 >= cx + cw || Y3 < cy || Y3 >= cy + chh) continue;
        cell[Y3 * GW + X3] = g.bits[y2 * g.w + x2] ? 1 : 2;     // 2: inside the glyph box, not set
        map[Y3 * GW + X3] = i * 65536 + y2 * 256 + x2;
      }
    });
    var L = LOOKS[S.look] || LOOKS.white, sepCol = L.dark ? [120, 120, 120] : [70, 76, 90];
    paint($("pv-glyphs"), GW, GH, gs, function (x, y) {
      var v = cell[y * GW + x];
      if (v < 0) return sepCol;
      if (v === 2 && gfx) { var b = look(0, 99); return [b[0] * 0.85 + 30, b[1] * 0.85 + 30, b[2] * 0.85 + 30]; }
      return look(v === 1, 99);
    }, S.grid);
    gLayout = { GW: GW, GH: GH, scale: gs, map: map, cols: cols, cw: cw, chh: chh, gap: gap };
  }

  // ---------------------------------------------------------------- pixel editing
  function editor(canvas, hit, apply) {
    var painting = null;
    canvas.addEventListener("pointerdown", function (e) {
      var h = hit(e); if (!h) return;
      painting = h.value ? 0 : 1; canvas.setPointerCapture(e.pointerId); apply(h, painting); e.preventDefault();
    });
    canvas.addEventListener("pointermove", function (e) { if (painting === null) { var h = hit(e); canvas.style.cursor = h ? "crosshair" : "default"; if (h && h.title) canvas.title = h.title; return; } var h2 = hit(e); if (h2) apply(h2, painting); });
    var end = function () { if (painting !== null) { painting = null; update(); } };
    canvas.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", end);
  }
  function at(e, c) { var r = c.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  editor($("pv"), function (e) {
    var f = frames[frameIdx]; if (!f || f.fmt !== "mono") return null;
    var p = at(e, $("pv")), x = Math.floor(p.x / pvScale), y = Math.floor(p.y / pvScale);
    if (x < 0 || y < 0 || x >= f.w || y >= f.h) return null;
    return { x: x, y: y, value: f.v[y * f.w + x] };
  }, function (h, v) {
    var f = frames[frameIdx], e = edits[frameIdx] || (edits[frameIdx] = new Int8Array(f.w * f.h).fill(-1)), i = h.y * f.w + h.x;
    if (f.v[i] === v && e[i] === v) return;
    e[i] = v; f.v[i] = v;
    var g = $("pv").getContext("2d"), col = colourOf("mono", v, h.y);
    g.fillStyle = "rgb(" + col.map(Math.round).join(",") + ")"; g.fillRect(h.x * pvScale, h.y * pvScale, pvScale - (S.grid && pvScale >= 5 ? 1 : 0), pvScale - (S.grid && pvScale >= 5 ? 1 : 0));
  });
  $("edit-clear").addEventListener("click", function () { edits = {}; update(); });
  editor($("pv-glyphs"), function (e) {
    if (!gLayout) return null;
    var p = at(e, $("pv-glyphs")), x = Math.floor(p.x / gLayout.scale), y = Math.floor(p.y / gLayout.scale);
    if (x < 0 || y < 0 || x >= gLayout.GW || y >= gLayout.GH) return null;
    var m = gLayout.map[y * gLayout.GW + x]; if (m < 0) return null;
    var gi = Math.floor(m / 65536), g = glyphs[gi], gy = (m >> 8) & 255, gx = m & 255;
    return { g: g, gx: gx, gy: gy, value: g.bits[gy * g.w + gx], title: (String.fromCodePoint(g.code).trim() ? "'" + String.fromCodePoint(g.code) + "' " : "") + "0x" + g.code.toString(16).toUpperCase() };
  }, function (h, v) {
    var g = h.g, i = h.gy * g.w + h.gx;
    if (g.bits[i] === v) return;
    g.bits[i] = v;
    gEdits[g.code] = { w: g.w, h: g.h, bits: g.bits.slice() };
    drawFont();
  });
  $("gedit-clear").addEventListener("click", function () { gEdits = {}; update(); });
  // ---------------------------------------------------------------- frames
  var playT = 0;
  function stopPlay() { clearInterval(playT); playT = 0; $("f-play").textContent = "Play"; }
  $("f-prev").addEventListener("click", function () { stopPlay(); frameIdx = (frameIdx - 1 + frames.length) % frames.length; draw(); });
  $("f-next").addEventListener("click", function () { stopPlay(); frameIdx = (frameIdx + 1) % frames.length; draw(); });
  $("f-play").addEventListener("click", function () {
    if (playT) { stopPlay(); return; }
    var fps = num("fps", 1, 60, 8);
    playT = setInterval(function () { frameIdx = (frameIdx + 1) % frames.length; draw(); }, 1000 / fps);
    this.textContent = "Stop";
  });

  // ---------------------------------------------------------------- copy and download
  $("copy").addEventListener("click", async function () {
    var b = this, t = S.out.lang === "bin" ? $("code").value : result ? result.text : "";
    try { await navigator.clipboard.writeText(t); }
    catch (e) { $("code").select(); document.execCommand("copy"); }
    b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy"; }, 1500);
  });
  $("save").addEventListener("click", function () {
    if (!result) return;
    var name = (S.mode === "font" ? S.font.name : S.img.name || "image") + LANGS[S.out.lang];
    var blob = S.out.lang === "bin" ? new Blob([result.bytes], { type: "application/octet-stream" }) : new Blob([result.text], { type: "text/plain" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  });

  // ---------------------------------------------------------------- start
  var rt = 0;
  window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(draw, 150); });
  $("look").value = S.look; $("zoom").value = S.zoom; $("grid").checked = S.grid; $("sample").value = S.sample;
  syncImage(); syncFont(); setMode(S.mode);
})();
