/* X-Abyss: synthesized music (tracker style) and sound effects with the Web Audio API.
   All tunes are original compositions in the style of late-80s Amiga shoot'em-up soundtracks. */
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
  };
  const SONGS = {
    title: {
      bpm: 128, drums: DR.rock, bass: "R.RO.RR.R.RO.R5.", arp: 1, pad: true, lead: "square",
      chords: "Am Am F F C C G G Am Am F F Dm Dm E E",
      mel: "a4:4 c5:2 e5:2 a5:6 g5:2 e5:6 d5:2 c5:4 b4:4 a4:4 c5:2 f5:2 a5:6 g5:2 f5:6 e5:2 c5:4 a4:4 " +
        "g4:4 c5:2 e5:2 g5:6 a5:2 g5:4 e5:4 c5:4 e5:4 d5:4 g5:4 b5:6 a5:2 g5:8 r:4 b4:4 " +
        "c6:6 b5:2 a5:4 e5:4 a5:6 g5:2 e5:4 c5:4 c6:6 a5:2 f5:4 c5:4 f5:4 g5:4 a5:8 " +
        "d6:6 c6:2 a5:4 f5:4 a5:4 g5:4 f5:4 d5:4 e5:4 g#5:4 b5:4 d6:4 e6:12 r:4",
    },
    shop: {
      bpm: 104, drums: DR.calm, bass: "R...5...O...5.R.", arp: 2, pad: true, lead: "soft",
      chords: "Cmaj7 Am7 Dm7 G7 Cmaj7 Am7 Dm7 G7",
      mel: "e5:4 g5:4 b5:6 a5:2 g5:4 e5:4 c5:8 d5:4 f5:4 a5:6 c6:2 b5:8 g5:8 " +
        "e6:4 d6:2 c6:2 b5:4 g5:4 a5:4 c6:4 e6:8 f5:4 a5:4 c6:4 d6:4 b5:12 r:4",
    },
    level1: {
      bpm: 140, drums: DR.drive, bass: "R.RR.RO.R.RR.R5O", arp: 1, pad: false, lead: "square",
      chords: "Em C D Bm Em C D B",
      mel: "e5:3 e5:3 g5:2 b5:4 a5:2 g5:2 e5:4 r:2 c5:2 e5:2 g5:2 c6:4 b5:3 a5:3 f#5:2 d5:4 a5:4 b5:6 a5:2 f#5:4 d5:4 " +
        "e5:3 e5:3 g5:2 b5:4 e6:4 d6:4 c6:2 b5:2 g5:4 e5:4 f#5:4 a5:4 d6:4 c6:2 a5:2 b5:8 d#6:4 f#6:4",
    },
    level2: {
      bpm: 116, drums: DR.half, bass: "R..R..O.R..R.5O.", arp: 2, pad: true, lead: "saw",
      chords: "Dm Bb Gm A Dm Bb C A",
      mel: "d5:8 f5:4 a5:4 bb5:6 a5:2 f5:8 g5:4 bb5:4 d6:6 c6:2 c#6:8 a5:8 " +
        "d6:6 c6:2 a5:4 f5:4 g5:4 f5:4 d5:8 e5:4 g5:4 c6:4 e6:4 c#6:4 e6:4 a6:8",
    },
    level3: {
      bpm: 150, drums: DR.rock, bass: "RRORRORRRRORR5O5", arp: 1, pad: false, lead: "saw",
      chords: "Cm Ab Bb G Cm Ab Fm G",
      mel: "c5:2 c5:2 eb5:2 g5:2 c6:4 bb5:2 g5:2 ab5:4 g5:2 eb5:2 c5:4 eb5:4 d5:2 f5:2 bb5:4 d6:4 c6:2 bb5:2 b5:8 g5:4 d5:4 " +
        "c6:4 g5:2 eb5:2 c5:4 g5:4 ab5:4 c6:4 eb6:4 c6:4 f5:4 ab5:4 c6:4 f6:4 g6:4 f6:2 d6:2 b5:8",
    },
    level4: {
      bpm: 134, drums: DR.drive, bass: "R.R.O.R.R.R.5.O.", arp: 1, pad: true, lead: "square",
      chords: "F#m D E C# F#m D Bm C#",
      mel: "f#5:6 a5:2 c#6:4 f#6:4 e6:4 d6:4 a5:4 f#5:4 g#5:6 b5:2 e6:4 d6:2 c#6:2 c#6:8 g#5:8 " +
        "a5:4 c#6:4 f#6:6 e6:2 d6:4 c#6:4 a5:8 b5:4 d6:4 f#6:4 e6:2 d6:2 c#6:4 f6:4 g#6:8",
    },
    boss: {
      bpm: 160, drums: DR.boss, bass: "RRORRORRRRORRORO", arp: 1, pad: false, lead: "saw",
      chords: "Em F Em F Em F G F",
      mel: "e5:2 r:2 e5:2 f5:2 g5:4 b5:4 a5:2 r:2 c6:2 a5:2 f5:4 c5:4 e5:2 g5:2 b5:2 e6:2 d6:4 b5:4 c6:8 a5:8 " +
        "e6:4 b5:2 g5:2 e5:4 g5:4 f5:4 a5:4 c6:4 f6:4 g6:4 d6:2 b5:2 g5:4 d6:4 c6:8 b5:8",
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
    // Reverb (generated impulse response) for the underwater feel
    A.reverb = ctx.createConvolver();
    const len = Math.floor(ctx.sampleRate * 2.6), ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    A.reverb.buffer = ir;
    A.revMusic = ctx.createGain(); A.revMusic.gain.value = 0.35; A.revMusic.connect(A.musicBus);
    A.revSfx = ctx.createGain(); A.revSfx.gain.value = 0.45; A.revSfx.connect(A.sfxBus);
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
  function hat(t, dest, open) {
    const ctx = A.ctx, d = open ? 0.18 : 0.04, n = noiseSrc(t, d + 0.02), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = "highpass"; f.frequency.value = 7500;
    g.gain.setValueAtTime(open ? 0.07 : 0.06, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
    n.connect(f); f.connect(g); g.connect(dest);
  }

  function scheduleStep(s, step, t, sd) {
    const st = step % 16, bar = Math.floor(step / 16) % s.chords.length, ch = s.chords[bar];
    const bus = A.musicBus;
    if (s.drums.k[st] === "x") kick(t, bus);
    if (s.drums.s[st] === "x") snare(t, bus);
    if (s.drums.h[st] === "x") hat(t, bus, false);
    else if (s.drums.h[st] === "o") hat(t, bus, true);
    const b = s.bass[st];
    if (b !== ".") {
      let root = 36 + ch.pc; if (root > 43) root -= 12;
      const m = b === "O" ? root + 12 : b === "5" ? root + 7 : root;
      voiceBass(t, m, sd * 1.5);
    }
    if (s.arp) {
      const tones = ch.iv.concat([12]);
      const per = s.arp === 2 ? 1 : 2; // notes per 16th
      for (let k = 0; k < per; k++) {
        const idx = (step * per + k) % tones.length;
        voiceArp(t + (k * sd) / per, 60 + ch.pc + tones[idx] + (ch.pc > 6 ? -12 : 0), sd / per);
      }
    }
    if (s.pad && st === 0) voicePad(t, ch.iv.slice(0, 3).map((i) => 48 + ch.pc + i), sd * 16);
    const ev = s.melody.get(step % s.melLen);
    if (ev && ev.midi != null) voiceLead(t, ev.midi, ev.dur * sd, s.lead);
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
    pulse: (t) => osc(t, "square", 1100, 420, 0.07, 0.035),
    spread: (t) => { osc(t, "sawtooth", 700, 260, 0.08, 0.03); },
    laser: (t) => { osc(t, "sawtooth", 2200, 300, 0.16, 0.035); osc(t, "square", 1500, 900, 0.1, 0.015); },
    wave: (t) => osc(t, "sine", 420, 980, 0.1, 0.06),
    pod: (t) => osc(t, "triangle", 1500, 900, 0.04, 0.02),
    missile: (t) => noise(t, 0.3, "bandpass", 700, 2600, 3, 0.07),
    torpedo: (t) => { noise(t, 0.25, "lowpass", 1200, 200, 1, 0.08); osc(t, "sine", 300, 120, 0.2, 0.05); },
    hit: (t) => osc(t, "square", 260, 180, 0.03, 0.025),
    ping: (t) => osc(t, "triangle", 2400, 1800, 0.05, 0.03),
    eshot: (t) => osc(t, "triangle", 760, 480, 0.08, 0.035),
    eshot2: (t) => { osc(t, "square", 520, 260, 0.12, 0.03); },
    dart: (t) => noise(t, 0.35, "bandpass", 400, 2400, 2, 0.06),
    boom: (t) => {
      noise(t, 0.45, "lowpass", 3500, 160, 1, 0.38, 0.4);
      osc(t, "sine", 140, 38, 0.35, 0.45);
    },
    boomBig: (t) => {
      noise(t, 1.1, "lowpass", 2600, 90, 1.2, 0.6, 0.7);
      noise(t + 0.05, 0.6, "highpass", 3000, 800, 0.5, 0.12);
      osc(t, "sine", 110, 26, 0.9, 0.8);
      osc(t + 0.08, "sine", 80, 30, 0.6, 0.4);
    },
    boomHuge: (t) => {
      noise(t, 2.6, "lowpass", 3000, 60, 1.4, 0.8, 1.0);
      noise(t + 0.1, 1.4, "bandpass", 1600, 200, 0.6, 0.25, 0.6);
      osc(t, "sine", 95, 20, 2.2, 1.0);
      osc(t + 0.25, "sine", 70, 24, 1.6, 0.5);
      for (let i = 0; i < 6; i++) noise(t + 0.25 + i * 0.22, 0.4, "lowpass", 2500, 150, 1, 0.25);
    },
    playerHit: (t) => { osc(t, "sawtooth", 260, 70, 0.25, 0.14); noise(t, 0.15, "lowpass", 2500, 300, 1, 0.15); },
    playerDie: (t) => { SFX.boomBig(t); osc(t, "square", 900, 60, 1.2, 0.08, null, "lin"); },
    shield: (t) => osc(t, "sine", 1800, 600, 0.16, 0.08),
    gem: (t) => { osc(t, "sine", 1568, 1568, 0.07, 0.05); osc(t + 0.05, "sine", 2093, 2093, 0.1, 0.05); },
    pickup: (t) => notes(t, [72, 76, 79, 84], "square", 0.05, 0.05),
    power: (t) => notes(t, [60, 64, 67, 72, 76, 79, 84], "square", 0.045, 0.05),
    nova: (t) => {
      noise(t, 1.6, "lowpass", 200, 6000, 2, 0.4, 0.8);
      osc(t, "sine", 60, 30, 1.4, 0.8);
      osc(t, "sawtooth", 200, 1800, 0.8, 0.05);
    },
    formation: (t) => osc(t, "triangle", 500, 1000, 0.09, 0.07),
    menuMove: (t) => osc(t, "square", 700, 700, 0.03, 0.035),
    menuOk: (t) => { osc(t, "square", 880, 880, 0.05, 0.05); osc(t + 0.05, "square", 1320, 1320, 0.08, 0.05); },
    menuBack: (t) => { osc(t, "square", 600, 600, 0.05, 0.05); osc(t + 0.05, "square", 400, 400, 0.08, 0.05); },
    buy: (t) => notes(t, [84, 88, 91, 96], "sine", 0.05, 0.08),
    deny: (t) => osc(t, "square", 130, 110, 0.18, 0.08),
    alarm: (t) => { for (let i = 0; i < 6; i++) osc(t + i * 0.36, "square", i % 2 ? 520 : 690, i % 2 ? 520 : 690, 0.3, 0.06); },
    bounce: (t) => osc(t, "sine", 300, 600, 0.06, 0.03),
    erupt: (t) => noise(t, 1.2, "lowpass", 300, 1800, 2, 0.18),
    beam: (t) => { osc(t, "sawtooth", 90, 90, 1.2, 0.08); noise(t, 1.2, "bandpass", 900, 1400, 4, 0.08); },
    charge: (t) => osc(t, "sawtooth", 100, 800, 0.9, 0.05, null, "lin"),
    roar: (t) => { noise(t, 1.0, "lowpass", 600, 150, 3, 0.3, 0.6); osc(t, "sawtooth", 70, 45, 1.0, 0.12); },
    extra: (t) => notes(t, [67, 72, 76, 79, 84, 88], "square", 0.06, 0.06),
    secret: (t) => notes(t, [72, 79, 84, 88, 91, 96, 100], "sine", 0.06, 0.07, 0.4),
    secretOff: (t) => notes(t, [84, 79, 72, 67], "sine", 0.07, 0.07, 0.3),
  };
  const GAP = { pulse: 0.05, spread: 0.06, pod: 0.08, hit: 0.04, ping: 0.06, eshot: 0.06, eshot2: 0.08, boom: 0.05, gem: 0.04, bounce: 0.1 };

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
      victory: [[72, 0.15], [72, 0.15], [72, 0.15], [76, 0.45], [74, 0.15], [76, 0.15], [79, 0.9], [84, 1.2]],
    }[name];
    if (!seq) return;
    let x = t;
    for (const [m, d] of seq) { voiceLead(x, m, d * 0.95, "square"); voiceLead(x, m - 12, d * 0.95, "soft"); x += d; }
  };
})(window.XA);
