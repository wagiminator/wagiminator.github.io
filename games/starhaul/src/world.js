/* STARHAUL: the 3D world – renderer with bloom, star systems (planet, clouds, atmosphere, rings, moons, sun, nebula sky,
   station), space dust, laser beams, explosions and the hyperspace tunnel. */
import * as THREE from "three";
import { EffectComposer } from "../lib/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "../lib/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "../lib/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "../lib/addons/postprocessing/OutputPass.js";
import { RoomEnvironment } from "../lib/addons/environments/RoomEnvironment.js";
import { buildStation, glowSprite, glowTexture } from "./ships.js";
import { PLANET_TYPES } from "./galaxy.js";
import WORKER_SRC from "./planetworker.wjs";
const { U } = window.XA;

const SUN_DIST = 450000;

/* ---------- atmosphere shader (works with the logarithmic depth buffer) ---------- */
function atmoMaterial(color, power, strength, side) {
  return new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color(color) }, sunDir: { value: new THREE.Vector3(1, 0, 0) }, power: { value: power }, strength: { value: strength } },
    vertexShader: `
      #include <common>
      #include <logdepthbuf_pars_vertex>
      varying vec3 vN; varying vec3 vV; varying vec3 vWN;
      void main() {
        vN = normalize(normalMatrix * normal);
        vWN = normalize(mat3(modelMatrix) * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
        #include <logdepthbuf_vertex>
      }`,
    fragmentShader: `
      #include <logdepthbuf_pars_fragment>
      uniform vec3 color; uniform vec3 sunDir; uniform float power; uniform float strength;
      varying vec3 vN; varying vec3 vV; varying vec3 vWN;
      void main() {
        #include <logdepthbuf_fragment>
        float f = 1.0 - abs(dot(vN, vV));
        float rim = pow(f, power) * strength;
        float lit = 0.12 + 0.88 * smoothstep(-0.25, 0.6, dot(vWN, sunDir));
        gl_FragColor = vec4(color * rim * lit, rim * lit);
      }`,
    side, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
}

function tunnelMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { t: { value: 0 }, amp: { value: 0 }, col: { value: new THREE.Color(0x60a0ff) } },
    vertexShader: `
      #include <common>
      #include <logdepthbuf_pars_vertex>
      varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      #include <logdepthbuf_vertex>
      }`,
    fragmentShader: `
      #include <logdepthbuf_pars_fragment>
      uniform float t; uniform float amp; uniform vec3 col; varying vec2 vUv;
      float h(float n) { return fract(sin(n) * 43758.5453); }
      void main() {
        #include <logdepthbuf_fragment>
        float a = floor(vUv.x * 90.0);
        float s = fract(vUv.y * (1.0 + h(a) * 2.0) * 3.0 + t * (1.5 + h(a + 7.0) * 3.0));
        float streak = smoothstep(0.0, 0.05, s) * smoothstep(0.35, 0.05, s) * step(0.35, h(a + 3.0));
        float rings = pow(abs(sin(vUv.y * 40.0 + t * 30.0)), 30.0) * 0.6;
        float fade = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.6, vUv.y);
        vec3 c = mix(col, vec3(1.0), streak * 0.6) * (streak + rings * 0.5 + 0.08);
        gl_FragColor = vec4(c * amp * fade, 1.0);
      }`,
    side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false,
  });
}

