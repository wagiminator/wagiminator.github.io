/* Mossling March: the level screen – scrolling playfield, skill panel, minimap and all input */
"use strict";

(function (ML) {
  const { U, D, G, T, Store } = ML;
  const A = ML.Audio, I = ML.Input, S = ML.Sprites;
  const W = U.W, H = U.H, C = D.C;
  const SC = 3, FH = 540, VIEW = W / SC; // cell scale, field height, visible cells
  const SKILLS = G.SKILLS;
  const SKILL_NAME = (ML.SKILL_NAME = { climb: "Climber", float: "Floater", bomb: "Bomber", block: "Blocker", build: "Builder", bash: "Basher", mine: "Miner", dig: "Digger" });
  const STATE_NAME = { walk: "Walker", fall: "Faller", float: "Floater", climb: "Climber", block: "Blocker", shrug: "Builder", build: "Builder", bash: "Basher", mine: "Miner", dig: "Digger" };
  const inR = (m, b) => m.x >= b.x && m.x <= b.x + b.w && m.y >= b.y && m.y <= b.y + b.h;

  /* ---------- the world: sky, hills, terrain, hazards, hatch, door, mosslings ---------- */
  const V = (ML.View = {});
  const skyCache = {};
  function sky(theme) {
    if (skyCache[theme]) return skyCache[theme];
    const th = T.THEMES[theme], cv = document.createElement("canvas");
    cv.width = W; cv.height = FH;
    const g = cv.getContext("2d");
    const gr = g.createLinearGradient(0, 0, 0, FH);
    gr.addColorStop(0, th.sky[0]); gr.addColorStop(1, th.sky[1]);
    g.fillStyle = gr; g.fillRect(0, 0, W, FH);
    if (theme === "caves" || theme === "forest") {
      // glints in the dark
      const r = U.rng(5);
      for (let i = 0; i < (theme === "caves" ? 90 : 40); i++) { g.fillStyle = theme === "caves" ? `rgba(170,230,255,${0.2 + r() * 0.5})` : `rgba(230,255,170,${0.15 + r() * 0.3})`; g.fillRect(r() * W, r() * FH * 0.8, 2, 2); }
    } else {
      // soft clouds
      const r = U.rng(9);
      for (let i = 0; i < 7; i++) {
        const x = r() * W, y = 40 + r() * 140, s = 30 + r() * 40;
        g.fillStyle = theme === "frost" ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.75)";
        for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(x + k * s * 0.6, y - (k % 2) * s * 0.3, s * 0.5, 0, U.TAU); g.fill(); }
      }
    }
    skyCache[theme] = cv;
    return cv;
  }
  function hills(c, theme, cam, width = W) {
    const th = T.THEMES[theme];
    for (let l = 0; l < 2; l++) {
      const par = l ? 0.5 : 0.25, base = l ? 400 : 330, amp = l ? 70 : 100;
      c.fillStyle = th.hills[l];
      c.beginPath(); c.moveTo(0, FH);
      for (let x = 0; x <= width; x += 16) {
        const wx = x + cam * SC * par;
        const y = base - T.vnoise(wx, l * 50, 260, 11 + l) * amp - T.vnoise(wx, l * 50 + 9, 70, 5) * amp * 0.3;
        c.lineTo(x, y);
      }
      c.lineTo(width, FH); c.closePath(); c.fill();
    }
  }
  /* ---------- scenery that stands on the ground (only decoration, no collision) ---------- */
  function scenery(s) {
    if (s.t.decor) return s.t.decor;
    const tt = s.t, out = [], rnd = U.rng((s.lv.seed || 1) * 31 + 7);
    const lv = s.lv;
    for (let x = 6; x < tt.w - 6; x += 9 + Math.floor(rnd() * 26)) {
      // every ground surface in this column with some free space above it
      if (Math.abs(x - lv.exit.x) < 22 || Math.abs(x - lv.entrance.x) < 18) continue;
      let run = 0;
      for (let y = 0; y < tt.h - 2; y++) {
        if (!T.solid(tt, x, y)) { run++; continue; }
        const ok = run >= 16 && !(lv.hazards || []).some((h) => x >= h.x - 4 && x < h.x + h.w + 4 && y >= h.y - 4);
        run = 0;
        if (ok && rnd() < 0.8) out.push({ x, y, k: rnd(), size: rnd() });
      }
      continue;
      out.push({ x, y, k: rnd(), size: rnd() });
    }
    tt.decor = out;
    return out;
  }
  function drawProp(c, theme, d, t) {
    const px = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(d.x + x, d.y + y, w, h); };
    if (theme === "meadow") {
      if (d.k < 0.35) { // a little tree
        const h = 12 + Math.floor(d.size * 8);
        px(-1, -h, 2, h, "#6a4322");
        for (let yy = -h - 7; yy <= -h + 3; yy++) { const hw = Math.round(Math.sqrt(Math.max(0, 1 - ((yy + h - 2) / 6) ** 2)) * 7); px(-hw, yy, hw * 2, 1, yy < -h - 3 ? "#7ad04a" : "#5aa83a"); }
      } else if (d.k < 0.7) { // flowers
        for (let i = 0; i < 4; i++) { const fx = i * 3 - 5; px(fx, -3 - (i % 2), 1, 3 + (i % 2), "#4a9a2a"); px(fx - 1, -4 - (i % 2), 3, 1, ["#ff7aa0", "#ffd84a", "#ffffff", "#b48aff"][i]); }
      } else { // a bush
        for (let yy = -6; yy <= 0; yy++) { const hw = Math.round(Math.sqrt(Math.max(0, 1 - ((yy + 1) / 6.5) ** 2)) * 6); px(-hw, yy, hw * 2, 1, yy < -3 ? "#6ec04a" : "#4f9a32"); }
        px(-2, -4, 1, 1, "#ff5a5a"); px(2, -3, 1, 1, "#ff5a5a");
      }
    } else if (theme === "forest") {
      if (d.k < 0.4) { // a dark pine
        const h = 18 + Math.floor(d.size * 10);
        px(-1, -4, 2, 4, "#4a2e16");
        for (let yy = -h; yy < -3; yy++) { const hw = Math.max(1, Math.round(((yy + h) / h) * 6 * (1 - 0.25 * (((yy + h) % 6) / 6)))); px(-hw, yy, hw * 2, 1, (yy + h) % 6 < 2 ? "#3a7a3a" : "#2c6030"); }
      } else if (d.k < 0.75) { // toadstools
        px(-3, -4, 2, 4, "#efe4d0"); px(-6, -6, 8, 2, "#d8402a"); px(-5, -6, 1, 1, "#fff"); px(-2, -6, 1, 1, "#fff");
        px(3, -3, 1, 3, "#efe4d0"); px(1, -4, 5, 1, "#d8402a");
      } else { // fern
        for (let i = -4; i <= 4; i++) px(i, -Math.abs(i) - 2 - Math.round(d.size * 3), 1, Math.abs(i) + 2, "#4a9a3a");
      }
    } else if (theme === "caves") {
      // glowing crystals
      const glow = 0.6 + 0.4 * Math.sin(t * 2 + d.x);
      const cols = d.k < 0.5 ? ["#7fe0ff", "#c8f6ff"] : ["#d08aff", "#f0d4ff"];
      const n = 2 + Math.floor(d.size * 3);
      for (let i = 0; i < n; i++) {
        const h = 5 + ((i * 7 + d.x) % 7), x0 = i * 3 - n * 1.5;
        for (let yy = 0; yy < h; yy++) px(x0 + (yy > h - 3 ? 1 : 0), -yy - 1, yy > h - 3 ? 1 : 2, 1, yy % 3 === 0 ? cols[1] : cols[0]);
      }
      c.globalAlpha = 0.18 * glow; px(-6, -10, 12, 10, cols[1]); c.globalAlpha = 1;
    } else if (theme === "frost") {
      if (d.k < 0.5) { // snowy pine
        const h = 16 + Math.floor(d.size * 10);
        px(-1, -3, 2, 3, "#5a3a1e");
        for (let yy = -h; yy < -2; yy++) { const hw = Math.max(1, Math.round(((yy + h) / h) * 6)); px(-hw, yy, hw * 2, 1, (yy + h) % 5 === 0 ? "#f4faff" : "#3c6a5a"); }
      } else { // ice spikes
        for (let i = 0; i < 3; i++) { const h = 4 + ((i * 5 + d.x) % 6); for (let yy = 0; yy < h; yy++) px(i * 4 - 5, -yy - 1, yy > h - 2 ? 1 : 2, 1, "#cfe8ff"); }
      }
    }
  }
  V.drawWorld = function (c, s, cam, t, opt = {}) {
    const lv = s.lv;
    const width = opt.whole ? Math.max(W, lv.w * SC) : W;
    c.drawImage(sky(lv.theme), 0, 0, width, FH);
    hills(c, lv.theme, cam, width);
    T.flush(s.t);
    c.save();
    c.imageSmoothingEnabled = false;
    c.scale(SC, SC);
    c.translate(-cam, 0);
    // hazards behind the terrain edge
    for (const h of lv.hazards || []) {
      const lava = h.kind === "lava";
      c.fillStyle = lava ? "#e0521e" : "#2f7fd0";
      c.fillRect(h.x, h.y + 2, h.w, h.h);
      c.fillStyle = lava ? "#ffb02a" : "#7fc4f4";
      for (let x = h.x; x < h.x + h.w; x++) {
        const wv = Math.round(Math.sin(x * 0.45 + t * (lava ? 2.2 : 4)) * 1.2 + 1);
        c.fillRect(x, h.y + wv, 1, 1);
      }
      if (lava && Math.random() < 0.3) { c.fillStyle = "#ffe080"; c.fillRect(h.x + Math.random() * h.w, h.y + 1, 1, 1); }
    }
    for (const d of scenery(s)) if (d.x > cam - 20 && d.x < cam + (opt.whole ? s.lv.w : VIEW) + 20) drawProp(c, lv.theme, d, t);
    c.drawImage(s.t.cv, 0, 0);
    S.hatch(c, lv.entrance.x, lv.entrance.y, U.clamp((s.hatch - 4) / 12, 0, 1), lv.theme);
    S.door(c, lv.exit.x, lv.exit.y + 1, t);
    // mosslings
    for (const m of s.ms) {
      if (m.st === "dead" || m.st === "saved") continue;
      const [pose, f] = S.pose(m);
      c.imageSmoothingEnabled = true;
      c.drawImage(S.frame(pose, f, m.dir), m.x - S.AX, m.y - S.AY, S.SZ, S.SZ);
    }
    // particles
    for (const p of s.fx) { c.fillStyle = p.col; c.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); }
    c.restore();
    // fuses above the heads
    for (const m of s.ms) {
      if (m.bomb < 0 || G.GONE.has(m.st)) continue;
      const n = Math.ceil(m.bomb / 16);
      D.text(c, String(n), (m.x - cam) * SC, (m.y - 17) * SC, 22, n <= 1 ? "#ff6a4a" : C.gold, "center", { weight: 700, lw: 5 });
    }
  };

  /* ================= the play state ================= */
  const States = ML.States;
  const P = (States.play = {
    sel: "dig", cam: 0, paused: false, fast: false, menu: false, nukeArm: 0, acc: 0, t: 0, btns: [], menuBtns: [], hover: null, touchDown: null,
  });
  P.enter = function (arg) {
    if (arg && arg.idx !== undefined) {
      this.idx = arg.idx;
      const lv = ML.LEVELS[arg.idx];
      G.start(lv);
      G.on = onEvent;
      const first = SKILLS.find((k) => lv.skills[k]);
      this.sel = first || "dig";
      this.cam = U.clamp(lv.entrance.x - VIEW / 2, 0, Math.max(0, lv.w - VIEW));
      this.paused = false; this.fast = false; this.menu = false; this.nukeArm = 0; this.acc = 0; this.t = 0; this.endT = 0; this.rateHold = 0;
      A.playSong(lv.theme);
    }
    this.layout();
  };
  P.pause = function () { if (!this.menu && !G.s.over) { this.menu = true; this.buildMenu(); A.sfx("tick"); } };

  function onEvent(type, d) {
    switch (type) {
      case "hatch": A.sfx("hatch"); A.say("Off we go!", { gap: 0, pitch: 1.4, rate: 1.1 }); break;
      case "spawn": A.sfx("pop"); break;
      case "saved": A.sfx("saved"); break;
      case "splat": A.sfx("splat"); break;
      case "drown": A.sfx("drown"); break;
      case "boom": A.sfx("boom"); break;
      case "brick": if (P.onScreen(d.m)) A.sfx(d.left <= 2 && d.left > 0 ? "lastBrick" : "brick"); break;
      case "clank": if (P.onScreen(d)) A.sfx("clank"); break;
      case "float": if (P.onScreen(d)) A.sfx("float"); break;
      case "assign": A.sfx("assign"); if (d.skill === "bomb") A.sfx("uhoh"); break;
      case "nuke": A.sfx("nuke"); break;
      case "over": break;
    }
  }
  P.onScreen = (m) => m && m.x > P.cam - 10 && m.x < P.cam + VIEW + 10;

  /* ---------- panel ---------- */
  const PY = FH + 40, BW = 66, BH = 104;
  P.layout = function () {
    const B = [];
    let x = 10;
    B.push({ id: "rateDown", x, y: PY, w: BW, h: BH, hold: true, act: () => this.rate(-1) }); x += BW + 4;
    B.push({ id: "rateUp", x, y: PY, w: BW, h: BH, hold: true, act: () => this.rate(1) }); x += BW + 8;
    for (const k of SKILLS) { B.push({ id: "skill", skill: k, x, y: PY, w: BW, h: BH, act: () => this.pick(k) }); x += BW + 4; }
    x += 4;
    B.push({ id: "pause", x, y: PY, w: BW, h: BH, act: () => { this.paused = !this.paused; A.sfx("tick"); } }); x += BW + 4;
    B.push({ id: "fast", x, y: PY, w: BW, h: BH, act: () => { this.fast = !this.fast; A.sfx("tick"); } }); x += BW + 4;
    B.push({ id: "nuke", x, y: PY, w: BW, h: BH, act: () => this.nuke() }); x += BW + 10;
    this.mini = { x, y: PY, w: W - x - 10, h: BH };
    this.btns = B;
  };
  P.rate = function (d) { const s = G.s, r = s.rate; G.setRate(r + d); if (s.rate !== r) A.sfx("menuMove"); };
  P.pick = function (k) { if (this.sel !== k) { this.sel = k; A.sfx("pick"); } };
  P.nuke = function () {
    if (G.s.nuke) return;
    if (this.nukeArm > 0) { G.nuke(); this.nukeArm = 0; A.say("Uh oh", { gap: 0, pitch: 1.5 }); }
    else { this.nukeArm = 1.2; A.sfx("tick"); }
  };

  /* ---------- pause menu ---------- */
  P.buildMenu = function () {
    const x = W / 2 - 160;
    this.menuBtns = [
      { x, y: 230, w: 320, h: 58, label: "Resume", act: () => { this.menu = false; } },
      { x, y: 300, w: 320, h: 58, label: "Restart level", act: () => ML.Main.setState("intro", { idx: this.idx }) },
      { x, y: 370, w: 320, h: 58, label: "Options", act: () => ML.Main.setState("options", { back: "play" }) },
      { x, y: 440, w: 320, h: 58, label: "Give up", color: C.red, dark: "#a83a22", act: () => { G.s.over = { win: false, saved: G.s.saved, gaveUp: true }; this.menu = false; ML.Main.setState("results", { idx: this.idx }); } },
    ];
  };

  /* ---------- input ---------- */
  P.input = function (dt) {
    const m = I.mouse, s = G.s;
    if (this.menu) {
      if (I.hit("menu") || I.hit("back")) { this.menu = false; A.sfx("menuBack"); return; }
      ML.UI.runButtons(this.menuBtns);
      return;
    }
    if (s.over) return;
    if (I.hit("menu")) { this.pause(); return; }
    if (I.hit("pause")) { this.paused = !this.paused; A.sfx("tick"); }
    if (I.hit("fast")) { this.fast = !this.fast; A.sfx("tick"); }
    if (I.hit("nuke")) this.nuke();
    for (let i = 0; i < 8; i++) if (I.pressed.has("Digit" + (i + 1)) || I.pressed.has("F" + (i + 1))) this.pick(SKILLS[i]);
    if (I.hit("skillPrev") || I.hit("skillNext")) {
      const i = SKILLS.indexOf(this.sel), d = I.hit("skillNext") ? 1 : -1;
      this.pick(SKILLS[(i + d + 8) % 8]);
    }
    // release rate: held keys and buttons repeat
    const rd = I.held("rateUp") ? 1 : I.held("rateDown") ? -1 : 0;
    if (rd) { this.rateHold -= dt; if (this.rateHold <= 0) { this.rate(rd); this.rateHold = this.rateHold < -1 ? 0.04 : 0.09; } } else if (!m.down) this.rateHold = 0;
    // scrolling: screen edges, keys, the right stick, the d-pad
    let sx = 0;
    if (I.keys.has("ArrowLeft") || I.held("scrollL") || (I.pad.buttons[14])) sx -= 1;
    if (I.keys.has("ArrowRight") || I.held("scrollR") || (I.pad.buttons[15])) sx += 1;
    if (I.pad.rx) sx += I.pad.rx;
    if (!I.touch && m.inside && m.y < FH && !m.down) { if (m.x < 26) sx -= 1; else if (m.x > W - 26) sx += 1; }
    if (sx) this.cam = U.clamp(this.cam + sx * 140 * dt, 0, Math.max(0, s.lv.w - VIEW));
    // panel
    const inField = m.y < FH;
    const cx = this.cam + m.x / SC, cy = m.y / SC;
    this.hover = inField ? G.pick(cx, cy, this.sel) : null;
    if (m.clicked && !inField) {
      const mi = this.mini;
      if (inR(m, mi)) this.miniDrag = true;
      else for (const b of this.btns) if (inR(m, b)) { b.act(); if (b.hold) this.rateHold = 0.35; break; }
    }
    if (m.down && !inField) for (const b of this.btns) if (b.hold && inR(m, b)) {
      this.rateHold -= dt;
      if (this.rateHold <= 0) { b.act(); this.rateHold = 0.06; }
    }
    if (this.miniDrag) {
      const mi = this.mini, sc = mi.w / s.lv.w;
      this.cam = U.clamp((m.x - mi.x) / sc - VIEW / 2, 0, Math.max(0, s.lv.w - VIEW));
      if (!m.down) this.miniDrag = false;
    }
    // the play field: click (mouse) or tap (touch; a drag scrolls instead)
    if (inField) {
      if (I.touch) {
        if (m.clicked) this.touchDown = { x: m.x, y: m.y, cam: this.cam, moved: false };
        if (this.touchDown && m.down) {
          const dx = m.x - this.touchDown.x;
          if (Math.abs(dx) > 14) this.touchDown.moved = true;
          if (this.touchDown.moved) this.cam = U.clamp(this.touchDown.cam - dx / SC, 0, Math.max(0, s.lv.w - VIEW));
        }
        if (this.touchDown && m.released) { if (!this.touchDown.moved) this.give(this.hover); this.touchDown = null; }
      } else if (m.clicked) this.give(this.hover);
    }
  };
  P.give = function (target) {
    const s = G.s;
    if (!target) return;
    if ((s.skills[this.sel] || 0) <= 0 || !G.assign(target, this.sel)) A.sfx("deny");
  };

  P.update = function (dt) {
    this.t += dt;
    if (this.nukeArm > 0) this.nukeArm -= dt;
    const s = G.s;
    if (s.over) {
      this.endT += dt;
      if (this.endT > 1.4) ML.Main.setState("results", { idx: this.idx });
      return;
    }
    if (this.paused || this.menu) return;
    this.acc += dt * (this.fast ? 3 : 1);
    let n = 0;
    while (this.acc >= G.TICK && n < 12) { G.update(); this.acc -= G.TICK; n++; if (s.over) break; }
    // tick of the fuses
    if (s.ms.some((m) => m.bomb >= 0 && m.bomb % 16 === 0 && !G.GONE.has(m.st))) A.sfx("fuse");
  };

  /* ---------- drawing ---------- */
  P.draw = function (c) {
    const s = G.s, m = I.mouse;
    c.save(); c.beginPath(); c.rect(0, 0, W, FH); c.clip();
    V.drawWorld(c, s, this.cam, this.t);
    if (this.hover && !this.menu) {
      const h = this.hover, ok = (s.skills[this.sel] || 0) > 0 && G.canAssign(h, this.sel);
      D.crosshair(c, (h.x - this.cam) * SC, (h.y - 5) * SC, ok);
    } else if (m.y < FH && !this.menu) D.crosshair(c, m.x, m.y, false);
    if (this.paused) D.text(c, "PAUSED", W / 2, 60, 44, C.cream, "center", { weight: 700, lw: 8 });
    if (this.t < 4 && s.lv.tip && ML.LEVELS.indexOf(s.lv) < 5) {
      c.globalAlpha = U.clamp(4 - this.t, 0, 1);
      D.text(c, s.lv.tip, W / 2, FH - 28, 22, C.cream, "center", { weight: 600, lw: 6 });
      c.globalAlpha = 1;
    }
    c.restore();
    this.drawPanel(c);
    if (this.menu) {
      c.fillStyle = "rgba(20,10,4,0.6)"; c.fillRect(0, 0, W, H);
      D.board(c, W / 2 - 200, 140, 400, 390, { title: "Paused" });
      ML.UI.drawButtons(c, this.menuBtns);
    }
    if (s.over) {
      const a = Math.min(1, this.endT * 2);
      c.globalAlpha = a;
      D.text(c, s.over.timeUp ? "Time's up!" : s.over.win ? "Well done!" : "Not enough…", W / 2, FH / 2, 64, s.over.win ? C.gold : C.cream, "center", { weight: 700, lw: 10 });
      c.globalAlpha = 1;
    }
    if (I.showCursor() && (m.y >= FH || this.menu)) D.hand(c, m.x, m.y);
  };

  // a mossling pose with its feet at (x, y), k pixels per cell
  function pose(c, name, f, x, y, k, dir = 1) {
    const cv = S.frame(name, f, dir);
    c.drawImage(cv, x - (S.AX + 0.5) * k, y - (S.AY + 1) * k, S.SZ * k, S.SZ * k);
  }
  function arrow(c, x0, y0, x1, y1, col) {
    const a = Math.atan2(y1 - y0, x1 - x0);
    c.lineCap = "round"; c.lineJoin = "round";
    for (const [w, cc] of [[7, C.ink], [3.5, col]]) {
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1);
      c.moveTo(x1 - Math.cos(a - 0.6) * 7, y1 - Math.sin(a - 0.6) * 7); c.lineTo(x1, y1); c.lineTo(x1 - Math.cos(a + 0.6) * 7, y1 - Math.sin(a + 0.6) * 7);
      c.lineWidth = w; c.strokeStyle = cc; c.stroke();
    }
  }
  function dirt(c, x, y, w, h) {
    D.rr(c, x, y, w, h, 3, "#8a5a32", C.ink, 2);
    c.fillStyle = "#6fbf45"; c.fillRect(x + 1, y + 1, w - 2, 3);
  }
  const SKILL_LABEL = (ML.SKILL_LABEL = { climb: "CLIMB", float: "FLOAT", bomb: "BOMB", block: "BLOCK", build: "BRIDGE", bash: "BASH", mine: "MINE", dig: "DIG" });
  // a clear picture of each job (centre x, feet line y)
  function skillIcon(c, k, x, y) {
    c.save();
    c.imageSmoothingEnabled = true;
    const K = 3.1;
    switch (k) {
      case "climb":
        dirt(c, x + 9, y - 44, 14, 46);
        pose(c, "climb", 1, x - 3, y - 8, K);
        arrow(c, x - 20, y - 4, x - 20, y - 38, "#ffe680");
        break;
      case "float":
        pose(c, "float", 0, x, y - 2, K * 0.92);
        break;
      case "bomb":
        D.circle(c, x - 2, y - 14, 15, "#2c2c34", C.ink, 3);
        c.fillStyle = "rgba(255,255,255,0.35)"; c.beginPath(); c.arc(x - 8, y - 20, 4, 0, U.TAU); c.fill();
        D.line(c, x + 7, y - 25, x + 13, y - 33, "#c8a070", 3);
        D.circle(c, x + 15, y - 35, 4, "#ffb02a", null);
        D.circle(c, x + 15, y - 35, 2, "#fff2b0", null);
        D.text(c, "5", x - 2, y - 13, 16, "#fff", "center", { weight: 700 });
        break;
      case "block":
        pose(c, "block", 0, x, y, K);
        break;
      case "build": {
        // three steps of bricks with a mossling on top
        for (let i = 0; i < 3; i++) {
          const bx = x - 24 + i * 12, by = y - 6 - i * 8;
          D.rr(c, bx, by, 18, 7, 2, "#d8b070", C.ink, 2);
        }
        pose(c, "build", 0, x - 2, y - 22, K * 0.8);
        break;
      }
      case "bash":
        dirt(c, x + 10, y - 38, 18, 40);
        pose(c, "bash", 1, x - 6, y, K);
        arrow(c, x + 8, y - 16, x + 26, y - 16, "#ffe680");
        break;
      case "mine":
        dirt(c, x - 26, y - 6, 52, 10);
        pose(c, "mine", 0, x - 8, y - 6, K * 0.85);
        arrow(c, x + 4, y - 28, x + 22, y - 10, "#ffe680");
        break;
      case "dig":
        dirt(c, x - 20, y - 6, 40, 10);
        pose(c, "dig", 1, x - 8, y - 6, K * 0.85);
        arrow(c, x + 16, y - 36, x + 16, y - 10, "#ffe680");
        break;
    }
    c.restore();
  }
  P.drawPanel = function (c) {
    const s = G.s, m = I.mouse;
    c.fillStyle = C.woodD; c.fillRect(0, FH, W, H - FH);
    for (let y = FH; y < H; y += 30) { c.fillStyle = "rgba(255,220,170,0.05)"; c.fillRect(0, y, W, 12); D.line(c, 0, y, W, y, "rgba(30,15,5,0.4)", 2); }
    D.line(c, 0, FH + 1, W, FH + 1, C.ink, 4);
    // status line
    const alive = G.alive(), pct = (n) => Math.floor((n * 100) / s.lv.count);
    const label = this.hover ? `${STATE_NAME[this.hover.st] || ""}${this.hover.climb ? " · climbs" : ""}${this.hover.float ? " · floats" : ""}` : "";
    D.text(c, label, 16, FH + 20, 22, C.gold, "left", { weight: 700, lw: 5 });
    D.text(c, `Out ${alive}`, 380, FH + 20, 22, C.cream, "left", { weight: 700, lw: 5 });
    D.text(c, `Home ${pct(s.saved)}%`, 500, FH + 20, 22, s.saved >= s.lv.need ? C.leafL : C.cream, "left", { weight: 700, lw: 5 });
    D.text(c, `Need ${pct(s.lv.need)}%`, 660, FH + 20, 22, C.dim, "left", { weight: 700, lw: 5 });
    const tl = Math.max(0, Math.ceil(s.time));
    D.text(c, `Time ${Math.floor(tl / 60)}:${String(tl % 60).padStart(2, "0")}`, 810, FH + 20, 22, tl < 30 ? "#ff8a6a" : C.cream, "left", { weight: 700, lw: 5 });
    D.text(c, this.fast ? "»» Fast" : "", 990, FH + 20, 22, C.leafL, "left", { weight: 700, lw: 5 });
    // buttons
    for (const b of this.btns) {
      const hov = inR(m, b);
      let on = false, dis = false;
      if (b.id === "skill") { on = this.sel === b.skill; dis = !(s.skills[b.skill] > 0); }
      if (b.id === "pause") on = this.paused;
      if (b.id === "fast") on = this.fast;
      if (b.id === "nuke") on = this.nukeArm > 0 || s.nuke;
      D.rr(c, b.x, b.y, b.w, b.h, 10, on ? "#b8894e" : hov ? "#8f6338" : C.wood, on ? C.gold : C.ink, on ? 4 : 3);
      const cx = b.x + b.w / 2;
      const lab = (txt, col = C.cream) => D.text(c, txt, cx, b.y + b.h - 11, 14, col, "center", { weight: 700, lw: 4 });
      if (b.id === "skill") {
        const n = s.skills[b.skill] || 0;
        D.text(c, n ? String(n) : "–", cx, b.y + 15, 21, dis ? C.faint : C.cream, "center", { weight: 700, lw: 5 });
        c.globalAlpha = dis ? 0.35 : 1;
        skillIcon(c, b.skill, cx, b.y + 76);
        c.globalAlpha = 1;
        lab(SKILL_LABEL[b.skill], dis ? C.faint : on ? C.gold : C.cream);
      } else if (b.id === "rateDown" || b.id === "rateUp") {
        D.text(c, String(b.id === "rateDown" ? s.minRate : s.rate), cx, b.y + 15, 21, C.cream, "center", { weight: 700, lw: 5 });
        D.text(c, b.id === "rateDown" ? "−" : "+", cx, b.y + 52, 46, b.id === "rateDown" ? "#ffb4a0" : C.leafL, "center", { weight: 700, lw: 6 });
        lab(b.id === "rateDown" ? "SLOWER" : "FASTER");
      } else if (b.id === "pause") {
        c.fillStyle = C.cream; c.strokeStyle = C.ink; c.lineWidth = 3;
        for (const dx of [-11, 4]) { c.strokeRect(cx + dx, b.y + 30, 8, 34); c.fillRect(cx + dx, b.y + 30, 8, 34); }
        lab("PAUSE", on ? C.gold : C.cream);
      } else if (b.id === "fast") {
        for (const dx of [-14, 2]) { c.beginPath(); c.moveTo(cx + dx, b.y + 30); c.lineTo(cx + dx + 16, b.y + 47); c.lineTo(cx + dx, b.y + 64); c.closePath(); c.fillStyle = C.cream; c.fill(); c.lineWidth = 3; c.strokeStyle = C.ink; c.stroke(); }
        lab("FAST", on ? C.gold : C.cream);
      } else if (b.id === "nuke") {
        // a bomb with many sparks
        D.circle(c, cx, b.y + 50, 15, "#2c2c34", C.ink, 3);
        for (let i = 0; i < 8; i++) { const a = (i / 8) * U.TAU + this.t * (s.nuke ? 6 : 0); D.line(c, cx + Math.cos(a) * 19, b.y + 50 + Math.sin(a) * 19, cx + Math.cos(a) * 25, b.y + 50 + Math.sin(a) * 25, "#ffb02a", 3); }
        D.text(c, this.nukeArm > 0 ? "Sure?" : "", cx, b.y + 15, 19, "#ff8a6a", "center", { weight: 700, lw: 5 });
        lab("BOOM", this.nukeArm > 0 ? "#ff8a6a" : C.cream);
      }
    }
    // minimap
    const mi = this.mini, lv = s.lv, sc = mi.w / lv.w, mh = T.H * sc;
    const my = mi.y + (mi.h - mh) / 2;
    D.rr(c, mi.x - 4, mi.y - 2, mi.w + 8, mi.h + 4, 8, "#1e1208", C.ink, 3);
    c.save(); c.imageSmoothingEnabled = true;
    c.drawImage(s.t.cv, 0, 0, lv.w, T.H, mi.x, my, mi.w, mh);
    c.restore();
    c.fillStyle = "#ffe680";
    for (const q of s.ms) if (!G.GONE.has(q.st)) c.fillRect(mi.x + q.x * sc - 1, my + (q.y - 4) * sc - 1, 2, 2);
    c.fillStyle = "#7ad04a"; c.fillRect(mi.x + lv.exit.x * sc - 2, my + (lv.exit.y - 6) * sc - 2, 5, 5);
    c.strokeStyle = "#fff"; c.lineWidth = 2;
    c.strokeRect(mi.x + this.cam * sc, my, VIEW * sc, mh);
  };
})(window.ML);
