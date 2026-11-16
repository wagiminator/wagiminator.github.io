/* Cartridges from CRT images. Supported hardware types:
 * 0 normal 8K/16K/Ultimax, 4 Simons' BASIC, 5 Ocean, 7 Fun Play/Power Play, 8 Super Games,
 * 10 Epyx FastLoad, 15 C64 Game System/System 3, 17 Dinamic, 19 Magic Desk/Domark/HES,
 * 32 EasyFlash (flash is read-only, RAM at $DF00).
 */
(function (global) {
  "use strict";

  var NAMES = { 0: "Normal", 4: "Simons' BASIC", 5: "Ocean", 7: "Fun Play / Power Play", 8: "Super Games", 10: "Epyx FastLoad",
                15: "C64 Game System / System 3", 17: "Dinamic", 19: "Magic Desk / Domark / HES", 32: "EasyFlash" };
  var EMPTY = new Uint8Array(0x2000).fill(0xFF);

  function Cartridge(crt, machine) {
    this.crt = crt;
    this.m = machine;
    this.type = crt.type;
    if (!(crt.type in NAMES)) throw new Error("This cartridge type (" + crt.type + ") is not supported. Supported: " +
      Object.keys(NAMES).map(function (k) { return NAMES[k]; }).join(", ") + ".");
    this.name = NAMES[crt.type];
    // banks: lo[bank] = 8K at $8000, hi[bank] = 8K at $A000/$E000
    this.lo = []; this.hi = [];
    var self = this;
    crt.chips.forEach(function (c) {
      var b = c.bank;
      if (c.size > 0x2000) {
        self.lo[b] = pad(c.data.subarray(0, 0x2000));
        self.hi[b] = pad(c.data.subarray(0x2000, 0x4000));
      } else if (c.addr === 0x8000) self.lo[b] = pad(c.data);
      else self.hi[b] = pad(c.data);
    });
    this.ram = new Uint8Array(256);
    this.reset();
  }
  function pad(d) { if (d.length === 0x2000) return d; var a = new Uint8Array(0x2000).fill(0xFF); a.set(d.subarray(0, 0x2000)); if (d.length <= 0x1000) a.set(d, 0x1000); return a; }

  var P = Cartridge.prototype;

  P.reset = function () {
    this.bank = 0;
    this.exrom = this.crt.exrom; this.game = this.crt.game;
    this.irq = 0;
    switch (this.type) {
      case 4: this.exrom = 0; this.game = 1; break;
      case 5: this.exrom = 0; this.game = this.hi.length ? 0 : 1; if (this.lo.length > 16 && !this.hi.length) this.game = 1; break;
      case 7: this.exrom = 0; this.game = 1; break;
      case 8: this.exrom = 0; this.game = 0; break;
      case 10: this.exrom = 0; this.game = 1; break;
      case 15: case 17: case 19: this.exrom = 0; this.game = 1; break;
      case 32: this.ef = 0; this.exrom = 1; this.game = 0; break;
    }
    this.select();
  };

  P.select = function () {
    var b = this.bank;
    this.roml = this.lo[b] || this.lo[0] || EMPTY;
    this.romh = this.hi[b] || this.hi[0] || EMPTY;
    if (this.m) this.m.updateMap();
  };

  P.setLines = function (exrom, game) { this.exrom = exrom; this.game = game; if (this.m) this.m.updateMap(); };

  P.readIO1 = function (a) {
    switch (this.type) {
      case 4: this.setLines(0, 1); return 0xFF;
      case 10: return this.roml[0x1F00 | (a & 0xFF)];
      case 15: this.bank = 0; this.select(); return 0xFF;
      case 17: this.bank = a & 0x0F; this.select(); return 0xFF;
      case 32: return 0xFF;
    }
    return 0xFF;
  };
  P.readIO2 = function (a) {
    switch (this.type) {
      case 10: return this.roml[0x1F00 | (a & 0xFF)];
      case 32: return this.ram[a & 0xFF];
    }
    return 0xFF;
  };
  P.writeIO1 = function (a, v) {
    switch (this.type) {
      case 4: this.setLines(0, 0); break;
      case 5: this.bank = v & 0x3F; this.select(); break;
      case 7:
        if (v === 0x86) this.setLines(1, 1);
        else { this.bank = ((v >> 3) & 7) | ((v & 1) << 3); this.select(); }
        break;
      case 15: this.bank = a & 0x3F; this.select(); break;
      case 19:
        this.bank = v & 0x7F; this.select();
        this.setLines((v & 0x80) ? 1 : 0, 1);
        break;
      case 32:
        if ((a & 0x02) === 0) { this.bank = v & 0x3F; this.select(); }
        else {
          this.ef = v;
          var exrom = (v & 0x02) ? 0 : 1;
          var game = (v & 0x04) ? ((v & 0x01) ? 0 : 1) : 0;
          this.setLines(exrom, game);
        }
        break;
    }
  };
  P.writeIO2 = function (a, v) {
    switch (this.type) {
      case 8:
        if (this.locked) break;
        this.bank = v & 3; this.select();
        if (v & 0x04) this.setLines(1, 1); else this.setLines(0, 0);
        if (v & 0x08) this.locked = true;
        break;
      case 32: this.ram[a & 0xFF] = v; break;
    }
  };

  P.saveState = function () { return { bank: this.bank, exrom: this.exrom, game: this.game, ram: Array.from(this.ram), locked: !!this.locked }; };
  P.loadState = function (o) { this.bank = o.bank; this.exrom = o.exrom; this.game = o.game; this.ram.set(o.ram); this.locked = o.locked; this.select(); };

  Cartridge.NAMES = NAMES;
  global.Cartridge = Cartridge;
})(typeof window !== "undefined" ? window : globalThis);
