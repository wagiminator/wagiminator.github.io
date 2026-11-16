/* Feather Frenzy: drawing helpers, UI widgets and landscape painting tools */
"use strict";

(function (FF) {
  const { U } = FF;
  const D = (FF.D = {});
  const OUT = "#231a12";
  D.OUT = OUT;
  D.FONT = "'Lilita One', 'Arial Black', sans-serif";
  D.FONT2 = "Nunito, 'Arial Rounded MT Bold', Arial, sans-serif";

  /* ---------- primitives ---------- */
  D.circle = (c, x, y, r, fill, stroke = OUT, lw = 3) => {
    c.beginPath(); c.arc(x, y, Math.max(0.1, r), 0, U.TAU);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke && lw) { c.lineWidth = lw; c.strokeStyle = stroke; c.stroke(); }
  };
  D.ellipse = (c, x, y, rx, ry, fill, stroke = OUT, lw = 3, rot = 0) => {
    c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, U.TAU);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke && lw) { c.lineWidth = lw; c.strokeStyle = stroke; c.stroke(); }
  };
  D.rr = (c, x, y, w, h, r, fill, stroke = OUT, lw = 3) => {
    c.beginPath();
    if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke && lw) { c.lineWidth = lw; c.strokeStyle = stroke; c.stroke(); }
  };
  D.poly = (c, pts, fill, stroke = OUT, lw = 3) => {
    c.beginPath(); c.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
    c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke && lw) { c.lineWidth = lw; c.strokeStyle = stroke; c.lineJoin = "round"; c.stroke(); }
  };
  D.line = (c, x0, y0, x1, y1, col = OUT, lw = 3) => {
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineWidth = lw; c.strokeStyle = col; c.lineCap = "round"; c.stroke();
  };
  D.stem = (c, x0, y0, x1, y1, w = 7, col = "#4f9a2c") => {
    c.lineCap = "round";
    c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2 + 6, (y0 + y1) / 2, x1, y1);
    c.lineWidth = w + 5; c.strokeStyle = OUT; c.stroke();
    c.lineWidth = w; c.strokeStyle = col; c.stroke();
  };
  D.leaf = (c, x, y, len, wid, ang, fill = "#5cb83a") => {
    c.save(); c.translate(x, y); c.rotate(ang);
    c.beginPath(); c.moveTo(0, 0);
    c.quadraticCurveTo(len * 0.5, -wid, len, 0); c.quadraticCurveTo(len * 0.5, wid, 0, 0);
    c.fillStyle = fill; c.fill(); c.lineWidth = 2.5; c.strokeStyle = OUT; c.stroke();
    c.beginPath(); c.moveTo(2, 0); c.lineTo(len * 0.8, 0); c.lineWidth = 1.5; c.strokeStyle = "rgba(20,50,10,0.45)"; c.stroke();
    c.restore();
  };
  // cartoon eyes looking to the right (plants) or left (zombies)
  D.eyes = (c, x, y, s, dir = 1, opt = {}) => {
    const gap = s * 1.25;
    for (let i = 0; i < 2; i++) {
      const ex = x + (i - 0.5) * gap;
      if (opt.closed) { D.line(c, ex - s * 0.5, y, ex + s * 0.5, y, OUT, 2.5); continue; }
      D.ellipse(c, ex, y, s * 0.55, s * 0.7, "#fff", OUT, 2);
      D.circle(c, ex + dir * s * 0.18 + (opt.lx || 0), y + (opt.ly || 0), s * 0.28, opt.pupil || "#111", null, 0);
    }
    if (opt.angry) { D.line(c, x - gap, y - s * 0.95, x - gap * 0.1, y - s * 0.55, OUT, 3); D.line(c, x + gap, y - s * 0.95, x + gap * 0.1, y - s * 0.55, OUT, 3); }
  };
  D.shadow = (c, x, y, w = 34, a = 0.25) => { c.fillStyle = `rgba(0,0,0,${a})`; c.beginPath(); c.ellipse(x, y, w, w * 0.28, 0, 0, U.TAU); c.fill(); };

  D.text = (c, s, x, y, size, col = "#fff", align = "center", opt = {}) => {
    c.font = `${opt.weight || ""} ${size}px ${opt.font || D.FONT}`;
    c.textAlign = align; c.textBaseline = opt.base || "middle";
    if (opt.outline !== false) {
      c.lineJoin = "round"; c.lineWidth = opt.lw || Math.max(3, size * 0.16); c.strokeStyle = opt.oc || "#24170c";
      c.strokeText(s, x, y);
    }
    c.fillStyle = col; c.fillText(s, x, y);
  };
  D.para = (c, s, x, y, w, size, col = "#2a2a1a", lh = 1.28, font = D.FONT2) => {
    c.font = `700 ${size}px ${font}`; c.textAlign = "left"; c.textBaseline = "top"; c.fillStyle = col;
    let line = "", yy = y;
    for (const para of String(s).split("\n")) {
      line = "";
      for (const word of para.split(" ")) {
        const test = line ? line + " " + word : word;
        if (c.measureText(test).width > w && line) { c.fillText(line, x, yy); yy += size * lh; line = word; }
        else line = test;
      }
      c.fillText(line, x, yy); yy += size * lh;
    }
    return yy;
  };

  /* ---------- UI widgets ---------- */
  // wooden sign button; returns true if hovered
  D.button = (c, b, hover, opt = {}) => {
    const { x, y, w, h } = b;
    const col = opt.disabled ? "#7d776a" : opt.color || "#3f6e3a";
    c.save();
    if (hover && !opt.disabled) { c.translate(x + w / 2, y + h / 2); c.scale(1.04, 1.04); c.translate(-(x + w / 2), -(y + h / 2)); }
    D.rr(c, x + 3, y + 5, w, h, 12, "rgba(0,0,0,0.32)", null, 0);
    D.rr(c, x, y, w, h, 12, col, "#1f160c", 3);
    D.rr(c, x + 5, y + 5, w - 10, h - 10, 8, null, hover && !opt.disabled ? "#ffe9a8" : "rgba(255,240,200,0.45)", 2);
    D.text(c, b.label, x + w / 2, y + h / 2 + 2, opt.size || Math.min(30, h * 0.5), opt.disabled ? "#d8d2c4" : "#fff6dc");
    c.restore();
  };
  D.panel = (c, x, y, w, h, col = "#f6ecd2") => {
    D.rr(c, x + 5, y + 8, w, h, 18, "rgba(0,0,0,0.35)", null, 0);
    D.rr(c, x, y, w, h, 18, "#7b2b25", OUT, 4);
    // tartan border
    c.save(); c.beginPath(); c.roundRect ? c.roundRect(x + 3, y + 3, w - 6, h - 6, 15) : c.rect(x, y, w, h); c.clip();
    c.globalAlpha = 0.35; c.fillStyle = "#2c4a2a";
    for (let i = x - h; i < x + w; i += 22) { c.fillRect(i, y, 6, h); }
    for (let j = y; j < y + h; j += 22) { c.fillRect(x, j, w, 6); }
    c.restore();
    D.rr(c, x + 12, y + 12, w - 24, h - 24, 12, col, "#5d2a17", 2.5);
  };

  /* ---------- landscape painting ---------- */
  // a ridge line from the sum of a few sine waves; fills down to the bottom
  D.ridge = function (c, x0, x1, base, amp, seed, fill, opt = {}) {
    const r = U.rng(seed), ph = [r() * 9, r() * 9, r() * 9], fr = [0.0021 + r() * 0.001, 0.0057 + r() * 0.002, 0.013 + r() * 0.004];
    const yAt = (x) => base - amp * (0.55 * Math.sin(x * fr[0] + ph[0]) + 0.3 * Math.sin(x * fr[1] + ph[1]) + 0.15 * Math.sin(x * fr[2] + ph[2]));
    c.beginPath(); c.moveTo(x0, opt.bottom || U.H);
    for (let x = x0; x <= x1 + 8; x += 8) c.lineTo(x, yAt(x));
    c.lineTo(x1, opt.bottom || U.H); c.closePath();
    c.fillStyle = fill; c.fill();
    if (opt.edge) { c.lineWidth = opt.edgeW || 3; c.strokeStyle = opt.edge; c.stroke(); }
    return yAt;
  };
  D.vgrad = (c, x, y, w, h, stops) => { const g = c.createLinearGradient(0, y, 0, y + h); stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s)); c.fillStyle = g; c.fillRect(x, y, w, h); };
  D.pine = function (c, x, y, h, col = "#2f5a34", snow) {
    c.fillStyle = "#5a3d24"; c.fillRect(x - h * 0.035, y - h * 0.18, h * 0.07, h * 0.2);
    const tiers = 4;
    for (let i = 0; i < tiers; i++) {
      const ty = y - h * 0.15 - i * h * 0.2, w = h * (0.34 - i * 0.065);
      c.beginPath(); c.moveTo(x - w, ty); c.lineTo(x, ty - h * 0.38); c.lineTo(x + w, ty); c.closePath();
      c.fillStyle = col; c.fill();
      c.beginPath(); c.moveTo(x, ty - h * 0.38); c.lineTo(x + w, ty); c.lineTo(x + w * 0.2, ty); c.closePath();
      c.fillStyle = "rgba(0,0,0,0.15)"; c.fill();
      if (snow) { c.beginPath(); c.moveTo(x - w * 0.55, ty - h * 0.12); c.lineTo(x, ty - h * 0.38); c.lineTo(x + w * 0.55, ty - h * 0.12); c.quadraticCurveTo(x, ty - h * 0.2, x - w * 0.55, ty - h * 0.12); c.fillStyle = snow; c.fill(); }
    }
  };
  D.tree = function (c, x, y, r, col = "#4f8a3a", trunk = "#5b3b22", seed = 1) {
    c.fillStyle = trunk;
    c.beginPath(); c.moveTo(x - r * 0.12, y); c.lineTo(x - r * 0.08, y - r * 1.2); c.lineTo(x + r * 0.08, y - r * 1.2); c.lineTo(x + r * 0.14, y); c.fill();
    const rnd = U.rng(seed);
    const blobs = [];
    for (let i = 0; i < 7; i++) blobs.push([x + (rnd() - 0.5) * r * 1.3, y - r * 1.5 + (rnd() - 0.5) * r * 0.9, r * (0.45 + rnd() * 0.3)]);
    for (const [bx, by, br] of blobs) { c.beginPath(); c.arc(bx, by, br, 0, U.TAU); c.fillStyle = col; c.fill(); }
    for (const [bx, by, br] of blobs) { c.beginPath(); c.arc(bx - br * 0.25, by - br * 0.3, br * 0.5, 0, U.TAU); c.fillStyle = "rgba(255,255,200,0.12)"; c.fill(); }
  };
  D.cloud = function (c, x, y, s, col = "rgba(255,255,255,0.9)") {
    c.fillStyle = col;
    for (const [dx, dy, r] of [[0, 0, 40], [38, -14, 34], [74, 2, 36], [30, 14, 34], [-34, 10, 28]]) { c.beginPath(); c.arc(x + dx * s, y + dy * s, r * s, 0, U.TAU); c.fill(); }
  };
  D.tufts = function (c, x0, x1, y0, y1, col, seed, n = 60, h = 14) {
    const r = U.rng(seed);
    c.strokeStyle = col; c.lineWidth = 2; c.lineCap = "round";
    for (let i = 0; i < n; i++) {
      const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), k = 0.6 + (y - y0) / Math.max(1, y1 - y0) * 0.8;
      c.beginPath();
      for (let j = -1; j <= 1; j++) { c.moveTo(x + j * 3 * k, y); c.quadraticCurveTo(x + j * 5 * k, y - h * 0.6 * k, x + j * 7 * k, y - h * k); }
      c.stroke();
    }
  };
  D.dots = function (c, x0, x1, y0, y1, cols, seed, n, r0 = 2, r1 = 4) {
    const r = U.rng(seed);
    for (let i = 0; i < n; i++) { c.fillStyle = cols[i % cols.length]; c.beginPath(); c.arc(x0 + r() * (x1 - x0), y0 + r() * (y1 - y0), r0 + r() * (r1 - r0), 0, U.TAU); c.fill(); }
  };
  D.rock = function (c, x, y, w, h, col = "#8a8a84") {
    c.beginPath(); c.moveTo(x - w / 2, y); c.quadraticCurveTo(x - w / 2, y - h, x - w * 0.1, y - h); c.quadraticCurveTo(x + w / 2, y - h * 1.05, x + w / 2, y); c.closePath();
    c.fillStyle = col; c.fill();
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + w * 0.45, y - h * 0.9, x + w / 2, y); c.fillStyle = "rgba(0,0,0,0.15)"; c.fill();
  };
  D.bush = function (c, x, y, r, col = "#4a7d34") {
    for (const [dx, dy, k] of [[-0.6, 0, 0.6], [0.6, 0, 0.62], [0, -0.35, 0.75], [-0.25, 0.05, 0.7], [0.3, -0.05, 0.7]]) { c.beginPath(); c.arc(x + dx * r, y - r * 0.5 + dy * r, r * k, 0, U.TAU); c.fillStyle = col; c.fill(); }
    c.beginPath(); c.arc(x - r * 0.2, y - r * 0.85, r * 0.35, 0, U.TAU); c.fillStyle = "rgba(255,255,210,0.12)"; c.fill();
  };
  D.house = function (c, x, y, w, h, wall, roof, o = {}) {
    c.fillStyle = wall; c.fillRect(x, y - h, w, h);
    c.fillStyle = "rgba(0,0,0,0.12)"; c.fillRect(x + w * 0.7, y - h, w * 0.3, h);
    c.beginPath(); c.moveTo(x - w * 0.08, y - h); c.lineTo(x + w / 2, y - h - w * (o.pitch || 0.45)); c.lineTo(x + w * 1.08, y - h); c.closePath(); c.fillStyle = roof; c.fill();
    if (o.windows !== false) {
      c.fillStyle = o.lit ? "#ffd970" : "#3a4a5a";
      const n = Math.max(1, Math.floor(w / 46));
      for (let i = 0; i < n; i++) c.fillRect(x + (i + 0.5) * (w / n) - 9, y - h * 0.72, 18, 20);
    }
    if (o.door) { c.fillStyle = "#4a2e1a"; c.fillRect(x + w * 0.42, y - h * 0.42, w * 0.16, h * 0.42); }
  };
  D.fence = function (c, x0, x1, y, h = 40, col = "#8a6440") {
    c.fillStyle = col;
    for (let x = x0; x < x1; x += 46) c.fillRect(x, y - h, 8, h);
    c.fillRect(x0, y - h * 0.8, x1 - x0, 6); c.fillRect(x0, y - h * 0.38, x1 - x0, 6);
  };
  D.crosshair = function (c, x, y, s, t, col = "#fff") {
    c.save(); c.translate(x, y);
    c.lineWidth = 4; c.strokeStyle = "rgba(0,0,0,0.6)";
    c.beginPath(); c.arc(0, 0, 22 * s, 0, U.TAU); c.moveTo(-34 * s, 0); c.lineTo(-10 * s, 0); c.moveTo(34 * s, 0); c.lineTo(10 * s, 0); c.moveTo(0, -34 * s); c.lineTo(0, -10 * s); c.moveTo(0, 34 * s); c.lineTo(0, 10 * s); c.stroke();
    c.lineWidth = 2; c.strokeStyle = col; c.stroke();
    c.fillStyle = "#ff3a2a"; c.beginPath(); c.arc(0, 0, 2.5, 0, U.TAU); c.fill();
    c.restore();
  };
  D.hand = (c, x, y) => { D.poly(c, [x, y, x + 6, y + 22, x + 11, y + 16, x + 18, y + 28, x + 23, y + 25, x + 16, y + 13, x + 24, y + 11], "#fff", "#000", 2); };
  D.shell = function (c, x, y, s = 1, spent) {
    c.save(); c.translate(x, y); c.scale(s, s);
    D.rr(c, -9, -30, 18, 40, 4, spent ? "#5a2a24" : "#c8322a", OUT, 2);
    D.rr(c, -10, 8, 20, 12, 3, spent ? "#6a5a30" : "#e3b23c", OUT, 2);
    if (!spent) D.rr(c, -6, -26, 4, 30, 2, "rgba(255,255,255,0.3)", null, 0);
    c.restore();
  };
})(window.FF);
