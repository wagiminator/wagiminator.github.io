/* ===================================================================
 * TAP tape image library
 * -------------------------------------------------------------------
 * Reads and writes C64 TAP files (version 0 and 1), decodes files
 * saved with the standard C64 ROM loader and cleans up tapes:
 *   - pulses are kept as durations in C64 clock cycles
 *   - the ROM loader decoder follows the Kernal format (pilot of short
 *     pulses, countdown sync, bytes as L-M + 9 bit pairs, L-S end mark)
 *   - optimize() removes glitches, merges pauses, sets ROM loader
 *     pulses to their ideal values, repairs damaged ROM loader blocks
 *     from the second copy and snaps the pulses of other (turbo) loaders
 *     to the centers of their pulse length clusters.
 * Works in the browser (global `TAP`) and in Node.js (module.exports).
 * =================================================================== */
(function (global) {
  "use strict";

  const SIGNATURE = "C64-TAPE-RAW";
  const PAL_CLOCK = 985248;                 // cycles per second
  const UNIT = 8;                           // cycles per TAP value
  const V0_PAUSE = 20000;                   // cycles assumed for a version 0 "00" byte
  const LONG = 0x100 * UNIT;                // pulses this long are pauses

  // Ideal ROM loader pulse lengths in TAP units (as used by TAPClean)
  const IDEAL = { S: 0x30, M: 0x42, L: 0x56 };
  // ROM loader pulse ranges at nominal speed (as used by VICE)
  const RANGE = { S: [0x24, 0x36], M: [0x37, 0x49], L: [0x4a, 0x64] };

  /* ---------- Reading and writing TAP files ---------- */

  // Returns { version, machine, video, pulses (Uint32Array of cycles) }
  function parse(bytes) {
    bytes = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    if (bytes.length < 20 || String.fromCharCode(...bytes.subarray(0, 12)) !== SIGNATURE) throw new Error("signature");
    const version = bytes[12];
    if (version > 1) throw new Error("version");
    const size = (bytes[16] | (bytes[17] << 8) | (bytes[18] << 16)) + bytes[19] * 0x1000000;
    const end = Math.min(bytes.length, 20 + size);
    const out = new Uint32Array(end - 20);
    let n = 0;
    for (let i = 20; i < end; i++) {
      const b = bytes[i];
      if (b) { out[n++] = b * UNIT; continue; }
      if (version === 1 && i + 3 < end) {
        const c = bytes[i + 1] | (bytes[i + 2] << 8) | (bytes[i + 3] << 16);
        out[n++] = c || LONG;
        i += 3;
      } else out[n++] = V0_PAUSE;
    }
    return { version, machine: bytes[13], video: bytes[14], pulses: out.slice(0, n), sizeOk: size === bytes.length - 20 };
  }

  // Pulses (cycles) -> TAP version 1 file
  function build(pulses) {
    const body = [];
    for (const c of pulses) {
      const u = Math.round(c / UNIT);
      if (u >= 1 && u <= 0xff) body.push(u);
      else {
        let rest = Math.max(c, 1);
        while (rest > 0) {
          const part = Math.min(rest, 0xffffff);
          body.push(0, part & 0xff, (part >> 8) & 0xff, part >> 16);
          rest -= part;
        }
      }
    }
    const out = new Uint8Array(20 + body.length);
    out.set([...SIGNATURE].map((ch) => ch.charCodeAt(0)), 0);
    out[12] = 1;
    const n = body.length;
    out[16] = n & 0xff; out[17] = (n >> 8) & 0xff; out[18] = (n >> 16) & 0xff; out[19] = (n >>> 24) & 0xff;
    out.set(body, 20);
    return out;
  }

  /* ---------- Statistics ---------- */

  function histogram(pulses, from, to) {
    const h = new Uint32Array(256);
    for (let i = from || 0; i < (to ?? pulses.length); i++) {
      const u = Math.round(pulses[i] / UNIT);
      if (u < 256) h[u]++;
    }
    return h;
  }

  function seconds(pulses, from, to) {
    let c = 0;
    for (let i = from || 0; i < (to ?? pulses.length); i++) c += pulses[i];
    return c / PAL_CLOCK;
  }

  /* ---------- C64 ROM loader ---------- */

  // Pulse class at speed factor k: "S", "M", "L" or ""
  function cls(c, k) {
    const u = c / UNIT / k;
    if (u >= RANGE.S[0] && u <= RANGE.S[1] + 0.5) return "S";
    if (u > RANGE.S[1] + 0.5 && u <= RANGE.M[1] + 0.5) return "M";
    if (u > RANGE.M[1] + 0.5 && u <= RANGE.L[1]) return "L";
    return "";
  }

  // Read one byte at pulse i: {value, ok, end} (end = L-S end mark)
  function readByte(p, i, k) {
    if (i + 1 >= p.length || cls(p[i], k) !== "L") return null;
    const second = cls(p[i + 1], k);
    if (second === "S") return { end: true };
    if (second !== "M") return null;
    if (i + 20 > p.length) return null;
    let value = 0, parity = 1, ok = true;
    for (let b = 0; b < 9; b++) {
      const a = cls(p[i + 2 + 2 * b], k), c = cls(p[i + 3 + 2 * b], k);
      let bit;
      if (a === "S" && (c === "M" || c === "L")) bit = 0;
      else if ((a === "M" || a === "L") && c === "S") bit = 1;
      else { ok = false; bit = 0; }
      if (b < 8) { value |= bit << b; parity ^= bit; }
      else if (bit !== parity) ok = false;
    }
    return { value, ok };
  }

  // Find all ROM loader blocks. Each block: { kind, copy, pilot, sync,
  // end, trailerEnd, k, bytes, byteAt, bad (byte indices), payload,
  // checksumOk, header fields }
  function decodeCBM(p) {
    const blocks = [];
    const n = p.length;

    // Decode the block whose first byte starts at pulse `sync`
    function blockAt(pilot, sync, k) {
      const bytes = [], byteAt = [], bad = [];
      let j = sync, end = -1;
      while (j < n) {
        const r = readByte(p, j, k);
        if (!r) break;
        if (r.end) { end = j + 2; break; }
        byteAt.push(j);
        bytes.push(r.value);
        if (!r.ok) bad.push(bytes.length - 1);
        j += 20;
      }
      if (bytes.length < 10) return { fail: Math.max(j, sync) + 1 };
      const first = bytes[0];
      const copy = first === 0x89 ? 1 : first === 0x09 ? 2 : 0;
      const syncOk = !!copy && bytes.slice(0, 9).every((b, x) => b === first - x);
      const payload = Uint8Array.from(bytes.slice(9, -1));
      let x = 0;
      for (const b of payload) x ^= b;
      const checksumOk = !bad.length && x === bytes[bytes.length - 1] && syncOk;
      // Trailer: short pulses after the end mark
      let t = end > 0 ? end : j;
      while (t < n && cls(p[t], k) === "S") t++;
      const block = { copy: copy || 1, syncOk, pilot, sync, end: end > 0 ? end : j, complete: end > 0, trailerEnd: t, k, bytes, byteAt, bad, payload, checksumOk };
      if (payload.length === 192 && payload[0] >= 1 && payload[0] <= 5) {
        block.kind = "header";
        block.type = payload[0];
        block.start = payload[1] | (payload[2] << 8);
        block.endAddr = payload[3] | (payload[4] << 8);
        block.name = payload.slice(5, 21);
      } else block.kind = "data";
      return block;
    }

    let i = 0;
    while (i < n) {
      // Look for a pilot: at least 64 pulses close to their mean, in S range
      let start = i, sum = 0, count = 0;
      while (i < n) {
        const u = p[i] / UNIT;
        const mean = count ? sum / count : u;
        if (u >= 0x20 && u <= 0x40 && Math.abs(u - mean) <= mean * 0.15) { sum += u; count++; i++; }
        else if (count >= 64) break;
        else { i++; start = i; sum = 0; count = 0; }
      }
      if (count < 64) break;
      const k = Math.min(1.2, Math.max(0.8, sum / count / IDEAL.S));
      let b = blockAt(start, i, k);
      if (b.fail) { i = b.fail; continue; }
      blocks.push(b);
      // The trailer of a first copy (79 short pulses) is the pilot of the second
      while (b.complete && b.trailerEnd - b.end >= 32 && b.trailerEnd < n) {
        const next = blockAt(b.end, b.trailerEnd, k);
        if (next.fail) break;
        b.trailerEnd = b.end;          // those pulses belong to the next block's pilot
        blocks.push(next);
        b = next;
      }
      i = b.trailerEnd > i ? b.trailerEnd : i + 1;
    }
    // Link copies: copy 2 follows copy 1 of the same length
    for (let b = 0; b + 1 < blocks.length; b++) {
      const a = blocks[b], c = blocks[b + 1];
      if (a.copy === 1 && c.copy === 2 && a.payload.length === c.payload.length) { a.twin = b + 1; c.twin = b; }
    }
    return blocks;
  }

  // Pulse pattern (TAP units) of one byte
  function bytePattern(v) {
    const out = [IDEAL.L, IDEAL.M];
    let parity = 1;
    for (let b = 0; b < 9; b++) {
      const bit = b < 8 ? (v >> b) & 1 : parity;
      if (b < 8) parity ^= bit;
      out.push(bit ? IDEAL.M : IDEAL.S, bit ? IDEAL.S : IDEAL.M);
    }
    return out;
  }

  // Encode a file with the ROM loader (header + data, two copies each).
  // Returns pulses in cycles. Used for tests and for making tapes.
  function encodeCBM(name, startAddr, data, type) {
    const out = [];
    const shorts = (n) => { for (let i = 0; i < n; i++) out.push(IDEAL.S * UNIT); };
    const block = (payload, copy) => {
      const bytes = [];
      for (let x = 0; x < 9; x++) bytes.push((copy === 1 ? 0x89 : 0x09) - x);
      let sum = 0;
      for (const b of payload) { bytes.push(b); sum ^= b; }
      bytes.push(sum);
      for (const b of bytes) for (const u of bytePattern(b)) out.push(u * UNIT);
      out.push(IDEAL.L * UNIT, IDEAL.S * UNIT);
    };
    const header = new Uint8Array(192).fill(0x20);
    const endAddr = startAddr + data.length;
    header[0] = type || 3;
    header[1] = startAddr & 0xff; header[2] = startAddr >> 8;
    header[3] = endAddr & 0xff; header[4] = endAddr >> 8;
    for (let x = 0; x < 16; x++) header[5 + x] = x < name.length ? name.charCodeAt(x) : 0x20;
    shorts(0x6a00); block(header, 1); shorts(0x4f); block(header, 2); shorts(0x4e);
    out.push(2000000);                                  // pause between header and data
    shorts(0x1a00); block(data, 1); shorts(0x4f); block(data, 2); shorts(0x4e);
    return Uint32Array.from(out);
  }

  // Decode for display: glitches are ignored while decoding, positions
  // refer to the original pulses.
  function analyze(p) {
    const merged = [], map = [];
    for (let i = 0; i < p.length; i++) {
      if (p[i] < 8 * UNIT && merged.length) { merged[merged.length - 1] += p[i]; continue; }
      merged.push(p[i]);
      map.push(i);
    }
    map.push(p.length);
    const blocks = decodeCBM(Uint32Array.from(merged));
    const back = (x) => map[Math.min(x, map.length - 1)];
    for (const b of blocks) {
      b.pilot = back(b.pilot); b.sync = back(b.sync); b.end = back(b.end); b.trailerEnd = back(b.trailerEnd);
      b.byteAt = b.byteAt.map(back);
    }
    return blocks;
  }

  /* ---------- Optimizing ---------- */

  // Options: glitches, pauses, cbm (idealize + repair), generic (snap clusters)
  function optimize(input, options) {
    const o = Object.assign({ glitches: true, pauses: true, cbm: true, repair: true, generic: true }, options);
    const report = { glitches: 0, pauses: 0, cbmBlocks: 0, cbmIdeal: 0, repaired: 0, stillBad: 0, snapped: 0, clusterSegments: 0 };
    let p = Array.from(input);

    // 1. Glitches: pulses shorter than 8 TAP units are noise; add them to the previous pulse
    if (o.glitches) {
      const q = [];
      for (const c of p) {
        if (c < 8 * UNIT && q.length) { q[q.length - 1] += c; report.glitches++; }
        else q.push(c);
      }
      p = q;
    }

    // 2. Pauses: join consecutive long pulses and short noise between them
    if (o.pauses) {
      const q = [];
      for (let i = 0; i < p.length; i++) {
        const c = p[i];
        const last = q.length ? q[q.length - 1] : 0;
        if (c >= LONG && last >= LONG) { q[q.length - 1] += c; report.pauses++; continue; }
        // noise pulse between two pauses
        if (c < 0x20 * UNIT && last >= LONG && i + 1 < p.length && p[i + 1] >= LONG) { q[q.length - 1] += c; report.pauses++; continue; }
        q.push(c);
      }
      p = q;
    }

    const out = Uint32Array.from(p);
    const covered = new Uint8Array(out.length);       // pulses owned by ROM loader blocks

    // 3. ROM loader: repair from the twin copy, then set ideal pulse lengths
    if (o.cbm) {
      const blocks = decodeCBM(out);
      report.cbmBlocks = blocks.length;
      if (o.repair) {
        for (const b of blocks) {
          if (b.checksumOk || b.twin === undefined || !b.complete) continue;
          const t = blocks[b.twin];
          if (!t.complete || t.bytes.length !== b.bytes.length) continue;
          // Merge: take each byte from a copy that read it without error
          const merged = b.bytes.map((v, x) => (b.bad.includes(x) ? (t.bad.includes(x) ? null : t.bytes[x]) : v));
          if (merged.some((v) => v === null)) continue;
          // Sync bytes differ between copies; rebuild them for this copy
          for (let x = 0; x < 9; x++) merged[x] = (b.copy === 1 ? 0x89 : 0x09) - x;
          let sum = 0;
          for (let x = 9; x < merged.length - 1; x++) sum ^= merged[x];
          if (sum !== merged[merged.length - 1]) continue;
          b.bytes = merged; b.bad = []; b.checksumOk = true; b.repaired = true;
          b.payload = Uint8Array.from(merged.slice(9, -1));
          report.repaired++;
        }
      }
      for (const b of blocks) {
        if (!b.checksumOk || !b.complete) { report.stillBad++; continue; }
        const set = (i, u) => { if (out[i] !== u * UNIT) report.cbmIdeal++; out[i] = u * UNIT; covered[i] = 1; };
        for (let i = b.pilot; i < b.sync; i++) set(i, IDEAL.S);
        b.bytes.forEach((v, x) => bytePattern(v).forEach((u, y) => set(b.byteAt[x] + y, u)));
        set(b.end - 2, IDEAL.L); set(b.end - 1, IDEAL.S);
        for (let i = b.end; i < b.trailerEnd; i++) set(i, IDEAL.S);
      }
    }

    // 4. Other loaders: snap pulses to the centers of clear clusters
    if (o.generic) {
      let i = 0;
      while (i < out.length) {
        // segment: run of pulses that are not pauses and not ROM loader
        while (i < out.length && (covered[i] || out[i] >= LONG)) i++;
        const from = i;
        while (i < out.length && !covered[i] && out[i] < LONG) i++;
        if (i - from >= 400) {
          const n = snapSegment(out, from, i);
          if (n >= 0) { report.snapped += n; report.clusterSegments++; }
        }
      }
    }
    return { pulses: out, report };
  }

  // Find 2-4 well separated peaks in the pulse lengths of a segment and
  // move pulses close to a peak onto it. Returns pulses changed or -1.
  function snapSegment(p, from, to) {
    const h = histogram(p, from, to);
    const total = to - from;
    const sm = new Float64Array(256);
    for (let u = 1; u < 255; u++) sm[u] = (h[u - 1] + 2 * h[u] + h[u + 1]) / 4;
    const peaks = [];
    for (let u = 2; u < 254; u++) {
      if (sm[u] >= total * 0.03 && sm[u] >= sm[u - 1] && sm[u] > sm[u + 1]) {
        if (peaks.length && u - peaks[peaks.length - 1] < 5) {
          if (sm[u] > sm[peaks[peaks.length - 1]]) peaks[peaks.length - 1] = u;
        } else peaks.push(u);
      }
    }
    if (peaks.length < 2 || peaks.length > 4) return -1;
    // Valleys between peaks must be deep, or the clusters overlap
    for (let x = 0; x + 1 < peaks.length; x++) {
      let low = Infinity;
      for (let u = peaks[x]; u <= peaks[x + 1]; u++) low = Math.min(low, sm[u]);
      if (low > 0.1 * Math.min(sm[peaks[x]], sm[peaks[x + 1]])) return -1;
    }
    // Center of each cluster: weighted mean around the peak, rounded
    const centers = peaks.map((pk, x) => {
      const lo = x ? (peaks[x - 1] + pk) / 2 : pk - 8, hi = x + 1 < peaks.length ? (pk + peaks[x + 1]) / 2 : pk + 8;
      let s = 0, w = 0;
      for (let u = Math.ceil(lo); u <= Math.floor(hi); u++) { s += u * h[u]; w += h[u]; }
      return Math.round(s / w);
    });
    let changed = 0;
    for (let i = from; i < to; i++) {
      const u = p[i] / UNIT;
      for (let x = 0; x < centers.length; x++) {
        const c = centers[x];
        const left = x ? c - centers[x - 1] : centers[1] - centers[0];
        const right = x + 1 < centers.length ? centers[x + 1] - c : left;
        // only pulses clearly inside the cluster (35% of the way to a neighbor)
        if (u >= c - 0.35 * left && u <= c + 0.35 * right) {
          if (p[i] !== c * UNIT) { p[i] = c * UNIT; changed++; }
          break;
        }
      }
    }
    return changed;
  }

  const api = { parse, build, histogram, seconds, decodeCBM, analyze, encodeCBM, optimize, IDEAL, UNIT, PAL_CLOCK, LONG };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else global.TAP = api;
})(typeof window !== "undefined" ? window : globalThis);
