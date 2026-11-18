/* Interactive BOM: reading bills of materials and pick-and-place files (EasyEDA, KiCad,
 * JLCPCB, Eagle), guessing part sizes from footprint names, writing pick-and-place files. */
(function (global) {
  "use strict";

  // ================================================================ text and tables
  function decode(u8) {
    if (u8[0] === 0xFF && u8[1] === 0xFE) return new TextDecoder("utf-16le").decode(u8.subarray(2));
    if (u8[0] === 0xFE && u8[1] === 0xFF) return new TextDecoder("utf-16be").decode(u8.subarray(2));
    if (u8.length > 3 && u8[1] === 0 && u8[3] === 0) return new TextDecoder("utf-16le").decode(u8);
    var t = new TextDecoder("utf-8").decode(u8);
    return t.charCodeAt(0) === 0xFEFF ? t.slice(1) : t;
  }
  // split CSV/TSV lines, quotes allowed
  function splitLine(l, sep) {
    var out = [], cur = "", q = false;
    for (var i = 0; i < l.length; i++) {
      var c = l[i];
      if (q) { if (c === '"') { if (l[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
      else if (c === '"') q = true;
      else if (sep === " " ? /\s/.test(c) : c === sep) { if (sep !== " " || cur !== "") out.push(cur.trim()); cur = ""; }
      else cur += c;
    }
    if (sep !== " " || cur !== "") out.push(cur.trim());
    return out;
  }
  function table(text) {
    var lines = text.split(/\r?\n/).filter(function (l) { return l.trim(); }), head = null, comments = [];
    while (lines.length && /^\s*#/.test(lines[0])) comments.push(lines.shift());
    if (!lines.length) return null;
    var first = lines[0], seps = ["\t", ";", ","], sep = " ", best = 0;
    seps.forEach(function (s) { var n = splitLine(first, s).length; if (n > best && n > 1) { best = n; sep = s; } });
    // KiCad .pos: the header is the last comment line
    if (sep === " " || best < 3) {
      sep = " ";
      var hc = comments.filter(function (c) { return /ref/i.test(c); }).pop();
      if (hc) head = splitLine(hc.replace(/^\s*#+/, ""), " ");
    }
    var rows = lines.map(function (l) { return splitLine(l, sep); });
    if (!head) head = rows.shift();
    return { head: head.map(function (h) { return h.replace(/^﻿/, "").trim(); }), rows: rows, comments: comments };
  }
  function col(head, re) { for (var i = 0; i < head.length; i++) if (re.test(head[i])) return i; return -1; }

  // ================================================================ designators
  // "C1,C2, C5-C7" → ["C1","C2","C5","C6","C7"]
  function designators(s) {
    var out = [];
    String(s || "").split(/[,;\s]+/).forEach(function (p) {
      if (!p) return;
      var m = /^([A-Za-z_]+)(\d+)\s*[-–]\s*\1?(\d+)$/.exec(p);
      if (m && +m[3] > +m[2] && +m[3] - +m[2] < 500) for (var k = +m[2]; k <= +m[3]; k++) out.push(m[1] + k);
      else out.push(p);
    });
    return out;
  }
  function natCmp(a, b) {
    var ra = /^([^\d]*)(\d*)(.*)$/.exec(a), rb = /^([^\d]*)(\d*)(.*)$/.exec(b);
    if (ra[1] !== rb[1]) return ra[1] < rb[1] ? -1 : 1;
    if (+ra[2] !== +rb[2]) return +ra[2] - +rb[2];
    return ra[3] < rb[3] ? -1 : ra[3] > rb[3] ? 1 : 0;
  }

  // ================================================================ what kind of file
  function kind(t) {
    if (!t || t.head.length < 2) return null;
    var h = t.head.join(" ").toLowerCase();
    var hasRef = /designator|reference|\bref\b|refdes|\bpart\b|\bparts\b/.test(h);
    var hasPos = /mid ?x|pos ?x|center ?x|\bx\b|posx|loc ?x|ref ?x/.test(h) && /mid ?y|pos ?y|center ?y|\by\b|posy|loc ?y|ref ?y/.test(h);
    if (hasRef && hasPos) return "cpl";
    if (hasRef) return "bom";
    // Eagle .mnt/.mnb: name x y rot value package, no header
    if (t.head.length >= 4 && !isNaN(parseFloat(t.head[1])) && !isNaN(parseFloat(t.head[2]))) return "cpl-eagle";
    return null;
  }

  // ================================================================ bill of materials
  /* returns [{ value, footprint, refs: [...], qty, mpn, maker, lcsc }] */
  function readBom(t) {
    var h = t.head;
    var cRef = col(h, /^(designator|designators|reference|references|ref|refs|refdes|parts?)$/i);
    if (cRef < 0) cRef = col(h, /designator|reference|refdes/i);
    var cVal = col(h, /^(name|value|val|comment|description)$/i);
    if (cVal < 0) cVal = col(h, /value|comment|name/i);
    var cFp = col(h, /footprint|package|pattern|case/i);
    var cQty = col(h, /^(quantity|qty|qnty|count)$/i);
    var cMpn = col(h, /manufacturer part|mpn|mfr.? ?part|part ?number/i);
    var cMk = col(h, /^manufacturer$|^mfr$|^maker$/i);
    var cLcsc = col(h, /lcsc|supplier part|jlcpcb part/i);
    var lines = [];
    t.rows.forEach(function (r) {
      var refs = designators(r[cRef]);
      if (!refs.length) return;
      lines.push({ value: cVal >= 0 ? r[cVal] || "" : "", footprint: cFp >= 0 ? r[cFp] || "" : "", refs: refs.sort(natCmp),
        qty: cQty >= 0 && +r[cQty] ? +r[cQty] : refs.length, mpn: cMpn >= 0 ? r[cMpn] || "" : "", maker: cMk >= 0 ? r[cMk] || "" : "",
        lcsc: cLcsc >= 0 && /^C\d+$/i.test(r[cLcsc] || "") ? r[cLcsc].toUpperCase() : "" });
    });
    return lines;
  }

  // ================================================================ pick and place
  function num(s, unit) {
    var m = /(-?[\d.]+)\s*(mm|mil|in|inch)?/i.exec(String(s || ""));
    if (!m) return NaN;
    var v = parseFloat(m[1]), u = (m[2] || unit || "mm").toLowerCase();
    return u === "mil" ? v * 0.0254 : u === "in" || u === "inch" || u === "inches" ? v * 25.4 : v;
  }
  /* returns { parts: { ref: { x, y, rot, side, value, footprint } }, count } in mm */
  function readCpl(t, k) {
    var parts = {}, n = 0, unit = "mm";
    t.comments.forEach(function (c) { if (/unit\s*=\s*inch/i.test(c)) unit = "in"; });
    if (k === "cpl-eagle") {
      [t.head].concat(t.rows).forEach(function (r) {
        if (r.length < 4) return;
        parts[r[0]] = { x: num(r[1], "mm"), y: num(r[2], "mm"), rot: parseFloat(r[3]) || 0, side: "top", value: r[4] || "", footprint: r[5] || "" };
        n++;
      });
      return { parts: parts, count: n };
    }
    var h = t.head;
    var cRef = col(h, /^(designator|reference|ref|refdes|part)$/i); if (cRef < 0) cRef = col(h, /designator|ref/i);
    var cX = col(h, /^(mid ?x|center ?x|pos ?x|posx|x|loc ?x)$/i); if (cX < 0) cX = col(h, /mid ?x|center ?x|pos ?x|ref ?x/i);
    var cY = col(h, /^(mid ?y|center ?y|pos ?y|posy|y|loc ?y)$/i); if (cY < 0) cY = col(h, /mid ?y|center ?y|pos ?y|ref ?y/i);
    var cR = col(h, /rot|angle/i), cL = col(h, /layer|side|tb/i), cV = col(h, /^(val|value|comment|name)$/i), cF = col(h, /footprint|package/i);
    t.rows.forEach(function (r) {
      var ref = r[cRef];
      if (!ref) return;
      var x = num(r[cX], unit), y = num(r[cY], unit);
      if (isNaN(x) || isNaN(y)) return;
      var side = cL >= 0 && /^(b|bot|bottom|bottomlayer|back)$/i.test(String(r[cL]).trim()) ? "bottom" : "top";
      parts[ref] = { x: x, y: y, rot: cR >= 0 ? parseFloat(r[cR]) || 0 : 0, side: side, value: cV >= 0 ? r[cV] || "" : "", footprint: cF >= 0 ? r[cF] || "" : "" };
      n++;
    });
    return { parts: parts, count: n };
  }
  function writeCpl(list) {
    var lines = ["Designator,Mid X,Mid Y,Layer,Rotation"];
    list.sort(function (a, b) { return natCmp(a.ref, b.ref); }).forEach(function (p) {
      lines.push([p.ref, p.x.toFixed(4) + "mm", p.y.toFixed(4) + "mm", p.side === "bottom" ? "Bottom" : "Top", Math.round(p.rot || 0)].join(","));
    });
    return lines.join("\r\n") + "\r\n";
  }

  // ================================================================ part size from the footprint name
  var IMPERIAL = { "01005": [0.4, 0.2], "0201": [0.6, 0.3], "0402": [1.0, 0.5], "0603": [1.6, 0.8], "0805": [2.0, 1.25], "1206": [3.2, 1.6], "1210": [3.2, 2.5],
    "1812": [4.5, 3.2], "2010": [5.0, 2.5], "2512": [6.4, 3.2] };
  var NAMED = [
    [/sod-?923/, [1, 0.8]], [/sod-?523/, [1.2, 0.8]], [/sod-?323/, [2.5, 1.3]], [/sod-?123/, [3.7, 1.6]], [/sma\b|do-?214ac/, [5.2, 2.6]], [/smb\b|do-?214aa/, [5.4, 3.6]],
    [/sot-?23-?[56]|sot-?26|tsot/, [3, 2.8]], [/sot-?23|sot-?346/, [3, 2.4]], [/sot-?89/, [4.5, 4.1]], [/sot-?223/, [6.5, 7]], [/sot-?363|sc-?70/, [2.1, 2.1]], [/sot-?323|sc-?70-3/, [2.1, 2.1]],
    [/to-?252|dpak/, [6.6, 10]], [/to-?263|d2pak/, [10.2, 15]], [/msop-?(8|10)|tssop-?8/, [3, 4.9]], [/tssop-?(14|16)/, [5, 6.4]], [/tssop-?20/, [6.5, 6.4]],
    [/sop-?8|soic-?8|so-?8/, [5, 6]], [/sop-?14|soic-?14/, [8.7, 6]], [/sop-?16|soic-?16/, [10, 6]], [/ssop-?20|qsop-?20/, [7.2, 6]], [/ssop-?24|qsop-?24/, [8.7, 6]],
    [/lqfp-?32|tqfp-?32/, [9, 9]], [/lqfp-?48|tqfp-?48/, [9, 9]], [/lqfp-?64|tqfp-?64/, [12, 12]], [/qfn-?16|dfn-?8/, [3, 3]], [/qfn-?20/, [4, 4]], [/qfn-?24/, [4, 4]], [/qfn-?28/, [5, 5]], [/qfn-?32/, [5, 5]],
    [/hc-?49|crystal/, [11, 4.7]], [/usb.*c|type-?c/, [9, 7.5]], [/micro.?usb/, [8, 5.5]], [/mini.?usb/, [9.5, 7.5]], [/led-?5050|ws2812/, [5, 5]], [/led-?3528/, [3.5, 2.8]],
    [/dip-?8/, [10, 9.5]], [/dip-?14/, [19, 9.5]], [/dip-?16/, [21, 9.5]], [/dip-?20/, [26, 9.5]], [/dip-?28/, [36, 9.5]], [/header|pin.?hdr|hdr-?/, [5, 2.5]]
  ];
  // [length, width] in mm, a rough guess for the highlight around the part
  function size(footprint, value) {
    var f = String(footprint || "").toLowerCase(), m;
    if ((m = /l(\d+(?:\.\d+)?)-w(\d+(?:\.\d+)?)(?:.*?-ls(\d+(?:\.\d+)?))?/.exec(f))) return [Math.max(+m[1], m[3] ? +m[3] : 0), +m[2]];
    if ((m = /(\d+(?:\.\d+)?)\s*[x*]\s*(\d+(?:\.\d+)?)\s*mm/.exec(f))) return [+m[1], +m[2]];
    if ((m = /(?:^|[^\d])(01005|0201|0402|0603|0805|1206|1210|1812|2010|2512)(?:[^\d]|$)/.exec(f))) { var s = IMPERIAL[m[1]]; return [s[0] + 0.8, s[1] + 0.3]; }
    for (var i = 0; i < NAMED.length; i++) if (NAMED[i][0].test(f)) return NAMED[i][1];
    if ((m = /(\d+)\s*p(?:in)?\b|(\d+)x(\d+)/.exec(f)) && m[1]) return [Math.min(30, 2.54 * +m[1]), 2.54];
    void value;
    return [2.6, 2.6];
  }

  // ================================================================ files from a GitHub repository
  var GH = "https://api.github.com/repos/";
  async function ghJson(url) {
    var r = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
    if (r.status === 403 || r.status === 429) throw new Error("GitHub allows only a few requests per hour without login. Try again later or open the files from your computer.");
    if (!r.ok) throw new Error(r.status === 404 ? "This repository was not found." : "GitHub answered " + r.status + ".");
    return r.json();
  }
  // all boards of a repository: [{ name, dir, gerber, bom, cpl }] with paths
  async function repoBoards(repo) {
    var info = await ghJson(GH + repo), branch = info.default_branch;
    var tree = await ghJson(GH + repo + "/git/trees/" + encodeURIComponent(branch) + "?recursive=1");
    var files = (tree.tree || []).filter(function (x) { return x.type === "blob"; }).map(function (x) { return x.path; });
    var stem = function (p) { return p.split("/").pop().toLowerCase().replace(/\.[^.]+$/, "").replace(/(gerber|bom|cpl|pick.?and.?place|pickandplace|pick_place|pos|placement)/g, "").replace(/[_\-. ]+/g, "_").replace(/^_|_$/g, ""); };
    var dir = function (p) { return p.slice(0, p.lastIndexOf("/") + 1); };
    var gerbers = files.filter(function (p) { return /gerber.*\.zip$|\.zip$/i.test(p) && /gerber/i.test(p); });
    var boms = files.filter(function (p) { return /bom[^/]*\.(tsv|csv|txt)$/i.test(p.split("/").pop()); });
    var cpls = files.filter(function (p) { return /(cpl|pick.?and.?place|pickandplace|pick_place|placement)[^/]*\.(tsv|csv|txt)$|\.pos$/i.test(p.split("/").pop()); });
    var match = function (list, g) {
      var same = list.filter(function (p) { return dir(p) === dir(g); });
      return same.filter(function (p) { return stem(p) === stem(g); })[0] || (same.length === 1 ? same[0] : null);
    };
    return { branch: branch, boards: gerbers.map(function (g) {
      var name = g.split("/").pop().replace(/[_-]?gerber/i, "").replace(/\.zip$/i, "").replace(/_/g, " ");
      return { name: name, dir: dir(g), gerber: g, bom: match(boms, g), cpl: match(cpls, g) };
    }) };
  }
  function raw(repo, branch, path) {
    return "https://raw.githubusercontent.com/" + repo + "/" + encodeURIComponent(branch) + "/" + path.split("/").map(encodeURIComponent).join("/");
  }

  global.IBOM = { decode: decode, table: table, kind: kind, readBom: readBom, readCpl: readCpl, writeCpl: writeCpl, size: size,
    designators: designators, natCmp: natCmp, repoBoards: repoBoards, raw: raw };
})(typeof window !== "undefined" ? window : globalThis);
