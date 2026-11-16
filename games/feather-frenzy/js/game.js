/* Feather Frenzy: one hunting round – camera and parallax, grouse, props, movers, shooting, effects and HUD */
"use strict";

(function (FF) {
  const { U, D, Store } = FF;
  const A = FF.Audio, I = FF.Input, S = FF.Sprites;
  const W = U.W, H = U.H;
  const PAR = FF.PAR, SCALE = FF.SCALE, RANGE = FF.RANGE;
  const PTS = FF.POINTS;
  const G = (FF.G = {});
  const ROUND = 90, MAG = 8;
  // height of each hiding place (at scale 1): peeking grouse show their head above it
  const COVER_TOP = { bush: 70, heather: 67, rock: 64, wall: 48, hay: 96, bale: 56, stump: 60, reeds: 70, crate: 70, barrel: 72, igloo: 80, drift: 62, chimney: 46, battlement: 34, well: 56, pumpkins: 60 };

  /* ---------- cached layer pictures ---------- */
  const cache = {};
  function layers(L) {
    if (cache[L.id]) return cache[L.id];
    const out = L.paint.map((fn, i) => {
      const cv = document.createElement("canvas");
      cv.width = FF.layerWidth(i); cv.height = H;
      fn(cv.getContext("2d"), cv.width);
      return cv;
    });
    return (cache[L.id] = out);
  }
  G.layers = layers;

  /* ---------- setup ---------- */
  G.start = function (idx) {
    const L = FF.LEVELS[idx];
    G.idx = idx; G.L = L;
    G.pics = layers(L);
    G.cam = RANGE / 2; G.camV = 0;
    G.t = 0; G.time = ROUND; G.countdown = 2.4; G.over = false; G.endT = 0; G.done = false;
    G.score = 0; G.shots = 0; G.hits = 0; G.ammo = MAG; G.reloading = false; G.reloadT = 0; G.cool = 0; G.emptyHint = 0;
    G.stats = { far: 0, mid: 0, near: 0, peek: 0, special: 0, bonus: 0, penalty: 0 };
    G.birds = []; G.parts = []; G.texts = []; G.weather = [];
    G.props = L.props.map((p) => Object.assign({}, p, { timer: U.rand(1, 6), cool: 0, done: false, hitT: 0, ang: 0, spin: 0, peeker: null }));
    G.spawnT = 0; G.flybyT = U.rand(12, 20); G.planeT = U.rand(8, 16); G.starT = U.rand(6, 12);
    G.plane = null; G.flyby = null; G.star = null;
    const M = L.movers || {};
    G.balloon = M.balloon ? newBalloon() : null; G.balloonT = 0;
    G.boat = M.boat ? { x: M.boat.x0, dir: 1, y: M.boat.y, hasBird: true, birdT: 0, t: 0 } : null;
    G.gondolas = M.gondolas ? Array.from({ length: M.gondolas.n }, (_, i) => ({ x: (i / M.gondolas.n) * FF.layerWidth(1), bird: null, birdT: U.rand(2, 8) })) : null;
    G.shake = 0; G.flash = 0;
    for (let i = 0; i < (L.walkers || 0); i++) spawnWalker();
    for (let i = 0; i < 3; i++) spawnFlyer(true);
    if (L.weather === "snow") for (let i = 0; i < 140; i++) G.weather.push({ x: U.rand(W), y: U.rand(H), v: U.rand(30, 70), r: U.rand(1.5, 3.5), ph: U.rand(9) });
    if (L.weather === "leaves") for (let i = 0; i < 26; i++) G.weather.push({ x: U.rand(W), y: U.rand(H), v: U.rand(30, 60), r: U.rand(5, 9), ph: U.rand(9), col: U.pick(["#c8602a", "#e8a030", "#a8402a", "#d8c040"]) });
    A.playSong(L.song);
  };
  function newBalloon() { return { x: U.rand(300, FF.layerWidth(1) - 300), y: U.rand(170, 230), vx: U.pick([-1, 1]) * U.rand(14, 22), popped: false, t: U.rand(9) }; }

  /* ---------- coordinates ---------- */
  const off = (l) => G.cam * PAR[l];
  const toScreen = (l, x) => x - off(l);
  const layerW = (l) => FF.layerWidth(l);

  /* ---------- grouse ---------- */
  const BANDS = [[90, 320], [80, 390], [70, 430]];
  function spawnFlyer(anywhere) {
    const L = G.L;
    let r = Math.random(), l = 0;
    if (r < L.mix[0]) l = 0; else if (r < L.mix[0] + L.mix[1]) l = 1; else l = 2;
    const golden = Math.random() < L.golden;
    if (golden) l = 1;
    const lw = layerW(l), o = off(l);
    let x, dir;
    if (anywhere) { x = U.rand(o - 200, o + W + 200); dir = U.pick([-1, 1]); }
    else if (Math.random() < 0.7) { dir = U.pick([-1, 1]); x = dir > 0 ? o - U.rand(60, 260) : o + W + U.rand(60, 260); }
    else { dir = U.pick([-1, 1]); x = dir > 0 ? -60 : lw + 60; }
    const sp = [U.rand(55, 95), U.rand(95, 150), U.rand(140, 215)][l] * L.speed * (golden ? 1.7 : 1);
    const [y0, y1] = BANDS[l];
    G.birds.push({ kind: "fly", l, x, y: U.rand(y0, y1), base: 0, vx: sp * dir, dir, t: U.rand(9), s: SCALE[l] * U.rand(0.92, 1.08), amp: U.rand(8, 28), fr: U.rand(1, 2.4), golden, skin: golden ? "gold" : L.skin, turnT: U.rand(4, 12) });
    const b = G.birds[G.birds.length - 1]; b.base = b.y;
  }
  function spawnWalker() {
    const L = G.L;
    const opts = [1, 2].filter((l) => L.ground[l]);
    if (!opts.length) return;
    const l = U.pick(opts), s = SCALE[l];
    G.birds.push({ kind: "walk", l, x: U.rand(100, layerW(l) - 100), y: L.ground[l] - 42 * s, vx: 0, dir: U.pick([-1, 1]), t: U.rand(9), s, skin: L.skin, stepT: U.rand(1, 3) });
  }
  function takeOff(b) {
    b.kind = "fly"; b.base = b.y - 60; b.amp = 14; b.fr = 2; b.vx = b.dir * [0, 140, 200][b.l] * G.L.speed; b.climb = 1; b.turnT = 99;
    A.sfx("flap");
  }

  /* ---------- update ---------- */
  G.update = function (dt) {
    const L = G.L;
    G.t += dt;
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 30);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 6);
    if (G.emptyHint > 0) G.emptyHint -= dt;
    // camera
    scroll(dt);
    if (G.countdown > 0) {
      const before = Math.ceil(G.countdown - 0.4);
      G.countdown -= dt;
      const after = Math.ceil(G.countdown - 0.4);
      if (after !== before && after > 0) A.sfx("tick");
      if (G.countdown <= 0.4 && !G.goSaid) { G.goSaid = true; A.sfx("go"); A.say("Go!", { force: true }); }
    } else if (!G.over) {
      const before = Math.ceil(G.time);
      G.time -= dt;
      if (G.time <= 10 && Math.ceil(G.time) !== before && G.time > 0) A.sfx("tick");
      if (G.time <= 0) { G.time = 0; G.over = true; G.endT = 0; A.sfx("timeup"); A.say("Time's up!", { force: true }); A.stopMusic(); }
    } else {
      G.endT += dt;
      if (G.endT > 2.4) G.done = true;
    }
    if (G.cool > 0) G.cool -= dt;
    // reloading: one shell after the other, then the pump
    if (G.reloading) {
      G.reloadT += dt;
      if (G.reloadT >= 0.085) { G.reloadT = 0; if (G.ammo < MAG) { G.ammo++; A.sfx("shell"); } else { G.reloading = false; A.sfx("pump"); G.cool = 0.15; } }
    }
    // spawning
    if (!G.over) {
      const fl = G.birds.filter((b) => !b.dead && b.kind === "fly").length;
      G.spawnT -= dt;
      if (fl < L.active && G.spawnT <= 0) { spawnFlyer(false); G.spawnT = U.rand(0.25, 0.9); }
      if (G.birds.filter((b) => !b.dead && b.kind === "walk").length < (L.walkers || 0) && Math.random() < dt * 0.15) spawnWalker();
      G.flybyT -= dt;
      if (G.flybyT <= 0 && !G.flyby) { G.flybyT = U.rand(16, 28); const dir = U.pick([-1, 1]); G.flyby = { x: dir > 0 ? -260 : W + 260, y: U.rand(260, 470), dir, t: 0 }; A.sfx("whoosh"); A.sfx("squawk"); }
      const M = L.movers || {};
      if (M.plane) { G.planeT -= dt; if (G.planeT <= 0 && !G.plane) { G.planeT = U.rand(26, 38); const dir = U.pick([-1, 1]); G.plane = { x: dir > 0 ? -400 : layerW(0) + 400, y: U.rand(110, 170), dir, t: 0, hit: false, eng: 0 }; } }
      if (M.stars) { G.starT -= dt; if (G.starT <= 0 && !G.star) { G.starT = U.rand(10, 18); G.star = { x: U.rand(off(0) + 200, off(0) + W), y: U.rand(40, 160), t: 0 }; } }
      if (M.balloon && !G.balloon) { G.balloonT -= dt; if (G.balloonT <= 0) G.balloon = newBalloon(); }
    }
    updateBirds(dt);
    updateProps(dt);
    updateMovers(dt);
    // particles and texts
    for (const p of G.parts) {
      p.life -= dt;
      if (p.kind === "feather") { p.vy = Math.min(p.vy + 160 * dt, 50); p.vx *= 1 - dt * 2; p.x += (p.vx + Math.sin(G.t * 4 + p.ph) * 30) * dt; p.y += p.vy * dt; p.a += p.va * dt; }
      else { p.vy += (p.grav ?? 400) * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.a !== undefined) p.a += (p.va || 0) * dt; }
    }
    G.parts = G.parts.filter((p) => p.life > 0);
    for (const t of G.texts) t.t += dt;
    G.texts = G.texts.filter((t) => t.t < 1.3);
    for (const w of G.weather) {
      if (L.weather === "snow") { w.y += w.v * dt; w.x += Math.sin(G.t + w.ph) * 20 * dt - G.camV * 0.3 * dt; }
      else { w.y += w.v * dt; w.x += (Math.sin(G.t * 1.3 + w.ph) * 50 - G.camV * 0.5) * dt; w.ph += dt; }
      if (w.y > H + 10) { w.y = -10; w.x = U.rand(W); }
      if (w.x < -20) w.x += W + 40; if (w.x > W + 20) w.x -= W + 40;
    }
  };

  function scroll(dt) {
    const m = I.mouse;
    let v = 0;
    const zone = 110;
    const edgeOk = !I.touch || m.down;
    if (edgeOk && m.inside !== false && I.lastDevice !== "keyboard") {
      if (m.x < zone) v = -(1 - Math.max(0, m.x) / zone) * 1500;
      else if (m.x > W - zone) v = (1 - Math.max(0, W - m.x) / zone) * 1500;
    }
    if (I.lastDevice === "keyboard" || I.lastDevice === "pad") {
      if (m.x < 70) v = -900; else if (m.x > W - 70) v = 900;
    }
    if (I.held("scrollL")) v = -1100;
    if (I.held("scrollR")) v = 1100;
    if (I.pad.rx) v = I.pad.rx * 1300;
    v *= FF.Main ? FF.Main.scrollSpeed : 1;
    G.camV = U.lerp(G.camV, v, Math.min(1, dt * 10));
    const c0 = G.cam;
    G.cam = U.clamp(G.cam + G.camV * dt, 0, RANGE);
    G.camV = (G.cam - c0) / Math.max(dt, 1e-4);
  }

  function updateBirds(dt) {
    const L = G.L;
    for (const b of G.birds) {
      b.t += dt;
      if (b.dead) {
        b.vy += 700 * dt; b.y += b.vy * dt; b.x += b.vx * dt; b.vx *= 1 - dt; b.rot += b.vr * dt;
        const gy = b.l === 1 && L.water ? L.water + 30 : L.ground[b.l] ? L.ground[b.l] - 20 * b.s : H + 200;
        if (b.y > gy && !b.landed) {
          b.landed = true; b.y = gy; b.vy = 0; b.vx = 0; b.vr = 0;
          if (b.l === 1 && L.water) { splash(toScreen(b.l, b.x), gy, b.s); b.gone = true; }
          else A.sfx("thud");
        }
        if (b.landed) { b.fade = (b.fade || 0) + dt; if (b.fade > 1.6) b.gone = true; }
        if (b.y > H + 150) b.gone = true;
        continue;
      }
      if (b.kind === "fly") {
        b.x += b.vx * dt;
        if (b.climb) { b.base -= 80 * dt; b.climb -= dt; }
        b.y = b.base + Math.sin(b.t * b.fr) * b.amp;
        b.turnT -= dt;
        if (b.turnT <= 0 && !G.over) { b.turnT = U.rand(5, 12); if (Math.random() < 0.35) { b.vx = -b.vx; } else { b.base = U.clamp(b.base + U.rand(-60, 60), BANDS[b.l][0], BANDS[b.l][1]); } }
        b.dir = b.vx > 0 ? 1 : -1;
        if (b.x < -400 || b.x > layerW(b.l) + 400) b.gone = true;
      } else if (b.kind === "walk") {
        b.stepT -= dt;
        if (b.stepT <= 0) { b.stepT = U.rand(1, 3.5); b.vx = Math.random() < 0.4 ? 0 : U.pick([-1, 1]) * U.rand(14, 30) * b.s; if (b.vx) b.dir = Math.sign(b.vx); if (Math.random() < 0.2) A.sfx("cluck"); }
        b.x = U.clamp(b.x + b.vx * dt, 40, layerW(b.l) - 40);
        if (b.x <= 40 || b.x >= layerW(b.l) - 40) b.vx = -b.vx;
      } else if (b.kind === "peek") {
        const p = b.prop;
        b.pt += dt;
        const up = Math.min(1, b.pt / 0.25), down = b.pt > b.stay ? Math.min(1, (b.pt - b.stay) / 0.25) : 0;
        b.y = U.lerp(b.y0, b.y1, U.ease(up) - U.ease(down));
        if (b.pt > b.stay && !b.sunk) { b.sunk = true; }
        if (down >= 1) { b.gone = true; p.peeker = null; p.timer = U.rand(3, 8); }
        b.dir = Math.sin(b.t * 1.7) > 0 ? 1 : -1;
      } else if (b.kind === "chute") {
        b.y += 46 * dt; b.x += Math.sin(b.t * 1.5) * 20 * dt;
        if (b.y > (L.ground[b.l] || L.water || 520) - 30) { if (L.water) { splash(toScreen(b.l, b.x), b.y, b.s); } b.gone = true; }
      }
    }
    G.birds = G.birds.filter((b) => !b.gone);
  }

  function updateProps(dt) {
    for (const p of G.props) {
      if (p.cool > 0) p.cool -= dt;
      if (p.hitT > 0) p.hitT -= dt;
      if (p.done) p.doneT = (p.doneT || 0) + dt;
      if (p.lit > 0) p.lit -= dt;
      if (p.type === "windmill") { p.spin = Math.max(0.6, p.spin - dt * 0.6); p.ang += p.spin * dt; }
      if (p.type === "signpost") p.spin *= 1 - dt * 2;
      if (p.wob) p.wob = Math.max(0, p.wob - dt * 0.2);
      if (p.kind === "peek" && !p.peeker && !G.over) {
        p.timer -= dt;
        if (p.timer <= 0) {
          const s = SCALE[p.layer] * (p.cover === "window" ? p.s : p.cover === "chimney" ? 0.8 : 1);
          const xo = p.cover === "window" ? 0 : U.rand(-0.25, 0.25) * p.w * p.s;
          let y0, y1;
          if (p.clip) { const h = p.clip[3]; y1 = p.y - h * 0.45 + 22 * s; y0 = p.y + 48 * s; }
          else { const top = p.y - (COVER_TOP[p.cover] || 60) * p.s; y1 = top + 12 * s; y0 = top + 56 * s; }
          const b = { kind: "peek", l: p.layer, prop: p, x: p.x + xo, y0, y1, y: y0, t: 0, pt: 0, stay: U.rand(1.1, 2.1) * (1.15 - G.idx * 0.03), s, skin: G.L.skin, dir: 1 };
          G.birds.push(b); p.peeker = b;
        }
      }
      if (p.kind === "critter") {
        if (p.hit > 0) p.hit -= dt * 1.5;
        if (!p.perch) {
          p.x += (p.dir || 1) * p.speed * dt;
          if (p.x > p.x1) p.dir = -1; if (p.x < p.x0) p.dir = 1;
          if (Math.random() < dt * 0.15) p.dir = -(p.dir || 1);
        }
      }
    }
  }

  function updateMovers(dt) {
    const L = G.L, M = L.movers || {};
    if (G.flyby) { const f = G.flyby; f.t += dt; f.x += f.dir * 1500 * dt; if (f.x < -400 || f.x > W + 400) G.flyby = null; }
    if (G.plane) {
      const p = G.plane; p.t += dt; p.x += p.dir * (p.hit ? 210 : 170) * dt;
      if (p.hit) { p.y += 18 * dt; if (Math.random() < dt * 20) G.parts.push({ kind: "smoke", l: 0, x: p.x - p.dir * 50, y: p.y, vx: 0, vy: -10, grav: -20, life: 1.2, max: 1.2, r: U.rand(6, 12) }); }
      const sx = toScreen(0, p.x);
      p.eng -= dt;
      if (sx > -200 && sx < W + 200 && p.eng <= 0) { p.eng = 2.3; A.sfx("engine"); }
      if (p.x < -500 || p.x > layerW(0) + 500) G.plane = null;
    }
    if (G.star) { const s = G.star; s.t += dt; s.x += 700 * dt; s.y += 260 * dt; if (s.t > 1.3) G.star = null; }
    if (G.balloon) {
      const b = G.balloon; b.t += dt;
      if (!b.popped) { b.x += b.vx * dt; if (b.x < 150 || b.x > layerW(1) - 150) b.vx = -b.vx; }
      else { b.fall = (b.fall || 0) + 400 * dt; b.y += b.fall * dt; if (b.y > 800) { G.balloon = null; G.balloonT = U.rand(20, 30); } }
    }
    if (G.boat) {
      const bt = G.boat, m = M.boat; bt.t += dt;
      bt.x += bt.dir * 40 * dt;
      if (bt.x > m.x1) bt.dir = -1; if (bt.x < m.x0) bt.dir = 1;
      if (!bt.hasBird) { bt.birdT -= dt; if (bt.birdT <= 0) { bt.hasBird = true; A.sfx("cluck"); } }
    }
    if (G.gondolas) {
      const lw = layerW(1);
      for (const g of G.gondolas) {
        g.x = (g.x + 34 * dt) % lw;
        if (!g.bird) { g.birdT -= dt; if (g.birdT <= 0) { g.bird = { t: 0, stay: U.rand(2, 3.2) }; } }
        else { g.bird.t += dt; if (g.bird.t > g.bird.stay) { g.bird = null; g.birdT = U.rand(3, 8); } }
      }
    }
  }

  /* ---------- shooting ---------- */
  G.reload = function () {
    if (G.over || G.reloading || G.ammo >= MAG) return;
    G.reloading = true; G.reloadT = 0.05;
  };
  G.shoot = function (sx, sy) {
    if (G.countdown > 0 || G.over) return;
    if (G.cool > 0) return;
    if (G.reloading) { if (G.ammo > 0) G.reloading = false; else return; }
    if (G.ammo <= 0) { A.sfx("empty"); G.emptyHint = 1.5; G.cool = 0.15; A.say("Reload!", { gap: 2500 }); return; }
    G.ammo--; G.shots++; G.cool = 0.2;
    A.sfx("shot");
    G.shake = 5; G.flash = 1;
    G.parts.push({ kind: "ring", x: sx, y: sy, vx: 0, vy: 0, grav: 0, life: 0.18, max: 0.18 });
    if (hitTest(sx, sy)) return;
    // a miss: dust on the ground, startle walkers nearby
    if (sy > 430) for (let i = 0; i < 6; i++) G.parts.push({ kind: "dust", x: sx, y: sy, vx: U.rand(-60, 60), vy: U.rand(-120, -20), grav: 300, life: 0.5, max: 0.5, r: U.rand(3, 7), col: G.L.weather === "snow" ? "#ffffff" : "#b8a080" });
    for (const b of G.birds) if (!b.dead && b.kind === "walk" && Math.hypot(toScreen(b.l, b.x) - sx, b.y - sy) < 140) takeOff(b);
  };

  function birdHit(b, sx, sy) {
    const x = toScreen(b.l, b.x), s = b.s;
    if (b.kind === "peek" && b.prop.clip) {
      const p = b.prop, [cx, cy, cw, ch] = p.clip;
      const px = toScreen(b.l, p.x);
      if (sx < px + cx || sx > px + cx + cw || sy < p.y + cy || sy > p.y + cy + ch) return false;
    }
    if (b.kind === "peek" && !b.prop.clip && sy > b.prop.y - (COVER_TOP[b.prop.cover] || 60) * b.prop.s) return false;
    const dx = (sx - x) / (46 * s), dy = (sy - b.y + 8 * s) / (40 * s);
    return dx * dx + dy * dy < 1;
  }
  function score(pts, x, y, label) {
    G.score = Math.max(0, G.score + pts);
    G.texts.push({ s: (label ? label + " " : "") + (pts > 0 ? "+" : "") + pts, x, y, t: 0, col: pts < 0 ? "#ff5a4a" : pts >= 50 ? "#ffe24a" : "#fffbe8" });
  }
  function killBird(b, sx, sy, pts, kind) {
    b.dead = true; b.vy = -140; b.vx = (b.vx || 0) * 0.2; b.rot = 0; b.vr = U.rand(-6, 6);
    if (b.kind === "peek") { b.prop.peeker = null; b.prop.timer = U.rand(3, 7); }
    G.hits++;
    if (G.stats[kind] !== undefined) G.stats[kind]++; else G.stats.special++;
    score(pts, sx, sy - 30);
    feathers(sx, sy, b.s, b.skin);
    A.sfx("squawk");
    if (b.golden) { A.sfx("golden"); A.say("Golden!", { gap: 1500 }); }
  }
  function feathers(x, y, s, skin) {
    const k = S.SKINS[skin] || S.SKINS.brown;
    for (let i = 0; i < 14; i++) G.parts.push({ kind: "feather", x, y, vx: U.rand(-220, 220) * s, vy: U.rand(-260, 40) * s, life: U.rand(1.2, 2.2), max: 2, a: U.rand(6), va: U.rand(-5, 5), ph: U.rand(9), s: (0.6 + Math.random() * 0.8) * Math.max(0.5, s), col: i % 3 ? k.body : k.belly });
  }
  function splash(x, y, s) {
    A.sfx("splash");
    for (let i = 0; i < 14; i++) G.parts.push({ kind: "drop", x, y, vx: U.rand(-90, 90), vy: U.rand(-300, -80), grav: 700, life: 0.8, max: 0.8, r: U.rand(2, 5) * Math.max(0.6, s) });
  }
  const inHB = (p, sx, sy) => { const x = toScreen(p.layer, p.x), k = p.ps || 1; return sx >= x + p.hb[0] * k && sx <= x + p.hb[2] * k && sy >= p.y + p.hb[1] * k && sy <= p.y + p.hb[3] * k; };

  function hitTest(sx, sy) {
    // the close fly-by first
    if (G.flyby) {
      const f = G.flyby;
      if (Math.abs(sx - f.x) < 120 && Math.abs(sy - f.y) < 90) {
        G.hits++; G.stats.special++; score(PTS.flyby, sx, sy - 40); feathers(sx, sy, 2.4, G.L.skin); A.sfx("squawk");
        G.birds.push({ kind: "fly", l: 2, x: f.x + off(2), y: f.y, s: 2.4, dead: true, vy: -100, vx: f.dir * 300, rot: 0, vr: 4, skin: G.L.skin, t: 0 });
        G.flyby = null; return true;
      }
    }
    for (let l = 2; l >= 0; l--) {
      // grouse, nearest (largest) first
      const bs = G.birds.filter((b) => b.l === l && !b.dead).sort((a, b) => b.s - a.s);
      for (const b of bs) {
        if (!birdHit(b, sx, sy)) continue;
        let pts, kind;
        if (b.golden) { pts = PTS.golden; kind = "special"; }
        else if (b.kind === "peek") { pts = PTS.peek; kind = "peek"; }
        else if (b.kind === "chute") { pts = PTS.chute; kind = "special"; }
        else if (b.kind === "walk") { pts = l === 2 ? PTS.walkNear : PTS.walkMid; kind = l === 2 ? "near" : "mid"; }
        else { pts = [PTS.far, PTS.mid, PTS.near][l]; kind = ["far", "mid", "near"][l]; }
        killBird(b, sx, sy, pts, kind);
        return true;
      }
      if (l === 1 && moverHit(sx, sy)) return true;
      if (l === 0 && skyHit(sx, sy)) return true;
      // props of this layer
      for (const p of G.props) {
        if (p.layer !== l) continue;
        if (p.kind === "critter") {
          const x = toScreen(l, p.x);
          if (Math.abs(sx - x) < 60 * SCALE[l] / 0.58 && sy > p.y - 90 * SCALE[l] / 0.58 && sy < p.y + 4 && (p.hit || 0) <= 0.2) {
            p.hit = 1; score(PTS.critter, sx, sy - 30, "Ouch!"); G.stats.penalty++;
            A.sfx({ sheep: "baa", cow: "moo", deer: "squeak", swan: "honk", horse: "neigh", hare: "squeak", cat: "meow", owl: "hoot" }[p.animal] || "penalty");
            A.sfx("penalty");
            return true;
          }
          continue;
        }
        if (!p.hb || !inHB(p, sx, sy)) continue;
        if (p.kind === "flush") {
          A.sfx("rustle");
          for (let i = 0; i < 10; i++) G.parts.push({ kind: "leaf", x: sx, y: sy, vx: U.rand(-80, 80), vy: U.rand(-60, 40), grav: 90, life: 1.6, max: 1.6, a: U.rand(6), va: U.rand(-4, 4), col: p.snow ? "#ffffff" : p.type === "spooky" ? "#2a2028" : "#5a8a2a", r: 5 });
          if (p.cool <= 0) {
            p.cool = 6; p.used = (p.used || 0) + 1;
            const n = U.randi(1, 2);
            for (let i = 0; i < n; i++) {
              const dir = U.pick([-1, 1]);
              G.birds.push({ kind: "fly", l, x: p.x + U.rand(-40, 40), y: p.y + p.hb[1] + 40, base: p.y + p.hb[1] - 20, vx: dir * U.rand(110, 170) * [0.6, 1, 1.4][l], dir, t: 0, s: SCALE[l], amp: 14, fr: 2, skin: G.L.skin, climb: 0.8, turnT: 8 });
            }
            A.sfx("flap");
          }
          return true;
        }
        if (p.kind === "bonus") { bonusHit(p, sx, sy); return true; }
      }
    }
    return false;
  }
  function bonusHit(p, sx, sy) {
    p.hitT = 0.5;
    const first = !p.done;
    const repeatOk = p.repeat && p.cool <= 0;
    if (p.lamp) { p.lit = 10; A.sfx("ding"); return; }
    const sound = { windmill: "wood", signpost: "wood", scarecrow: "rustle", weathervane: "metal", tractor: "metal", mushroom: "boing", beehive: "wood", lighthouse: "ding", buoy: "ding", flag: "wood", armor: "clank", snowman: "crunch", clock: "ding", laundry: "rustle", pumpkin: "crunch", bell: "ding" }[p.type] || "wood";
    A.sfx(sound);
    if (p.type === "windmill") p.spin += 5;
    if (p.type === "signpost") p.spin += 0.6;
    if (p.type === "scarecrow") p.wob = 0.3;
    if (p.type === "weathervane") p.ang = (p.ang || 0) + 8;
    if (first && !p.repeat) {
      p.done = true; p.doneT = 0;
      if (p.type === "scarecrow") G.parts.push({ kind: "hat", x: toScreen(p.layer, p.x), y: p.y - 180, vx: U.rand(-80, 80), vy: -300, grav: 600, life: 1.6, max: 1.6, a: 0, va: 6, l: p.layer });
      if (p.type === "armor") G.parts.push({ kind: "helmet", x: toScreen(p.layer, p.x), y: p.y - 150, vx: U.rand(-60, 60), vy: -260, grav: 600, life: 1.6, max: 1.6, a: 0, va: 7 });
      if (p.type === "snowman") G.parts.push({ kind: "snowhead", x: toScreen(p.layer, p.x), y: p.y - 162, vx: U.rand(-60, 60), vy: -200, grav: 600, life: 1.5, max: 1.5, a: 0, va: 4 });
      if (p.type === "pumpkin" || p.type === "beehive") for (let i = 0; i < 12; i++) G.parts.push({ kind: "dust", x: sx, y: sy, vx: U.rand(-160, 160), vy: U.rand(-260, -40), grav: 500, life: 0.8, max: 0.8, r: U.rand(3, 7), col: p.type === "pumpkin" ? "#e8832a" : "#e8b030" });
      if (p.type === "beehive") for (let i = 0; i < 10; i++) G.parts.push({ kind: "bee", x: sx, y: sy, vx: U.rand(-120, 120), vy: U.rand(-120, 120), grav: 0, life: 2.5, max: 2.5, ph: U.rand(9) });
      if (p.points) { score(p.points, sx, sy - 30, "Bonus"); G.stats.bonus++; A.sfx("bonus"); A.say("Bonus!", { gap: 2000 }); }
    } else if (repeatOk) {
      p.cool = p.repeat;
      if (p.points) { score(p.points, sx, sy - 30, "Bonus"); G.stats.bonus++; A.sfx("bonus"); }
    }
  }
  function moverHit(sx, sy) {
    const L = G.L;
    if (G.balloon && !G.balloon.popped) {
      const b = G.balloon, x = toScreen(1, b.x), s = 0.7;
      if (Math.hypot((sx - x) / (62 * s), (sy - (b.y - 110 * s)) / (74 * s)) < 1) {
        b.popped = true; A.sfx("pop"); score(PTS.balloon, sx, sy - 30);
        G.stats.bonus++;
        for (let i = 0; i < 12; i++) G.parts.push({ kind: "dust", x: sx, y: sy, vx: U.rand(-200, 200), vy: U.rand(-200, 100), grav: 300, life: 0.6, max: 0.6, r: 5, col: i % 2 ? "#e84a3a" : "#ffd23a" });
        G.birds.push({ kind: "chute", l: 1, x: b.x, y: b.y - 10, t: 0, s: SCALE[1] * 0.9, skin: L.skin, dir: 1 });
        return true;
      }
    }
    if (G.boat && G.boat.hasBird) {
      const bt = G.boat, x = toScreen(1, bt.x), s = SCALE[1];
      if (Math.abs(sx - x) < 34 && sy > bt.y - 70 && sy < bt.y - 10) {
        bt.hasBird = false; bt.birdT = 10; G.hits++; G.stats.special++;
        score(PTS.boat, sx, sy - 30); feathers(sx, sy, s, L.skin); A.sfx("squawk");
        G.birds.push({ kind: "fly", l: 1, x: bt.x, y: bt.y - 40, s, dead: true, vy: -160, vx: 30, rot: 0, vr: 5, skin: L.skin, t: 0 });
        return true;
      }
    }
    if (G.gondolas) {
      const cy = L.movers.gondolas.y;
      for (const g of G.gondolas) {
        if (!g.bird || g.bird.t < 0.2) continue;
        const x = toScreen(1, g.x);
        if (Math.abs(sx - x) < 24 && sy > cy + 30 && sy < cy + 60) {
          g.bird = null; g.birdT = U.rand(4, 8); G.hits++; G.stats.special++;
          score(PTS.gondola, sx, sy - 30); feathers(sx, sy, 0.5, L.skin); A.sfx("squawk");
          G.birds.push({ kind: "fly", l: 1, x: g.x, y: cy + 44, s: 0.45, dead: true, vy: -100, vx: 0, rot: 0, vr: 5, skin: L.skin, t: 0 });
          return true;
        }
      }
    }
    return false;
  }
  function skyHit(sx, sy) {
    if (G.plane && !G.plane.hit) {
      const p = G.plane, x = toScreen(0, p.x), s = 0.6;
      const bx0 = x + (p.dir > 0 ? -370 : 40) * s, bx1 = x + (p.dir > 0 ? 70 : 370) * s;
      if (sx > Math.min(bx0, bx1) && sx < Math.max(bx0, bx1) && Math.abs(sy - p.y) < 34) {
        p.hit = true; A.sfx("sputter"); score(PTS.plane, sx, sy - 30, "Plane"); G.stats.bonus++; A.say("Bonus!", { gap: 2000 });
        return true;
      }
    }
    if (G.star) {
      const s = G.star, x = toScreen(0, s.x);
      if (Math.hypot(sx - x, sy - s.y) < 40) { G.star = null; A.sfx("chime"); score(PTS.star, sx, sy - 30, "Star"); G.stats.bonus++; return true; }
    }
    return false;
  }

  /* ---------- input during a round ---------- */
  G.input = function (dt) {
    const m = I.mouse;
    // arrow keys and D-pad move the crosshair smoothly
    let kx = 0, ky = 0;
    if (I.held("left")) kx -= 1; if (I.held("right")) kx += 1; if (I.held("up")) ky -= 1; if (I.held("down")) ky += 1;
    if (kx || ky) { m.x = U.clamp(m.x + kx * 720 * dt, 0, W); m.y = U.clamp(m.y + ky * 720 * dt, 0, H); I.lastDevice = I.lastDevice === "pad" ? "pad" : "keyboard"; }
    if (I.hit("reload") || m.rclicked) G.reload();
    if (m.clicked) {
      // touch: the ammo box reloads, the arrows at the edges scroll
      if (I.touch && m.x > W - 330 && m.y > H - 110) { G.reload(); return; }
      if (I.touch && (m.x < 70 || m.x > W - 70)) return;
      G.shoot(m.x, m.y);
    }
  };

  /* ---------- drawing ---------- */
  function drawBird(c, b, sx) {
    c.save();
    c.translate(sx, b.y);
    if (b.dead) c.rotate(b.rot);
    c.scale(b.s * (b.dir < 0 && !b.dead ? -1 : 1), b.s);
    if (b.fade) c.globalAlpha = Math.max(0, 1 - b.fade / 1.6);
    const pose = b.dead ? "dead" : b.kind === "walk" ? (b.vx ? "walk" : "sit") : b.kind === "peek" ? "sit" : b.kind === "chute" ? "glide" : "fly";
    if (b.kind === "chute" && !b.dead) S.parachute(c, b.t);
    S.grouse(c, { t: b.t, pose, skin: b.skin, look: b.kind === "peek" ? "scared" : null });
    c.restore();
  }
  function drawProp(c, p, t) {
    const x0 = off(p.layer);
    c.save(); c.translate(-x0, 0);
    if (p.ps) { c.translate(p.x, p.y); c.scale(p.ps, p.ps); c.translate(-p.x, -p.y); }
    if (p.kind === "peek") FF.COVER[p.cover](c, p);
    else if (p.kind === "bonus") FF.BONUS_DRAW[p.type](c, p, t);
    else if (p.kind === "flush") FF.FLUSH_DRAW[p.type](c, p, t);
    else if (p.kind === "critter") { c.translate(p.x, p.y); c.scale((p.dir || 1) * SCALE[p.layer] / 0.58, SCALE[p.layer] / 0.58); S.critter(c, p.animal, t, { hit: p.hit }); }
    c.restore();
  }
  function visible(l, x, m = 300) { const sx = toScreen(l, x); return sx > -m && sx < W + m; }

  G.drawWorld = function (c) {
    const L = G.L, t = G.t;
    L.sky(c, t, G.cam);
    for (let l = 0; l < 3; l++) {
      // the painted layer
      c.drawImage(G.pics[l], Math.round(off(l)), 0, W, H, 0, 0, W, H);
      // movers behind this layer's birds
      if (l === 0) {
        if (G.star) { c.save(); c.translate(toScreen(0, G.star.x), G.star.y); S.star(c, G.star.t); c.restore(); }
        if (G.plane) { const p = G.plane; c.save(); c.translate(toScreen(0, p.x), p.y); c.scale(0.6 * p.dir, 0.6); if (p.dir < 0) { /* banner text must stay readable */ } S.plane(c, p.t, null, { smoke: p.hit }); c.restore(); drawBanner(c, p); }
      }
      if (l === 1) {
        if (G.balloon) { const b = G.balloon; c.save(); c.translate(toScreen(1, b.x), b.y); c.scale(0.7, 0.7); c.rotate(Math.sin(b.t) * 0.03); S.balloon(c, b.t, b.popped); if (!b.popped) { c.save(); c.beginPath(); c.rect(-40, -60, 80, 46); c.clip(); c.translate(0, -24); c.scale(0.36, 0.36); S.grouse(c, { t: b.t, pose: "sit", skin: L.skin }); c.restore(); } c.restore(); }
        if (G.gondolas) { const cy = L.movers.gondolas.y; for (const g of G.gondolas) { if (!visible(1, g.x)) continue; c.save(); c.translate(toScreen(1, g.x), cy + 60); c.scale(0.8, 0.8); if (g.bird) { const k = Math.min(1, g.bird.t / 0.25, (g.bird.stay - g.bird.t) / 0.25); c.save(); c.beginPath(); c.rect(-22, -28, 44, 20); c.clip(); c.translate(0, -2 - k * 18); c.scale(0.5, 0.5); S.grouse(c, { t: g.bird.t, pose: "sit", skin: L.skin, look: "scared" }); c.restore(); } S.gondola(c, t); c.restore(); } }
      }
      // props behind the birds (bonus objects, trees, animals)
      for (const p of G.props) if (p.layer === l && p.kind !== "peek" && visible(l, p.x, 400)) drawProp(c, p, t);
      // birds of this layer
      for (const b of G.birds) {
        if (b.l !== l) continue;
        const sx = toScreen(l, b.x);
        if (sx < -200 || sx > W + 200) continue;
        if (b.kind === "peek" && b.prop.clip) {
          const p = b.prop, [cx, cy, cw, ch] = p.clip;
          c.save(); c.beginPath(); c.rect(toScreen(l, p.x) + cx, p.y + cy, cw, ch); c.clip(); drawBird(c, b, sx); c.restore();
        } else drawBird(c, b, sx);
      }
      if (l === 1 && G.boat) { const bt = G.boat; c.save(); c.translate(toScreen(1, bt.x), bt.y); c.scale(bt.dir * 0.8, 0.8); if (bt.hasBird) { c.save(); c.translate(-6, -46); c.scale(0.55, 0.55); S.grouse(c, { t: bt.t, pose: "sit", skin: L.skin }); c.restore(); } S.boat(c, bt.t); c.restore(); }
      // covers in front of the peeking birds
      for (const p of G.props) if (p.layer === l && p.kind === "peek" && visible(l, p.x)) drawProp(c, p, t);
    }
    // the close fly-by
    if (G.flyby) { const f = G.flyby; c.save(); c.translate(f.x, f.y); c.scale(2.4 * f.dir, 2.4); S.grouse(c, { t: f.t * 1.5, pose: "fly", skin: L.skin }); c.restore(); }
    // particles
    for (const p of G.parts) {
      const a = U.clamp(p.life / p.max, 0, 1);
      c.globalAlpha = Math.min(1, a * 2);
      if (p.kind === "feather") S.feather(c, p.x, p.y, p.a, p.s, p.col);
      else if (p.kind === "dust" || p.kind === "drop") D.circle(c, p.x, p.y, p.r * (0.5 + a * 0.5), p.kind === "drop" ? "rgba(200,230,255,0.9)" : p.col, null, 0);
      else if (p.kind === "leaf") { c.save(); c.translate(p.x, p.y); c.rotate(p.a); D.ellipse(c, 0, 0, p.r, p.r * 0.5, p.col, null, 0); c.restore(); }
      else if (p.kind === "smoke") D.circle(c, toScreen(0, p.x), p.y, p.r * (2 - a), "rgba(80,80,80,0.5)", null, 0);
      else if (p.kind === "ring") { c.beginPath(); c.arc(p.x, p.y, 10 + (1 - a) * 24, 0, U.TAU); c.lineWidth = 3; c.strokeStyle = "rgba(255,240,180,0.9)"; c.stroke(); }
      else if (p.kind === "hat") { c.save(); c.translate(p.x, p.y); c.rotate(p.a); D.ellipse(c, 0, 10, 40, 8, "#7a5a2a", D.OUT, 2); D.rr(c, -22, -16, 44, 28, 6, "#7a5a2a", D.OUT, 2); c.restore(); }
      else if (p.kind === "helmet") { c.save(); c.translate(p.x, p.y); c.rotate(p.a); D.rr(c, -20, -21, 40, 42, 16, "#c8d0dc", D.OUT, 2.5); c.restore(); }
      else if (p.kind === "snowhead") { D.circle(c, p.x, p.y, 24, "#f8fbff", "#b8c6d8", 2); }
      else if (p.kind === "bee") { const x = p.x + Math.sin(G.t * 9 + p.ph) * 14; D.ellipse(c, x, p.y, 5, 3.5, "#e8b030", D.OUT, 1); }
      c.globalAlpha = 1;
    }
    // weather
    for (const w of G.weather) {
      if (L.weather === "snow") D.circle(c, w.x, w.y, w.r, "rgba(255,255,255,0.85)", null, 0);
      else { c.save(); c.translate(w.x, w.y); c.rotate(w.ph); D.ellipse(c, 0, 0, w.r, w.r * 0.5, w.col, null, 0); c.restore(); }
    }
    if (L.night) drawDark(c);
    for (const tx of G.texts) { c.globalAlpha = U.clamp(1.3 - tx.t, 0, 1); D.text(c, tx.s, tx.x, tx.y - tx.t * 50, 30, tx.col); c.globalAlpha = 1; }
  };
  function drawBanner(c, p) {
    const sx = toScreen(0, p.x), s = 0.6, bw = 260 * s;
    const bx = sx - p.dir * (100 * s + bw / 2);
    D.line(c, sx - p.dir * 36 * s, p.y, bx + p.dir * bw / 2, p.y, "#444", 1.5);
    c.beginPath(); c.moveTo(bx - bw / 2, p.y - 11);
    for (let x = -bw / 2; x <= bw / 2; x += 10) c.lineTo(bx + x, p.y - 11 + Math.sin(p.t * 8 + x * 0.06) * 3);
    for (let x = bw / 2; x >= -bw / 2; x -= 10) c.lineTo(bx + x, p.y + 11 + Math.sin(p.t * 8 + x * 0.06) * 3);
    c.closePath(); c.fillStyle = "#fffbe8"; c.fill(); c.lineWidth = 1.5; c.strokeStyle = D.OUT; c.stroke();
    D.text(c, G.L.movers.plane, bx, p.y + 1, 14, "#b02a2a", "center", { outline: false });
  }
  // night: everything dark except the lamp at the crosshair, lit lanterns and the glowing eyes
  let dark = null;
  function drawDark(c) {
    if (!dark) { dark = document.createElement("canvas"); dark.width = W; dark.height = H; }
    const d = dark.getContext("2d");
    d.globalCompositeOperation = "source-over";
    d.clearRect(0, 0, W, H);
    d.fillStyle = "rgba(4,6,20,0.9)"; d.fillRect(0, 0, W, H);
    d.globalCompositeOperation = "destination-out";
    const hole = (x, y, r) => { const g = d.createRadialGradient(x, y, r * 0.3, x, y, r); g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(1, "rgba(0,0,0,0)"); d.fillStyle = g; d.beginPath(); d.arc(x, y, r, 0, U.TAU); d.fill(); };
    hole(I.mouse.x, I.mouse.y, 190);
    hole(980, 120, 150);
    for (const p of G.props) if (p.lamp && p.lit > 0) hole(toScreen(p.layer, p.x + 34), p.y - 120, 280 * Math.min(1, p.lit));
    if (G.flash > 0) { d.fillStyle = `rgba(0,0,0,${G.flash * 0.6})`; d.fillRect(0, 0, W, H); }
    c.drawImage(dark, 0, 0);
    // glowing eyes in the dark
    for (const b of G.birds) {
      if (b.dead) continue;
      const sx = toScreen(b.l, b.x);
      if (sx < -50 || sx > W + 50) continue;
      if (b.kind === "peek" && b.y > b.y1 + 10) continue;
      const ex = sx + b.dir * 34 * b.s, ey = b.y - 24 * b.s, r = Math.max(1.5, 3 * b.s);
      c.fillStyle = "rgba(255,230,80,0.9)";
      c.beginPath(); c.arc(ex - b.dir * 5 * b.s, ey, r, 0, U.TAU); c.arc(ex + b.dir * 6 * b.s, ey, r, 0, U.TAU); c.fill();
    }
  }

  G.drawHud = function (c) {
    const L = G.L, m = I.mouse;
    // score
    D.rr(c, 14, 12, 250, 62, 14, "rgba(30,20,10,0.55)", null, 0);
    c.save(); c.translate(52, 43); c.scale(0.38, 0.38); S.grouse(c, { t: G.t, pose: "glide", skin: L.skin === "white" ? "brown" : L.skin }); c.restore();
    D.text(c, U.fmt(G.score), 160, 46, 40, "#fff6dc");
    // time
    const tl = Math.ceil(G.time), low = G.time <= 10 && !G.over;
    D.rr(c, W - 196, 12, 182, 62, 14, low ? "rgba(140,20,10,0.7)" : "rgba(30,20,10,0.55)", null, 0);
    D.circle(c, W - 160, 43, 20, "#fff6dc", D.OUT, 2.5);
    const a = -Math.PI / 2 + (1 - G.time / ROUND) * U.TAU;
    D.line(c, W - 160, 43, W - 160 + Math.cos(a) * 14, 43 + Math.sin(a) * 14, "#c8302a", 3);
    D.text(c, `${Math.floor(tl / 60)}:${String(tl % 60).padStart(2, "0")}`, W - 82, 46, 38, low && Math.sin(G.t * 10) > 0 ? "#ffd23a" : "#fff6dc");
    // ammo
    D.rr(c, W - 330, H - 96, 316, 84, 14, "rgba(30,20,10,0.55)", null, 0);
    for (let i = 0; i < MAG; i++) D.shell(c, W - 300 + i * 37, H - 62, 1, i >= G.ammo);
    if (G.reloading) D.text(c, "Reloading…", W - 172, H - 110, 20, "#fff6dc");
    else if (G.ammo === 0 && !G.over) D.text(c, I.touch ? "Tap here to reload" : I.pad.connected ? "Reload: B / X" : "Reload: right click or R", W - 172, H - 110, 20, Math.sin(G.t * 10) > 0 ? "#ffd23a" : "#fff6dc");
    // panorama bar
    const bw = 300, bx = W / 2 - bw / 2, by = H - 26;
    D.rr(c, bx, by, bw, 12, 6, "rgba(30,20,10,0.5)", null, 0);
    const vw = bw * (W / (W + RANGE));
    D.rr(c, bx + (bw - vw) * (G.cam / RANGE), by, vw, 12, 6, "rgba(255,246,220,0.85)", null, 0);
    D.text(c, L.name, 24, H - 26, 22, "#fff6dc", "left");
    // touch arrows at the edges
    if (I.touch) for (const s of [-1, 1]) { const x = s < 0 ? 30 : W - 30; c.globalAlpha = 0.5; D.poly(c, [x - s * 12, H / 2 - 30, x + s * 14, H / 2, x - s * 12, H / 2 + 30], "#fff6dc", D.OUT, 2); c.globalAlpha = 1; }
    // countdown and end
    if (G.countdown > 0) {
      const n = Math.ceil(G.countdown - 0.4);
      D.text(c, n > 0 ? String(n) : "GO!", W / 2, H / 2 - 40, 120, "#ffe24a");
      D.text(c, L.name, W / 2, H / 2 + 50, 40, "#fff6dc");
    }
    if (G.over) D.text(c, "Time's up!", W / 2, H / 2 - 20, 96, "#ffe24a");
    // crosshair
    if (G.flash > 0.5) D.circle(c, m.x, m.y, 30 * G.flash, "rgba(255,240,180,0.5)", null, 0);
    D.crosshair(c, m.x, m.y, 1, G.t, G.L.night ? "#ffe680" : "#fff");
  };
})(window.FF);
