/* Starlane Command: drawing helpers, tactical display style, UI widgets */
"use strict";

(function (SL) {
  const { U } = SL;
  const D = (SL.D = {});
  D.FONT = "Rajdhani, 'Arial Narrow', Arial, sans-serif";
  D.LOGO = "Orbitron, 'Arial Black', Arial, sans-serif";

  // the palette of the tactical display
  const C = (D.C = {
    bg0: "#03070d", bg1: "#0a1424", grid: "rgba(90,140,200,0.07)", grid2: "rgba(90,140,200,0.13)",
    lane: "rgba(130,170,215,0.28)", text: "#d6e6f5", dim: "#7f93aa", faint: "#4a5c70",
    panel: "rgba(8,16,28,0.92)", panelEdge: "#2a4a6a", accent: "#59d2ff", warn: "#ff5a5a", ok: "#7dff9a", gold: "#ffd36a",
    neutral: "#8a96a6",
  });
  // player colours: you, then the opponents
  D.OWNER = ["#4fd4ff", "#ff5468", "#ffad33", "#b87dff"];
  D.OWNER_DARK = ["#0f3d52", "#4d1520", "#4d3210", "#35204f"];
  D.OWNER_NAME = ["Blue Command", "Red Hegemony", "Amber Syndicate", "Violet Covenant"];
  D.col = (o) => (o >= 0 ? D.OWNER[SL.G && SL.G.s ? SL.G.colIdx(o) : o] : C.neutral);
  D.ownerName = (o) => (o >= 0 ? D.OWNER_NAME[SL.G && SL.G.s ? SL.G.colIdx(o) : o] : "Independent");
  D.rgba = (hex, a) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  };

  /* ---------- primitives ---------- */
  D.circle = (c, x, y, r, fill, stroke, lw = 2) => {
    c.beginPath(); c.arc(x, y, Math.max(0.1, r), 0, U.TAU);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke && lw) { c.lineWidth = lw; c.strokeStyle = stroke; c.stroke(); }
  };
  D.arc = (c, x, y, r, a0, a1, col, lw = 2) => {
    c.beginPath(); c.arc(x, y, r, a0, a1); c.lineWidth = lw; c.strokeStyle = col; c.stroke();
  };
  D.line = (c, x0, y0, x1, y1, col, lw = 2) => {
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineWidth = lw; c.strokeStyle = col; c.stroke();
  };
  D.rect = (c, x, y, w, h, fill, stroke, lw = 1.5) => {
    if (fill) { c.fillStyle = fill; c.fillRect(x, y, w, h); }
    if (stroke) { c.lineWidth = lw; c.strokeStyle = stroke; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); }
  };
  // a box with cut corners, the frame of all panels and buttons
  D.chamfer = (c, x, y, w, h, k, fill, stroke, lw = 1.5) => {
    c.beginPath();
    c.moveTo(x + k, y); c.lineTo(x + w, y); c.lineTo(x + w, y + h - k); c.lineTo(x + w - k, y + h);
    c.lineTo(x, y + h); c.lineTo(x, y + k); c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.lineWidth = lw; c.strokeStyle = stroke; c.stroke(); }
  };
  D.text = (c, s, x, y, size, col = C.text, align = "left", opt = {}) => {
    c.font = `${opt.weight || 600} ${size}px ${opt.font || D.FONT}`;
    c.textAlign = align; c.textBaseline = opt.base || "middle";
    if (opt.spacing && "letterSpacing" in c) c.letterSpacing = opt.spacing + "px";
    if (opt.glow) { c.shadowColor = opt.glow; c.shadowBlur = opt.blur || 12; }
    c.fillStyle = col; c.fillText(s, x, y);
    c.shadowBlur = 0;
    if (opt.spacing && "letterSpacing" in c) c.letterSpacing = "0px";
  };
  D.measure = (c, s, size, weight = 600, font = D.FONT) => { c.font = `${weight} ${size}px ${font}`; return c.measureText(s).width; };
  // wrap text into lines that fit a width
  D.wrap = (c, s, size, w, weight = 600) => {
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
  D.para = (c, s, x, y, size, w, col = C.text, lh = 1.3, weight = 600) => {
    const lines = D.wrap(c, s, size, w, weight);
    lines.forEach((l, i) => D.text(c, l, x, y + i * size * lh, size, col, "left", { base: "top", weight }));
    return lines.length * size * lh;
  };

  /* ---------- the tactical background: grid, faint stars, vignette ---------- */
  let bgCache = null;
  D.background = (c, W, H, t = 0) => {
    if (!bgCache) {
      const cv = document.createElement("canvas");
      cv.width = W; cv.height = H;
      const g = cv.getContext("2d");
      const gr = g.createRadialGradient(W * 0.45, H * 0.45, 50, W * 0.45, H * 0.5, W * 0.8);
      gr.addColorStop(0, C.bg1); gr.addColorStop(1, C.bg0);
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      const rnd = U.rng(7);
      for (let i = 0; i < 260; i++) {
        const a = rnd() * 0.5 + 0.1, r = rnd() < 0.08 ? 1.4 : 0.8;
        g.fillStyle = `rgba(200,220,255,${a})`;
        g.beginPath(); g.arc(rnd() * W, rnd() * H, r, 0, U.TAU); g.fill();
      }
      g.lineWidth = 1;
      for (let x = 0; x <= W; x += 40) { g.strokeStyle = x % 200 === 0 ? C.grid2 : C.grid; g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, H); g.stroke(); }
      for (let y = 0; y <= H; y += 40) { g.strokeStyle = y % 200 === 0 ? C.grid2 : C.grid; g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(W, y + 0.5); g.stroke(); }
      const vg = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.72);
      vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.6)");
      g.fillStyle = vg; g.fillRect(0, 0, W, H);
      bgCache = cv;
    }
    c.drawImage(bgCache, 0, 0);
    // a slow sweep line, as on a plotting table
    const sx = ((t * 40) % (W + 400)) - 200;
    const sg = c.createLinearGradient(sx - 160, 0, sx, 0);
    sg.addColorStop(0, "rgba(80,180,255,0)"); sg.addColorStop(1, "rgba(80,180,255,0.05)");
    c.fillStyle = sg; c.fillRect(sx - 160, 0, 160, H);
  };

  /* ---------- system icons ---------- */
  // ind: shipyard, res: mining, rep: repair dock, out: outpost, ruin: destroyed
  D.sysIcon = (c, type, x, y, r, col) => {
    c.save(); c.translate(x, y);
    c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 2; c.lineJoin = "round"; c.lineCap = "round";
    const s = r * 0.5;
    if (type === "ind") {
      // shipyard: a hull in a dock frame
      c.beginPath(); c.moveTo(-s, s * 0.9); c.lineTo(-s, -s * 0.5); c.lineTo(-s * 0.4, -s * 0.9); c.lineTo(s * 0.4, -s * 0.9); c.lineTo(s, -s * 0.5); c.lineTo(s, s * 0.9); c.stroke();
      c.beginPath(); c.moveTo(0, -s * 0.55); c.lineTo(s * 0.42, s * 0.55); c.lineTo(-s * 0.42, s * 0.55); c.closePath(); c.fill();
    } else if (type === "res") {
      // mining: a crystal
      c.beginPath(); c.moveTo(0, -s); c.lineTo(s * 0.75, -s * 0.2); c.lineTo(0, s); c.lineTo(-s * 0.75, -s * 0.2); c.closePath(); c.stroke();
      c.beginPath(); c.moveTo(-s * 0.75, -s * 0.2); c.lineTo(s * 0.75, -s * 0.2); c.moveTo(0, -s); c.lineTo(0, s); c.lineWidth = 1.2; c.stroke();
    } else if (type === "rep") {
      // repair dock: a cross in a ring
      c.lineWidth = 3;
      c.beginPath(); c.moveTo(-s * 0.7, 0); c.lineTo(s * 0.7, 0); c.moveTo(0, -s * 0.7); c.lineTo(0, s * 0.7); c.stroke();
    } else if (type === "ruin") {
      c.lineWidth = 2;
      c.beginPath(); c.moveTo(-s * 0.6, -s * 0.6); c.lineTo(s * 0.6, s * 0.6); c.moveTo(s * 0.6, -s * 0.6); c.lineTo(-s * 0.6, s * 0.6); c.stroke();
    } else {
      c.beginPath(); c.arc(0, 0, s * 0.35, 0, U.TAU); c.fill();
    }
    c.restore();
  };

  /* ---------- fleets: a triangle with a stripe that names the role ----------
     battle: stripe near the tip, siege: across the middle, invasion: at the base */
  D.fleet = (c, x, y, s, ang, type, col, opt = {}) => {
    c.save(); c.translate(x, y); c.rotate(ang);
    const tip = s, back = -s * 0.75, half = s * 0.72;
    c.beginPath(); c.moveTo(tip, 0); c.lineTo(back, half); c.lineTo(back, -half); c.closePath();
    c.fillStyle = opt.dark || "rgba(5,12,22,0.9)"; c.fill();
    c.lineWidth = opt.lw || 2; c.strokeStyle = col; c.stroke();
    // stripe position along the hull (fraction from the tip)
    const f = type === "B" ? 0.28 : type === "S" ? 0.55 : 0.84;
    const sx = tip + (back - tip) * f, sh = half * (1 - (1 - f) * 0) * f;
    c.beginPath(); c.moveTo(sx, -sh); c.lineTo(sx, sh); c.lineWidth = Math.max(2, s * 0.28); c.stroke();
    if (opt.sel) {
      c.beginPath(); c.arc(0, 0, s * 1.45, 0, U.TAU); c.lineWidth = 1.5; c.setLineDash([3, 3]); c.stroke(); c.setLineDash([]);
    }
    c.restore();
  };

  /* ---------- widgets ---------- */
  D.panel = (c, x, y, w, h, opt = {}) => {
    D.chamfer(c, x, y, w, h, opt.k || 12, opt.fill || C.panel, opt.edge || C.panelEdge, 1.5);
    if (opt.title) {
      D.text(c, opt.title, x + 14, y + 18, opt.tsize || 16, opt.tcol || C.accent, "left", { weight: 700, spacing: 2 });
      D.line(c, x + 12, y + 32, x + w - 12, y + 32, "rgba(89,210,255,0.25)", 1);
    }
  };
  D.button = (c, b, hover, opt = {}) => {
    const dis = opt.disabled, on = opt.on;
    const col = dis ? C.faint : opt.color || C.accent;
    const fill = on ? D.rgba(col, 0.28) : hover && !dis ? D.rgba(col, 0.16) : "rgba(10,22,38,0.85)";
    D.chamfer(c, b.x, b.y, b.w, b.h, Math.min(10, b.h * 0.25), fill, col, hover && !dis ? 2.2 : 1.5);
    const size = opt.size || Math.min(26, b.h * 0.46);
    let tx = b.x + b.w / 2;
    if (b.icon) {
      const iw = size * 1.1;
      const lw = b.label ? D.measure(c, b.label, size, 700) : 0;
      const ix = b.label ? tx - (lw + iw + 6) / 2 + iw / 2 : tx;
      b.icon(c, ix, b.y + b.h / 2, size * 0.5, dis ? C.faint : hover || on ? "#fff" : col);
      tx = ix + iw / 2 + 6 + lw / 2;
    }
    if (b.label) D.text(c, b.label, tx, b.y + b.h / 2 + 1, size, dis ? C.faint : hover || on ? "#fff" : C.text, "center", { weight: 700, spacing: 1 });
    if (b.sub) D.text(c, b.sub, b.x + b.w / 2, b.y + b.h - 11, 13, dis ? C.faint : C.dim, "center");
  };
  D.bar = (c, x, y, w, h, f, col, back = "rgba(255,255,255,0.08)") => {
    c.fillStyle = back; c.fillRect(x, y, w, h);
    c.fillStyle = col; c.fillRect(x, y, w * U.clamp(f, 0, 1), h);
  };
  D.slider = (c, x, y, w, v, label, hover) => {
    D.text(c, label, x, y - 18, 20, C.text);
    D.line(c, x, y + 8, x + w, y + 8, C.faint, 4);
    D.line(c, x, y + 8, x + w * v, y + 8, C.accent, 4);
    D.chamfer(c, x + w * v - 9, y - 4, 18, 24, 5, hover ? "#fff" : C.accent, null);
    D.text(c, Math.round(v * 100) + "%", x + w + 18, y + 8, 18, C.dim);
  };
  // pointer for keyboard and gamepad: a targeting reticle
  D.cursor = (c, x, y) => {
    c.save(); c.translate(x, y);
    c.strokeStyle = "#fff"; c.lineWidth = 2;
    for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 2); c.beginPath(); c.moveTo(6, 0); c.lineTo(14, 0); c.stroke(); }
    c.beginPath(); c.arc(0, 0, 2, 0, U.TAU); c.fillStyle = "#fff"; c.fill();
    c.restore();
  };
  // small UI icons
  D.icons = {
    pause: (c, x, y, r, col) => { c.fillStyle = col; c.fillRect(x - r * 0.7, y - r, r * 0.5, r * 2); c.fillRect(x + r * 0.2, y - r, r * 0.5, r * 2); },
    play: (c, x, y, r, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(x - r * 0.6, y - r); c.lineTo(x + r, y); c.lineTo(x - r * 0.6, y + r); c.closePath(); c.fill(); },
    ff: (c, x, y, r, col) => { c.fillStyle = col; for (const o of [-0.55, 0.45]) { c.beginPath(); c.moveTo(x + (o - 0.5) * r, y - r * 0.85); c.lineTo(x + (o + 0.5) * r, y); c.lineTo(x + (o - 0.5) * r, y + r * 0.85); c.closePath(); c.fill(); } },
    shield: (c, x, y, r, col) => { c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r * 0.85, y - r * 0.55); c.quadraticCurveTo(x + r * 0.8, y + r * 0.6, x, y + r); c.quadraticCurveTo(x - r * 0.8, y + r * 0.6, x - r * 0.85, y - r * 0.55); c.closePath(); c.stroke(); },
    station: (c, x, y, r, col) => { c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r * 0.45, 0, U.TAU); c.stroke(); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; D.line(c, x + Math.cos(a) * r * 0.45, y + Math.sin(a) * r * 0.45, x + Math.cos(a) * r, y + Math.sin(a) * r, col, 2); } },
    raze: (c, x, y, r, col) => { c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.stroke(); },
    send: (c, x, y, r, col) => { c.strokeStyle = col; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x - r, y); c.lineTo(x + r * 0.8, y); c.moveTo(x + r * 0.2, y - r * 0.6); c.lineTo(x + r * 0.85, y); c.lineTo(x + r * 0.2, y + r * 0.6); c.stroke(); },
    half: (c, x, y, r, col) => { c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r * 0.85, 0, U.TAU); c.stroke(); c.fillStyle = col; c.beginPath(); c.arc(x, y, r * 0.85, -Math.PI / 2, Math.PI / 2); c.fill(); },
    off: (c, x, y, r, col) => { c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r * 0.8, 0, U.TAU); c.moveTo(x - r * 0.55, y + r * 0.55); c.lineTo(x + r * 0.55, y - r * 0.55); c.stroke(); },
    fleetB: (c, x, y, r, col) => D.fleet(c, x, y, r * 0.95, -Math.PI / 2, "B", col, { lw: 1.6 }),
    fleetS: (c, x, y, r, col) => D.fleet(c, x, y, r * 0.95, -Math.PI / 2, "S", col, { lw: 1.6 }),
    fleetI: (c, x, y, r, col) => D.fleet(c, x, y, r * 0.95, -Math.PI / 2, "I", col, { lw: 1.6 }),
  };
})(window.SL);
