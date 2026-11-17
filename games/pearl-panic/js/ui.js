/* Pearl Panic: screens – title, level map, results, options, help */
"use strict";

(function (PP) {
  const { U, D, S, Store } = PP;
  const A = PP.Audio, I = PP.Input;
  const W = U.W, H = U.H, C = D.C;
  const States = (PP.States = {});
  let setState = null;
  const UI = (PP.UI = { bind(fn) { setState = fn; } });
  const inR = (m, b) => m.x >= b.x && m.x <= b.x + b.w && m.y >= b.y && m.y <= b.y + b.h;

  /* ---------- buttons with mouse, keyboard and gamepad ---------- */
  function navigate(btns) {
    const m = I.mouse;
    const act = btns.filter((b) => !b.disabled || b.focusable);
    if (!act.length) return;
    const dirs = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    for (const d in dirs) {
      if (!I.hit(d)) continue;
      const [dx, dy] = dirs[d];
      const cur = act.find((b) => inR(m, b));
      if (!cur) { const b = act[0]; m.x = b.x + b.w / 2; m.y = b.y + b.h / 2; A.sfx("menuMove"); return; }
      const cx = cur.x + cur.w / 2, cy = cur.y + cur.h / 2;
      let best = null, bs = Infinity;
      for (const b of act) {
        if (b === cur) continue;
        const bx = b.x + b.w / 2, by = b.y + b.h / 2;
        const along = (bx - cx) * dx + (by - cy) * dy;
        if (along <= 4) continue;
        const s = along + (Math.abs((bx - cx) * dy) + Math.abs((by - cy) * dx)) * 2.2;
        if (s < bs) { bs = s; best = b; }
      }
      if (best) { m.x = best.x + best.w / 2; m.y = best.y + best.h / 2; A.sfx("menuMove"); }
    }
  }
  UI.runButtons = function (btns) {
    navigate(btns);
    const m = I.mouse;
    if (!m.clicked) return null;
    for (const b of btns) if (inR(m, b)) {
      if (b.disabled) { A.sfx("deny"); return null; }
      A.sfx(b.back ? "menuBack" : "menuOk");
      if (b.act) b.act();
      return b;
    }
    return null;
  };
  UI.drawButtons = function (c, btns) { for (const b of btns) if (!b.custom) D.button(c, b, inR(I.mouse, b), { disabled: b.disabled, on: b.on, color: b.color, size: b.size }); };
  function focus(btns, b) {
    if (I.lastDevice === "mouse" || !btns.length) return;
    b = b || btns.find((x) => !x.disabled) || btns[0];
    I.mouse.x = b.x + b.w / 2; I.mouse.y = b.y + b.h / 2;
  }
  function pointer(c) { if (I.showCursor()) D.hand(c, I.mouse.x, I.mouse.y); }
  function heading(c, s, y = 62, size = 60) { D.text(c, s, W / 2, y, size, C.gold, "center", { head: true, lw: 12 }); }

  /* ---------- a chain of pearls rolling behind the menus ---------- */
  const deco = { t: 0, pts: null };
  function decoTrack() {
    if (deco.pts) return deco.pts;
    const pts = [];
    for (let x = -80; x <= W + 80; x += 4) pts.push([x, 610 + Math.sin(x * 0.008) * 34 + Math.sin(x * 0.019) * 12]);
    return (deco.pts = pts);
  }
  function backdrop(c, dt, dark = 0.25, world = 0) {
    deco.t += dt;
    const t = deco.t;
    S.world(c, PP.WORLDS[world], t);
    // groove and chain
    const pts = decoTrack();
    c.lineJoin = "round"; c.lineCap = "round";
    for (const [lw, st] of [[54, "#0b2a3a"], [48, "#a85a3a"], [40, "#d98a64"], [32, "#7a3e26"]]) {
      c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.lineWidth = lw; c.strokeStyle = st; c.stroke();
    }
    const off = (t * 50) % 34;
    const seq = [0, 0, 1, 1, 1, 2, 3, 3, 4, 2, 2, 5, 0, 1, 1, 3, 4, 4, 5, 5];
    for (let k = -1; k < 44; k++) {
      const xf = -60 + k * 34 + off, i = U.clamp(Math.round((xf + 80) / 4), 0, pts.length - 1);
      const n = Math.floor((t * 50) / 34) - k;
      S.pearl(c, pts[i][0], pts[i][1], seq[((n % seq.length) + seq.length) % seq.length], (xf / 17) * 0.5);
    }
    if (dark) { c.fillStyle = `rgba(2,24,40,${dark})`; c.fillRect(0, 0, W, H); }
  }
  UI.backdrop = backdrop;
  function logo(c, y) {
    const t = deco.t;
    c.save(); c.translate(W / 2, y); c.rotate(Math.sin(t * 1.1) * 0.015);
    const word = (s, yy, colr) => D.text(c, s, 0, yy, 128, colr, "center", { head: true, lw: 20 });
    word("PEARL", -50, "#fff6fa");
    word("PANIC", 70, "#ffd65a");
    // pearls on the letters
    const dots = [[-210, -100, 0], [-60, -110, 4], [140, -104, 2], [-180, 120, 3], [190, 124, 5]];
    dots.forEach(([x, yy, ci], i) => S.pearl(c, x, yy + Math.sin(t * 2 + i) * 4, ci, t + i, { scale: 0.9 }));
    c.restore();
    // Puff swims beside the title
    S.puffer(c, W / 2 + 320 + Math.sin(t * 0.8) * 10, y + 20 + Math.sin(t * 1.6) * 8, Math.PI + 0.3 + Math.sin(t) * 0.1, { t, cur: Math.floor(t / 2) % 6, next: (Math.floor(t / 2) + 2) % 6 });
  }

  /* ================= BOOT ================= */
  States.boot = {
    t: 0,
    enter() { this.t = 0; },
    input() { if (I.mouse.clicked || I.pressed.size || I.pad.pressed.size) { A.init(); setState("title"); } },
    update(dt) { this.t += dt; },
    draw(c) {
      backdrop(c, 1 / 60, 0.15);
      logo(c, 220);
      D.text(c, "Shoot pearls, match three, save the reef", W / 2, 410, 30, C.paper, "center", { head: true, lw: 6 });
      if (Math.sin(this.t * 4) > -0.3) D.text(c, I.touch ? "Tap to start" : "Click or press any key", W / 2, 490, 36, C.gold, "center", { head: true, lw: 7 });
    },
  };

  /* ================= TITLE ================= */
  States.title = {
    btns: [],
    enter() {
      A.playSong("title");
      const x = W / 2 - 170;
      this.btns = [
        { x, y: 380, w: 340, h: 70, label: "Play", size: 40, act: () => setState("map") },
        { x, y: 462, w: 340, h: 58, label: "Options", color: C.blue, act: () => setState("options", { back: "title" }) },
        { x, y: 530, w: 340, h: 58, label: "How to play", color: C.blue, act: () => setState("help", { back: "title" }) },
      ];
      focus(this.btns);
    },
    input() { UI.runButtons(this.btns); },
    update() {},
    draw(c) {
      backdrop(c, 1 / 60, 0.15);
      logo(c, 170);
      UI.drawButtons(c, this.btns);
      D.text(c, "F fullscreen   M mute", W - 20, 24, 18, C.paper, "right", { lw: 4 });
      pointer(c);
    },
  };

  /* ================= LEVEL MAP ================= */
  const firstOf = (wi) => PP.LEVELS.findIndex((l) => l.world === wi);
  States.map = {
    btns: [], sel: 0,
    enter(arg) {
      A.playSong("map");
      this.unlocked = Store.get("unlocked", 0);
      this.best = Store.get("best", {}); this.stars = Store.get("stars", {});
      this.sel = arg && arg.idx !== undefined ? arg.idx : Math.min(this.unlocked, PP.LEVELS.length - 1);
      const B = [];
      PP.WORLDS.forEach((w, wi) => {
        const f = firstOf(wi);
        for (let i = 0; i < 5; i++) {
          const idx = f + i;
          B.push({ x: 430 + i * 156 - 40, y: 160 + wi * 118 - 40 + 6, w: 80, h: 80, custom: true, idx, disabled: idx > this.unlocked, act: () => setState("play", { idx }) });
        }
      });
      B.push({ x: 24, y: H - 80, w: 180, h: 60, label: "Back", back: true, color: C.red, act: () => setState("title") });
      this.btns = B;
      focus(B, B.find((b) => b.idx === this.sel));
    },
    input() {
      if (I.hit("back")) { A.sfx("menuBack"); setState("title"); return; }
      UI.runButtons(this.btns);
    },
    update() {},
    draw(c) {
      const hov = this.btns.find((b) => b.custom && inR(I.mouse, b));
      const wi = hov ? PP.LEVELS[hov.idx].world : PP.LEVELS[this.sel].world;
      backdrop(c, 1 / 60, 0.5, wi);
      heading(c, "Choose a level", 52, 54);
      const t = deco.t;
      PP.WORLDS.forEach((w, k) => {
        const y = 160 + k * 118;
        D.rr(c, 50, y - 50, 1180, 106, 22, k === wi ? "rgba(10,70,100,0.85)" : "rgba(6,40,60,0.75)", k === wi ? "#ffe9a8" : "#7ac8e0", 3);
        D.text(c, w.name, 80, y + 4, 34, C.paper, "left", { head: true, lw: 7 });
        const f = firstOf(k);
        const total = [0, 1, 2, 3, 4].reduce((a, i) => a + (this.stars[f + i] || 0), 0);
        D.text(c, `★ ${total}/15`, 80, y + 38, 20, C.gold, "left", { head: true, lw: 5 });
      });
      for (const b of this.btns) {
        if (!b.custom) continue;
        const x = b.x + 40, y = b.y + 40, lv = PP.LEVELS[b.idx], locked = b.disabled, on = hov === b;
        if (locked) {
          D.circle(c, x, y, 30, "#4a6070", "#0b2a3a", 4);
          c.save(); c.translate(x, y + 2);
          D.rr(c, -10, -4, 20, 16, 4, "#9ab0c0", "#0b2a3a", 2.5);
          c.beginPath(); c.arc(0, -5, 7, Math.PI, 0); c.lineWidth = 4; c.strokeStyle = "#9ab0c0"; c.stroke();
          c.restore();
        } else {
          const sc = on ? 1.95 + Math.sin(t * 6) * 0.05 : 1.75;
          S.pearl(c, x, y - 6, (b.idx * 2 + lv.world) % 6, 0, { scale: sc });
          D.text(c, String(b.idx - firstOf(lv.world) + 1), x, y - 2, 30, "#fff", "center", { head: true, lw: 6 });
          const st = this.stars[b.idx] || 0;
          for (let i = 0; i < 3; i++) D.text(c, "★", x - 22 + i * 22, y + 34, 22, i < st ? C.gold : "rgba(255,255,255,0.25)", "center", { head: true, lw: 4 });
        }
      }
      // details of the level under the pointer
      const show = hov ? hov.idx : this.sel, lv = PP.LEVELS[show];
      D.rr(c, 240, H - 84, 990, 64, 18, "rgba(6,40,60,0.85)", "#7ac8e0", 2.5);
      if (show > this.unlocked) D.text(c, "Clear the level before to unlock this one", 735, H - 52, 26, C.dim, "center", { head: true, lw: 5 });
      else {
        D.text(c, lv.name, 270, H - 52, 30, C.gold, "left", { head: true, lw: 6 });
        const best = this.best[show];
        D.text(c, `${lv.colors} colours   ${lv.tracks.length === 2 ? "two tracks   " : ""}ace time ${PP.G.par(lv)} s   best ${best ? U.fmt(best) : "–"}`, 1205, H - 52, 22, C.paper, "right", { head: true, lw: 5 });
      }
      UI.drawButtons(c, this.btns);
      pointer(c);
    },
  };

  /* ================= RESULTS ================= */
  States.results = {
    btns: [], t: 0,
    enter(arg) {
      this.r = arg; this.t = 0;
      A.playSong(arg.win ? "results" : "map");
      const next = arg.idx + 1 < PP.LEVELS.length ? arg.idx + 1 : null;
      const x = W / 2 - 170;
      this.btns = arg.win ? [
        next !== null ? { x, y: 480, w: 340, h: 66, label: "Next level", size: 34, act: () => setState("play", { idx: next }) }
          : { x, y: 480, w: 340, h: 66, label: "All levels done!", size: 28, act: () => setState("map", { idx: arg.idx }) },
        { x: x - 190, y: 480, w: 170, h: 66, label: "Replay", color: C.blue, act: () => setState("play", { idx: arg.idx }) },
        { x: x + 360, y: 480, w: 170, h: 66, label: "Map", color: C.blue, act: () => setState("map", { idx: next !== null ? next : arg.idx }) },
      ] : [
        { x, y: 470, w: 340, h: 66, label: "Try again", size: 34, act: () => setState("play", { idx: arg.idx }) },
        { x, y: 550, w: 340, h: 58, label: "Map", color: C.blue, act: () => setState("map", { idx: arg.idx }) },
      ];
      focus(this.btns);
      if (arg.win && arg.unlocked) setTimeout(() => A.sfx("life"), 900);
    },
    input() { if (I.hit("back")) { A.sfx("menuBack"); setState("map", { idx: this.r.idx }); return; } UI.runButtons(this.btns); },
    update(dt) { this.t += dt; },
    draw(c) {
      const r = this.r, lv = PP.LEVELS[r.idx];
      backdrop(c, 1 / 60, 0.55, lv.world);
      D.panel(c, W / 2 - 380, 50, 760, 400);
      if (r.win) {
        const o = r.over;
        D.text(c, o.ace ? "Ace time!" : "Level clear!", W / 2, 106, 56, C.gold, "center", { head: true, lw: 10 });
        D.text(c, lv.name, W / 2, 150, 26, C.paper, "center", { head: true, lw: 5 });
        const rows = [
          ["Clear bonus", o.clearBonus],
          [`Time ${Math.round(o.time)} s (ace ${o.par} s)`, o.timeBonus],
          ["No life lost", o.perfectBonus],
        ];
        rows.forEach(([l, v], i) => {
          if (this.t < 0.3 + i * 0.25) return;
          D.text(c, l, W / 2 - 300, 200 + i * 40, 26, C.paper, "left", { head: true, lw: 5 });
          D.text(c, v ? "+" + U.fmt(v) : "–", W / 2 + 300, 200 + i * 40, 26, v ? C.gold : C.dim, "right", { head: true, lw: 5 });
        });
        if (this.t > 1.1) {
          D.line(c, W / 2 - 300, 312, W / 2 + 300, 312, "rgba(255,255,255,0.4)", 2);
          D.text(c, "Score", W / 2 - 300, 340, 32, C.paper, "left", { head: true, lw: 6 });
          D.text(c, U.fmt(r.score), W / 2 + 300, 340, 36, C.gold, "right", { head: true, lw: 6 });
          if (r.newBest) D.text(c, "New best!", W / 2, 340, 26, C.green, "center", { head: true, lw: 5 });
        }
        for (let i = 0; i < 3; i++) {
          const k = U.ease((this.t - 1.3 - i * 0.25) * 4);
          if (k <= 0) continue;
          const on = i < o.stars;
          D.text(c, "★", W / 2 + (i - 1) * 70, 404, 30 + 30 * k, on ? C.gold : "rgba(255,255,255,0.25)", "center", { head: true, lw: 7 });
        }
      } else {
        D.text(c, "Game over", W / 2, 140, 72, C.red, "center", { head: true, lw: 12 });
        D.text(c, "The clam swallowed your pearls once too often.", W / 2, 220, 26, C.paper, "center", { head: true, lw: 5 });
        D.text(c, lv.name, W / 2, 290, 30, C.gold, "center", { head: true, lw: 6 });
        S.puffer(c, W / 2, 380, Math.sin(this.t * 2) * 0.15, { t: this.t, blink: Math.sin(this.t * 3) > 0.9 });
      }
      UI.drawButtons(c, this.btns);
      pointer(c);
    },
  };

  /* ================= OPTIONS ================= */
  States.options = {
    btns: [], drag: null,
    enter(arg) { this.back = (arg && arg.back) || "title"; this.build(); focus(this.btns); },
    build() {
      const M = PP.Main;
      this.btns = [
        { x: 420, y: 160, w: 440, h: 40, custom: true, id: "music", focusable: true },
        { x: 420, y: 250, w: 440, h: 40, custom: true, id: "sfx", focusable: true },
        { x: 420, y: 310, w: 440, h: 60, label: "Voice: " + (A.voiceOn ? "on" : "off"), act: () => { A.setVoice(!A.voiceOn); this.build(); } },
        { x: 420, y: 382, w: 440, h: 60, label: "Keep screen awake: " + (M.keepAwake ? "on" : "off"), act: () => { M.keepAwake = !M.keepAwake; Store.set("keepAwake", M.keepAwake); this.build(); } },
        { x: 420, y: 454, w: 440, h: 60, label: "Fullscreen", act: () => M.toggleFullscreen() },
        { x: 420, y: 526, w: 440, h: 60, label: this.confirm ? "Really reset progress?" : "Reset progress", color: C.red, act: () => {
          if (!this.confirm) { this.confirm = true; this.build(); return; }
          Store.set("unlocked", 0); Store.set("best", {}); Store.set("stars", {}); this.confirm = false; this.build();
        } },
        { x: 24, y: H - 82, w: 180, h: 60, label: "Back", back: true, color: C.red, act: () => this.leave() },
      ];
      if (this.back === "play") this.btns.splice(5, 1);
    },
    leave() { this.confirm = false; if (this.back === "play") { setState("play"); PP.States.play.pause(); } else setState(this.back); },
    input() {
      if (I.hit("back")) { A.sfx("menuBack"); this.leave(); return; }
      const m = I.mouse;
      for (const b of this.btns) {
        if (!b.custom) continue;
        const hov = inR(m, b), val = b.id === "music" ? A.musicVol : A.sfxVol;
        const set = (v) => { v = U.clamp(Math.round(v * 20) / 20, 0, 1); if (b.id === "music") A.setMusicVol(v); else { A.setSfxVol(v); A.sfx("insert"); } };
        if (hov && (I.hit("left") || I.hit("right"))) set(val + (I.hit("right") ? 0.05 : -0.05));
        if (m.clicked && hov) this.drag = b.id;
        if (this.drag === b.id && m.down) set((m.x - b.x) / b.w);
      }
      if (!m.down) this.drag = null;
      UI.runButtons(this.btns.filter((b) => !b.custom));
      navigate(this.btns);
    },
    update() {},
    draw(c) {
      backdrop(c, 1 / 60, 0.6);
      heading(c, "Options");
      for (const b of this.btns) if (b.custom) D.slider(c, b.x, b.y + 10, b.w, b.id === "music" ? A.musicVol : A.sfxVol, b.id === "music" ? "Music" : "Sound effects", inR(I.mouse, b));
      UI.drawButtons(c, this.btns.filter((b) => !b.custom));
      pointer(c);
    },
  };

  /* ================= HELP ================= */
  const PAGES = [
    { title: "The goal", text: "Chains of pearls roll along the grooves towards the giant clam. Puff the pufferfish spits pearls into the chain.\n\nWhen three or more pearls of the same colour touch, they pop. If the pearls on both sides of the gap have the same colour, the front part rolls back – and if that makes another match, you get a combo.\n\nThe bar at the top shows how many pearls are still to come. Pop them all before one reaches the clam. Every pearl that slips in costs a life.", pic: "chain" },
    { title: "Power pearls", text: "Some pearls carry a sign. Pop them to use their power:\n\nSlow down: the chains roll slowly for a while.\nReverse: the chains roll back for a moment.\nSharp eye: a laser shows where your shot lands, and shots fly faster.\nBlast: pops all pearls close by.\n\nGold coins appear now and then – shoot through them for extra points. Every 10,000 points give an extra life.", pic: "power" },
    { title: "Stars and bonuses", text: "Each cleared level gives a clear bonus and up to three stars: one for clearing it, one for clearing it without losing a life, and one for beating the ace time. Faster clears give a bigger time bonus.\n\nShots that pop several groups in a row and long combos score the most. Pearls of colours that are no longer in play are never offered to you.", pic: "stars" },
    { title: "Controls", text: "Mouse: aim with the pointer, left click shoots, right click (or a click on Puff) swaps the two pearls.\nTouch: tap where you want to shoot, tap Puff to swap.\nKeyboard: arrow keys turn Puff (hold Shift for fine aiming), Space shoots, S or Tab swaps, Esc or P pauses.\nGamepad: either stick aims, A or RT shoots, B, X or LT swaps, Start pauses.\n\nF switches fullscreen, M mutes the sound.", pic: null },
  ];
  States.help = {
    btns: [], page: 0, t: 0,
    enter(arg) { this.back = (arg && arg.back) || "title"; this.page = 0; this.build(); focus(this.btns); },
    build() {
      this.btns = [
        { x: W / 2 - 230, y: H - 92, w: 200, h: 62, label: "Previous", disabled: this.page === 0, color: C.blue, act: () => { this.page--; this.build(); } },
        { x: W / 2 + 30, y: H - 92, w: 200, h: 62, label: this.page === PAGES.length - 1 ? "Done" : "Next", act: () => { if (this.page < PAGES.length - 1) { this.page++; this.build(); } else this.leave(); } },
        { x: 24, y: H - 92, w: 180, h: 62, label: "Back", back: true, color: C.red, act: () => this.leave() },
      ];
    },
    leave() { if (this.back === "play") { setState("play"); PP.States.play.pause(); } else setState(this.back); },
    input() { if (I.hit("back")) { A.sfx("menuBack"); this.leave(); return; } UI.runButtons(this.btns); },
    update(dt) { this.t += dt; },
    draw(c) {
      backdrop(c, 1 / 60, 0.6);
      const p = PAGES[this.page], t = this.t;
      D.panel(c, 90, 30, 1100, 570, { title: `${p.title}  (${this.page + 1}/${PAGES.length})` });
      D.para(c, p.text, 130, 92, 24, p.pic ? 700 : 1020, C.paper, 1.36);
      if (p.pic === "chain") {
        const x0 = 880, y0 = 250;
        const row = [3, 1, 1, null, 1, 4];
        row.forEach((ci, i) => { if (ci !== null) S.pearl(c, x0 + i * 36, y0, ci, 0, { scale: 1 }); });
        D.text(c, "▲", x0 + 3 * 36, y0 + 40, 26, C.gold, "center", { head: true, lw: 5 });
        S.puffer(c, x0 + 3 * 36, y0 + 150, -Math.PI / 2, { t, cur: 1, next: 2 });
        S.clam(c, 1080, 470, 0, 0.7 + Math.sin(t * 3) * 0.2, t);
      } else if (p.pic === "power") {
        ["slow", "back", "aim", "bomb"].forEach((k, i) => {
          const y = 150 + i * 92;
          S.pearl(c, 900, y, i + 1, 0, { power: k, glow: t, scale: 1.5 });
          D.text(c, S.POWER_NAME[k], 950, y, 26, C.gold, "left", { head: true, lw: 5 });
        });
        S.coin(c, 900, 520, t, 1); D.text(c, "Treasure", 950, 520, 26, C.gold, "left", { head: true, lw: 5 });
      } else if (p.pic === "stars") {
        for (let i = 0; i < 3; i++) D.text(c, "★", 900 + i * 90, 260 + Math.sin(t * 3 + i) * 6, 80, C.gold, "center", { head: true, lw: 8 });
        D.text(c, "clear   no life lost   ace time", 990, 330, 20, C.paper, "center", { head: true, lw: 4 });
      }
      UI.drawButtons(c, this.btns);
      pointer(c);
    },
  };
})(window.PP);
