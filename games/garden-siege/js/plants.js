/* Garden Siege: all plants – stats, behaviour and drawing.
   Plants are drawn at their ground point (0,0), about 100 px tall. */
"use strict";

(function (GS) {
  const { U, D } = GS;
  const P = (GS.PLANTS = {});
  const ORDER = (GS.PLANT_ORDER = []);
  const F = 7.5, S = 30, V = 50;
  const OUT = D.OUT;

  function def(id, o) {
    o.id = id;
    o.hp = o.hp || 300;
    o.recharge = o.recharge || F;
    o.layer = o.layer || "main";
    P[id] = o;
    if (!o.hidden) ORDER.push(id);
  }

  /* ---------- shared behaviour ---------- */
  const PEA_RATE = 1.425;
  function burst(p, G, dt, fire) {
    if (p.burstN > 0) {
      p.burstT -= dt;
      if (p.burstT <= 0) { fire(p.burstN); p.burstN--; p.burstT = 0.16; }
    }
  }
  function shooter(p, G, dt, o) {
    burst(p, G, dt, () => o.fire(p, G));
    p.t -= dt;
    if (p.t > 0) return;
    if (G.anyAhead(p.row, p.x, o.range || 2000, o.kind || "straight")) {
      o.fire(p, G);
      p.anim = 0.25;
      if (o.n > 1) { p.burstN = o.n - 1; p.burstT = 0.16; }
      p.t = o.rate || PEA_RATE;
    } else p.t = 0.15;
  }
  const muzzle = (p, G, dx = 36, dy = 56) => [p.x + dx * G.geo.scale, p.y - dy * G.geo.scale];
  const firePea = (kind) => (p, G) => { const [x, y] = muzzle(p, G); G.shoot(kind, x, y, p.row); };

  /* ---------- shared drawing ---------- */
  const GREEN = "#62c23a", GREEN2 = "#4e9e2c", LEAF = "#5cb83a";
  function baseLeaves(c, w = 26) {
    D.leaf(c, 0, -2, w, 9, Math.PI + 0.25, LEAF);
    D.leaf(c, 0, -2, w, 9, -0.25, LEAF);
  }
  function peaHead(c, p, col, o = {}) {
    const bob = Math.sin((p.age || 0) * 3) * 2;
    const kick = p.anim > 0 ? -4 * (p.anim / 0.25) : 0;
    const dir = o.dir || 1, hx = (o.hx || 0), hy = (o.hy ?? -54) + bob;
    c.save();
    c.translate(hx + kick * dir, hy);
    if (dir < 0) c.scale(-1, 1);
    // snout
    D.rr(c, 8, -12, 30, 22, 8, col, OUT, 3);
    D.ellipse(c, 37, -1, 6, 10, col, OUT, 3);
    D.ellipse(c, 37, -1, 3.5, 6.5, "#1d3a12", null, 0);
    for (let i = 1; i < (o.barrels || 1); i++) { D.rr(c, 8, -12 + i * 7, 30, 8, 4, col, OUT, 2); }
    D.circle(c, 0, 0, 22, col, OUT, 3);
    D.circle(c, -7, -8, 7, "rgba(255,255,255,0.25)", null, 0);
    // eye
    D.ellipse(c, 6, -6, 5, 7, "#fff", OUT, 2);
    D.circle(c, 8, -5, 3, "#111", null, 0);
    if (o.angry) D.line(c, 0, -15, 12, -11, OUT, 3);
    if (o.tuft) D.leaf(c, -16, -10, 18, 6, Math.PI + 0.6, o.tuft);
    if (o.helmet) { c.beginPath(); c.arc(0, -2, 23, Math.PI, 0); c.fillStyle = o.helmet; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke(); }
    c.restore();
  }
  function peaPlant(col, o = {}) {
    return (c, p) => {
      baseLeaves(c);
      D.stem(c, 0, -2, o.dir < 0 ? 2 : -2, -40, 7, GREEN2);
      peaHead(c, p, col, o);
      if (o.back) peaHead(c, p, col, Object.assign({}, o.back, { dir: -1, hx: -14 }));
    };
  }
  function mushroom(c, p, cap, stemCol, o = {}) {
    const sl = p.asleep;
    const sq = 1 + Math.sin((p.age || 0) * (sl ? 1.5 : 3)) * 0.03;
    const s = o.s || 1;
    c.save(); c.scale(s, s * sq);
    D.rr(c, -14, -34, 28, 34, 10, stemCol || "#f1e6d0", OUT, 3);
    if (!o.noFace) D.eyes(c, 0, -20, 7, 1, { closed: sl });
    c.beginPath(); c.moveTo(-34, -30);
    c.bezierCurveTo(-36, -78, 36, -78, 34, -30);
    c.quadraticCurveTo(0, -22, -34, -30); c.closePath();
    c.fillStyle = cap; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
    if (o.spots !== false) for (const [x, y, r] of [[-14, -52, 6], [10, -60, 5], [20, -42, 4]]) D.circle(c, x, y, r, o.spots || "rgba(255,255,255,0.4)", null, 0);
    c.restore();
    if (sl) D.text(c, "z", 22 + Math.sin(p.age * 2) * 3, -70 - ((p.age * 12) % 16), 16, "#fff");
  }
  function catapult(c, p, item, itemCol) {
    baseLeaves(c, 30);
    D.rr(c, -26, -26, 52, 26, 10, "#7ac24a", OUT, 3);
    D.eyes(c, 6, -15, 6, 1);
    const arm = p.anim > 0 ? -1.1 * (p.anim / 0.4) : 0;
    c.save(); c.translate(-18, -22); c.rotate(-0.4 + arm);
    D.line(c, 0, 0, -6, -36, OUT, 7); D.line(c, 0, 0, -6, -36, "#a7d06a", 4);
    D.ellipse(c, -6, -42, 15, 8, "#9ac35a", OUT, 2.5);
    if (p.anim <= 0 || p.anim > 0.3) item(c, -6, -50);
    c.restore();
  }
  function nutBody(c, p, h, col = "#c8913f", o = {}) {
    const r = p.hp / (p.maxHp || p.hp || 1);
    D.ellipse(c, 0, -h / 2, h * 0.36, h / 2, col, OUT, 3);
    D.ellipse(c, -h * 0.12, -h * 0.68, h * 0.08, h * 0.12, "rgba(255,255,255,0.18)", null, 0);
    const look = Math.sin((p.age || 0) * 0.7) * 2;
    D.eyes(c, h * 0.06, -h * 0.62, 8, 1, { lx: look, angry: o.angry });
    if (r < 0.66) { D.line(c, -h * 0.25, -h * 0.4, -h * 0.05, -h * 0.3, OUT, 2.5); D.line(c, -h * 0.05, -h * 0.3, -h * 0.12, -h * 0.15, OUT, 2.5); }
    if (r < 0.33) { D.line(c, h * 0.2, -h * 0.85, h * 0.05, -h * 0.75, OUT, 2.5); D.line(c, h * 0.05, -h * 0.75, h * 0.22, -h * 0.6, OUT, 2.5); D.line(c, -h * 0.3, -h * 0.7, -h * 0.15, -h * 0.62, OUT, 2.5); }
    D.line(c, -2, -h * 0.4, 14, -h * 0.42, OUT, 3);
  }

  /* ================= DAY ================= */
  def("pea", {
    name: "Pea Popper", cost: 100, recharge: F, hp: 300,
    desc: "Shoots peas at zombies in its lane.", stats: "Damage: normal",
    update: (p, G, dt) => shooter(p, G, dt, { fire: firePea("pea") }),
    draw: peaPlant(GREEN),
  });
  def("sunbloom", {
    name: "Sunbloom", cost: 50, recharge: F, hp: 300, sun: true,
    desc: "Makes extra sun. Plant plenty of them early on.", stats: "Sun production: normal",
    init: (p) => { p.t = U.rand(3, 12.5); },
    update: (p, G, dt) => {
      p.t -= dt;
      if (p.glow > 0) p.glow -= dt;
      if (p.t <= 0) { p.t = 24; p.glow = 1; G.addSun(p.x, p.y - 50 * G.geo.scale, 25, { pop: true }); }
    },
    draw: (c, p) => sunHead(c, p, 0, -58, 1),
  });
  function sunHead(c, p, x, y, s) {
    if (x === 0) { baseLeaves(c); D.stem(c, 0, -2, 0, y + 10, 7, GREEN2); }
    const bob = Math.sin((p.age || 0) * 2.2 + x) * 2;
    c.save(); c.translate(x, y + bob); c.scale(s, s); c.rotate(Math.sin((p.age || 0) * 1.3) * 0.08);
    if (p.glow > 0) D.circle(c, 0, 0, 36, `rgba(255,240,140,${p.glow * 0.6})`, null, 0);
    for (let i = 0; i < 12; i++) {
      c.save(); c.rotate((i / 12) * U.TAU);
      D.ellipse(c, 0, -24, 7, 13, i % 2 ? "#ffd02a" : "#ffde4a", "#b07d10", 2);
      c.restore();
    }
    D.circle(c, 0, 0, 18, "#e6a03a", "#8a5410", 2.5);
    D.eyes(c, 0, -4, 5.5, 1);
    c.beginPath(); c.arc(0, 4, 7, 0.2, Math.PI - 0.2); c.lineWidth = 2.5; c.strokeStyle = OUT; c.stroke();
    c.restore();
  }
  def("cherry", {
    name: "Cherry Blast", cost: 150, recharge: V, hp: 300, instant: true,
    desc: "Blows up all zombies in a small area.", stats: "Damage: massive (3x3)",
    init: (p) => { p.t = 1.1; },
    update: (p, G, dt) => {
      p.t -= dt;
      if (p.t <= 0) { G.blast(p.x, p.y, 155, 1.5, 1800); G.boomFx(p.x, p.y - 30, 1.2, "255,90,40"); G.say("Kaboom!"); G.removePlant(p); }
    },
    draw: (c, p) => {
      const sw = p.t !== undefined && p.t < 1.1 ? 1 + (1.1 - p.t) * 0.35 : 1;
      c.save(); c.scale(sw, sw);
      D.line(c, -14, -40, 4, -70, "#4e8a2a", 4); D.line(c, 16, -38, 4, -70, "#4e8a2a", 4);
      D.leaf(c, 4, -70, 20, 7, -0.6, LEAF);
      for (const [x, y] of [[-16, -28], [16, -26]]) {
        D.circle(c, x, y, 20, sw > 1.2 ? "#ff3020" : "#d8262a", OUT, 3);
        D.circle(c, x - 7, y - 8, 5, "rgba(255,255,255,0.4)", null, 0);
        D.eyes(c, x, y - 3, 5, 1, { angry: true });
      }
      c.restore();
    },
  });
  def("nut", {
    name: "Stone Nut", cost: 50, recharge: S, hp: 4000, defensive: true,
    desc: "A hard shell that keeps zombies busy.", stats: "Toughness: high",
    draw: (c, p) => nutBody(c, p, 74),
  });
  def("mine", {
    name: "Spud Mine", cost: 25, recharge: S, hp: 300, ground: true,
    desc: "Explodes when a zombie steps on it. Needs some time to arm.", stats: "Damage: massive (one tile), arms in 15 s",
    init: (p) => { p.t = 15; p.armed = false; },
    update: (p, G, dt) => {
      if (!p.armed) { p.t -= dt; if (p.t <= 0) { p.armed = true; p.rise = 0.4; G.sfx("arm"); } return; }
      if (p.rise > 0) p.rise -= dt;
      for (const z of G.zombies) {
        if (z.row === p.row && G.targetable(z, "ground") && Math.abs(z.x - p.x) < 45) {
          G.blast(p.x, p.y, 75, 0, 1800);
          G.boomFx(p.x, p.y - 10, 0.8, "200,140,60");
          G.floatText("SPUDOW!", p.x, p.y - 60, "#ffe070");
          G.removePlant(p);
          return;
        }
      }
    },
    draw: (c, p) => {
      const up = p.armed || p.preview ? 1 - Math.max(0, p.rise || 0) / 0.4 : 0.15;
      D.ellipse(c, 0, -4, 34, 10, "#7a5230", OUT, 2.5);
      c.save(); c.beginPath(); c.rect(-40, -80, 80, 76); c.clip();
      c.translate(0, 34 - up * 34);
      D.ellipse(c, 0, -22, 26, 22, "#c99a5a", OUT, 3);
      for (const [x, y] of [[-12, -30], [10, -14], [14, -32]]) D.circle(c, x, y, 2, "#8a6030", null, 0);
      D.eyes(c, 0, -26, 5, 1);
      D.line(c, 0, -44, 0, -56, OUT, 3);
      D.circle(c, 0, -58, 5, p.armed && Math.sin(p.age * 10) > 0 ? "#ff3030" : "#802020", OUT, 2);
      c.restore();
    },
  });
  def("frost", {
    name: "Frost Popper", cost: 175, recharge: F, hp: 300,
    desc: "Shoots frozen peas that slow zombies down.", stats: "Damage: normal, slows",
    update: (p, G, dt) => shooter(p, G, dt, { fire: firePea("snow") }),
    draw: (c, p) => { peaPlant("#86d6ff")(c, p); for (let i = 0; i < 3; i++) D.poly(c, [-18 + i * 9, -72, -14 + i * 9, -86 - i * 2, -10 + i * 9, -72], "#dff6ff", "#3a7aa0", 2); },
  });
  def("snap", {
    name: "Snapjaw", cost: 150, recharge: F, hp: 300,
    desc: "Swallows a zombie whole, but chews for a long time.", stats: "Damage: massive, very slow",
    init: (p) => { p.chew = 0; },
    update: (p, G, dt) => {
      if (p.bite > 0) p.bite -= dt;
      if (p.chew > 0) { p.chew -= dt; return; }
      const z = G.firstInRange(p.row, p.x - 20, p.x + 150, "ground");
      if (!z) return;
      p.bite = 0.35;
      if (z.def.noEat) { G.hurt(z, 40, "eat"); p.chew = 1.2; return; }
      G.swallow(z);
      p.chew = 42;
      G.sfx("gulp");
    },
    draw: (c, p) => {
      D.stem(c, 0, -2, -6, -46, 8, "#3f8a2a");
      baseLeaves(c, 30);
      const chewing = p.chew > 0, open = p.bite > 0 ? 0.1 : chewing ? 0.05 + Math.abs(Math.sin(p.age * 3)) * 0.12 : 0.45 + Math.sin(p.age * 2) * 0.08;
      c.save(); c.translate(-4, -60);
      if (chewing) c.scale(1.12, 1.05);
      for (const s of [-1, 1]) {
        c.save(); c.rotate(s * open);
        c.beginPath(); c.moveTo(-22, 0); c.quadraticCurveTo(-20, s * 32, 18, s * 26); c.quadraticCurveTo(40, s * 18, 44, 0); c.closePath();
        c.fillStyle = "#9b4fd0"; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
        for (let i = 0; i < 4; i++) D.poly(c, [6 + i * 9, 0, 10 + i * 9, s * -7, 14 + i * 9, 0], "#fff", OUT, 1.5);
        c.restore();
      }
      D.circle(c, -18, -18, 4, "#d9b4f5", null, 0);
      c.restore();
    },
  });
  def("double", {
    name: "Double Popper", cost: 200, recharge: F, hp: 300,
    desc: "Fires two peas at a time.", stats: "Damage: normal (x2)",
    update: (p, G, dt) => shooter(p, G, dt, { fire: firePea("pea"), n: 2 }),
    draw: peaPlant("#4fb52c", { angry: true, tuft: "#3f9a2a" }),
  });

  /* ================= NIGHT ================= */
  def("puff", {
    name: "Puffcap", cost: 0, recharge: F, hp: 300, mushroom: true,
    desc: "Free, short range spore shooter.", stats: "Range: 3 tiles. Sleeps during the day.",
    update: (p, G, dt) => shooter(p, G, dt, { range: 330, fire: (p, G) => G.shoot("spore", p.x + 18 * G.geo.scale, p.y - 18 * G.geo.scale, p.row, { life: 330 }) }),
    draw: (c, p) => { mushroom(c, p, "#b35fd8", null, { s: 0.6 }); D.rr(c, 12, -22, 14, 10, 4, "#b35fd8", OUT, 2); },
  });
  def("dawn", {
    name: "Dawncap", cost: 25, recharge: F, hp: 300, mushroom: true, sun: true,
    desc: "Makes small sun at first and normal sun once grown.", stats: "Grows after 2 minutes. Sleeps during the day.",
    init: (p) => { p.t = U.rand(3, 12.5); p.grow = 120; },
    update: (p, G, dt) => {
      if (p.grow > 0) p.grow -= dt;
      p.t -= dt;
      if (p.t <= 0) { p.t = 24; G.addSun(p.x, p.y - 30, p.grow > 0 ? 15 : 25, { pop: true }); }
    },
    draw: (c, p) => mushroom(c, p, "#f3a432", "#fff0c8", { s: p.grow > 0 ? 0.55 : 0.8, spots: "rgba(255,240,140,0.7)" }),
  });
  def("fume", {
    name: "Fumecap", cost: 75, recharge: F, hp: 300, mushroom: true,
    desc: "Shoots fumes that pass through screen doors and hit every zombie in range.", stats: "Range: 4 tiles, hits all in range",
    update: (p, G, dt) => {
      if (p.anim > 0) p.anim -= dt;
      p.t -= dt;
      if (p.t > 0) return;
      if (G.anyAhead(p.row, p.x, 420, "fume")) { G.fume(p.row, p.x + 20, p.x + 430, 20); p.anim = 0.6; p.t = 1.5; G.sfx("lob"); }
      else p.t = 0.15;
    },
    draw: (c, p) => {
      mushroom(c, p, "#8a4fc0", "#d8c8ec", { s: 0.9 });
      D.rr(c, 18, -38, 26, 18, 6, "#8a4fc0", OUT, 3); D.ellipse(c, 44, -29, 5, 9, "#6a3a98", OUT, 2.5);
      if (p.anim > 0) fumeCloud(c, p.anim / 0.6, 360);
    },
  });
  function fumeCloud(c, a, len) {
    for (let i = 0; i < 9; i++) {
      const x = 50 + (1 - a) * len * (i / 9 + 0.1) * 1.2;
      D.circle(c, x, -30 + Math.sin(i * 2) * 8, 16 + i * 1.5, `rgba(205,150,255,${a * 0.55})`, null, 0);
    }
  }
  def("muncher", {
    name: "Grave Muncher", cost: 75, recharge: F, hp: 300, onGrave: true,
    desc: "Plant it on a grave to eat the grave.", stats: "Only on graves",
    init: (p) => { p.t = 4.5; },
    update: (p, G, dt) => { p.t -= dt; if (Math.random() < dt * 6) G.sfx("chomp"); if (p.t <= 0) { G.removeGrave(p.row, p.col); G.removePlant(p); if (U.chance(0.4)) G.addCoin(p.x, p.y - 40, "silver"); } },
    draw: (c, p) => {
      const ch = Math.abs(Math.sin((p.age || 0) * 8));
      D.ellipse(c, 0, -26, 28, 22, "#7c4ec4", OUT, 3);
      D.ellipse(c, 0, -20, 20, 4 + ch * 8, "#3a1550", OUT, 2);
      for (let i = -2; i <= 2; i++) D.poly(c, [i * 7 - 3, -28, i * 7, -22, i * 7 + 3, -28], "#fff", null, 0);
      D.eyes(c, 0, -40, 5, 1, { angry: true });
      for (const s of [-1, 1]) D.leaf(c, s * 20, -36, 18, 6, s < 0 ? Math.PI + 0.6 : -0.6, "#b07ae8");
    },
  });
  def("swirl", {
    name: "Swirlcap", cost: 75, recharge: S, hp: 300, mushroom: true,
    desc: "A zombie that eats it turns around and fights for you.", stats: "Single use",
    onBite: (p, G, z) => { if (p.asleep || z.def.noHypno) return false; z.hypno = true; z.state = "walk"; G.sfx("magnet"); G.removePlant(p); return true; },
    draw: (c, p) => {
      mushroom(c, p, "#f07ad0", null, { spots: false });
      c.save(); c.translate(0, -50); c.rotate((p.age || 0) * 2);
      const cols = ["#ffde4a", "#6fd8ff", "#a8ff7a"];
      for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(0, 0, 6 + i * 6, i, i + 3.5); c.lineWidth = 3; c.strokeStyle = cols[i]; c.stroke(); }
      c.restore();
    },
  });
  def("shy", {
    name: "Shycap", cost: 25, recharge: F, hp: 300, mushroom: true,
    desc: "Long range shooter that hides when zombies come close.", stats: "Range: whole lane",
    update: (p, G, dt) => {
      const near = G.zombies.some((z) => !z.dead && !z.hypno && Math.abs(z.row - p.row) <= 1 && Math.abs(z.x - p.x) < 150 && G.targetable(z, "ground"));
      p.hide = U.clamp((p.hide || 0) + (near ? dt : -dt) * 4, 0, 1);
      if (near) return;
      shooter(p, G, dt, { fire: (p, G) => G.shoot("spore", p.x + 12, p.y - 60 * G.geo.scale, p.row) });
    },
    draw: (c, p) => {
      const h = 1 - (p.hide || 0) * 0.65;
      c.save(); c.scale(1, h);
      D.stem(c, 0, 0, 0, -50, 9, "#f1e6d0");
      c.restore();
      c.save(); c.translate(0, -50 * h + 30);
      mushroom(c, p, "#c48ae8", null, { s: 0.65, noFace: (p.hide || 0) > 0.5 });
      c.restore();
    },
  });
  def("icecap", {
    name: "Frostcap", cost: 75, recharge: V, hp: 300, mushroom: true, instant: true,
    desc: "Freezes every zombie on the screen for a moment.", stats: "Freezes all, then slows",
    init: (p) => { p.t = 1; },
    update: (p, G, dt) => { p.t -= dt; if (p.t <= 0) { G.freezeAll(); G.removePlant(p); } },
    draw: (c, p) => {
      mushroom(c, p, "#6cc8f5", "#e6f8ff", { spots: "rgba(255,255,255,0.8)" });
      for (let i = 0; i < 4; i++) D.poly(c, [-24 + i * 16, -62, -20 + i * 16, -82, -16 + i * 16, -62], "#e8fbff", "#3a8ab8", 2);
    },
  });
  def("doom", {
    name: "Doomcap", cost: 125, recharge: V, hp: 300, mushroom: true, instant: true,
    desc: "Destroys everything in a huge area and leaves a crater.", stats: "Damage: massive, huge radius",
    init: (p) => { p.t = 1; },
    update: (p, G, dt) => {
      p.t -= dt;
      if (p.t <= 0) {
        G.blast(p.x, p.y, 265, 2.6, 1800);
        G.addCrater(p.row, p.col);
        G.boomFx(p.x, p.y - 40, 3, "120,60,160", true);
        G.sfx("doom"); G.shakeIt(18); G.flash("255,255,255", 0.9);
        G.removePlant(p);
      }
    },
    draw: (c, p) => {
      const sw = p.t < 1 ? 1 + (1 - p.t) * 0.3 : 1;
      c.save(); c.scale(sw, sw);
      mushroom(c, p, "#3b2a5a", "#c4b8d8", { spots: "#7a5aa8" });
      D.circle(c, 0, -54, 8, "#e8e0f0", null, 0); D.circle(c, -3, -55, 2, "#3b2a5a", null, 0); D.circle(c, 3, -55, 2, "#3b2a5a", null, 0);
      c.restore();
    },
  });

  /* ================= POOL ================= */
  def("lily", {
    name: "Lily Raft", cost: 25, recharge: F, hp: 300, aquatic: true, layer: "base",
    desc: "Lets you put other plants on the water.", stats: "Aquatic base",
    draw: (c) => {
      D.ellipse(c, 0, -8, 44, 14, "#4fae38", OUT, 3);
      c.beginPath(); c.moveTo(0, -8); c.lineTo(30, -16); c.lineWidth = 3; c.strokeStyle = "#2d7020"; c.stroke();
      D.ellipse(c, -10, -10, 16, 5, "rgba(255,255,255,0.16)", null, 0);
    },
  });
  def("squash", {
    name: "Squasher", cost: 50, recharge: S, hp: 300,
    desc: "Jumps on the first zombie that comes near and flattens it.", stats: "Damage: massive (one tile)",
    update: (p, G, dt) => {
      if (!p.state) {
        const z = G.firstInRange(p.row, p.x - 90, p.x + 115, "ground");
        if (z) { p.state = "aim"; p.t = 0.45; p.tx = z.x; p.target = z; G.say("Hmm!", { gap: 300 }); }
        return;
      }
      p.t -= dt;
      if (p.target && !p.target.dead) p.tx = p.target.x;
      if (p.state === "aim" && p.t <= 0) { p.state = "jump"; p.t = 0.45; p.x0 = p.x; }
      else if (p.state === "jump") {
        const k = 1 - p.t / 0.45;
        p.dx = (p.tx - p.x0) * k; p.dy = -Math.sin(k * Math.PI) * 90;
        if (p.t <= 0) { p.state = "land"; p.t = 0.5; G.blast(p.tx, p.y, 55, 0, 1800, "squash"); G.sfx("squash"); G.shakeIt(6); p.dy = 0; }
      } else if (p.state === "land" && p.t <= 0) G.removePlant(p);
    },
    drawOffset: (p) => [p.dx || 0, p.dy || 0],
    draw: (c, p) => {
      const sq = p.state === "land" ? 0.45 : 1;
      c.save(); c.scale(1 + (1 - sq) * 0.6, sq);
      D.rr(c, -28, -64, 56, 64, 24, "#5fae3c", OUT, 3);
      D.rr(c, -20, -60, 10, 54, 5, "rgba(255,255,255,0.12)", null, 0);
      D.line(c, 0, -64, 4, -78, "#3a7a22", 5);
      D.eyes(c, 0, -40, 7, p.state ? 1 : 1, { angry: true });
      D.line(c, -8, -22, 8, -24, OUT, 3);
      c.restore();
    },
  });
  def("trio", {
    name: "Trio Popper", cost: 325, recharge: F, hp: 300,
    desc: "Shoots peas in three lanes at once.", stats: "Damage: normal (3 lanes)",
    update: (p, G, dt) => {
      p.t -= dt;
      if (p.t > 0) return;
      const rows = [p.row - 1, p.row, p.row + 1].filter((r) => G.rowOk(r));
      if (rows.some((r) => G.anyAhead(r, p.x, 2000, "straight"))) {
        const [x, y] = muzzle(p, G, 30, 56);
        rows.forEach((r) => G.shoot("pea", x, y + (r - p.row) * 22, r, { fromY: y + (r - p.row) * 22 }));
        p.anim = 0.25; p.t = PEA_RATE;
      } else p.t = 0.15;
    },
    draw: (c, p) => {
      baseLeaves(c);
      D.stem(c, 0, -2, 0, -38, 8, GREEN2);
      D.stem(c, 0, -34, -16, -64, 6, GREEN2); D.stem(c, 0, -34, 16, -60, 6, GREEN2);
      peaHead(c, p, GREEN, { hx: -14, hy: -76 });
      peaHead(c, p, GREEN, { hx: 14, hy: -66 });
      peaHead(c, p, GREEN, { hx: 0, hy: -42 });
    },
  });
  def("kelp", {
    name: "Kelp Snare", cost: 25, recharge: S, hp: 300, aquatic: true, waterOnly: true,
    desc: "Drags the first zombie that swims by under water.", stats: "Aquatic, single use",
    update: (p, G, dt) => {
      if (p.grab) { p.t -= dt; if (p.t <= 0) G.removePlant(p); return; }
      const z = G.firstInRange(p.row, p.x - 50, p.x + 70, "kelp");
      if (z) { G.drown(z); p.grab = z; p.t = 1.2; G.sfx("splash"); }
    },
    draw: (c, p) => {
      for (let i = -2; i <= 2; i++) {
        c.beginPath(); c.moveTo(i * 9, 0);
        c.quadraticCurveTo(i * 12 + Math.sin(p.age * 3 + i) * 8, -26, i * 7 + Math.sin(p.age * 2 + i) * 10, -46 - Math.abs(i) * -4);
        c.lineWidth = 9; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 5; c.strokeStyle = "#3aa25a"; c.stroke();
      }
      D.eyes(c, 0, -22, 5, 1);
    },
  });
  def("pepper", {
    name: "Fire Pepper", cost: 125, recharge: V, hp: 300, instant: true,
    desc: "Burns every zombie in its lane.", stats: "Damage: massive (whole lane)",
    init: (p) => { p.t = 1; },
    update: (p, G, dt) => { p.t -= dt; if (p.t <= 0) { G.burnRow(p.row); G.removePlant(p); } },
    draw: (c, p) => {
      const sw = p.t < 1 ? 1 + (1 - p.t) * 0.3 : 1;
      c.save(); c.scale(sw, sw);
      c.beginPath(); c.moveTo(-6, -84); c.bezierCurveTo(22, -78, 22, -20, 0, 0); c.bezierCurveTo(-22, -30, -24, -76, -6, -84);
      c.fillStyle = "#e02a20"; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
      D.line(c, -6, -84, 0, -96, "#3a7a22", 5);
      D.eyes(c, 0, -56, 5, 1, { angry: true });
      D.ellipse(c, -6, -66, 3, 10, "rgba(255,255,255,0.3)", null, 0);
      c.restore();
    },
  });
  def("spike", {
    name: "Spikegrass", cost: 100, recharge: F, hp: 300, ground: true, spiky: 1,
    desc: "Hurts zombies that walk over it and pops vehicles. Cannot be eaten.", stats: "Damage: normal, all zombies on it",
    init: (p) => { p.t = 0; p.charges = 1; },
    update: (p, G, dt) => spikes(p, G, dt, 20),
    draw: (c, p) => spikeDraw(c, p, "#7a9a2a", "#cfe08a"),
  });
  function spikes(p, G, dt, dmg) {
    p.t -= dt;
    if (p.anim > 0) p.anim -= dt;
    for (const z of G.zombies) {
      if (z.row !== p.row || z.dead || z.hypno || Math.abs(z.x - p.x) > 55) continue;
      if (z.def.vehicle && G.targetable(z, "ground")) {
        G.popVehicle(z);
        p.charges--;
        if (p.charges <= 0) { G.removePlant(p); return; }
      }
    }
    if (p.t > 0) return;
    p.t = 1;
    let hit = false;
    for (const z of G.zombies) if (z.row === p.row && !z.hypno && Math.abs(z.x - p.x) < 55 && G.targetable(z, "ground")) { G.hurt(z, dmg, "spike"); hit = true; }
    if (hit) p.anim = 0.3;
  }
  function spikeDraw(c, p, col, tip) {
    const up = p.anim > 0 ? 6 : 0;
    for (let i = -3; i <= 3; i++) D.poly(c, [i * 12 - 6, 0, i * 12, -14 - up - (i % 2 ? 0 : 6), i * 12 + 6, 0], col, OUT, 2);
    for (let i = -3; i <= 3; i += 2) D.circle(c, i * 12, -16 - up, 2, tip, null, 0);
  }
  def("torch", {
    name: "Torchstump", cost: 175, recharge: F, hp: 300, torch: true,
    desc: "Peas that pass through it turn into fireballs.", stats: "Doubles pea damage",
    draw: (c, p) => {
      D.rr(c, -26, -50, 52, 50, 8, "#8a5a2b", OUT, 3);
      D.ellipse(c, 0, -50, 26, 8, "#c0864a", OUT, 3);
      for (let i = 0; i < 3; i++) D.line(c, -16 + i * 14, -40, -16 + i * 14, -8, "#6a4220", 2);
      D.eyes(c, 0, -28, 6, 1, { angry: true });
      for (let i = 0; i < 5; i++) {
        const f = Math.sin(p.age * 9 + i * 1.7);
        D.ellipse(c, -16 + i * 8, -62 - Math.abs(f) * 10, 8, 16 + f * 4, i % 2 ? "#ff9a1a" : "#ffd23a", null, 0);
      }
    },
  });
  def("tall", {
    name: "Tower Nut", cost: 125, recharge: S, hp: 8000, defensive: true, tall: true,
    desc: "A very tall nut that zombies cannot jump over.", stats: "Toughness: very high, blocks jumpers",
    draw: (c, p) => nutBody(c, p, 112, "#b7833a"),
  });

  /* ================= FOG ================= */
  def("sea", {
    name: "Seacap", cost: 0, recharge: S, hp: 300, mushroom: true, aquatic: true, waterOnly: true,
    desc: "A short range spore shooter that floats on water.", stats: "Range: 3 tiles, aquatic",
    update: (p, G, dt) => shooter(p, G, dt, { range: 330, fire: (p, G) => G.shoot("spore", p.x + 18, p.y - 16, p.row, { life: 330 }) }),
    draw: (c, p) => { D.ellipse(c, 0, -2, 30, 8, "#3a8a8a", OUT, 2.5); mushroom(c, p, "#3bc4a8", null, { s: 0.6 }); D.rr(c, 12, -22, 14, 10, 4, "#3bc4a8", OUT, 2); },
  });
  def("lantern", {
    name: "Lantern Bloom", cost: 25, recharge: S, hp: 300,
    desc: "Lights up the fog around it.", stats: "Clears fog in a large radius",
    draw: (c, p) => {
      baseLeaves(c);
      D.stem(c, 0, -2, 0, -40, 6, GREEN2);
      const g = 0.6 + Math.sin(p.age * 3) * 0.15;
      D.circle(c, 0, -62, 40, `rgba(255,240,150,${0.25 * g})`, null, 0);
      D.rr(c, -18, -84, 36, 44, 12, `rgba(255,236,120,${0.7 + g * 0.3})`, OUT, 3);
      D.line(c, -18, -62, 18, -62, "rgba(160,110,20,0.5)", 2);
      D.rr(c, -12, -92, 24, 9, 3, "#5c9a3a", OUT, 2.5);
      D.eyes(c, 0, -66, 5, 1);
    },
  });
  def("cactus", {
    name: "Needle Cactus", cost: 125, recharge: F, hp: 300,
    desc: "Shoots needles that pop balloons and hit ground zombies.", stats: "Damage: normal, hits balloons",
    update: (p, G, dt) => shooter(p, G, dt, { kind: "spike", fire: (p, G) => G.shoot("needle", p.x + 30, p.y - 64 * G.geo.scale, p.row) }),
    draw: (c, p) => {
      D.rr(c, -16, -86, 32, 86, 16, "#56a83a", OUT, 3);
      D.rr(c, -30, -58, 14, 30, 7, "#56a83a", OUT, 3); D.rr(c, 16, -66, 14, 26, 7, "#56a83a", OUT, 3);
      for (let i = 0; i < 6; i++) D.line(c, -16, -76 + i * 12, -22, -78 + i * 12, "#fff", 2);
      for (let i = 0; i < 6; i++) D.line(c, 16, -70 + i * 12, 22, -72 + i * 12, "#fff", 2);
      D.circle(c, 0, -90, 8, "#ff7ab0", OUT, 2);
      D.eyes(c, 2, -60, 5, 1);
    },
  });
  def("blover", {
    name: "Gust Clover", cost: 100, recharge: F, hp: 300, instant: true,
    desc: "Blows away all balloon zombies and clears the fog for a while.", stats: "Instant",
    init: (p) => { p.t = 1.4; p.blown = false; },
    update: (p, G, dt) => {
      p.t -= dt;
      if (!p.blown && p.t < 1.0) { p.blown = true; G.blowAway(); }
      if (p.t <= 0) G.removePlant(p);
    },
    draw: (c, p) => {
      baseLeaves(c); D.stem(c, 0, -2, 0, -46, 6, GREEN2);
      c.save(); c.translate(0, -56); c.rotate(p.blown ? p.age * 25 : Math.sin(p.age * 2) * 0.2);
      for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 2); D.circle(c, 0, -15, 13, "#3fbf4a", OUT, 2.5); }
      c.restore();
      D.circle(c, 0, -56, 8, "#2a9a3a", OUT, 2);
    },
  });
  def("split", {
    name: "Twin Popper", cost: 125, recharge: F, hp: 300,
    desc: "Shoots forward and twice backward.", stats: "Damage: normal, both directions",
    update: (p, G, dt) => {
      burst(p, G, dt, () => G.shoot("pea", p.x - 36, p.y - 56 * G.geo.scale, p.row, { dir: -1 }));
      p.t -= dt; p.t2 = (p.t2 || 0) - dt;
      if (p.t <= 0) {
        if (G.anyAhead(p.row, p.x, 2000, "straight")) { firePea("pea")(p, G); p.anim = 0.25; p.t = PEA_RATE; } else p.t = 0.15;
      }
      if (p.t2 <= 0) {
        if (G.anyBehind(p.row, p.x)) { G.shoot("pea", p.x - 36, p.y - 56 * G.geo.scale, p.row, { dir: -1 }); p.burstN = 1; p.burstT = 0.16; p.t2 = PEA_RATE; } else p.t2 = 0.15;
      }
    },
    draw: peaPlant(GREEN, { back: { tuft: null } }),
  });
  def("star", {
    name: "Star Fruit", cost: 125, recharge: F, hp: 300,
    desc: "Shoots stars in five directions.", stats: "Damage: normal (5 directions)",
    update: (p, G, dt) => {
      p.t -= dt;
      if (p.t > 0) return;
      if (G.starSees(p)) {
        const y = p.y - 44 * G.geo.scale;
        for (const [vx, vy] of [[-1, 0], [0, -1], [0, 1], [0.866, -0.5], [0.866, 0.5]]) G.shoot("star", p.x, y, p.row, { vx: vx * 400, vy: vy * 400 });
        p.anim = 0.25; p.t = PEA_RATE;
      } else p.t = 0.15;
    },
    draw: (c, p) => {
      baseLeaves(c);
      c.save(); c.translate(0, -42 + Math.sin(p.age * 2) * 2); c.rotate(Math.sin(p.age) * 0.1);
      const pts = [];
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 15 : 34; pts.push(Math.cos(a) * r, Math.sin(a) * r); }
      D.poly(c, pts, "#ffd23a", OUT, 3);
      D.eyes(c, 0, -4, 5, 1);
      c.restore();
    },
  });
  def("pumpkin", {
    name: "Gourd Shell", cost: 125, recharge: S, hp: 4000, layer: "shell", defensive: true,
    desc: "Protects the plant inside it.", stats: "Toughness: high, can hold another plant",
    draw: (c, p) => {
      const r = p.hp / p.maxHp;
      c.beginPath(); c.moveTo(-44, -6); c.bezierCurveTo(-52, -52, -30, -66, -20, -58); c.lineTo(-20, -6); c.closePath();
      c.fillStyle = "#f08a20"; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
      c.beginPath(); c.moveTo(44, -6); c.bezierCurveTo(52, -52, 30, -66, 20, -58); c.lineTo(20, -6); c.closePath();
      c.fill(); c.stroke();
      D.ellipse(c, 0, -14, 46, 16, "#f59a30", OUT, 3);
      D.poly(c, [-24, -18, -16, -24, -10, -16], "#5a2a00", null, 0); D.poly(c, [24, -18, 16, -24, 10, -16], "#5a2a00", null, 0);
      if (r < 0.5) D.line(c, -30, -24, -18, -8, OUT, 2.5);
    },
  });
  def("magnet", {
    name: "Magnetcap", cost: 100, recharge: F, hp: 300, mushroom: true,
    desc: "Pulls metal objects like buckets, helmets and doors off zombies.", stats: "Recharge after use: 15 s",
    update: (p, G, dt) => {
      if (p.t > 0) { p.t -= dt; if (p.t <= 0) p.item = null; return; }
      const it = G.magnetPull(p);
      if (it) { p.item = it; p.t = 15; G.sfx("magnet"); }
    },
    draw: (c, p) => {
      mushroom(c, p, "#8a5fc0", null, { s: 0.75 });
      c.save(); c.translate(0, -66);
      c.beginPath(); c.arc(0, 0, 16, Math.PI, 0); c.lineWidth = 11; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 7; c.strokeStyle = p.gold ? "#ffcc30" : "#d83030"; c.stroke();
      D.rr(c, -20, -2, 9, 8, 2, "#ddd", OUT, 2); D.rr(c, 11, -2, 9, 8, 2, "#ddd", OUT, 2);
      c.restore();
      if (p.item) GS.drawItem(c, p.item, 0, -96, 0.6);
    },
  });

  /* ================= ROOF ================= */
  def("cabbage", {
    name: "Cabbage Catapult", cost: 100, recharge: F, hp: 300, lobber: true,
    desc: "Lobs cabbages over obstacles.", stats: "Damage: double",
    update: (p, G, dt) => lobber(p, G, dt, () => "cabbage", 3),
    draw: (c, p) => catapult(c, p, (c, x, y) => { D.circle(c, x, y, 11, "#8fd85a", OUT, 2.5); D.line(c, x - 5, y - 6, x + 3, y + 6, "#5a9a2a", 2); }),
  });
  function lobber(p, G, dt, kind, rate) {
    if (p.anim > 0) p.anim -= dt;
    p.t -= dt;
    if (p.t > 0) return;
    const z = G.lobTarget(p.row, p.x);
    if (z) { G.lob(kind(), p, z); p.anim = 0.4; p.t = rate; G.sfx("lob"); } else p.t = 0.2;
  }
  def("pot", {
    name: "Clay Pot", cost: 25, recharge: F, hp: 300, layer: "base",
    desc: "Lets you plant on the roof.", stats: "Roof base",
    draw: (c) => {
      D.poly(c, [-28, -34, 28, -34, 20, 0, -20, 0], "#c86a3a", OUT, 3);
      D.rr(c, -32, -42, 64, 12, 4, "#d97a48", OUT, 3);
      D.ellipse(c, 0, -40, 26, 4, "#5a3018", null, 0);
    },
  });
  def("corn", {
    name: "Corn Catapult", cost: 100, recharge: F, hp: 300, lobber: true,
    desc: "Lobs kernels and sometimes butter that holds zombies in place.", stats: "Damage: light, butter stuns",
    update: (p, G, dt) => lobber(p, G, dt, () => (U.chance(0.25) ? "butter" : "kernel"), 3),
    draw: (c, p) => catapult(c, p, (c, x, y) => { D.rr(c, x - 7, y - 7, 14, 12, 3, "#ffe680", OUT, 2); }),
  });
  def("coffee", {
    name: "Wake Bean", cost: 75, recharge: F, hp: 300, layer: "extra",
    desc: "Wakes up a sleeping mushroom. Plant it on the mushroom.", stats: "Single use",
    init: (p) => { p.t = 1.1; },
    update: (p, G, dt) => {
      p.t -= dt;
      if (p.t <= 0) { const m = G.cells[p.row][p.col].main; if (m) { m.asleep = false; m.coffee = true; } G.sfx("menuOk"); G.removePlant(p); }
    },
    draw: (c, p) => {
      c.save(); c.translate(0, -76);
      D.ellipse(c, 0, 0, 13, 17, "#6a3a1a", OUT, 3);
      c.beginPath(); c.moveTo(0, -14); c.quadraticCurveTo(-6, 0, 0, 14); c.lineWidth = 2.5; c.strokeStyle = "#3a1a08"; c.stroke();
      D.eyes(c, 4, -2, 4, 1);
      c.restore();
    },
  });
  def("garlic", {
    name: "Garlic Clove", cost: 50, recharge: F, hp: 400,
    desc: "Zombies that bite it walk into another lane.", stats: "Diverts zombies",
    onBite: (p, G, z) => { if (z.def.noDivert) return false; if (!z.garlicT) z.garlicT = 0.6; return false; },
    draw: (c, p) => {
      const r = p.hp / p.maxHp;
      c.beginPath(); c.moveTo(0, -78); c.bezierCurveTo(10, -62, 34, -48, 26, -14); c.quadraticCurveTo(0, 6, -26, -14); c.bezierCurveTo(-34, -48, -10, -62, 0, -78);
      c.fillStyle = "#f5f0e4"; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
      D.line(c, 0, -70, 0, -10, "rgba(160,140,110,0.6)", 2);
      D.eyes(c, 0, -36, 5, 1, { closed: r < 0.4 });
    },
  });
  def("umbrella", {
    name: "Shield Leaf", cost: 100, recharge: F, hp: 300, umbrella: true,
    desc: "Protects nearby plants from bungee zombies and basketballs.", stats: "Protects 3x3 tiles",
    update: (p, G, dt) => { if (p.anim > 0) p.anim -= dt; },
    draw: (c, p) => {
      baseLeaves(c); D.stem(c, 0, -2, 0, -36, 6, GREEN2);
      D.eyes(c, 0, -28, 5, 1);
      const up = p.anim > 0 ? 1 : 0;
      c.save(); c.translate(0, -40 - up * 30); c.scale(1 + up * 0.6, 1);
      c.beginPath(); c.moveTo(-40, 0); c.quadraticCurveTo(0, -36, 40, 0); c.quadraticCurveTo(0, -8, -40, 0);
      c.fillStyle = "#5cbd3a"; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
      c.restore();
    },
  });
  def("marigold", {
    name: "Coin Flower", cost: 50, recharge: S, hp: 300,
    desc: "Drops silver and gold coins.", stats: "Makes money",
    init: (p) => { p.t = U.rand(10, 20); },
    update: (p, G, dt) => { p.t -= dt; if (p.t <= 0) { p.t = 24; G.addCoin(p.x, p.y - 50, U.chance(0.2) ? "gold" : "silver"); } },
    draw: (c, p) => {
      baseLeaves(c); D.stem(c, 0, -2, 0, -40, 6, GREEN2);
      c.save(); c.translate(0, -54); c.rotate(Math.sin(p.age * 1.4) * 0.1);
      for (let i = 0; i < 14; i++) { c.save(); c.rotate((i / 14) * U.TAU); D.ellipse(c, 0, -18, 6, 11, i % 2 ? "#ff9a1a" : "#ffc02a", "#a85a00", 1.5); c.restore(); }
      D.circle(c, 0, 0, 12, "#ffe14a", "#a85a00", 2.5);
      D.eyes(c, 0, -2, 4, 1);
      c.restore();
    },
  });
  def("melon", {
    name: "Melon Catapult", cost: 300, recharge: F, hp: 300, lobber: true,
    desc: "Lobs heavy melons that also hurt zombies nearby.", stats: "Damage: heavy, splash",
    update: (p, G, dt) => lobber(p, G, dt, () => "melon", 3),
    draw: (c, p) => catapult(c, p, (c, x, y) => { D.ellipse(c, x, y, 15, 12, "#4fae38", OUT, 2.5); D.line(c, x - 8, y - 6, x + 8, y + 6, "#2a6a1a", 2); }),
  });

  /* ================= UPGRADES ================= */
  def("twinsun", {
    name: "Twin Sunbloom", cost: 150, recharge: V, hp: 300, upgradeOf: "sunbloom", sun: true, price: 3000,
    desc: "Makes twice as much sun. Plant it on a Sunbloom.", stats: "Sun production: double",
    init: (p) => { p.t = U.rand(3, 10); },
    update: (p, G, dt) => {
      p.t -= dt; if (p.glow > 0) p.glow -= dt;
      if (p.t <= 0) { p.t = 24; p.glow = 1; G.addSun(p.x - 15, p.y - 60, 25, { pop: true }); G.addSun(p.x + 15, p.y - 60, 25, { pop: true }); }
    },
    draw: (c, p) => { baseLeaves(c); D.stem(c, 0, -2, -14, -54, 6, GREEN2); D.stem(c, 0, -2, 14, -54, 6, GREEN2); sunHead(c, p, -20, -62, 0.78); sunHead(c, p, 20, -62, 0.78); },
  });
  def("gatling", {
    name: "Quad Popper", cost: 250, recharge: V, hp: 300, upgradeOf: "double", price: 5000,
    desc: "Fires four peas at a time. Plant it on a Double Popper.", stats: "Damage: normal (x4)",
    update: (p, G, dt) => shooter(p, G, dt, { fire: firePea("pea"), n: 4 }),
    draw: peaPlant("#4fb52c", { helmet: "#3a6a24", barrels: 2, angry: true }),
  });
  def("gloom", {
    name: "Gloomcap", cost: 150, recharge: V, hp: 300, mushroom: true, upgradeOf: "fume", price: 7500,
    desc: "Releases fumes in all directions. Plant it on a Fumecap.", stats: "Hits everything around it",
    update: (p, G, dt) => {
      if (p.anim > 0) p.anim -= dt;
      p.t -= dt;
      if (p.t > 0) return;
      if (G.zombies.some((z) => G.inGloom(p, z))) { p.anim = 0.8; p.t = 2; p.puffs = 4; p.pt = 0; } else p.t = 0.2;
    },
    tick: (p, G, dt) => {
      if (!(p.puffs > 0)) return;
      p.pt -= dt;
      if (p.pt <= 0) { p.pt = 0.2; p.puffs--; for (const z of G.zombies) if (G.inGloom(p, z)) G.hurt(z, 20, "fume"); }
    },
    draw: (c, p) => {
      mushroom(c, p, "#5a2f8a", "#c9b4e0", { spots: "#a37ad8" });
      for (let i = 0; i < 5; i++) { c.save(); c.translate(0, -50); c.rotate(-1.2 + i * 0.6); D.rr(c, -5, -46, 10, 18, 4, "#5a2f8a", OUT, 2); c.restore(); }
      if (p.anim > 0) for (let i = 0; i < 10; i++) { const a = (i / 10) * U.TAU, r = 40 + (0.8 - p.anim) * 140; D.circle(c, Math.cos(a) * r, -40 + Math.sin(a) * r * 0.7, 20, `rgba(190,130,255,${p.anim * 0.6})`, null, 0); }
    },
  });
  def("cattail", {
    name: "Reed Cat", cost: 225, recharge: V, hp: 300, upgradeOf: "lily", aquatic: true, price: 10000,
    desc: "Shoots homing spikes at any zombie and pops balloons. Plant it on a Lily Raft.", stats: "Damage: normal (x2), any lane",
    update: (p, G, dt) => {
      burst(p, G, dt, () => { const z = G.anyTarget(true); if (z) G.shoot("homing", p.x + 10, p.y - 56, p.row, { target: z }); });
      p.t -= dt;
      if (p.t > 0) return;
      const z = G.anyTarget(true);
      if (z) { G.shoot("homing", p.x + 10, p.y - 56, p.row, { target: z }); p.burstN = 1; p.burstT = 0.2; p.t = PEA_RATE; p.anim = 0.25; } else p.t = 0.2;
    },
    draw: (c, p) => {
      D.ellipse(c, 0, -6, 42, 13, "#4fae38", OUT, 3);
      D.ellipse(c, 0, -32, 22, 26, "#f2a5c8", OUT, 3);
      D.poly(c, [-18, -50, -12, -66, -4, -54], "#f2a5c8", OUT, 2.5); D.poly(c, [18, -50, 12, -66, 4, -54], "#f2a5c8", OUT, 2.5);
      D.eyes(c, 2, -38, 5, 1);
      c.beginPath(); c.moveTo(-20, -20); c.quadraticCurveTo(-46, -50 + Math.sin(p.age * 3) * 6, -30, -76); c.lineWidth = 6; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 3; c.strokeStyle = "#7a4a2a"; c.stroke();
      D.ellipse(c, -30, -80, 5, 11, "#6a3a1a", OUT, 2);
    },
  });
  def("wmelon", {
    name: "Frost Melon", cost: 200, recharge: V, hp: 300, lobber: true, upgradeOf: "melon", price: 10000,
    desc: "Lobs frozen melons that slow down every zombie they splash. Plant it on a Melon Catapult.", stats: "Damage: heavy, splash, slows",
    update: (p, G, dt) => lobber(p, G, dt, () => "wmelon", 3),
    draw: (c, p) => catapult(c, p, (c, x, y) => { D.ellipse(c, x, y, 15, 12, "#9ad8ff", OUT, 2.5); D.line(c, x - 8, y - 6, x + 8, y + 6, "#3a7aa0", 2); }),
  });
  def("goldmag", {
    name: "Gold Magnet", cost: 50, recharge: V, hp: 300, upgradeOf: "magnet", price: 3000,
    desc: "Collects coins for you. Plant it on a Magnetcap.", stats: "Collects coins",
    init: (p) => { p.gold = true; p.t = 2; },
    update: (p, G, dt) => { p.t -= dt; if (p.t <= 0) { p.t = 2.5; G.magnetCoin(p); } },
    draw: (c, p) => { D.circle(c, 0, -40, 26, "#ffd23a", OUT, 3); D.eyes(c, 0, -40, 5, 1); c.save(); c.translate(0, -70); c.beginPath(); c.arc(0, 0, 16, Math.PI, 0); c.lineWidth = 11; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 7; c.strokeStyle = "#ffcc30"; c.stroke(); c.restore(); },
  });
  def("spikerock", {
    name: "Spike Rock", cost: 125, recharge: V, hp: 300, ground: true, upgradeOf: "spike", spiky: 2, price: 7500,
    desc: "Stronger spikes that survive several vehicles. Plant it on Spikegrass.", stats: "Damage: double, pops 9 vehicles",
    init: (p) => { p.t = 0; p.charges = 9; },
    update: (p, G, dt) => spikes(p, G, dt, 40),
    draw: (c, p) => { for (let i = -2; i <= 2; i++) D.poly(c, [i * 15 - 9, 0, i * 15, -20 - (i % 2 ? 0 : 6) - (p.anim > 0 ? 6 : 0), i * 15 + 9, 0], "#6a6f7a", OUT, 2.5); },
  });
  def("cob", {
    name: "Corn Cannon", cost: 500, recharge: V, hp: 300, upgradeOf: "corn", wide: 2, price: 20000,
    desc: "Fire it anywhere: click the cannon, then the target. Plant it on two Corn Catapults side by side.", stats: "Damage: massive (3x3), reloads in 35 s",
    init: (p) => { p.t = 35; p.ready = false; },
    update: (p, G, dt) => { if (!p.ready) { p.t -= dt; if (p.t <= 0) { p.ready = true; G.sfx("arm"); } } },
    draw: (c, p) => {
      D.rr(c, -30, -26, 130, 26, 10, "#7ac24a", OUT, 3);
      D.circle(c, -10, -6, 12, "#5a3a1a", OUT, 2.5); D.circle(c, 80, -6, 12, "#5a3a1a", OUT, 2.5);
      c.save(); c.translate(36, -34); c.rotate(-0.25);
      D.rr(c, -46, -14, 92, 28, 14, p.ready ? "#ffd84a" : "#c8b060", OUT, 3);
      for (let i = 0; i < 6; i++) D.line(c, -36 + i * 14, -12, -36 + i * 14, 12, "rgba(160,120,20,0.6)", 2);
      c.restore();
      D.eyes(c, 20, -16, 5, 1);
      if (!p.ready && p.t !== undefined) { D.rr(c, -10, 4, 90, 6, 3, "#333", null, 0); D.rr(c, -10, 4, 90 * (1 - p.t / 35), 6, 3, "#ffd23a", null, 0); }
    },
  });

  /* ---------- hidden plants: bowling nuts ---------- */
  def("bnut", { name: "Blast Nut", cost: 0, hidden: true, hp: 4000, desc: "Explodes on contact.", draw: (c, p) => nutBody(c, p, 74, "#d8463a", { angry: true }) });
  def("gnut", { name: "Giant Nut", cost: 0, hidden: true, hp: 4000, desc: "Rolls over everything.", draw: (c, p) => { c.save(); c.scale(1.8, 1.8); nutBody(c, p, 74, "#a8743a"); c.restore(); } });

  /* ---------- metal items (drawn on zombies, in magnets) ---------- */
  GS.drawItem = function (c, kind, x, y, s = 1) {
    c.save(); c.translate(x, y); c.scale(s, s);
    if (kind === "bucket") { D.poly(c, [-20, 14, 20, 14, 16, -18, -16, -18], "#a8b0bc", OUT, 3); D.rr(c, -22, 10, 44, 6, 2, "#8a929e", OUT, 2); }
    else if (kind === "helmet") { c.beginPath(); c.arc(0, 6, 22, Math.PI, 0); c.closePath(); c.fillStyle = "#c83030"; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke(); D.line(c, 0, -16, 0, 6, "#fff", 3); }
    else if (kind === "door") { D.rr(c, -22, -34, 44, 68, 3, "#d8dce2", OUT, 3); for (let i = 0; i < 5; i++) D.line(c, -20, -26 + i * 13, 20, -26 + i * 13, "#9aa0aa", 1.5); D.circle(c, 14, 0, 3, "#666", null, 0); }
    else if (kind === "ladder") { D.line(c, -12, -36, -12, 36, "#b0b4ba", 5); D.line(c, 12, -36, 12, 36, "#b0b4ba", 5); for (let i = 0; i < 5; i++) D.line(c, -12, -28 + i * 14, 12, -28 + i * 14, "#b0b4ba", 4); }
    else if (kind === "pogo") { D.line(c, 0, -36, 0, 30, "#9aa0aa", 5); D.line(c, -12, -28, 12, -28, "#9aa0aa", 5); D.line(c, -6, 20, 6, 24, "#555", 4); }
    else if (kind === "jack") { D.rr(c, -16, -16, 32, 32, 4, "#4a6ad8", OUT, 3); D.line(c, 16, 0, 26, 0, "#999", 3); }
    else if (kind === "pick") { D.line(c, 0, -26, 0, 26, "#8a5a2b", 5); c.beginPath(); c.arc(0, -10, 22, -2.6, -0.5); c.lineWidth = 6; c.strokeStyle = "#9aa0aa"; c.stroke(); }
    c.restore();
  };
})(window.GS);
