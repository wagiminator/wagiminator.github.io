/* Mossling March: the simulation of one level – release, walking, falling, the eight skills,
   hazards, the exit and the clock. One tick is 1/16 s, distances are terrain cells. */
"use strict";

(function (ML) {
  const { U, T } = ML;
  const G = (ML.G = { on: null });
  const emit = (type, d) => { if (G.on) G.on(type, d); };

  const TICK = (G.TICK = 1 / 16);
  const STEP_UP = 6, MAX_FALL = 64, FLOAT_AFTER = 16, BOMB_TICKS = 80, BRICKS = 12, BODY = 10;
  const SKILLS = (G.SKILLS = ["climb", "float", "bomb", "block", "build", "bash", "mine", "dig"]);
  const GROUND = new Set(["walk", "shrug", "build", "bash", "mine", "dig"]);
  const GONE = new Set(["exit", "splat", "drown", "dead", "saved"]);

  G.start = function (lv) {
    const s = {
      lv, t: T.create(lv), ms: [], tick: 0, released: 0, saved: 0, nextId: 1,
      rate: lv.rate, minRate: lv.rate, relT: 0, hatch: 0,
      time: lv.time, skills: Object.assign({}, lv.skills), used: 0,
      nuke: false, over: null, fx: [],
    };
    for (const k of SKILLS) s.skills[k] = s.skills[k] || 0;
    G.s = s;
    return s;
  };
  // ticks between two releases for a release rate of 1..99
  G.interval = (rate) => Math.floor((99 - rate) / 1.6) + 4;

  /* ---------- the tick ---------- */
  G.update = function () {
    const s = G.s;
    if (s.over) return;
    s.tick++;
    // the hatch opens during the first second and a half
    if (s.hatch < 24) { s.hatch++; if (s.hatch === 6) emit("hatch"); }
    else if (!s.nuke && s.released < s.lv.count) {
      if (--s.relT <= 0) { spawn(s); s.relT = G.interval(s.rate); }
    }
    for (const m of s.ms) step(s, m);
    s.ms = s.ms.filter((m) => m.st !== "dead" && m.st !== "saved");
    updateFx(s);
    if (s.hatch >= 24) s.time -= TICK;
    // over when nobody is left – blockers without a fuse would wait forever
    const done = (s.released >= s.lv.count || s.nuke) && s.ms.every((m) => m.st === "block" && m.bomb < 0);
    if (done || s.time <= 0) {
      s.over = { win: s.saved >= s.lv.need, saved: s.saved, timeUp: s.time <= 0 && !done };
      emit("over", s.over);
    }
  };

  function spawn(s) {
    const e = s.lv.entrance;
    s.ms.push({ id: s.nextId++, x: e.x, y: e.y, dir: e.dir || s.lv.dir || 1, st: "fall", t: 0, fall: 0, climb: false, float: false, bomb: -1, bricks: 0, anim: 0 });
    s.released++;
    emit("spawn");
  }

  const solid = (s, x, y) => T.solid(s.t, x, y);
  function setSt(m, st) { m.st = st; m.t = 0; }

  function step(s, m) {
    m.anim++;
    m.t++;
    if (GONE.has(m.st)) {
      // short animations before a mossling leaves the level
      const len = m.st === "exit" ? 12 : m.st === "splat" ? 16 : m.st === "drown" ? 20 : 0;
      if (m.t >= len) {
        if (m.st === "exit") { m.st = "saved"; s.saved++; emit("saved", m); }
        else m.st = "dead";
      }
      return;
    }
    // the fuse
    if (m.bomb >= 0 && --m.bomb < 0) { explode(s, m); return; }
    switch (m.st) {
      case "walk": walk(s, m); break;
      case "fall": fall(s, m); break;
      case "float": float(s, m); break;
      case "climb": climb(s, m); break;
      case "block": if (!solid(s, m.x, m.y + 1)) startFall(m); break;
      case "shrug": if (m.t >= 12) setSt(m, "walk"); break;
      case "build": build(s, m); break;
      case "bash": bash(s, m); break;
      case "mine": mine(s, m); break;
      case "dig": dig(s, m); break;
    }
    if (!GONE.has(m.st)) checkCell(s, m);
  }
  function startFall(m) { setSt(m, "fall"); m.fall = 0; }

  function blockerAhead(s, m, nx) {
    for (const b of s.ms) {
      if (b === m || b.st !== "block") continue;
      if (Math.abs(b.x - nx) <= 4 && (b.x - m.x) * m.dir > 0 && Math.abs(b.y - m.y) <= 8) return true;
    }
    return false;
  }

  function walk(s, m) {
    const nx = m.x + m.dir;
    if (blockerAhead(s, m, nx)) { m.dir = -m.dir; return; }
    if (solid(s, nx, m.y)) {
      let up = 1;
      while (up <= STEP_UP && solid(s, nx, m.y - up)) up++;
      if (up <= STEP_UP) { m.x = nx; m.y -= up; return; }
      if (m.climb && nx >= 0 && nx < s.t.w) { setSt(m, "climb"); return; }
      m.dir = -m.dir;
      return;
    }
    m.x = nx;
    let d = 0;
    while (d < 4 && !solid(s, m.x, m.y + 1 + d)) d++;
    if (d >= 4) { m.y += 3; startFall(m); m.fall = 3; }
    else m.y += d;
  }

  function fall(s, m) {
    for (let i = 0; i < 3; i++) {
      if (solid(s, m.x, m.y + 1)) { land(s, m); return; }
      m.y++; m.fall++;
      if (m.y > s.t.h + 12) { m.st = "dead"; emit("lost", m); return; }
    }
    if (m.float && m.fall >= FLOAT_AFTER) { setSt(m, "float"); emit("float", m); }
  }
  function float(s, m) {
    const n = m.t % 2 ? 1 : 2;
    for (let i = 0; i < n; i++) {
      if (solid(s, m.x, m.y + 1)) { setSt(m, "walk"); return; }
      m.y++;
      if (m.y > s.t.h + 12) { m.st = "dead"; emit("lost", m); return; }
    }
    // drift slightly with the wind of the level
    if (s.lv.wind && m.t % 6 === 0 && !solid(s, m.x + s.lv.wind, m.y)) m.x += s.lv.wind;
  }
  function land(s, m) {
    if (m.fall > MAX_FALL) { setSt(m, "splat"); emit("splat", m); return; }
    setSt(m, "walk");
  }

  function climb(s, m) {
    if (!solid(s, m.x + m.dir, m.y) && !solid(s, m.x + m.dir, m.y - 1)) {
      // over the top
      m.x += m.dir; m.y -= 1;
      setSt(m, "walk");
      return;
    }
    if (solid(s, m.x, m.y - BODY)) { m.dir = -m.dir; m.x += m.dir; startFall(m); return; }
    if (m.t % 2 === 0) m.y -= 1;
  }

  function build(s, m) {
    if (m.t % 6 !== 1) return;
    // stop at walls in front or a ceiling
    if (solid(s, m.x + m.dir, m.y - 1) || solid(s, m.x + m.dir * 2, m.y - 1) || solid(s, m.x + m.dir * 2, m.y - 6) || solid(s, m.x, m.y - BODY)) {
      m.dir = -m.dir; setSt(m, "walk"); return;
    }
    for (let k = 0; k < 6; k++) T.addBrick(s.t, m.x + m.dir * k, m.y);
    m.x += m.dir * 2; m.y -= 1;
    m.bricks--;
    emit("brick", { m, left: m.bricks });
    if (m.bricks <= 0) { setSt(m, "shrug"); emit("shrug", m); }
  }

  function bash(s, m) {
    if (m.t % 2) return;
    const x0 = m.dir > 0 ? m.x + 1 : m.x - 5, x1 = m.dir > 0 ? m.x + 5 : m.x - 1;
    if (T.blocked(s.t, x0, m.y - BODY + 1, x1, m.y, m.dir)) { emit("clank", m); setSt(m, "walk"); return; }
    let n = 0;
    for (let y = m.y - BODY + 1; y <= m.y; y++) for (let x = x0; x <= x1; x++) if (T.erase(s.t, x, y, m.dir) > 0) n++;
    if (n) debris(s, m.x + m.dir * 4, m.y - 4, s.t, 2);
    m.x += m.dir;
    if (!groundOrStep(s, m)) return;
    // stop when nothing is left to bash
    let any = false;
    for (let k = 1; k <= 8 && !any; k++) for (let y = m.y - BODY + 1; y <= m.y; y++) if (solid(s, m.x + m.dir * k, y)) { any = true; break; }
    if (!any && m.t > 6) setSt(m, "walk");
  }

  function mine(s, m) {
    if (m.t % 3) return;
    const x0 = m.dir > 0 ? m.x + 1 : m.x - 4, x1 = m.dir > 0 ? m.x + 4 : m.x - 1;
    if (T.blocked(s.t, x0, m.y - BODY + 2, x1, m.y + 1, m.dir) || T.blocked(s.t, m.x + m.dir, m.y + 1, m.x + m.dir, m.y + 1, m.dir)) { emit("clank", m); setSt(m, "walk"); return; }
    let n = 0;
    for (let y = m.y - BODY + 2; y <= m.y + 1; y++) for (let x = x0; x <= x1; x++) if (T.erase(s.t, x, y, m.dir) > 0) n++;
    if (n) debris(s, m.x + m.dir * 3, m.y, s.t, 2);
    m.x += m.dir; m.y += 1;
    groundOrStep(s, m);
  }

  function dig(s, m) {
    if (m.t % 2) return;
    if (T.blocked(s.t, m.x - 1, m.y + 1, m.x + 1, m.y + 1, 0)) { emit("clank", m); setSt(m, "walk"); return; }
    let n = 0;
    for (let x = m.x - 4; x <= m.x + 4; x++) if (T.erase(s.t, x, m.y + 1, 0) > 0) n++;
    if (!n) { startFall(m); return; }
    debris(s, m.x, m.y + 1, s.t, 1);
    m.y += 1;
    if (!solid(s, m.x, m.y + 1) && !solid(s, m.x - 2, m.y + 1) && !solid(s, m.x + 2, m.y + 1)) startFall(m);
  }

  // after moving: stand, step down a little, or start to fall
  function groundOrStep(s, m) {
    let d = 0;
    while (d < 4 && !solid(s, m.x, m.y + 1 + d)) d++;
    if (d >= 4) { startFall(m); return false; }
    m.y += d;
    return true;
  }

  function explode(s, m) {
    const cx = m.x, cy = m.y - 5, r = 13;
    for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) T.erase(s.t, x, y, 0);
    for (let i = 0; i < 26; i++) {
      const a = U.rand(U.TAU), v = U.rand(0.6, 2.6);
      s.fx.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, life: U.randi(14, 30), col: U.pick(["#ffd04a", "#ff8a2a", "#f06a2a", "#fff2b0"]) });
    }
    m.st = "dead";
    emit("boom", m);
  }

  function debris(s, x, y, t, n) {
    if (s.fx.length > 220) return;
    for (let i = 0; i < n; i++) s.fx.push({ x, y, vx: U.rand(-1, 1), vy: U.rand(-1.6, -0.4), life: U.randi(8, 16), col: "#c8a070", dirt: true });
  }
  function updateFx(s) {
    for (const p of s.fx) { p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.life--; }
    s.fx = s.fx.filter((p) => p.life > 0);
  }

  // hazards and the exit
  function checkCell(s, m) {
    const lv = s.lv, e = lv.exit;
    if (m.st !== "climb" && Math.abs(m.x - e.x) <= 3 && m.y <= e.y && m.y >= e.y - 8) { setSt(m, "exit"); m.bomb = -1; emit("exit", m); return; }
    for (const h of lv.hazards || []) {
      if (m.x >= h.x && m.x < h.x + h.w && m.y >= h.y && m.y < h.y + h.h) { setSt(m, "drown"); m.bomb = -1; m.hz = h.kind; emit("drown", m); return; }
    }
  }

  /* ---------- player actions ---------- */
  G.canAssign = function (m, skill) {
    if (!m || GONE.has(m.st)) return false;
    switch (skill) {
      case "climb": return !m.climb;
      case "float": return !m.float;
      case "bomb": return m.bomb < 0;
      case "block": return GROUND.has(m.st);
      case "build": return GROUND.has(m.st) && !(m.st === "build" && m.bricks > 2);
      case "bash": case "mine": case "dig": return GROUND.has(m.st) && m.st !== skill;
    }
    return false;
  };
  G.assign = function (m, skill) {
    const s = G.s;
    if (s.over || (s.skills[skill] || 0) <= 0 || !G.canAssign(m, skill)) return false;
    s.skills[skill]--; s.used++;
    if (skill === "climb") m.climb = true;
    else if (skill === "float") m.float = true;
    else if (skill === "bomb") m.bomb = BOMB_TICKS;
    else if (skill === "build") { setSt(m, "build"); m.bricks = BRICKS; }
    else setSt(m, skill);
    emit("assign", { m, skill });
    return true;
  };
  G.setRate = function (r) { const s = G.s; s.rate = U.clamp(Math.round(r), s.minRate, 99); };
  G.nuke = function () {
    const s = G.s;
    if (s.nuke || s.over) return;
    s.nuke = true;
    s.ms.forEach((m, i) => { if (!GONE.has(m.st) && m.bomb < 0) m.bomb = 20 + i * 2; });
    emit("nuke");
  };
  // who is under the cursor (cell coordinates); prefers mosslings the skill can be given to
  G.pick = function (cx, cy, skill) {
    const s = G.s;
    let best = null, bs = Infinity;
    for (const m of s.ms) {
      if (GONE.has(m.st)) continue;
      const dx = Math.abs(m.x - cx), dy = cy - (m.y - 5);
      if (dx > 6 || Math.abs(dy) > 9) continue;
      let sc = dx + Math.abs(dy) * 0.5;
      if (skill && !G.canAssign(m, skill)) sc += 100;
      if (sc < bs) { bs = sc; best = m; }
    }
    return best;
  };
  G.alive = () => G.s.ms.filter((m) => !GONE.has(m.st)).length;
  G.GONE = GONE;
  G.BOMB_TICKS = BOMB_TICKS;
})(window.ML);
