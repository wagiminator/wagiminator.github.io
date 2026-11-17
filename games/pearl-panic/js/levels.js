/* Pearl Panic: the worlds and levels. Every level has one or two tracks – a curve the pearls
   roll along from their start to the giant clam – and a spot for the pufferfish. */
"use strict";

(function (PP) {
  const { U } = PP;
  const TAU = Math.PI * 2;

  /* ---------- track shapes (lists of points) ---------- */
  const P = (PP.Paths = {});
  // spiral from radius r0 to r1, starting at angle a0, turning dir (+1 clockwise on screen)
  P.spiral = (cx, cy, r0, r1, turns, a0 = 0, dir = 1, sx = 1, sy = 1) => {
    const pts = [], n = Math.ceil(turns * 220);
    for (let i = 0; i <= n; i++) {
      const f = i / n, a = a0 + dir * f * turns * TAU, r = r0 + (r1 - r0) * f;
      pts.push([cx + Math.cos(a) * r * sx, cy + Math.sin(a) * r * sy]);
    }
    return pts;
  };
  // a snake of horizontal runs joined by half circles
  P.snake = (rows, x0, x1, y0, dy, fromRight = false, lead = 80) => {
    const pts = [];
    let dir = fromRight ? -1 : 1;
    const start = fromRight ? x1 + lead : x0 - lead;
    pts.push([start, y0]);
    for (let r = 0; r < rows; r++) {
      const y = y0 + r * dy, xa = dir > 0 ? x0 : x1, xb = dir > 0 ? x1 : x0;
      for (let k = 0; k <= 40; k++) pts.push([xa + (xb - xa) * (k / 40), y]);
      if (r < rows - 1) {
        const cx = xb, cy = y + dy / 2, rad = dy / 2;
        for (let k = 1; k < 40; k++) { const a = -Math.PI / 2 + (k / 40) * Math.PI; pts.push([cx + dir * Math.cos(a) * rad, cy + Math.sin(a) * rad]); }
      }
      dir = -dir;
    }
    return pts;
  };
  // a smooth curve through control points (Catmull-Rom)
  P.curve = (ctrl) => {
    const pts = [];
    for (let i = 0; i < ctrl.length - 1; i++) {
      const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
      for (let k = 0; k < 30; k++) {
        const t = k / 30, t2 = t * t, t3 = t2 * t;
        pts.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
      }
    }
    pts.push(ctrl[ctrl.length - 1]);
    return pts;
  };
  // a rounded rectangle spiral
  P.rectSpiral = (cx, cy, w0, h0, step, loops, corner = 60) => {
    const ctrl = [];
    let w = w0, h = h0;
    ctrl.push([cx - w / 2 - 120, cy - h / 2]);
    for (let l = 0; l < loops; l++) {
      ctrl.push([cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2 + step / 2, cy + h / 2]);
      w -= step; h -= step;
      ctrl.push([cx - w / 2, cy - h / 2 + step / 4]);
    }
    return P.rounded(ctrl, corner);
  };
  // a polyline with rounded corners
  P.rounded = (ctrl, rad) => {
    const pts = [ctrl[0]];
    for (let i = 1; i < ctrl.length - 1; i++) {
      const [ax, ay] = ctrl[i - 1], [bx, by] = ctrl[i], [cx, cy] = ctrl[i + 1];
      const l1 = Math.hypot(bx - ax, by - ay), l2 = Math.hypot(cx - bx, cy - by), r = Math.min(rad, l1 / 2, l2 / 2);
      const p = [bx - ((bx - ax) / l1) * r, by - ((by - ay) / l1) * r], q = [bx + ((cx - bx) / l2) * r, by + ((cy - by) / l2) * r];
      pts.push(p);
      for (let k = 1; k < 12; k++) { const t = k / 12, u = 1 - t; pts.push([u * u * p[0] + 2 * u * t * bx + t * t * q[0], u * u * p[1] + 2 * u * t * by + t * t * q[1]]); }
      pts.push(q);
    }
    pts.push(ctrl[ctrl.length - 1]);
    return pts;
  };
  // a spiral with a wavy rim, like a starfish or a flower
  P.flower = (cx, cy, r0, r1, turns, petals, amp, a0 = 0, dir = 1, sx = 1, sy = 1) => {
    const pts = [], n = Math.ceil(turns * 260);
    for (let i = 0; i <= n; i++) {
      const f = i / n, a = a0 + dir * f * turns * TAU, r = (r0 + (r1 - r0) * f) * (1 + amp * Math.sin(petals * a));
      pts.push([cx + Math.cos(a) * r * sx, cy + Math.sin(a) * r * sy]);
    }
    return pts;
  };
  P.heart = (cx, cy, s, turns = 1.0) => {
    const pts = [];
    const n = Math.round(400 * turns);
    for (let i = 0; i <= n; i++) {
      const t = Math.PI + (i / n) * TAU * turns, k = 1 - (i / n) * 0.42 * turns;
      const x = 16 * Math.sin(t) ** 3, y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      pts.push([cx + x * s * k, cy + y * s * k]);
    }
    return pts;
  };
  P.reverse = (pts) => pts.slice().reverse();
  // lead-in from off screen to the first point
  P.lead = (pts, from) => [from].concat(pts);

  /* ---------- worlds ---------- */
  PP.WORLDS = [
    { id: "reef", name: "Coral Reef", song: "reef", sky: ["#3cc8e8", "#0a6fa0"], sand: "#f2d9a0", groove: ["#d98a64", "#a85a3a"], deco: "coral" },
    { id: "kelp", name: "Kelp Forest", song: "kelp", sky: ["#2aa890", "#0a4a50"], sand: "#c8c08a", groove: ["#6a8a4a", "#3e5a2a"], deco: "kelp" },
    { id: "ruins", name: "Sunken Ruins", song: "ruins", sky: ["#3a7ab8", "#0e2e58"], sand: "#c8b898", groove: ["#9a8a7a", "#5e5246"], deco: "ruins" },
    { id: "abyss", name: "The Abyss", song: "abyss", sky: ["#123050", "#02060e"], sand: "#3a3a52", groove: ["#4a4a7a", "#24244a"], deco: "abyss" },
  ];

  /* ---------- levels ---------- */
  const L = [];
  const lv = (o) => L.push(Object.assign({ powers: 0.035, speed: 40 }, o));
  const W0 = 0, W1 = 1, W2 = 2, W3 = 3;

  // Coral Reef
  lv({ world: W0, name: "Shallow Spiral", colors: 4, speed: 34, shooter: [640, 380], tracks: [{ pts: () => P.lead(P.spiral(640, 380, 330, 120, 1.55, Math.PI, 1, 1.75, 1), [-60, 380]), count: 55 }] });
  lv({ world: W0, name: "Sea Snake", colors: 4, speed: 36, shooter: [640, 625], tracks: [{ pts: () => P.snake(3, 140, 1140, 120, 150), count: 60 }] });
  lv({ world: W0, name: "Lagoon Ring", colors: 4, speed: 38, shooter: [640, 390], tracks: [{ pts: () => P.lead(P.spiral(640, 390, 300, 170, 1.15, -Math.PI / 2, -1, 1.9, 1), [1340, 90]), count: 65 }] });
  lv({ world: W0, name: "Starfish Swirl", colors: 5, speed: 34, shooter: [640, 390], tracks: [{ pts: () => P.lead(P.flower(640, 390, 320, 130, 1.4, 5, 0.1, Math.PI, 1, 1.7, 1), [-60, 390]), count: 60 }] });
  lv({ world: W0, name: "Coral Corners", colors: 5, speed: 38, shooter: [640, 400], tracks: [{ pts: () => P.rectSpiral(640, 400, 1080, 560, 190, 1.5), count: 70 }] });

  // Kelp Forest
  lv({ world: W1, name: "Kelp Curls", colors: 5, speed: 44, shooter: [640, 390], tracks: [{ pts: () => P.lead(P.spiral(640, 390, 320, 110, 1.9, 0, -1, 1.8, 1), [1340, 390]), count: 80 }] });
  lv({ world: W1, name: "Swaying Weeds", colors: 5, speed: 44, shooter: [640, 120], tracks: [{ pts: () => P.reverse(P.snake(3, 150, 1130, 260, 150, false)).concat([]), count: 80 }] });
  const zig = [[-60, 110], [470, 110], [490, 230], [110, 240], [100, 360], [460, 370], [470, 480], [140, 500], [150, 615], [470, 620]];
  lv({ world: W1, name: "Twin Currents", colors: 5, speed: 22, shooter: [640, 360], tracks: [
    { pts: () => P.rounded(zig, 60), count: 24 },
    { pts: () => P.rounded(zig.map(([x, y]) => [1280 - x, 720 - y]), 60), count: 24 }] });
  lv({ world: W1, name: "Sea Anemone", colors: 5, speed: 44, shooter: [640, 390], tracks: [{ pts: () => P.lead(P.flower(640, 390, 320, 110, 1.6, 6, 0.08, 0, -1, 1.75, 1), [1340, 390]), count: 80 }] });
  lv({ world: W1, name: "The Thicket", colors: 5, speed: 48, shooter: [640, 400], tracks: [{ pts: () => P.rectSpiral(640, 405, 1120, 600, 170, 2), count: 90 }] });

  // Sunken Ruins
  lv({ world: W2, name: "Temple Steps", colors: 5, speed: 52, shooter: [640, 640], tracks: [{ pts: () => P.snake(4, 130, 1150, 100, 120, true), count: 95 }] });
  lv({ world: W2, name: "Broken Columns", colors: 6, speed: 24, shooter: [640, 390], tracks: [
    { pts: () => P.lead(P.spiral(275, 390, 220, 70, 1.6, Math.PI, 1, 1, 1.15), [-60, 390]), count: 24 },
    { pts: () => P.lead(P.spiral(1005, 390, 220, 70, 1.6, 0, 1, 1, 1.15), [1340, 390]), count: 24 }] });
  lv({ world: W2, name: "Mosaic Spiral", colors: 6, speed: 52, shooter: [640, 390], tracks: [{ pts: () => P.lead(P.spiral(640, 390, 330, 100, 2.1, Math.PI / 2, 1, 1.8, 1), [640, 780]), count: 100 }] });
  lv({ world: W2, name: "Old Aqueduct", colors: 6, speed: 27, shooter: [640, 390], tracks: [
    { pts: () => P.snake(2, 120, 1160, 110, 120, false), count: 28 },
    { pts: () => P.snake(2, 120, 1160, 490, 120, true), count: 28 }] });
  lv({ world: W2, name: "Throne Room", colors: 6, speed: 54, shooter: [640, 410], tracks: [{ pts: () => P.rectSpiral(640, 410, 1140, 600, 150, 2.4, 50), count: 110 }] });

  // The Abyss
  lv({ world: W3, name: "Deep Whirl", colors: 6, speed: 58, shooter: [640, 390], tracks: [{ pts: () => P.lead(P.spiral(640, 390, 340, 95, 2.3, Math.PI, -1, 1.8, 1), [-60, 390]), count: 110 }] });
  lv({ world: W3, name: "Lantern Trail", colors: 6, speed: 50, shooter: [640, 125], tracks: [{ pts: () => P.snake(4, 120, 1160, 250, 125, false), count: 95 }] });
  lv({ world: W3, name: "Two Tides", colors: 6, speed: 34, shooter: [640, 390], tracks: [
    { pts: () => P.lead(P.spiral(640, 390, 330, 150, 0.95, Math.PI, 1, 1.75, 1), [-60, 390]), count: 38 },
    { pts: () => P.lead(P.spiral(640, 390, 330, 150, 0.95, 0, 1, 1.75, 1), [1340, 390]), count: 38 }] });
  lv({ world: W3, name: "Black Star", colors: 6, speed: 56, shooter: [640, 390], tracks: [{ pts: () => P.lead(P.flower(640, 390, 305, 95, 1.9, 5, 0.07, Math.PI, -1, 1.8, 1), [-60, 390]), count: 105 }] });
  lv({ world: W3, name: "The Last Pearl", colors: 6, speed: 62, shooter: [640, 410], tracks: [{ pts: () => P.rectSpiral(640, 410, 1160, 610, 140, 2.7, 50), count: 135 }] });

  PP.LEVELS = L;
})(window.PP);
