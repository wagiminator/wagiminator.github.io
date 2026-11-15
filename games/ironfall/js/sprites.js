/* Ironfall: player suit, items and projectiles (all drawn by code) */
"use strict";

(function (XA) {
  const { U, Gfx } = XA;
  const TAU = U.TAU;
  const { lin, rad, ell, circ, poly, rr, lamp } = Gfx;
  const Spr = (XA.Spr = {});

  /* ---------- Player: assault suit ---------- */
  const SUIT = { dark: "#262c3a", mid: "#56627a", light: "#a8b6cc", hi: "#e6eefa", accent: "#ff8a2a", visor: "88,230,255" };
  Spr.SUIT = SUIT;

  function limb(g, x0, y0, x1, y1, w, c1, c2) {
    g.strokeStyle = c2; g.lineWidth = w + 2.4;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    g.strokeStyle = c1; g.lineWidth = w;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  }
  function boot(g, x, y, ang) {
    g.save(); g.translate(x, y); g.rotate(ang);
    g.fillStyle = lin(g, 0, -6, 0, 4, [[0, SUIT.light], [1, SUIT.dark]]);
    poly(g, [-5, -6, 6, -6, 10, 2, 10, 4, -6, 4]); g.fill();
    g.strokeStyle = "rgba(0,0,0,0.6)"; g.lineWidth = 1; g.stroke();
    g.fillStyle = SUIT.accent; g.fillRect(-4, -5, 4, 2);
    g.restore();
  }
  // draws a leg from hip with thigh angle a1 and knee bend a2 (radians, 0 = straight down)
  function leg(g, hx, hy, a1, a2, front) {
    const L1 = 13, L2 = 13;
    const kx = hx + Math.sin(a1) * L1, ky = hy + Math.cos(a1) * L1;
    const fx = kx + Math.sin(a1 - a2) * L2, fy = ky + Math.cos(a1 - a2) * L2;
    const c1 = front ? SUIT.mid : "#3e4758", c2 = "#151821";
    limb(g, hx, hy, kx, ky, 8, c1, c2);
    limb(g, kx, ky, fx, fy, 7, c1, c2);
    g.fillStyle = front ? SUIT.light : SUIT.mid; circ(g, kx, ky, 4.2); g.fill();
    g.strokeStyle = c2; g.lineWidth = 1; g.stroke();
    boot(g, fx, fy, 0);
  }

  // o: { face, state, t, aim (rad, world angle), run (phase), flash, crouch, inv, beam }
  Spr.player = function (ctx, x, y, o) {
    ctx.save();
    ctx.translate(x, y);
    const face = o.face || 1;
    if (o.state === "gyro") { drawGyro(ctx, o); ctx.restore(); return; }
    ctx.scale(face, 1);
    const g = ctx;
    g.lineJoin = "round"; g.lineCap = "round";
    const crouch = o.state === "crouch";
    const air = o.state === "jump";
    let bob = 0, a1f = 0, a2f = 0, a1b = 0, a2b = 0;
    const ph = o.run || 0;
    if (o.state === "run") {
      const s = Math.sin(ph * TAU), c = Math.cos(ph * TAU);
      a1f = s * 0.75; a2f = Math.max(0, -c) * 1.1 + 0.1;
      a1b = -s * 0.75; a2b = Math.max(0, c) * 1.1 + 0.1;
      bob = -Math.abs(Math.cos(ph * TAU)) * 2.5;
    } else if (air) {
      a1f = 0.7; a2f = 1.2; a1b = -0.25; a2b = 0.5; bob = -2;
    } else if (crouch) {
      a1f = 1.35; a2f = 2.3; a1b = 0.9; a2b = 2.0;
    } else {
      const br = Math.sin((o.t || 0) * 2.2) * 0.6;
      a1f = 0.12; a2f = 0.12; a1b = -0.12; a2b = 0.1; bob = br;
    }
    const hipY = crouch ? -18 : -26 + bob;
    // back leg
    leg(g, -2, hipY, a1b, a2b, false);
    // torso (slightly leaning forward when running)
    const lean = o.state === "run" ? 0.12 : 0;
    g.save();
    g.translate(0, hipY);
    g.rotate(lean);
    // backpack / thruster
    g.fillStyle = lin(g, -14, -20, -6, 0, [[0, SUIT.mid], [1, SUIT.dark]]);
    rr(g, -15, -21, 8, 17, 3); g.fill();
    g.strokeStyle = "#111"; g.lineWidth = 1; g.stroke();
    if (air) { Gfx.glowAt(g, "255,170,80", -11, -2, 9, 0.7, true); }
    // hips
    g.fillStyle = lin(g, 0, -4, 0, 4, [[0, SUIT.mid], [1, SUIT.dark]]);
    rr(g, -8, -5, 16, 8, 3); g.fill();
    // chest
    g.fillStyle = lin(g, -8, -24, 8, -4, [[0, SUIT.hi], [0.35, SUIT.light], [1, SUIT.mid]]);
    poly(g, [-9, -4, -10, -18, -6, -25, 7, -25, 11, -17, 9, -4]); g.fill();
    g.strokeStyle = "#141820"; g.lineWidth = 1.2; g.stroke();
    g.fillStyle = SUIT.accent; poly(g, [-2, -18, 6, -18, 4, -14, -2, -14]); g.fill();
    g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(-7, -9, 15, 2);
    // head / helmet
    const hx = 1, hy = -31;
    g.fillStyle = lin(g, hx - 7, hy - 8, hx + 6, hy + 6, [[0, SUIT.hi], [0.4, SUIT.light], [1, SUIT.mid]]);
    rr(g, hx - 7, hy - 8, 15, 14, 5); g.fill();
    g.strokeStyle = "#141820"; g.lineWidth = 1.2; g.stroke();
    g.fillStyle = `rgb(${SUIT.visor})`;
    rr(g, hx + 1, hy - 4, 8, 5, 2); g.fill();
    g.fillStyle = "rgba(255,255,255,0.8)"; g.fillRect(hx + 3, hy - 3, 3, 1.4);
    Gfx.glowAt(g, SUIT.visor, hx + 6, hy - 1.5, 9, 0.55);
    g.fillStyle = SUIT.accent; g.fillRect(hx - 6, hy - 8, 2, 7);
    g.restore();
    // front leg
    leg(g, 2, hipY, a1f, a2f, true);
    // arm with cannon, rotates to the aim direction
    let aim = o.aim === undefined ? 0 : o.aim;
    let la = face > 0 ? aim : Math.PI - aim; // local angle
    la = Math.atan2(Math.sin(la), Math.cos(la));
    const sx = 2 + Math.sin(lean) * -20, sy = hipY - 21;
    g.save();
    g.translate(sx, sy);
    g.rotate(la);
    // shoulder pad
    g.fillStyle = lin(g, -6, -7, 6, 6, [[0, SUIT.hi], [0.5, SUIT.light], [1, SUIT.mid]]);
    ell(g, 0, 0, 7.5, 6.5); g.fill(); g.strokeStyle = "#141820"; g.lineWidth = 1.2; g.stroke();
    // gun
    g.fillStyle = lin(g, 0, -5, 0, 5, [[0, "#8894a8"], [0.5, "#3a4254"], [1, "#1c2029"]]);
    rr(g, 3, -4.5, 21, 9, 2.5); g.fill(); g.strokeStyle = "#0d0f14"; g.lineWidth = 1; g.stroke();
    g.fillStyle = "#1a1d24"; g.fillRect(22, -3, 5, 6);
    g.fillStyle = SUIT.accent; g.fillRect(8, -4.5, 5, 2);
    g.fillStyle = "rgba(120,240,255,0.9)"; g.fillRect(15, 0.5, 5, 1.6);
    if (o.muzzle > 0) Gfx.glowAt(g, o.muzzleRGB || "255,220,140", 30, 0, 16 * o.muzzle, 1, true);
    g.restore();
    ctx.restore();
    if (o.flash) {
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.5;
      ctx.drawImage(Gfx.glow("255,255,255", true), x - 30, y - 62, 60, 64);
      ctx.restore();
    }
  };
  function drawGyro(ctx, o) {
    const t = o.t || 0, r = 17;
    ctx.translate(0, -r);
    Gfx.glowAt(ctx, "120,220,255", 0, 0, 40, 0.5 + 0.2 * Math.sin(t * 20));
    ctx.rotate(o.roll || 0);
    const g = ctx;
    g.fillStyle = rad(g, -5, -5, 2, r, [[0, SUIT.hi], [0.4, SUIT.light], [1, SUIT.dark]]);
    circ(g, 0, 0, r); g.fill();
    g.strokeStyle = "#141820"; g.lineWidth = 1.5; g.stroke();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      g.strokeStyle = i % 2 ? SUIT.accent : "#2a3040"; g.lineWidth = 3;
      g.beginPath(); g.arc(0, 0, r - 3, a, a + 0.6); g.stroke();
    }
    g.fillStyle = `rgb(${SUIT.visor})`; circ(g, 0, 0, 5); g.fill();
    g.fillStyle = "#fff"; circ(g, -1.5, -1.5, 1.6); g.fill();
  }

  /* ---------- Items ---------- */
  const ITEM = {
    w_spread: { letter: "S", c1: "#ff5a4a", c2: "#8a1010", rgb: "255,90,70", name: "SPREAD SHOT" },
    w_laser: { letter: "L", c1: "#4ac0ff", c2: "#0a3a80", rgb: "80,190,255", name: "LASER" },
    w_bounce: { letter: "R", c1: "#5aff6a", c2: "#106020", rgb: "90,255,110", name: "REBOUND" },
    w_flame: { letter: "F", c1: "#ffb03a", c2: "#8a3a00", rgb: "255,170,60", name: "FLAMER" },
    w_homing: { letter: "H", c1: "#d070ff", c2: "#401070", rgb: "210,120,255", name: "HOMING" },
    power: { letter: "P", c1: "#ffe46a", c2: "#8a6a00", rgb: "255,230,110", name: "POWER" },
    line: { letter: "≡", c1: "#7affff", c2: "#0a5a6a", rgb: "120,255,255", name: "POWER LINE" },
    gyro: { letter: "G", c1: "#ffffff", c2: "#506080", rgb: "200,230,255", name: "GYROSCOPE" },
    shield: { letter: "◇", c1: "#80b0ff", c2: "#203a90", rgb: "140,180,255", name: "SHIELD" },
  };
  Spr.ITEM = ITEM;
  function capsule(key) {
    const d = ITEM[key];
    return Gfx.sprite("it_" + key, 34, 34, (g) => {
      g.fillStyle = rad(g, 17, 17, 0, 17, [[0, `rgba(${d.rgb},0.5)`], [1, `rgba(${d.rgb},0)`]]);
      circ(g, 17, 17, 17); g.fill();
      g.fillStyle = lin(g, 0, 6, 0, 28, [[0, "#fff"], [0.25, d.c1], [1, d.c2]]);
      rr(g, 5, 6, 24, 22, 8); g.fill();
      g.strokeStyle = "rgba(0,0,0,0.6)"; g.lineWidth = 1.5; g.stroke();
      g.fillStyle = "rgba(255,255,255,0.55)"; rr(g, 8, 8, 18, 5, 2.5); g.fill();
      g.font = "900 15px Orbitron, Arial"; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillStyle = "rgba(0,0,0,0.5)"; g.fillText(d.letter, 18, 19);
      g.fillStyle = "#fff"; g.fillText(d.letter, 17, 18);
    });
  }
  function diamond(big) {
    const s = big ? 30 : 20;
    return Gfx.sprite("it_dia" + (big ? "B" : ""), s, s, (g, w, h) => {
      const cx = w / 2, cy = h / 2, r = w * 0.42;
      g.fillStyle = rad(g, cx, cy, 0, w / 2, [[0, "rgba(120,240,255,0.5)"], [1, "rgba(120,240,255,0)"]]);
      circ(g, cx, cy, w / 2); g.fill();
      poly(g, [cx, cy - r, cx + r * 0.8, cy - r * 0.2, cx, cy + r, cx - r * 0.8, cy - r * 0.2]);
      g.fillStyle = lin(g, cx - r, cy - r, cx + r, cy + r, [[0, "#ffffff"], [0.3, big ? "#ff9af0" : "#9ff4ff"], [1, big ? "#a01ab0" : "#1a7ab0"]]);
      g.fill(); g.strokeStyle = "rgba(255,255,255,0.8)"; g.lineWidth = 1; g.stroke();
      g.strokeStyle = "rgba(255,255,255,0.5)";
      g.beginPath(); g.moveTo(cx - r * 0.8, cy - r * 0.2); g.lineTo(cx + r * 0.8, cy - r * 0.2); g.moveTo(cx, cy - r); g.lineTo(cx - r * 0.3, cy - r * 0.2); g.lineTo(cx, cy + r); g.lineTo(cx + r * 0.3, cy - r * 0.2); g.lineTo(cx, cy - r); g.stroke();
    });
  }
  function heart() {
    return Gfx.sprite("it_health", 30, 30, (g) => {
      g.fillStyle = rad(g, 15, 15, 0, 15, [[0, "rgba(120,255,140,0.5)"], [1, "rgba(120,255,140,0)"]]);
      circ(g, 15, 15, 15); g.fill();
      g.fillStyle = lin(g, 0, 6, 0, 26, [[0, "#eaffea"], [0.3, "#4cff70"], [1, "#0a7020"]]);
      rr(g, 6, 6, 18, 18, 5); g.fill(); g.strokeStyle = "rgba(0,0,0,0.6)"; g.lineWidth = 1.5; g.stroke();
      g.fillStyle = "#fff"; g.fillRect(13, 9, 4, 12); g.fillRect(9, 13, 12, 4);
    });
  }
  function oneUp() {
    return Gfx.sprite("it_life", 36, 32, (g) => {
      g.fillStyle = rad(g, 18, 16, 0, 18, [[0, "rgba(255,200,80,0.55)"], [1, "rgba(255,200,80,0)"]]);
      circ(g, 18, 16, 18); g.fill();
      g.fillStyle = lin(g, 0, 4, 0, 26, [[0, SUIT.hi], [0.4, SUIT.light], [1, SUIT.mid]]);
      rr(g, 8, 4, 20, 20, 7); g.fill(); g.strokeStyle = "#141820"; g.lineWidth = 1.4; g.stroke();
      g.fillStyle = `rgb(${SUIT.visor})`; rr(g, 15, 10, 11, 6, 2); g.fill();
      g.font = "900 10px Orbitron, Arial"; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillStyle = "#ffd24a"; g.fillText("1UP", 18, 28);
    });
  }
  function clock() {
    return Gfx.sprite("it_time", 30, 30, (g) => {
      g.fillStyle = rad(g, 15, 15, 0, 15, [[0, "rgba(255,255,160,0.5)"], [1, "rgba(255,255,160,0)"]]);
      circ(g, 15, 15, 15); g.fill();
      g.fillStyle = lin(g, 0, 5, 0, 25, [[0, "#fffbe0"], [1, "#c0a040"]]);
      circ(g, 15, 15, 10); g.fill(); g.strokeStyle = "#5a4010"; g.lineWidth = 2; g.stroke();
      g.strokeStyle = "#3a2a00"; g.lineWidth = 2; g.beginPath(); g.moveTo(15, 15); g.lineTo(15, 8); g.moveTo(15, 15); g.lineTo(20, 17); g.stroke();
    });
  }
  Spr.item = function (ctx, it, t) {
    const bob = Math.sin(t * 4 + (it.p || 0)) * 3;
    let c;
    if (it.type === "diamond") c = diamond(false);
    else if (it.type === "bigdiamond") c = diamond(true);
    else if (it.type === "health") c = heart();
    else if (it.type === "life") c = oneUp();
    else if (it.type === "time") c = clock();
    else c = capsule(it.type);
    const blink = it.life !== undefined && it.life < 3 && Math.floor(t * 10) % 2;
    if (blink) return;
    const sc = it.type === "diamond" ? 1 + 0.08 * Math.sin(t * 8 + (it.p || 0)) : 1;
    Gfx.put(ctx, c, it.x, it.y + bob, 0, sc);
    if (it.type === "diamond" || it.type === "bigdiamond") {
      const s = (t * 1.3 + (it.p || 0)) % 2;
      if (s < 0.3) Gfx.glowAt(ctx, "255,255,255", it.x + 3, it.y - 4 + bob, 8 * (1 - Math.abs(s - 0.15) / 0.15), 1, true);
    }
  };

  /* ---------- Projectiles ---------- */
  Spr.pbullet = function (ctx, b) {
    switch (b.kind) {
      case "spread": {
        Gfx.glowAt(ctx, "255,120,80", b.x, b.y, 14, 0.9);
        ctx.fillStyle = "#fff6e0"; circ(ctx, b.x, b.y, 3.2 + b.lvl * 0.4); ctx.fill();
        break;
      }
      case "laser": {
        const a = Math.atan2(b.vy, b.vx), len = 34 + b.lvl * 8, w = 2.5 + b.lvl * 1.2;
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(a);
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = "rgba(60,170,255,0.45)"; rr(ctx, -len, -w * 1.8, len + 8, w * 3.6, w * 1.8); ctx.fill();
        ctx.fillStyle = "rgba(180,235,255,0.95)"; rr(ctx, -len + 4, -w / 2, len + 2, w, w / 2); ctx.fill();
        ctx.restore();
        break;
      }
      case "bounce": {
        Gfx.glowAt(ctx, "90,255,120", b.x, b.y, 16, 0.9);
        ctx.fillStyle = "#eaffea"; circ(ctx, b.x, b.y, 4.5 + b.lvl * 0.5); ctx.fill();
        ctx.strokeStyle = "#30d050"; ctx.lineWidth = 1.5; ctx.stroke();
        break;
      }
      case "flame": {
        const f = U.clamp(1 - b.life / (b.max || 1), 0, 1);
        const r = 9 + f * 30 + b.lvl * 3;
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 0.6 * (1 - f * 0.6);
        ctx.drawImage(Gfx.glow(f < 0.5 ? "255,120,30" : "200,40,10"), b.x - r * 1.5, b.y - r * 1.5, r * 3, r * 3);
        ctx.globalAlpha = 0.9 * (1 - f * 0.8);
        ctx.drawImage(Gfx.glow(f < 0.3 ? "255,240,180" : f < 0.6 ? "255,170,50" : "230,70,20", f < 0.25), b.x - r, b.y - r, r * 2, r * 2);
        ctx.restore();
        break;
      }
      case "homing": {
        const a = Math.atan2(b.vy, b.vx);
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(a);
        ctx.fillStyle = "#d8d0f0"; rr(ctx, -9, -3, 16, 6, 3); ctx.fill();
        ctx.fillStyle = "#a040ff"; poly(ctx, [7, -3, 12, 0, 7, 3]); ctx.fill();
        ctx.fillStyle = "#504070"; poly(ctx, [-9, -3, -12, -6, -6, -3]); ctx.fill(); poly(ctx, [-9, 3, -12, 6, -6, 3]); ctx.fill();
        ctx.restore();
        Gfx.glowAt(ctx, "255,180,255", b.x - Math.cos(a) * 12, b.y - Math.sin(a) * 12, 10, 0.9, true);
        break;
      }
      case "mine": {
        const bl = Math.floor(b.t * (b.t > 0.8 ? 16 : 6)) % 2;
        ctx.fillStyle = "#30343e"; circ(ctx, b.x, b.y, 7); ctx.fill();
        ctx.strokeStyle = "#8a90a0"; ctx.lineWidth = 1.5; ctx.stroke();
        if (bl) Gfx.glowAt(ctx, "255,60,40", b.x, b.y - 2, 10, 1, true);
        break;
      }
    }
  };
  Spr.ebullet = function (ctx, b) {
    switch (b.kind) {
      case "orb": default: {
        const r = b.r || 6;
        Gfx.glowAt(ctx, b.rgb || "255,90,200", b.x, b.y, r * 3, 0.9);
        ctx.fillStyle = "#fff"; circ(ctx, b.x, b.y, r * 0.6); ctx.fill();
        break;
      }
      case "bolt": {
        const a = Math.atan2(b.vy, b.vx);
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(a); ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = `rgba(${b.rgb || "255,80,60"},0.6)`; rr(ctx, -14, -4, 22, 8, 4); ctx.fill();
        ctx.fillStyle = "#fff4e0"; rr(ctx, -10, -1.5, 16, 3, 1.5); ctx.fill();
        ctx.restore();
        break;
      }
      case "missile": {
        const a = Math.atan2(b.vy, b.vx);
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(a);
        ctx.fillStyle = "#c8c8c0"; rr(ctx, -11, -4, 20, 8, 4); ctx.fill();
        ctx.fillStyle = "#e03020"; poly(ctx, [9, -4, 15, 0, 9, 4]); ctx.fill();
        ctx.fillStyle = "#606058"; poly(ctx, [-11, -4, -15, -8, -7, -4]); ctx.fill(); poly(ctx, [-11, 4, -15, 8, -7, 4]); ctx.fill();
        ctx.restore();
        Gfx.glowAt(ctx, "255,170,60", b.x - Math.cos(a) * 14, b.y - Math.sin(a) * 14, 12, 0.9, true);
        break;
      }
      case "bomb": {
        ctx.fillStyle = "#2a2a30"; circ(ctx, b.x, b.y, 7); ctx.fill();
        ctx.fillStyle = "#606070"; circ(ctx, b.x - 2, b.y - 2, 2.5); ctx.fill();
        Gfx.glowAt(ctx, "255,120,40", b.x, b.y - 7, 6, 0.9, true);
        break;
      }
      case "shard": {
        const a = Math.atan2(b.vy, b.vx);
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(a);
        ctx.fillStyle = "#f0d0ff"; poly(ctx, [10, 0, 0, -4, -10, 0, 0, 4]); ctx.fill();
        ctx.restore();
        Gfx.glowAt(ctx, "220,140,255", b.x, b.y, 12, 0.8);
        break;
      }
      case "spore": {
        Gfx.glowAt(ctx, "160,255,80", b.x, b.y, 16, 0.8);
        ctx.fillStyle = "#d8ff9a"; circ(ctx, b.x, b.y, 5); ctx.fill();
        ctx.fillStyle = "#4a8a10"; circ(ctx, b.x + 1, b.y + 1, 2); ctx.fill();
        break;
      }
      case "fire": {
        Gfx.glowAt(ctx, "255,140,40", b.x, b.y, 20, 0.9, true);
        Gfx.glowAt(ctx, "255,60,20", b.x - b.vx * 0.03, b.y - b.vy * 0.03, 16, 0.6);
        break;
      }
    }
  };
})(window.XA);
