/* Interactive BOM: the board view. Draws the rendered board (from the Gerber Viewer's
 * renderer), dims it and lights up the selected parts, finds pads for snapping clicks. */
(function (global) {
  "use strict";
  var G = global.GERBER;

  // ================================================================ pads
  function drawOps(ctx, g) {
    g.ops.forEach(function (o) {
      ctx.globalCompositeOperation = o.pol ? "source-over" : "destination-out";
      ctx.fillStyle = ctx.strokeStyle = "#fff";
      if (o.fill) ctx.fill(o.path, o.rule || "nonzero");
      else { ctx.lineWidth = Math.max(o.width, 0.01); ctx.stroke(o.path); }
    });
    ctx.globalCompositeOperation = "source-over";
  }
  // pads of one side from the solder mask openings (or the paste layer): [{x0,y0,x1,y1,cx,cy,a}] in mm
  function findPads(board, layers) {
    var b = board.bbox, w = b.x1 - b.x0, h = b.y1 - b.y0;
    if (!layers.length || !(w > 0) || !(h > 0)) return [];
    var s = Math.min(25, 2400 / Math.max(w, h)), W = Math.ceil(w * s) + 2, H = Math.ceil(h * s) + 2;
    var c = document.createElement("canvas"); c.width = W; c.height = H;
    var ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.setTransform(s, 0, 0, -s, -b.x0 * s + 1, b.y1 * s + 1);
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    layers.forEach(function (g) { drawOps(ctx, g); });
    var a = ctx.getImageData(0, 0, W, H).data, m = new Uint8Array(W * H), i;
    for (i = 0; i < W * H; i++) m[i] = a[i * 4 + 3] > 120 ? 1 : 0;
    var lab = new Int32Array(W * H), stack = new Int32Array(W * H), pads = [], max = 15 * 15 * s * s;
    for (i = 0; i < W * H; i++) {
      if (!m[i] || lab[i]) continue;
      var sp = 0, n = 0, x0 = W, x1 = 0, y0 = H, y1 = 0, id = pads.length + 1;
      stack[sp++] = i; lab[i] = id;
      while (sp) {
        var p = stack[--sp], x = p % W, y = (p - x) / W;
        n++;
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        if (x > 0 && m[p - 1] && !lab[p - 1]) { lab[p - 1] = id; stack[sp++] = p - 1; }
        if (x < W - 1 && m[p + 1] && !lab[p + 1]) { lab[p + 1] = id; stack[sp++] = p + 1; }
        if (y > 0 && m[p - W] && !lab[p - W]) { lab[p - W] = id; stack[sp++] = p - W; }
        if (y < H - 1 && m[p + W] && !lab[p + W]) { lab[p + W] = id; stack[sp++] = p + W; }
      }
      var mm = function (px) { return px / s; };
      var pad = { x0: b.x0 + mm(x0 - 1), x1: b.x0 + mm(x1 + 1 - 1), y0: b.y1 - mm(y1 + 1 - 1), y1: b.y1 - mm(y0 - 1), a: n / (s * s) };
      pad.cx = (pad.x0 + pad.x1) / 2; pad.cy = (pad.y0 + pad.y1) / 2;
      pads.push(n >= 3 && n < max ? pad : null);
    }
    return pads.filter(Boolean);
  }
  // a click near the middle of a part: the centre of the pads that lie symmetric around it
  function snap(pads, x, y) {
    if (!pads || !pads.length) return null;
    var radii = [2.4, 4.2, 7];
    for (var r = 0; r < radii.length; r++) {
      var R = radii[r], near = pads.filter(function (d) { return Math.hypot(d.cx - x, d.cy - y) < R; });
      if (near.length < 2) continue;
      var c = { x: x, y: y }, tol = 1.5, used = null;
      for (var it = 0; it < 4; it++) {
        var m = [];
        near.forEach(function (d) {
          var tx = 2 * c.x - d.cx, ty = 2 * c.y - d.cy, best = null, bd = tol;
          near.forEach(function (q) {
            if (q === d) return;
            var dd = Math.hypot(q.cx - tx, q.cy - ty), ra = q.a / d.a;
            if (dd < bd && ra > 0.55 && ra < 1.8) { bd = dd; best = q; }
          });
          if (best) m.push(d);
        });
        if (m.length < 2) { used = null; break; }
        var sx = 0, sy = 0;
        m.forEach(function (d) { sx += d.cx; sy += d.cy; });
        c = { x: sx / m.length, y: sy / m.length }; used = m; tol = 0.45;
      }
      if (used && Math.hypot(c.x - x, c.y - y) < Math.min(1.8, R * 0.6)) return { x: c.x, y: c.y, pads: used };
    }
    return null;
  }

  // ================================================================ the view
  function View(wrap, opts) {
    this.wrap = wrap;
    this.opts = opts || {};
    this.c = wrap.querySelector("canvas");
    this.board = null; this.img = {}; this.side = "top";
    this.zoom = 1; this.ox = 0; this.oy = 0;
    this.parts = [];          // [{ ref, x, y, side, r, placed }]
    this.sel = {};            // ref -> true
    this.focus = null;        // one ref
    this.labels = false; this.showPlaced = true;
    this.hover = null; this.preview = null; this.teach = false;
    var self = this;
    new ResizeObserver(function () { self.resize(); }).observe(wrap);
    this.bind();
  }
  var P = View.prototype;
  P.setBoard = function (board, look) {
    this.board = board; this.img = {}; this.look = look || {};
    this.fit();
  };
  P.setLook = function (look) { this.look = look; this.img = {}; this.draw(); };
  P.image = function () {
    if (!this.board) return null;
    var k = this.side;
    if (!this.img[k]) {
      var b = this.board.bbox, s = Math.min(32, 3200 / Math.max(b.x1 - b.x0, b.y1 - b.y0));
      this.img[k] = { c: G.render(this.board, { side: k, scale: s, mask: this.look.mask || "green", silk: this.look.silk || "white", finish: this.look.finish || "tin" }), s: s };
    }
    return this.img[k];
  };
  P.resize = function () {
    var w = this.wrap.clientWidth, h = this.wrap.clientHeight, d = window.devicePixelRatio || 1;
    this.W = w; this.H = h; this.dpr = d;
    this.c.width = Math.round(w * d); this.c.height = Math.round(h * d);
    this.c.style.width = w + "px"; this.c.style.height = h + "px";
    if (!this.fitted && this.board) this.fit(); else this.draw();
  };
  P.fit = function () {
    if (!this.board || !this.W) { this.draw(); return; }
    var b = this.board.bbox, bw = b.x1 - b.x0, bh = b.y1 - b.y0, m = 24;
    this.zoom = Math.min((this.W - 2 * m) / bw, (this.H - 2 * m) / bh);      // screen px per mm
    this.ox = (this.W - bw * this.zoom) / 2; this.oy = (this.H - bh * this.zoom) / 2;
    this.fitted = true;
    this.draw();
  };
  // mm (board coordinates) <-> screen
  P.toScreen = function (x, y) {
    var b = this.board.bbox, u = this.side === "top" ? x - b.x0 : b.x1 - x, v = b.y1 - y;
    return [this.ox + u * this.zoom, this.oy + v * this.zoom];
  };
  P.toBoard = function (sx, sy) {
    var b = this.board.bbox, u = (sx - this.ox) / this.zoom, v = (sy - this.oy) / this.zoom;
    return [this.side === "top" ? b.x0 + u : b.x1 - u, b.y1 - v];
  };
  P.zoomAt = function (f, sx, sy) {
    if (!this.board) return;
    if (sx == null) { sx = this.W / 2; sy = this.H / 2; }
    var nz = Math.max(0.5, Math.min(400, this.zoom * f));
    f = nz / this.zoom;
    this.ox = sx - (sx - this.ox) * f; this.oy = sy - (sy - this.oy) * f; this.zoom = nz;
    this.draw();
  };
  // bring parts into view (zoom in a little if they are tiny)
  P.show = function (list) {
    if (!this.board || !list.length) return;
    var pts = list.map(function (p) { return this.toScreen(p.x, p.y); }, this);
    var x0 = Math.min.apply(null, pts.map(function (p) { return p[0]; })), x1 = Math.max.apply(null, pts.map(function (p) { return p[0]; }));
    var y0 = Math.min.apply(null, pts.map(function (p) { return p[1]; })), y1 = Math.max.apply(null, pts.map(function (p) { return p[1]; }));
    var m = 60;
    if (x0 < m || y0 < m || x1 > this.W - m || y1 > this.H - m) {
      this.ox += this.W / 2 - (x0 + x1) / 2; this.oy += this.H / 2 - (y0 + y1) / 2;
    }
    this.draw();
  };
  P.draw = function () {
    var self = this;
    if (this.raf) return;
    this.raf = requestAnimationFrame(function () { self.raf = 0; self.paint(); });
  };
  P.paint = function () {
    var g = this.c.getContext("2d"), d = this.dpr || 1;
    g.setTransform(d, 0, 0, d, 0, 0);
    g.fillStyle = "#1b2029"; g.fillRect(0, 0, this.W, this.H);
    var im = this.image();
    if (!im) return;
    var b = this.board.bbox, k = this.zoom / im.s;
    g.imageSmoothingEnabled = this.zoom < im.s * 1.2;
    g.drawImage(im.c, this.ox, this.oy, im.c.width * k, im.c.height * k);
    var side = this.side, here = this.parts.filter(function (p) { return p.side === side; }), self = this;
    var lit = here.filter(function (p) { return self.sel[p.ref]; });
    var bx = this.toScreen(side === "top" ? b.x0 : b.x1, b.y1), bw = (b.x1 - b.x0) * this.zoom, bh = (b.y1 - b.y0) * this.zoom;
    // dim the board, leave light around the selected parts
    if (lit.length) {
      var path = new Path2D();
      path.rect(bx[0] - 4, bx[1] - 4, bw + 8, bh + 8);
      lit.forEach(function (p) { var s = self.toScreen(p.x, p.y); path.moveTo(s[0] + self.rad(p), s[1]); path.arc(s[0], s[1], self.rad(p), 0, Math.PI * 2, true); });
      g.fillStyle = "rgba(14,17,24,0.66)"; g.fill(path, "evenodd");
    }
    // placed parts
    if (this.showPlaced) here.forEach(function (p) {
      if (!p.placed || self.sel[p.ref]) return;
      var s = self.toScreen(p.x, p.y), r = Math.max(3, Math.min(9, self.rad(p) * 0.45));
      g.fillStyle = "rgba(46,160,67,0.85)"; g.beginPath(); g.arc(s[0], s[1], r, 0, Math.PI * 2); g.fill();
      if (r > 5) { g.strokeStyle = "#fff"; g.lineWidth = 1.6; g.beginPath(); g.moveTo(s[0] - r * 0.45, s[1]); g.lineTo(s[0] - r * 0.1, s[1] + r * 0.38); g.lineTo(s[0] + r * 0.5, s[1] - r * 0.4); g.stroke(); }
    });
    // rings around the selected parts
    lit.forEach(function (p) {
      var s = self.toScreen(p.x, p.y), r = self.rad(p), focus = self.focus === p.ref;
      g.strokeStyle = focus ? "#ffd166" : "#4cc2ff"; g.lineWidth = focus ? 3 : 2.2;
      g.beginPath(); g.arc(s[0], s[1], r, 0, Math.PI * 2); g.stroke();
    });
    // labels
    g.font = "bold 12px Chivo, system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    var lab = function (p, strong) {
      var s = self.toScreen(p.x, p.y), r = strong ? self.rad(p) : 0, t = p.ref, w = g.measureText(t).width + 8, y = s[1] - r - (strong ? 11 : 0);
      g.fillStyle = strong ? (self.focus === p.ref ? "#ffd166" : "#4cc2ff") : "rgba(14,17,24,0.72)";
      g.fillRect(s[0] - w / 2, y - 8, w, 16);
      g.fillStyle = strong ? "#0e1118" : "#fff"; g.fillText(t, s[0], y + 0.5);
    };
    if (this.labels || this.teach) here.forEach(function (p) { if (!self.sel[p.ref]) lab(p, false); });
    lit.forEach(function (p) { lab(p, true); });
    // hover and teach preview
    if (this.hover && this.hover.side === side && !this.sel[this.hover.ref]) {
      var hs = this.toScreen(this.hover.x, this.hover.y);
      g.strokeStyle = "rgba(255,255,255,0.9)"; g.lineWidth = 1.5; g.beginPath(); g.arc(hs[0], hs[1], this.rad(this.hover), 0, Math.PI * 2); g.stroke();
    }
    if (this.teach && this.preview) {
      var ps = this.toScreen(this.preview.x, this.preview.y), pr = this.preview.r * this.zoom;
      g.strokeStyle = this.preview.snapped ? "#7ee787" : "#ffd166"; g.lineWidth = 2; g.setLineDash(this.preview.snapped ? [] : [5, 4]);
      g.beginPath(); g.arc(ps[0], ps[1], Math.max(8, pr), 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
      g.beginPath(); g.moveTo(ps[0] - 6, ps[1]); g.lineTo(ps[0] + 6, ps[1]); g.moveTo(ps[0], ps[1] - 6); g.lineTo(ps[0], ps[1] + 6); g.stroke();
      if (this.preview.pads) this.preview.pads.forEach(function (d) {
        var a = self.toScreen(d.x0, d.y1), c = self.toScreen(d.x1, d.y0);
        g.strokeStyle = "#7ee787"; g.lineWidth = 1.2; g.strokeRect(Math.min(a[0], c[0]), a[1], Math.abs(c[0] - a[0]), c[1] - a[1]);
      });
    }
  };
  P.rad = function (p) { return Math.max(9, p.r * this.zoom); };
  P.partAt = function (sx, sy) {
    var side = this.side, best = null, bd = Infinity, self = this;
    this.parts.forEach(function (p) {
      if (p.side !== side) return;
      var s = self.toScreen(p.x, p.y), d = Math.hypot(s[0] - sx, s[1] - sy);
      if (d < self.rad(p) && d < bd) { bd = d; best = p; }
    });
    return best;
  };

  // ---------------------------------------------------------------- input
  P.bind = function () {
    var self = this, c = this.c, pts = new Map(), drag = null, pinch = null;
    function pos(e) { var r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    c.addEventListener("wheel", function (e) {
      if (!self.board) return;
      e.preventDefault();
      var p = pos(e);
      if (e.ctrlKey || Math.abs(e.deltaY) >= Math.abs(e.deltaX)) self.zoomAt(Math.pow(1.0015, -e.deltaY * (e.deltaMode === 1 ? 30 : 1)), p[0], p[1]);
      else { self.ox -= e.deltaX; self.draw(); }
    }, { passive: false });
    c.addEventListener("pointerdown", function (e) {
      if (!self.board) return;
      var p = pos(e);
      pts.set(e.pointerId, p); c.setPointerCapture(e.pointerId);
      if (pts.size === 2) {
        var a = Array.from(pts.values());
        pinch = { d: Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]) || 1, z: self.zoom, mid: [(a[0][0] + a[1][0]) / 2, (a[0][1] + a[1][1]) / 2] };
        drag = null; return;
      }
      drag = { p: p, ox: self.ox, oy: self.oy, moved: false };
    });
    c.addEventListener("pointermove", function (e) {
      var p = pos(e);
      if (pts.has(e.pointerId)) pts.set(e.pointerId, p);
      if (pinch && pts.size === 2) {
        var a = Array.from(pts.values()), d = Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]) || 1;
        self.zoomAt(pinch.z * d / pinch.d / self.zoom, pinch.mid[0], pinch.mid[1]);
        return;
      }
      if (drag) {
        if (Math.hypot(p[0] - drag.p[0], p[1] - drag.p[1]) > 4) drag.moved = true;
        if (drag.moved) { self.ox = drag.ox + p[0] - drag.p[0]; self.oy = drag.oy + p[1] - drag.p[1]; self.draw(); }
        return;
      }
      if (!self.board) return;
      if (self.teach) {
        var bp = self.toBoard(p[0], p[1]), sn = e.altKey ? null : snap(self.pads && self.pads[self.side], bp[0], bp[1]);
        self.preview = sn ? { x: sn.x, y: sn.y, snapped: true, pads: sn.pads, r: self.teachR || 1.5 } : { x: bp[0], y: bp[1], snapped: false, r: self.teachR || 1.5 };
        self.draw();
        return;
      }
      var h = self.partAt(p[0], p[1]);
      if (h !== self.hover) { self.hover = h; self.draw(); if (self.opts.onHover) self.opts.onHover(h); }
      c.style.cursor = h ? "pointer" : "grab";
    });
    function up(e) {
      var p = pos(e);
      pts.delete(e.pointerId);
      if (pinch) { if (pts.size < 2) pinch = null; return; }
      var d = drag; drag = null;
      if (!d || d.moved || !self.board) return;
      if (self.teach) {
        var bp = self.toBoard(p[0], p[1]), sn = e.altKey ? null : snap(self.pads && self.pads[self.side], bp[0], bp[1]);
        if (self.opts.onTeach) self.opts.onTeach(sn ? sn.x : bp[0], sn ? sn.y : bp[1], self.side, !!sn);
        return;
      }
      var h = self.partAt(p[0], p[1]);
      if (self.opts.onClick) self.opts.onClick(h);
    }
    c.addEventListener("pointerup", up);
    c.addEventListener("pointercancel", function (e) { pts.delete(e.pointerId); drag = null; pinch = null; });
    c.addEventListener("pointerleave", function () { if (self.hover || self.preview) { self.hover = null; self.preview = null; self.draw(); if (self.opts.onHover) self.opts.onHover(null); } });
    c.addEventListener("dblclick", function (e) { var p = pos(e); if (!self.teach) self.zoomAt(2, p[0], p[1]); });
  };

  global.IBOM = global.IBOM || {};
  global.IBOM.View = View;
  global.IBOM.findPads = findPads;
  global.IBOM.snap = snap;
})(window);
