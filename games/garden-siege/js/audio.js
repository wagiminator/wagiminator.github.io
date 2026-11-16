/* Garden Siege: synthesized music (tracker style), sound effects and voice announcements.
   All tunes are original compositions; the engine is shared with Ironfall. */
"use strict";

(function (GS) {
  const Store = GS.Store;
  const A = (GS.Audio = {
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
    title: {
      bpm: 118, drums: DR.rock, bass: "R..R5.O.R..R5.O.", arp: 1, pad: true, lead: "square",
      chords: "C C Am Am F F G G C C Am Am F G C C",
      mel: "g5:2 c6:2 e6:2 g6:2 e6:4 c6:4 a5:2 c6:2 e6:2 a6:2 g6:4 e6:4 " +
        "f6:2 e6:2 d6:2 c6:2 a5:4 c6:4 d6:2 e6:2 f6:2 g6:2 b6:4 g6:4 " +
        "c7:4 g6:2 e6:2 c6:4 e6:4 a6:4 e6:2 c6:2 a5:8 " +
        "f6:4 a6:4 c7:4 a6:4 g6:2 f6:2 e6:2 d6:2 b5:4 d6:4 c6:16 ",
    },
    day: {
      bpm: 112, drums: DR.calm, bass: "R...5...R.O.5...", arp: 2, pad: false, lead: "pluck",
      chords: "G G Em Em C C D D G G Em Em C D G G",
      mel: "d6:2 b5:2 g5:2 b5:2 d6:4 r:2 e6:2 d6:2 b5:2 g5:4 r:4 " +
        "e6:2 d6:2 b5:2 g5:2 e5:4 g5:4 b5:2 a5:2 g5:2 e5:2 g5:8 " +
        "c6:2 e6:2 g6:2 e6:2 c6:4 e6:4 d6:2 f#6:2 a6:2 f#6:2 d6:8 " +
        "b5:2 d6:2 g6:2 d6:2 b5:4 g5:4 a5:4 c6:4 b5:2 a5:2 g5:12 r:4 ",
    },
    night: {
      bpm: 100, drums: DR.half, bass: "R..R..O...R..5..", arp: 2, pad: true, lead: "fm",
      chords: "Am Am F F Dm Dm E E Am Am F F Dm E Am Am",
      mel: "e6:4 c6:2 a5:2 e5:4 a5:4 c6:2 b5:2 a5:2 g#5:2 a5:8 " +
        "f5:2 a5:2 c6:2 f6:2 e6:4 c6:4 d6:2 c6:2 a5:2 f5:2 e5:8 " +
        "a5:2 c6:2 e6:2 a6:2 g#6:4 e6:4 f6:2 e6:2 d6:2 c6:2 b5:8 " +
        "c6:4 b5:4 a5:4 g#5:4 a5:16 ",
    },
    pool: {
      bpm: 126, drums: DR.drive, bass: "R.R5.R.OR.R5.RO.", arp: 1, pad: false, lead: "square",
      chords: "F F Dm Dm Bb Bb C C F F Dm Dm Bb C F F",
      mel: "c6:2 f6:2 a6:2 f6:2 c6:2 a5:2 c6:4 d6:2 f6:2 a6:2 d7:2 c7:8 " +
        "bb6:2 a6:2 g6:2 f6:2 d6:4 f6:4 e6:2 g6:2 c7:2 g6:2 e6:8 " +
        "f6:2 a6:2 c7:2 a6:2 f6:4 a6:4 d6:2 f6:2 a6:2 f6:2 d6:8 " +
        "bb5:2 d6:2 f6:2 bb6:2 c7:4 bb6:4 a6:4 g6:4 f6:8 ",
    },
    fog: {
      bpm: 92, drums: DR.calm, bass: "R.......R...O...", arp: 2, pad: true, lead: "soft",
      chords: "Dm Dm Bb Bb Gm Gm A A Dm Dm Bb Bb Gm A Dm Dm",
      mel: "a5:6 f5:2 d5:8 bb5:6 a5:2 g5:8 " +
        "g5:4 bb5:4 d6:8 c#6:4 a5:4 e5:8 " +
        "d6:6 c6:2 a5:4 f5:4 bb5:6 a5:2 f5:8 " +
        "g5:4 a5:4 bb5:4 c#6:4 d6:16 ",
    },
    roof: {
      bpm: 132, drums: DR.rock, bass: "R.RO.R5.R.RO.R5.", arp: 1, pad: false, lead: "saw",
      chords: "Em Em C C D D B B Em Em C C Am B Em Em",
      mel: "e5:2 g5:2 b5:2 e6:2 d6:2 b5:2 g5:4 e5:2 g5:2 c6:2 e6:2 d6:4 c6:4 " +
        "d6:2 f#6:2 a6:2 f#6:2 d6:4 a5:4 b5:2 d#6:2 f#6:2 b6:2 a6:4 f#6:4 " +
        "g6:2 e6:2 b5:2 e6:2 g6:4 b6:4 a6:2 g6:2 e6:2 c6:2 e6:8 " +
        "c6:4 e6:4 a6:4 c7:4 b6:4 f#6:4 d#6:4 b5:4 ",
    },
    choose: {
      bpm: 96, drums: DR.calm, bass: "R...5...R...5.O.", arp: 2, pad: true, lead: "soft",
      chords: "Cmaj7 Am7 Dm7 G Cmaj7 Am7 Fmaj7 G",
      mel: "e5:4 g5:4 c6:6 b5:2 a5:4 c6:4 e6:8 " +
        "d6:4 c6:4 a5:6 g5:2 f5:4 a5:4 d6:8 " +
        "e6:4 d6:4 c6:6 b5:2 a5:4 e5:4 a5:8 " +
        "f5:4 a5:4 c6:4 f6:4 e6:4 d6:4 b5:8 ",
    },
    shop: {
      bpm: 100, drums: DR.calm, bass: "R...5...O...5.R.", arp: 2, pad: true, lead: "soft",
      chords: "Cmaj7 Am7 Fmaj7 G",
      mel: "e5:4 g5:4 b5:6 a5:2 c6:4 a5:4 e5:8 " +
        "f5:4 a5:4 c6:4 e6:4 d6:8 b5:8 ",
    },
    minigame: {
      bpm: 144, drums: DR.drive, bass: "R.RR.RO.R.RR.R5O", arp: 1, pad: false, lead: "square",
      chords: "Bb Bb Gm Gm Eb Eb F F Bb Bb Gm Gm Eb F Bb Bb",
      mel: "f5:2 bb5:2 d6:2 f6:2 bb6:4 f6:4 g5:2 bb5:2 d6:2 g6:2 f6:8 " +
        "eb6:2 g6:2 bb6:2 g6:2 eb6:4 g6:4 f6:2 a6:2 c7:2 a6:2 f6:8 " +
        "d6:2 f6:2 bb6:2 f6:2 d6:4 bb5:4 g5:2 bb5:2 d6:2 g6:2 d6:8 " +
        "eb6:4 g6:4 f6:4 a6:4 bb6:16 ",
    },
    boss: {
      bpm: 160, drums: DR.boss, bass: "RRORRORRRRORRORO", arp: 1, pad: false, lead: "saw",
      chords: "Em F Em F Em F G F#",
      mel: "e5:2 r:2 e5:2 f5:2 g5:4 b5:4 a5:2 r:2 c6:2 a5:2 f5:4 c5:4 " +
        "e5:2 g5:2 b5:2 e6:2 d6:4 b5:4 c6:8 a5:8 " +
        "e6:4 b5:2 g5:2 e5:4 g5:4 f5:4 a5:4 c6:4 f6:4 " +
        "g6:4 d6:2 b5:2 g5:4 d6:4 c#6:4 f#6:4 a#5:8 ",
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
    plant: (t) => { noise(t, 0.12, "lowpass", 900, 200, 1, 0.18); osc(t, "sine", 160, 80, 0.12, 0.25); },
    shoot: (t) => { osc(t, "sine", 520, 260, 0.07, 0.07); noise(t, 0.04, "bandpass", 1800, 900, 2, 0.04); },
    snow: (t) => { osc(t, "triangle", 1400, 900, 0.09, 0.04); noise(t, 0.06, "highpass", 4000, 6000, 1, 0.03); },
    lob: (t) => { osc(t, "triangle", 300, 600, 0.12, 0.05); noise(t, 0.08, "lowpass", 1200, 400, 1, 0.05); },
    splat: (t) => { noise(t, 0.07, "lowpass", 1400, 300, 1.5, 0.09); osc(t, "sine", 240, 120, 0.05, 0.05); },
    cone: (t) => { osc(t, "triangle", 420, 300, 0.06, 0.07); noise(t, 0.05, "bandpass", 900, 600, 2, 0.05); },
    metal: (t) => { osc(t, "triangle", 2200, 1900, 0.09, 0.05); osc(t, "square", 1100, 1050, 0.06, 0.015); },
    chomp: (t) => { noise(t, 0.09, "bandpass", 700, 400, 1.5, 0.12); osc(t, "square", 160, 90, 0.07, 0.03); },
    gulp: (t) => { osc(t, "sine", 400, 120, 0.25, 0.18); noise(t, 0.2, "lowpass", 800, 200, 1, 0.1); },
    sun: (t) => notes(t, [84, 88, 91], "sine", 0.05, 0.06),
    coin: (t) => { osc(t, "square", 1318, 1318, 0.06, 0.04); osc(t + 0.06, "square", 1760, 1760, 0.12, 0.04); },
    diamond: (t) => notes(t, [88, 91, 96, 100], "sine", 0.05, 0.07, 0.3),
    boom: (t) => { noise(t, 0.6, "lowpass", 3000, 120, 1, 0.45, 0.35); osc(t, "sine", 140, 35, 0.45, 0.6); },
    doom: (t) => {
      noise(t, 2.4, "lowpass", 3000, 50, 1.4, 0.8, 0.8);
      osc(t, "sine", 95, 20, 2.0, 1.0);
      for (let i = 0; i < 5; i++) noise(t + 0.2 + i * 0.25, 0.4, "lowpass", 2200, 150, 1, 0.22);
    },
    freeze: (t) => { noise(t, 0.8, "highpass", 3000, 8000, 0.8, 0.12, 0.4); osc(t, "sine", 2400, 600, 0.6, 0.05); },
    fire: (t) => { noise(t, 1.0, "bandpass", 400, 2400, 0.8, 0.35, 0.4); osc(t, "sawtooth", 80, 40, 0.8, 0.12); },
    splash: (t) => noise(t, 0.45, "bandpass", 1400, 300, 1, 0.18),
    mower: (t) => { for (let i = 0; i < 10; i++) osc(t + i * 0.08, "sawtooth", 70 + (i % 2) * 15, 60, 0.08, 0.08); },
    wave: (t) => { osc(t, "sawtooth", 220, 330, 0.6, 0.08, null, "lin"); osc(t + 0.6, "sawtooth", 330, 220, 0.8, 0.08, null, "lin"); },
    huge: (t) => { for (let i = 0; i < 3; i++) { osc(t + i * 0.7, "sawtooth", 180, 360, 0.5, 0.1, null, "lin"); osc(t + i * 0.7, "square", 90, 180, 0.5, 0.05, null, "lin"); } },
    groan: (t) => { const f = 90 + Math.random() * 50; osc(t, "sawtooth", f, f * 0.7, 0.9, 0.05); noise(t, 0.9, "lowpass", 500, 200, 4, 0.06); },
    select: (t) => osc(t, "square", 880, 990, 0.05, 0.04),
    deny: (t) => osc(t, "square", 150, 120, 0.15, 0.07),
    shovel: (t) => { noise(t, 0.15, "lowpass", 1500, 300, 1, 0.15); osc(t, "triangle", 300, 150, 0.1, 0.05); },
    squash: (t) => { noise(t, 0.3, "lowpass", 900, 80, 1, 0.35); osc(t, "sine", 120, 40, 0.3, 0.5); },
    arm: (t) => { noise(t, 0.2, "lowpass", 700, 300, 1, 0.12); osc(t, "square", 600, 900, 0.08, 0.03); },
    bowl: (t) => { osc(t, "triangle", 200, 260, 0.1, 0.08); noise(t, 0.1, "lowpass", 600, 300, 1, 0.08); },
    bonk: (t) => { osc(t, "square", 330, 160, 0.08, 0.06); noise(t, 0.06, "lowpass", 1200, 400, 1, 0.08); },
    engine: (t) => { for (let i = 0; i < 6; i++) osc(t + i * 0.09, "sawtooth", 55, 50, 0.09, 0.06); },
    pop: (t) => { noise(t, 0.08, "highpass", 1500, 3000, 1, 0.2); osc(t, "sine", 900, 200, 0.06, 0.08); },
    jack: (t) => notes(t, [72, 76, 79, 76, 72, 74, 77, 79], "triangle", 0.12, 0.04),
    magnet: (t) => { osc(t, "sine", 200, 900, 0.5, 0.06, null, "lin"); osc(t + 0.4, "triangle", 2000, 1800, 0.1, 0.04); },
    butter: (t) => { noise(t, 0.12, "lowpass", 700, 300, 1, 0.12); },
    wind: (t) => noise(t, 1.4, "bandpass", 300, 1500, 0.6, 0.25, 0.5),
    whack: (t) => { noise(t, 0.1, "lowpass", 1600, 300, 1, 0.25); osc(t, "square", 220, 110, 0.08, 0.08); },
    vase: (t) => { noise(t, 0.3, "highpass", 2000, 600, 1, 0.22); osc(t, "triangle", 1800, 900, 0.1, 0.04); },
    cannon: (t) => { noise(t, 0.4, "lowpass", 1500, 200, 1, 0.3); osc(t, "sine", 200, 60, 0.3, 0.4); },
    fall: (t) => osc(t, "sine", 1200, 300, 0.8, 0.05, null, "lin"),
    award: (t) => notes(t, [72, 76, 79, 84, 88, 91, 96], "square", 0.06, 0.05, 0.3),
    click: (t) => osc(t, "square", 700, 700, 0.03, 0.035),
    menuMove: (t) => osc(t, "square", 700, 700, 0.03, 0.03),
    menuOk: (t) => { osc(t, "square", 880, 880, 0.05, 0.05); osc(t + 0.05, "square", 1320, 1320, 0.08, 0.05); },
    menuBack: (t) => { osc(t, "square", 600, 600, 0.05, 0.05); osc(t + 0.05, "square", 400, 400, 0.08, 0.05); },
    tick: (t) => osc(t, "square", 2000, 2000, 0.02, 0.03),
    zap: (t) => { noise(t, 0.3, "bandpass", 4000, 900, 5, 0.1); osc(t, "sawtooth", 1500, 100, 0.3, 0.04); },
    stomp: (t) => { noise(t, 0.5, "lowpass", 600, 60, 1, 0.45, 0.4); osc(t, "sine", 70, 25, 0.5, 0.9); },
    roar: (t) => { noise(t, 1.0, "lowpass", 700, 150, 3, 0.3, 0.5); osc(t, "sawtooth", 70, 40, 1.0, 0.14); },
  };
  const GAP = { shoot: 0.045, snow: 0.05, lob: 0.06, splat: 0.04, cone: 0.06, metal: 0.06, chomp: 0.12, sun: 0.05, coin: 0.05, groan: 2.5, plant: 0.05, bowl: 0.08, bonk: 0.05, tick: 0.2, engine: 0.5 };

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
      clear: [[72, 0.12], [76, 0.12], [79, 0.12], [84, 0.36], [83, 0.12], [84, 0.6]],
      gameover: [[69, 0.4], [65, 0.4], [62, 0.4], [57, 1.2]],
      ready: [[67, 0.25], [72, 0.25], [76, 0.25], [79, 0.5]],
      victory: [[72, 0.15], [72, 0.15], [72, 0.15], [76, 0.45], [74, 0.15], [76, 0.15], [79, 0.9], [84, 1.2]],
      boss: [[64, 0.12], [67, 0.12], [71, 0.12], [76, 0.24], [74, 0.12], [76, 0.12], [79, 0.24], [83, 0.24], [88, 0.8]],
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
      u.lang = "en-US"; u.rate = opt.rate || 1.0; u.pitch = opt.pitch ?? 0.75; u.volume = Math.min(1, A.sfxVol + 0.2);
      speechSynthesis.speak(u);
    } catch (e) { /* speech not available */ }
  };
})(window.GS);
