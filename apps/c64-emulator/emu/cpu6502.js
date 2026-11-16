/* MOS 6502/6510 CPU core (NMOS), used by the C64 and by the 1541 drive.
 * Instruction-stepped: step() runs one instruction (or interrupt) and returns
 * its cycle count. All documented and undocumented opcodes are implemented.
 * Read-modify-write instructions write the old value first, like the real chip
 * (matters for "INC $D019" and similar).
 */
(function (global) {
  "use strict";

  // Base cycle counts (NMOS 6502)
  var CYC = [
    7,6,2,8,3,3,5,5,3,2,2,2,4,4,6,6, 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,
    6,6,2,8,3,3,5,5,4,2,2,2,4,4,6,6, 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,
    6,6,2,8,3,3,5,5,3,2,2,2,3,4,6,6, 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,
    6,6,2,8,3,3,5,5,4,2,2,2,5,4,6,6, 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,
    2,6,2,6,3,3,3,3,2,2,2,2,4,4,4,4, 2,6,2,6,4,4,4,4,2,5,2,5,5,5,5,5,
    2,6,2,6,3,3,3,3,2,2,2,2,4,4,4,4, 2,5,2,5,4,4,4,4,2,4,2,4,4,4,4,4,
    2,6,2,8,3,3,5,5,2,2,2,2,4,4,6,6, 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,
    2,6,2,8,3,3,5,5,2,2,2,2,4,4,6,6, 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7
  ];

  function CPU(bus) {
    this.bus = bus;           // { read(addr), write(addr, value) }
    this.a = 0; this.x = 0; this.y = 0; this.s = 0xFD; this.pc = 0;
    this.n = 0; this.v = 0; this.d = 0; this.i = 1; this.z = 0; this.c = 0;
    this.irq = 0;             // level: bit mask of active IRQ sources
    this.nmiLine = 0;         // level of the NMI line (edge triggered)
    this.nmiPending = false;
    this.jammed = false;
    this.extra = 0;           // page-cross cycles of the current instruction
    this.op = 0;              // current opcode
    this.cyc = 2;             // base cycles of the current instruction
  }
  CPU.CYC = CYC;

  var P = CPU.prototype;

  P.reset = function () {
    this.s = (this.s - 3) & 0xFF;
    this.i = 1;
    this.jammed = false;
    this.nmiPending = false;
    this.pc = this.bus.read(0xFFFC) | (this.bus.read(0xFFFD) << 8);
  };

  P.setNMI = function (level) {
    if (level && !this.nmiLine) this.nmiPending = true;
    this.nmiLine = level ? 1 : 0;
  };

  P.getP = function (b) {
    return (this.n ? 0x80 : 0) | (this.v ? 0x40 : 0) | 0x20 | (b ? 0x10 : 0) |
      (this.d ? 0x08 : 0) | (this.i ? 0x04 : 0) | (this.z ? 0 : 0) | (this.z ? 0x02 : 0) | (this.c ? 0x01 : 0);
  };
  P.setP = function (p) {
    this.n = p & 0x80; this.v = p & 0x40; this.d = p & 0x08; this.i = p & 0x04;
    this.z = p & 0x02; this.c = p & 0x01;
  };

  P.push = function (v) { this.bus.write(0x100 | this.s, v); this.s = (this.s - 1) & 0xFF; };
  P.pull = function () { this.s = (this.s + 1) & 0xFF; return this.bus.read(0x100 | this.s); };

  P.interrupt = function (vector, brk) {
    this.push(this.pc >> 8);
    this.push(this.pc & 0xFF);
    this.push(this.getP(brk));
    this.i = 1;
    this.pc = this.bus.read(vector) | (this.bus.read(vector + 1) << 8);
  };

  // ---- addressing helpers (return the effective address) ----
  P.zp = function () { return this.bus.read(this.pc++ & 0xFFFF); };
  P.abs = function () {
    var lo = this.bus.read(this.pc), hi = this.bus.read((this.pc + 1) & 0xFFFF);
    this.pc = (this.pc + 2) & 0xFFFF;
    return lo | (hi << 8);
  };
  P.absI = function (r, penalty) {
    var base = this.abs(), ea = (base + r) & 0xFFFF;
    if (penalty && ((base ^ ea) & 0xFF00)) this.extra = 1;
    return ea;
  };
  P.izx = function () {
    var p = (this.bus.read(this.pc++ & 0xFFFF) + this.x) & 0xFF;
    return this.bus.read(p) | (this.bus.read((p + 1) & 0xFF) << 8);
  };
  P.izy = function (penalty) {
    var p = this.bus.read(this.pc++ & 0xFFFF);
    var base = this.bus.read(p) | (this.bus.read((p + 1) & 0xFF) << 8);
    var ea = (base + this.y) & 0xFFFF;
    if (penalty && ((base ^ ea) & 0xFF00)) this.extra = 1;
    return ea;
  };

  // ---- ALU ----
  P.nz = function (v) { this.n = v & 0x80; this.z = (v & 0xFF) === 0 ? 1 : 0; return v; };
  P.adc = function (v) {
    var a = this.a, c = this.c ? 1 : 0, t;
    if (this.d) {
      var lo = (a & 0x0F) + (v & 0x0F) + c;
      var hi = (a >> 4) + (v >> 4);
      if (lo > 9) lo += 6;
      if (lo > 0x0F) hi++;
      this.z = ((a + v + c) & 0xFF) === 0 ? 1 : 0;
      this.n = hi & 0x08;
      this.v = ((((hi << 4) ^ a) & 0x80) && !((a ^ v) & 0x80)) ? 1 : 0;
      if (hi > 9) hi += 6;
      this.c = hi > 0x0F ? 1 : 0;
      this.a = ((hi << 4) | (lo & 0x0F)) & 0xFF;
    } else {
      t = a + v + c;
      this.v = (~(a ^ v) & (a ^ t) & 0x80) ? 1 : 0;
      this.c = t > 0xFF ? 1 : 0;
      this.a = this.nz(t & 0xFF);
    }
  };
  P.sbc = function (v) {
    var a = this.a, b = this.c ? 0 : 1;
    var t = a - v - b;
    this.v = ((a ^ v) & (a ^ t) & 0x80) ? 1 : 0;
    this.c = t >= 0 ? 1 : 0;
    this.nz(t & 0xFF);
    if (this.d) {
      var lo = (a & 0x0F) - (v & 0x0F) - b;
      var hi = (a >> 4) - (v >> 4);
      if (lo & 0x10) { lo -= 6; hi--; }
      if (hi & 0x10) hi -= 6;
      this.a = ((hi << 4) | (lo & 0x0F)) & 0xFF;
    } else {
      this.a = t & 0xFF;
    }
  };
  P.cmp = function (r, v) { var t = r - v; this.c = t >= 0 ? 1 : 0; this.nz(t & 0xFF); };
  P.asl = function (v) { this.c = v & 0x80; return this.nz((v << 1) & 0xFF); };
  P.lsr = function (v) { this.c = v & 1; return this.nz(v >> 1); };
  P.rol = function (v) { var r = ((v << 1) | (this.c ? 1 : 0)) & 0xFF; this.c = v & 0x80; return this.nz(r); };
  P.ror = function (v) { var r = (v >> 1) | (this.c ? 0x80 : 0); this.c = v & 1; return this.nz(r); };

  P.branch = function (cond) {
    var off = this.bus.read(this.pc);
    this.pc = (this.pc + 1) & 0xFFFF;
    if (cond) {
      var t = (this.pc + (off < 0x80 ? off : off - 256)) & 0xFFFF;
      this.extra = ((t ^ this.pc) & 0xFF00) ? 2 : 1;
      this.pc = t;
    }
  };

  // read-modify-write with dummy write of the old value
  P.rmw = function (ea, fn) {
    var bus = this.bus, v = bus.read(ea);
    bus.write(ea, v);
    var r = fn.call(this, v);
    bus.write(ea, r);
    return r;
  };
  // undocumented "store high byte AND" family (SHA/SHX/SHY/TAS)
  P.shx = function (base, idx, val) {
    var ea = (base + idx) & 0xFFFF, hi = (base >> 8) + 1;
    var v = val & hi;
    if (((base ^ ea) & 0xFF00)) ea = (ea & 0xFF) | (v << 8);
    this.bus.write(ea, v & 0xFF);
  };

  P.step = function () {
    var bus = this.bus;
    if (this.nmiPending) {
      this.nmiPending = false;
      this.interrupt(0xFFFA, false);
      return 7;
    }
    if (this.irq && !this.i) {
      this.interrupt(0xFFFE, false);
      return 7;
    }
    if (this.jammed) return 2;
    var op = bus.read(this.pc);
    this.op = op;
    this.cyc = CYC[op];
    this.extra = 0;
    this.pc = (this.pc + 1) & 0xFFFF;
    var ea, v, t;
    switch (op) {
      // ----- ORA -----
      case 0x09: this.a = this.nz(this.a | bus.read(this.pc++)); break;
      case 0x05: this.a = this.nz(this.a | bus.read(this.zp())); break;
      case 0x15: this.a = this.nz(this.a | bus.read((this.zp() + this.x) & 0xFF)); break;
      case 0x0D: this.a = this.nz(this.a | bus.read(this.abs())); break;
      case 0x1D: this.a = this.nz(this.a | bus.read(this.absI(this.x, 1))); break;
      case 0x19: this.a = this.nz(this.a | bus.read(this.absI(this.y, 1))); break;
      case 0x01: this.a = this.nz(this.a | bus.read(this.izx())); break;
      case 0x11: this.a = this.nz(this.a | bus.read(this.izy(1))); break;
      // ----- AND -----
      case 0x29: this.a = this.nz(this.a & bus.read(this.pc++)); break;
      case 0x25: this.a = this.nz(this.a & bus.read(this.zp())); break;
      case 0x35: this.a = this.nz(this.a & bus.read((this.zp() + this.x) & 0xFF)); break;
      case 0x2D: this.a = this.nz(this.a & bus.read(this.abs())); break;
      case 0x3D: this.a = this.nz(this.a & bus.read(this.absI(this.x, 1))); break;
      case 0x39: this.a = this.nz(this.a & bus.read(this.absI(this.y, 1))); break;
      case 0x21: this.a = this.nz(this.a & bus.read(this.izx())); break;
      case 0x31: this.a = this.nz(this.a & bus.read(this.izy(1))); break;
      // ----- EOR -----
      case 0x49: this.a = this.nz(this.a ^ bus.read(this.pc++)); break;
      case 0x45: this.a = this.nz(this.a ^ bus.read(this.zp())); break;
      case 0x55: this.a = this.nz(this.a ^ bus.read((this.zp() + this.x) & 0xFF)); break;
      case 0x4D: this.a = this.nz(this.a ^ bus.read(this.abs())); break;
      case 0x5D: this.a = this.nz(this.a ^ bus.read(this.absI(this.x, 1))); break;
      case 0x59: this.a = this.nz(this.a ^ bus.read(this.absI(this.y, 1))); break;
      case 0x41: this.a = this.nz(this.a ^ bus.read(this.izx())); break;
      case 0x51: this.a = this.nz(this.a ^ bus.read(this.izy(1))); break;
      // ----- ADC -----
      case 0x69: this.adc(bus.read(this.pc++)); break;
      case 0x65: this.adc(bus.read(this.zp())); break;
      case 0x75: this.adc(bus.read((this.zp() + this.x) & 0xFF)); break;
      case 0x6D: this.adc(bus.read(this.abs())); break;
      case 0x7D: this.adc(bus.read(this.absI(this.x, 1))); break;
      case 0x79: this.adc(bus.read(this.absI(this.y, 1))); break;
      case 0x61: this.adc(bus.read(this.izx())); break;
      case 0x71: this.adc(bus.read(this.izy(1))); break;
      // ----- SBC (EB is undocumented) -----
      case 0xE9: case 0xEB: this.sbc(bus.read(this.pc++)); break;
      case 0xE5: this.sbc(bus.read(this.zp())); break;
      case 0xF5: this.sbc(bus.read((this.zp() + this.x) & 0xFF)); break;
      case 0xED: this.sbc(bus.read(this.abs())); break;
      case 0xFD: this.sbc(bus.read(this.absI(this.x, 1))); break;
      case 0xF9: this.sbc(bus.read(this.absI(this.y, 1))); break;
      case 0xE1: this.sbc(bus.read(this.izx())); break;
      case 0xF1: this.sbc(bus.read(this.izy(1))); break;
      // ----- CMP / CPX / CPY -----
      case 0xC9: this.cmp(this.a, bus.read(this.pc++)); break;
      case 0xC5: this.cmp(this.a, bus.read(this.zp())); break;
      case 0xD5: this.cmp(this.a, bus.read((this.zp() + this.x) & 0xFF)); break;
      case 0xCD: this.cmp(this.a, bus.read(this.abs())); break;
      case 0xDD: this.cmp(this.a, bus.read(this.absI(this.x, 1))); break;
      case 0xD9: this.cmp(this.a, bus.read(this.absI(this.y, 1))); break;
      case 0xC1: this.cmp(this.a, bus.read(this.izx())); break;
      case 0xD1: this.cmp(this.a, bus.read(this.izy(1))); break;
      case 0xE0: this.cmp(this.x, bus.read(this.pc++)); break;
      case 0xE4: this.cmp(this.x, bus.read(this.zp())); break;
      case 0xEC: this.cmp(this.x, bus.read(this.abs())); break;
      case 0xC0: this.cmp(this.y, bus.read(this.pc++)); break;
      case 0xC4: this.cmp(this.y, bus.read(this.zp())); break;
      case 0xCC: this.cmp(this.y, bus.read(this.abs())); break;
      // ----- BIT -----
      case 0x24: v = bus.read(this.zp()); this.z = (this.a & v) ? 0 : 1; this.n = v & 0x80; this.v = v & 0x40; break;
      case 0x2C: v = bus.read(this.abs()); this.z = (this.a & v) ? 0 : 1; this.n = v & 0x80; this.v = v & 0x40; break;
      // ----- LDA -----
      case 0xA9: this.a = this.nz(bus.read(this.pc++)); break;
      case 0xA5: this.a = this.nz(bus.read(this.zp())); break;
      case 0xB5: this.a = this.nz(bus.read((this.zp() + this.x) & 0xFF)); break;
      case 0xAD: this.a = this.nz(bus.read(this.abs())); break;
      case 0xBD: this.a = this.nz(bus.read(this.absI(this.x, 1))); break;
      case 0xB9: this.a = this.nz(bus.read(this.absI(this.y, 1))); break;
      case 0xA1: this.a = this.nz(bus.read(this.izx())); break;
      case 0xB1: this.a = this.nz(bus.read(this.izy(1))); break;
      // ----- LDX -----
      case 0xA2: this.x = this.nz(bus.read(this.pc++)); break;
      case 0xA6: this.x = this.nz(bus.read(this.zp())); break;
      case 0xB6: this.x = this.nz(bus.read((this.zp() + this.y) & 0xFF)); break;
      case 0xAE: this.x = this.nz(bus.read(this.abs())); break;
      case 0xBE: this.x = this.nz(bus.read(this.absI(this.y, 1))); break;
      // ----- LDY -----
      case 0xA0: this.y = this.nz(bus.read(this.pc++)); break;
      case 0xA4: this.y = this.nz(bus.read(this.zp())); break;
      case 0xB4: this.y = this.nz(bus.read((this.zp() + this.x) & 0xFF)); break;
      case 0xAC: this.y = this.nz(bus.read(this.abs())); break;
      case 0xBC: this.y = this.nz(bus.read(this.absI(this.x, 1))); break;
      // ----- STA / STX / STY -----
      case 0x85: bus.write(this.zp(), this.a); break;
      case 0x95: bus.write((this.zp() + this.x) & 0xFF, this.a); break;
      case 0x8D: bus.write(this.abs(), this.a); break;
      case 0x9D: bus.write(this.absI(this.x, 0), this.a); break;
      case 0x99: bus.write(this.absI(this.y, 0), this.a); break;
      case 0x81: bus.write(this.izx(), this.a); break;
      case 0x91: bus.write(this.izy(0), this.a); break;
      case 0x86: bus.write(this.zp(), this.x); break;
      case 0x96: bus.write((this.zp() + this.y) & 0xFF, this.x); break;
      case 0x8E: bus.write(this.abs(), this.x); break;
      case 0x84: bus.write(this.zp(), this.y); break;
      case 0x94: bus.write((this.zp() + this.x) & 0xFF, this.y); break;
      case 0x8C: bus.write(this.abs(), this.y); break;
      // ----- shifts on A -----
      case 0x0A: this.a = this.asl(this.a); break;
      case 0x4A: this.a = this.lsr(this.a); break;
      case 0x2A: this.a = this.rol(this.a); break;
      case 0x6A: this.a = this.ror(this.a); break;
      // ----- RMW memory -----
      case 0x06: this.rmw(this.zp(), this.asl); break;
      case 0x16: this.rmw((this.zp() + this.x) & 0xFF, this.asl); break;
      case 0x0E: this.rmw(this.abs(), this.asl); break;
      case 0x1E: this.rmw(this.absI(this.x, 0), this.asl); break;
      case 0x46: this.rmw(this.zp(), this.lsr); break;
      case 0x56: this.rmw((this.zp() + this.x) & 0xFF, this.lsr); break;
      case 0x4E: this.rmw(this.abs(), this.lsr); break;
      case 0x5E: this.rmw(this.absI(this.x, 0), this.lsr); break;
      case 0x26: this.rmw(this.zp(), this.rol); break;
      case 0x36: this.rmw((this.zp() + this.x) & 0xFF, this.rol); break;
      case 0x2E: this.rmw(this.abs(), this.rol); break;
      case 0x3E: this.rmw(this.absI(this.x, 0), this.rol); break;
      case 0x66: this.rmw(this.zp(), this.ror); break;
      case 0x76: this.rmw((this.zp() + this.x) & 0xFF, this.ror); break;
      case 0x6E: this.rmw(this.abs(), this.ror); break;
      case 0x7E: this.rmw(this.absI(this.x, 0), this.ror); break;
      case 0xE6: this.rmw(this.zp(), incF); break;
      case 0xF6: this.rmw((this.zp() + this.x) & 0xFF, incF); break;
      case 0xEE: this.rmw(this.abs(), incF); break;
      case 0xFE: this.rmw(this.absI(this.x, 0), incF); break;
      case 0xC6: this.rmw(this.zp(), decF); break;
      case 0xD6: this.rmw((this.zp() + this.x) & 0xFF, decF); break;
      case 0xCE: this.rmw(this.abs(), decF); break;
      case 0xDE: this.rmw(this.absI(this.x, 0), decF); break;
      // ----- register ops -----
      case 0xE8: this.x = this.nz((this.x + 1) & 0xFF); break;
      case 0xC8: this.y = this.nz((this.y + 1) & 0xFF); break;
      case 0xCA: this.x = this.nz((this.x - 1) & 0xFF); break;
      case 0x88: this.y = this.nz((this.y - 1) & 0xFF); break;
      case 0xAA: this.x = this.nz(this.a); break;
      case 0xA8: this.y = this.nz(this.a); break;
      case 0x8A: this.a = this.nz(this.x); break;
      case 0x98: this.a = this.nz(this.y); break;
      case 0xBA: this.x = this.nz(this.s); break;
      case 0x9A: this.s = this.x; break;
      // ----- flags -----
      case 0x18: this.c = 0; break;
      case 0x38: this.c = 1; break;
      case 0x58: this.i = 0; break;
      case 0x78: this.i = 1; break;
      case 0xB8: this.v = 0; break;
      case 0xD8: this.d = 0; break;
      case 0xF8: this.d = 1; break;
      // ----- stack -----
      case 0x48: this.push(this.a); break;
      case 0x08: this.push(this.getP(true)); break;
      case 0x68: this.a = this.nz(this.pull()); break;
      case 0x28: this.setP(this.pull()); break;
      // ----- jumps -----
      case 0x4C: this.pc = this.abs(); break;
      case 0x6C:
        t = this.abs();
        this.pc = bus.read(t) | (bus.read((t & 0xFF00) | ((t + 1) & 0xFF)) << 8);
        break;
      case 0x20:
        t = this.abs();
        v = (this.pc - 1) & 0xFFFF;
        this.push(v >> 8); this.push(v & 0xFF);
        this.pc = t;
        break;
      case 0x60: t = this.pull(); t |= this.pull() << 8; this.pc = (t + 1) & 0xFFFF; break;
      case 0x40: this.setP(this.pull()); t = this.pull(); t |= this.pull() << 8; this.pc = t; break;
      case 0x00: this.pc = (this.pc + 1) & 0xFFFF; this.interrupt(0xFFFE, true); break;
      // ----- branches -----
      case 0x10: this.branch(!this.n); break;
      case 0x30: this.branch(this.n); break;
      case 0x50: this.branch(!this.v); break;
      case 0x70: this.branch(this.v); break;
      case 0x90: this.branch(!this.c); break;
      case 0xB0: this.branch(this.c); break;
      case 0xD0: this.branch(!this.z); break;
      case 0xF0: this.branch(this.z); break;
      // ----- NOPs (documented and undocumented) -----
      case 0xEA: case 0x1A: case 0x3A: case 0x5A: case 0x7A: case 0xDA: case 0xFA: break;
      case 0x80: case 0x82: case 0x89: case 0xC2: case 0xE2: this.pc = (this.pc + 1) & 0xFFFF; break;
      case 0x04: case 0x44: case 0x64: bus.read(this.zp()); break;
      case 0x14: case 0x34: case 0x54: case 0x74: case 0xD4: case 0xF4: bus.read((this.zp() + this.x) & 0xFF); break;
      case 0x0C: bus.read(this.abs()); break;
      case 0x1C: case 0x3C: case 0x5C: case 0x7C: case 0xDC: case 0xFC: bus.read(this.absI(this.x, 1)); break;
      // ----- JAM -----
      case 0x02: case 0x12: case 0x22: case 0x32: case 0x42: case 0x52:
      case 0x62: case 0x72: case 0x92: case 0xB2: case 0xD2: case 0xF2:
        this.jammed = true; this.pc = (this.pc - 1) & 0xFFFF; break;
      // ----- undocumented: SLO -----
      case 0x07: this.slo(this.zp()); break;
      case 0x17: this.slo((this.zp() + this.x) & 0xFF); break;
      case 0x0F: this.slo(this.abs()); break;
      case 0x1F: this.slo(this.absI(this.x, 0)); break;
      case 0x1B: this.slo(this.absI(this.y, 0)); break;
      case 0x03: this.slo(this.izx()); break;
      case 0x13: this.slo(this.izy(0)); break;
      // RLA
      case 0x27: this.rla(this.zp()); break;
      case 0x37: this.rla((this.zp() + this.x) & 0xFF); break;
      case 0x2F: this.rla(this.abs()); break;
      case 0x3F: this.rla(this.absI(this.x, 0)); break;
      case 0x3B: this.rla(this.absI(this.y, 0)); break;
      case 0x23: this.rla(this.izx()); break;
      case 0x33: this.rla(this.izy(0)); break;
      // SRE
      case 0x47: this.sre(this.zp()); break;
      case 0x57: this.sre((this.zp() + this.x) & 0xFF); break;
      case 0x4F: this.sre(this.abs()); break;
      case 0x5F: this.sre(this.absI(this.x, 0)); break;
      case 0x5B: this.sre(this.absI(this.y, 0)); break;
      case 0x43: this.sre(this.izx()); break;
      case 0x53: this.sre(this.izy(0)); break;
      // RRA
      case 0x67: this.rra(this.zp()); break;
      case 0x77: this.rra((this.zp() + this.x) & 0xFF); break;
      case 0x6F: this.rra(this.abs()); break;
      case 0x7F: this.rra(this.absI(this.x, 0)); break;
      case 0x7B: this.rra(this.absI(this.y, 0)); break;
      case 0x63: this.rra(this.izx()); break;
      case 0x73: this.rra(this.izy(0)); break;
      // SAX
      case 0x87: bus.write(this.zp(), this.a & this.x); break;
      case 0x97: bus.write((this.zp() + this.y) & 0xFF, this.a & this.x); break;
      case 0x8F: bus.write(this.abs(), this.a & this.x); break;
      case 0x83: bus.write(this.izx(), this.a & this.x); break;
      // LAX
      case 0xA7: this.a = this.x = this.nz(bus.read(this.zp())); break;
      case 0xB7: this.a = this.x = this.nz(bus.read((this.zp() + this.y) & 0xFF)); break;
      case 0xAF: this.a = this.x = this.nz(bus.read(this.abs())); break;
      case 0xBF: this.a = this.x = this.nz(bus.read(this.absI(this.y, 1))); break;
      case 0xA3: this.a = this.x = this.nz(bus.read(this.izx())); break;
      case 0xB3: this.a = this.x = this.nz(bus.read(this.izy(1))); break;
      // DCP
      case 0xC7: this.dcp(this.zp()); break;
      case 0xD7: this.dcp((this.zp() + this.x) & 0xFF); break;
      case 0xCF: this.dcp(this.abs()); break;
      case 0xDF: this.dcp(this.absI(this.x, 0)); break;
      case 0xDB: this.dcp(this.absI(this.y, 0)); break;
      case 0xC3: this.dcp(this.izx()); break;
      case 0xD3: this.dcp(this.izy(0)); break;
      // ISC
      case 0xE7: this.isc(this.zp()); break;
      case 0xF7: this.isc((this.zp() + this.x) & 0xFF); break;
      case 0xEF: this.isc(this.abs()); break;
      case 0xFF: this.isc(this.absI(this.x, 0)); break;
      case 0xFB: this.isc(this.absI(this.y, 0)); break;
      case 0xE3: this.isc(this.izx()); break;
      case 0xF3: this.isc(this.izy(0)); break;
      // immediate oddballs
      case 0x0B: case 0x2B: this.a = this.nz(this.a & bus.read(this.pc++)); this.c = this.n; break;           // ANC
      case 0x4B: this.a = this.lsr(this.a & bus.read(this.pc++)); break;                                    // ALR
      case 0x6B:                                                                                             // ARR
        t = this.a & bus.read(this.pc++);
        if (this.d) {
          v = (t >> 1) | (this.c ? 0x80 : 0);
          this.n = this.c ? 0x80 : 0; this.z = v === 0 ? 1 : 0;
          this.v = ((t ^ v) & 0x40) ? 1 : 0;
          if (((t & 0x0F) + (t & 0x01)) > 5) v = (v & 0xF0) | ((v + 6) & 0x0F);
          if (((t & 0xF0) + (t & 0x10)) > 0x50) { this.c = 1; v = (v + 0x60) & 0xFF; } else this.c = 0;
          this.a = v;
        } else {
          this.a = this.nz((t >> 1) | (this.c ? 0x80 : 0));
          this.c = this.a & 0x40; this.v = ((this.a >> 6) ^ (this.a >> 5)) & 1;
        }
        break;
      case 0x8B: this.a = this.nz((this.a | 0xEE) & this.x & bus.read(this.pc++)); break;                   // ANE
      case 0xAB: this.a = this.x = this.nz((this.a | 0xEE) & bus.read(this.pc++)); break;                   // LXA
      case 0xCB: t = (this.a & this.x) - bus.read(this.pc++); this.c = t >= 0 ? 1 : 0; this.x = this.nz(t & 0xFF); break; // SBX
      case 0xBB: v = bus.read(this.absI(this.y, 1)) & this.s; this.a = this.x = this.s = this.nz(v); break; // LAS
      case 0x9B: t = this.abs(); this.s = this.a & this.x; this.shx(t, this.y, this.s); break;             // TAS
      case 0x9F: t = this.abs(); this.shx(t, this.y, this.a & this.x); break;                              // SHA abs,y
      case 0x93:                                                                                             // SHA (zp),y
        v = bus.read(this.pc++ & 0xFFFF);
        t = bus.read(v) | (bus.read((v + 1) & 0xFF) << 8);
        this.shx(t, this.y, this.a & this.x);
        break;
      case 0x9E: t = this.abs(); this.shx(t, this.y, this.x); break;                                       // SHX
      case 0x9C: t = this.abs(); this.shx(t, this.x, this.y); break;                                       // SHY
    }
    this.pc &= 0xFFFF;
    return this.cyc + this.extra;
  };

  function incF(v) { return this.nz((v + 1) & 0xFF); }
  function decF(v) { return this.nz((v - 1) & 0xFF); }
  P.slo = function (ea) { var r = this.rmw(ea, this.asl); this.a = this.nz(this.a | r); };
  P.rla = function (ea) { var r = this.rmw(ea, this.rol); this.a = this.nz(this.a & r); };
  P.sre = function (ea) { var r = this.rmw(ea, this.lsr); this.a = this.nz(this.a ^ r); };
  P.rra = function (ea) { var r = this.rmw(ea, this.ror); this.adc(r); };
  P.dcp = function (ea) { var r = this.rmw(ea, function (v) { return (v - 1) & 0xFF; }); this.cmp(this.a, r); };
  P.isc = function (ea) { var r = this.rmw(ea, function (v) { return (v + 1) & 0xFF; }); this.sbc(r); };

  P.saveState = function () {
    return { a: this.a, x: this.x, y: this.y, s: this.s, pc: this.pc, p: this.getP(false),
      irq: this.irq, nmiLine: this.nmiLine, nmiPending: this.nmiPending, jammed: this.jammed };
  };
  P.loadState = function (o) {
    this.a = o.a; this.x = o.x; this.y = o.y; this.s = o.s; this.pc = o.pc; this.setP(o.p);
    this.irq = o.irq; this.nmiLine = o.nmiLine; this.nmiPending = o.nmiPending; this.jammed = o.jammed;
  };

  global.CPU6502 = CPU;
})(typeof window !== "undefined" ? window : globalThis);
