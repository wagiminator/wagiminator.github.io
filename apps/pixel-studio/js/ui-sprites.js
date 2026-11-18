/* C64 Pixel Studio: sprites */
(function () {
  "use strict";

  var PS = window.PS, G = PS.G, $ = PS.$;
  var SCALE = 16;

  function spr() { return PS.p.sprites[PS.sel.sprite]; }
  function slotNames(s) {
    return s.mc ? ["Transparent", "Multicolour 1 ($D025)", "Sprite colour", "Multicolour 2 ($D026)"] : ["Transparent", "Sprite colour"];
  }
  function slotColour(s, slot) { return G.spriteSlots(s, PS.p.colors)[slot]; }

  var ed = new window.PixelEditor($("spr-ed"), {
    size: function () { var s = spr(); return { w: s.mc ? 12 : 24, h: 21, aspect: s.mc ? 2 : 1, scale: SCALE }; },
    get: function (x, y) { var s = spr(); return G.getPx(s.data, 0, 3, x, y, s.mc); },
    set: function (x, y, v) { var s = spr(); G.setPx(s.data, 0, 3, x, y, s.mc, v); },
    css: function (v) { var c = slotColour(spr(), v); return c == null ? null : G.CSS[c]; },
    paint: function (b) { return PS.slots.sprite[b]; },
    begin: function (label) { PS.checkpoint(label); },
    end: function () { PS.changed(); },
    onPick: function (v, b) { PS.slots.sprite[b] = v; renderColours(); },
    grid: function () { var s = spr(); return { major: [s.mc ? 4 : 8, 21] }; },
    onHover: function (x, y) {
      var s = spr();
      $("spr-status").textContent = x < 0 ? " " : "x " + (s.mc ? x * 2 : x) + ", y " + y + " · " + slotNames(s)[G.getPx(s.data, 0, 3, x, y, s.mc)];
    },
    overlay: function (g) { drawGhosts(g); }
  });

  // the other sprites of the selected object frame, see-through, where they lie
  var ghostCv = document.createElement("canvas");
  function drawGhosts(g) {
    if (!$("spr-ghost").checked) return;
    var o = PS.p.objects[PS.sel.object], f = o && o.frames[PS.sel.frame];
    if (!f) return;
    var me = -1;
    for (var i = 0; i < f.layers.length; i++) if (f.layers[i].s === PS.sel.sprite) { me = i; break; }
    if (me < 0) return;
    var base = f.layers[me];
    g.save();
    g.globalAlpha = 0.4;
    g.imageSmoothingEnabled = false;
    for (var k = f.layers.length - 1; k >= 0; k--) {
      if (k === me) continue;
      var l = f.layers[k], s = PS.p.sprites[l.s];
      if (!s) continue;
      PS.spriteImage(ghostCv, s, 1, null);
      // draw only the coloured pixels: rebuild with transparency
      var w = ghostCv.width, h = ghostCv.height, cg = ghostCv.getContext("2d"), img = cg.createImageData(w, h);
      G.drawSprite(img, 0, 0, s, PS.p.colors, 1, 1, null);
      cg.putImageData(img, 0, 0);
      g.drawImage(ghostCv, (l.x - base.x) * SCALE, (l.y - base.y) * SCALE, w * SCALE, h * SCALE);
    }
    g.restore();
  }

  // ---------------------------------------------------------------- colours
  function renderColours() {
    var s = spr(), names = slotNames(s), L = PS.slots.sprite;
    for (var b = 0; b < 2; b++) if (L[b] >= names.length) L[b] = b === 0 ? 1 : 0;
    $("spr-slots").innerHTML = names.map(function (n, i) {
      var c = slotColour(s, i);
      return '<button type="button" class="slot' + (L[0] === i ? " is-l" : "") + (L[1] === i ? " is-r" : "") + '" data-slot="' + i + '">' +
        '<span class="chip' + (c == null ? " none" : "") + '" style="--c:' + (c == null ? "transparent" : G.CSS[c]) + '"></span>' +
        "<span>" + n + (c != null ? ' <small>' + c + " " + G.NAMES[c] + "</small>" : "") + "</span>" +
        '<span class="lr-tags">' + (L[0] === i ? "<b>L</b>" : "") + (L[1] === i ? "<b>R</b>" : "") + "</span></button>";
    }).join("");
    PS.markPalette($("spr-pal"), slotColour(s, L[0]), -1);
    $("spr-mc").checked = s.mc; $("spr-xe").checked = s.xe; $("spr-ye").checked = s.ye;
  }
  $("spr-slots").addEventListener("click", function (e) { var b = e.target.closest("[data-slot]"); if (b) { PS.slots.sprite[0] = +b.getAttribute("data-slot"); renderColours(); } });
  $("spr-slots").addEventListener("contextmenu", function (e) { var b = e.target.closest("[data-slot]"); if (b) { e.preventDefault(); PS.slots.sprite[1] = +b.getAttribute("data-slot"); renderColours(); } });
  PS.palette($("spr-pal"), function (c) {
    var s = spr(), slot = PS.slots.sprite[0];
    if (slot === 0) { PS.say("Transparent has no colour: choose another slot first."); return; }
    PS.checkpoint("Colour");
    if (s.mc && slot === 1) PS.p.colors.sprMc1 = c;
    else if (s.mc && slot === 3) PS.p.colors.sprMc2 = c;
    else s.col = c;
    PS.changed();
  });
  ["mc", "xe", "ye"].forEach(function (k) {
    $("spr-" + k).addEventListener("change", function () { PS.checkpoint("Sprite mode"); spr()[k] = this.checked; PS.changed(); });
  });
  $("spr-ghost").addEventListener("change", function () { ed.render(); });
  $("spr-bg").addEventListener("change", function () { PS.checkpoint("Background"); PS.p.colors.bg = +this.value; PS.changed(); });
  PS.nameField($("spr-name"), "Name", function (v) { spr().name = v; renderList(); });

  // ---------------------------------------------------------------- operations
  function rowBits(d, y) { return (d[y * 3] << 16) | (d[y * 3 + 1] << 8) | d[y * 3 + 2]; }
  function setRow(d, y, v) { d[y * 3] = (v >> 16) & 255; d[y * 3 + 1] = (v >> 8) & 255; d[y * 3 + 2] = v & 255; }
  PS.spriteOp = function (s, op) {
    var d = s.data, y, v, n = s.mc ? 2 : 1;
    if (op === "left" || op === "right") {
      for (y = 0; y < 21; y++) {
        v = rowBits(d, y);
        v = op === "left" ? ((v << n) | (v >>> (24 - n))) & 0xFFFFFF : ((v >>> n) | (v << (24 - n))) & 0xFFFFFF;
        setRow(d, y, v);
      }
    } else if (op === "up" || op === "down") {
      var rows = []; for (y = 0; y < 21; y++) rows.push(rowBits(d, y));
      if (op === "up") rows.push(rows.shift()); else rows.unshift(rows.pop());
      rows.forEach(function (r, i) { setRow(d, i, r); });
    } else if (op === "fliph") {
      for (y = 0; y < 21; y++) {
        v = rowBits(d, y); var r = 0;
        for (var x = 0; x < 24; x += n) r |= ((v >>> x) & (n === 2 ? 3 : 1)) << (24 - n - x);
        setRow(d, y, r);
      }
    } else if (op === "flipv") {
      var rr = []; for (y = 0; y < 21; y++) rr.push(rowBits(d, y));
      rr.reverse().forEach(function (r2, i) { setRow(d, i, r2); });
    } else if (op === "invert") { for (var i = 0; i < 63; i++) d[i] ^= 0xFF; }
    else if (op === "clear") d.fill(0, 0, 63);
  };
  document.querySelectorAll("[data-sop]").forEach(function (b) {
    b.addEventListener("click", function () { op(b.getAttribute("data-sop")); });
  });
  function op(o) {
    var s = spr();
    if (o === "copy") { PS.clip.sprite = { data: s.data.slice(), col: s.col, mc: s.mc }; PS.say("Sprite copied."); return; }
    if (o === "paste") {
      if (!PS.clip.sprite) { PS.say("Copy a sprite first."); return; }
      PS.checkpoint("Paste"); s.data.set(PS.clip.sprite.data); s.col = PS.clip.sprite.col; s.mc = PS.clip.sprite.mc; PS.changed(); return;
    }
    PS.checkpoint({ left: "Shift", right: "Shift", up: "Shift", down: "Shift", fliph: "Flip", flipv: "Flip", invert: "Invert", clear: "Clear" }[o]);
    PS.spriteOp(s, o);
    PS.changed();
  }

  // ---------------------------------------------------------------- list
  function renderList() {
    var box = $("spr-list"), sprites = PS.p.sprites;
    $("spr-count").textContent = "(" + sprites.length + ")";
    // reuse the buttons
    while (box.children.length > sprites.length) box.removeChild(box.lastChild);
    while (box.children.length < sprites.length) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "thumb"; b.setAttribute("role", "option");
      b.innerHTML = "<canvas></canvas><span></span>";
      box.appendChild(b);
    }
    sprites.forEach(function (s, i) {
      var b = box.children[i];
      b.setAttribute("data-i", i);
      b.classList.toggle("on", i === PS.sel.sprite);
      b.setAttribute("aria-selected", i === PS.sel.sprite ? "true" : "false");
      b.title = (s.name || "sprite " + i);
      PS.spriteImage(b.firstChild, Object.assign({}, s, { xe: false, ye: false }), 2, null);
      b.lastChild.textContent = i + (s.name ? " " + s.name : "");
    });
    PS.showSelected(box);
  }
  $("spr-list").addEventListener("click", function (e) {
    var b = e.target.closest("[data-i]");
    if (b) { PS.sel.sprite = +b.getAttribute("data-i"); render(); }
  });
  document.querySelectorAll("[data-slist]").forEach(function (b) {
    b.addEventListener("click", function () {
      var a = b.getAttribute("data-slist"), list = PS.p.sprites, i = PS.sel.sprite;
      if (a === "add" || a === "dup") {
        if (list.length >= 256) { PS.say("256 sprites is the most a VIC bank can show."); return; }
        PS.checkpoint(a === "add" ? "New sprite" : "Duplicate sprite");
        var n = a === "add" ? PS.M.newSprite("") : PS.M.clone(list[i]);
        if (a === "add") { n.col = list[i] ? list[i].col : 1; n.mc = list[i] ? list[i].mc : false; }
        list.splice(i + 1, 0, n);
        fixObjects(i + 1, 1);
        PS.sel.sprite = i + 1;
      } else if (a === "del") {
        if (list.length <= 1) { PS.checkpoint("Clear sprite"); list[0] = PS.M.newSprite(""); }
        else { PS.checkpoint("Delete sprite"); list.splice(i, 1); fixObjects(i, -1); PS.sel.sprite = Math.min(i, list.length - 1); }
      } else if (a === "back" || a === "fwd") {
        var j = i + (a === "back" ? -1 : 1);
        if (j < 0 || j >= list.length) return;
        PS.checkpoint("Move sprite");
        PS.move(list, i, j - i);
        swapInObjects(i, j);
        PS.sel.sprite = j;
      }
      PS.changed();
    });
  });
  // objects refer to sprites by number: keep them right when the list changes
  function fixObjects(at, d) {
    PS.p.objects.forEach(function (o) {
      o.frames.forEach(function (f) {
        f.layers = f.layers.filter(function (l) { return !(d < 0 && l.s === at); });
        f.layers.forEach(function (l) { if (l.s >= at) l.s += d; });
      });
    });
  }
  function swapInObjects(a, b) {
    PS.p.objects.forEach(function (o) { o.frames.forEach(function (f) { f.layers.forEach(function (l) { if (l.s === a) l.s = b; else if (l.s === b) l.s = a; }); }); });
  }

  // ---------------------------------------------------------------- preview
  function renderPreview() {
    var s = spr(), cv = $("spr-prev");
    var w = 24 * 2 * (s.xe ? 2 : 1), h = 21 * 2 * (s.ye ? 2 : 1);
    PS.paintCanvas(cv, Math.max(w, 96), Math.max(h, 84), function (img) {
      var px = img.data, bg = G.RGB[PS.p.colors.bg];
      for (var i = 0; i < px.length; i += 4) { px[i] = bg[0]; px[i + 1] = bg[1]; px[i + 2] = bg[2]; px[i + 3] = 255; }
      G.drawSprite(img, (Math.max(w, 96) - w) >> 1, (Math.max(h, 84) - h) >> 1, s, PS.p.colors, 2, 2, null);
    });
    PS.colourSelect($("spr-bg"), PS.p.colors.bg);
  }

  function render() {
    PS.clampSel();
    var s = spr();
    $("spr-title").textContent = "Sprite " + PS.sel.sprite + (s.mc ? " · multicolour" : " · hires");
    if (document.activeElement !== $("spr-name")) $("spr-name").value = s.name || "";
    ed.render(); renderColours(); renderList(); renderPreview();
  }
  PS.register("sprites", {
    render: render,
    key: function (k) {
      if (k === "[" || k === "]") { PS.sel.sprite = Math.max(0, Math.min(PS.p.sprites.length - 1, PS.sel.sprite + (k === "[" ? -1 : 1))); render(); return true; }
      if (k === "x") { var t = PS.slots.sprite; PS.slots.sprite = [t[1], t[0]]; renderColours(); return true; }
      if (k === "copy" || k === "paste") { op(k); return true; }
      return false;
    }
  });
  PS.toolbar(document.querySelector("#mode-sprites [data-tools]"));
})();
