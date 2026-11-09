/* DREAMHOP: screens – title, world intro, HUD, pause, game over, ending, highscores, name entry */
"use strict";

(function (XA) {
  const { U, Gfx, G, Store } = XA;
  const A = XA.Audio, I = XA.Input;
  const W = U.W, H = U.H, TAU = U.TAU, LW = Gfx.LW, LH = Gfx.LH;
  const States = (XA.States = {});
  let setState = null;
  XA.UI = { bind(fn) { setState = fn; } };

  const buf = document.createElement("canvas"); buf.width = LW; buf.height = LH;
  const bg = buf.getContext("2d");
  function blit(ctx) { ctx.imageSmoothingEnabled = false; ctx.drawImage(buf, 0, 0, W, H); ctx.imageSmoothingEnabled = true; }

  const FONT = "'Press Start 2P', 'Courier New', monospace";
  const BODY = "Rajdhani, 'Segoe UI', Arial, sans-serif";
  function txt(ctx, s, x, y, size, color = "#fff", align = "center", font = FONT, shadow = true) {
    ctx.font = `${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = "middle";
    if (shadow) { ctx.fillStyle = "rgba(40,10,60,0.85)"; ctx.fillText(s, x + Math.max(2, size / 8), y + Math.max(2, size / 8)); }
    ctx.fillStyle = color; ctx.fillText(s, x, y);
  }
  function panel(ctx, x, y, w, h, alpha = 0.75) {
    ctx.fillStyle = `rgba(40,20,80,${alpha})`; ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.fill();
    ctx.strokeStyle = "rgba(255,200,240,0.7)"; ctx.lineWidth = 3; ctx.stroke();
  }
  const inRect = (m, x, y, w, h) => m.x >= x && m.x <= x + w && m.y >= y && m.y <= y + h;

  /* ---------- Dreamy backdrop: Lulu bounces along a meadow ---------- */
  const back = {
    t: 0,
    draw(ctx, world = 0) {
      this.t += 1 / 60;
      const g = bg, t = this.t, T = Gfx.tiles[world];
      Gfx.drawBackground(g, world, t * 30, 0, t);
      for (let c = -1; c < 22; c++) { const x = c * 16 - ((t * 30) % 16); g.drawImage(T.top, x, LH - 32); g.drawImage(T.ground, x, LH - 16); }
      for (let i = 0; i < 5; i++) { const x = ((i * 97 - t * 30) % 360 + 360) % 360 - 20, img = T.deco[i % 4]; g.drawImage(img, x, LH - 32 - img.height); }
      const H = Gfx.hero[Math.floor(t / 6) % 2], ph = (t * 1.6) % 1;
      const y = LH - 32 - Math.sin(ph * Math.PI) * 20;
      g.drawImage(ph < 0.85 ? H.jump : H.walk[Math.floor(t * 8) % 4], 60, Math.round(y - 25));
      const E = Gfx.enemies[world];
      g.drawImage(E.walker[Math.floor(t * 5) % 2], 250 - ((t * 10) % 40), LH - 48);
      blit(ctx);
    },
  };

  /* ---------- Menus ---------- */
  function makeMenu(items, x, y, w = 520, h = 50, gap = 10) { return { items, sel: 0, x, y, w, h, gap }; }
  const menuIndexAt = (m) => { for (let i = 0; i < m.items.length; i++) if (inRect(I.mouse, m.x - m.w / 2, m.y + i * (m.h + m.gap), m.w, m.h)) return i; return -1; };
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
      if (sel) { ctx.fillStyle = `rgba(255,120,200,${0.4 + 0.12 * Math.sin(t * 6)})`; ctx.beginPath(); ctx.roundRect(m.x - m.w / 2, y, m.w, m.h, 10); ctx.fill(); }
      const label = typeof it.label === "function" ? it.label() : it.label;
      txt(ctx, (sel ? "★ " : "") + label + (sel ? " ★" : ""), m.x, y + m.h / 2 + 2, sel ? 20 : 18, sel ? "#ffffff" : "#ffe0f4");
    });
  }

  function drawLogo(ctx, t, y) {
    ctx.save();
    ctx.font = `72px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const letters = "DREAMHOP".split(""), cols = ["#ff6ab0", "#ffb040", "#ffe040", "#60e080", "#40c8ff", "#8a6aff", "#ff6ab0", "#ffb040"];
    let x = W / 2 - 252;
    letters.forEach((ch, i) => {
      const yy = y + Math.sin(t * 3 + i * 0.6) * 8;
      ctx.fillStyle = "#3a1050"; ctx.fillText(ch, x + 6, yy + 6);
      ctx.fillStyle = cols[i]; ctx.fillText(ch, x, yy);
      x += 72;
    });
    ctx.restore();
    txt(ctx, "A JOURNEY THROUGH LULU'S DREAMS", W / 2, y + 74, 16, "#ffffff");
  }

  /* ---------- Highscores ---------- */
  const DEFAULT_HS = [["SNOOZY", 90000], ["PILLOW", 75000], ["DOZE", 60000], ["NAPPER", 48000], ["DREAMY", 36000], ["YAWN", 26000], ["SLUMBER", 18000], ["SNORE", 11000], ["SIESTA", 6000], ["NIGHTY", 2500]]
    .map(([name, score], i) => ({ name, score, stage: i < 2 ? "4-3" : i < 5 ? "3-1" : i < 8 ? "2-1" : "1-2", date: "" }));
  const HS = (XA.HS = {
    list() { const l = Store.get("scores", null); return Array.isArray(l) && l.length ? l : DEFAULT_HS.slice(); },
    rank(score) { if (score <= 0) return -1; const l = HS.list(); let i = 0; while (i < l.length && l[i].score >= score) i++; return i < 10 ? i : -1; },
    add(name, score, stage) { const l = HS.list(), e = { name, score, stage, date: new Date().toISOString().slice(0, 10) }; l.push(e); l.sort((a, b) => b.score - a.score); const out = l.slice(0, 10); Store.set("scores", out); return out.indexOf(e); },
  });

  /* ---------- Boot / title / options / controls / highscores ---------- */
  States.boot = {
    t: 0,
    enter() { this.t = 0; },
    input() { if (this.t > 0.2 && (I.pressed.size || I.mouse.clicked || I.pad.pressed.size)) { A.init(); setState("title"); } },
    update(dt) { this.t += dt; },
    draw(ctx) {
      back.draw(ctx);
      drawLogo(ctx, this.t, 220);
      if (Math.floor(this.t * 2) % 2 === 0) txt(ctx, "PRESS ANY KEY OR CLICK", W / 2, 440, 20, "#ffffff");
      txt(ctx, "Keyboard · Mouse · Gamepad", W / 2, 490, 24, "#ffffff", "center", BODY);
    },
  };

  States.title = {
    t: 0, idle: 0,
    menu: makeMenu([
      { label: "START", action: () => { G.newGame(); setState("intro"); } },
      { label: "HIGHSCORES", action: () => setState("highscores") },
      { label: "OPTIONS", action: () => setState("options", "title") },
      { label: "CONTROLS", action: () => setState("controls") },
    ], W / 2, 340),
    enter() { this.t = 0; this.idle = 0; A.tempo = 1; A.playSong("title"); XA.Main.setCursor(true); },
    input() { if (I.pressed.size || I.mouse.moved || I.pad.pressed.size || I.pad.dir.size) this.idle = 0; menuInput(this.menu); },
    update(dt) { this.t += dt; this.idle += dt; if (this.idle > 30) setState("highscores", { attract: true }); },
    draw(ctx) {
      back.draw(ctx);
      drawLogo(ctx, this.t, 150);
      menuDraw(ctx, this.menu, this.t);
      txt(ctx, "An homage to the 1987 home computer classic The Great Giana Sisters. All graphics, music and code are original.", W / 2, H - 24, 18, "#ffffff", "center", BODY);
    },
  };

  const pct = (v) => "■".repeat(Math.round(v * 10)) + "□".repeat(10 - Math.round(v * 10));
  States.options = {
    t: 0, back: "title",
    menu: makeMenu([
      { label: () => "MUSIC " + pct(A.musicVol), adjust: (d, wrap) => { let v = Math.round((A.musicVol + d * 0.1) * 10) / 10; if (wrap && v > 1) v = 0; A.setMusicVol(U.clamp(v, 0, 1)); A.sfx("menuMove"); } },
      { label: () => "SOUND " + pct(A.sfxVol), adjust: (d, wrap) => { let v = Math.round((A.sfxVol + d * 0.1) * 10) / 10; if (wrap && v > 1) v = 0; A.setSfxVol(U.clamp(v, 0, 1)); A.sfx("gem"); } },
      { label: () => "FULLSCREEN " + (document.fullscreenElement ? "ON" : "OFF"), action: () => XA.Main.toggleFullscreen() },
      { label: "BACK", action: () => States.options.leave() },
    ], W / 2, 260, 620),
    enter(b) { this.t = 0; this.back = b || "title"; this.menu.sel = 0; },
    leave() { if (this.back === "play") setState("play", { resume: true }); else setState(this.back); },
    input() { if (I.hit("back")) { A.sfx("menuBack"); this.leave(); return; } menuInput(this.menu); },
    update(dt) { this.t += dt; },
    draw(ctx) {
      if (this.back === "play") { States.play.drawWorld(ctx); ctx.fillStyle = "rgba(30,10,50,0.75)"; ctx.fillRect(0, 0, W, H); } else back.draw(ctx);
      txt(ctx, "OPTIONS", W / 2, 170, 36, "#ffe060");
      menuDraw(ctx, this.menu, this.t);
      txt(ctx, "◄ ► to change · F fullscreen · M mute", W / 2, H - 50, 24, "#ffffff", "center", BODY);
    },
  };

  States.controls = {
    t: 0,
    enter() { this.t = 0; },
    input() { if (I.hit("back") || I.hit("confirm") || I.mouse.clicked) { A.sfx("menuBack"); setState("title"); } },
    update(dt) { this.t += dt; },
    draw(ctx) {
      back.draw(ctx);
      ctx.fillStyle = "rgba(30,10,50,0.45)"; ctx.fillRect(0, 0, W, H);
      txt(ctx, "CONTROLS", W / 2, 60, 32, "#ffe060");
      const cols = [
        ["KEYBOARD", [["Walk", "← → / A D"], ["Jump (hold = higher)", "↑ / W / Space / Y"], ["Shoot stars", "X / K / C / Shift"], ["Pause", "P / Esc"], ["Fullscreen · Mute", "F · M"]]],
        ["MOUSE", [["Walk", "Point left or right of Lulu"], ["Jump", "Left button (hold = higher)"], ["Shoot stars", "Right button"]]],
        ["GAMEPAD", [["Walk", "Stick / D-pad"], ["Jump", "A / Y / stick up"], ["Shoot stars", "B / X / RB / RT"], ["Pause", "Start"]]],
      ];
      cols.forEach(([head, rows], c) => {
        const x = 60 + c * 400;
        panel(ctx, x, 100, 380, 320);
        txt(ctx, head, x + 190, 130, 16, "#80f0ff");
        rows.forEach(([a, b], i) => { txt(ctx, a, x + 22, 174 + i * 48, 20, "#ffd0f0", "left", BODY, false); txt(ctx, b, x + 22, 198 + i * 48, 22, "#ffffff", "left", BODY, false); });
      });
      panel(ctx, 60, 440, W - 120, 200);
      const tips = [
        "Bump the star blocks from below. Collect 100 gems for an extra life.",
        "Dream orb: wild hair that smashes bricks. Star wand: shoot bouncing stars.",
        "Clock freezes enemies, lightning clears the screen, the bubble makes Lulu invincible.",
        "Jump on enemies – but not on the spiky ones! Pillows are checkpoints.",
        "Every world ends with a boss: stomp on it or shoot it with stars.",
      ];
      tips.forEach((s, i) => txt(ctx, s, W / 2, 472 + i * 34, 22, "#ffffff", "center", BODY, false));
      if (Math.floor(this.t * 2) % 2 === 0) txt(ctx, "PRESS ANY BUTTON", W / 2, H - 36, 16, "#ffe0f4");
    },
  };

  States.highscores = {
    t: 0, mark: -1, attract: false,
    enter(o) { this.t = 0; this.mark = o && o.mark !== undefined ? o.mark : -1; this.attract = !!(o && o.attract); if (!this.attract) { A.tempo = 1; A.playSong("title"); } XA.Main.setCursor(true); },
    input() { if (this.t > 0.4 && (I.hit("back") || I.hit("confirm") || I.mouse.clicked || (this.attract && (I.pressed.size || I.pad.pressed.size)))) { A.sfx("menuBack"); setState("title"); } },
    update(dt) { this.t += dt; if (this.attract && this.t > 12) setState("title"); },
    draw(ctx) {
      back.draw(ctx, 3);
      txt(ctx, "SWEETEST DREAMERS", W / 2, 64, 30, "#ffe060");
      panel(ctx, W / 2 - 400, 104, 800, 550, 0.8);
      txt(ctx, "RANK", W / 2 - 340, 136, 14, "#80f0ff", "left"); txt(ctx, "NAME", W / 2 - 220, 136, 14, "#80f0ff", "left");
      txt(ctx, "WORLD", W / 2 + 110, 136, 14, "#80f0ff"); txt(ctx, "SCORE", W / 2 + 360, 136, 14, "#80f0ff", "right");
      HS.list().forEach((e, i) => {
        const y = 184 + i * 46, hl = i === this.mark;
        if (hl) { ctx.fillStyle = `rgba(255,120,200,${0.35 + 0.15 * Math.sin(this.t * 6)})`; ctx.fillRect(W / 2 - 380, y - 20, 760, 40); }
        const col = hl ? "#fff7b0" : i < 3 ? "#ffd27a" : "#ffffff";
        txt(ctx, `${i + 1}.`, W / 2 - 340, y, 16, col, "left"); txt(ctx, e.name, W / 2 - 220, y, 16, col, "left");
        txt(ctx, String(e.stage), W / 2 + 110, y, 16, col); txt(ctx, U.fmt(e.score), W / 2 + 360, y, 16, col, "right");
      });
      txt(ctx, "Scores are saved in this browser.", W / 2, H - 30, 22, "#ffffff", "center", BODY);
    },
  };

  /* ---------- World intro card ---------- */
  States.intro = {
    t: 0,
    enter(o) { this.t = 0; this.check = o && o.check; A.stopMusic(); A.jingle("start"); XA.Main.setCursor(true); },
    input() { if (this.t > 0.6 && (I.hit("confirm") || I.hit("jump") || I.mouse.clicked)) this.go(); },
    go() { G.startLevel(G.run.world, G.run.level, this.check); setState("play", {}); },
    update(dt) { this.t += dt; if (this.t > 2.6) this.go(); },
    draw(ctx) {
      const w = G.run.world, wd = Gfx.WORLDS[w];
      back.draw(ctx, w);
      ctx.fillStyle = "rgba(30,10,50,0.55)"; ctx.fillRect(0, 0, W, H);
      txt(ctx, `WORLD ${w + 1}-${G.run.level + 1}`, W / 2, 230, 44, "#ffe060");
      txt(ctx, wd.name.toUpperCase(), W / 2, 300, 22, "#ffffff");
      if (G.run.level === 2) txt(ctx, "A BOSS IS WAITING AT THE END!", W / 2, 350, 14, "#ff8ac8");
      const hx = W / 2 - 50, hy = 440;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(Gfx.hero[G.run.power > 0 ? 1 : 0].idle, hx, hy, 88, 104);
      ctx.imageSmoothingEnabled = true;
      txt(ctx, `× ${G.run.lives}`, W / 2 + 70, hy + 60, 24, "#ffffff", "left");
    },
  };

  /* ---------- Play ---------- */
  States.play = {
    paused: false,
    pauseMenu: makeMenu([
      { label: "RESUME", action: () => { States.play.paused = false; } },
      { label: "OPTIONS", action: () => setState("options", "play") },
      { label: "QUIT TO TITLE", action: () => { States.play.paused = false; setState("title"); } },
    ], W / 2, 320, 520),
    enter(o) {
      if (o && o.resume) { this.paused = true; return; }
      this.paused = false; this.done = false;
      G.onDeath = () => this.death();
    },
    pause() { if (!this.paused && !G.p.dead && G.phase === "play") { this.paused = true; this.pauseMenu.sel = 0; A.sfx("menuBack"); } },
    death() {
      if (this.done) return;
      this.done = true;
      const r = G.run;
      r.power = 0;
      if (r.lives > 1) { r.lives--; setState("intro", { check: G.checkX !== null ? G.checkX : undefined }); }
      else { r.lives = 0; setState("gameover"); }
    },
    input() {
      if (this.paused) { if (I.hit("pause") || I.hit("back")) { this.paused = false; return; } menuInput(this.pauseMenu); return; }
      if (I.hit("pause")) this.pause();
    },
    update(dt) {
      XA.Main.setCursor(this.paused);
      if (this.paused) return;
      G.update(dt);
      if (G.phase === "clear") {
        // count the remaining time into points
        if (G.phaseT > 1 && G.time > 0) { const d = Math.min(G.time, dt * 60); G.time -= d; G.addScore(Math.round(d * 50)); A.sfx("tick"); }
        if (G.phaseT > 1 && G.time <= 0 && !this.done) {
          this.clearT = (this.clearT || 0) + dt;
          if (this.clearT > 1.5) {
            this.done = true; this.clearT = 0;
            const r = G.run;
            G.addScore(1000);
            if (r.level < 2) r.level++;
            else if (r.world < 3) { r.world++; r.level = 0; }
            else { setState("ending"); return; }
            setState("intro");
          }
        }
      }
    },
    drawWorld(ctx) { G.render(bg); blit(ctx); hud(ctx); },
    draw(ctx) {
      this.drawWorld(ctx);
      if (G.phase === "clear") txt(ctx, "SWEET DREAMS!", W / 2, 200, 40, "#ffe060");
      if (this.paused) {
        ctx.fillStyle = "rgba(30,10,50,0.72)"; ctx.fillRect(0, 0, W, H);
        txt(ctx, "PAUSE", W / 2, 230, 44, "#ffe060");
        menuDraw(ctx, this.pauseMenu, performance.now() / 1000);
      }
    },
  };

  function hud(ctx) {
    const r = G.run;
    ctx.fillStyle = "rgba(40,10,60,0.45)"; ctx.fillRect(0, 0, W, 56);
    txt(ctx, "SCORE", 24, 18, 12, "#ffd0f0", "left");
    txt(ctx, String(r.score).padStart(7, "0"), 24, 40, 18, "#ffffff", "left");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(Gfx.spr.gem[0], 300, 14, 30, 30);
    txt(ctx, `× ${String(r.gems).padStart(2, "0")}`, 340, 31, 18, "#ffffff", "left");
    ctx.drawImage(Gfx.hero[0].idle, 470, 4, 40, 48);
    txt(ctx, `× ${r.lives}`, 516, 31, 18, "#ffffff", "left");
    if (r.power >= 1) ctx.drawImage(Gfx.spr[r.power >= 2 ? "wand" : "orb"], 620, 12, 32, 32);
    ctx.imageSmoothingEnabled = true;
    txt(ctx, `WORLD ${r.world + 1}-${r.level + 1}`, 860, 31, 16, "#ffffff");
    txt(ctx, "TIME", W - 24, 18, 12, "#ffd0f0", "right");
    txt(ctx, String(Math.ceil(G.time)), W - 24, 40, 18, G.time < 30 && Math.floor(G.t * 4) % 2 ? "#ff6a6a" : "#ffffff", "right");
    if (G.freeze > 0) txt(ctx, "❄ " + Math.ceil(G.freeze), W / 2 + 200, 80, 14, "#a0e0ff");
    if (G.shield > 0) txt(ctx, "◯ " + Math.ceil(G.shield), W / 2 + 280, 80, 14, "#ffb0f0");
    if (G.boss && !G.boss.dead) {
      const b = G.boss;
      txt(ctx, b.name, W / 2, 84, 14, "#ffb0d0");
      ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(W / 2 - 200, 100, 400, 14);
      ctx.fillStyle = "#ff4a8a"; ctx.fillRect(W / 2 - 198, 102, 396 * Math.max(0, b.hp / b.maxHp), 10);
    }
  }

  /* ---------- Game over and ending ---------- */
  function afterGame() {
    const r = G.run, rank = r.cheated ? -1 : HS.rank(r.score);
    if (rank >= 0) setState("nameentry"); else setState("highscores");
  }
  States.gameover = {
    t: 0,
    enter() { this.t = 0; A.tempo = 1; A.jingle("gameover"); XA.Main.setCursor(true); },
    input() { if (this.t > 1.5 && (I.hit("confirm") || I.mouse.clicked || I.hit("back"))) afterGame(); },
    update(dt) { this.t += dt; if (this.t > 7) afterGame(); },
    draw(ctx) {
      const g = bg, t = this.t;
      g.fillStyle = "#14103a"; g.fillRect(0, 0, LW, LH);
      for (let i = 0; i < 40; i++) { g.fillStyle = "#ffffff"; g.fillRect((i * 73) % LW, (i * 37) % 120, 1, 1); }
      // Lulu fell out of bed
      g.fillStyle = "#8a5a2a"; g.fillRect(170, 120, 90, 30); g.fillStyle = "#ffffff"; g.fillRect(172, 112, 86, 12); g.fillStyle = "#ff8ac0"; g.fillRect(200, 114, 58, 10);
      g.save(); g.translate(130, 150); g.rotate(Math.PI / 2); g.drawImage(Gfx.hero[0].sleep[Math.floor(t * 1.5) % 2], -11, -24); g.restore();
      g.fillStyle = "#ffffff"; g.font = "8px monospace"; g.fillText("z", 110 + Math.sin(t * 2) * 3, 120 - (t * 10) % 20);
      blit(ctx);
      txt(ctx, "GAME OVER", W / 2, 160, 56, "#ff6ab0");
      txt(ctx, "Lulu fell out of bed...", W / 2, 230, 26, "#ffffff", "center", BODY);
      txt(ctx, `SCORE ${U.fmt(G.run.score)}`, W / 2, H - 80, 22, "#ffe060");
    },
  };

  States.ending = {
    t: 0,
    enter() { this.t = 0; A.tempo = 1; A.jingle("victory"); setTimeout(() => { if (XA.Main.state === "ending") A.playSong("title"); }, 4500); XA.Main.setCursor(true); G.addScore(G.run.lives * 5000); },
    input() { if (this.t > 5 && (I.hit("confirm") || I.mouse.clicked)) afterGame(); },
    update(dt) { this.t += dt; },
    draw(ctx) {
      const g = bg, t = this.t, dawn = Math.min(1, t / 6);
      const gr = g.createLinearGradient(0, 0, 0, LH);
      gr.addColorStop(0, `rgb(${20 + dawn * 120},${16 + dawn * 160},${58 + dawn * 170})`); gr.addColorStop(1, `rgb(${74 + dawn * 180},${42 + dawn * 160},${122 + dawn * 60})`);
      g.fillStyle = gr; g.fillRect(0, 0, LW, LH);
      g.fillStyle = "#ffe080"; g.beginPath(); g.arc(250, 140 - dawn * 70, 16, 0, TAU); g.fill();
      // bedroom window frame
      g.fillStyle = "#8a5a3a"; g.fillRect(0, 0, LW, 10); g.fillRect(0, 0, 10, LH); g.fillRect(LW - 10, 0, 10, LH); g.fillRect(155, 0, 10, 130); g.fillRect(0, 125, LW, 10);
      g.fillStyle = "#5a3a2a"; g.fillRect(0, 135, LW, 45);
      g.fillStyle = "#ffffff"; g.fillRect(60, 140, 120, 20); g.fillStyle = "#ff8ac0"; g.fillRect(90, 142, 90, 16);
      const H = Gfx.hero[0];
      g.drawImage(t < 4 ? H.sleep[Math.floor(t * 1.5) % 2] : t < 5 ? H.blink : H.win[Math.floor(t * 3) % 2], 64, 120);
      blit(ctx);
      txt(ctx, "GOOD MORNING, LULU!", W / 2, 90, 34, "#ffe060");
      if (t > 2) txt(ctx, "The Nightmare is gone and every dream is sweet again.", W / 2, 150, 26, "#ffffff", "center", BODY);
      if (t > 3) txt(ctx, `FINAL SCORE ${U.fmt(G.run.score)}`, W / 2, H - 110, 22, "#ffffff");
      if (t > 5 && Math.floor(t * 2) % 2) txt(ctx, "PRESS JUMP", W / 2, H - 50, 16, "#ffe0f4");
    },
  };

  /* ---------- Name entry ---------- */
  const KEYS = ["ABCDEFGHIJ", "KLMNOPQRST", "UVWXYZ0123", "456789.-! "];
  States.nameentry = {
    t: 0, name: "", sel: 0, rank: 0,
    enter() { this.t = 0; this.name = Store.get("lastName", ""); this.sel = 0; this.rank = HS.rank(G.run.score); A.tempo = 1; A.playSong("title"); XA.Main.setCursor(true); },
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
    save() {
      const name = this.name.trim() || "DREAMER", r = G.run;
      Store.set("lastName", name);
      const pos = HS.add(name, r.score, `${r.world + 1}-${r.level + 1}`);
      A.sfx("menuOk"); setState("highscores", { mark: pos });
    },
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
      back.draw(ctx, 2);
      ctx.fillStyle = "rgba(30,10,50,0.72)"; ctx.fillRect(0, 0, W, H);
      txt(ctx, "NEW HIGHSCORE", W / 2, 70, 36, "#ffe060");
      txt(ctx, `Rank ${this.rank + 1} with ${U.fmt(G.run.score)} points`, W / 2, 130, 28, "#ffffff", "center", BODY);
      txt(ctx, "Enter your name to join the list – or skip it.", W / 2, 166, 24, "#ffd0f0", "center", BODY);
      panel(ctx, W / 2 - 260, 200, 520, 80, 0.85);
      txt(ctx, this.name + (this.name.length < 10 && Math.floor(this.t * 2.5) % 2 ? "_" : " "), W / 2, 242, 30, "#ffffff");
      this.cells().forEach((c, i) => {
        const sel = i === this.sel;
        ctx.fillStyle = sel ? "rgba(255,120,200,0.8)" : c.ch.length > 1 ? "rgba(80,180,255,0.4)" : "rgba(60,30,100,0.85)";
        ctx.beginPath(); ctx.roundRect(c.x, c.y, c.w, c.h, 8); ctx.fill();
        ctx.strokeStyle = sel ? "#ffe0f4" : "rgba(255,200,240,0.4)"; ctx.lineWidth = 2; ctx.stroke();
        txt(ctx, c.ch === " " ? "␣" : c.ch, c.x + c.w / 2, c.y + c.h / 2 + 2, c.ch.length > 1 ? 14 : 18, "#ffffff", "center", FONT, false);
      });
      txt(ctx, "Type with the keyboard · Enter saves · Esc skips · Gamepad: A types, B deletes, Start saves", W / 2, H - 30, 20, "#ffd0f0", "center", BODY);
    },
  };
})(window.XA);
