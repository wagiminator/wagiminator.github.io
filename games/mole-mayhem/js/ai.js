/* Mole Mayhem: the computer players. They fly every shot in their head (the same physics as the
   real thing), score the damage to rivals and friends, then aim – with a level-dependent wobble. */
"use strict";

(function (MM) {
  const { U, G, T } = MM;
  const AI = (MM.AI = {});
  const LEVEL = {
    easy: { aimErr: 0.11, powErr: 0.1, think: 1.4, weapons: ["bazooka", "grenade", "shotgun"], greed: 0.6 },
    normal: { aimErr: 0.045, powErr: 0.045, think: 1.0, weapons: ["bazooka", "grenade", "cluster", "shotgun", "bat", "dynamite", "homing"], greed: 0.85 },
    hard: { aimErr: 0.015, powErr: 0.015, think: 0.7, weapons: ["bazooka", "grenade", "cluster", "shotgun", "bat", "dynamite", "homing", "airstrike"], greed: 1 },
  };
  const BLAST = { bazooka: [46, 50], homing: [46, 50], grenade: [46, 50], cluster: [42, 40], dynamite: [78, 75], airstrike: [60, 70] };
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 1.15;

  AI.reset = function () { AI.st = null; };

  function scoreBlast(s, me, x, y, r, dmg) {
    let sc = 0;
    for (const m of s.moles) {
      if (m.dead) continue;
      const d = G.blastDamage(m, x, y, r, dmg);
      if (!d) continue;
      if (m.team !== me.team) {
        sc += Math.min(d, Math.max(0, m.hp)) + (d >= m.hp ? 30 : 0);
        if (m.y > s.water - 90) sc += 12; // might be blown into the sea
      } else sc -= d * (m === me ? 2.2 : 1.5) + (d >= m.hp ? 40 : 0);
    }
    return sc;
  }

  function* plan(s, me, L) {
    const team = s.teams[me.team];
    const enemies = s.moles.filter((m) => !m.dead && m.team !== me.team);
    let best = { score: 4, weapon: "skip" };
    const consider = (p) => { if (p.score > best.score) best = p; };
    const has = (k) => L.weapons.includes(k) && team.inv[k] > 0;
    // thrown and fired things
    for (const k of ["bazooka", "grenade", "cluster", "homing"]) {
      if (!has(k)) continue;
      const [r, dmg] = BLAST[k];
      for (const dir of [-1, 1]) {
        for (let a = -1.45; a <= 1.45; a += 0.09) {
          yield 0;
          const vx0 = Math.cos(a) * dir, vy0 = Math.sin(a);
          for (let p = 0.22; p <= 1.001; p += 0.085) {
            const sp = (60 + 640 * p) * (k === "bazooka" || k === "homing" ? 1 : 0.85);
            const ox = me.x + vx0 * 16, oy = me.y - 12 + vy0 * 16;
            if (T.solid(s.t, ox, oy)) continue;
            let target;
            if (k === "homing") { const e = U.pick(enemies); if (!e) continue; target = { x: e.x, y: e.y - 10 }; }
            const type = k === "bazooka" ? "rocket" : k === "homing" ? "missile" : k;
            const hit = G.predict(type, ox, oy, vx0 * sp, vy0 * sp, k === "grenade" || k === "cluster" ? 3 : undefined, target);
            if (hit.water) continue;
            let sc = scoreBlast(s, me, hit.x, hit.y, r, dmg);
            if (k === "homing") sc -= 6; // keep it for good chances
            if (k === "cluster") sc *= 1.1;
            consider({ score: sc, weapon: k, dir, aim: a, power: p, target, fuse: 3 });
          }
        }
      }
    }
    // shotgun: straight lines to rivals in sight
    if (has("shotgun")) for (const e of enemies) {
      const dx = e.x - me.x, dy = (e.y - 11) - (me.y - 12), d = Math.hypot(dx, dy);
      if (d > 600) continue;
      let clear = true;
      for (let k = 14; k < d - 8; k += 4) if (T.solid(s.t, me.x + (dx / d) * k, me.y - 12 + (dy / d) * k)) { clear = false; break; }
      if (!clear) continue;
      const dir = dx < 0 ? -1 : 1, a = Math.atan2(dy, Math.abs(dx));
      if (Math.abs(a) > 1.5) continue;
      consider({ score: Math.min(50, e.hp) * 0.9 + (e.y > s.water - 80 ? 10 : 0) + (50 >= e.hp ? 30 : 0), weapon: "shotgun", dir, aim: a, power: 0 });
    }
    // close combat
    for (const e of enemies) {
      const dx = e.x - me.x, dy = e.y - me.y;
      if (Math.abs(dx) < 26 && Math.abs(dy) < 18 && has("bat")) consider({ score: 30 + (e.hp <= 30 ? 30 : 10), weapon: "bat", dir: dx < 0 ? -1 : 1, aim: -0.5, power: 0 });
      if (Math.abs(dx) < 50 && Math.abs(dy) < 30 && has("dynamite")) {
        const sc = scoreBlast(s, me, me.x + (dx < 0 ? -10 : 10), me.y - 6, 78, 75) + 40; // we will walk away
        consider({ score: sc, weapon: "dynamite", dir: dx < 0 ? -1 : 1, aim: 0, power: 0, flee: true });
      }
    }
    // air strike on rivals out in the open
    if (has("airstrike")) for (const e of enemies) {
      let open = true;
      for (let y = e.y - 30; y > 0; y -= 6) if (T.solid(s.t, e.x, y)) { open = false; break; }
      if (open) consider({ score: scoreBlast(s, me, e.x, e.y - 6, 32, 30) * 1.6, weapon: "airstrike", target: { x: e.x, y: e.y }, dir: me.dir, aim: 0, power: 0 });
    }
    return best;
  }

  // runs every frame during a computer turn; returns control actions for play.js to apply
  AI.update = function (dt) {
    const s = G.s;
    const team = s.teams[s.team], me = s.cur;
    if (team.ctrl !== "cpu" || s.over) return;
    if (s.phase !== "play" && s.phase !== "retreat") { AI.st = null; return; }
    const L = LEVEL[team.level] || LEVEL.normal;
    let st = AI.st;
    if (!st || st.mole !== me || st.turn !== s.turnN) st = AI.st = { mole: me, turn: s.turnN, stage: "wait", t: 0, walked: 0 };
    st.t += dt;
    if (s.phase === "retreat") {
      // walk away from our own dynamite
      if (st.plan && st.plan.flee && me.st !== "air") G.walk(-st.plan.dir, dt);
      return;
    }
    if (me.st !== "stand" && me.st !== "walk") return;
    switch (st.stage) {
      case "wait":
        if (st.t > L.think * 0.4 && !st.gen) st.gen = plan(s, me, L);
        if (st.gen) {
          // think a few milliseconds per frame so the game keeps running smoothly
          const t0 = performance.now();
          let r;
          do r = st.gen.next(); while (!r.done && performance.now() - t0 < 6);
          if (r.done) { st.plan = r.value; st.gen = null; st.stage = "ready"; }
        }
        break;
      case "ready":
        if (st.t > L.think) { st.stage = "decide"; st.t = 0; }
        break;
      case "decide": {
        const p = st.plan;
        if (p.score < 8 * L.greed && st.walked < 2.2 && s.turnT > 12) {
          // nothing good from here: walk towards the nearest rival and think again
          const e = s.moles.filter((m) => !m.dead && m.team !== me.team).sort((a, b) => Math.abs(a.x - me.x) - Math.abs(b.x - me.x))[0];
          st.walkDir = e ? (e.x < me.x ? -1 : 1) : me.dir;
          st.stage = "walk"; st.t = 0;
          break;
        }
        if (p.weapon === "skip") { G.setWeapon("skip"); G.firePress(); return; }
        G.setWeapon(p.weapon);
        // the human touch: a little error in aim and strength
        p.aimGoal = U.clamp(p.aim + gauss() * L.aimErr, -1.55, 1.55);
        p.powGoal = U.clamp(p.power + gauss() * L.powErr, 0.1, 1);
        st.stage = "turn"; st.t = 0;
        break;
      }
      case "walk": {
        const x0 = me.x;
        G.walk(st.walkDir, dt);
        st.walked += dt;
        if (st.t > 1.1 || (me.x === x0 && st.t > 0.3)) {
          if (me.x === x0) G.jump(false);
          st.stage = "wait"; st.t = 0; st.gen = null;
        }
        break;
      }
      case "turn":
        if (me.dir !== st.plan.dir) { G.walk(st.plan.dir, dt); break; }
        if (st.t > 0.25) { st.stage = "aim"; st.t = 0; }
        break;
      case "aim": {
        const d = st.plan.aimGoal - s.aim;
        if (Math.abs(d) > 0.02) { G.aimBy(Math.sign(d) * Math.min(Math.abs(d), 1.6 * dt)); break; }
        if (st.t < 0.3) break;
        const p = st.plan;
        if (p.target && (p.weapon === "airstrike" || p.weapon === "homing")) G.setTarget(p.target.x, p.target.y);
        if (p.weapon === "airstrike") { st.stage = "done"; break; }
        s.fuse = p.fuse || 3;
        G.firePress();
        st.stage = G.WEAPONS[p.weapon].charge ? "charge" : p.weapon === "shotgun" ? "shot2" : "done";
        st.t = 0;
        break;
      }
      case "charge":
        if (s.power >= st.plan.powGoal) { G.fireRelease(); st.stage = "done"; }
        break;
      case "shot2":
        if (st.t > 1.2 && s.phase === "play") { G.firePress(); st.stage = "done"; }
        break;
    }
  };
})(window.MM);
