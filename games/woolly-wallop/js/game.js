/* Woolly Wallop: one level – the slingshot, the flock waiting in line, flying sheep and their
   tricks, damage and breaking blocks, explosions, wolves, scoring and the end of a level */
"use strict";

(function (WW) {
  const { U } = WW;
  const P = WW.Phys;
  const G = (WW.G = { on: null });
  const emit = (t, d) => { if (G.on) G.on(t, d); };
  const SLING = (G.SLING = { x: 4.4, y: -2.35 });
  const MAXPULL = (G.MAXPULL = 1.7), MAXV = (G.MAXV = 21.5);
  const DT = 1 / 120;
  const SHEEP_PTS = 10000;

  /* ---------- building a level ---------- */
  function makeBody(o) {
    if (o.t === "ground") return P.body({ x: o.x, y: o.y, width: o.w, height: o.h, static: true, friction: 0.9, data: { kind: "ground", hill: true } });
    if (o.t === "wolf") {
      const k = WW.WOLF[o.kind];
      const b = P.body({ shape: "circle", x: o.x, y: o.y, r: k.r, density: 0.8, friction: 0.7, bounce: 0.1, data: { kind: "wolf", wk: o.kind } });
      b.data.hp = b.data.max = k.hp * b.mass;
      return b;
    }
    const m = WW.MAT[o.mat];
    const b = o.t === "ball"
      ? P.body({ shape: "circle", x: o.x, y: o.y, r: o.r, density: m.density, friction: m.friction, bounce: m.bounce, data: { kind: "block", mat: o.mat } })
      : P.body({ x: o.x, y: o.y, a: o.a, width: o.w, height: o.h, density: m.density, friction: m.friction, bounce: m.bounce, data: { kind: "block", mat: o.mat } });
    b.data.hp = b.data.max = m.hp * b.mass;
    return b;
  }

  G.start = function (idx) {
    const lv = WW.LEVELS[idx];
    const wd = P.world(10);
    P.add(wd, P.body({ x: lv.w / 2, y: 5, width: lv.w + 80, height: 10, static: true, friction: 0.9, data: { kind: "ground" } }));
    for (const o of lv.objs) P.add(wd, makeBody(o));
    const s = {
      idx, lv, world: WW.WORLDS[lv.world], wd, t: 0, phase: "settle0", phaseT: 0,
      queue: lv.sheep.slice(), flying: [], cur: null, score: 0, shots: 0,
      trail: [], lastTrail: [], fx: [], texts: [], over: null, hops: 0,
      pull: { x: -1.2, y: 0.7 }, rng: U.rng(idx * 131 + 7), bonusLeft: 0, quiet: 0,
    };
    s.wolvesTotal = wd.bodies.filter((b) => b.data && b.data.kind === "wolf").length;
    s.blockPts = wd.bodies.filter((b) => b.data && b.data.kind === "block").reduce((a, b) => a + WW.MAT[b.data.mat].pts, 0);
    s.stars = lv.stars || G.defaultStars(s);
    G.s = s;
    // let everything settle before the player sees it
    for (let i = 0; i < 600 && (i < 120 || !allQuiet(s)); i++) P.step(wd, DT);
    for (const b of wd.bodies) if (!b.static) { b.vx = b.vy = b.w = 0; b.sleeping = true; }
    s.phase = "intro"; s.phaseT = 0;
    return s;
  };
  G.defaultStars = (s) => {
    const wolfPts = s.wd.bodies.filter((b) => b.data && b.data.kind === "wolf").reduce((a, b) => a + WW.WOLF[b.data.wk].pts, 0);
    return [Math.round((wolfPts + s.blockPts * 0.3) / 1000) * 1000, Math.round((wolfPts + s.blockPts * 0.5 + SHEEP_PTS) / 1000) * 1000];
  };
  function allQuiet(s) {
    for (const b of s.wd.bodies) if (!b.static && !b.sleeping && b.vx * b.vx + b.vy * b.vy + b.w * b.w * 0.2 > 0.04) return false;
    return true;
  }
  G.wolvesLeft = () => G.s.wd.bodies.filter((b) => b.data && b.data.kind === "wolf" && !b.dead).length;

  /* ---------- the slingshot ---------- */
  G.clampPull = function (x, y) {
    const l = Math.hypot(x, y);
    if (l > MAXPULL) { x *= MAXPULL / l; y *= MAXPULL / l; }
    return { x, y };
  };
  G.launchVel = (p) => ({ vx: (-p.x / MAXPULL) * MAXV, vy: (-p.y / MAXPULL) * MAXV });
  G.preview = function (p, n = 26, step = 0.06) {
    const v = G.launchVel(p), pts = [];
    for (let i = 1; i <= n; i++) { const t = i * step; pts.push({ x: SLING.x + p.x + v.vx * t, y: SLING.y + p.y + v.vy * t + 5 * t * t }); }
    return pts;
  };
  G.canAim = () => G.s.phase === "aim";
  G.fire = function (pull) {
    const s = G.s;
    if (s.phase !== "aim") return false;
    const p = G.clampPull(pull.x, pull.y);
    if (Math.hypot(p.x, p.y) < 0.3) return false;
    const type = s.queue.shift(), def = WW.SHEEP[type], v = G.launchVel(p);
    const b = P.body({ shape: "circle", x: SLING.x + p.x, y: SLING.y + p.y, r: def.r, density: def.density, friction: 0.5, bounce: 0.3, vx: v.vx, vy: v.vy, data: { kind: "sheep", type, hit: false, t: 0, still: 0, used: false, noSleep: true } });
    P.add(s.wd, b);
    s.flying = [b]; s.cur = b; s.shots++;
    s.lastTrail = s.trail; s.trail = [];
    s.phase = "fly"; s.phaseT = 0;
    emit("launch", { type, power: Math.hypot(p.x, p.y) / MAXPULL });
    return true;
  };

  /* ---------- tricks in flight ---------- */
  G.canAbility = function () {
    const s = G.s, b = s.cur;
    if (!b || b.dead || s.phase !== "fly" || b.data.used) return false;
    if (b.data.type === "woolly") return false;
    if (b.data.type === "boomer") return true;
    return !b.data.hit;
  };
  G.ability = function () {
    const s = G.s, b = s.cur;
    if (!G.canAbility()) { if (b && !b.dead && s.phase === "fly") emit("baa", b.data.type); return false; }
    b.data.used = true;
    const type = b.data.type, sp = Math.hypot(b.vx, b.vy) || 1;
    if (type === "lambs") {
      const ang = Math.atan2(b.vy, b.vx);
      for (const d of [-0.2, 0.2]) {
        const nb = P.body({ shape: "circle", x: b.x + Math.cos(ang + d * 4) * 0.1, y: b.y + Math.sin(ang + d * 4) * 0.1, r: b.r, density: 2, friction: 0.5, bounce: 0.3, vx: Math.cos(ang + d) * sp, vy: Math.sin(ang + d) * sp, data: { kind: "sheep", type: "lambs", hit: false, t: b.data.t, still: 0, used: true, noSleep: true, ghost: s.shots } });
        P.add(s.wd, nb); s.flying.push(nb);
      }
      b.data.ghost = s.shots;
      emit("split", b);
    } else if (type === "zoomer") {
      const k = Math.max(26, sp * 1.6) / sp;
      b.vx *= k; b.vy *= k;
      emit("dash", b);
    } else if (type === "boomer") {
      G.explode(b.x, b.y, 3.2, 15);
      kill(s, b, true);
    } else if (type === "bruiser") {
      b.vx *= 0.2; b.vy = 26; b.w = 0;
      emit("stomp", b);
    }
    return true;
  };

  /* ---------- damage, breaking, explosions ---------- */
  function kill(s, b, silent) {
    if (b.dead) return;
    P.remove(s.wd, b);
    const d = b.data;
    if (d.kind === "sheep") { if (!silent) emit("poof", b); fx(s, "wool", b.x, b.y, 10); return; }
    if (d.kind === "wolf") {
      const pts = WW.WOLF[d.wk].pts;
      s.score += pts; text(s, b.x, b.y - 0.6, pts, "#ffe14a", true);
      fx(s, "stars", b.x, b.y, 8); fx(s, "dust", b.x, b.y, 6);
      emit("wolf", b);
      return;
    }
    if (d.kind === "block") {
      const m = WW.MAT[d.mat];
      s.score += m.pts;
      fx(s, d.mat, b.x, b.y, b.shape === "circle" ? 8 : Math.min(16, 6 + Math.round(b.hw * b.hh * 30)), b);
      emit("break", d.mat);
      if (d.mat === "boom") G.explode(b.x, b.y, 2.7, 15);
    }
  }
  function damage(s, b, dmg) {
    if (b.static || b.dead || !b.data || b.data.kind === "sheep" || dmg <= 0) return;
    b.data.hp -= dmg;
    if (b.data.kind === "wolf") b.data.ouch = 0.5;
    s.score += Math.round(dmg * 30);
    if (b.data.hp <= 0) kill(s, b);
  }
  G.explode = function (x, y, R, power) {
    const s = G.s;
    s.shake = 0.5;
    fx(s, "boom", x, y, 1); fx(s, "dust", x, y, 14);
    emit("boom", { x, y });
    const hit = [];
    P.blast(s.wd, x, y, R, power, (b, k) => hit.push([b, k]));
    for (const [b, k] of hit) {
      const d = b.data;
      if (!d) continue;
      if (d.kind === "block") damage(s, b, d.max * k * (d.mat === "stone" ? 0.8 : 1.8));
      else if (d.kind === "wolf") damage(s, b, d.max * k * 2.2);
    }
  };
  function impacts(s) {
    for (const im of s.wd.impacts) {
      const { a, b, vn } = im;
      if (a.dead || b.dead) continue;
      const sa = a.data && a.data.kind === "sheep", sb = b.data && b.data.kind === "sheep";
      if (sa) { a.data.hit = true; } if (sb) { b.data.hit = true; }
      const ma = a.static ? 0 : a.im, mb = b.static ? 0 : b.im;
      if (ma + mb === 0) continue;
      const mEff = 1 / (ma + mb);
      const dmg = mEff * Math.max(0, vn - 2.2);
      if (vn > 3.2) {
        const mat = (x) => (x.data && x.data.kind === "block" ? x.data.mat : x.data && x.data.kind === "wolf" ? "wolf" : x.data && x.data.kind === "sheep" ? "sheep" : "ground");
        emit("hit", { a: mat(a), b: mat(b), vn });
        if (vn > 6) fx(s, "dust", im.x, im.y, 3);
      }
      if (dmg > 0) { damage(s, a, dmg); damage(s, b, dmg); }
    }
  }

  /* ---------- the step ---------- */
  G.update = function (dt) {
    const s = G.s;
    s.t += dt; s.phaseT += dt;
    s.shake = Math.max(0, (s.shake || 0) - dt);
    updateFx(s, dt);
    if (s.phase === "intro") { if (s.phaseT > 1.0) setPhase(s, "ready"); }
    else if (s.phase === "ready") { if (s.phaseT > 0.55) setPhase(s, "aim"); }
    const steps = Math.round(dt / DT);
    for (let i = 0; i < steps; i++) {
      P.step(s.wd, DT);
      impacts(s);
    }
    // out of the world
    for (const b of s.wd.bodies) if (!b.static && !b.dead && (b.y > 6 || b.x < -12 || b.x > s.lv.w + 20)) {
      if (b.data && b.data.kind === "sheep") kill(s, b, true); else kill(s, b);
    }
    for (const b of s.wd.bodies) if (b.data && b.data.kind === "wolf" && b.data.ouch) b.data.ouch = Math.max(0, b.data.ouch - dt);
    // the last wolf can also fall after the dust has settled (a late collapse): then the level
    // is won at once – the sheep left in line count as bonus and need not be shot
    if ((s.phase === "ready" || s.phase === "aim") && G.wolvesLeft() === 0) setPhase(s, "settle");
    if (s.phase === "fly") {
      for (const b of s.flying) {
        if (b.dead) continue;
        const d = b.data;
        d.t += dt;
        const sp = Math.hypot(b.vx, b.vy);
        if (d.hit && sp < 0.6) d.still += dt; else d.still = 0;
        if (d.type === "boomer" && d.hit && !d.used) { d.fuse = (d.fuse || 0) + dt; if (d.fuse > 1.4) { d.used = true; G.explode(b.x, b.y, 3.2, 15); kill(s, b, true); continue; } }
        if (d.still > 1.0 || d.t > 9) kill(s, b);
      }
      if (s.cur && !s.cur.dead && !s.cur.data.hit && s.phaseT % 0.04 < dt) s.trail.push({ x: s.cur.x, y: s.cur.y, big: s.trail.length % 6 === 0 });
      if (s.flying.every((b) => b.dead)) { s.flying = []; s.cur = null; setPhase(s, "settle"); }
    } else if (s.phase === "settle") {
      const q = allQuiet(s);
      s.quiet = q ? s.quiet + dt : 0;
      const left = G.wolvesLeft();
      if (s.quiet > 0.5 || s.phaseT > 6 || (left === 0 && s.phaseT > 2.5)) {
        if (left === 0) { setPhase(s, "bonus"); s.bonusLeft = s.queue.length; }
        else if (s.queue.length) setPhase(s, "ready");
        else { s.over = { win: false }; setPhase(s, "over"); emit("lose"); }
      }
    } else if (s.phase === "bonus") {
      if (s.phaseT > 0.9 && s.bonusLeft > 0) {
        s.phaseT = 0.3; s.bonusLeft--;
        s.score += SHEEP_PTS;
        const x = SLING.x - 1.4 - (s.queue.length - 1 - s.bonusLeft) * 1.1;
        text(s, x, -1.6, SHEEP_PTS, "#ffe14a", true);
        emit("bonus");
      } else if (s.bonusLeft === 0 && s.phaseT > 1.2) {
        const stars = 1 + (s.score >= s.stars[0] ? 1 : 0) + (s.score >= s.stars[1] ? 1 : 0);
        s.over = { win: true, stars, score: s.score };
        setPhase(s, "over");
        emit("win", s.over);
      }
    }
  };
  function setPhase(s, p) {
    s.phase = p; s.phaseT = 0;
    if (p === "ready") { s.hops++; emit("ready", s.queue[0]); }
  }

  /* ---------- effects ---------- */
  const FXCOL = { wood: ["#c8894a", "#a86a32", "#e0a868"], ice: ["#cfefff", "#9ad4f4", "#ffffff"], stone: ["#9a9aa4", "#7a7a84", "#bcbcc4"], boom: ["#e8503a", "#ffcf3a", "#5a3a22"] };
  function fx(s, k, x, y, n, b) {
    if (k === "boom") { s.fx.push({ k: "flash", x, y, t: 0, life: 0.45, r: 3 }); return; }
    for (let i = 0; i < n; i++) {
      const a = U.rand(U.TAU), v = U.rand(1.5, 6);
      if (k === "dust") s.fx.push({ k, x: x + U.rand(-0.3, 0.3), y: y + U.rand(-0.3, 0.3), vx: Math.cos(a) * v * 0.3, vy: Math.sin(a) * v * 0.3 - 0.5, t: 0, life: U.rand(0.5, 1.1), r: U.rand(0.2, 0.45) });
      else if (k === "wool") s.fx.push({ k, x, y, vx: Math.cos(a) * v * 0.6, vy: Math.sin(a) * v * 0.6 - 1, t: 0, life: U.rand(0.6, 1.2), r: U.rand(0.12, 0.25) });
      else if (k === "stars") s.fx.push({ k, x, y, vx: Math.cos(a) * v * 0.5, vy: Math.sin(a) * v * 0.5 - 2, t: 0, life: U.rand(0.6, 1.0), r: 0.18 });
      else {
        // splinters, shards and chips of the material
        const ox = b ? U.rand(-b.hw, b.hw) * Math.cos(b.a) : 0, oy = b ? U.rand(-b.hh, b.hh) : 0;
        s.fx.push({ k: "bit", x: x + ox, y: y + oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, t: 0, life: U.rand(0.6, 1.3), w: U.rand(0.08, 0.28), h: U.rand(0.06, 0.14), a: U.rand(U.TAU), va: U.rand(-10, 10), col: U.pick(FXCOL[k] || FXCOL.wood), grav: true });
      }
    }
  }
  function text(s, x, y, pts, col, big) { s.texts.push({ x, y, s: U.fmt(pts), t: 0, col, big }); }
  function updateFx(s, dt) {
    for (const p of s.fx) {
      p.t += dt;
      if (p.vx !== undefined) { p.x += p.vx * dt; p.y += p.vy * dt; }
      if (p.grav) { p.vy += 12 * dt; p.a += p.va * dt; if (p.y > -p.h / 2) { p.y = -p.h / 2; p.vy *= -0.3; p.vx *= 0.7; } }
      else if (p.k === "wool" || p.k === "stars") p.vy += 4 * dt;
    }
    s.fx = s.fx.filter((p) => p.t < p.life);
    if (s.fx.length > 500) s.fx.splice(0, s.fx.length - 500);
    for (const x of s.texts) { x.t += dt; x.y -= 0.6 * dt; }
    s.texts = s.texts.filter((x) => x.t < 1.4);
  }
})(window.WW);
