/* C64 Packer: tape images (.tap) with a turbo loader.
 *
 * Part 1, the normal KERNAL format (header block and data block, each written twice):
 * the header carries the turbo loader in its free bytes, the file is the CHRIN vector,
 * so the loader starts by itself when BASIC wants its next line after LOAD.
 * Part 2, the turbo format, two blocks (pilot, sync byte, addresses, data, checksum):
 * the second part of the loader, then the program.
 */
(function (global) {
  "use strict";

  var T = global.PackerSFX.turbo;
  var S = 0x30, M = 0x42, L = 0x56;              // KERNAL pulses (cycles / 8)
  var T0 = 0x1C, T1 = 0x30;                      // turbo pulses: 224 and 384 cycles
  function b64(s) {
    var b = typeof atob === "function" ? atob(s) : Buffer.from(s, "base64").toString("binary");
    var a = new Uint8Array(b.length);
    for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
    return a;
  }

  function Pulses() { this.p = []; }
  Pulses.prototype.n = function (v, count) { for (var i = 0; i < count; i++) this.p.push(v); };
  Pulses.prototype.pause = function (cycles) { this.p.push(0, cycles & 0xFF, (cycles >> 8) & 0xFF, (cycles >> 16) & 0xFF); };
  // a KERNAL byte: new-data marker, 8 bits from the lowest, odd parity
  Pulses.prototype.kbyte = function (v) {
    var p = this.p, par = 1;
    p.push(L, M);
    for (var i = 0; i < 8; i++) {
      var bit = (v >> i) & 1;
      par ^= bit;
      if (bit) p.push(M, S); else p.push(S, M);
    }
    if (par) p.push(M, S); else p.push(S, M);
  };
  Pulses.prototype.kblock = function (payload, repeat) {
    var cs = 0, i;
    for (i = 9; i >= 1; i--) this.kbyte((repeat ? 0 : 0x80) | i);
    for (i = 0; i < payload.length; i++) { this.kbyte(payload[i]); cs ^= payload[i]; }
    this.kbyte(cs);
    this.p.push(L, S);                           // end of data
  };
  // a KERNAL file: header and data, both twice
  Pulses.prototype.kfile = function (header, data) {
    this.n(S, 0x6A00); this.kblock(header, false);
    this.n(S, 0x4F); this.kblock(header, true);
    this.n(S, 0x4E);
    this.pause(330000);
    this.n(S, 0x1500); this.kblock(data, false);
    this.n(S, 0x4F); this.kblock(data, true);
    this.n(S, 0x4E);
  };
  // turbo bytes: from the highest bit
  Pulses.prototype.tbyte = function (v) { for (var i = 7; i >= 0; i--) this.p.push((v >> i) & 1 ? T1 : T0); };
  // a turbo block: pilot, sync, end and load address (high bytes first), data, checksum
  Pulses.prototype.tblock = function (data, load, pilot) {
    var end = load + data.length, cs = 0, i;
    this.n(T0, 64);
    for (i = 0; i < pilot; i++) this.tbyte(0x40);
    this.tbyte(0x5A);
    this.tbyte(end >> 8); this.tbyte(end & 0xFF); this.tbyte(load >> 8); this.tbyte(load & 0xFF);
    for (i = 0; i < data.length; i++) { this.tbyte(data[i]); cs ^= data[i]; }
    this.tbyte(cs);
  };

  function petscii(name) {
    var out = [];
    String(name || "").toUpperCase().split("").forEach(function (c) {
      var k = c.charCodeAt(0);
      if (k >= 0x20 && k <= 0x5F) out.push(k);
    });
    return out.slice(0, 16);
  }

  // prg: the program with its load address; opts: name, mode ("jmp"/"run"), start
  function build(prg, opts) {
    var load = prg[0] | (prg[1] << 8), data = prg.subarray(2), end = load + data.length;
    if (load < 0x0400) throw new Error("A program for the tape loader must load at $0400 or higher.");
    if (end > 0xD000) throw new Error("A program for the tape loader must end below $D000 (it reaches " + "$" + (end - 1).toString(16).toUpperCase() + ").");
    // the KERNAL part
    var header = new Uint8Array(192), file = b64(T.file), fs = T.fileStart, fe = fs + file.length;
    header[0] = 3;                               // a program that loads to its own address
    header[1] = fs & 0xFF; header[2] = fs >> 8; header[3] = fe & 0xFF; header[4] = fe >> 8;
    var nm = petscii(opts.name);
    for (var i = 0; i < 16; i++) header[5 + i] = i < nm.length ? nm[i] : 0x20;
    header.set(b64(T.header), 21);
    var stage2 = b64(T.stage2);
    stage2[T.fields.mode] = opts.mode === "run" ? 1 : 0;
    var start = opts.start != null ? opts.start : load;
    stage2[T.fields.start] = start & 0xFF; stage2[T.fields.start + 1] = start >> 8;
    var P = new Pulses();
    P.pause(20000);
    P.kfile(header, file);
    // the turbo part: the second part of the loader, then the program
    P.pause(100000);
    P.tblock(stage2, T.stage2Start, 1500);
    P.tblock(data, load, 400);
    P.n(T0, 256);
    P.pause(200000);
    // the TAP file, version 1
    var n = P.p.length, out = new Uint8Array(20 + n);
    "C64-TAPE-RAW".split("").forEach(function (c, k) { out[k] = c.charCodeAt(0); });
    out[12] = 1;
    out[16] = n & 0xFF; out[17] = (n >> 8) & 0xFF; out[18] = (n >> 16) & 0xFF; out[19] = (n >>> 24) & 0xFF;
    out.set(P.p, 20);
    // how long it takes to load
    var cyc = 0;
    for (i = 0; i < n; i++) {
      if (P.p[i]) cyc += P.p[i] * 8;
      else { cyc += P.p[i + 1] | (P.p[i + 2] << 8) | (P.p[i + 3] << 16); i += 3; }
    }
    return { tap: out, seconds: cyc / 985248 };
  }

  global.PackerTap = { build: build };
})(typeof window !== "undefined" ? window : globalThis);
