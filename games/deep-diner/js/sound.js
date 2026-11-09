/* DEEP DINER: the songs (one per underwater world) and sound effects. All tunes are original. */
"use strict";

(function (XA) {
  const A = XA.Audio, DR = A.DR;
  const { osc, noise, notes, mtof } = A.fx;
  Object.assign(A.SONGS, {
    title: { bpm: 112, drums: DR.bounce, bass: "R..R..5.R..R..O.", arp: 1, pad: true, lead: "soft",
      chords: "F Dm Bb C F Dm Gm C",
      mel: "c6:2 a5:2 f5:2 a5:2 c6:4 d6:4 c6:2 a5:2 f5:4 r:4 d5:2 f5:2 a5:2 d6:2 c6:8 bb5:2 d6:2 f6:4 e6:2 d6:2 c6:4 g5:4 a5:4 bb5:2 c6:2 e6:8 " +
        "f6:4 e6:2 c6:2 a5:4 c6:4 d6:2 f6:2 a6:4 f6:4 bb5:4 d6:2 f6:2 e6:4 c6:4 g5:4 a5:2 bb5:2 c6:8" },
    reef: { bpm: 120, drums: DR.funk, bass: "R..R.5..O..R.5.R", arp: 0, pad: false, lead: "square",
      chords: "C G Am F C G F G",
      mel: "e5:2 g5:2 c6:2 e6:2 d6:2 c6:2 g5:4 a5:2 c6:2 e6:2 g6:2 e6:4 c6:4 f5:2 a5:2 c6:2 f6:2 e6:2 d6:2 c6:4 b5:2 d6:2 g6:4 f6:2 d6:2 b5:4 " +
        "c6:4 e6:2 g6:2 a6:4 g6:4 e6:2 d6:2 c6:2 d6:2 e6:8 f6:2 e6:2 d6:2 c6:2 a5:4 f5:4 g5:2 b5:2 d6:2 f6:2 g6:8" },
    kelp: { bpm: 96, drums: DR.calm, bass: "R...5...R...O...", arp: 2, pad: true, lead: "soft",
      chords: "Am7 Dm7 G Cmaj7 Fmaj7 Dm7 Em7 Am7",
      mel: "e5:6 g5:2 a5:8 c6:4 b5:4 a5:8 g5:6 a5:2 b5:4 d6:4 e6:16 c6:6 b5:2 a5:4 f5:4 a5:6 g5:2 f5:8 e5:4 g5:4 b5:4 d6:4 c6:16" },
    wreck: { bpm: 104, drums: DR.taiko, bass: "R..R..R.R..5..O.", arp: 1, pad: true, lead: "saw",
      chords: "Dm Dm A A Dm Gm A Dm",
      mel: "d5:2 f5:2 a5:4 a5:2 g5:2 f5:2 e5:2 d5:4 e5:4 c#5:8 a4:4 c#5:4 e5:4 a5:4 g5:8 e5:8 " +
        "f5:2 a5:2 d6:4 c6:2 a5:2 f5:4 g5:2 bb5:2 d6:4 bb5:4 g5:4 a5:2 c#6:2 e6:4 d6:2 c#6:2 a5:4 d6:8 r:8" },
    arctic: { bpm: 100, drums: DR.calm, bass: "R.......5.......", arp: 2, pad: true, lead: "koto",
      chords: "Em C G D Em C Am B",
      mel: "b5:4 e6:4 g6:4 f#6:4 e6:8 b5:8 c6:4 e6:4 g6:4 a6:4 f#6:16 e6:4 g6:4 b6:4 a6:4 g6:8 e6:8 c6:4 e6:4 a6:4 g6:4 f#6:4 d#6:4 b5:8" },
    abyss: { bpm: 78, drums: DR.none, bass: "R.......R...b...", arp: 2, pad: true, lead: "soft",
      chords: "Cm Ab Fm G Cm Ab Fm G",
      mel: "g5:8 eb5:8 c5:12 r:4 ab5:8 g5:4 f5:4 d5:16 g5:6 f5:2 eb5:8 c6:12 b5:4 g5:16 d5:16" },
    boss: { bpm: 140, drums: DR.epic, bass: "RRORRORRRRORRORO", arp: 1, pad: false, lead: "saw",
      chords: "Am F G E Am F Dm E",
      mel: "a5:2 c6:2 e6:2 a6:2 g6:4 e6:4 f6:2 e6:2 d6:2 c6:2 d6:8 e6:2 r:2 e6:2 g#6:2 b6:4 g#6:4 e6:8 r:8" },
    clear: { bpm: 126, drums: DR.bounce, bass: "R...5...R...5...", arp: 2, pad: true, lead: "square",
      chords: "C F G C", mel: "c6:2 e6:2 g6:4 e6:2 g6:2 c7:8 a6:2 g6:2 f6:4 d6:4 g6:8 e6:2 f6:2 g6:4 b6:4 c7:16" },
  });
  A.WORLD_SONGS = ["reef", "kelp", "wreck", "arctic", "abyss"];

  const bub = (t, f, d = 0.08, v = 0.06) => { osc(t, "sine", f, f * 2.4, d, v); };
  Object.assign(A.SFX, {
    chomp: (t) => { noise(t, 0.06, "bandpass", 900, 300, 2, 0.25); osc(t, "square", 320, 120, 0.07, 0.08); },
    bigChomp: (t) => { noise(t, 0.12, "lowpass", 1500, 200, 1, 0.4); osc(t, "square", 220, 60, 0.14, 0.12); bub(t + 0.08, 500); bub(t + 0.13, 700); },
    gulp: (t) => { osc(t, "sine", 500, 180, 0.15, 0.14); bub(t + 0.1, 400); },
    grow: (t) => notes(t, [60, 64, 67, 72, 76, 79, 84], "square", 0.05, 0.06, 0.2),
    frenzy: (t) => { notes(t, [72, 76, 79, 84], "sawtooth", 0.06, 0.07, 0.25); noise(t, 0.4, "highpass", 3000, 6000, 1, 0.08); },
    double: (t) => { notes(t, [72, 76, 79, 84, 88, 91, 96], "sawtooth", 0.05, 0.07, 0.25); noise(t, 0.6, "highpass", 3000, 7000, 1, 0.1); },
    eaten: (t) => { noise(t, 0.4, "lowpass", 2500, 100, 1, 0.5, 0.3); osc(t, "sawtooth", 400, 50, 0.5, 0.1); for (let i = 0; i < 6; i++) bub(t + 0.1 + i * 0.05, 300 + i * 120); },
    bubble: (t) => bub(t, 600 + Math.random() * 600, 0.06, 0.04),
    pearl: (t) => notes(t, [84, 88, 91, 96], "sine", 0.05, 0.08, 0.3),
    stun: (t) => { osc(t, "square", 1200, 300, 0.3, 0.06); osc(t + 0.05, "square", 1500, 400, 0.3, 0.05); noise(t, 0.3, "bandpass", 3000, 1000, 5, 0.1); },
    dash: (t) => noise(t, 0.25, "bandpass", 400, 1500, 2, 0.15),
    puff: (t) => { osc(t, "sine", 200, 700, 0.25, 0.15); noise(t, 0.2, "bandpass", 800, 2000, 3, 0.08); },
    boing: (t) => osc(t, "sine", 180, 500, 0.2, 0.18),
    boom: (t) => { noise(t, 0.9, "lowpass", 2500, 60, 1, 0.7, 0.5); osc(t, "sine", 90, 25, 0.8, 0.6); },
    warn: (t) => { osc(t, "square", 500, 500, 0.15, 0.06); osc(t + 0.2, "square", 400, 400, 0.15, 0.06); },
    extra: (t) => notes(t, [72, 79, 84, 88, 91, 96], "square", 0.07, 0.07, 0.3),
    splash: (t) => { noise(t, 0.5, "bandpass", 800, 300, 1, 0.25, 0.4); for (let i = 0; i < 5; i++) bub(t + i * 0.06, 300 + Math.random() * 500); },
    tick: (t) => osc(t, "square", 1400, 1400, 0.03, 0.05),
    menuMove: (t) => bub(t, 700, 0.05, 0.05),
    menuOk: (t) => { bub(t, 600); bub(t + 0.06, 900); },
    menuBack: (t) => { bub(t, 800); bub(t + 0.06, 500); },
    secret: (t) => notes(t, [72, 79, 84, 88, 91, 96, 100], "sine", 0.06, 0.07, 0.4),
    secretOff: (t) => notes(t, [84, 79, 72, 67], "sine", 0.07, 0.07, 0.3),
  });
  A.GAP.chomp = 0.05; A.GAP.bubble = 0.08;
})(window.XA);
