/* Ironfall: screens – title, options, controls, play HUD and overlays, highscores, name entry */
"use strict";

(function (XA) {
  const { U, Gfx, Fx, G, Store, Theme, Spr } = XA;
  const A = XA.Audio, I = XA.Input;
  const W = U.W, H = U.H, TAU = U.TAU, T = Theme.T;
  const States = (XA.States = {});
  let setState = null; // provided by main.js
  XA.UI = { bind(fn) { setState = fn; } };

  const FONT = "Orbitron, 'Arial Black', Arial, sans-serif";
  const BODY = "Rajdhani, 'Segoe UI', Arial, sans-serif";
  function txt(ctx, s, x, y, size, color = "#fff", align = "center", weight = 700, font = FONT) {
    ctx.font = `${weight} ${size}px ${font}`;
    ctx.textAlign = align; ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.fillText(s, x, y);
  }
  function glowTxt(ctx, s, x, y, size, color, glow, blur = 18, align = "center", font = FONT) {
    ctx.save(); ctx.shadowColor = glow; ctx.shadowBlur = blur;
    txt(ctx, s, x, y, size, color, align, 900, font);
    ctx.restore();
  }
  function panel(ctx, x, y, w, h, alpha = 0.72, border = "rgba(255,170,90,0.35)") {
    ctx.fillStyle = `rgba(10,12,20,${alpha})`;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill();
    ctx.strokeStyle = border; ctx.lineWidth = 1.5; ctx.stroke();
  }
  function inRect(m, x, y, w, h) { return m.x >= x && m.x <= x + w && m.y >= y && m.y <= y + h; }
  function wrap(ctx, s, x, y, w, lh, size) {
    ctx.font = `600 ${size}px ${BODY}`; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillStyle = "rgba(235,240,250,0.92)";
    let line = "", yy = y;
    for (const word of s.split(" ")) {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > w && line) { ctx.fillText(line, x, yy); line = word; yy += lh; }
      else line = test;
    }
    if (line) ctx.fillText(line, x, yy);
  }
  XA.UI.txt = txt;

  /* ---------- Shared animated backdrop: the suit runs through the alien frontier ---------- */
  const backdrop = {
    camX: 0, t: 0, foes: [], th: null,
    update(dt) {
      if (!this.th) this.th = Theme.build("frontier");
      this.t += dt; this.camX += 220 * dt;
      if (Math.random() < dt * 0.7) this.foes.push({ x: W + 40, y: U.rand(140, 440), vx: -U.rand(160, 260), p: U.rand(TAU), t: 0 });
      for (const f of this.foes) { f.x += f.vx * dt; f.t += dt; f.y += Math.sin(f.t * 3 + f.p) * 50 * dt; }
      this.foes = this.foes.filter((f) => f.x > -60);
      if (Math.random() < dt * 0.5) Fx.explode(U.rand(300, W - 100), U.rand(150, 450), U.rand(20, 40));
      Fx.update(dt);
    },
    draw(ctx) {
      if (!this.th) this.update(0);
      const th = this.th;
      Theme.drawBackground(ctx, th, this.camX, 600, this.t, 0, 1400);
      const gy = H - 90;
      // ground strip
      for (let x = -((this.camX) % T) - T; x < W + T; x += T) {
        ctx.drawImage(th.tiles.rock[1][Math.abs(Math.floor((x + this.camX) / T)) % 3], x - 4, gy - 4, 48, 48);
        for (let k = 1; k < 3; k++) { ctx.drawImage(th.tiles.rock[0][0], x - 4, gy + k * T - 4, 48, 48); ctx.fillStyle = `rgba(0,0,0,${0.25 * k})`; ctx.fillRect(x, gy + k * T, T, T); }
      }
      for (const f of this.foes) { ctx.globalAlpha = 0.7; XA.Enemies.TYPES.swarm.draw(ctx, { x: f.x, y: f.y, t: f.t, flash: 0 }); ctx.globalAlpha = 1; }
      Spr.player(ctx, 260, gy, { face: 1, state: "run", t: this.t, aim: 0, run: (this.t * 2.2) % 1, muzzle: (this.t * 6) % 1 < 0.3 ? 0.8 : 0, muzzleRGB: "255,140,90" });
      Fx.draw(ctx);
    },
  };

  /* ---------- Generic menu ---------- */
  function makeMenu(items, x, y, w = 420, h = 54, gap = 12) { return { items, sel: 0, x, y, w, h, gap }; }
  function menuIndexAt(m) {
    const ms = I.mouse;
    for (let i = 0; i < m.items.length; i++) if (inRect(ms, m.x - m.w / 2, m.y + i * (m.h + m.gap), m.w, m.h)) return i;
    return -1;
  }
  function menuInput(m) {
    const n = m.items.length;
    if (I.hit("up")) { m.sel = (m.sel + n - 1) % n; A.sfx("menuMove"); }
    if (I.hit("down")) { m.sel = (m.sel + 1) % n; A.sfx("menuMove"); }
    const hi = menuIndexAt(m);
    if (I.mouse.moved && hi >= 0 && hi !== m.sel) { m.sel = hi; A.sfx("menuMove"); }
    const it = m.items[m.sel];
    if (it.adjust) {
      if (I.hit("left")) it.adjust(-1);
      if (I.hit("right")) it.adjust(1);
      if (I.mouse.wheel && hi === m.sel) it.adjust(-I.mouse.wheel);
    }
    if (I.hit("confirm") || I.hit("fire") || (I.mouse.clicked && hi === m.sel && hi >= 0)) {
      if (it.action) { A.sfx("menuOk"); it.action(); }
      else if (it.adjust) it.adjust(1, true);
    }
  }
  function menuDraw(ctx, m, t) {
    m.items.forEach((it, i) => {
      const y = m.y + i * (m.h + m.gap), x = m.x - m.w / 2, sel = i === m.sel;
      if (sel) {
        const gr = ctx.createLinearGradient(x, 0, x + m.w, 0);
        gr.addColorStop(0, "rgba(255,140,40,0)"); gr.addColorStop(0.5, `rgba(255,140,40,${0.35 + 0.1 * Math.sin(t * 5)})`); gr.addColorStop(1, "rgba(255,140,40,0)");
        ctx.fillStyle = gr; ctx.fillRect(x, y, m.w, m.h);
        ctx.strokeStyle = "rgba(255,210,150,0.8)"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x + 40, y); ctx.lineTo(x + m.w - 40, y); ctx.moveTo(x + 40, y + m.h); ctx.lineTo(x + m.w - 40, y + m.h); ctx.stroke();
      }
      const label = typeof it.label === "function" ? it.label() : it.label;
      txt(ctx, label, m.x, y + m.h / 2 + 1, sel ? 26 : 23, sel ? "#ffffff" : "rgba(225,225,235,0.85)");
    });
  }
  const dim = (ctx, a = 0.55) => { ctx.fillStyle = `rgba(4,6,12,${a})`; ctx.fillRect(0, 0, W, H); };

  /* ---------- Highscores ---------- */
  const DEFAULT_HS = [["IRONMAN", 250000], ["STEEL", 200000], ["BLASTER", 160000], ["GYRO", 120000], ["LASER", 90000], ["REBOUND", 70000], ["DIAMOND", 50000], ["SPREAD", 30000], ["ROOKIE", 15000], ["CADET", 5000]]
    .map(([name, score], i) => ({ name, score, stage: Math.max(1, 6 - Math.floor(i / 2)), date: "" }));
  const HS = (XA.HS = {
    list() { const l = Store.get("scores", null); return Array.isArray(l) && l.length ? l : DEFAULT_HS.slice(); },
    rank(score) { if (score <= 0) return -1; const l = HS.list(); let i = 0; while (i < l.length && l[i].score >= score) i++; return i < 10 ? i : -1; },
    add(name, score, stage) {
      const l = HS.list();
      const e = { name, score, stage, date: new Date().toISOString().slice(0, 10) };
      l.push(e); l.sort((a, b) => b.score - a.score);
      const out = l.slice(0, 10);
      Store.set("scores", out);
      return out.indexOf(e);
    },
  });

  /* ---------- Logo ---------- */
  function drawLogo(ctx, t, y) {
    ctx.save();
    ctx.font = `900 128px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(255,120,30,0.9)"; ctx.shadowBlur = 36 + 10 * Math.sin(t * 2);
    const gr = ctx.createLinearGradient(0, y - 60, 0, y + 60);
    gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.42, "#c8d0dc"); gr.addColorStop(0.52, "#5a6270"); gr.addColorStop(0.6, "#ffb060"); gr.addColorStop(1, "#ffe6c0");
    ctx.fillStyle = gr;
    ctx.fillText("IRONFALL", W / 2, y);
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2.5; ctx.strokeStyle = "rgba(20,10,0,0.85)"; ctx.strokeText("IRONFALL", W / 2, y);
    // light sweep
    const sx = ((t * 0.35) % 1.6) * W * 1.2 - W * 0.3;
    ctx.globalCompositeOperation = "source-atop";
    const sg = ctx.createLinearGradient(sx - 60, 0, sx + 60, 0);
    sg.addColorStop(0, "rgba(255,255,255,0)"); sg.addColorStop(0.5, "rgba(255,255,255,0.55)"); sg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sg; ctx.fillText("IRONFALL", W / 2, y);
    ctx.restore();
    txt(ctx, "A S S A U L T   O N   T H E   M A C H I N E", W / 2, y + 80, 21, "rgba(120,230,255,0.95)", "center", 700);
  }

  /* ---------- Boot ---------- */
  States.boot = {
    t: 0,
    enter() { this.t = 0; },
    input() {
      if (this.t > 0.2 && (I.pressed.size || I.mouse.clicked || I.pad.pressed.size)) { A.init(); setState("title"); }
    },
    update(dt) { this.t += dt; backdrop.update(dt); },
    draw(ctx) {
      backdrop.draw(ctx);
      dim(ctx, 0.25);
      drawLogo(ctx, this.t, H / 2 - 90);
      const a = 0.55 + 0.45 * Math.sin(this.t * 4);
      txt(ctx, "PRESS ANY KEY OR CLICK", W / 2, H / 2 + 80, 24, `rgba(255,240,220,${a})`);
      txt(ctx, "Keyboard · Mouse · Gamepad", W / 2, H / 2 + 120, 20, "rgba(220,220,230,0.75)", "center", 500, BODY);
    },
  };

  /* ---------- Title ---------- */
  States.title = {
    t: 0, idle: 0,
    menu: makeMenu([
      { label: "START GAME", action: () => { G.newRun(); setState("play", { stage: 0 }); } },
      { label: "HIGHSCORES", action: () => setState("highscores") },
      { label: "OPTIONS", action: () => setState("options", "title") },
      { label: "CONTROLS", action: () => setState("controls") },
    ], W / 2, 330, 420, 50, 10),
    enter() { this.t = 0; this.idle = 0; A.playSong("title"); XA.Main.setCursor(true); },
    input() {
      if (I.pressed.size || I.mouse.moved || I.pad.pressed.size || I.pad.dir.size) this.idle = 0;
      menuInput(this.menu);
    },
    update(dt) { this.t += dt; this.idle += dt; backdrop.update(dt); if (this.idle > 30) setState("highscores", { attract: true }); },
    draw(ctx) {
      backdrop.draw(ctx);
      dim(ctx, 0.3);
      drawLogo(ctx, this.t, 170);
      menuDraw(ctx, this.menu, this.t);
      txt(ctx, "An homage to the C64/Amiga classic Turrican (1990). All graphics, music and code are original.", W / 2, H - 22, 17, "rgba(220,220,230,0.65)", "center", 500, BODY);
    },
  };

  /* ---------- Options ---------- */
  const pct = (v) => "▮".repeat(Math.round(v * 10)) + "▯".repeat(10 - Math.round(v * 10));
  States.options = {
    t: 0, back: "title",
    menu: makeMenu([
      { label: () => "MUSIC  " + pct(A.musicVol), adjust: (d, wrap) => { let v = Math.round((A.musicVol + d * 0.1) * 10) / 10; if (wrap && v > 1) v = 0; A.setMusicVol(U.clamp(v, 0, 1)); A.sfx("menuMove"); } },
      { label: () => "SOUND  " + pct(A.sfxVol), adjust: (d, wrap) => { let v = Math.round((A.sfxVol + d * 0.1) * 10) / 10; if (wrap && v > 1) v = 0; A.setSfxVol(U.clamp(v, 0, 1)); A.sfx("diamond"); } },
      { label: () => "VOICE  " + (A.voiceOn ? "ON" : "OFF"), adjust: () => { A.setVoice(!A.voiceOn); A.sfx("menuMove"); if (A.voiceOn) A.say("Voice on"); } },
      { label: () => "SCREEN SHAKE  " + (XA.Main.shakeOn ? "ON" : "OFF"), adjust: () => { XA.Main.shakeOn = !XA.Main.shakeOn; Store.set("shake", XA.Main.shakeOn); A.sfx("menuMove"); } },
      { label: () => "FULLSCREEN  " + (document.fullscreenElement ? "ON" : "OFF"), action: () => XA.Main.toggleFullscreen() },
      { label: "BACK", action: () => States.options.leave() },
    ], W / 2, 232, 560),
    enter(back) { this.t = 0; this.back = back || "title"; this.menu.sel = 0; XA.Main.setCursor(true); },
    leave() { if (this.back === "play") setState("play", { resume: true }); else setState(this.back); },
    input() { if (I.hit("back")) { A.sfx("menuBack"); this.leave(); return; } menuInput(this.menu); },
    update(dt) { this.t += dt; if (this.back !== "play") backdrop.update(dt); },
    draw(ctx) {
      if (this.back === "play") { G.draw(ctx); dim(ctx, 0.72); }
      else { backdrop.draw(ctx); dim(ctx, 0.45); }
      glowTxt(ctx, "OPTIONS", W / 2, 150, 54, "#ffffff", "rgba(255,130,40,0.8)");
      menuDraw(ctx, this.menu, this.t);
      txt(ctx, "◀ ▶ to change · F fullscreen · M mute", W / 2, H - 50, 20, "rgba(220,220,230,0.7)", "center", 500, BODY);
    },
  };

  /* ---------- Controls ---------- */
  States.controls = {
    t: 0,
    enter() { this.t = 0; },
    input() { if (this.t > 0.2 && (I.hit("back") || I.hit("confirm") || I.mouse.clicked)) { A.sfx("menuBack"); setState("title"); } },
    update(dt) { this.t += dt; backdrop.update(dt); },
    draw(ctx) {
      backdrop.draw(ctx);
      dim(ctx, 0.55);
      glowTxt(ctx, "CONTROLS", W / 2, 70, 50, "#ffffff", "rgba(255,130,40,0.8)");
      const cols = [
        ["KEYBOARD", [["Run / aim", "Arrow keys / WASD"], ["Jump", "Space / K"], ["Fire (hold)", "J / X / N"], ["Lightning beam (hold)", "L / C · ↑↓ rotates"], ["Power line", "I / V / B"], ["Gyroscope", "Shift / G / U"], ["Crouch · drop down", "↓ · ↓ + Jump"], ["Pause · fullscreen · mute", "P / Esc · F · M"]]],
        ["MOUSE", [["Aim", "Pointer (360°)"], ["Run · jump", "A / D · Space"], ["Fire (hold)", "Left button"], ["Lightning beam", "Right button"], ["Power line", "Middle button"], ["Gyroscope", "Mouse wheel"], ["Menus", "Point and click"]]],
        ["GAMEPAD", [["Run / aim", "Left stick / D-pad"], ["Free aim", "Right stick"], ["Jump", "A"], ["Fire (hold)", "X / RT"], ["Lightning beam", "Y / RB"], ["Power line", "LB / LT"], ["Gyroscope", "B"], ["Pause", "Start"]]],
      ];
      cols.forEach(([head, rows], c) => {
        const x = 50 + c * 400;
        panel(ctx, x, 110, 380, 440);
        txt(ctx, head, x + 190, 138, 22, "#ffb060");
        rows.forEach(([a, b], i) => {
          txt(ctx, a, x + 22, 176 + i * 46, 17, "rgba(210,210,225,0.75)", "left", 600, BODY);
          txt(ctx, b, x + 22, 197 + i * 46, 21, "#ffffff", "left", 700, BODY);
        });
      });
      panel(ctx, 50, 566, W - 100, 104, 0.7);
      txt(ctx, "Shoot the floating blocks to release weapons and power-ups. Collect the same weapon again to raise its power.", W / 2, 590, 20, "rgba(235,235,245,0.95)", "center", 600, BODY);
      txt(ctx, "The gyroscope makes you invulnerable and fits through narrow tunnels; fire drops mines. Power lines sweep the whole screen.", W / 2, 617, 20, "rgba(235,235,245,0.95)", "center", 600, BODY);
      txt(ctx, "100 diamonds or every 100,000 points give an extra life. Watch the timer!", W / 2, 644, 20, "rgba(235,235,245,0.95)", "center", 600, BODY);
      txt(ctx, "Press any button to return", W / 2, H - 22, 18, `rgba(220,220,230,${0.5 + 0.3 * Math.sin(this.t * 4)})`, "center", 600, BODY);
    },
  };

  /* ---------- Highscore list ---------- */
  States.highscores = {
    t: 0, mark: -1, attract: false,
    enter(o) { this.t = 0; this.mark = o && o.mark !== undefined ? o.mark : -1; this.attract = !!(o && o.attract); if (!this.attract) A.playSong("title"); XA.Main.setCursor(true); },
    input() {
      if (this.t > 0.4 && (I.hit("back") || I.hit("confirm") || I.mouse.clicked || (this.attract && (I.pressed.size || I.pad.pressed.size)))) { A.sfx("menuBack"); setState("title"); }
    },
    update(dt) { this.t += dt; backdrop.update(dt); if (this.attract && this.t > 12) setState("title"); },
    draw(ctx) {
      backdrop.draw(ctx);
      dim(ctx, 0.45);
      glowTxt(ctx, "HIGHSCORES", W / 2, 90, 54, "#ffffff", "rgba(255,130,40,0.8)");
      panel(ctx, W / 2 - 380, 140, 760, 500);
      const l = HS.list();
      txt(ctx, "RANK", W / 2 - 330, 170, 16, "#ffb060", "left");
      txt(ctx, "NAME", W / 2 - 220, 170, 16, "#ffb060", "left");
      txt(ctx, "STAGE", W / 2 + 110, 170, 16, "#ffb060", "center");
      txt(ctx, "SCORE", W / 2 + 340, 170, 16, "#ffb060", "right");
      l.forEach((e, i) => {
        const y = 215 + i * 42, hl = i === this.mark;
        if (hl) { ctx.fillStyle = `rgba(255,140,40,${0.2 + 0.12 * Math.sin(this.t * 6)})`; ctx.fillRect(W / 2 - 360, y - 19, 720, 38); }
        const col = hl ? "#fff7b0" : i < 3 ? "#ffd27a" : "#eef0f6";
        txt(ctx, `${i + 1}.`, W / 2 - 330, y, 22, col, "left");
        txt(ctx, e.name, W / 2 - 220, y, 22, col, "left");
        txt(ctx, e.stage > G.STAGES.length ? "ALL" : String(e.stage), W / 2 + 110, y, 22, col, "center");
        txt(ctx, U.fmt(e.score), W / 2 + 340, y, 22, col, "right");
      });
      txt(ctx, "Scores are saved in this browser.", W / 2, H - 40, 18, "rgba(220,220,230,0.6)", "center", 500, BODY);
    },
  };

  /* ---------- Play ---------- */
  States.play = {
    paused: false, t: 0, done: false,
    pauseMenu: makeMenu([
      { label: "RESUME", action: () => { States.play.paused = false; } },
      { label: "OPTIONS", action: () => setState("options", "play") },
      { label: "QUIT TO TITLE", action: () => { States.play.paused = false; XA.Main.setCursor(true); setState("title"); } },
    ], W / 2, 330, 420),
    enter(o) {
      if (o && o.resume) { this.paused = true; return; }
      this.paused = false; this.t = 0; this.done = false;
      G.gameOverT = 0;
      G.startStage(o && o.stage !== undefined ? o.stage : 0);
      G.onGameOver = () => setState("gameover");
    },
    pause() { if (!this.paused && !(G.gameOverT > 0)) { this.paused = true; this.pauseMenu.sel = 0; A.sfx("menuBack"); if (window.speechSynthesis) speechSynthesis.cancel(); } },
    input() {
      if (this.paused) {
        if (I.hit("pause")) { this.paused = false; return; }
        menuInput(this.pauseMenu);
        return;
      }
      if (I.hit("pause")) { this.pause(); return; }
      if (G.cheat && I.hit("skip") && !(G.gameOverT > 0)) { A.sfx("portal"); this.finishStage(); return; }
      if (G.phase === "clear" && G.phaseT > 4 && (I.hit("confirm") || I.hit("fire") || I.hit("jump") || I.mouse.clicked)) this.finishStage();
    },
    finishStage() {
      if (this.done) return;
      this.done = true;
      const run = G.run;
      if (run.stage >= G.STAGES.length - 1) setState("victory");
      else setState("play", { stage: run.stage + 1 });
    },
    update(dt) {
      XA.Main.setCursor(this.paused);
      if (this.paused) return;
      this.t += dt;
      G.update(dt);
      if (G.phase === "clear" && G.phaseT > 10) this.finishStage();
    },
    draw(ctx) {
      G.draw(ctx);
      drawHUD(ctx);
      drawPhaseOverlay(ctx);
      if (G.mouseMode && !this.paused && G.player.dead <= 0) {
        const m = I.mouse;
        ctx.strokeStyle = "rgba(255,220,160,0.85)"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(m.x, m.y, 11, 0, TAU); ctx.moveTo(m.x - 18, m.y); ctx.lineTo(m.x - 6, m.y); ctx.moveTo(m.x + 6, m.y); ctx.lineTo(m.x + 18, m.y);
        ctx.moveTo(m.x, m.y - 18); ctx.lineTo(m.x, m.y - 6); ctx.moveTo(m.x, m.y + 6); ctx.lineTo(m.x, m.y + 18); ctx.stroke();
      }
      if (this.paused) {
        dim(ctx, 0.7);
        glowTxt(ctx, "PAUSED", W / 2, 240, 64, "#ffffff", "rgba(255,130,40,0.8)");
        menuDraw(ctx, this.pauseMenu, this.t + performance.now() / 1000);
      }
    },
  };

  function bar(ctx, x, y, w, h, f, c1, c2, bg = "rgba(0,0,0,0.55)") {
    ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill();
    if (f > 0) {
      const gr = ctx.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, c1); gr.addColorStop(1, c2);
      ctx.fillStyle = gr; ctx.beginPath(); ctx.roundRect(x, y, Math.max(h, w * U.clamp(f, 0, 1)), h, h / 2); ctx.fill();
    }
    ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.stroke();
  }
  const WCOL = { spread: "#ff6a4a", laser: "#4ac0ff", bounce: "#5aff6a", flame: "#ffb03a", homing: "#d070ff" };

  function drawHUD(ctx) {
    const run = G.run, p = G.player;
    // top left: score, energy, lives
    panel(ctx, 14, 12, 330, 90, 0.55, "rgba(255,170,90,0.25)");
    txt(ctx, "SCORE", 30, 30, 13, "#ffb060", "left");
    txt(ctx, U.fmt(run.score), 30, 55, 26, "#ffffff", "left", 900);
    const ef = run.energy / G.MAX_E;
    bar(ctx, 30, 78, 200, 13, ef, ef > 0.5 ? "#4cff8a" : ef > 0.25 ? "#ffd84a" : "#ff4a4a", ef > 0.5 ? "#c0ffd0" : ef > 0.25 ? "#fff0a0" : "#ff9a9a");
    for (let i = 0; i < Math.min(run.lives, 5); i++) {
      const x = 250 + i * 18, y = 82;
      ctx.fillStyle = "#a8b6cc"; ctx.beginPath(); ctx.roundRect(x - 7, y - 8, 14, 13, 4); ctx.fill();
      ctx.fillStyle = "#58e6ff"; ctx.fillRect(x - 1, y - 4, 7, 4);
    }
    if (run.lives > 5) txt(ctx, `+${run.lives - 5}`, 336, 82, 12, "#fff", "right");
    txt(ctx, `STAGE ${run.stage + 1}`, 330, 30, 13, "rgba(230,230,240,0.85)", "right");
    // top centre: time
    const tm = Math.max(0, Math.ceil(G.time));
    const low = tm < 30 && Math.floor(G.t * 4) % 2;
    panel(ctx, W / 2 - 70, 12, 140, 52, 0.55, "rgba(255,170,90,0.25)");
    txt(ctx, "TIME", W / 2, 26, 12, "#ffb060");
    txt(ctx, String(tm), W / 2, 47, 24, low ? "#ff5a4a" : "#ffffff", "center", 900);
    // top right: diamonds, lines, gyros
    panel(ctx, W - 254, 12, 240, 52, 0.55, "rgba(255,170,90,0.25)");
    ctx.save(); ctx.translate(W - 232, 38);
    ctx.fillStyle = "#9ff4ff"; ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(8, -2); ctx.lineTo(0, 10); ctx.lineTo(-8, -2); ctx.closePath(); ctx.fill();
    ctx.restore();
    txt(ctx, String(run.diamonds % 100).padStart(2, "0"), W - 214, 38, 20, "#ffffff", "left", 900);
    txt(ctx, "≡", W - 150, 37, 22, "#7affff", "center", 900);
    txt(ctx, String(run.lines), W - 134, 38, 20, "#ffffff", "left", 900);
    ctx.strokeStyle = "#e6eefa"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(W - 78, 38, 8, 0, TAU); ctx.stroke();
    ctx.fillStyle = "#ff8a2a"; ctx.beginPath(); ctx.arc(W - 78, 38, 3, 0, TAU); ctx.fill();
    txt(ctx, String(run.gyros), W - 62, 38, 20, "#ffffff", "left", 900);
    // bottom left: weapon
    panel(ctx, 14, H - 58, 300, 44, 0.55, "rgba(255,170,90,0.25)");
    txt(ctx, G.WEAPONS[run.weapon].toUpperCase(), 30, H - 36, 16, WCOL[run.weapon], "left");
    for (let i = 0; i < 4; i++) { ctx.fillStyle = i < run.power ? "#ffb34a" : "rgba(255,255,255,0.15)"; ctx.fillRect(210 + i * 22, H - 44, 16, 16); }
    if (p.gyro > 0) bar(ctx, 330, H - 42, 140, 10, p.gyro / 8, "#c0e0ff", "#ffffff");
    if (p.shield > 0) bar(ctx, 330, H - 28, 140, 10, p.shield / 12, "#80b0ff", "#e0f0ff");
    // stage progress
    if (!G.arena) { bar(ctx, W - 254, 70, 240, 6, G.progress(), "#ff8a2a", "#ffe0a0", "rgba(0,0,0,0.4)"); }
    // boss bar
    const b = G.boss;
    if (b && b.entered && !b.dead) {
      txt(ctx, b.name, W / 2, 84, 18, "#ff8a6a");
      bar(ctx, W / 2 - 280, 98, 560, 13, b.hp / b.maxHp, "#ff3a3a", "#ffb36a");
      const vt = b.vulnText ? b.vulnText() : "";
      if (vt) txt(ctx, vt, W / 2, 124, 13, "rgba(150,230,255,0.9)");
    }
    if (G.cheat) { ctx.fillStyle = "#ffd040"; ctx.beginPath(); ctx.arc(W - 10, H - 10, 4, 0, TAU); ctx.fill(); }
  }

  function drawPhaseOverlay(ctx) {
    const t = G.phaseT;
    if (G.phase === "intro" || (G.phase === "play" && G.t < 3.2)) {
      const tt = G.t;
      const a = tt < 0.4 ? tt / 0.4 : tt > 2.6 ? Math.max(0, (3.2 - tt) / 0.6) : 1;
      ctx.globalAlpha = a;
      const st = G.lv.stage;
      glowTxt(ctx, `STAGE ${G.run.stage + 1}`, W / 2, H / 2 - 70, 60, "#ffffff", "rgba(255,130,40,0.9)", 24);
      txt(ctx, `${G.lv.world.name.toUpperCase()} · ${st.name.toUpperCase()}`, W / 2, H / 2 - 12, 26, "#ffd27a");
      txt(ctx, st.sub, W / 2, H / 2 + 26, 21, "rgba(235,235,245,0.9)", "center", 600, BODY);
      ctx.globalAlpha = 1;
    } else if (G.phase === "warning") {
      const a = 0.5 + 0.5 * Math.sin(t * 10);
      ctx.fillStyle = `rgba(255,0,0,${0.12 * a})`; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = `rgba(255,40,40,${0.6 * a})`; ctx.fillRect(0, H / 2 - 70, W, 4); ctx.fillRect(0, H / 2 + 66, W, 4);
      glowTxt(ctx, "WARNING", W / 2, H / 2 - 18, 72, `rgba(255,${120 + 80 * a | 0},${100 * a | 0},1)`, "rgba(255,0,0,0.9)", 26);
      txt(ctx, G.boss ? G.boss.name + " APPROACHING" : "", W / 2, H / 2 + 38, 22, "#ffd0d0");
    } else if (G.phase === "clear" && t > 1.6) {
      const a = Math.min(1, (t - 1.6) / 0.5), cb = G.clearBonus || {};
      ctx.globalAlpha = a;
      panel(ctx, W / 2 - 300, H / 2 - 150, 600, 300, 0.78);
      glowTxt(ctx, "STAGE CLEAR", W / 2, H / 2 - 100, 48, "#ffffff", "rgba(255,130,40,0.9)", 22);
      const rows = [["Time bonus", U.fmt(G.run.cheated ? 0 : cb.time || 0)], ["Boss bonus", U.fmt(G.run.cheated ? 0 : cb.boss || 0)], ["Enemies destroyed", `${Math.round((cb.ratio || 0) * 100)} %`], ["Diamonds", String(G.run.diamonds)]];
      rows.forEach(([k, v], i) => {
        txt(ctx, k, W / 2 - 240, H / 2 - 40 + i * 38, 22, "rgba(220,225,235,0.9)", "left", 600, BODY);
        txt(ctx, v, W / 2 + 240, H / 2 - 40 + i * 38, 22, "#fff7b0", "right", 700);
      });
      if (t > 4) txt(ctx, "Press fire to continue", W / 2, H / 2 + 125, 18, `rgba(220,220,230,${0.5 + 0.4 * Math.sin(t * 5)})`, "center", 600, BODY);
      ctx.globalAlpha = 1;
    }
    if (G.gameOverT > 0) {
      const a = Math.min(1, (3 - G.gameOverT) / 0.6);
      ctx.globalAlpha = a;
      glowTxt(ctx, "GAME OVER", W / 2, H / 2, 80, "#ffffff", "rgba(255,60,60,0.9)", 30);
      ctx.globalAlpha = 1;
    } else if (G.player && G.player.dead > 0 && G.run.lives >= 0 && G.player.dead < 2.2) {
      txt(ctx, `LIVES LEFT: ${G.run.lives}`, W / 2, H / 2, 30, "rgba(255,255,255,0.9)");
    }
  }

  /* ---------- Game over ---------- */
  function afterGame() {
    const run = G.run;
    const rank = run.cheated ? -1 : HS.rank(run.score);
    if (rank >= 0) setState("nameentry");
    else setState("highscores");
  }
  States.gameover = {
    t: 0,
    enter() { this.t = 0; A.jingle("gameover"); XA.Main.setCursor(true); },
    input() { if (this.t > 1.2 && (I.hit("confirm") || I.mouse.clicked || I.hit("back") || I.hit("fire"))) afterGame(); },
    update(dt) { this.t += dt; G.t += dt; Fx.update(dt); if (this.t > 7) afterGame(); },
    draw(ctx) {
      G.draw(ctx);
      ctx.fillStyle = `rgba(4,6,12,${Math.min(0.75, this.t * 0.5)})`; ctx.fillRect(0, 0, W, H);
      glowTxt(ctx, "GAME OVER", W / 2, H / 2 - 60, 84, "#ffffff", "rgba(255,60,60,0.9)", 30);
      txt(ctx, "FINAL SCORE", W / 2, H / 2 + 30, 18, "#ffb060");
      txt(ctx, U.fmt(G.run.score), W / 2, H / 2 + 70, 44, "#fff7b0", "center", 900);
      txt(ctx, `Reached stage ${G.run.stage + 1}: ${G.lv.stage.name}`, W / 2, H / 2 + 120, 22, "rgba(225,230,240,0.85)", "center", 600, BODY);
    },
  };

  /* ---------- Victory ---------- */
  States.victory = {
    t: 0, bonus: 0,
    enter() {
      this.t = 0;
      const run = G.run;
      run.stage = G.STAGES.length; // all stages done (shown as "ALL")
      this.bonus = run.cheated ? 0 : (run.lives + 1) * 25000;
      if (this.bonus) G.addScore(this.bonus);
      A.jingle("victory");
      this.song = 4.5;
      XA.Main.setCursor(true);
      Fx.clear();
      A.say("Mission complete. The machine is destroyed.", { force: true });
    },
    input() { if (this.t > 2.5 && (I.hit("confirm") || I.mouse.clicked || I.hit("fire"))) afterGame(); },
    update(dt) {
      this.t += dt; backdrop.update(dt);
      if (this.song > 0) { this.song -= dt; if (this.song <= 0) A.playSong("title"); }
      if (Math.random() < dt * 3) Fx.explode(U.rand(150, W - 150), U.rand(120, H - 260), U.rand(18, 50), { rgb: U.pick(["120,220,255", "255,140,255", "255,220,120", "140,255,180"]) });
      Fx.shake = 0;
    },
    draw(ctx) {
      backdrop.draw(ctx);
      dim(ctx, 0.45);
      glowTxt(ctx, "MISSION COMPLETE", W / 2, 150, 64, "#ffffff", "rgba(255,130,40,0.9)", 28);
      wrap(ctx, "The Overmind is silent. One by one the machines of the five worlds shut down, and the suit finally rests. The planet is free – for now.", W / 2 - 330, 230, 660, 30, 24);
      panel(ctx, W / 2 - 260, 340, 520, 200, 0.7);
      txt(ctx, "Lives bonus", W / 2 - 220, 380, 22, "rgba(220,225,235,0.9)", "left", 600, BODY);
      txt(ctx, U.fmt(this.bonus), W / 2 + 220, 380, 22, "#fff7b0", "right");
      txt(ctx, "FINAL SCORE", W / 2, 440, 18, "#ffb060");
      txt(ctx, U.fmt(G.run.score), W / 2, 485, 44, "#fff7b0", "center", 900);
      if (this.t > 2.5) txt(ctx, "Press fire to continue", W / 2, 570, 20, `rgba(220,220,230,${0.5 + 0.4 * Math.sin(this.t * 5)})`, "center", 600, BODY);
    },
  };

  /* ---------- Name entry (optional) ---------- */
  const KEYS = ["ABCDEFGHIJ", "KLMNOPQRST", "UVWXYZ0123", "456789.-! "];
  States.nameentry = {
    t: 0, name: "", sel: 0, rank: 0,
    enter() {
      this.t = 0; this.name = Store.get("lastName", ""); this.sel = 0;
      this.rank = HS.rank(G.run.score);
      A.playSong("title");
      XA.Main.setCursor(true);
    },
    cells() {
      const out = [];
      KEYS.forEach((row, r) => [...row].forEach((ch, c) => out.push({ ch, x: W / 2 - 330 + c * 66, y: 330 + r * 62, w: 58, h: 52 })));
      out.push({ ch: "DEL", x: W / 2 - 330, y: 330 + 4 * 62, w: 190, h: 52 });
      out.push({ ch: "SAVE", x: W / 2 - 124, y: 330 + 4 * 62, w: 250, h: 52 });
      out.push({ ch: "SKIP", x: W / 2 + 142, y: 330 + 4 * 62, w: 190, h: 52 });
      return out;
    },
    press(ch) {
      if (ch === "DEL") { this.name = this.name.slice(0, -1); A.sfx("menuBack"); }
      else if (ch === "SAVE") this.save();
      else if (ch === "SKIP") { A.sfx("menuBack"); setState("highscores"); }
      else if (this.name.length < 10) { this.name += ch; A.sfx("menuMove"); }
    },
    save() {
      const name = this.name.trim() || "PLAYER";
      Store.set("lastName", name);
      const pos = HS.add(name, G.run.score, G.run.stage + 1);
      A.sfx("buy");
      setState("highscores", { mark: pos });
    },
    input() {
      for (const ch of I.typed) { const c = ch.toUpperCase(); if (/^[A-Z0-9 .\-!ÄÖÜ]$/.test(c) && this.name.length < 10) { this.name += c; A.sfx("menuMove"); } }
      if (I.pressed.has("Backspace")) { this.name = this.name.slice(0, -1); A.sfx("menuBack"); }
      if (I.pressed.has("Enter") || I.pressed.has("NumpadEnter")) { this.save(); return; }
      if (I.pressed.has("Escape")) { A.sfx("menuBack"); setState("highscores"); return; }
      const cells = this.cells();
      // navigation with gamepad (and arrow keys)
      let s = this.sel;
      const rowOf = (i) => (i >= 40 ? 4 : Math.floor(i / 10)), colOf = (i) => (i >= 40 ? i - 40 : i % 10);
      const nav = (d) => I.rep.has("Arrow" + d[0].toUpperCase() + d.slice(1)) || I.pad.dir.has(d) || I.pad.pressed.has({ up: 12, down: 13, left: 14, right: 15 }[d]);
      if (nav("right")) s = s >= 40 ? 40 + ((s - 40 + 1) % 3) : rowOf(s) * 10 + ((colOf(s) + 1) % 10);
      if (nav("left")) s = s >= 40 ? 40 + ((s - 40 + 2) % 3) : rowOf(s) * 10 + ((colOf(s) + 9) % 10);
      if (nav("down")) s = s >= 40 ? Math.min(9, (s - 40) * 4) : s >= 30 ? 40 + Math.min(2, Math.floor(colOf(s) / 3.4)) : s + 10;
      if (nav("up")) s = s >= 40 ? 30 + (s - 40) * 4 : s < 10 ? 40 + Math.min(2, Math.floor(s / 3.4)) : s - 10;
      if (s !== this.sel) { this.sel = s; A.sfx("menuMove"); }
      const m = I.mouse;
      let hi = -1;
      cells.forEach((c, i) => { if (inRect(m, c.x, c.y, c.w, c.h)) hi = i; });
      if (m.moved && hi >= 0) this.sel = hi;
      if (I.pad.pressed.has(0) || (m.clicked && hi >= 0)) this.press(cells[this.sel].ch);
      if (I.pad.pressed.has(1)) this.press("DEL");
      if (I.pad.pressed.has(9)) this.save();
    },
    update(dt) { this.t += dt; backdrop.update(dt); },
    draw(ctx) {
      backdrop.draw(ctx);
      dim(ctx, 0.72);
      glowTxt(ctx, "NEW HIGHSCORE", W / 2, 80, 56, "#ffffff", "rgba(255,200,80,0.9)", 26);
      txt(ctx, `Rank ${this.rank + 1} with ${U.fmt(G.run.score)} points`, W / 2, 140, 26, "#fff7b0", "center", 700, BODY);
      txt(ctx, "Enter your name to join the highscore list – or skip it.", W / 2, 176, 22, "rgba(225,230,240,0.85)", "center", 600, BODY);
      panel(ctx, W / 2 - 260, 210, 520, 80, 0.75);
      const cur = Math.floor(this.t * 2.5) % 2 ? "_" : " ";
      txt(ctx, this.name + (this.name.length < 10 ? cur : ""), W / 2, 252, 40, "#ffffff", "center", 900);
      this.cells().forEach((c, i) => {
        const sel = i === this.sel;
        ctx.fillStyle = sel ? "rgba(255,150,60,0.55)" : c.ch.length > 1 ? "rgba(255,170,60,0.25)" : "rgba(30,30,40,0.8)";
        ctx.beginPath(); ctx.roundRect(c.x, c.y, c.w, c.h, 8); ctx.fill();
        ctx.strokeStyle = sel ? "#ffe0c0" : "rgba(255,190,120,0.3)"; ctx.lineWidth = sel ? 2 : 1; ctx.stroke();
        txt(ctx, c.ch === " " ? "␣" : c.ch, c.x + c.w / 2, c.y + c.h / 2 + 1, c.ch.length > 1 ? 20 : 24, "#ffffff");
      });
      txt(ctx, "Type with the keyboard · Enter saves · Esc skips · Gamepad: A types, B deletes, Start saves", W / 2, H - 30, 18, "rgba(220,220,230,0.7)", "center", 500, BODY);
    },
  };
})(window.XA);
