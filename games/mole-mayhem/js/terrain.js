/* Mole Mayhem: the island – generated from noise, textured by code, carved by every blast */
"use strict";

(function (MM) {
  const { U } = MM;
  const T = (MM.T = {});
  T.W = 2400; T.H = 1000; T.SEA = 930;

  const THEMES = (T.THEMES = {
    meadow: { name: "Meadow", top: [[106, 190, 70], [86, 166, 56]], body: [[150, 100, 60], [126, 84, 50], [170, 116, 70]], edge: [70, 46, 28], stone: [140, 134, 126],
      sky: ["#6fb8ec", "#cfeaff"], far: "#a7cfe8", mid: "#86b98a", water: ["#2d7cc4", "#1d5a96"], girder: [180, 70, 50] },
    desert: { name: "Desert", top: [[236, 196, 112], [222, 178, 96]], body: [[204, 146, 84], [186, 128, 72], [216, 160, 96]], edge: [118, 74, 40], stone: [170, 120, 80],
      sky: ["#f2a65a", "#ffe6b0"], far: "#f4c890", mid: "#d8a066", water: ["#2a9aa8", "#1a6e7a"], girder: [90, 90, 110] },
    arctic: { name: "Arctic", top: [[244, 250, 255], [222, 236, 250]], body: [[150, 180, 214], [130, 160, 198], [170, 198, 228]], edge: [70, 96, 130], stone: [110, 130, 160],
      sky: ["#8ab4e8", "#eef6ff"], far: "#cfe0f4", mid: "#a9c4e2", water: ["#3a7ab8", "#22507e"], girder: [200, 60, 60] },
    volcano: { name: "Volcano", top: [[90, 80, 84], [70, 62, 66]], body: [[60, 52, 56], [48, 42, 46], [74, 64, 66]], edge: [22, 18, 20], stone: [120, 60, 40],
      sky: ["#3a1820", "#c2502a"], far: "#6a2a28", mid: "#4a2224", water: ["#e0581e", "#a8300c"], girder: [160, 160, 170], lava: true },
  });

  function hash(x, y, s) {
    let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function vnoise(x, y, sc, s) {
    const fx = x / sc, fy = y / sc, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
    const a = hash(ix, iy, s), b = hash(ix + 1, iy, s), c = hash(ix, iy + 1, s), d = hash(ix + 1, iy + 1, s);
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
  }
  T.vnoise = vnoise;
  const rgb = (r, g, b) => (255 << 24) | (Math.max(0, Math.min(255, b | 0)) << 16) | (Math.max(0, Math.min(255, g | 0)) << 8) | Math.max(0, Math.min(255, r | 0));

  /* ---------- generation ---------- */
  T.generate = function (opt) {
    const w = T.W, h = T.H, seed = opt.seed || 1;
    const t = { w, h, solid: new Uint8Array(w * h), theme: THEMES[opt.theme] || THEMES.meadow, themeId: opt.theme, seed };
    const S = t.solid;
    const style = opt.style || "islands";
    // a height profile: two or three islands, sometimes joined
    const top = new Float32Array(w);
    let land = 0;
    for (let x = 0; x < w; x++) {
      const n = vnoise(x, 0, 480, seed) * 0.6 + vnoise(x, 3, 160, seed + 1) * 0.3 + vnoise(x, 5, 50, seed + 2) * 0.1;
      // fade out at both sides so the island ends in the sea
      let edge = Math.min(1, x / 260, (w - x) / 260);
      edge = edge * edge * (3 - 2 * edge);
      let height = (0.18 + n * 0.82) * 470 * edge;
      if (style === "islands") { const g = vnoise(x, 9, 620, seed + 3); if (g < 0.3) height -= (0.3 - g) * 2400; }
      // rough edges everywhere
      height += (vnoise(x, 7, 26, seed + 4) - 0.5) * 46 + (vnoise(x, 8, 9, seed + 5) - 0.5) * 12;
      top[x] = T.SEA - 30 - height;
      if (top[x] < T.SEA - 40) land++;
    }
    // too much sea: try the next seed
    if (land < w * 0.62 && (opt.tries || 0) < 12) return T.generate(Object.assign({}, opt, { seed: seed + 101, tries: (opt.tries || 0) + 1 }));
    for (let x = 0; x < w; x++) {
      const y0 = Math.max(60, Math.round(top[x]));
      for (let y = y0; y < h; y++) S[y * w + x] = 1;
    }
    // caves and holes
    for (let y = 80; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!S[i]) continue;
      const depth = y - top[x];
      if (depth < 26) continue;
      const n = vnoise(x, y, 70, seed + 7) * 0.7 + vnoise(x, y, 23, seed + 8) * 0.3;
      if (n > 0.66 - Math.min(0.06, depth / 4000)) S[i] = 0;
    }
    // a few floating rocks
    const rnd = U.rng(seed * 13 + 5);
    const floats = style === "floating" ? 10 : 3;
    for (let k = 0; k < floats; k++) {
      const cx = 200 + rnd() * (w - 400), cy = 160 + rnd() * 360, rx = 40 + rnd() * 90, ry = 14 + rnd() * 26;
      for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + (vnoise(x, y, 18, seed + 11) - 0.5) * 0.6;
        if (d < 1 && x >= 0 && x < w && y >= 0 && y < h) S[y * w + x] = 1;
      }
    }
    removeSpecks(t, 400);
    // canvas
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    t.cv = cv; t.ctx = cv.getContext("2d");
    t.img = t.ctx.createImageData(w, h);
    t.px = new Uint32Array(t.img.data.buffer);
    paintAll(t);
    t.ctx.putImageData(t.img, 0, 0);
    t.dirty = null;
    return t;
  };
  // drop tiny loose bits that would look odd
  function removeSpecks(t, min) {
    const { w, h, solid: S } = t, seen = new Uint8Array(w * h), stack = new Int32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      if (!S[i] || seen[i]) continue;
      let sp = 0, n = 0; const list = [];
      stack[sp++] = i; seen[i] = 1;
      while (sp) {
        const j = stack[--sp]; n++; if (n <= min) list.push(j);
        const x = j % w, y = (j / w) | 0;
        if (x > 0 && S[j - 1] && !seen[j - 1]) { seen[j - 1] = 1; stack[sp++] = j - 1; }
        if (x < w - 1 && S[j + 1] && !seen[j + 1]) { seen[j + 1] = 1; stack[sp++] = j + 1; }
        if (y > 0 && S[j - w] && !seen[j - w]) { seen[j - w] = 1; stack[sp++] = j - w; }
        if (y < h - 1 && S[j + w] && !seen[j + w]) { seen[j + w] = 1; stack[sp++] = j + w; }
      }
      if (n < min) for (const j of list) S[j] = 0;
    }
  }
  function colourAt(t, x, y) {
    const w = t.w, S = t.solid, i = y * w + x, m = S[i];
    if (!m) return 0;
    const th = t.theme, s = t.seed;
    if (m === 2) {
      // girder: a riveted beam
      const g = th.girder, k = (y % 8 === 0 || y % 8 === 7) ? 0.7 : (x % 10 === 5 && y % 8 === 3) ? 1.3 : 1;
      return rgb(g[0] * k, g[1] * k, g[2] * k);
    }
    // outline where the ground meets air
    const air = (xx, yy) => xx < 0 || xx >= w || yy < 0 || yy >= t.h || !S[yy * w + xx];
    if (air(x - 1, y) || air(x + 1, y) || air(x, y - 1) || air(x, y + 1)) { const e = th.edge; return rgb(e[0], e[1], e[2]); }
    let depth = 0;
    while (depth < 9 && !air(x, y - depth - 1)) depth++;
    const n = hash(x, y, s), n2 = vnoise(x, y, 7, s + 3);
    if (depth < 8) {
      const c = th.top[(n2 > 0.5) | 0], k = depth < 2 ? 1.08 : depth > 6 ? 0.82 : 1;
      return rgb(c[0] * k, c[1] * k, c[2] * k);
    }
    if (n > 0.985 || vnoise(x, y, 14, s + 21) > 0.82) { const st = th.stone, k = 0.85 + n2 * 0.3; return rgb(st[0] * k, st[1] * k, st[2] * k); }
    const band = vnoise(x * 0.3, y, 9, s + 9);
    const c = th.body[band < 0.33 ? 0 : band < 0.66 ? 1 : 2], k = 0.86 + n2 * 0.24;
    return rgb(c[0] * k, c[1] * k, c[2] * k);
  }
  function paintAll(t) { for (let y = 0; y < t.h; y++) for (let x = 0; x < t.w; x++) t.px[y * t.w + x] = colourAt(t, x, y); }
  function repaint(t, x0, y0, x1, y1) {
    x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(t.w - 1, x1); y1 = Math.min(t.h - 1, y1);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) t.px[y * t.w + x] = colourAt(t, x, y);
    const d = t.dirty;
    if (!d) t.dirty = { x0, y0, x1, y1 };
    else { d.x0 = Math.min(d.x0, x0); d.y0 = Math.min(d.y0, y0); d.x1 = Math.max(d.x1, x1); d.y1 = Math.max(d.y1, y1); }
  }

  /* ---------- queries and changes ---------- */
  T.solid = (t, x, y) => {
    x |= 0; y |= 0;
    if (x < 0 || x >= t.w || y < 0) return false;
    if (y >= t.h) return true;
    return t.solid[y * t.w + x] !== 0;
  };
  T.carve = function (t, cx, cy, r) {
    const x0 = Math.floor(cx - r), x1 = Math.ceil(cx + r), y0 = Math.floor(cy - r), y1 = Math.ceil(cy + r);
    let n = 0;
    for (let y = Math.max(0, y0); y <= Math.min(t.h - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(t.w - 1, x1); x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r && t.solid[y * t.w + x]) { t.solid[y * t.w + x] = 0; n++; }
    }
    if (n) {
      repaint(t, x0 - 2, y0 - 2, x1 + 2, y1 + 2);
      // scorched rim
      const rr = r + 4;
      for (let y = Math.max(0, Math.floor(cy - rr)); y <= Math.min(t.h - 1, cy + rr); y++) for (let x = Math.max(0, Math.floor(cx - rr)); x <= Math.min(t.w - 1, cx + rr); x++) {
        const d2 = (x - cx) ** 2 + (y - cy) ** 2;
        if (d2 > r * r && d2 <= rr * rr && t.solid[y * t.w + x]) {
          const p = t.px[y * t.w + x];
          t.px[y * t.w + x] = rgb((p & 255) * 0.55, ((p >> 8) & 255) * 0.5, ((p >> 16) & 255) * 0.45);
        }
      }
    }
    return n;
  };
  // a beam from (x0,y0) to (x1,y1)
  T.girder = function (t, x0, y0, x1, y1, thick = 8) {
    const len = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / len, uy = (y1 - y0) / len, nx = -uy, ny = ux;
    const bx0 = Math.floor(Math.min(x0, x1) - thick), bx1 = Math.ceil(Math.max(x0, x1) + thick), by0 = Math.floor(Math.min(y0, y1) - thick), by1 = Math.ceil(Math.max(y0, y1) + thick);
    for (let y = Math.max(0, by0); y <= Math.min(t.h - 1, by1); y++) for (let x = Math.max(0, bx0); x <= Math.min(t.w - 1, bx1); x++) {
      const px = x - x0, py = y - y0, a = px * ux + py * uy, b = px * nx + py * ny;
      if (a >= 0 && a <= len && Math.abs(b) <= thick / 2) t.solid[y * t.w + x] = 2;
    }
    repaint(t, bx0 - 1, by0 - 1, bx1 + 1, by1 + 1);
  };
  T.free = function (t, x, y, r) {
    for (let a = 0; a < 12; a++) { const ang = (a / 12) * U.TAU; if (T.solid(t, x + Math.cos(ang) * r, y + Math.sin(ang) * r)) return false; }
    return !T.solid(t, x, y);
  };
  // surface normal (pointing out of the ground) near a point
  T.normal = function (t, x, y) {
    let nx = 0, ny = 0;
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) if (T.solid(t, x + dx, y + dy)) { nx -= dx; ny -= dy; }
    const l = Math.hypot(nx, ny);
    return l ? { x: nx / l, y: ny / l } : { x: 0, y: -1 };
  };
  T.flush = function (t) {
    const d = t.dirty;
    if (!d) return;
    t.ctx.putImageData(t.img, 0, 0, d.x0, d.y0, d.x1 - d.x0 + 1, d.y1 - d.y0 + 1);
    t.dirty = null;
  };
})(window.MM);
