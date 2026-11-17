/* Mossling March: the destructible terrain – one cell per pixel, painted from simple shapes,
   textured by code and changed by digging, bashing, mining, building and blasts */
"use strict";

(function (ML) {
  const { U } = ML;
  const T = (ML.T = {});
  T.H = 180;
  // materials
  const EMPTY = 0, EARTH = 1, STEEL = 2, ONE_L = 3, ONE_R = 4, BRICK = 5;
  T.M = { EMPTY, EARTH, STEEL, ONE_L, ONE_R, BRICK };

  /* ---------- themes: colours of the ground, its surface and the sky ---------- */
  const THEMES = (T.THEMES = {
    meadow: { name: "Meadow", earth: [[122, 78, 46], [146, 96, 56], [104, 66, 40]], top: [[96, 178, 64], [120, 200, 76]], deep: [86, 56, 36],
      rock: [[136, 128, 120], [112, 106, 100]], sky: ["#7ec8f0", "#d8f0ff"], hills: ["#9fd3a0", "#78b97c"], brick: [214, 170, 100] },
    forest: { name: "Forest", earth: [[92, 70, 52], [110, 84, 60], [76, 58, 44]], top: [[64, 132, 60], [86, 156, 70]], deep: [62, 48, 38],
      rock: [[120, 110, 96], [96, 90, 80]], sky: ["#2e4a3c", "#88b48a"], hills: ["#2f5a40", "#244a34"], brick: [196, 150, 96] },
    caves: { name: "Crystal Caves", earth: [[88, 76, 110], [104, 90, 128], [72, 62, 94]], top: [[120, 210, 230], [170, 240, 250]], deep: [58, 50, 76],
      rock: [[110, 104, 130], [90, 86, 110]], sky: ["#120f24", "#3a2c5a"], hills: ["#2a2244", "#1e1834"], brick: [200, 170, 120] },
    frost: { name: "Frost Peaks", earth: [[120, 136, 158], [138, 154, 176], [104, 118, 140]], top: [[236, 246, 255], [210, 230, 248]], deep: [90, 104, 126],
      rock: [[150, 156, 168], [126, 132, 146]], sky: ["#a8c4e8", "#eef6ff"], hills: ["#c8d8ee", "#aec4e0"], brick: [206, 172, 120] },
  });

  // value noise for textures
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

  /* ---------- build a terrain from a level ---------- */
  T.create = function (lv) {
    const w = lv.w, h = T.H;
    const t = { w, h, type: new Uint8Array(w * h), theme: THEMES[lv.theme] || THEMES.meadow, seed: lv.seed || 1 };
    const set = (x, y, m) => { if (x >= 0 && x < w && y >= 0 && y < h) t.type[y * w + x] = m; };
    const fill = (test, m, bx0 = 0, by0 = 0, bx1 = w - 1, by1 = h - 1) => {
      bx0 = Math.max(0, Math.floor(bx0)); by0 = Math.max(0, Math.floor(by0)); bx1 = Math.min(w - 1, Math.ceil(bx1)); by1 = Math.min(h - 1, Math.ceil(by1));
      for (let y = by0; y <= by1; y++) for (let x = bx0; x <= bx1; x++) if (test(x, y)) set(x, y, m);
    };
    for (const op of lv.ops) {
      const [k] = op;
      // the last argument may name a material: "steel", "left", "right", "cut"
      const mat = (name) => (name === "steel" ? STEEL : name === "left" ? ONE_L : name === "right" ? ONE_R : name === "cut" ? EMPTY : EARTH);
      if (k === "rect") { const [, x, y, ww, hh, m] = op; fill(() => true, mat(m), x, y, x + ww - 1, y + hh - 1); }
      else if (k === "ell") { const [, cx, cy, rx, ry, m] = op; fill((x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1, mat(m), cx - rx, cy - ry, cx + rx, cy + ry); }
      else if (k === "poly") {
        const [, pts, m] = op;
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (let i = 0; i < pts.length; i += 2) { x0 = Math.min(x0, pts[i]); x1 = Math.max(x1, pts[i]); y0 = Math.min(y0, pts[i + 1]); y1 = Math.max(y1, pts[i + 1]); }
        const inside = (px, py) => {
          let c = false;
          for (let i = 0, j = pts.length - 2; i < pts.length; j = i, i += 2) {
            const xi = pts[i], yi = pts[i + 1], xj = pts[j], yj = pts[j + 1];
            if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) c = !c;
          }
          return c;
        };
        fill((x, y) => inside(x + 0.5, y + 0.5), mat(m), x0, y0, x1, y1);
      } else if (k === "hill") {
        // a rolling ground from x0 to x1: surface around y, with a noisy profile, down to the bottom (or to y + depth)
        const [, x0, x1, y, amp, depth, m] = op;
        for (let x = Math.max(0, x0); x <= Math.min(w - 1, x1); x++) {
          const top = Math.round(y + (vnoise(x, 0, 40, t.seed) - 0.5) * 2 * amp + (vnoise(x, 7, 11, t.seed) - 0.5) * amp * 0.4);
          const bot = depth ? top + depth : h - 1;
          for (let yy = top; yy <= bot; yy++) set(x, yy, mat(m));
        }
      } else if (k === "pillar") {
        // a rough column of rock
        const [, x, y0, ww, y1, m] = op;
        for (let yy = y0; yy <= y1; yy++) {
          const e = Math.round((vnoise(x, yy, 9, t.seed) - 0.5) * 4);
          for (let xx = x - e; xx < x + ww + e; xx++) set(xx, yy, mat(m));
        }
      }
    }
    // canvas with one pixel per cell
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    t.cv = cv; t.ctx = cv.getContext("2d");
    t.img = t.ctx.createImageData(w, h);
    t.px = new Uint32Array(t.img.data.buffer);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) t.px[y * w + x] = colourAt(t, x, y);
    t.ctx.putImageData(t.img, 0, 0);
    t.dirty = null;
    return t;
  };

  function colourAt(t, x, y) {
    const m = t.type[y * t.w + x], th = t.theme, s = t.seed;
    if (m === EMPTY) return 0;
    const n = hash(x, y, s), n2 = vnoise(x, y, 6, s + 3);
    if (m === STEEL) {
      // riveted plates, 12×12
      const px = ((x % 12) + 12) % 12, py = ((y % 12) + 12) % 12;
      let v = 150 + n2 * 25 - (py === 0 || px === 0 ? 40 : 0) + (py === 1 || px === 1 ? 25 : 0);
      if ((px === 3 || px === 9) && (py === 3 || py === 9)) v = 210;
      return rgb(v * 0.92, v * 0.96, v * 1.05);
    }
    if (m === BRICK) {
      const b = th.brick, v = (x + y) % 6 === 0 ? 0.8 : 1;
      return rgb(b[0] * v, b[1] * v, b[2] * v);
    }
    if (m === ONE_L || m === ONE_R) {
      // stone with arrows pointing the way it can be bashed
      const r = th.rock[0], ax = ((x % 10) + 10) % 10, ay = ((y % 10) + 10) % 10;
      const dir = m === ONE_R ? 1 : -1;
      const ax2 = dir > 0 ? ax : 9 - ax;
      const arrow = (ay >= 3 && ay <= 6 && ax2 >= 1 && ax2 <= 5) || (ax2 >= 5 && ax2 <= 7 && Math.abs(ay - 4.5) <= 7 - ax2);
      const k = arrow ? 1.35 : 0.85 + n2 * 0.25;
      return rgb(r[0] * k * 0.9, r[1] * k, r[2] * k * 1.2);
    }
    // earth: a surface layer on top, strata and pebbles below
    let depth = 0;
    while (depth < 4 && y - depth - 1 >= 0 && t.type[(y - depth - 1) * t.w + x] !== EMPTY) depth++;
    if (depth < 3) {
      const c = th.top[n < 0.5 ? 0 : 1], k = depth === 0 ? 1.08 : depth === 1 ? 1 : 0.85;
      return rgb(c[0] * k, c[1] * k, c[2] * k);
    }
    const band = vnoise(x * 0.25, y, 5, s + 9);
    const c = th.earth[band < 0.33 ? 0 : band < 0.7 ? 1 : 2];
    if (n > 0.965) { const r = th.rock[1]; return rgb(r[0], r[1], r[2]); }
    const k = 0.84 + n2 * 0.3 - (n < 0.08 ? 0.12 : 0);
    return rgb(c[0] * k, c[1] * k, c[2] * k);
  }

  /* ---------- queries and changes ---------- */
  T.get = (t, x, y) => (x < 0 || x >= t.w ? STEEL : y < 0 || y >= t.h ? EMPTY : t.type[y * t.w + x]);
  T.solid = (t, x, y) => T.get(t, x, y) !== EMPTY;
  function mark(t, x, y) {
    const d = t.dirty;
    if (!d) t.dirty = { x0: x, y0: y, x1: x, y1: y };
    else { if (x < d.x0) d.x0 = x; if (x > d.x1) d.x1 = x; if (y < d.y0) d.y0 = y; if (y > d.y1) d.y1 = y; }
  }
  // remove one cell; dir is the direction of the digger (one-way stone only gives way in its direction)
  T.erase = function (t, x, y, dir) {
    if (x < 0 || x >= t.w || y < 0 || y >= t.h) return 0;
    const i = y * t.w + x, m = t.type[i];
    if (m === EMPTY) return 0;
    if (m === STEEL) return -1;
    if ((m === ONE_L && dir > 0) || (m === ONE_R && dir < 0)) return -1;
    t.type[i] = EMPTY; t.px[i] = 0; mark(t, x, y);
    return 1;
  };
  T.addBrick = function (t, x, y) {
    if (x < 0 || x >= t.w || y < 0 || y >= t.h) return;
    const i = y * t.w + x;
    if (t.type[i] !== EMPTY) return;
    t.type[i] = BRICK; t.px[i] = colourAt(t, x, y); mark(t, x, y);
  };
  // anything that blocks a tool in this area? (steel, or one-way stone the wrong way round)
  T.blocked = function (t, x0, y0, x1, y1, dir) {
    for (let y = Math.max(0, y0); y <= Math.min(t.h - 1, y1); y++) for (let x = x0; x <= x1; x++) {
      const m = T.get(t, x, y);
      if (m === STEEL || (m === ONE_L && dir > 0) || (m === ONE_R && dir < 0)) return true;
    }
    return false;
  };
  T.flush = function (t) {
    const d = t.dirty;
    if (!d) return;
    t.ctx.putImageData(t.img, 0, 0, d.x0, d.y0, d.x1 - d.x0 + 1, d.y1 - d.y0 + 1);
    t.dirty = null;
  };
})(window.ML);
