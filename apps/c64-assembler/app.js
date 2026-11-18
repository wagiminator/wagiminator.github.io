/* C64 Assembler: the user interface */
(function () {
  "use strict";

  var A = window.Asm6502, M = window.Machine, EX = window.AsmExamples;
  var $ = function (id) { return document.getElementById(id); };
  var KEY = "c64asm.project", BACKUP = "c64asm.backup";

  function hex(v, n) { return ("000" + (v >>> 0).toString(16).toUpperCase()).slice(-(n || 4)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function b64(bytes) { var s = ""; for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return btoa(s); }
  function unb64(s) { var b = atob(s), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
  function download(name, data, type) {
    var blob = new Blob([data], { type: type || "application/octet-stream" });
    var url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
  }
  function base() { return (st.p.name || "program").trim().replace(/[^\w\- ]+/g, "").replace(/\s+/g, "-").toLowerCase() || "program"; }

  // ---------------------------------------------------------------- the project
  // { name, files: [{ name, text } or { name, data: Uint8Array }] }; the first text file is the main file
  var st = { p: null, active: 0, result: null, breaks: {}, lineAddr: {}, addrLine: {}, symAt: {}, tab: "msg" };

  function newProject(example) {
    var ex = example || EX[0];
    return { name: ex.name, files: [{ name: "main.asm", text: ex.text }] };
  }
  function toJSON(p) {
    return JSON.stringify({
      format: "c64-assembler", version: 1, name: p.name,
      files: p.files.map(function (f) { return f.data ? { name: f.name, data: b64(f.data) } : { name: f.name, text: f.text }; })
    });
  }
  function fromJSON(t) {
    var d = JSON.parse(t);
    if (!d || d.format !== "c64-assembler" || !Array.isArray(d.files)) throw new Error("This is not a project of the C64 Assembler.");
    var p = { name: String(d.name || "Project").slice(0, 40), files: [] };
    d.files.forEach(function (f) {
      if (!f || !f.name) return;
      if (f.data != null) p.files.push({ name: String(f.name), data: unb64(f.data) });
      else p.files.push({ name: String(f.name), text: String(f.text || "") });
    });
    if (!p.files.some(function (f) { return f.text != null; })) p.files.unshift({ name: "main.asm", text: "" });
    return p;
  }
  var saveTimer = null;
  function changed() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 800); }
  function save() {
    syncEditor();
    try { localStorage.setItem(KEY, toJSON(st.p)); say("Saved in this browser"); } catch (e) { say("The browser storage is full: save the project as a file."); }
  }
  var sayTimer = null;
  function say(t, keep) {
    var el = $("saved");
    el.innerHTML = ""; el.textContent = t;
    clearTimeout(sayTimer);
    if (!keep) sayTimer = setTimeout(function () { el.textContent = ""; }, 2500);
  }
  // replace the project, and keep the old one for a while
  function replaceProject(p, what) {
    syncEditor();
    try { localStorage.setItem(BACKUP, toJSON(st.p)); } catch (e) { /* ignore */ }
    st.p = p; st.active = 0; st.breaks = {}; st.result = null; st.edFile = null;
    showProject();
    save();
    var el = $("saved");
    el.textContent = what + " ";
    var b = document.createElement("button");
    b.type = "button"; b.className = "btn sm"; b.textContent = "Bring back the project before";
    b.addEventListener("click", function () {
      try { var old = fromJSON(localStorage.getItem(BACKUP)); st.edFile = null; st.p = old; st.active = 0; st.breaks = {}; showProject(); save(); } catch (e) { /* ignore */ }
    });
    el.appendChild(b);
    clearTimeout(sayTimer);
    sayTimer = setTimeout(function () { el.textContent = ""; }, 15000);
  }

  // ---------------------------------------------------------------- files and the editor
  var ed = new CodeEditor($("editor"), {
    onChange: function () { changed(); dirtyAsm(); },
    onCaret: function (l, c) { $("caret").textContent = "Line " + l + ", column " + c; },
    onGutter: toggleBreak
  });
  function cur() { return st.p.files[st.active]; }
  function mainFile() { return st.p.files.filter(function (f) { return f.text != null; })[0]; }
  // the file the editor shows gets the text back
  function syncEditor() { var f = st.edFile; if (f && f.text != null && st.p && st.p.files.indexOf(f) >= 0) f.text = ed.getText(); }
  function showProject() {
    $("p-name").value = st.p.name;
    renderTabs();
    openFile(Math.min(st.active, st.p.files.length - 1), true);
    clearOutput();
  }
  function renderTabs() {
    var box = $("tabs"), html = "", main = mainFile();
    st.p.files.forEach(function (f, i) {
      html += '<button type="button" role="tab" class="tab' + (i === st.active ? " on" : "") + '" data-i="' + i + '" aria-selected="' + (i === st.active) + '"' +
        ' title="' + (f === main ? "Main file: assembling starts here" : f.data ? "Binary file (.binary)" : "Double click to rename") + '">' +
        (f === main ? '<span class="main" aria-hidden="true">★</span>' : "") + esc(f.name) +
        (st.p.files.length > 1 ? '<span class="x" data-x="' + i + '" role="button" aria-label="Close ' + esc(f.name) + '">✕</span>' : "") + "</button>";
    });
    html += '<button type="button" class="tab add" id="tab-add" title="A new source file">+</button>';
    box.innerHTML = html;
  }
  function openFile(i, force) {
    if (i === st.active && !force) return;
    syncEditor();
    st.active = i;
    var f = cur();
    renderTabs();
    if (f.data) {
      st.edFile = null;
      $("editor").hidden = true; $("bin-view").hidden = false;
      var rows = [];
      for (var k = 0; k < Math.min(f.data.length, 512); k += 16) {
        var bytes = Array.prototype.slice.call(f.data.subarray(k, k + 16)).map(function (b) { return hex(b, 2); }).join(" ");
        rows.push(hex(k, 4) + "  " + bytes);
      }
      $("bin-view").innerHTML = "<p>A binary file of " + f.data.length.toLocaleString("en") + " bytes. Put it into the program with <code>.binary \"" + esc(f.name) + "\"</code> (optionally with an offset and a length).</p><pre>" + esc(rows.join("\n")) + (f.data.length > 512 ? "\n…" : "") + "</pre>";
    } else {
      $("editor").hidden = false; $("bin-view").hidden = true;
      ed.setText(f.text);
      st.edFile = f;
      markEditor();
    }
  }
  $("tabs").addEventListener("click", function (e) {
    var x = e.target.closest("[data-x]");
    if (x) { closeFile(+x.getAttribute("data-x")); return; }
    if (e.target.closest("#tab-add")) { addFile(); return; }
    var t = e.target.closest("[data-i]");
    if (t) openFile(+t.getAttribute("data-i"));
  });
  $("tabs").addEventListener("dblclick", function (e) {
    var t = e.target.closest("[data-i]"); if (!t) return;
    var i = +t.getAttribute("data-i"), f = st.p.files[i];
    var n = prompt("New name for " + f.name, f.name);
    if (!n || n === f.name) return;
    if (st.p.files.some(function (g) { return g.name === n; })) { say("There is already a file " + n); return; }
    f.name = n.trim(); renderTabs(); changed();
  });
  function addFile() {
    var n = 1, name;
    do { name = "file" + n + ".asm"; n++; } while (st.p.files.some(function (f) { return f.name === name; }));
    syncEditor();
    st.p.files.push({ name: name, text: "; " + name + ": put it into the main file with  .include \"" + name + "\"\n" });
    openFile(st.p.files.length - 1, true);
    changed();
  }
  function closeFile(i) {
    var f = st.p.files[i];
    if (st.p.files.length < 2) return;
    if (f.text && f.text.trim() && !confirm("Remove " + f.name + " from the project?")) return;
    syncEditor();
    st.p.files.splice(i, 1);
    delete st.breaks[f.name];
    if (!mainFile()) st.p.files.unshift({ name: "main.asm", text: "" });
    st.active = Math.min(st.active >= i ? Math.max(0, st.active - 1) : st.active, st.p.files.length - 1);
    openFile(st.active, true);
    changed();
  }
  $("p-name").addEventListener("input", function () { st.p.name = $("p-name").value; changed(); });

  // ---------------------------------------------------------------- assembling
  var asmDirty = true;
  function dirtyAsm() { asmDirty = true; }
  function assemble() {
    syncEditor();
    var files = {}, main = mainFile();
    st.p.files.forEach(function (f) { files[f.name] = f.data || f.text; });
    var t0 = performance.now(), r;
    try { r = A.assemble(files, main.name); }
    catch (e) { r = { errors: [{ file: main.name, line: 1, msg: e.message }], warnings: [], symbols: [], listing: [] }; }
    r.ms = performance.now() - t0;
    st.result = r; asmDirty = false;
    // which address belongs to which line, and back
    st.lineAddr = {}; st.addrLine = {};
    (r.listing || []).forEach(function (l) {
      if (l.pc == null || !l.bytes || !l.bytes.length) return;
      var m = st.lineAddr[l.file] || (st.lineAddr[l.file] = {});
      if (m[l.line] == null) m[l.line] = l.pc;
      if (!st.addrLine[l.pc]) st.addrLine[l.pc] = { file: l.file, line: l.line };
    });
    st.symAt = {};
    (r.symbols || []).forEach(function (s) { if (s.kind === "label" && st.symAt[s.value] == null && s.name.indexOf(".") < 0) st.symAt[s.value] = s.name; });
    showMessages();
    markEditor();
    renderLabels();
    renderListing();
    applyBreaks();
    return r;
  }
  function showMessages() {
    var r = st.result, ul = $("msgs"), html = "";
    r.errors.forEach(function (e) { html += msgLi("m-err", e); });
    r.warnings.forEach(function (e) { html += msgLi("m-warn", e); });
    if (!r.errors.length) {
      if (r.empty) html += '<li class="m-info">The program has no bytes yet.</li>';
      else {
        var segs = r.segments.map(function (s) { return "$" + hex(s[0]) + "–$" + hex(s[1] - 1); }).join(", ");
        html += '<li class="m-ok">Assembled: ' + (r.end - r.start).toLocaleString("en") + " bytes at " + segs + "</li>";
        html += '<li class="m-info">Starts with ' + (r.run.mode === "run" ? "RUN" : "SYS " + r.run.addr + " ($" + hex(r.run.addr) + ")") + ". " + r.passes + " passes, " + Math.max(1, Math.round(r.ms)) + " ms.</li>";
      }
    }
    ul.innerHTML = html;
    var b = $("msg-count"), n = r.errors.length || r.warnings.length;
    b.hidden = !n; b.textContent = n; b.classList.toggle("warn", !r.errors.length);
    var sum = $("asm-sum");
    if (r.errors.length) { sum.textContent = r.errors.length + (r.errors.length === 1 ? " error" : " errors"); sum.className = "bad"; }
    else if (!r.empty) { sum.textContent = "$" + hex(r.start) + "–$" + hex(r.end - 1) + " · " + (r.end - r.start).toLocaleString("en") + " bytes"; sum.className = ""; }
    else { sum.textContent = ""; }
  }
  function msgLi(cls, e) {
    var loc = e.file ? '<span class="loc">' + esc(e.file) + ":" + e.line + "</span>" : "";
    return '<li class="' + cls + '"' + (e.file ? ' data-file="' + esc(e.file) + '" data-line="' + e.line + '"' : "") + ">" + loc + esc(e.msg) + "</li>";
  }
  $("msgs").addEventListener("click", function (e) {
    var li = e.target.closest("[data-line]"); if (!li) return;
    gotoSource(li.getAttribute("data-file"), +li.getAttribute("data-line"));
  });
  function gotoSource(file, line, focus) {
    var i = st.p.files.findIndex(function (f) { return f.name === file; });
    if (i < 0) return;
    openFile(i);
    ed.gotoLine(line, focus);
  }
  function markEditor() {
    var f = cur(), errs = {}, warns = {}, bps = {};
    if (!f || f.data) return;
    var r = st.result;
    if (r) {
      r.errors.forEach(function (e) { if (e.file === f.name && !errs[e.line]) errs[e.line] = e.msg; });
      r.warnings.forEach(function (e) { if (e.file === f.name && !warns[e.line]) warns[e.line] = e.msg; });
    }
    (st.breaks[f.name] || []).forEach(function (l) { bps[l] = 1; });
    var at = M.stopped ? st.addrLine[M.c64.cpu.pc] : null;
    ed.setMarks({ errors: errs, warnings: warns, breaks: bps, current: at && at.file === f.name ? at.line : -1 });
  }

  // ---------------------------------------------------------------- running
  function run() {
    var r = assemble();
    if (r.errors.length) { selectTab("msg"); say("The program has errors."); return; }
    if (r.empty) return;
    M.gesture();
    M.run(r.prg, r.run);
    $("screen").focus({ preventScroll: true });
    updateState();
  }
  $("b-run").addEventListener("click", run);
  $("b-asm").addEventListener("click", function () { assemble(); selectTab("msg"); });
  $("b-reset").addEventListener("click", function () { M.reset(); markEditor(); updateState(); });
  $("b-sound").addEventListener("click", function () {
    var on = $("b-sound").getAttribute("aria-pressed") !== "true";
    $("b-sound").setAttribute("aria-pressed", on ? "true" : "false");
    M.setSound(on);
  });

  // breakpoints: a click on a line number
  function toggleBreak(line) {
    var f = cur(); if (!f || f.data) return;
    var list = st.breaks[f.name] || (st.breaks[f.name] = []), k = list.indexOf(line);
    if (k >= 0) list.splice(k, 1); else list.push(line);
    if (asmDirty || !st.result) assemble();
    var m = st.lineAddr[f.name] || {};
    if (k < 0 && m[line] == null) say("Line " + line + " has no code: the breakpoint waits for code there.");
    applyBreaks();
    markEditor();
  }
  function applyBreaks() {
    var addrs = [];
    Object.keys(st.breaks).forEach(function (file) {
      var m = st.lineAddr[file] || {};
      st.breaks[file].forEach(function (l) { if (m[l] != null) addrs.push(m[l]); });
    });
    M.setBreaks(addrs);
  }

  // the debugger
  var REASON = { "break": "at a breakpoint", step: "after a step", brk: "at BRK", jam: "the processor is stuck (JAM)", out: "after the subroutine", irq: "in an interrupt", nmi: "in an NMI" };
  M.onStop = function (why) {
    var pc = M.c64.cpu.pc, at = st.addrLine[pc];
    if (at) gotoSource(at.file, at.line, false);
    markEditor();
    if (st.tab !== "mem") selectTab("cpu");
    renderCpu();
  };
  M.onState = updateState;
  function updateState() {
    var s = $("run-state"), stopped = !!M.stopped;
    $("b-pause").disabled = stopped || !M.running;
    ["b-cont", "b-step", "b-over", "b-out"].forEach(function (id) { $(id).disabled = !stopped; });
    if (stopped) {
      var pc = M.c64.cpu.pc, name = st.symAt[pc];
      s.textContent = "Stopped " + (REASON[M.stopped.kind] || "") + " at $" + hex(pc) + (name ? " (" + name + ")" : "") + ".";
      s.classList.add("stop");
    } else {
      s.textContent = M.running ? "Running." : "The C64 is ready.";
      s.classList.remove("stop");
      markEditor();
    }
  }
  $("b-pause").addEventListener("click", function () { M.pause(); });
  $("b-cont").addEventListener("click", function () { M.cont(); markEditor(); updateState(); });
  $("b-step").addEventListener("click", function () { M.step(); afterStep(); });
  $("b-over").addEventListener("click", function () { M.stepOver(); afterStep(); });
  $("b-out").addEventListener("click", function () { M.stepOut(); afterStep(); });
  function afterStep() { markEditor(); renderCpu(); updateState(); }

  // ---------------------------------------------------------------- the output tabs
  function selectTab(t) {
    st.tab = t;
    document.querySelectorAll(".itabs [data-t]").forEach(function (b) { b.setAttribute("aria-selected", b.getAttribute("data-t") === t ? "true" : "false"); });
    ["msg", "cpu", "mem", "lbl", "lst"].forEach(function (k) { $("t-" + k).hidden = k !== t; });
    if (t === "cpu") renderCpu();
    if (t === "mem") renderMem();
  }
  document.querySelector(".itabs").addEventListener("click", function (e) { var b = e.target.closest("[data-t]"); if (b) selectTab(b.getAttribute("data-t")); });

  function renderCpu() {
    if (!M.c64) return;
    var r = M.regs(), f = "NV-BDIZC", flags = "";
    for (var i = 0; i < 8; i++) flags += '<span class="' + (r.p & (0x80 >> i) ? "on" : "") + '">' + f[i] + "</span>";
    $("regs").innerHTML = "<div><b>PC</b>$" + hex(r.pc) + "</div><div><b>A</b>$" + hex(r.a, 2) + "</div><div><b>X</b>$" + hex(r.x, 2) + "</div><div><b>Y</b>$" + hex(r.y, 2) + "</div>" +
      "<div><b>SP</b>$" + hex(r.s, 2) + "</div><div><b>Line</b>" + r.line + "</div><div class=\"flags\"><b>P</b>" + flags + "</div>";
    // a few instructions from the PC
    var D = window.C64Disasm, a = r.pc, html = "";
    for (var k = 0; k < 10; k++) {
      var d = D.disassemble(M.peek, a), lbl = st.symAt[a];
      var bytes = [], n = d.len || D.LENGTHS[M.peek(a)];
      for (var j = 0; j < n; j++) bytes.push(hex(M.peek(a + j), 2));
      html += '<div class="' + (a === r.pc ? "pc" : "") + '">' + hex(a) + "  " + (bytes.join(" ") + "         ").slice(0, 9) + " " + esc(d.text || "") + (lbl ? "   ; " + esc(lbl) : "") + "</div>";
      a = (a + n) & 0xFFFF;
    }
    $("disasm").innerHTML = html;
  }
  function renderMem() {
    var a = parseInt($("mem-addr").value, 16);
    if (!isFinite(a)) return;
    var out = [];
    for (var r = 0; r < 16; r++) {
      var row = (a + r * 8) & 0xFFFF, h = [], t = "";
      for (var k = 0; k < 8; k++) {
        var v = M.peek(row + k); h.push(hex(v, 2));
        var c = v & 0x7F; t += c >= 32 && c < 96 ? String.fromCharCode(c) : c >= 96 && c < 123 ? String.fromCharCode(c - 32) : ".";
      }
      out.push("$" + hex(row) + "  " + h.join(" ") + "  " + t);
    }
    $("hexdump").textContent = out.join("\n");
  }
  $("mem-addr").addEventListener("input", renderMem);
  setInterval(function () {
    if (st.tab === "mem") renderMem();
    if (st.tab === "cpu" && M.running && !M.stopped) renderCpu();
  }, 300);

  function renderLabels() {
    var r = st.result, rows = "";
    (r.symbols || []).forEach(function (s) {
      if (s.kind === "var") return;
      rows += '<tr data-file="' + esc(s.file || "") + '" data-line="' + (s.line || "") + '"><td>' + esc(s.name) + ' <span class="k">' + (s.kind === "label" ? "" : "constant") + "</span></td><td>$" + hex(s.value & 0xFFFF, s.value > 255 || s.kind === "label" ? 4 : 2) + "</td></tr>";
    });
    $("lbls").innerHTML = rows || '<tr><td class="k">No labels.</td></tr>';
  }
  $("lbls").addEventListener("click", function (e) {
    var tr = e.target.closest("tr[data-line]"); if (!tr || !tr.getAttribute("data-line")) return;
    gotoSource(tr.getAttribute("data-file"), +tr.getAttribute("data-line"));
  });
  function renderListing() {
    var r = st.result, out = [];
    (r.listing || []).slice(0, 4000).forEach(function (l) {
      var bytes = (l.bytes || []).slice(0, 4).map(function (b) { return hex(b, 2); }).join(" ") + (l.bytes && l.bytes.length > 4 ? "…" : "");
      out.push('<span data-file="' + esc(l.file) + '" data-line="' + l.line + '">' + (l.pc != null ? hex(l.pc) : "    ") + "  " + (bytes + "              ").slice(0, 13) + " " + esc(l.text.replace(/\t/g, "        ")) + "</span>");
    });
    $("listing").innerHTML = out.join("\n");
  }
  $("listing").addEventListener("click", function (e) {
    var s = e.target.closest("[data-line]"); if (s) gotoSource(s.getAttribute("data-file"), +s.getAttribute("data-line"));
  });

  // ---------------------------------------------------------------- files in and out
  $("btn-new").addEventListener("click", function () {
    replaceProject({ name: "New project", files: [{ name: "main.asm", text: "; a new program\n\n        * = $0801\n        .basic\n\n        inc $d020\n        rts\n" }] }, "A new project.");
  });
  EX.forEach(function (ex, i) { var o = document.createElement("option"); o.value = i; o.textContent = ex.name; $("examples").appendChild(o); });
  $("examples").addEventListener("change", function () {
    var i = $("examples").value; if (i === "") return;
    replaceProject(newProject(EX[+i]), "The example " + EX[+i].name + ".");
    $("examples").value = "";
  });
  $("btn-save").addEventListener("click", saveFile);
  function saveFile() { syncEditor(); download(base() + ".c64asm.json", toJSON(st.p), "application/json"); say("Project saved as a file"); }
  $("btn-open").addEventListener("click", function () { $("file-open").click(); });
  $("file-open").addEventListener("change", function () { openFiles($("file-open").files); $("file-open").value = ""; });
  function openFiles(list) {
    Array.prototype.forEach.call(list, function (file) {
      file.arrayBuffer().then(function (buf) {
        var bytes = new Uint8Array(buf), name = file.name;
        if (/\.json$/i.test(name)) {
          try { replaceProject(fromJSON(new TextDecoder().decode(bytes)), "Opened " + name + "."); }
          catch (e) { say(e.message); }
          return;
        }
        syncEditor();
        var text = /\.(asm|s|a65|a|inc|txt|src|tas)$/i.test(name);
        var old = st.p.files.findIndex(function (f) { return f.name === name; });
        var entry = text ? { name: name, text: new TextDecoder().decode(bytes).replace(/\r\n?/g, "\n") } : { name: name, data: bytes };
        if (old >= 0) st.p.files[old] = entry; else st.p.files.push(entry);
        openFile(old >= 0 ? old : st.p.files.length - 1, true);
        changed();
        say(text ? "Opened " + name : name + " added: put it into the program with .binary");
      });
    });
  }
  document.addEventListener("dragover", function (e) { e.preventDefault(); document.body.classList.add("dragging"); });
  document.addEventListener("dragleave", function (e) { if (!e.relatedTarget) document.body.classList.remove("dragging"); });
  document.addEventListener("drop", function (e) { e.preventDefault(); document.body.classList.remove("dragging"); if (e.dataTransfer.files.length) openFiles(e.dataTransfer.files); });

  function exportOut(kind) {
    var r = assemble();
    if (r.errors.length) { selectTab("msg"); say("The program has errors."); return; }
    if (r.empty) return;
    if (kind === "prg") download(base() + ".prg", r.prg);
    else if (kind === "bin") download(base() + ".bin", r.bin);
    else {
      var lines = r.symbols.filter(function (s) { return s.kind === "label"; }).map(function (s) { return "al C:" + hex(s.value).toLowerCase() + " ." + s.name.replace(/\./g, "_"); });
      download(base() + ".lbl", lines.join("\n") + "\n", "text/plain");
    }
  }
  $("ex-prg").addEventListener("click", function () { exportOut("prg"); });
  $("ex-bin").addEventListener("click", function () { exportOut("bin"); });
  $("ex-lbl").addEventListener("click", function () { exportOut("lbl"); });

  // ---------------------------------------------------------------- keys
  var screen = $("screen");
  screen.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === "Enter" || e.key === "s")) return;
    if (e.key === "F5" || e.key === "F9" || e.key === "F10" || e.key === "F11") return;
    M.keydown(e); e.stopPropagation();
  });
  screen.addEventListener("keyup", function (e) { M.keyup(e); });
  screen.addEventListener("focus", function () { $("screen-hint").hidden = true; });
  screen.addEventListener("blur", function () { M.blur(); $("screen-hint").hidden = !M.running; });
  screen.addEventListener("pointerdown", function () { M.gesture(); });
  document.addEventListener("keydown", function (e) {
    var ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && e.key === "Enter") { e.preventDefault(); run(); return; }
    if (e.key === "F5") { e.preventDefault(); run(); return; }
    if (ctrl && (e.key === "s" || e.key === "S")) { e.preventDefault(); saveFile(); return; }
    if (ctrl && (e.key === "b" || e.key === "B")) { e.preventDefault(); assemble(); selectTab("msg"); return; }
    if (e.key === "F9") { e.preventDefault(); if (M.stopped) $("b-cont").click(); else M.pause(); return; }
    if (e.key === "F10" && M.stopped) { e.preventDefault(); $("b-over").click(); return; }
    if (e.key === "F11" && M.stopped) { e.preventDefault(); (e.shiftKey ? $("b-out") : $("b-step")).click(); return; }
  });

  // ---------------------------------------------------------------- start
  try { var saved = localStorage.getItem(KEY); st.p = saved ? fromJSON(saved) : newProject(); }
  catch (e) { st.p = newProject(); }
  function clearOutput() {
    $("msgs").innerHTML = '<li class="m-info">Press <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to assemble and run the program.</li>';
    $("msg-count").hidden = true; $("asm-sum").textContent = "";
    $("lbls").innerHTML = ""; $("listing").textContent = "";
  }
  showProject();
  M.init(screen);
  updateState();
})();
