/* C64 SID Tracker: turns a song into C64 machine code: the player, its tables and the
 * packed patterns, placed at a load address. Also makes the files (.sid, .prg). */
(function (global) {
  "use strict";

  var D = global.TrackerDriver, S = global.TrackerSong;
  var PAL = 985248;
  var CODE = (function () {
    var b = typeof atob === "function" ? atob(D.code) : Buffer.from(D.code, "base64").toString("binary");
    var a = new Uint8Array(b.length);
    for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
    return a;
  })();

  // SID frequency of each note (index 1 = C-0), PAL clock
  var FREQ = [0];
  for (var k = 0; k < 95; k++) FREQ.push(Math.min(65535, Math.round(440 * Math.pow(2, (k - 57) / 12) * 16777216 / PAL)));

  // ---------------------------------------------------------------- patterns
  function packPattern(rows, len, insCount) {
    if (insCount == null) insCount = 31;
    var out = [], empty = 0;
    function flush() {
      while (empty > 0) { var n = Math.min(64, empty); out.push(0xC0 + n - 1); empty -= n; }
    }
    for (var i = 0; i < len; i++) {
      var r = rows[i], note = r[0], ins = r[1] <= insCount ? r[1] : 0, cmd = r[2], par = r[3];
      if (!note && !ins && !cmd) {
        // a row without anything: joins the run before it, or the note row before it
        empty++;
        continue;
      }
      flush();
      if (ins) out.push(0xA0 + ins);
      if (cmd) out.push(0x80 + cmd, par);
      if (note >= 1 && note <= 95) out.push(note);
      else if (note === S.NOTE_OFF) out.push(0x61);
      else { empty = 1; continue; }        // no note: this row starts a run of empty rows
      // a note row lasts one row; the following empty rows make their own run
    }
    flush();
    out.push(0);
    return out;
  }

  // ---------------------------------------------------------------- the wave table
  function waveTable(song) {
    var w = [0xFF], n = [0xFF], start = [0];       // row 0: stop (for instrument 0)
    song.instruments.forEach(function (ins) {
      var s = w.length;
      start.push(s);
      ins.wave.forEach(function (st) {
        w.push(st.w & 0xFE);
        n.push(st.abs ? 0x80 | (st.n + 1) : st.n & 0x7F);
      });
      w.push(0xFF);
      n.push(ins.loop >= 0 && ins.loop < ins.wave.length ? s + ins.loop : 0xFF);
    });
    if (w.length > 255) throw new Error("The wave programs of all instruments are too long together (" + (w.length - 1) + " of 254 steps).");
    return { w: w, n: n, start: start };
  }

  // ---------------------------------------------------------------- the whole song
  // opts: { load, pattern: position to loop alone, start: position, row: start row,
  //         autoplay (default true) }
  function build(song, opts) {
    opts = opts || {};
    var load = (opts.load != null ? opts.load : song.load) & 0xFF00;
    var bytes = [], i, v;
    for (i = 0; i < CODE.length; i++) bytes.push(CODE[i]);
    var off = load - 0x1000;
    D.relocs.forEach(function (r) { bytes[r] = (bytes[r] + (off >> 8)) & 0xFF; });
    var tables = {};
    function table(name, data) { tables[name] = load + bytes.length; for (var k = 0; k < data.length; k++) bytes.push(data[k] & 0xFF); }

    table("freqlo", FREQ.map(function (f) { return f & 0xFF; }));
    table("freqhi", FREQ.map(function (f) { return f >> 8; }));
    var ins = [null].concat(song.instruments);
    function field(fn) { return ins.map(function (x) { return x ? fn(x) : 0; }); }
    var wt = waveTable(song);
    table("i_ad", field(function (x) { return x.ad; }));
    table("i_sr", field(function (x) { return x.sr; }));
    table("i_wave", wt.start);
    table("i_pw", field(function (x) { return x.pw >> 4; }));
    table("i_pspl", field(function (x) { return (x.pspeed * 16) & 0xFF; }));
    table("i_psph", field(function (x) { return (x.pspeed * 16) >> 8; }));
    table("i_pmin", field(function (x) { return Math.min(x.pmin, x.pmax) >> 4; }));
    table("i_pmax", field(function (x) { return Math.max(x.pmin, x.pmax) >> 4; }));
    table("i_vdel", field(function (x) { return x.vdel; }));
    table("i_vspd", field(function (x) { return x.vspd; }));
    table("i_vdep", field(function (x) { return x.vdep; }));
    table("i_flags", field(function (x) { return (x.hr ? 1 : 0) | (x.filter ? 2 : 0); }));
    table("i_fcut", field(function (x) { return x.fcut; }));
    table("i_fswp", field(function (x) { return x.fsweep & 0xFF; }));
    table("i_fres", field(function (x) { return x.fres << 4; }));
    table("i_ftyp", field(function (x) { return (x.ftype & 7) << 4; }));
    table("wtw", wt.w);
    table("wtn", wt.n);

    // order lists
    var positions = opts.pattern != null ? [opts.pattern] : song.order.map(function (o, k) { return k; });
    var loop = opts.pattern != null ? 0 : song.loop;
    var used = {}, lists = [], posIndex = [], byteToPos = [], startTr = [];
    for (v = 0; v < 3; v++) {
      var list = [], prev = 0, idx = [], map = {};
      var anyT = positions.some(function (p) { return song.order[p].t[v] !== 0; });
      positions.forEach(function (p, k) {
        var o = song.order[p], t = o.t[v];
        idx.push(list.length);
        if (t !== prev || (k === loop && anyT) || (opts.pattern != null)) list.push(0xA0 + t);
        prev = t;
        map[list.length] = p;
        list.push(o.p[v]);
        used[o.p[v]] = true;
      });
      list.push(0xFF, idx[loop]);
      if (list.length > 255) throw new Error("The order list is too long for voice " + (v + 1) + ".");
      lists.push(list); posIndex.push(idx); byteToPos.push(map);
    }
    var maxPat = Math.max.apply(null, Object.keys(used).map(Number));
    var listAddr = lists.map(function (l, k) { var a = load + bytes.length; table("o" + k, l); return a; });
    // patterns
    var patAddr = [];
    for (i = 0; i <= maxPat; i++) {
      if (!used[i]) { patAddr.push(0); continue; }
      patAddr.push(load + bytes.length);
      var packed = packPattern(song.patterns[i], song.rows, song.instruments.length);
      for (var k2 = 0; k2 < packed.length; k2++) bytes.push(packed[k2]);
    }
    var tabStart = tables.patlo = load + bytes.length;
    patAddr.forEach(function (a) { bytes.push(a & 0xFF); });
    tables.pathi = load + bytes.length;
    patAddr.forEach(function (a) { bytes.push(a >> 8); });

    // fill in the table addresses
    D.patches.forEach(function (p) {
      var a = tables[p[1]] + p[2];
      bytes[p[0]] = a & 0xFF; bytes[p[0] + 1] = a >> 8;
    });
    var L = D.labels;
    function poke(label, k, val) { bytes[L[label] + k] = val & 0xFF; }
    for (v = 0; v < 3; v++) { poke("olo", v, listAddr[v]); poke("ohi", v, listAddr[v] >> 8); }
    // where to start
    var startPos = Math.max(0, Math.min(positions.length - 1, opts.pattern != null ? 0 : (opts.start || 0)));
    for (v = 0; v < 3; v++) {
      poke("startpos", v, posIndex[v][startPos]);
      poke("starttr", v, song.order[positions[startPos]].t[v] + 0);
    }
    poke("skiprows", 0, Math.max(0, Math.min(song.rows - 1, opts.row || 0)));
    poke("initspd", 0, opts.speed || song.speed);
    var cia = song.multi > 1 ? Math.round(19656 / song.multi) - 1 : 0;
    poke("cialo", 0, cia); poke("ciahi", 0, cia >> 8);
    poke("autoplay", 0, opts.autoplay === false ? 0 : 1);
    poke("keepsid", 0, opts.keep ? 1 : 0);
    var end = load + bytes.length - 1;
    if (end > 0xFFFF) throw new Error("The song does not fit in the C64 memory at this load address.");
    var labels = {};
    Object.keys(L).forEach(function (k) { labels[k] = load + L[k]; });
    return {
      bytes: new Uint8Array(bytes), load: load, end: end, labels: labels,
      init: load, play: load + 3, jam: load + 6,
      positions: positions, byteToPos: byteToPos, waveStart: wt.start, waveLen: wt.w.length, dataSize: bytes.length - CODE.length, tableEnd: tabStart
    };
  }

  // speed of a song at a position and row (the F commands before it)
  function speedAt(song, pos, row) {
    var sp = song.speed;
    for (var p = 0; p <= pos && p < song.order.length; p++) {
      var last = p === pos ? row : song.rows;
      for (var r = 0; r < last; r++) for (var v = 0; v < 3; v++) {
        var c = song.patterns[song.order[p].p[v]][r];
        if (c[2] === 15 && c[3]) sp = c[3];
      }
    }
    return sp;
  }

  // ---------------------------------------------------------------- files
  function latin1(s, n) {
    var a = new Uint8Array(n);
    s = String(s || "");
    for (var i = 0; i < Math.min(n, s.length); i++) { var c = s.charCodeAt(i); a[i] = c < 256 ? c : 63; }
    return a;
  }
  // PSID version 2 file
  function psid(song) {
    var b = build(song);
    var h = new Uint8Array(0x7C);
    function w16(o, v) { h[o] = (v >> 8) & 0xFF; h[o + 1] = v & 0xFF; }
    h.set([0x50, 0x53, 0x49, 0x44]);
    w16(4, 2); w16(6, 0x7C); w16(8, 0); w16(0x0A, b.init); w16(0x0C, b.play);
    w16(0x0E, 1); w16(0x10, 1);
    h[0x15] = song.multi > 1 ? 1 : 0;              // speed: CIA timer for several calls a frame
    h.set(latin1(song.name, 32), 0x16);
    h.set(latin1(song.author, 32), 0x36);
    h.set(latin1(song.released, 32), 0x56);
    w16(0x76, (1 << 2) | ((song.model === 8580 ? 2 : 1) << 4));   // PAL, SID model
    var out = new Uint8Array(0x7C + 2 + b.bytes.length);
    out.set(h);
    out[0x7C] = b.load & 0xFF; out[0x7D] = b.load >> 8;
    out.set(b.bytes, 0x7E);
    return out;
  }
  // the music with its load address (for own programs: JSR load to start, JSR load+3 every frame)
  function prg(song) {
    var b = build(song);
    var out = new Uint8Array(b.bytes.length + 2);
    out[0] = b.load & 0xFF; out[1] = b.load >> 8;
    out.set(b.bytes, 2);
    return out;
  }
  // a program that runs with RUN: plays the music from an interrupt and prints the title
  function runnable(song) {
    var b = build(song);
    if (b.load < 0x0A00 || b.end >= 0xA000) throw new Error("A program to RUN needs the music between $0A00 and $9FFF (load address in the song settings).");
    var base = 0x0801, code = [];
    // 10 SYS 2061
    code.push(0x0B, 0x08, 0x0A, 0x00, 0x9E, 0x32, 0x30, 0x36, 0x31, 0x00, 0x00, 0x00);
    var title = petscii(song.name) + (song.author ? "\r" + petscii("by " + song.author) : "") + "\r";
    var latch = Math.round(19656 / (song.multi || 1)) - 1;
    var start = base + code.length;                 // $080D
    var irqAt, textAt;
    var prog = [
      0x78,                                           // sei
      0xA9, 0, 0x8D, 0x14, 0x03,                      // lda #<irq : sta $0314
      0xA9, 0, 0x8D, 0x15, 0x03,                      // lda #>irq : sta $0315
      0xA9, latch & 0xFF, 0x8D, 0x04, 0xDC,           // timer A of CIA 1: the play speed
      0xA9, latch >> 8, 0x8D, 0x05, 0xDC,
      0xA9, 0x11, 0x8D, 0x0E, 0xDC,
      0xA9, 0x00, 0x20, b.init & 0xFF, b.init >> 8,   // lda #0 : jsr init
      0x58,                                           // cli
      0xA2, 0x00,                                     // ldx #0
      0xBD, 0, 0, 0xF0, 0x06, 0x20, 0xD2, 0xFF, 0xE8, 0xD0, 0xF5,  // print the title
      0x60,                                           // rts
    ];
    irqAt = start + prog.length;
    prog.push(0x20, b.play & 0xFF, b.play >> 8, 0x4C, 0x31, 0xEA);  // irq: jsr play : jmp $ea31
    textAt = start + prog.length;
    prog[2] = irqAt & 0xFF; prog[7] = irqAt >> 8;
    prog[35] = textAt & 0xFF; prog[36] = textAt >> 8;
    for (var i = 0; i < title.length && i < 200; i++) prog.push(title.charCodeAt(i));
    prog.push(0);
    code = code.concat(prog);
    var size = b.end + 1 - base;
    var out = new Uint8Array(size + 2);
    out[0] = 0x01; out[1] = 0x08;
    out.set(code, 2);
    if (base + code.length > b.load) throw new Error("The title is too long for this load address.");
    out.set(b.bytes, 2 + b.load - base);
    return out;
  }
  function petscii(s) {
    return String(s || "").toUpperCase().replace(/[^\x20-\x5F\r]/g, "?");
  }

  global.TrackerBuild = { build: build, psid: psid, prg: prg, runnable: runnable, speedAt: speedAt, packPattern: packPattern, FREQ: FREQ };
})(typeof window !== "undefined" ? window : globalThis);
