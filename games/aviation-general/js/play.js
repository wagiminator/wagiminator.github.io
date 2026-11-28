/* Aviation General: the battle screen – camera, selection, orders, overlays, the side panel,
   playing back what happened (moves, fire, explosions) and running the computer's turn.      */
"use strict";

(function (MG) {
  const { U, D, Input: I } = MG;
  const G = MG.G, AI = MG.AI, A = MG.Audio;
  const W = U.W, H = U.H, TOP = 40, PW = 300;
  const MAP = { x: 0, y: TOP, w: W - PW, h: H - TOP };
  const States = (MG.States = MG.States || {});

  const P = {
    sel: 0, reach: null, mode: null, hover: -1, cam: { x: 0, y: 0, z: 1.15, tx: null, ty: null },
    ov: { plates: true, mob: false, sight: false, threat: false },
    fx: [], booms: [], floats: [], planes: [], sounds: [], busyUntil: 0, now: 0,
    aiOn: false, buttons: [], menu: false, toast: null, dragging: false,
  };
  States.play = P;
  const S = () => G.S;
  const player = () => G.S.scen.player;
  const myTurn = () => !S().over && S().side === player() && !P.aiOn;

  /* ---------------- camera ---------------- */
  const sx = (wx) => MAP.x + (wx - P.cam.x) * P.cam.z;
  const sy = (wy) => MAP.y + (wy - P.cam.y) * P.cam.z;
  const wx = (x) => (x - MAP.x) / P.cam.z + P.cam.x;
  const wy = (y) => (y - MAP.y) / P.cam.z + P.cam.y;
  function clampCam() {
    const c = P.cam, vw = MAP.w / c.z, vh = MAP.h / c.z, ww = D.worldW(), wh = D.worldH();
    c.x = ww < vw ? (ww - vw) / 2 : U.clamp(c.x, 0, ww - vw);
    c.y = wh < vh ? (wh - vh) / 2 : U.clamp(c.y, 0, wh - vh);
  }
  function centerOn(i, smooth) {
    const tx = D.cx(i) - MAP.w / 2 / P.cam.z, ty = D.cy(i) - MAP.h / 2 / P.cam.z;
    if (smooth) { P.cam.tx = tx; P.cam.ty = ty; } else { P.cam.x = tx; P.cam.y = ty; clampCam(); }
  }
  function onScreen(i, margin = 40) { const x = sx(D.cx(i)), y = sy(D.cy(i)); return x > MAP.x + margin && x < MAP.x + MAP.w - margin && y > MAP.y + margin && y < MAP.y + MAP.h - margin; }
  function zoomAt(f, px, py) {
    const ox = wx(px), oy = wy(py);
    P.cam.z = U.clamp(P.cam.z * f, 0.5, 2.4);
    P.cam.x = ox - (px - MAP.x) / P.cam.z; P.cam.y = oy - (py - MAP.y) / P.cam.z;
    clampCam();
  }

  /* ---------------- starting a battle ---------------- */
  P.enter = function (arg) {
    if (arg && arg.load) { if (!G.load(arg.load)) { G.setup(MG.SCENARIOS[0]); } }
    else if (!arg || !arg.keep) G.setup(arg && arg.scen ? arg.scen : MG.SCENARIOS[0]);
    AI.reset();
    if (!(arg && arg.ready)) D.renderMap();
    P.reported = false;
    if (!(arg && arg.keep) || arg.ready) P.coach = S().scen.tutorial && !MG.Store.get("tutorialOff", false) ? { step: 0, t: 0 } : null;
    P.sel = 0; P.reach = null; P.mode = null; P.fx = []; P.booms = []; P.floats = []; P.planes = []; P.sounds = [];
    P.busyUntil = 0; P.aiOn = false; P.menu = false;
    const first = G.unitsOf(player()).find((u) => !u.type.isAir);
    if (first) centerOn(first.idx); else centerOn(0);
    if (S().side !== player()) startAI();
  };

  /* ---------------- playing back events ---------------- */
  function seenByPlayer(u, before) { return u && (u.side === player() || before.has(u.id) || S().spot[player()].has(u.id)); }
  function play(evs, before = new Set()) {
    const now = P.now;
    let end = now;
    let focus = -1;
    for (const e of evs) {
      const t0 = now + e.at;
      if (e.type === "move") {
        const u = G.byId(e.u);
        if (!u || !seenByPlayer(u, before)) continue;
        u.anim = { path: e.path, t0, dur: Math.max(0.01, e.dur) };
        end = Math.max(end, t0 + e.dur);
        if (e.path.length > 1) P.sounds.push({ t: t0, n: u.type.heli ? "rotor" : u.type.uav ? "uav" : u.type.mob === "foot" ? "steps" : "engine" });
        if (focus < 0 && u.side !== player()) focus = e.path[e.path.length - 1];
      } else if (e.type === "fire") {
        const dur = e.dur || (e.kind === "shell" ? 0.55 : e.kind === "aa" ? 0.3 : e.kind === "shot" ? 0.15 : 0.35);
        P.fx.push({ ...e, t0 });
        P.sounds.push({ t: t0, n: e.kind === "shell" ? "artillery" : e.kind === "aa" ? "missile" : e.kind === "shot" ? "cannon" : e.kind === "drone" ? "drone" : "missile" });
        end = Math.max(end, t0 + dur + 0.2);
        if (focus < 0) focus = e.to;
      } else if (e.type === "boom") { P.booms.push({ ...e, t0 }); P.sounds.push({ t: t0, n: "explode" }); end = Math.max(end, t0 + 0.6); }
      else if (e.type === "hit") { P.floats.push({ i: e.i, txt: e.txt, t0, air: e.air, col: "#ff5040" }); end = Math.max(end, t0 + 0.5); }
      else if (e.type === "dead") { const u = G.byId(e.u); if (u) u.deadT = t0 + 0.2; }
      else if (e.type === "flag") P.sounds.push({ t: t0, n: "flag" });
      else if (e.type === "plane") { P.planes.push({ ...e, t0 }); end = Math.max(end, t0 + e.dur); }
      else if (e.type === "chute") { P.floats.push({ i: e.i, txt: "⛉", t0, col: "#ffffff", chute: true }); end = Math.max(end, t0 + 0.8); }
      else if (e.type === "sfx") { const u = e.u ? G.byId(e.u) : null; if (!u || seenByPlayer(u, before)) P.sounds.push({ t: t0, n: e.name }); }
    }
    P.busyUntil = Math.max(P.busyUntil, end);
    if (focus >= 0 && !onScreen(focus, 80)) centerOn(focus, true);
    return end - now;
  }
  const busy = () => P.now < P.busyUntil;

  /* ---------------- orders ---------------- */
  function select(u) {
    P.sel = u ? u.id : 0; P.mode = null;
    P.reach = u && u.side === player() && G.canMove(u) && myTurn() ? G.reach(u) : null;
    if (u) A.sfx("select");
  }
  const selU = () => (P.sel ? G.byId(P.sel) : null);
  function refresh() { const u = selU(); if (u && !G.alive(u)) select(null); else if (u) { P.reach = u.side === player() && G.canMove(u) && myTurn() ? G.reach(u) : null; } }
  function doIt(f) { G.beginAction(); const ok = f(); if (ok) play(G.S.ev); else A.sfx("deny"); refresh(); return ok; }

  function enemyAt(i, u) {
    const sp = S().spot[player()];
    const list = S().units.filter((e) => G.alive(e) && e.idx === i && e.side !== player() && sp.has(e.id));
    if (u) { const ok = list.filter((e) => G.canAttack(u, e)); if (ok.length) return ok.find((e) => !G.isFlying(e)) || ok[0]; }
    return list[0] || null;
  }
  function ownAt(i) { return S().units.filter((o) => G.alive(o) && o.idx === i && o.side === player()); }

  function clickHex(i) {
    if (i < 0) return;
    const u = selU();
    if (P.mode) {
      const m = P.mode;
      if (m.kind === "strike") { if (m.hexes.includes(i)) { doIt(() => G.uavStrike(G.byId(m.unit), i)); } P.mode = null; return; }
      if (m.kind === "drop") { if (m.hexes.includes(i)) { doIt(() => G.paradrop(G.byId(m.unit), i)); P.mode = null; } else P.mode = null; return; }
      if (m.hexes && m.hexes.includes(i)) {
        let target = i;
        if (m.id === "embark") { const g = ownAt(i).find((o) => !o.type.isAir && m.units.includes(o.id)); if (!g) return; target = g.id; }
        doIt(() => G.doAction(G.byId(m.unit), m.id, target));
      }
      P.mode = null; return;
    }
    if (u && u.side === player() && myTurn()) {
      const e = enemyAt(i, u);
      if (e && G.canAttack(u, e)) { doIt(() => G.attack(u, e)); return; }
      if (P.reach && P.reach.has(i) && i !== u.idx && !P.reach.get(i).pass) { doIt(() => G.move(u, i)); return; }
    }
    const mine = ownAt(i);
    if (mine.length) {
      // clicking the same hex again switches between the unit on the ground and the one in the air
      const cur = mine.findIndex((o) => o.id === P.sel);
      select(mine[(cur + 1) % mine.length]);
      return;
    }
    const e = enemyAt(i);
    select(e || null);
  }

  function nextUnit() {
    const own = G.unitsOf(player()).filter((u) => !u.type.farp && (G.canMove(u) || (!u.attacked && G.targets(u).length) || G.actions(u).length));
    if (!own.length) { A.sfx("deny"); return; }
    const k = own.findIndex((u) => u.id === P.sel);
    const u = own[(k + 1) % own.length];
    select(u); centerOn(u.idx, true);
  }

  function endTurn() {
    if (!myTurn() || busy()) return;
    P.mode = null; select(null);
    G.endTurn();
    play(G.S.ev);
    if (S().over) { A.sfx(S().over.winner === player() ? "win" : "lose"); return; }
    startAI();
  }
  function startAI() { P.aiOn = true; AI.start(S().side); A.sfx("turn"); P.aiPause = P.now + 0.4; }
  function aiTick() {
    if (busy() || P.now < (P.aiPause || 0)) return;
    const before = new Set(S().spot[player()]);
    const more = AI.step();
    if (more) {
      const d = play(G.S.ev, before);
      P.aiPause = P.now + (d > 0.02 ? 0.25 : 0);
    } else {
      P.aiOn = false;
      if (!S().over) {
        G.endTurn(); play(G.S.ev);
        if (!S().over) { A.sfx("turn"); MG.Store.set("save", G.save()); }
      }
      if (S().over) A.sfx(S().over.winner === player() ? "win" : "lose");
      refresh();
    }
  }

  /* ---------------- per frame ---------------- */
  P.input = function (dt) {
    const m = I.mouse;
    if (P.menu) return menuInput();
    // camera: keys, wheel, drag, pinch, right stick
    const sp = 600 * dt / P.cam.z;
    if (I.held("left")) P.cam.x -= sp; if (I.held("right")) P.cam.x += sp;
    if (I.held("up")) P.cam.y -= sp; if (I.held("down")) P.cam.y += sp;
    if (I.pad.rx || I.pad.ry) { P.cam.x += I.pad.rx * sp; P.cam.y += I.pad.ry * sp; }
    if (I.hit("zoomin")) zoomAt(1.15, MAP.x + MAP.w / 2, MAP.y + MAP.h / 2);
    if (I.hit("zoomout")) zoomAt(1 / 1.15, MAP.x + MAP.w / 2, MAP.y + MAP.h / 2);
    const inMap = m.x < MAP.x + MAP.w && m.y > MAP.y;
    if (m.wheel && inMap) zoomAt(m.wheel < 0 ? 1.12 : 1 / 1.12, m.x, m.y);
    if (m.pinch && m.pinch !== 1) zoomAt(m.pinch, m.x, m.y);
    if (m.down && inMap && (m.dragX || m.dragY)) {
      m.dragDist = (m.dragDist || 0) + Math.abs(m.dragX) + Math.abs(m.dragY);
      if (m.dragDist > 8) { P.cam.x -= m.dragX / P.cam.z; P.cam.y -= m.dragY / P.cam.z; P.cam.tx = null; }
    }
    if (P.cam.tx != null) {
      P.cam.x = U.lerp(P.cam.x, P.cam.tx, Math.min(1, dt * 6)); P.cam.y = U.lerp(P.cam.y, P.cam.ty, Math.min(1, dt * 6));
      if (Math.abs(P.cam.x - P.cam.tx) < 1 && Math.abs(P.cam.y - P.cam.ty) < 1) P.cam.tx = null;
    }
    clampCam();
    P.hover = inMap ? D.pick(wx(m.x), wy(m.y)) : -1;
    // keys
    if (I.pressed.has("KeyP")) P.ov.plates = !P.ov.plates;
    if (I.pressed.has("KeyG")) P.ov.mob = !P.ov.mob;
    if (I.pressed.has("KeyV")) P.ov.sight = !P.ov.sight;
    if (I.pressed.has("KeyT")) P.ov.threat = !P.ov.threat;
    if (I.hit("menu")) { if (P.mode) P.mode = null; else P.menu = true; return; }
    if (S().over) {
      if (m.released) for (const b of P.buttons) if (hit(b)) b.on();
      return;
    }
    if (I.hit("next") && myTurn()) nextUnit();
    if (I.hit("endturn")) endTurn();
    if (m.rclicked || (I.hit("back") && !I.pressed.has("Escape"))) { if (P.mode) P.mode = null; else select(null); }
    if (m.released && !busy()) {
      let used = false;
      for (const b of P.buttons) if (hit(b) && !b.disabled) { b.on(); used = true; A.sfx("click"); break; }
      if (!used && inMap && (m.dragDist || 0) <= 8 && myTurn()) clickHex(P.hover);
      else if (!used && inMap && (m.dragDist || 0) <= 8) { const o = ownAt(P.hover)[0] || enemyAt(P.hover); select(o || null); }
    }
  };
  const hit = (b) => I.mouse.x >= b.x && I.mouse.x <= b.x + b.w && I.mouse.y >= b.y && I.mouse.y <= b.y + b.h;

  P.update = function (dt) {
    P.now += dt;
    while (P.sounds.length && P.sounds[0].t <= P.now) A.sfx(P.sounds.shift().n);
    P.sounds.sort((a, b) => a.t - b.t);
    if (P.aiOn && !P.menu) aiTick();
    P.fx = P.fx.filter((f) => P.now - f.t0 < (f.dur || 0.6) + 0.4);
    P.booms = P.booms.filter((b) => P.now - b.t0 < 1.2);
    P.floats = P.floats.filter((f) => P.now - f.t0 < 1.4);
    P.planes = P.planes.filter((p) => P.now - p.t0 < p.dur + 0.3);
  };

  /* ---------------- drawing ---------------- */
  function unitPos(u) {
    let i = u.idx;
    if (u.anim) {
      const a = u.anim, p = (P.now - a.t0) / a.dur;
      if (p < 0) i = a.path[0];
      else if (p < 1) {
        const f = p * (a.path.length - 1), k = Math.floor(f), r = f - k;
        const i0 = a.path[k], i1 = a.path[Math.min(a.path.length - 1, k + 1)];
        return { x: U.lerp(D.cx(i0), D.cx(i1), r), y: U.lerp(D.cy(i0), D.cy(i1), r), moving: true };
      } else u.anim = null;
    }
    return { x: D.cx(i), y: D.cy(i), moving: false };
  }
  function tintHex(c, i, col) { D.hexPath(c, D.cx(i), D.cy(i), D.R); c.fillStyle = col; c.fill(); }

  P.draw = function (c) {
    const s = S();
    c.fillStyle = "#1b2026"; c.fillRect(0, 0, W, H);
    c.save();
    c.beginPath(); c.rect(MAP.x, MAP.y, MAP.w, MAP.h); c.clip();
    c.translate(MAP.x, MAP.y); c.scale(P.cam.z, P.cam.z); c.translate(-P.cam.x, -P.cam.y);
    c.drawImage(D.mapCanvas, 0, 0, D.mapCanvas.width / D.mapScale, D.mapCanvas.height / D.mapScale);
    const u = selU(), me = player();
    const vis = s.vis[me];
    // overlays
    if (P.ov.mob && u && !u.type.isAir) for (let i = 0; i < G.N; i++) { const k = G.baseClass(u.type, i, u.side); tintHex(c, i, k === "go" ? "rgba(60,170,60,0.22)" : k === "slow" || k === "swim" ? "rgba(230,190,40,0.30)" : "rgba(210,50,40,0.32)"); }
    if (P.ov.threat) for (let i = 0; i < G.N; i++) { const t = G.threat(me, i, 1.4); if (t > 0) tintHex(c, i, `rgba(220,40,40,${Math.min(0.45, 0.14 + t * 0.15)})`); }
    for (let i = 0; i < G.N; i++) if (!vis[i]) tintHex(c, i, "rgba(40,46,56,0.30)");
    if (P.ov.sight && u && G.alive(u)) {
      const r = u.type.sight + (!G.isFlying(u) && G.elev(u.idx) >= 2 ? 1 : 0);
      for (const j of G.within(u.idx, r)) if (G.los(u.idx, j, G.eyeH(u), 0.6)) tintHex(c, j, "rgba(255,255,255,0.22)");
    }
    // reachable hexes and the path under the cursor
    if (P.reach && u && !P.mode) {
      // everything out of reach is darkened, the reachable area gets a bright rim
      const inR = (i) => P.reach.has(i);
      for (let i = 0; i < G.N; i++) if (!inR(i)) tintHex(c, i, "rgba(10,16,24,0.38)");
      for (const [i, n] of P.reach) if (i !== u.idx && !n.pass) { D.hexPath(c, D.cx(i), D.cy(i), D.R * 0.9); c.fillStyle = n.slow ? "rgba(255,226,120,0.30)" : "rgba(255,255,255,0.20)"; c.fill(); }
      c.lineWidth = 3.5; c.strokeStyle = u.type.isAir ? "#7fd4ff" : "#ffe36a"; c.lineCap = "round";
      for (const [i] of P.reach) {
        if (!inR(i)) continue;
        for (let k = 0; k < 6; k++) {
          const a0 = (Math.PI / 3) * k, a1 = (Math.PI / 3) * (k + 1), am = (a0 + a1) / 2;
          const j = D.pick(D.cx(i) + Math.cos(am) * D.R * 1.6, D.cy(i) + Math.sin(am) * D.R * 1.6);
          if (j >= 0 && inR(j)) continue;
          c.beginPath(); c.moveTo(D.cx(i) + D.R * Math.cos(a0), D.cy(i) + D.R * Math.sin(a0)); c.lineTo(D.cx(i) + D.R * Math.cos(a1), D.cy(i) + D.R * Math.sin(a1)); c.stroke();
        }
      }
      if (P.hover >= 0 && P.reach.has(P.hover) && !P.reach.get(P.hover).pass && P.hover !== u.idx) {
        const path = G.pathTo(P.reach, P.hover);
        c.lineWidth = 4; c.lineCap = "round";
        for (let k = 1; k < path.length; k++) {
          const t = u.type.isAir ? G.threat(me, path[k], G.airH(u)) : 0;
          c.strokeStyle = t > 0.6 ? "#e74c3c" : t > 0 ? "#f39c12" : "#ffffff";
          c.beginPath(); c.moveTo(D.cx(path[k - 1]), D.cy(path[k - 1])); c.lineTo(D.cx(path[k]), D.cy(path[k])); c.stroke();
        }
      }
    }
    if (P.mode && P.mode.hexes) for (const i of P.mode.hexes) { D.hexPath(c, D.cx(i), D.cy(i), D.R * 0.9); c.fillStyle = P.mode.kind === "drop" ? "rgba(120,200,255,0.18)" : P.mode.kind === "strike" ? "rgba(255,80,60,0.35)" : "rgba(255,211,106,0.32)"; c.fill(); }
    // bridges, mines, objectives
    for (let i = 0; i < G.N; i++) {
      const h = s.hex[i];
      if (h.bridge) D.bridge(c, i, h.bridge);
      else if (h.bridge0 && D.mapPhoto) D.blown(c, i);
      if (h.mine && (h.mine.side === me || h.mine.known[me])) D.mine(c, i, h.mine, h.mine.side === me);
      if (h.obj) D.objective(c, i, h);
    }
    // units: ground first, then air, then those moving
    const shown = s.units.filter((o) => (G.alive(o) || (o.deadT && P.now < o.deadT)) && o.idx >= 0 && !o.reserve && !(o.cargoOf && !(o.anim && P.now < o.anim.t0 + o.anim.dur)) && (o.side === me || s.spot[me].has(o.id) || (o.deadT && P.now < o.deadT) || (o.anim && P.now < o.anim.t0 + o.anim.dur)));
    const groundAt = new Set(shown.filter((o) => !o.type.isAir).map((o) => o.idx));
    const dimmed = (o) => o.side === me && myTurn() && !G.canMove(o) && (o.attacked || o.noAttack || !G.targets(o).length) && !G.actions(o).some((a) => !a.disabled);
    for (const pass of [0, 1]) for (const o of shown) {
      if ((pass === 1) !== !!o.type.isAir) continue;
      const p = unitPos(o);
      let x = p.x, y = p.y, sc = 1;
      if (o.type.isAir && groundAt.has(o.idx) && !p.moving) { x += D.R * 0.32; y -= D.R * 0.42; sc = 0.78; }
      else if (o.type.isAir) y -= D.R * 0.12;
      D.unit(c, o, x, y, sc, { plates: P.ov.plates, own: o.side === me, dim: dimmed(o), time: P.now });
      if (o.id === P.sel) { if (o.type.isAir && sc < 1) { c.beginPath(); c.arc(x, y, D.R * 0.55, 0, U.TAU); } else D.hexPath(c, D.cx(o.idx), D.cy(o.idx), D.R * 0.97); c.lineWidth = 3; c.strokeStyle = "#ffd36a"; c.stroke(); }
    }
    // targets of the selected unit
    if (u && u.side === me && myTurn() && !P.mode) for (const t of G.targets(u)) {
      const x = D.cx(t.idx), y = D.cy(t.idx) - (G.isFlying(t) ? 14 : 0);
      c.strokeStyle = "#ff4b3a"; c.lineWidth = 2.5; c.beginPath(); c.arc(x, y, D.R * 0.5, 0, U.TAU); c.stroke();
      for (let k = 0; k < 4; k++) { const a = (Math.PI / 2) * k; c.beginPath(); c.moveTo(x + Math.cos(a) * D.R * 0.35, y + Math.sin(a) * D.R * 0.35); c.lineTo(x + Math.cos(a) * D.R * 0.62, y + Math.sin(a) * D.R * 0.62); c.stroke(); }
    }
    // effects
    for (const f of P.fx) D.fx(c, f, P.now);
    for (const b of P.booms) D.boom(c, b, P.now);
    for (const p of P.planes) drawAircraft(c, p);
    for (const f of P.floats) {
      const age = P.now - f.t0; if (age < 0) continue;
      const x = D.cx(f.i), y = D.cy(f.i) - (f.air ? 20 : 8) - age * 26;
      if (f.chute) { c.strokeStyle = "#fff"; c.lineWidth = 2; c.beginPath(); c.arc(x, y - 6, 12, Math.PI, 0); c.stroke(); c.beginPath(); c.moveTo(x - 12, y - 6); c.lineTo(x, y + 8); c.lineTo(x + 12, y - 6); c.stroke(); continue; }
      c.font = `700 22px ${D.FONT}`; c.textAlign = "center"; c.lineWidth = 4; c.strokeStyle = "rgba(0,0,0,0.6)"; c.strokeText(f.txt, x, y); c.fillStyle = f.col; c.fillText(f.txt, x, y);
    }
    if (P.hover >= 0) { D.hexPath(c, D.cx(P.hover), D.cy(P.hover), D.R); c.lineWidth = 2; c.strokeStyle = "rgba(255,255,255,0.8)"; c.stroke(); }
    c.restore();
    drawTop(c); drawPanel(c); drawMenuButton(c); drawCoach(c); drawTooltip(c);
    if (s.over) drawResult(c);
    if (P.menu) drawMenu(c);
    if (P.aiOn && !s.over) { c.fillStyle = "rgba(20,26,32,0.85)"; c.fillRect(MAP.x + MAP.w / 2 - 150, MAP.y + 10, 300, 30); D.text(c, MG.NATIONS[s.side].name + " is moving …", MAP.x + MAP.w / 2, MAP.y + 26, 18, "#ffb0a0", "center", 700); }
  };

  // transport aircraft (paradrop) and attack drones flying along their path
  const TRANSPORT = { DE: "a400m", RU: "il76", US: "c17", CN: "y20" };
  function pathPos(p, q) {
    const n = p.path.length - 1, k = U.clamp(q, 0, 1) * n, i0 = Math.floor(k), a = p.path[i0], b = p.path[Math.min(n, i0 + 1)], r = k - i0;
    // the heading looks a little ahead, so turns are smooth
    const ka = Math.min(n, i0 + 2), kb = Math.max(0, i0 - 1);
    return { x: U.lerp(D.cx(a), D.cx(b), r), y: U.lerp(D.cy(a), D.cy(b), r), ang: Math.atan2(D.cy(p.path[ka]) - D.cy(p.path[kb]), D.cx(p.path[ka]) - D.cx(p.path[kb])) || 0 };
  }
  function drawAircraft(c, p) {
    const age = P.now - p.t0; if (age < 0) return;
    const q = age / p.dur, uav = p.kind === "uav";
    const im = D.sprite(uav ? "lrauv" : TRANSPORT[p.side] || "a400m");
    const size = uav ? D.R * 0.95 : D.R * 3.2, alt = uav ? 16 : 46;
    const fade = U.clamp((1 - q) * 8, 0, 1) * U.clamp(q * 12, 0, 1);
    const flock = uav ? Math.min(4, p.n || 3) : 1;
    for (let f = 0; f < flock; f++) {
      const lag = f * 0.035, pos = pathPos(p, q - lag);
      const off = uav ? [[0, 0], [-10, -14], [-10, 14], [-20, 0]][f] : [0, 0];
      c.save(); c.globalAlpha = uav ? 1 : fade;
      c.translate(pos.x, pos.y); c.rotate(pos.ang);
      // shadow on the ground, then the aircraft above it
      if (im) {
        c.save(); c.translate(off[0] + alt * 0.35, off[1] + alt * 0.8); c.globalAlpha *= 0.28; c.filter = "brightness(0)"; c.drawImage(im, -size / 2, -size / 2, size, size); c.restore();
        c.translate(off[0], off[1] - alt * 0.2); c.drawImage(im, -size / 2, -size / 2, size, size);
      } else {
        c.fillStyle = "#8d9488"; c.fillRect(-size / 2, -3, size, 6); c.fillRect(-4, -size / 2, 9, size);
      }
      c.restore();
    }
  }
  // a menu button in the top bar (Esc does the same)
  function drawMenuButton(c) {
    if (P.menu) return;
    const b = { x: W - PW + 8, y: 6, w: 104, h: 28, size: 15, label: "☰ Menu (Esc)", on: () => { P.menu = true; } };
    P.buttons.unshift(b);
    D.button(c, b, hit(b));
  }
  function drawTop(c) {
    const s = S();
    c.fillStyle = "#11161b"; c.fillRect(0, 0, W, TOP);
    c.fillStyle = "#2c3640"; c.fillRect(0, TOP - 1, W, 1);
    D.text(c, "AVIATION GENERAL", 14, 21, 17, "#ffd36a", "left", 700, D.LOGO);
    D.text(c, "Turn " + s.turn + " / " + s.maxTurn, 250, 21, 19, D.C.text, "left", 700);
    let x = 375;
    const objs = G.objectives();
    c.font = `600 16px ${D.FONT}`;
    const full = objs.reduce((a, i) => a + 30 + c.measureText(s.hex[i].obj.name).width, 0) < W - PW - 385;
    for (const i of objs) {
      const h = s.hex[i], name = full ? h.obj.name : h.obj.name.slice(0, 3) + ".";
      c.fillStyle = D.side(h.obj.owner); c.fillRect(x, 13, 14, 14); c.strokeStyle = "#fff"; c.strokeRect(x + 0.5, 13.5, 13, 13);
      D.text(c, name, x + 20, 21, 16, D.C.text, "left", 600);
      c.font = `600 16px ${D.FONT}`; x += 30 + c.measureText(name).width;
    }
    D.text(c, "Prestige " + s.sides[player()].prestige, W - 14, 21, 17, "#ffd36a", "right", 700);
  }

  function statLine(c, label, val, x, y, col) { D.text(c, label, x, y, 15, D.C.dim); D.text(c, val, x + 112, y, 15, col || D.C.text, "left", 700); }

  function drawPanel(c) {
    const s = S(), x0 = W - PW, me = player();
    c.fillStyle = D.C.panel; c.fillRect(x0, TOP, PW, H - TOP);
    c.fillStyle = "#2c3640"; c.fillRect(x0, TOP, 1, H - TOP);
    P.buttons = [];
    const btn = (b) => { P.buttons.push(b); D.button(c, b, hit(b) && !b.disabled); };
    const px = x0 + 12, pw = PW - 24;
    let y = TOP + 12;
    const u = selU();
    if (u && (G.alive(u))) {
      const T = u.type, col = D.side(u.side);
      c.fillStyle = D.rgba(col, 0.25); c.fillRect(px, y, pw, 54);
      D.text(c, T.name, px + 8, y + 17, 21, D.C.text, "left", 700);
      D.text(c, T.cls, px + 8, y + 40, 14, D.C.dim, "left", 600);
      y += 62;
      for (let k = 0; k < 10; k++) { c.fillStyle = k < u.str ? col : "#38424c"; c.fillRect(px + k * (pw / 10) + 1, y, pw / 10 - 3, 9); }
      y += 22;
      const own = u.side === me;
      if (T.isAir) statLine(c, "Move left", G.mpLeft(u) + " / " + T.move, px, y);
      else statLine(c, "Move", (G.canMove(u) ? T.move : 0) + " / " + T.move + " · " + { track: "tracked", wheel: "wheeled", foot: "on foot" }[T.mob] + (T.amph ? ", amphibious" : ""), px, y);
      y += 19;
      if (T.fuel) { statLine(c, "Fuel", u.fuel + " / " + T.fuel, px, y, u.fuel <= T.move ? "#ff9a5a" : null); y += 19; }
      if (T.ammo) { statLine(c, T.aaRange && !T.range ? "Missiles" : "Ammunition", Math.floor(u.ammo) + " / " + T.ammo, px, y, u.ammo <= 0 ? "#ff6a5a" : null); y += 19; }
      if (T.aam) { statLine(c, "Stinger", u.aam + " / " + T.aam, px, y, u.aam <= 0 ? "#ff6a5a" : null); y += 19; }
      if (T.mines) { statLine(c, "Mines", u.mines + " / " + T.mines, px, y); y += 19; }
      statLine(c, "Sight", T.sight + (T.airSight > T.sight ? " (radar " + T.airSight + ")" : ""), px, y); y += 19;
      const atk = [T.soft && "soft " + T.soft, T.hard && "hard " + T.hard, T.air && "air " + T.air].filter(Boolean).join(" · ") || "–";
      statLine(c, "Attack", atk, px, y); y += 19;
      const rng = [T.range && "direct " + T.range, T.ind && "indirect " + T.ind, T.aaRange && "air " + T.aaRange, T.drone && "drone " + T.drone, T.mineRemote && "mines " + T.mineRemote].filter(Boolean).join(" · ") || "–";
      statLine(c, "Range", rng, px, y); y += 19;
      statLine(c, "Defence", String(T.isAir ? T.airDef : T.def) + (u.entrench ? "  +" + u.entrench + " dug in" : ""), px, y); y += 19;
      const notes = [];
      if (G.stars(u)) notes.push("★".repeat(G.stars(u)) + " veteran");
      if (T.aps) notes.push("active protection");
      if (T.nlos) notes.push("fires beyond line of sight");
      if (u.landed) notes.push(u.grounded ? "out of fuel – on the ground" : "landed at FARP");
      if (u.cargo) notes.push("carrying " + G.byId(u.cargo).type.name);
      if (T.bridge) notes.push(u.carry ? "bridge on board" : "bridge laid");
      if (own && u.noAttack && !u.attacked) notes.push("slow going – cannot fire this turn");
      if (u.dug && !T.isAir) notes.push("dug in – moving gives it up");
      if (own && T.isAir && !T.cap && u.attacked) notes.push("has fired this turn – no more shots, may still fly on");
      if (notes.length) { D.para(c, notes.join(" · "), px, y - 6, 14, pw, "#c7d3df"); y += 20 * Math.ceil(notes.join(" · ").length / 40); }
      y += 6;
      if (own && myTurn()) {
        for (const a of G.actions(u)) {
          btn({ x: px, y, w: pw, h: 30, label: a.label, disabled: !!a.disabled, on: () => {
            if (a.hexes && a.id !== "disembark") { P.mode = { kind: "act", id: a.id, unit: u.id, hexes: a.hexes, units: a.units }; }
            else doIt(() => G.doAction(u, a.id));
          } });
          y += 34;
        }
        if (P.mode) { D.text(c, "Pick a highlighted hex (right-click cancels).", px, y + 8, 14, "#ffd36a"); y += 24; }
      }
    } else {
      D.text(c, "No unit selected", px, y + 12, 18, D.C.dim, "left", 700);
      y += 34;
      D.para(c, "Click a unit to select it. Click a lit hex to move, a red ring to attack. Drag or use the arrow keys to scroll, the wheel to zoom.", px, y, 14, pw, "#b5c1cd");
      y += 86;
    }
    // specials: paratroopers waiting for a jump, long range attack drones
    const res = s.units.filter((r) => r.side === me && r.reserve && r.alive);
    if (res.length && myTurn()) {
      y = Math.max(y, 400 - (res.length - 1) * 34);
      D.text(c, "SPECIALS", px, y + 8, 14, "#9fc6e8", "left", 700); y += 20;
      for (const r of res) {
        if (r.type.strike) {
          const ok = G.canStrike(r), tg = ok ? G.strikeTargets(r) : [];
          btn({ x: px, y, w: pw, h: 30, size: 15, label: "Strike: " + r.type.name + " (" + r.str + ")", col: "#4a2a2a", disabled: !ok || !tg.length, on: () => { select(null); P.mode = { kind: "strike", unit: r.id, hexes: tg }; } });
          if (!ok) D.text(c, "used this turn – ready again next turn", px + pw / 2, y + 40, 12, D.C.dim, "center", 600);
          else if (!tg.length) D.text(c, "no reconnoitred target", px + pw / 2, y + 40, 12, D.C.dim, "center", 600);
          y += (!ok || !tg.length) ? 50 : 34;
        } else {
          btn({ x: px, y, w: pw, h: 30, size: 15, label: "Jump: " + r.type.name + " (" + r.str + ")", col: "#25405a", on: () => { select(null); P.mode = { kind: "drop", unit: r.id, hexes: G.dropTargets(r) }; } });
          y += 34;
        }
      }
    }
    // overlays, next unit, end turn
    const by = H - 214;
    const tg = (key, label, k) => ({ x: px + k * ((pw + 4) / 4), y: by, w: (pw + 4) / 4 - 4, h: 26, size: 14, label, col: P.ov[key] ? "#3d5a3a" : D.C.btn, on: () => { P.ov[key] = !P.ov[key]; } });
    btn(tg("plates", "Plates P", 0)); btn(tg("mob", "Go G", 1)); btn(tg("sight", "Sight V", 2)); btn(tg("threat", "AD T", 3));
    btn({ x: px, y: by + 32, w: pw / 2 - 3, h: 32, label: "Next unit (N)", disabled: !myTurn(), on: nextUnit });
    btn({ x: px + pw / 2 + 3, y: by + 32, w: pw / 2 - 3, h: 32, label: "End turn (E)", col: "#4a3a22", disabled: !myTurn() || busy(), on: endTurn });
    // log
    const L = s.log.filter((l) => !l.hidden).slice(-7);
    let ly = H - 136;
    c.fillStyle = "rgba(0,0,0,0.25)"; c.fillRect(px - 4, ly - 6, pw + 8, 136);
    for (const l of L) { const lines = D.wrap(c, l.s, 13, pw - 4); for (const t of lines.slice(0, 2)) { if (ly > H - 10) break; D.text(c, t, px, ly + 6, 13, l.col); ly += 16; } }
  }

  function drawTooltip(c) {
    const s = S(), u = selU(), i = P.hover, me = player();
    if (i < 0 || P.menu) return;
    const lines = [];
    const h = s.hex[i];
    lines.push([G.terName(i) + (h.e ? " · height " + h.e : "") + (h.obj ? " · ★ " + h.obj.name : ""), "#ffffff"]);
    if (u && u.side === me && !u.type.isAir) { const k = G.baseClass(u.type, i, me); lines.push([{ go: "GO", slow: "SLOW GO", swim: "SLOW GO (swimming, whole move)", nogo: "NO GO" }[k] + " for " + u.type.name, k === "go" ? "#9fe08a" : k === "nogo" ? "#ff7a6a" : "#ffd36a"]); }
    const e = enemyAt(i, u && u.side === me ? u : null);
    if (e) {
      lines.push([MG.NATIONS[e.side].name + " " + e.type.name + " (" + e.str + ")", "#ffb0a0"]);
      if (u && u.side === me && G.canAttack(u, e)) {
        const p = G.predict(u, e);
        lines.push(["Expected: enemy −" + p.kill.toFixed(1) + ", own −" + p.loss.toFixed(1) + (p.mode === "ind" ? " (indirect)" : ""), "#ffd36a"]);
        if (G.isFlying(u)) { const t = G.threat(me, u.idx, G.airH(u)); if (t > 0) lines.push(["Known air defence covers this position!", "#ff7a6a"]); }
      } else if (u && u.side === me && myTurn() && (u.type.range || u.type.ind || u.type.air || u.type.drone)) {
        lines.push([u.type.name + " cannot fire: " + G.whyNot(u, e), "#ff9a7a"]);
      }
    }
    for (const o of ownAt(i)) if (o.id !== P.sel) lines.push([o.type.name + " (" + o.str + ")", "#cfe3ff"]);
    if (u && u.type.isAir && P.reach && P.reach.has(i) && i !== u.idx) {
      const n = P.reach.get(i);
      const f = G.farpNear({ ...u, idx: i });
      lines.push(["Fuel after flight: " + (u.fuel - n.cost) + (f ? " · FARP here" : ""), u.fuel - n.cost <= 3 ? "#ff7a6a" : "#cfe3ff"]);
    }
    if (h.mine && (h.mine.side === me || h.mine.known[me])) lines.push([(h.mine.side === me ? "Own" : "Enemy") + (h.mine.remote ? " scattered" : "") + " minefield" + (h.mine.lane ? " (lane)" : ""), "#ffd36a"]);
    // a compact box: small type, as wide as the longest line
    const fs = 12, lh = 15;
    c.font = `600 ${fs}px ${D.FONT}`;
    const tw = Math.ceil(Math.max(...lines.map(([t]) => c.measureText(t).width))) + 12;
    const x = Math.min(I.mouse.x + 16, W - PW - tw - 4), y = Math.min(I.mouse.y + 16, H - 8 - lines.length * lh - 6);
    c.fillStyle = "rgba(15,20,25,0.82)"; c.fillRect(x, y, tw, lines.length * lh + 6);
    lines.forEach(([t, col], k) => D.text(c, t, x + 6, y + 3 + lh / 2 + k * lh, fs, col, "left", 600));
  }

  // the tutorial: a coach that waits for the player to try each thing
  const COACH = [
    { t: "Welcome to the tutorial", s: "This battle teaches the basics. Each tip waits until you have tried it – or press Next. Win the battle to unlock the four campaigns." },
    { t: "Select a unit", s: "Click one of your tanks or infantry (blue plates). The panel on the right shows what it can do.", done: () => { const u = selU(); return u && u.side === player() && !u.type.isAir; } },
    { t: "Move", s: "The lit area shows how far the unit can go this turn. Click a hex inside it to move there.", done: () => G.unitsOf(player()).some((u) => !u.type.isAir && u.mpUsed > 0) },
    { t: "Go · Slow Go · No Go", s: "Press G (or the Go button) to colour the map for the selected unit: green Go, yellow Slow Go, red No Go. Tanks cannot enter forests except on roads.", done: () => P.ov.mob },
    { t: "Fly a helicopter", s: "Select a Tiger or an LKH and fly it. Helicopters cross rivers and forests, but every hex costs fuel. Stay behind hills and woods.", done: () => G.unitsOf(player()).some((u) => u.type.heli && !u.type.cap && u.mpUsed > 0) },
    { t: "Enemy air defence", s: "Press T (or AD) to see the reach of the enemy air defence you know about. Never end a flight inside it.", done: () => P.ov.threat },
    { t: "Attack", s: "Red rings mark targets in range. Click one to fire; the tooltip shows the expected result first. The LKH's Spike ER2 hits anything a friendly unit spots.", done: () => G.unitsOf(player()).some((u) => u.attacked) },
    { t: "End the turn", s: "When everybody has moved, press E or End turn. The enemy moves, then it is your turn again.", done: () => S().turn >= 2 },
    { t: "FARP", s: "Low on fuel or missiles? Fly next to a FARP and choose Rearm: the helicopter lands until your next turn and comes back full.", done: () => G.unitsOf(player()).some((u) => u.type.heli && u.landed) },
    { t: "Air assault", s: "Select an NH90 next to infantry and choose Embark. Fly them over the river and choose Disembark on open ground.", done: () => S().units.some((u) => u.side === player() && u.cargo) },
    { t: "Paratroopers", s: "The Fallschirmjäger wait under SPECIALS in the panel. Choose Jump and pick a drop zone – away from enemy air defence.", done: () => !S().units.some((u) => u.side === player() && u.type.para && u.reserve && u.alive) },
    { t: "Long range attack UAV", s: "Under SPECIALS choose Strike and click any enemy you have reconnoitred (red hexes). The drones fly around known air defence where they can; air defence on the way shoots some down. Once per turn.", done: () => S().units.some((u) => u.side === player() && u.type.strike && (u.strikeTurn || !u.alive)) },
    { t: "Take the objectives", s: "Capture all flags before time runs out. Scout ahead and keep the helicopters fed. Esc opens the menu with How to play. Good luck!" },
  ];
  function drawCoach(c) {
    const k = P.coach;
    if (!k || S().over) return;
    const st = COACH[k.step];
    if (!st) { P.coach = null; return; }
    if (st.done && st.done()) { k.step++; A.sfx("click"); return; }
    const w = 430, x = MAP.x + 12, y = H - 150;
    c.fillStyle = "rgba(16,24,32,0.92)"; c.fillRect(x, y, w, 138);
    c.strokeStyle = "#ffd36a"; c.lineWidth = 1.5; c.strokeRect(x + 0.5, y + 0.5, w - 1, 137);
    D.text(c, "TUTORIAL " + (k.step + 1) + "/" + COACH.length + " · " + st.t.toUpperCase(), x + 12, y + 16, 15, "#ffd36a", "left", 700);
    D.para(c, st.s, x + 12, y + 30, 15, w - 24, "#e8edf2", 1.25);
    const last = k.step === COACH.length - 1;
    const bN = { x: x + w - 112, y: y + 104, w: 100, h: 26, size: 14, label: last ? "Close" : "Next", on: () => { k.step++; } };
    const bO = { x: x + w - 262, y: y + 104, w: 140, h: 26, size: 14, label: "Hide tutorial", col: "#3a2a2a", on: () => { P.coach = null; } };
    const area = { x, y, w, h: 138, on: () => {} };
    P.buttons.unshift(bN, bO, area);
    D.button(c, bN, hit(bN)); D.button(c, bO, hit(bO));
  }

  function report() {
    if (P.reported) return;
    P.reported = true;
    const s = S(), win = s.over.winner === player();
    const before = MG.Campaign.progress();
    MG.Campaign.finished(s.scen, win, s.sides[player()].prestige);
    P.unlocked = !!(s.scen.tutorial && win && !before.tut);
    MG.Store.set("save", null);
  }
  function drawResult(c) {
    report();
    const s = S(), win = s.over.winner === player();
    c.fillStyle = "rgba(10,14,18,0.7)"; c.fillRect(MAP.x, MAP.y, MAP.w, MAP.h);
    const bx = MAP.x + MAP.w / 2 - 240, by = MAP.y + MAP.h / 2 - 120;
    c.fillStyle = D.C.panel; c.fillRect(bx, by, 480, 240); c.strokeStyle = win ? "#9fe08a" : "#ff6a5a"; c.lineWidth = 2; c.strokeRect(bx, by, 480, 240);
    D.text(c, win ? "VICTORY" : "DEFEAT", bx + 240, by + 50, 40, win ? "#9fe08a" : "#ff6a5a", "center", 900, D.LOGO);
    D.text(c, s.over.why, bx + 240, by + 100, 19, D.C.text, "center", 700);
    D.text(c, "Turn " + Math.min(s.turn, s.maxTurn) + " · prestige " + s.sides[player()].prestige, bx + 240, by + 130, 16, D.C.dim, "center");
    const sc = s.scen, camp = sc.camp;
    if (sc.tutorial) D.text(c, win ? (P.unlocked ? "The campaigns are now unlocked!" : "Campaigns unlocked – choose your army.") : "Win the tutorial battle to unlock the campaigns.", bx + 240, by + 152, 16, "#ffd36a", "center", 700);
    else if (camp) D.text(c, MG.NATIONS[camp.army].name + " campaign · battle " + (camp.index + 1) + " of 8" + (win && camp.index === 7 ? " · CAMPAIGN WON!" : ""), bx + 240, by + 152, 16, "#ffd36a", "center", 700);
    const again = () => MG.Main.setState("briefing", { scen: camp ? MG.Campaign.scenario(camp.army, camp.index) : sc });
    let b1, b2;
    if (camp && win && camp.index < 7) b1 = { x: bx + 40, y: by + 180, w: 180, h: 40, label: "Next battle", on: () => MG.Main.setState("briefing", { scen: MG.Campaign.scenario(camp.army, camp.index + 1) }) };
    else if (sc.tutorial && win) b1 = { x: bx + 40, y: by + 180, w: 180, h: 40, label: "Campaigns", on: () => MG.Main.setState("armies") };
    else b1 = { x: bx + 40, y: by + 180, w: 180, h: 40, label: win ? "Play again" : "Try again", on: again };
    if (camp) b2 = { x: bx + 260, y: by + 180, w: 180, h: 40, label: "Campaign", on: () => MG.Main.setState("campaign", { army: camp.army }) };
    else b2 = { x: bx + 260, y: by + 180, w: 180, h: 40, label: "Title screen", on: () => MG.Main.setState("title") };
    P.buttons.push(b1, b2);
    D.button(c, b1, hit(b1)); D.button(c, b2, hit(b2));
  }

  /* ---------------- pause menu ---------------- */
  // the battle is saved at the start of each of your turns, so leaving it can be continued from the title screen
  function menuItems() {
    const sc = S().scen, M = [
      { label: "Resume", on: () => { P.menu = false; } },
      { label: "How to play", on: () => { P.menu = false; MG.Main.setState("help", { back: "play" }); } },
      { label: "Restart battle", on: () => { MG.Store.set("save", null); P.menu = false; MG.Main.setState("play", { scen: sc.camp ? MG.Campaign.scenario(sc.camp.army, sc.camp.index) : sc }); } },
    ];
    if (sc.camp) M.push({ label: "Campaign", on: () => { P.menu = false; MG.Main.setState("campaign", { army: sc.camp.army }); } });
    M.push({ label: "Main menu", on: () => { P.menu = false; MG.Main.setState("title"); } });
    return M;
  }
  function menuBoxes() { const M = menuItems(); return M.map((m, k) => ({ ...m, x: W / 2 - 150, y: H / 2 - 26 * M.length + 20 + k * 52, w: 300, h: 42 })); }
  function menuInput() {
    if (I.hit("menu") || I.mouse.rclicked) { P.menu = false; return; }
    if (I.mouse.released) for (const b of menuBoxes()) if (hit(b)) { A.sfx("click"); b.on(); return; }
  }
  function drawMenu(c) {
    c.fillStyle = "rgba(8,10,14,0.7)"; c.fillRect(0, 0, W, H);
    D.text(c, "PAUSED", W / 2, H / 2 - 26 * menuItems().length - 20, 30, "#ffd36a", "center", 900, D.LOGO);
    D.text(c, "The battle is saved at the start of each of your turns.", W / 2, H / 2 + 26 * menuItems().length + 30, 15, "#c7d3df", "center", 600);
    for (const b of menuBoxes()) D.button(c, b, hit(b));
  }
})(window.MG);
