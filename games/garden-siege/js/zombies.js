/* Garden Siege: all zombies – stats, special behaviour and drawing; the final boss Dr. Zed */
"use strict";

(function (GS) {
  const { U, D } = GS;
  const Z = (GS.ZOMBIES = {});
  const ZORDER = (GS.ZOMBIE_ORDER = []);
  const OUT = D.OUT;
  const SPEED = 16.5; // px per second for a normal zombie

  function def(id, o) {
    o.id = id;
    o.hp = o.hp || 270;
    o.speed = (o.speed || 1) * SPEED;
    o.look = o.look || {};
    Z[id] = o;
    if (!o.hidden) ZORDER.push(id);
  }

  /* ---------- drawing ---------- */
  const SKIN = "#a9bb8e", SKIN_SLOW = "#9cc8e8", SKIN_HYP = "#c9a2dc";
  function zombieBody(c, z, L) {
    const ph = z.walk || 0, eat = z.state === "eat", sw = Math.sin(ph) * (z.moving ? 1 : 0.15);
    const skin = z.hypno ? SKIN_HYP : z.slowT > 0 || z.freezeT > 0 ? SKIN_SLOW : L.skin || SKIN;
    const coat = L.coat || "#6d5a3c", pants = L.pants || "#4a4a5a";
    const bob = eat ? Math.sin(z.age * 14) * 3 : Math.abs(Math.cos(ph)) * 2;
    // legs
    c.lineCap = "round";
    for (const s of [1, -1]) {
      const fx = s * sw * 12;
      c.beginPath(); c.moveTo(s * 5, -46); c.lineTo(fx + s * 3, -6);
      c.lineWidth = 13; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 9; c.strokeStyle = pants; c.stroke();
      D.ellipse(c, fx + s * 3 - 6, -4, 11, 6, "#3a2a1e", OUT, 2.5);
    }
    c.save(); c.translate(0, -bob);
    // back arm
    if (!L.noArms) { D.line(c, 8, -86, -10 + sw * 8, -60, OUT, 11); D.line(c, 8, -86, -10 + sw * 8, -60, skin, 7); }
    // torso
    D.rr(c, -17, -96, 34, 52, 9, coat, OUT, 3);
    if (!L.noShirt) { D.poly(c, [-7, -95, 7, -95, 0, -70], L.shirt || "#e8e4d8", null, 0); D.poly(c, [-3, -92, 3, -92, 4, -64, 0, -58, -4, -64], L.tie || "#b8282a", OUT, 1.5); }
    if (L.body) L.body(c, z, skin);
    // head
    c.save(); c.translate(-4, -114 + (eat ? Math.sin(z.age * 14) * 2 : 0));
    if (!z.headless) {
      D.ellipse(c, 0, 0, 20, 22, skin, OUT, 3);
      D.ellipse(c, -6, 14, 13, 8, skin, OUT, 3);
      for (let i = 0; i < 3; i++) D.rr(c, -14 + i * 6, 8, 5, 6, 1, "#f2f0e0", null, 0);
      D.circle(c, -10, -4, 6.5, "#fff", OUT, 2); D.circle(c, -11, -4, 2.5, "#222", null, 0);
      D.circle(c, 3, -5, 4.5, "#fff", OUT, 2); D.circle(c, 2, -5, 2, "#222", null, 0);
      if (L.hair !== false) for (let i = 0; i < 3; i++) D.line(c, 4 + i * 4, -20, 6 + i * 5, -27, OUT, 2);
      if (L.head) L.head(c, z);
      if (z.butterT > 0) D.ellipse(c, 0, -18, 14, 7, "#ffe680", OUT, 2);
    }
    c.restore();
    // front arm
    if (!L.noArms) {
      const ax = eat ? -36 + Math.sin(z.age * 14) * 6 : -34, ay = eat ? -86 : -80 + sw * 4;
      if (!z.armLost) { D.line(c, -8, -86, ax, ay, OUT, 11); D.line(c, -8, -86, ax, ay, skin, 7); D.circle(c, ax - 2, ay, 6, skin, OUT, 2); }
      else { D.line(c, -8, -86, -16, -80, OUT, 11); D.line(c, -8, -86, -16, -80, skin, 7); }
    }
    if (L.front) L.front(c, z);
    c.restore();
  }

  const cone = (c) => { D.poly(c, [-18, -12, 18, -12, 2, -58], "#f07a20", OUT, 3); D.line(c, -10, -28, 12, -28, "#fff", 4); D.rr(c, -22, -16, 44, 7, 3, "#d8661a", OUT, 2); };
  const bucket = (c) => GS.drawItem(c, "bucket", 0, -26, 1);
  const helmet = (c) => GS.drawItem(c, "helmet", 0, -10, 1.15);

  // generic draw that uses the look table; armor is shown as long as it lasts
  function drawStd(c, z) {
    zombieBody(c, z, z.def.look);
  }

  /* ---------- the zombies ---------- */
  def("walker", { name: "Walker", desc: "A regular zombie. Slow, hungry and not very bright.", tough: "Low", swim: true });
  def("flag", { name: "Flag Bearer", desc: "Marks the arrival of a big wave of zombies.", speed: 1.15, tough: "Low", swim: true,
    look: { front: (c, z) => { D.line(c, 22, -150, 22, -20, "#6a4a2a", 4); D.rr(c, 24, -150, 44, 30, 2, "#c82828", OUT, 2.5); D.brain(c, 46, -135); }, body: null } });
  def("cone", { name: "Cone Walker", desc: "Wears a traffic cone that takes some extra hits.", armor: { kind: "cone", hp: 370 }, tough: "Medium", swim: true });
  def("pole", { name: "Pole Jumper", desc: "Runs fast and vaults over the first plant in its way. Tall plants stop it.", hp: 430, speed: 2.1, tough: "Medium",
    look: { coat: "#e8e4d8", tie: "#2a8ad8", pants: "#3a3a8a", front: (c, z) => { if (!z.jumped) D.line(c, -50, -90, 60, -70, "#c8a050", 5); } },
    update: (z, G, dt) => {
      if (z.jump) return jumpStep(z, G, dt, () => { z.jumped = true; z.speed = SPEED * z.mul; });
      return false;
    },
    onPlant: (z, G, p) => {
      if (z.jumped) return false;
      if (p.def.tall) { z.jumped = true; z.speed = SPEED * z.mul; G.sfx("bonk"); return false; }
      startJump(z, 0.9, 150, 90); G.sfx("lob");
      return true;
    } });
  def("bucket", { name: "Pail Walker", desc: "A metal pail makes it very tough.", armor: { kind: "bucket", hp: 1100 }, tough: "High", swim: true });
  def("paper", { name: "Paper Reader", desc: "Gets angry and fast when its newspaper is destroyed.", armor: { kind: "paper", hp: 150 }, tough: "Low", speed: 0.9,
    look: { coat: "#5a6a7a", front: (c, z) => { if (z.armor) { D.rr(c, -46, -100, 36, 44, 2, "#f0ece0", OUT, 2.5); for (let i = 0; i < 4; i++) D.line(c, -42, -92 + i * 9, -16, -92 + i * 9, "#888", 1.5); } } },
    update: (z) => { if (!z.armor && !z.rage) { z.rage = true; z.pause = 1; z.speed = SPEED * 2.3 * z.mul; z.eatMul = 2; } return false; } });
  def("door", { name: "Door Shield", desc: "Carries a screen door that blocks straight shots. Lobbed and fume attacks go past it.", shield: { kind: "door", hp: 1100 }, tough: "High",
    look: { front: (c, z) => { if (z.shield) GS.drawItem(c, "door", -36, -74, 1.05); } } });
  def("football", { name: "Linebacker", desc: "Fast, and its helmet takes a lot of punishment.", armor: { kind: "helmet", hp: 1400 }, speed: 1.8, tough: "Very high",
    look: { coat: "#c83030", pants: "#ddd", noShirt: true, body: (c) => { D.rr(c, -22, -100, 44, 16, 8, "#c83030", OUT, 3); D.text(c, "7", 0, -70, 18, "#fff", "center", { outline: false }); } } });
  def("dancer", { name: "Disco Dancer", desc: "Calls up backup dancers around it.", hp: 500, tough: "Medium", noSwim: true,
    look: { coat: "#f2f2f2", tie: "#d82a2a", pants: "#f2f2f2", hair: false, head: (c) => { D.circle(c, 4, -16, 22, "#2a1a10", OUT, 2); D.circle(c, -8, -4, 6.5, "#fff", OUT, 2); } },
    update: (z, G, dt) => {
      if (z.pause > 0) return false;
      z.callT = (z.callT ?? 1.2) - dt;
      if (z.x < G.geo.x1 - 40 && z.callT <= 0) { z.callT = 8; if (G.summonDancers(z)) { z.pause = 1.2; G.sfx("jack"); } }
      return false;
    } });
  def("backup", { name: "Backup Dancer", desc: "Dances along with the Disco Dancer.", tough: "Low", noSwim: true,
    look: { coat: "#3a3a3a", tie: "#ffd23a", pants: "#3a3a3a", hair: false, head: (c) => { D.ellipse(c, 6, -18, 18, 10, "#2a1a10", OUT, 2); } } });
  def("floatie", { name: "Floatie", desc: "A walker with a rubber ring. Appears in the pool.", tough: "Low", water: true, look: {} });
  def("snorkel", { name: "Snorkeler", desc: "Swims under water where most plants cannot hit it.", tough: "Low", water: true,
    look: { head: (c) => { D.rr(c, -18, -12, 24, 12, 4, "rgba(150,220,255,0.6)", OUT, 2); D.line(c, 10, -10, 18, -40, "#f0a020", 5); } },
    update: (z, G) => { z.submerged = z.state !== "eat" && G.isWater(z.row); return false; } });
  def("zamboni", { name: "Ice Resurfacer", desc: "Crushes plants and leaves an ice trail. Spikes pop its tires.", hp: 1350, speed: 0.9, vehicle: true, tough: "High", noEat: true, noHypno: true, noSwim: true,
    update: (z, G, dt) => { vehicleCrush(z, G, dt); G.setIce(z.row, z.x - 40); return true; },
    draw: (c, z) => {
      D.rr(c, -70, -66, 130, 52, 10, "#5aa0d8", OUT, 3);
      D.rr(c, -40, -100, 70, 40, 8, "#3a7ab8", OUT, 3);
      D.rr(c, -32, -94, 30, 26, 4, "#cfefff", OUT, 2);
      D.circle(c, -44, -12, 14, "#333", OUT, 3); D.circle(c, 34, -12, 14, "#333", OUT, 3);
      D.rr(c, -82, -30, 20, 26, 4, "#cfd8e0", OUT, 2.5);
      c.save(); c.translate(10, -12); c.scale(0.6, 0.6); zombieBody(c, Object.assign({}, z, { state: "walk", moving: false }), { coat: "#3a6a9a" }); c.restore();
    } });
  def("bobsled", { name: "Bobsled Crew", desc: "Four zombies on a sled. They need an ice trail to ride on.", hp: 4 * 270, armor: { kind: "sled", hp: 300 }, speed: 2.4, tough: "Medium", noEat: true, noSwim: true, noHypno: true,
    update: (z, G, dt) => {
      z.x -= z.speed * dt;
      if (!z.armor || z.x < G.iceX(z.row) + 30) { G.splitSled(z); }
      return true;
    },
    draw: (c, z) => {
      for (let i = 0; i < 4; i++) { c.save(); c.translate(-36 + i * 26, 0); c.scale(0.7, 0.7); zombieBody(c, Object.assign({}, z, { state: "walk", moving: false }), Z.sledder.look); c.restore(); }
      if (z.armor) { D.rr(c, -70, -26, 130, 22, 10, "#d83a2c", OUT, 3); D.line(c, -78, -4, 70, -4, "#bbb", 4); }
    } });
  def("sledder", { name: "Sledder", hidden: true, desc: "", tough: "Low", noSwim: true, look: { coat: "#2a6ad8", head: (c) => { c.beginPath(); c.arc(0, -6, 21, Math.PI, 0); c.fillStyle = "#e8e8e8"; c.fill(); c.lineWidth = 2.5; c.strokeStyle = OUT; c.stroke(); } } });
  def("dolphin", { name: "Dolphin Rider", desc: "Rides a dolphin and jumps over the first plant in the water.", hp: 500, speed: 1, tough: "Medium", water: true,
    look: { coat: "#2a8a9a", front: (c, z) => { if (z.dolphin) { D.ellipse(c, -10, -20, 46, 14, "#6a8ab0", OUT, 3); D.poly(c, [-52, -24, -66, -20, -52, -16], "#6a8ab0", OUT, 2); D.circle(c, -40, -26, 2.5, "#111", null, 0); } } },
    init: (z) => { z.dolphin = true; z.speed = SPEED * 2.3 * z.mul; },
    update: (z, G, dt) => { if (z.jump) return jumpStep(z, G, dt, () => { z.dolphin = false; z.speed = SPEED * z.mul; }); return false; },
    onPlant: (z, G, p) => {
      if (!z.dolphin) return false;
      if (p.def.tall) { z.dolphin = false; z.speed = SPEED * z.mul; return false; }
      startJump(z, 0.8, 140, 70); G.sfx("splash");
      return true;
    } });
  def("jack", { name: "Jack-in-the-Box", desc: "Its music box explodes after a while and takes plants with it.", hp: 500, speed: 1.6, tough: "Medium", noSwim: true,
    look: { coat: "#8a3ab8", pants: "#5a2a8a", front: (c, z) => { if (z.box) GS.drawItem(c, "jack", -32, -64, 0.9); } },
    init: (z) => { z.box = true; z.jackT = U.rand(4, 16); },
    update: (z, G, dt) => {
      if (!z.box || z.x > G.geo.x1) return false;
      z.jackT -= dt;
      if (Math.random() < dt * 0.6) G.sfx("jack");
      if (z.jackT <= 0) { G.jackBoom(z); return true; }
      return false;
    } });
  def("balloon", { name: "Balloon Floater", desc: "Floats over your plants. Pop the balloon with needles or blow it away.", hp: 270, armor: { kind: "balloon", hp: 20 }, tough: "Low",
    look: { front: (c, z) => { if (z.flying) { D.line(c, 0, -120, 10, -190, "#555", 1.5); D.ellipse(c, 10, -210, 22, 26, "#e83040", OUT, 3); D.ellipse(c, 3, -218, 6, 9, "rgba(255,255,255,0.4)", null, 0); } } },
    init: (z) => { z.flying = true; },
    update: (z, G, dt) => { if (z.flying && !z.armor) { z.flying = false; z.fall = 0.6; } if (z.fall > 0) { z.fall -= dt; z.lift = Math.max(0, z.fall) * 100; } else if (z.flying) z.lift = 60 + Math.sin(z.age * 2) * 6; else z.lift = 0; return false; } });
  def("miner", { name: "Miner", desc: "Digs under your plants and attacks them from behind.", hp: 270, armor: { kind: "minerhat", hp: 100 }, tough: "Medium", noSwim: true,
    look: { coat: "#8a6a3a", head: (c, z) => { c.beginPath(); c.arc(0, -8, 21, Math.PI, 0); c.fillStyle = "#e8c030"; c.fill(); c.lineWidth = 2.5; c.strokeStyle = OUT; c.stroke(); D.circle(c, -14, -14, 4, "#fff8a0", OUT, 1.5); }, front: (c, z) => { if (z.pick) GS.drawItem(c, "pick", -30, -86, 0.8); } },
    init: (z) => { z.pick = true; z.underground = true; z.speed = SPEED * 3 * z.mul; },
    update: (z, G, dt) => {
      if (z.emerge > 0) { z.emerge -= dt; if (z.emerge <= 0) z.underground = false; return true; }
      if (z.underground) {
        if (!z.pick) { z.emerge = 0.8; z.speed = SPEED * z.mul; G.sfx("shovel"); return true; }
        z.x -= z.speed * dt;
        if (Math.random() < dt * 8) G.dirt(z.x, z.y);
        if (z.x < G.geo.x0 + 30) { z.emerge = 1; z.dir = 1; z.speed = SPEED * z.mul; G.sfx("shovel"); }
        return true;
      }
      if (z.dir > 0 && z.x > U.W + 60) z.escaped = true;
      return false;
    } });
  def("pogo", { name: "Pogo Hopper", desc: "Hops over every plant. Tall plants and magnets stop it.", hp: 500, speed: 1.4, tough: "Medium", noSwim: true,
    look: { coat: "#d8a030", front: (c, z) => { if (z.pogo) GS.drawItem(c, "pogo", 0, -40 + (z.hop || 0) * 0.2, 1); } },
    init: (z) => { z.pogo = true; },
    update: (z, G, dt) => {
      if (z.jump) return jumpStep(z, G, dt, () => {});
      z.hop = z.pogo ? Math.abs(Math.sin(z.age * 6)) * 30 : 0;
      if (!z.pogo && z.speed > SPEED * z.mul) z.speed = SPEED * z.mul;
      return false;
    },
    onPlant: (z, G, p) => {
      if (!z.pogo) return false;
      if (p.def.tall) { z.pogo = false; z.hop = 0; G.sfx("bonk"); return false; }
      startJump(z, 0.6, 110, 100);
      return true;
    } });
  def("yeti", { name: "Yeti", desc: "A rare sight. It runs away if you do not defeat it quickly, and drops diamonds.", hp: 1350, speed: 0.8, tough: "High", noSwim: true,
    look: { coat: "#e8f0f8", pants: "#e8f0f8", skin: "#d8e8f8", noShirt: true, hair: false, head: (c) => { D.circle(c, 2, -6, 22, "#f0f6ff", OUT, 2); D.circle(c, -10, -4, 6, "#fff", OUT, 2); D.circle(c, -11, -4, 2.5, "#222", null, 0); } },
    update: (z, G) => { if (z.age > 35 && z.dir < 0 && !z.hypno) z.dir = 1; if (z.dir > 0 && z.x > U.W + 60) z.escaped = true; return false; } });
  def("bungee", { name: "Bungee Dropper", desc: "Drops from the sky and steals a plant. Shield Leaves stop it.", hp: 450, tough: "Medium", noHypno: true, noEat: true,
    update: (z, G, dt) => bungeeStep(z, G, dt),
    draw: (c, z) => {
      const h = z.drop || 0;
      if (z.phase === "warn") { D.ellipse(c, 0, -8, 30 + Math.sin(z.age * 10) * 4, 10, "rgba(0,0,0,0.3)", null, 0); D.text(c, "!", 0, -40, 30, "#ff4040"); return; }
      c.save(); c.translate(0, -h);
      D.line(c, 0, -150, 0, -900, "#333", 2);
      c.save(); c.scale(1, -1); c.translate(0, 150); zombieBody(c, Object.assign({}, z, { state: "walk", moving: false }), { coat: "#2a8a4a", noArms: false }); c.restore();
      if (z.carry) { c.save(); c.translate(0, -10); c.scale(0.8, 0.8); z.carry.def.draw(c, z.carry); c.restore(); }
      c.restore();
    } });
  def("ladder", { name: "Ladder Carrier", desc: "Puts a ladder on your defensive plants so others can climb over them.", hp: 500, shield: { kind: "ladder", hp: 500 }, speed: 1.5, tough: "Medium", noSwim: true,
    look: { coat: "#3a7a3a", front: (c, z) => { if (z.shield) GS.drawItem(c, "ladder", -34, -70, 1); } },
    update: (z, G, dt) => {
      if (z.placing > 0) { z.placing -= dt; if (z.placing <= 0) { z.placeOn.ladder = true; z.shield = null; z.speed = SPEED * z.mul; G.sfx("metal"); } return true; }
      if (!z.shield && z.speed > SPEED * z.mul) z.speed = SPEED * z.mul;
      return false;
    },
    onPlant: (z, G, p) => {
      if (!z.shield || !p.def.defensive || p.ladder) return false;
      z.placing = 0.8; z.placeOn = p;
      return true;
    } });
  def("catapult", { name: "Basket Catapult", desc: "Lobs basketballs at your plants from a distance. Spikes pop it.", hp: 850, speed: 0.8, vehicle: true, tough: "Medium", noEat: true, noHypno: true, noSwim: true,
    init: (z) => { z.balls = 20; z.throwT = 2; },
    update: (z, G, dt) => {
      const stopX = G.colX(7) + 30;
      if (z.balls > 0 && z.x <= stopX) {
        z.throwT -= dt;
        if (z.anim > 0) z.anim -= dt;
        if (z.throwT <= 0) { z.throwT = 3; if (G.basketball(z)) { z.balls--; z.anim = 0.5; } }
        return true;
      }
      vehicleCrush(z, G, dt);
      return true;
    },
    draw: (c, z) => {
      D.rr(c, -60, -50, 120, 36, 8, "#8a5a2b", OUT, 3);
      D.circle(c, -40, -12, 14, "#333", OUT, 3); D.circle(c, 40, -12, 14, "#333", OUT, 3);
      c.save(); c.translate(-10, -50); c.rotate(z.anim > 0 ? -1.2 * (z.anim / 0.5) : -0.2);
      D.line(c, 0, 0, -60, -10, "#6a4a2a", 7); D.ellipse(c, -64, -14, 14, 8, "#5a3a1a", OUT, 2);
      if (z.balls > 0 && !(z.anim > 0.25)) D.circle(c, -64, -24, 10, "#f08a20", OUT, 2);
      c.restore();
      c.save(); c.translate(30, -30); c.scale(0.6, 0.6); zombieBody(c, Object.assign({}, z, { state: "walk", moving: false }), { coat: "#3a3a8a" }); c.restore();
    } });
  def("giant", { name: "Gargantuar", desc: "Huge and very tough. Smashes plants flat and throws an imp when hurt.", hp: 3000, speed: 0.75, tough: "Extreme", noEat: true, noSwim: true, scale: 1.45, noHypno: false,
    look: { coat: "#7a6a4a", noShirt: true, pants: "#5a4a3a", front: (c, z) => { if (!z.thrown) { c.save(); c.translate(26, -98); c.scale(0.45, 0.45); zombieBody(c, Object.assign({}, z, { state: "walk", moving: false }), Z.imp.look); c.restore(); } c.save(); c.translate(-34, -92); c.rotate(z.smash ? -2.2 + Math.min(1, z.smash.t / 0.9) * 2.6 : -0.3); D.rr(c, -6, -70, 12, 74, 5, "#8a6a4a", OUT, 3); c.restore(); } },
    update: (z, G, dt) => giantStep(z, G, dt),
    onPlant: (z, G, p) => { z.smash = { t: 0, p }; return true; } });
  def("redeye", { name: "Red-Eye Gargantuar", desc: "An even bigger and angrier Gargantuar.", hp: 6000, speed: 0.75, tough: "Extreme", noEat: true, noSwim: true, scale: 1.5,
    look: { coat: "#6a3a3a", noShirt: true, pants: "#4a2a2a", skin: "#b8a08e", front: (c, z) => Z.giant.look.front(c, z), head: (c) => { D.circle(c, -10, -4, 3, "#ff2020", null, 0); D.circle(c, 3, -5, 2.5, "#ff2020", null, 0); } },
    update: (z, G, dt) => giantStep(z, G, dt),
    onPlant: (z, G, p) => { z.smash = { t: 0, p }; return true; } });
  def("imp", { name: "Imp", desc: "Small and quick. Gets thrown into your garden by Gargantuars.", hp: 270, speed: 1.3, tough: "Low", scale: 0.7, noSwim: true, look: { coat: "#c8b08a", noShirt: true } });
  def("peahead", { name: "Pea Head", desc: "A zombie with a Pea Popper for a head. It shoots at your plants.", hp: 270, tough: "Low", noSwim: true,
    look: { hair: false, head: (c, z) => { D.circle(c, 0, -6, 22, "#62c23a", OUT, 3); D.rr(c, -42, -16, 26, 18, 6, "#62c23a", OUT, 3); D.circle(c, -6, -10, 4, "#fff", OUT, 1.5); } },
    update: (z, G, dt) => {
      z.shootT = (z.shootT ?? 1) - dt;
      if (z.shootT <= 0 && !z.hypno && z.x < G.geo.x1) { z.shootT = 1.425; if (G.plantAhead(z)) G.shoot("zpea", z.x - 50, z.y - 118, z.row, { dir: -1 }); }
      return false;
    } });
  def("nuthead", { name: "Nut Head", desc: "A zombie with a Stone Nut for a head. Very hard to stop.", hp: 270, armor: { kind: "nut", hp: 1100 }, speed: 0.85, tough: "High", noSwim: true,
    look: { hair: false, head: (c, z) => { if (z.armor) { D.ellipse(c, 0, -4, 24, 28, "#c8913f", OUT, 3); D.circle(c, -8, -8, 5, "#fff", OUT, 1.5); D.circle(c, -9, -8, 2, "#111", null, 0); } } } });
  def("zed", { name: "Dr. Zed", desc: "The mad scientist behind it all, inside his giant robot.", hp: 40000, tough: "Extreme", boss: true, noEat: true, noHypno: true });

  // armor looks drawn on top of heads
  const ARMOR_HEAD = { cone, bucket, helmet };
  for (const id in Z) {
    const d = Z[id];
    if (!d.draw) d.draw = drawStd;
    if (d.armor && ARMOR_HEAD[d.armor.kind]) {
      const prev = d.look.head, f = ARMOR_HEAD[d.armor.kind];
      d.look.head = (c, z) => { if (prev) prev(c, z); if (z.armor) f(c); };
    }
  }

  /* ---------- special behaviour ---------- */
  function startJump(z, T, dist, h) { z.jump = { t: 0, T, x0: z.x, x1: z.x + dist * (z.dir || -1), h }; z.airborne = true; z.state = "walk"; z.eatTarget = null; }
  function jumpStep(z, G, dt, done) {
    const j = z.jump;
    j.t += dt;
    const k = Math.min(1, j.t / j.T);
    z.x = U.lerp(j.x0, j.x1, k);
    z.hop = Math.sin(k * Math.PI) * j.h;
    z.walk = (z.walk || 0) + dt * 10;
    if (k >= 1) { z.jump = null; z.airborne = false; z.hop = 0; done(); }
    return true;
  }
  function vehicleCrush(z, G, dt) {
    z.x -= z.speed * dt;
    z.moving = true;
    for (const p of G.plantsInRow(z.row)) {
      if (p.def.spiky) continue;
      if (Math.abs(p.x - (z.x - 55)) < 40) G.crushPlant(p);
    }
  }
  function giantStep(z, G, dt) {
    if (z.throwing > 0) {
      z.throwing -= dt;
      if (z.throwing <= 0) G.throwImp(z);
      return true;
    }
    if (!z.thrown && !z.hypno && z.hp < z.maxHp / 2 && z.x > G.geo.x0 + 4 * G.geo.cw) { z.throwing = 0.9; return true; }
    if (z.smash) {
      z.smash.t += dt;
      if (z.smash.t >= 0.9 && !z.smash.done) {
        z.smash.done = true;
        G.crushCell(z.smash.p.row, z.smash.p.col);
        G.sfx("stomp"); G.shakeIt(8);
      }
      if (z.smash.t >= 1.5) z.smash = null;
      return true;
    }
    return false;
  }
  function bungeeStep(z, G, dt) {
    if (!z.phase) {
      z.phase = "warn"; z.t = 2.2;
      const tgt = G.bungeeTarget(z);
      z.row = tgt.row; z.col = tgt.col; z.x = G.colX(tgt.col); z.y = G.rowY(tgt.row);
      z.drop = 800;
    }
    z.t -= dt;
    if (z.phase === "warn") { if (z.t <= 0) { z.phase = "fall"; z.t = 0.5; G.sfx("fall"); } return true; }
    if (z.phase === "fall") {
      z.drop = Math.max(0, (z.t / 0.5) * 800);
      if (z.t <= 0) {
        z.drop = 0;
        if (G.umbrellaCovers(z.row, z.col)) { G.umbrellaBlock(z.row, z.col); z.phase = "rise"; z.t = 0.8; G.sfx("bonk"); return true; }
        if (z.deliver) { G.spawnZombie(z.deliver, z.row, z.x + 10, { wave: z.wave }); z.phase = "rise"; z.t = 1; return true; }
        z.phase = "grab"; z.t = 2.6;
      }
      return true;
    }
    if (z.phase === "grab") {
      if (z.t <= 0) {
        const p = G.topPlant(z.row, z.col);
        if (p) { z.carry = { def: p.def, age: 0, hp: 1, maxHp: 1 }; G.removePlant(p, true); }
        z.phase = "rise"; z.t = 1;
      }
      return true;
    }
    if (z.phase === "rise") {
      z.drop = (1 - z.t) * 900;
      if (z.t <= 0) z.escaped = true;
      return true;
    }
    return true;
  }
  Z.bungee.targetable = (z) => z.phase === "grab";

  /* ---------- the boss: Dr. Zed and his robot ---------- */
  const Boss = (GS.Boss = {});
  Boss.create = function (G, hp) {
    return { hp, maxHp: hp, t: 0, state: "intro", st: 3, act: 6, head: 0, x: 1110, foot: null, ball: null, rv: null, hit: 0, dead: false, deadT: 0 };
  };
  Boss.update = function (b, G, dt) {
    b.t += dt;
    if (b.hit > 0) b.hit -= dt;
    if (b.dead) {
      b.deadT += dt;
      if (Math.random() < dt * 8) G.boomFx(U.rand(1000, 1260), U.rand(150, 600), 0.8, "255,140,60");
      if (b.deadT > 3 && !b.done) { b.done = true; G.bossDefeated(b); }
      return;
    }
    if (b.state === "intro") { b.st -= dt; b.rise = Math.min(1, 1 - b.st / 3); if (b.st <= 0) { b.state = "idle"; b.rise = 1; G.say("Prepare to meet your doom!", { force: true }); } return; }
    if (b.frozen > 0) { b.frozen -= dt; return; }
    // actions
    b.act -= dt;
    if (b.state === "idle" && b.act <= 0) {
      const opts = ["summon", "summon", "bungee", "stomp", "rv", "ball"];
      const a = U.pick(opts);
      b.state = a; b.st = 0;
      if (a === "summon") { const n = 2 + Math.floor((1 - b.hp / b.maxHp) * 3); for (let i = 0; i < n; i++) G.spawnZombie(U.pick(G.spec.pool), U.randi(0, G.geo.rows - 1), 1030 + i * 15); G.sfx("roar"); }
      if (a === "bungee") { for (let i = 0; i < 3; i++) G.spawnZombie("bungee", 0, 600); }
      if (a === "stomp") { b.foot = { row: U.randi(0, G.geo.rows - 2), t: 0 }; }
      if (a === "rv") { b.rv = { row: U.randi(0, G.geo.rows - 2), col: U.randi(3, 5), t: 0 }; }
      if (a === "ball") { b.ball = { kind: U.chance(0.5) ? "fire" : "ice", row: U.randi(0, G.geo.rows - 1), t: 0, x: 1000, rolling: false }; G.say(b.ball.kind === "fire" ? "Fireball!" : "Iceball!", { gap: 200 }); }
    }
    if (b.state === "summon" || b.state === "bungee") { b.st += dt; if (b.st > 1.2) endAct(b); }
    if (b.state === "stomp") {
      const f = b.foot; f.t += dt;
      if (f.t > 1.2 && !f.done) {
        f.done = true; G.sfx("stomp"); G.shakeIt(14);
        for (let r = f.row; r <= f.row + 1; r++) for (let col = 6; col < 9; col++) G.crushCell(r, col);
      }
      if (f.t > 2) { b.foot = null; endAct(b); }
    }
    if (b.state === "rv") {
      const v = b.rv; v.t += dt;
      if (v.t > 1.6 && !v.done) {
        v.done = true; G.sfx("stomp"); G.shakeIt(12);
        for (let r = v.row; r <= v.row + 1; r++) for (let col = v.col; col <= v.col + 1; col++) G.crushCell(r, col);
      }
      if (v.t > 3) { b.rv = null; endAct(b); }
    }
    if (b.state === "ball") {
      const ball = b.ball; ball.t += dt;
      b.head = Math.min(1, ball.t / 1.2);
      if (ball.t > 3.5) {
        ball.rolling = true;
        ball.x -= 110 * dt;
        for (const p of G.plantsInRow(ball.row)) if (Math.abs(p.x - ball.x) < 50) G.crushPlant(p);
        if (ball.x < G.geo.x0 - 60) { b.ball = null; endAct(b); }
      }
    } else if (b.head > 0) b.head = Math.max(0, b.head - dt);
  };
  function endAct(b) { b.state = "idle"; b.act = U.rand(4, 7) * (0.6 + 0.4 * b.hp / b.maxHp); }
  Boss.counter = function (b, kind, row) {
    if (!b || !b.ball) return false;
    if ((kind === "freeze" && b.ball.kind === "fire") || (kind === "burn" && b.ball.kind === "ice" && b.ball.row === row)) { b.ball = null; endAct(b); return true; }
    return false;
  };
  Boss.hurt = function (b, G, dmg) {
    if (b.dead || b.state === "intro") return;
    b.hp -= dmg; b.hit = 0.1;
    if (b.hp <= 0) { b.hp = 0; b.dead = true; b.ball = null; b.foot = null; b.rv = null; G.sfx("roar"); G.say("Nooo! My robot!", { force: true }); }
  };
  Boss.draw = function (c, b, G) {
    const rise = b.rise ?? 1;
    const oy = (1 - rise) * 600 + (b.dead ? b.deadT * 120 : 0);
    c.save(); c.translate(0, oy);
    const metal = b.hit > 0 ? "#e8e8f0" : "#8a92a2", dark = "#4a5262";
    // legs and body
    D.rr(c, 1060, 380, 70, 340, 20, metal, OUT, 4);
    D.rr(c, 1170, 380, 70, 340, 20, metal, OUT, 4);
    D.rr(c, 1010, 170, 280, 240, 40, metal, OUT, 4);
    for (let i = 0; i < 4; i++) D.circle(c, 1060 + i * 60, 250, 12, dark, OUT, 3);
    D.rr(c, 1050, 300, 200, 70, 12, dark, OUT, 3);
    for (let i = 0; i < 6; i++) D.rr(c, 1062 + i * 31, 312, 20, 46, 4, b.hp / b.maxHp > i / 6 ? "#5aff6a" : "#333", null, 0);
    // arm
    c.save(); c.translate(1020, 220); c.rotate(-0.4 + Math.sin(b.t) * 0.1);
    D.rr(c, -150, -20, 160, 40, 18, metal, OUT, 4); D.circle(c, -160, 0, 30, dark, OUT, 4);
    c.restore();
    // head with Dr. Zed
    const hy = 70 + b.head * 300, hx = 1080 - b.head * 40;
    D.rr(c, hx, hy, 170, 140, 50, metal, OUT, 4);
    D.circle(c, hx + 40, hy + 50, 18, "#ff3030", OUT, 3); D.circle(c, hx + 100, hy + 50, 18, "#ff3030", OUT, 3);
    D.rr(c, hx + 30, hy + 90, 110, 26, 6, dark, OUT, 3);
    for (let i = 0; i < 6; i++) D.line(c, hx + 40 + i * 18, hy + 92, hx + 40 + i * 18, hy + 114, "#ddd", 3);
    // dome with the doctor
    D.circle(c, hx + 85, hy - 10, 46, "rgba(180,230,255,0.45)", OUT, 3);
    c.save(); c.translate(hx + 85, hy + 30); c.scale(0.7, 0.7);
    zombieBody(c, { age: b.t, walk: 0, state: "walk", hp: 1, maxHp: 1 }, { coat: "#f2f2f2", tie: "#5a2a8a", hair: false, head: (c) => { D.ellipse(c, 2, -18, 20, 10, "#888", OUT, 2); D.circle(c, -10, -4, 7, "#ddd", OUT, 2); } });
    c.restore();
    if (b.ball && !b.ball.rolling) {
      const col = b.ball.kind === "fire" ? "#ff7020" : "#8fe0ff";
      D.circle(c, hx + 60, hy + 170, 26 + Math.sin(b.t * 10) * 3, col, OUT, 3);
    }
    c.restore();
    // stomp foot
    if (b.foot) {
      const f = b.foot, y1 = G.rowY(f.row + 1);
      const k = Math.min(1, f.t / 1.2), drop = f.done ? 0 : (1 - k) * 400;
      c.globalAlpha = 0.25; D.rr(c, G.colX(6) - 50, G.rowY(f.row) - G.geo.ch + 20, 300, G.geo.ch * 2 - 10, 10, "#000", null, 0); c.globalAlpha = 1;
      D.rr(c, G.colX(6) - 40, y1 - 140 - drop, 290, 140, 30, metal, OUT, 4);
    }
    if (b.rv) {
      const v = b.rv, k = Math.min(1, v.t / 1.6);
      const x = G.colX(v.col) + 50, y = G.rowY(v.row + 1);
      c.globalAlpha = 0.3; D.ellipse(c, x, y - 10, 100 * k, 30 * k, "#000", null, 0); c.globalAlpha = 1;
      const yy = U.lerp(-200, y, k * k);
      D.rr(c, x - 110, yy - 110, 220, 100, 14, "#e8e4d0", OUT, 4);
      D.rr(c, x - 90, yy - 96, 60, 36, 6, "#9ad8ff", OUT, 2);
      D.circle(c, x - 60, yy - 6, 20, "#333", OUT, 3); D.circle(c, x + 60, yy - 6, 20, "#333", OUT, 3);
    }
    if (b.ball && b.ball.rolling) {
      const col = b.ball.kind === "fire" ? "#ff7020" : "#8fe0ff";
      const y = G.rowY(b.ball.row) - 50;
      c.save(); c.translate(b.ball.x, y); c.rotate(-b.ball.t * 4);
      D.circle(c, 0, 0, 48, col, OUT, 4);
      for (let i = 0; i < 6; i++) { c.rotate(1.05); D.poly(c, [0, -48, 10, -62, -10, -62], b.ball.kind === "fire" ? "#ffd23a" : "#e8fbff", OUT, 2); }
      c.restore();
    }
  };
  Boss.drawZed = function (c, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s, s);
    zombieBody(c, { age: performance.now() / 1000, walk: 0, state: "walk", hp: 1, maxHp: 1 }, { coat: "#f2f2f2", tie: "#5a2a8a", hair: false, head: (c) => { D.ellipse(c, 2, -18, 20, 10, "#888", OUT, 2); D.circle(c, -10, -4, 7, "#ddd", OUT, 2); } });
    c.restore();
  };
  GS.zombieBody = zombieBody;
})(window.GS);
