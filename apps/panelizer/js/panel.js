/* ===================================================================
 * Gerber Panelizer: the panel (no dependencies besides ../gerber-viewer/gerber.js)
 * -------------------------------------------------------------------
 * - Board designs from Gerber and Excellon files
 * - Gerber commands read into a neutral list (mm, absolute, multi-quadrant
 *   arcs, step and repeat expanded) and written again moved and rotated,
 *   with apertures and aperture macros rotated and in mm
 * - Layout in rows, frame, tabs with mouse bites or V-score, fiducials and
 *   tooling holes, the milling outline as boundary of boards, tabs and frame
 * - Gerber X2 and Excellon output
 * Global: PANEL
 * =================================================================== */
(function (global) {
  "use strict";
  const G = global.GERBER;
  const EPS = 1e-6;

  /* ================================================================
   * Number formatting
   * ================================================================ */
  function fmtN(v, dec = 6) { const s = (Math.round(v * Math.pow(10, dec)) / Math.pow(10, dec)).toFixed(dec).replace(/\.?0+$/, ""); return s === "-0" ? "0" : s; }
  function coordStr(v) { return String(Math.round(v * 1e6)); }        // %FSLAX46Y46%, mm

  /* ================================================================
   * Aperture macro expressions
   * ================================================================ */
  function evalExpr(expr, vars) {
    const s = expr.replace(/\s+/g, "").replace(/[xX]/g, "*");
    let i = 0;
    const num = () => {
      if (s[i] === "(") { i++; const v = add(); i++; return v; }
      if (s[i] === "-") { i++; return -num(); }
      if (s[i] === "+") { i++; return num(); }
      if (s[i] === "$") { let j = i + 1; while (j < s.length && /\d/.test(s[j])) j++; const v = vars[+s.slice(i + 1, j)] || 0; i = j; return v; }
      let j = i; while (j < s.length && /[\d.]/.test(s[j])) j++;
      const v = parseFloat(s.slice(i, j)); i = j; return isNaN(v) ? 0 : v;
    };
    const mul = () => { let v = num(); while (s[i] === "*" || s[i] === "/") { const op = s[i++]; const w = num(); v = op === "*" ? v * w : v / w; } return v; };
    const add = () => { let v = mul(); while (s[i] === "+" || s[i] === "-") { const op = s[i++]; const w = mul(); v = op === "+" ? v + w : v - w; } return v; };
    return add();
  }
  function rotPt(x, y, deg) {
    const r = ((deg % 360) + 360) % 360;
    if (r === 0) return [x, y];
    if (r === 90) return [-y, x];
    if (r === 180) return [-x, -y];
    if (r === 270) return [y, -x];
    const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    return [x * c - y * s, x * s + y * c];
  }
  const normDeg = (d) => fmtN(((d % 360) + 360) % 360, 4);

  /* A macro with the parameters of one aperture as literal primitives: lengths in mm (factor k),
   * turned by rot degrees. → array of primitive strings */
  function instantiateMacro(blocks, params, k, rot) {
    const vars = [0].concat(params), out = [];
    for (const raw of blocks) {
      const b = raw.trim();
      if (!b || b[0] === "0") continue;
      if (b[0] === "$") { const m = /^\$(\d+)=(.*)$/.exec(b); if (m) vars[+m[1]] = evalExpr(m[2], vars); continue; }
      const f = b.split(",").map((e) => evalExpr(e, vars)), code = f[0], L = (v) => fmtN(v * k);
      if (code === 1) {
        let [cx, cy] = rotPt(f[3] * k, f[4] * k, (f[5] || 0) + rot);
        out.push(["1", f[1], L(f[2]), fmtN(cx), fmtN(cy)].join(","));
      } else if (code === 20 || code === 2) {
        out.push(["20", f[1], L(f[2]), L(f[3]), L(f[4]), L(f[5]), L(f[6]), normDeg((f[7] || 0) + rot)].join(","));
      } else if (code === 21) {
        out.push(["21", f[1], L(f[2]), L(f[3]), L(f[4]), L(f[5]), normDeg((f[6] || 0) + rot)].join(","));
      } else if (code === 22) {                       // lower-left corner → centre line
        out.push(["21", f[1], L(f[2]), L(f[3]), L(f[4] + f[2] / 2), L(f[5] + f[3] / 2), normDeg((f[6] || 0) + rot)].join(","));
      } else if (code === 4) {
        const n = Math.round(f[2]), pts = [];
        for (let i = 0; i <= n; i++) pts.push(L(f[3 + 2 * i]), L(f[4 + 2 * i]));
        out.push(["4", f[1], n].concat(pts, [normDeg((f[5 + 2 * n] || 0) + rot)]).join(","));
      } else if (code === 5) {
        out.push(["5", f[1], Math.round(f[2]), L(f[3]), L(f[4]), L(f[5]), normDeg((f[6] || 0) + rot)].join(","));
      } else if (code === 6) {
        out.push(["6", L(f[1]), L(f[2]), L(f[3]), L(f[4]), L(f[5]), Math.round(f[6]), L(f[7]), L(f[8]), normDeg((f[9] || 0) + rot)].join(","));
      } else if (code === 7) {
        out.push(["7", L(f[1]), L(f[2]), L(f[3]), L(f[4]), L(f[5]), normDeg((f[6] || 0) + rot)].join(","));
      }
    }
    return out;
  }

  /* ================================================================
   * Gerber → neutral command list
   * ops: {t:"D", d} aperture, {t:"LP", c} polarity clear, {t:"G36"}, {t:"G37"},
   *      {t:"M", x, y}, {t:"L", x, y}, {t:"A", x, y, i, j, cw}, {t:"F", x, y}
   * ================================================================ */
  function readGerber(text) {
    const ops = [], aps = {}, macros = {}, warnings = new Set();
    let k = 25.4, fmt = { xi: 2, xd: 4, yi: 2, yd: 4, trailing: false, incremental: false };
    let x = 0, y = 0, interp = 1, quadrant = 75, lastD = 2, region = false, sr = null;

    function coord(s, isX) {
      if (s.includes(".")) return parseFloat(s) * k;
      const neg = s[0] === "-"; s = s.replace(/^[+-]/, "");
      const i = isX ? fmt.xi : fmt.yi, d = isX ? fmt.xd : fmt.yd;
      if (fmt.trailing) s = s.padEnd(i + d, "0");
      const v = parseInt(s, 10) / Math.pow(10, d);
      return (neg ? -v : v) * k;
    }
    function closeSR() {
      if (!sr) return;
      const block = ops.splice(sr.start);
      for (let ix = 0; ix < sr.nx; ix++) for (let iy = 0; iy < sr.ny; iy++) {
        const dx = ix * sr.dx, dy = iy * sr.dy;
        for (const o of block) ops.push(o.x === undefined ? o : Object.assign({}, o, { x: o.x + dx, y: o.y + dy }));
      }
      sr = null;
    }

    // commands: %…% extended, else word commands ending with *
    const cmds = [];
    for (let i = 0, n = text.length; i < n;) {
      const c = text[i];
      if (c === "%") { const j = text.indexOf("%", i + 1); if (j < 0) break; cmds.push({ ext: true, s: text.slice(i + 1, j).replace(/\s+/g, "") }); i = j + 1; }
      else if (c === "\r" || c === "\n" || c === " " || c === "\t") i++;
      else { const j = text.indexOf("*", i); if (j < 0) break; cmds.push({ ext: false, s: text.slice(i, j).replace(/\s+/g, "") }); i = j + 1; }
    }

    for (const cmd of cmds) {
      let s = cmd.s;
      if (cmd.ext) {
        const blocks = s.split("*").filter((b) => b.length);
        if (!blocks.length) continue;
        if (blocks[0].startsWith("AM")) { macros[blocks[0].slice(2)] = blocks.slice(1); continue; }
        for (const b of blocks) {
          if (b.startsWith("FS")) {
            const m = /FS([LTD]?)([AI]?)(?:N\d)?(?:G\d)?X(\d)(\d)Y(\d)(\d)/.exec(b);
            if (m) fmt = { trailing: m[1] === "T", incremental: m[2] === "I", xi: +m[3], xd: +m[4], yi: +m[5], yd: +m[6] };
          } else if (b.startsWith("MO")) k = b.startsWith("MOMM") ? 1 : 25.4;
          else if (b.startsWith("AD")) {
            const m = /^ADD(\d+)([A-Za-z_.$][^,]*)(?:,(.*))?$/.exec(b);
            if (!m) continue;
            const p = m[3] ? m[3].split(/[Xx]/).map(parseFloat) : [];
            aps[m[1]] = ["C", "R", "O", "P"].includes(m[2]) ? { type: m[2], p, k } : { type: "M", name: m[2], p, k };
          } else if (b.startsWith("LP")) ops.push({ t: "LP", c: b[2] === "C" });
          else if (b.startsWith("SR")) {
            closeSR();
            const m = /SRX(\d+)Y(\d+)I([\d.]+)J([\d.]+)/.exec(b);
            if (m && (+m[1] > 1 || +m[2] > 1)) sr = { start: ops.length, nx: +m[1], ny: +m[2], dx: +m[3] * k, dy: +m[4] * k };
          } else if (/^(LM|LR|LS)/.test(b)) {
            if (!/^LMN|^LR0(\.0*)?$|^LS1(\.0*)?$/.test(b)) warnings.add("mirroring, rotation or scaling of apertures (" + b.slice(0, 2) + ") is not supported");
          } else if (b.startsWith("AB")) warnings.add("block apertures (AB) are not supported");
          else if (b.startsWith("IPNEG")) warnings.add("negative image polarity is not supported");
          else if (/^(OF|IR|SF|MI)/.test(b) && !/^(OFA0B0|IR0|SFA1B1|MIA0B0)/.test(b)) warnings.add("image transformation " + b.slice(0, 2) + " is not supported");
        }
        continue;
      }
      if (!s) continue;
      if (s.startsWith("G04") || /^G4(\D|$)/.test(s)) continue;
      if (s.startsWith("M02") || s.startsWith("M00")) break;
      let m;
      while ((m = /^G0?(\d+)/.exec(s))) {
        const g = +m[1];
        if (g === 1 || g === 2 || g === 3) interp = g;
        else if (g === 74 || g === 75) quadrant = g;
        else if (g === 36) { region = true; ops.push({ t: "G36" }); }
        else if (g === 37) { region = false; ops.push({ t: "G37" }); }
        else if (g === 70) k = 25.4;
        else if (g === 71) k = 1;
        else if (g === 90) fmt.incremental = false;
        else if (g === 91) fmt.incremental = true;
        s = s.slice(m[0].length);
      }
      if (!s) continue;
      const dm = /D0*(\d+)$/.exec(s);
      let d = dm ? +dm[1] : null;
      if (d !== null && d >= 10) { if (!aps[d]) warnings.add("undefined aperture D" + d); ops.push({ t: "D", d: String(d) }); continue; }
      const cx = /X([+-]?[\d.]+)/.exec(s), cy = /Y([+-]?[\d.]+)/.exec(s), ci = /I([+-]?[\d.]+)/.exec(s), cj = /J([+-]?[\d.]+)/.exec(s);
      if (!cx && !cy && d === null) continue;
      if (d === null) d = lastD; else lastD = d;
      let nx = x, ny = y;
      if (fmt.incremental) { if (cx) nx = x + coord(cx[1], true); if (cy) ny = y + coord(cy[1], false); }
      else { if (cx) nx = coord(cx[1], true); if (cy) ny = coord(cy[1], false); }
      const ii = ci ? coord(ci[1], true) : 0, jj = cj ? coord(cj[1], false) : 0;
      if (d === 1) {
        if (interp === 1) ops.push({ t: "L", x: nx, y: ny });
        else {
          const cw = interp === 2;
          let ccx = x + ii, ccy = y + jj;
          if (quadrant === 74) {
            // single quadrant: the sign of I and J is not given; take the centre for an arc of at most 90°
            let best = null;
            for (const sx of [1, -1]) for (const sy of [1, -1]) {
              const tx = x + sx * Math.abs(ii), ty = y + sy * Math.abs(jj);
              const r0 = Math.hypot(x - tx, y - ty), r1 = Math.hypot(nx - tx, ny - ty);
              let sw = Math.atan2(ny - ty, nx - tx) - Math.atan2(y - ty, x - tx);
              if (cw) { if (sw > 0) sw -= 2 * Math.PI; } else if (sw < 0) sw += 2 * Math.PI;
              const err = Math.abs(r0 - r1) + (Math.abs(sw) > Math.PI / 2 + 1e-6 ? 1e6 : 0);
              if (!best || err < best.err) best = { err, tx, ty };
            }
            ccx = best.tx; ccy = best.ty;
            if (Math.abs(nx - x) < 1e-9 && Math.abs(ny - y) < 1e-9) { x = nx; y = ny; continue; }   // zero-length quadrant arc
          }
          ops.push({ t: "A", x: nx, y: ny, i: ccx - x, j: ccy - y, cw });
        }
      } else if (d === 2) ops.push({ t: "M", x: nx, y: ny });
      else if (d === 3) { if (!region) ops.push({ t: "F", x: nx, y: ny }); }
      x = nx; y = ny;
    }
    closeSR();
    return { ops, aps, macros, warnings: [...warnings] };
  }

  /* ================================================================
   * Board designs
   * ================================================================ */
  // index of an inner copper layer (1 = first inner layer) from the X2 file function or the name
  function innerIndex(name, text) {
    const ff = /%TF\.FileFunction,Copper,L(\d+),Inr/i.exec(text.slice(0, 4000));
    if (ff) return +ff[1] - 1;
    const n = name.toLowerCase();
    let m = /in(\d+)[._-]cu/.exec(n) || /inner[_ -]?(?:layer)?[_ -]?(\d+)/.exec(n) || /\.g(?:p|l)?(\d+)$/.exec(n) || /\.in(\d+)$/.exec(n) || /\.ly(\d+)$/.exec(n);
    return m ? +m[1] : 0;
  }
  function isNonPlated(name, text) {
    if (/npth|non[_ -]?plated|nonplated|unplated/i.test(name)) return true;
    const head = text.slice(0, 3000);
    return /%TF\.FileFunction,NonPlated/i.test(head) || /;\s*TYPE\s*=\s*NON_PLATED/i.test(head) || /;\s*#@!\s*TF\.FileFunction,NonPlated/i.test(head);
  }

  // Douglas–Peucker on a closed loop (first point = last point)
  function simplify(l, tol) {
    if (l.length < 5) return l;
    const keep = new Uint8Array(l.length); keep[0] = keep[l.length - 1] = 1;
    // split the loop at the point farthest from the start, so both halves are open polylines
    let far = 0, fd = -1;
    for (let i = 1; i < l.length - 1; i++) { const d = Math.hypot(l[i][0] - l[0][0], l[i][1] - l[0][1]); if (d > fd) { fd = d; far = i; } }
    keep[far] = 1;
    const stack = [[0, far], [far, l.length - 1]];
    while (stack.length) {
      const [a, b] = stack.pop();
      if (b - a < 2) continue;
      const [x0, y0] = l[a], [x1, y1] = l[b], len = Math.hypot(x1 - x0, y1 - y0) || 1e-12;
      let mi = -1, md = 0;
      for (let i = a + 1; i < b; i++) { const d = Math.abs((x1 - x0) * (y0 - l[i][1]) - (x0 - l[i][0]) * (y1 - y0)) / len; if (d > md) { md = d; mi = i; } }
      if (md > tol) { keep[mi] = 1; stack.push([a, mi], [mi, b]); }
    }
    return l.filter((_, i) => keep[i]);
  }

  /* files: [{name, text}] (Gerber and Excellon) → design
   * {name, layers: {type: [{name, g}]}, inner: {n: [...]}, pth: [holes], npth: [holes], loops, bbox, warnings, noOutline} */
  function makeDesign(name, files) {
    const d = { name, layers: {}, inner: {}, pth: [], npth: [], loops: [], warnings: [], files: [] };
    let outline = null, innerAuto = 0;
    for (const f of files) {
      const text = f.text, isDrill = /^\s*(;[^\n]*\n\s*)*M48/m.test(text.slice(0, 2000));
      let type = G.identify(f.name, text);
      if (isDrill) type = "drill";
      else if (type !== "ignore" && !G.isGerber(text)) type = "ignore";
      d.files.push({ name: f.name, type });
      if (type === "ignore") continue;
      try {
        if (type === "drill") {
          const ex = G.parseExcellon(text);
          (isNonPlated(f.name, text) ? d.npth : d.pth).push(...ex.holes.filter((h) => h.d > 0));
          continue;
        }
        if (type === "outline") outline = outline ? outline + "\n" + text : text;
        const g = readGerber(text);
        for (const w of g.warnings) d.warnings.push(f.name + ": " + w);
        if (type === "outline") continue;
        if (type === "inner") {
          let n = innerIndex(f.name, text) || ++innerAuto;
          (d.inner[n] = d.inner[n] || []).push({ name: f.name, g });
        } else (d.layers[type] = d.layers[type] || []).push({ name: f.name, g });
      } catch (e) { d.warnings.push(f.name + ": could not be read (" + e.message + ")"); }
    }
    // the outline as closed loops (the viewer's chaining); without one, the extents of the copper
    if (outline) {
      const b = G.buildBoard([{ name: "outline", type: "outline", text: outline }]);
      d.loops = b.loops || []; d.noOutline = !!b.noOutline;
    }
    if (!d.loops.length) {
      const files2 = files.filter((f) => !/^\s*(;[^\n]*\n\s*)*M48/m.test(f.text.slice(0, 2000))).map((f) => ({ name: f.name, type: G.identify(f.name, f.text), text: f.text }))
        .filter((f) => /copper|mask/.test(f.type));
      const b = G.buildBoard(files2);
      if (b.bbox.valid()) { const x = b.bbox; d.loops = [[[x.x0, x.y0], [x.x1, x.y0], [x.x1, x.y1], [x.x0, x.y1], [x.x0, x.y0]]]; }
      d.noOutline = true;
    }
    // the viewer flattens arcs finely; fewer points are enough for milling (at most 2 µm off)
    d.loops = d.loops.map((l) => simplify(l, 0.002));
    if (d.noOutline) d.warnings.push("No closed board outline found; the extents of the board are used as a rectangle.");
    const bb = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    for (const l of d.loops) for (const [u, v] of l) { bb.x0 = Math.min(bb.x0, u); bb.y0 = Math.min(bb.y0, v); bb.x1 = Math.max(bb.x1, u); bb.y1 = Math.max(bb.y1, v); }
    d.bbox = bb; d.w = bb.x1 - bb.x0; d.h = bb.y1 - bb.y0;
    // the outer loop (largest area); is the board a rectangle (for V-score)?
    let best = 0, areaOf = (l) => { let a = 0; for (let i = 0; i < l.length; i++) { const p = l[i], q = l[(i + 1) % l.length]; a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a / 2); };
    d.loops.forEach((l, i) => { const a = areaOf(l); if (a > best) { best = a; d.outer = i; } });
    d.rect = d.w > 0 && d.h > 0 && d.loops[d.outer].length <= 5 && best / (d.w * d.h) > 0.999;     // four straight edges, no rounded corners
    d.layerCount = 2 + Object.keys(d.inner).length;
    if (!d.layers["top-copper"] && !d.layers["bottom-copper"]) d.warnings.push("No copper layer found.");
    return d;
  }

  /* ================================================================
   * Placement transform: rotate about the origin, then move
   * ================================================================ */
  function placement(design, rot, px, py) {
    const b = design.bbox, cs = [[b.x0, b.y0], [b.x1, b.y0], [b.x1, b.y1], [b.x0, b.y1]].map(([x, y]) => rotPt(x, y, rot));
    const rx0 = Math.min(...cs.map((c) => c[0])), ry0 = Math.min(...cs.map((c) => c[1]));
    const rx1 = Math.max(...cs.map((c) => c[0])), ry1 = Math.max(...cs.map((c) => c[1]));
    const dx = px - rx0, dy = py - ry0;
    const P = { design, rot, dx, dy, x0: px, y0: py, x1: px + rx1 - rx0, y1: py + ry1 - ry0 };
    P.tf = (x, y) => { const [u, v] = rotPt(x, y, rot); return [u + dx, v + dy]; };
    P.loops = design.loops.map((l) => l.map(([x, y]) => P.tf(x, y)));
    P.segs = [];
    P.loops.forEach((l, li) => { for (let i = 0; i + 1 < l.length; i++) P.segs.push([l[i][0], l[i][1], l[i + 1][0], l[i + 1][1], li]); });
    return P;
  }
  function sizeOf(design, rot) { return rot % 180 ? [design.h, design.w] : [design.w, design.h]; }

  /* ================================================================
   * Geometry: material tests, rays, segment splitting
   * ================================================================ */
  function insidePoly(segs, x, y) {
    let c = false;
    for (const s of segs) {
      const [x0, y0, x1, y1] = s;
      if ((y0 > y) !== (y1 > y)) { const xi = x0 + (y - y0) * (x1 - x0) / (y1 - y0); if (xi > x) c = !c; }
    }
    return c;
  }
  // a piece of material: {segs, inside(x, y), box}
  function rectPiece(x0, y0, x1, y1, kind) {
    return { kind, box: { x0, y0, x1, y1 }, segs: [[x0, y0, x1, y0], [x1, y0, x1, y1], [x1, y1, x0, y1], [x0, y1, x0, y0]],
      inside: (x, y) => x > x0 + EPS && x < x1 - EPS && y > y0 + EPS && y < y1 - EPS };
  }
  function ringPiece(o, i) {
    const a = rectPiece(o.x0, o.y0, o.x1, o.y1), b = rectPiece(i.x0, i.y0, i.x1, i.y1);
    return { kind: "frame", box: o, segs: a.segs.concat(b.segs),
      inside: (x, y) => a.inside(x, y) && !(x >= i.x0 - EPS && x <= i.x1 + EPS && y >= i.y0 - EPS && y <= i.y1 + EPS) };
  }
  function boardPiece(P) {
    return { kind: "board", P, box: { x0: P.x0, y0: P.y0, x1: P.x1, y1: P.y1 }, segs: P.segs,
      inside: (x, y) => x > P.x0 - EPS && x < P.x1 + EPS && y > P.y0 - EPS && y < P.y1 + EPS && insidePoly(P.segs, x, y) };
  }
  // t (0…1) on segment a where it crosses segment b, or null
  function cross(a, b) {
    const dx = a[2] - a[0], dy = a[3] - a[1], ex = b[2] - b[0], ey = b[3] - b[1];
    const den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-12) return null;
    const t = ((b[0] - a[0]) * ey - (b[1] - a[1]) * ex) / den, u = ((b[0] - a[0]) * dy - (b[1] - a[1]) * dx) / den;
    return t > 1e-9 && t < 1 - 1e-9 && u >= -1e-9 && u <= 1 + 1e-9 ? t : null;
  }
  function boxHit(s, b, m = 0) { return Math.max(s[0], s[2]) >= b.x0 - m && Math.min(s[0], s[2]) <= b.x1 + m && Math.max(s[1], s[3]) >= b.y0 - m && Math.min(s[1], s[3]) <= b.y1 + m; }
  // split segment s at the crossings with the segments of the pieces, keep the parts outside all of them
  function keepOutside(s, cutters, testers) {
    const ts = [0, 1];
    for (const p of cutters) { if (!boxHit(s, p.box, 0.01)) continue; for (const c of p.segs) { if (!boxHit(s, { x0: Math.min(c[0], c[2]), y0: Math.min(c[1], c[3]), x1: Math.max(c[0], c[2]), y1: Math.max(c[1], c[3]) }, 0.001)) continue; const t = cross(s, c); if (t !== null) ts.push(t); } }
    ts.sort((a, b) => a - b);
    const out = [];
    for (let i = 0; i + 1 < ts.length; i++) {
      const t0 = ts[i], t1 = ts[i + 1];
      if (t1 - t0 < 1e-9) continue;
      const tm = (t0 + t1) / 2, mx = s[0] + (s[2] - s[0]) * tm, my = s[1] + (s[3] - s[1]) * tm;
      if (testers.some((p) => p.inside(mx, my))) continue;
      const a = [s[0] + (s[2] - s[0]) * t0, s[1] + (s[3] - s[1]) * t0, s[0] + (s[2] - s[0]) * t1, s[1] + (s[3] - s[1]) * t1];
      // join with the previous kept part
      const last = out[out.length - 1];
      if (last && Math.abs(last[2] - a[0]) < 1e-9 && Math.abs(last[3] - a[1]) < 1e-9) { last[2] = a[2]; last[3] = a[3]; } else out.push(a);
    }
    return out.filter((a) => Math.hypot(a[2] - a[0], a[3] - a[1]) > 1e-6);
  }
  /* edge of a board seen from outside: along axis ("x" or "y") at cross position c, coming from
   * side (+1: from the high side, -1: from the low side) → coordinate of the outline, or null */
  function edgeAt(P, axis, c, side) {
    let best = null;
    for (const s of P.segs) {
      const [x0, y0, x1, y1] = s;
      if (axis === "x") {           // horizontal ray at y = c
        if ((y0 > c) === (y1 > c)) continue;
        const xi = x0 + (c - y0) * (x1 - x0) / (y1 - y0);
        if (best === null || (side > 0 ? xi > best : xi < best)) best = xi;
      } else {
        if ((x0 > c) === (x1 > c)) continue;
        const yi = y0 + (c - x0) * (y1 - y0) / (x1 - x0);
        if (best === null || (side > 0 ? yi > best : yi < best)) best = yi;
      }
    }
    return best;
  }

  /* ================================================================
   * Layout
   * o: {perRow, gap, frame: none|tb|lr|all, rail, mode: tabs|vscore, ...}
   * items: [{design, rot}] in order → {places, W, H, frame pieces, area}
   * ================================================================ */
  function layout(items, o) {
    const gap = o.mode === "vscore" ? 0 : o.gap, rail = o.frame === "none" ? 0 : o.rail;
    const fgap = o.mode === "vscore" ? 0 : o.gap;                    // between frame and boards
    const n = items.length, per = o.perRow > 0 ? o.perRow : Math.max(1, Math.ceil(Math.sqrt(n)));
    const rows = [];
    for (let i = 0; i < n; i += per) rows.push(items.slice(i, i + per));
    const rowDims = rows.map((r) => { let w = 0, h = 0; r.forEach((it, i) => { const [a, b] = sizeOf(it.design, it.rot); w += a + (i ? gap : 0); h = Math.max(h, b); }); return { w, h }; });
    const areaW = Math.max(0, ...rowDims.map((d) => d.w)), areaH = rowDims.reduce((s, d, i) => s + d.h + (i ? gap : 0), 0);
    const left = o.frame === "lr" || o.frame === "all" ? rail + fgap : 0, bottom = o.frame === "tb" || o.frame === "all" ? rail + fgap : 0;
    const W = areaW + 2 * left, H = areaH + 2 * bottom;
    const places = [];
    let top = bottom + areaH;
    rows.forEach((r, ri) => {
      const d = rowDims[ri];
      let x = left + (areaW - d.w) / 2;
      r.forEach((it) => {
        const [w, h] = sizeOf(it.design, it.rot);
        const y = o.mode === "vscore" ? top - h : top - d.h + (d.h - h) / 2;
        places.push(placement(it.design, it.rot, x, y));
        x += w + gap;
      });
      top -= d.h + gap;
    });
    // frame pieces
    const frame = [];
    if (o.frame === "all") frame.push(ringPiece({ x0: 0, y0: 0, x1: W, y1: H }, { x0: rail, y0: rail, x1: W - rail, y1: H - rail }));
    else if (o.frame === "tb") { frame.push(rectPiece(0, 0, W, rail, "frame"), rectPiece(0, H - rail, W, H, "frame")); }
    else if (o.frame === "lr") { frame.push(rectPiece(0, 0, rail, H, "frame"), rectPiece(W - rail, 0, W, H, "frame")); }
    frame.forEach((f) => { f.rail = true; });
    return { places, W, H, frame, rail, left, bottom, rows: rows.map((r) => r.length), equalSize: places.every((p) => Math.abs((p.x1 - p.x0) - (places[0].x1 - places[0].x0)) < 0.02 && Math.abs((p.y1 - p.y0) - (places[0].y1 - places[0].y0)) < 0.02) };
  }

  // inner edges of the frame facing the boards: {axis, at, from, to, side}
  function frameEdges(L, o) {
    const r = L.rail, W = L.W, H = L.H, e = [];
    // dir: the way the edge faces (the bottom rail's inner edge faces up: "T")
    if (o.frame === "all") {
      e.push({ dir: "T", at: r, a0: r, a1: W - r }, { dir: "B", at: H - r, a0: r, a1: W - r }, { dir: "R", at: r, a0: r, a1: H - r }, { dir: "L", at: W - r, a0: r, a1: H - r });
    } else if (o.frame === "tb") e.push({ dir: "T", at: r, a0: 0, a1: W }, { dir: "B", at: H - r, a0: 0, a1: W });
    else if (o.frame === "lr") e.push({ dir: "R", at: r, a0: 0, a1: H }, { dir: "L", at: W - r, a0: 0, a1: H });
    return e;
  }

  /* ================================================================
   * Tabs and mouse bites
   * o: {tabW, perEdge (0 = auto), bites, biteD, bitePitch, biteOff, maxReach}
   * → {tabs: [piece], bites: [{x, y, d}], warnings}
   * ================================================================ */
  const DIRS = { R: { axis: "x", s: 1 }, L: { axis: "x", s: -1 }, T: { axis: "y", s: 1 }, B: { axis: "y", s: -1 } };
  const OPP = { R: "L", L: "R", T: "B", B: "T" };
  function sideOf(P, dir) {
    // the line of the side and its extent along it
    if (dir === "R") return { at: P.x1, a0: P.y0, a1: P.y1 };
    if (dir === "L") return { at: P.x0, a0: P.y0, a1: P.y1 };
    if (dir === "T") return { at: P.y1, a0: P.x0, a1: P.x1 };
    return { at: P.y0, a0: P.x0, a1: P.x1 };
  }
  function tabsFor(L, o) {
    const tabs = [], bites = [], warn = new Set(), fe = frameEdges(L, o), maxGap = Math.max(o.gap * 3, o.gap + 12);
    const overlap = 0.3;
    // edge of P along the tab axis at cross position c, seen from the side dir
    const edge = (P, dir, c) => { const d = DIRS[dir]; return edgeAt(P, d.axis === "x" ? "x" : "y", c, d.s); };
    function inner(P, dir, c, w) {
      // how far the tab has to reach into P: the deepest of the edge points at c and c ± w/2
      const d = DIRS[dir], pts = [c - w / 2 + 0.05, c, c + w / 2 - 0.05].map((u) => edge(P, dir, u));
      if (pts.some((v) => v === null)) return null;
      const side = sideOf(P, dir).at;
      if (pts.some((v) => Math.abs(side - v) > o.maxReach)) return null;
      return d.s > 0 ? Math.min(...pts) - overlap : Math.max(...pts) + overlap;
    }
    function addBites(P, dir, c, w) {
      if (!o.bites) return;
      const d = DIRS[dir], n = Math.max(1, Math.floor((w - o.biteD) / o.bitePitch + 1e-9) + 1), span = (n - 1) * o.bitePitch;
      for (let i = 0; i < n; i++) {
        const u = c - span / 2 + i * o.bitePitch, e = edge(P, dir, u);
        if (e === null) continue;
        const v = e - d.s * o.biteOff;                        // moved into the board
        bites.push(d.axis === "x" ? { x: v, y: u, d: o.biteD } : { x: u, y: v, d: o.biteD });
      }
    }
    function positions(a0, a1) {
      // tab centres along the common part [a0, a1] of two edges, away from the corners
      const len = a1 - a0, w = o.tabW;
      if (len < w + 0.5) return [];
      const m = Math.min(w / 2 + Math.min(3, len * 0.15), len / 2), s0 = a0 + m, s1 = a1 - m;
      let n = o.perEdge > 0 ? o.perEdge : len < 30 ? 1 : len < 80 ? 2 : 3;
      n = Math.max(1, Math.min(n, Math.floor((s1 - s0) / (w * 1.5)) + 1));
      if (n === 1) return [(a0 + a1) / 2];
      const out = []; for (let i = 0; i < n; i++) out.push(s0 + (s1 - s0) * i / (n - 1)); return out;
    }
    function addTab(dir, c, from, to) {
      // a tab across the gap from coordinate "from" to "to" along the axis of dir, centred at c
      const d = DIRS[dir], lo = Math.min(from, to), hi = Math.max(from, to), w = o.tabW;
      tabs.push(d.axis === "x" ? rectPiece(lo, c - w / 2, hi, c + w / 2, "tab") : rectPiece(c - w / 2, lo, c + w / 2, hi, "tab"));
    }
    L.places.forEach((P, pi) => {
      ["R", "T", "L", "B"].forEach((dir) => {
        const me = sideOf(P, dir), d = DIRS[dir];
        // nearest neighbour across this side: a board (only for R and T, the other side does it) or the frame
        let best = null;
        if (dir === "R" || dir === "T") L.places.forEach((Q, qi) => {
          if (qi === pi) return;
          const them = sideOf(Q, OPP[dir]), dist = (them.at - me.at) * d.s;
          const a0 = Math.max(me.a0, them.a0), a1 = Math.min(me.a1, them.a1);
          if (dist < -1e-6 || dist > maxGap || a1 - a0 < o.tabW + 0.5) return;
          if (!best || dist < best.dist) best = { Q, dist, a0, a1 };
        });
        fe.forEach((f) => {
          if (f.dir !== OPP[dir]) return;
          const dist = (f.at - me.at) * d.s, a0 = Math.max(me.a0, f.a0), a1 = Math.min(me.a1, f.a1);
          if (dist < -1e-6 || dist > maxGap || a1 - a0 < o.tabW + 0.5) return;
          if (!best || dist < best.dist) best = { frame: f, dist, a0, a1 };
        });
        if (!best) return;
        let made = 0;
        for (const c of positions(best.a0, best.a1)) {
          const a = inner(P, dir, c, o.tabW);
          if (a === null) continue;
          let b;
          if (best.Q) { b = inner(best.Q, OPP[dir], c, o.tabW); if (b === null) continue; }
          else b = best.frame.at + d.s * overlap;
          addTab(dir, c, a, b);
          addBites(P, dir, c, o.tabW);
          if (best.Q) addBites(best.Q, OPP[dir], c, o.tabW);
          made++;
        }
        if (!made && best.Q) warn.add("Some neighbouring edges are too short or too far apart for a tab.");
      });
    });
    // every board needs at least one tab
    L.places.forEach((P) => {
      const touched = tabs.some((t) => t.box.x1 > P.x0 && t.box.x0 < P.x1 && t.box.y1 > P.y0 && t.box.y0 < P.y1);
      if (!touched) warn.add(P.design.name + ": no tab holds this board; it would fall out of the panel. Change the arrangement, spacing or tab width.");
    });
    return { tabs, bites, warnings: [...warn] };
  }

  /* ================================================================
   * Milling outline: the boundary of boards, frame and tabs
   * ================================================================ */
  function outline(L, tabs) {
    const boards = L.places.map(boardPiece), frame = L.frame, out = [];
    for (const p of boards.concat(frame)) for (const s of p.segs) {
      const near = tabs.filter((t) => boxHit(s, t.box, 0.01));
      if (!near.length) { out.push(s.slice(0, 4)); continue; }
      out.push(...keepOutside(s, near, near));
    }
    for (const t of tabs) {
      const others = boards.concat(frame).concat(tabs.filter((u) => u !== t)).filter((p) => p.box.x1 >= t.box.x0 - 0.01 && p.box.x0 <= t.box.x1 + 0.01 && p.box.y1 >= t.box.y0 - 0.01 && p.box.y0 <= t.box.y1 + 0.01);
      for (const s of t.segs) out.push(...keepOutside(s, others, others));
    }
    return out;
  }
  // V-score: outline of the whole panel plus the cut-outs inside the boards; score lines between rows and columns
  function vscore(L) {
    const xs = new Set(), ys = new Set(), r = (v) => Math.round(v * 1000) / 1000;
    L.places.forEach((P) => { xs.add(r(P.x0)); xs.add(r(P.x1)); ys.add(r(P.y0)); ys.add(r(P.y1)); });
    const lines = [];
    [...xs].filter((x) => x > 0.01 && x < L.W - 0.01).sort((a, b) => a - b).forEach((x) => lines.push([x, 0, x, L.H]));
    [...ys].filter((y) => y > 0.01 && y < L.H - 0.01).sort((a, b) => a - b).forEach((y) => lines.push([0, y, L.W, y]));
    const segs = [[0, 0, L.W, 0], [L.W, 0, L.W, L.H], [L.W, L.H, 0, L.H], [0, L.H, 0, 0]];
    L.places.forEach((P) => P.loops.forEach((l, li) => { if (li === P.design.outer) return; for (let i = 0; i + 1 < l.length; i++) segs.push([l[i][0], l[i][1], l[i + 1][0], l[i + 1][1]]); }));
    return { segs, lines };
  }

  /* ================================================================
   * Fiducials and tooling holes on the rails
   * ================================================================ */
  function railMarks(L, o) {
    const r = L.rail, W = L.W, H = L.H, holes = [], fids = [], warn = [];
    if (o.frame === "none" || (!o.tooling && !o.fiducials)) return { holes, fids, warn };
    const need = Math.max(o.tooling ? o.toolD : 0, o.fiducials ? o.fidMask : 0) + 1;
    if (r < need) { warn.push("The rails are too narrow for the fiducials and tooling holes (" + fmtN(need, 1) + " mm needed)."); return { holes, fids, warn }; }
    const e = Math.max(r / 2, 3), f = e + Math.max(o.toolD, o.fidMask) + 3;
    if (o.frame === "lr") {
      if (o.tooling) holes.push([r / 2, e], [r / 2, H - e], [W - r / 2, e], [W - r / 2, H - e]);
      if (o.fiducials) fids.push([r / 2, f], [W - r / 2, f], [W - r / 2, H - f]);
    } else {
      if (o.tooling) holes.push([e, r / 2], [W - e, r / 2], [e, H - r / 2], [W - e, H - r / 2]);
      if (o.fiducials) fids.push([f, r / 2], [f, H - r / 2], [W - f, H - r / 2]);
    }
    return { holes: holes.map(([x, y]) => ({ x, y, d: o.toolD })), fids, warn };
  }

  /* ================================================================
   * Writers
   * ================================================================ */
  const EXT = { "top-copper": "GTL", "bottom-copper": "GBL", "top-mask": "GTS", "bottom-mask": "GBS", "top-silk": "GTO", "bottom-silk": "GBO", "top-paste": "GTP", "bottom-paste": "GBP", "outline": "GKO" };
  function fileFunction(type, n, layers) {
    if (type === "top-copper") return "Copper,L1,Top";
    if (type === "bottom-copper") return "Copper,L" + layers + ",Bot";
    if (type === "inner") return "Copper,L" + (n + 1) + ",Inr";
    if (type === "top-mask") return "Soldermask,Top"; if (type === "bottom-mask") return "Soldermask,Bot";
    if (type === "top-silk") return "Legend,Top"; if (type === "bottom-silk") return "Legend,Bot";
    if (type === "top-paste") return "Paste,Top"; if (type === "bottom-paste") return "Paste,Bot";
    if (type === "outline") return "Profile,NP";
    return "Other,V-score";
  }
  function header(ff) {
    return ["%TF.GenerationSoftware,wagiminator,Gerber Panelizer,1.0*%", "%TF.FileFunction," + ff + "*%", "%TF.FilePolarity,Positive*%", "%FSLAX46Y46*%", "%MOMM*%", "G04 Panel made with the Gerber Panelizer (wagiminator.github.io)*", "%LPD*%", "G75*", "G01*"];
  }

  /* One Gerber layer of the panel. sources: [{P, g}] (a read file and its placement), extra: fn(w)
   * for marks (fiducials). → text */
  function writeLayer(type, n, layers, sources, extra) {
    const defs = [], body = [];
    let next = 10;
    const fx = (x) => "X" + coordStr(x), fy = (y) => "Y" + coordStr(y);
    for (const { P, g } of sources) {
      const map = {}, rot = P.rot;
      const apOf = (d) => {
        if (map[d] !== undefined) return map[d];
        const a = g.aps[d];
        if (!a) return (map[d] = null);
        const D = next++, k = a.k, p = a.p, hole = (v) => (v ? "X" + fmtN(v * k) : "");
        if (a.type === "C") defs.push("%ADD" + D + "C," + fmtN(p[0] * k) + hole(p[1]) + "*%");
        else if (a.type === "R" || a.type === "O") {
          const [w, h] = rot % 180 ? [p[1], p[0]] : [p[0], p[1]];
          defs.push("%ADD" + D + a.type + "," + fmtN(w * k) + "X" + fmtN(h * k) + hole(p[2]) + "*%");
        } else if (a.type === "P") {
          defs.push("%ADD" + D + "P," + fmtN(p[0] * k) + "X" + Math.round(p[1]) + "X" + normDeg((p[2] || 0) + rot) + hole(p[3]) + "*%");
        } else {
          const blocks = g.macros[a.name];
          if (!blocks) return (map[d] = null);
          const prims = instantiateMacro(blocks, p, k, rot);
          if (!prims.length) return (map[d] = null);
          defs.push("%AMPNL" + D + "*\n" + prims.join("*\n") + "*%", "%ADD" + D + "PNL" + D + "*%");
        }
        return (map[d] = D);
      };
      body.push("G04 " + P.design.name.replace(/[*%]/g, "") + "*", "%LPD*%", "G01*");
      let mode = 1, clear = false, apOk = false;
      for (const o of g.ops) {
        if (o.t === "D") { const D = apOf(o.d); apOk = D !== null; if (apOk) body.push("D" + D + "*"); continue; }
        if (o.t === "LP") { if (o.c !== clear) { clear = o.c; body.push(clear ? "%LPC*%" : "%LPD*%"); } continue; }
        if (o.t === "G36") { body.push("G36*"); continue; }
        if (o.t === "G37") { body.push("G37*"); continue; }
        const [x, y] = P.tf(o.x, o.y);
        if (o.t === "M") body.push(fx(x) + fy(y) + "D02*");
        else if (o.t === "L") { if (mode !== 1) { body.push("G01*"); mode = 1; } body.push(fx(x) + fy(y) + "D01*"); }
        else if (o.t === "A") {
          const m = o.cw ? 2 : 3, [i, j] = rotPt(o.i, o.j, rot);
          if (mode !== m) { body.push("G0" + m + "*"); mode = m; }
          body.push(fx(x) + fy(y) + "I" + coordStr(i) + "J" + coordStr(j) + "D01*");
        } else if (o.t === "F") { if (apOk) body.push(fx(x) + fy(y) + "D03*"); }
      }
      if (clear) body.push("%LPD*%");
    }
    if (extra) extra({ ap: (def) => { const D = next++; defs.push("%ADD" + D + def + "*%"); return D; }, line: (s) => body.push(s), fx, fy });
    return header(fileFunction(type, n, layers)).concat(defs, body, ["M02*"]).join("\n") + "\n";
  }
  function writeOutline(segs, ff, width) {
    const L = header(ff), fx = (x) => "X" + coordStr(x), fy = (y) => "Y" + coordStr(y);
    L.push("%ADD10C," + fmtN(width) + "*%", "D10*");
    let cx = null, cy = null;
    for (const s of segs) {
      if (cx === null || Math.abs(cx - s[0]) > 1e-7 || Math.abs(cy - s[1]) > 1e-7) L.push(fx(s[0]) + fy(s[1]) + "D02*");
      L.push(fx(s[2]) + fy(s[3]) + "D01*"); cx = s[2]; cy = s[3];
    }
    L.push("M02*");
    return L.join("\n") + "\n";
  }
  // Excellon: holes [{x, y, d}] and slots [{x, y, x1, y1, d}] in mm
  function writeDrill(holes, plated, layers) {
    const tools = [...new Set(holes.map((h) => Math.round(h.d * 1000) / 1000))].sort((a, b) => a - b);
    const L = ["M48", "; Gerber Panelizer (wagiminator.github.io)", "; #@! TF.FileFunction," + (plated ? "Plated,1," + (layers || 2) + ",PTH" : "NonPlated,1," + (layers || 2) + ",NPTH"), "FMAT,2", "METRIC,TZ"];
    tools.forEach((d, i) => L.push("T" + (i + 1) + "C" + d.toFixed(3)));
    L.push("%", "G90", "G05");
    const c = (v) => (Math.round(v * 1000) / 1000).toFixed(3);
    tools.forEach((d, i) => {
      L.push("T" + (i + 1));
      for (const h of holes) {
        if (Math.round(h.d * 1000) / 1000 !== d) continue;
        if (h.x1 !== undefined) L.push("X" + c(h.x) + "Y" + c(h.y) + "G85X" + c(h.x1) + "Y" + c(h.y1));
        else L.push("X" + c(h.x) + "Y" + c(h.y));
      }
    });
    L.push("T0", "M30");
    return L.join("\n") + "\n";
  }

  /* ================================================================
   * The whole panel
   * items: [{design, rot}], o: options → {files: [{name, type, text}], info, warnings, L, tabs, bites}
   * ================================================================ */
  function build(items, o) {
    const warnings = [];
    if (!items.length) return null;
    if (o.mode === "vscore") {
      if (items.some((it) => !it.design.rect)) warnings.push("V-score cuts straight lines only: rounded corners and other shapes of the boards are lost (cut-outs inside the boards stay). Use tabs to keep them.");
    }
    const L = layout(items, o);
    if (o.mode === "vscore" && !L.equalSize) warnings.push("V-score works best with boards of the same size: the score lines run across the whole panel.");
    let segs, vlines = [], T = { tabs: [], bites: [], warnings: [] };
    if (o.mode === "vscore") { const v = vscore(L); segs = v.segs; vlines = v.lines; }
    else { T = tabsFor(L, o); segs = outline(L, T.tabs); }
    warnings.push(...T.warnings);
    const marks = railMarks(L, o);
    warnings.push(...marks.warn);
    // layers present
    const designs = [...new Set(items.map((i) => i.design))];
    const types = ["top-copper", "bottom-copper", "top-mask", "bottom-mask", "top-silk", "bottom-silk", "top-paste", "bottom-paste"].filter((t) => designs.some((d) => d.layers[t]));
    const innerN = Math.max(0, ...designs.map((d) => Math.max(0, ...Object.keys(d.inner).map(Number))));
    const layerCount = 2 + innerN;
    if (designs.some((d) => d.layerCount !== layerCount)) warnings.push("The boards have different numbers of copper layers; the panel gets " + layerCount + ".");
    const base = (o.name || "panel").replace(/[^A-Za-z0-9_.-]+/g, "_");
    const files = [], hasBottom = designs.some((d) => d.layers["bottom-copper"]);
    const fidTypes = o.fiducials && marks.fids.length ? ["top-copper", "top-mask"].concat(hasBottom ? ["bottom-copper", "bottom-mask"] : []) : [];
    const ORDER = ["top-copper", "bottom-copper", "top-mask", "bottom-mask", "top-silk", "bottom-silk", "top-paste", "bottom-paste"];
    for (const type of ORDER.filter((t) => types.includes(t) || fidTypes.includes(t))) {
      const sources = [];
      for (const P of L.places) for (const f of P.design.layers[type] || []) sources.push({ P, g: f.g });
      const extra = fidTypes.includes(type) ? (w) => {
        const D = w.ap("C," + fmtN(/mask/.test(type) ? o.fidMask : o.fidD));
        w.line("G04 fiducials*"); w.line("D" + D + "*");
        marks.fids.forEach(([x, y]) => w.line(w.fx(x) + w.fy(y) + "D03*"));
      } : null;
      files.push({ name: base + "." + EXT[type], type, text: writeLayer(type, 0, layerCount, sources, extra) });
    }
    for (let n = 1; n <= innerN; n++) {
      const sources = [];
      for (const P of L.places) for (const f of P.design.inner[n] || []) sources.push({ P, g: f.g });
      files.push({ name: base + ".G" + n, type: "inner", text: writeLayer("inner", n, layerCount, sources) });
    }
    files.push({ name: base + "." + EXT.outline, type: "outline", text: writeOutline(o.vsOnOutline ? segs.concat(vlines) : segs, "Profile,NP", 0.1) });
    if (vlines.length) files.push({ name: base + "-VScore.gbr", type: "vscore", text: writeOutline(vlines, "Other,V-score", 0.1) });
    // drills: the holes of the boards moved and turned, mouse bites and tooling holes are not plated
    const mv = (P, h) => { const [x, y] = P.tf(h.x, h.y); if (h.x1 === undefined) return { x, y, d: h.d }; const [x1, y1] = P.tf(h.x1, h.y1); return { x, y, x1, y1, d: h.d }; };
    const pth = [], npth = [];
    for (const P of L.places) { P.design.pth.forEach((h) => pth.push(mv(P, h))); P.design.npth.forEach((h) => npth.push(mv(P, h))); }
    npth.push(...T.bites, ...marks.holes);
    if (pth.length) files.push({ name: base + "-PTH.DRL", type: "drill", text: writeDrill(pth, true, layerCount) });
    if (npth.length) files.push({ name: base + "-NPTH.DRL", type: "drill", text: writeDrill(npth, false, layerCount) });
    for (const d of designs) for (const w of d.warnings) warnings.push(d.name + ": " + w);
    return { files, L, tabs: T.tabs, bites: T.bites, vlines, marks, warnings: [...new Set(warnings)], layerCount, info: { W: L.W, H: L.H, boards: L.places.length, holes: pth.length + npth.length, bites: T.bites.length } };
  }

  global.PANEL = { readGerber, makeDesign, build, layout, instantiateMacro, writeDrill, sizeOf, fmtN };
})(typeof window !== "undefined" ? window : globalThis);
