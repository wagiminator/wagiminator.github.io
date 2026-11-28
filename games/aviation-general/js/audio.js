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
    // outdoor echo: a convolution reverb with a long, dark, slightly uneven tail (valleys and tree lines)
    const ir = ctx.createBuffer(2, Math.floor(ctx.sampleRate * 2.6), ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d2 = ir.getChannelData(ch);
      for (let i = 0; i < d2.length; i++) {
        const t = i / ctx.sampleRate;
        const slap = Math.exp(-Math.pow((t - 0.32 - ch * 0.05) / 0.03, 2)) * 0.6 + Math.exp(-Math.pow((t - 0.71 + ch * 0.04) / 0.05, 2)) * 0.35;
        d2[i] = (Math.random() * 2 - 1) * (Math.exp(-t * 2.2) * 0.5 + slap);
      }
    }
    A.verb = ctx.createConvolver(); A.verb.buffer = ir;
    const dark = ctx.createBiquadFilter(); dark.type = "lowpass"; dark.frequency.value = 1400;
    A.verbIn = ctx.createGain(); A.verbIn.gain.value = 1.6;
    A.verbIn.connect(A.verb); A.verb.connect(dark); dark.connect(A.sfxBus);
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
  // a sound source that also feeds the echo
  function wet(amount) { const g = A.ctx.createGain(); g.connect(A.sfxBus); const s = A.ctx.createGain(); s.gain.value = amount; g.connect(s); s.connect(A.verbIn); return g; }
  // one shot: a sharp crack, a body of filtered noise and a low thump
  function shot(t, o) {
    const out = wet(o.verb == null ? 0.6 : o.verb);
    if (o.crack) noise(t, o.crackDur || 0.04, 9000, 2500, o.crack, "highpass", 0.7, out);
    if (o.body) noise(t, o.bodyDur || 0.25, o.bodyF || 2200, o.bodyF1 || 150, o.body, "lowpass", 0.8, out);
    if (o.thump) tone(t, o.thumpDur || 0.3, o.thumpF || 110, o.thumpF1 || 35, o.thump, "sine", out);
  }
  // a rocket motor: ignition pop, then a roaring hiss that sweeps and fades as it flies away
  function rocket(t, dur, vol, f0, f1, out) {
    noise(t, 0.08, 3000, 400, vol * 1.2, "lowpass", 0.7, out);
    noise(t + 0.02, dur, f0, f1, vol * 2.8, "bandpass", 0.9, out);
    noise(t + 0.02, dur * 0.8, 6000, 2500, vol * 0.9, "highpass", 0.7, out);
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
      /* ---- weapons, one sound per kind of weapon system ---- */
      // 120/125 mm tank gun: a hard crack, a heavy blast and a long rolling echo
      case "tankgun": shot(t, { crack: 0.5, crackDur: 0.05, body: 0.75, bodyDur: 0.6, bodyF: 2600, bodyF1: 60, thump: 0.55, thumpF: 95, thumpF1: 28, thumpDur: 0.6, verb: 0.9 }); break;
      // 25-35 mm autocannon (Puma, Bradley, BMP-3): a measured burst of heavy thuds
      case "autocannon": for (let k = 0; k < 5; k++) shot(t + k * 0.13, { crack: 0.22, body: 0.32, bodyDur: 0.16, bodyF: 2400, bodyF1: 200, thump: 0.22, thumpF: 140, thumpF1: 60, thumpDur: 0.14, verb: 0.5 }); break;
      // heavy machine gun (recon vehicles, APCs): a fast, dry rattle
      case "mg": for (let k = 0; k < 10; k++) shot(t + k * 0.075 + (k % 3) * 0.005, { crack: 0.26, body: 0.26, bodyDur: 0.07, bodyF: 3000, bodyF1: 500, verb: 0.4 }); break;
      // infantry: rifles and a light machine gun, irregular overlapping bursts
      case "rifle": for (let k = 0; k < 14; k++) { const dt = k * 0.07 + Math.random() * 0.05 + (k > 6 ? 0.18 : 0); shot(t + dt, { crack: 0.28 + Math.random() * 0.1, crackDur: 0.025, body: 0.16, bodyDur: 0.05, bodyF: 3500, bodyF1: 700, verb: 0.45 }); } break;
      // revolver / Gatling air-defence gun (Skyranger, Pantsir, M-SHORAD): a buzzing, very fast stream
      case "revolver": for (let k = 0; k < 18; k++) shot(t + k * 0.035, { crack: 0.24, body: 0.26, bodyDur: 0.05, bodyF: 2600, bodyF1: 400, thump: 0.06, thumpF: 160, thumpF1: 90, thumpDur: 0.05, verb: 0.35 }); break;
      // helicopter chain gun (30 mm): short, slower bursts
      case "chaingun": for (let k = 0; k < 8; k++) shot(t + k * 0.1, { crack: 0.22, body: 0.3, bodyDur: 0.09, bodyF: 2400, bodyF1: 300, thump: 0.1, thumpF: 130, thumpF1: 70, thumpDur: 0.08, verb: 0.5 }); break;
      // ground anti-tank missile (Javelin, Spike, Kornet): soft launch pop, then the flight motor hisses away
      case "atgm": { const o = wet(0.5); noise(t, 0.06, 1800, 300, 0.45, "lowpass", 0.7, o); rocket(t + 0.18, 1.1, 0.14, 1800, 700, o); break; }
      // helicopter missile (Hellfire, Spike ER2, HOT, Vikhr): a loud ignition and a long roar
      case "heliatgm": { const o = wet(0.7); rocket(t, 1.3, 0.24, 2200, 500, o); tone(t, 0.25, 160, 60, 0.12, "sine", o); break; }
      // 70 mm rocket pods: a ripple of rockets
      case "rockets": { const o = wet(0.7); for (let k = 0; k < 7; k++) rocket(t + k * 0.09, 0.5, 0.09, 2600, 900, o); break; }
      // shoulder-fired air-defence missile (Stinger, Verba, FN-16): eject pop, short pause, then the motor
      case "manpads": { const o = wet(0.5); noise(t, 0.05, 2500, 500, 0.45, "lowpass", 0.7, o); rocket(t + 0.28, 1.0, 0.15, 2500, 1200, o); break; }
      // vehicle air-defence missile (IRIS-T, Tor, NASAMS, HQ-17): a violent launch blast and a fast climbing roar
      case "sam": { const o = wet(0.85); noise(t, 0.35, 2000, 80, 0.55, "lowpass", 0.7, o); tone(t, 0.4, 80, 30, 0.35, "sine", o); rocket(t + 0.05, 1.6, 0.26, 900, 3200, o); break; }
      // 155/152 mm howitzer: a deep blast with a big, long echo
      case "howitzer": shot(t, { crack: 0.35, crackDur: 0.06, body: 0.7, bodyDur: 0.9, bodyF: 1600, bodyF1: 40, thump: 0.55, thumpF: 75, thumpF1: 22, thumpDur: 0.9, verb: 1.0 }); break;
      // rocket artillery (MARS, Tornado-S, HIMARS, PHL-16): a ripple of heavy rocket launches
      case "mlrs": { const o = wet(0.9); for (let k = 0; k < 6; k++) { const dt = k * 0.22; noise(t + dt, 0.3, 1500, 60, 0.4, "lowpass", 0.7, o); rocket(t + dt + 0.02, 1.0, 0.18, 1200, 2600, o); } break; }
      // the shell arriving far away (indirect fire)
      case "impact": shot(t, { body: 0.5, bodyDur: 0.7, bodyF: 900, bodyF1: 40, thump: 0.4, thumpF: 70, thumpF1: 25, thumpDur: 0.6, verb: 0.9 }); break;
      // old names, still used by a few events
      case "cannon": A.last[name] = 0; A.sfx("tankgun"); break;
      case "flak": A.last[name] = 0; A.sfx("revolver"); break;
      case "missile": A.last[name] = 0; A.sfx("heliatgm"); break;
      case "artillery": A.last[name] = 0; A.sfx("howitzer"); break;
      case "explode": { const o = wet(0.8); noise(t, 1.1, 1100, 35, 0.6, "lowpass", 0.7, o); tone(t, 0.8, 60, 22, 0.45, "sine", o); noise(t + 0.08, 0.6, 3000, 800, 0.08, "bandpass", 0.8, o); break; }
      case "mine": { const o = wet(0.8); noise(t, 0.9, 1400, 40, 0.65, "lowpass", 0.7, o); tone(t, 0.6, 55, 25, 0.4, "sine", o); break; }
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
