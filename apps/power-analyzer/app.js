/* Power Analyzer: the user interface */
(function () {
  "use strict";

  var PA = window.PA, T = PA.TESTS, F = PA.fmt;
  var $ = function (id) { return document.getElementById(id); };
  var KEY = "pa.settings", RUNS = "pa.runs";
  var KEYRES = { load: 1, reg: 3, eff: 0, ripple: 0, bat: 0, meter: 3, cal: 0 };

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function load(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function download(name, blob) {
    var a = document.createElement("a"), url = URL.createObjectURL(blob);
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  var S = load(KEY, {});
  S.params = S.params || {};
  var st = { link: null, sim: false, version: "", busy: false, stopReq: false, runs: load(RUNS, []), show: null, cmp: {}, loadOn: 0, live: null };

  // ---------------------------------------------------------------- the chart
  var chart = new PA.Chart($("chart"), { onHover: hover });
  function test() { return PA.test($("test").value) || T[0]; }
  function shownRun() { return st.runs.filter(function (r) { return r.id === st.show; })[0] || st.live; }
  function draw() {
    var main = st.live && st.busy ? st.live : shownRun(), t = main ? PA.test(main.test) : test();
    var sets = [];
    if (main) sets.push({ rows: main.rows, name: main.label || t.name, main: true });
    st.runs.forEach(function (r) { if (st.cmp[r.id] && r !== main && r.test === t.id) sets.push({ rows: r.rows, name: r.label || PA.test(r.test).name }); });
    chart.set(t, sets);
    $("chart-h").textContent = main ? (main.label || t.name) : t.name;
    $("chart-sub").textContent = main ? t.name + " · " + params(t, main.params) + " · " + new Date(main.date).toLocaleString() + (main.sim ? " · simulator" : "")
      : (st.link ? "Choose a test and start it." : "Connect the analyzer, or try the simulator, and start a test.");
    // legend
    var lg = "";
    if (sets.length > 1) sets.forEach(function (s, i) { lg += '<span><i style="border-color:' + PA.PALETTE[i % PA.PALETTE.length] + '"></i>' + esc(s.name) + "</span>"; });
    if (sets.length > 1 && t.y.length > 1) lg += "<span>solid: " + esc(t.y[0].label) + ', <i class="dash" style="border-color:#5d6470"></i> ' + esc(t.y[1].label) + "</span>";
    $("legend").innerHTML = lg;
    summary(main);
    $("btn-csv").disabled = $("btn-png").disabled = !(main && main.rows.length);
  }
  function params(t, p) {
    return t.params.map(function (x) { return x.name.toLowerCase() + " " + (p ? p[x.id] : "") + " " + x.unit; }).join(", ");
  }
  function summary(run) {
    var el = $("summary");
    if (!run || !run.rows.length) { el.innerHTML = ""; return; }
    var t = PA.test(run.test), list;
    try { list = t.summary(run.rows); } catch (e) { list = []; }
    if (run.input) list.push(["Input", run.input]);
    el.innerHTML = list.map(function (x) { return "<div><dt>" + esc(x[0]) + "</dt><dd>" + esc(x[1]) + "</dd></div>"; }).join("");
  }
  function hover(row, i, xu) {
    var el = $("readout");
    if (!row) { el.textContent = ""; return; }
    var t = chart.test, parts = [];
    if (t.x.c >= 0) parts.push("<b>" + esc(t.x.label) + "</b> " + (+(row[t.x.c] * t.x.scale * (xu ? xu.f : 1)).toFixed(t.x.time ? 2 : 0)) + " " + esc(xu ? xu.u : t.x.unit));
    else parts.push("<b>Reading</b> " + (i + 1));
    t.y.forEach(function (s) { parts.push("<b>" + esc(s.label) + "</b> " + (+(row[s.c] * s.scale).toFixed(s.unit === "V" ? 3 : s.unit === "%" ? 1 : 0)) + " " + esc(s.unit)); });
    if (t.id === "load" || t.id === "eff") parts.push("<b>Power</b> " + F.W(row[0] * row[1] / 1000));
    if (t.id === "bat") parts.push("<b>Capacity</b> " + row[3] + " mAh");
    el.innerHTML = parts.join(" &nbsp; ");
  }

  // ---------------------------------------------------------------- test settings
  T.forEach(function (t) { $("test").insertAdjacentHTML("beforeend", '<option value="' + t.id + '">' + esc(t.name) + "</option>"); });
  $("test").value = S.test && PA.test(S.test) ? S.test : "load";
  function wiringSvg(w) {
    var rows = w.cal ? [["TEST-IN", "from PWR-OUT through the ammeter, voltmeter across", "in"], ["PWR-OUT", "to TEST-IN through the ammeter", "out"], ["PWR-IN", "Power supply", "in"]]
      : [["TEST-IN", w.test, "in"], ["PWR-OUT", w.out, "out"], ["PWR-IN", w.in, "in"]];
    var h = 3 * 36 + 4, s = '<svg viewBox="0 0 300 ' + h + '" role="img" aria-label="Wiring"><rect x="1" y="1" width="78" height="' + (h - 2) + '" rx="6" fill="#f6f7fa" stroke="#9aa0ad"/>';
    rows.forEach(function (r, i) {
      var y = 4 + i * 36 + 16, on = !!r[1];
      s += '<text x="40" y="' + (y + 4) + '" text-anchor="middle" font-size="11" font-weight="700" fill="#2b2f36" font-family="Chivo, system-ui, sans-serif">' + r[0] + "</text>";
      s += '<circle cx="79" cy="' + y + '" r="4" fill="' + (on ? "#1f6fb2" : "#c5c8d4") + '"/>';
      if (on) {
        var into = r[2] === "in";
        s += '<line x1="84" y1="' + y + '" x2="122" y2="' + y + '" stroke="#1f6fb2" stroke-width="2"/>';
        s += into ? '<path d="M84 ' + y + 'l8 -5v10z" fill="#1f6fb2"/>' : '<path d="M122 ' + y + 'l-8 -5v10z" fill="#1f6fb2"/>';
        s += '<rect x="124" y="' + (y - 14) + '" width="174" height="28" rx="5" fill="#edf4fb" stroke="#1f6fb2"/>';
        var txt = r[1], lines = txt.length > 30 ? [txt.slice(0, txt.lastIndexOf(" ", 30)), txt.slice(txt.lastIndexOf(" ", 30) + 1)] : [txt];
        lines.forEach(function (l, k) { s += '<text x="211" y="' + (y + 4 + (lines.length > 1 ? (k ? 6 : -6) : 0)) + '" text-anchor="middle" font-size="' + (lines.length > 1 ? 10 : 11.5) + '" fill="#17578d" font-family="Chivo, system-ui, sans-serif">' + esc(l) + "</text>"; });
      } else s += '<text x="124" y="' + (y + 4) + '" font-size="11" fill="#9aa0ad" font-family="Chivo, system-ui, sans-serif">not connected</text>';
    });
    return s + "</svg>";
  }
  function renderTest() {
    var t = test(), p = S.params[t.id] || {};
    S.test = t.id; store(KEY, S);
    $("test-info").textContent = t.info + " Duration: " + t.duration + ".";
    $("wiring").innerHTML = wiringSvg(t.wiring);
    $("params").innerHTML = t.params.map(function (x) {
      return '<label class="field"><span>' + esc(x.name) + '</span><span class="inunit"><input type="number" data-p="' + x.id + '" min="' + x.min + '" max="' + x.max +
        '" step="1" value="' + (p[x.id] != null ? p[x.id] : x.def) + '" inputmode="numeric"><i>' + x.unit + "</i></span></label>";
    }).join("");
    $("cal").hidden = t.id !== "cal";
    $("btn-stop").hidden = !t.stop;
    ui();
    if (!st.busy) {
      // show the last measurement of this test, if any
      var last = st.runs.filter(function (r) { return r.test === t.id; }).pop();
      if (!shownRun() || PA.test(shownRun().test) !== t) { st.show = last ? last.id : null; st.live = null; }
      draw(); renderRuns();
    }
    calibration();
  }
  $("test").addEventListener("change", renderTest);
  $("params").addEventListener("change", function (e) {
    var t = test(), i = e.target, x = t.params.filter(function (q) { return q.id === i.getAttribute("data-p"); })[0];
    var v = Math.round(+i.value);
    if (isNaN(v)) v = x.def;
    v = Math.max(x.min, Math.min(x.max, v));
    i.value = v;
    (S.params[t.id] = S.params[t.id] || {})[x.id] = v;
    store(KEY, S);
  });

  // ---------------------------------------------------------------- one command at a time
  var queue = Promise.resolve();
  function exclusive(fn) { var p = queue.then(fn, fn); queue = p.catch(function () {}); return p; }
  function status(t, kind) { var el = $("status"); el.textContent = t || ""; el.className = "status" + (kind ? " " + kind : ""); }
  function ui() {
    var on = !!st.link;
    $("conn").className = "conn" + (on ? st.busy ? " busy" : " connected" : "");
    $("conn-text").textContent = on ? (st.sim ? "Simulated analyzer" : "Power Analyzer") + (st.version ? ", firmware " + st.version : "") : "Not connected";
    $("btn-connect").textContent = on && !st.sim ? "Disconnect" : "Connect";
    $("btn-sim").textContent = on && st.sim ? "Stop simulator" : "Simulator";
    $("btn-connect").disabled = st.busy || (on && st.sim) || !("serial" in navigator);
    $("btn-sim").disabled = st.busy || (on && !st.sim);
    $("btn-start").disabled = !on || st.busy;
    $("btn-stop").disabled = !st.busy;
    $("btn-load").disabled = $("btn-off").disabled = !on || st.busy;
    $("test").disabled = st.busy;
    $("params").querySelectorAll("input").forEach(function (i) { i.disabled = st.busy; });
    var ls = $("load-state");
    ls.className = "load-state" + (st.loadOn ? " on" : "");
    ls.textContent = st.loadOn ? "Load on: " + st.loadOn + " mA. Switch it off before you change the wiring." : on ? "Load off." : "";
  }

  // ---------------------------------------------------------------- connecting
  async function open(port, sim) {
    var link = new PA.Link(port);
    await link.start();
    await sleep(150); link.flush();
    var id = null;
    for (var k = 0; k < 2 && id !== "Power Analyzer"; k++) { await link.send("i"); id = await link.line(1200); }
    if (id !== "Power Analyzer") { await link.close(); throw new Error("No Power Analyzer answered on this port" + (id ? " (it said “" + id.slice(0, 40) + "”)." : ".")); }
    await link.send("v");
    st.version = (await link.line(1000)) || "";
    st.link = link; st.sim = sim;
    status("Ready.");
    ui(); draw();
    poll();
  }
  async function close() {
    var l = st.link;
    st.link = null; st.loadOn = 0; st.busy = false;
    if (l) await l.close();
    meter(null);
    ui(); draw();
  }
  $("btn-connect").addEventListener("click", async function () {
    if (st.link) { await exclusive(async function () { try { await st.link.send("r"); await st.link.line(500); } catch (e) { /* gone */ } }); await close(); status("Disconnected."); return; }
    try {
      var port = await navigator.serial.requestPort({ filters: [{ usbVendorId: 0x1A86 }] });
      status("Connecting …");
      await open(port, false);
    } catch (e) {
      if (e.name === "NotFoundError") status("");
      else status(e.name === "NetworkError" || e.name === "InvalidStateError" ? "The port is in use by another program." : e.message, "err");
    }
  });
  $("btn-sim").addEventListener("click", async function () {
    if (st.link) { await close(); status("Simulator stopped."); return; }
    await open(new PA.SimPort(), true);
  });
  if ("serial" in navigator) navigator.serial.addEventListener("disconnect", function (e) {
    if (st.link && st.link.port === e.target) { st.stopReq = true; close(); status("The analyzer was unplugged.", "warn"); }
  });
  else $("unsupported").hidden = false;

  // ---------------------------------------------------------------- live readings
  function meter(v) {
    var m = $("meter");
    m.classList.toggle("stale", !v);
    var set = function (id, val, unitId, kind) {
      var t = "–", u = kind === "A" ? "mA" : "W";
      if (v) {
        if (kind === "V") t = (val / 1000).toFixed(3);
        else if (kind === "A") { if (val >= 1000) { t = (val / 1000).toFixed(3); u = "A"; } else t = String(Math.round(val)); }
        else { if (val >= 1000) t = (val / 1000).toFixed(2); else { t = String(Math.round(val)); u = "mW"; } }
      }
      $(id).textContent = t;
      if (unitId) $(unitId).textContent = u;
    };
    set("m-u1", v && v[1], null, "V"); set("m-i1", v && v[0], "m-i1u", "A"); set("m-p1", v && v[0] * v[1] / 1000, "m-p1u", "W");
    set("m-u2", v && v[3], null, "V"); set("m-i2", v && v[2], "m-i2u", "A"); set("m-p2", v && v[2] * v[3] / 1000, "m-p2u", "W");
  }
  async function poll() {
    while (st.link) {
      if (!st.busy && !document.hidden) {
        await exclusive(async function () {
          if (!st.link || st.busy) return;
          await st.link.send("t");
          var l = await st.link.line(800), v = l && l.split("\t").map(Number);
          meter(v && v.length === 4 && v.every(function (x) { return !isNaN(x); }) ? v : null);
        }).catch(function () { meter(null); });
      }
      await sleep(400);
    }
  }
  async function command(c) {
    return exclusive(async function () {
      st.link.flush();
      await st.link.send(c);
      var l = await st.link.line(1500);
      if (l !== "DONE") throw new Error("The analyzer did not confirm “" + c + "”.");
    });
  }
  $("btn-load").addEventListener("click", async function () {
    var i = Math.max(17, Math.min(5000, Math.round(+$("load-i").value) || 0));
    $("load-i").value = i;
    try { await command("s " + i); st.loadOn = i; status(""); } catch (e) { status(e.message, "err"); }
    ui();
  });
  $("btn-off").addEventListener("click", async function () {
    try { await command("r"); st.loadOn = 0; } catch (e) { status(e.message, "err"); }
    ui();
  });

  // ---------------------------------------------------------------- running a test
  $("btn-start").addEventListener("click", async function () {
    var t = test(), p = {};
    t.params.forEach(function (x) { var i = $("params").querySelector('[data-p="' + x.id + '"]'); p[x.id] = Math.max(x.min, Math.min(x.max, Math.round(+i.value) || x.def)); });
    var cmd = t.cmd + " " + p.a + " " + (p.b != null ? p.b : 0);
    var run = { id: Date.now().toString(36), test: t.id, label: $("label").value.trim(), date: new Date().toISOString(), params: p, rows: [], sim: st.sim, version: st.version };
    $("label").value = "";                               // the label belongs to this run only
    st.busy = true; st.stopReq = false; st.live = run; st.loadOn = 0;
    ui(); draw();
    status(t.name + " running …");
    var t0 = Date.now(), lastUi = 0, err = null;
    try {
      await exclusive(async function () {
        var link = st.link;
        link.flush();
        await link.send(cmd);
        var gap = t.id === "meter" ? Math.max(3000, p.a + 2500) : t.id === "bat" ? 4000 : t.id === "ripple" ? 4000 : 3000;
        for (;;) {
          var l = await link.line(run.rows.length ? gap : gap + 2000);
          if (l === null) { if (!st.link) return; throw new Error("The analyzer stopped answering."); }
          if (l === "DONE") break;
          var v = l.split("\t").map(Number);
          if (v.length !== t.cols.length || v.some(isNaN)) continue;
          run.rows.push(v);
          var now = Date.now();
          if (now - lastUi > 120) {
            lastUi = now; chart.redraw(); summary(run);
            status(t.name + " running: " + run.rows.length + " readings, " + F.dur((now - t0) / 1000) + (st.stopReq ? " (stopping …)" : ""));
          }
        }
      });
    } catch (e) { err = e; }
    st.busy = false;
    if (run.rows.length) {
      st.runs.push(run); st.show = run.id; st.live = null;
      saveRuns();
    }
    if (err) status(err.message + (run.rows.length ? " The readings so far are kept." : ""), "err");
    else if (!run.rows.length) status(t.id === "load" || t.id === "eff" || t.id === "ripple" ? "No readings: the voltage was already below the stop voltage, or nothing is connected." : "No readings.", "warn");
    else status(t.name + " done: " + run.rows.length + " readings in " + F.dur((Date.now() - t0) / 1000) + ".");
    ui(); draw(); renderRuns(); calibration();
  });
  $("btn-stop").addEventListener("click", async function () {
    if (!st.busy || !st.link) return;
    st.stopReq = true;
    try { await st.link.send("x"); } catch (e) { /* the test ends anyway */ }
    status("Stopping …");
  });

  // ---------------------------------------------------------------- calibration helper
  function calibration() {
    var out = $("cal-out");
    if (test().id !== "cal") { out.textContent = ""; return; }
    var run = shownRun();
    if (!run || run.test !== "cal" || !run.rows.length) { out.textContent = "Run the calibration first, then enter what your multimeter showed."; return; }
    var l = run.rows[run.rows.length - 1], m = ["cal-i1", "cal-u1", "cal-i2", "cal-u2"].map(function (id) { return parseFloat($(id).value); });
    var names = ["ILCAL1", "ULCAL1", "ILCAL2", "ULCAL2"], txt = "Averages of the analyzer: " + l.join(" / ") + "\n";
    if (m.every(isNaN)) { out.textContent = txt + "Enter the multimeter readings to get the calibration factors."; return; }
    txt += "\nPut these lines into PowerAnalyzer.ino:\n";
    names.forEach(function (n, i) { if (!isNaN(m[i]) && l[i]) txt += "#define " + n + "      " + (m[i] / l[i]).toFixed(4) + "\n"; });
    out.textContent = txt + "\n(The factors assume the firmware was built with all of them set to 1.)";
  }
  ["cal-i1", "cal-u1", "cal-i2", "cal-u2"].forEach(function (id) { $(id).addEventListener("input", calibration); });

  // ---------------------------------------------------------------- measurements
  function saveRuns() {
    var list = st.runs.slice();
    while (list.length && !store(RUNS, list)) list.shift();
    if (list.length < st.runs.length) status("The browser storage is full: " + (st.runs.length - list.length) + " old measurement(s) are only kept until you close the page. Save them as CSV.", "warn");
  }
  function keyResult(r) {
    try { var s = PA.test(r.test).summary(r.rows)[KEYRES[r.test]]; return s ? s[0] + ": " + s[1] : ""; } catch (e) { return ""; }
  }
  function renderRuns() {
    var shown = shownRun(), t = shown ? PA.test(shown.test) : test(), html = "";
    st.runs.slice().reverse().forEach(function (r) {
      var rt = PA.test(r.test), same = rt === t, on = shown && r.id === shown.id;
      html += '<div class="run-row' + (on ? " on" : "") + '" role="listitem" data-id="' + r.id + '">' +
        '<input type="checkbox" data-cmp aria-label="Compare" title="' + (same ? "Draw into the chart" : "Only measurements of the same test can be compared") + '"' + (on ? " checked disabled" : same && st.cmp[r.id] ? " checked" : "") + (same ? "" : " disabled") + ">" +
        '<span class="nm"><b>' + esc(r.label || rt.name) + "</b><small>" + esc(new Date(r.date).toLocaleString()) + (r.sim ? " · simulator" : "") + "</small></span>" +
        '<span class="ty">' + esc(rt.short) + '</span><span class="key">' + esc(keyResult(r)) + "</span>" +
        '<span class="acts"><button type="button" data-a="ren" title="Rename">Rename</button><button type="button" data-a="csv" title="Save as CSV">CSV</button>' +
        '<button type="button" class="del" data-a="del" title="Delete" aria-label="Delete">×</button></span></div>';
    });
    $("runs").innerHTML = html;
  }
  $("runs").addEventListener("click", function (e) {
    var row = e.target.closest(".run-row"); if (!row || st.busy) return;
    var r = st.runs.filter(function (x) { return x.id === row.getAttribute("data-id"); })[0]; if (!r) return;
    var a = e.target.getAttribute("data-a");
    if (e.target.hasAttribute("data-cmp")) { st.cmp[r.id] = e.target.checked; draw(); return; }
    if (a === "del") {
      if (!confirm("Delete “" + (r.label || PA.test(r.test).name) + "”?")) return;
      st.runs = st.runs.filter(function (x) { return x !== r; }); delete st.cmp[r.id];
      if (st.show === r.id) st.show = null;
      saveRuns(); draw(); renderRuns(); return;
    }
    if (a === "ren") { var n = prompt("Label for this measurement:", r.label || ""); if (n != null) { r.label = n.trim().slice(0, 60); saveRuns(); draw(); renderRuns(); } return; }
    if (a === "csv") { exportCsv(r); return; }
    st.show = r.id; st.live = null;
    if (test().id !== r.test) { $("test").value = r.test; renderTest(); }
    Object.keys(st.cmp).forEach(function (k) { var o = st.runs.filter(function (x) { return x.id === k; })[0]; if (!o || o.test !== r.test) delete st.cmp[k]; });
    draw(); renderRuns(); calibration();
  });
  $("btn-clear").addEventListener("click", function () {
    if (st.busy || !st.runs.length || !confirm("Delete all " + st.runs.length + " measurements in this browser?")) return;
    st.runs = []; st.cmp = {}; st.show = null; saveRuns(); draw(); renderRuns();
  });

  // ---------------------------------------------------------------- files
  function fileName(r, ext) {
    var t = PA.test(r.test), base = (r.label || t.name).replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "measurement";
    return base + "-" + r.date.slice(0, 16).replace(/[-:T]/g, "") + "." + ext;
  }
  function exportCsv(r) {
    var t = PA.test(r.test), lines = ["# Power Analyzer: " + t.name, "# Label: " + (r.label || ""), "# Date: " + r.date, "# Parameters: " + params(t, r.params)];
    lines.push(t.cols.join(","));
    r.rows.forEach(function (x) { lines.push(x.join(",")); });
    download(fileName(r, "csv"), new Blob([lines.join("\n") + "\n"], { type: "text/csv" }));
  }
  $("btn-csv").addEventListener("click", function () { var r = shownRun(); if (r) exportCsv(r); });
  $("btn-png").addEventListener("click", function () {
    var r = shownRun(); if (!r) return;
    var t = PA.test(r.test), list = [];
    try { list = t.summary(r.rows); } catch (e) { /* none */ }
    chart.png([r.label || t.name, t.name + ", " + new Date(r.date).toLocaleString()], list).toBlob(function (b) { download(fileName(r, "png"), b); });
  });
  $("btn-import").addEventListener("click", function () { $("file").click(); });
  $("file").addEventListener("change", function () {
    var f = this.files[0]; this.value = "";
    if (!f) return;
    f.text().then(function (txt) {
      var r = parseCsv(txt, f.name);
      st.runs.push(r); st.show = r.id; st.live = null;
      saveRuns();
      $("test").value = r.test; renderTest(); draw(); renderRuns();
      status("Opened " + f.name + " as " + PA.test(r.test).name.toLowerCase() + " (" + r.rows.length + " readings).");
    }).catch(function (e) { status("Cannot read " + f.name + ": " + e.message, "err"); });
  });
  function parseCsv(txt, name) {
    var t = null, label = "", date = null, rows = [], p = {};
    txt.split(/\r?\n/).forEach(function (l) {
      var m;
      if ((m = /^#\s*Power Analyzer:\s*(.+)$/.exec(l))) t = T.filter(function (x) { return x.name === m[1].trim(); })[0] || null;
      else if ((m = /^#\s*Label:\s*(.*)$/.exec(l))) label = m[1].trim();
      else if ((m = /^#\s*Date:\s*(.*)$/.exec(l))) date = m[1].trim();
      else if ((m = /^#\s*Parameters:\s*(.*)$/.exec(l))) { var nums = m[1].match(/-?\d+/g) || []; p.a = +nums[0]; if (nums[1] != null) p.b = +nums[1]; }
      else if (l.trim() && l[0] !== "#") {
        var v = l.trim().split(/[,;\t ]+/).map(Number);
        if (v.length >= 2 && v.every(function (x) { return !isNaN(x); })) rows.push(v);
      }
    });
    if (!rows.length) throw new Error("no readings found");
    if (!t) t = guess(rows);
    rows = rows.filter(function (r) { return r.length === t.cols.length; });
    if (p.a == null) t.params.forEach(function (x) { p[x.id] = "?"; });
    return { id: Date.now().toString(36), test: t.id, label: label || name.replace(/\.[^.]+$/, ""), date: date || new Date().toISOString(), params: p, rows: rows, sim: false };
  }
  // files of the Python program have no header: guess the test from the columns
  function guess(rows) {
    var n = rows[0].length, test = function (id) { return PA.test(id); };
    if (n === 2) return test("ripple");
    if (n === 4) return rows[rows.length - 1][3] > 0 || rows[0][0] === 0 ? test("bat") : test("cal");
    var inc = rows.every(function (r, i) { return !i || r[0] >= rows[i - 1][0]; });
    if (inc && rows[0][0] < 50 && rows.length > 20 && rows.every(function (r) { return Math.abs(r[2] - r[0] * r[1] / 1000) > 50 || r[0] < 100; })) {
      return rows[rows.length - 1][0] <= 1200 ? test("reg") : test("meter");
    }
    var powerLike = rows.filter(function (r) { return Math.abs(r[2] - r[0] * r[1] / 1000) <= Math.max(5, r[2] * 0.06); }).length;
    return powerLike > rows.length * 0.7 ? test("load") : test("eff");
  }

  // ---------------------------------------------------------------- start
  renderTest();
  meter(null);
  ui();
  document.addEventListener("visibilitychange", function () { if (!document.hidden && st.link) meter(null); });
})();
