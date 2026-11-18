/* C64 Emulator: character set viewer.
 * Shows the character sets the VIC-II uses in this frame (also several, when a game
 * switches them further down the screen) with the colours of the screen, marks the
 * characters the screen uses, browses any character set in memory or the ROM, and
 * saves character sets and single characters as PNG, raw data or assembler source.
 */
(function () {
  "use strict";

  var hex = function (v, n) { return ("000" + v.toString(16).toUpperCase()).slice(-n); };
  var COLOURS = ["black", "white", "red", "cyan", "purple", "green", "blue", "yellow", "orange", "brown",
                 "light red", "dark grey", "grey", "light green", "light blue", "light grey"];
  var STORE_KEY = "c64emu.charset";
  var CELL = 8 * 3 + 4;                    // grid cell: 3x glyph and a gap

  function rgb(c) { var v = VIC6569.PALETTE[c & 15]; return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; }
  function css(c) { return "#" + ("00000" + VIC6569.PALETTE[c & 15].toString(16)).slice(-6); }
  function screenToPetscii(sc) {
    sc &= 0x7F;
    if (sc < 0x20) return sc + 0x40;
    if (sc < 0x40) return sc;
    if (sc < 0x60) return sc + 0x80;
    return sc + 0x40;
  }

  // Draw one 8x8 character. o: { mc, col, bg, mc1, mc2 }; bg null = transparent
  function paintChar(img, w, ox, oy, bytes, o, scale) {
    var px = img.data, isMc = o.mc && o.col >= 8;
    var fg = rgb(isMc ? o.col & 7 : o.col), back = o.bg == null ? null : rgb(o.bg);
    var pal = [back, rgb(o.mc1), rgb(o.mc2), fg];
    for (var y = 0; y < 8; y++) {
      var b = bytes[y];
      for (var x = 0; x < 8; x++) {
        var c = isMc ? pal[(b >> (6 - (x & 6))) & 3] : (b & (0x80 >> x)) ? fg : back;
        if (!c) continue;
        for (var dy = 0; dy < scale; dy++) {
          var p = ((oy + y * scale + dy) * w + ox + x * scale) * 4;
          for (var dx = 0; dx < scale; dx++, p += 4) { px[p] = c[0]; px[p + 1] = c[1]; px[p + 2] = c[2]; px[p + 3] = 255; }
        }
      }
    }
  }

  window.C64Charset = function (host) {
    var open = false, c64 = null;
    var tab = "use", seg = 0, frozen = false, segs = [], sel = -1;
    var mem = { bank: 0, base: 2, mc: 0, col: 14, bg: 6, mc1: 1, mc2: 2 };     // Memory tab: $1000 in bank 0 = ROM
    var opt = { marks: true, grid: true, scale: 2, transparent: false };
    try {
      var saved = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
      if (saved.tab) tab = saved.tab;
      if (saved.mem) Object.assign(mem, saved.mem);
      if (saved.opt) Object.assign(opt, saved.opt);
    } catch (e) { /* storage unavailable */ }
    function persist() { try { localStorage.setItem(STORE_KEY, JSON.stringify({ tab: tab, mem: mem, opt: opt })); } catch (e) { /* ignore */ } }

    var root = document.getElementById("charset");
    var colourOpts = COLOURS.map(function (n, i) { return '<option value="' + i + '">' + i + " " + n + "</option>"; }).join("");
    root.innerHTML =
      '<div class="dbg-head">' +
        '<h2 id="chr-title">Characters</h2>' +
        '<div class="tabs spr-tabs" role="tablist" aria-label="Character set views">' +
          '<button type="button" role="tab" data-ctab="use" id="chr-tab-use">In use</button>' +
          '<button type="button" role="tab" data-ctab="memory" id="chr-tab-memory">Memory</button>' +
        '</div>' +
        '<button type="button" class="dbg-close" data-cact="close" aria-label="Close the character set viewer" title="Close the character set viewer">✕</button>' +
      '</div>' +
      '<div class="spr-grid">' +
        '<section class="dbg-pane chr-main">' +
          '<div class="pane-head" id="chr-tools"></div>' +
          '<div class="chr-segs" id="chr-segs" role="group" aria-label="Character sets on the screen"></div>' +
          '<div class="chr-wrap"><canvas id="chr-grid" aria-label="The 256 characters. Click one to select it."></canvas></div>' +
          '<p class="pane-foot" id="chr-foot"></p>' +
        '</section>' +
        '<section class="dbg-pane spr-detail" aria-labelledby="chr-d-h">' +
          '<div class="pane-head"><h3 id="chr-d-h">Selected character</h3></div>' +
          '<div class="chr-big-row"><div class="spr-big chr-big" id="chr-bigwrap"><canvas id="chr-big" width="192" height="192" aria-label="Enlarged character"></canvas></div>' +
            '<pre class="chr-bytes" id="chr-bytes" aria-label="The 8 bytes of the character"></pre></div>' +
          '<dl class="facts" id="chr-facts"></dl>' +
          '<h3 class="sub">Download</h3>' +
          '<div class="spr-dl">' +
            '<label class="dbg-chk">Size <select class="dbg-in" id="chr-scale"><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option><option value="8">8×</option></select></label>' +
            '<label class="dbg-chk"><input type="checkbox" id="chr-transp"> Transparent</label>' +
          '</div>' +
          '<p class="chr-dl-label">This character</p>' +
          '<div class="spr-dl">' +
            '<button type="button" class="dbg-btn" data-cact="png1">PNG</button>' +
            '<button type="button" class="dbg-btn" data-cact="bin1">Raw (.bin)</button>' +
            '<button type="button" class="dbg-btn" data-cact="copy1">Copy as .byte</button>' +
          '</div>' +
          '<p class="chr-dl-label">Whole character set</p>' +
          '<div class="spr-dl">' +
            '<button type="button" class="dbg-btn" data-cact="png">PNG</button>' +
            '<button type="button" class="dbg-btn" data-cact="bin" title="2048 bytes">Raw (.bin)</button>' +
            '<button type="button" class="dbg-btn" data-cact="prg" title="Load address and 2048 bytes, as most C64 tools save it">With load address (.64c)</button>' +
            '<button type="button" class="dbg-btn" data-cact="asm">Source (.asm)</button>' +
          '</div>' +
          '<p class="spr-msg" id="chr-msg" role="status"></p>' +
        '</section>' +
      '</div>';

    var $ = function (id) { return document.getElementById(id); };
    var el = { tools: $("chr-tools"), segs: $("chr-segs"), grid: $("chr-grid"), foot: $("chr-foot"), big: $("chr-big"),
      bytes: $("chr-bytes"), facts: $("chr-facts"), msg: $("chr-msg") };
    $("chr-scale").value = String(opt.scale); $("chr-transp").checked = opt.transparent;

    function attach(m) { c64 = m; if (open) trace(true); }
    function trace(on) { if (c64) c64.vic.chrTrace = on; }

    // ------------------------------------------------------------ the character set being shown
    // { addr, rom, romOff, o: colours, perChar: colour per screen code or null, used: counts or null, info }
    function current() {
      if (tab === "memory") {
        var base = (mem.bank << 14) | (mem.base << 11), rom = !(mem.bank & 1) && (mem.base === 2 || mem.base === 3);
        return { addr: base, rom: rom, romOff: mem.base === 3 ? 0x800 : 0, o: { mc: mem.mc, col: mem.col, bg: mem.bg, mc1: mem.mc1, mc2: mem.mc2 }, perChar: null, used: null };
      }
      var s = segs[seg];
      if (!s) return null;
      var cols = s.cols, mc = (s.mode & 0x10) ? 1 : 0, ecm = s.mode & 0x40, bmm = s.mode & 0x20;
      // screen rows of this part of the screen, the codes they use and the colour of each code
      var r0 = Math.max(0, Math.floor((s.from - 0x30 - s.ys) / 8)), r1 = Math.min(24, Math.floor((s.to - 0x30 - s.ys) / 8));
      var used = new Uint16Array(256), colour = new Int8Array(256).fill(-1), counts = new Uint16Array(16);
      for (var row = r0; row <= r1; row++) {
        for (var col = 0; col < 40; col++) {
          var i = row * 40 + col, code = c64.ram[(s.scr + i) & 0xFFFF], cr = c64.colorRam[i] & 15;
          if (ecm) code &= 0x3F;
          used[code]++; counts[cr]++;
          if (colour[code] < 0) colour[code] = cr;
        }
      }
      var common = 0;
      for (var k = 1; k < 16; k++) if (counts[k] > counts[common]) common = k;
      return { addr: s.chr, rom: s.rom, romOff: (s.chr & 0x0800), o: { mc: mc, col: common, bg: cols & 15, mc1: (cols >> 4) & 15, mc2: (cols >> 8) & 15 },
        perChar: colour, used: used, rows: [r0, r1], ecm: ecm, bmm: bmm, seg: s };
    }
    function glyph(cs, code) {
      var out = new Uint8Array(8);
      for (var y = 0; y < 8; y++) {
        var a = code * 8 + y;
        out[y] = cs.rom ? c64.charRom[(cs.romOff + a) & 0x0FFF] : c64.ram[(cs.addr + a) & 0xFFFF];
      }
      return out;
    }
    function coloursFor(cs, code, transparent) {
      var o = Object.assign({}, cs.o);
      if (cs.perChar && cs.perChar[code] >= 0) o.col = cs.perChar[code];
      if (transparent) o.bg = null;
      return o;
    }

    // ------------------------------------------------------------ rendering
    function render() {
      if (!open || !c64) return;
      root.querySelectorAll("[data-ctab]").forEach(function (b) { b.setAttribute("aria-selected", b.getAttribute("data-ctab") === tab ? "true" : "false"); });
      renderTools(); renderSegs(); renderGrid(); renderDetail();
    }
    function renderTools() {
      var html;
      if (tab === "use") {
        html = "<h3>" + (frozen ? "Frozen frame" : "Last frame") + "</h3>" +
          '<label class="dbg-chk"><input type="checkbox" data-cact="marks"' + (opt.marks ? " checked" : "") + "> Mark characters on the screen</label>" +
          '<button type="button" class="dbg-btn" data-cact="freeze" aria-pressed="' + frozen + '">' + (frozen ? "Unfreeze" : "Freeze") + "</button>" +
          '<button type="button" class="dbg-btn" data-cact="tomem" title="Open this character set in the Memory view, with these colours, to change them">Change colours</button>';
      } else {
        var bases = [];
        for (var b = 0; b < 8; b++) {
          var a = (mem.bank << 14) | (b << 11), rom = !(mem.bank & 1) && (b === 2 || b === 3);
          bases.push('<option value="' + b + '">$' + hex(a, 4) + (rom ? " (ROM, " + (b === 2 ? "upper case" : "lower case") + ")" : "") + "</option>");
        }
        html = "<h3>From memory</h3>" +
          '<select class="dbg-in" data-cact="bank" aria-label="VIC bank">' + [0, 1, 2, 3].map(function (k) { return '<option value="' + k + '">Bank $' + hex(k << 14, 4) + "</option>"; }).join("") + "</select>" +
          '<select class="dbg-in" data-cact="base" aria-label="Character set address">' + bases.join("") + "</select>" +
          '<select class="dbg-in" data-cact="mc" aria-label="Mode"><option value="0">Hires</option><option value="1">Multicolour</option></select>' +
          '<label class="dbg-chk">Colour <select class="dbg-in" data-cact="col">' + colourOpts + "</select></label>" +
          '<label class="dbg-chk">Background <select class="dbg-in" data-cact="bg">' + colourOpts + "</select></label>" +
          '<label class="dbg-chk"' + (mem.mc ? "" : " hidden") + '>MC 1 <select class="dbg-in" data-cact="mc1">' + colourOpts + "</select></label>" +
          '<label class="dbg-chk"' + (mem.mc ? "" : " hidden") + '>MC 2 <select class="dbg-in" data-cact="mc2">' + colourOpts + "</select></label>";
      }
      var act = document.activeElement, id = act && act.getAttribute && act.getAttribute("data-cact");
      el.tools.innerHTML = html;
      el.tools.querySelectorAll("select").forEach(function (s) { s.value = String(mem[s.getAttribute("data-cact")]); });
      if (id) { var again = el.tools.querySelector('[data-cact="' + id + '"]'); if (again) again.focus(); }
    }
    var segSig = "";
    function renderSegs(force) {
      if (tab !== "use") { el.segs.hidden = true; segSig = ""; return; }
      el.segs.hidden = false;
      var sig = seg + "|" + segs.map(function (s) { return s.chr + "." + s.scr + "." + s.mode + "." + s.cols + "." + s.from + "." + s.to; }).join("|");
      if (!force && sig === segSig) return;
      segSig = sig;
      if (!segs.length) { el.segs.innerHTML = '<p class="soft">The screen shows no text lines right now (blank screen or border only).</p>'; return; }
      el.segs.innerHTML = segs.map(function (s, i) {
        var mode = (s.mode & 0x20) ? "bitmap" : (s.mode & 0x40) ? "extended colour" : (s.mode & 0x10) ? "multicolour" : "hires";
        return '<button type="button" class="chr-seg" data-seg="' + i + '" aria-pressed="' + (i === seg) + '"><b>$' + hex(s.chr, 4) + "</b>" +
          (s.rom ? " ROM" : "") + "<span>lines " + s.from + "–" + s.to + " · " + mode + "</span></button>";
      }).join("");
    }
    function renderGrid() {
      var cs = current(), cv = el.grid, W = 16 * CELL, H = 16 * CELL;
      if (cv.width !== W) { cv.width = W; cv.height = H; }
      var g = cv.getContext("2d"), img = g.createImageData(W, H), px = img.data;
      if (!cs) { g.clearRect(0, 0, W, H); el.foot.textContent = ""; return; }
      var frame = [0x3a, 0x34, 0x7c], hi = [0xf4, 0xe4, 0x6c];
      var nUsed = 0;
      for (var code = 0; code < 256; code++) {
        var ox = (code % 16) * CELL + 2, oy = (code >> 4) * CELL + 2;
        var isSel = code === sel;
        for (var y = -2; y < 26; y++) for (var x = -2; x < 26; x++) {
          if (y >= 0 && y < 24 && x >= 0 && x < 24) continue;
          var p = ((oy + y) * W + ox + x) * 4, c = isSel ? hi : frame;
          if (!isSel && (y < -1 || y > 24 || x < -1 || x > 24)) continue;
          px[p] = c[0]; px[p + 1] = c[1]; px[p + 2] = c[2]; px[p + 3] = 255;
        }
        paintChar(img, W, ox, oy, glyph(cs, cs.ecm ? code & 0x3F : code), coloursFor(cs, code, false), 3);
        var unused = cs.used && !cs.used[code];
        if (cs.used && !unused) nUsed++;
        if (unused && opt.marks) {
          // dim the characters the screen does not use
          for (var yy = 0; yy < 24; yy++) for (var xx = 0; xx < 24; xx++) {
            var q = ((oy + yy) * W + ox + xx) * 4;
            px[q] = px[q] * 0.3 + 0x22 * 0.7; px[q + 1] = px[q + 1] * 0.3 + 0x1e * 0.7; px[q + 2] = px[q + 2] * 0.3 + 0x52 * 0.7; px[q + 3] = 255;
          }
        }
      }
      g.putImageData(img, 0, 0);
      if (tab === "use") {
        var s = cs.seg;
        el.foot.textContent = "Character set at $" + hex(cs.addr, 4) + (cs.rom ? " (character ROM)" : "") + " for screen rows " + (cs.rows[0] + 1) + "–" + (cs.rows[1] + 1) +
          " (screen at $" + hex(s.scr, 4) + "). The screen uses " + nUsed + " of " + (cs.ecm ? 64 : 256) + " characters" + (opt.marks ? "; the others are dimmed" : "") + "." +
          (cs.bmm ? " These lines are in bitmap mode and do not use the character set." : "") +
          (cs.ecm ? " Extended colour mode: only the first 64 characters, the top two bits of a code choose the background." : "") +
          " Characters show in the colour of their first place on the screen.";
      } else {
        el.foot.textContent = "Character set at $" + hex(cs.addr, 4) + (cs.rom ? ", where the VIC sees the character ROM (" + (cs.romOff ? "lower" : "upper") + " case)" : "") + ". In multicolour, characters with a colour of 8 or more are multicolour, like on the screen.";
      }
    }
    function renderDetail() {
      var cs = current();
      root.querySelectorAll('[data-cact="png1"],[data-cact="bin1"],[data-cact="copy1"]').forEach(function (b) { b.disabled = !cs || sel < 0; });
      root.querySelectorAll('[data-cact="png"],[data-cact="bin"],[data-cact="prg"],[data-cact="asm"]').forEach(function (b) { b.disabled = !cs; });
      var g = el.big.getContext("2d");
      g.clearRect(0, 0, 192, 192);
      if (!cs || sel < 0) { el.bytes.textContent = ""; el.facts.innerHTML = '<p class="soft">Click a character to see it here.</p>'; return; }
      var code = sel, bytes = glyph(cs, cs.ecm ? code & 0x3F : code), o = coloursFor(cs, code, false);
      var img = g.createImageData(192, 192);
      paintChar(img, 192, 0, 0, bytes, o, 24);
      g.putImageData(img, 0, 0);
      if (opt.grid) {
        g.fillStyle = "rgba(255,255,255,0.14)";
        var step = o.mc && o.col >= 8 ? 2 : 1;
        for (var x = 0; x <= 8; x += step) g.fillRect(Math.min(x * 24, 191), 0, 1, 192);
        for (var y = 0; y <= 8; y++) g.fillRect(0, Math.min(y * 24, 191), 192, 1);
      }
      el.bytes.textContent = Array.prototype.map.call(bytes, function (b) { return ("0000000" + b.toString(2)).slice(-8) + " $" + hex(b, 2); }).join("\n");
      var at = cs.addr + code * 8;
      var rows = [
        ["Screen code", "$" + hex(code, 2) + " (" + code + ")" + (code >= 128 ? ", reversed" : "")],
        ["PETSCII", "$" + hex(screenToPetscii(code), 2) + (code >= 128 ? " with RVS ON" : "")],
        ["Data", cs.rom ? "character ROM $" + hex(0xD000 + cs.romOff + code * 8, 4) : "$" + hex(at, 4) + "–$" + hex(at + 7, 4)],
        ["Colour", '<span class="sw" style="background:' + css(o.mc && o.col >= 8 ? o.col & 7 : o.col) + '"></span>' + o.col + " " + COLOURS[o.col] + (o.mc ? (o.col >= 8 ? " · multicolour" : " · hires (colour below 8)") : "")]
      ];
      if (cs.used) rows.push(["On screen", cs.used[code] ? cs.used[code] + (cs.used[code] === 1 ? " time" : " times") : "not used"]);
      el.facts.innerHTML = rows.map(function (r) { return "<div><dt>" + r[0] + "</dt><dd>" + r[1] + "</dd></div>"; }).join("");
    }

    // ------------------------------------------------------------ downloads
    function saveBlob(fname, blob) {
      var url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = fname; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    }
    function baseName(cs) { return "charset-" + hex(cs.rom ? 0xD000 + cs.romOff : cs.addr, 4).toLowerCase(); }
    function allBytes(cs) { var out = new Uint8Array(2048); for (var c = 0; c < 256; c++) out.set(glyph(cs, c), c * 8); return out; }
    function pngOf(cs, codes, perRow, scale, fname) {
      var rowsN = Math.ceil(codes.length / perRow), cv = document.createElement("canvas");
      cv.width = Math.min(perRow, codes.length) * 8 * scale; cv.height = rowsN * 8 * scale;
      var g = cv.getContext("2d"), img = g.createImageData(cv.width, cv.height);
      codes.forEach(function (code, i) {
        paintChar(img, cv.width, (i % perRow) * 8 * scale, Math.floor(i / perRow) * 8 * scale, glyph(cs, cs.ecm ? code & 0x3F : code), coloursFor(cs, code, opt.transparent), scale);
      });
      g.putImageData(img, 0, 0);
      cv.toBlob(function (b) { if (b) saveBlob(fname, b); }, "image/png");
    }
    function asmOf(cs, codes) {
      var lines = ["; character set at $" + hex(cs.rom ? 0xD000 + cs.romOff : cs.addr, 4) + (cs.rom ? " (character ROM)" : "")];
      codes.forEach(function (code) {
        var b = glyph(cs, code);
        lines.push("        .byte " + Array.prototype.map.call(b, function (v) { return "$" + hex(v, 2); }).join(",") + "   ; $" + hex(code, 2));
      });
      return lines.join("\n") + "\n";
    }
    function say(t) { el.msg.textContent = t; clearTimeout(say.t); say.t = setTimeout(function () { el.msg.textContent = ""; }, 4000); }

    // ------------------------------------------------------------ events
    root.addEventListener("click", function (e) {
      var t = e.target.closest("[data-ctab],[data-cact],[data-seg]");
      if (!t) return;
      if (t.hasAttribute("data-ctab")) { tab = t.getAttribute("data-ctab"); persist(); render(); return; }
      if (t.hasAttribute("data-seg")) { seg = +t.getAttribute("data-seg"); renderSegs(true); renderGrid(); renderDetail(); return; }
      if (t.tagName === "SELECT" || t.tagName === "INPUT") return;
      var a = t.getAttribute("data-cact"), cs = current(), sc = opt.scale;
      if (a === "close") { host.toggle(false); return; }
      if (a === "freeze") { frozen = !frozen; if (!frozen) segs = c64.vic.chrFrame.slice(); render(); return; }
      if (a === "tomem" && cs) {
        var addr = cs.rom ? (cs.addr & 0xC000) | 0x1000 | cs.romOff : cs.addr;
        mem.bank = addr >> 14; mem.base = (addr >> 11) & 7;
        mem.mc = cs.o.mc; mem.col = cs.o.col; mem.bg = cs.o.bg; mem.mc1 = cs.o.mc1; mem.mc2 = cs.o.mc2;
        tab = "memory"; persist(); render(); return;
      }
      if (!cs) return;
      if (a === "png") pngOf(cs, Array.from({ length: 256 }, function (x, i) { return i; }), 16, sc, baseName(cs) + ".png");
      else if (a === "bin") saveBlob(baseName(cs) + ".bin", new Blob([allBytes(cs)], { type: "application/octet-stream" }));
      else if (a === "prg") {
        var d = allBytes(cs), out = new Uint8Array(2050), la = cs.rom ? 0xD000 + cs.romOff : cs.addr;
        out[0] = la & 0xFF; out[1] = la >> 8; out.set(d, 2);
        saveBlob(baseName(cs) + ".64c", new Blob([out], { type: "application/octet-stream" }));
      }
      else if (a === "asm") saveBlob(baseName(cs) + ".asm", new Blob([asmOf(cs, Array.from({ length: 256 }, function (x, i) { return i; }))], { type: "text/plain" }));
      else if (sel >= 0 && a === "png1") pngOf(cs, [sel], 1, sc, baseName(cs) + "-" + hex(sel, 2).toLowerCase() + ".png");
      else if (sel >= 0 && a === "bin1") saveBlob(baseName(cs) + "-" + hex(sel, 2).toLowerCase() + ".bin", new Blob([glyph(cs, sel)], { type: "application/octet-stream" }));
      else if (sel >= 0 && a === "copy1") {
        var text = asmOf(cs, [sel]);
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { say("Copied to the clipboard."); }, function () { say("The browser did not allow copying."); });
        else say("The browser did not allow copying.");
      }
    });
    root.addEventListener("change", function (e) {
      var t = e.target, a = t.getAttribute("data-cact");
      if (a === "marks") opt.marks = t.checked;
      else if (a && mem[a] !== undefined) mem[a] = +t.value;
      else if (t.id === "chr-scale") opt.scale = +t.value;
      else if (t.id === "chr-transp") opt.transparent = t.checked;
      else return;
      persist(); render();
    });
    el.grid.addEventListener("click", function (e) {
      var r = el.grid.getBoundingClientRect();
      var x = (e.clientX - r.left) * el.grid.width / r.width, y = (e.clientY - r.top) * el.grid.height / r.height;
      var code = Math.floor(y / CELL) * 16 + Math.floor(x / CELL);
      if (code < 0 || code > 255) return;
      sel = code; renderGrid(); renderDetail();
    });
    // keyboard: arrows move the selection in the grid
    el.grid.tabIndex = 0;
    el.grid.addEventListener("keydown", function (e) {
      var d = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 16, ArrowUp: -16 }[e.key];
      if (!d) return;
      e.preventDefault();
      sel = ((sel < 0 ? 0 : sel + d) + 256) % 256; renderGrid(); renderDetail();
    });

    setInterval(function () {
      if (!open || !c64) return;
      if (!c64.vic.chrTrace) trace(true);              // a reset switched it off
      if (tab === "use" && !frozen) {
        segs = c64.vic.chrFrame.slice();
        if (seg >= segs.length) seg = 0;
      }
      renderSegs(); renderGrid(); renderDetail();
    }, 400);

    function setOpen(on) {
      open = on;
      root.hidden = !on;
      document.querySelector(".app").classList.toggle("charsetting", on);
      trace(on);
      if (on && c64) { segs = c64.vic.chrFrame.slice(); render(); }
    }
    return { attach: attach, setOpen: setOpen, isOpen: function () { return open; } };
  };
})();
