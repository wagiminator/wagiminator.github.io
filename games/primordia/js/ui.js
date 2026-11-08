/* PRIMORDIA: screens – title, options, controls, trading post (shop), HUD, highscores, name entry */
"use strict";

(function (XA) {
  const { U, Gfx, Fx, G, Store } = XA;
  const A = XA.Audio, I = XA.Input;
  const W = U.W, H = U.H, TAU = U.TAU;
  const PX = (XA.PX = (W - G.PW) / 2);
  const States = (XA.States = {});
  let setState = null;
  XA.UI = { bind(fn) { setState = fn; } };

  const FONT = "Orbitron, 'Arial Black', Arial, sans-serif";
  const BODY = "Rajdhani, 'Segoe UI', Arial, sans-serif";
  function txt(ctx, s, x, y, size, color = "#fff", align = "center", weight = 700, font = FONT) {
    ctx.font = `${weight} ${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = "middle"; ctx.fillStyle = color; ctx.fillText(s, x, y);
  }
  function glowTxt(ctx, s, x, y, size, color, glow, blur = 18, align = "center") {
    ctx.save(); ctx.shadowColor = glow; ctx.shadowBlur = blur; txt(ctx, s, x, y, size, color, align, 900); ctx.restore();
  }
  function panel(ctx, x, y, w, h, alpha = 0.72, border = "rgba(255,190,110,0.35)") {
    ctx.fillStyle = `rgba(18,10,6,${alpha})`;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill();
    ctx.strokeStyle = border; ctx.lineWidth = 1.5; ctx.stroke();
  }
  function inRect(m, x, y, w, h) { return m.x >= x && m.x <= x + w && m.y >= y && m.y <= y + h; }
  function wrap(ctx, s, x, y, w, lh, size, color = "rgba(240,230,215,0.95)", align = "left") {
    ctx.font = `600 ${size}px ${BODY}`; ctx.textAlign = align; ctx.textBaseline = "middle"; ctx.fillStyle = color;
    let line = "", yy = y;
    for (const word of s.split(" ")) {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > w && line) { ctx.fillText(line, x, yy); line = word; yy += lh; } else line = test;
    }
    if (line) ctx.fillText(line, x, yy);
  }

  /* ---------- Animated backdrop (scrolling playfield in the middle) ---------- */
  const backdrop = {
    dist: 0, t: 0, walls: null, theme: "ocean", ships: [],
    update(dt) {
      if (!this.walls) this.walls = G.makeWalls({ seed: 77, walls: { base: 30, amp: 120, scale: 500 } });
      this.t += dt; this.dist += 60 * dt;
      if (Math.random() < dt * 0.9) this.ships.push({ x: U.rand(140, W - 140), y: -40, vy: U.rand(50, 110), spr: U.pick(["tribug", "ammo", "jelly", "fly", "spore"]), a: U.rand(-0.3, 0.3) });
      for (const s of this.ships) s.y += s.vy * dt;
      this.ships = this.ships.filter((s) => s.y < H + 60);
      Fx.update(dt);
    },
    draw(ctx, theme) {
      if (!this.walls) this.update(0);
      const th = theme || this.theme;
      ctx.save();
      ctx.scale(W / G.PW, W / G.PW);
      ctx.translate(0, -((W / G.PW) * H - H) / 2 / (W / G.PW));
      Gfx.drawBackground(ctx, th, this.dist, this.t);
      Gfx.drawWalls(ctx, th, this.dist, this.walls, this.t);
      ctx.restore();
      for (const s of this.ships) { ctx.globalAlpha = 0.5; Gfx.draw(ctx, s.spr, s.x, s.y, s.a, 0.9); ctx.globalAlpha = 1; }
      Fx.draw(ctx);
      ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.fillRect(0, 0, W, H);
    },
  };

  /* ---------- Menu helper ---------- */
  function makeMenu(items, x, y, w = 420, h = 50, gap = 10) { return { items, sel: 0, x, y, w, h, gap }; }
  function menuIndexAt(m) { for (let i = 0; i < m.items.length; i++) if (inRect(I.mouse, m.x - m.w / 2, m.y + i * (m.h + m.gap), m.w, m.h)) return i; return -1; }
  function menuInput(m) {
    const n = m.items.length;
    if (I.hit("up")) { m.sel = (m.sel + n - 1) % n; A.sfx("menuMove"); }
    if (I.hit("down")) { m.sel = (m.sel + 1) % n; A.sfx("menuMove"); }
    const hi = menuIndexAt(m);
    if (I.mouse.moved && hi >= 0 && hi !== m.sel) { m.sel = hi; A.sfx("menuMove"); }
    const it = m.items[m.sel];
    if (it.adjust) { if (I.hit("left")) it.adjust(-1); if (I.hit("right")) it.adjust(1); if (I.mouse.wheel && hi === m.sel) it.adjust(-I.mouse.wheel); }
    if (I.hit("confirm") || (I.mouse.clicked && hi === m.sel && hi >= 0)) { if (it.action) { A.sfx("menuOk"); it.action(); } else if (it.adjust) it.adjust(1, true); }
  }
  function menuDraw(ctx, m, t) {
    m.items.forEach((it, i) => {
      const y = m.y + i * (m.h + m.gap), x = m.x - m.w / 2, sel = i === m.sel;
      if (sel) {
        const gr = ctx.createLinearGradient(x, 0, x + m.w, 0);
        gr.addColorStop(0, "rgba(255,150,40,0)"); gr.addColorStop(0.5, `rgba(255,150,40,${0.38 + 0.1 * Math.sin(t * 5)})`); gr.addColorStop(1, "rgba(255,150,40,0)");
        ctx.fillStyle = gr; ctx.fillRect(x, y, m.w, m.h);
        ctx.strokeStyle = "rgba(255,220,160,0.85)"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x + 40, y); ctx.lineTo(x + m.w - 40, y); ctx.moveTo(x + 40, y + m.h); ctx.lineTo(x + m.w - 40, y + m.h); ctx.stroke();
      }
      const label = typeof it.label === "function" ? it.label() : it.label;
      txt(ctx, label, m.x, y + m.h / 2 + 1, sel ? 25 : 22, sel ? "#ffffff" : "rgba(240,220,195,0.85)");
    });
  }

  /* ---------- Highscores ---------- */
  const DEFAULT_HS = [["TRILOBYTE", 150000], ["AMBER", 120000], ["RAPTOR", 95000], ["NAUTILUS", 75000], ["FERN", 55000], ["MAMMOTH", 40000], ["SPORE", 28000], ["SILT", 18000], ["FOSSIL", 10000], ["CELL", 5000]]
    .map(([name, score], i) => ({ name, score, stage: i < 2 ? 4 : i < 5 ? 3 : i < 8 ? 2 : 1, date: "" }));
  const HS = (XA.HS = {
    list() { const l = Store.get("scores", null); return Array.isArray(l) && l.length ? l : DEFAULT_HS.slice(); },
    rank(score) { if (score <= 0) return -1; const l = HS.list(); let i = 0; while (i < l.length && l[i].score >= score) i++; return i < 10 ? i : -1; },
    add(name, score, stage) {
      const l = HS.list(), e = { name, score, stage, date: new Date().toISOString().slice(0, 10) };
      l.push(e); l.sort((a, b) => b.score - a.score);
      const out = l.slice(0, 10); Store.set("scores", out); return out.indexOf(e);
    },
  });

  /* ---------- Logo ---------- */
  function drawLogo(ctx, t, y, size = 118) {
    ctx.save();
    ctx.font = `900 ${size}px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(255,120,30,0.9)"; ctx.shadowBlur = 36 + 10 * Math.sin(t * 2);
    const gr = ctx.createLinearGradient(0, y - size / 2, 0, y + size / 2);
    gr.addColorStop(0, "#fff8e0"); gr.addColorStop(0.45, "#ffc060"); gr.addColorStop(0.55, "#a04a10"); gr.addColorStop(1, "#ffe0a0");
    ctx.fillStyle = gr; ctx.fillText("PRIMORDIA", W / 2, y);
    ctx.shadowBlur = 0; ctx.lineWidth = 2; ctx.strokeStyle = "rgba(60,20,0,0.8)"; ctx.strokeText("PRIMORDIA", W / 2, y);
    ctx.restore();
    txt(ctx, "T I M E   R I F T   A S S A U L T", W / 2, y + size * 0.62, 22, "rgba(140,230,255,0.95)");
  }

  /* ---------- Boot ---------- */
  States.boot = {
    t: 0,
    enter() { this.t = 0; },
    input() { if (this.t > 0.2 && (I.pressed.size || I.mouse.clicked || I.pad.pressed.size)) { A.init(); setState("title"); } },
    update(dt) { this.t += dt; backdrop.update(dt); },
    draw(ctx) {
      backdrop.draw(ctx);
      drawLogo(ctx, this.t, H / 2 - 70);
      txt(ctx, "PRESS ANY KEY OR CLICK", W / 2, H / 2 + 110, 24, `rgba(255,240,220,${0.55 + 0.45 * Math.sin(this.t * 4)})`);
      txt(ctx, "Keyboard · Mouse · Gamepad", W / 2, H / 2 + 150, 20, "rgba(240,220,190,0.75)", "center", 500, BODY);
    },
  };

  /* ---------- Title ---------- */
  States.title = {
    t: 0, idle: 0,
    menu: makeMenu([
      { label: "START GAME", action: () => { G.newRun(); setState("play", { level: 0, half: 0 }); } },
      { label: "HIGHSCORES", action: () => setState("highscores") },
      { label: "OPTIONS", action: () => setState("options", "title") },
      { label: "CONTROLS", action: () => setState("controls") },
    ], W / 2, 340),
    enter() { this.t = 0; this.idle = 0; A.playSong("title"); XA.Main.setCursor(true); },
    input() { if (I.pressed.size || I.mouse.moved || I.pad.pressed.size || I.pad.dir.size) this.idle = 0; menuInput(this.menu); },
    update(dt) { this.t += dt; this.idle += dt; backdrop.update(dt); if (this.idle > 30) setState("highscores", { attract: true }); },
    draw(ctx) {
      backdrop.draw(ctx);
      drawLogo(ctx, this.t, 170);
      menuDraw(ctx, this.menu, this.t);
      txt(ctx, "An homage to the Amiga classic Xenon 2 (1989). All graphics, music and code are original.", W / 2, H - 26, 17, "rgba(240,220,190,0.6)", "center", 500, BODY);
    },
  };

  /* ---------- Options ---------- */
  const pct = (v) => "▮".repeat(Math.round(v * 10)) + "▯".repeat(10 - Math.round(v * 10));
  States.options = {
    t: 0, back: "title",
    menu: makeMenu([
      { label: () => "MUSIC  " + pct(A.musicVol), adjust: (d, wrap) => { let v = Math.round((A.musicVol + d * 0.1) * 10) / 10; if (wrap && v > 1) v = 0; A.setMusicVol(U.clamp(v, 0, 1)); A.sfx("menuMove"); } },
      { label: () => "SOUND  " + pct(A.sfxVol), adjust: (d, wrap) => { let v = Math.round((A.sfxVol + d * 0.1) * 10) / 10; if (wrap && v > 1) v = 0; A.setSfxVol(U.clamp(v, 0, 1)); A.sfx("credit"); } },
      { label: () => "SCREEN SHAKE  " + (XA.Main.shakeOn ? "ON" : "OFF"), adjust: () => { XA.Main.shakeOn = !XA.Main.shakeOn; Store.set("shake", XA.Main.shakeOn); A.sfx("menuMove"); } },
      { label: () => "FULLSCREEN  " + (document.fullscreenElement ? "ON" : "OFF"), action: () => XA.Main.toggleFullscreen() },
      { label: "BACK", action: () => States.options.leave() },
    ], W / 2, 240, 560),
    enter(back) { this.t = 0; this.back = back || "title"; this.menu.sel = 0; },
    leave() { if (this.back === "play") setState("play", { resume: true }); else setState(this.back); },
    input() { if (I.hit("back")) { A.sfx("menuBack"); this.leave(); return; } menuInput(this.menu); },
    update(dt) { this.t += dt; if (this.back !== "play") backdrop.update(dt); },
    draw(ctx) {
      if (this.back === "play") { States.play.drawWorld(ctx); ctx.fillStyle = "rgba(10,4,0,0.72)"; ctx.fillRect(0, 0, W, H); } else backdrop.draw(ctx);
      glowTxt(ctx, "OPTIONS", W / 2, 150, 54, "#fff6e8", "rgba(255,130,30,0.8)");
      menuDraw(ctx, this.menu, this.t);
      txt(ctx, "◀ ▶ to change · F fullscreen · M mute", W / 2, H - 50, 20, "rgba(240,220,190,0.7)", "center", 500, BODY);
    },
  };

  /* ---------- Controls ---------- */
  States.controls = {
    t: 0,
    enter() { this.t = 0; },
    input() { if (I.hit("back") || I.hit("confirm") || I.mouse.clicked) { A.sfx("menuBack"); setState("title"); } },
    update(dt) { this.t += dt; backdrop.update(dt); },
    draw(ctx) {
      backdrop.draw(ctx);
      glowTxt(ctx, "CONTROLS", W / 2, 80, 52, "#fff6e8", "rgba(255,130,30,0.8)");
      const cols = [
        ["KEYBOARD", [["Move", "Arrow keys / WASD"], ["Fire (hold)", "Space / J / Y"], ["Smart bomb", "C / L / B / X"], ["Pause", "P / Esc"], ["Fullscreen", "F"], ["Mute", "M"]]],
        ["MOUSE", [["Move", "Ship follows the pointer"], ["Fire (hold)", "Left button"], ["Smart bomb", "Right button"], ["Menus", "Point and click"]]],
        ["GAMEPAD", [["Move", "Left stick / D-pad"], ["Fire (hold)", "A / RT"], ["Smart bomb", "B / X / LT"], ["Pause", "Start"]]],
      ];
      cols.forEach(([head, rows], c) => {
        const x = 70 + c * 390;
        panel(ctx, x, 130, 370, 330);
        txt(ctx, head, x + 185, 162, 24, "#ffc060");
        rows.forEach(([a, b], i) => {
          txt(ctx, a, x + 22, 204 + i * 44, 18, "rgba(240,215,180,0.75)", "left", 600, BODY);
          txt(ctx, b, x + 22, 226 + i * 44, 22, "#ffffff", "left", 700, BODY);
        });
      });
      panel(ctx, 70, 478, W - 140, 150, 0.72);
      const lines = [
        "Fly through four ages of evolution. Every stage has a trading post in the middle and at the end.",
        "Collect the golden credits and buy add-ons: side and rear shots, cannons, lasers, missiles, electro balls,",
        "drones, mines, zappers and more – they all fire at the same time. Losing a ship costs one add-on.",
        "Capsules: P power · W random weapon · S speed · H health · B bomb · O overdrive (all weapons at full power).",
      ];
      lines.forEach((l, i) => txt(ctx, l, W / 2, 506 + i * 30, 20, "rgba(245,235,220,0.95)", "center", 600, BODY));
      txt(ctx, "Press any button to return", W / 2, H - 40, 20, `rgba(240,220,190,${0.5 + 0.3 * Math.sin(this.t * 4)})`, "center", 600, BODY);
    },
  };

  /* ---------- Highscore screen ---------- */
  States.highscores = {
    t: 0, mark: -1, attract: false,
    enter(o) { this.t = 0; this.mark = o && o.mark !== undefined ? o.mark : -1; this.attract = !!(o && o.attract); if (!this.attract) A.playSong("title"); XA.Main.setCursor(true); },
    input() { if (this.t > 0.4 && (I.hit("back") || I.hit("confirm") || I.mouse.clicked || (this.attract && (I.pressed.size || I.pad.pressed.size)))) { A.sfx("menuBack"); setState("title"); } },
    update(dt) { this.t += dt; backdrop.update(dt); if (this.attract && this.t > 12) setState("title"); },
    draw(ctx) {
      backdrop.draw(ctx);
      glowTxt(ctx, "HIGHSCORES", W / 2, 80, 52, "#fff6e8", "rgba(255,130,30,0.8)");
      panel(ctx, W / 2 - 380, 130, 760, 510, 0.78);
      txt(ctx, "RANK", W / 2 - 330, 160, 16, "#ffc060", "left");
      txt(ctx, "NAME", W / 2 - 220, 160, 16, "#ffc060", "left");
      txt(ctx, "STAGE", W / 2 + 110, 160, 16, "#ffc060");
      txt(ctx, "SCORE", W / 2 + 340, 160, 16, "#ffc060", "right");
      HS.list().forEach((e, i) => {
        const y = 206 + i * 42, hl = i === this.mark;
        if (hl) { ctx.fillStyle = `rgba(255,150,40,${0.22 + 0.12 * Math.sin(this.t * 6)})`; ctx.fillRect(W / 2 - 360, y - 19, 720, 38); }
        const col = hl ? "#fff7b0" : i < 3 ? "#ffd27a" : "#f6ece0";
        txt(ctx, `${i + 1}.`, W / 2 - 330, y, 22, col, "left");
        txt(ctx, e.name, W / 2 - 220, y, 22, col, "left");
        txt(ctx, e.stage >= 5 ? "ALL" : String(e.stage), W / 2 + 110, y, 22, col);
        txt(ctx, U.fmt(e.score), W / 2 + 340, y, 22, col, "right");
      });
      txt(ctx, "Scores are saved in this browser.", W / 2, H - 40, 18, "rgba(240,220,190,0.6)", "center", 500, BODY);
    },
  };

  /* ---------- Trading post (shop) ---------- */
  const r = () => G.run;
  const SHOP = [
    { id: "main", name: "Power Up", prices: [0, 3000, 6000, 10000, 15000], desc: "More barrels for the main blaster (5 levels)." },
    { id: "side", name: "Side Shot", prices: [4000, 7000], desc: "Fires to the left and right; level 2 adds diagonal shots." },
    { id: "rear", name: "Rear Shot", prices: [3000, 5000], desc: "Protects your tail; level 2 fires a spread to the rear." },
    { id: "cannon", name: "Cannon", prices: [6000, 9000, 13000], desc: "Slow heavy plasma shells that punch through several enemies." },
    { id: "laser", name: "Laser", prices: [7000, 11000, 16000], desc: "Fast piercing beams from the wing tips; up to three emitters." },
    { id: "homing", name: "Homing Missiles", prices: [8000, 12000, 16000], desc: "Missiles that seek the nearest enemy. Two more with each level." },
    { id: "electro", name: "Electro Balls", prices: [6000, 10000], desc: "Energy balls orbit your ship, burn enemies and block shots." },
    { id: "drone", name: "Drones", prices: [7000, 11000], desc: "Little escorts that follow your path and fire along." },
    { id: "mines", name: "Mines", prices: [4000, 7000], desc: "Drops proximity mines behind you. Great against pursuers." },
    { id: "zapper", name: "Zapper", prices: [9000, 14000], desc: "Lightning that hits the nearest enemy; level 2 jumps to more." },
    { id: "rapid", name: "Rapid Fire", prices: [5000, 9000], desc: "All guns fire 15 % faster per level." },
    { id: "speed", name: "Speed Up", prices: [2000, 3500, 5000], desc: "A faster ship. Three levels." },
    { id: "armor", name: "Armour", prices: [5000, 8000], desc: "+30 maximum energy per level." },
    { id: "health", name: "Health", kind: "health", price: 2000, desc: "Repairs your ship completely." },
    { id: "bomb", name: "Smart Bomb", kind: "bomb", price: 3000, desc: "Clears all enemy shots and damages everything on screen (max. 5)." },
    { id: "over", name: "Overdrive", kind: "over", price: 12000, desc: "All weapons at full power for the first 20 seconds of the next stage." },
    { id: "life", name: "Extra Life", kind: "life", price: 15000, desc: "One more ship (max. 9)." },
  ];
  function price(it) {
    const run = r();
    if (it.kind) return it.price;
    const c = run.w[it.id];
    return it.id === "main" ? it.prices[c] : it.prices[c];
  }
  function itemState(it) {
    const run = r();
    let status = "buy", note = "", p = 0, sell = 0;
    if (!it.kind) {
      const c = run.w[it.id], max = G.WMAX[it.id];
      note = `${c}/${max}`;
      if (c >= max) status = "max"; else p = price(it);
      const min = it.id === "main" ? 1 : 0;
      if (c > min) sell = Math.floor((it.id === "main" ? it.prices[c - 1] : it.prices[c - 1]) / 2);
    } else {
      p = it.price;
      if (it.kind === "health" && run.energy >= G.maxEnergy()) status = "full";
      if (it.kind === "bomb") { note = `${run.bombs}`; if (run.bombs >= 5) status = "max"; }
      if (it.kind === "over" && run.overPending) status = "ready";
      if (it.kind === "life") { note = `${run.lives}`; if (run.lives >= 9) status = "max"; }
    }
    if (G.cheat) { p = 0; sell = 0; }
    return { status, note, price: p, sell };
  }
  const shop = { sellMode: false };
  function say(s) { States.shop.line = s; States.shop.talk = 1.6; A.sfx("merchant"); }
  function buy(it) {
    const run = r(), st = itemState(it);
    if (shop.sellMode) {
      if (it.kind || !st.sell && !G.cheat || (it.id === "main" ? run.w.main <= 1 : run.w[it.id] <= 0)) { A.sfx("deny"); say("Krix only buys back hardware, pilot."); return; }
      run.w[it.id]--; run.credits += st.sell;
      if (it.id === "armor") run.energy = Math.min(run.energy, G.maxEnergy());
      A.sfx("sell"); say(U.pick(["Half price, as always. Krix must eat too.", "Sold! Krix will polish it for the next pilot.", "A fine piece. Krix pays fair. Mostly."]));
      return;
    }
    if (st.status !== "buy") { A.sfx("deny"); say(st.status === "max" ? "That is as good as it gets, pilot." : "You already have that."); return; }
    if (run.credits < st.price) { A.sfx("deny"); say(U.pick(["Not enough credits. Krix does not do loans.", "Come back with more gold, pilot."])); return; }
    run.credits -= st.price;
    if (G.cheat) run.cheated = true;
    if (!it.kind) { run.w[it.id]++; if (it.id === "armor") run.energy += 30; }
    else if (it.kind === "health") run.energy = G.maxEnergy();
    else if (it.kind === "bomb") run.bombs++;
    else if (it.kind === "over") run.overPending = true;
    else if (it.kind === "life") run.lives++;
    A.sfx("buy"); say(U.pick(["Excellent choice!", "It suits your ship, pilot.", "Pleasure doing business.", "Bolted on and ready to fire!"]));
    States.shop.pop = 0.35;
  }
  function drawIcon(ctx, id, x, y, t) {
    ctx.save();
    const glow = (rgb, xx, yy, rr) => { ctx.globalCompositeOperation = "lighter"; Gfx.glowAt(ctx, rgb, xx, yy, rr, 0.9, true); ctx.globalCompositeOperation = "source-over"; };
    switch (id) {
      case "main": Gfx.draw(ctx, "p_power", x, y, 0, 1.4); break;
      case "side": ctx.globalCompositeOperation = "lighter"; Gfx.draw(ctx, "b_side", x - 20, y, 0, 1.3); Gfx.draw(ctx, "b_side", x + 20, y, 0, 1.3); break;
      case "rear": ctx.globalCompositeOperation = "lighter"; Gfx.draw(ctx, "b_shot", x, y, Math.PI, 1.2); break;
      case "cannon": ctx.globalCompositeOperation = "lighter"; Gfx.draw(ctx, "b_cannon", x, y, 0, 1.5); break;
      case "laser": ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = "rgba(90,255,170,0.5)"; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x, y - 24); ctx.lineTo(x, y + 24); ctx.stroke(); ctx.strokeStyle = "#e8fff4"; ctx.lineWidth = 2.5; ctx.stroke(); break;
      case "homing": Gfx.draw(ctx, "b_missile", x - 9, y, -0.3, 1.6); Gfx.draw(ctx, "b_missile", x + 9, y, 0.3, 1.6); break;
      case "electro": glow("120,200,255", x - 14, y, 14); glow("120,200,255", x + 14, y, 14); break;
      case "drone": Gfx.draw(ctx, "drone", x - 14, y, 0, 1); Gfx.draw(ctx, "drone", x + 14, y, 0, 1); break;
      case "mines": Gfx.draw(ctx, "mine", x, y, t, 1.5); break;
      case "zapper": ctx.strokeStyle = "rgba(180,220,255,0.95)"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - 24, y - 12); for (let k = 1; k < 6; k++) ctx.lineTo(x - 24 + k * 9, y - 12 + (k % 2 ? 14 : 0) + k * 2); ctx.stroke(); glow("150,200,255", x + 22, y + 8, 12); break;
      case "rapid": ctx.globalCompositeOperation = "lighter"; for (let i = 0; i < 3; i++) Gfx.draw(ctx, "b_shot", x - 12 + i * 12, y, 0, 1); break;
      case "speed": Gfx.draw(ctx, "p_speed", x, y, 0, 1.4); break;
      case "armor": ctx.fillStyle = "#9aa8b8"; ctx.beginPath(); for (let i = 0; i < 6; i++) ctx.lineTo(x + Math.cos(i * TAU / 6) * 20, y + Math.sin(i * TAU / 6) * 20); ctx.fill(); ctx.fillStyle = "#3c4858"; ctx.fillRect(x - 9, y - 3, 18, 6); ctx.fillRect(x - 3, y - 9, 6, 18); break;
      case "health": Gfx.draw(ctx, "p_health", x, y, 0, 1.4); break;
      case "bomb": Gfx.draw(ctx, "p_bomb", x, y, 0, 1.4); break;
      case "over": Gfx.draw(ctx, "p_over", x, y, 0, 1.4); break;
      case "life": Gfx.draw(ctx, "ship", x, y, 0, 0.5); break;
    }
    ctx.restore();
  }

  const GX = 30, GY = 96, CW = 154, CH = 106, GAP = 10, COLS = 5;
  const cellRect = (i) => {
    if (i === 18) return [GX + 3 * (CW + GAP), GY + 3 * (CH + GAP), 2 * CW + GAP, CH];
    return [GX + (i % COLS) * (CW + GAP), GY + Math.floor(i / COLS) * (CH + GAP), CW, CH];
  };
  States.shop = {
    t: 0, sel: 18, pop: 0, line: "", talk: 0,
    enter() {
      this.t = 0; this.sel = 18; this.pop = 0; shop.sellMode = false;
      const n = r().next;
      this.line = n.half === 1 ? "Halfway there, pilot! Krix has new stock." : n.level === 0 ? "Welcome, pilot! Krix has the finest hardware of all ages." : "You survived the beast! Krix is impressed. Shopping?";
      this.talk = 2;
      A.playSong("shop"); XA.Main.setCursor(true);
    },
    cellAt(m) { for (let i = 0; i < 19; i++) { const [x, y, w, h] = cellRect(i); if (inRect(m, x, y, w, h)) return i; } return -1; },
    input() {
      let s = this.sel;
      const row = (i) => (i >= 18 ? 3 : Math.floor(i / COLS)), col = (i) => (i >= 18 ? 3 : i % COLS);
      const idx = (rr, c) => { if (rr === 3 && c >= 3) return 18; return rr * COLS + c; };
      if (I.hit("left")) s = idx(row(s), (col(s) + 4) % 5);
      if (I.hit("right")) s = s === 18 ? 15 : idx(row(s), (col(s) + 1) % 5);
      if (I.hit("up")) s = idx((row(s) + 3) % 4, col(s));
      if (I.hit("down")) s = idx((row(s) + 1) % 4, col(s));
      const hi = this.cellAt(I.mouse);
      if (I.mouse.moved && hi >= 0) s = hi;
      if (s !== this.sel) { this.sel = s; A.sfx("menuMove"); }
      if (I.hit("back")) { this.sel = 18; A.sfx("menuMove"); }
      if (I.hit("bomb") || I.mouse.rclicked) { shop.sellMode = !shop.sellMode; A.sfx("menuMove"); }
      if (I.hit("confirm") || (I.mouse.clicked && hi >= 0 && hi === this.sel)) {
        if (this.sel === 18) { A.sfx("menuOk"); say("Good hunting, pilot!"); setState("play", r().next); }
        else if (this.sel === 17) { shop.sellMode = !shop.sellMode; A.sfx("menuOk"); say(shop.sellMode ? "Selling? Krix pays half the price." : "Back to buying. Wise."); }
        else buy(SHOP[this.sel]);
      }
    },
    update(dt) { this.t += dt; this.pop = Math.max(0, this.pop - dt); this.talk = Math.max(0, this.talk - dt); backdrop.update(dt); },
    draw(ctx) {
      backdrop.draw(ctx, "fossil");
      ctx.fillStyle = "rgba(10,4,0,0.6)"; ctx.fillRect(0, 0, W, H);
      const run = r(), n = run.next, L = G.LEVELS[n.level];
      glowTxt(ctx, "TRADING POST", GX, 44, 36, "#fff6e8", "rgba(255,130,30,0.8)", 16, "left");
      txt(ctx, `NEXT: STAGE ${n.level + 1}${n.half ? "B" : "A"} · ${L.name.toUpperCase()}`, GX + 345, 46, 18, "#8ae8ff", "left");
      SHOP.forEach((it, i) => {
        const [x, y, w, h] = cellRect(i), sel = i === this.sel, st = itemState(it);
        panel(ctx, x, y, w, h, sel ? 0.92 : 0.72, sel ? `rgba(255,210,140,${0.7 + 0.3 * Math.sin(this.t * 6)})` : "rgba(255,190,110,0.22)");
        if (sel) { ctx.save(); ctx.shadowColor = "rgba(255,150,40,0.8)"; ctx.shadowBlur = 16; ctx.strokeStyle = "rgba(255,220,160,0.9)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.stroke(); ctx.restore(); }
        drawIcon(ctx, it.id, x + w / 2, y + 34, this.t);
        txt(ctx, it.name, x + w / 2, y + 68, 18, "#ffffff", "center", 700, BODY);
        let label, col;
        if (shop.sellMode) {
          if (st.sell || (G.cheat && !it.kind && run.w[it.id] > (it.id === "main" ? 1 : 0))) { label = "SELL +" + U.fmt(st.sell); col = "#8ae8ff"; }
          else { label = "–"; col = "rgba(255,255,255,0.4)"; }
        } else if (st.status === "buy") { label = U.fmt(st.price); col = run.credits >= st.price ? "#ffd27a" : "#ff6a6a"; }
        else { label = { max: "MAX", full: "FULL", ready: "READY" }[st.status]; col = "#7dffa0"; }
        txt(ctx, label, x + w / 2, y + 90, 15, col);
        if (st.note) txt(ctx, st.note, x + w - 9, y + 13, 12, "rgba(240,220,195,0.8)", "right");
      });
      // sell toggle
      {
        const [x, y, w, h] = cellRect(17), sel = this.sel === 17;
        ctx.fillStyle = shop.sellMode ? "rgba(40,140,200,0.75)" : "rgba(40,90,120,0.45)";
        ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill();
        if (sel) { ctx.strokeStyle = "rgba(200,240,255,0.95)"; ctx.lineWidth = 2.5; ctx.stroke(); }
        txt(ctx, shop.sellMode ? "BUY MODE" : "SELL MODE", x + w / 2, y + h / 2 - 8, 17, "#ffffff", "center", 900);
        txt(ctx, shop.sellMode ? "back to buying" : "half price back", x + w / 2, y + h / 2 + 16, 14, "rgba(220,240,255,0.85)", "center", 600, BODY);
      }
      // launch
      {
        const [x, y, w, h] = cellRect(18), sel = this.sel === 18;
        const gr = ctx.createLinearGradient(x, 0, x + w, 0);
        gr.addColorStop(0, sel ? "rgba(255,130,30,0.9)" : "rgba(255,130,30,0.5)"); gr.addColorStop(1, sel ? "rgba(255,210,80,0.9)" : "rgba(255,210,80,0.45)");
        ctx.fillStyle = gr; ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill();
        if (sel) { ctx.strokeStyle = `rgba(255,245,210,${0.6 + 0.4 * Math.sin(this.t * 6)})`; ctx.lineWidth = 2.5; ctx.stroke(); }
        txt(ctx, "LAUNCH ▲", x + w / 2, y + h / 2, 28, "#1a0a00", "center", 900);
      }
      // right panel: merchant, ship, description
      const px = 850, pw = W - px - 24;
      panel(ctx, px, 20, pw, 680, 0.8);
      txt(ctx, "CREDITS", px + pw - 20, 46, 14, "#ffc060", "right");
      txt(ctx, U.fmt(run.credits), px + pw - 20, 74, 30, "#fff7b0", "right", 900);
      Gfx.drawMerchant(ctx, px + 80, 150, this.t, this.talk > 0);
      // speech bubble
      ctx.fillStyle = "rgba(255,250,240,0.95)"; ctx.beginPath(); ctx.roundRect(px + 150, 100, pw - 170, 92, 12); ctx.fill();
      ctx.beginPath(); ctx.moveTo(px + 150, 150); ctx.lineTo(px + 134, 160); ctx.lineTo(px + 150, 166); ctx.fill();
      wrap(ctx, this.line, px + 164, 124, pw - 196, 22, 18, "#2a1608");
      txt(ctx, "KRIX · TRADER OF ALL AGES", px + 80, 232, 12, "rgba(255,200,140,0.75)");
      // ship preview
      const sx = px + pw / 2, sy = 330 + Math.sin(this.t * 2) * 4;
      ctx.globalCompositeOperation = "lighter"; Gfx.glowAt(ctx, "255,160,60", sx, sy, 110, 0.18); ctx.globalCompositeOperation = "source-over";
      ctx.save(); ctx.translate(sx, sy); ctx.scale(1.5 + this.pop * 0.3, 1.5 + this.pop * 0.3);
      G.drawShip(ctx, 0, 0, run.w, 0, 1, false);
      ctx.restore();
      // owned weapons
      const owned = Object.keys(G.WMAX).filter((k) => k !== "main" && run.w[k] > 0);
      txt(ctx, `Blaster ${run.w.main}/5 · Energy ${Math.round(run.energy)}/${G.maxEnergy()} · Lives ${run.lives + 1} · Bombs ${run.bombs}`, sx, 428, 16, "#f6ece0", "center", 600, BODY);
      wrap(ctx, owned.length ? owned.map((k) => `${G.WNAME[k]} ${run.w[k]}`).join(" · ") : "No add-ons yet.", sx, 456, pw - 40, 22, 16, "rgba(140,230,255,0.9)", "center");
      ctx.strokeStyle = "rgba(255,190,110,0.25)"; ctx.beginPath(); ctx.moveTo(px + 20, 510); ctx.lineTo(px + pw - 20, 510); ctx.stroke();
      if (this.sel < 17) {
        const it = SHOP[this.sel];
        txt(ctx, it.name.toUpperCase(), px + 22, 540, 20, "#ffc060", "left");
        wrap(ctx, it.desc, px + 22, 574, pw - 44, 24, 19);
      } else if (this.sel === 17) {
        txt(ctx, shop.sellMode ? "BUY MODE" : "SELL MODE", px + 22, 540, 20, "#8ae8ff", "left");
        wrap(ctx, "Toggle between buying and selling. Krix pays back half of what the last level of an add-on cost.", px + 22, 574, pw - 44, 24, 19);
      } else {
        txt(ctx, "READY FOR LAUNCH", px + 22, 540, 20, "#ffc060", "left");
        wrap(ctx, `Stage ${n.level + 1}${n.half ? "B" : "A"}: ${L.name}.`, px + 22, 574, pw - 44, 24, 19);
      }
      txt(ctx, "Fire / Enter / Click: buy · Bomb key / right click: sell mode", px + pw / 2, 676, 14, "rgba(240,220,190,0.65)", "center", 600, BODY);
    },
  };

  /* ---------- Play ---------- */
  States.play = {
    paused: false, t: 0, done: false, bonusDone: false,
    pauseMenu: makeMenu([
      { label: "RESUME", action: () => { States.play.paused = false; } },
      { label: "OPTIONS", action: () => setState("options", "play") },
      { label: "QUIT TO TITLE", action: () => { States.play.paused = false; setState("title"); } },
    ], W / 2, 320, 420),
    enter(o) {
      if (o && o.resume) { this.paused = true; return; }
      this.paused = false; this.t = 0; this.done = false; this.bonusDone = false;
      G.startSection(o.level, o.half);
      G.onGameOver = () => setState("gameover");
    },
    pause() { if (!this.paused && G.gameOverT <= 0) { this.paused = true; this.pauseMenu.sel = 0; A.sfx("menuBack"); } },
    input() {
      if (this.paused) { if (I.hit("pause") || I.hit("back")) { this.paused = false; return; } menuInput(this.pauseMenu); return; }
      if (I.hit("pause")) { this.pause(); return; }
      if (I.hit("bomb") || I.hit("formation") || I.mouse.rclicked) G.useBomb();
      if ((G.phase === "clear" && G.phaseT > 4) || (G.phase === "sectionclear" && G.phaseT > 3)) if (I.hit("confirm") || I.mouse.clicked) this.finish();
    },
    finish() {
      if (this.done) return;
      this.done = true;
      const run = G.run;
      if (G.phase === "sectionclear") run.next = { level: run.level, half: 1 };
      else if (run.level >= G.LEVELS.length - 1) { setState("victory"); return; }
      else run.next = { level: run.level + 1, half: 0 };
      setState("shop");
    },
    update(dt) {
      XA.Main.setCursor(this.paused || !G.mouseMode);
      if (this.paused) return;
      this.t += dt;
      G.update(dt);
      if (G.phase === "clear") {
        if (!this.bonusDone && G.phaseT > 2) {
          this.bonusDone = true;
          const s = G.stats, ratio = Math.min(1, s.spawned ? s.killed / s.spawned : 0);
          G.clearBonus = Object.assign(G.clearBonus || {}, { ratio, perfect: ratio >= 0.9 ? 15000 : ratio >= 0.75 ? 7500 : 0 });
          if (G.clearBonus.perfect) G.addScore(G.clearBonus.perfect);
        }
        if (G.phaseT > 10) this.finish();
      }
      if (G.phase === "sectionclear" && G.phaseT > 6) this.finish();
    },
    drawWorld(ctx) {
      ctx.save(); ctx.translate(PX, 0);
      ctx.beginPath(); ctx.rect(0, 0, G.PW, G.PH); ctx.clip();
      G.draw(ctx);
      drawOverlay(ctx);
      if (G.mouseMode && !this.paused && !G.player.dead) {
        const m = I.mouse, mx = m.x - PX;
        ctx.strokeStyle = "rgba(255,220,160,0.7)"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(mx, m.y, 10, 0, TAU); ctx.moveTo(mx - 16, m.y); ctx.lineTo(mx - 6, m.y); ctx.moveTo(mx + 6, m.y); ctx.lineTo(mx + 16, m.y); ctx.stroke();
      }
      ctx.restore();
      drawSidePanels(ctx);
    },
    draw(ctx) {
      this.drawWorld(ctx);
      if (this.paused) {
        ctx.fillStyle = "rgba(10,4,0,0.72)"; ctx.fillRect(0, 0, W, H);
        glowTxt(ctx, "PAUSED", W / 2, 230, 64, "#fff6e8", "rgba(255,130,30,0.8)");
        menuDraw(ctx, this.pauseMenu, performance.now() / 1000);
      }
    },
  };

  function bar(ctx, x, y, w, h, f, c1, c2) {
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill();
    if (f > 0) { const gr = ctx.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, c1); gr.addColorStop(1, c2); ctx.fillStyle = gr; ctx.beginPath(); ctx.roundRect(x, y, Math.max(h, w * U.clamp(f, 0, 1)), h, h / 2); ctx.fill(); }
    ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.stroke();
  }

  function sidePanelBg(ctx, x, w) {
    const gr = ctx.createLinearGradient(x, 0, x + w, 0);
    gr.addColorStop(0, "#1a120c"); gr.addColorStop(0.5, "#2a1e14"); gr.addColorStop(1, "#140c08");
    ctx.fillStyle = gr; ctx.fillRect(x, 0, w, H);
    ctx.strokeStyle = "rgba(255,170,80,0.08)"; ctx.lineWidth = 1;
    for (let y = 0; y < H; y += 24) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y + 12); ctx.stroke(); }
    ctx.fillStyle = "rgba(255,150,60,0.55)";
    ctx.fillRect(x === 0 ? w - 3 : x, 0, 3, H);
  }

  function drawSidePanels(ctx) {
    const run = G.run;
    sidePanelBg(ctx, 0, PX); sidePanelBg(ctx, PX + G.PW, PX);
    // left
    txt(ctx, "PRIMORDIA", PX / 2, 40, 26, "#ffc060", "center", 900);
    txt(ctx, "SCORE", 30, 96, 14, "#ffb060", "left");
    txt(ctx, U.fmt(run.score), 30, 124, 28, "#ffffff", "left", 900);
    txt(ctx, "HIGH", 30, 164, 14, "#ffb060", "left");
    txt(ctx, U.fmt(Math.max(run.score, HS.list()[0].score)), 30, 188, 20, "rgba(255,240,220,0.85)", "left", 700);
    txt(ctx, "CREDITS", 30, 230, 14, "#ffb060", "left");
    Gfx.draw(ctx, "coin", 40, 258, 0, 0.9);
    txt(ctx, U.fmt(run.credits), 58, 258, 22, "#fff0a0", "left", 900);
    txt(ctx, "ENERGY", 30, 302, 14, "#ffb060", "left");
    const ef = run.energy / G.maxEnergy();
    bar(ctx, 30, 316, PX - 60, 16, ef, ef > 0.5 ? "#4cff8a" : ef > 0.25 ? "#ffd84a" : "#ff4a4a", ef > 0.5 ? "#b8ffcc" : ef > 0.25 ? "#fff0a0" : "#ff9a9a");
    txt(ctx, "LIVES", 30, 364, 14, "#ffb060", "left");
    for (let i = 0; i < Math.min(run.lives, 8); i++) Gfx.draw(ctx, "ship", 44 + (i % 4) * 34, 396 + Math.floor(i / 4) * 40, 0, 0.42);
    txt(ctx, "BOMBS", 30, 470, 14, "#ffb060", "left");
    for (let i = 0; i < run.bombs; i++) Gfx.draw(ctx, "p_bomb", 44 + i * 34, 500, 0, 0.9);
    if (G.over > 0) {
      glowTxt(ctx, "OVERDRIVE", PX / 2, 560, 22, "#fff6a0", "rgba(255,200,40,0.9)", 14);
      bar(ctx, 30, 580, PX - 60, 10, G.over / 20, "#ffd040", "#fff6c0");
    }
    txt(ctx, "P pause · F fullscreen", PX / 2, H - 24, 14, "rgba(240,210,170,0.5)", "center", 600, BODY);
    // right
    const rx = PX + G.PW + 26, rw = PX - 52;
    txt(ctx, `STAGE ${run.level + 1}${run.half ? "B" : "A"}`, rx, 40, 22, "#ffffff", "left", 900);
    txt(ctx, G.L.name.toUpperCase(), rx, 70, 15, "#8ae8ff", "left");
    bar(ctx, rx, 88, rw, 8, G.progress(), "#3ac8ff", "#ffffff");
    txt(ctx, "WEAPONS", rx, 128, 14, "#ffb060", "left");
    Object.keys(G.WMAX).forEach((k, i) => {
      const y = 158 + i * 34, lvl = G.lv(k), max = G.WMAX[k];
      const on = lvl > 0;
      txt(ctx, G.WNAME[k], rx, y, 17, on ? "#ffffff" : "rgba(255,255,255,0.3)", "left", 700, BODY);
      for (let j = 0; j < max; j++) {
        ctx.fillStyle = j < lvl ? (G.over > 0 && k !== "speed" && k !== "armor" ? "#ffe060" : "#ff9a3a") : "rgba(255,255,255,0.12)";
        ctx.fillRect(rx + rw - (max - j) * 14, y - 6, 10, 12);
      }
    });
  }

  function drawOverlay(ctx) {
    const PWc = G.PW, t = G.phaseT;
    if (G.boss && G.boss.entered) {
      const b = G.boss;
      txt(ctx, b.name, PWc / 2, 18, 16, "#ff9a6a");
      bar(ctx, 60, 30, PWc - 120, 10, b.hp / b.maxHp, "#ff3a3a", "#ffb36a");
      if (b.vulnMul < 1) txt(ctx, "SHIELDED – DESTROY ITS GUARDS", PWc / 2, 54, 12, "rgba(180,230,255,0.9)");
    }
    if (G.phase === "intro") {
      const a = t < 0.5 ? t / 0.5 : t > 2.4 ? Math.max(0, (3 - t) / 0.6) : 1;
      ctx.globalAlpha = a;
      glowTxt(ctx, `STAGE ${G.run.level + 1}${G.run.half ? "B" : "A"}`, PWc / 2, PH() / 2 - 40, 58, "#ffffff", "rgba(255,130,30,0.9)", 24);
      txt(ctx, G.L.name.toUpperCase(), PWc / 2, PH() / 2 + 16, 26, "#8ae8ff");
      if (G.over > 0) txt(ctx, "OVERDRIVE ACTIVE", PWc / 2, PH() / 2 + 56, 18, "#fff6a0");
      ctx.globalAlpha = 1;
    } else if (G.phase === "warning") {
      const a = 0.5 + 0.5 * Math.sin(t * 10);
      ctx.fillStyle = `rgba(255,0,0,${0.12 * a})`; ctx.fillRect(0, 0, PWc, PH());
      glowTxt(ctx, "WARNING", PWc / 2, PH() / 2 - 16, 66, `rgba(255,${120 + 80 * a | 0},${100 * a | 0},1)`, "rgba(255,0,0,0.9)", 26);
      txt(ctx, "ANCIENT LIFEFORM APPROACHING", PWc / 2, PH() / 2 + 36, 18, "#ffd0d0");
    } else if (G.phase === "sectionclear" && t > 1) {
      ctx.globalAlpha = Math.min(1, t - 1);
      glowTxt(ctx, "HALFWAY", PWc / 2, PH() / 2 - 30, 56, "#ffffff", "rgba(255,130,30,0.9)", 22);
      txt(ctx, "Krix's trading post ahead", PWc / 2, PH() / 2 + 20, 20, "#8ae8ff", "center", 600, BODY);
      ctx.globalAlpha = 1;
    } else if (G.phase === "clear" && t > 2) {
      const a = Math.min(1, (t - 2) / 0.5), cb = G.clearBonus || {};
      ctx.globalAlpha = a;
      panel(ctx, PWc / 2 - 290, PH() / 2 - 150, 580, 300, 0.8);
      glowTxt(ctx, "STAGE CLEAR", PWc / 2, PH() / 2 - 100, 44, "#ffffff", "rgba(255,130,30,0.9)", 22);
      const rows = [["Boss bonus", U.fmt(cb.boss || 0)], ["Enemies destroyed", `${Math.round((cb.ratio || 0) * 100)} %`], ["Hunter bonus", U.fmt(G.run.cheated ? 0 : cb.perfect || 0)], ["Credits", U.fmt(G.run.credits)]];
      rows.forEach(([k, v], i) => { txt(ctx, k, PWc / 2 - 240, PH() / 2 - 40 + i * 38, 22, "rgba(240,220,195,0.9)", "left", 600, BODY); txt(ctx, v, PWc / 2 + 240, PH() / 2 - 40 + i * 38, 22, "#fff7b0", "right"); });
      if (t > 4) txt(ctx, "Press fire to continue", PWc / 2, PH() / 2 + 125, 18, `rgba(240,220,190,${0.5 + 0.4 * Math.sin(t * 5)})`, "center", 600, BODY);
      ctx.globalAlpha = 1;
    }
    if (G.gameOverT > 0) { ctx.globalAlpha = Math.min(1, (3 - G.gameOverT) / 0.6); glowTxt(ctx, "GAME OVER", PWc / 2, PH() / 2, 72, "#ffffff", "rgba(255,60,60,0.9)", 30); ctx.globalAlpha = 1; }
  }
  const PH = () => G.PH;

  /* ---------- Game over / victory ---------- */
  function afterGame() {
    const run = G.run, rank = run.cheated ? -1 : HS.rank(run.score);
    if (rank >= 0) setState("nameentry"); else setState("highscores");
  }
  States.gameover = {
    t: 0,
    enter() { this.t = 0; A.jingle("gameover"); XA.Main.setCursor(true); },
    input() { if (this.t > 1.2 && (I.hit("confirm") || I.mouse.clicked || I.hit("back"))) afterGame(); },
    update(dt) { this.t += dt; G.t += dt; Fx.update(dt); if (this.t > 7) afterGame(); },
    draw(ctx) {
      States.play.drawWorld(ctx);
      ctx.fillStyle = `rgba(10,4,0,${Math.min(0.78, this.t * 0.5)})`; ctx.fillRect(0, 0, W, H);
      glowTxt(ctx, "GAME OVER", W / 2, H / 2 - 60, 84, "#ffffff", "rgba(255,60,60,0.9)", 30);
      txt(ctx, "FINAL SCORE", W / 2, H / 2 + 30, 18, "#ffc060");
      txt(ctx, U.fmt(G.run.score), W / 2, H / 2 + 70, 44, "#fff7b0", "center", 900);
      txt(ctx, `Reached stage ${G.run.level + 1}: ${G.L.name}`, W / 2, H / 2 + 120, 22, "rgba(240,225,205,0.85)", "center", 600, BODY);
    },
  };

  States.victory = {
    t: 0, bonus: 0,
    enter() {
      this.t = 0;
      const run = G.run;
      run.level = 4;
      this.bonus = run.cheated ? 0 : (run.lives + 1) * 15000;
      if (this.bonus) G.addScore(this.bonus);
      A.jingle("victory");
      setTimeout(() => { if (XA.Main.state === "victory") A.playSong("title"); }, 4500);
      XA.Main.setCursor(true); Fx.clear();
    },
    input() { if (this.t > 2.5 && (I.hit("confirm") || I.mouse.clicked)) afterGame(); },
    update(dt) {
      this.t += dt; backdrop.update(dt);
      if (Math.random() < dt * 3) Fx.explode(U.rand(150, W - 150), U.rand(100, H - 260), U.rand(18, 50), { rgb: U.pick(["255,200,90", "120,220,255", "255,120,200", "160,255,140"]) });
    },
    draw(ctx) {
      backdrop.draw(ctx, "core");
      glowTxt(ctx, "TIMELINE RESTORED", W / 2, 160, 60, "#ffffff", "rgba(255,130,30,0.9)", 28);
      wrap(ctx, "The Overmind is destroyed and the time rift collapses. Evolution may take its course again.", W / 2, 236, 640, 30, 24, "rgba(245,235,220,0.95)", "center");
      panel(ctx, W / 2 - 260, 320, 520, 200, 0.78);
      txt(ctx, "Fleet bonus", W / 2 - 220, 360, 22, "rgba(240,220,195,0.9)", "left", 600, BODY);
      txt(ctx, U.fmt(this.bonus), W / 2 + 220, 360, 22, "#fff7b0", "right");
      txt(ctx, "FINAL SCORE", W / 2, 420, 18, "#ffc060");
      txt(ctx, U.fmt(G.run.score), W / 2, 465, 44, "#fff7b0", "center", 900);
      if (this.t > 2.5) txt(ctx, "Press fire to continue", W / 2, 570, 20, `rgba(240,220,190,${0.5 + 0.4 * Math.sin(this.t * 5)})`, "center", 600, BODY);
    },
  };

  /* ---------- Name entry (optional) ---------- */
  const KEYS = ["ABCDEFGHIJ", "KLMNOPQRST", "UVWXYZ0123", "456789.-! "];
  States.nameentry = {
    t: 0, name: "", sel: 0, rank: 0,
    enter() { this.t = 0; this.name = Store.get("lastName", ""); this.sel = 0; this.rank = HS.rank(G.run.score); A.playSong("title"); XA.Main.setCursor(true); },
    cells() {
      const out = [];
      KEYS.forEach((row, rr) => [...row].forEach((ch, c) => out.push({ ch, x: W / 2 - 330 + c * 66, y: 330 + rr * 62, w: 58, h: 52 })));
      out.push({ ch: "DEL", x: W / 2 - 330, y: 578, w: 190, h: 52 });
      out.push({ ch: "SAVE", x: W / 2 - 124, y: 578, w: 250, h: 52 });
      out.push({ ch: "SKIP", x: W / 2 + 142, y: 578, w: 190, h: 52 });
      return out;
    },
    press(ch) {
      if (ch === "DEL") { this.name = this.name.slice(0, -1); A.sfx("menuBack"); }
      else if (ch === "SAVE") this.save();
      else if (ch === "SKIP") { A.sfx("menuBack"); setState("highscores"); }
      else if (this.name.length < 10) { this.name += ch; A.sfx("menuMove"); }
    },
    save() {
      const name = this.name.trim() || "PILOT";
      Store.set("lastName", name);
      const pos = HS.add(name, G.run.score, G.run.level + 1);
      A.sfx("buy"); setState("highscores", { mark: pos });
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
      let hi = -1;
      cells.forEach((c, i) => { if (inRect(I.mouse, c.x, c.y, c.w, c.h)) hi = i; });
      if (I.mouse.moved && hi >= 0) this.sel = hi;
      if (I.pad.pressed.has(0) || (I.mouse.clicked && hi >= 0)) this.press(cells[this.sel].ch);
      if (I.pad.pressed.has(1)) this.press("DEL");
      if (I.pad.pressed.has(9)) this.save();
    },
    update(dt) { this.t += dt; backdrop.update(dt); },
    draw(ctx) {
      backdrop.draw(ctx);
      ctx.fillStyle = "rgba(10,4,0,0.72)"; ctx.fillRect(0, 0, W, H);
      glowTxt(ctx, "NEW HIGHSCORE", W / 2, 80, 56, "#ffffff", "rgba(255,180,60,0.9)", 26);
      txt(ctx, `Rank ${this.rank + 1} with ${U.fmt(G.run.score)} points`, W / 2, 140, 26, "#fff7b0", "center", 700, BODY);
      txt(ctx, "Enter your name to join the highscore list – or skip it.", W / 2, 176, 22, "rgba(240,225,205,0.85)", "center", 600, BODY);
      panel(ctx, W / 2 - 260, 210, 520, 80, 0.78);
      const cur = Math.floor(this.t * 2.5) % 2 ? "_" : " ";
      txt(ctx, this.name + (this.name.length < 10 ? cur : ""), W / 2, 252, 40, "#ffffff", "center", 900);
      this.cells().forEach((c, i) => {
        const sel = i === this.sel;
        ctx.fillStyle = sel ? "rgba(255,150,40,0.6)" : c.ch.length > 1 ? "rgba(60,160,220,0.3)" : "rgba(40,24,12,0.8)";
        ctx.beginPath(); ctx.roundRect(c.x, c.y, c.w, c.h, 8); ctx.fill();
        ctx.strokeStyle = sel ? "#ffe8c0" : "rgba(255,190,110,0.3)"; ctx.lineWidth = sel ? 2 : 1; ctx.stroke();
        txt(ctx, c.ch === " " ? "␣" : c.ch, c.x + c.w / 2, c.y + c.h / 2 + 1, c.ch.length > 1 ? 20 : 24, "#ffffff");
      });
      txt(ctx, "Type with the keyboard · Enter saves · Esc skips · Gamepad: A types, B deletes, Start saves", W / 2, H - 30, 18, "rgba(240,220,190,0.7)", "center", 500, BODY);
    },
  };
})(window.XA);
