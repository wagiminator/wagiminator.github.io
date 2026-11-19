/* Hex Editor: reading and writing firmware files.
 * An image is { regions: [{ addr, data: Uint8Array, name }], start (entry point or null), info: {…} }.
 * Formats: raw binary, Intel HEX, Motorola S-record, UF2 and ELF (32/64 bit, little and big endian). */
(function (global) {
  "use strict";

  function FormatError(msg) { var e = new Error(msg); e.format = true; return e; }
  var hex2 = function (v) { return (v & 255).toString(16).toUpperCase().padStart(2, "0"); };
  var hexN = function (v, n) { return (v >>> 0).toString(16).toUpperCase().padStart(n, "0"); };

  // pieces at addresses → sorted regions without overlaps (later pieces win), touching pieces joined
  function merge(pieces) {
    if (!pieces.length) return [];
    pieces = pieces.slice().sort(function (a, b) { return a.addr - b.addr; });
    var out = [], cur = null, buf = null, len = 0;
    pieces.forEach(function (p) {
      var end = p.addr + p.data.length;
      if (cur && p.addr <= cur.addr + len) {
        var need = end - cur.addr;
        if (need > buf.length) { var nb = new Uint8Array(Math.max(need, buf.length * 2)); nb.set(buf.subarray(0, len)); buf = nb; }
        buf.set(p.data, p.addr - cur.addr);
        if (need > len) len = need;
      } else {
        if (cur) out.push({ addr: cur.addr, data: buf.slice(0, len) });
        cur = { addr: p.addr }; buf = new Uint8Array(Math.max(256, p.data.length * 2)); buf.set(p.data); len = p.data.length;
      }
    });
    out.push({ addr: cur.addr, data: buf.slice(0, len) });
    return out;
  }

  // ================================================================ Intel HEX
  function readHex(text) {
    var pieces = [], base = 0, line = 0, start = null, seen = false;
    text.split(/\r?\n/).some(function (raw) {
      line++;
      var s = raw.trim();
      if (!s) return false;
      if (s[0] !== ":" || !/^:[0-9a-fA-F]+$/.test(s) || s.length % 2 === 0) throw FormatError("Line " + line + " is not an Intel HEX record");
      var b = [];
      for (var i = 1; i < s.length; i += 2) b.push(parseInt(s.substr(i, 2), 16));
      if (b.length !== b[0] + 5) throw FormatError("Line " + line + " has the wrong length");
      if (b.reduce(function (a, v) { return (a + v) & 255; }, 0) !== 0) throw FormatError("Checksum error in line " + line);
      var off = (b[1] << 8) | b[2], t = b[3], d = b.slice(4, 4 + b[0]);
      seen = true;
      if (t === 0) pieces.push({ addr: base + off, data: Uint8Array.from(d) });
      else if (t === 1) return true;
      else if (t === 2) base = ((d[0] << 8) | d[1]) * 16;
      else if (t === 4) base = ((d[0] << 8) | d[1]) * 65536;
      else if (t === 3) start = ((d[0] << 8 | d[1]) * 16 + (d[2] << 8 | d[3])) >>> 0;
      else if (t === 5) start = ((d[0] << 24) | (d[1] << 16) | (d[2] << 8) | d[3]) >>> 0;
      return false;
    });
    if (!seen) throw FormatError("No HEX records found");
    return { regions: merge(pieces), start: start, info: { format: "Intel HEX" } };
  }
  function writeHex(regions, opt) {
    opt = opt || {};
    var rl = opt.recordLength || 16, out = [], hi = -1;
    var rec = function (type, addr, bytes) {
      var b = [bytes.length, (addr >> 8) & 255, addr & 255, type].concat(Array.from(bytes)), sum = 0;
      b.forEach(function (v) { sum = (sum + v) & 255; });
      out.push(":" + b.map(hex2).join("") + hex2((256 - sum) & 255));
    };
    regions.forEach(function (r) {
      for (var o = 0; o < r.data.length;) {
        var a = r.addr + o, up = Math.floor(a / 65536);
        if (up !== hi) { rec(4, 0, [(up >> 8) & 255, up & 255]); hi = up; }
        var n = Math.min(rl, r.data.length - o, 65536 - (a & 0xFFFF));
        rec(0, a & 0xFFFF, r.data.subarray(o, o + n));
        o += n;
      }
    });
    if (opt.start != null) rec(5, 0, [(opt.start >>> 24) & 255, (opt.start >>> 16) & 255, (opt.start >>> 8) & 255, opt.start & 255]);
    rec(1, 0, []);
    return out.join("\r\n") + "\r\n";
  }

  // ================================================================ Motorola S-record
  function readSrec(text) {
    var pieces = [], line = 0, start = null, header = "", seen = false;
    text.split(/\r?\n/).forEach(function (raw) {
      line++;
      var s = raw.trim();
      if (!s) return;
      if (!/^S[0-9][0-9a-fA-F]+$/.test(s) || s.length % 2) throw FormatError("Line " + line + " is not an S-record");
      var t = +s[1], b = [];
      for (var i = 2; i < s.length; i += 2) b.push(parseInt(s.substr(i, 2), 16));
      if (b.length !== b[0] + 1) throw FormatError("Line " + line + " has the wrong length");
      var sum = 0; for (var k = 0; k < b.length - 1; k++) sum = (sum + b[k]) & 255;
      if (((~sum) & 255) !== b[b.length - 1]) throw FormatError("Checksum error in line " + line);
      var al = { 0: 2, 1: 2, 2: 3, 3: 4, 5: 2, 6: 3, 7: 4, 8: 3, 9: 2 }[t];
      if (!al) return;
      var addr = 0; for (var j = 0; j < al; j++) addr = addr * 256 + b[1 + j];
      var d = b.slice(1 + al, b.length - 1);
      seen = true;
      if (t >= 1 && t <= 3) pieces.push({ addr: addr, data: Uint8Array.from(d) });
      else if (t >= 7) start = addr;
      else if (t === 0) header = String.fromCharCode.apply(null, d).replace(/[^\x20-\x7e]/g, "");
    });
    if (!seen) throw FormatError("No S-records found");
    return { regions: merge(pieces), start: start, info: { format: "Motorola S-record", header: header } };
  }
  function writeSrec(regions, opt) {
    opt = opt || {};
    var rl = opt.recordLength || 16, out = [], top = 0, count = 0;
    regions.forEach(function (r) { top = Math.max(top, r.addr + r.data.length - 1); });
    var t = top > 0xFFFFFF ? 3 : top > 0xFFFF ? 2 : 1, al = t + 1;
    var rec = function (type, addr, bytes, alen) {
      var b = [bytes.length + alen + 1];
      for (var i = alen - 1; i >= 0; i--) b.push(Math.floor(addr / Math.pow(256, i)) & 255);
      b = b.concat(Array.from(bytes));
      var sum = 0; b.forEach(function (v) { sum = (sum + v) & 255; });
      out.push("S" + type + b.map(hex2).join("") + hex2(~sum & 255));
    };
    rec(0, 0, Array.from(new TextEncoder().encode(opt.header || "HEX EDITOR")), 2);
    regions.forEach(function (r) {
      for (var o = 0; o < r.data.length; o += rl) { rec(t, r.addr + o, r.data.subarray(o, Math.min(o + rl, r.data.length)), al); count++; }
    });
    if (count <= 0xFFFF) rec(5, count, [], 2); else rec(6, count, [], 3);
    rec(10 - t, opt.start != null ? opt.start : 0, [], al);
    return out.join("\r\n") + "\r\n";
  }

  // ================================================================ UF2
  var UF2_FAMILIES = { 0xe48bff56: "RP2040", 0xe48bff59: "RP2350 (Arm)", 0xe48bff5a: "RP2350 (RISC-V)", 0x68ed2b88: "SAMD21", 0x55114460: "SAMD51", 0x1c5f21b0: "ESP32", 0xbfdd4eee: "ESP32-S2", 0xc47e5767: "ESP32-S3", 0xd42ba06c: "ESP32-C3", 0x57755a57: "STM32F4", 0x5ee21072: "STM32F1", 0x1851780a: "nRF52" };
  function isUf2(u8) { return u8.length >= 512 && u8[0] === 0x55 && u8[1] === 0x46 && u8[2] === 0x32 && u8[3] === 0x0A; }
  function readUf2(u8) {
    var dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength), pieces = [], fam = null, n = 0;
    for (var o = 0; o + 512 <= u8.length; o += 512) {
      if (dv.getUint32(o, true) !== 0x0A324655 || dv.getUint32(o + 4, true) !== 0x9E5D5157 || dv.getUint32(o + 508, true) !== 0x0AB16F30) continue;
      var flags = dv.getUint32(o + 8, true), addr = dv.getUint32(o + 12, true), size = dv.getUint32(o + 16, true);
      if (flags & 1) continue;                                        // not for the main flash
      if (flags & 0x2000) fam = dv.getUint32(o + 28, true);
      pieces.push({ addr: addr, data: u8.slice(o + 32, o + 32 + Math.min(size, 476)) });
      n++;
    }
    if (!n) throw FormatError("No UF2 blocks found");
    return { regions: merge(pieces), start: null, info: { format: "UF2", family: fam, familyName: fam != null ? UF2_FAMILIES[fam] || "family 0x" + hexN(fam, 8) : "" } };
  }
  // 256-byte blocks at 256-byte boundaries (as the bootloaders want them); missing bytes of a block are 0xFF
  function writeUf2(regions, opt) {
    opt = opt || {};
    var pages = {}, fam = opt.family;
    regions.forEach(function (r) {
      for (var i = 0; i < r.data.length; i++) {
        var a = r.addr + i, pg = Math.floor(a / 256);
        if (!pages[pg]) pages[pg] = new Uint8Array(256).fill(0xFF);
        pages[pg][a - pg * 256] = r.data[i];
      }
    });
    var keys = Object.keys(pages).map(Number).sort(function (x, y) { return x - y; });
    var out = new Uint8Array(keys.length * 512), dv = new DataView(out.buffer);
    keys.forEach(function (pg, i) {
      var o = i * 512;
      dv.setUint32(o, 0x0A324655, true); dv.setUint32(o + 4, 0x9E5D5157, true);
      dv.setUint32(o + 8, fam != null ? 0x2000 : 0, true); dv.setUint32(o + 12, pg * 256, true);
      dv.setUint32(o + 16, 256, true); dv.setUint32(o + 20, i, true); dv.setUint32(o + 24, keys.length, true);
      dv.setUint32(o + 28, fam != null ? fam : 0, true);
      out.set(pages[pg], o + 32);
      dv.setUint32(o + 508, 0x0AB16F30, true);
    });
    return out;
  }

  // ================================================================ ELF
  var MACHINES = { 2: "SPARC", 3: "x86", 8: "MIPS", 20: "PowerPC", 40: "Arm", 62: "x86-64", 83: "AVR", 94: "Xtensa", 105: "MSP430", 183: "Arm64", 243: "RISC-V", 0x9026: "Alpha" };
  function isElf(u8) { return u8.length > 52 && u8[0] === 0x7F && u8[1] === 0x45 && u8[2] === 0x4C && u8[3] === 0x46; }
  function readElf(u8) {
    var c64 = u8[4] === 2, le = u8[5] !== 2, dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    if (u8[4] !== 1 && u8[4] !== 2) throw FormatError("Unknown ELF class");
    var u16 = function (o) { return dv.getUint16(o, le); }, u32 = function (o) { return dv.getUint32(o, le); };
    var addr = c64 ? function (o) { var lo = dv.getUint32(o + (le ? 0 : 4), le), hi = dv.getUint32(o + (le ? 4 : 0), le); return hi * 4294967296 + lo; } : u32;
    var A = c64 ? 8 : 4;
    var h = { type: u16(16), machine: u16(18) };
    h.entry = addr(24); h.phoff = addr(24 + A); h.shoff = addr(24 + 2 * A);
    var o2 = 24 + 3 * A + 4;
    h.phentsize = u16(o2 + 2); h.phnum = u16(o2 + 4); h.shentsize = u16(o2 + 6); h.shnum = u16(o2 + 8); h.shstrndx = u16(o2 + 10);
    var segs = [];
    for (var i = 0; i < h.phnum; i++) {
      var p = h.phoff + i * h.phentsize;
      if (p + h.phentsize > u8.length) break;
      var s = c64 ? { type: u32(p), flags: u32(p + 4), offset: addr(p + 8), vaddr: addr(p + 16), paddr: addr(p + 24), filesz: addr(p + 32), memsz: addr(p + 40) }
        : { type: u32(p), offset: u32(p + 4), vaddr: u32(p + 8), paddr: u32(p + 12), filesz: u32(p + 16), memsz: u32(p + 20), flags: u32(p + 24) };
      segs.push(s);
    }
    var secs = [];
    for (var k = 0; k < h.shnum; k++) {
      var q = h.shoff + k * h.shentsize;
      if (!h.shoff || q + h.shentsize > u8.length) break;
      secs.push(c64 ? { nameOff: u32(q), type: u32(q + 4), flags: addr(q + 8), addr: addr(q + 16), offset: addr(q + 24), size: addr(q + 32), link: u32(q + 40), entsize: addr(q + 56) }
        : { nameOff: u32(q), type: u32(q + 4), flags: u32(q + 8), addr: u32(q + 12), offset: u32(q + 16), size: u32(q + 20), link: u32(q + 24), entsize: u32(q + 36) });
    }
    var str = function (sec, off) {
      if (!sec) return "";
      var a = sec.offset + off, e = a;
      while (e < u8.length && e < sec.offset + sec.size && u8[e]) e++;
      return new TextDecoder().decode(u8.subarray(a, e));
    };
    var shstr = secs[h.shstrndx];
    secs.forEach(function (s, i) { s.index = i; s.name = str(shstr, s.nameOff); });
    // load address (LMA) of a section: through the segment that holds its file bytes
    secs.forEach(function (s) {
      s.lma = s.addr;
      segs.forEach(function (g) {
        if (g.type === 1 && s.type !== 8 && s.size && s.offset >= g.offset && s.offset + s.size <= g.offset + g.filesz && (s.flags & 2)) s.lma = g.paddr + (s.offset - g.offset);
      });
    });
    // symbols
    var syms = [];
    secs.forEach(function (s) {
      if (s.type !== 2 && s.type !== 11) return;
      var ss = secs[s.link], es = s.entsize || (c64 ? 24 : 16);
      for (var o = s.offset + es; o + es <= s.offset + s.size; o += es) {
        var sy = c64 ? { name: u32(o), info: u8[o + 4], shndx: u16(o + 6), value: addr(o + 8), size: addr(o + 16) }
          : { name: u32(o), value: u32(o + 4), size: u32(o + 8), info: u8[o + 12], shndx: u16(o + 14) };
        var type = sy.info & 15;
        if (type !== 1 && type !== 2 && type !== 0) continue;
        var nm = str(ss, sy.name);
        if (!nm || nm[0] === "$" || /^\.L/.test(nm) || sy.shndx === 0 || sy.shndx >= 0xFF00) continue;
        syms.push({ name: nm, value: sy.value, size: sy.size, type: type === 2 ? "func" : type === 1 ? "object" : "label", section: secs[sy.shndx] ? secs[sy.shndx].name : "" });
      }
    });
    var seen = {};
    syms = syms.filter(function (s) { var k = s.name + "@" + s.value; if (seen[k]) return false; seen[k] = 1; return true; }).sort(function (a, b) { return a.value - b.value; });
    // the image: the file bytes of the loadable segments at their load addresses (as objcopy does)
    var regions = [];
    segs.forEach(function (g, i) {
      if (g.type !== 1 || !g.filesz) return;
      var names = secs.filter(function (s) { return s.type !== 8 && s.size && (s.flags & 2) && s.offset >= g.offset && s.offset + s.size <= g.offset + g.filesz; }).map(function (s) { return s.name; });
      regions.push({ addr: g.paddr, data: u8.subarray(g.offset, g.offset + g.filesz), name: "Segment " + i + (names.length ? " (" + names.join(" ") + ")" : ""), fileOff: g.offset, vaddr: g.vaddr });
    });
    regions.sort(function (a, b) { return a.addr - b.addr; });
    // vaddr → paddr for the symbols
    syms.forEach(function (sy) {
      sy.lma = sy.value;
      segs.forEach(function (g) { if (g.type === 1 && g.filesz && sy.value >= g.vaddr && sy.value < g.vaddr + g.filesz) sy.lma = g.paddr + (sy.value - g.vaddr); });
    });
    return {
      regions: regions, start: h.entry,
      info: { format: "ELF " + (c64 ? "64" : "32") + "-bit " + (le ? "little" : "big") + " endian", machine: MACHINES[h.machine] || "machine " + h.machine, elf: true, type: h.type, le: le, c64: c64 },
      sections: secs.filter(function (s) { return s.name && s.type !== 0; }), segments: segs, symbols: syms
    };
  }

  // ================================================================ detection
  function looksText(u8, re) {
    var n = Math.min(u8.length, 4096), s = "";
    for (var i = 0; i < n; i++) { var c = u8[i]; if (c === 0 || (c < 9) || (c > 13 && c < 32 && c !== 26) || c > 126) return false; s += String.fromCharCode(c); }
    return re.test(s.replace(/^﻿/, "").trimStart());
  }
  // file bytes → image; how: "auto" | "bin"
  function read(name, u8, how, base) {
    if (how !== "bin") {
      if (isElf(u8)) return readElf(u8);
      if (isUf2(u8)) return readUf2(u8);
      if (looksText(u8, /^:[0-9a-fA-F]{10}/)) return readHex(new TextDecoder().decode(u8));
      if (looksText(u8, /^S[0-9][0-9a-fA-F]{6}/)) return readSrec(new TextDecoder().decode(u8));
    }
    return { regions: [{ addr: base || 0, data: u8, name: "Binary" }], start: null, info: { format: "Binary", bin: true } };
  }

  global.HX = global.HX || {};
  Object.assign(global.HX, { read: read, readHex: readHex, writeHex: writeHex, readSrec: readSrec, writeSrec: writeSrec, readUf2: readUf2, writeUf2: writeUf2, readElf: readElf, merge: merge, UF2_FAMILIES: UF2_FAMILIES, hexN: hexN, hex2: hex2 });
})(window);
