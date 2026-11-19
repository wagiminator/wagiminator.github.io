/* Oscilloscope: the screen. 10 × 8 divisions, the traces, markers for the zero lines (left), the
 * trigger level (right) and the trigger point (top), which can be dragged, two time cursors,
 * XY mode, and the spectrum in a second canvas. */
(function (global) {
  "use strict";
  var OSC = global.OSC;

  var THEMES = {
    dark: { bg: "#0d1117", grid: "rgba(255,255,255,0.13)", fine: "rgba(255,255,255,0.28)", text: "#c9d1dc", dim: "#7d8899", ch: ["#ffd23f", "#3fd0f0"], trig: "#ff6b6b", cur: "#c79bff", spec: "#7ee787" },
    light: { bg: "#ffffff", grid: "rgba(0,0,0,0.12)", fine: "rgba(0,0,0,0.3)", text: "#2b2f36", dim: "#6b7280", ch: ["#b07d00", "#0a86a6"], trig: "#d0312d", cur: "#7a3fc0", spec: "#2a8a3a" }
  };
  var MONO = '11px ui-monospace, "Cascadia Mono", "SF Mono", Menlo, Consolas, monospace';
  var PAD = { l: 26, r: 26, t: 18, b: 18 };

  function Screen(canvas, specCanvas, opts) {
    this.c = canvas; this.sc = specCanvas; this.opts = opts || {};
    this.theme = "dark"; this.state = null; this.drag = null;
    var self = this;
    this.ro = new ResizeObserver(function () { self.size(); self.draw(); });
    this.ro.observe(canvas.parentNode);
    this.bind();
    this.size();
  }
  var P = Screen.prototype;
  P.T = function () { return THEMES[this.theme] || THEMES.dark; };
  P.size = function () {
    var d = global.devicePixelRatio || 1, w = this.c.parentNode.clientWidth, h = Math.round(Math.min(w * 0.68, global.innerHeight * 0.66));
    h = Math.max(240, h);
    this.W = w; this.H = h;
    this.c.width = Math.round(w * d); this.c.height = Math.round(h * d); this.c.style.width = w + "px"; this.c.style.height = h + "px";
    this.c.getContext("2d").setTransform(d, 0, 0, d, 0, 0);
    if (this.sc) {
      var sh = Math.round(Math.max(160, h * 0.42));
      this.sc.width = Math.round(w * d); this.sc.height = Math.round(sh * d); this.sc.style.width = w + "px"; this.sc.style.height = sh + "px";
      this.sc.getContext("2d").setTransform(d, 0, 0, d, 0, 0);
      this.SH = sh;
    }
  };
  // plot area
  P.area = function () { var w = this.W - PAD.l - PAD.r, h = this.H - PAD.t - PAD.b; return { x: PAD.l, y: PAD.t, w: w, h: h, dx: w / 10, dy: h / 8 }; };
  P.yOf = function (S, c, v) { var A = this.area(), vd = OSC.VDIV[S.ch[c].range] * (S.ch[c].probe || 1); return A.y + A.h / 2 - (v / vd + S.ch[c].pos) * A.dy; };
  P.vOf = function (S, c, y) { var A = this.area(), vd = OSC.VDIV[S.ch[c].range] * (S.ch[c].probe || 1); return ((A.y + A.h / 2 - y) / A.dy - S.ch[c].pos) * vd; };
  P.xOfT = function (S, t) { var A = this.area(); return A.x + (t / (10 * S.tdiv) + S.hpos / 100) * A.w; };
  P.tOfX = function (S, x) { var A = this.area(); return ((x - A.x) / A.w - S.hpos / 100) * 10 * S.tdiv; };

  P.set = function (st) { this.state = st; this.draw(); };
  P.draw = function () {
    var st = this.state, c = this.c.getContext("2d"), T = this.T(), A = this.area(), W = this.W, H = this.H, self = this;
    c.fillStyle = T.bg; c.fillRect(0, 0, W, H);
    // grid
    c.strokeStyle = T.grid; c.lineWidth = 1; c.beginPath();
    for (var i = 0; i <= 10; i++) { var x = Math.round(A.x + i * A.dx) + 0.5; c.moveTo(x, A.y); c.lineTo(x, A.y + A.h); }
    for (var j = 0; j <= 8; j++) { var y = Math.round(A.y + j * A.dy) + 0.5; c.moveTo(A.x, y); c.lineTo(A.x + A.w, y); }
    c.stroke();
    c.strokeStyle = T.fine; c.beginPath();
    var cx = Math.round(A.x + A.w / 2) + 0.5, cy = Math.round(A.y + A.h / 2) + 0.5;
    for (var k = 0; k <= 50; k++) { var xx = Math.round(A.x + k * A.dx / 5) + 0.5; c.moveTo(xx, cy - 3); c.lineTo(xx, cy + 3); }
    for (var m = 0; m <= 40; m++) { var yy = Math.round(A.y + m * A.dy / 5) + 0.5; c.moveTo(cx - 3, yy); c.lineTo(cx + 3, yy); }
    c.stroke();
    if (!st || !st.S) return;
    var S = st.S, f = st.frame;
    c.save(); c.beginPath(); c.rect(A.x, A.y, A.w, A.h); c.clip();
    if (f && S.xy && f.ch[0] && f.ch[1]) this.drawXY(c, S, f, T);
    else if (f) [0, 1].forEach(function (ch) { if (f.ch[ch] && S.ch[ch].on) self.trace(c, S, f, ch, T.ch[ch]); });
    // cursors
    if (S.curOn && !S.xy) {
      ["a", "b"].forEach(function (k) {
        var x = self.xOfT(S, S.cursors[k]); if (x < A.x || x > A.x + A.w) return;
        c.strokeStyle = T.cur; c.setLineDash([5, 4]); c.beginPath(); c.moveTo(Math.round(x) + 0.5, A.y); c.lineTo(Math.round(x) + 0.5, A.y + A.h); c.stroke(); c.setLineDash([]);
        c.fillStyle = T.cur; c.font = "bold " + MONO; c.textAlign = "left"; c.textBaseline = "top"; c.fillText(k.toUpperCase(), x + 4, A.y + 4);
      });
    }
    c.restore();
    if (S.xy) { this.label(c, T, st); return; }
    // zero markers (left), trigger level (right), trigger point (top)
    [0, 1].forEach(function (ch) {
      if (!S.ch[ch].on) return;
      var y = Math.max(A.y, Math.min(A.y + A.h, self.yOf(S, ch, 0)));
      self.marker(c, A.x - 2, y, "left", T.ch[ch], String(ch + 1));
    });
    var tc = S.trig.src, ty = this.yOf(S, tc, S.trig.level);
    if (!(f && f.roll)) {
      this.marker(c, A.x + A.w + 2, Math.max(A.y, Math.min(A.y + A.h, ty)), "right", T.ch[tc], "T");
      var tx = this.xOfT(S, 0);
      if (tx >= A.x && tx <= A.x + A.w) { c.fillStyle = T.trig; c.beginPath(); c.moveTo(tx - 6, A.y - 12); c.lineTo(tx + 6, A.y - 12); c.lineTo(tx, A.y - 2); c.closePath(); c.fill(); }
    }
    this.label(c, T, st);
    if (st.spec && this.sc) this.drawSpec(st);
  };
  P.trace = function (c, S, f, ch, col) {
    var d = f.ch[ch], A = this.area(), n = d.length, self = this;
    if (!n) return;
    var t0, dt = 1 / f.rate;
    if (f.roll) t0 = -(n / f.rate) + (1 - S.hpos / 100) * 10 * S.tdiv;      // newest sample at the right edge
    else t0 = -(f.pre + f.frac) / f.rate;
    var x0 = this.xOfT(S, t0), dx = (this.xOfT(S, t0 + dt) - x0), y = function (v) { return self.yOf(S, ch, v); };
    c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 1.4; c.lineJoin = "round";
    c.beginPath();
    if (dx >= 0.5) {
      for (var i = 0; i < n; i++) { var X = x0 + i * dx, Y = y(d[i]); if (i) c.lineTo(X, Y); else c.moveTo(X, Y); }
      c.stroke();
      if (dx >= 6) for (var k = 0; k < n; k++) c.fillRect(x0 + k * dx - 1.5, y(d[k]) - 1.5, 3, 3);
    } else {
      // more samples than pixels: the lowest and highest value of each pixel column
      var per = 1 / dx, cols = Math.ceil(n * dx) + 1, first = true;
      for (var col2 = 0; col2 < cols; col2++) {
        var a = Math.floor(col2 * per), b = Math.min(n, Math.floor((col2 + 1) * per));
        if (b <= a) continue;
        var lo = Infinity, hi = -Infinity;
        for (var q = a; q < b; q++) { var v = d[q]; if (v < lo) lo = v; if (v > hi) hi = v; }
        var X2 = x0 + a * dx;
        if (first) { c.moveTo(X2, y(hi)); first = false; } else c.lineTo(X2, y(hi));
        c.lineTo(X2, y(lo));
      }
      c.stroke();
    }
  };
  P.drawXY = function (c, S, f, T) {
    var a = f.ch[0], b = f.ch[1], n = Math.min(a.length, b.length), A = this.area();
    var vx = OSC.VDIV[S.ch[0].range] * (S.ch[0].probe || 1), vy = OSC.VDIV[S.ch[1].range] * (S.ch[1].probe || 1);
    c.fillStyle = T.ch[0]; c.globalAlpha = 0.6;
    var step = Math.max(1, Math.floor(n / 20000));
    for (var i = 0; i < n; i += step) {
      var X = A.x + A.w / 2 + (a[i] / vx + S.ch[0].pos) * A.dx, Y = A.y + A.h / 2 - (b[i] / vy + S.ch[1].pos) * A.dy;
      c.fillRect(X - 1, Y - 1, 2, 2);
    }
    c.globalAlpha = 1;
  };
  P.marker = function (c, x, y, side, col, txt) {
    c.fillStyle = col; c.beginPath();
    if (side === "left") { c.moveTo(x, y); c.lineTo(x - 10, y - 8); c.lineTo(x - 22, y - 8); c.lineTo(x - 22, y + 8); c.lineTo(x - 10, y + 8); }
    else { c.moveTo(x, y); c.lineTo(x + 10, y - 8); c.lineTo(x + 22, y - 8); c.lineTo(x + 22, y + 8); c.lineTo(x + 10, y + 8); }
    c.closePath(); c.fill();
    c.fillStyle = this.theme === "light" ? "#fff" : "#0d1117"; c.font = "bold " + MONO; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(txt, side === "left" ? x - 14 : x + 14, y + 0.5);
  };
  P.label = function (c, T, st) {
    var A = this.area();
    c.font = MONO; c.textBaseline = "bottom"; c.textAlign = "left"; c.fillStyle = T.dim;
    if (st.status) { c.fillStyle = st.statusColor || T.text; c.fillText(st.status, A.x + 2, A.y - 3); }
    if (st.info) { c.fillStyle = T.dim; c.textAlign = "right"; c.fillText(st.info, A.x + A.w - 2, A.y - 3); }
    c.textBaseline = "top"; c.textAlign = "left";
    var x = A.x + 2, S = st.S;
    [0, 1].forEach(function (ch) {
      if (!S.ch[ch].on) return;
      var vd = OSC.VDIV[S.ch[ch].range] * (S.ch[ch].probe || 1), t = "CH" + (ch + 1) + " " + fmtV(vd) + "/div" + (S.ch[ch].coupling === "AC" ? " AC" : "") + (st.clip && st.clip[ch] ? " ⚠ over range" : "");
      c.fillStyle = T.ch[ch]; c.fillText(t, x, A.y + A.h + 4); x += c.measureText(t).width + 18;
    });
    c.fillStyle = T.text; c.textAlign = "right"; c.fillText(fmtT(S.tdiv) + "/div", A.x + A.w - 2, A.y + A.h + 4);
  };
  P.drawSpec = function (st) {
    var sp = st.spec, c = this.sc.getContext("2d"), T = this.T(), W = this.W, H = this.SH, L = 56, R = 12, Tp = 10, B = 22, w = W - L - R, h = H - Tp - B;
    c.fillStyle = T.bg; c.fillRect(0, 0, W, H);
    if (!sp) return;
    var top = 20, bot = -100, nb = Math.max(8, Math.round(sp.db.length * (sp.span || 1))), fmax = sp.df * nb;
    c.strokeStyle = T.grid; c.lineWidth = 1; c.font = MONO; c.fillStyle = T.dim; c.textAlign = "right"; c.textBaseline = "middle";
    c.beginPath();
    for (var db = top; db >= bot; db -= 20) { var y = Math.round(Tp + (top - db) / (top - bot) * h) + 0.5; c.moveTo(L, y); c.lineTo(L + w, y); c.fillText(db + " dB", L - 4, y); }
    c.stroke();
    c.textAlign = "center"; c.textBaseline = "top";
    c.beginPath();
    for (var i = 0; i <= 10; i++) { var x = Math.round(L + i * w / 10) + 0.5; c.moveTo(x, Tp); c.lineTo(x, Tp + h); if (i % 2 === 0) { c.textAlign = i === 10 ? "right" : i === 0 ? "left" : "center"; c.fillText(fmtF(fmax * i / 10), x, Tp + h + 4); } }
    c.stroke();
    c.strokeStyle = T.ch[sp.ch] || T.spec; c.lineWidth = 1.2; c.beginPath();
    var n = nb, per = n / w;
    for (var px = 0; px < w; px++) {
      var a = Math.floor(px * per), b = Math.max(a + 1, Math.floor((px + 1) * per)), mx = -Infinity;
      for (var k = a; k < b && k < n; k++) if (sp.db[k] > mx) mx = sp.db[k];
      if (mx === -Infinity) continue;
      var Y = Tp + (top - Math.max(bot, Math.min(top, mx))) / (top - bot) * h;
      if (px) c.lineTo(L + px, Y); else c.moveTo(L + px, Y);
    }
    c.stroke();
    c.fillStyle = T.text; c.textAlign = "right"; c.textBaseline = "top";
    c.fillText("CH" + (sp.ch + 1) + " spectrum, peak " + fmtF(sp.peak.f) + " at " + sp.peak.db.toFixed(1) + " dBV", L + w - 4, Tp + 4);
  };

  // a value with three (frequency: four) significant digits in a fitting unit
  function fmt(v, units, digits) {
    var a = Math.abs(v);
    if (a === 0 || !isFinite(v)) return "0 " + units[units.length - 1][1];
    for (var i = 0; i < units.length; i++) {
      var r = +(v / units[i][0]).toPrecision(digits);
      if (Math.abs(r) >= 1 || i === units.length - 1) return r + " " + units[i][1];
    }
  }
  var UV = [[1, "V"], [1e-3, "mV"], [1e-6, "µV"]], UT = [[1, "s"], [1e-3, "ms"], [1e-6, "µs"], [1e-9, "ns"]], UF = [[1e6, "MHz"], [1e3, "kHz"], [1, "Hz"]];
  function fmtV(v) { return fmt(v, UV, 3); }
  function fmtT(t) { return fmt(t, UT, 3); }
  function fmtF(f) { return fmt(f, UF, 4); }

  // ---------------------------------------------------------------- dragging the markers and cursors
  P.bind = function () {
    var self = this, cv = this.c;
    function pos(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function hit(p) {
      var st = self.state; if (!st || !st.S) return null;
      var S = st.S, A = self.area();
      if (p.x < A.x + 4) {
        var best = null, bd = 14;
        [0, 1].forEach(function (ch) { if (!S.ch[ch].on) return; var d = Math.abs(self.yOf(S, ch, 0) - p.y); if (d < bd) { bd = d; best = ch; } });
        if (best !== null) return { kind: "pos", ch: best };
      }
      if (p.x > A.x + A.w - 4 && !S.xy) return { kind: "level" };
      if (p.y < A.y + 2 && !S.xy) return { kind: "hpos" };
      if (S.curOn && !S.xy) {
        var xa = self.xOfT(S, S.cursors.a), xb = self.xOfT(S, S.cursors.b);
        return { kind: "cur", k: Math.abs(p.x - xa) <= Math.abs(p.x - xb) ? "a" : "b" };
      }
      return null;
    }
    function apply(h, p) {
      var S = self.state.S, A = self.area();
      if (h.kind === "pos") { var v = Math.round(((A.y + A.h / 2 - p.y) / A.dy) * 10) / 10; if (self.opts.onPos) self.opts.onPos(h.ch, Math.max(-4, Math.min(4, v))); }
      else if (h.kind === "level") { if (self.opts.onLevel) self.opts.onLevel(self.vOf(S, S.trig.src, p.y)); }
      else if (h.kind === "hpos") { if (self.opts.onHpos) self.opts.onHpos(Math.max(0, Math.min(100, Math.round((p.x - A.x) / A.w * 100)))); }
      else if (h.kind === "cur") { if (self.opts.onCursor) self.opts.onCursor(h.k, self.tOfX(S, Math.max(A.x, Math.min(A.x + A.w, p.x)))); }
    }
    cv.addEventListener("pointerdown", function (e) {
      var p = pos(e), h = hit(p);
      if (!h) return;
      self.drag = h; cv.setPointerCapture(e.pointerId); apply(h, p); e.preventDefault();
    });
    cv.addEventListener("pointermove", function (e) {
      var p = pos(e);
      if (self.drag) { apply(self.drag, p); return; }
      var h = hit(p);
      cv.style.cursor = !h ? "default" : h.kind === "hpos" || h.kind === "cur" ? "ew-resize" : "ns-resize";
    });
    var up = function () { self.drag = null; };
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
  };

  Object.assign(OSC, { Screen: Screen, fmtV: fmtV, fmtT: fmtT, fmtF: fmtF });
})(window);
