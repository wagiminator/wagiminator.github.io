/* Ironfall: the five bosses – Iron Fist, Crystal Widow, Hive Mind, Titan Walker and the Overmind */
"use strict";

(function (XA) {
  const { U, Gfx, Fx, G } = XA;
  const A = XA.Audio;
  const W = U.W, H = U.H, TAU = U.TAU, T = XA.Theme.T;
  const { lin, rad, circ, poly, rr } = Gfx;
  const B = (XA.Bosses = {});
  const player = () => G.player;

  /* ---------- Base ---------- */
  function base(o, arena) {
    const b = Object.assign({
      x: arena.x1 - 300, y: arena.floor - 200, hp: 500, t: 0, st: 0, state: "enter", entered: false, flash: 0,
      dying: 0, dead: false, parts: [], waves: [], beams: [], score: 20000, vulnMul: 1, a: arena, timers: [],
    }, o);
    b.later = (d, fn) => b.timers.push({ d, fn });
    b.maxHp = b.hp;
    b.hitTest = function (x, y, r) {
      if (!b.entered || b.dying) return null;
      let res = null;
      for (const p of b.parts) {
        if (U.dist2(x, y, p.x, p.y) < (p.r + r) * (p.r + r)) { if (p.weak && !p.closed) return "weak"; res = "armor"; }
      }
      return res;
    };
    b.damage = function (dmg, x, y) {
      if (!b.entered || b.dying) return;
      const part = b.parts.find((p) => p.weak && !p.closed && U.dist2(x, y, p.x, p.y) < (p.r + 20) ** 2);
      if (part && part.hp !== undefined) { part.hp -= dmg; part.flash = 0.08; if (part.hp <= 0 && b.onPartDestroyed) b.onPartDestroyed(part); return; }
      b.hp -= dmg * b.vulnMul;
      b.flash = 0.08;
      if (b.hp <= 0) { b.hp = 0; b.die(); }
    };
    b.damageSeg = function (x0, y0, x1, y1, dmg) {
      for (const p of b.parts) if (p.weak && !p.closed && G.segCircle(x0, y0, x1, y1, p.x, p.y, p.r)) { b.damage(dmg, p.x, p.y); Fx.hitSpark(p.x + U.rand(-p.r, p.r) * 0.5, p.y + U.rand(-p.r, p.r) * 0.5, "160,220,255", 2); return; }
    };
    b.lineHit = function (dmg) { if (b.entered && !b.dying) { b.hp -= dmg * b.vulnMul; b.flash = 0.2; Fx.hitSpark(b.x, b.y, "160,255,255", 12); if (b.hp <= 0) { b.hp = 0; b.die(); } } };
    b.target = function () { const p = b.parts.find((q) => q.weak && !q.closed); return p ? { x: p.x, y: p.y } : null; };
    b.die = function () {
      if (b.dying) return;
      b.dying = 0.001;
      G.eb.length = 0;
      A.sfx("boomHuge");
      A.say(`${b.name.toLowerCase()} destroyed!`, { force: true, pitch: 0.65 });
      G.enemies.forEach((e) => { if (!e.dead) G.killEnemy(e); });
    };
    b.baseUpdate = function (dt) {
      b.t += dt; b.st += dt; b.flash = Math.max(0, b.flash - dt);
      for (const p of b.parts) if (p.flash) p.flash = Math.max(0, p.flash - dt);
      if (b.dying) {
        b.dying += dt;
        if (Math.random() < dt * 14) {
          const p = U.pick(b.parts) || b;
          Fx.explode(p.x + U.rand(-60, 60), p.y + U.rand(-60, 60), U.rand(30, 60));
          if (Math.random() < 0.4) A.sfx("boomBig");
        }
        if (b.dying > 3.2 && !b.dead) {
          b.dead = true;
          Fx.explode(b.x, b.y, 140, { rgb: "255,220,160" });
          Fx.chain(b.x, b.y, 300, 220, 22, 1.4, 60);
          Fx.flash = 1; Fx.flashRGB = "255,250,230";
          A.sfx("boomHuge");
        }
        return true;
      }
      for (let i = b.timers.length - 1; i >= 0; i--) { const tm = b.timers[i]; tm.d -= dt; if (tm.d <= 0) { b.timers.splice(i, 1); tm.fn(); } }
      updateHazards(b, dt);
      return false;
    };
    return b;
  }
  // ground shock waves and horizontal laser beams
  function wave(b, x, dir, speed = 520) { b.waves.push({ x, dir, speed, life: 2.6 }); }
  function beam(b, y, warn = 0.9, dur = 0.8, h = 26) { b.beams.push({ y, warn, dur, h, t: 0 }); A.sfx("charge"); }
  function updateHazards(b, dt) {
    const p = player(), floor = b.a.floor;
    for (let i = b.waves.length - 1; i >= 0; i--) {
      const w = b.waves[i];
      w.x += w.dir * w.speed * dt; w.life -= dt;
      if (Math.random() < dt * 40) Fx.add({ k: "dust", x: w.x, y: floor - 4, vx: U.rand(-40, 40), vy: U.rand(-120, -40), r: U.rand(4, 9), life: 0.5, drag: 2, rgb: "220,200,170" });
      if (w.life <= 0 || w.x < b.a.x0 - 40 || w.x > b.a.x1 + 40) { b.waves.splice(i, 1); continue; }
      if (p.dead <= 0 && Math.abs(p.x - w.x) < 26 && p.y > floor - 34) G.hurtPlayer(18, w.x);
    }
    for (let i = b.beams.length - 1; i >= 0; i--) {
      const bm = b.beams[i];
      bm.t += dt;
      if (bm.t > bm.warn && !bm.fired) { bm.fired = true; A.sfx("zap"); Fx.shake = Math.max(Fx.shake, 8); }
      if (bm.t > bm.warn + bm.dur) { b.beams.splice(i, 1); continue; }
      if (bm.fired && p.dead <= 0) {
        const pb = G.playerBox();
        if (pb.y1 > bm.y - bm.h / 2 && pb.y0 < bm.y + bm.h / 2) G.hurtPlayer(22);
      }
    }
  }
  function drawHazards(ctx, b) {
    const floor = b.a.floor;
    for (const w of b.waves) {
      const f = Math.min(1, w.life);
      Gfx.glowAt(ctx, "255,200,120", w.x, floor - 14, 36, 0.8 * f);
      ctx.fillStyle = `rgba(255,230,180,${0.9 * f})`;
      ctx.beginPath(); ctx.moveTo(w.x - 22, floor); ctx.quadraticCurveTo(w.x, floor - 46, w.x + 22, floor); ctx.fill();
    }
    for (const bm of b.beams) {
      if (!bm.fired) {
        const a = 0.3 + 0.3 * Math.sin(bm.t * 30);
        ctx.fillStyle = `rgba(255,60,40,${a})`; ctx.fillRect(b.a.x0, bm.y - 1.5, b.a.x1 - b.a.x0, 3);
      } else {
        const f = 1 - (bm.t - bm.warn) / bm.dur;
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        const g = ctx.createLinearGradient(0, bm.y - bm.h, 0, bm.y + bm.h);
        g.addColorStop(0, "rgba(255,60,40,0)"); g.addColorStop(0.5, `rgba(255,200,160,${0.95 * f})`); g.addColorStop(1, "rgba(255,60,40,0)");
        ctx.fillStyle = g; ctx.fillRect(b.a.x0, bm.y - bm.h, b.a.x1 - b.a.x0, bm.h * 2);
        ctx.fillStyle = `rgba(255,255,255,${f})`; ctx.fillRect(b.a.x0, bm.y - 3, b.a.x1 - b.a.x0, 6);
        ctx.restore();
      }
    }
  }
  function shoot(x, y, a, sp, o) { G.eshoot(x, y, Math.cos(a) * sp, Math.sin(a) * sp, o); }
  function aimA(x, y) { const p = player(); return Math.atan2(p.y - 30 - y, p.x - x); }
  function fan(x, y, a0, n, spread, sp, o) { for (let i = 0; i < n; i++) shoot(x, y, a0 + (i - (n - 1) / 2) * spread, sp, o); }
  function ring(x, y, n, sp, o, off = 0) { for (let i = 0; i < n; i++) shoot(x, y, off + (i / n) * TAU, sp, o); }
  const flashC = (b, p) => (p && p.flash > 0) || b.flash > 0;

  /* ======================= 1. IRON FIST ======================= */
  B.fist = function (a) {
    const floor = a.floor;
    const b = base({ name: "IRON FIST", hp: 520, score: 20000, fx: a.x1 + 260, fy: floor - 260, open: 0, rot: 0 }, a);
    const core = { x: 0, y: 0, r: 46, weak: true }, armA = { x: 0, y: 0, r: 40 }, armB = { x: 0, y: 0, r: 40 };
    b.parts = [core, armA, armB];
    let tx = b.fx, ty = b.fy, spd = 4, plan = [];
    b.update = function (dt) {
      if (b.baseUpdate(dt)) return;
      const hard = b.hp < b.maxHp * 0.5;
      const p = player();
      if (b.state === "enter") {
        tx = a.x1 - 260; ty = floor - 280; spd = 2.2;
        if (b.st > 2.2) { b.entered = true; b.state = "idle"; b.st = 0; A.sfx("roar"); }
      } else if (b.state === "idle") {
        tx = a.x1 - 260 + Math.sin(b.t * 1.3) * 60; ty = floor - 300 + Math.sin(b.t * 2.1) * 40; spd = 3;
        if (b.st > (hard ? 0.7 : 1.2)) { b.st = 0; b.state = U.pick(hard ? ["slam", "slam", "punch", "laser", "punch"] : ["slam", "punch", "laser"]); }
      } else if (b.state === "slam") {
        if (b.st < 0.9) { tx = p.x; ty = floor - 380; spd = 5; }
        else if (b.st < 1.2) { ty = floor - 95; spd = 14; }
        if (b.st >= 1.2 && !b.slammed) {
          b.slammed = true; A.sfx("stomp"); Fx.shake = 22; Fx.dust(b.fx, floor, 20);
          wave(b, b.fx - 90, -1); wave(b, b.fx + 90, 1);
          if (hard) for (let i = 0; i < 5; i++) G.eshoot(b.fx + U.rand(-60, 60), floor - 60, U.rand(-260, 260), U.rand(-700, -500), { kind: "bomb", g: 1000, r: 8, dmg: 14 });
        }
        if (b.st > 1.9) { b.slammed = false; b.state = "idle"; b.st = 0; }
      } else if (b.state === "punch") {
        const py = floor - 140;
        if (b.st < 0.8) { tx = a.x1 - 120; ty = py; spd = 5; b.open = 0; }
        else if (b.st < 1.6) { tx = a.x0 + 200; spd = 6.5; if (!b.whoosh) { b.whoosh = true; A.sfx("missile"); } }
        else { tx = a.x1 - 240; spd = 3; }
        if (b.st > 2.6) { b.whoosh = false; b.state = "idle"; b.st = 0; }
      } else if (b.state === "laser") {
        tx = a.x1 - 300; ty = floor - 330; spd = 3;
        b.open = Math.min(1, b.open + dt * 3);
        if (b.st > 0.6 && Math.floor((b.st - dt) / 0.35) !== Math.floor(b.st / 0.35) && b.st < 2.4) {
          fan(b.fx - 70, b.fy + 20, aimA(b.fx - 70, b.fy + 20), hard ? 7 : 5, 0.16, 380, { kind: "bolt", rgb: "255,90,60", r: 7 });
          A.sfx("eshot2");
        }
        if (b.st > 2.7) { b.open = 0; b.state = "idle"; b.st = 0; }
      }
      b.fx += (tx - b.fx) * Math.min(1, dt * spd);
      b.fy += (ty - b.fy) * Math.min(1, dt * spd);
      b.rot = U.clamp((tx - b.fx) * 0.0008, -0.3, 0.3);
      b.x = b.fx; b.y = b.fy;
      core.x = b.fx; core.y = b.fy;
      const sx = a.x1 + 120, sy = floor - 420;
      armA.x = U.lerp(b.fx, sx, 0.4); armA.y = U.lerp(b.fy, sy, 0.4) - 20;
      armB.x = U.lerp(b.fx, sx, 0.75); armB.y = U.lerp(b.fy, sy, 0.75) - 30;
      // contact damage (box around the fist, so that crouching under a punch works)
      if (p.dead <= 0) { const pb = G.playerBox(); if (pb.x1 > b.fx - 100 && pb.x0 < b.fx + 110 && pb.y1 > b.fy - 80 && pb.y0 < b.fy + 94) G.hurtPlayer(25, b.fx); }
    };
    b.draw = function (ctx) {
      const sx = a.x1 + 120, sy = floor - 420;
      // arm segments
      const pts = [[sx, sy], [armB.x, armB.y], [armA.x, armA.y], [b.fx + 70, b.fy - 30]];
      for (let i = 0; i < 3; i++) {
        const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
        ctx.strokeStyle = "#20242c"; ctx.lineWidth = 64 - i * 8; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        ctx.strokeStyle = "#6a7280"; ctx.lineWidth = 46 - i * 8; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x0, y0 - 12); ctx.lineTo(x1, y1 - 12); ctx.stroke();
        ctx.fillStyle = "#3a4050"; ctx.beginPath(); ctx.arc(x1, y1, 30 - i * 3, 0, TAU); ctx.fill();
        ctx.fillStyle = "#9aa2b0"; ctx.beginPath(); ctx.arc(x1, y1, 14, 0, TAU); ctx.fill();
      }
      // the fist
      ctx.save(); ctx.translate(b.fx, b.fy); ctx.rotate(b.rot);
      const fl = b.flash > 0;
      const g = ctx.createLinearGradient(0, -90, 0, 90);
      g.addColorStop(0, fl ? "#fff" : "#d8dee8"); g.addColorStop(0.4, fl ? "#fff" : "#7a8494"); g.addColorStop(1, "#2a2e36");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.roundRect(-40, -80, 150, 160, 30); ctx.fill();
      ctx.strokeStyle = "#101216"; ctx.lineWidth = 3; ctx.stroke();
      // fingers (curled, opening for the laser)
      for (let i = 0; i < 4; i++) {
        const y = -70 + i * 38, ext = b.open * 40;
        ctx.fillStyle = fl ? "#fff" : i % 2 ? "#8a94a4" : "#a0aab8";
        ctx.beginPath(); ctx.roundRect(-96 - ext, y, 70 + ext, 32, 14); ctx.fill();
        ctx.strokeStyle = "#101216"; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.fillStyle = "#40464f"; ctx.fillRect(-70 - ext * 0.5, y + 4, 4, 24);
        if (b.open > 0.5) Gfx.glowAt(ctx, "255,90,60", -96 - ext, y + 16, 16, b.open, true);
      }
      // thumb
      ctx.fillStyle = fl ? "#fff" : "#9aa4b2"; ctx.beginPath(); ctx.roundRect(-30, 64, 70, 30, 14); ctx.fill(); ctx.strokeStyle = "#101216"; ctx.stroke();
      // core (weak spot)
      const pulse = 0.7 + 0.3 * Math.sin(b.t * 8);
      ctx.fillStyle = "#14161c"; ctx.beginPath(); ctx.arc(40, 0, 34, 0, TAU); ctx.fill();
      Gfx.glowAt(ctx, "255,80,40", 40, 0, 60 * pulse, 0.9, true);
      ctx.fillStyle = `rgba(255,${120 + 80 * pulse | 0},80,1)`; ctx.beginPath(); ctx.arc(40, 0, 18, 0, TAU); ctx.fill();
      ctx.restore();
      core.x = b.fx + Math.cos(b.rot) * 40; core.y = b.fy + Math.sin(b.rot) * 40;
      drawHazards(ctx, b);
    };
    return b;
  };

  /* ======================= 2. CRYSTAL WIDOW ======================= */
  B.widow = function (a) {
    const floor = a.floor, top = floor - 600;
    const b = base({ name: "CRYSTAL WIDOW", hp: 700, score: 25000, bx: (a.x0 + a.x1) / 2 + 200, by: top - 200, legPh: 0 }, a);
    const body = { x: 0, y: 0, r: 58, weak: true }, head = { x: 0, y: 0, r: 34, weak: true };
    b.parts = [body, head];
    let tx = b.bx, ty = b.by;
    b.update = function (dt) {
      if (b.baseUpdate(dt)) return;
      const hard = b.hp < b.maxHp * 0.5, p = player();
      if (b.state === "enter") { tx = b.bx; ty = top + 240; if (b.st > 2.4) { b.entered = true; b.state = "hang"; b.st = 0; A.sfx("roar"); } }
      else if (b.state === "hang") {
        tx = (a.x0 + a.x1) / 2 + Math.sin(b.t * 0.9) * 420; ty = top + 250 + Math.sin(b.t * 1.7) * 40;
        if (Math.floor((b.st - dt) / (hard ? 0.9 : 1.3)) !== Math.floor(b.st / (hard ? 0.9 : 1.3))) {
          fan(b.bx, b.by + 30, aimA(b.bx, b.by + 30), hard ? 5 : 3, 0.22, 340, { kind: "shard", r: 7 }); A.sfx("eshot");
        }
        if (b.st > 4.2) { b.st = 0; b.state = U.pick(["drop", "rain", "brood", hard ? "drop" : "rain"]); }
      } else if (b.state === "drop") {
        if (b.st < 1) { tx = U.clamp(p.x, a.x0 + 150, a.x1 - 150); ty = top + 150; }
        else if (b.st < 1.4) { ty = floor - 70; }
        if (b.st > 1.4 && !b.landed) { b.landed = true; A.sfx("stomp"); Fx.shake = 18; wave(b, b.bx - 80, -1, 460); wave(b, b.bx + 80, 1, 460); }
        if (b.st > 1.6 && b.st < 3.6) { tx = b.bx + Math.sign(p.x - b.bx || 1) * 380 * dt * 6; ty = floor - 70; }
        if (b.st > 3.6) { ty = top + 250; }
        if (b.st > 4.6) { b.landed = false; b.state = "hang"; b.st = 0; }
      } else if (b.state === "rain") {
        tx = (a.x0 + a.x1) / 2; ty = top + 200;
        if (b.st > 0.5 && Math.random() < dt * (hard ? 9 : 6)) G.eshoot(U.rand(a.x0 + 30, a.x1 - 30), top + 40, 0, 120, { kind: "shard", g: 900, r: 7 });
        if (b.st > 3.5) { b.state = "hang"; b.st = 0; }
      } else if (b.state === "brood") {
        ty = top + 320;
        if (b.st > 0.8 && !b.laid) { b.laid = true; for (let i = 0; i < (hard ? 4 : 3); i++) G.spawnEnemy("spiderling", b.bx + U.rand(-60, 60), b.by + 60, { vy: -200 }); A.sfx("roar"); }
        if (b.st > 2) { b.laid = false; b.state = "hang"; b.st = 0; }
      }
      tx = U.clamp(tx, a.x0 + 120, a.x1 - 120);
      const k = b.state === "drop" && b.st > 1 && b.st < 1.4 ? 10 : 2.5;
      b.bx += (tx - b.bx) * Math.min(1, dt * k);
      b.by += (ty - b.by) * Math.min(1, dt * k);
      b.legPh += dt * (b.state === "drop" ? 8 : 2);
      b.x = b.bx; b.y = b.by;
      body.x = b.bx; body.y = b.by - 20; head.x = b.bx; head.y = b.by + 46;
      if (p.dead <= 0 && U.dist2(p.x, p.y - 30, b.bx, b.by) < 90 * 90) G.hurtPlayer(22, b.bx);
    };
    b.draw = function (ctx) {
      const x = b.bx, y = b.by, fl = b.flash > 0;
      // thread
      ctx.strokeStyle = "rgba(230,220,255,0.6)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, top - 400); ctx.lineTo(x, y - 60); ctx.stroke();
      // legs
      for (let s = -1; s <= 1; s += 2) for (let i = 0; i < 4; i++) {
        const ph = b.legPh + i * 1.3 + (s > 0 ? 0.6 : 0);
        const hx = x + s * 30, hy = y - 10 + i * 8;
        const kx = x + s * (110 + i * 12), ky = y - 90 + i * 22 + Math.sin(ph) * 14;
        const fx = x + s * (150 + i * 18), fy = y + 70 + Math.cos(ph) * 10;
        ctx.strokeStyle = "#1a1030"; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
        ctx.strokeStyle = fl ? "#fff" : "#6a4aa0"; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
        ctx.fillStyle = "#e0c8ff"; poly(ctx, [fx - 5, fy, fx, fy + 16, fx + 5, fy]); ctx.fill();
      }
      // abdomen with crystals
      const g = ctx.createRadialGradient(x - 20, y - 40, 5, x, y - 20, 80);
      g.addColorStop(0, fl ? "#fff" : "#b090f0"); g.addColorStop(0.5, fl ? "#fff" : "#5a3a9a"); g.addColorStop(1, "#1a0e36");
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y - 20, 70, 58, 0, 0, TAU); ctx.fill();
      for (let i = 0; i < 6; i++) {
        const cx = x - 50 + i * 20, cy = y - 60 - Math.sin(i * 1.3) * 10, h = 30 + (i % 3) * 14;
        const cg = ctx.createLinearGradient(cx - 8, 0, cx + 8, 0);
        cg.addColorStop(0, "rgba(120,80,220,0.9)"); cg.addColorStop(0.5, "rgba(240,220,255,0.95)"); cg.addColorStop(1, "rgba(100,180,255,0.9)");
        ctx.fillStyle = cg; poly(ctx, [cx - 8, cy, cx - 2, cy - h, cx + 3, cy - h - 4, cx + 8, cy]); ctx.fill();
      }
      Gfx.glowAt(ctx, "190,150,255", x, y - 70, 90, 0.35 + 0.1 * Math.sin(b.t * 4));
      // head
      ctx.fillStyle = fl ? "#fff" : "#3a2266"; ctx.beginPath(); ctx.ellipse(x, y + 44, 40, 32, 0, 0, TAU); ctx.fill();
      for (const [ex, ey, r] of [[-16, 40, 7], [16, 40, 7], [-7, 56, 5], [7, 56, 5], [-26, 50, 4], [26, 50, 4]]) {
        Gfx.glowAt(ctx, "120,255,255", x + ex, y + ey, r * 3, 0.7);
        ctx.fillStyle = "#c0ffff"; ctx.beginPath(); ctx.arc(x + ex, y + ey, r, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = "#e0d0ff"; poly(ctx, [x - 18, y + 70, x - 8, y + 94, x - 4, y + 70]); ctx.fill(); poly(ctx, [x + 18, y + 70, x + 8, y + 94, x + 4, y + 70]); ctx.fill();
      drawHazards(ctx, b);
    };
    return b;
  };

  /* ======================= 3. HIVE MIND ======================= */
  B.hivemind = function (a) {
    const floor = a.floor;
    const cx = a.x1 - 230, cy = floor - 300;
    const b = base({ name: "HIVE MIND", hp: 660, score: 30000, x: cx, y: cy, eye: 0, look: 0, tent: [] }, a);
    const eye = { x: cx - 30, y: cy, r: 58, weak: true, closed: true }, mass = { x: cx + 60, y: cy, r: 150 };
    b.parts = [eye, mass];
    for (let i = 0; i < 4; i++) b.tent.push({ x: a.x0 + 140 + i * 240, h: 0, state: "down", st: U.rand(1, 4), ph: U.rand(TAU) });
    b.update = function (dt) {
      if (b.baseUpdate(dt)) return;
      const hard = b.hp < b.maxHp * 0.5, p = player();
      if (b.state === "enter") { if (b.st > 2.4) { b.entered = true; b.state = "closed"; b.st = 0; A.sfx("roar"); } }
      else if (b.state === "closed") {
        b.eye = Math.max(0, b.eye - dt * 3);
        if (Math.floor((b.st - dt) / 1.1) !== Math.floor(b.st / 1.1)) { ring(cx - 60, cy, hard ? 12 : 9, 220, { kind: "spore", r: 7 }, b.t); A.sfx("eshot"); }
        if (b.st > 2.6) { b.state = "open"; b.st = 0; A.sfx("roar"); }
      } else if (b.state === "open") {
        b.eye = Math.min(1, b.eye + dt * 3);
        if (b.st > 0.5 && Math.floor((b.st - dt) / 0.45) !== Math.floor(b.st / 0.45)) {
          fan(eye.x, eye.y, aimA(eye.x, eye.y), hard ? 5 : 3, 0.2, 380, { kind: "orb", rgb: "255,230,80", r: 8 }); A.sfx("eshot2");
        }
        if (b.st > 0.8 && !b.spawned && hard) { b.spawned = true; for (let i = 0; i < 2; i++) G.spawnEnemy("drone", cx - 150, cy + U.rand(-80, 80)); }
        if (b.st > 3.8) { b.spawned = false; b.state = "closed"; b.st = 0; }
      }
      eye.closed = b.eye < 0.4;
      b.look = Math.atan2(p.y - 30 - cy, p.x - cx);
      // tentacles burst out of the floor
      for (const tn of b.tent) {
        tn.st -= dt;
        if (tn.state === "down" && tn.st <= 0 && b.entered) { tn.state = "warn"; tn.st = 0.8; tn.x = U.clamp(p.x + U.rand(-40, 40), a.x0 + 40, a.x1 - 420); }
        else if (tn.state === "warn" && tn.st <= 0) { tn.state = "up"; tn.st = 1.1; A.sfx("crumble"); Fx.dust(tn.x, floor, 14, "200,120,130"); }
        else if (tn.state === "up") { tn.h = Math.min(1, tn.h + dt * 6); if (tn.st <= 0) tn.state = "retract"; }
        else if (tn.state === "retract") { tn.h = Math.max(0, tn.h - dt * 2.5); if (tn.h <= 0) { tn.state = "down"; tn.st = U.rand(hard ? 1.2 : 2, hard ? 2.5 : 4.5); } }
        if (tn.h > 0.3 && p.dead <= 0 && Math.abs(p.x - tn.x) < 30 && p.y > floor - tn.h * 260) G.hurtPlayer(20, tn.x);
      }
      if (p.dead <= 0 && p.x > cx - 120) G.hurtPlayer(25, cx - 200);
    };
    b.drawBack = function (ctx) {
      // fleshy mass growing out of the right wall
      const g = ctx.createRadialGradient(cx + 40, cy - 40, 20, cx + 80, cy, 320);
      g.addColorStop(0, b.flash > 0 ? "#fff" : "#d0506a"); g.addColorStop(0.5, "#6a1428"); g.addColorStop(1, "#200408");
      ctx.fillStyle = g;
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const ang = Math.PI * 0.5 + (i / 40) * Math.PI, rr2 = 210 + Math.sin(i * 1.7 + b.t * 2) * 14 + Math.sin(i * 0.6) * 30;
        const x = cx + 120 + Math.cos(ang) * rr2, y = cy + Math.sin(ang) * rr2 * 1.5;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.lineTo(cx + 600, cy - 400); ctx.lineTo(cx + 600, cy + 400); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(255,120,150,0.35)"; ctx.lineWidth = 4;
      for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(cx + 300, cy - 250 + i * 80); ctx.bezierCurveTo(cx + 100, cy - 200 + i * 70, cx, cy - 100 + i * 35, cx - 60, cy - 60 + i * 20); ctx.stroke(); }
    };
    b.draw = function (ctx) {
      // eye
      const ex = eye.x, ey = eye.y, op = b.eye;
      ctx.fillStyle = "#3a0814"; ctx.beginPath(); ctx.ellipse(ex, ey, 72, 60, 0, 0, TAU); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.ellipse(ex, ey, 64, 52 * Math.max(0.06, op), 0, 0, TAU); ctx.clip();
      const g = ctx.createRadialGradient(ex - 15, ey - 15, 4, ex, ey, 64);
      g.addColorStop(0, "#fff8e0"); g.addColorStop(1, "#e0c890"); ctx.fillStyle = b.flash > 0 ? "#fff" : g; ctx.fillRect(ex - 70, ey - 60, 140, 120);
      const lx = ex + Math.cos(b.look) * 20, ly = ey + Math.sin(b.look) * 16;
      ctx.fillStyle = "#c08010"; ctx.beginPath(); ctx.arc(lx, ly, 28, 0, TAU); ctx.fill();
      ctx.fillStyle = "#200a00"; ctx.beginPath(); ctx.ellipse(lx, ly, 7, 22, 0, 0, TAU); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = "#1a0208"; ctx.lineWidth = 8; ctx.beginPath(); ctx.ellipse(ex, ey, 66, 54 * Math.max(0.06, op), 0, 0, TAU); ctx.stroke();
      if (op > 0.4) Gfx.glowAt(ctx, "255,230,120", ex, ey, 90, 0.25);
      // tentacles
      for (const tn of b.tent) {
        if (tn.state === "warn") { ctx.fillStyle = `rgba(255,60,90,${0.4 + 0.4 * Math.sin(G.t * 30)})`; ctx.fillRect(tn.x - 30, floor - 6, 60, 6); Fx.dust(tn.x, floor, 1, "220,120,130"); }
        if (tn.h <= 0) continue;
        const hh = tn.h * 260;
        for (let k = 0; k < 10; k++) {
          const f = k / 10, x = tn.x + Math.sin(G.t * 5 + tn.ph + f * 4) * 14 * f, y = floor - hh * f;
          ctx.fillStyle = k % 2 ? "#8a1a34" : "#c04060"; ctx.beginPath(); ctx.arc(x, y, 24 - f * 14, 0, TAU); ctx.fill();
        }
        ctx.fillStyle = "#ffd0a0"; poly(ctx, [tn.x - 8, floor - hh + 6, tn.x + Math.sin(G.t * 5 + tn.ph + 4) * 14, floor - hh - 30, tn.x + 8, floor - hh + 6]); ctx.fill();
      }
      drawHazards(ctx, b);
    };
    return b;
  };

  /* ======================= 4. TITAN WALKER ======================= */
  B.titan = function (a) {
    const floor = a.floor;
    const b = base({ name: "TITAN WALKER", hp: 850, score: 35000, bx: a.x1 + 200, step: 0, face: -1, dir: -1, gun: 0 }, a);
    const cock = { x: 0, y: 0, r: 46, weak: true }, hull = { x: 0, y: 0, r: 85 }, legL = { x: 0, y: 0, r: 40 }, legR = { x: 0, y: 0, r: 40 };
    b.parts = [cock, hull, legL, legR];
    const hipH = 250;
    b.update = function (dt) {
      if (b.baseUpdate(dt)) return;
      const hard = b.hp < b.maxHp * 0.5, p = player();
      let walkSp = 0;
      if (b.state === "enter") { walkSp = -120; if (b.bx < a.x1 - 260) { b.entered = true; b.state = "walk"; b.st = 0; A.sfx("roar"); } }
      else if (b.state === "walk") {
        walkSp = b.dir * (hard ? 150 : 110);
        if (b.bx < a.x0 + 240) b.dir = 1; if (b.bx > a.x1 - 240) b.dir = -1;
        if (b.st > 2.6) { b.st = 0; b.state = U.pick(["missiles", "beam", "stomp", hard ? "beam" : "missiles"]); }
      } else if (b.state === "missiles") {
        if (Math.floor((b.st - dt) / 0.3) !== Math.floor(b.st / 0.3) && b.st < 1.8) {
          G.eshoot(b.bx - b.face * 40, floor - hipH - 120, U.rand(-150, 150), -420, { kind: "missile", homing: 2.4, r: 8, dmg: 16, life: 5 }); A.sfx("missile");
        }
        if (b.st > 2.2) { b.state = "walk"; b.st = 0; }
      } else if (b.state === "beam") {
        if (!b.charged) { b.charged = true; beam(b, U.pick([floor - 22, floor - 22, floor - 80]), 1.0, 0.7, U.pick([20, 26])); if (hard) b.later(1.3, () => beam(b, floor - 22, 0.8, 0.6)); }
        b.gun = Math.min(1, b.st);
        if (b.st > (hard ? 2.6 : 2)) { b.charged = false; b.gun = 0; b.state = "walk"; b.st = 0; }
      } else if (b.state === "stomp") {
        if (b.st > 0.6 && !b.stomped) { b.stomped = true; A.sfx("stomp"); Fx.shake = 20; wave(b, b.bx - 120, -1, 560); wave(b, b.bx + 120, 1, 560); if (hard) b.later(0.7, () => { wave(b, b.bx - 120, -1, 420); wave(b, b.bx + 120, 1, 420); A.sfx("stomp"); }); }
        if (b.st > 1.6) { b.stomped = false; b.state = "walk"; b.st = 0; }
      }
      b.bx += walkSp * dt;
      if (walkSp) b.step += Math.abs(walkSp) * dt / 140;
      b.face = p.x < b.bx ? -1 : 1;
      // chest gun bursts while walking
      if (b.entered && b.state === "walk" && Math.floor((b.t - dt) / 1.4) !== Math.floor(b.t / 1.4)) {
        fan(b.bx + b.face * 90, floor - hipH - 40, aimA(b.bx + b.face * 90, floor - hipH - 40), hard ? 5 : 3, 0.14, 400, { kind: "bolt", rgb: "255,150,40", r: 7 }); A.sfx("eshot2");
      }
      const bob = Math.abs(Math.sin(b.step * Math.PI)) * 10;
      b.x = b.bx; b.y = floor - hipH - 60 - bob;
      cock.x = b.bx + b.face * 60; cock.y = b.y - 70;
      hull.x = b.bx; hull.y = b.y + 25;
      const s = Math.sin(b.step * Math.PI);
      legL.x = b.bx - 60 + s * 40; legL.y = floor - 120; legR.x = b.bx + 60 - s * 40; legR.y = floor - 120;
      if (p.dead <= 0 && ((Math.abs(p.x - legL.x) < 40 || Math.abs(p.x - legR.x) < 40) && p.y > floor - 200)) G.hurtPlayer(25, b.bx);
      if (p.dead <= 0 && U.dist2(p.x, p.y - 30, hull.x, hull.y) < 120 * 120) G.hurtPlayer(25, b.bx);
    };
    b.draw = function (ctx) {
      const fl = b.flash > 0, x = b.bx, y = b.y, f = b.face, s = Math.sin(b.step * Math.PI);
      // legs
      for (const [lx, front] of [[x - 60 + s * 40, false], [x + 60 - s * 40, true]]) {
        const hx = x + (lx < x ? -40 : 40), hy = y + 50;
        const kx = (hx + lx) / 2 + f * -30, ky = floor - 150 - (front ? -s : s) * 10;
        ctx.strokeStyle = "#141619"; ctx.lineWidth = 46; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(kx, ky); ctx.lineTo(lx, floor - 30); ctx.stroke();
        ctx.strokeStyle = front ? "#8a9098" : "#5a6068"; ctx.lineWidth = 32; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(kx, ky); ctx.lineTo(lx, floor - 30); ctx.stroke();
        ctx.fillStyle = "#ffd040"; ctx.fillRect(kx - 14, ky - 4, 28, 8);
        ctx.fillStyle = "#30343a"; ctx.beginPath(); ctx.roundRect(lx - 50, floor - 34, 100, 34, 8); ctx.fill();
        ctx.fillStyle = "#1a1c20"; for (let k = 0; k < 4; k++) ctx.fillRect(lx - 44 + k * 26, floor - 8, 16, 8);
      }
      // hull
      const g = ctx.createLinearGradient(0, y - 120, 0, y + 90);
      g.addColorStop(0, fl ? "#fff" : "#dfe4ea"); g.addColorStop(0.45, fl ? "#fff" : "#8a9098"); g.addColorStop(1, "#2a2e34");
      ctx.fillStyle = g;
      poly(ctx, [x - 150, y + 40, x - 130, y - 90, x - 60, y - 130, x + 60, y - 130, x + 130, y - 90, x + 150, y + 40, x + 90, y + 90, x - 90, y + 90]); ctx.fill();
      ctx.strokeStyle = "#0e1012"; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = "#ffd040"; for (let k = -2; k <= 2; k++) poly(ctx, [x + k * 40 - 14, y + 70, x + k * 40 + 6, y + 70, x + k * 40 + 14, y + 86, x + k * 40 - 6, y + 86]), ctx.fill();
      // missile racks
      for (const sx of [-1, 1]) { ctx.fillStyle = "#3a3e46"; ctx.fillRect(x + sx * 110 - 26, y - 160, 52, 40); ctx.fillStyle = "#e03020"; for (let k = 0; k < 3; k++) ctx.fillRect(x + sx * 110 - 20 + k * 16, y - 156, 8, 10); }
      // chest cannon
      ctx.fillStyle = "#24282e"; ctx.fillRect(f > 0 ? x + 40 : x - 140, y - 30, 100, 34);
      if (b.gun > 0) Gfx.glowAt(ctx, "255,80,40", x + f * 140, y - 13, 40 * b.gun, 0.9, true);
      // cockpit
      ctx.fillStyle = "#14161a"; ctx.beginPath(); ctx.roundRect(x + f * 60 - 50, y - 110, 100, 70, 16); ctx.fill();
      const cg = ctx.createLinearGradient(0, y - 105, 0, y - 45);
      cg.addColorStop(0, "#ffe0a0"); cg.addColorStop(1, "#ff5020");
      ctx.fillStyle = cg; ctx.beginPath(); ctx.roundRect(x + f * 60 - 38, y - 98, 76, 40, 10); ctx.fill();
      Gfx.glowAt(ctx, "255,140,60", x + f * 60, y - 78, 70, 0.4 + 0.2 * Math.sin(b.t * 6));
      drawHazards(ctx, b);
    };
    return b;
  };

  /* ======================= 5. THE OVERMIND ======================= */
  B.overmind = function (a) {
    const floor = a.floor;
    const fx = a.x1 - 300, fy = floor - 380;
    const b = base({ name: "THE OVERMIND", hp: 1150, score: 60000, x: fx, y: fy, phase: 1, jaw: 0, eyeA: 0, vulnMul: 0 }, a);
    const mkHand = (s) => ({ s, x: fx + s * 200, y: floor - 200, hx: fx, hy: floor - 200, r: 60, weak: true, hp: 260, alive: true, state: "idle", st: U.rand(0.5, 2), flash: 0 });
    const hands = [mkHand(-1), mkHand(1)];
    hands[0].hx = fx - 420; hands[1].hx = fx - 120;
    const face = { x: fx, y: fy, r: 130, weak: false }, core = { x: fx, y: fy + 30, r: 50, weak: true, closed: true };
    b.parts = [hands[0], hands[1], face, core];
    b.onPartDestroyed = function (h) {
      if (!h.alive) return;
      h.alive = false; h.weak = false; h.r = 0;
      Fx.chain(h.x, h.y, 120, 100, 10, 0.8, 40); A.sfx("boomBig");
      G.addScore(5000, h.x, h.y - 40);
      if (!hands.some((q) => q.alive)) { b.phase = 2; b.vulnMul = 1; core.closed = false; face.r = 0; A.say("Core exposed!", { force: true, pitch: 0.6 }); A.sfx("roar"); }
    };
    b.update = function (dt) {
      if (b.baseUpdate(dt)) return;
      const p = player(), hard = b.phase === 3;
      if (b.state === "enter") { if (b.st > 2.6) { b.entered = true; b.state = "fight"; b.st = 0; A.sfx("roar"); } return; }
      if (b.phase === 2 && b.hp < b.maxHp * 0.45) { b.phase = 3; A.say("Warning. Critical damage.", { force: true, pitch: 0.55 }); }
      // hands: slam and sweep (like giant fists)
      for (const h of hands) {
        if (!h.alive) continue;
        h.st -= dt;
        if (h.state === "idle") {
          h.tx = h.hx + Math.sin(b.t * 1.4 + h.s) * 40; h.ty = floor - 260 + Math.sin(b.t * 2 + h.s) * 30;
          if (h.st <= 0) { h.state = U.pick(["slam", "slam", "shoot"]); h.st = 0; h.t2 = 0; }
        } else if (h.state === "slam") {
          h.t2 += dt;
          if (h.t2 < 0.8) { h.tx = U.clamp(p.x, a.x0 + 80, a.x1 - 380); h.ty = floor - 360; }
          else if (h.t2 < 1.05) h.ty = floor - 65;
          if (h.t2 >= 1.05 && !h.hit) { h.hit = true; A.sfx("stomp"); Fx.shake = 18; wave(b, h.x - 70, -1, 480); wave(b, h.x + 70, 1, 480); }
          if (h.t2 > 1.8) { h.hit = false; h.state = "idle"; h.st = U.rand(1.2, 2.4); }
        } else if (h.state === "shoot") {
          h.t2 += dt; h.ty = floor - 320;
          if (Math.floor((h.t2 - dt) / 0.4) !== Math.floor(h.t2 / 0.4) && h.t2 < 1.6) { fan(h.x, h.y, aimA(h.x, h.y), 3, 0.25, 360, { kind: "bolt", rgb: "80,230,255", r: 7 }); A.sfx("eshot2"); }
          if (h.t2 > 2) { h.state = "idle"; h.st = U.rand(1, 2); }
        }
        const k = h.state === "slam" && h.t2 > 0.8 ? 14 : 4;
        h.x += (h.tx - h.x) * Math.min(1, dt * k); h.y += (h.ty - h.y) * Math.min(1, dt * k);
        if (p.dead <= 0 && U.dist2(p.x, p.y - 30, h.x, h.y) < 75 * 75) G.hurtPlayer(25, h.x);
      }
      // face attacks
      b.eyeA = Math.atan2(p.y - 30 - fy, p.x - fx);
      const per = b.phase === 1 ? 2.6 : hard ? 1.2 : 1.7;
      if (Math.floor((b.st - dt) / per) !== Math.floor(b.st / per)) {
        const r = Math.random();
        if (r < 0.4) { for (const s of [-1, 1]) fan(fx + s * 60, fy - 40, aimA(fx + s * 60, fy - 40), b.phase === 1 ? 1 : 3, 0.15, 420, { kind: "bolt", rgb: "255,60,200", r: 7 }); A.sfx("laser"); }
        else if (r < 0.7) { b.jaw = 1; for (let i = 0; i < (hard ? 7 : 4); i++) G.eshoot(fx, fy + 70, -U.rand(200, 520), -U.rand(200, 500), { kind: "fire", g: 700, r: 10, dmg: 16 }); A.sfx("roar"); }
        else if (b.phase >= 2) { beam(b, U.pick([floor - 22, floor - 80]), 1, 0.6); }
        else ring(fx, fy, 10, 200, { rgb: "255,60,200", r: 6 }, b.t);
      }
      if (hard && Math.floor((b.t - dt) / 0.25) !== Math.floor(b.t / 0.25)) { shoot(fx, fy + 30, b.t * 2.3 + Math.PI * 0.5, 240, { rgb: "120,240,255", r: 6 }); shoot(fx, fy + 30, -b.t * 2.3 + Math.PI * 0.8, 240, { rgb: "120,240,255", r: 6 }); }
      if (b.phase >= 2 && Math.random() < dt * 0.25 && G.enemies.length < 3) G.spawnEnemy("orb", a.x0 + U.rand(60, 400), floor - U.rand(300, 450));
      b.jaw = Math.max(0, b.jaw - dt * 1.5);
      if (p.dead <= 0 && p.x > fx - 160 && p.y > fy - 200) G.hurtPlayer(25, fx - 300);
    };
    b.drawBack = function (ctx) {
      // machine wall
      ctx.fillStyle = "#070a12"; ctx.fillRect(fx - 220, floor - 760, 600, 760);
      ctx.strokeStyle = "rgba(60,200,255,0.25)"; ctx.lineWidth = 2;
      for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.moveTo(fx - 220, floor - 700 + i * 60); ctx.lineTo(fx + 400, floor - 700 + i * 60 + Math.sin(i) * 20); ctx.stroke(); }
    };
    b.draw = function (ctx) {
      const fl = b.flash > 0;
      // face
      const g = ctx.createLinearGradient(0, fy - 200, 0, fy + 180);
      g.addColorStop(0, fl ? "#fff" : "#9ab0d0"); g.addColorStop(0.4, fl ? "#fff" : "#4a5a78"); g.addColorStop(1, "#10141e");
      ctx.fillStyle = g;
      poly(ctx, [fx - 170, fy - 120, fx - 110, fy - 200, fx + 110, fy - 200, fx + 170, fy - 120, fx + 160, fy + 60, fx + 90, fy + 160, fx - 90, fy + 160, fx - 160, fy + 60]); ctx.fill();
      ctx.strokeStyle = "#05070c"; ctx.lineWidth = 4; ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(fx - 120, fy - 150); ctx.lineTo(fx + 120, fy - 150); ctx.moveTo(fx, fy - 200); ctx.lineTo(fx, fy - 90); ctx.stroke();
      // eyes
      for (const s of [-1, 1]) {
        const ex = fx + s * 62, ey = fy - 50;
        ctx.fillStyle = "#05060a"; poly(ctx, [ex - 44, ey - 18, ex + 44, ey - 24 * s * 0 - 18, ex + 40, ey + 18, ex - 40, ey + 18]); ctx.fill();
        const lx = ex + Math.cos(b.eyeA) * 12, ly = ey + Math.sin(b.eyeA) * 6;
        Gfx.glowAt(ctx, "255,60,200", lx, ly, 44, 0.9, true);
        ctx.fillStyle = "#ffd0f0"; ctx.beginPath(); ctx.arc(lx, ly, 8, 0, TAU); ctx.fill();
      }
      // jaw / mouth
      const jo = b.jaw * 30;
      ctx.fillStyle = "#05060a"; ctx.fillRect(fx - 80, fy + 50, 160, 40 + jo);
      ctx.fillStyle = "#c0c8d8"; for (let k = 0; k < 8; k++) { ctx.fillRect(fx - 76 + k * 20, fy + 50, 12, 14); ctx.fillRect(fx - 76 + k * 20, fy + 76 + jo, 12, 14); }
      if (jo > 5) Gfx.glowAt(ctx, "255,140,40", fx, fy + 70 + jo / 2, 60, b.jaw, true);
      // core
      if (!core.closed) {
        const pu = 0.7 + 0.3 * Math.sin(b.t * (b.phase === 3 ? 14 : 7));
        ctx.fillStyle = "#0a0c12"; ctx.beginPath(); ctx.arc(core.x, core.y, 46, 0, TAU); ctx.fill();
        Gfx.glowAt(ctx, "120,240,255", core.x, core.y, 80 * pu, 0.95, true);
        ctx.fillStyle = "#e8ffff"; ctx.beginPath(); ctx.arc(core.x, core.y, 20 * pu, 0, TAU); ctx.fill();
      } else {
        ctx.fillStyle = "#2a3448"; ctx.beginPath(); ctx.arc(core.x, core.y, 44, 0, TAU); ctx.fill();
        ctx.strokeStyle = "#0a0c12"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(core.x - 44, core.y); ctx.lineTo(core.x + 44, core.y); ctx.moveTo(core.x, core.y - 44); ctx.lineTo(core.x, core.y + 44); ctx.stroke();
      }
      // hands
      for (const h of hands) {
        if (!h.alive) continue;
        const hf = h.flash > 0;
        ctx.strokeStyle = "#141820"; ctx.lineWidth = 30; ctx.beginPath(); ctx.moveTo(fx + h.s * 140, fy + 100); ctx.quadraticCurveTo((fx + h.x) / 2, fy + 220, h.x, h.y); ctx.stroke();
        ctx.strokeStyle = "#3a4660"; ctx.lineWidth = 18; ctx.stroke();
        const hg = ctx.createLinearGradient(0, h.y - 60, 0, h.y + 60);
        hg.addColorStop(0, hf ? "#fff" : "#a8b8d8"); hg.addColorStop(1, "#283040");
        ctx.fillStyle = hg; ctx.beginPath(); ctx.roundRect(h.x - 60, h.y - 55, 120, 110, 24); ctx.fill();
        ctx.strokeStyle = "#05070c"; ctx.lineWidth = 3; ctx.stroke();
        for (let k = 0; k < 4; k++) { ctx.fillStyle = hf ? "#fff" : "#6a7a98"; ctx.beginPath(); ctx.roundRect(h.x - 56 + k * 29, h.y + 40, 24, 34, 8); ctx.fill(); ctx.stroke(); }
        Gfx.glowAt(ctx, "80,230,255", h.x, h.y - 4, 34, 0.9, true);
        ctx.fillStyle = "#e8ffff"; ctx.beginPath(); ctx.arc(h.x, h.y - 4, 10, 0, TAU); ctx.fill();
        // small health bar on each hand
        ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(h.x - 40, h.y - 72, 80, 6);
        ctx.fillStyle = "#40e8ff"; ctx.fillRect(h.x - 40, h.y - 72, 80 * Math.max(0, h.hp / 260), 6);
      }
      drawHazards(ctx, b);
    };
    b.vulnText = () => (b.phase === 1 ? "DESTROY THE HANDS" : "");
    return b;
  };

  B.create = function (type, arena) {
    const b = B[type](arena);
    b.type = type;
    return b;
  };
})(window.XA);
