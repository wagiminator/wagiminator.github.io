/* X-Abyss: screens – title, options, controls, shipyard (shop), play HUD, highscores, name entry */
"use strict";

(function (XA) {
  const { U, Gfx, Fx, G, Store } = XA;
  const A = XA.Audio, I = XA.Input;
  const W = U.W, H = U.H, TAU = U.TAU;
  const States = (XA.States = {});
  let setState = null; // provided by main.js
  XA.UI = { bind(fn) { setState = fn; } };

  const FONT = "Orbitron, 'Arial Black', Arial, sans-serif";
  const BODY = "Rajdhani, 'Segoe UI', Arial, sans-serif";
  function txt(ctx, s, x, y, size, color = "#fff", align = "center", weight = 700, font = FONT) {
    ctx.font = `${weight} ${size}px ${font}`;
    ctx.textAlign = align; ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.fillText(s, x, y);
  }
  function glowTxt(ctx, s, x, y, size, color, glow, blur = 18, align = "center", font = FONT) {
    ctx.save(); ctx.shadowColor = glow; ctx.shadowBlur = blur;
    txt(ctx, s, x, y, size, color, align, 900, font);
    ctx.restore();
  }
  function panel(ctx, x, y, w, h, alpha = 0.72, border = "rgba(120,220,255,0.35)") {
    ctx.fillStyle = `rgba(4,18,32,${alpha})`;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill();
    ctx.strokeStyle = border; ctx.lineWidth = 1.5; ctx.stroke();
  }
  function inRect(m, x, y, w, h) { return m.x >= x && m.x <= x + w && m.y >= y && m.y <= y + h; }
  XA.UI.txt = txt;

  /* ---------- Shared animated backdrop ---------- */
  const backdrop = {
    camX: 0, t: 0, fish: [],
    terr: null,
    update(dt) {
      if (!this.terr) this.terr = G.makeTerrain({ seed: 77, floor: { base: 650, amp: 70, scale: 420 }, ceil: null });
      this.t += dt; this.camX += 40 * dt;
      if (Math.random() < dt * 0.8) this.fish.push({ x: W + 40, y: U.rand(120, 520), vx: -U.rand(60, 140), spr: U.pick(["fish", "fish", "jelly", "squid", "orb"]), p: U.rand(TAU) });
      for (const f of this.fish) { f.x += f.vx * dt; f.y += Math.sin(this.t * 1.5 + f.p) * 12 * dt; }
      this.fish = this.fish.filter((f) => f.x > -60);
      if (Math.random() < dt * 3) Fx.bubbles(U.rand(0, W), H + 5, 1, 2);
      Fx.update(dt);
    },
    draw(ctx, theme = "coral") {
      if (!this.terr) this.update(0);
      const th = Gfx.THEMES[theme];
      Gfx.drawBackground(ctx, th, this.camX, this.t);
      for (const f of this.fish) { ctx.globalAlpha = 0.55; Gfx.draw(ctx, f.spr, f.x, f.y, f.spr === "squid" ? Math.PI : 0, 0.8); ctx.globalAlpha = 1; }
      Gfx.drawTerrain(ctx, th, this.camX, { floor: this.terr.floor, ceil: null }, this.t);
      Fx.draw(ctx);
      Gfx.drawOverlay(ctx, th);
    },
  };

  /* ---------- Generic menu ---------- */
  function makeMenu(items, x, y, w = 420, h = 54, gap = 12) { return { items, sel: 0, x, y, w, h, gap }; }
  function menuIndexAt(m) {
    const ms = I.mouse;
    for (let i = 0; i < m.items.length; i++) if (inRect(ms, m.x - m.w / 2, m.y + i * (m.h + m.gap), m.w, m.h)) return i;
    return -1;
  }
  function menuInput(m) {
    const n = m.items.length;
    if (I.hit("up")) { m.sel = (m.sel + n - 1) % n; A.sfx("menuMove"); }
    if (I.hit("down")) { m.sel = (m.sel + 1) % n; A.sfx("menuMove"); }
    const hi = menuIndexAt(m);
    if (I.mouse.moved && hi >= 0 && hi !== m.sel) { m.sel = hi; A.sfx("menuMove"); }
    const it = m.items[m.sel];
    if (it.adjust) {
      if (I.hit("left")) it.adjust(-1);
      if (I.hit("right")) it.adjust(1);
      if (I.mouse.wheel && hi === m.sel) it.adjust(-I.mouse.wheel);
    }
    if (I.hit("confirm") || (I.mouse.clicked && hi === m.sel && hi >= 0)) {
      if (it.action) { A.sfx("menuOk"); it.action(); }
      else if (it.adjust) it.adjust(1, true);
    }
  }
  function menuDraw(ctx, m, t) {
    m.items.forEach((it, i) => {
      const y = m.y + i * (m.h + m.gap), x = m.x - m.w / 2, sel = i === m.sel;
      if (sel) {
        const gr = ctx.createLinearGradient(x, 0, x + m.w, 0);
        gr.addColorStop(0, "rgba(40,200,255,0)"); gr.addColorStop(0.5, `rgba(40,200,255,${0.35 + 0.1 * Math.sin(t * 5)})`); gr.addColorStop(1, "rgba(40,200,255,0)");
        ctx.fillStyle = gr; ctx.fillRect(x, y, m.w, m.h);
        ctx.strokeStyle = "rgba(160,240,255,0.8)"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x + 40, y); ctx.lineTo(x + m.w - 40, y); ctx.moveTo(x + 40, y + m.h); ctx.lineTo(x + m.w - 40, y + m.h); ctx.stroke();
      }
      const label = typeof it.label === "function" ? it.label() : it.label;
      txt(ctx, label, m.x, y + m.h / 2 + 1, sel ? 26 : 23, sel ? "#ffffff" : "rgba(190,225,240,0.85)");
    });
  }

  /* ---------- Highscores ---------- */
  const DEFAULT_HS = [["NEPTUN", 60000], ["MARINA", 50000], ["KRAKEN", 42000], ["NAUTILUS", 35000], ["TRITON", 28000], ["CORAL", 22000], ["ORCA", 16000], ["PEARL", 11000], ["DELTA", 7000], ["ABYSS", 4000]]
    .map(([name, score], i) => ({ name, score, stage: i < 3 ? 3 : i < 6 ? 2 : 1, date: "" }));
  const HS = (XA.HS = {
    list() { const l = Store.get("scores", null); return Array.isArray(l) && l.length ? l : DEFAULT_HS.slice(); },
    rank(score) { if (score <= 0) return -1; const l = HS.list(); let i = 0; while (i < l.length && l[i].score >= score) i++; return i < 10 ? i : -1; },
    add(name, score, stage) {
      const l = HS.list();
      const e = { name, score, stage, date: new Date().toISOString().slice(0, 10) };
      l.push(e); l.sort((a, b) => b.score - a.score);
      const out = l.slice(0, 10);
      Store.set("scores", out);
      return out.indexOf(e);
    },
  });

  /* ---------- Boot ---------- */
  States.boot = {
    t: 0,
    enter() { this.t = 0; },
    input() {
      if (this.t > 0.2 && (I.pressed.size || I.mouse.clicked || I.pad.pressed.size)) { A.init(); setState("title"); }
    },
    update(dt) { this.t += dt; backdrop.update(dt); },
    draw(ctx) {
      backdrop.draw(ctx);
      drawLogo(ctx, this.t, H / 2 - 70);
      const a = 0.55 + 0.45 * Math.sin(this.t * 4);
      txt(ctx, "PRESS ANY KEY OR CLICK", W / 2, H / 2 + 110, 24, `rgba(220,245,255,${a})`);
      txt(ctx, "Keyboard · Mouse · Gamepad", W / 2, H / 2 + 150, 20, "rgba(170,210,230,0.75)", "center", 500, BODY);
    },
  };

  function drawLogo(ctx, t, y) {
    ctx.save();
    ctx.font = `900 132px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(40,200,255,0.9)"; ctx.shadowBlur = 40 + 10 * Math.sin(t * 2);
    const gr = ctx.createLinearGradient(0, y - 60, 0, y + 60);
    gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.45, "#9fe8ff"); gr.addColorStop(0.55, "#2a7aa8"); gr.addColorStop(1, "#cdf6ff");
    ctx.fillStyle = gr;
    ctx.fillText("X-ABYSS", W / 2, y);
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2; ctx.strokeStyle = "rgba(0,30,60,0.8)"; ctx.strokeText("X-ABYSS", W / 2, y);
    ctx.restore();
    txt(ctx, "D E E P   S E A   A S S A U L T", W / 2, y + 82, 22, "rgba(255,190,110,0.95)", "center", 700);
  }

  /* ---------- Title ---------- */
  States.title = {
    t: 0, idle: 0,
    menu: makeMenu([
      { label: "START GAME", action: () => { G.newRun(); G.run.next = 0; setState("shop"); } },
      { label: "HIGHSCORES", action: () => setState("highscores") },
      { label: "OPTIONS", action: () => setState("options", "title") },
      { label: "CONTROLS", action: () => setState("controls") },
    ], W / 2, 350, 420, 50, 10),
    enter() { this.t = 0; this.idle = 0; A.playSong("title"); },
    input() {
      if (I.pressed.size || I.mouse.moved || I.pad.pressed.size || I.pad.dir.size) this.idle = 0;
      menuInput(this.menu);
    },
    update(dt) { this.t += dt; this.idle += dt; backdrop.update(dt); if (this.idle > 30) setState("highscores", { attract: true }); },
    draw(ctx) {
      backdrop.draw(ctx);
      drawLogo(ctx, this.t, 190);
      menuDraw(ctx, this.menu, this.t);
      txt(ctx, "An homage to the Amiga classic X-Out (1990). All graphics, music and code are original.", W / 2, H - 28, 17, "rgba(170,210,230,0.6)", "center", 500, BODY);
    },
  };

  /* ---------- Options ---------- */
  const pct = (v) => "▮".repeat(Math.round(v * 10)) + "▯".repeat(10 - Math.round(v * 10));
  States.options = {
    t: 0, back: "title",
    menu: makeMenu([
      { label: () => "MUSIC  " + pct(A.musicVol), adjust: (d, wrap) => { let v = Math.round((A.musicVol + d * 0.1) * 10) / 10; if (wrap && v > 1) v = 0; A.setMusicVol(U.clamp(v, 0, 1)); A.sfx("menuMove"); } },
      { label: () => "SOUND  " + pct(A.sfxVol), adjust: (d, wrap) => { let v = Math.round((A.sfxVol + d * 0.1) * 10) / 10; if (wrap && v > 1) v = 0; A.setSfxVol(U.clamp(v, 0, 1)); A.sfx("gem"); } },
      { label: () => "VOICE  " + (A.voiceOn ? "ON" : "OFF"), adjust: () => { A.setVoice(!A.voiceOn); A.sfx("menuMove"); if (A.voiceOn) A.say("Voice on"); } },
      { label: () => "SCREEN SHAKE  " + (XA.Main.shakeOn ? "ON" : "OFF"), adjust: () => { XA.Main.shakeOn = !XA.Main.shakeOn; Store.set("shake", XA.Main.shakeOn); A.sfx("menuMove"); } },
      { label: () => "FULLSCREEN  " + (document.fullscreenElement ? "ON" : "OFF"), action: () => XA.Main.toggleFullscreen() },
      { label: "BACK", action: () => States.options.leave() },
    ], W / 2, 232, 560),
    enter(back) { this.t = 0; this.back = back || "title"; this.menu.sel = 0; },
    leave() { if (this.back === "play") setState("play", { resume: true }); else setState(this.back); },
    input() { if (I.hit("back")) { A.sfx("menuBack"); this.leave(); return; } menuInput(this.menu); },
    update(dt) { this.t += dt; if (this.back !== "play") backdrop.update(dt); },
    draw(ctx) {
      if (this.back === "play") { G.draw(ctx); ctx.fillStyle = "rgba(0,8,16,0.7)"; ctx.fillRect(0, 0, W, H); }
      else backdrop.draw(ctx);
      glowTxt(ctx, "OPTIONS", W / 2, 150, 54, "#e8fbff", "rgba(40,200,255,0.8)");
      menuDraw(ctx, this.menu, this.t);
      txt(ctx, "◀ ▶ to change · F fullscreen · M mute", W / 2, H - 50, 20, "rgba(170,210,230,0.7)", "center", 500, BODY);
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
      glowTxt(ctx, "CONTROLS", W / 2, 90, 54, "#e8fbff", "rgba(40,200,255,0.8)");
      const cols = [
        ["KEYBOARD", [["Move", "Arrow keys / WASD"], ["Fire (hold)", "Space / J / Y"], ["Satellite formation", "X / K / Shift"], ["Nova bomb", "C / L / B"], ["Pause", "P / Esc"], ["Fullscreen", "F"], ["Mute", "M"]]],
        ["MOUSE", [["Move", "Ship follows the pointer"], ["Fire (hold)", "Left button"], ["Satellite formation", "Right button / wheel"], ["Nova bomb", "Middle button"], ["Menus", "Point and click"]]],
        ["GAMEPAD", [["Move", "Left stick / D-pad"], ["Fire (hold)", "A / RT"], ["Satellite formation", "X / Y / LB / RB"], ["Nova bomb", "B / LT"], ["Pause", "Start"]]],
      ];
      cols.forEach(([head, rows], c) => {
        const x = 70 + c * 390;
        panel(ctx, x, 140, 370, 400);
        txt(ctx, head, x + 185, 172, 24, "#7fe6ff");
        rows.forEach(([a, b], i) => {
          txt(ctx, a, x + 22, 214 + i * 46, 18, "rgba(170,215,235,0.75)", "left", 600, BODY);
          txt(ctx, b, x + 22, 236 + i * 46, 22, "#ffffff", "left", 700, BODY);
        });
      });
      panel(ctx, 70, 556, W - 140, 76, 0.7);
      txt(ctx, "Shoot enemies to earn credits and collect the crystals. Spend them in the shipyard between the stages.", W / 2, 580, 21, "rgba(220,240,250,0.95)", "center", 600, BODY);
      txt(ctx, "Every 50,000 points you get an extra ship.", W / 2, 608, 21, "rgba(220,240,250,0.95)", "center", 600, BODY);
      txt(ctx, "Press any button to return", W / 2, H - 40, 20, `rgba(170,210,230,${0.5 + 0.3 * Math.sin(this.t * 4)})`, "center", 600, BODY);
    },
  };

  /* ---------- Highscores ---------- */
  States.highscores = {
    t: 0, mark: -1, attract: false,
    enter(o) { this.t = 0; this.mark = o && o.mark !== undefined ? o.mark : -1; this.attract = !!(o && o.attract); if (!this.attract) A.playSong("title"); },
    input() {
      if (this.t > 0.4 && (I.hit("back") || I.hit("confirm") || I.mouse.clicked || (this.attract && (I.pressed.size || I.pad.pressed.size)))) { A.sfx("menuBack"); setState("title"); }
    },
    update(dt) { this.t += dt; backdrop.update(dt); if (this.attract && this.t > 12) setState("title"); },
    draw(ctx) {
      backdrop.draw(ctx);
      glowTxt(ctx, "HIGHSCORES", W / 2, 90, 54, "#e8fbff", "rgba(40,200,255,0.8)");
      panel(ctx, W / 2 - 380, 140, 760, 500);
      const l = HS.list();
      txt(ctx, "RANK", W / 2 - 330, 170, 16, "#7fe6ff", "left");
      txt(ctx, "NAME", W / 2 - 220, 170, 16, "#7fe6ff", "left");
      txt(ctx, "STAGE", W / 2 + 110, 170, 16, "#7fe6ff", "center");
      txt(ctx, "SCORE", W / 2 + 340, 170, 16, "#7fe6ff", "right");
      l.forEach((e, i) => {
        const y = 215 + i * 42, hl = i === this.mark;
        if (hl) { ctx.fillStyle = `rgba(40,200,255,${0.2 + 0.12 * Math.sin(this.t * 6)})`; ctx.fillRect(W / 2 - 360, y - 19, 720, 38); }
        const col = hl ? "#fff7b0" : i < 3 ? "#ffd27a" : "#e6f6ff";
        txt(ctx, `${i + 1}.`, W / 2 - 330, y, 22, col, "left");
        txt(ctx, e.name, W / 2 - 220, y, 22, col, "left");
        txt(ctx, e.stage > G.LEVELS.length ? "ALL" : String(e.stage), W / 2 + 110, y, 22, col, "center");
        txt(ctx, U.fmt(e.score), W / 2 + 340, y, 22, col, "right");
      });
      txt(ctx, "Scores are saved in this browser.", W / 2, H - 40, 18, "rgba(170,210,230,0.6)", "center", 500, BODY);
    },
  };

  /* ---------- Shipyard (shop) ---------- */
  const r = () => G.run;
  const SHOP = [
    { id: "pulse", name: "Pulse Cannon", kind: "weapon", price: 2000, desc: "Rapid twin-barrel cannon. Reliable all-rounder; more barrels with every power level." },
    { id: "spread", name: "Spread Cannon", kind: "weapon", price: 6000, desc: "Fires a fan of shots that covers a wide area. Great against swarms." },
    { id: "laser", name: "Pulse Laser", kind: "weapon", price: 9000, desc: "Fast beams that pierce through several enemies in a row." },
    { id: "wave", name: "Wave Gun", kind: "weapon", price: 7500, desc: "Big energy orbs travelling on a sine wave. Hits a lot with little aiming." },
    { id: "power", name: "Weapon Power", kind: "level", max: 4, cur: () => r().power, prices: [0, 5000, 9000, 15000], desc: "Raises the level of your main weapon (max. 4). A lost ship costs one level." },
    { id: "pod", name: "Satellite", kind: "level", max: 2, cur: () => r().pods, prices: [5000, 8000], desc: "Armoured drone that fires along and blocks enemy shots. Change its formation in flight." },
    { id: "homing", name: "Homing Missiles", kind: "flag", price: 8000, desc: "Two missiles that seek out the nearest enemy, fired automatically." },
    { id: "torpedo", name: "Depth Charges", kind: "flag", price: 6000, desc: "Sinking charges that explode with a large blast radius. Good against ground targets." },
    { id: "rear", name: "Rear Gun", kind: "flag", price: 3000, desc: "Covers your back against enemies attacking from behind." },
    { id: "side", name: "Side Guns", kind: "flag", price: 3500, desc: "Fire straight up and down. Clears the floor and the ceiling." },
    { id: "shield", name: "Deflector Shield", kind: "flag", price: 9000, desc: "Absorbs 60 points of damage and recharges when you are not hit for a while." },
    { id: "armor", name: "Hull Armour", kind: "level", max: 2, cur: () => r().armor, prices: [4000, 7000], desc: "+25 maximum energy for every level (max. 2)." },
    { id: "engine", name: "Turbo Engine", kind: "level", max: 3, cur: () => r().engine, prices: [3000, 5000, 8000], desc: "More speed for dodging (max. 3)." },
    { id: "nova", name: "Nova Bomb", kind: "count", max: 5, cur: () => r().novas, price: 2500, desc: "Destroys all shots on screen and damages every enemy. Up to 5." },
    { id: "repair", name: "Repair Hull", kind: "repair", price: 1500, desc: "Restores the energy of your current ship to the maximum." },
    { id: "ship", name: "Extra Ship", kind: "count", max: 9, cur: () => r().lives, price: 12000, desc: "One more reserve ship (max. 9)." },
  ];
  function itemState(it) {
    const run = r();
    let price = it.price || 0, status = "buy", note = "";
    if (it.kind === "weapon") {
      if (run.owned[it.id]) { status = run.weapon === it.id ? "equipped" : "owned"; price = 0; }
    } else if (it.kind === "level") {
      const c = it.cur();
      if (c >= it.max) status = "max";
      else price = it.prices[c];
      note = `${c}/${it.max}`;
    } else if (it.kind === "flag") {
      if (run[it.id]) status = "installed";
    } else if (it.kind === "count") {
      const c = it.cur();
      if (c >= it.max) status = "max";
      note = `${c}`;
    } else if (it.kind === "repair") {
      if (run.energy >= G.maxEnergy()) status = "full";
    }
    if (G.cheat && status === "buy") price = 0;
    return { price, status, note };
  }
  function buy(it) {
    const run = r(), st = itemState(it);
    if (it.kind === "weapon" && st.status === "owned") { run.weapon = it.id; A.sfx("menuOk"); return; }
    if (st.status !== "buy") { A.sfx("deny"); return; }
    if (run.credits < st.price) { A.sfx("deny"); States.shop.msg = "Not enough credits"; States.shop.msgT = 1.5; return; }
    run.credits -= st.price;
    if (G.cheat) run.cheated = true;
    switch (it.kind) {
      case "weapon": run.owned[it.id] = true; run.weapon = it.id; break;
      case "level":
        if (it.id === "power") run.power++;
        else if (it.id === "pod") run.pods++;
        else if (it.id === "armor") { run.armor++; run.energy += 25; }
        else if (it.id === "engine") run.engine++;
        break;
      case "flag": run[it.id] = true; break;
      case "count": if (it.id === "nova") run.novas++; else run.lives++; break;
      case "repair": run.energy = G.maxEnergy(); break;
    }
    A.sfx("buy");
    States.shop.pop = 0.35;
  }
  function drawIcon(ctx, id, x, y) {
    ctx.save();
    switch (id) {
      case "pulse": ctx.globalCompositeOperation = "lighter"; Gfx.draw(ctx, "b_pulse", x - 6, y - 8, 0, 1.3); Gfx.draw(ctx, "b_pulse", x + 6, y + 8, 0, 1.3); break;
      case "spread": ctx.globalCompositeOperation = "lighter"; for (let i = -2; i <= 2; i++) Gfx.draw(ctx, "b_spread", x + Math.cos(i * 0.3) * 22 - 10, y + Math.sin(i * 0.3) * 26, 0, 1.1); break;
      case "laser": ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = "rgba(90,255,190,0.5)"; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x - 30, y); ctx.lineTo(x + 30, y); ctx.stroke(); ctx.strokeStyle = "#e8fff4"; ctx.lineWidth = 2.5; ctx.stroke(); break;
      case "wave": ctx.globalCompositeOperation = "lighter"; for (let i = 0; i < 3; i++) Gfx.draw(ctx, "b_wave", x - 20 + i * 20, y + Math.sin(i * 1.6) * 12, 0, 0.9 + i * 0.1); break;
      case "power": Gfx.draw(ctx, "p_power", x, y, 0, 1.5); break;
      case "pod": Gfx.draw(ctx, "pod", x - 14, y, 0, 1.1); Gfx.draw(ctx, "pod", x + 14, y, 0, 1.1); break;
      case "homing": Gfx.draw(ctx, "b_missile", x, y - 9, -0.3, 1.6); Gfx.draw(ctx, "b_missile", x, y + 9, 0.3, 1.6); break;
      case "torpedo": Gfx.draw(ctx, "b_depth", x - 10, y - 6, 0, 1.6); Gfx.draw(ctx, "b_depth", x + 12, y + 8, 0, 1.6); break;
      case "rear": ctx.globalCompositeOperation = "lighter"; Gfx.draw(ctx, "b_pulse", x, y, Math.PI, 1.4); break;
      case "side": ctx.globalCompositeOperation = "lighter"; Gfx.draw(ctx, "b_spread", x, y - 14, 0, 1.4); Gfx.draw(ctx, "b_spread", x, y + 14, 0, 1.4); break;
      case "shield": ctx.strokeStyle = "rgba(120,220,255,0.9)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, 28, 18, 0, 0, TAU); ctx.stroke(); Gfx.draw(ctx, "ship", x, y, 0, 0.45); break;
      case "armor": ctx.fillStyle = "#9aa8b8"; ctx.beginPath(); for (let i = 0; i < 6; i++) ctx.lineTo(x + Math.cos(i * TAU / 6) * 20, y + Math.sin(i * TAU / 6) * 20); ctx.fill(); ctx.fillStyle = "#3c4858"; ctx.fillRect(x - 9, y - 3, 18, 6); ctx.fillRect(x - 3, y - 9, 6, 18); break;
      case "engine": ctx.globalCompositeOperation = "lighter"; ctx.drawImage(Gfx.glow("90,200,255", true), x - 30, y - 9, 50, 18); Gfx.glowAt(ctx, "120,220,255", x + 16, y, 14, 0.9, true); break;
      case "nova": Gfx.draw(ctx, "p_nova", x, y, 0, 1.5); break;
      case "repair": Gfx.draw(ctx, "p_energy", x, y, 0, 1.5); break;
      case "ship": Gfx.draw(ctx, "ship", x, y, 0, 0.6); break;
    }
    ctx.restore();
  }

  const GX = 40, GY = 108, CW = 172, CH = 112, GAP = 12;
  States.shop = {
    t: 0, sel: 0, msg: "", msgT: 0, pop: 0,
    enter() { this.t = 0; this.sel = 16; this.msg = ""; this.pop = 0; A.playSong("shop"); XA.Main.setCursor(true); },
    cardAt(m) {
      for (let i = 0; i < 16; i++) { const cx = GX + (i % 4) * (CW + GAP), cy = GY + Math.floor(i / 4) * (CH + GAP); if (inRect(m, cx, cy, CW, CH)) return i; }
      if (inRect(m, GX, 610, 4 * CW + 3 * GAP, 64)) return 16;
      return -1;
    },
    input() {
      let s = this.sel;
      if (I.hit("left")) s = s === 16 ? 15 : s % 4 === 0 ? s + 3 : s - 1;
      const nav = (d) => I.rep.has("Arrow" + d[0].toUpperCase() + d.slice(1)) || I.pad.dir.has(d) || I.pad.pressed.has({ up: 12, down: 13, left: 14, right: 15 }[d]);
      if (nav("right")) s = s === 16 ? 0 : s % 4 === 3 ? s - 3 : s + 1;
      if (I.hit("up")) s = s === 16 ? 13 : s < 4 ? 16 : s - 4;
      if (I.hit("down")) s = s === 16 ? 1 : s >= 12 ? 16 : s + 4;
      const hi = this.cardAt(I.mouse);
      if (I.mouse.moved && hi >= 0) s = hi;
      if (s !== this.sel) { this.sel = s; A.sfx("menuMove"); }
      if (I.hit("back")) { this.sel = 16; A.sfx("menuMove"); }
      if (I.hit("confirm") || (I.mouse.clicked && hi >= 0 && hi === this.sel)) {
        if (this.sel === 16) { A.sfx("menuOk"); XA.Main.setCursor(false); setState("play", { level: r().next }); }
        else buy(SHOP[this.sel]);
      }
    },
    update(dt) { this.t += dt; this.msgT -= dt; this.pop = Math.max(0, this.pop - dt); backdrop.update(dt); },
    draw(ctx) {
      backdrop.draw(ctx, "wreck");
      ctx.fillStyle = "rgba(0,10,20,0.55)"; ctx.fillRect(0, 0, W, H);
      const run = r(), L = G.LEVELS[run.next];
      glowTxt(ctx, "SHIPYARD", GX, 50, 40, "#e8fbff", "rgba(40,200,255,0.8)", 16, "left");
      txt(ctx, `NEXT: STAGE ${run.next + 1} · ${L.name.toUpperCase()}`, GX + 270, 52, 20, "#ffd27a", "left");
      txt(ctx, "CREDITS", W - 40, 36, 15, "#7fe6ff", "right");
      txt(ctx, U.fmt(run.credits), W - 40, 64, 32, "#fff7b0", "right", 900);
      SHOP.forEach((it, i) => {
        const x = GX + (i % 4) * (CW + GAP), y = GY + Math.floor(i / 4) * (CH + GAP), sel = i === this.sel;
        const st = itemState(it);
        const done = st.status !== "buy";
        panel(ctx, x, y, CW, CH, sel ? 0.9 : 0.7, sel ? `rgba(140,240,255,${0.7 + 0.3 * Math.sin(this.t * 6)})` : "rgba(120,220,255,0.22)");
        if (sel) { ctx.save(); ctx.shadowColor = "rgba(60,200,255,0.8)"; ctx.shadowBlur = 18; ctx.strokeStyle = "rgba(140,240,255,0.9)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(x, y, CW, CH, 10); ctx.stroke(); ctx.restore(); }
        drawIcon(ctx, it.id, x + CW / 2, y + 36);
        txt(ctx, it.name, x + CW / 2, y + 74, 19, "#ffffff", "center", 700, BODY);
        let label, col;
        if (st.status === "buy") { label = st.price ? U.fmt(st.price) : "0"; col = run.credits >= st.price ? "#ffd27a" : "#ff6a6a"; }
        else { label = { equipped: "EQUIPPED", owned: "OWNED · EQUIP", installed: "INSTALLED", max: "MAX", full: "FULL" }[st.status]; col = "#7dffa0"; }
        txt(ctx, label, x + CW / 2, y + 96, 15, col);
        if (st.note) txt(ctx, st.note, x + CW - 10, y + 14, 13, "rgba(200,230,245,0.8)", "right");
        if (done && st.status !== "owned") { ctx.fillStyle = "rgba(0,0,0,0.18)"; ctx.fillRect(x, y, CW, CH); }
      });
      // launch button
      const sel = this.sel === 16, lw = 4 * CW + 3 * GAP;
      const gr = ctx.createLinearGradient(GX, 0, GX + lw, 0);
      gr.addColorStop(0, sel ? "rgba(255,140,40,0.85)" : "rgba(255,140,40,0.45)"); gr.addColorStop(1, sel ? "rgba(255,200,80,0.85)" : "rgba(255,200,80,0.4)");
      ctx.fillStyle = gr; ctx.beginPath(); ctx.roundRect(GX, 610, lw, 64, 10); ctx.fill();
      if (sel) { ctx.strokeStyle = `rgba(255,240,200,${0.6 + 0.4 * Math.sin(this.t * 6)})`; ctx.lineWidth = 2.5; ctx.stroke(); }
      txt(ctx, "LAUNCH ▶", GX + lw / 2, 643, 28, "#1a0a00", "center", 900);
      // right panel: ship and loadout
      const px = 800, pw = W - px - 40;
      panel(ctx, px, 90, pw, 584);
      const sx = px + pw / 2, sy = 175 + Math.sin(this.t * 2) * 5;
      ctx.globalCompositeOperation = "lighter"; ctx.drawImage(Gfx.glow("90,200,255", true), sx - 110, sy - 9, 40, 18); ctx.globalCompositeOperation = "source-over";
      Gfx.draw(ctx, "ship", sx, sy, 0, 1.6 + this.pop * 0.3);
      for (let i = 0; i < run.pods; i++) Gfx.draw(ctx, "pod", sx - 4, sy + (i ? 72 : -72), this.t * 2, 1.3);
      const rows = [
        ["Main weapon", `${G.WEAPONS[run.weapon]}  ·  Level ${run.power}`],
        ["Satellites", run.pods ? `${run.pods}` : "none"],
        ["Extras", ["homing", "torpedo", "rear", "side", "shield"].filter((k) => run[k]).map((k) => ({ homing: "Missiles", torpedo: "Charges", rear: "Rear gun", side: "Side guns", shield: "Shield" })[k]).join(", ") || "none"],
        ["Energy", `${Math.round(run.energy)} / ${G.maxEnergy()}`],
        ["Ships · Novas", `${run.lives + 1}  ·  ${run.novas}`],
      ];
      rows.forEach(([a, b], i) => {
        txt(ctx, a, px + 24, 278 + i * 34, 18, "rgba(150,210,235,0.85)", "left", 600, BODY);
        txt(ctx, b, px + pw - 24, 278 + i * 34, 19, "#ffffff", "right", 700, BODY);
      });
      ctx.strokeStyle = "rgba(120,220,255,0.25)"; ctx.beginPath(); ctx.moveTo(px + 20, 450); ctx.lineTo(px + pw - 20, 450); ctx.stroke();
      if (this.sel < 16) {
        const it = SHOP[this.sel];
        txt(ctx, it.name.toUpperCase(), px + 24, 482, 22, "#7fe6ff", "left");
        wrap(ctx, it.desc, px + 24, 520, pw - 48, 26, 20);
      } else {
        txt(ctx, "READY FOR DEPLOYMENT", px + 24, 482, 22, "#ffd27a", "left");
        wrap(ctx, `Stage ${run.next + 1}: ${L.name}. Buy equipment with the credits you have earned, then launch.`, px + 24, 520, pw - 48, 26, 20);
      }
      if (this.msgT > 0) txt(ctx, this.msg, px + pw / 2, 650, 20, "#ff7a7a", "center", 700);
      else txt(ctx, "Select · Fire / Enter / Click to buy", px + pw / 2, 650, 17, "rgba(170,210,230,0.7)", "center", 600, BODY);
    },
  };
  function wrap(ctx, s, x, y, w, lh, size) {
    ctx.font = `600 ${size}px ${BODY}`; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillStyle = "rgba(225,240,250,0.92)";
    let line = "", yy = y;
    for (const word of s.split(" ")) {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > w && line) { ctx.fillText(line, x, yy); line = word; yy += lh; }
      else line = test;
    }
    if (line) ctx.fillText(line, x, yy);
  }

  /* ---------- Play ---------- */
  States.play = {
    paused: false, t: 0, bonusDone: false,
    pauseMenu: makeMenu([
      { label: "RESUME", action: () => { States.play.paused = false; } },
      { label: "OPTIONS", action: () => setState("options", "play") },
      { label: "QUIT TO TITLE", action: () => { States.play.paused = false; XA.Main.setCursor(true); setState("title"); } },
    ], W / 2, 330, 420),
    enter(o) {
      if (o && o.resume) { this.paused = true; return; }
      this.paused = false; this.t = 0; this.bonusDone = false;
      G.startLevel(o && o.level !== undefined ? o.level : 0);
      G.onGameOver = () => setState("gameover");
    },
    pause() { if (!this.paused && G.gameOverT <= 0) { this.paused = true; this.pauseMenu.sel = 0; A.sfx("menuBack"); } },
    input() {
      if (this.paused) {
        if (I.hit("pause") || I.hit("back")) { this.paused = false; return; }
        menuInput(this.pauseMenu);
        return;
      }
      if (I.hit("pause")) { this.pause(); return; }
      if (I.hit("formation") || I.mouse.rclicked || I.mouse.wheel) G.cycleFormation();
      if (I.hit("bomb") || I.mouse.mclicked) G.useNova();
      if (G.phase === "clear" && G.phaseT > 4 && (I.hit("confirm") || I.mouse.clicked)) this.finishLevel();
    },
    finishLevel() {
      if (this.done) return;
      this.done = true;
      const run = G.run;
      if (run.level >= G.LEVELS.length - 1) setState("victory");
      else { run.next = run.level + 1; setState("shop"); }
    },
    update(dt) {
      XA.Main.setCursor(this.paused || !G.mouseMode);
      if (this.paused) return;
      this.t += dt;
      if (G.phase !== "clear") this.done = false;
      G.update(dt);
      if (G.phase === "clear") {
        if (!this.bonusDone && G.phaseT > 2) {
          this.bonusDone = true;
          const s = G.stats, ratio = s.spawned ? s.killed / s.spawned : 0;
          G.clearBonus = Object.assign(G.clearBonus || {}, { ratio: Math.min(1, ratio), perfect: ratio >= 0.9 ? 10000 : ratio >= 0.75 ? 5000 : 0 });
          if (G.clearBonus.perfect) G.addScore(G.clearBonus.perfect);
        }
        if (G.phaseT > 10) this.finishLevel();
      } else this.bonusDone = false;
    },
    draw(ctx) {
      G.draw(ctx);
      drawHUD(ctx);
      drawPhaseOverlay(ctx);
      if (G.mouseMode && !this.paused && !G.player.dead) {
        const m = I.mouse;
        ctx.strokeStyle = "rgba(160,240,255,0.7)"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(m.x, m.y, 10, 0, TAU); ctx.moveTo(m.x - 16, m.y); ctx.lineTo(m.x - 6, m.y); ctx.moveTo(m.x + 6, m.y); ctx.lineTo(m.x + 16, m.y); ctx.stroke();
      }
      if (this.paused) {
        ctx.fillStyle = "rgba(0,8,16,0.7)"; ctx.fillRect(0, 0, W, H);
        glowTxt(ctx, "PAUSED", W / 2, 240, 64, "#e8fbff", "rgba(40,200,255,0.8)");
        menuDraw(ctx, this.pauseMenu, this.t + performance.now() / 1000);
      }
    },
  };

  function bar(ctx, x, y, w, h, f, c1, c2, bg = "rgba(0,0,0,0.5)") {
    ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill();
    if (f > 0) {
      const gr = ctx.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, c1); gr.addColorStop(1, c2);
      ctx.fillStyle = gr; ctx.beginPath(); ctx.roundRect(x, y, Math.max(h, w * U.clamp(f, 0, 1)), h, h / 2); ctx.fill();
    }
    ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.stroke();
  }

  function drawHUD(ctx) {
    const run = G.run, p = G.player;
    panel(ctx, 14, 12, 300, 92, 0.55, "rgba(120,220,255,0.25)");
    txt(ctx, "SCORE", 30, 30, 13, "#7fe6ff", "left");
    txt(ctx, U.fmt(run.score), 30, 55, 26, "#ffffff", "left", 900);
    txt(ctx, "CREDITS " + U.fmt(run.credits), 300, 30, 13, "#ffd27a", "right");
    const ef = run.energy / G.maxEnergy();
    bar(ctx, 30, 76, 200, 12, ef, ef > 0.5 ? "#4cff8a" : ef > 0.25 ? "#ffd84a" : "#ff4a4a", ef > 0.5 ? "#b8ffcc" : ef > 0.25 ? "#fff0a0" : "#ff9a9a");
    if (run.shield) bar(ctx, 30, 90, 200, 5, p.shield / 60, "#3ac8ff", "#c0f0ff", "rgba(0,0,0,0.3)");
    for (let i = 0; i < Math.min(run.lives, 6); i++) Gfx.draw(ctx, "ship", 250 + (i % 3) * 22, 72 + Math.floor(i / 3) * 14, 0, 0.22);
    if (run.lives > 6) txt(ctx, `+${run.lives - 6}`, 305, 92, 12, "#fff", "right");
    // bottom left: weapon
    panel(ctx, 14, H - 60, 420, 46, 0.55, "rgba(120,220,255,0.25)");
    txt(ctx, G.WEAPONS[run.weapon].toUpperCase(), 30, H - 37, 16, "#ffffff", "left");
    for (let i = 0; i < 4; i++) { ctx.fillStyle = i < run.power ? "#ffb34a" : "rgba(255,255,255,0.15)"; ctx.fillRect(210 + i * 16, H - 44, 12, 14); }
    if (run.pods) txt(ctx, "SAT: " + G.FORMATIONS[run.formation].toUpperCase(), 290, H - 37, 13, "#7fe6ff", "left");
    for (let i = 0; i < run.novas; i++) Gfx.draw(ctx, "p_nova", 470 + i * 26, H - 37, 0, 0.8);
    // top right: stage progress
    panel(ctx, W - 314, 12, 300, 56, 0.55, "rgba(120,220,255,0.25)");
    txt(ctx, `STAGE ${run.level + 1} · ${G.L.name.toUpperCase()}`, W - 300, 30, 14, "#ffffff", "left");
    bar(ctx, W - 300, 46, 272, 8, G.progress(), "#3ac8ff", "#ffffff");
    // boss bar
    if (G.boss && G.boss.entered) {
      const b = G.boss;
      txt(ctx, b.name, W / 2, 26, 18, "#ff8a6a");
      bar(ctx, W / 2 - 260, 40, 520, 12, b.hp / b.maxHp, "#ff3a3a", "#ffb36a");
      if (b.vulnMul < 1) txt(ctx, "SHIELDED – DESTROY THE GUARDS", W / 2, 66, 13, "rgba(150,220,255,0.9)");
    }
  }

  function drawPhaseOverlay(ctx) {
    const t = G.phaseT;
    if (G.phase === "intro") {
      const a = t < 0.5 ? t / 0.5 : t > 2.4 ? Math.max(0, (3 - t) / 0.6) : 1;
      ctx.globalAlpha = a;
      glowTxt(ctx, `STAGE ${G.run.level + 1}`, W / 2, H / 2 - 40, 64, "#ffffff", "rgba(40,200,255,0.9)", 24);
      txt(ctx, G.L.name.toUpperCase(), W / 2, H / 2 + 20, 28, "#ffd27a");
      if (G.L.sub) txt(ctx, G.L.sub, W / 2, H / 2 + 62, 18, "#ff8a7a");
      ctx.globalAlpha = 1;
    } else if (G.phase === "warning") {
      const a = 0.5 + 0.5 * Math.sin(t * 10);
      ctx.fillStyle = `rgba(255,0,0,${0.12 * a})`; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = `rgba(255,40,40,${0.6 * a})`; ctx.fillRect(0, H / 2 - 70, W, 4); ctx.fillRect(0, H / 2 + 66, W, 4);
      glowTxt(ctx, "WARNING", W / 2, H / 2 - 18, 72, `rgba(255,${120 + 80 * a | 0},${100 * a | 0},1)`, "rgba(255,0,0,0.9)", 26);
      txt(ctx, "HUGE ENEMY APPROACHING", W / 2, H / 2 + 38, 22, "#ffd0d0");
    } else if (G.phase === "clear" && t > 2) {
      const a = Math.min(1, (t - 2) / 0.5), cb = G.clearBonus || {};
      ctx.globalAlpha = a;
      panel(ctx, W / 2 - 300, H / 2 - 150, 600, 300, 0.75);
      glowTxt(ctx, "STAGE CLEAR", W / 2, H / 2 - 100, 48, "#ffffff", "rgba(40,200,255,0.9)", 22);
      const rows = [["Boss bonus", U.fmt(cb.boss || 0)], ["Enemies destroyed", `${Math.round((cb.ratio || 0) * 100)} %`], ["Hunter bonus", U.fmt(G.run.cheated ? 0 : cb.perfect || 0)], ["Credits", U.fmt(G.run.credits)]];
      rows.forEach(([k, v], i) => {
        txt(ctx, k, W / 2 - 240, H / 2 - 40 + i * 38, 22, "rgba(190,225,240,0.9)", "left", 600, BODY);
        txt(ctx, v, W / 2 + 240, H / 2 - 40 + i * 38, 22, "#fff7b0", "right", 700);
      });
      if (t > 4) txt(ctx, "Press fire to continue", W / 2, H / 2 + 125, 18, `rgba(170,210,230,${0.5 + 0.4 * Math.sin(t * 5)})`, "center", 600, BODY);
      ctx.globalAlpha = 1;
    }
    if (G.gameOverT > 0) {
      const a = Math.min(1, (3 - G.gameOverT) / 0.6);
      ctx.globalAlpha = a;
      glowTxt(ctx, "GAME OVER", W / 2, H / 2, 80, "#ffffff", "rgba(255,60,60,0.9)", 30);
      ctx.globalAlpha = 1;
    }
  }

  /* ---------- Game over ---------- */
  function afterGame() {
    const run = G.run;
    const rank = run.cheated ? -1 : HS.rank(run.score);
    if (rank >= 0) setState("nameentry");
    else setState("highscores");
  }
  States.gameover = {
    t: 0,
    enter() { this.t = 0; A.jingle("gameover"); XA.Main.setCursor(true); },
    input() { if (this.t > 1.2 && (I.hit("confirm") || I.mouse.clicked || I.hit("back"))) afterGame(); },
    update(dt) { this.t += dt; G.t += dt; Fx.update(dt); if (this.t > 7) afterGame(); },
    draw(ctx) {
      G.draw(ctx);
      ctx.fillStyle = `rgba(0,6,12,${Math.min(0.75, this.t * 0.5)})`; ctx.fillRect(0, 0, W, H);
      glowTxt(ctx, "GAME OVER", W / 2, H / 2 - 60, 84, "#ffffff", "rgba(255,60,60,0.9)", 30);
      txt(ctx, "FINAL SCORE", W / 2, H / 2 + 30, 18, "#7fe6ff");
      txt(ctx, U.fmt(G.run.score), W / 2, H / 2 + 70, 44, "#fff7b0", "center", 900);
      txt(ctx, `Reached stage ${G.run.level + 1}: ${G.L.name}`, W / 2, H / 2 + 120, 22, "rgba(200,230,245,0.85)", "center", 600, BODY);
    },
  };

  /* ---------- Victory ---------- */
  States.victory = {
    t: 0, bonus: 0,
    enter() {
      this.t = 0;
      const run = G.run;
      run.level = G.LEVELS.length; // all stages done (shown as "ALL")
      this.bonus = run.cheated ? 0 : (run.lives + 1) * 10000;
      if (this.bonus) G.addScore(this.bonus);
      A.jingle("victory");
      setTimeout(() => { if (XA.Main.state === "victory") A.playSong("title"); }, 4500);
      XA.Main.setCursor(true);
      Fx.clear();
    },
    input() { if (this.t > 2.5 && (I.hit("confirm") || I.mouse.clicked)) afterGame(); },
    update(dt) {
      this.t += dt; backdrop.update(dt);
      if (Math.random() < dt * 3) Fx.explode(U.rand(150, W - 150), U.rand(120, H - 260), U.rand(18, 50), { rgb: U.pick(["120,220,255", "255,140,255", "255,220,120", "140,255,180"]) });
      Fx.shake = 0;
    },
    draw(ctx) {
      backdrop.draw(ctx, "coral");
      glowTxt(ctx, "MISSION COMPLETE", W / 2, 170, 64, "#ffffff", "rgba(40,200,255,0.9)", 28);
      wrap(ctx, "The Omega Heart has stopped beating. Its machines in the deep zone fall silent, and the oceans are safe again – for now.", W / 2 - 330, 250, 660, 30, 24);
      panel(ctx, W / 2 - 260, 340, 520, 200, 0.7);
      txt(ctx, "Fleet bonus", W / 2 - 220, 380, 22, "rgba(190,225,240,0.9)", "left", 600, BODY);
      txt(ctx, U.fmt(this.bonus), W / 2 + 220, 380, 22, "#fff7b0", "right");
      txt(ctx, "FINAL SCORE", W / 2, 440, 18, "#7fe6ff");
      txt(ctx, U.fmt(G.run.score), W / 2, 485, 44, "#fff7b0", "center", 900);
      if (this.t > 2.5) txt(ctx, "Press fire to continue", W / 2, 570, 20, `rgba(170,210,230,${0.5 + 0.4 * Math.sin(this.t * 5)})`, "center", 600, BODY);
    },
  };

  /* ---------- Name entry (optional) ---------- */
  const KEYS = ["ABCDEFGHIJ", "KLMNOPQRST", "UVWXYZ0123", "456789.-! "];
  States.nameentry = {
    t: 0, name: "", sel: 0, rank: 0,
    enter() {
      this.t = 0; this.name = Store.get("lastName", ""); this.sel = 0;
      this.rank = HS.rank(G.run.score);
      A.playSong("title");
      XA.Main.setCursor(true);
    },
    cells() {
      const out = [];
      KEYS.forEach((row, r) => [...row].forEach((ch, c) => out.push({ ch, x: W / 2 - 330 + c * 66, y: 330 + r * 62, w: 58, h: 52 })));
      out.push({ ch: "DEL", x: W / 2 - 330, y: 330 + 4 * 62, w: 190, h: 52 });
      out.push({ ch: "SAVE", x: W / 2 - 124, y: 330 + 4 * 62, w: 250, h: 52 });
      out.push({ ch: "SKIP", x: W / 2 + 142, y: 330 + 4 * 62, w: 190, h: 52 });
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
      A.sfx("buy");
      setState("highscores", { mark: pos });
    },
    input() {
      for (const ch of I.typed) { const c = ch.toUpperCase(); if (/^[A-Z0-9 .\-!ÄÖÜ]$/.test(c) && this.name.length < 10) { this.name += c; A.sfx("menuMove"); } }
      if (I.pressed.has("Backspace")) { this.name = this.name.slice(0, -1); A.sfx("menuBack"); }
      if (I.pressed.has("Enter") || I.pressed.has("NumpadEnter")) { this.save(); return; }
      if (I.pressed.has("Escape")) { A.sfx("menuBack"); setState("highscores"); return; }
      const cells = this.cells();
      // navigation with gamepad (and arrow keys)
      let s = this.sel;
      const rowOf = (i) => (i >= 40 ? 4 : Math.floor(i / 10)), colOf = (i) => (i >= 40 ? i - 40 : i % 10);
      const nav = (d) => I.rep.has("Arrow" + d[0].toUpperCase() + d.slice(1)) || I.pad.dir.has(d) || I.pad.pressed.has({ up: 12, down: 13, left: 14, right: 15 }[d]);
      if (nav("right")) s = s >= 40 ? 40 + ((s - 40 + 1) % 3) : rowOf(s) * 10 + ((colOf(s) + 1) % 10);
      if (nav("left")) s = s >= 40 ? 40 + ((s - 40 + 2) % 3) : rowOf(s) * 10 + ((colOf(s) + 9) % 10);
      if (nav("down")) s = s >= 40 ? Math.min(9, (s - 40) * 4) : s >= 30 ? 40 + Math.min(2, Math.floor(colOf(s) / 3.4)) : s + 10;
      if (nav("up")) s = s >= 40 ? 30 + (s - 40) * 4 : s < 10 ? 40 + Math.min(2, Math.floor(s / 3.4)) : s - 10;
      if (s !== this.sel) { this.sel = s; A.sfx("menuMove"); }
      const m = I.mouse;
      let hi = -1;
      cells.forEach((c, i) => { if (inRect(m, c.x, c.y, c.w, c.h)) hi = i; });
      if (m.moved && hi >= 0) this.sel = hi;
      if (I.pad.pressed.has(0) || (m.clicked && hi >= 0)) this.press(cells[this.sel].ch);
      if (I.pad.pressed.has(1)) this.press("DEL");
      if (I.pad.pressed.has(9)) this.save();
    },
    update(dt) { this.t += dt; backdrop.update(dt); },
    draw(ctx) {
      backdrop.draw(ctx);
      ctx.fillStyle = "rgba(0,10,20,0.72)"; ctx.fillRect(0, 0, W, H);
      glowTxt(ctx, "NEW HIGHSCORE", W / 2, 80, 56, "#ffffff", "rgba(255,200,80,0.9)", 26);
      txt(ctx, `Rank ${this.rank + 1} with ${U.fmt(G.run.score)} points`, W / 2, 140, 26, "#fff7b0", "center", 700, BODY);
      txt(ctx, "Enter your name to join the highscore list – or skip it.", W / 2, 176, 22, "rgba(200,230,245,0.85)", "center", 600, BODY);
      panel(ctx, W / 2 - 260, 210, 520, 80, 0.75);
      const cur = Math.floor(this.t * 2.5) % 2 ? "_" : " ";
      txt(ctx, this.name + (this.name.length < 10 ? cur : ""), W / 2, 252, 40, "#ffffff", "center", 900);
      this.cells().forEach((c, i) => {
        const sel = i === this.sel;
        ctx.fillStyle = sel ? "rgba(60,200,255,0.55)" : c.ch.length > 1 ? "rgba(255,170,60,0.25)" : "rgba(10,40,60,0.75)";
        ctx.beginPath(); ctx.roundRect(c.x, c.y, c.w, c.h, 8); ctx.fill();
        ctx.strokeStyle = sel ? "#c8f6ff" : "rgba(120,220,255,0.3)"; ctx.lineWidth = sel ? 2 : 1; ctx.stroke();
        txt(ctx, c.ch === " " ? "␣" : c.ch, c.x + c.w / 2, c.y + c.h / 2 + 1, c.ch.length > 1 ? 20 : 24, "#ffffff");
      });
      txt(ctx, "Type with the keyboard · Enter saves · Esc skips · Gamepad: A types, B deletes, Start saves", W / 2, H - 30, 18, "rgba(170,210,230,0.7)", "center", 500, BODY);
    },
  };
})(window.XA);
