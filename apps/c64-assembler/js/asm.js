/* C64 Assembler: a 6502/6510 assembler with a syntax close to 64tass.
 *
 *   label  lda #$01        ; labels at the start of the line (a colon is allowed)
 *   _loop / @loop          ; local to the last global label
 *   - / +   bne -          ; anonymous labels: -, -- back, +, ++ forward
 *   name = expr            ; constants
 *   * = $0801              ; address
 *   .byte .word .text .screen .ascii .null .fill .align .basic .binary .include
 *   .if .elif .else .endif   .macro .endm   .rept .endr   .for i = 0 to 7 ... .endfor
 *   .logical addr ... .endlogical   .cpu "6502"   .assert .cerror .error .warn
 */
(function (global) {
  "use strict";

  // ---------------------------------------------------------------- opcodes
  // modes: imp acc imm zp zpx zpy abs absx absy ind indx indy rel
  var M = ["imp", "acc", "imm", "zp", "zpx", "zpy", "abs", "absx", "absy", "ind", "indx", "indy", "rel"];
  function op(list) { var o = {}; list.forEach(function (p, i) { if (p != null) o[M[i]] = p; }); return o; }
  //           imp   acc   imm   zp    zpx   zpy   abs   absx  absy  ind   indx  indy  rel
  var OPS = {
    adc: op([null, null, 0x69, 0x65, 0x75, null, 0x6D, 0x7D, 0x79, null, 0x61, 0x71]),
    and: op([null, null, 0x29, 0x25, 0x35, null, 0x2D, 0x3D, 0x39, null, 0x21, 0x31]),
    asl: op([0x0A, 0x0A, null, 0x06, 0x16, null, 0x0E, 0x1E]),
    bit: op([null, null, null, 0x24, null, null, 0x2C]),
    brk: op([0x00]),
    clc: op([0x18]), cld: op([0xD8]), cli: op([0x58]), clv: op([0xB8]),
    cmp: op([null, null, 0xC9, 0xC5, 0xD5, null, 0xCD, 0xDD, 0xD9, null, 0xC1, 0xD1]),
    cpx: op([null, null, 0xE0, 0xE4, null, null, 0xEC]),
    cpy: op([null, null, 0xC0, 0xC4, null, null, 0xCC]),
    dec: op([null, null, null, 0xC6, 0xD6, null, 0xCE, 0xDE]),
    dex: op([0xCA]), dey: op([0x88]),
    eor: op([null, null, 0x49, 0x45, 0x55, null, 0x4D, 0x5D, 0x59, null, 0x41, 0x51]),
    inc: op([null, null, null, 0xE6, 0xF6, null, 0xEE, 0xFE]),
    inx: op([0xE8]), iny: op([0xC8]),
    jmp: op([null, null, null, null, null, null, 0x4C, null, null, 0x6C]),
    jsr: op([null, null, null, null, null, null, 0x20]),
    lda: op([null, null, 0xA9, 0xA5, 0xB5, null, 0xAD, 0xBD, 0xB9, null, 0xA1, 0xB1]),
    ldx: op([null, null, 0xA2, 0xA6, null, 0xB6, 0xAE, null, 0xBE]),
    ldy: op([null, null, 0xA0, 0xA4, 0xB4, null, 0xAC, 0xBC]),
    lsr: op([0x4A, 0x4A, null, 0x46, 0x56, null, 0x4E, 0x5E]),
    nop: op([0xEA]),
    ora: op([null, null, 0x09, 0x05, 0x15, null, 0x0D, 0x1D, 0x19, null, 0x01, 0x11]),
    pha: op([0x48]), php: op([0x08]), pla: op([0x68]), plp: op([0x28]),
    rol: op([0x2A, 0x2A, null, 0x26, 0x36, null, 0x2E, 0x3E]),
    ror: op([0x6A, 0x6A, null, 0x66, 0x76, null, 0x6E, 0x7E]),
    rti: op([0x40]), rts: op([0x60]),
    sbc: op([null, null, 0xE9, 0xE5, 0xF5, null, 0xED, 0xFD, 0xF9, null, 0xE1, 0xF1]),
    sec: op([0x38]), sed: op([0xF8]), sei: op([0x78]),
    sta: op([null, null, null, 0x85, 0x95, null, 0x8D, 0x9D, 0x99, null, 0x81, 0x91]),
    stx: op([null, null, null, 0x86, null, 0x96, 0x8E]),
    sty: op([null, null, null, 0x84, 0x94, null, 0x8C]),
    tax: op([0xAA]), tay: op([0xA8]), tsx: op([0xBA]), txa: op([0x8A]), txs: op([0x9A]), tya: op([0x98])
  };
  var BRANCH = { bpl: 0x10, bmi: 0x30, bvc: 0x50, bvs: 0x70, bcc: 0x90, bcs: 0xB0, bne: 0xD0, beq: 0xF0 };
  Object.keys(BRANCH).forEach(function (k) { OPS[k] = { rel: BRANCH[k] }; });
  // undocumented opcodes of the NMOS 6502 (6510)
  var ILLEGAL = {
    slo: op([null, null, null, 0x07, 0x17, null, 0x0F, 0x1F, 0x1B, null, 0x03, 0x13]),
    rla: op([null, null, null, 0x27, 0x37, null, 0x2F, 0x3F, 0x3B, null, 0x23, 0x33]),
    sre: op([null, null, null, 0x47, 0x57, null, 0x4F, 0x5F, 0x5B, null, 0x43, 0x53]),
    rra: op([null, null, null, 0x67, 0x77, null, 0x6F, 0x7F, 0x7B, null, 0x63, 0x73]),
    sax: op([null, null, null, 0x87, null, 0x97, 0x8F, null, null, null, 0x83]),
    lax: op([null, null, 0xAB, 0xA7, null, 0xB7, 0xAF, null, 0xBF, null, 0xA3, 0xB3]),
    dcp: op([null, null, null, 0xC7, 0xD7, null, 0xCF, 0xDF, 0xDB, null, 0xC3, 0xD3]),
    isc: op([null, null, null, 0xE7, 0xF7, null, 0xEF, 0xFF, 0xFB, null, 0xE3, 0xF3]),
    anc: op([null, null, 0x0B]), alr: op([null, null, 0x4B]), arr: op([null, null, 0x6B]),
    ane: op([null, null, 0x8B]), sbx: op([null, null, 0xCB]), las: op([null, null, null, null, null, null, null, null, 0xBB]),
    shy: op([null, null, null, null, null, null, null, 0x9C]), shx: op([null, null, null, null, null, null, null, null, 0x9E]),
    sha: op([null, null, null, null, null, null, null, null, 0x9F, null, null, 0x93]), tas: op([null, null, null, null, null, null, null, null, 0x9B]),
    jam: op([0x02])
  };
  ILLEGAL.lxa = op([null, null, 0xAB]); ILLEGAL.isb = ILLEGAL.isc; ILLEGAL.asr = ILLEGAL.alr; ILLEGAL.axs = ILLEGAL.sbx; ILLEGAL.xaa = ILLEGAL.ane;
  // nop with operands
  var NOPX = op([0xEA, null, 0x80, 0x04, 0x14, null, 0x0C, 0x1C]);

  var DIRECTIVES = ["byte", "db", "word", "dw", "text", "screen", "ascii", "null", "fill", "res", "align", "basic", "binary", "incbin",
    "include", "if", "ifdef", "ifndef", "elif", "else", "endif", "fi", "macro", "endm", "endmacro", "rept", "repeat", "endr", "endrept",
    "for", "endfor", "next", "logical", "endlogical", "here", "cpu", "assert", "cerror", "cwarn", "error", "warn", "org", "equ", "var", "dword", "lohi"];

  // ---------------------------------------------------------------- text encodings
  function petscii(c) {
    if (c >= 97 && c <= 122) return c - 32;              // a-z: the letters of the C64 (upper case at power on)
    if (c >= 65 && c <= 90) return c;
    if (c === 163) return 0x5C;                          // £
    if (c === 8593) return 0x5E;                         // ↑
    if (c === 8592) return 0x5F;                         // ←
    if (c === 960) return 0xFF;                          // π
    return c < 256 ? c : 0x3F;
  }
  function screencode(c) {
    var p = petscii(c);
    if (p >= 0x40 && p <= 0x5F) return p - 0x40;
    if (p >= 0x20 && p <= 0x3F) return p;
    if (p >= 0x60 && p <= 0x7F) return p - 0x20;
    if (p >= 0xA0 && p <= 0xBF) return p - 0x40;
    if (p >= 0xC0 && p <= 0xFE) return p - 0x80;
    return p & 0x7F;
  }

  // ---------------------------------------------------------------- expressions
  var UNKNOWN = { unknown: true };
  function isNum(v) { return typeof v === "number"; }

  function tokenize(s) {
    var t = [], i = 0, n = s.length;
    while (i < n) {
      var c = s[i];
      if (c === " " || c === "\t") { i++; continue; }
      var m;
      if ((m = /^\$[0-9a-fA-F]+/.exec(s.slice(i)))) { t.push({ k: "num", v: parseInt(m[0].slice(1), 16) }); i += m[0].length; continue; }
      if ((m = /^0[xX][0-9a-fA-F]+/.exec(s.slice(i)))) { t.push({ k: "num", v: parseInt(m[0].slice(2), 16) }); i += m[0].length; continue; }
      if ((m = /^%[01]+/.exec(s.slice(i)))) { t.push({ k: "num", v: parseInt(m[0].slice(1), 2) }); i += m[0].length; continue; }
      if ((m = /^0[bB][01]+/.exec(s.slice(i)))) { t.push({ k: "num", v: parseInt(m[0].slice(2), 2) }); i += m[0].length; continue; }
      if ((m = /^[0-9]+/.exec(s.slice(i)))) { t.push({ k: "num", v: parseInt(m[0], 10) }); i += m[0].length; continue; }
      if ((m = /^'(\\.|[^'])'/.exec(s.slice(i)))) { var ch = m[1].length > 1 ? m[1][1] : m[1]; t.push({ k: "num", v: petscii(ch.charCodeAt(0)), ch: true }); i += m[0].length; continue; }
      if ((m = /^"((?:\\.|[^"\\])*)"/.exec(s.slice(i)))) { t.push({ k: "str", v: unescape(m[1]) }); i += m[0].length; continue; }
      if ((m = /^[A-Za-z_@.][A-Za-z0-9_.]*/.exec(s.slice(i)))) { t.push({ k: "id", v: m[0] }); i += m[0].length; continue; }
      if ((m = /^(<<|>>|<=|>=|==|!=|&&|\|\|)/.exec(s.slice(i)))) { t.push({ k: "op", v: m[0] }); i += 2; continue; }
      if ("+-*/%&|^~!<>(),=#[]".indexOf(c) >= 0) { t.push({ k: "op", v: c }); i++; continue; }
      throw new Error("Unexpected character '" + c + "'");
    }
    return t;
  }
  function unescape(s) { return s.replace(/\\(.)/g, function (_, c) { return c === "n" ? "\r" : c === "0" ? "\0" : c; }); }

  // a small Pratt parser; ctx.sym(name) gives a number or UNKNOWN
  function Expr(tokens, ctx) { this.t = tokens; this.i = 0; this.ctx = ctx; }
  Expr.prototype.peek = function () { return this.t[this.i]; };
  Expr.prototype.next = function () { return this.t[this.i++]; };
  Expr.prototype.done = function () { return this.i >= this.t.length; };
  var BIN = {
    "||": 1, "&&": 2, "|": 3, "^": 4, "&": 5, "==": 6, "!=": 6, "=": 6,
    "<": 7, ">": 7, "<=": 7, ">=": 7, "<<": 8, ">>": 8, "+": 9, "-": 9, "*": 10, "/": 10, "%": 10
  };
  Expr.prototype.parse = function (minPrec) {
    var left = this.unary();
    for (;;) {
      var t = this.peek();
      if (!t || t.k !== "op" || !BIN[t.v] || BIN[t.v] < minPrec) return left;
      this.next();
      var right = this.parse(BIN[t.v] + 1);
      left = binop(t.v, left, right);
    }
  };
  function binop(o, a, b) {
    if (!isNum(a) || !isNum(b)) return UNKNOWN;
    switch (o) {
      case "+": return a + b; case "-": return a - b; case "*": return a * b;
      case "/": if (b === 0) throw new Error("Division by zero"); return Math.trunc(a / b);
      case "%": if (b === 0) throw new Error("Division by zero"); return a % b;
      case "&": return a & b; case "|": return a | b; case "^": return a ^ b;
      case "<<": return a << b; case ">>": return a >> b;
      case "==": case "=": return a === b ? 1 : 0; case "!=": return a !== b ? 1 : 0;
      case "<": return a < b ? 1 : 0; case ">": return a > b ? 1 : 0;
      case "<=": return a <= b ? 1 : 0; case ">=": return a >= b ? 1 : 0;
      case "&&": return a && b ? 1 : 0; case "||": return a || b ? 1 : 0;
    }
    return UNKNOWN;
  }
  function un(f, v) { return isNum(v) ? f(v) : UNKNOWN; }
  Expr.prototype.unary = function () {
    var t = this.next();
    if (!t) throw new Error("Expression expected");
    if (t.k === "op") {
      // anonymous labels: a run of - or + on its own
      if ((t.v === "-" || t.v === "+") && this.anonRun(t.v)) {
        var n = 1;
        while (this.peek() && this.peek().k === "op" && this.peek().v === t.v) { this.next(); n++; }
        return this.ctx.anon(t.v, n);
      }
      switch (t.v) {
        case "-": return un(function (v) { return -v; }, this.unary());
        case "+": return this.unary();
        case "~": return un(function (v) { return ~v; }, this.unary());
        case "!": return un(function (v) { return v ? 0 : 1; }, this.unary());
        case "<": return un(function (v) { return v & 0xFF; }, this.unary());
        case ">": return un(function (v) { return (v >> 8) & 0xFF; }, this.unary());
        case "*": return this.ctx.pc();
        case "(": case "[":
          var v = this.parse(1), c = this.next();
          if (!c || c.v !== (t.v === "(" ? ")" : "]")) throw new Error("Missing " + (t.v === "(" ? ")" : "]"));
          return v;
      }
      throw new Error("Unexpected '" + t.v + "'");
    }
    if (t.k === "num") return t.v;
    if (t.k === "str") {
      if (t.v.length === 1) return petscii(t.v.charCodeAt(0));
      throw new Error("A text where a number is expected");
    }
    // functions
    var nx = this.peek();
    if (nx && nx.k === "op" && nx.v === "(" && /^(lo|hi|min|max|abs)$/i.test(t.v)) {
      this.next();
      var args = [this.parse(1)];
      while (this.peek() && this.peek().v === ",") { this.next(); args.push(this.parse(1)); }
      if (!this.next() || this.t[this.i - 1].v !== ")") throw new Error("Missing )");
      if (args.some(function (a) { return !isNum(a); })) return UNKNOWN;
      switch (t.v.toLowerCase()) {
        case "lo": return args[0] & 0xFF; case "hi": return (args[0] >> 8) & 0xFF;
        case "min": return Math.min.apply(null, args); case "max": return Math.max.apply(null, args);
        case "abs": return Math.abs(args[0]);
      }
    }
    return this.ctx.sym(t.v);
  };
  // is this - or + an anonymous label (nothing after the run but the end, a comma or a bracket)?
  Expr.prototype.anonRun = function (c) {
    var j = this.i;
    while (j < this.t.length && this.t[j].k === "op" && this.t[j].v === c) j++;
    var after = this.t[j];
    return !after || (after.k === "op" && (after.v === "," || after.v === ")" || after.v === "]"));
  };

  // split by top level commas (not inside brackets or strings)
  function splitArgs(s) {
    var out = [], depth = 0, cur = "", q = null;
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (q) { cur += c; if (c === "\\") { cur += s[++i] || ""; } else if (c === q) q = null; continue; }
      if (c === '"' || (c === "'" && s[i + 2] === "'")) { q = c; cur += c; continue; }
      if (c === "(" || c === "[") depth++;
      if (c === ")" || c === "]") depth--;
      if (c === "," && depth === 0) { out.push(cur.trim()); cur = ""; continue; }
      cur += c;
    }
    if (cur.trim() !== "" || out.length) out.push(cur.trim());
    return out;
  }
  // remove a comment (; outside strings and character constants)
  function stripComment(s) {
    var q = null;
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (q) { if (c === "\\") i++; else if (c === q) q = null; continue; }
      if (c === '"') { q = c; continue; }
      if (c === "'" && s[i + 2] === "'") { i += 2; continue; }
      if (c === ";") return s.slice(0, i);
    }
    return s;
  }

  // ---------------------------------------------------------------- the assembler
  // files: { name: text or Uint8Array }, main: name; opts.defines: { NAME: value }
  function assemble(files, main, opts) {
    opts = opts || {};
    var prevSyms = {}, decisions = {}, result = null, pass;
    for (pass = 1; pass <= 12; pass++) {
      var r = runPass(files, main, opts, pass, prevSyms, decisions, result, false);
      var changed = pass === 1 || Object.keys(r.syms).some(function (k) { return !prevSyms[k] || prevSyms[k].value !== r.syms[k].value; });
      prevSyms = r.syms;
      result = r;
      if (!changed) break;
    }
    // the last pass: everything must be known now
    result = runPass(files, main, opts, pass + 1, prevSyms, decisions, result, true);
    return finish(result, opts);
  }

  function runPass(files, main, opts, pass, prevSyms, decisions, prevResult, strict) {
    var mem = new Uint8Array(0x10000), used = new Uint8Array(0x10000);
    var S = {
      syms: {}, pass: pass, pc: null, phys: null, logical: false, errors: [], warnings: [], unknownUsed: false,
      global: "", anonMinus: [], anonPlus: [], plusSeen: 0, prevPlus: prevResult ? prevResult.anonPlus : [],
      macros: prevResult ? prevResult.macros : {}, illegal: true, listing: [], insn: 0, cpuName: "6510",
      basicStart: null, overlaps: 0, mem: mem, used: used, segments: [], macroId: 0, depth: 0
    };
    Object.keys(opts.defines || {}).forEach(function (k) { S.syms[k] = { value: opts.defines[k], kind: "const", line: null }; });
    var where = null;              // { file, line } of the line being assembled
    function err(msg, w) { S.errors.push({ file: (w || where).file, line: (w || where).line, msg: msg }); }
    function warn(msg) { S.warnings.push({ file: where.file, line: where.line, msg: msg }); }

    function fullName(name) {
      if (name[0] === "_" || name[0] === "@") {
        if (!S.global) return "@" + name.slice(1);
        return S.global + "." + name.slice(1);
      }
      return name;
    }
    var ctx = {
      pc: function () { if (S.pc == null) throw new Error("No address yet: put  * = $1000  (or another address) before the code"); return S.pc; },
      sym: function (name) {
        var fn = fullName(name), s = S.syms[fn] || prevSyms[fn];
        if (s && s.value != null) return s.value;
        if (/^(a|x|y)$/i.test(name)) throw new Error("Register " + name.toUpperCase() + " is not allowed here");
        if (strict) throw new Error("Unknown label '" + name + "'");
        S.unknownUsed = true;
        return UNKNOWN;
      },
      anon: function (dir, n) {
        if (dir === "-") {
          var a = S.anonMinus[S.anonMinus.length - n];
          if (a == null) throw new Error("No anonymous label " + "-".repeat(n) + " before this line");
          return a;
        }
        var b = S.prevPlus[S.plusSeen + n - 1];
        if (b == null) { S.unknownUsed = true; if (strict) throw new Error("No anonymous label " + "+".repeat(n) + " after this line"); return UNKNOWN; }
        return b;
      }
    };
    function evalExpr(s, needKnown) {
      var e = new Expr(tokenize(s), ctx), v = e.parse(1);
      if (!e.done()) throw new Error("Unexpected '" + (e.peek().v) + "' in the expression");
      if (needKnown && !isNum(v)) throw new Error("The value must be known here (no labels defined later)");
      return v;
    }
    function value(s, finalCheck) {
      var v = evalExpr(s);
      if (!isNum(v)) { if (finalCheck) throw new Error("Unknown label in '" + s + "'"); return null; }
      return v;
    }
    function define(name, v, kind) {
      var fn = fullName(name), old = S.syms[fn];
      if (old && kind !== "var" && old.kind !== "var") {
        if (old.where && (old.where.file !== where.file || old.where.line !== where.line || old.exp !== S.macroId)) throw new Error("'" + name + "' is defined twice");
      }
      S.syms[fn] = { value: v, kind: kind, where: where, exp: S.macroId };
    }
    function emit(bytes, src) {
      if (S.pc == null) throw new Error("No address yet: put  * = $1000  (or another address) before the code");
      var start = S.phys;
      for (var i = 0; i < bytes.length; i++) {
        var a = S.phys & 0xFFFF;
        if (S.phys > 0xFFFF) throw new Error("The code runs past $FFFF");
        if (used[a]) S.overlaps++;
        mem[a] = bytes[i] & 0xFF; used[a] = 1;
        S.phys++; S.pc++;
      }
      return start;
    }
    function reserve(n) {
      if (S.pc == null) throw new Error("No address yet");
      S.phys += n; S.pc += n;
    }
    function list(addr, bytes, text) { if (S.listing.length < 20000) S.listing.push({ file: where.file, line: where.line, pc: addr, bytes: bytes, text: text }); }

    // ---------------------------------------------------------- one line
    var condStack = [];          // { active, done, parentActive }
    function active() { return condStack.length === 0 || condStack[condStack.length - 1].active; }

    function doLines(lines, file, firstLine) {
      for (var i = 0; i < lines.length; i++) {
        var raw = lines[i], lineNo = firstLine + i;
        where = { file: file, line: lineNo };
        try {
          var code = stripComment(raw).replace(/\s+$/, "");
          // blocks that collect lines: macro, rept, for
          var dm = /^\s*(?:[A-Za-z_][\w]*\s+)?\.(macro|rept|repeat|for)\b(.*)$/i.exec(code);
          var mlabel = /^\s*([A-Za-z_][\w]*)\s+\.macro\b/i.exec(code);
          if (dm && active()) {
            var kind = dm[1].toLowerCase(), end = kind === "macro" ? /^\s*\.(endm|endmacro)\b/i : kind === "for" ? /^\s*\.(endfor|next)\b/i : /^\s*\.(endr|endrept|endrepeat)\b/i;
            var start = /^\s*\.(macro|rept|repeat|for)\b/i, depth = 1, j = i + 1;
            for (; j < lines.length; j++) {
              var cj = stripComment(lines[j]);
              if (/^\s*(?:[A-Za-z_][\w]*\s+)?\.(macro|rept|repeat|for)\b/i.test(cj)) depth++;
              else if (/^\s*\.(endm|endmacro|endr|endrept|endrepeat|endfor|next)\b/i.test(cj)) { depth--; if (depth === 0) break; }
            }
            if (j >= lines.length) throw new Error("." + kind + " without its end");
            if (!end.test(stripComment(lines[j]))) throw new Error("." + kind + " ends with the wrong directive");
            var body = lines.slice(i + 1, j), bodyLine = lineNo + 1;
            if (kind === "macro") {
              var name = mlabel ? mlabel[1] : null, params = dm[2].trim();
              if (!name) { var pm = /^\s*([A-Za-z_][\w]*)\s*(.*)$/.exec(params); if (!pm) throw new Error(".macro needs a name"); name = pm[1]; params = pm[2]; }
              S.macros[name.toLowerCase()] = { name: name, params: params ? splitArgs(params).map(function (p) { return p.trim(); }) : [], body: body, file: file, line: bodyLine };
            } else if (kind === "rept" || kind === "repeat") {
              var n = evalExpr(dm[2].trim(), true);
              if (n < 0 || n > 65536) throw new Error("Too many repetitions");
              for (var k = 0; k < n; k++) { S.macroId++; doLines(body, file, bodyLine); }
            } else {
              var fm = /^\s*([A-Za-z_][\w]*)\s*=\s*(.+?)\s+to\s+(.+?)(?:\s+step\s+(.+))?\s*$/i.exec(dm[2]);
              if (!fm) throw new Error("Use  .for i = 0 to 7  (step is optional)");
              var a = evalExpr(fm[2], true), b = evalExpr(fm[3], true), st = fm[4] ? evalExpr(fm[4], true) : 1;
              if (!st) throw new Error("The step cannot be 0");
              var count = 0;
              for (var v = a; st > 0 ? v <= b : v >= b; v += st) {
                if (++count > 65536) throw new Error("Too many repetitions");
                S.syms[fm[1]] = { value: v, kind: "var" };
                S.macroId++;
                doLines(body, file, bodyLine);
                where = { file: file, line: lineNo };
              }
            }
            i = j;
            continue;
          }
          line(code, raw);
        } catch (e) {
          if (e && e.fatal) throw e;
          err(e.message || String(e));
        }
      }
    }

    function condition(dir, rest) {
      var top = condStack[condStack.length - 1];
      switch (dir) {
        case "if": case "ifdef": case "ifndef":
          var parent = active(), c = false;
          if (parent) {
            if (dir === "if") { var v = evalExpr(rest); if (!isNum(v)) { S.unknownUsed = true; v = 0; } c = !!v; }
            else { var nm = fullName(rest.trim()), d = !!(S.syms[nm] || prevSyms[nm]); c = dir === "ifdef" ? d : !d; }
          }
          condStack.push({ active: parent && c, done: c, parent: parent });
          return true;
        case "elif":
          if (!top) throw new Error(".elif without .if");
          if (top.done || !top.parent) { top.active = false; return true; }
          var v2 = evalExpr(rest); if (!isNum(v2)) { S.unknownUsed = true; v2 = 0; }
          top.active = !!v2; top.done = top.active;
          return true;
        case "else":
          if (!top) throw new Error(".else without .if");
          top.active = top.parent && !top.done; top.done = true;
          return true;
        case "endif": case "fi":
          if (!top) throw new Error(".endif without .if");
          condStack.pop();
          return true;
      }
      return false;
    }

    function line(code, raw) {
      // conditions are looked at even in skipped parts
      var cm = /^\s*\.(if|ifdef|ifndef|elif|else|endif|fi)\b\s*(.*)$/i.exec(code);
      if (cm) { condition(cm[1].toLowerCase(), cm[2]); return; }
      if (!active()) return;
      var s = code, label = null, m;
      if (!s.trim()) return;
      // anonymous labels
      if ((m = /^([-+])(\s|$)/.exec(s))) {
        if (m[1] === "-") S.anonMinus.push(S.pc); else { S.anonPlus.push(S.pc); S.plusSeen++; }
        if (S.pc == null) throw new Error("No address yet");
        s = s.slice(1);
      } else if ((m = /^\s*([A-Za-z_@.][\w.]*)\s*(=|\.equ\b|\.var\b|:?=)\s*(.*)$/i.exec(s)) && !/^\s*\./.test(m[1]) && !/^\s*\*/.test(s)) {
        // name = value
        var v = evalExpr(m[3]);
        define(m[1], isNum(v) ? v : null, /var/i.test(m[2]) || m[2] === ":=" ? "var" : "const");
        list(null, [], raw);
        return;
      } else if ((m = /^\s*\*\s*=\s*(.+)$/.exec(s))) {
        setOrg(m[1]);
        list(null, [], raw);
        return;
      } else if ((m = /^([A-Za-z_@][\w]*):?(?=\s|$)/.exec(s)) && (!isMnemonic(m[1]) || colLabel(m[1], s.slice(m[0].length))) && !(S.macros[m[1].toLowerCase()] && m[0].slice(-1) !== ":")) {
        label = m[1]; s = s.slice(m[0].length);
      } else if ((m = /^\s*([A-Za-z_@][\w]*):(?=\s|$)/.exec(s))) {
        label = m[1]; s = s.slice(m[0].length);
      }
      if (label) {
        if (label[0] !== "_" && label[0] !== "@") S.global = label;
        if (S.pc == null) throw new Error("No address yet: put  * = $1000  (or another address) before the code");
        define(label, S.pc, "label");
      }
      s = s.trim();
      if (!s) { list(S.pc, [], raw); return; }
      // anonymous label followed by an instruction
      var dir = /^\.([A-Za-z]+)\b\s*(.*)$/.exec(s);
      if (dir) { directive(dir[1].toLowerCase(), dir[2].trim(), raw); return; }
      var im = /^([A-Za-z]{3})(?:\s+|$)(.*)$/.exec(s);
      if (im && isMnemonic(im[1])) { instruction(im[1].toLowerCase(), im[2].trim(), raw); return; }
      var mc = /^\+?([A-Za-z_][\w]*)\s*(.*)$/.exec(s);
      if (mc && S.macros[mc[1].toLowerCase()]) { callMacro(S.macros[mc[1].toLowerCase()], mc[2].trim()); return; }
      throw new Error("Unknown instruction '" + s.split(/\s/)[0] + "'");
    }
    // an undocumented opcode name at the start of a line is a label when a directive,
    // nothing or "=" follows (LAS .byte 0)
    function colLabel(w, after) {
      return !OPS[w.toLowerCase()] && /^\s*($|\.|=)/.test(after);
    }
    function isMnemonic(w) { w = w.toLowerCase(); return !!(OPS[w] || (S.illegal && ILLEGAL[w])); }

    function setOrg(e) {
      var v = evalExpr(e, true);
      if (v < 0 || v > 0xFFFF) throw new Error("The address must be $0000-$FFFF");
      S.pc = v; S.phys = v; S.logical = false;
    }

    function callMacro(mac, argText) {
      var args = argText ? splitArgs(argText) : [];
      if (args.length > mac.params.length) throw new Error("Too many arguments for " + mac.name);
      if (S.depth > 40) throw new Error("Macros call each other too deep");
      var id = ++S.macroId, saveGlobal = S.global, callWhere = where;
      var body = mac.body.map(function (l) {
        var out = l;
        mac.params.forEach(function (p, k) {
          var a = args[k] != null ? args[k] : "";
          out = out.replace(new RegExp("\\\\" + p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "g"), a).replace(new RegExp("\\\\" + (k + 1) + "(?!\\d)", "g"), a);
        });
        return out;
      });
      S.global = "macro" + id;               // local labels of each call are its own
      S.depth++;
      try { doLines(body, mac.file, mac.line); }
      finally { S.depth--; S.global = saveGlobal; where = callWhere; }
    }

    function text(enc, args) {
      var out = [];
      args.forEach(function (a) {
        var sm = /^"((?:\\.|[^"\\])*)"$/.exec(a);
        if (sm) {
          var str = unescape(sm[1]);
          for (var i = 0; i < str.length; i++) {
            var c = str.charCodeAt(i);
            out.push(enc === "screen" ? screencode(c) : enc === "ascii" ? c & 0xFF : petscii(c));
          }
        } else {
          var v = evalExpr(a);
          out.push(isNum(v) ? v & 0xFF : 0);
        }
      });
      return out;
    }

    function directive(d, rest, raw) {
      var args, i, v, start, bytes;
      switch (d) {
        case "org": setOrg(rest); list(null, [], raw); return;
        case "byte": case "db":
          args = splitArgs(rest);
          bytes = text("petscii", args);
          args.forEach(function (a, k) {
            if (/^"/.test(a)) return;
            var x = evalExpr(a);
            if (isNum(x) && (x < -128 || x > 255)) err("Value " + x + " does not fit in a byte");
          });
          start = S.pc; emit(bytes); list(start, bytes, raw); return;
        case "word": case "dw": case "lohi":
          args = splitArgs(rest); bytes = [];
          args.forEach(function (a) {
            var x = evalExpr(a);
            if (!isNum(x)) x = 0;
            else if (x < -32768 || x > 0xFFFF) err("Value " + x + " does not fit in a word");
            bytes.push(x & 0xFF, (x >> 8) & 0xFF);
          });
          start = S.pc; emit(bytes); list(start, bytes, raw); return;
        case "dword":
          args = splitArgs(rest); bytes = [];
          args.forEach(function (a) { var x = evalExpr(a); if (!isNum(x)) x = 0; bytes.push(x & 0xFF, (x >> 8) & 0xFF, (x >> 16) & 0xFF, (x >>> 24) & 0xFF); });
          start = S.pc; emit(bytes); list(start, bytes, raw); return;
        case "text": case "screen": case "ascii": case "null":
          args = splitArgs(rest);
          bytes = text(d === "null" ? "petscii" : d, args);
          if (d === "null") bytes.push(0);
          start = S.pc; emit(bytes); list(start, bytes, raw); return;
        case "fill": case "res":
          args = splitArgs(rest);
          var n = evalExpr(args[0], true);
          if (n < 0 || n > 0x10000) throw new Error("Bad length for .fill");
          start = S.pc;
          if (args.length > 1) {
            var fv = evalExpr(args[1]); fv = isNum(fv) ? fv : 0;
            bytes = []; for (i = 0; i < n; i++) bytes.push(fv);
            emit(bytes);
          } else reserve(n);
          list(start, [], raw); return;
        case "align":
          args = splitArgs(rest);
          var al = evalExpr(args[0], true);
          if (al <= 0) throw new Error("Bad alignment");
          var pad = (al - (S.pc % al)) % al;
          start = S.pc;
          if (args.length > 1) { var av = evalExpr(args[1], true); bytes = []; for (i = 0; i < pad; i++) bytes.push(av); emit(bytes); }
          else reserve(pad);
          list(start, [], raw); return;
        case "basic":
          // 10 SYS address (without an address: the code right after the line)
          if (S.pc == null) setOrg("$0801");
          start = S.pc;
          var target;
          if (rest) {
            target = evalExpr(rest);
            if (!isNum(target)) target = prevResult && prevResult.basicTarget != null ? prevResult.basicTarget : start + 12;
          } else {
            target = start + 12;
            if (String(target).length !== 4) target = start + 8 + String(start + 13).length;
          }
          var digits = String(target & 0xFFFF), link = start + 6 + digits.length;
          bytes = [link & 0xFF, link >> 8, 10, 0, 0x9E];
          for (i = 0; i < digits.length; i++) bytes.push(digits.charCodeAt(i));
          bytes.push(0, 0, 0);
          emit(bytes);
          S.basicStart = start; S.basicTarget = target & 0xFFFF;
          list(start, bytes, raw); return;
        case "binary": case "incbin":
          args = splitArgs(rest);
          var bn = /^"(.*)"$/.exec(args[0] || "");
          if (!bn) throw new Error('Use  .binary "file"');
          var bin = files[bn[1]];
          if (!bin) throw new Error("There is no file " + bn[1] + " in the project");
          if (typeof bin === "string") bin = new TextEncoder().encode(bin);
          var off = args[1] ? evalExpr(args[1], true) : 0, blen = args[2] ? evalExpr(args[2], true) : bin.length - off;
          if (off < 0 || blen < 0 || off + blen > bin.length) throw new Error("Offset or length beyond the end of " + bn[1]);
          start = S.pc; emit(bin.subarray(off, off + blen)); list(start, Array.from(bin.subarray(off, Math.min(off + blen, off + 8))), raw); return;
        case "include":
          var inc = /^"(.*)"$/.exec(rest);
          if (!inc) throw new Error('Use  .include "file"');
          var src = files[inc[1]];
          if (src == null) throw new Error("There is no file " + inc[1] + " in the project");
          if (typeof src !== "string") throw new Error(inc[1] + " is not a source file");
          if (S.depth > 20) throw new Error("Files include each other too deep");
          var saveWhere = where;
          S.depth++;
          try { doLines(src.split(/\r?\n/), inc[1], 1); } finally { S.depth--; where = saveWhere; }
          return;
        case "logical":
          v = evalExpr(rest, true);
          if (S.pc == null) throw new Error("No address yet");
          S.logical = true; S.pc = v & 0xFFFF;
          list(null, [], raw); return;
        case "endlogical": case "here":
          S.logical = false; S.pc = S.phys;
          list(null, [], raw); return;
        case "cpu":
          var cn = rest.replace(/"/g, "").trim().toLowerCase();
          if (cn === "6502") S.illegal = false;
          else if (cn === "6502i" || cn === "6510") S.illegal = true;
          else throw new Error("Unknown CPU " + rest);
          return;
        case "assert": case "cerror": case "cwarn":
          args = splitArgs(rest);
          v = evalExpr(args[0]);
          var msg = args[1] ? args[1].replace(/^"|"$/g, "") : "Assertion failed";
          if (isNum(v)) {
            var fail = d === "assert" ? !v : !!v;
            if (fail) { if (d === "cwarn") warn(msg); else err(msg); }
          }
          return;
        case "error": err(rest.replace(/^"|"$/g, "") || "Error"); return;
        case "warn": warn(rest.replace(/^"|"$/g, "")); return;
        case "endm": case "endmacro": case "endr": case "endrept": case "endfor": case "next":
          throw new Error("." + d + " without its start");
      }
      throw new Error("Unknown directive ." + d);
    }

    function instruction(mn, operand, raw) {
      var table = OPS[mn] || ILLEGAL[mn];
      if (mn === "nop" && operand) table = NOPX;
      var force = null, m;
      if ((m = /^@([bw])\s+(.*)$/i.exec(operand))) { force = m[1].toLowerCase(); operand = m[2]; }
      var mode, expr = null, idx = S.insn++, key = where.file + ":" + where.line + ":" + S.macroId;
      if (!operand) mode = table.imp != null ? "imp" : table.acc != null ? "acc" : null;
      else if (/^a$/i.test(operand) && table.acc != null) mode = "acc";
      else if (operand[0] === "#") { mode = "imm"; expr = operand.slice(1); }
      else if ((m = /^\((.+)\)\s*,\s*y$/i.exec(operand))) { mode = "indy"; expr = m[1]; }
      else if ((m = /^\((.+),\s*x\)$/i.exec(operand))) { mode = "indx"; expr = m[1]; }
      else if ((m = /^\((.+)\)$/.exec(operand)) && table.ind != null) { mode = "ind"; expr = m[1]; }
      else if ((m = /^(.+),\s*([xy])$/i.exec(operand))) { mode = m[2].toLowerCase(); expr = m[1]; }
      else { mode = "addr"; expr = operand; }
      if (mode == null) throw new Error(mn.toUpperCase() + " needs an operand");
      var bytes, val = expr != null ? evalExpr(expr) : null, known = isNum(val);
      var start = S.pc;
      if (table.rel != null) {
        if (mode !== "addr") throw new Error(mn.toUpperCase() + " takes a target address");
        var off = known ? val - (S.pc + 2) : 0;
        if (known && (off < -128 || off > 127) && strict) throw new Error("Branch too far (by " + (off < 0 ? -128 - off : off - 127) + " bytes)");
        bytes = [table.rel, off & 0xFF];
      } else if (mode === "imp" || mode === "acc") bytes = [table[mode]];
      else if (mode === "imm") {
        if (table.imm == null) throw new Error(mn.toUpperCase() + " has no immediate mode (#)");
        if (known && (val < -128 || val > 255)) throw new Error("Value " + val + " does not fit in a byte (use < or > for the low or high byte)");
        bytes = [table.imm, known ? val & 0xFF : 0];
      } else if (mode === "indx" || mode === "indy") {
        if (table[mode] == null) throw new Error(mn.toUpperCase() + " has no (zp" + (mode === "indx" ? ",X)" : "),Y") + " mode");
        if (known && (val < 0 || val > 255)) throw new Error("The address must be in the zero page ($00-$FF)");
        bytes = [table[mode], known ? val : 0];
      } else if (mode === "ind") {
        if (known && (val < 0 || val > 0xFFFF)) throw new Error("Address out of range");
        if (known && (val & 0xFF) === 0xFF) warn("JMP ($xxFF) takes the high byte from $xx00 on the 6502");
        bytes = [table.ind, known ? val & 0xFF : 0, known ? val >> 8 : 0];
      } else {
        // zero page or absolute: decided once (in the first pass that sees this line)
        var zpMode = mode === "addr" ? "zp" : "zp" + mode, absMode = mode === "addr" ? "abs" : "abs" + mode;
        var dec = decisions[key];
        if (!dec) {
          var zp = force === "b" || (force !== "w" && known && val >= 0 && val <= 255 && table[zpMode] != null);
          if (table[absMode] == null && table[zpMode] != null) zp = true;          // e.g. STX zp,Y only
          dec = decisions[key] = { zp: zp };
        }
        if (force === "b") dec.zp = true; else if (force === "w") dec.zp = false;
        var useZp = dec.zp && table[zpMode] != null;
        if (!useZp && table[absMode] == null) {
          if (table[zpMode] != null) useZp = true;
          else throw new Error(mn.toUpperCase() + " has no " + (mode === "addr" ? "address" : mode.toUpperCase() + "-indexed") + " mode");
        }
        if (known && (val < 0 || val > 0xFFFF)) throw new Error("Address " + val + " out of range");
        if (useZp) {
          if (known && val > 255) throw new Error("The address " + hex(val) + " is not in the zero page");
          bytes = [table[zpMode], known ? val : 0];
        } else bytes = [table[absMode], known ? val & 0xFF : 0, known ? val >> 8 : 0];
      }
      emit(bytes);
      list(start, bytes, raw);
    }

    // ---------------------------------------------------------- run the main file
    var mainSrc = files[main];
    if (typeof mainSrc !== "string") throw new Error("No main file");
    try { doLines(mainSrc.split(/\r?\n/), main, 1); }
    catch (e) { err(e.message || String(e)); }
    if (condStack.length) S.errors.push({ file: main, line: mainSrc.split(/\r?\n/).length, msg: ".if without .endif" });
    return {
      syms: S.syms, mem: mem, used: used, errors: S.errors, warnings: S.warnings, unknownUsed: S.unknownUsed,
      anonPlus: S.anonPlus, macros: S.macros, listing: S.listing, basicStart: S.basicStart, basicTarget: S.basicTarget,
      overlaps: S.overlaps, pass: pass
    };
  }

  function hex(v, n) { return "$" + ("000" + (v >>> 0).toString(16).toUpperCase()).slice(-(n || 4)); }

  function finish(r, opts) {
    var errors = r.errors.slice(), warnings = r.warnings.slice();
    var lo = -1, hi = -1;
    for (var a = 0; a < 0x10000; a++) if (r.used[a]) { if (lo < 0) lo = a; hi = a; }
    if (r.overlaps) warnings.push({ file: null, line: null, msg: r.overlaps + " bytes were written more than once (overlapping code)" });
    var out = { errors: errors, warnings: warnings, passes: r.pass, listing: r.listing };
    out.symbols = Object.keys(r.syms).filter(function (k) { return r.syms[k].value != null && !/^macro\d+\./.test(k); })
      .map(function (k) { var w = r.syms[k].where; return { name: k, value: r.syms[k].value, kind: r.syms[k].kind, file: w ? w.file : null, line: w ? w.line : null }; })
      .sort(function (a, b) { return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1; });
    if (lo < 0) { out.empty = true; return out; }
    out.start = lo; out.end = hi + 1;
    out.bin = r.mem.slice(lo, hi + 1);
    out.prg = new Uint8Array(out.bin.length + 2);
    out.prg[0] = lo & 0xFF; out.prg[1] = lo >> 8; out.prg.set(out.bin, 2);
    // gaps (memory not written between the parts)
    var segs = [], s = -1;
    for (a = lo; a <= hi + 1; a++) {
      if (a <= hi && r.used[a]) { if (s < 0) s = a; }
      else if (s >= 0) { segs.push([s, a]); s = -1; }
    }
    out.segments = segs;
    // how to start: a BASIC line, a label "start", or the first address
    var st = r.syms.start || r.syms.Start || r.syms.START;
    if (r.basicStart === 0x0801) out.run = { mode: "run", addr: r.basicTarget };
    else if (st && st.value != null) out.run = { mode: "sys", addr: st.value };
    else out.run = { mode: "sys", addr: lo };
    return out;
  }

  global.Asm6502 = {
    assemble: assemble, OPS: OPS, ILLEGAL: ILLEGAL, DIRECTIVES: DIRECTIVES, petscii: petscii, screencode: screencode,
    tokenize: tokenize, stripComment: stripComment
  };
})(typeof window !== "undefined" ? window : globalThis);
