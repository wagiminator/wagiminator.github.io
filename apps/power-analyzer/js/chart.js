/* Power Analyzer: a line chart with one or two value axes, live updates, a crosshair and
 * other runs of the same test drawn on top for comparison. */
(function (global) {
  "use strict";

  var PALETTE = ["#1f6fb2", "#c8323b", "#2e8b57", "#8a4fd6", "#d9822b", "#00838f", "#a33d74", "#5d6470"];
  var FONT = "12px Chivo, system-ui, sans-serif";

  function nice(lo, hi, count) {
    if (!(hi > lo)) { hi = lo + 1; }
    var span = hi - lo, raw = span / (count || 5), p = Math.pow(10, Math.floor(Math.log10(raw))), step = p;
    [1, 2, 2.5, 5, 10].some(function (m) { if (m * p >= raw) { step = m * p; return true; } return false; });
    var a = Math.floor(lo / step + 1e-9) * step, b = Math.ceil(hi / step - 1e-9) * step;
    var ticks = [];
    for (var v = a; v <= b + step * 1e-6; v += step) ticks.push(+v.toFixed(10));
    return { lo: a, hi: b, step: step, ticks: ticks };
  }
  function fmtTick(v, step) {
    var d = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
    if (Math.abs(step * Math.pow(10, d) - Math.round(step * Math.pow(10, d))) > 1e-6) d++;
    return v.toFixed(Math.min(d, 4));
  }

  function Chart(canvas, opts) {
    this.c = canvas;
    this.opts = opts || {};
    this.test = null;
    this.sets = [];
    this.hoverX = null;
    var self = this;
    this.ro = new ResizeObserver(function () { self.draw(); });
    this.ro.observe(canvas);
    canvas.addEventListener("pointermove", function (e) { var r = canvas.getBoundingClientRect(); self.hoverX = e.clientX - r.left; self.draw(); });
    canvas.addEventListener("pointerleave", function () { self.hoverX = null; self.draw(); if (self.opts.onHover) self.opts.onHover(null); });
    canvas.addEventListener("pointerdown", function (e) { var r = canvas.getBoundingClientRect(); self.hoverX = e.clientX - r.left; self.draw(); });
  }
  var P = Chart.prototype;
  // sets: [{ rows, name, main }]
  P.set = function (test, sets) { this.test = test; this.sets = sets || []; this.draw(); };
  P.redraw = function () {
    if (this.pending) return;
    this.pending = true;
    var self = this;
    requestAnimationFrame(function () { self.pending = false; self.draw(); });
  };
  P.xv = function (row, i) { var x = this.test.x; return x.c < 0 ? i : row[x.c] * x.scale; };
  P.timeUnit = function (maxS) {
    if (maxS >= 7200) return { f: 1 / 3600, u: "h" };
    if (maxS >= 180) return { f: 1 / 60, u: "min" };
    return { f: 1, u: "s" };
  };
  P.domains = function () {
    var t = this.test, self = this, xs = [Infinity, -Infinity], ys = t.y.map(function () { return [Infinity, -Infinity]; });
    this.sets.forEach(function (d) {
      d.rows.forEach(function (r, i) {
        var x = self.xv(r, i);
        if (x < xs[0]) xs[0] = x; if (x > xs[1]) xs[1] = x;
        t.y.forEach(function (s, k) { var v = r[s.c] * s.scale; if (v < ys[k][0]) ys[k][0] = v; if (v > ys[k][1]) ys[k][1] = v; });
      });
    });
    if (!isFinite(xs[0])) xs = [0, 1];
    if (t.x.c >= 0 && !t.x.time && t.x.unit === "mA") xs[0] = 0;
    if (t.x.time) xs[0] = Math.min(xs[0], 0);
    ys = ys.map(function (r, k) {
      var s = t.y[k];
      if (!isFinite(r[0])) r = [0, 1];
      if (s.zero) r[0] = Math.min(0, r[0]);
      var span = r[1] - r[0], minSpan = s.unit === "V" ? 0.05 : s.unit === "%" ? 5 : 2;
      if (span < minSpan) { var m = (r[0] + r[1]) / 2; r = [m - minSpan / 2, m + minSpan / 2]; if (s.zero && r[0] < 0) r = [0, minSpan]; }
      else if (!s.zero) { r = [r[0] - span * 0.08, r[1] + span * 0.08]; }
      else r[1] += span * 0.05;
      if (s.max != null && r[1] > s.max) r[1] = s.max;
      return r;
    });
    return { x: xs, y: ys };
  };
  P.draw = function (target, scale) {
    var c = target || this.c, dpr = scale || window.devicePixelRatio || 1, w = target ? c.width / dpr : c.clientWidth, h = target ? c.height / dpr : c.clientHeight;
    if (!target) {
      if (!w || !h) return;
      if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    }
    var g = c.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = "#fff"; g.fillRect(0, 0, w, h);
    var t = this.test;
    if (!t) return;
    if (!this.sets.some(function (d) { return d.rows.length; })) {
      g.strokeStyle = "#dcdde6"; g.setLineDash([6, 5]); g.strokeRect(10.5, 10.5, w - 21, h - 21); g.setLineDash([]);
      g.fillStyle = "#5d6470"; g.font = FONT; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(this.sets.length ? "Waiting for the first readings …" : "The readings of the test appear here: " + t.y.map(function (s) { return s.label.toLowerCase(); }).join(" and ") + " over " + t.x.label.toLowerCase() + ".", w / 2, h / 2);
      g.textAlign = "left";
      return;
    }
    var two = t.y.length > 1, L = 60, R = two ? 62 : 18, T = 14, B = 42, pw = w - L - R, ph = h - T - B, self = this;
    if (pw < 40 || ph < 40) return;
    var dom = this.domains(), xu = t.x.time ? this.timeUnit(dom.x[1]) : { f: 1, u: t.x.unit };
    var xn = nice(dom.x[0] * xu.f, dom.x[1] * xu.f, Math.max(3, Math.floor(pw / 90)));
    var yn = dom.y.map(function (r) { return nice(r[0], r[1], Math.max(3, Math.floor(ph / 55))); });
    // second axis gets the same number of lines as the first
    if (two) {
      var n0 = yn[0].ticks.length - 1, r1 = dom.y[1], st = (r1[1] - r1[0]) / n0, p = Math.pow(10, Math.floor(Math.log10(st))), step = p;
      [1, 2, 2.5, 5, 10].some(function (m) { if (m * p >= st) { step = m * p; return true; } return false; });
      var lo = Math.floor(r1[0] / step) * step;
      if (t.y[1].zero && r1[0] >= 0) lo = Math.max(0, lo);
      yn[1] = { lo: lo, hi: lo + step * n0, step: step, ticks: yn[0].ticks.map(function (x, i) { return +(lo + i * step).toFixed(10); }) };
    }
    var X = function (v) { return L + (v * xu.f - xn.lo) / (xn.hi - xn.lo) * pw; };
    var Y = function (k, v) { return T + ph - (v - yn[k].lo) / (yn[k].hi - yn[k].lo) * ph; };
    // grid and axes
    g.font = FONT; g.lineWidth = 1;
    g.strokeStyle = "#e7e9ef"; g.beginPath();
    yn[0].ticks.forEach(function (v) { var y = Math.round(Y(0, v)) + 0.5; g.moveTo(L, y); g.lineTo(L + pw, y); });
    xn.ticks.forEach(function (v) { var x = Math.round(L + (v - xn.lo) / (xn.hi - xn.lo) * pw) + 0.5; g.moveTo(x, T); g.lineTo(x, T + ph); });
    g.stroke();
    g.strokeStyle = "#9aa0ad"; g.strokeRect(L + 0.5, T + 0.5, pw, ph);
    g.textBaseline = "middle";
    var multi = this.sets.length > 1;
    yn.forEach(function (n, k) {
      g.fillStyle = multi ? "#2b2f36" : t.y[k].color; g.textAlign = k ? "left" : "right";
      n.ticks.forEach(function (v) { g.fillText(fmtTick(v, n.step), k ? L + pw + 7 : L - 7, Y(k, v)); });
    });
    g.fillStyle = "#5d6470"; g.textAlign = "center"; g.textBaseline = "top";
    xn.ticks.forEach(function (v) { g.fillText(fmtTick(v, xn.step), L + (v - xn.lo) / (xn.hi - xn.lo) * pw, T + ph + 6); });
    g.textAlign = "right"; g.fillText(t.x.label + " [" + xu.u + "]", L + pw, T + ph + 23);
    g.save(); g.font = "bold " + FONT;
    t.y.forEach(function (s, k) {
      g.fillStyle = multi ? "#2b2f36" : s.color; g.textAlign = k ? "right" : "left"; g.textBaseline = "top";
      var lbl = s.label + " [" + s.unit + "]";
      if (k) g.fillText(lbl, L + pw - 6, T + 5); else g.fillText(lbl, L + 6, T + 5);
    });
    g.restore();
    // data
    g.save(); g.beginPath(); g.rect(L, T, pw, ph); g.clip();
    this.sets.forEach(function (d, di) {
      var col = multi ? PALETTE[di % PALETTE.length] : null;
      t.y.forEach(function (s, k) {
        g.strokeStyle = col || s.color; g.lineWidth = d.main ? 2 : 1.6; g.setLineDash(multi && k ? [6, 4] : []);
        g.beginPath();
        var step = Math.max(1, Math.floor(d.rows.length / (pw * 2)));
        for (var i = 0; i < d.rows.length; i += step) {
          var r = d.rows[i], x = X(self.xv(r, i)), y = Y(k, r[s.c] * s.scale);
          if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
        }
        g.stroke();
      });
    });
    g.setLineDash([]);
    // crosshair on the main run
    var main = this.sets.filter(function (d) { return d.main; })[0] || this.sets[0];
    if (this.hoverX != null && main && main.rows.length && !target) {
      var best = -1, bd = Infinity;
      for (var i = 0; i < main.rows.length; i++) { var dx = Math.abs(X(self.xv(main.rows[i], i)) - this.hoverX); if (dx < bd) { bd = dx; best = i; } }
      if (best >= 0 && bd < 40) {
        var row = main.rows[best], hx = X(self.xv(row, best));
        g.strokeStyle = "rgba(43,47,54,0.45)"; g.lineWidth = 1; g.beginPath(); g.moveTo(Math.round(hx) + 0.5, T); g.lineTo(Math.round(hx) + 0.5, T + ph); g.stroke();
        t.y.forEach(function (s, k) {
          g.fillStyle = multi ? PALETTE[self.sets.indexOf(main) % PALETTE.length] : s.color;
          g.beginPath(); g.arc(hx, Y(k, row[s.c] * s.scale), 4, 0, 7); g.fill();
        });
        if (this.opts.onHover) this.opts.onHover(row, best, xu);
      }
    }
    g.restore();
  };
  // a picture of the chart with a title and the results
  P.png = function (title, lines) {
    var w = 1100, h = 640, s = 2, c = document.createElement("canvas"), head = 54, foot = 22 + Math.ceil(lines.length / 2) * 22;
    c.width = w * s; c.height = (h + head + foot) * s;
    var g = c.getContext("2d");
    g.scale(s, s); g.fillStyle = "#fff"; g.fillRect(0, 0, w, h + head + foot);
    g.fillStyle = "#00509e"; g.font = "bold 20px Chivo, system-ui, sans-serif"; g.textBaseline = "top"; g.fillText(title[0], 16, 14);
    g.fillStyle = "#5d6470"; g.font = "14px Chivo, system-ui, sans-serif"; g.textAlign = "right"; g.fillText(title[1] || "", w - 16, 18); g.textAlign = "left";
    var sub = document.createElement("canvas"); sub.width = w * s; sub.height = h * s;
    this.draw(sub, s);
    g.drawImage(sub, 0, head, w, h);
    g.font = "14px Chivo, system-ui, sans-serif"; g.fillStyle = "#2b2f36";
    lines.forEach(function (l, i) { g.fillText(l[0] + ": " + l[1], 16 + (i % 2) * (w / 2), head + h + 12 + Math.floor(i / 2) * 22); });
    return c;
  };

  global.PA = global.PA || {};
  global.PA.Chart = Chart;
  global.PA.PALETTE = PALETTE;
})(window);
