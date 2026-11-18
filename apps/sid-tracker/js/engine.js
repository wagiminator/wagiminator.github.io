/* C64 SID Tracker: the sound. The song runs as C64 machine code in an emulated C64 (the
 * engine of the C64 SID Player), so what you hear is what the exported files play.
 * Changes made while the song plays are put in at the next row, and the notes that sound
 * go on. */
(function (global) {
  "use strict";

  var B = global.TrackerBuild, Player = global.SIDPlayer;
  var TRAP = 0xFFF0, RING = 1 << 16, RMASK = RING - 1;
  // variables of the player that make up the sound of a voice, kept when the song changes
  var SOUND = ["ins", "base", "gate", "wave", "wval", "wabs", "arp", "arpc", "slo", "shi", "pwlo", "pwhi", "pdir",
    "vdel", "vspd", "vdep", "vph", "vsp2", "voffl", "voffh", "vstl", "vsth", "ad", "sr", "cmd", "par"];
  var GLOBAL = ["mvol", "fcut", "fswp", "fres", "ftyp", "froute"];

  var WORKLET = "class TrkOut extends AudioWorkletProcessor{constructor(){super();this.q=[];this.cur=null;this.pos=0;this.g=0;this.t=0;this.idx=0;" +
    "this.port.onmessage=e=>{const m=e.data;if(m.clear){this.q=[];this.cur=null;this.g=m.clear;this.idx=0;return;}if(m.g!==this.g)return;this.q.push(m);};}" +
    "process(i,o){const out=o[0][0];for(let k=0;k<out.length;k++){if(!this.cur||this.pos>=this.cur.d.length){this.cur=this.q.shift()||null;this.pos=0;" +
    "if(!this.cur){out.fill(0,k);break;}}this.idx=this.cur.s+this.pos;out[k]=this.cur.d[this.pos++];}for(let c=1;c<o[0].length;c++)o[0][c].set(out);" +
    "if(++this.t>=4){this.t=0;this.port.postMessage({g:this.g,played:this.idx});}return true;}}registerProcessor('trk-out',TrkOut);";

  var E = {
    ctx: null, post: null, node: null, gain: null, rate: 44100, target: 0,
    player: null, build: null, song: null, mode: "off", opts: null,
    gen: 0, ringPos: 0, ringBase: 0, played: 0, playedAt: 0,
    rings: [new Float32Array(RING), new Float32Array(RING), new Float32Array(RING)],
    jobs: [], reloadWanted: false, jamDirty: true, lastJam: 0, mute: 0, model: 6581, volume: 0.8,
    onError: function () {}, onStop: function () {}
  };

  // ---------------------------------------------------------------- audio output
  function initAudio() {
    if (E.ctx) return Promise.resolve();
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return Promise.reject(new Error("This browser has no Web Audio."));
    var ctx = new AC({ latencyHint: "interactive" });
    E.ctx = ctx; E.rate = ctx.sampleRate;
    E.target = Math.round(E.rate * 0.09);
    E.gain = ctx.createGain();
    E.gain.gain.value = E.volume;
    E.gain.connect(ctx.destination);
    // opened as a local file (file://) the browser refuses the worklet: a ScriptProcessor plays
    if (!ctx.audioWorklet) { scriptOutput(ctx); return Promise.resolve(); }
    var url = URL.createObjectURL(new Blob([WORKLET], { type: "application/javascript" }));
    return ctx.audioWorklet.addModule(url).then(function () {
      var node = new AudioWorkletNode(ctx, "trk-out", { outputChannelCount: [2] });
      node.port.onmessage = onPlayed;
      node.connect(E.gain);
      E.node = node;
      E.post = function (m, tr) { node.port.postMessage(m, tr); };
    }, function () { scriptOutput(ctx); });
  }
  function scriptOutput(ctx) {
    var sp = ctx.createScriptProcessor(1024, 0, 2), q = [], g = 0, idx = 0;
    E.target = Math.round(E.rate * 0.12);
    sp.onaudioprocess = function (ev) {
      var l = ev.outputBuffer.getChannelData(0), r = ev.outputBuffer.getChannelData(1), k = 0;
      while (k < l.length && q.length) {
        var c = q[0], m = Math.min(c.d.length - c.pos, l.length - k);
        l.set(c.d.subarray(c.pos, c.pos + m), k);
        c.pos += m; k += m; idx = c.s + c.pos;
        if (c.pos >= c.d.length) q.shift();
      }
      if (k < l.length) l.fill(0, k);
      r.set(l);
      onPlayed({ data: { g: g, played: idx } });
    };
    sp.connect(E.gain);
    E.node = sp;
    E.post = function (m) {
      if (m.clear) { q = []; g = m.clear; idx = 0; return; }
      if (m.g !== g) return;
      m.pos = 0; q.push(m);
    };
  }
  function onPlayed(e) {
    var m = e.data;
    if (m.g !== E.gen) return;
    E.played = m.played; E.playedAt = performance.now();
    feed();
  }
  function clearAudio() {
    E.gen++;
    E.ringPos = 0; E.played = 0; E.playedAt = performance.now();
    if (E.post) E.post({ clear: E.gen });
  }
  function playedNow() {
    var p = E.played + (performance.now() - E.playedAt) * E.rate / 1000;
    return Math.min(p, E.ringPos);
  }

  // keep a little sound ahead of the speakers (short, so notes played by key come quickly)
  function feed() {
    if (E.mode === "off" || !E.player || !E.post) return;
    var ahead = E.ringPos - E.played, guard = 0;
    while (ahead < E.target && guard++ < 12) {
      doJobs();
      var r = E.player.render(256);
      var n = r.mix.length;
      if (!n) break;
      var vs = r.voices[0];
      for (var v = 0; v < 3; v++) {
        var ring = E.rings[v], src = vs[v], p = E.ringPos;
        for (var i = 0; i < n; i++) ring[(p + i) & RMASK] = src[i];
      }
      E.post({ g: E.gen, s: E.ringPos, d: r.mix }, [r.mix.buffer]);
      E.ringPos += n; ahead += n;
    }
    // notes played by key: stop after a while without notes
    if (E.mode === "jam" && performance.now() - E.lastJam > 12000) stop();
  }
  setInterval(feed, 20);

  // ---------------------------------------------------------------- the C64
  function ensurePlayer() {
    if (E.player) return Promise.resolve(E.player);
    return new Promise(function (res) {
      setTimeout(function () {
        var p = new Player(E.rate);
        p.setModel(E.model);
        // each tick remembers where the song is, for the pattern view
        var tick = p.tick;
        p.tick = function () {
          tick.call(this);
          var h = this.history[this.history.length - 1], b = E.build;
          if (b && h) {
            var ram = this.c64.ram, L = b.labels;
            h.pos = b.byteToPos[0][ram[L.vpos]]; h.row = ram[L.vrow];
            h.on = ram[L.songon];
          }
        };
        p.maxHistory = 800;
        E.player = p;
        res(p);
      }, 20);
    });
  }
  function tuneOf(b, song) {
    return { data: b.bytes, load: b.load, init: b.init, play: b.play, songs: 1, startSong: 1, speed: song.multi > 1 ? 1 : 0,
      clock: 1, models: [song.model === 8580 ? 2 : 1], sidAddr: [0xD400], rsid: false, basic: false, end: b.end };
  }
  function runToTrap() {
    var p = E.player, n = 0;
    while (p.c64.cpu.pc !== TRAP && n++ < 4000) p.runCycles(16);
  }
  // call a routine of the player from the idle loop, with A, X and Y
  function exec(addr, a, x, y) {
    runToTrap();
    var p = E.player, c = p.c64.cpu;
    p.call(addr, a || 0);
    c.x = x || 0; c.y = y || 0;
    runToTrap();
  }
  function begin(song, opts, mode) {
    var p = E.player;
    var b = B.build(song, opts);
    E.build = b; E.song = song; E.opts = opts; E.mode = mode;
    clearAudio();
    p.setModel(E.model);
    p.start(tuneOf(b, song), 1);
    p.setMute(0, E.mute);
    E.ringBase = E.ringPos;
    E.reloadWanted = false; E.jamDirty = false;
    if (E.ctx.state !== "running") E.ctx.resume();
    feed();
  }
  function stop() {
    if (E.mode === "off") return;
    E.mode = "off"; E.jobs = [];
    clearAudio();
    if (E.ctx && E.ctx.state === "running") E.ctx.suspend();
    E.onStop();
  }
  function doJobs() {
    if (E.reloadWanted && E.mode !== "jam") reload();
    while (E.jobs.length) {
      var j = E.jobs.shift();
      exec(E.build.jam, j[0], j[1], j[2]);
    }
  }

  // the song changed while it plays: at the start of the next row, put in the new song and
  // carry on with the sound of the voices
  function reload() {
    var p = E.player, ram = p.c64.ram, b = E.build, L = b.labels, song = E.song;
    if (p.c64.cpu.pc !== TRAP || ram[L.tick] !== 0 || !ram[L.songon]) return;
    E.reloadWanted = false;
    var pos = b.byteToPos[0][ram[L.vpos]], row = ram[L.vrow] + 1;
    var pattern = E.opts.pattern != null;
    if (pattern) pos = E.opts.pattern;
    if (pos == null || pos >= song.order.length) { pos = 0; row = 0; }
    if (row >= song.rows) {
      row = 0;
      if (!pattern) pos = pos + 1 < song.order.length ? pos + 1 : song.loop;
    }
    var keep = {};
    SOUND.concat(GLOBAL).forEach(function (n) { keep[n] = [ram[L[n]], ram[L[n] + 1], ram[L[n] + 2]]; });
    var wpos = [ram[L.wpos], ram[L.wpos + 1], ram[L.wpos + 2]];
    var opts = { start: pos, row: row, speed: B.speedAt(song, pos, 0), keep: true };
    if (pattern) { opts.pattern = pos; opts.start = 0; }
    var nb;
    try { nb = B.build(song, opts); } catch (e) { E.onError(e); return; }
    if (nb.load !== b.load) { begin(song, opts, E.mode); return; }
    ram.set(nb.bytes, nb.load);
    E.build = nb;
    exec(nb.init, 0);
    var NL = nb.labels;
    SOUND.forEach(function (n) { for (var v = 0; v < 3; v++) ram[NL[n] + v] = keep[n][v]; });
    GLOBAL.forEach(function (n) { ram[NL[n]] = keep[n][0]; });
    // the wave program goes on at the same step, if the instrument still has it
    for (var v = 0; v < 3; v++) {
      var w = wpos[v], ins = keep.ins[v], nw = 0xFF;
      if (w !== 0xFF && ins > 0 && ins < b.waveStart.length && ins < nb.waveStart.length) {
        var rel = w - b.waveStart[ins], len = (nb.waveStart[ins + 1] || nb.waveLen) - nb.waveStart[ins];
        if (rel >= 0 && rel < len) nw = nb.waveStart[ins] + rel;
      }
      ram[NL.wpos + v] = nw;
    }
  }

  // ---------------------------------------------------------------- what the app uses
  E.ready = function () {
    return initAudio().then(ensurePlayer).then(function () {
      if (E.ctx.state !== "running") return E.ctx.resume();
    });
  };
  // mode "song" (from a position and row) or "pattern" (one position again and again)
  E.play = function (song, how) {
    return E.ready().then(function () {
      var pos = Math.max(0, Math.min(song.order.length - 1, how.pos || 0)), row = how.row || 0;
      var opts = { start: pos, row: row, speed: B.speedAt(song, pos, 0) };
      if (how.pattern) { opts.pattern = pos; opts.start = 0; }
      begin(song, opts, how.pattern ? "pattern" : "song");
    });
  };
  E.stop = stop;
  E.playing = function () { return E.mode === "song" || E.mode === "pattern"; };
  E.changed = function (song) {
    E.song = song;
    E.jamDirty = true;
    if (E.playing()) E.reloadWanted = true;
  };
  // play a note on a voice (note 0: key off)
  E.jam = function (song, voice, note, ins) {
    return E.ready().then(function () {
      E.lastJam = performance.now();
      if (E.mode === "off" || (E.mode === "jam" && E.jamDirty)) begin(song, { autoplay: false }, "jam");
      E.jobs.push([voice, note, ins]);
      feed();
    }).catch(function (e) { E.onError(e); });
  };
  E.release = function (voice) {
    if (E.mode === "off") return;
    E.lastJam = performance.now();
    E.jobs.push([voice, 0, 0]);
  };
  E.setMute = function (mask) { E.mute = mask; if (E.player) E.player.setMute(0, mask); };
  E.setModel = function (m) { E.model = m; if (E.player) E.player.setModel(m); };
  E.setVolume = function (v) { E.volume = v; if (E.gain) E.gain.gain.value = v; };
  // where the song is at the sound you hear now
  E.position = function () {
    if (!E.playing() || !E.player) return null;
    var h = E.player.history, s = playedNow() - E.ringBase;
    var lo = 0, hi = h.length - 1, best = -1;
    while (lo <= hi) {
      var mid = (lo + hi) >> 1;
      if (h[mid].sample <= s) { best = mid; lo = mid + 1; } else hi = mid - 1;
    }
    if (best < 0 || h[best].pos == null) return null;
    return { pos: h[best].pos, row: h[best].row };
  };
  // the last samples of each voice heard now (for the oscilloscopes)
  E.scope = function (v, out) {
    var end = Math.floor(playedNow()), ring = E.rings[v], n = out.length;
    for (var i = 0; i < n; i++) out[i] = ring[(end - n + i) & RMASK];
    return E.mode !== "off";
  };

  // ---------------------------------------------------------------- WAV file
  // loops: 1 (the song once) or 2 (twice, fading out); onProgress(seconds)
  E.renderWav = function (song, loops, onProgress) {
    return new Promise(function (resolve, reject) {
      var rate = 44100, p, b, L, chunks = [], total = 0, max = rate * 600;
      try {
        b = B.build(song);
        p = new Player(rate);
        p.setModel(song.model);
        p.start(tuneOf(b, song), 1);
        L = b.labels;
      } catch (e) { reject(e); return; }
      function step() {
        try {
          for (var k = 0; k < 40; k++) {
            var r = p.render(2205);
            chunks.push(r.mix); total += r.mix.length;
            if (p.c64.ram[L.looped] >= loops || total >= max) return finish();
          }
          onProgress(total / rate);
          setTimeout(step, 0);
        } catch (e) { reject(e); }
      }
      function finish() {
        var pcm = new Float32Array(total), o = 0;
        chunks.forEach(function (c) { pcm.set(c, o); o += c.length; });
        var fade = Math.min(total, loops > 1 ? rate * 6 : Math.round(rate * 0.03));
        for (var i = 0; i < fade; i++) pcm[total - fade + i] *= 1 - i / fade;
        resolve(wav(pcm, rate));
      }
      step();
    });
  };
  function wav(pcm, rate) {
    var n = pcm.length, buf = new ArrayBuffer(44 + n * 2), d = new DataView(buf);
    function str(o, s) { for (var i = 0; i < s.length; i++) d.setUint8(o + i, s.charCodeAt(i)); }
    str(0, "RIFF"); d.setUint32(4, 36 + n * 2, true); str(8, "WAVE"); str(12, "fmt ");
    d.setUint32(16, 16, true); d.setUint16(20, 1, true); d.setUint16(22, 1, true);
    d.setUint32(24, rate, true); d.setUint32(28, rate * 2, true); d.setUint16(32, 2, true); d.setUint16(34, 16, true);
    str(36, "data"); d.setUint32(40, n * 2, true);
    for (var i = 0; i < n; i++) { var s = Math.max(-1, Math.min(1, pcm[i] * 1.1)); d.setInt16(44 + i * 2, s * 32767, true); }
    return new Uint8Array(buf);
  }

  global.TrackerEngine = E;
})(window);
