/* C64 Pixel Studio: export, import and the picture converter */
(function () {
  "use strict";

  var PS = window.PS, G = PS.G, F = window.PSFormats, $ = PS.$, hex = PS.hex;

  // ---------------------------------------------------------------- PNG
  function pngFrom(w, h, draw, name) {
    var c = document.createElement("canvas");
    PS.paintCanvas(c, w, h, draw);
    c.toBlob(function (b) { if (b) PS.download(name, b); }, "image/png");
  }
  function fillBg(img, col) {
    var px = img.data, rgb = G.RGB[col];
    for (var i = 0; i < px.length; i += 4) { px[i] = rgb[0]; px[i + 1] = rgb[1]; px[i + 2] = rgb[2]; px[i + 3] = 255; }
  }
  var png = {
    sprites: function (sc) {
      var list = PS.p.sprites, cols = Math.min(8, list.length), rows = Math.ceil(list.length / cols);
      pngFrom(cols * 24 * sc, rows * 21 * sc, function (img) {
        list.forEach(function (s, i) { G.drawSprite(img, (i % cols) * 24 * sc, Math.floor(i / cols) * 21 * sc, Object.assign({}, s, { xe: false, ye: false }), PS.p.colors, sc, sc, null); });
      }, PS.fileBase() + "-sprites.png");
    },
    object: function (sc) {
      var o = PS.p.objects[PS.sel.object]; if (!o) return;
      var b = PS.objectBounds(o), w = b.x1 - b.x0, h = b.y1 - b.y0;
      pngFrom(w * sc * o.frames.length, h * sc, function (img) {
        o.frames.forEach(function (f, i) { PS.drawObjectFrame(img, f, (i * w - b.x0) * sc, -b.y0 * sc, sc); });
      }, PS.fileBase() + "-" + (o.name || "object").replace(/\W+/g, "-") + ".png");
    },
    chars: function (sc) {
      pngFrom(128 * sc, 128 * sc, function (img) {
        for (var c = 0; c < 256; c++) PS.charImage(img, (c % 16) * 8 * sc, (c >> 4) * 8 * sc, c, sc);
      }, PS.fileBase() + "-charset.png");
    },
    tiles: function (sc) {
      var p = PS.p, n = p.tiles.length, cols = Math.min(16, n), tw = p.tileW * 8 * sc, th = p.tileH * 8 * sc;
      pngFrom(cols * tw, Math.ceil(n / cols) * th, function (img) {
        p.tiles.forEach(function (t, i) { PS.tileImage(img, (i % cols) * tw, Math.floor(i / cols) * th, t, sc); });
      }, PS.fileBase() + "-tiles.png");
    },
    map: function (sc) {
      var p = PS.p, m = p.map, tw = p.tileW * 8 * sc, th = p.tileH * 8 * sc;
      if (m.w * tw * m.h * th > 64e6) { PS.say("The level is too large for a PNG at this size: choose 1×."); return; }
      pngFrom(m.w * tw, m.h * th, function (img) {
        for (var y = 0; y < m.h; y++) for (var x = 0; x < m.w; x++) PS.tileImage(img, x * tw, y * th, p.tiles[m.cells[y * m.w + x]] || p.tiles[0], sc);
      }, PS.fileBase() + "-level.png");
    },
    bitmap: function (sc) {
      var b = PS.p.bitmap;
      pngFrom(320 * sc, 200 * sc, function (img) { G.drawBitmap(img, b, sc, sc); }, PS.fileBase() + "-bitmap.png");
    }
  };

  // ---------------------------------------------------------------- export dialog
  function addrInput(id, value) {
    return '<label class="addr">Load address $<input type="text" id="' + id + '" value="' + value + '" maxlength="4" spellcheck="false"></label>';
  }
  function readAddr(id, def) {
    var v = parseInt(($(id).value || "").replace(/^\$/, ""), 16);
    return isNaN(v) || v < 0 || v > 0xFFFF ? def : v;
  }
  function openExport() {
    var p = PS.p, o = p.objects[PS.sel.object], m = p.map, b = p.bitmap;
    var sec = function (title, sub, body) { return '<section class="ex"><h3>' + title + ' <small>' + sub + "</small></h3><div class=\"ex-btns\">" + body + "</div></section>"; };
    var btn = function (k, text, primary) { return '<button type="button" class="btn sm' + (primary ? " btn-primary" : "") + '" data-ex="' + k + '">' + text + "</button>"; };
    $("export-body").innerHTML =
      '<div class="field inline"><label for="ex-scale">PNG size</label><select id="ex-scale"><option value="1">1×</option><option value="2" selected>2×</option><option value="3">3×</option><option value="4">4×</option><option value="8">8×</option></select></div>' +
      sec("Project", "everything, to open again here", btn("project", "Project file (.json)", true)) +
      sec("Sprites", p.sprites.length + " sprites", btn("spr-bin", "Raw data (.bin)") + btn("spr-spd", "SpritePad 1.x (.spd)") + btn("spr-asm", "Assembler (.asm)") + btn("spr-png", "PNG") +
        '<span class="ex-prg">' + btn("spr-prg", "PRG") + addrInput("ex-spr-addr", "2000") + "</span>") +
      sec("Objects", p.objects.length + " objects", btn("obj-asm", "Tables (.asm)") + (o ? btn("obj-png", "Frames of “" + PS.esc(o.name || "object") + "” (PNG)") : "")) +
      sec("Character set", p.charMode === "mc" ? "multicolour" : "hires", btn("chr-bin", "Raw data (.bin)") + btn("chr-col", "Colours (.bin)") + btn("chr-asm", "Assembler (.asm)") + btn("chr-png", "PNG") +
        '<span class="ex-prg">' + btn("chr-64c", ".64c") + addrInput("ex-chr-addr", "3000") + "</span>") +
      sec("Tiles", p.tiles.length + " tiles of " + p.tileW + "×" + p.tileH, btn("tile-bin", "Raw data (.bin)") + btn("tile-asm", "Assembler (.asm)") + btn("tile-png", "PNG")) +
      sec("Level", m.w + "×" + m.h + " tiles", btn("map-bin", "Tile numbers (.bin)") + btn("map-scr", "Screen codes (.bin)") + btn("map-colbin", "Colours (.bin)") + btn("map-asm", "Assembler (.asm)") + btn("map-png", "PNG")) +
      sec("Bitmap", b.mc ? "multicolour" : "hires",
        (b.mc ? btn("bm-koa", "Koala Painter (.koa)") : btn("bm-aas", "Art Studio (.aas)")) + btn("bm-raw", "Bitmap, screen" + (b.mc ? ", colours" : "") + " (.bin)") + btn("bm-png", "PNG")) +
      '<p class="hint">Raw sprites keep the colour in byte 63 of every sprite (bit 7: multicolour), as SpritePad does. Tile numbers are one byte each (two with more than 256 tiles); screen codes and colours give the whole level character by character.</p>';
    $("dlg-export").showModal();
  }
  $("export-body").addEventListener("click", function (e) {
    var b = e.target.closest("[data-ex]"); if (!b) return;
    var k = b.getAttribute("data-ex"), p = PS.p, base = PS.fileBase(), sc = +$("ex-scale").value, ex;
    var txt = function (name, s) { PS.download(name, s, "text/plain"); };
    switch (k) {
      case "project": saveProject(); break;
      case "spr-bin": PS.download(base + "-sprites.bin", F.spritesRaw(p.sprites)); break;
      case "spr-prg": PS.download(base + "-sprites.prg", F.withLoad(readAddr("ex-spr-addr", 0x2000), F.spritesRaw(p.sprites))); break;
      case "spr-spd": PS.download(base + ".spd", F.spdWrite(p)); break;
      case "spr-asm": txt(base + "-sprites.asm", F.asmSprites(p)); break;
      case "spr-png": png.sprites(sc); break;
      case "obj-asm": txt(base + "-objects.asm", F.asmObjects(p)); break;
      case "obj-png": png.object(sc); break;
      case "chr-bin": PS.download(base + "-charset.bin", p.chars.slice()); break;
      case "chr-64c": PS.download(base + "-charset.64c", F.withLoad(readAddr("ex-chr-addr", 0x3000), p.chars)); break;
      case "chr-col": PS.download(base + "-charcolours.bin", p.charCols.slice()); break;
      case "chr-asm": txt(base + "-charset.asm", F.asmBytes("charset", p.chars, 8, "character set, 8 bytes per character") + "\n" + F.asmBytes("charcolours", p.charCols, 16, "colour of every character")); break;
      case "chr-png": png.chars(sc); break;
      case "tile-bin": PS.download(base + "-tiles.bin", F.tilesRaw(p)); break;
      case "tile-asm": txt(base + "-tiles.asm", F.asmBytes("tiles", F.tilesRaw(p), p.tileW * p.tileH, p.tiles.length + " tiles of " + p.tileW + "x" + p.tileH + " characters, row by row")); break;
      case "tile-png": png.tiles(sc); break;
      case "map-bin": PS.download(base + "-level.bin", F.mapRaw(p)); break;
      case "map-scr": ex = F.mapExpanded(p); PS.download(base + "-level-screen.bin", ex.chars); break;
      case "map-colbin": ex = F.mapExpanded(p); PS.download(base + "-level-colours.bin", ex.cols); break;
      case "map-asm":
        txt(base + "-level.asm", "level_width = " + p.map.w + "\nlevel_height = " + p.map.h + "\n\n" +
          F.asmBytes("level", F.mapRaw(p), Math.min(32, p.map.w), "tile numbers, row by row" + (p.tiles.length > 256 ? " (16 bit, low byte first)" : "")));
        break;
      case "map-png": png.map(sc); break;
      case "bm-koa": PS.download(base + ".koa", F.koalaWrite(p.bitmap)); break;
      case "bm-aas": PS.download(base + ".aas", F.artStudioWrite(p.bitmap)); break;
      case "bm-raw":
        PS.download(base + "-bitmap.bin", p.bitmap.bitmap.slice());
        PS.download(base + "-screen.bin", p.bitmap.screen.slice());
        if (p.bitmap.mc) PS.download(base + "-colours.bin", p.bitmap.color.slice());
        break;
      case "bm-png": png.bitmap(sc); break;
    }
  });
  $("btn-export").addEventListener("click", openExport);

  // ---------------------------------------------------------------- project files
  function saveProject() { PS.download(PS.fileBase() + ".json", PS.M.toJSON(PS.p), "application/json"); PS.say("Project saved as " + PS.fileBase() + ".json."); }
  PS.saveProject = saveProject;
  function loadProject(text) {
    var np = PS.M.fromJSON(text);
    PS.checkpoint("Open project");
    PS.p = np; PS.clampSel();
    PS.changed(); PS.refreshBar();
    PS.say("Project opened. Undo brings the previous one back.");
  }
  $("btn-save").addEventListener("click", saveProject);
  $("btn-open").addEventListener("click", function () { $("file-open").click(); });
  $("file-open").addEventListener("change", function () {
    var f = this.files[0]; this.value = "";
    if (f) f.text().then(function (t) { try { loadProject(t); } catch (e) { PS.say(e.message); } });
  });

  // ---------------------------------------------------------------- import
  var pending = null;
  $("btn-import").addEventListener("click", function () { $("file-import").click(); });
  $("file-import").addEventListener("change", function () { var f = this.files[0]; this.value = ""; if (f) importFile(f); });
  PS.importFile = importFile;
  function importFile(f) {
    var ext = (f.name.split(".").pop() || "").toLowerCase();
    if (/^(png|jpe?g|gif|bmp|webp)$/.test(ext) || /^image\//.test(f.type)) { openConverter(f); return; }
    f.arrayBuffer().then(function (buf) {
      var bytes = new Uint8Array(buf);
      try {
        if (ext === "json" || (bytes[0] === 0x7B && bytes.length > 20)) { loadProject(new TextDecoder().decode(bytes)); return; }
        if (ext === "spd" || (bytes[0] === 0x53 && bytes[1] === 0x50 && bytes[2] === 0x44)) { askSpd(f.name, F.spdRead(bytes)); return; }
        if (/^(koa|kla|aas|art|hpi)$/.test(ext) || [10003, 10001, 10006, 9009, 9002].indexOf(bytes.length) >= 0 && !/^(bin|prg|64c|raw|spr)$/.test(ext)) {
          var bm = F.bitmapRead(bytes, f.name);
          PS.checkpoint("Import picture"); PS.p.bitmap = bm; PS.setMode("bitmap"); PS.changed();
          PS.say("Picture imported (" + (bm.mc ? "Koala Painter" : "Art Studio") + ").");
          return;
        }
        askRaw(f.name, ext, bytes);
      } catch (e) { PS.say(e.message); }
    });
  }
  function askSpd(name, r) {
    pending = { kind: "spd", r: r };
    $("dlg-import-h").textContent = "Import " + name;
    $("import-body").innerHTML = "<p>SpritePad file with " + r.sprites.length + " sprites" + (r.objects.length ? " and " + r.objects.length + " animations" : "") + ".</p>" +
      '<label class="choice"><input type="radio" name="spd-how" value="replace" checked> Replace all sprites (and their colours)</label>' +
      '<label class="choice"><input type="radio" name="spd-how" value="add"> Add them after the sprites I have</label>';
    $("dlg-import").showModal();
  }
  function askRaw(name, ext, bytes) {
    var n = bytes.length, p = PS.p;
    var load = n > 2 && ((n - 2) % 64 === 0 || (n - 2) % 64 === 63 || n === 2050 || ext === "prg" || ext === "64c") && ext !== "bin";
    var guess = (ext === "64c" || n === 2048 || n === 2050) ? "chars" : ((n - (load ? 2 : 0)) % 64 === 0 || ext === "spr") ? "sprites" : n === 256 ? "cols" : "sprites";
    pending = { kind: "raw", bytes: bytes };
    $("dlg-import-h").textContent = "Import " + name;
    $("import-body").innerHTML = "<p>" + n + " bytes. What is in this file?</p>" +
      ['sprites|Sprites (64 bytes each)', 'chars|Character set (8 bytes per character)', 'cols|Character colours (one byte per character)',
       'tiles|Tiles (' + p.tileW + "×" + p.tileH + " characters each)", 'map|Level (one tile number per byte)'].map(function (o) {
        var v = o.split("|");
        return '<label class="choice"><input type="radio" name="raw-what" value="' + v[0] + '"' + (v[0] === guess ? " checked" : "") + "> " + v[1] + "</label>";
      }).join("") +
      '<div class="raw-opts">' +
      '<label class="choice"><input type="checkbox" id="raw-load"' + (load ? " checked" : "") + "> Starts with a load address (2 bytes)</label>" +
      '<label class="choice"><input type="radio" name="raw-how" value="replace" checked> Replace</label>' +
      '<label class="choice"><input type="radio" name="raw-how" value="add"> Add (sprites and tiles)</label>' +
      '<label class="mini">Level width in tiles <input type="number" id="raw-mapw" min="1" max="1024" value="' + p.map.w + '"></label></div>';
    $("dlg-import").showModal();
  }
  $("dlg-import").addEventListener("close", function () {
    var d = $("dlg-import");
    if (d.returnValue !== "ok" || !pending) { pending = null; return; }
    var p = PS.p, q = pending; pending = null;
    var how = (document.querySelector('[name="spd-how"]:checked, [name="raw-how"]:checked') || {}).value || "replace";
    PS.checkpoint("Import");
    if (q.kind === "spd") {
      var start = how === "add" ? p.sprites.length : 0;
      if (how === "add") p.sprites = p.sprites.concat(q.r.sprites).slice(0, 256);
      else { p.sprites = q.r.sprites; p.objects = []; Object.assign(p.colors, q.r.colors); }
      q.r.objects.forEach(function (o) { o.frames.forEach(function (f) { f.layers.forEach(function (l) { l.s += start; }); }); p.objects.push(o); });
      PS.sel.sprite = start; PS.setMode("sprites");
      PS.say(q.r.sprites.length + " sprites imported.");
    } else {
      var what = document.querySelector('[name="raw-what"]:checked').value, b = q.bytes;
      if ($("raw-load").checked) b = b.subarray(2);
      if (what === "sprites") {
        var list = F.spritesFromRaw(b);
        if (!list.length) { PS.hist.drop(); PS.say("Not enough bytes for a sprite."); return; }
        if (how === "add") { PS.sel.sprite = p.sprites.length; p.sprites = p.sprites.concat(list).slice(0, 256); }
        else { p.sprites = list; PS.sel.sprite = 0; fixLayers(); }
        PS.setMode("sprites"); PS.say(list.length + " sprites imported.");
      } else if (what === "chars") { p.chars.fill(0); p.chars.set(b.subarray(0, 2048)); PS.setMode("chars"); PS.say(Math.min(256, b.length >> 3) + " characters imported."); }
      else if (what === "cols") { p.charCols.set(Array.from(b.subarray(0, 256), function (v) { return v & 15; })); PS.setMode("chars"); PS.say("Character colours imported."); }
      else if (what === "tiles") {
        var sz = p.tileW * p.tileH, tl = [];
        for (var o = 0; o + sz <= b.length; o += sz) tl.push(b.slice(o, o + sz));
        if (!tl.length) { PS.hist.drop(); PS.say("Not enough bytes for a tile."); return; }
        if (how === "add") { PS.sel.tile = p.tiles.length; p.tiles = p.tiles.concat(tl); } else { p.tiles = tl; PS.sel.tile = 0; }
        PS.setMode("tiles"); PS.say(tl.length + " tiles imported.");
      } else if (what === "map") {
        var w = Math.max(1, Math.min(1024, parseInt($("raw-mapw").value, 10) || p.map.w)), h = Math.max(1, Math.ceil(b.length / w));
        p.map = { w: w, h: h, cells: new Uint16Array(w * h) };
        for (var i = 0; i < b.length; i++) p.map.cells[i] = Math.min(b[i], p.tiles.length - 1);
        PS.setMode("map"); PS.say("Level imported: " + w + "×" + h + " tiles.");
      }
    }
    PS.clampSel(); PS.changed();
  });
  function fixLayers() {
    var n = PS.p.sprites.length;
    PS.p.objects.forEach(function (o) { o.frames.forEach(function (f) { f.layers = f.layers.filter(function (l) { return l.s < n; }); }); });
  }

  // drop files onto the page
  document.addEventListener("dragover", function (e) { if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types, "Files") >= 0) { e.preventDefault(); document.body.classList.add("dragging"); } });
  document.addEventListener("dragleave", function (e) { if (!e.relatedTarget) document.body.classList.remove("dragging"); });
  document.addEventListener("drop", function (e) {
    document.body.classList.remove("dragging");
    if (!e.dataTransfer || !e.dataTransfer.files.length) return;
    e.preventDefault();
    importFile(e.dataTransfer.files[0]);
  });

  // ---------------------------------------------------------------- picture converter
  var conv = { img: null, result: null, timer: null };
  function openConverter(file) {
    if (!file) {
      var inp = document.createElement("input");
      inp.type = "file"; inp.accept = "image/*";
      inp.addEventListener("change", function () { if (inp.files[0]) openConverter(inp.files[0]); });
      inp.click();
      return;
    }
    var url = URL.createObjectURL(file), im = new Image();
    im.onload = function () {
      conv.img = im;
      $("dlg-convert-h").textContent = "Convert " + file.name;
      $("conv-mode").value = PS.p.bitmap.mc ? "mc" : "hires";
      var bg = $("conv-bg");
      if (!bg.options.length) bg.innerHTML = '<option value="auto">Automatic</option>' + G.NAMES.map(function (n, i) { return '<option value="' + i + '">' + i + " " + n + "</option>"; }).join("");
      runConvert();
      $("dlg-convert").showModal();
      URL.revokeObjectURL(url);
    };
    im.onerror = function () { PS.say("This picture cannot be read by the browser."); URL.revokeObjectURL(url); };
    im.src = url;
  }
  PS.openConverter = openConverter;
  function source() {
    var c = document.createElement("canvas"); c.width = 320; c.height = 200;
    var g = c.getContext("2d"), im = conv.img, fit = $("conv-fit").value;
    g.fillStyle = "#000"; g.fillRect(0, 0, 320, 200);
    var iw = im.naturalWidth, ih = im.naturalHeight, s, w, h;
    if (fit === "stretch") g.drawImage(im, 0, 0, 320, 200);
    else {
      s = fit === "cover" ? Math.max(320 / iw, 200 / ih) : Math.min(320 / iw, 200 / ih);
      w = iw * s; h = ih * s;
      g.imageSmoothingQuality = "high";
      g.drawImage(im, (320 - w) / 2, (200 - h) / 2, w, h);
    }
    return c;
  }
  function runConvert() {
    var mc = $("conv-mode").value === "mc", src = source();
    $("conv-src").getContext("2d").drawImage(src, 0, 0);
    var t = document.createElement("canvas"); t.width = mc ? 160 : 320; t.height = 200;
    var tg = t.getContext("2d"); tg.imageSmoothingQuality = "high"; tg.drawImage(src, 0, 0, t.width, 200);
    var data = tg.getImageData(0, 0, t.width, 200).data, bgv = $("conv-bg").value;
    conv.result = window.PSConvert.convert(data, {
      mc: mc, dither: $("conv-dither").value, bg: bgv === "auto" ? "auto" : +bgv,
      brightness: +$("conv-br").value, contrast: +$("conv-ct").value, saturation: +$("conv-sat").value
    });
    PS.paintCanvas($("conv-out"), 320, 200, function (img) { G.drawBitmap(img, conv.result, 1, 1); });
  }
  ["conv-mode", "conv-fit", "conv-dither", "conv-bg", "conv-br", "conv-ct", "conv-sat"].forEach(function (id) {
    $(id).addEventListener("input", function () {
      var o = $(id + "-v"); if (o) o.textContent = this.value;
      clearTimeout(conv.timer); conv.timer = setTimeout(runConvert, 80);
    });
  });
  $("dlg-convert").addEventListener("close", function () {
    if ($("dlg-convert").returnValue !== "ok" || !conv.result) return;
    PS.checkpoint("Convert picture");
    conv.result.border = PS.p.bitmap.border;
    PS.p.bitmap = conv.result; conv.result = null;
    PS.setMode("bitmap"); PS.changed();
    PS.say("Picture converted. Undo brings the old one back.");
  });
})();
