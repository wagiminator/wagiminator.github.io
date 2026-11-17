/* SID Player: user interface, audio output and the live views (oscilloscopes, notes, filter,
 * tracker log, registers, spectrum) */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var PSID = window.PSID, Player = window.SIDPlayer;
  var VCOL = ["#ff7a5c", "#4fd68a", "#5aaeff"];
  var NOTE = ["C-", "C#", "D-", "D#", "E-", "F-", "F#", "G-", "G#", "A-", "A#", "B-"];
  var RING = 1 << 17, RMASK = RING - 1;
  var REG_NAMES = ["FREQ LO", "FREQ HI", "PW LO", "PW HI", "CONTROL", "ATK/DEC", "SUS/REL"];

  var st = {
    player: null, list: [], cur: -1, song: 1, playing: false, booting: false,
    gen: 0, ringPos: 0, played: 0, playedAt: 0, queued: 0, sent: 0,
    rings: [], mute: [0, 0, 0], solo: null, chipView: 0, lastTick: -1, lastRegs: [], nextAt: 180,
  };
  var audio = { ctx: null, node: null, gain: null, analyser: null, rate: 44100, target: 0 };

  /* ------------------------------------------------------------------ audio */
  var WORKLET = "class SidOut extends AudioWorkletProcessor{constructor(){super();this.q=[];this.cur=null;this.pos=0;this.g=0;this.n=0;this.t=0;this.idx=0;" +
    "this.port.onmessage=e=>{const m=e.data;if(m.clear){this.q=[];this.cur=null;this.n=0;this.g=m.clear;this.idx=0;return;}if(m.g!==this.g)return;this.q.push(m);this.n+=m.d.length;};}" +
    "process(i,o){const out=o[0][0];for(let k=0;k<out.length;k++){if(!this.cur||this.pos>=this.cur.d.length){this.cur=this.q.shift()||null;this.pos=0;" +
    "if(!this.cur){out.fill(0,k);break;}}this.idx=this.cur.s+this.pos;out[k]=this.cur.d[this.pos++];this.n--;}if(this.n<0)this.n=0;for(let c=1;c<o[0].length;c++)o[0][c].set(out);" +
    "if(++this.t>=6){this.t=0;this.port.postMessage({g:this.g,played:this.idx,queued:this.n});}return true;}}registerProcessor('sid-out',SidOut);";

  function initAudio() {
    if (audio.ctx) return Promise.resolve();
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { message("This browser has no Web Audio.", true); return Promise.reject(new Error("no audio")); }
    var ctx = new AC({ latencyHint: "playback" });
    audio.ctx = ctx;
    audio.rate = ctx.sampleRate;
    audio.target = Math.round(audio.rate * 0.25);
    audio.gain = ctx.createGain();
    audio.gain.gain.value = +$("i-vol").value / 100;
    audio.analyser = ctx.createAnalyser();
    audio.analyser.fftSize = 4096;
    audio.analyser.smoothingTimeConstant = 0.7;
    audio.gain.connect(audio.analyser);
    audio.analyser.connect(ctx.destination);
    // the AudioWorklet; opened as a local file (file://) the browser refuses to load it,
    // then a ScriptProcessor takes over
    if (!ctx.audioWorklet) { scriptOutput(ctx); return Promise.resolve(); }
    var url = URL.createObjectURL(new Blob([WORKLET], { type: "application/javascript" }));
    return ctx.audioWorklet.addModule(url).then(function () {
      var node = new AudioWorkletNode(ctx, "sid-out", { outputChannelCount: [2] });
      node.port.onmessage = onWorklet;
      node.connect(audio.gain);
      audio.node = node;
      audio.post = function (m, tr) { node.port.postMessage(m, tr); };
    }, function () { scriptOutput(ctx); });
  }
  function scriptOutput(ctx) {
    var sp = ctx.createScriptProcessor(2048, 0, 2), q = [], n = 0, g = 0, idx = 0;
    sp.onaudioprocess = function (ev) {
      var l = ev.outputBuffer.getChannelData(0), r = ev.outputBuffer.getChannelData(1), k = 0;
      while (k < l.length && q.length) {
        var c = q[0], m = Math.min(c.d.length - c.pos, l.length - k);
        l.set(c.d.subarray(c.pos, c.pos + m), k);
        c.pos += m; k += m; n -= m; idx = c.s + c.pos;
        if (c.pos >= c.d.length) q.shift();
      }
      if (k < l.length) l.fill(0, k);
      r.set(l);
      onWorklet({ data: { g: g, played: idx, queued: Math.max(0, n) } });
    };
    sp.connect(audio.gain);
    audio.node = sp;
    audio.post = function (m) {
      if (m.clear) { q = []; n = 0; g = m.clear; idx = 0; return; }
      if (m.g !== g) return;
      m.pos = 0; q.push(m); n += m.d.length;
    };
  }
  function onWorklet(e) {
    var m = e.data;
    if (m.g !== st.gen) return;
    st.played = m.played; st.playedAt = performance.now();
    st.queued = m.queued; st.sent = 0;
    feed();
  }
  // keep about a quarter of a second of sound ahead of the speakers
  function feed() {
    if (!st.playing || !st.player || !audio.node) return;
    var guard = 0;
    while (st.queued + st.sent < audio.target && guard++ < 16) {
      var r = st.player.render(1024);
      var n = r.mix.length;
      if (!n) break;
      // keep the single voices for the oscilloscopes
      for (var k = 0; k < r.voices.length; k++) {
        for (var v = 0; v < 3; v++) {
          var ring = st.rings[k][v], src = r.voices[k][v], p = st.ringPos;
          for (var i = 0; i < n; i++) ring[(p + i) & RMASK] = src[i];
        }
      }
      audio.post({ g: st.gen, s: st.ringPos, d: r.mix }, [r.mix.buffer]);
      st.ringPos += n;
      st.sent += n;
    }
  }
  setInterval(feed, 40);
  function clearAudio() {
    st.gen++;
    st.ringPos = 0; st.played = 0; st.playedAt = performance.now(); st.queued = 0; st.sent = 0;
    if (audio.post) audio.post({ clear: st.gen });
  }
  // browsers start the sound only after a click or a key press on the page
  function resumeAudio() {
    var ctx = audio.ctx;
    if (!ctx || ctx.state === "running") return;
    ctx.resume();
    setTimeout(function () {
      if (st.playing && ctx.state !== "running") { st.waitClick = true; message("Click anywhere on the page to start the sound."); }
    }, 300);
  }
  function playedNow() {
    if (!st.playing) return st.played;
    var p = st.played + (performance.now() - st.playedAt) * audio.rate / 1000;
    return Math.min(p, st.ringPos);
  }

  /* ------------------------------------------------------------------ the C64 */
  function ensurePlayer() {
    if (st.player) return Promise.resolve(st.player);
    st.booting = true;
    message("Starting the C64 …");
    return new Promise(function (res) {
      setTimeout(function () {
        st.player = new Player(audio.rate);
        st.player.setModel($("o-model").value);
        st.booting = false;
        message("");
        res(st.player);
      }, 30);
    });
  }

  function startSong(n) {
    var e = st.list[st.cur];
    if (!e) return;
    var t = e.tune;
    st.song = Math.max(1, Math.min(t.songs, n));
    clearAudio();
    st.player.mute = st.mute.slice();
    st.player.start(t, st.song);
    st.rings = t.sidAddr.map(function () { return [new Float32Array(RING), new Float32Array(RING), new Float32Array(RING)]; });
    st.lastTick = -1; st.lastRegs = [];
    if (st.chipView >= t.sidAddr.length) st.chipView = 0;
    buildVoices(t);
    buildRegs(t);
    showTune(t);
    applyMutes();
    st.playing = true;
    resumeAudio();
    updatePlayButton();
    feed();
    mediaSession(t);
  }

  function play(i, song) {
    if (!st.list[i]) return;
    st.cur = i;
    renderList();
    initAudio().then(ensurePlayer).then(function () { startSong(song || st.list[i].tune.startSong); })
      .catch(function (err) { message(err.message || String(err), true); });
  }

  function togglePlay() {
    if (st.cur < 0) { if (st.list.length) play(0); else playDemo(); return; }
    if (!audio.ctx || st.booting) return;
    if (st.playing) { st.playing = false; audio.ctx.suspend(); }
    else { st.playing = true; audio.ctx.resume(); st.playedAt = performance.now(); feed(); }
    updatePlayButton();
  }
  function updatePlayButton() {
    var b = $("b-play");
    b.textContent = st.playing ? "❚❚" : "▶";
    b.setAttribute("aria-label", st.playing ? "Pause" : "Play");
  }
  function nextSong(d) {
    var e = st.list[st.cur];
    if (!e) return;
    var n = st.song + d;
    if (n < 1 || n > e.tune.songs) return;
    startSong(n);
  }
  function nextTune(d) {
    if (!st.list.length) return;
    var i = st.cur + d;
    if (i < 0) i = st.list.length - 1;
    if (i >= st.list.length) i = 0;
    play(i);
  }
  // move on automatically after the chosen time: next song of the tune, then the next tune
  function autoNext() {
    var lim = +$("o-next").value;
    if (!lim || !st.playing || st.cur < 0) return;
    if (playedNow() / audio.rate < lim) return;
    var e = st.list[st.cur];
    if (st.song < e.tune.songs) startSong(st.song + 1);
    else if (st.list.length > 1) nextTune(1);
    else startSong(1);
  }

  /* ------------------------------------------------------------------ files */
  function addFiles(files) {
    var jobs = Array.prototype.map.call(files, function (f) {
      return f.arrayBuffer().then(function (buf) {
        try { return { tune: PSID.parse(new Uint8Array(buf), f.name) }; }
        catch (e) { return { error: f.name + ": " + e.message }; }
      });
    });
    return Promise.all(jobs).then(function (res) {
      var first = -1, errs = [];
      res.forEach(function (r) {
        if (r.error) { errs.push(r.error); return; }
        st.list.push(r);
        if (first < 0) first = st.list.length - 1;
      });
      renderList();
      if (errs.length) message(errs.join(" · "), true);
      if (first >= 0 && (!st.playing || st.cur < 0)) play(first);
    });
  }
  function playDemo() {
    var bin = atob(window.SID_DEMO), d = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) d[i] = bin.charCodeAt(i);
    var idx = st.list.findIndex(function (e) { return e.demo; });
    if (idx < 0) { st.list.push({ tune: PSID.parse(d, "blue-circuit.sid"), demo: true }); idx = st.list.length - 1; }
    play(idx);
  }
  function renderList() {
    var ol = $("playlist");
    ol.innerHTML = "";
    st.list.forEach(function (e, i) {
      var li = document.createElement("li"), t = e.tune;
      if (i === st.cur) li.className = "on";
      li.innerHTML = '<span class="pl-name"></span><span class="pl-sub"></span><button type="button" class="pl-x" aria-label="Remove from the list">✕</button>';
      li.querySelector(".pl-name").textContent = t.name || t.fileName;
      li.querySelector(".pl-sub").textContent = (t.author || "unknown") + (t.songs > 1 ? " · " + t.songs + " songs" : "") + (t.rsid ? " · RSID" : "") + (t.sidAddr.length > 1 ? " · " + t.sidAddr.length + " SIDs" : "");
      li.title = t.fileName;
      li.addEventListener("click", function (ev) {
        if (ev.target.classList.contains("pl-x")) {
          st.list.splice(i, 1);
          if (i === st.cur) { st.cur = -1; st.playing = false; clearAudio(); updatePlayButton(); }
          else if (i < st.cur) st.cur--;
          renderList();
          return;
        }
        play(i);
      });
      ol.appendChild(li);
    });
  }

  /* ------------------------------------------------------------------ tune details */
  function hex(v, n) { return "$" + v.toString(16).toUpperCase().padStart(n || 4, "0"); }
  function showTune(t) {
    $("t-name").textContent = t.name || t.fileName || "Untitled";
    $("t-author").textContent = t.author || "Unknown author";
    $("t-released").textContent = t.released ? "· " + t.released : "";
    var models = ["unknown", "6581", "8580", "6581/8580"], clocks = ["unknown", "PAL", "NTSC", "PAL/NTSC"];
    var items = [
      ["Format", t.format + " v" + t.version],
      ["Clock", clocks[t.clock]],
      ["SID", t.models.map(function (m) { return models[m]; }).join(" + ") + (t.sidAddr.length > 1 ? " (" + t.sidAddr.map(function (a) { return hex(a); }).join(", ") + ")" : "")],
      ["Data", hex(t.load) + "–" + hex(t.end)],
      ["Init", hex(t.init)],
      ["Play", t.play ? hex(t.play) : t.basic ? "BASIC" : "own IRQ"],
      ["Speed", PSID.songUsesCia(t, st.song) ? (t.rsid ? "own timing" : "CIA timer") : "screen (" + (t.clock === 2 ? "60" : "50") + " Hz)"],
    ];
    var ul = $("t-meta");
    ul.innerHTML = "";
    items.forEach(function (it) { var li = document.createElement("li"); li.innerHTML = "<b></b>"; li.firstChild.textContent = it[0]; li.appendChild(document.createTextNode(it[1])); ul.appendChild(li); });
    $("t-song").textContent = "Song " + st.song + " of " + t.songs;
    $("b-prev").disabled = st.song <= 1;
    $("b-next").disabled = st.song >= t.songs;
    document.title = (t.name || "SID Player") + " – SID Player";
  }
  var msgTimer = 0;
  function message(text, err) {
    var m = $("msg");
    m.textContent = text;
    m.hidden = !text;
    m.className = "note" + (err ? " error" : "");
    clearTimeout(msgTimer);
    if (text && err) msgTimer = setTimeout(function () { m.hidden = true; }, 9000);
  }

  /* ------------------------------------------------------------------ voice panels */
  var V = [];   // per chip: { voices: [{el, cv, note, flags, pw, env, adsr}], filter: {...} }
  function buildVoices(t) {
    var area = $("voices");
    area.innerHTML = "";
    V = [];
    t.sidAddr.forEach(function (addr, k) {
      if (t.sidAddr.length > 1) {
        var lab = document.createElement("p");
        lab.className = "chip-label";
        lab.textContent = "SID " + (k + 1) + " at " + hex(addr);
        area.appendChild(lab);
      }
      var row = document.createElement("div");
      row.className = "chip-row";
      var chip = { voices: [] };
      for (var v = 0; v < 3; v++) {
        var el = document.createElement("div");
        el.className = "voice";
        el.style.setProperty("--vc", VCOL[v]);
        el.innerHTML =
          '<div class="v-head"><span class="v-dot"></span><span class="v-title">Voice ' + (k * 3 + v + 1) + '</span>' +
          '<button type="button" class="v-btn" data-act="mute" aria-pressed="false" title="Mute">M</button>' +
          '<button type="button" class="v-btn" data-act="solo" aria-pressed="false" title="Solo">S</button>' +
          '<span class="v-note">---</span></div>' +
          '<canvas aria-label="Oscilloscope of voice ' + (k * 3 + v + 1) + '"></canvas>' +
          '<div class="v-flags"><span>TRI</span><span>SAW</span><span>PUL</span><span>NOI</span><span>GATE</span><span>SYNC</span><span>RING</span><span>TEST</span><span>FILT</span></div>' +
          '<div class="v-meters"><b>PW</b><span class="bar"><i></i></span><span class="pwv">000</span>' +
          '<b>ENV</b><span class="bar"><i></i></span><span class="adsr">0000</span></div>';
        (function (kk, vv) {
          el.querySelector('[data-act="mute"]').addEventListener("click", function () { toggleMute(kk, vv); });
          el.querySelector('[data-act="solo"]').addEventListener("click", function () { toggleSolo(kk, vv); });
        })(k, v);
        row.appendChild(el);
        chip.voices.push({
          el: el, cv: el.querySelector("canvas"), note: el.querySelector(".v-note"),
          flags: el.querySelectorAll(".v-flags span"), pw: el.querySelectorAll(".bar i")[0], env: el.querySelectorAll(".bar i")[1],
          pwv: el.querySelector(".pwv"), adsr: el.querySelector(".adsr"), mute: el.querySelector('[data-act="mute"]'), solo: el.querySelector('[data-act="solo"]'),
          trig: 0,
        });
      }
      area.appendChild(row);
      var f = document.createElement("div");
      f.className = "filter-row";
      f.innerHTML = '<span class="f-item"><b>FILTER</b><span class="bar"><i></i></span><span class="fc">000</span></span>' +
        '<span class="f-item"><b>RES</b><span class="res">0</span></span>' +
        '<span class="f-item"><span class="tag">LP</span><span class="tag">BP</span><span class="tag">HP</span><span class="tag">3OFF</span></span>' +
        '<span class="f-item"><b>VOL</b><span class="bar"><i></i></span><span class="vol">0</span></span>';
      area.appendChild(f);
      chip.filter = { fc: f.querySelector(".fc"), bar: f.querySelectorAll(".bar i")[0], res: f.querySelector(".res"), tags: f.querySelectorAll(".tag"), vbar: f.querySelectorAll(".bar i")[1], vol: f.querySelector(".vol") };
      V.push(chip);
    });
    sizeCanvases();
    // chip selector of the tracker log
    var sel = $("chip-sel");
    sel.innerHTML = "";
    if (t.sidAddr.length > 1) {
      t.sidAddr.forEach(function (a, k) {
        var b = document.createElement("button");
        b.type = "button"; b.textContent = "SID " + (k + 1);
        b.setAttribute("aria-pressed", k === st.chipView ? "true" : "false");
        b.addEventListener("click", function () { st.chipView = k; Array.prototype.forEach.call(sel.children, function (x, j) { x.setAttribute("aria-pressed", j === k ? "true" : "false"); }); st.lastTick = -1; });
        sel.appendChild(b);
      });
    }
  }
  function sizeCanvases() {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    V.forEach(function (chip) {
      chip.voices.forEach(function (o) {
        var w = o.cv.clientWidth, h = o.cv.clientHeight;
        o.cv.width = Math.max(100, Math.round(w * dpr)); o.cv.height = Math.max(60, Math.round(h * dpr));
        o.ctx = o.cv.getContext("2d");
      });
    });
    [$("keys"), $("spec")].forEach(function (c) {
      c.width = Math.round(c.clientWidth * dpr);
      c.height = Math.round(c.clientWidth * dpr * (c.id === "keys" ? 0.075 : 0.27));
    });
  }
  window.addEventListener("resize", sizeCanvases);

  // ---- mute and solo
  function toggleMute(k, v) {
    st.solo = null;
    st.mute[k] ^= 1 << v;
    applyMutes();
  }
  function toggleSolo(k, v) {
    if (st.solo && st.solo[0] === k && st.solo[1] === v) { st.solo = null; st.mute = [0, 0, 0]; }
    else { st.solo = [k, v]; st.mute = [7, 7, 7]; st.mute[k] = 7 & ~(1 << v); }
    applyMutes();
  }
  function applyMutes() {
    if (st.player) for (var k = 0; k < st.player.sids.length; k++) st.player.setMute(k, st.mute[k]);
    V.forEach(function (chip, k) {
      chip.voices.forEach(function (o, v) {
        var m = !!(st.mute[k] & (1 << v));
        o.mute.setAttribute("aria-pressed", m && !st.solo ? "true" : "false");
        o.solo.setAttribute("aria-pressed", st.solo && st.solo[0] === k && st.solo[1] === v ? "true" : "false");
        o.el.classList.toggle("muted", m);
      });
    });
  }

  /* ------------------------------------------------------------------ live views */
  function noteOf(freq, clock) {
    if (!freq) return null;
    var hz = freq * clock / 16777216;
    var m = 12 * Math.log2(hz / 440) + 69, r = Math.round(m);
    if (r < 0 || r > 127) return null;
    return { name: NOTE[r % 12] + (Math.floor(r / 12) - 1), midi: r, cents: Math.round((m - r) * 100), hz: hz };
  }
  // the tick that belongs to what is heard right now
  function currentTick(pos) {
    var h = st.player.history, lo = 0, hi = h.length - 1, best = -1;
    while (lo <= hi) {
      var mid = (lo + hi) >> 1;
      if (h[mid].sample <= pos) { best = mid; lo = mid + 1; } else hi = mid - 1;
    }
    return best;
  }

  function drawScope(o, ring, pos, freqHz, colour) {
    var ctx = o.ctx, w = o.cv.width, h = o.cv.height;
    ctx.fillStyle = "#0d1220";
    ctx.fillRect(0, 0, w, h);
    // grid
    ctx.strokeStyle = "#1c2438"; ctx.lineWidth = 1;
    ctx.beginPath();
    for (var gx = 1; gx < 8; gx++) { var x = Math.round(gx * w / 8) + 0.5; ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (var gy = 1; gy < 4; gy++) { var y = Math.round(gy * h / 4) + 0.5; ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();
    // a window of about three periods, triggered on a rising edge
    var rate = audio.rate;
    var per = freqHz > 15 ? rate / freqHz : 512;
    var win = Math.max(220, Math.min(2400, Math.round(per * 3)));
    var end = Math.floor(pos) - 2, start = end - win, look = Math.min(RING / 4, Math.round(Math.max(per * 2, 256)));
    var trig = -1;
    for (var s = start; s > start - look; s--) {
      var a = ring[(s - 1) & RMASK], b = ring[s & RMASK];
      if (a < 0 && b >= 0) { trig = s; break; }
    }
    if (trig < 0) trig = start;
    if (trig < 0) return;
    var mid = h / 2, amp = h * 0.44;
    ctx.lineJoin = "round";
    for (var pass = 0; pass < 2; pass++) {
      ctx.beginPath();
      var step = win / w;
      for (var px = 0; px <= w; px++) {
        var v = ring[(trig + Math.floor(px * step)) & RMASK];
        var yy = mid - v * amp;
        if (px === 0) ctx.moveTo(px, yy); else ctx.lineTo(px, yy);
      }
      if (pass === 0) { ctx.strokeStyle = colour; ctx.globalAlpha = 0.18; ctx.lineWidth = 6 * (w / o.cv.clientWidth); }
      else { ctx.strokeStyle = colour; ctx.globalAlpha = 1; ctx.lineWidth = 1.6 * (w / o.cv.clientWidth); }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  var lastDom = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    var p = st.player;
    if (!p || st.cur < 0) return;
    var t = st.list[st.cur] && st.list[st.cur].tune;
    if (!t) return;
    var pos = playedNow();
    var ti = currentTick(pos), tick = ti >= 0 ? p.history[ti] : null;
    // oscilloscopes, every frame
    for (var k = 0; k < V.length; k++) {
      for (var v = 0; v < 3; v++) {
        var o = V[k].voices[v], regs = tick ? tick.regs[k] : null;
        var fr = regs ? regs[v * 7] | (regs[v * 7 + 1] << 8) : 0;
        var hz = fr * p.clock / 16777216;
        if (st.rings[k]) drawScope(o, st.rings[k][v], pos, hz, VCOL[v]);
      }
    }
    drawSpectrum();
    // the rest about 30 times a second
    if (now - lastDom < 30) return;
    lastDom = now;
    $("t-time").textContent = fmtTime(pos / audio.rate);
    if (tick) {
      updateVoices(tick, p);
      drawKeys(tick, p);
      if (tick.n !== st.lastTick) { updateTracker(ti, p); updateRegs(tick); st.lastTick = tick.n; }
    }
    autoNext();
  }
  function fmtTime(s) { s = Math.floor(s); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }

  var WAVE_BITS = [0x10, 0x20, 0x40, 0x80];
  function updateVoices(tick, p) {
    for (var k = 0; k < V.length; k++) {
      var r = tick.regs[k], chip = V[k];
      for (var v = 0; v < 3; v++) {
        var o = chip.voices[v], b = v * 7;
        var fr = r[b] | (r[b + 1] << 8), ctrl = r[b + 4], pw = r[b + 2] | ((r[b + 3] & 15) << 8), env = r[25 + v];
        var nt = noteOf(fr, p.clock);
        o.note.textContent = nt && (ctrl & 0xF0) && env > 0 ? nt.name : "---";
        var f = o.flags;
        for (var i = 0; i < 4; i++) f[i].classList.toggle("on", !!(ctrl & WAVE_BITS[i]));
        f[4].classList.toggle("on", !!(ctrl & 1));
        f[5].classList.toggle("on", !!(ctrl & 2));
        f[6].classList.toggle("on", !!(ctrl & 4));
        f[7].classList.toggle("on", !!(ctrl & 8));
        f[8].classList.toggle("on", !!(r[23] & (1 << v)));
        o.pw.style.width = (pw / 40.95).toFixed(1) + "%";
        o.pwv.textContent = pw.toString(16).toUpperCase().padStart(3, "0");
        o.env.style.width = (env / 2.55).toFixed(1) + "%";
        o.adsr.textContent = (r[b + 5].toString(16) + r[b + 6].toString(16).padStart(2, "0")).toUpperCase().padStart(4, "0");
      }
      var fl = chip.filter, fc = (r[21] & 7) | (r[22] << 3);
      fl.fc.textContent = fc.toString(16).toUpperCase().padStart(3, "0");
      fl.bar.style.width = (fc / 20.47).toFixed(1) + "%";
      fl.res.textContent = (r[23] >> 4).toString(16).toUpperCase();
      fl.tags[0].classList.toggle("on", !!(r[24] & 0x10));
      fl.tags[1].classList.toggle("on", !!(r[24] & 0x20));
      fl.tags[2].classList.toggle("on", !!(r[24] & 0x40));
      fl.tags[3].classList.toggle("on", !!(r[24] & 0x80));
      fl.vol.textContent = r[24] & 15;
      fl.vbar.style.width = ((r[24] & 15) / 0.15).toFixed(1) + "%";
    }
  }

  // keyboard: C0 to B7
  var IS_BLACK = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0];
  function drawKeys(tick, p) {
    var c = $("keys"), ctx = c.getContext("2d"), w = c.width, h = c.height;
    var lo = 12, hi = 107, whites = 0, m;
    for (m = lo; m <= hi; m++) if (!IS_BLACK[m % 12]) whites++;
    var ww = w / whites;
    var on = {};
    for (var k = 0; k < tick.regs.length; k++) {
      var r = tick.regs[k];
      for (var v = 0; v < 3; v++) {
        var b = v * 7, env = r[25 + v];
        if (!(r[b + 4] & 0xF0) || env < 4) continue;
        var nt = noteOf(r[b] | (r[b + 1] << 8), p.clock);
        if (nt && nt.midi >= lo && nt.midi <= hi && !(st.mute[k] & (1 << v))) on[nt.midi] = { c: VCOL[v], a: 0.35 + 0.65 * env / 255 };
      }
    }
    ctx.fillStyle = "#0d1220"; ctx.fillRect(0, 0, w, h);
    var x = 0, pos = {};
    for (m = lo; m <= hi; m++) {
      if (IS_BLACK[m % 12]) { pos[m] = x - ww * 0.3; continue; }
      ctx.fillStyle = "#e9edf6"; ctx.fillRect(x + 1, 0, ww - 2, h);
      if (on[m]) { ctx.globalAlpha = on[m].a; ctx.fillStyle = on[m].c; ctx.fillRect(x + 1, 0, ww - 2, h); ctx.globalAlpha = 1; }
      if (m % 12 === 0) { ctx.fillStyle = "#8590ad"; ctx.font = Math.round(h * 0.18) + "px sans-serif"; ctx.textAlign = "center"; ctx.fillText("C" + (m / 12 - 1), x + ww / 2, h * 0.92); }
      x += ww;
    }
    for (m = lo; m <= hi; m++) {
      if (!IS_BLACK[m % 12]) continue;
      ctx.fillStyle = "#151b2b"; ctx.fillRect(pos[m], 0, ww * 0.6, h * 0.6);
      if (on[m]) { ctx.globalAlpha = on[m].a; ctx.fillStyle = on[m].c; ctx.fillRect(pos[m], 0, ww * 0.6, h * 0.6); ctx.globalAlpha = 1; }
    }
  }

  // tracker log: rows of ticks around the current one
  function updateTracker(ti, p) {
    var h = p.history, k = st.chipView, out = [];
    var head = " TICK │ NOTE WF ADSR  PW │ NOTE WF ADSR  PW │ NOTE WF ADSR  PW │ CUT RT MV";
    out.push('<div class="th">' + head + "</div>");
    for (var i = ti - 10; i <= ti + 9; i++) {
      if (i < 0 || i >= h.length) { out.push("<div> </div>"); continue; }
      var cur = h[i].regs[k], prev = i > 0 ? h[i - 1].regs[k] : null, row = String(h[i].n).padStart(5, " ") + " │";
      for (var v = 0; v < 3; v++) {
        var b = v * 7, ctrl = cur[b + 4];
        var rose = h[i].gates[k] & (1 << v), fr = cur[b] | (cur[b + 1] << 8);
        var noteTxt;
        if (rose) { var nt = noteOf(fr, p.clock); noteTxt = '<span class="n' + (v + 1) + '">' + (nt ? nt.name.padEnd(4) : "????") + "</span>"; }
        else if (prev && (prev[b + 4] & 1) && !(ctrl & 1)) noteTxt = "=== ";
        else noteTxt = '<span class="dim">... </span>';
        var wf = !prev || prev[b + 4] !== ctrl ? ctrl.toString(16).toUpperCase().padStart(2, "0") : '<span class="dim">..</span>';
        var ad = !prev || prev[b + 5] !== cur[b + 5] || prev[b + 6] !== cur[b + 6] ? (cur[b + 5].toString(16) + cur[b + 6].toString(16).padStart(2, "0")).toUpperCase().padStart(4, "0") : '<span class="dim">....</span>';
        var pw = (cur[b + 2] | ((cur[b + 3] & 15) << 8)), ppw = prev ? (prev[b + 2] | ((prev[b + 3] & 15) << 8)) : -1;
        var pwt = pw !== ppw ? pw.toString(16).toUpperCase().padStart(3, "0") : '<span class="dim">...</span>';
        row += " " + noteTxt + " " + wf + " " + ad + " " + pwt + " │";
      }
      var fc = (cur[21] & 7) | (cur[22] << 3), pfc = prev ? (prev[21] & 7) | (prev[22] << 3) : -1;
      row += " " + (fc !== pfc ? fc.toString(16).toUpperCase().padStart(3, "0") : '<span class="dim">...</span>');
      row += " " + (!prev || prev[23] !== cur[23] ? cur[23].toString(16).toUpperCase().padStart(2, "0") : '<span class="dim">..</span>');
      row += " " + (!prev || prev[24] !== cur[24] ? cur[24].toString(16).toUpperCase().padStart(2, "0") : '<span class="dim">..</span>');
      out.push('<div' + (i === ti ? ' class="cur"' : "") + ">" + row + "</div>");
    }
    $("tracker").innerHTML = out.join("");
  }

  // register table
  var REG_CELLS = [];
  function buildRegs(t) {
    var box = $("regs");
    box.innerHTML = "";
    REG_CELLS = [];
    t.sidAddr.forEach(function (addr, k) {
      var wrap = document.createElement("div");
      wrap.className = "reg-chip";
      if (t.sidAddr.length > 1) { var h4 = document.createElement("h4"); h4.textContent = "SID " + (k + 1) + " at " + hex(addr); wrap.appendChild(h4); }
      var g = document.createElement("div");
      g.className = "reg-grid";
      var cells = [];
      for (var r = 0; r < 25; r++) {
        var name = r < 21 ? "V" + ((r / 7 | 0) + 1) + " " + REG_NAMES[r % 7] : ["FC LO", "FC HI", "RES/FILT", "MODE/VOL"][r - 21];
        var a = document.createElement("span"); a.className = "ra"; a.textContent = hex(addr + r).slice(1);
        var val = document.createElement("span"); val.className = "rv"; val.textContent = "00";
        var n = document.createElement("span"); n.className = "rn"; n.textContent = name;
        g.appendChild(a); g.appendChild(val); g.appendChild(n);
        if (r % 2 === 0 && r !== 24) { /* two registers per line */ }
        cells.push(val);
      }
      g.style.gridTemplateColumns = "auto auto 1fr";
      wrap.appendChild(g);
      box.appendChild(wrap);
      REG_CELLS.push(cells);
    });
  }
  function updateRegs(tick) {
    for (var k = 0; k < REG_CELLS.length; k++) {
      var r = tick.regs[k], last = st.lastRegs[k], cells = REG_CELLS[k];
      for (var i = 0; i < 25; i++) {
        var v = r[i];
        if (last && last[i] === v) { cells[i].classList.remove("chg"); continue; }
        cells[i].textContent = v.toString(16).toUpperCase().padStart(2, "0");
        if (last) { cells[i].classList.add("chg"); }
      }
      st.lastRegs[k] = r;
    }
  }

  var specData = null;
  function drawSpectrum() {
    if (!audio.analyser) return;
    var c = $("spec"), ctx = c.getContext("2d"), w = c.width, h = c.height;
    if (!specData) specData = new Uint8Array(audio.analyser.frequencyBinCount);
    audio.analyser.getByteFrequencyData(specData);
    ctx.fillStyle = "#0d1220"; ctx.fillRect(0, 0, w, h);
    var bars = 96, fmin = 30, fmax = Math.min(16000, audio.rate / 2), bw = w / bars;
    var binHz = audio.rate / audio.analyser.fftSize;
    var g = ctx.createLinearGradient(0, h, 0, 0);
    g.addColorStop(0, "#5aaeff"); g.addColorStop(0.6, "#4fd68a"); g.addColorStop(1, "#ff7a5c");
    ctx.fillStyle = g;
    for (var i = 0; i < bars; i++) {
      var f0 = fmin * Math.pow(fmax / fmin, i / bars), f1 = fmin * Math.pow(fmax / fmin, (i + 1) / bars);
      var b0 = Math.floor(f0 / binHz), b1 = Math.max(b0 + 1, Math.floor(f1 / binHz)), m = 0;
      for (var b = b0; b < b1 && b < specData.length; b++) if (specData[b] > m) m = specData[b];
      var bh = (m / 255) * h;
      ctx.fillRect(i * bw + 1, h - bh, bw - 2, bh);
    }
    ctx.fillStyle = "#8590ad"; ctx.font = Math.round(h * 0.08) + "px sans-serif";
    [100, 1000, 10000].forEach(function (f) {
      var x = Math.log(f / fmin) / Math.log(fmax / fmin) * w;
      ctx.fillText(f >= 1000 ? f / 1000 + " kHz" : f + " Hz", x + 6, h * 0.12);
      ctx.fillRect(x, 0, 1, h);
    });
  }

  /* ------------------------------------------------------------------ WAV export */
  function saveWav() {
    var e = st.list[st.cur];
    if (!e) { message("Play a tune first.", true); return; }
    var secs = +$("o-wavlen").value, rate = 44100;
    var btn = $("b-wav"), bar = $("wav-progress");
    btn.disabled = true; bar.hidden = false; bar.value = 0;
    message("Rendering the WAV file …");
    setTimeout(function () {
      var pl = new Player(rate);
      pl.setModel($("o-model").value);
      pl.mute = st.mute.slice();
      pl.start(e.tune, st.song);
      var total = secs * rate, pcm = new Int16Array(total), done = 0;
      (function chunk() {
        var t0 = performance.now();
        while (done < total && performance.now() - t0 < 40) {
          var r = pl.render(Math.min(4096, total - done)).mix;
          for (var i = 0; i < r.length && done < total; i++) pcm[done++] = Math.max(-32767, Math.min(32767, Math.round(r[i] * 32000)));
        }
        bar.value = done / total;
        if (done < total) { setTimeout(chunk, 0); return; }
        var blob = wavBlob(pcm, rate);
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = ((e.tune.name || e.tune.fileName || "tune").replace(/[^\w\- ]+/g, "").trim() || "tune") + (e.tune.songs > 1 ? " - song " + st.song : "") + ".wav";
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 10000);
        btn.disabled = false; bar.hidden = true;
        message("");
      })();
    }, 30);
  }
  function wavBlob(pcm, rate) {
    var head = new DataView(new ArrayBuffer(44));
    var w = function (o, s) { for (var i = 0; i < s.length; i++) head.setUint8(o + i, s.charCodeAt(i)); };
    w(0, "RIFF"); head.setUint32(4, 36 + pcm.length * 2, true); w(8, "WAVEfmt ");
    head.setUint32(16, 16, true); head.setUint16(20, 1, true); head.setUint16(22, 1, true);
    head.setUint32(24, rate, true); head.setUint32(28, rate * 2, true); head.setUint16(32, 2, true); head.setUint16(34, 16, true);
    w(36, "data"); head.setUint32(40, pcm.length * 2, true);
    return new Blob([head.buffer, pcm.buffer], { type: "audio/wav" });
  }

  /* ------------------------------------------------------------------ media keys */
  function mediaSession(t) {
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ title: t.name || t.fileName, artist: t.author, album: t.released });
      navigator.mediaSession.setActionHandler("play", function () { if (!st.playing) togglePlay(); });
      navigator.mediaSession.setActionHandler("pause", function () { if (st.playing) togglePlay(); });
      navigator.mediaSession.setActionHandler("nexttrack", function () { nextTune(1); });
      navigator.mediaSession.setActionHandler("previoustrack", function () { nextTune(-1); });
    } catch (e) { /* not supported */ }
  }

  /* ------------------------------------------------------------------ wiring */
  $("b-play").addEventListener("click", togglePlay);
  $("b-prev").addEventListener("click", function () { nextSong(-1); });
  $("b-next").addEventListener("click", function () { nextSong(1); });
  $("b-prevtune").addEventListener("click", function () { nextTune(-1); });
  $("b-nexttune").addEventListener("click", function () { nextTune(1); });
  $("b-restart").addEventListener("click", function () { if (st.cur >= 0 && st.player) startSong(st.song); });
  $("b-demo").addEventListener("click", playDemo);
  $("b-wav").addEventListener("click", saveWav);
  $("i-vol").addEventListener("input", function (e) { if (audio.gain) audio.gain.gain.value = +e.target.value / 100; });
  $("o-model").addEventListener("change", function (e) { if (st.player) st.player.setModel(e.target.value); });
  $("file").addEventListener("change", function (e) { initAudio(); addFiles(e.target.files); e.target.value = ""; });
  var drop = $("drop");
  ["dragenter", "dragover"].forEach(function (ev) { document.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
  ["dragleave", "drop"].forEach(function (ev) { document.addEventListener(ev, function (e) { e.preventDefault(); if (ev === "drop" || e.target === document.documentElement) drop.classList.remove("over"); }); });
  document.addEventListener("drop", function (e) {
    var fs = e.dataTransfer && e.dataTransfer.files;
    if (fs && fs.length) { initAudio(); addFiles(fs); }
  });
  document.addEventListener("keydown", function (e) {
    if (e.target.closest("input, select, textarea") || e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key;
    if (k === " ") { e.preventDefault(); togglePlay(); }
    else if (k === "ArrowLeft") { e.preventDefault(); nextSong(-1); }
    else if (k === "ArrowRight") { e.preventDefault(); nextSong(1); }
    else if (k === "ArrowUp") { e.preventDefault(); nextTune(-1); }
    else if (k === "ArrowDown") { e.preventDefault(); nextTune(1); }
    else if (k === "0") { st.solo = null; st.mute = [0, 0, 0]; applyMutes(); }
    else if (k >= "1" && k <= "9") { var n = +k - 1; if (n < V.length * 3) toggleMute((n / 3) | 0, n % 3); }
  });
  ["pointerdown", "keydown"].forEach(function (ev) {
    document.addEventListener(ev, function () {
      if (audio.ctx && audio.ctx.state === "suspended" && st.playing) {
        audio.ctx.resume().then(function () { if (st.waitClick) { st.waitClick = false; message(""); } });
      }
    }, true);
  });
  requestAnimationFrame(frame);
})();
