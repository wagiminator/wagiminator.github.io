/* Starlane Command: the tactical map – drawing the sector, the command panel, and orders
   with mouse, touch, keyboard and gamepad */
"use strict";

(function (SL) {
  const { U, D, G } = SL;
  const A = SL.Audio, I = SL.Input, R = SL.RULES;
  const W = U.W, H = U.H, C = D.C;
  const MAPW = 952, PX = 960, PW = 312;
  const SPEEDS = [1, 2, 4];
  const inR = (m, b) => m.x >= b.x && m.x <= b.x + b.w && m.y >= b.y && m.y <= b.y + b.h;
  const RAD = { ind: 22, res: 18, rep: 18, out: 15, ruin: 14 };
  SL.RAD = RAD;

  /* ================= drawing the sector ================= */
  const V = (SL.View = {});
  // where stationary fleets sit around their system
  function slots(sys, list) {
    // an arc above the system, centred, with a second ring when it gets crowded
    const out = [], n = list.length;
    const per = 6;
    list.forEach((f, k) => {
      const ring = Math.floor(k / per), idx = k % per, cnt = Math.min(per, n - ring * per);
      const r = RAD[sys.type] + 21 + ring * 30, step = 34 / r;
      const a = -Math.PI / 2 + (idx - (cnt - 1) / 2) * step;
      out.push({ f, a, x: sys.x + Math.cos(a) * r, y: sys.y + Math.sin(a) * r });
    });
    return out;
  }
  V.fleetSlots = function (s, sysId) {
    const sys = s.sys[sysId];
    const list = s.fleets.filter((f) => f.at === sysId).sort((a, b) => (a.o === 0 ? -1 : 0) - (b.o === 0 ? -1 : 0) || a.o - b.o || "BSI".indexOf(a.t) - "BSI".indexOf(b.t));
    return slots(sys, list);
  };
  V.lanePos = (s, from, to, d, len) => {
    const a = s.sys[from], b = s.sys[to], t = U.clamp(d / len, 0, 1);
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  };

  V.drawWorld = function (c, s, opt = {}) {
    const t = opt.time || 0;
    // lanes
    c.lineCap = "round";
    for (const l of s.lanes) {
      const a = s.sys[l.a], b = s.sys[l.b];
      const same = a.owner >= 0 && a.owner === b.owner;
      c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y);
      c.lineWidth = same ? 2.5 : 1.6;
      c.strokeStyle = same ? D.rgba(D.col(a.owner), 0.35) : C.lane;
      c.stroke();
    }
    // highlighted path (planned order)
    if (opt.path && opt.path.length > 1) {
      c.save();
      c.setLineDash([8, 6]); c.lineDashOffset = -t * 30;
      c.lineWidth = 3; c.strokeStyle = D.rgba(D.OWNER[0], 0.9);
      c.beginPath(); c.moveTo(s.sys[opt.path[0]].x, s.sys[opt.path[0]].y);
      for (let i = 1; i < opt.path.length; i++) c.lineTo(s.sys[opt.path[i]].x, s.sys[opt.path[i]].y);
      c.stroke(); c.restore();
    }
    // routes of own moving fleets
    c.save(); c.setLineDash([3, 7]); c.lineWidth = 1.5;
    for (const f of s.fleets) {
      if (f.at !== null || f.o !== 0) continue;
      const p = V.lanePos(s, f.from, f.to, f.d, f.len);
      c.strokeStyle = D.rgba(D.OWNER[0], 0.45);
      c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(s.sys[f.to].x, s.sys[f.to].y);
      for (const n of f.path) c.lineTo(s.sys[n].x, s.sys[n].y);
      c.stroke();
    }
    c.restore();
    // convoys
    for (const cv of s.convoys) {
      const p = V.lanePos(s, cv.from, cv.to, cv.d, cv.len);
      const col = D.col(cv.o);
      c.save(); c.translate(p.x, p.y); c.rotate(Math.PI / 4);
      c.fillStyle = col; c.fillRect(-3.5, -3.5, 7, 7);
      c.restore();
    }
    // systems
    for (const sys of s.sys) drawSystem(c, s, sys, t, opt);
    // stationary fleets
    for (const sys of s.sys) {
      const sl = V.fleetSlots(s, sys.id);
      for (const { f, a, x, y } of sl) {
        const col = D.col(f.o), sel = opt.selTypes && opt.sel === sys.id && f.o === 0 && opt.selTypes[f.t];
        D.fleet(c, x, y, 9, -Math.PI / 2, f.t, col, { sel });
        const dmg = f.hp < f.n * R.UNIT_HP - 0.5;
        D.text(c, String(f.n), x + Math.cos(a) * 17, y + Math.sin(a) * 17, 14, dmg ? "#ffb4b4" : col, "center", { weight: 700 });
      }
    }
    // fleets in flight
    for (const f of s.fleets) {
      if (f.at !== null) continue;
      const p = V.lanePos(s, f.from, f.to, f.d, f.len);
      const col = D.col(f.o), k = ("BSI".indexOf(f.t) - 1) * 10;
      const x = p.x - Math.sin(f.ang) * k, y = p.y + Math.cos(f.ang) * k;
      D.fleet(c, x, y, 9, f.ang, f.t, col);
      D.text(c, String(f.n), x + 10, y - 10, 14, col, "left", { weight: 700 });
    }
    // combat: laser lines between the parties
    for (const sys of s.sys) {
      if (sys.fight <= 0) continue;
      const sl = V.fleetSlots(s, sys.id);
      if (Math.random() < 0.6) {
        for (let k = 0; k < 2; k++) {
          const a = U.pick(sl);
          if (!a) break;
          const foes = sl.filter((b) => b.f.o !== a.f.o);
          let tx, ty;
          if (foes.length) { const b = U.pick(foes); tx = b.x; ty = b.y; }
          else { tx = sys.x + U.rand(-8, 8); ty = sys.y + U.rand(-8, 8); }
          c.globalAlpha = 0.85;
          D.line(c, a.x, a.y, tx, ty, D.col(a.f.o), 1.5);
          c.globalAlpha = 1;
          D.circle(c, tx, ty, 2.5, "#fff", null);
        }
        if (sys.station && sl.length) {
          const st = stationPos(sys, t), b = U.pick(sl.filter((q) => q.f.o !== sys.owner) || []);
          if (b) D.line(c, st.x, st.y, b.x, b.y, D.col(sys.owner), 1.5);
        }
      }
    }
    // effects
    for (const fx of s.fx) {
      const k = fx.t / fx.life;
      if (fx.kind === "boom") {
        D.circle(c, fx.x, fx.y, 4 + k * 14, D.rgba("#ffffff", 0.0), D.rgba(fx.col, 1 - k), 2);
        D.circle(c, fx.x, fx.y, 3 * (1 - k), "#fff", null);
      } else if (fx.kind === "bigboom") {
        D.circle(c, fx.x, fx.y, 10 + k * 50, null, D.rgba(fx.col, 1 - k), 3);
        D.circle(c, fx.x, fx.y, 6 + k * 26, D.rgba("#ffe0a0", (1 - k) * 0.5), null);
      } else if (fx.kind === "ring") {
        D.circle(c, fx.x, fx.y, 24 + k * 60, null, D.rgba(fx.col, 1 - k), 3);
      }
    }
  };
  function stationPos(sys, t) {
    const a = t * 0.9 + sys.id, r = RAD[sys.type] + 9;
    return { x: sys.x + Math.cos(a) * r, y: sys.y + Math.sin(a) * r };
  }
  function drawSystem(c, s, sys, t, opt) {
    const r = RAD[sys.type], col = D.col(sys.owner);
    const x = sys.x, y = sys.y;
    // glow
    if (sys.owner >= 0) {
      const g = c.createRadialGradient(x, y, r * 0.4, x, y, r * 2.4);
      g.addColorStop(0, D.rgba(col, 0.22)); g.addColorStop(1, D.rgba(col, 0));
      c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 2.4, 0, U.TAU); c.fill();
    }
    // combat ring
    if (sys.fight > 0) {
      const p = 0.5 + 0.5 * Math.sin(t * 12);
      D.circle(c, x, y, r + 13 + p * 3, null, D.rgba(C.warn, 0.5 + p * 0.4), 2.5);
    }
    // body
    if (sys.type === "ruin") {
      c.save(); c.setLineDash([4, 5]);
      D.circle(c, x, y, r, "rgba(20,14,10,0.9)", "#7a5b45", 2);
      c.restore();
    } else {
      D.circle(c, x, y, r, "rgba(6,14,26,0.95)", col, sys.owner >= 0 ? 3 : 2);
      if (sys.type === "ind") D.circle(c, x, y, r - 5, null, D.rgba(col, 0.35), 1);
    }
    D.sysIcon(c, sys.type, x, y, r, sys.type === "ruin" ? "#7a5b45" : sys.owner >= 0 ? col : "#b8c4d2");
    // garrison: a ring of ticks inside the border
    if (sys.cap > 0 && sys.type !== "ruin") {
      const f = sys.troops / sys.cap;
      D.arc(c, x, y, r + 4, -Math.PI / 2, -Math.PI / 2 + U.TAU * f, D.rgba(sys.owner >= 0 ? col : "#c8d2de", 0.75), 2);
    }
    // production progress of shipyards and stock of mines
    if (sys.owner >= 0 && sys.type === "ind" && sys.mode !== "off") {
      const f = sys.buildT / R.BUILD_TIME;
      D.arc(c, x, y, r - 9, -Math.PI / 2, -Math.PI / 2 + U.TAU * f, "rgba(255,255,255,0.5)", 2);
    }
    if (sys.type === "res" && sys.stock > 0) for (let i = 0; i < sys.stock; i++) D.circle(c, x - 6 + i * 6, y + r + 9, 2, col, null);
    // defences
    if (sys.shield) {
      c.save(); c.setLineDash([10, 6]); c.lineDashOffset = t * 20;
      D.circle(c, x, y, r + 8, null, D.rgba("#9fe8ff", 0.25 + 0.6 * (sys.shield.hp / R.SHIELD_HP)), 2);
      c.restore();
    }
    if (sys.station) {
      const p = stationPos(sys, t);
      D.circle(c, p.x, p.y, 4.5, "#081322", sys.owner >= 0 ? col : "#d0d8e2", 2);
      D.circle(c, p.x, p.y, 1.6, sys.owner >= 0 ? col : "#d0d8e2", null);
    }
    // raze progress
    if (sys.struct < R.STRUCT) {
      D.arc(c, x, y, r + 16, -Math.PI / 2, -Math.PI / 2 + U.TAU * (1 - sys.struct / R.STRUCT), "#ffb060", 3);
    }
    // selection brackets
    if (opt.sel === sys.id || opt.target === sys.id) {
      const k = r + 22, q = 8, cc = opt.target === sys.id ? C.ok : "#ffffff";
      c.strokeStyle = cc; c.lineWidth = 2;
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        c.beginPath(); c.moveTo(x + sx * k, y + sy * (k - q)); c.lineTo(x + sx * k, y + sy * k); c.lineTo(x + sx * (k - q), y + sy * k); c.stroke();
      }
    }
    if (opt.hover === sys.id && opt.sel !== sys.id) D.circle(c, x, y, r + 6, null, "rgba(255,255,255,0.35)", 1.5);
    // label
    if (opt.labels !== false) D.text(c, sys.name, x, y + r + (sys.type === "res" && sys.stock ? 22 : 15), 13, sys.owner >= 0 ? D.rgba(col, 0.85) : C.dim, "center", { weight: 600 });
  }

  V.sysAt = function (s, x, y) {
    let best = null, bd = Infinity;
    for (const sys of s.sys) {
      const d = Math.hypot(sys.x - x, sys.y - y);
      if (d < RAD[sys.type] + 26 && d < bd) { bd = d; best = sys; }
    }
    return best;
  };

  /* ================= the play state ================= */
  const States = SL.States;
  const P = (States.play = {
    paused: false, speed: 0, sel: null, selTypes: { B: true, S: true, I: true }, half: false,
    targeting: false, drag: null, toasts: [], btns: [], menu: false, menuBtns: [], t: 0, endT: 0, alerts: {},
  });

  P.enter = function (arg) {
    if (arg && arg.def) {
      this.def = arg.def; this.mission = arg.mission;
      G.start(arg.def);
      SL.AI.init(G.s);
      G.on = onEvent;
      this.paused = false; this.speed = 0; this.sel = null; this.targeting = false; this.drag = null;
      this.toasts = []; this.menu = false; this.endT = 0; this.alerts = {}; this.t = 0; this.half = false;
      this.selTypes = { B: true, S: true, I: true };
      A.playSong(arg.def.song || "ops1");
      // select the home system
      const home = G.s.sys.find((x) => x.owner === 0 && x.type === "ind") || G.s.sys.find((x) => x.owner === 0);
      if (home) this.sel = home.id;
      if (arg.def.hint) this.toast(arg.def.hint, C.accent, 9);
      A.say("Operation " + arg.def.name + ". Commence.", { gap: 0 });
    }
  };
  P.pause = function () { if (!this.paused && !this.menu) { this.menu = true; this.paused = true; this.buildMenu(); } };
  P.toast = function (text, col = C.text, life = 4) {
    this.toasts.push({ text, col, t: 0, life });
    if (this.toasts.length > 5) this.toasts.shift();
  };

  function onEvent(type, d) {
    const s = G.s, me = 0;
    const nm = (id) => s.sys[id].name;
    switch (type) {
      case "launch": if (d.owner === me) A.sfx("launch"); break;
      case "arrive": if (d.owner === me) A.sfx("arrive");
        else if (s.sys[d.sys].owner === me && s.fleets.some((f) => f.at === d.sys && f.o !== me)) underAttack(d.sys);
        break;
      case "captured":
        if (d.owner === me) { A.sfx("capture"); P.toast(`${nm(d.sys)} captured`, D.OWNER[0]); A.say("System captured", { gap: 3000, interrupt: false }); }
        else if (d.from === me) { A.sfx("lost"); P.toast(`${nm(d.sys)} lost to ${D.ownerName(d.owner)}`, C.warn); A.say("System lost", { gap: 2000 }); }
        break;
      case "unitLost": if (P.near(d.sys)) A.sfx(d.owner === me ? "hit" : "boom"); break;
      case "stationDown": A.sfx("bigboom"); if (d.owner === me) P.toast(`Battle station at ${nm(d.sys)} destroyed`, C.warn); break;
      case "shieldDown": A.sfx("zap"); break;
      case "razed": A.sfx("raze"); P.toast(`${nm(d.sys)} razed`, "#ffb060", 5); if (d.by === me) A.say("Target destroyed", { gap: 2000 }); else if (d.owner === me) A.say("We lost a world", { gap: 2000 }); break;
      case "delivered": if (d.owner === me) A.sfx("convoy"); break;
      case "stolen": if (d.by === me) { A.sfx("capture"); P.toast(`Enemy convoy seized at ${nm(d.sys)}`, C.ok); } else if (d.owner === me) { A.sfx("stolen"); P.toast(`Convoy seized at ${nm(d.sys)}`, C.warn); } break;
      case "convoyLost": if (d.owner === me) P.toast(`Convoy lost at ${nm(d.sys)}`, C.warn); break;
      case "built": if (d.owner === me) A.sfx("build"); break;
      case "shield": if (d.owner === me) A.sfx("shield"); break;
      case "station": if (d.owner === me) A.sfx("station"); break;
      case "eliminated": if (d.owner !== me) { P.toast(`${D.ownerName(d.owner)} eliminated`, D.col(d.owner), 6); A.say(D.ownerName(d.owner) + " eliminated", { gap: 0 }); } break;
      case "win": A.say("Operation complete", { gap: 0 }); break;
      case "lose": A.say("Operation failed", { gap: 0 }); break;
    }
  }
  function underAttack(sysId) {
    const now = P.t;
    if (P.alerts[sysId] && now - P.alerts[sysId] < 20) return;
    P.alerts[sysId] = now;
    A.sfx("alert");
    P.toast(`${G.s.sys[sysId].name} under attack`, C.warn);
    A.say("Under attack", { gap: 6000, interrupt: false });
  }
  P.near = (id) => G.s.sys[id].owner === 0 || G.s.fleets.some((f) => f.at === id && f.o === 0);

  /* ---------- panel layout ---------- */
  P.layout = function () {
    const s = G.s, B = [];
    const me = 0, pl = s.players[me];
    let y = 92;
    // speed controls
    const sp = [
      { id: "pause", icon: D.icons.pause, on: this.paused, act: () => this.togglePause() },
      { id: "s0", label: "1×", on: !this.paused && this.speed === 0, act: () => this.setSpeed(0) },
      { id: "s1", label: "2×", on: !this.paused && this.speed === 1, act: () => this.setSpeed(1) },
      { id: "s2", label: "4×", on: !this.paused && this.speed === 2, act: () => this.setSpeed(2) },
    ];
    sp.forEach((b, i) => B.push(Object.assign(b, { x: PX + 14 + i * 72, y, w: 64, h: 40, size: 20 })));
    y += 56;
    this.objY = y;
    y += 78;
    this.sysY = y;
    const sys = this.sel !== null ? s.sys[this.sel] : null;
    if (sys) {
      let yy = y + 128;
      const mine = sys.owner === me;
      if (mine && sys.type === "ind") {
        ["B", "S", "I", "off"].forEach((m, i) => {
          B.push({ id: "mode" + m, x: PX + 14 + i * 72, y: yy, w: 64, h: 44, icon: m === "off" ? D.icons.off : D.icons["fleet" + m], label: m === "off" ? "" : String(R.COST[m]), size: 20, on: sys.mode === m, act: () => { G.setMode(me, sys.id, m); A.sfx("tap"); } });
        });
        yy += 56;
      }
      if (mine && sys.type !== "ruin") {
        B.push({ id: "shield", x: PX + 14, y: yy, w: 136, h: 40, icon: D.icons.shield, label: sys.shield ? "Shield" : `Shield ${R.COST.shield}`, size: 18,
          disabled: !G.canBuy(me, sys.id, "shield"), on: !!sys.shield, act: () => G.buy(me, sys.id, "shield") });
        B.push({ id: "station", x: PX + 158, y: yy, w: 140, h: 40, icon: D.icons.station, label: sys.station ? "Station" : `Station ${R.COST.station}`, size: 18,
          disabled: !G.canBuy(me, sys.id, "station"), on: !!sys.station, act: () => G.buy(me, sys.id, "station") });
        yy += 52;
      }
      const my = G.unitsAt(sys.id, me);
      if (!mine && sys.type !== "ruin" && my.S > 0) {
        const on = !!sys.raze[me];
        B.push({ id: "raze", x: PX + 14, y: yy, w: 284, h: 40, icon: D.icons.raze, label: on ? "Razing – stop" : "Raze this system", size: 18, on, color: "#ffb060",
          act: () => { G.setRaze(me, sys.id, !on); A.sfx(on ? "tap" : "alert"); if (!on) P.toast("Siege fleets will destroy " + sys.name, "#ffb060"); } });
        yy += 52;
      }
      this.fleetY = yy;
      if (my.B + my.S + my.I > 0) {
        yy += 26;
        ["B", "S", "I"].filter((t) => my[t]).forEach((t, i) => {
          B.push({ id: "type" + t, x: PX + 14 + i * 96, y: yy, w: 88, h: 46, icon: D.icons["fleet" + t], label: String(my[t]), size: 22, on: this.selTypes[t],
            act: () => { this.selTypes[t] = !this.selTypes[t]; A.sfx("tap"); } });
        });
        yy += 56;
        B.push({ id: "send", x: PX + 14, y: yy, w: 186, h: 44, icon: D.icons.send, label: this.targeting ? "Pick target" : "Send", size: 20, on: this.targeting,
          disabled: !this.anySel(), act: () => { this.targeting = !this.targeting; A.sfx("tap"); } });
        B.push({ id: "half", x: PX + 208, y: yy, w: 90, h: 44, icon: D.icons.half, label: this.half ? "½" : "All", size: 20, on: this.half, act: () => { this.half = !this.half; A.sfx("tap"); } });
        yy += 56;
      }
    }
    B.push({ id: "menu", x: PX + 14, y: H - 58, w: 140, h: 42, label: "Menu", size: 20, act: () => this.pause() });
    B.push({ id: "help", x: PX + 162, y: H - 58, w: 136, h: 42, label: "Help", size: 20, act: () => { this.pause(); SL.Main.setState("help", { back: "play" }); } });
    this.btns = B;
  };
  P.anySel = function () {
    if (this.sel === null) return false;
    const my = G.unitsAt(this.sel, 0);
    return ["B", "S", "I"].some((t) => this.selTypes[t] && my[t] > 0);
  };
  P.togglePause = function () { this.paused = !this.paused; A.sfx(this.paused ? "pause" : "resume"); };
  P.setSpeed = function (i) { this.speed = i; if (this.paused) this.paused = false; A.sfx("tap"); };
  P.select = function (id) {
    if (this.sel !== id) { this.selTypes = { B: true, S: true, I: true }; this.half = false; }
    this.sel = id; this.targeting = false;
    if (id !== null) A.sfx("select");
  };
  P.send = function (to) {
    if (this.sel === null || to === this.sel) return false;
    const n = G.order(0, this.sel, to, this.selTypes, this.half ? 0.5 : 1);
    this.targeting = false;
    if (n) { A.sfx("order"); A.say(n === 1 ? "Ship away" : "Fleet underway", { gap: 4000, interrupt: false }); return true; }
    A.sfx("deny");
    return false;
  };

  /* ---------- pause menu ---------- */
  P.buildMenu = function () {
    const x = W / 2 - 160;
    this.menuBtns = [
      { x, y: 222, w: 320, h: 56, label: "Resume", act: () => { this.menu = false; this.paused = false; } },
      { x, y: 288, w: 320, h: 56, label: "Restart operation", act: () => SL.Main.setState("play", { def: SL.freshDef(this.mission), mission: this.mission }) },
      { x, y: 354, w: 320, h: 56, label: "Options", act: () => SL.Main.setState("options", { back: "play" }) },
      { x, y: 420, w: 320, h: 56, label: "Abandon", color: C.warn, act: () => SL.Main.setState(this.mission === "skirmish" ? "skirmish" : "missions") },
    ];
  };

  /* ---------- input ---------- */
  P.input = function (dt) {
    const m = I.mouse, s = G.s;
    if (this.menu) {
      if (I.hit("menu") || I.hit("back")) { this.menu = false; this.paused = false; A.sfx("menuBack"); return; }
      SL.UI.runButtons(this.menuBtns);
      return;
    }
    if (s.over) {
      if (this.endT > 1.2 && (m.clicked || I.hit("click"))) SL.Main.setState("results", { def: this.def, mission: this.mission });
      return;
    }
    this.layout();
    if (I.hit("menu")) { if (this.targeting) { this.targeting = false; A.sfx("menuBack"); } else this.pause(); return; }
    if (I.hit("back") && this.targeting) { this.targeting = false; A.sfx("menuBack"); }
    if (I.hit("pause")) this.togglePause();
    if (I.hit("faster")) this.setSpeed(Math.min(2, this.speed + 1));
    if (I.hit("slower")) this.setSpeed(Math.max(0, this.speed - 1));
    if (I.hit("half")) { this.half = !this.half; A.sfx("tap"); }
    if (I.hit("send") && this.anySel()) { this.targeting = !this.targeting; A.sfx("tap"); }
    if (I.hit("next")) {
      // jump to the next own system with fleets (or any own system)
      const own = s.sys.filter((x) => x.owner === 0 || s.fleets.some((f) => f.at === x.id && f.o === 0));
      const withF = own.filter((x) => s.fleets.some((f) => f.at === x.id && f.o === 0));
      const list = withF.length ? withF : own;
      if (list.length) {
        const i = list.findIndex((x) => x.id === this.sel);
        const nx = list[(i + 1) % list.length];
        this.select(nx.id);
        if (I.lastDevice !== "mouse") { m.x = nx.x; m.y = nx.y; }
      }
    }
    // gamepad / keyboard: arrow keys hop between systems near the cursor direction
    if (I.lastDevice !== "mouse") {
      for (const [d, dx, dy] of [["up", 0, -1], ["down", 0, 1], ["left", -1, 0], ["right", 1, 0]]) {
        if (!I.hit(d) || m.x > MAPW) continue;
        let best = null, bs = Infinity;
        for (const x of s.sys) {
          const vx = x.x - m.x, vy = x.y - m.y, along = vx * dx + vy * dy;
          if (along <= 8) continue;
          const sc = along + Math.abs(vx * dy + vy * dx) * 2;
          if (sc < bs) { bs = sc; best = x; }
        }
        if (best) { m.x = best.x; m.y = best.y; A.sfx("menuMove"); }
      }
    }
    // panel buttons
    if (m.x >= PX - 8) {
      if (m.clicked) SL.UI.runButtons(this.btns);
      this.drag = null;
      return;
    }
    const over = V.sysAt(s, m.x, m.y);
    this.hover = over ? over.id : null;
    // right click: send the selection
    if (m.rclicked && over && this.sel !== null) { this.send(over.id); return; }
    if (m.clicked) {
      if (this.targeting) {
        if (over && over.id !== this.sel) this.send(over.id);
        else this.targeting = false;
        return;
      }
      if (over) {
        if (over.id !== this.sel) this.select(over.id);
        // start a drag when this system has own fleets
        if (G.unitsAt(over.id, 0).B + G.unitsAt(over.id, 0).S + G.unitsAt(over.id, 0).I > 0) this.drag = { from: over.id, x: m.x, y: m.y, moved: false };
      } else this.select(null);
    }
    if (this.drag) {
      if (Math.hypot(m.x - this.drag.x, m.y - this.drag.y) > 14) this.drag.moved = true;
      if (m.released || !m.down) {
        if (this.drag.moved && over && over.id !== this.drag.from) this.send(over.id);
        this.drag = null;
      }
    }
  };

  P.update = function (dt) {
    this.t += dt;
    for (const tt of this.toasts) tt.t += dt;
    this.toasts = this.toasts.filter((x) => x.t < x.life);
    if (G.s.over) { this.endT += dt; G.update(dt); return; }
    if (this.paused) return;
    for (const x of G.s.sys) if (x.fight > 0 && Math.random() < 0.12 && this.near(x.id)) A.sfx(Math.random() < 0.7 ? "laser" : "zap");
    const n = SPEEDS[this.speed];
    for (let i = 0; i < n; i++) { SL.AI.update(dt); G.update(dt); if (G.s.over) break; }
    if (G.s.over) {
      if (G.s.over.win) A.jingle("win"); else A.jingle("fail");
    }
  };

  /* ---------- drawing ---------- */
  P.draw = function (c) {
    const s = G.s, m = I.mouse;
    if (!this.menu) this.layout();
    D.background(c, W, H, this.t);
    let path = null, target = null;
    const over = this.hover;
    if ((this.drag && this.drag.moved) || this.targeting) {
      const from = this.drag ? this.drag.from : this.sel;
      if (over !== null && over !== undefined && over !== from && from !== null) { path = G.path(from, over); if (path) { path.unshift(from); target = over; } }
    }
    c.save(); c.beginPath(); c.rect(0, 0, MAPW, H); c.clip();
    V.drawWorld(c, s, { time: this.t, sel: this.sel, selTypes: this.selTypes, hover: over, path, target });
    if (this.drag && this.drag.moved && !path) {
      const a = s.sys[this.drag.from];
      c.save(); c.setLineDash([6, 6]); D.line(c, a.x, a.y, m.x, m.y, D.rgba(D.OWNER[0], 0.6), 2); c.restore();
    }
    this.drawTop(c);
    c.restore();
    this.drawPanel(c);
    if (this.targeting) D.text(c, "Choose a destination – Esc cancels", MAPW / 2, H - 30, 20, C.ok, "center", { weight: 700 });
    if (this.menu) this.drawMenu(c);
    else if (s.over) this.drawOver(c);
    if (I.showCursor()) D.cursor(c, m.x, m.y);
  };
  P.drawTop = function (c) {
    const s = G.s;
    D.text(c, this.def.name.toUpperCase(), 18, 24, 20, C.text, "left", { weight: 700, font: D.LOGO, spacing: 2 });
    D.text(c, SL.fmtT(s.t) + (this.paused ? "   PAUSED" : this.speed ? `   ${SPEEDS[this.speed]}×` : ""), 18, 50, 18, this.paused ? C.gold : C.dim, "left", { weight: 700 });
    // toasts
    let y = H - 70;
    for (let i = this.toasts.length - 1; i >= 0; i--) {
      const tt = this.toasts[i], a = Math.min(1, tt.t * 4, (tt.life - tt.t) * 1.5);
      c.globalAlpha = U.clamp(a, 0, 1);
      const w = D.measure(c, tt.text, 19, 700) + 30;
      D.chamfer(c, 18, y - 17, w, 34, 8, "rgba(6,12,22,0.85)", D.rgba(tt.col, 0.6));
      D.text(c, tt.text, 33, y + 1, 19, tt.col, "left", { weight: 700 });
      c.globalAlpha = 1;
      y -= 42;
    }
  };
  P.drawPanel = function (c) {
    const s = G.s, me = 0, pl = s.players[me];
    D.panel(c, PX, 8, PW, H - 16);
    D.text(c, "SUPPLY", PX + 16, 36, 15, C.dim, "left", { weight: 700, spacing: 2 });
    D.text(c, String(Math.floor(pl.bank)), PX + 16, 68, 40, C.gold, "left", { weight: 700 });
    // rival overview
    let rx = PX + PW - 16;
    for (let i = s.players.length - 1; i >= 0; i--) {
      const p = s.players[i], n = s.sys.filter((x) => x.owner === i).length;
      const col = D.col(i);
      D.text(c, String(n), rx, 52, 20, p.alive ? col : C.faint, "right", { weight: 700 });
      D.fleet(c, rx - 30, 52, 7, -Math.PI / 2, "B", p.alive ? col : C.faint, { lw: 1.5 });
      rx -= 58;
    }
    // objective
    const pr = G.progress();
    D.text(c, "OBJECTIVE", PX + 16, this.objY + 10, 14, C.accent, "left", { weight: 700, spacing: 2 });
    D.text(c, pr.text, PX + 16, this.objY + 36, 18, C.text, "left", { weight: 700 });
    D.bar(c, PX + 16, this.objY + 52, PW - 32, 5, pr.frac, C.accent);
    D.line(c, PX + 12, this.sysY - 6, PX + PW - 12, this.sysY - 6, "rgba(89,210,255,0.25)", 1);
    // selected system
    const sys = this.sel !== null ? s.sys[this.sel] : null;
    if (sys) {
      const col = D.col(sys.owner);
      let y = this.sysY + 16;
      D.text(c, sys.name, PX + 16, y, 24, col, "left", { weight: 700 });
      y += 26;
      D.text(c, SL.SYS_NAME[sys.type] + " · " + D.ownerName(sys.owner), PX + 16, y, 16, C.dim);
      y += 26;
      if (sys.type !== "ruin") {
        D.text(c, "Garrison", PX + 16, y, 16, C.text);
        D.text(c, `${Math.ceil(sys.troops)} / ${sys.cap}`, PX + PW - 16, y, 16, C.text, "right", { weight: 700 });
        D.bar(c, PX + 100, y - 3, 120, 6, sys.troops / Math.max(1, sys.cap), col);
        y += 22;
        const defs = [];
        if (sys.shield) defs.push(`Shield ${Math.ceil(sys.shield.hp)}`);
        if (sys.station) defs.push(`Station ${Math.ceil(sys.station.hp)}`);
        D.text(c, defs.length ? defs.join("  ·  ") : sys.type === "ind" && sys.owner >= 0 ? `Builds ${sys.mode === "off" ? "nothing" : SL.TYPE_NAME[sys.mode].toLowerCase() + " ships"}` : sys.type === "res" ? "Ships supply to your shipyards" : sys.type === "rep" ? "Repairs your ships in orbit" : "No defences", PX + 16, y, 15, C.dim);
        y += 20;
        const foes = s.fleets.filter((f) => f.at === sys.id && f.o !== me);
        if (foes.length) {
          const txt = foes.map((f) => `${f.n} ${SL.TYPE_NAME[f.t].toLowerCase()}`).join(", ");
          D.text(c, "Hostile: " + txt, PX + 16, y, 15, C.warn);
        }
      } else D.text(c, "Nothing remains here.", PX + 16, y, 16, C.dim);
      if (this.btns.some((b) => /^type/.test(b.id))) D.text(c, "YOUR FLEETS HERE", PX + 16, this.fleetY + 12, 13, C.accent, "left", { weight: 700, spacing: 2 });
    } else {
      D.para(c, "Select a system to see it. Drag from a system with your fleets to another system to send them.", PX + 16, this.sysY + 8, 17, PW - 32, C.dim);
    }
    for (const b of this.btns) D.button(c, b, inR(I.mouse, b), { disabled: b.disabled, on: b.on, color: b.color, size: b.size });
  };
  P.drawMenu = function (c) {
    c.fillStyle = "rgba(2,6,12,0.72)"; c.fillRect(0, 0, W, H);
    D.panel(c, W / 2 - 200, 160, 400, 344, { title: "OPERATION PAUSED" });
    SL.UI.drawButtons(c, this.menuBtns);
  };
  P.drawOver = function (c) {
    const s = G.s, win = s.over.win, a = Math.min(1, this.endT * 1.5);
    c.globalAlpha = a;
    c.fillStyle = "rgba(2,6,12,0.55)"; c.fillRect(0, 0, MAPW, H);
    D.text(c, win ? "OPERATION COMPLETE" : "OPERATION FAILED", MAPW / 2, H / 2 - 20, 46, win ? C.ok : C.warn, "center", { weight: 700, font: D.LOGO, glow: win ? C.ok : C.warn, blur: 18 });
    D.text(c, s.over.why, MAPW / 2, H / 2 + 30, 22, C.text, "center");
    if (this.endT > 1.2) D.text(c, I.touch ? "Tap to continue" : "Click to continue", MAPW / 2, H / 2 + 80, 20, C.dim, "center");
    c.globalAlpha = 1;
  };
})(window.SL);
