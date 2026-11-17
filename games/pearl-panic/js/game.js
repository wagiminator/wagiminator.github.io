/* Pearl Panic: one level – pearl chains rolling along their tracks, the pufferfish's shots,
   inserting, matching three or more, magnetic chain reactions, power pearls, coins and the clam */
"use strict";

(function (PP) {
  const { U } = PP;
  const G = (PP.G = { on: null });
  const emit = (t, d) => { if (G.on) G.on(t, d); };
  const D = (G.D = 34);           // pearl diameter
  const SHOT = 1150;              // shot speed
  const PULL = 520;               // magnetic pull speed
  G.COLORS = ["#ff5a6a", "#ffa63a", "#ffe04a", "#5ad46a", "#4aa8ff", "#b77aff"];
  G.POWERS = ["slow", "back", "aim", "bomb"];

  /* ---------- a track: a curve sampled every 2 px ---------- */
  function makeTrack(pts) {
    const xs = [], ys = [];
    let acc = 0, px = pts[0][0], py = pts[0][1];
    xs.push(px); ys.push(py);
    for (let i = 1; i < pts.length; i++) {
      const [x, y] = pts[i];
      let seg = Math.hypot(x - px, y - py);
      while (acc + seg >= 2) {
        const t = (2 - acc) / seg;
        px += (x - px) * t; py += (y - py) * t;
        xs.push(px); ys.push(py);
        seg = Math.hypot(x - px, y - py); acc = 0;
      }
      acc += seg; px = x; py = y;
    }
    return { xs: Float32Array.from(xs), ys: Float32Array.from(ys), len: (xs.length - 1) * 2 };
  }
  G.pos = function (tr, d) {
    const p = tr.path, f = U.clamp(d, 0, p.len) / 2, i = Math.min(p.xs.length - 2, Math.floor(f)), t = f - i;
    return { x: p.xs[i] + (p.xs[i + 1] - p.xs[i]) * t, y: p.ys[i] + (p.ys[i + 1] - p.ys[i]) * t, a: Math.atan2(p.ys[i + 1] - p.ys[i], p.xs[i + 1] - p.xs[i]) };
  };

  /* ---------- level ---------- */
  G.start = function (idx, keep) {
    const lv = PP.LEVELS[idx];
    const s = {
      idx, lv, world: PP.WORLDS[lv.world], tracks: [], shots: [], fx: [], texts: [], coins: [],
      score: keep ? keep.score : 0, lives: keep ? keep.lives : 3, deaths: keep ? keep.deaths || 0 : 0, combo: 0, streak: 0,
      slowT: 0, backT: 0, aimT: 0, t: 0, over: null, dying: null, coinT: U.rand(12, 20), cleared: false, danger: 0,
      shooter: { x: lv.shooter[0], y: lv.shooter[1], ang: -Math.PI / 2, cur: 0, next: 0, kick: 0, cool: 0 },
    };
    for (const tdef of lv.tracks) {
      const path = makeTrack(tdef.pts());
      s.tracks.push({ path, balls: [], spawned: 0, quota: tdef.count, rush: 1, done: false, end: G.pos({ path }, path.len) });
    }
    s.rng = U.rng(idx * 977 + (keep ? keep.lives * 13 : 0) + 7);
    G.s = s;
    s.shooter.cur = pickColor(s); s.shooter.next = pickColor(s);
    return s;
  };

  // colours still on the board (all colours before the chains arrive)
  function present(s) {
    const set = new Set();
    for (const tr of s.tracks) for (const b of tr.balls) set.add(b.c);
    return set;
  }
  function pickColor(s) {
    const set = present(s);
    const list = set.size ? [...set] : [...Array(s.lv.colors).keys()];
    return list[Math.floor(Math.random() * list.length)];
  }
  function newBall(s, tr) {
    // pearls often come in pairs, but never three of a kind
    let c = Math.floor(s.rng() * s.lv.colors);
    const b0 = tr.balls[0], b1 = tr.balls[1];
    if (b0 && !(b1 && b1.c === b0.c) && s.rng() < 0.42) c = b0.c;
    if (b0 && b1 && b0.c === c && b1.c === c) c = (c + 1 + Math.floor(s.rng() * (s.lv.colors - 1))) % s.lv.colors;
    const power = s.rng() < s.lv.powers && tr.spawned > 8 ? G.POWERS[Math.floor(s.rng() * G.POWERS.length)] : null;
    return { c, d: 0, vd: 0, power, roll: 0, ins: 0 };
  }

  /* ---------- the step ---------- */
  G.update = function (dt) {
    const s = G.s;
    s.t += dt;
    for (const x of s.texts) { x.t += dt; x.y -= 30 * dt; }
    s.texts = s.texts.filter((x) => x.t < 1.4);
    updateFx(s, dt);
    if (s.over) return;
    if (s.dying) { dying(s, dt); return; }
    s.slowT = Math.max(0, s.slowT - dt); s.backT = Math.max(0, s.backT - dt); s.aimT = Math.max(0, s.aimT - dt);
    const sh = s.shooter;
    sh.kick = Math.max(0, sh.kick - dt * 5); sh.cool = Math.max(0, sh.cool - dt);
    let danger = 0;
    for (const tr of s.tracks) {
      updateTrack(s, tr, dt);
      if (tr.balls.length) danger = Math.max(danger, tr.balls[tr.balls.length - 1].d / tr.path.len);
      if (!s.dying && tr.balls.length && tr.balls[tr.balls.length - 1].d >= tr.path.len - D * 0.3) { startDying(s, tr); return; }
    }
    s.danger = danger;
    updateShots(s, dt);
    updateCoins(s, dt);
    // the shooter only offers colours that are still in play
    const set = present(s);
    if (set.size) {
      if (!set.has(sh.cur)) sh.cur = pickColor(s);
      if (!set.has(sh.next)) sh.next = pickColor(s);
    }
    // cleared?
    if (s.tracks.every((tr) => tr.spawned >= tr.quota && !tr.balls.length) && !s.shots.length) {
      const q = s.tracks.reduce((a, tr) => a + tr.quota, 0), par = G.par(s.lv);
      const o = { win: true, time: s.t, par, ace: s.t <= par, clearBonus: 1000, timeBonus: Math.max(0, Math.round(par - s.t)) * 50, perfect: !s.deaths, q };
      o.perfectBonus = o.perfect ? 1000 : 0;
      s.score += o.clearBonus + o.timeBonus + o.perfectBonus;
      o.stars = 1 + (o.perfect ? 1 : 0) + (o.ace ? 1 : 0);
      s.over = o;
      emit("clear", o);
    }
  };

  function segments(tr) {
    const b = tr.balls, segs = [];
    let start = 0;
    for (let i = 1; i <= b.length; i++) {
      if (i === b.length || b[i].d - b[i - 1].d > D + 0.5) { segs.push([start, i - 1]); start = i; }
    }
    return segs;
  }

  function updateTrack(s, tr, dt) {
    const b = tr.balls;
    // feed new pearls in at the start of the track
    while (tr.spawned < tr.quota && (!b.length || b[0].d >= 0)) {
      const nb = newBall(s, tr);
      nb.d = b.length ? Math.min(b[0].d - D, 0) : -D * 0.2; nb.vd = nb.d;
      b.unshift(nb); tr.spawned++;
    }
    // the rush at the start: pearls stream in fast until a fifth of the track is filled
    if (tr.rush && b.length && b[b.length - 1].d > tr.path.len * 0.22) tr.rush = 0;
    let v = s.lv.speed * (1 + s.idx * 0.004);
    if (tr.rush) v = 420;
    else {
      if (s.slowT > 0) v *= 0.35;
      // slower near the clam gives a last chance
      const front = b.length ? b[b.length - 1].d / tr.path.len : 0;
      if (front > 0.85) v *= 0.6;
      if (s.backT > 0) v = -s.lv.speed * 2.2;
    }
    const segs = segments(tr);
    // the rear segment is pushed (or pulled back)
    if (segs.length) {
      const [a, z] = segs[0];
      let mv = v * dt;
      if (mv < 0) mv = Math.max(mv, -b[a].d - D * 2);
      for (let i = a; i <= z; i++) b[i].d += mv;
    }
    // magnets: a segment slides back when the colours at both sides of the gap match
    for (let k = 1; k < segs.length; k++) {
      const [a, z] = segs[k], prev = segs[k - 1][1];
      if (b[prev].c !== b[a].c || b[prev].pop || b[a].pop) continue;
      const gap = b[a].d - b[prev].d - D;
      const mv = Math.min(gap, PULL * dt);
      for (let i = a; i <= z; i++) b[i].d -= mv;
      if (gap - mv <= 0.5) {
        for (let i = a; i <= z; i++) b[i].d -= gap - mv;
        emit("clack");
        checkMatch(s, tr, a, true);
        return updateTrackTail(s, tr, dt);
      }
    }
    updateTrackTail(s, tr, dt);
  }
  function updateTrackTail(s, tr, dt) {
    const b = tr.balls;
    // contact pushes the pearls ahead
    for (let i = 1; i < b.length; i++) if (b[i].d < b[i - 1].d + D) b[i].d = b[i - 1].d + D;
    for (const q of b) {
      const old = q.vd;
      q.vd += (q.d - q.vd) * Math.min(1, dt * 16);
      q.roll += (q.vd - old) / (D / 2);
      if (q.ins > 0) q.ins = Math.max(0, q.ins - dt * 7);
    }
  }

  /* ---------- matching ---------- */
  function checkMatch(s, tr, i, fromChain) {
    const b = tr.balls;
    if (i < 0 || i >= b.length) return false;
    const c = b[i].c;
    let a = i, z = i;
    while (a > 0 && b[a - 1].c === c && b[a].d - b[a - 1].d <= D + 0.5) a--;
    while (z < b.length - 1 && b[z + 1].c === c && b[z + 1].d - b[z].d <= D + 0.5) z++;
    const n = z - a + 1;
    if (n < 3) { if (!fromChain) s.combo = 0; return false; }
    if (fromChain) s.combo++; else s.combo = 0;
    const removed = b.splice(a, n);
    let pts = n * 10 * (1 + s.combo) + (s.combo ? 100 * s.combo : 0) + Math.max(0, n - 3) * 20;
    const mid = G.pos(tr, removed[Math.floor(n / 2)].vd);
    for (const q of removed) {
      const p = G.pos(tr, q.vd);
      popFx(s, p.x, p.y, G.COLORS[q.c]);
      if (q.power) power(s, q.power, p);
    }
    s.streak++;
    if (s.streak >= 4 && !fromChain) pts += s.streak * 20;
    addScore(s, pts, mid.x, mid.y - 20, s.combo ? `COMBO ×${s.combo + 1}` : null);
    emit("pop", { n, combo: s.combo });
    return true;
  }
  function addScore(s, pts, x, y, label) {
    const before = Math.floor(s.score / 10000);
    s.score += pts;
    s.texts.push({ x, y, text: "+" + pts, t: 0, col: "#fff" });
    if (label) s.texts.push({ x, y: y - 26, text: label, t: 0, col: "#ffd65a", big: true });
    if (Math.floor(s.score / 10000) > before) { s.lives++; emit("life"); s.texts.push({ x: 640, y: 300, text: "Extra life!", t: 0, col: "#7dffb0", big: true }); }
  }
  function power(s, kind, p) {
    emit("power", kind);
    if (kind === "slow") s.slowT = 7;
    else if (kind === "back") s.backT = 2.6;
    else if (kind === "aim") s.aimT = 12;
    else if (kind === "bomb") {
      // blast nearby pearls on every track
      let n = 0;
      for (const tr of s.tracks) {
        for (let i = tr.balls.length - 1; i >= 0; i--) {
          const q = tr.balls[i], qp = G.pos(tr, q.vd);
          if (Math.hypot(qp.x - p.x, qp.y - p.y) < 95) { tr.balls.splice(i, 1); popFx(s, qp.x, qp.y, G.COLORS[q.c]); n++; }
        }
      }
      s.fx.push({ k: "ring", x: p.x, y: p.y, t: 0, life: 0.6, col: "#fff2b0" });
      if (n) addScore(s, n * 10, p.x, p.y - 40, null);
    }
  }

  /* ---------- shooting ---------- */
  G.aimAt = function (x, y) { const sh = G.s.shooter; sh.ang = Math.atan2(y - sh.y, x - sh.x); };
  G.turn = function (d) { G.s.shooter.ang += d; };
  G.swap = function () {
    const s = G.s, sh = s.shooter;
    if (s.over || s.dying) return;
    [sh.cur, sh.next] = [sh.next, sh.cur];
    emit("swap");
  };
  G.fire = function () {
    const s = G.s, sh = s.shooter;
    if (s.over || s.dying || sh.cool > 0) return false;
    const fast = s.aimT > 0 ? 1.6 : 1;
    s.shots.push({ c: sh.cur, x: sh.x + Math.cos(sh.ang) * 30, y: sh.y + Math.sin(sh.ang) * 30, vx: Math.cos(sh.ang) * SHOT * fast, vy: Math.sin(sh.ang) * SHOT * fast, gap: false });
    sh.cur = sh.next; sh.next = pickColor(s);
    sh.kick = 1; sh.cool = 0.16;
    emit("shoot");
    return true;
  };
  function updateShots(s, dt) {
    for (const sh of s.shots) {
      const steps = Math.ceil((Math.hypot(sh.vx, sh.vy) * dt) / 6);
      for (let k = 0; k < steps && !sh.gone; k++) {
        sh.x += (sh.vx * dt) / steps; sh.y += (sh.vy * dt) / steps;
        // coins are collected on the way
        for (const cn of s.coins) if (!cn.got && Math.hypot(cn.x - sh.x, cn.y - sh.y) < 28) { cn.got = true; addScore(s, 300, cn.x, cn.y - 20, "Treasure!"); emit("coin"); }
        hitChain(s, sh);
      }
      if (sh.x < -60 || sh.x > PP.U.W + 60 || sh.y < -60 || sh.y > PP.U.H + 60) { sh.gone = true; s.streak = 0; }
    }
    s.shots = s.shots.filter((x) => !x.gone);
  }
  function hitChain(s, sh) {
    for (const tr of s.tracks) {
      const b = tr.balls;
      for (let i = 0; i < b.length; i++) {
        if (b[i].vd < 4) continue;
        const p = G.pos(tr, b[i].vd);
        if (Math.hypot(p.x - sh.x, p.y - sh.y) > D * 0.92) continue;
        // insert ahead of or behind the pearl that was hit
        const ahead = (sh.x - p.x) * Math.cos(p.a) + (sh.y - p.y) * Math.sin(p.a) > 0;
        const idx = ahead ? i + 1 : i;
        const d = ahead ? b[i].d + D : b[i].d;
        const nb = { c: sh.c, d, vd: d, power: null, roll: 0, ins: 1, fromX: sh.x, fromY: sh.y };
        b.splice(idx, 0, nb);
        for (let j = idx + 1; j < b.length; j++) if (b[j].d < b[j - 1].d + D) b[j].d = b[j - 1].d + D; else break;
        sh.gone = true;
        emit("insert");
        if (!checkMatch(s, tr, idx, false)) s.streak = 0;
        return;
      }
    }
  }

  /* ---------- coins ---------- */
  function updateCoins(s, dt) {
    s.coinT -= dt;
    if (s.coinT <= 0) {
      s.coinT = U.rand(18, 30);
      for (let k = 0; k < 20; k++) {
        const x = U.rand(120, PP.U.W - 120), y = U.rand(110, PP.U.H - 90);
        if (Math.hypot(x - s.shooter.x, y - s.shooter.y) < 120) continue;
        s.coins.push({ x, y, t: 0, life: 7 });
        break;
      }
    }
    for (const c of s.coins) c.t += dt;
    s.coins = s.coins.filter((c) => !c.got && c.t < c.life);
  }

  /* ---------- the clam swallows the chain ---------- */
  function startDying(s, tr) {
    s.dying = { tr, t: 0 };
    s.shots = [];
    emit("dying");
  }
  function dying(s, dt) {
    const dd = s.dying;
    dd.t += dt;
    for (const tr of s.tracks) {
      for (const q of tr.balls) { q.d += 900 * dt; q.vd = q.d; q.roll += (900 * dt) / (D / 2); }
      tr.balls = tr.balls.filter((q) => q.d < tr.path.len);
    }
    if (dd.t > 2.2 || s.tracks.every((tr) => !tr.balls.length) && dd.t > 1) {
      s.lives--;
      s.over = { win: false, lifeLost: true, out: s.lives <= 0 };
      emit("lost", s.over);
    }
  }

  /* ---------- effects ---------- */
  function popFx(s, x, y, col) {
    for (let i = 0; i < 7; i++) {
      const a = U.rand(U.TAU), v = U.rand(60, 220);
      s.fx.push({ k: "bit", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: U.rand(0.35, 0.7), col, r: U.rand(2, 5) });
    }
    s.fx.push({ k: "ring", x, y, t: 0, life: 0.35, col });
    s.fx.push({ k: "bubble", x, y, vx: U.rand(-10, 10), vy: -60, t: 0, life: 1.2, r: U.rand(3, 6) });
  }
  function updateFx(s, dt) {
    for (const p of s.fx) { p.t += dt; if (p.vx !== undefined) { p.x += p.vx * dt; p.y += p.vy * dt; if (p.k === "bit") { p.vx *= 0.92; p.vy *= 0.92; } } }
    s.fx = s.fx.filter((p) => p.t < p.life);
    if (s.fx.length > 400) s.fx.splice(0, s.fx.length - 400);
  }
  // the first pearl along a ray (for the aiming guide)
  G.ray = function (x, y, ang) {
    const s = G.s, dx = Math.cos(ang), dy = Math.sin(ang), r = D * 0.92;
    let best = Infinity, hit = null;
    for (const tr of s.tracks) for (const q of tr.balls) {
      if (q.vd < 4) continue;
      const p = G.pos(tr, q.vd), px = p.x - x, py = p.y - y, t = px * dx + py * dy;
      if (t < 0) continue;
      const perp = Math.abs(px * dy - py * dx);
      if (perp > r) continue;
      const th = t - Math.sqrt(r * r - perp * perp);
      if (th < best) { best = th; hit = q; }
    }
    if (!hit) {
      // to the edge of the screen
      const tx = dx > 0 ? (U.W - x) / dx : dx < 0 ? -x / dx : Infinity, ty = dy > 0 ? (U.H - y) / dy : dy < 0 ? -y / dy : Infinity;
      best = Math.min(tx, ty);
    }
    return { x: x + dx * best, y: y + dy * best, d: best, hit };
  };
  G.par = (lv) => Math.round(30 + lv.tracks.reduce((a, t) => a + t.count, 0) * 0.9);
  G.progress = function () {
    const s = G.s;
    let sp = 0, q = 0;
    for (const tr of s.tracks) { sp += tr.spawned; q += tr.quota; }
    return sp / q;
  };
})(window.PP);
