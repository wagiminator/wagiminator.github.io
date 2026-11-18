/* C64 Pixel Studio: the level (a map of tiles) */
(function () {
  "use strict";

  var PS = window.PS, G = PS.G, $ = PS.$;
  var view = $("map-view"), cv = $("map-cv"), space = $("map-space");
  var cache = { sig: "", tiles: [] }, drag = null, hover = null;

  function zoom() { return +$("map-zoom").value; }
  function tilePx() { return { w: PS.p.tileW * 8 * zoom(), h: PS.p.tileH * 8 * zoom() }; }

  // one canvas per tile, made again when characters, colours or tiles change
  function signature() {
    var p = PS.p, h = 7, i;
    for (i = 0; i < 2048; i++) h = (h * 31 + p.chars[i]) | 0;
    for (i = 0; i < 256; i++) h = (h * 31 + p.charCols[i]) | 0;
    p.tiles.forEach(function (t) { for (var k = 0; k < t.length; k++) h = (h * 31 + t[k]) | 0; });
    return h + ":" + p.tiles.length + ":" + p.tileW + "x" + p.tileH + ":" + JSON.stringify(p.colors) + p.charMode;
  }
  function tiles() {
    var sig = signature();
    if (sig !== cache.sig) {
      cache.sig = sig;
      cache.tiles = PS.p.tiles.map(function (t) {
        var c = document.createElement("canvas");
        PS.paintCanvas(c, PS.p.tileW * 8, PS.p.tileH * 8, function (img) { PS.tileImage(img, 0, 0, t, 1); });
        return c;
      });
    }
    return cache.tiles;
  }

  function renderView() {
    var p = PS.p, m = p.map, t = tilePx(), imgs = tiles();
    space.style.width = m.w * t.w + "px"; space.style.height = m.h * t.h + "px";
    var want = Math.min(window.innerWidth < 640 ? 384 : 544, m.h * t.h + 14) + "px";
    if (view.style.height !== want) view.style.height = want;
    var vw = view.clientWidth, vh = view.clientHeight, sl = view.scrollLeft, st = view.scrollTop;
    var W = Math.min(vw, m.w * t.w), H = Math.min(vh, m.h * t.h);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    cv.style.left = sl + "px"; cv.style.top = st + "px";
    var g = cv.getContext("2d");
    g.imageSmoothingEnabled = false;
    g.fillStyle = G.CSS[p.colors.bg]; g.fillRect(0, 0, W, H);
    var x0 = Math.floor(sl / t.w), y0 = Math.floor(st / t.h), x1 = Math.min(m.w - 1, Math.floor((sl + W) / t.w)), y1 = Math.min(m.h - 1, Math.floor((st + H) / t.h));
    for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) {
      var im = imgs[m.cells[y * m.w + x]] || imgs[0];
      g.drawImage(im, x * t.w - sl, y * t.h - st, t.w, t.h);
    }
    // the shape being drawn
    if (drag && drag.tool !== "pen") {
      g.globalAlpha = 0.65;
      shape(drag).forEach(function (q) { g.drawImage(imgs[drag.v] || imgs[0], q[0] * t.w - sl, q[1] * t.h - st, t.w, t.h); });
      g.globalAlpha = 1;
    }
    if ($("map-grid").checked && t.w >= 8) {
      g.fillStyle = "rgba(255,255,255,0.18)";
      for (x = x0; x <= x1 + 1; x++) g.fillRect(x * t.w - sl, 0, 1, H);
      for (y = y0; y <= y1 + 1; y++) g.fillRect(0, y * t.h - st, W, 1);
    }
    if ($("map-screens").checked) {
      // the borders of C64 screens (40 x 25 characters)
      var sw = 320 * zoom(), sh = 200 * zoom();
      g.fillStyle = "rgba(240,164,0,0.85)";
      for (x = Math.ceil(sl / sw) * sw; x < sl + W; x += sw) if (x > 0) g.fillRect(x - sl - 1, 0, 2, H);
      for (y = Math.ceil(st / sh) * sh; y < st + H; y += sh) if (y > 0) g.fillRect(0, y - st - 1, W, 2);
    }
    if (hover && !drag) {
      g.strokeStyle = "#fff"; g.lineWidth = 2;
      g.strokeRect(hover.x * t.w - sl + 1, hover.y * t.h - st + 1, t.w - 2, t.h - 2);
    }
  }
  view.addEventListener("scroll", renderView);
  window.addEventListener("resize", function () { if (PS.mode === "map") renderView(); });

  // ---------------------------------------------------------------- drawing
  function cell(e) {
    var r = view.getBoundingClientRect(), t = tilePx();
    var x = Math.floor((e.clientX - r.left + view.scrollLeft) / t.w), y = Math.floor((e.clientY - r.top + view.scrollTop) / t.h);
    return { x: x, y: y };
  }
  function inside(c) { return c.x >= 0 && c.y >= 0 && c.x < PS.p.map.w && c.y < PS.p.map.h; }
  function shape(d) {
    var a = d.start, b = d.last, pts = [], x, y;
    var x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x), y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y);
    if (d.tool === "line") window.PixelEditor.line(a.x, a.y, b.x, b.y, function (px, py) { pts.push([px, py]); });
    else if (d.tool === "rect") {
      for (x = x0; x <= x1; x++) { pts.push([x, y0]); if (y1 !== y0) pts.push([x, y1]); }
      for (y = y0 + 1; y < y1; y++) { pts.push([x0, y]); if (x1 !== x0) pts.push([x1, y]); }
    } else for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) pts.push([x, y]);
    return pts;
  }
  function put(x, y, v) { var m = PS.p.map; if (x >= 0 && y >= 0 && x < m.w && y < m.h) m.cells[y * m.w + x] = v; }
  function fill(x, y, v) {
    var m = PS.p.map, from = m.cells[y * m.w + x];
    if (from === v) return;
    var stack = [x, y];
    while (stack.length) {
      var cy = stack.pop(), cx = stack.pop();
      if (cx < 0 || cy < 0 || cx >= m.w || cy >= m.h || m.cells[cy * m.w + cx] !== from) continue;
      m.cells[cy * m.w + cx] = v;
      stack.push(cx + 1, cy, cx - 1, cy, cx, cy + 1, cx, cy - 1);
    }
  }
  cv.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  cv.addEventListener("pointerdown", function (e) {
    var c = cell(e); if (!inside(c)) return;
    var tool = e.altKey || e.button === 2 ? "pick" : window.PixelEditor.tools.tool, m = PS.p.map;
    if (tool === "pick") { PS.sel.mapTile = m.cells[c.y * m.w + c.x]; renderPalette(); return; }
    var v = PS.sel.mapTile;
    if (tool === "fill") { PS.checkpoint("Fill"); fill(c.x, c.y, v); PS.changed(); return; }
    if (tool === "oval") tool = "frect";
    drag = { tool: tool, start: c, last: c, v: v };
    cv.setPointerCapture(e.pointerId);
    if (tool === "pen") { PS.checkpoint("Draw"); put(c.x, c.y, v); }
    renderView();
  });
  cv.addEventListener("pointermove", function (e) {
    var c = cell(e), m = PS.p.map;
    hover = inside(c) ? c : null;
    $("map-status").textContent = hover ? "Tile column " + c.x + ", row " + c.y + " · characters " + c.x * PS.p.tileW + ", " + c.y * PS.p.tileH +
      " · screen " + (Math.floor(c.x * PS.p.tileW / 40) + 1) + " · tile " + m.cells[c.y * m.w + c.x] : " ";
    if (drag) {
      c.x = Math.max(0, Math.min(m.w - 1, c.x)); c.y = Math.max(0, Math.min(m.h - 1, c.y));
      if (drag.tool === "pen") window.PixelEditor.line(drag.last.x, drag.last.y, c.x, c.y, function (x, y) { put(x, y, drag.v); });
      drag.last = c;
    }
    renderView();
  });
  cv.addEventListener("pointerup", function () {
    if (!drag) return;
    var d = drag; drag = null;
    if (d.tool !== "pen") { PS.checkpoint("Draw"); shape(d).forEach(function (q) { put(q[0], q[1], d.v); }); }
    PS.changed();
  });
  cv.addEventListener("pointerleave", function () { hover = null; if (!drag) renderView(); });

  // ---------------------------------------------------------------- tile palette
  function renderPalette() {
    var box = $("map-tiles"), imgs = tiles(), p = PS.p;
    var sc = Math.max(1, Math.min(2, Math.floor(40 / (8 * Math.max(p.tileW, p.tileH)))));
    box.innerHTML = "";
    imgs.forEach(function (im, i) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "thumb" + (i === PS.sel.mapTile ? " on" : ""); b.setAttribute("data-i", i);
      b.setAttribute("role", "option"); b.setAttribute("aria-selected", i === PS.sel.mapTile ? "true" : "false"); b.title = "Tile " + i;
      var c = document.createElement("canvas"); c.width = im.width * sc; c.height = im.height * sc;
      var g = c.getContext("2d"); g.imageSmoothingEnabled = false; g.drawImage(im, 0, 0, c.width, c.height);
      b.appendChild(c);
      var s = document.createElement("span"); s.textContent = i; b.appendChild(s);
      box.appendChild(b);
    });
    PS.showSelected(box);
  }
  $("map-tiles").addEventListener("click", function (e) { var b = e.target.closest("[data-i]"); if (b) { PS.sel.mapTile = +b.getAttribute("data-i"); renderPalette(); } });

  // ---------------------------------------------------------------- size and options
  $("map-size").addEventListener("click", function () {
    var w = Math.max(1, Math.min(1024, parseInt($("map-w").value, 10) || 1)), h = Math.max(1, Math.min(1024, parseInt($("map-h").value, 10) || 1));
    if (w === PS.p.map.w && h === PS.p.map.h) return;
    PS.checkpoint("Level size"); PS.M.resizeMap(PS.p, w, h); PS.changed();
  });
  ["map-grid", "map-screens"].forEach(function (id) { $(id).addEventListener("change", renderView); });
  $("map-zoom").addEventListener("change", function () { renderView(); });

  function render() {
    PS.clampSel();
    var p = PS.p, m = p.map;
    $("map-info").textContent = m.w + "×" + m.h + " tiles · " + m.w * p.tileW + "×" + m.h * p.tileH + " characters";
    if (document.activeElement !== $("map-w")) $("map-w").value = m.w;
    if (document.activeElement !== $("map-h")) $("map-h").value = m.h;
    var scr = (m.w * p.tileW / 40), scrH = (m.h * p.tileH / 25);
    $("map-sizehint").textContent = "In tiles of " + p.tileW + "×" + p.tileH + " characters: " + (Math.round(scr * 10) / 10) + " × " + (Math.round(scrH * 10) / 10) + " screens.";
    renderView(); renderPalette();
  }
  PS.register("map", {
    render: render,
    key: function (k) {
      if (k === "[" || k === "]") { PS.sel.mapTile = Math.max(0, Math.min(PS.p.tiles.length - 1, PS.sel.mapTile + (k === "[" ? -1 : 1))); renderPalette(); return true; }
      return false;
    }
  });
  PS.toolbar($("map-tools"), ["pen", "line", "rect", "frect", "fill", "pick"]);
})();
