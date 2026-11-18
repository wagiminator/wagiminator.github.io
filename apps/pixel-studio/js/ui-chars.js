/* C64 Pixel Studio: character set */
(function () {
  "use strict";

  var PS = window.PS, G = PS.G, $ = PS.$;
  var SCALE = 40, GRID = 2, CELL = 8 * GRID + 2;

  function code() { return PS.sel.char; }
  function isMc(c) { return PS.p.charMode === "mc" && PS.p.charCols[c] >= 8; }
  function slotNames(c) {
    return isMc(c) ? ["Background ($D021)", "Multicolour 1 ($D022)", "Multicolour 2 ($D023)", "Character colour"] : ["Background ($D021)", "Character colour"];
  }
  function slotColour(c, slot) { return G.charSlots(PS.p.charCols[c], PS.p.colors, PS.p.charMode === "mc").slots[slot]; }
  PS.charIsMc = isMc;

  var ed = new window.PixelEditor($("chr-ed"), {
    size: function () { var mc = isMc(code()); return { w: mc ? 4 : 8, h: 8, aspect: mc ? 2 : 1, scale: SCALE }; },
    get: function (x, y) { return G.getPx(PS.p.chars, code() * 8, 1, x, y, isMc(code())); },
    set: function (x, y, v) { G.setPx(PS.p.chars, code() * 8, 1, x, y, isMc(code()), v); },
    css: function (v) { return G.CSS[slotColour(code(), v)]; },
    paint: function (b) { return Math.min(PS.slots.char[b], slotNames(code()).length - 1); },
    begin: function (label) { PS.checkpoint(label); },
    end: function () { PS.changed(); },
    onPick: function (v, b) { PS.slots.char[b] = v; renderColours(); },
    grid: function () { return {}; },
    onHover: function (x, y) {
      $("chr-status").textContent = x < 0 ? " " : "x " + (isMc(code()) ? x * 2 : x) + ", y " + y + " · " + slotNames(code())[ed.o.get(x, y)];
    }
  });

  // ---------------------------------------------------------------- the character set grid
  function charImage(img, ox, oy, c, scale) {
    G.drawChar(img, ox, oy, PS.p.chars, c, PS.p.charCols[c], PS.p.colors, PS.p.charMode === "mc", scale);
  }
  PS.charImage = charImage;
  function renderGrid() {
    var cv = $("chr-grid"), W = 16 * CELL;
    var g = PS.paintCanvas(cv, W, W, function (img) {
      var px = img.data;
      for (var i = 0; i < px.length; i += 4) { px[i] = 0xdc; px[i + 1] = 0xdd; px[i + 2] = 0xe6; px[i + 3] = 255; }
      for (var c = 0; c < 256; c++) charImage(img, (c % 16) * CELL + 1, (c >> 4) * CELL + 1, c, GRID);
    });
    var sc = code();
    g.strokeStyle = "#f0a400"; g.lineWidth = 2;
    g.strokeRect((sc % 16) * CELL, (sc >> 4) * CELL, CELL, CELL);
  }
  function gridPick(e) {
    var cv = $("chr-grid"), r = cv.getBoundingClientRect();
    var x = Math.floor((e.clientX - r.left) * cv.width / r.width / CELL), y = Math.floor((e.clientY - r.top) * cv.height / r.height / CELL);
    if (x < 0 || y < 0 || x > 15 || y > 15) return;
    PS.sel.char = y * 16 + x;
    render();
  }
  $("chr-grid").addEventListener("click", gridPick);
  $("chr-grid").addEventListener("keydown", function (e) {
    var d = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 16, ArrowUp: -16 }[e.key];
    if (!d) return;
    e.preventDefault();
    PS.sel.char = (PS.sel.char + d + 256) & 255;
    render();
  });

  // ---------------------------------------------------------------- colours
  function renderColours() {
    var c = code(), names = slotNames(c), L = PS.slots.char, mcMode = PS.p.charMode === "mc";
    for (var b = 0; b < 2; b++) if (L[b] >= names.length) L[b] = b === 0 ? names.length - 1 : 0;
    $("chr-mode").value = PS.p.charMode;
    $("chr-slots").innerHTML = names.map(function (n, i) {
      var col = slotColour(c, i);
      return '<button type="button" class="slot' + (L[0] === i ? " is-l" : "") + (L[1] === i ? " is-r" : "") + '" data-slot="' + i + '">' +
        '<span class="chip" style="--c:' + G.CSS[col] + '"></span><span>' + n + " <small>" + col + " " + G.NAMES[col] + "</small></span>" +
        '<span class="lr-tags">' + (L[0] === i ? "<b>L</b>" : "") + (L[1] === i ? "<b>R</b>" : "") + "</span></button>";
    }).join("");
    PS.markPalette($("chr-pal"), slotColour(c, L[0]), -1);
    $("chr-mcrow").hidden = !mcMode;
    $("chr-mcchar").checked = isMc(c);
    $("chr-hint").textContent = mcMode
      ? "Multicolour characters have double-wide pixels and use colours 0–7 as their own colour, like on the C64 (colour RAM 8–15)."
      : "Every character has its own colour (colour RAM). Left button paints with the first slot (L), right button with the second (R).";
  }
  $("chr-slots").addEventListener("click", function (e) { var b = e.target.closest("[data-slot]"); if (b) { PS.slots.char[0] = +b.getAttribute("data-slot"); renderColours(); } });
  $("chr-slots").addEventListener("contextmenu", function (e) { var b = e.target.closest("[data-slot]"); if (b) { e.preventDefault(); PS.slots.char[1] = +b.getAttribute("data-slot"); renderColours(); } });
  PS.palette($("chr-pal"), function (col) {
    var c = code(), slot = PS.slots.char[0], mc = isMc(c), names = slotNames(c);
    PS.checkpoint("Colour");
    if (slot === 0) PS.p.colors.bg = col;
    else if (mc && slot === 1) PS.p.colors.chrMc1 = col;
    else if (mc && slot === 2) PS.p.colors.chrMc2 = col;
    else if (slot === names.length - 1) PS.p.charCols[c] = mc ? (col & 7) | 8 : col;
    PS.changed();
  });
  $("chr-mode").addEventListener("change", function () { PS.checkpoint("Mode"); PS.p.charMode = this.value; PS.changed(); });
  $("chr-mcchar").addEventListener("change", function () {
    PS.checkpoint("Multicolour"); var c = code();
    PS.p.charCols[c] = this.checked ? (PS.p.charCols[c] & 7) | 8 : PS.p.charCols[c] & 7;
    PS.changed();
  });
  $("chr-colall").addEventListener("click", function () { PS.checkpoint("Colours"); PS.p.charCols.fill(PS.p.charCols[code()]); PS.changed(); });
  document.querySelectorAll("[data-rom]").forEach(function (b) {
    b.addEventListener("click", function () {
      var r = b.getAttribute("data-rom");
      PS.checkpoint("Character set");
      if (r === "empty") PS.p.chars.fill(0);
      else PS.p.chars.set(window.C64_CHARGEN.subarray(+r * 2048, +r * 2048 + 2048));
      PS.changed();
    });
  });

  // ---------------------------------------------------------------- operations
  PS.charOp = function (chars, c, op, mc) {
    var o = c * 8, y, b, i, rows = Array.prototype.slice.call(chars.subarray(o, o + 8)), n = mc ? 2 : 1;
    if (op === "left") for (y = 0; y < 8; y++) rows[y] = ((rows[y] << n) | (rows[y] >> (8 - n))) & 255;
    else if (op === "right") for (y = 0; y < 8; y++) rows[y] = ((rows[y] >> n) | (rows[y] << (8 - n))) & 255;
    else if (op === "up") rows.push(rows.shift());
    else if (op === "down") rows.unshift(rows.pop());
    else if (op === "flipv") rows.reverse();
    else if (op === "fliph") for (y = 0; y < 8; y++) { b = 0; for (i = 0; i < 8; i += n) b |= ((rows[y] >> i) & (n === 2 ? 3 : 1)) << (8 - n - i); rows[y] = b; }
    else if (op === "rotate") {
      var r2 = [0, 0, 0, 0, 0, 0, 0, 0];
      for (y = 0; y < 8; y++) for (i = 0; i < 8; i++) if (rows[y] & (0x80 >> i)) r2[i] |= 1 << y;
      rows = r2;
    }
    else if (op === "invert") for (y = 0; y < 8; y++) rows[y] ^= 255;
    else if (op === "clear") rows = [0, 0, 0, 0, 0, 0, 0, 0];
    chars.set(rows, o);
  };
  function op(o) {
    var c = code();
    if (o === "copy") { PS.clip.char = { bytes: PS.p.chars.slice(c * 8, c * 8 + 8), col: PS.p.charCols[c] }; PS.say("Character copied."); return; }
    if (o === "paste") {
      if (!PS.clip.char) { PS.say("Copy a character first."); return; }
      PS.checkpoint("Paste"); PS.p.chars.set(PS.clip.char.bytes, c * 8); PS.p.charCols[c] = PS.clip.char.col; PS.changed(); return;
    }
    if (o === "rotate" && isMc(c)) { PS.say("Multicolour characters cannot be rotated: their pixels are double-wide."); return; }
    PS.checkpoint("Change character");
    PS.charOp(PS.p.chars, c, o, isMc(c));
    PS.changed();
  }
  document.querySelectorAll("[data-cop]").forEach(function (b) { b.addEventListener("click", function () { op(b.getAttribute("data-cop")); }); });

  // ---------------------------------------------------------------- text preview
  function screenCode(ch) {
    var a = ch.charCodeAt(0);
    if (a >= 65 && a <= 90) return a - 64;
    if (a >= 97 && a <= 122) return a - 96;
    if (a === 64) return 0;
    if (a === 91) return 27; if (a === 163) return 28; if (a === 93) return 29;
    if (a >= 32 && a <= 63) return a;
    return 32;
  }
  PS.screenCode = screenCode;
  function renderText() {
    var t = $("chr-text").value || " ", lines = [];
    for (var i = 0; i < t.length; i += 40) lines.push(t.slice(i, i + 40));
    var cv = $("chr-textcv");
    PS.paintCanvas(cv, 320, lines.length * 8 + 8, function (img) {
      var px = img.data, bg = G.RGB[PS.p.colors.bg];
      for (var k = 0; k < px.length; k += 4) { px[k] = bg[0]; px[k + 1] = bg[1]; px[k + 2] = bg[2]; px[k + 3] = 255; }
      lines.forEach(function (l, y) { for (var x = 0; x < l.length; x++) charImage(img, x * 8, 4 + y * 8, screenCode(l[x]), 1); });
    });
  }
  $("chr-text").addEventListener("input", renderText);

  function render() {
    var c = code();
    $("chr-title").textContent = "Character $" + PS.hex(c, 2) + " (" + c + ")";
    $("chr-info").textContent = isMc(c) ? "multicolour" : "hires";
    document.querySelector('[data-cop="rotate"]').disabled = isMc(c);
    ed.render(); renderGrid(); renderColours(); renderText();
  }
  PS.register("chars", {
    render: render,
    key: function (k) {
      if (k === "[" || k === "]") { PS.sel.char = (PS.sel.char + (k === "[" ? 255 : 1)) & 255; render(); return true; }
      if (k === "x") { var t = PS.slots.char; PS.slots.char = [t[1], t[0]]; renderColours(); return true; }
      if (k === "copy" || k === "paste") { op(k); return true; }
      return false;
    }
  });
  PS.toolbar(document.querySelector("#mode-chars [data-tools]"));
})();
