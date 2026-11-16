/* Garden Siege: screens – title, adventure map, mini-games, puzzles, survival, seed chooser, play, pause,
   results, almanac, shop, options, help, high scores and name entry */
"use strict";

(function (GS) {
  const { U, D, G, Store, Save } = GS;
  const A = GS.Audio, I = GS.Input;
  const W = U.W, H = U.H;
  const P = GS.PLANTS, Z = GS.ZOMBIES;
  const States = (GS.States = {});
  let setState = null;
  GS.UI = { bind(fn) { setState = fn; } };
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
      let cur = act.find((b) => inR(m, b));
      if (!cur) { const b = act[0]; m.x = b.x + b.w / 2; m.y = b.y + b.h / 2; A.sfx("menuMove"); return; }
      const cx = cur.x + cur.w / 2, cy = cur.y + cur.h / 2;
      let best = null, bs = Infinity;
      for (const b of act) {
        if (b === cur) continue;
        const bx = b.x + b.w / 2, by = b.y + b.h / 2;
        const along = (bx - cx) * dx + (by - cy) * dy;
        if (along <= 4) continue;
        const across = Math.abs((bx - cx) * dy) + Math.abs((by - cy) * dx);
        const s = along + across * 2.2;
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
  function drawButtons(c, btns, o = {}) {
    for (const b of btns) if (!b.custom) D.button(c, b, inR(I.mouse, b), Object.assign({}, o, { disabled: b.disabled, color: b.color, size: b.size }));
  }
  function focusFirst(btns) {
    if (I.lastDevice === "mouse" || !btns.length) return;
    const b = btns.find((x) => !x.disabled) || btns[0];
    I.mouse.x = b.x + b.w / 2; I.mouse.y = b.y + b.h / 2;
  }
  function cursor(c) {
    if (!I.showCursor()) return;
    D.hand(c, I.mouse.x, I.mouse.y);
  }
  GS.UI.cursor = cursor;

  /* ---------- shared backdrop: the front yard ---------- */
  const deco = (GS.UI.deco = { t: 0, zs: [] });
  function backdrop(c, dt, dark = 0.25) {
    deco.t += dt || 0;
    D.background(c, "day", 5);
    if (dt) {
      if (Math.random() < dt * 0.25 && deco.zs.length < 4) deco.zs.push({ id: U.pick(["walker", "cone", "bucket", "flag", "pole"]), x: W + 40, y: U.pick([370, 482, 594, 706]), age: U.rand(9) });
      for (const z of deco.zs) { z.x -= 16 * dt; z.age += dt; }
      deco.zs = deco.zs.filter((z) => z.x > 1000);
    }
    for (const z of deco.zs) { c.save(); c.translate(z.x, z.y); const d = G.dummyZombie(z.id, z.age); Z[z.id].draw(c, d); c.restore(); }
    for (const [id, x, y] of [["sunbloom", 310, 370], ["pea", 410, 482], ["nut", 510, 482], ["double", 310, 594], ["sunbloom", 410, 706], ["cabbage", 310, 706]]) G.drawPlantIcon(c, id, x, y, 1);
    c.fillStyle = `rgba(10,20,5,${dark})`; c.fillRect(0, 0, W, H);
  }
  function title(c, s, y, size = 64) { D.text(c, s, W / 2, y, size, "#fff", "center", { lw: size * 0.18 }); }
  function backBtn(to) { return { x: 20, y: H - 74, w: 170, h: 56, label: "Back", back: true, act: () => setState(to), color: "#8a5a2b" }; }

  /* ---------- start a level ---------- */
  let current = null; // { spec, from, item }
  function startSpec(spec, from, item) {
    current = { spec, from, item };
    G.prepare(spec);
    const avail = Save.plants().filter((id) => !(spec.noSunPlants && P[id].sun));
    if (spec.izombie || spec.conveyor || spec.vase || spec.slots || spec.raining) { G.begin([]); setState("play"); return; }
    if (spec.seeds) { G.begin(spec.seeds.filter((id) => avail.includes(id) || spec.whack || spec.L === 0)); setState("play"); return; }
    if (!spec.chooser || avail.length <= Save.slots()) {
      G.begin(avail.filter((id) => !P[id].upgradeOf || true).slice(0, Save.slots()));
      setState("play");
      return;
    }
    setState("choose");
  }
  GS.UI.startSpec = startSpec;
  function restart() { if (current) startSpec(current.spec, current.from, current.item); }

  /* ================= BOOT ================= */
  States.boot = {
    t: 0,
    enter() { this.t = 0; },
    input() { if (I.mouse.clicked || I.pressed.size || I.pad.pressed.size) { A.init(); setState("title"); } },
    update(dt) { this.t += dt; },
    draw(c) {
      backdrop(c, 1 / 60, 0.3);
      c.save(); c.translate(W / 2, 250); c.rotate(Math.sin(deco.t * 1.2) * 0.02);
      D.text(c, "GARDEN SIEGE", 0, 0, 112, "#8ee04a", "center", { lw: 20, oc: "#1d3a0a" });
      c.restore();
      D.text(c, "Defend your house against the undead", W / 2, 335, 28, "#fff7c8");
      if (Math.sin(this.t * 4) > -0.3) D.text(c, I.touch ? "Tap to start" : "Click or press any key", W / 2, 470, 34, "#ffe14a");
    },
  };

  /* ================= TITLE ================= */
  States.title = {
    btns: [],
    enter() {
      A.playSong("title");
      const p = Save.progress();
      const L = Math.min(49, Save.d.adv);
      const lv = GS.ADVENTURE[L];
      const advLabel = Save.d.adv >= 50 ? "Adventure (done)" : "Adventure · " + lv.title.split(" · ")[0].replace("Level ", "");
      const bw = 300, bh = 66, gx = W / 2 - bw - 12, gx2 = W / 2 + 12;
      this.btns = [
        { x: W / 2 - 230, y: 250, w: 460, h: 84, label: advLabel, size: 34, act: () => setState("adventure") },
        { x: gx, y: 352, w: bw, h: bh, label: "Mini-games", disabled: p < 10, act: () => setState("list", "mini") },
        { x: gx2, y: 352, w: bw, h: bh, label: "Puzzles", disabled: p < 20, act: () => setState("list", "puzzle") },
        { x: gx, y: 432, w: bw, h: bh, label: "Survival", disabled: p < 30, act: () => setState("list", "survival") },
        { x: gx2, y: 432, w: bw, h: bh, label: "Almanac", act: () => setState("almanac") },
        { x: gx, y: 512, w: bw, h: bh, label: "Gus's Shop", disabled: p < 10, act: () => setState("shop") },
        { x: gx2, y: 512, w: bw, h: bh, label: "Options", act: () => setState("options") },
        { x: W / 2 - 150, y: 600, w: 300, h: 56, label: "How to play", color: "#4a9ad8", act: () => setState("help") },
      ];
      focusFirst(this.btns);
    },
    input() { runButtons(this.btns); },
    update() {},
    draw(c) {
      backdrop(c, 1 / 60, 0.35);
      const t = deco.t;
      c.save(); c.translate(W / 2, 130); c.rotate(Math.sin(t * 1.2) * 0.02);
      D.text(c, "GARDEN SIEGE", 0, 0, 104, "#8ee04a", "center", { lw: 18, oc: "#1d3a0a" });
      c.restore();
      D.text(c, "Plants against the undead", W / 2, 205, 26, "#fff7c8");
      drawButtons(c, this.btns);
      const locks = { "Mini-games": "Level 2-1", Puzzles: "Level 3-1", Survival: "Level 4-1", "Gus's Shop": "Level 2-1" };
      for (const b of this.btns) if (b.disabled && locks[b.label]) D.text(c, "Unlocks at " + locks[b.label], b.x + b.w / 2, b.y + b.h + 8, 14, "#ffe0a0");
      D.rr(c, W - 230, 18, 210, 44, 12, "rgba(0,0,0,0.35)", null, 0);
      D.coin(c, W - 204, 40, "gold", 0);
      D.text(c, "$" + U.fmt(Save.d.coins), W - 110, 41, 24, "#ffe14a");
      cursor(c);
    },
  };

  /* ================= ADVENTURE MAP ================= */
  States.adventure = {
    btns: [],
    enter() {
      A.playSong("title");
      const p = Save.progress();
      this.btns = [];
      GS.AREA_IDS.forEach((area, ai) => {
        for (let n = 0; n < 10; n++) {
          const L = ai * 10 + n;
          const open = L <= Math.max(p, Save.d.adv) && L < 50;
          this.btns.push({ x: 150 + n * 102, y: 130 + ai * 104, w: 90, h: 80, label: `${ai + 1}-${n + 1}`, L, area, disabled: !open, custom: true, act: () => startSpec(GS.ADVENTURE[L], "adventure") });
        }
      });
      this.btns.push(backBtn("title"));
      const next = this.btns.find((b) => b.L === Math.min(49, Save.d.adv));
      if (I.lastDevice !== "mouse" && next) { I.mouse.x = next.x + 45; I.mouse.y = next.y + 40; }
    },
    input() { runButtons(this.btns); if (I.hit("back")) { A.sfx("menuBack"); setState("title"); } },
    update() {},
    draw(c) {
      backdrop(c, 1 / 60, 0.55);
      title(c, "Adventure", 60, 56);
      const cols = { day: "#6fbf3a", night: "#4a5aa8", pool: "#3aa0d8", fog: "#7a8aa0", roof: "#b05a3a" };
      GS.AREA_IDS.forEach((a, ai) => D.text(c, GS.AREAS[a].name, 136, 170 + ai * 104, 18, "#fff", "right"));
      for (const b of this.btns) {
        if (!b.custom) continue;
        const hov = inR(I.mouse, b) && !b.disabled;
        const done = b.L < Save.d.adv;
        D.rr(c, b.x, b.y - (hov ? 4 : 0), b.w, b.h, 12, b.disabled ? "#6a6a5a" : cols[b.area], D.OUT, 3);
        D.text(c, b.label, b.x + b.w / 2, b.y + 30 - (hov ? 4 : 0), 26, b.disabled ? "#bbb" : "#fff");
        const lv = GS.ADVENTURE[b.L];
        if (!b.disabled) {
          if (P[lv.award] && done) G.drawPlantIcon(c, lv.award, b.x + b.w / 2, b.y + b.h - 4 - (hov ? 4 : 0), 0.25);
          else if (lv.special || lv.conveyor) D.text(c, lv.boss ? "Boss" : lv.special ? "Special" : "Belt", b.x + b.w / 2, b.y + 60, 15, "#ffe14a");
          if (done) D.text(c, "✓", b.x + b.w - 14, b.y + 14, 18, "#ffe14a");
        }
      }
      const hb = this.btns.find((b) => b.custom && inR(I.mouse, b) && !b.disabled);
      if (hb) D.text(c, GS.ADVENTURE[hb.L].title, W / 2, H - 46, 26, "#ffe14a");
      drawButtons(c, this.btns);
      cursor(c);
    },
  };

  /* ================= LISTS: mini-games, puzzles, survival ================= */
  States.list = {
    btns: [], kind: "mini",
    enter(kind) {
      if (kind) this.kind = kind;
      A.playSong("title");
      const items = this.kind === "mini" ? GS.MINIGAMES : this.kind === "puzzle" ? GS.PUZZLES : GS.SURVIVAL;
      const done = this.kind === "mini" ? Save.d.mini : this.kind === "puzzle" ? Save.d.puzzle : Save.d.surv;
      const p = Save.progress();
      const cols = this.kind === "survival" ? 3 : 5, bw = this.kind === "survival" ? 360 : 222, bh = this.kind === "puzzle" ? 74 : 92;
      const gx = (W - cols * (bw + 12) + 12) / 2;
      this.btns = items.map((it, i) => {
        const open = Save.d.unlockAll || (p >= it.req && (!it.needs || done[it.needs]));
        return { x: gx + (i % cols) * (bw + 12), y: 120 + Math.floor(i / cols) * (bh + 12), w: bw, h: bh, label: it.name, it, done: done[it.id], disabled: !open, custom: true,
          act: () => startSpec(it.spec(), "list", it) };
      });
      this.btns.push(backBtn("title"));
      focusFirst(this.btns);
    },
    input() { runButtons(this.btns); if (I.hit("back")) { A.sfx("menuBack"); setState("title"); } },
    update() {},
    draw(c) {
      backdrop(c, 1 / 60, 0.6);
      title(c, { mini: "Mini-games", puzzle: "Puzzles", survival: "Survival" }[this.kind], 60, 56);
      for (const b of this.btns) {
        if (!b.custom) continue;
        const hov = inR(I.mouse, b) && !b.disabled;
        D.rr(c, b.x, b.y - (hov ? 3 : 0), b.w, b.h, 12, b.disabled ? "#5a5a4a" : b.done ? "#c8a040" : "#6a9a3a", D.OUT, 3);
        if (b.disabled) D.text(c, "Locked", b.x + b.w / 2, b.y + b.h / 2, 22, "#aaa");
        else {
          D.text(c, b.label, b.x + b.w / 2, b.y + 28 - (hov ? 3 : 0), b.label.length > 20 ? 17 : 21, "#fff");
          const best = Save.d.best[b.it.id];
          D.text(c, b.done ? "✓ Done" : best ? "Best: " + best : "", b.x + b.w / 2, b.y + b.h - 22, 16, "#fff7c8");
        }
      }
      const hb = this.btns.find((b) => b.custom && inR(I.mouse, b));
      if (hb) D.text(c, hb.disabled ? "Keep playing the adventure to unlock this." : hb.it.desc, W / 2, H - 46, 22, "#ffe14a");
      drawButtons(c, this.btns);
      cursor(c);
    },
  };

  /* ================= SEED CHOOSER ================= */
  States.choose = {
    btns: [], picked: [], round: false,
    enter(arg) {
      this.round = !!(arg && arg.round);
      const spec = G.spec;
      this.avail = Save.plants().filter((id) => !(spec.noSunPlants && P[id].sun));
      this.slots = Save.slots();
      this.picked = this.round ? G.seeds.map((s) => s.id).filter((id) => this.avail.includes(id)) : (Store.get("lastSeeds", []) || []).filter((id) => this.avail.includes(id)).slice(0, this.slots);
      if (!this.round) A.playSong("choose");
      this.build();
      focusFirst(this.btns);
      this.t = 0;
    },
    build() {
      const cols = 8, pw = 74, gx = 300, gy = 168;
      this.btns = [];
      GS.PLANT_ORDER.forEach((id, i) => {
        if (i >= 48) return;
        const ok = this.avail.includes(id);
        this.btns.push({ x: gx + (i % cols) * (pw + 6), y: gy + Math.floor(i / cols) * 70, w: pw, h: 64, id, custom: true, kind: "plant", disabled: !ok, focusable: false });
      });
      for (let i = 0; i < this.slots; i++) this.btns.push({ x: 100 + i * 66, y: 10, w: 62, h: 86, kind: "slot", idx: i, custom: true });
      const full = this.picked.length >= Math.min(this.slots, this.avail.length);
      this.rock = { x: 300 + 4 * 80 - 140, y: 628, w: 280, h: 58, label: "Let's go!", disabled: !full, act: () => this.go() };
      this.btns.push(this.rock);
      this.btns.push({ x: 20, y: H - 70, w: 150, h: 52, label: "Back", back: true, color: "#8a5a2b", act: () => { if (this.round) return; setState(current && current.from === "adventure" ? "adventure" : current ? current.from : "title"); } });
    },
    go() {
      Store.set("lastSeeds", this.picked);
      if (this.round) { G.nextRound(this.picked.slice()); A.playSong(G.A.song); }
      else G.begin(this.picked.slice());
      setState("play", { keep: this.round });
    },
    input() {
      const b = runButtons(this.btns);
      if (b && b.kind === "plant") {
        const i = this.picked.indexOf(b.id);
        if (i >= 0) this.picked.splice(i, 1);
        else if (this.picked.length < this.slots) {
          if (P[b.id].upgradeOf && !this.picked.includes(P[b.id].upgradeOf) && false) return;
          this.picked.push(b.id); A.sfx("plant");
        } else A.sfx("deny");
        this.build();
      } else if (b && b.kind === "slot") { if (this.picked[b.idx]) { this.picked.splice(b.idx, 1); A.sfx("shovel"); this.build(); } }
      if (I.hit("back") && !this.round) { A.sfx("menuBack"); setState(current && current.from ? current.from : "title"); }
    },
    update(dt) { this.t += dt; G.t += dt; },
    draw(c) {
      G.drawBoard(c, { preview: true });
      // the bank with the picked seeds
      D.rr(c, 4, 2, this.slots * 66 + 110, 100, 12, "#7a4a22", D.OUT, 3);
      D.rr(c, 10, 10, 84, 86, 10, "#f2e6b7", "#5a4520", 2.5);
      D.sun(c, 52, 40, 22, this.t);
      D.text(c, String(G.sun), 52, 80, 20, "#2a2a1a", "center", { outline: false, font: D.FONT2, weight: 900 });
      for (let i = 0; i < this.slots; i++) {
        const id = this.picked[i];
        if (id) D.packet(c, id, 100 + i * 66, 10, {});
        else D.rr(c, 100 + i * 66, 10, 62, 86, 7, "rgba(0,0,0,0.25)", "#5a4520", 2);
      }
      // the plant picker
      D.panel(c, 270, 106, 680, 608);
      D.text(c, this.round ? "Choose your plants for the next flag" : "Choose your plants", 610, 140, 28, "#5a3a17", "center", { outline: false });
      for (const b of this.btns) {
        if (b.kind !== "plant") continue;
        const hov = inR(I.mouse, b);
        if (b.disabled) { D.rr(c, b.x, b.y, b.w, b.h, 7, "#c8bc98", "#9a8a60", 2); continue; }
        const used = this.picked.includes(b.id);
        c.save(); c.globalAlpha = used ? 0.35 : 1;
        c.translate(0, hov ? -3 : 0);
        D.packetFrame(c, b.x, b.y, b.w, b.h, true);
        c.save(); c.beginPath(); c.rect(b.x + 3, b.y + 3, b.w - 6, b.h - 20); c.clip();
        G.drawPlantIcon(c, b.id, b.x + b.w / 2, b.y + b.h - 18, P[b.id].wide ? 0.22 : 0.32);
        c.restore();
        D.text(c, String(P[b.id].cost), b.x + b.w / 2, b.y + b.h - 9, 13, "#2a2a1a", "center", { outline: false, font: D.FONT2, weight: 900 });
        if (P[b.id].mushroom && !G.night) D.text(c, "z", b.x + b.w - 10, b.y + 10, 14, "#9ad8ff");
        c.restore();
      }
      const hb = this.btns.find((b) => b.kind === "plant" && inR(I.mouse, b) && !b.disabled);
      if (hb) {
        const d = P[hb.id];
        D.rr(c, 960, 250, 300, 190, 14, "rgba(20,30,10,0.85)", D.OUT, 3);
        D.text(c, d.name, 1110, 280, 24, "#ffe14a");
        D.para(c, d.desc + (d.mushroom && !G.night ? " Sleeps here unless you wake it with a Wake Bean." : ""), 975, 300, 270, 16, "#fff");
      }
      drawButtons(c, this.btns.filter((b) => !b.custom));
      if (this.rock.disabled) D.text(c, `Pick ${Math.min(this.slots, this.avail.length) - this.picked.length} more`, this.rock.x + this.rock.w / 2, this.rock.y - 14, 16, "#5a3a17", "center", { outline: false });
      cursor(c);
    },
  };

  /* ================= PLAY ================= */
  const PAUSE = { btns: [] };
  States.play = {
    paused: false,
    enter(arg) {
      this.paused = false;
      this.lostT = 0;
      GS.Main.setCursor(true);
      if (I.lastDevice !== "mouse") { I.mouse.x = G.colX(2); I.mouse.y = G.rowY(2) - 40; }
    },
    pause() {
      if (this.paused || G.result || G.lost) return;
      this.paused = true;
      A.sfx("menuBack");
      const bx = W / 2 - 170;
      PAUSE.btns = [
        { x: bx, y: 250, w: 340, h: 62, label: "Resume", act: () => { this.paused = false; } },
        { x: bx, y: 324, w: 340, h: 62, label: "Restart level", act: () => restart() },
        { x: bx, y: 398, w: 340, h: 62, label: "Music: " + (A.musicVol > 0 ? "on" : "off"), color: "#4a9ad8", act: () => { A.setMusicVol(A.musicVol > 0 ? 0 : 0.7); PAUSE.btns[2].label = "Music: " + (A.musicVol > 0 ? "on" : "off"); } },
        { x: bx, y: 472, w: 340, h: 62, label: "Main menu", color: "#8a5a2b", act: () => { if (G.spec.endless) return endGame(); setState("title"); } },
      ];
      focusFirst(PAUSE.btns);
    },
    input(dt) {
      const m = I.mouse;
      if (this.paused) {
        runButtons(PAUSE.btns);
        if (I.hit("pause") || I.hit("back")) { if (!I.pressed.has("Escape") || true) this.paused = false; }
        return;
      }
      if (G.lost || G.result) return;
      if (m.clicked && inR(m, G.MENU_BTN)) { this.pause(); return; }
      if (G.roundBreak && G.continueBtn) {
        navigate([G.continueBtn]);
        if (m.clicked && inR(m, G.continueBtn)) {
          A.sfx("menuOk");
          if (G.spec.laststand) G.nextRound(); else setState("choose", { round: true });
        }
        return;
      }
      const r = G.input(dt);
      if (r !== "consumed" && (I.pressed.has("KeyP") || I.pad.pressed.has(9) || (I.pressed.has("Escape") && !G.tool))) this.pause();
    },
    update(dt) {
      if (this.paused) return;
      G.update(dt);
      if (G.lost && !this.lostT) this.lostT = 0.01;
      if (this.lostT) { this.lostT += dt; if (this.lostT > 1.6) { this.lostT = 0; setState("gameover"); } }
      if (G.result === "won") { setState("result"); }
    },
    draw(c) {
      c.save();
      if (G.shake > 0.3) c.translate(U.rand(-G.shake, G.shake), U.rand(-G.shake, G.shake));
      G.drawBoard(c);
      c.restore();
      G.drawHud(c);
      if (this.paused) {
        c.fillStyle = "rgba(0,0,0,0.55)"; c.fillRect(0, 0, W, H);
        D.panel(c, W / 2 - 220, 150, 440, 420);
        D.text(c, "Paused", W / 2, 205, 44, "#5a3a17", "center", { outline: false });
        drawButtons(c, PAUSE.btns);
      }
      cursor(c);
    },
  };

  /* ================= RESULT (award) ================= */
  const NOTES = [
    "Dear neighbor,\nwe would love to drop by tonight for a snack. Please leave the door open.\n\nWarm regards, the zombies",
    "Dear homeowner,\nwe hear you have a pool. We have brought our rubber rings.\n\nSee you soon, the zombies",
    "Dear friend,\nit is getting very foggy. Do not worry, we can smell our way to your brains.\n\nThe zombies",
    "Hello up there,\nwe are coming over the roof next. We have ladders. And a catapult.\n\nYours, the zombies",
  ];
  States.result = {
    btns: [],
    enter() {
      const spec = current.spec;
      this.t = 0; this.msg = ""; this.kind = spec.award || "money"; this.money = 0;
      if (spec.mode === "adventure") {
        const first = spec.L >= Save.d.adv;
        if (first) Save.d.adv = spec.L + 1;
        if (!first && P[this.kind]) this.kind = "money";
        if (this.kind === "note") this.msg = NOTES[Math.floor(spec.L / 10)] || "";
      } else if (spec.mode === "mini") Save.d.mini[current.item.id] = true;
      else if (spec.mode === "puzzle") Save.d.puzzle[current.item.id] = true;
      else if (spec.mode === "survival" || spec.survival) Save.d.surv[current.item.id] = true;
      if (this.kind === "money") { this.money = 250; Save.addCoins(250); }
      if (this.kind === "trophy") { this.money = 1000; Save.addCoins(1000); }
      Save.save();
      A.say(P[this.kind] ? "You got a new plant!" : this.kind === "trophy" ? "You won! The garden is safe." : "Level complete!", { force: true });
      this.build();
    },
    build() {
      const spec = current.spec;
      this.btns = [];
      if (spec.mode === "adventure" && spec.L < 49) this.btns.push({ x: W / 2 + 20, y: 590, w: 300, h: 66, label: "Next level", act: () => startSpec(GS.ADVENTURE[spec.L + 1], "adventure") });
      this.btns.push({ x: spec.mode === "adventure" && spec.L < 49 ? W / 2 - 320 : W / 2 - 150, y: 590, w: 300, h: 66, label: "Menu", color: "#8a5a2b", act: () => setState(spec.mode === "adventure" ? "adventure" : current.from || "title") });
      focusFirst(this.btns);
    },
    input() { if (this.t > 0.8) runButtons(this.btns); },
    update(dt) { this.t += dt; },
    draw(c) {
      G.drawBoard(c);
      c.fillStyle = `rgba(255,250,220,${Math.min(0.85, this.t)})`; c.fillRect(0, 0, W, H);
      if (this.t < 0.6) return;
      D.panel(c, 240, 60, 800, 500, "#f8f0d8");
      const k = this.kind;
      if (P[k]) {
        D.text(c, "You got a new plant!", W / 2, 120, 44, "#ffe14a");
        c.save(); c.translate(W / 2, 330); c.scale(1.8, 1.8); P[k].draw(c, G.dummyPlant(k)); c.restore();
        D.text(c, P[k].name, W / 2, 380, 36, "#5a3a17", "center", { outline: false });
        D.para(c, P[k].desc, 330, 410, 620, 22, "#3a2a10");
        D.text(c, "Cost: " + P[k].cost + " sun", W / 2, 500, 22, "#7a5a2a", "center", { outline: false, font: D.FONT2, weight: 900 });
      } else if (k === "note") {
        D.text(c, "You found a note!", W / 2, 120, 44, "#ffe14a");
        D.rr(c, 360, 160, 560, 350, 6, "#fffbe8", D.OUT, 3);
        D.para(c, this.msg, 390, 190, 500, 24, "#3a3a6a", 1.35);
      } else if (k === "trophy") {
        D.text(c, "Victory!", W / 2, 120, 56, "#ffe14a");
        D.poly(c, [W / 2 - 60, 170, W / 2 + 60, 170, W / 2 + 40, 260, W / 2 - 40, 260], "#ffd23a", D.OUT, 4);
        D.rr(c, W / 2 - 12, 260, 24, 40, 4, "#e8b020", D.OUT, 3); D.rr(c, W / 2 - 50, 300, 100, 26, 6, "#a87a10", D.OUT, 3);
        D.para(c, "Dr. Zed and his robot are beaten. Your garden is safe… for now. Everything is unlocked: try the mini-games, puzzles and survival levels.", 330, 360, 620, 22, "#3a2a10");
      } else {
        D.text(c, "Level complete!", W / 2, 140, 52, "#ffe14a");
        D.ellipse(c, W / 2, 310, 70, 62, "#c8a050", D.OUT, 4); D.rr(c, W / 2 - 22, 232, 44, 26, 8, "#a88030", D.OUT, 4);
        D.text(c, "$", W / 2, 314, 60, "#6a4a10", "center", { outline: false });
      }
      if (this.money) D.text(c, "+$" + this.money, W / 2, 540 - (P[k] ? 0 : 0), 28, "#3a8a1a", "center", { outline: false });
      drawButtons(c, this.btns);
      cursor(c);
    },
  };

  /* ================= GAME OVER ================= */
  function endGame() {
    const spec = current.spec;
    if (spec.endless) {
      const it = current.item;
      const score = spec.vase ? G.streak || 0 : spec.izombie ? G.streak || 0 : G.flagsDone;
      if (score > (Save.d.best[it.id] || 0)) { Save.d.best[it.id] = score; Save.save(); }
      if (spec.survival && score > 0 && HS.rank(score) >= 0) { setState("nameentry", { score }); return; }
      if (spec.survival) { setState("highscores"); return; }
    }
    setState(current.from === "adventure" ? "adventure" : current.from || "title");
  }
  States.gameover = {
    btns: [],
    enter() {
      this.t = 0;
      A.jingle("gameover");
      A.say(G.lost === "brains" ? "The zombies ate your brains!" : "Game over", { force: true });
      this.btns = [
        { x: W / 2 - 320, y: 520, w: 300, h: 66, label: "Try again", act: () => restart() },
        { x: W / 2 + 20, y: 520, w: 300, h: 66, label: "Menu", color: "#8a5a2b", act: () => endGame() },
      ];
      if (current.spec.endless) this.btns[0].label = "Play again";
      focusFirst(this.btns);
    },
    input() { if (this.t > 1) runButtons(this.btns); },
    update(dt) { this.t += dt; G.t += dt; },
    draw(c) {
      G.drawBoard(c);
      c.fillStyle = `rgba(20,0,0,${Math.min(0.7, this.t)})`; c.fillRect(0, 0, W, H);
      const s = Math.min(1, this.t * 1.5);
      c.save(); c.translate(W / 2, 300); c.scale(s, s); c.rotate(Math.sin(this.t * 3) * 0.03);
      if (G.lost === "brains") { D.text(c, "THE ZOMBIES", 0, -60, 90, "#9ae04a", "center", { lw: 16 }); D.text(c, "ATE YOUR BRAINS!", 0, 40, 90, "#9ae04a", "center", { lw: 16 }); }
      else D.text(c, G.lost || "Game over", 0, 0, 64, "#ffe14a");
      c.restore();
      const spec = current.spec;
      if (spec.endless) D.text(c, spec.survival ? `Flags survived: ${G.flagsDone}` : `Streak: ${G.streak || 0}`, W / 2, 450, 32, "#fff");
      if (this.t > 1) drawButtons(c, this.btns);
      cursor(c);
    },
  };

  /* ================= ALMANAC ================= */
  const ZKNOWN = { walker: 0, flag: 9, cone: 2, pole: 5, bucket: 7, paper: 10, door: 12, football: 15, dancer: 17, backup: 17, floatie: 20, snorkel: 22, zamboni: 25, bobsled: 26, dolphin: 27, jack: 30, balloon: 32, miner: 35, pogo: 37, yeti: 39, bungee: 40, ladder: 42, catapult: 45, giant: 47, imp: 47, redeye: 49, peahead: 22, nuthead: 22, zed: 49 };
  States.almanac = {
    btns: [], tab: "plants", sel: null,
    enter() { A.playSong("shop"); this.build(); focusFirst(this.btns); },
    build() {
      this.btns = [];
      const have = Save.plants(), p = Save.progress();
      const ids = this.tab === "plants" ? GS.PLANT_ORDER : GS.ZOMBIE_ORDER;
      const cols = 8, s = 72;
      ids.forEach((id, i) => {
        const known = this.tab === "plants" ? have.includes(id) || (P[id].upgradeOf && have.includes(P[id].upgradeOf)) : Save.d.unlockAll || p > (ZKNOWN[id] ?? 99) || (id === "walker");
        this.btns.push({ x: 40 + (i % cols) * (s + 6), y: 120 + Math.floor(i / cols) * (s + 6), w: s, h: s, id, known, custom: true, kind: "cell" });
      });
      this.btns.push({ x: 40, y: 50, w: 200, h: 52, label: "Plants", color: this.tab === "plants" ? "#6fbf3a" : "#8a8a7a", act: () => { this.tab = "plants"; this.sel = null; this.build(); } });
      this.btns.push({ x: 252, y: 50, w: 200, h: 52, label: "Zombies", color: this.tab === "zombies" ? "#6fbf3a" : "#8a8a7a", act: () => { this.tab = "zombies"; this.sel = null; this.build(); } });
      this.btns.push(backBtn("title"));
      if (!this.sel) this.sel = this.btns[0].id;
    },
    input() {
      const b = runButtons(this.btns);
      if (b && b.kind === "cell") this.sel = b.id;
      const hb = this.btns.find((x) => x.kind === "cell" && inR(I.mouse, x));
      if (hb && I.mouse.moved && I.lastDevice !== "mouse") this.sel = hb.id;
      if (hb && I.lastDevice !== "mouse") this.sel = hb.id;
      if (I.hit("back")) { A.sfx("menuBack"); setState("title"); }
    },
    update() {},
    draw(c) {
      backdrop(c, 1 / 60, 0.7);
      D.text(c, "Almanac", W - 330, 70, 50, "#fff");
      for (const b of this.btns) {
        if (b.kind !== "cell") continue;
        const sel = this.sel === b.id;
        D.rr(c, b.x, b.y, b.w, b.h, 10, sel ? "#f8e8a8" : b.known ? "#e8dcb8" : "#6a6a5a", sel ? "#fff" : D.OUT, sel ? 4 : 2.5);
        c.save(); c.beginPath(); c.rect(b.x + 2, b.y + 2, b.w - 4, b.h - 4); c.clip();
        if (!b.known) D.text(c, "?", b.x + b.w / 2, b.y + b.h / 2, 34, "#aaa");
        else if (this.tab === "plants") G.drawPlantIcon(c, b.id, b.x + b.w / 2, b.y + b.h - 8, P[b.id].wide ? 0.3 : 0.48);
        else if (b.id === "zed") GS.Boss.drawZed(c, b.x + b.w / 2, b.y + b.h + 10, 0.42);
        else G.drawPlantIcon(c, b.id, b.x + b.w / 2, b.y + b.h + (Z[b.id].scale > 1 ? 40 : 20), 0.42 / (Z[b.id].scale || 1), true);
        c.restore();
      }
      // detail
      const b = this.btns.find((x) => x.id === this.sel);
      D.panel(c, 690, 110, 560, 560, "#f8f0d8");
      if (b && b.known) {
        if (this.tab === "plants") {
          const d = P[b.id];
          D.rr(c, 790, 130, 360, 240, 16, G.night ? "#2e5a32" : "#77c447", D.OUT, 3);
          c.save(); c.translate(970 - (d.wide ? 50 : 0), 340); c.scale(1.6, 1.6); d.draw(c, G.dummyPlant(b.id)); c.restore();
          D.text(c, d.name, 970, 400, 34, "#5a3a17", "center", { outline: false });
          let y = D.para(c, d.desc, 720, 425, 500, 21, "#3a2a10");
          D.para(c, d.stats + ".", 720, y + 4, 500, 19, "#6a4a1a");
          D.text(c, `Cost: ${d.cost}`, 720, 630, 22, "#3a2a10", "left", { outline: false, font: D.FONT2, weight: 900 });
          D.text(c, `Recharge: ${d.recharge >= 50 ? "very slow" : d.recharge >= 30 ? "slow" : "fast"}`, 900, 630, 22, "#3a2a10", "left", { outline: false, font: D.FONT2, weight: 900 });
          if (d.upgradeOf) D.text(c, "Upgrade · sold by Gus", 1210, 600, 16, "#a85a10", "right", { outline: false, font: D.FONT2, weight: 900 });
        } else {
          const d = Z[b.id];
          D.rr(c, 790, 130, 360, 240, 16, "#7d8085", D.OUT, 3);
          if (b.id === "zed") GS.Boss.drawZed(c, 970, 360, 1.2);
          else { c.save(); c.translate(970, 350); const s = 1.2 / (d.scale || 1) * (d.vehicle ? 0.9 : 1); c.scale(s, s); d.draw(c, G.dummyZombie(b.id, performance.now() / 1000)); c.restore(); }
          D.text(c, d.name, 970, 400, 34, "#5a3a17", "center", { outline: false });
          D.para(c, d.desc, 720, 425, 500, 21, "#3a2a10");
          D.text(c, `Toughness: ${d.tough || "Low"}`, 720, 630, 22, "#3a2a10", "left", { outline: false, font: D.FONT2, weight: 900 });
        }
      } else D.text(c, "Not discovered yet", 970, 380, 30, "#8a7a5a", "center", { outline: false });
      drawButtons(c, this.btns.filter((x) => !x.custom));
      cursor(c);
    },
  };

  /* ================= SHOP ================= */
  const SHOP_EXTRA = [
    { id: "poolCleaner", name: "Pool Cleaners", price: 1000, req: 20, desc: "Protect the pool lanes like lawn mowers do." },
    { id: "roofCleaner", name: "Roof Cleaners", price: 3000, req: 40, desc: "Protect the roof lanes like lawn mowers do." },
  ];
  const SLOT_PRICE = { 6: 750, 7: 3000, 8: 10000, 9: 25000 };
  States.shop = {
    btns: [], msg: "", sel: null,
    enter() { A.playSong("shop"); this.msg = "Welcome, neighbor! Have a look around."; this.build(); focusFirst(this.btns); },
    build() {
      const items = [];
      const p = Save.progress(), have = Save.plants();
      if (Save.d.slots < 10) items.push({ id: "slot", name: `Seed slot #${Save.d.slots + 1}`, price: SLOT_PRICE[Save.d.slots], desc: "One more seed packet to take into battle.", icon: "slot" });
      for (const u of GS.UPGRADES) {
        const d = P[u];
        if (Save.d.owned[u]) continue;
        items.push({ id: u, name: d.name, price: d.price, desc: d.desc, plant: u, locked: !have.includes(d.upgradeOf) });
      }
      for (const e of SHOP_EXTRA) if (!Save.d.owned[e.id]) items.push(Object.assign({ locked: p < e.req }, e));
      this.btns = items.map((it, i) => ({ x: 420 + (i % 4) * 206, y: 120 + Math.floor(i / 4) * 170, w: 194, h: 158, it, custom: true, kind: "item", disabled: it.locked, focusable: true }));
      this.btns.push(backBtn("title"));
    },
    buy(it) {
      if (Save.d.coins < it.price) { this.msg = "You need more money for that one."; A.sfx("deny"); return; }
      Save.d.coins -= it.price;
      if (it.id === "slot") Save.d.slots++;
      else Save.d.owned[it.id] = true;
      Save.save();
      A.sfx("coin");
      this.msg = "Pleasure doing business with you!";
      A.say("Thank you!", { pitch: 1.1 });
      this.build();
    },
    input() {
      const b = runButtons(this.btns);
      if (b && b.kind === "item") this.buy(b.it);
      const hb = this.btns.find((x) => x.kind === "item" && inR(I.mouse, x));
      this.sel = hb ? hb.it : null;
      if (I.hit("back")) { A.sfx("menuBack"); setState("title"); }
    },
    update() {},
    draw(c) {
      backdrop(c, 1 / 60, 0.55);
      // Gus, the neighbor
      const t = deco.t;
      c.save(); c.translate(200, 650);
      c.scale(2, 2);
      D.rr(c, -30, -130, 60, 80, 14, "#4a7ab8", D.OUT, 3);
      D.line(c, -12, -52, -14, -4, D.OUT, 12); D.line(c, 12, -52, 14, -4, D.OUT, 12);
      D.line(c, -12, -52, -14, -4, "#6a5030", 8); D.line(c, 12, -52, 14, -4, "#6a5030", 8);
      D.ellipse(c, 0, -152, 24, 26, "#f2c8a0", D.OUT, 3);
      D.ellipse(c, 0, -134, 20, 12, "#8a6a4a", D.OUT, 2.5);
      D.circle(c, -9, -158, 3, "#222", null, 0); D.circle(c, 9, -158, 3, "#222", null, 0);
      D.ellipse(c, 0, -178, 44, 8, "#e8c860", D.OUT, 2.5); D.rr(c, -22, -200, 44, 24, 8, "#e8c860", D.OUT, 2.5);
      c.restore();
      D.rr(c, 40, 140, 340, 120, 18, "#fffbe8", D.OUT, 3);
      D.poly(c, [180, 258, 220, 258, 196, 290], "#fffbe8", null, 0);
      D.para(c, this.sel ? this.sel.desc : this.msg, 60, 158, 300, 19, "#3a2a10");
      D.text(c, "Gus's Garden Shop", 210, 70, 34, "#fff");
      D.rr(c, W - 250, 30, 220, 50, 12, "rgba(0,0,0,0.45)", null, 0);
      D.coin(c, W - 222, 55, "gold", 0);
      D.text(c, "$" + U.fmt(Save.d.coins), W - 120, 56, 26, "#ffe14a");
      for (const b of this.btns) {
        if (b.kind !== "item") continue;
        const it = b.it, hov = inR(I.mouse, b);
        D.rr(c, b.x, b.y - (hov ? 3 : 0), b.w, b.h, 14, it.locked ? "#7a7a6a" : "#f2e6b7", D.OUT, 3);
        if (it.locked) { D.text(c, "Sold out… for now", b.x + b.w / 2, b.y + b.h / 2, 16, "#ddd"); continue; }
        if (it.plant) G.drawPlantIcon(c, it.plant, b.x + b.w / 2, b.y + 100, P[it.plant].wide ? 0.35 : 0.65);
        else if (it.icon === "slot") D.packet(c, "pea", b.x + b.w / 2 - 31, b.y + 14, { cost: false });
        else D.mower(c, b.x + b.w / 2 + 10, b.y + 96, it.id === "poolCleaner" ? "pool" : "roof");
        D.text(c, it.name, b.x + b.w / 2, b.y + 120, it.name.length > 14 ? 15 : 18, "#5a3a17", "center", { outline: false });
        D.text(c, "$" + U.fmt(it.price), b.x + b.w / 2, b.y + 144, 18, Save.d.coins >= it.price ? "#2a7a1a" : "#a83020", "center", { outline: false, font: D.FONT2, weight: 900 });
      }
      if (this.btns.filter((b) => b.kind === "item").length === 0) D.text(c, "You bought everything!", 840, 300, 34, "#fff");
      drawButtons(c, this.btns.filter((b) => !b.custom));
      cursor(c);
    },
  };

  /* ================= OPTIONS ================= */
  States.options = {
    btns: [], confirm: false,
    enter() { this.confirm = false; this.build(); focusFirst(this.btns); },
    build() {
      const x = W / 2 - 300, w = 600, h = 56, M = GS.Main;
      const pct = (v) => Math.round(v * 100) + " %";
      this.btns = [
        { x, y: 130, w: 120, h, label: "−", act: () => { A.setMusicVol(U.clamp(A.musicVol - 0.1, 0, 1)); this.build(); } },
        { x: x + w - 120, y: 130, w: 120, h, label: "+", act: () => { A.setMusicVol(U.clamp(A.musicVol + 0.1, 0, 1)); this.build(); } },
        { x, y: 200, w: 120, h, label: "−", act: () => { A.setSfxVol(U.clamp(A.sfxVol - 0.1, 0, 1)); this.build(); A.sfx("sun"); } },
        { x: x + w - 120, y: 200, w: 120, h, label: "+", act: () => { A.setSfxVol(U.clamp(A.sfxVol + 0.1, 0, 1)); this.build(); A.sfx("sun"); } },
        { x, y: 270, w, h, label: "Voice: " + (A.voiceOn ? "on" : "off"), act: () => { A.setVoice(!A.voiceOn); this.build(); } },
        { x, y: 340, w, h, label: "Collect sun and coins automatically: " + (M.autoCollect ? "on" : "off"), size: 22, act: () => { M.autoCollect = !M.autoCollect; Store.set("autoCollect", M.autoCollect); this.build(); } },
        { x, y: 410, w, h, label: "Keep the screen awake: " + (M.keepAwake ? "on" : "off"), size: 24, act: () => { M.keepAwake = !M.keepAwake; Store.set("keepAwake", M.keepAwake); this.build(); } },
        { x, y: 480, w, h, label: "Fullscreen (F)", act: () => M.toggleFullscreen() },
        { x, y: 550, w: 290, h, label: "Unlock everything: " + (Save.d.unlockAll ? "on" : "off"), size: 20, color: "#4a9ad8", act: () => { Save.d.unlockAll = !Save.d.unlockAll; Save.save(); this.build(); } },
        { x: x + 310, y: 550, w: 290, h, label: this.confirm ? "Really reset?" : "Reset progress", size: 22, color: "#c84a3a", act: () => { if (this.confirm) { Save.reset(); this.confirm = false; } else this.confirm = true; this.build(); } },
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
      D.text(c, "Music " + this.pct[0], W / 2, 158, 26, "#fff");
      D.text(c, "Effects " + this.pct[1], W / 2, 228, 26, "#fff");
      cursor(c);
    },
  };

  /* ================= HELP ================= */
  States.help = {
    btns: [],
    enter() { this.btns = [backBtn("title")]; focusFirst(this.btns); },
    input() { runButtons(this.btns); if (I.hit("back") || I.hit("click")) { A.sfx("menuBack"); setState("title"); } },
    update() {},
    draw(c) {
      backdrop(c, 1 / 60, 0.7);
      title(c, "How to play", 60, 52);
      D.panel(c, 60, 100, 560, 520, "#f8f0d8");
      D.panel(c, 660, 100, 560, 520, "#f8f0d8");
      D.text(c, "The garden", 340, 140, 28, "#5a3a17", "center", { outline: false });
      D.para(c, "Zombies walk in from the street on the right. Stop them before they reach your house.\n\nCollect sun by clicking it. Pick a seed packet, then click a tile to plant it. Packets need time to recharge.\n\nEvery lane has one lawn mower as a last line of defense. Mushrooms sleep in daylight unless you wake them with a Wake Bean. On water, plant a Lily Raft first; on the roof, a Clay Pot. Straight shots from the left half of the roof hit the slope, so catapult plants work best up there.\n\nCoins dropped by zombies buy upgrades and seed slots in Gus's shop.", 90, 170, 500, 18, "#3a2a10", 1.3);
      D.text(c, "Controls", 940, 140, 28, "#5a3a17", "center", { outline: false });
      D.para(c, "Mouse or touch: click (tap) everything. Right click cancels.\n\nKeyboard: arrow keys move the cursor tile by tile (up from the top row reaches the seed bank), Enter or Space clicks, 1–0 pick a packet, Q/E cycle packets, S shovel, C collect all sun and coins, P or Esc pause, M mute, F fullscreen.\n\nGamepad: left stick or D-pad moves the cursor, A clicks, B cancels, X shovel, Y collect, LB/RB cycle packets, Start pause.", 690, 170, 500, 18, "#3a2a10", 1.3);
      drawButtons(c, this.btns);
      cursor(c);
    },
  };

  /* ================= HIGH SCORES (endless survival) ================= */
  const HS = (GS.HS = {
    list() { return Store.get("hs", []); },
    rank(v) { const l = HS.list(); if (l.length < 10) { let i = l.findIndex((e) => v > e.flags); return i < 0 ? l.length : i; } const i = l.findIndex((e) => v > e.flags); return i; },
    add(name, flags) { const l = HS.list(); l.push({ name, flags, date: new Date().toISOString().slice(0, 10) }); l.sort((a, b) => b.flags - a.flags); l.length = Math.min(l.length, 10); Store.set("hs", l); return l.findIndex((e) => e.name === name && e.flags === flags); },
  });
  States.highscores = {
    btns: [], mark: -1,
    enter(arg) { this.mark = arg && arg.mark !== undefined ? arg.mark : -1; this.btns = [backBtn("list")]; this.btns[0].act = () => setState("list", "survival"); focusFirst(this.btns); },
    input() { runButtons(this.btns); if (I.hit("back")) setState("list", "survival"); },
    update() {},
    draw(c) {
      backdrop(c, 1 / 60, 0.7);
      title(c, "Endless Survival · Best gardeners", 70, 46);
      D.panel(c, W / 2 - 330, 110, 660, 520, "#f8f0d8");
      const l = HS.list();
      if (!l.length) D.text(c, "No entries yet", W / 2, 360, 30, "#8a7a5a", "center", { outline: false });
      l.forEach((e, i) => {
        const y = 160 + i * 46, col = i === this.mark ? "#c84a10" : "#3a2a10";
        D.text(c, `${i + 1}.`, W / 2 - 270, y, 26, col, "left", { outline: false });
        D.text(c, e.name, W / 2 - 210, y, 26, col, "left", { outline: false });
        D.text(c, `${e.flags} flags`, W / 2 + 270, y, 26, col, "right", { outline: false });
      });
      drawButtons(c, this.btns);
      cursor(c);
    },
  };
  const KEYS = ["ABCDEFGHIJ", "KLMNOPQRST", "UVWXYZ0123", "456789 .-!"];
  States.nameentry = {
    name: "", score: 0,
    enter(arg) {
      this.score = arg.score; this.name = Store.get("lastName", "");
      this.btns = [];
      KEYS.forEach((row, r) => [...row].forEach((ch, c) => this.btns.push({ x: W / 2 - 330 + c * 66, y: 300 + r * 62, w: 58, h: 52, label: ch === " " ? "␣" : ch, ch, size: 24, act: () => { if (this.name.length < 10) this.name += ch; } })));
      this.btns.push({ x: W / 2 - 330, y: 300 + 4 * 62, w: 190, h: 52, label: "Delete", size: 22, color: "#c84a3a", act: () => { this.name = this.name.slice(0, -1); } });
      this.btns.push({ x: W / 2 - 124, y: 300 + 4 * 62, w: 250, h: 52, label: "Save", size: 24, act: () => this.save() });
      this.btns.push({ x: W / 2 + 142, y: 300 + 4 * 62, w: 190, h: 52, label: "Skip", size: 22, color: "#8a5a2b", act: () => setState("highscores") });
      focusFirst(this.btns);
    },
    save() {
      const n = this.name.trim() || "GARDENER";
      Store.set("lastName", n);
      const pos = HS.add(n, this.score);
      setState("highscores", { mark: pos });
    },
    input() {
      for (const ch of I.typed) { const c = ch.toUpperCase(); if (/^[A-Z0-9 .\-!ÄÖÜ]$/.test(c) && this.name.length < 10) this.name += c; }
      if (I.pressed.has("Backspace")) this.name = this.name.slice(0, -1);
      if (I.pressed.has("Enter") || I.pressed.has("NumpadEnter")) { this.save(); return; }
      navigate(this.btns);
      if (I.mouse.clicked && I.lastDevice !== "keyboard") for (const b of this.btns) if (inR(I.mouse, b)) { A.sfx("menuMove"); b.act(); }
    },
    update() {},
    draw(c) {
      backdrop(c, 1 / 60, 0.7);
      title(c, "New high score!", 80, 56);
      D.text(c, `${this.score} flags survived`, W / 2, 150, 30, "#ffe14a");
      D.rr(c, W / 2 - 250, 200, 500, 70, 14, "#fffbe8", D.OUT, 3);
      D.text(c, this.name + (Math.sin(performance.now() / 200) > 0 ? "_" : ""), W / 2, 236, 40, "#3a2a10", "center", { outline: false });
      drawButtons(c, this.btns);
      cursor(c);
    },
  };
})(window.GS);
