/* Pearl Panic: drawing helpers and UI widgets (glassy panels, coral buttons) */
"use strict";

(function (PP) {
  const { U } = PP;
  const D = (PP.D = {});
  D.HEAD = "'Baloo 2', 'Arial Rounded MT Bold', Arial, sans-serif";
  D.FONT = "'Baloo 2', 'Arial Rounded MT Bold', Arial, sans-serif";
  const C = (D.C = {
    ink: "#0b2a3a", paper: "#f4fbff", cream: "#f4fbff", gold: "#ffd65a", red: "#ff6a5a", dim: "#a8d4e4", faint: "#5a8aa0",
    panel: "rgba(10,60,90,0.86)", panelD: "#073248", blue: "#2aa8c8", green: "#3cc88a", coral: "#ff7a5c",
  });

  D.circle = (c, x, y, r, fill, stroke, lw = 3) => {
    c.beginPath(); c.arc(x, y, Math.max(0.1, r), 0, U.TAU);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke && lw) { c.lineWidth = lw; c.strokeStyle = stroke; c.stroke(); }
  };
  D.ellipse = (c, x, y, rx, ry, fill, stroke, lw = 3, rot = 0) => {
    c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, U.TAU);
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
  D.text = (c, s, x, y, size, col = C.paper, align = "left", opt = {}) => {
    c.font = `${opt.weight || (opt.head ? 800 : 600)} ${size}px ${opt.head ? D.HEAD : D.FONT}`;
    c.textAlign = align; c.textBaseline = opt.base || "middle";
    if (opt.lw) { c.lineJoin = "round"; c.lineWidth = opt.lw; c.strokeStyle = opt.oc || C.ink; c.strokeText(s, x, y); }
    c.fillStyle = col; c.fillText(s, x, y);
  };
  D.measure = (c, s, size, weight = 800, head = false) => { c.font = `${weight} ${size}px ${head ? D.HEAD : D.FONT}`; return c.measureText(s).width; };
  D.wrap = (c, s, size, w, weight = 700) => {
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
  D.para = (c, s, x, y, size, w, col = C.paper, lh = 1.3, weight = 700) => {
    const lines = D.wrap(c, s, size, w, weight);
    lines.forEach((l, i) => D.text(c, l, x, y + i * size * lh, size, col, "left", { base: "top", weight }));
    return lines.length * size * lh;
  };
  // a comic panel: thick outline and a hard shadow
  D.panel = (c, x, y, w, h, opt = {}) => {
    D.rr(c, x + 4, y + 6, w, h, 22, "rgba(0,20,40,0.35)", null);
    D.rr(c, x, y, w, h, 22, opt.fill || C.panel, "#bff0ff", 3);
    D.rr(c, x + 6, y + 6, w - 12, h - 12, 17, null, "rgba(255,255,255,0.15)", 2);
    if (opt.title) D.text(c, opt.title, x + w / 2, y + 40, opt.tsize || 36, opt.tcol || C.gold, "center", { head: true, lw: 7 });
  };
  D.button = (c, b, hover, opt = {}) => {
    const dis = opt.disabled, on = opt.on;
    const base = dis ? "#5a7a88" : opt.color || C.coral, text = opt.text || C.paper;
    const press = on || (hover && I_down()) ? 3 : 0;
    D.rr(c, b.x + 4, b.y + 6, b.w, b.h, 14, C.ink, null);
    D.rr(c, b.x + press * 0.5, b.y + press, b.w, b.h, 14, on ? shade(base) : hover && !dis ? light(base) : base, C.ink, 4);
    c.fillStyle = "rgba(255,255,255,0.25)"; c.fillRect(b.x + 12 + press * 0.5, b.y + 7 + press, b.w - 24, 4);
    const size = opt.size || Math.min(30, b.h * 0.5);
    if (b.label) D.text(c, b.label, b.x + b.w / 2 + press * 0.5, b.y + b.h / 2 + 4 + press, size, dis ? "#c8d8e0" : text, "center", { head: true, lw: 5 });
  };
  const I_down = () => PP.Input && PP.Input.mouse.down;
  function mix(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k))));
    return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
  }
  const light = (h) => mix(h, 0.2), shade = (h) => mix(h, -0.2);
  D.mix = mix;
  D.slider = (c, x, y, w, v, label, hover) => {
    D.text(c, label, x, y - 20, 28, C.paper, "left", { head: true, lw: 6 });
    D.rr(c, x, y + 2, w, 12, 6, C.panelD, C.ink, 3);
    D.rr(c, x, y + 2, Math.max(12, w * v), 12, 6, C.gold, C.ink, 3);
    D.circle(c, x + w * v, y + 8, 14, hover ? "#fff" : C.gold, C.ink, 4);
    D.text(c, Math.round(v * 100) + "%", x + w + 28, y + 8, 24, C.paper, "left", { lw: 5 });
  };
  D.hand = (c, x, y) => {
    c.save(); c.translate(x, y);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 22); c.lineTo(6, 17); c.lineTo(10, 26); c.lineTo(14, 24); c.lineTo(10, 15); c.lineTo(17, 15); c.closePath();
    c.fillStyle = "#fff"; c.fill(); c.lineWidth = 2.5; c.strokeStyle = C.ink; c.stroke();
    c.restore();
  };
  D.reticle = (c, x, y, col = "#fff") => {
    c.save(); c.translate(x, y);
    D.circle(c, 0, 0, 13, null, C.ink, 5); D.circle(c, 0, 0, 13, null, col, 2.5);
    for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 2); D.line(c, 9, 0, 19, 0, C.ink, 5); D.line(c, 9, 0, 19, 0, col, 2.5); }
    c.restore();
  };
})(window.PP);
