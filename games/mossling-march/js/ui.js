/* Mossling March: screens – title, level choice, level intro, results, options, help */
"use strict";

(function (ML) {
  const { U, D, G, T, Store } = ML;
  const A = ML.Audio, I = ML.Input, S = ML.Sprites;
  const W = U.W, H = U.H, C = D.C;
  const States = (ML.States = {});
  let setState = null;
  const UI = (ML.UI = { bind(fn) { setState = fn; } });
  const inR = (m, b) => m.x >= b.x && m.x <= b.x + b.w && m.y >= b.y && m.y <= b.y + b.h;
  const RATINGS = (ML.RATINGS = [
    { name: "Sprout", theme: "meadow" }, { name: "Sapling", theme: "forest" },
    { name: "Timber", theme: "caves" }, { name: "Ancient", theme: "frost" },
  ]);
  const PER = 5;

  /* ---------- progress ---------- */
  const Prog = (ML.Prog = {
    unlocked() { return Store.get("unlocked", 0); },
    unlock(i) { if (i > Prog.unlocked()) Store.set("unlocked", Math.min(ML.LEVELS.length - 1, i)); },
    best(i) { return Store.get("best-" + i, -1); },
    setBest(i, pct) { if (pct > Prog.best(i)) { Store.set("best-" + i, pct); return true; } return false; },
  });

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
  UI.drawButtons = function (c, btns) { for (const b of btns) if (!b.custom) D.button(c, b, inR(I.mouse, b), { disabled: b.disabled, on: b.on, color: b.color, dark: b.dark, size: b.size }); };
  function focusFirst(btns) {
    if (I.lastDevice === "mouse" || !btns.length) return;
    const b = btns.find((x) => !x.disabled) || btns[0];
    I.mouse.x = b.x + b.w / 2; I.mouse.y = b.y + b.h / 2;
  }
  function pointer(c) { if (I.showCursor()) D.hand(c, I.mouse.x, I.mouse.y); }
  function backBtn(to, arg) { return { x: 24, y: H - 80, w: 170, h: 58, label: "Back", back: true, color: "#c0703a", dark: "#8a4a22", act: () => setState(to, arg) }; }
  function heading(c, s, y = 64, size = 52) { D.text(c, s, W / 2, y, size, C.cream, "center", { weight: 700, lw: 10 }); }

  /* ---------- a meadow with wandering mosslings behind the menus ---------- */
  const demoLevel = {
    name: "demo", theme: "meadow", w: 440, count: 40, need: 0, rate: 70, time: 9999, seed: 5, skills: {},
    entrance: { x: 60, y: 60 }, exit: { x: -100, y: 0 },
    ops: [["hill", 0, 439, 150, 6, 0], ["ell", 330, 152, 40, 22], ["rect", 0, 40, 6, 140], ["rect", 434, 40, 6, 140]],
  };
  const demo = (UI.demo = { s: null, t: 0, acc: 0 });
  function demoTick(dt) {
    if (!demo.s || G.s !== demo.s || demo.t > 70) {
      G.on = null;
      demo.s = G.start(demoLevel);
      demo.t = 0;
      for (const k of G.SKILLS) demo.s.skills[k] = 99;
    }
    demo.t += dt; demo.acc += dt;
    while (demo.acc >= G.TICK) {
      demo.acc -= G.TICK;
      G.update();
      // now and then a mossling picks up a job
      if (Math.random() < 0.012) {
        const m = U.pick(demo.s.ms.filter((q) => q.st === "walk"));
        if (m) G.assign(m, U.pick(["build", "build", "bash", "dig", "mine", "climb", "float"]));
      }
    }
  }
  function backdrop(c, dt, dark = 0.25) {
    demoTick(dt);
    c.save(); c.scale(1, H / 540);
    ML.View.drawWorld(c, demo.s, 0, demo.t);
    c.restore();
    c.fillStyle = `rgba(30,16,6,${dark})`; c.fillRect(0, 0, W, H);
  }
  UI.backdrop = backdrop;
  function logo(c, y) {
    const t = performance.now() / 1000;
    const word = "MOSSLING";
    let x = W / 2 - 300;
    for (let i = 0; i < word.length; i++) {
      const yy = y + Math.sin(t * 3 + i * 0.6) * 6;
      D.text(c, word[i], x + i * 75, yy, 104, i % 2 ? "#ffb24a" : "#ff9a3a", "center", { weight: 700, lw: 16, oc: "#3a2210" });
    }
    D.text(c, "MARCH", W / 2, y + 92, 72, C.leafL, "center", { weight: 700, lw: 14, oc: "#2a4a14" });
  }

  /* ================= BOOT ================= */
  States.boot = {
    t: 0,
    enter() { this.t = 0; },
    input() { if (I.mouse.clicked || I.pressed.size || I.pad.pressed.size) { A.init(); setState("title"); } },
    update(dt) { this.t += dt; },
    draw(c) {
      backdrop(c, 1 / 60, 0.15);
      logo(c, 200);
      D.text(c, "Guide the mosslings home", W / 2, 380, 32, C.cream, "center", { weight: 600, lw: 6 });
      if (Math.sin(this.t * 4) > -0.3) D.text(c, I.touch ? "Tap to start" : "Click or press any key", W / 2, 470, 34, C.gold, "center", { weight: 700, lw: 7 });
    },
  };

  /* ================= TITLE ================= */
  States.title = {
    btns: [],
    enter() {
      A.playSong("title");
      const x = W / 2 - 170;
      this.btns = [
        { x, y: 360, w: 340, h: 70, label: "Play", size: 36, act: () => setState("levels", { rating: Math.floor(Prog.unlocked() / PER) }) },
        { x, y: 444, w: 340, h: 60, label: "Options", act: () => setState("options", { back: "title" }) },
        { x, y: 518, w: 340, h: 60, label: "How to play", color: "#c0703a", dark: "#8a4a22", act: () => setState("help", { back: "title" }) },
      ];
      focusFirst(this.btns);
    },
    input() { UI.runButtons(this.btns); },
    update() {},
    draw(c) {
      backdrop(c, 1 / 60, 0.2);
      logo(c, 150);
      UI.drawButtons(c, this.btns);
      D.text(c, "F fullscreen · M mute", W - 20, H - 20, 18, C.cream, "right", { weight: 600, lw: 4 });
      pointer(c);
    },
  };

  /* ================= LEVEL CHOICE ================= */
  States.levels = {
    btns: [], rating: 0,
    enter(arg) { A.playSong("select"); this.rating = U.clamp(arg && arg.rating !== undefined ? arg.rating : this.rating, 0, RATINGS.length - 1); this.build(); focusFirst(this.btns.filter((b) => b.lvl !== undefined)); },
    build() {
      const un = Prog.unlocked(), B = [];
      RATINGS.forEach((r, i) => B.push({ x: 160 + i * 245, y: 120, w: 225, h: 56, label: r.name, on: i === this.rating, act: () => { this.rating = i; this.build(); } }));
      for (let k = 0; k < PER; k++) {
        const idx = this.rating * PER + k;
        if (idx >= ML.LEVELS.length) break;
        B.push({ x: 200, y: 200 + k * 84, w: 880, h: 72, custom: true, lvl: idx, disabled: idx > un, focusable: true, act: () => setState("intro", { idx }) });
      }
      B.push(backBtn("title"));
      this.btns = B;
    },
    input() {
      if (I.hit("back")) { A.sfx("menuBack"); setState("title"); return; }
      UI.runButtons(this.btns);
    },
    update() {},
    draw(c) {
      backdrop(c, 1 / 60, 0.55);
      heading(c, "Choose a level");
      for (const b of this.btns) {
        if (!b.custom) continue;
        const lv = ML.LEVELS[b.lvl], hov = inR(I.mouse, b), best = Prog.best(b.lvl);
        D.rr(c, b.x, b.y, b.w, b.h, 14, b.disabled ? "rgba(60,40,24,0.85)" : hov ? "#9a6a3e" : C.wood, hov && !b.disabled ? C.gold : C.ink, 3);
        D.text(c, String(b.lvl + 1), b.x + 44, b.y + b.h / 2, 34, b.disabled ? C.faint : C.gold, "center", { weight: 700, lw: 6 });
        D.text(c, b.disabled ? "Locked" : lv.name, b.x + 90, b.y + b.h / 2, 30, b.disabled ? C.faint : C.cream, "left", { weight: 700, lw: 6 });
        if (!b.disabled) {
          const pct = Math.round((lv.need * 100) / lv.count);
          D.text(c, best >= 0 ? `best ${best}% · need ${pct}%` : `need ${pct}%`, b.x + b.w - 24, b.y + b.h / 2, 22, best >= pct ? C.leafL : C.dim, "right", { weight: 600, lw: 5 });
        }
      }
      UI.drawButtons(c, this.btns);
      pointer(c);
    },
  };

  /* ================= LEVEL INTRO ================= */
  States.intro = {
    btns: [],
    enter(arg) {
      this.idx = arg.idx;
      this.lv = ML.LEVELS[arg.idx];
      this.prev = G.start(this.lv);
      A.playSong("select");
      this.btns = [
        { x: W - 300, y: H - 86, w: 270, h: 66, label: "Let's go", size: 32, act: () => setState("play", { idx: this.idx }) },
        backBtn("levels", { rating: Math.floor(arg.idx / PER) }),
      ];
      focusFirst(this.btns);
    },
    input() {
      if (I.hit("back")) { A.sfx("menuBack"); setState("levels", { rating: Math.floor(this.idx / PER) }); return; }
      if (I.hit("pause")) { setState("play", { idx: this.idx }); return; }
      UI.runButtons(this.btns);
    },
    update() {},
    draw(c) {
      const lv = this.lv, s = this.prev;
      c.fillStyle = "#2a180a"; c.fillRect(0, 0, W, H);
      // the whole level as a picture
      const sc = Math.min(1180 / lv.w, 2);
      const pw = lv.w * sc, ph = T.H * sc, px = (W - pw) / 2;
      c.save(); c.beginPath(); c.rect(px, 24, pw, ph); c.clip();
      c.translate(px, 24); c.scale(sc / 3, sc / 3);
      ML.View.drawWorld(c, s, 0, performance.now() / 1000, { whole: true });
      c.restore();
      D.rr(c, px - 3, 21, pw + 6, ph + 6, 6, null, C.ink, 4);
      const y0 = 24 + ph + 30;
      D.text(c, `Level ${this.idx + 1} · ${RATINGS[Math.floor(this.idx / PER)].name}`, W / 2, y0, 24, C.dim, "center", { weight: 600, lw: 5 });
      D.text(c, lv.name, W / 2, y0 + 44, 50, C.cream, "center", { weight: 700, lw: 9 });
      const pct = Math.round((lv.need * 100) / lv.count);
      D.text(c, `${lv.count} mosslings · bring home ${pct}% · release rate ${lv.rate} · time ${Math.floor(lv.time / 60)}:${String(lv.time % 60).padStart(2, "0")}`, W / 2, y0 + 96, 26, C.cream, "center", { weight: 600, lw: 5 });
      // skills on offer
      const list = G.SKILLS.filter((k) => lv.skills[k]);
      let x = W / 2 - (list.length * 120) / 2 + 60;
      for (const k of list) {
        D.text(c, `${ML.SKILL_NAME[k]} ${lv.skills[k]}`, x, y0 + 140, 22, C.gold, "center", { weight: 700, lw: 5 });
        x += 120;
      }
      if (lv.tip && this.idx < 10) D.text(c, lv.tip, W / 2, y0 + 180, 20, C.dim, "center", { weight: 500, lw: 4 });
      UI.drawButtons(c, this.btns);
      pointer(c);
    },
  };

  /* ================= RESULTS ================= */
  States.results = {
    btns: [],
    enter(arg) {
      const s = G.s, lv = s.lv;
      this.idx = arg.idx; this.s = s;
      const pct = Math.floor((s.saved * 100) / lv.count), need = Math.round((lv.need * 100) / lv.count);
      this.pct = pct; this.needPct = need; this.win = s.saved >= lv.need && !s.over.gaveUp;
      this.record = Prog.setBest(arg.idx, pct);
      this.unlocked = false;
      if (this.win) {
        const was = Prog.unlocked();
        Prog.unlock(arg.idx + 1);
        this.unlocked = Prog.unlocked() > was;
        A.jingle("win");
        A.say(pct === 100 ? "Everyone made it!" : "Well done!", { gap: 0, pitch: 1.3 });
      } else { A.jingle("fail"); A.say("Let's try that again", { gap: 0, pitch: 1.2 }); }
      setTimeout(() => { if (ML.Main.state === "results") A.playSong("results"); }, 2600);
      const last = arg.idx + 1 >= ML.LEVELS.length;
      this.btns = [];
      if (this.win && !last) this.btns.push({ x: W / 2 - 170, y: 450, w: 340, h: 66, label: "Next level", size: 32, act: () => setState("intro", { idx: arg.idx + 1 }) });
      this.btns.push({ x: W / 2 - 170, y: this.win && !last ? 530 : 450, w: 340, h: 60, label: "Try again", color: this.win ? "#c0703a" : C.leaf, dark: this.win ? "#8a4a22" : C.leafD, act: () => setState("intro", { idx: arg.idx }) });
      this.btns.push(backBtn("levels", { rating: Math.floor(arg.idx / PER) }));
      focusFirst(this.btns);
    },
    input() { UI.runButtons(this.btns); },
    update() {},
    draw(c) {
      backdrop(c, 1 / 60, 0.5);
      D.board(c, W / 2 - 330, 70, 660, 350);
      const lv = this.s.lv;
      D.text(c, this.win ? (this.pct === 100 ? "Everyone made it!" : "Well done!") : this.s.over.gaveUp ? "You gave up" : "Not quite…", W / 2, 120, 46, this.win ? C.gold : C.cream, "center", { weight: 700, lw: 9 });
      D.text(c, lv.name, W / 2, 172, 26, C.dim, "center", { weight: 600, lw: 5 });
      D.text(c, `You brought home ${this.pct}%`, W / 2, 238, 34, C.cream, "center", { weight: 700, lw: 7 });
      D.text(c, `You needed ${this.needPct}%`, W / 2, 284, 28, C.dim, "center", { weight: 600, lw: 6 });
      if (this.record && this.pct > 0) D.text(c, "New best for this level", W / 2, 336, 24, C.leafL, "center", { weight: 700, lw: 5 });
      if (this.unlocked) D.text(c, "Next level unlocked", W / 2, 376, 24, C.gold, "center", { weight: 700, lw: 5 });
      if (this.win && this.idx + 1 >= ML.LEVELS.length) D.text(c, "You have finished every level!", W / 2, 376, 26, C.gold, "center", { weight: 700, lw: 5 });
      UI.drawButtons(c, this.btns);
      pointer(c);
    },
  };

  /* ================= OPTIONS ================= */
  States.options = {
    btns: [], drag: null,
    enter(arg) { this.back = (arg && arg.back) || "title"; this.build(); focusFirst(this.btns); },
    build() {
      const M = ML.Main;
      this.btns = [
        { x: 420, y: 160, w: 440, h: 40, custom: true, id: "music", focusable: true },
        { x: 420, y: 250, w: 440, h: 40, custom: true, id: "sfx", focusable: true },
        { x: 420, y: 310, w: 440, h: 58, label: "Voices: " + (A.voiceOn ? "on" : "off"), act: () => { A.setVoice(!A.voiceOn); this.build(); } },
        { x: 420, y: 380, w: 440, h: 58, label: "Keep screen awake: " + (M.keepAwake ? "on" : "off"), act: () => { M.keepAwake = !M.keepAwake; Store.set("keepAwake", M.keepAwake); this.build(); } },
        { x: 420, y: 450, w: 440, h: 58, label: "Fullscreen", act: () => M.toggleFullscreen() },
        { x: 420, y: 520, w: 440, h: 58, label: this.confirm ? "Really reset progress?" : "Reset progress", color: C.red, dark: "#a83a22",
          act: () => { if (this.confirm) { Store.set("unlocked", 0); for (let i = 0; i < ML.LEVELS.length; i++) Store.set("best-" + i, -1); this.confirm = false; } else this.confirm = true; this.build(); } },
        { x: 24, y: H - 80, w: 170, h: 58, label: "Back", back: true, color: "#c0703a", dark: "#8a4a22", act: () => this.leave() },
      ];
    },
    leave() { this.confirm = false; if (this.back === "play") { setState("play"); ML.States.play.buildMenu(); } else setState(this.back); },
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
    { title: "Bring them home", text: "Mosslings drop out of the hollow log and walk straight on – over cliffs, into water, into trouble. They turn around at walls.\n\nGive them jobs so that enough of them reach the round door. Each level tells you how many you need and which jobs you have.\n\nA fall from great height is fatal, unless the mossling is a floater.", poses: [["walk", 0], ["fall", 0], ["exit", 1]] },
    { title: "Jobs for life", text: "Climber – scales any wall it walks into.\nFloater – opens a leaf and glides down safely.\nBomber – counts down from five and blasts a hole.\nBlocker – stands still and turns everyone else around.\n\nClimber and floater stay with a mossling for good, and a mossling can be both.", poses: [["climb", 1], ["float", 0], ["block", 0]] },
    { title: "Jobs with tools", text: "Builder – lays a bridge of twelve bricks, rising like a stairway.\nBasher – tunnels straight ahead.\nMiner – digs diagonally down.\nDigger – digs straight down.\n\nNobody gets through steel. Stone with arrows only gives way in the direction of the arrows.", poses: [["build", 0], ["bash", 1], ["mine", 1], ["dig", 1]] },
    { title: "Controls", text: "Pick a job at the bottom (or keys 1–8, Q and E), then click a mossling.\nThe release rate buttons send them out faster. Pause with Space, fast forward with X. The bomb button blows up everyone – click it twice.\nScroll with the screen edges, A and D, the arrow keys or the map. On touch screens tap to give a job and drag to scroll.\nGamepad: stick moves the cursor, A gives the job, LB/RB change it, LT/RT the rate, X fast, Y pause, D-pad or right stick scroll.", poses: null },
  ];
  States.help = {
    btns: [], page: 0, t: 0,
    enter(arg) { this.back = (arg && arg.back) || "title"; this.page = 0; this.build(); focusFirst(this.btns); },
    build() {
      this.btns = [
        { x: W / 2 - 230, y: H - 92, w: 200, h: 60, label: "Previous", disabled: this.page === 0, act: () => { this.page--; this.build(); } },
        { x: W / 2 + 30, y: H - 92, w: 200, h: 60, label: this.page === PAGES.length - 1 ? "Done" : "Next", act: () => { if (this.page < PAGES.length - 1) { this.page++; this.build(); } else this.leave(); } },
        { x: 24, y: H - 92, w: 170, h: 60, label: "Back", back: true, color: "#c0703a", dark: "#8a4a22", act: () => this.leave() },
      ];
    },
    leave() { if (this.back === "play") { setState("play"); ML.States.play.buildMenu(); } else setState(this.back); },
    input() { if (I.hit("back")) { A.sfx("menuBack"); this.leave(); return; } UI.runButtons(this.btns); },
    update(dt) { this.t += dt; },
    draw(c) {
      backdrop(c, 1 / 60, 0.6);
      const p = PAGES[this.page];
      D.board(c, 110, 40, 1060, 560, { title: `${p.title}  (${this.page + 1}/${PAGES.length})` });
      D.para(c, p.text, 150, 100, 25, p.poses ? 660 : 980, C.cream, 1.35, 600);
      if (p.poses) {
        c.save(); c.imageSmoothingEnabled = true;
        p.poses.forEach(([pose, f], i) => {
          const cv = S.frame(pose, f + Math.floor(this.t * 4), 1);
          const sz = 6, y = 190 + i * 110;
          c.drawImage(cv, 980 - (S.AX + 0.5) * sz, y - (S.AY + 1) * sz, S.SZ * sz, S.SZ * sz);
        });
        c.restore();
      }
      UI.drawButtons(c, this.btns);
      pointer(c);
    },
  };
})(window.ML);
