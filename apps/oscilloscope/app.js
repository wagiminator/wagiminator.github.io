/* USB Oscilloscope: the controls. Device and acquisition: js/hantek.js and js/scope.js; screen: js/display.js. */
(function () {
  "use strict";
  var OSC = window.OSC, $ = function (id) { return document.getElementById(id); };
  var fmtV = OSC.fmtV, fmtT = OSC.fmtT, fmtF = OSC.fmtF;

  // ---------------------------------------------------------------- settings
  var KEY = "osc-settings", ZKEY = "osc-zero";
  function defaults() {
    return {
      ch: [{ on: true, range: 6, probe: 1, pos: 1, coupling: "DC" }, { on: true, range: 6, probe: 1, pos: -2, coupling: "DC" }],
      tdiv: 2e-4, hpos: 50, rate: "auto", calFreq: 1000,
      trig: { mode: "auto", src: 0, slope: "rise", level: 1 },
      xy: false, curOn: false, cursors: { a: -4e-4, b: 4e-4 }, fft: false, fftCh: 0, fftSpan: 1, theme: "dark"
    };
  }
  function load(key) { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch (e) { return null; } }
  function store(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  var S = (function () {
    var d = defaults(), s = load(KEY);
    if (!s || !s.ch || s.ch.length !== 2) return d;
    var m = Object.assign(d, s);
    m.trig = Object.assign(defaults().trig, s.trig || {});
    m.cursors = Object.assign(defaults().cursors, s.cursors || {});
    m.ch = [0, 1].map(function (c) { return Object.assign(defaults().ch[c], s.ch[c] || {}); });
    if (OSC.TDIV.indexOf(m.tdiv) < 0) m.tdiv = d.tdiv;
    return m;
  })();
  var saveT = 0;
  function save() { clearTimeout(saveT); saveT = setTimeout(function () { store(KEY, S); }, 300); }

  // ---------------------------------------------------------------- state
  var dev = null, engine = null, frame = null, spec = null, clip = [false, false], status = "", statusColor = null, lastMeas = 0, busy = false;
  var screen = new OSC.Screen($("screen"), $("spec"), {
    onPos: function (c, v) { S.ch[c].pos = v; syncCh(c); changed(); },
    onLevel: function (v) { S.trig.level = round3(v); syncTrig(); changed(); },
    onHpos: function (p) { S.hpos = p; syncH(); changed(); },
    onCursor: function (k, t) { S.cursors[k] = t; changed(); }
  });

  function round3(v) { var a = Math.abs(v); return a === 0 ? 0 : +v.toPrecision(a >= 1 ? 3 : 2); }
  function parseNum(s) { var v = parseFloat(String(s).replace(",", ".").trim()); return isFinite(v) ? v : null; }
  function setStatus(t, cls) { var el = $("dev-status"); el.textContent = t; el.className = "status" + (cls ? " " + cls : ""); }
  function pressed(group, v) { group.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.v === String(v))); }); }

  // ---------------------------------------------------------------- channels
  function vdivLabel(g, probe) { return fmtV(OSC.VDIV[g] * probe) + "/div"; }
  function buildCh(c) {
    var el = $("ch" + c), n = c + 1;
    el.innerHTML =
      '<div class="ch-head"><label class="check"><input type="checkbox" data-k="on"> CH' + n + '</label>' +
      '<div class="seg" role="group" aria-label="Coupling of CH' + n + '" data-k="coupling"><button type="button" data-v="DC">DC</button><button type="button" data-v="AC">AC</button></div></div>' +
      '<div class="ch-grid">' +
      '<label class="field"><span>Volts / div</span><select data-k="range" aria-label="Volts per division of CH' + n + '"></select></label>' +
      '<div class="field"><span>Probe</span><div class="seg" role="group" aria-label="Probe of CH' + n + '" data-k="probe"><button type="button" data-v="1">1×</button><button type="button" data-v="10">10×</button></div></div>' +
      '<label class="field wide"><span>Position <output data-k="pos-out"></output></span><input type="range" min="-4" max="4" step="0.1" data-k="pos" aria-label="Position of CH' + n + ' in divisions"></label>' +
      '</div>';
    var q = function (k) { return el.querySelector('[data-k="' + k + '"]'); };
    q("on").addEventListener("change", function () { S.ch[c].on = this.checked; syncCh(c); changed(true); });
    q("range").addEventListener("change", function () { S.ch[c].range = +this.value; changed(true); });
    q("pos").addEventListener("input", function () { S.ch[c].pos = +this.value; syncCh(c); changed(); });
    q("pos").addEventListener("dblclick", function () { S.ch[c].pos = 0; syncCh(c); changed(); });
    q("probe").addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; S.ch[c].probe = +b.dataset.v; syncCh(c); syncTrig(); changed(true); });
    q("coupling").addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; S.ch[c].coupling = b.dataset.v; syncCh(c); changed(true); });
  }
  function syncCh(c) {
    var el = $("ch" + c), s = S.ch[c], q = function (k) { return el.querySelector('[data-k="' + k + '"]'); };
    q("on").checked = s.on; el.classList.toggle("off", !s.on);
    var sel = q("range");
    sel.innerHTML = OSC.VDIV.map(function (v, g) { return '<option value="' + g + '">' + vdivLabel(g, s.probe) + "</option>"; }).join("");
    sel.value = s.range;
    pressed(q("probe"), s.probe); pressed(q("coupling"), s.coupling);
    q("pos").value = s.pos; q("pos-out").textContent = (s.pos > 0 ? "+" : "") + s.pos.toFixed(1) + " div";
  }

  // ---------------------------------------------------------------- horizontal
  $("tdiv").innerHTML = OSC.TDIV.map(function (t) { return '<option value="' + t + '">' + fmtT(t) + "/div" + (t >= OSC.ROLL_FROM ? " (roll)" : "") + "</option>"; }).join("");
  $("rate").innerHTML = '<option value="auto">Automatic</option>' + OSC.RATES.filter(function (r) { return r[0] <= OSC.MAX_RATE[1]; })
    .map(function (r) { return '<option value="' + r[0] + '">' + fmtRate(r[0]) + "</option>"; }).join("");
  function fmtRate(r) { return r >= 1e6 ? r / 1e6 + " MS/s" : r / 1e3 + " kS/s"; }
  function setTdiv(t) {
    var old = S.tdiv; S.tdiv = t;
    // the cursors keep their place on the screen
    S.cursors.a *= t / old; S.cursors.b *= t / old;
    syncH(); changed(true);
  }
  $("tdiv").addEventListener("change", function () { setTdiv(+this.value); });
  $("t-dn").addEventListener("click", function () { var i = OSC.TDIV.indexOf(S.tdiv); if (i > 0) setTdiv(OSC.TDIV[i - 1]); });
  $("t-up").addEventListener("click", function () { var i = OSC.TDIV.indexOf(S.tdiv); if (i < OSC.TDIV.length - 1) setTdiv(OSC.TDIV[i + 1]); });
  $("hpos").addEventListener("input", function () { S.hpos = +this.value; syncH(); changed(); });
  $("hpos").addEventListener("dblclick", function () { S.hpos = 50; syncH(); changed(); });
  $("rate").addEventListener("change", function () { S.rate = this.value === "auto" ? "auto" : +this.value; syncH(); changed(true); });
  function plan() { return (engine || new OSC.Engine(null, S, {})).plan(); }
  function syncH() {
    $("tdiv").value = S.tdiv; $("hpos").value = S.hpos; $("hpos-out").textContent = S.hpos + " %";
    $("rate").value = String(S.rate);
    var p = plan(), txt = fmtRate(p.rate) + ", " + p.channels + (p.channels > 1 ? " channels" : " channel") + ", " + p.n.toLocaleString("en") + " samples per screen";
    if (S.rate !== "auto" && p.rate !== +S.rate) txt += " (" + fmtRate(+S.rate) + " " + (+S.rate > OSC.MAX_RATE[p.channels] ? "is too fast for " + p.channels + " channels" : "would need too many samples") + ")";
    if (p.roll) txt += ". Roll mode.";
    $("rate-info").textContent = txt;
    syncSpan(p.rate);
  }

  // ---------------------------------------------------------------- trigger
  $("trig-mode").addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; S.trig.mode = b.dataset.v; syncTrig(); changed(); });
  $("trig-src").addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; S.trig.src = +b.dataset.v; syncTrig(); changed(); });
  $("trig-slope").addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; S.trig.slope = b.dataset.v; syncTrig(); changed(); });
  $("trig-level").addEventListener("change", function () {
    var v = parseNum(this.value);
    this.classList.toggle("bad", v === null);
    if (v === null) return;
    S.trig.level = v; syncTrig(); changed();
  });
  $("trig-50").addEventListener("click", function () {
    var d = frame && frame.ch[S.trig.src];
    if (!d || !d.length) return;
    var m = OSC.measure(d, frame.rate);
    S.trig.level = round3((m.max + m.min) / 2); syncTrig(); changed();
  });
  function syncTrig() {
    pressed($("trig-mode"), S.trig.mode); pressed($("trig-src"), S.trig.src); pressed($("trig-slope"), S.trig.slope);
    var inp = $("trig-level");
    if (document.activeElement !== inp) { inp.value = String(S.trig.level); inp.classList.remove("bad"); }
  }

  // ---------------------------------------------------------------- display
  function setTheme(t) {
    S.theme = t; screen.theme = t;
    document.querySelectorAll(".screen").forEach(function (e) { e.classList.toggle("light", t === "light"); });
    $("bg-dark").setAttribute("aria-pressed", String(t !== "light")); $("bg-light").setAttribute("aria-pressed", String(t === "light"));
    save(); redraw();
  }
  $("bg-dark").addEventListener("click", function () { setTheme("dark"); });
  $("bg-light").addEventListener("click", function () { setTheme("light"); });
  $("cursors").addEventListener("change", function () {
    S.curOn = this.checked;
    var inView = function (t) { return t >= -S.hpos / 100 * 10 * S.tdiv && t <= (1 - S.hpos / 100) * 10 * S.tdiv; };
    if (S.curOn && (!inView(S.cursors.a) || !inView(S.cursors.b))) { S.cursors.a = -2 * S.tdiv; S.cursors.b = 2 * S.tdiv; }
    changed();
  });
  $("xy").addEventListener("change", function () { S.xy = this.checked; changed(); });
  $("fft").addEventListener("change", function () { S.fft = this.checked; $("spec-wrap").hidden = !S.fft; spec = null; screen.size(); changed(); });
  $("fft-ch").addEventListener("change", function () { S.fftCh = +this.value; spec = null; changed(); });
  $("fft-span").addEventListener("change", function () { S.fftSpan = +this.value; if (spec) spec.span = S.fftSpan; changed(); });
  var SPANS = [1, 1 / 4, 1 / 16, 1 / 64];
  function syncSpan(rate) {
    var sel = $("fft-span");
    sel.innerHTML = SPANS.map(function (k) { return '<option value="' + k + '">' + fmtF(rate / 2 * k) + "</option>"; }).join("");
    if (SPANS.indexOf(S.fftSpan) < 0) S.fftSpan = 1;
    sel.value = String(S.fftSpan);
  }
  function syncDisplay() {
    $("cursors").checked = S.curOn; $("xy").checked = S.xy; $("fft").checked = S.fft; $("fft-ch").value = S.fftCh;
    $("spec-wrap").hidden = !S.fft;
  }

  // ---------------------------------------------------------------- calibration
  $("calfreq").innerHTML = OSC.CAL_FREQS.map(function (f) { return '<option value="' + f + '">' + fmtF(f) + "</option>"; }).join("");
  $("calfreq").addEventListener("change", function () { S.calFreq = +this.value; changed(true); });
  function zeroKey() { return dev && dev.prof ? dev.prof.id : ""; }
  function zeroOf() { var all = load(ZKEY) || {}, id = zeroKey(), out = {}; Object.keys(all).forEach(function (k) { if (k.split(":")[0] === id) out[k] = all[k]; }); return out; }
  function syncCal() {
    var z = engine ? Object.keys(engine.zero).length : 0, t = "";
    if (dev) {
      t = dev.cal ? "Offsets and gains from the EEPROM of the scope are used." : dev.prof && dev.prof.id === "sim" ? "" : "No calibration values in the EEPROM.";
      if (z) t += (t ? " " : "") + "Own zero offsets for " + z / 2 + " ranges are used.";
    }
    $("cal-info").textContent = t;
    $("btn-zero").disabled = !dev || busy;
    $("btn-zero-clear").disabled = !dev || busy || !z;
  }
  $("btn-zero").addEventListener("click", async function () {
    if (!engine || busy) return;
    if (!confirmZero()) return;
    busy = true; syncButtons();
    var was = engine.running;
    try {
      await engine.halt();
      var out = await engine.calibrateZero(function (g) { setStatus("Zero offsets: measuring " + vdivLabel(g, 1) + " (" + (g + 1) + " of 8) …"); });
      var all = load(ZKEY) || {};
      Object.assign(all, out); store(ZKEY, all);
      engine.zero = zeroOf();
      setStatus("Zero offsets measured and kept in this browser.", "ok");
    } catch (e) { fail(e); }
    busy = false; syncButtons(); syncCal();
    if (was && dev) run(true);
  });
  // a short inline confirmation: the button asks once and acts on the second click
  var zeroArmed = 0;
  function confirmZero() {
    var b = $("btn-zero");
    if (Date.now() - zeroArmed < 5000) { zeroArmed = 0; b.textContent = "Zero offsets"; return true; }
    zeroArmed = Date.now(); b.textContent = "Inputs on ground? Click again";
    setTimeout(function () { if (zeroArmed && Date.now() - zeroArmed >= 5000) { zeroArmed = 0; b.textContent = "Zero offsets"; } }, 5100);
    return false;
  }
  $("btn-zero-clear").addEventListener("click", function () {
    var all = load(ZKEY) || {}, id = zeroKey();
    Object.keys(all).forEach(function (k) { if (k.split(":")[0] === id) delete all[k]; });
    store(ZKEY, all);
    if (engine) { engine.zero = {}; engine.dirty = true; }
    syncCal();
  });

  // ---------------------------------------------------------------- device
  function syncButtons() {
    var on = !!dev, run = engine && engine.running;
    $("btn-connect").hidden = on; $("btn-sim").hidden = on; $("btn-disconnect").hidden = !on;
    $("btn-run").disabled = !on || busy; $("btn-single").disabled = !on || busy; $("btn-auto").disabled = !on || busy;
    $("btn-run").textContent = run ? "Stop" : "Run"; $("btn-run").classList.toggle("on", !!run);
    $("btn-csv").disabled = !frame; $("btn-png").disabled = !frame;
    syncCal();
  }
  function fail(e) {
    console.error(e);
    var msg = e && e.message ? e.message : String(e);
    if (e && e.name === "NetworkError") msg = "The connection to the oscilloscope was lost (" + msg + ").";
    setStatus(msg, "err");
  }
  function attach(d, text) {
    dev = d;
    engine = new OSC.Engine(dev, S, {
      onFrame: onFrame,
      onState: function (st) {
        if (st === "waiting") { status = "Waiting for trigger"; statusColor = "#e0a000"; redraw(); return; }
        if (st === "stopped" || st === "single") { status = "Stopped"; statusColor = null; syncButtons(); redraw(); }
      },
      onError: function (e) { fail(e); status = "Stopped"; syncButtons(); redraw(); }
    });
    engine.zero = zeroOf();
    setStatus(text, "ok");
    syncButtons(); syncH();
    run(true);
  }
  $("btn-sim").addEventListener("click", async function () {
    var d = new OSC.Sim();
    attach(d, await d.connect());
  });
  $("btn-connect").addEventListener("click", async function () {
    if (!OSC.Hantek.supported()) { setStatus("WebUSB is not available in this browser. Use Chrome, Edge or Opera on the desktop; the simulator works anyway.", "err"); return; }
    var h = new OSC.Hantek(), b = this;
    b.disabled = true;
    try {
      // a scope that already runs the firmware and was allowed before needs no picker
      var known = (await navigator.usb.getDevices()).filter(function (x) { return h.loaded(x) && OSC.PROFILES.some(function (p) { return p.hot[0] === x.vendorId && p.hot[1] === x.productId; }); })[0];
      var text = known ? await h.prepare(known, setStatus) : await h.connect(setStatus);
      attach(h, text);
    } catch (e) {
      if (e && e.again) setStatus("The firmware is loaded and the scope has started again as “OpenHantek” device. Click “Connect scope” once more and choose it.", "ok");
      else if (e && e.name === "NotFoundError") setStatus("No oscilloscope chosen.");
      else fail(e);
    }
    b.disabled = false;
  });
  $("btn-disconnect").addEventListener("click", disconnect);
  async function disconnect() {
    if (!dev) return;
    var d = dev;
    if (engine) await engine.halt().catch(function () {});
    await d.disconnect();
    dev = null; engine = null; status = ""; setStatus("Not connected.");
    syncButtons(); redraw();
  }
  if (navigator.usb) navigator.usb.addEventListener("disconnect", function (e) {
    if (dev && dev.dev && e.device === dev.dev) {
      if (engine) engine.stop();
      dev.dev = null; dev = null; engine = null; status = "";
      setStatus("The oscilloscope was unplugged.", "err"); syncButtons(); redraw();
    }
  });

  // ---------------------------------------------------------------- run / stop
  function run(on) {
    if (!engine) return;
    if (on) { status = S.trig.mode === "single" ? "Waiting for trigger" : "Running"; statusColor = null; engine.start(); }
    else engine.stop();
    syncButtons(); redraw();
  }
  $("btn-run").addEventListener("click", function () { run(!(engine && engine.running)); });
  $("btn-single").addEventListener("click", async function () {
    if (!engine) return;
    await engine.halt();
    S.trig.mode = "single"; syncTrig(); save();
    run(true);
  });

  // ---------------------------------------------------------------- auto set
  $("btn-auto").addEventListener("click", async function () {
    if (!engine || busy) return;
    busy = true; syncButtons();
    try {
      await engine.halt();
      await autoSet();
      setStatus("Auto set done.", "ok");
    } catch (e) { fail(e); }
    busy = false; engine.cfg = null;
    syncAll(); run(true);
  });
  async function grab(rate, range, n) {
    var p = { channels: S.ch[1].on ? 2 : 1, rate: Math.min(rate, OSC.MAX_RATE[S.ch[1].on ? 2 : 1]), n: n, roll: false, range: range, coupling: [S.ch[0].coupling, S.ch[1].coupling], calFreq: S.calFreq };
    await dev.configure(p);
    var raw = await dev.capture(n * p.channels);
    return [0, 1].map(function (c) { return c < p.channels && S.ch[c].on ? { d: engine.volts(raw, p, c), rate: p.rate } : null; });
  }
  async function autoSet() {
    var on = [0, 1].filter(function (c) { return S.ch[c].on; });
    if (!on.length) { S.ch[0].on = true; on = [0]; }
    setStatus("Auto set: measuring the amplitude …");
    var a = await grab(1e6, [7, 7], 20000), range = [7, 7];
    // the smallest range in which the signal still fits (into half the screen with two channels)
    var fitDiv = on.length > 1 ? 3.4 : 6.5;
    on.forEach(function (c) {
      var m = OSC.measure(a[c].d, a[c].rate), probe = S.ch[c].probe, need = Math.max(m.pp, 0.01 * probe) / fitDiv;
      for (var g = 0; g < 8; g++) if (OSC.VDIV[g] * probe >= need || g === 7) { range[c] = g; break; }
    });
    setStatus("Auto set: measuring the frequency …");
    var b = await grab(1e6, range, 20000), info = [];
    on.forEach(function (c) {
      var m = OSC.measure(b[c].d, b[c].rate);
      if (b[c].d.clip && range[c] < 7) { range[c]++; }
      info[c] = m;
    });
    // slow signals: once more at a low rate
    if (!on.some(function (c) { return info[c].freq; })) {
      var s = await grab(20e3, range, 20000);
      on.forEach(function (c) { var m = OSC.measure(s[c].d, s[c].rate); if (m.freq) info[c] = m; });
    }
    // fast signals: once more at the highest rate
    if (on.some(function (c) { return info[c].freq > 50e3; })) {
      var f = await grab(30e6, range, 60000);
      on.forEach(function (c) { var m = OSC.measure(f[c].d, f[c].rate); if (m.freq) info[c].freq = m.freq; });
    }
    on.forEach(function (c) {
      var m = info[c], vd = OSC.VDIV[range[c]] * S.ch[c].probe, mid = (m.max + m.min) / 2;
      S.ch[c].range = range[c];
      var centre = on.length > 1 ? (c === 0 ? 2 : -2) : 0;
      S.ch[c].pos = Math.max(-4, Math.min(4, Math.round((centre - mid / vd) * 10) / 10));
    });
    var src = on.filter(function (c) { return info[c].freq; })[0];
    if (src === undefined) src = on[0];
    var fq = info[src].freq;
    if (fq) {
      // about two to five periods on the screen
      var want = 2.5 / fq / 10, t = OSC.TDIV.filter(function (x) { return x >= want; })[0] || OSC.TDIV[OSC.TDIV.length - 1];
      S.tdiv = Math.min(t, 0.05);
    }
    S.hpos = 50; S.rate = "auto";
    S.trig.src = src; S.trig.slope = "rise"; S.trig.mode = "auto";
    S.trig.level = round3((info[src].max + info[src].min) / 2);
    S.cursors = { a: -2 * S.tdiv, b: 2 * S.tdiv };
    save();
  }

  // ---------------------------------------------------------------- frames, measurements, readout
  var pending = false;
  function onFrame(f) {
    frame = f;
    clip = [!!(f.ch[0] && f.ch[0].clip), !!(f.ch[1] && f.ch[1].clip)];
    if (f.roll) { status = "Roll"; statusColor = null; }
    else if (!engine || engine.running || f.triggered) { status = f.triggered ? "Triggered" : "Auto (no trigger)"; statusColor = f.triggered ? "#2ea043" : "#e0a000"; }
    spec = null;
    if (S.fft && f.ch[S.fftCh]) { spec = OSC.spectrum(f.ch[S.fftCh], f.rate); if (spec) { spec.ch = S.fftCh; spec.span = S.fftSpan; } }
    if (!pending) { pending = true; requestAnimationFrame(function () { pending = false; redraw(); }); }
    var now = performance.now();
    if (now - lastMeas > 250) { lastMeas = now; measureTable(); }
    if ($("btn-csv").disabled) syncButtons();
  }
  function redraw() {
    var p = plan(), info = dev ? fmtRate(frame ? frame.rate : p.rate) + ", " + (frame ? frame.n : p.n).toLocaleString("en") + " points" : "";
    screen.set({ S: S, frame: frame, status: dev ? status : "Not connected", statusColor: statusColor, info: info, clip: clip, spec: S.fft ? spec : null });
    readout();
  }
  var COLS = [["Frequency", "freq", fmtF], ["Period", "period", fmtT], ["Duty", "duty", function (v) { return (v * 100).toFixed(1) + " %"; }],
    ["Vpp", "pp", fmtV], ["Min", "min", fmtV], ["Max", "max", fmtV], ["Mean", "mean", fmtV], ["RMS", "rms", fmtV], ["AC RMS", "acrms", fmtV]];
  function measureTable() {
    var t = $("meas"), rows = [];
    if (frame) [0, 1].forEach(function (c) {
      var d = frame.ch[c];
      if (!d || !S.ch[c].on || !d.length) return;
      var m = OSC.measure(d, frame.rate, 0.2 * OSC.VDIV[S.ch[c].range] * S.ch[c].probe);
      rows.push('<tr class="c' + c + '"><td>CH' + (c + 1) + "</td>" + COLS.map(function (k) { var v = m[k[1]]; return "<td>" + (v == null || !isFinite(v) ? "–" : k[2](v)) + "</td>"; }).join("") + "</tr>");
    });
    t.innerHTML = rows.length ? "<thead><tr><th>Channel</th>" + COLS.map(function (k) { return "<th>" + k[0] + "</th>"; }).join("") + "</tr></thead><tbody>" + rows.join("") + "</tbody>" : "";
  }
  // value of channel c at time t (s, relative to the trigger point) in the current frame
  function valueAt(c, t) {
    var d = frame && frame.ch[c]; if (!d || !d.length) return null;
    var i = frame.roll ? d.length - 1 - Math.round(((1 - S.hpos / 100) * 10 * S.tdiv - t) * frame.rate) : Math.round(t * frame.rate + frame.pre + frame.frac);
    return i >= 0 && i < d.length ? d[i] : null;
  }
  function readout() {
    var el = $("readout");
    if (!S.curOn || S.xy) { el.textContent = ""; return; }
    var a = S.cursors.a, b = S.cursors.b, dt = b - a, parts = ["A " + fmtT(a), "B " + fmtT(b), "ΔT " + fmtT(dt)];
    if (dt) parts.push("1/ΔT " + fmtF(Math.abs(1 / dt)));
    [0, 1].forEach(function (c) {
      if (!S.ch[c].on) return;
      var va = valueAt(c, a), vb = valueAt(c, b);
      if (va == null || vb == null) return;
      parts.push("CH" + (c + 1) + ": A " + fmtV(va) + ", B " + fmtV(vb) + ", ΔV " + fmtV(vb - va));
    });
    el.textContent = parts.join("    ");
  }

  // ---------------------------------------------------------------- export
  function download(blob, name) {
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }
  function stamp() { var d = new Date(), p = function (x) { return String(x).padStart(2, "0"); }; return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "-" + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()); }
  $("btn-csv").addEventListener("click", function () {
    if (!frame) return;
    var chs = [0, 1].filter(function (c) { return frame.ch[c]; }), n = Math.max.apply(null, chs.map(function (c) { return frame.ch[c].length; }));
    var lines = ["time_s" + chs.map(function (c) { return ",ch" + (c + 1) + "_V"; }).join("")];
    var t0 = frame.roll ? -(n - 1) / frame.rate : -(frame.pre + frame.frac) / frame.rate;
    for (var i = 0; i < n; i++) lines.push((t0 + i / frame.rate).toExponential(6) + chs.map(function (c) { var v = frame.ch[c][i]; return "," + (v == null ? "" : v.toFixed(4)); }).join(""));
    download(new Blob([lines.join("\n") + "\n"], { type: "text/csv" }), "scope-" + stamp() + ".csv");
  });
  $("btn-png").addEventListener("click", function () {
    var a = $("screen"), b = $("spec"), withSpec = S.fft && !$("spec-wrap").hidden;
    var c = document.createElement("canvas"), gap = withSpec ? Math.round(8 * (window.devicePixelRatio || 1)) : 0;
    c.width = a.width; c.height = a.height + (withSpec ? gap + b.height : 0);
    var g = c.getContext("2d");
    g.fillStyle = S.theme === "light" ? "#ffffff" : "#0d1117"; g.fillRect(0, 0, c.width, c.height);
    g.drawImage(a, 0, 0);
    if (withSpec) g.drawImage(b, 0, a.height + gap);
    c.toBlob(function (blob) { download(blob, "scope-" + stamp() + ".png"); }, "image/png");
  });

  // ---------------------------------------------------------------- glue
  function changed(cfg) {
    if (cfg && engine) engine.dirty = true;
    if (cfg) syncH();
    save(); redraw();
  }
  function syncAll() { syncCh(0); syncCh(1); syncH(); syncTrig(); syncDisplay(); $("calfreq").value = S.calFreq; syncButtons(); }
  buildCh(0); buildCh(1);
  syncAll();
  setTheme(S.theme === "light" ? "light" : "dark");
  if (!OSC.Hantek.supported()) setStatus("WebUSB is not available in this browser (Chrome, Edge or Opera on the desktop). The simulator works anyway.");
  window.addEventListener("beforeunload", function () { if (dev && dev.disconnect) dev.disconnect(); });
})();
