/* C64 SID Tracker: the song (instruments, patterns, order list), files and undo */
(function (global) {
  "use strict";

  var MAXPAT = 128, MAXROWS = 64, MAXINS = 31, MAXPOS = 100;
  var NOTE_OFF = 96;
  var NAMES = ["C-", "C#", "D-", "D#", "E-", "F-", "F#", "G-", "G#", "A-", "A#", "B-"];

  function noteName(n) {
    if (!n) return "···";
    if (n === NOTE_OFF) return "===";
    n -= 1;
    return NAMES[n % 12] + Math.floor(n / 12);
  }
  function emptyRows() {
    var r = [];
    for (var i = 0; i < MAXROWS; i++) r.push([0, 0, 0, 0]);
    return r;
  }
  function newInstrument(name) {
    return {
      name: name || "New instrument",
      ad: 0x09, sr: 0x89, hr: true,
      wave: [{ w: 0x41, n: 0, abs: false }], loop: -1,
      pw: 0x800, pspeed: 0, pmin: 0x200, pmax: 0xE00,
      vdel: 0, vspd: 0, vdep: 0,
      filter: false, ftype: 1, fres: 8, fcut: 96, fsweep: 0
    };
  }
  function newSong() {
    return {
      name: "Untitled", author: "", released: "",
      speed: 6, rows: 32, multi: 1, model: 6581, load: 0x1000,
      instruments: [newInstrument("Pulse")],
      patterns: [emptyRows(), emptyRows(), emptyRows()],
      order: [{ p: [0, 1, 2], t: [0, 0, 0] }],
      loop: 0
    };
  }
  function clamp(v, a, b, d) { v = Math.round(+v); return isFinite(v) ? Math.max(a, Math.min(b, v)) : d; }

  // ---------------------------------------------------------------- files
  function toJSON(s) {
    var out = {
      format: "c64-sid-tracker", version: 1,
      name: s.name, author: s.author, released: s.released,
      speed: s.speed, rows: s.rows, multi: s.multi, model: s.model, load: s.load,
      instruments: s.instruments,
      patterns: s.patterns.map(function (p) {
        var rows = [];
        p.forEach(function (r, i) { if (r[0] || r[1] || r[2] || r[3]) rows.push([i, r[0], r[1], r[2], r[3]]); });
        return rows;
      }),
      order: s.order, loop: s.loop
    };
    return JSON.stringify(out);
  }
  function fromJSON(text) {
    var d = typeof text === "string" ? JSON.parse(text) : text;
    if (!d || d.format !== "c64-sid-tracker") throw new Error("This is not a song of the C64 SID Tracker.");
    var s = newSong();
    s.name = String(d.name || "Untitled").slice(0, 32);
    s.author = String(d.author || "").slice(0, 32);
    s.released = String(d.released || "").slice(0, 32);
    s.speed = clamp(d.speed, 1, 31, 6);
    s.rows = clamp(d.rows, 1, MAXROWS, 32);
    s.multi = clamp(d.multi, 1, 4, 1);
    s.model = d.model === 8580 ? 8580 : 6581;
    s.load = clamp(d.load, 0x0800, 0xF000, 0x1000) & 0xFF00;
    s.instruments = (Array.isArray(d.instruments) ? d.instruments : []).slice(0, MAXINS).map(cleanInstrument);
    if (!s.instruments.length) s.instruments.push(newInstrument("Pulse"));
    s.patterns = (Array.isArray(d.patterns) ? d.patterns : []).slice(0, MAXPAT).map(function (rows) {
      var p = emptyRows();
      (rows || []).forEach(function (r) {
        var i = r[0] | 0;
        if (i < 0 || i >= MAXROWS) return;
        p[i] = [clamp(r[1], 0, NOTE_OFF, 0), clamp(r[2], 0, MAXINS, 0), clamp(r[3], 0, 15, 0), clamp(r[4], 0, 255, 0)];
      });
      return p;
    });
    if (!s.patterns.length) s.patterns.push(emptyRows());
    var np = s.patterns.length;
    s.order = (Array.isArray(d.order) ? d.order : []).slice(0, MAXPOS).map(function (o) {
      return { p: [0, 1, 2].map(function (v) { return clamp(o.p && o.p[v], 0, np - 1, 0); }),
        t: [0, 1, 2].map(function (v) { return clamp(o.t && o.t[v], -32, 31, 0); }) };
    });
    if (!s.order.length) s.order.push({ p: [0, 0, 0], t: [0, 0, 0] });
    s.loop = clamp(d.loop, 0, s.order.length - 1, 0);
    return s;
  }
  function cleanInstrument(i) {
    var d = newInstrument();
    i = i || {};
    d.name = String(i.name || "Instrument").slice(0, 24);
    d.ad = clamp(i.ad, 0, 255, d.ad); d.sr = clamp(i.sr, 0, 255, d.sr); d.hr = i.hr !== false;
    d.wave = (Array.isArray(i.wave) ? i.wave : []).slice(0, 32).map(function (w) {
      return { w: clamp(w.w, 0, 254, 0x41), n: w.abs ? clamp(w.n, 0, 94, 48) : clamp(w.n, -64, 63, 0), abs: !!w.abs };
    });
    if (!d.wave.length) d.wave.push({ w: 0x41, n: 0, abs: false });
    d.loop = clamp(i.loop, -1, d.wave.length - 1, -1);
    d.pw = clamp(i.pw, 0, 4095, d.pw); d.pspeed = clamp(i.pspeed, 0, 255, 0);
    d.pmin = clamp(i.pmin, 0, 4095, d.pmin); d.pmax = clamp(i.pmax, 0, 4095, d.pmax);
    d.vdel = clamp(i.vdel, 0, 255, 0); d.vspd = clamp(i.vspd, 0, 31, 0); d.vdep = clamp(i.vdep, 0, 15, 0);
    d.filter = !!i.filter; d.ftype = clamp(i.ftype, 0, 7, 1); d.fres = clamp(i.fres, 0, 15, 8);
    d.fcut = clamp(i.fcut, 0, 255, 96); d.fsweep = clamp(i.fsweep, -128, 127, 0);
    return d;
  }

  // ---------------------------------------------------------------- undo
  function History(get, set, onChange) {
    this.get = get; this.set = set; this.onChange = onChange || function () {};
    this.undoStack = []; this.redoStack = []; this.last = 0; this.lastLabel = "";
  }
  History.prototype.checkpoint = function (label, merge) {
    var now = Date.now();
    // typing in one place joins into one step
    if (merge && label === this.lastLabel && now - this.last < 1200) { this.last = now; return; }
    this.undoStack.push(structuredClone(this.get()));
    if (this.undoStack.length > 150) this.undoStack.shift();
    this.redoStack = []; this.last = now; this.lastLabel = label;
    this.onChange();
  };
  History.prototype.undo = function () {
    if (!this.undoStack.length) return false;
    this.redoStack.push(structuredClone(this.get()));
    this.set(this.undoStack.pop()); this.lastLabel = "";
    this.onChange();
    return true;
  };
  History.prototype.redo = function () {
    if (!this.redoStack.length) return false;
    this.undoStack.push(structuredClone(this.get()));
    this.set(this.redoStack.pop()); this.lastLabel = "";
    this.onChange();
    return true;
  };

  global.TrackerSong = {
    MAXPAT: MAXPAT, MAXROWS: MAXROWS, MAXINS: MAXINS, MAXPOS: MAXPOS, NOTE_OFF: NOTE_OFF,
    noteName: noteName, emptyRows: emptyRows, newInstrument: newInstrument, newSong: newSong,
    toJSON: toJSON, fromJSON: fromJSON, cleanInstrument: cleanInstrument, History: History
  };
})(typeof window !== "undefined" ? window : globalThis);
