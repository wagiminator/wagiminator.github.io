/* SUNSET HIGHWAY: screens – title, radio, race HUD, route map, goal scenes, highscores, name entry */
"use strict";

(function (XA) {
  const { U, Gfx, R, Store } = XA;
  const A = XA.Audio, I = XA.Input;
  const W = U.W, H = U.H, TAU = U.TAU, LW = Gfx.LW, LH = Gfx.LH;
  const G = (XA.G = XA.G || { cheat: false, autopilot: null, mouseMode: false });
  const States = (XA.States = {});
  let setState = null;
  XA.UI = { bind(fn) { setState = fn; } };

  // low resolution frame buffer for the retro look
  const buf = document.createElement("canvas"); buf.width = LW; buf.height = LH;
  const bg = buf.getContext("2d");
  function blit(ctx) { ctx.imageSmoothingEnabled = false; ctx.drawImage(buf, 0, 0, W, H); ctx.imageSmoothingEnabled = true; }

  const FONT = "'Press Start 2P', 'Courier New', monospace";
  const BODY = "Rajdhani, 'Segoe UI', Arial, sans-serif";
  function txt(ctx, s, x, y, size, color = "#fff", align = "center", font = FONT, shadow = true) {
    ctx.font = `${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = "middle";
    if (shadow) { ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillText(s, x + size / 8 + 1, y + size / 8 + 1); }
    ctx.fillStyle = color; ctx.fillText(s, x, y);
  }
  function grad(ctx, y, size, a, b) { const gr = ctx.createLinearGradient(0, y - size / 2, 0, y + size / 2); gr.addColorStop(0, a); gr.addColorStop(1, b); return gr; }
  function panel(ctx, x, y, w, h, alpha = 0.7) {
    ctx.fillStyle = `rgba(20,8,40,${alpha})`; ctx.beginPath(); ctx.roundRect(x, y, w, h, 8); ctx.fill();
    ctx.strokeStyle = "rgba(255,120,200,0.5)"; ctx.lineWidth = 2; ctx.stroke();
  }
  function inRect(m, x, y, w, h) { return m.x >= x && m.x <= x + w && m.y >= y && m.y <= y + h; }

  /* ---------- Attract backdrop: a calm drive along the coast ---------- */
  const attract = {
    t: 0, pos: 0,
    draw(ctx, dt) {
      this.t += dt || 0;
      const g = bg, horizon = LH / 2 + 10;
      Gfx.drawSky(g, "coast", 1, horizon, this.t * 30, this.t);
      // simple endless road with a gentle curve
      const curve = Math.sin(this.t * 0.25) * 60;
      for (let y = horizon; y < LH; y += 2) {
        const p = (y - horizon) / (LH - horizon), w = 20 + p * 380, cx = LW / 2 + curve * (1 - p) * (1 - p);
        const stripe = Math.floor((1 / (p + 0.02)) * 4 - this.t * 20) % 2 === 0;
        g.fillStyle = stripe ? "#c89a6a" : "#bc8e60"; g.fillRect(0, y, LW, 2);
        g.fillStyle = stripe ? "#ffffff" : "#8a2aa0"; g.fillRect(cx - w * 1.1, y, w * 2.2, 2);
        g.fillStyle = stripe ? "#6a6070" : "#625868"; g.fillRect(cx - w, y, w * 2, 2);
        if (stripe) { g.fillStyle = "#ffe0a0"; g.fillRect(cx - w * 0.015, y, w * 0.03, 2); }
      }
      g.globalCompositeOperation = "multiply"; g.fillStyle = "#ffc8a0"; g.fillRect(0, 0, LW, LH); g.globalCompositeOperation = "source-over";
      blit(ctx);
    },
  };

  /* ---------- Menus ---------- */
  function makeMenu(items, x, y, w = 460, h = 44, gap = 10) { return { items, sel: 0, x, y, w, h, gap }; }
  function menuIndexAt(m) { for (let i = 0; i < m.items.length; i++) if (inRect(I.mouse, m.x - m.w / 2, m.y + i * (m.h + m.gap), m.w, m.h)) return i; return -1; }
  function menuInput(m) {
    const n = m.items.length;
    if (I.hit("up")) { m.sel = (m.sel + n - 1) % n; A.sfx("menuMove"); }
    if (I.hit("down")) { m.sel = (m.sel + 1) % n; A.sfx("menuMove"); }
    const hi = menuIndexAt(m);
    if (I.mouse.moved && hi >= 0 && hi !== m.sel) { m.sel = hi; A.sfx("menuMove"); }
    const it = m.items[m.sel];
    if (it.adjust) { if (I.hit("left")) it.adjust(-1); if (I.hit("right")) it.adjust(1); }
    if (I.hit("confirm") || (I.mouse.clicked && hi === m.sel && hi >= 0)) { if (it.action) { A.sfx("menuOk"); it.action(); } else if (it.adjust) it.adjust(1, true); }
  }
  function menuDraw(ctx, m, t) {
    m.items.forEach((it, i) => {
      const y = m.y + i * (m.h + m.gap), sel = i === m.sel;
      const label = typeof it.label === "function" ? it.label() : it.label;
      if (sel) { ctx.fillStyle = `rgba(255,60,160,${0.35 + 0.1 * Math.sin(t * 6)})`; ctx.fillRect(m.x - m.w / 2, y, m.w, m.h); }
      txt(ctx, (sel ? "► " : "") + label + (sel ? " ◄" : ""), m.x, y + m.h / 2 + 2, sel ? 20 : 18, sel ? "#ffffff" : "#ffd0f0");
    });
  }

  function drawLogo(ctx, t, y) {
    ctx.save();
    ctx.font = `64px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#3a0a4a"; ctx.fillText("SUNSET", W / 2 + 6, y + 6); ctx.fillText("HIGHWAY", W / 2 + 6, y + 86);
    ctx.fillStyle = grad(ctx, y, 64, "#fff6a0", "#ff4a8a"); ctx.fillText("SUNSET", W / 2, y);
    ctx.fillStyle = grad(ctx, y + 80, 64, "#80f0ff", "#4a5aff"); ctx.fillText("HIGHWAY", W / 2, y + 80);
    ctx.restore();
  }

  /* ---------- Highscores ---------- */
  const DEFAULT_HS = [["CRUISER", 600000], ["SUNNY", 520000], ["TURBO", 450000], ["CHERRY", 380000], ["PALMS", 300000], ["NEON", 230000], ["BREEZE", 170000], ["MIRAGE", 120000], ["COAST", 80000], ["ROOKIE", 40000]]
    .map(([name, score], i) => ({ name, score, stage: i < 2 ? 5 : i < 5 ? 4 : i < 8 ? 3 : 2, date: "" }));
  const HS = (XA.HS = {
    list() { const l = Store.get("scores", null); return Array.isArray(l) && l.length ? l : DEFAULT_HS.slice(); },
    rank(score) { if (score <= 0) return -1; const l = HS.list(); let i = 0; while (i < l.length && l[i].score >= score) i++; return i < 10 ? i : -1; },
    add(name, score, stage) { const l = HS.list(), e = { name, score, stage, date: new Date().toISOString().slice(0, 10) }; l.push(e); l.sort((a, b) => b.score - a.score); const out = l.slice(0, 10); Store.set("scores", out); return out.indexOf(e); },
  });

  /* ---------- Boot ---------- */
  States.boot = {
    t: 0,
    enter() { this.t = 0; },
    input() { if (this.t > 0.2 && (I.pressed.size || I.mouse.clicked || I.pad.pressed.size)) { A.init(); setState("title"); } },
    update(dt) { this.t += dt; },
    draw(ctx) {
      attract.draw(ctx, 1 / 60);
      drawLogo(ctx, this.t, 210);
      if (Math.floor(this.t * 2) % 2 === 0) txt(ctx, "PRESS ANY KEY OR CLICK", W / 2, 470, 20, "#ffffff");
      txt(ctx, "Keyboard · Mouse · Gamepad", W / 2, 520, 22, "#ffd0f0", "center", BODY);
    },
  };

  /* ---------- Title ---------- */
  States.title = {
    t: 0, idle: 0,
    menu: makeMenu([
      { label: "START", action: () => setState("radio") },
      { label: "HIGHSCORES", action: () => setState("highscores") },
      { label: "OPTIONS", action: () => setState("options", "title") },
      { label: "CONTROLS", action: () => setState("controls") },
    ], W / 2, 400),
    enter() { this.t = 0; this.idle = 0; A.playSong("avenue"); A.engineOn(false); XA.Main.setCursor(true); },
    input() { if (I.pressed.size || I.mouse.moved || I.pad.pressed.size || I.pad.dir.size) this.idle = 0; menuInput(this.menu); },
    update(dt) { this.t += dt; this.idle += dt; if (this.idle > 30) setState("highscores", { attract: true }); },
    draw(ctx) {
      attract.draw(ctx, 1 / 60);
      drawLogo(ctx, this.t, 150);
      menuDraw(ctx, this.menu, this.t);
      txt(ctx, "An homage to the 1986 arcade classic Out Run. All graphics, music and code are original.", W / 2, H - 26, 18, "#ffd0f0", "center", BODY);
    },
  };

  /* ---------- Options ---------- */
  const pct = (v) => "■".repeat(Math.round(v * 10)) + "□".repeat(10 - Math.round(v * 10));
  States.options = {
    t: 0, back: "title",
    menu: makeMenu([
      { label: () => "MUSIC " + pct(A.musicVol), adjust: (d, wrap) => { let v = Math.round((A.musicVol + d * 0.1) * 10) / 10; if (wrap && v > 1) v = 0; A.setMusicVol(U.clamp(v, 0, 1)); A.sfx("menuMove"); } },
      { label: () => "SOUND " + pct(A.sfxVol), adjust: (d, wrap) => { let v = Math.round((A.sfxVol + d * 0.1) * 10) / 10; if (wrap && v > 1) v = 0; A.setSfxVol(U.clamp(v, 0, 1)); A.sfx("beep"); } },
      { label: () => "GEARBOX " + (XA.Main.autoGear ? "AUTO" : "MANUAL"), adjust: () => { XA.Main.autoGear = !XA.Main.autoGear; Store.set("autoGear", XA.Main.autoGear); A.sfx("shift"); } },
      { label: () => "FULLSCREEN " + (document.fullscreenElement ? "ON" : "OFF"), action: () => XA.Main.toggleFullscreen() },
      { label: "BACK", action: () => States.options.leave() },
    ], W / 2, 250, 640),
    enter(back) { this.t = 0; this.back = back || "title"; this.menu.sel = 0; },
    leave() { if (this.back === "race") setState("race", { resume: true }); else setState(this.back); },
    input() { if (I.hit("back")) { A.sfx("menuBack"); this.leave(); return; } menuInput(this.menu); },
    update(dt) { this.t += dt; },
    draw(ctx) {
      if (this.back === "race") { States.race.drawScene(ctx); ctx.fillStyle = "rgba(20,0,30,0.75)"; ctx.fillRect(0, 0, W, H); } else attract.draw(ctx, 1 / 60);
      txt(ctx, "OPTIONS", W / 2, 160, 36, "#ffe060");
      menuDraw(ctx, this.menu, this.t);
      txt(ctx, "◄ ► to change · F fullscreen · M mute", W / 2, H - 50, 22, "#ffd0f0", "center", BODY);
    },
  };

  /* ---------- Controls ---------- */
  States.controls = {
    t: 0,
    enter() { this.t = 0; },
    input() { if (I.hit("back") || I.hit("confirm") || I.mouse.clicked) { A.sfx("menuBack"); setState("title"); } },
    update(dt) { this.t += dt; },
    draw(ctx) {
      attract.draw(ctx, 1 / 60);
      txt(ctx, "CONTROLS", W / 2, 70, 34, "#ffe060");
      const cols = [
        ["KEYBOARD", [["Steer", "← → / A D"], ["Accelerate", "↑ / W / Space"], ["Brake", "↓ / S / K"], ["Gear low/high", "Shift / X / G"], ["Radio", "R"], ["Pause", "P / Esc"], ["Fullscreen · Mute", "F · M"]]],
        ["MOUSE", [["Steer", "Pointer left / right"], ["Accelerate", "Left button"], ["Brake", "Right button"], ["Gear", "Wheel / middle button"]]],
        ["GAMEPAD", [["Steer", "Left stick / D-pad"], ["Accelerate", "A / RT"], ["Brake", "B / LT"], ["Gear", "X / Y / LB / RB"], ["Radio", "Back / Select"], ["Pause", "Start"]]],
      ];
      cols.forEach(([head, rows], c) => {
        const x = 60 + c * 400;
        panel(ctx, x, 120, 380, 380);
        txt(ctx, head, x + 190, 150, 16, "#80f0ff");
        rows.forEach(([a, b], i) => { txt(ctx, a, x + 22, 192 + i * 44, 18, "#ffb0e0", "left", BODY, false); txt(ctx, b, x + 22, 214 + i * 44, 22, "#ffffff", "left", BODY, false); });
      });
      panel(ctx, 60, 520, W - 120, 110);
      txt(ctx, "Reach each checkpoint before the time runs out. At every fork, keep left or right to choose", W / 2, 548, 20, "#ffffff", "center", BODY, false);
      txt(ctx, "the next landscape – five different goals are waiting. LOW gear pulls hard, HIGH gear is fast.", W / 2, 576, 20, "#ffffff", "center", BODY, false);
      txt(ctx, "Stay on the road: palm trees, rocks and signs are harder than they look.", W / 2, 604, 20, "#ffffff", "center", BODY, false);
      if (Math.floor(this.t * 2) % 2 === 0) txt(ctx, "PRESS ANY BUTTON", W / 2, H - 40, 16, "#ffd0f0");
    },
  };

  /* ---------- Highscores ---------- */
  States.highscores = {
    t: 0, mark: -1, attract: false,
    enter(o) { this.t = 0; this.mark = o && o.mark !== undefined ? o.mark : -1; this.attract = !!(o && o.attract); if (!this.attract) A.playSong("finale"); A.engineOn(false); XA.Main.setCursor(true); },
    input() { if (this.t > 0.4 && (I.hit("back") || I.hit("confirm") || I.mouse.clicked || (this.attract && (I.pressed.size || I.pad.pressed.size)))) { A.sfx("menuBack"); setState("title"); } },
    update(dt) { this.t += dt; if (this.attract && this.t > 12) setState("title"); },
    draw(ctx) {
      attract.draw(ctx, 1 / 60);
      txt(ctx, "BEST DRIVERS", W / 2, 70, 34, "#ffe060");
      panel(ctx, W / 2 - 400, 110, 800, 540, 0.78);
      txt(ctx, "RANK", W / 2 - 340, 140, 14, "#80f0ff", "left"); txt(ctx, "NAME", W / 2 - 220, 140, 14, "#80f0ff", "left");
      txt(ctx, "STAGE", W / 2 + 110, 140, 14, "#80f0ff"); txt(ctx, "SCORE", W / 2 + 360, 140, 14, "#80f0ff", "right");
      HS.list().forEach((e, i) => {
        const y = 186 + i * 45, hl = i === this.mark;
        if (hl) { ctx.fillStyle = `rgba(255,60,160,${0.3 + 0.15 * Math.sin(this.t * 6)})`; ctx.fillRect(W / 2 - 380, y - 20, 760, 40); }
        const col = hl ? "#fff7b0" : i < 3 ? "#ffd27a" : "#ffffff";
        txt(ctx, `${i + 1}.`, W / 2 - 340, y, 16, col, "left"); txt(ctx, e.name, W / 2 - 220, y, 16, col, "left");
        txt(ctx, e.stage >= 6 ? "GOAL" : String(e.stage), W / 2 + 110, y, 16, col); txt(ctx, U.fmt(e.score), W / 2 + 360, y, 16, col, "right");
      });
      txt(ctx, "Scores are saved in this browser.", W / 2, H - 36, 20, "#ffd0f0", "center", BODY);
    },
  };

  /* ---------- Radio selection (like picking a tape before the drive) ---------- */
  States.radio = {
    t: 0, sel: 0, knob: 0,
    enter() { this.t = 0; this.sel = Store.get("station", 0); this.play(); XA.Main.setCursor(true); },
    play() { A.playSong(A.STATIONS[this.sel][0]); A.sfx("tune"); Store.set("station", this.sel); },
    input() {
      const n = A.STATIONS.length;
      if (I.hit("left")) { this.sel = (this.sel + n - 1) % n; this.knob -= 1; this.play(); }
      if (I.hit("right")) { this.sel = (this.sel + 1) % n; this.knob += 1; this.play(); }
      for (let i = 0; i < n; i++) if (I.mouse.clicked && inRect(I.mouse, 290 + i * 240, 300, 220, 120)) { if (this.sel === i) { this.go(); return; } this.knob += i - this.sel; this.sel = i; this.play(); return; }
      if (I.hit("confirm") || I.hit("accel")) this.go();
      if (I.hit("back")) setState("title");
    },
    go() { A.sfx("menuOk"); XA.G.newRace(); setState("race", {}); },
    update(dt) { this.t += dt; },
    draw(ctx) {
      // dashboard view
      const g = bg;
      Gfx.drawSky(g, "beach", 0, LH / 2 + 10, this.t * 10, this.t);
      g.fillStyle = "#e8d090"; g.fillRect(0, LH / 2 + 10, LW, LH);
      g.fillStyle = "#808088"; g.beginPath(); g.moveTo(LW / 2 - 6, LH / 2 + 10); g.lineTo(LW / 2 + 6, LH / 2 + 10); g.lineTo(LW, LH); g.lineTo(0, LH); g.fill();
      blit(ctx);
      ctx.fillStyle = "#2a0a14"; ctx.beginPath(); ctx.moveTo(0, 230); ctx.quadraticCurveTo(W / 2, 170, W, 230); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
      ctx.fillStyle = "#4a1420"; ctx.beginPath(); ctx.moveTo(0, 250); ctx.quadraticCurveTo(W / 2, 195, W, 250); ctx.lineTo(W, 270); ctx.quadraticCurveTo(W / 2, 215, 0, 270); ctx.fill();
      // radio unit
      panel(ctx, 260, 250, 760, 270, 0.95);
      txt(ctx, "SELECT MUSIC", W / 2, 280, 18, "#ffe060");
      A.STATIONS.forEach(([key, name], i) => {
        const x = 290 + i * 240, sel = i === this.sel;
        ctx.fillStyle = sel ? "#1a3a1a" : "#141414"; ctx.fillRect(x, 300, 220, 120);
        ctx.strokeStyle = sel ? "#60ff80" : "#3a3a3a"; ctx.lineWidth = 3; ctx.strokeRect(x, 300, 220, 120);
        txt(ctx, `FM ${(88.5 + i * 7.2).toFixed(1)}`, x + 110, 330, 14, sel ? "#80ff90" : "#5a7a5a", "center", FONT, false);
        txt(ctx, name.toUpperCase(), x + 110, 368, 12, sel ? "#ffffff" : "#8a8a8a", "center", FONT, false);
        if (sel) for (let b = 0; b < 12; b++) { const h = 4 + Math.abs(Math.sin(this.t * 8 + b * 1.3)) * 16; ctx.fillStyle = "#60ff80"; ctx.fillRect(x + 40 + b * 12, 410 - h, 8, h); }
      });
      // knob and the driver's hand
      const kx = W / 2, ky = 470, a = this.knob * 0.8 + Math.sin(this.t * 2) * 0.05;
      ctx.fillStyle = "#c0c0c8"; ctx.beginPath(); ctx.arc(kx, ky, 26, 0, TAU); ctx.fill();
      ctx.strokeStyle = "#333"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(kx + Math.cos(a - Math.PI / 2) * 22, ky + Math.sin(a - Math.PI / 2) * 22); ctx.stroke();
      ctx.fillStyle = "#f0c090"; ctx.beginPath(); ctx.ellipse(kx + 60, ky + 40, 46, 22, -0.5, 0, TAU); ctx.fill();
      ctx.fillRect(kx + 80, ky + 40, 200, 34);
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(kx + 22 + i * 4, ky + 6 + i * 12, 16, 7, -0.3, 0, TAU); ctx.fill(); }
      ctx.fillStyle = "#ffffff"; ctx.fillRect(kx + 240, ky + 36, 60, 42);
      txt(ctx, "◄ ► choose · Accelerate / Enter / click again to start", W / 2, H - 40, 22, "#ffd0f0", "center", BODY);
    },
  };

  /* ---------- Race ---------- */
  G.newRace = () => R.newRace();
  States.race = {
    paused: false,
    pauseMenu: makeMenu([
      { label: "RESUME", action: () => { States.race.paused = false; } },
      { label: "NEXT RADIO STATION", action: () => { States.race.nextStation(); } },
      { label: "OPTIONS", action: () => setState("options", "race") },
      { label: "QUIT TO TITLE", action: () => { States.race.paused = false; setState("title"); } },
    ], W / 2, 290, 560),
    enter(o) {
      if (o && o.resume) { this.paused = true; return; }
      this.paused = false; this.over = false;
      A.engineOn(true);
    },
    nextStation() { const n = A.STATIONS.length, i = (Store.get("station", 0) + 1) % n; Store.set("station", i); A.playSong(A.STATIONS[i][0]); A.sfx("tune"); R.say(U.pick(["NICE TUNE!", "I LOVE THIS ONE!", "CHANGE IT BACK!"]), 1); },
    pause() { if (!this.paused && R.phase === "race") { this.paused = true; this.pauseMenu.sel = 0; A.engineSet(0, 0, 0, 0, 0); } },
    input() {
      if (this.paused) { if (I.hit("pause") || I.hit("back")) { this.paused = false; return; } menuInput(this.pauseMenu); return; }
      if (I.hit("pause")) { this.pause(); return; }
      if (!XA.Main.autoGear && R.phase === "race" && (I.hit("gear") || I.mouse.mclicked || I.mouse.wheel)) { R.gear = 1 - R.gear; A.sfx("shift"); }
      if (I.hit("radio")) this.nextStation();
    },
    update(dt) {
      XA.Main.setCursor(this.paused);
      if (this.paused) return;
      R.update(dt);
      if (!this.over && R.phase === "timeup" && R.phaseT > 3.2) { this.over = true; setState("gameover"); }
      if (!this.over && R.phase === "goal" && R.phaseT > 3) { this.over = true; setState("goal"); }
    },
    drawScene(ctx) { R.render(bg); blit(ctx); drawHUD(ctx); },
    draw(ctx) {
      this.drawScene(ctx);
      if (this.paused) {
        ctx.fillStyle = "rgba(20,0,30,0.72)"; ctx.fillRect(0, 0, W, H);
        txt(ctx, "PAUSE", W / 2, 210, 44, "#ffe060");
        menuDraw(ctx, this.pauseMenu, performance.now() / 1000);
      }
    },
  };

  function drawHUD(ctx) {
    const sp = Math.round((R.speed / R.MAXV) * 290);
    // time
    txt(ctx, "TIME", W / 2, 34, 16, "#ffe060");
    const tcol = R.time < 10 && Math.floor(R.t * 4) % 2 ? "#ff4a4a" : "#ffffff";
    txt(ctx, String(Math.ceil(R.time)), W / 2, 76, 44, tcol);
    // score
    txt(ctx, "SCORE", 40, 34, 14, "#80f0ff", "left");
    txt(ctx, U.fmt(R.score), 40, 62, 22, "#ffffff", "left");
    // stage and route
    txt(ctx, "STAGE", W - 40, 34, 14, "#80f0ff", "right");
    txt(ctx, String(R.row + 1), W - 40, 62, 22, "#ffffff", "right");
    drawMiniMap(ctx, W - 180, 92);
    // speed
    txt(ctx, `${sp}`, W - 140, H - 52, 40, "#ffffff", "right");
    txt(ctx, "km/h", W - 40, H - 46, 16, "#ffe060", "right");
    const gear = R.gear ? "HIGH" : "LOW";
    ctx.fillStyle = R.gear ? "#ff3a8a" : "#3aa0ff"; ctx.beginPath(); ctx.roundRect(W - 300, H - 110, 110, 34, 6); ctx.fill();
    txt(ctx, gear, W - 245, H - 92, 16, "#ffffff");
    // rev bar
    for (let i = 0; i < 20; i++) { const on = i / 20 < (R.gear ? Math.max(0, (R.speed / R.MAXV - 0.25) / 0.75) : R.speed / R.MAXV / 0.66); ctx.fillStyle = on ? (i > 15 ? "#ff3a3a" : i > 10 ? "#ffd040" : "#40ff80") : "rgba(255,255,255,0.15)"; ctx.fillRect(W - 300 + i * 13, H - 32, 10, 14); }
    // station
    txt(ctx, "♪ " + (A.STATIONS.find((s) => s[0] === A.songName) || ["", "radio off"])[1], 40, H - 30, 20, "#ffd0f0", "left", BODY);
    // messages
    if (R.phase === "countdown") { const n = Math.ceil(3 - R.phaseT); txt(ctx, n > 0 ? String(n) : "GO!", W / 2, H / 2 - 40, 80, n > 0 ? "#ffe060" : "#60ff80"); }
    if (R.phase === "race" && R.phaseT < 1) txt(ctx, "GO!", W / 2, H / 2 - 40, 80, "#60ff80");
    if (R.msg) { const s = 1 + Math.max(0, R.msg.t - 2.6) * 2; txt(ctx, R.msg.text, W / 2, 180, 36 * s, "#ffe060"); txt(ctx, R.msg.sub, W / 2, 230, 20, "#ffffff"); }
    if (R.forkAt && !R.locked) {
      const s = R.findSeg(R.pos + 900);
      if (s.index > R.forkAt.start - 120 && s.index < R.forkAt.lock && Math.floor(R.t * 3) % 2) txt(ctx, "◄ " + R.forkAt.names[0].toUpperCase() + "     " + R.forkAt.names[1].toUpperCase() + " ►", W / 2, 140, 16, "#ffffff");
    }
    if (R.phase === "timeup") txt(ctx, "TIME UP", W / 2, H / 2 - 40, 60, "#ff4a4a");
    if (R.phase === "goal") txt(ctx, "GOAL!", W / 2, H / 2 - 60, 70, "#ffe060");
  }

  function nodeXY(r, c, x0, y0, sx, sy) { return [x0 + r * sx, y0 + (c - r / 2) * sy]; }
  function drawMiniMap(ctx, x0, y0) {
    ctx.save(); ctx.globalAlpha = 0.85;
    for (let r = 0; r < 5; r++) for (let c = 0; c <= r; c++) {
      const [x, y] = nodeXY(r, c, x0, y0 + 30, 34, 16);
      if (r < 4) for (const d of [0, 1]) { const [x2, y2] = nodeXY(r + 1, c + d, x0, y0 + 30, 34, 16); ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke(); }
    }
    for (let r = 0; r < R.route.length - 1; r++) { const [x, y] = nodeXY(r, R.route[r], x0, y0 + 30, 34, 16), [x2, y2] = nodeXY(r + 1, R.route[r + 1], x0, y0 + 30, 34, 16); ctx.strokeStyle = "#ffe060"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke(); }
    for (let r = 0; r < 5; r++) for (let c = 0; c <= r; c++) {
      const [x, y] = nodeXY(r, c, x0, y0 + 30, 34, 16), cur = r === R.row && c === R.col;
      ctx.fillStyle = cur ? (Math.floor(R.t * 4) % 2 ? "#ffe060" : "#ff3a8a") : R.route[r] === c ? "#ffe060" : "#5a4a7a";
      ctx.beginPath(); ctx.arc(x, y, cur ? 6 : 4, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  function drawBigMap(ctx, x0, y0) {
    for (let r = 0; r < 5; r++) for (let c = 0; c <= r; c++) {
      const [x, y] = nodeXY(r, c, x0, y0, 200, 80);
      if (r < 4) for (const d of [0, 1]) { const [x2, y2] = nodeXY(r + 1, c + d, x0, y0, 200, 80); ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke(); }
    }
    for (let r = 0; r < R.route.length - 1; r++) { const [x, y] = nodeXY(r, R.route[r], x0, y0, 200, 80), [x2, y2] = nodeXY(r + 1, R.route[r + 1], x0, y0, 200, 80); ctx.strokeStyle = "#ffe060"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke(); }
    for (let r = 0; r < 5; r++) for (let c = 0; c <= r; c++) {
      const [x, y] = nodeXY(r, c, x0, y0, 200, 80), on = R.route[r] === c && r < R.route.length;
      ctx.fillStyle = on ? "#ffe060" : "#5a4a7a"; ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fill();
      txt(ctx, R.NODES[r][c].name, x, y + 22, 18, on ? "#ffffff" : "#b8a8d8", "center", BODY, false);
    }
  }

  /* ---------- Time up ---------- */
  function afterGame(stage) {
    const rank = R.cheated ? -1 : HS.rank(Math.floor(R.score));
    XA.G.lastStage = stage;
    if (rank >= 0) setState("nameentry"); else setState("highscores");
  }
  States.gameover = {
    t: 0,
    enter() { this.t = 0; A.engineOn(false); A.jingle("gameover"); XA.Main.setCursor(true); },
    input() { if (this.t > 1.5 && (I.hit("confirm") || I.mouse.clicked || I.hit("back"))) afterGame(R.row + 1); },
    update(dt) { this.t += dt; if (this.t > 9) afterGame(R.row + 1); },
    draw(ctx) {
      R.render(bg); blit(ctx);
      ctx.fillStyle = `rgba(20,0,30,${Math.min(0.8, this.t)})`; ctx.fillRect(0, 0, W, H);
      txt(ctx, "GAME OVER", W / 2, 90, 50, "#ff4a8a");
      txt(ctx, "YOUR ROUTE", W / 2, 150, 16, "#80f0ff");
      drawBigMap(ctx, 240, 380);
      txt(ctx, `SCORE ${U.fmt(R.score)}`, W / 2, H - 60, 24, "#ffe060");
    },
  };

  /* ---------- Goal: five different endings ---------- */
  const ENDINGS = [
    { title: "CAMPFIRE UNDER THE STARS", text: "They roast marshmallows in the desert night. One of them catches fire. Of course." },
    { title: "DANCING ON THE BOULEVARD", text: "Fireworks over the city – and a little dance on the bonnet of the car." },
    { title: "THE COW AND THE MOON", text: "Out on the farm, a very ambitious cow gives it a try. Nobody believes them later." },
    { title: "SNOWBALL SHOWDOWN", text: "At the summit lodge the drive ends in a snowball fight. The driver never had a chance." },
    { title: "PARADISE, MOSTLY", text: "They forgot the handbrake. The car is gone, but the sunset is beautiful." },
  ];
  States.goal = {
    t: 0, bonus: 0, counted: 0,
    enter() {
      this.t = 0; A.engineOn(false); A.jingle("goal"); setTimeout(() => { if (XA.Main.state === "goal") A.playSong("finale"); }, 2500);
      this.col = R.col; this.node = R.NODES[4][R.col];
      this.bonus = R.cheated ? 0 : Math.floor(R.time) * 20000 + 100000; this.counted = 0;
      this.confetti = [];
      XA.Main.setCursor(true);
    },
    input() { if (this.t > 4 && (I.hit("confirm") || I.hit("accel") || I.mouse.clicked)) { R.score += this.bonus - this.counted; this.counted = this.bonus; afterGame(6); } },
    update(dt) {
      this.t += dt;
      if (this.t > 2 && this.counted < this.bonus) { const step = Math.min(this.bonus - this.counted, Math.max(5000, this.bonus * dt)); this.counted += step; R.score += step; if (Math.random() < 0.5) A.sfx("tick"); }
      if (Math.random() < dt * 30) this.confetti.push({ x: U.rand(0, LW), y: -5, vy: U.rand(30, 70), vx: U.rand(-20, 20), col: U.pick(["#ff4a8a", "#ffe060", "#40f0ff", "#60ff80"]) });
      for (const c of this.confetti) { c.x += c.vx * dt; c.y += c.vy * dt; }
      this.confetti = this.confetti.filter((c) => c.y < LH);
    },
    draw(ctx) {
      const g = bg, t = this.t, n = this.node, hz = LH / 2 + 30;
      Gfx.drawSky(g, n.theme, n.tod, hz, t * 5, t);
      const th = Gfx.THEMES[n.theme];
      g.fillStyle = th.ground[0]; g.fillRect(0, hz, LW, LH - hz);
      g.fillStyle = th.road[0]; g.fillRect(0, LH - 70, LW, 50); g.fillStyle = th.lane; for (let x = 0; x < LW; x += 60) g.fillRect(x, LH - 47, 30, 3);
      scene(g, this.col, t);
      if (n.tod) { g.globalCompositeOperation = "multiply"; g.fillStyle = n.tod === 2 ? "#6a6ab0" : "#ffd0b0"; g.fillRect(0, 0, LW, LH); g.globalCompositeOperation = "source-over"; }
      for (const c of this.confetti) { g.fillStyle = c.col; g.fillRect(c.x, c.y, 3, 2); }
      blit(ctx);
      const e = ENDINGS[this.col];
      txt(ctx, "CONGRATULATIONS!", W / 2, 60, 36, "#ffe060");
      txt(ctx, `GOAL ${this.col + 1} · ${n.name.toUpperCase()}`, W / 2, 110, 18, "#ffffff");
      panel(ctx, 140, 140, W - 280, 150, 0.75);
      txt(ctx, e.title, W / 2, 170, 18, "#80f0ff");
      txt(ctx, e.text, W / 2, 206, 22, "#ffffff", "center", BODY, false);
      txt(ctx, `TIME BONUS ${U.fmt(this.counted)}`, W / 2, 242, 18, "#ffe060");
      txt(ctx, `SCORE ${U.fmt(R.score)}`, W / 2, 272, 18, "#ffffff");
      if (this.t > 4 && Math.floor(this.t * 2) % 2) txt(ctx, "PRESS ACCELERATE", W / 2, H - 24, 14, "#ffd0f0");
    },
  };

  // little cartoon finales, drawn in the low resolution buffer
  function scene(g, k, t) {
    const P = R.drawPerson, cx = LW / 2, cy = LH - 30;
    const car = (x, y) => { g.save(); g.translate(x - cx, y - cy); R.drawCar(g, cx, cy, 0, 0, false); g.restore(); };
    if (k === 0) {
      car(160, cy);
      // campfire
      const fx = 400, fy = cy - 20;
      g.fillStyle = "#5a3a1a"; g.fillRect(fx - 20, fy, 40, 6);
      for (let i = 0; i < 6; i++) { g.fillStyle = ["#ffe060", "#ff9a30", "#ff4a1a"][i % 3]; const h = 20 + Math.sin(t * 12 + i) * 8; g.beginPath(); g.moveTo(fx - 14 + i * 5, fy); g.lineTo(fx - 12 + i * 5, fy - h); g.lineTo(fx - 8 + i * 5, fy); g.fill(); }
      P(g, fx - 50, fy - 26, 0, "drive", 0); P(g, fx + 50, fy - 26, 1, "sit", 0);
      // marshmallow sticks, one is burning
      g.strokeStyle = "#8a6a3a"; g.lineWidth = 2;
      g.beginPath(); g.moveTo(fx - 38, fy - 18); g.lineTo(fx - 6, fy - 30); g.moveTo(fx + 38, fy - 18); g.lineTo(fx + 6, fy - 30); g.stroke();
      g.fillStyle = "#fff"; g.fillRect(fx + 2, fy - 34, 6, 5);
      g.fillStyle = t % 2 < 1 ? "#ff6a1a" : "#ffe060"; g.fillRect(fx - 10, fy - 36 - Math.sin(t * 20) * 2, 7, 7);
      g.fillStyle = "#fff"; g.font = "bold 9px monospace"; if (Math.floor(t) % 4 < 2) g.fillText("FIRE! FIRE!", fx - 70, fy - 60);
    } else if (k === 1) {
      for (let i = 0; i < 4; i++) { const ph = (t * 0.7 + i * 0.27) % 1, x = 120 + i * 130, y = 140 - ph * 80; g.fillStyle = ["#ff4a8a", "#ffe060", "#40f0ff", "#60ff80"][i]; if (ph > 0.6) for (let k2 = 0; k2 < 12; k2++) { const a = k2 * TAU / 12, r = (ph - 0.6) * 120; g.fillRect(x + Math.cos(a) * r, y + Math.sin(a) * r, 2, 2); } else g.fillRect(x, y, 2, 4); }
      car(cx, cy);
      const hop = Math.abs(Math.sin(t * 6)) * 8;
      P(g, cx - 24, cy - 92 - hop, 0, "cheer", Math.sin(t * 6));
      P(g, cx + 24, cy - 92 - (8 - hop), 1, "cheer", -Math.sin(t * 6));
    } else if (k === 2) {
      const mx = 470, my = 70;
      g.fillStyle = "#fff8d0"; g.beginPath(); g.arc(mx, my, 30, 0, TAU); g.fill();
      const ph = (t * 0.4) % 1, ax = 80 + ph * 520, ay = 200 - Math.sin(ph * Math.PI) * 190;
      g.save(); g.translate(ax, ay); g.rotate(Math.sin(t) * 0.2); g.drawImage(Gfx.spr.cow, -20, -14, 40, 28); g.restore();
      g.fillStyle = "#fff"; g.font = "bold 9px monospace"; g.fillText("MOOOOO!", ax - 20, ay - 18);
      car(150, cy);
      P(g, 330, cy - 40, 0, "point", 0); P(g, 370, cy - 40, 1, "cheer", 0);
    } else if (k === 3) {
      g.drawImage(Gfx.spr.chalet, 420, 120, 140, 108);
      car(170, cy);
      const ph = (t * 0.8) % 1;
      P(g, 330, cy - 40, 0, Math.floor(t * 0.8) % 2 ? "slapped" : "drive", 0);
      P(g, 520, cy - 40, 1, ph < 0.3 ? "point" : "sit", 0);
      if (ph > 0.25) { const x = 510 - (ph - 0.25) * 240, y = cy - 50 - Math.sin((ph - 0.25) * 4) * 30; g.fillStyle = "#fff"; g.beginPath(); g.arc(x, y, 5, 0, TAU); g.fill(); }
      if (ph > 0.9) { g.fillStyle = "#fff"; for (let i = 0; i < 8; i++) g.fillRect(335 + Math.cos(i) * 14, cy - 56 + Math.sin(i) * 10, 3, 3); }
    } else {
      g.fillStyle = "#3a6ac0"; g.fillRect(0, LH / 2 + 30, LW, 60);
      const ph = Math.min(1, t * 0.15);
      g.save(); g.translate(-ph * 220, ph * 50); g.globalAlpha = 1 - ph * 0.7; car(cx + 80, cy - 40); g.restore();
      g.globalAlpha = 1;
      // inflatable ring with both of them
      const rx = 260 + Math.sin(t) * 10, ry = LH / 2 + 60 + Math.sin(t * 2) * 3;
      g.fillStyle = "#ff4a8a"; g.beginPath(); g.ellipse(rx, ry, 50, 12, 0, 0, TAU); g.fill(); g.fillStyle = "#3a6ac0"; g.beginPath(); g.ellipse(rx, ry, 30, 6, 0, 0, TAU); g.fill();
      P(g, rx - 16, ry - 20, 0, "drive", 0); P(g, rx + 16, ry - 20, 1, "cheer", Math.sin(t * 3));
      g.fillStyle = "#fff"; g.font = "bold 9px monospace"; if (Math.floor(t) % 5 > 2) g.fillText("THE HANDBRAKE!!", rx - 40, ry - 60);
    }
  }

  /* ---------- Name entry ---------- */
  const KEYS = ["ABCDEFGHIJ", "KLMNOPQRST", "UVWXYZ0123", "456789.-! "];
  States.nameentry = {
    t: 0, name: "", sel: 0, rank: 0,
    enter() { this.t = 0; this.name = Store.get("lastName", ""); this.sel = 0; this.rank = HS.rank(Math.floor(R.score)); A.playSong("finale"); XA.Main.setCursor(true); },
    cells() {
      const out = [];
      KEYS.forEach((row, rr) => [...row].forEach((ch, c) => out.push({ ch, x: W / 2 - 330 + c * 66, y: 320 + rr * 62, w: 58, h: 52 })));
      out.push({ ch: "DEL", x: W / 2 - 330, y: 568, w: 190, h: 52 }); out.push({ ch: "SAVE", x: W / 2 - 124, y: 568, w: 250, h: 52 }); out.push({ ch: "SKIP", x: W / 2 + 142, y: 568, w: 190, h: 52 });
      return out;
    },
    press(ch) {
      if (ch === "DEL") { this.name = this.name.slice(0, -1); A.sfx("menuBack"); }
      else if (ch === "SAVE") this.save();
      else if (ch === "SKIP") { A.sfx("menuBack"); setState("highscores"); }
      else if (this.name.length < 10) { this.name += ch; A.sfx("menuMove"); }
    },
    save() { const name = this.name.trim() || "DRIVER"; Store.set("lastName", name); const pos = HS.add(name, Math.floor(R.score), XA.G.lastStage || R.row + 1); A.sfx("menuOk"); setState("highscores", { mark: pos }); },
    input() {
      for (const ch of I.typed) { const c = ch.toUpperCase(); if (/^[A-Z0-9 .\-!ÄÖÜ]$/.test(c) && this.name.length < 10) { this.name += c; A.sfx("menuMove"); } }
      if (I.pressed.has("Backspace")) { this.name = this.name.slice(0, -1); A.sfx("menuBack"); }
      if (I.pressed.has("Enter") || I.pressed.has("NumpadEnter")) { this.save(); return; }
      if (I.pressed.has("Escape")) { A.sfx("menuBack"); setState("highscores"); return; }
      const cells = this.cells();
      const nav = (d) => I.rep.has("Arrow" + d[0].toUpperCase() + d.slice(1)) || I.pad.dir.has(d) || I.pad.pressed.has({ up: 12, down: 13, left: 14, right: 15 }[d]);
      const rowOf = (i) => (i >= 40 ? 4 : Math.floor(i / 10)), colOf = (i) => (i >= 40 ? i - 40 : i % 10);
      let s = this.sel;
      if (nav("right")) s = s >= 40 ? 40 + ((s - 40 + 1) % 3) : rowOf(s) * 10 + ((colOf(s) + 1) % 10);
      if (nav("left")) s = s >= 40 ? 40 + ((s - 40 + 2) % 3) : rowOf(s) * 10 + ((colOf(s) + 9) % 10);
      if (nav("down")) s = s >= 40 ? Math.min(9, (s - 40) * 4) : s >= 30 ? 40 + Math.min(2, Math.floor(colOf(s) / 3.4)) : s + 10;
      if (nav("up")) s = s >= 40 ? 30 + (s - 40) * 4 : s < 10 ? 40 + Math.min(2, Math.floor(s / 3.4)) : s - 10;
      if (s !== this.sel) { this.sel = s; A.sfx("menuMove"); }
      let hi = -1; cells.forEach((c, i) => { if (inRect(I.mouse, c.x, c.y, c.w, c.h)) hi = i; });
      if (I.mouse.moved && hi >= 0) this.sel = hi;
      if (I.pad.pressed.has(0) || (I.mouse.clicked && hi >= 0)) this.press(cells[this.sel].ch);
      if (I.pad.pressed.has(1)) this.press("DEL");
      if (I.pad.pressed.has(9)) this.save();
    },
    update(dt) { this.t += dt; },
    draw(ctx) {
      attract.draw(ctx, 1 / 60);
      ctx.fillStyle = "rgba(20,0,30,0.72)"; ctx.fillRect(0, 0, W, H);
      txt(ctx, "NEW HIGHSCORE", W / 2, 70, 36, "#ffe060");
      txt(ctx, `Rank ${this.rank + 1} with ${U.fmt(Math.floor(R.score))} points`, W / 2, 130, 28, "#ffffff", "center", BODY);
      txt(ctx, "Enter your name to join the list – or skip it.", W / 2, 166, 24, "#ffd0f0", "center", BODY);
      panel(ctx, W / 2 - 260, 200, 520, 80, 0.85);
      txt(ctx, this.name + (this.name.length < 10 && Math.floor(this.t * 2.5) % 2 ? "_" : " "), W / 2, 242, 30, "#ffffff");
      this.cells().forEach((c, i) => {
        const sel = i === this.sel;
        ctx.fillStyle = sel ? "rgba(255,60,160,0.75)" : c.ch.length > 1 ? "rgba(60,160,255,0.35)" : "rgba(40,20,60,0.85)";
        ctx.beginPath(); ctx.roundRect(c.x, c.y, c.w, c.h, 6); ctx.fill();
        ctx.strokeStyle = sel ? "#ffe0f0" : "rgba(255,120,200,0.35)"; ctx.lineWidth = 2; ctx.stroke();
        txt(ctx, c.ch === " " ? "␣" : c.ch, c.x + c.w / 2, c.y + c.h / 2 + 2, c.ch.length > 1 ? 14 : 18, "#ffffff", "center", FONT, false);
      });
      txt(ctx, "Type with the keyboard · Enter saves · Esc skips · Gamepad: A types, B deletes, Start saves", W / 2, H - 30, 20, "#ffd0f0", "center", BODY);
    },
  };
})(window.XA);
