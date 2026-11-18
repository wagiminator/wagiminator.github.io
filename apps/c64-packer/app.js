/* C64 Packer: the user interface */
(function () {
  "use strict";

  var P = window.Packer, Tap = window.PackerTap;
  var $ = function (id) { return document.getElementById(id); };
  var hex = P.hex;
  var FORMATS = ["exomizer", "tscrunch"];

  var st = {
    name: "", prg: null, info: null, fmt: "exomizer",
    packed: {}, results: {}, busy: 0, gen: 0
  };

  function fmtNum(n) { return n.toLocaleString("en"); }
  function download(name, data, type) {
    var blob = new Blob([data], { type: type || "application/octet-stream" });
    var url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
  }
  function base() { return (st.name || "program").replace(/\.[^.]*$/, "").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-") || "program"; }
  function message(text, err) {
    var m = $("pack-msg");
    m.hidden = !text; m.textContent = text || "";
    m.classList.toggle("error", !!err);
  }

  // ---------------------------------------------------------------- opening a program
  function openFile(file) {
    file.arrayBuffer().then(function (buf) {
      var bytes = new Uint8Array(buf);
      // PC64 (.p00): a 26 byte header in front
      if (bytes.length > 28 && String.fromCharCode.apply(null, bytes.subarray(0, 7)) === "C64File") bytes = bytes.subarray(26);
      var info;
      try { info = P.analyse(bytes, file.name); } catch (e) { showError(e.message); return; }
      st.name = file.name; st.prg = bytes; st.info = info;
      st.packed = {}; st.results = {};
      showProgram();
      packAll();
    });
  }
  function showError(text) {
    $("prog-info").hidden = true; $("drop").hidden = false;
    $("pack").hidden = true; $("save").hidden = true;
    var d = $("drop").querySelector(".hint");
    d.textContent = text; d.style.color = "var(--danger)";
  }
  $("file").addEventListener("change", function () { var f = $("file").files[0]; if (f) openFile(f); $("file").value = ""; });
  $("btn-other").addEventListener("click", function () { $("file").click(); });
  document.addEventListener("dragover", function (e) { e.preventDefault(); document.body.classList.add("dragging"); });
  document.addEventListener("dragleave", function (e) { if (!e.relatedTarget) document.body.classList.remove("dragging"); });
  document.addEventListener("drop", function (e) {
    e.preventDefault(); document.body.classList.remove("dragging");
    var f = e.dataTransfer.files[0]; if (f) openFile(f);
  });

  function showProgram() {
    var i = st.info;
    $("drop").hidden = true; $("prog-info").hidden = false;
    $("pi-name").textContent = st.name;
    var kind = i.sys != null ? "BASIC line SYS " + i.sys + " (" + hex(i.sys) + ")" : i.basic ? "BASIC program, " + i.lines + (i.lines === 1 ? " line" : " lines") : "machine code";
    var facts = [["Load", hex(i.load) + "–" + hex(i.end - 1)], ["Size", fmtNum(i.data.length) + " bytes"], ["Kind", kind]];
    $("pi-facts").innerHTML = "";
    facts.forEach(function (f) { var li = document.createElement("li"), b = document.createElement("b"); b.textContent = f[0]; li.appendChild(b); li.appendChild(document.createTextNode(f[1])); $("pi-facts").appendChild(li); });
    // how to start: the SYS address, RUN for BASIC, else the load address
    if (i.sys != null) { $("st-jmp").checked = true; $("st-addr").value = i.sys.toString(16).toUpperCase(); }
    else if (i.basic) { $("st-run").checked = true; $("st-addr").value = i.load.toString(16).toUpperCase(); }
    else { $("st-jmp").checked = true; $("st-addr").value = i.load.toString(16).toUpperCase(); }
    $("tap-name").value = st.name.replace(/\.[^.]*$/, "").toUpperCase().replace(/[^\x20-\x5F]/g, "").slice(0, 16);
    startHint();
  }
  function startOpts() {
    var run = $("st-run").checked, a = parseInt($("st-addr").value, 16);
    return { mode: run ? "run" : "jmp", start: isFinite(a) ? a & 0xFFFF : st.info.load };
  }
  function startHint() {
    var i = st.info, o = startOpts(), h = "";
    if (o.mode === "run" && i.load !== 0x0801) h = "RUN starts a BASIC program at $0801; this program loads at " + hex(i.load) + ".";
    else if (o.mode === "jmp" && (o.start < i.load || o.start >= i.end)) h = "The address is outside the program.";
    else if (i.sys != null && o.mode === "jmp" && o.start === i.sys) h = "The SYS address of the BASIC line.";
    $("st-hint").textContent = h;
  }
  ["st-run", "st-jmp"].forEach(function (id) { $(id).addEventListener("change", function () { startHint(); rebuild(); }); });
  $("st-addr").addEventListener("input", function () { $("st-jmp").checked = true; startHint(); });
  $("st-addr").addEventListener("change", function () { startHint(); rebuild(); });
  $("opt-blank").addEventListener("change", rebuild);

  // ---------------------------------------------------------------- packing
  // pack both formats (TSCrunch first: it is quick), one after the other so the page stays alive
  function packAll() {
    var gen = ++st.gen;
    $("pack").hidden = false; $("save").hidden = true;
    message("");
    FORMATS.forEach(function (f) { setCard(f, null, "packing …"); });
    var order = ["tscrunch", "exomizer"];
    (function next(k) {
      if (gen !== st.gen) return;
      if (k >= order.length) { finish(); return; }
      setTimeout(function () {
        if (gen !== st.gen) return;
        var f = order[k];
        try { st.packed[f] = P.packOnly(st.info, f); } catch (e) { st.packed[f] = { error: e.message }; }
        build(f);
        next(k + 1);
      }, 30);
    })(0);
  }
  function rebuild() {
    if (!st.info) return;
    FORMATS.forEach(function (f) { if (st.packed[f]) build(f); });
    finish();
  }
  function build(f) {
    var p = st.packed[f];
    if (!p || p.error) { st.results[f] = { error: p ? p.error : "Not packed." }; renderCard(f); return; }
    var o = startOpts();
    try {
      var res = P.sfx(st.info, { format: f, mode: o.mode, start: o.start, blank: $("opt-blank").checked, packed: p });
      var m = P.measure(res, st.info);
      st.results[f] = { res: res, m: m };
    } catch (e) { st.results[f] = { error: e.message }; }
    renderCard(f);
  }
  function setCard(f, size, meta, bad) {
    var c = $("fmt-" + f);
    c.querySelector('[data-k="size"]').textContent = size == null ? "…" : fmtNum(size);
    c.querySelector('[data-k="meta"]').textContent = meta;
    c.querySelector('[data-k="bar"]').style.width = size == null ? "0" : Math.min(100, size / (st.prg.length) * 100) + "%";
    c.classList.toggle("bad", !!bad);
  }
  function renderCard(f) {
    var r = st.results[f];
    if (r.error) { setCard(f, null, r.error, true); return; }
    var pct = Math.round(r.res.size / st.prg.length * 1000) / 10;
    setCard(f, r.res.size, pct + " % of the program · unpacks in about " + (r.m.seconds < 0.1 ? "0.1" : r.m.seconds.toFixed(1)) + " s");
  }
  function finish() {
    $("orig").textContent = "The program file: " + fmtNum(st.prg.length) + " bytes. The sizes above are whole files with the unpacker and the BASIC line.";
    // choose a format that worked
    if (!good(st.fmt)) st.fmt = good("exomizer") ? "exomizer" : good("tscrunch") ? "tscrunch" : st.fmt;
    selectFormat(st.fmt);
    $("save").hidden = !good(st.fmt) && st.prg == null;
  }
  function good(f) { return st.results[f] && !st.results[f].error; }
  function selectFormat(f) {
    st.fmt = f;
    FORMATS.forEach(function (g) {
      $("fmt-" + g).classList.toggle("on", g === f);
      $("fmt-" + g).querySelector("input").checked = g === f;
    });
    renderMap();
    renderSave();
  }
  FORMATS.forEach(function (f) {
    $("fmt-" + f).querySelector("input").addEventListener("change", function () { selectFormat(f); });
  });

  // ---------------------------------------------------------------- memory map
  function renderMap() {
    var map = $("map"), legend = $("legend"), r = st.results[st.fmt], i = st.info;
    map.innerHTML = ""; legend.innerHTML = "";
    if (!r || r.error) return;
    var res = r.res;
    function seg(cls, a, b, title) {
      var s = document.createElement("span");
      s.className = cls; s.style.left = (a / 65536 * 100) + "%"; s.style.width = ((b - a) / 65536 * 100) + "%";
      s.title = title + ": " + hex(a) + "–" + hex(b - 1);
      map.appendChild(s);
    }
    seg("m-io", 0xD000, 0xE000, "I/O area (RAM while unpacking)");
    seg("m-sys", 0x0000, 0x0200, "Zero page and stack");
    seg("m-prog", i.load, i.end, "The program");
    seg("m-packed", res.placed, res.placed + res.packedSize, "Packed data");
    seg("m-unpacker", res.unpackerAt, res.unpackerEnd, "Unpacker");
    [["m-prog", "Program " + hex(i.load) + "–" + hex(i.end - 1)], ["m-packed", "Packed data " + hex(res.placed) + "–" + hex(res.placed + res.packedSize - 1)],
      ["m-unpacker", "Unpacker " + hex(res.unpackerAt)], ["m-sys", "Zero page, stack"]].forEach(function (l) {
      var li = document.createElement("li"), c = document.createElement("i");
      c.style.background = "var(--" + l[0] + ")";
      li.appendChild(c); li.appendChild(document.createTextNode(l[1]));
      legend.appendChild(li);
    });
  }

  // ---------------------------------------------------------------- saving
  function renderSave() {
    var ok = good(st.fmt);
    $("save").hidden = false;
    $("sv-prg").disabled = !ok;
    $("sv-prg").textContent = "Save .prg" + (ok ? " (" + fmtNum(st.results[st.fmt].res.size) + " bytes)" : "");
    tapInfo();
  }
  function tapSource() {
    var packed = $("tap-what").value === "packed";
    if (packed) {
      if (!good(st.fmt)) throw new Error("The program could not be packed.");
      // the packed program is a BASIC program with SYS 2061: the loader starts it with RUN
      return { prg: st.results[st.fmt].res.prg, mode: "run", start: 0x080D };
    }
    var o = startOpts();
    return { prg: st.prg, mode: o.mode, start: o.start };
  }
  function tapInfo() {
    try {
      var s = tapSource(), t = Tap.build(s.prg, { name: $("tap-name").value, mode: s.mode, start: s.start });
      st.tap = t;
      $("tap-time").textContent = "Loading takes about " + Math.round(t.seconds) + " s (with the normal loader about " + Math.round(romSeconds(s.prg.length) / 60) + " min).";
      $("sv-tap").disabled = false;
    } catch (e) {
      st.tap = null;
      $("tap-time").textContent = e.message;
      $("sv-tap").disabled = true;
    }
  }
  // the KERNAL loader: every byte 20 pulses of about 470 cycles on average, twice
  function romSeconds(n) { return 12 + (n * 2 * 20 * 480 + 2 * 9 * 20 * 480) / 985248; }
  $("tap-what").addEventListener("change", tapInfo);
  $("tap-name").addEventListener("input", function () { tapInfo(); });
  $("sv-prg").addEventListener("click", function () {
    if (!good(st.fmt)) return;
    download(base() + "-packed.prg", st.results[st.fmt].res.prg);
  });
  $("sv-tap").addEventListener("click", function () { if (st.tap) download(base() + ".tap", st.tap.tap); });
  function raw(kind, ext) {
    try { download(base() + ext, P.raw(st.info, kind)); message(""); }
    catch (e) { message(e.message, true); }
  }
  $("sv-tsc").addEventListener("click", function () { raw("tscrunch", ".tsc"); });
  $("sv-exo").addEventListener("click", function () { raw("exo-forward", ".exo"); });
  $("sv-exob").addEventListener("click", function () { raw("exo-backward", "-backwards.exo"); });
})();
