/* Garden Siege: drawing helpers, backgrounds (day, night, pool, fog, roof), common sprites */
"use strict";

(function (GS) {
  const { U } = GS;
  const D = (GS.D = {});
  const OUT = "#22301a";
  D.OUT = OUT;
  D.FONT = "'Luckiest Guy', 'Arial Black', sans-serif";
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
      c.lineJoin = "round"; c.lineWidth = opt.lw || Math.max(3, size * 0.16); c.strokeStyle = opt.oc || "#1d2a10";
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
    const col = opt.color || (opt.disabled ? "#9a9a8a" : "#6fbf3a");
    c.save();
    if (hover && !opt.disabled) { c.translate(x + w / 2, y + h / 2); c.scale(1.05, 1.05); c.translate(-(x + w / 2), -(y + h / 2)); }
    D.rr(c, x + 3, y + 5, w, h, 14, "rgba(0,0,0,0.3)", null, 0);
    D.rr(c, x, y, w, h, 14, col, OUT, 3.5);
    D.rr(c, x + 5, y + 4, w - 10, h * 0.42, 10, "rgba(255,255,255,0.22)", null, 0);
    D.text(c, b.label, x + w / 2, y + h / 2 + 2, opt.size || Math.min(30, h * 0.5), opt.disabled ? "#e8e8dc" : "#fff");
    c.restore();
  };
  D.panel = (c, x, y, w, h, col = "#f5ead0") => {
    D.rr(c, x + 5, y + 8, w, h, 22, "rgba(0,0,0,0.35)", null, 0);
    D.rr(c, x, y, w, h, 22, "#8a5a2b", OUT, 4);
    D.rr(c, x + 10, y + 10, w - 20, h - 20, 16, col, "#5d3a17", 2.5);
  };

  /* ---------- small sprites ---------- */
  D.sun = (c, x, y, r, t, small) => {
    c.save(); c.translate(x, y); c.rotate(t * 0.8);
    const g = c.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.5);
    g.addColorStop(0, "rgba(255,240,120,0.9)"); g.addColorStop(1, "rgba(255,200,40,0)");
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, r * 1.5, 0, U.TAU); c.fill();
    for (let i = 0; i < 10; i++) {
      c.rotate(U.TAU / 10);
      D.poly(c, [r * 0.75, -r * 0.18, r * 1.25, 0, r * 0.75, r * 0.18], "#ffcf2e", "#d98a10", 1.5);
    }
    c.restore();
    D.circle(c, x, y, r * 0.78, "#ffe14a", "#e09a12", 2.5);
    D.circle(c, x - r * 0.22, y - r * 0.22, r * 0.25, "rgba(255,255,255,0.55)", null, 0);
    if (small) D.circle(c, x, y, r * 0.3, "#fff6b0", null, 0);
  };
  D.coin = (c, x, y, kind, t) => {
    if (kind === "diamond") {
      const s = 16;
      D.poly(c, [x, y - s, x + s, y - s * 0.2, x, y + s * 1.1, x - s, y - s * 0.2], "#8ff0ff", "#1d6f8a", 2.5);
      D.poly(c, [x - s * 0.5, y - s * 0.55, x + s * 0.5, y - s * 0.55, x, y + s * 0.8], "rgba(255,255,255,0.45)", null, 0);
      return;
    }
    const w = Math.abs(Math.cos(t * 3)) * 15 + 3;
    D.ellipse(c, x, y, w, 15, kind === "gold" ? "#ffd23a" : "#d9dde2", kind === "gold" ? "#9a6a00" : "#5c6670", 2.5);
    if (w > 8) D.text(c, "$", x, y + 1, 16, kind === "gold" ? "#b07a00" : "#6c7680", "center", { outline: false });
  };
  D.shovel = (c, x, y, s = 1) => {
    c.save(); c.translate(x, y); c.rotate(-0.6); c.scale(s, s);
    D.rr(c, -4, -38, 8, 46, 3, "#a0632c", OUT, 2.5);
    D.rr(c, -10, -46, 20, 10, 4, "#7b4a1d", OUT, 2.5);
    D.poly(c, [-14, 6, 14, 6, 12, 28, 0, 36, -12, 28], "#c8ced6", OUT, 2.5);
    c.restore();
  };
  D.hand = (c, x, y) => {
    D.poly(c, [x, y, x + 6, y + 22, x + 11, y + 16, x + 18, y + 28, x + 23, y + 25, x + 16, y + 13, x + 24, y + 11], "#fff", "#000", 2);
  };

  /* ---------- backgrounds ---------- */
  const bgCache = {};
  D.background = function (c, area, rows) {
    const key = area + rows;
    if (!bgCache[key]) {
      const cv = document.createElement("canvas");
      cv.width = U.W; cv.height = U.H;
      buildBg(cv.getContext("2d"), area, rows);
      bgCache[key] = cv;
    }
    c.drawImage(bgCache[key], 0, 0);
  };

  function house(c, night) {
    // the player's house on the left
    c.fillStyle = night ? "#3c3a52" : "#e9d9b4";
    c.fillRect(0, 70, 150, 650);
    c.fillStyle = night ? "#2b2a3d" : "#c9b48c";
    for (let y = 90; y < 720; y += 26) c.fillRect(0, y, 150, 3);
    D.rr(c, 30, 300, 90, 160, 6, night ? "#232232" : "#7a4b25", OUT, 3);
    D.circle(c, 104, 385, 5, "#e8c040", OUT, 2);
    D.rr(c, 20, 140, 110, 90, 6, night ? "#ffe9a0" : "#a8d8f0", OUT, 3);
    D.line(c, 75, 140, 75, 230, OUT, 3); D.line(c, 20, 185, 130, 185, OUT, 3);
    c.fillStyle = night ? "#29273a" : "#b44a35";
    c.beginPath(); c.moveTo(-20, 80); c.lineTo(75, 0); c.lineTo(170, 80); c.closePath(); c.fill();
    c.fillStyle = night ? "#3e3a55" : "#9a7e5a";
    c.fillRect(150, 70, 14, 650);
  }

  function buildBg(c, area, rows) {
    const night = area === "night" || area === "fog";
    const G0 = GS.Geo.get(rows, area);
    // sky / backdrop
    const sky = c.createLinearGradient(0, 0, 0, 200);
    if (night) { sky.addColorStop(0, "#141a3a"); sky.addColorStop(1, "#2c3a5e"); }
    else { sky.addColorStop(0, "#7ec8f0"); sky.addColorStop(1, "#cfeefb"); }
    c.fillStyle = sky; c.fillRect(0, 0, U.W, U.H);
    if (night) {
      const r = U.rng(7);
      for (let i = 0; i < 70; i++) { c.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.6})`; c.fillRect(r() * U.W, r() * 120, 2, 2); }
      D.circle(c, 1150, 55, 30, "#fff6d0", null, 0);
      D.circle(c, 1138, 48, 28, "#2a375a", null, 0);
    }
    if (area === "roof") {
      // the roof: sloped shingles
      c.fillStyle = "#8d4b33"; c.fillRect(0, 100, U.W, 620);
      for (let r = 0; r < rows; r++) {
        for (let col = 0; col < 9; col++) {
          const x = G0.x0 + col * G0.cw, y = G0.y0 + r * G0.ch;
          c.fillStyle = (r + col) % 2 ? "#a8583a" : "#9a4f33";
          c.fillRect(x, y, G0.cw, G0.ch);
          c.fillStyle = "rgba(0,0,0,0.12)";
          for (let k = 0; k < 4; k++) c.fillRect(x, y + k * (G0.ch / 4), G0.cw, 3);
        }
      }
      c.fillStyle = "#6a3524"; c.fillRect(0, 100, U.W, 34);
      c.fillStyle = "#c7c1b5"; c.fillRect(G0.x0 - 40, G0.y0 - 20, 20, rows * G0.ch + 20);
      // chimney
      D.rr(c, 1190, 40, 60, 110, 4, "#9e5a3f", OUT, 3);
      for (let k = 0; k < 4; k++) D.line(c, 1190, 62 + k * 22, 1250, 62 + k * 22, "#6a3524", 2);
      return;
    }
    // ground
    c.fillStyle = night ? "#1f3d24" : "#5aa83a";
    c.fillRect(0, 100, U.W, 620);
    // street on the right
    c.fillStyle = night ? "#2a2d33" : "#7d8085";
    c.fillRect(1175, 100, 105, 620);
    c.fillStyle = night ? "#3b3e45" : "#a2a5a9";
    for (let y = 120; y < 720; y += 60) c.fillRect(1222, y, 8, 30);
    // fence behind
    for (let x = 160; x < 1175; x += 26) {
      D.rr(c, x, 92, 20, 46, 4, night ? "#5a5770" : "#f4efe0", night ? "#2a2838" : "#9c9480", 2);
    }
    // lawn tiles
    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < 9; col++) {
        const x = G0.x0 + col * G0.cw, y = G0.y0 + r * G0.ch;
        const water = G0.water[r];
        if (water) {
          const g = c.createLinearGradient(0, y, 0, y + G0.ch);
          g.addColorStop(0, night ? "#1b4a78" : "#3fa6e0"); g.addColorStop(1, night ? "#123659" : "#2a86c4");
          c.fillStyle = g; c.fillRect(x, y, G0.cw, G0.ch);
          c.strokeStyle = night ? "rgba(140,200,255,0.25)" : "rgba(255,255,255,0.35)"; c.lineWidth = 2;
          for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(x + 20 + k * 30, y + 25 + (k % 2) * 40, 12, 0.2, 2.6); c.stroke(); }
        } else {
          const light = (r + col) % 2 === 0;
          c.fillStyle = night ? (light ? "#2e5a32" : "#28502c") : (light ? "#77c447" : "#6ab63e");
          c.fillRect(x, y, G0.cw, G0.ch);
          c.fillStyle = night ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.07)";
          const r2 = U.rng(r * 31 + col * 7 + 3);
          for (let k = 0; k < 7; k++) c.fillRect(x + r2() * 90, y + r2() * (G0.ch - 10), 3, 9);
        }
      }
    }
    if (G0.water.some((w) => w)) {
      // pool rim
      const r0 = G0.water.indexOf(true), r1 = G0.water.lastIndexOf(true);
      c.strokeStyle = "#e9edf0"; c.lineWidth = 8;
      c.strokeRect(G0.x0 - 4, G0.y0 + r0 * G0.ch - 4, 9 * G0.cw + 8, (r1 - r0 + 1) * G0.ch + 8);
    }
    // path to the house
    c.fillStyle = night ? "#3a3428" : "#c8a874";
    c.fillRect(164, 100, G0.x0 - 164, 620);
    house(c, night);
  }

  D.fog = function (c, G, t) {
    // fog over the right part of the lawn, holes around lanterns
    if (!G.fogCols || G.fogClear > 0) return;
    const geo = G.geo, x0 = geo.x0 + (9 - G.fogCols) * geo.cw, y0 = geo.y0 - 6, h = U.H - y0;
    c.save();
    c.beginPath();
    c.rect(x0 - 90, y0, U.W - x0 + 90, h);
    for (const p of G.plants) if (p.def.id === "lantern" && !p.dead) { c.moveTo(p.x + 160, p.y - 40); c.arc(p.x, p.y - 40, 160, 0, U.TAU, true); }
    c.clip("evenodd");
    const g = c.createLinearGradient(x0 - 90, 0, x0 + 30, 0);
    g.addColorStop(0, "rgba(190,200,220,0)"); g.addColorStop(1, "rgba(190,200,220,0.66)");
    c.fillStyle = g; c.fillRect(x0 - 90, y0, U.W - x0 + 90, h);
    for (let i = 0; i < 24; i++) {
      const x = x0 + ((i * 97 + t * 14) % (U.W - x0 + 40)) - 10, y = y0 + 40 + ((i * 53) % (h - 60));
      D.circle(c, x, y, 70 + (i % 4) * 18, "rgba(215,222,236,0.35)", null, 0);
    }
    c.restore();
  };

  D.grave = (c, x, y) => {
    D.rr(c, x - 28, y - 72, 56, 74, 22, "#8b8f99", OUT, 3);
    D.line(c, x - 12, y - 48, x + 12, y - 48, "#5d6270", 4); D.line(c, x, y - 60, x, y - 30, "#5d6270", 4);
    c.fillStyle = "#4a3a2a"; c.fillRect(x - 34, y - 4, 68, 8);
  };
  D.crater = (c, x, y, a) => {
    D.ellipse(c, x, y - 20, 44, 18, `rgba(40,25,10,${0.7 * a})`, null, 0);
    D.ellipse(c, x, y - 22, 34, 12, `rgba(15,8,2,${0.8 * a})`, null, 0);
  };
  D.mower = (c, x, y, kind) => {
    if (kind === "pool") {
      D.rr(c, x - 30, y - 34, 60, 30, 8, "#e04040", OUT, 3);
      D.ellipse(c, x, y - 6, 36, 10, "#ffffff", OUT, 3);
      D.line(c, x + 10, y - 34, x + 26, y - 56, OUT, 4);
      return;
    }
    if (kind === "roof") {
      D.rr(c, x - 30, y - 36, 54, 28, 6, "#5b6cff", OUT, 3);
      D.rr(c, x - 36, y - 14, 70, 10, 4, "#cfd3da", OUT, 3);
      return;
    }
    D.rr(c, x - 34, y - 34, 56, 26, 6, "#d83a2c", OUT, 3);
    D.circle(c, x - 22, y - 6, 10, "#333", OUT, 2.5); D.circle(c, x + 14, y - 6, 10, "#333", OUT, 2.5);
    D.line(c, x - 30, y - 34, x - 48, y - 66, OUT, 5); D.line(c, x - 30, y - 34, x - 48, y - 66, "#ccc", 2);
    D.rr(c, x - 22, y - 46, 30, 14, 4, "#555", OUT, 2.5);
  };
  D.vase = (c, x, y, kind) => {
    const col = kind === "plant" ? "#7fc7ff" : kind === "zombie" ? "#9a8fa8" : "#d9a464";
    D.ellipse(c, x, y - 44, 32, 40, col, OUT, 3);
    D.rr(c, x - 16, y - 92, 32, 14, 4, col, OUT, 3);
    D.line(c, x - 20, y - 60, x + 20, y - 60, "rgba(0,0,0,0.25)", 3);
    if (kind === "plant") D.text(c, "?", x, y - 44, 28, "#fff");
  };
  D.brain = (c, x, y) => {
    D.ellipse(c, x, y, 26, 20, "#f4a6b5", OUT, 3);
    for (let i = -1; i <= 1; i++) D.line(c, x + i * 9, y - 14, x + i * 7, y + 14, "#c96a80", 2);
  };
  D.packetFrame = (c, x, y, w, h, enabled) => {
    D.rr(c, x, y, w, h, 7, enabled ? "#f2e6b7" : "#bcb39a", "#5a4520", 2.5);
    D.rr(c, x + 4, y + 4, w - 8, h - 26, 5, enabled ? "#a7d97b" : "#8f9f84", null, 0);
  };
})(window.GS);
