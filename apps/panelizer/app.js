/* Gerber Panelizer: the user interface. Panel: js/panel.js, reading and drawing: ../gerber-viewer/gerber.js. */
(function () {
  "use strict";
  var G = window.GERBER, P = window.PANEL, $ = function (id) { return document.getElementById(id); };
  var f1 = function (v) { return P.fmtN(v, 1); }, f2 = function (v) { return P.fmtN(v, 2); };

  // ---------------------------------------------------------------- settings
  var KEY = "gerber-panelizer";
  function defaults() {
    return { perRow: 0, gap: 2, mode: "tabs", tabW: 3, perEdge: 0, bites: true, biteD: 0.5, bitePitch: 0.8, biteOff: 0.25, vsOnOutline: false,
      frame: "tb", rail: 5, fiducials: true, fidD: 1, fidMask: 2, tooling: true, toolD: 2, name: "panel", side: "top", mask: "green" };
  }
  var S = (function () { var d = defaults(); try { Object.assign(d, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { /* none */ } return d; })();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* private mode */ } }

  var boards = [], nextId = 1, result = null, timer = 0;

  // ---------------------------------------------------------------- helpers
  function pressed(group, v) { group.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.v === String(v))); }); }
  function segClick(id, fn) { $(id).addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) fn(b.dataset.v); }); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function kb(n) { return n < 1024 ? n + " B" : n < 1048576 ? (n / 1024).toFixed(1) + " KB" : (n / 1048576).toFixed(2) + " MB"; }

  // ---------------------------------------------------------------- loading boards
  var dec = new TextDecoder("utf-8");
  async function addFiles(list) {
    var files = Array.from(list), zips = files.filter(function (f) { return /\.zip$/i.test(f.name); }), loose = files.filter(function (f) { return !/\.zip$/i.test(f.name); });
    var errors = [];
    for (var i = 0; i < zips.length; i++) {
      try {
        var entries = await G.unzip(await zips[i].arrayBuffer());
        addDesign(zips[i].name.replace(/\.zip$/i, "").replace(/[_-]?gerbers?$/i, ""), entries.filter(function (e) { return !/\.zip$/i.test(e.name); }).map(function (e) { return { name: e.name, text: dec.decode(e.data) }; }));
      } catch (e) { errors.push(zips[i].name + " is not a ZIP file the browser can read."); }
    }
    if (loose.length) {
      var texts = [];
      for (var j = 0; j < loose.length; j++) texts.push({ name: loose[j].name, text: await loose[j].text() });
      addDesign(commonName(loose.map(function (f) { return f.name; })), texts);
    }
    if (errors.length) showLoadErrors(errors);
    update();
  }
  function commonName(names) {
    var p = names[0] || "board";
    names.forEach(function (n) { while (p && n.indexOf(p) !== 0) p = p.slice(0, -1); });
    p = p.replace(/[._-]+$/, "").replace(/[_-]?(gerber|gerbers)?$/i, "");
    return p.length >= 2 ? p : "board";
  }
  function addDesign(name, files) {
    var d = P.makeDesign(name, files);
    if (!d.loops.length) { showLoadErrors([name + ": no board found in these files (no outline and no copper)."]); return; }
    boards.push({ id: nextId++, design: d, count: boards.length ? 1 : 4, rot: 0 });
  }
  var loadErr = [];
  function showLoadErrors(list) { loadErr = list; }
  $("add").addEventListener("click", function () { $("file").click(); });
  $("add2").addEventListener("click", function () { $("file").click(); });
  $("file").addEventListener("change", function () { if (this.files.length) addFiles(this.files); this.value = ""; });
  $("demo").addEventListener("click", function () { addDesign("Demo board", window.PANEL_DEMO()); update(); });
  var drop = $("drop");
  document.addEventListener("dragover", function (e) { e.preventDefault(); drop.classList.add("over"); });
  document.addEventListener("dragleave", function (e) { if (!e.relatedTarget) drop.classList.remove("over"); });
  document.addEventListener("drop", function (e) { e.preventDefault(); drop.classList.remove("over"); if (e.dataTransfer && e.dataTransfer.files.length) addFiles(e.dataTransfer.files); });

  // ---------------------------------------------------------------- board list
  function drawBoards() {
    var ol = $("boards");
    ol.innerHTML = boards.map(function (b) {
      var d = b.design, n = d.pth.length + d.npth.length;
      return '<li data-id="' + b.id + '"><div class="b-head"><span class="b-name" title="' + esc(d.name) + '">' + esc(d.name) + '</span><button type="button" class="b-x" data-act="del" aria-label="Remove ' + esc(d.name) + '" title="Remove">×</button></div>' +
        '<p class="b-meta">' + f2(d.w) + " × " + f2(d.h) + " mm, " + d.layerCount + " copper layers, " + n + " holes" + (d.rect ? "" : ", not a plain rectangle") + "</p>" +
        '<div class="b-ctl"><label class="inline">Copies <input type="number" min="0" max="200" value="' + b.count + '" data-act="count" aria-label="Copies of ' + esc(d.name) + '"></label>' +
        '<div class="seg" role="group" aria-label="Rotation of ' + esc(d.name) + '" data-act="rot">' + [0, 90, 180, 270].map(function (r) { return '<button type="button" data-v="' + r + '" aria-pressed="' + (b.rot === r) + '">' + r + "°</button>"; }).join("") + "</div></div>" +
        (d.warnings.length ? '<p class="b-warn">' + d.warnings.map(esc).join("<br>") + "</p>" : "") + "</li>";
    }).join("");
  }
  $("boards").addEventListener("click", function (e) {
    var li = e.target.closest("li"); if (!li) return;
    var b = boards.filter(function (x) { return x.id === +li.dataset.id; })[0], t = e.target.closest("[data-act]"), btn = e.target.closest("button");
    if (!b || !t) return;
    if (t.dataset.act === "del") { boards = boards.filter(function (x) { return x !== b; }); update(); }
    else if (t.dataset.act === "rot" && btn) { b.rot = +btn.dataset.v; update(); }
  });
  $("boards").addEventListener("change", function (e) {
    var li = e.target.closest("li"); if (!li || e.target.dataset.act !== "count") return;
    var b = boards.filter(function (x) { return x.id === +li.dataset.id; })[0], v = parseInt(e.target.value, 10);
    b.count = isFinite(v) ? Math.max(0, Math.min(200, v)) : 1; e.target.value = b.count; update(true);
  });

  // ---------------------------------------------------------------- options
  function num(id, key, lo, hi) {
    $(id).addEventListener("change", function () { var v = parseFloat(String(this.value).replace(",", ".")); if (!isFinite(v)) v = defaults()[key]; S[key] = Math.max(lo, Math.min(hi, v)); this.value = S[key]; changed(); });
  }
  num("gap", "gap", 0.5, 20); num("tabw", "tabW", 1, 20); num("bited", "biteD", 0.2, 1.5); num("bitep", "bitePitch", 0.4, 3); num("biteo", "biteOff", -0.5, 1);
  num("rail", "rail", 2, 30); num("fidd", "fidD", 0.5, 3); num("fidm", "fidMask", 1, 5); num("toold", "toolD", 1, 5);
  $("perrow").addEventListener("change", function () { var v = parseInt(this.value, 10); S.perRow = isFinite(v) && v > 0 ? Math.min(50, v) : 0; this.value = S.perRow || ""; changed(); });
  $("peredge").addEventListener("change", function () { S.perEdge = +this.value; changed(); });
  [["bites", "bites"], ["vsout", "vsOnOutline"], ["fid", "fiducials"], ["tool", "tooling"]].forEach(function (p) { $(p[0]).addEventListener("change", function () { S[p[1]] = this.checked; changed(); }); });
  segClick("sep", function (v) { S.mode = v; changed(); });
  segClick("frame", function (v) { S.frame = v; changed(); });
  segClick("side", function (v) { S.side = v; save(); syncOpts(); draw(); });
  $("mask").innerHTML = Object.keys(G.MASK_COLORS).map(function (k) { return '<option value="' + k + '">' + G.MASK_COLORS[k].name + "</option>"; }).join("");
  $("mask").addEventListener("change", function () { S.mask = this.value; save(); draw(); });
  $("name").addEventListener("change", function () { S.name = this.value.trim().replace(/[^A-Za-z0-9_.-]+/g, "_") || "panel"; this.value = S.name; changed(); });
  function syncOpts() {
    $("perrow").value = S.perRow || ""; $("gap").value = S.gap; $("tabw").value = S.tabW; $("peredge").value = S.perEdge;
    $("bites").checked = S.bites; $("bited").value = S.biteD; $("bitep").value = S.bitePitch; $("biteo").value = S.biteOff; $("bite-opts").hidden = !S.bites;
    pressed($("sep"), S.mode); $("tab-opts").hidden = S.mode !== "tabs"; $("vs-opts").hidden = S.mode !== "vscore"; $("vsout").checked = S.vsOnOutline;
    $("gap").disabled = S.mode === "vscore";
    pressed($("frame"), S.frame); $("frame-opts").hidden = S.frame === "none"; $("rail").value = S.rail;
    $("fid").checked = S.fiducials; $("fid-opts").hidden = !S.fiducials; $("fidd").value = S.fidD; $("fidm").value = S.fidMask;
    $("tool").checked = S.tooling; $("tool-opts").hidden = !S.tooling; $("toold").value = S.toolD;
    pressed($("side"), S.side); $("mask").value = S.mask; $("name").value = S.name;
  }
  function changed() { save(); syncOpts(); update(); }

  // ---------------------------------------------------------------- building
  function update(soon) {
    drawBoards();
    clearTimeout(timer);
    timer = setTimeout(run, soon ? 250 : 30);
  }
  function run() {
    var items = [];
    boards.forEach(function (b) { for (var i = 0; i < b.count; i++) items.push({ design: b.design, rot: b.rot }); });
    $("empty").hidden = !!boards.length; $("view").hidden = !boards.length;
    result = null; preview = null;
    if (items.length) {
      try { result = P.build(items, Object.assign({}, S, { maxReach: 8 })); }
      catch (e) { console.error(e); loadErr = ["The panel could not be made: " + e.message]; }
    }
    if (result) {
      try { preview = G.buildBoard(result.files.map(function (f) { return { name: f.name, type: f.type === "vscore" ? "ignore" : f.type, text: f.text }; })); }
      catch (e) { console.error(e); }
    }
    info(); files(); draw();
  }
  var preview = null;
  function info() {
    var el = $("info"), w = $("warn");
    if (!result) { el.textContent = boards.length ? "No copies on the panel." : ""; }
    else {
      var r = result.info, t = "Panel " + f2(r.W) + " × " + f2(r.H) + " mm with " + r.boards + (r.boards === 1 ? " board" : " boards") + ", " + result.layerCount + " copper layers";
      t += S.mode === "vscore" ? ", " + result.vlines.length + " score lines" : ", " + result.tabs.length + " tabs" + (r.bites ? " and " + r.bites + " mouse-bite holes" : "");
      el.textContent = t + ".";
    }
    var list = loadErr.concat(result ? result.warnings : []);
    w.innerHTML = list.map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("");
    loadErr = [];
  }
  function files() {
    var ul = $("files");
    $("save").disabled = !result;
    ul.innerHTML = result ? result.files.map(function (f) { return "<li><span>" + esc(f.name) + "</span><span>" + kb(f.text.length) + "</span></li>"; }).join("") : "";
  }

  // ---------------------------------------------------------------- drawing
  function draw() {
    var cv = $("view");
    if (!preview || !result || !preview.bbox.valid()) { cv.width = cv.height = 0; return; }
    var b = preview.bbox, w = b.x1 - b.x0, h = b.y1 - b.y0, dpr = window.devicePixelRatio || 1;
    var avail = Math.max(200, $("stage").clientWidth - 30), maxH = Math.max(260, window.innerHeight * 0.72);
    var css = Math.min(avail / w, maxH / h, 24), s = css * dpr;
    if (w * s * h * s > 9e6) s = Math.sqrt(9e6 / (w * h));
    var img = G.render(preview, { side: S.side, scale: s, mask: S.mask, silk: S.mask === "white" ? "black" : "white", finish: "gold" });
    cv.width = img.width; cv.height = img.height; cv.style.width = img.width / s * css + "px"; cv.style.height = img.height / s * css + "px";
    var g = cv.getContext("2d");
    g.clearRect(0, 0, cv.width, cv.height); g.drawImage(img, 0, 0);
    // score lines are not part of the board picture: draw them
    if (result.vlines.length) {
      var top = S.side === "top", X = function (x) { return top ? (x - b.x0) * s : (b.x1 - x) * s; }, Y = function (y) { return (b.y1 - y) * s; };
      g.save(); g.strokeStyle = "rgba(255,80,60,0.9)"; g.lineWidth = Math.max(1, 0.25 * s); g.setLineDash([2 * s, 1.2 * s]);
      result.vlines.forEach(function (l) { g.beginPath(); g.moveTo(X(l[0]), Y(l[1])); g.lineTo(X(l[2]), Y(l[3])); g.stroke(); });
      g.restore();
    }
  }
  var rt = 0;
  window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(draw, 150); });

  // ---------------------------------------------------------------- ZIP
  var CRC = (function () { var t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  async function deflate(u8) {
    if (!("CompressionStream" in window)) return null;
    try { return new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(new CompressionStream("deflate-raw"))).arrayBuffer()); } catch (e) { return null; }
  }
  async function zip(list) {
    var enc = new TextEncoder(), parts = [], central = [], off = 0;
    var d = new Date(), time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    for (var i = 0; i < list.length; i++) {
      var f = list[i], name = enc.encode(f.name), raw = enc.encode(f.text), crc = crc32(raw), packed = await deflate(raw), method = packed && packed.length < raw.length ? 8 : 0, data = method ? packed : raw;
      var h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, method, true);
      h.setUint16(10, time, true); h.setUint16(12, date, true); h.setUint32(14, crc, true);
      h.setUint32(18, data.length, true); h.setUint32(22, raw.length, true); h.setUint16(26, name.length, true);
      var c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, method, true);
      c.setUint16(12, time, true); c.setUint16(14, date, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, raw.length, true);
      c.setUint16(28, name.length, true); c.setUint32(42, off, true);
      parts.push(new Uint8Array(h.buffer), name, data); central.push(new Uint8Array(c.buffer), name);
      off += 30 + name.length + data.length;
    }
    var size = central.reduce(function (s, p) { return s + p.length; }, 0), e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, list.length, true); e.setUint16(10, list.length, true); e.setUint32(12, size, true); e.setUint32(16, off, true);
    return new Blob(parts.concat(central, [new Uint8Array(e.buffer)]), { type: "application/zip" });
  }
  $("save").addEventListener("click", async function () {
    if (!result) return;
    var b = this; b.disabled = true;
    var blob = await zip(result.files), a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = (S.name || "panel") + "-gerber.zip";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 3000);
    b.disabled = false;
  });

  // ---------------------------------------------------------------- start
  syncOpts(); update();
})();
