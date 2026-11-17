/* MOS 6569 VIC-II (PAL): 63 cycles per line, 312 lines per frame.
 * Cycle-stepped model after Christian Bauer's "The MOS 6567/6569 video controller":
 * video counters, bad lines, idle/display state, sprite DMA and Y expansion,
 * border flip-flop, raster/collision interrupts. Graphics are drawn per cycle,
 * sprites and border are composited at the end of each line.
 * Output: 384 x 272 pixels (raster lines 16..287), 32-pixel left border.
 */
(function (global) {
  "use strict";

  var W = 384, H = 272, FIRST_LINE = 16;
  var LINES = 312, CYCLES = 63;

  // "Colodore" palette by Philip "Pepto" Timmermann
  var PALETTE = [0x000000, 0xFFFFFF, 0x813338, 0x75CEC8, 0x8E3C97, 0x56AC4D, 0x2E2C9B, 0xEDF171,
                 0x8E5029, 0x553800, 0xC46C71, 0x4A4A4A, 0x7B7B7B, 0xA9FF9F, 0x706DEB, 0xB2B2B2];

  // BA is low 3 cycles before and during the two sprite fetch cycles
  var BA_MASK = new Uint8Array(64);
  (function () {
    for (var n = 0; n < 8; n++) {
      for (var k = 0; k < 5; k++) {
        var c = 55 + 2 * n + k;
        if (c > 63) c -= 63;
        BA_MASK[c] |= 1 << n;
      }
    }
  })();

  function VIC(machine) {
    this.m = machine;
    this.fb = new Uint32Array(W * H);
    this.pal = new Uint32Array(16);
    this.setPalette(PALETTE);
    this.gfx = new Uint8Array(W + 32);     // color index per pixel (graphics)
    this.fg = new Uint8Array(W + 32);      // 1 = foreground graphics pixel
    this.brd = new Uint8Array(W + 32);     // border color per pixel
    this.sprCol = new Uint8Array(W + 64);
    this.sprOcc = new Uint8Array(W + 64);
    this.sprBehind = new Uint8Array(W + 64);
    this.vm = new Uint8Array(40);
    this.cm = new Uint8Array(40);
    this.cl = new Uint8Array(4);
    this.reset();
  }
  VIC.W = W; VIC.H = H; VIC.PALETTE = PALETTE;
  var P = VIC.prototype;

  P.setPalette = function (rgb) {
    for (var i = 0; i < 16; i++) {
      var c = rgb[i];
      this.pal[i] = 0xFF000000 | ((c & 0xFF) << 16) | (c & 0xFF00) | ((c >> 16) & 0xFF);
    }
  };

  P.reset = function () {
    this.regs = new Uint8Array(0x40);
    this.raster = 0;
    this.cyc = 1;
    this.rasterIrqLine = 0;
    this.irqFlags = 0;
    this.irqOut = 0;
    this.vc = 0; this.vcbase = 0; this.rc = 0; this.vmli = 0;
    this.idle = true;
    this.denLatch = false;
    this.vff = true;
    this.bad = false;
    this.ySeen = 0;       // YSCROLL as the bad line logic sees it (a CPU write counts from the next cycle)
    this.baStart = 99;    // first cycle of this line with BA low (bad line), for the DMA delay
    this.mc = new Uint8Array(8);
    this.mcbase = new Uint8Array(8);
    this.expFF = new Uint8Array([1, 1, 1, 1, 1, 1, 1, 1]);
    this.dmaMask = 0;
    this.dispMask = 0;
    this.sNext = new Uint32Array(8);
    this.sCur = new Uint32Array(8);
    this.showNext = 0;
    this.showCur = 0;
    this.sprSpr = 0; this.sprBg = 0;
    this.frameDone = false;
    this.frame = 0;
    this.rasterIrqDone = false;
    this.updatePointers();
  };

  P.updatePointers = function () {
    var r = this.regs[0x18];
    this.vmBase = (r & 0xF0) << 6;
    this.chBase = (r & 0x0E) << 10;
    this.bmBase = (r & 0x08) << 10;
  };

  // VIC memory access (14 bit address within the current bank)
  P.rd = function (a) {
    return this.m.vicRead(a & 0x3FFF);
  };

  P.updateIrq = function () {
    var lvl = (this.irqFlags & this.regs[0x1A] & 0x0F) ? 1 : 0;
    if (lvl !== this.irqOut) { this.irqOut = lvl; this.m.setIrq(2, lvl); }
  };

  P.badlineCond = function () {
    var r = this.raster;
    return r >= 0x30 && r <= 0xF7 && this.denLatch && (r & 7) === this.ySeen;
  };

  // Is the CPU stopped in the coming cycle?
  P.baNow = function () {
    var c = this.cyc;
    if (c >= 12 && c <= 54 && this.badlineCond()) return true;
    return (this.dmaMask & BA_MASK[c]) !== 0;
  };

  P.checkRasterIrq = function () {
    if (this.raster === this.rasterIrqLine) {
      if (!this.rasterIrqDone) {
        this.rasterIrqDone = true;
        this.irqFlags |= 0x01;
        this.updateIrq();
      }
    } else this.rasterIrqDone = false;
  };

  P.cycle = function () {
    var c = this.cyc, regs = this.regs, n;

    if (c === 1) {
      // new line: hand over the sprite data fetched at the end of the last line
      this.showCur = this.showNext;
      this.showNext = 0;
      for (n = 0; n < 8; n++) this.sCur[n] = this.sNext[n];
      this.checkRasterIrq();
      if (this.raster === 0x30) this.denLatch = false;
      this.baStart = 99;
    }
    if (this.raster === 0x30 && (regs[0x11] & 0x10)) this.denLatch = true;

    this.bad = this.badlineCond();
    if (this.bad && this.baStart === 99) this.baStart = c < 12 ? 12 : c;

    if (c === 12) {
      // start of the visible part: background fill
      var bg = regs[0x21] & 15;
      this.gfx.fill(bg);
      this.fg.fill(0);
    }

    if (c === 14) {
      this.vc = this.vcbase;
      this.vmli = 0;
      if (this.bad) this.rc = 0;
    } else if (c === 15) {
      for (n = 0; n < 8; n++) if (this.expFF[n]) this.mcbase[n] = (this.mcbase[n] + 2) & 0x3F;
    } else if (c === 16) {
      for (n = 0; n < 8; n++) {
        if (this.expFF[n]) this.mcbase[n] = (this.mcbase[n] + 1) & 0x3F;
        if (this.mcbase[n] === 63) { this.dmaMask &= ~(1 << n); this.dispMask &= ~(1 << n); }
      }
    } else if (c === 55 || c === 56) {
      var ye = regs[0x17], en = regs[0x15], ry = this.raster & 0xFF;
      for (n = 0; n < 8; n++) {
        var bit = 1 << n;
        if (c === 55 && (ye & bit)) this.expFF[n] ^= 1;
        if ((en & bit) && regs[n * 2 + 1] === ry && !(this.dmaMask & bit)) {
          this.dmaMask |= bit;
          this.mcbase[n] = 0;
          if (ye & bit) this.expFF[n] = 0;
        }
      }
    } else if (c === 58) {
      if (this.rc === 7) { this.idle = true; this.vcbase = this.vc; }
      if (!this.idle || this.bad) { this.idle = false; this.rc = (this.rc + 1) & 7; }
      var ry2 = this.raster & 0xFF;
      for (n = 0; n < 8; n++) {
        var b = 1 << n;
        this.mc[n] = this.mcbase[n];
        if ((this.dmaMask & b) && regs[n * 2 + 1] === ry2) this.dispMask |= b;
        if (this.dmaMask & b) {
          var ptr = this.rd(this.vmBase | 0x3F8 | n) << 6;
          var m = this.mc[n];
          this.sNext[n] = (this.rd(ptr | m) << 16) | (this.rd(ptr | ((m + 1) & 63)) << 8) | this.rd(ptr | ((m + 2) & 63));
          this.mc[n] = (m + 3) & 63;
          if (this.dispMask & b) this.showNext |= b;
        }
      }
    }

    // graphics: g-access (first phase) and c-access (second phase). A bad line that starts in
    // the middle of a line (DMA delay, "VSP") switches to display state only after this cycle's
    // g-access; its first three c-accesses come while the CPU still has the bus and read $FF
    // (the colour is the low nibble of the CPU's next opcode).
    if (c >= 16 && c <= 55) this.gAccess(c);
    if (this.bad) this.idle = false;
    if (c >= 15 && c <= 54 && this.bad) {
      if (c < this.baStart + 3) {
        this.vm[this.vmli] = 0xFF;
        this.cm[this.vmli] = this.m.ram[this.m.cpu.pc] & 15;
      } else {
        this.vm[this.vmli] = this.rd(this.vmBase | this.vc);
        this.cm[this.vmli] = this.m.colorRam[this.vc] & 15;
      }
    }

    // border color for the 8 pixels of this cycle
    if (c >= 12 && c <= 59) {
      var x0 = (c - 12) << 3, bc = regs[0x20] & 15;
      for (var i = 0; i < 8; i++) this.brd[x0 + i] = bc;
    }

    this.ySeen = regs[0x11] & 7;
    if (c === 63) {
      this.endLine();
      this.cyc = 1;
    } else this.cyc = c + 1;
  };

  P.gAccess = function (c) {
    var regs = this.regs, r11 = regs[0x11], r16 = regs[0x16];
    var ecm = r11 & 0x40, bmm = r11 & 0x20, mcm = r16 & 0x10;
    var gd, vmc = 0, col = 0;
    if (!this.idle) {
      vmc = this.vm[this.vmli];
      col = this.cm[this.vmli];
      if (bmm) gd = this.rd(this.bmBase | (this.vc << 3) | this.rc);
      else gd = this.rd(this.chBase | ((ecm ? vmc & 0x3F : vmc) << 3) | this.rc);
      this.vc = (this.vc + 1) & 0x3FF;
      this.vmli++;
    } else {
      gd = this.rd(ecm ? 0x39FF : 0x3FFF);
    }
    var x = 32 + ((c - 16) << 3) + (r16 & 7);
    var gfx = this.gfx, fg = this.fg, i, bit, p;
    var b0 = regs[0x21] & 15;
    if (c === 16) { for (i = 32; i < x; i++) { gfx[i] = b0; fg[i] = 0; } }
    var mode = (ecm ? 4 : 0) | (bmm ? 2 : 0) | (mcm ? 1 : 0);
    switch (mode) {
      case 0: // standard text
        for (i = 0; i < 8; i++) {
          bit = (gd >> (7 - i)) & 1;
          gfx[x + i] = bit ? col : b0; fg[x + i] = bit;
        }
        break;
      case 1: // multicolor text
        if (col & 8) {
          var cl = this.cl; cl[0] = b0; cl[1] = regs[0x22] & 15; cl[2] = regs[0x23] & 15; cl[3] = col & 7;
          for (i = 0; i < 8; i += 2) {
            p = (gd >> (6 - i)) & 3;
            gfx[x + i] = gfx[x + i + 1] = cl[p];
            fg[x + i] = fg[x + i + 1] = p >> 1;
          }
        } else {
          for (i = 0; i < 8; i++) {
            bit = (gd >> (7 - i)) & 1;
            gfx[x + i] = bit ? col : b0; fg[x + i] = bit;
          }
        }
        break;
      case 2: // standard bitmap
        var c1 = vmc >> 4, c0 = vmc & 15;
        for (i = 0; i < 8; i++) {
          bit = (gd >> (7 - i)) & 1;
          gfx[x + i] = bit ? c1 : c0; fg[x + i] = bit;
        }
        break;
      case 3: // multicolor bitmap
        var cb = this.cl; cb[0] = b0; cb[1] = vmc >> 4; cb[2] = vmc & 15; cb[3] = col;
        for (i = 0; i < 8; i += 2) {
          p = (gd >> (6 - i)) & 3;
          gfx[x + i] = gfx[x + i + 1] = cb[p];
          fg[x + i] = fg[x + i + 1] = p >> 1;
        }
        break;
      case 4: // extended background color text
        var eb = regs[0x21 + (vmc >> 6)] & 15;
        for (i = 0; i < 8; i++) {
          bit = (gd >> (7 - i)) & 1;
          gfx[x + i] = bit ? col : eb; fg[x + i] = bit;
        }
        break;
      default: // invalid modes: black, but foreground still counts for collisions
        if (mode === 5 && (col & 8)) {
          for (i = 0; i < 8; i += 2) { p = (gd >> (6 - i)) & 3; gfx[x + i] = gfx[x + i + 1] = 0; fg[x + i] = fg[x + i + 1] = p >> 1; }
        } else if (mode === 7) {
          for (i = 0; i < 8; i += 2) { p = (gd >> (6 - i)) & 3; gfx[x + i] = gfx[x + i + 1] = 0; fg[x + i] = fg[x + i + 1] = p >> 1; }
        } else {
          for (i = 0; i < 8; i++) { gfx[x + i] = 0; fg[x + i] = (gd >> (7 - i)) & 1; }
        }
    }
  };

  P.drawSprites = function () {
    var regs = this.regs, show = this.showCur;
    if (!show) return false;
    var col = this.sprCol, occ = this.sprOcc, beh = this.sprBehind, fg = this.fg;
    col.fill(255); occ.fill(0);
    var mc = regs[0x1C], xe = regs[0x1D], pri = regs[0x1B], msb = regs[0x10];
    var mc0 = regs[0x25] & 15, mc1 = regs[0x26] & 15;
    var bgHit = 0;
    for (var n = 0; n < 8; n++) {
      var bit = 1 << n;
      if (!(show & bit)) continue;
      var data = this.sCur[n];
      if (!data) continue;
      var sx = regs[n * 2] | ((msb & bit) ? 0x100 : 0);
      if (sx >= 0x1F8) sx -= 504;
      var px = sx + 8;
      var w = (xe & bit) ? 2 : 1;
      var own = regs[0x27 + n] & 15, behind = (pri & bit) ? 1 : 0;
      var i, k, p, c, x;
      if (mc & bit) {
        for (i = 0; i < 12; i++) {
          p = (data >> (22 - 2 * i)) & 3;
          if (!p) continue;
          c = p === 1 ? mc0 : p === 2 ? own : mc1;
          for (k = 0; k < 2 * w; k++) {
            x = px + i * 2 * w + k;
            if (x < 0 || x >= W) continue;
            occ[x] |= bit;
            if (col[x] === 255) { col[x] = c; beh[x] = behind; }
            if (fg[x]) bgHit |= bit;
          }
        }
      } else {
        for (i = 0; i < 24; i++) {
          if (!((data >> (23 - i)) & 1)) continue;
          for (k = 0; k < w; k++) {
            x = px + i * w + k;
            if (x < 0 || x >= W) continue;
            occ[x] |= bit;
            if (col[x] === 255) { col[x] = own; beh[x] = behind; }
            if (fg[x]) bgHit |= bit;
          }
        }
      }
    }
    // collisions
    var ss = 0;
    for (var x2 = 0; x2 < W; x2++) {
      var o = occ[x2];
      if (o & (o - 1)) ss |= o;
    }
    if (ss) {
      if (!this.sprSpr) { this.irqFlags |= 0x04; this.updateIrq(); }
      this.sprSpr |= ss;
    }
    if (bgHit) {
      if (!this.sprBg) { this.irqFlags |= 0x02; this.updateIrq(); }
      this.sprBg |= bgHit;
    }
    return true;
  };

  P.endLine = function () {
    var regs = this.regs, r = this.raster;
    // vertical border flip-flop
    var rsel = regs[0x11] & 0x08;
    if (r === (rsel ? 251 : 247)) this.vff = true;
    if (r === (rsel ? 51 : 55) && (regs[0x11] & 0x10)) this.vff = false;

    if (r >= FIRST_LINE && r < FIRST_LINE + H) {
      var spr = this.drawSprites();
      var fb = this.fb, pal = this.pal, off = (r - FIRST_LINE) * W;
      var gfx = this.gfx, fg = this.fg, brd = this.brd, sc = this.sprCol, sb = this.sprBehind;
      var csel = regs[0x16] & 0x08;
      var lx = csel ? 32 : 39, rx = csel ? 352 : 343;
      var vff = this.vff;
      for (var x = 0; x < W; x++) {
        var ci;
        if (vff || x < lx || x >= rx) ci = brd[x];
        else {
          ci = gfx[x];
          if (spr) { var s = sc[x]; if (s !== 255 && !(sb[x] && fg[x])) ci = s; }
        }
        fb[off + x] = pal[ci];
      }
    } else if (this.showCur) {
      this.drawSprites();     // collisions also happen outside the visible area
    }

    r++;
    if (r === LINES) {
      r = 0;
      this.vcbase = 0;
      this.frameDone = true;
      this.frame++;
    }
    this.raster = r;
  };

  P.read = function (a) {
    a &= 0x3F;
    var regs = this.regs, v;
    switch (a) {
      case 0x11: return (regs[0x11] & 0x7F) | ((this.raster & 0x100) >> 1);
      case 0x12: return this.raster & 0xFF;
      case 0x13: case 0x14: return 0;
      case 0x16: return regs[0x16] | 0xC0;
      case 0x18: return regs[0x18] | 0x01;
      case 0x19: return this.irqFlags | 0x70 | (this.irqOut ? 0x80 : 0);
      case 0x1A: return regs[0x1A] | 0xF0;
      case 0x1E: v = this.sprSpr; this.sprSpr = 0; return v;
      case 0x1F: v = this.sprBg; this.sprBg = 0; return v;
    }
    if (a >= 0x20 && a <= 0x2E) return regs[a] | 0xF0;
    if (a >= 0x2F) return 0xFF;
    return regs[a];
  };

  P.write = function (a, v) {
    a &= 0x3F;
    var regs = this.regs;
    switch (a) {
      case 0x11:
        regs[0x11] = v;
        this.rasterIrqLine = (this.rasterIrqLine & 0xFF) | ((v & 0x80) << 1);
        this.checkRasterIrq();
        return;
      case 0x12:
        this.rasterIrqLine = (this.rasterIrqLine & 0x100) | v;
        this.checkRasterIrq();
        return;
      case 0x17:
        for (var n = 0; n < 8; n++) if (!(v & (1 << n))) this.expFF[n] = 1;
        regs[0x17] = v;
        return;
      case 0x18: regs[0x18] = v; this.updatePointers(); return;
      case 0x19: this.irqFlags &= ~v & 0x0F; this.updateIrq(); return;
      case 0x1A: regs[0x1A] = v & 0x0F; this.updateIrq(); return;
      case 0x1E: case 0x1F: return;
    }
    if (a < 0x2F) regs[a] = v;
  };

  P.saveState = function () {
    return {
      regs: Array.from(this.regs), raster: this.raster, cyc: this.cyc, rasterIrqLine: this.rasterIrqLine,
      irqFlags: this.irqFlags, irqOut: this.irqOut, vc: this.vc, vcbase: this.vcbase, rc: this.rc, vmli: this.vmli,
      idle: this.idle, denLatch: this.denLatch, vff: this.vff, mc: Array.from(this.mc), mcbase: Array.from(this.mcbase),
      expFF: Array.from(this.expFF), dmaMask: this.dmaMask, dispMask: this.dispMask,
      sNext: Array.from(this.sNext), sCur: Array.from(this.sCur), showNext: this.showNext, showCur: this.showCur,
      sprSpr: this.sprSpr, sprBg: this.sprBg, vm: Array.from(this.vm), cm: Array.from(this.cm), rasterIrqDone: this.rasterIrqDone,
      ySeen: this.ySeen, baStart: this.baStart
    };
  };
  P.loadState = function (o) {
    var self = this;
    ["raster", "cyc", "rasterIrqLine", "irqFlags", "irqOut", "vc", "vcbase", "rc", "vmli", "idle", "denLatch", "vff",
     "dmaMask", "dispMask", "showNext", "showCur", "sprSpr", "sprBg", "rasterIrqDone"].forEach(function (k) { self[k] = o[k]; });
    this.regs.set(o.regs); this.mc.set(o.mc); this.mcbase.set(o.mcbase); this.expFF.set(o.expFF);
    this.sNext.set(o.sNext); this.sCur.set(o.sCur); this.vm.set(o.vm); this.cm.set(o.cm);
    this.ySeen = o.ySeen !== undefined ? o.ySeen : this.regs[0x11] & 7;
    this.baStart = o.baStart !== undefined ? o.baStart : 99;
    this.updatePointers();
  };

  global.VIC6569 = VIC;
})(typeof window !== "undefined" ? window : globalThis);
