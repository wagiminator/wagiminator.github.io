/* Power Analyzer: the test programs of the firmware, their parameters, data columns,
 * how to wire them and what to work out from the results. */
(function (global) {
  "use strict";

  var RED = "#c8323b", BLUE = "#1f6fb2";
  function max(rows, c) { var m = -Infinity, at = null; rows.forEach(function (r) { if (r[c] > m) { m = r[c]; at = r; } }); return { v: m, row: at }; }
  function min(rows, c) { var m = Infinity, at = null; rows.forEach(function (r) { if (r[c] < m) { m = r[c]; at = r; } }); return { v: m, row: at }; }
  function V(mv) { return (mv / 1000).toFixed(3) + " V"; }
  function A(ma) { return ma >= 1000 ? (ma / 1000).toFixed(3) + " A" : Math.round(ma) + " mA"; }
  function W(mw) { return mw >= 1000 ? (mw / 1000).toFixed(2) + " W" : Math.round(mw) + " mW"; }
  function dur(s) {
    s = Math.round(s);
    var h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60;
    return ((h ? h + " h " : "") + (h || m ? m + " min " : "") + (h ? "" : x + " s")).trim();
  }

  var TESTS = [
    {
      id: "load", cmd: "l", name: "Load test", short: "Load",
      info: "Raises the load step by step from 17 mA up to the maximum current and records the voltage: how much a power supply can deliver and where it gives up.",
      params: [{ id: "a", name: "Maximum current", unit: "mA", min: 17, max: 5000, def: 1000 }, { id: "b", name: "Stop below", unit: "mV", min: 0, max: 26000, def: 2900 }],
      cols: ["Current [mA]", "Voltage [mV]", "Power [mW]"],
      x: { c: 0, label: "Current", unit: "mA", scale: 1 },
      y: [{ c: 1, label: "Voltage", unit: "V", scale: 1e-3, color: RED }, { c: 2, label: "Power", unit: "W", scale: 1e-3, color: BLUE, right: true, zero: true }],
      wiring: { test: "Power supply under test" },
      duration: "up to 10 s",
      summary: function (r) {
        var p = max(r, 2), u0 = r[0][1], ul = r[r.length - 1];
        return [["Voltage at 17 mA", V(u0)], ["Maximum power", W(p.v) + " at " + A(p.row[0]) + ", " + V(p.row[1])],
          ["Last step", A(ul[0]) + " at " + V(ul[1]) + " (" + (100 * (u0 - ul[1]) / u0).toFixed(1) + " % less)"],
          ["Internal resistance", r.length > 4 ? resistance(r) : "–"]];
      }
    },
    {
      id: "reg", cmd: "g", name: "Voltage regulation", short: "Regulation",
      info: "Switches the load quickly between 17 mA and the maximum current for one second: how well a regulator holds its voltage when the load jumps.",
      params: [{ id: "a", name: "Maximum current", unit: "mA", min: 17, max: 5000, def: 1000 }],
      cols: ["Time [ms]", "Current [mA]", "Voltage [mV]"],
      x: { c: 0, label: "Time", unit: "ms", scale: 1 },
      y: [{ c: 2, label: "Voltage", unit: "V", scale: 1e-3, color: RED }, { c: 1, label: "Current", unit: "mA", scale: 1, color: BLUE, right: true, zero: true }],
      wiring: { test: "Power supply or regulator under test" },
      duration: "1 s",
      summary: function (r) {
        var lo = min(r, 2), hi = max(r, 2), mi = max(r, 1).v;
        var idle = r.filter(function (x) { return x[1] < mi * 0.1; }), full = r.filter(function (x) { return x[1] > mi * 0.9; });
        var avg = function (l) { return l.reduce(function (s, x) { return s + x[2]; }, 0) / (l.length || 1); };
        var a0 = avg(idle), a1 = avg(full);
        return [["Voltage range", V(lo.v) + " … " + V(hi.v) + " (" + V(hi.v - lo.v).replace(" V", "") + " V)"],
          ["Average at low load", idle.length ? V(a0) : "–"], ["Average at full load", full.length ? V(a1) : "–"],
          ["Load regulation", idle.length && full.length ? (100 * (a0 - a1) / a0).toFixed(2) + " %" : "–"]];
      }
    },
    {
      id: "eff", cmd: "e", name: "Efficiency test", short: "Efficiency",
      info: "Raises the load on the output of a DC/DC converter while measuring what it takes from its source: the efficiency over the whole load range.",
      params: [{ id: "a", name: "Maximum current", unit: "mA", min: 17, max: 5000, def: 1000 }, { id: "b", name: "Stop below", unit: "mV", min: 0, max: 26000, def: 2900 }],
      cols: ["Current [mA]", "Voltage [mV]", "Efficiency [‰]"],
      x: { c: 0, label: "Current", unit: "mA", scale: 1 },
      y: [{ c: 1, label: "Voltage", unit: "V", scale: 1e-3, color: RED }, { c: 2, label: "Efficiency", unit: "%", scale: 0.1, color: BLUE, right: true, zero: true, max: 100 }],
      wiring: { test: "Converter output", out: "Converter input", in: "Power source" },
      duration: "up to 10 s",
      summary: function (r) {
        var e = max(r, 2), p = r.reduce(function (m, x) { return Math.max(m, x[0] * x[1] / 1000); }, 0);
        return [["Maximum efficiency", (e.v / 10).toFixed(1) + " % at " + A(e.row[0])], ["Maximum output power", W(p)],
          ["Efficiency at the last step", (r[r.length - 1][2] / 10).toFixed(1) + " %"]];
      }
    },
    {
      id: "ripple", cmd: "f", name: "Ripple test", short: "Ripple",
      info: "Raises the load step by step and takes 255 quick voltage readings at each step: the low frequency ripple (peak to peak) over the load.",
      params: [{ id: "a", name: "Maximum current", unit: "mA", min: 17, max: 5000, def: 1000 }, { id: "b", name: "Stop below", unit: "mV", min: 0, max: 26000, def: 2900 }],
      cols: ["Current [mA]", "Ripple [mV]"],
      x: { c: 0, label: "Current", unit: "mA", scale: 1 },
      y: [{ c: 1, label: "Ripple (peak to peak)", unit: "mV", scale: 1, color: RED, zero: true }],
      wiring: { test: "Power supply under test" },
      duration: "up to 30 s",
      summary: function (r) {
        var m = max(r, 1), avg = r.reduce(function (s, x) { return s + x[1]; }, 0) / r.length;
        return [["Maximum ripple", m.v + " mV at " + A(m.row[0])], ["Average ripple", avg.toFixed(0) + " mV"]];
      }
    },
    {
      id: "bat", cmd: "b", name: "Battery discharge", short: "Battery", stop: true,
      info: "Discharges a battery with a constant current; near the end voltage the current is reduced so the voltage stays there, until the battery is empty. One reading per second.",
      params: [{ id: "a", name: "Discharge current", unit: "mA", min: 17, max: 3000, def: 1000 }, { id: "b", name: "End voltage", unit: "mV", min: 0, max: 26000, def: 2900 }],
      cols: ["Time [s]", "Current [mA]", "Voltage [mV]", "Capacity [mAh]"],
      x: { c: 0, label: "Time", unit: "s", scale: 1, time: true },
      y: [{ c: 2, label: "Voltage", unit: "V", scale: 1e-3, color: RED }, { c: 1, label: "Current", unit: "mA", scale: 1, color: BLUE, right: true, zero: true }],
      wiring: { test: "Battery" },
      duration: "until the battery is empty",
      summary: function (r) {
        var last = r[r.length - 1], e = 0;
        for (var i = 1; i < r.length; i++) e += r[i][1] * r[i][2] * (r[i][0] - r[i - 1][0]) / 3.6e9;
        return [["Capacity", last[3] + " mAh"], ["Energy", e.toFixed(3) + " Wh"], ["Duration", dur(last[0])],
          ["Voltage", V(r[0][2]) + " → " + V(last[2])]];
      }
    },
    {
      id: "meter", cmd: "m", name: "Long-term multimeter", short: "Multimeter", stop: true,
      info: "Measures voltage and current between PWR-IN and PWR-OUT at a fixed interval: what a device draws over time, its energy and capacity use.",
      params: [{ id: "a", name: "Interval", unit: "ms", min: 2, max: 65535, def: 100 }, { id: "b", name: "Duration", unit: "s", min: 1, max: 65535, def: 60 }],
      cols: ["Time [ms]", "Current [mA]", "Voltage [mV]"],
      x: { c: 0, label: "Time", unit: "ms", scale: 1e-3, time: true },
      y: [{ c: 2, label: "Voltage", unit: "V", scale: 1e-3, color: RED }, { c: 1, label: "Current", unit: "mA", scale: 1, color: BLUE, right: true, zero: true }],
      wiring: { in: "Power source", out: "Device under test" },
      duration: "as set",
      summary: function (r) {
        var e = 0, q = 0;
        for (var i = 1; i < r.length; i++) { var dt = (r[i][0] - r[i - 1][0]) / 3.6e6; e += r[i][1] * r[i][2] / 1000 * dt; q += r[i][1] * dt; }
        var t = (r[r.length - 1][0] - r[0][0]) / 1000, pm = r.reduce(function (m, x) { return Math.max(m, x[1] * x[2] / 1000); }, 0);
        return [["Voltage", V(min(r, 2).v) + " … " + V(max(r, 2).v)], ["Current", A(min(r, 1).v) + " … " + A(max(r, 1).v)],
          ["Power", "max " + W(pm) + ", average " + W(t > 0 ? e / (t / 3600) : 0)], ["Energy and charge", (e).toFixed(2) + " mWh, " + q.toFixed(2) + " mAh"]];
      }
    },
    {
      id: "cal", cmd: "c", name: "Calibration", short: "Calibration",
      info: "Sets a constant load and averages both sensors. Measure current and voltage with a good multimeter at the same time; the app works out the calibration factors for the firmware.",
      params: [{ id: "a", name: "Load current", unit: "mA", min: 17, max: 5000, def: 1000 }, { id: "b", name: "Duration", unit: "s", min: 1, max: 65535, def: 10 }],
      cols: ["Load current [mA]", "Load voltage [mV]", "Supply current [mA]", "Supply voltage [mV]"],
      x: { c: -1, label: "Reading", unit: "", scale: 1 },
      y: [{ c: 1, label: "Load voltage", unit: "V", scale: 1e-3, color: RED }, { c: 0, label: "Load current", unit: "mA", scale: 1, color: BLUE, right: true, zero: true }],
      wiring: { cal: true },
      duration: "as set",
      summary: function (r) {
        var l = r[r.length - 1];
        return [["Load side (TEST-IN)", A(l[0]) + ", " + V(l[1])], ["Supply side (PWR-IN/OUT)", A(l[2]) + ", " + V(l[3])]];
      }
    }
  ];
  // internal resistance from the straight part of a load curve (least squares of U over I)
  function resistance(r) {
    var pts = r.slice(1, Math.max(3, Math.floor(r.length * 0.6))), n = pts.length, sx = 0, sy = 0, sxx = 0, sxy = 0;
    pts.forEach(function (p) { sx += p[0]; sy += p[1]; sxx += p[0] * p[0]; sxy += p[0] * p[1]; });
    var d = n * sxx - sx * sx;
    if (!d) return "–";
    var slope = (n * sxy - sx * sy) / d;      // mV per mA = ohms
    return (-slope * 1000).toFixed(0) + " mΩ";
  }

  global.PA = global.PA || {};
  global.PA.TESTS = TESTS;
  global.PA.test = function (id) { for (var i = 0; i < TESTS.length; i++) if (TESTS[i].id === id || TESTS[i].cmd === id) return TESTS[i]; return null; };
  global.PA.fmt = { V: V, A: A, W: W, dur: dur };
})(typeof window !== "undefined" ? window : globalThis);
