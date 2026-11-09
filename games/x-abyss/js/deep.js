/* X-Abyss: the deep zone – stages 5 to 8 with new enemies from every side, fixed obstacles and four new bosses */
"use strict";

(function (XA) {
  const { U, Gfx, Fx, G } = XA;
  const A = XA.Audio;
  const W = U.W, H = U.H, TAU = U.TAU;
  const { spawn, eshot, ring, aim, canShoot, place, safeY, q, chain, killEnemy, endAtk, circHit, ellHit, bossBase, PAT, BOSSES, ED } = G.lib;

  /* ---------- Stages ---------- */
  G.LEVELS.push(
    {
      name: "Trench Gate", sub: "DEEP ZONE", song: "level5", bossSong: "boss2", theme: "foundry", scroll: 90, seed: 71, boss: "leviathan",
      floor: { base: 630, amp: 80, scale: 360 }, ceil: { base: 80, amp: 60, scale: 320 },
      seq: ["lancers", "raptors", "gate", "divers", "sentinels", "pillars", "freighter", "raptors", "blades", "lancers2", "beams", "warden",
        "divers", "seekers", "gate", "swarmL", "sentinels", "raptors", "pillars", "freighter", "divers", "blades", "warden", "lancers2", "swarmAll"],
    },
    {
      name: "Crystal Caverns", sub: "DEEP ZONE", song: "level6", bossSong: "boss2", theme: "crystal", scroll: 95, seed: 83, boss: "prism",
      floor: { base: 615, amp: 100, scale: 300 }, ceil: { base: 100, amp: 90, scale: 280 },
      seq: ["swarmAll", "pillars", "divers", "lancers2", "gate", "raptors", "seekers", "warden", "beams", "blades", "freighter", "sentinels",
        "maze", "divers", "raptors", "swarmL", "pillars", "seekers", "lancers2", "warden", "gate", "divers", "raptors", "freighter", "swarmAll"],
    },
    {
      name: "Frozen Rift", sub: "DEEP ZONE", song: "level7", bossSong: "boss2", theme: "ice", scroll: 100, seed: 97, boss: "kraken",
      floor: { base: 620, amp: 110, scale: 280 }, ceil: { base: 95, amp: 100, scale: 260 },
      seq: ["raptors", "divers", "pillars", "blades", "warden", "swarmAll", "maze", "seekers", "lancers2", "sentinels", "gate", "raptors", "freighter",
        "divers", "beams", "swarmL", "warden", "pillars", "seekers", "blades", "maze", "raptors", "divers", "lancers2", "freighter", "swarmAll"],
    },
    {
      name: "Abyss Core", sub: "DEEP ZONE", song: "level8", bossSong: "boss2", theme: "core", scroll: 105, seed: 113, boss: "omega",
      floor: { base: 620, amp: 90, scale: 240 }, ceil: { base: 100, amp: 90, scale: 240 },
      seq: ["swarmAll", "raptors", "maze", "warden", "divers", "seekers", "gate", "sentinels", "lancers2", "freighter", "pillars", "raptors", "blades",
        "warden", "swarmL", "maze", "divers", "seekers", "beams", "raptors", "warden", "gate", "divers", "lancers2", "freighter", "swarmAll", "raptors"],
    },
  );

  /* ---------- Helpers ---------- */
  const deep = () => Math.max(0, G.run.level - 4);
  const sp = () => 1 + 0.06 * deep();          // bullet and flight speed
  const DMG = () => 32 + 3 * deep();           // ordinary shots (the first zone does 20)
  const HEAVY = () => 42 + 3 * deep();         // plasma
  const cs = (e) => canShoot(e) && e.y > 12 && e.y < H - 12;
  const bolt = (x, y, a, s, o = {}) => eshot(x, y, a, s * sp(), Object.assign({ k: "e_bolt", rot: true, r: 6, dmg: DMG() }, o));
  const plasma = (x, y, a, s, o = {}) => eshot(x, y, a, s * sp(), Object.assign({ k: "e_plasma", r: 9, dmg: HEAVY() }, o));
  const shard = (x, y, a, s, o = {}) => eshot(x, y, a, s * sp(), Object.assign({ k: "e_shard", rot: true, r: 6, dmg: DMG() }, o));
  const fan = (fn, x, y, a, n, spread, s, o) => { for (let i = 0; i < n; i++) fn(x, y, a - spread / 2 + (n > 1 ? (spread * i) / (n - 1) : spread / 2), s, o); };
  const P = () => G.player;
  const OBST = () => ({ foundry: "girder", crystal: "crystal", ice: "ice", core: "pylon" })[G.L.theme] || "girder";
  const flipDraw = (ctx, e, white, spr) => {
    ctx.save(); ctx.translate(e.x, e.y); if (e.face > 0) ctx.scale(-1, 1); ctx.rotate(e.ang || 0);
    Gfx.draw(ctx, spr, 0, 0, 0, 1, white); ctx.restore();
  };
  const engine = (ctx, x, y, rgb, r) => { ctx.globalCompositeOperation = "lighter"; Gfx.glowAt(ctx, rgb, x, y, r, 0.8, true); ctx.globalCompositeOperation = "source-over"; };

  /* ---------- New enemies ---------- */
  Object.assign(ED, {
    // fast interceptor that comes from behind, brakes, fires and dashes back out
    raptor: {
      hp: 22, rx: 28, ry: 11, score: 450, spr: "raptor", free: true, touch: 40,
      init(e) { e.face = 1; e.vx = 620 * sp(); e.tx = U.rand(W * 0.6, W * 0.8); e.state = 0; e.st = 0; },
      update(e, dt) {
        e.st += dt;
        if (e.state === 0) {
          e.x += e.vx * dt;
          if (!P().dead) e.y += (P().y - e.y) * Math.min(1, dt * 0.8);
          if (e.x > e.tx) { e.state = 1; e.st = 0; }
        } else if (e.state === 1) {
          e.vx *= Math.pow(0.02, dt); e.x += e.vx * dt;
          if (e.st > 0.25 && !e.shot) { e.shot = true; if (cs(e)) { fan(bolt, e.x - 20, e.y, aim(e), 3, 0.24, 430); A.sfx("eshot2"); } }
          if (e.st > 0.7) { e.state = 2; e.face = -1; e.vx = 0; }
        } else { e.vx = Math.max(-600 * sp(), e.vx - 1400 * dt); e.x += e.vx * dt; }
        if (Math.random() < 0.5) Fx.glow(e.x - e.face * 30, e.y, 3, 9, "255,90,40", 0.5);
      },
      draw(ctx, e, white) { flipDraw(ctx, e, white, "raptor"); engine(ctx, e.x - e.face * 31, e.y, "255,90,40", 10); },
    },
    // drops in from above or below, fires a fan and banks away to the left
    diver: {
      hp: 26, rx: 21, ry: 16, score: 450, spr: "diver", free: true, touch: 40,
      init(e) { e.dir = e.y < H / 2 ? 1 : -1; e.vy = e.dir * 540 * sp(); e.vx = 0; e.state = 0; e.ty = U.clamp(P().y + U.rand(-50, 50), 90, H - 90); e.fireT = 0; e.ang = e.dir * -Math.PI / 2; },
      update(e, dt) {
        if (e.state === 0) {
          e.y += e.vy * dt;
          if ((e.dir > 0 && e.y >= e.ty) || (e.dir < 0 && e.y <= e.ty)) { e.state = 1; if (cs(e)) { fan(bolt, e.x - 16, e.y, aim(e), 5, 0.7, 380); A.sfx("eshot2"); } e.fireT = 0.9; }
        } else {
          e.vy *= Math.pow(0.05, dt); e.vx = Math.max(-440 * sp(), e.vx - 900 * dt);
          e.x += e.vx * dt; e.y += e.vy * dt;
          e.fireT -= dt;
          if (e.fireT <= 0 && !e.shot2) { e.shot2 = true; if (cs(e)) { fan(bolt, e.x - 16, e.y, aim(e), 3, 0.3, 420); A.sfx("eshot"); } }
        }
        const want = Math.atan2(e.vy, e.vx) - Math.PI;
        e.ang += U.angDiff(want, e.ang) * Math.min(1, dt * 8);
      },
    },
    // needle ship in a fast weaving chain
    lancer: {
      hp: 16, rx: 26, ry: 8, score: 300, spr: "lancer",
      init(e) { e.x0 = W + 40; e.vx = -470 * sp(); e.baseY = e.y; e.amp = Math.min(80, (G.floorAt(W) - Math.max(0, G.ceilAt(W))) / 2 - 70); e.fireT = 0.5 + (e.idx || 0) * 0.12; },
      update(e, dt) {
        if (e.t < 0) { e.hidden = true; return; }
        e.hidden = false;
        const ph = e.t * 4 + (e.idx || 0) * 0.5;
        e.x = e.x0 + e.vx * e.t; e.y = e.baseY + Math.sin(ph) * e.amp;
        e.ang = -Math.atan2(Math.cos(ph) * e.amp * 4, -e.vx) * 0.7;
        e.fireT -= dt;
        if (e.fireT <= 0) { e.fireT = 1.2; if ((e.idx || 0) % 2 === 0 && cs(e)) { bolt(e.x - 24, e.y, aim(e), 440); A.sfx("eshot"); } }
      },
    },
    // heavy gunship: plasma fans, bolt bursts and seeker launches
    warden: {
      hp: 240, rx: 64, ry: 28, score: 3000, spr: "warden", drop: "power", touch: 50,
      init(e) { e.tx = U.rand(W * 0.7, W * 0.78); e.baseY = e.y; e.fireT = 1.2; e.mode = 0; e.leaveT = 12; },
      update(e, dt) {
        if (e.t < e.leaveT) e.x += (e.tx - e.x) * Math.min(1, dt * 1.4); else e.x -= 150 * dt;
        e.y = safeY(e.baseY + Math.sin(e.t * 0.8) * 60, 50, e.x);
        e.fireT -= dt;
        if (e.fireT <= 0 && cs(e)) {
          e.fireT = 1.5;
          const m = e.mode++ % 3;
          if (m === 0) { fan(plasma, e.x - 68, e.y, aim(e), 7, 1.0, 250); A.sfx("eshot2"); }
          else if (m === 1) { for (let i = 0; i < 5; i++) q(i * 0.08, () => { if (!e.dead) { bolt(e.x - 68, e.y - 11, aim(e), 480); bolt(e.x - 68, e.y + 11, aim(e), 480); A.sfx("eshot"); } }); }
          else { spawn("seeker", { x: e.x + 40, y: e.y - 30, vx: -60, vy: -260, noStat: true }); spawn("seeker", { x: e.x + 40, y: e.y + 30, vx: -60, vy: 260, noStat: true }); A.sfx("torpedo"); }
        }
        if (Math.random() < 0.4) Fx.glow(e.x + 70, e.y + U.rand(-10, 10), 4, 12, "255,140,60", 0.4);
      },
    },
    // homing spike mine; bursts into a ring if it is not shot down in time
    seeker: {
      hp: 12, rx: 13, ry: 13, score: 250, spr: "seeker", free: true, fragile: true, touch: 38,
      init(e) { e.life = 6.5; },
      update(e, dt) {
        if (!P().dead) { const a = aim(e); e.vx += Math.cos(a) * 420 * dt; e.vy += Math.sin(a) * 420 * dt; }
        const s = Math.hypot(e.vx, e.vy), max = 240 * sp();
        if (s > max) { e.vx *= max / s; e.vy *= max / s; }
        e.x += e.vx * dt; e.y += e.vy * dt; e.ang += dt * 5;
        if (e.t > e.life) { e.timeout = true; killEnemy(e, false); }
      },
      onDeath(e) { if (e.timeout && G.phase !== "bossdeath") { ring(e.x, e.y, 10, 230 * sp(), e.ang, { k: "e_bolt", rot: true, dmg: DMG() }); A.sfx("eshot2"); } },
      draw(ctx, e, white) {
        Gfx.draw(ctx, "seeker", e.x, e.y, e.ang, 1, white);
        if (e.t > e.life - 1.5 && Math.floor(e.t * 12) % 2) { ctx.globalCompositeOperation = "lighter"; Gfx.glowAt(ctx, "255,40,60", e.x, e.y, 28, 0.9, true); ctx.globalCompositeOperation = "source-over"; }
      },
    },
    // saw disc that rolls along the floor or ceiling, from the right or from behind
    blade: {
      hp: 50, rx: 20, ry: 20, score: 400, spr: "blade", free: true, touch: 45,
      init(e) {
        e.dir = e.dir || -1; e.x = e.dir < 0 ? W + 40 : -40;
        e.side = e.side === "ceil" && G.terr.ceil ? "ceil" : "floor";
        e.spd = (e.dir < 0 ? 330 : 380) * sp(); e.vy = 0; e.air = false; e.hopT = U.rand(0.8, 2);
        e.y = e.side === "floor" ? G.floorAt(e.x) - 21 : G.ceilAt(e.x) + 21;
      },
      update(e, dt) {
        e.x += e.dir * e.spd * dt; e.ang += e.dir * (e.spd / 21) * dt;
        if (e.side === "floor") {
          const fy = G.floorAt(e.x) - 21;
          if (e.air) { e.vy += 1100 * dt; e.y += e.vy * dt; if (e.y >= fy) { e.y = fy; e.air = false; } }
          else { e.y = fy; e.hopT -= dt; if (e.hopT <= 0) { e.hopT = U.rand(1.2, 2.4); e.air = true; e.vy = -U.rand(380, 520); } }
        } else e.y = G.ceilAt(e.x) + 21;
        if (!e.air && Math.random() < 0.6 && e.x > 0 && e.x < W) Fx.hitSpark(e.x - e.dir * 6, e.y + (e.side === "floor" ? 20 : -20), "255,210,120", 1);
      },
    },
    // anchored lance emitter: charges up and fires three fast lances
    sentinel: {
      hp: 70, rx: 22, ry: 16, score: 800, anchored: true,
      init(e) { e.x = W + 40; place(e, 14); e.fireT = 1.6; e.ang = e.flip ? Math.PI / 2 : -Math.PI / 2; e.burst = 0; },
      update(e, dt) {
        e.x -= G.scroll * dt; place(e, 14);
        let a = aim(e);
        if (!e.flip && a > 0) a = a < Math.PI / 2 ? -0.05 : -Math.PI + 0.05;
        if (e.flip && a < 0) a = a > -Math.PI / 2 ? 0.05 : Math.PI - 0.05;
        if (e.burst <= 0) e.ang += U.angDiff(a, e.ang) * Math.min(1, dt * 5);
        e.fireT -= dt;
        if (e.fireT <= 0) {
          if (e.burst <= 0) { e.burst = 3; e.bt = 0; }
          e.bt -= dt;
          if (e.bt <= 0) { e.bt = 0.12; e.burst--; if (cs(e)) { bolt(e.x + Math.cos(e.ang) * 26, e.y + Math.sin(e.ang) * 26, e.ang, 640, { r: 7, dmg: DMG() + 4 }); A.sfx("eshot2"); } if (e.burst <= 0) e.fireT = 2.3; }
        }
      },
      draw(ctx, e, white) {
        const charge = e.fireT < 0.7 ? 1 - e.fireT / 0.7 : 0;
        ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.ang);
        ctx.fillStyle = white ? "#fff" : "#2a2e36"; ctx.fillRect(0, -6, 32, 12);
        ctx.fillStyle = white ? "#fff" : "#8a929c"; ctx.fillRect(4, -7, 4, 14); ctx.fillRect(24, -7, 8, 14);
        ctx.globalCompositeOperation = "lighter"; Gfx.glowAt(ctx, "255,80,60", 32, 0, 10 + charge * 24, 0.4 + charge * 0.6, true);
        ctx.restore();
        ctx.save(); ctx.translate(e.x, e.y); if (e.flip) ctx.scale(1, -1);
        const gr = ctx.createLinearGradient(0, -22, 0, 12);
        gr.addColorStop(0, white ? "#fff" : "#c0c6ce"); gr.addColorStop(0.5, white ? "#fff" : "#5a2028"); gr.addColorStop(1, "#14060a");
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.moveTo(-26, 14); ctx.lineTo(-20, -6); ctx.quadraticCurveTo(0, -24, 20, -6); ctx.lineTo(26, 14); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "rgba(255,80,60,0.6)"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.restore();
      },
    },
    // small fast drones in packs from any edge
    swarm: {
      hp: 8, rx: 12, ry: 8, score: 150, spr: "swarm", free: true, touch: 30,
      init(e) { e.fireAt = U.rand(0.6, 1.2); },
      update(e, dt) {
        if (e.t < 1.5 && !P().dead) { const a = aim(e); e.vx += Math.cos(a) * 520 * dt; e.vy += Math.sin(a) * 520 * dt; }
        const s = Math.hypot(e.vx, e.vy), max = 340 * sp();
        if (s > max) { e.vx *= max / s; e.vy *= max / s; }
        e.x += e.vx * dt; e.y += e.vy * dt;
        e.ang = Math.atan2(e.vy, e.vx) - Math.PI;
        if (!e.shot && e.t > e.fireAt) { e.shot = true; if (cs(e)) { bolt(e.x, e.y, aim(e), 400); A.sfx("eshot"); } }
      },
    },
    // armoured freighter carrying an item
    freighter: {
      hp: 90, rx: 44, ry: 20, score: 1200, spr: "freighter", drop: "item",
      init(e) { e.vx = -100; e.baseY = e.y; e.fireT = 1.5; },
      update(e, dt) {
        e.x += e.vx * dt; e.y = e.baseY + Math.sin(e.t * 1.3) * 22;
        e.fireT -= dt;
        if (e.fireT <= 0) { e.fireT = 2.2; if (cs(e)) { ring(e.x, e.y, 10, 170 * sp(), e.t, { k: "e_plasma", r: 8, dmg: HEAVY() }); A.sfx("eshot2"); } }
      },
    },
    // boss parts
    prism: {
      hp: 160, rx: 18, ry: 26, score: 1500, noScale: true, free: true,
      init(e) { e.fireT = 99; },
      update(e, dt) { e.ang = Math.sin(e.t * 2) * 0.3; },
      draw(ctx, e, white) {
        ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.ang);
        ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(18, -6); ctx.lineTo(10, 28); ctx.lineTo(-10, 28); ctx.lineTo(-18, -6); ctx.closePath();
        const gr = ctx.createLinearGradient(-18, 0, 18, 0);
        gr.addColorStop(0, white ? "#fff" : "#1a6a90"); gr.addColorStop(0.45, "#e8ffff"); gr.addColorStop(0.55, white ? "#fff" : "#40b0e0"); gr.addColorStop(1, white ? "#fff" : "#103a60");
        ctx.fillStyle = gr; ctx.fill(); ctx.strokeStyle = "rgba(220,255,255,0.9)"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.globalCompositeOperation = "lighter"; Gfx.glowAt(ctx, "120,240,255", 0, 0, 40, 0.4 + 0.2 * Math.sin(e.t * 5));
        ctx.restore();
      },
    },
    gen: {
      hp: 300, rx: 28, ry: 28, score: 3000, noScale: true, free: true, touch: 45,
      init(e) { e.fireT = 1.5 + (e.gi || 0) * 0.6; },
      update(e, dt) {
        e.ang += dt * 1.5;
        e.fireT -= dt;
        if (e.fireT <= 0) { e.fireT = 2.6; if (cs(e)) { bolt(e.x, e.y, aim(e), 380); A.sfx("eshot"); } }
      },
      draw(ctx, e, white) {
        ctx.save(); ctx.translate(e.x, e.y);
        ctx.fillStyle = white ? "#fff" : "#2a1016";
        ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = e.ang + (i * TAU) / 8, r = i % 2 ? 22 : 30; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "rgba(255,80,110,0.7)"; ctx.lineWidth = 2; ctx.stroke();
        const gr = ctx.createRadialGradient(-4, -4, 1, 0, 0, 16);
        gr.addColorStop(0, "#fff"); gr.addColorStop(0.4, white ? "#fff" : "#ff3a6a"); gr.addColorStop(1, "#3a0010");
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, 15, 0, TAU); ctx.fill();
        ctx.globalCompositeOperation = "lighter"; Gfx.glowAt(ctx, "255,40,90", 0, 0, 46, 0.45 + 0.25 * Math.sin(e.t * 6));
        ctx.restore();
      },
    },
  });

  /* ---------- Attack patterns (with arrows for enemies from the side, top and bottom) ---------- */
  function fromLeft(type, y, delay, o = {}) { y = safeY(y, 40, 200); q(delay, () => G.edgeWarn(-40, y)); q(delay + 0.8, () => spawn(type, Object.assign({ x: -40, y }, o))); }
  function fromEdge(type, x, top, delay, o = {}) {
    const y = top ? -30 : H + 30;
    q(delay, () => G.edgeWarn(x, y));
    q(delay + 0.75, () => spawn(type, Object.assign({ x, y }, o)));
  }
  function swarmPack(edge, delay) {
    const n = 5 + Math.min(2, deep());
    let x, y, vx, vy;
    if (edge === "left") { x = -30; y = U.rand(150, H - 150); vx = 260; vy = 0; }
    else if (edge === "top") { x = U.rand(W * 0.35, W * 0.8); y = -30; vx = -60; vy = 260; }
    else if (edge === "bottom") { x = U.rand(W * 0.35, W * 0.8); y = H + 30; vx = -60; vy = -260; }
    else { x = W + 30; y = U.rand(150, H - 150); vx = -300; vy = 0; }
    q(delay, () => G.edgeWarn(x, y));
    for (let i = 0; i < n; i++) q(delay + 0.75 + i * 0.12, () => spawn("swarm", { x: x + U.rand(-20, 20), y: y + U.rand(-20, 20), vx, vy }));
  }
  function passage(off = 40) {
    const x = G.camX + W + off, fl = G.terr.floor(x), cl = G.terr.ceil ? Math.max(0, G.terr.ceil(x)) : 0;
    return [cl, fl];
  }
  Object.assign(PAT, {
    raptors: { dur: 4, run() { const n = 3 + Math.min(2, deep()); for (let i = 0; i < n; i++) fromLeft("raptor", U.rand(110, H - 130), i * 0.65); } },
    divers: { dur: 4, run() { const n = 4 + Math.min(2, deep()); for (let i = 0; i < n; i++) fromEdge("diver", U.rand(W * 0.45, W - 120), i % 2 === 0, i * 0.6); } },
    lancers: { dur: 3.5, run() { chain("lancer", 6, U.rand(200, H - 200)); } },
    lancers2: { dur: 4, run() { chain("lancer", 6, U.rand(160, 300)); q(1.2, () => chain("lancer", 6, U.rand(H - 300, H - 160))); } },
    warden: { dur: 8, run() { spawn("warden", { y: U.rand(260, H - 260) }); q(3, () => fromLeft("raptor", U.rand(120, H - 140), 0)); q(4.5, () => fromEdge("diver", U.rand(W * 0.4, W * 0.6), Math.random() < 0.5, 0)); } },
    seekers: { dur: 4.5, run() { for (let i = 0; i < 5 + deep(); i++) { const top = i % 2 === 0, x = U.rand(W * 0.3, W - 100); fromEdge("seeker", x, top, i * 0.45, { vx: -40, vy: top ? 200 : -200 }); } } },
    blades: { dur: 4.5, run() { for (let i = 0; i < 3; i++) q(i * 0.9, () => spawn("blade", { side: i === 1 ? "ceil" : "floor", dir: -1 })); if (deep() >= 1) { q(1.5, () => G.edgeWarn(-40, H - 80)); q(2.3, () => spawn("blade", { side: "floor", dir: 1 })); } } },
    sentinels: { dur: 5, run() { for (let i = 0; i < 3; i++) q(i * 1.2, () => spawn("sentinel", { side: i % 2 ? "ceil" : "floor" })); q(1.5, () => swarmPack("right", 0)); } },
    swarmL: { dur: 3.5, run() { swarmPack("left", 0); swarmPack("right", 1.2); } },
    swarmAll: { dur: 5, run() { swarmPack("top", 0); swarmPack("bottom", 0.9); swarmPack("left", 1.8); if (deep() >= 2) swarmPack("right", 2.6); } },
    freighter: { dur: 5, run() { spawn("freighter", { y: U.rand(220, H - 220) }); q(0.8, () => chain("lancer", 5, U.rand(160, H - 160))); } },
    // fixed obstacles
    gate: {
      dur: 5, run() {
        const [cl, fl] = passage(64), gap = 220 - deep() * 6, gy = U.rand(cl + 60 + gap / 2, fl - 60 - gap / 2);
        G.addObstacle({ kind: OBST(), from: "floor", w: 64, ytop: gy + gap / 2, gap: 0 });
        G.addObstacle({ kind: OBST(), from: "ceil", w: 64, ybot: gy - gap / 2, gap: 0 });
        q(1.6, () => fromLeft("raptor", gy, 0));
        q(2.6, () => chain("lancer", 5, U.rand(180, H - 180)));
      },
    },
    pillars: {
      dur: 6, run() {
        for (let i = 0; i < 3; i++) q(i * 2.4, () => {
          const [cl, fl] = passage(56);
          G.addObstacle({ kind: OBST(), from: i % 2 ? "ceil" : "floor", w: 56, len: (fl - cl) * 0.5, gap: 200 });
        });
        q(1.2, () => fromEdge("diver", U.rand(W * 0.5, W - 140), true, 0));
        q(3.6, () => fromEdge("diver", U.rand(W * 0.5, W - 140), false, 0));
      },
    },
    beams: {
      dur: 6, run() {
        const [cl, fl] = passage(260), mid = (cl + fl) / 2;
        G.addObstacle({ kind: OBST(), from: "free", w: 260, h: 30, y: mid - 90 + U.rand(-30, 30), gap: 160 });
        q(2.8, () => { const [c2, f2] = passage(260); G.addObstacle({ kind: OBST(), from: "free", w: 220, h: 30, y: (c2 + f2) / 2 + 90, gap: 160 }); });
        q(1, () => swarmPack(Math.random() < 0.5 ? "top" : "bottom", 0));
        q(3.2, () => chain("lancer", 5, mid));
      },
    },
    maze: {
      dur: 7, run() {
        const [cl, fl] = passage(56);
        G.addObstacle({ kind: OBST(), from: "floor", w: 56, len: (fl - cl) * 0.48, gap: 200 });
        q(2.2, () => { const [c2, f2] = passage(200); G.addObstacle({ kind: OBST(), from: "free", w: 200, h: 32, y: (c2 + f2) / 2, gap: 170 }); });
        q(4.6, () => { const [c3, f3] = passage(56); G.addObstacle({ kind: OBST(), from: "ceil", w: 56, len: (f3 - c3) * 0.48, gap: 200 }); });
        q(1.4, () => fromLeft("raptor", U.rand(140, H - 160), 0));
        q(3.4, () => spawn("sentinel", { side: "floor" }));
        q(5, () => fromEdge("seeker", W * 0.6, true, 0, { vx: -40, vy: 200 }));
      },
    },
  });

  /* ---------- Laser lines (warning, then a short deadly beam) ---------- */
  function laser(b, from, a, warn = 0.9, on = 0.5) { b.lines.push({ from, a, t: 0, warn, on, fired: false }); A.sfx("charge"); }
  function lasersUpdate(b, dt) {
    if (b.dying) { b.lines.length = 0; return; }
    const p = P();
    for (const l of b.lines) {
      l.t += dt;
      if (l.t > l.warn && !l.fired) { l.fired = true; A.sfx("beam"); Fx.shake = Math.max(Fx.shake, 6); }
      if (l.fired && l.t < l.warn + l.on && !p.dead) {
        const o = l.from(), dx = p.x - o.x, dy = p.y - o.y;
        const along = dx * Math.cos(l.a) + dy * Math.sin(l.a), perp = Math.abs(-dx * Math.sin(l.a) + dy * Math.cos(l.a));
        if (along > 0 && perp < 18) G.hurt(HEAVY());
      }
    }
    b.lines = b.lines.filter((l) => l.t < l.warn + l.on);
  }
  function lasersDraw(ctx, b, rgb) {
    ctx.globalCompositeOperation = "lighter";
    for (const l of b.lines) {
      const o = l.from(), ex = o.x + Math.cos(l.a) * 1700, ey = o.y + Math.sin(l.a) * 1700;
      if (!l.fired) {
        ctx.strokeStyle = `rgba(${rgb},${0.25 + 0.35 * Math.abs(Math.sin(l.t * 24))})`; ctx.lineWidth = 2;
        ctx.setLineDash([14, 10]); ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(ex, ey); ctx.stroke(); ctx.setLineDash([]);
        Gfx.glowAt(ctx, rgb, o.x, o.y, 16 + (l.t / l.warn) * 30, 0.8, true);
      } else {
        const k = 1 - (l.t - l.warn) / l.on;
        for (const [w, a] of [[46, 0.25], [20, 0.6], [7, 1]]) {
          ctx.strokeStyle = w === 7 ? `rgba(255,255,255,${a * k + 0.2})` : `rgba(${rgb},${a * k + 0.1})`;
          ctx.lineWidth = w * (0.9 + Math.random() * 0.2); ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(ex, ey); ctx.stroke();
        }
        Gfx.glowAt(ctx, rgb, o.x, o.y, 70, 0.9, true);
      }
    }
    ctx.globalCompositeOperation = "source-over";
  }
  const vClamp = (b, y, m) => { const top = Math.max(40, G.ceilAt(b.x)) + m, bot = Math.min(H - 20, G.floorAt(b.x)) - m; return top > bot ? (top + bot) / 2 : U.clamp(y, top, bot); };
  function cycle(b, dt, seq, P2) {
    if (b.atk < 0) { b.cool -= dt * (P2 ? 1.25 : 1); if (b.cool <= 0) { b.atk = seq[b.step++ % seq.length]; b.atkT = 0; b.n = 0; b.nt = 0; } return false; }
    b.atkT += dt; b.nt -= dt;
    return true;
  }

  /* ---------- Boss 5: Iron Leviathan ---------- */
  BOSSES.leviathan = function () {
    const b = bossBase({ name: "IRON LEVIATHAN", call: "Warning! The Iron Leviathan is approaching!", hp: 5200, maxHp: 5200, x: W + 380, cx: W - 250, hatch: 0, hatchT: 0, lines: [], bonus: 80000 });
    b.core = () => ({ x: b.x - 118, y: b.y + 28, r: 30 });
    const mouth = () => ({ x: b.x - 175, y: b.y + 28 });
    const guns = () => [{ x: b.x - 20, y: b.y - 92 }, { x: b.x + 50, y: b.y + 92 }];
    b.bounds = () => ({ x: b.x + 40, y: b.y, rx: 200, ry: 90 });
    b.test = (x, y, r) => {
      const c = b.core();
      if (b.hatch > 0.6) { if (circHit(c, x, y, r)) return "weak"; if (x < c.x && Math.abs(y - c.y) < 36) return null; } // open jaw: shots fly in
      if (ellHit({ x: b.x + 40, y: b.y, rx: 215, ry: 98 }, x, y, r)) return "armor";
      return null;
    };
    b.touch = (p) => ellHit({ x: b.x + 40, y: b.y, rx: 205, ry: 92 }, p.x, p.y, 8);
    b.update = (dt) => {
      b.t += dt;
      b.hatch = U.lerp(b.hatch, b.hatchT, Math.min(1, dt * 6));
      lasersUpdate(b, dt);
      if (!b.entered) { b.x += (b.cx - b.x) * Math.min(1, dt * 1.0); b.y = vClamp(b, H / 2, 110); if (b.x < b.cx + 8) { b.entered = true; A.sfx("roar"); } return; }
      b.x = b.cx + Math.sin(b.t * 0.3) * 40;
      b.y += (vClamp(b, H / 2 + Math.sin(b.t * 0.5) * 90, 110) - b.y) * Math.min(1, dt * 2);
      if (Math.random() < 0.5) Fx.bubbles(b.x + 250, b.y + U.rand(-30, 30), 1, 8);
      if (b.dying) return;
      const P2 = b.hp < b.maxHp * 0.5;
      if (!cycle(b, dt, P2 ? [0, 1, 3, 2, 1, 3] : [0, 1, 2, 1], P2)) return;
      if (b.atk === 0) {
        b.hatchT = 0;
        if (b.nt <= 0) { b.nt = 0.32; b.n++; for (const g of guns()) bolt(g.x, g.y, Math.atan2(P().y - g.y, P().x - g.x) + U.rand(-0.08, 0.08), 430); A.sfx("eshot2"); if (b.n >= 9) endAtk(b, 1.0); }
      } else if (b.atk === 1) {
        b.hatchT = 1;
        if (b.atkT > 0.5 && b.nt <= 0) {
          b.nt = 0.6; b.n++;
          const m = mouth(); fan(plasma, m.x, m.y, Math.atan2(P().y - m.y, P().x - m.x), 9, 1.2, 250);
          A.sfx("eshot2");
          if (b.n >= 3) { endAtk(b, 1.6); if (P2) fromLeft("raptor", U.rand(120, H - 140), 0); }
        }
      } else if (b.atk === 2) {
        b.hatchT = 0;
        if (b.nt <= 0) { b.nt = 0.3; b.n++; spawn("seeker", { x: b.x - 60 + b.n * 30, y: b.y - 90, vx: -120, vy: -280, noStat: true }); A.sfx("torpedo"); if (b.n >= 6) endAtk(b, 1.2); }
      } else if (b.atk === 3) {
        b.hatchT = 1;
        if (b.n < 2 && b.nt <= 0) {
          b.nt = 1.5; b.n++;
          const a = Math.atan2(P().y - mouth().y, P().x - mouth().x);
          for (const o of [-0.3, 0, 0.3]) laser(b, mouth, a + o + (b.n === 2 ? 0.15 : 0), 0.85, 0.5);
        }
        if (b.atkT > 3.2) endAtk(b, 1.6);
      }
    };
    b.draw = (ctx) => drawLeviathan(ctx, b);
    return b;
  };
  function drawLeviathan(ctx, b) {
    const x = b.x, y = b.y, hx = x + 40;
    // tail and propeller
    ctx.fillStyle = "#1a1e24";
    ctx.beginPath(); ctx.moveTo(hx + 180, y - 30); ctx.lineTo(hx + 280, y - 110); ctx.lineTo(hx + 300, y - 100); ctx.lineTo(hx + 240, y); ctx.lineTo(hx + 300, y + 100); ctx.lineTo(hx + 280, y + 110); ctx.lineTo(hx + 180, y + 30); ctx.fill();
    ctx.fillStyle = "#3a4048";
    for (let i = 0; i < 3; i++) { const a = b.t * 9 + (i * TAU) / 3; ctx.beginPath(); ctx.ellipse(hx + 235, y + Math.sin(a) * 34, 8, Math.abs(Math.cos(a)) * 30 + 4, 0, 0, TAU); ctx.fill(); }
    // hull
    let gr = ctx.createLinearGradient(0, y - 100, 0, y + 100);
    gr.addColorStop(0, "#9aa4ae"); gr.addColorStop(0.2, "#58626e"); gr.addColorStop(0.6, "#262c34"); gr.addColorStop(1, "#0a0c10");
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.moveTo(hx - 215, y + 10); ctx.bezierCurveTo(hx - 200, y - 90, hx + 60, y - 110, hx + 200, y - 40); ctx.lineTo(hx + 210, y + 40); ctx.bezierCurveTo(hx + 60, y + 108, hx - 200, y + 96, hx - 215, y + 10); ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.7)"; ctx.lineWidth = 2; ctx.stroke();
    ctx.save(); ctx.clip();
    ctx.strokeStyle = "rgba(0,0,0,0.45)"; ctx.lineWidth = 2;
    for (let i = -3; i < 8; i++) { ctx.beginPath(); ctx.moveTo(hx - 150 + i * 50, y - 120); ctx.lineTo(hx - 170 + i * 50, y + 120); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(hx - 220, y - 20); ctx.quadraticCurveTo(hx, y - 50, hx + 220, y - 20); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    for (let i = -3; i < 8; i++) for (let k = -2; k <= 2; k++) ctx.fillRect(hx - 140 + i * 50 - k * 4, y + k * 34, 3, 3);
    ctx.fillStyle = "rgba(255,255,255,0.12)"; ctx.beginPath(); ctx.ellipse(hx - 20, y - 70, 150, 14, -0.05, 0, TAU); ctx.fill();
    ctx.restore();
    // turrets
    for (const [g, s] of [[{ x: x - 20, y: y - 92 }, -1], [{ x: x + 50, y: y + 92 }, 1]]) {
      const a = Math.atan2(G.player.y - g.y, G.player.x - g.x);
      ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(a); ctx.fillStyle = "#2a2e34"; ctx.fillRect(0, -5, 34, 10); ctx.fillStyle = "#8a929c"; ctx.fillRect(28, -6, 6, 12); ctx.restore();
      ctx.fillStyle = "#3a4048"; ctx.beginPath(); ctx.ellipse(g.x, g.y, 22, 14, 0, s < 0 ? Math.PI : 0, s < 0 ? TAU : Math.PI); ctx.fill();
    }
    // jaw / hatch with the reactor behind
    const c = b.core(), op = b.hatch;
    ctx.fillStyle = "#08090c"; ctx.beginPath(); ctx.ellipse(c.x, c.y, 44, 34, 0, 0, TAU); ctx.fill();
    gr = ctx.createRadialGradient(c.x - 6, c.y - 6, 2, c.x, c.y, c.r);
    gr.addColorStop(0, b.flash > 0 ? "#fff" : "#fff2c0"); gr.addColorStop(0.4, b.flash > 0 ? "#fff" : "#ff8a20"); gr.addColorStop(1, "#4a1000");
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(c.x, c.y, c.r * (0.9 + 0.08 * Math.sin(b.t * 8)), 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = "lighter"; Gfx.glowAt(ctx, "255,140,40", c.x, c.y, 70, 0.25 + 0.5 * op); ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#3a4048"; ctx.strokeStyle = "#0a0c10"; ctx.lineWidth = 2;
    for (const s of [-1, 1]) {
      const off = op * 36;
      ctx.beginPath(); ctx.rect(c.x - 46, c.y + (s < 0 ? -36 - off : 0 + off), 92, 36); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#f0b020"; for (let i = 0; i < 4; i++) ctx.fillRect(c.x - 40 + i * 22, c.y + (s < 0 ? -8 - off : 2 + off), 12, 6);
      ctx.fillStyle = "#3a4048";
    }
    // eyes
    ctx.globalCompositeOperation = "lighter";
    for (const [ex, ey] of [[x - 150, y - 26], [x - 110, y - 40]]) Gfx.glowAt(ctx, b.flash > 0 ? "255,255,255" : "255,50,40", ex, ey, 16, 1, true);
    ctx.globalCompositeOperation = "source-over";
    lasersDraw(ctx, b, "255,120,40");
  }

  /* ---------- Boss 6: Prism Colossus ---------- */
  BOSSES.prism = function () {
    const b = bossBase({ name: "PRISM COLOSSUS", call: "Warning! Prism Colossus detected!", hp: 5800, maxHp: 5800, x: W + 300, cx: W - 300, prisms: [], respawned: false, lines: [], bonus: 100000 });
    b.core = () => ({ x: b.x - 62, y: b.y, r: 40 });
    b.bounds = () => ({ x: b.x, y: b.y, rx: 90, ry: 140 });
    b.test = (x, y, r) => {
      if (circHit(b.core(), x, y, r)) return "weak";
      if (ellHit({ x: b.x + 30, y: b.y, rx: 78, ry: 150 }, x, y, r)) return "armor";
      return null;
    };
    b.touch = (p) => ellHit({ x: b.x + 20, y: b.y, rx: 86, ry: 145 }, p.x, p.y, 8);
    function prisms(n) { for (let i = 0; i < n; i++) b.prisms.push(spawn("prism", { x: b.x, y: b.y, pi: i, pn: n, noStat: true })); }
    b.update = (dt) => {
      b.t += dt;
      lasersUpdate(b, dt);
      b.y += (vClamp(b, H / 2 + Math.sin(b.t * 0.6) * 90, 150) - b.y) * Math.min(1, dt * 2);
      if (!b.entered) { b.x += (b.cx - b.x) * Math.min(1, dt * 1.0); if (b.x < b.cx + 8) { b.entered = true; prisms(6); A.sfx("roar"); } }
      else b.x = b.cx + Math.sin(b.t * 0.4) * 30;
      b.prisms = b.prisms.filter((e) => !e.dead);
      b.prisms.forEach((e) => { const a = b.t * 0.7 + (e.pi * TAU) / e.pn; e.x = b.x - 20 + Math.cos(a) * 185; e.y = b.y + Math.sin(a) * 180; });
      b.vulnMul = b.prisms.length >= 3 ? 0.2 : 1;
      if (b.dying || !b.entered) return;
      const P2 = b.hp < b.maxHp * 0.5;
      if (P2 && !b.respawned) { b.respawned = true; prisms(4); A.sfx("roar"); }
      if (!cycle(b, dt, P2 ? [0, 2, 1, 3, 2] : [0, 2, 1], P2)) return;
      const c = b.core();
      if (b.atk === 0) {
        if (b.nt <= 0) { b.nt = P2 ? 0.065 : 0.08; const a = b.atkT * 2.2; for (let k = 0; k < 4; k++) shard(c.x, c.y, a + (k * TAU) / 4, 210); A.sfx("eshot"); }
        if (b.atkT > 3) endAtk(b, 1.2);
      } else if (b.atk === 1) {
        if (b.nt <= 0 && b.prisms.length) { b.nt = 0.16; const e = b.prisms[b.n % b.prisms.length]; shard(e.x, e.y, aim(e), 380); A.sfx("eshot2"); b.n++; }
        if (b.n >= 12 || !b.prisms.length) endAtk(b, 1.2);
      } else if (b.atk === 2) {
        if (b.n === 0) { b.n = 1; const a = Math.atan2(P().y - c.y, P().x - c.x); for (const o of [-0.32, 0, 0.32]) laser(b, b.core, a + o, 0.9, 0.55); }
        if (b.n === 1 && b.atkT > 1.6) { b.n = 2; const a = Math.atan2(P().y - c.y, P().x - c.x); for (const o of [-0.48, -0.16, 0.16, 0.48]) laser(b, b.core, a + o, 0.9, 0.55); }
        if (b.atkT > 3.2) endAtk(b, 1.2);
      } else if (b.atk === 3) {
        if (b.n === 0) { b.n = 1; for (let i = 0; i < 4; i++) fromEdge("seeker", U.rand(W * 0.25, W * 0.6), i % 2 === 0, i * 0.3, { vx: -40, vy: i % 2 === 0 ? 200 : -200, noStat: true }); }
        if (b.nt <= 0 && b.atkT > 1 && b.n < 3) { b.nt = 0.6; b.n++; ring(c.x, c.y, 20, 190 * sp(), b.n * 0.15, { k: "e_shard", rot: true, dmg: DMG() }); A.sfx("eshot2"); }
        if (b.atkT > 2.6) endAtk(b, 1.2);
      }
    };
    b.draw = (ctx) => drawPrism(ctx, b);
    return b;
  };
  function drawPrism(ctx, b) {
    const x = b.x + 20, y = b.y, c = b.core();
    // beams connecting the prisms
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `rgba(120,240,255,${0.18 + 0.1 * Math.sin(b.t * 4)})`; ctx.lineWidth = 2;
    for (const e of b.prisms) { ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(e.x, e.y); ctx.stroke(); }
    ctx.globalCompositeOperation = "source-over";
    // big crystal body made of facets
    const pts = [[0, -150], [60, -90], [92, -10], [70, 80], [20, 150], [-40, 120], [-90, 30], [-80, -70]];
    for (let i = 0; i < pts.length; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
      const shade = 0.5 + 0.5 * Math.sin(i * 1.7 + b.t * 0.8);
      ctx.fillStyle = `rgb(${20 + shade * 60 | 0},${90 + shade * 110 | 0},${130 + shade * 100 | 0})`;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + ax, y + ay); ctx.lineTo(x + bx, y + by); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(220,255,255,0.6)"; ctx.lineWidth = 1.5; ctx.stroke();
    }
    // spikes
    for (const [sx, sy, a, l] of [[40, -120, -1.1, 70], [80, -40, -0.4, 60], [70, 60, 0.5, 70], [-30, 125, 1.9, 50], [-60, -100, -2.2, 50]]) {
      ctx.save(); ctx.translate(x + sx, y + sy); ctx.rotate(a);
      ctx.fillStyle = "rgba(140,230,255,0.85)"; ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(l, 0); ctx.lineTo(0, 10); ctx.fill();
      ctx.restore();
    }
    // core
    ctx.fillStyle = "#04121a"; ctx.beginPath(); ctx.arc(c.x, c.y, c.r + 12, 0, TAU); ctx.fill();
    const gr = ctx.createRadialGradient(c.x - 8, c.y - 8, 3, c.x, c.y, c.r);
    gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.35, b.flash > 0 ? "#fff" : "#9af8ff"); gr.addColorStop(1, "#0a4a70");
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, TAU); ctx.fill();
    const pa = Math.atan2(G.player.y - c.y, G.player.x - c.x);
    ctx.fillStyle = "#03202e"; ctx.beginPath(); ctx.ellipse(c.x + Math.cos(pa) * 14, c.y + Math.sin(pa) * 14, 7, 18, 0, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = "lighter";
    Gfx.glowAt(ctx, "120,240,255", c.x, c.y, 120, 0.3);
    if (b.vulnMul < 1) {
      ctx.strokeStyle = `rgba(200,255,255,${0.45 + 0.2 * Math.sin(b.t * 8)})`; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(c.x, c.y, c.r + 20, 0, TAU); ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
    lasersDraw(ctx, b, "120,240,255");
  }

  /* ---------- Boss 7: Cryo Kraken ---------- */
  BOSSES.kraken = function () {
    const b = bossBase({ name: "CRYO KRAKEN", call: "Warning! The Cryo Kraken is rising!", hp: 6400, maxHp: 6400, x: W + 320, cx: W - 230, slams: [], bonus: 120000 });
    b.core = () => ({ x: b.x - 52, y: b.y + 6, r: 30 });
    const beak = () => ({ x: b.x - 92, y: b.y + 62 });
    b.bounds = () => ({ x: b.x + 30, y: b.y, rx: 110, ry: 130 });
    b.test = (x, y, r) => {
      if (circHit(b.core(), x, y, r)) return "weak";
      if (ellHit({ x: b.x + 30, y: b.y - 10, rx: 115, ry: 135 }, x, y, r)) return "armor";
      return null;
    };
    b.touch = (p) => {
      if (ellHit({ x: b.x + 30, y: b.y - 10, rx: 108, ry: 128 }, p.x, p.y, 8)) return true;
      for (const s of b.slams) if (s.ext > 0.3 && Math.abs(p.x - s.x) < 30 && (s.top ? p.y < s.ext * s.len : p.y > H - s.ext * s.len)) return true;
      return false;
    };
    function slam(top) { b.slams.push({ x: U.clamp(P().x + U.rand(-20, 20), 70, W - 400), top, t: 0, ext: 0, len: H * 0.7 }); A.sfx("charge"); }
    b.update = (dt) => {
      b.t += dt;
      for (const s of b.slams) {
        s.t += dt;
        if (s.t < 0.8) s.ext = 0;
        else if (s.t < 0.95) { s.ext = (s.t - 0.8) / 0.15; if (!s.hit) { s.hit = true; A.sfx("dart"); Fx.shake = Math.max(Fx.shake, 10); } }
        else if (s.t < 1.45) s.ext = 1;
        else s.ext = Math.max(0, 1 - (s.t - 1.45) / 0.5);
      }
      b.slams = b.slams.filter((s) => s.t < 2);
      if (b.dying) b.slams.length = 0;
      b.y += (vClamp(b, H / 2 + Math.sin(b.t * 0.5) * 60, 140) - b.y) * Math.min(1, dt * 2);
      if (!b.entered) { b.x += (b.cx - b.x) * Math.min(1, dt * 1.0); if (b.x < b.cx + 8) { b.entered = true; A.sfx("roar"); } return; }
      b.x = b.cx + Math.sin(b.t * 0.35) * 30;
      if (b.dying) return;
      const P2 = b.hp < b.maxHp * 0.5;
      if (!cycle(b, dt, P2 ? [0, 1, 2, 3, 1, 2] : [0, 1, 2], P2)) return;
      if (b.atk === 0) {
        if (b.nt <= 0) {
          b.nt = P2 ? 0.085 : 0.11;
          const x = U.rand(40, W - 320), y = Math.max(0, G.ceilAt(x)) + 10;
          shard(x, y, Math.PI / 2 + U.rand(-0.15, 0.05), U.rand(300, 400), { dmg: DMG() - 4 });
          if (Math.random() < 0.3) A.sfx("ping");
        }
        if (b.atkT > 2.6) endAtk(b, 1.2);
      } else if (b.atk === 1) {
        if (b.nt <= 0) { b.nt = 0.7; slam(b.n % 2 === 0); b.n++; if (b.n >= (P2 ? 4 : 3)) endAtk(b, 1.8); }
      } else if (b.atk === 2) {
        if (b.nt <= 0) { b.nt = 0.55; b.n++; const m = beak(); fan(shard, m.x, m.y, Math.atan2(P().y - m.y, P().x - m.x), 13, 1.2, 250); A.sfx("eshot2"); if (b.n >= 3) endAtk(b, 1.2); }
      } else if (b.atk === 3) {
        if (b.n === 0) { b.n = 1; fromEdge("diver", U.rand(W * 0.35, W * 0.55), true, 0, { noStat: true }); fromEdge("diver", U.rand(W * 0.35, W * 0.55), false, 0.4, { noStat: true }); }
        if (b.nt <= 0 && b.atkT > 1 && b.n < 4) { b.nt = 0.4; b.n++; const c = b.core(); fan(plasma, c.x, c.y, Math.atan2(P().y - c.y, P().x - c.x), 3, 0.3, 260); A.sfx("eshot2"); }
        if (b.atkT > 2.6) endAtk(b, 1.2);
      }
    };
    b.draw = (ctx) => drawKraken(ctx, b);
    return b;
  };
  function tentacle(ctx, pts, w0, col, tip) {
    for (let i = 0; i < pts.length - 1; i++) {
      const k = i / (pts.length - 1);
      ctx.strokeStyle = col; ctx.lineWidth = w0 * (1 - k * 0.8);
      ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[i + 1][0], pts[i + 1][1]); ctx.stroke();
    }
    ctx.fillStyle = tip;
    for (let i = 1; i < pts.length - 1; i += 2) { ctx.beginPath(); ctx.arc(pts[i][0], pts[i][1], 3.5 * (1 - i / pts.length) + 1.5, 0, TAU); ctx.fill(); }
  }
  function drawKraken(ctx, b) {
    const x = b.x, y = b.y;
    ctx.lineCap = "round";
    // slam tentacles from the top and bottom edges
    for (const s of b.slams) {
      if (s.ext <= 0) {
        const a = 0.2 + 0.3 * Math.abs(Math.sin(s.t * 20));
        ctx.fillStyle = `rgba(200,240,255,${a * 0.35})`; ctx.fillRect(s.x - 26, s.top ? 0 : H - s.len, 52, s.len);
        ctx.globalCompositeOperation = "lighter"; Gfx.glowAt(ctx, "200,240,255", s.x, s.top ? 10 : H - 10, 40, a); ctx.globalCompositeOperation = "source-over";
        continue;
      }
      const L = s.ext * s.len, pts = [];
      for (let i = 0; i <= 10; i++) { const k = i / 10; pts.push([s.x + Math.sin(k * 6 + b.t * 6) * 8 * k, s.top ? -20 + k * (L + 20) : H + 20 - k * (L + 20)]); }
      tentacle(ctx, pts, 64, "#101a2c", "#101a2c");
      tentacle(ctx, pts, 56, "#2e4664", "#e8f4ff");
      ctx.strokeStyle = "rgba(200,235,255,0.45)"; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(pts[0][0] - 10, pts[0][1]); for (const p of pts) ctx.lineTo(p[0] - 10, p[1]); ctx.stroke();
    }
    // tentacles behind the mantle
    for (let i = 0; i < 6; i++) {
      const pts = [], base = [x - 30 + i * 18, y + 90];
      for (let k = 0; k <= 9; k++) {
        const kk = k / 9, a = 1.2 + i * 0.28 + Math.sin(b.t * 1.6 + i + kk * 3) * 0.45 * kk;
        pts.push([base[0] + Math.cos(a) * kk * 220 + kk * 20, base[1] + Math.sin(a) * kk * 200]);
      }
      tentacle(ctx, pts, 22, i % 2 ? "#46647e" : "#5a7a96", "#d8ecff");
    }
    // mantle
    let gr = ctx.createRadialGradient(x - 10, y - 70, 10, x + 30, y - 10, 170);
    gr.addColorStop(0, "#f2faff"); gr.addColorStop(0.4, "#9ab8d4"); gr.addColorStop(0.8, "#3a5876"); gr.addColorStop(1, "#14243a");
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.moveTo(x - 90, y + 70); ctx.bezierCurveTo(x - 110, y - 60, x - 40, y - 150, x + 60, y - 140); ctx.bezierCurveTo(x + 170, y - 120, x + 160, y + 40, x + 110, y + 90); ctx.quadraticCurveTo(x + 10, y + 120, x - 90, y + 70); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(x + ((i * 47) % 170) - 30, y - 100 + ((i * 31) % 140), 3 + (i % 3) * 2, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = "rgba(20,40,70,0.5)"; ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(x + 40, y + 40, 60 + i * 30, Math.PI * 1.15, Math.PI * 1.6); ctx.stroke(); }
    // beak
    const m = beak2(b);
    ctx.fillStyle = "#1a2030"; ctx.beginPath(); ctx.moveTo(m.x + 30, m.y - 16); ctx.lineTo(m.x - 18, m.y); ctx.lineTo(m.x + 30, m.y + 16); ctx.fill();
    // eye
    const c = b.core();
    ctx.fillStyle = "#0c1420"; ctx.beginPath(); ctx.ellipse(c.x, c.y, c.r + 10, c.r + 4, 0, 0, TAU); ctx.fill();
    gr = ctx.createRadialGradient(c.x - 6, c.y - 6, 2, c.x, c.y, c.r);
    gr.addColorStop(0, b.flash > 0 ? "#fff" : "#fffbd0"); gr.addColorStop(0.45, b.flash > 0 ? "#fff" : "#40e0ff"); gr.addColorStop(1, "#0a3050");
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, TAU); ctx.fill();
    const pa = Math.atan2(G.player.y - c.y, G.player.x - c.x);
    ctx.fillStyle = "#020810"; ctx.beginPath(); ctx.ellipse(c.x + Math.cos(pa) * 10, c.y + Math.sin(pa) * 10, 16, 5, 0, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = "lighter"; Gfx.glowAt(ctx, "120,230,255", c.x, c.y, 80, 0.35); ctx.globalCompositeOperation = "source-over";
  }
  const beak2 = (b) => ({ x: b.x - 92, y: b.y + 62 });

  /* ---------- Boss 8: Omega Heart ---------- */
  BOSSES.omega = function () {
    const b = bossBase({ name: "OMEGA HEART", call: "Warning! The Omega Heart has awakened!", hp: 8000, maxHp: 8000, x: W + 320, cx: W - 270, gens: [], respawned: false, lines: [], bonus: 150000 });
    b.beat = () => 1 + 0.07 * Math.pow(Math.max(0, Math.sin(b.t * (b.hp < b.maxHp * 0.3 ? 9 : 6))), 6);
    b.core = () => ({ x: b.x - 20, y: b.y, r: 50 * b.beat() });
    b.bounds = () => ({ x: b.x, y: b.y, rx: 120, ry: 150 });
    b.test = (x, y, r) => {
      if (circHit(b.core(), x, y, r)) return "weak";
      if (ellHit({ x: b.x + 60, y: b.y, rx: 95, ry: 150 }, x, y, r) || ellHit({ x: b.x + 10, y: b.y - 92, rx: 95, ry: 50 }, x, y, r) || ellHit({ x: b.x + 10, y: b.y + 92, rx: 95, ry: 50 }, x, y, r)) return "armor";
      return null;
    };
    b.touch = (p) => ellHit({ x: b.x + 20, y: b.y, rx: 118, ry: 148 }, p.x, p.y, 8);
    function gens(n, off = 0) { for (let i = 0; i < n; i++) b.gens.push(spawn("gen", { x: b.x, y: b.y, gi: i, gn: n, off, noStat: true })); }
    b.update = (dt) => {
      b.t += dt;
      lasersUpdate(b, dt);
      b.y += (vClamp(b, H / 2 + Math.sin(b.t * 0.45) * 80, 150) - b.y) * Math.min(1, dt * 2);
      if (!b.entered) { b.x += (b.cx - b.x) * Math.min(1, dt * 0.9); if (b.x < b.cx + 8) { b.entered = true; gens(4); A.sfx("roar"); } }
      else b.x = b.cx + Math.sin(b.t * 0.3) * 30;
      b.gens = b.gens.filter((e) => !e.dead);
      b.gens.forEach((e) => { const a = b.t * 0.3 + e.off + (e.gi * TAU) / e.gn + Math.PI / 4; e.x = b.x + Math.cos(a) * 210; e.y = b.y + Math.sin(a) * 190; });
      b.vulnMul = b.gens.length ? 0.15 : 1;
      if (b.dying || !b.entered) return;
      const P2 = b.hp < b.maxHp * 0.5, rage = b.hp < b.maxHp * 0.3;
      if (P2 && !b.respawned) { b.respawned = true; gens(2, 0.8); A.sfx("roar"); A.say("Shield generators restored!", { rate: 1.05 }); }
      if (!cycle(b, dt, P2 ? [0, 1, 2, 3, 4, 1] : [0, 1, 2, 3], rage)) return;
      const c = b.core();
      if (b.atk === 0) {
        if (b.nt <= 0) {
          b.nt = rage ? 0.07 : 0.09; const a = b.atkT * 2;
          for (let k = 0; k < 3; k++) bolt(c.x, c.y, a + (k * TAU) / 3, 220);
          if (P2) bolt(c.x, c.y, -a * 1.3, 200);
          A.sfx("eshot");
        }
        if (b.atkT > 3.4) endAtk(b, 1.1);
      } else if (b.atk === 1) {
        const set = (o) => { const a = Math.atan2(P().y - c.y, P().x - c.x); for (const d of o) laser(b, b.core, a + d, 0.85, 0.5); };
        if (b.n === 0) { b.n = 1; set([-0.42, 0, 0.42, U.rand(0.7, 0.9) * U.pick([-1, 1])]); }
        if (b.n === 1 && b.atkT > 1.55) { b.n = 2; set([-0.2, 0.2, -0.62, 0.62]); }
        if (b.atkT > 3.1) endAtk(b, 1.2);
      } else if (b.atk === 2) {
        if (b.n === 0) {
          b.n = 1;
          fromLeft("raptor", U.rand(120, H / 2 - 40), 0, { noStat: true }); fromLeft("raptor", U.rand(H / 2 + 40, H - 120), 0.4, { noStat: true });
          fromEdge("diver", U.rand(W * 0.3, W * 0.5), true, 0.8, { noStat: true }); fromEdge("diver", U.rand(W * 0.3, W * 0.5), false, 1.1, { noStat: true });
          if (P2) swarmPack("top", 1.6);
        }
        if (b.atkT > 2.6) endAtk(b, 1.4);
      } else if (b.atk === 3) {
        if (b.nt <= 0) {
          b.nt = 0.7; b.n++;
          const gapA = Math.atan2(P().y - c.y, P().x - c.x) + U.rand(-0.4, 0.4), n = 26;
          for (let i = 0; i < n; i++) { const a = (i * TAU) / n; if (Math.abs(U.angDiff(a, gapA)) < 0.36) continue; plasma(c.x, c.y, a, 200, { r: 8 }); }
          A.sfx("eshot2");
          if (b.n >= 3) endAtk(b, 1.2);
        }
      } else if (b.atk === 4) {
        if (b.nt <= 0) { b.nt = 0.25; b.n++; plasma(c.x, c.y, Math.atan2(P().y - c.y, P().x - c.x) + U.rand(-1.2, 1.2), 190, { home: 1.6 }); A.sfx("eshot"); if (b.n >= 6) endAtk(b, 1.2); }
      }
    };
    b.draw = (ctx) => drawOmega(ctx, b);
    return b;
  };
  function drawOmega(ctx, b) {
    const x = b.x, y = b.y, c = b.core(), s = b.beat();
    // cables to the generators
    ctx.lineCap = "round";
    for (const e of b.gens) {
      ctx.strokeStyle = "#2a0e16"; ctx.lineWidth = 9;
      ctx.beginPath(); ctx.moveTo(x + 20, y); ctx.quadraticCurveTo((x + e.x) / 2, (y + e.y) / 2 + 40, e.x, e.y); ctx.stroke();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = `rgba(255,40,90,${0.3 + 0.3 * Math.sin(b.t * 6)})`; ctx.lineWidth = 2; ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    }
    // pipes at the back
    ctx.strokeStyle = "#1e0a10"; ctx.lineWidth = 26;
    for (const a of [-0.8, -0.3, 0.3, 0.8]) { ctx.beginPath(); ctx.moveTo(x + 40, y + a * 90); ctx.quadraticCurveTo(x + 200, y + a * 150, x + 360, y + a * 260); ctx.stroke(); }
    // muscle body
    ctx.save(); ctx.translate(x + 20, y); ctx.scale(s, s);
    let gr = ctx.createRadialGradient(-30, -60, 10, 0, 0, 170);
    gr.addColorStop(0, "#a03048"); gr.addColorStop(0.45, "#5a1222"); gr.addColorStop(1, "#18040a");
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.moveTo(0, 150); ctx.bezierCurveTo(-150, 60, -140, -130, -30, -140); ctx.bezierCurveTo(10, -150, 30, -110, 40, -100); ctx.bezierCurveTo(70, -150, 140, -120, 125, -20); ctx.bezierCurveTo(115, 60, 60, 110, 0, 150); ctx.fill();
    // metal bands
    ctx.strokeStyle = "#6a6e78"; ctx.lineWidth = 8;
    for (const yy of [-70, 0, 70]) { ctx.beginPath(); ctx.ellipse(0, yy, 124 - Math.abs(yy) * 0.3, 20, 0, 0.15, Math.PI - 0.15); ctx.stroke(); }
    ctx.fillStyle = "#c0c6ce"; for (const yy of [-70, 0, 70]) for (const xx of [-60, 0, 60]) ctx.fillRect(xx - 3, yy + 16, 6, 6);
    // veins
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `rgba(255,50,90,${0.35 + 0.35 * (s - 1) * 14})`; ctx.lineWidth = 2.5;
    for (let i = 0; i < 6; i++) { const a = -1.4 + i * 0.55; ctx.beginPath(); ctx.moveTo(-40, 0); ctx.quadraticCurveTo(Math.cos(a) * 60, Math.sin(a) * 90, Math.cos(a) * 110, Math.sin(a) * 130); ctx.stroke(); }
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
    // core
    ctx.fillStyle = "#0c0204"; ctx.beginPath(); ctx.arc(c.x, c.y, c.r + 14, 0, TAU); ctx.fill();
    gr = ctx.createRadialGradient(c.x - 10, c.y - 10, 4, c.x, c.y, c.r);
    gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.3, b.flash > 0 ? "#fff" : "#ff6a8a"); gr.addColorStop(0.8, "#8a0020"); gr.addColorStop(1, "#2a0008");
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, TAU); ctx.fill();
    ctx.strokeStyle = "rgba(20,0,6,0.6)"; ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) { const a = b.t * 0.8 + (i * TAU) / 6; ctx.beginPath(); ctx.moveTo(c.x + Math.cos(a) * c.r * 0.3, c.y + Math.sin(a) * c.r * 0.3); ctx.lineTo(c.x + Math.cos(a) * c.r * 0.95, c.y + Math.sin(a) * c.r * 0.95); ctx.stroke(); }
    ctx.globalCompositeOperation = "lighter";
    Gfx.glowAt(ctx, "255,40,90", c.x, c.y, 140, 0.25 + (s - 1) * 4);
    if (b.vulnMul < 1) {
      ctx.strokeStyle = `rgba(255,120,160,${0.45 + 0.2 * Math.sin(b.t * 8)})`; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(c.x, c.y, c.r + 26, 0, TAU); ctx.stroke();
      Gfx.glowAt(ctx, "255,80,140", c.x, c.y, c.r + 50, 0.25);
    }
    ctx.globalCompositeOperation = "source-over";
    lasersDraw(ctx, b, "255,50,100");
  }
})(window.XA);
