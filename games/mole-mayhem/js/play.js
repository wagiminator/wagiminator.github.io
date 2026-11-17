/* Mole Mayhem: the match screen – camera, landscape, moles and missiles, HUD, weapon menu,
   and control by keyboard, mouse, touch and gamepad */
"use strict";

(function (MM) {
  const { U, D, G, T } = MM;
  const A = MM.Audio, I = MM.Input, S = MM.Sprites;
  const W = U.W, H = U.H, C = D.C;
  const inR = (m, b) => m.x >= b.x && m.x <= b.x + b.w && m.y >= b.y && m.y <= b.y + b.h;

  /* ================= the world ================= */
  const V = (MM.View = {});
  const skyCache = {};
  function sky(themeId) {
    if (skyCache[themeId]) return skyCache[themeId];
    const th = T.THEMES[themeId], cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const g = cv.getContext("2d");
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, th.sky[0]); gr.addColorStop(1, th.sky[1]);
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    if (themeId === "volcano") { const r = U.rng(3); for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,${120 + r() * 80},60,${0.2 + r() * 0.5})`; g.fillRect(r() * W, r() * H * 0.7, 2, 2); } }
    skyCache[themeId] = cv;
    return cv;
  }
  function backdrop(c, s, cam) {
    const th = s.t.theme;
    c.drawImage(sky(s.t.themeId), 0, 0);
    // far ridges and hills with parallax
    for (const [par, base, amp, col, sc] of [[0.15, 0.62, 160, th.far, 380], [0.35, 0.74, 120, th.mid, 210]]) {
      c.fillStyle = col;
      c.beginPath(); c.moveTo(0, H);
      for (let x = 0; x <= W; x += 12) {
        const wx = x / cam.z + cam.x * par;
        c.lineTo(x, H * base - T.vnoise(wx, 0, sc, 4) * amp - T.vnoise(wx, 9, sc / 4, 5) * amp * 0.25 - (cam.y - 500) * par * 0.3);
      }
      c.lineTo(W, H); c.closePath(); c.fill();
    }
    // clouds drifting with the wind
    c.fillStyle = s.t.themeId === "volcano" ? "rgba(60,30,30,0.5)" : "rgba(255,255,255,0.7)";
    for (let i = 0; i < 6; i++) {
      const x = ((i * 410 + s.time * s.wind * 0.4 - cam.x * 0.25) % (W + 400) + W + 400) % (W + 400) - 200, y = 60 + (i * 97) % 200;
      for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(x + k * 36, y - (k % 2) * 16, 30, 0, U.TAU); c.fill(); }
    }
  }
  function water(c, s, cam, front) {
    const th = s.t.theme, wy = (s.water - cam.y) * cam.z + H / 2;
    if (wy > H + 20) return;
    c.save();
    c.globalAlpha = front ? 0.62 : 1;
    for (let row = front ? 1 : 0; row < (front ? 3 : 1); row++) {
      const off = row * 14, amp = 5 + row * 1.5;
      c.fillStyle = row % 2 ? th.water[1] : th.water[0];
      c.beginPath(); c.moveTo(0, H);
      for (let x = 0; x <= W; x += 10) {
        const wx = x / cam.z + cam.x;
        c.lineTo(x, wy + off - 8 + Math.sin(wx * 0.03 + s.time * (2 + row) + row) * amp);
      }
      c.lineTo(W, H); c.closePath(); c.fill();
    }
    c.restore();
  }

  function drawObj(c, s, o) {
    const t = s.time;
    switch (o.type) {
      case "barrel": S.barrel(c, o.x, o.y, o.burn >= 0); break;
      case "mine": S.mine(c, o.x, o.y, t, o.armed, o.fuseT >= 0); break;
      case "crate": S.crate(c, o.x, o.y, o.kind, o.chute, t); break;
      case "rocket": case "missile": case "airbomb": {
        c.save(); c.translate(o.x, o.y); c.rotate(Math.atan2(o.vy, o.vx));
        D.rr(c, -9, -3.5, 16, 7, 3, o.type === "missile" ? "#5a7aa8" : o.type === "airbomb" ? "#3a3a42" : "#5d7a3a", "#1b1410", 1.8);
        c.beginPath(); c.moveTo(7, -3.5); c.lineTo(12, 0); c.lineTo(7, 3.5); c.closePath(); c.fillStyle = "#e8473a"; c.fill(); c.stroke();
        if (o.type !== "airbomb") { c.fillStyle = Math.random() < 0.5 ? "#ffd13a" : "#ff7a2a"; c.beginPath(); c.moveTo(-9, -2.5); c.lineTo(-15 - Math.random() * 6, 0); c.lineTo(-9, 2.5); c.fill(); }
        c.restore();
        break;
      }
      case "grenade": case "cluster": case "frag":
        D.circle(c, o.x, o.y, o.type === "frag" ? 3 : 5, o.type === "grenade" ? "#4f6a3a" : "#7a6aa8", "#1b1410", 1.8);
        if (o.type !== "frag") { D.text(c, String(Math.max(1, Math.ceil(o.fuseT))), o.x, o.y - 14, 15, "#fff", "center", { lw: 4 }); }
        break;
      case "dynamite":
        D.rr(c, o.x - 3, o.y - 13, 6, 13, 2, "#d8352a", "#1b1410", 1.8);
        if (Math.random() < 0.8) D.circle(c, o.x + U.rand(-2, 2), o.y - 15 + U.rand(-2, 1), U.rand(1.5, 3), U.pick(["#fff2a0", "#ffb02a"]), null);
        D.text(c, String(Math.max(1, Math.ceil(o.fuseT))), o.x, o.y - 26, 15, "#fff", "center", { lw: 4 });
        break;
    }
  }
  function drawFx(c, s) {
    for (const p of s.fx) {
      const k = p.t / p.life;
      if (p.k === "flash") { D.circle(c, p.x, p.y, p.r * (0.6 + k * 0.9), `rgba(255,${230 - k * 120},${150 - k * 150},${(1 - k) * 0.9})`, null); D.circle(c, p.x, p.y, p.r * 0.5 * (1 - k), "rgba(255,255,255,0.9)", null); }
      else if (p.k === "spark") D.circle(c, p.x, p.y, p.r * (1 - k * 0.5), k < 0.4 ? "#fff2a0" : "#ff8a2a", null);
      else if (p.k === "fire") D.circle(c, p.x, p.y, p.r * (1 - k * 0.5), k < 0.5 ? "#ffd13a" : "#e8472a", null);
      else if (p.k === "smoke") D.circle(c, p.x, p.y, p.r, `rgba(90,90,90,${0.45 * (1 - k)})`, null);
      else if (p.k === "dirt") { c.fillStyle = "#6a4a2a"; c.fillRect(p.x - 1.5, p.y - 1.5, 3, 3); }
      else if (p.k === "tele") D.circle(c, p.x, p.y, 4 + k * 30, null, `rgba(140,220,255,${1 - k})`, 3);
    }
  }
  V.drawWorld = function (c, s, cam, opt = {}) {
    backdrop(c, s, cam);
    water(c, s, cam, false);
    T.flush(s.t);
    c.save();
    c.translate(W / 2, H / 2); c.scale(cam.z, cam.z); c.translate(-cam.x, -cam.y);
    c.drawImage(s.t.cv, 0, 0);
    for (const o of s.objs) drawObj(c, s, o);
    // rope
    if (s.rope && s.cur && s.cur.st === "rope") { D.line(c, s.cur.x, s.cur.y - 14, s.rope.x, s.rope.y, "#1b1410", 3.5); D.line(c, s.cur.x, s.cur.y - 14, s.rope.x, s.rope.y, "#d8b070", 1.8); }
    for (const m of s.moles) {
      if (m.dead) { if (m.st !== "drown") S.grave(c, m.x, m.y, m.col); continue; }
      const cur = m === s.cur && !s.over;
      let pose = m.st === "walk" ? "walk" : m.st === "air" || m.st === "jet" ? "air" : m.st === "rope" ? "rope" : "stand";
      const showWeapon = cur && (s.phase === "play") && !s.used && pose === "stand" && !opt.noWeapon;
      const wp = showWeapon ? s.weapon : null;
      S.mole(c, m.x, m.y + (m.st === "drown" ? 0 : 0), m.dir, { t: m.t + m.id, pose, team: m.col, weapon: wp, aim: s.aim, hurt: m.hp < 30, charge: s.power });
      if (m.st === "jet") { D.rr(c, m.x - m.dir * 12 - 4, m.y - 22, 8, 14, 3, "#9aa0aa", "#1b1410", 1.6); if (m.jetUp) D.circle(c, m.x - m.dir * 12, m.y - 4 + Math.random() * 4, 4, "#ffb02a", null); }
      if (!opt.noLabels && m.st !== "drown") {
        const col = D.TEAM[m.col];
        D.text(c, m.name, m.x, m.y - 48, 13, col, "center", { lw: 3.5 });
        D.text(c, String(Math.max(0, m.shown)), m.x, m.y - 34, 13, "#fff", "center", { lw: 3.5, oc: D.TEAM_D[m.col] });
      }
      if (cur && (s.phase === "start" || s.phase === "play") && m.st !== "drown") {
        const b = Math.sin(s.time * 6) * 5;
        c.save(); c.translate(m.x, m.y - 64 + b);
        c.beginPath(); c.moveTo(-8, -10); c.lineTo(8, -10); c.lineTo(0, 2); c.closePath(); c.fillStyle = D.TEAM[m.col]; c.fill(); c.lineWidth = 2.5; c.strokeStyle = "#1b1410"; c.stroke();
        c.restore();
      }
      // aim
      if (showWeapon && G.WEAPONS[s.weapon].aim) {
        const v = G.aimVec();
        D.reticle(c, m.x + v.x * 70, m.y - 12 + v.y * 70, D.TEAM[m.col]);
        if (s.charging) {
          for (let k = 0; k < 14; k++) {
            if (k / 14 > s.power) break;
            const d = 18 + k * 4;
            D.circle(c, m.x + v.x * d, m.y - 12 + v.y * d, 2 + k * 0.45, `hsl(${50 - k * 4},95%,55%)`, null);
          }
        }
      }
    }
    drawFx(c, s);
    if (opt.extra) opt.extra(c);
    c.restore();
    water(c, s, cam, true);
    // damage numbers
    c.save(); c.translate(W / 2, H / 2); c.scale(cam.z, cam.z); c.translate(-cam.x, -cam.y);
    for (const tx of s.texts) { c.globalAlpha = U.clamp(2.2 - tx.t, 0, 1); D.text(c, tx.text, tx.x, tx.y, 20, tx.col, "center", { lw: 5, oc: tx.oc || "#1b1410", head: true, weight: 400 }); }
    c.restore();
  };

  /* ================= the match state ================= */
  const States = MM.States;
  const P = (States.play = { cam: { x: 1200, y: 500, z: 0.8 }, menu: false, wmenu: false, manual: 0, t: 0, endT: 0, btns: [], menuBtns: [] });

  P.enter = function (arg) {
    if (arg && arg.cfg) {
      this.cfg = arg.cfg;
      G.start(arg.cfg);
      G.on = onEvent;
      MM.AI.reset();
      const s = G.s;
      this.cam = { x: s.cur.x, y: s.cur.y - 80, z: 1.1 };
      this.menu = false; this.wmenu = false; this.manual = 0; this.t = 0; this.endT = 0; this.msgT = 0;
      A.playSong(s.t.themeId);
      this.announce();
    }
  };
  P.pause = function () { if (!this.menu) { this.menu = true; this.wmenu = false; this.buildMenu(); } };
  P.announce = function () {
    const s = G.s, team = s.teams[s.team];
    this.msg = `${team.name} · ${s.cur.name}`; this.msgCol = D.TEAM[team.col]; this.msgT = 2.4;
  };
  function onEvent(type, d) {
    const s = G.s;
    switch (type) {
      case "turn": P.announce(); A.sfx("turn"); if (s.teams[s.team].ctrl === "human") A.say(s.cur.name + ", your turn", { gap: 0, interrupt: true }); P.manual = 0; P.wmenu = false; break;
      case "launch": A.sfx("launch"); break;
      case "throw": A.sfx("throw"); break;
      case "bounce": A.sfx("bounce"); break;
      case "boom": A.sfx("boom"); break;
      case "bigboom": A.sfx("bigboom"); break;
      case "smallboom": A.sfx("smallboom"); break;
      case "shot": A.sfx("shot"); break;
      case "whack": A.sfx("whack"); break;
      case "fuse": A.sfx("fuse"); break;
      case "jump": A.sfx("jump"); break;
      case "land": A.sfx("land"); break;
      case "ouch": A.sfx("ouch"); break;
      case "hurt": if (d.dmg >= 30 && Math.random() < 0.5) A.say(U.pick(["Ouch!", "Oof!", "Hey!", "Ow!"]), { gap: 1500, interrupt: false, pitch: 1.6 }); break;
      case "splash": A.sfx("splash"); if (d && d.team !== undefined) A.say(U.pick(["Help!", "Glub!", "Can't swim!"]), { gap: 800, pitch: 1.6 }); break;
      case "die": A.sfx("die"); break;
      case "crate": A.sfx("crate"); break;
      case "pickup": A.sfx("pickup"); break;
      case "heal": A.sfx("heal"); break;
      case "drillTick": A.sfx("drill"); break;
      case "torchTick": A.sfx("torch"); break;
      case "jet": A.sfx("jet"); break;
      case "rope": A.sfx("rope"); break;
      case "teleport": A.sfx("teleport"); for (const p of [d.from, d.to]) for (let i = 0; i < 4; i++) s.fx.push({ k: "tele", x: p.x, y: p.y - 12, t: -i * 0.08, life: 0.5 }); break;
      case "girder": A.sfx("girder"); break;
      case "airstrike": A.sfx("whoosh"); A.say("Air strike!", { gap: 0 }); break;
      case "beep": A.sfx("beep"); break;
      case "armed": A.sfx("armed"); break;
      case "hurry": A.sfx("hurry"); break;
      case "target": A.sfx("menuMove"); break;
      case "needTarget": A.sfx("deny"); P.flash("Click a target first"); break;
      case "deny": A.sfx("deny"); break;
      case "sudden": A.playSong("sudden"); A.say("Sudden death!", { gap: 0 }); P.flash("Sudden death – the sea is rising!"); break;
      case "surrender": A.say("We give up!", { gap: 0 }); break;
      case "over": P.endT = 0; if (d.winner) { A.jingle("win"); A.say(d.winner.name + " win!", { gap: 0 }); } else A.jingle("fail"); break;
    }
  }
  P.flash = function (text) { this.msg = text; this.msgCol = C.gold; this.msgT = 2.2; };

  const human = () => { const s = G.s; return s.teams[s.team].ctrl === "human" && !s.over; };
  const toWorld = (x, y) => { const c = P.cam; return { x: (x - W / 2) / c.z + c.x, y: (y - H / 2) / c.z + c.y }; };

  /* ---------- weapon menu ---------- */
  P.weaponGrid = function () {
    const list = G.WEAPON_ORDER, cols = 6, bw = 92, bh = 84, x0 = W - cols * (bw + 6) - 24, y0 = 90;
    return list.map((k, i) => ({ k, x: x0 + (i % cols) * (bw + 6), y: y0 + Math.floor(i / cols) * (bh + 6), w: bw, h: bh }));
  };
  // touch buttons
  P.touchButtons = function () {
    return [
      { id: "left", x: 20, y: H - 150, w: 90, h: 90 }, { id: "right", x: 120, y: H - 150, w: 90, h: 90 },
      { id: "jump", x: 230, y: H - 150, w: 90, h: 90 },
      { id: "up", x: W - 330, y: H - 200, w: 90, h: 80 }, { id: "down", x: W - 330, y: H - 110, w: 90, h: 80 },
      { id: "fire", x: W - 220, y: H - 170, w: 200, h: 120 },
      { id: "weapons", x: W - 120, y: 20, w: 100, h: 60 },
    ];
  };

  /* ---------- pause menu ---------- */
  P.buildMenu = function () {
    const x = W / 2 - 170;
    this.menuBtns = [
      { x, y: 240, w: 340, h: 62, label: "Resume", act: () => { this.menu = false; } },
      { x, y: 316, w: 340, h: 62, label: "Options", color: C.blue, act: () => MM.Main.setState("options", { back: "play" }) },
      { x, y: 392, w: 340, h: 62, label: "How to play", color: C.blue, act: () => MM.Main.setState("help", { back: "play" }) },
      { x, y: 468, w: 340, h: 62, label: "Quit match", color: C.red, act: () => MM.Main.setState("setup") },
    ];
  };

  /* ---------- input ---------- */
  P.input = function (dt) {
    const s = G.s, m = I.mouse;
    if (this.menu) {
      if (I.hit("menu") || I.hit("back")) { this.menu = false; A.sfx("menuBack"); return; }
      MM.UI.runButtons(this.menuBtns);
      return;
    }
    if (I.hit("menu")) { if (this.wmenu) this.wmenu = false; else this.pause(); return; }
    // zoom
    if (m.wheel && !(human() && s.weapon === "girder")) this.cam.z = U.clamp(this.cam.z * (m.wheel < 0 ? 1.1 : 1 / 1.1), 0.45, 1.8);
    if (I.held("zoomIn")) this.cam.z = U.clamp(this.cam.z * (1 + dt), 0.45, 1.8);
    if (I.held("zoomOut")) this.cam.z = U.clamp(this.cam.z * (1 - dt), 0.45, 1.8);
    if (I.pad.rx || I.pad.ry) { this.cam.x += I.pad.rx * 600 * dt / this.cam.z; this.cam.y += (I.pad.ry || 0) * 600 * dt / this.cam.z; this.manual = 3; }
    if (s.over) { if (this.endT > 2 && (m.clicked || I.hit("fire") || I.hit("jump"))) MM.Main.setState("results"); return; }
    if (!human()) { this.panDrag(); return; }
    const cur = s.cur;
    // weapon menu
    if (I.hit("weapons") || m.rclicked) { this.wmenu = !this.wmenu; A.sfx(this.wmenu ? "menuOk" : "menuBack"); }
    if (this.wmenu) {
      const team = s.teams[s.team];
      if (m.clicked) {
        const hit = this.weaponGrid().find((b) => inR(m, b));
        if (hit) { if (G.setWeapon(hit.k)) { A.sfx("menuOk"); this.wmenu = false; } else A.sfx("deny"); }
        else this.wmenu = false;
        m.clicked = false;
      }
      // keyboard and gamepad move through the grid
      const grid = this.weaponGrid();
      for (const [d, dx, dy] of [["left", -1, 0], ["right", 1, 0], ["up", 0, -1], ["down", 0, 1]]) {
        if (!I.hit(d)) continue;
        let i = grid.findIndex((b) => inR(m, b));
        if (i < 0) i = G.WEAPON_ORDER.indexOf(s.weapon);
        const ni = U.clamp(i + dx + dy * 6, 0, grid.length - 1);
        m.x = grid[ni].x + grid[ni].w / 2; m.y = grid[ni].y + grid[ni].h / 2;
        A.sfx("menuMove");
      }
      if (I.hit("jump") || I.hit("fire")) {
        const hit = grid.find((b) => inR(m, b));
        if (hit && G.setWeapon(hit.k)) { A.sfx("menuOk"); this.wmenu = false; }
      }
      return;
    }
    // touch buttons
    const tb = {};
    if (I.touch && m.down) for (const b of this.touchButtons()) if (inR(m, b)) tb[b.id] = true;
    const onButton = I.touch && this.touchButtons().some((b) => inR(m, b));
    if (I.touch && m.clicked && tb.weapons) { this.wmenu = true; m.clicked = false; return; }
    if (I.touch && m.clicked && tb.jump) G.jump(false);
    // movement and aim
    const padX = Math.abs(I.pad.axes[0]) > 0.5 ? Math.sign(I.pad.axes[0]) : 0, padY = Math.abs(I.pad.axes[1]) > 0.3 ? I.pad.axes[1] : 0;
    let dir = 0;
    if (I.keys.has("ArrowLeft") || I.pad.buttons[14] || padX < 0 || tb.left) dir = -1;
    if (I.keys.has("ArrowRight") || I.pad.buttons[15] || padX > 0 || tb.right) dir = 1;
    let ay = 0;
    if (I.keys.has("ArrowUp") || I.pad.buttons[12] || tb.up) ay = -1;
    if (I.keys.has("ArrowDown") || I.pad.buttons[13] || tb.down) ay = 1;
    if (padY) ay = padY;
    if (cur.st === "rope") {
      if (dir) G.walk(dir, dt);
      if (ay) G.ropeLen(ay * 120 * dt);
    } else if (cur.st === "jet") {
      if (ay < 0 || I.keys.has("Space") && false) G.jetUp();
      if (I.keys.has("ArrowUp") || tb.up) G.jetUp();
      if (dir) G.walk(dir, dt);
    } else {
      if (dir) G.walk(dir, dt);
      if (ay) {
        if (s.weapon === "girder") s.girderAng = ((s.girderAng || 0) + ay * 1.5 * dt);
        else G.aimBy(ay * 1.3 * dt);
      }
    }
    if (I.pressed.has("Enter") || I.pressed.has("NumpadEnter") || I.pad.pressed.has(0)) G.jump(false);
    if (I.hit("flip")) G.jump(true);
    for (let k = 1; k <= 5; k++) if (I.pressed.has("Digit" + k)) { s.fuse = k; A.sfx("tick"); }
    // fire
    const fireDown = I.keys.has("Space") || I.pad.buttons[2] || tb.fire;
    if ((I.pressed.has("Space") || I.pad.pressed.has(2) || (I.touch && m.clicked && tb.fire))) {
      if (s.tool) G.stopTool(); else G.firePress();
    }
    if (s.charging) { if (fireDown) G.chargeTick(dt); else G.fireRelease(); }
    // targets with the mouse (or the cursor moved by the stick)
    const w = G.WEAPONS[s.weapon];
    if (w.target && m.clicked && !m.synthetic && !onButton && !(I.touch && tb.fire)) {
      const p = toWorld(m.x, m.y);
      if (!G.setTarget(p.x, p.y)) A.sfx("deny");
      m.clicked = false;
    } else if (w.target && (I.pad.pressed.has(0) || m.synthetic) && I.lastDevice !== "mouse") {
      const p = toWorld(m.x, m.y);
      G.setTarget(p.x, p.y);
    }
    if (s.weapon === "girder" && m.wheel) s.girderAng = (s.girderAng || 0) + m.wheel * 0.2;
    if (!w.target && !onButton) this.panDrag();
  };
  // drag the map to look around
  P.panDrag = function () {
    const m = I.mouse;
    if (m.clicked && !m.synthetic && m.y < H - 10) this.drag = { x: m.x, y: m.y, cx: this.cam.x, cy: this.cam.y, moved: false };
    if (this.drag) {
      if (!m.down) { this.drag = null; return; }
      const dx = m.x - this.drag.x, dy = m.y - this.drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) this.drag.moved = true;
      if (this.drag.moved) { this.cam.x = this.drag.cx - dx / this.cam.z; this.cam.y = this.drag.cy - dy / this.cam.z; this.manual = 3; }
    }
  };

  P.update = function (dt) {
    const s = G.s;
    this.t += dt;
    if (this.menu) return;
    if (this.msgT > 0) this.msgT -= dt;
    if (s.over) this.endT += dt;
    MM.AI.update(dt);
    if (s.charging && !human()) G.chargeTick(dt);
    G.update(dt);
    // camera follows what matters, unless the player looks around
    this.manual -= dt;
    let f = s.focus;
    if (f && f.gone) f = s.focus = null;
    if (f && f.hold !== undefined) { f.hold -= dt; if (f.hold <= 0) s.focus = null; }
    if (!f && s.cur) f = s.cur;
    if (f && this.manual <= 0) {
      const tx = f.x, ty = (f.y || 0) - 60, k = Math.min(1, dt * 4);
      this.cam.x += (tx - this.cam.x) * k; this.cam.y += (ty - this.cam.y) * k;
    }
    const vw = W / 2 / this.cam.z, vh = H / 2 / this.cam.z;
    this.cam.x = U.clamp(this.cam.x, vw - 200, s.t.w - vw + 200);
    this.cam.y = U.clamp(this.cam.y, vh - 300, T.H - vh + 40);
  };

  /* ---------- drawing ---------- */
  P.draw = function (c) {
    const s = G.s, m = I.mouse;
    const sh = s.shake * 8;
    c.save();
    if (sh) c.translate(U.rand(-sh, sh), U.rand(-sh, sh));
    const w = G.WEAPONS[s.weapon];
    V.drawWorld(c, s, this.cam, {
      extra: (cc) => {
        // previews for targeted tools
        if (!human() || this.wmenu || this.menu || !G.canFire()) return;
        const p = toWorld(m.x, m.y);
        if (s.weapon === "girder") {
          const a = s.girderAng || 0, L = 46, ok = Math.hypot(p.x - s.cur.x, p.y - s.cur.y) <= 260;
          cc.save(); cc.globalAlpha = 0.6; cc.translate(p.x, p.y); cc.rotate(a);
          D.rr(cc, -L, -4.5, L * 2, 9, 2, ok ? "#c84a3a" : "#777", "#1b1410", 2); cc.restore();
          D.circle(cc, s.cur.x, s.cur.y - 10, 260, null, "rgba(255,255,255,0.25)", 2);
        } else if (w.target) {
          D.reticle(cc, p.x, p.y, s.weapon === "teleport" ? "#8ae0ff" : "#ff6a4a");
          if (s.target) D.reticle(cc, s.target.x, s.target.y, "#ffd13a");
        }
      },
    });
    c.restore();
    this.drawHud(c);
    if (this.wmenu) this.drawWeapons(c);
    if (this.menu) {
      c.fillStyle = "rgba(10,8,6,0.6)"; c.fillRect(0, 0, W, H);
      D.panel(c, W / 2 - 220, 150, 440, 420, { title: "Paused" });
      MM.UI.drawButtons(c, this.menuBtns);
    }
    if (I.showCursor() || (human() && (w.target || this.wmenu) && I.lastDevice !== "mouse")) D.hand(c, m.x, m.y);
  };
  P.drawHud = function (c) {
    const s = G.s, team = s.teams[s.team];
    // turn clock
    const tt = Math.max(0, Math.ceil(s.turnT));
    D.circle(c, 56, H - 56, 38, s.phase === "retreat" ? "#c84a3a" : D.TEAM[team.col], "#1b1410", 5);
    D.text(c, s.phase === "settle" || s.phase === "start" ? "…" : String(tt), 56, H - 52, 34, "#fff", "center", { head: true, weight: 400, lw: 6 });
    // weapon
    const inv = team.inv[s.weapon];
    let wtxt = G.WEAPONS[s.weapon].name + (inv === Infinity ? "" : ` ×${inv}`);
    if (G.WEAPONS[s.weapon].fuse) wtxt += `  · fuse ${s.fuse}s`;
    if (s.weapon === "shotgun" && s.shotsLeft) wtxt += "  · 1 shot left";
    if (team.ctrl === "human") D.text(c, wtxt, 110, H - 64, 24, C.paper, "left", { head: true, weight: 400, lw: 6 });
    D.text(c, team.ctrl === "human" ? (I.touch ? "Tap Weapons to choose" : "W / right click: weapons") : `${team.name} is thinking…`, 110, H - 36, 17, C.dim, "left", { lw: 4 });
    // wind
    const wx = W - 230, wy = H - 44;
    D.rr(c, wx, wy - 14, 200, 28, 10, "rgba(20,20,30,0.75)", "#1b1410", 3);
    const wl = (s.wind / 100) * 94;
    c.fillStyle = s.wind < 0 ? "#7ad0ff" : "#ff9a5a";
    c.fillRect(wx + 100 + Math.min(0, wl), wy - 8, Math.abs(wl), 16);
    D.line(c, wx + 100, wy - 12, wx + 100, wy + 12, "#fff", 2);
    D.text(c, "WIND", wx + 100, wy - 26, 14, C.paper, "center", { lw: 4 });
    // team health bars
    const teams = s.teams, bw = 180;
    let bx = W / 2 - (teams.length * (bw + 12)) / 2;
    for (const tm of teams) {
      const hp = tm.moles.reduce((a, q) => a + (q.dead ? 0 : Math.max(0, q.shown)), 0), max = tm.moles.length * (s.cfg.hp || 100);
      D.rr(c, bx, H - 34, bw, 22, 8, "rgba(20,20,30,0.75)", "#1b1410", 3);
      if (hp > 0) D.rr(c, bx + 3, H - 31, Math.max(6, (bw - 6) * hp / max), 16, 6, D.TEAM[tm.col], null);
      D.text(c, tm.name, bx + bw / 2, H - 23, 14, "#fff", "center", { lw: 4 });
      if (tm === team && !s.over) D.rr(c, bx - 3, H - 37, bw + 6, 28, 10, null, "#fff", 2);
      bx += bw + 12;
    }
    // messages
    if (this.msgT > 0) {
      c.globalAlpha = U.clamp(this.msgT * 2, 0, 1);
      D.text(c, this.msg, W / 2, 56, 34, this.msgCol || C.gold, "center", { head: true, weight: 400, lw: 8 });
      c.globalAlpha = 1;
    }
    if (G.s.sudden) D.text(c, "SUDDEN DEATH", W / 2, 20, 16, "#ff6a4a", "center", { lw: 4 });
    if (s.over) {
      const a = Math.min(1, this.endT * 1.5);
      c.globalAlpha = a;
      const win = s.over.winner;
      D.text(c, win ? `${win.name} win!` : "Nobody wins!", W / 2, H / 2 - 30, 72, win ? D.TEAM[win.col] : C.paper, "center", { head: true, weight: 400, lw: 12 });
      if (this.endT > 2) D.text(c, I.touch ? "Tap to continue" : "Click to continue", W / 2, H / 2 + 40, 26, C.paper, "center", { lw: 6 });
      c.globalAlpha = 1;
    }
    // touch controls
    if (I.touch && human() && !s.over) {
      for (const b of this.touchButtons()) {
        const lab = { left: "◀", right: "▶", jump: "JUMP", up: "▲", down: "▼", fire: s.charging ? "…" : "FIRE", weapons: "ARMS" }[b.id];
        D.rr(c, b.x, b.y, b.w, b.h, 16, b.id === "fire" ? "rgba(232,71,58,0.55)" : "rgba(20,20,30,0.45)", "rgba(255,255,255,0.7)", 3);
        D.text(c, lab, b.x + b.w / 2, b.y + b.h / 2 + 2, b.id === "fire" ? 34 : 26, "#fff", "center", { head: true, weight: 400, lw: 5 });
      }
    }
  };
  P.drawWeapons = function (c) {
    const s = G.s, team = s.teams[s.team], m = I.mouse, grid = this.weaponGrid();
    const x0 = grid[0].x - 16, y0 = grid[0].y - 56, x1 = grid[grid.length - 1].x, y1 = grid[grid.length - 1].y;
    D.panel(c, x0, y0, 6 * 98 + 26, (Math.ceil(grid.length / 6)) * 90 + 74, { title: "Weapons", tsize: 28 });
    let hover = null;
    for (const b of grid) {
      const n = team.inv[b.k], dis = !(n > 0), hov = inR(m, b), sel = s.weapon === b.k;
      if (hov) hover = b;
      D.rr(c, b.x, b.y, b.w, b.h, 12, sel ? "#4a5a80" : hov ? "#3e4c6c" : "#1d2638", sel ? C.gold : "#1b1410", sel ? 4 : 3);
      c.save(); c.globalAlpha = dis ? 0.3 : 1;
      weaponIcon(c, b.k, b.x + b.w / 2, b.y + 38);
      c.restore();
      D.text(c, n === Infinity ? "∞" : String(n), b.x + b.w - 10, b.y + 14, 15, dis ? C.faint : "#fff", "right", { lw: 3 });
      D.text(c, SHORT[b.k], b.x + b.w / 2, b.y + b.h - 13, 13, dis ? C.faint : C.paper, "center", { lw: 3 });
    }
    if (hover) D.text(c, G.WEAPONS[hover.k].name + " – " + HINT[hover.k], x0 + 14, y1 + 112, 17, C.gold, "left", { lw: 4 });
  };
  const SHORT = { bazooka: "BAZOOKA", homing: "HOMING", grenade: "GRENADE", cluster: "CLUSTER", shotgun: "SHOTGUN", bat: "BAT", dynamite: "DYNAMITE", mine: "MINE", airstrike: "AIR STRIKE",
    drill: "DRILL", torch: "TORCH", girder: "GIRDER", teleport: "TELEPORT", jetpack: "JETPACK", rope: "ROPE", skip: "SKIP", surrender: "GIVE UP" };
  const HINT = { bazooka: "hold fire for power, the wind pushes it", homing: "click a target, then fire", grenade: "bounces, explodes after the fuse (keys 1–5)", cluster: "bursts into five bomblets",
    shotgun: "two shots in one turn", bat: "send a mole flying", dynamite: "drop it and run", mine: "explodes when someone comes near", airstrike: "click where the bombs should fall",
    drill: "digs straight down", torch: "burns a tunnel ahead", girder: "click to place a beam, arrows or wheel turn it", teleport: "click where to go", jetpack: "up to fly, fire again to stop",
    rope: "fire at the ceiling, swing with left and right, up/down for length, jump to let go", skip: "end your turn", surrender: "your team gives up" };
  MM.SHORT = SHORT;
  function weaponIcon(c, k, x, y) {
    c.save(); c.translate(x, y);
    switch (k) {
      case "skip": D.text(c, "»", 0, 2, 40, "#fff", "center", { head: true, weight: 400, lw: 5 }); break;
      case "surrender": c.fillStyle = "#fff"; c.fillRect(-2, -18, 3, 34); D.rr(c, 1, -18, 20, 14, 2, "#fff", "#1b1410", 2); break;
      case "jetpack": D.rr(c, -9, -16, 18, 26, 5, "#9aa0aa", "#1b1410", 2.5); D.circle(c, -4, 14, 4, "#ffb02a", null); D.circle(c, 4, 14, 4, "#ffb02a", null); break;
      case "airstrike":
        c.save(); c.rotate(0.3); D.rr(c, -20, -5, 34, 10, 4, "#7a8aa0", "#1b1410", 2); D.rr(c, -6, -14, 8, 28, 3, "#7a8aa0", "#1b1410", 2); c.restore();
        D.circle(c, 10, 14, 4, "#3a3a42", "#1b1410", 1.5); break;
      case "teleport": for (let i = 0; i < 3; i++) D.circle(c, 0, 0, 6 + i * 6, null, `rgba(140,220,255,${1 - i * 0.25})`, 3); break;
      case "girder": c.save(); c.rotate(-0.4); D.rr(c, -24, -5, 48, 10, 2, "#c84a3a", "#1b1410", 2.5); c.restore(); break;
      case "mine": c.scale(2, 2); S.mine(c, 0, 4, 0, true, false); break;
      default: c.scale(1.6, 1.6); c.translate(-8, 0); S.weapon(c, k, 0, 0); break;
    }
    c.restore();
  }
  MM.weaponIcon = weaponIcon;
})(window.MM);
