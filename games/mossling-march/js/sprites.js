/* Mossling March: sprites drawn by code – the mosslings (little round moss sprites with a
   sprout on their head) in every pose, the burrow hatch they come from and the home door. */
"use strict";

(function (ML) {
  const S = (ML.Sprites = {});
  const SZ = 24, AX = 12, AY = 20; // frame size and the anchor (the feet cell), in terrain cells
  const RES = 6; // canvas pixels per cell: smooth even when scaled up
  S.SZ = SZ; S.AX = AX; S.AY = AY;

  const COL = {
    line: "#3a2210", body: "#f39237", shade: "#cf6a22", belly: "#ffcb86", hi: "#ffd9a8",
    eye: "#ffffff", pupil: "#1a1208", stem: "#3c8a2a", leaf: "#78cf48", leafD: "#4c9c32",
    foot: "#6a3a1a", brick: "#d8b070", brickD: "#a57a40", steel: "#9aa0aa", wood: "#8a5a2e",
  };
  const LW = 0.55; // outline width in cells

  /* ---------- drawing parts, in cell units (feet at 0,0, facing right) ---------- */
  function body(c, ox, oy, opt = {}) {
    const cx = ox, cy = -5.4 + oy, rx = opt.rx || 3.7, ry = opt.ry || 3.75;
    c.save();
    c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    c.fillStyle = COL.body; c.fill();
    c.clip();
    // shade on the back, a light belly, a glint on top
    c.fillStyle = COL.shade; c.beginPath(); c.ellipse(cx - rx * 0.9, cy + ry * 0.35, rx * 0.7, ry * 0.95, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = COL.belly; c.beginPath(); c.ellipse(cx + rx * 0.35, cy + ry * 0.62, rx * 0.62, ry * 0.42, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = COL.hi; c.beginPath(); c.ellipse(cx - rx * 0.2, cy - ry * 0.62, rx * 0.36, ry * 0.18, -0.3, 0, Math.PI * 2); c.fill();
    c.restore();
    c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    c.lineWidth = LW; c.strokeStyle = COL.line; c.stroke();
    if (!opt.noEye) eye(c, cx + 1.55 + (opt.look || 0) * 0.5, cy - 0.7, opt);
  }
  function eye(c, x, y, opt) {
    if (opt.shut) {
      c.beginPath(); c.arc(x, y + 0.2, 0.85, Math.PI * 1.1, Math.PI * 1.9); c.lineWidth = 0.45; c.strokeStyle = COL.pupil; c.stroke();
      return;
    }
    c.beginPath(); c.ellipse(x, y, 1.05, 1.3, 0, 0, Math.PI * 2); c.fillStyle = COL.eye; c.fill();
    c.lineWidth = 0.3; c.strokeStyle = COL.line; c.stroke();
    const px = x + 0.3 + (opt.look || 0) * 0.25, py = y + 0.15 + (opt.lookY || 0) * 0.3;
    c.beginPath(); c.arc(px, py, 0.55, 0, Math.PI * 2); c.fillStyle = COL.pupil; c.fill();
    c.beginPath(); c.arc(px + 0.18, py - 0.22, 0.18, 0, Math.PI * 2); c.fillStyle = "#fff"; c.fill();
  }
  function leaf(c, x, y, len, ang, w = 0.55) {
    c.save(); c.translate(x, y); c.rotate(ang);
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(len * 0.5, -len * w, len, 0); c.quadraticCurveTo(len * 0.5, len * w, 0, 0);
    c.fillStyle = COL.leaf; c.fill(); c.lineWidth = 0.35; c.strokeStyle = COL.leafD; c.stroke();
    c.restore();
  }
  // the sprout: a curved stem and two leaves; "big" opens into a leaf umbrella
  function sprout(c, ox, oy, mode, sway = 0) {
    const bx = ox, by = -9 + oy;
    if (mode === "big") {
      c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + 0.6, by - 2.5, bx + sway, by - 4.4); c.lineWidth = 0.6; c.strokeStyle = COL.stem; c.stroke();
      const ty = by - 4.4;
      c.beginPath(); c.moveTo(bx + sway - 6.5, ty + 1.6);
      c.quadraticCurveTo(bx + sway - 5.5, ty - 3.6, bx + sway, ty - 3.8);
      c.quadraticCurveTo(bx + sway + 5.5, ty - 3.6, bx + sway + 6.5, ty + 1.6);
      for (let k = 0; k < 5; k++) { const x0 = bx + sway + 6.5 - k * 2.6; c.quadraticCurveTo(x0 - 1.3, ty + 0.4, x0 - 2.6, ty + 1.6); }
      c.closePath(); c.fillStyle = COL.leaf; c.fill(); c.lineWidth = 0.45; c.strokeStyle = COL.leafD; c.stroke();
      c.beginPath(); for (let k = -2; k <= 2; k++) { c.moveTo(bx + sway, ty - 3.6); c.lineTo(bx + sway + k * 2.6, ty + 1.2); } c.lineWidth = 0.25; c.stroke();
      return;
    }
    const tip = { x: bx + (mode === "back" ? -0.8 : 0.3) + sway, y: by - 2.1 };
    c.beginPath(); c.moveTo(bx, by + 0.3); c.quadraticCurveTo(bx - 0.4, by - 1, tip.x, tip.y); c.lineWidth = 0.6; c.strokeStyle = COL.stem; c.lineCap = "round"; c.stroke();
    if (mode === "up") { leaf(c, tip.x, tip.y, 2.4, -2.1); leaf(c, tip.x, tip.y, 2.4, -1.05); }
    else if (mode === "back") { leaf(c, tip.x, tip.y, 2.5, -2.75); leaf(c, tip.x, tip.y, 2.1, -1.6); }
    else { leaf(c, tip.x, tip.y, 2.5, -2.55); leaf(c, tip.x, tip.y, 2.5, -0.55); }
  }
  function feet(c, a, b, ya = 0, yb = ya) {
    c.fillStyle = COL.foot; c.strokeStyle = COL.line; c.lineWidth = 0.3;
    for (const [x, y] of [[a, ya], [b, yb]]) { c.beginPath(); c.ellipse(x + 0.6, y - 0.5, 1.15, 0.65, 0, 0, Math.PI * 2); c.fill(); c.stroke(); }
  }
  function arm(c, x0, y0, x1, y1) {
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineWidth = 0.75; c.strokeStyle = COL.line; c.lineCap = "round"; c.stroke();
    c.beginPath(); c.arc(x1, y1, 0.55, 0, Math.PI * 2); c.fillStyle = COL.shade; c.fill(); c.lineWidth = 0.3; c.stroke();
  }
  function brick(c, x, y) {
    c.fillStyle = COL.brick; c.fillRect(x, y, 3, 1.6); c.fillStyle = COL.brickD; c.fillRect(x, y + 1, 3, 0.6);
    c.lineWidth = 0.25; c.strokeStyle = COL.line; c.strokeRect(x, y, 3, 1.6);
  }
  function pick(c, hx, hy, ang) {
    c.save(); c.translate(hx, hy); c.rotate(ang);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(4, 0); c.lineWidth = 0.55; c.strokeStyle = COL.wood; c.stroke();
    c.beginPath(); c.moveTo(4, -2); c.quadraticCurveTo(5.1, 0, 4, 2); c.lineWidth = 0.75; c.strokeStyle = COL.steel; c.stroke();
    c.restore();
  }

  // every pose as a list of frames
  const POSES = {
    walk: [0, 1, 2, 3].map((i) => (c) => {
      const bob = i % 2 ? -0.5 : 0;
      const step = [[-2.6, 0.9], [-1.6, 0.0], [-0.6, -0.9], [-1.6, 0.0]][i];
      feet(c, step[0], step[1] + 0.2, i === 1 || i === 3 ? -0.4 : 0, i === 1 || i === 3 ? 0 : -0.3);
      sprout(c, 0, bob, i < 2 ? "" : "back", i < 2 ? 0 : -0.3);
      body(c, 0, bob);
    }),
    fall: [0, 1].map((i) => (c) => {
      feet(c, -2.2, 0.4, -0.3, -0.3);
      arm(c, -3, -7, -4.8, -9.4 - i * 0.6); arm(c, 3, -7, 4.8, -9.4 - i * 0.6);
      sprout(c, 0, 0, "up");
      body(c, 0, 0, { lookY: -1 });
    }),
    float: [0, 1].map((i) => (c) => {
      feet(c, -2.2, 0.4, -0.2, -0.2);
      sprout(c, 0, 0, "big", i ? 0.5 : -0.5);
      arm(c, -3, -7, -1.2, -10); arm(c, 3, -7, 1.2, -10);
      body(c, 0, 0);
    }),
    climb: [0, 1, 2, 3].map((i) => (c) => {
      const up = i % 2 ? -0.7 : 0;
      feet(c, 1.4, 1.4, i < 2 ? 0 : -1.2, i < 2 ? -1.6 : -0.2);
      sprout(c, -0.8, up, "back");
      body(c, -0.8, up, { look: 1, lookY: -1 });
      arm(c, 2.2, -8 + up, 3.4, -10.6 + (i < 2 ? 0 : 1.2)); arm(c, 2.2, -4 + up, 3.4, -3.6 + (i < 2 ? 1 : -0.6));
    }),
    block: [0, 1].map((i) => (c) => {
      feet(c, -3.2, 2, 0, 0);
      sprout(c, 0, 0, "up");
      body(c, 0, 0, { look: -1 });
      arm(c, -3.2, -5.6, -6.2, -6.8 - i * 0.7); arm(c, 3.2, -5.6, 6.2, -6.8 - i * 0.7);
      c.beginPath(); c.moveTo(-0.6, -2.9); c.lineTo(1.6, -3.1); c.lineWidth = 0.4; c.strokeStyle = COL.line; c.stroke();
    }),
    shrug: [0, 1].map((i) => (c) => {
      feet(c, -2.2, 1, 0, 0);
      sprout(c, 0, 0, "");
      body(c, 0, 0, { look: -1 });
      arm(c, -3.2, -5.8, -5.4, -7.8 - i * 0.6); arm(c, 3.2, -5.8, 5.4, -7.8 - i * 0.6);
    }),
    build: [0, 1, 2].map((i) => (c) => {
      const d = i === 1 ? 0.6 : 0;
      feet(c, -2.2, 0.6, 0, 0);
      sprout(c, 0, d, "");
      body(c, 0, d, { lookY: 1 });
      const bx = i === 1 ? 3 : 3.6, by = i === 1 ? -2.2 : -4.2;
      brick(c, bx, by);
      arm(c, 2.6, -5, bx + 0.3, by + 0.8);
    }),
    bash: [0, 1, 2, 3].map((i) => (c) => {
      feet(c, -3.2, 0.2, 0, 0);
      sprout(c, 0, 0, i < 2 ? "back" : "");
      body(c, 0, 0);
      const fx = [3.8, 6.4, 6.6, 5][i], fy = [-9.4, -7.6, -4.4, -2][i];
      arm(c, 2.8, -5.6, fx, fy);
    }),
    mine: [0, 1, 2, 3].map((i) => (c) => {
      const d = i === 2 ? 0.6 : 0;
      feet(c, -3.2, 1, 0, 0);
      sprout(c, 0, d, "back");
      body(c, 0, d, { lookY: 1 });
      const ang = [-1.9, -1.2, 0.5, -0.4][i];
      const hx = 2.8, hy = -5.2 + d;
      pick(c, hx, hy, ang);
      arm(c, 2.2, -5.4 + d, hx + 0.4, hy + 0.2);
    }),
    dig: [0, 1, 2, 3].map((i) => (c) => {
      const d = i % 2 ? 0.7 : 0;
      feet(c, -3.2, 2, 0, 0);
      sprout(c, 0, d, "up");
      body(c, 0, d, { shut: d > 0, lookY: 1 });
      arm(c, -3, -4.4 + d, -4, -1.2 + d); arm(c, 3, -4.4 + d, 4, -1.2 + d);
      if (d) { c.fillStyle = COL.brickD; c.beginPath(); c.arc(-6, -2.6, 0.7, 0, Math.PI * 2); c.arc(6.2, -3.6, 0.6, 0, Math.PI * 2); c.fill(); }
    }),
    exit: [0, 1, 2, 3].map((i) => (c) => {
      const j = [0, -1.6, -2.6, -1][i];
      feet(c, -2.2, 0.6, j, j);
      sprout(c, 0, j, "up");
      body(c, 0, j, { shut: true });
      arm(c, -3, -6.6 + j, -5.2, -9.6 + j); arm(c, 3, -6.6 + j, 5.2, -9.6 + j);
    }),
    splat: [0, 1, 2, 3].map((i) => (c) => {
      c.beginPath(); c.ellipse(0, -0.9, 4.2 + i * 0.8, 1.2, 0, 0, Math.PI * 2); c.fillStyle = COL.body; c.fill(); c.lineWidth = LW; c.strokeStyle = COL.line; c.stroke();
      leaf(c, -1 - i, -2.2 - i, 2.2, -2.4); leaf(c, 1 + i, -3 - i * 1.2, 2.2, -0.8);
    }),
    drown: [0, 1, 2, 3].map((i) => (c) => {
      const d = i * 1.8 + 0.8;
      sprout(c, 0, d, "up");
      body(c, 0, d, { shut: true });
      arm(c, -3, -6.6 + d, -5, -9.4 + i * 0.5); arm(c, 3, -6.6 + d, 5, -9.4 + i * 0.5);
    }),
  };
  S.POSES = POSES;
  const cache = new Map();
  // returns a canvas with the frame (SZ×SZ cells at RES pixels each); the feet cell sits at (AX, AY)
  S.frame = function (pose, n, dir) {
    const list = POSES[pose] || POSES.walk;
    const fi = ((n % list.length) + list.length) % list.length;
    const key = pose + fi + (dir < 0 ? "l" : "r");
    let cv = cache.get(key);
    if (cv) return cv;
    cv = document.createElement("canvas");
    cv.width = SZ * RES; cv.height = SZ * RES;
    const c = cv.getContext("2d");
    c.scale(RES, RES);
    // the feet cell is a whole cell: stand on its bottom edge, centred in it
    c.translate(AX + 0.5, AY + 1);
    if (dir < 0) c.scale(-1, 1);
    c.lineJoin = "round"; c.lineCap = "round";
    list[fi](c);
    cache.set(key, cv);
    return cv;
  };
  S.pose = function (m) {
    switch (m.st) {
      case "walk": return ["walk", m.anim >> 1];
      case "fall": return ["fall", m.anim >> 2];
      case "float": return ["float", m.anim >> 3];
      case "climb": return ["climb", m.anim >> 1];
      case "block": return ["block", m.anim >> 3];
      case "shrug": return ["shrug", m.t >> 2];
      case "build": return ["build", Math.floor((m.t % 6) / 2)];
      case "bash": return ["bash", m.anim];
      case "mine": return ["mine", Math.floor(m.t / 3 * 1.3)];
      case "dig": return ["dig", m.anim >> 1];
      case "exit": return ["exit", m.t >> 1];
      case "splat": return ["splat", Math.min(3, m.t >> 2)];
      case "drown": return ["drown", Math.min(3, m.t >> 2)];
    }
    return ["walk", 0];
  };

  /* ---------- the burrow hatch and the home door ---------- */
  // both drawn as smooth shapes in cell units (anchor: hatch at its mouth, door at its threshold)
  S.hatch = function (c, x, y, open, theme) {
    const INK = "#3a2210";
    c.save(); c.translate(x, y);
    // a hollow log hanging from the top, mouth facing down
    c.lineJoin = "round";
    c.fillStyle = "#6a4322"; c.strokeStyle = INK; c.lineWidth = 0.8;
    rr(c, -15.5, -16.5, 31, 13, 3); c.fill(); c.stroke();
    c.fillStyle = "#8a5a2e"; rr(c, -14.5, -16, 29, 2.5, 1.2); c.fill();
    c.strokeStyle = "#56361b"; c.lineWidth = 0.7; c.lineCap = "round";
    for (let i = -11; i <= 11; i += 5.5) { c.beginPath(); c.moveTo(i, -13); c.quadraticCurveTo(i + 1, -9.5, i, -6); c.stroke(); }
    c.fillStyle = "#4a2e16"; rr(c, -16.5, -6, 33, 3.2, 1.5); c.fill();
    // moss on top
    c.fillStyle = "#5aa03a";
    for (const [mx, r] of [[-10, 2.2], [-6.5, 1.6], [6.5, 2.4], [10.5, 1.5], [-1, 1.8]]) { c.beginPath(); c.ellipse(mx, -16.6, r, r * 0.7, 0, Math.PI, 0); c.fill(); }
    // the two flaps swing down when it opens
    const a = Math.min(1, open), len = 13;
    c.fillStyle = "#8a5a2e"; c.strokeStyle = INK; c.lineWidth = 0.5;
    c.save(); c.translate(-13, -3); c.rotate(a * 1.35); rr(c, 0, -0.2, len, 2.2, 1); c.fill(); c.stroke(); c.restore();
    c.save(); c.translate(13, -3); c.rotate(-a * 1.35); rr(c, -len, -0.2, len, 2.2, 1); c.fill(); c.stroke(); c.restore();
    if (a > 0.3) { c.fillStyle = "rgba(20,10,4,0.75)"; rr(c, -11, -3, 22, 2, 1); c.fill(); }
    c.restore();
  };
  S.door = function (c, x, y, t) {
    c.save(); c.translate(x, y + 1);
    // a mossy mound
    c.fillStyle = "#7a5634"; c.beginPath(); c.ellipse(0, 0, 16.5, 22.5, 0, Math.PI, 0); c.closePath(); c.fill();
    c.strokeStyle = "#3a2210"; c.lineWidth = 0.8; c.stroke();
    c.save(); c.beginPath(); c.ellipse(0, 0, 16.5, 22.5, 0, Math.PI, 0); c.clip();
    c.fillStyle = "#5aa03a"; c.beginPath(); c.ellipse(0, -23, 13, 6, 0, 0, (Math.PI * 2)); c.fill();
    c.fillStyle = "rgba(0,0,0,0.12)";
    for (const [sx, sy, r] of [[-10, -8, 1.6], [9, -12, 1.3], [-6, -15, 1.1], [11, -4, 1.2]]) { c.beginPath(); c.arc(sx, sy, r, 0, (Math.PI * 2)); c.fill(); }
    c.restore();
    // the round door, glowing from inside
    c.fillStyle = "#2a1608"; c.beginPath(); c.ellipse(0, 0, 8.5, 15.5, 0, Math.PI, 0); c.closePath(); c.fill();
    const glow = 0.55 + 0.25 * Math.sin(t * 6) + 0.1 * Math.sin(t * 17);
    const g = c.createRadialGradient(0, -3, 1, 0, -3, 12);
    g.addColorStop(0, `rgba(255,214,120,${glow * 0.8})`); g.addColorStop(1, `rgba(255,170,70,${glow * 0.15})`);
    c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, 6.5, 13.5, 0, Math.PI, 0); c.closePath(); c.fill();
    c.strokeStyle = "#8a5a2e"; c.lineWidth = 1; c.beginPath(); c.ellipse(0, 0, 8.5, 15.5, 0, Math.PI, 0); c.stroke();
    // a lantern on a hook
    c.strokeStyle = "#3a2a1a"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(11, -14); c.lineTo(11, -11); c.stroke();
    c.fillStyle = `rgba(255,${190 + Math.round(glow * 40)},90,1)`; rr(c, 9.2, -11, 3.6, 4.2, 1); c.fill();
    c.fillStyle = `rgba(255,220,120,${glow * 0.3})`; c.beginPath(); c.arc(11, -9, 4.5, 0, (Math.PI * 2)); c.fill();
    c.fillStyle = "#3a2a1a"; rr(c, 8.8, -7, 4.4, 1, 0.4); c.fill();
    c.restore();
  };
  function rr(c, x, y, w, h, r) { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); }
})(window.ML);
