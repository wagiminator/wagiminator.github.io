/* Mossling March: drawing helpers and UI widgets (wooden boards, leafy buttons) */
"use strict";

(function (ML) {
  const { U } = ML;
  const D = (ML.D = {});
  D.FONT = "Fredoka, 'Arial Rounded MT Bold', Arial, sans-serif";
  const C = (D.C = {
    cream: "#fff3d6", ink: "#2b1a0e", wood: "#7a4e2c", woodD: "#5a361c", woodL: "#9a6a3e",
    leaf: "#5fae3a", leafD: "#3d7d24", leafL: "#8fd463", gold: "#ffd34a", red: "#e8553a", dim: "#d8c4a0", faint: "#8a7558", sky: "#7ec8f0",
  });

  D.circle = (c, x, y, r, fill, stroke, lw = 3) => {
    c.beginPath(); c.arc(x, y, Math.max(0.1, r), 0, U.TAU);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke && lw) { c.lineWidth = lw; c.strokeStyle = stroke; c.stroke(); }
  };
  D.rr = (c, x, y, w, h, r, fill, stroke, lw = 3) => {
    c.beginPath();
    if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke && lw) { c.lineWidth = lw; c.strokeStyle = stroke; c.stroke(); }
  };
  D.line = (c, x0, y0, x1, y1, col, lw = 3) => { c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineWidth = lw; c.strokeStyle = col; c.lineCap = "round"; c.stroke(); };
  D.text = (c, s, x, y, size, col = C.cream, align = "left", opt = {}) => {
    c.font = `${opt.weight || 600} ${size}px ${D.FONT}`;
    c.textAlign = align; c.textBaseline = opt.base || "middle";
    if (opt.lw) { c.lineJoin = "round"; c.lineWidth = opt.lw; c.strokeStyle = opt.oc || C.ink; c.strokeText(s, x, y); }
    c.fillStyle = col; c.fillText(s, x, y);
  };
  D.measure = (c, s, size, weight = 600) => { c.font = `${weight} ${size}px ${D.FONT}`; return c.measureText(s).width; };
  D.wrap = (c, s, size, w, weight = 500) => {
    c.font = `${weight} ${size}px ${D.FONT}`;
    const out = [];
    for (const para of String(s).split("\n")) {
      let line = "";
      for (const word of para.split(" ")) {
        const t = line ? line + " " + word : word;
        if (c.measureText(t).width > w && line) { out.push(line); line = word; } else line = t;
      }
      out.push(line);
    }
    return out;
  };
  D.para = (c, s, x, y, size, w, col = C.cream, lh = 1.32, weight = 500) => {
    const lines = D.wrap(c, s, size, w, weight);
    lines.forEach((l, i) => D.text(c, l, x, y + i * size * lh, size, col, "left", { base: "top", weight }));
    return lines.length * size * lh;
  };

  // a wooden board with planks and nails
  D.board = (c, x, y, w, h, opt = {}) => {
    D.rr(c, x + 4, y + 6, w, h, 16, "rgba(0,0,0,0.3)", null);
    D.rr(c, x, y, w, h, 16, C.wood, C.ink, 4);
    c.save(); c.beginPath(); if (c.roundRect) c.roundRect(x + 2, y + 2, w - 4, h - 4, 14); else c.rect(x, y, w, h); c.clip();
    for (let py = y + 34; py < y + h; py += 34) D.line(c, x, py, x + w, py, "rgba(40,20,8,0.35)", 2);
    for (let py = y + 4; py < y + h; py += 34) { c.fillStyle = "rgba(255,220,170,0.08)"; c.fillRect(x, py, w, 10); }
    c.restore();
    for (const [nx, ny] of [[x + 14, y + 14], [x + w - 14, y + 14], [x + 14, y + h - 14], [x + w - 14, y + h - 14]]) D.circle(c, nx, ny, 3.5, "#c9b28a", C.ink, 1.5);
    if (opt.title) D.text(c, opt.title, x + w / 2, y + 34, opt.tsize || 30, C.cream, "center", { weight: 700, lw: 6 });
  };
  D.button = (c, b, hover, opt = {}) => {
    const dis = opt.disabled, on = opt.on;
    const base = dis ? "#8a8070" : opt.color || C.leaf, dark = dis ? "#6a6050" : opt.dark || C.leafD;
    const press = on ? 3 : 0;
    D.rr(c, b.x, b.y + 5, b.w, b.h, Math.min(16, b.h / 2.6), dark, C.ink, 3);
    D.rr(c, b.x, b.y + press, b.w, b.h - 2, Math.min(16, b.h / 2.6), on ? dark : hover && !dis ? "#79c94f" : base, C.ink, 3);
    if (!on) { c.fillStyle = "rgba(255,255,255,0.18)"; c.fillRect(b.x + 10, b.y + 5, b.w - 20, 5); }
    const size = opt.size || Math.min(28, b.h * 0.48);
    if (b.label) D.text(c, b.label, b.x + b.w / 2, b.y + b.h / 2 + press, size, dis ? "#c8c0b0" : C.cream, "center", { weight: 700, lw: 5 });
  };
  D.slider = (c, x, y, w, v, label, hover) => {
    D.text(c, label, x, y - 18, 24, C.cream, "left", { weight: 700, lw: 5 });
    D.rr(c, x, y + 2, w, 12, 6, C.woodD, C.ink, 3);
    D.rr(c, x, y + 2, Math.max(12, w * v), 12, 6, C.leaf, C.ink, 3);
    D.circle(c, x + w * v, y + 8, 14, hover ? "#ffe680" : C.gold, C.ink, 3);
    D.text(c, Math.round(v * 100) + "%", x + w + 28, y + 8, 22, C.cream, "left", { weight: 700, lw: 5 });
  };
  // pointer for keyboard and gamepad
  D.hand = (c, x, y) => {
    c.save(); c.translate(x, y);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 22); c.lineTo(6, 17); c.lineTo(10, 26); c.lineTo(14, 24); c.lineTo(10, 15); c.lineTo(17, 15); c.closePath();
    c.fillStyle = "#fff"; c.fill(); c.lineWidth = 2.5; c.strokeStyle = C.ink; c.stroke();
    c.restore();
  };
  // the selection frame of the play field
  D.crosshair = (c, x, y, hot) => {
    const k = hot ? 15 : 12, q = 6;
    c.strokeStyle = hot ? "#ffffff" : "rgba(255,255,255,0.85)"; c.lineWidth = hot ? 3 : 2;
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      c.beginPath(); c.moveTo(x + sx * k, y + sy * (k - q)); c.lineTo(x + sx * k, y + sy * k); c.lineTo(x + sx * (k - q), y + sy * k); c.stroke();
    }
    if (!hot) { c.fillStyle = "#fff"; c.fillRect(x - 1, y - 1, 2, 2); }
  };
})(window.ML);
