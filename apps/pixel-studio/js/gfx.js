/* C64 Pixel Studio: C64 colours and pixel formats (sprites, characters, bitmaps). */
(function (global) {
  "use strict";

  // the colours of the C64 Emulator on this site (Colodore)
  var PALETTE = [0x000000, 0xFFFFFF, 0x813338, 0x75CEC8, 0x8E3C97, 0x56AC4D, 0x2E2C9B, 0xEDF171,
                 0x8E5029, 0x553800, 0xC46C71, 0x4A4A4A, 0x7B7B7B, 0xA9FF9F, 0x706DEB, 0xB2B2B2];
  var NAMES = ["black", "white", "red", "cyan", "purple", "green", "blue", "yellow", "orange", "brown",
               "light red", "dark grey", "grey", "light green", "light blue", "light grey"];
  var RGB = PALETTE.map(function (v) { return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; });
  var CSS = PALETTE.map(function (v) { return "#" + ("00000" + v.toString(16)).slice(-6); });

  // ---------------------------------------------------------------- bit-mapped pixels
  // rows of bpr bytes; hires: 1 bit per pixel, mc: 2 bits per (double-wide) pixel
  function getPx(buf, off, bpr, x, y, mc) {
    var b = buf[off + y * bpr + (mc ? x >> 2 : x >> 3)];
    return mc ? (b >> (6 - (x & 3) * 2)) & 3 : (b >> (7 - (x & 7))) & 1;
  }
  function setPx(buf, off, bpr, x, y, mc, v) {
    var i = off + y * bpr + (mc ? x >> 2 : x >> 3);
    if (mc) { var s = 6 - (x & 3) * 2; buf[i] = (buf[i] & ~(3 << s)) | ((v & 3) << s); }
    else { var m = 0x80 >> (x & 7); buf[i] = v ? buf[i] | m : buf[i] & ~m; }
  }

  // Sprite colours of one sprite: slot -> colour index (null: transparent)
  function spriteSlots(spr, colors) {
    return spr.mc ? [null, colors.sprMc1, spr.col, colors.sprMc2] : [null, spr.col];
  }
  // Character colours: mc is used only for colours 8-15, like on the C64
  function charSlots(col, colors, mcMode) {
    var mc = mcMode && col >= 8;
    return { mc: mc, slots: mc ? [colors.bg, colors.chrMc1, colors.chrMc2, col & 7] : [colors.bg, col] };
  }

  // Draw into RGBA pixels: (ox, oy) in image pixels, sx/sy pixel size of one hires pixel
  function put(px, w, x, y, c, sx, sy) {
    var rgb = RGB[c];
    for (var dy = 0; dy < sy; dy++) {
      var o = ((y + dy) * w + x) * 4;
      for (var dx = 0; dx < sx; dx++, o += 4) { px[o] = rgb[0]; px[o + 1] = rgb[1]; px[o + 2] = rgb[2]; px[o + 3] = 255; }
    }
  }
  function drawSprite(img, ox, oy, spr, colors, sx, sy, bg) {
    var w = img.width, px = img.data, slots = spriteSlots(spr, colors), mc = spr.mc;
    var ex = spr.xe ? 2 : 1, ey = spr.ye ? 2 : 1;
    for (var y = 0; y < 21; y++) {
      for (var x = 0; x < (mc ? 12 : 24); x++) {
        var c = slots[getPx(spr.data, 0, 3, x, y, mc)];
        if (c == null) c = bg;
        if (c == null) continue;
        var pw = (mc ? 2 : 1) * sx * ex, X = ox + x * pw, Y = oy + y * sy * ey;
        if (X < 0 || Y < 0 || X + pw > w || Y + sy * ey > img.height) continue;
        put(px, w, X, Y, c, pw, sy * ey);
      }
    }
  }
  function drawChar(img, ox, oy, chars, code, col, colors, mcMode, s) {
    var w = img.width, px = img.data, cs = charSlots(col, colors, mcMode), mc = cs.mc;
    for (var y = 0; y < 8; y++) {
      for (var x = 0; x < (mc ? 4 : 8); x++) {
        var c = cs.slots[getPx(chars, code * 8, 1, x, y, mc)];
        put(px, w, ox + x * (mc ? 2 : 1) * s, oy + y * s, c, (mc ? 2 : 1) * s, s);
      }
    }
  }
  function newImage(w, h) {
    if (typeof ImageData !== "undefined") return new ImageData(w, h);
    return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) };
  }

  // ---------------------------------------------------------------- bitmaps
  // bitmap: { mc, bg, border, bitmap(8000), screen(1000), color(1000) }
  // mc: 160x200, cell 4x8: 00 bg, 01 screen high nibble, 10 screen low nibble, 11 colour RAM
  // hires: 320x200, cell 8x8: 1 screen high nibble, 0 screen low nibble
  function bmWidth(bm) { return bm.mc ? 160 : 320; }
  function bmCell(bm, x, y) { return (y >> 3) * 40 + (bm.mc ? x >> 2 : x >> 3); }
  function bmBits(bm, x, y) {
    var b = bm.bitmap[bmCell(bm, x, y) * 8 + (y & 7)];
    return bm.mc ? (b >> (6 - (x & 3) * 2)) & 3 : (b >> (7 - (x & 7))) & 1;
  }
  function bmSlotColour(bm, cell, slot) {
    if (bm.mc) return slot === 0 ? bm.bg : slot === 1 ? bm.screen[cell] >> 4 : slot === 2 ? bm.screen[cell] & 15 : bm.color[cell] & 15;
    return slot ? bm.screen[cell] >> 4 : bm.screen[cell] & 15;
  }
  function bmGet(bm, x, y) { return bmSlotColour(bm, bmCell(bm, x, y), bmBits(bm, x, y)); }
  function bmSetBits(bm, x, y, v) {
    var i = bmCell(bm, x, y) * 8 + (y & 7);
    if (bm.mc) { var s = 6 - (x & 3) * 2; bm.bitmap[i] = (bm.bitmap[i] & ~(3 << s)) | (v << s); }
    else { var m = 0x80 >> (x & 7); bm.bitmap[i] = v ? bm.bitmap[i] | m : bm.bitmap[i] & ~m; }
  }
  function bmSetSlot(bm, cell, slot, c) {
    if (bm.mc) {
      if (slot === 1) bm.screen[cell] = (bm.screen[cell] & 0x0F) | (c << 4);
      else if (slot === 2) bm.screen[cell] = (bm.screen[cell] & 0xF0) | c;
      else if (slot === 3) bm.color[cell] = c;
    } else if (slot) bm.screen[cell] = (bm.screen[cell] & 0x0F) | (c << 4);
    else bm.screen[cell] = (bm.screen[cell] & 0xF0) | c;
  }
  // How often each slot is used in a cell
  function bmUsage(bm, cell) {
    var n = [0, 0, 0, 0], cx = cell % 40, cy = (cell / 40) | 0, w = bm.mc ? 4 : 8;
    for (var y = 0; y < 8; y++) for (var x = 0; x < w; x++) n[bmBits(bm, cx * w + x, cy * 8 + y)]++;
    return n;
  }
  // Paint one pixel in a C64 colour, keeping the colour limits of the cell: a colour of the
  // cell is used as it is, else a free slot of the cell takes it, else the slot used least
  // changes its colour (the C64 "colour clash"). Returns true when other pixels changed too.
  function bmPaint(bm, x, y, c) {
    var cell = bmCell(bm, x, y), slots = bm.mc ? [0, 1, 2, 3] : [1, 0];
    for (var i = 0; i < slots.length; i++) {
      if (bmSlotColour(bm, cell, slots[i]) === c && !(bm.mc && slots[i] === 0 && c !== bm.bg)) { bmSetBits(bm, x, y, slots[i]); return false; }
    }
    if (bm.mc && c === bm.bg) { bmSetBits(bm, x, y, 0); return false; }
    var use = bmUsage(bm, cell), own = bmBits(bm, x, y);
    var free = -1, least = -1;
    var cand = bm.mc ? [1, 2, 3] : [1, 0];
    for (var j = 0; j < cand.length; j++) {
      var s = cand[j];
      if (!use[s] || (use[s] === 1 && own === s)) { free = s; break; }
      if (least < 0 || use[s] < use[least]) least = s;
    }
    var slot = free >= 0 ? free : least;
    bmSetSlot(bm, cell, slot, c);
    bmSetBits(bm, x, y, slot);
    return free < 0;
  }
  function drawBitmap(img, bm, sx, sy, x0, y0, w, h) {
    var px = img.data, iw = img.width, pw = bm.mc ? 2 : 1;
    x0 = x0 || 0; y0 = y0 || 0; w = w || bmWidth(bm); h = h || 200;
    for (var y = y0; y < y0 + h; y++) for (var x = x0; x < x0 + w; x++) put(px, iw, (x - x0) * pw * sx, (y - y0) * sy, bmGet(bm, x, y), pw * sx, sy);
  }

  // Nearest C64 colour to an RGB value (weighted distance)
  function nearest(r, g, b) {
    var best = 0, bd = 1e9;
    for (var i = 0; i < 16; i++) {
      var c = RGB[i], dr = r - c[0], dg = g - c[1], db = b - c[2];
      var d = dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11;
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }

  global.C64G = {
    PALETTE: PALETTE, NAMES: NAMES, RGB: RGB, CSS: CSS,
    getPx: getPx, setPx: setPx, spriteSlots: spriteSlots, charSlots: charSlots,
    put: put, drawSprite: drawSprite, drawChar: drawChar, newImage: newImage,
    bmWidth: bmWidth, bmCell: bmCell, bmBits: bmBits, bmGet: bmGet, bmSetBits: bmSetBits, bmSetSlot: bmSetSlot,
    bmSlotColour: bmSlotColour, bmUsage: bmUsage, bmPaint: bmPaint, drawBitmap: drawBitmap, nearest: nearest
  };
})(typeof window !== "undefined" ? window : globalThis);
