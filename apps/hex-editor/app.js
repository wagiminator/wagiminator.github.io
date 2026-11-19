/* Hex Editor: the user interface */
(function () {
  "use strict";
  var HX = window.HX, $ = function (id) { return document.getElementById(id); }, hexN = HX.hexN, h2 = HX.hex2;

  var st = { name: "", img: null, file: null, origFile: null, view: "image", le: true, include: [], fileRegions: null };
  var S = { width: 16, fmt: "hex", rl: 16, fill: "FF", fam: "", how: "auto", base: "0" };
  if (window.innerWidth < 600) S.width = 8;
  try { Object.assign(S, JSON.parse(localStorage.getItem("hexed.settings")) || {}); } catch (e) { /* defaults */ }
  function save() { try { localStorage.setItem("hexed.settings", JSON.stringify(S)); } catch (e) { /* not kept */ } }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function info(html, err) { $("info").innerHTML = html; $("info").className = "info" + (err ? " err" : ""); }
  function addr(a) { return "0x" + hexN(a, grid.addrDigits); }
  // "0x0800 0000", "8000000h", "#1024" (decimal) → number
  function parseAddr(s) {
    s = String(s).trim().replace(/[\s_]/g, "");
    if (!s) return NaN;
    if (s[0] === "#") return /^#\d+$/.test(s) ? parseInt(s.slice(1), 10) : NaN;
    s = s.replace(/^0x/i, "").replace(/h$/i, "");
    return /^[0-9a-f]+$/i.test(s) ? parseInt(s, 16) : NaN;
  }
  function parseBytes(s) {
    s = s.replace(/0x/gi, "").replace(/[\s,;:-]/g, "");
    if (!s || s.length % 2) return null;
    var out = [];
    for (var i = 0; i < s.length; i += 2) {
      var p = s.substr(i, 2);
      if (p === "??") out.push(-1); else if (/^[0-9a-f]{2}$/i.test(p)) out.push(parseInt(p, 16)); else return null;
    }
    return out;
  }

  var grid = new HX.Grid($("grid"), { onCursor: cursorUi, onChange: changeUi });
  grid.W = S.width;

  // ================================================================ opening
  async function openFile(f) {
    try {
      var u8 = new Uint8Array(await f.arrayBuffer());
      var base = parseAddr(S.base);
      var img = HX.read(f.name, u8, S.how, isFinite(base) ? base : 0);
      st.name = f.name; st.img = img; st.view = "image"; st.fileRegions = null;
      if (img.info.elf) { st.file = u8; st.origFile = u8.slice(); img.regions.forEach(function (r) { r.orig = st.origFile.subarray(r.fileOff, r.fileOff + r.data.length); }); }
      else { st.file = null; st.origFile = null; }
      st.include = img.regions.map(function () { return true; });
      grid.marks = {};
      (img.symbols || []).forEach(function (s) { if (!grid.marks[s.lma]) grid.marks[s.lma] = s.name; });
      grid.setRegions(img.regions);
      $("empty").hidden = !!img.regions.length;
      if (!S.fmt || (S.fmt === "elf" && !img.info.elf)) S.fmt = "hex";
      if (img.info.format === "UF2" && img.info.family != null) S.fam = String(img.info.family);
      fileUi(); listsUi(); saveUi();
      grid.el.focus();
      if (!img.regions.length) info("<b>" + esc(f.name) + "</b>: no loadable bytes found.", true);
    } catch (e) {
      info("Cannot read " + esc(f.name) + ": " + esc(e.message) + (e.format ? ". Choose <i>Read as Binary</i> to see the bytes." : "."), true);
    }
  }
  function fileUi() {
    var img = st.img; if (!img) return;
    var total = 0; img.regions.forEach(function (r) { total += r.data.length; });
    var mod = grid.modified();
    var parts = ["<b>" + esc(st.name) + "</b>", esc(img.info.format) + (img.info.machine ? ", " + esc(img.info.machine) : "") + (img.info.familyName ? ", " + esc(img.info.familyName) : ""),
      total.toLocaleString("en") + " bytes in " + img.regions.length + " region" + (img.regions.length === 1 ? "" : "s")];
    if (img.regions.length) parts.push(addr(grid.first()) + " – " + addr(grid.last()));
    if (img.start != null) parts.push("entry " + addr(img.start));
    if (st.view === "file") parts.push("showing the ELF file");
    if (mod) parts.push('<span class="mod">' + mod.toLocaleString("en") + " byte" + (mod === 1 ? "" : "s") + " changed</span>");
    info(parts.join(" · "));
    $("view-seg").hidden = !img.info.elf;
    $("v-image").setAttribute("aria-pressed", String(st.view === "image"));
    $("v-file").setAttribute("aria-pressed", String(st.view === "file"));
  }
  $("btn-open").addEventListener("click", function () { $("file").click(); });
  $("file").addEventListener("change", function () { if (this.files[0]) openFile(this.files[0]); this.value = ""; });
  var dc = 0;
  document.addEventListener("dragenter", function (e) { if (e.dataTransfer && Array.from(e.dataTransfer.types).indexOf("Files") >= 0) { dc++; document.body.classList.add("dragging"); } });
  document.addEventListener("dragleave", function () { if (--dc <= 0) { dc = 0; document.body.classList.remove("dragging"); } });
  document.addEventListener("dragover", function (e) { e.preventDefault(); });
  document.addEventListener("drop", function (e) { e.preventDefault(); dc = 0; document.body.classList.remove("dragging"); var f = e.dataTransfer.files[0]; if (f) openFile(f); });
  $("how").value = S.how; $("base").value = S.base;
  function howUi() { $("base-f").hidden = false; }
  $("how").addEventListener("change", function () { S.how = this.value; save(); howUi(); });
  $("base").addEventListener("input", function () { S.base = this.value; save(); this.classList.toggle("bad", !isFinite(parseAddr(this.value))); });

  // ELF: image or file
  function setView(v) {
    if (!st.img || !st.img.info.elf || v === st.view) return;
    var u = grid.undoS, r = grid.redoS;
    st.view = v;
    if (v === "file") {
      if (!st.fileRegions) st.fileRegions = [{ addr: 0, data: st.file, orig: st.origFile, name: "ELF file" }];
      grid.setRegions(st.fileRegions);
    } else grid.setRegions(st.img.regions);
    grid.undoS = u; grid.redoS = r;
    fileUi(); listsUi(); saveUi(); cursorUi();
  }
  $("v-image").addEventListener("click", function () { setView("image"); });
  $("v-file").addEventListener("click", function () { setView("file"); });
  $("width").value = S.width;
  $("width").addEventListener("change", function () { S.width = +this.value; save(); grid.setWidth(S.width); });

  // ================================================================ status, inspector, checksums
  function regionName(a) { var r = grid.regionAt(a); return r ? r.name || "" : ""; }
  function symbolAt(a) {
    var syms = st.img && st.view === "image" ? st.img.symbols : null;
    if (!syms || !syms.length) return null;
    var best = null;
    syms.forEach(function (s) { if (s.lma <= a && (!best || s.lma > best.lma)) best = s; });
    if (!best || (best.size && a >= best.lma + best.size) || a - best.lma > 0x10000) return null;
    return best.name + (a > best.lma ? "+0x" + (a - best.lma).toString(16) : "");
  }
  function cursorUi() {
    if (grid.cur == null) { $("status").textContent = ""; inspector(); sums(); return; }
    var s = grid.sel(), n = grid.count(s[0], s[1]), sy = symbolAt(grid.cur);
    $("status").textContent = addr(grid.cur) + (st.view === "file" ? "" : "  " + regionName(grid.cur)) + (sy ? "  <" + sy + ">" : "") +
      (n > 1 ? "   selected " + addr(s[0]) + " – " + addr(s[1]) + ", " + n.toLocaleString("en") + " bytes" : "") + (grid.nib ? "   (second digit)" : "");
    $("btn-fill").disabled = n < 1;
    $("undo").disabled = !grid.undoS.length; $("redo").disabled = !grid.redoS.length;
    inspector(); sumsSoon();
  }
  function changeUi() { fileUi(); $("undo").disabled = !grid.undoS.length; $("redo").disabled = !grid.redoS.length; }
  function inspector() {
    var a = grid.cur, rows = [];
    if (a == null) { $("inspector").innerHTML = ""; return; }
    var bytes = [];
    for (var i = 0; i < 8; i++) { var v = grid.get(a + i); if (v === undefined) break; bytes.push(v); }
    var buf = new Uint8Array(8); buf.set(bytes); var dv = new DataView(buf.buffer), le = st.le, n = bytes.length;
    rows.push(["Byte", "0x" + h2(bytes[0]) + " · " + bytes[0] + " · " + bytes[0].toString(2).padStart(8, "0")]);
    rows.push(["int8", (bytes[0] << 24 >> 24)]);
    if (n >= 2) { rows.push(["uint16", dv.getUint16(0, le) + " · 0x" + hexN(dv.getUint16(0, le), 4)]); rows.push(["int16", dv.getInt16(0, le)]); }
    if (n >= 4) { rows.push(["uint32", dv.getUint32(0, le) + " · 0x" + hexN(dv.getUint32(0, le), 8)]); rows.push(["int32", dv.getInt32(0, le)]); rows.push(["float", +dv.getFloat32(0, le).toPrecision(8)]); }
    if (n >= 8) { rows.push(["uint64", dv.getBigUint64(0, le).toString()]); rows.push(["double", +dv.getFloat64(0, le).toPrecision(15)]); }
    var txt = "";
    for (var k = 0; k < 24; k++) { var c = grid.get(a + k); if (c === undefined || c === 0) break; txt += c >= 32 && c < 127 ? String.fromCharCode(c) : "·"; }
    rows.push(["Text", txt ? "“" + txt + "”" : "–"]);
    if (n >= 4 && st.img && st.img.symbols && st.view === "image") {
      var p = dv.getUint32(0, le), s2 = st.img.symbols.filter(function (s) { return s.lma === (p & ~1) || s.value === (p & ~1); })[0];
      if (s2) rows.push(["Points to", s2.name]);
    }
    $("inspector").innerHTML = rows.map(function (r) { return "<tr><td>" + r[0] + "</td><td>" + esc(r[1]) + "</td></tr>"; }).join("");
  }
  $("le").addEventListener("click", function () { st.le = true; this.setAttribute("aria-pressed", "true"); $("be").setAttribute("aria-pressed", "false"); inspector(); });
  $("be").addEventListener("click", function () { st.le = false; this.setAttribute("aria-pressed", "true"); $("le").setAttribute("aria-pressed", "false"); inspector(); });

  var CRC32 = (function () { var t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function sumPieces() {
    var s = grid.sel();
    if (s && grid.count(s[0], s[1]) > 1) return { what: "Selection, " + grid.count(s[0], s[1]).toLocaleString("en") + " bytes", pieces: grid.pieces(s[0], s[1]) };
    var regs = exportRegions(), n = 0; regs.forEach(function (r) { n += r.data.length; });
    return { what: (st.view === "file" ? "The whole file" : "All ticked regions") + ", " + n.toLocaleString("en") + " bytes", pieces: regs };
  }
  var sT = null, sN = 0;
  function sumsSoon() { clearTimeout(sT); sT = setTimeout(sums, 120); }
  async function sums() {
    if (!grid.regions.length) { $("sums").innerHTML = ""; $("sum-what").textContent = ""; return; }
    var my = ++sN, sp = sumPieces(), c32 = 0xFFFFFFFF, ccitt = 0xFFFF, modbus = 0xFFFF, c8 = 0, add = 0, x = 0, len = 0;
    sp.pieces.forEach(function (p) {
      var d = p.data;
      for (var i = 0; i < d.length; i++) {
        var v = d[i];
        c32 = CRC32[(c32 ^ v) & 255] ^ (c32 >>> 8);
        ccitt ^= v << 8; for (var k = 0; k < 8; k++) ccitt = ccitt & 0x8000 ? ((ccitt << 1) ^ 0x1021) & 0xFFFF : (ccitt << 1) & 0xFFFF;
        modbus ^= v; for (var j = 0; j < 8; j++) modbus = modbus & 1 ? (modbus >>> 1) ^ 0xA001 : modbus >>> 1;
        c8 ^= v; for (var m = 0; m < 8; m++) c8 = c8 & 0x80 ? ((c8 << 1) ^ 0x07) & 255 : (c8 << 1) & 255;
        add = (add + v) >>> 0; x ^= v;
      }
      len += d.length;
    });
    c32 = (c32 ^ 0xFFFFFFFF) >>> 0;
    var rows = [["CRC-32", hexN(c32, 8)], ["CRC-16/CCITT-FALSE", hexN(ccitt, 4)], ["CRC-16/MODBUS", hexN(modbus, 4)], ["CRC-8", h2(c8)],
      ["Sum (8 bit)", h2(add & 255)], ["Two's complement", h2((256 - (add & 255)) & 255)], ["Sum (32 bit)", hexN(add, 8)], ["XOR", h2(x)]];
    $("sum-what").textContent = sp.what;
    $("sums").innerHTML = rows.map(function (r) { return "<tr><td>" + r[0] + "</td><td>" + r[1] + "</td></tr>"; }).join("") + '<tr><td>SHA-256</td><td id="sha">…</td></tr>';
    if (window.crypto && crypto.subtle && len <= 256e6) {
      var all = new Uint8Array(len), o = 0;
      sp.pieces.forEach(function (p) { all.set(p.data, o); o += p.data.length; });
      try {
        var h = new Uint8Array(await crypto.subtle.digest("SHA-256", all));
        if (my === sN) $("sha").textContent = Array.from(h).map(h2).join("").toLowerCase();
      } catch (e) { if (my === sN) $("sha").textContent = "–"; }
    } else $("sha").textContent = "–";
  }

  // ================================================================ lists
  function listsUi() {
    var img = st.img;
    // regions
    var regs = st.view === "file" ? st.fileRegions : img.regions;
    $("regions").innerHTML = regs.map(function (r, i) {
      return '<li><input type="checkbox" data-i="' + i + '"' + (st.view === "file" || st.include[i] ? " checked" : "") + (st.view === "file" ? " disabled" : "") + ' aria-label="Save this region"><button type="button" data-go="' + r.addr + '">' + esc(r.name || "Region " + (i + 1)) + '</button><span class="a">' + hexN(r.addr, grid.addrDigits) + " · " + r.data.length.toLocaleString("en") + "</span></li>";
    }).join("");
    // sections
    var secs = img.sections || [];
    $("sec-panel").hidden = !secs.length;
    if (secs.length) {
      $("sections").innerHTML = "<tr><th>Name</th><th>Address</th><th>Load</th><th>Size</th><th></th></tr>" + secs.map(function (s) {
        var fl = (s.flags & 2 ? "A" : "") + (s.flags & 1 ? "W" : "") + (s.flags & 4 ? "X" : "");
        var go = st.view === "file" ? (s.type !== 8 && s.size ? s.offset : null) : ((s.flags & 2) && s.type !== 8 && s.size ? s.lma : null);
        return "<tr" + (go != null ? ' data-a="' + go + '"' + (st.view === "file" ? "" : "") : "") + "><td>" + esc(s.name) + "</td><td>" + hexN(s.addr, 8) + "</td><td>" + (s.lma !== s.addr ? hexN(s.lma, 8) : "") + "</td><td>" + s.size.toLocaleString("en") + "</td><td>" + fl + (s.type === 8 ? " bss" : "") + "</td></tr>";
      }).join("");
    }
    // symbols
    var syms = img.symbols || [];
    $("sym-panel").hidden = !syms.length;
    $("sym-list").innerHTML = syms.slice(0, 3000).map(function (s) { return '<option value="' + esc(s.name) + '">'; }).join("");
    symbolsUi();
  }
  function symbolsUi() {
    var syms = (st.img && st.img.symbols) || [], f = $("sym-filter").value.trim().toLowerCase();
    var list = syms.filter(function (s) { return !f || s.name.toLowerCase().indexOf(f) >= 0; });
    var shown = list.slice(0, 1500);
    $("symbols").innerHTML = shown.map(function (s) {
      var inImg = !!grid.regionAt(s.lma) && st.view === "image";
      return "<li>" + (inImg ? '<button type="button" data-go="' + s.lma + '"' + (s.size > 1 ? ' data-len="' + s.size + '"' : "") + ">" + esc(s.name) + "</button>" : '<span class="nb">' + esc(s.name) + "</span>") +
        '<span class="t">' + s.type + '</span><span class="a">' + hexN(s.value, 8) + "</span></li>";
    }).join("") + (list.length > shown.length ? '<li class="t">… ' + (list.length - shown.length) + " more, use the filter</li>" : "");
  }
  $("sym-filter").addEventListener("input", symbolsUi);
  document.querySelector(".side").addEventListener("click", function (e) {
    var b = e.target.closest("[data-go]");
    if (b) { var a = +b.dataset.go, len = +b.dataset.len || 0; if (len) grid.select(a + len - 1, a); else grid.goto(a); grid.reveal(a, true); grid.render(); grid.el.focus(); return; }
    var tr = e.target.closest("tr[data-a]");
    if (tr) { grid.goto(+tr.dataset.a); grid.reveal(+tr.dataset.a, true); grid.render(); grid.el.focus(); }
  });
  $("regions").addEventListener("change", function (e) { var c = e.target.closest("input[data-i]"); if (c) { st.include[+c.dataset.i] = c.checked; saveUi(); sumsSoon(); } });

  // ================================================================ go to, find, fill, undo
  $("goto-f").addEventListener("submit", function (e) {
    e.preventDefault();
    var v = $("goto").value.trim(), syms = (st.img && st.img.symbols) || [];
    var s = syms.filter(function (x) { return x.name === v; })[0] || syms.filter(function (x) { return x.name.toLowerCase() === v.toLowerCase(); })[0];
    var a = s && st.view === "image" ? s.lma : parseAddr(v);
    if (!isFinite(a) || !grid.regions.length) { $("goto").classList.add("bad"); return; }
    $("goto").classList.remove("bad");
    if (!grid.regionAt(a)) $("status").textContent = addr(a) + " holds no byte; went to the nearest one.";
    if (s && s.size > 1 && st.view === "image") grid.select(a + s.size - 1, a); else grid.goto(a);
    grid.reveal(grid.cur, true); grid.render(); grid.el.focus();
  });
  $("goto").addEventListener("input", function () { this.classList.remove("bad"); });
  function pattern() {
    var v = $("find").value;
    if ($("find-mode").value === "text") return v ? Array.from(new TextEncoder().encode(v)) : null;
    return parseBytes(v);
  }
  function find(dir) {
    var p = pattern();
    $("find").classList.toggle("bad", !p);
    if (!p || !grid.regions.length) return;
    var R = grid.regions, from = grid.cur == null ? grid.first() : grid.cur + (dir > 0 ? 1 : -1), hits = [];
    var match = function (d, i) { for (var k = 0; k < p.length; k++) if (p[k] >= 0 && d[i + k] !== p[k]) return false; return true; };
    var found = null;
    var order = R.map(function (r, i) { return i; });
    if (dir < 0) order.reverse();
    // two passes: from the cursor to the end, then around
    for (var pass = 0; pass < 2 && found === null; pass++) {
      for (var oi = 0; oi < order.length && found === null; oi++) {
        var r = R[order[oi]], d = r.data, last = d.length - p.length;
        if (dir > 0) {
          var s = pass === 0 ? Math.max(0, from - r.addr) : 0, e = pass === 0 ? last : Math.min(last, from - r.addr - 1);
          for (var i = s; i <= e; i++) if (match(d, i)) { found = r.addr + i; break; }
        } else {
          var s2 = pass === 0 ? Math.min(last, from - r.addr) : last, e2 = pass === 0 ? 0 : Math.max(0, from - r.addr + 1);
          for (var j = s2; j >= e2; j--) if (match(d, j)) { found = r.addr + j; break; }
        }
      }
    }
    void hits;
    if (found === null) { $("status").textContent = "Not found."; return; }
    grid.select(found + p.length - 1, found); grid.el.focus();
  }
  $("find-f").addEventListener("submit", function (e) { e.preventDefault(); find(1); });
  $("find-prev").addEventListener("click", function () { find(-1); });
  $("find").addEventListener("input", function () { this.classList.remove("bad"); });
  $("fill-f").addEventListener("submit", function (e) {
    e.preventDefault();
    var b = parseBytes($("fill").value), s = grid.sel();
    $("fill").classList.toggle("bad", !b || b.indexOf(-1) >= 0);
    if (!b || b.indexOf(-1) >= 0 || !s) return;
    var a = grid.cur, an = grid.anchor;
    grid.pieces(s[0], s[1]).forEach(function (p) {
      var out = new Uint8Array(p.data.length);
      for (var i = 0; i < out.length; i++) out[i] = b[(p.addr + i - s[0]) % b.length];
      grid.write(p.addr, out, "fill");
    });
    grid.cur = a; grid.anchor = an; grid.render(); cursorUi(); grid.el.focus();
  });
  $("undo").addEventListener("click", function () { grid.undo(); grid.el.focus(); });
  $("redo").addEventListener("click", function () { grid.redo(); grid.el.focus(); });
  // copy and paste
  document.addEventListener("copy", function (e) {
    if (document.activeElement !== grid.el || grid.cur == null) return;
    var s = grid.sel(), out = [];
    grid.pieces(s[0], s[1]).forEach(function (p) { for (var i = 0; i < p.data.length; i++) out.push(p.data[i]); });
    var t = grid.pane === "text" ? out.map(function (v) { return v >= 32 && v < 127 ? String.fromCharCode(v) : "."; }).join("") : out.map(h2).join(" ");
    e.clipboardData.setData("text/plain", t); e.preventDefault();
    $("status").textContent = "Copied " + out.length.toLocaleString("en") + " bytes" + (grid.pane === "text" ? " as text." : " as hex.");
  });
  document.addEventListener("paste", function (e) {
    if (document.activeElement !== grid.el || grid.cur == null) return;
    var t = e.clipboardData.getData("text/plain"), b = grid.pane === "text" ? Array.from(new TextEncoder().encode(t)) : parseBytes(t);
    e.preventDefault();
    if (!b || b.indexOf(-1) >= 0) { $("status").textContent = "The clipboard holds no hex bytes."; return; }
    var a = Math.min(grid.cur, grid.anchor), n = grid.write(a, b, "paste");
    grid.select(a, a + b.length - 1);
    $("status").textContent = "Pasted " + b.length.toLocaleString("en") + " bytes (" + n + " changed).";
  });

  // ================================================================ saving
  function exportRegions() {
    if (!st.img) return [];
    if (st.view === "file") return st.fileRegions;
    return st.img.regions.filter(function (r, i) { return st.include[i]; });
  }
  function famOptions() {
    var html = '<option value="">No family</option>';
    Object.keys(HX.UF2_FAMILIES).forEach(function (k) { html += '<option value="' + k + '">' + HX.UF2_FAMILIES[k] + " (0x" + hexN(+k, 8) + ")</option>"; });
    $("opt-fam").innerHTML = html;
  }
  function saveUi() {
    var has = !!(st.img && st.img.regions.length), elf = !!(st.img && st.img.info.elf);
    $("fmt").querySelector('option[value="elf"]').disabled = !elf;
    if (S.fmt === "elf" && !elf) S.fmt = "hex";
    $("fmt").value = S.fmt; $("opt-rl").value = S.rl; $("opt-fill").value = S.fill; $("opt-fam").value = S.fam;
    $("opt-fill-f").hidden = S.fmt !== "bin";
    $("opt-rl-f").hidden = S.fmt !== "hex" && S.fmt !== "srec";
    $("opt-fam-f").hidden = S.fmt !== "uf2";
    $("opt-sel-f").hidden = S.fmt === "elf";
    $("btn-save").disabled = !has || (S.fmt !== "elf" && !exportRegions().length);
  }
  $("fmt").addEventListener("change", function () { S.fmt = this.value; save(); saveUi(); });
  $("opt-rl").addEventListener("change", function () { S.rl = +this.value; save(); });
  $("opt-fill").addEventListener("input", function () { S.fill = this.value; save(); this.classList.toggle("bad", !/^[0-9a-f]{1,2}$/i.test(this.value.trim())); });
  $("opt-fam").addEventListener("change", function () { S.fam = this.value; save(); });
  function download(name, data, type) {
    var a = document.createElement("a"), url = URL.createObjectURL(new Blob([data], { type: type || "application/octet-stream" }));
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }
  $("btn-save").addEventListener("click", function () {
    var stem = st.name.replace(/\.[^.]+$/, ""), regs = exportRegions();
    if ($("opt-sel").checked && S.fmt !== "elf") { var s = grid.sel(); regs = grid.pieces(s[0], s[1]); }
    if (S.fmt === "elf") { download(st.name, st.file); info("Saved " + esc(st.name) + " with " + grid.modified() + " changed bytes."); return; }
    if (!regs.length) return;
    var start = st.view === "image" && st.img ? st.img.start : null, out, name;
    if (S.fmt === "bin") {
      var fill = parseInt(S.fill, 16); if (!(fill >= 0 && fill <= 255)) fill = 0xFF;
      var lo = regs[0].addr, hi = 0;
      regs.forEach(function (r) { lo = Math.min(lo, r.addr); hi = Math.max(hi, r.addr + r.data.length); });
      if (hi - lo > 256e6) { info("The binary would be " + ((hi - lo) / 1e6).toFixed(0) + " MB because of the gaps between the regions; untick the regions far away.", true); return; }
      out = new Uint8Array(hi - lo).fill(fill);
      regs.forEach(function (r) { out.set(r.data, r.addr - lo); });
      name = stem + ".bin";
      info("Saved " + name + ": " + out.length.toLocaleString("en") + " bytes from " + addr(lo) + ".");
    } else if (S.fmt === "hex") { out = HX.writeHex(regs, { recordLength: S.rl, start: start }); name = stem + ".hex"; info("Saved " + name + "."); }
    else if (S.fmt === "srec") { out = HX.writeSrec(regs, { recordLength: S.rl, start: start, header: stem }); name = stem + ".srec"; info("Saved " + name + "."); }
    else { out = HX.writeUf2(regs, { family: S.fam === "" ? null : +S.fam }); name = stem + ".uf2"; info("Saved " + name + ": " + (out.length / 512) + " blocks."); }
    download(name, out, typeof out === "string" ? "text/plain" : undefined);
  });

  // ================================================================ start
  famOptions(); howUi(); saveUi(); cursorUi();
  window.addEventListener("beforeunload", function (e) { if (st.img && grid.modified()) { e.preventDefault(); e.returnValue = ""; } });
  window.HEXAPP = { st: st, grid: grid };
})();
