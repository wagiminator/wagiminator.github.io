/* Electronics Calculators: all calculators of the page */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };

  // ================================================================ numbers in and out
  var PREFIX = { p: 1e-12, n: 1e-9, u: 1e-6, "µ": 1e-6, m: 1e-3, k: 1e3, K: 1e3, M: 1e6, G: 1e9, R: 1, r: 1 };
  // "4k7", "4.7k", "4R7", "100n", "2u2", "1.2M", "1,5" → number (NaN if not a number)
  function num(s) {
    s = String(s == null ? "" : s).trim().replace(/\s+/g, "").replace(/[ΩVAHzF%]+$/i, "").replace(",", ".");
    if (!s) return NaN;
    var m = /^([+-]?\d*)([pnuµmkKMGRr])(\d*)$/.exec(s);          // 4k7, 4R7, k47
    if (m && (m[1] || m[3]) && m[1].indexOf(".") < 0) return parseFloat((m[1] || "0") + "." + (m[3] || "0")) * PREFIX[m[2]];
    m = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)([pnuµmkKMG]?)$/.exec(s);
    if (m) return parseFloat(m[1]) * (m[2] ? PREFIX[m[2]] : 1);
    return NaN;
  }
  function val(id) { var el = $(id), v = num(el.value); el.classList.toggle("bad", el.value.trim() !== "" && !isFinite(v)); return v; }
  var SI = [[1e9, "G"], [1e6, "M"], [1e3, "k"], [1, ""], [1e-3, "m"], [1e-6, "µ"], [1e-9, "n"], [1e-12, "p"]];
  // 4700 → "4.7 k" + unit
  function si(v, unit, digits) {
    if (!isFinite(v)) return "–";
    if (v === 0) return "0 " + (unit || "");
    var a = Math.abs(v), p = SI.filter(function (x) { return a >= x[0] * 0.9995; })[0] || SI[SI.length - 1];
    var n = v / p[0], d = digits || 3, t = n.toPrecision(d);
    if (t.indexOf("e") >= 0) t = String(Math.round(n));
    if (t.indexOf(".") >= 0) t = t.replace(/0+$/, "").replace(/\.$/, "");
    return t + " " + p[1] + (unit || "");
  }
  // resistor notation: 4700 → "4k7", 100 → "100", 4.7 → "4R7"
  function rn(v) {
    if (!isFinite(v)) return "–";
    var p = v >= 1e6 ? [1e6, "M"] : v >= 1e3 ? [1e3, "k"] : [1, "R"];
    var t = String(+(v / p[0]).toPrecision(3));
    if (t.indexOf(".") >= 0) return t.replace(".", p[1]);
    return t + (p[1] === "R" ? "" : p[1]);
  }
  function pct(e, d) { return (e >= 0 ? "+" : "−") + Math.abs(e * 100).toFixed(d == null ? 2 : d) + " %"; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // ================================================================ E series
  var E24 = [1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1];
  var E96 = [];
  for (var i = 0; i < 96; i++) { var e = Math.round(Math.pow(10, i / 96) * 100) / 100; E96.push(e === 9.2 ? 9.19 : e); }
  var BASES = {
    E6: E24.filter(function (v, i) { return i % 4 === 0; }), E12: E24.filter(function (v, i) { return i % 2 === 0; }), E24: E24,
    E48: E96.filter(function (v, i) { return i % 2 === 0; }), E96: E96
  };
  var cacheS = {};
  // all values of a series from 1 Ω to 10 MΩ
  function series(name) {
    if (cacheS[name]) return cacheS[name];
    var out = [];
    for (var d = 0; d <= 6; d++) BASES[name].forEach(function (b) { out.push(+(b * Math.pow(10, d)).toPrecision(3)); });
    out.push(1e7);
    return (cacheS[name] = out);
  }
  function nearest(v, name, how) {           // how: "near" | "up" | "down"
    var s = series(name), best = null;
    s.forEach(function (x) {
      if (how === "up" && x < v * (1 - 1e-9)) return;
      if (how === "down" && x > v * (1 + 1e-9)) return;
      if (best === null || Math.abs(Math.log(x / v)) < Math.abs(Math.log(best / v))) best = x;
    });
    return best;
  }
  // pairs a/b with a/b ≈ ratio (b within [lo, hi]); [{a, b, r, err}]
  function ratioPairs(ratio, name, lo, hi, sumRange) {
    var s = series(name), out = [];
    s.forEach(function (b) {
      if (!sumRange && (b < lo || b > hi)) return;
      var ideal = ratio * b;
      [nearest(ideal, name, "down"), nearest(ideal, name, "up")].forEach(function (a) {
        if (!a) return;
        if (sumRange && (a + b < lo || a + b > hi)) return;
        out.push({ a: a, b: b, r: a / b, err: (a / b) / ratio - 1 });
      });
    });
    var seen = {};
    return out.filter(function (p) { var k = p.a + "/" + p.b; if (seen[k]) return false; seen[k] = 1; return true; })
      .sort(function (x, y) { return Math.abs(x.err) - Math.abs(y.err) || x.b - y.b; });
  }
  function seriesOptions() {
    document.querySelectorAll("select.eseries").forEach(function (sel) {
      sel.innerHTML = Object.keys(BASES).map(function (k) { return '<option value="' + k + '">' + k + "</option>"; }).join("");
      sel.value = sel.id === "fb-series" || sel.id === "dv-series" ? "E24" : "E24";
    });
  }

  // ================================================================ feedback divider
  var REGS = [
    { name: "MT3608 (boost, SEPIC)", vref: 0.6, note: "MT3608: 1.2 MHz boost converter with 4 A switch, used in the SEPIC and boost boards of the Power Boards." },
    { name: "SX1308 (boost)", vref: 0.6 },
    { name: "SD8942 (buck)", vref: 0.6, note: "SD8942: used in the 78xx replacement of the Power Boards (V = 0.6 · (R1 / R2 + 1), R1 = top)." },
    { name: "MP1584 (buck)", vref: 0.8 },
    { name: "MP2307 (buck)", vref: 0.925 },
    { name: "LM2596-ADJ (buck)", vref: 1.23 },
    { name: "LM2577-ADJ (boost)", vref: 1.23 },
    { name: "XL6009 (boost, SEPIC)", vref: 1.25 },
    { name: "MC34063 (buck, boost, inverting)", vref: 1.25 },
    { name: "LM317 (linear)", vref: 1.25, note: "LM317: the adjust pin current (about 50 µA) flows through R_bottom too; keep R_top small (120–240 Ω) for exact values." },
    { name: "AMS1117-ADJ (linear)", vref: 1.25, note: "AMS1117-ADJ: needs about 5 mA load; R_top of 120 Ω does that by itself." },
    { name: "Other", vref: null }
  ];
  function initFeedback() {
    $("fb-chip").innerHTML = REGS.map(function (r, i) { return '<option value="' + i + '">' + esc(r.name) + (r.vref ? " · " + r.vref + " V" : "") + "</option>"; }).join("");
    $("fb-chip").addEventListener("change", function () { var r = REGS[+this.value]; if (r.vref) $("fb-vref").value = r.vref; calcFeedback(); });
    $("fb-pairs").addEventListener("click", function (e) {
      var tr = e.target.closest("tr[data-pick]"); if (!tr) return;
      var p = tr.getAttribute("data-pick").split("/"); $("fb-rt").value = rn(+p[0]); $("fb-rb").value = rn(+p[1]); calcFeedback(); store();
    });
  }
  function calcFeedback() {
    var r = REGS[+$("fb-chip").value] || REGS[0], vref = val("fb-vref"), vout = val("fb-vout"), name = $("fb-series").value;
    var rg = $("fb-range").value.split(",").map(Number);
    $("fb-note").textContent = r.note || "";
    var html = '<tr><th>R<sub>top</sub></th><th>R<sub>bottom</sub></th><th class="n">V<sub>out</sub></th><th class="n">Error</th><th class="n">Current</th></tr>';
    if (vref > 0 && vout > vref) {
      ratioPairs(vout / vref - 1, name, rg[0], rg[1]).slice(0, 8).forEach(function (p, i) {
        var v = vref * (1 + p.r);
        html += '<tr data-pick="' + p.a + "/" + p.b + '"' + (i === 0 ? ' class="best"' : "") + "><td>" + rn(p.a) + "</td><td>" + rn(p.b) + '</td><td class="n">' + v.toFixed(3) + ' V</td><td class="n">' + pct(v / vout - 1) + '</td><td class="n">' + si(v / (p.a + p.b), "A") + "</td></tr>";
      });
    } else html += '<tr><td colspan="5">V<sub>out</sub> must be higher than V<sub>ref</sub>.</td></tr>';
    $("fb-pairs").innerHTML = html;
    var rt = val("fb-rt"), rb = val("fb-rb");
    $("fb-check").innerHTML = rt >= 0 && rb > 0 && vref > 0 ? "V<sub>out</sub> = <b class=\"big\">" + (vref * (1 + rt / rb)).toFixed(3) + " V</b><br>Divider current " + si(vref / rb, "A") + ", R<sub>top</sub> : R<sub>bottom</sub> = " + (rt / rb).toFixed(4) : "";
  }

  // ================================================================ charge current
  var CHARGERS = [
    { name: "TP4056 (Li-ion, 4.2 V, PROG)", k: 1200, pin: "R<sub>PROG</sub>", max: 1000, note: "TP4056: I = 1200 V / R_PROG, up to 1 A; the datasheet table gives slightly more at small currents (10 k → 130 mA). Pre-charge below 2.9 V is 1/10 of the current." },
    { name: "TP4054 / LTC4054 (Li-ion, PROG)", k: 1000, pin: "R<sub>PROG</sub>", max: 500, note: "TP4054 / LTC4054: I = 1000 V / R_PROG, up to 500 mA." },
    { name: "MCP73831 (Li-ion, PROG)", k: 1000, pin: "R<sub>PROG</sub>", max: 500, min: 15, note: "MCP73831: I = 1000 V / R_PROG, 15 to 500 mA." },
    { name: "CN3058E (LiFePO4, 3.6 V, ISET)", k: 1218, pin: "R<sub>ISET</sub>", max: 1000, note: "CN3058E: I = 1218 V / R_ISET, up to 1 A. Below 2.5 V it pre-charges with 10 % of the current." },
    { name: "IP2312 (Li-ion, switching, ISET)", k: 135000, pin: "R<sub>ISET</sub>", max: 3000, note: "IP2312: R_ISET = 135 kV / I (135 k → 1 A, 45 k → 3 A); without R_ISET it charges with about 2.1 A, as in the Power Boards." }
  ];
  function initCharger() {
    $("ch-chip").innerHTML = CHARGERS.map(function (c, i) { return '<option value="' + i + '">' + esc(c.name) + "</option>"; }).join("");
  }
  function calcCharger() {
    var c = CHARGERS[+$("ch-chip").value] || CHARGERS[0], i = val("ch-i") / 1000, name = $("ch-series").value;
    $("ch-note").textContent = c.note || "";
    if (i > 0) {
      var r = c.k / i, up = nearest(r, name, "up"), dn = nearest(r, name, "down");
      var warn = i * 1000 > c.max ? ' <span class="bad">more than the ' + c.max + " mA of this charger</span>" : c.min && i * 1000 < c.min ? ' <span class="bad">less than the ' + c.min + " mA of this charger</span>" : "";
      $("ch-out").innerHTML = c.pin + " = <b class=\"big\">" + si(r, "Ω") + "</b>" + warn + "<br>" +
        (up === dn ? rn(up) + " is in the " + name + " series" : rn(up) + " → " + si(c.k / up * 1000, "") + "mA, " + rn(dn) + " → " + si(c.k / dn * 1000, "") + "mA");
    } else $("ch-out").innerHTML = "";
    var html = '<tr><th class="n">Current</th><th class="n">' + c.pin + ' exact</th><th class="n">' + name + '</th><th class="n">gives</th></tr>';
    [50, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 1000, 1500, 2000, 2500, 3000].filter(function (ma) { return ma <= c.max && (!c.min || ma >= c.min); }).forEach(function (ma) {
      var r = c.k / (ma / 1000), n = nearest(r, name, "near");
      html += '<tr><td class="n">' + ma + ' mA</td><td class="n">' + si(r, "Ω") + '</td><td class="n">' + rn(n) + '</td><td class="n">' + Math.round(c.k / n * 1000) + " mA</td></tr>";
    });
    $("ch-table").innerHTML = html;
  }

  // ================================================================ linear regulator heat
  var PKGS = [["SOT-23 / SOT-23-5", 250], ["SOT-89", 180], ["SOT-223", 90], ["TO-252 (DPAK)", 70], ["TO-220, no heatsink", 50], ["Other", null]];
  function initLdo() {
    $("ldo-pkg").innerHTML = PKGS.map(function (p, i) { return '<option value="' + i + '">' + p[0] + (p[1] ? " · " + p[1] + " °C/W" : "") + "</option>"; }).join("");
    $("ldo-pkg").value = "2";
    $("ldo-pkg").addEventListener("change", function () { var p = PKGS[+this.value]; if (p[1]) $("ldo-th").value = p[1]; calcLdo(); });
  }
  function calcLdo() {
    var vin = val("ldo-vin"), vout = val("ldo-vout"), i = val("ldo-i") / 1000, iq = (val("ldo-iq") || 0) / 1000, th = val("ldo-th"), ta = val("ldo-ta"), tj = val("ldo-tj");
    if (!(vin > 0 && vout > 0 && i >= 0)) { $("ldo-out").innerHTML = ""; return; }
    if (vout >= vin) { $("ldo-out").innerHTML = '<span class="bad">V<sub>in</sub> must be higher than V<sub>out</sub> (plus the dropout).</span>'; return; }
    var p = (vin - vout) * i + vin * iq, t = ta + p * th, imax = ((tj - ta) / th - vin * iq) / (vin - vout);
    $("ldo-out").innerHTML = "Heat <b class=\"big\">" + si(p, "W") + "</b>, efficiency " + (vout * i / (vin * (i + iq)) * 100).toFixed(0) + " %" +
      (th > 0 ? "<br>Junction temperature about <span class=\"" + (t > tj ? "bad" : t > tj - 25 ? "warn" : "ok") + "\">" + t.toFixed(0) + " °C</span>, at most " + si(Math.max(0, imax), "A") + " at " + tj + " °C" : "") +
      (t > tj ? "<br>Too hot: lower V<sub>in</sub>, add copper or use a switching regulator." : "");
  }

  // ================================================================ battery runtime
  function calcBattery() {
    var c = val("bat-c") / 1000, u = val("bat-u") / 100, ia = val("bat-ia") / 1000, d = val("bat-d") / 100, is = val("bat-is") / 1e6, ic = val("bat-ic") / 1000;
    if (!(c > 0 && u > 0 && ia >= 0 && d >= 0 && d <= 1 && is >= 0)) { $("bat-out").innerHTML = ""; return; }
    var avg = ia * d + is * (1 - d), h = avg > 0 ? c * u / avg : Infinity;
    var dur = function (h) { return !isFinite(h) ? "forever" : h < 48 ? h.toFixed(1) + " hours" : h < 24 * 60 ? (h / 24).toFixed(1) + " days" : (h / 24 / 30.4).toFixed(1) + " months"; };
    $("bat-out").innerHTML = "Average current " + si(avg, "A") + "<br>Runtime <b class=\"big\">" + dur(h) + "</b>" +
      (h > 24 * 365 ? '<br><span class="warn">The self-discharge of the battery (a few % per month) will end it first.</span>' : "") +
      (ic > 0 ? "<br>Charging from empty takes about " + dur(c / ic * 1.2) + " (" + (c / ic > 1 ? "constant current, then the slower constant voltage phase" : "including the constant voltage phase") + ")" : "");
  }

  // ================================================================ clearance (IPC-2221 table 6-1)
  var CLEAR = {          // up to 15, 30, 50, 100, 150, 170, 250, 300, 500 V (mm), then mm per volt above 500 V
    b1: [0.05, 0.05, 0.1, 0.1, 0.2, 0.2, 0.2, 0.2, 0.25, 0.0025],
    b2: [0.1, 0.1, 0.6, 0.6, 0.6, 1.25, 1.25, 1.25, 2.5, 0.005],
    b4: [0.05, 0.05, 0.13, 0.13, 0.4, 0.4, 0.4, 0.4, 0.8, 0.00305]
  };
  var CL_V = [15, 30, 50, 100, 150, 170, 250, 300, 500];
  function calcClearance() {
    var v = Math.abs(val("cl-v")), t = CLEAR[$("cl-kind").value], d;
    if (!isFinite(v)) { $("cl-out").innerHTML = ""; return; }
    var k = CL_V.findIndex(function (x) { return v <= x; });
    d = k >= 0 ? t[k] : t[8] + (v - 500) * t[9];
    $("cl-out").innerHTML = "Spacing at least <b class=\"big\">" + d.toFixed(2) + " mm</b> (" + (d / 0.0254).toFixed(1) + " mil)" + (d < 0.127 ? "<br>The board makers' minimum of about 0.1–0.13 mm comes first." : "");
  }

  // ================================================================ LEDs
  var LEDS = [["Red", 2.0], ["Orange", 2.0], ["Yellow", 2.1], ["Yellow-green", 2.1], ["Green (true green)", 3.0], ["Blue", 3.0], ["White", 3.0], ["Infrared", 1.2], ["UV", 3.3]];
  function initLed() {
    $("led-col").innerHTML = LEDS.map(function (l, i) { return '<option value="' + i + '">' + l[0] + " (" + l[1].toFixed(1) + " V)</option>"; }).join("") + '<option value="x">Other</option>';
    $("led-col").addEventListener("change", function () { if (this.value !== "x") $("led-vf").value = LEDS[+this.value][1]; calcLed(); });
  }
  function pkg(p) { return p <= 0.05 ? "0402 (63 mW)" : p <= 0.08 ? "0603 (100 mW)" : p <= 0.1 ? "0805 (125 mW)" : p <= 0.2 ? "1206 (250 mW)" : p <= 0.4 ? "2010 (500 mW) or 1/2 W" : "1 W or more"; }
  function calcLed() {
    var v = val("led-v"), vf = val("led-vf"), n = Math.max(1, Math.round(val("led-n")) || 1), i = val("led-i") / 1000, name = $("led-series").value;
    var drop = v - n * vf;
    if (!(i > 0) || !(v > 0)) { $("led-out").innerHTML = ""; return; }
    if (drop <= 0) { $("led-out").innerHTML = '<span class="bad">The supply is not higher than the ' + n + " × " + vf + " V of the LEDs.</span>"; return; }
    var r = drop / i, rs = nearest(r, name, "up"), ia = drop / rs, p = drop * ia;
    $("led-out").innerHTML = "R = " + si(r, "Ω") + " → <b class=\"big\">" + rn(rs) + " Ω</b> (" + name + ")<br>Current " + si(ia, "A") + ", resistor " + si(p, "W") + " → at least " + pkg(p) + ", LED " + si(vf * ia, "W") + " each" +
      (drop < 0.15 * v ? '<br><span class="warn">Little voltage left for the resistor: the current depends strongly on V<sub>f</sub> and the supply.</span>' : "");
  }
  var DRIVERS = [{ name: "TPS61169 (boost LED driver)", vfb: 0.204 }, { name: "PT4115 (buck LED driver)", vfb: 0.1 }, { name: "Other", vfb: null }];
  function initLedcc() {
    $("cc-chip").innerHTML = DRIVERS.map(function (d, i) { return '<option value="' + i + '">' + esc(d.name) + (d.vfb ? " · " + d.vfb * 1000 + " mV" : "") + "</option>"; }).join("");
    $("cc-chip").addEventListener("change", function () { var d = DRIVERS[+this.value]; if (d.vfb) $("cc-vfb").value = d.vfb; calcLedcc(); });
  }
  function calcLedcc() {
    var vfb = val("cc-vfb"), i = val("cc-i") / 1000, name = $("cc-series").value;
    if (!(vfb > 0 && i > 0)) { $("cc-out").innerHTML = ""; return; }
    var r = vfb / i, up = nearest(r, name, "up"), dn = nearest(r, name, "down");
    $("cc-out").innerHTML = "R<sub>sense</sub> = <b class=\"big\">" + si(r, "Ω") + "</b><br>" + (up === dn ? rn(up) + " Ω is in the " + name + " series" : rn(up) + " Ω → " + si(vfb / up, "A") + ", " + rn(dn) + " Ω → " + si(vfb / dn, "A")) + "<br>Power in the resistor " + si(vfb * i, "W");
  }

  // ================================================================ voltage divider
  function initDivider() {
    $("dv-pairs").addEventListener("click", function (e) {
      var tr = e.target.closest("tr[data-pick]"); if (!tr) return;
      var p = tr.getAttribute("data-pick").split("/"); $("dv-rt").value = rn(+p[0]); $("dv-rb").value = rn(+p[1]); calcDivider(); store();
    });
  }
  function calcDivider() {
    var vin = val("dv-vin"), vout = val("dv-vout"), name = $("dv-series").value, rg = $("dv-range").value.split(",").map(Number);
    var html = '<tr><th>R<sub>top</sub></th><th>R<sub>bottom</sub></th><th class="n">V<sub>out</sub></th><th class="n">Error</th><th class="n">Current</th></tr>';
    if (vin > 0 && vout > 0 && vout < vin) {
      ratioPairs(vin / vout - 1, name, rg[0], rg[1], true).slice(0, 6).forEach(function (p, i) {
        var v = vin * p.b / (p.a + p.b);
        html += '<tr data-pick="' + p.a + "/" + p.b + '"' + (i === 0 ? ' class="best"' : "") + "><td>" + rn(p.a) + "</td><td>" + rn(p.b) + '</td><td class="n">' + v.toFixed(3) + ' V</td><td class="n">' + pct(v / vout - 1) + '</td><td class="n">' + si(vin / (p.a + p.b), "A") + "</td></tr>";
      });
    } else html += '<tr><td colspan="5">V<sub>out</sub> must lie between 0 and V<sub>in</sub>.</td></tr>';
    $("dv-pairs").innerHTML = html;
    var rt = val("dv-rt"), rb = val("dv-rb"), bits = +$("dv-bits").value, aref = val("dv-aref");
    if (rt >= 0 && rb > 0 && vin > 0) {
      var v = vin * rb / (rt + rb), max = Math.pow(2, bits) - 1, adc = Math.round(v / aref * max);
      $("dv-check").innerHTML = "V<sub>out</sub> = <b class=\"big\">" + v.toFixed(3) + " V</b> (" + (rb / (rt + rb)).toFixed(4) + " · V<sub>in</sub>)<br>Current " + si(vin / (rt + rb), "A") + ", source impedance " + si(rt * rb / (rt + rb), "Ω") +
        (aref > 0 ? "<br>ADC reading " + (adc > max ? '<span class="bad">over the range (' + adc + ")</span>" : adc + " of " + max) + ", one step = " + si(aref / max * (rt + rb) / rb, "V") + " at the input" : "") +
        (rt * rb / (rt + rb) > 10e3 ? '<br><span class="warn">Over 10 kΩ: put a capacitor (about 100 nF) from the ADC pin to ground.</span>' : "");
    } else $("dv-check").innerHTML = "";
  }

  // ================================================================ resistor values
  function calcCombo() {
    var r = val("cb-r"), name = $("cb-series").value, s = series(name);
    if (!(r > 0)) { $("cb-out").innerHTML = ""; return; }
    var dn = nearest(r, name, "down"), up = nearest(r, name, "up"), bestS = null, bestP = null;
    s.forEach(function (a) {
      if (a >= r) return;
      var b = nearest(r - a, name, "near");
      if (b && (bestS === null || Math.abs(a + b - r) < Math.abs(bestS.v - r) || (Math.abs(a + b - r) === Math.abs(bestS.v - r) && Math.max(a, b) > Math.max(bestS.a, bestS.b)))) bestS = { a: Math.max(a, b), b: Math.min(a, b), v: a + b };
    });
    s.forEach(function (a) {
      if (a <= r) return;
      var bi = 1 / (1 / r - 1 / a); if (!(bi > 0)) return;
      var b = nearest(bi, name, "near"), v = a * b / (a + b);
      if (bestP === null || Math.abs(v - r) < Math.abs(bestP.v - r)) bestP = { a: Math.min(a, b), b: Math.max(a, b), v: v };
    });
    var row = function (what, v) { return "<tr><td>" + what + '</td><td class="n">' + si(v, "Ω", 4) + '</td><td class="n">' + pct(v / r - 1) + "</td></tr>"; };
    $("cb-out").innerHTML = '<tr><th>Choice</th><th class="n">Value</th><th class="n">Error</th></tr>' +
      row("Next lower " + name + ": " + rn(dn), dn) + row("Next higher " + name + ": " + rn(up), up) +
      (bestS ? row("In series: " + rn(bestS.a) + " + " + rn(bestS.b), bestS.v) : "") +
      (bestP ? row("In parallel: " + rn(bestP.a) + " ∥ " + rn(bestP.b), bestP.v) : "");
  }

  // ================================================================ colour code
  var COLS = [["black", "#1b1b1b"], ["brown", "#7a4a1f"], ["red", "#d0251c"], ["orange", "#f0801a"], ["yellow", "#f5d31c"], ["green", "#2f9a3a"], ["blue", "#2061c9"], ["violet", "#8a3fc0"], ["grey", "#8d8d8d"], ["white", "#f6f6f6"]];
  var GOLD = ["gold", "#c9a43a"], SILVER = ["silver", "#c0c4ca"];
  var MULT = COLS.map(function (c, i) { return { c: c, m: Math.pow(10, i) }; }).concat([{ c: GOLD, m: 0.1 }, { c: SILVER, m: 0.01 }]);
  var TOL = [{ c: COLS[1], t: "1 %" }, { c: COLS[2], t: "2 %" }, { c: COLS[5], t: "0.5 %" }, { c: COLS[6], t: "0.25 %" }, { c: COLS[7], t: "0.1 %" }, { c: COLS[8], t: "0.05 %" }, { c: GOLD, t: "5 %" }, { c: SILVER, t: "10 %" }];
  var co = { n: 4, d: [4, 7, 0], m: 2, t: 6 };
  function coSelects() {
    var digits = co.n === 4 ? 2 : 3, html = "";
    for (var k = 0; k < digits; k++) html += "<label>Digit " + (k + 1) + '<select data-d="' + k + '">' + COLS.map(function (c, i) { return '<option value="' + i + '">' + i + " " + c[0] + "</option>"; }).join("") + "</select></label>";
    html += '<label>Multiplier<select data-m="1">' + MULT.map(function (x, i) { return '<option value="' + i + '">×' + si(x.m, "", 3).trim() + " " + x.c[0] + "</option>"; }).join("") + "</select></label>";
    html += '<label>Tolerance<select data-t="1">' + TOL.map(function (x, i) { return '<option value="' + i + '">' + x.t + " " + x.c[0] + "</option>"; }).join("") + "</select></label>";
    $("co-sel").innerHTML = html;
    $("co-sel").querySelectorAll("select").forEach(function (s) {
      if (s.dataset.d) s.value = co.d[+s.dataset.d] || 0; else if (s.dataset.m) s.value = co.m; else s.value = co.t;
    });
  }
  function coValue() { var digits = co.n === 4 ? 2 : 3, v = 0; for (var k = 0; k < digits; k++) v = v * 10 + (co.d[k] || 0); return v * MULT[co.m].m; }
  function coDraw() {
    var digits = co.n === 4 ? 2 : 3, bands = [];
    for (var k = 0; k < digits; k++) bands.push(COLS[co.d[k] || 0]);
    bands.push(MULT[co.m].c); bands.push(TOL[co.t].c);
    var xs = co.n === 4 ? [92, 116, 140, 202] : [86, 108, 130, 152, 206], svg = '<path d="M0 35h60M240 35h60" stroke="#9aa0ad" stroke-width="5"/>' +
      '<path d="M60 14c0-6 6-10 14-10h22c6 0 8 4 14 4h80c6 0 8-4 14-4h22c8 0 14 4 14 10v42c0 6-6 10-14 10h-22c-6 0-8-4-14-4h-80c-6 0-8 4-14 4h-22c-8 0-14-4-14-10z" fill="#d9c49a" stroke="#a88f5f" stroke-width="1.5"/>';
    bands.forEach(function (b, k) { svg += '<rect x="' + xs[k] + '" y="' + (k === 0 || k === bands.length - 1 ? 5 : 9) + '" width="12" height="' + (k === 0 || k === bands.length - 1 ? 60 : 52) + '" fill="' + b[1] + '" stroke="rgba(0,0,0,.25)" stroke-width="0.6"/>'; });
    $("co-svg").innerHTML = svg;
    $("co-svg").setAttribute("aria-label", "Bands: " + bands.map(function (b) { return b[0]; }).join(", "));
    $("co-res").innerHTML = "<b class=\"big\">" + si(coValue(), "Ω", 4) + "</b> ± " + TOL[co.t].t + " · " + bands.map(function (b) { return b[0]; }).join(" – ");
  }
  function coFromValue() {
    var v = val("co-val"), digits = co.n === 4 ? 2 : 3;
    if (!(v > 0)) return;
    var e = Math.floor(Math.log10(v)) - (digits - 1), m = Math.round(v / Math.pow(10, e));
    if (m >= Math.pow(10, digits)) { m = Math.round(m / 10); e++; }
    var mi = MULT.findIndex(function (x) { return Math.abs(Math.log10(x.m) - e) < 1e-9; });
    if (mi < 0) { $("co-res").innerHTML = '<span class="bad">This value has no colour code with ' + co.n + " bands.</span>"; return; }
    var s = String(m).padStart(digits, "0");
    for (var k = 0; k < digits; k++) co.d[k] = +s[k];
    co.m = mi;
    if (co.n === 5 && TOL[co.t].t === "5 %") co.t = 0;
    coSelects(); coDraw();
    var real = coValue();
    if (Math.abs(real / v - 1) > 1e-6) $("co-res").innerHTML += '<br><span class="warn">Rounded from ' + si(v, "Ω", 6) + ".</span>";
  }
  function initColour() {
    $("co-bands").addEventListener("change", function () { co.n = +this.value; coFromValue(); });
    $("co-sel").addEventListener("change", function (e) {
      var s = e.target;
      if (s.dataset.d) co.d[+s.dataset.d] = +s.value; else if (s.dataset.m) co.m = +s.value; else co.t = +s.value;
      $("co-val").value = rn(coValue()); coDraw(); store();
    });
    $("co-val").addEventListener("input", coFromValue);
  }

  // ================================================================ SMD codes
  var EIA_M = { Z: 0.001, Y: 0.01, R: 0.01, X: 0.1, S: 0.1, A: 1, B: 10, H: 10, C: 100, D: 1e3, E: 1e4, F: 1e5 };
  function smdDecode(c) {
    c = c.trim().toUpperCase();
    if (!c) return null;
    if (/^0+$/.test(c)) return { v: 0, how: "0 Ω jumper" };
    var m = /^(\d{2})([ZYXSABHCDEF])$/.exec(c);              // (R as multiplier is left out: 47R means 47 Ω)
    if (m && +m[1] >= 1 && +m[1] <= 96) return { v: E96[+m[1] - 1] * 100 * EIA_M[m[2]], how: "EIA-96: " + m[1] + " = " + Math.round(E96[+m[1] - 1] * 100) + ", " + m[2] + " = ×" + EIA_M[m[2]], tol: "1 %" };
    if (/^\d*R\d*$/.test(c) && c !== "R") return { v: parseFloat(c.replace("R", ".")), how: "R is the decimal point" };
    m = /^(\d*)([KM])(\d*)$/.exec(c);
    if (m && (m[1] || m[3])) return { v: parseFloat((m[1] || "0") + "." + (m[3] || "0")) * (m[2] === "K" ? 1e3 : 1e6), how: m[2] + " is the decimal point" };
    m = /^(\d{2})(\d)$/.exec(c);
    if (m) return { v: +m[1] * Math.pow(10, +m[2]), how: "3 digits: " + m[1] + " × 10^" + m[2], tol: "5 %" };
    m = /^(\d{3})(\d)$/.exec(c);
    if (m) return { v: +m[1] * Math.pow(10, +m[2]), how: "4 digits: " + m[1] + " × 10^" + m[2], tol: "1 %" };
    return null;
  }
  function smdCodes(v) {
    var out = [];
    if (v === 0) return ["000"];
    var code = function (digits) {
      if (v < Math.pow(10, digits - 2)) {             // below 10 or 100 Ω: R notation
        var t = String(+v.toPrecision(digits));
        if (t.replace(".", "").replace(/^0+/, "").length > digits) return null;
        return t.indexOf(".") >= 0 ? t.replace(/^0\./, "R").replace(".", "R") : t + "R";
      }
      var e = Math.floor(Math.log10(v)) - (digits - 2), m = v / Math.pow(10, e);
      if (Math.abs(m - Math.round(m)) > 1e-6 || e > 9) return null;
      return String(Math.round(m)) + e;
    };
    var c3 = code(3), c4 = code(4);
    if (c4 === c3) c4 = null;
    if (c3 && Math.abs(smdDecode(c3).v / v - 1) < 1e-6) out.push(c3 + " (3 digits)");
    if (c4 && Math.abs(smdDecode(c4).v / v - 1) < 1e-6) out.push(c4 + " (4 digits)");
    var e = Math.floor(Math.log10(v)), mant = v / Math.pow(10, e - 2), idx = E96.findIndex(function (x) { return Math.abs(x * 100 - mant) < 0.01; });
    if (idx >= 0) {
      var mul = Math.pow(10, e - 2), L = Object.keys(EIA_M).filter(function (k) { return Math.abs(EIA_M[k] / mul - 1) < 1e-9 && k !== "R" && k !== "S" && k !== "H"; })[0];
      if (L) out.push(String(idx + 1).padStart(2, "0") + L + " (EIA-96)");
    }
    return out;
  }
  function calcSmdCode() {
    var d = smdDecode($("smd-code").value);
    $("smd-code").classList.toggle("bad", !!$("smd-code").value.trim() && !d);
    if (!d) { $("smd-out").innerHTML = $("smd-code").value.trim() ? '<span class="bad">Not a known code.</span>' : ""; return; }
    $("smd-val").value = d.v ? rn(d.v) : "0";
    $("smd-out").innerHTML = "<b class=\"big\">" + si(d.v, "Ω", 4) + "</b> · " + esc(d.how) + (d.tol ? " · usually " + d.tol : "") + "<br>Codes for this value: " + smdCodes(d.v).join(", ");
  }
  function calcSmdVal() {
    var v = val("smd-val");
    if (!(v >= 0)) { $("smd-out").innerHTML = ""; return; }
    var c = smdCodes(+v.toPrecision(6));
    $("smd-code").value = c.length ? c[0].split(" ")[0] : "";
    $("smd-out").innerHTML = "<b class=\"big\">" + si(v, "Ω", 4) + "</b><br>" + (c.length ? "Codes: " + c.join(", ") : '<span class="warn">No exact code for this value.</span>');
  }

  // ================================================================ UART
  var UARTS = [
    { name: "AVR (ATmega, ATtiny with USART), normal speed", reg: "UBRR", calc: function (f, b) { var r = Math.round(f / (16 * b)) - 1; return r < 0 || r > 4095 ? null : { r: r, b: f / (16 * (r + 1)) }; } },
    { name: "AVR (ATmega, ATtiny with USART), double speed U2X", reg: "UBRR", calc: function (f, b) { var r = Math.round(f / (8 * b)) - 1; return r < 0 || r > 4095 ? null : { r: r, b: f / (8 * (r + 1)) }; } },
    { name: "tinyAVR 0/1/2, megaAVR 0, AVR Dx (USART BAUD)", reg: "BAUD", calc: function (f, b) { var r = Math.round(64 * f / (16 * b)); return r < 64 || r > 65535 ? null : { r: r, b: 64 * f / (16 * r) }; } },
    { name: "tinyAVR 0/1/2, megaAVR 0, AVR Dx, CLK2X", reg: "BAUD", calc: function (f, b) { var r = Math.round(64 * f / (8 * b)); return r < 64 || r > 65535 ? null : { r: r, b: 64 * f / (8 * r) }; } },
    { name: "CH32V, CH32X, STM32, PY32 (USART BRR)", reg: "BRR", calc: function (f, b) { var r = Math.round(f / b); return r < 16 || r > 65535 ? null : { r: r, b: f / r, hex: true }; } },
    { name: "CH55x UART0 with timer 1, UART1 (SMOD = 1)", reg: "TH1 / SBAUD1", calc: function (f, b) { var n = Math.round(f / 16 / b); return n < 1 || n > 256 ? null : { r: 256 - n, b: f / 16 / n, hex: true }; } }
  ];
  var BAUDS = [1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600, 1000000, 2000000];
  function initUart() { $("ua-fam").innerHTML = UARTS.map(function (u, i) { return '<option value="' + i + '">' + esc(u.name) + "</option>"; }).join(""); }
  function hx(r) { return "0x" + r.toString(16).toUpperCase().padStart(r > 255 ? 4 : 2, "0"); }
  function errCls(e) { var a = Math.abs(e); return a <= 0.01 ? "ok" : a <= 0.02 ? "warn" : "bad"; }
  function calcUart() {
    var u = UARTS[+$("ua-fam").value] || UARTS[0], f = val("ua-f") * 1e6, b = val("ua-b");
    var one = f > 0 && b > 0 ? u.calc(f, b) : null;
    if (one) {
      var e = one.b / b - 1;
      $("ua-out").innerHTML = u.reg + " = <b class=\"big\">" + one.r + "</b>" + (one.hex ? " (" + hx(one.r) + ")" : "") + "<br>Real baud rate " + Math.round(one.b) + ', error <span class="' + errCls(e) + '">' + pct(e) + "</span>";
    } else $("ua-out").innerHTML = f > 0 && b > 0 ? '<span class="bad">Not possible at this clock.</span>' : "";
    var html = '<tr><th class="n">Baud</th><th class="n">' + u.reg + '</th><th class="n">Real</th><th class="n">Error</th></tr>';
    if (f > 0) BAUDS.forEach(function (bd) {
      var r = u.calc(f, bd);
      html += r ? '<tr><td class="n">' + bd + '</td><td class="n">' + r.r + (r.hex ? " (" + hx(r.r) + ")" : "") + '</td><td class="n">' + Math.round(r.b) + '</td><td class="n ' + errCls(r.b / bd - 1) + '">' + pct(r.b / bd - 1, 1) + "</td></tr>"
        : '<tr><td class="n">' + bd + '</td><td colspan="3" class="n">–</td></tr>';
    });
    $("ua-table").innerHTML = html;
  }

  // ================================================================ timers
  var POW2 = []; for (var p2 = 0; p2 <= 14; p2++) POW2.push(Math.pow(2, p2));
  var TIMERS = [
    { name: "AVR 8-bit timer (Timer0, ATmega Timer2)", pre: [1, 8, 64, 256, 1024], bits: 8, reg: "OCRxA", note: "ATmega Timer2 also has the prescalers 32 and 128." },
    { name: "AVR 16-bit timer (Timer1, ICR1 or OCR1A as TOP)", pre: [1, 8, 64, 256, 1024], bits: 16, reg: "ICR1 / OCR1A" },
    { name: "ATtiny85 Timer1 (8 bit, prescaler 1 … 16384)", pre: POW2, bits: 8, reg: "OCR1C", note: "Timer1 of the ATtiny25/45/85 can also run from the 64 MHz PLL." },
    { name: "tinyAVR 0/1/2 TCA0 (16 bit)", pre: [1, 2, 4, 8, 16, 64, 256, 1024], bits: 16, reg: "PER" },
    { name: "tinyAVR 0/1/2 TCB (16 bit, CLK_PER or /2)", pre: [1, 2], bits: 16, reg: "CCMP", note: "TCB can also use the clock of TCA0." },
    { name: "CH32V, CH32X, STM32, PY32 (16 bit, any prescaler)", any: true, bits: 16, reg: "ATRLR / ARR", note: "Register values: PSC = N − 1 and ATRLR (ARR) = TOP; the timer clock is HCLK (or the APB clock)." },
    { name: "CH55x Timer 2 (16 bit, Fsys/12, /4 or /1)", pre: [12, 4, 1], bits: 16, reg: "RCAP2", ch55x: true, note: "CH55x Timer 2 counts up from RCAP2 to 0xFFFF: RCAP2 = 65536 − (TOP + 1). The clock is chosen with bTMR_CLK and bT2_CLK in T2MOD." }
  ];
  function initTimer() { $("tm-fam").innerHTML = TIMERS.map(function (t, i) { return '<option value="' + i + '">' + esc(t.name) + "</option>"; }).join(""); }
  function calcTimer() {
    var t = TIMERS[+$("tm-fam").value] || TIMERS[0], clk = val("tm-f") * 1e6, fo = val("tm-out"), mode = $("tm-mode").value;
    $("tm-note").textContent = t.note || "";
    var max = Math.pow(2, t.bits) - 1, sols = [];
    var k = mode === "ctc" ? 1 : 2;                     // f = clk / (k · N · (TOP + off))
    var off = mode === "pc" ? 0 : 1;
    var one = function (N) {
      if (!(clk > 0 && fo > 0)) return;
      var top = Math.round(clk / (k * N * fo)) - off;
      if (top < 3) return;
      if (top > max) return;
      var f = clk / (k * N * (top + off));
      sols.push({ N: N, top: top, f: f, err: f / fo - 1 });
    };
    if (t.any) {
      var nmin = Math.max(1, Math.ceil(clk / (k * fo * (max + off))));
      for (var N = nmin; N <= Math.min(65536, nmin + 4000); N++) one(N);
    } else t.pre.forEach(one);
    sols.sort(function (a, b) { return Math.abs(a.err) - Math.abs(b.err) || b.top - a.top; });
    var best = sols.slice(0, t.any ? 6 : 8);
    var html = '<tr><th class="n">Prescaler N</th><th class="n">TOP' + (t.reg ? " (" + t.reg + ")" : "") + '</th><th class="n">Frequency</th><th class="n">Error</th><th class="n">PWM</th></tr>';
    best.forEach(function (s, i) {
      var reg = t.ch55x ? s.top + "<br><small>RCAP2 = " + hx(65536 - (s.top + 1)) + "</small>" : String(s.top);
      html += "<tr" + (i === 0 ? ' class="best"' : "") + '><td class="n">' + s.N + (t.any ? " (PSC " + (s.N - 1) + ")" : "") + '</td><td class="n">' + reg + '</td><td class="n">' + si(s.f, "Hz", 6) + '</td><td class="n ' + (Math.abs(s.err) < 1e-3 ? "ok" : Math.abs(s.err) < 0.02 ? "warn" : "bad") + '">' + pct(s.err) + '</td><td class="n">' + (Math.log2(s.top + 1)).toFixed(1) + " bit</td></tr>";
    });
    if (!best.length) html += '<tr><td colspan="5">' + (clk > 0 && fo > 0 ? "This frequency cannot be reached with this timer." : "") + "</td></tr>";
    $("tm-table").innerHTML = html;
  }
  function calcCycles(from) {
    var f = val("cy-f") * 1e6;
    if (!(f > 0)) { $("cy-out").innerHTML = ""; return; }
    if (from === "t") { var t = val("cy-t"); if (t >= 0) $("cy-n").value = Math.round(t * 1e-6 * f); }
    else { var n = val("cy-n"); if (n >= 0) $("cy-t").value = +(n / f * 1e6).toPrecision(6); }
    var n2 = val("cy-n");
    $("cy-out").innerHTML = "One cycle = " + si(1 / f, "s") + (n2 >= 0 ? "<br>" + Math.round(n2) + " cycles = <b class=\"big\">" + si(n2 / f, "s", 5) + "</b> (" + si(f / Math.max(1, n2), "Hz") + " if repeated)" : "");
  }

  // ================================================================ trace width and vias (IPC-2221)
  var RHO = 1.72e-8, ALPHA = 0.00393;          // copper at 20 °C
  function ipcArea(i, dt, k) { return Math.pow(i / (k * Math.pow(dt, 0.44)), 1 / 0.725); }          // mil²
  function ipcCurrent(area, dt, k) { return k * Math.pow(dt, 0.44) * Math.pow(area, 0.725); }
  function calcTrace() {
    var i = val("tr-i"), dt = val("tr-dt"), oz = +$("tr-oz").value, k = $("tr-layer").value === "ext" ? 0.048 : 0.024, len = val("tr-len") / 1000, amb = val("tr-amb");
    var tmil = oz * 1.378, tm = oz * 34.8e-6, rho = RHO * (1 + ALPHA * ((isFinite(amb) ? amb : 25) + (dt > 0 ? dt : 0) - 20));
    if (i > 0 && dt > 0) {
      var a = ipcArea(i, dt, k), wmil = a / tmil, wmm = wmil * 0.0254, r = rho * len / (wmm / 1000 * tm);
      $("tr-out").innerHTML = "Width at least <b class=\"big\">" + wmm.toFixed(2) + " mm</b> (" + wmil.toFixed(1) + " mil)<br>" +
        (len > 0 ? "Over " + (len * 1000) + " mm: " + si(r, "Ω") + ", drop " + si(r * i, "V") + ", loss " + si(r * i * i, "W") : "") +
        (wmm < 0.127 ? '<br><span class="warn">Use at least 0.127 mm (5 mil), the minimum of most board makers.</span>' : "");
    } else $("tr-out").innerHTML = "";
    var w = val("tr-w");
    if (w > 0 && dt > 0) {
      var a2 = w / 0.0254 * tmil, imax = ipcCurrent(a2, dt, k), r2 = rho * len / (w / 1000 * tm);
      $("tr-check").innerHTML = w + " mm carries <b class=\"big\">" + imax.toFixed(2) + " A</b> at " + dt + " °C rise" + (len > 0 ? "; " + si(r2, "Ω") + " over " + (len * 1000) + " mm" : "");
    } else $("tr-check").innerHTML = "";
  }
  function calcVia() {
    var d = val("via-d"), t = val("via-t") / 1000, h = val("via-h"), dt = val("via-dt"), need = val("via-i");
    if (!(d > 0 && t > 0 && dt > 0)) { $("via-out").innerHTML = ""; return; }
    var amm = Math.PI * (d + t) * t, amil = amm / (0.0254 * 0.0254), imax = ipcCurrent(amil, dt, 0.048), r = h > 0 ? RHO * 1.15 * (h / 1000) / (amm * 1e-6) : NaN;
    $("via-out").innerHTML = "One via carries <b class=\"big\">" + imax.toFixed(2) + " A</b> at " + dt + " °C rise<br>Copper cross-section " + amm.toFixed(4) + " mm², resistance " + si(r, "Ω") +
      (need > 0 ? "<br>For " + need + " A: <b>" + Math.ceil(need / imax) + " vias</b> (better a few more, spread over the pad)" : "");
  }

  // ================================================================ DC/DC converters
  var CHIPS = {
    buck: [["LM2596 · 150 kHz", 150e3], ["MP2307 · 340 kHz", 340e3], ["MP1584 · set by R_FREQ", 500e3], ["SD8942 · 1.4 MHz", 1.4e6], ["MC34063 · set by C_T", 100e3], ["Other", null]],
    boost: [["MT3608 · 1.2 MHz", 1.2e6], ["SX1308 · 1.2 MHz", 1.2e6], ["XL6009 · 400 kHz", 400e3], ["TPS61169 · 1.2 MHz", 1.2e6], ["LM2577 · 52 kHz", 52e3], ["MC34063 · set by C_T", 100e3], ["Other", null]],
    sepic: [["MT3608 · 1.2 MHz", 1.2e6], ["XL6009 · 400 kHz", 400e3], ["Other", null]]
  };
  var L_STD = [1, 1.5, 2.2, 3.3, 4.7, 6.8];
  function nextL(l) { for (var d = -7; d <= -2; d++) for (var j = 0; j < L_STD.length; j++) { var x = L_STD[j] * Math.pow(10, d); if (x >= l * 0.999) return x; } return l; }
  function dcChips() {
    var list = CHIPS[$("dc-topo").value];
    $("dc-chip").innerHTML = list.map(function (c, i) { return '<option value="' + i + '">' + esc(c[0]) + "</option>"; }).join("");
  }
  function calcDcdc() {
    var topo = $("dc-topo").value, vmin = val("dc-vmin"), vmax = val("dc-vmax"), vout = val("dc-vout"), iout = val("dc-iout"), f = val("dc-f"),
      eff = val("dc-eff") / 100, r = val("dc-r") / 100, dv = val("dc-dv") / 1000, vd = val("dc-vd");
    var rows = [], note = "", ok = vmin > 0 && vmax >= vmin && vout > 0 && iout > 0 && f > 0 && eff > 0 && eff <= 1 && r > 0 && dv > 0 && vd >= 0;
    var add = function (a, b, c) { rows.push("<tr><td>" + a + "</td><td>" + b + "</td><td>" + (c || "") + "</td></tr>"); };
    if (ok && topo === "buck") {
      if (vout >= vmin) note = '<span class="bad">A buck converter needs V<sub>in</sub> above V<sub>out</sub>.</span>';
      else {
        var dmax = (vout + vd) / (vmin * eff + vd), dmin = (vout + vd) / (vmax * eff + vd);
        var dI = r * iout, L = (vmax - vout) * dmin / (f * dI), dIr = (vmax - vout) * dmin / (f * nextL(L));
        add("Duty cycle", (dmin * 100).toFixed(0) + " – " + (Math.min(dmax, 1) * 100).toFixed(0) + " %", "at V<sub>in</sub> max – min");
        add("Inductor", si(L, "H") + " → " + si(nextL(L), "H"), "for " + (r * 100).toFixed(0) + " % ripple at V<sub>in</sub> max");
        add("Inductor ripple", si(dIr, "A"), "with " + si(nextL(L), "H"));
        add("Inductor peak current", si(iout + dIr / 2, "A"), "saturation current of the inductor above this (+20 %)");
        add("Output capacitor", "≥ " + si(dIr / (8 * f * dv), "F"), "ceramic, for " + si(dv, "V") + " ripple (more for low ESR margin)");
        add("Input capacitor ripple current", si(iout * Math.sqrt(dmax * (1 - Math.min(dmax, 1))), "A") + " RMS", "ceramic close to the chip");
        add("Diode (if not synchronous)", si(iout * (1 - dmin), "A") + " average", "Schottky, ≥ " + si(vmax * 1.25, "V"));
        if (dmax > 0.9) note = '<span class="warn">The duty cycle gets close to 100 % at V<sub>in</sub> min: check the dropout in the datasheet.</span>';
      }
    } else if (ok && topo === "boost") {
      if (vout <= vmax) note = '<span class="bad">A boost converter needs V<sub>out</sub> above V<sub>in</sub> max (use a SEPIC for up and down).</span>';
      else {
        var D = 1 - vmin * eff / (vout + vd), Dmin = 1 - vmax * eff / (vout + vd), iin = vout * iout / (vmin * eff);
        var dI2 = r * iin, L2 = vmin * D / (f * dI2), dIr2 = vmin * D / (f * nextL(L2));
        add("Duty cycle", (Dmin * 100).toFixed(0) + " – " + (D * 100).toFixed(0) + " %", "at V<sub>in</sub> max – min");
        add("Input current (inductor)", si(iin, "A"), "average at V<sub>in</sub> min");
        add("Inductor", si(L2, "H") + " → " + si(nextL(L2), "H"), "for " + (r * 100).toFixed(0) + " % ripple at V<sub>in</sub> min");
        add("Switch and inductor peak current", si(iin + dIr2 / 2, "A"), "below the switch limit of the chip (MT3608: 4 A)");
        add("Output capacitor", "≥ " + si(iout * D / (f * dv), "F"), "ceramic, for " + si(dv, "V") + " ripple");
        add("Diode", si(iout, "A") + " average, " + si(iin + dIr2 / 2, "A") + " peak", "Schottky, ≥ " + si(vout * 1.25, "V"));
        if (D > 0.85) note = '<span class="warn">Duty cycle over 85 %: the maximum of many boost chips is about 90 %, and the efficiency drops.</span>';
      }
    } else if (ok && topo === "sepic") {
      var Ds = (vout + vd) / (vmin + vout + vd), Dsm = (vout + vd) / (vmax + vout + vd), iin3 = vout * iout / (vmin * eff);
      var dI3 = r * iin3, L3 = vmin * Ds / (f * dI3), dIr3 = vmin * Ds / (f * nextL(L3));
      var i1pk = iin3 + dIr3 / 2, i2pk = iout + dIr3 / 2;
      add("Duty cycle", (Dsm * 100).toFixed(0) + " – " + (Ds * 100).toFixed(0) + " %", "at V<sub>in</sub> max – min");
      add("L1 = L2 (two inductors)", si(L3, "H") + " → " + si(nextL(L3), "H"), "for " + (r * 100).toFixed(0) + " % ripple; a coupled inductor needs half");
      add("L1 peak current", si(i1pk, "A"), "input side");
      add("L2 peak current", si(i2pk, "A"), "output side");
      add("Switch peak current", si(i1pk + i2pk, "A"), "below the switch limit of the chip (MT3608: 4 A)");
      add("Coupling capacitor", "≥ " + si(iout * Ds / (f * 0.05 * vmin), "F") + ", ≥ " + si(vmax * 1.25, "V"), "ceramic, ripple current " + si(iout * Math.sqrt((vout + vd) / vmin), "A") + " RMS");
      add("Output capacitor", "≥ " + si(iout * Ds / (f * dv), "F"), "ceramic, for " + si(dv, "V") + " ripple");
      add("Diode", si(iout, "A") + " average", "Schottky, ≥ " + si((vmax + vout) * 1.25, "V"));
    }
    $("dc-out").innerHTML = rows.length ? '<tr><th>Value</th><th></th><th>Note</th></tr>' + rows.join("") : "";
    $("dc-note").innerHTML = ok ? note : "Fill in all values.";
  }

  // ================================================================ tabs, links, keeping the values
  var CARDS = { feedback: "power", mt3608: "power", charger: "power", ldo: "power", battery: "power", clearance: "pcb", led: "passive", ledcc: "passive", divider: "passive", combo: "passive", colour: "passive", smd: "passive", uart: "mcu", timer: "mcu", cycles: "mcu", trace: "pcb", via: "pcb", dcdc: "pcb" };
  function showTab(id, push) {
    document.querySelectorAll(".tabs [role=tab]").forEach(function (b) {
      var on = b.getAttribute("aria-controls") === id;
      b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1;
      $(b.getAttribute("aria-controls")).hidden = !on;
    });
    if (push) history.replaceState(null, "", "#" + id);
  }
  function fromHash() {
    var h = location.hash.slice(1);
    if (h === "mt3608") { $("fb-chip").value = "0"; $("fb-vref").value = "0.6"; calcAll(); h = "feedback"; }
    if (CARDS[h]) { showTab(CARDS[h]); setTimeout(function () { var el = $(h); if (el) el.scrollIntoView({ block: "start" }); }, 30); }
    else if ($(h) && $(h).classList.contains("tabpanel")) showTab(h);
  }
  var KEY = "calculators.values";
  function store() {
    var o = {};
    document.querySelectorAll(".tabpanel input[id], .tabpanel select[id]").forEach(function (el) { o[el.id] = el.value; });
    o["co"] = co;
    try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { /* not kept */ }
  }
  function restore() {
    var o = null;
    try { o = JSON.parse(localStorage.getItem(KEY)); } catch (e) { o = null; }
    if (!o) return;
    Object.keys(o).forEach(function (id) { var el = $(id); if (el && (el.tagName === "INPUT" || el.tagName === "SELECT")) { if (el.tagName === "SELECT" && !el.querySelector('option[value="' + CSS.escape(o[id]) + '"]')) return; el.value = o[id]; } });
    if (o.co && o.co.d) co = { n: o.co.n === 5 ? 5 : 4, d: o.co.d.map(Number), m: +o.co.m || 0, t: +o.co.t || 0 };
  }
  function calcAll() {
    calcFeedback(); calcCharger(); calcLdo(); calcBattery(); calcClearance(); calcLed(); calcLedcc(); calcDivider(); calcCombo(); coSelects(); coDraw();
    calcSmdCode(); calcUart(); calcTimer(); calcCycles(); calcTrace(); calcVia(); calcDcdc();
  }
  var BY = {                       // which calculation an input belongs to
    fb: calcFeedback, ch: calcCharger, ldo: calcLdo, bat: calcBattery, cl: calcClearance, led: calcLed, cc: calcLedcc, dv: calcDivider, cb: calcCombo, ua: calcUart, tm: calcTimer,
    tr: calcTrace, via: calcVia, dc: calcDcdc
  };

  // ================================================================ start
  seriesOptions(); initFeedback(); initCharger(); initLdo(); initLed(); initLedcc(); initDivider(); initColour(); initUart(); initTimer(); dcChips();
  restore();
  $("dc-chip").addEventListener("change", function () { var c = CHIPS[$("dc-topo").value][+this.value]; if (c && c[1]) $("dc-f").value = si(c[1], "").replace(/\s/g, ""); calcDcdc(); store(); });
  $("dc-topo").addEventListener("change", function () { dcChips(); var c = CHIPS[this.value][0]; $("dc-f").value = si(c[1], "").replace(/\s/g, ""); calcDcdc(); store(); });
  document.querySelector("main").addEventListener("input", function (e) {
    var id = e.target.id || "", p = id.split("-")[0];
    if (id === "smd-code") calcSmdCode();
    else if (id === "smd-val") calcSmdVal();
    else if (id === "cy-t") calcCycles("t");
    else if (p === "cy") calcCycles();
    else if (BY[p]) BY[p]();
    store();
  });
  document.querySelector("main").addEventListener("change", function (e) { var p = (e.target.id || "").split("-")[0]; if (BY[p]) BY[p](); store(); });
  var tabs = Array.from(document.querySelectorAll(".tabs [role=tab]"));
  tabs.forEach(function (b, i) {
    b.addEventListener("click", function () { showTab(b.getAttribute("aria-controls"), true); });
    b.addEventListener("keydown", function (e) {
      var j = e.key === "ArrowRight" ? (i + 1) % tabs.length : e.key === "ArrowLeft" ? (i + tabs.length - 1) % tabs.length : -1;
      if (j >= 0) { e.preventDefault(); tabs[j].focus(); showTab(tabs[j].getAttribute("aria-controls"), true); }
    });
  });
  window.addEventListener("hashchange", fromHash);
  calcAll();
  fromHash();
})();
