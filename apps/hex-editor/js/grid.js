/* Hex Editor: the hex view. Only the visible rows are in the page, so files of many megabytes
 * scroll smoothly. Each region (segment) starts with a heading row; bytes can be selected with
 * mouse and keyboard and overwritten in the hex or the text column, with undo. */
(function (global) {
  "use strict";
  var HX = global.HX, RH = 21, MAXPX = 8e6;
  var h2 = HX.hex2;

  function Grid(el, opts) {
    this.el = el; this.opts = opts || {};
    el.innerHTML = '<div class="hx-space"></div><div class="hx-rows"></div>';
    this.space = el.firstChild; this.rowsEl = el.lastChild;
    this.regions = []; this.W = 16; this.blocks = []; this.rows = 0;
    this.cur = null; this.anchor = null; this.pane = "hex"; this.nib = 0;
    this.undoS = []; this.redoS = [];
    this.marks = {};               // address → symbol name
    this.addrDigits = 8;
    var self = this;
    el.addEventListener("scroll", function () { self.render(); });
    this.ro = new ResizeObserver(function () { self.render(); });
    this.ro.observe(el);
    this.bind();
  }
  var P = Grid.prototype;

  // ---------------------------------------------------------------- model
  P.setRegions = function (regions, keepPos) {
    this.regions = regions;
    regions.forEach(function (r) { if (!r.orig) r.orig = r.data.slice(); });
    var top = 0;
    regions.forEach(function (r) { top = Math.max(top, r.addr + r.data.length); });
    this.addrDigits = top > 0xFFFFFFFF ? 16 : 8;
    this.layout();
    if (!keepPos) { this.undoS = []; this.redoS = []; this.cur = regions.length ? regions[0].addr : null; this.anchor = this.cur; this.el.scrollTop = 0; }
    this.render(); this.cursorChanged();
  };
  P.setWidth = function (w) {
    var a = this.cur; this.W = w; this.layout();
    if (a != null) this.reveal(a, true);
    this.render();
  };
  P.layout = function () {
    var W = this.W, row = 0;
    this.blocks = this.regions.map(function (r, i) {
      var first = Math.floor(r.addr / W) * W, last = Math.floor((r.addr + Math.max(1, r.data.length) - 1) / W) * W;
      var b = { r: r, i: i, row: row, first: first, n: (last - first) / W + 1 };
      row += 1 + b.n;
      return b;
    });
    this.rows = row;
    this.scale = Math.max(1, row * RH / MAXPX);
    this.space.style.height = Math.min(row * RH, MAXPX) + RH * 2 + "px";
  };
  P.regionAt = function (a) {
    var R = this.regions, lo = 0, hi = R.length - 1;
    while (lo <= hi) {
      var m = (lo + hi) >> 1, r = R[m];
      if (a < r.addr) hi = m - 1; else if (a >= r.addr + r.data.length) lo = m + 1; else return r;
    }
    return null;
  };
  P.get = function (a) { var r = this.regionAt(a); return r ? r.data[a - r.addr] : undefined; };
  P.first = function () { return this.regions.length ? this.regions[0].addr : null; };
  P.last = function () { var r = this.regions[this.regions.length - 1]; return r ? r.addr + r.data.length - 1 : null; };
  // the nearest existing byte from a, searching in direction dir
  P.snap = function (a, dir) {
    if (this.regionAt(a)) return a;
    var R = this.regions;
    if (dir >= 0) { for (var i = 0; i < R.length; i++) if (R[i].addr > a) return R[i].addr; return this.last(); }
    for (var j = R.length - 1; j >= 0; j--) if (R[j].addr + R[j].data.length - 1 < a) return R[j].addr + R[j].data.length - 1;
    return this.first();
  };
  P.rowOf = function (a) {
    var r = this.regionAt(a); if (!r) return 0;
    var b = this.blocks[this.regions.indexOf(r)];
    return b.row + 1 + (Math.floor(a / this.W) * this.W - b.first) / this.W;
  };
  P.sel = function () { if (this.cur == null) return null; return [Math.min(this.cur, this.anchor), Math.max(this.cur, this.anchor)]; };
  // number of existing bytes in a…b
  P.count = function (a, b) {
    var n = 0;
    this.regions.forEach(function (r) { var x = Math.max(a, r.addr), y = Math.min(b, r.addr + r.data.length - 1); if (y >= x) n += y - x + 1; });
    return n;
  };
  // the bytes of a…b as pieces [{addr, data}]
  P.pieces = function (a, b) {
    var out = [];
    this.regions.forEach(function (r) { var x = Math.max(a, r.addr), y = Math.min(b, r.addr + r.data.length - 1); if (y >= x) out.push({ addr: x, data: r.data.subarray(x - r.addr, y - r.addr + 1) }); });
    return out;
  };

  // ---------------------------------------------------------------- editing
  P.write = function (a, bytes, label) {
    var ch = [];
    for (var i = 0; i < bytes.length; i++) {
      var r = this.regionAt(a + i); if (!r) continue;
      var k = a + i - r.addr, old = r.data[k];
      if (old !== bytes[i]) { r.data[k] = bytes[i]; ch.push([r, k, old, bytes[i]]); }
    }
    if (ch.length) { this.undoS.push({ ch: ch, label: label }); this.redoS = []; this.changed(); }
    return ch.length;
  };
  P.undo = function () {
    var u = this.undoS.pop(); if (!u) return;
    for (var i = u.ch.length - 1; i >= 0; i--) { var c = u.ch[i]; c[0].data[c[1]] = c[2]; }
    this.redoS.push(u); this.goto(u.ch[0][0].addr + u.ch[0][1]); this.changed();
  };
  P.redo = function () {
    var u = this.redoS.pop(); if (!u) return;
    u.ch.forEach(function (c) { c[0].data[c[1]] = c[3]; });
    this.undoS.push(u); this.goto(u.ch[0][0].addr + u.ch[0][1]); this.changed();
  };
  P.modified = function () {
    var n = 0;
    this.regions.forEach(function (r) { for (var i = 0; i < r.data.length; i++) if (r.data[i] !== r.orig[i]) n++; });
    return n;
  };
  P.changed = function () { this.render(); if (this.opts.onChange) this.opts.onChange(); this.cursorChanged(); };
  P.cursorChanged = function () { if (this.opts.onCursor) this.opts.onCursor(); };

  // ---------------------------------------------------------------- moving
  P.goto = function (a, keepAnchor, dir) {
    if (a == null || !this.regions.length) return;
    a = this.snap(Math.max(this.first(), Math.min(this.last(), a)), dir || 0);
    this.cur = a; if (!keepAnchor) this.anchor = a;
    this.nib = 0;
    this.reveal(a);
    this.render(); this.cursorChanged();
  };
  P.select = function (a, b) { this.anchor = this.snap(a, 1); this.cur = this.snap(b, -1); this.nib = 0; this.reveal(this.anchor, true); this.render(); this.cursorChanged(); };
  P.visRows = function () { return Math.max(1, Math.floor(this.el.clientHeight / RH) - 1); };
  P.topRow = function () { return Math.floor(this.el.scrollTop * this.scale / RH); };
  P.reveal = function (a, center) {
    var r = this.rowOf(a), top = this.topRow(), vis = this.visRows();
    if (center) top = Math.max(0, r - Math.floor(vis / 3));
    else if (r < top + 1) top = Math.max(0, r - 1);
    else if (r >= top + vis) top = r - vis + 1;
    else return;
    this.el.scrollTop = top * RH / this.scale;
  };

  // ---------------------------------------------------------------- drawing
  P.blockAt = function (row) {
    var B = this.blocks, lo = 0, hi = B.length - 1;
    while (lo < hi) { var m = (lo + hi + 1) >> 1; if (B[m].row <= row) lo = m; else hi = m - 1; }
    return B[lo];
  };
  function ch(v) { return v >= 32 && v < 127 ? (v === 60 ? "&lt;" : v === 38 ? "&amp;" : String.fromCharCode(v)) : "."; }
  P.render = function () {
    if (!this.regions.length) { this.rowsEl.innerHTML = ""; return; }
    var top = this.topRow(), n = Math.ceil(this.el.clientHeight / RH) + 2, W = this.W, html = [], sel = this.sel(), self = this, dg = this.addrDigits;
    this.rowsEl.style.top = this.el.scrollTop + "px";
    for (var row = top; row < Math.min(this.rows, top + n); row++) {
      var b = this.blockAt(row), r = b.r;
      if (row === b.row) {
        var prev = this.regions[b.i - 1], gap = prev ? r.addr - (prev.addr + prev.data.length) : 0;
        html.push('<div class="hd"><b>' + esc(r.name || "Region " + (b.i + 1)) + "</b> " + HX.hexN(r.addr, dg) + " – " + HX.hexN(r.addr + r.data.length - 1, dg) + " · " + r.data.length.toLocaleString("en") + " bytes" + (gap > 0 ? " · gap of " + gap.toLocaleString("en") + " bytes before" : "") + "</div>");
        continue;
      }
      var base = b.first + (row - b.row - 1) * W, hx = "", tx = "";
      for (var k = 0; k < W; k++) {
        var a = base + k, off = a - r.addr, sep = k && k % 8 === 0 ? " g" : "";
        if (off < 0 || off >= r.data.length) { hx += '<i class="e' + sep + '">  </i>'; tx += '<i class="e"> </i>'; continue; }
        var v = r.data[off], cls = (v !== r.orig[off] ? " m" : "") + (sel && a >= sel[0] && a <= sel[1] ? " s" : "") + (a === this.cur ? " c" : "") + (v === 0 ? " z" : v === 255 ? " f" : "") + sep;
        var mk = this.marks[a], t = mk ? ' title="' + esc(mk) + '"' : "";
        hx += '<i data-a="' + a + '" class="' + cls + (mk ? " y" : "") + '"' + t + ">" + h2(v) + "</i>";
        tx += '<i data-a="' + a + '" data-p="t" class="' + cls + '">' + ch(v) + "</i>";
      }
      html.push('<div class="r"><span class="ad">' + HX.hexN(base, dg) + '</span><span class="hx' + (this.pane === "hex" ? " on" : "") + '">' + hx + '</span><span class="tx' + (this.pane === "text" ? " on" : "") + '">' + tx + "</span></div>");
    }
    this.rowsEl.innerHTML = html.join("");
    this.rowsEl.style.setProperty("--w", W);
    void self;
  };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // ---------------------------------------------------------------- input
  P.bind = function () {
    var self = this, el = this.el, down = false;
    function hit(e) { var t = e.target.closest("i[data-a]"); return t ? { a: +t.dataset.a, pane: t.dataset.p === "t" ? "text" : "hex" } : null; }
    el.addEventListener("mousedown", function (e) {
      var h = hit(e); if (!h) return;
      e.preventDefault(); el.focus();
      self.pane = h.pane; down = true;
      self.goto(h.a, e.shiftKey);
    });
    el.addEventListener("mousemove", function (e) { if (!down || !(e.buttons & 1)) { down = false; return; } var h = hit(e); if (h && h.a !== self.cur) self.goto(h.a, true); });
    window.addEventListener("mouseup", function () { down = false; });
    el.addEventListener("keydown", function (e) {
      if (self.cur == null) return;
      var k = e.key, W = self.W, ctrl = e.ctrlKey || e.metaKey, ext = e.shiftKey, a = self.cur;
      if (ctrl && (k === "z" || k === "Z")) { if (e.shiftKey) self.redo(); else self.undo(); e.preventDefault(); return; }
      if (ctrl && (k === "y" || k === "Y")) { self.redo(); e.preventDefault(); return; }
      if (ctrl && (k === "a" || k === "A")) { self.select(self.first(), self.last()); e.preventDefault(); return; }
      if (ctrl) return;
      var mv = null, dir = 1;
      if (k === "ArrowLeft") { mv = a - 1; dir = -1; } else if (k === "ArrowRight") mv = a + 1;
      else if (k === "ArrowUp") { mv = a - W; dir = -1; } else if (k === "ArrowDown") mv = a + W;
      else if (k === "PageUp") { mv = a - W * self.visRows(); dir = -1; } else if (k === "PageDown") mv = a + W * self.visRows();
      else if (k === "Home") { mv = Math.floor(a / W) * W; dir = 1; } else if (k === "End") { mv = Math.floor(a / W) * W + W - 1; dir = -1; }
      else if (k === "Tab") { self.pane = self.pane === "hex" ? "text" : "hex"; self.nib = 0; self.render(); e.preventDefault(); return; }
      if (mv !== null) { self.goto(mv, ext, dir); e.preventDefault(); return; }
      if (self.opts.readOnly) return;
      if (self.pane === "hex" && /^[0-9a-fA-F]$/.test(k)) {
        var d = parseInt(k, 16), v = self.get(a);
        var nv = self.nib ? (v & 0xF0) | d : (d << 4) | (v & 0x0F);
        var wasNib = self.nib;
        var n0 = self.undoS.length;
        self.write(a, [nv], "type");
        // both digits of a byte are one step for undo
        var U = self.undoS;
        if (wasNib && U.length === n0 + 1 && n0 > 0 && U[n0 - 1].label === "nib" && U[n0 - 1].ch[0][0] === U[n0].ch[0][0] && U[n0 - 1].ch[0][1] === U[n0].ch[0][1]) {
          U[n0 - 1].ch[0][3] = U[n0].ch[0][3]; U[n0 - 1].label = "type"; U.pop();
        } else if (!wasNib && U.length === n0 + 1) U[n0].label = "nib";
        if (wasNib) { self.nib = 0; self.goto(a + 1, false, 1); } else { self.nib = 1; self.anchor = a; self.cur = a; self.render(); self.cursorChanged(); }
        e.preventDefault();
      } else if (self.pane === "text" && k.length === 1 && k.charCodeAt(0) >= 32 && k.charCodeAt(0) < 127) {
        self.write(a, [k.charCodeAt(0)], "type"); self.goto(a + 1, false, 1); e.preventDefault();
      }
    });
  };

  HX.Grid = Grid;
})(window);
