/* PRIMORDIA: synthesized breakbeat soundtrack and sound effects (Web Audio API).
   All tunes are original compositions in the style of late-80s/early-90s Amiga shooter soundtracks. */
"use strict";

(function (XA) {
  const Store = XA.Store;
  const A = (XA.Audio = {
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
  const QUAL = { "": [0, 4, 7], m: [0, 3, 7], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], "7": [0, 4, 7, 10], sus4: [0, 5, 7], m9: [0, 3, 7, 10, 14] };
  function parseChord(s) {
    const m = /^([A-G])(#|b)?(.*)$/.exec(s);
    const pc = (NOTE[m[1].toLowerCase()] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0) + 12) % 12;
    return { pc, iv: QUAL[m[3]] || QUAL[""] };
  }

  /* ---------- Songs ----------
     drums: k kick, s snare, c clap, h hat (x closed, o open), x scratch
     bass: per 16th: 0 root, O octave, 5 fifth, 3 third, 7 seventh, . rest, - hold
     stab: x = chord stab */
  const SONGS = {
    title: {
      bpm: 112, swing: 0.12, bassType: "funk", lead: "pluck", stabType: "brass",
      drums: { k: "x.....x...x.....", s: "....x.......x...", c: "....x.......x..x", h: "x.x.x.x.x.x.x.xo", x: "..............x." },
      bass: "0..0..O.0.5.3...", stab: "x.....x.....x...",
      chords: "Gm Gm Eb F Gm Gm Cm D",
      mel: "g5:2 r:2 bb5:2 d6:4 c6:2 bb5:2 a5:2 g5:6 r:2 f5:2 g5:2 bb5:4 " +
        "g5:2 bb5:2 c6:2 eb6:6 d6:2 c6:2 d6:6 c6:2 a5:4 f5:4 " +
        "g5:2 r:2 bb5:2 d6:4 g6:4 f6:2 d6:6 r:2 bb5:2 c6:2 d6:4 " +
        "eb6:4 d6:2 c6:2 g5:8 f#5:4 a5:4 d6:8",
    },
    shop: {
      bpm: 96, swing: 0.18, bassType: "sub", lead: "soft", stabType: "keys",
      drums: { k: "x.......x.x.....", s: "....x.......x...", c: "................", h: "x.xxx.x.x.xxx.x.", x: "................" },
      bass: "0.....5.O...3...", stab: "..x.....x.x.....", pad: true,
      chords: "Dm7 G7 Cmaj7 Am7 Dm7 G7 Cmaj7 Cmaj7",
      mel: "f5:4 a5:4 c6:6 a5:2 b5:4 g5:4 f5:8 e5:4 g5:4 b5:6 c6:2 a5:8 r:8 " +
        "d6:4 c6:2 a5:2 f5:8 g5:4 b5:4 d6:8 e6:6 d6:2 c6:4 b5:4 c6:16",
    },
    level1: {
      bpm: 122, swing: 0.08, bassType: "funk", lead: "pluck", stabType: "brass",
      drums: { k: "x...x...x...x...", s: "....x.......x...", c: "....x.......x...", h: ".x.x.x.x.x.x.xox", x: "................" },
      bass: "0.0.O.0.5.0.O.3.", stab: "...x..x....x..x.", arp: true,
      chords: "Am F G Em Am F G E",
      mel: "e5:3 a5:3 c6:2 b5:4 a5:4 c6:3 a5:3 f5:2 a5:8 d6:3 b5:3 g5:2 b5:4 d6:4 e6:8 b5:8 " +
        "e5:3 a5:3 c6:2 e6:4 d6:4 c6:3 a5:3 f5:2 c6:4 a5:4 b5:4 d6:4 g6:4 f6:2 d6:2 e6:8 g#5:8",
    },
    level2: {
      bpm: 116, swing: 0.1, bassType: "acid", lead: "saw", stabType: "brass",
      drums: { k: "x..x....x.x.....", s: "....x..x....x...", c: "............x...", h: "x.x.x.x.x.x.x.x.", x: "......x.........." },
      bass: "0.00.0O.0.07.0O.", stab: "x.......x.......",
      chords: "Dm Dm Bb C Dm Dm Gm A",
      mel: "d5:8 f5:4 a5:4 d6:6 c6:2 a5:8 bb5:4 a5:4 f5:4 d5:4 e5:4 g5:4 c6:8 " +
        "d6:4 a5:4 f5:4 a5:4 d6:6 e6:2 f6:8 g5:4 bb5:4 d6:8 c#6:4 e6:4 a6:8",
    },
    level3: {
      bpm: 128, swing: 0.04, bassType: "acid", lead: "square", stabType: "brass",
      drums: { k: "x...x...x...x...", s: "................", c: "....x.......x...", h: "..x...x...x...x.", x: "..........x....." },
      bass: "00O0.05O0.0O3.0O", stab: "......x.......x.", arp: true,
      chords: "Em Em C D Em Em Am B",
      mel: "b4:2 e5:2 g5:2 b5:4 a5:2 g5:4 r:4 e5:2 g5:2 a5:4 b5:8 c6:4 b5:4 g5:4 e5:4 d5:4 f#5:4 a5:8 " +
        "b5:2 e6:2 d6:2 b5:4 g5:2 e5:4 r:4 g5:2 a5:2 b5:4 e6:8 a5:4 c6:4 e6:4 c6:4 d#6:4 f#6:4 b6:8",
    },
    level4: {
      bpm: 132, swing: 0.0, bassType: "funk", lead: "saw", stabType: "brass",
      drums: { k: "x...x...x...x...", s: "....x.......x...", c: "....x..x....x...", h: "xxoxxxoxxxoxxxox", x: "..............x." },
      bass: "0.O.0.O.0.O.5.O.", stab: "x..x..x...x..x..", pad: true,
      chords: "Fm Db Eb C Fm Db Bbm C",
      mel: "c6:6 ab5:2 f5:4 c6:4 db6:6 c6:2 ab5:8 bb5:4 c6:4 eb6:4 g5:4 e5:8 g5:8 " +
        "f6:4 eb6:2 c6:2 ab5:4 c6:4 db6:4 f6:4 ab6:8 bb5:4 db6:4 f6:4 e6:4 c6:8 e6:4 g6:4",
    },
    boss: {
      bpm: 156, swing: 0, bassType: "acid", lead: "saw", stabType: "brass",
      drums: { k: "x.........x.....", s: "....x.......x...", c: "....x..x.x..x...", h: "xxxxxxxxxxxxxxxx", x: "...........x...." },
      bass: "0.0O..0.70.0O.5.", stab: "x.....x...x.....",
      chords: "Cm Ab Bb G Cm Ab Fm G",
      mel: "c6:2 r:2 c6:2 bb5:2 g5:4 eb5:4 ab5:2 r:2 c6:2 eb6:2 f6:4 eb6:4 d6:2 bb5:2 f5:2 bb5:2 d6:4 f6:4 b5:8 g5:8 " +
        "c6:2 eb6:2 g6:4 f6:2 eb6:2 c6:4 ab5:4 c6:4 eb6:2 c6:2 ab5:4 f5:4 ab5:4 c6:4 f6:4 d6:4 b5:4 g5:4",
    },
    /* Stages 5–8: synthwave and dark synth – gated drums, sequencer bass, brass and bell leads, choir pads */
    age5: {
      bpm: 100, swing: 0, bassType: "seq", lead: "brass", stabType: "brass", gated: true, pad: "choir",
      drums: { k: "x...x...x...x...", s: "....x.......x...", c: "................", h: "x.x.x.x.x.x.x.x.", x: "................" },
      bass: "0O0O0O0O0O0O5O5O", stab: "................",
      chords: "Am F C G Am F Dm E",
      mel: "e5:4 a5:4 c6:4 b5:2 a5:2 g5:8 e5:8 c6:4 e6:4 d6:4 c6:2 b5:2 g5:12 r:4 " +
        "a5:4 c6:4 e6:4 f6:2 e6:2 d6:8 a5:8 b5:4 d6:4 f6:4 e6:2 d6:2 e6:8 g#5:8",
    },
    age6: {
      bpm: 112, swing: 0, bassType: "seq", lead: "brass", stabType: "brass", gated: true, arp: true,
      drums: { k: "x...x...x...x...", s: "....x.......x...", c: "............x...", h: "xxoxxxoxxxoxxxox", x: "................" },
      bass: "00O000O000O05O0O", stab: "x.........x.....",
      chords: "Dm Bb F C Dm Bb Gm A",
      mel: "d6:6 c6:2 a5:8 bb5:6 a5:2 f5:8 a5:4 c6:4 f6:4 e6:2 c6:2 g5:16 " +
        "d6:4 f6:4 a6:4 g6:2 f6:2 f6:8 d6:8 g6:4 f6:2 e6:2 d6:4 bb5:4 c#6:8 e6:8",
    },
    age7: {
      bpm: 120, swing: 0, bassType: "seq", lead: "bell", stabType: "brass", gated: true, arp: true,
      drums: { k: "x..x..x.x...x...", s: "....x.......x...", c: "....x.......x...", h: "x.xxx.xxx.xxx.xo", x: "................" },
      bass: "0.0O0.0O0.0O5.5O", stab: "...x......x.....",
      chords: "Em Em C D Em Em Am B",
      mel: "e6:2 r:2 e6:2 g6:2 b6:4 a6:4 g6:2 f#6:2 e6:4 b5:8 c6:2 r:2 c6:2 e6:2 g6:4 f#6:4 d6:8 f#6:8 " +
        "e6:2 r:2 e6:2 g6:2 b6:4 d7:4 c7:4 b6:4 a6:8 a6:4 c7:2 b6:2 a6:4 e6:4 d#6:8 b5:8",
    },
    age8: {
      bpm: 104, swing: 0, bassType: "seq", lead: "brass", stabType: "brass", gated: true, pad: "choir", arp: true,
      drums: { k: "x.......x.x.....", s: "....x.......x...", c: "................", h: ".x.x.x.x.x.x.x.x", x: "................" },
      bass: "0O0O0O0O0O0O7O5O", stab: "x...............",
      chords: "Cm Ab Eb Bb Cm Ab Fm G",
      mel: "g5:4 c6:4 eb6:4 d6:2 c6:2 c6:8 ab5:8 g5:4 bb5:4 eb6:4 f6:2 g6:2 f6:12 r:4 " +
        "g6:4 eb6:4 c6:4 d6:2 eb6:2 c6:8 ab5:8 ab5:4 c6:4 f6:4 eb6:2 d6:2 d6:8 b5:8",
    },
    boss2: {
      bpm: 140, swing: 0, bassType: "seq", lead: "brass", stabType: "brass", gated: true,
      drums: { k: "x.x.x.x.x.x.x.x.", s: "....x.......x.x.", c: "....x.......x...", h: "xxxxxxxxxxxxxxxx", x: "................" },
      bass: "0O0O0O0O0O0O0O5O", stab: "x..x..x.........",
      chords: "Fm Fm Db Eb Fm Fm Bbm C",
      mel: "f5:2 ab5:2 c6:2 f6:2 e6:4 c6:4 db6:4 c6:2 bb5:2 ab5:8 f5:2 ab5:2 c6:2 f6:2 g6:4 ab6:4 g6:8 eb6:8 " +
        "f6:4 c6:4 ab5:4 f5:4 db6:4 f6:4 ab6:8 bb6:4 ab6:2 g6:2 f6:4 db6:4 e6:8 c6:8",
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
    A.master = ctx.createGain(); A.master.connect(A.comp);
    A.musicBus = ctx.createGain(); A.musicBus.gain.value = A.musicVol * 0.5; A.musicBus.connect(A.master);
    A.sfxBus = ctx.createGain(); A.sfxBus.gain.value = A.sfxVol; A.sfxBus.connect(A.master);
    const len = Math.floor(ctx.sampleRate * 1.8), ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    A.reverb = ctx.createConvolver(); A.reverb.buffer = ir;
    A.revIn = ctx.createGain(); A.revIn.gain.value = 0.6; A.revIn.connect(A.reverb);
    A.revOut = ctx.createGain(); A.revOut.gain.value = 0.3; A.reverb.connect(A.revOut); A.revOut.connect(A.musicBus);
    A.reverbS = ctx.createConvolver(); A.reverbS.buffer = ir;
    A.revOutS = ctx.createGain(); A.revOutS.gain.value = 0.35; A.reverbS.connect(A.revOutS); A.revOutS.connect(A.sfxBus);
    A.delay = ctx.createDelay(1.5); A.delay.delayTime.value = 0.375;
    A.delayFb = ctx.createGain(); A.delayFb.gain.value = 0.3;
    A.delayOut = ctx.createGain(); A.delayOut.gain.value = 0.28;
    A.delay.connect(A.delayFb); A.delayFb.connect(A.delay); A.delay.connect(A.delayOut); A.delayOut.connect(A.musicBus);
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

  /* ---------- Instruments ---------- */
  function noiseSrc(t, dur) {
    const s = A.ctx.createBufferSource(); s.buffer = A.noiseBuf;
    s.start(t, Math.random() * 1.5); s.stop(t + dur);
    return s;
  }
  function voiceLead(t, midi, dur, kind) {
    const ctx = A.ctx, f = mtof(midi), g = ctx.createGain(), flt = ctx.createBiquadFilter();
    flt.type = "lowpass"; flt.Q.value = 3;
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
    o1.type = kind === "saw" ? "sawtooth" : kind === "soft" ? "triangle" : "square";
    o2.type = kind === "soft" ? "sine" : "sawtooth";
    o1.frequency.value = f; o2.frequency.value = f; o2.detune.value = kind === "pluck" ? 12 : 8;
    const lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = 5.5; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.01, t + Math.min(0.4, dur));
    lfo.connect(lg); lg.connect(o1.frequency); lg.connect(o2.frequency);
    let lvl;
    if (kind === "bell") {
      // FM bell: the second oscillator modulates the first
      o1.type = "sine"; o2.type = "sine"; o2.frequency.value = f * 3.5; o2.detune.value = 0;
      const mg = ctx.createGain(); mg.gain.setValueAtTime(f * 3, t); mg.gain.exponentialRampToValueAtTime(f * 0.2, t + Math.max(0.2, dur));
      o2.connect(mg); mg.connect(o1.frequency);
      flt.frequency.value = 6000;
      lvl = 0.1;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(lvl, t + 0.005); g.gain.exponentialRampToValueAtTime(0.002, t + dur + 0.4);
      o1.connect(flt); flt.connect(g);
      g.connect(A.musicBus); g.connect(A.delay); g.connect(A.revIn);
      for (const o of [o1, o2, lfo]) { o.start(t); o.stop(t + dur + 0.6); }
      return;
    } else if (kind === "brass") {
      // synth brass: two detuned saws with a slow filter swell
      o1.type = "sawtooth"; o2.detune.value = 14;
      flt.Q.value = 2; flt.frequency.setValueAtTime(500, t); flt.frequency.linearRampToValueAtTime(3200, t + 0.09); flt.frequency.setTargetAtTime(1800, t + 0.12, 0.25);
      lvl = 0.07;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(lvl, t + 0.04);
      g.gain.setTargetAtTime(lvl * 0.8, t + 0.05, 0.2); g.gain.setTargetAtTime(0.0001, t + dur * 0.95, 0.09);
    } else if (kind === "pluck") {
      flt.frequency.setValueAtTime(5000, t); flt.frequency.exponentialRampToValueAtTime(900, t + 0.25);
      lvl = 0.075;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(lvl, t + 0.005);
      g.gain.setTargetAtTime(lvl * 0.35, t + 0.01, 0.12); g.gain.setTargetAtTime(0.0001, t + dur, 0.06);
    } else {
      flt.frequency.setValueAtTime(kind === "soft" ? 1600 : 1300, t);
      flt.frequency.linearRampToValueAtTime(kind === "soft" ? 2400 : 4200, t + 0.03);
      flt.frequency.setTargetAtTime(kind === "soft" ? 1500 : 2300, t + 0.05, 0.2);
      lvl = kind === "soft" ? 0.1 : kind === "saw" ? 0.06 : 0.055;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(lvl, t + 0.008);
      g.gain.setTargetAtTime(lvl * 0.75, t + 0.01, 0.1); g.gain.setTargetAtTime(0.0001, t + dur * 0.92, 0.07);
    }
    o1.connect(flt); o2.connect(flt); flt.connect(g);
    g.connect(A.musicBus); g.connect(A.delay); g.connect(A.revIn);
    for (const o of [o1, o2, lfo]) { o.start(t); o.stop(t + dur + 0.6); }
  }
  function voiceBass(t, midi, dur, type, accent) {
    const ctx = A.ctx, g = ctx.createGain(), flt = ctx.createBiquadFilter();
    const o = ctx.createOscillator();
    o.type = type === "sub" ? "triangle" : type === "acid" || type === "seq" ? "sawtooth" : "square";
    o.frequency.value = mtof(midi);
    flt.type = "lowpass";
    if (type === "acid") {
      flt.Q.value = 14;
      const top = accent ? 3200 : 1700;
      flt.frequency.setValueAtTime(top, t); flt.frequency.exponentialRampToValueAtTime(220, t + 0.18);
    } else if (type === "funk") {
      flt.Q.value = 6;
      flt.frequency.setValueAtTime(2200, t); flt.frequency.exponentialRampToValueAtTime(300, t + 0.12);
      const o2 = ctx.createOscillator(); o2.type = "sawtooth"; o2.frequency.value = mtof(midi); o2.detune.value = -7;
      o2.connect(flt); o2.start(t); o2.stop(t + dur + 0.3);
    } else if (type === "seq") {
      // synthwave sequencer bass: short, punchy, slightly detuned
      flt.Q.value = 4;
      flt.frequency.setValueAtTime(accent ? 1800 : 1200, t); flt.frequency.exponentialRampToValueAtTime(380, t + 0.09);
      const o2 = ctx.createOscillator(); o2.type = "square"; o2.frequency.value = mtof(midi); o2.detune.value = 9;
      o2.connect(flt); o2.start(t); o2.stop(t + dur + 0.3);
    } else { flt.Q.value = 1; flt.frequency.value = 600; }
    const lvl = type === "sub" ? 0.3 : accent ? 0.2 : 0.15;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(lvl, t + 0.004);
    g.gain.setTargetAtTime(0.0001, t + dur * 0.8, 0.04);
    o.connect(flt); flt.connect(g); g.connect(A.musicBus);
    o.start(t); o.stop(t + dur + 0.3);
  }
  function voiceStab(t, midis, kind) {
    const ctx = A.ctx, g = ctx.createGain(), flt = ctx.createBiquadFilter();
    flt.type = "lowpass"; flt.Q.value = 2;
    flt.frequency.setValueAtTime(kind === "keys" ? 2500 : 5200, t); flt.frequency.exponentialRampToValueAtTime(700, t + 0.22);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.07, t + 0.006); g.gain.setTargetAtTime(0.0001, t + 0.06, 0.08);
    flt.connect(g); g.connect(A.musicBus); g.connect(A.revIn);
    for (const m of midis) for (const d of [-9, 9]) {
      const o = ctx.createOscillator(); o.type = kind === "keys" ? "triangle" : "sawtooth"; o.frequency.value = mtof(m); o.detune.value = d;
      o.connect(flt); o.start(t); o.stop(t + 0.5);
    }
    // orchestral-hit style noise layer
    if (kind === "brass") {
      const n = noiseSrc(t, 0.15), nf = ctx.createBiquadFilter(), ng = ctx.createGain();
      nf.type = "bandpass"; nf.frequency.value = 1200; nf.Q.value = 1;
      ng.gain.setValueAtTime(0.05, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      n.connect(nf); nf.connect(ng); ng.connect(A.musicBus);
    }
  }
  function voiceArp(t, midi, dur) {
    const ctx = A.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "square"; o.frequency.value = mtof(midi);
    g.gain.setValueAtTime(0.022, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.95);
    o.connect(g); g.connect(A.musicBus); g.connect(A.delay);
    o.start(t); o.stop(t + dur);
  }
  function voiceChoir(t, midis, dur) {
    // "aah" pad: detuned saws through two vowel formants, with a slow vibrato
    const ctx = A.ctx, g = ctx.createGain(), f1 = ctx.createBiquadFilter(), f2 = ctx.createBiquadFilter();
    f1.type = "bandpass"; f1.frequency.value = 760; f1.Q.value = 5;
    f2.type = "bandpass"; f2.frequency.value = 1200; f2.Q.value = 6;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.16, t + dur * 0.3); g.gain.setTargetAtTime(0.0001, t + dur * 0.85, 0.2);
    f1.connect(g); f2.connect(g); g.connect(A.musicBus); g.connect(A.revIn);
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 4.8; lg.gain.value = 5; lfo.connect(lg);
    for (const m of midis) for (const d of [-10, 0, 10]) {
      const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = mtof(m + 12); o.detune.value = d; lg.connect(o.detune);
      o.connect(f1); o.connect(f2); o.start(t); o.stop(t + dur + 0.9);
    }
    lfo.start(t); lfo.stop(t + dur + 0.9);
  }
  function gatedTail(t) {
    // the big gated-reverb snare of 80s synth pop
    const ctx = A.ctx, n = noiseSrc(t, 0.3), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = "bandpass"; f.frequency.value = 1800; f.Q.value = 0.6;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.16, t + 0.01); g.gain.setValueAtTime(0.13, t + 0.2); g.gain.linearRampToValueAtTime(0.0001, t + 0.23);
    n.connect(f); f.connect(g); g.connect(A.musicBus); g.connect(A.revIn);
  }
  function voicePad(t, midis, dur) {
    const ctx = A.ctx, g = ctx.createGain(), flt = ctx.createBiquadFilter();
    flt.type = "lowpass"; flt.frequency.value = 1100;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.035, t + dur * 0.3); g.gain.setTargetAtTime(0.0001, t + dur * 0.85, 0.15);
    flt.connect(g); g.connect(A.musicBus); g.connect(A.revIn);
    for (const m of midis) for (const d of [-7, 7]) {
      const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = mtof(m); o.detune.value = d;
      o.connect(flt); o.start(t); o.stop(t + dur + 0.8);
    }
  }
  function kick(t, dest, vol = 1) {
    const ctx = A.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(170, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.1);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.34);
    const n = noiseSrc(t, 0.02), ng = ctx.createGain(); ng.gain.value = 0.15; n.connect(ng); ng.connect(dest);
  }
  function snare(t, dest) {
    const ctx = A.ctx, n = noiseSrc(t, 0.22), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = "highpass"; f.frequency.value = 1200;
    g.gain.setValueAtTime(0.32, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    n.connect(f); f.connect(g); g.connect(dest); g.connect(A.revIn);
    const o = ctx.createOscillator(), og = ctx.createGain();
    o.type = "triangle"; o.frequency.setValueAtTime(240, t); o.frequency.exponentialRampToValueAtTime(150, t + 0.07);
    og.gain.setValueAtTime(0.3, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    o.connect(og); og.connect(dest); o.start(t); o.stop(t + 0.12);
  }
  function clap(t, dest) {
    const ctx = A.ctx;
    for (let i = 0; i < 3; i++) {
      const tt = t + i * 0.011, n = noiseSrc(tt, 0.12), f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = "bandpass"; f.frequency.value = 1500; f.Q.value = 1.4;
      g.gain.setValueAtTime(0.22, tt); g.gain.exponentialRampToValueAtTime(0.001, tt + (i === 2 ? 0.14 : 0.02));
      n.connect(f); f.connect(g); g.connect(dest); g.connect(A.revIn);
    }
  }
  function hat(t, dest, open) {
    const ctx = A.ctx, d = open ? 0.2 : 0.035, n = noiseSrc(t, d + 0.02), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = "highpass"; f.frequency.value = 8000;
    g.gain.setValueAtTime(open ? 0.06 : 0.05, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
    n.connect(f); f.connect(g); g.connect(dest);
  }
  function scratch(t, dest, sd) {
    // turntable-scratch impression: band-passed noise with a fast pitch wobble
    const ctx = A.ctx, n = noiseSrc(t, sd * 2), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = "bandpass"; f.Q.value = 6;
    f.frequency.setValueAtTime(600, t); f.frequency.exponentialRampToValueAtTime(2600, t + sd * 0.6);
    f.frequency.exponentialRampToValueAtTime(500, t + sd * 1.2); f.frequency.exponentialRampToValueAtTime(2200, t + sd * 1.9);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.25, t + 0.01); g.gain.setTargetAtTime(0.0001, t + sd * 1.7, 0.03);
    n.connect(f); f.connect(g); g.connect(dest);
  }

  function scheduleStep(s, step, t, sd) {
    const st = step % 16, bar = Math.floor(step / 16) % s.chords.length, ch = s.chords[bar];
    if (st % 2 === 1) t += s.swing * sd;
    const bus = A.musicBus, d = s.drums;
    if (d.k[st] === "x") kick(t, bus);
    if (d.s[st] === "x") { snare(t, bus); if (s.gated) gatedTail(t); }
    if (d.c[st] === "x") clap(t, bus);
    if (d.h[st] === "x") hat(t, bus, false); else if (d.h[st] === "o") hat(t, bus, true);
    if (d.x[st] === "x" && bar % 2 === 1) scratch(t, bus, sd);
    const b = s.bass[st];
    if (b !== "." && b !== "-") {
      let root = 36 + ch.pc; if (root > 43) root -= 12;
      const off = { 0: 0, O: 12, 5: 7, 3: ch.iv[1], 7: 10 }[b] || 0;
      let len = 1;
      while (s.bass[(st + len) % 16] === "-" && len < 8) len++;
      voiceBass(t, root + off, sd * len * 0.95, s.bassType, st % 4 === 0 || b === "O");
    }
    if (s.stab[st] === "x") voiceStab(t, ch.iv.slice(0, 3).map((i) => 60 + ch.pc + i - (ch.pc > 5 ? 12 : 0)), s.stabType);
    if (s.arp && bar % 2 === 0) {
      const tones = ch.iv.concat([12, 7 + 12]);
      voiceArp(t, 72 + ch.pc + tones[step % tones.length] - (ch.pc > 5 ? 12 : 0), sd);
    }
    if (s.pad === "choir" && st === 0) voiceChoir(t, ch.iv.slice(0, 3).map((i) => 48 + ch.pc + i), sd * 16);
    else if (s.pad && st === 0) voicePad(t, ch.iv.slice(0, 3).map((i) => 48 + ch.pc + i), sd * 16);
    const ev = s.melody.get(step % s.melLen);
    if (ev && ev.midi != null && Math.floor(step / s.melLen) % 4 !== 3) voiceLead(t, ev.midi, ev.dur * sd, s.lead);
  }

  function tick() {
    if (!A.ctx || !A.song) return;
    const ctx = A.ctx, s = A.song, sd = 60 / s.bpm / 4;
    if (A.nextTime < ctx.currentTime - 0.25) A.nextTime = ctx.currentTime + 0.05;
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
  function osc(t, type, f0, f1, dur, vol, curve) {
    const ctx = A.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) { if (curve === "lin") o.frequency.linearRampToValueAtTime(f1, t + dur); else o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur); }
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(A.sfxBus);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(t, dur, type, f0, f1, q, vol, rev) {
    const ctx = A.ctx, n = noiseSrc(t, dur + 0.05), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    n.connect(f); f.connect(g); g.connect(A.sfxBus);
    if (rev) { const r = ctx.createGain(); r.gain.value = rev; g.connect(r); r.connect(A.reverbS); }
  }
  const notes = (t, list, type, step, vol, dur) => list.forEach((m, i) => osc(t + i * step, type, mtof(m), mtof(m), dur || step * 1.6, vol));

  const SFX = {
    shot: (t) => osc(t, "square", 1300, 500, 0.06, 0.03),
    side: (t) => osc(t, "square", 900, 400, 0.05, 0.02),
    cannon: (t) => { osc(t, "sawtooth", 220, 70, 0.18, 0.08); noise(t, 0.12, "lowpass", 1800, 200, 1, 0.08); },
    laser: (t) => { osc(t, "sawtooth", 2600, 400, 0.14, 0.03); osc(t, "sine", 1800, 1200, 0.1, 0.02); },
    missile: (t) => noise(t, 0.3, "bandpass", 700, 2600, 3, 0.06),
    zap: (t) => { noise(t, 0.15, "bandpass", 3000, 1200, 5, 0.12); osc(t, "square", 80, 60, 0.12, 0.04); },
    mine: (t) => osc(t, "triangle", 300, 180, 0.08, 0.05),
    hit: (t) => osc(t, "square", 280, 190, 0.03, 0.022),
    ping: (t) => osc(t, "triangle", 2600, 1900, 0.05, 0.028),
    eshot: (t) => osc(t, "triangle", 760, 460, 0.08, 0.032),
    eshot2: (t) => osc(t, "square", 520, 240, 0.12, 0.03),
    boom: (t) => { noise(t, 0.45, "lowpass", 3800, 160, 1, 0.38, 0.3); osc(t, "sine", 150, 40, 0.35, 0.45); },
    boomBig: (t) => {
      noise(t, 1.1, "lowpass", 2800, 90, 1.2, 0.6, 0.6); noise(t + 0.05, 0.6, "highpass", 3000, 800, 0.5, 0.12);
      osc(t, "sine", 115, 26, 0.9, 0.8); osc(t + 0.08, "sine", 80, 30, 0.6, 0.4);
    },
    boomHuge: (t) => {
      noise(t, 2.6, "lowpass", 3200, 60, 1.4, 0.8, 0.9); noise(t + 0.1, 1.4, "bandpass", 1600, 200, 0.6, 0.25, 0.5);
      osc(t, "sine", 95, 20, 2.2, 1.0); osc(t + 0.25, "sine", 70, 24, 1.6, 0.5);
      for (let i = 0; i < 7; i++) noise(t + 0.25 + i * 0.2, 0.4, "lowpass", 2500, 150, 1, 0.25);
    },
    playerHit: (t) => { osc(t, "sawtooth", 260, 70, 0.25, 0.14); noise(t, 0.15, "lowpass", 2500, 300, 1, 0.15); },
    playerDie: (t) => { SFX.boomBig(t); osc(t, "square", 900, 60, 1.2, 0.08, "lin"); },
    credit: (t) => { osc(t, "sine", 1568, 1568, 0.06, 0.05); osc(t + 0.045, "sine", 2349, 2349, 0.09, 0.05); },
    pickup: (t) => notes(t, [72, 76, 79, 84], "square", 0.05, 0.05),
    power: (t) => notes(t, [60, 64, 67, 72, 76, 79, 84], "square", 0.045, 0.05),
    overdrive: (t) => { notes(t, [48, 55, 60, 67, 72, 79, 84, 91], "sawtooth", 0.05, 0.05); noise(t, 0.8, "bandpass", 300, 5000, 3, 0.15, 0.6); },
    bomb: (t) => { noise(t, 1.6, "lowpass", 200, 6000, 2, 0.4, 0.8); osc(t, "sine", 60, 30, 1.4, 0.8); osc(t, "sawtooth", 200, 1800, 0.8, 0.05); },
    menuMove: (t) => osc(t, "square", 700, 700, 0.03, 0.035),
    menuOk: (t) => { osc(t, "square", 880, 880, 0.05, 0.05); osc(t + 0.05, "square", 1320, 1320, 0.08, 0.05); },
    menuBack: (t) => { osc(t, "square", 600, 600, 0.05, 0.05); osc(t + 0.05, "square", 400, 400, 0.08, 0.05); },
    buy: (t) => notes(t, [84, 88, 91, 96], "sine", 0.05, 0.08),
    sell: (t) => notes(t, [96, 91, 88, 84], "sine", 0.05, 0.07),
    deny: (t) => osc(t, "square", 130, 110, 0.18, 0.08),
    alarm: (t) => { for (let i = 0; i < 6; i++) osc(t + i * 0.36, "square", i % 2 ? 520 : 690, i % 2 ? 520 : 690, 0.3, 0.06); },
    charge: (t) => osc(t, "sawtooth", 100, 800, 0.9, 0.05, "lin"),
    beam: (t) => { osc(t, "sawtooth", 90, 90, 1.2, 0.08); noise(t, 1.2, "bandpass", 900, 1400, 4, 0.08); },
    roar: (t) => { noise(t, 1.0, "lowpass", 700, 150, 3, 0.3, 0.6); osc(t, "sawtooth", 75, 45, 1.0, 0.12); },
    extra: (t) => notes(t, [67, 72, 76, 79, 84, 88], "square", 0.06, 0.06),
    merchant: (t) => { notes(t, [64, 71, 67, 74], "triangle", 0.07, 0.06); },
    secret: (t) => notes(t, [72, 79, 84, 88, 91, 96, 100], "sine", 0.06, 0.07, 0.4),
    secretOff: (t) => notes(t, [84, 79, 72, 67], "sine", 0.07, 0.07, 0.3),
  };
  const GAP = { shot: 0.05, side: 0.08, laser: 0.08, hit: 0.04, ping: 0.06, eshot: 0.06, eshot2: 0.08, boom: 0.05, credit: 0.04, mine: 0.1, zap: 0.08 };

  A.sfx = function (name) {
    if (!A.ctx || A.muted || A.ctx.state !== "running") return;
    const t = A.ctx.currentTime, last = A.lastSfx[name] || 0;
    if (t - last < (GAP[name] || 0.025)) return;
    A.lastSfx[name] = t;
    const f = SFX[name];
    if (f) f(t + 0.005);
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
    if (!text) return;
    A.said.push(text); if (A.said.length > 20) A.said.shift();
    if (!A.voiceOn || A.muted || !window.speechSynthesis) return;
    const now = performance.now();
    if (!opt.force && now - A.lastSay < (opt.gap || 700)) return;
    A.lastSay = now;
    try {
      if (opt.interrupt !== false) speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (voice || pickVoice()) u.voice = voice;
      u.lang = "en-US"; u.rate = opt.rate || 1.05; u.pitch = opt.pitch ?? 0.9; u.volume = Math.min(1, A.sfxVol + 0.2);
      speechSynthesis.speak(u);
    } catch (e) { /* speech not available */ }
  };

  A.jingle = function (name) {
    if (!A.ctx) return;
    A.stopMusic();
    const t = A.ctx.currentTime + 0.05;
    const seq = {
      clear: [[67, 0.12], [72, 0.12], [76, 0.12], [79, 0.36], [77, 0.12], [79, 0.6]],
      gameover: [[67, 0.4], [63, 0.4], [60, 0.4], [55, 1.2]],
      victory: [[67, 0.15], [67, 0.15], [67, 0.15], [72, 0.45], [70, 0.15], [72, 0.15], [76, 0.9], [79, 1.2]],
    }[name];
    if (!seq) return;
    let x = t;
    for (const [m, d] of seq) { voiceLead(x, m, d * 0.95, "square"); voiceLead(x, m - 12, d * 0.95, "soft"); x += d; }
  };
})(window.XA);
