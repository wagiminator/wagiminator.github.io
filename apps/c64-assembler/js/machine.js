/* C64 Assembler: the C64 that runs the programs (the core of the C64 Emulator app) with
 * screen, sound, keyboard and the debugger hooks for breakpoints and single steps. */
(function (global) {
  "use strict";

  var C64 = global.C64, FRAME_HZ = 50.125;
  var CHARS = {
    "!": ["1", 1], '"': ["2", 1], "#": ["3", 1], "$": ["4", 1], "%": ["5", 1], "&": ["6", 1], "'": ["7", 1],
    "(": ["8", 1], ")": ["9", 1], "+": ["PLUS", 0], "-": ["MINUS", 0], "*": ["ASTERISK", 0], "/": ["SLASH", 0],
    "=": ["EQUALS", 0], ":": ["COLON", 0], ";": ["SEMICOLON", 0], ",": ["COMMA", 0], ".": ["PERIOD", 0],
    "@": ["AT", 0], "£": ["POUND", 0], "^": ["UP_ARROW", 0], "[": ["COLON", 1], "]": ["SEMICOLON", 1],
    "<": ["COMMA", 1], ">": ["PERIOD", 1], "?": ["SLASH", 1], " ": ["SPACE", null], "`": ["LEFT_ARROW", 0],
    "_": ["LEFT_ARROW", 0], "\\": ["POUND", 0], "|": ["MINUS", 1]
  };
  var CODES = {
    Enter: ["RETURN", null], NumpadEnter: ["RETURN", null], Backspace: ["DEL", null], Delete: ["DEL", 0], Insert: ["DEL", 1],
    Home: ["HOME", null], ArrowRight: ["CRSR_RIGHT", 0], ArrowLeft: ["CRSR_RIGHT", 1], ArrowDown: ["CRSR_DOWN", 0],
    ArrowUp: ["CRSR_DOWN", 1], Escape: ["RUN_STOP", null], Tab: ["CTRL", null], ControlLeft: ["CTRL", null],
    AltLeft: ["CBM", null], ShiftLeft: ["LSHIFT", null], ShiftRight: ["RSHIFT", null],
    F1: ["F1", 0], F2: ["F1", 1], F3: ["F3", 0], F4: ["F3", 1], F5: ["F5", 0], F6: ["F5", 1], F7: ["F7", 0], F8: ["F7", 1]
  };
  var MODIFIERS = { LSHIFT: 1, RSHIFT: 1, CTRL: 1, CBM: 1 };
  var WORKLET = "class C64Out extends AudioWorkletProcessor{constructor(){super();this.q=[];this.cur=null;this.pos=0;this.n=0;this.t=0;" +
    "this.port.onmessage=e=>{if(e.data==='clear'){this.q=[];this.cur=null;this.n=0;return;}this.q.push(e.data);this.n+=e.data.length;};}" +
    "process(i,o){const out=o[0][0];for(let k=0;k<out.length;k++){if(!this.cur||this.pos>=this.cur.length){this.cur=this.q.shift()||null;this.pos=0;" +
    "if(!this.cur){out.fill(0,k);break;}}out[k]=this.cur[this.pos++];this.n--;}if(this.n<0)this.n=0;for(let c=1;c<o[0].length;c++)o[0][c].set(out);" +
    "if(++this.t>=4){this.t=0;this.port.postMessage(this.n);}return true;}}registerProcessor('c64-out',C64Out);";

  var M = {
    c64: null, boot: null, running: false, stopped: null, D: null, breaks: {}, canvas: null, ctx: null, image: null,
    sound: true, joyPort: 2, onStop: function () {}, onState: function () {}
  };

  M.init = function (canvas) {
    M.canvas = canvas;
    M.ctx = canvas.getContext("2d", { alpha: false });
    M.c64 = new C64(global.C64_OPEN_ROMS);
    // boot once to the READY prompt and keep that state: every run starts from it
    for (var i = 0; i < 180; i++) M.c64.runFrame();
    M.c64.sid.takeSamples();
    M.boot = M.c64.saveState();
    M.image = M.ctx.createImageData(global.VIC6569.W, global.VIC6569.H);
    M.D = C64.newDebugState();
    M.D.stopJam = true;
    canvas.width = 384 - 32; canvas.height = 272 - 40;
    M.draw();
    requestAnimationFrame(loop);
  };

  // ---------------------------------------------------------------- running a program
  // how: { mode: "run" | "sys", addr }
  M.run = function (prg, how) {
    var c = M.c64;
    c.loadState(M.boot);
    c.releaseAllKeys(); keyState = {}; keyQueue = [];
    c.typeQueue = [];
    var r = c.injectPrg(prg);
    c.type(how.mode === "run" ? "RUN\r" : "SYS" + how.addr + "\r");
    M.stopped = null;
    M.running = true;
    M.applyBreaks();
    M.D.mode = "run"; M.D.skip = -1; M.D.reason = null;
    clearAudio();
    // type the command at once
    for (var i = 0; i < 120 && c.typeQueue.length; i++) frame(true);
    initAudio();
    M.onState();
    return r;
  };
  M.reset = function () {
    M.c64.loadState(M.boot);
    M.c64.releaseAllKeys(); keyState = {}; keyQueue = []; M.c64.typeQueue = [];
    M.stopped = null; M.running = true;
    M.applyBreaks();
    clearAudio();
    M.onState();
  };
  M.setBreaks = function (addrs) {
    M.breaks = {};
    addrs.forEach(function (a) { M.breaks[a] = 1; });
    M.applyBreaks();
  };
  M.applyBreaks = function () {
    var D = M.D;
    D.exec.fill(0);
    var any = false;
    Object.keys(M.breaks).forEach(function (a) { D.exec[+a] = 1; any = true; });
    // the slower loop only while it is needed
    M.c64.dbg = any || M.stopped ? D : null;
  };
  M.pause = function () {
    if (!M.running || M.stopped) return;
    M.c64.dbg = M.D; M.D.mode = "step"; M.D.skip = -1;
  };
  M.cont = function (mode, extra) {
    if (!M.stopped) return;
    var c = M.c64, D = M.D;
    D.reason = null; D.skip = c.cpu.pc; D.mode = mode || "run"; D.lastLine = c.vic.raster;
    if (extra) Object.assign(D, extra);
    M.stopped = null;
    M.c64.dbg = D;
    if (mode === "step") { frame(false); M.draw(); return; }
    M.running = true;
    M.onState();
  };
  M.step = function () { M.cont("step"); };
  M.stepOver = function () {
    var c = M.c64, pc = c.cpu.pc;
    if (c.peek(pc) === 0x20) M.cont("over", { tempAt: (pc + 3) & 0xFFFF, tempS: c.cpu.s });
    else M.cont("step");
  };
  M.stepOut = function () { M.cont("out", { outS: M.c64.cpu.s }); };
  M.regs = function () {
    var cpu = M.c64.cpu;
    return { pc: cpu.pc, a: cpu.a, x: cpu.x, y: cpu.y, s: cpu.s, p: cpu.getP(false), line: M.c64.vic.raster, clk: M.c64.clk };
  };
  M.peek = function (a) { return M.c64.peek(a & 0xFFFF); };
  M.poke = function (a, v) { M.c64.ram[a & 0xFFFF] = v & 0xFF; };

  // ---------------------------------------------------------------- the frame loop
  function frame(fast) {
    processKeyQueue();
    joystick();
    var ok = M.c64.runFrame();
    if (ok === false) {
      M.stopped = M.D.reason || { kind: "step", addr: M.c64.cpu.pc };
      M.running = false;
      M.onStop(M.stopped);
      M.onState();
    }
    var s = M.c64.sid.takeSamples();
    if (!fast) feedAudio(s);
  }
  var last = 0, acc = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    var dt = Math.min(now - (last || now), 100);
    last = now;
    if (!M.running || M.stopped || document.hidden) { acc = 0; return; }
    acc += dt * FRAME_HZ / 1000;
    var n = 0;
    while (acc >= 1 && n < 4 && M.running && !M.stopped) { frame(false); acc -= 1; n++; }
    if (acc > 2) acc = 0;
    if (n) M.draw();
  }
  M.draw = function () {
    if (!M.c64) return;
    M.image.data.set(new Uint8ClampedArray(M.c64.vic.fb.buffer));
    M.ctx.putImageData(M.image, -16, -20);
  };

  // ---------------------------------------------------------------- sound
  var audio = { ctx: null, node: null, ready: false, reported: 0, sent: 0, target: 0, rate: 44100, sp: null, q: [] };
  function initAudio() {
    if (audio.ctx || !M.sound) { if (audio.ctx && audio.ctx.state === "suspended" && M.sound) audio.ctx.resume(); return; }
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return;
    var actx = new AC({ latencyHint: "interactive" });
    audio.ctx = actx; audio.rate = actx.sampleRate; audio.target = Math.round(audio.rate * 0.08);
    M.c64.sid.setSampleRate(audio.rate);
    var gain = actx.createGain(); gain.gain.value = 0.8; gain.connect(actx.destination);
    function fallback() {
      var sp = actx.createScriptProcessor(1024, 0, 2);
      sp.onaudioprocess = function (ev) {
        var l = ev.outputBuffer.getChannelData(0), r = ev.outputBuffer.getChannelData(1), k = 0;
        while (k < l.length && audio.q.length) {
          var c = audio.q[0], n = Math.min(c.data.length - c.pos, l.length - k);
          l.set(c.data.subarray(c.pos, c.pos + n), k); c.pos += n; k += n;
          if (c.pos >= c.data.length) audio.q.shift();
        }
        if (k < l.length) l.fill(0, k);
        r.set(l);
        audio.reported = audio.q.reduce(function (s, c) { return s + c.data.length - c.pos; }, 0); audio.sent = 0;
      };
      sp.connect(gain); audio.sp = sp; audio.ready = true;
    }
    if (!actx.audioWorklet) { fallback(); return; }
    var url = URL.createObjectURL(new Blob([WORKLET], { type: "application/javascript" }));
    actx.audioWorklet.addModule(url).then(function () {
      audio.node = new AudioWorkletNode(actx, "c64-out", { outputChannelCount: [2] });
      audio.node.port.onmessage = function (e) { audio.reported = e.data; audio.sent = 0; };
      audio.node.connect(gain);
      audio.ready = true;
    }, fallback);
  }
  function clearAudio() {
    if (audio.node) audio.node.port.postMessage("clear");
    audio.q = []; audio.reported = 0; audio.sent = 0;
  }
  function feedAudio(s) {
    if (!audio.ready || !M.sound || audio.ctx.state !== "running" || !s.length) return;
    var fill = audio.reported + audio.sent;
    if (fill > audio.target * 3) return;
    if (fill < audio.target * 0.25) push(new Float32Array(audio.target - fill));
    push(s);
    var err = Math.max(-1, Math.min(1, (fill - audio.target) / audio.target));
    M.c64.sid.cps = (C64.CLOCK / audio.rate) * (1 + 0.01 * err);
  }
  function push(s) {
    if (audio.node) audio.node.port.postMessage(s, [s.buffer]); else audio.q.push({ data: s, pos: 0 });
    audio.sent += s.length;
  }
  M.setSound = function (on) {
    M.sound = on;
    if (on) initAudio();
    else if (audio.ctx) { clearAudio(); }
  };
  M.gesture = function () { if (M.sound) initAudio(); };

  // ---------------------------------------------------------------- keyboard and joystick
  var keyState = {}, keyQueue = [], keyWait = 0, joyBits = 0;
  var JOY = { Numpad8: 1, Numpad2: 2, Numpad4: 4, Numpad6: 8, Numpad7: 5, Numpad9: 9, Numpad1: 6, Numpad3: 10, Numpad0: 16, Numpad5: 16 };
  function applyKeys() {
    var c = M.c64;
    c.releaseAllKeys();
    var force = false, off = false;
    for (var code in keyState) {
      var k = keyState[code];
      if (k[0] === "LSHIFT" || k[0] === "RSHIFT") continue;
      c.key(k[0], true);
      if (k[1] === 1) force = true;
      if (k[1] === 0) off = true;
    }
    var lshift = keyState.ShiftLeft && !off, rshift = keyState.ShiftRight && !off;
    if (force) lshift = true;
    if (lshift) c.key("LSHIFT", true);
    if (rshift) c.key("RSHIFT", true);
  }
  function processKeyQueue() {
    if (keyWait > 0) { keyWait--; return; }
    while (keyQueue.length) {
      var ev = keyQueue.shift();
      if (ev.down) keyState[ev.code] = ev.map; else delete keyState[ev.code];
      applyKeys();
      if (ev.down && !MODIFIERS[ev.map[0]]) { keyWait = 2; return; }
      if (!ev.down) { keyWait = 1; return; }
    }
  }
  function joystick() {
    var bits = joyBits;
    M.c64.joy[0] = M.joyPort === 1 ? bits : 0;
    M.c64.joy[1] = M.joyPort === 2 ? bits : 0;
  }
  // keys while the screen has the focus
  M.keydown = function (e) {
    M.gesture();
    if (JOY[e.code] !== undefined) { joyBits |= JOY[e.code]; e.preventDefault(); return; }
    if (e.code === "PageUp") { M.c64.restoreKey(true); e.preventDefault(); return; }
    if (e.repeat) { e.preventDefault(); return; }
    var map = CODES[e.code];
    if (!map && e.key && e.key.length === 1) {
      var ch = e.key;
      if (/^[a-z]$/i.test(ch)) map = [ch.toUpperCase(), null];
      else if (/^[0-9]$/.test(ch)) map = [ch, null];
      else map = CHARS[ch];
    }
    if (map) { keyQueue.push({ down: true, code: e.code, map: map }); e.preventDefault(); }
  };
  M.keyup = function (e) {
    if (e.code === "PageUp") { M.c64.restoreKey(false); return; }
    if (JOY[e.code] !== undefined) { joyBits &= ~JOY[e.code]; return; }
    if (keyState[e.code] || keyQueue.some(function (q) { return q.code === e.code; })) { keyQueue.push({ down: false, code: e.code }); e.preventDefault(); }
  };
  M.blur = function () { keyState = {}; keyQueue = []; joyBits = 0; if (M.c64) applyKeys(); };

  global.Machine = M;
})(window);
