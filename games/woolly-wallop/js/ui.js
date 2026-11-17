/* Woolly Wallop: screens – title, level map, results, options, help */
"use strict";

(function (WW) {
  const { U, D, S, Store } = WW;
  const A = WW.Audio, I = WW.Input;
  const W = U.W, H = U.H, C = D.C;
  const States = (WW.States = {});
  let setState = null;
  const UI = (WW.UI = { bind(fn) { setState = fn; } });
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

  /* ---------- a meadow with a flock behind the menus ---------- */
  const deco = { t: 0 };
  const SC = 40; // pixels per metre in the menus
  function world(c, fn) { c.save(); c.translate(0, S.GROUND_Y); c.scale(SC, SC); S.px = 1 / SC; fn(); c.restore(); }
  function backdrop(c, dt, dark = 0.2, wi = 0) {
    deco.t += dt;
    const t = deco.t;
    S.backdrop(c, WW.WORLDS[wi]);
    world(c, () => {
      // sheep hop across the meadow, one after another
      const types = ["woolly", "lambs", "zoomer", "boomer", "bruiser"];
      types.forEach((ty, i) => {
        const r = WW.SHEEP[ty].r, x = ((t * 1.6 + i * 6.5) % 40) - 4, hop = Math.abs(Math.sin(t * 5 + i)) * 0.5;
        S.sheep(c, ty, x, -r - hop - 0.42 * r, r, Math.sin(t * 5 + i) * 0.08, { t, fly: hop > 0.3 });
      });
      // a wolf peeks out of its hut
      const wx = 27.5;
      S.wolf(c, "wolf", wx, -0.52 - Math.max(0, Math.sin(t * 0.9)) * 0.2, 0.52, 0, { t });
      for (const b of hut) S.block(c, b);
    });
    if (dark) { c.fillStyle = `rgba(30,15,5,${dark})`; c.fillRect(0, 0, W, H); }
  }
  // a little hut made of block look-alikes
  const hut = [
    { x: 26.4, y: -0.6, a: 0, hw: 0.125, hh: 0.6, shape: "box", id: 1, data: { mat: "wood", hp: 1, max: 1 } },
    { x: 28.6, y: -0.6, a: 0, hw: 0.125, hh: 0.6, shape: "box", id: 2, data: { mat: "wood", hp: 1, max: 1 } },
    { x: 27.5, y: -1.325, a: 0, hw: 1.35, hh: 0.125, shape: "box", id: 3, data: { mat: "wood", hp: 1, max: 1 } },
    { x: 27.5, y: -1.75, a: 0, hw: 0.3, hh: 0.3, shape: "box", id: 4, data: { mat: "stone", hp: 1, max: 1 } },
  ];
  UI.backdrop = backdrop;
  function logo(c, y) {
    const t = deco.t;
    c.save(); c.translate(W / 2, y); c.rotate(Math.sin(t * 1.1) * 0.015);
    const word = (s, yy, colr, size) => D.text(c, s, 0, yy, size, colr, "center", { head: true, lw: 20 });
    word("WOOLLY", -52, "#fffaf0", 132);
    word("WALLOP!", 70, "#ffd23a", 132);
    c.restore();
    // a sheep flies past the title
    c.save(); c.translate(W / 2 + 360, y - 60 + Math.sin(t * 2) * 10); c.scale(70, 70); S.px = 1 / 70;
    S.sheep(c, "woolly", 0, 0, 0.5, -0.3 + Math.sin(t * 2) * 0.05, { t, fly: true });
    c.restore();
    c.save(); c.translate(W / 2 - 370, y + 70); c.scale(70, 70); S.px = 1 / 70;
    S.wolf(c, "alpha", 0, 0, 0.7, Math.sin(t * 1.5) * 0.06, { t, hp: 1 });
    c.restore();
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
      D.text(c, "Fling the flock, topple the wolves\u2019 forts", W / 2, 410, 32, C.paper, "center", { head: true, lw: 7 });
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
  const firstOf = (wi) => WW.LEVELS.findIndex((l) => l.world === wi);
  States.map = {
    btns: [], sel: 0,
    enter(arg) {
      A.playSong("map");
      this.unlocked = Store.get("unlocked", 0);
      this.best = Store.get("best", {}); this.stars = Store.get("stars", {});
      this.sel = arg && arg.idx !== undefined ? arg.idx : Math.min(this.unlocked, WW.LEVELS.length - 1);
      const B = [];
      WW.WORLDS.forEach((w, wi) => {
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
      const wi = hov ? WW.LEVELS[hov.idx].world : WW.LEVELS[this.sel].world;
      backdrop(c, 1 / 60, 0.5, wi);
      heading(c, "Choose a level", 52, 54);
      const t = deco.t;
      WW.WORLDS.forEach((w, k) => {
        const y = 160 + k * 118;
        D.rr(c, 50, y - 50, 1180, 106, 22, k === wi ? "rgba(122,74,40,0.94)" : "rgba(74,44,24,0.88)", k === wi ? "#ffe9a8" : C.ink, 4);
        D.text(c, w.name, 80, y + 4, 34, C.paper, "left", { head: true, lw: 7 });
        const f = firstOf(k);
        const total = [0, 1, 2, 3, 4].reduce((a, i) => a + (this.stars[f + i] || 0), 0);
        D.text(c, `★ ${total}/15`, 80, y + 38, 20, C.gold, "left", { head: true, lw: 5 });
      });
      for (const b of this.btns) {
        if (!b.custom) continue;
        const x = b.x + 40, y = b.y + 40, lv = WW.LEVELS[b.idx], locked = b.disabled, on = hov === b;
        if (locked) {
          D.circle(c, x, y, 30, "#6a5a4a", C.ink, 4);
          c.save(); c.translate(x, y + 2);
          D.rr(c, -10, -4, 20, 16, 4, "#c8b8a0", C.ink, 2.5);
          c.beginPath(); c.arc(0, -5, 7, Math.PI, 0); c.lineWidth = 4; c.strokeStyle = "#c8b8a0"; c.stroke();
          c.restore();
        } else {
          const sc = on ? 64 + Math.sin(t * 6) * 3 : 58;
          c.save(); c.translate(x, y - 4); c.scale(sc, sc); S.px = 1 / sc;
          S.sheep(c, lv.sheep[0], 0, 0, 0.5, on ? Math.sin(t * 8) * 0.1 : 0, { t });
          c.restore();
          D.text(c, String(b.idx - firstOf(lv.world) + 1), x - 40, y - 4, 28, "#fff", "center", { head: true, lw: 6 });
          const st = this.stars[b.idx] || 0;
          for (let i = 0; i < 3; i++) D.text(c, "★", x - 22 + i * 22, y + 36, 22, i < st ? C.gold : "rgba(255,255,255,0.3)", "center", { head: true, lw: 4 });
        }
      }
      // details of the level under the pointer
      const show = hov ? hov.idx : this.sel, lv = WW.LEVELS[show];
      D.rr(c, 240, H - 84, 990, 64, 18, "rgba(74,44,24,0.92)", C.ink, 3);
      if (show > this.unlocked) D.text(c, "Clear the level before to unlock this one", 735, H - 52, 26, C.dim, "center", { head: true, lw: 5 });
      else {
        D.text(c, lv.name, 270, H - 52, 30, C.gold, "left", { head: true, lw: 6 });
        const best = this.best[show];
        const wolves = lv.objs.filter((o) => o.t === "wolf").length;
        D.text(c, `${wolves} wolves   ${lv.sheep.length} sheep   best ${best ? U.fmt(best) : "\u2013"}`, 1205, H - 52, 24, C.paper, "right", { head: true, lw: 5 });
      }
      UI.drawButtons(c, this.btns);
      pointer(c);
    },
  };

  /* ================= RESULTS ================= */
  States.results = {
    btns: [], t: 0,
    enter(arg) {
      this.r = arg; this.t = 0; this.starSnd = [];
      A.playSong(arg.win ? "results" : "map");
      const next = arg.idx + 1 < WW.LEVELS.length ? arg.idx + 1 : null;
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
      
    },
    input() { if (I.hit("back")) { A.sfx("menuBack"); setState("map", { idx: this.r.idx }); return; } UI.runButtons(this.btns); },
    update(dt) { this.t += dt; },
    draw(c) {
      const r = this.r, lv = WW.LEVELS[r.idx];
      backdrop(c, 1 / 60, 0.55, lv.world);
      D.panel(c, W / 2 - 380, 50, 760, 400);
      if (r.win) {
        const o = r.over;
        D.text(c, "Wolves routed!", W / 2, 110, 58, C.gold, "center", { head: true, lw: 10 });
        D.text(c, lv.name, W / 2, 160, 28, C.paper, "center", { head: true, lw: 6 });
        for (let i = 0; i < 3; i++) {
          const k = U.ease((this.t - 0.3 - i * 0.35) * 4);
          if (k <= 0) continue;
          if (!this.starSnd) this.starSnd = [];
          if (!this.starSnd[i]) { this.starSnd[i] = true; if (i < o.stars) A.sfx("star", i); }
          const on = i < o.stars;
          D.text(c, "\u2605", W / 2 + (i - 1) * 110, 262 - (i === 1 ? 14 : 0), 40 + 50 * k, on ? C.gold : "rgba(255,255,255,0.25)", "center", { head: true, lw: 8 });
        }
        if (this.t > 1.3) {
          D.text(c, U.fmt(r.score), W / 2, 360, 52, "#fff", "center", { head: true, lw: 9 });
          D.text(c, r.newBest ? "New best score!" : `Best ${U.fmt(r.best)}`, W / 2, 410, 26, r.newBest ? C.green : C.dim, "center", { head: true, lw: 5 });
        }
      } else {
        D.text(c, "The wolves hold out", W / 2, 120, 58, C.red, "center", { head: true, lw: 10 });
        D.text(c, "Your flock ran out of sheep. Try another angle!", W / 2, 186, 26, C.paper, "center", { head: true, lw: 5 });
        D.text(c, lv.name, W / 2, 236, 30, C.gold, "center", { head: true, lw: 6 });
        c.save(); c.translate(W / 2, 350); c.scale(80, 80); S.px = 1 / 80;
        S.wolf(c, "wolf", 0, 0, 0.6, Math.sin(this.t * 2) * 0.1, { t: this.t, hp: 1 });
        c.restore();
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
      const M = WW.Main;
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
    leave() { this.confirm = false; if (this.back === "play") { setState("play"); WW.States.play.pause(); } else setState(this.back); },
    input() {
      if (I.hit("back")) { A.sfx("menuBack"); this.leave(); return; }
      const m = I.mouse;
      for (const b of this.btns) {
        if (!b.custom) continue;
        const hov = inR(m, b), val = b.id === "music" ? A.musicVol : A.sfxVol;
        const set = (v) => { v = U.clamp(Math.round(v * 20) / 20, 0, 1); if (b.id === "music") A.setMusicVol(v); else { A.setSfxVol(v); A.sfx("pop"); } };
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
    { title: "The flock strikes back", text: "The wolves have built forts at the edge of the meadow. Load a sheep into the slingshot, pull back and let go.\n\nKnock the wolves out: hit them, drop blocks on them, or knock them off their perch. When every wolf in a level is out, you win. Each sheep left over earns 10,000 bonus points.\n\nThe dotted line shows where your sheep starts to fly; the faint trail shows your last shot.", pic: "sling" },
    { title: "The flock", text: "Woolly is a good all-rounder.\nLambkins split into three when you tap in flight.\nZoomer shoots forward with a burst of speed.\nBoomer makes a thunderclap when you tap \u2013 or by itself shortly after it hits something.\nBruiser is big and heavy, and stomps straight down on a tap.\n\nThe tricks only work before the sheep hits something (Boomer goes off any time).", pic: "flock" },
    { title: "Forts and wolves", text: "Ice shatters easily, wood breaks with a good hit, and stone takes heavy blows \u2013 send the Bruiser.\nRed firework crates explode when they break.\n\nPups are small and fragile, grown wolves are tougher, and the alpha with the eye patch takes the most.\n\nEach level gives up to three stars for your score. Your best score and stars are saved, and each cleared level unlocks the next.", pic: "fort" },
    { title: "Controls", text: "Mouse and touch: press near the slingshot (or anywhere), drag back to aim and let go. Click or tap again in flight for the trick.\nKeyboard: arrow keys aim (left/right angle, up/down power), Space shoots and triggers the trick, R restarts the level, Esc or P pauses.\nGamepad: the stick pulls the slingshot, A shoots and triggers the trick, Y restarts, Start pauses.\n\nF switches fullscreen, M mutes the sound.", pic: null },
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
    leave() { if (this.back === "play") { setState("play"); WW.States.play.pause(); } else setState(this.back); },
    input() { if (I.hit("back")) { A.sfx("menuBack"); this.leave(); return; } UI.runButtons(this.btns); },
    update(dt) { this.t += dt; },
    draw(c) {
      backdrop(c, 1 / 60, 0.6);
      const p = PAGES[this.page], t = this.t;
      D.panel(c, 90, 30, 1100, 570, { title: `${p.title}  (${this.page + 1}/${PAGES.length})` });
      D.para(c, p.text, 130, 92, 24, p.pic ? 700 : 1020, C.paper, 1.36);
      const sp = (fn, x, y, k) => { c.save(); c.translate(x, y); c.scale(k, k); S.px = 1 / k; fn(); c.restore(); };
      if (p.pic === "sling") {
        sp(() => {
          const pull = { x: -1.1 - Math.sin(t * 2) * 0.3, y: 0.6 };
          S.sling(c, 0, -2.35, "back", { x: pull.x, y: -2.35 + pull.y });
          S.sheep(c, "woolly", pull.x, -2.35 + pull.y, 0.5, 0, { t });
          S.sling(c, 0, -2.35, "front", { x: pull.x, y: -2.35 + pull.y });
          c.fillStyle = "rgba(255,255,255,0.8)";
          for (let i = 1; i < 9; i++) { const tt = i * 0.09; c.beginPath(); c.arc(pull.x + 9 * tt, -2.35 + pull.y - 7 * tt + 5 * tt * tt, 0.07, 0, U.TAU); c.fill(); }
        }, 980, 520, 70);
      } else if (p.pic === "flock") {
        ["woolly", "lambs", "zoomer", "boomer", "bruiser"].forEach((ty, i) => {
          sp(() => S.sheep(c, ty, 0, 0, WW.SHEEP[ty].r, Math.sin(t * 3 + i) * 0.08, { t, fly: i % 2 === 1 }), 940, 140 + i * 92, 62);
          D.text(c, WW.SHEEP[ty].name, 1000, 140 + i * 92, 28, C.gold, "left", { head: true, lw: 6 });
        });
      } else if (p.pic === "fort") {
        sp(() => {
          const blocks = [["ice", -1.4], ["wood", 0], ["stone", 1.4]];
          blocks.forEach(([m, x], i) => S.block(c, { x, y: -0.6, a: 0, hw: 0.5, hh: 0.6, shape: "box", id: i + 9, data: { mat: m, hp: 1, max: 1 } }));
          S.block(c, { x: 2.8, y: -0.4, a: 0, hw: 0.4, hh: 0.4, shape: "box", id: 20, data: { mat: "boom", hp: 1, max: 1 } });
          S.wolf(c, "pup", -1.2, -2.6, 0.38, 0, { t, hp: 1 });
          S.wolf(c, "wolf", 0.3, -2.6, 0.52, 0, { t, hp: 1 });
          S.wolf(c, "alpha", 2, -2.75, 0.7, 0, { t, hp: 1 });
        }, 950, 460, 62);
      }
      UI.drawButtons(c, this.btns);
      pointer(c);
    },
  };
})(window.WW);
