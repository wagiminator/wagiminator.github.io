/* Synthesized music, sound effects and speech (Web Audio + Speech API). The songs and effects are added by each game. */

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
  const DR = (A.DR = {
    drive: { k: "x...x...x...x...", s: "....x.......x..x", h: ".xx..xx..xx..xxo" },
    funk: { k: "x..x..x...x..x..", s: "....x.......x...", h: "xxxxxxxxxxxxxxxx" },
    calm: { k: "x.........x.....", s: "....x.......x...", h: "x...x...x...x..." },
    taiko: { k: "x..x....x.x.x...", s: "......x.......x.", h: "................" },
    epic: { k: "x.x.x.x.x.x.x.x.", s: "....x..x....x.xx", h: "xxxxxxxxxxxxxxxx" },
    rock: { k: "x.......x.x.....", s: "....x.......x...", h: "x.x.x.x.x.x.x.xo" },
    bounce: { k: "x.......x.......", s: "....x.......x...", h: "x.x.x.x.x.x.x.x." },
    techno: { k: "x...x...x...x...", s: "....x.......x...", h: "..x...x...x...x." },
    breaks: { k: "x.....x...x.....", s: "....x.......x..x", h: "x.xxx.xxx.xxx.xx" },
    none: { k: "................", s: "................", h: "................" },
    waltz: { k: "x...........", s: "....x...x...", h: "............" },
  });
  const SONGS = (A.SONGS = {});


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
    let lvl = kind === "soft" ? 0.11 : kind === "saw" ? 0.07 : 0.06;
    if (kind === "koto") {
      o1.type = "triangle"; o2.type = "sawtooth"; o2.detune.value = 3;
      flt.frequency.setValueAtTime(5000, t); flt.frequency.exponentialRampToValueAtTime(700, t + 0.3);
      lvl = 0.1;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(lvl, t + 0.003);
      g.gain.setTargetAtTime(0.0001, t + 0.01, Math.min(0.5, dur * 0.6));
    } else env(g, t, 0.008, lvl, dur * 0.9, 0.07, lvl * 0.75);
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
    const BL = s.bar, st = step % BL, bar = Math.floor(step / BL) % s.chords.length, ch = s.chords[bar];
    const bus = A.musicBus;
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

  const SFX = (A.SFX = {});
  A.fx = { osc, noise, notes, mtof, voiceLead };
  const GAP = (A.GAP = {});

  A.sfx = function (name, vol) {
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
      clear: [[72, 0.12], [76, 0.12], [79, 0.12], [84, 0.36], [83, 0.12], [84, 0.6]],
      gameover: [[69, 0.4], [65, 0.4], [62, 0.4], [57, 1.2]],
      rank: [[72, 0.15], [76, 0.15], [79, 0.15], [84, 0.45], [79, 0.15], [84, 0.9]],
    }[name];
    if (!seq) return;
    let x = t;
    for (const [m, d] of seq) { voiceLead(x, m, d * 0.95, "square"); voiceLead(x, m - 12, d * 0.95, "soft"); x += d; }
  };

  /* ---------- Speech: a little announcer through the Web Speech API ---------- */
  A.voiceOn = Store.get("voice", true);
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
  A.lastSay = 0;
  A.say = function (text, opt = {}) {
    if (!A.voiceOn || A.muted || !window.speechSynthesis) return;
    const now = performance.now();
    if (!opt.force && now - A.lastSay < (opt.gap || 900)) return;
    A.lastSay = now;
    try {
      if (opt.interrupt !== false) speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (voice || pickVoice()) u.voice = voice;
      u.lang = "en-US"; u.rate = opt.rate || 1; u.pitch = opt.pitch ?? 1; u.volume = Math.min(1, A.sfxVol + 0.2);
      speechSynthesis.speak(u);
    } catch (e) { /* speech not available */ }
  };
})(window.XA);
