/* Feather Frenzy: screens – title, level choice, round, pause, results, high scores, name entry, options, help */
"use strict";

(function (FF) {
  const { U, D, G, Store } = FF;
  const A = FF.Audio, I = FF.Input, S = FF.Sprites;
  const W = U.W, H = U.H;
  const LEVELS = FF.LEVELS;
  const States = (FF.States = {});
  let setState = null;
  FF.UI = { bind(fn) { setState = fn; } };
  const inR = (m, b) => m.x >= b.x && m.x <= b.x + b.w && m.y >= b.y && m.y <= b.y + b.h;

  /* ---------- progress ---------- */
  const Prog = (FF.Prog = {
    unlocked() { return Store.get("unlocked", 0); },
    unlock(i) { if (i > Prog.unlocked()) Store.set("unlocked", Math.min(LEVELS.length - 1, i)); },
    best(id) { const l = HS.list(id); return l.length ? l[0].score : Store.get("best-" + id, 0); },
    setBest(id, v) { if (v > Store.get("best-" + id, 0)) Store.set("best-" + id, v); },
  });
  const HS = (FF.HS = {
    list(id) { return Store.get("hs-" + id, []); },
    rank(id, v) { if (v <= 0) return -1; const l = HS.list(id); const i = l.findIndex((e) => v > e.score); return i >= 0 ? i : l.length < 10 ? l.length : -1; },
    add(id, name, score) { const l = HS.list(id); const e = { name, score, date: new Date().toISOString().slice(0, 10) }; l.push(e); l.sort((a, b) => b.score - a.score); l.length = Math.min(l.length, 10); Store.set("hs-" + id, l); return l.indexOf(e); },
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
  function runButtons(btns) {
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
  }
  function drawButtons(c, btns) { for (const b of btns) if (!b.custom) D.button(c, b, inR(I.mouse, b), { disabled: b.disabled, color: b.color, size: b.size }); }
  function focusFirst(btns) {
    if (I.lastDevice === "mouse" || !btns.length) return;
    const b = btns.find((x) => !x.disabled) || btns[0];
    I.mouse.x = b.x + b.w / 2; I.mouse.y = b.y + b.h / 2;
  }
  function pointer(c) { if (I.showCursor()) D.hand(c, I.mouse.x, I.mouse.y); }
  function backBtn(to, arg) { return { x: 20, y: H - 74, w: 170, h: 56, label: "Back", back: true, color: "#7b2b25", act: () => setState(to, arg) }; }
  function title(c, s, y, size = 60) { D.text(c, s, W / 2, y, size, "#fff6dc", "center", { lw: size * 0.18 }); }

  /* ---------- the moor as a living backdrop for the menus ---------- */
  const deco = (FF.UI.deco = { t: 0, birds: [] });
  // static props (windmill, scarecrow, covers …) of a level drawn at a camera position
  function drawProps(c, L, l, cam, t) {
    for (const p of L.props) {
      if (p.layer !== l || p.kind === "critter") continue;
      c.save(); c.translate(-cam * FF.PAR[l], 0);
      if (p.ps) { c.translate(p.x, p.y); c.scale(p.ps, p.ps); c.translate(-p.x, -p.y); }
      const q = Object.assign({ ang: t * 0.6 }, p);
      if (p.kind === "peek") FF.COVER[p.cover](c, q);
      else if (p.kind === "bonus") FF.BONUS_DRAW[p.type](c, q, t);
      else if (p.kind === "flush") FF.FLUSH_DRAW[p.type](c, q, t);
      c.restore();
    }
  }
  function backdrop(c, dt, dark = 0.3) {
    const L = LEVELS[0];
    const pics = G.layers(L);
    deco.t += dt || 0;
    const cam = FF.RANGE / 2 + Math.sin(deco.t * 0.05) * 900;
    L.sky(c, deco.t, cam);
    if (dt && deco.birds.length < 6 && Math.random() < dt * 0.8) {
      const l = U.randi(0, 2), dir = U.pick([-1, 1]);
      deco.birds.push({ l, x: dir > 0 ? -80 : W + 80, y: U.rand(90, 360), dir, v: [50, 90, 140][l] * U.rand(0.9, 1.2), t: U.rand(9) });
    }
    for (let l = 0; l < 3; l++) {
      c.drawImage(pics[l], Math.round(cam * FF.PAR[l]), 0, W, H, 0, 0, W, H);
      drawProps(c, L, l, cam, deco.t);
      for (const b of deco.birds) {
        if (b.l !== l) continue;
        if (dt) { b.x += b.dir * b.v * dt; b.t += dt; }
        c.save(); c.translate(b.x, b.y + Math.sin(b.t * 1.5) * 12); c.scale(FF.SCALE[l] * b.dir, FF.SCALE[l]); S.grouse(c, { t: b.t, pose: "fly", skin: "brown" }); c.restore();
      }
    }
    deco.birds = deco.birds.filter((b) => b.x > -150 && b.x < W + 150);
    c.fillStyle = `rgba(20,14,6,${dark})`; c.fillRect(0, 0, W, H);
  }
  function logo(c, y, s = 1) {
    c.save(); c.translate(W / 2, y); c.scale(s, s); c.rotate(Math.sin(deco.t * 1.1) * 0.015);
    D.text(c, "FEATHER FRENZY", 0, 0, 104, "#ffcf4a", "center", { lw: 20, oc: "#4a1e10" });
    c.restore();
  }

  /* ================= BOOT ================= */
  States.boot = {
    t: 0,
    enter() { this.t = 0; },
    input() { if (I.mouse.clicked || I.pressed.size || I.pad.pressed.size) { A.init(); setState("title"); } },
    update(dt) { this.t += dt; },
    draw(c) {
      backdrop(c, 1 / 60, 0.2);
      logo(c, 250);
      D.text(c, "A grouse hunt across eight landscapes", W / 2, 340, 28, "#fff6dc");
      if (Math.sin(this.t * 4) > -0.3) D.text(c, I.touch ? "Tap to start" : "Click or press any key", W / 2, 480, 34, "#ffe24a");
    },
  };

  /* ================= TITLE ================= */
  States.title = {
    btns: [],
    enter() {
      A.playSong("title");
      const x = W / 2 - 170;
      this.btns = [
        { x, y: 300, w: 340, h: 72, label: "Play", size: 36, act: () => setState("levels") },
        { x, y: 386, w: 340, h: 60, label: "High scores", act: () => setState("highscores", { idx: Prog.unlocked() }) },
        { x, y: 458, w: 340, h: 60, label: "Options", act: () => setState("options") },
        { x, y: 530, w: 340, h: 60, label: "How to play", color: "#7b2b25", act: () => setState("help") },
      ];
      focusFirst(this.btns);
    },
    input() { runButtons(this.btns); },
    update() {},
    draw(c) {
      backdrop(c, 1 / 60, 0.25);
      logo(c, 150);
      D.text(c, "Eight hunting grounds · 90 seconds each · 8 shells per load", W / 2, 230, 24, "#fff6dc");
      drawButtons(c, this.btns);
      pointer(c);
    },
  };

  /* ================= LEVEL CHOICE ================= */
  const thumbs = {};
  function thumb(i) {
    const L = LEVELS[i];
    if (thumbs[L.id]) return thumbs[L.id];
    const big = document.createElement("canvas"); big.width = W; big.height = H;
    const c = big.getContext("2d");
    const pics = G.layers(L), cam = FF.RANGE * 0.45;
    L.sky(c, 0, cam);
    pics.forEach((p, l) => { c.drawImage(p, Math.round(cam * FF.PAR[l]), 0, W, H, 0, 0, W, H); drawProps(c, L, l, cam, 0); });
    if (L.night) { c.fillStyle = "rgba(4,6,20,0.25)"; c.fillRect(0, 0, W, H); }
    const t = document.createElement("canvas"); t.width = 320; t.height = 180;
    t.getContext("2d").drawImage(big, 0, 0, 320, 180);
    return (thumbs[L.id] = t);
  }
  States.levels = {
    btns: [], t: 0,
    enter() {
      A.playSong("select");
      const un = Prog.unlocked();
      this.btns = LEVELS.map((L, i) => ({ x: 70 + (i % 4) * 290, y: 120 + Math.floor(i / 4) * 262, w: 270, h: 232, i, custom: true, disabled: i > un, act: () => startLevel(i) }));
      this.btns.push(backBtn("title"));
      const cur = this.btns[Math.min(un, LEVELS.length - 1)];
      if (I.lastDevice !== "mouse") { I.mouse.x = cur.x + cur.w / 2; I.mouse.y = cur.y + cur.h / 2; }
      this.t = 0;
    },
    input() { runButtons(this.btns); if (I.hit("back")) { A.sfx("menuBack"); setState("title"); } },
    update(dt) { this.t += dt; },
    draw(c) {
      backdrop(c, 1 / 60, 0.6);
      title(c, "Choose your hunting ground", 64, 48);
      for (const b of this.btns) {
        if (!b.custom) continue;
        const L = LEVELS[b.i], hov = inR(I.mouse, b) && !b.disabled;
        c.save();
        if (hov) { c.translate(b.x + b.w / 2, b.y + b.h / 2); c.scale(1.04, 1.04); c.translate(-(b.x + b.w / 2), -(b.y + b.h / 2)); }
        D.rr(c, b.x + 4, b.y + 6, b.w, b.h, 14, "rgba(0,0,0,0.35)", null, 0);
        D.rr(c, b.x, b.y, b.w, b.h, 14, "#f6ecd2", D.OUT, 3);
        c.save(); c.beginPath(); c.rect(b.x + 10, b.y + 10, b.w - 20, 140); c.clip();
        c.drawImage(thumb(b.i), b.x + 10, b.y + 10, b.w - 20, 140);
        if (b.disabled) { c.fillStyle = "rgba(20,14,6,0.65)"; c.fillRect(b.x + 10, b.y + 10, b.w - 20, 140); }
        c.restore();
        D.rr(c, b.x + 10, b.y + 10, b.w - 20, 140, 6, null, D.OUT, 2);
        D.text(c, `${b.i + 1}. ${L.name}`, b.x + b.w / 2, b.y + 172, 22, "#4a1e10", "center", { outline: false });
        if (b.disabled) {
          D.text(c, "Locked", b.x + b.w / 2, b.y + 80, 30, "#fff6dc");
          D.text(c, `Score ${LEVELS[b.i - 1].target} in ${LEVELS[b.i - 1].name}`, b.x + b.w / 2, b.y + 204, 15, "#6a4a2a", "center", { outline: false, font: D.FONT2, weight: 800 });
        } else {
          const best = Prog.best(L.id);
          D.text(c, `Best ${U.fmt(best)}` + (b.i < LEVELS.length - 1 ? ` · Goal ${L.target}` : ""), b.x + b.w / 2, b.y + 204, 17, best >= L.target ? "#2a7a1a" : "#6a4a2a", "center", { outline: false, font: D.FONT2, weight: 900 });
        }
        c.restore();
      }
      const hb = this.btns.find((b) => b.custom && inR(I.mouse, b) && !b.disabled);
      if (hb) D.text(c, LEVELS[hb.i].sub, W / 2, H - 46, 24, "#ffe24a");
      drawButtons(c, this.btns);
      pointer(c);
    },
  };
  let current = 0;
  function startLevel(i) { current = i; G.start(i); setState("play"); }

  /* ================= THE ROUND ================= */
  const PAUSE = { btns: [] };
  States.play = {
    paused: false,
    enter() { this.paused = false; FF.Main.setCursor(false); if (I.lastDevice !== "mouse") { I.mouse.x = W / 2; I.mouse.y = H / 2; } },
    pause() {
      if (this.paused || G.over) return;
      this.paused = true;
      A.sfx("menuBack");
      const x = W / 2 - 170;
      PAUSE.btns = [
        { x, y: 250, w: 340, h: 62, label: "Resume", act: () => { this.paused = false; } },
        { x, y: 324, w: 340, h: 62, label: "Restart", act: () => startLevel(current) },
        { x, y: 398, w: 340, h: 62, label: "Music: " + (A.musicVol > 0 ? "on" : "off"), color: "#2f5a6a", act: () => { A.setMusicVol(A.musicVol > 0 ? 0 : 0.7); PAUSE.btns[2].label = "Music: " + (A.musicVol > 0 ? "on" : "off"); } },
        { x, y: 472, w: 340, h: 62, label: "Quit to levels", color: "#7b2b25", act: () => setState("levels") },
      ];
      focusFirst(PAUSE.btns);
    },
    input(dt) {
      if (this.paused) {
        runButtons(PAUSE.btns);
        if (I.pressed.has("Escape") || I.pressed.has("KeyP") || I.pad.pressed.has(9)) this.paused = false;
        return;
      }
      if (I.pressed.has("Escape") || I.pressed.has("KeyP") || I.pad.pressed.has(9)) { this.pause(); return; }
      G.input(dt);
    },
    update(dt) {
      if (this.paused) return;
      G.update(dt);
      if (G.done) setState("results");
    },
    draw(c) {
      c.save();
      if (G.shake > 0.3) c.translate(U.rand(-G.shake, G.shake), U.rand(-G.shake, G.shake));
      G.drawWorld(c);
      c.restore();
      if (!this.paused) G.drawHud(c);
      if (this.paused) {
        c.fillStyle = "rgba(0,0,0,0.5)"; c.fillRect(0, 0, W, H);
        D.panel(c, W / 2 - 220, 150, 440, 420);
        D.text(c, "Paused", W / 2, 205, 44, "#4a1e10", "center", { outline: false });
        drawButtons(c, PAUSE.btns);
        pointer(c);
      }
    },
  };

  /* ================= RESULTS ================= */
  States.results = {
    btns: [],
    enter() {
      const L = LEVELS[current];
      this.t = 0;
      this.score = G.score;
      this.acc = G.shots ? Math.round((G.hits / G.shots) * 100) : 0;
      this.prevBest = Prog.best(L.id);
      this.record = this.score > this.prevBest && this.score > 0;
      Prog.setBest(L.id, this.score);
      this.qualified = this.score >= L.target;
      this.newLevel = this.qualified && current + 1 < LEVELS.length && Prog.unlocked() < current + 1;
      if (this.qualified) Prog.unlock(current + 1);
      this.rank = HS.rank(L.id, this.score);
      A.playSong("results");
      if (this.newLevel) { A.jingle("unlock"); A.say("New hunting ground unlocked!", { force: true }); }
      else if (this.record) { A.jingle("record"); A.say("New record!", { force: true }); }
      const nx = current + 1;
      this.btns = [
        { x: W / 2 - 470, y: 600, w: 300, h: 64, label: "Hunt again", act: () => this.leave(() => startLevel(current)) },
        { x: W / 2 - 150, y: 600, w: 300, h: 64, label: "Next level", disabled: !(nx < LEVELS.length && nx <= Prog.unlocked()), act: () => this.leave(() => startLevel(nx)) },
        { x: W / 2 + 170, y: 600, w: 300, h: 64, label: "Levels", color: "#7b2b25", act: () => this.leave(() => setState("levels")) },
      ];
      focusFirst(this.btns);
    },
    leave(then) {
      if (this.rank >= 0) { setState("nameentry", { idx: current, score: this.score, then }); return; }
      then();
    },
    input() { if (this.t > 0.8) runButtons(this.btns); },
    update(dt) { this.t += dt; G.t += dt; },
    draw(c) {
      G.drawWorld(c);
      c.fillStyle = `rgba(20,14,6,${Math.min(0.6, this.t)})`; c.fillRect(0, 0, W, H);
      const L = LEVELS[current], st = G.stats;
      D.panel(c, 250, 50, 780, 520);
      D.text(c, L.name, W / 2, 104, 40, "#4a1e10", "center", { outline: false });
      const k = Math.min(1, this.t / 1.2);
      D.text(c, U.fmt(Math.round(this.score * k)), W / 2, 176, 76, "#c8302a", "center", { outline: false });
      D.text(c, "points", W / 2, 222, 22, "#6a4a2a", "center", { outline: false, font: D.FONT2, weight: 800 });
      const rows = [
        ["Far grouse (25)", st.far], ["Middle grouse (10)", st.mid], ["Near grouse (5)", st.near], ["Peeking grouse (25)", st.peek],
        ["Specials", st.special], ["Bonus targets", st.bonus], ["Animals hit (−25)", st.penalty], ["Shots / hits", `${G.shots} / ${G.hits}`], ["Accuracy", this.acc + " %"],
      ];
      rows.forEach(([a, b], i) => {
        const x = i < 5 ? 300 : 680, y = 268 + (i % 5) * 36;
        D.text(c, a, x, y, 20, "#4a2a10", "left", { outline: false, font: D.FONT2, weight: 800 });
        D.text(c, String(b), x + 300, y, 22, "#4a2a10", "right", { outline: false });
      });
      let msg, col = "#2a7a1a";
      if (this.newLevel) msg = `Goal reached! ${LEVELS[current + 1].name} is open.`;
      else if (this.qualified) msg = current + 1 < LEVELS.length ? `Goal of ${L.target} reached.` : "You mastered every hunting ground!";
      else { msg = `${L.target - this.score} points short of the goal (${L.target}).`; col = "#a8302a"; }
      if (current === LEVELS.length - 1 && !this.qualified) { msg = "The last hunting ground: go for the high score!"; col = "#4a2a10"; }
      D.text(c, msg, W / 2, 470, 26, col, "center", { outline: false });
      if (this.record) D.text(c, "New personal best!", W / 2, 515, 30, "#c8302a", "center", { outline: false });
      else D.text(c, `Best: ${U.fmt(Math.max(this.prevBest, this.score))}`, W / 2, 515, 24, "#6a4a2a", "center", { outline: false });
      if (this.t > 0.8) drawButtons(c, this.btns);
      pointer(c);
    },
  };

  /* ================= HIGH SCORES ================= */
  States.highscores = {
    btns: [], idx: 0, mark: -1,
    enter(arg) {
      this.idx = arg && arg.idx !== undefined ? U.clamp(arg.idx, 0, LEVELS.length - 1) : this.idx;
      this.mark = arg && arg.mark !== undefined ? arg.mark : -1;
      this.then = arg && arg.then;
      this.btns = [
        { x: 230, y: 96, w: 70, h: 56, label: "◀", act: () => { this.idx = (this.idx + LEVELS.length - 1) % LEVELS.length; this.mark = -1; } },
        { x: W - 300, y: 96, w: 70, h: 56, label: "▶", act: () => { this.idx = (this.idx + 1) % LEVELS.length; this.mark = -1; } },
        this.then ? { x: W - 300, y: H - 74, w: 280, h: 56, label: "Continue", act: () => this.then() } : backBtn("title"),
      ];
      focusFirst(this.btns);
    },
    input() {
      runButtons(this.btns);
      if (I.hit("back")) { A.sfx("menuBack"); if (this.then) this.then(); else setState("title"); }
      if (I.hit("scrollL")) this.btns[0].act(); if (I.hit("scrollR")) this.btns[1].act();
    },
    update() {},
    draw(c) {
      backdrop(c, 1 / 60, 0.6);
      title(c, "High scores", 56, 50);
      D.text(c, `${this.idx + 1}. ${LEVELS[this.idx].name}`, W / 2, 124, 34, "#ffe24a");
      D.panel(c, W / 2 - 330, 170, 660, 470);
      const l = HS.list(LEVELS[this.idx].id);
      if (!l.length) D.text(c, "No entries yet", W / 2, 400, 30, "#8a7a5a", "center", { outline: false });
      l.forEach((e, i) => {
        const y = 210 + i * 42, col = i === this.mark ? "#c8302a" : "#4a2a10";
        D.text(c, `${i + 1}.`, W / 2 - 280, y, 26, col, "left", { outline: false });
        D.text(c, e.name, W / 2 - 220, y, 26, col, "left", { outline: false });
        D.text(c, e.date || "", W / 2 + 120, y, 18, "#8a7a5a", "right", { outline: false, font: D.FONT2, weight: 800 });
        D.text(c, U.fmt(e.score), W / 2 + 280, y, 26, col, "right", { outline: false });
      });
      drawButtons(c, this.btns);
      pointer(c);
    },
  };

  /* ================= NAME ENTRY ================= */
  const KEYS = ["ABCDEFGHIJ", "KLMNOPQRST", "UVWXYZ0123", "456789 .-!"];
  States.nameentry = {
    enter(arg) {
      this.arg = arg; this.name = Store.get("lastName", "");
      this.btns = [];
      KEYS.forEach((row, r) => [...row].forEach((ch, c) => this.btns.push({ x: W / 2 - 330 + c * 66, y: 300 + r * 62, w: 58, h: 52, label: ch === " " ? "␣" : ch, size: 24, act: () => { if (this.name.length < 12) this.name += ch; } })));
      this.btns.push({ x: W / 2 - 330, y: 300 + 4 * 62, w: 190, h: 52, label: "Delete", size: 22, color: "#7b2b25", act: () => { this.name = this.name.slice(0, -1); } });
      this.btns.push({ x: W / 2 - 124, y: 300 + 4 * 62, w: 250, h: 52, label: "Save", size: 24, act: () => this.save() });
      this.btns.push({ x: W / 2 + 142, y: 300 + 4 * 62, w: 190, h: 52, label: "Skip", size: 22, color: "#7b2b25", act: () => this.arg.then() });
      focusFirst(this.btns);
    },
    save() {
      const n = this.name.trim() || "HUNTER";
      Store.set("lastName", n);
      const pos = HS.add(LEVELS[this.arg.idx].id, n, this.arg.score);
      setState("highscores", { idx: this.arg.idx, mark: pos, then: this.arg.then });
    },
    input() {
      for (const ch of I.typed) { const c = ch.toUpperCase(); if (/^[A-Z0-9 .\-!ÄÖÜ]$/.test(c) && this.name.length < 12) this.name += c; }
      if (I.pressed.has("Backspace")) this.name = this.name.slice(0, -1);
      if (I.pressed.has("Enter") || I.pressed.has("NumpadEnter")) { this.save(); return; }
      navigate(this.btns);
      if (I.mouse.clicked && !I.pressed.has("Space")) for (const b of this.btns) if (inR(I.mouse, b)) { A.sfx("menuMove"); b.act(); break; }
    },
    update() {},
    draw(c) {
      backdrop(c, 1 / 60, 0.65);
      title(c, "Top 10!", 80, 56);
      D.text(c, `${U.fmt(this.arg.score)} points in ${LEVELS[this.arg.idx].name}`, W / 2, 150, 30, "#ffe24a");
      D.rr(c, W / 2 - 250, 200, 500, 70, 14, "#fffbe8", D.OUT, 3);
      D.text(c, this.name + (Math.sin(performance.now() / 200) > 0 ? "_" : ""), W / 2, 236, 40, "#4a2a10", "center", { outline: false });
      drawButtons(c, this.btns);
      pointer(c);
    },
  };

  /* ================= OPTIONS ================= */
  States.options = {
    btns: [], confirm: false,
    enter() { this.confirm = false; this.build(); focusFirst(this.btns); },
    build() {
      const x = W / 2 - 300, w = 600, h = 56, M = FF.Main;
      const pct = (v) => Math.round(v * 100) + " %";
      const speeds = { 0.7: "slow", 1: "normal", 1.4: "fast" };
      this.btns = [
        { x, y: 130, w: 120, h, label: "−", act: () => { A.setMusicVol(U.clamp(A.musicVol - 0.1, 0, 1)); this.build(); } },
        { x: x + w - 120, y: 130, w: 120, h, label: "+", act: () => { A.setMusicVol(U.clamp(A.musicVol + 0.1, 0, 1)); this.build(); } },
        { x, y: 200, w: 120, h, label: "−", act: () => { A.setSfxVol(U.clamp(A.sfxVol - 0.1, 0, 1)); this.build(); A.sfx("shot"); } },
        { x: x + w - 120, y: 200, w: 120, h, label: "+", act: () => { A.setSfxVol(U.clamp(A.sfxVol + 0.1, 0, 1)); this.build(); A.sfx("shot"); } },
        { x, y: 270, w, h, label: "Voice: " + (A.voiceOn ? "on" : "off"), act: () => { A.setVoice(!A.voiceOn); this.build(); } },
        { x, y: 340, w, h, label: "Edge scrolling: " + (speeds[M.scrollSpeed] || "normal"), act: () => { M.scrollSpeed = M.scrollSpeed === 1 ? 1.4 : M.scrollSpeed === 1.4 ? 0.7 : 1; Store.set("scrollSpeed", M.scrollSpeed); this.build(); } },
        { x, y: 410, w, h, label: "Keep the screen awake: " + (M.keepAwake ? "on" : "off"), size: 24, act: () => { M.keepAwake = !M.keepAwake; Store.set("keepAwake", M.keepAwake); this.build(); } },
        { x, y: 480, w, h, label: "Fullscreen (F)", act: () => M.toggleFullscreen() },
        { x, y: 550, w, h, label: this.confirm ? "Really delete scores and progress?" : "Reset scores and progress", size: 22, color: "#7b2b25", act: () => { if (this.confirm) { for (const L of LEVELS) { Store.set("hs-" + L.id, []); Store.set("best-" + L.id, 0); } Store.set("unlocked", 0); this.confirm = false; } else this.confirm = true; this.build(); } },
        backBtn("title"),
      ];
      this.pct = [pct(A.musicVol), pct(A.sfxVol)];
    },
    input() { runButtons(this.btns); if (I.hit("back")) { A.sfx("menuBack"); setState("title"); } },
    update() {},
    draw(c) {
      backdrop(c, 1 / 60, 0.65);
      title(c, "Options", 70, 56);
      drawButtons(c, this.btns);
      D.text(c, "Music " + this.pct[0], W / 2, 158, 26, "#fff6dc");
      D.text(c, "Effects " + this.pct[1], W / 2, 228, 26, "#fff6dc");
      pointer(c);
    },
  };

  /* ================= HELP ================= */
  States.help = {
    btns: [],
    enter() { this.btns = [backBtn("title")]; focusFirst(this.btns); },
    input() { runButtons(this.btns); if (I.hit("back")) { A.sfx("menuBack"); setState("title"); } },
    update() {},
    draw(c) {
      backdrop(c, 1 / 60, 0.7);
      title(c, "How to play", 56, 50);
      D.panel(c, 50, 92, 580, 540);
      D.panel(c, 650, 92, 580, 540);
      D.text(c, "The hunt", 340, 134, 28, "#4a1e10", "center", { outline: false });
      D.para(c, "You have 90 seconds per hunting ground. Shoot the grouse that fly across the panorama: the farther away, the more points (25, 10 or 5). Grouse that peek out of hiding places are worth 25, and you will find plenty of bonus targets – windmills, scarecrows, bells, a plane with a banner, a balloon, golden grouse and more.\n\nYour gun holds 8 shells. Reload in time! Move the crosshair to the left or right edge to look around. Leave the other animals alone: every one you hit costs 25 points.\n\nReach the goal score to open the next hunting ground.", 80, 166, 520, 18, "#3a2410", 1.32);
      D.text(c, "Controls", 940, 134, 28, "#4a1e10", "center", { outline: false });
      D.para(c, "Mouse: aim and click to shoot, right click to reload. Move to the screen edge to scroll.\n\nTouch: tap to shoot, tap the shells to reload, hold the arrows at the edges to scroll.\n\nKeyboard: arrow keys aim, Space or Enter shoots, R or Shift reloads, A/D or Q/E scroll, P or Esc pauses, M mutes, F toggles fullscreen.\n\nGamepad: left stick aims, A or RT shoots, B, X or LT reloads, right stick or LB/RB scroll, Start pauses.", 680, 166, 520, 18, "#3a2410", 1.32);
      drawButtons(c, this.btns);
      pointer(c);
    },
  };
})(window.FF);
