/* Signal Analyzer: files. sigrok sessions (.sr, a ZIP archive), VCD and CSV in both
 * directions, and text export of decoded data. */
(function (global) {
  "use strict";
  var SA = global.SA;

  // ================================================================ ZIP
  var CRC = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(b) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function streamBytes(bytes, transform) {
    var s = new Blob([bytes]).stream().pipeThrough(transform);
    return new Response(s).arrayBuffer().then(function (ab) { return new Uint8Array(ab); });
  }
  function inflate(bytes) {
    if (typeof DecompressionStream === "undefined") return Promise.reject(new Error("This browser cannot unpack ZIP files."));
    return streamBytes(bytes, new DecompressionStream("deflate-raw"));
  }
  function deflate(bytes) {
    if (typeof CompressionStream === "undefined") return Promise.resolve(null);
    return streamBytes(bytes, new CompressionStream("deflate-raw"));
  }
  // { name: Uint8Array }
  function unzip(buf) {
    var b = new Uint8Array(buf), dv = new DataView(b.buffer, b.byteOffset, b.byteLength), e = -1;
    for (var i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { e = i; break; }
    if (e < 0) return Promise.reject(new Error("Not a ZIP archive."));
    var count = dv.getUint16(e + 10, true), p = dv.getUint32(e + 16, true), jobs = [], out = {};
    for (var k = 0; k < count; k++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;
      var method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), nlen = dv.getUint16(p + 28, true),
        xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
      var name = new TextDecoder().decode(b.subarray(p + 46, p + 46 + nlen));
      var lh = off + 30 + dv.getUint16(off + 26, true) + dv.getUint16(off + 28, true), data = b.subarray(lh, lh + csize);
      (function (name, method, data) {
        if (method === 0) out[name] = data;
        else if (method === 8) jobs.push(inflate(data).then(function (d) { out[name] = d; }));
      })(name, method, data);
      p += 46 + nlen + xlen + clen;
    }
    return Promise.all(jobs).then(function () { return out; });
  }
  // files: [{name, data}] -> Blob
  function zip(files) {
    return Promise.all(files.map(function (f) {
      return (f.data.length > 64 ? deflate(f.data) : Promise.resolve(null)).then(function (c) {
        var use = c && c.length < f.data.length;
        return { name: new TextEncoder().encode(f.name), raw: f.data, data: use ? c : f.data, method: use ? 8 : 0, crc: crc32(f.data) };
      });
    })).then(function (list) {
      var parts = [], central = [], off = 0;
      list.forEach(function (f) {
        var h = new DataView(new ArrayBuffer(30));
        h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(8, f.method, true);
        h.setUint16(10, 0, true); h.setUint16(12, 0x21, true); h.setUint32(14, f.crc, true);
        h.setUint32(18, f.data.length, true); h.setUint32(22, f.raw.length, true); h.setUint16(26, f.name.length, true);
        parts.push(h.buffer, f.name, f.data);
        var c = new DataView(new ArrayBuffer(46));
        c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(10, f.method, true);
        c.setUint16(14, 0x21, true); c.setUint32(16, f.crc, true); c.setUint32(20, f.data.length, true); c.setUint32(24, f.raw.length, true);
        c.setUint16(28, f.name.length, true); c.setUint32(42, off, true);
        central.push(c.buffer, f.name);
        off += 30 + f.name.length + f.data.length;
      });
      var csize = central.reduce(function (s, x) { return s + x.byteLength; }, 0), e = new DataView(new ArrayBuffer(22));
      e.setUint32(0, 0x06054b50, true); e.setUint16(8, list.length, true); e.setUint16(10, list.length, true);
      e.setUint32(12, csize, true); e.setUint32(16, off, true);
      return new Blob(parts.concat(central, [e.buffer]), { type: "application/zip" });
    });
  }

  // ================================================================ sigrok session (.sr)
  function parseRate(s) {
    var m = /([\d.]+)\s*([kMG]?)\s*Hz/i.exec(s || "");
    if (!m) return 0;
    return parseFloat(m[1]) * ({ "": 1, k: 1e3, K: 1e3, M: 1e6, G: 1e9 }[m[2]] || 1);
  }
  function rateText(r) {
    if (r >= 1e9 && r % 1e9 === 0) return r / 1e9 + " GHz";
    if (r >= 1e6 && r % 1e6 === 0) return r / 1e6 + " MHz";
    if (r >= 1e3 && r % 1e3 === 0) return r / 1e3 + " kHz";
    return Math.round(r) + " Hz";
  }
  function concat(chunks) {
    var len = chunks.reduce(function (s, c) { return s + c.length; }, 0), out = new Uint8Array(len), p = 0;
    chunks.forEach(function (c) { out.set(c, p); p += c.length; });
    return out;
  }
  function readSr(buf) {
    return unzip(buf).then(function (files) {
      var meta = files.metadata && new TextDecoder().decode(files.metadata);
      if (!meta) throw new Error("This archive has no sigrok metadata.");
      var sect = null, dev = {};
      meta.split(/\r?\n/).forEach(function (l) {
        var m;
        if ((m = /^\[(.+)\]$/.exec(l.trim()))) { sect = m[1]; return; }
        if (sect === "device 1" && (m = /^([^=]+)=(.*)$/.exec(l))) dev[m[1].trim()] = m[2].trim();
      });
      var rate = parseRate(dev.samplerate) || 1e6, probes = +dev["total probes"] || 0, analogs = +dev["total analog"] || 0;
      var unit = +dev.unitsize || 1, cap = dev.capturefile || "logic-1";
      // logic chunks: logic-1-1, logic-1-2 … (old files: just "logic-1")
      var names = Object.keys(files).filter(function (n) { return n === cap || n.indexOf(cap + "-") === 0; });
      names.sort(function (a, b) { return (+a.split("-").pop()) - (+b.split("-").pop()); });
      var raw = concat(names.map(function (n) { return files[n]; })), n = Math.floor(raw.length / unit);
      var digital = [], words = null;
      for (var i = 1; i <= probes; i++) if (dev["probe" + i]) digital.push({ id: "D" + (i - 1), name: dev["probe" + i], bit: i - 1 });
      if (digital.length && n) {
        var bits = Math.max.apply(null, digital.map(function (c) { return c.bit; })) + 1;
        words = bits <= 8 ? new Uint8Array(n) : bits <= 16 ? new Uint16Array(n) : new Uint32Array(n);
        var bytes = Math.min(unit, words.BYTES_PER_ELEMENT);
        if (bytes === 1 && unit === 1) words.set(raw.subarray(0, n));
        else for (var s = 0, p = 0; s < n; s++, p += unit) {
          var w = 0;
          for (var k = 0; k < bytes; k++) w |= raw[p + k] << (8 * k);
          words[s] = w;
        }
      }
      // analog: analog-1-<index>-<chunk>, index counts probes first
      var analog = [];
      Object.keys(dev).forEach(function (k) {
        var m = /^analog(\d+)$/.exec(k);
        if (!m) return;
        var idx = +m[1], pre = "analog-1-" + idx + "-";
        var parts = Object.keys(files).filter(function (f) { return f.indexOf(pre) === 0; })
          .sort(function (a, b) { return (+a.split("-").pop()) - (+b.split("-").pop()); });
        var bytes = concat(parts.map(function (f) { return files[f]; }));
        var data = new Float32Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + (bytes.length & ~3)));
        analog.push({ id: "A" + analog.length, name: dev[k], data: data, idx: idx });
      });
      analog.sort(function (a, b) { return a.idx - b.idx; });
      if (!n && analog.length) n = analog[0].data.length;
      analog.forEach(function (a) { if (a.data.length !== n) { var d = new Float32Array(n); d.set(a.data.subarray(0, n)); a.data = d; } });
      if (!n) throw new Error("The session holds no samples.");
      void analogs;
      return new SA.Capture({ rate: rate, n: n, words: words, digital: digital, analog: analog, source: "sigrok session" });
    });
  }
  function writeSr(cap) {
    var dig = cap.channels.filter(function (c) { return c.kind === "d"; }), ana = cap.channels.filter(function (c) { return c.kind === "a"; });
    // all digital channels go into one packed stream, one bit each
    var bytes = Math.max(1, Math.ceil(dig.length / 8)), n = cap.n, logic = new Uint8Array(n * bytes);
    var simple = dig.length && dig.every(function (c, i) { return c.store === dig[0].store && c.bit === i; }) && dig[0].store.data instanceof Uint8Array;
    if (simple) logic.set(dig[0].store.data);
    else dig.forEach(function (c, i) {
      var d = c.store.data, b = c.bit, byte = i >> 3, m = 1 << (i & 7);
      for (var s = 0; s < n; s++) if ((d[s] >>> b) & 1) logic[s * bytes + byte] |= m;
    });
    var meta = ["[global]", "sigrok version=0.5.2", "", "[device 1]", "capturefile=logic-1", "total probes=" + dig.length,
      "samplerate=" + rateText(cap.rate), "total analog=" + ana.length];
    dig.forEach(function (c, i) { meta.push("probe" + (i + 1) + "=" + c.name); });
    ana.forEach(function (c, i) { meta.push("analog" + (dig.length + i + 1) + "=" + c.name); });
    meta.push("unitsize=" + bytes, "");
    var files = [{ name: "version", data: new TextEncoder().encode("2") }, { name: "metadata", data: new TextEncoder().encode(meta.join("\n")) }];
    if (dig.length) files.push({ name: "logic-1-1", data: logic });
    ana.forEach(function (c, i) { files.push({ name: "analog-1-" + (dig.length + i + 1) + "-1", data: new Uint8Array(c.store.data.buffer.slice(0)) }); });
    return zip(files);
  }

  // ================================================================ VCD
  var TS = { s: 1, ms: 1e-3, us: 1e-6, ns: 1e-9, ps: 1e-12, fs: 1e-15 };
  function gcd(a, b) { while (b) { var t = a % b; a = b; b = t; } return a; }
  function readVcd(text) {
    var tokens = text.split(/\s+/), i = 0, ts = 1e-9, vars = {}, order = [], scope = [];
    // header
    while (i < tokens.length) {
      var t = tokens[i++];
      if (t === "$timescale") {
        var v = "";
        while (i < tokens.length && tokens[i] !== "$end") v += tokens[i++];
        i++;
        var m = /^(\d+)\s*(s|ms|us|ns|ps|fs)$/.exec(v);
        if (m) ts = +m[1] * TS[m[2]];
      } else if (t === "$scope") { scope.push(tokens[i + 1]); while (tokens[i++] !== "$end"); }
      else if (t === "$upscope") { scope.pop(); while (tokens[i++] !== "$end"); }
      else if (t === "$var") {
        var type = tokens[i], width = +tokens[i + 1], id = tokens[i + 2], name = tokens[i + 3];
        while (tokens[i++] !== "$end");
        if (!vars[id]) { vars[id] = { type: type, width: width, name: name, changes: [] }; order.push(id); }
      } else if (t === "$enddefinitions") { while (tokens[i++] !== "$end"); break; }
      else if (t && t[0] === "$") { while (i < tokens.length && tokens[i++] !== "$end"); }
    }
    // value changes
    var time = 0, times = [0];
    while (i < tokens.length) {
      var x = tokens[i++];
      if (!x) continue;
      var c = x[0];
      if (c === "#") { time = +x.slice(1); times.push(time); }
      else if (c === "0" || c === "1" || c === "x" || c === "X" || c === "z" || c === "Z") { var vv = vars[x.slice(1)]; if (vv) vv.changes.push(time, c === "1" ? 1 : 0); }
      else if (c === "b" || c === "B") { var id2 = tokens[i++], v2 = vars[id2]; if (v2) v2.changes.push(time, parseInt(x.slice(1).replace(/[xz]/gi, "0"), 2) || 0); }
      else if (c === "r" || c === "R") { var id3 = tokens[i++], v3 = vars[id3]; if (v3) { v3.real = true; v3.changes.push(time, parseFloat(x.slice(1))); } }
      else if (c === "$") { while (i < tokens.length && tokens[i++] !== "$end"); }
    }
    var end = times[times.length - 1], step = 0;
    for (var k = 0; k < times.length; k++) step = gcd(step, times[k]);
    if (!step) step = 1;
    var n = Math.floor(end / step) + 1, MAX = 32e6;
    while (n > MAX) { step *= 2; n = Math.floor(end / step) + 1; }
    var rate = 1 / (step * ts);
    // digital: 1-bit wires (vectors are split into bits); real values: analog
    var digital = [], analogVars = [];
    order.forEach(function (id) {
      var v = vars[id];
      if (v.real) analogVars.push(v);
      else if (v.width <= 1) digital.push({ v: v, bit: -1, name: v.name });
      else for (var b = 0; b < v.width && digital.length < 32; b++) digital.push({ v: v, bit: b, name: v.name + "[" + b + "]" });
    });
    digital = digital.slice(0, 32);
    var words = digital.length <= 8 ? new Uint8Array(n) : digital.length <= 16 ? new Uint16Array(n) : new Uint32Array(n);
    digital.forEach(function (d, ci) {
      var ch = d.v.changes, val = 0, s = 0, mask = 1 << ci;
      for (var j = 0; j <= ch.length; j += 2) {
        var at = j < ch.length ? Math.min(n, Math.floor(ch[j] / step)) : n;
        if (val) for (; s < at; s++) words[s] |= mask; else s = at;
        if (j < ch.length) val = d.bit < 0 ? ch[j + 1] : (ch[j + 1] >>> d.bit) & 1;
      }
    });
    var analog = analogVars.map(function (v, ai) {
      var data = new Float32Array(n), ch = v.changes, val = 0, s = 0;
      for (var j = 0; j <= ch.length; j += 2) {
        var at = j < ch.length ? Math.min(n, Math.floor(ch[j] / step)) : n;
        for (; s < at; s++) data[s] = val;
        if (j < ch.length) val = ch[j + 1];
      }
      return { id: "A" + ai, name: v.name, data: data };
    });
    if (!digital.length && !analog.length) throw new Error("The VCD file has no signals.");
    return new SA.Capture({ rate: rate, n: n, words: digital.length ? words : null,
      digital: digital.map(function (d, ci) { return { id: "D" + ci, name: d.name, bit: ci }; }), analog: analog, source: "VCD file" });
  }
  function vcdId(i) { var s = ""; do { s += String.fromCharCode(33 + (i % 94)); i = Math.floor(i / 94); } while (i); return s; }
  function writeVcd(cap) {
    var dig = cap.channels.filter(function (c) { return c.kind === "d"; }), ana = cap.channels.filter(function (c) { return c.kind === "a"; });
    var period = 1 / cap.rate, unit = period >= 1e-6 && Math.abs(period / 1e-9 - Math.round(period / 1e-9)) < 1e-6 ? 1e-9 : 1e-12;
    var per = period / unit, out = ["$date " + cap.date.toISOString() + " $end", "$version Signal Analyzer by wagiminator $end",
      "$comment " + cap.n + " samples at " + rateText(cap.rate) + " $end", "$timescale 1 " + (unit === 1e-9 ? "ns" : "ps") + " $end", "$scope module signals $end"];
    dig.forEach(function (c, i) { out.push("$var wire 1 " + vcdId(i) + " " + c.name.replace(/\s+/g, "_") + " $end"); });
    ana.forEach(function (c, i) { out.push("$var real 64 " + vcdId(dig.length + i) + " " + c.name.replace(/\s+/g, "_") + " $end"); });
    out.push("$upscope $end", "$enddefinitions $end");
    // merge the edges of all channels
    var events = [];
    dig.forEach(function (c, i) { var e = c.store.edges(c.bit); for (var k = 0; k < e.length; k++) events.push(e[k] * 64 + i); });
    if (ana.length && cap.n > 2e6) throw new Error("Analog channels with more than 2 million samples are too big for VCD; use .sr.");
    events.sort(function (a, b) { return a - b; });
    var lines = ["#0"];
    dig.forEach(function (c, i) { lines.push(cap.bitAt(c, 0) + vcdId(i)); });
    ana.forEach(function (c, i) { lines.push("r" + c.store.data[0] + " " + vcdId(dig.length + i)); });
    var last = 0, ei = 0;
    var anaLast = ana.map(function (c) { return c.store.data[0]; });
    var sNext = ana.length ? 1 : Infinity;
    while (ei < events.length || sNext < cap.n) {
      var es = ei < events.length ? Math.floor(events[ei] / 64) : Infinity, s = Math.min(es, sNext);
      if (s !== last) { lines.push("#" + Math.round(s * per)); last = s; }
      while (ei < events.length && Math.floor(events[ei] / 64) === s) {
        var ci = events[ei] % 64; lines.push(cap.bitAt(dig[ci], s) + vcdId(ci)); ei++;
      }
      if (s === sNext) {
        ana.forEach(function (c, i) { var v = c.store.data[s]; if (v !== anaLast[i]) { lines.push("r" + v + " " + vcdId(dig.length + i)); anaLast[i] = v; } });
        sNext++;
      }
    }
    lines.push("#" + Math.round(cap.n * per));
    return new Blob([out.join("\n") + "\n" + lines.join("\n") + "\n"], { type: "text/plain" });
  }

  // ================================================================ CSV
  function readCsv(text) {
    var lines = text.split(/\r?\n/).filter(function (l) { return l.trim() && !/^[#;]/.test(l); });
    if (lines.length < 2) throw new Error("The CSV file is empty.");
    var sep = (lines[0].match(/;/g) || []).length > (lines[0].match(/,/g) || []).length ? ";" : lines[0].indexOf("\t") >= 0 ? "\t" : ",";
    var split = function (l) { return l.split(sep).map(function (s) { return s.trim().replace(/^"|"$/g, ""); }); };
    var head = split(lines[0]), hasHead = head.some(function (h) { return isNaN(parseFloat(h)); });
    var rows = (hasHead ? lines.slice(1) : lines).map(split);
    if (!hasHead) head = head.map(function (h, i) { return i ? "CH" + (i - 1) : "Time"; });
    var timeCol = /time|zeit|^t$|^s$/i.test(head[0]) || true;
    var t = rows.map(function (r) { return parseFloat(r[0]); });
    // the smallest step between rows sets the sample rate
    var minStep = Infinity;
    for (var i = 1; i < t.length; i++) { var d = t[i] - t[i - 1]; if (d > 0 && d < minStep) minStep = d; }
    if (!isFinite(minStep)) minStep = 1;
    var t0 = t[0], span = t[t.length - 1] - t0, n = Math.floor(span / minStep + 1e-6) + 1;
    while (n > 32e6) { minStep *= 2; n = Math.floor(span / minStep + 1e-6) + 1; }
    var rate = /sample/i.test(head[0]) ? 1e6 : 1 / minStep;
    if (/sample/i.test(head[0])) { minStep = 1; n = Math.floor(span) + 1; }
    void timeCol;
    var cols = head.slice(1).map(function (name, ci) {
      var vals = rows.map(function (r) { return parseFloat(r[ci + 1]); });
      var digital = vals.every(function (v) { return v === 0 || v === 1 || isNaN(v); });
      return { name: name || "CH" + ci, vals: vals, digital: digital };
    });
    var dcols = cols.filter(function (c) { return c.digital; }).slice(0, 32), acols = cols.filter(function (c) { return !c.digital; });
    var words = dcols.length <= 8 ? new Uint8Array(n) : dcols.length <= 16 ? new Uint16Array(n) : new Uint32Array(n);
    var idx = t.map(function (x) { return Math.min(n - 1, Math.round((x - t0) / minStep)); });
    dcols.forEach(function (c, ci) {
      var m = 1 << ci;
      for (var r = 0; r < rows.length; r++) {
        var a = idx[r], b = r + 1 < rows.length ? idx[r + 1] : n;
        if (c.vals[r] === 1) for (var s = a; s < b; s++) words[s] |= m;
      }
    });
    var analog = acols.map(function (c, ai) {
      var data = new Float32Array(n);
      for (var r = 0; r < rows.length; r++) {
        var a = idx[r], b = r + 1 < rows.length ? idx[r + 1] : n, v = isNaN(c.vals[r]) ? 0 : c.vals[r];
        for (var s = a; s < b; s++) data[s] = v;
      }
      return { id: "A" + ai, name: c.name, data: data };
    });
    return new SA.Capture({ rate: rate, n: n, words: dcols.length ? words : null,
      digital: dcols.map(function (c, ci) { return { id: "D" + ci, name: c.name, bit: ci }; }), analog: analog, source: "CSV file" });
  }
  // one line per change (digital only) or per sample (with analog channels)
  function writeCsv(cap) {
    var dig = cap.channels.filter(function (c) { return c.kind === "d"; }), ana = cap.channels.filter(function (c) { return c.kind === "a"; });
    var head = ["Time [s]"].concat(dig.map(function (c) { return c.name; }), ana.map(function (c) { return c.name; }));
    var out = [head.join(",")], per = 1 / cap.rate;
    var row = function (s) {
      var r = [(s * per).toPrecision(10)];
      dig.forEach(function (c) { r.push(cap.bitAt(c, s)); });
      ana.forEach(function (c) { r.push(+c.store.data[s].toPrecision(6)); });
      out.push(r.join(","));
    };
    if (ana.length) {
      if (cap.n > 2e6) throw new Error("With analog channels, CSV export is limited to 2 million samples.");
      for (var s = 0; s < cap.n; s++) row(s);
    } else {
      var ev = [];
      dig.forEach(function (c) { var e = c.store.edges(c.bit); for (var k = 0; k < e.length; k++) ev.push(e[k]); });
      ev.sort(function (a, b) { return a - b; });
      row(0);
      for (var i = 0; i < ev.length; i++) if (ev[i] !== ev[i - 1]) row(ev[i]);
      row(cap.n - 1);
    }
    return new Blob([out.join("\n") + "\n"], { type: "text/csv" });
  }

  // ================================================================ any file
  function read(file) {
    var name = file.name.toLowerCase();
    if (/\.(sr|zip)$/.test(name)) return file.arrayBuffer().then(readSr);
    return file.text().then(function (t) {
      if (/\.vcd$/.test(name) || /^\s*\$(date|version|timescale|comment|scope|var)/.test(t)) return readVcd(t);
      return readCsv(t);
    });
  }

  SA.files = { read: read, readSr: readSr, writeSr: writeSr, readVcd: readVcd, writeVcd: writeVcd, readCsv: readCsv, writeCsv: writeCsv,
    unzip: unzip, zip: zip, crc32: crc32, rateText: rateText };
})(typeof window !== "undefined" ? window : globalThis);
