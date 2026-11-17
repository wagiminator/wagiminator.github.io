/* Mole Mayhem: screens – title, match setup, results, options, help */
"use strict";

(function (MM) {
  const { U, D, G, T, Store } = MM;
  const A = MM.Audio, I = MM.Input, S = MM.Sprites;
  const W = U.W, H = U.H, C = D.C;
  const States = (MM.States = {});
  let setState = null;
  const UI = (MM.UI = { bind(fn) { setState = fn; } });
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
  function focusFirst(btns) {
    if (I.lastDevice === "mouse" || !btns.length) return;
    const b = btns.find((x) => !x.disabled) || btns[0];
    I.mouse.x = b.x + b.w / 2; I.mouse.y = b.y + b.h / 2;
  }
  function pointer(c) { if (I.showCursor()) D.hand(c, I.mouse.x, I.mouse.y); }
  function backBtn(to, arg) { return { x: 24, y: H - 82, w: 180, h: 60, label: "Back", back: true, color: C.red, act: () => setState(to, arg) }; }
  function heading(c, s, y = 64, size = 64) { D.text(c, s, W / 2, y, size, C.gold, "center", { head: true, weight: 400, lw: 12 }); }

  /* ---------- a computer match behind the menus ---------- */
  const demo = (UI.demo = { s: null, t: 0, cam: { x: 1200, y: 560, z: 0.55 }, seed: 31 });
  function demoTick(dt) {
    if (!demo.s || G.s !== demo.s || demo.s.over && demo.t > 6 || demo.t > 240) {
      G.on = null;
      demo.s = G.start({ seed: demo.seed++, theme: ["meadow", "desert", "arctic", "volcano"][demo.seed % 4], teams: [0, 1, 2, 3].map((i) => ({ col: i, name: D.TEAM_NAME[i], ctrl: "cpu", level: "normal" })), moles: 3, hp: 100, turnTime: 30, mines: true, retreat: 3 });
      MM.AI.reset();
      demo.t = 0;
    }
    demo.t += dt;
    MM.AI.update(dt);
    if (demo.s.charging) G.chargeTick(dt);
    G.update(dt);
    const f = demo.s.focus && !demo.s.focus.gone ? demo.s.focus : demo.s.cur;
    if (f) { demo.cam.x += (f.x - demo.cam.x) * dt * 1.5; demo.cam.y += ((f.y || 500) - 80 - demo.cam.y) * dt * 1.5; }
    demo.cam.x = U.clamp(demo.cam.x, 1170, 1230 + 0); // keep the whole island in view
  }
  function backdrop(c, dt, dark = 0.35) {
    demoTick(dt);
    const cam = { x: demo.cam.x, y: U.clamp(demo.cam.y, 520, 600), z: 0.54 };
    MM.View.drawWorld(c, demo.s, cam, { noLabels: true });
    c.fillStyle = `rgba(14,10,8,${dark})`; c.fillRect(0, 0, W, H);
  }
  UI.backdrop = backdrop;
  function logo(c, y) {
    const t = performance.now() / 1000;
    c.save(); c.translate(W / 2, y); c.rotate(Math.sin(t * 1.2) * 0.02);
    D.text(c, "MOLE", -10, -40, 120, "#ffd13a", "center", { head: true, weight: 400, lw: 18 });
    D.text(c, "MAYHEM", 0, 70, 120, "#e8473a", "center", { head: true, weight: 400, lw: 18 });
    c.restore();
    // a mole peeking out next to the title
    c.save(); c.translate(W / 2 + 230, y - 10); c.scale(3, 3);
    S.mole(c, 0, 0, -1, { t, pose: "stand", team: 1, weapon: "bazooka", aim: -0.4 + Math.sin(t) * 0.1 });
    c.restore();
  }

  /* ================= BOOT ================= */
  States.boot = {
    t: 0,
    enter() { this.t = 0; },
    input() { if (I.mouse.clicked || I.pressed.size || I.pad.pressed.size) { A.init(); setState("title"); } },
    update(dt) { this.t += dt; },
    draw(c) {
      backdrop(c, 1 / 60, 0.25);
      logo(c, 220);
      D.text(c, "Turn-based mole warfare on a crumbling island", W / 2, 400, 30, C.paper, "center", { lw: 6 });
      if (Math.sin(this.t * 4) > -0.3) D.text(c, I.touch ? "Tap to start" : "Click or press any key", W / 2, 500, 34, C.gold, "center", { head: true, weight: 400, lw: 7 });
    },
  };

  /* ================= TITLE ================= */
  States.title = {
    btns: [],
    enter() {
      A.playSong("title");
      const x = W / 2 - 170;
      this.btns = [
        { x, y: 400, w: 340, h: 72, label: "Play", size: 40, act: () => setState("setup") },
        { x, y: 488, w: 340, h: 60, label: "Options", color: C.blue, act: () => setState("options", { back: "title" }) },
        { x, y: 562, w: 340, h: 60, label: "How to play", color: C.blue, act: () => setState("help", { back: "title" }) },
      ];
      focusFirst(this.btns);
    },
    input() { UI.runButtons(this.btns); },
    update() {},
    draw(c) {
      backdrop(c, 1 / 60, 0.3);
      logo(c, 180);
      UI.drawButtons(c, this.btns);
      D.text(c, "F fullscreen · M mute", W - 20, H - 20, 18, C.paper, "right", { lw: 4 });
      pointer(c);
    },
  };

  /* ================= MATCH SETUP ================= */
  const CTRL = [["human", null, "Human"], ["cpu", "easy", "CPU easy"], ["cpu", "normal", "CPU normal"], ["cpu", "hard", "CPU hard"], ["off", null, "–"]];
  const TEAM_NAMES = ["Red Diggers", "Blue Burrowers", "Green Gophers", "Yellow Tunnelers"];
  const cfgDefault = () => ({
    slots: [0, 2, 4, 4], moles: 4, hp: 100, turnTime: 45, theme: "random", mines: true, sudden: 12, seed: 1,
  });
  const loadCfg = () => Object.assign(cfgDefault(), Store.get("setup", {}));
  UI.matchCfg = function (o) {
    const teams = [];
    o.slots.forEach((k, i) => { const [ctrl, level] = CTRL[k]; if (ctrl !== "off") teams.push({ col: i, name: TEAM_NAMES[i], ctrl, level }); });
    const themes = ["meadow", "desert", "arctic", "volcano"];
    return { seed: (Math.random() * 1e9) | 0, theme: o.theme === "random" ? U.pick(themes) : o.theme, teams, moles: o.moles, hp: o.hp, turnTime: o.turnTime, mines: o.mines, sudden: o.sudden, retreat: 4 };
  };
  States.setup = {
    btns: [],
    enter() { A.playSong("setup"); this.o = loadCfg(); this.build(); focusFirst(this.btns); },
    build() {
      const o = this.o, B = [];
      const save = () => { Store.set("setup", o); this.build(); };
      o.slots.forEach((k, i) => {
        B.push({ x: 700, y: 128 + i * 66, w: 260, h: 54, label: CTRL[k][2], color: k === 4 ? "#6a6560" : D.TEAM[i], size: 26,
          act: () => { o.slots[i] = (o.slots[i] + 1) % CTRL.length; if (o.slots.filter((x) => x !== 4).length < 2) o.slots[i] = 0; save(); } });
      });
      const row = (y, label, vals, key, fmt) => {
        vals.forEach((v, i) => B.push({ x: 380 + i * 132, y, w: 122, h: 50, label: fmt ? fmt(v) : String(v), on: o[key] === v, color: o[key] === v ? C.gold : "#5a6680", size: 22, act: () => { o[key] = v; save(); } }));
        B.push({ custom: true, label, x: 0, y, w: 0, h: 0 });
      };
      row(408, "Moles", [2, 3, 4, 5, 6], "moles");
      row(468, "Health", [50, 100, 150, 200], "hp");
      row(528, "Turn time", [30, 45, 60, 90], "turnTime", (v) => v + " s");
      row(588, "Island", ["random", "meadow", "desert", "arctic", "volcano"], "theme", (v) => v[0].toUpperCase() + v.slice(1));
      B.push({ x: 1040, y: 408, w: 220, h: 50, label: o.mines ? "Mines on" : "Mines off", on: o.mines, color: o.mines ? C.gold : "#5a6680", size: 22, act: () => { o.mines = !o.mines; save(); } });
      B.push({ x: 1040, y: 468, w: 220, h: 50, label: o.sudden ? `Sudden death: ${o.sudden} rounds` : "No sudden death", color: o.sudden ? C.gold : "#5a6680", size: 20,
        act: () => { o.sudden = o.sudden === 12 ? 20 : o.sudden === 20 ? 0 : 12; save(); } });
      B.push({ x: W - 300, y: H - 86, w: 270, h: 68, label: "Fight!", size: 38, act: () => setState("play", { cfg: UI.matchCfg(o) }) });
      B.push(backBtn("title"));
      this.btns = B;
    },
    input() { if (I.hit("back")) { A.sfx("menuBack"); setState("title"); return; } UI.runButtons(this.btns.filter((b) => !b.custom)); },
    update() {},
    draw(c) {
      backdrop(c, 1 / 60, 0.62);
      heading(c, "Match setup");
      this.o.slots.forEach((k, i) => {
        const y = 128 + i * 66;
        c.save(); c.translate(330, y + 50); c.scale(1.7, 1.7);
        if (k !== 4) S.mole(c, 0, 0, 1, { t: performance.now() / 1000 + i, team: i });
        c.restore();
        D.text(c, TEAM_NAMES[i], 380, y + 27, 28, k === 4 ? C.faint : D.TEAM[i], "left", { head: true, weight: 400, lw: 6 });
      });
      for (const b of this.btns) if (b.custom && b.label) D.text(c, b.label, 360, b.y + 26, 26, C.paper, "right", { head: true, weight: 400, lw: 6 });
      UI.drawButtons(c, this.btns);
      pointer(c);
    },
  };

  /* ================= RESULTS ================= */
  States.results = {
    btns: [],
    enter() {
      const s = G.s;
      this.s = s;
      A.playSong("results");
      this.btns = [
        { x: W / 2 - 170, y: 470, w: 340, h: 70, label: "Rematch", size: 36, act: () => setState("play", { cfg: UI.matchCfg(Object.assign(loadCfg())) }) },
        { x: W / 2 - 170, y: 554, w: 340, h: 60, label: "Change setup", color: C.blue, act: () => setState("setup") },
        { x: 24, y: H - 82, w: 180, h: 60, label: "Title", back: true, color: C.red, act: () => setState("title") },
      ];
      focusFirst(this.btns);
    },
    input() { UI.runButtons(this.btns); },
    update() {},
    draw(c) {
      backdrop(c, 1 / 60, 0.55);
      const s = this.s, win = s.over && s.over.winner;
      D.panel(c, W / 2 - 360, 60, 720, 380);
      D.text(c, win ? `${win.name} win!` : "Nobody survived!", W / 2, 120, 56, win ? D.TEAM[win.col] : C.paper, "center", { head: true, weight: 400, lw: 10 });
      if (win) {
        const alive = win.moles.filter((m) => !m.dead);
        alive.forEach((m, i) => {
          const x = W / 2 + (i - (alive.length - 1) / 2) * 120;
          c.save(); c.translate(x, 300); c.scale(2.6, 2.6); S.mole(c, 0, 0, 1, { t: performance.now() / 1000 * 2 + i, team: m.col, pose: "air" }); c.restore();
          D.text(c, m.name, x, 330, 20, C.paper, "center", { lw: 5 });
          D.text(c, `${Math.max(0, m.hp)} HP`, x, 356, 18, C.gold, "center", { lw: 4 });
        });
      }
      D.text(c, `${s.turnN} turns`, W / 2, 410, 20, C.dim, "center", { lw: 4 });
      UI.drawButtons(c, this.btns);
      pointer(c);
    },
  };

  /* ================= OPTIONS ================= */
  States.options = {
    btns: [], drag: null,
    enter(arg) { this.back = (arg && arg.back) || "title"; this.build(); focusFirst(this.btns); },
    build() {
      const M = MM.Main;
      this.btns = [
        { x: 420, y: 160, w: 440, h: 40, custom: true, id: "music", focusable: true },
        { x: 420, y: 250, w: 440, h: 40, custom: true, id: "sfx", focusable: true },
        { x: 420, y: 310, w: 440, h: 60, label: "Voices: " + (A.voiceOn ? "on" : "off"), act: () => { A.setVoice(!A.voiceOn); this.build(); } },
        { x: 420, y: 382, w: 440, h: 60, label: "Keep screen awake: " + (M.keepAwake ? "on" : "off"), act: () => { M.keepAwake = !M.keepAwake; Store.set("keepAwake", M.keepAwake); this.build(); } },
        { x: 420, y: 454, w: 440, h: 60, label: "Fullscreen", act: () => M.toggleFullscreen() },
        { x: 24, y: H - 82, w: 180, h: 60, label: "Back", back: true, color: C.red, act: () => this.leave() },
      ];
    },
    leave() { if (this.back === "play") { setState("play"); MM.States.play.buildMenu(); } else setState(this.back); },
    input() {
      if (I.hit("back")) { A.sfx("menuBack"); this.leave(); return; }
      const m = I.mouse;
      for (const b of this.btns) {
        if (!b.custom) continue;
        const hov = inR(m, b), val = b.id === "music" ? A.musicVol : A.sfxVol;
        const set = (v) => { v = U.clamp(Math.round(v * 20) / 20, 0, 1); if (b.id === "music") A.setMusicVol(v); else { A.setSfxVol(v); A.sfx("bounce"); } };
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
    { title: "The battle", text: "Two to four teams of moles fight on an island, one turn at a time. In your turn you move one mole and use one weapon – then you have a few seconds to run for cover.\n\nThe water is deadly, so are long falls into it. Explosions tear the ground apart and throw moles around. The last team with moles left wins.\n\nCrates drop from the sky: white ones heal, wooden ones hold a weapon.", icons: ["bazooka", "grenade", "dynamite"] },
    { title: "Weapons", text: "Bazooka and grenades fly further the longer you hold fire. The wind (bottom right) pushes rockets and air bombs. Grenades bounce and go off after their fuse – set it with keys 1 to 5.\n\nShotgun: two shots. Bat: knock someone off a cliff. Mines and barrels explode when hit. Homing missile and air strike need a click on the target first.", icons: ["cluster", "shotgun", "bat"] },
    { title: "Tools", text: "Drill and blowtorch dig through the ground. Girders build bridges and shields – arrows or wheel turn them. Teleport takes you anywhere. The jetpack flies with the up arrow.\n\nThe grappling hook: fire it at a ceiling, swing with left and right, climb with up and down, jump to let go. Hook and jetpack do not end your turn.", icons: ["girder", "rope", "teleport"] },
    { title: "Controls", text: "Keyboard: arrows walk and aim, Enter jumps, Backspace back-flips, hold Space to fire, W or Tab opens the weapons, 1–5 set the fuse, + and − zoom, Esc pauses.\nMouse: right click opens the weapons, click targets, drag the map to look around, wheel zooms.\nTouch: buttons on screen, drag to look around.\nGamepad: stick or d-pad walk and aim, A jumps, B back-flips, X fires, Y weapons, right stick looks around, LT/RT zoom, Start pauses.", icons: null },
  ];
  States.help = {
    btns: [], page: 0, t: 0,
    enter(arg) { this.back = (arg && arg.back) || "title"; this.page = 0; this.build(); focusFirst(this.btns); },
    build() {
      this.btns = [
        { x: W / 2 - 230, y: H - 92, w: 200, h: 62, label: "Previous", disabled: this.page === 0, color: C.blue, act: () => { this.page--; this.build(); } },
        { x: W / 2 + 30, y: H - 92, w: 200, h: 62, label: this.page === PAGES.length - 1 ? "Done" : "Next", act: () => { if (this.page < PAGES.length - 1) { this.page++; this.build(); } else this.leave(); } },
        { x: 24, y: H - 92, w: 180, h: 62, label: "Back", back: true, color: C.red, act: () => this.leave() },
      ];
    },
    leave() { if (this.back === "play") { setState("play"); MM.States.play.buildMenu(); } else setState(this.back); },
    input() { if (I.hit("back")) { A.sfx("menuBack"); this.leave(); return; } UI.runButtons(this.btns); },
    update(dt) { this.t += dt; },
    draw(c) {
      backdrop(c, 1 / 60, 0.6);
      const p = PAGES[this.page];
      D.panel(c, 100, 36, 1080, 560, { title: `${p.title}  (${this.page + 1}/${PAGES.length})` });
      D.para(c, p.text, 140, 96, 24, p.icons ? 720 : 1000, C.paper, 1.35);
      if (p.icons) p.icons.forEach((k, i) => {
        const y = 170 + i * 130;
        D.rr(c, 920, y - 50, 200, 100, 16, C.panelD, C.ink, 3);
        c.save(); c.translate(1020, y - 8); c.scale(1.4, 1.4); MM.weaponIcon(c, k, 0, 0); c.restore();
        D.text(c, MM.SHORT[k], 1020, y + 34, 16, C.gold, "center", { lw: 4 });
      });
      UI.drawButtons(c, this.btns);
      pointer(c);
    },
  };
})(window.MM);
