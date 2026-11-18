/* C64 Pixel Studio: bitmaps (multicolour 160x200 or hires 320x200) */
(function () {
  "use strict";

  var PS = window.PS, G = PS.G, $ = PS.$;

  function bm() { return PS.p.bitmap; }
  var clashes = 0;

  var ed = new window.PixelEditor($("bm-ed"), {
    size: function () { var b = bm(); return { w: G.bmWidth(b), h: 200, aspect: b.mc ? 2 : 1, scale: +$("bm-zoom").value }; },
    get: function (x, y) { return G.bmGet(bm(), x, y); },
    set: function (x, y, c) { if (G.bmPaint(bm(), x, y, c)) clashes++; },
    css: function (c) { return G.CSS[c]; },
    paint: function (b) { return PS.bmLR[b]; },
    begin: function (label) { PS.checkpoint(label); clashes = 0; },
    end: function () {
      if (clashes) PS.say("Colour clash: a cell had no free colour, so its least used colour changed.");
      PS.changed();
    },
    onPick: function (c, b) { PS.bmLR[b] = c; renderColours(); },
    grid: function () { var b = bm(); return { minor: false, major: $("bm-grid").checked ? [b.mc ? 4 : 8, 8] : null }; },
    onHover: function (x, y) {
      var b = bm();
      if (x < 0) { $("bm-status").textContent = " "; $("bm-cell").innerHTML = " "; return; }
      var cell = G.bmCell(b, x, y), slots = b.mc ? [0, 1, 2, 3] : [1, 0];
      $("bm-status").textContent = "x " + x + ", y " + y + " · cell " + (cell % 40) + ", " + ((cell / 40) | 0) + " · " + G.NAMES[G.bmGet(b, x, y)];
      $("bm-cell").innerHTML = "Colours of this cell: " + slots.map(function (s) {
        var c = G.bmSlotColour(b, cell, s);
        return '<span class="chip inline" style="--c:' + G.CSS[c] + '" title="' + G.NAMES[c] + '"></span>';
      }).join("");
    }
  });

  function renderColours() {
    var L = PS.bmLR;
    $("bm-lr").innerHTML = ["Left button", "Right button"].map(function (n, i) {
      return '<div class="lr-item"><span class="chip big" style="--c:' + G.CSS[L[i]] + '"></span><span>' + n + "<br><small>" + L[i] + " " + G.NAMES[L[i]] + "</small></span></div>";
    }).join("");
    PS.markPalette($("bm-pal"), L[0], L[1]);
    PS.colourSelect($("bm-bg"), bm().bg);
    PS.colourSelect($("bm-border"), bm().border);
    $("bm-bg").disabled = !bm().mc;
    $("bm-mode").value = bm().mc ? "mc" : "hires";
  }
  PS.palette($("bm-pal"), function (c, b) { PS.bmLR[b] = c; renderColours(); });
  $("bm-bg").addEventListener("change", function () { PS.checkpoint("Background"); bm().bg = +this.value; PS.changed(); });
  $("bm-border").addEventListener("change", function () { PS.checkpoint("Border"); bm().border = +this.value; PS.changed(); });
  $("bm-zoom").addEventListener("change", function () { ed.render(); });
  $("bm-grid").addEventListener("change", function () { ed.render(); });
  $("bm-clear").addEventListener("click", function () {
    PS.checkpoint("Clear picture");
    var b = bm();
    b.bitmap.fill(0); b.color.fill(0); b.screen.fill(b.mc ? 0 : (PS.bmLR[0] << 4) | b.bg);
    if (!b.mc) b.screen.fill((PS.bmLR[0] << 4) | PS.bmLR[1]);
    PS.changed();
  });
  // switching the mode converts the picture
  $("bm-mode").addEventListener("change", function () {
    var mc = this.value === "mc", b = bm();
    if (mc === b.mc) return;
    PS.checkpoint("Mode");
    var w = mc ? 160 : 320, img = G.newImage(w, 200), px = img.data;
    for (var y = 0; y < 200; y++) for (var x = 0; x < w; x++) {
      var c = G.RGB[mc ? G.bmGet(b, x * 2, y) : G.bmGet(b, x >> 1, y)], o = (y * w + x) * 4;
      px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = 255;
    }
    var n = window.PSConvert.convert(px, { mc: mc, dither: "none", bg: mc ? "auto" : 0 });
    n.border = b.border;
    PS.p.bitmap = n;
    PS.changed();
  });
  $("bm-convert").addEventListener("click", function () { PS.openConverter(); });

  function render() {
    var b = bm();
    $("bm-info").textContent = b.mc ? "multicolour, 160×200" : "hires, 320×200";
    $("bm-view").style.setProperty("--border", G.CSS[b.border]);
    ed.render(); renderColours();
  }
  PS.register("bitmap", {
    render: render,
    key: function (k) {
      if (k === "x") { PS.bmLR = [PS.bmLR[1], PS.bmLR[0]]; renderColours(); return true; }
      return false;
    }
  });
  PS.toolbar(document.querySelector("#mode-bitmap [data-tools]"));
})();
