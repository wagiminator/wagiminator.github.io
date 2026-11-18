/* C64 Pixel Studio: tiles (blocks of characters for the level) */
(function () {
  "use strict";

  var PS = window.PS, G = PS.G, $ = PS.$;
  var ED = 6, PAL = 2, PCELL = 8 * PAL + 2;

  function tile() { return PS.p.tiles[PS.sel.tile]; }
  PS.tileImage = function (img, ox, oy, t, scale) {
    var p = PS.p;
    for (var y = 0; y < p.tileH; y++) for (var x = 0; x < p.tileW; x++) PS.charImage(img, ox + x * 8 * scale, oy + y * 8 * scale, t[y * p.tileW + x], scale);
  };

  // ---------------------------------------------------------------- tile editor
  var cv = $("tile-ed"), painting = false;
  function renderEditor() {
    var p = PS.p, w = p.tileW * 8 * ED, h = p.tileH * 8 * ED, t = tile();
    var g = PS.paintCanvas(cv, w, h, function (img) { PS.tileImage(img, 0, 0, t, ED); });
    g.fillStyle = "rgba(240,164,0,0.8)";
    for (var x = 1; x < p.tileW; x++) g.fillRect(x * 8 * ED - 1, 0, 2, h);
    for (var y = 1; y < p.tileH; y++) g.fillRect(0, y * 8 * ED - 1, w, 2);
  }
  function cellAt(e) {
    var r = cv.getBoundingClientRect(), p = PS.p;
    var x = Math.floor((e.clientX - r.left) * cv.width / r.width / (8 * ED)), y = Math.floor((e.clientY - r.top) * cv.height / r.height / (8 * ED));
    return x >= 0 && y >= 0 && x < p.tileW && y < p.tileH ? y * p.tileW + x : -1;
  }
  cv.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  cv.addEventListener("pointerdown", function (e) {
    var i = cellAt(e); if (i < 0) return;
    if (e.button === 2 || e.altKey) { PS.sel.char = tile()[i]; render(); return; }
    PS.checkpoint("Change tile");
    painting = true; cv.setPointerCapture(e.pointerId);
    tile()[i] = PS.sel.char; renderEditor();
  });
  cv.addEventListener("pointermove", function (e) {
    var i = cellAt(e), p = PS.p;
    $("tile-status").textContent = i < 0 ? " " : "Column " + (i % p.tileW) + ", row " + ((i / p.tileW) | 0) + " · character $" + PS.hex(tile()[i], 2);
    if (painting && i >= 0 && tile()[i] !== PS.sel.char) { tile()[i] = PS.sel.char; renderEditor(); }
  });
  cv.addEventListener("pointerup", function () { if (painting) { painting = false; PS.changed(); } });

  // ---------------------------------------------------------------- characters to choose from
  function renderChars() {
    var c = $("tile-chars"), W = 16 * PCELL;
    var g = PS.paintCanvas(c, W, W, function (img) {
      var px = img.data;
      for (var i = 0; i < px.length; i += 4) { px[i] = 0xdc; px[i + 1] = 0xdd; px[i + 2] = 0xe6; px[i + 3] = 255; }
      for (var k = 0; k < 256; k++) PS.charImage(img, (k % 16) * PCELL + 1, (k >> 4) * PCELL + 1, k, PAL);
    });
    var s = PS.sel.char;
    g.strokeStyle = "#f0a400"; g.lineWidth = 2;
    g.strokeRect((s % 16) * PCELL, (s >> 4) * PCELL, PCELL, PCELL);
    $("tile-charinfo").textContent = "Character $" + PS.hex(s, 2) + " (" + s + ")";
  }
  $("tile-chars").addEventListener("click", function (e) {
    var c = $("tile-chars"), r = c.getBoundingClientRect();
    var x = Math.floor((e.clientX - r.left) * c.width / r.width / PCELL), y = Math.floor((e.clientY - r.top) * c.height / r.height / PCELL);
    if (x < 0 || y < 0 || x > 15 || y > 15) return;
    PS.sel.char = y * 16 + x; renderChars();
  });

  // ---------------------------------------------------------------- list
  function renderList() {
    var box = $("tile-list"), tiles = PS.p.tiles, p = PS.p;
    $("tile-count").textContent = "(" + tiles.length + ")";
    var sc = Math.max(1, Math.min(3, Math.floor(48 / (8 * Math.max(p.tileW, p.tileH)))));
    box.innerHTML = "";
    tiles.forEach(function (t, i) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "thumb" + (i === PS.sel.tile ? " on" : ""); b.setAttribute("data-i", i);
      b.setAttribute("role", "option"); b.setAttribute("aria-selected", i === PS.sel.tile ? "true" : "false");
      var c = document.createElement("canvas");
      PS.paintCanvas(c, p.tileW * 8 * sc, p.tileH * 8 * sc, function (img) { PS.tileImage(img, 0, 0, t, sc); });
      b.appendChild(c);
      var s = document.createElement("span"); s.textContent = i; b.appendChild(s);
      box.appendChild(b);
    });
    PS.showSelected(box);
  }
  $("tile-list").addEventListener("click", function (e) { var b = e.target.closest("[data-i]"); if (b) { PS.sel.tile = +b.getAttribute("data-i"); render(); } });
  document.querySelectorAll("[data-tlist]").forEach(function (b) {
    b.addEventListener("click", function () {
      var a = b.getAttribute("data-tlist"), list = PS.p.tiles, i = PS.sel.tile, m = PS.p.map.cells, k;
      if (a === "add" || a === "dup") {
        if (list.length >= 1024) { PS.say("1024 tiles at most."); return; }
        PS.checkpoint(a === "add" ? "New tile" : "Duplicate tile");
        list.splice(i + 1, 0, a === "add" ? new Uint8Array(PS.p.tileW * PS.p.tileH).fill(0x20) : list[i].slice());
        for (k = 0; k < m.length; k++) if (m[k] > i) m[k]++;
        PS.sel.tile = i + 1;
      } else if (a === "del") {
        if (list.length <= 1) { PS.say("A level needs at least one tile."); return; }
        PS.checkpoint("Delete tile");
        list.splice(i, 1);
        for (k = 0; k < m.length; k++) { if (m[k] === i) m[k] = 0; else if (m[k] > i) m[k]--; }
        PS.sel.tile = Math.min(i, list.length - 1);
      } else {
        var j = i + (a === "back" ? -1 : 1);
        if (j < 0 || j >= list.length) return;
        PS.checkpoint("Move tile");
        PS.move(list, i, j - i);
        for (k = 0; k < m.length; k++) { if (m[k] === i) m[k] = j; else if (m[k] === j) m[k] = i; }
        PS.sel.tile = j;
      }
      PS.changed();
    });
  });

  // ---------------------------------------------------------------- size
  (function () {
    var h = ""; for (var n = 1; n <= 8; n++) h += '<option value="' + n + '">' + n + "</option>";
    $("tile-w").innerHTML = h; $("tile-h").innerHTML = h;
  })();
  $("tile-size").addEventListener("click", function () {
    var w = +$("tile-w").value, h = +$("tile-h").value;
    if (w === PS.p.tileW && h === PS.p.tileH) return;
    PS.checkpoint("Tile size");
    PS.M.resizeTiles(PS.p, w, h);
    PS.changed();
  });

  function render() {
    PS.clampSel();
    var p = PS.p;
    $("tile-title").textContent = "Tile " + PS.sel.tile;
    $("tile-info").textContent = p.tileW + "×" + p.tileH + " characters";
    $("tile-w").value = String(p.tileW); $("tile-h").value = String(p.tileH);
    renderEditor(); renderChars(); renderList();
  }
  PS.register("tiles", {
    render: render,
    key: function (k) {
      if (k === "[" || k === "]") { PS.sel.tile = Math.max(0, Math.min(PS.p.tiles.length - 1, PS.sel.tile + (k === "[" ? -1 : 1))); render(); return true; }
      if (k === "copy") { PS.clip.tile = tile().slice(); PS.say("Tile copied."); return true; }
      if (k === "paste" && PS.clip.tile && PS.clip.tile.length === tile().length) { PS.checkpoint("Paste"); tile().set(PS.clip.tile); PS.changed(); return true; }
      return false;
    }
  });
})();
