/* C64 Pixel Studio: the pixel editor used for sprites, characters and bitmaps.
 * Tools: pen, line, rectangle, filled rectangle, fill, pick. Left button paints the
 * first colour, right button the second. */
(function (global) {
  "use strict";

  var tools = { tool: "pen" };     // shared by all editors

  // o: { size() -> { w, h, aspect, scale }, get(x, y), set(x, y, v), css(v) (null: transparent),
  //      begin(label), end(), paint(button) -> value, onPick(v, button), grid() -> { major: [gx, gy] },
  //      overlay(ctx, cw, ch), onHover(x, y) }
  function PixelEditor(canvas, o) {
    this.cv = canvas; this.o = o;
    this.g = canvas.getContext("2d");
    this.off = document.createElement("canvas");
    this.drag = null;
    this.hover = null;
    var self = this;
    canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    canvas.addEventListener("pointerdown", function (e) { self.down(e); });
    canvas.addEventListener("pointermove", function (e) { self.move(e); });
    canvas.addEventListener("pointerup", function (e) { self.up(e); });
    canvas.addEventListener("pointercancel", function (e) { self.up(e); });
    canvas.addEventListener("pointerleave", function () { self.hover = null; if (!self.drag) self.render(); if (o.onHover) o.onHover(-1, -1); });
  }
  var P = PixelEditor.prototype;

  P.cellAt = function (e) {
    var s = this.o.size(), r = this.cv.getBoundingClientRect();
    var x = (e.clientX - r.left) * this.cv.width / r.width, y = (e.clientY - r.top) * this.cv.height / r.height;
    return { x: Math.floor(x / (s.scale * s.aspect)), y: Math.floor(y / s.scale) };
  };
  P.inside = function (c) { var s = this.o.size(); return c.x >= 0 && c.y >= 0 && c.x < s.w && c.y < s.h; };

  P.down = function (e) {
    if (e.button > 2) return;
    e.preventDefault();
    var c = this.cellAt(e);
    if (!this.inside(c)) return;
    var button = e.button === 2 ? 1 : 0, tool = e.altKey ? "pick" : tools.tool;
    if (tool === "pick") { if (this.o.onPick) this.o.onPick(this.o.get(c.x, c.y), button); return; }
    var v = this.o.paint(button);
    if (v === undefined) return;
    this.cv.setPointerCapture(e.pointerId);
    if (tool === "fill") {
      this.o.begin("Fill");
      this.fill(c.x, c.y, v);
      this.o.end();
      return;
    }
    this.drag = { tool: tool, start: c, last: c, v: v };
    if (tool === "pen") {
      this.o.begin("Draw");
      this.o.set(c.x, c.y, v);
      this.render();
    }
  };
  P.move = function (e) {
    var c = this.cellAt(e);
    this.hover = this.inside(c) ? c : null;
    if (this.o.onHover) this.o.onHover(this.hover ? c.x : -1, this.hover ? c.y : -1);
    var d = this.drag;
    if (!d) { this.render(); return; }
    var s = this.o.size();
    c.x = Math.max(0, Math.min(s.w - 1, c.x)); c.y = Math.max(0, Math.min(s.h - 1, c.y));
    if (d.tool === "pen") {
      var self = this;
      line(d.last.x, d.last.y, c.x, c.y, function (x, y) { self.o.set(x, y, d.v); });
      d.last = c;
      this.render();
    } else { d.last = c; this.render(); }
  };
  P.up = function () {
    var d = this.drag;
    if (!d) return;
    this.drag = null;
    if (d.tool !== "pen") {
      var pts = shape(d.tool, d.start, d.last);
      this.o.begin({ line: "Line", rect: "Rectangle", frect: "Filled rectangle", oval: "Ellipse" }[d.tool] || "Draw");
      for (var i = 0; i < pts.length; i++) this.o.set(pts[i][0], pts[i][1], d.v);
    }
    this.o.end();
  };

  P.fill = function (x0, y0, v) {
    var s = this.o.size(), from = this.o.get(x0, y0);
    if (from === v) return;
    var seen = new Uint8Array(s.w * s.h), stack = [x0, y0], list = [];
    while (stack.length) {
      var y = stack.pop(), x = stack.pop();
      if (x < 0 || y < 0 || x >= s.w || y >= s.h || seen[y * s.w + x] || this.o.get(x, y) !== from) continue;
      seen[y * s.w + x] = 1; list.push(x, y);
      stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
    }
    for (var i = 0; i < list.length; i += 2) this.o.set(list[i], list[i + 1], v);
  };

  P.render = function () {
    var s = this.o.size(), cw = s.scale * s.aspect, ch = s.scale;
    var W = Math.round(s.w * cw), H = s.h * ch;
    if (this.cv.width !== W || this.cv.height !== H) { this.cv.width = W; this.cv.height = H; }
    // pixels at one dot each, then scaled up
    var off = this.off;
    if (off.width !== s.w || off.height !== s.h) { off.width = s.w; off.height = s.h; }
    var og = off.getContext("2d"), img = og.createImageData(s.w, s.h), px = img.data;
    var cache = {};
    for (var y = 0; y < s.h; y++) {
      for (var x = 0; x < s.w; x++) {
        var v = this.o.get(x, y), rgb = cache[v];
        if (rgb === undefined) { var css = this.o.css(v); rgb = cache[v] = css ? hexRgb(css) : null; }
        var p = (y * s.w + x) * 4;
        if (!rgb) {
          var light = ((x * s.aspect >> 0) + y) & 1;
          px[p] = px[p + 1] = px[p + 2] = light ? 0xd8 : 0xc4; px[p + 3] = 255;
        } else { px[p] = rgb[0]; px[p + 1] = rgb[1]; px[p + 2] = rgb[2]; px[p + 3] = 255; }
      }
    }
    // shape being drawn
    var d = this.drag;
    if (d && d.tool !== "pen") {
      var pts = shape(d.tool, d.start, d.last), prgb = hexRgb(this.o.css(d.v) || "#ffffff");
      for (var i = 0; i < pts.length; i++) {
        var q = (pts[i][1] * s.w + pts[i][0]) * 4;
        px[q] = prgb[0]; px[q + 1] = prgb[1]; px[q + 2] = prgb[2];
      }
    }
    og.putImageData(img, 0, 0);
    var g = this.g;
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, W, H);
    g.drawImage(off, 0, 0, W, H);
    if (this.o.overlay) this.o.overlay(g, cw, ch);
    // grid
    var grid = this.o.grid ? this.o.grid() : {};
    if (cw >= 6 && grid.minor !== false) {
      g.fillStyle = "rgba(255,255,255,0.13)";
      for (var gx = 1; gx < s.w; gx++) g.fillRect(Math.round(gx * cw), 0, 1, H);
      for (var gy = 1; gy < s.h; gy++) g.fillRect(0, gy * ch, W, 1);
      g.fillStyle = "rgba(0,0,0,0.13)";
      for (gx = 1; gx < s.w; gx++) g.fillRect(Math.round(gx * cw) - 1, 0, 1, H);
      for (gy = 1; gy < s.h; gy++) g.fillRect(0, gy * ch - 1, W, 1);
    }
    if (grid.major) {
      g.fillStyle = "rgba(240,164,0,0.75)";
      var mx = grid.major[0], my = grid.major[1];
      for (gx = mx; gx < s.w; gx += mx) g.fillRect(Math.round(gx * cw) - 1, 0, 2, H);
      for (gy = my; gy < s.h; gy += my) g.fillRect(0, gy * ch - 1, W, 2);
    }
    // the cell under the pointer
    if (this.hover && !d) {
      g.strokeStyle = "rgba(255,255,255,0.9)"; g.lineWidth = 1;
      g.strokeRect(Math.round(this.hover.x * cw) + 0.5, this.hover.y * ch + 0.5, Math.round(cw) - 1, ch - 1);
    }
  };

  function hexRgb(css) {
    var v = parseInt(css.slice(1), 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }
  function line(x0, y0, x1, y1, f) {
    var dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx + dy;
    for (;;) {
      f(x0, y0);
      if (x0 === x1 && y0 === y1) break;
      var e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  function shape(tool, a, b) {
    var pts = [], add = function (x, y) { pts.push([x, y]); };
    var x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x), y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y), x, y;
    if (tool === "line") line(a.x, a.y, b.x, b.y, add);
    else if (tool === "rect") {
      for (x = x0; x <= x1; x++) { add(x, y0); if (y1 !== y0) add(x, y1); }
      for (y = y0 + 1; y < y1; y++) { add(x0, y); if (x1 !== x0) add(x1, y); }
    } else if (tool === "frect") { for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) add(x, y); }
    else if (tool === "oval") {
      var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rx = (x1 - x0) / 2 + 0.5, ry = (y1 - y0) / 2 + 0.5;
      for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) {
        var nx = (x - cx) / rx, ny = (y - cy) / ry, inner = Math.pow((x - cx) / Math.max(0.5, rx - 1), 2) + Math.pow((y - cy) / Math.max(0.5, ry - 1), 2);
        if (nx * nx + ny * ny <= 1 && (inner > 1 || rx < 1.6 || ry < 1.6)) add(x, y);
      }
    }
    return pts;
  }

  PixelEditor.tools = tools;
  PixelEditor.line = line;
  global.PixelEditor = PixelEditor;
})(typeof window !== "undefined" ? window : globalThis);
