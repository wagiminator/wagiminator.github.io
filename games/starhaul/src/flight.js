/* STARHAUL: flying in space – player controls, ships and their AI, lasers, missiles, ECM, energy bomb, collisions,
   docking (by hand or by computer), in-system jump drive, hyperspace, fuel scooping, mining and encounters. */
import * as THREE from "three";
import { SHIPS, LASERS, buildShip, glowSprite } from "./ships.js";
import { G, sys, shipDef, cargoFree, cargoCap, addScore, earn, msg, illegalCargo, fuelMax } from "./state.js";
import { galaxy, dist, GOODS, rankOf } from "./galaxy.js";
const { U } = window.XA;
const I = window.XA.Input, A = window.XA.Audio;

const FWD = new THREE.Vector3(0, 0, -1), UPV = new THREE.Vector3(0, 1, 0), RIGHTV = new THREE.Vector3(1, 0, 0);
const tv = () => new THREE.Vector3();
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3();
const SCANNER = 16000, MASSLOCK = 5000, JUMP_MULT = 26;
const NPC_LASER = { jackal: 5, raptor: 7, warden: 7, drone: 5, xyrrid: 11, kestrel: 4, wren: 3, mule: 4, atlas: 5, falcon: 8, vanguard: 9, seraph: 8 };

export class Flight {
  constructor(world) {
    this.w = world;
    this.player = new THREE.Object3D();
    world.scene.add(this.player);
    this.ents = [];
    this.view = 0;
    this.time = 0;
    this.cb = {};
    this.p = null;
  }

  /* ---------- setup ---------- */
  resetPlayer() {
    const d = shipDef(), c = G.cmdr;
    const shMax = d.shields * (c.equip.shield ? 1.5 : 1);
    this.p = {
      speed: 0, max: d.speed, shF: shMax, shA: shMax, shMax, energy: d.energy, eMax: d.energy, laserT: 0, cabinT: 20, alt: 1e9,
      rate: { p: 0, r: 0, y: 0 }, cool: 0, jump: false, hyper: null, dc: null, lock: null, alive: true, flash: 0, hitDir: 0,
      legalT: 0, scoopT: 0, overheat: false, ecmT: 0, mouseStick: { x: 0, y: 0 }, fireHeld: false,
    };
    // the player's own ship model, seen in the chase view
    if (this.pmesh) this.player.remove(this.pmesh);
    this.pmesh = buildShip(c.ship);
    this.pmesh.visible = false;
    this.player.add(this.pmesh);
    this.setView(this.view === 4 ? 4 : 0);
  }
  clearEnts() { for (const e of this.ents) this.w.scene.remove(e.mesh); this.ents = []; this.p && (this.p.lock = null); }

  // called when a new system scene is ready
  begin(mode) {
    this.clearEnts();
    const S = this.w.sys;
    this.S = S;
    this.mode = "fly";
    this.encT = U.rand(20, 40);
    this.dead = null; this.pod = null; this.jumpFx = null;
    this.w.sysGroup.visible = true; this.w.skyGroup.visible = true;
    const pl = this.player;
    pl.parent !== this.w.scene && this.w.scene.add(pl);
    if (mode === "launch") {
      const ax = S.stationAxis;
      pl.position.copy(S.station.position).addScaledVector(ax, 420);
      pl.quaternion.setFromRotationMatrix(_m.lookAt(new THREE.Vector3(), ax, UPV));
      this.p.speed = this.p.max * 0.45;
      this.launchFx = 1.4;
      A.sfx("launch");
      this.encounter("police", S.station.position.clone().addScaledVector(ax, 5000), 1 + U.randi(0, 1));
      this.encounter("traders", S.station.position.clone().addScaledVector(ax, 9000).add(rv(4000)), U.randi(1, 2));
    } else {
      const misjump = mode === "misjump";
      const dir = S.sunDir.clone().add(rv(0.8)).normalize();
      const d = S.R * (misjump ? 14 : 5.5 + Math.random() * 2);
      pl.position.copy(dir.multiplyScalar(d));
      pl.quaternion.setFromRotationMatrix(_m.lookAt(pl.position, S.station.position, UPV));
      this.p.speed = this.p.max * 0.5;
      this.arriveFx = 1.0;
      const ahead = pl.position.clone().addScaledVector(fwdOf(pl), 7000);
      if (misjump) { this.encounter("aliens", ahead, 1); msg("WARNING: hyperspace malfunction!", "#ff6060", 5); A.playSong("alien"); }
      else {
        const s = sys();
        if (Math.random() < (0.1 + (7 - s.gov) * 0.07) * this.threat()) this.encounter("pirates", ahead.clone().add(rv(3000)), this.pirateGroup(s));
        if (Math.random() < 0.45) this.encounter("traders", pl.position.clone().add(rv(9000)), U.randi(1, 2));
        if (Math.random() < 0.3) this.encounter("rocks", ahead.clone().add(rv(4000)), U.randi(3, 6));
        if (G.cmdr.legal >= 50 && Math.random() < 0.5) this.encounter("hunters", ahead.clone().add(rv(3000)), U.randi(1, 2));
      }
    }
    this.playSpaceSong();
  }
  // How dangerous space is for this commander: low for a beginner, rising with the combat
  // rating and the flight time (0.3 .. 1). Anarchies stay rougher than safe systems.
  threat() {
    const c = G.cmdr;
    return U.clamp(0.3 + c.killPts / 60 + c.time / 5400, 0.3, 1);
  }
  pirateGroup(s) {
    const most = s.gov <= 1 ? 4 : 2;
    return U.randi(1, Math.max(1, Math.round(most * this.threat())));
  }
  playSpaceSong() {
    if (this.mode !== "fly") return;
    const s = sys();
    A.playSong(s.gov <= 1 ? "outlaw" : s.econ <= 2 ? "forge" : s.econ >= 5 ? "frontier" : "void");
  }

  setView(v) {
    this.view = v;
    const cam = this.w.camera, d = shipDef();
    if (cam.parent !== this.player) this.player.add(cam);
    cam.position.set(0, 0, 0); cam.rotation.set(0, 0, 0);
    if (v === 1) cam.rotation.y = Math.PI;
    if (v === 2) cam.rotation.y = Math.PI / 2;
    if (v === 3) cam.rotation.y = -Math.PI / 2;
    if (v === 4) { cam.position.set(0, d.size * 0.42, d.size * 1.9); cam.rotation.x = -0.12; }
    if (this.pmesh) this.pmesh.visible = v === 4;
    this.camBase = cam.position.clone();
  }

