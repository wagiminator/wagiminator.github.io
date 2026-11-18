/* C64 Emulator: sprite viewer.
 * Shows every sprite the VIC-II fetched in the last frame (also multiplexed ones),
 * collects the sprites of a running game, browses all 256 sprite slots of a VIC
 * bank, and saves sprites as PNG, raw data or assembler source.
 */
(function () {
  "use strict";

  var hex = function (v, n) { return ("000" + v.toString(16).toUpperCase()).slice(-n); };
  var COLOURS = ["black", "white", "red", "cyan", "purple", "green", "blue", "yellow", "orange", "brown",
                 "light red", "dark grey", "grey", "light green", "light blue", "light grey"];
  var STORE_KEY = "c64emu.sprites";
  var MAX_COLLECT = 512;

  function rgb(c) {
    var v = VIC6569.PALETTE[c & 15];
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }
  function css(c) { return "#" + ("00000" + VIC6569.PALETTE[c & 15].toString(16)).slice(-6); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function keyOf(s) {
    var k = s.mc ? "m" + s.col + "." + s.mc0 + "." + s.mc1 : "h" + s.col;
    for (var i = 0; i < 63; i++) k += hex(s.data[i], 2);
    return k;
  }

  // Draw a sprite into RGBA pixels. bg: null = transparent, else a colour index
  function paint(img, w, ox, oy, s, scale, bg) {
    var px = img.data, cols = [null, rgb(s.mc0), rgb(s.col), rgb(s.mc1)], hi = rgb(s.col), back = bg == null ? null : rgb(bg);
    for (var y = 0; y < 21; y++) {
      for (var x = 0; x < 24; x++) {
        var byte = s.data[y * 3 + (x >> 3)], c;
        if (s.mc) { var p = (byte >> (6 - ((x & 7) & 6))) & 3; c = p ? cols[p] : back; }
        else c = (byte & (0x80 >> (x & 7))) ? hi : back;
        if (!c) continue;
        for (var dy = 0; dy < scale; dy++) {
          var o = ((oy + y * scale + dy) * w + ox + x * scale) * 4;
          for (var dx = 0; dx < scale; dx++, o += 4) { px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = 255; }
        }
      }
    }
  }
  function drawTo(canvas, s, scale, bg) {
    canvas.width = 24 * scale; canvas.height = 21 * scale;
    var g = canvas.getContext("2d"), img = g.createImageData(canvas.width, canvas.height);
    paint(img, canvas.width, 0, 0, s, scale, bg);
    g.putImageData(img, 0, 0);
  }

  window.C64Sprites = function (host) {
    var open = false, c64 = null;
    var tab = "screen", frozen = false, collecting = true;
    var shown = [], collected = [], collectedKeys = {};
    var sel = null;                                     // the selected sprite
    var mem = { bank: -1, mc: 0, col: 1, mc0: 11, mc1: 12, sel: -1 };   // memory tab settings (bank -1: follow the VIC)
    var detail = { bg: "checker", grid: true, scale: 4 };
    try {
      var saved = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
      if (saved.tab) tab = saved.tab;
      if (saved.mem) Object.assign(mem, saved.mem, { sel: -1 });
      if (saved.detail) Object.assign(detail, saved.detail);
    } catch (e) { /* storage unavailable */ }
    function persist() {
      try { localStorage.setItem(STORE_KEY, JSON.stringify({ tab: tab, mem: mem, detail: detail })); } catch (e) { /* ignore */ }
    }

    var root = document.getElementById("sprites");
    var colourOpts = COLOURS.map(function (n, i) { return '<option value="' + i + '">' + i + " " + n + "</option>"; }).join("");
    root.innerHTML =
      '<div class="dbg-head">' +
        '<h2 id="spr-title">Sprites</h2>' +
        '<div class="tabs spr-tabs" role="tablist" aria-label="Sprite views">' +
          '<button type="button" role="tab" data-stab="screen" id="spr-tab-screen">On screen</button>' +
          '<button type="button" role="tab" data-stab="collect" id="spr-tab-collect">Collected <span id="spr-count"></span></button>' +
          '<button type="button" role="tab" data-stab="memory" id="spr-tab-memory">Memory</button>' +
        '</div>' +
        '<button type="button" class="dbg-close" data-sact="close" aria-label="Close the sprite viewer" title="Close the sprite viewer">✕</button>' +
      '</div>' +
      '<div class="spr-grid">' +
        '<section class="dbg-pane spr-main">' +
          '<div class="pane-head" id="spr-tools"></div>' +
          '<div id="spr-gallery" class="spr-gallery" role="listbox" aria-label="Sprites"></div>' +
          '<div id="spr-memwrap" class="spr-memwrap" hidden><canvas id="spr-mem" aria-label="All 256 sprite slots of the VIC bank. Click one to select it."></canvas></div>' +
          '<p class="pane-foot" id="spr-foot"></p>' +
        '</section>' +
        '<section class="dbg-pane spr-detail" aria-labelledby="spr-d-h">' +
          '<div class="pane-head"><h3 id="spr-d-h">Selected sprite</h3></div>' +
          '<div class="spr-big" id="spr-bigwrap"><canvas id="spr-big" width="240" height="210" aria-label="Enlarged sprite"></canvas></div>' +
          '<div class="spr-opts">' +
            '<label class="dbg-chk">Background <select class="dbg-in" id="spr-bg"><option value="checker">Checkerboard</option><option value="black">Black</option><option value="screen">Screen colour</option></select></label>' +
            '<label class="dbg-chk"><input type="checkbox" id="spr-gridchk"> Pixel grid</label>' +
          '</div>' +
          '<dl class="facts" id="spr-facts"></dl>' +
          '<h3 class="sub">Download</h3>' +
          '<div class="spr-dl">' +
            '<label class="dbg-chk">Size <select class="dbg-in" id="spr-scale"><option value="1">1× (24×21)</option><option value="2">2×</option><option value="4">4×</option><option value="8">8×</option></select></label>' +
            '<button type="button" class="dbg-btn" data-sact="png">PNG</button>' +
            '<button type="button" class="dbg-btn" data-sact="bin" title="63 bytes of sprite data plus one padding byte">Raw data (.bin)</button>' +
            '<button type="button" class="dbg-btn" data-sact="asm">Source (.asm)</button>' +
            '<button type="button" class="dbg-btn" data-sact="copy">Copy as .byte</button>' +
          '</div>' +
          '<p class="spr-msg" id="spr-msg" role="status"></p>' +
        '</section>' +
      '</div>';

    var $ = function (id) { return document.getElementById(id); };
    var el = { tools: $("spr-tools"), gallery: $("spr-gallery"), memwrap: $("spr-memwrap"), memcv: $("spr-mem"), foot: $("spr-foot"),
      big: $("spr-big"), facts: $("spr-facts"), msg: $("spr-msg"), count: $("spr-count") };
    $("spr-bg").value = detail.bg; $("spr-gridchk").checked = detail.grid; $("spr-scale").value = String(detail.scale);

    // ------------------------------------------------------------ data
    function onFrame(list) {
      if (!collecting) return;
      for (var i = 0; i < list.length && collected.length < MAX_COLLECT; i++) {
        var k = keyOf(list[i]);
        if (collectedKeys[k]) { collectedKeys[k].seen++; continue; }
        var s = Object.assign({}, list[i], { seen: 1, key: k });
        collectedKeys[k] = s;
        collected.push(s);
      }
    }
    function attach(m) {
      c64 = m;
      if (open) trace(true);
    }
    function trace(on) {
      if (!c64) return;
      c64.vic.sprTrace = on;
      c64.vic.onSprites = on ? onFrame : null;
    }
    function bankNow() { return mem.bank >= 0 ? mem.bank : c64.vicBank >> 14; }
    // sprite data of a memory slot, as the VIC sees it (character ROM in banks 0 and 2)
    function slot(n) {
      var bank = bankNow() << 14, d = new Uint8Array(64), rom = (bank & 0x4000) === 0;
      for (var i = 0; i < 64; i++) {
        var a = n * 64 + i;
        d[i] = rom && (a & 0x3000) === 0x1000 ? c64.charRom[a & 0x0FFF] : c64.ram[bank | a];
      }
      return { n: -1, addr: bank | (n * 64), data: d, mc: mem.mc, col: mem.col, mc0: mem.mc0, mc1: mem.mc1, slot: n, rom: rom && (n * 64 & 0x3000) === 0x1000 };
    }

    // ------------------------------------------------------------ rendering
    function render() {
      if (!open || !c64) return;
      root.querySelectorAll("[data-stab]").forEach(function (b) { b.setAttribute("aria-selected", b.getAttribute("data-stab") === tab ? "true" : "false"); });
      el.count.textContent = collected.length ? "(" + collected.length + ")" : "";
      renderTools();
      el.gallery.hidden = tab === "memory";
      el.memwrap.hidden = tab !== "memory";
      if (tab === "memory") renderMemory(); else renderGallery(true);
      renderDetail();
    }
    function renderTools() {
      var html = "";
      if (tab === "screen") {
        html = '<h3>' + (frozen ? "Frozen frame" : "Last frame") + '</h3>' +
          '<button type="button" class="dbg-btn" data-sact="freeze" aria-pressed="' + frozen + '">' + (frozen ? "Unfreeze" : "Freeze") + "</button>" +
          '<button type="button" class="dbg-btn" data-sact="sheet"' + (shown.length ? "" : " disabled") + '>Download all as PNG</button>' +
          '<button type="button" class="dbg-btn" data-sact="binall"' + (shown.length ? "" : " disabled") + '>Download all as .bin</button>';
        el.foot.textContent = "Every sprite the VIC fetched in the last frame, also sprites reused further down the screen (multiplexing). Freeze keeps the frame to pick from.";
      } else if (tab === "collect") {
        html = '<h3>Collected</h3>' +
          '<label class="dbg-chk"><input type="checkbox" data-sact="collecting"' + (collecting ? " checked" : "") + "> Collect while the C64 runs</label>" +
          '<button type="button" class="dbg-btn" data-sact="clear"' + (collected.length ? "" : " disabled") + ">Clear</button>" +
          '<button type="button" class="dbg-btn" data-sact="sheet"' + (collected.length ? "" : " disabled") + ">Download all as PNG</button>" +
          '<button type="button" class="dbg-btn" data-sact="binall"' + (collected.length ? "" : " disabled") + ">Download all as .bin</button>";
        el.foot.textContent = "Every different sprite image since the viewer was opened (up to " + MAX_COLLECT + "), with its colours. Play the game to gather its animation frames.";
      } else {
        var b = bankNow();
        html = '<h3>VIC bank</h3>' +
          '<select class="dbg-in" data-sact="bank" aria-label="VIC bank"><option value="-1">As the VIC uses it ($' + hex((c64.vicBank), 4) + ")</option>" +
          [0, 1, 2, 3].map(function (k) { return '<option value="' + k + '">$' + hex(k << 14, 4) + "–$" + hex((k << 14) + 0x3FFF, 4) + "</option>"; }).join("") + "</select>" +
          '<select class="dbg-in" data-sact="mode" aria-label="Mode"><option value="0">Hires</option><option value="1">Multicolour</option></select>' +
          '<label class="dbg-chk">Colour <select class="dbg-in" data-sact="col">' + colourOpts + "</select></label>" +
          '<label class="dbg-chk"' + (mem.mc ? "" : " hidden") + '>MC 1 <select class="dbg-in" data-sact="mc0">' + colourOpts + "</select></label>" +
          '<label class="dbg-chk"' + (mem.mc ? "" : " hidden") + '>MC 2 <select class="dbg-in" data-sact="mc1">' + colourOpts + "</select></label>" +
          '<button type="button" class="dbg-btn" data-sact="fromvic" title="Take mode and colours from a sprite on screen">Colours from screen</button>' +
          '<button type="button" class="dbg-btn" data-sact="sheet">Bank as PNG</button>' +
          '<button type="button" class="dbg-btn" data-sact="binall">Bank as .bin</button>';
        el.foot.textContent = "All 256 sprite slots of bank $" + hex(b << 14, 4) + "; the number of a slot is the value for the sprite pointer. Slots $40–$7F in banks 0 and 2 show the character ROM, as the VIC sees it.";
      }
      // keep focus on a control when re-rendering
      var act = document.activeElement, id = act && act.getAttribute && act.getAttribute("data-sact");
      el.tools.innerHTML = html;
      el.tools.querySelectorAll("select").forEach(function (s) {
        var k = s.getAttribute("data-sact");
        s.value = String(k === "bank" ? mem.bank : k === "mode" ? mem.mc : mem[k]);
      });
      if (id) { var again = el.tools.querySelector('[data-sact="' + id + '"]'); if (again) again.focus(); }
    }
    function list() { return tab === "screen" ? shown : collected; }
    var lastSig = "";
    function renderGallery(force) {
      var items = list();
      // rebuild only when something changed, so a click is not lost
      var sig = tab + (sel ? sel.key : "") + "|" + items.map(function (s) { return s.key || keyOf(s); }).join("|");
      if (!force && sig === lastSig) return;
      lastSig = sig;
      if (!items.length) {
        el.gallery.innerHTML = '<p class="soft">' + (tab === "screen" ? "No sprites in the last frame." : collecting ? "Nothing collected yet. Let the C64 run a game with sprites." : "Collecting is off.") + "</p>";
        return;
      }
      el.gallery.innerHTML = "";
      items.forEach(function (s, i) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "spr-card" + (sel && sel.key === (s.key || keyOf(s)) ? " on" : "");
        b.setAttribute("role", "option");
        b.setAttribute("aria-selected", b.className.indexOf(" on") >= 0 ? "true" : "false");
        b.setAttribute("data-i", i);
        var cv = document.createElement("canvas");
        drawTo(cv, s, 1, null);
        b.appendChild(cv);
        var cap = document.createElement("span");
        cap.innerHTML = (tab === "screen" ? "Sprite " + s.n + " · line " + s.line : s.seen + "× seen") + "<br>$" + hex(s.addr, 4) + (s.mc ? " · MC" : "");
        b.appendChild(cap);
        el.gallery.appendChild(b);
      });
    }
    var CELL_W = 24 * 2 + 6, CELL_H = 21 * 2 + 6;
    function renderMemory() {
      var cv = el.memcv, W = 16 * CELL_W, H = 16 * CELL_H;
      if (cv.width !== W) { cv.width = W; cv.height = H; }
      var g = cv.getContext("2d"), img = g.createImageData(W, H), px = img.data;
      var dark = [0x3a, 0x34, 0x7c];               // mid-tone, so black and white sprites both show
      for (var n = 0; n < 256; n++) {
        var s = slot(n), ox = (n % 16) * CELL_W + 3, oy = (n >> 4) * CELL_H + 3;
        // slot background
        for (var y = -1; y < 43; y++) for (var x = -1; x < 49; x++) {
          var o = ((oy + y) * W + ox + x) * 4;
          var on = n === mem.sel && (y === -1 || y === 42 || x === -1 || x === 48);
          var c = on ? [0xf4, 0xe4, 0x6c] : s.rom ? [0x4a, 0x30, 0x5c] : dark;
          px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = 255;
        }
        paint(img, W, ox, oy, s, 2, null);
      }
      g.putImageData(img, 0, 0);
    }
    function renderDetail() {
      var s = sel;
      var bigwrap = $("spr-bigwrap");
      bigwrap.className = "spr-big bg-" + detail.bg;
      bigwrap.style.background = detail.bg === "screen" && c64 ? css(c64.vic.regs[0x21]) : "";
      root.querySelectorAll('[data-sact="png"],[data-sact="bin"],[data-sact="asm"],[data-sact="copy"]').forEach(function (b) { b.disabled = !s; });
      var g = el.big.getContext("2d");
      g.clearRect(0, 0, 240, 210);
      if (!s) {
        el.facts.innerHTML = '<p class="soft">Click a sprite to see it here.</p>';
        return;
      }
      var img = g.createImageData(240, 210);
      paint(img, 240, 0, 0, s, 10, detail.bg === "black" ? 0 : null);
      g.putImageData(img, 0, 0);
      if (detail.grid) {
        g.fillStyle = "rgba(255,255,255,0.12)";
        for (var x = 0; x <= 24; x += s.mc ? 2 : 1) g.fillRect(Math.min(x * 10, 239), 0, 1, 210);
        for (var y = 0; y <= 21; y++) g.fillRect(0, Math.min(y * 10, 209), 240, 1);
      }
      var bank = s.addr & 0xC000, ptr = (s.addr & 0x3FFF) >> 6;
      var rows = [
        ["Address", "$" + hex(s.addr, 4) + "–$" + hex(s.addr + 63, 4)],
        ["Pointer", "$" + hex(ptr, 2) + " (" + ptr + ") in bank $" + hex(bank, 4)],
        ["Mode", s.mc ? "multicolour (12×21 double-wide pixels)" : "hires (24×21)"],
        ["Colours", sw(s.col) + (s.mc ? " " + sw(s.mc0) + " " + sw(s.mc1) : "")]
      ];
      if (s.n >= 0) {
        rows.push(["Position", "X " + s.x + ", Y " + s.y + (s.xe || s.ye ? " · expanded " + (s.xe ? "X" : "") + (s.ye ? "Y" : "") : "")]);
        rows.push(["Shown as", "sprite " + s.n + " from line " + s.line + (s.behind ? ", behind the graphics" : "")]);
      }
      if (s.seen) rows.push(["Seen", s.seen + (s.seen === 1 ? " frame" : " frames")]);
      if (s.rom) rows.push(["Note", "character ROM, as the VIC sees it"]);
      el.facts.innerHTML = rows.map(function (r) { return "<div><dt>" + r[0] + "</dt><dd>" + r[1] + "</dd></div>"; }).join("");
      function sw(c) { return '<span class="sw" style="background:' + css(c) + '"></span>' + c + " " + COLOURS[c]; }
    }

    // ------------------------------------------------------------ downloads
    function name(s) { return "sprite-" + hex(s.addr, 4).toLowerCase() + (s.mc ? "-mc" : ""); }
    function saveBlob(fname, blob) {
      var url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = fname; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    }
    function png(list, scale, fname) {
      var cols = Math.min(8, list.length), rows = Math.ceil(list.length / cols);
      var cv = document.createElement("canvas");
      cv.width = cols * 24 * scale; cv.height = rows * 21 * scale;
      var g = cv.getContext("2d"), img = g.createImageData(cv.width, cv.height);
      list.forEach(function (s, i) { paint(img, cv.width, (i % cols) * 24 * scale, Math.floor(i / cols) * 21 * scale, s, scale, null); });
      g.putImageData(img, 0, 0);
      cv.toBlob(function (b) { if (b) saveBlob(fname, b); }, "image/png");
    }
    function bin(list, fname) {
      var out = new Uint8Array(list.length * 64);
      list.forEach(function (s, i) { out.set(s.data.subarray(0, 63), i * 64); out[i * 64 + 63] = s.data[63] || 0; });
      saveBlob(fname, new Blob([out], { type: "application/octet-stream" }));
    }
    function asm(s) {
      var lines = ["; sprite at $" + hex(s.addr, 4) + (s.mc ? ", multicolour: colour " + s.col + ", MC1 " + s.mc0 + ", MC2 " + s.mc1 : ", hires, colour " + s.col),
        name(s).replace(/-/g, "_") + ":"];
      for (var y = 0; y < 21; y++) {
        var b = [s.data[y * 3], s.data[y * 3 + 1], s.data[y * 3 + 2]];
        lines.push("        .byte " + b.map(function (v) { return "%" + ("0000000" + v.toString(2)).slice(-8); }).join(",") +
          "   ; " + b.map(function (v) { return "$" + hex(v, 2); }).join(","));
      }
      lines.push("        .byte $" + hex(s.data[63] || 0, 2) + "   ; padding to 64 bytes");
      return lines.join("\n") + "\n";
    }
    function allForDownload() {
      if (tab === "memory") { var out = []; for (var n = 0; n < 256; n++) out.push(slot(n)); return out; }
      return list();
    }
    function say(t) { el.msg.textContent = t; clearTimeout(say.t); say.t = setTimeout(function () { el.msg.textContent = ""; }, 4000); }

    // ------------------------------------------------------------ events
    root.addEventListener("click", function (e) {
      var t = e.target.closest("[data-stab],[data-sact],.spr-card");
      if (!t) return;
      if (t.classList.contains("spr-card")) {
        var s = list()[+t.getAttribute("data-i")];
        sel = Object.assign({}, s, { key: s.key || keyOf(s) });
        render(); return;
      }
      if (t.hasAttribute("data-stab")) { tab = t.getAttribute("data-stab"); persist(); render(); return; }
      if (t.tagName === "SELECT" || (t.tagName === "INPUT" && t.type === "checkbox")) return;
      var a = t.getAttribute("data-sact"), sc = +$("spr-scale").value;
      if (a === "close") host.toggle(false);
      else if (a === "freeze") { frozen = !frozen; if (!frozen) shown = c64.vic.sprFrame.slice(); render(); }
      else if (a === "clear") { collected = []; collectedKeys = {}; render(); }
      else if (a === "fromvic") {
        var pool = shown.length ? shown : c64.vic.sprFrame;
        // a sprite with its own colour first: black outlines say little about the others
        var src = pool.filter(function (x) { return x.mc; })[0] || pool.filter(function (x) { return x.col; })[0] || pool[0];
        var r = c64.vic.regs;
        mem.mc = src ? src.mc : r[0x1C] & 1; mem.col = src ? src.col : r[0x27] & 15; mem.mc0 = r[0x25] & 15; mem.mc1 = r[0x26] & 15;
        persist(); render();
      }
      else if (a === "sheet") {
        var all = allForDownload();
        if (all.length) png(all, sc, tab === "memory" ? "sprites-bank-" + hex(bankNow() << 14, 4).toLowerCase() + ".png" : "sprites-" + (tab === "screen" ? "frame" : "collected") + ".png");
      }
      else if (a === "binall") {
        var all2 = allForDownload();
        if (all2.length) bin(all2, tab === "memory" ? "sprites-bank-" + hex(bankNow() << 14, 4).toLowerCase() + ".bin" : "sprites-" + (tab === "screen" ? "frame" : "collected") + ".bin");
      }
      else if (sel && a === "png") png([sel], sc, name(sel) + ".png");
      else if (sel && a === "bin") bin([sel], name(sel) + ".bin");
      else if (sel && a === "asm") saveBlob(name(sel) + ".asm", new Blob([asm(sel)], { type: "text/plain" }));
      else if (sel && a === "copy") {
        var text = asm(sel);
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { say("Copied to the clipboard."); }, function () { say("The browser did not allow copying."); });
        else say("The browser did not allow copying.");
      }
    });
    root.addEventListener("change", function (e) {
      var t = e.target, a = t.getAttribute("data-sact");
      if (a === "collecting") { collecting = t.checked; render(); return; }
      if (a === "bank") mem.bank = +t.value;
      else if (a === "mode") mem.mc = +t.value;
      else if (a === "col" || a === "mc0" || a === "mc1") mem[a] = +t.value;
      else if (t.id === "spr-bg") detail.bg = t.value;
      else if (t.id === "spr-gridchk") detail.grid = t.checked;
      else if (t.id === "spr-scale") detail.scale = +t.value;
      else return;
      if (sel && sel.slot >= 0 && tab === "memory") sel = slot(sel.slot);
      persist(); render();
    });
    el.memcv.addEventListener("click", function (e) {
      var r = el.memcv.getBoundingClientRect();
      var x = (e.clientX - r.left) * el.memcv.width / r.width, y = (e.clientY - r.top) * el.memcv.height / r.height;
      var n = Math.floor(y / CELL_H) * 16 + Math.floor(x / CELL_W);
      if (n < 0 || n > 255) return;
      mem.sel = n; sel = slot(n); sel.key = "slot" + n;
      render();
    });

    // live updates
    var lastEmpty = null;
    setInterval(function () {
      if (!open || !c64) return;
      if (!c64.vic.sprTrace) trace(true);              // a reset switched it off
      if (!frozen) shown = c64.vic.sprFrame.slice();
      var empty = tab === "screen" ? !shown.length : tab === "collect" ? !collected.length : false;
      if (empty !== lastEmpty) { lastEmpty = empty; renderTools(); }
      if (tab === "memory") {
        if (sel && sel.slot >= 0) { var k = sel.key; sel = slot(sel.slot); sel.key = k; }
        renderMemory(); renderDetail();
        el.count.textContent = collected.length ? "(" + collected.length + ")" : "";
      } else if (!(tab === "screen" && frozen)) {
        renderGallery();
        el.count.textContent = collected.length ? "(" + collected.length + ")" : "";
      }
    }, 300);

    function setOpen(on) {
      open = on;
      root.hidden = !on;
      document.querySelector(".app").classList.toggle("spriting", on);
      trace(on);
      if (on && c64) { shown = c64.vic.sprFrame.slice(); render(); }
    }

    return { attach: attach, setOpen: setOpen, isOpen: function () { return open; } };
  };
})();
