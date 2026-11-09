/* DREAMHOP: synthesized chiptune music and sound effects with the Web Audio API.
   All tunes are original compositions in the style of late-80s home computer platformers. */
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
    bounce: { k: "x.......x.......", s: "....x.......x...", h: "x.x.x.x.x.x.x.x." },
    march: { k: "x...x...x...x...", s: "....x.......x..x", h: "..x...x...x...x." },
    soft: { k: "x.........x.....", s: "....x.......x...", h: "x...x...x...x..." },
    fast: { k: "x.x...x.x.x...x.", s: "....x.......x...", h: "xxxxxxxxxxxxxxxx" },
    none: { k: "................", s: "................", h: "................" },
  };
  const SONGS = {
    title: {
      bpm: 118, drums: DR.soft, bass: "R...5...O...5...", arp: 2, pad: true, lead: "square",
      chords: "C Am F G C Am Dm G",
      mel: "e5:4 g5:2 c6:2 b5:4 g5:4 a5:4 c6:2 e6:2 d6:8 f5:4 a5:2 c6:2 d6:4 c6:2 a5:2 b5:4 g5:4 d5:8 " +
        "e5:4 g5:2 c6:2 e6:4 d6:2 c6:2 a5:4 c6:4 e6:8 d6:4 f6:2 e6:2 d6:4 a5:4 b5:4 d6:4 g6:8",
    },
    w1: {
      bpm: 132, drums: DR.bounce, bass: "R.5.R.5.R.5.O.5.", arp: 1, pad: false, lead: "square",
      chords: "G Em C D G Em Am D",
      mel: "d5:2 g5:2 b5:2 d6:2 b5:4 g5:2 a5:2 b5:2 g5:2 e5:4 r:4 e5:2 c5:2 e5:2 g5:2 c6:4 b5:2 a5:2 a5:2 f#5:2 d5:4 r:4 " +
        "d5:2 g5:2 b5:2 d6:2 g6:4 f#6:2 e6:2 d6:2 b5:2 g5:4 r:4 a5:2 c6:2 e6:2 c6:2 a5:4 b5:2 c6:2 d6:4 c6:2 a5:2 f#5:8",
    },
    w2: {
      bpm: 112, drums: DR.march, bass: "R..R..O.R..R.5..", arp: 2, pad: true, lead: "saw",
      chords: "Am F G Em Am F Dm E",
      mel: "a4:4 c5:4 e5:6 d5:2 c5:4 a4:4 f4:8 g4:4 b4:4 d5:6 c5:2 b4:4 g4:4 e4:8 " +
        "a5:4 g5:2 e5:2 c5:4 e5:4 f5:4 e5:2 c5:2 a4:8 d5:4 f5:4 a5:4 g5:2 f5:2 e5:4 g#5:4 b5:8",
    },
    w3: {
      bpm: 144, drums: DR.fast, bass: "R.O.R.O.5.O.R.O.", arp: 1, pad: false, lead: "square",
      chords: "F Dm Bb C F Dm Gm C",
      mel: "c6:2 a5:2 f5:2 a5:2 c6:4 d6:2 c6:2 a5:2 f5:2 d5:2 f5:2 a5:8 bb5:2 d6:2 f6:4 d6:2 bb5:2 c6:2 e6:2 g6:4 e6:2 c6:2 " +
        "f6:4 e6:2 d6:2 c6:4 a5:4 d6:4 c6:2 a5:2 f5:8 g5:2 bb5:2 d6:4 c6:2 bb5:2 g5:4 e5:4 c6:8",
    },
    w4: {
      bpm: 108, drums: DR.soft, bass: "R.....5.O.....5.", arp: 1, pad: true, lead: "soft",
      chords: "Eb Cm Ab Bb Eb Cm Fm Bb",
      mel: "g5:6 bb5:2 eb6:8 g5:4 c6:4 eb6:8 ab5:6 c6:2 eb6:4 c6:4 bb5:8 d6:8 " +
        "eb6:4 d6:2 c6:2 bb5:4 g5:4 c6:4 bb5:2 g5:2 eb5:8 f5:4 ab5:4 c6:4 f6:4 d6:8 bb5:8",
    },
    boss: {
      bpm: 156, drums: DR.fast, bass: "RRORRORRRRORRORO", arp: 1, pad: false, lead: "saw",
      chords: "Dm Dm Bb A Dm Dm Gm A",
      mel: "d5:2 r:2 d5:2 f5:2 a5:4 d6:4 c6:2 a5:2 f5:4 d5:8 bb4:2 d5:2 f5:4 bb5:4 a5:2 c#6:2 e6:4 a5:8 " +
        "d6:2 c6:2 a5:2 f5:2 d6:4 f6:4 e6:2 d6:2 a5:4 f5:8 g5:2 bb5:2 d6:4 g6:4 e6:2 c#6:2 a5:4 a4:8",
    },
    clear: {
      bpm: 120, drums: DR.soft, bass: "R...5...R...5...", arp: 2, pad: true, lead: "square",
      chords: "C F G C",
      mel: "c6:4 e6:4 g6:8 f6:4 a6:4 c7:8 b6:4 g6:4 d6:8 c6:16",
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
    const ctx = A.ctx, s = A.song, sd = 60 / (s.bpm * (A.tempo || 1)) / 4;
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
    jump: (t) => osc(t, "square", 300, 700, 0.12, 0.06, null, "lin"),
    stomp: (t) => { osc(t, "square", 500, 120, 0.12, 0.1); noise(t, 0.06, "lowpass", 1500, 300, 1, 0.12); },
    gem: (t) => { osc(t, "square", 1318, 1318, 0.05, 0.05); osc(t + 0.05, "square", 1975, 1975, 0.12, 0.05); },
    bump: (t) => osc(t, "triangle", 160, 90, 0.1, 0.18),
    brick: (t) => { noise(t, 0.25, "lowpass", 3000, 300, 1, 0.3); osc(t, "square", 200, 60, 0.15, 0.1); },
    sprout: (t) => notes(t, [60, 67, 72, 79], "square", 0.05, 0.05),
    power: (t) => notes(t, [60, 64, 67, 72, 76, 79, 84, 88], "square", 0.04, 0.06),
    shoot: (t) => osc(t, "square", 1200, 400, 0.08, 0.05),
    hurt: (t) => { osc(t, "sawtooth", 600, 150, 0.3, 0.1); },
    die: (t) => notes(t, [72, 71, 70, 69, 68, 67, 66, 60], "square", 0.08, 0.08),
    life: (t) => notes(t, [76, 79, 88, 84, 86, 91], "square", 0.08, 0.07),
    tick: (t) => osc(t, "square", 1600, 1600, 0.03, 0.04),
    door: (t) => notes(t, [72, 76, 79, 84, 88, 91, 96], "triangle", 0.06, 0.08),
    clock: (t) => { for (let i = 0; i < 4; i++) osc(t + i * 0.12, "square", 2000, 2000, 0.03, 0.05); },
    thunder: (t) => { noise(t, 1.2, "lowpass", 3000, 80, 1, 0.5, 0.6); osc(t, "sine", 90, 30, 0.9, 0.5); },
    shield: (t) => notes(t, [84, 88, 91, 96, 91, 96], "triangle", 0.05, 0.06),
    bounce: (t) => osc(t, "sine", 200, 600, 0.15, 0.1, null, "lin"),
    boss: (t) => { noise(t, 0.6, "lowpass", 800, 100, 2, 0.3, 0.5); osc(t, "sawtooth", 80, 40, 0.6, 0.15); },
    bossHit: (t) => { osc(t, "square", 300, 80, 0.2, 0.12); noise(t, 0.15, "bandpass", 1500, 400, 2, 0.15); },
    boom: (t) => { noise(t, 0.5, "lowpass", 3000, 100, 1, 0.4, 0.4); osc(t, "sine", 120, 35, 0.4, 0.5); },
    yawn: (t) => osc(t, "triangle", 500, 250, 0.6, 0.05),
    pop: (t) => osc(t, "sine", 400, 1200, 0.06, 0.08),
    menuMove: (t) => osc(t, "square", 700, 700, 0.03, 0.035),
    menuOk: (t) => { osc(t, "square", 880, 880, 0.05, 0.05); osc(t + 0.05, "square", 1320, 1320, 0.08, 0.05); },
    menuBack: (t) => { osc(t, "square", 600, 600, 0.05, 0.05); osc(t + 0.05, "square", 400, 400, 0.08, 0.05); },
    secret: (t) => notes(t, [72, 79, 84, 88, 91, 96, 100], "sine", 0.06, 0.07, 0.4),
    secretOff: (t) => notes(t, [84, 79, 72, 67], "sine", 0.07, 0.07, 0.3),
  };
  const GAP = { gem: 0.03, tick: 0.05, shoot: 0.06, stomp: 0.04, bump: 0.06 };

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
      start: [[67, 0.12], [72, 0.12], [76, 0.12], [79, 0.4]],
    }[name];
    if (!seq) return;
    let x = t;
    for (const [m, d] of seq) { voiceLead(x, m, d * 0.95, "square"); voiceLead(x, m - 12, d * 0.95, "soft"); x += d; }
  };
})(window.XA);
