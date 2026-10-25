/* ===================================================================
 * D64 disk image editing library
 * -------------------------------------------------------------------
 * Reads and writes C64 1541 disk images (.d64): BAM, directory and
 * file chains. Files are placed like the 1541 DOS does it: as close
 * to the directory track 18 as possible, on consecutive tracks, with
 * a sector interleave (10 = DOS standard). Works in the browser
 * (global `D64Edit`) and in Node.js (module.exports).
 * =================================================================== */
(function (global) {
  "use strict";

  /* ---------- Geometry ---------- */

  const SIZES = {
    174848: [35, false], 175531: [35, true],
    196608: [40, false], 197376: [40, true],
    205312: [42, false], 206114: [42, true],
  };
  const DIR_TRACK = 18;
  // Order in which the DOS uses directory sectors (interleave 3)
  const DIR_ORDER = [1, 4, 7, 10, 13, 16, 2, 5, 8, 11, 14, 17, 3, 6, 9, 12, 15, 18];
  const MAX_ENTRIES = DIR_ORDER.length * 8;

  function sectorsPerTrack(t) {
    return t <= 17 ? 21 : t <= 24 ? 19 : t <= 30 ? 18 : 17;
  }

  // File types: low 3 bits of the type byte
  const TYPES = ["DEL", "SEQ", "PRG", "USR", "REL"];

  /* ---------- PETSCII <-> text (upper case / graphics character set) ---------- */

  // Graphics characters as they appear in a directory listing. Codes
  // 0xA1-0xBF (C= key) and 0xC0-0xDF (Shift key) get distinct Unicode
  // look-alikes so that names can be edited as text and converted back.
  const GFX_A1 = "▌▄▔▁▏▒▕░◤▐├▗└┐▂┌┴┬┤▎▍▋▀▃▅⌟▖▝┘▘▞";
  const GFX_C0 = "─♠│⎺⎻⎼⎽⎸⎹╮╰╯⌞╲╱⌜⌝●_♥⎢╭╳○♣⎥♦┼▧┃π◥";
  const toText = new Array(256).fill(null);
  for (let b = 0x20; b <= 0x5f; b++) toText[b] = String.fromCharCode(b);
  toText[0x5c] = "£"; toText[0x5e] = "↑"; toText[0x5f] = "←";
  [...GFX_A1].forEach((ch, i) => { toText[0xa1 + i] = ch; });
  [...GFX_C0].forEach((ch, i) => { toText[0xc0 + i] = ch; toText[0x60 + i] = ch; });
  const fromText = new Map();
  for (let b = 0xff; b >= 0x20; b--) if (toText[b] && !(b >= 0x60 && b <= 0x7f)) fromText.set(toText[b], b);

  // PETSCII bytes -> display text. Stops at the first shifted space
  // (0xA0) unless `full` is set; other unknown codes become "▓".
  function petsciiToText(bytes, full) {
    let s = "";
    for (const b of bytes) {
      if (b === 0xa0 && !full) break;
      s += b === 0xa0 ? " " : (toText[b] || "▓");
    }
    return s;
  }

  // Text -> PETSCII bytes, padded with 0xA0 to `length`. Lower case
  // letters become upper case; characters without PETSCII code are dropped.
  function textToPetscii(text, length) {
    const out = new Uint8Array(length).fill(0xa0);
    let i = 0;
    for (const ch of text) {
      if (i >= length) break;
      let b = fromText.get(ch);
      if (b === undefined) b = fromText.get(ch.toUpperCase());
      if (b !== undefined) out[i++] = b;
    }
    return out;
  }

  function isPetsciiChar(ch) {
    return fromText.has(ch) || fromText.has(ch.toUpperCase());
  }

  /* ---------- Disk ---------- */

  class Disk {
    constructor(bytes, tracks) {
      this.bytes = bytes;
      this.tracks = tracks;
      this.first = [0, 0];                 // sector index of first sector per track
      let n = 0;
      for (let t = 1; t <= tracks; t++) { this.first[t] = n; n += sectorsPerTrack(t); }
      this.totalSectors = n;
      this.bamExt = null;                  // offset of the BAM for tracks 36-40
      this.entries = [];
      this.dirSectors = [];
    }

    /* --- creating and opening --- */

    static create(tracks, name, id) {
      tracks = tracks === 40 ? 40 : 35;
      const d = new Disk(new Uint8Array(tracks === 40 ? 196608 : 174848), tracks);
      const h = d.offset(DIR_TRACK, 0);
      const b = d.bytes;
      b[h] = DIR_TRACK; b[h + 1] = 1; b[h + 2] = 0x41;
      b.fill(0xa0, h + 0x90, h + 0xab);
      b.set(textToPetscii(name || "NEW DISK", 16), h + 0x90);
      b.set(textToPetscii(id || "00", 2), h + 0xa2);
      b[h + 0xa5] = 0x32; b[h + 0xa6] = 0x41;           // DOS type "2A"
      if (tracks === 40) d.bamExt = h + 0xc0;          // SpeedDOS layout
      for (let t = 1; t <= d.allocTracks(); t++) for (let s = 0; s < sectorsPerTrack(t); s++) d.setFree(t, s, true);
      d.setFree(DIR_TRACK, 0, false);
      d.saveDirectory();
      return d;
    }

    // Returns { disk, notes } or throws Error("size") with err.size
    static open(buffer) {
      const data = new Uint8Array(buffer);
      const fmt = SIZES[data.length];
      if (!fmt) { const e = new Error("size"); e.size = data.length; throw e; }
      const d = new Disk(new Uint8Array(data.subarray(0, (fmt[0] === 35 ? 683 : fmt[0] === 40 ? 768 : 802) * 256)), fmt[0]);
      const notes = [];
      if (fmt[1]) notes.push("The image contained error info. It is not kept when you save.");
      d.loadDirectory();
      if (d.tracks > 35) {
        d.detectExtendedBam();
        if (!d.bamExt) notes.push(`Tracks 36 to ${d.tracks} have no SpeedDOS or DolphinDOS BAM; they are left untouched.`);
      }
      if (d.tracks > 40) notes.push("Tracks 41 and 42 are left untouched.");
      const fixed = d.repairBam();
      if (fixed) notes.push(`${fixed} sectors used by files were marked free in the BAM; they are now marked used.`);
      return { disk: d, notes };
    }

    clone() {
      const d = new Disk(new Uint8Array(this.bytes), this.tracks);
      d.bamExt = this.bamExt;
      d.entries = this.entries.map(cloneEntry);
      d.dirSectors = this.dirSectors.slice();
      return d;
    }

    /* --- addressing --- */

    offset(t, s) { return (this.first[t] + s) * 256; }
    index(t, s) { return this.first[t] + s; }
    valid(t, s) { return t >= 1 && t <= this.tracks && s >= 0 && s < sectorsPerTrack(t); }
    allocTracks() { return this.tracks === 35 ? 35 : this.bamExt ? 40 : 35; }

    /* --- header --- */

    get name() { const h = this.offset(DIR_TRACK, 0); return this.bytes.slice(h + 0x90, h + 0xa0); }
    set name(bytes) { this.bytes.set(bytes, this.offset(DIR_TRACK, 0) + 0x90); }
    get id() { const h = this.offset(DIR_TRACK, 0); return this.bytes.slice(h + 0xa2, h + 0xa4); }
    set id(bytes) { this.bytes.set(bytes, this.offset(DIR_TRACK, 0) + 0xa2); }
    get dosType() { const h = this.offset(DIR_TRACK, 0); return this.bytes.slice(h + 0xa5, h + 0xa7); }

    /* --- BAM --- */

    // Tracks 36-40 have no standard BAM. SpeedDOS keeps it at 0xC0,
    // DolphinDOS at 0xAC. A layout counts if every free counter matches
    // its bitmap. If both fit, prefer the one that does not mark file
    // sectors as free, then the one with more free sectors.
    detectExtendedBam() {
      const h = this.offset(DIR_TRACK, 0);
      const fileSectors = new Set();
      for (const e of this.entries) for (const [t, s] of this.fileSectors(e)) if (t > 35) fileSectors.add(t * 32 + s);
      let best = null;
      for (const base of [0xc0, 0xac]) {
        let ok = true, free = 0, conflicts = 0;
        for (let t = 36; t <= 40; t++) {
          const p = h + base + 4 * (t - 36);
          let bits = 0;
          for (let s = 0; s < sectorsPerTrack(t); s++) {
            if (this.bytes[p + 1 + (s >> 3)] & (1 << (s & 7))) { bits++; if (fileSectors.has(t * 32 + s)) conflicts++; }
          }
          if (this.bytes[p] !== bits) ok = false;
          free += bits;
        }
        if (!ok || !free) continue;
        if (!best || conflicts < best.conflicts || (conflicts === best.conflicts && free > best.free)) best = { base, free, conflicts };
      }
      if (best) this.bamExt = h + best.base;
    }

    bamPos(t) {
      if (t <= 35) return this.offset(DIR_TRACK, 0) + 4 * t;
      if (t <= 40 && this.bamExt) return this.bamExt + 4 * (t - 36);
      return -1;
    }

    isFree(t, s) {
      const p = this.bamPos(t);
      return p >= 0 && !!(this.bytes[p + 1 + (s >> 3)] & (1 << (s & 7)));
    }

    setFree(t, s, free) {
      const p = this.bamPos(t);
      if (p < 0 || this.isFree(t, s) === free) return;
      this.bytes[p + 1 + (s >> 3)] ^= 1 << (s & 7);
      this.bytes[p] += free ? 1 : -1;
    }

    freeOnTrack(t) {
      const p = this.bamPos(t);
      return p < 0 ? 0 : this.bytes[p];
    }

    // Blocks free as the 1541 shows them (tracks 1-35 without track 18),
    // plus the extra tracks if they have a BAM.
    blocksFree() {
      let n = 0;
      for (let t = 1; t <= this.allocTracks(); t++) if (t !== DIR_TRACK) n += this.freeOnTrack(t);
      return n;
    }

    blocksTotal() {
      let n = 0;
      for (let t = 1; t <= this.allocTracks(); t++) if (t !== DIR_TRACK) n += sectorsPerTrack(t);
      return n;
    }

    // Mark every sector of a directory or file chain as used. Returns
    // the number of sectors that had been marked free.
    repairBam() {
      let fixed = 0;
      const mark = (t, s) => { if (this.isFree(t, s)) { this.setFree(t, s, false); fixed++; } };
      mark(DIR_TRACK, 0);
      for (const [t, s] of this.dirSectors) mark(t, s);
      for (const e of this.entries) for (const [t, s] of this.fileSectors(e)) mark(t, s);
      return fixed;
    }

    /* --- sector chains --- */

    // Follow a chain of linked sectors. ok = false if it is broken.
    chain(t, s) {
      const sectors = [], seen = new Set();
      let ok = true;
      while (t !== 0) {
        if (!this.valid(t, s) || seen.has(this.index(t, s))) { ok = false; break; }
        seen.add(this.index(t, s));
        sectors.push([t, s]);
        const o = this.offset(t, s);
        t = this.bytes[o]; s = this.bytes[o + 1];
      }
      return { sectors, ok };
    }

    // Sectors holding an entry's data. Entries that point into the
    // header or directory (some tools do that for separators) have none.
    fileSectors(e) {
      if (!e.track) return [];
      const { sectors } = this.chain(e.track, e.sector);
      const dir = new Set([this.index(DIR_TRACK, 0), ...this.dirSectors.map(([t, s]) => this.index(t, s))]);
      if (sectors.some(([t, s]) => dir.has(this.index(t, s)))) return [];
      return sectors;
    }

    /* --- directory --- */

    loadDirectory() {
      this.entries = [];
      this.dirSectors = [];
      const h = this.offset(DIR_TRACK, 0);
      let { sectors } = this.chain(this.bytes[h], this.bytes[h + 1]);
      for (const [t, s] of sectors) {
        this.dirSectors.push([t, s]);
        const o = this.offset(t, s);
        for (let i = 0; i < 8; i++) {
          const raw = this.bytes.slice(o + i * 32, o + i * 32 + 32);
          raw[0] = raw[1] = 0;
          if (raw[2] === 0) continue;               // empty or scratched slot
          this.entries.push(entryFromRaw(raw));
        }
      }
    }

    // Write all entries to the directory track. Directory sectors are
    // taken in DOS order; sectors not needed any more are freed.
    saveDirectory() {
      const need = Math.max(1, Math.ceil(this.entries.length / 8));
      if (need > DIR_ORDER.length) throw new Error("dirfull");
      for (const [t, s] of this.dirSectors) if (t === DIR_TRACK) this.setFree(t, s, true);
      const use = [];
      for (const s of DIR_ORDER) {
        if (use.length === need) break;
        if (this.isFree(DIR_TRACK, s)) use.push(s);
      }
      if (use.length < need) throw new Error("dirfull");
      this.dirSectors = use.map((s) => [DIR_TRACK, s]);
      const h = this.offset(DIR_TRACK, 0);
      this.bytes[h] = DIR_TRACK; this.bytes[h + 1] = use[0];
      use.forEach((s, k) => {
        this.setFree(DIR_TRACK, s, false);
        const o = this.offset(DIR_TRACK, s);
        this.bytes.fill(0, o, o + 256);
        for (let i = 0; i < 8; i++) {
          const e = this.entries[k * 8 + i];
          if (e) this.bytes.set(entryToRaw(e), o + i * 32);
        }
        const last = k === use.length - 1;
        this.bytes[o] = last ? 0 : DIR_TRACK;
        this.bytes[o + 1] = last ? 0xff : use[k + 1];
      });
    }

    /* --- files --- */

    readFile(entry) {
      const out = [];
      for (const [t, s] of this.fileSectors(entry)) {
        const o = this.offset(t, s);
        const end = this.bytes[o] === 0 ? Math.max(1, this.bytes[o + 1]) + 1 : 256;
        for (let i = o + 2; i < o + end; i++) out.push(this.bytes[i]);
      }
      return new Uint8Array(out);
    }

    // Order in which tracks are filled: closest to the directory first.
    trackOrder() {
      const list = [];
      for (let t = 1; t <= this.allocTracks(); t++) if (t !== DIR_TRACK) list.push(t);
      return list.sort((a, b) => Math.abs(a - DIR_TRACK) - Math.abs(b - DIR_TRACK) || a - b);
    }

    // Allocate n sectors like the 1541 DOS: start on the free track
    // nearest to track 18, step through a track with the interleave,
    // then continue on the next track away from the directory.
    allocate(n, interleave) {
      if (n > this.blocksFree()) throw new Error("full");
      const order = this.trackOrder();
      const nearest = () => order.find((t) => this.freeOnTrack(t) > 0);
      const freeFrom = (t, start) => {
        const spt = sectorsPerTrack(t);
        for (let i = 0; i < spt; i++) { const s = (start + i) % spt; if (this.isFree(t, s)) return s; }
        return -1;
      };
      // Free sectors from track t outward (away from track 18) until
      // the first full track: room for a file without splitting it.
      const room = (t) => {
        const dir = t < DIR_TRACK ? -1 : 1;
        let sum = 0;
        for (let u = t; u >= 1 && u <= this.allocTracks() && this.freeOnTrack(u) > 0; u += dir) sum += this.freeOnTrack(u);
        return sum;
      };
      // Start where the whole file fits in one run, as close to the directory as possible
      const start = () => order.find((t) => this.freeOnTrack(t) > 0 && room(t) >= n) || nearest();
      const result = [];
      let t = 0, s = 0;
      for (let k = 0; k < n; k++) {
        if (k === 0) { t = start(); s = freeFrom(t, 0); }
        else if (this.freeOnTrack(t) > 0) { s = freeFrom(t, (s + interleave) % sectorsPerTrack(t)); }
        else {
          const dir = t < DIR_TRACK ? -1 : 1;
          let next = t + dir;
          while (next >= 1 && next <= this.allocTracks() && this.freeOnTrack(next) === 0) next += dir;
          if (next < 1 || next > this.allocTracks()) next = nearest();
          s = freeFrom(next, (s + interleave) % sectorsPerTrack(next));
          t = next;
        }
        this.setFree(t, s, false);
        result.push([t, s]);
      }
      return result;
    }

    // Store file data in newly allocated sectors. Returns the sectors.
    writeData(data, interleave) {
      const n = Math.max(1, Math.ceil(data.length / 254));
      const sectors = this.allocate(n, interleave);
      sectors.forEach(([t, s], k) => {
        const o = this.offset(t, s);
        const chunk = data.subarray(k * 254, k * 254 + 254);
        this.bytes.fill(0, o, o + 256);
        this.bytes.set(chunk, o + 2);
        if (k < n - 1) { this.bytes[o] = sectors[k + 1][0]; this.bytes[o + 1] = sectors[k + 1][1]; }
        else { this.bytes[o] = 0; this.bytes[o + 1] = chunk.length + 1; }
      });
      return sectors;
    }

    // Add a file at directory position `at` (default: end)
    addFile(name, type, data, interleave, at) {
      if (this.entries.length >= MAX_ENTRIES) throw new Error("dirfull");
      const backup = this.bytes.slice();
      try {
        const sectors = this.writeData(data, interleave || 10);
        const e = newEntry(0x80 | type, name);
        e.track = sectors[0][0]; e.sector = sectors[0][1]; e.blocks = sectors.length;
        this.entries.splice(at === undefined ? this.entries.length : at, 0, e);
        this.saveDirectory();
        return e;
      } catch (err) {
        this.bytes = backup;
        throw err;
      }
    }

    // Directory separator: a DEL entry with 0 blocks and no data
    addSeparator(name, at) {
      if (this.entries.length >= MAX_ENTRIES) throw new Error("dirfull");
      const e = newEntry(0x80, name);
      this.entries.splice(at === undefined ? this.entries.length : at, 0, e);
      this.saveDirectory();
      return e;
    }

    // Remove an entry and free its sectors (sectors still used by
    // another entry stay allocated).
    removeEntry(i) {
      const e = this.entries[i];
      this.entries.splice(i, 1);
      const own = this.fileSectors(e);
      if (own.length) {
        const keep = new Set();
        for (const o of this.entries) for (const [t, s] of this.fileSectors(o)) keep.add(this.index(t, s));
        for (const [t, s] of own) if (!keep.has(this.index(t, s))) this.setFree(t, s, true);
        // REL files also own a side sector chain
        if ((e.type & 7) === 4 && e.raw[21]) for (const [t, s] of this.chain(e.raw[21], e.raw[22]).sectors) this.setFree(t, s, true);
      }
      this.saveDirectory();
    }

    moveEntry(from, to) {
      const [e] = this.entries.splice(from, 1);
      this.entries.splice(to, 0, e);
      this.saveDirectory();
    }

    /* --- analysis --- */

    // Who uses each sector: -1 free, -2 directory/BAM, -3 used but not
    // part of any file, >= 0 index of the directory entry.
    sectorMap() {
      const map = new Int16Array(this.totalSectors).fill(-1);
      for (let t = 1; t <= this.tracks; t++) {
        for (let s = 0; s < sectorsPerTrack(t); s++) {
          if (this.bamPos(t) < 0 || !this.isFree(t, s)) map[this.index(t, s)] = -3;
        }
      }
      map[this.index(DIR_TRACK, 0)] = -2;
      for (const [t, s] of this.dirSectors) map[this.index(t, s)] = -2;
      const claim = (t, s, i) => { const k = this.index(t, s); if (map[k] === -1 || map[k] === -3) map[k] = i; };
      this.entries.forEach((e, i) => {
        for (const [t, s] of this.fileSectors(e)) claim(t, s, i);
        if ((e.type & 7) === 4 && e.raw[21]) for (const [t, s] of this.chain(e.raw[21], e.raw[22]).sectors) claim(t, s, i);
      });
      return map;
    }

    // A file is fragmented if it does not run over consecutive tracks
    // (each visited once, skipping only the directory track).
    isFragmented(e) {
      const sectors = this.fileSectors(e);
      const visited = new Set([sectors.length ? sectors[0][0] : 0]);
      for (let k = 1; k < sectors.length; k++) {
        const a = sectors[k - 1][0], b = sectors[k][0];
        if (a === b) continue;
        const step = Math.abs(a - b) === 1 || (Math.min(a, b) === 17 && Math.max(a, b) === 19);
        if (!step || visited.has(b)) return true;
        visited.add(b);
      }
      return false;
    }

    // Can this entry be moved by the defragmenter?
    movable(e) {
      const type = e.type & 7;
      if (type < 1 || type > 3 || !this.fileSectors(e).length) return false;
      return this.chain(e.track, e.sector).ok;
    }

    // Rewrite all movable files in directory order so that every file
    // lies on consecutive tracks next to the directory. Sectors that are
    // used but belong to no file (e.g. loader data) and REL files stay
    // where they are. eraseFree: fill free sectors with zeros.
    defragment(interleave, eraseFree) {
      const map = this.sectorMap();
      const shared = new Set();
      const owners = new Map();
      this.entries.forEach((e, i) => {
        for (const [t, s] of this.fileSectors(e)) {
          const k = this.index(t, s);
          if (owners.has(k) && owners.get(k) !== i) { shared.add(owners.get(k)); shared.add(i); }
          owners.set(k, i);
        }
      });
      const moving = [];
      this.entries.forEach((e, i) => {
        if (this.movable(e) && !shared.has(i)) moving.push({ e, data: this.readFile(e), sectors: this.fileSectors(e) });
      });
      const backup = this.bytes.slice();
      const original = moving.map((m) => [m.e.track, m.e.sector, m.e.blocks]);
      const restore = () => {
        this.bytes = backup.slice();
        moving.forEach((m, k) => { [m.e.track, m.e.sector, m.e.blocks] = original[k]; });
      };
      // Place the files in the given order; returns how many end up split
      const pass = (order) => {
        for (const m of moving) for (const [t, s] of m.sectors) this.setFree(t, s, true);
        if (eraseFree) {
          for (let t = 1; t <= this.allocTracks(); t++) {
            if (t === DIR_TRACK) continue;
            for (let s = 0; s < sectorsPerTrack(t); s++) if (this.isFree(t, s)) this.bytes.fill(0, this.offset(t, s), this.offset(t, s) + 256);
          }
        }
        for (const m of order) {
          const sectors = this.writeData(m.data, interleave || 10);
          m.e.track = sectors[0][0]; m.e.sector = sectors[0][1]; m.e.blocks = sectors.length;
        }
        this.saveDirectory();
        return moving.filter((m) => this.isFragmented(m.e)).length;
      };
      try {
        // Directory order keeps the first files closest to the directory.
        // If that leaves files split, try largest first and keep the better result.
        let split = pass(moving);
        if (split) {
          const first = { bytes: this.bytes.slice(), pos: moving.map((m) => [m.e.track, m.e.sector, m.e.blocks]) };
          restore();
          const bySize = moving.slice().sort((x, y) => y.data.length - x.data.length);
          const split2 = pass(bySize);
          if (split2 >= split) {
            this.bytes = first.bytes;
            moving.forEach((m, k) => { [m.e.track, m.e.sector, m.e.blocks] = first.pos[k]; });
            this.saveDirectory();
          } else split = split2;
        }
        var stillSplit = split;
      } catch (err) {
        restore();
        this.saveDirectory();
        throw err;
      }
      let kept = 0;
      for (const v of map) if (v === -3) kept++;
      const skipped = this.entries.filter((e) => this.fileSectors(e).length && !moving.some((m) => m.e === e)).length;
      return { moved: moving.length, kept, skipped, split: stillSplit };
    }

    toBytes() { return new Uint8Array(this.bytes); }
  }

  /* ---------- Directory entries ---------- */

  // An entry keeps its raw 32 bytes (REL and GEOS fields stay intact).
  function entryFromRaw(raw) {
    return {
      raw,
      type: raw[2],
      track: raw[3],
      sector: raw[4],
      name: raw.slice(5, 21),
      blocks: raw[30] | (raw[31] << 8),
    };
  }

  function entryToRaw(e) {
    const raw = e.raw.slice();
    raw[0] = raw[1] = 0;
    raw[2] = e.type; raw[3] = e.track; raw[4] = e.sector;
    raw.set(e.name, 5);
    raw[30] = e.blocks & 0xff; raw[31] = e.blocks >> 8;
    return raw;
  }

  function newEntry(type, name) {
    const raw = new Uint8Array(32);
    return { raw, type, track: 0, sector: 0, name: textToPetscii(name, 16), blocks: 0 };
  }

  function cloneEntry(e) {
    return { raw: e.raw.slice(), type: e.type, track: e.track, sector: e.sector, name: e.name.slice(), blocks: e.blocks };
  }

  // One directory line as the C64 shows it, e.g.  12   "GAME"   PRG<
  function listingLine(e) {
    const name = [...e.name];
    const end = name.indexOf(0xa0);
    const inside = petsciiToText(end < 0 ? name : name.slice(0, end), true);
    const after = end < 0 ? "" : petsciiToText(name.slice(end + 1), true);
    const type = (e.type & 0x80 ? " " : "*") + (TYPES[e.type & 7] || "???") + (e.type & 0x40 ? "<" : "");
    return String(e.blocks).padEnd(5) + (`"${inside}"` + after).padEnd(18) + type;
  }

  /* ---------- Importing files ---------- */

  // Turn a host file into {name, type, data}. Understands PC64 files
  // (.P00, .S00, .U00) and uses the extension for SEQ/USR.
  function importFile(fileName, bytes) {
    const ext = (fileName.match(/\.([^.]+)$/) || ["", ""])[1].toLowerCase();
    let type = ext === "seq" ? 1 : ext === "usr" ? 3 : 2;
    let name = fileName.replace(/\.[^.]+$/, "");
    let data = bytes;
    const pc64 = /^[psu]\d\d$/.test(ext) && bytes.length >= 26 &&
      String.fromCharCode(...bytes.subarray(0, 7)) === "C64File";
    if (pc64) {
      const n = bytes.subarray(8, 24);
      const end = n.indexOf(0);
      name = petsciiToText(end < 0 ? n : n.subarray(0, end), true);
      type = { p: 2, s: 1, u: 3 }[ext[0]];
      data = bytes.subarray(26);
    }
    // Keep only characters that exist in PETSCII
    name = [...name.toUpperCase()].filter(isPetsciiChar).join("").slice(0, 16);
    return { name: name || "FILE", type, data };
  }

  const api = {
    Disk, TYPES, SIZES, MAX_ENTRIES, DIR_TRACK, sectorsPerTrack,
    petsciiToText, textToPetscii, isPetsciiChar, listingLine, importFile,
    GRAPHICS: GFX_C0 + GFX_A1,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else global.D64Edit = api;
})(typeof window !== "undefined" ? window : this);
