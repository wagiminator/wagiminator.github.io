/* C64 Emulator: user interface (screen, sound, input, media, settings). */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var Media = window.C64Media;
  var FRAME_HZ = C64.CLOCK / C64.CYCLES_PER_FRAME;          // 50.125 Hz
  var PIXEL_ASPECT = 0.936;                                  // PAL pixels are a little narrower than tall

  // ------------------------------------------------------------------ settings
  var DEFAULTS = { port: 2, keyjoy: "numpad", sid: 6581, border: "full", smooth: false, awake: true,
                   truedrive: true, autostart: true, sound: true };
  var settings = Object.assign({}, DEFAULTS);
  try { Object.assign(settings, JSON.parse(localStorage.getItem("c64emu.settings") || "{}")); } catch (e) { /* private mode */ }
  function saveSettings() { try { localStorage.setItem("c64emu.settings", JSON.stringify(settings)); } catch (e) { /* ignore */ } }

  // ------------------------------------------------------------------ small key/value store (IndexedDB)
  var store = {
    db: null,
    open: function () {
      if (this.db) return Promise.resolve(this.db);
      var self = this;
      return new Promise(function (res, rej) {
        if (!window.indexedDB) { rej(new Error("no IndexedDB")); return; }
        var r = indexedDB.open("c64-emulator", 1);
        r.onupgradeneeded = function () { r.result.createObjectStore("kv"); };
        r.onsuccess = function () { self.db = r.result; res(self.db); };
        r.onerror = function () { rej(r.error); };
      });
    },
    get: function (k) {
      return this.open().then(function (db) {
        return new Promise(function (res) {
          var q = db.transaction("kv").objectStore("kv").get(k);
          q.onsuccess = function () { res(q.result); }; q.onerror = function () { res(undefined); };
        });
      }).catch(function () { return undefined; });
    },
    put: function (k, v) {
      return this.open().then(function (db) {
        return new Promise(function (res) {
          var t = db.transaction("kv", "readwrite"); t.objectStore("kv").put(v, k);
          t.oncomplete = function () { res(true); }; t.onerror = function () { res(false); };
        });
      }).catch(function () { return false; });
    },
    del: function (k) {
      return this.open().then(function (db) {
        return new Promise(function (res) {
          var t = db.transaction("kv", "readwrite"); t.objectStore("kv").delete(k);
          t.oncomplete = function () { res(true); }; t.onerror = function () { res(false); };
        });
      }).catch(function () { return false; });
    }
  };

  // ------------------------------------------------------------------ state
  var c64 = null;
  var userRoms = {};
  var usingOriginal = false;
  var media = { disks: [], diskIndex: -1, tape: null, cart: null, t64: null };
  var running = true, warp = false;
  var snapshot = null;
  var debug = null;                 // monitor and debugger (debugger.js)
  var spriteView = null;            // sprite viewer (sprites.js)
  var charView = null;              // character set viewer (charset.js)
  var musicTools = null;            // WAV recording and SID ripping (music.js)
  var lastFileName = "";

  // ------------------------------------------------------------------ messages
  function showError(msg) { var e = $("error"); e.textContent = msg; e.hidden = !msg; }
  var noticeTimer = 0;
  function notice(msg, ms) {
    var n = $("notice"); n.textContent = msg; n.hidden = !msg;
    clearTimeout(noticeTimer);
    if (msg && ms) noticeTimer = setTimeout(function () { n.hidden = true; }, ms);
  }

  // ------------------------------------------------------------------ machine
  function buildMachine() {
    var orig = userRoms.kernal && userRoms.basic && userRoms.chargen;
    usingOriginal = !!orig;
    c64 = new C64(orig ? { kernal: userRoms.kernal, basic: userRoms.basic, chargen: userRoms.chargen } : window.C64_OPEN_ROMS);
    c64.sid.setModel(+settings.sid);
    if (audio.ctx) c64.sid.setSampleRate(audio.rate);
    c64.tape = new Datasette();
    // real 1541 with its DOS ROM, otherwise the virtual drive (fast loader + drive code)
    c64.drive = new Drive1541(c64, settings.truedrive && userRoms.dos ? userRoms.dos : null);
    c64.drive.onLed = setLed;
    remount();
    c64.reset(true);
    if (debug) debug.attach(c64);
    if (spriteView) spriteView.attach(c64);
    if (charView) charView.attach(c64);
    if (musicTools) musicTools.attach(c64);
    updateRomStatus();
    updateMediaUi();
  }

  function remount() {
    var d = media.disks[media.diskIndex] || null;
    c64.disk = d;
    if (c64.drive) { if (d) c64.drive.insert(d); else c64.drive.eject(); }
    c64.tapeImage = media.t64;
    if (media.tape) c64.tape.insert(media.tape); else c64.tape.eject();
    c64.cart = null;
    if (media.cart) {
      try { c64.cart = new Cartridge(media.cart, c64); }
      catch (e) { showError(e.message); media.cart = null; }
    }
    c64.updateMap();
  }

  function hardReset() {
    c64.reset(true);
    c64.releaseAllKeys();
    keyState = {};
    running = true; updatePauseUi();
    if (debug) debug.afterReset();
  }

  // ------------------------------------------------------------------ loading media
  function readFile(file) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res(new Uint8Array(r.result)); };
      r.onerror = function () { rej(new Error("The file could not be read.")); };
      r.readAsArrayBuffer(file);
    });
  }

  async function openFile(file) {
    showError("");
    try {
      var bytes = await readFile(file);
      lastFileName = file.name;
      var items = await Media.load(file.name, bytes);
      attach(items, settings.autostart);
    } catch (e) {
      showError(e.message || String(e));
    }
    $("screen").focus();
  }

  // Load a file from a web address, e.g. from a link like
  //   .../apps/c64-emulator/?file=https://raw.githubusercontent.com/<user>/<repo>/main/game.crt
  // GitHub page links (github.com/<user>/<repo>/blob/<branch>/<path>) are turned
  // into the raw file. The server must allow the download (CORS), as GitHub does.
  function rawUrl(u) {
    var m = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/(?:blob|raw)\/(.+)$/.exec(u);
    return m ? "https://raw.githubusercontent.com/" + m[1] + "/" + m[2] + "/" + m[3] : u;
  }

  async function openUrl(u) {
    var url;
    try { url = new URL(rawUrl(u.trim())); } catch (e) { showError("The link to the file is not a valid web address."); return; }
    if (url.protocol !== "https:" && url.hostname !== "localhost") { showError("Only files from https:// addresses can be loaded."); return; }
    var name = decodeURIComponent(url.pathname.split("/").pop() || "file");
    notice("Loading " + name + " …");
    try {
      var r = await fetch(url.href);
      if (!r.ok) throw new Error(r.status === 404 ? "The file " + name + " was not found (" + url.host + ")." : "The file " + name + " could not be loaded (HTTP " + r.status + ").");
      var bytes = new Uint8Array(await r.arrayBuffer());
      if (bytes.length > 64 * 1024 * 1024) throw new Error("The file is too large.");
      lastFileName = name;
      var items = await Media.load(name, bytes);
      notice("");
      attach(items, true);
    } catch (e) {
      notice("");
      showError(e instanceof TypeError ? "The file " + name + " could not be downloaded from " + url.host + ". The server may not allow it (CORS), or you are offline." : (e.message || String(e)));
    }
  }

  function attach(items, autostart) {
    var disks = items.filter(function (i) { return i.kind === "disk"; });
    var first = items[0];
    if (disks.length) {
      media.disks = disks; media.diskIndex = 0;
      first = disks[0];
    }
    items.forEach(function (i) {
      if (i.kind === "tap") { media.tape = i; media.t64 = null; }
      if (i.kind === "t64") { media.t64 = i; media.tape = null; }
      if (i.kind === "crt") media.cart = i;
    });
    if (first.kind === "prg" && !autostart) {
      c64.injectPrg(first.data);
      notice("Program loaded into memory. Type RUN to start it.", 4000);
    } else if (first.kind === "crt") {
      remount();
      if (!media.cart) return;
      hardReset();
      notice("Cartridge: " + (c64.cart ? c64.cart.name : "") + " – " + (first.title || first.name), 4000);
    } else if (first.kind === "prg") {
      startPrg(first.data);
    } else if (first.kind === "disk") {
      remount();
      if (autostart) startDisk(null);
      if (c64.drive.hle && first.format === "g64") notice("Without the 1541 ROM, G64 images are read through the fast loader; copy-protected disks need the real drive.", 7000);
    } else if (first.kind === "t64") {
      remount();
      if (autostart && first.files.length) startPrg(first.files[0].data);
    } else if (first.kind === "tap") {
      remount();
      if (autostart) {
        hardReset();
        // press PLAY together with LOAD; device 1 is given because the Open ROMs default to 8
        c64.typeQueue.push({ fn: function () { c64.tape.rewind(); c64.tape.play(); } });
        c64.type('LOAD"",1,1\rRUN\r');
        notice("The tape is playing. Turbo loaders read the tape in real time – Warp speeds it up.", 6000);
      } else c64.tape.play();
    }
    updateMediaUi();
  }

  function startPrg(data) {
    if (media.cart) { media.cart = null; remount(); }
    hardReset();
    c64.typeQueue.push({ fn: function () {
      var r = c64.injectPrg(data);
      c64.type(r.start === 0x0801 ? "RUN\r" : "SYS" + r.start + "\r");
    } });
  }

  function startDisk(nameBytes) {
    if (media.cart) { media.cart = null; remount(); }
    hardReset();
    var name = nameBytes ? Media.petsciiToText(nameBytes).replace(/"/g, "") : "*";
    c64.type('LOAD"' + name + '",8,1\rRUN\r');
  }

  function ejectDisk() {
    media.disks = []; media.diskIndex = -1;
    remount(); updateMediaUi();
  }

  // ------------------------------------------------------------------ media panel
  function updateMediaUi() {
    var d = media.disks[media.diskIndex];
    $("disk-name").textContent = d ? d.name + (d.dirty ? " (changed)" : "") : "empty";
    $("slot-disk").classList.toggle("filled", !!d);
    $("disk-eject").disabled = !d;
    $("disk-download").disabled = !d;
    var sel = $("disk-select");
    sel.hidden = media.disks.length < 2;
    if (media.disks.length > 1) {
      sel.innerHTML = "";
      media.disks.forEach(function (dk, i) {
        var o = document.createElement("option"); o.value = i; o.textContent = dk.name; sel.appendChild(o);
      });
      sel.value = media.diskIndex;
    }
    var t = media.tape || media.t64;
    $("tape-name").textContent = t ? t.name : "empty";
    $("slot-tape").classList.toggle("filled", !!t);
    ["tape-play", "tape-stop", "tape-rewind"].forEach(function (id) { $(id).disabled = !media.tape; });
    $("tape-eject").disabled = !t;
    $("cart-name").textContent = media.cart ? (media.cart.title || media.cart.name) : "empty";
    $("slot-cart").classList.toggle("filled", !!media.cart);
    $("cart-eject").disabled = !media.cart;
    $("st-tape").hidden = !media.tape;
    renderDirectory();
  }

  function renderDirectory() {
    var src = media.disks[media.diskIndex] || media.t64;
    var panel = $("dir-panel"), box = $("directory");
    panel.hidden = !src;
    if (!src) return;
    box.innerHTML = "";
    var head = document.createElement("div");
    head.className = "c64-line";
    var hs = document.createElement("span");
    hs.className = "reverse";
    var dn = Media.petsciiToText(src.diskName || []).padEnd(16, " ").slice(0, 16);
    var id = src.diskId ? Media.petsciiToText(Array.from(src.diskId).slice(0, 5)) : "";
    hs.textContent = '0 "' + dn + '" ' + id;
    head.appendChild(hs);
    box.appendChild(head);
    (src.files || []).forEach(function (f) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "c64-file";
      var name = '"' + Media.petsciiToText(f.name) + '"';
      var blocks = String(f.blocks);
      var tn = (Media.TYPES[f.type & 7] || "???");
      b.textContent = blocks.padEnd(5, " ") + name.padEnd(19, " ") + tn;
      var runnable = (f.type & 7) === 2 || src.kind === "t64";
      if (!runnable) { b.disabled = true; b.style.opacity = 0.6; b.style.cursor = "default"; }
      b.addEventListener("click", function () {
        if (src.kind === "t64") startPrg(f.data);
        else startDisk(f.name);
        $("screen").focus();
      });
      box.appendChild(b);
    });
    var free = document.createElement("div");
    free.className = "c64-line";
    free.textContent = (src.free != null ? src.free : 0) + " BLOCKS FREE.";
    box.appendChild(free);
  }

  // ------------------------------------------------------------------ ROMs
  function classifyRom(bytes) {
    var n = bytes.length;
    if (n === 16384) return "dos";
    if (n === 32768) return "dos32";
    if (n === 4096) return "chargen";
    if (n === 8192) {
      var tag = String.fromCharCode.apply(null, bytes.subarray(4, 12));
      if (tag === "CBMBASIC") return "basic";
      var reset = bytes[0x1FFC] | (bytes[0x1FFD] << 8);
      if (reset === 0xEAA0) return "dosHi";
      if (reset >= 0xE000) return "kernal";
      return "dosLo";
    }
    return null;
  }

  async function loadRomFiles(files) {
    var found = {}, unknown = [];
    for (var i = 0; i < files.length; i++) {
      var bytes = await readFile(files[i]);
      var kind = classifyRom(bytes);
      if (!kind) unknown.push(files[i].name);
      else found[kind] = bytes;
    }
    if (found.dos32) found.dos = found.dos32.slice(16384);
    if (found.dosLo && found.dosHi) { found.dos = new Uint8Array(16384); found.dos.set(found.dosLo); found.dos.set(found.dosHi, 8192); }
    ["kernal", "basic", "chargen", "dos"].forEach(function (k) {
      if (found[k]) { userRoms[k] = found[k]; store.put("rom." + k, found[k]); }
    });
    var msg = [];
    if (unknown.length) msg.push("Not recognised: " + unknown.join(", ") + ".");
    if (!(userRoms.kernal && userRoms.basic && userRoms.chargen)) {
      var miss = ["kernal", "basic", "chargen"].filter(function (k) { return !userRoms[k]; })
        .map(function (k) { return { kernal: "KERNAL (8 KB)", basic: "BASIC (8 KB)", chargen: "character ROM (4 KB)" }[k]; });
      msg.push("Still missing: " + miss.join(", ") + ".");
    }
    showError(msg.join(" "));
    buildMachine();
  }

  function updateRomStatus() {
    var s;
    if (usingOriginal) s = "Original C64 ROMs" + (userRoms.dos ? " and 1541 ROM" : "") + ", stored in this browser.";
    else s = "Built-in free Open ROMs" + (userRoms.dos ? ", 1541 ROM loaded" : "") + ".";
    if (!userRoms.dos) s += " No 1541 ROM: a virtual drive is used; it loads fast and runs uploaded drive code (most fast loaders).";
    else if (!settings.truedrive) s += " Real drive switched off: virtual drive.";
    $("rom-status").textContent = s;
    $("rom-clear").hidden = !(userRoms.kernal || userRoms.basic || userRoms.chargen || userRoms.dos);
  }

  // ------------------------------------------------------------------ screen
  var canvas = $("screen"), monitor = $("monitor");
  var ctx = canvas.getContext("2d", { alpha: false });
  var image = ctx.createImageData(VIC6569.W, VIC6569.H);
  var crop = { x: 0, y: 0, w: VIC6569.W, h: VIC6569.H };

  function applyDisplay() {
    crop = settings.border === "small" ? { x: 16, y: 20, w: 352, h: 232 } : { x: 0, y: 0, w: VIC6569.W, h: VIC6569.H };
    canvas.width = crop.w; canvas.height = crop.h;
    canvas.style.aspectRatio = (crop.w * PIXEL_ASPECT / crop.h).toFixed(4);
    monitor.classList.toggle("smooth", !!settings.smooth);
    layoutFullscreen();
    draw();
  }

  function draw() {
    if (!c64) return;
    image.data.set(new Uint8ClampedArray(c64.vic.fb.buffer));
    ctx.putImageData(image, -crop.x, -crop.y);
    if (debug) debug.overlay(ctx, crop);
  }

  function layoutFullscreen() {
    if (document.fullscreenElement === monitor) {
      var ar = crop.w * PIXEL_ASPECT / crop.h;
      var w = window.innerWidth, h = window.innerHeight;
      if (w / h > ar) w = h * ar; else h = w / ar;
      canvas.style.width = Math.floor(w) + "px";
      canvas.style.height = Math.floor(h) + "px";
    } else {
      canvas.style.width = ""; canvas.style.height = "";
    }
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (monitor.requestFullscreen) monitor.requestFullscreen().catch(function () { /* refused */ });
    canvas.focus();
  }
  document.addEventListener("fullscreenchange", function () { layoutFullscreen(); canvas.focus(); });
  window.addEventListener("resize", layoutFullscreen);

  var barTimer = 0;
  monitor.addEventListener("mousemove", function () {
    monitor.classList.add("show-bar"); monitor.classList.remove("hide-cursor");
    clearTimeout(barTimer);
    barTimer = setTimeout(function () { monitor.classList.remove("show-bar"); monitor.classList.add("hide-cursor"); }, 2000);
  });

  // ------------------------------------------------------------------ sound
  var WORKLET = "class C64Out extends AudioWorkletProcessor{constructor(){super();this.q=[];this.cur=null;this.pos=0;this.n=0;this.t=0;" +
    "this.port.onmessage=e=>{if(e.data==='clear'){this.q=[];this.cur=null;this.n=0;return;}this.q.push(e.data);this.n+=e.data.length;};}" +
    "process(i,o){const out=o[0][0];for(let k=0;k<out.length;k++){if(!this.cur||this.pos>=this.cur.length){this.cur=this.q.shift()||null;this.pos=0;" +
    "if(!this.cur){out.fill(0,k);break;}}out[k]=this.cur[this.pos++];this.n--;}if(this.n<0)this.n=0;for(let c=1;c<o[0].length;c++)o[0][c].set(out);" +
    "if(++this.t>=4){this.t=0;this.port.postMessage(this.n);}return true;}}registerProcessor('c64-out',C64Out);";
  var audio = { ctx: null, node: null, rate: 44100, ready: false, reported: 0, sent: 0, target: 0, sp: null, spQueue: [] };

  async function initAudio() {
    if (audio.ctx || !settings.sound) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    var actx = new AC({ latencyHint: "interactive" });
    audio.ctx = actx;
    audio.rate = actx.sampleRate;
    audio.target = Math.round(audio.rate * 0.08);
    if (c64) c64.sid.setSampleRate(audio.rate);
    var gain = actx.createGain();
    gain.gain.value = 0.9;
    gain.connect(actx.destination);
    try {
      var url = URL.createObjectURL(new Blob([WORKLET], { type: "application/javascript" }));
      await actx.audioWorklet.addModule(url);
      audio.node = new AudioWorkletNode(actx, "c64-out", { outputChannelCount: [2] });
      audio.node.port.onmessage = function (e) { audio.reported = e.data; audio.sent = 0; };
      audio.node.connect(gain);
    } catch (e) {
      // fallback for browsers without AudioWorklet
      var sp = actx.createScriptProcessor(1024, 0, 2);
      audio.sp = sp;
      sp.onaudioprocess = function (ev) {
        var l = ev.outputBuffer.getChannelData(0), r = ev.outputBuffer.getChannelData(1), k = 0;
        while (k < l.length && audio.spQueue.length) {
          var c = audio.spQueue[0];
          var n = Math.min(c.data.length - c.pos, l.length - k);
          l.set(c.data.subarray(c.pos, c.pos + n), k);
          c.pos += n; k += n;
          if (c.pos >= c.data.length) audio.spQueue.shift();
        }
        if (k < l.length) l.fill(0, k);
        r.set(l);
        audio.reported = audio.spQueue.reduce(function (s, c) { return s + c.data.length - c.pos; }, 0);
        audio.sent = 0;
      };
      sp.connect(gain);
    }
    audio.ready = true;
    updateSoundUi();
  }
  function audioActive() { return audio.ready && settings.sound && audio.ctx.state === "running"; }
  function audioBuffered() { return audio.reported + audio.sent; }
  function pushAudio(s) {
    if (!s.length) return;
    if (audio.node) audio.node.port.postMessage(s, [s.buffer]);
    else audio.spQueue.push({ data: s, pos: 0 });
    audio.sent += s.length;
  }
  function clearAudio() {
    if (audio.node) audio.node.port.postMessage("clear");
    audio.spQueue = []; audio.reported = 0; audio.sent = 0;
  }
  function userGesture() {
    updateWakeLock(true);
    $("click-hint").hidden = true;
    if (!settings.sound) return;
    if (!audio.ctx) initAudio();
    else if (audio.ctx.state === "suspended") audio.ctx.resume();
  }
  function updateSoundUi() {
    var b = $("btn-sound");
    b.textContent = settings.sound ? "Sound on" : "Sound off";
    b.setAttribute("aria-pressed", settings.sound ? "true" : "false");
  }

  // ------------------------------------------------------------------ main loop
  var last = performance.now(), acc = 0, frameCount = 0, speedT = performance.now(), statusTick = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    pollGamepads();
    var dt = Math.min(now - last, 100);
    last = now;
    if (!c64 || !running) return;
    var frames = 0;
    if (warp) {
      var t0 = performance.now();
      do { runOne(); frames++; } while (running && performance.now() - t0 < 14);
      var ws = c64.sid.takeSamples();
      if (musicTools) musicTools.samples(ws);
    } else {
      // the picture always follows the clock; the sound adapts to it (see feedAudio)
      acc += dt * FRAME_HZ / 1000;
      while (running && acc >= 1 && frames < 4) { runOne(); feedAudio(); acc -= 1; frames++; }
      if (acc > 2) acc = 0;
    }
    frameCount += frames;
    if (frames) draw();
    if (++statusTick >= 10) { statusTick = 0; updateStatus(); updateWakeLock(); }
    if (now - speedT >= 1000) {
      $("st-speed").textContent = Math.round(frameCount / ((now - speedT) / 1000) / FRAME_HZ * 100) + " %";
      frameCount = 0; speedT = now;
    }
  }
  function runOne() {
    processKeyQueue();
    // false: the debugger stopped the C64 in the middle of the frame
    if (c64.runFrame() === false && debug) debug.onStop();
  }
  // Hand the samples of one frame to the audio output. The display refresh and the
  // sound card run on different clocks, so the SID output rate is nudged by up to
  // 1 % to keep the audio buffer near its target instead of pacing the emulation by it.
  function feedAudio() {
    var s = c64.sid.takeSamples();
    if (musicTools) musicTools.samples(s);
    if (!audioActive()) { audio.fill = 0; return; }
    var fill = audioBuffered();
    audio.fill = audio.fill ? audio.fill * 0.9 + fill * 0.1 : fill;
    if (fill > audio.target * 3) return;               // far ahead (e.g. after a hiccup): drop
    if (fill < audio.target * 0.25) {                  // (nearly) empty: refill with a short pause
      pushAudio(new Float32Array(audio.target - fill));
      audio.fill = audio.target;
    }
    pushAudio(s);
    var err = (audio.fill - audio.target) / audio.target;
    if (err > 1) err = 1; else if (err < -1) err = -1;
    c64.sid.cps = (C64.CLOCK / audio.rate) * (1 + 0.01 * err);
  }

  function setLed(on) { $("led").classList.toggle("on", !!on); }
  function updateStatus() {
    var d = media.disks[media.diskIndex];
    var txt = "Drive 8: " + (d ? d.name : "empty");
    if (c64.drive && c64.drive.motor) txt = "Drive 8: track " + (c64.drive.halfTrack / 2).toFixed(1).replace(".0", "");
    $("st-drive").textContent = txt;
    if (media.tape) {
      var p = c64.tape.progress();
      $("tape-progress").style.width = (p * 100).toFixed(1) + "%";
      var secs = Math.floor(c64.tape.elapsed / C64.CLOCK);
      $("st-tape").textContent = "Tape " + (c64.tape.running ? "▶ " : c64.tape.playing ? "▷ " : "■ ") +
        Math.floor(secs / 60) + ":" + String(secs % 60).padStart(2, "0");
    }
    if (d && d.dirty && !$("disk-name").textContent.endsWith("(changed)")) updateMediaUi();
  }

  function setPaused(p) {
    // with the debugger open, Pause stops at the next instruction and Resume goes on from there
    if (debug && debug.isOpen()) {
      if (p && running) debug.breakNow();
      else if (!p && debug.isStopped()) debug.cont();
      return;
    }
    running = !p;
    if (!running) clearAudio();
    updatePauseUi();
    updateWakeLock();
  }
  function updatePauseUi() {
    $("btn-pause").textContent = running ? "Pause" : "Resume";
    $("btn-pause").setAttribute("aria-pressed", running ? "false" : "true");
    document.querySelectorAll('[data-act="pause"].btn-icon').forEach(function (b) { b.textContent = running ? "❚❚" : "▶"; });
  }

  // ------------------------------------------------------------------ keep the screen awake
  // The browser may refuse the lock or drop it at any time (also while the page stays
  // visible), so the main loop checks it regularly and asks again; a refused request
  // is retried after a few seconds or with the next click or key press.
  var wakeLock = null, wakeBusy = false, wakeRetryAt = 0;
  function wantWakeLock() { return !!(settings.awake && running && !document.hidden); }
  function updateWakeLock(force) {
    if (!navigator.wakeLock) return;
    if (wakeLock && wakeLock.released) wakeLock = null;
    if (force) wakeRetryAt = 0;
    if (wantWakeLock()) {
      if (wakeLock || wakeBusy || performance.now() < wakeRetryAt) return;
      wakeBusy = true;
      navigator.wakeLock.request("screen").then(function (l) {
        wakeBusy = false;
        if (!wantWakeLock()) { l.release().catch(function () {}); return; }
        wakeLock = l;
      }).catch(function () {
        wakeBusy = false;
        wakeRetryAt = performance.now() + 3000;
      });
    } else if (wakeLock) {
      var l = wakeLock;
      wakeLock = null;
      l.release().catch(function () {});
    }
  }
  document.addEventListener("visibilitychange", function () {
    updateWakeLock(true);
    if (!document.hidden) { last = performance.now(); acc = 0; }
  });

  // ------------------------------------------------------------------ keyboard
  // characters -> [C64 key, shift: 1 = force, 0 = force off, null = as typed]
  var CHARS = {
    "!": ["1", 1], '"': ["2", 1], "#": ["3", 1], "$": ["4", 1], "%": ["5", 1], "&": ["6", 1], "'": ["7", 1],
    "(": ["8", 1], ")": ["9", 1], "+": ["PLUS", 0], "-": ["MINUS", 0], "*": ["ASTERISK", 0], "/": ["SLASH", 0],
    "=": ["EQUALS", 0], ":": ["COLON", 0], ";": ["SEMICOLON", 0], ",": ["COMMA", 0], ".": ["PERIOD", 0],
    "@": ["AT", 0], "£": ["POUND", 0], "^": ["UP_ARROW", 0], "[": ["COLON", 1], "]": ["SEMICOLON", 1],
    "<": ["COMMA", 1], ">": ["PERIOD", 1], "?": ["SLASH", 1], " ": ["SPACE", null], "`": ["LEFT_ARROW", 0],
    "_": ["LEFT_ARROW", 0], "\\": ["POUND", 0], "π": ["UP_ARROW", 1], "|": ["MINUS", 1]
  };
  var CODES = {
    Enter: ["RETURN", null], NumpadEnter: ["RETURN", null], Backspace: ["DEL", null], Delete: ["DEL", 0], Insert: ["DEL", 1],
    Home: ["HOME", null], ArrowRight: ["CRSR_RIGHT", 0], ArrowLeft: ["CRSR_RIGHT", 1], ArrowDown: ["CRSR_DOWN", 0],
    ArrowUp: ["CRSR_DOWN", 1], Escape: ["RUN_STOP", null], Tab: ["CTRL", null], ControlLeft: ["CTRL", null],
    AltLeft: ["CBM", null], ShiftLeft: ["LSHIFT", null], ShiftRight: ["RSHIFT", null],
    F1: ["F1", 0], F2: ["F1", 1], F3: ["F3", 0], F4: ["F3", 1], F5: ["F5", 0], F6: ["F5", 1], F7: ["F7", 0], F8: ["F7", 1],
  };
  var JOYKEYS = {
    numpad: { Numpad8: 1, Numpad2: 2, Numpad4: 4, Numpad6: 8, Numpad7: 5, Numpad9: 9, Numpad1: 6, Numpad3: 10, Numpad0: 16, Numpad5: 16, NumpadDecimal: 16 },
    cursor: { ArrowUp: 1, ArrowDown: 2, ArrowLeft: 4, ArrowRight: 8, Space: 16 },
    wasd: { KeyW: 1, KeyS: 2, KeyA: 4, KeyD: 8, ShiftLeft: 16 },
    off: {}
  };
  var keyState = {};          // event.code -> [key, shift]
  var joyKeys = {};           // event.code -> bits
  var screenKeys = {};        // on-screen key name -> true
  var pcShift = false;

  function applyKeys() {
    if (!c64) return;
    c64.releaseAllKeys();
    var force = false, off = false, code;
    for (code in keyState) {
      var k = keyState[code];
      if (k[0] === "LSHIFT" || k[0] === "RSHIFT") continue;
      c64.key(k[0], true);
      if (k[1] === 1) force = true;
      if (k[1] === 0) off = true;
    }
    for (var n in screenKeys) if (n !== "RESTORE") c64.key(n, true);
    var lshift = keyState.ShiftLeft && !off, rshift = keyState.ShiftRight && !off;
    if (force) lshift = true;
    if (lshift) c64.key("LSHIFT", true);
    if (rshift) c64.key("RSHIFT", true);
  }
  function joyBitsFromKeys() {
    var b = 0; for (var c in joyKeys) b |= joyKeys[c]; return b;
  }

  function emulatorHasFocus() {
    if (document.fullscreenElement === monitor) return true;
    return document.activeElement === canvas;
  }

  window.addEventListener("keydown", function (e) {
    if (e.code === "F11") { e.preventDefault(); toggleFullscreen(); return; }
    if (!emulatorHasFocus()) return;
    userGesture();
    if (e.code === "F12" && e.ctrlKey) { e.preventDefault(); hardReset(); return; }
    if (e.code === "Pause") { e.preventDefault(); setPaused(running); return; }
    if (e.code === "PageUp") { e.preventDefault(); c64.restoreKey(true); return; }
    if (e.ctrlKey && (e.key === "v" || e.key === "V") && e.code !== "Tab") { pasteText(); e.preventDefault(); return; }
    var jk = JOYKEYS[settings.keyjoy] || {};
    if (jk[e.code] !== undefined) { joyKeys[e.code] = jk[e.code]; e.preventDefault(); return; }
    if (e.repeat) { e.preventDefault(); return; }
    var map = CODES[e.code];
    if (!map && e.key && e.key.length === 1) {
      var ch = e.key;
      if (/^[a-z]$/i.test(ch)) map = [ch.toUpperCase(), null];
      else if (/^[0-9]$/.test(ch)) map = [ch, null];
      else map = CHARS[ch];
    }
    if (!map && e.key === "Dead" && e.code === "Backquote") map = ["UP_ARROW", 0];
    if (map) {
      keyQueue.push({ down: true, code: e.code, map: map });
      e.preventDefault();
    }
  });
  window.addEventListener("keyup", function (e) {
    if (e.code === "PageUp" && c64) { c64.restoreKey(false); return; }
    if (joyKeys[e.code] !== undefined) { delete joyKeys[e.code]; return; }
    if (keyState[e.code] || keyQueue.some(function (q) { return q.code === e.code; })) { keyQueue.push({ down: false, code: e.code }); e.preventDefault(); }
  });
  window.addEventListener("blur", function () { keyState = {}; joyKeys = {}; keyQueue = []; applyKeys(); });

  // Key events are applied frame by frame so that even very short key presses
  // last long enough for the KERNAL keyboard scan (every 1/60 s).
  var keyQueue = [], keyWait = 0;
  var MODIFIERS = { LSHIFT: 1, RSHIFT: 1, CTRL: 1, CBM: 1 };
  function processKeyQueue() {
    if (keyWait > 0) { keyWait--; return; }
    while (keyQueue.length) {
      var ev = keyQueue.shift();
      if (ev.down) keyState[ev.code] = ev.map; else delete keyState[ev.code];
      applyKeys();
      var mod = ev.down ? MODIFIERS[ev.map[0]] : false;
      if (ev.down && !mod) { keyWait = 2; return; }
      if (!ev.down) { keyWait = 1; return; }
    }
  }

  // on-screen C64 keys
  document.querySelectorAll(".ckeys button").forEach(function (b) {
    var name = b.getAttribute("data-key");
    var up = function () {
      if (!screenKeys[name]) return;
      setTimeout(function () {
        delete screenKeys[name]; b.classList.remove("down");
        if (name === "RESTORE") c64.restoreKey(false); else applyKeys();
      }, 90);
    };
    b.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      userGesture();
      screenKeys[name] = true; b.classList.add("down");
      if (name === "RESTORE") c64.restoreKey(true); else applyKeys();
    });
    b.addEventListener("pointerup", up);
    b.addEventListener("pointerleave", up);
    b.addEventListener("click", function () { canvas.focus(); });
  });

  // ------------------------------------------------------------------ joysticks
  var padInfo = "";
  function pollGamepads() {
    if (!c64) return;
    var port = settings.port === 1 || settings.port === "1" ? 0 : 1;
    var bits = [0, 0];
    bits[port] |= joyBitsFromKeys();
    var pads = navigator.getGamepads ? navigator.getGamepads() : [];
    var found = [];
    for (var i = 0; i < pads.length; i++) if (pads[i] && pads[i].connected) found.push(pads[i]);
    var spaceFromPad = false;
    found.slice(0, 2).forEach(function (p, idx) {
      var b = 0, ax = p.axes, bt = p.buttons;
      var pressed = function (n) { return bt[n] && (bt[n].pressed || bt[n].value > 0.5); };
      if ((ax[1] || 0) < -0.5 || pressed(12)) b |= 1;
      if ((ax[1] || 0) > 0.5 || pressed(13)) b |= 2;
      if ((ax[0] || 0) < -0.5 || pressed(14)) b |= 4;
      if ((ax[0] || 0) > 0.5 || pressed(15)) b |= 8;
      if (pressed(0) || pressed(1) || pressed(2) || pressed(6) || pressed(7)) b |= 16;
      if (pressed(3)) spaceFromPad = true;
      bits[idx === 0 ? port : 1 - port] |= b;
      if (b || spaceFromPad) userGestureFromPad();
    });
    c64.setJoystick(0, bits[0]);
    c64.setJoystick(1, bits[1]);
    if (spaceFromPad !== !!screenKeys.SPACE_PAD) {
      if (spaceFromPad) screenKeys.SPACE_PAD = true; else delete screenKeys.SPACE_PAD;
      c64.key("SPACE", spaceFromPad);
    }
    var info = found.length ? found.length + " gamepad" + (found.length > 1 ? "s" : "") + ": " +
      found.slice(0, 2).map(function (p) { return p.id.replace(/\s*\(.*$/, "").slice(0, 32); }).join(", ") +
      ". Stick or D-pad steers, A/B/X fire, Y = Space." + (found.length > 1 ? " The second one plays in the other port." : "")
      : "No gamepad found. Connect one and press a button.";
    if (info !== padInfo) { padInfo = info; $("pad-status").textContent = info; }
  }
  function userGestureFromPad() {
    // gamepad input does not count as a user gesture for audio; nothing to do but hide the hint once audio runs
    if (audio.ctx && audio.ctx.state === "running") $("click-hint").hidden = true;
  }
  function updateJoyStatus() {
    $("st-joy").textContent = "Joystick: port " + settings.port;
  }

  // ------------------------------------------------------------------ paste
  async function pasteText() {
    var text = null;
    try { text = await navigator.clipboard.readText(); } catch (e) { text = null; }
    if (text === null) text = window.prompt("Text to type on the C64:");
    if (!text) return;
    var out = "";
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch === "\r") continue;
      if (ch === "\n") { out += "\r"; continue; }
      var u = ch.toUpperCase();
      var code = u.charCodeAt(0);
      if (code >= 0x20 && code <= 0x5D) out += u;
    }
    c64.type(out);
    canvas.focus();
  }

  // ------------------------------------------------------------------ snapshots
  function saveState() {
    snapshot = c64.saveState();
    snapshot.meta = { drive: !c64.drive.hle, original: usingOriginal };
    store.put("state", snapshot);
    $("btn-load-state").disabled = false;
    notice("State saved (also kept in this browser for the next visit).", 3000);
  }
  function loadState() {
    if (!snapshot) return;
    if (snapshot.meta && snapshot.meta.original !== usingOriginal) {
      showError("This state was saved with " + (snapshot.meta.original ? "the original" : "the built-in") + " ROMs and cannot be restored now.");
      return;
    }
    var s = Object.assign({}, snapshot);
    if (c64.drive.hle || !(snapshot.meta && snapshot.meta.drive)) s.drive = null;
    c64.loadState(s);
    if (audio.ctx) c64.sid.setSampleRate(audio.rate);
    clearAudio();
    running = true; updatePauseUi();
    if (debug) debug.afterReset();
    draw();
    notice("State loaded.", 2000);
  }

  // ------------------------------------------------------------------ downloads
  function download(name, bytes) {
    var url = URL.createObjectURL(new Blob([bytes], { type: "application/octet-stream" }));
    var a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  // ------------------------------------------------------------------ debugger
  function setDebugger(on) {
    if (!debug) return;
    settings.debugger = !!on; saveSettings();
    debug.setOpen(!!on);
    $("btn-debug").setAttribute("aria-pressed", on ? "true" : "false");
    if (on) $("debugger").scrollIntoView({ block: "nearest", behavior: "smooth" });
    draw();
  }
  function initDebugger() {
    if (!window.C64Debugger) return;
    debug = window.C64Debugger({
      stop: function () { running = false; clearAudio(); updatePauseUi(); updateWakeLock(); draw(); },
      resume: function () { running = true; last = performance.now(); acc = 0; clearAudio(); updatePauseUi(); updateWakeLock(); draw(); },
      toggle: setDebugger,
      download: download,
      reset: function () { hardReset(); draw(); }
    });
    $("btn-debug").addEventListener("click", function () { setDebugger(!debug.isOpen()); });
  }
  function setSprites(on) {
    if (!spriteView) return;
    settings.sprites = !!on; saveSettings();
    spriteView.setOpen(!!on);
    $("btn-sprites").setAttribute("aria-pressed", on ? "true" : "false");
    if (on) $("sprites").scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  function setCharset(on) {
    if (!charView) return;
    settings.charset = !!on; saveSettings();
    charView.setOpen(!!on);
    $("btn-charset").setAttribute("aria-pressed", on ? "true" : "false");
    if (on) $("charset").scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  function initCharset() {
    if (!window.C64Charset) return;
    charView = window.C64Charset({ toggle: setCharset });
    $("btn-charset").addEventListener("click", function () { setCharset(!charView.isOpen()); });
  }
  function setMusic(on) {
    if (!musicTools) return;
    settings.music = !!on; saveSettings();
    musicTools.setOpen(!!on);
    $("btn-music").setAttribute("aria-pressed", on ? "true" : "false");
    if (on) $("music").scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  function initMusic() {
    if (!window.C64Music || !window.C64SidRip) return;
    musicTools = window.C64Music({
      toggle: setMusic,
      download: download,
      isRunning: function () { return running; },
      fileName: function () { return lastFileName; }
    });
    $("btn-music").addEventListener("click", function () { setMusic(!musicTools.isOpen()); });
  }
  function initSprites() {
    if (!window.C64Sprites) return;
    spriteView = window.C64Sprites({ toggle: setSprites });
    $("btn-sprites").addEventListener("click", function () { setSprites(!spriteView.isOpen()); });
  }

  // ------------------------------------------------------------------ wiring
  function act(name) {
    userGesture();
    if (name === "pause") setPaused(running);
    else if (name === "reset") hardReset();
    else if (name === "fullscreen") toggleFullscreen();
    else if (name === "swapjoy") {
      settings.port = settings.port == 1 ? 2 : 1;
      $("opt-port").value = settings.port; saveSettings(); updateJoyStatus();
      notice("Joystick now in port " + settings.port + ".", 2000);
    }
    if (name !== "fullscreen") canvas.focus();
  }
  document.querySelectorAll("[data-act]").forEach(function (b) {
    b.addEventListener("click", function () { act(b.getAttribute("data-act")); });
  });

  $("btn-open").addEventListener("click", function () { $("file-input").click(); });
  $("file-input").addEventListener("change", function (e) { if (e.target.files[0]) openFile(e.target.files[0]); e.target.value = ""; });
  $("file-input-2").addEventListener("change", function (e) { if (e.target.files[0]) openFile(e.target.files[0]); e.target.value = ""; });
  $("btn-sound").addEventListener("click", function () {
    settings.sound = !settings.sound; saveSettings();
    if (settings.sound) { initAudio(); if (audio.ctx) audio.ctx.resume(); }
    else if (audio.ctx) { audio.ctx.suspend(); clearAudio(); }
    updateSoundUi(); canvas.focus();
  });
  $("btn-warp").addEventListener("click", function () {
    warp = !warp;
    $("btn-warp").setAttribute("aria-pressed", warp ? "true" : "false");
    clearAudio(); canvas.focus();
  });
  $("btn-save-state").addEventListener("click", function () { saveState(); canvas.focus(); });
  $("btn-load-state").addEventListener("click", function () { loadState(); canvas.focus(); });
  $("btn-paste").addEventListener("click", function () { userGesture(); pasteText(); });
  $("click-hint").addEventListener("click", function () { userGesture(); canvas.focus(); });
  canvas.addEventListener("pointerdown", function () { userGesture(); });

  $("disk-select").addEventListener("change", function (e) {
    media.diskIndex = +e.target.value; remount(); updateMediaUi();
    notice("Disk changed: " + media.disks[media.diskIndex].name, 2500);
    canvas.focus();
  });
  $("disk-eject").addEventListener("click", ejectDisk);
  $("disk-new").addEventListener("click", function () {
    var d = Media.blankDisk("NEW DISK");
    d.name = "new-disk.d64";
    media.disks.push(d); media.diskIndex = media.disks.length - 1;
    remount(); updateMediaUi();
    notice('Blank disk inserted. Save with SAVE"NAME",8 and download it afterwards.', 5000);
  });
  $("disk-download").addEventListener("click", function () {
    var d = media.disks[media.diskIndex];
    if (!d) return;
    var base = d.name.replace(/\.[^.]+$/, "");
    if (d.format === "g64") download(base + ".g64", d.toG64());
    else { if (d.dirty) d.syncFromGcr(); download(base + ".d64", d.dirty ? d.toD64() : d.sectors); }
  });
  $("tape-play").addEventListener("click", function () { c64.tape.play(); canvas.focus(); });
  $("tape-stop").addEventListener("click", function () { c64.tape.stop(); canvas.focus(); });
  $("tape-rewind").addEventListener("click", function () { c64.tape.rewind(); canvas.focus(); });
  $("tape-eject").addEventListener("click", function () { media.tape = null; media.t64 = null; remount(); updateMediaUi(); });
  $("cart-eject").addEventListener("click", function () { media.cart = null; remount(); hardReset(); updateMediaUi(); });

  $("opt-autostart").checked = !!settings.autostart;
  $("opt-autostart").addEventListener("change", function (e) { settings.autostart = e.target.checked; saveSettings(); });
  $("opt-port").value = settings.port;
  $("opt-port").addEventListener("change", function (e) { settings.port = +e.target.value; saveSettings(); updateJoyStatus(); });
  $("opt-keyjoy").value = settings.keyjoy;
  $("opt-keyjoy").addEventListener("change", function (e) { settings.keyjoy = e.target.value; joyKeys = {}; saveSettings(); });
  $("opt-sid").value = settings.sid;
  $("opt-sid").addEventListener("change", function (e) { settings.sid = +e.target.value; c64.sid.setModel(settings.sid); saveSettings(); });
  $("opt-border").value = settings.border;
  $("opt-border").addEventListener("change", function (e) { settings.border = e.target.value; saveSettings(); applyDisplay(); });
  $("opt-smooth").checked = !!settings.smooth;
  $("opt-smooth").addEventListener("change", function (e) { settings.smooth = e.target.checked; saveSettings(); applyDisplay(); });
  $("opt-awake").checked = !!settings.awake;
  $("opt-awake").addEventListener("change", function (e) { settings.awake = e.target.checked; saveSettings(); updateWakeLock(); });
  $("opt-truedrive").checked = !!settings.truedrive;
  $("opt-truedrive").addEventListener("change", function (e) {
    settings.truedrive = e.target.checked; saveSettings();
    buildMachine();
    notice(settings.truedrive && userRoms.dos ? "Real 1541 drive on. The C64 was reset." : "Fast loader on. The C64 was reset.", 3000);
  });
  $("rom-load").addEventListener("click", function () { $("rom-input").click(); });
  $("rom-input").addEventListener("change", function (e) { if (e.target.files.length) loadRomFiles(Array.from(e.target.files)); e.target.value = ""; });
  $("rom-clear").addEventListener("click", function () {
    userRoms = {};
    ["kernal", "basic", "chargen", "dos"].forEach(function (k) { store.del("rom." + k); });
    buildMachine();
    notice("The stored ROMs were removed. The built-in Open ROMs are used.", 4000);
  });

  // drag and drop anywhere on the page
  var dragDepth = 0;
  function isFileDrag(e) { return e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types, "Files") >= 0; }
  document.addEventListener("dragenter", function (e) {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    if (++dragDepth === 1) { monitor.classList.add("dragging"); $("dropzone").classList.add("dragging"); $("drop-hint").hidden = false; }
  });
  document.addEventListener("dragover", function (e) { if (isFileDrag(e)) e.preventDefault(); });
  document.addEventListener("dragleave", function (e) {
    if (!isFileDrag(e)) return;
    if (--dragDepth <= 0) { dragDepth = 0; monitor.classList.remove("dragging"); $("dropzone").classList.remove("dragging"); $("drop-hint").hidden = true; }
  });
  document.addEventListener("drop", function (e) {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    dragDepth = 0; monitor.classList.remove("dragging"); $("dropzone").classList.remove("dragging"); $("drop-hint").hidden = true;
    userGesture();
    var f = e.dataTransfer.files[0];
    if (f) openFile(f);
  });

  // ------------------------------------------------------------------ start
  async function init() {
    var keys = ["kernal", "basic", "chargen", "dos"];
    for (var i = 0; i < keys.length; i++) {
      var v = await store.get("rom." + keys[i]);
      if (v) userRoms[keys[i]] = new Uint8Array(v);
    }
    snapshot = (await store.get("state")) || null;
    $("btn-load-state").disabled = !snapshot;
    initDebugger();
    initSprites();
    initCharset();
    initMusic();
    buildMachine();
    if (settings.debugger) setDebugger(true);
    if (settings.sprites) setSprites(true);
    if (settings.charset) setCharset(true);
    if (settings.music) setMusic(true);
    applyDisplay();
    updateSoundUi();
    updateJoyStatus();
    updatePauseUi();
    $("click-hint").hidden = !settings.sound;
    updateWakeLock();
    requestAnimationFrame(loop);
    var link = new URLSearchParams(location.search).get("file");
    if (link) openUrl(link);
  }
  init();
})();
