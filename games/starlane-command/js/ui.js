/* Starlane Command: screens – title, campaign, briefing, skirmish setup, results, options, help */
"use strict";

(function (SL) {
  const { U, D, G, Store } = SL;
  const A = SL.Audio, I = SL.Input;
  const W = U.W, H = U.H, C = D.C;
  const MISSIONS = SL.MISSIONS;
  const States = (SL.States = {});
  let setState = null;
  const UI = (SL.UI = { bind(fn) { setState = fn; } });
  const inR = (m, b) => m.x >= b.x && m.x <= b.x + b.w && m.y >= b.y && m.y <= b.y + b.h;

  /* ---------- progress ---------- */
  const Prog = (SL.Prog = {
    unlocked() { return Store.get("unlocked", 0); },
    unlock(i) { if (i > Prog.unlocked()) Store.set("unlocked", Math.min(MISSIONS.length - 1, i)); },
    best(id) { return Store.get("best-" + id, 0); },
    setBest(id, t) { const b = Prog.best(id); if (!b || t < b) { Store.set("best-" + id, Math.round(t)); return true; } return false; },
  });
  SL.lastSkirmish = Store.get("skirmish", { players: 2, size: "medium", level: "normal", seed: 1 });
  SL.freshDef = (mission) => (mission === "skirmish" ? SL.skirmish(SL.lastSkirmish) : SL.buildMission(mission));

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
      if (!b.quiet) A.sfx(b.back ? "menuBack" : "menuOk");
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
  function pointer(c) { if (I.showCursor()) D.cursor(c, I.mouse.x, I.mouse.y); }
  function backBtn(to, arg) { return { x: 30, y: H - 76, w: 170, h: 52, label: "Back", back: true, act: () => setState(to, arg) }; }
  function heading(c, s, y = 70) { D.text(c, s, W / 2, y, 40, C.text, "center", { weight: 700, font: D.LOGO, spacing: 4 }); }

  /* ---------- a live battle between computer commanders behind the menus ---------- */
  const demo = (UI.demo = { s: null, t: 0, seed: 77 });
  function demoTick(dt) {
    if (!demo.s || G.s !== demo.s || demo.s.over || demo.t > 420) {
      G.on = null;
      const def = SL.skirmish({ players: 4, size: "medium", level: "normal", seed: demo.seed++ });
      demo.s = G.start(def);
      for (const p of demo.s.players) { p.ai = true; p.level = "normal"; }
      SL.AI.init(demo.s);
      demo.t = 0;
      // let the opening play out off screen
      for (let i = 0; i < 60 * 20; i++) { SL.AI.update(1 / 60); G.update(1 / 60); }
    }
    if (dt) { demo.t += dt; SL.AI.update(dt * 2); G.update(dt * 2); }
  }
  function backdrop(c, dt, dark = 0.55) {
    demoTick(dt);
    D.background(c, W, H, demo.t);
    c.save();
    c.translate(W / 2 - 476 * 1.0, 0);
    SL.View.drawWorld(c, demo.s, { time: demo.t, labels: false });
    c.restore();
    c.fillStyle = `rgba(2,6,12,${dark})`; c.fillRect(0, 0, W, H);
  }
  UI.backdrop = backdrop;
  function logo(c, y, s = 1) {
    c.save(); c.translate(W / 2, y); c.scale(s, s);
    D.text(c, "STARLANE", 0, -30, 92, "#e8f6ff", "center", { weight: 900, font: D.LOGO, spacing: 14, glow: "#4fd4ff", blur: 26 });
    D.text(c, "COMMAND", 0, 46, 40, D.OWNER[0], "center", { weight: 700, font: D.LOGO, spacing: 26 });
    D.line(c, -330, 12, -150, 12, D.rgba(D.OWNER[0], 0.7), 2);
    D.line(c, 150, 12, 330, 12, D.rgba(D.OWNER[0], 0.7), 2);
    c.restore();
  }

  /* ================= BOOT ================= */
  States.boot = {
    t: 0,
    enter() { this.t = 0; },
    input() { if (I.mouse.clicked || I.pressed.size || I.pad.pressed.size) { A.init(); setState("title"); } },
    update(dt) { this.t += dt; },
    draw(c) {
      backdrop(c, 1 / 60, 0.45);
      logo(c, 260);
      D.text(c, "Real-time fleet command across the starlanes", W / 2, 370, 26, C.text, "center");
      if (Math.sin(this.t * 4) > -0.3) D.text(c, I.touch ? "Tap to start" : "Click or press any key", W / 2, 500, 28, C.accent, "center", { weight: 700 });
    },
  };

  /* ================= TITLE ================= */
  States.title = {
    btns: [],
    enter() {
      A.playSong("title");
      const x = W / 2 - 170;
      this.btns = [
        { x, y: 380, w: 340, h: 62, label: "Campaign", size: 28, act: () => setState("missions") },
        { x, y: 454, w: 340, h: 54, label: "Skirmish", act: () => setState("skirmish") },
        { x, y: 520, w: 340, h: 54, label: "Options", act: () => setState("options", { back: "title" }) },
        { x, y: 586, w: 340, h: 54, label: "How to play", act: () => setState("help", { back: "title" }) },
      ];
      focusFirst(this.btns);
    },
    input() { UI.runButtons(this.btns); },
    update() {},
    draw(c) {
      backdrop(c, 1 / 60, 0.5);
      logo(c, 220);
      UI.drawButtons(c, this.btns);
      D.text(c, "F fullscreen · M mute", W - 24, H - 22, 16, C.faint, "right");
      pointer(c);
    },
  };

  /* ================= CAMPAIGN ================= */
  States.missions = {
    btns: [],
    enter() {
      A.playSong("menu");
      const un = Prog.unlocked();
      this.btns = MISSIONS.map((m, i) => {
        const col = i % 2, row = Math.floor(i / 2);
        return { x: 150 + col * 500, y: 130 + row * 118, w: 480, h: 104, custom: true, idx: i, disabled: i > un, focusable: true,
          act: () => setState("briefing", { idx: i }) };
      });
      this.btns.push(backBtn("title"));
      focusFirst(this.btns);
    },
    input() { if (I.hit("back")) { A.sfx("menuBack"); setState("title"); return; } UI.runButtons(this.btns); },
    update() {},
    draw(c) {
      backdrop(c, 1 / 60, 0.7);
      heading(c, "CAMPAIGN");
      for (const b of this.btns) {
        if (!b.custom) continue;
        const m = MISSIONS[b.idx], hov = inR(I.mouse, b), best = Prog.best(m.id);
        const col = b.disabled ? C.faint : best ? C.ok : C.accent;
        D.chamfer(c, b.x, b.y, b.w, b.h, 14, hov && !b.disabled ? D.rgba(col, 0.14) : "rgba(8,16,28,0.88)", col, hov ? 2.2 : 1.5);
        D.text(c, String(b.idx + 1).padStart(2, "0"), b.x + 24, b.y + b.h / 2, 40, D.rgba(col, 0.8), "left", { weight: 700, font: D.LOGO });
        D.text(c, m.name, b.x + 100, b.y + 36, 28, b.disabled ? C.faint : C.text, "left", { weight: 700 });
        const sub = b.disabled ? "Locked" : best ? `Complete · best time ${SL.fmtT(best)}` : goalLine(m);
        D.text(c, sub, b.x + 100, b.y + 70, 18, b.disabled ? C.faint : best ? C.ok : C.dim);
      }
      UI.drawButtons(c, this.btns);
      pointer(c);
    },
  };
  function goalLine(m) {
    const g = m.goal;
    switch (g.type) {
      case "ownAll": return "Take every system";
      case "collect": return `Deliver ${g.n} supply`;
      case "hold": return `Hold a system for ${Math.round(g.time / 60)} minutes`;
      case "raze": return `Raze ${g.sys.length} systems`;
      case "capture": return `Capture ${g.sys.length} shipyards`;
      default: return "Defeat every enemy";
    }
  }

  /* ================= BRIEFING ================= */
  States.briefing = {
    btns: [], def: null,
    enter(arg) {
      this.idx = arg.idx;
      this.m = MISSIONS[arg.idx];
      this.def = SL.buildMission(this.m);
      // a preview needs the map in the simulation
      this.prev = G.start(this.def);
      this.def = SL.buildMission(this.m);
      this.btns = [
        { x: W - 290, y: H - 84, w: 260, h: 60, label: "Launch", size: 28, act: () => setState("play", { def: this.def, mission: this.m }) },
        backBtn("missions"),
      ];
      focusFirst(this.btns);
    },
    input() { if (I.hit("back")) { A.sfx("menuBack"); setState("missions"); return; } UI.runButtons(this.btns); },
    update() {},
    draw(c) {
      D.background(c, W, H, 0);
      // map preview on the left
      c.save(); c.translate(30, 90); c.scale(0.66, 0.66);
      SL.View.drawWorld(c, this.prev, { time: performance.now() / 1000, labels: true });
      c.restore();
      D.text(c, `OPERATION ${this.idx + 1}`, 40, 50, 18, C.accent, "left", { weight: 700, spacing: 3 });
      D.text(c, this.m.name.toUpperCase(), 40, 82, 34, C.text, "left", { weight: 700, font: D.LOGO, spacing: 3 });
      D.panel(c, 690, 40, 560, 560, { title: "BRIEFING" });
      let y = D.para(c, this.m.brief, 712, 90, 20, 520, C.text, 1.35);
      y += 110;
      D.text(c, "OBJECTIVE", 712, y, 16, C.accent, "left", { weight: 700, spacing: 2 });
      D.text(c, goalLine(this.m), 712, y + 28, 22, C.gold, "left", { weight: 700 });
      if (this.m.goal.keep) D.text(c, `Do not lose ${this.prev.sys[this.prev.def.keyIdx[this.m.goal.keep]].name}`, 712, y + 56, 19, C.warn);
      const foes = (this.def.players || 1) - 1;
      D.text(c, foes ? `Opposition: ${foes} command${foes > 1 ? "s" : ""}` : "No organised opposition", 712, y + 84, 18, C.dim);
      UI.drawButtons(c, this.btns);
      pointer(c);
    },
  };

  /* ================= SKIRMISH ================= */
  States.skirmish = {
    btns: [],
    enter() { A.playSong("menu"); this.build(); focusFirst(this.btns); },
    build() {
      const o = SL.lastSkirmish;
      const set = (k, v) => { o[k] = v; Store.set("skirmish", o); this.build(); };
      const B = [];
      const row = (y, key, vals, labels) => vals.forEach((v, i) => B.push({ x: 470 + i * 170, y, w: 160, h: 52, label: labels[i], on: o[key] === v, quiet: true, act: () => { A.sfx("tap"); set(key, v); } }));
      row(170, "players", [2, 3, 4], ["1 rival", "2 rivals", "3 rivals"]);
      row(260, "size", ["small", "medium", "large"], ["Small", "Medium", "Large"]);
      row(350, "level", ["easy", "normal", "hard"], ["Easy", "Normal", "Hard"]);
      B.push({ x: 470, y: 440, w: 330, h: 52, label: "New map", act: () => set("seed", (Math.random() * 1e6) | 0) });
      B.push({ x: W - 290, y: H - 84, w: 260, h: 60, label: "Launch", size: 28, act: () => setState("play", { def: SL.skirmish(o), mission: "skirmish" }) });
      B.push(backBtn("title"));
      this.btns = B;
      this.prev = null;
    },
    input() { if (I.hit("back")) { A.sfx("menuBack"); setState("title"); return; } UI.runButtons(this.btns); },
    update() {},
    draw(c) {
      backdrop(c, 1 / 60, 0.75);
      heading(c, "SKIRMISH");
      D.text(c, "Opponents", 440, 196, 24, C.text, "right", { weight: 700 });
      D.text(c, "Sector size", 440, 286, 24, C.text, "right", { weight: 700 });
      D.text(c, "Difficulty", 440, 376, 24, C.text, "right", { weight: 700 });
      D.text(c, `Map ${SL.lastSkirmish.seed}`, 820, 466, 20, C.dim);
      D.para(c, "Every command starts with a shipyard and a small fleet. The last one standing wins. Hard commanders think faster and run a richer economy.", 300, 540, 20, 680, C.dim);
      UI.drawButtons(c, this.btns);
      pointer(c);
    },
  };

  /* ================= RESULTS ================= */
  States.results = {
    btns: [],
    enter(arg) {
      const s = G.s, win = s.over.win, mission = arg.mission;
      this.win = win; this.s = s; this.mission = mission; this.record = false;
      A.playSong("debrief");
      const B = [];
      if (mission !== "skirmish") {
        const idx = MISSIONS.indexOf(mission);
        if (win) {
          this.record = Prog.setBest(mission.id, s.t);
          if (idx + 1 < MISSIONS.length) { const was = Prog.unlocked(); Prog.unlock(idx + 1); this.unlocked = Prog.unlocked() > was; }
        }
        if (win && idx + 1 < MISSIONS.length) B.push({ x: W / 2 - 170, y: 520, w: 340, h: 60, label: "Next operation", size: 26, act: () => setState("briefing", { idx: idx + 1 }) });
        B.push({ x: W / 2 - 170, y: win && idx + 1 < MISSIONS.length ? 592 : 520, w: 340, h: 54, label: win ? "Play again" : "Try again", act: () => setState("play", { def: SL.buildMission(mission), mission }) });
        B.push({ x: 30, y: H - 76, w: 200, h: 52, label: "Campaign", back: true, act: () => setState("missions") });
      } else {
        B.push({ x: W / 2 - 170, y: 520, w: 340, h: 60, label: "Play again", size: 26, act: () => setState("play", { def: SL.skirmish(SL.lastSkirmish), mission: "skirmish" }) });
        B.push({ x: W / 2 - 170, y: 592, w: 340, h: 54, label: "New map", act: () => { SL.lastSkirmish.seed = (Math.random() * 1e6) | 0; Store.set("skirmish", SL.lastSkirmish); setState("skirmish"); } });
        B.push({ x: 30, y: H - 76, w: 200, h: 52, label: "Title", back: true, act: () => setState("title") });
      }
      this.btns = B;
      if (this.unlocked) setTimeout(() => A.sfx("capture"), 600);
      focusFirst(this.btns);
    },
    input() { UI.runButtons(this.btns); },
    update() {},
    draw(c) {
      D.background(c, W, H, 0);
      const s = this.s, st = s.stats;
      D.text(c, this.win ? "OPERATION COMPLETE" : "OPERATION FAILED", W / 2, 90, 44, this.win ? C.ok : C.warn, "center", { weight: 700, font: D.LOGO, glow: this.win ? C.ok : C.warn, blur: 16 });
      D.text(c, s.def.name + " · " + s.over.why, W / 2, 140, 22, C.text, "center");
      D.panel(c, W / 2 - 320, 180, 640, 300, { title: "AFTER-ACTION REPORT" });
      const rows = [
        ["Time", SL.fmtT(s.over.t) + (this.record ? "   new best" : "")],
        ["Ships built", st.built], ["Ships lost", st.lost], ["Enemy ships destroyed", st.killed],
        ["Systems captured", st.captured], ["Systems razed", st.razed], ["Supply delivered", st.delivered],
      ];
      rows.forEach(([k, v], i) => {
        D.text(c, k, W / 2 - 290, 238 + i * 34, 21, C.dim);
        D.text(c, String(v), W / 2 + 290, 238 + i * 34, 21, i === 0 && this.record ? C.gold : C.text, "right", { weight: 700 });
      });
      if (this.unlocked) D.text(c, "Next operation unlocked", W / 2, 500, 20, C.gold, "center", { weight: 700 });
      UI.drawButtons(c, this.btns);
      pointer(c);
    },
  };

  /* ================= OPTIONS ================= */
  States.options = {
    btns: [], drag: null,
    enter(arg) {
      this.back = (arg && arg.back) || "title";
      this.build();
      focusFirst(this.btns);
    },
    build() {
      const M = SL.Main;
      this.btns = [
        { x: 440, y: 150, w: 400, h: 40, custom: true, id: "music", focusable: true },
        { x: 440, y: 230, w: 400, h: 40, custom: true, id: "sfx", focusable: true },
        { x: 440, y: 290, w: 400, h: 52, label: "Voice announcements: " + (A.voiceOn ? "on" : "off"), act: () => { A.setVoice(!A.voiceOn); this.build(); } },
        { x: 440, y: 354, w: 400, h: 52, label: "Keep screen awake: " + (M.keepAwake ? "on" : "off"), act: () => { M.keepAwake = !M.keepAwake; Store.set("keepAwake", M.keepAwake); this.build(); } },
        { x: 440, y: 418, w: 400, h: 52, label: "Fullscreen", act: () => M.toggleFullscreen() },
        { x: 440, y: 482, w: 400, h: 52, label: this.confirm ? "Really reset the campaign?" : "Reset campaign progress", color: C.warn,
          act: () => { if (this.confirm) { Store.set("unlocked", 0); for (const m of MISSIONS) Store.set("best-" + m.id, 0); this.confirm = false; } else this.confirm = true; this.build(); } },
        { x: 30, y: H - 76, w: 170, h: 52, label: "Back", back: true, act: () => this.leave() },
      ];
    },
    leave() {
      this.confirm = false;
      if (this.back === "play") { setState("play"); SL.States.play.buildMenu(); } else setState(this.back);
    },
    input(dt) {
      if (I.hit("back")) { A.sfx("menuBack"); this.leave(); return; }
      const m = I.mouse;
      for (const b of this.btns) {
        if (!b.custom) continue;
        const hov = inR(m, b);
        const val = b.id === "music" ? A.musicVol : A.sfxVol;
        const set = (v) => { v = U.clamp(Math.round(v * 20) / 20, 0, 1); if (b.id === "music") A.setMusicVol(v); else { A.setSfxVol(v); A.sfx("tap"); } };
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
      backdrop(c, 1 / 60, 0.8);
      heading(c, "OPTIONS");
      for (const b of this.btns) if (b.custom) D.slider(c, b.x, b.y + 10, b.w, b.id === "music" ? A.musicVol : A.sfxVol, b.id === "music" ? "Music" : "Sound effects", inR(I.mouse, b));
      UI.drawButtons(c, this.btns.filter((b) => !b.custom));
      pointer(c);
    },
  };

  /* ================= HELP ================= */
  const PAGES = [
    { title: "The sector", text: "Systems are linked by starlanes. Fleets and supply only travel along lanes.\n\nShipyards build ships. Mining colonies send supply to the nearest shipyard you can reach through your own systems. Repair docks mend your ships. Outposts are stepping stones.\n\nEvery system has a garrison – the ring inside its border. It recovers while no enemy is in orbit.", demo: "sys" },
    { title: "Three kinds of fleets", text: "Battle fleets (stripe at the tip) destroy other fleets.\n\nSiege fleets (stripe across the middle) break shields and battle stations, and can raze a system for good.\n\nInvasion fleets (stripe at the base) fight the garrison. When it is gone and no defences or enemy ships are left, they land and the system is yours.", demo: "fleet" },
    { title: "Orders", text: "Drag from a system with your fleets to any other system – the route is shown before you let go. Or select a system, press Send and pick the target. Right click sends the selection too.\n\nTap a fleet type in the panel to leave it behind. ½ sends half of each fleet.\n\nOrders are final: a fleet only stops where it was sent – or where enemy ships or a station block the lane.", demo: "order" },
    { title: "Supply and defences", text: "Your supply sits at the top of the panel. Each shipyard builds the fleet type you choose as long as supply lasts, and adds a little supply on its own.\n\nShields absorb fire and recharge. Battle stations shoot at enemy fleets and stop fleets from passing.\n\nEnemy fleets in a system seize every convoy that passes through it.", demo: "def" },
    { title: "Controls", text: "Mouse: click to select, drag to send, right click sends the selection.\nTouch: tap and drag, or use Send.\nKeyboard: Space pause, + and − change speed, S send, H half, Tab next fleet, arrows move between systems, Enter selects, Esc menu.\nGamepad: stick moves the cursor, A selects, X sends, Y next fleet, LB and RB change speed, Start opens the menu.", demo: null },
  ];
  States.help = {
    btns: [], page: 0,
    enter(arg) { this.back = (arg && arg.back) || "title"; this.page = 0; this.build(); focusFirst(this.btns); },
    build() {
      this.btns = [
        { x: W / 2 - 230, y: H - 90, w: 200, h: 54, label: "Previous", disabled: this.page === 0, act: () => { this.page--; this.build(); } },
        { x: W / 2 + 30, y: H - 90, w: 200, h: 54, label: this.page === PAGES.length - 1 ? "Done" : "Next", act: () => { if (this.page < PAGES.length - 1) { this.page++; this.build(); } else this.leave(); } },
        { x: 30, y: H - 90, w: 170, h: 54, label: "Back", back: true, act: () => this.leave() },
      ];
    },
    leave() { if (this.back === "play") { setState("play"); SL.States.play.buildMenu(); } else setState(this.back); },
    input() {
      if (I.hit("back")) { A.sfx("menuBack"); this.leave(); return; }
      if (I.hit("right") && this.page < PAGES.length - 1 && I.lastDevice === "keyboard") { this.page++; this.build(); }
      UI.runButtons(this.btns);
    },
    update(dt) { this.t = (this.t || 0) + dt; },
    draw(c) {
      D.background(c, W, H, this.t || 0);
      heading(c, "HOW TO PLAY");
      const p = PAGES[this.page];
      D.panel(c, 120, 120, 1040, 470, { title: `${this.page + 1} / ${PAGES.length}   ${p.title.toUpperCase()}` });
      D.para(c, p.text, 150, 180, 22, p.demo ? 560 : 960, C.text, 1.35);
      if (p.demo) drawHelpDemo(c, p.demo, 900, 360, this.t || 0);
      UI.drawButtons(c, this.btns);
      pointer(c);
    },
  };
  function drawHelpDemo(c, kind, x, y, t) {
    const col = D.OWNER[0], red = D.OWNER[1];
    if (kind === "sys") {
      const items = [["ind", "Shipyard"], ["res", "Mining colony"], ["rep", "Repair dock"], ["out", "Outpost"]];
      items.forEach(([ty, nm], i) => {
        const yy = y - 150 + i * 90, r = SL.RAD[ty];
        D.circle(c, x, yy, r, "rgba(6,14,26,0.95)", col, 3);
        D.sysIcon(c, ty, x, yy, r, col);
        D.arc(c, x, yy, r + 4, -Math.PI / 2, -Math.PI / 2 + U.TAU * 0.7, D.rgba(col, 0.75), 2);
        D.text(c, nm, x + 50, yy, 22, C.text, "left", { weight: 700 });
      });
    } else if (kind === "fleet") {
      [["B", "Battle"], ["S", "Siege"], ["I", "Invasion"]].forEach(([ty, nm], i) => {
        const yy = y - 110 + i * 100;
        D.fleet(c, x, yy, 26, -Math.PI / 2, ty, col, { lw: 3 });
        D.text(c, nm, x + 50, yy, 24, C.text, "left", { weight: 700 });
      });
    } else if (kind === "order") {
      const a = { x: x - 110, y: y + 60 }, b = { x: x + 120, y: y - 80 };
      D.line(c, a.x, a.y, b.x, b.y, C.lane, 2);
      c.save(); c.setLineDash([8, 6]); c.lineDashOffset = -t * 30; D.line(c, a.x, a.y, b.x, b.y, col, 3); c.restore();
      D.circle(c, a.x, a.y, 22, "rgba(6,14,26,0.95)", col, 3); D.sysIcon(c, "ind", a.x, a.y, 22, col);
      D.circle(c, b.x, b.y, 15, "rgba(6,14,26,0.95)", C.neutral, 2); D.sysIcon(c, "out", b.x, b.y, 15, "#b8c4d2");
      const k = (t * 0.35) % 1;
      D.fleet(c, a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k, 10, Math.atan2(b.y - a.y, b.x - a.x), "I", col);
    } else if (kind === "def") {
      D.circle(c, x, y, 22, "rgba(6,14,26,0.95)", col, 3); D.sysIcon(c, "ind", x, y, 22, col);
      c.save(); c.setLineDash([10, 6]); c.lineDashOffset = t * 20; D.circle(c, x, y, 30, null, "rgba(159,232,255,0.8)", 2); c.restore();
      const a = t * 0.9;
      D.circle(c, x + Math.cos(a) * 31, y + Math.sin(a) * 31, 4.5, "#081322", col, 2);
      D.fleet(c, x + 110, y - 40, 10, Math.PI, "B", red);
      if (Math.sin(t * 9) > 0) D.line(c, x + Math.cos(a) * 31, y + Math.sin(a) * 31, x + 110, y - 40, col, 1.5);
      D.text(c, "Shield", x - 120, y - 60, 20, "#9fe8ff", "left", { weight: 700 });
      D.text(c, "Station", x - 120, y + 70, 20, col, "left", { weight: 700 });
    }
  }
})(window.SL);
