/* 6510 disassembler and one-line assembler for the debugger: all 256 opcodes
 * (undocumented ones with their common names), plus labels for the KERNAL jump
 * table, vectors and the I/O registers.
 *
 * Numbers in the assembler are hexadecimal ($ optional); +12 is decimal, %1010 binary.
 */
(function (global) {
  "use strict";

  // mnemonic and addressing mode of every opcode, row by row ($00-$0F, $10-$1F, ...)
  var T = (
    "BRK imp,ORA izx,JAM imp,SLO izx,NOP zp,ORA zp,ASL zp,SLO zp,PHP imp,ORA imm,ASL acc,ANC imm,NOP abs,ORA abs,ASL abs,SLO abs," +
    "BPL rel,ORA izy,JAM imp,SLO izy,NOP zpx,ORA zpx,ASL zpx,SLO zpx,CLC imp,ORA aby,NOP imp,SLO aby,NOP abx,ORA abx,ASL abx,SLO abx," +
    "JSR abs,AND izx,JAM imp,RLA izx,BIT zp,AND zp,ROL zp,RLA zp,PLP imp,AND imm,ROL acc,ANC imm,BIT abs,AND abs,ROL abs,RLA abs," +
    "BMI rel,AND izy,JAM imp,RLA izy,NOP zpx,AND zpx,ROL zpx,RLA zpx,SEC imp,AND aby,NOP imp,RLA aby,NOP abx,AND abx,ROL abx,RLA abx," +
    "RTI imp,EOR izx,JAM imp,SRE izx,NOP zp,EOR zp,LSR zp,SRE zp,PHA imp,EOR imm,LSR acc,ALR imm,JMP abs,EOR abs,LSR abs,SRE abs," +
    "BVC rel,EOR izy,JAM imp,SRE izy,NOP zpx,EOR zpx,LSR zpx,SRE zpx,CLI imp,EOR aby,NOP imp,SRE aby,NOP abx,EOR abx,LSR abx,SRE abx," +
    "RTS imp,ADC izx,JAM imp,RRA izx,NOP zp,ADC zp,ROR zp,RRA zp,PLA imp,ADC imm,ROR acc,ARR imm,JMP ind,ADC abs,ROR abs,RRA abs," +
    "BVS rel,ADC izy,JAM imp,RRA izy,NOP zpx,ADC zpx,ROR zpx,RRA zpx,SEI imp,ADC aby,NOP imp,RRA aby,NOP abx,ADC abx,ROR abx,RRA abx," +
    "NOP imm,STA izx,NOP imm,SAX izx,STY zp,STA zp,STX zp,SAX zp,DEY imp,NOP imm,TXA imp,ANE imm,STY abs,STA abs,STX abs,SAX abs," +
    "BCC rel,STA izy,JAM imp,SHA izy,STY zpx,STA zpx,STX zpy,SAX zpy,TYA imp,STA aby,TXS imp,TAS aby,SHY abx,STA abx,SHX aby,SHA aby," +
    "LDY imm,LDA izx,LDX imm,LAX izx,LDY zp,LDA zp,LDX zp,LAX zp,TAY imp,LDA imm,TAX imp,LXA imm,LDY abs,LDA abs,LDX abs,LAX abs," +
    "BCS rel,LDA izy,JAM imp,LAX izy,LDY zpx,LDA zpx,LDX zpy,LAX zpy,CLV imp,LDA aby,TSX imp,LAS aby,LDY abx,LDA abx,LDX aby,LAX aby," +
    "CPY imm,CMP izx,NOP imm,DCP izx,CPY zp,CMP zp,DEC zp,DCP zp,INY imp,CMP imm,DEX imp,SBX imm,CPY abs,CMP abs,DEC abs,DCP abs," +
    "BNE rel,CMP izy,JAM imp,DCP izy,NOP zpx,CMP zpx,DEC zpx,DCP zpx,CLD imp,CMP aby,NOP imp,DCP aby,NOP abx,CMP abx,DEC abx,DCP abx," +
    "CPX imm,SBC izx,NOP imm,ISC izx,CPX zp,SBC zp,INC zp,ISC zp,INX imp,SBC imm,NOP imp,SBC imm,CPX abs,SBC abs,INC abs,ISC abs," +
    "BEQ rel,SBC izy,JAM imp,ISC izy,NOP zpx,SBC zpx,INC zpx,ISC zpx,SED imp,SBC aby,NOP imp,ISC aby,NOP abx,SBC abx,INC abx,ISC abx"
  ).split(",");

  var LEN = { imp: 1, acc: 1, imm: 2, zp: 2, zpx: 2, zpy: 2, izx: 2, izy: 2, rel: 2, abs: 3, abx: 3, aby: 3, ind: 3 };
  var OFFICIAL = "ADC AND ASL BCC BCS BEQ BIT BMI BNE BPL BRK BVC BVS CLC CLD CLI CLV CMP CPX CPY DEC DEX DEY EOR INC INX INY " +
    "JMP JSR LDA LDX LDY LSR NOP ORA PHA PHP PLA PLP ROL ROR RTI RTS SBC SEC SED SEI STA STX STY TAX TAY TSX TXA TXS TYA";
  var official = {};
  OFFICIAL.split(" ").forEach(function (m) { official[m] = true; });

  var OPS = T.map(function (s, op) {
    var p = s.split(" "), m = p[0], mode = p[1];
    var doc = !!official[m] && !(m === "NOP" && op !== 0xEA) && op !== 0xEB;
    return { m: m, mode: mode, len: LEN[mode], doc: doc };
  });
  var LENGTHS = new Uint8Array(256);
  OPS.forEach(function (o, i) { LENGTHS[i] = o.len; });

  // ---------------------------------------------------------------- labels
  var LABELS = {
    0x0314: "CINV (IRQ vector)", 0x0315: "CINV+1", 0x0316: "CBINV (BRK vector)", 0x0317: "CBINV+1",
    0x0318: "NMINV (NMI vector)", 0x0319: "NMINV+1", 0x0001: "CPU port", 0x0000: "CPU port DDR",
    0xFFFA: "NMI vector", 0xFFFC: "reset vector", 0xFFFE: "IRQ vector",
    0xFF81: "CINT", 0xFF84: "IOINIT", 0xFF87: "RAMTAS", 0xFF8A: "RESTOR", 0xFF8D: "VECTOR", 0xFF90: "SETMSG",
    0xFF93: "SECOND", 0xFF96: "TKSA", 0xFF99: "MEMTOP", 0xFF9C: "MEMBOT", 0xFF9F: "SCNKEY", 0xFFA2: "SETTMO",
    0xFFA5: "ACPTR", 0xFFA8: "CIOUT", 0xFFAB: "UNTLK", 0xFFAE: "UNLSN", 0xFFB1: "LISTEN", 0xFFB4: "TALK",
    0xFFB7: "READST", 0xFFBA: "SETLFS", 0xFFBD: "SETNAM", 0xFFC0: "OPEN", 0xFFC3: "CLOSE", 0xFFC6: "CHKIN",
    0xFFC9: "CHKOUT", 0xFFCC: "CLRCHN", 0xFFCF: "CHRIN", 0xFFD2: "CHROUT", 0xFFD5: "LOAD", 0xFFD8: "SAVE",
    0xFFDB: "SETTIM", 0xFFDE: "RDTIM", 0xFFE1: "STOP", 0xFFE4: "GETIN", 0xFFE7: "CLALL", 0xFFEA: "UDTIM",
    0xFFED: "SCREEN", 0xFFF0: "PLOT", 0xFFF3: "IOBASE"
  };
  var VIC = ["sprite 0 X", "sprite 0 Y", "sprite 1 X", "sprite 1 Y", "sprite 2 X", "sprite 2 Y", "sprite 3 X", "sprite 3 Y",
    "sprite 4 X", "sprite 4 Y", "sprite 5 X", "sprite 5 Y", "sprite 6 X", "sprite 6 Y", "sprite 7 X", "sprite 7 Y",
    "sprite X bit 8", "control 1", "raster", "light pen X", "light pen Y", "sprite enable", "control 2", "sprite Y expand",
    "memory pointers", "IRQ flags", "IRQ mask", "sprite priority", "sprite multicolour", "sprite X expand",
    "sprite-sprite hit", "sprite-background hit", "border colour", "background 0", "background 1", "background 2",
    "background 3", "sprite multicolour 0", "sprite multicolour 1", "sprite 0 colour", "sprite 1 colour", "sprite 2 colour",
    "sprite 3 colour", "sprite 4 colour", "sprite 5 colour", "sprite 6 colour", "sprite 7 colour"];
  var SIDV = ["freq lo", "freq hi", "pulse lo", "pulse hi", "control", "attack/decay", "sustain/release"];
  var SIDX = ["filter cutoff lo", "filter cutoff hi", "resonance/routing", "volume/filter mode", "paddle X", "paddle Y", "OSC3", "ENV3"];
  var CIA = ["port A", "port B", "DDR A", "DDR B", "timer A lo", "timer A hi", "timer B lo", "timer B hi",
    "TOD tenths", "TOD seconds", "TOD minutes", "TOD hours", "serial data", "interrupt control", "control A", "control B"];

  function label(a) {
    if (LABELS[a]) return LABELS[a];
    if (a >= 0xD000 && a <= 0xD02E) return "VIC " + VIC[a - 0xD000];
    if (a >= 0xD400 && a <= 0xD41C) {
      var r = a - 0xD400;
      return r < 21 ? "SID voice " + ((r / 7 | 0) + 1) + " " + SIDV[r % 7] : "SID " + SIDX[r - 21];
    }
    if (a >= 0xDC00 && a <= 0xDC0F) return "CIA1 " + CIA[a - 0xDC00];
    if (a >= 0xDD00 && a <= 0xDD0F) return "CIA2 " + CIA[a - 0xDD00];
    if (a >= 0xD800 && a <= 0xDBE7) return "colour RAM";
    return "";
  }

  function hex(v, n) { return ("000" + v.toString(16).toUpperCase()).slice(-n); }

  // Disassemble the instruction at addr. peek(a) reads memory without side effects.
  function disassemble(peek, addr) {
    var op = peek(addr), o = OPS[op], b1 = peek((addr + 1) & 0xFFFF), b2 = peek((addr + 2) & 0xFFFF);
    var w = b1 | (b2 << 8), arg = "", target = -1, ref = -1;
    switch (o.mode) {
      case "imp": break;
      case "acc": arg = "A"; break;
      case "imm": arg = "#$" + hex(b1, 2); break;
      case "zp": arg = "$" + hex(b1, 2); ref = b1; break;
      case "zpx": arg = "$" + hex(b1, 2) + ",X"; break;
      case "zpy": arg = "$" + hex(b1, 2) + ",Y"; break;
      case "izx": arg = "($" + hex(b1, 2) + ",X)"; break;
      case "izy": arg = "($" + hex(b1, 2) + "),Y"; break;
      case "abs": arg = "$" + hex(w, 4); ref = w; if (o.m === "JMP" || o.m === "JSR") target = w; break;
      case "abx": arg = "$" + hex(w, 4) + ",X"; ref = w; break;
      case "aby": arg = "$" + hex(w, 4) + ",Y"; ref = w; break;
      case "ind": arg = "($" + hex(w, 4) + ")"; ref = w; break;
      case "rel": target = (addr + 2 + (b1 < 0x80 ? b1 : b1 - 256)) & 0xFFFF; arg = "$" + hex(target, 4); break;
    }
    var bytes = [op];
    if (o.len > 1) bytes.push(b1);
    if (o.len > 2) bytes.push(b2);
    var lab = "";
    if (target >= 0) lab = LABELS[target] || "";
    else if (ref >= 0) lab = label(ref);
    return { addr: addr, op: op, len: o.len, bytes: bytes, mnem: o.m, arg: arg, text: o.m + (arg ? " " + arg : ""),
      doc: o.doc, target: target, ref: ref, label: lab };
  }

  // Start of the instruction before addr (a best guess: code and data can overlap)
  function previous(peek, addr) {
    // prefer the start from which a chain of instructions lands exactly on addr
    for (var back = 12; back >= 1; back--) {
      var a = (addr - back) & 0xFFFF, prev = -1, guard = 0;
      while (a !== addr && guard++ < 16) {
        var l = LENGTHS[peek(a)];
        var next = (a + l) & 0xFFFF;
        if (((addr - a) & 0xFFFF) < l) break;      // jumps over addr
        prev = a; a = next;
      }
      if (a === addr && prev >= 0) return prev;
    }
    return (addr - 1) & 0xFFFF;
  }

  // ---------------------------------------------------------------- assembler
  // number: $hex or hex; +decimal; %binary. Returns { v, digits } or null.
  function parseNum(s) {
    s = s.trim();
    var m;
    if ((m = /^\+(\d+)$/.exec(s))) return { v: parseInt(m[1], 10), digits: m[1].length > 3 ? 4 : 2, dec: true };
    if ((m = /^%([01]+)$/.exec(s))) return { v: parseInt(m[1], 2), digits: m[1].length > 8 ? 4 : 2 };
    if ((m = /^\$?([0-9a-f]+)$/i.exec(s))) return { v: parseInt(m[1], 16), digits: m[1].length };
    if ((m = /^'(.)'$/.exec(s))) return { v: m[1].charCodeAt(0) & 0xFF, digits: 2 };
    return null;
  }

  var BY_MNEM = {};
  OPS.forEach(function (o, op) {
    var k = o.m + " " + o.mode;
    // documented opcodes first; the first undocumented one otherwise
    if (BY_MNEM[k] === undefined || (o.doc && !OPS[BY_MNEM[k]].doc)) BY_MNEM[k] = op;
  });
  function opcode(m, mode) { var v = BY_MNEM[m + " " + mode]; return v === undefined ? -1 : v; }

  // Assemble one instruction at addr: returns { bytes } or { error }
  function assemble(addr, line) {
    var s = line.trim().replace(/;.*$/, "").trim();
    var m = /^([a-z]{3})\s*(.*)$/i.exec(s);
    if (!m) return { error: "Expected an instruction like LDA #$01." };
    var mn = m[1].toUpperCase(), arg = m[2].replace(/\s+/g, "").toUpperCase();
    var known = OPS.some(function (o) { return o.m === mn; });
    if (!known) return { error: "Unknown instruction " + mn + "." };
    var r, op, mode = null, val = 0;
    if (arg === "") {
      op = opcode(mn, "imp");
      if (op < 0) op = opcode(mn, "acc");
      if (op < 0) return { error: mn + " needs an operand." };
      return { bytes: [op] };
    }
    if (arg === "A" && opcode(mn, "acc") >= 0) return { bytes: [opcode(mn, "acc")] };
    if ((r = /^#(.+)$/.exec(arg))) {
      var n = parseNum(r[1]);
      if (!n || n.v > 0xFF) return { error: "Immediate value must be a byte." };
      op = opcode(mn, "imm");
      if (op < 0) return { error: mn + " has no immediate mode." };
      return { bytes: [op, n.v] };
    }
    var forms = [
      [/^\((.+),X\)$/, "izx", null], [/^\((.+)\),Y$/, "izy", null], [/^\((.+)\)$/, "ind", null],
      [/^(.+),X$/, "zpx", "abx"], [/^(.+),Y$/, "zpy", "aby"], [/^(.+)$/, "zp", "abs"]
    ];
    for (var i = 0; i < forms.length; i++) {
      r = forms[i][0].exec(arg);
      if (!r) continue;
      var num = parseNum(r[1]);
      if (!num || num.v > 0xFFFF) return { error: "Cannot read the operand " + r[1] + "." };
      val = num.v;
      var small = forms[i][1], big = forms[i][2];
      if (opcode(mn, "rel") >= 0) {
        var off = val - ((addr + 2) & 0xFFFF);
        if (off < -128 || off > 127) return { error: "Branch target is out of range (" + off + " bytes)." };
        return { bytes: [opcode(mn, "rel"), off & 0xFF] };
      }
      if (big === null) {
        mode = small;
        if (mode !== "ind" && val > 0xFF) return { error: "Indirect indexed modes need a zero-page address." };
      } else if (val <= 0xFF && num.digits <= 2 && opcode(mn, small) >= 0) mode = small;
      else mode = big;
      op = opcode(mn, mode);
      if (op < 0 && mode === "zpy") { mode = "aby"; op = opcode(mn, mode); }     // LDA $10,Y -> LDA $0010,Y
      if (op < 0 && mode === "zp") { mode = "abs"; op = opcode(mn, mode); }
      if (op < 0) return { error: mn + " cannot be used with this addressing mode." };
      return { bytes: LEN[mode] === 2 ? [op, val & 0xFF] : [op, val & 0xFF, val >> 8] };
    }
    return { error: "Cannot read the operand." };
  }

  global.C64Disasm = {
    OPS: OPS, LENGTHS: LENGTHS, disassemble: disassemble, previous: previous, assemble: assemble,
    label: label, parseNum: parseNum, hex: hex
  };
})(typeof window !== "undefined" ? window : globalThis);
