/* ===================================================================
 * D64 disk image parser and renderer
 * -------------------------------------------------------------------
 * Parses C64 1541 disk images (.d64, 35/40/42 tracks, with or without
 * error info) and renders them as a picture of a floppy disk:
 * tracks are rings (track 1 outside), sectors are ring segments and
 * every bit of every byte is drawn, so the data structure becomes
 * visible.
 *
 * Exposes a global object `D64` with:
 *   D64.parse(arrayBuffer)            -> disk object (throws on error)
 *   D64.render(disk, options)         -> HTMLCanvasElement
 *   D64.hitTest(disk, size, x, y)     -> {track, sector} | null
 *   D64.PALETTE                       -> colors per sector category
 * =================================================================== */
(function (global) {
  "use strict";

  /* ---------- Disk geometry ---------- */

  // Valid image sizes: [bytes, tracks, has error info]
  const FORMATS = [
    [174848, 35, false], [175531, 35, true],
    [196608, 40, false], [197376, 40, true],
    [205312, 42, false], [206114, 42, true],
  ];

  function sectorsPerTrack(track) {
    if (track <= 17) return 21;
    if (track <= 24) return 19;
    if (track <= 30) return 18;
    return 17;
  }

  /* ---------- PETSCII ---------- */

  // Convert a PETSCII string (directory names) to readable text.
  // Unshifted (upper case/graphics) character set as shown in a C64
  // directory listing. Characters without a plain-text equivalent
  // become a shaded block.
  function petsciiToText(bytes) {
    let s = "";
    for (const b of bytes) {
      if (b === 0xa0) break;                       // shifted space = padding
      if (b >= 0x20 && b <= 0x5f) s += String.fromCharCode(b === 0x5c ? 0xa3 : b === 0x5e ? 0x2191 : b === 0x5f ? 0x2190 : b);
      else if (b >= 0xc1 && b <= 0xda) s += String.fromCharCode(b - 0x80); // shifted letters -> upper case
      else if (b >= 0x61 && b <= 0x7a) s += String.fromCharCode(b - 0x20);
      else s += "▒";
    }
    return s;
  }

  /* ---------- Parser ---------- */

  const FILE_TYPES = ["DEL", "SEQ", "PRG", "USR", "REL"];

  function parse(buffer) {
    const data = new Uint8Array(buffer);
    const fmt = FORMATS.find((f) => f[0] === data.length);
    if (!fmt) {
      const err = new Error("size");
      err.size = data.length;
      throw err;
    }
    const tracks = fmt[1];

    // Byte offset and sector index of every track
    const trackOffset = [0, 0];
    const trackFirstSector = [0, 0];
    let totalSectors = 0;
    for (let t = 1; t <= tracks; t++) {
      trackOffset[t] = totalSectors * 256;
      trackFirstSector[t] = totalSectors;
      totalSectors += sectorsPerTrack(t);
    }
    const errors = fmt[2] ? data.subarray(totalSectors * 256) : null;

    const valid = (t, s) => t >= 1 && t <= tracks && s >= 0 && s < sectorsPerTrack(t);
    const offsetOf = (t, s) => trackOffset[t] + s * 256;
    const sectorIndex = (t, s) => trackFirstSector[t] + s;

    // --- BAM (track 18, sector 0) ---
    const bam = offsetOf(18, 0);
    const free = new Uint8Array(totalSectors);      // 1 = free according to BAM
    const bamKnown = new Uint8Array(tracks + 1);    // 1 = BAM covers this track
    const bitmapFree = (base, t) => {
      for (let s = 0; s < sectorsPerTrack(t); s++) {
        if (data[base + 1 + (s >> 3)] & (1 << (s & 7))) free[sectorIndex(t, s)] = 1;
      }
      bamKnown[t] = 1;
    };
    const countBits = (base, n) => {
      let c = 0;
      for (let s = 0; s < n; s++) if (data[base + 1 + (s >> 3)] & (1 << (s & 7))) c++;
      return c;
    };
    for (let t = 1; t <= Math.min(tracks, 35); t++) bitmapFree(bam + 4 * t, t);

    // Extended tracks 36-40: SpeedDOS (0xC0) or DolphinDOS (0xAC) BAM.
    // Accept a layout only if every free counter matches its bitmap.
    let bamExtension = null;
    if (tracks > 35) {
      const ext = Math.min(tracks, 40);
      for (const [name, base] of [["SpeedDOS", 0xc0], ["DolphinDOS", 0xac]]) {
        let ok = true, any = false;
        for (let t = 36; t <= ext; t++) {
          const p = bam + base + 4 * (t - 36);
          if (data[p] !== countBits(p, sectorsPerTrack(t))) ok = false;
          if (data[p]) any = true;
        }
        if (ok && any) {
          for (let t = 36; t <= ext; t++) bitmapFree(bam + base + 4 * (t - 36), t);
          bamExtension = name;
          break;
        }
      }
    }

    // --- Header ---
    const name = petsciiToText(data.subarray(bam + 0x90, bam + 0xa0));
    const id = petsciiToText(data.subarray(bam + 0xa2, bam + 0xa4));
    const dosType = petsciiToText(data.subarray(bam + 0xa5, bam + 0xa7));
    let blocksFree = 0;
    for (let t = 1; t <= Math.min(tracks, 35); t++) if (t !== 18) blocksFree += data[bam + 4 * t];

    // --- Directory and file chains ---
    const owner = new Int16Array(totalSectors).fill(-1);  // file index per sector
    const dirSectors = new Uint8Array(totalSectors);      // part of directory chain
    dirSectors[sectorIndex(18, 0)] = 1;
    const files = [];
    let t = data[bam], s = data[bam + 1];
    const seenDir = new Set();
    while (t !== 0 && valid(t, s) && !seenDir.has(sectorIndex(t, s))) {
      seenDir.add(sectorIndex(t, s));
      dirSectors[sectorIndex(t, s)] = 1;
      const o = offsetOf(t, s);
      for (let e = 0; e < 8; e++) {
        const p = o + e * 32;
        const type = data[p + 2];
        if ((type & 0x07) === 0 && !(type & 0x80)) continue; // scratched / empty slot
        const file = {
          name: petsciiToText(data.subarray(p + 5, p + 21)),
          type: FILE_TYPES[type & 0x07] || "???",
          closed: !!(type & 0x80),
          locked: !!(type & 0x40),
          blocks: data[p + 30] | (data[p + 31] << 8),
          track: data[p + 3],
          sector: data[p + 4],
          sectors: [],
        };
        // Follow the file's sector chain
        const index = files.length;
        let ft = file.track, fs = file.sector;
        const seen = new Set();
        while (ft !== 0 && valid(ft, fs) && !seen.has(sectorIndex(ft, fs)) && seen.size < totalSectors) {
          const si = sectorIndex(ft, fs);
          seen.add(si);
          file.sectors.push(si);
          if (owner[si] === -1) owner[si] = index;
          const fo = offsetOf(ft, fs);
          ft = data[fo]; fs = data[fo + 1];
        }
        files.push(file);
      }
      t = data[o]; s = data[o + 1];
    }

    // --- Sector categories ---
    // 0 = data, 1 = directory/BAM, 2 = free, 3 = read error, 4 = unknown
    const category = new Uint8Array(totalSectors);
    let errorCount = 0;
    for (let tr = 1; tr <= tracks; tr++) {
      for (let se = 0; se < sectorsPerTrack(tr); se++) {
        const i = sectorIndex(tr, se);
        let c;
        if (errors && errors[i] > 1) { c = 3; errorCount++; }
        else if (dirSectors[i]) c = 1;
        else if (!bamKnown[tr]) c = owner[i] >= 0 ? 0 : 4;
        else if (free[i]) c = 2;
        else c = 0;
        category[i] = c;
      }
    }

    return {
      bytes: data, tracks, hasErrorInfo: fmt[2], errorCount, bamExtension,
      name, id, dosType, blocksFree, files, totalSectors,
      trackOffset, trackFirstSector, category, owner,
      sectorsPerTrack, sectorIndex,
    };
  }

  /* ---------- Renderer ---------- */

  // Colors per sector category: [bit set, bit clear]
  const PALETTE = {
    data:      { label: "File data",              on: [52, 214, 72],  off: [6, 52, 14] },
    directory: { label: "BAM and directory",      on: [56, 190, 232], off: [8, 44, 62] },
    free:      { label: "Free (leftover data)",   on: [92, 92, 92],   off: [36, 36, 36] },
    error:     { label: "Read error",             on: [255, 84, 72],  off: [86, 18, 16] },
    unknown:   { label: "Not covered by BAM",     on: [214, 170, 56], off: [58, 44, 10] },
  };
  const CATEGORY_KEYS = ["data", "directory", "free", "error", "unknown"];

  const BODY = [30, 30, 30];      // disk surface
  const GAP = [12, 12, 12];       // gaps between tracks and sectors
  const DARK = "#131313";

  // Disk geometry, as fractions of the disk radius R
  const GEO = {
    disk: 0.98,       // R relative to half the image size
    dataOut: 0.955,
    dataIn: 0.515,
    trackGap: 0.14,   // fraction of a track's width
    sectorGap: 0.05,  // fraction of a sector's angle
    labelOut: 0.43,
    labelIn: 0.385,
    hubRim: 0.205,
    hole: 0.165,
    indexDist: 0.35,
    indexAngle: 100,  // degrees, clockwise from 12 o'clock
    indexHole: 0.017,
  };

  function geometry(disk, size) {
    const c = size / 2;
    const R = c * GEO.disk;
    const rOut = R * GEO.dataOut;
    const rIn = R * GEO.dataIn;
    return { c, R, rOut, rIn, trackW: (rOut - rIn) / disk.tracks };
  }

  // Which track/sector is at image coordinate (x, y)?
  function hitTest(disk, size, x, y) {
    const g = geometry(disk, size);
    const dx = x - g.c, dy = y - g.c;
    const r = Math.hypot(dx, dy);
    if (r >= g.rOut || r < g.rIn) return null;
    const track = 1 + Math.floor((g.rOut - r) / g.trackW);
    let a = Math.atan2(dx, -dy) / (2 * Math.PI);
    if (a < 0) a += 1;
    const sector = Math.floor(a * disk.sectorsPerTrack(track));
    return { track, sector };
  }

  // options: size, background ("black" | "transparent"), highlight (Set of
  // sector indices or null), label (text on the top of the label ring)
  function render(disk, options) {
    const size = options.size || 2048;
    const transparent = options.background === "transparent";
    const highlight = options.highlight || null;
    const g = geometry(disk, size);
    const { c, R, rOut, rIn, trackW } = g;

    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");

    // Background and disk body
    if (!transparent) { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, size, size); }
    circle(ctx, c, c, R, "rgb(" + BODY + ")");

    // ---- Data area, rendered pixel by pixel with supersampling ----
    const x0 = Math.max(0, Math.floor(c - rOut - 1)), x1 = Math.min(size, Math.ceil(c + rOut + 1));
    const img = ctx.getImageData(x0, x0, x1 - x0, x1 - x0);
    const px = img.data, w = x1 - x0;

    // Per-track lookup tables
    const spt = new Int32Array(disk.tracks + 1);
    for (let t = 1; t <= disk.tracks; t++) spt[t] = disk.sectorsPerTrack(t);

    // Per-sector colors (with dimming for non-highlighted sectors)
    const n = disk.totalSectors;
    const colOn = new Float32Array(n * 3), colOff = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const p = PALETTE[CATEGORY_KEYS[disk.category[i]]];
      const dim = highlight && !highlight.has(i) ? 0.22 : 1;
      for (let k = 0; k < 3; k++) {
        colOn[i * 3 + k] = p.on[k] * dim + BODY[k] * (1 - dim) * 0.5;
        colOff[i * 3 + k] = p.off[k] * dim + BODY[k] * (1 - dim) * 0.5;
      }
    }

    const bytes = disk.bytes;
    const first = disk.trackFirstSector;
    const SS = size > 2048 ? 2 : 3, inv = 1 / SS, samples = SS * SS;  // supersampling
    const rOut2 = (rOut + 1) * (rOut + 1), rIn2 = (rIn - 1) * (rIn - 1);
    const twoPi = 2 * Math.PI;
    const tg = 1 - GEO.trackGap, sg = 1 - GEO.sectorGap;

    for (let py = 0; py < w; py++) {
      const yc = py + x0 - c;
      for (let pxi = 0; pxi < w; pxi++) {
        const xc = pxi + x0 - c;
        const d2 = xc * xc + yc * yc;
        if (d2 > rOut2 || d2 < rIn2) continue;           // outside the data ring
        let r = 0, gg = 0, b = 0;
        for (let sy = 0; sy < SS; sy++) {
          const y = yc + (sy + 0.5) * inv;
          for (let sx = 0; sx < SS; sx++) {
            const x = xc + (sx + 0.5) * inv;
            const rad = Math.sqrt(x * x + y * y);
            let cr, cg, cb;
            if (rad >= rOut || rad < rIn) { cr = BODY[0]; cg = BODY[1]; cb = BODY[2]; }
            else {
              const tf = (rOut - rad) / trackW;
              const ti = tf | 0;
              const within = tf - ti;
              if (within >= tg) { cr = GAP[0]; cg = GAP[1]; cb = GAP[2]; }
              else {
                const track = ti + 1;
                const ns = spt[track];
                let a = Math.atan2(x, -y) / twoPi;
                if (a < 0) a += 1;
                const sf = a * ns;
                const s = sf | 0;
                const ws = sf - s;
                if (ws >= sg) { cr = GAP[0]; cg = GAP[1]; cb = GAP[2]; }
                else {
                  const si = first[track] + s;
                  const byte = bytes[si * 256 + ((ws / sg * 256) | 0)];
                  const bit = 7 - ((within / tg * 8) | 0);       // MSB outside
                  const col = (byte >> bit) & 1 ? colOn : colOff;
                  cr = col[si * 3]; cg = col[si * 3 + 1]; cb = col[si * 3 + 2];
                }
              }
            }
            r += cr; gg += cg; b += cb;
          }
        }
        const o = (py * w + pxi) * 4;
        px[o] = r / samples; px[o + 1] = gg / samples; px[o + 2] = b / samples;
        px[o + 3] = 255;
      }
    }
    ctx.putImageData(img, x0, x0);

    // ---- Rim and hub ----
    ring(ctx, c, R * 0.975, R * 0.006, DARK);
    ring(ctx, c, R * ((GEO.labelOut + GEO.labelIn) / 2), R * (GEO.labelOut - GEO.labelIn), DARK);
    ring(ctx, c, R * (GEO.hubRim + GEO.hole) / 2, R * (GEO.hubRim - GEO.hole), DARK);

    // Label text around the label ring
    const fontPx = Math.max(8, R * 0.024);
    ctx.fillStyle = "#6a6a6a";
    ctx.font = "500 " + fontPx + "px Arial, Helvetica, sans-serif";
    ctx.textBaseline = "middle";
    const rText = R * (GEO.labelOut + GEO.labelIn) / 2;
    if (options.label) arcText(ctx, c, rText, options.label, fontPx, true);
    const bottom = [disk.name, disk.id].filter(Boolean).join("   ").toLowerCase();
    if (options.diskName !== false && bottom) arcText(ctx, c, rText, bottom, fontPx, false);

    // Holes
    const ia = (GEO.indexAngle * Math.PI) / 180;
    const ix = c + Math.sin(ia) * R * GEO.indexDist, iy = c - Math.cos(ia) * R * GEO.indexDist;
    circle(ctx, ix, iy, R * GEO.indexHole * 1.5, DARK);
    hole(ctx, c, c, R * GEO.hole, transparent);
    hole(ctx, ix, iy, R * GEO.indexHole, transparent);
    return canvas;
  }

  function circle(ctx, x, y, r, color) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fillStyle = color; ctx.fill();
  }
  function ring(ctx, c, r, width, color) {
    ctx.beginPath(); ctx.arc(c, c, r, 0, 2 * Math.PI);
    ctx.lineWidth = width; ctx.strokeStyle = color; ctx.stroke();
  }
  function hole(ctx, x, y, r, transparent) {
    ctx.save();
    if (transparent) ctx.globalCompositeOperation = "destination-out";
    circle(ctx, x, y, r, transparent ? "#000" : "#fff");
    ctx.restore();
  }

  // Draw text with wide letter spacing along a circle, centered at the
  // top (reading clockwise) or at the bottom (reading left to right).
  function arcText(ctx, c, r, text, fontPx, top) {
    const step = (fontPx * 2.1) / r;                     // angle per character
    const chars = [...text];
    const span = step * (chars.length - 1);
    chars.forEach((ch, i) => {
      const a = top ? -span / 2 + i * step : Math.PI + span / 2 - i * step;
      ctx.save();
      ctx.translate(c + Math.sin(a) * r, c - Math.cos(a) * r);
      ctx.rotate(top ? a : a - Math.PI);
      ctx.textAlign = "center";
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    });
  }

  global.D64 = { parse, render, hitTest, PALETTE, CATEGORY_KEYS, sectorsPerTrack, FORMATS };
})(window);