  /* ---------- entities ---------- */
  spawn(type, pos, opts = {}) {
    const def = SHIPS[type];
    const mesh = buildShip(type);
    mesh.position.copy(pos);
    if (opts.quat) mesh.quaternion.copy(opts.quat); else mesh.quaternion.setFromEuler(new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6));
    this.w.scene.add(mesh);
    const e = {
      type, def, mesh, pos: mesh.position, quat: mesh.quaternion, role: opts.role || def.role, speed: opts.speed ?? def.speed * 0.6,
      shields: def.shields, energy: def.energy, eMax: def.energy, r: def.size * 0.55, state: "cruise", t: 0, cool: U.rand(0.5, 1.5),
      skill: opts.skill ?? U.rand(0.3, 0.9), missiles: def.missiles, target: opts.target || null, aggro: null, hostile: !!opts.hostile,
      vel: new THREE.Vector3(), spin: opts.spin || null, good: opts.good, qty: opts.qty || 1, life: opts.life || 0, flash: 0, ecm: opts.ecm || false,
      dest: null, alive: true, drift: opts.drift || null, owner: opts.owner || null, bounty: def.bounty, legalTag: opts.legalTag || 0, launchT: 0,
    };
    if (e.role === "rock" || e.role === "cargo") { e.spin = new THREE.Vector3(U.rand(-0.6, 0.6), U.rand(-0.6, 0.6), U.rand(-0.6, 0.6)); e.drift = e.drift || rv(def.speed); e.speed = 0; }
    this.ents.push(e);
    return e;
  }
  encounter(kind, center, n) {
    const out = [];
    const ships = this.ents.filter((e) => e.role !== "rock" && e.role !== "cargo" && e.role !== "missile").length;
    if (ships > 14 && kind !== "aliens") return out;
    const pl = this.player.position;
    const face = (p) => new THREE.Quaternion().setFromRotationMatrix(_m.lookAt(p, pl, UPV));
    for (let i = 0; i < n; i++) {
      const p = center.clone().add(rv(1200));
      let e;
      if (kind === "pirates") {
        const t = Math.random() < 0.3 ? "raptor" : "jackal";
        const th = this.threat(), hasCargo = Object.keys(G.cmdr.cargo).length > 0;
        const aggressive = sys().gov <= 1 || Math.random() < (hasCargo ? 0.35 + 0.55 * th : 0.6 * th);
        e = this.spawn(t, p, { quat: face(p), role: "pirate", hostile: aggressive, target: aggressive ? "player" : null, skill: U.rand(0.25, 0.6) + Math.min(0.35, G.cmdr.killPts / 600) });
        e.ecm = t === "raptor" && Math.random() < 0.4;
      } else if (kind === "traders") {
        const t = U.pick(["kestrel", "mule", "atlas", "wren", "mule"]);
        e = this.spawn(t, p, { role: "trader", skill: U.rand(0.1, 0.5) });
        e.goStation = Math.random() < 0.6;
        e.quat.setFromRotationMatrix(_m.lookAt(p, e.goStation ? this.S.station.position : p.clone().add(rv(1)), UPV));
      } else if (kind === "police") {
        e = this.spawn("warden", p, { role: "police", skill: U.rand(0.5, 0.85), ecm: true });
        if (G.cmdr.legal >= 50) { e.hostile = true; e.target = "player"; }
      } else if (kind === "hunters") {
        e = this.spawn(U.pick(["falcon", "vanguard", "falcon"]), p, { quat: face(p), role: "hunter", skill: U.rand(0.55, 0.9), hostile: G.cmdr.legal >= 50, target: G.cmdr.legal >= 50 ? "player" : null });
      } else if (kind === "rocks") {
        e = this.spawn(Math.random() < 0.75 ? "asteroid" : "boulder", center.clone().add(rv(2500)), {});
        e.mesh.scale.setScalar(U.rand(0.7, 1.6)); e.r *= e.mesh.scale.x;
      } else if (kind === "aliens") {
        if (i === 0) e = this.spawn("xyrrid", p, { quat: face(p), role: "alien", hostile: true, target: "player", skill: 0.6 });
        for (let k = 0; k < 3; k++) out.push(this.spawn("drone", p.clone().add(rv(800)), { quat: face(p), role: "alien", hostile: true, target: "player", skill: U.rand(0.4, 0.7) }));
      }
      if (e) out.push(e);
      if (kind === "aliens") break;
    }
    return out;
  }
  removeEnt(e) { e.alive = false; this.w.scene.remove(e.mesh); if (this.p && this.p.lock === e) this.p.lock = null; }

  /* ---------- per frame ---------- */
  update(dt) {
    this.time += dt;
    const p = this.p;
    if (this.mode === "jump") { this.updateHyperTunnel(dt); return; }
    if (this.dead) { this.updateDead(dt); this.updateEnts(dt); return; }
    if (this.pod) { this.updatePod(dt); this.updateEnts(dt); return; }
    this.controls(dt);
    this.updatePlayer(dt);
    this.updateEnts(dt);
    this.collisions(dt);
    this.spawner(dt);
    this.w.updateDust(this.player.position, fwdOf(this.player).multiplyScalar(p.jump ? p.max * 3 : p.speed));
    if (this.launchFx > 0) { this.launchFx -= dt; this.w.setTunnel(Math.max(0, this.launchFx / 1.4) * 1.2, this.time, 0x9ad0ff); }
    else if (this.arriveFx > 0) { this.arriveFx -= dt; this.w.setTunnel(Math.max(0, this.arriveFx) * 0.6, this.time * 2, 0x80a0ff); }
    else if (!p.jump) this.w.setTunnel(0, 0);
    // engine glow of the player's own ship
    if (this.pmesh && this.pmesh.userData.engines) for (const s of this.pmesh.userData.engines) s.material.opacity = 0.3 + 0.7 * (p.speed / p.max);
    A.setEngine(p.speed / p.max, p.jump);
  }

  // test hook: a simple pilot that hunts hostile ships
  autopilot(dt) {
    const p = this.p, pl = this.player;
    let best = null, bd = 12000;
    for (const e of this.ents) if (e.alive && (e.hostile || e.role === "rock") && e.role !== "missile") { const d = e.pos.distanceTo(pl.position); if (d < bd) { bd = d; best = e; } }
    p.fireHeld = false;
    if (!best) { p.speed = p.max * 0.5; return; }
    const to = _v2.subVectors(best.pos, pl.position).normalize();
    _q.setFromRotationMatrix(_m.lookAt(_v1.set(0, 0, 0), to, new THREE.Vector3(0, 1, 0).applyQuaternion(pl.quaternion)));
    pl.quaternion.rotateTowards(_q, 2.2 * dt);
    p.speed = bd > 1500 ? p.max : p.max * 0.3;
    p.fireHeld = fwdOf(pl).angleTo(to) < 0.05 && bd < 5000;
    if (G.cmdr.missiles > 0 && bd < 4000 && Math.random() < dt * 0.1) { p.lock = best; this.fireMissile(); }
  }
  controls(dt) {
    if (G.autopilot) { this.autopilot(dt); return; }
    const p = this.p, c = G.cmdr, pad = I.pad, m = I.mouse;
    let pitch = 0, roll = 0, yaw = 0;
    if (I.held("pitchUp")) pitch += 1;
    if (I.held("pitchDown")) pitch -= 1;
    if (I.held("rollL")) roll -= 1;
    if (I.held("rollR")) roll += 1;
    if (I.held("yawL")) yaw -= 1;
    if (I.held("yawR")) yaw += 1;
    if (pad.connected) { pitch += pad.axes[1]; roll += pad.axes[0]; yaw += pad.axes[2]; }
    // mouse flight: the cursor's offset from the screen centre steers
    if (I.lastDevice === "mouse" && m.inside && !this.p.dc) {
      const dx = m.nx, dy = m.ny, dz = (v) => (Math.abs(v) < 0.05 ? 0 : (v - Math.sign(v) * 0.05) / 0.95);
      roll += dz(dx) * 1.2; yaw += dz(dx) * 0.35; pitch += dz(dy) * 1.2;
    }
    if (I.invert) pitch = -pitch;
    pitch = U.clamp(pitch, -1, 1); roll = U.clamp(roll, -1, 1); yaw = U.clamp(yaw, -1, 1);
    const k = Math.min(1, dt * 7);
    p.rate.p += (pitch - p.rate.p) * k; p.rate.r += (roll - p.rate.r) * k; p.rate.y += (yaw - p.rate.y) * k;
    // throttle
    let thr = 0;
    if (I.held("faster")) thr += 1;
    if (I.held("slower")) thr -= 1;
    if (pad.connected) thr += (pad.values[7] || 0) - (pad.values[6] || 0);
    if (m.wheel) { p.speed = U.clamp(p.speed - m.wheel * p.max * 0.08, 0, p.max); }
    p.speed = U.clamp(p.speed + thr * p.max * 0.9 * dt, 0, p.max);
    // actions
    const key = (code) => I.pressed.has(code);
    if (key("KeyJ") || I.padHit(3)) this.toggleJump();
    if (key("KeyH") || I.padHit(12)) this.startHyper(false);
    if (key("KeyG")) this.startHyper(true);
    if (key("KeyT") || I.padHit(2) || m.mclicked) this.lockTarget();
    if (key("KeyM") || I.padHit(1) || m.rclicked) this.fireMissile();
    if (key("KeyZ") || I.padHit(4)) this.ecm(true);
    if (key("KeyB") || I.padHit(14)) this.energyBomb();
    if (key("KeyL") || I.padHit(13)) this.toggleDockComputer();
    if (key("Delete") || key("End")) this.escapePod();
    if (key("Digit1")) this.setView(0);
    if (key("Digit2")) this.setView(1);
    if (key("Digit3")) this.setView(2);
    if (key("Digit4")) this.setView(3);
    if (key("Digit5") || key("KeyC") || I.padHit(5)) this.setView(this.view === 4 ? 0 : 4);
    if (I.padHit(15)) this.setView(this.view === 1 ? 0 : 1);
    p.fireHeld = I.held("fire") || (pad.connected && pad.buttons[0]) || (I.lastDevice === "mouse" && (m.buttons & 1) === 1);
  }

  updatePlayer(dt) {
    const p = this.p, c = G.cmdr, d = shipDef(), pl = this.player, S = this.S;
    // docking computer flies for us
    if (p.dc) this.dockComputer(dt);
    else {
      pl.rotateX(p.rate.p * d.pitch * dt);
      pl.rotateZ(-p.rate.r * d.roll * dt);
      pl.rotateY(-p.rate.y * d.pitch * 0.5 * dt);
    }
    const fwd = fwdOf(pl);
    const v = p.jump ? p.max * JUMP_MULT : p.speed;
    pl.position.addScaledVector(fwd, v * dt);
    // mass lock ends the jump drive
    if (p.jump && this.massLocked()) { p.jump = false; A.sfx("jumpOff"); msg("Mass locked", "#ffd060"); }
    if (p.jump) this.w.setTunnel(0.25, this.time * 0.5, 0x6080ff);
    // energy, shields and temperature
    const regen = (c.equip.energy ? 2 : 1);
    p.energy = Math.min(p.eMax, p.energy + p.eMax * 0.025 * regen * dt);
    for (const s of ["shF", "shA"]) if (p[s] < p.shMax && p.energy > p.eMax * 0.15) { const a = Math.min(p.shMax - p[s], p.shMax * 0.06 * regen * dt); p[s] += a; p.energy -= a * 0.35; }
    p.laserT = Math.max(0, p.laserT - dt * 14);
    if (p.overheat && p.laserT < 60) p.overheat = false;
    // the sun heats the cabin, fuel scoops skim fuel
    const sunD = pl.position.distanceTo(S.sunPos) - S.sunR;
    const heat = U.clamp(1 - sunD / (S.sunR * 3), 0, 1);
    p.cabinT += ((20 + heat * 260) - p.cabinT) * Math.min(1, dt * 0.8);
    if (p.cabinT > 100) { this.hurt((p.cabinT - 100) * 0.3 * dt, null, true); if (Math.random() < dt * 2) msg("Cabin temperature critical!", "#ff6060"); }
    if (c.equip.scoop && heat > 0.55 && p.speed > p.max * 0.4 && c.fuel < fuelMax()) {
      c.fuel = Math.min(fuelMax(), c.fuel + dt * 0.25); p.scoopT += dt;
      if (p.scoopT > 0.4) { p.scoopT = 0; A.sfx("fuel"); }
      if (Math.random() < dt) msg("Fuel scooping", "#ffd060", 1.5);
    }
    // altitude above the planet
    p.alt = pl.position.length() - S.R;
    if (p.alt < 0) this.crash("planet");
    if (sunD < 0) this.crash("sun");
    // weapons
    p.cool -= dt;
    if (p.fireHeld && !p.dc) this.firePlayerLaser();
    p.flash = Math.max(0, p.flash - dt * 2.5);
    // hyperspace countdown
    if (p.hyper) {
      p.hyper.t -= dt;
      if (Math.floor(p.hyper.t + dt) !== Math.floor(p.hyper.t) && p.hyper.t > 0) A.sfx("beep");
      if (p.hyper.t <= 0) this.doHyper();
    }
    p.legalT = Math.max(0, p.legalT - dt);
    p.ecmT = Math.max(0, p.ecmT - dt);
    // laser glow on the guns and camera shake
    if (this.w.shake > 0) {
      const s = this.w.shake; this.w.shake = Math.max(0, s - dt * 30);
      this.w.camera.position.copy(this.camBase).add(new THREE.Vector3((Math.random() - 0.5) * s * 0.3, (Math.random() - 0.5) * s * 0.3, 0));
    } else if (this.camBase) this.w.camera.position.copy(this.camBase);
  }

  massLocked() {
    const pp = this.player.position;
    for (const e of this.ents) if (e.alive && e.role !== "rock" && e.role !== "cargo" && e.role !== "missile" && e.pos.distanceTo(pp) < MASSLOCK) return true;
    if (pp.distanceTo(this.S.station.position) < 6000) return true;
    if (pp.length() < this.S.R * 1.25) return true;
    if (pp.distanceTo(this.S.sunPos) < this.S.sunR * 2) return true;
    return false;
  }
  toggleJump() {
    const p = this.p;
    if (p.jump) { p.jump = false; A.sfx("jumpOff"); return; }
    if (this.massLocked()) { msg("Mass locked – jump drive unavailable", "#ffd060"); A.sfx("deny"); return; }
    p.jump = true; A.sfx("jumpOn"); this.jumpEncT = 3;
  }

  /* ---------- player weapons ---------- */
  firePlayerLaser() {
    const p = this.p, c = G.cmdr;
    const rear = this.view === 1;
    const type = rear ? c.lasers.rear : c.lasers.front;
    if (!type || this.view === 2 || this.view === 3) return;
    if (p.cool > 0 || p.overheat || p.energy < 4) return;
    const L = LASERS[type];
    p.cool = L.cool; p.laserT += L.heat; p.energy -= 0.6;
    if (p.laserT >= 100) { p.overheat = true; msg("Laser overheated", "#ff9040", 2); }
    A.sfx(L.snd);
    const pl = this.player;
    const dir = rear ? fwdOf(pl).negate() : fwdOf(pl);
    const origin = pl.position.clone();
    const hit = this.rayHit(origin, dir, 7000, null);
    const end = hit ? hit.point : origin.clone().addScaledVector(dir, 7000);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(pl.quaternion), down = new THREE.Vector3(0, -1, 0).applyQuaternion(pl.quaternion);
    for (const s of [-1, 1]) this.w.beam(origin.clone().addScaledVector(right, s * 9).addScaledVector(down, 5).addScaledVector(dir, 6), end, L.color, 1.2, 0.08, !!hit);
    if (hit && hit.ent) this.damageEnt(hit.ent, L.dmg * (0.85 + Math.random() * 0.3), "player", L);
    else if (hit && hit.station) this.stationHit();
  }
  rayHit(o, d, range, ignore) {
    let best = null, bt = range;
    for (const e of this.ents) {
      if (!e.alive || e === ignore) continue;
      _v1.subVectors(e.pos, o);
      const t = _v1.dot(d);
      if (t < 0 || t > bt) continue;
      const d2 = _v1.lengthSq() - t * t;
      if (d2 < e.r * e.r) { bt = t; best = { ent: e, point: o.clone().addScaledVector(d, Math.max(0, t - Math.sqrt(Math.max(0, e.r * e.r - d2)))) }; }
    }
    // the station hub
    const st = this.S.station.position; _v1.subVectors(st, o); const t = _v1.dot(d);
    if (t > 0 && t < bt && _v1.lengthSq() - t * t < 300 * 300) return { station: true, point: o.clone().addScaledVector(d, t - 250) };
    return best;
  }
  lockTarget() {
    const pl = this.player, fwd = this.view === 1 ? fwdOf(pl).negate() : fwdOf(pl);
    let best = null, ba = 0.35;
    for (const e of this.ents) {
      if (!e.alive || e.role === "cargo" || e.role === "missile") continue;
      _v1.subVectors(e.pos, pl.position); const dd = _v1.length(); if (dd > SCANNER) continue;
      const a = _v1.normalize().angleTo(fwd);
      if (a < ba) { ba = a; best = e; }
    }
    if (!best) {
      // cycle through everything on the scanner instead
      const list = this.ents.filter((e) => e.alive && e.role !== "cargo" && e.role !== "missile" && e.pos.distanceTo(pl.position) < SCANNER).sort((a, b) => a.pos.distanceTo(pl.position) - b.pos.distanceTo(pl.position));
      if (!list.length) { msg("No target", "#9ad8ff", 1.5); return; }
      const i = list.indexOf(this.p.lock); best = list[(i + 1) % list.length];
    }
    this.p.lock = best; A.sfx("lock"); msg(`Target: ${best.def.name}`, "#ffd060", 2);
  }
  fireMissile() {
    const c = G.cmdr, p = this.p;
    if (c.missiles <= 0) { msg("No missiles left", "#ff9040", 2); A.sfx("deny"); return; }
    if (!p.lock || !p.lock.alive) { this.lockTarget(); if (!p.lock) return; }
    c.missiles--;
    const pl = this.player, pos = pl.position.clone().addScaledVector(new THREE.Vector3(0, -1, 0).applyQuaternion(pl.quaternion), 10).addScaledVector(fwdOf(pl), 30);
    const m = this.spawn("missile", pos, { quat: pl.quaternion.clone(), role: "missile", speed: Math.max(p.speed, 300), target: p.lock, owner: "player", life: 16 });
    A.sfx("missile"); msg("Missile launched", "#ffd060", 2);
    if (p.lock.role !== "pirate" && p.lock.role !== "alien" && p.lock.role !== "rock") p.lock.aggro = "player";
    return m;
  }
  npcMissile(e, target) {
    if (e.missiles <= 0) return;
    e.missiles--;
    const fwd = fwdOf(e.mesh);
    this.spawn("missile", e.pos.clone().addScaledVector(fwd, e.r + 15), { quat: e.quat.clone(), role: "missile", speed: e.speed + 100, target, owner: e, life: 14 });
    A.sfx("missile");
    if (target === "player") { msg("INCOMING MISSILE!", "#ff4040", 4); A.sfx("alarm"); }
  }
  ecm(byPlayer) {
    if (byPlayer) {
      if (!G.cmdr.equip.ecm) { msg("No E.C.M. system fitted", "#ff9040", 2); A.sfx("deny"); return; }
      if (this.p.ecmT > 0) return;
      this.p.ecmT = 1.2;
    }
    A.sfx("ecm");
    const pos = this.player.position;
    for (const e of this.ents) if (e.role === "missile" && e.alive && e.pos.distanceTo(pos) < 30000) { this.w.spark(e.pos, 0x80c0ff, 30); this.removeEnt(e); }
    if (!byPlayer) msg("E.C.M. detected", "#80c0ff", 2);
  }
  energyBomb() {
    const c = G.cmdr;
    if (!c.equip.bomb) { msg("No energy bomb fitted", "#ff9040", 2); A.sfx("deny"); return; }
    c.equip.bomb = false;
    A.sfx("bomb"); this.w.shake = 25;
    this.bombFlash = 1;
    for (const e of [...this.ents]) {
      if (!e.alive || e.pos.distanceTo(this.player.position) > 15000) continue;
      if (e.type === "xyrrid") { this.damageEnt(e, 300, "player", null); continue; }
      if (e.role === "cargo") continue;
      this.destroyEnt(e, "player");
    }
  }
  escapePod() {
    if (!G.cmdr.equip.pod) { msg("No escape pod fitted", "#ff9040", 2); A.sfx("deny"); return; }
    A.sfx("pod");
    this.pod = { t: 0, pos: this.player.position.clone(), vel: fwdOf(this.player).multiplyScalar(-150).add(new THREE.Vector3(0, 60, 0).applyQuaternion(this.player.quaternion)) };
    this.setView(4);
    this.pod.mesh = buildShip("pod"); this.pod.mesh.position.copy(this.player.position); this.w.scene.add(this.pod.mesh);
    msg("Escape pod launched", "#ffd060", 4);
  }
  updatePod(dt) {
    const pd = this.pod; pd.t += dt;
    pd.mesh.position.addScaledVector(pd.vel, dt);
    const cam = this.w.camera;
    if (cam.parent !== this.w.scene) { this.w.scene.attach(cam); }
    cam.position.copy(pd.mesh.position).add(new THREE.Vector3(30, 20, 60));
    cam.lookAt(pd.t < 1.5 ? this.player.position : pd.mesh.position);
    if (pd.t > 1.3 && !pd.boom) { pd.boom = true; this.player.visible = false; this.w.explode(this.player.position, 70, { shake: 10 }); A.sfx("explodeL"); }
    if (pd.t > 4.5) { this.w.scene.remove(pd.mesh); this.pod = null; this.player.visible = true; if (this.cb.escape) this.cb.escape(); }
    this.w.updateDust(cam.position, pd.vel);
    A.setEngine(-1);
  }

  /* ---------- damage ---------- */
  hurt(amount, from, internal) {
    const p = this.p;
    if (!p.alive) return;
    if (G.cheat) { if (from) this.w.spark(this.player.position.clone().add(from.clone().sub(this.player.position).setLength(25)), 0x80c0ff, 18); return; }
    if (!internal) {
      const front = from ? fwdOf(this.player).dot(_v1.subVectors(from, this.player.position)) > 0 : true;
      const key = front ? "shF" : "shA";
      const absorb = Math.min(p[key], amount);
      p[key] -= absorb; amount -= absorb;
      p.hitDir = front ? 1 : -1;
      if (absorb > 0) A.sfx("hitShield");
      if (from) this.w.spark(this.player.position.clone().add(from.clone().sub(this.player.position).setLength(28)), absorb > 0 ? 0x60b0ff : 0xff8040, 22);
    }
    if (amount > 0) {
      p.energy -= amount; p.flash = Math.min(1, p.flash + 0.5);
      if (!internal) A.sfx("hitHull");
      this.w.shake = Math.max(this.w.shake, 6);
      if (p.energy < p.eMax * 0.25 && Math.random() < 0.3) msg("ENERGY LOW", "#ff4040", 2);
      if (p.energy <= 0) this.die();
    }
  }
  die() {
    const p = this.p;
    if (!p.alive) return;
    p.alive = false; p.jump = false; p.dc = null;
    this.dead = { t: 0, pos: this.player.position.clone() };
    this.w.explode(this.player.position, 90, { shake: 30 });
    A.sfx("explodeL"); A.setEngine(-1); A.jingle("gameover");
    this.player.visible = false;
    const cam = this.w.camera; this.w.scene.attach(cam);
    this.dead.camDir = rv(1).normalize();
    msg("GAME OVER", "#ff4040", 6);
  }
  updateDead(dt) {
    const d = this.dead; d.t += dt;
    const cam = this.w.camera;
    cam.position.copy(d.pos).addScaledVector(d.camDir, 120 + d.t * 70);
    cam.lookAt(d.pos);
    if (d.t > 1.2 && !d.second) { d.second = true; this.w.explode(d.pos.clone().add(rv(30)), 60, {}); A.sfx("explodeS"); }
    if (d.t > 5 && !d.done) { d.done = true; if (this.cb.death) this.cb.death(); }
  }
  crash(what) {
    if (G.cheat) {
      // bounce off instead of dying
      const pl = this.player.position;
      if (what === "planet") pl.setLength(this.S.R + 60);
      else pl.sub(this.S.sunPos).setLength(this.S.sunR + 200).add(this.S.sunPos);
      this.p.speed *= 0.3; return;
    }
    msg(what === "sun" ? "You flew into the star" : "You crashed into the planet", "#ff4040", 5);
    this.p.energy = 0; this.die();
  }

  damageEnt(e, dmg, by, laser) {
    if (!e.alive) return;
    e.flash = 0.1;
    if (laser && laser.mining && e.role === "rock") dmg *= 2.5;
    const absorb = Math.min(e.shields, dmg * 0.8);
    e.shields -= absorb; e.energy -= dmg - absorb;
    if (by === "player") {
      A.sfx("hitEnemy");
      this.w.spark(e.pos.clone().add(_v1.subVectors(this.player.position, e.pos).setLength(e.r * 0.8)), absorb > 0 ? 0x80c0ff : 0xffa040, e.r * 0.6);
      if (e.role === "police") this.crime(8, "Attacking the police");
      else if (e.role === "trader" && !e.hostile) this.crime(2, null);
      if (e.role !== "rock" && e.role !== "cargo" && e.role !== "missile") { e.aggro = "player"; if (e.role !== "trader" || e.def.missiles > 2) e.hostile = true; }
      this.nearStationAlert(e);
    } else if (by && by !== "player" && by.alive) e.aggro = by;
    if (e.energy <= 0) this.destroyEnt(e, by, laser);
  }
  crime(n, text) {
    const c = G.cmdr, before = c.legal;
    c.legal = Math.min(255, c.legal + n);
    if (before < 50 && c.legal >= 50) { msg("You are now a FUGITIVE", "#ff4040", 4); for (const e of this.ents) if (e.role === "police" || e.role === "hunter") { e.hostile = true; e.target = "player"; } }
    else if (before === 0 && c.legal > 0) msg("Legal status: offender", "#ff9040", 3);
    else if (text && this.p.legalT <= 0) msg(text, "#ff9040", 2);
    this.p.legalT = 3;
  }
  nearStationAlert(e) {
    if (this.player.position.distanceTo(this.S.station.position) > 25000 || e.role === "pirate" || e.role === "alien" || e.role === "rock") return;
    if (!this.stationAngry) {
      this.stationAngry = true; msg("Station security alerted!", "#ff4040", 4); A.sfx("alarm");
      const ax = this.S.stationAxis, out = this.encounter("police", this.S.station.position.clone().addScaledVector(ax, 900), 3);
      for (const w of out) { w.hostile = true; w.target = "player"; w.quat.setFromRotationMatrix(_m.lookAt(w.pos, this.player.position, UPV)); }
    }
  }
  stationHit() {
    this.crime(16, "Firing at the station!");
    this.stationAngry = false; this.nearStationAlert({ role: "station", pos: this.S.station.position });
  }
  destroyEnt(e, by, laser) {
    if (!e.alive) return;
    this.removeEnt(e);
    const big = e.def.size > 60;
    const d = this.player.position.distanceTo(e.pos);
    if (e.role === "missile") { this.w.explode(e.pos, 25, {}); A.sfx("explodeS"); return; }
    this.w.explode(e.pos, e.def.size * (e.role === "cargo" ? 0.8 : 1.6), { shake: Math.max(0, 14 - d / 400) * (big ? 2 : 1), debrisColor: e.role === "rock" ? 0x6a6058 : 0x9a9aa0 });
    if (big) setTimeout(() => { if (this.mode === "fly") this.w.explode(e.pos.clone().add(rv(e.r)), e.def.size, {}); }, 350);
    A.sfx(big || e.def.size > 45 ? "explodeL" : "explodeS");
    // debris: rocks break apart, ships drop canisters
    if (e.role === "rock") {
      if (e.type === "asteroid" && laser && laser.mining) for (let i = 0; i < U.randi(2, 3); i++) this.spawn("boulder", e.pos.clone().add(rv(e.r)), {});
      else if (e.type === "boulder" && laser && laser.mining) this.dropCanister(e.pos, Math.random() < 0.15 ? "gems" : Math.random() < 0.3 ? "radio" : "minerals", U.randi(1, 2));
    } else if (e.role !== "cargo") {
      const n = e.role === "alien" ? (e.type === "xyrrid" ? 3 : Math.random() < 0.3 ? 1 : 0) : Math.random() < 0.6 ? U.randi(0, Math.min(3, 1 + Math.floor(e.def.cargo / 20))) : 0;
      for (let i = 0; i < n; i++) this.dropCanister(e.pos, e.role === "alien" ? "alien" : e.role === "pirate" ? U.pick(["narc", "arms", "gold", "lux", "comp"]) : U.pick(["food", "textiles", "mach", "comp", "spirits", "alloys", "lux"]), 1);
      if (e.role === "trader" && Math.random() < 0.3) this.spawn("pod", e.pos.clone().add(rv(e.r)), { role: "cargo", good: "droids", drift: rv(60) });
    }
    if (by === "player") {
      const c = G.cmdr;
      if (e.role !== "cargo") {
        const before = rankOf(c.killPts);
        c.killPts += e.def.kill; c.kills += e.def.kill >= 0.5 ? 1 : 0;
        addScore(e.def.kill * 100 + e.bounty);
        if (e.bounty > 0) { earn(e.bounty); msg(`Bounty: ${e.bounty} Cr`, "#60ff90", 3); A.sfx("sell"); }
        if (e.role === "police") this.crime(64, null);
        if (e.role === "trader") this.crime(16, null);
        if (rankOf(c.killPts) !== before) { msg(`Well done, Commander! Rank: ${rankOf(c.killPts)}`, "#ffd060", 5); A.jingle("rank"); setTimeout(() => this.playSpaceSong(), 2500); }
      }
    }
  }
  dropCanister(pos, good, qty) {
    this.spawn("canister", pos.clone().add(rv(30)), { role: "cargo", good, qty, drift: rv(70) });
  }

  /* ---------- NPC behaviour ---------- */
  updateEnts(dt) {
    const pp = this.player.position;
    for (const e of this.ents) {
      if (!e.alive) continue;
      e.t += dt; e.flash = Math.max(0, e.flash - dt);
      if (e.role === "rock" || e.role === "cargo") {
        e.pos.addScaledVector(e.drift, dt);
        e.mesh.rotation.x += e.spin.x * dt; e.mesh.rotation.y += e.spin.y * dt; e.mesh.rotation.z += e.spin.z * dt;
      } else if (e.role === "missile") this.missileAI(e, dt);
      else this.shipAI(e, dt);
      // engine glow and lights
      const ud = e.mesh.userData;
      if (ud.engines) for (const s of ud.engines) s.material.opacity = 0.25 + 0.75 * U.clamp(e.speed / e.def.speed, 0, 1);
      if (ud.navLights) ud.navLights.forEach((l, i) => { l.material.opacity = Math.sin(this.time * 3 + i) > 0.5 ? 1 : 0.15; });
      if (ud.siren) ud.siren.material.color.setHex(Math.sin(this.time * 12) > 0 ? 0x4080ff : 0xff3030);
      if (ud.core) ud.core.rotation.y += dt * 2;
      // despawn far away things
      if (e.pos.distanceTo(pp) > 60000 && !this.dead) this.removeEnt(e);
    }
    this.ents = this.ents.filter((e) => e.alive);
  }
  targetOf(e) {
    if (e.target === "player") return this.p.alive ? { pos: this.player.position, vel: fwdOf(this.player).multiplyScalar(this.p.speed), r: shipDef().size * 0.5, isPlayer: true } : null;
    if (e.target && e.target.alive) return { pos: e.target.pos, vel: fwdOf(e.target.mesh).multiplyScalar(e.target.speed), r: e.target.r, ent: e.target };
    return null;
  }
  chooseTarget(e) {
    const c = G.cmdr, pp = this.player.position, dP = e.pos.distanceTo(pp);
    if (e.aggro) { e.target = e.aggro; e.hostile = true; return; }
    const near = (role, range) => { let b = null, bd = range; for (const o of this.ents) if (o.alive && o !== e && o.role === role) { const d = o.pos.distanceTo(e.pos); if (d < bd) { bd = d; b = o; } } return b; };
    if (e.role === "pirate") e.target = e.hostile ? "player" : near("trader", 9000);
    else if (e.role === "police") e.target = (c.legal >= 50 && dP < 25000) || e.hostile ? "player" : near("pirate", 14000) || near("alien", 14000);
    else if (e.role === "hunter") e.target = c.legal >= 50 ? "player" : null;
    else if (e.role === "alien") e.target = "player";
    else e.target = null;
  }
  shipAI(e, dt) {
    const fwd = fwdOf(e.mesh);
    e.retarget = (e.retarget ?? 0) - dt;
    if (e.retarget <= 0) { e.retarget = 1; this.chooseTarget(e); }
    const T = this.targetOf(e);
    e.cool -= dt;
    let wantDir = null, wantSpeed = e.def.speed * 0.6;
    if (e.state !== "flee" && e.energy < e.eMax * 0.25 && (e.role === "pirate" || e.role === "trader" || e.role === "hunter") && Math.random() < dt * 0.6) { e.state = "flee"; e.t = 0; }
    if (e.state === "flee") {
      const from = T ? T.pos : this.player.position;
      wantDir = _v2.subVectors(e.pos, from).normalize(); wantSpeed = e.def.speed;
      if (e.t > 12) e.state = "cruise";
    } else if (T) {
      const to = _v2.subVectors(T.pos, e.pos), d = to.length();
      if (e.state === "break") {
        wantDir = e.breakDir; wantSpeed = e.def.speed;
        if (e.t > e.breakT) e.state = "attack";
      } else {
        e.state = "attack";
        // aim with some lead depending on the pilot's skill
        const lead = _v3.copy(T.pos).addScaledVector(T.vel, (d / 2200) * e.skill);
        wantDir = lead.sub(e.pos).normalize();
        wantSpeed = d > 2500 ? e.def.speed : e.def.speed * (0.45 + 0.4 * e.skill);
        const ang = fwd.angleTo(wantDir);
        if (ang < 0.12 && d < 4200 && e.cool <= 0) this.npcShoot(e, T, ang, d);
        if (d < e.r + T.r + 220) { e.state = "break"; e.t = 0; e.breakT = U.rand(1.2, 2.6); e.breakDir = to.clone().negate().normalize().add(rv(1.4)).normalize(); }
        if (e.missiles > 0 && d > 1500 && d < 7000 && Math.random() < dt * 0.05 * (e.role === "police" ? 0.5 : 1)) this.npcMissile(e, T.isPlayer ? "player" : T.ent);
        if (e.type === "xyrrid" && e.t > 0) { e.spawnT = (e.spawnT ?? 6) - dt; if (e.spawnT <= 0 && this.ents.filter((o) => o.type === "drone").length < 5) { e.spawnT = 9; this.spawn("drone", e.pos.clone().add(rv(e.r)), { quat: e.quat.clone(), role: "alien", hostile: true, target: "player", skill: 0.5 }); } }
      }
      // defensive ECM against incoming missiles
      if (e.ecm && Math.random() < dt * 2) for (const m of this.ents) if (m.role === "missile" && m.target === e && m.pos.distanceTo(e.pos) < 2500) { this.ecm(false); e.ecm = Math.random() < 0.5; break; }
    } else {
      // peaceful flying: traders head for the station, police patrol it
      const st = this.S.station.position;
      if (e.role === "trader" && e.goStation) {
        const ap = _v3.copy(st).addScaledVector(this.S.stationAxis, 2500);
        wantDir = _v2.subVectors(ap, e.pos).normalize(); wantSpeed = e.def.speed * 0.7;
        if (e.pos.distanceTo(ap) < 600) { this.removeEnt(e); return; }
      } else if (e.role === "police" || e.role === "hunter" || e.role === "pirate") {
        if (!e.dest || e.pos.distanceTo(e.dest) < 800) e.dest = (e.role === "police" ? st.clone().addScaledVector(this.S.stationAxis, 4000) : e.pos.clone()).add(rv(6000));
        wantDir = _v2.subVectors(e.dest, e.pos).normalize();
      } else { wantDir = fwd; }
    }
    if (wantDir) this.steer(e, wantDir, dt);
    e.speed += (wantSpeed - e.speed) * Math.min(1, dt * 1.5);
    e.pos.addScaledVector(fwdOf(e.mesh), e.speed * dt);
  }
  steer(e, dir, dt) {
    _q.setFromRotationMatrix(_m.lookAt(_v1.set(0, 0, 0), dir, UPV));
    e.quat.rotateTowards(_q, e.def.pitch * (0.8 + e.skill * 0.6) * dt);
  }
  npcShoot(e, T, ang, d) {
    e.cool = U.rand(0.35, 0.8) * (1.4 - e.skill * 0.6);
    const fwd = fwdOf(e.mesh), from = e.pos.clone().addScaledVector(fwd, e.r);
    const acc = 0.02 + e.skill * 0.05; // angular tolerance
    const hit = ang < acc + T.r / Math.max(200, d) && Math.random() < 0.55 + e.skill * 0.35;
    const aimAt = T.pos.clone().add(hit ? rv(T.r * 0.3) : rv(T.r * 3 + 40));
    const color = e.role === "alien" ? 0x60ff90 : e.role === "police" ? 0x60a0ff : 0xff4040;
    this.w.beam(from, aimAt, color, e.def.size > 60 ? 2.4 : 1.3, 0.1, hit);
    if (d < 5000) A.sfx("enemyLaser");
    if (!hit) return;
    const dmg = NPC_LASER[e.type] || 5;
    if (T.isPlayer) this.hurt(dmg, e.pos);
    else this.damageEnt(T.ent, dmg, e, null);
  }
  missileAI(e, dt) {
    e.life -= dt;
    const T = this.targetOf(e);
    if (!T || e.life <= 0) { this.destroyEnt(e, null); return; }
    const to = _v2.subVectors(T.pos, e.pos), d = to.length();
    this.steer(e, to.normalize(), dt * 2.6);
    e.speed = Math.min(d < 600 ? 420 : e.def.speed, e.speed + 400 * dt);
    e.pos.addScaledVector(fwdOf(e.mesh), e.speed * dt);
    if (d < T.r + 60) {
      this.removeEnt(e);
      this.w.explode(e.pos, 45, { shake: T.isPlayer ? 18 : 4 });
      A.sfx("explodeS");
      if (T.isPlayer) this.hurt(75, e.pos);
      else this.damageEnt(T.ent, 260, e.owner === "player" ? "player" : e.owner, null);
    }
  }

  /* ---------- collisions, scooping and docking ---------- */
  collisions(dt) {
    const p = this.p, pl = this.player, pp = pl.position, pr = shipDef().size * 0.45;
    for (const e of this.ents) {
      if (!e.alive || e.role === "missile") continue;
      const d = e.pos.distanceTo(pp);
      if (d > e.r + pr) continue;
      if (e.role === "cargo") {
        if (G.cmdr.equip.scoop && cargoFree() > 0 && fwdOf(pl).dot(_v1.subVectors(e.pos, pp)) > -5) {
          const g = GOODS.find((x) => x.id === e.good);
          G.cmdr.cargo[e.good] = (G.cmdr.cargo[e.good] || 0) + e.qty;
          if (!G.cmdr.cost[e.good]) G.cmdr.cost[e.good] = 0;
          msg(`Scooped: ${e.qty} ${g.unit} ${g.name}`, "#60ff90", 2.5); A.sfx("scoop");
          this.removeEnt(e);
          if (g.legal && G.cmdr.legal < 50) this.crime(0, null);
        } else { this.destroyEnt(e, null); this.hurt(10, e.pos); }
        continue;
      }
      // ship or rock: bounce, both take damage
      const n = _v1.subVectors(pp, e.pos).normalize();
      pp.copy(e.pos).addScaledVector(n, e.r + pr + 2);
      const dmg = 8 + p.speed * 0.08;
      this.hurt(dmg, e.pos);
      this.damageEnt(e, dmg * 1.5, e.role === "trader" || e.role === "police" ? null : "player", null);
      p.speed *= 0.4;
      A.sfx("hitHull");
    }
    this.stationCollide(dt);
  }
  stationCollide(dt) {
    const p = this.p, S = this.S, st = S.station, pl = this.player;
    if (pl.position.distanceTo(st.position) > 2500) return;
    const L = st.worldToLocal(pl.position.clone());
    const rxy = Math.hypot(L.x, L.y);
    // docking slot on the hub face
    if (L.z > 250 && L.z < 300 && Math.abs(L.x) < 78 && Math.abs(L.y) < 32) {
      const fwdL = fwdOf(pl).applyQuaternion(st.quaternion.clone().invert());
      const rightL = new THREE.Vector3(1, 0, 0).applyQuaternion(pl.quaternion).applyQuaternion(st.quaternion.clone().invert());
      const aligned = fwdL.z < -0.88 && Math.abs(rightL.y) < 0.5;
      if (aligned && (p.speed < p.max * 0.75 || p.dc)) { this.docked(); return; }
      if (!aligned) { this.bounceStation(L, "Misaligned with the docking slot!"); return; }
    }
    if (p.dc) return;
    // hub
    if (Math.abs(L.z) < 290 && rxy < 270) { this.bounceStation(L, "Collision with the station!"); return; }
    // ring
    const tube = Math.hypot(rxy - 900, L.z);
    if (tube < 80 + 15) this.bounceStation(L, "Collision with the station!");
  }
  bounceStation(L, text) {
    const p = this.p, st = this.S.station;
    const out = L.clone(); out.z += 40; // push away from the station
    const n = out.normalize();
    this.player.position.copy(st.localToWorld(L.clone().addScaledVector(n, 40)));
    this.hurt(20 + p.speed * 0.25, st.position);
    p.speed = 0;
    this.player.quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0.3, 0, 0)));
    msg(text, "#ff6060", 2.5);
    A.sfx("hitHull");
  }
  docked() {
    A.sfx("dock");
    this.p.jump = false; this.p.dc = null;
    this.mode = "docked";
    A.setEngine(-1);
    this.clearEnts();
    this.w.setTunnel(0, 0);
    if (this.cb.dock) this.cb.dock();
  }
  toggleDockComputer() {
    const p = this.p;
    if (p.dc) { p.dc = null; msg("Docking computer off", "#9ad8ff"); this.playSpaceSong(); return; }
    if (!G.cmdr.equip.dock) { msg("No docking computer fitted", "#ff9040", 2); A.sfx("deny"); return; }
    if (this.player.position.distanceTo(this.S.station.position) > 120000) { msg("Station out of range", "#ff9040", 2); return; }
    p.dc = { phase: 0 }; p.jump = false;
    msg("Docking computer engaged", "#60ff90", 3); A.playSong("waltz");
  }
  dockComputer(dt) {
    const p = this.p, S = this.S, pl = this.player, st = S.station, ax = S.stationAxis;
    const ap = st.position.clone().addScaledVector(ax, 3200);
    if (p.dc.phase === 0) {
      const to = _v2.subVectors(ap, pl.position), d = to.length();
      _q.setFromRotationMatrix(_m.lookAt(_v1.set(0, 0, 0), to.normalize(), new THREE.Vector3(0, 1, 0).applyQuaternion(pl.quaternion)));
      pl.quaternion.rotateTowards(_q, 1.2 * dt);
      const facing = fwdOf(pl).dot(to) > 0.95;
      const fast = d > 16000 && facing && !this.ents.some((e) => e.alive && e.role !== "rock" && e.role !== "cargo" && e.role !== "missile" && e.pos.distanceTo(pl.position) < MASSLOCK && e.hostile);
      p.speed = facing ? Math.min(p.max, d * 0.4) : p.max * 0.25;
      if (fast) pl.position.addScaledVector(fwdOf(pl), Math.min(d - 12000, p.max * JUMP_MULT) * dt);
      if (d < 250) p.dc.phase = 1;
    } else {
      // line up with the slot and roll with the station, then glide in
      const target = st.quaternion.clone(); // facing into the slot, rolled with the station
      pl.quaternion.rotateTowards(target, 1.6 * dt);
      const L = st.worldToLocal(pl.position.clone());
      L.x *= 1 - Math.min(1, dt * 2); L.y *= 1 - Math.min(1, dt * 2);
      pl.position.copy(st.localToWorld(L));
      p.speed = pl.quaternion.angleTo(target) < 0.08 ? Math.min(p.max * 0.6, 240) : 20;
    }
  }

  /* ---------- encounters over time ---------- */
  spawner(dt) {
    const p = this.p, s = sys(), pp = this.player.position;
    this.encT -= dt * (p.jump ? 2.5 : 1);
    if (this.encT > 0) return;
    this.encT = U.rand(25, 50) * (1.6 - 0.6 * this.threat());
    const nearSt = pp.distanceTo(this.S.station.position) < 30000;
    const ahead = pp.clone().addScaledVector(fwdOf(this.player), p.jump ? 9000 : 8000).add(rv(3000));
    const r = Math.random();
    if (nearSt) { if (r < 0.5) this.encounter("traders", ahead, U.randi(1, 2)); else if (r < 0.75) this.encounter("police", ahead, 1); else if (G.cmdr.legal >= 50) this.encounter("hunters", ahead, 1); }
    else {
      const pir = (0.12 + (7 - s.gov) * 0.06) * (0.4 + 0.6 * this.threat());
      if (r < pir) { this.encounter("pirates", ahead, this.pirateGroup(s)); if (p.jump) msg("Interdiction! Hostile ships nearby", "#ff6060"); }
      else if (r < pir + 0.25) this.encounter("traders", ahead, U.randi(1, 2));
      else if (r < pir + 0.4) this.encounter("rocks", ahead, U.randi(3, 6));
      else if (r < pir + 0.45 && G.cmdr.legal >= 50) this.encounter("hunters", ahead, U.randi(1, 2));
      else if (r < pir + 0.47 && G.cmdr.killPts > 40) this.encounter("aliens", ahead, 1);
    }
  }

  /* ---------- hyperspace ---------- */
  startHyper(galactic) {
    const c = G.cmdr, p = this.p;
    if (p.hyper) { p.hyper = null; msg("Hyperspace cancelled", "#9ad8ff"); return; }
    if (galactic) {
      if (!c.equip.galactic) { msg("No galactic hyperdrive fitted", "#ff9040", 2); A.sfx("deny"); return; }
      p.hyper = { t: 3.99, galactic: true }; A.sfx("hyperCharge"); msg("Galactic hyperdrive charging", "#ffd060"); return;
    }
    if (c.target < 0 || c.target === c.si) { msg("Select a destination on the star map first (Tab)", "#ff9040", 3); A.sfx("deny"); return; }
    const t = galaxy(c.gi)[c.target], dd = dist(sys(), t);
    if (dd > fuelMax()) { msg("Destination out of range", "#ff9040", 2); A.sfx("deny"); return; }
    if (dd > c.fuel) { msg("Not enough fuel", "#ff9040", 2); A.sfx("deny"); return; }
    p.hyper = { t: 3.99, galactic: false, target: c.target }; A.sfx("hyperCharge");
    msg(`Hyperspace to ${t.name}`, "#ffd060");
  }
  doHyper() {
    const c = G.cmdr, p = this.p, h = p.hyper;
    p.hyper = null; p.jump = false; p.dc = null;
    if (h.galactic) { c.equip.galactic = false; c.gi = (c.gi + 1) % 8; }
    else { const t = galaxy(c.gi)[h.target]; c.fuel = Math.max(0, c.fuel - dist(sys(), t)); c.si = h.target; c.target = -1; }
    c.legal = Math.max(0, Math.floor(c.legal * 0.9) - (c.legal < 50 ? 2 : 0));
    const key = `${c.gi}:${c.si}`;
    if (!c.visited.includes(key)) { c.visited.push(key); addScore(25); }
    this.misjump = !h.galactic && Math.random() < 0.025;
    this.mode = "jump";
    this.jumpFx = { t: 0, ready: false };
    this.clearEnts();
    this.w.sysGroup.visible = false; this.w.skyGroup.visible = false;
    A.sfx("hyper"); A.stopMusic(); A.setEngine(0.2, true);
    this.stationAngry = false;
    if (this.cb.hyper) this.cb.hyper(() => { this.jumpFx.ready = true; });
  }
  updateHyperTunnel(dt) {
    const j = this.jumpFx; j.t += dt;
    const amp = Math.min(1, j.t * 2) * (j.ready && j.t > 2.6 ? Math.max(0, 1 - (j.t - 2.6) * 2) : 1);
    this.w.setTunnel(1.4 * amp + 0.01, j.t * 1.5, 0x6a8aff);
    this.w.updateDust(this.player.position, fwdOf(this.player).multiplyScalar(6000));
    if (j.ready && j.t > 3.0) { this.w.setTunnel(0, 0); this.begin(this.misjump ? "misjump" : "hyper"); if (this.cb.arrived) this.cb.arrived(); }
  }

  /* ---------- information for the HUD ---------- */
  scanner() {
    const pl = this.player, inv = pl.quaternion.clone().invert(), out = [];
    for (const e of this.ents) {
      if (!e.alive) continue;
      const rel = _v1.subVectors(e.pos, pl.position);
      if (rel.length() > SCANNER) continue;
      const l = rel.clone().applyQuaternion(inv);
      out.push({ e, x: l.x, y: l.y, z: l.z });
    }
    const st = _v1.subVectors(this.S.station.position, pl.position);
    if (st.length() < SCANNER * 1.5) { const l = st.clone().applyQuaternion(inv); out.push({ station: true, x: l.x, y: l.y, z: l.z }); }
    return out;
  }
  // direction to the station (or planet when far) in camera space for the compass
  compass() {
    const S = this.S, pl = this.player, inv = pl.quaternion.clone().invert();
    const toSt = _v1.subVectors(S.station.position, pl.position);
    const target = toSt.length() < S.R * 3 ? S.station.position : new THREE.Vector3();
    const l = target.clone().sub(pl.position).applyQuaternion(inv).normalize();
    return { x: l.x, y: l.y, z: l.z, station: target !== undefined && toSt.length() < S.R * 3 };
  }
}

export function fwdOf(o) { return FWD.clone().applyQuaternion(o.quaternion); }
export function rv(s) { return new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(2 * s); }
