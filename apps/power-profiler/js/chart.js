/* Power Profiler: the chart. Current over time (band from min to max of each pixel column with the
 * average as line), the logic inputs D0–D7 below, a time ruler, and an overview of the whole
 * recording. Wheel or pinch zooms, dragging selects (or moves), the overview moves the view. */
(function (global) {
  "use strict";
  var PP = global.PP;

  // colours of the two backgrounds
  var THEMES = {
    dark: { BG: "#0f141b", GRID: "rgba(255,255,255,0.07)", TEXT: "#c9d1dc", DIM: "#7d8899", LINE: "#5ce1e6", BAND: "rgba(92,225,230,0.28)",
      SEL: "rgba(255,209,102,0.16)", SELB: "#ffd166", TRIG: "#ff6b6b", HOV: "rgba(255,255,255,0.55)", DOT: "#ffffff", RULERBG: "#161b24",
      OVERFILL: "rgba(92,225,230,0.55)", WINF: "rgba(255,255,255,0.12)", WINS: "rgba(255,255,255,0.5)", LOST: "rgba(255,107,107,0.35)", SELO: "rgba(255,209,102,0.5)",
      BITS: ["#9aa4b2", "#b5763c", "#e5484d", "#f08c2e", "#f2d03b", "#3fb950", "#4c9aff", "#b48cf2"] },
    light: { BG: "#ffffff", GRID: "rgba(0,0,0,0.08)", TEXT: "#2b2f36", DIM: "#6b7280", LINE: "#1f6fb2", BAND: "rgba(31,111,178,0.2)",
      SEL: "rgba(224,168,0,0.14)", SELB: "#c08a00", TRIG: "#d0312d", HOV: "rgba(0,0,0,0.45)", DOT: "#0f141b", RULERBG: "#f0f2f6",
      OVERFILL: "rgba(31,111,178,0.5)", WINF: "rgba(0,0,0,0.07)", WINS: "rgba(0,0,0,0.4)", LOST: "rgba(208,49,45,0.35)", SELO: "rgba(192,138,0,0.6)",
      BITS: ["#5a6270", "#8a5528", "#c62f34", "#c96a12", "#a88400", "#2a8a3a", "#2f6fd0", "#7f4fc0"] }
  };
  var BG, GRID, TEXT, DIM, LINE, BAND, SEL, SELB, TRIG, HOV, DOT, RULERBG, OVERFILL, WINF, WINS, LOST, SELO, BITS;
  function useTheme(name) {
    var t = THEMES[name] || THEMES.dark;
    BG = t.BG; GRID = t.GRID; TEXT = t.TEXT; DIM = t.DIM; LINE = t.LINE; BAND = t.BAND; SEL = t.SEL; SELB = t.SELB; TRIG = t.TRIG; HOV = t.HOV; DOT = t.DOT;
    RULERBG = t.RULERBG; OVERFILL = t.OVERFILL; WINF = t.WINF; WINS = t.WINS; LOST = t.LOST; SELO = t.SELO; BITS = t.BITS;
  }
  useTheme("dark");
  var MONO = '11px ui-monospace, "Cascadia Mono", "SF Mono", Menlo, Consolas, monospace';
  var LW = 66, RULER = 22, LANE = 17;

  function amps(v, d) {
    if (!isFinite(v)) return "–";
    var a = Math.abs(v), u = a >= 1 ? [1, "A"] : a >= 1e-3 ? [1e-3, "mA"] : a >= 1e-6 ? [1e-6, "µA"] : [1e-9, "nA"];
    var x = v / u[0], t = Math.abs(x) >= 100 ? x.toFixed(d == null ? 0 : Math.max(0, d - 2)) : Math.abs(x) >= 10 ? x.toFixed(d == null ? 1 : Math.max(0, d - 1)) : x.toFixed(d == null ? 2 : d);
    return t + " " + u[1];
  }
  function secs(t, step) {
    var a = Math.abs(step || t), u = a >= 1 ? [1, "s"] : a >= 1e-3 ? [1e-3, "ms"] : [1e-6, "µs"];
    var x = t / u[0], d = step ? Math.max(0, Math.min(6, Math.ceil(-Math.log10(step / u[0]) + 0.001))) : 3;
    return x.toFixed(d) + " " + u[1];
  }

  function Chart(root, opts) {
    this.opts = opts || {};
    root.innerHTML = '<canvas class="ch-main" tabindex="0" aria-label="Current over time. Arrow keys move, plus and minus zoom, F shows everything."></canvas><canvas class="ch-over" aria-label="Overview of the whole recording"></canvas>';
    this.root = root;
    this.main = root.querySelector(".ch-main");
    this.over = root.querySelector(".ch-over");
    this.store = null;
    this.start = 0; this.spp = 100;
    this.follow = true; this.win = 5;              // live: the last win seconds
    this.log = false; this.mask = 0x0F;
    this.sel = null; this.marks = [];
    this.mode = "select";
    this.theme = "dark";
    this.hover = null;
    this.dirty = false;
    this.cache = {};
    var self = this;
    this.ro = new ResizeObserver(function () { self.layout(); });
    this.ro.observe(root);
    this.bind();
    this.layout();
  }
  var P = Chart.prototype;
  P.setStore = function (s) { this.store = s; this.sel = null; this.marks = []; this.follow = true; this.fitIfIdle(); this.redraw(); };
  P.fitIfIdle = function () { if (this.store && !this.follow) this.fit(); };
  P.lanes = function () { var n = 0; for (var b = 0; b < 8; b++) if (this.mask & (1 << b)) n++; return n; };
  P.layout = function () {
    var w = this.root.clientWidth, h = Math.max(240, this.root.clientHeight - 46);
    this.W = w; this.H = h;
    this.size(this.main, w, h); this.size(this.over, w, 40);
    this.redraw();
  };
  P.size = function (c, w, h) {
    var d = global.devicePixelRatio || 1;
    c.width = Math.round(w * d); c.height = Math.round(h * d); c.style.width = w + "px"; c.style.height = h + "px";
    c.getContext("2d").setTransform(d, 0, 0, d, 0, 0);
  };
  P.plotW = function () { return Math.max(10, this.W - LW - 8); };
  P.curH = function () { return Math.max(80, this.H - RULER - this.lanes() * LANE - (this.lanes() ? 8 : 0)); };
  P.n = function () { return this.store ? this.store.n : 0; };
  P.rate = function () { return this.store ? this.store.rate : 1e5; };
  P.sampleAt = function (x) { return this.start + (x - LW) * this.spp; };
  P.xOf = function (s) { return LW + (s - this.start) / this.spp; };
  P.minSpp = function () { return 1 / 40; };
  P.maxSpp = function () { return Math.max(this.n(), this.win * this.rate()) / this.plotW(); };
  P.clamp = function () {
    this.spp = Math.max(this.minSpp(), Math.min(this.maxSpp(), this.spp));
    var vis = this.plotW() * this.spp, n = this.n();
    if (vis >= n) this.start = 0; else this.start = Math.max(0, Math.min(n - vis, this.start));
  };
  P.applyFollow = function () {
    if (!this.follow || !this.store) return;
    this.spp = this.win * this.rate() / this.plotW();
    this.start = Math.max(0, this.n() - this.win * this.rate());
  };
  P.fit = function () {
    if (!this.store) return;
    this.follow = false;
    this.spp = Math.max(this.minSpp(), this.n() / this.plotW());
    this.start = 0;
    this.changed();
  };
  P.zoomAt = function (f, x) {
    if (!this.store) return;
    if (x == null) x = LW + this.plotW() / 2;
    var s = this.sampleAt(x);
    this.follow = false;
    this.spp *= f;
    this.spp = Math.max(this.minSpp(), Math.min(this.maxSpp(), this.spp));
    this.start = s - (x - LW) * this.spp;
    this.clamp(); this.changed();
  };
  P.pan = function (px) { if (!this.store) return; this.follow = false; this.start += px * this.spp; this.clamp(); this.changed(); };
  P.show = function (a, b) {
    if (!this.store) return;
    this.follow = false;
    var m = (b - a) * 0.05;
    this.spp = Math.max(this.minSpp(), (b - a + 2 * m) / this.plotW());
    this.start = a - m;
    this.clamp(); this.changed();
  };
  P.changed = function () { this.redraw(); if (this.opts.onView) this.opts.onView(); };
  P.visible = function () { var a = Math.max(0, this.start), b = Math.min(this.n(), this.start + this.plotW() * this.spp); return [a, b]; };
  P.redraw = function () {
    if (this.dirty) return;
    this.dirty = true;
    var self = this;
    requestAnimationFrame(function () { self.dirty = false; self.draw(); });
  };

  // ---------------------------------------------------------------- columns of the visible part
  P.columns = function () {
    var st = this.store, W = Math.ceil(this.plotW()), cols = [], o = {};
    for (var x = 0; x < W; x++) {
      var s0 = this.start + x * this.spp, s1 = s0 + this.spp;
      if (s1 <= 0 || s0 >= st.n) { cols.push(null); continue; }
      st.range(Math.floor(Math.max(0, s0)), Math.max(Math.floor(Math.max(0, s0)) + 1, Math.ceil(s1)), o);
      cols.push(o.cnt || o.any ? { min: o.min, max: o.max, avg: o.cnt ? o.sum / o.cnt : NaN, or: o.or, and: o.and, any: o.any } : null);
    }
    return cols;
  };
  P.yRange = function (cols) {
    var lo = Infinity, hi = -Infinity, pos = Infinity;
    cols.forEach(function (c) { if (c && c.min === c.min && isFinite(c.min)) { if (c.min < lo) lo = c.min; if (c.max > hi) hi = c.max; if (c.avg > 0 && c.avg < pos) pos = c.avg; if (c.min > 0 && c.min < pos) pos = c.min; } });
    if (!isFinite(lo)) { lo = 0; hi = 1e-3; }
    if (this.log) {
      var top = Math.pow(10, Math.ceil(Math.log10(Math.max(hi, 1e-8)) + 0.05));
      var bot = Math.pow(10, Math.floor(Math.log10(Math.max(isFinite(pos) ? pos : top / 1e4, top / 1e8))));
      if (top / bot < 100) bot = top / 100;
      return [bot, top];
    }
    if (lo > 0) lo = 0;
    if (hi - lo < 1e-9) hi = lo + 1e-6;
    var step = nice((hi - lo) / 5);
    return [Math.floor(lo / step) * step, Math.ceil(hi * 1.05 / step) * step];
  };
  function nice(x) { var p = Math.pow(10, Math.floor(Math.log10(x))), m = x / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; }

  // ---------------------------------------------------------------- drawing
  P.draw = function () {
    useTheme(this.theme);
    this.applyFollow();
    var c = this.main.getContext("2d"), W = this.W, H = this.H, pw = this.plotW(), ch = this.curH(), self = this;
    c.fillStyle = BG; c.fillRect(0, 0, W, H);
    c.font = MONO; c.textBaseline = "middle";
    if (!this.store || !this.store.n) {
      c.fillStyle = DIM; c.textAlign = "center";
      c.fillText(this.opts.emptyText || "No recording yet", LW + pw / 2, ch / 2);
      this.drawOver(); return;
    }
    var cols = this.columns(), yr = this.yRange(cols), top = 8, h = ch - 14;
    var Y = this.log ? function (v) { var l = Math.log10(Math.max(v, yr[0] * 0.5)); return top + h - (l - Math.log10(yr[0])) / (Math.log10(yr[1]) - Math.log10(yr[0])) * h; }
      : function (v) { return top + h - (v - yr[0]) / (yr[1] - yr[0]) * h; };
    this.Y = Y; this.yr = yr;
    // grid and labels of the current axis
    c.textAlign = "right"; c.lineWidth = 1;
    var ticks = [];
    if (this.log) for (var d = Math.log10(yr[0]); d <= Math.log10(yr[1]) + 1e-9; d++) ticks.push(Math.pow(10, Math.round(d)));
    else { var st = nice((yr[1] - yr[0]) / 5); for (var v = yr[0]; v <= yr[1] + st / 2; v += st) ticks.push(Math.abs(v) < st / 1e6 ? 0 : v); }
    ticks.forEach(function (v) {
      var y = Math.round(Y(v)) + 0.5;
      c.strokeStyle = GRID; c.beginPath(); c.moveTo(LW, y); c.lineTo(LW + pw, y); c.stroke();
      c.fillStyle = DIM; c.fillText(v === 0 ? "0" : amps(v, 0), LW - 6, y);
    });
    // time grid
    var tk = this.ticks();
    tk.forEach(function (t) { var x = Math.round(self.xOf(t.s)) + 0.5; c.strokeStyle = GRID; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H - RULER); c.stroke(); });
    // selection
    if (this.sel) {
      var xa = this.xOf(this.sel[0]), xb = this.xOf(this.sel[1]);
      c.fillStyle = SEL; c.fillRect(Math.max(LW, xa), 0, Math.min(LW + pw, xb) - Math.max(LW, xa), H - RULER);
      c.strokeStyle = SELB; c.lineWidth = 1;
      [xa, xb].forEach(function (x) { if (x >= LW && x <= LW + pw) { c.beginPath(); c.moveTo(Math.round(x) + 0.5, 0); c.lineTo(Math.round(x) + 0.5, H - RULER); c.stroke(); } });
    }
    // the current
    c.save(); c.beginPath(); c.rect(LW, 0, pw, ch); c.clip();
    if (this.spp >= 1) {
      c.fillStyle = BAND;
      cols.forEach(function (o, x) {
        if (!o || o.min !== o.min || !isFinite(o.min)) return;
        var y0 = Y(o.max), y1 = Y(o.min);
        c.fillRect(LW + x, y0, 1, Math.max(1, y1 - y0));
      });
      c.strokeStyle = LINE; c.lineWidth = 1.2; c.beginPath();
      var pen = false;
      cols.forEach(function (o, x) {
        if (!o || !(o.avg === o.avg)) { pen = false; return; }
        var y = Y(o.avg);
        if (pen) c.lineTo(LW + x + 0.5, y); else { c.moveTo(LW + x + 0.5, y); pen = true; }
      });
      c.stroke();
    } else {
      var s0 = Math.max(0, Math.floor(this.start)), s1 = Math.min(this.store.n, Math.ceil(this.start + pw * this.spp) + 1);
      c.strokeStyle = LINE; c.lineWidth = 1.4; c.beginPath();
      var on = false;
      for (var s = s0; s < s1; s++) {
        var v2 = this.store.at(s);
        if (v2 !== v2) { on = false; continue; }
        var xx = this.xOf(s), yy = Y(v2);
        if (on) c.lineTo(xx, yy); else { c.moveTo(xx, yy); on = true; }
        c.lineTo(this.xOf(s + 1), yy);
      }
      c.stroke();
      if (1 / this.spp > 8) { c.fillStyle = LINE; for (var s2 = s0; s2 < s1; s2++) { var v3 = this.store.at(s2); if (v3 === v3) c.fillRect(this.xOf(s2) - 1.5, Y(v3) - 1.5, 3, 3); } }
    }
    c.restore();
    // lost samples
    if (this.store.lost) {
      c.fillStyle = LOST;
      cols.forEach(function (o, x) { if (o && o.cnt === 0) c.fillRect(LW + x, 0, 1, 4); });
    }
    // logic lanes
    var ly = ch + 8, bitsShown = [];
    for (var b = 0; b < 8; b++) if (this.mask & (1 << b)) bitsShown.push(b);
    bitsShown.forEach(function (bit, k) {
      var y0 = ly + k * LANE, hi = y0 + 3, lo = y0 + LANE - 4, m = 1 << bit, col = BITS[bit];
      c.fillStyle = TEXT; c.textAlign = "right"; c.fillText("D" + bit, LW - 6, y0 + LANE / 2);
      c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 1.3;
      if (self.spp >= 1) {
        c.beginPath();
        var prev = null;
        cols.forEach(function (o, x) {
          if (!o || !o.any) { prev = null; return; }
          var h1 = o.and & m, h0 = !(o.or & m), X = LW + x + 0.5;
          if (h1 || h0) {
            var y = h1 ? hi : lo;
            if (prev === null) c.moveTo(X, y); else if (prev !== y) { c.lineTo(X, prev); c.lineTo(X, y); } else c.lineTo(X, y);
            c.lineTo(X + 1, y); prev = y;
          } else { c.fillRect(LW + x, hi, 1, lo - hi); prev = null; c.moveTo(X + 1, lo); }
        });
        c.stroke();
      } else {
        var a0 = Math.max(0, Math.floor(self.start)), a1 = Math.min(self.store.n, Math.ceil(self.start + pw * self.spp) + 1);
        c.beginPath();
        for (var s3 = a0; s3 < a1; s3++) {
          var y3 = self.store.bitsAt(s3) & m ? hi : lo, x0 = Math.max(LW, self.xOf(s3)), x1 = Math.min(LW + pw, self.xOf(s3 + 1));
          if (s3 === a0) c.moveTo(x0, y3); else c.lineTo(x0, y3);
          c.lineTo(x1, y3);
        }
        c.stroke();
      }
    });
    // trigger marks
    this.marks.forEach(function (s) { var x = self.xOf(s); if (x >= LW && x <= LW + pw) { c.strokeStyle = TRIG; c.setLineDash([4, 3]); c.beginPath(); c.moveTo(Math.round(x) + 0.5, 0); c.lineTo(Math.round(x) + 0.5, H - RULER); c.stroke(); c.setLineDash([]); } });
    // ruler
    c.fillStyle = RULERBG; c.fillRect(0, H - RULER, W, RULER);
    c.fillStyle = DIM; c.textAlign = "center";
    tk.forEach(function (t) { var x = self.xOf(t.s); if (x > LW + 20 && x < W - 20) c.fillText(t.label, x, H - RULER / 2); });
    // hover
    if (this.hover != null && this.hover >= 0 && this.hover < this.store.n) {
      var hx = Math.round(this.xOf(this.hover)) + 0.5, info = this.valueAt(this.hover);
      c.strokeStyle = HOV; c.lineWidth = 1; c.beginPath(); c.moveTo(hx, 0); c.lineTo(hx, H - RULER); c.stroke();
      if (info && info.avg === info.avg) { c.fillStyle = DOT; c.beginPath(); c.arc(hx, Y(info.avg), 3, 0, 7); c.fill(); }
    }
    this.drawOver();
  };
  P.valueAt = function (s) {
    if (!this.store || s < 0 || s >= this.store.n) return null;
    if (this.spp <= 1) { var v = this.store.at(Math.floor(s)); return { avg: v, min: v, max: v, bits: this.store.bitsAt(Math.floor(s)) }; }
    var o = this.store.range(Math.floor(s - this.spp / 2), Math.ceil(s + this.spp / 2));
    return { avg: o.cnt ? o.sum / o.cnt : NaN, min: o.min, max: o.max, bits: o.and, mixed: o.or ^ o.and };
  };
  P.ticks = function () {
    var r = this.rate(), span = this.plotW() * this.spp / r, target = span / Math.max(2, Math.floor(this.plotW() / 110));
    var p = Math.pow(10, Math.floor(Math.log10(target))), step = p;
    [1, 2, 5, 10].some(function (m) { if (m * p >= target) { step = m * p; return true; } return false; });
    var t0 = Math.ceil(this.start / r / step) * step, out = [];
    for (var t = t0; t <= (this.start + this.plotW() * this.spp) / r + 1e-12; t += step) out.push({ s: t * r, label: secs(t, step) });
    return out;
  };
  P.drawOver = function () {
    var c = this.over.getContext("2d"), W = this.W, h = 40;
    useTheme(this.theme);
    c.fillStyle = RULERBG; c.fillRect(0, 0, W, h);
    if (!this.store || !this.store.n) return;
    var pw = this.plotW(), n = this.store.n, total = Math.max(n, this.follow ? n : n), o = {};
    var key = n + ":" + pw + ":" + this.log;
    if (this.cache.key !== key) {
      var col = [], mx = 0;
      for (var x = 0; x < pw; x++) {
        var a = Math.floor(x / pw * total), b = Math.max(a + 1, Math.floor((x + 1) / pw * total));
        if (a >= n) { col.push(null); continue; }
        this.store.range(a, Math.min(n, b), o);
        col.push(o.cnt ? o.max : null);
        if (o.cnt && o.max > mx) mx = o.max;
      }
      this.cache = { key: key, col: col, mx: mx };
    }
    var cc = this.cache, lg = this.log;
    c.fillStyle = OVERFILL;
    cc.col.forEach(function (v, x) {
      if (v == null || !(cc.mx > 0)) return;
      var f = lg ? Math.max(0, 1 + Math.log10(Math.max(v, 1e-12) / cc.mx) / 6) : v / cc.mx;
      var hh = Math.max(1, f * (h - 6));
      c.fillRect(LW + x, h - 3 - hh, 1, hh);
    });
    var va = this.visible(), xa = LW + va[0] / total * pw, xb = LW + va[1] / total * pw;
    c.fillStyle = WINF; c.fillRect(xa, 1, Math.max(2, xb - xa), h - 2);
    c.strokeStyle = WINS; c.strokeRect(xa + 0.5, 1.5, Math.max(2, xb - xa) - 1, h - 3);
    if (this.sel) { c.fillStyle = SELO; c.fillRect(LW + this.sel[0] / total * pw, 0, Math.max(1, (this.sel[1] - this.sel[0]) / total * pw), 3); }
    c.fillStyle = DIM; c.font = MONO; c.textAlign = "right"; c.textBaseline = "middle"; c.fillText(secs(n / this.store.rate), LW - 6, h / 2);
  };

  // ---------------------------------------------------------------- input
  P.bind = function () {
    var self = this, m = this.main, pts = new Map(), drag = null, pinch = null;
    function pos(e, el) { var r = (el || m).getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    m.addEventListener("wheel", function (e) {
      if (!self.store || !self.store.n) return;
      e.preventDefault();
      var p = pos(e);
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) self.pan((e.deltaX || e.deltaY) * 0.8);
      else self.zoomAt(Math.pow(1.0018, e.deltaY * (e.deltaMode === 1 ? 30 : 1)), p.x);
    }, { passive: false });
    m.addEventListener("pointerdown", function (e) {
      if (!self.store || !self.store.n) return;
      m.focus();
      pts.set(e.pointerId, pos(e));
      m.setPointerCapture(e.pointerId);
      if (pts.size === 2) {
        var a = Array.from(pts.values());
        pinch = { d: Math.abs(a[0].x - a[1].x) || 1, spp: self.spp, mid: (a[0].x + a[1].x) / 2, s: self.sampleAt((a[0].x + a[1].x) / 2) };
        drag = null; return;
      }
      var p = pos(e), move = self.mode === "move" || e.button === 1 || e.altKey || e.pointerType === "touch" && self.mode !== "select";
      drag = { x: p.x, s: self.sampleAt(p.x), move: move, moved: false, start: self.start };
    });
    m.addEventListener("pointermove", function (e) {
      var p = pos(e);
      if (pts.has(e.pointerId)) pts.set(e.pointerId, p);
      if (pinch && pts.size === 2) {
        var a = Array.from(pts.values()), d = Math.abs(a[0].x - a[1].x) || 1;
        self.follow = false;
        self.spp = Math.max(self.minSpp(), Math.min(self.maxSpp(), pinch.spp * pinch.d / d));
        self.start = pinch.s - (pinch.mid - LW) * self.spp;
        self.clamp(); self.changed(); return;
      }
      if (drag) {
        if (Math.abs(p.x - drag.x) > 3) drag.moved = true;
        if (!drag.moved) return;
        if (drag.move) { self.follow = false; self.start = drag.start - (p.x - drag.x) * self.spp; self.clamp(); self.changed(); }
        else {
          var s = Math.max(0, Math.min(self.store.n, self.sampleAt(p.x))), a0 = Math.max(0, Math.min(self.store.n, drag.s));
          self.sel = [Math.min(a0, s), Math.max(a0, s)];
          self.redraw(); if (self.opts.onSelect) self.opts.onSelect(self.sel);
        }
      }
      if (e.pointerType !== "touch") {
        self.hover = p.x >= LW && p.y < self.H - RULER ? self.sampleAt(p.x) : null;
        self.redraw(); if (self.opts.onHover) self.opts.onHover(self.hover, self.hover == null ? null : self.valueAt(self.hover));
      }
    });
    function up(e) {
      pts.delete(e.pointerId);
      if (pts.size < 2) pinch = null;
      if (drag && !drag.moved && !drag.move && self.sel) { self.sel = null; self.redraw(); if (self.opts.onSelect) self.opts.onSelect(null); }
      drag = null;
    }
    m.addEventListener("pointerup", up);
    m.addEventListener("pointercancel", up);
    m.addEventListener("pointerleave", function () { self.hover = null; self.redraw(); if (self.opts.onHover) self.opts.onHover(null, null); });
    m.addEventListener("dblclick", function (e) { if (self.sel) self.show(self.sel[0], self.sel[1]); else self.zoomAt(0.4, pos(e).x); });
    m.addEventListener("keydown", function (e) {
      if (!self.store || !self.store.n) return;
      var k = e.key;
      if (k === "ArrowLeft") self.pan(-self.plotW() / 8);
      else if (k === "ArrowRight") self.pan(self.plotW() / 8);
      else if (k === "+" || k === "=") self.zoomAt(0.6);
      else if (k === "-") self.zoomAt(1 / 0.6);
      else if (k === "f" || k === "F") self.fit();
      else if (k === "Escape" && self.sel) { self.sel = null; self.redraw(); if (self.opts.onSelect) self.opts.onSelect(null); }
      else return;
      e.preventDefault();
    });
    // overview: click or drag moves the view
    var od = false;
    var overTo = function (e) {
      if (!self.store || !self.store.n) return;
      var p = pos(e, self.over), f = (p.x - LW) / self.plotW(), vis = self.plotW() * self.spp;
      self.follow = false;
      self.start = f * self.store.n - vis / 2; self.clamp(); self.changed();
    };
    this.over.addEventListener("pointerdown", function (e) { od = true; self.over.setPointerCapture(e.pointerId); overTo(e); });
    this.over.addEventListener("pointermove", function (e) { if (od) overTo(e); });
    this.over.addEventListener("pointerup", function () { od = false; });
  };

  PP.Chart = Chart;
  PP.amps = amps;
  PP.secs = secs;
})(window);
