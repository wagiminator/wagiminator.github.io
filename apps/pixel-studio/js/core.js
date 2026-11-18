/* C64 Pixel Studio: shared state and helpers for the editor views. */
(function () {
  "use strict";

  var G = window.C64G, M = window.PSModel;

  var PS = window.PS = {
    p: M.newProject(),
    mode: "sprites",
    modes: {},
    sel: { sprite: 0, object: 0, frame: 0, layer: 0, char: 0x01, tile: 0, mapTile: 0 },
    slots: { sprite: [1, 0], char: [1, 0] },       // [left, right] slot of the colour pickers
    bmLR: [1, 0],                                    // bitmap: left and right colour
    clip: {},
    G: G, M: M
  };

  PS.hist = new M.History(function () { return PS.p; }, function (v) { PS.p = v; PS.clampSel(); PS.refresh(true); }, function () { PS.updateUndo && PS.updateUndo(); });
  PS.checkpoint = function (label) { PS.hist.checkpoint(label); };
  PS.register = function (name, mod) { PS.modes[name] = mod; };

  // something in the project changed: draw again and save soon
  var saveTimer = null;
  PS.changed = function () {
    PS.refresh(false);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(PS.autosave, 600);
  };
  PS.refresh = function (all) {
    var m = PS.modes[PS.mode];
    if (m && m.render) m.render(all);
  };
  PS.clampSel = function () {
    var p = PS.p, s = PS.sel;
    s.sprite = Math.max(0, Math.min(p.sprites.length - 1, s.sprite));
    s.object = Math.max(0, Math.min(p.objects.length - 1, s.object));
    var o = p.objects[s.object];
    s.frame = o ? Math.max(0, Math.min(o.frames.length - 1, s.frame)) : 0;
    var f = o && o.frames[s.frame];
    s.layer = f ? Math.max(0, Math.min(f.layers.length - 1, s.layer)) : 0;
    s.tile = Math.max(0, Math.min(p.tiles.length - 1, s.tile));
    s.mapTile = Math.max(0, Math.min(p.tiles.length - 1, s.mapTile));
  };

  // ---------------------------------------------------------------- storage
  var KEY = "c64ps.project";
  PS.autosave = function () {
    try { localStorage.setItem(KEY, M.toJSON(PS.p)); PS.say("", true); } catch (e) { /* storage full or blocked */ }
  };
  PS.restore = function () {
    try {
      var t = localStorage.getItem(KEY);
      if (t) { PS.p = M.fromJSON(t); return true; }
    } catch (e) { /* ignore */ }
    return false;
  };

  // ---------------------------------------------------------------- helpers
  PS.$ = function (id) { return document.getElementById(id); };
  PS.hex = function (v, n) { return ("000" + v.toString(16).toUpperCase()).slice(-n); };
  PS.esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  PS.colourSelect = function (el, value) {
    if (!el.options.length) el.innerHTML = G.NAMES.map(function (n, i) { return '<option value="' + i + '">' + i + " " + n + "</option>"; }).join("");
    el.value = String(value);
  };
  // 16 colour swatches; onPick(colour, button)
  PS.palette = function (el, onPick) {
    el.innerHTML = G.CSS.map(function (c, i) {
      return '<button type="button" class="sw" data-c="' + i + '" style="--c:' + c + '" title="' + i + " " + G.NAMES[i] + '" aria-label="' + G.NAMES[i] + '"></button>';
    }).join("");
    el.addEventListener("click", function (e) { var b = e.target.closest("[data-c]"); if (b) onPick(+b.getAttribute("data-c"), 0); });
    el.addEventListener("contextmenu", function (e) { var b = e.target.closest("[data-c]"); if (b) { e.preventDefault(); onPick(+b.getAttribute("data-c"), 1); } });
  };
  PS.markPalette = function (el, left, right) {
    el.querySelectorAll("[data-c]").forEach(function (b) {
      var c = +b.getAttribute("data-c");
      b.classList.toggle("is-l", c === left); b.classList.toggle("is-r", c === right);
    });
  };

  // drawing tools
  var TOOLS = [
    ["pen", "Pen (P)", '<path d="M4 20l4-1 10-10-3-3L5 16z"/><path d="M14 6l3 3"/>'],
    ["line", "Line (L)", '<path d="M5 19L19 5"/>'],
    ["rect", "Rectangle (R)", '<rect x="5" y="6" width="14" height="12"/>'],
    ["frect", "Filled rectangle (B)", '<rect x="5" y="6" width="14" height="12" fill="currentColor"/>'],
    ["oval", "Ellipse (E)", '<ellipse cx="12" cy="12" rx="8" ry="6"/>'],
    ["fill", "Fill (F)", '<path d="M6 11l6-6 7 7-6 6z"/><path d="M19 15c1 2 2 3 2 4a2 2 0 0 1-4 0c0-1 1-2 2-4z" fill="currentColor"/>'],
    ["pick", "Pick a colour (K or Alt+click)", '<path d="M14.5 5.5l4 4"/><path d="M17 3a2.1 2.1 0 0 1 3 3l-2 2-3-3z" fill="currentColor"/><path d="M15 8L6 17l-1 3 3-1 9-9"/>']
  ];
  PS.TOOL_KEYS = { p: "pen", l: "line", r: "rect", b: "frect", e: "oval", f: "fill", k: "pick" };
  PS.toolbar = function (el, only) {
    el.innerHTML = TOOLS.filter(function (t) { return !only || only.indexOf(t[0]) >= 0; }).map(function (t) {
      return '<button type="button" class="tool" data-tool="' + t[0] + '" title="' + t[1] + '" aria-label="' + t[1] + '" aria-pressed="false">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true">' + t[2] + "</svg></button>";
    }).join("");
    el.addEventListener("click", function (e) { var b = e.target.closest("[data-tool]"); if (b) PS.setTool(b.getAttribute("data-tool")); });
  };
  PS.setTool = function (t) {
    window.PixelEditor.tools.tool = t;
    document.querySelectorAll("[data-tool]").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-tool") === t ? "true" : "false"); });
  };

  // a canvas showing an image at an integer scale
  PS.paintCanvas = function (cv, w, h, draw) {
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    var g = cv.getContext("2d"), img = g.createImageData(w, h);
    draw(img);
    g.putImageData(img, 0, 0);
    return g;
  };
  PS.checker = function (img) {
    var px = img.data, w = img.width;
    for (var y = 0; y < img.height; y++) for (var x = 0; x < w; x++) {
      var o = (y * w + x) * 4, v = ((x >> 2) + (y >> 2)) & 1 ? 0xd9 : 0xc8;
      px[o] = px[o + 1] = px[o + 2] = v; px[o + 3] = 255;
    }
  };

  // sprite thumbnail canvas (bg null: checkerboard)
  PS.spriteImage = function (cv, spr, scale, bg) {
    var w = 24 * scale * (spr.xe ? 2 : 1), h = 21 * scale * (spr.ye ? 2 : 1);
    PS.paintCanvas(cv, w, h, function (img) {
      if (bg == null) PS.checker(img);
      G.drawSprite(img, 0, 0, spr, PS.p.colors, scale, scale, bg);
    });
  };

  // a name field: one undo step per editing session
  PS.nameField = function (el, label, set) {
    var fresh = true;
    el.addEventListener("focus", function () { fresh = true; });
    el.addEventListener("input", function () { if (fresh) { PS.checkpoint(label); fresh = false; } set(el.value); PS.changed(); });
  };

  // downloads
  PS.download = function (name, data, type) {
    var blob = data instanceof Blob ? data : new Blob([data], { type: type || "application/octet-stream" });
    var url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
  };
  PS.fileBase = function () {
    return (PS.p.name || "untitled").trim().replace(/[^\w\- ]+/g, "").replace(/\s+/g, "-").toLowerCase() || "untitled";
  };

  // short message next to the undo buttons
  var sayTimer = null;
  PS.say = function (text, saved) {
    var el = PS.$("saved");
    if (!el) return;
    el.textContent = saved ? "Saved in this browser" : text;
    el.classList.toggle("note", !saved);
    clearTimeout(sayTimer);
    sayTimer = setTimeout(function () { el.textContent = ""; }, saved ? 1500 : 5000);
  };

  // move an item in a list (for sprite, tile and frame lists)
  PS.move = function (list, i, d) {
    var j = i + d;
    if (j < 0 || j >= list.length) return i;
    var t = list[i]; list[i] = list[j]; list[j] = t;
    return j;
  };
  // the selected item of a thumbnail list gets scrolled into view
  PS.showSelected = function (box) {
    var on = box.querySelector(".on");
    if (on && on.scrollIntoView) {
      var r = on.getBoundingClientRect(), b = box.getBoundingClientRect();
      if (r.top < b.top || r.bottom > b.bottom) on.scrollIntoView({ block: "nearest" });
    }
  };
})();
