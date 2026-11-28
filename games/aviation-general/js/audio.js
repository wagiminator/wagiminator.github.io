/* Aviation General: synthesized sound effects and a quiet drum-and-pad loop (Web Audio API) */
"use strict";

(function (MG) {
  const Store = MG.Store;
  const A = (MG.Audio = { ctx: null, sfxVol: Store.get("sfxVol", 0.7), musicVol: Store.get("musicVol", 0.35), muted: Store.get("muted", false), last: {} });

  A.init = function () {
    if (A.ctx) { if (A.ctx.state === "suspended") A.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (A.ctx = new AC());
    A.master = ctx.createGain(); A.master.gain.value = A.muted ? 0 : 1; A.master.connect(ctx.destination);
    A.sfxBus = ctx.createGain(); A.sfxBus.gain.value = A.sfxVol; A.sfxBus.connect(A.master);
    A.musBus = ctx.createGain(); A.musBus.gain.value = A.musicVol; A.musBus.connect(A.master);
    const len = ctx.sampleRate * 1.5, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    A.noiseBuf = buf;
    A.startMusic();
  };
  A.toggleMute = () => { A.muted = !A.muted; Store.set("muted", A.muted); if (A.master) A.master.gain.value = A.muted ? 0 : 1; };

  function noise(t, dur, f0, f1, vol, type = "lowpass", q = 0.7, dest) {
    const ctx = A.ctx, n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    n.buffer = A.noiseBuf; f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(f); f.connect(g); g.connect(dest || A.sfxBus); n.start(t); n.stop(t + dur + 0.05);
  }
  function tone(t, dur, f0, f1, vol, type = "sine", dest) {
    const ctx = A.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || A.sfxBus); o.start(t); o.stop(t + dur + 0.05);
  }
  function chop(t, dur, rate, vol) { for (let k = 0; k < dur * rate; k++) noise(t + k / rate, 0.06, 900, 200, vol, "lowpass"); }

  A.sfx = function (name) {
    if (!A.ctx || A.muted) return;
    const now = A.ctx.currentTime;
    if (A.last[name] && now - A.last[name] < 0.06) return;
    A.last[name] = now;
    const t = now + 0.01;
    switch (name) {
      case "click": tone(t, 0.05, 900, 700, 0.08, "square"); break;
      case "select": tone(t, 0.07, 600, 900, 0.07, "triangle"); break;
      case "deny": tone(t, 0.12, 220, 160, 0.1, "square"); break;
      case "engine": noise(t, 0.6, 180, 90, 0.25, "lowpass", 2); tone(t, 0.6, 55, 48, 0.12, "sawtooth"); break;
      case "steps": for (let k = 0; k < 4; k++) noise(t + k * 0.11, 0.05, 1500, 600, 0.06, "bandpass"); break;
      case "rotor": chop(t, 0.7, 14, 0.18); noise(t, 0.7, 3000, 1500, 0.04, "highpass"); break;
      case "uav": tone(t, 0.6, 180, 190, 0.05, "sawtooth"); break;
      case "cannon": noise(t, 0.35, 2500, 120, 0.5); tone(t, 0.25, 90, 40, 0.3, "sine"); break;
      case "flak": for (let k = 0; k < 6; k++) noise(t + k * 0.06, 0.08, 3000, 400, 0.18); break;
      case "missile": noise(t, 0.6, 400, 4000, 0.18, "bandpass", 1.5); noise(t, 0.2, 1500, 200, 0.2); break;
      case "artillery": noise(t, 0.6, 1200, 60, 0.5); tone(t, 0.5, 70, 35, 0.35); break;
      case "explode": noise(t, 0.9, 900, 40, 0.55); tone(t, 0.6, 60, 30, 0.4); break;
      case "mine": noise(t, 0.7, 1400, 50, 0.6); break;
      case "drone": tone(t, 0.9, 260, 300, 0.05, "sawtooth"); break;
      case "plane": noise(t, 2.2, 300, 120, 0.2, "lowpass", 1); tone(t, 2.2, 110, 95, 0.05, "sawtooth"); break;
      case "chute": noise(t, 0.4, 800, 300, 0.12, "bandpass"); break;
      case "supply": tone(t, 0.08, 520, 520, 0.08, "triangle"); tone(t + 0.1, 0.12, 780, 780, 0.08, "triangle"); break;
      case "dig": for (let k = 0; k < 3; k++) noise(t + k * 0.15, 0.08, 600, 200, 0.12, "bandpass"); break;
      case "flag": tone(t, 0.12, 523, 523, 0.09, "triangle"); tone(t + 0.12, 0.12, 659, 659, 0.09, "triangle"); tone(t + 0.24, 0.25, 784, 784, 0.09, "triangle"); break;
      case "turn": tone(t, 0.15, 330, 330, 0.07, "triangle"); tone(t + 0.15, 0.2, 440, 440, 0.07, "triangle"); break;
      case "win": [523, 659, 784, 1046].forEach((f, k) => tone(t + k * 0.18, 0.35, f, f, 0.1, "triangle")); break;
      case "lose": [392, 349, 311, 262].forEach((f, k) => tone(t + k * 0.22, 0.4, f, f, 0.1, "triangle")); break;
    }
  };
  MG.sfx = A.sfx;

  /* ---------- a low, tense loop: muffled drums and a slow minor pad ---------- */
  A.startMusic = function () {
    const ctx = A.ctx;
    const chords = [[45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59], [40, 47, 52, 56]];
    let step = 0, next = ctx.currentTime + 0.2;
    const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
    const beat = 60 / 84 / 2;
    function sched() {
      while (next < ctx.currentTime + 0.4) {
        const bar = Math.floor(step / 16) % chords.length, s = step % 16;
        if (s === 0) for (const m of chords[bar]) { const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter(); o.type = "sawtooth"; o.frequency.value = mtof(m); f.type = "lowpass"; f.frequency.value = 700; g.gain.setValueAtTime(0.0001, next); g.gain.exponentialRampToValueAtTime(0.03, next + 1.2); g.gain.exponentialRampToValueAtTime(0.0001, next + beat * 16); o.connect(f); f.connect(g); g.connect(A.musBus); o.start(next); o.stop(next + beat * 16 + 0.1); }
        if (s === 0 || s === 6 || s === 10) tone(next, 0.3, 90, 45, 0.25, "sine", A.musBus);
        if (s === 4 || s === 12) noise(next, 0.18, 1800, 600, 0.08, "bandpass", 1, A.musBus);
        if (s % 2 === 1) noise(next, 0.04, 8000, 6000, 0.015, "highpass", 1, A.musBus);
        if (s === 0 && bar % 2 === 1) tone(next, beat * 6, mtof(chords[bar][3] + 12), mtof(chords[bar][3] + 12), 0.02, "triangle", A.musBus);
        next += beat; step++;
      }
    }
    setInterval(sched, 100);
  };
  A.setSfxVol = (v) => { A.sfxVol = v; Store.set("sfxVol", v); if (A.sfxBus) A.sfxBus.gain.value = v; };
  A.setMusicVol = (v) => { A.musicVol = v; Store.set("musicVol", v); if (A.musBus) A.musBus.gain.value = v; };
})(window.MG);
