/* Woolly Wallop: worlds, materials and the 20 levels. Levels are built from small parts –
   frames, towers, pyramids, plateaus – in metres; the ground is at y = 0 and y points down. */
"use strict";

(function (WW) {
  /* ---------- materials ---------- */
  WW.MAT = {
    wood: { density: 0.6, friction: 0.7, bounce: 0.05, hp: 7, pts: 500 },
    ice: { density: 0.9, friction: 0.12, bounce: 0.05, hp: 3.2, pts: 300 },
    stone: { density: 2.2, friction: 0.85, bounce: 0.02, hp: 13, pts: 800 },
    boom: { density: 0.7, friction: 0.6, bounce: 0.05, hp: 2.5, pts: 1000 },
  };
  WW.WOLF = {
    pup: { r: 0.38, hp: 6, pts: 5000 },
    wolf: { r: 0.52, hp: 6, pts: 5000 },
    alpha: { r: 0.7, hp: 7.5, pts: 8000 },
  };
  WW.SHEEP = {
    woolly: { r: 0.5, density: 2, name: "Woolly", tip: "A good all-rounder." },
    lambs: { r: 0.36, density: 2, name: "Lambkins", tip: "Tap in flight: splits into three." },
    zoomer: { r: 0.44, density: 2, name: "Zoomer", tip: "Tap in flight: a burst of speed." },
    boomer: { r: 0.5, density: 2, name: "Boomer", tip: "Tap: a thunderclap. Goes off by itself after a hit." },
    bruiser: { r: 0.72, density: 3.2, name: "Bruiser", tip: "Heavy. Tap in flight: a stomp straight down." },
  };

  /* ---------- worlds ---------- */
  WW.WORLDS = [
    { id: "meadow", name: "Green Meadow", song: "meadow", sky: ["#8ad4ff", "#e4f6ff"], hills: ["#9ad86a", "#6ab84a"], ground: ["#7ac04a", "#8a5a32", "#6a4226"], deco: "meadow" },
    { id: "autumn", name: "Autumn Woods", song: "autumn", sky: ["#ffb87a", "#ffe8c4"], hills: ["#d8883a", "#a85a2a"], ground: ["#c8803a", "#7a4a2a", "#5a3420"], deco: "autumn" },
    { id: "snow", name: "Snowy Peaks", song: "snow", sky: ["#9ac4f0", "#eef6ff"], hills: ["#e8f2fa", "#c4d8ea"], ground: ["#f4faff", "#8a9aaa", "#6a7a8a"], deco: "snow" },
    { id: "dusk", name: "Dusk Farm", song: "dusk", sky: ["#3a2a6a", "#e88a6a"], hills: ["#5a4a7a", "#3a2e5a"], ground: ["#4a6a3a", "#4a3226", "#33221a"], deco: "dusk" },
  ];

  /* ---------- builders ---------- */
  function builder() {
    const o = [];
    const B = {
      o,
      box(mat, x, yb, w, h, a = 0) { o.push({ t: "box", mat, x, y: yb - h / 2, w, h, a }); return yb - h; },
      post(mat, x, yb, h = 1.2, w = 0.25) { return B.box(mat, x, yb, w, h); },
      plank(mat, x, yb, w = 2.3, h = 0.25) { return B.box(mat, x, yb, w, h); },
      cube(mat, x, yb, s = 0.6) { return B.box(mat, x, yb, s, s); },
      ball(mat, x, yb, r = 0.4) { o.push({ t: "ball", mat, x, y: yb - r, r }); return yb - 2 * r; },
      boom(x, yb, s = 0.7) { return B.box("boom", x, yb, s, s); },
      wolf(kind, x, yb) { const r = WW.WOLF[kind].r; o.push({ t: "wolf", kind, x, y: yb - r - 0.01 }); return yb - 2 * r; },
      // static ground: a plateau from x0 to x1 with its top at height h
      hill(x0, x1, h) { o.push({ t: "ground", x: (x0 + x1) / 2, y: -h / 2, w: x1 - x0, h }); return -h; },
      // two posts and a plank across them
      frame(mat, x, yb, w = 2, h = 1.2, pmat) {
        const pw = 0.25;
        B.post(mat, x - w / 2 + pw / 2, yb, h, pw);
        B.post(mat, x + w / 2 - pw / 2, yb, h, pw);
        return B.plank(pmat || mat, x, yb - h, w + 0.3);
      },
      tower(mats, x, yb, w = 2, h = 1.2, wolves = []) {
        let y = yb;
        mats.forEach((m, i) => {
          if (wolves[i]) B.wolf(wolves[i], x, y);
          y = B.frame(m, x, y, w, h);
        });
        return y;
      },
      pyr(mat, x, yb, n, s = 0.6) {
        for (let r = 0; r < n; r++) for (let i = 0; i < n - r; i++) B.cube(mat, x + (i - (n - r - 1) / 2) * (s + 0.02), yb - r * s, s);
        return yb - n * s;
      },
      // a roof of two leaning planks is unstable – use a small pyramid of cubes instead
      cap(mat, x, yb) { B.cube(mat, x - 0.31, yb, 0.6); B.cube(mat, x + 0.31, yb, 0.6); return B.cube(mat, x, yb - 0.6, 0.6); },
    };
    return B;
  }

  const L = [];
  const lv = (meta, build) => { const B = builder(); build(B); L.push(Object.assign({ objs: B.o }, meta)); };
  const S = (s) => s.split(" ");

  /* ===== Green Meadow ===== */
  lv({ world: 0, name: "First Fling", w: 30, sheep: S("woolly woolly woolly") }, (B) => {
    const t = B.frame("wood", 22, 0, 2.2);
    B.wolf("wolf", 22, 0);
    B.wolf("pup", 22, t);
  });
  lv({ world: 0, name: "Two Huts", w: 32, sheep: S("woolly woolly woolly") }, (B) => {
    B.wolf("wolf", 20, 0); const a = B.frame("wood", 20, 0, 2.2); B.cube("wood", 20, a);
    B.wolf("wolf", 26, 0); const b = B.frame("wood", 26, 0, 2.2); B.wolf("pup", 26, b);
  });
  lv({ world: 0, name: "Bunk Beds", w: 32, sheep: S("woolly lambs woolly") }, (B) => {
    const t = B.tower(["wood", "wood"], 23, 0, 2.2, 1.2, ["wolf", "wolf"]);
    B.wolf("pup", 23, t);
    B.pyr("wood", 27.5, 0, 3);
  });
  lv({ world: 0, name: "Glass Windows", w: 33, sheep: S("lambs lambs woolly") }, (B) => {
    B.wolf("pup", 20, 0); B.frame("ice", 20, 0, 1.8, 1.2, "wood");
    B.wolf("wolf", 24, 0); const t = B.frame("ice", 24, 0, 2.4, 1.4, "wood"); B.wolf("pup", 24, t);
    B.wolf("pup", 28, 0); B.frame("ice", 28, 0, 1.8, 1.2, "wood");
  });
  lv({ world: 0, name: "Hilltop Den", w: 34, sheep: S("zoomer woolly zoomer") }, (B) => {
    const h = B.hill(22, 31, 2.4);
    B.wolf("wolf", 25, h); const t = B.frame("wood", 25, h, 2.2, 1.3);
    B.wolf("pup", 25, t);
    B.wolf("wolf", 28.5, h); B.frame("wood", 28.5, h, 2.2, 1.3, "stone");
    B.cube("wood", 23, h); B.cube("wood", 23, h - 0.6);
  });

  /* ===== Autumn Woods ===== */
  lv({ world: 1, name: "Log Pile", w: 33, sheep: S("woolly zoomer lambs") }, (B) => {
    B.pyr("wood", 23, 0, 4);
    B.wolf("wolf", 23, -2.4);
    B.wolf("pup", 20.2, 0); B.wolf("pup", 25.8, 0);
    B.ball("wood", 27.5, 0, 0.45);
    B.wolf("wolf", 29, 0);
  });
  lv({ world: 1, name: "Stone Gate", w: 33, sheep: S("bruiser woolly zoomer") }, (B) => {
    B.wolf("wolf", 24, 0);
    const t = B.frame("stone", 24, 0, 2.6, 1.6, "wood");
    B.wolf("pup", 23.4, t); B.wolf("pup", 24.6, t);
    B.wolf("wolf", 28, 0); B.frame("wood", 28, 0, 2, 1.3, "stone");
  });
  lv({ world: 1, name: "Twin Towers", w: 34, sheep: S("zoomer lambs bruiser woolly") }, (B) => {
    let t = B.tower(["wood", "wood", "ice"], 22, 0, 2, 1.2, ["pup", "wolf", "pup"]); B.cap("wood", 22, t);
    t = B.tower(["wood", "stone", "wood"], 28, 0, 2, 1.2, ["wolf", "pup", "wolf"]); B.cap("wood", 28, t);
  });
  lv({ world: 1, name: "Rope Bridge", w: 35, sheep: S("woolly zoomer zoomer") }, (B) => {
    const h1 = B.hill(20, 23, 2.2), h2 = B.hill(29, 32.5, 2.2);
    for (const x of [23.3, 25.5, 27.7]) B.post("wood", x, 0, 2.2, 0.3);
    B.plank("wood", 24.4, h1, 2.15, 0.2); B.plank("wood", 26.6, h1, 2.15, 0.2); B.plank("wood", 28.4, h1, 1.4, 0.2);
    B.wolf("pup", 24.4, h1 - 0.2); B.wolf("wolf", 26.6, h1 - 0.2);
    B.wolf("wolf", 30.8, h2); B.frame("wood", 30.8, h2, 2, 1.2);
    B.wolf("pup", 21.5, h1);
  });
  lv({ world: 1, name: "Powder Shed", w: 33, sheep: S("boomer woolly boomer") }, (B) => {
    B.wolf("wolf", 22.5, 0); B.boom(20.3, 0);
    const t = B.frame("wood", 22.5, 0, 3, 1.4);
    B.wolf("pup", 22.5, t);
    B.boom(26, 0); B.wolf("wolf", 27.2, 0); B.cube("wood", 28.3, 0); B.cube("wood", 28.3, -0.6);
    B.wolf("pup", 28.3, -1.2);
  });

  /* ===== Snowy Peaks ===== */
  lv({ world: 2, name: "Ice Palace", w: 34, sheep: S("lambs lambs zoomer woolly") }, (B) => {
    let t = B.tower(["ice", "ice", "ice"], 24, 0, 2.6, 1.3, ["wolf", "pup", "wolf"]); B.cap("ice", 24, t);
    t = B.tower(["ice", "ice"], 28.5, 0, 2, 1.2, ["pup", "wolf"]);
  });
  lv({ world: 2, name: "Glacier Steps", w: 35, sheep: S("zoomer woolly lambs bruiser") }, (B) => {
    B.hill(24, 33, 1.2); B.hill(27, 33, 2.4); B.hill(30, 33, 3.6);
    B.wolf("pup", 22, 0); B.frame("ice", 22, 0, 1.8, 1.1);
    B.wolf("wolf", 25.5, -1.2); B.frame("ice", 25.5, -1.2, 2, 1.2, "wood");
    B.wolf("wolf", 28.5, -2.4); B.frame("wood", 28.5, -2.4, 2, 1.2, "ice");
    B.wolf("alpha", 31.5, -3.6);
  });
  lv({ world: 2, name: "Frozen Keep", w: 34, sheep: S("bruiser lambs zoomer bruiser") }, (B) => {
    let t = B.frame("stone", 25, 0, 4, 1.4, "stone");
    B.wolf("wolf", 24, 0); B.wolf("wolf", 26, 0);
    B.wolf("pup", 23.8, t); B.frame("ice", 23.8, t, 1.6, 1.1); B.wolf("pup", 26.2, t); t = B.frame("ice", 26.2, t, 1.6, 1.1);
    B.cube("ice", 29.5, 0); B.cube("ice", 29.5, -0.6); B.wolf("pup", 29.5, -1.2);
  });
  lv({ world: 2, name: "Snowball Fight", w: 34, sheep: S("woolly zoomer lambs") }, (B) => {
    const t = B.tower(["wood", "ice"], 22, 0, 2, 1.2, ["wolf", "pup"]);
    B.ball("stone", 21.6, t, 0.42); B.ball("stone", 22.5, t, 0.42);
    B.wolf("wolf", 26, 0); B.wolf("wolf", 27.2, 0);
    const u = B.tower(["ice", "wood"], 30, 0, 2, 1.2, ["pup", "wolf"]);
    B.ball("stone", 30, u, 0.5);
  });
  lv({ world: 2, name: "Igloo Row", w: 36, sheep: S("lambs woolly lambs zoomer") }, (B) => {
    for (let i = 0; i < 5; i++) {
      const x = 20 + i * 2.8;
      B.wolf(i % 2 ? "wolf" : "pup", x, 0);
      const t = B.frame("ice", x, 0, 1.9, 1.15);
      if (i % 2 === 0) B.cube("ice", x, t);
    }
  });

  /* ===== Dusk Farm ===== */
  lv({ world: 3, name: "Castle Keep", w: 36, sheep: S("bruiser boomer zoomer lambs") }, (B) => {
    B.wolf("wolf", 25.3, 0);
    let t = B.frame("stone", 25.3, 0, 3, 1.5, "stone");
    B.wolf("alpha", 25.3, t);
    t = B.frame("wood", 25.3, t, 3, 1.6);
    B.cap("stone", 25.3, t);
    B.wolf("pup", 22, 0); B.frame("stone", 22, 0, 1.6, 1.1, "wood");
    B.wolf("pup", 28.6, 0); B.frame("stone", 28.6, 0, 1.6, 1.1, "wood");
  });
  lv({ world: 3, name: "Watchtowers", w: 36, sheep: S("zoomer zoomer boomer woolly bruiser") }, (B) => {
    let t = B.tower(["stone", "wood", "wood", "ice"], 22, 0, 1.8, 1.2, [null, "pup", "wolf", "pup"]); B.wolf("wolf", 22, t);
    t = B.tower(["wood", "stone", "wood", "wood"], 29, 0, 1.8, 1.2, ["wolf", null, "pup", "wolf"]); B.wolf("pup", 29, t);
    B.pyr("wood", 25.5, 0, 3);
  });
  lv({ world: 3, name: "The Pit", w: 35, sheep: S("bruiser bruiser boomer lambs") }, (B) => {
    B.hill(20, 23.4, 1.5); B.hill(28.6, 34, 1.5);
    B.wolf("wolf", 24.6, 0); B.wolf("alpha", 26.2, 0); B.wolf("wolf", 27.6, 0);
    B.plank("stone", 26, -1.5, 5.4, 0.35);
    B.cube("wood", 24.2, -1.85); B.cube("wood", 27.8, -1.85);
    B.wolf("pup", 31, -1.5); B.frame("wood", 31, -1.5, 2, 1.1);
  });
  lv({ world: 3, name: "Powder Depot", w: 35, sheep: S("woolly zoomer boomer bruiser") }, (B) => {
    B.boom(20.6, 0);
    B.wolf("wolf", 23.4, 0); const t = B.frame("stone", 23.4, 0, 2.4, 1.3, "wood");
    B.boom(23.4, t);
    B.wolf("alpha", 27.4, 0); const u = B.frame("stone", 27.4, 0, 2.8, 1.7, "stone");
    B.wolf("pup", 27.4, u); B.frame("wood", 27.4, u, 1.8, 1.1);
    B.boom(31, 0); B.wolf("wolf", 32.2, 0);
  });
  lv({ world: 3, name: "Alpha's Lair", w: 38, sheep: S("zoomer bruiser boomer lambs bruiser") }, (B) => {
    const h = B.hill(28, 37, 1.2);
    B.wolf("pup", 21, 0); let t = B.frame("wood", 21, 0, 1.8, 1.2); B.wolf("pup", 21, t);
    B.wolf("wolf", 24.5, 0); t = B.frame("stone", 24.5, 0, 2.2, 1.3, "wood"); B.frame("ice", 24.5, t, 1.8, 1.1);
    B.wolf("wolf", 30, h); t = B.frame("stone", 30, h, 2.2, 1.4, "stone");
    B.wolf("alpha", 33.2, h); const u = B.frame("stone", 33.2, h, 2.8, 1.8, "stone");
    B.wolf("wolf", 33.2, u); B.frame("wood", 33.2, u, 2.2, 1.2); B.boom(30, t);
  });

  WW.LEVELS = L;
})(window.WW);
