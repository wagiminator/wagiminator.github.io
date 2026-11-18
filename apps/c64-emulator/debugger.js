/* C64 Emulator: monitor and debugger.
 * Disassembly, registers, stack, breakpoints and watchpoints, memory with the C64
 * character set, I/O registers, instruction history and a VICE-style command line.
 * The checks around every instruction live in C64.runFrameDebug (emu/c64.js).
 */
(function () {
  "use strict";

  var DA = window.C64Disasm, hex = DA.hex;
  var DIS_ROWS = 24, MEM_ROWS = 16, HIST_ROWS = 60;
  var STORE_KEY = "c64emu.debugger";

  function h2(v) { return hex(v & 0xFF, 2); }
  function h4(v) { return hex(v & 0xFFFF, 4); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function petsciiToScreen(p) {
    if (p < 0x20) return p + 0x80;
    if (p < 0x40) return p;
    if (p < 0x60) return p - 0x40;
    if (p < 0x80) return p - 0x20;
    if (p < 0xA0) return p + 0x40;
    if (p < 0xC0) return p - 0x40;
    if (p === 0xFF) return 0x5E;
    return p - 0x80;
  }
  // printable text for console dumps
  function screenToText(sc) {
    sc &= 0x7F;
    if (sc === 0) return "@";
    if (sc < 0x1B) return String.fromCharCode(0x40 + sc);
    if (sc >= 0x20 && sc < 0x40) return String.fromCharCode(sc);
    if (sc === 0x1B) return "["; if (sc === 0x1D) return "]";
    return ".";
  }
  // an address or range: "c000", "$c000", "c000-c0ff", "c000 c0ff"
  function parseAddr(s) {
    var n = DA.parseNum(String(s));
    return n && n.v <= 0xFFFF ? n.v : -1;
  }
  function parseRange(s) {
    var p = String(s).trim().split(/\s*[-\s]\s*/);
    var lo = parseAddr(p[0]);
    if (lo < 0) return null;
    var hi = p[1] !== undefined && p[1] !== "" ? parseAddr(p[1]) : lo;
    if (hi < 0) return null;
    if (hi < lo) { var t = lo; lo = hi; hi = t; }
    return { lo: lo, hi: hi };
  }

  window.C64Debugger = function (host) {
    var D = C64.newDebugState();
    var c64 = null;
    var open = false, stopped = false;
    var bps = [], nextId = 1;
    var opts = { stopIrq: false, stopNmi: false, stopBrk: false, stopJam: true };
    var base = { mem: new Uint8Array(0x10000), regs: null, clk: 0 };   // state when execution last resumed
    var stopClk = 0;
    var pauseReq = false;
    var view = { dis: 0, sel: -1, follow: true, mem: 0x0400, memSel: -1, memSrc: "cpu", charset: "upper", nib: -1, tab: "io" };
    var con = { lastCmd: "", nextD: -1, nextM: -1, asmAt: -1, history: [], hpos: 0 };

    try {
      var saved = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
      if (Array.isArray(saved.bps)) bps = saved.bps.map(function (b) { b.hits = 0; return b; });
      if (saved.opts) Object.assign(opts, saved.opts);
      if (saved.view) { view.mem = saved.view.mem || 0x0400; view.memSrc = saved.view.memSrc || "cpu"; view.charset = saved.view.charset || "upper"; view.tab = saved.view.tab || "io"; }
      bps.forEach(function (b) { nextId = Math.max(nextId, b.id + 1); });
    } catch (e) { /* storage unavailable */ }
    function persist() {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify({
          bps: bps.map(function (b) { return { id: b.id, type: b.type, lo: b.lo, hi: b.hi, on: b.on }; }),
          opts: opts, view: { mem: view.mem, memSrc: view.memSrc, charset: view.charset, tab: view.tab }
        }));
      } catch (e) { /* ignore */ }
    }

    // ------------------------------------------------------------ DOM
    var root = document.getElementById("debugger");
    root.innerHTML =
      '<div class="dbg-head">' +
        '<h2 id="dbg-title">Debugger</h2>' +
        '<p class="dbg-state" id="dbg-state" aria-live="polite"></p>' +
        '<button type="button" class="dbg-close" data-dbg="close" aria-label="Close the debugger" title="Close the debugger">✕</button>' +
        '<div class="dbg-ctl" role="toolbar" aria-label="Execution">' +
          '<button type="button" class="dbg-btn dbg-main" data-dbg="toggle">Break</button>' +
          '<button type="button" class="dbg-btn" data-dbg="step" title="Run one instruction (z)">Step</button>' +
          '<button type="button" class="dbg-btn" data-dbg="over" title="Run a JSR call as one step (n)">Step over</button>' +
          '<button type="button" class="dbg-btn" data-dbg="out" title="Run until the current subroutine returns (ret)">Step out</button>' +
          '<button type="button" class="dbg-btn" data-dbg="line" title="Run until the beam reaches the next raster line">Next line</button>' +
          '<button type="button" class="dbg-btn" data-dbg="frame" title="Run until the end of the frame">Next frame</button>' +
          '<button type="button" class="dbg-btn" data-dbg="cursor" title="Run until the selected line in the disassembly">Run to selected</button>' +
        '</div>' +
      '</div>' +
      '<div class="dbg-grid">' +
        '<section class="dbg-pane dbg-dis" aria-labelledby="dbg-dis-h">' +
          '<div class="pane-head"><h3 id="dbg-dis-h">Disassembly</h3>' +
            '<input class="dbg-in" id="dbg-dis-go" placeholder="Go to" aria-label="Disassemble from address" spellcheck="false" autocomplete="off">' +
            '<label class="dbg-chk"><input type="checkbox" id="dbg-follow" checked> Follow PC</label>' +
            '<span class="scroll-btns"><button type="button" class="dbg-btn sb" data-dbg="disup" aria-label="Scroll up">▲</button>' +
            '<button type="button" class="dbg-btn sb" data-dbg="disdown" aria-label="Scroll down">▼</button></span></div>' +
          '<div class="dis" id="dbg-dis" tabindex="0" aria-label="Disassembly. Arrow keys move, B toggles a breakpoint."></div>' +
          '<p class="pane-foot">Click the dot or press B for a breakpoint. Scroll with the mouse wheel or the arrow keys.</p>' +
        '</section>' +
        '<section class="dbg-pane dbg-cpu" aria-labelledby="dbg-cpu-h">' +
          '<div class="pane-head"><h3 id="dbg-cpu-h">CPU</h3></div>' +
          '<div class="regs" id="dbg-regs"></div>' +
          '<div class="flags" id="dbg-flags" role="group" aria-label="Status flags"></div>' +
          '<dl class="facts" id="dbg-facts"></dl>' +
          '<h3 class="sub">Stack</h3>' +
          '<ol class="stack" id="dbg-stack"></ol>' +
        '</section>' +
        '<section class="dbg-pane dbg-bps" aria-labelledby="dbg-bps-h">' +
          '<div class="pane-head"><h3 id="dbg-bps-h">Breakpoints</h3></div>' +
          '<form class="bp-form" id="dbg-bp-form">' +
            '<select class="dbg-in" id="dbg-bp-type" aria-label="Kind">' +
              '<option value="exec">Execute</option><option value="store">Write</option><option value="load">Read</option>' +
              '<option value="access">Read or write</option><option value="raster">Raster line</option></select>' +
            '<input class="dbg-in" id="dbg-bp-addr" placeholder="C000 or D020-D02E" aria-label="Address or range" spellcheck="false" autocomplete="off">' +
            '<button type="submit" class="dbg-btn">Add</button>' +
          '</form>' +
          '<p class="bp-err" id="dbg-bp-err" role="alert" hidden></p>' +
          '<ul class="bp-list" id="dbg-bp-list"></ul>' +
          '<fieldset class="stop-on"><legend>Also stop on</legend>' +
            '<label class="dbg-chk"><input type="checkbox" data-opt="stopIrq"> IRQ</label>' +
            '<label class="dbg-chk"><input type="checkbox" data-opt="stopNmi"> NMI</label>' +
            '<label class="dbg-chk"><input type="checkbox" data-opt="stopBrk"> BRK</label>' +
            '<label class="dbg-chk"><input type="checkbox" data-opt="stopJam"> CPU jam</label>' +
          '</fieldset>' +
        '</section>' +
        '<section class="dbg-pane dbg-mem" aria-labelledby="dbg-mem-h">' +
          '<div class="pane-head"><h3 id="dbg-mem-h">Memory</h3>' +
            '<input class="dbg-in" id="dbg-mem-go" placeholder="Go to" aria-label="Show memory from address" spellcheck="false" autocomplete="off">' +
            '<select class="dbg-in" id="dbg-mem-src" aria-label="Memory as seen by"><option value="cpu">As the CPU sees it</option><option value="ram">RAM only</option></select>' +
            '<select class="dbg-in" id="dbg-mem-cs" aria-label="Characters"><option value="upper">Screen codes</option><option value="lower">Screen codes, lower case</option><option value="petscii">PETSCII</option></select>' +
            '<span class="scroll-btns"><button type="button" class="dbg-btn sb" data-dbg="memup" aria-label="Scroll up">▲</button>' +
            '<button type="button" class="dbg-btn sb" data-dbg="memdown" aria-label="Scroll down">▼</button></span>' +
          '</div>' +
          '<div class="mem" id="dbg-mem" tabindex="0" aria-label="Memory. Click a byte and type hex digits to change it."></div>' +
          '<p class="pane-foot" id="dbg-mem-foot">Click a byte and type to change it. Changed since the last run: highlighted.</p>' +
        '</section>' +
        '<section class="dbg-pane dbg-tabs">' +
          '<div class="tabs" role="tablist" aria-label="Views">' +
            '<button type="button" role="tab" id="dbg-tab-io" data-tab="io">I/O</button>' +
            '<button type="button" role="tab" id="dbg-tab-hist" data-tab="hist">History</button>' +
          '</div>' +
          '<div class="tab-body" id="dbg-io" role="tabpanel" aria-labelledby="dbg-tab-io"></div>' +
          '<div class="tab-body" id="dbg-hist" role="tabpanel" aria-labelledby="dbg-tab-hist" hidden></div>' +
        '</section>' +
        '<section class="dbg-pane dbg-con" aria-labelledby="dbg-con-h">' +
          '<div class="pane-head"><h3 id="dbg-con-h">Monitor</h3><span class="pane-note">Type <b>help</b> for the commands. Enter on an empty line repeats z, n, m and d.</span></div>' +
          '<div class="con-out" id="dbg-con-out" role="log" aria-live="polite"></div>' +
          '<form class="con-line" id="dbg-con-form"><label for="dbg-con-in" id="dbg-con-prompt">&gt;</label>' +
            '<input id="dbg-con-in" spellcheck="false" autocomplete="off" autocapitalize="off"></form>' +
        '</section>' +
      '</div>';

    var $ = function (id) { return document.getElementById(id); };
    var el = {
      state: $("dbg-state"), dis: $("dbg-dis"), regs: $("dbg-regs"), flags: $("dbg-flags"), facts: $("dbg-facts"),
      stack: $("dbg-stack"), bpList: $("dbg-bp-list"), bpErr: $("dbg-bp-err"), mem: $("dbg-mem"), io: $("dbg-io"),
      hist: $("dbg-hist"), out: $("dbg-con-out"), input: $("dbg-con-in"), prompt: $("dbg-con-prompt"),
      main: root.querySelector('[data-dbg="toggle"]')
    };

    // registers
    var REGS = [["pc", "PC", 4], ["a", "A", 2], ["x", "X", 2], ["y", "Y", 2], ["s", "SP", 2]];
    el.regs.innerHTML = REGS.map(function (r) {
      return '<label class="reg"><span>' + r[1] + '</span><input class="dbg-in" data-reg="' + r[0] + '" maxlength="' + r[2] +
        '" spellcheck="false" autocomplete="off" aria-label="Register ' + r[1] + '"></label>';
    }).join("");
    var FLAGS = [["n", "N", "negative"], ["v", "V", "overflow"], ["-", "-", ""], ["b", "B", "break"], ["d", "D", "decimal"],
                 ["i", "I", "interrupts off"], ["z", "Z", "zero"], ["c", "C", "carry"]];
    el.flags.innerHTML = FLAGS.map(function (f) {
      return f[0] === "-" || f[0] === "b" ? '<span class="flag fixed" title="' + (f[0] === "b" ? "B exists only on the stack" : "always 1") + '">' + f[1] + '</span>'
        : '<button type="button" class="flag" data-flag="' + f[0] + '" title="' + f[2] + '" aria-pressed="false">' + f[1] + '</button>';
    }).join("");

    // memory rows with a canvas for the characters
    var memRows = [];
    (function () {
      var html = "";
      for (var r = 0; r < MEM_ROWS; r++) {
        html += '<div class="mr"><span class="ad"></span><span class="hx">';
        for (var c = 0; c < 16; c++) html += '<i data-c="' + c + '"></i>';
        html += '</span><canvas width="128" height="8" aria-hidden="true"></canvas></div>';
      }
      el.mem.innerHTML = html;
      el.mem.querySelectorAll(".mr").forEach(function (row, r) {
        memRows.push({ row: row, ad: row.querySelector(".ad"), cells: row.querySelectorAll("i"), cv: row.querySelector("canvas"),
          ctx: row.querySelector("canvas").getContext("2d") });
        row.querySelectorAll("i").forEach(function (cell, c) { cell.setAttribute("data-r", r); });
      });
    })();

    // ------------------------------------------------------------ machine access
    function cpu() { return c64.cpu; }
    function peek(a) { a &= 0xFFFF; return view.memSrc === "ram" && a >= 2 ? c64.ram[a] : c64.peek(a); }
    function peekCpu(a) { return c64.peek(a & 0xFFFF); }
    function poke(a, v, src) {
      a &= 0xFFFF; v &= 0xFF;
      if ((src || view.memSrc) === "ram" && a >= 2) c64.ram[a] = v;
      else c64.write(a, v);
    }

    function attach(m) {
      c64 = m;
      if (open) { c64.dbg = D; applyBps(); }
      if (stopped) { stopped = false; }
      if (open) render();
    }

    // ------------------------------------------------------------ breakpoints
    function applyBps() {
      D.exec.fill(0); D.watch.fill(0); D.raster.fill(0);
      var watching = false;
      bps.forEach(function (b) {
        if (!b.on) return;
        for (var a = b.lo; a <= b.hi; a++) {
          if (b.type === "exec") D.exec[a] = 1;
          else if (b.type === "raster") { if (a < 312) D.raster[a] = 1; }
          else { D.watch[a] |= b.type === "load" ? 1 : b.type === "store" ? 2 : 3; watching = true; }
        }
      });
      D.stopIrq = opts.stopIrq; D.stopNmi = opts.stopNmi; D.stopBrk = opts.stopBrk; D.stopJam = opts.stopJam;
      if (c64) c64.setWatching(open && watching);
      persist();
    }
    function addBp(type, lo, hi) {
      var b = { id: nextId++, type: type, lo: lo, hi: hi, on: true, hits: 0 };
      bps.push(b); applyBps(); renderBps();
      return b;
    }
    function bpText(b) {
      var r = b.type === "raster" ? "line " + b.lo + (b.hi !== b.lo ? "–" + b.hi : "")
        : "$" + h4(b.lo) + (b.hi !== b.lo ? "–$" + h4(b.hi) : "");
      return { exec: "Execute ", store: "Write ", load: "Read ", access: "Read/write ", raster: "Raster " }[b.type] + r;
    }
    function findBp(kind, a) {
      var types = { break: ["exec"], load: ["load", "access"], store: ["store", "access"], raster: ["raster"] }[kind];
      if (!types) return null;
      for (var i = 0; i < bps.length; i++) {
        var b = bps[i];
        if (b.on && types.indexOf(b.type) >= 0 && a >= b.lo && a <= b.hi) return b;
      }
      return null;
    }
    function toggleExecBp(a) {
      var b = bps.filter(function (x) { return x.type === "exec" && x.lo === a && x.hi === a; })[0];
      if (b) bps.splice(bps.indexOf(b), 1); else bps.push({ id: nextId++, type: "exec", lo: a, hi: a, on: true, hits: 0 });
      applyBps(); renderBps(); renderDis();
    }

    // ------------------------------------------------------------ running and stopping
    function takeBase() {
      for (var a = 0; a < 0x10000; a++) base.mem[a] = c64.peek(a);
      base.ram = c64.ram.slice();
      var p = cpu();
      base.regs = { pc: p.pc, a: p.a, x: p.x, y: p.y, s: p.s, p: p.getP(false) };
      base.clk = c64.clk;
    }
    function prepareRun(mode) {
      var p = cpu();
      takeBase();
      D.reason = null;
      D.skip = p.pc;                 // do not stop again at the breakpoint we stand on
      D.mode = mode || "run";
      D.lastLine = c64.vic.raster;
      stopped = false;
    }
    // run until the machine stops; a short run stays synchronous, a long one goes on in the main loop
    function runFor(maxFrames) {
      for (var f = 0; f < maxFrames; f++) {
        if (c64.runFrame() === false) { c64.sid.takeSamples(); onStop(); return; }
      }
      c64.sid.takeSamples();
      host.resume();
      render();
    }
    function onStop() {
      var why = D.reason || { kind: "pause", addr: cpu().pc };
      if (pauseReq) { pauseReq = false; if (why.kind === "step") why = { kind: "pause", addr: cpu().pc }; }
      D.reason = null;
      stopped = true;
      stopClk = c64.clk;
      var b = findBp(why.kind, why.kind === "load" || why.kind === "store" ? why.mem : why.kind === "raster" ? why.line : why.addr);
      if (b) { b.hits = (b.hits || 0) + 1; why.bp = b; }
      lastWhy = why;
      if (view.follow) showPc();
      host.stop();
      render();
      if (why.kind !== "step" && why.kind !== "pause") conPrint(stateText(why), "note");
    }
    var lastWhy = null;
    function stateText(why) {
      var at = " at $" + h4(cpu().pc);
      switch (why.kind) {
        case "break": return "Breakpoint" + (why.bp ? " #" + why.bp.id : "") + at;
        case "brk": return "BRK instruction" + at;
        case "jam": return "The CPU jammed (JAM instruction)" + at;
        case "irq": return "IRQ taken, now" + at;
        case "nmi": return "NMI taken, now" + at;
        case "out": return "Returned from the subroutine, now" + at;
        case "line": return "Raster line " + why.line + at;
        case "raster": return "Raster breakpoint" + (why.bp ? " #" + why.bp.id : "") + ": line " + why.line + at;
        case "frame": return "End of the frame" + at;
        case "cursor": return "Reached the selected line" + at;
        case "load": return "Read of $" + h4(why.mem) + " (value $" + h2(why.value) + ") by the instruction at $" + h4(why.addr);
        case "store": return "Write to $" + h4(why.mem) + ": $" + h2(why.value) + " (was $" + h2(why.old) + ") by the instruction at $" + h4(why.addr);
        case "step": return "Next instruction" + at;
        default: return "Paused" + at;
      }
    }

    function breakNow() {
      if (stopped || !open) return;
      pauseReq = true;
      D.mode = "step";              // the next instruction stops; the main loop reports it
    }
    function cont() {
      if (!stopped) return;
      prepareRun("run");
      host.resume();
      render();
    }
    function step(n) {
      if (!stopped) return;
      n = n || 1;
      prepareRun("step");
      for (var i = 0; i < n; i++) {
        if (i > 0) { D.reason = null; D.skip = cpu().pc; D.mode = "step"; D.lastLine = c64.vic.raster; }
        var done = false;
        for (var f = 0; f < 4 && !done; f++) done = c64.runFrame() === false;
        if (!done || (D.reason && D.reason.kind !== "step")) break;   // something else stopped it
      }
      c64.sid.takeSamples();
      onStop();
    }
    function stepOver() {
      if (!stopped) return;
      var p = cpu();
      if (peekCpu(p.pc) === 0x20) {
        prepareRun("over");
        D.tempAt = (p.pc + 3) & 0xFFFF; D.tempS = p.s;
        runFor(50);
      } else step(1);
    }
    function stepOut() {
      if (!stopped) return;
      prepareRun("out");
      D.outS = cpu().s;
      runFor(50);
    }
    function runMode(mode) {
      if (!stopped) return;
      prepareRun(mode);
      runFor(mode === "frame" ? 1 : 50);
    }
    function runToSel() {
      if (!stopped || view.sel < 0) return;
      prepareRun("run");
      D.tempAt = view.sel; D.tempS = 0;
      runFor(50);
    }

    // ------------------------------------------------------------ rendering
    function render() {
      if (!open || !c64) return;
      renderHead(); renderDis(); renderCpu(); renderBps(); renderMem();
      if (view.tab === "io") renderIo(); else renderHist();
    }
    function renderLive() {
      // while the machine runs: registers, memory and I/O, a few times per second
      if (!open || !c64 || stopped) return;
      renderCpu(); renderMem();
      if (view.tab === "io") renderIo();
    }
    function renderHead() {
      root.classList.toggle("is-stopped", stopped);
      el.main.textContent = stopped ? "Continue" : "Break";
      el.main.title = stopped ? "Continue (g)" : "Stop the C64 now";
      root.querySelectorAll(".dbg-ctl .dbg-btn:not(.dbg-main)").forEach(function (b) { b.disabled = !stopped; });
      if (!stopped) { el.state.innerHTML = '<span class="pill run">Running</span>'; return; }
      var d = c64.clk - base.clk;
      el.state.innerHTML = '<span class="pill stop">Stopped</span> ' + esc(stateText(lastWhy || { kind: "pause" })) +
        (base.regs ? ' <span class="cyc">' + d + (d === 1 ? " cycle" : " cycles") + " since the last run</span>" : "");
    }
    // scroll the disassembly to the PC, unless it is already well inside the view
    function showPc() {
      var pc = cpu().pc, at = disLines.indexOf(pc);
      if (at >= 0 && at < DIS_ROWS - 5 && disLines[0] === view.dis) return;
      var top = pc;
      for (var i = 0; i < 6; i++) top = DA.previous(peekCpu, top);
      view.dis = top;
    }
    var disLines = [];
    function renderDis() {
      var a = view.dis, html = "", pc = cpu().pc, pcSeen = false;
      disLines = [];
      for (var i = 0; i < DIS_ROWS; i++) {
        var d = DA.disassemble(peekCpu, a);
        disLines.push(a);
        var bp = D.exec[a], cls = "dl" + (a === pc ? " pc" : "") + (a === view.sel ? " sel" : "") + (bp ? " bp" : "") + (d.doc ? "" : " ill");
        if (a === pc) pcSeen = true;
        var bytes = d.bytes.map(h2).join(" ");
        var arg = esc(d.arg);
        if (d.target >= 0) arg = '<a href="#" data-go="' + d.target + '">' + arg + "</a>";
        html += '<div class="' + cls + '" data-a="' + a + '"><button type="button" class="gut" data-bp="' + a + '" aria-label="' +
          (bp ? "Remove the breakpoint at $" : "Breakpoint at $") + h4(a) + '"></button><span class="ad">' + h4(a) + '</span><span class="by">' + bytes +
          '</span><span class="in"><b>' + d.mnem + "</b> " + arg + '</span><span class="lb">' + esc(d.label) + "</span></div>";
        a = (a + d.len) & 0xFFFF;
      }
      el.dis.innerHTML = html;
      view.disEnd = a;
      return pcSeen;
    }
    var flagBits = { n: 0x80, v: 0x40, d: 0x08, i: 0x04, z: 0x02, c: 0x01 };
    function renderCpu() {
      var p = cpu(), P = p.getP(false), br = base.regs;
      el.regs.querySelectorAll("input").forEach(function (inp) {
        var k = inp.getAttribute("data-reg"), v = p[k];
        if (document.activeElement !== inp) inp.value = k === "pc" ? h4(v) : h2(v);
        inp.readOnly = !stopped;
        inp.classList.toggle("chg", !!(br && stopped && br[k] !== v));
      });
      el.flags.querySelectorAll("button").forEach(function (b) {
        var f = b.getAttribute("data-flag"), on = !!(P & flagBits[f]);
        b.setAttribute("aria-pressed", on ? "true" : "false");
        b.disabled = !stopped;
        b.classList.toggle("chg", !!(br && stopped && ((br.p ^ P) & flagBits[f])));
      });
      var vic = c64.vic, port = c64.peek(1);
      var mapNames = [];
      if (c64.rmap[0xA] === c64.basic) mapNames.push("BASIC");
      if (c64.rmap[0xE] === c64.kernal) mapNames.push("KERNAL");
      if (c64.io[0xD] === 1) mapNames.push("I/O"); else if (c64.rmap[0xD] === c64.charRom) mapNames.push("CHAR ROM");
      if (c64.cart) mapNames.push("cartridge");
      var facts = [
        ["Raster", "line " + vic.raster + ", cycle " + vic.cyc],
        ["Cycles", String(c64.clk)],
        ["IRQ / NMI", (p.irq ? "IRQ line low" : "IRQ line high") + " · " + (p.nmiLine ? "NMI low" : "NMI high")],
        ["$01 port", "$" + h2(port) + " · " + (mapNames.length ? mapNames.join(", ") : "all RAM")]
      ];
      el.facts.innerHTML = facts.map(function (f) { return "<div><dt>" + f[0] + "</dt><dd>" + esc(f[1]) + "</dd></div>"; }).join("");
      // stack: the top bytes, with return addresses of JSR calls
      var html = "";
      for (var i = 1; i <= 8 && p.s + i <= 0xFF; i++) {
        var sa = 0x100 + p.s + i, v = c64.ram[sa], note = "";
        if (p.s + i + 1 <= 0xFF) {
          var ret = (v | (c64.ram[sa + 1] << 8)), call = (ret - 2) & 0xFFFF;
          if (peekCpu(call) === 0x20) note = '<a href="#" data-go="' + ((ret + 1) & 0xFFFF) + '">returns to $' + h4(ret + 1) + "</a> (JSR at $" + h4(call) + ")";
        }
        html += "<li><span class=\"ad\">" + h4(sa) + "</span><span class=\"hx\">" + h2(v) + "</span><span class=\"lb\">" + note + "</span></li>";
      }
      el.stack.innerHTML = html || "<li class=\"empty\">Empty</li>";
    }
    function renderBps() {
      el.bpList.innerHTML = bps.length ? bps.map(function (b) {
        return '<li class="' + (b.on ? "" : "off") + '"><label class="dbg-chk"><input type="checkbox" data-bpon="' + b.id + '"' + (b.on ? " checked" : "") +
          '> <span class="bp-id">#' + b.id + "</span> " + esc(bpText(b)) + "</label>" +
          (b.hits ? '<span class="hits">' + b.hits + "×</span>" : "") +
          '<button type="button" class="bp-del" data-bpdel="' + b.id + '" aria-label="Delete breakpoint ' + b.id + '">✕</button></li>';
      }).join("") : '<li class="empty">None yet. Add one above, click a dot in the disassembly, or use <b>break</b> in the monitor.</li>';
      root.querySelectorAll("[data-opt]").forEach(function (c) { c.checked = !!opts[c.getAttribute("data-opt")]; });
    }
    function renderMem() {
      var a = view.mem, ram = view.memSrc === "ram", chars = view.charset, rom = c64.charRom;
      var glyphBase = chars === "lower" ? 0x800 : 0;
      var ink = getComputedStyle(root).getPropertyValue("--dbg-ink").trim() || "#d8d3ff";
      for (var r = 0; r < MEM_ROWS; r++) {
        var row = memRows[r], ra = (a + r * 16) & 0xFFFF;
        row.ad.textContent = h4(ra);
        var g = row.ctx, img = g.createImageData(128, 8), px = img.data;
        var rgb = [parseInt(ink.slice(1, 3), 16), parseInt(ink.slice(3, 5), 16), parseInt(ink.slice(5, 7), 16)];
        for (var c = 0; c < 16; c++) {
          var ad = (ra + c) & 0xFFFF, v = peek(ad), cell = row.cells[c];
          cell.textContent = h2(v);
          cell.setAttribute("data-a", ad);
          var was = ram ? base.ram && base.ram[ad] : base.mem[ad];
          cell.className = (stopped && base.regs && was !== v ? "chg" : "") + (ad === view.memSel ? " sel" : "");
          var sc = chars === "petscii" ? petsciiToScreen(v) : v;
          var gl = (chars === "petscii" ? 0x800 : glyphBase) + sc * 8;
          for (var y = 0; y < 8; y++) {
            var bits = rom[gl + y];
            for (var x = 0; x < 8; x++) {
              var o = ((y * 128) + c * 8 + x) * 4;
              if (bits & (0x80 >> x)) { px[o] = rgb[0]; px[o + 1] = rgb[1]; px[o + 2] = rgb[2]; px[o + 3] = 255; }
            }
          }
        }
        g.clearRect(0, 0, 128, 8);
        g.putImageData(img, 0, 0);
      }
    }
    var COLOURS = ["black", "white", "red", "cyan", "purple", "green", "blue", "yellow", "orange", "brown", "light red", "dark grey", "grey", "light green", "light blue", "light grey"];
    function swatch(c) {
      c &= 15;
      var rgb = VIC6569.PALETTE ? VIC6569.PALETTE[c] : 0;
      var css = "#" + ("00000" + (rgb >>> 0).toString(16)).slice(-6);
      return '<span class="sw" style="background:' + css + '"></span>' + c + " " + COLOURS[c];
    }
    function renderIo() {
      var v = c64.vic, R = function (r) { return c64.peek(0xD000 + r); };
      var d011 = R(0x11), d016 = R(0x16), d018 = R(0x18), bank = c64.vicBank;
      var ecm = d011 & 0x40, bmm = d011 & 0x20, mcm = d016 & 0x10;
      var mode = (ecm ? "extended colour " : "") + (bmm ? "bitmap" : "text") + (mcm ? ", multicolour" : "");
      var screen = bank + ((d018 >> 4) << 10), charAt = bank + ((d018 & 0x0E) << 10), bitmap = bank + ((d018 & 0x08) << 10);
      var sprites = "";
      var en = R(0x15);
      for (var n = 0; n < 8; n++) {
        if (!(en & (1 << n))) continue;
        var x = R(n * 2) | ((R(0x10) >> n & 1) << 8), y = R(n * 2 + 1), ptr = c64.ram[(screen + 0x3F8 + n) & 0xFFFF];
        sprites += "<tr><td>" + n + "</td><td>" + x + "</td><td>" + y + "</td><td>$" + h4(bank + ptr * 64) + "</td><td>" + swatch(R(0x27 + n)) + "</td></tr>";
      }
      var html = '<h4>VIC-II</h4><dl class="facts io">' +
        row("Raster", "line " + v.raster + ", cycle " + v.cyc + " · IRQ at line " + v.rasterIrqLine) +
        row("Mode", mode + ((d011 & 0x10) ? "" : " · screen off") + " · " + ((d011 & 8) ? "25" : "24") + " rows, " + ((d016 & 8) ? "40" : "38") + " columns") +
        row("Scroll", "X " + (d016 & 7) + ", Y " + (d011 & 7)) +
        row("Memory", "bank $" + h4(bank) + " · screen $" + h4(screen) + " · " + (bmm ? "bitmap $" + h4(bitmap) : "characters $" + h4(charAt) + (c64.vicCharRom && (charAt & 0x3000) === 0x1000 ? " (ROM)" : ""))) +
        row("IRQ", "flags $" + h2(R(0x19)) + " · mask $" + h2(R(0x1A))) +
        row("Border", swatch(R(0x20))) + row("Background", swatch(R(0x21))) +
        "</dl>" +
        (sprites ? '<table class="spr"><thead><tr><th>Sprite</th><th>X</th><th>Y</th><th>Data</th><th>Colour</th></tr></thead><tbody>' + sprites + "</tbody></table>" : '<p class="soft">No sprites on.</p>');
      [["CIA 1", c64.cia1, 0xDC00], ["CIA 2", c64.cia2, 0xDD00]].forEach(function (x) {
        var c = x[1];
        html += "<h4>" + x[0] + " ($" + h4(x[2]) + ")</h4><dl class=\"facts io\">" +
          row("Timer A", "$" + h4(c.ta) + " / latch $" + h4(c.latchA) + " · " + ((c.cra & 1) ? ((c.cra & 8) ? "one-shot" : "running") : "stopped")) +
          row("Timer B", "$" + h4(c.tb) + " / latch $" + h4(c.latchB) + " · " + ((c.crb & 1) ? ((c.crb & 8) ? "one-shot" : "running") : "stopped")) +
          row("Interrupts", "flags $" + h2(c.icr) + " · mask $" + h2(c.mask) + (c.irqOut ? " · active" : "")) +
          row("Ports", "A $" + h2(c.peek(0)) + " (DDR $" + h2(c.ddra) + ") · B $" + h2(c.peek(1)) + " (DDR $" + h2(c.ddrb) + ")") +
          "</dl>";
      });
      var s = c64.sid, sr = s.regs, voices = "";
      for (var k = 0; k < 3; k++) {
        var o = k * 7, ctl = sr[o + 4], f = sr[o] | (sr[o + 1] << 8);
        var wave = ["tri", "saw", "pulse", "noise"].filter(function (w, i) { return ctl & (0x10 << i); }).join("+") || "–";
        voices += "<tr><td>" + (k + 1) + "</td><td>$" + h4(f) + "</td><td>" + wave + (ctl & 1 ? " · gate" : "") + "</td><td>$" + h4((sr[o + 2] | (sr[o + 3] << 8)) & 0xFFF) +
          "</td><td>" + h2(sr[o + 5]) + " " + h2(sr[o + 6]) + "</td><td>" + (s.v ? s.v[k].env : "") + "</td></tr>";
      }
      html += '<h4>SID ($D400)</h4><table class="spr"><thead><tr><th>Voice</th><th>Freq</th><th>Wave</th><th>Pulse</th><th>ADSR</th><th>Env</th></tr></thead><tbody>' + voices + "</tbody></table>" +
        '<dl class="facts io">' + row("Filter", "cutoff $" + h4((sr[21] & 7) | (sr[22] << 3)) + " · resonance " + (sr[23] >> 4) + " · voices " + (sr[23] & 7 ? (sr[23] & 7).toString(2).padStart(3, "0") : "none")) +
        row("Volume", (sr[24] & 15) + " · " + (["low", "band", "high"].filter(function (w, i) { return sr[24] & (0x10 << i); }).join("+") || "no filter")) + "</dl>";
      el.io.innerHTML = html;
      function row(k, val) { return "<div><dt>" + k + "</dt><dd>" + val + "</dd></div>"; }
    }
    function renderHist() {
      var H = D.hist, html = "", prevClk = null;
      var n = Math.min(H.count, HIST_ROWS);
      for (var i = 0; i < n; i++) {
        var k = (H.pos - 1 - i + H.size) % H.size;
        var older = (k - 1 + H.size) % H.size;
        var cyc = i < H.count - 1 ? H.clk[(k + 1) % H.size] - H.clk[k] : 0;
        if (i === 0) cyc = c64.clk - H.clk[k];
        var text;
        if (H.kind[k]) text = '<span class="intr">' + (H.kind[k] === 2 ? "NMI" : "IRQ") + "</span>";
        else { var d = DA.disassemble(peekCpu, H.pc[k]); text = "<b>" + d.mnem + "</b> " + esc(d.arg); }
        html += '<div class="hl"><a href="#" class="ad" data-go="' + H.pc[k] + '">' + h4(H.pc[k]) + '</a><span class="in">' + text + '</span><span class="rg">' + h2(H.a[k]) +
          " " + h2(H.x[k]) + " " + h2(H.y[k]) + " " + h2(H.s[k]) + " " + flagStr(H.p[k]) + '</span><span class="ln">' + H.line[k] + '</span><span class="cy">' + cyc + "</span></div>";
      }
      el.hist.innerHTML = '<div class="hl hh"><span class="ad">PC</span><span class="in">Instruction</span><span class="rg">A  X  Y  SP NV-BDIZC</span><span class="ln">Line</span><span class="cy">Cycles</span></div>' +
        (html || '<p class="soft">The history fills while the debugger is open: the last ' + H.size + " instructions, newest first.</p>");
    }
    function flagStr(p) {
      var s = "NV-BDIZC", o = "";
      for (var i = 0; i < 8; i++) o += (p & (0x80 >> i)) ? s[i] : s[i].toLowerCase().replace("-", "-");
      return o;
    }

    // ------------------------------------------------------------ events
    root.addEventListener("click", function (e) {
      var t = e.target.closest("[data-dbg],[data-bp],[data-go],[data-flag],[data-bpdel],[data-tab]");
      if (!t) {
        var line = e.target.closest(".dl");
        if (line) { view.sel = +line.getAttribute("data-a"); renderDis(); }
        return;
      }
      if (t.hasAttribute("data-go")) { e.preventDefault(); view.dis = +t.getAttribute("data-go"); view.sel = view.dis; view.follow = false; $("dbg-follow").checked = false; renderDis(); return; }
      if (t.hasAttribute("data-bp")) { toggleExecBp(+t.getAttribute("data-bp")); return; }
      if (t.hasAttribute("data-bpdel")) {
        var id = +t.getAttribute("data-bpdel");
        bps = bps.filter(function (b) { return b.id !== id; }); applyBps(); renderBps(); renderDis(); return;
      }
      if (t.hasAttribute("data-flag")) {
        if (!stopped) return;
        var f = t.getAttribute("data-flag"), p = cpu();
        p[f] = p[f] ? 0 : (f === "n" ? 0x80 : f === "v" ? 0x40 : 1);
        renderCpu(); return;
      }
      if (t.hasAttribute("data-tab")) { setTab(t.getAttribute("data-tab")); return; }
      var act = t.getAttribute("data-dbg");
      if (act === "close") host.toggle(false);
      else if (act === "toggle") { if (stopped) cont(); else breakNow(); }
      else if (act === "step") step(1);
      else if (act === "over") stepOver();
      else if (act === "out") stepOut();
      else if (act === "line") runMode("line");
      else if (act === "frame") runMode("frame");
      else if (act === "cursor") runToSel();
      else if (act === "disup") scrollDis(-(DIS_ROWS - 4));
      else if (act === "disdown") scrollDis(DIS_ROWS - 4);
      else if (act === "memup" || act === "memdown") { view.mem = (view.mem + (act === "memdown" ? 256 : -256)) & 0xFFFF; renderMem(); }
    });
    root.addEventListener("change", function (e) {
      var t = e.target;
      if (t.hasAttribute("data-bpon")) {
        var id = +t.getAttribute("data-bpon");
        bps.forEach(function (b) { if (b.id === id) b.on = t.checked; });
        applyBps(); renderBps(); renderDis();
      } else if (t.hasAttribute("data-opt")) {
        opts[t.getAttribute("data-opt")] = t.checked; applyBps();
      } else if (t.id === "dbg-follow") {
        view.follow = t.checked; if (view.follow && stopped) { showPc(); renderDis(); }
      } else if (t.id === "dbg-mem-src") { view.memSrc = t.value; persist(); renderMem(); }
      else if (t.id === "dbg-mem-cs") { view.charset = t.value; persist(); renderMem(); }
    });
    // registers
    el.regs.addEventListener("change", function (e) {
      var inp = e.target, k = inp.getAttribute("data-reg");
      if (!k || !stopped) return;
      var v = DA.parseNum(inp.value);
      if (!v || v.v > (k === "pc" ? 0xFFFF : 0xFF)) { renderCpu(); return; }
      cpu()[k] = v.v;
      if (k === "pc" && view.follow) showPc();
      render();
    });
    el.regs.addEventListener("keydown", function (e) { if (e.key === "Enter") e.target.blur(); });
    // go-to fields
    $("dbg-dis-go").addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      var a = parseAddr(this.value);
      if (a < 0) return;
      view.dis = a; view.sel = a; view.follow = false; $("dbg-follow").checked = false; renderDis();
    });
    $("dbg-mem-go").addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      var a = parseAddr(this.value);
      if (a < 0) return;
      view.mem = a & 0xFFF0; view.memSel = a; persist(); renderMem();
    });
    // disassembly scrolling and keys
    el.dis.addEventListener("wheel", function (e) {
      e.preventDefault();
      scrollDis(e.deltaY > 0 ? 3 : -3);
    }, { passive: false });
    function scrollDis(n) {
      var a = view.dis;
      if (n > 0) for (var i = 0; i < n; i++) a = (a + DA.LENGTHS[peekCpu(a)]) & 0xFFFF;
      else for (var j = 0; j < -n; j++) a = DA.previous(peekCpu, a);
      view.dis = a; view.follow = false; $("dbg-follow").checked = false;
      renderDis();
    }
    el.dis.addEventListener("keydown", function (e) {
      var i = disLines.indexOf(view.sel);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (i < 0) { view.sel = disLines[0]; renderDis(); return; }
        if (e.key === "ArrowDown") { if (i >= DIS_ROWS - 2) scrollDis(1); view.sel = disLines[Math.min(DIS_ROWS - 1, disLines.indexOf(view.sel) + 1)]; }
        else { if (i <= 1) scrollDis(-1); view.sel = disLines[Math.max(0, disLines.indexOf(view.sel) - 1)]; }
        renderDis();
      } else if (e.key === "PageDown") { e.preventDefault(); scrollDis(DIS_ROWS - 2); }
      else if (e.key === "PageUp") { e.preventDefault(); scrollDis(-(DIS_ROWS - 2)); }
      else if ((e.key === "b" || e.key === "B") && view.sel >= 0) { e.preventDefault(); toggleExecBp(view.sel); }
    });
    el.dis.addEventListener("dblclick", function (e) {
      var line = e.target.closest(".dl");
      if (line && !e.target.closest("a,button")) toggleExecBp(+line.getAttribute("data-a"));
    });
    // memory: select and edit bytes
    el.mem.addEventListener("click", function (e) {
      var cell = e.target.closest("i[data-a]");
      if (!cell) return;
      view.memSel = +cell.getAttribute("data-a"); view.nib = -1;
      el.mem.focus(); renderMem();
    });
    el.mem.addEventListener("wheel", function (e) {
      e.preventDefault();
      view.mem = (view.mem + (e.deltaY > 0 ? 48 : -48)) & 0xFFFF; renderMem();
    }, { passive: false });
    el.mem.addEventListener("keydown", function (e) {
      var s = view.memSel, k = e.key;
      var moves = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 16, ArrowUp: -16 };
      if (k === "PageDown" || k === "PageUp") { e.preventDefault(); view.mem = (view.mem + (k === "PageDown" ? 256 : -256)) & 0xFFFF; renderMem(); return; }
      if (s < 0) return;
      if (moves[k]) {
        e.preventDefault();
        selectMem((s + moves[k]) & 0xFFFF);
        return;
      }
      if (/^[0-9a-f]$/i.test(k)) {
        e.preventDefault();
        var d = parseInt(k, 16), cur = peek(s);
        if (view.nib < 0) { poke(s, (d << 4) | (cur & 0x0F)); view.nib = d; renderMem(); }
        else { poke(s, (view.nib << 4) | d); view.nib = -1; selectMem((s + 1) & 0xFFFF); }
        if (stopped) renderDis();
      }
    });
    function selectMem(a) {
      view.memSel = a; view.nib = -1;
      if (((a - view.mem) & 0xFFFF) >= MEM_ROWS * 16) view.mem = ((a & 0xFFF0) - (a < view.mem ? 0 : (MEM_ROWS - 1) * 16)) & 0xFFFF;
      renderMem();
    }
    // breakpoints form
    $("dbg-bp-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var type = $("dbg-bp-type").value, txt = $("dbg-bp-addr").value, r;
      if (type === "raster") {
        r = parseRange(txt.replace(/\b(\d+)\b/g, "+$1"));
        if (r && r.hi > 311) r = null;
      } else r = parseRange(txt);
      if (!r) {
        el.bpErr.textContent = type === "raster" ? "Enter a raster line from 0 to 311 (or a range like 50-60)." : "Enter an address in hex, like C000, or a range like D020-D02E.";
        el.bpErr.hidden = false; return;
      }
      el.bpErr.hidden = true;
      addBp(type, r.lo, r.hi);
      $("dbg-bp-addr").value = "";
      renderDis();
    });
    $("dbg-bp-type").addEventListener("change", function () {
      $("dbg-bp-addr").placeholder = this.value === "raster" ? "Line, e.g. 100" : "C000 or D020-D02E";
    });
    function setTab(t) {
      view.tab = t; persist();
      root.querySelectorAll("[data-tab]").forEach(function (b) { b.setAttribute("aria-selected", b.getAttribute("data-tab") === t ? "true" : "false"); });
      el.io.hidden = t !== "io"; el.hist.hidden = t !== "hist";
      if (t === "io") renderIo(); else renderHist();
    }

    // ------------------------------------------------------------ monitor console
    function conPrint(text, cls) {
      var line = document.createElement("div");
      if (cls) line.className = cls;
      line.textContent = text;
      el.out.appendChild(line);
      while (el.out.childNodes.length > 600) el.out.removeChild(el.out.firstChild);
      el.out.scrollTop = el.out.scrollHeight;
    }
    function setPrompt() { el.prompt.textContent = con.asmAt >= 0 ? "A " + h4(con.asmAt) : ">"; }
    $("dbg-con-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var line = el.input.value;
      el.input.value = "";
      if (line.trim()) { con.history.push(line); if (con.history.length > 100) con.history.shift(); }
      con.hpos = con.history.length;
      run(line);
    });
    el.input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowUp" && con.hpos > 0) { e.preventDefault(); el.input.value = con.history[--con.hpos]; }
      else if (e.key === "ArrowDown") { e.preventDefault(); con.hpos = Math.min(con.history.length, con.hpos + 1); el.input.value = con.history[con.hpos] || ""; }
      else if (e.key === "Escape" && con.asmAt >= 0) { con.asmAt = -1; setPrompt(); }
    });

    var HELP = [
      "Numbers are hex ($ optional); +12 is decimal, %1010 binary.",
      "r [A=01 X=02 Y=03 SP=F0 PC=C000]   show or change registers",
      "m [from [to]]          memory as hex and screen codes",
      "i [from [to]]          memory as PETSCII text",
      "d [from [to]]          disassemble",
      "a addr [instruction]   assemble (without an instruction: line by line, empty line ends)",
      "> addr bytes…          write bytes",
      "f from to bytes…       fill memory",
      "h from to bytes|\"text\" hunt (search) memory",
      "c from to dest         compare memory",
      "t from to dest         copy memory",
      "g [addr]               go on (from addr)        x  go on",
      "z [n]                  step n instructions",
      "n [n]                  step over JSR calls      ret  step out",
      "break [addr[-to]]      list or add execute breakpoints",
      "watch [load|store] addr[-to]   stop on reads and/or writes",
      "raster line            stop when the beam reaches this line (decimal)",
      "del [n] · enable n · disable n   delete (all) / switch breakpoints",
      "bank cpu|ram           memory as the CPU sees it or plain RAM",
      "io                     VIC, CIA and SID summary",
      "history [n]            the last n instructions",
      "save \"name\" from to    download memory as a PRG file",
      "reset · cls            reset the C64 · clear this window"
    ];
    function args(rest) {
      var out = [], re = /"([^"]*)"|(\S+)/g, m;
      while ((m = re.exec(rest))) out.push(m[1] !== undefined ? { str: m[1] } : m[2]);
      return out;
    }
    function num(s, def) {
      if (s === undefined) return def;
      if (typeof s === "object") return NaN;
      var n = DA.parseNum(s);
      return n ? n.v : NaN;
    }
    function bad(msg) { conPrint(msg, "err"); }
    function needStop() { if (!stopped) { bad("Stop the C64 first (Break or the command z)."); return false; } return true; }

    function run(line) {
      var raw = line.trim();
      if (con.asmAt >= 0) {
        if (!raw) { con.asmAt = -1; setPrompt(); return; }
        conPrint("A " + h4(con.asmAt) + "  " + raw, "cmd");
        var r = DA.assemble(con.asmAt, raw);
        if (r.error) { bad(r.error); return; }
        r.bytes.forEach(function (b, i) { poke(con.asmAt + i, b, "cpu"); });
        con.asmAt = (con.asmAt + r.bytes.length) & 0xFFFF;
        setPrompt(); render(); return;
      }
      if (!raw) {
        if (/^(z|n|m|d|i)\b/i.test(con.lastCmd)) raw = con.lastCmd.split(/\s+/)[0];
        else return;
      }
      conPrint("> " + raw, "cmd");
      con.lastCmd = raw;
      var m = /^(\S+)\s*(.*)$/.exec(raw), cmd = m[1].toLowerCase(), rest = m[2], a = args(rest);
      // ">c000 01 02" without a space
      if (cmd[0] === ">" && cmd.length > 1) { a.unshift(cmd.slice(1)); cmd = ">"; }
      try { command(cmd, a, rest); } catch (err) { bad(String(err.message || err)); }
    }

    function command(cmd, a, rest) {
      var p = cpu(), from, to, i, j, v;
      switch (cmd) {
        case "help": case "?":
          HELP.forEach(function (l) { conPrint(l); }); return;
        case "cls": el.out.innerHTML = ""; return;
        case "r": {
          if (a.length) {
            if (!needStop()) return;
            for (i = 0; i < a.length; i++) {
              var kv = /^(a|x|y|sp|pc)=(.+)$/i.exec(a[i]);
              if (!kv) return bad("Write registers like A=01 or PC=C000.");
              v = num(kv[2]);
              var key = kv[1].toLowerCase() === "sp" ? "s" : kv[1].toLowerCase();
              if (isNaN(v) || v > (key === "pc" ? 0xFFFF : 0xFF)) return bad("Value out of range: " + kv[2]);
              p[key] = v;
            }
            if (view.follow) showPc();
            render();
          }
          conPrint("PC   A  X  Y  SP NV-BDIZC  line cycle");
          conPrint(h4(p.pc) + " " + h2(p.a) + " " + h2(p.x) + " " + h2(p.y) + " " + h2(p.s) + " " + flagStr(p.getP(false)) + "  " +
            String(c64.vic.raster).padStart(4) + " " + String(c64.vic.cyc).padStart(5));
          return;
        }
        case "m": case "i": {
          from = num(a[0], con.nextM >= 0 ? con.nextM : view.mem); to = num(a[1], (from + (cmd === "m" ? 0x7F : 0xFF)) & 0xFFFF);
          if (isNaN(from) || isNaN(to)) return bad("Usage: " + cmd + " [from [to]]");
          var per = cmd === "m" ? 16 : 32;
          for (var at = from, guard = 0; guard < 256; guard++) {
            var hexs = "", txt = "";
            for (j = 0; j < per; j++) {
              var ad = (at + j) & 0xFFFF; v = peek(ad);
              if (cmd === "m") { hexs += h2(v) + (j === 7 ? "  " : " "); txt += screenToText(v); }
              else txt += screenToText(petsciiToScreen(v));
            }
            conPrint(">" + h4(at) + "  " + (cmd === "m" ? hexs + " " : "") + txt);
            at = (at + per) & 0xFFFF;
            if (((to - from) & 0xFFFF) < ((at - from) & 0xFFFF) || at === from) break;
          }
          con.nextM = at;
          if (a[0] !== undefined) { view.mem = from & 0xFFF0; renderMem(); }
          return;
        }
        case "d": {
          from = num(a[0], con.nextD >= 0 ? con.nextD : p.pc);
          if (isNaN(from)) return bad("Usage: d [from [to]]");
          to = a[1] !== undefined ? num(a[1]) : -1;
          var addr = from;
          for (i = 0; i < (to >= 0 ? 4096 : 20); i++) {
            var d = DA.disassemble(peekCpu, addr);
            conPrint((addr === p.pc ? "*" : " ") + h4(addr) + "  " + d.bytes.map(h2).join(" ").padEnd(9) + " " +
              (d.doc ? " " : "*") + d.text.padEnd(14) + (d.label ? "; " + d.label : ""));
            var nextA = (addr + d.len) & 0xFFFF;
            if (to >= 0 && ((to - from) & 0xFFFF) < ((nextA - from) & 0xFFFF)) { addr = nextA; break; }
            addr = nextA;
          }
          con.nextD = addr;
          return;
        }
        case "a": {
          from = num(a[0]);
          if (isNaN(from)) return bad("Usage: a addr [instruction]");
          var instr = rest.replace(/^\S+\s*/, "");
          if (!instr) { con.asmAt = from; setPrompt(); conPrint("Assembling at $" + h4(from) + ". An empty line ends.", "note"); return; }
          var r = DA.assemble(from, instr);
          if (r.error) return bad(r.error);
          r.bytes.forEach(function (b, k) { poke(from + k, b, "cpu"); });
          conPrint(h4(from) + "  " + r.bytes.map(h2).join(" "));
          con.asmAt = (from + r.bytes.length) & 0xFFFF; setPrompt();
          render(); return;
        }
        case ">": {
          from = num(a[0]);
          if (isNaN(from) || a.length < 2) return bad("Usage: > addr bytes…");
          var bytes = byteList(a.slice(1));
          if (!bytes) return;
          bytes.forEach(function (b, k) { poke(from + k, b); });
          render(); return;
        }
        case "f": {
          from = num(a[0]); to = num(a[1]);
          if (isNaN(from) || isNaN(to) || a.length < 3) return bad("Usage: f from to bytes…");
          var fill = byteList(a.slice(2));
          if (!fill) return;
          for (i = 0; i <= ((to - from) & 0xFFFF); i++) poke(from + i, fill[i % fill.length]);
          conPrint("Filled $" + h4(from) + "–$" + h4(to) + ".");
          render(); return;
        }
        case "h": {
          from = num(a[0]); to = num(a[1]);
          if (isNaN(from) || isNaN(to) || a.length < 3) return bad("Usage: h from to bytes or \"text\"");
          var pat = byteList(a.slice(2));
          if (!pat) return;
          var found = [];
          for (i = 0; i <= ((to - from) & 0xFFFF) && found.length < 64; i++) {
            for (j = 0; j < pat.length && peek(from + i + j) === pat[j]; j++);
            if (j === pat.length) found.push(h4(from + i));
          }
          conPrint(found.length ? found.join(" ") + (found.length === 64 ? " …" : "") : "Not found.");
          return;
        }
        case "c": {
          from = num(a[0]); to = num(a[1]); var dest = num(a[2]);
          if ([from, to, dest].some(isNaN)) return bad("Usage: c from to dest");
          var diff = [];
          for (i = 0; i <= ((to - from) & 0xFFFF) && diff.length < 64; i++) if (peek(from + i) !== peek(dest + i)) diff.push(h4(from + i));
          conPrint(diff.length ? "Different: " + diff.join(" ") + (diff.length === 64 ? " …" : "") : "The same.");
          return;
        }
        case "t": {
          from = num(a[0]); to = num(a[1]); var tgt = num(a[2]);
          if ([from, to, tgt].some(isNaN)) return bad("Usage: t from to dest");
          var len = ((to - from) & 0xFFFF) + 1, copy = [];
          for (i = 0; i < len; i++) copy.push(peek(from + i));
          copy.forEach(function (b, k) { poke(tgt + k, b); });
          conPrint("Copied " + len + " bytes to $" + h4(tgt) + ".");
          render(); return;
        }
        case "g": case "x": {
          if (!stopped) return conPrint("The C64 is running.");
          if (a[0] !== undefined && cmd === "g") { v = num(a[0]); if (isNaN(v)) return bad("Usage: g [addr]"); p.pc = v; }
          cont(); return;
        }
        case "z": case "step": {
          var nz = num(a[0], 1);
          if (isNaN(nz) || nz < 1) return bad("Usage: z [count]");
          if (!stopped) { breakNow(); conPrint("Stopping…", "note"); return; }
          step(Math.min(nz, 100000));
          echoPc(); return;
        }
        case "n": case "next": {
          if (!needStop()) return;
          var nn = num(a[0], 1);
          for (i = 0; i < nn && stopped; i++) stepOver();
          if (stopped) echoPc(); return;
        }
        case "ret": if (!needStop()) return; stepOut(); if (stopped) echoPc(); return;
        case "break": case "bk": {
          if (!a.length) return listBps();
          var r1 = parseRange(rest);
          if (!r1) return bad("Usage: break addr or break from-to");
          var b1 = addBp("exec", r1.lo, r1.hi); renderDis();
          conPrint("Breakpoint #" + b1.id + ": " + bpText(b1)); return;
        }
        case "watch": case "w": {
          var kind = "access", list = a.slice();
          if (/^(load|store|read|write)$/i.test(list[0])) { kind = /load|read/i.test(list.shift()) ? "load" : "store"; }
          var r2 = parseRange(list.join(" "));
          if (!r2) return bad("Usage: watch [load|store] addr or range");
          var b2 = addBp(kind, r2.lo, r2.hi);
          conPrint("Watchpoint #" + b2.id + ": " + bpText(b2)); return;
        }
        case "raster": {
          var r3 = parseRange(rest.replace(/\b(\d+)\b/g, "+$1"));
          if (!r3 || r3.hi > 311) return bad("Usage: raster line (0–311, decimal)");
          var b3 = addBp("raster", r3.lo, r3.hi);
          conPrint("Breakpoint #" + b3.id + ": " + bpText(b3)); return;
        }
        case "del": case "delete": {
          if (!a.length) { bps = []; conPrint("All breakpoints deleted."); }
          else { var id = num("+" + a[0]); bps = bps.filter(function (b) { return b.id !== id; }); conPrint("Deleted #" + id + "."); }
          applyBps(); renderBps(); renderDis(); return;
        }
        case "enable": case "disable": {
          var eid = num("+" + (a[0] || "x"));
          var hit = bps.filter(function (b) { return b.id === eid; })[0];
          if (!hit) return bad("No breakpoint #" + a[0] + ".");
          hit.on = cmd === "enable"; applyBps(); renderBps(); renderDis();
          conPrint((hit.on ? "Enabled" : "Disabled") + " #" + eid + "."); return;
        }
        case "bank": {
          if (!/^(cpu|ram)$/i.test(a[0] || "")) return conPrint("Memory view: " + (view.memSrc === "ram" ? "RAM only" : "as the CPU sees it") + ". Use bank cpu or bank ram.");
          view.memSrc = a[0].toLowerCase(); $("dbg-mem-src").value = view.memSrc; persist(); renderMem();
          conPrint("Memory view: " + (view.memSrc === "ram" ? "RAM only." : "as the CPU sees it.")); return;
        }
        case "io": {
          var t = document.createElement("div"); renderIo(); t.innerHTML = el.io.innerHTML;
          t.querySelectorAll("h4").forEach(function (hh) { hh.textContent = "— " + hh.textContent + " —"; });
          t.querySelectorAll("div, tr, h4").forEach(function (n) { n.appendChild(document.createTextNode("\n")); });
          t.querySelectorAll("dt, td, th").forEach(function (n) { n.appendChild(document.createTextNode("  ")); });
          t.textContent.split("\n").forEach(function (l) { if (l.trim()) conPrint(l.replace(/\s+$/, "")); });
          setTab("io"); return;
        }
        case "history": case "hist": {
          var nh = Math.min(num("+" + (a[0] || "20")), D.hist.count), H = D.hist;
          for (i = nh - 1; i >= 0; i--) {
            var k2 = (H.pos - 1 - i + H.size) % H.size;
            var dt = H.kind[k2] ? "-- " + (H.kind[k2] === 2 ? "NMI" : "IRQ") + " --" : DA.disassemble(peekCpu, H.pc[k2]).text;
            conPrint(h4(H.pc[k2]) + "  " + dt.padEnd(14) + " A:" + h2(H.a[k2]) + " X:" + h2(H.x[k2]) + " Y:" + h2(H.y[k2]) + " SP:" + h2(H.s[k2]) + " line " + H.line[k2]);
          }
          if (!nh) conPrint("No history yet.");
          return;
        }
        case "save": case "s": {
          if (!a[0] || typeof a[0] !== "object") return bad('Usage: save "name" from to');
          from = num(a[1]); to = num(a[2]);
          if (isNaN(from) || isNaN(to) || to < from) return bad('Usage: save "name" from to');
          var out = new Uint8Array(to - from + 3);
          out[0] = from & 0xFF; out[1] = from >> 8;
          for (i = from; i <= to; i++) out[i - from + 2] = peek(i);
          host.download((a[0].str || "memory") + ".prg", out);
          conPrint("Saved $" + h4(from) + "–$" + h4(to) + " (" + (to - from + 1) + " bytes)."); return;
        }
        case "reset": host.reset(); conPrint("The C64 was reset."); return;
        default:
          bad("Unknown command " + cmd + ". Type help for the list.");
      }
    }
    function byteList(list) {
      var out = [];
      for (var i = 0; i < list.length; i++) {
        if (typeof list[i] === "object") { for (var k = 0; k < list[i].str.length; k++) out.push(list[i].str.toUpperCase().charCodeAt(k) & 0xFF); continue; }
        var n = DA.parseNum(list[i]);
        if (!n || n.v > 0xFF) { bad("Not a byte: " + list[i]); return null; }
        out.push(n.v);
      }
      return out;
    }
    function listBps() {
      if (!bps.length) return conPrint("No breakpoints.");
      bps.forEach(function (b) { conPrint("#" + b.id + "  " + bpText(b) + (b.on ? "" : "  (off)") + (b.hits ? "  " + b.hits + " hits" : "")); });
    }
    function echoPc() {
      var p = cpu(), d = DA.disassemble(peekCpu, p.pc);
      conPrint("." + h4(p.pc) + "  " + d.text.padEnd(14) + " A:" + h2(p.a) + " X:" + h2(p.x) + " Y:" + h2(p.y) + " SP:" + h2(p.s) + " " + flagStr(p.getP(false)) + " line " + c64.vic.raster);
    }

    // ------------------------------------------------------------ screen overlay: where the beam is
    function overlay(ctx, crop) {
      if (!open || !stopped || !c64) return;
      var v = c64.vic, y = v.raster - 16 - crop.y;
      var sx = (0x194 + (v.cyc - 1) * 8) % 504, x = sx + 8 - crop.x;
      if (y < 0 || y >= crop.h) return;
      ctx.fillStyle = "rgba(255, 92, 80, 0.55)";
      ctx.fillRect(0, y, crop.w, 1);
      if (x >= 0 && x < crop.w) { ctx.fillStyle = "#fff"; ctx.fillRect(x, Math.max(0, y - 3), 2, 7); }
    }

    // ------------------------------------------------------------ open / close
    function setOpen(on) {
      open = on;
      root.hidden = !on;
      document.querySelector(".app").classList.toggle("debugging", on);
      if (!c64) return;
      if (on) {
        c64.dbg = D; D.mode = "run"; D.skip = -1; D.lastLine = c64.vic.raster;
        applyBps();
        takeBase();
        stopped = false;
        setTab(view.tab);
        $("dbg-mem-src").value = view.memSrc; $("dbg-mem-cs").value = view.charset;
        render();
        if (!el.out.childNodes.length) conPrint("Monitor ready. Type help for the commands.", "note");
      } else {
        c64.setWatching(false);
        c64.dbg = null;
        if (stopped) { stopped = false; host.resume(); }
      }
    }
    var liveTimer = setInterval(renderLive, 200);

    return {
      attach: attach,
      setOpen: setOpen,
      isOpen: function () { return open; },
      isStopped: function () { return stopped; },
      onStop: onStop,
      breakNow: breakNow,
      cont: cont,
      overlay: overlay,
      refresh: function () { if (open) { if (stopped && view.follow) showPc(); render(); } },
      afterReset: function () { stopped = false; D.mode = "run"; D.skip = -1; if (open) { takeBase(); render(); } }
    };
  };
})();
