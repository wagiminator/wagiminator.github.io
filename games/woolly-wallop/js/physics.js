/* Woolly Wallop: a small rigid-body physics engine – boxes and circles, sequential impulses with
   warm starting (after the ideas of Box2D Lite), friction, bounce, sleeping and impact reports.
   Units are metres and seconds; y points down. */
"use strict";

(function (WW) {
  const P = (WW.Phys = {});
  const ALLOWED = 0.01, BIAS = 0.2, ITER = 12;

  let nextId = 1;
  P.body = function (o) {
    const b = {
      id: nextId++, shape: o.shape || "box", x: o.x, y: o.y, a: o.a || 0, vx: o.vx || 0, vy: o.vy || 0, w: o.w || 0,
      hw: (o.width || 1) / 2, hh: (o.height || 1) / 2, r: o.r || 0.5,
      friction: o.friction ?? 0.6, bounce: o.bounce ?? 0.1, static: !!o.static, sleeping: false, sleepT: 0,
      data: o.data || null, dead: false,
    };
    const area = b.shape === "circle" ? Math.PI * b.r * b.r : 4 * b.hw * b.hh;
    if (b.static) { b.mass = Infinity; b.im = 0; b.ii = 0; }
    else {
      b.mass = (o.density || 1) * area;
      b.im = 1 / b.mass;
      const I = b.shape === "circle" ? 0.5 * b.mass * b.r * b.r : (b.mass * (4 * b.hw * b.hw + 4 * b.hh * b.hh)) / 12;
      b.ii = 1 / I;
    }
    return b;
  };

  P.world = function (gravity = 10) {
    return { bodies: [], arbiters: new Map(), g: gravity, impacts: [], time: 0 };
  };
  P.add = (wd, b) => { wd.bodies.push(b); return b; };
  P.remove = function (wd, b) {
    b.dead = true;
    P.wakeNear(wd, b, 0.35);
  };
  P.wake = (b) => { if (!b.static && b.sleeping) { b.sleeping = false; b.sleepT = 0; } };

  /* ---------- bounding boxes ---------- */
  function aabb(b) {
    if (b.shape === "circle") return [b.x - b.r, b.y - b.r, b.x + b.r, b.y + b.r];
    const c = Math.abs(Math.cos(b.a)), s = Math.abs(Math.sin(b.a));
    const ex = c * b.hw + s * b.hh, ey = s * b.hw + c * b.hh;
    return [b.x - ex, b.y - ey, b.x + ex, b.y + ey];
  }
  P.aabb = aabb;
  P.wakeNear = function (wd, b, m) {
    const A = aabb(b);
    for (const o of wd.bodies) {
      if (o === b || o.static || !o.sleeping || o.dead) continue;
      const B = aabb(o);
      if (A[0] - m < B[2] && A[2] + m > B[0] && A[1] - m < B[3] && A[3] + m > B[1]) P.wake(o);
    }
  };

  /* ---------- collision: box/box (clipping), box/circle, circle/circle ---------- */
  // contact: { x, y, nx, ny, sep, key }  normal points from a to b
  function rot(a) { return [Math.cos(a), Math.sin(a)]; }
  function clip(vin, nx, ny, off, edge) {
    const out = [];
    const d0 = nx * vin[0].x + ny * vin[0].y - off, d1 = nx * vin[1].x + ny * vin[1].y - off;
    if (d0 <= 0) out.push(vin[0]);
    if (d1 <= 0) out.push(vin[1]);
    if (d0 * d1 < 0) {
      const t = d0 / (d0 - d1);
      const v = { x: vin[0].x + t * (vin[1].x - vin[0].x), y: vin[0].y + t * (vin[1].y - vin[0].y) };
      if (d0 > 0) v.fp = Object.assign({}, vin[0].fp, { i1: edge, i2: 0 });
      else v.fp = Object.assign({}, vin[1].fp, { o1: edge, o2: 0 });
      out.push(v);
    }
    return out;
  }
  function incident(hx, hy, px, py, c, s, nx, ny) {
    // the normal in the incident box's frame, flipped
    const n0 = -(c * nx + s * ny), n1 = -(-s * nx + c * ny);
    let v;
    if (Math.abs(n0) > Math.abs(n1)) {
      v = n0 > 0 ? [[hx, -hy, 3, 4], [hx, hy, 4, 1]] : [[-hx, hy, 1, 2], [-hx, -hy, 2, 3]];
    } else {
      v = n1 > 0 ? [[hx, hy, 4, 1], [-hx, hy, 1, 2]] : [[-hx, -hy, 2, 3], [hx, -hy, 3, 4]];
    }
    return v.map(([x, y, i2, o2]) => ({ x: px + c * x - s * y, y: py + s * x + c * y, fp: { i1: 0, o1: 0, i2, o2 } }));
  }
  function boxBox(A, B) {
    const [cA, sA] = rot(A.a), [cB, sB] = rot(B.a);
    const dpx = B.x - A.x, dpy = B.y - A.y;
    const dAx = cA * dpx + sA * dpy, dAy = -sA * dpx + cA * dpy;
    const dBx = cB * dpx + sB * dpy, dBy = -sB * dpx + cB * dpy;
    const d = B.a - A.a, ac = Math.abs(Math.cos(d)), as = Math.abs(Math.sin(d));
    const fAx = Math.abs(dAx) - A.hw - (ac * B.hw + as * B.hh), fAy = Math.abs(dAy) - A.hh - (as * B.hw + ac * B.hh);
    if (fAx > 0 || fAy > 0) return [];
    const fBx = Math.abs(dBx) - (ac * A.hw + as * A.hh) - B.hw, fBy = Math.abs(dBy) - (as * A.hw + ac * A.hh) - B.hh;
    if (fBx > 0 || fBy > 0) return [];
    let axis = 0, sep = fAx, nx = dAx > 0 ? cA : -cA, ny = dAx > 0 ? sA : -sA;
    const RT = 0.95, AT = 0.01;
    if (fAy > RT * sep + AT * A.hh) { axis = 1; sep = fAy; nx = dAy > 0 ? -sA : sA; ny = dAy > 0 ? cA : -cA; }
    if (fBx > RT * sep + AT * B.hw) { axis = 2; sep = fBx; nx = dBx > 0 ? cB : -cB; ny = dBx > 0 ? sB : -sB; }
    if (fBy > RT * sep + AT * B.hh) { axis = 3; sep = fBy; nx = dBy > 0 ? -sB : sB; ny = dBy > 0 ? cB : -cB; }
    let fnx, fny, front, snx, sny, side, negSide, posSide, negEdge, posEdge, inc;
    if (axis === 0) {
      fnx = nx; fny = ny; front = A.x * fnx + A.y * fny + A.hw;
      snx = -sA; sny = cA; side = A.x * snx + A.y * sny;
      negSide = -side + A.hh; posSide = side + A.hh; negEdge = 3; posEdge = 1;
      inc = incident(B.hw, B.hh, B.x, B.y, cB, sB, fnx, fny);
    } else if (axis === 1) {
      fnx = nx; fny = ny; front = A.x * fnx + A.y * fny + A.hh;
      snx = cA; sny = sA; side = A.x * snx + A.y * sny;
      negSide = -side + A.hw; posSide = side + A.hw; negEdge = 2; posEdge = 4;
      inc = incident(B.hw, B.hh, B.x, B.y, cB, sB, fnx, fny);
    } else if (axis === 2) {
      fnx = -nx; fny = -ny; front = B.x * fnx + B.y * fny + B.hw;
      snx = -sB; sny = cB; side = B.x * snx + B.y * sny;
      negSide = -side + B.hh; posSide = side + B.hh; negEdge = 3; posEdge = 1;
      inc = incident(A.hw, A.hh, A.x, A.y, cA, sA, fnx, fny);
    } else {
      fnx = -nx; fny = -ny; front = B.x * fnx + B.y * fny + B.hh;
      snx = cB; sny = sB; side = B.x * snx + B.y * sny;
      negSide = -side + B.hw; posSide = side + B.hw; negEdge = 2; posEdge = 4;
      inc = incident(A.hw, A.hh, A.x, A.y, cA, sA, fnx, fny);
    }
    let cp = clip(inc, -snx, -sny, negSide, negEdge);
    if (cp.length < 2) return [];
    cp = clip(cp, snx, sny, posSide, posEdge);
    if (cp.length < 2) return [];
    const out = [];
    for (const v of cp) {
      const s = fnx * v.x + fny * v.y - front;
      if (s <= 0) {
        let fp = v.fp;
        if (axis >= 2) fp = { i1: fp.i2, o1: fp.o2, i2: fp.i1, o2: fp.o1 };
        out.push({ x: v.x - s * fnx, y: v.y - s * fny, nx, ny, sep: s, key: fp.i1 | (fp.o1 << 4) | (fp.i2 << 8) | (fp.o2 << 12) });
      }
    }
    return out;
  }
  function boxCircle(A, B) {
    const [c, s] = rot(A.a);
    const dx = B.x - A.x, dy = B.y - A.y;
    const px = c * dx + s * dy, py = -s * dx + c * dy;
    const qx = Math.max(-A.hw, Math.min(A.hw, px)), qy = Math.max(-A.hh, Math.min(A.hh, py));
    let lnx, lny, sep, cx = qx, cy = qy;
    if (qx === px && qy === py) {
      // the centre is inside the box
      const ex = A.hw - Math.abs(px), ey = A.hh - Math.abs(py);
      if (ex < ey) { lnx = Math.sign(px) || 1; lny = 0; sep = -ex - B.r; cx = lnx * A.hw; }
      else { lnx = 0; lny = Math.sign(py) || 1; sep = -ey - B.r; cy = lny * A.hh; }
    } else {
      const ddx = px - qx, ddy = py - qy, dist = Math.hypot(ddx, ddy);
      if (dist > B.r) return [];
      lnx = ddx / dist; lny = ddy / dist; sep = dist - B.r;
    }
    const nx = c * lnx - s * lny, ny = s * lnx + c * lny;
    return [{ x: A.x + c * cx - s * cy, y: A.y + s * cx + c * cy, nx, ny, sep, key: 1 }];
  }
  function circleCircle(A, B) {
    const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy);
    if (d > A.r + B.r) return [];
    const nx = d > 1e-9 ? dx / d : 0, ny = d > 1e-9 ? dy / d : 1;
    return [{ x: A.x + nx * A.r, y: A.y + ny * A.r, nx, ny, sep: d - A.r - B.r, key: 1 }];
  }
  function collide(a, b) {
    if (a.shape === "box" && b.shape === "box") return boxBox(a, b);
    if (a.shape === "box") return boxCircle(a, b);
    if (b.shape === "box") return boxCircle(b, a).map((k) => ({ x: k.x, y: k.y, nx: -k.nx, ny: -k.ny, sep: k.sep, key: k.key }));
    return circleCircle(a, b);
  }
  P.collide = collide;

  /* ---------- the step ---------- */
  const im = (b) => (b.sleeping ? 0 : b.im), ii = (b) => (b.sleeping ? 0 : b.ii);
  P.step = function (wd, dt) {
    const inv = 1 / dt, bodies = wd.bodies;
    wd.time += dt;
    // remove dead bodies
    if (bodies.some((b) => b.dead)) {
      wd.bodies = bodies.filter((b) => !b.dead);
      for (const [k, ar] of wd.arbiters) if (ar.a.dead || ar.b.dead) wd.arbiters.delete(k);
    }
    const B = wd.bodies, n = B.length;
    // broad phase and contacts
    const boxes = B.map(aabb);
    const seen = new Set();
    for (let i = 0; i < n; i++) {
      const a = B[i], A = boxes[i];
      const aIdle = a.static || a.sleeping;
      for (let j = i + 1; j < n; j++) {
        const b = B[j];
        if (aIdle && (b.static || b.sleeping)) continue;
        const Bb = boxes[j];
        if (A[0] > Bb[2] || A[2] < Bb[0] || A[1] > Bb[3] || A[3] < Bb[1]) continue;
        if (a.data && b.data && a.data.ghost && a.data.ghost === b.data.ghost) continue;
        const [p, q] = a.id < b.id ? [a, b] : [b, a];
        const key = p.id * 100000 + q.id;
        const cs = collide(p, q);
        if (!cs.length) continue;
        seen.add(key);
        let ar = wd.arbiters.get(key);
        if (!ar) { ar = { a: p, b: q, cs: [], f: Math.sqrt(p.friction * q.friction), e: Math.max(p.bounce, q.bounce), fresh: true }; wd.arbiters.set(key, ar); }
        else ar.fresh = false;
        // keep the accumulated impulses of matching contacts (warm starting)
        // (matched by position: feature ids flip too easily between equal boxes)
        for (const c of cs) {
          let old = null, bd = 0.012;
          for (const o of ar.cs) { if (o.used) continue; const d = (o.x - c.x) ** 2 + (o.y - c.y) ** 2; if (d < bd) { bd = d; old = o; } }
          if (old) old.used = true;
          c.pn = old ? old.pn : 0; c.pt = old ? old.pt : 0;
        }
        ar.cs = cs;
      }
    }
    for (const k of wd.arbiters.keys()) if (!seen.has(k)) wd.arbiters.delete(k);
    // wake sleepers that are hit
    for (const ar of wd.arbiters.values()) {
      const { a, b } = ar;
      if (a.sleeping !== b.sleeping && !a.static && !b.static) {
        const s = a.sleeping ? a : b, m = a.sleeping ? b : a;
        if (m.vx * m.vx + m.vy * m.vy > 0.25 || m.w * m.w > 1) P.wake(s);
      }
    }
    // forces
    for (const b of B) if (!b.static && !b.sleeping) { b.vy += wd.g * dt; }
    // pre-step: approach speeds first (before any warm starting changes the velocities)
    const ars = [...wd.arbiters.values()];
    for (const ar of ars) {
      const { a, b } = ar;
      for (const c of ar.cs) {
        const r1x = c.x - a.x, r1y = c.y - a.y, r2x = c.x - b.x, r2y = c.y - b.y;
        const dvx = b.vx - b.w * r2y - a.vx + a.w * r1y, dvy = b.vy + b.w * r2x - a.vy - a.w * r1x;
        c.vn = dvx * c.nx + dvy * c.ny;
      }
    }
    for (const ar of ars) {
      const { a, b } = ar, ia = im(a), ib = im(b), ja = ii(a), jb = ii(b);
      for (const c of ar.cs) {
        const r1x = c.x - a.x, r1y = c.y - a.y, r2x = c.x - b.x, r2y = c.y - b.y;
        const rn1 = r1x * c.nx + r1y * c.ny, rn2 = r2x * c.nx + r2y * c.ny;
        c.mn = 1 / (ia + ib + ja * (r1x * r1x + r1y * r1y - rn1 * rn1) + jb * (r2x * r2x + r2y * r2y - rn2 * rn2));
        const tx = c.ny, ty = -c.nx;
        const rt1 = r1x * tx + r1y * ty, rt2 = r2x * tx + r2y * ty;
        c.mt = 1 / (ia + ib + ja * (r1x * r1x + r1y * r1y - rt1 * rt1) + jb * (r2x * r2x + r2y * r2y - rt2 * rt2));
        c.bias = -BIAS * inv * Math.min(0, c.sep + ALLOWED);
        // bounce on real impacts only
        if (c.vn < -2 && ar.e > 0) c.bias = Math.max(c.bias, -ar.e * c.vn);
        c.r1x = r1x; c.r1y = r1y; c.r2x = r2x; c.r2y = r2y;
        const Px = c.pn * c.nx + c.pt * tx, Py = c.pn * c.ny + c.pt * ty;
        a.vx -= ia * Px; a.vy -= ia * Py; a.w -= ja * (r1x * Py - r1y * Px);
        b.vx += ib * Px; b.vy += ib * Py; b.w += jb * (r2x * Py - r2y * Px);
      }
    }
    // iterations
    for (let it = 0; it < ITER; it++) {
      for (const ar of ars) {
        const { a, b } = ar, ia = im(a), ib = im(b), ja = ii(a), jb = ii(b);
        for (const c of ar.cs) {
          const { r1x, r1y, r2x, r2y } = c;
          let dvx = b.vx - b.w * r2y - a.vx + a.w * r1y, dvy = b.vy + b.w * r2x - a.vy - a.w * r1x;
          const vn = dvx * c.nx + dvy * c.ny;
          let dPn = c.mn * (-vn + c.bias);
          const p0 = c.pn; c.pn = Math.max(p0 + dPn, 0); dPn = c.pn - p0;
          let Px = dPn * c.nx, Py = dPn * c.ny;
          a.vx -= ia * Px; a.vy -= ia * Py; a.w -= ja * (r1x * Py - r1y * Px);
          b.vx += ib * Px; b.vy += ib * Py; b.w += jb * (r2x * Py - r2y * Px);
          dvx = b.vx - b.w * r2y - a.vx + a.w * r1y; dvy = b.vy + b.w * r2x - a.vy - a.w * r1x;
          const tx = c.ny, ty = -c.nx;
          const vt = dvx * tx + dvy * ty;
          let dPt = c.mt * -vt;
          const mx = ar.f * c.pn, t0 = c.pt;
          c.pt = Math.max(-mx, Math.min(mx, t0 + dPt)); dPt = c.pt - t0;
          Px = dPt * tx; Py = dPt * ty;
          a.vx -= ia * Px; a.vy -= ia * Py; a.w -= ja * (r1x * Py - r1y * Px);
          b.vx += ib * Px; b.vy += ib * Py; b.w += jb * (r2x * Py - r2y * Px);
        }
      }
    }
    // integrate, rolling drag, sleeping
    for (const b of B) {
      if (b.static || b.sleeping) continue;
      if (b.shape === "circle") b.w *= 0.995;
      b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.w * dt;
      const e = b.vx * b.vx + b.vy * b.vy + b.w * b.w * 0.25;
      if (e < 0.012 && !(b.data && b.data.noSleep)) {
        b.sleepT += dt;
        if (b.sleepT > 0.5) { b.sleeping = true; b.vx = b.vy = b.w = 0; }
      } else b.sleepT = 0;
      // a moving body wakes what it touches
      if (e > 0.4) P.wakeNear(wd, b, 0.06);
    }
    // impacts for damage
    wd.impacts.length = 0;
    for (const ar of ars) {
      let vn = 0, pn = 0;
      for (const c of ar.cs) { if (c.vn < vn) vn = c.vn; pn += c.pn; }
      if (vn < -1.2) wd.impacts.push({ a: ar.a, b: ar.b, vn: -vn, pn, x: ar.cs[0].x, y: ar.cs[0].y, fresh: ar.fresh });
    }
  };

  // the bodies in reach of a point (for explosions)
  P.blast = function (wd, x, y, radius, power, hit) {
    for (const b of wd.bodies) {
      if (b.static || b.dead) continue;
      const dx = b.x - x, dy = b.y - y, d = Math.hypot(dx, dy);
      if (d > radius) continue;
      const k = 1 - d / radius, imp = power * k;
      P.wake(b);
      const nx = d > 0.01 ? dx / d : 0, ny = d > 0.01 ? dy / d : -1;
      b.vx += nx * imp * b.im * Math.sqrt(b.mass); b.vy += (ny - 0.3) * imp * b.im * Math.sqrt(b.mass);
      b.w += (((b.id * 7919) % 13) / 6 - 1) * 3 * k;
      if (hit) hit(b, k);
    }
  };

  P.clone = function (wd) {
    const map = new Map();
    const c = { bodies: [], arbiters: new Map(), g: wd.g, impacts: [], time: wd.time };
    for (const b of wd.bodies) { const nb = Object.assign({}, b); nb.data = b.data ? Object.assign({}, b.data) : null; map.set(b, nb); c.bodies.push(nb); }
    for (const [k, ar] of wd.arbiters) {
      if (!map.has(ar.a) || !map.has(ar.b)) continue;
      c.arbiters.set(k, { a: map.get(ar.a), b: map.get(ar.b), cs: ar.cs.map((x) => Object.assign({}, x)), f: ar.f, e: ar.e, fresh: ar.fresh });
    }
    c.map = map;
    return c;
  };
})(window.WW);
