/* C64 Pixel Studio: reading and writing C64 file formats.
 * Sprites: raw (64 bytes each, byte 63 = colour and multicolour as in SpritePad),
 * SpritePad 1.x (.spd). Characters: raw or with load address (.64c), colours.
 * Tiles and maps: raw bytes. Bitmaps: Koala Painter (multicolour), Art Studio (hires).
 * Everything also as assembler source (.byte lines). */
(function (global) {
  "use strict";

  var M = global.PSModel;
  function hex(v, n) { return ("000" + v.toString(16).toUpperCase()).slice(-n); }

  function withLoad(addr, data) {
    var out = new Uint8Array(data.length + 2);
    out[0] = addr & 0xFF; out[1] = addr >> 8; out.set(data, 2);
    return out;
  }
  function concat(list) {
    var n = 0; list.forEach(function (a) { n += a.length; });
    var out = new Uint8Array(n), o = 0;
    list.forEach(function (a) { out.set(a, o); o += a.length; });
    return out;
  }

  // ---------------------------------------------------------------- sprites
  function spriteBytes(s) {
    var d = new Uint8Array(64);
    d.set(s.data.subarray(0, 63));
    d[63] = (s.col & 15) | (s.mc ? 0x80 : 0);
    return d;
  }
  function spritesRaw(sprites) { return concat(sprites.map(spriteBytes)); }
  function spritesFromRaw(bytes) {
    var out = [];
    for (var o = 0; o + 63 <= bytes.length; o += 64) {
      var s = M.newSprite("sprite " + out.length);
      s.data.set(bytes.subarray(o, o + 63));
      var a = o + 63 < bytes.length ? bytes[o + 63] : 1;
      s.col = a & 15 || 1; s.mc = !!(a & 0x80);
      out.push(s);
    }
    return out;
  }
  // SpritePad 1.x: "SPD", version 1, sprites-1, animations-1, background, mc1, mc2, sprites, animations
  function spdWrite(p) {
    var n = Math.min(256, p.sprites.length);
    var head = new Uint8Array([0x53, 0x50, 0x44, 1, n - 1, 0, p.colors.bg, p.colors.sprMc1, p.colors.sprMc2]);
    var anim = new Uint8Array([0, 0, 8, 0]);     // one animation entry: start 0, end 0, timer 8, flags 0
    return concat([head, spritesRaw(p.sprites.slice(0, n)), anim]);
  }
  function spdRead(bytes) {
    if (bytes[0] !== 0x53 || bytes[1] !== 0x50 || bytes[2] !== 0x44) throw new Error("This is not a SpritePad file.");
    if (bytes[3] !== 1) throw new Error("This SpritePad file has version " + bytes[3] + ". Only SpritePad 1.x files (version 1) can be read; save it in the 1.x format or as raw sprites.");
    var n = bytes[4] + 1, na = bytes[5] + 1;
    var sprites = spritesFromRaw(bytes.subarray(9, 9 + n * 64));
    var a = 9 + n * 64, objects = [];
    if (bytes.length >= a + na * 4) {
      for (var i = 0; i < na; i++) {
        var st = bytes[a + i], en = bytes[a + na + i], timer = bytes[a + 2 * na + i];
        if (en < st || en >= sprites.length || (na === 1 && st === en)) continue;
        var frames = [];
        for (var f = st; f <= en; f++) frames.push({ layers: [{ s: f, x: 0, y: 0 }] });
        objects.push({ name: "animation " + (objects.length + 1), speed: Math.max(1, timer || 8), frames: frames });
      }
    }
    return { sprites: sprites, objects: objects, colors: { bg: bytes[6] & 15, sprMc1: bytes[7] & 15, sprMc2: bytes[8] & 15 } };
  }

  // ---------------------------------------------------------------- tiles and map
  function tilesRaw(p) { return concat(p.tiles); }
  function mapRaw(p) {
    if (p.tiles.length <= 256) return Uint8Array.from(p.map.cells);
    var out = new Uint8Array(p.map.cells.length * 2);
    for (var i = 0; i < p.map.cells.length; i++) { out[i * 2] = p.map.cells[i] & 0xFF; out[i * 2 + 1] = p.map.cells[i] >> 8; }
    return out;
  }
  // the map as screen codes and as colours (one byte per character)
  function mapExpanded(p) {
    var tw = p.tileW, th = p.tileH, W = p.map.w * tw, H = p.map.h * th;
    var chars = new Uint8Array(W * H), cols = new Uint8Array(W * H);
    for (var my = 0; my < p.map.h; my++) for (var mx = 0; mx < p.map.w; mx++) {
      var t = p.tiles[p.map.cells[my * p.map.w + mx]] || p.tiles[0];
      for (var y = 0; y < th; y++) for (var x = 0; x < tw; x++) {
        var c = t[y * tw + x], o = (my * th + y) * W + mx * tw + x;
        chars[o] = c; cols[o] = p.charCols[c];
      }
    }
    return { w: W, h: H, chars: chars, cols: cols };
  }

  // ---------------------------------------------------------------- bitmaps
  function koalaWrite(bm) {
    var d = new Uint8Array(10001);
    d.set(bm.bitmap, 0); d.set(bm.screen, 8000); d.set(bm.color, 9000); d[10000] = bm.bg;
    return withLoad(0x6000, d);
  }
  function artStudioWrite(bm) {
    var d = new Uint8Array(9007);
    d.set(bm.bitmap, 0); d.set(bm.screen, 8000); d[9000] = bm.border;
    return withLoad(0x2000, d);
  }
  // Read a bitmap file: Koala (10003 / 10001 bytes), Art Studio (9009 / 9002 bytes)
  function bitmapRead(bytes, name) {
    var n = bytes.length, bm;
    if (n === 10003 || n === 10001 || n === 10006) {
      var o = n === 10001 ? 0 : 2;
      bm = M.newBitmap(true);
      bm.bitmap.set(bytes.subarray(o, o + 8000)); bm.screen.set(bytes.subarray(o + 8000, o + 9000));
      bm.color.set(bytes.subarray(o + 9000, o + 10000)); bm.bg = bytes[o + 10000] & 15;
      for (var i = 0; i < 1000; i++) bm.color[i] &= 15;
      return bm;
    }
    if (n === 9009 || n === 9002 || n === 9003) {
      bm = M.newBitmap(false);
      bm.bitmap.set(bytes.subarray(2, 8002)); bm.screen.set(bytes.subarray(8002, 9002));
      if (n > 9002) bm.border = bytes[9002] & 15;
      return bm;
    }
    throw new Error((name || "The file") + " is not a Koala Painter (10003 bytes) or Art Studio (9009 bytes) picture.");
  }

  // ---------------------------------------------------------------- assembler source
  function asmBytes(label, bytes, perLine, comment) {
    perLine = perLine || 16;
    var out = [];
    if (comment) out.push("; " + comment);
    out.push(label + ":");
    for (var i = 0; i < bytes.length; i += perLine) {
      var row = [];
      for (var j = i; j < Math.min(bytes.length, i + perLine); j++) row.push("$" + hex(bytes[j], 2));
      out.push("        .byte " + row.join(","));
    }
    return out.join("\n") + "\n";
  }
  function asmSprites(p) {
    var out = ["; " + p.sprites.length + " sprites, 64 bytes each (byte 63: colour, bit 7 multicolour)",
      "; multicolour 1 ($D025): " + p.colors.sprMc1 + ", multicolour 2 ($D026): " + p.colors.sprMc2, ""];
    p.sprites.forEach(function (s, i) {
      out.push(asmBytes("sprite_" + i, spriteBytes(s), 3, (s.name || "sprite " + i) + (s.mc ? ", multicolour" : ", hires") + ", colour " + s.col));
    });
    return out.join("\n");
  }
  function asmObjects(p) {
    var out = ["; objects: for every frame the number of layers, then sprite number, X and Y offset per layer", ""];
    p.objects.forEach(function (o, i) {
      var label = "object_" + i;
      out.push("; " + (o.name || label) + ": " + o.frames.length + " frames, " + o.speed + " screen frames each");
      out.push(label + "_frames = " + o.frames.length);
      out.push(label + "_speed = " + o.speed);
      o.frames.forEach(function (f, k) {
        var b = [f.layers.length];
        f.layers.forEach(function (l) { b.push(l.s & 0xFF, l.x & 0xFF, l.y & 0xFF); });
        out.push(asmBytes(label + "_frame_" + k, Uint8Array.from(b), 16).trimEnd());
      });
      out.push("");
    });
    return out.join("\n");
  }

  global.PSFormats = {
    hex: hex, withLoad: withLoad, concat: concat,
    spriteBytes: spriteBytes, spritesRaw: spritesRaw, spritesFromRaw: spritesFromRaw, spdWrite: spdWrite, spdRead: spdRead,
    tilesRaw: tilesRaw, mapRaw: mapRaw, mapExpanded: mapExpanded,
    koalaWrite: koalaWrite, artStudioWrite: artStudioWrite, bitmapRead: bitmapRead,
    asmBytes: asmBytes, asmSprites: asmSprites, asmObjects: asmObjects
  };
})(typeof window !== "undefined" ? window : globalThis);