export class World {
  constructor(canvas) {
    const r = (this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: true, powerPreference: "high-performance" }));
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    r.outputColorSpace = THREE.SRGBColorSpace;
    this.scene = new THREE.Scene();
    // a soft studio environment gives the metal hulls something to reflect
    const pm = new THREE.PMREMGenerator(r);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.45;
    this.camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.5, 4e6);
    this.scene.add(this.camera);
    this.sun = new THREE.DirectionalLight(0xffffff, 2.7);
    this.scene.add(this.sun, this.sun.target);
    this.stationLight = new THREE.PointLight(0xa0c0ff, 0, 7000, 1.0);
    this.scene.add(this.stationLight);
    this.ambient = new THREE.AmbientLight(0x4a5470, 0.8);
    this.scene.add(this.ambient);
    this.composer = new EffectComposer(r);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.75, 0.5, 0.92);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.sysGroup = new THREE.Group(); this.scene.add(this.sysGroup);
    this.skyGroup = new THREE.Group(); this.scene.add(this.skyGroup);
    this.fx = []; this.beams = [];
    this.jobs = new Map(); this.jobId = 0;
    const onDone = (e) => { const j = this.jobs.get(e.data.id); if (j) { this.jobs.delete(e.data.id); j(e.data); } };
    // the texture painter runs in a worker made from embedded source (works from file:// too);
    // if workers are not available it runs on the main thread instead
    try {
      this.worker = new Worker(URL.createObjectURL(new Blob([WORKER_SRC], { type: "text/javascript" })));
      this.worker.onmessage = onDone;
      this.worker.onerror = () => this.useLocalPainter(onDone);
    } catch (e) { this.useLocalPainter(onDone); }
    this.makeStars();
    this.makeDust();
    this.makeTunnel();
    this.shake = 0;
    // a fixed pool of flash lights (adding lights later would force shader recompiles)
    this.flashLights = [];
    for (let i = 0; i < 3; i++) { const l = new THREE.PointLight(0xffa050, 0, 1, 1.5); l.userData.busy = false; this.scene.add(l); this.flashLights.push(l); }
    this.quality = XA.Store.get("quality", 1);
  }
  useLocalPainter(onDone) {
    if (this.local) return;
    const scope = { postMessage: (data) => setTimeout(() => onDone({ data }), 0) };
    new Function("self", WORKER_SRC)(scope);
    this.local = scope;
    this.worker = { postMessage: (data) => setTimeout(() => scope.onmessage({ data }), 0) };
    // jobs sent to the failed worker are repeated
    for (const j of this.jobs.values()) if (j.msg) this.worker.postMessage(j.msg);
  }
  job(o) {
    return new Promise((res) => {
      const id = ++this.jobId, msg = Object.assign({ id }, o);
      res.msg = msg; this.jobs.set(id, res);
      this.worker.postMessage(msg);
    });
  }

  resize(w, h, dpr) {
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(w, h);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }

  makeStars() {
    const r = U.rng(42);
    for (const [n, size] of [[5000, 1.6], [1200, 2.6], [220, 4]]) {
      const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const v = new THREE.Vector3(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).normalize().multiplyScalar(1.4e6);
        if (r() < 0.5) v.y *= 0.35; // denser along a band
        v.normalize().multiplyScalar(1.4e6);
        pos.set([v.x, v.y, v.z], i * 3);
        const t = r(), c = t < 0.2 ? [1, 0.75, 0.6] : t < 0.4 ? [0.7, 0.8, 1] : [1, 1, 1], b = 0.5 + r() * 0.5;
        col.set([c[0] * b, c[1] * b, c[2] * b], i * 3);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3));
      const p = new THREE.Points(g, new THREE.PointsMaterial({ size, sizeAttenuation: false, vertexColors: true, depthWrite: false }));
      p.renderOrder = -9; p.frustumCulled = false;
      this.skyGroup.add(p);
    }
    this.nebula = new THREE.Mesh(new THREE.SphereGeometry(1.5e6, 48, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide, depthWrite: false, transparent: true, opacity: 1 }));
    this.nebula.renderOrder = -10; this.nebula.frustumCulled = false;
    this.skyGroup.add(this.nebula);
  }

  makeDust() {
    const n = 500;
    this.dustPts = new Float32Array(n * 3);
    for (let i = 0; i < n * 3; i++) this.dustPts[i] = (Math.random() - 0.5) * 1600;
    const g = new THREE.BufferGeometry();
    this.dustPos = new Float32Array(n * 6);
    g.setAttribute("position", new THREE.BufferAttribute(this.dustPos, 3));
    this.dust = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x9ab0d0, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.dust.frustumCulled = false;
    this.scene.add(this.dust);
  }
  updateDust(camPos, vel) {
    const n = this.dustPts.length / 3, L = 800, sp = vel.length();
    const k = Math.min(0.06, 40 / Math.max(1, sp)), stretch = vel.clone().multiplyScalar(-k * Math.min(1, sp / 100) - 0.002);
    for (let i = 0; i < n; i++) {
      let x = this.dustPts[i * 3], y = this.dustPts[i * 3 + 1], z = this.dustPts[i * 3 + 2];
      x = ((x - camPos.x + L) % (2 * L) + 2 * L) % (2 * L) - L + camPos.x;
      y = ((y - camPos.y + L) % (2 * L) + 2 * L) % (2 * L) - L + camPos.y;
      z = ((z - camPos.z + L) % (2 * L) + 2 * L) % (2 * L) - L + camPos.z;
      this.dustPts[i * 3] = x; this.dustPts[i * 3 + 1] = y; this.dustPts[i * 3 + 2] = z;
      this.dustPos.set([x, y, z, x + stretch.x - 0.5, y + stretch.y, z + stretch.z], i * 6);
    }
    this.dust.geometry.attributes.position.needsUpdate = true;
    this.dust.material.opacity = U.clamp(sp / 150, 0.15, 0.6);
  }

  makeTunnel() {
    this.tunnel = new THREE.Mesh(new THREE.CylinderGeometry(70, 70, 6000, 48, 1, true), tunnelMaterial());
    this.tunnel.rotation.x = Math.PI / 2; this.tunnel.position.z = -1500; this.tunnel.visible = false; this.tunnel.renderOrder = 50;
    this.camera.add(this.tunnel);
  }
  setTunnel(amp, t, color) {
    const u = this.tunnel.material.uniforms;
    u.amp.value = amp; u.t.value = t; if (color) u.col.value.set(color);
    this.tunnel.visible = amp > 0.01;
  }

  /* ---------- star systems ---------- */
  clearSystem() {
    for (const o of [...this.sysGroup.children]) { this.sysGroup.remove(o); o.traverse((c) => { if (c.geometry) c.geometry.dispose(); }); }
    this.sys = null; this.planet = null; this.station = null;
  }
  async buildSystem(sys, opts = {}) {
    this.clearSystem();
    const r = U.rng(sys.seed), T = PLANET_TYPES[sys.ptype];
    const R = sys.radius * 2.5;
    const sunDir = new THREE.Vector3(r() * 2 - 1, (r() - 0.5) * 0.6, r() * 2 - 1).normalize();
    const S = { sys, R, sunDir, sunPos: sunDir.clone().multiplyScalar(SUN_DIST), planetPos: new THREE.Vector3(0, 0, 0) };
    this.sys = S;
    // textures from the worker
    const res = opts.lowres ? 0.5 : 1;
    const [pt, sky] = await Promise.all([
      this.job({ kind: "planet", seed: sys.seed, w: 1024 * res, h: 512 * res, pal: T.pal, clouds: T.clouds, ice: sys.ptype === "terran" || sys.ptype === "ocean" || sys.ptype === "jungle", lights: sys.econ <= 3 && T.clouds > 0 ? 1.4 - sys.econ * 0.3 : 0, lava: !!T.glow, sea: 0.47 }),
      this.job({ kind: "nebula", seed: sys.seed + 5, w: 1024 * res, h: 512 * res, c1: hsl(sys.nebula[0], 0.7, 0.45), c2: hsl(sys.nebula[1], 0.6, 0.35) }),
    ]);
    if (this.sys !== S) return S; // replaced meanwhile
    const tex = (buf, w, h) => { const t = new THREE.DataTexture(buf, w, h, THREE.RGBAFormat); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.flipY = false; t.needsUpdate = true; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.anisotropy = 8; return t; };
    const colorT = tex(pt.color, pt.w, pt.h), nightT = tex(pt.night, pt.w, pt.h);
    // planet
    const pg = new THREE.SphereGeometry(R, 128, 64);
    flipV(pg);
    const planet = new THREE.Mesh(pg, new THREE.MeshStandardMaterial({ map: colorT, bumpMap: colorT, bumpScale: 2.5, roughness: 0.85, metalness: 0, emissiveMap: nightT, emissive: 0xffffff, emissiveIntensity: T.glow ? 1.4 : 0.9, envMapIntensity: 0 }));
    planet.rotation.z = 0.3;
    this.sysGroup.add(planet);
    S.planet = planet;
    if (T.clouds > 0) {
      const ct = tex(pt.clouds, pt.cw, pt.ch);
      const cg = new THREE.SphereGeometry(R * 1.012, 96, 48); flipV(cg);
      const clouds = new THREE.Mesh(cg, new THREE.MeshStandardMaterial({ map: ct, transparent: true, depthWrite: false, roughness: 1, metalness: 0, envMapIntensity: 0 }));
      clouds.rotation.z = 0.3; this.sysGroup.add(clouds); S.clouds = clouds;
    }
    S.atmo = [atmoMaterial(T.atmo, 3.0, 1.3, THREE.FrontSide), atmoMaterial(T.atmo, 2.0, 1.6, THREE.BackSide)];
    const a1 = new THREE.Mesh(new THREE.SphereGeometry(R * 1.02, 96, 48), S.atmo[0]);
    const a2 = new THREE.Mesh(new THREE.SphereGeometry(R * 1.12, 96, 48), S.atmo[1]);
    // the halo shader needs an inverted rim for the back side
    S.atmo[1].fragmentShader = S.atmo[1].fragmentShader.replace("float f = 1.0 - abs(dot(vN, vV));", "float f = abs(dot(vN, vV)); f = smoothstep(0.0, 1.0, f) * (1.0 - smoothstep(0.55, 1.0, f));");
    this.sysGroup.add(a1, a2);
    for (const m of S.atmo) m.uniforms.sunDir.value.copy(sunDir);
    // rings
    if (sys.rings && sys.ptype !== "terran") {
      const rg = new THREE.RingGeometry(R * 1.45, R * 2.4, 160, 1);
      const pos = rg.attributes.position, uv = rg.attributes.uv;
      for (let i = 0; i < pos.count; i++) { const d = Math.hypot(pos.getX(i), pos.getY(i)); uv.setXY(i, (d - R * 1.45) / (R * 0.95), 0.5); }
      const c = document.createElement("canvas"); c.width = 512; c.height = 4; const g = c.getContext("2d"), rr = U.rng(sys.seed + 3);
      for (let x = 0; x < 512; x++) { const a = (0.2 + rr() * 0.6) * (0.5 + 0.5 * Math.sin(x * 0.07 + rr())); g.fillStyle = `rgba(${200 + rr() * 50},${180 + rr() * 50},${150 + rr() * 60},${a})`; g.fillRect(x, 0, 1, 4); }
      const rt = new THREE.CanvasTexture(c); rt.colorSpace = THREE.SRGBColorSpace;
      const ring = new THREE.Mesh(rg, new THREE.MeshStandardMaterial({ map: rt, transparent: true, side: THREE.DoubleSide, depthWrite: false, roughness: 1, envMapIntensity: 0 }));
      ring.rotation.x = Math.PI / 2 - 0.35; ring.rotation.y = 0.2;
      this.sysGroup.add(ring); S.ring = ring;
    }
    // moons
    S.moons = [];
    for (let i = 0; i < sys.moons; i++) {
      const mr = R * (0.12 + r() * 0.15);
      const mg = new THREE.IcosahedronGeometry(mr, 5);
      const p = mg.attributes.position, v = new THREE.Vector3();
      for (let k = 0; k < p.count; k++) { v.fromBufferAttribute(p, k); const n = v.clone().normalize(); const h = 1 + (U.hash(Math.floor((n.x + 2) * 30) + Math.floor((n.y + 2) * 30) * 97 + Math.floor((n.z + 2) * 30) * 9311, i) - 0.5) * 0.03; v.multiplyScalar(h); p.setXYZ(k, v.x, v.y, v.z); }
      mg.computeVertexNormals();
      const moon = new THREE.Mesh(mg, new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(r() * 0.15, 0.1, 0.5), roughness: 1, flatShading: false, envMapIntensity: 0 }));
      const ang = r() * Math.PI * 2, d = R * (3 + r() * 3);
      moon.position.set(Math.cos(ang) * d, (r() - 0.5) * R, Math.sin(ang) * d);
      this.sysGroup.add(moon); S.moons.push({ mesh: moon, r: mr });
    }
    // sun
    const sunCol = new THREE.Color(sys.star.color);
    const sunR = 26000 * sys.star.size;
    const sun = new THREE.Mesh(new THREE.SphereGeometry(sunR, 48, 24), new THREE.MeshBasicMaterial({ color: sunCol.clone().multiplyScalar(2.2), toneMapped: false }));
    sun.position.copy(S.sunPos); this.sysGroup.add(sun);
    const g1 = glowSprite(sunCol, sunR * 3.6, 0.7), g2 = glowSprite(sunCol, sunR * 11, 0.1);
    g1.position.copy(S.sunPos); g2.position.copy(S.sunPos); g1.material.toneMapped = false;
    this.sysGroup.add(g1, g2);
    S.sunR = sunR; S.sunMesh = sun;
    this.sun.color.copy(sunCol).lerp(new THREE.Color(1, 1, 1), 0.5);
    this.sun.position.copy(sunDir.clone().multiplyScalar(1000)); this.sun.target.position.set(0, 0, 0);
    // station: on the day side, its docking slot points away from the planet
    const sdir = sunDir.clone().add(new THREE.Vector3(r() - 0.5, (r() - 0.5) * 0.6, r() - 0.5)).normalize();
    const station = buildStation(sys.seed);
    station.position.copy(sdir.clone().multiplyScalar(R * 1.7));
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), sdir);
    station.quaternion.copy(q);
    this.sysGroup.add(station);
    S.station = station; S.stationAxis = sdir.clone(); S.stationSpin = 0;
    this.stationLight.position.copy(station.position).add(sdir.clone().multiplyScalar(700)); this.stationLight.intensity = 2;
    // sky
    const skyT = tex(sky.sky, sky.w, sky.h);
    this.nebula.material.map = skyT; this.nebula.material.needsUpdate = true;
    return S;
  }

  /* ---------- per frame ---------- */
  update(dt, time) {
    const S = this.sys;
    this.skyGroup.position.copy(this.camera.getWorldPosition(new THREE.Vector3()));
    if (S && S.planet) {
      if (S.clouds) S.clouds.rotation.y += dt * 0.004;
      S.planet.rotation.y += dt * 0.0015;
      S.stationSpin += dt * 0.25;
      const st = S.station;
      st.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), S.stationAxis);
      st.rotateZ(S.stationSpin);
      st.userData.beacon.material.opacity = Math.sin(time * 4) > 0.3 ? 1 : 0.1;
      st.userData.slotLights.forEach((l, i) => { l.material.opacity = 0.4 + 0.6 * (Math.sin(time * 6 - i) > 0 ? 1 : 0); });
    }
    // beams
    for (const b of this.beams) { b.life -= dt; b.mesh.material.opacity = Math.max(0, b.life / b.max); if (b.flash) b.flash.material.opacity = b.mesh.material.opacity; }
    this.beams = this.beams.filter((b) => { if (b.life <= 0) { this.scene.remove(b.mesh); if (b.flash) this.scene.remove(b.flash); b.mesh.geometry.dispose(); return false; } return true; });
    // explosions
    for (const e of this.fx) e.update(dt);
    this.fx = this.fx.filter((e) => { if (e.dead) { e.dispose(this.scene); return false; } return true; });
  }
  render() { this.composer.render(); }

  /* ---------- weapons and effects ---------- */
  beam(from, to, color, width = 1.4, life = 0.09, flash = true) {
    const d = to.clone().sub(from), L = d.length();
    const geo = new THREE.CylinderGeometry(width, width * 0.6, L, 6, 1, true);
    geo.translate(0, L / 2, 0); geo.rotateX(Math.PI / 2);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(3), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    m.position.copy(from); m.lookAt(to);
    this.scene.add(m);
    const b = { mesh: m, life, max: life };
    if (flash) { b.flash = glowSprite(color, width * 30, 1); b.flash.position.copy(to); this.scene.add(b.flash); }
    this.beams.push(b);
  }
  explode(pos, size, opts = {}) { const e = new Explosion(this, pos, size, opts); this.fx.push(e); this.shake = Math.max(this.shake, opts.shake || 0); return e; }
  spark(pos, color, size = 20) { const e = new Explosion(this, pos, size, { small: true, color }); this.fx.push(e); }
}

