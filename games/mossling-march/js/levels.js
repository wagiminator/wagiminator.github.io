/* Mossling March: the levels. Coordinates are terrain cells (the map is 180 cells high).
   ops paint the ground: rect x y w h · ell cx cy rx ry · poly [x,y,…] · hill x0 x1 y amp depth · pillar x y0 w y1
   – a last argument "steel", "left"/"right" (one-way stone) or "cut" (carve) changes the material. */
"use strict";

(function (ML) {
  const L = [];
  const lv = (o) => { L.push(Object.assign({ hazards: [], rate: 50, time: 300, seed: L.length * 17 + 3 }, o)); };

  /* ================= Sprout: one skill at a time ================= */
  lv({
    name: "Dig Down", theme: "meadow", w: 560, count: 10, need: 8, skills: { dig: 2 },
    tip: "The way out is below. Pick the digger and click a mossling on the upper floor.",
    entrance: { x: 140, y: 50 }, exit: { x: 280, y: 149 },
    ops: [["rect", 0, 150, 560, 30], ["rect", 60, 96, 440, 12], ["rect", 60, 40, 8, 56], ["rect", 492, 40, 8, 56],
      ["rect", 150, 108, 8, 42], ["rect", 400, 108, 8, 42], ["ell", 30, 150, 40, 12], ["ell", 530, 150, 40, 14]],
    sol: [{ skill: "dig", x: 220, dir: 1, st: "walk" }],
  });
  lv({
    name: "Mind the Gap", theme: "meadow", w: 640, count: 8, need: 6, rate: 1, skills: { build: 4 },
    tip: "A builder lays a bridge of twelve steps. Start right at the edge.",
    entrance: { x: 60, y: 80 }, exit: { x: 560, y: 119 },
    ops: [["rect", 0, 120, 300, 60], ["rect", 324, 120, 316, 60], ["ell", 140, 122, 50, 6], ["ell", 440, 122, 40, 5]],
    sol: [{ skill: "build", x: 296, dir: 1, st: "walk" }],
  });
  lv({
    name: "Stand Firm", theme: "meadow", w: 600, count: 10, need: 8, rate: 40, skills: { block: 2 },
    tip: "A blocker stands still and turns everyone around. The others will find the exit on the left.",
    entrance: { x: 300, y: 70 }, exit: { x: 60, y: 119 },
    ops: [["rect", 0, 120, 420, 60], ["ell", 200, 122, 60, 6], ["rect", 0, 30, 14, 90]],
    sol: [{ skill: "block", x: 340, dir: 1, st: "walk" }],
  });
  lv({
    name: "Bash On", theme: "meadow", w: 640, count: 10, need: 9, skills: { bash: 2 },
    tip: "A basher tunnels straight ahead until there is nothing left to bash.",
    entrance: { x: 80, y: 80 }, exit: { x: 560, y: 129 },
    ops: [["rect", 0, 130, 640, 50], ["ell", 320, 130, 70, 50], ["ell", 300, 95, 30, 20]],
    sol: [{ skill: "bash", x: 240, dir: 1, st: "walk" }],
  });
  lv({
    name: "Over the Top", theme: "meadow", w: 640, count: 10, need: 8, rate: 20, skills: { climb: 10, float: 10 },
    tip: "Climbers scale walls, floaters glide down from any height. Some need both.",
    entrance: { x: 80, y: 100 }, exit: { x: 520, y: 149 },
    ops: [["rect", 0, 150, 640, 30], ["rect", 250, 50, 20, 100], ["ell", 260, 50, 9, 5]],
    sol: [{ skill: "climb", x: 150, dir: 1, st: "walk", n: 10 }, { skill: "float", x: 150, dir: 1, st: "walk", n: 10 }],
  });

  /* ================= Sapling: two jobs at once ================= */
  lv({
    name: "Miner's Path", theme: "forest", w: 640, count: 15, need: 13, skills: { mine: 2 },
    tip: "A miner digs down at a slant. Start early enough to reach the cave.",
    entrance: { x: 60, y: 40 }, exit: { x: 480, y: 159 },
    ops: [["rect", 0, 90, 640, 90], ["rect", 380, 130, 200, 30, "cut"], ["ell", 470, 132, 70, 10, "cut"], ["ell", 200, 92, 60, 5]],
    sol: [{ skill: "mine", x: 325, dir: 1, st: "walk" }],
  });
  lv({
    name: "Stairway Up", theme: "forest", w: 600, count: 12, need: 10, rate: 30, skills: { build: 6 },
    tip: "One builder is not enough. Give the next job when the builder shrugs.",
    entrance: { x: 80, y: 100 }, exit: { x: 540, y: 125 },
    ops: [["rect", 0, 150, 600, 30], ["rect", 400, 126, 200, 24], ["rect", 0, 50, 10, 100]],
    sol: [{ skill: "build", x: 350, dir: 1, st: "walk" }, { skill: "build", x: 374, st: "shrug", tol: 1 }],
  });
  lv({
    name: "Bombs Away", theme: "forest", w: 640, count: 12, need: 10, skills: { block: 2, bomb: 2 },
    tip: "Steel stops bashers. A bomber blasts earth – but not steel.",
    entrance: { x: 120, y: 90 }, exit: { x: 500, y: 139 },
    ops: [["rect", 0, 140, 640, 40], ["rect", 300, 60, 8, 80], ["rect", 300, 128, 8, 3, "steel"], ["rect", 292, 50, 24, 10, "steel"], ["rect", 0, 40, 10, 100]],
    sol: [{ skill: "block", x: 298, dir: 1, st: "walk" }, { skill: "bomb", x: 298, st: "block", tol: 2 }],
  });
  lv({
    name: "Wet Feet", theme: "forest", w: 700, count: 15, need: 12, rate: 1, skills: { build: 4, block: 1, bomb: 1 },
    tip: "Hold the crowd back while the bridge grows – and free them when it is done.",
    entrance: { x: 80, y: 80 }, exit: { x: 600, y: 119 },
    hazards: [{ x: 300, y: 150, w: 44, h: 30, kind: "water" }],
    ops: [["rect", 0, 120, 300, 60], ["rect", 344, 120, 356, 60], ["rect", 300, 165, 44, 15], ["rect", 0, 40, 10, 80]],
    sol: [{ skill: "build", x: 296, dir: 1, st: "walk" }, { skill: "block", x: 240, dir: 1, st: "walk", after: 250 }, { skill: "build", x: 320, st: "shrug", tol: 1 }, { skill: "bomb", x: 240, st: "block", tol: 3, after: 16 * 26 }],
  });
  lv({
    name: "Read the Arrows", theme: "forest", w: 640, count: 15, need: 13, skills: { build: 2, bash: 2 },
    tip: "Stone with arrows only gives way in the direction they point.",
    entrance: { x: 220, y: 90 }, exit: { x: 540, y: 139 },
    ops: [["rect", 0, 140, 640, 40], ["rect", 60, 60, 30, 80, "right"], ["rect", 380, 60, 40, 80, "right"], ["rect", 380, 132, 40, 8, "steel"], ["rect", 0, 40, 10, 100]],
    sol: [{ skill: "build", x: 358, dir: 1, st: "walk" }, { skill: "bash", x: 377, dir: 1, st: "walk", y: 130, ytol: 1, tol: 2 }],
    dir: -1,
  });

  /* ================= Timber: deeper and trickier ================= */
  lv({
    name: "Crystal Floors", theme: "caves", w: 520, count: 20, need: 15, skills: { block: 1, dig: 2, float: 2 },
    tip: "",
    entrance: { x: 80, y: 20 }, exit: { x: 160, y: 149 },
    ops: [["rect", 0, 50, 520, 10], ["rect", 0, 100, 520, 10], ["rect", 0, 150, 520, 30], ["rect", 420, 50, 26, 10, "cut"], ["rect", 420, 100, 26, 10, "cut"],
      ["rect", 0, 0, 10, 180], ["rect", 510, 0, 10, 180], ["ell", 300, 0, 120, 14]],
    sol: [{ skill: "block", x: 400, dir: 1, st: "walk", y: 49 }, { skill: "dig", x: 300, st: "walk", y: 49, after: 300 }],
  });
  lv({
    name: "Steel Floor", theme: "caves", w: 620, count: 20, need: 16, rate: 60, skills: { mine: 2, dig: 2 },
    tip: "",
    entrance: { x: 120, y: 20 }, exit: { x: 520, y: 149 },
    ops: [["rect", 0, 60, 620, 120], ["rect", 100, 70, 260, 8, "steel"], ["rect", 400, 40, 10, 20], ["rect", 420, 110, 170, 40, "cut"], ["ell", 505, 112, 70, 10, "cut"], ["rect", 0, 30, 20, 30]],
    sol: [{ skill: "mine", x: 370, dir: 1, st: "walk" }],
  });
  lv({
    name: "Pillars", theme: "caves", w: 800, count: 20, need: 16, skills: { bash: 4, build: 2, climb: 2 },
    tip: "",
    entrance: { x: 70, y: 100 }, exit: { x: 730, y: 149 },
    ops: [["rect", 0, 150, 800, 30], ["rect", 200, 90, 12, 60], ["rect", 330, 90, 12, 60], ["rect", 460, 90, 12, 60], ["rect", 460, 140, 12, 10, "steel"], ["rect", 590, 90, 12, 60],
      ["rect", 0, 60, 10, 90], ["ell", 400, 0, 400, 30]],
    sol: [{ skill: "bash", x: 190, dir: 1, st: "walk" }, { skill: "bash", x: 320, dir: 1, st: "walk" }, { skill: "build", x: 432, dir: 1, st: "walk" }, { skill: "bash", x: 458, dir: 1, st: "walk", tol: 2, y: 137, ytol: 1 }, { skill: "bash", x: 580, dir: 1, st: "walk" }],
  });
  lv({
    name: "Lava Lakes", theme: "caves", w: 760, count: 20, need: 17, rate: 30, skills: { build: 6, block: 1, bomb: 1 },
    tip: "",
    entrance: { x: 80, y: 90 }, exit: { x: 680, y: 129 },
    hazards: [{ x: 250, y: 150, w: 44, h: 30, kind: "lava" }, { x: 470, y: 150, w: 44, h: 30, kind: "lava" }],
    ops: [["rect", 0, 130, 760, 50], ["rect", 250, 130, 44, 50, "cut"], ["rect", 470, 130, 44, 50, "cut"], ["rect", 250, 168, 44, 12], ["rect", 470, 168, 44, 12], ["rect", 0, 40, 10, 90], ["ell", 380, 0, 380, 26]],
    sol: [{ skill: "build", x: 246, dir: 1, st: "walk" }, { skill: "block", x: 200, dir: 1, st: "walk", after: 200 }, { skill: "build", x: 270, st: "shrug", tol: 1 }, { skill: "build", x: 466, dir: 1, st: "walk" }, { skill: "build", x: 490, st: "shrug", tol: 1 }, { skill: "bomb", x: 200, st: "block", tol: 3, after: 16 * 40 }],
  });
  lv({
    name: "Tight Squeeze", theme: "caves", w: 700, count: 20, need: 18, rate: 60, skills: { bash: 2, dig: 1 },
    tip: "",
    entrance: { x: 60, y: 108 }, exit: { x: 520, y: 164 },
    ops: [["rect", 0, 120, 700, 60], ["rect", 0, 70, 700, 36], ["rect", 40, 100, 40, 6, "cut"], ["rect", 250, 106, 20, 14], ["rect", 420, 106, 30, 14], ["rect", 600, 60, 30, 120, "cut"],
      ["rect", 450, 140, 140, 25, "cut"], ["rect", 0, 100, 10, 20]],
    sol: [{ skill: "bash", x: 245, dir: 1, st: "walk" }, { skill: "bash", x: 415, dir: 1, st: "walk" }, { skill: "dig", x: 520, dir: 1, st: "walk" }],
  });

  /* ================= Ancient: everything you know ================= */
  lv({
    name: "Avalanche", theme: "frost", w: 900, count: 30, need: 24, rate: 40, time: 420, skills: { mine: 2, build: 5, block: 1, bomb: 1 },
    tip: "",
    entrance: { x: 60, y: 10 }, exit: { x: 830, y: 109 },
    hazards: [{ x: 600, y: 140, w: 70, h: 40, kind: "water" }],
    ops: [["rect", 0, 40, 250, 140], ["rect", 250, 110, 650, 70], ["rect", 420, 102, 10, 8, "steel"], ["rect", 600, 110, 70, 70, "cut"], ["rect", 600, 168, 70, 12], ["rect", 0, 0, 10, 40]],
    sol: [{ skill: "mine", x: 200, dir: 1, st: "walk" }, { skill: "build", x: 404, dir: 1, st: "walk" }, { skill: "build", x: 596, dir: 1, st: "walk" }, { skill: "block", x: 540, dir: 1, st: "walk", after: 740 }, { skill: "build", x: 620, st: "shrug", tol: 1 }, { skill: "build", x: 644, st: "shrug", tol: 1 }, { skill: "bomb", x: 540, st: "block", tol: 3, after: 1060 }],
  });
  lv({
    name: "Ice Bridge", theme: "frost", w: 800, count: 25, need: 20, rate: 20, time: 420, skills: { build: 6, block: 1, bomb: 1 },
    tip: "",
    entrance: { x: 100, y: 60 }, exit: { x: 700, y: 109 },
    ops: [["rect", 0, 110, 300, 70], ["rect", 390, 110, 410, 70], ["ell", 345, 0, 70, 36], ["rect", 0, 40, 10, 70]],
    sol: [{ skill: "build", x: 296, dir: 1, st: "walk" }, { skill: "block", x: 240, dir: 1, st: "walk", after: 230 }, { skill: "build", x: 320, st: "shrug", tol: 1 }, { skill: "build", x: 344, st: "shrug", tol: 1 }, { skill: "build", x: 368, st: "shrug", tol: 1 }, { skill: "bomb", x: 240, st: "block", tol: 3, after: 16 * 40 }],
  });
  lv({
    name: "Frozen Fortress", theme: "frost", w: 720, count: 20, need: 18, skills: { build: 3, bash: 2 },
    tip: "",
    entrance: { x: 100, y: 90 }, exit: { x: 620, y: 149 },
    ops: [["rect", 0, 150, 720, 30], ["rect", 380, 30, 24, 120, "steel"], ["rect", 380, 134, 24, 16, "left"], ["rect", 380, 112, 24, 22, "right"], ["rect", 360, 20, 64, 10, "steel"], ["rect", 0, 40, 10, 110]],
    sol: [{ skill: "build", x: 336, dir: 1, st: "walk" }, { skill: "build", x: 360, st: "shrug", tol: 1 }, { skill: "bash", x: 378, dir: 1, st: "walk", tol: 1, y: 128, ytol: 1 }],
  });
  lv({
    name: "Glacier Leap", theme: "frost", w: 760, count: 20, need: 16, rate: 30, time: 360, skills: { float: 18, build: 2 },
    tip: "",
    entrance: { x: 60, y: 10 }, exit: { x: 690, y: 149 },
    ops: [["rect", 0, 40, 300, 140], ["rect", 300, 150, 460, 30], ["rect", 480, 140, 12, 10, "steel"], ["rect", 486, 132, 12, 18, "steel"], ["rect", 0, 0, 10, 40], ["ell", 150, 42, 60, 6], ["rect", 750, 100, 10, 50]],
    sol: [{ skill: "float", x: 200, dir: 1, st: "walk", n: 18 }, { skill: "build", x: 456, dir: 1, st: "walk" }, { skill: "build", x: 480, st: "shrug", tol: 1 }],
  });
  lv({
    name: "Summit", theme: "frost", w: 820, count: 20, need: 18, rate: 40, time: 480, skills: { build: 10, climb: 4 },
    tip: "",
    entrance: { x: 70, y: 110 }, exit: { x: 770, y: 69 },
    ops: [["rect", 0, 160, 820, 20], ["rect", 300, 130, 520, 30], ["rect", 480, 100, 340, 30], ["rect", 660, 70, 160, 30], ["rect", 0, 60, 10, 100]],
    sol: [{ skill: "build", x: 240, dir: 1, st: "walk" }, { skill: "build", x: 264, st: "shrug", tol: 1 }, { skill: "build", x: 288, st: "shrug", tol: 1 },
      { skill: "build", x: 420, dir: 1, st: "walk" }, { skill: "build", x: 444, st: "shrug", tol: 1 }, { skill: "build", x: 468, st: "shrug", tol: 1 },
      { skill: "build", x: 600, dir: 1, st: "walk" }, { skill: "build", x: 624, st: "shrug", tol: 1 }, { skill: "build", x: 648, st: "shrug", tol: 1 }],
  });

  ML.LEVELS = L;
})(window.ML);
