/* Ironfall: enemy types – behaviour and sprites */
"use strict";

(function (XA) {
  const { U, Gfx, Fx, G } = XA;
  const A = XA.Audio;
  const W = U.W, H = U.H, TAU = U.TAU, T = XA.Theme.T;
  const { lin, rad, ell, circ, poly, rr } = Gfx;
  const E = (XA.Enemies = { TYPES: {} });

  /* ---------- Palettes per world ---------- */
  const ORG = [
    { a: "#3aa070", b: "#0f4a30", c: "#9affd0", eye: "255,80,60" },
    { a: "#8a5ad0", b: "#2a1060", c: "#e8d0ff", eye: "120,255,255" },
    { a: "#c84a68", b: "#4a0c1c", c: "#ffb0c4", eye: "255,230,80" },
    { a: "#a87040", b: "#3e2008", c: "#ffd8a0", eye: "255,90,40" },
    { a: "#3a88c8", b: "#0c2040", c: "#b0e8ff", eye: "255,60,210" },
  ];
  const MECH = [
    { a: "#868c6a", b: "#2e3222", c: "#d4dcb4", glow: "255,90,60" },
    { a: "#70789a", b: "#22263a", c: "#c0c8f0", glow: "170,120,255" },
    { a: "#8e7078", b: "#30202a", c: "#e8c8d0", glow: "255,210,80" },
    { a: "#a2a6ae", b: "#3a3e46", c: "#eef0f6", glow: "255,150,40" },
    { a: "#3a4c6a", b: "#0e1626", c: "#90b4e8", glow: "60,230,255" },
  ];
  const wi = () => (G.lv ? G.lv.stage.world : 0);
  const org = () => ORG[wi()], mech = () => MECH[wi()];

  /* ---------- Helpers ---------- */
  const player = () => G.player;
  const dx = (e) => player().x - e.x;
  const dy = (e) => player().y - 30 - (e.y - e.h / 2);
  const dist = (e) => Math.hypot(dx(e), dy(e));
  const onScreen = (e, m = 0) => e.x > G.cam.x - m && e.x < G.cam.x + W + m && e.y > G.cam.y - m && e.y - e.h < G.cam.y + H + m;
  function walk(e, dt, speed, o = {}) {
    e.vy = Math.min(1100, e.vy + 2200 * dt);
    if (e.onGround && o.edges !== false) {
      const ahead = e.x + e.face * (e.w / 2 + 6);
      if (!G.onSolidGround(ahead, e.y, 2)) e.face = -e.face;
    }
    if (speed !== null) e.vx = e.face * speed;
    const r = G.moveBody(e, dt, { arena: !!G.arena });
    if (r.wall) e.face = -r.wall;
    e.onGround = r.ground;
    return r;
  }
  function facePlayer(e) { e.face = dx(e) > 0 ? 1 : -1; }
  function flashDraw(ctx, e, c, x, y, rot = 0, flip = false) {
    Gfx.put(ctx, c, x, y, rot, 1, flip);
    if (e.flash > 0) { ctx.save(); ctx.globalAlpha = 0.85; Gfx.put(ctx, c.white || (c.white = Gfx.whiteOf(c)), x, y, rot, 1, flip); ctx.restore(); }
  }
  const key = (name) => name + wi();

  function def(name, o) { E.TYPES[name] = o; }

  /* ---------- Walker: bipedal robot ---------- */
  function walkerSprite(ph) {
    const P = mech();
    return Gfx.anim(key("walker"), 8, 52, 58, (g, w, h, p) => {
      const s = Math.sin(p * TAU);
      // legs
      for (const [k, side] of [[s, -1], [-s, 1]]) {
        const hx = 26 + side * 6, hy = 30, kx = hx + k * 8, ky = 42, fx = hx + k * 10 - 2, fy = 56;
        g.strokeStyle = P.b; g.lineWidth = 7; g.beginPath(); g.moveTo(hx, hy); g.lineTo(kx, ky); g.lineTo(fx, fy); g.stroke();
        g.strokeStyle = side > 0 ? P.a : P.b; g.lineWidth = 4.5; g.beginPath(); g.moveTo(hx, hy); g.lineTo(kx, ky); g.lineTo(fx, fy); g.stroke();
        g.fillStyle = P.c; circ(g, kx, ky, 3); g.fill();
        g.fillStyle = P.b; rr(g, fx - 7, fy - 3, 14, 4, 2); g.fill();
      }
      // body
      g.fillStyle = lin(g, 0, 10, 0, 34, [[0, P.c], [0.4, P.a], [1, P.b]]);
      poly(g, [10, 14, 18, 8, 40, 8, 46, 18, 42, 32, 12, 32]); g.fill();
      g.strokeStyle = "#111"; g.lineWidth = 1.4; g.stroke();
      g.fillStyle = "#16181e"; rr(g, 30, 13, 14, 8, 3); g.fill();
      Gfx.lamp(g, 39, 17, 3, P.glow);
      g.fillStyle = P.b; rr(g, 40, 22, 12, 6, 2); g.fill(); // gun
      g.fillStyle = "rgba(255,255,255,0.3)"; g.fillRect(16, 10, 20, 2);
    }, ph);
  }
  def("walker", {
    init(e) { Object.assign(e, { hp: 8, w: 34, h: 54, r: 24, score: 200, dmg: 15, face: dx(e) > 0 ? 1 : -1, onGround: false, debris: mech().b }); },
    update(e, dt) {
      walk(e, dt, 75);
      e.cd -= dt;
      if (e.cd <= 0 && onScreen(e, -20) && Math.abs(dy(e)) < 120) {
        facePlayer(e); e.cd = U.rand(1.6, 2.6) - wi() * 0.15;
        G.eshoot(e.x + e.face * 26, e.y - 30, e.face * 420, 0, { kind: "bolt", rgb: mech().glow, r: 7 });
        A.sfx("eshot2");
      }
    },
    draw(ctx, e) { flashDraw(ctx, e, walkerSprite(e.t * 1.6), e.x, e.y - 29, 0, e.face < 0); },
  });

  /* ---------- Hopper: jumping alien ---------- */
  function hopperSprite(air) {
    const P = org();
    return Gfx.sprite(key("hopper") + air, 44, 36, (g) => {
      // legs
      g.strokeStyle = P.b; g.lineWidth = 5;
      if (air) { g.beginPath(); g.moveTo(14, 22); g.lineTo(4, 32); g.moveTo(30, 22); g.lineTo(40, 32); g.stroke(); }
      else { g.beginPath(); g.moveTo(12, 24); g.lineTo(4, 18); g.lineTo(8, 34); g.moveTo(32, 24); g.lineTo(40, 18); g.lineTo(36, 34); g.stroke(); }
      g.fillStyle = rad(g, 18, 12, 2, 22, [[0, P.c], [0.4, P.a], [1, P.b]]);
      ell(g, 22, 20, 17, 12); g.fill();
      g.strokeStyle = "rgba(0,0,0,0.5)"; g.lineWidth = 1.2; g.stroke();
      g.fillStyle = "rgba(0,0,0,0.25)"; for (let i = 0; i < 3; i++) { ell(g, 14 + i * 8, 24, 3, 2); g.fill(); }
      for (const x of [26, 33]) { g.fillStyle = "#fff"; circ(g, x, 13, 4); g.fill(); g.fillStyle = `rgb(${P.eye})`; circ(g, x + 1, 13, 2.2); g.fill(); }
      g.strokeStyle = "#1a0a0a"; g.lineWidth = 1.6; g.beginPath(); g.arc(30, 22, 6, 0.2, 1.4); g.stroke();
    });
  }
  def("hopper", {
    init(e) { Object.assign(e, { hp: 5, w: 32, h: 30, r: 18, score: 150, dmg: 12, onGround: false, cd: U.rand(0.6, 1.6), debris: org().b, boomRGB: "200,255,160" }); },
    update(e, dt) {
      const r = walk(e, dt, null, { edges: false });
      if (e.onGround) {
        e.vx *= 0.8;
        e.cd -= dt;
        if (e.cd <= 0 && dist(e) < 650) {
          facePlayer(e);
          e.vx = e.face * U.rand(160, 260); e.vy = -U.rand(620, 820); e.onGround = false; e.cd = U.rand(0.9, 1.8);
        }
      }
      if (r.wall) e.vx = -e.vx * 0.5;
    },
    draw(ctx, e) { flashDraw(ctx, e, hopperSprite(e.onGround ? 0 : 1), e.x, e.y - 18, 0, e.face < 0); },
  });

  /* ---------- Wasp: hovering insect ---------- */
  function waspSprite(ph) {
    const P = org();
    return Gfx.anim(key("wasp"), 4, 48, 38, (g, w, h, p) => {
      const wing = Math.sin(p * TAU);
      g.fillStyle = "rgba(220,240,255,0.45)";
      ell(g, 20, 12 - wing * 4, 14, 6 + wing * 2, -0.4); g.fill();
      ell(g, 28, 12 - wing * 4, 12, 5 + wing * 2, 0.3); g.fill();
      g.fillStyle = lin(g, 0, 14, 0, 32, [[0, P.c], [0.5, P.a], [1, P.b]]);
      ell(g, 18, 23, 12, 7); g.fill();
      g.fillStyle = P.b; for (let i = 0; i < 3; i++) g.fillRect(9 + i * 6, 17, 2.5, 12);
      poly(g, [6, 23, 0, 30, 9, 26]); g.fill();
      g.fillStyle = rad(g, 34, 20, 1, 10, [[0, P.c], [1, P.a]]); circ(g, 34, 22, 8); g.fill();
      g.fillStyle = `rgb(${P.eye})`; circ(g, 38, 20, 3); g.fill();
      g.strokeStyle = P.b; g.lineWidth = 1.5; g.beginPath(); g.moveTo(36, 28); g.lineTo(40, 34); g.moveTo(30, 29); g.lineTo(30, 35); g.stroke();
    }, ph);
  }
  def("wasp", {
    init(e) { Object.assign(e, { hp: 3, w: 34, h: 28, r: 18, score: 150, dmg: 12, hx: e.x, hy: e.y, ph: U.rand(TAU), debris: org().b }); },
    update(e, dt) {
      const d = dist(e);
      const tx = d < 520 ? player().x - Math.sign(dx(e)) * 110 : e.hx, ty = d < 520 ? player().y - 150 + Math.sin(e.t * 2 + e.ph) * 60 : e.hy + Math.sin(e.t * 2 + e.ph) * 30;
      e.vx += U.clamp(tx - e.x, -1, 1) * 600 * dt; e.vy += U.clamp(ty - e.y, -1, 1) * 600 * dt;
      e.vx *= 0.96; e.vy *= 0.96;
      e.x += e.vx * dt; e.y += e.vy * dt;
      e.face = e.vx > 0 ? 1 : -1;
      e.cd -= dt;
      if (e.cd <= 0 && d < 420 && onScreen(e)) {
        e.cd = U.rand(1.5, 3);
        if (wi() >= 1 || Math.random() < 0.5) { const [vx, vy] = G.aimAt(e.x, e.y - 14, 300); G.eshoot(e.x, e.y - 14, vx, vy, { rgb: org().eye, r: 5 }); A.sfx("eshot"); }
        else { e.vx = Math.sign(dx(e)) * 420; e.vy = 380; }
      }
    },
    draw(ctx, e) { flashDraw(ctx, e, waspSprite(e.t * 7), e.x, e.y - 16, 0, e.face < 0); },
  });

  /* ---------- Swarm: wave flyer ---------- */
  function swarmSprite(ph) {
    const P = mech();
    return Gfx.anim(key("swarm"), 8, 36, 28, (g, w, h, p) => {
      g.save(); g.translate(18, 14); g.rotate(p * TAU);
      for (let i = 0; i < 3; i++) { g.rotate(TAU / 3); g.fillStyle = P.a; poly(g, [0, -3, 14, 0, 0, 3]); g.fill(); }
      g.restore();
      g.fillStyle = rad(g, 16, 12, 1, 9, [[0, P.c], [1, P.b]]); circ(g, 18, 14, 8); g.fill();
      Gfx.lamp(g, 18, 14, 3, P.glow);
    }, ph);
  }
  def("swarm", {
    init(e) { Object.assign(e, { hp: 2, w: 28, h: 26, r: 16, score: 100, dmg: 10, y0: e.y, ph: (e.idx || 0) * 0.8, harmlessT: 0 }); e.dir = e.dir || -1; },
    update(e, dt) {
      e.x += e.dir * 280 * dt;
      e.y = e.y0 + Math.sin(e.t * 3 + e.ph) * 70 + (player().y - 160 - e.y0) * Math.min(1, e.t * 0.25) * 0.6;
      if ((e.dir < 0 && e.x < G.cam.x - 120) || (e.dir > 0 && e.x > G.cam.x + W + 120)) e.dead = true;
      e.cd -= dt;
      if (e.cd <= 0 && wi() >= 2 && onScreen(e, -40)) { e.cd = U.rand(2, 4); const [vx, vy] = G.aimAt(e.x, e.y - 13, 260); G.eshoot(e.x, e.y - 13, vx, vy, { rgb: mech().glow, r: 5 }); }
    },
    draw(ctx, e) { flashDraw(ctx, e, swarmSprite(e.t * 2), e.x, e.y - 13); Gfx.glowAt(ctx, mech().glow, e.x, e.y - 13, 22, 0.25); },
  });

  /* ---------- Turret ---------- */
  function turretBase() {
    const P = mech();
    return Gfx.sprite(key("turretB"), 52, 30, (g) => {
      g.fillStyle = lin(g, 0, 8, 0, 30, [[0, P.c], [0.4, P.a], [1, P.b]]);
      poly(g, [4, 30, 8, 14, 44, 14, 48, 30]); g.fill(); g.strokeStyle = "#111"; g.lineWidth = 1.4; g.stroke();
      g.fillStyle = rad(g, 22, 10, 2, 18, [[0, P.c], [0.5, P.a], [1, P.b]]);
      g.beginPath(); g.arc(26, 16, 15, Math.PI, TAU); g.fill(); g.stroke();
      g.fillStyle = "rgba(0,0,0,0.4)"; g.fillRect(8, 24, 36, 3);
    });
  }
  def("turret", {
    init(e) { Object.assign(e, { hp: 14, w: 44, h: 30, r: 24, score: 400, dmg: 15, aim: -Math.PI / 2, burst: 0, debris: mech().b, noFall: true }); },
    update(e, dt) {
      const ta = Math.atan2(dy(e) + 10, dx(e));
      e.aim += U.clamp(U.angDiff(Math.min(-0.05, Math.max(-Math.PI + 0.05, ta)), e.aim), -2.5 * dt, 2.5 * dt);
      e.cd -= dt;
      if (e.cd <= 0 && dist(e) < 720 && onScreen(e, 40)) {
        if (e.burst <= 0) e.burst = 2 + Math.min(2, wi());
        e.burst--; e.cd = e.burst > 0 ? 0.16 : U.rand(1.8, 2.6) - wi() * 0.15;
        const bx = e.x + Math.cos(e.aim) * 26, by = e.y - 16 + Math.sin(e.aim) * 26;
        G.eshoot(bx, by, Math.cos(e.aim) * 360, Math.sin(e.aim) * 360, { rgb: mech().glow, r: 6 });
        Fx.glow(bx, by, 6, 20, mech().glow, 0.12, { hot: true });
        A.sfx("eshot");
      }
    },
    draw(ctx, e) {
      const P = mech();
      ctx.save(); ctx.translate(e.x, e.y - 16); ctx.rotate(e.aim);
      ctx.fillStyle = P.b; ctx.fillRect(4, -4, 26, 8); ctx.fillStyle = P.c; ctx.fillRect(6, -4, 22, 2);
      ctx.restore();
      flashDraw(ctx, e, turretBase(), e.x, e.y - 15);
      Gfx.glowAt(ctx, P.glow, e.x, e.y - 18, 10, 0.8, true);
    },
  });

  /* ---------- Spawner: hive pod / drone factory ---------- */
  function spawnerSprite(ph) {
    const O = org(), M = mech(), mechw = wi() >= 3;
    return Gfx.anim(key("spawner"), 6, 76, 70, (g, w, h, p) => {
      const pulse = 1 + 0.06 * Math.sin(p * TAU);
      if (mechw) {
        g.fillStyle = lin(g, 0, 10, 0, 70, [[0, M.c], [0.4, M.a], [1, M.b]]);
        poly(g, [6, 70, 10, 26, 22, 10, 54, 10, 66, 26, 70, 70]); g.fill(); g.strokeStyle = "#111"; g.lineWidth = 1.6; g.stroke();
        g.fillStyle = "#0c0e12"; rr(g, 22, 30, 32, 26, 6); g.fill();
        g.fillStyle = rad(g, 38, 43, 2, 16 * pulse, [[0, "#fff"], [0.3, `rgb(${M.glow})`], [1, "rgba(0,0,0,0)"]]); circ(g, 38, 43, 14 * pulse); g.fill();
        for (let i = 0; i < 4; i++) { g.fillStyle = M.b; g.fillRect(12 + i * 15, 62, 8, 8); }
      } else {
        g.fillStyle = rad(g, 30, 30, 4, 40 * pulse, [[0, O.c], [0.45, O.a], [1, O.b]]);
        g.beginPath(); g.ellipse(38, 42, 32 * pulse, 28 * pulse, 0, 0, TAU); g.fill();
        g.strokeStyle = "rgba(0,0,0,0.45)"; g.lineWidth = 2; g.stroke();
        g.strokeStyle = O.b; g.lineWidth = 3;
        for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(38, 14); g.quadraticCurveTo(10 + i * 14, 40, 14 + i * 12, 68); g.stroke(); }
        g.fillStyle = "#200a0a"; ell(g, 38, 22, 12 * pulse, 7 * pulse); g.fill();
        g.fillStyle = `rgba(${O.eye},0.85)`; ell(g, 38, 22, 7 * pulse, 4 * pulse); g.fill();
      }
    }, ph);
  }
  def("spawner", {
    init(e) { Object.assign(e, { hp: 30, w: 66, h: 66, r: 34, score: 1000, dmg: 20, kids: [], cd: 1.5, debris: wi() >= 3 ? mech().b : org().b, boomRGB: wi() >= 3 ? mech().glow : org().eye, noFall: true }); },
    update(e, dt) {
      e.kids = e.kids.filter((k) => !k.dead && G.enemies.includes(k));
      e.cd -= dt;
      if (e.cd <= 0 && e.kids.length < 3 && dist(e) < 800 && onScreen(e, 60)) {
        e.cd = U.rand(2.4, 3.6) - wi() * 0.2;
        const k = G.spawnEnemy("drone", e.x, e.y - 50, { vy: -200, vx: U.rand(-120, 120) });
        if (k) e.kids.push(k);
        Fx.glow(e.x, e.y - 50, 10, 40, e.boomRGB, 0.3);
      }
    },
    draw(ctx, e) { flashDraw(ctx, e, spawnerSprite(e.t * 1.2), e.x, e.y - 35); },
  });
  def("drone", {
    init(e) { Object.assign(e, { hp: 1.5, w: 22, h: 22, r: 13, score: 50, dmg: 10 }); },
    update(e, dt) {
      const a = Math.atan2(dy(e), dx(e));
      e.vx += Math.cos(a) * 520 * dt; e.vy += Math.sin(a) * 520 * dt;
      const sp = Math.hypot(e.vx, e.vy), max = 170 + wi() * 20;
      if (sp > max) { e.vx *= max / sp; e.vy *= max / sp; }
      e.x += e.vx * dt; e.y += e.vy * dt;
      if (e.t > 14) e.dead = true;
    },
    draw(ctx, e) {
      const mechw = wi() >= 3, P = mechw ? mech() : org();
      const c = Gfx.anim(key("drone"), 4, 26, 26, (g, w, h, p) => {
        g.fillStyle = rad(g, 11, 10, 1, 12, [[0, P.c], [0.5, P.a], [1, P.b]]); circ(g, 13, 13, 9); g.fill();
        g.strokeStyle = mechw ? P.c : P.b; g.lineWidth = 2;
        for (let i = 0; i < 4; i++) { const a = p * TAU + i * TAU / 4; g.beginPath(); g.moveTo(13 + Math.cos(a) * 9, 13 + Math.sin(a) * 9); g.lineTo(13 + Math.cos(a) * 13, 13 + Math.sin(a) * 13); g.stroke(); }
        g.fillStyle = `rgb(${mechw ? P.glow : P.eye})`; circ(g, 13, 13, 3); g.fill();
      }, e.t * 4);
      flashDraw(ctx, e, c, e.x, e.y - 11);
    },
  });

  /* ---------- Dropper: hangs from the ceiling ---------- */
  function dropperSprite(hang, ph) {
    const P = org();
    return Gfx.anim(key("dropper") + hang, 4, 44, 40, (g, w, h, p) => {
      const s = Math.sin(p * TAU);
      g.strokeStyle = P.b; g.lineWidth = 3;
      for (let i = 0; i < 4; i++) {
        const x = 10 + i * 8, k = (i % 2 ? s : -s) * 3;
        if (hang) { g.beginPath(); g.moveTo(x, 18); g.lineTo(x - 6 + k, 6); g.lineTo(x - 4 + k, 0); g.stroke(); }
        else { g.beginPath(); g.moveTo(x, 24); g.lineTo(x - 7 + k, 30); g.lineTo(x - 9 + k, 40); g.stroke(); }
      }
      g.fillStyle = rad(g, 18, 18, 2, 20, [[0, P.c], [0.5, P.a], [1, P.b]]);
      ell(g, 22, 22, 15, 11); g.fill(); g.strokeStyle = "rgba(0,0,0,0.5)"; g.lineWidth = 1.2; g.stroke();
      g.fillStyle = `rgb(${P.eye})`;
      for (const [x, y] of [[28, 20], [33, 22], [30, 25]]) { circ(g, x, y, 2); g.fill(); }
      g.fillStyle = "rgba(255,255,255,0.35)"; ell(g, 16, 16, 6, 3); g.fill();
    }, ph);
  }
  def("dropper", {
    init(e) { Object.assign(e, { hp: 4, w: 30, h: 26, r: 17, score: 200, dmg: 12, state: "hang", onGround: false, face: -1, debris: org().b }); e.y += e.h; },
    update(e, dt) {
      if (e.state === "hang") {
        if (Math.abs(dx(e)) < 80 && player().y > e.y) { e.state = "fall"; A.sfx("eshot"); }
        return;
      }
      if (e.state === "fall") { walk(e, dt, 0, { edges: false }); if (e.onGround) { e.state = "crawl"; facePlayer(e); Fx.dust(e.x, e.y, 4); } return; }
      walk(e, dt, 95);
      if (Math.random() < dt * 0.5) facePlayer(e);
    },
    draw(ctx, e) {
      const hang = e.state === "hang" ? 1 : 0;
      if (hang) { ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(e.x, e.y - e.h - 6); ctx.lineTo(e.x, e.y - e.h + 6); ctx.stroke(); }
      const c = dropperSprite(hang, e.t * 3);
      if (hang) flashDraw(ctx, e, c, e.x, e.y - 18, Math.PI);
      else flashDraw(ctx, e, c, e.x, e.y - 19, 0, e.face < 0);
    },
  });

  /* ---------- Roller: spiked ball ---------- */
  function rollerSprite(ph) {
    const P = mech();
    return Gfx.anim(key("roller"), 8, 46, 46, (g, w, h, p) => {
      g.save(); g.translate(23, 23); g.rotate(p * TAU / 4);
      for (let i = 0; i < 8; i++) { g.rotate(TAU / 8); g.fillStyle = lin(g, 0, -4, 0, 4, [[0, "#f0f2f8"], [1, "#606470"]]); poly(g, [12, -4, 22, 0, 12, 4]); g.fill(); }
      g.fillStyle = rad(g, -5, -5, 2, 16, [[0, P.c], [0.5, P.a], [1, P.b]]); circ(g, 0, 0, 14); g.fill();
      g.strokeStyle = "#111"; g.lineWidth = 1.4; g.stroke();
      g.strokeStyle = P.b; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 9, 0, Math.PI); g.stroke();
      g.restore();
    }, ph);
  }
  def("roller", {
    init(e) { Object.assign(e, { hp: 6, w: 36, h: 36, r: 20, score: 250, dmg: 20, onGround: false, face: dx(e) > 0 ? 1 : -1, spd: 0, debris: mech().b }); },
    update(e, dt) {
      if (Math.abs(dx(e)) < 700) e.spd = Math.min(250 + wi() * 20, e.spd + 300 * dt);
      walk(e, dt, e.spd, { edges: false });
      if (e.onGround && e.spd > 100 && Math.random() < dt * 14) Fx.add({ k: "spark", x: e.x, y: e.y - 2, vx: -e.face * U.rand(60, 160), vy: U.rand(-160, -60), life: 0.25, drag: 3, g: 600, rgb: "255,220,160", w: 1.5 });
    },
    draw(ctx, e) { flashDraw(ctx, e, rollerSprite(e.x / 120), e.x, e.y - 20); },
  });

  /* ---------- Crawler: slow bug ---------- */
  function crawlerSprite(ph) {
    const P = org();
    return Gfx.anim(key("crawler"), 6, 52, 30, (g, w, h, p) => {
      g.strokeStyle = P.b; g.lineWidth = 2.5;
      for (let i = 0; i < 5; i++) { const x = 10 + i * 8, k = Math.sin(p * TAU + i) * 3; g.beginPath(); g.moveTo(x, 20); g.lineTo(x - 4 + k, 30); g.stroke(); }
      g.fillStyle = lin(g, 0, 6, 0, 24, [[0, P.c], [0.4, P.a], [1, P.b]]);
      for (let i = 0; i < 4; i++) { ell(g, 12 + i * 9, 18, 8, 8); g.fill(); }
      g.strokeStyle = "rgba(0,0,0,0.35)"; g.lineWidth = 1;
      for (let i = 0; i < 4; i++) { ell(g, 12 + i * 9, 18, 8, 8); g.stroke(); }
      g.fillStyle = P.a; ell(g, 44, 18, 7, 7); g.fill();
      g.fillStyle = `rgb(${P.eye})`; circ(g, 47, 15, 2); g.fill();
      g.strokeStyle = P.c; g.lineWidth = 1.2; g.beginPath(); g.moveTo(46, 12); g.quadraticCurveTo(52, 4, 50, 2); g.stroke();
      if (wi() === 1) { g.fillStyle = "rgba(220,200,255,0.9)"; for (let i = 0; i < 3; i++) poly(g, [14 + i * 9, 12, 17 + i * 9, 2, 20 + i * 9, 12]), g.fill(); }
    }, ph);
  }
  def("crawler", {
    init(e) { Object.assign(e, { hp: 6, w: 44, h: 26, r: 18, score: 120, dmg: 12, onGround: false, face: dx(e) > 0 ? 1 : -1, debris: org().b }); },
    update(e, dt) {
      walk(e, dt, 45 + wi() * 6);
      e.cd -= dt;
      if (wi() >= 2 && e.cd <= 0 && onScreen(e, -20) && dist(e) < 500) { e.cd = U.rand(2.5, 4); G.eshoot(e.x, e.y - 20, e.face * 200, -380, { kind: "spore", g: 700, r: 6 }); A.sfx("eshot"); }
    },
    draw(ctx, e) { flashDraw(ctx, e, crawlerSprite(e.t * 2), e.x, e.y - 15, 0, e.face < 0); },
  });

  /* ---------- Jumper: leaps out of the liquid ---------- */
  def("jumper", {
    init(e) { Object.assign(e, { hp: 4, w: 30, h: 30, r: 18, score: 300, dmg: 15, base: e.y + 30, state: "wait", cd: U.rand(1, 3), invuln: true, debris: org().b, noHome: true }); e.y = e.base + 20; },
    update(e, dt) {
      if (e.state === "wait") {
        e.invuln = true; e.noHome = true; e.harmless = true;
        e.cd -= dt;
        if (e.cd <= 0 && Math.abs(dx(e)) < 500) { e.state = "jump"; e.vy = -U.rand(950, 1150); e.vx = Math.sign(dx(e)) * U.rand(30, 90); A.sfx("splash"); Fx.splash(e.x, e.base - 30, G.th.liquid.rgb, 10); }
        return;
      }
      e.invuln = false; e.noHome = false; e.harmless = false;
      e.vy += 1700 * dt; e.x += e.vx * dt; e.y += e.vy * dt;
      if (e.vy > 0 && e.y > e.base + 20) { e.state = "wait"; e.cd = U.rand(1.6, 3); A.sfx("splash"); Fx.splash(e.x, e.base - 30, G.th.liquid.rgb, 8); }
      if (e.vy > -100 && e.vy < 0 && e.cd2 === undefined && onScreen(e) && wi() >= 1) { e.cd2 = 1; for (let k = -1; k <= 1; k++) G.eshoot(e.x, e.y - 15, k * 160, -120, { kind: "spore", g: 600, r: 5 }); }
      if (e.vy > 0) e.cd2 = undefined;
    },
    draw(ctx, e) {
      if (e.state === "wait") return;
      const P = org();
      const c = Gfx.sprite(key("jumper"), 46, 34, (g) => {
        g.fillStyle = lin(g, 0, 4, 0, 30, [[0, P.c], [0.5, P.a], [1, P.b]]);
        g.beginPath(); g.moveTo(4, 17); g.quadraticCurveTo(20, 0, 36, 12); g.lineTo(44, 4); g.lineTo(42, 17); g.lineTo(44, 30); g.lineTo(36, 22); g.quadraticCurveTo(20, 34, 4, 17); g.fill();
        g.strokeStyle = "rgba(0,0,0,0.5)"; g.lineWidth = 1.2; g.stroke();
        g.fillStyle = "#fff"; circ(g, 12, 14, 3.5); g.fill(); g.fillStyle = `rgb(${P.eye})`; circ(g, 11, 14, 2); g.fill();
        g.fillStyle = "#fff"; for (let i = 0; i < 3; i++) poly(g, [5 + i * 3, 19, 6.5 + i * 3, 23, 8 + i * 3, 19]), g.fill();
      });
      const rot = Math.atan2(e.vy, Math.abs(e.vx) + 60) * (e.vx < 0 ? -1 : 1) + (e.vx < 0 ? 0 : Math.PI);
      flashDraw(ctx, e, c, e.x, e.y - 15, rot - Math.PI, e.vx > 0);
    },
  });

  /* ---------- Worm: rises out of the ground ---------- */
  def("worm", {
    init(e) { Object.assign(e, { hp: 10, w: 34, h: 30, r: 20, score: 400, dmg: 16, rise: 0, state: "hidden", cd: U.rand(0.5, 2), gy: e.y, invuln: true, harmless: true, noHome: true, debris: org().b }); },
    update(e, dt) {
      if (e.state === "hidden") {
        e.cd -= dt;
        if (e.cd <= 0 && Math.abs(dx(e)) < 420) { e.state = "up"; Fx.dust(e.x, e.gy, 10, "160,120,100"); A.sfx("crumble"); }
      } else if (e.state === "up") { e.rise = Math.min(1, e.rise + dt * 1.6); if (e.rise >= 1) { e.state = "attack"; e.cd = U.rand(1.6, 2.4); } }
      else if (e.state === "attack") {
        e.cd -= dt;
        if (e.cd > 0.8 && Math.random() < dt * 1.2 && onScreen(e)) { const [vx, vy] = G.aimAt(e.x, e.y - e.h / 2, 320); G.eshoot(e.x, e.y - e.h / 2, vx, vy, { kind: "spore", r: 6 }); A.sfx("eshot"); }
        if (e.cd <= 0) e.state = "down";
      } else if (e.state === "down") { e.rise = Math.max(0, e.rise - dt * 1.4); if (e.rise <= 0) { e.state = "hidden"; e.cd = U.rand(1.2, 2.2); } }
      const hgt = e.rise * 120;
      e.sway = Math.sin(e.t * 3) * 26 * e.rise;
      e.headX = e.x + e.sway; e.headY = e.gy - hgt;
      // collision circle follows the head
      e.h = 30; e.y = e.headY + 15; e.xc = e.headX;
      e.invuln = e.rise < 0.4; e.harmless = e.rise < 0.3; e.noHome = e.rise < 0.4;
    },
    draw(ctx, e) {
      if (e.rise <= 0.01) return;
      const P = org(), n = 7;
      for (let i = n; i >= 0; i--) {
        const f = i / n, x = e.baseX + e.sway * (1 - f) * (1 - f), y = e.gy - e.rise * 120 * (1 - f);
        const r = 13 - f * 3;
        ctx.fillStyle = i === 0 ? P.a : i % 2 ? P.b : P.a;
        ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.4)"; ctx.lineWidth = 1; ctx.stroke();
      }
      const hx = e.headX, hy = e.headY;
      ctx.fillStyle = e.flash > 0 ? "#fff" : P.a; ctx.beginPath(); ctx.arc(hx, hy, 16, 0, TAU); ctx.fill();
      const open = 0.3 + 0.3 * Math.sin(e.t * 8);
      ctx.fillStyle = "#200808"; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.arc(hx, hy, 15, -Math.PI / 2 - open, -Math.PI / 2 + open); ctx.fill();
      ctx.fillStyle = `rgb(${P.eye})`; ctx.beginPath(); ctx.arc(hx - 7, hy + 2, 3, 0, TAU); ctx.arc(hx + 7, hy + 2, 3, 0, TAU); ctx.fill();
    },
  });
  // the worm's hit circle is at the head, not at e.x
  const wormDef = E.TYPES.worm, wu = wormDef.update;
  wormDef.update = function (e, dt) { if (e.baseX === undefined) e.baseX = e.x; e.x = e.baseX; wu(e, dt); e.x = e.rise > 0.01 ? e.headX : e.baseX; };

  /* ---------- Orb mine ---------- */
  def("orb", {
    init(e) { Object.assign(e, { hp: 3, w: 30, h: 30, r: 17, score: 150, dmg: 20, fuse: -1, hy: e.y }); },
    update(e, dt) {
      const d = dist(e);
      if (e.fuse < 0) {
        if (d < 600) { const a = Math.atan2(dy(e), dx(e)); e.vx += Math.cos(a) * 220 * dt; e.vy += Math.sin(a) * 220 * dt; }
        else e.vy += (e.hy - e.y) * dt;
        const sp = Math.hypot(e.vx, e.vy), max = 110 + wi() * 12;
        if (sp > max) { e.vx *= max / sp; e.vy *= max / sp; }
        e.x += e.vx * dt; e.y += e.vy * dt;
        if (d < 85) { e.fuse = 0.7; A.sfx("timeWarn"); }
      } else {
        e.fuse -= dt;
        if (e.fuse <= 0) {
          e.dead = true; if (e.spawn) e.spawn.state = "dead";
          Fx.explode(e.x, e.y - 15, 40, { rgb: "255,120,80" }); A.sfx("boomBig");
          if (dist(e) < 100) G.hurtPlayer(e.dmg, e.x);
        }
      }
    },
    draw(ctx, e) {
      const P = mech(), bl = e.fuse >= 0 && Math.floor(e.t * 18) % 2;
      const c = Gfx.sprite(key("orb"), 40, 40, (g) => {
        for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; g.fillStyle = P.b; poly(g, [20 + Math.cos(a - 0.2) * 12, 20 + Math.sin(a - 0.2) * 12, 20 + Math.cos(a) * 19, 20 + Math.sin(a) * 19, 20 + Math.cos(a + 0.2) * 12, 20 + Math.sin(a + 0.2) * 12]); g.fill(); }
        g.fillStyle = rad(g, 15, 15, 2, 15, [[0, P.c], [0.5, P.a], [1, P.b]]); circ(g, 20, 20, 13); g.fill();
        g.strokeStyle = "#111"; g.lineWidth = 1.4; g.stroke();
      });
      flashDraw(ctx, e, c, e.x, e.y - 15, e.t * 1.5);
      Gfx.glowAt(ctx, bl ? "255,255,255" : "255,60,40", e.x, e.y - 15, bl ? 30 : 12, 0.9, true);
    },
  });

  /* ---------- Bomber ---------- */
  function bomberSprite(ph) {
    const P = mech();
    return Gfx.anim(key("bomber"), 4, 96, 46, (g, w, h, p) => {
      g.fillStyle = lin(g, 0, 8, 0, 36, [[0, P.c], [0.45, P.a], [1, P.b]]);
      g.beginPath(); g.moveTo(4, 22); g.quadraticCurveTo(20, 6, 60, 8); g.lineTo(92, 16); g.lineTo(88, 28); g.quadraticCurveTo(50, 40, 4, 22); g.fill();
      g.strokeStyle = "#111"; g.lineWidth = 1.5; g.stroke();
      g.fillStyle = P.b; poly(g, [40, 24, 60, 24, 70, 42, 50, 40]); g.fill();
      g.fillStyle = "#14161c"; rr(g, 14, 14, 22, 8, 4); g.fill();
      g.fillStyle = `rgba(${P.glow},0.8)`; rr(g, 16, 15, 14, 4, 2); g.fill();
      const f = 6 + Math.sin(p * TAU) * 3;
      g.fillStyle = "rgba(255,200,120,0.9)"; ell(g, 94, 22, f, 4); g.fill();
    }, ph);
  }
  def("bomber", {
    init(e) { Object.assign(e, { hp: 10, w: 80, h: 36, r: 30, score: 500, dmg: 20, debris: mech().b, boomRGB: "255,170,80" }); e.dir = e.dir || (dx(e) > 0 ? 1 : -1); e.y0 = e.y; e.face = e.dir; },
    update(e, dt) {
      e.x += e.dir * 170 * dt;
      const ty = Math.min(e.y0, player().y - 230);
      e.y += (ty - e.y) * Math.min(1, dt);
      e.cd -= dt;
      if (e.cd <= 0 && Math.abs(dx(e)) < 180 && dy(e) > 0) { e.cd = 0.55; G.eshoot(e.x, e.y - 6, e.dir * 60, 60, { kind: "bomb", g: 900, r: 8, dmg: 18 }); A.sfx("eshot2"); }
      if ((e.dir < 0 && e.x < G.cam.x - 300) || (e.dir > 0 && e.x > G.cam.x + W + 300)) { e.dead = true; if (e.spawn) e.spawn.state = "dead"; }
    },
    draw(ctx, e) { flashDraw(ctx, e, bomberSprite(e.t * 10), e.x, e.y - 22, 0, e.dir > 0); },
  });

  /* ---------- Soldier: armoured trooper with shield ---------- */
  function soldierSprite(ph) {
    const P = mech();
    return Gfx.anim(key("soldier"), 8, 48, 62, (g, w, h, p) => {
      const s = Math.sin(p * TAU);
      g.strokeStyle = P.b; g.lineWidth = 7;
      g.beginPath(); g.moveTo(20, 36); g.lineTo(20 + s * 7, 48); g.lineTo(18 + s * 9, 60); g.stroke();
      g.beginPath(); g.moveTo(26, 36); g.lineTo(26 - s * 7, 48); g.lineTo(24 - s * 9, 60); g.stroke();
      g.fillStyle = lin(g, 0, 12, 0, 40, [[0, P.c], [0.4, P.a], [1, P.b]]);
      rr(g, 12, 14, 22, 24, 5); g.fill(); g.strokeStyle = "#111"; g.lineWidth = 1.3; g.stroke();
      g.fillStyle = lin(g, 0, 0, 0, 14, [[0, P.c], [1, P.a]]); rr(g, 14, 1, 18, 15, 6); g.fill(); g.stroke();
      g.fillStyle = `rgb(${P.glow})`; g.fillRect(24, 6, 9, 3);
      // shield
      g.fillStyle = lin(g, 34, 0, 46, 0, [[0, "#606878"], [0.5, "#c8d0e0"], [1, "#505868"]]);
      rr(g, 34, 14, 10, 34, 3); g.fill(); g.strokeStyle = "#111"; g.stroke();
      g.fillStyle = `rgba(${P.glow},0.7)`; g.fillRect(37, 20, 4, 20);
      g.fillStyle = "#1a1c22"; g.fillRect(28, 26, 16, 5);
    }, ph);
  }
  def("soldier", {
    init(e) { Object.assign(e, { hp: 14, w: 30, h: 58, r: 24, score: 500, dmg: 16, armor: true, onGround: false, face: dx(e) > 0 ? 1 : -1, debris: mech().b, stop: 0 }); },
    armorHit(e, x, y) { return Math.sign(x - e.x) === e.face && y > e.y - 52 && y < e.y - 8; },
    update(e, dt) {
      e.stop -= dt;
      walk(e, dt, e.stop > 0 ? 0 : 60);
      e.cd -= dt;
      if (e.cd <= 0 && onScreen(e, -20) && dist(e) < 650) {
        facePlayer(e); e.cd = U.rand(1.8, 2.8) - wi() * 0.15; e.stop = 0.6;
        for (let k = -1; k <= 1; k++) { const a = (e.face > 0 ? 0 : Math.PI) + k * 0.2; G.eshoot(e.x + e.face * 22, e.y - 34, Math.cos(a) * 380, Math.sin(a) * 380, { kind: "bolt", rgb: mech().glow, r: 6 }); }
        A.sfx("eshot2");
      }
    },
    draw(ctx, e) { flashDraw(ctx, e, soldierSprite(e.stop > 0 ? 0 : e.t * 1.5), e.x, e.y - 31, 0, e.face < 0); },
  });

  /* ---------- Jetpack trooper ---------- */
  def("jetpack", {
    init(e) { Object.assign(e, { hp: 8, w: 32, h: 52, r: 22, score: 400, dmg: 14, ph: U.rand(TAU), ox: U.rand(180, 380), oy: U.rand(-90, 60), debris: mech().b }); },
    update(e, dt) {
      const p = player();
      const tx = p.x + (e.x > p.x ? e.ox : -e.ox), ty = p.y - 200 + e.oy + Math.sin(e.t * 1.7 + e.ph) * 50;
      for (const o of G.enemies) if (o !== e && o.type === e.type && Math.abs(o.x - e.x) < 50 && Math.abs(o.y - e.y) < 60) { e.vx += Math.sign(e.x - o.x || 1) * 300 * dt; e.vy += Math.sign(e.y - o.y || 1) * 300 * dt; }
      e.vx += U.clamp((tx - e.x) / 100, -1, 1) * 500 * dt; e.vy += U.clamp((ty - e.y) / 100, -1, 1) * 500 * dt;
      e.vx *= 0.97; e.vy *= 0.97;
      e.x += e.vx * dt; e.y += e.vy * dt;
      facePlayer(e);
      e.cd -= dt;
      if (e.cd <= 0 && onScreen(e, -30)) { e.cd = U.rand(1.2, 2.2) - wi() * 0.1; const [vx, vy] = G.aimAt(e.x, e.y - 34, 400); G.eshoot(e.x + e.face * 16, e.y - 34, vx, vy, { kind: "bolt", rgb: mech().glow, r: 6 }); A.sfx("eshot2"); }
      if (Math.random() < dt * 30) Fx.add({ k: "glow", x: e.x - e.face * 10, y: e.y - 8, vx: 0, vy: 160, size: 6, size2: 2, rgb: "255,170,80", life: 0.2, hot: true });
    },
    draw(ctx, e) {
      const P = mech();
      const c = Gfx.sprite(key("jetpack"), 46, 56, (g) => {
        g.fillStyle = P.b; rr(g, 4, 14, 12, 26, 4); g.fill();
        g.fillStyle = "#2a2a30"; poly(g, [6, 40, 14, 40, 16, 48, 4, 48]); g.fill();
        g.fillStyle = lin(g, 0, 12, 0, 40, [[0, P.c], [0.4, P.a], [1, P.b]]); rr(g, 14, 14, 20, 24, 5); g.fill();
        g.strokeStyle = "#111"; g.lineWidth = 1.3; g.stroke();
        g.fillStyle = lin(g, 0, 0, 0, 14, [[0, P.c], [1, P.a]]); rr(g, 16, 1, 16, 15, 6); g.fill(); g.stroke();
        g.fillStyle = `rgb(${P.glow})`; g.fillRect(25, 6, 8, 3);
        g.strokeStyle = P.b; g.lineWidth = 6; g.beginPath(); g.moveTo(20, 38); g.lineTo(18, 52); g.moveTo(28, 38); g.lineTo(32, 50); g.stroke();
        g.fillStyle = "#1a1c22"; g.fillRect(30, 24, 16, 6);
      });
      flashDraw(ctx, e, c, e.x, e.y - 28, 0, e.face < 0);
      Gfx.glowAt(ctx, "255,170,80", e.x - e.face * 10, e.y - 4, 12 + Math.random() * 4, 0.9, true);
    },
  });

  /* ---------- Missile pod ---------- */
  def("missiler", {
    init(e) { Object.assign(e, { hp: 16, w: 54, h: 40, r: 26, score: 600, dmg: 15, debris: mech().b, noFall: true, open: 0 }); },
    update(e, dt) {
      e.cd -= dt;
      e.open = Math.max(0, e.open - dt * 2);
      if (e.cd <= 0 && onScreen(e, 20) && dist(e) < 900) {
        e.cd = U.rand(3, 4) - wi() * 0.2; e.open = 1;
        for (let k = 0; k < 2; k++) G.eshoot(e.x - 10 + k * 20, e.y - 38, (k - 0.5) * 200, -420, { kind: "missile", homing: 2.2, r: 8, dmg: 18, life: 5 });
        A.sfx("missile");
      }
    },
    draw(ctx, e) {
      const P = mech();
      const c = Gfx.sprite(key("missiler"), 60, 44, (g) => {
        g.fillStyle = lin(g, 0, 10, 0, 44, [[0, P.c], [0.4, P.a], [1, P.b]]);
        poly(g, [4, 44, 8, 12, 52, 12, 56, 44]); g.fill(); g.strokeStyle = "#111"; g.lineWidth = 1.5; g.stroke();
        for (let i = 0; i < 2; i++) { g.fillStyle = "#101216"; rr(g, 14 + i * 20, 16, 12, 18, 3); g.fill(); g.fillStyle = "#e03020"; poly(g, [16 + i * 20, 22, 20 + i * 20, 16, 24 + i * 20, 22]); g.fill(); }
        g.fillStyle = "#ffd040"; for (let x = 6; x < 54; x += 10) g.fillRect(x, 38, 5, 4);
      });
      flashDraw(ctx, e, c, e.x, e.y - 22);
      if (e.open > 0) Gfx.glowAt(ctx, "255,170,60", e.x, e.y - 40, 30 * e.open, 0.8, true);
    },
  });

  /* ---------- Spider mech ---------- */
  function spiderSprite(ph, small) {
    const P = small ? org() : mech();
    const sz = small ? 0.55 : 1;
    return Gfx.anim(key(small ? "spiderling" : "spider"), 8, 80 * sz, 52 * sz, (g, w, h, p) => {
      g.scale(sz, sz);
      for (let i = 0; i < 4; i++) {
        const k = Math.sin(p * TAU + i * 1.6) * 6, x = 22 + i * 12;
        g.strokeStyle = P.b; g.lineWidth = 5;
        g.beginPath(); g.moveTo(x, 22); g.lineTo(x - 14 + k, 8); g.lineTo(x - 20 + k, 50); g.stroke();
        g.strokeStyle = P.a; g.lineWidth = 3;
        g.beginPath(); g.moveTo(x, 22); g.lineTo(x - 14 + k, 8); g.lineTo(x - 20 + k, 50); g.stroke();
      }
      g.fillStyle = lin(g, 0, 12, 0, 36, [[0, P.c], [0.4, P.a], [1, P.b]]);
      ell(g, 42, 26, 26, 13); g.fill(); g.strokeStyle = "#111"; g.lineWidth = 1.5; g.stroke();
      g.fillStyle = "#14161c"; ell(g, 62, 26, 10, 8); g.fill();
      for (const [x, y] of [[62, 22], [66, 27], [60, 29]]) { Gfx.lamp(g, x, y, 2, small ? P.eye : P.glow); }
      g.fillStyle = "rgba(255,255,255,0.3)"; ell(g, 36, 18, 14, 3); g.fill();
    }, ph);
  }
  def("spider", {
    init(e) { Object.assign(e, { hp: 22, w: 64, h: 46, r: 30, score: 800, dmg: 20, onGround: false, face: dx(e) > 0 ? 1 : -1, debris: mech().b, jumpT: U.rand(2, 4) }); },
    update(e, dt) {
      walk(e, dt, e.onGround ? 90 : null);
      e.jumpT -= dt;
      if (e.onGround && e.jumpT <= 0 && dist(e) < 600) { e.jumpT = U.rand(2.5, 4); facePlayer(e); e.vy = -760; e.vx = e.face * 220; e.onGround = false; }
      e.cd -= dt;
      if (e.cd <= 0 && onScreen(e, -20)) { e.cd = U.rand(1.4, 2.2) - wi() * 0.1; for (let k = -1; k <= 1; k++) { const [vx, vy] = G.aimAt(e.x, e.y - 26, 330, 0); const a = Math.atan2(vy, vx) + k * 0.25; G.eshoot(e.x + e.face * 26, e.y - 26, Math.cos(a) * 330, Math.sin(a) * 330, { rgb: mech().glow, r: 6 }); } A.sfx("eshot"); }
    },
    draw(ctx, e) { flashDraw(ctx, e, spiderSprite(e.t * 1.8, false), e.x, e.y - 26, 0, e.face < 0); },
  });
  def("spiderling", {
    init(e) { Object.assign(e, { hp: 2, w: 36, h: 24, r: 15, score: 60, dmg: 10, onGround: false, face: dx(e) > 0 ? 1 : -1 }); },
    update(e, dt) { walk(e, dt, 170, { edges: false }); if (Math.random() < dt) facePlayer(e); if (e.t > 15) e.dead = true; },
    draw(ctx, e) { flashDraw(ctx, e, spiderSprite(e.t * 4, true), e.x, e.y - 14, 0, e.face < 0); },
  });

  /* ---------- Spitter: organic turret, lobs acid ---------- */
  def("spitter", {
    init(e) { Object.assign(e, { hp: 10, w: 40, h: 40, r: 22, score: 300, dmg: 14, noFall: true, open: 0, debris: org().b, boomRGB: "180,255,80" }); },
    update(e, dt) {
      e.cd -= dt; e.open = Math.max(0, e.open - dt * 2);
      if (e.cd <= 0 && onScreen(e, -10) && dist(e) < 700) {
        e.cd = U.rand(1.8, 2.8); e.open = 1;
        const d = dx(e), tt = 0.9;
        for (let k = 0; k < 3; k++) G.eshoot(e.x, e.y - 34, d / tt + (k - 1) * 60, -480 - k * 40, { kind: "spore", g: 900, r: 7 });
        A.sfx("eshot");
      }
    },
    draw(ctx, e) {
      const P = org(), op = e.open;
      ctx.save(); ctx.translate(e.x, e.y);
      ctx.fillStyle = e.flash > 0 ? "#fff" : P.b; ctx.beginPath(); ctx.ellipse(0, -10, 22, 12, 0, Math.PI, TAU); ctx.fill();
      const gr = ctx.createLinearGradient(0, -44, 0, -8);
      gr.addColorStop(0, P.c); gr.addColorStop(0.5, P.a); gr.addColorStop(1, P.b);
      ctx.fillStyle = e.flash > 0 ? "#fff" : gr;
      ctx.beginPath(); ctx.moveTo(-16, -8); ctx.quadraticCurveTo(-20, -40, 0, -42 - op * 4); ctx.quadraticCurveTo(20, -40, 16, -8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#200a08"; ctx.beginPath(); ctx.ellipse(0, -38, 7 + op * 4, 3 + op * 5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = "rgba(180,255,80,0.8)"; ctx.beginPath(); ctx.ellipse(0, -38, 3 + op * 2, 1 + op * 2, 0, 0, TAU); ctx.fill();
      ctx.restore();
    },
  });

})(window.XA);
