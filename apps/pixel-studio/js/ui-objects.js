/* C64 Pixel Studio: objects (sprites on top of each other, frames of an animation) */
(function () {
  "use strict";

  var PS = window.PS, G = PS.G, $ = PS.$;
  var STAGE_W = 560, STAGE_H = 360;

  function obj() { return PS.p.objects[PS.sel.object]; }
  function frame() { var o = obj(); return o && o.frames[PS.sel.frame]; }
  function sprSize(s) { return { w: 24 * (s.xe ? 2 : 1), h: 21 * (s.ye ? 2 : 1) }; }

  // bounding box of all frames of an object (hires pixels)
  function bounds(o) {
    var b = { x0: 0, y0: 0, x1: 24, y1: 21 };
    o.frames.forEach(function (f) {
      f.layers.forEach(function (l) {
        var s = PS.p.sprites[l.s]; if (!s) return;
        var z = sprSize(s);
        b.x0 = Math.min(b.x0, l.x); b.y0 = Math.min(b.y0, l.y); b.x1 = Math.max(b.x1, l.x + z.w); b.y1 = Math.max(b.y1, l.y + z.h);
      });
    });
    return b;
  }
  // draw a frame: the first sprite lies on top
  function drawFrame(img, f, ox, oy, scale) {
    for (var i = f.layers.length - 1; i >= 0; i--) {
      var l = f.layers[i], s = PS.p.sprites[l.s];
      if (s) G.drawSprite(img, ox + l.x * scale, oy + l.y * scale, s, PS.p.colors, scale, scale, null);
    }
  }
  PS.drawObjectFrame = drawFrame;
  PS.objectBounds = bounds;

  // ---------------------------------------------------------------- stage
  var view = { scale: 4, ox: 0, oy: 0 }, playing = null, playFrame = 0, drag = null;
  function layout(o) {
    var b = bounds(o), m = 12;
    var w = b.x1 - b.x0 + 2 * m, h = b.y1 - b.y0 + 2 * m;
    view.scale = Math.max(1, Math.min(6, Math.floor(Math.min(STAGE_W / w, STAGE_H / h))));
    view.ox = Math.round((STAGE_W - (b.x1 - b.x0) * view.scale) / 2 - b.x0 * view.scale);
    view.oy = Math.round((STAGE_H - (b.y1 - b.y0) * view.scale) / 2 - b.y0 * view.scale);
  }
  function renderStage() {
    var cv = $("obj-cv"), o = obj();
    var g = PS.paintCanvas(cv, STAGE_W, STAGE_H, function (img) {
      var px = img.data, bg = G.RGB[PS.p.colors.bg];
      for (var i = 0; i < px.length; i += 4) { px[i] = bg[0]; px[i + 1] = bg[1]; px[i + 2] = bg[2]; px[i + 3] = 255; }
      if (!o) return;
      var f = playing ? o.frames[playFrame] : frame();
      if (!playing && $("obj-onion").checked && PS.sel.frame > 0) {
        var ghost = G.newImage(STAGE_W, STAGE_H);
        drawFrame(ghost, o.frames[PS.sel.frame - 1], view.ox, view.oy, view.scale);
        for (var j = 0; j < px.length; j += 4) if (ghost.data[j + 3]) {
          px[j] = (px[j] + ghost.data[j]) >> 1; px[j + 1] = (px[j + 1] + ghost.data[j + 1]) >> 1; px[j + 2] = (px[j + 2] + ghost.data[j + 2]) >> 1;
        }
      }
      if (f) drawFrame(img, f, view.ox, view.oy, view.scale);
    });
    if (!o || playing) return;
    // origin and the selected sprite
    g.strokeStyle = "rgba(255,255,255,0.35)"; g.setLineDash([3, 3]);
    g.beginPath(); g.moveTo(view.ox + 0.5, 0); g.lineTo(view.ox + 0.5, STAGE_H); g.moveTo(0, view.oy + 0.5); g.lineTo(STAGE_W, view.oy + 0.5); g.stroke();
    g.setLineDash([]);
    var f2 = frame(), l = f2 && f2.layers[PS.sel.layer], s = l && PS.p.sprites[l.s];
    if (s) {
      var z = sprSize(s);
      g.strokeStyle = "#f0a400"; g.lineWidth = 2;
      g.strokeRect(view.ox + l.x * view.scale - 1, view.oy + l.y * view.scale - 1, z.w * view.scale + 2, z.h * view.scale + 2);
    }
  }
  function layerAt(x, y) {
    var f = frame(); if (!f) return -1;
    for (var i = 0; i < f.layers.length; i++) {
      var l = f.layers[i], s = PS.p.sprites[l.s]; if (!s) continue;
      var z = sprSize(s), lx = (x - view.ox) / view.scale - l.x, ly = (y - view.oy) / view.scale - l.y;
      if (lx >= 0 && ly >= 0 && lx < z.w && ly < z.h) return i;
    }
    return -1;
  }
  var cv = $("obj-cv");
  function pos(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height }; }
  cv.addEventListener("pointerdown", function (e) {
    if (playing) return;
    var p = pos(e), i = layerAt(p.x, p.y);
    if (i < 0) return;
    PS.sel.layer = i;
    var l = frame().layers[i];
    drag = { x: p.x, y: p.y, lx: l.x, ly: l.y, moved: false };
    cv.setPointerCapture(e.pointerId);
    render();
  });
  cv.addEventListener("pointermove", function (e) {
    var p = pos(e);
    $("obj-status").textContent = "x " + Math.floor((p.x - view.ox) / view.scale) + ", y " + Math.floor((p.y - view.oy) / view.scale);
    if (!drag) return;
    var dx = Math.round((p.x - drag.x) / view.scale), dy = Math.round((p.y - drag.y) / view.scale);
    var l = frame().layers[PS.sel.layer];
    if (!drag.moved && (dx || dy)) { PS.checkpoint("Move sprite"); drag.moved = true; }
    if (drag.moved) { l.x = drag.lx + dx; l.y = drag.ly + dy; renderStage(); renderLayers(); }
  });
  cv.addEventListener("pointerup", function () { if (drag && drag.moved) PS.changed(); drag = null; });
  cv.addEventListener("keydown", function (e) {
    var d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key], f = frame();
    if (!d || !f || !f.layers[PS.sel.layer]) return;
    e.preventDefault();
    PS.checkpoint("Move sprite");
    f.layers[PS.sel.layer].x += d[0]; f.layers[PS.sel.layer].y += d[1];
    PS.changed();
  });
  cv.tabIndex = 0;

  // ---------------------------------------------------------------- animation
  var last = 0, ticks = 0;
  function tick(t) {
    if (!playing) return;
    var o = obj();
    if (!o) { stop(); return; }
    if (t - last >= 20) {
      ticks += Math.floor((t - last) / 20); last = t;
      if (ticks >= o.speed) { ticks = 0; playFrame = (playFrame + 1) % o.frames.length; renderStage(); }
    }
    playing = requestAnimationFrame(tick);
  }
  function play() { var o = obj(); if (!o || o.frames.length < 1) return; playFrame = PS.sel.frame; ticks = 0; last = performance.now(); playing = requestAnimationFrame(tick); $("obj-play").textContent = "Stop"; renderStage(); }
  function stop() { if (playing) cancelAnimationFrame(playing); playing = null; $("obj-play").textContent = "Play"; renderStage(); }
  $("obj-play").addEventListener("click", function () { if (playing) stop(); else play(); });

  // ---------------------------------------------------------------- lists
  function renderObjects() {
    var list = PS.p.objects;
    $("obj-list").innerHTML = list.length ? list.map(function (o, i) {
      return '<li><button type="button" role="option" data-oi="' + i + '" class="' + (i === PS.sel.object ? "on" : "") + '" aria-selected="' + (i === PS.sel.object) + '">' +
        PS.esc(o.name || "object " + i) + ' <small>' + o.frames.length + (o.frames.length === 1 ? " frame" : " frames") + "</small></button></li>";
    }).join("") : '<li class="empty">No objects yet. <em>New</em> starts one with the sprite you are drawing.</li>';
  }
  $("obj-list").addEventListener("click", function (e) {
    var b = e.target.closest("[data-oi]");
    if (b) { stop(); PS.sel.object = +b.getAttribute("data-oi"); PS.sel.frame = 0; PS.sel.layer = 0; render(); }
  });
  document.querySelectorAll("[data-olist]").forEach(function (b) {
    b.addEventListener("click", function () {
      var a = b.getAttribute("data-olist");
      stop();
      if (a === "add") {
        PS.checkpoint("New object");
        PS.p.objects.push({ name: "object " + PS.p.objects.length, speed: 8, frames: [{ layers: [{ s: PS.sel.sprite, x: 0, y: 0 }] }] });
        PS.sel.object = PS.p.objects.length - 1; PS.sel.frame = 0; PS.sel.layer = 0;
      } else if (a === "del" && obj()) {
        PS.checkpoint("Delete object");
        PS.p.objects.splice(PS.sel.object, 1);
      }
      PS.changed();
    });
  });

  function renderFrames() {
    var o = obj(), box = $("obj-frames");
    $("obj-fcount").textContent = o ? "(" + o.frames.length + ")" : "";
    if (!o) { box.innerHTML = ""; return; }
    var b = bounds(o), w = b.x1 - b.x0, h = b.y1 - b.y0, sc = Math.max(1, Math.min(2, Math.floor(96 / Math.max(w, h))));
    box.innerHTML = "";
    o.frames.forEach(function (f, i) {
      var btn = document.createElement("button");
      btn.type = "button"; btn.className = "thumb" + (i === PS.sel.frame ? " on" : ""); btn.setAttribute("data-fi", i);
      btn.setAttribute("role", "option"); btn.setAttribute("aria-selected", i === PS.sel.frame ? "true" : "false");
      var c = document.createElement("canvas");
      PS.paintCanvas(c, w * sc, h * sc, function (img) { PS.checker(img); drawFrame(img, f, -b.x0 * sc, -b.y0 * sc, sc); });
      btn.appendChild(c);
      var sp = document.createElement("span"); sp.textContent = "Frame " + (i + 1); btn.appendChild(sp);
      box.appendChild(btn);
    });
    PS.showSelected(box);
  }
  $("obj-frames").addEventListener("click", function (e) {
    var b = e.target.closest("[data-fi]");
    if (b) { stop(); PS.sel.frame = +b.getAttribute("data-fi"); PS.sel.layer = Math.min(PS.sel.layer, Math.max(0, frame().layers.length - 1)); render(); }
  });
  document.querySelectorAll("[data-flist]").forEach(function (b) {
    b.addEventListener("click", function () {
      var a = b.getAttribute("data-flist"), o = obj();
      if (!o) { PS.say("Make an object first."); return; }
      stop();
      var i = PS.sel.frame;
      if (a === "add" || a === "next") {
        var f = PS.M.clone(o.frames[i] || { layers: [] });
        if (a === "next") {
          var used = []; f.layers.forEach(function (l) { if (used.indexOf(l.s) < 0) used.push(l.s); });
          var step = used.length || 1, tooFar = false;
          f.layers.forEach(function (l) { l.s += step; if (l.s >= PS.p.sprites.length) tooFar = true; });
          if (tooFar) { PS.say("There are not enough sprites after these: draw them first."); return; }
        }
        PS.checkpoint("New frame");
        o.frames.splice(i + 1, 0, f); PS.sel.frame = i + 1;
      } else if (a === "del") {
        if (o.frames.length <= 1) { PS.say("An object needs at least one frame."); return; }
        PS.checkpoint("Delete frame"); o.frames.splice(i, 1); PS.sel.frame = Math.min(i, o.frames.length - 1);
      } else {
        var j = i + (a === "back" ? -1 : 1);
        if (j < 0 || j >= o.frames.length) return;
        PS.checkpoint("Move frame"); PS.move(o.frames, i, j - i); PS.sel.frame = j;
      }
      PS.changed();
    });
  });

  function renderLayers() {
    var f = frame(), box = $("obj-layers");
    if (!f) { box.innerHTML = ""; $("obj-addlayer").disabled = true; return; }
    $("obj-addlayer").disabled = f.layers.length >= 8;
    var opts = PS.p.sprites.map(function (s, i) { return '<option value="' + i + '">' + i + (s.name ? " " + PS.esc(s.name) : "") + "</option>"; }).join("");
    box.innerHTML = f.layers.map(function (l, i) {
      return '<li class="' + (i === PS.sel.layer ? "on" : "") + '" data-li="' + i + '">' +
        '<select data-lk="s" aria-label="Sprite">' + opts + "</select>" +
        '<label>X <input type="number" data-lk="x" value="' + l.x + '"></label>' +
        '<label>Y <input type="number" data-lk="y" value="' + l.y + '"></label>' +
        '<span class="l-btns"><button type="button" class="icon-btn" data-la="up" title="Higher (on top)" aria-label="Move up">↑</button>' +
        '<button type="button" class="icon-btn" data-la="down" title="Lower" aria-label="Move down">↓</button>' +
        '<button type="button" class="icon-btn" data-la="edit" title="Draw this sprite" aria-label="Draw this sprite">✎</button>' +
        '<button type="button" class="icon-btn remove" data-la="del" title="Remove from the frame" aria-label="Remove">✕</button></span></li>';
    }).join("") || '<li class="empty">No sprites in this frame.</li>';
    box.querySelectorAll("select").forEach(function (s, i) { s.value = String(f.layers[i].s); });
  }
  $("obj-layers").addEventListener("click", function (e) {
    var li = e.target.closest("[data-li]"); if (!li) return;
    var i = +li.getAttribute("data-li"), f = frame(), a = e.target.closest("[data-la]");
    PS.sel.layer = i;
    if (!a) { renderStage(); box(); return; }
    var act = a.getAttribute("data-la");
    if (act === "edit") { PS.sel.sprite = f.layers[i].s; PS.setMode("sprites"); return; }
    PS.checkpoint("Change frame");
    if (act === "del") { f.layers.splice(i, 1); PS.sel.layer = Math.max(0, i - 1); }
    else if (act === "up" && i > 0) { PS.move(f.layers, i, -1); PS.sel.layer = i - 1; }
    else if (act === "down" && i < f.layers.length - 1) { PS.move(f.layers, i, 1); PS.sel.layer = i + 1; }
    PS.changed();
    function box() { $("obj-layers").querySelectorAll("li").forEach(function (x, k) { x.classList.toggle("on", k === i); }); }
  });
  $("obj-layers").addEventListener("change", function (e) {
    var t = e.target, li = t.closest("[data-li]"); if (!li) return;
    var l = frame().layers[+li.getAttribute("data-li")], k = t.getAttribute("data-lk");
    PS.checkpoint("Change frame");
    l[k] = Math.max(-200, Math.min(200, parseInt(t.value, 10) || 0));
    PS.changed();
  });
  $("obj-addlayer").addEventListener("click", function () {
    var f = frame(); if (!f) return;
    PS.checkpoint("Add sprite");
    var last = f.layers[f.layers.length - 1];
    f.layers.push({ s: PS.sel.sprite, x: last ? last.x : 0, y: last ? last.y : 0 });
    PS.sel.layer = f.layers.length - 1;
    PS.changed();
  });
  PS.nameField($("obj-name"), "Name", function (v) { var o = obj(); if (o) { o.name = v; renderObjects(); } });
  (function () {
    var sel = $("obj-speed"), h = "";
    for (var n = 1; n <= 50; n++) h += '<option value="' + n + '">' + n + (n === 1 ? " screen frame" : " screen frames") + " (" + (Math.round(500 / n) / 10) + " per second)</option>";
    sel.innerHTML = h;
    sel.addEventListener("change", function () { var o = obj(); if (o) { PS.checkpoint("Speed"); o.speed = +this.value; PS.changed(); } });
  })();
  $("obj-onion").addEventListener("change", renderStage);

  function render() {
    PS.clampSel();
    var o = obj();
    $("obj-title").textContent = o ? "Object " + PS.sel.object + " · frame " + (PS.sel.frame + 1) + " of " + o.frames.length : "No object";
    $("obj-name").disabled = !o; $("obj-speed").disabled = !o; $("obj-play").disabled = !o;
    if (document.activeElement !== $("obj-name")) $("obj-name").value = o ? o.name || "" : "";
    if (o) $("obj-speed").value = String(o.speed);
    if (o) layout(o);
    renderStage(); renderObjects(); renderFrames(); renderLayers();
  }
  PS.register("objects", { render: render, leave: stop });
})();
