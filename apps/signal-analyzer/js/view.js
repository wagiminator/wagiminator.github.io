/* Signal Analyzer: the waveform view. One canvas for the traces, one for the time ruler and
 * one for the overview of the whole capture. Zoom with the wheel or a pinch, pan by dragging,
 * click to place cursor A, Shift+click for cursor B. */
(function (global) {
  "use strict";
  var SA = global.SA;

  var BG = "#10141b", LABEL_BG = "#161b24", GRID = "rgba(255,255,255,0.06)", TEXT = "#c9d1dc", DIM = "#7d8899";
  var CUR = ["#ffd166", "#5ce1e6"], TRIG = "#ff6b6b";
  var MONO = '11px ui-monospace, "Cascadia Mono", "SF Mono", Menlo, Consolas, monospace';
  var SANS = '12px Chivo, system-ui, sans-serif';
  var CW = 6.7;                                 // width of one character of MONO

  function View(root, opts) {
    this.opts = opts || {};
    this.root = root;
    root.classList.add("wv");
    root.innerHTML = '<canvas class="wv-over" aria-label="Overview of the whole capture"></canvas>' +
      '<canvas class="wv-ruler" aria-hidden="true"></canvas>' +
      '<div class="wv-scroll"><canvas class="wv-main" tabindex="0" aria-label="Waveforms. Arrow keys move, plus and minus zoom, F shows everything."></canvas></div>';
    this.over = root.querySelector(".wv-over");
    this.ruler = root.querySelector(".wv-ruler");
    this.scroll = root.querySelector(".wv-scroll");
    this.main = root.querySelector(".wv-main");
    this.cap = null;
    this.rows = [];
    this.start = 0; this.spp = 1;
    this.cur = [null, null];
    this.hover = null;
    this.cols = null;
    this.lw = 128;
    this.dirty = false;
    var self = this;
    this.ro = new ResizeObserver(function () { self.layout(); });
    this.ro.observe(root);
    this.bind();
    this.layout();
  }
  var P = View.prototype;

  // ---------------------------------------------------------------- data
  P.setCapture = function (cap, keepView) {
    var old = this.cap;
    this.cap = cap;
    this.cols = null;
    if (!keepView || !old || old.n !== cap.n || old.rate !== cap.rate) { this.cur = [null, null]; this.fit(); }
    else this.clampView();
    this.redraw();
  };
  P.setRows = function (rows) {
    this.rows = rows;
    this.layout();
  };
  P.plotW = function () { return Math.max(10, this.W - this.lw); };
  P.fit = function () {
    if (!this.cap) return;
    this.spp = Math.max(this.cap.n / this.plotW(), 1 / 64);
    this.start = 0;
    this.cols = null;
    this.redraw();
  };
  P.maxSpp = function () { return Math.max(this.cap.n / this.plotW(), 1 / 64); };
  P.clampView = function () {
    if (!this.cap) return;
    var vis = this.plotW() * this.spp, n = this.cap.n;
    if (this.spp > this.maxSpp()) this.spp = this.maxSpp();
    if (this.spp < 1 / 64) this.spp = 1 / 64;
    vis = this.plotW() * this.spp;
    if (vis >= n) this.start = 0;
    else this.start = Math.max(0, Math.min(n - vis, this.start));
  };
  P.zoomAt = function (factor, x) {
    if (!this.cap) return;
    var s = this.sampleAt(x == null ? this.lw + this.plotW() / 2 : x);
    this.spp *= factor;
    if (this.spp > this.maxSpp()) this.spp = this.maxSpp();
    if (this.spp < 1 / 64) this.spp = 1 / 64;
    this.start = s - ((x == null ? this.lw + this.plotW() / 2 : x) - this.lw) * this.spp;
    this.clampView();
    this.cols = null;
    this.redraw();
  };
  P.pan = function (px) {
    if (!this.cap) return;
    this.start += px * this.spp;
    this.clampView();
    this.cols = null;
    this.redraw();
  };
  // show samples a..b
  P.showRange = function (a, b, margin) {
    if (!this.cap) return;
    var w = Math.max(b - a, 4), m = margin == null ? 0.1 : margin;
    this.spp = (w * (1 + 2 * m)) / this.plotW();
    this.start = a - w * m;
    this.clampView();
    this.cols = null;
    this.redraw();
  };
  P.center = function (s) {
    this.start = s - this.plotW() * this.spp / 2;
    this.clampView();
    this.cols = null;
    this.redraw();
  };
  P.sampleAt = function (x) { return this.start + (x - this.lw) * this.spp; };
  P.xOf = function (s) { return this.lw + (s - this.start) / this.spp; };
  P.timeOf = function (s) {
    var t0 = this.cap && this.cap.trigger != null ? this.cap.trigger : 0;
    return (s - t0) / (this.cap ? this.cap.rate : 1);
  };
  P.setCursor = function (i, s) { this.cur[i] = s; this.redraw(); if (this.opts.onCursor) this.opts.onCursor(); };

  // ---------------------------------------------------------------- layout
  P.layout = function () {
    var w = this.root.clientWidth || 600, dpr = window.devicePixelRatio || 1;
    this.lw = w < 560 ? 84 : 128;
    this.W = w; this.dpr = dpr;
    var h = 0;
    this.rows.forEach(function (r) { h += r.h; });
    this.H = Math.max(h, 120);
    this.size(this.over, w, 20);
    this.size(this.ruler, w, 26);
    this.size(this.main, w, this.H);
    this.cols = null;
    this.clampView();
    this.redraw();
  };
  P.size = function (c, w, h) {
    var d = this.dpr;
    c.style.width = w + "px"; c.style.height = h + "px";
    if (c.width !== Math.round(w * d) || c.height !== Math.round(h * d)) { c.width = Math.round(w * d); c.height = Math.round(h * d); }
  };
  P.redraw = function () {
    if (this.dirty) return;
    this.dirty = true;
    var self = this;
    requestAnimationFrame(function () { self.dirty = false; self.draw(); });
  };

  // ---------------------------------------------------------------- ticks
  P.ticks = function () {
    var rate = this.cap.rate, tpp = this.spp / rate, target = 110 * tpp, p = Math.pow(10, Math.floor(Math.log10(target))), step = p;
    [1, 2, 5, 10].some(function (m) { if (m * p >= target) { step = m * p; return true; } return false; });
    var t0 = this.timeOf(this.start), t1 = this.timeOf(this.start + this.plotW() * this.spp), out = [];
    for (var t = Math.ceil(t0 / step) * step; t <= t1 + step * 0.001; t += step) {
      var s = (this.cap.trigger || 0) + t * rate;
      out.push({ x: this.xOf(s), t: Math.abs(t) < step * 1e-6 ? 0 : t });
    }
    return { list: out, step: step };
  };

  // ---------------------------------------------------------------- drawing
  P.draw = function () {
    var c = this.main.getContext("2d"), d = this.dpr;
    c.setTransform(d, 0, 0, d, 0, 0);
    c.fillStyle = BG; c.fillRect(0, 0, this.W, this.H);
    if (!this.cap) {
      c.font = SANS; c.fillStyle = DIM; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText(this.W < 520 ? "Connect and capture, open a file or try a demo." : "Connect the hardware and press Capture, open a file, or try one of the demos.", this.W / 2, this.H / 2);
      c.textAlign = "left";
      this.drawRuler(null); this.drawOver(); return;
    }
    var tk = this.ticks(), self = this, y = 0;
    c.strokeStyle = GRID; c.lineWidth = 1; c.beginPath();
    tk.list.forEach(function (t) { var x = Math.round(t.x) + 0.5; if (x > self.lw) { c.moveTo(x, 0); c.lineTo(x, self.H); } });
    c.stroke();
    this.colCache = new Map();
    this.rows.forEach(function (r) {
      c.save();
      c.beginPath(); c.rect(self.lw, y, self.plotW(), r.h); c.clip();
      if (r.kind === "d") self.drawDigital(c, r, y);
      else if (r.kind === "a") self.drawAnalog(c, r, y);
      else self.drawAnn(c, r, y);
      c.restore();
      self.drawLabel(c, r, y);
      c.fillStyle = "rgba(255,255,255,0.05)"; c.fillRect(0, y + r.h - 1, self.W, 1);
      y += r.h;
    });
    // trigger, cursors, hover
    if (this.cap.trigger != null) this.vline(c, this.cap.trigger, TRIG, [4, 3]);
    this.cur.forEach(function (s, i) { if (s != null) self.vline(c, s, CUR[i], null); });
    if (this.hover != null) this.vline(c, this.hover, "rgba(255,255,255,0.35)", [2, 3]);
    this.drawRuler(tk);
    this.drawOver();
  };
  P.vline = function (c, s, col, dash) {
    var x = Math.round(this.xOf(s)) + 0.5;
    if (x < this.lw || x > this.W) return;
    c.save(); c.strokeStyle = col; c.lineWidth = 1; if (dash) c.setLineDash(dash);
    c.beginPath(); c.moveTo(x, 0); c.lineTo(x, this.H); c.stroke(); c.restore();
  };
  P.drawLabel = function (c, r, y) {
    c.fillStyle = LABEL_BG; c.fillRect(0, y, this.lw, r.h);
    c.fillStyle = r.color || TEXT; c.fillRect(0, y + 3, 3, r.h - 6);
    c.font = SANS; c.textBaseline = "middle";
    var maxw = this.lw - 14, name = r.name;
    c.fillStyle = r.kind === "dec" ? DIM : TEXT;
    while (name.length > 2 && c.measureText(name).width > maxw) name = name.slice(0, -2) + "…";
    if (r.kind === "dec" && r.h < 24) { c.font = '11px Chivo, system-ui, sans-serif'; }
    c.fillText(name, 9, y + r.h / 2 + (r.kind === "a" ? -8 : 0));
    if (r.kind === "a") {
      c.font = MONO; c.fillStyle = DIM;
      var rg = this.analogRange(r.ch);
      c.fillText(fmtV(rg[1]) + " … " + fmtV(rg[0]), 9, y + r.h / 2 + 9);
    }
    if (r === this.hoverRow) { c.fillStyle = "rgba(255,255,255,0.05)"; c.fillRect(0, y, this.lw, r.h); }
  };
  function fmtV(v) { var a = Math.abs(v); return a >= 100 ? v.toFixed(0) : a >= 10 ? v.toFixed(1) : v.toFixed(2); }

  // columns of AND/OR per pixel for one word store, shared by all its channels
  P.columns = function (store) {
    var key = store, m = this.colCache.get(key);
    if (m) return m;
    var W = Math.ceil(this.plotW()), A = new Int32Array(W), O = new Int32Array(W), t = {}, n = store.n;
    for (var x = 0; x < W; x++) {
      var s0 = Math.floor(this.start + x * this.spp), s1 = Math.floor(this.start + (x + 1) * this.spp);
      if (s1 <= s0) s1 = s0 + 1;
      if (s0 >= n || s1 <= 0) { A[x] = -2; O[x] = 0; continue; }       // outside the capture
      store.range(Math.max(0, s0), Math.min(n, s1), t);
      A[x] = t.and; O[x] = t.or;
    }
    m = { A: A, O: O };
    this.colCache.set(key, m);
    return m;
  };
  P.drawDigital = function (c, r, y) {
    var ch = r.ch, st = ch.store, bit = ch.bit, n = this.cap.n, X = this.lw, W = this.plotW();
    var yH = y + 6, yL = y + r.h - 7, col = ch.color;
    c.strokeStyle = col; c.lineWidth = 1.5; c.lineJoin = "bevel";
    var visible = W * this.spp, fill = [];
    if (visible <= 3 * W) {
      // few samples: draw every change exactly
      var s0 = Math.max(0, Math.floor(this.start)), s1 = Math.min(n, Math.ceil(this.start + visible) + 1);
      if (s1 <= s0) return;
      var d = st.data, v = (d[s0] >>> bit) & 1, x = this.xOf(s0), hs = v ? x : null;
      c.beginPath(); c.moveTo(x, v ? yH : yL);
      for (var s = s0 + 1; s < s1; s++) {
        var nv = (d[s] >>> bit) & 1;
        if (nv !== v) {
          x = this.xOf(s);
          c.lineTo(x, v ? yH : yL); c.lineTo(x, nv ? yH : yL);
          if (v) fill.push(hs, x); else hs = x;
          v = nv;
        }
      }
      x = this.xOf(s1);
      c.lineTo(x, v ? yH : yL); c.stroke();
      if (v) fill.push(hs, x);
      if (this.spp < 1 / 6) {
        c.fillStyle = col;
        for (s = s0; s < s1; s++) { var xs = this.xOf(s); c.fillRect(xs - 1, ((d[s] >>> bit) & 1 ? yH : yL) - 1, 2, 2); }
      }
    } else {
      var cl = this.columns(st), A = cl.A, O = cl.O, last = null, hstart = null;
      c.beginPath();
      for (var i = 0; i < W; i++) {
        if (A[i] === -2 && O[i] === 0) { last = null; continue; }
        var a = (A[i] >>> bit) & 1, o = (O[i] >>> bit) & 1, px = X + i;
        if (a === o) {
          var yy = a ? yH : yL;
          if (last === null) c.moveTo(px, yy); else c.lineTo(px, yy);
          c.lineTo(px + 1, yy);
          last = yy;
          if (a && hstart === null) hstart = px;
          if (!a && hstart !== null) { fill.push(hstart, px); hstart = null; }
        } else {
          c.moveTo(px + 0.5, yH); c.lineTo(px + 0.5, yL);
          last = null;
          if (hstart !== null) { fill.push(hstart, px); hstart = null; }
        }
      }
      c.stroke();
      if (hstart !== null) fill.push(hstart, X + W);
    }
    c.fillStyle = col; c.globalAlpha = 0.13;
    for (var k = 0; k < fill.length; k += 2) c.fillRect(fill[k], yH, fill[k + 1] - fill[k], yL - yH);
    c.globalAlpha = 1;
  };
  P.analogRange = function (ch) {
    if (ch.fixedMin != null) return [Math.min(ch.fixedMin, ch.store.min), Math.max(ch.fixedMax, ch.store.max)];
    var lo = ch.store.min, hi = ch.store.max;
    if (!(hi > lo)) { lo -= 1; hi += 1; }
    var p = (hi - lo) * 0.06;
    return [lo - p, hi + p];
  };
  P.drawAnalog = function (c, r, y) {
    var ch = r.ch, st = ch.store, n = this.cap.n, W = this.plotW(), rg = this.analogRange(ch);
    var top = y + 5, h = r.h - 10, ys = function (v) { return top + h - (v - rg[0]) / (rg[1] - rg[0]) * h; };
    if (rg[0] < 0 && rg[1] > 0) { c.fillStyle = "rgba(255,255,255,0.1)"; c.fillRect(this.lw, Math.round(ys(0)), W, 1); }
    // threshold of a digital channel made from this one
    var self = this;
    this.cap.channels.forEach(function (o) {
      if (o.from === ch.id) { c.save(); c.strokeStyle = "rgba(255,255,255,0.4)"; c.setLineDash([5, 4]); c.beginPath(); var ty = Math.round(ys(o.level)) + 0.5; c.moveTo(self.lw, ty); c.lineTo(self.W, ty); c.stroke(); c.restore(); }
    });
    c.strokeStyle = ch.color; c.lineWidth = 1.3; c.beginPath();
    var visible = W * this.spp;
    if (visible <= 2 * W) {
      var s0 = Math.max(0, Math.floor(this.start)), s1 = Math.min(n, Math.ceil(this.start + visible) + 2), d = st.data;
      for (var s = s0; s < s1; s++) { var x = this.xOf(s), yy = ys(d[s]); if (s === s0) c.moveTo(x, yy); else c.lineTo(x, yy); }
      c.stroke();
      if (this.spp < 1 / 5) { c.fillStyle = ch.color; for (s = s0; s < s1; s++) c.fillRect(this.xOf(s) - 1.5, ys(d[s]) - 1.5, 3, 3); }
    } else {
      var t = {};
      for (var i = 0; i < W; i++) {
        var a = Math.floor(this.start + i * this.spp), b = Math.floor(this.start + (i + 1) * this.spp);
        if (b <= a) b = a + 1;
        if (a >= n || b <= 0) continue;
        st.range(Math.max(0, a), Math.min(n, b), t);
        var y1 = ys(t.max), y2 = ys(t.min), px = this.lw + i + 0.5;
        if (i === 0) c.moveTo(px, y1); else c.lineTo(px, y1);
        c.lineTo(px, Math.max(y2, y1 + 1));
      }
      c.stroke();
    }
  };
  function decColour(hue, k) {
    if (k === 2) return "hsl(2, 62%, 42%)";
    if (k === 1) return "hsl(" + (hue + 35) % 360 + ", 55%, 40%)";
    if (k === 3) return "hsl(" + (hue + 320) % 360 + ", 42%, 36%)";
    return "hsl(" + hue + ", 52%, 36%)";
  }
  P.drawAnn = function (c, r, y) {
    var list = r.list, X = this.lw, W = this.plotW();
    c.fillStyle = "rgba(255,255,255,0.025)"; c.fillRect(X, y, W, r.h - 1);
    if (!list || !list.length) return;
    var vs = this.start, ve = this.start + W * this.spp, i;
    // binary search on the start sample, then step back to annotations that reach into view
    var lo = 0, hi = list.length;
    while (lo < hi) { var m = (lo + hi) >>> 1; if (list[m].s < vs) lo = m + 1; else hi = m; }
    i = Math.max(0, lo - 1);
    while (i > 0 && list[i - 1].e > vs && lo - i < 64) i--;
    c.font = MONO; c.textBaseline = "middle";
    var top = y + 2, h = r.h - 5, lastX = -1;
    for (; i < list.length; i++) {
      var a = list[i];
      if (a.s > ve) break;
      if (a.e < vs) continue;
      var x0 = this.xOf(a.s), x1 = this.xOf(a.e), w = x1 - x0;
      if (w < 2) {
        if (Math.floor(x0) === lastX) continue;
        lastX = Math.floor(x0);
        c.fillStyle = decColour(r.hue, a.k); c.fillRect(Math.floor(x0), top, Math.max(1, Math.ceil(w)), h);
        continue;
      }
      var cx0 = Math.max(x0, X - 2), cx1 = Math.min(x1, this.W + 2);
      c.fillStyle = decColour(r.hue, a.k);
      roundRect(c, x0 + 0.5, top, w - 1, h, Math.min(4, w / 3));
      c.fill();
      var tx0 = Math.max(cx0, X) + 4, avail = Math.min(cx1, this.W) - 4 - tx0, sw = 0;
      if (a.col && avail > 18) {
        c.fillStyle = a.col; c.fillRect(tx0, top + 3, h - 6, h - 6);
        c.strokeStyle = "rgba(255,255,255,0.5)"; c.lineWidth = 1; c.strokeRect(tx0 + 0.5, top + 3.5, h - 7, h - 7);
        sw = h - 2; tx0 += sw; avail -= sw;
      }
      if (avail < CW) continue;
      var txt = a.t.length * CW <= avail ? a.t : a.sh.length * CW <= avail ? a.sh : a.sh.slice(0, Math.floor(avail / CW) - 1) + "…";
      if (txt.length < 2 && a.sh.length > 1) continue;
      c.fillStyle = "#fff";
      var tw = txt.length * CW, mid = (Math.max(x0, X) + Math.min(x1, this.W)) / 2 + sw / 2;
      c.fillText(txt, Math.max(tx0, Math.min(mid - tw / 2, tx0 + avail - tw)), top + h / 2 + 0.5);
    }
  };
  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y);
  }
  P.drawRuler = function (tk) {
    var c = this.ruler.getContext("2d"), d = this.dpr, self = this, h = 26;
    c.setTransform(d, 0, 0, d, 0, 0);
    c.fillStyle = "#1a2029"; c.fillRect(0, 0, this.W, h);
    c.fillStyle = LABEL_BG; c.fillRect(0, 0, this.lw, h);
    if (!tk) return;
    c.font = MONO; c.textBaseline = "middle"; c.fillStyle = DIM;
    c.fillText(this.cap.trigger != null ? "t = 0: trigger" : "time", 9, h / 2);
    c.strokeStyle = "rgba(255,255,255,0.25)"; c.beginPath();
    tk.list.forEach(function (t) {
      if (t.x < self.lw) return;
      var x = Math.round(t.x) + 0.5;
      c.moveTo(x, h - 7); c.lineTo(x, h);
      c.fillStyle = TEXT;
      var txt = SA.fmtTime(t.t), w = txt.length * CW;
      if (x + 4 + w < self.W) c.fillText(txt, x + 4, h / 2 - 2);
    });
    c.stroke();
    var mark = function (s, col, label) {
      var x = self.xOf(s);
      if (x < self.lw - 1 || x > self.W + 1) return;
      c.fillStyle = col;
      c.beginPath(); c.moveTo(x - 6, 0); c.lineTo(x + 6, 0); c.lineTo(x, 8); c.closePath(); c.fill();
      c.font = 'bold 10px Chivo, system-ui, sans-serif'; c.fillStyle = "#10141b";
      if (label) { c.fillStyle = col; c.fillText(label, Math.min(x + 6, self.W - 10), h - 6); }
      c.font = MONO;
    };
    if (this.cap.trigger != null) mark(this.cap.trigger, TRIG, "T");
    if (this.cur[0] != null) mark(this.cur[0], CUR[0], "A");
    if (this.cur[1] != null) mark(this.cur[1], CUR[1], "B");
  };
  P.drawOver = function () {
    var c = this.over.getContext("2d"), d = this.dpr, h = 20, W = this.W;
    c.setTransform(d, 0, 0, d, 0, 0);
    c.fillStyle = "#1a2029"; c.fillRect(0, 0, W, h);
    c.fillStyle = LABEL_BG; c.fillRect(0, 0, this.lw, h);
    c.font = '11px Chivo, system-ui, sans-serif'; c.fillStyle = DIM; c.textBaseline = "middle";
    c.fillText("overview", 9, h / 2);
    if (!this.cap) return;
    var n = this.cap.n, pw = this.plotW(), X = this.lw;
    // activity of the first digital store, or the envelope of the first analog channel
    var dch = null, ach = null;
    for (var i = 0; i < this.cap.channels.length; i++) {
      var ch = this.cap.channels[i];
      if (ch.visible && ch.kind === "d" && !dch) dch = ch;
      if (ch.visible && ch.kind === "a" && !ach) ach = ch;
    }
    if (!this.overCache || this.overCache.cap !== this.cap || this.overCache.w !== pw) {
      var act = new Float32Array(pw), t = {};
      for (var x = 0; x < pw; x++) {
        var a = Math.floor(x * n / pw), b = Math.max(a + 1, Math.floor((x + 1) * n / pw));
        if (dch) { dch.store.range(a, b, t); act[x] = (t.and ^ t.or) ? 1 : 0; }
        else if (ach) { ach.store.range(a, b, t); act[x] = (t.max - t.min) / ((ach.store.max - ach.store.min) || 1); }
      }
      this.overCache = { cap: this.cap, w: pw, act: act };
    }
    var ac = this.overCache.act;
    c.fillStyle = "rgba(76,154,255,0.55)";
    for (x = 0; x < pw; x++) if (ac[x] > 0) { var hh = Math.max(2, Math.min(1, ac[x]) * (h - 6)); c.fillRect(X + x, h / 2 - hh / 2, 1, hh); }
    var v0 = X + this.start / n * pw, v1 = X + (this.start + pw * this.spp) / n * pw;
    c.fillStyle = "rgba(255,255,255,0.13)"; c.fillRect(v0, 1, Math.max(2, v1 - v0), h - 2);
    c.strokeStyle = "rgba(255,255,255,0.55)"; c.lineWidth = 1; c.strokeRect(Math.round(v0) + 0.5, 1.5, Math.max(2, Math.round(v1 - v0)), h - 3);
  };

  // ---------------------------------------------------------------- measuring
  // the pulse under sample s on a digital channel: widths, period, frequency, duty
  P.measure = function (ch, s) {
    var e = ch.store.edges(ch.bit), n = this.cap.n;
    if (s < 0 || s >= n) return null;
    var i = SA.lowerBound(e, Math.floor(s) + 1);
    var a = i > 0 ? e[i - 1] : null, b = i < e.length ? e[i] : null, level = this.cap.bitAt(ch, Math.floor(s));
    var out = { level: level, width: a != null && b != null ? b - a : null, period: null, high: null, edges: e.length };
    var c2 = i + 1 < e.length ? e[i + 1] : null, z = i > 1 ? e[i - 2] : null;
    if (a != null && c2 != null) { out.period = c2 - a; out.high = level ? b - a : c2 - b; }
    else if (z != null && b != null) { out.period = b - z; out.high = level ? b - a : a - z; }
    return out;
  };
  P.rowAt = function (y) {
    var acc = 0;
    for (var i = 0; i < this.rows.length; i++) { if (y >= acc && y < acc + this.rows[i].h) return { row: this.rows[i], y: acc }; acc += this.rows[i].h; }
    return null;
  };
  P.annAt = function (r, s) {
    var list = r.list || [], lo = 0, hi = list.length;
    while (lo < hi) { var m = (lo + hi) >>> 1; if (list[m].s <= s) lo = m + 1; else hi = m; }
    for (var i = lo - 1; i >= 0 && i >= lo - 8; i--) if (list[i].s <= s && list[i].e >= s) return list[i];
    return null;
  };
  // the nearest edge of a digital channel within a few pixels
  P.snap = function (r, s) {
    if (!r || r.kind !== "d") return s;
    var e = r.ch.store.edges(r.ch.bit), i = SA.lowerBound(e, s), best = s, bd = 7 * this.spp;
    [i - 1, i].forEach(function (k) { if (k >= 0 && k < e.length && Math.abs(e[k] - s) < bd) { bd = Math.abs(e[k] - s); best = e[k]; } });
    return best;
  };

  // ---------------------------------------------------------------- input
  P.bind = function () {
    var self = this, m = this.main, pts = new Map(), drag = null, pinch = null;
    function pos(e) { var r = m.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    m.addEventListener("wheel", function (e) {
      if (!self.cap) return;
      var p = pos(e);
      if (p.x < self.lw) return;                     // scroll the page over the labels
      e.preventDefault();
      if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) self.pan((e.shiftKey ? e.deltaY : e.deltaX) * 0.8);
      else self.zoomAt(Math.pow(1.0018, e.deltaY * (e.deltaMode === 1 ? 30 : 1)), p.x);
    }, { passive: false });
    m.addEventListener("pointerdown", function (e) {
      if (!self.cap) return;
      var p = pos(e);
      pts.set(e.pointerId, p);
      m.setPointerCapture(e.pointerId);
      if (pts.size === 2) {
        var a = Array.from(pts.values());
        pinch = { d: Math.abs(a[0].x - a[1].x) || 1, spp: self.spp, mid: (a[0].x + a[1].x) / 2, s: self.sampleAt((a[0].x + a[1].x) / 2) };
        drag = null;
        return;
      }
      if (p.x < self.lw) { drag = { label: true, x: p.x, y: p.y }; return; }
      // grab a cursor?
      for (var i = 0; i < 2; i++) if (self.cur[i] != null && Math.abs(self.xOf(self.cur[i]) - p.x) < 6) { drag = { cursor: i, x: p.x, y: p.y, moved: true }; return; }
      drag = { x: p.x, y: p.y, start: self.start, moved: false, shift: e.shiftKey };
    });
    m.addEventListener("pointermove", function (e) {
      var p = pos(e);
      if (pts.has(e.pointerId)) pts.set(e.pointerId, p);
      if (pinch && pts.size === 2) {
        var a = Array.from(pts.values()), d = Math.abs(a[0].x - a[1].x) || 1;
        self.spp = pinch.spp * pinch.d / d;
        self.clampView();
        self.start = pinch.s - (pinch.mid - self.lw) * self.spp;
        self.clampView(); self.cols = null; self.redraw();
        return;
      }
      if (drag && drag.cursor != null) {
        var hr = self.rowAt(drag.y);
        self.cur[drag.cursor] = Math.max(0, Math.min(self.cap.n, self.snap(hr && hr.row, self.sampleAt(p.x))));
        self.redraw(); if (self.opts.onCursor) self.opts.onCursor();
        return;
      }
      if (drag && !drag.label) {
        if (Math.abs(p.x - drag.x) > 4) drag.moved = true;
        if (drag.moved) { self.start = drag.start - (p.x - drag.x) * self.spp; self.clampView(); self.cols = null; self.redraw(); }
        return;
      }
      // hover
      if (!self.cap) return;
      var r = self.rowAt(p.y);
      m.style.cursor = p.x < self.lw ? "pointer" : self.cur.some(function (s) { return s != null && Math.abs(self.xOf(s) - p.x) < 6; }) ? "ew-resize" : "crosshair";
      var hr2 = r && r.row;
      if (hr2 !== self.hoverRow) { self.hoverRow = hr2; }
      self.hover = p.x >= self.lw ? self.sampleAt(p.x) : null;
      self.redraw();
      if (self.opts.onHover) self.opts.onHover(self.hover, hr2);
    });
    function up(e) {
      var p = pos(e);
      pts.delete(e.pointerId);
      if (pinch) { if (pts.size < 2) pinch = null; return; }
      if (!drag) return;
      var d = drag; drag = null;
      if (d.label) {
        if (Math.abs(p.x - d.x) < 5 && Math.abs(p.y - d.y) < 5) {
          var r = self.rowAt(p.y);
          if (r && self.opts.onLabel) { var b = m.getBoundingClientRect(); self.opts.onLabel(r.row, { left: b.left, top: b.top + r.y, height: r.row.h, width: self.lw }); }
        }
        return;
      }
      if (d.cursor != null || d.moved) return;
      var hr = self.rowAt(p.y);
      var s = Math.max(0, Math.min(self.cap.n, self.snap(hr && hr.row, self.sampleAt(p.x))));
      if (hr && hr.row.kind === "dec" && self.opts.onAnn) { var an = self.annAt(hr.row, self.sampleAt(p.x)); if (an) self.opts.onAnn(an, hr.row); }
      self.setCursor(e.shiftKey || e.altKey ? 1 : 0, s);
    }
    m.addEventListener("pointerup", up);
    m.addEventListener("pointercancel", function (e) { pts.delete(e.pointerId); drag = null; pinch = null; });
    m.addEventListener("pointerleave", function () { if (self.hover != null) { self.hover = null; self.hoverRow = null; self.redraw(); if (self.opts.onHover) self.opts.onHover(null, null); } });
    m.addEventListener("dblclick", function (e) { var p = pos(e); if (p.x >= self.lw) self.zoomAt(0.4, p.x); });
    m.addEventListener("keydown", function (e) {
      if (!self.cap) return;
      var k = e.key, w = self.plotW();
      if (k === "ArrowLeft") self.pan(-w * (e.shiftKey ? 0.5 : 0.1));
      else if (k === "ArrowRight") self.pan(w * (e.shiftKey ? 0.5 : 0.1));
      else if (k === "+" || k === "=" || k === "ArrowUp") self.zoomAt(0.6);
      else if (k === "-" || k === "_" || k === "ArrowDown") self.zoomAt(1 / 0.6);
      else if (k === "f" || k === "F" || k === "0") self.fit();
      else if (k === "Home") { self.start = 0; self.clampView(); self.cols = null; self.redraw(); }
      else if (k === "End") { self.start = self.cap.n; self.clampView(); self.cols = null; self.redraw(); }
      else if (k === "Escape") { self.cur = [null, null]; self.redraw(); if (self.opts.onCursor) self.opts.onCursor(); }
      else return;
      e.preventDefault();
    });
    // overview: click or drag to move the view
    var od = false;
    function overMove(e) {
      if (!self.cap) return;
      var r = self.over.getBoundingClientRect(), x = e.clientX - r.left - self.lw, pw = self.plotW();
      self.center(x / pw * self.cap.n);
    }
    this.over.addEventListener("pointerdown", function (e) { od = true; self.over.setPointerCapture(e.pointerId); overMove(e); });
    this.over.addEventListener("pointermove", function (e) { if (od) overMove(e); });
    this.over.addEventListener("pointerup", function () { od = false; });
  };

  SA.View = View;
})(window);
