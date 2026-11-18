/* C64 Pixel Studio: the project (sprites, objects, character set, tiles, map, bitmap),
 * undo/redo and the project file (JSON). */
(function (global) {
  "use strict";

  var VERSION = 1;

  function newSprite(name) {
    return { name: name || "", data: new Uint8Array(64), col: 1, mc: false, xe: false, ye: false };
  }
  function newBitmap(mc) {
    return { mc: mc !== false, bg: 0, border: 0, bitmap: new Uint8Array(8000), screen: new Uint8Array(1000).fill(mc === false ? 0x10 : 0x00), color: new Uint8Array(1000) };
  }
  function newProject() {
    var chars = new Uint8Array(2048);
    if (global.C64_CHARGEN) chars.set(global.C64_CHARGEN.subarray(0, 2048));
    var tile = new Uint8Array(4).fill(0x20);
    return {
      version: VERSION,
      name: "untitled",
      colors: { bg: 6, border: 14, sprMc1: 11, sprMc2: 1, chrMc1: 11, chrMc2: 12 },
      sprites: [newSprite("sprite 0")],
      objects: [],
      charMode: "hires",
      chars: chars,
      charCols: new Uint8Array(256).fill(14),
      tileW: 2, tileH: 2,
      tiles: [tile],
      map: { w: 64, h: 12, cells: new Uint16Array(64 * 12) },
      bitmap: newBitmap(true)
    };
  }

  // ---------------------------------------------------------------- undo / redo
  // Every change takes a copy of the project before it (the project is small).
  function History(get, set, onChange) {
    this.get = get; this.set = set; this.onChange = onChange;
    this.undos = []; this.redos = []; this.max = 120;
  }
  History.prototype.checkpoint = function (label) {
    this.undos.push({ label: label || "", state: clone(this.get()) });
    if (this.undos.length > this.max) this.undos.shift();
    this.redos = [];
    if (this.onChange) this.onChange();
  };
  History.prototype.drop = function () { this.undos.pop(); if (this.onChange) this.onChange(); };
  History.prototype.undo = function () {
    var u = this.undos.pop();
    if (!u) return null;
    this.redos.push({ label: u.label, state: clone(this.get()) });
    this.set(u.state);
    if (this.onChange) this.onChange();
    return u.label;
  };
  History.prototype.redo = function () {
    var r = this.redos.pop();
    if (!r) return null;
    this.undos.push({ label: r.label, state: clone(this.get()) });
    this.set(r.state);
    if (this.onChange) this.onChange();
    return r.label;
  };
  History.prototype.clear = function () { this.undos = []; this.redos = []; if (this.onChange) this.onChange(); };

  function clone(p) {
    if (typeof structuredClone === "function") return structuredClone(p);
    return fromJSON(toJSON(p));
  }

  // ---------------------------------------------------------------- project file
  function b64(a) {
    var s = "";
    for (var i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function unb64(s, Type) {
    var b = atob(s), a = new Uint8Array(b.length);
    for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
    return Type === Uint16Array ? new Uint16Array(a.buffer) : a;
  }
  function toJSON(p) {
    return JSON.stringify({
      format: "c64-pixel-studio", version: VERSION, name: p.name, colors: p.colors,
      sprites: p.sprites.map(function (s) { return { name: s.name, data: b64(s.data), col: s.col, mc: s.mc, xe: s.xe, ye: s.ye }; }),
      objects: p.objects,
      charMode: p.charMode, chars: b64(p.chars), charCols: b64(p.charCols),
      tileW: p.tileW, tileH: p.tileH, tiles: p.tiles.map(b64),
      map: { w: p.map.w, h: p.map.h, cells: b64(new Uint8Array(p.map.cells.buffer.slice(0))) },
      bitmap: { mc: p.bitmap.mc, bg: p.bitmap.bg, border: p.bitmap.border, bitmap: b64(p.bitmap.bitmap), screen: b64(p.bitmap.screen), color: b64(p.bitmap.color) }
    });
  }
  function fromJSON(text) {
    var j = typeof text === "string" ? JSON.parse(text) : text;
    if (!j || (j.format && j.format !== "c64-pixel-studio")) throw new Error("This is not a C64 Pixel Studio project.");
    var p = newProject();
    p.name = j.name || "untitled";
    if (j.colors) Object.assign(p.colors, j.colors);
    if (Array.isArray(j.sprites) && j.sprites.length) p.sprites = j.sprites.map(function (s) {
      var n = newSprite(s.name); var d = unb64(s.data || ""); n.data.set(d.subarray(0, 64));
      n.col = s.col & 15; n.mc = !!s.mc; n.xe = !!s.xe; n.ye = !!s.ye; return n;
    });
    if (Array.isArray(j.objects)) p.objects = j.objects;
    p.charMode = j.charMode === "mc" ? "mc" : "hires";
    if (j.chars) { var c = unb64(j.chars); p.chars.set(c.subarray(0, 2048)); }
    if (j.charCols) { var cc = unb64(j.charCols); p.charCols.set(cc.subarray(0, 256)); }
    p.tileW = Math.max(1, Math.min(8, j.tileW | 0 || 2)); p.tileH = Math.max(1, Math.min(8, j.tileH | 0 || 2));
    if (Array.isArray(j.tiles) && j.tiles.length) p.tiles = j.tiles.map(function (t) {
      var a = new Uint8Array(p.tileW * p.tileH), d = unb64(t); a.set(d.subarray(0, a.length)); return a;
    });
    if (j.map) {
      var w = Math.max(1, Math.min(1024, j.map.w | 0)), h = Math.max(1, Math.min(1024, j.map.h | 0));
      p.map = { w: w, h: h, cells: new Uint16Array(w * h) };
      if (j.map.cells) { var mc = unb64(j.map.cells), m16 = new Uint16Array(mc.buffer, 0, Math.min(w * h, mc.length >> 1)); p.map.cells.set(m16); }
    }
    if (j.bitmap) {
      var bm = newBitmap(j.bitmap.mc !== false);
      bm.bg = j.bitmap.bg & 15; bm.border = j.bitmap.border & 15;
      if (j.bitmap.bitmap) bm.bitmap.set(unb64(j.bitmap.bitmap).subarray(0, 8000));
      if (j.bitmap.screen) bm.screen.set(unb64(j.bitmap.screen).subarray(0, 1000));
      if (j.bitmap.color) bm.color.set(unb64(j.bitmap.color).subarray(0, 1000));
      p.bitmap = bm;
    }
    return p;
  }

  // Change the tile size: tiles keep their top left part, new cells get a space
  function resizeTiles(p, w, h) {
    p.tiles = p.tiles.map(function (t) {
      var n = new Uint8Array(w * h).fill(0x20);
      for (var y = 0; y < Math.min(h, p.tileH); y++) for (var x = 0; x < Math.min(w, p.tileW); x++) n[y * w + x] = t[y * p.tileW + x];
      return n;
    });
    p.tileW = w; p.tileH = h;
  }
  function resizeMap(p, w, h) {
    var n = new Uint16Array(w * h);
    for (var y = 0; y < Math.min(h, p.map.h); y++) for (var x = 0; x < Math.min(w, p.map.w); x++) n[y * w + x] = p.map.cells[y * p.map.w + x];
    p.map = { w: w, h: h, cells: n };
  }

  global.PSModel = {
    newProject: newProject, newSprite: newSprite, newBitmap: newBitmap, History: History, clone: clone,
    toJSON: toJSON, fromJSON: fromJSON, resizeTiles: resizeTiles, resizeMap: resizeMap, b64: b64, unb64: unb64
  };
})(typeof window !== "undefined" ? window : globalThis);
