/* ALIEN ARMADA: techno tracks (one per world) and retro sound effects. All tunes are original. */
"use strict";

(function (XA) {
  const A = XA.Audio, DR = A.DR;
  const { osc, noise, notes } = A.fx;
  Object.assign(A.SONGS, {
    title: { bpm: 128, drums: DR.techno, bass: "R.RR.RR.R.RR.R5O", arp: 2, pad: true, lead: "saw",
      chords: "Am Am F G Am Am Dm E",
      mel: "a5:4 r:2 e6:2 r:2 a5:2 c6:4 b5:4 r:4 g5:4 a5:2 c6:2 e6:8 r:8 a5:4 r:2 e6:2 r:2 a5:2 d6:4 c6:4 b5:4 g#5:4 e5:8 r:8" },
    orbit: { bpm: 132, drums: DR.techno, bass: "RRORRORRRRORR5RO", arp: 2, pad: true, lead: "square",
      chords: "Em Em C D Em Em C B",
      mel: "e6:2 r:2 e6:2 g6:2 r:2 b6:2 a6:4 g6:2 r:2 e6:2 d6:2 e6:8 r:8 c6:2 r:2 c6:2 e6:2 r:2 g6:2 f#6:4 d6:4 a5:4 b5:8 r:8" },
    moon: { bpm: 126, drums: DR.breaks, bass: "R...R.O.R...5.O.", arp: 2, pad: true, lead: "soft",
      chords: "Dm7 Dm7 Bbmaj7 C Dm7 Dm7 Gm7 A7",
      mel: "a5:6 f5:2 d6:8 c6:4 a5:4 f5:8 g5:4 bb5:4 d6:4 f6:4 e6:16 a5:6 f5:2 d6:8 c6:4 bb5:4 g5:8 a5:4 c#6:4 e6:4 g6:4 f6:16" },
    neon: { bpm: 118, drums: DR.drive, bass: "R.R.R.R.O.O.5.5.", arp: 1, pad: true, lead: "saw",
      chords: "Fm Db Ab Eb Fm Db Bbm C",
      mel: "c6:4 ab5:2 f5:2 c6:4 eb6:4 db6:4 c6:4 ab5:8 eb6:4 c6:2 ab5:2 eb6:4 g6:4 f6:8 c6:8 " +
        "f6:4 eb6:2 db6:2 c6:4 ab5:4 db6:2 eb6:2 f6:4 db6:4 bb5:8 c6:4 e6:4 g6:8 c7:8" },
    asteroids: { bpm: 140, drums: DR.epic, bass: "R.RO.RR.R.RO.R5.", arp: 1, pad: false, lead: "saw",
      chords: "Gm Gm Eb F Gm Gm Cm D",
      mel: "g5:2 bb5:2 d6:2 g6:2 f6:2 d6:2 bb5:2 d6:2 eb6:4 d6:4 c6:4 bb5:4 a5:2 c6:2 f6:2 a6:2 g6:4 f6:4 d6:8 r:8 " +
        "g6:2 r:2 g6:2 f6:2 d6:4 bb5:4 c6:2 eb6:2 g6:4 f6:2 eb6:2 d6:4 f#6:4 a6:8 d7:8" },
    hive: { bpm: 112, drums: DR.taiko, bass: "R..b..R.R..b..O.", arp: 2, pad: true, lead: "saw",
      chords: "Cm Cdim Ab G Cm Cdim Fm G",
      mel: "c6:4 eb6:4 f#6:8 g6:4 eb6:4 c6:8 ab5:4 c6:4 eb6:4 g6:4 b5:16 c6:4 eb6:4 f#6:8 a6:4 g6:4 f6:8 eb6:4 d6:4 b5:4 g5:4 c6:16" },
    boss: { bpm: 150, drums: DR.epic, bass: "RRORRORRRRORRORO", arp: 1, pad: false, lead: "saw",
      chords: "Am F Dm E Am F Dm E",
      mel: "a5:2 a5:2 c6:2 e6:2 a6:4 g6:4 f6:2 e6:2 d6:2 c6:2 d6:4 f6:4 e6:2 r:2 e6:2 g#6:2 b6:4 e7:4 d7:4 b6:4 g#6:8" },
    ending: { bpm: 124, drums: DR.techno, bass: "R...5...R...5...", arp: 2, pad: true, lead: "square",
      chords: "C G Am F C G F G", mel: "e6:4 g6:4 c7:8 b6:4 g6:4 d6:8 c6:4 e6:4 a6:8 f6:4 a6:4 c7:8 e6:4 g6:4 c7:8 d7:4 b6:4 g6:8 a6:4 f6:4 c6:8 d6:4 g6:4 b6:8" },
  });
  A.WORLD_SONGS = ["orbit", "moon", "neon", "asteroids", "hive"];
  Object.assign(A.SFX, {
    shot: (t) => { osc(t, "square", 1400, 300, 0.12, 0.07); osc(t, "sawtooth", 2000, 600, 0.08, 0.03); },
    laser: (t) => { osc(t, "sawtooth", 900, 880, 0.1, 0.04); },
    alienShot: (t) => osc(t, "square", 300, 180, 0.1, 0.04),
    hit: (t) => { noise(t, 0.2, "bandpass", 2400, 400, 2, 0.25); osc(t, "square", 600, 80, 0.18, 0.08); },
    step0: (t) => osc(t, "square", 98, 92, 0.09, 0.14), step1: (t) => osc(t, "square", 87, 82, 0.09, 0.14),
    step2: (t) => osc(t, "square", 78, 73, 0.09, 0.14), step3: (t) => osc(t, "square", 73, 69, 0.09, 0.14),
    ufo: (t) => { for (let i = 0; i < 6; i++) osc(t + i * 0.08, "sine", 900 + (i % 2) * 300, 700 + (i % 2) * 300, 0.08, 0.04); },
    ufoHit: (t) => { notes(t, [84, 79, 76, 72, 67, 64], "square", 0.04, 0.07, 0.08); noise(t, 0.5, "lowpass", 3000, 200, 1, 0.3); },
    die: (t) => { noise(t, 1.2, "lowpass", 3000, 60, 1, 0.7, 0.5); osc(t, "sawtooth", 600, 30, 1.0, 0.12); },
    bunker: (t) => noise(t, 0.08, "highpass", 2000, 800, 1, 0.08),
    power: (t) => notes(t, [72, 76, 79, 84, 88], "square", 0.05, 0.07, 0.12),
    shield: (t) => { osc(t, "sine", 300, 1200, 0.3, 0.12); },
    bomb: (t) => { noise(t, 1.5, "lowpass", 4000, 50, 1, 0.9, 0.8); osc(t, "sine", 120, 20, 1.2, 0.6); },
    bossHit: (t) => { noise(t, 0.12, "bandpass", 1800, 600, 3, 0.2); osc(t, "square", 220, 120, 0.1, 0.06); },
    bossDie: (t) => { for (let i = 0; i < 6; i++) noise(t + i * 0.18, 0.8, "lowpass", 3000, 80, 1, 0.6, 0.5); osc(t, "sawtooth", 400, 20, 2, 0.12); },
    warning: (t) => { for (let i = 0; i < 3; i++) { osc(t + i * 0.4, "square", 880, 660, 0.3, 0.07); } },
    extra: (t) => notes(t, [72, 79, 84, 88, 91, 96], "square", 0.07, 0.07, 0.3),
    wave: (t) => notes(t, [60, 67, 72, 79, 84], "sawtooth", 0.08, 0.06, 0.2),
    menuMove: (t) => osc(t, "square", 880, 880, 0.03, 0.04),
    menuOk: (t) => { osc(t, "square", 880, 880, 0.05, 0.05); osc(t + 0.05, "square", 1320, 1320, 0.08, 0.05); },
    menuBack: (t) => { osc(t, "square", 600, 600, 0.05, 0.05); osc(t + 0.05, "square", 400, 400, 0.08, 0.05); },
    secret: (t) => notes(t, [72, 79, 84, 88, 91, 96, 100], "sine", 0.06, 0.07, 0.4),
    secretOff: (t) => notes(t, [84, 79, 72, 67], "sine", 0.07, 0.07, 0.3),
  });
  A.GAP.hit = 0.03; A.GAP.alienShot = 0.06; A.GAP.bunker = 0.05;
})(window.XA);
