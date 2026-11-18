/* C64 Packer: reading a program, packing it and making the files */
(function (global) {
  "use strict";

  var TS = global.TSCrunch, EXO = global.Exomizer, SFX = global.PackerSFX;
  function b64(s) {
    var b = typeof atob === "function" ? atob(s) : Buffer.from(s, "base64").toString("binary");
    var a = new Uint8Array(b.length);
    for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
    return a;
  }
  function hex(v, n) { return "$" + ("000" + v.toString(16).toUpperCase()).slice(-(n || 4)); }

  // ---------------------------------------------------------------- the program
  // A PRG: load address and data; a BASIC program at $0801 that is only a SYS line gives
  // the address to start (machine code behind a BASIC line).
  function analyse(prg, name) {
    if (prg.length < 3) throw new Error("This file is too short for a C64 program.");
    var load = prg[0] | (prg[1] << 8), data = prg.subarray(2), end = load + data.length;
    if (end > 0x10000) throw new Error("The program runs past the end of the C64 memory.");
    var info = { name: name || "", load: load, end: end, data: data, basic: false, sys: null, lines: 0 };
    if (load === 0x0801 && data.length > 6) {
      // walk the BASIC lines
      var p = 0, ok = true, lines = 0, text = "";
      while (p + 4 <= data.length) {
        var next = data[p] | (data[p + 1] << 8);
        if (next === 0) break;
        if (next <= load + p || next > end) { ok = false; break; }
        var q = p + 4, t = "";
        while (q < data.length && data[q]) { t += String.fromCharCode(data[q]); q++; }
        if (!lines) text = t;
        lines++;
        p = next - load;
      }
      if (ok && lines) {
        info.basic = true; info.lines = lines; info.basicEnd = load + p + 2;
        // 10 SYS 2061 (token $9E), perhaps with spaces or brackets
        var m = /^\x9e\s*\(?\s*(\d{1,5})/.exec(text);
        if (m && lines === 1) {
          var a = +m[1];
          if (a >= load && a < end) info.sys = a;
        }
      }
    }
    return info;
  }

  // ---------------------------------------------------------------- safety of unpacking in place
  // Forward unpacking with the packed data placed at pk and the output at dst: an output
  // byte must never land on packed data that is still to be read. For every item, c0 bytes
  // have been read when it starts. Returns the lowest pk that is safe.
  function safePlace(items, dst) {
    var need = 0;
    items.forEach(function (it) {
      var last = it.lit ? it.o : it.o + it.len - 1;          // literals read as they write
      need = Math.max(need, dst + last - it.c0 + 1);
    });
    return need + 2;
  }
  function traceTS(p, zeroRun) {
    var i = 0, o = 0, items = [];
    for (;;) {
      var c0 = i, b = p[i++];
      if (b < 0x80) {
        if (b < 0x20) { items.push({ o: o, len: b, c0: c0, lit: true }); o += b; i += b; }
        else if (b === 0x20) break;
        else { items.push({ o: o, len: 2, c0: c0 }); o += 2; }
      } else if (b & 1) {
        var n = b === 0x81 ? zeroRun : ((b >> 1) & 0x3F) + 1;
        if (b !== 0x81) i++;
        items.push({ o: o, len: n, c0: c0 }); o += n;
      } else {
        var len;
        if (b & 2) { len = ((b >> 2) & 0x1F) + 1; i++; }
        else { len = ((((b >> 2) & 0x1F) << 1) | (p[i + 1] >> 7)) + 1; i += 2; }
        items.push({ o: o, len: len, c0: c0 }); o += len;
      }
    }
    return items;
  }
  // the Exomizer stream, read again to see where each item starts
  function traceExo(p, size) {
    // a decoder that counts: reuse the real one with a byte hook
    var items = [], pos = { v: 0 }, out = 0;
    var dec = EXO.unpack(p, 39, function (kind, len, read) { items.push({ o: out, len: len, c0: read, lit: kind === "lit" }); out += len; });
    if (dec.length !== size) throw new Error("Check failed: the packed data does not unpack right.");
    return items;
  }

  // ---------------------------------------------------------------- packing
  // opts: format ("tscrunch" or "exomizer"), mode ("jmp" or "run"), start, blank
  function sfx(info, opts) {
    var fmt = opts.format, S = SFX[fmt], code = b64(S.code), F = 0x0801 + code.length - 2;
    var data = info.data, dst = info.load, end = info.end;
    if (dst < 0x0200) throw new Error("Programs that load below $0200 cannot be packed (the unpacker needs the stack).");
    if (end > S.top) throw new Error("The program reaches " + hex(end - 1) + ": the unpacker needs " + hex(S.top) + "–" + hex(S.iend - 1) + ".");
    var p = opts.packed || packOnly(info, fmt, opts.effort);
    var packed = p.data, items = p.items, zeroRun = p.zeroRun;
    var len = packed.length, pk = S.top - len, minPk = safePlace(items, dst);
    if (pk < minPk) throw new Error("The packed program does not fit below the unpacker: " + (minPk - pk) + " bytes too many.");
    if (pk < F) throw new Error("The packed program is too long to be moved up in the memory.");
    var pages = (len + 255) >> 8;
    if (pages > 255) throw new Error("The packed program is too long.");
    var f = S.fields, out = new Uint8Array(code.length + len);
    out.set(code); out.set(packed, code.length);
    function w(field, v) { out[f[field]] = v & 0xFF; }
    var srcLast = F + len - 256, dstLast = pk + len - 256;
    w("sl", srcLast); w("sh", srcLast >> 8); w("tl", dstLast); w("th", dstLast >> 8);
    w("pages", pages);
    w("srcl", pk); w("srch", pk >> 8); w("dstl", dst); w("dsth", dst >> 8);
    w("blank", opts.blank ? 0x0B : 0x1B);
    w("mode", opts.mode === "run" ? 1 : 0);
    var start = opts.start != null ? opts.start : dst;
    w("startl", start); w("starth", start >> 8);
    w("endl", end); w("endh", end >> 8);
    if (fmt === "tscrunch") w("zero", zeroRun - 1);
    return {
      prg: out, packed: packed, zeroRun: zeroRun, format: fmt, blank: !!opts.blank,
      size: out.length, packedSize: len, placed: pk, safe: minPk, unpackerAt: S.top, unpackerEnd: S.iend
    };
  }
  // the packed data alone, checked: { data, zeroRun, items } (reusable for other start options)
  function packOnly(info, fmt, effort) {
    var data = info.data, packed, items, zeroRun = 0;
    if (fmt === "tscrunch") {
      var r = TS.pack(data, false);
      packed = r.data; zeroRun = r.zeroRun;
      if (!eq(TS.unpack(packed, zeroRun), data)) throw new Error("Check failed: the packed data does not unpack right.");
      items = traceTS(packed, zeroRun);
    } else {
      packed = EXO.pack(data, 39, { maxChain: effort || 256 });
      items = traceExo(packed, data.length);
      if (!eq(EXO.unpack(packed, 39), data)) throw new Error("Check failed: the packed data does not unpack right.");
    }
    return { data: packed, zeroRun: zeroRun, items: items };
  }
  function eq(a, b) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  // raw packed data for own programs
  function raw(info, format) {
    var d = info.data;
    if (format === "tscrunch") return TS.pack(d, true).data;                 // tscrunch -p
    if (format === "exo-forward") return EXO.pack(d, 39);                     // exomizer raw
    // exomizer raw -b: unpacked from the end backwards
    var rev = d.slice().reverse();
    return EXO.pack(rev, 39).slice().reverse();
  }

  // Run the packed program on a 6502 with plain RAM: the time the unpacking takes, and a
  // check that the unpacker really gives back the program
  function measure(res, info) {
    var ram = new Uint8Array(0x10000), done = false;
    ram.set(res.prg.subarray(2), 0x0801);
    var cpu = new global.CPU6502({
      read: function (a) { return ram[a]; },
      write: function (a, v) { ram[a] = v; if (a === 1 && v === 0x35) done = true; }
    });
    cpu.pc = 0x080D; cpu.sp = 0xF0; cpu.i = 1;
    var cycles = 0, limit = 60 * 985248;
    while (!done && cycles < limit) cycles += cpu.step();
    if (!done) throw new Error("Check failed: the unpacker did not finish.");
    var d = info.data;
    for (var i = 0; i < d.length; i++) if (ram[info.load + i] !== d[i]) throw new Error("Check failed: the unpacker gives a different program (at " + hex(info.load + i) + ").");
    // with the screen on, the VIC takes about 6 % of the cycles
    return { cycles: cycles, seconds: cycles / 985248 * (res.blank ? 1 : 1.06) };
  }

  global.Packer = { analyse: analyse, sfx: sfx, packOnly: packOnly, raw: raw, measure: measure, hex: hex, eq: eq };
})(typeof window !== "undefined" ? window : globalThis);
