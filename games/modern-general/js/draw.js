/* Modern General: drawing – the map (pre-rendered from the terrain data), units on their
   party plates, markers and effects. Units are drawn by code until photo sprites exist:
   a file assets/units/<type>.webp replaces the drawn silhouette automatically.            */
"use strict";

(function (MG) {
  const { U } = MG;
  const G = MG.G;
  const D = (MG.D = {});
  D.FONT = "Rajdhani, 'Arial Narrow', Arial, sans-serif";
  D.LOGO = "Orbitron, 'Arial Black', Arial, sans-serif";
  D.R = 40; // hex radius in world units
  const SQ3 = Math.sqrt(3);
  D.C = {
    text: "#e8edf2", dim: "#9aa7b4", faint: "#5d6a77", panel: "rgba(20,26,32,0.94)", edge: "#3e4c5a",
    accent: "#ffd36a", ok: "#9fe08a", warn: "#ff6a5a", btn: "#2a3542", btnHi: "#3b4a5c",
  };
  D.rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
  D.side = (s) => MG.NATIONS[s].col;

  /* ---------- geometry ---------- */
  D.cx = (i) => D.R * 1.5 * G.col(i) + D.R;
  D.cy = (i) => D.R * SQ3 * (G.row(i) + 0.5 * (G.col(i) & 1)) + (D.R * SQ3) / 2;
  D.worldW = () => D.R * 1.5 * G.W + D.R * 0.5;
  D.worldH = () => D.R * SQ3 * (G.H + 0.5);
  D.hexPath = (c, x, y, r) => {
    c.beginPath();
    for (let k = 0; k < 6; k++) { const a = (Math.PI / 3) * k; c.lineTo(x + r * Math.cos(a), y + r * Math.sin(a)); }
    c.closePath();
  };
  D.pick = (wx, wy) => {
    const R = D.R, x = wx - R, y = wy - (R * SQ3) / 2;
    const q = ((2 / 3) * x) / R, r = ((-1 / 3) * x + (SQ3 / 3) * y) / R;
    let cx = q, cz = r, cy = -cx - cz;
    let rx = Math.round(cx), ry = Math.round(cy), rz = Math.round(cz);
    const dx = Math.abs(rx - cx), dy = Math.abs(ry - cy), dz = Math.abs(rz - cz);
    if (dx > dy && dx > dz) rx = -ry - rz; else if (dy > dz) ry = -rx - rz; else rz = -rx - ry;
    return G.idx(rx, rz + ((rx - (rx & 1)) >> 1));
  };

  /* ---------- text and widgets ---------- */
  D.text = (c, s, x, y, size, col = D.C.text, align = "left", weight = 600, font = D.FONT) => {
    c.font = `${weight} ${size}px ${font}`; c.textAlign = align; c.textBaseline = "middle"; c.fillStyle = col; c.fillText(s, x, y);
  };
  D.wrap = (c, s, size, w, weight = 600) => {
    c.font = `${weight} ${size}px ${D.FONT}`;
    const out = [];
    for (const para of String(s).split("\n")) {
      let line = "";
      for (const word of para.split(" ")) { const t = line ? line + " " + word : word; if (c.measureText(t).width > w && line) { out.push(line); line = word; } else line = t; }
      out.push(line);
    }
    return out;
  };
  D.para = (c, s, x, y, size, w, col = D.C.text, lh = 1.3) => { const L = D.wrap(c, s, size, w); L.forEach((l, k) => D.text(c, l, x, y + k * size * lh + size / 2, size, col)); return L.length * size * lh; };
  D.button = (c, b, hover) => {
    c.fillStyle = b.disabled ? "#20262d" : hover ? D.C.btnHi : b.col || D.C.btn;
    c.fillRect(b.x, b.y, b.w, b.h);
    c.strokeStyle = b.disabled ? "#333b44" : hover ? D.C.accent : D.C.edge; c.lineWidth = 1.5; c.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
    D.text(c, b.label, b.x + b.w / 2, b.y + b.h / 2 + 1, b.size || 17, b.disabled ? "#69737d" : D.C.text, "center", 700);
  };

  /* ======================= the map, rendered once per battle ======================= */
  const PAL = {
    clear: ["#dfe3c8", "#d8dfc0", "#e4e0c4", "#d3dbbb", "#e2e5cc"],
    forestBase: "#c9d6b4", tree: ["#93ad80", "#88a576", "#9db78a"], treeEdge: "rgba(60,85,50,0.35)",
    town: "#dcd9d2", city: "#d2cec7", roof: ["#c9a08c", "#b9a99a", "#c4b6a6", "#bf8f7c"],
    swamp: "#d3dcc8", mountain: "#c9bfa8", water: "#a9c7d8", river: "#97bdd3", bank: "#cfdac0",
    road: "#f3f0e6", roadEdge: "#a49d90", grid: "rgba(70,80,70,0.16)",
  };
  const ELEV = ["rgba(0,0,0,0)", "rgba(150,120,70,0.10)", "rgba(140,105,55,0.20)", "rgba(125,90,45,0.30)"];
  function noise(i, k) { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); }

  // photo maps: loaded once, then the map is rendered again
  const photos = {};
  D.photo = (src) => {
    if (!src || typeof Image === "undefined") return null;
    if (!(src in photos)) {
      photos[src] = null;
      const im = new Image();
      im.onload = () => { photos[src] = im; if (G.S && G.S.scen.photo === src) { D.renderMap(); if (D.onMap) D.onMap(); } };
      im.src = src;
    }
    return photos[src];
  };
  // the photo is faded (lighter, less colour) so that the units stand out
  D.FADE = "brightness(1.12) saturate(0.55) contrast(0.88)";
  D.VEIL = "rgba(255,255,250,0.16)";

  // ground textures (aerial photos made with Higgsfield) for the generated campaign maps
  const TEXN = ["meadow", "wheat", "crop", "plough", "forest", "rock", "marsh", "water", "village", "town"];
  const tex = {};
  let texWait = 0;
  D.loadTex = function () {
    if (typeof Image === "undefined" || texWait) return;
    for (const n of TEXN) {
      texWait++;
      const im = new Image();
      im.onload = () => { tex[n] = im; if (--texWait === 0 && G.S && !G.S.scen.photo) { D.renderMap(); if (D.onMap) D.onMap(); } };
      im.onerror = () => { texWait--; };
      im.src = "assets/tex/" + n + (n === "village" || n === "town" ? ".webp" : ".jpg");
    }
  };
  D.texReady = () => TEXN.every((n) => tex[n]);

  D.renderMap = function () {
    const S = G.S, R = D.R, k = Math.min(2, 3600 / D.worldW());
    const cv = document.createElement("canvas");
    cv.width = Math.ceil(D.worldW() * k); cv.height = Math.ceil(D.worldH() * k);
    const c = cv.getContext("2d");
    c.scale(k, k);
    if (!S.scen.photo && D.texReady()) return renderTextured(cv, c, k);
    const photo = D.photo(S.scen.photo);
    if (photo) {
      c.imageSmoothingQuality = "high";
      c.filter = D.FADE; c.drawImage(photo, 0, 0, D.worldW(), D.worldH()); c.filter = "none";
      c.fillStyle = D.VEIL; c.fillRect(0, 0, D.worldW(), D.worldH());
      c.lineWidth = 1; c.strokeStyle = "rgba(40,50,40,0.22)";
      for (let i = 0; i < G.N; i++) { D.hexPath(c, D.cx(i), D.cy(i), R); c.stroke(); }
      labels(c);
      D.mapCanvas = cv; D.mapScale = k; D.mapPhoto = true;
      return cv;
    }
    D.mapPhoto = false;
    c.fillStyle = PAL.clear[0]; c.fillRect(0, 0, cv.width, cv.height);
    // open ground: a patchwork of fields across the whole map, not per hex
    const rnd = U.rng(1234);
    for (let k = 0; k < 420; k++) {
      const x = rnd() * D.worldW(), y = rnd() * D.worldH(), w = 40 + rnd() * 90, h = 30 + rnd() * 70, a = (rnd() - 0.5) * 0.9;
      c.save(); c.translate(x, y); c.rotate(a);
      c.fillStyle = PAL.clear[Math.floor(rnd() * PAL.clear.length)]; c.globalAlpha = 0.7; c.fillRect(-w / 2, -h / 2, w, h);
      c.globalAlpha = 0.25; c.strokeStyle = "#b8bf9c"; c.lineWidth = 1; c.strokeRect(-w / 2, -h / 2, w, h);
      c.restore();
    }
    c.globalAlpha = 1;
    // other ground cover per hex, with soft edges
    for (let i = 0; i < G.N; i++) {
      const h = S.hex[i], x = D.cx(i), y = D.cy(i);
      let col = null;
      if (h.river) col = PAL.bank;
      else if (h.t === "forest") col = PAL.forestBase;
      else if (h.t === "town") col = PAL.town;
      else if (h.t === "city") col = PAL.city;
      else if (h.t === "swamp") col = PAL.swamp;
      else if (h.t === "mountain") col = PAL.mountain;
      else if (h.t === "water") col = PAL.water;
      if (!col) continue;
      const g = c.createRadialGradient(x, y, R * 0.55, x, y, R * 1.15);
      g.addColorStop(0, col); g.addColorStop(1, D.rgba(col, 0));
      c.fillStyle = g; c.beginPath(); c.arc(x, y, R * 1.15, 0, U.TAU); c.fill();
    }
    // heights: soft brown blobs, darker with each level
    for (let lev = 1; lev <= 3; lev++) for (let i = 0; i < G.N; i++) {
      if (S.hex[i].e < lev) continue;
      const x = D.cx(i), y = D.cy(i), g = c.createRadialGradient(x, y, R * 0.3, x, y, R * 1.25);
      g.addColorStop(0, `rgba(150,115,60,${0.13})`); g.addColorStop(1, "rgba(150,115,60,0)");
      c.fillStyle = g; c.beginPath(); c.arc(x, y, R * 1.25, 0, U.TAU); c.fill();
    }
    // hillshade: a light edge to the north-west, a shadow to the south-east where the ground falls away
    for (let i = 0; i < G.N; i++) {
      const h = S.hex[i], x = D.cx(i), y = D.cy(i);
      for (const j of G.nb(i)) {
        if (S.hex[j].e >= h.e) continue;
        const th = Math.atan2(D.cy(j) - y, D.cx(j) - x), a0 = th - Math.PI / 6, a1 = th + Math.PI / 6;
        const diff = h.e - S.hex[j].e;
        c.beginPath(); c.moveTo(x + R * Math.cos(a0), y + R * Math.sin(a0)); c.lineTo(x + R * Math.cos(a1), y + R * Math.sin(a1));
        c.lineWidth = 1 + diff; c.setLineDash([5, 4]); c.strokeStyle = `rgba(110,80,40,${0.16 + diff * 0.1})`; c.stroke(); c.setLineDash([]);
      }
    }
    // river: a ribbon through the chain of river hexes
    const riv = []; for (let i = 0; i < G.N; i++) if (S.hex[i].river) riv.push(i);
    for (const i of riv) {
      for (const j of G.nb(i)) if (S.hex[j].river && j > i) {
        c.beginPath(); c.moveTo(D.cx(i), D.cy(i)); c.lineTo(D.cx(j), D.cy(j));
        c.lineCap = "round"; c.lineWidth = R * 1.05; c.strokeStyle = PAL.river; c.stroke();
      }
      D.hexPath(c, D.cx(i), D.cy(i), R * 0.45); c.fillStyle = PAL.river; c.fill();
      if (S.hex[i].ford) {
        c.save(); c.translate(D.cx(i), D.cy(i));
        for (let s = -2; s <= 2; s++) { c.fillStyle = "rgba(225,215,180,0.7)"; c.beginPath(); c.ellipse(s * 7, (s % 2) * 6, 6, 3.5, 0.3, 0, U.TAU); c.fill(); }
        c.restore();
      }
    }
    for (const i of riv) for (const j of G.nb(i)) if (S.hex[j].river && j > i) {
      c.beginPath(); c.moveTo(D.cx(i), D.cy(i)); c.lineTo(D.cx(j), D.cy(j)); c.lineWidth = R * 0.35; c.strokeStyle = "rgba(255,255,255,0.18)"; c.stroke();
    }
    // lake shore
    for (let i = 0; i < G.N; i++) if (S.hex[i].t === "water") { c.save(); D.hexPath(c, D.cx(i), D.cy(i), R * 0.98); c.clip(); for (let s = 0; s < 3; s++) { c.strokeStyle = "rgba(255,255,255,0.22)"; c.lineWidth = 1.2; c.beginPath(); c.arc(D.cx(i) + (noise(i, s) - 0.5) * R, D.cy(i) + (noise(i, s + 3) - 0.5) * R, 6 + s * 3, 0.3, 2.4); c.stroke(); } c.restore(); }
    // swamp reeds
    for (let i = 0; i < G.N; i++) if (S.hex[i].t === "swamp") {
      const x = D.cx(i), y = D.cy(i);
      for (let s = 0; s < 9; s++) {
        const px = x + (noise(i, s) - 0.5) * R * 1.3, py = y + (noise(i, s + 9) - 0.5) * R * 1.2;
        if (s % 3 === 0) { c.fillStyle = "rgba(140,175,195,0.45)"; c.beginPath(); c.ellipse(px, py, 7, 3, 0, 0, U.TAU); c.fill(); }
        else { c.strokeStyle = "rgba(95,120,80,0.6)"; c.lineWidth = 1; c.beginPath(); c.moveTo(px, py); c.lineTo(px - 2, py - 7); c.moveTo(px + 2, py); c.lineTo(px + 3, py - 6); c.stroke(); }
      }
    }
    // rocks
    for (let i = 0; i < G.N; i++) if (S.hex[i].t === "mountain") {
      const x = D.cx(i), y = D.cy(i);
      for (let s = 0; s < 6; s++) {
        const px = x + (noise(i, s) - 0.5) * R * 1.2, py = y + (noise(i, s + 4) - 0.5) * R * 1.1, w = 8 + noise(i, s + 8) * 8;
        c.beginPath(); c.moveTo(px - w, py + w * 0.5); c.lineTo(px, py - w * 0.7); c.lineTo(px + w, py + w * 0.5); c.closePath();
        c.fillStyle = "rgba(160,145,120,0.8)"; c.fill(); c.strokeStyle = "rgba(90,75,55,0.5)"; c.lineWidth = 1; c.stroke();
        c.beginPath(); c.moveTo(px, py - w * 0.7); c.lineTo(px + w, py + w * 0.5); c.lineTo(px + w * 0.2, py + w * 0.5); c.closePath(); c.fillStyle = "rgba(90,75,55,0.25)"; c.fill();
      }
    }
    // roads: through each road hex, a curve between the midpoints of its linked edges
    const roadNb = new Map();
    for (const key of S.links) { const [a, b] = key.split(",").map(Number); (roadNb.get(a) || roadNb.set(a, []).get(a)).push(b); (roadNb.get(b) || roadNb.set(b, []).get(b)).push(a); }
    const mid = (a, b) => [(D.cx(a) + D.cx(b)) / 2, (D.cy(a) + D.cy(b)) / 2];
    for (const pass of [0, 1]) for (const [i, nbs] of roadNb) {
      c.lineCap = "round"; c.lineWidth = pass ? 4.5 : 8; c.strokeStyle = pass ? PAL.road : PAL.roadEdge;
      const x = D.cx(i), y = D.cy(i);
      if (nbs.length === 2) { const [p, q] = [mid(i, nbs[0]), mid(i, nbs[1])]; c.beginPath(); c.moveTo(p[0], p[1]); c.quadraticCurveTo(x, y, q[0], q[1]); c.stroke(); }
      else for (const j of nbs) { const p = mid(i, j); c.beginPath(); c.moveTo(x, y); c.lineTo(p[0], p[1]); c.stroke(); }
    }
    // towns and the city: blocks of houses
    for (let i = 0; i < G.N; i++) {
      const h = S.hex[i];
      if (h.t !== "town" && h.t !== "city") continue;
      const x = D.cx(i), y = D.cy(i), n = h.t === "city" ? 16 : 9;
      for (let s = 0; s < n; s++) {
        const ang = noise(i, s) * U.TAU, rr = Math.sqrt(noise(i, s + 20)) * R * 0.72;
        const px = x + Math.cos(ang) * rr, py = y + Math.sin(ang) * rr;
        const w = (h.t === "city" ? 9 : 7) + noise(i, s + 40) * 6, hh = 6 + noise(i, s + 60) * 5;
        c.save(); c.translate(px, py); c.rotate(Math.round(noise(i, s + 80) * 3) * (Math.PI / 6));
        c.fillStyle = "rgba(80,70,60,0.25)"; c.fillRect(-w / 2 + 1.5, -hh / 2 + 1.5, w, hh);
        c.fillStyle = PAL.roof[(i + s) % PAL.roof.length]; c.fillRect(-w / 2, -hh / 2, w, hh);
        c.fillStyle = "rgba(255,255,255,0.18)"; c.fillRect(-w / 2, -hh / 2, w, hh / 2);
        c.restore();
      }
    }
    // forests: overlapping crowns
    for (let i = 0; i < G.N; i++) {
      if (S.hex[i].t !== "forest") continue;
      const x = D.cx(i), y = D.cy(i);
      for (let s = 0; s < 22; s++) {
        const ang = noise(i, s) * U.TAU, rr = Math.sqrt(noise(i, s + 30)) * R * 0.85;
        const px = x + Math.cos(ang) * rr, py = y + Math.sin(ang) * rr, r = 5 + noise(i, s + 50) * 5;
        c.beginPath(); c.arc(px + 1.5, py + 2, r, 0, U.TAU); c.fillStyle = "rgba(60,80,50,0.18)"; c.fill();
        c.beginPath(); c.arc(px, py, r, 0, U.TAU); c.fillStyle = PAL.tree[(i + s) % 3]; c.fill();
        c.lineWidth = 0.8; c.strokeStyle = PAL.treeEdge; c.stroke();
        c.beginPath(); c.arc(px - r * 0.3, py - r * 0.3, r * 0.45, 0, U.TAU); c.fillStyle = "rgba(255,255,230,0.16)"; c.fill();
      }
    }
    // the hex grid
    c.lineWidth = 1; c.strokeStyle = PAL.grid;
    for (let i = 0; i < G.N; i++) { D.hexPath(c, D.cx(i), D.cy(i), R); c.stroke(); }
    labels(c);
    D.mapCanvas = cv; D.mapScale = k;
    return cv;
  };
  /* a photographic map composited from the ground textures: fields, woods, rocks, marsh,
     water, villages and towns, lit by a hillshade computed from the heights */
  function renderTextured(cv, c, k) {
    const S = G.S, R = D.R, WW = D.worldW(), WH = D.worldH(), rnd = U.rng(S.scen.seed || 7);
    const pat = (n, sc, deg = 0, dx = 0, dy = 0) => {
      const p = c.createPattern(tex[n], "repeat");
      p.setTransform(new DOMMatrix().translate(dx, dy).rotate(deg).scale(sc));
      return p;
    };
    // 1. meadow everywhere, then a patchwork of fields with rows in their own direction
    c.fillStyle = pat("meadow", 0.5); c.fillRect(0, 0, WW, WH);
    const crops = ["wheat", "crop", "plough", "meadow", "wheat", "crop", "plough"];
    const nf = Math.round((WW * WH) / 9000);
    for (let f = 0; f < nf; f++) {
      const x = rnd() * WW, y = rnd() * WH, w = 70 + rnd() * 120, h = 50 + rnd() * 90, a = (rnd() - 0.5) * 70;
      c.save(); c.translate(x, y); c.rotate((a * Math.PI) / 180);
      c.fillStyle = pat(crops[Math.floor(rnd() * crops.length)], 0.28 + rnd() * 0.1, 0, rnd() * 300, rnd() * 300);
      c.fillRect(-w / 2, -h / 2, w, h);
      c.strokeStyle = "rgba(70,80,45,0.45)"; c.lineWidth = 1.6; c.strokeRect(-w / 2, -h / 2, w, h);
      c.restore();
    }
    // 2. layers from soft masks
    const tmp = document.createElement("canvas"); tmp.width = cv.width; tmp.height = cv.height;
    const t = tmp.getContext("2d");
    const blob = (x, y, r0, r1) => { const g = t.createRadialGradient(x, y, r0, x, y, r1); g.addColorStop(0, "#000"); g.addColorStop(1, "rgba(0,0,0,0)"); t.fillStyle = g; t.beginPath(); t.arc(x, y, r1, 0, U.TAU); t.fill(); };
    const layer = (name, sc, test, opt = {}) => {
      t.setTransform(1, 0, 0, 1, 0, 0); t.globalCompositeOperation = "source-over"; t.clearRect(0, 0, tmp.width, tmp.height);
      t.setTransform(k, 0, 0, k, 0, 0);
      let any = false;
      for (let i = 0; i < G.N; i++) {
        if (!test(S.hex[i], i)) continue;
        any = true;
        const x = D.cx(i), y = D.cy(i);
        blob(x, y, R * 0.55, R * (opt.r || 1.12));
        for (let s = 0; s < 3; s++) blob(x + (noise(i, s + 90) - 0.5) * R * 1.1, y + (noise(i, s + 95) - 0.5) * R, R * 0.2, R * 0.6);
      }
      if (opt.extra) any = opt.extra(t) || any;
      if (!any) return;
      t.globalCompositeOperation = "source-in";
      const p = t.createPattern(tex[name], "repeat"); p.setTransform(new DOMMatrix().scale(sc)); t.fillStyle = p;
      t.fillRect(0, 0, WW, WH);
      if (opt.tint) { t.globalCompositeOperation = "source-atop"; t.fillStyle = opt.tint; t.fillRect(0, 0, WW, WH); }
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
      if (opt.shadow) { c.shadowColor = "rgba(20,30,10,0.55)"; c.shadowBlur = 7 * k; c.shadowOffsetX = 3 * k; c.shadowOffsetY = 4 * k; }
      c.drawImage(tmp, 0, 0); c.restore();
    };
    layer("marsh", 0.45, (h) => h.t === "swamp" && !h.river);
    layer("rock", 0.4, (h) => h.t === "mountain" && !h.river, { r: 0.98 });
    // rivers and lakes: one water layer; the river is a ribbon through its chain of hexes
    layer("water", 0.5, (h) => h.t === "water", {
      r: 1.05,
      tint: "rgba(110,165,200,0.38)",
      extra: (t) => {
        let any = false;
        t.strokeStyle = "#000"; t.fillStyle = "#000"; t.lineCap = "round"; t.lineJoin = "round";
        for (let i = 0; i < G.N; i++) {
          if (!S.hex[i].river) continue;
          any = true;
          t.beginPath(); t.arc(D.cx(i), D.cy(i), R * 0.42, 0, U.TAU); t.fill();
          for (const j of G.nb(i)) if (S.hex[j].river && j > i) { t.beginPath(); t.moveTo(D.cx(i), D.cy(i)); t.lineTo(D.cx(j), D.cy(j)); t.lineWidth = R * 0.8; t.stroke(); }
          // the river runs off the map edge
          const c0 = G.col(i), r0 = G.row(i);
          if (r0 === 0) { t.beginPath(); t.moveTo(D.cx(i), D.cy(i)); t.lineTo(D.cx(i), D.cy(i) - R * 2); t.lineWidth = R * 0.8; t.stroke(); }
          if (r0 === G.H - 1) { t.beginPath(); t.moveTo(D.cx(i), D.cy(i)); t.lineTo(D.cx(i), D.cy(i) + R * 2); t.lineWidth = R * 0.8; t.stroke(); }
          void c0;
        }
        return any;
      },
    });
    // fords: shallow sand bars
    for (let i = 0; i < G.N; i++) if (S.hex[i].ford) {
      c.save(); c.translate(D.cx(i), D.cy(i));
      for (let s = -2; s <= 2; s++) { c.fillStyle = "rgba(215,200,160,0.75)"; c.beginPath(); c.ellipse(s * 7, (s % 2) * 6, 7, 4, 0.3, 0, U.TAU); c.fill(); }
      c.restore();
    }
    // 3. hillshade from a smooth height field
    const step = 6, hw = Math.ceil(WW / step), hh = Math.ceil(WH / step);
    const hf = new Float32Array(hw * hh), sg = R * 0.75;
    for (let y = 0; y < hh; y++) for (let x = 0; x < hw; x++) {
      const wx = x * step, wy = y * step, i = D.pick(U.clamp(wx, R * 0.6, WW - R * 0.6), U.clamp(wy, R * 0.95, WH - R * 0.95));
      if (i < 0) { hf[y * hw + x] = 0; continue; }
      let sw = 0, se = 0;
      for (const j of [i, ...G.nb(i)]) { const dx = D.cx(j) - wx, dy = D.cy(j) - wy, w = Math.exp(-(dx * dx + dy * dy) / (2 * sg * sg)); sw += w; se += w * S.hex[j].e; }
      hf[y * hw + x] = se / sw;
    }
    const sh = document.createElement("canvas"); sh.width = hw; sh.height = hh;
    const sc2 = sh.getContext("2d"), img = sc2.createImageData(hw, hh);
    for (let y = 0; y < hh; y++) for (let x = 0; x < hw; x++) {
      const v = (xx, yy) => hf[Math.min(hh - 1, Math.max(0, yy)) * hw + Math.min(hw - 1, Math.max(0, xx))];
      const gx = v(x + 1, y) - v(x - 1, y), gy = v(x, y + 1) - v(x, y - 1);
      const l = -(gx * 0.7 + gy * 0.7) * 5, e = v(x, y), o = (y * hw + x) * 4;
      if (l >= 0) { img.data[o] = 255; img.data[o + 1] = 250; img.data[o + 2] = 225; img.data[o + 3] = Math.min(170, l * 130); }
      else { img.data[o] = 30; img.data[o + 1] = 25; img.data[o + 2] = 10; img.data[o + 3] = Math.min(200, -l * 160); }
      // high ground is a little drier and browner
      if (e > 0.6 && l > -0.05 && l < 0.05) { img.data[o] = 150; img.data[o + 1] = 120; img.data[o + 2] = 70; img.data[o + 3] = Math.min(60, (e - 0.6) * 25); }
    }
    sc2.putImageData(img, 0, 0);
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
    c.drawImage(sh, 0, 0, hw * step, hh * step);
    // 4. woods on top, with a soft shadow so they stand up from the ground
    layer("forest", 0.42, (h) => h.t === "forest" && !h.river, { shadow: true });
    // 5. roads
    const roadNb = new Map();
    for (const key of S.links) { const [a, b] = key.split(",").map(Number); (roadNb.get(a) || roadNb.set(a, []).get(a)).push(b); (roadNb.get(b) || roadNb.set(b, []).get(b)).push(a); }
    const mid = (a, b) => [(D.cx(a) + D.cx(b)) / 2, (D.cy(a) + D.cy(b)) / 2];
    for (const pass of [0, 1, 2]) for (const [i, nbs] of roadNb) {
      c.lineCap = "round"; c.lineWidth = [8, 5.5, 0.8][pass]; c.strokeStyle = ["rgba(60,55,45,0.55)", "#a8a59c", "rgba(255,255,255,0.55)"][pass];
      if (pass === 2) c.setLineDash([4, 6]);
      const x = D.cx(i), y = D.cy(i);
      if (nbs.length === 2) { const [p, q] = [mid(i, nbs[0]), mid(i, nbs[1])]; c.beginPath(); c.moveTo(p[0], p[1]); c.quadraticCurveTo(x, y, q[0], q[1]); c.stroke(); }
      else for (const j of nbs) { const p = mid(i, j); c.beginPath(); c.moveTo(x, y); c.lineTo(p[0], p[1]); c.stroke(); }
      c.setLineDash([]);
    }
    // 6. villages, towns and the city
    for (let i = 0; i < G.N; i++) {
      const h = S.hex[i];
      if (h.t !== "town" && h.t !== "city") continue;
      const im = h.t === "city" ? tex.town : tex.village, sz = R * (h.t === "city" ? 2.3 : 1.95);
      c.save(); c.translate(D.cx(i), D.cy(i)); c.rotate(Math.floor(noise(i, 7) * 4) * (Math.PI / 2) + (noise(i, 8) - 0.5) * 0.4);
      c.shadowColor = "rgba(30,30,20,0.35)"; c.shadowBlur = 5 * k;
      c.drawImage(im, -sz / 2, -sz / 2, sz, sz);
      c.restore();
    }
    // 7. fade it like the photo maps, then grid and names
    const out = document.createElement("canvas"); out.width = cv.width; out.height = cv.height;
    const o = out.getContext("2d");
    o.filter = D.FADE; o.drawImage(cv, 0, 0); o.filter = "none";
    o.scale(k, k);
    o.fillStyle = D.VEIL; o.fillRect(0, 0, WW, WH);
    o.lineWidth = 1; o.strokeStyle = "rgba(40,50,40,0.22)";
    for (let i = 0; i < G.N; i++) { D.hexPath(o, D.cx(i), D.cy(i), R); o.stroke(); }
    labels(o);
    D.mapCanvas = out; D.mapScale = k; D.mapPhoto = false; D.mapTex = true;
    return out;
  }

  function labels(c) {
    const S = G.S, R = D.R;
    for (let i = 0; i < G.N; i++) {
      const h = S.hex[i];
      if (!h.name) continue;
      c.font = `700 12px ${D.FONT}`; c.textAlign = "center"; c.textBaseline = "middle";
      c.lineWidth = 3; c.strokeStyle = "rgba(255,255,255,0.75)"; c.strokeText(h.name.toUpperCase(), D.cx(i), D.cy(i) - R * 0.62);
      c.fillStyle = "#4a4f55"; c.fillText(h.name.toUpperCase(), D.cx(i), D.cy(i) - R * 0.62);
    }
  }

  /* ======================= markers drawn over the map every frame ======================= */
  D.blown = function (c, i) {
    const x = D.cx(i), y = D.cy(i);
    c.fillStyle = "rgba(60,50,40,0.75)"; c.beginPath(); c.ellipse(x, y, D.R * 0.55, D.R * 0.32, 0, 0, U.TAU); c.fill();
    c.strokeStyle = "#ff4b3a"; c.lineWidth = 4; c.beginPath(); c.moveTo(x - 10, y - 10); c.lineTo(x + 10, y + 10); c.moveTo(x + 10, y - 10); c.lineTo(x - 10, y + 10); c.stroke();
  };
  D.bridge = function (c, i, kind) {
    const S = G.S;
    if (kind === "fixed" && D.mapPhoto) return;
    // orient the deck along the land neighbours on opposite sides
    const nb = G.nb(i).filter((j) => !S.hex[j].river);
    let ang = 0;
    if (nb.length >= 2) {
      let best = 0;
      for (const a of nb) for (const b of nb) { const d = Math.hypot(D.cx(a) - D.cx(b), D.cy(a) - D.cy(b)); if (d > best) { best = d; ang = Math.atan2(D.cy(b) - D.cy(a), D.cx(b) - D.cx(a)); } }
    }
    c.save(); c.translate(D.cx(i), D.cy(i)); c.rotate(ang);
    const L = D.R * 1.25, w = kind === "assault" ? 11 : 13;
    c.fillStyle = "rgba(0,0,0,0.25)"; c.fillRect(-L / 2 + 2, -w / 2 + 3, L, w);
    c.fillStyle = kind === "assault" ? "#6d7556" : "#bdb6aa"; c.fillRect(-L / 2, -w / 2, L, w);
    c.strokeStyle = kind === "assault" ? "#3b4230" : "#7a7469"; c.lineWidth = 2; c.strokeRect(-L / 2, -w / 2, L, w);
    if (kind === "assault") for (let s = -L / 2 + 5; s < L / 2; s += 6) { c.beginPath(); c.moveTo(s, -w / 2); c.lineTo(s, w / 2); c.lineWidth = 1; c.stroke(); }
    c.restore();
  };
  D.mine = function (c, i, m, mine) {
    const x = D.cx(i), y = D.cy(i) + D.R * 0.45, col = D.side(m.side);
    c.save(); c.globalAlpha = mine ? 0.9 : 0.95;
    for (let s = -1; s <= 1; s++) {
      c.beginPath(); c.moveTo(x + s * 11 - 5, y + 4); c.lineTo(x + s * 11, y - 5); c.lineTo(x + s * 11 + 5, y + 4); c.closePath();
      c.fillStyle = m.lane ? "#f0e6c8" : col; c.fill(); c.strokeStyle = "#fff"; c.lineWidth = 1.2; c.stroke();
    }
    if (m.remote) D.text(c, "⏱" + Math.max(0, m.expires - G.S.turn), x, y - 13, 11, "#333", "center", 700);
    if (m.lane) D.text(c, "LANE", x, y - 12, 10, "#333", "center", 700);
    c.restore();
  };
  D.objective = function (c, i, h) {
    const x = D.cx(i) + D.R * 0.42, y = D.cy(i) - D.R * 0.35, col = D.side(h.obj.owner);
    c.strokeStyle = "#333"; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y + 16); c.lineTo(x, y - 14); c.stroke();
    c.fillStyle = col; c.beginPath(); c.moveTo(x, y - 14); c.lineTo(x + 17, y - 9); c.lineTo(x, y - 4); c.closePath(); c.fill();
    c.strokeStyle = "#fff"; c.lineWidth = 1.2; c.stroke();
    D.text(c, "★", x + 6, y - 9, 8, "#fff", "center", 700);
  };

  /* ======================= units ======================= */
  const sprites = {};
  D.sprite = (tid) => {
    if (sprites[tid] === undefined) {
      sprites[tid] = null;
      if (typeof Image !== "undefined" && (MG.SPRITES || []).indexOf(tid) >= 0) { const im = new Image(); im.onload = () => { sprites[tid] = im; }; im.onerror = () => {}; im.src = "assets/units/" + tid + ".webp"; }
    }
    return sprites[tid];
  };
  const OLIVE = { DE: ["#4f5a43", "#6b7759", "#3a4231"], RU: ["#59613f", "#78805a", "#3d4430"], US: ["#a8956a", "#c2b08a", "#7a6a48"], CN: ["#55673f", "#74865a", "#3c4a2c"] };

  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r); c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath(); }
  function hull(c, w, h, col, wheels) {
    c.fillStyle = "rgba(0,0,0,0.25)"; rr(c, -w / 2 + 1.5, -h / 2 + 2.5, w, h, 3); c.fill();
    if (wheels) { c.fillStyle = "#222"; for (let s = 0; s < 4; s++) { c.fillRect(-w / 2 + 3 + s * (w - 8) / 3, -h / 2 - 2, 4, 3); c.fillRect(-w / 2 + 3 + s * (w - 8) / 3, h / 2 - 1, 4, 3); } }
    else { c.fillStyle = "#2b2e27"; rr(c, -w / 2, -h / 2 - 1.5, w, 3.5, 1.5); c.fill(); rr(c, -w / 2, h / 2 - 2, w, 3.5, 1.5); c.fill(); }
    c.fillStyle = col[0]; rr(c, -w / 2 + 1, -h / 2 + 1.5, w - 2, h - 3, 3); c.fill();
    c.fillStyle = col[1]; rr(c, -w / 2 + 3, -h / 2 + 3, w - 8, (h - 6) / 2, 2); c.fill();
  }
  function soldiers(c, n, col) {
    for (let s = 0; s < n; s++) {
      const x = (s - (n - 1) / 2) * 9, y = (s % 2) * 6 - 3;
      c.fillStyle = "rgba(0,0,0,0.25)"; c.beginPath(); c.arc(x + 1, y + 1.5, 4, 0, U.TAU); c.fill();
      c.fillStyle = col[0]; c.beginPath(); c.arc(x, y, 4, 0, U.TAU); c.fill();
      c.fillStyle = col[1]; c.beginPath(); c.arc(x - 1, y - 1, 2, 0, U.TAU); c.fill();
      c.strokeStyle = "#222"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x + 2, y + 1); c.lineTo(x + 9, y - 1); c.stroke();
    }
  }
  function rotor(c, x, y, r, blades, t, coax) {
    c.save(); c.translate(x, y);
    c.fillStyle = "rgba(40,40,40,0.13)"; c.beginPath(); c.arc(0, 0, r, 0, U.TAU); c.fill();
    c.strokeStyle = "rgba(30,30,30,0.55)"; c.lineWidth = 2.2;
    for (const dir of coax ? [1, -1] : [1]) {
      const a0 = t * 9 * dir;
      for (let b = 0; b < blades; b++) { const a = a0 + (U.TAU / blades) * b; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * r, Math.sin(a) * r); c.stroke(); }
    }
    c.fillStyle = "#333"; c.beginPath(); c.arc(0, 0, 2.5, 0, U.TAU); c.fill();
    c.restore();
  }
  function heli(c, col, kind, t, landed) {
    const L = kind === "nh90" ? 34 : 32;
    // tail boom and fin
    c.fillStyle = col[2]; c.fillRect(-L * 0.62, -2, L * 0.55, 4);
    if (kind === "lkh") { c.fillStyle = col[2]; c.beginPath(); c.arc(-L * 0.62, 0, 5, 0, U.TAU); c.fill(); c.fillStyle = "#222"; c.beginPath(); c.arc(-L * 0.62, 0, 3, 0, U.TAU); c.fill(); }
    else { c.fillStyle = col[2]; c.fillRect(-L * 0.66, -7, 4, 14); }
    // body
    const bw = kind === "tiger" ? 7 : kind === "ka52" ? 10 : kind === "nh90" ? 12 : 10;
    c.fillStyle = "rgba(0,0,0,0.25)"; c.beginPath(); c.ellipse(2, 2, L * 0.34, bw / 2 + 1, 0, 0, U.TAU); c.fill();
    c.fillStyle = col[0]; c.beginPath(); c.ellipse(0, 0, L * 0.34, bw / 2, 0, 0, U.TAU); c.fill();
    c.fillStyle = "rgba(150,200,230,0.8)"; c.beginPath(); c.ellipse(L * 0.2, 0, L * 0.11, bw / 2 - 1.2, 0, 0, U.TAU); c.fill();
    if (kind === "tiger" || kind === "ka52") { c.fillStyle = col[2]; c.fillRect(-3, -bw / 2 - 7, 6, bw + 14); c.fillStyle = "#e8e2d0"; c.fillRect(-4, -bw / 2 - 8, 8, 3); c.fillRect(-4, bw / 2 + 5, 8, 3); }
    if (kind === "lkh") { // one station per side with a quad Spike ER2 launcher
      c.fillStyle = col[2]; c.fillRect(-1, -bw / 2 - 4, 3, bw + 8);
      for (const sgn of [-1, 1]) { c.fillStyle = "#6f7563"; c.fillRect(-6, sgn * (bw / 2 + 4) - 3, 11, 6); c.fillStyle = "#3b3f33"; for (let q = 0; q < 2; q++) c.fillRect(-6, sgn * (bw / 2 + 4) - 3 + q * 3.2, 11, 0.8); }
    }
    if (kind === "tiger") { c.fillStyle = "#333"; c.beginPath(); c.arc(-1, 0, 3.5, 0, U.TAU); c.fill(); }
    const blades = kind === "lkh" ? 5 : kind === "ka52" ? 3 : 4;
    rotor(c, -1, 0, kind === "nh90" ? 21 : 19, blades, landed ? 0 : t, kind === "ka52");
  }
  // a simple top-down silhouette per icon, facing right (+x)
  function silhouette(c, icon, side, t, landed) {
    const col = OLIVE[side] || OLIVE.DE;
    switch (icon) {
      case "tank": hull(c, 32, 18, col); c.fillStyle = col[2]; rr(c, -8, -6, 15, 12, 4); c.fill(); c.fillStyle = col[1]; rr(c, -6, -4, 9, 5, 2); c.fill(); c.fillStyle = col[2]; c.fillRect(6, -1.5, 18, 3); break;
      case "ifv": hull(c, 30, 16, col); c.fillStyle = col[2]; rr(c, -2, -5, 10, 10, 3); c.fill(); c.fillRect(7, -1, 9, 2); break;
      case "apc": hull(c, 30, 14, col, true); c.fillStyle = col[2]; c.beginPath(); c.arc(2, 0, 4, 0, U.TAU); c.fill(); c.fillRect(4, -1, 7, 2); break;
      case "recon": hull(c, 24, 13, col, true); c.fillStyle = "#333"; c.fillRect(-3, -1.5, 3, 3); c.strokeStyle = "#333"; c.beginPath(); c.arc(-1.5, 0, 5, 0, U.TAU); c.lineWidth = 1; c.stroke(); break;
      case "arty": hull(c, 30, 18, col); c.fillStyle = col[2]; rr(c, -9, -7, 16, 14, 3); c.fill(); c.fillRect(6, -1.5, 22, 3); break;
      case "mlrs": hull(c, 30, 16, col, side === "RU"); c.fillStyle = "#3a3f33"; c.fillRect(-12, -6, 18, 12); c.strokeStyle = "#666d5c"; c.lineWidth = 1; for (let s = -10; s < 6; s += 3) { c.beginPath(); c.moveTo(s, -6); c.lineTo(s, 6); c.stroke(); } break;
      case "spaag": hull(c, 30, 16, col, side === "DE" || side === "RU"); c.fillStyle = col[2]; rr(c, -6, -6, 12, 12, 3); c.fill(); c.fillRect(5, -4, 12, 2); c.fillRect(5, 2, 12, 2); c.strokeStyle = "#ddd"; c.lineWidth = 1.5; c.beginPath(); c.arc(-9, 0, 5, -1.2, 1.2); c.stroke(); break;
      case "sam": hull(c, 32, 15, col, side === "DE"); c.fillStyle = "#3d4434"; c.save(); c.rotate(0); c.fillRect(-12, -6, 20, 12); c.restore(); c.fillStyle = "#c9c9c0"; for (let s = 0; s < 4; s++) c.fillRect(-10 + s * 4.5, -5, 2.5, 10); c.strokeStyle = "#eee"; c.lineWidth = 1.5; c.beginPath(); c.arc(12, 0, 4, 0, U.TAU); c.stroke(); break;
      case "bridge": hull(c, 30, 16, col); c.fillStyle = "#8b8f78"; c.fillRect(-16, -8, 34, 16); c.strokeStyle = "#5b5f4c"; c.lineWidth = 1; for (let s = -14; s < 18; s += 5) { c.beginPath(); c.moveTo(s, -8); c.lineTo(s, 8); c.stroke(); } break;
      case "clear": hull(c, 30, 18, col); c.fillStyle = "#555"; c.beginPath(); c.moveTo(15, -11); c.lineTo(22, 0); c.lineTo(15, 11); c.lineTo(18, 0); c.closePath(); c.fill(); c.fillStyle = col[2]; c.fillRect(-6, -5, 10, 10); break;
      case "minelayer": hull(c, 28, 16, col); c.fillStyle = "#3b3f33"; c.fillRect(-20, -5, 8, 10); c.fillStyle = "#c33"; c.beginPath(); c.arc(-22, -6, 2, 0, U.TAU); c.arc(-24, 4, 2, 0, U.TAU); c.fill(); break;
      case "lm": hull(c, 26, 14, col, true); c.fillStyle = "#3b3f33"; c.fillRect(-10, -5, 12, 10); c.fillStyle = "#ddd"; c.beginPath(); c.moveTo(18, 0); c.lineTo(10, -7); c.lineTo(12, 0); c.lineTo(10, 7); c.closePath(); c.fill(); break;
      case "farp":
        c.strokeStyle = "#f2f2f2"; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 18, 0, U.TAU); c.stroke(); D.text(c, "H", 0, 1, 18, "#f2f2f2", "center", 700);
        c.fillStyle = "#555c4a"; rr(c, -24, 8, 18, 8, 3); c.fill(); c.fillStyle = "#b9b38e"; rr(c, -22, 9.5, 12, 5, 2.5); c.fill(); c.fillStyle = "#4a5141"; c.fillRect(10, 8, 12, 8); break;
      case "inf": soldiers(c, 3, col); break;
      case "para": soldiers(c, 3, col); c.strokeStyle = "#eee"; c.lineWidth = 1.5; c.beginPath(); c.arc(0, -8, 10, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); break;
      case "eng": soldiers(c, 2, col); c.strokeStyle = "#d9c48a"; c.lineWidth = 2; c.beginPath(); c.moveTo(-14, 8); c.lineTo(-4, -2); c.stroke(); break;
      case "uav": c.fillStyle = "rgba(0,0,0,0.2)"; c.beginPath(); c.ellipse(3, 4, 12, 3, 0, 0, U.TAU); c.fill(); c.fillStyle = "#d9d9d0"; c.fillRect(-12, -1.5, 22, 3); c.fillRect(-2, -14, 5, 28); c.fillRect(-12, -5, 3, 10); break;
      case "tiger": case "lkh": case "nh90": case "ka52": heli(c, col, icon, t, landed); break;
      default: hull(c, 28, 16, col);
    }
  }

  // main rotor blades over a picture: spinning with a blurred disc in flight, still when landed
  function rotors(c, list, sc, t, seed) {
    for (const ro of list) {
      const hx = (ro.x - 128) * sc, hy = (ro.y - 128) * sc, r = ro.r * sc, ry = ro.ry, dir = ro.dir || 1;
      c.save(); c.translate(hx, hy);
      if (t != null) {
        c.fillStyle = "rgba(35,38,35,0.16)"; c.beginPath(); c.ellipse(0, 0, r, r * ry, 0, 0, U.TAU); c.fill();
        c.strokeStyle = "rgba(255,255,255,0.10)"; c.lineWidth = 1; c.stroke();
      }
      const base = t == null ? 0.35 + seed : dir * (t * 13 + seed);
      for (let b = 0; b < ro.n; b++) {
        const a = base + (U.TAU / ro.n) * b;
        const trails = t == null ? [[0, 0.95]] : [[0, 0.85], [-0.1 * dir, 0.45], [-0.2 * dir, 0.25], [-0.3 * dir, 0.12]];
        for (const [da, al] of trails) {
          const aa = a + da, ex = Math.cos(aa) * r, ey = Math.sin(aa) * r * ry;
          c.strokeStyle = `rgba(28,30,28,${al})`; c.lineCap = "round";
          c.lineWidth = Math.max(1.8, 9 * sc * (1 - 0.3 * Math.abs(Math.sin(aa))));
          c.beginPath(); c.moveTo(0, 0); c.lineTo(ex, ey); c.stroke();
          if (da === 0) { c.fillStyle = `rgba(230,200,60,${al})`; c.beginPath(); c.arc(ex, ey, Math.max(0.8, 2.2 * sc), 0, U.TAU); c.fill(); }
        }
      }
      c.fillStyle = "#2a2d29"; c.beginPath(); c.ellipse(0, 0, 6 * sc, 4 * sc, 0, 0, U.TAU); c.fill();
      c.restore();
    }
  }

  // one unit, centred at x,y in world units, scale s
  D.unit = function (c, u, x, y, s, opt = {}) {
    const R = D.R * s, T = u.type, col = D.side(u.side);
    const air = G.isFlying(u);
    const t = opt.time || 0;
    c.save();
    // party plate (lesser opacity than in the readability study, as decided)
    if (opt.plates !== false) {
      if (T.isAir) { c.beginPath(); c.arc(x, y, R * 0.62, 0, U.TAU); }
      else D.hexPath(c, x, y, R * 0.84);
      c.fillStyle = D.rgba(col, opt.dim ? 0.18 : 0.42); c.fill();
      c.lineWidth = 1.6 * s; c.strokeStyle = opt.dim ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.9)";
      if (T.isAir) c.setLineDash([4 * s, 3 * s]);
      c.stroke(); c.setLineDash([]);
    }
    if (air) { c.fillStyle = "rgba(0,0,0,0.16)"; c.beginPath(); c.ellipse(x + 6 * s, y + 12 * s, 16 * s, 6 * s, 0, 0, U.TAU); c.fill(); }
    const img = D.sprite(u.tid);
    const face = u.side === G.S.scen.player ? 1 : -1;
    c.translate(x, y - (air ? 4 * s : 0));
    if (opt.dim) c.globalAlpha = 0.55;
    if (img) {
      const w = R * (T.isAir ? 1.75 : T.mob === "foot" ? 1.35 : 1.55);
      c.scale(face, 1);
      if (opt.plates !== false) { c.shadowColor = "rgba(0,0,0,0.55)"; c.shadowBlur = 5 * s; c.shadowOffsetX = 2 * s * face; c.shadowOffsetY = (air ? 9 : 3) * s; }
      c.drawImage(img, -w / 2, -w / 2, w, w);
      c.shadowColor = "transparent"; c.shadowBlur = 0; c.shadowOffsetX = c.shadowOffsetY = 0;
      const rot = MG.ROTORS && MG.ROTORS[u.tid];
      if (rot) rotors(c, rot, w / 256, u.landed ? null : t, u.id);
      c.scale(face, 1);
    }
    else { c.scale(s * face * 1.2, s * 1.2); silhouette(c, T.icon, u.side, t, u.landed); }
    c.restore();
    // strength and status
    const bx = x + R * 0.18, by = y + R * 0.38;
    c.fillStyle = "#fff"; c.fillRect(bx, by, 20 * s, 13 * s);
    c.strokeStyle = col; c.lineWidth = 1.5; c.strokeRect(bx, by, 20 * s, 13 * s);
    D.text(c, String(u.str), bx + 10 * s, by + 7 * s, 11 * s, u.str <= 3 ? "#c0392b" : "#111", "center", 700);
    let sx = x - R * 0.55;
    const flag = (txt, bg) => { c.fillStyle = bg; c.fillRect(sx, by, 13 * s, 13 * s); D.text(c, txt, sx + 6.5 * s, by + 7 * s, 10 * s, "#fff", "center", 700); sx += 14 * s; };
    if (opt.own) {
      if (T.isAir && T.fuel && u.fuel <= T.move) flag("F", "#d35400");
      if (T.ammo && u.ammo <= 0) flag("A", "#c0392b");
      if (u.landed) flag(u.grounded ? "!" : "L", u.grounded ? "#c0392b" : "#566573");
      if (u.cargo) flag("+", "#1e8449");
      if (u.entrench > 0 && !T.isAir) flag(String(u.entrench), "#7d6e4f");
    }
    for (let k = 0; k < G.stars(u); k++) D.text(c, "★", x - R * 0.2 + k * 8 * s, y - R * 0.58, 9 * s, "#f5c542", "center", 700);
    // an attack helicopter that has already fired this turn: a struck-through crosshair
    if (opt.own && T.isAir && !T.cap && u.attacked && !u.landed) {
      const fx = x + R * 0.5, fy = y - R * 0.52, r = 10 * s;
      c.save();
      c.fillStyle = "#a0281e"; c.strokeStyle = "#fff"; c.lineWidth = 1.5 * s;
      c.beginPath(); c.arc(fx, fy, r, 0, U.TAU); c.fill(); c.stroke();
      c.lineWidth = 1.3 * s;
      c.beginPath(); c.arc(fx, fy, r * 0.5, 0, U.TAU);
      c.moveTo(fx - r * 0.8, fy); c.lineTo(fx + r * 0.8, fy); c.moveTo(fx, fy - r * 0.8); c.lineTo(fx, fy + r * 0.8); c.stroke();
      c.lineWidth = 2.2 * s; c.beginPath(); c.moveTo(fx - r * 0.7, fy + r * 0.7); c.lineTo(fx + r * 0.7, fy - r * 0.7); c.stroke();
      c.restore();
    }
  };

  /* ======================= effects ======================= */
  D.fx = function (c, f, now, toWorld) {
    const age = now - f.t0;
    if (age < 0) return;
    const x0 = D.cx(f.from), y0 = D.cy(f.from) - (f.fromAir ? 10 : 0), x1 = D.cx(f.to), y1 = D.cy(f.to) - (f.toAir ? 14 : 0);
    const dur = f.dur || (f.kind === "shell" ? 0.55 : f.kind === "aa" ? 0.3 : f.kind === "shot" ? 0.15 : 0.35);
    const p = U.clamp(age / dur, 0, 1);
    const x = U.lerp(x0, x1, p), y = U.lerp(y0, y1, p) - (f.kind === "shell" ? Math.sin(p * Math.PI) * 60 : 0);
    if (age > dur + 0.25) return;
    if (p < 1) {
      if (f.kind === "shot") { c.strokeStyle = "#ffe27a"; c.lineWidth = 2.5; c.beginPath(); c.moveTo(U.lerp(x0, x1, Math.max(0, p - 0.35)), U.lerp(y0, y1, Math.max(0, p - 0.35))); c.lineTo(x, y); c.stroke(); }
      else {
        const trail = f.kind === "drone" ? "rgba(60,60,60,0.5)" : f.kind === "aa" ? "rgba(255,255,255,0.8)" : "rgba(240,240,240,0.75)";
        c.strokeStyle = trail; c.lineWidth = f.kind === "aa" ? 2 : 2.5; c.beginPath();
        for (let k = 0; k <= 10; k++) { const q = (p * k) / 10, yy = U.lerp(y0, y1, q) - (f.kind === "shell" ? Math.sin(q * Math.PI) * 60 : 0); if (k === 0) c.moveTo(U.lerp(x0, x1, q), yy); else c.lineTo(U.lerp(x0, x1, q), yy); }
        c.stroke();
        c.fillStyle = f.kind === "drone" ? "#333" : "#ff9a3c"; c.beginPath(); c.arc(x, y, f.kind === "drone" ? 4 : 3, 0, U.TAU); c.fill();
      }
    }
  };
  D.boom = function (c, b, now) {
    const age = now - b.t0;
    if (age < 0 || age > 1.1) return;
    const x = D.cx(b.i), y = D.cy(b.i) - (b.air ? 14 : 0), s = b.size || 1;
    const r = (8 + age * 50) * s;
    c.fillStyle = `rgba(255,${Math.round(200 - age * 150)},60,${Math.max(0, 0.85 - age)})`; c.beginPath(); c.arc(x, y, r * 0.6, 0, U.TAU); c.fill();
    c.fillStyle = `rgba(90,90,90,${Math.max(0, 0.5 - age * 0.45)})`; c.beginPath(); c.arc(x + age * 10, y - age * 20, r * 0.8, 0, U.TAU); c.fill();
  };
})(window.MG);
