/* Woolly Wallop: the level screen – aiming the slingshot, tricks in flight, drawing the world,
   HUD and pause menu */
"use strict";

(function (WW) {
  const { U, D, G, S, Store, States } = WW;
  const A = WW.Audio, I = WW.Input;
  const W = U.W, H = U.H, C = D.C;
  const inR = (m, b) => m.x >= b.x && m.x <= b.x + b.w && m.y >= b.y && m.y <= b.y + b.h;
  const PAUSE = { x: W - 64, y: 10, w: 52, h: 46 };
  const RESTART = { x: W - 124, y: 10, w: 52, h: 46 };

  const P = (States.play = { menu: false, t: 0, menuBtns: [] });
  // the camera: the whole level while aiming, closer while a sheep flies
  const cam = { sc: 32, x0: -1, wide: 32, xMin: -1, xMax: 30, fx: 0 };
  const toWorld = (x, y) => ({ x: x / cam.sc + cam.x0, y: (y - S.GROUND_Y) / cam.sc });
  const toScreen = (x, y) => ({ x: (x - cam.x0) * cam.sc, y: S.GROUND_Y + y * cam.sc });
  function camUpdate(s, dt, snap) {
    let tsc = cam.wide, tx0 = cam.xMin;
    const fly = s.flying.filter((b) => !b.dead);
    if (s.phase === "fly" && fly.length) cam.fx = fly.reduce((a, b) => a + b.x, 0) / fly.length;
    if ((s.phase === "fly" && fly.length) || (s.phase === "settle" && s.phaseT < 2.5)) {
      tsc = cam.wide * 1.4;
      let top = 0;
      for (const b of fly) top = Math.min(top, b.y - 2);
      tsc = Math.max(cam.wide, Math.min(tsc, (S.GROUND_Y - 70) / Math.max(1, -top)));
      const vw = W / tsc;
      tx0 = U.clamp(cam.fx - vw * 0.45, cam.xMin, cam.xMax - vw);
    }
    const k = snap ? 1 : Math.min(1, dt * 2.5);
    cam.sc += (tsc - cam.sc) * k; cam.x0 += (tx0 - cam.x0) * k;
  }

  P.enter = function (arg) {
    if (arg && arg.idx !== undefined) { this.idx = arg.idx; this.begin(); }
    this.menu = false;
  };
  P.begin = function () {
    G.on = (t, d) => this.event(t, d);
    const s = G.start(this.idx);
    cam.xMin = -1; cam.xMax = s.lv.w; cam.wide = W / (cam.xMax - cam.xMin);
    camUpdate(s, 0, true);
    this.t = 0; this.endT = 0; this.drag = null; this.blinkT = 2; this.lastStretch = 0;
    this.ang = 0.55; this.pow = 0.8;
    s.pull = this.keyPull();
    A.playSong(s.world.song);
  };
  P.keyPull = function () { const r = this.pow * G.MAXPULL; return { x: -Math.cos(this.ang) * r, y: Math.sin(this.ang) * r }; };
  P.pause = function () { if (!this.menu && G.s && !G.s.over) { this.menu = true; this.drag = null; this.buildMenu(); } };

  P.event = function (t, d) {
    switch (t) {
      case "ready": if (d) A.sfx("baa", d); break;
      case "launch": A.sfx("launch"); A.sfx("baa", d.type); break;
      case "split": A.sfx("split"); break;
      case "dash": A.sfx("dash"); break;
      case "stomp": A.sfx("stomp"); break;
      case "baa": A.sfx("baa", d); break;
      case "boom": A.sfx("boom"); break;
      case "poof": A.sfx("poof"); break;
      case "bonus": A.sfx("bonus"); break;
      case "break": A.sfx(d === "boom" ? "woodBreak" : d + "Break"); break;
      case "wolf": A.sfx("wolf"); break;
      case "hit": {
        const v = Math.min(1, d.vn / 12), m = [d.a, d.b];
        if (m.includes("wolf")) A.sfx("wolfHurt");
        if (m.includes("ice")) A.sfx("iceHit", v);
        else if (m.includes("stone")) A.sfx("stoneHit", v);
        else if (m.includes("wood") || m.includes("boom")) A.sfx("woodHit", v);
        else A.sfx("thud", v);
        break;
      }
      case "win": A.jingle("win"); A.say(d.stars === 3 ? "Perfect!" : "Wolves routed!", { gap: 0 }); break;
      case "lose": A.jingle("fail"); break;
    }
  };

  /* ---------- pause menu ---------- */
  P.buildMenu = function () {
    const x = W / 2 - 170;
    this.menuBtns = [
      { x, y: 210, w: 340, h: 62, label: "Resume", act: () => { this.menu = false; } },
      { x, y: 286, w: 340, h: 58, label: "Restart level", color: C.blue, act: () => { this.menu = false; this.begin(); } },
      { x, y: 356, w: 340, h: 58, label: "Options", color: C.blue, act: () => WW.Main.setState("options", { back: "play" }) },
      { x, y: 426, w: 340, h: 58, label: "How to play", color: C.blue, act: () => WW.Main.setState("help", { back: "play" }) },
      { x, y: 510, w: 340, h: 58, label: "Quit to map", back: true, color: C.red, act: () => { G.on = null; WW.Main.setState("map", { idx: this.idx }); } },
    ];
    if (I.lastDevice !== "mouse") { const b = this.menuBtns[0]; I.mouse.x = b.x + b.w / 2; I.mouse.y = b.y + b.h / 2; }
  };

  /* ---------- controls ---------- */
  P.input = function (dt) {
    const s = G.s, m = I.mouse, pad = I.pad;
    if (this.menu) {
      if (I.hit("menu") || (I.hit("back") && !m.synthetic)) { this.menu = false; A.sfx("menuBack"); return; }
      WW.UI.runButtons(this.menuBtns);
      return;
    }
    if (I.hit("menu") || (m.clicked && inR(m, PAUSE))) { m.clicked = false; A.sfx("menuOk"); this.pause(); return; }
    if (s.over) return;
    if (I.hit("restart") || (m.clicked && inR(m, RESTART))) { m.clicked = false; A.sfx("menuBack"); this.begin(); return; }
    const sw = toWorld(m.x, m.y);
    if (s.phase === "aim") {
      // drag with the mouse or a finger
      if (m.clicked && !m.synthetic) {
        const near = Math.hypot(sw.x - G.SLING.x, sw.y - G.SLING.y) < 2.6;
        this.drag = { near, sx: sw.x, sy: sw.y };
      }
      if (this.drag && m.down) {
        const p = this.drag.near ? { x: sw.x - G.SLING.x, y: sw.y - G.SLING.y } : { x: sw.x - this.drag.sx, y: sw.y - this.drag.sy };
        s.pull = G.clampPull(p.x, p.y);
        const pw = Math.hypot(s.pull.x, s.pull.y);
        if (Math.abs(pw - this.lastStretch) > 0.35) { this.lastStretch = pw; A.sfx("stretch"); }
      }
      if (this.drag && !m.down) {
        this.drag = null; this.lastStretch = 0;
        if (!G.fire(s.pull)) { s.pull = this.keyPull(); }
        return;
      }
      // keys: left/right set the angle, up/down the power
      let used = false;
      if (I.keys.has("ArrowLeft") || pad.buttons[14]) { this.ang = Math.min(1.45, this.ang + dt * 0.9); used = true; }
      if (I.keys.has("ArrowRight") || pad.buttons[15]) { this.ang = Math.max(-0.5, this.ang - dt * 0.9); used = true; }
      if (I.keys.has("ArrowUp") || pad.buttons[12]) { this.pow = Math.min(1, this.pow + dt * 0.6); used = true; }
      if (I.keys.has("ArrowDown") || pad.buttons[13]) { this.pow = Math.max(0.25, this.pow - dt * 0.6); used = true; }
      if (used) s.pull = this.keyPull();
      // the stick pulls the band directly
      const [ax, ay] = pad.connected ? pad.axes : [0, 0];
      if (Math.hypot(ax, ay) > 0.3) {
        s.pull = G.clampPull(ax * G.MAXPULL, ay * G.MAXPULL);
        this.ang = Math.atan2(s.pull.y, -s.pull.x); this.pow = Math.hypot(s.pull.x, s.pull.y) / G.MAXPULL;
      }
      if (I.hit("fire") && !this.drag) G.fire(s.pull);
    } else if (s.phase === "fly") {
      if ((m.clicked && !m.synthetic) || I.hit("fire")) G.ability();
    }
  };

  P.update = function (dt) {
    if (this.menu) return;
    const s = G.s;
    this.t += dt;
    this.blinkT -= dt; if (this.blinkT < -0.15) this.blinkT = U.rand(2, 5);
    G.update(dt);
    camUpdate(s, dt);
    if (s.over) {
      this.endT += dt;
      if (this.endT > (s.over.win ? 1.6 : 2.2)) this.finish();
    }
  };
  P.finish = function () {
    const s = G.s, o = s.over;
    G.on = null;
    const best = Store.get("best", {});
    let newBest = false;
    if (o.win) {
      const stars = Store.get("stars", {});
      if (!best[s.idx] || s.score > best[s.idx]) { best[s.idx] = s.score; newBest = true; Store.set("best", best); }
      stars[s.idx] = Math.max(stars[s.idx] || 0, o.stars); Store.set("stars", stars);
      const un = Store.get("unlocked", 0);
      if (s.idx + 1 > un && s.idx + 1 < WW.LEVELS.length) Store.set("unlocked", s.idx + 1);
    }
    WW.Main.setState("results", { idx: s.idx, win: o.win, score: s.score, over: o, newBest, best: best[s.idx] || 0 });
  };

  /* ---------- drawing ---------- */
  function queuePos(s, i) {
    const ty = s.queue[i], r = WW.SHEEP[ty].r;
    return { x: G.SLING.x - 1.3 - i * 1.15, y: -r - 0.42 * r, r, ty };
  }
  function drawWorld(c, s, t) {
    const pull = s.pull, sl = G.SLING;
    // trails of this shot and the last one
    c.fillStyle = "rgba(255,255,255,0.35)";
    for (const p of s.lastTrail) { c.beginPath(); c.arc(p.x, p.y, p.big ? 0.1 : 0.06, 0, U.TAU); c.fill(); }
    c.fillStyle = "rgba(255,255,255,0.85)";
    for (const p of s.trail) { c.beginPath(); c.arc(p.x, p.y, p.big ? 0.12 : 0.07, 0, U.TAU); c.fill(); }
    // the flock waiting in line
    const hopping = s.phase === "ready";
    for (let i = hopping ? 1 : (s.phase === "aim" ? 1 : 0); i < s.queue.length; i++) {
      const q = queuePos(s, i), hop = Math.max(0, Math.sin(t * 4 + i * 1.3)) * 0.15;
      const k = hopping ? U.ease(s.phaseT / 0.55) : 0;
      const prev = queuePos(s, Math.max(0, i - 1));
      const x = hopping && i > 0 ? U.lerp(q.x, prev.x, k) : q.x;
      S.sheep(c, q.ty, x, q.y - hop, q.r, 0, { t, blink: P.blinkT < 0 && i === 1 });
    }
    let pouch = null, inPouch = null;
    if (s.phase === "aim" && s.queue.length) {
      pouch = { x: sl.x + pull.x, y: sl.y + pull.y };
      inPouch = s.queue[0];
    } else if (s.phase === "ready" && s.queue.length) {
      const q = queuePos(s, 0), k = U.ease(s.phaseT / 0.55);
      const x = U.lerp(q.x, sl.x - 0.4, k), y = U.lerp(q.y, sl.y + 0.2, k) - Math.sin(k * Math.PI) * 1.5;
      S.sheep(c, q.ty, x, y, q.r, k * 0.5, { t, fly: true });
    }
    S.sling(c, sl.x, sl.y, "back", pouch || { x: sl.x - 0.24, y: sl.y + 0.12 });
    if (inPouch) {
      S.sheep(c, inPouch, pouch.x, pouch.y, WW.SHEEP[inPouch].r, Math.atan2(-pull.y, -pull.x) * 0.3, { t, fly: Math.hypot(pull.x, pull.y) > 0.5 });
      S.pouch(c, pouch, WW.SHEEP[inPouch].r);
    }
    // bodies
    for (const b of s.wd.bodies) {
      const d = b.data;
      if (!d || b.dead) continue;
      if (d.kind === "ground" && d.hill) S.hill(c, b, s.world);
      else if (d.kind === "block") S.block(c, b);
    }
    for (const b of s.wd.bodies) {
      const d = b.data;
      if (!d || b.dead) continue;
      if (d.kind === "wolf") S.wolf(c, d.wk, b.x, b.y, b.r, b.a, { t, hp: d.hp / d.max, ouch: d.ouch, dizzy: true });
      else if (d.kind === "sheep") S.sheep(c, d.type, b.x, b.y, b.r, b.a, { t, fly: true, mood: d.hit ? "dizzy" : "fly", fuse: d.type === "boomer" && d.hit && !d.used });
    }
    S.sling(c, sl.x, sl.y, "front", pouch || { x: sl.x + 0.28, y: sl.y + 0.12 });
    // the aiming line
    if (s.phase === "aim" && Math.hypot(pull.x, pull.y) > 0.3) {
      const pts = G.preview(pull);
      pts.forEach((p, i) => {
        if (p.y > 0 || p.x > s.lv.w) return;
        c.globalAlpha = 1 - i / pts.length;
        D.circle(c, p.x, p.y, 0.09, "#fff", "rgba(42,26,16,0.6)", 0.03);
      });
      c.globalAlpha = 1;
    }
    // effects
    for (const p of s.fx) {
      const k = p.t / p.life;
      if (p.k === "bit") { c.save(); c.translate(p.x, p.y); c.rotate(p.a); c.globalAlpha = Math.min(1, (1 - k) * 2); c.fillStyle = p.col; c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); c.restore(); }
      else if (p.k === "dust") { c.globalAlpha = (1 - k) * 0.6; D.circle(c, p.x, p.y, p.r * (1 + k), "#e8dcc8", null); }
      else if (p.k === "wool") { c.globalAlpha = 1 - k; D.circle(c, p.x, p.y, p.r, "#fffaf0", "rgba(42,26,16,0.5)", 0.03); }
      else if (p.k === "stars") { c.globalAlpha = 1 - k; c.save(); c.translate(p.x, p.y); c.rotate(p.t * 6); star(c, p.r); c.restore(); }
      else if (p.k === "flash") {
        c.globalAlpha = 1 - k;
        D.circle(c, p.x, p.y, p.r * (0.4 + k), "rgba(255,230,120,0.8)", null);
        D.circle(c, p.x, p.y, p.r * 0.5 * (1 - k), "#fff", null);
        D.circle(c, p.x, p.y, p.r * (0.6 + k * 0.8), null, "rgba(255,255,255,0.8)", 0.12);
      }
      c.globalAlpha = 1;
    }
  }
  function star(c, r) {
    c.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    c.closePath(); c.fillStyle = "#ffd23a"; c.fill(); c.lineWidth = S.px * 2; c.strokeStyle = "#2a1a10"; c.stroke();
  }
  function hud(c, s) {
    D.rr(c, 14, 10, 280, 48, 16, "rgba(74,44,24,0.85)", C.ink, 3);
    D.text(c, U.fmt(s.score), 34, 36, 34, "#fff", "left", { head: true, lw: 6 });
    const wi = s.lv.world, li = s.idx - WW.LEVELS.findIndex((l) => l.world === wi);
    D.rr(c, W / 2 - 200, 10, 400, 48, 16, "rgba(74,44,24,0.85)", C.ink, 3);
    D.text(c, `${wi + 1}-${li + 1}  ${s.lv.name}`, W / 2, 36, 28, C.gold, "center", { head: true, lw: 6 });
    // wolves left
    const left = G.wolvesLeft();
    D.rr(c, W - 330, 10, 196, 48, 16, "rgba(74,44,24,0.85)", C.ink, 3);
    c.save(); c.translate(W - 302, 36); c.scale(36, 36); S.px = 1 / 36; S.wolf(c, "wolf", 0, 0, 0.42, 0, { hp: 1 }); c.restore();
    D.text(c, `× ${left}`, W - 278, 36, 30, "#fff", "left", { head: true, lw: 6 });
    // buttons
    for (const [b, k] of [[PAUSE, "pause"], [RESTART, "restart"]]) {
      D.button(c, Object.assign({ label: "" }, b), inR(I.mouse, b), { color: C.blue });
      c.fillStyle = "#fff"; c.strokeStyle = "#fff";
      if (k === "pause") { c.fillRect(b.x + 17, b.y + 13, 6, 20); c.fillRect(b.x + 29, b.y + 13, 6, 20); }
      else {
        c.lineWidth = 5; c.lineCap = "round"; c.beginPath(); c.arc(b.x + 26, b.y + 23, 10, -0.3, 4.6); c.stroke();
        c.beginPath(); c.moveTo(b.x + 37, b.y + 12); c.lineTo(b.x + 37, b.y + 22); c.lineTo(b.x + 28, b.y + 20); c.closePath(); c.fill();
      }
    }
    // hints
    if (s.phase === "aim" && s.shots === 0 && P.t > 1.2 && !P.drag) {
      const p = toScreen(G.SLING.x, G.SLING.y);
      D.text(c, I.lastDevice === "mouse" ? (I.touch ? "Drag back and let go" : "Pull back and let go") : I.lastDevice === "pad" ? "Stick to pull, A to shoot" : "Arrows aim, Space shoots", p.x + 30, p.y - 90, 24, "#fff", "left", { head: true, lw: 6 });
    }
    if (G.canAbility() && s.cur && s.cur.data.t < 2.5) {
      const p = toScreen(s.cur.x, s.cur.y);
      if (Math.sin(P.t * 10) > -0.3) D.text(c, I.touch ? "Tap!" : I.lastDevice === "mouse" ? "Click!" : I.lastDevice === "pad" ? "A!" : "Space!", p.x, p.y - 44, 26, C.gold, "center", { head: true, lw: 6 });
    }
    if (s.phase === "intro" || (s.phase === "ready" && s.shots === 0)) {
      const k = s.phase === "intro" ? U.ease(s.phaseT * 3) : 1 - U.ease(s.phaseT * 2);
      c.globalAlpha = k;
      D.text(c, WW.WORLDS[s.lv.world].name, W / 2, 210, 30, C.paper, "center", { head: true, lw: 6 });
      D.text(c, s.lv.name, W / 2, 262, 64, C.gold, "center", { head: true, lw: 11 });
      c.globalAlpha = 1;
    }
    if (s.phase === "bonus" || (s.over && s.over.win)) D.text(c, "Wolves routed!", W / 2, 200, 70, C.gold, "center", { head: true, lw: 12 });
    else if (s.over && !s.over.win) D.text(c, "Out of sheep!", W / 2, 200, 70, C.red, "center", { head: true, lw: 12 });
    // remaining tricks for this sheep: a hint for the type in the sling
    if (s.phase === "aim" && s.queue.length) {
      const def = WW.SHEEP[s.queue[0]];
      D.text(c, `${def.name}: ${def.tip}`, 24, H - 26, 22, "#fff", "left", { head: true, lw: 5 });
    }
  }
  P.draw = function (c) {
    const s = G.s, t = this.t;
    S.backdrop(c, s.world);
    c.save();
    if (s.shake > 0) c.translate(U.rand(-1, 1) * s.shake * 14, U.rand(-1, 1) * s.shake * 10);
    c.translate(0, S.GROUND_Y); c.scale(cam.sc, cam.sc); c.translate(-cam.x0, 0); S.px = 1 / cam.sc;
    drawWorld(c, s, t);
    c.restore();
    for (const x of s.texts) {
      const p = toScreen(x.x, x.y), a = U.clamp(1.4 - x.t, 0, 1);
      c.globalAlpha = a;
      D.text(c, x.s, p.x, p.y, x.big ? 34 : 24, x.col, "center", { head: true, lw: 6 });
      c.globalAlpha = 1;
    }
    hud(c, s);
    if (this.menu) {
      c.fillStyle = "rgba(30,15,5,0.55)"; c.fillRect(0, 0, W, H);
      D.panel(c, W / 2 - 220, 120, 440, 480, { title: "Paused" });
      WW.UI.drawButtons(c, this.menuBtns);
    }
    if (I.showCursor()) D.hand(c, I.mouse.x, I.mouse.y);
  };
})(window.WW);
