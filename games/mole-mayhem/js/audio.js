/* Mole Mayhem: synthesized music (tracker style), sound effects and voice announcements.
   All tunes are original compositions; the engine is shared with Ironfall, Garden Siege, Feather Frenzy, Starlane Command and Mossling March. */
"use strict";

(function (MM) {
  const Store = MM.Store;
  const A = (MM.Audio = {
    ctx: null, musicVol: Store.get("musicVol", 0.7), sfxVol: Store.get("sfxVol", 0.8), muted: false,
    song: null, songName: null, step: 0, nextTime: 0, lastSfx: {},
  });

  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const NOTE = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
  function noteToMidi(n) {
    const m = /^([a-g])(#|b)?(\d)$/.exec(n);
    if (!m) return null;
    return 12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
  }
  const QUAL = { "": [0, 4, 7], m: [0, 3, 7], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], "7": [0, 4, 7, 10], sus4: [0, 5, 7], dim: [0, 3, 6] };
  function parseChord(s) {
    const m = /^([A-G])(#|b)?(.*)$/.exec(s);
    const pc = (NOTE[m[1].toLowerCase()] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0) + 12) % 12;
    return { pc, iv: QUAL[m[3]] || QUAL[""] };
  }

  /* ---------- Songs ---------- */
  const DR = {
    rock: { k: "x.......x.x.....", s: "....x.......x...", h: "x.x.x.x.x.x.x.xo" },
    drive: { k: "x...x...x...x...", s: "....x.......x..x", h: ".xx..xx..xx..xxo" },
    calm: { k: "x.........x.....", s: "....x.......x...", h: "x...x...x...x..." },
    half: { k: "x.......x.......", s: "........x.......", h: "x.x.x.x.x.x.x.x." },
    boss: { k: "x.x.x.x.x.x.x.x.", s: "....x..x....x.xx", h: "xxxxxxxxxxxxxxxx" },
    // deep zone: four-to-the-floor techno, broken beats and industrial patterns with claps (c)
    techno: { k: "x...x...x...x...", s: "................", c: "....x.......x...", h: "..o...o...o...o." },
    broken: { k: "x.....x...x.....", s: "....x.......x..x", c: "........x.......", h: "x.xxx.xxx.xxx.xo" },
    indust: { k: "x..x..x.x..x..x.", s: "....x.......x...", c: "....x..x....x...", h: "xxoxxxoxxxoxxxox" },
    hard: { k: "x...x...x...x.x.", s: "....x.......x...", c: "....x...x...x..x", h: "o.xxo.xxo.xxo.xx" },
  };
  const SONGS = {
    // a cheeky military march for the title
    title: {
      bpm: 136, drums: DR.rock, bass: "R...5...R...5.O.", arp: 1, pad: false, lead: "square",
      chords: "G G C D G G C D Em Em C C G D G G",
      mel: "d6:2 g6:2 b6:2 g6:2 d6:2 g6:2 b6:4 c7:2 e7:2 c7:2 g6:2 a6:4 f#6:4 " +
        "d6:2 g6:2 b6:2 d7:2 c7:2 b6:2 a6:4 e6:2 g6:2 c7:2 e6:2 d6:8 " +
        "e6:2 g6:2 b6:2 e7:2 d7:4 b6:4 c7:2 b6:2 a6:2 g6:2 e6:4 c6:4 " +
        "d6:2 g6:2 b6:2 d7:2 c7:2 a6:2 f#6:4 g6:12 r:4 ",
    },
    setup: {
      bpm: 112, drums: DR.calm, bass: "R...5...R.R.5...", arp: 2, pad: true, lead: "pluck",
      chords: "C C Am Am F F G G",
      mel: "e6:2 g6:2 c7:4 b6:2 a6:2 g6:4 a6:4 e6:2 c6:2 a5:4 f6:2 a6:2 c7:4 b6:2 g6:2 d7:4 " +
        "c7:2 b6:2 a6:2 g6:2 e6:4 c6:4 d6:2 f6:2 a6:2 f6:2 g6:8 ",
    },
    results: {
      bpm: 100, drums: DR.half, bass: "R.......5.......", arp: 2, pad: true, lead: "fm",
      chords: "F F Dm Dm Bb Bb C C",
      mel: "a6:4 c7:4 f7:8 e7:4 c7:4 a6:8 bb6:4 d7:4 f7:4 d7:4 c7:16 ",
    },
    // battle themes for the landscapes
    meadow: {
      bpm: 126, drums: DR.drive, bass: "R..R..5.R..R..O.", arp: 1, pad: false, lead: "square",
      chords: "D D G A D D Bm A G G D D Em Em A A",
      mel: "a5:2 d6:2 f#6:2 a6:2 g6:2 f#6:2 e6:4 d6:2 f#6:2 b6:2 a6:2 g6:4 e6:4 " +
        "f#6:2 a6:2 d7:2 a6:2 b6:2 g6:2 e6:4 c#6:2 e6:2 a6:2 g6:2 f#6:8 " +
        "g6:2 b6:2 d7:2 b6:2 a6:4 f#6:4 e6:2 g6:2 b6:2 g6:2 a6:8 " +
        "a6:2 c#7:2 e7:2 c#7:2 a6:2 g6:2 e6:4 d6:12 r:4 ",
    },
    desert: {
      bpm: 112, drums: DR.broken, bass: "R.R...5.R.R...b.", arp: 2, pad: true, lead: "pluck",
      chords: "Dm Dm Dm Dm Gm Gm A A Dm Dm Bb Bb A A Dm Dm",
      mel: "d6:2 e6:2 f6:2 a6:2 g#6:4 a6:4 f6:2 e6:2 d6:4 r:8 g6:2 a6:2 bb6:2 d7:2 c#7:4 a6:4 " +
        "f6:2 g6:2 a6:2 d7:2 c#7:2 bb6:2 a6:4 g6:2 f6:2 e6:4 d6:8 ",
    },
    arctic: {
      bpm: 104, drums: DR.calm, bass: "R.......5...R...", arp: 2, pad: true, lead: "soft",
      chords: "E E C#m C#m A A B B E E C#m C#m A B E E",
      mel: "b5:4 e6:4 g#6:4 b6:4 g#6:4 e6:4 c#6:8 a5:4 c#6:4 e6:4 a6:4 f#6:8 d#6:8 " +
        "e6:4 g#6:4 b6:8 c#7:4 b6:4 g#6:8 a6:4 g#6:4 f#6:4 e6:4 f#6:4 d#6:4 e6:8 ",
    },
    volcano: {
      bpm: 132, drums: DR.indust, bass: "R.R.R.R.R.R.O.O.", arp: 2, pad: false, lead: "saw", acid: 1,
      chords: "Em Em Em Em C C D D Em Em Em Em Am Am B B",
      mel: "e6:4 r:4 g6:4 b6:4 a6:4 g6:4 f#6:8 r:16 c7:4 b6:4 a6:4 g6:4 f#6:8 d6:8 " +
        "e6:4 r:4 b6:4 e7:4 d7:4 c7:4 b6:8 r:16 a6:4 c7:4 e7:4 d#7:4 b6:16 ",
    },
    sudden: {
      bpm: 150, drums: DR.boss, bass: "R.R.R.R.R.R.R.O.", arp: 1, pad: false, lead: "saw",
      chords: "Am Am F G Am Am F E",
      mel: "a6:2 c7:2 e7:2 c7:2 a6:2 e6:2 a6:4 f6:2 a6:2 c7:2 a6:2 g6:2 b6:2 d7:4 " +
        "e7:2 d7:2 c7:2 b6:2 a6:2 g6:2 f6:4 e6:2 g#6:2 b6:2 e7:2 g#6:8 ",
    },
  };

  function prepare(def) {
    const s = Object.assign({}, def);
    s.chords = def.chords.split(" ").map(parseChord);
    s.melody = new Map();
    let pos = 0;
    for (const tok of def.mel.trim().split(/\s+/)) {
      const [n, d] = tok.split(":");
      const dur = +d || 1;
      if (n !== "r") s.melody.set(pos, { midi: noteToMidi(n), dur });
      pos += dur;
    }
    s.melLen = pos;
    s.len = s.chords.length * 16;
    return s;
  }

  /* ---------- Audio graph ---------- */
  A.init = function () {
    if (A.ctx) { if (A.ctx.state === "suspended") A.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (A.ctx = new AC());
    A.comp = ctx.createDynamicsCompressor();
    A.comp.threshold.value = -12; A.comp.ratio.value = 4; A.comp.attack.value = 0.004; A.comp.release.value = 0.2;
    A.comp.connect(ctx.destination);
    A.master = ctx.createGain(); A.master.gain.value = 1; A.master.connect(A.comp);
    A.musicBus = ctx.createGain(); A.musicBus.gain.value = A.musicVol * 0.5; A.musicBus.connect(A.master);
    A.sfxBus = ctx.createGain(); A.sfxBus.gain.value = A.sfxVol; A.sfxBus.connect(A.master);
    // Reverb (generated impulse response)
    A.reverb = ctx.createConvolver();
    const len = Math.floor(ctx.sampleRate * 1.8), ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    A.reverb.buffer = ir;
    A.revMusic = ctx.createGain(); A.revMusic.gain.value = 0.28; A.revMusic.connect(A.musicBus);
    A.revSfx = ctx.createGain(); A.revSfx.gain.value = 0.3; A.revSfx.connect(A.sfxBus);
    A.revIn = ctx.createGain(); A.revIn.connect(A.reverb);
    A.reverb.connect(A.revMusic);
    A.reverbS = ctx.createConvolver(); A.reverbS.buffer = ir; A.reverbS.connect(A.revSfx);
    // Echo for the lead voice
    A.delay = ctx.createDelay(1.5); A.delay.delayTime.value = 0.35;
    A.delayFb = ctx.createGain(); A.delayFb.gain.value = 0.33;
    A.delayOut = ctx.createGain(); A.delayOut.gain.value = 0.3;
    A.delay.connect(A.delayFb); A.delayFb.connect(A.delay); A.delay.connect(A.delayOut); A.delayOut.connect(A.musicBus);
    // Noise buffer
    const nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    A.noiseBuf = nb;
    setInterval(tick, 25);
    if (A.pendingSong) { const s = A.pendingSong; A.pendingSong = null; A.playSong(s); }
  };

  A.setMusicVol = (v) => { A.musicVol = v; Store.set("musicVol", v); if (A.musicBus) A.musicBus.gain.value = v * 0.5; };
  A.setSfxVol = (v) => { A.sfxVol = v; Store.set("sfxVol", v); if (A.sfxBus) A.sfxBus.gain.value = v; };
  A.toggleMute = () => {
    A.muted = !A.muted;
    if (A.master) A.master.gain.setTargetAtTime(A.muted ? 0 : 1, A.ctx.currentTime, 0.02);
    return A.muted;
  };

  /* ---------- Music voices ---------- */
  function env(g, t, a, peak, hold, rel, sustain = peak) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.setTargetAtTime(sustain, t + a, hold * 0.3 + 0.01);
    g.gain.setTargetAtTime(0.0001, t + a + hold, rel);
  }
  function voiceLead(t, midi, dur, kind) {
    const ctx = A.ctx, f = mtof(midi);
    const g = ctx.createGain();
    const flt = ctx.createBiquadFilter(); flt.type = "lowpass"; flt.Q.value = 2;
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
    o1.type = kind === "saw" ? "sawtooth" : kind === "soft" ? "triangle" : "square";
    o2.type = kind === "soft" ? "sine" : "sawtooth";
    o1.frequency.value = f; o2.frequency.value = f; o2.detune.value = 9;
    // Vibrato that fades in, as on the classic tracker leads
    const lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = 5.6; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.012, t + Math.min(0.35, dur));
    lfo.connect(lg); lg.connect(o1.frequency); lg.connect(o2.frequency);
    flt.frequency.setValueAtTime(kind === "soft" ? 1800 : 1200, t);
    flt.frequency.linearRampToValueAtTime(kind === "soft" ? 2400 : 3800, t + 0.03);
    flt.frequency.setTargetAtTime(kind === "soft" ? 1600 : 2200, t + 0.05, 0.2);
    const lvl = kind === "soft" ? 0.11 : kind === "saw" ? 0.07 : 0.06;
    env(g, t, 0.008, lvl, dur * 0.9, 0.07, lvl * 0.75);
    o1.connect(flt); o2.connect(flt); flt.connect(g);
    g.connect(A.musicBus); g.connect(A.delay); g.connect(A.revIn);
    const end = t + dur + 0.6;
    for (const o of [o1, o2, lfo]) { o.start(t); o.stop(end); }
  }
  // 303-style acid bass: resonant filter sweep, accent on every first note of a beat
  function voiceAcid(t, midi, dur, cut, accent) {
    const ctx = A.ctx, o = ctx.createOscillator(), g = ctx.createGain(), flt = ctx.createBiquadFilter();
    o.type = "sawtooth"; o.frequency.value = mtof(midi);
    flt.type = "lowpass"; flt.Q.value = accent ? 16 : 11;
    flt.frequency.setValueAtTime(cut * (accent ? 2.4 : 1.6), t); flt.frequency.exponentialRampToValueAtTime(Math.max(120, cut * 0.35), t + dur * 0.9);
    const v = accent ? 0.2 : 0.13;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.004); g.gain.setTargetAtTime(0.0001, t + dur * 0.75, 0.03);
    const ws = A.drive || (A.drive = (() => { const w = ctx.createWaveShaper(), c = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; c[i] = Math.tanh(x * 2.4); } w.curve = c; w.connect(A.musicBus); return w; })());
    o.connect(flt); flt.connect(g); g.connect(ws);
    o.start(t); o.stop(t + dur + 0.2);
  }
  // short chord stab (detuned saws through a closing filter)
  function voiceStab(t, midis, dur) {
    const ctx = A.ctx, g = ctx.createGain(), flt = ctx.createBiquadFilter();
    flt.type = "lowpass"; flt.Q.value = 4; flt.frequency.setValueAtTime(4200, t); flt.frequency.exponentialRampToValueAtTime(500, t + dur);
    g.gain.setValueAtTime(0.045, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    flt.connect(g); g.connect(A.musicBus); g.connect(A.delay); g.connect(A.revIn);
    for (const m of midis) for (const d of [-12, 12]) { const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = mtof(m); o.detune.value = d; o.connect(flt); o.start(t); o.stop(t + dur + 0.05); }
  }
  // plucked metallic lead and an FM bell
  function voicePluck(t, midi, dur) {
    const ctx = A.ctx, f = mtof(midi), g = ctx.createGain(), flt = ctx.createBiquadFilter();
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
    o1.type = "square"; o2.type = "sawtooth"; o1.frequency.value = f; o2.frequency.value = f * 2; o2.detune.value = 6;
    flt.type = "lowpass"; flt.Q.value = 6; flt.frequency.setValueAtTime(6000, t); flt.frequency.exponentialRampToValueAtTime(700, t + Math.min(0.35, dur));
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.075, t + 0.004); g.gain.exponentialRampToValueAtTime(0.002, t + Math.max(0.12, dur * 0.95));
    o1.connect(flt); o2.connect(flt); flt.connect(g); g.connect(A.musicBus); g.connect(A.delay); g.connect(A.revIn);
    for (const o of [o1, o2]) { o.start(t); o.stop(t + dur + 0.1); }
  }
  function voiceFM(t, midi, dur) {
    const ctx = A.ctx, f = mtof(midi), car = ctx.createOscillator(), mod = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain();
    car.type = "sine"; car.frequency.value = f; mod.type = "sine"; mod.frequency.value = f * 3.5;
    mg.gain.setValueAtTime(f * 4, t); mg.gain.exponentialRampToValueAtTime(f * 0.3, t + dur);
    mod.connect(mg); mg.connect(car.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.12, t + 0.005); g.gain.exponentialRampToValueAtTime(0.002, t + dur + 0.3);
    car.connect(g); g.connect(A.musicBus); g.connect(A.delay); g.connect(A.revIn);
    for (const o of [car, mod]) { o.start(t); o.stop(t + dur + 0.35); }
  }
  function voiceArp(t, midi, dur) {
    const ctx = A.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "square"; o.frequency.value = mtof(midi);
    g.gain.setValueAtTime(0.028, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.95);
    o.connect(g); g.connect(A.musicBus); g.connect(A.revIn);
    o.start(t); o.stop(t + dur);
  }
  function voiceBass(t, midi, dur) {
    const ctx = A.ctx, o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), flt = ctx.createBiquadFilter();
    o.type = "sawtooth"; o.frequency.value = mtof(midi);
    o2.type = "square"; o2.frequency.value = mtof(midi - 12);
    flt.type = "lowpass"; flt.Q.value = 7;
    flt.frequency.setValueAtTime(1500, t); flt.frequency.exponentialRampToValueAtTime(260, t + 0.16);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.2, t + 0.005);
    g.gain.setTargetAtTime(0.0001, t + dur * 0.7, 0.04);
    o.connect(flt); o2.connect(flt); flt.connect(g); g.connect(A.musicBus);
    o.start(t); o2.start(t); o.stop(t + dur + 0.3); o2.stop(t + dur + 0.3);
  }
  function voicePad(t, midis, dur) {
    const ctx = A.ctx, g = ctx.createGain(), flt = ctx.createBiquadFilter();
    flt.type = "lowpass"; flt.frequency.value = 900; flt.Q.value = 0.7;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05, t + dur * 0.3);
    g.gain.setTargetAtTime(0.0001, t + dur * 0.85, 0.15);
    flt.connect(g); g.connect(A.musicBus); g.connect(A.revIn);
    for (const m of midis) for (const d of [-8, 8]) {
      const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = mtof(m); o.detune.value = d;
      o.connect(flt); o.start(t); o.stop(t + dur + 0.8);
    }
  }
  function noiseSrc(t, dur) {
    const s = A.ctx.createBufferSource(); s.buffer = A.noiseBuf;
    s.start(t, Math.random() * 1.5); s.stop(t + dur);
    return s;
  }
  function kick(t, dest, vol = 0.9) {
    const ctx = A.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.32);
  }
  function snare(t, dest) {
    const ctx = A.ctx, n = noiseSrc(t, 0.2), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = "bandpass"; f.frequency.value = 1900; f.Q.value = 0.8;
    g.gain.setValueAtTime(0.32, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.17);
    n.connect(f); f.connect(g); g.connect(dest); g.connect(A.revIn);
    const o = ctx.createOscillator(), og = ctx.createGain();
    o.type = "triangle"; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.08);
    og.gain.setValueAtTime(0.25, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    o.connect(og); og.connect(dest); o.start(t); o.stop(t + 0.12);
  }
  function clap(t, dest) {
    const ctx = A.ctx, f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = "bandpass"; f.frequency.value = 1300; f.Q.value = 1.2;
    f.connect(g); g.connect(dest); g.connect(A.revIn);
    g.gain.setValueAtTime(0.0001, t);
    for (let i = 0; i < 3; i++) { g.gain.setValueAtTime(0.3, t + i * 0.011); g.gain.exponentialRampToValueAtTime(0.05, t + i * 0.011 + 0.009); }
    g.gain.setValueAtTime(0.28, t + 0.033); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    noiseSrc(t, 0.22).connect(f);
  }
  function hat(t, dest, open) {
    const ctx = A.ctx, d = open ? 0.18 : 0.04, n = noiseSrc(t, d + 0.02), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = "highpass"; f.frequency.value = 7500;
    g.gain.setValueAtTime(open ? 0.07 : 0.06, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
    n.connect(f); f.connect(g); g.connect(dest);
  }

  function scheduleStep(s, step, t, sd) {
    const st = step % 16, bar = Math.floor(step / 16) % s.chords.length, ch = s.chords[bar];
    const bus = A.musicBus;
    if (s.drums.k[st] === "x") kick(t, bus, s.acid !== undefined ? 1.05 : 0.9);
    if (s.drums.s[st] === "x") snare(t, bus);
    if (s.drums.c && s.drums.c[st] === "x") clap(t, bus);
    if (s.drums.h[st] === "x") hat(t, bus, false);
    else if (s.drums.h[st] === "o") hat(t, bus, true);
    const b = s.bass[st];
    if (b !== ".") {
      let root = 36 + ch.pc; if (root > 43) root -= 12;
      const m = b === "O" ? root + 12 : b === "5" ? root + 7 : b === "b" ? root + 1 : root;
      if (s.acid) voiceAcid(t, m, sd * 1.1, 500 + 1500 * (0.5 + 0.5 * Math.sin(step / 24)), st % 4 === 0);
      else voiceBass(t, m, sd * 1.5);
    }
    if (s.arp) {
      const tones = ch.iv.concat([12]);
      const per = s.arp === 2 ? 1 : 2; // notes per 16th
      for (let k = 0; k < per; k++) {
        const idx = (step * per + k) % tones.length;
        voiceArp(t + (k * sd) / per, 60 + ch.pc + tones[idx] + (ch.pc > 6 ? -12 : 0), sd / per);
      }
    }
    if (s.stab && s.stab[st] === "x") voiceStab(t, ch.iv.slice(0, 3).map((i) => 60 + ch.pc + i - (ch.pc > 5 ? 12 : 0)), sd * 1.6);
    if (s.pad && st === 0) voicePad(t, ch.iv.slice(0, 3).map((i) => 48 + ch.pc + i), sd * 16);
    const ev = s.melody.get(step % s.melLen);
    if (ev && ev.midi != null) {
      if (s.lead === "pluck") voicePluck(t, ev.midi, ev.dur * sd);
      else if (s.lead === "fm") voiceFM(t, ev.midi, ev.dur * sd);
      else voiceLead(t, ev.midi, ev.dur * sd, s.lead);
    }
  }

  function tick() {
    if (!A.ctx || !A.song) return;
    const ctx = A.ctx, s = A.song, sd = 60 / s.bpm / 4;
    if (A.nextTime < ctx.currentTime - 0.25) A.nextTime = ctx.currentTime + 0.05; // tab was in the background
    while (A.nextTime < ctx.currentTime + 0.15) {
      scheduleStep(s, A.step, A.nextTime, sd);
      A.nextTime += sd;
      A.step++;
    }
  }

  A.playSong = function (name) {
    if (A.songName === name) return;
    A.songName = name;
    if (!A.ctx) { A.pendingSong = name; return; }
    const def = SONGS[name];
    if (!def) { A.song = null; return; }
    if (!def._p) def._p = prepare(def);
    A.song = def._p;
    A.step = 0;
    A.nextTime = A.ctx.currentTime + 0.1;
    A.delay.delayTime.value = (60 / def.bpm) * 0.75;
  };
  A.stopMusic = function () { A.song = null; A.songName = null; A.pendingSong = null; };

  /* ---------- Sound effects ---------- */
  function osc(t, type, f0, f1, dur, vol, dest, curve) {
    const ctx = A.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) {
      if (curve === "lin") o.frequency.linearRampToValueAtTime(f1, t + dur);
      else o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    }
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(dest || A.sfxBus);
    o.start(t); o.stop(t + dur + 0.02);
    return g;
  }
  function noise(t, dur, type, f0, f1, q, vol, rev) {
    const ctx = A.ctx, n = noiseSrc(t, dur + 0.05), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    n.connect(f); f.connect(g); g.connect(A.sfxBus);
    if (rev) { const r = ctx.createGain(); r.gain.value = rev; g.connect(r); r.connect(A.reverbS); }
    return g;
  }
  const notes = (t, list, type, step, vol, dur) => list.forEach((m, i) => osc(t + i * step, type, mtof(m), mtof(m), dur || step * 1.6, vol));

  const SFX = {
    launch: (t) => { noise(t, 0.35, "bandpass", 500, 2500, 1.2, 0.22); osc(t, "sawtooth", 180, 90, 0.25, 0.08); },
    whoosh: (t) => noise(t, 0.4, "bandpass", 900, 300, 1.4, 0.1),
    throw: (t) => { noise(t, 0.15, "bandpass", 1200, 600, 2, 0.12); osc(t, "sine", 500, 300, 0.1, 0.05); },
    bounce: (t) => { osc(t, "triangle", 260, 180, 0.08, 0.12); noise(t, 0.05, "lowpass", 900, 300, 1, 0.08); },
    boom: (t) => { noise(t, 0.8, "lowpass", 2400, 80, 0.9, 0.55, 0.35); osc(t, "sine", 120, 30, 0.5, 0.5); },
    bigboom: (t) => { noise(t, 1.6, "lowpass", 3000, 50, 0.8, 0.7, 0.6); osc(t, "sine", 90, 22, 1.2, 0.55); osc(t + 0.1, "sawtooth", 60, 25, 0.9, 0.12); },
    smallboom: (t) => { noise(t, 0.3, "lowpass", 2500, 200, 1, 0.3, 0.2); osc(t, "sine", 160, 60, 0.2, 0.2); },
    shot: (t) => { noise(t, 0.25, "lowpass", 5000, 300, 0.8, 0.5, 0.25); osc(t, "sine", 140, 40, 0.15, 0.4); },
    whack: (t) => { osc(t, "sine", 300, 80, 0.12, 0.35); noise(t, 0.08, "bandpass", 1800, 700, 2, 0.25); },
    fuse: (t) => noise(t, 0.12, "highpass", 4000, 3000, 1, 0.05),
    tick: (t) => osc(t, "square", 1500, 1500, 0.03, 0.04),
    charge: (t) => osc(t, "sine", 300, 900, 0.08, 0.03),
    jump: (t) => osc(t, "square", 300, 600, 0.09, 0.05),
    land: (t) => noise(t, 0.08, "lowpass", 600, 200, 1, 0.12),
    ouch: (t) => { osc(t, "square", 700, 400, 0.12, 0.06); osc(t + 0.12, "square", 500, 250, 0.15, 0.05); },
    splash: (t) => { noise(t, 0.6, "lowpass", 3000, 300, 1, 0.3, 0.3); osc(t, "sine", 400, 100, 0.2, 0.08); },
    die: (t) => { notes(t, [72, 67, 64, 60], "square", 0.1, 0.05); },
    crate: (t) => { osc(t, "triangle", 300, 200, 0.12, 0.12); noise(t, 0.1, "bandpass", 800, 500, 3, 0.1); },
    pickup: (t) => notes(t, [72, 76, 79, 84], "square", 0.05, 0.05),
    heal: (t) => notes(t, [76, 79, 84, 88], "sine", 0.07, 0.07, 0.25),
    drill: (t) => { for (let i = 0; i < 4; i++) noise(t + i * 0.04, 0.03, "bandpass", 1500, 1200, 4, 0.12); },
    torch: (t) => noise(t, 0.2, "bandpass", 2400, 1800, 1, 0.08),
    jet: (t) => noise(t, 0.15, "lowpass", 1400, 800, 1, 0.12),
    rope: (t) => { osc(t, "triangle", 1400, 600, 0.12, 0.06); },
    teleport: (t) => { osc(t, "sine", 200, 2000, 0.35, 0.07); osc(t + 0.05, "sine", 2400, 300, 0.35, 0.05); },
    girder: (t) => { osc(t, "square", 200, 180, 0.15, 0.08); osc(t, "triangle", 1800, 1700, 0.3, 0.05); },
    beep: (t) => osc(t, "square", 1200, 1200, 0.08, 0.06),
    armed: (t) => { osc(t, "square", 1600, 1600, 0.05, 0.05); osc(t + 0.1, "square", 1600, 1600, 0.05, 0.05); },
    turn: (t) => notes(t, [67, 72], "square", 0.08, 0.05),
    hurry: (t) => { osc(t, "square", 880, 880, 0.1, 0.06); },
    menuOk: (t) => notes(t, [76, 83], "square", 0.06, 0.05),
    menuBack: (t) => notes(t, [76, 69], "square", 0.06, 0.05),
    menuMove: (t) => osc(t, "square", 980, 980, 0.03, 0.03),
    deny: (t) => osc(t, "square", 180, 140, 0.15, 0.06),
  };
  const GAP = { bounce: 0.06, boom: 0.05, smallboom: 0.04, fuse: 0.2, tick: 0.3, charge: 0.06, land: 0.08, ouch: 0.15, drill: 0.15, torch: 0.18, jet: 0.12, splash: 0.1 };

  A.sfx = function (name) {
    if (!A.ctx || A.muted || A.ctx.state !== "running") return;
    const t = A.ctx.currentTime, last = A.lastSfx[name] || 0;
    if (t - last < (GAP[name] || 0.025)) return;
    A.lastSfx[name] = t;
    const f = SFX[name];
    if (f) f(t + 0.005);
  };

  // Short jingles (music is stopped while they play)
  A.jingle = function (name) {
    if (!A.ctx) return;
    A.stopMusic();
    const t = A.ctx.currentTime + 0.05;
    const seq = {
      win: [[69, 0.15], [72, 0.15], [76, 0.15], [81, 0.45], [79, 0.15], [81, 0.15], [84, 1.2]],
      fail: [[69, 0.3], [65, 0.3], [62, 0.3], [57, 0.9]],
      unlock: [[67, 0.1], [71, 0.1], [74, 0.1], [79, 0.1], [83, 0.1], [86, 0.5]],
    }[name];
    if (!seq) return;
    let x = t;
    for (const [m, d] of seq) { voiceLead(x, m, d * 0.95, "square"); voiceLead(x, m - 12, d * 0.95, "soft"); x += d; }
  };

  /* ---------- Speech: short announcements through the Web Speech API ---------- */
  A.voiceOn = Store.get("voice", true);
  A.setVoice = (on) => { A.voiceOn = on; Store.set("voice", on); if (!on && window.speechSynthesis) speechSynthesis.cancel(); };
  let voice = null;
  function pickVoice() {
    if (!window.speechSynthesis) return null;
    const vs = speechSynthesis.getVoices();
    if (!vs.length) return null;
    const en = vs.filter((v) => /^en/i.test(v.lang));
    voice = en.find((v) => /Google US English|Samantha|Daniel|Alex|Aria|Guy|Zira|David/i.test(v.name)) || en[0] || vs[0];
    return voice;
  }
  if (window.speechSynthesis) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  A.lastSay = 0; A.said = [];
  A.say = function (text, opt = {}) {
    A.said.push(text); if (A.said.length > 20) A.said.shift();
    if (!A.voiceOn || A.muted || !window.speechSynthesis) return;
    const now = performance.now();
    if (!opt.force && now - A.lastSay < (opt.gap || 700)) return;
    A.lastSay = now;
    try {
      if (opt.interrupt !== false) speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (voice || pickVoice()) u.voice = voice;
      u.lang = "en-US"; u.rate = opt.rate || 1.0; u.pitch = opt.pitch ?? 1.3; u.volume = Math.min(1, A.sfxVol + 0.2);
      speechSynthesis.speak(u);
    } catch (e) { /* speech not available */ }
  };
})(window.MM);
