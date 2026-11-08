/* ===================================================================
 * Gerber Viewer: file handling, parsers and renderer (no dependencies)
 * -------------------------------------------------------------------
 * - ZIP reader (stored and deflated entries, DecompressionStream)
 * - Layer identification by file name, X2 attributes and content
 * - Gerber RS-274X parser: apertures C/R/O/P, aperture macros,
 *   linear and circular interpolation, regions, polarity, step and
 *   repeat. Result: a list of Path2D drawing operations in mm.
 * - Excellon drill parser (holes, G85 slots, routed slots)
 * - Board outline from the outline layer (segments chained to loops)
 * - Renderer: layer masks on canvases, composed pixel by pixel into a
 *   picture of the top or bottom side of the board
 * Global: GERBER
 * =================================================================== */
(function (global) {
  "use strict";

  /* ================================================================
   * ZIP archive
   * ================================================================ */
  async function unzip(buffer) {
    const u8 = new Uint8Array(buffer), dv = new DataView(buffer);
    let eocd = -1;
    for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) {
      if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error("zip");
    const count = dv.getUint16(eocd + 10, true);
    let p = dv.getUint32(eocd + 16, true);
    const files = [];
    for (let n = 0; n < count; n++) {
      if (dv.getUint32(p, true) !== 0x02014b50) throw new Error("zip");
      const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
      const nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true);
      const local = dv.getUint32(p + 42, true);
      const name = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nlen));
      p += 46 + nlen + xlen + clen;
      if (name.endsWith("/")) continue;
      const start = local + 30 + dv.getUint16(local + 26, true) + dv.getUint16(local + 28, true);
      const raw = u8.subarray(start, start + csize);
      let data;
      if (method === 0) data = raw;
      else if (method === 8) data = await inflate(raw);
      else continue;                       // unsupported compression: skip the entry
      files.push({ name: name.split("/").pop(), path: name, data });
    }
    return files;
  }

  async function inflate(raw) {
    const ds = new DecompressionStream("deflate-raw");
    const stream = new Blob([raw]).stream().pipeThrough(ds);
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  /* ================================================================
   * Layer identification
   * ================================================================ */
  const LAYERS = {
    "top-copper": "Top copper", "top-mask": "Top solder mask", "top-silk": "Top silkscreen",
    "bottom-copper": "Bottom copper", "bottom-mask": "Bottom solder mask", "bottom-silk": "Bottom silkscreen",
    "outline": "Board outline", "drill": "Drill holes",
    "top-paste": "Top paste (not shown)", "bottom-paste": "Bottom paste (not shown)",
    "inner": "Inner copper (not shown)", "ignore": "Not used",
  };

  // [type, regular expression on the lower-case file name]; first match wins
  const NAME_RULES = [
    ["ignore", /\.(txt|md|pdf|png|jpg|jpeg|csv|xlsx?|ipc|d356|pos|rpt|gbrjob|html?)$/],
    ["top-paste", /\.gtp$|f[._-]paste|toppaste|top[._-]?paste|paste[._-]?top|\.crc$|\.tsp$|tcream/],
    ["bottom-paste", /\.gbp$|b[._-]paste|bottompaste|bottom[._-]?paste|paste[._-]?bot|\.crs$|\.bsp$|bcream/],
    ["top-mask", /\.gts$|f[._-]mask|topsoldermask|top[._-]?(solder)?mask|(solder)?mask[._-]?top|\.stc$|\.tsm$|\.smt$|stoptop/],
    ["bottom-mask", /\.gbs$|b[._-]mask|bottomsoldermask|bottom[._-]?(solder)?mask|(solder)?mask[._-]?bot|\.sts$|\.bsm$|\.smb$|stopbot/],
    ["top-silk", /\.gto$|f[._-]silk|topsilk|top[._-]?silk|silk(screen)?[._-]?top|\.plc$|\.tsk$|\.sst$|positop/],
    ["bottom-silk", /\.gbo$|b[._-]silk|bottomsilk|bottom[._-]?silk|silk(screen)?[._-]?bot|\.pls$|\.bsk$|\.ssb$|positbot/],
    ["outline", /\.gko$|\.gm\d*$|\.gml$|edge[._-]cuts|outline|boardoutline|profile|\.dim$|\.mil$|\.oln$|\.fab$/],
    ["drill", /\.drl$|\.xln$|\.drd$|\.exc$|\.tap$|\.npt$|\.cnc$|\.ncd$|drill|\.nc$/],
    ["inner", /\.g\d+$|\.gp\d+$|\.gl\d+$|in\d+[._-]cu|inner|\.ly\d+$|\.in\d+$/],
    ["top-copper", /\.gtl$|f[._-]cu([._-]|$)|toplayer|top[._-]?copper|copper[._-]?top|\.cmp$|\.top$|_top\.\w+$/],
    ["bottom-copper", /\.gbl$|b[._-]cu([._-]|$)|bottomlayer|bottom[._-]?copper|copper[._-]?bot|\.sol$|\.sld$|\.bot$|_bottom\.\w+$/],
  ];

  function identify(name, text) {
    const head = text.slice(0, 4000);
    // Excellon by content
    if (/^\s*(;[^\n]*\n\s*)*M48/m.test(head.slice(0, 600)) || /^\s*M48\s*$/m.test(head.slice(0, 200))) return "drill";
    // Gerber X2 file function attribute
    const ff = /%TF\.FileFunction,([^*%]+)\*?%/.exec(head);
    if (ff) {
      const f = ff[1].split(",").map((s) => s.trim().toLowerCase());
      if (f[0] === "copper") return f.includes("top") ? "top-copper" : f.includes("bot") ? "bottom-copper" : "inner";
      if (f[0] === "soldermask") return f[1] === "top" ? "top-mask" : "bottom-mask";
      if (f[0] === "legend") return f[1] === "top" ? "top-silk" : "bottom-silk";
      if (f[0] === "paste") return f[1] === "top" ? "top-paste" : "bottom-paste";
      if (f[0] === "profile") return "outline";
      if (f[0] === "plated" || f[0] === "nonplated") return "drill";
      return "ignore";                                  // fabrication, courtyard, assembly, ...
    }
    const n = name.toLowerCase();
    for (const [type, re] of NAME_RULES) if (re.test(n)) return type;
    return "ignore";
  }

  function isGerber(text) { return /%FS[LTD]?[AI]?X\d\dY\d\d/i.test(text.slice(0, 20000)) || /%MO(IN|MM)/.test(text.slice(0, 20000)); }

  /* ================================================================
   * Geometry helpers
   * ================================================================ */
  function arcPoints(x0, y0, x1, y1, cx, cy, cw, full) {
    const r = Math.hypot(x0 - cx, y0 - cy), r1 = Math.hypot(x1 - cx, y1 - cy);
    let a0 = Math.atan2(y0 - cy, x0 - cx), a1 = Math.atan2(y1 - cy, x1 - cx);
    let sweep = a1 - a0;
    if (cw) { if (sweep >= 0) sweep -= 2 * Math.PI; }
    else if (sweep <= 0) sweep += 2 * Math.PI;
    if (full) sweep = cw ? -2 * Math.PI : 2 * Math.PI;
    const n = Math.max(4, Math.min(720, Math.ceil(Math.abs(sweep) * Math.max(r, r1) / 0.02)));
    const pts = [];
    for (let i = 1; i <= n; i++) {
      const t = i / n, a = a0 + sweep * t, rr = r + (r1 - r) * t;
      pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
    }
    pts[pts.length - 1] = full ? [x0, y0] : [x1, y1];
    return pts;
  }

  function hull(points) {                // convex hull (monotone chain)
    const p = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    if (p.length < 3) return p;
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }

  function polyPath(path, pts, reverse) {
    const q = reverse ? pts.slice().reverse() : pts;
    path.moveTo(q[0][0], q[0][1]);
    for (let i = 1; i < q.length; i++) path.lineTo(q[i][0], q[i][1]);
    path.closePath();
  }

  function circlePath(path, x, y, r, reverse) {
    path.moveTo(x + r, y);
    path.arc(x, y, r, 0, 2 * Math.PI, !!reverse);
    path.closePath();
  }

  function rot(pts, deg) {
    if (!deg) return pts;
    const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    return pts.map(([x, y]) => [x * c - y * s, x * s + y * c]);
  }

  class BBox {
    constructor() { this.x0 = Infinity; this.y0 = Infinity; this.x1 = -Infinity; this.y1 = -Infinity; }
    add(x, y, r = 0) {
      if (x - r < this.x0) this.x0 = x - r; if (x + r > this.x1) this.x1 = x + r;
      if (y - r < this.y0) this.y0 = y - r; if (y + r > this.y1) this.y1 = y + r;
    }
    merge(b) { if (b && b.valid()) { this.add(b.x0, b.y0); this.add(b.x1, b.y1); } }
    valid() { return this.x1 >= this.x0 && this.y1 >= this.y0; }
  }

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
      if (s[i] === "$") {
        let j = i + 1; while (j < s.length && /\d/.test(s[j])) j++;
        const v = vars[+s.slice(i + 1, j)] || 0; i = j; return v;
      }
      let j = i; while (j < s.length && /[\d.]/.test(s[j])) j++;
      const v = parseFloat(s.slice(i, j)); i = j; return isNaN(v) ? 0 : v;
    };
    const mul = () => { let v = num(); while (s[i] === "*" || s[i] === "/") { const op = s[i++]; const w = num(); v = op === "*" ? v * w : v / w; } return v; };
    const add = () => { let v = mul(); while (s[i] === "+" || s[i] === "-") { const op = s[i++]; const w = mul(); v = op === "+" ? v + w : v - w; } return v; };
    return add();
  }

  // Build the shapes of a macro: list of {pts|circle, exposure}
  function macroShapes(blocks, params, k) {
    const vars = [0].concat(params);
    const shapes = [];
    for (const raw of blocks) {
      const b = raw.trim();
      if (!b || b[0] === "0") continue;
      if (b[0] === "$") {
        const m = /^\$(\d+)=(.*)$/.exec(b);
        if (m) vars[+m[1]] = evalExpr(m[2], vars);
        continue;
      }
      const f = b.split(",").map((e) => evalExpr(e, vars));
      const code = f[0], exp = f[1] !== 0;
      if (code === 1) {                                   // circle
        const [cx, cy] = rot([[f[3] * k, f[4] * k]], f[5] || 0)[0];
        shapes.push({ circle: [cx, cy, f[2] * k / 2], exp });
      } else if (code === 20 || code === 2) {             // vector line
        const w = f[2] * k, x0 = f[3] * k, y0 = f[4] * k, x1 = f[5] * k, y1 = f[6] * k;
        const len = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / len * w / 2, ny = (x1 - x0) / len * w / 2;
        shapes.push({ pts: rot([[x0 + nx, y0 + ny], [x1 + nx, y1 + ny], [x1 - nx, y1 - ny], [x0 - nx, y0 - ny]], f[7] || 0), exp });
      } else if (code === 21) {                           // center line
        const w = f[2] * k / 2, h = f[3] * k / 2, cx = f[4] * k, cy = f[5] * k;
        shapes.push({ pts: rot([[cx - w, cy - h], [cx + w, cy - h], [cx + w, cy + h], [cx - w, cy + h]], f[6] || 0), exp });
      } else if (code === 22) {                           // lower left line (deprecated)
        const w = f[2] * k, h = f[3] * k, x = f[4] * k, y = f[5] * k;
        shapes.push({ pts: rot([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], f[6] || 0), exp });
      } else if (code === 4) {                            // outline
        const n = f[2], pts = [];
        for (let i = 0; i <= n; i++) pts.push([f[3 + 2 * i] * k, f[4 + 2 * i] * k]);
        shapes.push({ pts: rot(pts, f[5 + 2 * n] || 0), exp });
      } else if (code === 5) {                            // regular polygon
        const n = f[2], cx = f[3] * k, cy = f[4] * k, r = f[5] * k / 2, pts = [];
        for (let i = 0; i < n; i++) { const a = 2 * Math.PI * i / n; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
        shapes.push({ pts: rot(pts, f[6] || 0), exp });
      } else if (code === 6) {                            // moire (outer circle only)
        const [cx, cy] = rot([[f[1] * k, f[2] * k]], f[9] || 0)[0];
        shapes.push({ circle: [cx, cy, f[3] * k / 2], exp: true });
      } else if (code === 7) {                            // thermal (ring, gaps ignored)
        const [cx, cy] = rot([[f[1] * k, f[2] * k]], f[6] || 0)[0];
        shapes.push({ circle: [cx, cy, f[3] * k / 2], exp: true });
        shapes.push({ circle: [cx, cy, f[4] * k / 2], exp: false });
      }
    }
    return shapes;
  }

  /* ================================================================
   * Gerber RS-274X parser
   * ================================================================ */
  function parseGerber(text) {
    const ops = [];                          // {path, pol, fill:true|false, width, rule}
    const bbox = new BBox();
    const warnings = new Set();
    const apertures = {}, macros = {};
    let k = 25.4;                            // unit factor to mm (inch by default)
    let fmt = { xi: 2, xd: 4, yi: 2, yd: 4, trailing: false, incremental: false };
    let x = 0, y = 0, interp = 1, quadrant = 75, pol = 1, ap = null, lastD = 2, region = false;
    let contour = null, regionPath = null, regionHas = false;
    let strokePath = null, strokeKey = "", flashPath = null, flashKey = "";
    let sr = null;                           // step and repeat
    const segments = [];                     // all drawn segments (for the outline)

    function flushStroke() { if (strokePath) { ops.push(strokePath); strokePath = null; strokeKey = ""; } }
    function flushFlash() { if (flashPath) { ops.push(flashPath); flashPath = null; flashKey = ""; } }
    function flushAll() { flushStroke(); flushFlash(); }

    function coord(s, isX) {
      if (s === undefined) return null;
      if (s.includes(".")) return parseFloat(s) * k;
      const neg = s[0] === "-"; s = s.replace(/^[+-]/, "");
      const i = isX ? fmt.xi : fmt.yi, d = isX ? fmt.xd : fmt.yd;
      if (fmt.trailing) s = s.padEnd(i + d, "0");
      const v = parseInt(s, 10) / Math.pow(10, d);
      return (neg ? -v : v) * k;
    }

    function aperturePoints(a, px, py) {
      // outline points of simple apertures (for strokes with non-circular apertures)
      if (a.type === "R" || a.type === "O") {
        const w = a.p[0] * k / 2, h = (a.p[1] || a.p[0]) * k / 2;
        return [[px - w, py - h], [px + w, py - h], [px + w, py + h], [px - w, py + h]];
      }
      if (a.type === "P") {
        const r = a.p[0] * k / 2, n = a.p[1] || 4, rr = a.p[2] || 0, pts = [];
        for (let i = 0; i < n; i++) { const t = (rr + 360 * i / n) * Math.PI / 180; pts.push([px + r * Math.cos(t), py + r * Math.sin(t)]); }
        return pts;
      }
      return null;
    }

    function flash(a, px, py) {
      const key = pol + "";
      if (flashKey !== key) { flushFlash(); flashPath = { path: new Path2D(), pol, fill: true, rule: "nonzero" }; flashKey = key; }
      const P = flashPath.path;
      let hole = 0;
      if (a.type === "C") {
        const r = a.p[0] * k / 2; circlePath(P, px, py, r); bbox.add(px, py, r); hole = a.p[1];
      } else if (a.type === "R") {
        const w = a.p[0] * k / 2, h = a.p[1] * k / 2;
        polyPath(P, [[px - w, py - h], [px + w, py - h], [px + w, py + h], [px - w, py + h]]);
        bbox.add(px - w, py - h); bbox.add(px + w, py + h); hole = a.p[2];
      } else if (a.type === "O") {
        const w = a.p[0] * k, h = a.p[1] * k, r = Math.min(w, h) / 2;
        const pts = [];
        if (w >= h) {
          const dx = w / 2 - r;
          for (let i = 0; i <= 16; i++) { const t = -Math.PI / 2 + Math.PI * i / 16; pts.push([px + dx + r * Math.cos(t), py + r * Math.sin(t)]); }
          for (let i = 0; i <= 16; i++) { const t = Math.PI / 2 + Math.PI * i / 16; pts.push([px - dx + r * Math.cos(t), py + r * Math.sin(t)]); }
        } else {
          const dy = h / 2 - r;
          for (let i = 0; i <= 16; i++) { const t = Math.PI * i / 16; pts.push([px + r * Math.cos(t), py + dy + r * Math.sin(t)]); }
          for (let i = 0; i <= 16; i++) { const t = Math.PI + Math.PI * i / 16; pts.push([px + r * Math.cos(t), py - dy + r * Math.sin(t)]); }
        }
        polyPath(P, pts); bbox.add(px - w / 2, py - h / 2); bbox.add(px + w / 2, py + h / 2); hole = a.p[2];
      } else if (a.type === "P") {
        const pts = aperturePoints(a, px, py); polyPath(P, pts); bbox.add(px, py, a.p[0] * k / 2); hole = a.p[3];
      } else if (a.type === "M") {
        const m = macros[a.name];
        if (!m) { warnings.add("unknown aperture macro " + a.name); return; }
        for (const s of macroShapes(m, a.p, k)) {
          if (s.circle) { circlePath(P, px + s.circle[0], py + s.circle[1], s.circle[2], !s.exp); bbox.add(px + s.circle[0], py + s.circle[1], s.circle[2]); }
          else {
            const pts = s.pts.map(([u, v]) => [px + u, py + v]);
            let area = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; area += p[0] * q[1] - q[0] * p[1]; }
            polyPath(P, pts, s.exp ? area < 0 : area > 0);      // all exposed shapes counter-clockwise
            if (s.exp) for (const [u, v] of pts) bbox.add(u, v);
          }
        }
      }
      if (hole) circlePath(P, px, py, hole * k / 2, true);
    }

    function draw(x0, y0, x1, y1, pts) {
      // pts: points of the path from (x0,y0) to (x1,y1) (line or flattened arc)
      segments.push([[x0, y0]].concat(pts));
      if (!ap) return;
      if (ap.type === "C" || (ap.type === "M")) {
        const w = ap.type === "C" ? ap.p[0] * k : 0;
        const key = pol + ":" + w;
        if (strokeKey !== key) { flushStroke(); strokePath = { path: new Path2D(), pol, fill: false, width: w }; strokeKey = key; }
        strokePath.path.moveTo(x0, y0);
        for (const [u, v] of pts) { strokePath.path.lineTo(u, v); bbox.add(u, v, w / 2); }
        bbox.add(x0, y0, w / 2);
        if (ap.type === "M") warnings.add("macro aperture used for drawing");
      } else {
        // rectangle/obround/polygon aperture: swept shape as convex hulls of the segment pieces
        const key = pol + "";
        if (flashKey !== key) { flushFlash(); flashPath = { path: new Path2D(), pol, fill: true, rule: "nonzero" }; flashKey = key; }
        let px = x0, py = y0;
        for (const [u, v] of pts) {
          const h = hull(aperturePoints(ap, px, py).concat(aperturePoints(ap, u, v)));
          let area = 0; for (let i = 0; i < h.length; i++) { const p = h[i], q = h[(i + 1) % h.length]; area += p[0] * q[1] - q[0] * p[1]; }
          polyPath(flashPath.path, h, area < 0);
          for (const [a, b] of h) bbox.add(a, b);
          px = u; py = v;
        }
      }
    }

    // Split into commands: extended commands %...% and word commands ending with *
    const cmds = [];
    {
      let i = 0; const n = text.length;
      while (i < n) {
        const c = text[i];
        if (c === "%") {
          const j = text.indexOf("%", i + 1); if (j < 0) break;
          cmds.push({ ext: true, s: text.slice(i + 1, j).replace(/\s+/g, "") });
          i = j + 1;
        } else if (c === "\r" || c === "\n" || c === " " || c === "\t") { i++; }
        else {
          const j = text.indexOf("*", i); if (j < 0) break;
          cmds.push({ ext: false, s: text.slice(i, j).replace(/\s+/g, "") });
          i = j + 1;
        }
      }
    }

    for (const cmd of cmds) {
      let s = cmd.s;
      if (cmd.ext) {
        const blocks = s.split("*").filter((b) => b.length);
        if (!blocks.length) continue;
        const b0 = blocks[0];
        if (b0.startsWith("AM")) { macros[b0.slice(2)] = blocks.slice(1); continue; }
        for (const b of blocks) {
          if (b.startsWith("FS")) {
            const m = /FS([LTD]?)([AI]?)(?:N\d)?(?:G\d)?X(\d)(\d)Y(\d)(\d)/.exec(b);
            if (m) fmt = { trailing: m[1] === "T", incremental: m[2] === "I", xi: +m[3], xd: +m[4], yi: +m[5], yd: +m[6] };
          } else if (b.startsWith("MO")) { k = b.startsWith("MOMM") ? 1 : 25.4; }
          else if (b.startsWith("AD")) {
            const m = /^ADD(\d+)([A-Za-z_.$][^,]*)(?:,(.*))?$/.exec(b);
            if (!m) continue;
            const p = m[3] ? m[3].split(/[Xx]/).map(parseFloat) : [];
            const t = m[2];
            apertures[m[1]] = ["C", "R", "O", "P"].includes(t) ? { type: t, p } : { type: "M", name: t, p };
          } else if (b.startsWith("LP")) { flushAll(); pol = b[2] === "C" ? 0 : 1; }
          else if (b.startsWith("SR")) {
            flushAll();
            if (sr) {                                          // close the previous block
              const blockOps = ops.splice(sr.start);
              for (let ix = 0; ix < sr.nx; ix++) for (let iy = 0; iy < sr.ny; iy++) {
                const m = new DOMMatrix().translate(ix * sr.dx, iy * sr.dy);
                for (const o of blockOps) { const p = new Path2D(); p.addPath(o.path, m); ops.push(Object.assign({}, o, { path: p })); }
              }
              const bx = bbox.x1, by = bbox.y1;
              bbox.add(bx + (sr.nx - 1) * sr.dx, by + (sr.ny - 1) * sr.dy);
              sr = null;
            }
            const m = /SRX(\d+)Y(\d+)I([\d.]+)J([\d.]+)/.exec(b);
            if (m && (+m[1] > 1 || +m[2] > 1)) sr = { start: ops.length, nx: +m[1], ny: +m[2], dx: +m[3] * k, dy: +m[4] * k };
          } else if (/^(LM|LR|LS)/.test(b)) {
            if (!/^LMN|^LR0(\.0*)?$|^LS1(\.0*)?$/.test(b)) warnings.add("mirroring/rotation/scaling (" + b.slice(0, 2) + ") is not supported");
          } else if (b.startsWith("IPNEG")) warnings.add("negative image polarity is not supported");
        }
        continue;
      }

      // word command
      if (!s) continue;
      if (s.startsWith("G04") || s.startsWith("G4")) continue;          // comment
      if (s.startsWith("M02") || s.startsWith("M00")) break;
      let m;
      while ((m = /^G0?(\d+)/.exec(s))) {
        const g = +m[1];
        if (g === 1 || g === 2 || g === 3) interp = g;
        else if (g === 74 || g === 75) quadrant = g;
        else if (g === 36) { flushAll(); region = true; regionPath = new Path2D(); regionHas = false; contour = null; }
        else if (g === 37) {
          if (contour && contour.length > 2) segments.push(contour);
          if (regionHas) ops.push({ path: regionPath, pol, fill: true, rule: "nonzero" });
          region = false; regionPath = null; contour = null;
        } else if (g === 70) k = 25.4;
        else if (g === 71) k = 1;
        else if (g === 90) fmt.incremental = false;
        else if (g === 91) fmt.incremental = true;
        else if (g === 54 || g === 55) { /* aperture select follows */ }
        s = s.slice(m[0].length);
      }
      if (!s) continue;
      const dm = /D0*(\d+)$/.exec(s);
      let d = dm ? +dm[1] : null;
      if (d !== null && d >= 10) { ap = apertures[d] || null; if (!ap) warnings.add("undefined aperture D" + d); continue; }
      const cx = /X([+-]?[\d.]+)/.exec(s), cy = /Y([+-]?[\d.]+)/.exec(s);
      const ci = /I([+-]?[\d.]+)/.exec(s), cj = /J([+-]?[\d.]+)/.exec(s);
      if (!cx && !cy && d === null) continue;
      if (d === null) d = lastD; else lastD = d;
      let nx = x, ny = y;
      if (fmt.incremental) { if (cx) nx = x + coord(cx[1], true); if (cy) ny = y + coord(cy[1], false); }
      else { if (cx) nx = coord(cx[1], true); if (cy) ny = coord(cy[1], false); }
      const ii = ci ? coord(ci[1], true) : 0, jj = cj ? coord(cj[1], false) : 0;

      if (d === 1) {
        let pts;
        if (interp === 1) pts = [[nx, ny]];
        else {
          const cw = interp === 2;
          let ccx, ccy;
          if (quadrant === 75) { ccx = x + ii; ccy = y + jj; }
          else {
            // single quadrant: choose the center sign that gives the arc <= 90 deg with matching radius
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
          }
          const full = quadrant === 75 && Math.abs(nx - x) < 1e-9 && Math.abs(ny - y) < 1e-9;
          pts = arcPoints(x, y, nx, ny, ccx, ccy, cw, full);
        }
        if (region) {
          if (!contour) { contour = [[x, y]]; regionPath.moveTo(x, y); }
          for (const [u, v] of pts) { regionPath.lineTo(u, v); contour.push([u, v]); bbox.add(u, v); }
          regionHas = true;
        } else draw(x, y, nx, ny, pts);
      } else if (d === 2) {
        if (region) {
          if (contour) { regionPath.closePath(); if (contour.length > 2) segments.push(contour); }
          contour = null;
        }
      } else if (d === 3) {
        if (ap && !region) flash(ap, nx, ny);
      }
      x = nx; y = ny;
    }
    flushAll();
    return { ops, bbox, segments, warnings: [...warnings] };
  }

  /* ================================================================
   * Excellon drill parser
   * ================================================================ */
  function parseExcellon(text) {
    const tools = {}, holes = [], bbox = new BBox();
    let k = 25.4, lz = false, fi = 2, fd = 4, fmtSet = false, tool = null, x = 0, y = 0;
    let route = false, down = false, incremental = false;
    const lines = text.split(/\r?\n/);
    function num(s, isInt) {
      if (s.includes(".")) return parseFloat(s) * k;
      const neg = s[0] === "-"; s = s.replace(/^[+-]/, "");
      let v;
      if (lz) v = parseInt(s.padEnd(fi + fd, "0"), 10) / Math.pow(10, fd);
      else v = parseInt(s, 10) / Math.pow(10, fd);
      return (neg ? -v : v) * k;
    }
    for (let raw of lines) {
      let l = raw.trim();
      if (!l) continue;
      if (l[0] === ";") {
        const m = /FILE_FORMAT\s*=\s*(\d+):(\d+)/i.exec(l);
        if (m) { fi = +m[1]; fd = +m[2]; fmtSet = true; }
        continue;
      }
      const um = /^(METRIC|INCH)(?:,(LZ|TZ))?(?:,(0+)\.(0+))?/.exec(l);
      if (um) {
        k = um[1] === "METRIC" ? 1 : 25.4;
        if (um[2]) lz = um[2] === "LZ";
        if (um[3]) { fi = um[3].length; fd = um[4].length; fmtSet = true; }
        else if (!fmtSet) { if (k === 1) { fi = 3; fd = 3; } else { fi = 2; fd = 4; } }
        continue;
      }
      if (/^M71/.test(l)) { k = 1; if (!fmtSet) { fi = 3; fd = 3; } continue; }
      if (/^M72/.test(l)) { k = 25.4; if (!fmtSet) { fi = 2; fd = 4; } continue; }
      if (/^ICI,ON/.test(l)) { incremental = true; continue; }
      const tm = /^T0*(\d+)(.*)$/.exec(l);
      if (tm) {
        const cm = /C([\d.]+)/.exec(tm[2]);
        if (cm) tools[tm[1]] = parseFloat(cm[1]) * k;
        tool = tm[1];
        continue;
      }
      if (/^G00/.test(l)) { route = true; down = false; }
      if (/^M15/.test(l)) { down = true; continue; }
      if (/^M16|^M17/.test(l)) { down = false; continue; }
      if (/^G05|^G90|^M30|^M00|^%|^M48|^M95/.test(l)) { if (/^G05/.test(l)) route = false; continue; }
      const parts = /X([+-]?[\d.]+)?Y?([+-]?[\d.]+)?/.exec(l);
      const xm = /X([+-]?[\d.]+)/.exec(l), ym = /Y([+-]?[\d.]+)/.exec(l);
      if (!xm && !ym) continue;
      const slot = /G85/.exec(l);
      const first = slot ? l.slice(0, slot.index) : l;
      const fx = /X([+-]?[\d.]+)/.exec(first), fy = /Y([+-]?[\d.]+)/.exec(first);
      let nx = fx ? num(fx[1]) : x, ny = fy ? num(fy[1]) : y;
      if (incremental) { nx = fx ? x + num(fx[1]) : x; ny = fy ? y + num(fy[1]) : y; }
      const d = tools[tool] || 0;
      if (slot) {
        const rest = l.slice(slot.index + 3);
        const sx = /X([+-]?[\d.]+)/.exec(rest), sy = /Y([+-]?[\d.]+)/.exec(rest);
        const ex = sx ? num(sx[1]) : nx, ey = sy ? num(sy[1]) : ny;
        holes.push({ x: nx, y: ny, x1: ex, y1: ey, d }); bbox.add(nx, ny, d / 2); bbox.add(ex, ey, d / 2);
        x = ex; y = ey; continue;
      }
      if (route) {
        if (/^G01/.test(l) && down) { holes.push({ x, y, x1: nx, y1: ny, d }); bbox.add(nx, ny, d / 2); }
        x = nx; y = ny; continue;
      }
      holes.push({ x: nx, y: ny, d }); bbox.add(nx, ny, d / 2);
      x = nx; y = ny;
      void parts;
    }
    return { holes, bbox, tools };
  }

  /* ================================================================
   * Board outline: chain segments to closed loops
   * ================================================================ */
  function outlineLoops(segments) {
    const tol = 0.05;
    const segs = segments.filter((s) => s.length >= 2).map((s) => s.slice());
    const loops = [];
    const closed = (p) => Math.hypot(p[0][0] - p[p.length - 1][0], p[0][1] - p[p.length - 1][1]) < tol;
    const used = new Array(segs.length).fill(false);
    for (let i = 0; i < segs.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      let chain = segs[i].slice();
      let grown = true;
      while (!closed(chain) && grown) {
        grown = false;
        const end = chain[chain.length - 1];
        for (let j = 0; j < segs.length; j++) {
          if (used[j]) continue;
          const s = segs[j];
          if (Math.hypot(s[0][0] - end[0], s[0][1] - end[1]) < tol) { chain = chain.concat(s.slice(1)); used[j] = true; grown = true; break; }
          const e = s[s.length - 1];
          if (Math.hypot(e[0] - end[0], e[1] - end[1]) < tol) { chain = chain.concat(s.slice().reverse().slice(1)); used[j] = true; grown = true; break; }
        }
      }
      if (chain.length > 2 && closed(chain)) {
        let area = 0; for (let n = 0; n < chain.length; n++) { const p = chain[n], q = chain[(n + 1) % chain.length]; area += p[0] * q[1] - q[0] * p[1]; }
        if (Math.abs(area) > 0.01) loops.push(chain);
      }
    }
    return loops;
  }

  /* ================================================================
   * Board model from the files
   * ================================================================ */
  // files: [{name, type, text}]
  function buildBoard(files) {
    const board = { layers: {}, drills: [], warnings: [], bbox: new BBox(), loops: [], holes: 0 };
    for (const f of files) {
      if (["ignore", "inner", "top-paste", "bottom-paste"].includes(f.type)) continue;
      try {
        if (f.type === "drill") {
          const d = parseExcellon(f.text);
          board.drills.push(d); board.holes += d.holes.length;
          continue;
        }
        const g = parseGerber(f.text);
        for (const w of g.warnings) board.warnings.push(f.name + ": " + w);
        if (f.type === "outline") {
          board.loops = board.loops.concat(outlineLoops(g.segments));
          board.outlineBBox = board.outlineBBox || new BBox();
          for (const s of g.segments) for (const [u, v] of s) board.outlineBBox.add(u, v);
          board.outlineGerber = g;
        } else {
          (board.layers[f.type] = board.layers[f.type] || []).push(g);
        }
      } catch (err) {
        board.warnings.push(f.name + ": could not be read (" + err.message + ")");
      }
    }
    if (board.loops.length) {
      for (const l of board.loops) for (const [u, v] of l) board.bbox.add(u, v);
    } else {
      // no closed outline: use the outline extents or all layers
      if (board.outlineBBox && board.outlineBBox.valid()) board.bbox.merge(board.outlineBBox);
      else {
        for (const list of Object.values(board.layers)) for (const g of list) board.bbox.merge(g.bbox);
        for (const d of board.drills) board.bbox.merge(d.bbox);
      }
      if (board.bbox.valid()) {
        const b = board.bbox;
        board.loops = [[[b.x0, b.y0], [b.x1, b.y0], [b.x1, b.y1], [b.x0, b.y1], [b.x0, b.y0]]];
        board.noOutline = true;
      }
    }
    return board;
  }

  /* ================================================================
   * Renderer
   * ================================================================ */
  const MASK_COLORS = {
    green:  { name: "Green",  bare: [20, 92, 44],   copper: [44, 128, 62],  silk: "white" },
    purple: { name: "Purple", bare: [64, 28, 100],  copper: [98, 52, 138],  silk: "white" },
    red:    { name: "Red",    bare: [160, 24, 24],  copper: [196, 52, 44],  silk: "white" },
    yellow: { name: "Yellow", bare: [212, 178, 30], copper: [232, 204, 70], silk: "white" },
    blue:   { name: "Blue",   bare: [18, 54, 132],  copper: [40, 88, 168],  silk: "white" },
    white:  { name: "White",  bare: [236, 236, 232], copper: [246, 246, 242], silk: "black" },
    black:  { name: "Black",  bare: [22, 22, 24],   copper: [44, 44, 48],   silk: "white" },
  };
  const SILK_COLORS = { white: [246, 246, 244], black: [20, 20, 20] };
  const FINISHES = {
    tin:    { name: "HASL (tin)", color: [196, 198, 204] },
    copper: { name: "Bare copper", color: [200, 118, 70] },
    gold:   { name: "ENIG (gold)", color: [222, 186, 92] },
  };
  const SUBSTRATE = [196, 178, 120];

  // Render one layer group into an alpha mask
  function layerMask(W, H, transform, draws) {
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.setTransform(...transform);
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    draws(ctx);
    const a = ctx.getImageData(0, 0, W, H).data;
    const m = new Uint8ClampedArray(W * H);
    for (let i = 0, j = 3; i < m.length; i++, j += 4) m[i] = a[j];
    return m;
  }

  function drawGerber(ctx, g) {
    for (const o of g.ops) {
      ctx.globalCompositeOperation = o.pol ? "source-over" : "destination-out";
      ctx.fillStyle = ctx.strokeStyle = "#fff";
      if (o.fill) ctx.fill(o.path, o.rule || "nonzero");
      else {
        // zero-width strokes: draw them one pixel wide
        const m = ctx.getTransform(); const px = 1 / Math.hypot(m.a, m.b);
        ctx.lineWidth = Math.max(o.width, px);
        ctx.stroke(o.path);
      }
    }
    ctx.globalCompositeOperation = "source-over";
  }

  function boardPath(board) {
    const p = new Path2D();
    for (const l of board.loops) polyPath(p, l);
    return p;
  }

  // Render one side. opts: {side: 'top'|'bottom', scale (px/mm), mask, silk, finish}
  function render(board, opts) {
    const b = board.bbox, s = opts.scale, pad = 0;
    const W = Math.max(1, Math.ceil((b.x1 - b.x0) * s + 2 * pad)), H = Math.max(1, Math.ceil((b.y1 - b.y0) * s + 2 * pad));
    const top = opts.side === "top";
    const T = top ? [s, 0, 0, -s, -b.x0 * s + pad, b.y1 * s + pad] : [-s, 0, 0, -s, b.x1 * s + pad, b.y1 * s + pad];
    const pre = top ? "top-" : "bottom-";
    const group = (type) => (ctx) => { for (const g of board.layers[type] || []) drawGerber(ctx, g); };

    const mBoard = layerMask(W, H, T, (ctx) => { ctx.fillStyle = "#fff"; ctx.fill(boardPath(board), "evenodd"); });
    const mCopper = layerMask(W, H, T, group(pre + "copper"));
    const hasMask = (board.layers[pre + "mask"] || []).length > 0;
    const mOpen = hasMask ? layerMask(W, H, T, group(pre + "mask")) : null;
    const mSilk = layerMask(W, H, T, group(pre + "silk"));
    const mHoles = layerMask(W, H, T, (ctx) => {
      ctx.fillStyle = ctx.strokeStyle = "#fff"; ctx.lineCap = "round";
      for (const d of board.drills) for (const h of d.holes) {
        if (h.x1 !== undefined) { ctx.lineWidth = h.d; ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(h.x1, h.y1); ctx.stroke(); }
        else { ctx.beginPath(); ctx.arc(h.x, h.y, h.d / 2, 0, 2 * Math.PI); ctx.fill(); }
      }
    });

    const mc = MASK_COLORS[opts.mask] || MASK_COLORS.green;
    const sc = SILK_COLORS[opts.silk] || SILK_COLORS.white;
    const fc = (FINISHES[opts.finish] || FINISHES.tin).color;
    const out = new ImageData(W, H), d = out.data;
    for (let i = 0, j = 0; i < W * H; i++, j += 4) {
      const ab = mBoard[i];
      if (!ab) continue;
      const c = mCopper[i] / 255, open = mOpen ? mOpen[i] / 255 : 0, cover = 1 - open;
      const sl = mSilk[i] / 255 * cover, h = mHoles[i] / 255;
      for (let ch = 0; ch < 3; ch++) {
        const masked = mc.bare[ch] + (mc.copper[ch] - mc.bare[ch]) * c;
        const bare = SUBSTRATE[ch] + (fc[ch] - SUBSTRATE[ch]) * c;
        let v = bare + (masked - bare) * cover;
        v = v + (sc[ch] - v) * sl;
        d[j + ch] = v;
      }
      d[j + 3] = ab * (1 - h);
    }
    const canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H;
    canvas.getContext("2d").putImageData(out, 0, 0);
    return canvas;
  }

  global.GERBER = { unzip, identify, isGerber, parseGerber, parseExcellon, buildBoard, render,
    LAYERS, MASK_COLORS, SILK_COLORS, FINISHES };
})(typeof window !== "undefined" ? window : globalThis);
