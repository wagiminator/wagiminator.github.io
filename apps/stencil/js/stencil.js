/* ===================================================================
 * Solder Paste Stencil: geometry (no dependencies besides ../gerber-viewer/gerber.js)
 * -------------------------------------------------------------------
 * - the paste layer drawn finely (with openings made larger or smaller),
 *   traced again as smooth outlines (marching squares on the anti-aliased
 *   picture), so overlapping shapes, macros and clear polarity all work
 * - plate with openings, frame with a pocket for the board, pins for holes
 * - triangulation (earcut), binary STL, SVG for cutters
 * Global: STENCIL
 * =================================================================== */
(function (global) {
  "use strict";

  /* ================================================================
   * Earcut: polygon triangulation with holes.
   * Algorithm of Mapbox earcut (ISC License, Copyright (c) 2016, Mapbox),
   * written down again for this app.
   * ================================================================ */
  function earcut(data, holeIndices) {
    const hasHoles = holeIndices && holeIndices.length, outerLen = hasHoles ? holeIndices[0] * 2 : data.length;
    let outerNode = linkedList(data, 0, outerLen, true);
    const triangles = [];
    if (!outerNode || outerNode.next === outerNode.prev) return triangles;
    let minX = 0, minY = 0, invSize = 0;
    if (hasHoles) outerNode = eliminateHoles(data, holeIndices, outerNode);
    if (data.length > 160) {
      minX = Infinity; minY = Infinity; let maxX = -Infinity, maxY = -Infinity;
      for (let i = 0; i < outerLen; i += 2) { const x = data[i], y = data[i + 1]; if (x < minX) minX = x; if (y < minY) minY = y; if (x > maxX) maxX = x; if (y > maxY) maxY = y; }
      invSize = Math.max(maxX - minX, maxY - minY); invSize = invSize !== 0 ? 32767 / invSize : 0;
    }
    earcutLinked(outerNode, triangles, minX, minY, invSize, 0);
    return triangles;
  }
  function linkedList(data, start, end, clockwise) {
    let last;
    if (clockwise === (signedArea(data, start, end) > 0)) for (let i = start; i < end; i += 2) last = insertNode(i, data[i], data[i + 1], last);
    else for (let i = end - 2; i >= start; i -= 2) last = insertNode(i, data[i], data[i + 1], last);
    if (last && equals(last, last.next)) { removeNode(last); last = last.next; }
    return last;
  }
  function filterPoints(start, end) {
    if (!start) return start;
    if (!end) end = start;
    let p = start, again;
    do {
      again = false;
      if (!p.steiner && (equals(p, p.next) || area(p.prev, p, p.next) === 0)) { removeNode(p); p = end = p.prev; if (p === p.next) break; again = true; }
      else p = p.next;
    } while (again || p !== end);
    return end;
  }
  function earcutLinked(ear, triangles, minX, minY, invSize, pass) {
    if (!ear) return;
    if (!pass && invSize) indexCurve(ear, minX, minY, invSize);
    let stop = ear;
    while (ear.prev !== ear.next) {
      const prev = ear.prev, next = ear.next;
      if (invSize ? isEarHashed(ear, minX, minY, invSize) : isEar(ear)) {
        triangles.push(prev.i / 2, ear.i / 2, next.i / 2);
        removeNode(ear);
        ear = next.next; stop = next.next;
        continue;
      }
      ear = next;
      if (ear === stop) {
        if (!pass) earcutLinked(filterPoints(ear), triangles, minX, minY, invSize, 1);
        else if (pass === 1) { ear = cureLocalIntersections(filterPoints(ear), triangles); earcutLinked(ear, triangles, minX, minY, invSize, 2); }
        else if (pass === 2) splitEarcut(ear, triangles, minX, minY, invSize);
        break;
      }
    }
  }
  function isEar(ear) {
    const a = ear.prev, b = ear, c = ear.next;
    if (area(a, b, c) >= 0) return false;
    const x0 = Math.min(a.x, b.x, c.x), y0 = Math.min(a.y, b.y, c.y), x1 = Math.max(a.x, b.x, c.x), y1 = Math.max(a.y, b.y, c.y);
    let p = c.next;
    while (p !== a) {
      if (p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1 && pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) && area(p.prev, p, p.next) >= 0) return false;
      p = p.next;
    }
    return true;
  }
  function isEarHashed(ear, minX, minY, invSize) {
    const a = ear.prev, b = ear, c = ear.next;
    if (area(a, b, c) >= 0) return false;
    const x0 = Math.min(a.x, b.x, c.x), y0 = Math.min(a.y, b.y, c.y), x1 = Math.max(a.x, b.x, c.x), y1 = Math.max(a.y, b.y, c.y);
    const minZ = zOrder(x0, y0, minX, minY, invSize), maxZ = zOrder(x1, y1, minX, minY, invSize);
    const bad = (p) => p !== a && p !== c && p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1 && pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) && area(p.prev, p, p.next) >= 0;
    let p = ear.prevZ, n = ear.nextZ;
    while (p && p.z >= minZ && n && n.z <= maxZ) { if (bad(p)) return false; p = p.prevZ; if (bad(n)) return false; n = n.nextZ; }
    while (p && p.z >= minZ) { if (bad(p)) return false; p = p.prevZ; }
    while (n && n.z <= maxZ) { if (bad(n)) return false; n = n.nextZ; }
    return true;
  }
  function cureLocalIntersections(start, triangles) {
    let p = start;
    do {
      const a = p.prev, b = p.next.next;
      if (!equals(a, b) && intersects(a, p, p.next, b) && locallyInside(a, b) && locallyInside(b, a)) {
        triangles.push(a.i / 2, p.i / 2, b.i / 2);
        removeNode(p); removeNode(p.next);
        p = start = b;
      }
      p = p.next;
    } while (p !== start);
    return filterPoints(p);
  }
  function splitEarcut(start, triangles, minX, minY, invSize) {
    let a = start;
    do {
      let b = a.next.next;
      while (b !== a.prev) {
        if (a.i !== b.i && isValidDiagonal(a, b)) {
          let c = splitPolygon(a, b);
          a = filterPoints(a, a.next); c = filterPoints(c, c.next);
          earcutLinked(a, triangles, minX, minY, invSize, 0);
          earcutLinked(c, triangles, minX, minY, invSize, 0);
          return;
        }
        b = b.next;
      }
      a = a.next;
    } while (a !== start);
  }
  function eliminateHoles(data, holeIndices, outerNode) {
    const queue = [];
    for (let i = 0; i < holeIndices.length; i++) {
      const start = holeIndices[i] * 2, end = i < holeIndices.length - 1 ? holeIndices[i + 1] * 2 : data.length;
      const list = linkedList(data, start, end, false);
      if (!list) continue;
      if (list === list.next) list.steiner = true;
      queue.push(getLeftmost(list));
    }
    queue.sort((a, b) => a.x - b.x);
    for (const h of queue) outerNode = eliminateHole(h, outerNode);
    return outerNode;
  }
  function eliminateHole(hole, outerNode) {
    const bridge = findHoleBridge(hole, outerNode);
    if (!bridge) return outerNode;
    const bridgeReverse = splitPolygon(bridge, hole);
    filterPoints(bridgeReverse, bridgeReverse.next);
    return filterPoints(bridge, bridge.next);
  }
  function findHoleBridge(hole, outerNode) {
    let p = outerNode, qx = -Infinity, m;
    const hx = hole.x, hy = hole.y;
    do {
      if (hy <= p.y && hy >= p.next.y && p.next.y !== p.y) {
        const x = p.x + (hy - p.y) * (p.next.x - p.x) / (p.next.y - p.y);
        if (x <= hx && x > qx) { qx = x; m = p.x < p.next.x ? p : p.next; if (x === hx) return m; }
      }
      p = p.next;
    } while (p !== outerNode);
    if (!m) return null;
    const stop = m, mx = m.x, my = m.y;
    let tanMin = Infinity;
    p = m;
    do {
      if (hx >= p.x && p.x >= mx && hx !== p.x && pointInTriangle(hy < my ? hx : qx, hy, mx, my, hy < my ? qx : hx, hy, p.x, p.y)) {
        const tan = Math.abs(hy - p.y) / (hx - p.x);
        if (locallyInside(p, hole) && (tan < tanMin || (tan === tanMin && (p.x > m.x || (p.x === m.x && sectorContainsSector(m, p)))))) { m = p; tanMin = tan; }
      }
      p = p.next;
    } while (p !== stop);
    return m;
  }
  function sectorContainsSector(m, p) { return area(m.prev, m, p.prev) < 0 && area(p.next, m, m.next) < 0; }
  function indexCurve(start, minX, minY, invSize) {
    let p = start;
    do { if (p.z === 0) p.z = zOrder(p.x, p.y, minX, minY, invSize); p.prevZ = p.prev; p.nextZ = p.next; p = p.next; } while (p !== start);
    p.prevZ.nextZ = null; p.prevZ = null;
    sortLinked(p);
  }
  function sortLinked(list) {
    let inSize = 1, numMerges;
    do {
      let p = list, tail = null;
      list = null; numMerges = 0;
      while (p) {
        numMerges++;
        let q = p, pSize = 0;
        for (let i = 0; i < inSize; i++) { pSize++; q = q.nextZ; if (!q) break; }
        let qSize = inSize;
        while (pSize > 0 || (qSize > 0 && q)) {
          let e;
          if (pSize !== 0 && (qSize === 0 || !q || p.z <= q.z)) { e = p; p = p.nextZ; pSize--; } else { e = q; q = q.nextZ; qSize--; }
          if (tail) tail.nextZ = e; else list = e;
          e.prevZ = tail; tail = e;
        }
        p = q;
      }
      tail.nextZ = null; inSize *= 2;
    } while (numMerges > 1);
    return list;
  }
  function zOrder(x, y, minX, minY, invSize) {
    x = ((x - minX) * invSize) | 0; y = ((y - minY) * invSize) | 0;
    x = (x | (x << 8)) & 0x00FF00FF; x = (x | (x << 4)) & 0x0F0F0F0F; x = (x | (x << 2)) & 0x33333333; x = (x | (x << 1)) & 0x55555555;
    y = (y | (y << 8)) & 0x00FF00FF; y = (y | (y << 4)) & 0x0F0F0F0F; y = (y | (y << 2)) & 0x33333333; y = (y | (y << 1)) & 0x55555555;
    return x | (y << 1);
  }
  function getLeftmost(start) { let p = start, l = start; do { if (p.x < l.x || (p.x === l.x && p.y < l.y)) l = p; p = p.next; } while (p !== start); return l; }
  function pointInTriangle(ax, ay, bx, by, cx, cy, px, py) {
    return (cx - px) * (ay - py) >= (ax - px) * (cy - py) && (ax - px) * (by - py) >= (bx - px) * (ay - py) && (bx - px) * (cy - py) >= (cx - px) * (by - py);
  }
  function isValidDiagonal(a, b) {
    return a.next.i !== b.i && a.prev.i !== b.i && !intersectsPolygon(a, b) &&
      ((locallyInside(a, b) && locallyInside(b, a) && middleInside(a, b) && (area(a.prev, a, b.prev) || area(a, b.prev, b))) ||
       (equals(a, b) && area(a.prev, a, a.next) > 0 && area(b.prev, b, b.next) > 0));
  }
  function area(p, q, r) { return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y); }
  function equals(a, b) { return a.x === b.x && a.y === b.y; }
  function sign(v) { return v > 0 ? 1 : v < 0 ? -1 : 0; }
  function onSegment(p, q, r) { return q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) && q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y); }
  function intersects(p1, q1, p2, q2) {
    const o1 = sign(area(p1, q1, p2)), o2 = sign(area(p1, q1, q2)), o3 = sign(area(p2, q2, p1)), o4 = sign(area(p2, q2, q1));
    if (o1 !== o2 && o3 !== o4) return true;
    if (o1 === 0 && onSegment(p1, p2, q1)) return true;
    if (o2 === 0 && onSegment(p1, q2, q1)) return true;
    if (o3 === 0 && onSegment(p2, p1, q2)) return true;
    if (o4 === 0 && onSegment(p2, q1, q2)) return true;
    return false;
  }
  function intersectsPolygon(a, b) {
    let p = a;
    do { if (p.i !== a.i && p.next.i !== a.i && p.i !== b.i && p.next.i !== b.i && intersects(p, p.next, a, b)) return true; p = p.next; } while (p !== a);
    return false;
  }
  function locallyInside(a, b) {
    return area(a.prev, a, a.next) < 0 ? area(a, b, a.next) >= 0 && area(a, a.prev, b) >= 0 : area(a, b, a.prev) < 0 || area(a, a.next, b) < 0;
  }
  function middleInside(a, b) {
    let p = a, inside = false;
    const px = (a.x + b.x) / 2, py = (a.y + b.y) / 2;
    do { if (((p.y > py) !== (p.next.y > py)) && p.next.y !== p.y && (px < (p.next.x - p.x) * (py - p.y) / (p.next.y - p.y) + p.x)) inside = !inside; p = p.next; } while (p !== a);
    return inside;
  }
  function splitPolygon(a, b) {
    const a2 = new Node(a.i, a.x, a.y), b2 = new Node(b.i, b.x, b.y), an = a.next, bp = b.prev;
    a.next = b; b.prev = a; a2.next = an; an.prev = a2; b2.next = a2; a2.prev = b2; bp.next = b2; b2.prev = bp;
    return b2;
  }
  function insertNode(i, x, y, last) {
    const p = new Node(i, x, y);
    if (!last) { p.prev = p; p.next = p; } else { p.next = last.next; p.prev = last; last.next.prev = p; last.next = p; }
    return p;
  }
  function removeNode(p) {
    p.next.prev = p.prev; p.prev.next = p.next;
    if (p.prevZ) p.prevZ.nextZ = p.nextZ;
    if (p.nextZ) p.nextZ.prevZ = p.prevZ;
  }
  function Node(i, x, y) { this.i = i; this.x = x; this.y = y; this.prev = null; this.next = null; this.z = 0; this.prevZ = null; this.nextZ = null; this.steiner = false; }
  function signedArea(data, start, end) {
    let sum = 0;
    for (let i = start, j = end - 2; i < end; i += 2) { sum += (data[j] - data[i]) * (data[i + 1] + data[j + 1]); j = i; }
    return sum;
  }

  /* ================================================================
   * Polygons
   * ================================================================ */
  function polyArea(l) { let a = 0; for (let i = 0, j = l.length - 1; i < l.length; j = i++) a += (l[j][0] - l[i][0]) * (l[j][1] + l[i][1]); return a / 2; }   // > 0: counter-clockwise (y up)
  function perimeter(l) { let s = 0; for (let i = 0, j = l.length - 1; i < l.length; j = i++) s += Math.hypot(l[i][0] - l[j][0], l[i][1] - l[j][1]); return s; }
  function bboxOf(l) { const b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }; for (const [x, y] of l) { if (x < b.x0) b.x0 = x; if (y < b.y0) b.y0 = y; if (x > b.x1) b.x1 = x; if (y > b.y1) b.y1 = y; } return b; }
  function inside(l, x, y) { let c = false; for (let i = 0, j = l.length - 1; i < l.length; j = i++) { const a = l[i], b = l[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
  // Douglas–Peucker on a closed ring
  function simplify(l, tol) {
    if (l.length < 6) return l;
    let far = 0, fd = -1;
    for (let i = 1; i < l.length; i++) { const d = Math.hypot(l[i][0] - l[0][0], l[i][1] - l[0][1]); if (d > fd) { fd = d; far = i; } }
    const ring = l.concat([l[0]]), keep = new Uint8Array(ring.length);
    keep[0] = keep[far] = keep[ring.length - 1] = 1;
    const st = [[0, far], [far, ring.length - 1]];
    while (st.length) {
      const [a, b] = st.pop();
      if (b - a < 2) continue;
      const [x0, y0] = ring[a], [x1, y1] = ring[b], len = Math.hypot(x1 - x0, y1 - y0) || 1e-12;
      let mi = -1, md = 0;
      for (let i = a + 1; i < b; i++) { const d = Math.abs((x1 - x0) * (y0 - ring[i][1]) - (x0 - ring[i][0]) * (y1 - y0)) / len; if (d > md) { md = d; mi = i; } }
      if (md > tol) { keep[mi] = 1; st.push([a, mi], [mi, b]); }
    }
    const out = ring.filter((_, i) => keep[i]); out.pop();
    return out.length >= 3 ? out : l;
  }

  /* ================================================================
   * Drawing and tracing
   * region: {x0, y0, x1, y1} in mm, s: pixels per mm, draw(ctx) in mm (y up)
   * → [ring] in mm, with the picture inside the contours (≥ 50 % coverage)
   * ================================================================ */
  function trace(region, s, draw) {
    const W = Math.ceil((region.x1 - region.x0) * s) + 2, H = Math.ceil((region.y1 - region.y0) * s) + 2;
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d", { willReadFrequently: true });
    g.setTransform(s, 0, 0, -s, -region.x0 * s + 1, region.y1 * s + 1);     // 1 pixel empty border
    g.lineCap = "round"; g.lineJoin = "round";
    draw(g);
    const rgba = g.getImageData(0, 0, W, H).data, v = new Uint8Array(W * H);
    for (let i = 0; i < v.length; i++) v[i] = rgba[i * 4 + 3];
    for (let x = 0; x < W; x++) { v[x] = 0; v[(H - 1) * W + x] = 0; }
    for (let y = 0; y < H; y++) { v[y * W] = 0; v[y * W + W - 1] = 0; }
    const rings = marchingSquares(v, W, H, 127.5);
    // pixel corner (0, 0) is the top left of pixel 0; sample i sits at its centre i + 0.5
    return rings.map((r) => simplify(r.map(([px, py]) => [region.x0 + (px + 0.5 - 1) / s, region.y1 - (py + 0.5 - 1) / s]), 0.35 / s));
  }
  /* closed iso-lines through the samples (pixel centres); every crossing point is the end of one
   * segment and the start of the next one, so the segments link up into rings */
  function marchingSquares(v, W, H, iso) {
    const next = new Map(), pts = new Map();
    const pt = (id, x, y) => { if (!pts.has(id)) pts.set(id, [x, y]); };
    // edge ids: horizontal edge from (x, y) to (x + 1, y): 2 (y W + x); vertical from (x, y) to (x, y + 1): 2 (y W + x) + 1
    const hEdge = (x, y) => { const id = 2 * (y * W + x), a = v[y * W + x], b = v[y * W + x + 1]; pt(id, x + (iso - a) / (b - a), y); return id; };
    const vEdge = (x, y) => { const id = 2 * (y * W + x) + 1, a = v[y * W + x], b = v[(y + 1) * W + x]; pt(id, x, y + (iso - a) / (b - a)); return id; };
    for (let y = 0; y < H - 1; y++) for (let x = 0; x < W - 1; x++) {
      const a = v[y * W + x] > iso, b = v[y * W + x + 1] > iso, c = v[(y + 1) * W + x + 1] > iso, d = v[(y + 1) * W + x] > iso;
      const k = (a ? 1 : 0) | (b ? 2 : 0) | (c ? 4 : 0) | (d ? 8 : 0);
      if (k === 0 || k === 15) continue;
      // edges: T (a-b), R (b-c), B (d-c), L (a-d); segments with the inside on the left (y down: turning clockwise)
      const T = () => hEdge(x, y), R = () => vEdge(x + 1, y), B = () => hEdge(x, y + 1), L = () => vEdge(x, y);
      const seg = (p, q) => next.set(p, q);
      switch (k) {
        case 1: seg(L(), T()); break;            // a
        case 2: seg(T(), R()); break;            // b
        case 3: seg(L(), R()); break;            // a b
        case 4: seg(R(), B()); break;            // c
        case 6: seg(T(), B()); break;            // b c
        case 7: seg(L(), B()); break;            // a b c
        case 8: seg(B(), L()); break;            // d
        case 9: seg(B(), T()); break;            // a d
        case 11: seg(B(), R()); break;           // a b d
        case 12: seg(R(), L()); break;           // c d
        case 13: seg(R(), T()); break;           // a c d
        case 14: seg(T(), L()); break;           // b c d
        case 5: case 10: {                        // saddle: decide by the centre
          const mid = (v[y * W + x] + v[y * W + x + 1] + v[(y + 1) * W + x + 1] + v[(y + 1) * W + x]) / 4 > iso;
          if (k === 5) { if (mid) { seg(L(), B()); seg(R(), T()); } else { seg(L(), T()); seg(R(), B()); } }
          else { if (mid) { seg(T(), L()); seg(B(), R()); } else { seg(T(), R()); seg(B(), L()); } }
          break;
        }
      }
    }
    const rings = [], done = new Set();
    for (const start of next.keys()) {
      if (done.has(start)) continue;
      const r = []; let e = start, guard = 0;
      while (!done.has(e) && guard++ < 5e6) { done.add(e); r.push(pts.get(e)); e = next.get(e); if (e === undefined) break; }
      if (r.length >= 3) rings.push(r);
    }
    return rings;
  }

  // the operations of a parsed Gerber layer drawn into ctx (mm), openings grown (offset > 0) or shrunk
  function drawLayer(ctx, layers, offset) {
    const px = 1 / Math.hypot(ctx.getTransform().a, ctx.getTransform().b);
    for (const g of layers) for (const o of g.ops) {
      ctx.globalCompositeOperation = o.pol ? "source-over" : "destination-out";
      ctx.fillStyle = ctx.strokeStyle = "#000";
      if (o.fill) {
        ctx.fill(o.path, o.rule || "nonzero");
        if (offset > 0 && o.pol) { ctx.lineWidth = 2 * offset; ctx.stroke(o.path); }
      } else {
        const w = o.width + 2 * (o.pol ? offset : 0);
        if (w <= 0 && o.width > 0) continue;
        ctx.lineWidth = Math.max(w, px); ctx.stroke(o.path);
      }
    }
    if (offset < 0) {
      // shrink: take a band of the offset off along every filled outline
      ctx.globalCompositeOperation = "destination-out";
      for (const g of layers) for (const o of g.ops) if (o.fill && o.pol) { ctx.lineWidth = -2 * offset; ctx.stroke(o.path); }
    }
    ctx.globalCompositeOperation = "source-over";
  }

  /* ================================================================
   * Board from files
   * ================================================================ */
  function isNonPlated(name, text) {
    if (/npth|non[_ -]?plated|nonplated|unplated/i.test(name)) return true;
    const h = text.slice(0, 3000);
    return /TF\.FileFunction,NonPlated/i.test(h) || /;\s*TYPE\s*=\s*NON_PLATED/i.test(h);
  }
  // files: [{name, text}] → {paste: {top, bottom}, loops, bbox, holes, warnings, files}
  function readBoard(files) {
    const G = global.GERBER, b = { paste: { top: [], bottom: [] }, holes: [], warnings: [], files: [], outline: "" };
    for (const f of files) {
      const isDrill = /^\s*(;[^\n]*\n\s*)*M48/m.test(f.text.slice(0, 2000));
      let type = isDrill ? "drill" : G.identify(f.name, f.text);
      if (!isDrill && type !== "ignore" && !G.isGerber(f.text)) type = "ignore";
      b.files.push({ name: f.name, type });
      try {
        if (type === "drill") { const npth = isNonPlated(f.name, f.text); G.parseExcellon(f.text).holes.forEach((h) => { if (h.x1 === undefined && h.d > 0) b.holes.push({ x: h.x, y: h.y, d: h.d, npth }); }); }
        else if (type === "top-paste" || type === "bottom-paste") { const g = G.parseGerber(f.text); b.paste[type === "top-paste" ? "top" : "bottom"].push(g); g.warnings.forEach((w) => b.warnings.push(f.name + ": " + w)); }
        else if (type === "outline") b.outline += f.text + "\n";
      } catch (e) { b.warnings.push(f.name + ": could not be read (" + e.message + ")"); }
    }
    let loops = [];
    if (b.outline) { const bb = G.buildBoard([{ name: "outline", type: "outline", text: b.outline }]); if (!bb.noOutline) loops = bb.loops; }
    if (!loops.length) {
      // without an outline: the extents of the copper and paste layers
      const bb = G.buildBoard(files.filter((f) => /copper|paste|mask/.test(G.identify(f.name, f.text))).map((f) => ({ name: f.name, type: G.identify(f.name, f.text).replace("paste", "copper"), text: f.text })));
      if (bb.bbox.valid()) { const x = bb.bbox; loops = [[[x.x0, x.y0], [x.x1, x.y0], [x.x1, x.y1], [x.x0, x.y1], [x.x0, x.y0]]]; }
      b.noOutline = true;
      b.warnings.push("No closed board outline found: the extents of the layers are used as a rectangle.");
    }
    b.loops = loops;
    let best = 0;
    loops.forEach((l) => { const a = Math.abs(polyArea(l)); if (a > best) { best = a; b.outer = l; } });
    b.bbox = b.outer ? bboxOf(b.outer) : null;
    return b;
  }

  /* ================================================================
   * The stencil
   * o: {side, thick, offset, border, frame: none|pocket|rect, frameH, clear, pins: [hole], pinClear, pinLen, mark}
   * → {apertures (mm, board coordinates), plate, pocket, pins, mesh: Float32Array (9 per triangle), info, warnings}
   * ================================================================ */
  function build(board, o) {
    const warnings = [], layers = board.paste[o.side];
    if (!board.bbox) return null;
    const bb = board.bbox, region = { x0: bb.x0 - 1, y0: bb.y0 - 1, x1: bb.x1 + 1, y1: bb.y1 + 1 };
    const area = (region.x1 - region.x0) * (region.y1 - region.y0), s = Math.max(8, Math.min(40, Math.sqrt(14e6 / area)));
    // openings
    let rings = layers.length ? trace(region, s, (g) => drawLayer(g, layers, o.offset)) : [];
    // the traced outlines run counter-clockwise around the openings, clockwise around pieces inside them
    const outer = rings.filter((r) => polyArea(r) > 0), islands = rings.filter((r) => polyArea(r) < 0);
    let apertures = outer.filter((r) => polyArea(r) > 0.0004);
    if (islands.length) warnings.push(islands.length + " pieces of stencil inside openings would fall out; they are left open.");
    // openings outside the board are dropped
    const inB = (r) => { const b = bboxOf(r); return b.x1 > bb.x0 && b.x0 < bb.x1 && b.y1 > bb.y0 && b.y0 < bb.y1; };
    apertures = apertures.filter(inB);
    // narrowest width of an opening, from area and perimeter as for a rectangle (or a circle)
    const widthOf = (r) => { const A = Math.abs(polyArea(r)), P = perimeter(r), d = P * P / 4 - 4 * A; return d > 0 ? (P / 2 - Math.sqrt(d)) / 2 : 2 * Math.sqrt(A / Math.PI); };
    const thin = apertures.filter((r) => widthOf(r) < 0.25).length;
    if (thin) warnings.push(thin + (thin === 1 ? " opening is" : " openings are") + " narrower than 0.25 mm and may close up when printed.");
    if (!layers.length) warnings.push("This side has no paste layer.");
    else if (!apertures.length) warnings.push("The paste layer of this side has no openings.");

    // plate in board coordinates (top view of the side in use: for the bottom, mirrored)
    const m = o.side === "bottom" ? -1 : 1, B = o.border;
    const X = (x) => m * x;      // board → use view
    const ub = { x0: Math.min(X(bb.x0), X(bb.x1)) - B, x1: Math.max(X(bb.x0), X(bb.x1)) + B, y0: bb.y0 - B, y1: bb.y1 + B };
    const ch = o.mark ? Math.min(B, 6) : 0;
    let plate = [[ub.x0, ub.y0], [ub.x1, ub.y0], [ub.x1, ub.y1], ch ? [ub.x0 + ch, ub.y1] : [ub.x0, ub.y1]];
    if (ch) plate.push([ub.x0, ub.y1 - ch]);
    const toUse = (r) => r.map(([x, y]) => [X(x), y]);
    let ap = apertures.map(toUse);
    // pocket for the board: the outline grown by the clearance
    let pocket = null;
    if (o.frame === "pocket") {
      if (o.clear * 2 + 1 >= B) warnings.push("The border is too narrow for the frame.");
      const reg = { x0: bb.x0 - o.clear - 1, y0: bb.y0 - o.clear - 1, x1: bb.x1 + o.clear + 1, y1: bb.y1 + o.clear + 1 };
      const s2 = Math.max(8, Math.min(40, Math.sqrt(6e6 / ((reg.x1 - reg.x0) * (reg.y1 - reg.y0)))));
      const r = trace(reg, s2, (g) => { const p = new Path2D(); board.outer.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); g.fill(p); if (o.clear > 0) { g.lineWidth = 2 * o.clear; g.stroke(p); } });
      let best = null; r.forEach((q) => { if (!best || Math.abs(polyArea(q)) > Math.abs(polyArea(best))) best = q; });
      pocket = best ? toUse(best) : null;
    } else if (o.frame === "rect") {
      const c = o.clear;
      pocket = toUse([[bb.x0 - c, bb.y0 - c], [bb.x1 + c, bb.y0 - c], [bb.x1 + c, bb.y1 + c], [bb.x0 - c, bb.y1 + c]]);
    }
    // pins
    const pins = (o.pins || []).map((h) => ({ x: X(h.x), y: h.y, d: Math.max(0.3, h.d - o.pinClear) }));
    pins.forEach((p) => { if (ap.some((r) => inside(r, p.x, p.y))) warnings.push("A pin sits in a paste opening."); });

    // print orientation: turned over (180° about the x axis): (x, y) → (x − x0, y1 − y), the plate lies on the bed
    const P = (pt) => [pt[0] - ub.x0, ub.y1 - pt[1]];
    const tris = [];
    const ccw = (r) => (polyArea(r) < 0 ? r.slice().reverse() : r);           // after the turn: ccw in print coordinates
    const ring = (r) => ccw(r.map(P));
    const holes = ap.map((r) => ring(r).reverse());
    if (pocket && o.frameH > 0) {
      // one closed body: the thin plate inside the pocket, the frame around it, joined along the pocket edge
      const pk = ring(pocket), z1 = o.thick + o.frameH;
      cap(tris, pk, holes, 0, false); cap(tris, pk, holes, o.thick, true);
      holes.forEach((h) => wall(tris, h, 0, o.thick));
      cap(tris, ring(plate), [pk.slice().reverse()], 0, false); cap(tris, ring(plate), [pk.slice().reverse()], z1, true);
      wall(tris, ring(plate), 0, z1); wall(tris, pk.slice().reverse(), o.thick, z1);
    } else extrude(tris, ring(plate), holes, 0, o.thick);
    pins.forEach((p) => { const [x, y] = P([p.x, p.y]); cylinder(tris, x, y, p.d / 2, o.thick / 2, o.thick + o.pinLen, Math.min(0.25, p.d / 6)); });
    const W = ub.x1 - ub.x0, Hh = ub.y1 - ub.y0;
    return {
      apertures: ap, plate, pocket, pins, ub, mesh: new Float32Array(tris), warnings,
      info: { W, H: Hh, Z: o.thick + Math.max(pocket ? o.frameH : 0, pins.length ? o.pinLen : 0), openings: ap.length, triangles: tris.length / 9, area: ap.reduce((a, r) => a + Math.abs(polyArea(r)), 0) }
    };
  }

  /* ================================================================
   * Meshes: triangles as flat arrays of x, y, z (counter-clockwise from outside)
   * ================================================================ */
  // outer: ccw ring, holes: cw rings (print coordinates)
  function extrude(tris, outer, holes, z0, z1) {
    cap(tris, outer, holes, z0, false); cap(tris, outer, holes, z1, true);
    [outer].concat(holes).forEach((r) => wall(tris, r, z0, z1));
  }
  // a flat face at height z, facing up or down
  function cap(tris, outer, holes, z, up) {
    const data = [], holeIdx = [];
    outer.forEach(([x, y]) => data.push(x, y));
    holes.forEach((h) => { holeIdx.push(data.length / 2); h.forEach(([x, y]) => data.push(x, y)); });
    const idx = earcut(data, holeIdx);
    for (let i = 0; i < idx.length; i += 3) {
      const a = idx[i], b = idx[i + 1], c = idx[i + 2];
      const ax = data[2 * a], ay = data[2 * a + 1], bx = data[2 * b], by = data[2 * b + 1], cx = data[2 * c], cy = data[2 * c + 1];
      const ccwT = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax) > 0;
      if (ccwT === up) tris.push(ax, ay, z, bx, by, z, cx, cy, z); else tris.push(ax, ay, z, cx, cy, z, bx, by, z);
    }
  }
  function wall(tris, r, z0, z1) {
    for (let i = 0; i < r.length; i++) {
      const [px, py] = r[i], [qx, qy] = r[(i + 1) % r.length];
      tris.push(px, py, z0, qx, qy, z0, qx, qy, z1, px, py, z0, qx, qy, z1, px, py, z1);
    }
  }
  // a pin with a small chamfer at the free end
  function cylinder(tris, x, y, r, z0, z1, ch) {
    const n = Math.max(16, Math.min(64, Math.round(r * 40))), c = [], t = [];
    for (let i = 0; i < n; i++) { const a = 2 * Math.PI * i / n; c.push([x + r * Math.cos(a), y + r * Math.sin(a)]); t.push([x + (r - ch) * Math.cos(a), y + (r - ch) * Math.sin(a)]); }
    const zc = z1 - ch;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      tris.push(c[i][0], c[i][1], z0, c[j][0], c[j][1], z0, c[j][0], c[j][1], zc, c[i][0], c[i][1], z0, c[j][0], c[j][1], zc, c[i][0], c[i][1], zc);
      tris.push(c[i][0], c[i][1], zc, c[j][0], c[j][1], zc, t[j][0], t[j][1], z1, c[i][0], c[i][1], zc, t[j][0], t[j][1], z1, t[i][0], t[i][1], z1);
      tris.push(x, y, z1, t[i][0], t[i][1], z1, t[j][0], t[j][1], z1);
      tris.push(x, y, z0, c[j][0], c[j][1], z0, c[i][0], c[i][1], z0);
    }
  }

  // binary STL
  function stl(mesh, name) {
    const n = mesh.length / 9, buf = new ArrayBuffer(84 + 50 * n), dv = new DataView(buf);
    const head = ("Solder paste stencil " + (name || "")).slice(0, 79);
    for (let i = 0; i < head.length; i++) dv.setUint8(i, head.charCodeAt(i) & 127);
    dv.setUint32(80, n, true);
    for (let t = 0, o = 84; t < n; t++, o += 50) {
      const k = t * 9, ax = mesh[k], ay = mesh[k + 1], az = mesh[k + 2], bx = mesh[k + 3], by = mesh[k + 4], bz = mesh[k + 5], cx = mesh[k + 6], cy = mesh[k + 7], cz = mesh[k + 8];
      let nx = (by - ay) * (cz - az) - (bz - az) * (cy - ay), ny = (bz - az) * (cx - ax) - (bx - ax) * (cz - az), nz = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
      const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      dv.setFloat32(o, nx, true); dv.setFloat32(o + 4, ny, true); dv.setFloat32(o + 8, nz, true);
      for (let j = 0; j < 9; j++) dv.setFloat32(o + 12 + 4 * j, mesh[k + j], true);
    }
    return buf;
  }
  // SVG of plate and openings in mm, as seen from above in use (for laser cutters and cutting plotters)
  function svg(res, name) {
    const ub = res.ub, f = (v) => (Math.round(v * 1000) / 1000).toString();
    const path = (r) => "M" + r.map(([x, y]) => f(x - ub.x0) + " " + f(ub.y1 - y)).join("L") + "Z";
    const W = ub.x1 - ub.x0, H = ub.y1 - ub.y0;
    return '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="' + f(W) + 'mm" height="' + f(H) + 'mm" viewBox="0 0 ' + f(W) + " " + f(H) + '">\n' +
      "<title>" + (name || "stencil").replace(/[<&]/g, "") + " solder paste stencil</title>\n" +
      '<path d="' + path(res.plate) + '" fill="none" stroke="#000" stroke-width="0.05"/>\n' +
      '<path d="' + res.apertures.map(path).join("") + '" fill="#000" stroke="none"/>\n</svg>\n';
  }

  global.STENCIL = { earcut, readBoard, build, stl, svg, trace, polyArea, inside };
})(typeof window !== "undefined" ? window : globalThis);
