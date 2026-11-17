/* Pearl Panic: the level screen – drawing the chains, aiming and shooting, HUD, pause menu */
"use strict";

(function (PP) {
  const { U, D, G, S, Store, States } = PP;
  const A = PP.Audio, I = PP.Input;
  const W = U.W, H = U.H, C = D.C;
  const inR = (m, b) => m.x >= b.x && m.x <= b.x + b.w && m.y >= b.y && m.y <= b.y + b.h;
  const PAUSE = { x: W - 64, y: 10, w: 52, h: 46 };
  const TURN = 2.6; // keyboard turning speed (rad/s)

  const P = (States.play = { menu: false, t: 0, endT: 0, introT: 0, menuBtns: [] });

  P.enter = function (arg) {
    if (arg && arg.idx !== undefined) {
      this.idx = arg.idx;
      this.begin(arg.keep);
    }
    this.menu = false;
  };
  P.begin = function (keep) {
    G.on = (t, d) => this.event(t, d);
    const s = G.start(this.idx, keep);
    S.resetTracks();
    this.t = 0; this.endT = 0; this.introT = 3; this.blinkT = 2; this.dangerOn = false; this.ouch = 0;
    A.playSong(s.world.song);
    A.say(s.lv.name, { gap: 0 });
    const m = I.mouse;
    if (I.lastDevice !== "mouse") { m.x = s.shooter.x; m.y = s.shooter.y - 200; }
    G.aimAt(m.x, m.y);
    if (Math.hypot(m.x - s.shooter.x, m.y - s.shooter.y) < 30) s.shooter.ang = -Math.PI / 2;
  };
  P.pause = function () { if (!this.menu && G.s && !G.s.over) { this.menu = true; this.buildMenu(); } };

  P.event = function (t, d) {
    switch (t) {
      case "shoot": A.sfx("shoot"); break;
      case "swap": A.sfx("swap"); break;
      case "insert": A.sfx("insert"); break;
      case "clack": A.sfx("clack"); break;
      case "pop":
        A.sfx("pop", d.combo);
        if (d.combo) { A.sfx("combo", d.combo); if (d.combo >= 2) A.say(d.combo >= 4 ? "Incredible!" : d.combo >= 3 ? "Fantastic!" : "Combo!", { gap: 900 }); }
        else if (d.n >= 5) A.say("Great!", { gap: 1500 });
        break;
      case "power": A.sfx(d); A.say(S.POWER_NAME[d], { gap: 0 }); break;
      case "coin": A.sfx("coin"); break;
      case "life": A.sfx("life"); A.say("Extra life!", { gap: 0 }); break;
      case "dying": A.stopMusic(); A.sfx("slurp"); break;
      case "lost": A.sfx("lose"); break;
      case "clear": A.jingle("win"); A.say(d.ace ? "Ace time!" : "Level clear!", { gap: 0 }); break;
    }
  };

  /* ---------- pause menu ---------- */
  P.buildMenu = function () {
    const x = W / 2 - 170;
    this.menuBtns = [
      { x, y: 230, w: 340, h: 62, label: "Resume", act: () => { this.menu = false; } },
      { x, y: 306, w: 340, h: 58, label: "Restart level", color: C.blue, act: () => { this.menu = false; this.begin(); } },
      { x, y: 376, w: 340, h: 58, label: "Options", color: C.blue, act: () => PP.Main.setState("options", { back: "play" }) },
      { x, y: 446, w: 340, h: 58, label: "How to play", color: C.blue, act: () => PP.Main.setState("help", { back: "play" }) },
      { x, y: 530, w: 340, h: 58, label: "Quit to map", back: true, color: C.red, act: () => { G.on = null; PP.Main.setState("map", { idx: this.idx }); } },
    ];
    if (I.lastDevice !== "mouse") { const b = this.menuBtns[0]; I.mouse.x = b.x + b.w / 2; I.mouse.y = b.y + b.h / 2; }
  };

  /* ---------- controls ---------- */
  P.input = function (dt) {
    const s = G.s, m = I.mouse, pad = I.pad;
    if (this.menu) {
      if (I.hit("menu") || I.hit("back") && !I.mouse.synthetic) { this.menu = false; A.sfx("menuBack"); return; }
      PP.UI.runButtons(this.menuBtns);
      return;
    }
    if (I.hit("menu") || m.clicked && inR(m, PAUSE)) { m.clicked = false; A.sfx("menuOk"); this.pause(); return; }
    if (s.over || s.dying) return;
    const sh = s.shooter;
    // aiming: the pointer, the arrow keys, or a stick
    if (m.moved && I.lastDevice === "mouse") G.aimAt(m.x, m.y);
    let turn = 0;
    if (I.keys.has("ArrowLeft") || I.keys.has("ArrowUp") || pad.buttons[14]) turn -= 1;
    if (I.keys.has("ArrowRight") || I.keys.has("ArrowDown") || pad.buttons[15]) turn += 1;
    if (turn) { G.turn(turn * TURN * dt * (I.keys.has("ShiftLeft") ? 0.35 : 1)); this.syncCursor(); }
    const ax = pad.connected ? (Math.abs(pad.rx || 0) + Math.abs(pad.ry || 0) > 0.5 ? [pad.rx, pad.ry] : pad.axes) : [0, 0];
    if (Math.hypot(ax[0], ax[1]) > 0.5) { sh.ang = Math.atan2(ax[1], ax[0]); this.syncCursor(); }
    // fire and swap
    const tapPuffer = m.clicked && !m.synthetic && Math.hypot(m.x - sh.x, m.y - sh.y) < 56;
    if (I.hit("swap") || m.rclicked || tapPuffer) { G.swap(); m.clicked = false; }
    if (I.hit("fire") || (m.clicked && !m.synthetic)) {
      if (m.clicked && !m.synthetic) G.aimAt(m.x, m.y);
      G.fire();
    }
  };
  // the gamepad and the keys move an aiming cursor along the aim
  P.syncCursor = function () {
    const sh = G.s.shooter;
    I.mouse.x = sh.x + Math.cos(sh.ang) * 160; I.mouse.y = sh.y + Math.sin(sh.ang) * 160;
  };

  P.update = function (dt) {
    if (this.menu) return;
    const s = G.s;
    this.t += dt;
    this.introT = Math.max(0, this.introT - dt);
    this.blinkT -= dt; if (this.blinkT < -0.12) this.blinkT = U.rand(2, 5);
    // the gamepad's left stick moves the cursor; the puffer follows it
    if (I.lastDevice === "pad" && Math.hypot(I.pad.axes[0], I.pad.axes[1]) > 0.2 && !(Math.abs(I.pad.rx || 0) + Math.abs(I.pad.ry || 0) > 0.5)) {
      if (Math.hypot(I.mouse.x - s.shooter.x, I.mouse.y - s.shooter.y) > 20) G.aimAt(I.mouse.x, I.mouse.y);
    }
    G.update(dt);
    // danger: heartbeat and the fast song
    if (!s.over && !s.dying) {
      if (s.danger > 0.8) { A.sfx("danger"); if (!this.dangerOn) { this.dangerOn = true; A.playSong("danger"); } }
      else if (this.dangerOn && s.danger < 0.7) { this.dangerOn = false; A.playSong(s.world.song); }
    }
    if (s.over) {
      this.endT += dt;
      if (s.over.win && this.endT > 2.6) this.finish();
      else if (!s.over.win && this.endT > 1.8) {
        if (s.over.out) this.finish();
        else { this.begin({ score: 0, lives: s.lives, deaths: s.deaths + 1 }); this.ouch = 2; }
      }
    }
  };
  P.finish = function () {
    const s = G.s, o = s.over;
    G.on = null;
    let newBest = false, unlocked = false;
    if (o.win) {
      const best = Store.get("best", {}), stars = Store.get("stars", {});
      if (!best[s.idx] || s.score > best[s.idx]) { best[s.idx] = s.score; newBest = true; Store.set("best", best); }
      stars[s.idx] = Math.max(stars[s.idx] || 0, o.stars); Store.set("stars", stars);
      const un = Store.get("unlocked", 0);
      if (s.idx + 1 > un && s.idx + 1 < PP.LEVELS.length) { Store.set("unlocked", s.idx + 1); unlocked = true; }
    }
    PP.Main.setState("results", { idx: s.idx, win: o.win, score: s.score, over: o, newBest, unlocked });
  };

  /* ---------- drawing ---------- */
  function drawChains(c, s) {
    for (const tr of s.tracks) {
      for (const q of tr.balls) {
        if (q.vd < -18) continue;
        let p = G.pos(tr, q.vd), x = p.x, y = p.y;
        if (q.ins > 0 && q.fromX !== undefined) { const k = U.ease(q.ins); x += (q.fromX - x) * k; y += (q.fromY - y) * k; }
        // pearls rise out of the spout
        const sc = q.vd < 18 ? U.clamp((q.vd + 18) / 36, 0.2, 1) : 1;
        S.pearl(c, x, y, q.c, q.roll * 0.5, { power: q.power, glow: q.power ? s.t : 0, scale: sc });
      }
    }
  }
  function drawClams(c, s) {
    for (const tr of s.tracks) {
      const p = tr.end;
      const front = tr.balls.length ? tr.balls[tr.balls.length - 1].d / tr.path.len : 0;
      const open = s.dying ? 1 : U.clamp((front - 0.55) / 0.4, 0, 1) * (0.85 + Math.sin(s.t * 8) * 0.15 * (front > 0.8 ? 1 : 0));
      S.clam(c, p.x, p.y, p.a, open, s.t);
    }
  }
  function drawAim(c, s) {
    const sh = s.shooter;
    if (s.over || s.dying) return;
    const mx = sh.x + Math.cos(sh.ang) * 48, my = sh.y + Math.sin(sh.ang) * 48;
    const r = G.ray(mx, my, sh.ang);
    if (s.aimT > 0) {
      // a laser in the colour of the pearl
      c.save();
      c.globalAlpha = 0.5 + 0.2 * Math.sin(s.t * 20);
      D.line(c, mx, my, r.x, r.y, PP.G.COLORS[sh.cur], 8);
      D.line(c, mx, my, r.x, r.y, "#fff", 2.5);
      c.restore();
      D.circle(c, r.x, r.y, 9, "#fff", PP.G.COLORS[sh.cur], 4);
    } else {
      // a short dotted guide
      const len = Math.min(r.d, 170);
      c.fillStyle = "rgba(255,255,255,0.6)";
      for (let d = 14; d < len; d += 16) { const k = 1 - d / 190; c.globalAlpha = k; c.beginPath(); c.arc(mx + Math.cos(sh.ang) * d, my + Math.sin(sh.ang) * d, 3, 0, U.TAU); c.fill(); }
      c.globalAlpha = 1;
    }
  }
  function drawShots(c, s) {
    for (const sh of s.shots) {
      // a little trail of bubbles
      for (let k = 1; k <= 3; k++) D.circle(c, sh.x - sh.vx * 0.012 * k, sh.y - sh.vy * 0.012 * k, 6 - k * 1.4, "rgba(255,255,255,0.35)", null);
      S.pearl(c, sh.x, sh.y, sh.c, 0);
    }
  }
  function drawFx(c, s) {
    for (const p of s.fx) {
      const k = p.t / p.life;
      if (p.k === "bit") D.circle(c, p.x, p.y, p.r * (1 - k * 0.6), p.col, null);
      else if (p.k === "ring") { c.globalAlpha = 1 - k; D.circle(c, p.x, p.y, 10 + k * (p.col === "#fff2b0" ? 110 : 30), null, p.col, p.col === "#fff2b0" ? 8 : 4); c.globalAlpha = 1; }
      else if (p.k === "bubble") { c.globalAlpha = 1 - k; D.circle(c, p.x, p.y, p.r, null, "rgba(255,255,255,0.8)", 1.5); c.globalAlpha = 1; }
    }
    for (const x of s.texts) {
      const a = U.clamp(1.4 - x.t, 0, 1);
      c.globalAlpha = a;
      D.text(c, x.text, x.x, x.y, x.big ? 34 : 26, x.col, "center", { head: true, lw: 6 });
      c.globalAlpha = 1;
    }
  }
  function lifeIcon(c, x, y) {
    c.save(); c.translate(x, y); c.scale(0.3, 0.3);
    S.puffer(c, 0, 0, 0, { t: 0 });
    c.restore();
  }
  function hud(c, s) {
    // score and level
    D.rr(c, 14, 10, 300, 48, 16, "rgba(5,40,60,0.7)", "#bff0ff", 2.5);
    D.text(c, U.fmt(s.score), 34, 36, 32, C.gold, "left", { head: true, lw: 6 });
    const lv = s.lv, wi = lv.world, li = s.idx - PP.LEVELS.findIndex((l) => l.world === wi);
    D.rr(c, W / 2 - 190, 10, 380, 48, 16, "rgba(5,40,60,0.7)", "#bff0ff", 2.5);
    // progress: how many pearls are still to come
    const pr = G.progress();
    D.rr(c, W / 2 - 170, 40, 340, 10, 5, "rgba(0,0,0,0.4)", null);
    D.rr(c, W / 2 - 170, 40, Math.max(10, 340 * pr), 10, 5, pr >= 1 ? C.green : C.gold, null);
    D.text(c, `${wi + 1}-${li + 1}  ${lv.name}`, W / 2, 25, 22, C.paper, "center", { head: true, lw: 5 });
    // lives
    D.rr(c, W - 244, 10, 168, 48, 16, "rgba(5,40,60,0.7)", "#bff0ff", 2.5);
    const n = Math.min(s.lives, 5);
    for (let i = 0; i < n; i++) lifeIcon(c, W - 220 + i * 30, 34);
    if (s.lives > 5) D.text(c, "×" + s.lives, W - 90, 34, 22, C.paper, "right", { head: true, lw: 5 });
    // pause button
    D.button(c, Object.assign({ label: "" }, PAUSE), inR(I.mouse, PAUSE), { color: C.blue });
    c.fillStyle = "#fff"; c.fillRect(PAUSE.x + 17, PAUSE.y + 13, 6, 20); c.fillRect(PAUSE.x + 29, PAUSE.y + 13, 6, 20);
    // power timers
    let px = 30;
    for (const [k, t, max] of [["slow", s.slowT, 7], ["back", s.backT, 2.6], ["aim", s.aimT, 12]]) {
      if (t <= 0) continue;
      D.circle(c, px, H - 34, 22, "rgba(5,40,60,0.75)", "#bff0ff", 2.5);
      c.beginPath(); c.moveTo(px, H - 34); c.arc(px, H - 34, 19, -Math.PI / 2, -Math.PI / 2 + U.TAU * (t / max)); c.closePath(); c.fillStyle = "rgba(255,214,90,0.5)"; c.fill();
      S.powerIcon(c, k, px, H - 34, 1.1);
      px += 54;
    }
    // combo
    if (s.combo > 0 && !s.over) D.text(c, `Combo ×${s.combo + 1}`, W - 24, H - 30, 28, C.gold, "right", { head: true, lw: 6 });
  }
  P.draw = function (c) {
    const s = G.s, t = this.t;
    S.world(c, s.world, t);
    if (s.danger > 0.8 && !s.over) { c.fillStyle = `rgba(255,40,40,${0.08 + 0.06 * Math.sin(t * 8)})`; c.fillRect(0, 0, W, H); }
    S.tracks(c, s);
    drawClams(c, s);
    for (const cn of s.coins) S.coin(c, cn.x, cn.y, cn.t, U.clamp(cn.life - cn.t, 0, 1));
    drawChains(c, s);
    drawAim(c, s);
    drawShots(c, s);
    const sh = s.shooter;
    S.puffer(c, sh.x, sh.y, sh.ang, { t, kick: sh.kick, cur: s.over || s.dying ? null : sh.cur, next: s.over || s.dying ? null : sh.next, blink: this.blinkT < 0 });
    drawFx(c, s);
    hud(c, s);
    // banners
    if (this.introT > 0) {
      const a = U.clamp(this.introT, 0, 1), k = U.ease(Math.min(1, (3 - this.introT) * 3));
      c.globalAlpha = a;
      const lv = s.lv;
      D.text(c, PP.WORLDS[lv.world].name, W / 2, 300 - (1 - k) * 40, 30, C.paper, "center", { head: true, lw: 6 });
      D.text(c, lv.name, W / 2, 352, 64, C.gold, "center", { head: true, lw: 10 });
      if (this.ouch > 0) D.text(c, `${s.lives} ${s.lives === 1 ? "life" : "lives"} left`, W / 2, 410, 28, C.red, "center", { head: true, lw: 6 });
      c.globalAlpha = 1;
    }
    if (s.over && s.over.win) {
      const k = U.ease(this.endT * 2);
      D.text(c, s.over.ace ? "Ace time!" : "Level clear!", W / 2, 330, 40 + k * 40, C.gold, "center", { head: true, lw: 12 });
    } else if (s.dying || s.over && !s.over.win) {
      D.text(c, s.over && s.over.out ? "Out of lives!" : "Swallowed!", W / 2, 340, 72, C.red, "center", { head: true, lw: 12 });
    }
    if (this.menu) {
      c.fillStyle = "rgba(2,20,34,0.6)"; c.fillRect(0, 0, W, H);
      D.panel(c, W / 2 - 220, 140, 440, 480, { title: "Paused" });
      PP.UI.drawButtons(c, this.menuBtns);
    }
    if (I.showCursor() && this.menu) D.hand(c, I.mouse.x, I.mouse.y);
    else if (!this.menu && I.lastDevice !== "mouse" && !I.touch) D.reticle(c, I.mouse.x, I.mouse.y);
    else if (!this.menu && I.lastDevice === "mouse" && !I.touch) D.reticle(c, I.mouse.x, I.mouse.y, PP.G.COLORS[sh.cur]);
  };
})(window.PP);
