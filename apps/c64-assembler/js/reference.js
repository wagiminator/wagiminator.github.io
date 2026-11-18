/* C64 Assembler: quick reference windows (instructions, memory, KERNAL, I/O registers, codes).
 * A floating window that stays open while you type; F1 in the editor looks up the word at the caret. */
(function (global) {
  "use strict";

  var A = global.Asm6502;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function h2(v) { return ("0" + v.toString(16).toUpperCase()).slice(-2); }
  function h4(v) { return ("000" + v.toString(16).toUpperCase()).slice(-4); }

  // ================================================================ instructions
  // base cycle counts of the NMOS 6510
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
  var MODES = {
    imp:  { s: "",         n: "Implied",              b: 1 },
    acc:  { s: "A",        n: "Accumulator",          b: 1 },
    imm:  { s: "#$nn",     n: "Immediate",            b: 2 },
    zp:   { s: "$nn",      n: "Zero page",            b: 2 },
    zpx:  { s: "$nn,X",    n: "Zero page, X",         b: 2 },
    zpy:  { s: "$nn,Y",    n: "Zero page, Y",         b: 2 },
    abs:  { s: "$nnnn",    n: "Absolute",             b: 3 },
    absx: { s: "$nnnn,X",  n: "Absolute, X",          b: 3 },
    absy: { s: "$nnnn,Y",  n: "Absolute, Y",          b: 3 },
    ind:  { s: "($nnnn)",  n: "Indirect",             b: 3 },
    indx: { s: "($nn,X)",  n: "Indexed indirect",     b: 2 },
    indy: { s: "($nn),Y",  n: "Indirect indexed",     b: 2 },
    rel:  { s: "label",    n: "Relative",             b: 2 }
  };
  var MODE_ORDER = ["imp", "acc", "imm", "zp", "zpx", "zpy", "abs", "absx", "absy", "ind", "indx", "indy", "rel"];
  var MODE_HELP = {
    imm: "the number itself", zp: "an address in $00–$FF: one byte shorter and one cycle faster",
    zpx: "address + X, stays in the zero page", zpy: "address + Y, stays in the zero page",
    abs: "any address", absx: "address + X", absy: "address + Y", ind: "only JMP: jumps to the address stored there",
    indx: "the pointer at $nn+X", indy: "the pointer at $nn and $nn+1, plus Y: the usual way to reach any address",
    rel: "branches: −128 to +127 bytes from the next instruction", acc: "shifts the accumulator", imp: "no operand"
  };
  // instructions that read their operand need one cycle more when the index crosses a page
  var READS = { adc: 1, and: 1, cmp: 1, eor: 1, lda: 1, ldx: 1, ldy: 1, ora: 1, sbc: 1, lax: 1, las: 1, nop: 1 };

  // g: group, n: name, o: operation, f: flags it changes, d: description
  var INS = {
    lda: { g: 0, n: "Load A", o: "A = M", f: "NZ" },
    ldx: { g: 0, n: "Load X", o: "X = M", f: "NZ" },
    ldy: { g: 0, n: "Load Y", o: "Y = M", f: "NZ" },
    sta: { g: 0, n: "Store A", o: "M = A", f: "", d: "Changes no flags." },
    stx: { g: 0, n: "Store X", o: "M = X", f: "" },
    sty: { g: 0, n: "Store Y", o: "M = Y", f: "" },
    tax: { g: 1, n: "Transfer A to X", o: "X = A", f: "NZ" },
    tay: { g: 1, n: "Transfer A to Y", o: "Y = A", f: "NZ" },
    txa: { g: 1, n: "Transfer X to A", o: "A = X", f: "NZ" },
    tya: { g: 1, n: "Transfer Y to A", o: "A = Y", f: "NZ" },
    tsx: { g: 1, n: "Stack pointer to X", o: "X = S", f: "NZ", d: "The stack is at $0100–$01FF; S points to the next free byte." },
    txs: { g: 1, n: "X to stack pointer", o: "S = X", f: "", d: "Changes no flags. <code>ldx #$ff</code> and <code>txs</code> empty the stack." },
    pha: { g: 2, n: "Push A", o: "push A", f: "" },
    php: { g: 2, n: "Push status", o: "push P", f: "", d: "The copy on the stack has B and bit 5 set." },
    pla: { g: 2, n: "Pull A", o: "pull A", f: "NZ" },
    plp: { g: 2, n: "Pull status", o: "pull P", f: "NVDIZC" },
    adc: { g: 3, n: "Add with carry", o: "A = A + M + C", f: "NVZC", d: "Clear C with <code>clc</code> before the low byte; C carries into the next byte. V is set when a signed result does not fit in −128 to 127. After <code>sed</code> the bytes count as decimal (BCD)." },
    sbc: { g: 3, n: "Subtract with carry", o: "A = A − M − (1 − C)", f: "NVZC", d: "Set C with <code>sec</code> before the low byte. C = 0 afterwards means a borrow: the result went below zero." },
    inc: { g: 4, n: "Increment memory", o: "M = M + 1", f: "NZ", d: "$FF becomes $00 (Z set); C stays as it is." },
    inx: { g: 4, n: "Increment X", o: "X = X + 1", f: "NZ" },
    iny: { g: 4, n: "Increment Y", o: "Y = Y + 1", f: "NZ" },
    dec: { g: 4, n: "Decrement memory", o: "M = M − 1", f: "NZ" },
    dex: { g: 4, n: "Decrement X", o: "X = X − 1", f: "NZ", d: "With <code>bne</code> a loop counter: the loop ends when X reaches 0." },
    dey: { g: 4, n: "Decrement Y", o: "Y = Y − 1", f: "NZ" },
    and: { g: 5, n: "And", o: "A = A & M", f: "NZ", d: "Keeps the bits that are 1 in both: <code>and #$0f</code> keeps the low four bits." },
    ora: { g: 5, n: "Or", o: "A = A | M", f: "NZ", d: "Sets bits: <code>ora #$80</code> sets bit 7." },
    eor: { g: 5, n: "Exclusive or", o: "A = A ^ M", f: "NZ", d: "Flips bits: <code>eor #$ff</code> inverts all of them." },
    bit: { g: 5, n: "Test bits", o: "Z = (A & M) = 0, N = M bit 7, V = M bit 6", f: "NVZ", d: "Tests a byte without changing A. Often used for bit 7 and bit 6 of a register: <code>bit $d011</code> then <code>bmi</code>." },
    asl: { g: 6, n: "Shift left", o: "C ← [7…0] ← 0", f: "NZC", d: "Doubles the value; bit 7 goes into C." },
    lsr: { g: 6, n: "Shift right", o: "0 → [7…0] → C", f: "NZC", d: "Halves the value (without sign); bit 0 goes into C." },
    rol: { g: 6, n: "Rotate left", o: "C ← [7…0] ← C", f: "NZC", d: "Like ASL, but the old C goes into bit 0: for numbers longer than one byte." },
    ror: { g: 6, n: "Rotate right", o: "C → [7…0] → C", f: "NZC", d: "Like LSR, but the old C goes into bit 7." },
    cmp: { g: 7, n: "Compare A", o: "A − M", f: "NZC", d: "Sets the flags like a subtraction, A stays. Then: <code>beq</code> equal, <code>bne</code> not equal, <code>bcs</code> A ≥ M, <code>bcc</code> A &lt; M (without sign)." },
    cpx: { g: 7, n: "Compare X", o: "X − M", f: "NZC" },
    cpy: { g: 7, n: "Compare Y", o: "Y − M", f: "NZC" },
    bcc: { g: 8, n: "Branch if carry clear", o: "if C = 0", f: "", d: "After a compare: less than (without sign)." },
    bcs: { g: 8, n: "Branch if carry set", o: "if C = 1", f: "", d: "After a compare: greater or equal (without sign)." },
    beq: { g: 8, n: "Branch if equal", o: "if Z = 1", f: "", d: "The last result was zero, or a compare found the two values equal." },
    bne: { g: 8, n: "Branch if not equal", o: "if Z = 0", f: "" },
    bmi: { g: 8, n: "Branch if minus", o: "if N = 1", f: "", d: "Bit 7 of the last result is set." },
    bpl: { g: 8, n: "Branch if plus", o: "if N = 0", f: "" },
    bvc: { g: 8, n: "Branch if overflow clear", o: "if V = 0", f: "" },
    bvs: { g: 8, n: "Branch if overflow set", o: "if V = 1", f: "" },
    jmp: { g: 9, n: "Jump", o: "PC = address", f: "", d: "<code>jmp ($nnnn)</code> jumps to the address stored at $nnnn. Careful: at $xxFF the high byte is read from $xx00 of the same page." },
    jsr: { g: 9, n: "Jump to subroutine", o: "push PC − 1, PC = address", f: "", d: "Puts the return address on the stack; RTS comes back to the instruction after it." },
    rts: { g: 9, n: "Return from subroutine", o: "pull PC, PC + 1", f: "", d: "At the end of a program started with SYS it goes back to BASIC." },
    rti: { g: 9, n: "Return from interrupt", o: "pull P, pull PC", f: "NVDIZC" },
    brk: { g: 9, n: "Break", o: "push PC + 2, push P, I = 1", f: "I", d: "A software interrupt through $FFFE. The C64 then jumps through the vector at $0316; in BASIC it ends up in the monitor or a READY prompt." },
    clc: { g: 10, n: "Clear carry", o: "C = 0", f: "C" },
    sec: { g: 10, n: "Set carry", o: "C = 1", f: "C" },
    cld: { g: 10, n: "Clear decimal", o: "D = 0", f: "D" },
    sed: { g: 10, n: "Set decimal", o: "D = 1", f: "D", d: "ADC and SBC then count in BCD: $09 + $01 = $10." },
    cli: { g: 10, n: "Allow interrupts", o: "I = 0", f: "I" },
    sei: { g: 10, n: "Block interrupts", o: "I = 1", f: "I", d: "Stops IRQs (the KERNAL's keyboard and clock, raster interrupts). An NMI still comes through." },
    clv: { g: 10, n: "Clear overflow", o: "V = 0", f: "V" },
    nop: { g: 11, n: "No operation", o: "", f: "", d: "Waits 2 cycles. Undocumented forms with an operand skip 1 or 2 bytes." }
  };
  var ILL = {
    slo: { n: "ASL, then ORA", o: "M = M << 1, A = A | M", f: "NZC" },
    rla: { n: "ROL, then AND", o: "M = rol M, A = A & M", f: "NZC" },
    sre: { n: "LSR, then EOR", o: "M = M >> 1, A = A ^ M", f: "NZC" },
    rra: { n: "ROR, then ADC", o: "M = ror M, A = A + M + C", f: "NVZC" },
    sax: { n: "Store A and X", o: "M = A & X", f: "" },
    lax: { n: "Load A and X", o: "A = X = M", f: "NZ", d: "<code>lax #imm</code> is unstable on a real C64." },
    dcp: { n: "DEC, then CMP", o: "M = M − 1, A − M", f: "NZC" },
    isc: { n: "INC, then SBC", o: "M = M + 1, A = A − M − (1 − C)", f: "NVZC", d: "Also written ISB." },
    anc: { n: "AND, C = bit 7", o: "A = A & #, C = N", f: "NZC" },
    alr: { n: "AND, then LSR", o: "A = (A & #) >> 1", f: "NZC", d: "Also written ASR." },
    arr: { n: "AND, then ROR", o: "A = ror (A & #)", f: "NVZC", d: "C and V come out differently from a plain ROR." },
    sbx: { n: "X = (A & X) − #", o: "X = (A & X) − #", f: "NZC", d: "Also written AXS. C as after a compare." },
    las: { n: "Load A, X and S", o: "A = X = S = M & S", f: "NZ" },
    ane: { n: "Unstable", o: "A = (A | ?) & X & #", f: "NZ", d: "Also written XAA. The result depends on the chip." },
    sha: { n: "Unstable store", o: "M = A & X & (high byte + 1)", f: "" },
    shx: { n: "Unstable store", o: "M = X & (high byte + 1)", f: "" },
    shy: { n: "Unstable store", o: "M = Y & (high byte + 1)", f: "" },
    tas: { n: "Unstable", o: "S = A & X, M = S & (high byte + 1)", f: "" },
    jam: { n: "Halt", o: "", f: "", d: "Stops the processor until a reset." }
  };
  var GROUPS = ["Load and store", "Transfer", "Stack", "Add and subtract", "Increment and decrement", "Logic", "Shift and rotate",
    "Compare", "Branch", "Jump and subroutine", "Flags", "Other"];

  function modesOf(mn, ops) {
    var o = ops[mn] || {}, list = [];
    MODE_ORDER.forEach(function (m) {
      if (o[m] == null) return;
      if (m === "imp" && o.acc != null) return;
      list.push({ m: m, op: o[m] });
    });
    if (mn === "nop") {
      [[0x80, "imm"], [0x04, "zp"], [0x14, "zpx"], [0x0C, "abs"], [0x1C, "absx"]].forEach(function (p) { list.push({ m: p[1], op: p[0], ill: true }); });
    }
    return list;
  }
  function cycles(mn, m, op) {
    var c = CYC[op];
    if (m === "rel") return c + " <small>+1 taken, +2 to another page</small>";
    if (READS[mn] && (m === "absx" || m === "absy" || m === "indy")) return c + " <small>+1 page</small>";
    return String(c);
  }
  function flagCells(f) {
    return "NVDIZC".split("").map(function (k) { return '<i' + (f.indexOf(k) >= 0 ? ' class="on"' : "") + ">" + k + "</i>"; }).join("");
  }
  function insHTML(mn, e, ops, ill) {
    var rows = modesOf(mn, ops).map(function (x) {
      var mo = MODES[x.m], syn = (mn + " " + mo.s).trim();
      return "<tr" + (x.ill ? ' class="dim"' : "") + "><td><code>" + esc(syn) + "</code></td><td>" + mo.n + (x.ill ? " <small>undoc.</small>" : "") +
        "</td><td>$" + h2(x.op) + "</td><td>" + mo.b + "</td><td>" + cycles(mn, x.m, x.op) + "</td></tr>";
    }).join("");
    return '<details class="ins" data-mn="' + mn + '" data-q="' + esc((mn + " " + e.n + " " + e.o).toLowerCase()) + '">' +
      '<summary><b class="mn' + (ill ? " ill" : "") + '">' + mn.toUpperCase() + '</b><span class="nm">' + esc(e.n) + '</span>' +
      '<span class="fl" title="Flags it changes">' + flagCells(e.f) + "</span></summary>" +
      '<div class="ins-body">' + (e.o ? '<p class="opn"><code>' + esc(e.o) + "</code></p>" : "") + (e.d ? "<p>" + e.d + "</p>" : "") +
      '<table class="rt modes"><thead><tr><th>Syntax</th><th>Mode</th><th>Opcode</th><th>Bytes</th><th>Cycles</th></tr></thead><tbody>' + rows + "</tbody></table></div></details>";
  }
  function tabInstructions() {
    var html = '<p class="lead">Click an instruction for its addressing modes, opcodes and cycles. The flags it changes are marked: ' +
      "<b>N</b> negative (bit 7), <b>V</b> overflow, <b>D</b> decimal, <b>I</b> interrupts blocked, <b>Z</b> zero, <b>C</b> carry.</p>";
    GROUPS.forEach(function (g, gi) {
      var list = Object.keys(INS).filter(function (k) { return INS[k].g === gi; });
      html += '<section class="rg"><h3>' + g + "</h3>" + list.map(function (k) { return insHTML(k, INS[k], A.OPS); }).join("") + "</section>";
    });
    html += '<section class="rg"><h3>Addressing modes</h3><table class="rt"><tbody>' +
      MODE_ORDER.filter(function (m) { return m !== "imp"; }).map(function (m) {
        return '<tr data-q="' + esc((MODES[m].n + " " + MODES[m].s).toLowerCase()) + '"><td><code>' + MODES[m].s + "</code></td><td>" + MODES[m].n + "</td><td>" + MODE_HELP[m] + "</td></tr>";
      }).join("") + "</tbody></table></section>";
    html += '<section class="rg"><h3>Undocumented opcodes</h3><p class="note">The 6510 also runs these opcodes. The assembler knows them unless the source says <code>.cpu "6502"</code>. The unstable ones behave differently from one C64 to another.</p>' +
      Object.keys(ILL).map(function (k) { return insHTML(k, ILL[k], A.ILLEGAL, true); }).join("") + "</section>";
    return html;
  }

  // ================================================================ address tables
  // rows: [address, end or 0, name or "", description, insert: true when NAME = $addr makes sense]
  function addrTable(rows, cols) {
    return '<table class="rt addr"><tbody>' + rows.map(function (r) {
      var a = r[0], e = r[1] || a, name = r[2] || "", ins = r[4] !== false && name && !/[ –]/.test(name);
      var bits = Array.isArray(r[4]) ? r[4] : null;
      var ad = "$" + h4(a) + (r[1] ? "–$" + h4(r[1]) : "");
      return '<tr data-a="' + a + '" data-e="' + e + '" data-n="' + esc(name) + '" data-q="' + esc((ad + " " + h4(a) + " " + a + " " + name + " " + r[3].replace(/<[^>]+>/g, "") + (bits ? " " + bits.map(function (b) { return b[1]; }).join(" ") : "")).toLowerCase()) + '">' +
        '<td class="ad">' + ad + '</td><td class="nmc">' + (name ? "<code>" + esc(name) + "</code>" : "") + "</td><td>" + r[3] +
        (bits ? '<table class="bits"><tbody>' + bits.map(function (b) { return "<tr><th>" + b[0] + "</th><td>" + b[1] + "</td></tr>"; }).join("") + "</tbody></table>" : "") + "</td>" +
        '<td class="ins-c">' + (ins ? '<button type="button" class="put" data-put="' + esc(name) + '" title="Insert ' + esc(name) + " = $" + h4(a).toLowerCase() + ' into the code" aria-label="Insert ' + esc(name) + '">+</button>' : "") + "</td></tr>";
    }).join("") + "</tbody></table>";
  }

  var MEMMAP = [
    [0x0000, 0, "D6510", "Data direction of the processor port", false],
    [0x0001, 0, "R6510", "Processor port: which ROMs and I/O the processor sees (see below)"],
    [0x0002, 0x00FF, "", "Zero page: fast addresses and pointers; BASIC and the KERNAL use most of it"],
    [0x0100, 0x01FF, "", "Stack"],
    [0x0200, 0x03FF, "", "KERNAL and BASIC work area, vectors, tape buffer"],
    [0x0400, 0x07E7, "SCREEN", "Screen memory: 40 × 25 characters (screen codes)"],
    [0x07F8, 0x07FF, "SPRPTR", "Sprite pointers: sprite data at pointer × 64"],
    [0x0800, 0x9FFF, "", "BASIC programs (from $0801), free when no BASIC is needed"],
    [0xA000, 0xBFFF, "", "BASIC ROM, RAM below it"],
    [0xC000, 0xCFFF, "", "Free RAM, 4 KB: a good place for machine code"],
    [0xD000, 0xD3FF, "VIC", "VIC-II video chip (or character ROM, or RAM)"],
    [0xD400, 0xD7FF, "SID", "SID sound chip"],
    [0xD800, 0xDBE7, "COLRAM", "Colour RAM: one colour for each character on the screen (low 4 bits)"],
    [0xDC00, 0xDCFF, "CIA1", "CIA 1: keyboard, joysticks, IRQ timer"],
    [0xDD00, 0xDDFF, "CIA2", "CIA 2: VIC bank, serial bus, user port, NMI timer"],
    [0xDE00, 0xDFFF, "", "I/O 1 and 2 for cartridges"],
    [0xE000, 0xFFFF, "", "KERNAL ROM, RAM below it"],
    [0xFFFA, 0xFFFB, "NMIVEC", "Processor NMI vector (RESTORE key, CIA 2)"],
    [0xFFFC, 0xFFFD, "RESVEC", "Processor reset vector"],
    [0xFFFE, 0xFFFF, "IRQVEC", "Processor IRQ and BRK vector"]
  ];
  var ZP = [
    [0x0002, 0, "", "Free"],
    [0x002B, 0x002C, "TXTTAB", "Start of the BASIC program"],
    [0x002D, 0x002E, "VARTAB", "End of the BASIC program, start of the variables"],
    [0x0037, 0x0038, "MEMSIZ", "Top of the memory BASIC uses"],
    [0x0090, 0, "STATUS", "I/O status (ST in BASIC)"],
    [0x0091, 0, "STKEY", "RUN/STOP key: $7F while pressed"],
    [0x00A0, 0x00A2, "TIME", "Jiffy clock: counts 60 times a second ($A2 lowest byte)"],
    [0x00BA, 0, "FA", "Current device number"],
    [0x00C5, 0, "LSTX", "Matrix code of the last key (64: none)"],
    [0x00C6, 0, "NDX", "Number of characters in the keyboard buffer"],
    [0x00CB, 0, "SFDX", "Matrix code of the key held now (64: none)"],
    [0x00CC, 0, "BLNSW", "Cursor blink: 0 blinks"],
    [0x00D1, 0x00D2, "PNT", "Address of the cursor's line in screen memory"],
    [0x00D3, 0, "PNTR", "Cursor column"],
    [0x00D6, 0, "TBLX", "Cursor row"],
    [0x00F3, 0x00F4, "USER", "Address of the cursor's line in colour RAM"],
    [0x00FB, 0x00FE, "", "Free: four bytes for your own pointers"],
    [0x0277, 0x0280, "KEYD", "Keyboard buffer (10 characters)"],
    [0x0286, 0, "COLOR", "Colour of the text the KERNAL prints"],
    [0x0288, 0, "HIBASE", "High byte of the screen memory the KERNAL writes to ($04)"],
    [0x028A, 0, "RPTFLG", "Key repeat: $80 all keys, $40 none"],
    [0x028D, 0, "SHFLAG", "Shift keys: bit 0 SHIFT, bit 1 C=, bit 2 CTRL"],
    [0x0291, 0, "MODE", "$80 stops SHIFT + C= from switching the character set"],
    [0x033C, 0x03FB, "TBUFFR", "Tape buffer: free when no tape is used"]
  ];
  var VECTORS = [
    [0x0314, 0x0315, "CINV", "IRQ: the KERNAL's interrupt routine ($EA31); point it to your own"],
    [0x0316, 0x0317, "CBINV", "BRK instruction"],
    [0x0318, 0x0319, "NMINV", "NMI: RESTORE key and CIA 2"],
    [0x031A, 0x031B, "IOPEN", "OPEN"],
    [0x031C, 0x031D, "ICLOSE", "CLOSE"],
    [0x031E, 0x031F, "ICHKIN", "CHKIN"],
    [0x0320, 0x0321, "ICKOUT", "CHKOUT"],
    [0x0322, 0x0323, "ICLRCH", "CLRCHN"],
    [0x0324, 0x0325, "IBASIN", "CHRIN"],
    [0x0326, 0x0327, "IBSOUT", "CHROUT"],
    [0x0328, 0x0329, "ISTOP", "STOP"],
    [0x032A, 0x032B, "IGETIN", "GETIN"],
    [0x032C, 0x032D, "ICLALL", "CLALL"],
    [0x0330, 0x0331, "ILOAD", "LOAD"],
    [0x0332, 0x0333, "ISAVE", "SAVE"]
  ];
  var BANKS = [
    ["$37", "BASIC", "I/O", "KERNAL", "after power on"],
    ["$36", "RAM", "I/O", "KERNAL", "no BASIC: 8 KB more RAM"],
    ["$35", "RAM", "I/O", "RAM", "only I/O: your own IRQ vector at $FFFE"],
    ["$34", "RAM", "RAM", "RAM", "all RAM (keep SEI on)"],
    ["$33", "BASIC", "Char ROM", "KERNAL", "read the character set"],
    ["$32", "RAM", "Char ROM", "KERNAL", ""],
    ["$31", "RAM", "Char ROM", "RAM", ""],
    ["$30", "RAM", "RAM", "RAM", ""]
  ];
  function tabMemory() {
    var html = '<section class="rg"><h3>Memory map</h3>' + addrTable(MEMMAP) + "</section>";
    html += '<section class="rg"><h3>Banking with $01</h3><p class="note">Bit 0 switches BASIC, bit 1 the KERNAL (and BASIC), bit 2 chooses I/O or the character ROM. Writes always go to the RAM below a ROM.</p>' +
      '<table class="rt"><thead><tr><th>$01</th><th>$A000</th><th>$D000</th><th>$E000</th><th></th></tr></thead><tbody>' +
      BANKS.map(function (b) { return '<tr data-q="' + esc(b.join(" ").toLowerCase()) + '"><td class="ad">' + b[0] + "</td><td>" + b[1] + "</td><td>" + b[2] + "</td><td>" + b[3] + "</td><td>" + b[4] + "</td></tr>"; }).join("") +
      "</tbody></table></section>";
    html += '<section class="rg"><h3>What the VIC-II sees</h3><p class="note">The VIC-II sees one 16 KB bank, chosen with bits 0 and 1 of $DD00. In banks 0 and 2 it sees the character ROM at $1000–$1FFF (or $9000–$9FFF) instead of RAM.</p>' +
      '<table class="rt"><thead><tr><th>$DD00 bits 1–0</th><th>Bank</th></tr></thead><tbody>' +
      [["%11", "$0000–$3FFF (after power on)"], ["%10", "$4000–$7FFF"], ["%01", "$8000–$BFFF"], ["%00", "$C000–$FFFF"]].map(function (b) {
        return '<tr data-q="vic bank dd00 ' + b[1].toLowerCase() + '"><td class="ad">' + b[0] + "</td><td>" + b[1] + "</td></tr>";
      }).join("") + "</tbody></table>" +
      '<p class="note">$D018 places the data in the bank: bits 7–4 × $0400 is the screen, bits 3–1 × $0800 the character set (in bitmap mode bit 3 chooses $0000 or $2000 for the bitmap). After power on $D018 is $15: screen at $0400, characters from the ROM at $1000.</p></section>';
    html += '<section class="rg"><h3>Zero page and work area</h3>' + addrTable(ZP) + "</section>";
    html += '<section class="rg"><h3>Vectors</h3><p class="note">Change a vector with SEI before and CLI after, so that no interrupt uses half of it.</p>' + addrTable(VECTORS) + "</section>";
    return html;
  }

  // ================================================================ KERNAL
  // [address, name, what it does, in, out]
  var KERNAL = [
    [0xFFD2, "CHROUT", "Prints a character (or sends it to the output file)", "A = character", ""],
    [0xFFE4, "GETIN", "Takes a character from the keyboard buffer", "", "A = character, 0 if none"],
    [0xFFCF, "CHRIN", "Reads a character from the input; from the keyboard a whole line is typed first", "", "A = character"],
    [0xFFF0, "PLOT", "Reads or sets the cursor position", "C = 1 read; C = 0 set from X, Y", "X = row, Y = column"],
    [0xFFE1, "STOP", "Checks the RUN/STOP key", "", "Z = 1 when pressed"],
    [0xFF9F, "SCNKEY", "Scans the keyboard into the buffer (the IRQ does it normally)", "", ""],
    [0xFFDE, "RDTIM", "Reads the jiffy clock", "", "A = low, X = middle, Y = high byte"],
    [0xFFDB, "SETTIM", "Sets the jiffy clock", "A = low, X = middle, Y = high byte", ""],
    [0xFFEA, "UDTIM", "Counts the jiffy clock on (the IRQ does it)", "", ""],
    [0xFFED, "SCREEN", "Size of the screen", "", "X = 40 columns, Y = 25 rows"],
    [0xFFBA, "SETLFS", "Sets file number, device and secondary address", "A = file, X = device (8: disk), Y = secondary address", ""],
    [0xFFBD, "SETNAM", "Sets the file name", "A = length, X/Y = address (low/high)", ""],
    [0xFFC0, "OPEN", "Opens the file set with SETLFS and SETNAM", "", "C = 1 on error, A = error"],
    [0xFFC3, "CLOSE", "Closes a file", "A = file", ""],
    [0xFFC6, "CHKIN", "Takes input from a file", "X = file", "C = 1 on error"],
    [0xFFC9, "CHKOUT", "Sends output to a file", "X = file", "C = 1 on error"],
    [0xFFCC, "CLRCHN", "Back to keyboard and screen", "", ""],
    [0xFFE7, "CLALL", "Closes all files", "", ""],
    [0xFFB7, "READST", "Reads the I/O status", "", "A = status (bit 6: end of file)"],
    [0xFFD5, "LOAD", "Loads a file (SETLFS, SETNAM first)", "A = 0 load, 1 verify; X/Y = address when the secondary address is 0", "X/Y = end address, C = 1 on error"],
    [0xFFD8, "SAVE", "Saves memory to a file", "A = zero-page address of the start pointer, X/Y = end + 1", "C = 1 on error"],
    [0xFF90, "SETMSG", "Turns KERNAL messages on or off", "A: bit 7 errors, bit 6 messages like SEARCHING", ""],
    [0xFF81, "CINT", "Sets up the VIC-II and the screen editor, clears the screen", "", ""],
    [0xFF84, "IOINIT", "Sets up the CIAs, the SID volume and the IRQ timer", "", ""],
    [0xFF87, "RAMTAS", "Tests the RAM, sets the tape buffer and screen address", "", ""],
    [0xFF8A, "RESTOR", "Sets the vectors $0314–$0333 back", "", ""],
    [0xFF8D, "VECTOR", "Copies the vectors $0314–$0333 to or from a table", "C = 1 read, C = 0 set; X/Y = table", ""],
    [0xFF99, "MEMTOP", "Reads or sets the top of RAM", "C = 1 read, C = 0 set from X/Y", "X/Y = address"],
    [0xFF9C, "MEMBOT", "Reads or sets the bottom of RAM", "C = 1 read, C = 0 set from X/Y", "X/Y = address"],
    [0xFFF3, "IOBASE", "Address of the I/O chips", "", "X/Y = $DC00"],
    [0xFFB1, "LISTEN", "Serial bus: a device listens", "A = device", ""],
    [0xFF93, "SECOND", "Secondary address after LISTEN", "A = secondary address", ""],
    [0xFFB4, "TALK", "Serial bus: a device talks", "A = device", ""],
    [0xFF96, "TKSA", "Secondary address after TALK", "A = secondary address", ""],
    [0xFFA5, "ACPTR", "Reads a byte from the serial bus", "", "A = byte"],
    [0xFFA8, "CIOUT", "Sends a byte to the serial bus", "A = byte", ""],
    [0xFFAB, "UNTLK", "Serial bus: the device stops talking", "", ""],
    [0xFFAE, "UNLSN", "Serial bus: devices stop listening", "", ""],
    [0xFFA2, "SETTMO", "Timeout for IEEE cards", "A = flag", ""]
  ];
  var ROMEXTRA = [
    [0xEA31, "IRQ_KERNAL", "The KERNAL's IRQ routine: clock, cursor, keyboard. End your own IRQ routine with <code>jmp $ea31</code>"],
    [0xEA81, "IRQ_RETURN", "Ends an IRQ: restores Y, X, A and returns. <code>jmp $ea81</code> skips the KERNAL's work"],
    [0xE544, "CLRSCR", "Clears the screen"],
    [0xE566, "HOME", "Puts the cursor in the top left corner"]
  ];
  function tabKernal() {
    var html = '<p class="lead">The KERNAL jump table: these addresses stay the same in every C64 ROM. Call them with <code>jsr</code>; they may change A, X and Y.</p>' +
      '<section class="rg"><h3>Jump table</h3><table class="rt addr kern"><tbody>' + KERNAL.map(function (k) {
        return '<tr data-a="' + k[0] + '" data-e="' + (k[0] + 2) + '" data-n="' + k[1] + '" data-q="' + esc(("$" + h4(k[0]) + " " + k[0] + " " + k.slice(1).join(" ")).toLowerCase()) + '">' +
          '<td class="ad">$' + h4(k[0]) + '</td><td class="nmc"><code>' + k[1] + "</code></td><td>" + k[2] +
          (k[3] ? '<span class="io"><b>In</b> ' + esc(k[3]) + "</span>" : "") + (k[4] ? '<span class="io"><b>Out</b> ' + esc(k[4]) + "</span>" : "") + "</td>" +
          '<td class="ins-c"><button type="button" class="put" data-put="' + k[1] + '" title="Insert ' + k[1] + " = $" + h4(k[0]).toLowerCase() + ' into the code" aria-label="Insert ' + k[1] + '">+</button></td></tr>';
      }).join("") + "</tbody></table></section>";
    html += '<section class="rg"><h3>Other ROM addresses</h3><p class="note">Not part of the jump table, but used by many programs; they work in the original ROM and in the Open ROMs of this C64.</p>' +
      addrTable(ROMEXTRA.map(function (r) { return [r[0], 0, r[1], r[2]]; })) + "</section>";
    html += '<section class="rg"><h3>Example</h3><pre class="ex">CHROUT  = $ffd2\n        lda #"a"\n        jsr CHROUT      ; prints A\n\nPLOT    = $fff0\n        ldx #10         ; row\n        ldy #5          ; column\n        clc\n        jsr PLOT        ; cursor to row 10, column 5</pre></section>';
    return html;
  }

  // ================================================================ I/O registers
  // rows may carry a bit list: [address, end, name, description, [[bits, meaning], ...]]
  var VIC = [];
  for (var sp = 0; sp < 8; sp++) {
    VIC.push([0xD000 + 2 * sp, 0, "SP" + sp + "X", "Sprite " + sp + " X position, low 8 bits (bit 8 in $D010)"]);
    VIC.push([0xD001 + 2 * sp, 0, "SP" + sp + "Y", "Sprite " + sp + " Y position"]);
  }
  VIC = VIC.concat([
    [0xD010, 0, "MSIGX", "Bit 8 of the X positions, one bit per sprite (X from 0 to 511)"],
    [0xD011, 0, "SCROLY", "Control register 1", [["7", "Raster line bit 8 (read: the line now; write: the line of the raster interrupt)"], ["6", "Extended background colours"], ["5", "Bitmap mode"], ["4", "Screen on (0: only the border colour; the processor runs faster)"], ["3", "25 rows (0: 24 rows)"], ["2–0", "Vertical fine scroll (3 after power on)"]]],
    [0xD012, 0, "RASTER", "Raster line, bits 7–0. Read: the line being drawn now. Write: the line for the raster interrupt. PAL lines 0–311; the text area is lines 51–250"],
    [0xD013, 0, "LPENX", "Light pen X (half the pixel position)"],
    [0xD014, 0, "LPENY", "Light pen Y"],
    [0xD015, 0, "SPENA", "Sprites on, one bit per sprite"],
    [0xD016, 0, "SCROLX", "Control register 2", [["4", "Multicolour mode"], ["3", "40 columns (0: 38 columns, for side scrolling)"], ["2–0", "Horizontal fine scroll"]]],
    [0xD017, 0, "YXPAND", "Sprites twice as high, one bit per sprite"],
    [0xD018, 0, "VMCSB", "Where the VIC-II finds its data in its 16 KB bank", [["7–4", "Screen memory at n × $0400 ($1x: $0400)"], ["3–1", "Character set at n × $0800 (%010: $1000, the ROM characters)"], ["3", "In bitmap mode: bitmap at $0000 (0) or $2000 (1)"]]],
    [0xD019, 0, "VICIRQ", "Interrupt flags. Write 1 to a bit to acknowledge it, or the interrupt comes again at once", [["7", "One of the interrupts below happened"], ["3", "Light pen"], ["2", "Sprite–sprite collision"], ["1", "Sprite–background collision"], ["0", "Raster line reached"]]],
    [0xD01A, 0, "IRQMSK", "Interrupts on, same bits as $D019", [["3", "Light pen"], ["2", "Sprite–sprite collision"], ["1", "Sprite–background collision"], ["0", "Raster line"]]],
    [0xD01B, 0, "SPBGPR", "Sprites behind the background graphics, one bit per sprite"],
    [0xD01C, 0, "SPMC", "Multicolour sprites, one bit per sprite"],
    [0xD01D, 0, "XXPAND", "Sprites twice as wide, one bit per sprite"],
    [0xD01E, 0, "SPSPCL", "Sprites that touched another sprite (reading clears it)"],
    [0xD01F, 0, "SPBGCL", "Sprites that touched the background (reading clears it)"],
    [0xD020, 0, "EXTCOL", "Border colour"],
    [0xD021, 0, "BGCOL0", "Background colour"],
    [0xD022, 0, "BGCOL1", "Background colour 1: multicolour text and extended colours"],
    [0xD023, 0, "BGCOL2", "Background colour 2"],
    [0xD024, 0, "BGCOL3", "Background colour 3: extended colours"],
    [0xD025, 0, "SPMC0", "Sprite multicolour 0 (bit pair %01)"],
    [0xD026, 0, "SPMC1", "Sprite multicolour 1 (bit pair %11)"]
  ]);
  for (sp = 0; sp < 8; sp++) VIC.push([0xD027 + sp, 0, "SP" + sp + "COL", "Sprite " + sp + " colour (bit pair %10 in multicolour)"]);
  var GFX = [
    ["Text", "0", "0", "0", "40 × 25 characters; colour RAM gives each its colour"],
    ["Multicolour text", "0", "0", "1", "Characters with colour bit 3 set have 4 × 8 double-wide pixels: %00 $D021, %01 $D022, %10 $D023, %11 colour RAM (bits 2–0)"],
    ["Extended colour", "1", "0", "0", "Bits 7–6 of the screen code choose the background $D021–$D024; 64 characters"],
    ["Bitmap", "0", "1", "0", "320 × 200 pixels. Screen memory: high nibble the colour of 1 bits, low nibble of 0 bits"],
    ["Multicolour bitmap", "0", "1", "1", "160 × 200 pixels: %00 $D021, %01 screen high nibble, %10 screen low nibble, %11 colour RAM"]
  ];
  function sidVoice(n, base) {
    return [
      [base, 0, "FRELO" + n, "Voice " + n + " frequency, low byte. Value = frequency in Hz × 17.03 (PAL)"],
      [base + 1, 0, "FREHI" + n, "Voice " + n + " frequency, high byte"],
      [base + 2, 0, "PWLO" + n, "Voice " + n + " pulse width, low byte"],
      [base + 3, 0, "PWHI" + n, "Voice " + n + " pulse width, bits 3–0 high nibble ($0800: square wave)"],
      [base + 4, 0, "VCREG" + n, "Voice " + n + " control", [["7", "Noise"], ["6", "Pulse"], ["5", "Sawtooth"], ["4", "Triangle"], ["3", "Test: stops and resets the oscillator"], ["2", "Ring modulation with voice " + (n === 1 ? 3 : n - 1)], ["1", "Sync with voice " + (n === 1 ? 3 : n - 1)], ["0", "Gate: 1 starts the note (attack, decay, sustain), 0 releases it"]]],
      [base + 5, 0, "ATDCY" + n, "Voice " + n + " envelope", [["7–4", "Attack time"], ["3–0", "Decay time"]]],
      [base + 6, 0, "SUREL" + n, "Voice " + n + " envelope", [["7–4", "Sustain level"], ["3–0", "Release time"]]]
    ];
  }
  var SID = sidVoice(1, 0xD400).concat(sidVoice(2, 0xD407), sidVoice(3, 0xD40E), [
    [0xD415, 0, "CUTLO", "Filter cutoff frequency, bits 2–0"],
    [0xD416, 0, "CUTHI", "Filter cutoff frequency, bits 10–3"],
    [0xD417, 0, "RESON", "Filter routing", [["7–4", "Resonance"], ["3", "Filter the external input"], ["2", "Filter voice 3"], ["1", "Filter voice 2"], ["0", "Filter voice 1"]]],
    [0xD418, 0, "SIGVOL", "Filter mode and volume", [["7", "Voice 3 silent (for a random source or LFO)"], ["6", "High-pass"], ["5", "Band-pass"], ["4", "Low-pass"], ["3–0", "Volume"]]],
    [0xD419, 0, "POTX", "Paddle X (read)"],
    [0xD41A, 0, "POTY", "Paddle Y (read)"],
    [0xD41B, 0, "RANDOM", "Upper 8 bits of the voice 3 wave (read). With noise on voice 3 a random number"],
    [0xD41C, 0, "ENV3", "Envelope of voice 3 (read)"]
  ]);
  function ciaRegs(n, b, nm) {
    return [
      [b + 4, 0, nm[0], "Timer A, low byte. Read: the count; write: the start value"],
      [b + 5, 0, nm[1], "Timer A, high byte"],
      [b + 6, 0, nm[2], "Timer B, low byte"],
      [b + 7, 0, nm[3], "Timer B, high byte"],
      [b + 8, 0, nm[4], "Time of day: tenths of seconds (BCD). Reading the hours stops the clock until this is read"],
      [b + 9, 0, nm[5], "Time of day: seconds (BCD)"],
      [b + 10, 0, nm[6], "Time of day: minutes (BCD)"],
      [b + 11, 0, nm[7], "Time of day: hours (BCD, bit 7 PM)"],
      [b + 12, 0, nm[8], "Serial shift register"],
      [b + 13, 0, nm[9], "Interrupt control" + (n === 2 ? ": these cause an NMI" : ""), [["7", "Read: an interrupt happened. Write: 1 turns the bits written as 1 on, 0 turns them off"], ["4", "FLAG pin (" + (n === 1 ? "tape, serial bus" : "user port, RS-232") + ")"], ["3", "Shift register"], ["2", "Time of day alarm"], ["1", "Timer B ran out"], ["0", "Timer A ran out"]]],
      [b + 14, 0, nm[10], "Timer A control", [["7", "Time of day clock at 50 Hz (0: 60 Hz)"], ["6", "Shift register sends"], ["5", "Count CNT pulses (0: processor cycles)"], ["4", "Load the start value now"], ["3", "One shot (0: start again by itself)"], ["0", "Timer running"]]],
      [b + 15, 0, nm[11], "Timer B control", [["7", "Writing the clock sets the alarm"], ["6–5", "Count %00 cycles · %01 CNT · %10 timer A running out · %11 both"], ["4", "Load the start value now"], ["3", "One shot"], ["0", "Timer running"]]]
    ];
  }
  var CIA1 = [
    [0xDC00, 0, "CIAPRA", "Port A: keyboard columns (write) and joystick 2 (read). A 0 bit is pressed", [["4", "Joystick 2 fire"], ["3", "Right"], ["2", "Left"], ["1", "Down"], ["0", "Up"]]],
    [0xDC01, 0, "CIAPRB", "Port B: keyboard rows (read) and joystick 1, same bits. Joystick 1 also types on the keyboard"],
    [0xDC02, 0, "CIDDRA", "Data direction of port A: 1 bits are outputs ($FF)"],
    [0xDC03, 0, "CIDDRB", "Data direction of port B ($00: inputs)"]
  ].concat(ciaRegs(1, 0xDC00, ["TIMALO", "TIMAHI", "TIMBLO", "TIMBHI", "TODTEN", "TODSEC", "TODMIN", "TODHRS", "CIASDR", "CIAICR", "CIACRA", "CIACRB"]));
  CIA1[4][3] += " (the KERNAL's IRQ: $4025 cycles, 60 times a second)";
  var CIA2 = [
    [0xDD00, 0, "CI2PRA", "Port A", [["7", "Serial bus data in"], ["6", "Serial bus clock in"], ["5", "Serial bus data out"], ["4", "Serial bus clock out"], ["3", "Serial bus ATN out"], ["2", "RS-232 data out"], ["1–0", "VIC-II bank: %11 $0000, %10 $4000, %01 $8000, %00 $C000"]]],
    [0xDD01, 0, "CI2PRB", "Port B: the user port lines PB0–PB7"],
    [0xDD02, 0, "C2DDRA", "Data direction of port A ($3F)"],
    [0xDD03, 0, "C2DDRB", "Data direction of port B"]
  ].concat(ciaRegs(2, 0xDD00, ["TI2ALO", "TI2AHI", "TI2BLO", "TI2BHI", "TO2TEN", "TO2SEC", "TO2MIN", "TO2HRS", "CI2SDR", "CI2ICR", "CI2CRA", "CI2CRB"]));
  var PORT = [
    [0x0000, 0, "D6510", "Data direction of the processor port ($2F)"],
    [0x0001, 0, "R6510", "Processor port (after power on $37)", [["5", "Tape motor (0: on)"], ["4", "Tape button (0: pressed)"], ["3", "Tape write"], ["2", "CHAREN: I/O at $D000 (0: character ROM)"], ["1", "HIRAM: KERNAL at $E000"], ["0", "LORAM: BASIC at $A000 (together with HIRAM)"]]]
  ];
  var ADSR_A = ["2 ms", "8 ms", "16 ms", "24 ms", "38 ms", "56 ms", "68 ms", "80 ms", "100 ms", "250 ms", "500 ms", "800 ms", "1 s", "3 s", "5 s", "8 s"];
  var ADSR_D = ["6 ms", "24 ms", "48 ms", "72 ms", "114 ms", "168 ms", "204 ms", "240 ms", "300 ms", "750 ms", "1.5 s", "2.4 s", "3 s", "9 s", "15 s", "24 s"];
  function tabIO() {
    var html = '<p class="lead">Every register of the chips, with the meaning of its bits. <b>+</b> puts the name into the code; the Snippets tab has code that uses them.</p>';
    html += '<section class="rg"><h3>VIC-II: video ($D000)</h3><p class="note">The registers repeat every 64 bytes up to $D3FF.</p>' + addrTable(VIC) + "</section>";
    html += '<section class="rg"><h3>Graphics modes</h3><table class="rt"><thead><tr><th>Mode</th><th title="$D011 bit 6">ECM</th><th title="$D011 bit 5">BMM</th><th title="$D016 bit 4">MCM</th><th></th></tr></thead><tbody>' +
      GFX.map(function (g) { return '<tr data-q="' + esc(("graphics mode d011 d016 " + g.join(" ")).toLowerCase()) + '"><td>' + g[0] + '</td><td class="ad">' + g[1] + '</td><td class="ad">' + g[2] + '</td><td class="ad">' + g[3] + "</td><td>" + g[4] + "</td></tr>"; }).join("") +
      '</tbody></table><p class="note">ECM and BMM are bits 6 and 5 of $D011, MCM is bit 4 of $D016. A sprite is 24 × 21 pixels in 63 bytes; its data lies at pointer × 64 in the VIC-II bank, the pointers are the last 8 bytes of the screen memory ($07F8).</p></section>';
    html += '<section class="rg"><h3>SID: sound ($D400)</h3><p class="note">Most registers can only be written; reading them gives nothing useful. Keep a copy in RAM when you need to change single bits.</p>' + addrTable(SID) +
      '<table class="rt adsr"><thead><tr><th>Value</th><th>Attack</th><th>Decay, release</th></tr></thead><tbody>' +
      ADSR_A.map(function (a, i) { return '<tr data-q="adsr attack decay release envelope ' + i + '"><td class="ad">$' + i.toString(16).toUpperCase() + "</td><td>" + a + "</td><td>" + ADSR_D[i] + "</td></tr>"; }).join("") +
      "</tbody></table></section>";
    html += '<section class="rg"><h3>CIA 1: keyboard, joysticks, IRQ ($DC00)</h3>' + addrTable(CIA1) + "</section>";
    html += '<section class="rg"><h3>CIA 2: VIC-II bank, serial bus, NMI ($DD00)</h3>' + addrTable(CIA2) + "</section>";
    html += '<section class="rg"><h3>Processor port</h3>' + addrTable(PORT) + "</section>";
    return html;
  }

  // ================================================================ snippets
  var SNIPS = [
    { t: "Wait for a raster line", d: "Waits until the VIC-II draws line 250, below the text: change the screen there without flicker.", c:
"        lda #250                ; the line to wait for\n-       cmp $d012\n        bne -" },
    { t: "Raster interrupt with the KERNAL", d: "Calls <code>rasirq</code> at line 100 of every frame instead of the CIA timer. The KERNAL still scans the keyboard.", c:
"        sei\n        lda #$7f                ; CIA 1: no timer interrupts\n        sta $dc0d\n        lda $dc0d               ; clear what is waiting\n        lda #<rasirq            ; our routine\n        sta $0314\n        lda #>rasirq\n        sta $0315\n        lda #100                ; raster line 100\n        sta $d012\n        lda $d011\n        and #$7f                ; line bit 8 = 0\n        sta $d011\n        lda #1                  ; raster interrupt on\n        sta $d01a\n        cli\n        rts\n\nrasirq  lda #1                  ; acknowledge the interrupt\n        sta $d019\n        inc $d020               ; your code here\n        jmp $ea31               ; the KERNAL: keyboard, clock, return" },
    { t: "Raster interrupt without ROMs", d: "BASIC and KERNAL off: the processor jumps straight through $FFFE, so the routine saves the registers itself.", c:
"        sei\n        lda #$35                ; RAM at $A000 and $E000, I/O on\n        sta $01\n        lda #$7f                ; no CIA interrupts\n        sta $dc0d\n        sta $dd0d\n        lda $dc0d\n        lda $dd0d\n        lda #<rawirq\n        sta $fffe\n        lda #>rawirq\n        sta $ffff\n        lda #$f8                ; raster line 248\n        sta $d012\n        lda $d011\n        and #$7f\n        sta $d011\n        lda #1\n        sta $d01a\n        cli\nforever jmp forever\n\nrawirq  pha                     ; save A, X and Y\n        txa\n        pha\n        tya\n        pha\n        lda #1                  ; acknowledge\n        sta $d019\n        inc $d020               ; your code here\n        pla                     ; restore Y, X and A\n        tay\n        pla\n        tax\n        pla\n        rti" },
    { t: "Read joystick 2", d: "Moves <code>xpos</code> and <code>ypos</code> (your own variables). A 0 bit means pressed.", c:
"        lda $dc00               ; joystick in port 2\n        lsr a                   ; bit 0: up\n        bcs +\n        dec ypos\n+       lsr a                   ; bit 1: down\n        bcs +\n        inc ypos\n+       lsr a                   ; bit 2: left\n        bcs +\n        dec xpos\n+       lsr a                   ; bit 3: right\n        bcs +\n        inc xpos\n+       lsr a                   ; bit 4: fire\n        bcs +\n        inc $d020               ; fire pressed\n+" },
    { t: "Wait for a key", d: "Waits until a key is pressed; A holds its PETSCII code.", c:
"-       jsr $ffe4               ; GETIN: a key from the buffer\n        cmp #0                  ; 0: no key yet\n        beq -" },
    { t: "Show a sprite", d: "Sprite 0 with its 63 bytes of data at $2000 (pointer $2000 / 64 = 128).", c:
"        lda #$2000 / 64         ; where the sprite data is\n        sta $07f8               ; pointer of sprite 0\n        lda #1                  ; white\n        sta $d027\n        lda #172                ; X position\n        sta $d000\n        lda #139                ; Y position\n        sta $d001\n        lda $d015               ; sprite 0 on\n        ora #1\n        sta $d015" },
    { t: "Fill the screen", d: "Faster than printing: spaces into all 1000 characters, white into the colour RAM.", c:
"        ldx #0\n-       lda #$20                ; screen code of the space\n        sta $0400,x\n        sta $0500,x\n        sta $0600,x\n        sta $06e8,x             ; the last 256 bytes up to $07e7\n        lda #1                  ; white\n        sta $d800,x\n        sta $d900,x\n        sta $da00,x\n        sta $dae8,x\n        inx\n        bne -" },
    { t: "Print at a position", d: "Moves the cursor with PLOT and prints a text ending in 0 (<code>msg .null \"hi\"</code>).", c:
"        ldx #12                 ; row\n        ldy #10                 ; column\n        clc\n        jsr $fff0               ; PLOT: set the cursor\n        ldx #0\n-       lda msg,x\n        beq +\n        jsr $ffd2               ; CHROUT\n        inx\n        bne -\n+" },
    { t: "Play a note", d: "A short note on voice 1. Write $10 (gate off) to $D404 before the next note.", c:
"        lda #15                 ; volume\n        sta $d418\n        lda #$09                ; attack 0, decay 9\n        sta $d405\n        lda #$00                ; sustain 0, release 0\n        sta $d406\n        lda #<$1cd6             ; A-4, 440 Hz (PAL)\n        sta $d400\n        lda #>$1cd6\n        sta $d401\n        lda #$11                ; triangle, gate on\n        sta $d404" },
    { t: "Random numbers", d: "Voice 3 plays noise at full speed without being heard; $D41B then gives a new random byte every few cycles.", c:
"        lda #$ff                ; voice 3: highest frequency\n        sta $d40e\n        sta $d40f\n        lda #$80                ; noise, gate off: silent\n        sta $d412\n        ; ... later:\n        lda $d41b               ; a random byte" },
    { t: "Bitmap mode", d: "320 × 200 pixels: bitmap at $2000, colours in the screen memory at $0400.", c:
"        lda $d011\n        ora #$20                ; bitmap mode on\n        sta $d011\n        lda #$18                ; screen $0400, bitmap $2000\n        sta $d018\n        ; for multicolour also:\n        ; lda $d016\n        ; ora #$10\n        ; sta $d016" },
    { t: "Own character set", d: "Characters from $3000 (2 KB, 8 bytes each), screen stays at $0400.", c:
"        lda $d018\n        and #$f1                ; keep the screen address\n        ora #$0c                ; characters at 6 × $0800 = $3000\n        sta $d018" },
    { t: "Another VIC-II bank", d: "Bank 1 ($4000–$7FFF): screen at $4400, no ROM characters there.", c:
"        lda $dd00\n        and #$fc\n        ora #%10                ; bank 1: $4000-$7fff\n        sta $dd00\n        lda #$1c                ; screen $4400, characters $7000\n        sta $d018\n        lda #$44                ; tell the KERNAL where to print\n        sta $0288" },
    { t: "Screen off while working", d: "The VIC-II stops reading memory, so the processor gets every cycle; the border colour fills the screen.", c:
"        lda $d011\n        and #$ef                ; bit 4 = 0: screen off\n        sta $d011\n        ; ... the work ...\n        lda $d011\n        ora #$10                ; screen on again\n        sta $d011" },
    { t: "Add 16-bit numbers", d: "<code>score</code> (two bytes, low byte first) plus 1000.", c:
"        clc\n        lda score\n        adc #<1000\n        sta score\n        lda score+1\n        adc #>1000\n        sta score+1" },
    { t: "Copy a page", d: "256 bytes from <code>src</code> to <code>dst</code>; for more pages change the high bytes and repeat.", c:
"        ldx #0\n-       lda src,x\n        sta dst,x\n        inx\n        bne -" },
    { t: "Load a file", d: "Loads <code>DATA</code> from the disk in drive 8 to the address stored in the file.", c:
"        lda #fname_end - fname  ; length of the name\n        ldx #<fname\n        ldy #>fname\n        jsr $ffbd               ; SETNAM\n        lda #1                  ; file 1\n        ldx #8                  ; drive 8\n        ldy #1                  ; 1: to the address in the file\n        jsr $ffba               ; SETLFS\n        lda #0                  ; 0: load\n        jsr $ffd5               ; LOAD\n        bcs loaderr             ; C = 1: an error, A tells which\n        ; ...\nfname   .text \"data\"\nfname_end" }
  ];
  function tabSnippets() {
    return '<p class="lead">Short pieces of code for common jobs. <b>Insert</b> puts one into the code above the line with the cursor. Labels like <code>xpos</code> or <code>score</code> stand for your own variables.</p>' +
      SNIPS.map(function (s, i) {
        return '<section class="rg snip" data-q="' + esc((s.t + " " + s.d.replace(/<[^>]+>/g, "") + " " + s.c).toLowerCase()) + '"><div class="snip-h"><h3>' + esc(s.t) + '</h3><button type="button" class="btn sm put-snip" data-snip="' + i + '">Insert</button></div>' +
          "<p class=\"note\">" + s.d + '</p><pre class="ex">' + s.c.split("\n").map(function (l) { return global.CodeEditor ? global.CodeEditor.highlightLine(l) : esc(l); }).join("\n") + "</pre></section>";
      }).join("");
  }

  // ================================================================ colours and codes
  var COLOURS = [
    ["Black", 144, "CTRL 1"], ["White", 5, "CTRL 2"], ["Red", 28, "CTRL 3"], ["Cyan", 159, "CTRL 4"],
    ["Purple", 156, "CTRL 5"], ["Green", 30, "CTRL 6"], ["Blue", 31, "CTRL 7"], ["Yellow", 158, "CTRL 8"],
    ["Orange", 129, "C= 1"], ["Brown", 149, "C= 2"], ["Light red", 150, "C= 3"], ["Dark grey", 151, "C= 4"],
    ["Grey", 152, "C= 5"], ["Light green", 153, "C= 6"], ["Light blue", 154, "C= 7"], ["Light grey", 155, "C= 8"]
  ];
  var CTRL = [
    [5, "White text"], [13, "Return: next line"], [14, "Lower and upper case letters"], [142, "Upper case and graphics"],
    [17, "Cursor down"], [145, "Cursor up"], [29, "Cursor right"], [157, "Cursor left"],
    [19, "Home: cursor to the top left"], [147, "Clear the screen"], [18, "Reverse on"], [146, "Reverse off"],
    [20, "Delete"], [148, "Insert"], [8, "SHIFT + C= cannot switch the case"], [9, "SHIFT + C= can switch the case"],
    [133, "F1"], [134, "F3"], [135, "F5"], [136, "F7"], [137, "F2"], [138, "F4"], [139, "F6"], [140, "F8"], [141, "SHIFT + Return"]
  ];
  var KEYS = [
    ["DEL", "RETURN", "CRSR →", "F7", "F1", "F3", "F5", "CRSR ↓"],
    ["3", "W", "A", "4", "Z", "S", "E", "L SHIFT"],
    ["5", "R", "D", "6", "C", "F", "T", "X"],
    ["7", "Y", "G", "8", "B", "H", "U", "V"],
    ["9", "I", "J", "0", "M", "K", "O", "N"],
    ["+", "P", "L", "−", ".", ":", "@", ","],
    ["£", "*", ";", "HOME", "R SHIFT", "=", "↑", "/"],
    ["1", "←", "CTRL", "2", "SPACE", "C=", "Q", "STOP"]
  ];
  function tabCodes() {
    var pal = (global.VIC6569 && global.VIC6569.PALETTE) || [];
    var html = '<section class="rg"><h3>Colours</h3><table class="rt cols"><thead><tr><th></th><th>Value</th><th>Colour</th><th>PETSCII</th><th>Keys</th></tr></thead><tbody>' +
      COLOURS.map(function (c, i) {
        var rgb = pal[i] != null ? "#" + ("00000" + pal[i].toString(16)).slice(-6) : "#888";
        return '<tr data-q="' + esc((i + " $" + i.toString(16) + " " + c[0] + " " + c[1] + " " + c[2]).toLowerCase()) + '"><td><span class="sw" style="background:' + rgb + '"></span></td><td class="ad">' + i + " · $" + i.toString(16).toUpperCase() +
          "</td><td>" + c[0] + "</td><td>" + c[1] + "</td><td>" + c[2] + "</td></tr>";
      }).join("") + "</tbody></table></section>";
    html += '<section class="rg"><h3>PETSCII control codes</h3><p class="note">Print them with CHROUT, or put them in <code>.text</code>: <code>.text 147, "hello"</code>.</p><table class="rt"><tbody>' +
      CTRL.map(function (c) { return '<tr data-q="' + esc((c[0] + " $" + c[0].toString(16) + " " + c[1]).toLowerCase()) + '"><td class="ad">' + c[0] + "</td><td class=\"ad\">$" + h2(c[0]) + "</td><td>" + c[1] + "</td></tr>"; }).join("") +
      "</tbody></table></section>";
    html += '<section class="rg"><h3>PETSCII and screen codes</h3><p class="note">CHROUT takes PETSCII; the screen memory holds screen codes. <code>.text</code> gives PETSCII, <code>.screen</code> screen codes. Letters typed in the source become $41–$5A, the capitals of the normal character set. A screen code + 128 is the same character in reverse.</p>' +
      '<table class="rt"><thead><tr><th>PETSCII</th><th>Screen code</th><th></th></tr></thead><tbody>' +
      [["$20–$3F", "$20–$3F", "space, digits, punctuation"], ["$40–$5F", "$00–$1F", "@, letters, [ £ ] ↑ ←"], ["$60–$7F", "$40–$5F", "graphics"],
       ["$A0–$BF", "$60–$7F", "graphics"], ["$C0–$DF", "$40–$5F", "graphics (capitals in the lower-case set)"]].map(function (r) {
        return '<tr data-q="petscii screen code ' + esc(r.join(" ").toLowerCase()) + '"><td class="ad">' + r[0] + '</td><td class="ad">' + r[1] + "</td><td>" + r[2] + "</td></tr>";
      }).join("") + "</tbody></table></section>";
    html += '<section class="rg"><h3>Keyboard matrix</h3><p class="note">Write a column with one 0 bit to $DC00, read the rows from $DC01: a 0 bit is a key held down. The matrix code in $CB is column × 8 + row (64: no key). Turn the IRQ off with SEI while you scan.</p>' +
      '<div class="kbwrap"><table class="rt kb"><thead><tr><th></th>' + [0, 1, 2, 3, 4, 5, 6, 7].map(function (b) { return "<th>row " + b + "</th>"; }).join("") + "</tr></thead><tbody>" +
      KEYS.map(function (r, i) {
        return '<tr data-q="keyboard matrix ' + esc(r.join(" ").toLowerCase()) + '"><th>col ' + i + "<small>$" + h2(0xFF ^ (1 << i)) + "</small></th>" + r.map(function (k) { return "<td>" + esc(k) + "</td>"; }).join("") + "</tr>";
      }).join("") + "</tbody></table></div></section>";
    return html;
  }

  // ================================================================ the window
  var TABS = [
    { id: "ins", label: "Instructions", build: tabInstructions },
    { id: "mem", label: "Memory", build: tabMemory },
    { id: "kernal", label: "KERNAL", build: tabKernal },
    { id: "io", label: "I/O registers", build: tabIO },
    { id: "codes", label: "Colours & codes", build: tabCodes },
    { id: "snip", label: "Snippets", build: tabSnippets }
  ];
  var STORE = "c64asm.ref";
  var win, body, filter, note, cur = null, built = {}, opts = {}, pos = null;

  // all named addresses for insert and lookup
  var NAMED = {};
  function addNamed(rows, desc) {
    rows.forEach(function (r) { if (r[2] && !/[ –]/.test(r[2])) NAMED[r[2].toUpperCase()] = { a: r[0], d: (desc ? desc(r) : r[3]).replace(/<[^>]+>/g, "").split(/[.;:(]| · /)[0].trim() }; });
  }
  addNamed(MEMMAP); addNamed(ZP); addNamed(VECTORS); addNamed(VIC); addNamed(SID); addNamed(CIA1); addNamed(CIA2); addNamed(PORT);
  addNamed(ROMEXTRA.map(function (r) { return [r[0], 0, r[1], r[2]]; }));
  KERNAL.forEach(function (k) { NAMED[k[1]] = { a: k[0], d: k[2].split(/[(;]/)[0].trim(), kernal: true }; });

  function load() { try { var s = JSON.parse(localStorage.getItem(STORE) || "{}"); return s && typeof s === "object" ? s : {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(STORE, JSON.stringify({ tab: cur, pos: pos })); } catch (e) { /* not kept */ } }

  function make() {
    if (win) return;
    var s = load(); pos = s.pos || null;
    win = document.createElement("section");
    win.className = "ref-win"; win.id = "ref-win"; win.hidden = true;
    win.setAttribute("role", "dialog"); win.setAttribute("aria-modal", "false"); win.setAttribute("aria-labelledby", "ref-title");
    win.innerHTML = '<header class="ref-head"><h2 id="ref-title">Quick reference</h2><button type="button" class="ref-x" aria-label="Close" title="Close (Esc)">×</button></header>' +
      '<div class="ref-tabs" role="tablist">' + TABS.map(function (t) { return '<button type="button" role="tab" data-r="' + t.id + '" aria-selected="false">' + t.label + "</button>"; }).join("") + "</div>" +
      '<div class="ref-find"><input type="search" placeholder="Filter: name, address or word" aria-label="Filter" spellcheck="false"><span class="ref-note" aria-live="polite"></span></div>' +
      '<div class="ref-body" tabindex="-1"></div>';
    document.body.appendChild(win);
    body = win.querySelector(".ref-body"); filter = win.querySelector("input"); note = win.querySelector(".ref-note");
    win.querySelector(".ref-x").addEventListener("click", close);
    win.querySelector(".ref-tabs").addEventListener("click", function (e) { var b = e.target.closest("[data-r]"); if (b) show(b.getAttribute("data-r")); });
    filter.addEventListener("input", applyFilter);
    win.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.preventDefault(); close(); if (opts.focusEditor) opts.focusEditor(); }
      e.stopPropagation();
      if (e.key === "F1") e.preventDefault();
    });
    body.addEventListener("click", function (e) {
      var b = e.target.closest(".put");
      if (b) { insert(b.getAttribute("data-put")); return; }
      var sn = e.target.closest(".put-snip");
      if (sn && opts.insertBlock) {
        var snip = SNIPS[+sn.getAttribute("data-snip")], r = opts.insertBlock(snip.c + "\n");
        say(typeof r === "string" ? r : "“" + snip.t + "” is in the code now.");
      }
    });
    drag(win.querySelector(".ref-head"));
    cur = s.tab && TABS.some(function (t) { return t.id === s.tab; }) ? s.tab : "ins";
  }
  function place() {
    if (window.matchMedia("(max-width: 760px)").matches) { win.style.left = win.style.top = ""; return; }
    if (!pos) { win.style.left = win.style.top = ""; return; }
    var w = win.offsetWidth, h = win.offsetHeight;
    var x = Math.max(0, Math.min(pos.x, innerWidth - Math.min(w, innerWidth))), y = Math.max(0, Math.min(pos.y, innerHeight - 60));
    win.style.left = x + "px"; win.style.top = y + "px"; win.style.right = "auto";
    if (h > innerHeight - y) win.style.height = Math.max(240, innerHeight - y - 12) + "px";
  }
  function drag(handle) {
    var sx, sy, ox, oy, on = false;
    handle.addEventListener("pointerdown", function (e) {
      if (e.target.closest("button") || window.matchMedia("(max-width: 760px)").matches) return;
      var r = win.getBoundingClientRect();
      sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top; on = true;
      handle.setPointerCapture(e.pointerId); e.preventDefault();
    });
    handle.addEventListener("pointermove", function (e) {
      if (!on) return;
      pos = { x: Math.round(ox + e.clientX - sx), y: Math.round(oy + e.clientY - sy) };
      pos.x = Math.max(-win.offsetWidth + 80, Math.min(pos.x, innerWidth - 80)); pos.y = Math.max(0, Math.min(pos.y, innerHeight - 40));
      win.style.left = pos.x + "px"; win.style.top = pos.y + "px"; win.style.right = "auto";
    });
    function end() { if (on) { on = false; save(); } }
    handle.addEventListener("pointerup", end); handle.addEventListener("pointercancel", end);
  }

  function build(id) {
    var t = TABS.filter(function (x) { return x.id === id; })[0];
    var pane = built[id] = document.createElement("div");
    pane.className = "ref-pane"; pane.setAttribute("data-r", id); pane.hidden = true; pane.innerHTML = t.build();
    body.appendChild(pane);
    return pane;
  }
  function show(id) {
    make();
    if (cur !== id) body.scrollTop = 0;
    cur = id;
    if (!built[id]) build(id);
    win.querySelectorAll(".ref-tabs [data-r]").forEach(function (b) { b.setAttribute("aria-selected", String(b.getAttribute("data-r") === id)); });
    TABS.forEach(function (t) { if (built[t.id]) built[t.id].hidden = t.id !== id; });
    applyFilter();
    syncButtons();
    save();
  }
  function open(id) {
    make();
    var was = !win.hidden;
    win.hidden = false;
    show(id || cur || "ins");
    if (!was) place();
    say("");
  }
  function close() { if (win) { win.hidden = true; syncButtons(); } }
  function isOpen() { return !!(win && !win.hidden); }
  function syncButtons() {
    document.querySelectorAll("[data-ref]").forEach(function (b) { b.setAttribute("aria-pressed", String(isOpen() && b.getAttribute("data-ref") === cur)); });
  }
  function say(t) { if (note) note.textContent = t; }

  function applyFilter() {
    var pane = built[cur]; if (!pane) return;
    var q = filter.value.trim().toLowerCase().replace(/^0x/, "$");
    var hits = 0;
    pane.querySelectorAll("[data-q]").forEach(function (el) {
      var on = !q || el.getAttribute("data-q").indexOf(q) >= 0 || (q[0] === "$" && el.getAttribute("data-q").indexOf(q.slice(1)) >= 0);
      el.hidden = !on; if (on) hits++;
      if (el.tagName === "DETAILS" && q && on && el.getAttribute("data-mn") === q) el.open = true;
    });
    pane.querySelectorAll(".rg").forEach(function (s) {
      var any = !q || s.querySelector("[data-q]:not([hidden])");
      s.hidden = !any;
    });
    pane.querySelectorAll(".lead").forEach(function (p) { p.hidden = !!q; });
    say(q ? (hits ? hits + (hits === 1 ? " match" : " matches") : "Nothing found") : "");
  }

  function mark(el) {
    body.querySelectorAll(".hit").forEach(function (x) { x.classList.remove("hit"); });
    if (!el) return;
    el.classList.add("hit");
    if (el.tagName === "DETAILS") el.open = true;
    requestAnimationFrame(function () { el.scrollIntoView({ block: el.tagName === "DETAILS" ? "start" : "center" }); });
  }

  // ---------------------------------------------------------------- insert NAME = $addr
  function insert(name) {
    var e = NAMED[name.toUpperCase()];
    if (!e || !opts.insert) return;
    var r = opts.insert(name, e.a, e.d);
    say(typeof r === "string" ? r : name + " = $" + h4(e.a).toLowerCase() + " is in the code now.");
  }
  function defineLine(name, addr, desc) {
    var l = name + " ";
    while (l.length < 8) l += " ";
    l += "= $" + (addr < 256 ? h2(addr) : h4(addr)).toLowerCase();
    while (l.length < 32) l += " ";
    return l + "; " + desc.charAt(0).toLowerCase() + desc.slice(1);
  }

  // ---------------------------------------------------------------- F1: look up a word
  function findAddr(v) {
    var order = ["io", "kernal", "mem"], best = null;
    for (var i = 0; i < order.length && !best; i++) {
      if (!built[order[i]]) build(order[i]);
      var rows = built[order[i]].querySelectorAll("tr[data-a]"), inside = null;
      for (var j = 0; j < rows.length; j++) {
        var a = +rows[j].getAttribute("data-a"), e = +rows[j].getAttribute("data-e");
        if (a === v) { best = { tab: order[i], el: rows[j] }; break; }
        if (!inside && v > a && v <= e && e - a < 0x1000) inside = { tab: order[i], el: rows[j] };
      }
      if (!best && inside) best = inside;
    }
    return best;
  }
  function lookup(word) {
    make();
    var w = String(word || "").trim(), lw = w.toLowerCase(), found = null;
    filter.value = "";
    if (!w) { open(); return false; }
    if (INS[lw] || ILL[lw] || (A.ILLEGAL[lw] && !ILL[lw])) {
      var key = INS[lw] || ILL[lw] ? lw : { lxa: "lax", isb: "isc", asr: "alr", axs: "sbx", xaa: "ane" }[lw] || lw;
      open("ins");
      found = built.ins.querySelector('details[data-mn="' + key + '"]');
      mark(found);
      say(found ? "" : "Nothing found for " + w);
      return !!found;
    }
    var v = null, m;
    if ((m = /^\$([0-9a-f]{1,4})$/i.exec(w)) || (m = /^0x([0-9a-f]{1,4})$/i.exec(w))) v = parseInt(m[1], 16);
    else if (/^\d{1,5}$/.test(w) && +w < 65536) v = +w;
    else if (NAMED[w.toUpperCase()]) v = NAMED[w.toUpperCase()].a;
    else if (opts.resolve) { var r = opts.resolve(w); if (r != null) v = r; }
    if (v != null) {
      found = findAddr(v);
      if (found) {
        open(found.tab);
        mark(found.el);
        say(NAMED[w.toUpperCase()] || /^[$\d]|^0x/i.test(w) ? "" : w + " = $" + h4(v));
        return true;
      }
    }
    open();
    say(v != null ? w + " = $" + h4(v) + ": no entry for this address" : "Nothing found for " + w);
    return false;
  }

  global.C64Ref = {
    init: function (o) { opts = o || {}; },
    open: open, close: close, isOpen: isOpen, lookup: lookup, show: show,
    toggle: function (id) { if (isOpen() && cur === id) close(); else open(id); },
    defineLine: defineLine, named: NAMED, tabs: TABS
  };
})(window);