function hsl(h, s, l) { return "#" + new THREE.Color().setHSL(h, s, l).getHexString(); }
// the worker paints row 0 at the south pole; sphere uvs expect north at v = 1
function flipV(geo) { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i)); }

/* ---------- explosions: flash, fireballs, smoke, sparks, shockwave, debris and a light ---------- */
let smokeTex = null;
function smokeTexture() {
  if (smokeTex) return smokeTex;
  const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d");
  for (let i = 0; i < 30; i++) { const x = 64 + (Math.random() - 0.5) * 50, y = 64 + (Math.random() - 0.5) * 50, r = 15 + Math.random() * 30; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(255,255,255,0.25)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
  smokeTex = new THREE.CanvasTexture(c);
  return smokeTex;
}
class Explosion {
  constructor(world, pos, size, opts) {
    this.world = world; this.t = 0; this.dead = false; this.parts = []; this.size = size;
    const sc = world.scene, small = opts.small;
    const add = (o) => { sc.add(o); return o; };
    const n = small ? 5 : Math.min(60, 14 + Math.floor(size / 6));
    const pal = opts.color ? [opts.color] : [0xffd080, 0xff9030, 0xff5a20, 0xffe0a0];
    // fireballs
    for (let i = 0; i < n; i++) {
      const s = glowSprite(U.pick(pal), 1, 1);
      const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      const v = dir.multiplyScalar(size * (0.4 + Math.random() * 1.6) * (small ? 1.5 : 1));
      s.position.copy(pos); add(s);
      this.parts.push({ o: s, v, grow: size * (1.2 + Math.random() * 2.2), life: (small ? 0.35 : 0.9) + Math.random() * (small ? 0.2 : 1.1), delay: small ? 0 : Math.random() * 0.25, kind: "fire" });
    }
    if (!small) {
      // core flash
      const f = glowSprite(0xffffff, 1, 1); f.material.toneMapped = false; f.position.copy(pos); add(f);
      this.parts.push({ o: f, v: new THREE.Vector3(), grow: size * 9, life: 0.45, delay: 0, kind: "flash" });
      // smoke
      for (let i = 0; i < Math.min(24, 6 + size / 10); i++) {
        const m = new THREE.SpriteMaterial({ map: smokeTexture(), color: 0x302a28, transparent: true, opacity: 0, depthWrite: false });
        const s = new THREE.Sprite(m); s.position.copy(pos); add(s);
        const v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(size * (0.2 + Math.random() * 0.6));
        this.parts.push({ o: s, v, grow: size * (2 + Math.random() * 3), life: 2.5 + Math.random() * 2, delay: 0.3, kind: "smoke", rot: (Math.random() - 0.5) });
      }
      // sparks
      const ns = Math.floor(Math.min(400, 60 + size * 2)), sp = new Float32Array(ns * 3);
      this.sparkV = [];
      for (let i = 0; i < ns; i++) { sp.set([pos.x, pos.y, pos.z], i * 3); this.sparkV.push(new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(size * (2 + Math.random() * 7))); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(sp, 3));
      this.sparks = add(new THREE.Points(g, new THREE.PointsMaterial({ map: glowTexture(), color: 0xffe0a0, size: Math.max(3, size * 0.14), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })));
      this.sparks.frustumCulled = false;
      // shockwave
      const ring = add(new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 64), new THREE.MeshBasicMaterial({ color: 0x9ad0ff, transparent: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })));
      ring.position.copy(pos); ring.lookAt(pos.clone().add(new THREE.Vector3(Math.random() - 0.5, 1, Math.random() - 0.5)));
      this.ring = ring;
      // debris chunks
      this.debris = [];
      const dm = new THREE.MeshStandardMaterial({ color: opts.debrisColor || 0x8a8a90, metalness: 0.6, roughness: 0.5, flatShading: true, emissive: 0x401000 });
      for (let i = 0; i < Math.min(18, 3 + size / 8); i++) {
        const d = add(new THREE.Mesh(new THREE.TetrahedronGeometry(size * (0.06 + Math.random() * 0.12)), dm));
        d.position.copy(pos);
        const ember = glowSprite(0xff8030, size * 0.14, 0.9); d.add(ember);
        this.debris.push({ o: d, v: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(size * (1 + Math.random() * 3)), r: new THREE.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6), ember });
      }
      const free = world.flashLights.find((l) => !l.userData.busy);
      if (free) { free.userData.busy = true; free.distance = size * 40; free.position.copy(pos); free.intensity = 60; this.light = free; }
      this.max = 5;
    } else this.max = 0.7;
  }
  update(dt) {
    this.t += dt;
    const t = this.t;
    for (const p of this.parts) {
      const k = (t - p.delay) / p.life;
      if (k < 0) { p.o.visible = false; continue; }
      p.o.visible = k < 1;
      if (k >= 1) continue;
      p.o.position.addScaledVector(p.v, dt); p.v.multiplyScalar(1 - dt * 1.2);
      if (p.kind === "fire") { const s = p.grow * (0.3 + Math.sqrt(k)); p.o.scale.set(s, s, 1); p.o.material.opacity = (1 - k) * (1 - k); p.o.material.color.lerp(new THREE.Color(0xff3010), dt * 1.5); }
      else if (p.kind === "flash") { const s = p.grow * Math.sqrt(k); p.o.scale.set(s, s, 1); p.o.material.opacity = 1 - k; }
      else if (p.kind === "smoke") { const s = p.grow * (0.4 + k); p.o.scale.set(s, s, 1); p.o.material.opacity = Math.sin(k * Math.PI) * 0.6; p.o.material.rotation += p.rot * dt; }
    }
    if (this.sparks) {
      const a = this.sparks.geometry.attributes.position;
      for (let i = 0; i < this.sparkV.length; i++) { const v = this.sparkV[i]; a.setXYZ(i, a.getX(i) + v.x * dt, a.getY(i) + v.y * dt, a.getZ(i) + v.z * dt); v.multiplyScalar(1 - dt * 0.6); }
      a.needsUpdate = true;
      this.sparks.material.opacity = Math.max(0, 1 - t / 1.8);
    }
    if (this.ring) { const s = this.size * (1 + t * 14); this.ring.scale.set(s, s, s); this.ring.material.opacity = Math.max(0, 0.9 - t * 0.9); }
    if (this.debris) for (const d of this.debris) { d.o.position.addScaledVector(d.v, dt); d.o.rotation.x += d.r.x * dt; d.o.rotation.y += d.r.y * dt; d.ember.material.opacity = Math.max(0, 1 - t / 1.8); }
    if (this.light) this.light.intensity = Math.max(0, 60 * (1 - t / 1.2));
    if (t > this.max) this.dead = true;
  }
  dispose(scene) {
    for (const p of this.parts) { scene.remove(p.o); p.o.material.dispose(); }
    if (this.sparks) { scene.remove(this.sparks); this.sparks.geometry.dispose(); }
    if (this.ring) { scene.remove(this.ring); this.ring.geometry.dispose(); }
    if (this.debris) for (const d of this.debris) { scene.remove(d.o); d.o.geometry.dispose(); }
    if (this.light) { this.light.intensity = 0; this.light.userData.busy = false; }
  }
}
