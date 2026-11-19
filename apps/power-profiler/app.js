/* Power Profiler: the user interface */
(function () {
  "use strict";
  var PP = window.PP, $ = function (id) { return document.getElementById(id); };
  var amps = PP.amps, secs = PP.secs;

  var st = { dev: null, store: null, rec: false, acc: null, trig: null, stopAt: "", hold: 0 };
  var S = { mode: "source", volt: 3.3, rate: 100000, limit: 60, win: 5, log: false, mask: 0x0F, bat: 220, trig: "off", src: "up", level: "1m", bit: 0, tw: 10, pre: 20 };
  try { Object.assign(S, JSON.parse(localStorage.getItem("ppk.settings")) || {}); } catch (e) { /* defaults */ }
  function save() { try { localStorage.setItem("ppk.settings", JSON.stringify(S)); } catch (e) { /* not kept */ } }

  function num(s) {
    s = String(s == null ? "" : s).trim().replace(",", ".").replace(/[AV]$/i, "");
    var m = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s*([pnuµmk]?)$/.exec(s);
    return m ? parseFloat(m[1]) * ({ "": 1, p: 1e-12, n: 1e-9, u: 1e-6, "µ": 1e-6, m: 1e-3, k: 1e3 })[m[2]] : NaN;
  }
  function status(id, msg, cls) { var el = $(id); el.textContent = msg || ""; el.className = "status" + (cls ? " " + cls : ""); }
  function charge(c) { var a = Math.abs(c); return a >= 1 ? c.toFixed(3) + " C" : a >= 1e-3 ? (c * 1e3).toFixed(3) + " mC" : a >= 1e-6 ? (c * 1e6).toFixed(3) + " µC" : (c * 1e9).toFixed(2) + " nC"; }
  function energy(j) { var a = Math.abs(j); return a >= 1 ? j.toFixed(3) + " J" : a >= 1e-3 ? (j * 1e3).toFixed(3) + " mJ" : a >= 1e-6 ? (j * 1e6).toFixed(3) + " µJ" : (j * 1e9).toFixed(2) + " nJ"; }
  function mah(c) { var x = c / 3.6; return x >= 1 ? x.toFixed(3) + " mAh" : (x * 1000).toFixed(3) + " µAh"; }
  function bytes(n) { return n >= 1e9 ? (n / 1e9).toFixed(1) + " GB" : n >= 1e6 ? (n / 1e6).toFixed(0) + " MB" : (n / 1e3).toFixed(0) + " kB"; }

  // ================================================================ chart
  var chart = new PP.Chart($("chart"), {
    emptyText: "Connect the PPK2 or start the simulator, then start recording",
    onView: function () { liveUi(); statsSoon(); },
    onSelect: function () { $("z-sel").disabled = !chart.sel; statsSoon(); },
    onHover: function (s, v) {
      if (s == null || !v || !st.store) { $("hover").textContent = ""; return; }
      var bits = [];
      for (var b = 0; b < 8; b++) if (S.mask & (1 << b)) bits.push("D" + b + "=" + (v.mixed & (1 << b) ? "~" : (v.bits >> b) & 1));
      $("hover").textContent = secs(s / st.store.rate) + "   " + amps(v.avg, 3) + (v.max > v.min ? "   (" + amps(v.min, 2) + " … " + amps(v.max, 2) + ")" : "") + "   " + bits.join(" ");
    }
  });
  chart.win = S.win; chart.log = S.log; chart.mask = S.mask;

  // ================================================================ device
  function voltUi() {
    var src = S.mode === "source";
    $("mode-source").setAttribute("aria-pressed", String(src));
    $("mode-ampere").setAttribute("aria-pressed", String(!src));
    $("volt-label").textContent = src ? "Supply voltage" : "Voltage of the supply (for the calibration and the energy)";
    $("mode-hint").textContent = src ? "The PPK2 supplies the device at VOUT." : "The PPK2 measures in the supply line: supply to VIN, device to VOUT.";
    $("volt").value = S.volt.toFixed(2); $("volt-r").value = S.volt;
  }
  function devUi() {
    var on = !!st.dev;
    $("btn-connect").hidden = on; $("btn-sim").hidden = on; $("btn-disconnect").hidden = !on;
    $("dev-ctl").classList.toggle("off", !on);
    $("btn-rec").disabled = !on;
    $("dut").setAttribute("aria-pressed", String(on && st.dev.dut));
    $("dut").textContent = on && st.dev.dut ? "Power output on" : "Power output off";
    recUi();
  }
  async function attach(port) {
    var dev = new PP.PPK2(port, { onData: onData, onClose: onClose });
    status("dev-status", "Connecting …");
    try {
      await dev.open();
      st.dev = dev;
      if (dev.meta.mode === 1 || dev.meta.mode === 2) S.mode = dev.mode;
      await dev.setMode(S.mode);
      await dev.setVoltage(S.volt * 1000);
      var i = dev.info();
      status("dev-status", (i.sim ? "Simulator" : "PPK2") + " connected" + (i.hw ? ", hardware " + i.hw : "") + (i.calibrated ? ", calibrated" : i.sim ? "" : ", not calibrated") + ".", "ok");
    } catch (e) {
      try { await dev.close(); } catch (e2) { /* ignore */ }
      st.dev = null;
      status("dev-status", e.message || String(e), "err");
    }
    voltUi(); devUi();
  }
  function onClose(reason) {
    var was = st.dev;
    stopRec("The PPK2 was disconnected.");
    st.dev = null; devUi();
    if (was) status("dev-status", "The PPK2 was disconnected" + (reason && reason.message ? " (" + reason.message + ")" : "") + ".", "err");
  }
  $("btn-connect").addEventListener("click", async function () {
    if (!PP.PPK2.supported()) { status("dev-status", "This browser has no Web Serial. Use Chrome, Edge or Opera on the desktop, or try the simulator.", "err"); return; }
    var port;
    try { port = await PP.PPK2.request(); } catch (e) { status("dev-status", "No PPK2 chosen."); return; }
    attach(port);
  });
  $("btn-sim").addEventListener("click", function () { attach(new PP.SimPort()); });
  $("btn-disconnect").addEventListener("click", async function () {
    var d = st.dev;
    stopRec();
    st.dev = null;
    if (d) { try { if (d.dut) await d.setDut(false); } catch (e) { /* gone */ } await d.close(); }
    status("dev-status", "Disconnected.");
    devUi();
  });
  function setMode(m) {
    if (st.dev && st.dev.dut && m !== S.mode) { status("dev-status", "Switch the power output off before changing the mode.", "err"); return; }
    S.mode = m; save(); voltUi();
    if (st.dev) st.dev.setMode(m).then(function () { return st.dev && st.dev.setVoltage(S.volt * 1000); });
  }
  $("mode-source").addEventListener("click", function () { setMode("source"); });
  $("mode-ampere").addEventListener("click", function () { setMode("ampere"); });
  var vt = null;
  function setVolt(v, fromRange) {
    if (!(v >= 0.8 && v <= 5)) { $("volt").classList.add("bad"); return; }
    $("volt").classList.remove("bad");
    S.volt = Math.round(v * 1000) / 1000; save();
    if (fromRange) $("volt").value = S.volt.toFixed(2); else $("volt-r").value = S.volt;
    clearTimeout(vt);
    vt = setTimeout(function () { if (st.dev) st.dev.setVoltage(S.volt * 1000); statsSoon(); }, 120);
  }
  $("volt").addEventListener("input", function () { setVolt(num(this.value)); });
  $("volt").addEventListener("change", function () { if (S.volt) this.value = S.volt.toFixed(2); });
  $("volt-r").addEventListener("input", function () { setVolt(+this.value, true); });
  $("dut").addEventListener("click", async function () {
    if (!st.dev) return;
    await st.dev.setDut(!st.dev.dut);
    devUi();
  });

  // ================================================================ recording
  function memUi() {
    var n = S.rate * S.limit, b = n * 5.3;
    $("mem").textContent = "Up to " + n.toLocaleString("en") + " samples, " + bytes(b) + " of memory." + (b > 1.5e9 ? " That is more than a browser tab can hold: choose fewer samples per second." : "");
    $("mem").className = "hint" + (b > 1.5e9 ? " err" : "");
  }
  function recUi() {
    $("btn-rec").textContent = st.rec ? "Stop recording" : "Start recording";
    $("btn-rec").classList.toggle("rec", st.rec);
    $("btn-rec").classList.toggle("btn-primary", !st.rec);
    $("rate").disabled = st.rec; $("limit").disabled = st.rec;
    $("btn-save").disabled = st.rec || !st.store || !st.store.n;
    $("btn-csv").disabled = !st.store || !st.store.n;
    $("btn-open").disabled = st.rec;
  }
  async function startRec() {
    if (!st.dev || st.rec) return;
    var n = S.rate * S.limit;
    if (n * 5.3 > 1.5e9) { status("rec-status", "Too long for this number of samples per second.", "err"); return; }
    st.store = new PP.Store(S.rate, n);
    st.store.vdd = S.volt; st.store.mode = S.mode; st.store.date = new Date();
    st.acc = { k: Math.round(PP.RATE / S.rate), i: 0, sum: 0, cnt: 0, bits: 0 };
    st.trig = null; st.hold = 0; st.stopAt = "";
    armTrigger();
    chart.setStore(st.store); chart.follow = true;
    st.rec = true; recUi(); liveUi();
    status("rec-status", "Recording …");
    await st.dev.start();
    tick();
  }
  async function stopRec(why) {
    if (!st.rec) return;
    st.rec = false;
    if (st.dev && !st.dev.closed) { try { await st.dev.stop(); } catch (e) { /* gone */ } }
    recUi(); recStatus(why);
    if (!st.trigDone) chart.follow = false;
    chart.redraw(); liveUi(); stats();
  }
  function recStatus(why) {
    var s = st.store;
    if (!s) return;
    status("rec-status", (why ? why + " " : "") + secs(s.duration()) + ", " + s.n.toLocaleString("en") + " samples" + (s.lost ? ", " + s.lost.toLocaleString("en") + " lost (USB too slow?)" : "") + ".", why && /disconnected|limit/.test(why) ? "err" : "");
  }
  $("btn-rec").addEventListener("click", function () { if (st.rec) stopRec("Stopped."); else startRec(); });
  function onData(cur, bits, lost) {
    if (!st.rec) return;
    var a = st.acc, s = st.store, full = false;
    for (var i = 0; i < cur.length; i++) {
      var v = cur[i];
      if (a.k === 1) { if (!s.push(v, bits[i])) { full = true; break; } check(s.n - 1); continue; }
      if (v === v) { a.sum += v; a.cnt++; }
      a.bits = bits[i];
      if (++a.i === a.k) {
        if (!s.push(a.cnt ? a.sum / a.cnt : NaN, a.bits)) { full = true; break; }
        check(s.n - 1);
        a.i = 0; a.sum = 0; a.cnt = 0;
      }
    }
    if (full) stopRec("Recording limit reached:");
  }
  var last = 0;
  function tick() {
    if (!st.rec) return;
    var now = performance.now();
    if (now - last > 33) { last = now; chart.redraw(); }
    if (now - (tick.s || 0) > 400) { tick.s = now; recStatus(); stats(); }
    if (st.trig && st.trig.done) trigDone();
    requestAnimationFrame(tick);
  }

  // ================================================================ trigger
  function armTrigger() {
    st.trigDone = false;
    if (S.trig === "off") { st.trigCfg = null; status("trig-status", ""); return; }
    var lvl = num(S.level);
    st.trigCfg = { src: S.src, level: lvl, bit: 1 << S.bit, post: 0, pre: 0 };
    var w = Math.max(1e-4, num(S.tw) / 1000 || 0.01) * S.rate, pre = Math.max(0, Math.min(90, num(S.pre) || 0)) / 100;
    st.trigCfg.pre = Math.round(w * pre); st.trigCfg.post = Math.max(1, Math.round(w - st.trigCfg.pre));
    st.trig = null; st.prevV = null; st.prevB = null;
    status("trig-status", "Waiting for the trigger …");
  }
  function check(i) {
    var c = st.trigCfg;
    if (!c) return;
    var s = st.store, v = s.at(i), b = s.bitsAt(i), hit = false;
    if (st.trig) { if (i >= st.trig.end) st.trig.done = true; }
    else if (i >= st.hold && i >= c.pre) {
      if (c.src === "up") hit = st.prevV !== null && st.prevV < c.level && v >= c.level;
      else if (c.src === "down") hit = st.prevV !== null && st.prevV > c.level && v <= c.level;
      else if (c.src === "rise") hit = st.prevB !== null && !(st.prevB & c.bit) && (b & c.bit);
      else hit = st.prevB !== null && (st.prevB & c.bit) && !(b & c.bit);
      if (hit) { st.trig = { at: i, end: i + c.post, done: false }; chart.marks.push(i); }
    }
    if (v === v) st.prevV = v;
    st.prevB = b;
  }
  function trigDone() {
    var t = st.trig, c = st.trigCfg;
    st.trig = null; st.hold = t.end;
    chart.follow = false;
    chart.show(t.at - c.pre, t.end);
    chart.sel = [t.at - c.pre < 0 ? 0 : t.at - c.pre, Math.min(st.store.n, t.end)];
    $("z-sel").disabled = false;
    st.trigDone = true;
    status("trig-status", "Triggered at " + secs(t.at / st.store.rate) + (S.trig === "repeat" ? " (" + chart.marks.length + " so far); waiting for the next …" : "."));
    if (S.trig === "single") { st.trigCfg = null; stopRec("Triggered:"); }
    liveUi(); stats();
  }
  function trigUi() {
    $("trig").value = S.trig; $("trig-src").value = S.src; $("trig-level").value = S.level; $("trig-bit").value = S.bit; $("trig-win").value = S.tw; $("trig-pre").value = S.pre;
    var logic = S.src === "rise" || S.src === "fall";
    $("trig-level-f").hidden = logic; $("trig-bit-f").hidden = !logic;
    ["trig-src", "trig-level", "trig-bit", "trig-win", "trig-pre"].forEach(function (id) { $(id).disabled = S.trig === "off"; });
  }
  [["trig", "trig"], ["trig-src", "src"], ["trig-level", "level"], ["trig-bit", "bit"], ["trig-win", "tw"], ["trig-pre", "pre"]].forEach(function (p) {
    $(p[0]).addEventListener(p[0] === "trig" || p[0] === "trig-src" || p[0] === "trig-bit" ? "change" : "input", function () {
      S[p[1]] = p[1] === "bit" ? +this.value : this.value; save(); trigUi();
      if (p[1] === "level") this.classList.toggle("bad", !isFinite(num(this.value)));
      if (st.rec) armTrigger();
    });
  });

  // ================================================================ statistics
  var sT = null;
  function statsSoon() { clearTimeout(sT); sT = setTimeout(stats, 60); }
  function summary(a, b) {
    var s = st.store;
    if (!s || !(b > a)) return null;
    var o = s.range(a, b);
    if (!o.cnt) return null;
    var dur = (b - a) / s.rate, avg = o.sum / o.cnt, v = s.vdd || S.volt;
    return { dur: dur, avg: avg, min: o.min, max: o.max, q: avg * dur, e: avg * dur * v };
  }
  function stats() {
    var vis = chart.visible(), a = summary(vis[0], vis[1]), b = chart.sel ? summary(chart.sel[0], chart.sel[1]) : null;
    var rows = [["Duration", function (x) { return secs(x.dur); }], ["Average", function (x) { return amps(x.avg, 3); }], ["Minimum", function (x) { return amps(x.min, 2); }],
      ["Maximum", function (x) { return amps(x.max, 2); }], ["Charge", function (x) { return charge(x.q) + " · " + mah(x.q); }], ["Energy", function (x) { return energy(x.e); }]];
    $("stats").innerHTML = rows.map(function (r) {
      return "<tr><td>" + r[0] + "</td><td>" + (a ? r[1](a) : "–") + '</td><td class="sel">' + (b ? r[1](b) : "–") + "</td></tr>";
    }).join("");
    var x = b || a, cap = num($("bat").value);
    $("bat").classList.toggle("bad", !(cap > 0));
    if (x && cap > 0 && x.avg > 0) {
      var h = cap / 1000 / x.avg;
      $("bat-out").innerHTML = "With the average of the " + (b ? "selection" : "visible part") + " (" + amps(x.avg, 2) + ") the battery lasts about<br><b class=\"big\">" +
        (h < 48 ? h.toFixed(1) + " hours" : h < 24 * 90 ? (h / 24).toFixed(1) + " days" : (h / 24 / 365).toFixed(2) + " years") + "</b>" +
        (h > 24 * 365 ? "<br>(the self-discharge of the battery will come first)" : "");
    } else $("bat-out").textContent = "Select a stretch that repeats, for example one wake-up cycle, to see how long a battery lasts.";
  }
  $("bat").value = S.bat;
  $("bat").addEventListener("input", function () { S.bat = this.value; save(); stats(); });

  // ================================================================ chart controls
  function liveUi() {
    $("live").setAttribute("aria-pressed", String(chart.follow));
    $("z-sel").disabled = !chart.sel;
  }
  $("live").addEventListener("click", function () { chart.follow = true; chart.redraw(); liveUi(); statsSoon(); });
  $("win").value = S.win;
  $("win").addEventListener("change", function () { S.win = +this.value; chart.win = S.win; save(); chart.follow = true; chart.redraw(); liveUi(); statsSoon(); });
  $("z-in").addEventListener("click", function () { chart.zoomAt(0.5); });
  $("z-out").addEventListener("click", function () { chart.zoomAt(2); });
  $("z-fit").addEventListener("click", function () { chart.fit(); });
  $("z-sel").addEventListener("click", function () { if (chart.sel) chart.show(chart.sel[0], chart.sel[1]); });
  $("log").checked = S.log;
  $("log").addEventListener("change", function () { S.log = chart.log = this.checked; save(); chart.cache = {}; chart.redraw(); });
  function dragUi() { $("drag-sel").setAttribute("aria-pressed", String(chart.mode === "select")); $("drag-move").setAttribute("aria-pressed", String(chart.mode === "move")); }
  $("drag-sel").addEventListener("click", function () { chart.mode = "select"; dragUi(); });
  $("drag-move").addEventListener("click", function () { chart.mode = "move"; dragUi(); });
  var BITC = ["#6b7480", "#b5763c", "#e5484d", "#f08c2e", "#c9a400", "#3fb950", "#4c9aff", "#a070e0"];
  function bitsUi() {
    $("bits").innerHTML = BITC.map(function (c, b) {
      var on = !!(S.mask & (1 << b));
      return '<button type="button" data-b="' + b + '" aria-pressed="' + on + '" style="' + (on ? "background:" + c : "") + '" title="Show logic input D' + b + '">D' + b + "</button>";
    }).join("");
  }
  $("bits").addEventListener("click", function (e) {
    var t = e.target.closest("button"); if (!t) return;
    S.mask ^= 1 << +t.dataset.b; chart.mask = S.mask; save(); bitsUi(); chart.layout();
  });

  // ================================================================ settings of the recording
  $("rate").value = S.rate; $("limit").value = S.limit;
  $("rate").addEventListener("change", function () { S.rate = +this.value; save(); memUi(); });
  $("limit").addEventListener("change", function () { S.limit = +this.value; save(); memUi(); });

  // ================================================================ files
  var MAGIC = "PPREC1\n";
  async function gzip(blob) { return new Response(blob.stream().pipeThrough(new CompressionStream("gzip"))).blob(); }
  async function gunzip(blob) { return new Response(blob.stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer(); }
  function download(name, blob) {
    var a = document.createElement("a"), url = URL.createObjectURL(blob);
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
  }
  function stamp() { var d = st.store.date || new Date(), p = function (n) { return String(n).padStart(2, "0"); }; return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "_" + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()); }
  $("btn-save").addEventListener("click", async function () {
    var s = st.store; if (!s || !s.n) return;
    status("file-status", "Saving …");
    var head = JSON.stringify({ rate: s.rate, n: s.n, vdd: s.vdd, mode: s.mode, date: (s.date || new Date()).toISOString(), marks: chart.marks });
    var parts = [MAGIC, head + "\n"];
    var cn = Math.ceil(s.n / 65536);
    for (var c = 0; c < cn; c++) { var len = Math.min(65536, s.n - c * 65536); parts.push(s.cur[c].subarray(0, len)); }
    for (var c2 = 0; c2 < cn; c2++) { var len2 = Math.min(65536, s.n - c2 * 65536); parts.push(s.bits[c2].subarray(0, len2)); }
    var blob = await gzip(new Blob(parts));
    download("power_" + stamp() + ".pprec", blob);
    status("file-status", "Saved " + bytes(blob.size) + ".", "ok");
  });
  $("btn-open").addEventListener("click", function () { $("file").click(); });
  $("file").addEventListener("change", async function () {
    var f = this.files[0]; this.value = "";
    if (!f) return;
    status("file-status", "Opening …");
    try {
      var buf = await gunzip(f), u8 = new Uint8Array(buf), txt = new TextDecoder().decode(u8.subarray(0, 600));
      if (txt.indexOf(MAGIC) !== 0) throw new Error("not a recording of this app");
      var nl = txt.indexOf("\n", MAGIC.length), head = JSON.parse(txt.slice(MAGIC.length, nl)), off = new TextEncoder().encode(txt.slice(0, nl + 1)).length;
      var n = head.n, cur = new Float32Array(buf.slice(off, off + n * 4)), bits = new Uint8Array(buf, off + n * 4, n);
      var s = PP.Store.from(head.rate, cur, bits);
      s.vdd = head.vdd; s.mode = head.mode; s.date = new Date(head.date);
      st.store = s;
      chart.setStore(s); chart.marks = head.marks || []; chart.fit();
      recUi(); stats();
      status("file-status", "Opened " + f.name + ": " + secs(s.duration()) + " at " + s.rate.toLocaleString("en") + " samples per second, " + (s.mode === "ampere" ? "ampere meter" : "source meter") + " " + (s.vdd || 0).toFixed(2) + " V.", "ok");
      status("rec-status", "");
    } catch (e) { status("file-status", "Cannot open " + f.name + ": " + e.message + ".", "err"); }
  });
  $("btn-csv").addEventListener("click", function () {
    var s = st.store; if (!s || !s.n) return;
    var r = chart.sel || chart.visible(), a = Math.max(0, Math.floor(r[0])), b = Math.min(s.n, Math.ceil(r[1]));
    if (b - a > 5e6) { status("file-status", "That is " + (b - a).toLocaleString("en") + " lines; select a shorter stretch (up to 5 million).", "err"); return; }
    var parts = ["Time (s),Current (uA),D0,D1,D2,D3,D4,D5,D6,D7\r\n"], dec = s.rate >= 100000 ? 5 : s.rate >= 1000 ? 3 : 2, lines = [];
    for (var i = a; i < b; i++) {
      var v = s.at(i), bt = s.bitsAt(i);
      lines.push((i / s.rate).toFixed(dec) + "," + (v === v ? (v * 1e6).toFixed(4) : "") + "," + (bt & 1) + "," + (bt >> 1 & 1) + "," + (bt >> 2 & 1) + "," + (bt >> 3 & 1) + "," + (bt >> 4 & 1) + "," + (bt >> 5 & 1) + "," + (bt >> 6 & 1) + "," + (bt >> 7 & 1));
      if (lines.length === 100000) { parts.push(lines.join("\r\n") + "\r\n"); lines = []; }
    }
    if (lines.length) parts.push(lines.join("\r\n") + "\r\n");
    download("power_" + stamp() + ".csv", new Blob(parts, { type: "text/csv" }));
    status("file-status", "Exported " + (b - a).toLocaleString("en") + " samples (" + (chart.sel ? "selection" : "visible part") + ").", "ok");
  });

  // ================================================================ start
  voltUi(); devUi(); memUi(); trigUi(); bitsUi(); dragUi(); liveUi(); stats();
  if (!PP.PPK2.supported()) status("dev-status", "This browser has no Web Serial (Chrome, Edge or Opera on the desktop needed); the simulator works here too.");
  window.addEventListener("beforeunload", function () { if (st.dev) st.dev.close(); });
  window.PPAPP = { st: st, chart: chart, S: S };
})();
