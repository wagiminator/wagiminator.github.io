/* C64 SID Tracker: the instruments of a new song and the demo song "Harbour Lights" */
(function (global) {
  "use strict";

  var S = global.TrackerSong;
  var NAMES = { "C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11 };
  // "A-4" → 0-based note index (C-0 = 0)
  function n(s) {
    var m = /^([A-G]#?)-?(\d)$/.exec(s);
    return NAMES[m[1]] + 12 * +m[2];
  }
  function ins(o) { return Object.assign(S.newInstrument(o.name), o); }

  function instruments() {
    return [
      ins({ name: "Bass", ad: 0x0A, sr: 0x79, wave: [{ w: 0x81, n: n("C-6"), abs: true }, { w: 0x41, n: 0, abs: false }],
        pw: 0x400, pspeed: 24, pmin: 0x200, pmax: 0xC00 }),
      ins({ name: "Lead", ad: 0x2A, sr: 0xA9, pw: 0x800, pspeed: 10, pmin: 0x300, pmax: 0xD00, vdel: 14, vspd: 3, vdep: 6 }),
      ins({ name: "Kick", ad: 0x07, sr: 0x00, wave: [{ w: 0x81, n: n("C-5"), abs: true }, { w: 0x11, n: n("A-3"), abs: true },
        { w: 0x11, n: n("E-3"), abs: true }, { w: 0x11, n: n("C-3"), abs: true }, { w: 0x11, n: n("G-2"), abs: true },
        { w: 0x11, n: n("D-2"), abs: true }, { w: 0x11, n: n("A-1"), abs: true }], loop: -1 }),
      ins({ name: "Snare", ad: 0x08, sr: 0x00, wave: [{ w: 0x81, n: n("A#6"), abs: true }, { w: 0x41, n: n("C-4"), abs: true },
        { w: 0x41, n: n("G#3"), abs: true }, { w: 0x81, n: n("F-6"), abs: true }, { w: 0x81, n: n("D#6"), abs: true }], loop: -1, pw: 0x800 }),
      ins({ name: "Hi-hat", ad: 0x03, sr: 0x00, wave: [{ w: 0x81, n: n("C-7"), abs: true }, { w: 0x81, n: n("A#7"), abs: true }], loop: -1 }),
      ins({ name: "Minor chord", ad: 0x09, sr: 0x6A, wave: [{ w: 0x41, n: 0 }, { w: 0, n: 3 }, { w: 0, n: 7 }], loop: 0,
        pw: 0x600, pspeed: 6, pmin: 0x400, pmax: 0xA00 }),
      ins({ name: "Major chord", ad: 0x09, sr: 0x6A, wave: [{ w: 0x41, n: 0 }, { w: 0, n: 4 }, { w: 0, n: 7 }], loop: 0,
        pw: 0x600, pspeed: 6, pmin: 0x400, pmax: 0xA00 }),
      ins({ name: "Filter sweep", ad: 0x48, sr: 0xAA, wave: [{ w: 0x21, n: 0 }], filter: true, ftype: 1, fres: 12, fcut: 24, fsweep: 1 })
    ];
  }

  // a pattern from a list of [row, note, instrument, command, parameter]
  function pat(list) {
    var p = S.emptyRows();
    list.forEach(function (e) {
      var note = e[1] === "off" ? S.NOTE_OFF : e[1] ? n(e[1]) + 1 : 0;
      p[e[0]] = [note, e[2] || 0, e[3] || 0, e[4] || 0];
    });
    return p;
  }
  function bass(a, b, c, d) {
    // two bars: root notes in octaves, a walk up at the end of each bar
    return pat([[0, a + "1", 1], [2, a + "2"], [4, a + "1"], [6, a + "2"], [8, a + "1"], [10, a + "2"], [12, b + "2"], [14, a + "2"],
      [16, c + "1"], [18, c + "2"], [20, c + "1"], [22, c + "2"], [24, c + "1"], [26, c + "2"], [28, d + "2"], [30, c + "2"]]);
  }
  function beat(fill) {
    var l = [[0, "C-4", 3], [2, "C-4", 5], [4, "C-4", 4], [6, "C-4", 5], [8, "C-4", 3], [10, "C-4", 3], [12, "C-4", 4], [14, "C-4", 5],
      [16, "C-4", 3], [18, "C-4", 5], [20, "C-4", 4], [22, "C-4", 5], [24, "C-4", 3], [26, "C-4", 5]];
    if (fill) l.push([28, "C-4", 4], [29, "C-4", 4], [30, "C-4", 4], [31, "C-4", 4]);
    else l.push([28, "C-4", 4], [30, "C-4", 5]);
    return pat(l);
  }

  function demo() {
    var s = S.newSong();
    s.name = "Harbour Lights";
    s.author = "C64 SID Tracker";
    s.released = "2026 Demo song";
    s.speed = 6; s.rows = 32;
    s.instruments = instruments();
    s.patterns = [
      bass("A-", "E-", "F-", "C-"),                                                   // 0 Am F
      bass("C-", "G-", "G-", "D-"),                                                   // 1 C G
      beat(false),                                                                    // 2
      beat(true),                                                                     // 3
      pat([[0, "A-3", 6], [8, "A-3"], [16, "F-3", 7], [24, "F-3"]]),                  // 4 chords Am F
      pat([[0, "C-4", 7], [8, "C-4"], [16, "G-3", 7], [24, "G-3"]]),                  // 5 chords C G
      pat([[0, "A-4", 2], [6, "C-5"], [8, "E-5"], [12, "D-5"], [14, "C-5"],          // 6 melody over Am F
        [16, "C-5"], [20, "A-4"], [24, "F-4"], [28, "G-4"], [30, "A-4"]]),
      pat([[0, "E-5", 2], [4, "G-5"], [6, "E-5"], [8, "D-5"], [12, "C-5"],           // 7 melody over C G
        [16, "D-5"], [20, "B-4"], [24, "G-4"], [28, "D-5"], [30, "E-5", 0, 3, 0x30]]),
      pat([[0, "C-4", 5], [4, "C-4", 5], [8, "C-4", 5], [12, "C-4", 5],              // 8 hi-hats
        [16, "C-4", 5], [20, "C-4", 5], [24, "C-4", 5], [28, "C-4", 5], [30, "C-4", 4]]),
      pat([[0, "E-5", 2], [6, "G-5"], [8, "A-5"], [12, "G-5"], [14, "E-5"],          // 9 melody, the turn
        [16, "D-5"], [18, "E-5"], [20, "D-5"], [24, "B-4"], [26, "A-4", 0, 8, 0x37], [31, "off"]]),
      pat([[0, "A-2", 8], [16, "F-2"]])                                               // 10 filter sweep over Am F
    ];
    s.order = [
      { p: [0, 10, 8], t: [0, 0, 0] },
      { p: [1, 5, 8], t: [0, 0, 0] },
      { p: [0, 6, 2], t: [0, 0, 0] },
      { p: [1, 7, 3], t: [0, 0, 0] },
      { p: [0, 4, 2], t: [0, 12, 0] },
      { p: [1, 9, 3], t: [0, 0, 0] }
    ];
    s.loop = 2;
    return s;
  }

  // a new song: a few instruments to start with
  function fresh() {
    var s = S.newSong();
    s.instruments = instruments();
    return s;
  }

  global.TrackerDemo = { demo: demo, fresh: fresh, note: n };
})(typeof window !== "undefined" ? window : globalThis);
