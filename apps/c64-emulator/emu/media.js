/* Image formats: PRG, P00, D64 (35/40 tracks, with error bytes), G64, T64, TAP, CRT, ZIP.
 * Also GCR encoding/decoding for the 1541 drive emulation and the directory
 * listing / file lookup used by the fast loader.
 */
(function (global) {
  "use strict";

  var SPT = function (t) { return t <= 17 ? 21 : t <= 24 ? 19 : t <= 30 ? 18 : 17; };
  var TRACK_BYTES = function (t) { return t <= 17 ? 7692 : t <= 24 ? 7142 : t <= 30 ? 6666 : 6250; };
  var SPEED = function (t) { return t <= 17 ? 3 : t <= 24 ? 2 : t <= 30 ? 1 : 0; };
  var GCR = [0x0A, 0x0B, 0x12, 0x13, 0x0E, 0x0F, 0x16, 0x17, 0x09, 0x19, 0x1A, 0x1B, 0x0D, 0x1D, 0x1E, 0x15];
  var UNGCR = new Int8Array(32).fill(-1);
  GCR.forEach(function (g, i) { UNGCR[g] = i; });
  var TYPES = ["DEL", "SEQ", "PRG", "USR", "REL"];

  function ext(name) { var m = /\.([a-z0-9]+)$/i.exec(name || ""); return m ? m[1].toLowerCase() : ""; }
  function ascii(bytes, from, len) {
    var s = ""; for (var i = 0; i < len; i++) { var c = bytes[from + i]; if (!c) break; s += String.fromCharCode(c); } return s;
  }
  function trimName(bytes) {
    var n = []; for (var i = 0; i < bytes.length && i < 16; i++) { if (bytes[i] === 0xA0) break; n.push(bytes[i]); } return new Uint8Array(n);
  }
  function petsciiToText(bytes) {
    var s = "";
    for (var i = 0; i < bytes.length; i++) {
      var b = bytes[i];
      if (b >= 0x20 && b < 0x5B) s += String.fromCharCode(b);
      else if (b >= 0xC1 && b <= 0xDA) s += String.fromCharCode(b - 0x80);
      else if (b === 0xA0) s += " ";
      else s += "▒";
    }
    return s;
  }

  // ------------------------------------------------------------------ D64
  function d64Geometry(len) {
    var sizes = { 174848: [35, false], 175531: [35, true], 196608: [40, false], 197376: [40, true], 205312: [42, false], 206114: [42, true] };
    return sizes[len] || null;
  }

  function Disk(name) {
    this.kind = "disk";
    this.name = name;
    this.tracks = 35;
    this.sectors = null;        // Uint8Array, D64 layout
    this.errors = null;
    this.gcr = [];              // per half-track (index 2..85): Uint8Array of GCR bytes
    this.speed = [];            // per half-track speed zone
    this.dirty = false;
    this.writeProtect = false;
  }
  Disk.prototype.offset = function (t, s) {
    var o = 0; for (var i = 1; i < t; i++) o += SPT(i); return (o + s) * 256;
  };
  Disk.prototype.sector = function (t, s) {
    if (!this.sectors || t < 1 || t > this.tracks || s >= SPT(t)) return null;
    var o = this.offset(t, s);
    return this.sectors.subarray(o, o + 256);
  };
  Disk.prototype.readFiles = function () {
    var files = [], seen = {};
    var bam = this.sector(18, 0);
    this.diskName = bam ? trimNamePad(bam.subarray(0x90, 0xA0)) : new Uint8Array(0);
    this.diskId = bam ? bam.subarray(0xA2, 0xA7).slice() : new Uint8Array([0x30, 0x30, 0xA0, 0x32, 0x41]);
    this.free = 0;
    if (bam) for (var t = 1; t <= 35; t++) if (t !== 18) this.free += bam[4 * t];
    var tr = 18, se = 1, guard = 0;
    while (tr && guard++ < 40) {
      var sec = this.sector(tr, se);
      if (!sec || seen[tr * 64 + se]) break;
      seen[tr * 64 + se] = 1;
      for (var e = 0; e < 8; e++) {
        var b = e * 32, type = sec[b + 2];
        if (!(type & 0x07) && !(type & 0x80)) continue;
        if (type === 0) continue;
        var f = { name: trimName(sec.subarray(b + 5, b + 21)), type: type, blocks: sec[b + 30] | (sec[b + 31] << 8),
                  t: sec[b + 3], s: sec[b + 4], disk: this, dirSector: sec, dirOff: b };
        files.push(f);
      }
      tr = sec[0]; se = sec[1];
    }
    this.files = files;
    return files;
  };
  function trimNamePad(b) { return new Uint8Array(b); }

  Disk.prototype.fileData = function (f) {
    var out = [], tr = f.t, se = f.s, guard = 0, seen = {};
    while (tr && guard++ < 800) {
      var sec = this.sector(tr, se);
      if (!sec || seen[tr * 64 + se]) break;
      seen[tr * 64 + se] = 1;
      if (sec[0] === 0) { for (var i = 2; i <= sec[1] && i < 256; i++) out.push(sec[i]); break; }
      for (var j = 2; j < 256; j++) out.push(sec[j]);
      tr = sec[0]; se = sec[1];
    }
    return new Uint8Array(out);
  };

  // Write a PRG file into the image (used by SAVE without the real drive).
  // "@0:NAME" or an existing name replaces the old file.
  Disk.prototype.saveFile = function (nameBytes, data) {
    if (this.writeProtect || !this.sectors) return false;
    var name = Array.from(nameBytes);
    var colon = name.indexOf(0x3A);
    if (colon >= 0 && colon <= 2) name = name.slice(colon + 1);
    name = name.slice(0, 16);
    if (!name.length) return false;
    var bam = this.sector(18, 0), self = this;
    function isFree(t, s) { return (bam[4 * t + 1 + (s >> 3)] >> (s & 7)) & 1; }
    function setUsed(t, s, used) {
      var o = 4 * t + 1 + (s >> 3), m = 1 << (s & 7);
      if (used && (bam[o] & m)) { bam[o] &= ~m; bam[4 * t]--; }
      if (!used && !(bam[o] & m)) { bam[o] |= m; bam[4 * t]++; }
    }
    // remove an existing file of that name
    this.readFiles();
    this.files.forEach(function (f) {
      if (f.name.length === name.length && f.name.every(function (b, i) { return b === name[i]; })) {
        var tr = f.t, se = f.s, guard = 0;
        while (tr && guard++ < 800) { var sec = self.sector(tr, se); if (!sec) break; setUsed(tr, se, false); var nt = sec[0], ns = sec[1]; tr = nt; se = ns; }
        f.dirSector[f.dirOff + 2] = 0;
      }
    });
    // allocate the data sectors: tracks closest to the directory first, interleave 10
    var need = Math.max(1, Math.ceil(data.length / 254)), chain = [];
    var order = []; for (var d = 1; d < 18; d++) { order.push(18 - d); if (18 + d <= 35) order.push(18 + d); }
    var t0 = 0, s0 = 0;
    for (var k = 0; k < order.length && chain.length < need; k++) {
      var t = order[k], n = SPT(t), s = s0 % n;
      for (var tries = 0; tries < n && chain.length < need; tries++) {
        if (isFree(t, s)) { setUsed(t, s, true); chain.push([t, s]); s = (s + 10) % n; tries = -1; if (chain.length >= need) break; }
        else s = (s + 1) % n;
        if (bam[4 * t] === 0) break;
      }
      s0 = 0; t0 = t;
    }
    if (chain.length < need) { this.readFiles(); return false; }
    for (var j = 0; j < chain.length; j++) {
      var sec2 = this.sector(chain[j][0], chain[j][1]);
      sec2.fill(0);
      var part = data.subarray(j * 254, j * 254 + 254);
      sec2.set(part, 2);
      if (j + 1 < chain.length) { sec2[0] = chain[j + 1][0]; sec2[1] = chain[j + 1][1]; }
      else { sec2[0] = 0; sec2[1] = part.length + 1; }
    }
    // directory entry
    var dt = 18, ds = 1, entry = null, guard2 = 0;
    while (!entry && guard2++ < 20) {
      var dsec = this.sector(dt, ds);
      for (var e = 0; e < 8; e++) if (dsec[e * 32 + 2] === 0) { entry = [dsec, e * 32]; break; }
      if (entry) break;
      if (dsec[0]) { dt = dsec[0]; ds = dsec[1]; continue; }
      // new directory sector on track 18
      var ns2 = -1; for (var q = 1; q < SPT(18); q++) if (isFree(18, q)) { ns2 = q; break; }
      if (ns2 < 0) { this.readFiles(); return false; }
      setUsed(18, ns2, true);
      dsec[0] = 18; dsec[1] = ns2;
      var nsec = this.sector(18, ns2); nsec.fill(0); nsec[1] = 0xFF;
      dt = 18; ds = ns2;
    }
    var es = entry[0], eo = entry[1];
    for (var z = 2; z < 32; z++) es[eo + z] = 0;
    es[eo + 2] = 0x82; es[eo + 3] = chain[0][0]; es[eo + 4] = chain[0][1];
    for (var c = 0; c < 16; c++) es[eo + 5 + c] = c < name.length ? name[c] : 0xA0;
    es[eo + 30] = need & 0xFF; es[eo + 31] = need >> 8;
    this.dirty = true;
    this.readFiles();
    this.buildGcr();
    return true;
  };

  function parseD64(name, bytes) {
    var g = d64Geometry(bytes.length);
    if (!g) throw new Error("This is not a valid D64 image (unexpected size of " + bytes.length + " bytes).");
    var d = new Disk(name);
    d.format = "d64";
    d.tracks = g[0];
    var n = 0; for (var t = 1; t <= d.tracks; t++) n += SPT(t);
    d.sectors = bytes.slice(0, n * 256);
    if (g[1]) d.errors = bytes.slice(n * 256, n * 256 + n);
    d.readFiles();
    d.buildGcr();
    return d;
  }

  // ------------------------------------------------------------------ GCR
  function gcrEncode(src, srcOff, dst, dstOff, nBytes) {
    // nBytes must be a multiple of 4
    for (var i = 0; i < nBytes; i += 4) {
      var b0 = src[srcOff + i], b1 = src[srcOff + i + 1], b2 = src[srcOff + i + 2], b3 = src[srcOff + i + 3];
      var g = [GCR[b0 >> 4], GCR[b0 & 15], GCR[b1 >> 4], GCR[b1 & 15], GCR[b2 >> 4], GCR[b2 & 15], GCR[b3 >> 4], GCR[b3 & 15]];
      // 8 x 5 bits = 40 bits = 5 bytes
      var hi = (g[0] << 15) | (g[1] << 10) | (g[2] << 5) | g[3];      // 20 bits
      var lo = (g[4] << 15) | (g[5] << 10) | (g[6] << 5) | g[7];
      dst[dstOff++] = (hi >> 12) & 0xFF;
      dst[dstOff++] = (hi >> 4) & 0xFF;
      dst[dstOff++] = ((hi & 0x0F) << 4) | ((lo >> 16) & 0x0F);
      dst[dstOff++] = (lo >> 8) & 0xFF;
      dst[dstOff++] = lo & 0xFF;
    }
    return dstOff;
  }

  Disk.prototype.buildGcr = function () {
    var bam = this.sector(18, 0);
    var id1 = bam ? bam[0xA2] : 0x30, id2 = bam ? bam[0xA3] : 0x30;
    var eIndex = 0;
    for (var t = 1; t <= 42; t++) {
      var ht = t * 2;
      if (t > this.tracks) { this.gcr[ht] = null; continue; }
      var len = TRACK_BYTES(t), buf = new Uint8Array(len).fill(0x55), p = 0;
      var spt = SPT(t), gap = Math.floor((len - spt * (5 + 10 + 9 + 5 + 325)) / spt);
      for (var s = 0; s < spt; s++) {
        var err = this.errors ? this.errors[eIndex++] : 1;
        var data = this.sector(t, s);
        var hid1 = id1, hid2 = id2;
        if (err === 29) hid1 ^= 0xFF;
        var hdr = [0x08, (s ^ t ^ hid2 ^ hid1) & 0xFF, s, t, hid2, hid1, 0x0F, 0x0F];
        if (err === 27) hdr[1] ^= 0xFF;
        if (err === 20) hdr[0] = 0x00;
        // sync
        if (err !== 21) for (var k = 0; k < 5; k++) buf[p++] = 0xFF; else p += 5;
        p = gcrEncode(hdr, 0, buf, p, 8);
        p += 9;                                  // header gap (0x55)
        for (var k2 = 0; k2 < 5; k2++) buf[p++] = 0xFF;
        var blk = new Uint8Array(260);
        blk[0] = err === 22 ? 0x00 : 0x07;
        var cs = 0;
        for (var i = 0; i < 256; i++) { blk[1 + i] = data[i]; cs ^= data[i]; }
        blk[257] = err === 23 ? cs ^ 0xFF : cs;
        p = gcrEncode(blk, 0, buf, p, 260);
        p += gap;
      }
      this.gcr[ht] = buf;
      this.speed[ht] = SPEED(t);
    }
  };

  // Decode a GCR track into sectors (used for G64 and for writing back)
  function decodeTrack(gcr, track) {
    var bits = gcr.length * 8, out = {};
    function bit(i) { i %= bits; return (gcr[i >> 3] >> (7 - (i & 7))) & 1; }
    function readBytes(pos, n) {    // n GCR bytes starting at bit position
      var res = new Uint8Array(n);
      for (var i = 0; i < n; i++) {
        var v = 0; for (var b = 0; b < 8; b++) v = (v << 1) | bit(pos + i * 8 + b);
        res[i] = v;
      }
      return res;
    }
    function ungcr(g, n) {          // g: GCR bytes, n: decoded bytes (multiple of 4)
      var res = new Uint8Array(n), bi = 0;
      for (var i = 0; i < n * 2; i++) {
        var v = 0; for (var b = 0; b < 5; b++) { v = (v << 1) | ((g[(bi >> 3)] >> (7 - (bi & 7))) & 1); bi++; }
        var nib = UNGCR[v]; if (nib < 0) return null;
        if (i & 1) res[i >> 1] |= nib; else res[i >> 1] = nib << 4;
      }
      return res;
    }
    var ones = 0, i = 0, pendingSector = -1, start = 0;
    // start scanning after the first non-sync bit so we don't begin in the middle of a sync
    while (i < bits && bit(i)) i++;
    start = i;
    for (var n = 0; n < bits + 400; n++, i++) {
      if (bit(i)) { ones++; continue; }
      if (ones >= 10) {
        // a block starts here
        var hdr = ungcr(readBytes(i, 10), 8);
        if (hdr && hdr[0] === 0x08) {
          if (hdr[3] === track) pendingSector = hdr[2];
        } else if (pendingSector >= 0) {
          var blk = ungcr(readBytes(i, 325), 260);
          if (blk && blk[0] === 0x07 && !out[pendingSector]) out[pendingSector] = blk.subarray(1, 257);
          pendingSector = -1;
        }
      }
      ones = 0;
    }
    return out;
  }

  // Rebuild D64 sectors from the (possibly written) GCR tracks
  Disk.prototype.toD64 = function () {
    var res = new Uint8Array(this.sectors.length);
    res.set(this.sectors);
    for (var t = 1; t <= this.tracks; t++) {
      var g = this.gcr[t * 2];
      if (!g) continue;
      var dec = decodeTrack(g, t);
      for (var s = 0; s < SPT(t); s++) if (dec[s]) res.set(dec[s], this.offset(t, s));
    }
    return res;
  };
  Disk.prototype.syncFromGcr = function () {
    if (!this.sectors) return;
    this.sectors = this.toD64();
    this.readFiles();
  };

  function parseG64(name, bytes) {
    if (ascii(bytes, 0, 8) !== "GCR-1541") throw new Error("This is not a valid G64 image.");
    var d = new Disk(name);
    d.format = "g64";
    var n = bytes[9], dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    var maxTrack = 0;
    for (var i = 0; i < n; i++) {
      var off = dv.getUint32(12 + i * 4, true);
      var spd = dv.getUint32(12 + n * 4 + i * 4, true);
      var ht = i + 2;
      if (!off) { d.gcr[ht] = null; continue; }
      var len = dv.getUint16(off, true);
      d.gcr[ht] = bytes.slice(off + 2, off + 2 + len);
      d.speed[ht] = spd < 4 ? spd : 3;
      if (!(i & 1)) maxTrack = Math.max(maxTrack, (ht >> 1));
    }
    d.tracks = Math.min(Math.max(35, maxTrack), 42);
    // decode a D64 view for the fast loader and the directory
    var total = 0; for (var t = 1; t <= d.tracks; t++) total += SPT(t);
    d.sectors = new Uint8Array(total * 256);
    d.syncFromGcr();
    return d;
  }

  Disk.prototype.toG64 = function () {
    var n = 84, maxLen = 7928, parts = [], tableLen = 12 + n * 8;
    var offsets = new Uint32Array(n), speeds = new Uint32Array(n), pos = tableLen;
    for (var i = 0; i < n; i++) {
      var g = this.gcr[i + 2];
      if (!g) continue;
      offsets[i] = pos; speeds[i] = this.speed[i + 2] || 0;
      pos += 2 + maxLen;
    }
    var out = new Uint8Array(pos), dv = new DataView(out.buffer);
    out.set([71, 67, 82, 45, 49, 53, 52, 49, 0, n]);
    dv.setUint16(10, maxLen, true);
    for (var j = 0; j < n; j++) {
      dv.setUint32(12 + j * 4, offsets[j], true);
      dv.setUint32(12 + n * 4 + j * 4, speeds[j], true);
      if (offsets[j]) {
        var g2 = this.gcr[j + 2];
        dv.setUint16(offsets[j], g2.length, true);
        out.set(g2.subarray(0, maxLen), offsets[j] + 2);
      }
    }
    return out;
  };

  // A blank formatted disk
  function blankDisk(label) {
    var bytes = new Uint8Array(174848);
    var d = new Disk(label || "blank.d64");
    d.format = "d64"; d.tracks = 35; d.sectors = bytes;
    var bam = d.sector(18, 0);
    bam[0] = 18; bam[1] = 1; bam[2] = 0x41;
    for (var t = 1; t <= 35; t++) {
      var n = SPT(t), o = 4 * t, free = t === 18 ? n - 2 : n;
      bam[o] = free;
      var mask = 0; for (var s = 0; s < n; s++) if (!(t === 18 && s < 2)) mask |= 1 << s;
      bam[o + 1] = mask & 0xFF; bam[o + 2] = (mask >> 8) & 0xFF; bam[o + 3] = (mask >> 16) & 0xFF;
    }
    var nm = (label || "BLANK").toUpperCase().slice(0, 16);
    for (var i = 0; i < 16; i++) bam[0x90 + i] = i < nm.length ? nm.charCodeAt(i) : 0xA0;
    bam[0xA0] = bam[0xA1] = 0xA0; bam[0xA2] = 0x30; bam[0xA3] = 0x30; bam[0xA4] = 0xA0; bam[0xA5] = 0x32; bam[0xA6] = 0x41;
    for (var k = 0xA7; k <= 0xAA; k++) bam[k] = 0xA0;
    var dir = d.sector(18, 1); dir[0] = 0; dir[1] = 0xFF;
    d.readFiles(); d.buildGcr();
    return d;
  }

  // ------------------------------------------------------------------ T64
  function parseT64(name, bytes) {
    var sig = ascii(bytes, 0, 32);
    if (!/C64/i.test(sig)) throw new Error("This is not a valid T64 image.");
    var max = bytes[0x22] | (bytes[0x23] << 8), used = bytes[0x24] | (bytes[0x25] << 8);
    var entries = [];
    for (var i = 0; i < Math.max(max, 1) && 0x40 + i * 32 + 32 <= bytes.length; i++) {
      var b = 0x40 + i * 32;
      if (bytes[b] === 0) continue;
      var start = bytes[b + 2] | (bytes[b + 3] << 8), end = bytes[b + 4] | (bytes[b + 5] << 8);
      var off = bytes[b + 8] | (bytes[b + 9] << 8) | (bytes[b + 10] << 16) | (bytes[b + 11] << 24);
      entries.push({ start: start, end: end, off: off, name: trimName(bytes.subarray(b + 0x10, b + 0x20)) });
    }
    if (!entries.length && used) throw new Error("The T64 image contains no files.");
    var sorted = entries.slice().sort(function (a, b) { return a.off - b.off; });
    var files = entries.map(function (e) {
      var idx = sorted.indexOf(e);
      var nextOff = idx + 1 < sorted.length ? sorted[idx + 1].off : bytes.length;
      var len = e.end > e.start ? e.end - e.start : 0;
      if (!len || e.off + len > bytes.length || len > nextOff - e.off) len = Math.min(nextOff, bytes.length) - e.off;
      var data = new Uint8Array(len + 2);
      data[0] = e.start & 0xFF; data[1] = e.start >> 8;
      data.set(bytes.subarray(e.off, e.off + len), 2);
      return { name: e.name, type: 0x82, blocks: Math.ceil(len / 254), data: data };
    });
    return { kind: "t64", name: name, files: files, diskName: trimName(bytes.subarray(0x28, 0x40)), diskId: new Uint8Array([0x54, 0x36, 0x34]) };
  }

  // ------------------------------------------------------------------ TAP
  function parseTap(name, bytes) {
    if (ascii(bytes, 0, 12) !== "C64-TAPE-RAW") throw new Error("This is not a valid TAP image.");
    var version = bytes[12];
    // pulse lengths in cycles
    var pulses = [], i = 20;
    while (i < bytes.length) {
      var b = bytes[i++];
      if (b) pulses.push(b * 8);
      else if (version >= 1) { pulses.push(bytes[i] | (bytes[i + 1] << 8) | (bytes[i + 2] << 16)); i += 3; }
      else pulses.push(256 * 8);
    }
    var total = 0; for (var k = 0; k < pulses.length; k++) total += pulses[k];
    return { kind: "tap", name: name, version: version, pulses: Uint32Array.from(pulses), cycles: total };
  }

  // ------------------------------------------------------------------ CRT
  function parseCrt(name, bytes) {
    if (ascii(bytes, 0, 16) !== "C64 CARTRIDGE   ") throw new Error("This is not a valid CRT cartridge image.");
    var dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    var hlen = dv.getUint32(0x10), type = dv.getUint16(0x16);
    var crt = { kind: "crt", name: name, type: type, exrom: bytes[0x18] ? 1 : 0, game: bytes[0x19] ? 1 : 0,
                title: ascii(bytes, 0x20, 32), chips: [] };
    var p = hlen;
    while (p + 16 <= bytes.length) {
      if (ascii(bytes, p, 4) !== "CHIP") break;
      var plen = dv.getUint32(p + 4), ctype = dv.getUint16(p + 8), bank = dv.getUint16(p + 10);
      var addr = dv.getUint16(p + 12), size = dv.getUint16(p + 14);
      crt.chips.push({ type: ctype, bank: bank, addr: addr, size: size, data: bytes.slice(p + 16, p + 16 + size) });
      if (!plen) break;
      p += plen;
    }
    return crt;
  }

  // ------------------------------------------------------------------ PRG / P00
  function parsePrg(name, bytes) {
    if (bytes.length < 3) throw new Error("The program file is too short.");
    return { kind: "prg", name: name, data: bytes };
  }
  function parseP00(name, bytes) {
    if (ascii(bytes, 0, 7) !== "C64File") throw new Error("This is not a valid P00 file.");
    return { kind: "prg", name: ascii(bytes, 8, 16) || name, data: bytes.slice(26) };
  }

  // ------------------------------------------------------------------ ZIP
  async function unzip(bytes) {
    var dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    var eocd = -1;
    for (var i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
      if (dv.getUint32(i, true) === 0x06054B50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error("This ZIP archive is damaged.");
    var count = dv.getUint16(eocd + 10, true), cd = dv.getUint32(eocd + 16, true), out = [];
    for (var k = 0; k < count; k++) {
      if (dv.getUint32(cd, true) !== 0x02014B50) break;
      var method = dv.getUint16(cd + 10, true), csize = dv.getUint32(cd + 20, true);
      var nlen = dv.getUint16(cd + 28, true), elen = dv.getUint16(cd + 30, true), clen = dv.getUint16(cd + 32, true);
      var lho = dv.getUint32(cd + 42, true);
      var fname = new TextDecoder().decode(bytes.subarray(cd + 46, cd + 46 + nlen));
      cd += 46 + nlen + elen + clen;
      if (/\/$/.test(fname)) continue;
      var dataStart = lho + 30 + dv.getUint16(lho + 26, true) + dv.getUint16(lho + 28, true);
      var raw = bytes.subarray(dataStart, dataStart + csize), data;
      if (method === 0) data = raw.slice();
      else if (method === 8) {
        if (typeof DecompressionStream === "undefined") throw new Error("This browser cannot unpack ZIP archives.");
        var ds = new DecompressionStream("deflate-raw");
        var stream = new Blob([raw]).stream().pipeThrough(ds);
        data = new Uint8Array(await new Response(stream).arrayBuffer());
      } else continue;
      out.push({ name: fname.split("/").pop(), data: data });
    }
    return out;
  }

  var SUPPORTED = ["prg", "p00", "d64", "g64", "t64", "tap", "crt"];

  function parse(name, bytes) {
    var e = ext(name);
    switch (e) {
      case "d64": return parseD64(name, bytes);
      case "g64": return parseG64(name, bytes);
      case "t64": return parseT64(name, bytes);
      case "tap": return parseTap(name, bytes);
      case "crt": return parseCrt(name, bytes);
      case "p00": return parseP00(name, bytes);
      case "prg": return parsePrg(name, bytes);
    }
    // guess by content
    if (ascii(bytes, 0, 16) === "C64 CARTRIDGE   ") return parseCrt(name, bytes);
    if (ascii(bytes, 0, 12) === "C64-TAPE-RAW") return parseTap(name, bytes);
    if (ascii(bytes, 0, 8) === "GCR-1541") return parseG64(name, bytes);
    if (ascii(bytes, 0, 7) === "C64File") return parseP00(name, bytes);
    if (d64Geometry(bytes.length)) return parseD64(name, bytes);
    if (/^C64/.test(ascii(bytes, 0, 3))) return parseT64(name, bytes);
    if (e === "" || e === "bin" || e === "64c") return parsePrg(name, bytes);
    throw new Error("Unsupported file type ." + e + ". Use PRG, P00, D64, G64, T64, TAP, CRT or ZIP.");
  }

  // Parse a dropped file; ZIP archives return all supported images inside.
  async function load(name, bytes) {
    if (ext(name) === "zip" || (bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 3 && bytes[3] === 4)) {
      var entries = await unzip(bytes), res = [];
      entries.forEach(function (en) {
        if (SUPPORTED.indexOf(ext(en.name)) >= 0) { try { res.push(parse(en.name, en.data)); } catch (err) { /* skip */ } }
      });
      if (!res.length) throw new Error("The ZIP archive contains no C64 image (PRG, D64, G64, T64, TAP or CRT).");
      res.sort(function (a, b) { return a.name.localeCompare(b.name, undefined, { numeric: true }); });
      return res;
    }
    return [parse(name, bytes)];
  }

  // ------------------------------------------------------------------ directory and lookup
  function matchName(pattern, name) {
    for (var i = 0; i < pattern.length; i++) {
      var p = pattern[i];
      if (p === 0x2A) return true;                      // *
      if (i >= name.length) return false;
      if (p !== 0x3F && p !== name[i]) return false;    // ?
    }
    return pattern.length === name.length;
  }

  // Build the BASIC program that LOAD"$",8 produces
  function directoryProgram(src, pattern) {
    var lines = [], files = src.files || [];
    var head = [0x12, 0x22];
    var dn = src.diskName || []; for (var i = 0; i < 16; i++) head.push(i < dn.length ? dn[i] : 0x20);
    head.push(0x22, 0x20);
    var id = src.diskId || [0x30, 0x30, 0xA0, 0x32, 0x41];
    for (var k = 0; k < 5; k++) head.push(id[k] === 0xA0 ? 0x20 : id[k]);
    lines.push({ num: 0, text: head });
    files.forEach(function (f) {
      if (pattern && pattern.length && !matchName(pattern, f.name)) return;
      var t = [], blocks = f.blocks;
      var pad = blocks < 10 ? 3 : blocks < 100 ? 2 : 1;
      for (var a = 0; a < pad; a++) t.push(0x20);
      t.push(0x22);
      for (var j = 0; j < f.name.length; j++) t.push(f.name[j]);
      t.push(0x22);
      for (var j2 = f.name.length; j2 < 16; j2++) t.push(0x20);
      t.push((f.type & 0x80) ? 0x20 : 0x2A);
      var tn = TYPES[f.type & 7] || "???";
      for (var c = 0; c < 3; c++) t.push(tn.charCodeAt(c));
      t.push((f.type & 0x40) ? 0x3C : 0x20);
      lines.push({ num: blocks, text: t });
    });
    var free = "BLOCKS FREE.             ";
    var ft = []; for (var q = 0; q < free.length; q++) ft.push(free.charCodeAt(q));
    lines.push({ num: src.free != null ? src.free : 0, text: ft });
    var prg = [0x01, 0x08], addr = 0x0801;
    lines.forEach(function (l) {
      var next = addr + 4 + l.text.length + 1;
      prg.push(next & 0xFF, next >> 8, l.num & 0xFF, l.num >> 8);
      prg.push.apply(prg, l.text);
      prg.push(0);
      addr = next;
    });
    prg.push(0, 0);
    return new Uint8Array(prg);
  }

  function findFile(src, nameBytes) {
    var name = nameBytes.slice();
    // strip "@0:", "0:" prefixes
    var colon = name.indexOf(0x3A);
    if (colon >= 0 && colon <= 2 && name[0] !== 0x24) name = name.slice(colon + 1);
    if (name[0] === 0x24) {                       // $
      var pat = [];
      var c2 = name.indexOf(0x3A);
      if (c2 >= 0) pat = name.slice(c2 + 1);
      return { name: new Uint8Array([0x24]), isDirectory: true, data: directoryProgram(src, pat) };
    }
    var files = (src.files || []).filter(function (f) { return (f.type & 7) === 2 || (f.type & 7) === 1 || src.kind === "t64"; });
    if (!files.length) return null;
    if (!name.length) return src.kind === "t64" ? withData(files[0]) : null;
    for (var i = 0; i < files.length; i++) {
      if (matchName(name, files[i].name)) return withData(files[i]);
    }
    return null;
  }
  function withData(f) {
    if (!f.data && f.disk) f.data = f.disk.fileData(f);
    return f;
  }

  global.C64Media = {
    load: load, parse: parse, findFile: findFile, directoryProgram: directoryProgram,
    blankDisk: blankDisk, petsciiToText: petsciiToText, decodeTrack: decodeTrack,
    SPT: SPT, TRACK_BYTES: TRACK_BYTES, SPEED: SPEED, TYPES: TYPES, ext: ext
  };
})(typeof window !== "undefined" ? window : globalThis);
