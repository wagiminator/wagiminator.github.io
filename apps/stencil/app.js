/* Solder Paste Stencil: the user interface. Geometry: js/stencil.js, 3D view: js/view3d.js,
 * reading Gerber files: ../gerber-viewer/gerber.js. */
(function () {
  "use strict";
  var G = window.GERBER, ST = window.STENCIL, $ = function (id) { return document.getElementById(id); };
  var f2 = function (v) { return (Math.round(v * 100) / 100).toString(); };

  // ---------------------------------------------------------------- settings
  var KEY = "solder-paste-stencil";
  function defaults() { return { side: "top", thick: 0.15, border: 10, offset: 0, mark: true, frame: "pocket", frameH: 1.6, clear: 0.15, pinClear: 0.2, pinLen: 1.2, view: "2d", name: "" }; }
  var S = (function () { var d = defaults(); try { Object.assign(d, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { /* none */ } return d; })();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(Object.assign({}, S, { name: "" }))); } catch (e) { /* private mode */ } }

  var board = null, pinSel = new Set(), result = null, timer = 0, loadErr = [];
  var v3 = new window.View3D($("c3d"));

  function pressed(group, v) { group.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.v === String(v))); }); }
  function segClick(id, fn) { $(id).addEventListener("click", function (e) { var b = e.target.closest("button"); if (b && !b.disabled) fn(b.dataset.v); }); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // ---------------------------------------------------------------- demo board (40 × 30 mm)
  function demoFiles() {
    var c = function (v) { return String(Math.round(v * 1e6)); }, xy = function (x, y) { return "X" + c(x) + "Y" + c(y); };
    var head = function (ff) { return ["%TF.FileFunction," + ff + "*%", "%FSLAX46Y46*%", "%MOMM*%", "%LPD*%", "G75*", "G01*"]; };
    var pads = [];       // [x, y, w, h]
    var i;
    for (i = 0; i < 4; i++) { pads.push([8 + i * 1.27, 8, 0.6, 1.6], [8 + i * 1.27, 14.6, 0.6, 1.6]); }                     // SOIC-8
    for (i = 0; i < 4; i++) {                                                                                                  // QFN-16, 0.65 mm pitch
      var u = -0.975 + i * 0.65;
      pads.push([24 + u, 9.1, 0.3, 0.8], [24 + u, 14.9, 0.3, 0.8], [21.1, 12 + u, 0.8, 0.3], [26.9, 12 + u, 0.8, 0.3]);
    }
    [[22.9, 10.9], [25.1, 10.9], [22.9, 13.1], [25.1, 13.1]].forEach(function (p) { pads.push([p[0], p[1], 1.6, 1.6]); });   // exposed pad in four windows
    [[32, 8], [32, 12], [32, 16]].forEach(function (p) { pads.push([p[0] - 0.95, p[1], 1.0, 1.3], [p[0] + 0.95, p[1], 1.0, 1.3]); });   // 0805
    pads.push([10, 22, 0.9, 0.8], [12, 22, 0.9, 0.8], [11, 24, 0.9, 0.8]);                                                      // SOT-23
    var paste = head("Paste,Top"), defs = {}, n = 10;
    pads.forEach(function (p) { var k = p[2] + "X" + p[3]; if (!defs[k]) { defs[k] = n++; paste.push("%ADD" + defs[k] + "R," + p[2] + "X" + p[3] + "*%"); } });
    pads.forEach(function (p) { paste.push("D" + defs[p[2] + "X" + p[3]] + "*", xy(p[0], p[1]) + "D03*"); });
    paste.push("M02*");
    var W = 40, H = 30, R = 3, o = head("Profile,NP");
    o.push("%ADD10C,0.1*%", "D10*", xy(R, 0) + "D02*", xy(W - R, 0) + "D01*", "G03*", xy(W, R) + "I0J" + c(R) + "D01*", "G01*", xy(W, H - R) + "D01*",
      "G03*", xy(W - R, H) + "I-" + c(R) + "J0D01*", "G01*", xy(R, H) + "D01*", "G03*", xy(0, H - R) + "I0J-" + c(R) + "D01*", "G01*", xy(0, R) + "D01*", "G03*", xy(R, 0) + "I" + c(R) + "J0D01*", "M02*");
    var npth = ["M48", "METRIC,TZ", "T1C3.200", "%", "G90", "G05", "T1", "X3.600Y26.400", "X36.400Y3.600", "M30"];
    var pth = ["M48", "METRIC,TZ", "T1C1.000", "%", "G90", "G05", "T1", "X20.000Y25.000", "X22.540Y25.000", "X25.080Y25.000", "X27.620Y25.000", "M30"];
    return [{ name: "demo-F_Paste.gbr", text: paste.join("\n") }, { name: "demo-Edge_Cuts.gbr", text: o.join("\n") }, { name: "demo-NPTH.drl", text: npth.join("\n") }, { name: "demo-PTH.drl", text: pth.join("\n") }];
  }

  // ---------------------------------------------------------------- loading
  var dec = new TextDecoder("utf-8");
  async function openFiles(list) {
    var files = Array.from(list), texts = [], names = [];
    loadErr = [];
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      if (/\.zip$/i.test(f.name)) {
        try { (await G.unzip(await f.arrayBuffer())).forEach(function (e) { if (!/\.zip$/i.test(e.name)) texts.push({ name: e.name, text: dec.decode(e.data) }); }); names.push(f.name.replace(/\.zip$/i, "")); }
        catch (e) { loadErr.push(f.name + " is not a ZIP file the browser can read."); }
      } else { texts.push({ name: f.name, text: await f.text() }); names.push(f.name.replace(/\.[^.]*$/, "")); }
    }
    if (texts.length) load(texts, (names[0] || "board").replace(/[_-]?gerbers?$/i, ""));
    else update();
  }
  function load(texts, name) {
    var b = ST.readBoard(texts);
    if (!b.bbox) { loadErr.push("No board found in these files (no outline, no copper or paste layer)."); update(); return; }
    board = b;
    S.name = (name || "board").replace(/[^A-Za-z0-9_.-]+/g, "_");
    if (!b.paste[S.side].length) S.side = b.paste.top.length ? "top" : b.paste.bottom.length ? "bottom" : S.side;
    autoPins();
    sync(); update();
  }
  // pins: up to four not plated holes from 1.5 mm, as far apart as possible
  function autoPins() {
    pinSel = new Set();
    var c = board.holes.map(function (h, i) { return { h: h, i: i }; }).filter(function (o) { return o.h.npth && o.h.d >= 1.5; });
    if (c.length > 4) {
      var pick = [c[0]];
      while (pick.length < 4) {
        var best = null, bd = -1;
        c.forEach(function (o) { if (pick.indexOf(o) >= 0) return; var d = Math.min.apply(null, pick.map(function (p) { return Math.hypot(p.h.x - o.h.x, p.h.y - o.h.y); })); if (d > bd) { bd = d; best = o; } });
        pick.push(best);
      }
      c = pick;
    }
    c.forEach(function (o) { pinSel.add(o.i); });
  }
  $("open").addEventListener("click", function () { $("file").click(); });
  $("open2").addEventListener("click", function () { $("file").click(); });
  $("file").addEventListener("change", function () { if (this.files.length) openFiles(this.files); this.value = ""; });
  $("demo").addEventListener("click", function () { load(demoFiles(), "demo"); });
  var drop = $("drop");
  document.addEventListener("dragover", function (e) { e.preventDefault(); drop.classList.add("over"); });
  document.addEventListener("dragleave", function (e) { if (!e.relatedTarget) drop.classList.remove("over"); });
  document.addEventListener("drop", function (e) { e.preventDefault(); drop.classList.remove("over"); if (e.dataTransfer && e.dataTransfer.files.length) openFiles(e.dataTransfer.files); });

  // ---------------------------------------------------------------- settings
  function num(id, key, lo, hi) {
    $(id).addEventListener("change", function () { var v = parseFloat(String(this.value).replace(",", ".")); if (!isFinite(v)) v = defaults()[key]; S[key] = Math.max(lo, Math.min(hi, v)); this.value = S[key]; changed(); });
  }
  num("thick", "thick", 0.05, 1); num("border", "border", 2, 40); num("offset", "offset", -0.3, 0.3); num("frameh", "frameH", 0.4, 5); num("clear", "clear", 0, 1);
  num("pinclear", "pinClear", 0, 1); num("pinlen", "pinLen", 0.3, 5);
  $("mark").addEventListener("change", function () { S.mark = this.checked; changed(); });
  segClick("side", function (v) { S.side = v; changed(); });
  segClick("frame", function (v) { S.frame = v; changed(); });
  segClick("view", function (v) { S.view = v; save(); sync(); draw(); });
  $("name").addEventListener("change", function () { S.name = this.value.trim().replace(/[^A-Za-z0-9_.-]+/g, "_") || "stencil"; this.value = S.name; });
  function sync() {
    $("thick").value = S.thick; $("border").value = S.border; $("offset").value = S.offset; $("mark").checked = S.mark;
    $("frameh").value = S.frameH; $("clear").value = S.clear; $("pinclear").value = S.pinClear; $("pinlen").value = S.pinLen;
    pressed($("side"), S.side); pressed($("frame"), S.frame); pressed($("view"), S.view);
    $("frame-opts").hidden = $("frame-hint").hidden = S.frame === "none";
    $("name").value = S.name || "";
    var sides = $("side").querySelectorAll("button");
    sides.forEach(function (b) { b.disabled = !!board && !board.paste[b.dataset.v].length; });
  }
  function changed() { save(); sync(); update(); }

  // ---------------------------------------------------------------- building
  function update() { clearTimeout(timer); timer = setTimeout(run, 60); $("info").textContent = board ? "Working …" : ""; }
  function run() {
    result = null;
    if (board) {
      try {
        var pins = board.holes.filter(function (h, i) { return pinSel.has(i); });
        result = ST.build(board, { side: S.side, thick: S.thick, offset: S.offset, border: S.border, frame: S.frame, frameH: S.frameH, clear: S.clear, pins: pins, pinClear: S.pinClear, pinLen: S.pinLen, mark: S.mark });
      } catch (e) { console.error(e); loadErr.push("The stencil could not be made: " + e.message); }
    }
    $("empty").hidden = !!board;
    var bi = $("board-info");
    if (board) {
      var b = board.bbox, holes = board.holes.length;
      bi.textContent = f2(b.x1 - b.x0) + " × " + f2(b.y1 - b.y0) + " mm, paste layer " + (board.paste.top.length ? "top" : "") + (board.paste.top.length && board.paste.bottom.length ? " and " : "") + (board.paste.bottom.length ? "bottom" : "") + (!board.paste.top.length && !board.paste.bottom.length ? "missing" : "") + ", " + holes + (holes === 1 ? " hole" : " holes") + ".";
    } else bi.textContent = "";
    var info = $("info"), fi = $("file-info");
    if (result) {
      var r = result.info;
      info.textContent = "Stencil " + f2(r.W) + " × " + f2(r.H) + " × " + f2(r.Z) + " mm with " + r.openings + (r.openings === 1 ? " opening" : " openings") + " (" + f2(r.area) + " mm² paste)" + (result.pins.length ? " and " + result.pins.length + (result.pins.length === 1 ? " pin" : " pins") : "") + ".";
      fi.textContent = "STL: " + r.triangles.toLocaleString("en") + " triangles, " + (r.triangles * 50 / 1048576).toFixed(1) + " MB.";
    } else { info.textContent = ""; fi.textContent = ""; }
    $("pin-info").textContent = board ? (board.holes.length ? pinSel.size + " of " + board.holes.length + " holes with a pin. Click holes in the view from above to put pins into them or take them away." : "The board has no holes for pins (no drill files).") : "Click holes of the board in the view from above to put pins into them.";
    $("stl").disabled = $("svg").disabled = !result || !result.info.triangles;
    var warn = loadErr.concat(board ? board.warnings : [], result ? result.warnings : []);
    $("warn").innerHTML = warn.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("");
    draw();
  }

  // ---------------------------------------------------------------- drawing
  var view2 = null;
  function draw() {
    var c2 = $("c2d"), c3 = $("c3d"), stage = $("stage"), hint = $("view-hint");
    c2.hidden = !result || S.view !== "2d"; c3.hidden = !result || S.view !== "3d";
    stage.classList.toggle("three", !!result && S.view === "3d");
    hint.textContent = !result ? "" : S.view === "2d" ? "Seen from above as it lies on the " + S.side + " of the board. Holes of the board: grey; with a pin: orange." : "As it lies on the print bed; turned over, it goes onto the board. Drag to turn, scroll to zoom, double-click to reset.";
    if (!result) return;
    if (S.view === "3d") {
      if (!v3.ok) { hint.textContent = "The 3D view needs WebGL, which this browser does not offer. The STL can still be downloaded."; return; }
      if (v3.mesh !== result.mesh) { v3.mesh = result.mesh; v3.set(result.mesh); } else v3.draw();
      return;
    }
    var ub = result.ub, W = ub.x1 - ub.x0, H = ub.y1 - ub.y0, dpr = window.devicePixelRatio || 1;
    var css = Math.min((stage.clientWidth - 30) / W, Math.max(260, window.innerHeight * 0.68) / H, 30), s = css * dpr;
    c2.width = Math.round(W * s); c2.height = Math.round(H * s); c2.style.width = W * css + "px"; c2.style.height = H * css + "px";
    var g = c2.getContext("2d"), m = S.side === "bottom" ? -1 : 1;
    g.setTransform(s, 0, 0, -s, -ub.x0 * s, ub.y1 * s);
    var path = function (r) { var p = new Path2D(); r.forEach(function (q, i) { if (i) p.lineTo(q[0], q[1]); else p.moveTo(q[0], q[1]); }); p.closePath(); return p; };
    // plate, frame, openings
    var plate = path(result.plate);
    g.fillStyle = "#c9d3de"; g.fill(plate);
    if (result.pocket && S.frame !== "none") { var fr = new Path2D(); fr.addPath(plate); fr.addPath(path(result.pocket)); g.fillStyle = "#93a5b8"; g.fill(fr, "evenodd"); }
    var ap = new Path2D(); result.apertures.forEach(function (r) { ap.addPath(path(r)); });
    g.fillStyle = "#2b2f36"; g.fill(ap);
    // board outline and holes
    g.lineWidth = 1.2 / s; g.setLineDash([4 / s, 3 / s]); g.strokeStyle = "#4b5563";
    g.stroke(path(board.outer.map(function (q) { return [m * q[0], q[1]]; })));
    g.setLineDash([]);
    board.holes.forEach(function (h, i) {
      g.beginPath(); g.arc(m * h.x, h.y, h.d / 2, 0, 2 * Math.PI);
      if (pinSel.has(i)) { g.fillStyle = "#e07b00"; g.fill(); } else { g.strokeStyle = "#6b7280"; g.lineWidth = 1 / s; g.stroke(); }
    });
    view2 = { s: s, css: css, ub: ub, m: m };
  }
  $("c2d").addEventListener("click", function (e) {
    if (!view2 || !board) return;
    var r = this.getBoundingClientRect(), x = view2.ub.x0 + (e.clientX - r.left) / view2.css, y = view2.ub.y1 - (e.clientY - r.top) / view2.css, best = -1, bd = Infinity;
    board.holes.forEach(function (h, i) { var d = Math.hypot(view2.m * h.x - x, h.y - y) - h.d / 2; if (d < bd) { bd = d; best = i; } });
    if (best < 0 || bd > 0.8) return;
    if (pinSel.has(best)) pinSel.delete(best); else pinSel.add(best);
    update();
  });
  $("c2d").addEventListener("mousemove", function (e) {
    if (!view2 || !board) return;
    var r = this.getBoundingClientRect(), x = view2.ub.x0 + (e.clientX - r.left) / view2.css, y = view2.ub.y1 - (e.clientY - r.top) / view2.css;
    var near = board.holes.some(function (h) { return Math.hypot(view2.m * h.x - x, h.y - y) - h.d / 2 < 0.8; });
    this.style.cursor = near ? "pointer" : "default";
  });
  var rt = 0;
  window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(draw, 150); });

  // ---------------------------------------------------------------- downloads
  function download(blob, name) {
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 3000);
  }
  function base() { return (S.name || "board") + "-stencil-" + S.side; }
  $("stl").addEventListener("click", function () { if (result) download(new Blob([ST.stl(result.mesh, base())], { type: "model/stl" }), base() + ".stl"); });
  $("svg").addEventListener("click", function () { if (result) download(new Blob([ST.svg(result, base())], { type: "image/svg+xml" }), base() + ".svg"); });

  sync(); run();
})();
