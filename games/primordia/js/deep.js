/* PRIMORDIA: four later ages (stages 5–8) – new enemies from every side, fixed obstacles and four new bosses */
"use strict";

(function (XA) {
  const { U, Gfx, Fx, G } = XA;
  const A = XA.Audio;
  const PW = G.PW, PH = G.PH, TAU = U.TAU;
  const { spawn, eshot, ring, aim, canShoot, safeX, q, group, killEnemy, endAtk, enter, circHit, ellHit, bossBase, PAT, BOSSES, ED } = G.lib;

  /* ---------- Stages ---------- */
  G.LEVELS.push(
    {
      name: "Ice Age", sub: "THE LATER AGES", theme: "ice", song: "age5", bossSong: "boss2", speed: 90, seed: 71, boss: "mammothrax",
      walls: { base: 60, amp: 120, scale: 440 },
      halves: [
        ["needles", "skimmers", "gate", "stalkers", "sentinels", "spurs", "hornetsSide", "ark", "skimmers", "crawlers", "needles2", "warden", "stalkers"],
        ["hornetsAll", "blocks", "skimmers", "seekers", "stalkers", "gate", "needles2", "sentinels", "ark", "crawlers", "spurs", "warden", "skimmers", "hornetsAll"],
      ],
    },
    {
      name: "Ember Age", sub: "THE LATER AGES", theme: "ember", song: "age6", bossSong: "boss2", speed: 95, seed: 83, boss: "pyrodrake",
      walls: { base: 70, amp: 130, scale: 400 },
      halves: [
        ["skimmers", "spurs", "stalkers", "needles2", "seekers", "gate", "warden", "hornetsAll", "crawlers", "maze", "skimmers", "ark", "stalkers"],
        ["stalkers", "blocks", "hornetsSide", "sentinels", "skimmers", "maze", "warden", "needles2", "seekers", "gate", "stalkers", "ark", "crawlers", "hornetsAll"],
      ],
    },
    {
      name: "Machine Age", sub: "THE LATER AGES", theme: "machine", song: "age7", bossSong: "boss2", speed: 100, seed: 97, boss: "colossus",
      walls: { base: 70, amp: 130, scale: 360 },
      halves: [
        ["hornetsAll", "maze", "skimmers", "stalkers", "warden", "sentinels", "spurs", "seekers", "needles2", "ark", "crawlers", "gate", "skimmers", "stalkers"],
        ["skimmers", "stalkers", "blocks", "warden", "hornetsSide", "maze", "seekers", "crawlers", "needles2", "gate", "warden", "ark", "stalkers", "hornetsAll"],
      ],
    },
    {
      name: "Star Seed", sub: "THE LATER AGES", theme: "star", song: "age8", bossSong: "boss2", speed: 105, seed: 113, boss: "astral",
      walls: { base: 60, amp: 120, scale: 340 },
      halves: [
        ["hornetsAll", "skimmers", "maze", "stalkers", "warden", "seekers", "gate", "needles2", "sentinels", "skimmers", "ark", "spurs", "stalkers", "hornetsAll"],
        ["warden", "stalkers", "maze", "skimmers", "seekers", "blocks", "hornetsAll", "warden", "needles2", "gate", "stalkers", "crawlers", "ark", "skimmers", "hornetsAll"],
      ],
    },
  );

  /* ---------- Helpers ---------- */
  const deep = () => Math.max(0, G.run.level - 4);
  const sp = () => 1 + 0.06 * deep();
  const DMG = () => 32 + 3 * deep();      // the first four stages do 20
  const HEAVY = () => 42 + 3 * deep();
  const cs = (e) => canShoot(e) && e.x > 10 && e.x < PW - 10;
  const P = () => G.player;
  const bolt = (x, y, a, s, o = {}) => eshot(x, y, a, s * sp(), Object.assign({ k: "e_bolt", rot: true, r: 6, dmg: DMG() }, o));
  const plasma = (x, y, a, s, o = {}) => eshot(x, y, a, s * sp(), Object.assign({ k: "e_plasma", r: 9, dmg: HEAVY() }, o));
  const shard = (x, y, a, s, o = {}) => eshot(x, y, a, s * sp(), Object.assign({ k: "e_shard", rot: true, r: 6, dmg: DMG() }, o));
  const ember = (x, y, a, s, o = {}) => eshot(x, y, a, s * sp(), Object.assign({ k: "e_ember", r: 8, dmg: DMG() }, o));
  const fan = (fn, x, y, a, n, spread, s, o) => { for (let i = 0; i < n; i++) fn(x, y, a - spread / 2 + (n > 1 ? (spread * i) / (n - 1) : spread / 2), s, o); };
  const DOWN = Math.PI / 2;
  const OBST = () => ({ ice: "ice", ember: "ember", machine: "machine", star: "star" })[G.L.theme] || "machine";
  const corridor = (y = -30) => [G.leftAt(y), G.rightAt(y)];
  const engine = (ctx, x, y, rgb, r) => { ctx.globalCompositeOperation = "lighter"; Gfx.glowAt(ctx, rgb, x, y, r, 0.8, true); ctx.globalCompositeOperation = "source-over"; };

  /* ---------- New enemies ---------- */
  Object.assign(ED, {
    // fast jet crossing the screen from the left or right
    skimmer: {
      hp: 20, rx: 20, ry: 18, score: 400, spr: "skimmer", free: true, touch: 40,
      init(e) { e.dir = e.x < PW / 2 ? 1 : -1; e.vx = e.dir * 560 * sp(); e.y0 = e.y; e.shots = [0.35, 0.95]; },
      update(e, dt) {
        e.x += e.vx * dt; e.y = e.y0 + Math.sin(e.t * 3) * 22;
        e.ang = e.dir > 0 ? -Math.PI / 2 : Math.PI / 2;
        if (e.shots.length && e.t > e.shots[0]) { e.shots.shift(); if (cs(e)) { bolt(e.x, e.y + 10, aim(e), 420); A.sfx("eshot"); } }
        if (Math.random() < 0.5) Fx.glow(e.x - e.dir * 28, e.y, 3, 9, "255,90,40", 0.4);
      },
    },
    // rises from behind (bottom), brakes above the ship, fires and flies on
    stalker: {
      hp: 26, rx: 18, ry: 22, score: 450, spr: "stalker", free: true, touch: 40,
      init(e) { e.vy = -540 * sp(); e.state = 0; e.ang = Math.PI; },
      update(e, dt) {
        if (e.state === 0) {
          e.y += e.vy * dt;
          if (!P().dead) e.x += (P().x - e.x) * Math.min(1, dt * 0.6);
          if (e.y < Math.max(110, P().y - 230)) { e.state = 1; e.st = 0; }
        } else if (e.state === 1) {
          e.st += dt; e.vy *= Math.pow(0.03, dt); e.y += e.vy * dt;
          if (e.st > 0.25 && !e.shot) { e.shot = true; if (cs(e)) { fan(bolt, e.x, e.y + 20, aim(e), 5, 0.7, 380); A.sfx("eshot2"); } }
          if (e.st > 0.8) { e.state = 2; }
        } else { e.vy = Math.max(-520, e.vy - 900 * dt); e.y += e.vy * dt; }
        const want = e.state === 1 ? aim(e) - Math.PI / 2 : Math.PI;
        e.ang += U.angDiff(want, e.ang) * Math.min(1, dt * 8);
        if (Math.random() < 0.4) Fx.glow(e.x, e.y + (e.state === 1 ? -26 : 26), 3, 8, "120,255,160", 0.35);
      },
    },
    // needle ships in a fast weaving chain from the top
    needle: {
      hp: 16, rx: 9, ry: 24, score: 300, spr: "needle",
      init(e) { e.x0 = e.x; e.amp = Math.min(110, (G.rightAt(0) - G.leftAt(0)) / 2 - 60); e.fireT = 0.6 + (e.idx || 0) * 0.12; },
      update(e, dt) {
        if (e.t < 0) { e.hidden = true; return; }
        e.hidden = false;
        const ph = e.t * 3.6 + (e.idx || 0) * 0.5;
        e.y = -40 + 400 * sp() * e.t; e.x = e.x0 + Math.sin(ph) * e.amp;
        e.ang = -Math.cos(ph) * 0.5;
        e.fireT -= dt;
        if (e.fireT <= 0) { e.fireT = 1.2; if ((e.idx || 0) % 2 === 0 && cs(e)) { bolt(e.x, e.y + 26, aim(e), 430); A.sfx("eshot"); } }
      },
    },
    // small fast hornets in packs from any edge
    hornet: {
      hp: 8, rx: 11, ry: 11, score: 150, spr: "hornet", free: true, touch: 30,
      init(e) { e.fireAt = U.rand(0.6, 1.2); },
      update(e, dt) {
        if (e.t < 1.5 && !P().dead) { const a = aim(e); e.vx += Math.cos(a) * 520 * dt; e.vy += Math.sin(a) * 520 * dt; }
        const s = Math.hypot(e.vx, e.vy), max = 340 * sp();
        if (s > max) { e.vx *= max / s; e.vy *= max / s; }
        e.x += e.vx * dt; e.y += e.vy * dt;
        e.ang = Math.atan2(e.vy, e.vx) - Math.PI / 2;
        if (!e.shot && e.t > e.fireAt) { e.shot = true; if (cs(e)) { bolt(e.x, e.y, aim(e), 400); A.sfx("eshot"); } }
      },
    },
    // homing spike mine: bursts into a ring unless it is shot down in time
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
    // heavy gunship: plasma fans, bolt bursts and seeker launches
    warden: {
      hp: 240, rx: 52, ry: 44, score: 3000, spr: "warden", drop: "power", coins: 8, touch: 50,
      init(e) { e.ty = U.rand(120, 180); e.fireT = 1.4; e.mode = 0; e.x0 = e.x; },
      update(e, dt) {
        if (e.t < 12) { e.y += (e.ty - e.y) * Math.min(1, dt * 1.3); e.x = safeX(e.x0 + Math.sin(e.t * 0.7) * 140, 60, e.y); }
        else e.y += 130 * dt;
        e.fireT -= dt;
        if (e.fireT <= 0 && cs(e)) {
          e.fireT = 1.5;
          const m = e.mode++ % 3;
          if (m === 0) { fan(plasma, e.x, e.y + 44, aim(e), 7, 1.0, 250); A.sfx("eshot2"); }
          else if (m === 1) { for (let i = 0; i < 5; i++) q(i * 0.08, () => { if (!e.dead) { bolt(e.x - 28, e.y + 46, aim(e), 480); bolt(e.x + 28, e.y + 46, aim(e), 480); A.sfx("eshot"); } }); }
          else { spawn("seeker", { x: e.x - 50, y: e.y, vx: -260, vy: -60, noStat: true }); spawn("seeker", { x: e.x + 50, y: e.y, vx: 260, vy: -60, noStat: true }); A.sfx("missile"); }
        }
      },
    },
    // saw disc that races along a wall, from the top or from behind
    crawler: {
      hp: 50, rx: 20, ry: 20, score: 400, spr: "crawler", free: true, touch: 45,
      init(e) { e.dir = e.dir || 1; e.y = e.dir > 0 ? -30 : PH + 30; e.spd = (e.dir > 0 ? 300 : 360) * sp(); },
      update(e, dt) {
        e.y += e.dir * e.spd * dt; e.ang += e.dir * (e.spd / 21) * dt;
        e.x = e.side === "R" ? G.rightAt(e.y) - 21 : G.leftAt(e.y) + 21;
        if (Math.random() < 0.6 && e.y > 0 && e.y < PH) Fx.hitSpark(e.x + (e.side === "R" ? 20 : -20), e.y, "255,210,120", 1);
      },
    },
    // wall-mounted lance emitter: charges and fires three fast lances
    sentinel: {
      hp: 70, rx: 20, ry: 20, score: 800, anchored: true,
      init(e) { e.w0 = G.dist + PH + 40; e.fireT = 1.5; e.burst = 0; e.ang = e.side === "R" ? Math.PI : 0; this.place(e); },
      place(e) { e.y = PH - (e.w0 - G.dist); e.x = e.side === "R" ? Math.min(PW - 22, G.rightAt(e.y) + 4) : Math.max(22, G.leftAt(e.y) - 4); },
      update(e, dt) {
        this.place(e);
        if (e.burst <= 0) e.ang += U.angDiff(aim(e), e.ang) * Math.min(1, dt * 5);
        e.fireT -= dt;
        if (e.fireT <= 0) {
          if (e.burst <= 0) { e.burst = 3; e.bt = 0; }
          e.bt -= dt;
          if (e.bt <= 0) { e.bt = 0.12; e.burst--; if (cs(e)) { bolt(e.x + Math.cos(e.ang) * 26, e.y + Math.sin(e.ang) * 26, e.ang, 640, { r: 7, dmg: DMG() + 4 }); A.sfx("eshot2"); } if (e.burst <= 0) e.fireT = 2.3; }
        }
      },
      draw(ctx, e, white) {
        const charge = e.fireT < 0.7 ? 1 - e.fireT / 0.7 : 0;
        ctx.save(); ctx.translate(e.x, e.y);
        const gr = ctx.createRadialGradient(-6, -6, 3, 0, 0, 24);
        gr.addColorStop(0, white ? "#fff" : "#c0c6ce"); gr.addColorStop(0.6, white ? "#fff" : "#5a2028"); gr.addColorStop(1, "#14060a");
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, 22, 0, TAU); ctx.fill();
        ctx.strokeStyle = "rgba(255,80,60,0.6)"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.rotate(e.ang);
        ctx.fillStyle = white ? "#fff" : "#2a2e36"; ctx.fillRect(0, -6, 32, 12);
        ctx.fillStyle = white ? "#fff" : "#8a929c"; ctx.fillRect(24, -7, 8, 14);
        ctx.globalCompositeOperation = "lighter"; Gfx.glowAt(ctx, "255,80,60", 32, 0, 10 + charge * 24, 0.4 + charge * 0.6, true);
        ctx.restore();
      },
    },
    // armoured ark carrying an item
    ark: {
      hp: 90, rx: 34, ry: 38, score: 1200, spr: "ark", drop: "item", coins: 6,
      init(e) { e.x0 = e.x; e.fireT = 1.4; },
      update(e, dt) {
        e.y += 70 * dt; e.x = e.x0 + Math.sin(e.t * 1.1) * 30;
        e.fireT -= dt;
        if (e.fireT <= 0) { e.fireT = 2.2; if (cs(e)) { ring(e.x, e.y, 10, 170 * sp(), e.t, { k: "e_plasma", r: 8, dmg: HEAVY() }); A.sfx("eshot2"); } }
      },
    },
    // boss parts
    cinder: {
      hp: 170, rx: 20, ry: 20, score: 1500, noScale: true, free: true, touch: 40,
      update(e) { e.ang += 0.05; },
      draw(ctx, e, white) {
        ctx.globalCompositeOperation = "lighter";
        Gfx.glowAt(ctx, "255,110,30", e.x, e.y, 40, 0.6 + 0.2 * Math.sin(e.t * 8));
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = white ? "#fff" : "#2a120c"; ctx.beginPath();
        for (let i = 0; i < 9; i++) { const a = e.ang + (i * TAU) / 9, r = i % 2 ? 14 : 22; ctx.lineTo(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r); }
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = white ? "#fff" : "#ffcc50"; ctx.beginPath(); ctx.arc(e.x, e.y, 9, 0, TAU); ctx.fill();
      },
    },
    gen: {
      hp: 300, rx: 26, ry: 26, score: 3000, noScale: true, free: true, touch: 45,
      init(e) { e.fireT = 1.5 + (e.gi || 0) * 0.6; },
      update(e, dt) { e.ang += dt * 1.5; e.fireT -= dt; if (e.fireT <= 0) { e.fireT = 2.6; if (cs(e)) { bolt(e.x, e.y, aim(e), 380); A.sfx("eshot"); } } },
      draw(ctx, e, white) {
        ctx.save(); ctx.translate(e.x, e.y);
        ctx.fillStyle = white ? "#fff" : "#1a1240";
        ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = e.ang + (i * TAU) / 8, r = i % 2 ? 20 : 28; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "rgba(190,150,255,0.8)"; ctx.lineWidth = 2; ctx.stroke();
        const gr = ctx.createRadialGradient(-4, -4, 1, 0, 0, 14);
        gr.addColorStop(0, "#fff"); gr.addColorStop(0.4, white ? "#fff" : "#a070ff"); gr.addColorStop(1, "#1a0840");
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, 13, 0, TAU); ctx.fill();
        ctx.globalCompositeOperation = "lighter"; Gfx.glowAt(ctx, "170,120,255", 0, 0, 44, 0.45 + 0.25 * Math.sin(e.t * 6));
        ctx.restore();
      },
    },
  });

  /* ---------- Attack patterns (arrows warn of enemies from the sides and from behind) ---------- */
  function fromEdge(type, x, y, delay, o = {}) {
    q(delay, () => G.edgeWarn(x, y));
    q(delay + 0.75, () => spawn(type, Object.assign({ x, y }, o)));
  }
  function hornetPack(edge, delay) {
    const n = 5 + Math.min(2, deep()), [l, r] = corridor(PH / 2);
    let x, y, vx, vy;
    if (edge === "left") { x = -30; y = U.rand(120, 360); vx = 260; vy = 40; }
    else if (edge === "right") { x = PW + 30; y = U.rand(120, 360); vx = -260; vy = 40; }
    else if (edge === "bottom") { x = U.rand(l + 60, r - 60); y = PH + 30; vx = 0; vy = -280; }
    else { x = U.rand(l + 60, r - 60); y = -30; vx = 0; vy = 260; }
    q(delay, () => G.edgeWarn(x, y));
    for (let i = 0; i < n; i++) q(delay + 0.75 + i * 0.12, () => spawn("hornet", { x: x + U.rand(-20, 20), y: y + U.rand(-20, 20), vx, vy }));
  }
  const rxc = (m = 70) => { const [l, r] = corridor(); return U.rand(l + m, r - m); };
  Object.assign(PAT, {
    skimmers: { dur: 4, run() { const n = 3 + Math.min(2, deep()); for (let i = 0; i < n; i++) { const left = i % 2 === 0; fromEdge("skimmer", left ? -40 : PW + 40, U.rand(90, 330), i * 0.65); } } },
    stalkers: { dur: 4.5, run() { const n = 3 + Math.min(2, deep()); for (let i = 0; i < n; i++) { const [l, r] = corridor(PH - 40); fromEdge("stalker", U.rand(l + 60, r - 60), PH + 30, i * 0.7); } } },
    needles: { dur: 3.5, run() { const id = group(6), x = PW / 2 + U.rand(-60, 60); for (let i = 0; i < 6; i++) spawn("needle", { x, t: -i * 0.13, group: id, idx: i }); } },
    needles2: { dur: 4.5, run() { PAT.needles.run(); q(1.4, () => PAT.needles.run()); } },
    hornetsSide: { dur: 3.5, run() { hornetPack("left", 0); hornetPack("right", 1.2); } },
    hornetsAll: { dur: 5, run() { hornetPack("top", 0); hornetPack("bottom", 0.9); hornetPack(U.pick(["left", "right"]), 1.8); if (deep() >= 2) hornetPack("left", 2.6); } },
    seekers: { dur: 4.5, run() { for (let i = 0; i < 5 + deep(); i++) { const side = i % 3, y = U.rand(80, 300); fromEdge("seeker", side === 0 ? -30 : side === 1 ? PW + 30 : rxc(), side === 2 ? -30 : y, i * 0.45, { vx: side === 0 ? 200 : side === 1 ? -200 : 0, vy: side === 2 ? 200 : 0 }); } } },
    warden: { dur: 8, run() { spawn("warden", { x: PW / 2 }); q(3, () => fromEdge("stalker", rxc(), PH + 30, 0)); q(4.5, () => fromEdge("skimmer", U.pick([-40, PW + 40]), U.rand(100, 300), 0)); } },
    crawlers: { dur: 4.5, run() { for (let i = 0; i < 3; i++) q(i * 0.9, () => spawn("crawler", { side: i % 2 ? "R" : "L", dir: 1 })); if (deep() >= 1) { q(1.5, () => G.edgeWarn(G.leftAt(PH - 40) + 30, PH + 30)); q(2.3, () => spawn("crawler", { side: "L", dir: -1 })); } } },
    sentinels: { dur: 5, run() { for (let i = 0; i < 4; i++) q(i * 1.0, () => spawn("sentinel", { side: i % 2 ? "R" : "L" })); q(1.5, () => hornetPack("top", 0)); } },
    ark: { dur: 5, run() { spawn("ark", { x: rxc(90) }); q(0.8, () => PAT.needles.run()); } },
    // fixed obstacles
    gate: {
      dur: 5, run() {
        const [l, r] = corridor(), gap = 200 - deep() * 6, gx = U.rand(l + 60 + gap / 2, r - 60 - gap / 2);
        G.addObstacle({ kind: OBST(), from: "L", h: 44, x1: gx - gap / 2, gap: 0 });
        G.addObstacle({ kind: OBST(), from: "R", h: 44, x0: gx + gap / 2, gap: 0 });
        q(1.6, () => fromEdge("stalker", gx, PH + 30, 0));
        q(2.6, () => PAT.needles.run());
      },
    },
    spurs: {
      dur: 6, run() {
        for (let i = 0; i < 3; i++) q(i * 2.1, () => { const [l, r] = corridor(); G.addObstacle({ kind: OBST(), from: i % 2 ? "R" : "L", h: 40, len: (r - l) * 0.55, gap: 170 }); });
        q(1.2, () => fromEdge("skimmer", -40, U.rand(100, 300), 0));
        q(3.4, () => fromEdge("skimmer", PW + 40, U.rand(100, 300), 0));
      },
    },
    blocks: {
      dur: 6, run() {
        const [l, r] = corridor();
        G.addObstacle({ kind: OBST(), from: "free", h: 46, w: 170, cx: U.lerp(l, r, 0.3), gap: 130 });
        q(2.6, () => { const [l2, r2] = corridor(); G.addObstacle({ kind: OBST(), from: "free", h: 46, w: 170, cx: U.lerp(l2, r2, 0.7), gap: 130 }); });
        q(1, () => hornetPack(Math.random() < 0.5 ? "left" : "right", 0));
        q(3.2, () => PAT.needles.run());
      },
    },
    maze: {
      dur: 7, run() {
        const [l, r] = corridor();
        G.addObstacle({ kind: OBST(), from: "L", h: 40, len: (r - l) * 0.5, gap: 170 });
        q(2.2, () => { const [l2, r2] = corridor(); G.addObstacle({ kind: OBST(), from: "free", h: 44, w: 150, cx: (l2 + r2) / 2, gap: 130 }); });
        q(4.4, () => { const [l3, r3] = corridor(); G.addObstacle({ kind: OBST(), from: "R", h: 40, len: (r3 - l3) * 0.5, gap: 170 }); });
        q(1.4, () => fromEdge("stalker", rxc(), PH + 30, 0));
        q(3.4, () => spawn("sentinel", { side: U.pick(["L", "R"]) }));
        q(5, () => fromEdge("seeker", -30, U.rand(100, 260), 0, { vx: 200, vy: 0 }));
      },
    },
  });

  /* ---------- Laser lines: warning, then a short deadly beam ---------- */
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
      const o = l.from(), ex = o.x + Math.cos(l.a) * 1200, ey = o.y + Math.sin(l.a) * 1200;
      if (!l.fired) {
        ctx.strokeStyle = `rgba(${rgb},${0.25 + 0.35 * Math.abs(Math.sin(l.t * 24))})`; ctx.lineWidth = 2;
        ctx.setLineDash([14, 10]); ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(ex, ey); ctx.stroke(); ctx.setLineDash([]);
        Gfx.glowAt(ctx, rgb, o.x, o.y, 16 + (l.t / l.warn) * 30, 0.8, true);
      } else {
        const k = 1 - (l.t - l.warn) / l.on;
        for (const [w, a] of [[44, 0.25], [20, 0.6], [7, 1]]) {
          ctx.strokeStyle = w === 7 ? `rgba(255,255,255,${a * k + 0.2})` : `rgba(${rgb},${a * k + 0.1})`;
          ctx.lineWidth = w * (0.9 + Math.random() * 0.2); ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(ex, ey); ctx.stroke();
        }
        Gfx.glowAt(ctx, rgb, o.x, o.y, 60, 0.9, true);
      }
    }
    ctx.globalCompositeOperation = "source-over";
  }
  function cycle(b, dt, seq, fast) {
    if (b.atk < 0) { b.cool -= dt * (fast ? 1.25 : 1); if (b.cool <= 0) { b.atk = seq[b.step++ % seq.length]; b.atkT = 0; b.n = 0; b.nt = 0; } return false; }
    b.atkT += dt; b.nt -= dt;
    return true;
  }
  const toP = (o) => Math.atan2(P().y - o.y, P().x - o.x);

  /* ---------- Boss 5: Mammothrax (Ice Age) ---------- */
  BOSSES.mammothrax = function () {
    const b = bossBase({ name: "MAMMOTHRAX", call: "Warning! Mammothrax has awoken from the ice!", hp: 5200, maxHp: 5200, bonus: 80000, mouth: 0, mouthT: 0, lines: [] });
    b.core = () => ({ x: b.x, y: b.y + 72, r: 30 });
    b.target = b.core;
    const tusks = () => [{ x: b.x - 92, y: b.y + 118 }, { x: b.x + 92, y: b.y + 118 }];
    b.bounds = () => ({ x: b.x, y: b.y, rx: 140, ry: 100 });
    b.test = (x, y, r) => {
      const c = b.core();
      if (b.mouth > 0.6) { if (circHit(c, x, y, r)) return "weak"; if (y > c.y && Math.abs(x - c.x) < 34) return null; } // open mouth: shots fly in
      return ellHit({ x: b.x, y: b.y + 5, rx: 135, ry: 92 }, x, y, r) ? "armor" : null;
    };
    b.touch = (p) => ellHit({ x: b.x, y: b.y, rx: 130, ry: 90 }, p.x, p.y, 6);
    b.update = (dt) => {
      b.t += dt; enter(b, dt, 130);
      b.mouth = U.lerp(b.mouth, b.mouthT, Math.min(1, dt * 6));
      lasersUpdate(b, dt);
      if (b.entered) b.x = PW / 2 + Math.sin(b.t * 0.45) * 120;
      if (b.dying || !b.entered) return;
      const P2 = b.hp < b.maxHp / 2;
      if (!cycle(b, dt, P2 ? [0, 1, 2, 3, 1] : [0, 1, 2, 1], P2)) return;
      if (b.atk === 0) {
        b.mouthT = 0;
        if (b.nt <= 0) { b.nt = P2 ? 0.085 : 0.11; const [l, r] = corridor(0); shard(U.rand(l + 10, r - 10), -8, DOWN + U.rand(-0.12, 0.12), U.rand(300, 400), { dmg: DMG() - 4 }); if (Math.random() < 0.3) A.sfx("ping"); }
        if (b.atkT > 2.6) endAtk(b, 1.3);
      } else if (b.atk === 1) {
        b.mouthT = 1;
        if (b.atkT > 0.4 && b.nt <= 0) { b.nt = 0.55; b.n++; const c = b.core(); fan(shard, c.x, c.y + 20, toP(c), 13, 1.2, 250); A.sfx("eshot2"); if (b.n >= 3) endAtk(b, 1.6); }
      } else if (b.atk === 2) {
        b.mouthT = 0;
        if (b.n === 0) { b.n = 1; tusks().forEach((tk, i) => { const from = () => tusks()[i], a = toP(tk); laser(b, from, a - 0.18, 0.9, 0.5); laser(b, from, a + 0.18, 0.9, 0.5); }); }
        if (b.atkT > 1.8) endAtk(b, 1.2);
      } else if (b.atk === 3) {
        b.mouthT = 1;
        if (b.n === 0) { b.n = 1; const [l, r] = corridor(PH - 40); fromEdge("stalker", U.rand(l + 60, (l + r) / 2), PH + 30, 0, { noStat: true }); fromEdge("stalker", U.rand((l + r) / 2, r - 60), PH + 30, 0.4, { noStat: true }); fromEdge("skimmer", U.pick([-40, PW + 40]), U.rand(220, 360), 0.8, { noStat: true }); }
        if (b.nt <= 0 && b.atkT > 1 && b.n < 4) { b.nt = 0.4; b.n++; const c = b.core(); fan(plasma, c.x, c.y, toP(c), 3, 0.3, 260); A.sfx("eshot2"); }
        if (b.atkT > 2.6) endAtk(b, 1.6);
      }
    };
    b.draw = (ctx) => {
      const x = b.x, y = b.y, c = b.core();
      // shaggy ice-crusted fur
      ctx.fillStyle = "#3a4a5e";
      ctx.beginPath(); for (let i = 0; i <= 28; i++) { const a = Math.PI * 1.05 - (i / 28) * Math.PI * 1.1, r = 150 + (i % 2) * 16 + Math.sin(b.t * 2 + i) * 3; ctx.lineTo(x + Math.cos(a) * r, y - 20 - Math.sin(a) * r * 0.75); } ctx.lineTo(x + 140, y + 60); ctx.lineTo(x - 140, y + 60); ctx.closePath(); ctx.fill();
      // ears
      for (const s of [-1, 1]) { ctx.fillStyle = "#4a5c72"; ctx.beginPath(); ctx.ellipse(x + s * 140, y + 10, 46, 70, s * 0.3, 0, TAU); ctx.fill(); ctx.strokeStyle = "rgba(220,240,255,0.4)"; ctx.lineWidth = 2; ctx.stroke(); }
      // skull
      let gr = ctx.createRadialGradient(x - 30, y - 50, 10, x, y, 150);
      gr.addColorStop(0, "#f4faff"); gr.addColorStop(0.45, "#a8c4dc"); gr.addColorStop(1, "#2a3c52");
      ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(x, y, 120, 92, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.7)"; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc(x - 80 + ((i * 47) % 160), y - 60 + ((i * 29) % 70), 3 + (i % 3) * 2, 0, TAU); ctx.fill(); }
      // trunk curling down the middle
      ctx.strokeStyle = "#54687e"; ctx.lineCap = "round"; ctx.lineWidth = 26;
      const tw = Math.sin(b.t * 1.5) * 20;
      ctx.beginPath(); ctx.moveTo(x, y + 20); ctx.bezierCurveTo(x + tw, y + 60, x - 40 - tw, y + 110, x - 30, y + 150 + Math.sin(b.t * 2) * 10); ctx.stroke();
      // mouth (opens between the tusks) with the frost heart behind it
      const m = b.mouth;
      ctx.fillStyle = "#06101a"; ctx.beginPath(); ctx.ellipse(c.x, c.y, 40, 16 + m * 22, 0, 0, TAU); ctx.fill();
      gr = ctx.createRadialGradient(c.x - 6, c.y - 6, 2, c.x, c.y, c.r);
      gr.addColorStop(0, b.flash > 0 ? "#fff" : "#ffffff"); gr.addColorStop(0.4, b.flash > 0 ? "#fff" : "#60e0ff"); gr.addColorStop(1, "#0a3a60");
      ctx.save(); ctx.beginPath(); ctx.ellipse(c.x, c.y, 40, 16 + m * 22, 0, 0, TAU); ctx.clip();
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, TAU); ctx.fill(); ctx.restore();
      ctx.globalCompositeOperation = "lighter"; Gfx.glowAt(ctx, "120,230,255", c.x, c.y, 70, 0.2 + 0.5 * m); ctx.globalCompositeOperation = "source-over";
      // tusks
      for (const s of [-1, 1]) {
        gr = ctx.createLinearGradient(x + s * 50, y + 20, x + s * 100, y + 130);
        gr.addColorStop(0, "#f0e6c8"); gr.addColorStop(1, "#ffffff");
        ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x + s * 40, y + 30); ctx.quadraticCurveTo(x + s * 120, y + 70, x + s * 92, y + 122); ctx.quadraticCurveTo(x + s * 96, y + 70, x + s * 30, y + 50); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "rgba(120,100,60,0.5)"; ctx.lineWidth = 1.5; ctx.stroke();
      }
      // eyes
      ctx.globalCompositeOperation = "lighter";
      for (const s of [-1, 1]) Gfx.glowAt(ctx, b.flash > 0 ? "255,255,255" : "120,220,255", x + s * 54, y - 14, 18, 1, true);
      ctx.globalCompositeOperation = "source-over";
      lasersDraw(ctx, b, "140,220,255");
    };
    return b;
  };

  /* ---------- Boss 6: Pyrodrake (Ember Age) ---------- */
  BOSSES.pyrodrake = function () {
    const b = bossBase({ name: "PYRODRAKE", call: "Warning! Pyrodrake rises from the magma!", hp: 6000, maxHp: 6000, bonus: 100000, cinders: [], respawned: false, slams: [] });
    b.core = () => ({ x: b.x, y: b.y + 66, r: 34 });
    b.target = b.core;
    b.bounds = () => ({ x: b.x, y: b.y, rx: 150, ry: 90 });
    b.test = (x, y, r) => circHit(b.core(), x, y, r) ? "weak" : ellHit({ x: b.x, y: b.y - 10, rx: 80, ry: 70 }, x, y, r) ? "armor" : null;
    b.touch = (p) => {
      if (ellHit({ x: b.x, y: b.y, rx: 80, ry: 90 }, p.x, p.y, 6)) return true;
      for (const s of b.slams) if (s.ext > 0.3 && Math.abs(p.y - s.y) < 28 && (s.left ? p.x < s.ext * s.len : p.x > PW - s.ext * s.len)) return true;
      return false;
    };
    function cinders(n) { for (let i = 0; i < n; i++) b.cinders.push(spawn("cinder", { x: b.x, y: b.y, ci: i, cn: n, noStat: true })); }
    function slam(left) { b.slams.push({ y: U.clamp(P().y + U.rand(-20, 20), 300, PH - 60), left, t: 0, ext: 0, len: PW * 0.72 }); A.sfx("charge"); }
    b.update = (dt) => {
      b.t += dt; enter(b, dt, 130);
      for (const s of b.slams) {
        s.t += dt;
        if (s.t < 0.8) s.ext = 0;
        else if (s.t < 0.95) { s.ext = (s.t - 0.8) / 0.15; if (!s.hit) { s.hit = true; A.sfx("roar"); Fx.shake = Math.max(Fx.shake, 10); } }
        else if (s.t < 1.45) s.ext = 1;
        else s.ext = Math.max(0, 1 - (s.t - 1.45) / 0.5);
      }
      b.slams = b.slams.filter((s) => s.t < 2);
      if (b.dying) b.slams.length = 0;
      if (b.entered && !b.started) { b.started = true; cinders(5); }
      if (b.entered) b.x = PW / 2 + Math.sin(b.t * 0.4) * 110;
      b.cinders = b.cinders.filter((e) => !e.dead);
      for (const e of b.cinders) { const a = b.t * 0.8 + (e.ci * TAU) / e.cn; e.x = b.x + Math.cos(a) * 165; e.y = b.y + 20 + Math.sin(a) * 110; }
      b.vulnMul = b.cinders.length >= 2 ? 0.25 : 1;
      if (b.dying || !b.entered) return;
      const P2 = b.hp < b.maxHp / 2;
      if (P2 && !b.respawned) { b.respawned = true; cinders(4); A.sfx("roar"); }
      if (!cycle(b, dt, P2 ? [0, 1, 3, 2, 1] : [0, 1, 2], P2)) return;
      const c = b.core();
      if (b.atk === 0) {
        if (b.nt <= 0) { b.nt = P2 ? 0.065 : 0.08; const a = b.atkT * 2.3; for (let k = 0; k < 4; k++) ember(c.x, c.y, a + (k * TAU) / 4, 200); A.sfx("eshot"); }
        if (b.atkT > 3) endAtk(b, 1.2);
      } else if (b.atk === 1) {
        if (b.nt <= 0) { b.nt = 0.7; slam(b.n % 2 === 0); b.n++; if (b.n >= (P2 ? 4 : 3)) endAtk(b, 1.8); }
      } else if (b.atk === 2) {
        if (b.nt <= 0) { b.nt = P2 ? 0.13 : 0.16; const [l, r] = corridor(0); ember(U.rand(l + 10, r - 10), -10, DOWN + U.rand(-0.35, 0.35), U.rand(240, 320), { r: 10 }); }
        if (b.atkT > 2.6) endAtk(b, 1.2);
      } else if (b.atk === 3) {
        if (b.nt <= 0 && b.cinders.length) { b.nt = 0.16; const e = b.cinders[b.n % b.cinders.length]; bolt(e.x, e.y, aim(e), 400); A.sfx("eshot2"); b.n++; }
        if (b.n >= 10 || !b.cinders.length) { ring(c.x, c.y, 20, 190 * sp(), b.t, { k: "e_ember", r: 8, dmg: DMG() }); endAtk(b, 1.2); }
      }
    };
    b.draw = (ctx) => {
      const x = b.x, y = b.y, c = b.core(), flap = Math.sin(b.t * 2.2);
      // magma slams from the walls
      for (const s of b.slams) {
        const x0 = s.left ? 0 : PW;
        if (s.ext <= 0) {
          const a = 0.2 + 0.3 * Math.abs(Math.sin(s.t * 20));
          ctx.fillStyle = `rgba(255,120,40,${a * 0.35})`; ctx.fillRect(s.left ? 0 : PW - s.len, s.y - 26, s.len, 52);
          continue;
        }
        const L = s.ext * s.len, xs = s.left ? 0 : PW - L;
        const gr = ctx.createLinearGradient(0, s.y - 26, 0, s.y + 26);
        gr.addColorStop(0, "#3a1408"); gr.addColorStop(0.5, "#ff7a20"); gr.addColorStop(1, "#3a1408");
        ctx.fillStyle = gr; ctx.beginPath(); ctx.roundRect(xs, s.y - 24, L, 48, 20); ctx.fill();
        ctx.globalCompositeOperation = "lighter"; Gfx.glowAt(ctx, "255,140,40", s.left ? L : PW - L, s.y, 50, 0.8, true); ctx.globalCompositeOperation = "source-over";
        for (let i = 0; i < 3; i++) Fx.glow(x0 + (s.left ? 1 : -1) * U.rand(0, L), s.y + U.rand(-20, 20), 4, 12, "255,160,60", 0.3, { vy: -40 });
      }
      // wings
      for (const s of [-1, 1]) {
        ctx.fillStyle = "#3a1208";
        ctx.beginPath(); ctx.moveTo(x + s * 40, y - 10);
        ctx.lineTo(x + s * 230, y - 90 + flap * 30); ctx.lineTo(x + s * 200, y - 20 + flap * 20); ctx.lineTo(x + s * 230, y + 30 + flap * 10); ctx.lineTo(x + s * 160, y + 20); ctx.lineTo(x + s * 170, y + 70); ctx.lineTo(x + s * 60, y + 30);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "rgba(255,120,40,0.6)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x + s * 40, y - 10); ctx.lineTo(x + s * 230, y - 90 + flap * 30); ctx.moveTo(x + s * 50, y); ctx.lineTo(x + s * 230, y + 30 + flap * 10); ctx.stroke();
      }
      // head and horns
      let gr = ctx.createRadialGradient(x - 20, y - 40, 6, x, y, 110);
      gr.addColorStop(0, "#a05030"); gr.addColorStop(0.5, "#4a1a0c"); gr.addColorStop(1, "#120604");
      ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x - 70, y - 60); ctx.quadraticCurveTo(x, y - 110, x + 70, y - 60); ctx.lineTo(x + 56, y + 50); ctx.quadraticCurveTo(x, y + 110, x - 56, y + 50); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#1a0804";
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + s * 50, y - 60); ctx.quadraticCurveTo(x + s * 110, y - 110, x + s * 90, y - 150); ctx.quadraticCurveTo(x + s * 80, y - 100, x + s * 30, y - 70); ctx.fill(); }
      ctx.strokeStyle = `rgba(255,${110 + 50 * Math.sin(b.t * 4) | 0},30,0.8)`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x - 40, y - 40); ctx.lineTo(x - 10, y - 10); ctx.lineTo(x - 30, y + 30); ctx.moveTo(x + 40, y - 40); ctx.lineTo(x + 12, y - 4); ctx.stroke();
      // throat gem (weak point)
      ctx.fillStyle = "#0c0402"; ctx.beginPath(); ctx.arc(c.x, c.y, c.r + 8, 0, TAU); ctx.fill();
      gr = ctx.createRadialGradient(c.x - 6, c.y - 6, 2, c.x, c.y, c.r);
      gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.4, b.flash > 0 ? "#fff" : "#ffb030"); gr.addColorStop(1, "#5a1000");
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = "lighter";
      Gfx.glowAt(ctx, "255,140,40", c.x, c.y, 90, 0.35);
      for (const s of [-1, 1]) Gfx.glowAt(ctx, b.flash > 0 ? "255,255,255" : "255,220,60", x + s * 30, y - 20, 16, 1, true);
      if (b.vulnMul < 1) { ctx.strokeStyle = `rgba(255,200,120,${0.45 + 0.2 * Math.sin(b.t * 8)})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(c.x, c.y, c.r + 16, 0, TAU); ctx.stroke(); }
      ctx.globalCompositeOperation = "source-over";
    };
    return b;
  };

  /* ---------- Boss 7: Iron Colossus (Machine Age) ---------- */
  BOSSES.colossus = function () {
    const b = bossBase({ name: "IRON COLOSSUS", call: "Warning! The Iron Colossus is online!", hp: 6600, maxHp: 6600, bonus: 120000, hatch: 0, hatchT: 0, lines: [] });
    b.core = () => ({ x: b.x, y: b.y + 70, r: 30 });
    b.target = b.core;
    const guns = () => [{ x: b.x - 120, y: b.y + 40 }, { x: b.x + 120, y: b.y + 40 }];
    b.bounds = () => ({ x: b.x, y: b.y, rx: 160, ry: 90 });
    b.test = (x, y, r) => {
      const c = b.core();
      if (b.hatch > 0.6) { if (circHit(c, x, y, r)) return "weak"; if (y > c.y && Math.abs(x - c.x) < 36) return null; }
      return ellHit({ x: b.x, y: b.y, rx: 165, ry: 100 }, x, y, r) ? "armor" : null;
    };
    b.touch = (p) => ellHit({ x: b.x, y: b.y, rx: 160, ry: 95 }, p.x, p.y, 6);
    b.update = (dt) => {
      b.t += dt; enter(b, dt, 140);
      b.hatch = U.lerp(b.hatch, b.hatchT, Math.min(1, dt * 6));
      lasersUpdate(b, dt);
      if (b.entered) b.x = PW / 2 + Math.sin(b.t * 0.35) * 90;
      if (b.dying || !b.entered) return;
      const P2 = b.hp < b.maxHp / 2;
      if (!cycle(b, dt, P2 ? [0, 1, 3, 2, 1, 3] : [0, 1, 2, 1], P2)) return;
      if (b.atk === 0) {
        b.hatchT = 0;
        if (b.nt <= 0) { b.nt = 0.32; b.n++; for (const g of guns()) bolt(g.x, g.y + 20, toP(g) + U.rand(-0.08, 0.08), 430); A.sfx("eshot2"); if (b.n >= 9) endAtk(b, 1.0); }
      } else if (b.atk === 1) {
        b.hatchT = 1;
        if (b.atkT > 0.5 && b.nt <= 0) {
          b.nt = 0.6; b.n++; const c = b.core(); fan(plasma, c.x, c.y + 20, toP(c), 9, 1.2, 250); A.sfx("eshot2");
          if (b.n >= 3) { endAtk(b, 1.6); if (P2) fromEdge("skimmer", U.pick([-40, PW + 40]), U.rand(220, 360), 0, { noStat: true }); }
        }
      } else if (b.atk === 2) {
        b.hatchT = 0;
        if (b.nt <= 0) { b.nt = 0.3; b.n++; const s = b.n % 2 ? -1 : 1; spawn("seeker", { x: b.x + s * 100, y: b.y - 40, vx: s * 240, vy: -200, noStat: true }); A.sfx("missile"); if (b.n >= 6) endAtk(b, 1.2); }
      } else if (b.atk === 3) {
        b.hatchT = 1;
        if (b.n < 2 && b.nt <= 0) { b.nt = 1.5; b.n++; const a = toP(b.core()); for (const o of [-0.32, 0, 0.32]) laser(b, b.core, a + o + (b.n === 2 ? 0.16 : 0), 0.85, 0.5); }
        if (b.atkT > 3.2) endAtk(b, 1.6);
      }
    };
    b.draw = (ctx) => {
      const x = b.x, y = b.y, c = b.core();
      // shoulders with guns
      for (const [i, g] of guns().entries()) {
        const s = i ? 1 : -1;
        ctx.fillStyle = "#2a2e34"; ctx.beginPath(); ctx.roundRect(g.x - 34, g.y - 70, 68, 90, 10); ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.7)"; ctx.lineWidth = 2; ctx.stroke();
        const a = toP(g);
        ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(a); ctx.fillStyle = "#3a4048"; ctx.fillRect(0, -7, 44, 14); ctx.fillStyle = "#9aa4ae"; ctx.fillRect(36, -8, 8, 16); ctx.restore();
        Gfx.lamp(ctx, g.x + s * 18, g.y - 54, 3, "255,90,30");
      }
      // hull
      let gr = ctx.createLinearGradient(x - 150, 0, x + 150, 0);
      gr.addColorStop(0, "#14161a"); gr.addColorStop(0.3, "#6a727c"); gr.addColorStop(0.5, "#c0c8d0"); gr.addColorStop(0.7, "#5a626c"); gr.addColorStop(1, "#101216");
      ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x - 90, y - 90); ctx.lineTo(x + 90, y - 90); ctx.lineTo(x + 140, y - 20); ctx.lineTo(x + 100, y + 80); ctx.lineTo(x - 100, y + 80); ctx.lineTo(x - 140, y - 20); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.6)"; ctx.lineWidth = 2; ctx.stroke();
      ctx.strokeStyle = "rgba(0,0,0,0.35)"; for (const yy of [-50, -10, 30]) { ctx.beginPath(); ctx.moveTo(x - 120, y + yy); ctx.lineTo(x + 120, y + yy); ctx.stroke(); }
      ctx.fillStyle = "rgba(255,255,255,0.3)"; for (let i = -4; i <= 4; i++) for (const yy of [-46, -6, 34]) ctx.fillRect(x + i * 26 - 1.5, y + yy, 3, 3);
      // visor
      ctx.fillStyle = "#0a0c10"; ctx.fillRect(x - 60, y - 70, 120, 18);
      ctx.globalCompositeOperation = "lighter"; Gfx.glowAt(ctx, b.flash > 0 ? "255,255,255" : "255,60,40", x - 30 + Math.sin(b.t * 2) * 30, y - 61, 18, 1, true); ctx.globalCompositeOperation = "source-over";
      // reactor hatch
      ctx.fillStyle = "#08090c"; ctx.beginPath(); ctx.ellipse(c.x, c.y, 46, 36, 0, 0, TAU); ctx.fill();
      gr = ctx.createRadialGradient(c.x - 6, c.y - 6, 2, c.x, c.y, c.r);
      gr.addColorStop(0, "#fff"); gr.addColorStop(0.4, b.flash > 0 ? "#fff" : "#ff8a20"); gr.addColorStop(1, "#4a1000");
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(c.x, c.y, c.r * (0.9 + 0.08 * Math.sin(b.t * 8)), 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = "lighter"; Gfx.glowAt(ctx, "255,140,40", c.x, c.y, 70, 0.25 + 0.5 * b.hatch); ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#3a4048"; ctx.strokeStyle = "#0a0c10"; ctx.lineWidth = 2;
      for (const s of [-1, 1]) {
        const off = b.hatch * 40;
        ctx.beginPath(); ctx.rect(s < 0 ? c.x - 48 - off : c.x + off, c.y - 38, 48, 76); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#f0b020"; for (let i = 0; i < 4; i++) ctx.fillRect(s < 0 ? c.x - 14 - off : c.x + 6 + off, c.y - 32 + i * 18, 8, 10);
        ctx.fillStyle = "#3a4048";
      }
      lasersDraw(ctx, b, "255,120,40");
    };
    return b;
  };

  /* ---------- Boss 8: Astral Seed (Star Seed) ---------- */
  BOSSES.astral = function () {
    const b = bossBase({ name: "ASTRAL SEED", call: "Warning! The Astral Seed has awakened!", hp: 8400, maxHp: 8400, bonus: 150000, gens: [], respawned: false, lines: [] });
    b.beat = () => 1 + 0.07 * Math.pow(Math.max(0, Math.sin(b.t * (b.hp < b.maxHp * 0.3 ? 9 : 6))), 6);
    b.core = () => ({ x: b.x, y: b.y + 42, r: 46 * b.beat() });
    b.target = b.core;
    b.bounds = () => ({ x: b.x, y: b.y, rx: 120, ry: 120 });
    b.test = (x, y, r) => circHit(b.core(), x, y, r) ? "weak" : ellHit({ x: b.x, y: b.y - 40, rx: 115, ry: 90 }, x, y, r) ? "armor" : null;
    b.touch = (p) => ellHit({ x: b.x, y: b.y, rx: 110, ry: 120 }, p.x, p.y, 6);
    function gens(n, off = 0) { for (let i = 0; i < n; i++) b.gens.push(spawn("gen", { x: b.x, y: b.y, gi: i, gn: n, off, noStat: true })); }
    b.update = (dt) => {
      b.t += dt; enter(b, dt, 150);
      lasersUpdate(b, dt);
      if (b.entered && !b.started) { b.started = true; gens(4); }
      if (b.entered) b.x = PW / 2 + Math.sin(b.t * 0.3) * 80;
      b.gens = b.gens.filter((e) => !e.dead);
      for (const e of b.gens) { const a = b.t * 0.35 + e.off + (e.gi * TAU) / e.gn; e.x = b.x + Math.cos(a) * 200; e.y = b.y + 20 + Math.sin(a) * 120; }
      b.vulnMul = b.gens.length ? 0.15 : 1;
      if (b.dying || !b.entered) return;
      const P2 = b.hp < b.maxHp / 2, rage = b.hp < b.maxHp * 0.3;
      if (P2 && !b.respawned) { b.respawned = true; gens(2, 0.8); A.sfx("roar"); A.say("Shield generators restored!", { rate: 1.05 }); }
      if (!cycle(b, dt, P2 ? [0, 1, 2, 3, 4, 1] : [0, 1, 2, 3], rage)) return;
      const c = b.core();
      if (b.atk === 0) {
        if (b.nt <= 0) { b.nt = rage ? 0.07 : 0.09; const a = b.atkT * 2; for (let k = 0; k < 3; k++) bolt(c.x, c.y, a + (k * TAU) / 3, 220); if (P2) bolt(c.x, c.y, -a * 1.3, 200); A.sfx("eshot"); }
        if (b.atkT > 3.4) endAtk(b, 1.1);
      } else if (b.atk === 1) {
        const set = (o) => { const a = toP(c); for (const d of o) laser(b, b.core, a + d, 0.85, 0.5); };
        if (b.n === 0) { b.n = 1; set([-0.42, 0, 0.42, U.rand(0.7, 0.9) * U.pick([-1, 1])]); }
        if (b.n === 1 && b.atkT > 1.55) { b.n = 2; set([-0.2, 0.2, -0.62, 0.62]); }
        if (b.atkT > 3.1) endAtk(b, 1.2);
      } else if (b.atk === 2) {
        if (b.n === 0) {
          b.n = 1;
          fromEdge("skimmer", -40, U.rand(200, 340), 0, { noStat: true }); fromEdge("skimmer", PW + 40, U.rand(200, 340), 0.4, { noStat: true });
          const [l, r] = corridor(PH - 40);
          fromEdge("stalker", U.rand(l + 60, (l + r) / 2), PH + 30, 0.8, { noStat: true }); fromEdge("stalker", U.rand((l + r) / 2, r - 60), PH + 30, 1.1, { noStat: true });
          if (P2) hornetPack("bottom", 1.6);
        }
        if (b.atkT > 2.6) endAtk(b, 1.4);
      } else if (b.atk === 3) {
        if (b.nt <= 0) {
          b.nt = 0.7; b.n++;
          const gapA = toP(c) + U.rand(-0.4, 0.4), n = 26;
          for (let i = 0; i < n; i++) { const a = (i * TAU) / n; if (Math.abs(U.angDiff(a, gapA)) < 0.36) continue; plasma(c.x, c.y, a, 200, { r: 8 }); }
          A.sfx("eshot2");
          if (b.n >= 3) endAtk(b, 1.2);
        }
      } else if (b.atk === 4) {
        if (b.nt <= 0) { b.nt = 0.25; b.n++; plasma(c.x, c.y, toP(c) + U.rand(-1.2, 1.2), 190, { home: 1.6 }); A.sfx("eshot"); if (b.n >= 6) endAtk(b, 1.2); }
      }
    };
    b.draw = (ctx) => {
      const x = b.x, y = b.y, c = b.core(), s = b.beat();
      // tethers to the generators
      for (const e of b.gens) {
        ctx.strokeStyle = "#1a1240"; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo((x + e.x) / 2, (y + e.y) / 2 - 40, e.x, e.y); ctx.stroke();
        ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = `rgba(190,150,255,${0.3 + 0.3 * Math.sin(b.t * 6)})`; ctx.lineWidth = 2; ctx.stroke(); ctx.globalCompositeOperation = "source-over";
      }
      // petals of the seed pod
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + (i - 3) * 0.42;
        ctx.save(); ctx.translate(x, y - 10); ctx.rotate(a + Math.PI / 2 + Math.sin(b.t + i) * 0.04);
        const gr = ctx.createLinearGradient(0, 0, 0, -140);
        gr.addColorStop(0, "#2a1a5a"); gr.addColorStop(0.6, "#6a4ac0"); gr.addColorStop(1, "#d0c0ff");
        ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(40, -70, 0, -140 * s); ctx.quadraticCurveTo(-40, -70, 0, 0); ctx.fill();
        ctx.restore();
      }
      // shell
      let gr = ctx.createRadialGradient(x - 20, y - 50, 8, x, y, 130);
      gr.addColorStop(0, "#9a80e0"); gr.addColorStop(0.5, "#3a2470"); gr.addColorStop(1, "#0c0620");
      ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(x, y - 20, 105 * s, 90 * s, 0, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = `rgba(200,170,255,${0.35 + 0.3 * (s - 1) * 14})`; ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) { const a = Math.PI + (i + 0.5) * Math.PI / 6; ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.quadraticCurveTo(x + Math.cos(a) * 60, y - 20 + Math.sin(a) * 50, x + Math.cos(a) * 100, y - 20 + Math.sin(a) * 85); ctx.stroke(); }
      for (let i = 0; i < 14; i++) { const a = b.t * 0.3 + i * 0.45; Gfx.glowAt(ctx, "220,200,255", x + Math.cos(a) * 80, y - 30 + Math.sin(a * 1.3) * 50, 3, 0.8, true); }
      ctx.globalCompositeOperation = "source-over";
      // core
      ctx.fillStyle = "#06020e"; ctx.beginPath(); ctx.arc(c.x, c.y, c.r + 12, 0, TAU); ctx.fill();
      gr = ctx.createRadialGradient(c.x - 10, c.y - 10, 4, c.x, c.y, c.r);
      gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.3, b.flash > 0 ? "#fff" : "#c0a0ff"); gr.addColorStop(0.8, "#4a1a9a"); gr.addColorStop(1, "#14062a");
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = "lighter";
      Gfx.glowAt(ctx, "180,140,255", c.x, c.y, 130, 0.25 + (s - 1) * 4);
      if (b.vulnMul < 1) { ctx.strokeStyle = `rgba(200,180,255,${0.45 + 0.2 * Math.sin(b.t * 8)})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(c.x, c.y, c.r + 22, 0, TAU); ctx.stroke(); }
      ctx.globalCompositeOperation = "source-over";
      lasersDraw(ctx, b, "200,150,255");
    };
    return b;
  };
})(window.XA);
