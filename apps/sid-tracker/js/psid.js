/* SID Player: reading PSID and RSID files (versions 1 to 4) */
(function (global) {
  "use strict";

  function word(d, o) { return (d[o] << 8) | d[o + 1]; }
  function text(d, o, n) {
    var s = "";
    for (var i = 0; i < n && d[o + i]; i++) s += String.fromCharCode(d[o + i]);   // Latin-1
    return s.trim();
  }

  // Returns a tune description or throws an Error with a readable message.
  function parse(bytes, fileName) {
    var d = bytes;
    if (d.length < 0x76) throw new Error("This file is too short to be a SID tune.");
    var magic = String.fromCharCode(d[0], d[1], d[2], d[3]);
    if (magic !== "PSID" && magic !== "RSID") throw new Error("This is not a PSID or RSID file.");
    var t = {
      fileName: fileName || "", format: magic, version: word(d, 4), rsid: magic === "RSID",
      dataOffset: word(d, 6), load: word(d, 8), init: word(d, 0x0A), play: word(d, 0x0C),
      songs: Math.max(1, word(d, 0x0E)), startSong: word(d, 0x10),
      speed: ((d[0x12] << 24) | (d[0x13] << 16) | (d[0x14] << 8) | d[0x15]) >>> 0,
      name: text(d, 0x16, 32), author: text(d, 0x36, 32), released: text(d, 0x56, 32),
      flags: 0, clock: 0, models: [0], sidAddr: [0xD400], basic: false,
    };
    if (t.version >= 2 && d.length >= 0x7C) {
      t.flags = word(d, 0x76);
      t.basic = t.rsid && !!(t.flags & 2);
      t.clock = (t.flags >> 2) & 3;                       // 0 unknown, 1 PAL, 2 NTSC, 3 both
      t.models = [(t.flags >> 4) & 3];                    // 0 unknown, 1 6581, 2 8580, 3 both
      var a2 = d[0x7A], a3 = d[0x7B];
      if (t.version >= 3 && validSid(a2)) { t.sidAddr.push(0xD000 | (a2 << 4)); t.models.push((t.flags >> 6) & 3 || t.models[0]); }
      if (t.version >= 4 && validSid(a3) && a3 !== a2) { t.sidAddr.push(0xD000 | (a3 << 4)); t.models.push((t.flags >> 8) & 3 || t.models[0]); }
    }
    if (t.dataOffset >= d.length) throw new Error("The SID file has no music data.");
    var data = d.subarray(t.dataOffset);
    if (t.load === 0) {
      if (data.length < 2) throw new Error("The SID file has no music data.");
      t.load = data[0] | (data[1] << 8);
      data = data.subarray(2);
    }
    t.data = new Uint8Array(data);
    t.end = t.load + t.data.length - 1;
    if (t.end > 0xFFFF) throw new Error("The music data runs past the end of the C64 memory.");
    if (t.init === 0) t.init = t.load;
    if (t.startSong < 1 || t.startSong > t.songs) t.startSong = 1;
    if (t.flags & 1) throw new Error("Compute!'s Sidplayer (MUS) files are not supported.");
    return t;
  }
  function validSid(b) {
    // $D420-$D7E0 or $DE00-$DFE0, on an even 32-byte boundary
    return b && !(b & 1) && ((b >= 0x42 && b <= 0x7E) || (b >= 0xE0 && b <= 0xFE));
  }
  // Does song n (1 based) use the CIA timer (else the 50/60 Hz screen interrupt)?
  function songUsesCia(t, n) {
    if (t.rsid) return true;
    var bit = Math.min(n, 32) - 1;
    return !!((t.speed >>> bit) & 1);
  }

  global.PSID = { parse: parse, songUsesCia: songUsesCia };
})(typeof window !== "undefined" ? window : globalThis);
