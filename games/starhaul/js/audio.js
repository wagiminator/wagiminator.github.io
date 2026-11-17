/* STARHAUL: synthesized music (title, docking, several space moods, combat, a docking waltz), engine hum and sound effects (Web Audio).
   All tunes are original, except the docking waltz, which is an arrangement of "The Blue Danube" by Johann Strauss II (1866, public domain). */
"use strict";

(function (XA) {
  const Store = XA.Store, U = XA.U;
  const A = (XA.Audio = {
    ctx: null, musicVol: Store.get("musicVol", 0.7), sfxVol: Store.get("sfxVol", 0.8), muted: false,
    song: null, songName: null, step: 0, nextTime: 0, lastSfx: {},
  });

  // mix: the music sits below the effects, so lasers and hits stay audible during a fight
  const MUSIC_GAIN = 0.26, SFX_GAIN = 1.9;
  // the music is scheduled this far ahead, so a busy moment of the game (building a star
  // system, compiling shaders) does not leave gaps in it
  const AHEAD = 0.6;

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
    drive: { k: "x...x...x...x...", s: "....x.......x..x", h: ".xx..xx..xx..xxo" },
    funk: { k: "x..x..x...x..x..", s: "....x.......x...", h: "xxxxxxxxxxxxxxxx" },
    calm: { k: "x.........x.....", s: "....x.......x...", h: "x...x...x...x..." },
    taiko: { k: "x..x....x.x.x...", s: "......x.......x.", h: "................" },
    epic: { k: "x.x.x.x.x.x.x.x.", s: "....x..x....x.xx", h: "xxxxxxxxxxxxxxxx" },
    none: { k: "................", s: "................", h: "................" },
    waltz: { k: "x...........", s: "....x...x...", h: "............" },
  };
  const SONGS = {
    title: { bpm: 112, drums: DR.drive, bass: "R...R.R.R...5.O.", arp: 2, pad: true, lead: "saw",
      chords: "Dm Bb F C Dm Bb Gm A",
      mel: "a5:4 d6:4 e6:2 f6:2 e6:2 d6:2 c6:4 a5:4 f5:8 a5:4 c6:4 g6:8 e6:8 " +
        "f6:4 e6:2 d6:2 a5:8 bb5:4 d6:4 f6:4 bb6:4 a6:8 g6:4 f6:4 e6:8 c#6:8" },
    docked: { bpm: 92, drums: DR.calm, bass: "R.....5.R...O...", arp: 2, pad: true, lead: "soft",
      chords: "Fmaj7 Em7 Dm7 Cmaj7 Fmaj7 Em7 Am7 G7",
      mel: "a5:6 g5:2 e5:8 g5:6 f5:2 d5:8 f5:4 a5:4 c6:4 b5:4 g5:16 " +
        "a5:4 c6:4 e6:6 d6:2 b5:8 c6:4 a5:4 e5:8 d5:4 f5:4 a5:4 g5:4 b5:16" },
    void: { bpm: 70, drums: DR.none, bass: "R...............", arp: 2, pad: true, lead: "soft",
      chords: "Am Fmaj7 C G Am Fmaj7 Em Em",
      mel: "e5:12 a5:4 g5:16 c6:8 b5:8 g5:16 e5:12 c5:4 d5:16 b4:16 e5:16" },
    frontier: { bpm: 100, drums: DR.calm, bass: "R...5...R...5...", arp: 1, pad: true, lead: "soft",
      chords: "G D Em C G D C D",
      mel: "b5:4 d6:4 g6:6 f#6:2 e6:4 d6:4 b5:8 c6:4 e6:4 g6:4 e6:4 d6:16 " +
        "b5:4 d6:4 g6:4 a6:4 b6:8 a6:4 f#6:4 e6:4 g6:4 c6:8 d6:4 e6:4 f#6:4 a6:4" },
    forge: { bpm: 124, drums: DR.drive, bass: "RRORRORRRRORR5RO", arp: 1, pad: false, lead: "square",
      chords: "Em Em C D Em Em C B",
      mel: "e5:2 r:2 e5:2 g5:2 b5:4 e6:4 d6:2 b5:2 a5:2 g5:2 a5:8 c6:4 b5:4 g5:4 e5:4 f#5:8 d6:8 " +
        "e6:2 r:2 e6:2 d6:2 b5:4 g5:4 b5:2 g5:2 e5:2 g5:2 a5:8 c6:2 b5:2 a5:2 g5:2 e5:4 g5:4 f#5:4 a5:4 b5:8" },
    outlaw: { bpm: 108, drums: DR.funk, bass: "R..R..R.R..O..5.", arp: 0, pad: true, lead: "saw",
      chords: "Cm Cm Ab G Cm Cm Fm G",
      mel: "c5:4 eb5:2 g5:2 c6:4 bb5:2 g5:2 ab5:8 g5:8 f5:4 ab5:4 c6:4 eb6:4 d6:8 b5:8 " +
        "c6:2 c6:2 eb6:2 c6:2 g5:4 eb5:4 f5:2 ab5:2 c6:2 f6:2 eb6:8 d6:2 c6:2 b5:2 g5:2 d6:8 b5:8" },
    combat: { bpm: 150, drums: DR.epic, bass: "R.RO.RR.R.RO.R5.", arp: 1, pad: false, lead: "saw",
      chords: "Am Am F G Am Am Dm E",
      mel: "a5:2 r:2 a5:2 c6:2 e6:4 a6:4 g6:2 e6:2 d6:2 c6:2 d6:8 e6:4 c6:4 a5:4 c6:4 b5:8 g5:8 " +
        "a5:2 c6:2 e6:2 a6:2 g6:2 e6:2 c6:2 e6:2 f6:4 e6:4 d6:4 c6:4 d6:4 f6:4 a6:4 g#6:4 b6:8 e6:8" },
    alien: { bpm: 84, drums: DR.taiko, bass: "R.......R..b....", arp: 2, pad: true, lead: "saw",
      chords: "Ebm Ebm Cdim Cdim Ebm Ebm Bdim D",
      mel: "eb5:8 gb5:4 a5:4 c6:16 a5:8 gb5:8 eb5:16 bb5:4 a5:4 gb5:8 eb5:16 d5:16" },
    // "The Blue Danube" (Johann Strauss II, 1866) – public domain, arranged as the docking waltz
    waltz: { bpm: 168, bar: 12, drums: DR.waltz, bass: "R.......5...", arp: 0, pad: false, lead: "soft",
      chords: "D D D D D D A7 A7 A7 A7 A7 A7 A7 A7 D D D D D D D D G G Em Em A7 A7 D A7 A7 D",
      mel: "d5:4 f#5:4 a5:4 a5:12 r:4 a6:4 a6:4 r:4 f#6:4 f#6:4 d5:4 f#5:4 a5:4 a5:12 r:4 a6:4 a6:4 r:4 g6:4 g6:4 " +
        "c#5:4 e5:4 b5:4 b5:12 r:4 b6:4 b6:4 r:4 g6:4 g6:4 c#5:4 e5:4 b5:4 b5:12 r:4 b6:4 b6:4 r:4 f#6:4 f#6:4 " +
        "d5:4 f#5:4 a5:4 d6:12 r:4 d7:4 d7:4 r:4 a6:4 a6:4 d5:4 f#5:4 a5:4 d6:12 r:4 d7:4 d7:4 r:4 b6:4 b6:4 " +
        "e5:4 g5:4 b5:4 b5:12 r:4 c#6:4 d6:4 e6:12 a5:4 d6:4 f#6:4 e6:12 a5:4 b5:4 c#6:4 d6:12" },
  };
  A.SPACE_SONGS = ["void", "frontier", "forge", "outlaw"];


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
    s.bar = def.bar || 16;
    s.len = s.chords.length * s.bar;
    return s;
  }

  /* ---------- Audio graph ---------- */
  A.init = function () {
    if (A.ctx) { if (A.ctx.state === "suspended") A.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (A.ctx = new AC());
    A.comp = ctx.createDynamicsCompressor();
    A.comp.threshold.value = -10; A.comp.ratio.value = 6; A.comp.attack.value = 0.004; A.comp.release.value = 0.2;
    A.comp.connect(ctx.destination);
    A.master = ctx.createGain(); A.master.gain.value = 1; A.master.connect(A.comp);
    A.musicBus = ctx.createGain(); A.musicBus.gain.value = A.musicVol * MUSIC_GAIN; A.musicBus.connect(A.master);
    A.sfxBus = ctx.createGain(); A.sfxBus.gain.value = A.sfxVol * SFX_GAIN; A.sfxBus.connect(A.master);
    // Reverb (generated impulse response) for the underwater feel
    A.reverb = ctx.createConvolver();
    const len = Math.floor(ctx.sampleRate * 1.8), ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4);
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
    newSongBus();
    setInterval(tick, 25);
    if (A.pendingSong) { const s = A.pendingSong; A.pendingSong = null; A.playSong(s); }
  };

  A.setMusicVol = (v) => { A.musicVol = v; Store.set("musicVol", v); if (A.musicBus) A.musicBus.gain.value = v * MUSIC_GAIN; };
  A.setSfxVol = (v) => { A.sfxVol = v; Store.set("sfxVol", v); if (A.sfxBus) A.sfxBus.gain.value = v * SFX_GAIN; };
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
    let lvl = kind === "soft" ? 0.11 : kind === "saw" ? 0.07 : 0.06;
    if (kind === "koto") {
      o1.type = "triangle"; o2.type = "sawtooth"; o2.detune.value = 3;
      flt.frequency.setValueAtTime(5000, t); flt.frequency.exponentialRampToValueAtTime(700, t + 0.3);
      lvl = 0.1;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(lvl, t + 0.003);
      g.gain.setTargetAtTime(0.0001, t + 0.01, Math.min(0.5, dur * 0.6));
    } else env(g, t, 0.008, lvl, dur * 0.9, 0.07, lvl * 0.75);
    o1.connect(flt); o2.connect(flt); flt.connect(g);
    g.connect(A.songBus || A.musicBus); g.connect(A.delay); g.connect(A.revIn);
    const end = t + dur + 0.6;
    for (const o of [o1, o2, lfo]) { o.start(t); o.stop(end); }
  }
  function voiceArp(t, midi, dur) {
    const ctx = A.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "square"; o.frequency.value = mtof(midi);
    g.gain.setValueAtTime(0.028, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.95);
    o.connect(g); g.connect(A.songBus); g.connect(A.revIn);
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
    o.connect(flt); o2.connect(flt); flt.connect(g); g.connect(A.songBus);
    o.start(t); o2.start(t); o.stop(t + dur + 0.3); o2.stop(t + dur + 0.3);
  }
  function voicePad(t, midis, dur) {
    const ctx = A.ctx, g = ctx.createGain(), flt = ctx.createBiquadFilter();
    flt.type = "lowpass"; flt.frequency.value = 900; flt.Q.value = 0.7;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05, t + dur * 0.3);
    g.gain.setTargetAtTime(0.0001, t + dur * 0.85, 0.15);
    flt.connect(g); g.connect(A.songBus); g.connect(A.revIn);
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
    const BL = s.bar, st = step % BL, bar = Math.floor(step / BL) % s.chords.length, ch = s.chords[bar];
    const bus = A.songBus;
    if (s.drums.k[st] === "x") kick(t, bus);
    if (s.drums.s[st] === "x") snare(t, bus);
    if (s.drums.h[st] === "x") hat(t, bus, false);
    else if (s.drums.h[st] === "o") hat(t, bus, true);
    const b = s.bass[st];
    if (b !== ".") {
      let root = 36 + ch.pc; if (root > 43) root -= 12;
      const m = b === "O" ? root + 12 : b === "5" ? root + 7 : b === "b" ? root + 6 : root;
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
    if (s.pad && st === 0) voicePad(t, ch.iv.slice(0, 3).map((i) => 48 + ch.pc + i), sd * BL);
    const ev = s.melody.get(step % s.melLen);
    if (ev && ev.midi != null) voiceLead(t, ev.midi, ev.dur * sd, s.lead);
  }

  function tick() {
    if (!A.ctx || !A.song) return;
    const ctx = A.ctx, s = A.song, sd = 60 / s.bpm / 4, now = ctx.currentTime;
    if (A.nextTime < now - 2) A.nextTime = now + 0.05;                      // the tab was in the background
    // late after a long stall: skip the missed steps, but stay on the beat
    while (A.nextTime < now) { A.nextTime += sd; A.step++; }
    while (A.nextTime < now + AHEAD) {
      scheduleStep(s, A.step, A.nextTime, sd);
      A.nextTime += sd;
      A.step++;
    }
  }
  A.tick = tick;

  A.playSong = function (name) {
    if (A.songName === name) return;
    A.songName = name;
    if (!A.ctx) { A.pendingSong = name; return; }
    const def = SONGS[name];
    if (!def) { A.song = null; return; }
    if (!def._p) def._p = prepare(def);
    newSongBus();
    A.song = def._p;
    A.step = 0;
    A.nextTime = A.ctx.currentTime + 0.1;
    A.delay.delayTime.value = (60 / def.bpm) * 0.75;
  };
  A.stopMusic = function () { A.song = null; A.songName = null; A.pendingSong = null; if (A.ctx) newSongBus(); };
  // fade out the notes already scheduled for the old song and start a fresh bus
  function newSongBus() {
    const ctx = A.ctx, t = ctx.currentTime, old = A.songBus;
    if (old) { old.gain.setTargetAtTime(0, t, 0.05); setTimeout(() => old.disconnect(), (AHEAD + 1) * 1000); }
    A.songBus = ctx.createGain(); A.songBus.connect(A.musicBus);
  }

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
    pulse: (t) => { osc(t, "square", 1400, 300, 0.12, 0.14); noise(t, 0.06, "highpass", 3000, 2000, 1, 0.08); },
    beam: (t) => { osc(t, "sawtooth", 900, 700, 0.09, 0.08); osc(t, "square", 1800, 1700, 0.09, 0.04); },
    military: (t) => { osc(t, "sawtooth", 2200, 500, 0.1, 0.11); osc(t, "square", 600, 200, 0.1, 0.08); },
    mining: (t) => { osc(t, "square", 300, 120, 0.2, 0.14); noise(t, 0.15, "bandpass", 500, 900, 2, 0.12); },
    enemyLaser: (t) => { osc(t, "square", 900, 200, 0.14, 0.08); },
    hitShield: (t) => { osc(t, "sine", 500, 1200, 0.15, 0.12); noise(t, 0.1, "bandpass", 2000, 4000, 3, 0.08); },
    hitHull: (t) => { noise(t, 0.3, "lowpass", 2000, 150, 1, 0.4, 0.2); osc(t, "sine", 120, 40, 0.25, 0.4); },
    hitEnemy: (t) => { noise(t, 0.12, "bandpass", 1500, 600, 2, 0.2); },
    explodeS: (t) => { noise(t, 1.0, "lowpass", 3000, 80, 1, 0.6, 0.5); osc(t, "sine", 90, 25, 0.8, 0.5); },
    explodeL: (t) => { noise(t, 2.6, "lowpass", 2500, 40, 1, 0.9, 0.9); osc(t, "sine", 70, 18, 2.2, 0.8); noise(t + 0.15, 1.6, "bandpass", 600, 100, 1, 0.4, 0.6); },
    missile: (t) => { noise(t, 0.8, "bandpass", 600, 2400, 1.5, 0.25, 0.3); osc(t, "sawtooth", 100, 500, 0.6, 0.05); },
    lock: (t) => { osc(t, "square", 1760, 1760, 0.06, 0.06); osc(t + 0.09, "square", 1760, 1760, 0.06, 0.06); },
    ecm: (t) => { for (let i = 0; i < 8; i++) osc(t + i * 0.06, "sawtooth", 200 + i * 300, 3000, 0.08, 0.05); noise(t, 0.6, "highpass", 2000, 6000, 1, 0.1); },
    bomb: (t) => { osc(t, "sine", 60, 1500, 0.4, 0.2, null, "lin"); noise(t + 0.3, 2.5, "lowpass", 5000, 60, 1, 0.9, 0.9); },
    alarm: (t) => { osc(t, "square", 880, 660, 0.18, 0.06); osc(t + 0.2, "square", 880, 660, 0.18, 0.06); },
    beep: (t) => osc(t, "sine", 1200, 1200, 0.07, 0.07),
    dock: (t) => { noise(t, 0.4, "lowpass", 800, 100, 1, 0.5, 0.4); osc(t, "square", 120, 80, 0.3, 0.15); osc(t + 0.25, "sine", 880, 880, 0.3, 0.06); },
    launch: (t) => { noise(t, 1.6, "bandpass", 200, 1600, 1, 0.3, 0.5); osc(t, "sawtooth", 60, 300, 1.4, 0.08, null, "lin"); },
    hyperCharge: (t) => { osc(t, "sawtooth", 80, 1600, 2.5, 0.06, null, "lin"); osc(t, "sine", 40, 800, 2.5, 0.1, null, "lin"); },
    hyper: (t) => { noise(t, 2.5, "bandpass", 100, 4000, 0.7, 0.5, 0.9); osc(t, "sawtooth", 2000, 50, 2.0, 0.1); },
    jumpOn: (t) => { osc(t, "sawtooth", 200, 900, 0.5, 0.06); noise(t, 0.5, "highpass", 1000, 4000, 1, 0.1); },
    jumpOff: (t) => { osc(t, "sawtooth", 900, 150, 0.5, 0.06); },
    scoop: (t) => { osc(t, "sine", 400, 1600, 0.25, 0.12); osc(t + 0.12, "sine", 800, 2400, 0.2, 0.08); },
    fuel: (t) => osc(t, "sine", 300, 500, 0.15, 0.04),
    buy: (t) => { osc(t, "square", 1320, 1320, 0.05, 0.05); osc(t + 0.05, "square", 1760, 1760, 0.09, 0.05); },
    sell: (t) => { osc(t, "square", 1760, 1760, 0.05, 0.05); osc(t + 0.05, "square", 2349, 2349, 0.09, 0.05); osc(t + 0.12, "sine", 3520, 3520, 0.12, 0.04); },
    deny: (t) => { osc(t, "square", 200, 150, 0.2, 0.08); },
    pod: (t) => { noise(t, 0.6, "bandpass", 400, 2000, 1, 0.3); osc(t, "square", 400, 1200, 0.5, 0.05); },
    message: (t) => { osc(t, "sine", 1046, 1046, 0.08, 0.06); osc(t + 0.09, "sine", 1568, 1568, 0.12, 0.06); },
    menuMove: (t) => osc(t, "square", 700, 700, 0.03, 0.035),
    menuOk: (t) => { osc(t, "square", 880, 880, 0.05, 0.05); osc(t + 0.05, "square", 1320, 1320, 0.08, 0.05); },
    menuBack: (t) => { osc(t, "square", 600, 600, 0.05, 0.05); osc(t + 0.05, "square", 400, 400, 0.08, 0.05); },
    secret: (t) => notes(t, [72, 79, 84, 88, 91, 96, 100], "sine", 0.06, 0.07, 0.4),
    secretOff: (t) => notes(t, [84, 79, 72, 67], "sine", 0.07, 0.07, 0.3),
  };
  const GAP = { beam: 0.06, military: 0.06, hitEnemy: 0.05, fuel: 0.2, enemyLaser: 0.05 };

  A.sfx = function (name, vol) {
    if (!A.ctx || A.muted) return;
    if (A.ctx.state !== "running") { A.ctx.resume(); if (A.ctx.state === "closed") return; }
    const t = A.ctx.currentTime, last = A.lastSfx[name] || 0;
    if (t - last < (GAP[name] || 0.025)) return;
    A.lastSfx[name] = t;
    const f = SFX[name];
    if (f) f(t + 0.005);
  };

  /* ---------- Engine hum: a constant drone that follows the throttle ---------- */
  A.setEngine = function (level, jump) {
    if (!A.ctx || A.ctx.state !== "running") return;
    if (!A.eng) {
      const ctx = A.ctx;
      const n = ctx.createBufferSource(); n.buffer = A.noiseBuf; n.loop = true;
      const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 300; f.Q.value = 3;
      const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = 40;
      const of = ctx.createBiquadFilter(); of.type = "lowpass"; of.frequency.value = 180;
      const g = ctx.createGain(); g.gain.value = 0;
      n.connect(f); f.connect(g); o.connect(of); of.connect(g); g.connect(A.sfxBus);
      n.start(); o.start();
      A.eng = { f, o, g };
    }
    const e = A.eng, t = A.ctx.currentTime, l = U.clamp(level, 0, 1);
    e.g.gain.setTargetAtTime(level < 0 ? 0 : 0.022 + l * 0.05 + (jump ? 0.04 : 0), t, 0.15);
    e.f.frequency.setTargetAtTime(200 + l * 700 + (jump ? 1800 : 0), t, 0.2);
    e.o.frequency.setTargetAtTime(35 + l * 30 + (jump ? 60 : 0), t, 0.2);
  };

  A.jingle = function (name) {
    if (!A.ctx) return;
    A.stopMusic();
    const t = A.ctx.currentTime + 0.05;
    const seq = {
      clear: [[72, 0.12], [76, 0.12], [79, 0.12], [84, 0.36], [83, 0.12], [84, 0.6]],
      gameover: [[69, 0.4], [65, 0.4], [62, 0.4], [57, 1.2]],
      rank: [[72, 0.15], [76, 0.15], [79, 0.15], [84, 0.45], [79, 0.15], [84, 0.9]],
    }[name];
    if (!seq) return;
    let x = t;
    for (const [m, d] of seq) { voiceLead(x, m, d * 0.95, "square"); voiceLead(x, m - 12, d * 0.95, "soft"); x += d; }
  };
})(window.XA);
