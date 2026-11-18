/* Interactive BOM: export. A small ZIP writer (for Gerber files opened one by one) and
 * a small PDF writer for the A4 soldering sheet: board picture with numbered parts and
 * the parts list with boxes to tick, on one page for the workbench. */
(function (global) {
  "use strict";
  var G = global.GERBER, I = global.IBOM;

  // ================================================================ ZIP (stored, no compression)
  var CRC = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  // files: [{ name, data: Uint8Array }]
  function zip(files) {
    var enc = new TextEncoder(), parts = [], central = [], off = 0;
    var d = new Date(), time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    files.forEach(function (f) {
      var name = enc.encode(f.name), data = f.data, crc = crc32(data);
      var h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint16(10, time, true); h.setUint16(12, date, true); h.setUint32(14, crc, true);
      h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
      var c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
      c.setUint16(12, time, true); c.setUint16(14, date, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true);
      c.setUint16(28, name.length, true); c.setUint32(42, off, true);
      parts.push(new Uint8Array(h.buffer), name, data);
      central.push(new Uint8Array(c.buffer), name);
      off += 30 + name.length + data.length;
    });
    var size = central.reduce(function (s, p) { return s + p.length; }, 0), e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
    e.setUint32(12, size, true); e.setUint32(16, off, true);
    return new Blob(parts.concat(central, [new Uint8Array(e.buffer)]), { type: "application/zip" });
  }

  // ================================================================ PDF
  // Helvetica and Helvetica-Bold widths (1/1000 em) for the characters 32…126
  var WH = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
  var WB = [278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584];
  var WIN = { 0x2013: 0x96, 0x2014: 0x97, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2026: 0x85, 0x20AC: 0x80 };
  // text as WinAnsi bytes (in a JS string with char codes < 256)
  function ansi(s) {
    s = String(s).replace(/Ω/g, "Ohm").replace(/[≤]/g, "<=").replace(/[≥]/g, ">=").replace(/[ ]/g, " ");
    var out = "";
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      out += c < 256 ? s[i] : WIN[c] ? String.fromCharCode(WIN[c]) : "?";
    }
    return out;
  }
  function textW(s, size, bold) {
    var w = 0, t = bold ? WB : WH;
    for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); w += c >= 32 && c <= 126 ? t[c - 32] : 556; }
    return w * size / 1000;
  }
  function fit(s, size, bold, max) {
    s = ansi(s);
    if (textW(s, size, bold) <= max) return s;
    while (s.length > 1 && textW(s + "\x85", size, bold) > max) s = s.slice(0, -1);
    return s + "\x85";
  }
  var PT = 72 / 25.4;      // points per mm

  // one page drawing, coordinates in mm from the top left corner
  function Page() { this.ops = []; this.images = []; }
  Page.prototype = {
    f: function (n) { return (Math.round(n * 100) / 100).toString(); },
    X: function (x) { return this.f(x * PT); },
    Y: function (y) { return this.f((297 - y) * PT); },
    color: function (c, stroke) { this.ops.push(c.map(function (v) { return (v / 255).toFixed(3); }).join(" ") + (stroke ? " RG" : " rg")); },
    text: function (x, y, s, size, o) {
      o = o || {};
      var t = o.raw ? s : ansi(s), w = textW(t, size, o.bold);
      if (o.align === "center") x -= w / PT / 2; else if (o.align === "right") x -= w / PT;
      this.color(o.color || [30, 33, 40]);
      this.ops.push("BT /" + (o.bold ? "F2" : "F1") + " " + size + " Tf " + this.X(x) + " " + this.Y(y) + " Td (" + t.replace(/[\\()]/g, "\\$&") + ") Tj ET");
    },
    rect: function (x, y, w, h, fill, stroke, lw) {
      if (fill) this.color(fill);
      if (stroke) { this.color(stroke, true); this.ops.push(this.f((lw || 0.2) * PT) + " w"); }
      this.ops.push(this.X(x) + " " + this.Y(y + h) + " " + this.f(w * PT) + " " + this.f(h * PT) + " re " + (fill && stroke ? "B" : fill ? "f" : "S"));
    },
    line: function (x0, y0, x1, y1, c, lw) {
      this.color(c, true); this.ops.push(this.f(lw * PT) + " w " + this.X(x0) + " " + this.Y(y0) + " m " + this.X(x1) + " " + this.Y(y1) + " l S");
    },
    circle: function (x, y, r, fill, stroke, lw) {
      var k = 0.5523 * r, p = this, P = function (a, b) { return p.X(a) + " " + p.Y(b); };
      if (fill) this.color(fill);
      if (stroke) { this.color(stroke, true); this.ops.push(this.f((lw || 0.2) * PT) + " w"); }
      this.ops.push(P(x + r, y) + " m " + P(x + r, y + k) + " " + P(x + k, y + r) + " " + P(x, y + r) + " c " + P(x - k, y + r) + " " + P(x - r, y + k) + " " + P(x - r, y) + " c " +
        P(x - r, y - k) + " " + P(x - k, y - r) + " " + P(x, y - r) + " c " + P(x + k, y - r) + " " + P(x + r, y - k) + " " + P(x + r, y) + " c " + (fill && stroke ? "B" : fill ? "f" : "S"));
    },
    image: function (img, x, y, w, h) {
      var name = "Im" + (this.images.length + 1);
      this.images.push({ name: name, img: img });
      this.ops.push("q " + this.f(w * PT) + " 0 0 " + this.f(h * PT) + " " + this.X(x) + " " + this.Y(y + h) + " cm /" + name + " Do Q");
    }
  };
  function bytes(s) { var u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i) & 255; return u; }
  // pages → PDF file (Blob)
  function pdf(pages, title) {
    var chunks = [], len = 0, offs = [];
    var put = function (x) { var u = typeof x === "string" ? bytes(x) : x; chunks.push(u); len += u.length; };
    var obj = function (n, body) { offs[n] = len; put(n + " 0 obj\n"); body.forEach(put); put("\nendobj\n"); };
    put("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
    var n = 5, kids = [], pageObjs = [];
    pages.forEach(function (pg) {
      var imgs = pg.images.map(function (im) { return { name: im.name, img: im.img, n: n++ }; });
      var content = n++, page = n++;
      pageObjs.push({ pg: pg, imgs: imgs, content: content, page: page });
      kids.push(page + " 0 R");
    });
    obj(1, ["<< /Type /Catalog /Pages 2 0 R >>"]);
    obj(2, ["<< /Type /Pages /Kids [" + kids.join(" ") + "] /Count " + pages.length + " >>"]);
    obj(3, ["<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"]);
    obj(4, ["<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"]);
    pageObjs.forEach(function (p) {
      p.imgs.forEach(function (im) {
        obj(im.n, ["<< /Type /XObject /Subtype /Image /Width " + im.img.w + " /Height " + im.img.h + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + im.img.data.length + " >>\nstream\n", im.img.data, "\nendstream"]);
      });
      var s = p.pg.ops.join("\n");
      obj(p.content, ["<< /Length " + s.length + " >>\nstream\n" + s + "\nendstream"]);
      obj(p.page, ["<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents " + p.content + " 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> /XObject << " +
        p.imgs.map(function (im) { return "/" + im.name + " " + im.n + " 0 R"; }).join(" ") + " >> >> >>"]);
    });
    var info = n++;
    obj(info, ["<< /Title (" + ansi(title || "").replace(/[\\()]/g, "\\$&") + ") /Creator (Interactive BOM by wagiminator) >>"]);
    var xref = len;
    put("xref\n0 " + n + "\n0000000000 65535 f \n");
    for (var i = 1; i < n; i++) put(String(offs[i] || 0).padStart(10, "0") + " 00000 n \n");
    put("trailer\n<< /Size " + n + " /Root 1 0 R /Info " + info + " 0 R >>\nstartxref\n" + xref + "\n%%EOF\n");
    return new Blob(chunks, { type: "application/pdf" });
  }
  function jpeg(canvas) {
    var url = canvas.toDataURL("image/jpeg", 0.9), bin = atob(url.slice(url.indexOf(",") + 1));
    return { w: canvas.width, h: canvas.height, data: bytes(bin) };
  }

  // ================================================================ the A4 soldering sheet
  // colours of the line numbers (readable in colour and in black and white)
  var COLORS = [[31, 111, 178], [196, 62, 28], [46, 139, 64], [142, 68, 173], [214, 130, 0], [0, 128, 128], [190, 40, 110], [90, 96, 110]];
  var INK = [30, 33, 40], SOFT = [100, 106, 118], RULE = [214, 218, 226];
  // board picture of one side, light colours for printing, on white
  function boardImage(board, side, mmW) {
    var b = board.bbox, bw = b.x1 - b.x0, bh = b.y1 - b.y0;
    var s = Math.max(4, Math.min(16, mmW * 12 / bw, 4200 / Math.max(bw, bh)));     // about 300 dpi on paper
    var src = G.render(board, { side: side, scale: s, mask: "white", silk: "black", finish: "tin" });
    var c = document.createElement("canvas"); c.width = src.width; c.height = src.height;
    var g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(src, 0, 0);
    // the outline, so that a white board shows on white paper
    g.strokeStyle = "#9aa0ad"; g.lineWidth = Math.max(1, s * 0.15); g.strokeRect(0.5, 0.5, c.width - 1, c.height - 1);
    return jpeg(c);
  }
  /* d: { title, info, source, board, lines: [{ value, mpn, footprint, refs, lcsc }] (in sheet order),
   *      pos(ref) → { x, y, side } | null, radius(lineIndex) → mm } */
  function sheet(d) {
    var M = 12, W = 210 - 2 * M, page = new Page(), pages = [page];
    var b = d.board.bbox, bw = b.x1 - b.x0, bh = b.y1 - b.y0;
    var sides = ["top"], hasBottom = false;
    d.lines.forEach(function (l) { l.refs.forEach(function (r) { var p = d.pos(r); if (p && p.side === "bottom") hasBottom = true; }); });
    if (hasBottom) sides.push("bottom");

    // ---- header
    page.text(M, M + 5, fit(d.title, 15, true, W * PT - 120), 15, { bold: true, raw: true });
    page.text(210 - M, M + 2.5, "Soldering sheet", 8, { align: "right", color: SOFT });
    page.text(210 - M, M + 6, d.date, 8, { align: "right", color: SOFT });
    page.text(M, M + 10.5, fit(d.info, 8.5, false, W * PT), 8.5, { color: SOFT, raw: true });
    var y = M + 14;

    // ---- layout: the list in one or two columns, the sides next to or below each other;
    // the biggest board picture wins, the one-column list when it costs little
    var layouts = [
      { cols: 1, size: 7.5, row: 4.6 }, { cols: 2, size: 7.5, row: 4.6 }, { cols: 2, size: 6.6, row: 3.9 }, { cols: 2, size: 5.8, row: 3.4 }
    ];
    var foot = 297 - M - 3, capH = 4, gap = 6, n = sides.length, best = null;
    layouts.forEach(function (L) {
      L.rows = rowLayout(d, L, W); L.h = tableHeight(L.rows, L);
      var room = foot - y - L.h - 8;
      L.arr = "row"; L.k = Math.min((W - gap * (n - 1)) / n / bw, (room - capH) / bh, 8);
      if (n === 2) { var k2 = Math.min(W / bw, (room - 2 * capH - gap) / 2 / bh, 8); if (k2 > L.k) { L.k = k2; L.arr = "column"; } }
      if (!best || L.k > best.k) best = L;
    });
    var L = layouts.filter(function (x) { return x.k >= best.k * 0.8 && x.k > 0.6; })[0] || best;
    var rowsOf = L.rows, k = Math.max(0.3, L.k);           // mm on paper per mm on the board

    // ---- board pictures with the numbered parts
    var pw = bw * k, ph = bh * k;
    var marks = [];
    d.lines.forEach(function (l, i) { l.refs.forEach(function (r) { var p = d.pos(r); if (p) marks.push({ x: p.x, y: p.y, side: p.side || "top", i: i, r: d.radius(i) }); }); });
    // marker size: smaller on crowded boards
    var mr = Math.max(1.15, Math.min(2.1, 0.5 * Math.sqrt(pw * ph / Math.max(1, marks.length)) * 0.55));
    sides.forEach(function (side, si) {
      var bx, cy;
      if (L.arr === "row") { bx = M + (W - (pw * n + gap * (n - 1))) / 2 + si * (pw + gap); cy = y; }
      else { bx = M + (W - pw) / 2; cy = y + si * (capH + ph + gap); }
      var by = cy + capH;
      page.text(bx, cy + 2.6, side === "top" ? "Top side" : "Bottom side (seen from below)", 7.5, { bold: true, color: SOFT });
      page.image(boardImage(d.board, side, pw), bx, by, pw, ph);
      var at = function (m) { return [bx + (side === "top" ? m.x - b.x0 : b.x1 - m.x) * k, by + (b.y1 - m.y) * k]; };
      var here = marks.filter(function (m) { return m.side === side; });
      here.forEach(function (m) { var c = at(m); page.circle(c[0], c[1], Math.max(mr, m.r * k), null, COLORS[m.i % COLORS.length], 0.25); });
      here.forEach(function (m) {
        var c = at(m), col = COLORS[m.i % COLORS.length], label = String(m.i + 1);
        page.circle(c[0], c[1], mr, col, [255, 255, 255], 0.2);
        var fs = mr * PT * (label.length > 2 ? 0.78 : label.length > 1 ? 0.98 : 1.15);
        page.text(c[0], c[1] + fs / PT * 0.36, label, +fs.toFixed(2), { bold: true, align: "center", color: [255, 255, 255] });
      });
    });
    y += (L.arr === "column" ? n * (capH + ph) + (n - 1) * gap : capH + ph) + 6;

    // ---- the parts list
    drawTable(pages, d, L, rowsOf, y, M, W, foot);
    pages.forEach(function (pg, i) {
      pg.text(M, 297 - M + 2, ansi(d.source), 6.5, { color: SOFT, raw: true });
      pg.text(210 - M, 297 - M + 2, "Interactive BOM · wagiminator.github.io/apps/interactive-bom" + (pages.length > 1 ? "  ·  page " + (i + 1) + " of " + pages.length : ""), 6.5, { align: "right", color: SOFT });
    });
    return pdf(pages, d.title);
  }
  // column widths (mm) and the wrapped designators of each line
  function rowLayout(d, L, W) {
    var cw = L.cols === 1 ? W : (W - 6) / 2, s = L.size;
    var c = L.cols === 1 ? { box: 5, num: 7, qty: 8, val: 46, refs: 0, fp: 44 } : { box: 4.5, num: 6.5, qty: 7, val: 30, refs: 0, fp: 0 };
    c.refs = cw - c.box - c.num - c.qty - c.val - c.fp;
    L.c = c; L.cw = cw;
    return d.lines.map(function (l) {
      var lines = [], cur = "", max = (c.refs - 1.5) * PT;
      l.refs.forEach(function (r) {
        var t = cur ? cur + ", " + r : r;
        if (textW(ansi(t), s, false) > max && cur) { lines.push(cur + ","); cur = r; } else cur = t;
      });
      if (cur) lines.push(cur);
      return { refs: lines.length ? lines : [""], n: Math.max(1, lines.length) };
    });
  }
  function tableHeight(rows, L) {
    var head = L.row + 1, lineH = L.size * 1.18 / PT;
    var hs = rows.map(function (r) { return L.row + (r.n - 1) * lineH; });
    if (L.cols === 1) return head + hs.reduce(function (a, b) { return a + b; }, 0);
    var half = 0, all = hs.reduce(function (a, b) { return a + b; }, 0), acc = 0;
    for (var i = 0; i < hs.length; i++) { acc += hs[i]; if (acc >= all / 2) { half = Math.max(acc, all - acc); break; } }
    return head + half;
  }
  function drawTable(pages, d, L, rows, y0, M, W, foot) {
    var page = pages[0], c = L.c, s = L.size, lineH = s * 1.18 / PT;
    var hs = rows.map(function (r) { return L.row + (r.n - 1) * lineH; });
    var all = hs.reduce(function (a, b) { return a + b; }, 0), split = rows.length, acc = 0;
    if (L.cols === 2) for (var i = 0; i < hs.length; i++) { acc += hs[i]; if (acc >= all / 2) { split = i + 1; break; } }
    var col = 0, x = M, y = y0, top = y0;
    var header = function () {
      var hy = y + L.row * 0.62;
      page.text(x + c.box + c.num - 1, hy, "#", s - 0.5, { align: "right", color: SOFT, bold: true });
      page.text(x + c.box + c.num + c.qty - 1.5, hy, "Qty", s - 0.5, { align: "right", color: SOFT, bold: true });
      page.text(x + c.box + c.num + c.qty, hy, "Value", s - 0.5, { color: SOFT, bold: true });
      page.text(x + c.box + c.num + c.qty + c.val, hy, "Designators", s - 0.5, { color: SOFT, bold: true });
      if (c.fp) page.text(x + c.box + c.num + c.qty + c.val + c.refs, hy, "Footprint / LCSC", s - 0.5, { color: SOFT, bold: true });
      page.line(x, y + L.row, x + L.cw, y + L.row, INK, 0.25);
      y += L.row + 1;
    };
    header();
    rows.forEach(function (r, i) {
      var l = d.lines[i], h = hs[i];
      if (L.cols === 2 && i === split && col === 0) { col = 1; x = M + L.cw + 6; y = top; header(); }
      if (y + h > foot) {
        page = new Page(); pages.push(page);
        col = 0; x = M; y = M; top = M; header();
      }
      var base = y + L.row * 0.66, colr = COLORS[i % COLORS.length];
      page.rect(x + 0.6, y + (L.row - 2.8) / 2, 2.8, 2.8, null, INK, 0.25);
      var nx = x + c.box + c.num - 1, label = String(i + 1), bw = textW(label, s, true) / PT + 1.6;
      page.rect(nx - bw + 0.8, y + (L.row - s * 1.15 / PT) / 2, bw, s * 1.15 / PT, colr);
      page.text(nx, base, label, s, { bold: true, align: "right", color: [255, 255, 255] });
      page.text(x + c.box + c.num + c.qty - 1.5, base, l.refs.length + "\xD7", s, { align: "right", bold: true, raw: true });
      var val = l.value || "–";
      page.text(x + c.box + c.num + c.qty, base, fit(val, s, true, (c.val - 1.5) * PT), s, { bold: true, raw: true });
      r.refs.forEach(function (t, k) { page.text(x + c.box + c.num + c.qty + c.val, base + k * lineH, t, s); });
      if (c.fp) page.text(x + c.box + c.num + c.qty + c.val + c.refs, base, fit([l.footprint, l.lcsc].filter(Boolean).join("  "), s - 0.4, false, (c.fp - 0.5) * PT), s - 0.4, { color: SOFT, raw: true });
      else if (r.n === 1 && l.footprint) {
        // two columns: the footprint after the value when there is room
        var vw = textW(fit(val, s, true, (c.val - 1.5) * PT), s, true) / PT;
        if (vw < c.val - 8) page.text(x + c.box + c.num + c.qty + vw + 1.2, base, fit(l.footprint, s - 1, false, (c.val - vw - 2.5) * PT), s - 1, { color: SOFT, raw: true });
      }
      y += h;
      page.line(x, y, x + L.cw, y, RULE, 0.15);
    });
  }

  I.zip = zip;
  I.sheet = sheet;
})(window);
