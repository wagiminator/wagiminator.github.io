/* SUNSET HIGHWAY: synthesized radio stations, engine sound and effects (Web Audio API).
   All tunes are original compositions in the style of late-80s arcade racing music. */
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
    // Radio 1 – latin fusion
    coast: {
      bpm: 126, swing: 0.06, bassType: "funk", lead: "steel", stabType: "keys", title: "Coastline Cruise",
      drums: { k: "x..x..x...x..x..", s: "....x.......x...", c: "..x.......x....x", h: "x.xxx.xxx.xxx.xx", x: "................" },
      bass: "0..0.5.O..0.3.5.", stab: "..x..x....x..x..", arp: false,
      chords: "Fmaj7 Em7 Dm7 Cmaj7 Fmaj7 Em7 Dm7 G7",
      mel: "a5:2 c6:2 e6:4 d6:2 c6:2 a5:4 g5:2 b5:2 d6:6 c6:2 b5:4 f5:2 a5:2 c6:4 e6:2 f6:2 e6:4 d6:2 c6:2 b5:2 g5:2 c6:8 " +
        "a5:2 c6:2 f6:4 e6:2 c6:2 a5:4 b5:2 d6:2 g6:4 f6:2 e6:2 d6:4 a5:2 d6:2 f6:4 e6:2 d6:2 c6:4 b5:4 d6:4 g6:8",
    },
    // Radio 2 – city pop
    avenue: {
      bpm: 108, swing: 0.14, bassType: "funk", lead: "sax", stabType: "keys", pad: true, title: "Palm Avenue",
      drums: { k: "x.....x...x.....", s: "....x.......x...", c: "................", h: "x.x.x.x.x.x.x.xo", x: "................" },
      bass: "0...0.5.O.0.3.7.", stab: "...x.....x..x...",
      chords: "Ebmaj7 Dm7 Cm7 F7 Bbmaj7 Gm7 Cm7 F7",
      mel: "g5:4 bb5:2 d6:6 c6:2 bb5:2 a5:6 f5:2 a5:2 c6:6 eb6:4 d6:2 c6:2 a5:8 " +
        "d6:4 f6:2 d6:4 c6:2 bb5:4 g5:6 bb5:2 d6:4 c6:2 bb5:2 g5:4 c6:4 a5:2 f5:2 a5:8",
    },
    // Radio 3 – synth rock
    breeze: {
      bpm: 140, swing: 0, bassType: "funk", lead: "synth", stabType: "brass", title: "Breeze Rider",
      drums: { k: "x...x...x...x...", s: "....x.......x...", c: "....x.......x...", h: "xxoxxxoxxxoxxxox", x: "................" },
      bass: "0.0.0.0.0.0.0.5.", stab: "x.....x.....x...", arp: true,
      chords: "A F#m D E A F#m D E",
      mel: "e5:2 a5:2 c#6:4 b5:2 a5:2 e6:4 c#6:2 a5:2 f#5:4 a5:4 c#6:4 d6:2 c#6:2 b5:4 a5:2 f#5:2 e5:4 g#5:4 b5:4 e6:4 " +
        "a5:2 c#6:2 e6:4 f#6:2 e6:2 c#6:4 a5:2 c#6:2 f#6:6 e6:2 d6:4 f#6:4 a6:4 f#6:4 e6:4 d6:4 c#6:4 b5:4",
    },
    // Ending / highscores
    finale: {
      bpm: 84, swing: 0.1, bassType: "sub", lead: "sax", stabType: "keys", pad: true, title: "Last Wave",
      drums: { k: "x.........x.....", s: "....x.......x...", c: "................", h: "x.x.x.x.x.x.x.x.", x: "................" },
      bass: "0.......5...O...", stab: "x.......x.......",
      chords: "Cmaj7 Am7 Fmaj7 G Cmaj7 Am7 Dm7 G7",
      mel: "e5:4 g5:4 b5:8 c6:4 b5:2 a5:2 e5:8 f5:4 a5:4 c6:6 b5:2 g5:12 r:4 " +
        "e6:4 d6:2 c6:2 b5:4 g5:4 a5:4 c6:4 e6:8 d6:4 c6:4 a5:4 f5:4 g5:16",
    },
  };
  A.STATIONS = [["coast", "Coastline Cruise"], ["avenue", "Palm Avenue"], ["breeze", "Breeze Rider"]];

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
    if (kind === "steel") {
      // steel-drum impression: sine with an inharmonic partial and a quick decay
      o1.type = "sine"; o2.type = "sine"; o2.frequency.value = f * 2.76; o2.detune.value = 0;
      flt.frequency.value = 6000;
      lvl = 0.12;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(lvl, t + 0.004);
      g.gain.setTargetAtTime(lvl * 0.3, t + 0.01, 0.09); g.gain.setTargetAtTime(0.0001, t + Math.min(dur, 0.5), 0.12);
    } else if (kind === "sax") {
      o1.type = "sawtooth"; o2.type = "square"; o2.detune.value = 5;
      flt.Q.value = 5;
      flt.frequency.setValueAtTime(700, t); flt.frequency.linearRampToValueAtTime(2600, t + 0.06); flt.frequency.setTargetAtTime(1500, t + 0.08, 0.2);
      lvl = 0.05;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(lvl, t + 0.03);
      g.gain.setTargetAtTime(lvl * 0.8, t + 0.04, 0.1); g.gain.setTargetAtTime(0.0001, t + dur * 0.92, 0.06);
      const n = noiseSrc(t, 0.12), nf = ctx.createBiquadFilter(), ng = ctx.createGain();
      nf.type = "bandpass"; nf.frequency.value = f * 2; nf.Q.value = 2; ng.gain.setValueAtTime(0.03, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      n.connect(nf); nf.connect(ng); ng.connect(A.musicBus);
    } else if (kind === "synth") {
      o1.type = "square"; o2.type = "sawtooth";
      flt.frequency.setValueAtTime(1800, t); flt.frequency.linearRampToValueAtTime(5000, t + 0.02); flt.frequency.setTargetAtTime(2600, t + 0.04, 0.15);
      lvl = 0.05;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(lvl, t + 0.006);
      g.gain.setTargetAtTime(lvl * 0.75, t + 0.01, 0.1); g.gain.setTargetAtTime(0.0001, t + dur * 0.92, 0.06);
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
    o.type = type === "sub" ? "triangle" : type === "acid" ? "sawtooth" : "square";
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
    } else { flt.Q.value = 1; flt.frequency.value = 600; }
    const lvl = type === "sub" ? 0.3 : accent ? 0.2 : 0.15;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(lvl, t + 0.004);
    g.gain.setTargetAtTime(0.0001, t + dur * 0.8, 0.04);
    o.connect(flt); flt.connect(g); g.connect(A.musicBus);
    o.start(t); o.stop(t + dur + 0.3);
  }
  function voiceStab(t, midis, kind) {
    if (kind === "keys") {
      const ctx = A.ctx;
      for (const m of midis) {
        const f = mtof(m), g = ctx.createGain(), o = ctx.createOscillator(), b = ctx.createOscillator(), bg = ctx.createGain();
        o.type = "sine"; o.frequency.value = f; b.type = "sine"; b.frequency.value = f * 7; // tine + bell
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.045, t + 0.004); g.gain.setTargetAtTime(0.0001, t + 0.05, 0.25);
        bg.gain.setValueAtTime(0.012, t); bg.gain.exponentialRampToValueAtTime(0.0005, t + 0.15);
        o.connect(g); b.connect(bg); bg.connect(g); g.connect(A.musicBus); g.connect(A.revIn);
        o.start(t); b.start(t); o.stop(t + 1.2); b.stop(t + 0.3);
      }
      return;
    }
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
    if (d.s[st] === "x") snare(t, bus);
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
    if (s.pad && st === 0) voicePad(t, ch.iv.slice(0, 3).map((i) => 48 + ch.pc + i), sd * 16);
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
    shift: (t) => { noise(t, 0.06, "bandpass", 1200, 800, 3, 0.12); osc(t, "square", 160, 120, 0.05, 0.05); },
    bump: (t) => { noise(t, 0.2, "lowpass", 1500, 200, 1, 0.3); osc(t, "sine", 120, 50, 0.2, 0.4); },
    crash: (t) => {
      noise(t, 1.2, "lowpass", 4000, 120, 1, 0.6, 0.5); noise(t, 0.5, "highpass", 3000, 1500, 0.8, 0.25);
      osc(t, "sine", 110, 30, 0.6, 0.8);
      for (let i = 0; i < 5; i++) { osc(t + 0.15 + i * 0.12, "square", 400 + Math.random() * 600, 200, 0.06, 0.06); noise(t + 0.2 + i * 0.18, 0.15, "bandpass", 2500, 1200, 2, 0.12); }
    },
    boing: (t) => osc(t, "sine", 300, 900, 0.25, 0.15, "lin"),
    land: (t) => { noise(t, 0.15, "lowpass", 900, 200, 1, 0.25); osc(t, "sine", 90, 40, 0.15, 0.3); },
    beep: (t) => osc(t, "square", 880, 880, 0.12, 0.08),
    beepHi: (t) => osc(t, "square", 1760, 1760, 0.5, 0.09),
    horn: (t) => { osc(t, "sawtooth", 330, 330, 0.5, 0.06); osc(t, "sawtooth", 415, 415, 0.5, 0.05); },
    tick: (t) => osc(t, "square", 1500, 1500, 0.04, 0.05),
    checkpoint: (t) => notes(t, [72, 76, 79, 84, 79, 84], "square", 0.09, 0.07),
    extend: (t) => notes(t, [79, 84, 88, 91], "triangle", 0.07, 0.08),
    cheer: (t) => { for (let i = 0; i < 8; i++) noise(t + i * 0.08, 0.5, "bandpass", 900 + Math.random() * 1500, 700, 1.5, 0.06); },
    gull: (t) => { osc(t, "sine", 1800, 1200, 0.15, 0.05); osc(t + 0.17, "sine", 1900, 1300, 0.18, 0.05); },
    moo: (t) => osc(t, "sawtooth", 140, 110, 0.6, 0.06),
    whee: (t) => osc(t, "triangle", 600, 1400, 0.4, 0.06, "lin"),
    ouch: (t) => { osc(t, "square", 700, 300, 0.2, 0.05); },
    slap: (t) => noise(t, 0.08, "highpass", 2500, 1500, 1, 0.3),
    goal: (t) => notes(t, [72, 76, 79, 84, 84, 88, 91, 96], "square", 0.12, 0.07, 0.3),
    menuMove: (t) => osc(t, "square", 700, 700, 0.03, 0.035),
    menuOk: (t) => { osc(t, "square", 880, 880, 0.05, 0.05); osc(t + 0.05, "square", 1320, 1320, 0.08, 0.05); },
    menuBack: (t) => { osc(t, "square", 600, 600, 0.05, 0.05); osc(t + 0.05, "square", 400, 400, 0.08, 0.05); },
    tune: (t) => noise(t, 0.35, "bandpass", 500, 3000, 4, 0.08),
    extra: (t) => notes(t, [67, 72, 76, 79, 84, 88], "square", 0.06, 0.06),
    secret: (t) => notes(t, [72, 79, 84, 88, 91, 96, 100], "sine", 0.06, 0.07, 0.4),
    secretOff: (t) => notes(t, [84, 79, 72, 67], "sine", 0.07, 0.07, 0.3),
  };
  const GAP = { bump: 0.25, tick: 0.05, gull: 0.8, moo: 1.5, whee: 1.2, ouch: 0.5 };

  /* ---------- Engine, tyres, wind ---------- */
  A.engineOn = function (on) {
    if (!A.ctx) return;
    const ctx = A.ctx;
    if (on && !A.eng) {
      const out = ctx.createGain(); out.gain.value = 0; out.connect(A.sfxBus);
      const flt = ctx.createBiquadFilter(); flt.type = "lowpass"; flt.frequency.value = 600; flt.Q.value = 3; flt.connect(out);
      const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), o3 = ctx.createOscillator();
      o1.type = "sawtooth"; o2.type = "square"; o3.type = "sawtooth";
      const g2 = ctx.createGain(); g2.gain.value = 0.5; const g3 = ctx.createGain(); g3.gain.value = 0.3;
      o1.connect(flt); o2.connect(g2); g2.connect(flt); o3.connect(g3); g3.connect(flt);
      for (const o of [o1, o2, o3]) o.start();
      // tyre squeal and off-road rumble share a noise source
      const n = ctx.createBufferSource(); n.buffer = A.noiseBuf; n.loop = true; n.start();
      const sq = ctx.createBiquadFilter(); sq.type = "bandpass"; sq.frequency.value = 2400; sq.Q.value = 8;
      const sqg = ctx.createGain(); sqg.gain.value = 0; n.connect(sq); sq.connect(sqg); sqg.connect(A.sfxBus);
      const rb = ctx.createBiquadFilter(); rb.type = "lowpass"; rb.frequency.value = 300;
      const rbg = ctx.createGain(); rbg.gain.value = 0; n.connect(rb); rb.connect(rbg); rbg.connect(A.sfxBus);
      const wf = ctx.createBiquadFilter(); wf.type = "bandpass"; wf.frequency.value = 800; wf.Q.value = 0.5;
      const wg = ctx.createGain(); wg.gain.value = 0; n.connect(wf); wf.connect(wg); wg.connect(A.sfxBus);
      A.eng = { out, flt, o1, o2, o3, sqg, rbg, wg, n, nodes: [o1, o2, o3, n] };
    } else if (!on && A.eng) {
      const e = A.eng; A.eng = null;
      const t = ctx.currentTime;
      for (const g of [e.out, e.sqg, e.rbg, e.wg]) g.gain.setTargetAtTime(0, t, 0.05);
      setTimeout(() => { for (const o of e.nodes) try { o.stop(); } catch (err) { /* already stopped */ } }, 400);
    }
  };
  // rpm 0..1, throttle 0..1, squeal 0..1, rumble 0..1, wind 0..1
  A.engineSet = function (rpm, throttle, squeal, rumble, wind) {
    const e = A.eng;
    if (!e) return;
    const t = A.ctx.currentTime, f = 38 + rpm * 120;
    e.o1.frequency.setTargetAtTime(f, t, 0.03); e.o2.frequency.setTargetAtTime(f * 0.5, t, 0.03); e.o3.frequency.setTargetAtTime(f * 1.505, t, 0.03);
    e.flt.frequency.setTargetAtTime(350 + rpm * 1400 + throttle * 600, t, 0.05);
    e.out.gain.setTargetAtTime(A.muted ? 0 : 0.07 + throttle * 0.07 + rpm * 0.04, t, 0.05);
    e.sqg.gain.setTargetAtTime(squeal * 0.12, t, 0.04);
    e.rbg.gain.setTargetAtTime(rumble * 0.35, t, 0.04);
    e.wg.gain.setTargetAtTime(wind * 0.05, t, 0.1);
  };

  A.sfx = function (name) {
    if (!A.ctx || A.muted || A.ctx.state !== "running") return;
    const t = A.ctx.currentTime, last = A.lastSfx[name] || 0;
    if (t - last < (GAP[name] || 0.025)) return;
    A.lastSfx[name] = t;
    const f = SFX[name];
    if (f) f(t + 0.005);
  };

  A.jingle = function (name) {
    if (!A.ctx) return;
    A.stopMusic();
    const t = A.ctx.currentTime + 0.05;
    const seq = {
      clear: [[67, 0.12], [72, 0.12], [76, 0.12], [79, 0.36], [77, 0.12], [79, 0.6]],
      goal: [[72, 0.15], [72, 0.15], [76, 0.15], [79, 0.45], [77, 0.15], [79, 0.15], [84, 0.9]],
      gameover: [[67, 0.4], [63, 0.4], [60, 0.4], [55, 1.2]],
      victory: [[67, 0.15], [67, 0.15], [67, 0.15], [72, 0.45], [70, 0.15], [72, 0.15], [76, 0.9], [79, 1.2]],
    }[name];
    if (!seq) return;
    let x = t;
    for (const [m, d] of seq) { voiceLead(x, m, d * 0.95, "square"); voiceLead(x, m - 12, d * 0.95, "soft"); x += d; }
  };
})(window.XA);
