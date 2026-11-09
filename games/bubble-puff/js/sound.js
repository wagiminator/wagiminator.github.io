/* BUBBLE PUFF: cheerful chiptune songs (one per world) and sound effects. All tunes are original. */
"use strict";

(function (XA) {
  const A = XA.Audio, DR = A.DR;
  const { osc, noise, notes } = A.fx;
  Object.assign(A.SONGS, {
    title: { bpm: 132, drums: DR.bounce, bass: "R.R.5.R.R.R.5.O.", arp: 1, pad: false, lead: "square",
      chords: "C Am F G C Am F G",
      mel: "g5:2 c6:2 e6:2 g6:2 e6:2 c6:2 d6:4 a5:2 c6:2 e6:4 c6:4 a5:4 f5:2 a5:2 c6:2 f6:2 e6:2 d6:2 b5:2 g5:2 a5:2 b5:2 d6:4 g5:4 r:4 " +
        "e6:2 g6:2 c7:4 b6:2 a6:2 g6:4 e6:2 c6:2 a5:4 c6:4 a6:4 g6:2 f6:2 e6:2 d6:2 c6:4 d6:2 e6:2 d6:8 r:8" },
    candy: { bpm: 140, drums: DR.bounce, bass: "R.O.R.O.5.O.R.O.", arp: 1, pad: false, lead: "square",
      chords: "F C Dm Bb F C Bb C",
      mel: "a5:2 c6:2 f6:2 a6:2 g6:4 e6:4 f6:2 e6:2 d6:2 c6:2 a5:4 r:4 bb5:2 d6:2 f6:2 d6:2 c6:4 a5:4 g5:2 a5:2 bb5:2 c6:2 e6:8 " +
        "f6:2 r:2 f6:2 e6:2 d6:4 c6:4 bb5:2 c6:2 d6:2 f6:2 a6:8 g6:2 f6:2 e6:2 d6:2 c6:4 bb5:4 a5:4 g5:4 f5:8" },
    jungle: { bpm: 124, drums: DR.funk, bass: "R..R..R.5..5..O.", arp: 0, pad: true, lead: "koto",
      chords: "Am Am G G F F E E",
      mel: "a5:2 c6:2 e6:2 c6:2 a5:2 e5:2 a5:4 g5:2 b5:2 d6:2 b5:2 g5:4 d5:4 f5:2 a5:2 c6:2 f6:2 e6:4 c6:4 e6:2 d6:2 b5:2 g#5:2 e5:8 " +
        "c6:4 b5:2 a5:2 e6:4 d6:2 c6:2 b5:2 g5:2 d6:4 b5:4 a5:2 c6:2 f6:4 e6:2 d6:2 c6:4 b5:2 a5:2 g#5:4 b5:4 e6:8" },
    ice: { bpm: 116, drums: DR.calm, bass: "R...5...R...5...", arp: 2, pad: true, lead: "soft",
      chords: "G Em C D G Em C D",
      mel: "d6:4 b5:2 g5:2 d6:4 g6:4 e6:4 c6:2 e6:2 g6:8 c6:4 e6:2 c6:2 a5:4 c6:4 d6:4 f#6:4 a6:8 " +
        "b6:4 a6:2 g6:2 d6:4 b5:4 c6:2 e6:2 g6:4 e6:4 c6:2 d6:2 e6:4 c6:2 a5:2 d6:4 f#6:4 g6:8" },
    volcano: { bpm: 152, drums: DR.rock, bass: "RRORRORRRRORRORO", arp: 1, pad: false, lead: "saw",
      chords: "Em C D B Em C Am B",
      mel: "e5:2 g5:2 b5:2 e6:2 d6:4 b5:4 c6:2 e6:2 g6:4 f#6:4 d6:4 a5:2 d6:2 f#6:4 e6:2 d6:2 b5:4 d#6:4 f#6:8 " +
        "g6:2 f#6:2 e6:2 d6:2 e6:4 b5:4 c6:2 d6:2 e6:4 g6:4 e6:4 a6:2 g6:2 f#6:2 e6:2 d#6:4 f#6:4 b6:8" },
    castle: { bpm: 110, drums: DR.taiko, bass: "R..R....R..5....", arp: 2, pad: true, lead: "saw",
      chords: "Dm Bb C A Dm Bb Gm A",
      mel: "d5:2 f5:2 a5:2 d6:2 c#6:4 a5:4 bb5:2 a5:2 g5:2 f5:2 e5:8 f5:2 a5:2 c6:2 f6:2 e6:4 c6:4 c#6:2 e6:2 a6:4 g6:2 f6:2 e6:8 " +
        "d6:4 f6:2 e6:2 d6:4 bb5:4 c6:2 e6:2 g6:4 f6:2 e6:2 d6:4 bb5:2 g5:2 a5:4 c#6:4 d6:8 r:8" },
    boss: { bpm: 168, drums: DR.epic, bass: "R.RO.RR.R.RO.R5.", arp: 1, pad: false, lead: "saw",
      chords: "Cm Ab Bb G Cm Ab Fm G",
      mel: "c6:2 eb6:2 g6:2 c7:2 bb6:4 g6:4 ab6:2 g6:2 f6:2 eb6:2 f6:8 g6:2 r:2 g6:2 ab6:2 b6:4 d7:4 c7:8 r:8" },
    hurry: { bpm: 190, drums: DR.drive, bass: "R.O.R.O.R.O.5.O.", arp: 1, pad: false, lead: "square",
      chords: "Am F G E", mel: "a5:2 c6:2 e6:2 a6:2 g6:2 e6:2 c6:2 e6:2 f6:2 e6:2 d6:2 c6:2 b5:2 g#5:2 e5:4" },
    ending: { bpm: 120, drums: DR.calm, bass: "R...5...R...5...", arp: 2, pad: true, lead: "square",
      chords: "C F G C Am F G C", mel: "c6:4 e6:4 g6:8 f6:4 a6:4 c7:8 b6:4 g6:4 d6:8 c6:16 a5:4 c6:4 e6:8 f6:4 e6:4 d6:8 b5:4 d6:4 g6:8 c7:16" },
  });
  A.WORLD_SONGS = ["candy", "jungle", "ice", "volcano", "castle"];
  Object.assign(A.SFX, {
    blow: (t) => { osc(t, "sine", 300, 900, 0.12, 0.12); noise(t, 0.1, "bandpass", 1500, 3000, 3, 0.05); },
    pop: (t) => { osc(t, "sine", 900, 300, 0.07, 0.18); noise(t, 0.05, "highpass", 3000, 5000, 1, 0.08); },
    capture: (t) => { osc(t, "square", 500, 1200, 0.15, 0.06); osc(t + 0.05, "sine", 800, 1600, 0.15, 0.08); },
    kill: (t) => { osc(t, "square", 1200, 200, 0.4, 0.07); notes(t + 0.05, [84, 88, 91], "square", 0.05, 0.05, 0.12); },
    fruit: (t) => notes(t, [79, 84, 88], "square", 0.05, 0.07, 0.1),
    jump: (t) => osc(t, "square", 300, 700, 0.12, 0.06),
    bounce: (t) => osc(t, "sine", 400, 1000, 0.15, 0.12),
    hurt: (t) => { osc(t, "sawtooth", 800, 100, 0.6, 0.1); for (let i = 0; i < 4; i++) osc(t + i * 0.12, "square", 600 - i * 100, 500 - i * 100, 0.1, 0.06); },
    letter: (t) => notes(t, [76, 81, 86], "square", 0.06, 0.07, 0.15),
    extend: (t) => notes(t, [72, 76, 79, 84, 88, 91, 96, 100], "square", 0.06, 0.08, 0.2),
    hurry: (t) => { for (let i = 0; i < 4; i++) osc(t + i * 0.15, "square", 1200, 1200, 0.08, 0.06); },
    zap: (t) => { noise(t, 0.4, "bandpass", 3000, 800, 4, 0.25); osc(t, "sawtooth", 1500, 100, 0.4, 0.06); },
    bossHit: (t) => { noise(t, 0.2, "lowpass", 2000, 200, 1, 0.4); osc(t, "square", 200, 80, 0.2, 0.12); },
    boom: (t) => { noise(t, 1.2, "lowpass", 3000, 50, 1, 0.8, 0.6); osc(t, "sine", 90, 20, 1.0, 0.7); },
    shoot: (t) => { noise(t, 0.15, "bandpass", 1200, 400, 2, 0.12); },
    power: (t) => notes(t, [72, 79, 84, 91], "square", 0.05, 0.07, 0.15),
    menuMove: (t) => osc(t, "square", 880, 880, 0.03, 0.04),
    menuOk: (t) => { osc(t, "square", 880, 880, 0.05, 0.05); osc(t + 0.05, "square", 1320, 1320, 0.08, 0.05); },
    menuBack: (t) => { osc(t, "square", 600, 600, 0.05, 0.05); osc(t + 0.05, "square", 400, 400, 0.08, 0.05); },
    secret: (t) => notes(t, [72, 79, 84, 88, 91, 96, 100], "sine", 0.06, 0.07, 0.4),
    secretOff: (t) => notes(t, [84, 79, 72, 67], "sine", 0.07, 0.07, 0.3),
  });
  A.GAP.pop = 0.03; A.GAP.blow = 0.05;
})(window.XA);
