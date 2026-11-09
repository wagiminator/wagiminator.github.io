/* Shared screens: boot, title menu, options, controls, highscores and name entry.
   Each game describes its look and content in XA.Theme (see game.js). */
"use strict";

(function (XA) {
  const { U, Store } = XA;
  const A = XA.Audio, I = XA.Input;
  const W = U.W, H = U.H;
  const States = (XA.States = {});
  const G = (XA.G = XA.G || { cheat: false, run: null });
  let setState = null;
  const T = () => XA.Theme;

  /* ---------- drawing helpers ---------- */
  function txt(ctx, s, x, y, size, color = "#fff", align = "center", font, outline = true) {
    const th = T();
    ctx.font = `${size}px ${font || th.font}`; ctx.textAlign = align; ctx.textBaseline = "middle";
    if (outline) { ctx.lineJoin = "round"; ctx.lineWidth = Math.max(3, size / 6); ctx.strokeStyle = th.outline || "#14101c"; ctx.strokeText(s, x, y); }
    ctx.fillStyle = color; ctx.fillText(s, x, y);
  }
  function bodyText(ctx, s, x, y, size, color = "#fff", align = "center") {
    const th = T();
    ctx.font = `700 ${size}px ${th.body}`; ctx.textAlign = align; ctx.textBaseline = "middle";
    ctx.lineJoin = "round"; ctx.lineWidth = Math.max(3, size / 6); ctx.strokeStyle = th.outline || "#14101c"; ctx.strokeText(s, x, y);
    ctx.fillStyle = color; ctx.fillText(s, x, y);
  }
  function panel(ctx, x, y, w, h, alpha = 0.8) {
    const th = T();
    ctx.fillStyle = th.panel || `rgba(20,30,60,${alpha})`; ctx.beginPath(); ctx.roundRect(x, y, w, h, th.round ?? 16); ctx.fill();
    ctx.strokeStyle = th.panelStroke || "rgba(255,255,255,0.6)"; ctx.lineWidth = 3; ctx.stroke();
  }
  function wrap(ctx, s, x, y, maxW, lh, size, col, align = "left") {
    ctx.font = `600 ${size}px ${T().body}`; ctx.textAlign = align; ctx.textBaseline = "middle"; ctx.fillStyle = col;
    let line = "", yy = y;
    for (const w of s.split(" ")) { const t = line ? line + " " + w : w; if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, yy); line = w; yy += lh; } else line = t; }
    if (line) ctx.fillText(line, x, yy);
    return yy + lh;
  }
  const inRect = (m, x, y, w, h) => m.x >= x && m.x <= x + w && m.y >= y && m.y <= y + h;

  /* ---------- menus ---------- */
  function makeMenu(items, y, w = 460, h = 52, gap = 10, cx = W / 2) { return { items, sel: 0, y, w, h, gap, cx }; }
  const visible = (m) => m.items.filter((i) => !i.hidden || !i.hidden());
  function menuInput(m) {
    const items = visible(m), n = items.length;
    if (m.sel >= n) m.sel = 0;
    if (I.hit("up")) { m.sel = (m.sel + n - 1) % n; A.sfx("menuMove"); }
    if (I.hit("down")) { m.sel = (m.sel + 1) % n; A.sfx("menuMove"); }
    let hi = -1;
    items.forEach((it, i) => { if (inRect(I.mouse, m.cx - m.w / 2, m.y + i * (m.h + m.gap), m.w, m.h)) hi = i; });
    if (I.mouse.moved && hi >= 0 && hi !== m.sel) { m.sel = hi; A.sfx("menuMove"); }
    const it = items[m.sel];
    if (it.adjust) { if (I.hit("left")) it.adjust(-1); if (I.hit("right")) it.adjust(1); if (I.mouse.wheel && hi === m.sel) it.adjust(-Math.sign(I.mouse.wheel)); }
    if (I.hit("confirm") || (I.mouse.clicked && hi === m.sel && hi >= 0)) { if (it.action) { A.sfx("menuOk"); it.action(); } else if (it.adjust) it.adjust(1); }
  }
  function menuDraw(ctx, m, t) {
    const th = T();
    visible(m).forEach((it, i) => {
      const y = m.y + i * (m.h + m.gap), sel = i === m.sel;
      if (sel) { ctx.fillStyle = th.sel(t); ctx.beginPath(); ctx.roundRect(m.cx - m.w / 2, y, m.w, m.h, th.round ?? 14); ctx.fill(); }
      const label = typeof it.label === "function" ? it.label() : it.label;
      txt(ctx, label, m.cx, y + m.h / 2 + 2, sel ? th.menuSize + 3 : th.menuSize, sel ? th.menuSel : th.menuText);
    });
  }

  /* ---------- highscores ---------- */
  const HS = (XA.HS = {
    defaults() { return T().hsDefault.map(([name, score, stage]) => ({ name, score, stage, date: "" })); },
    list() { const l = Store.get("scores", null); return Array.isArray(l) && l.length ? l : HS.defaults(); },
    rank(score) { if (score <= 0) return -1; const l = HS.list(); let i = 0; while (i < l.length && l[i].score >= score) i++; return i < 10 ? i : -1; },
    add(name, score, stage) { const l = HS.list(), e = { name, score, stage, date: new Date().toISOString().slice(0, 10) }; l.push(e); l.sort((a, b) => b.score - a.score); const out = l.slice(0, 10); Store.set("scores", out); return out.indexOf(e); },
  });

  XA.UI = {
    bind(fn) { setState = fn; },
    txt, bodyText, panel, wrap, inRect, makeMenu, menuInput, menuDraw,
    // end of a run: optional highscore entry
    finishRun() {
      const r = G.run;
      if (r && !r.cheated && !G.cheat && HS.rank(r.score) >= 0) setState("nameentry"); else setState("highscores");
    },
    go: (n, a) => setState(n, a),
  };

  /* ---------- boot ---------- */
  States.boot = {
    t: 0,
    enter() { this.t = 0; },
    input() { if (this.t > 0.2 && (I.pressed.size || I.mouse.clicked || I.pad.pressed.size)) { A.init(); setState("title"); } },
    update(dt) { this.t += dt; },
    draw(ctx) {
      T().back(ctx, this.t, "boot");
      T().logo(ctx, this.t, 250);
      if (Math.floor(this.t * 2) % 2 === 0) txt(ctx, T().pressText || "PRESS ANY KEY · CLICK · OR PRESS A BUTTON", W / 2, 520, 30, T().accent);
      bodyText(ctx, "F = fullscreen   ·   M = mute", W / 2, 680, 22, T().soft);
    },
  };

  /* ---------- title ---------- */
  States.title = {
    t: 0, idle: 0,
    menu: makeMenu([
      { label: "START GAME", action: () => T().start() },
      { label: "CONTROLS", action: () => setState("controls") },
      { label: "OPTIONS", action: () => setState("options") },
      { label: "HIGHSCORES", action: () => setState("highscores") },
    ], 400),
    enter() { this.t = 0; A.playSong(T().songs.title); XA.Main.setCursor(true); },
    input() { menuInput(this.menu); },
    update(dt) { this.t += dt; },
    draw(ctx) {
      T().back(ctx, this.t, "title");
      T().logo(ctx, this.t, 190);
      menuDraw(ctx, this.menu, this.t);
      bodyText(ctx, T().menuHint || "Arrows / W S + Enter · mouse · gamepad", W / 2, 690, 20, T().soft);
      if (G.cheat) { ctx.fillStyle = "#ffd040"; ctx.beginPath(); ctx.arc(W - 20, 20, 5, 0, U.TAU); ctx.fill(); }
    },
  };

  /* ---------- options ---------- */
  States.options = {
    t: 0, back: "title",
    menu: makeMenu([
      { label: () => `MUSIC  ◂ ${Math.round(A.musicVol * 10)} ▸`, adjust: (d) => { A.setMusicVol(U.clamp(Math.round(A.musicVol * 10 + d) / 10, 0, 1)); A.sfx("menuMove"); } },
      { label: () => `SOUND  ◂ ${Math.round(A.sfxVol * 10)} ▸`, adjust: (d) => { A.setSfxVol(U.clamp(Math.round(A.sfxVol * 10 + d) / 10, 0, 1)); A.sfx("menuOk"); } },
      { label: () => `VOICE  ◂ ${A.voiceOn ? "ON" : "OFF"} ▸`, adjust: () => { A.voiceOn = !A.voiceOn; Store.set("voice", A.voiceOn); if (A.voiceOn) A.say(T().voiceTest || "Hello!", { force: true }); } },
      { label: "TOGGLE FULLSCREEN", action: () => XA.Main.toggleFullscreen() },
      { label: "BACK", action: () => States.options.leave() },
    ], 230),
    enter(arg) { this.t = 0; this.back = (arg && arg.back) || "title"; this.menu.sel = 0; },
    leave() { if (this.back === "play") setState("play", { resume: true }); else setState(this.back); },
    input() { if (I.hit("back")) { A.sfx("menuBack"); this.leave(); return; } menuInput(this.menu); },
    update(dt) { this.t += dt; },
    draw(ctx) {
      T().back(ctx, this.t, "menu");
      txt(ctx, "OPTIONS", W / 2, 130, 64, T().accent);
      menuDraw(ctx, this.menu, this.t);
      bodyText(ctx, "Left / right changes a value · Esc goes back", W / 2, 680, 22, T().soft);
    },
  };

  /* ---------- controls ---------- */
  States.controls = {
    t: 0, back: "title",
    enter(arg) { this.t = 0; this.back = (arg && arg.back) || "title"; },
    input() { if (this.t > 0.2 && (I.hit("back") || I.hit("confirm") || I.mouse.clicked)) { A.sfx("menuBack"); if (this.back === "play") setState("play", { resume: true }); else setState(this.back); } },
    update(dt) { this.t += dt; },
    draw(ctx) {
      const th = T();
      th.back(ctx, this.t, "menu");
      txt(ctx, "HOW TO PLAY", W / 2, 60, 52, th.accent);
      const cols = th.controls, cw = (W - 80) / cols.length;
      cols.forEach(([title, rows], k) => {
        const x = 40 + k * cw;
        panel(ctx, x + 8, 110, cw - 16, 440);
        txt(ctx, title, x + cw / 2, 145, 30, th.accent);
        rows.forEach(([a, b], i) => { bodyText(ctx, a, x + 28, 190 + i * 32, 20, th.keyCol || "#ffe070", "left"); bodyText(ctx, b, x + cw - 28, 190 + i * 32, 20, "#ffffff", "right"); });
      });
      panel(ctx, 48, 566, W - 96, 96);
      wrap(ctx, th.howto, 72, 594, W - 144, 26, 20, "#ffffff");
      bodyText(ctx, "Press any button", W / 2, 694, 20, th.soft);
    },
  };

  /* ---------- highscores ---------- */
  States.highscores = {
    t: 0, mark: -1,
    enter(arg) { this.t = 0; this.mark = arg && arg.mark !== undefined ? arg.mark : -1; A.playSong(T().songs.title); XA.Main.setCursor(true); },
    input() { if (this.t > 0.4 && (I.hit("confirm") || I.hit("back") || I.mouse.clicked)) { A.sfx("menuBack"); setState("title"); } },
    update(dt) { this.t += dt; },
    draw(ctx) {
      const th = T();
      th.back(ctx, this.t, "menu");
      txt(ctx, th.hsTitle || "HIGHSCORES", W / 2, 66, 60, th.accent);
      panel(ctx, W / 2 - 420, 116, 840, 524);
      bodyText(ctx, "RANK", W / 2 - 340, 146, 20, th.soft); bodyText(ctx, "NAME", W / 2 - 250, 146, 20, th.soft, "left"); bodyText(ctx, th.stageWord || "STAGE", W / 2 + 120, 146, 20, th.soft); bodyText(ctx, "SCORE", W / 2 + 360, 146, 20, th.soft, "right");
      HS.list().forEach((e, i) => {
        const y = 190 + i * 44, mk = i === this.mark && Math.floor(this.t * 4) % 2 === 0, col = mk ? "#ffe040" : i === 0 ? th.accent : "#ffffff";
        txt(ctx, `${i + 1}.`, W / 2 - 340, y, 28, col);
        txt(ctx, e.name, W / 2 - 250, y, 28, col, "left");
        bodyText(ctx, e.stage || "-", W / 2 + 120, y, 22, col);
        txt(ctx, U.fmt(e.score), W / 2 + 360, y, 28, col, "right");
      });
      bodyText(ctx, "Press any button", W / 2, 680, 22, th.soft);
    },
  };

  /* ---------- name entry ---------- */
  const KEYS = ["ABCDEFGHIJ", "KLMNOPQRST", "UVWXYZ0123", "456789.-! "];
  States.nameentry = {
    t: 0, name: "", sel: 0, rank: 0,
    enter() { this.t = 0; this.name = Store.get("lastName", ""); this.sel = 0; this.rank = HS.rank(G.run.score); A.playSong(T().songs.title); XA.Main.setCursor(true); A.say(T().sayHighscore || "New high score!", { force: true }); },
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
      const name = this.name.trim() || "PLAYER", r = G.run;
      Store.set("lastName", name);
      const pos = HS.add(name, r.score, T().stageLabel());
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
      const th = T();
      th.back(ctx, this.t, "menu");
      txt(ctx, "NEW HIGHSCORE", W / 2, 70, 56, th.accent);
      bodyText(ctx, `Rank ${this.rank + 1} with ${U.fmt(G.run.score)} points`, W / 2, 130, 30, "#ffffff");
      bodyText(ctx, "Enter your name to join the list – or skip it.", W / 2, 166, 24, th.soft);
      panel(ctx, W / 2 - 260, 200, 520, 80);
      txt(ctx, this.name + (this.name.length < 10 && Math.floor(this.t * 2.5) % 2 ? "_" : " "), W / 2, 242, 40, "#ffffff");
      this.cells().forEach((c, i) => {
        const sel = i === this.sel;
        ctx.fillStyle = sel ? th.sel(this.t) : c.ch.length > 1 ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.45)";
        ctx.beginPath(); ctx.roundRect(c.x, c.y, c.w, c.h, 10); ctx.fill();
        ctx.strokeStyle = sel ? "#ffffff" : "rgba(255,255,255,0.4)"; ctx.lineWidth = 2; ctx.stroke();
        txt(ctx, c.ch === " " ? "␣" : c.ch, c.x + c.w / 2, c.y + c.h / 2 + 2, c.ch.length > 1 ? 22 : 28, "#ffffff");
      });
      bodyText(ctx, "Type with the keyboard · Enter saves · Esc skips · Gamepad: A types, B deletes, Start saves", W / 2, H - 30, 20, th.soft);
    },
  };
})(window.XA);
