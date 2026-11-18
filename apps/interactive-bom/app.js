/* Interactive BOM: the user interface */
(function () {
  "use strict";

  var G = window.GERBER, I = window.IBOM;
  var $ = function (id) { return document.getElementById(id); };
  var TRY = ["wagiminator/CH552-USB-OLED", "wagiminator/CH32X035-USB-PD-Adapter", "wagiminator/ATtiny814-Power-Analyzer"];
  var SKIP = /\.(pdf|png|jpe?g|gif|bmp|step|stp|wrl|stl|3mf|xlsx?|docx?|kicad_pcb|kicad_sch|sch|brd|json)$/i;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function load(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* not kept */ } }
  function download(name, text) {
    var a = document.createElement("a"), url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }
  function status(t, kind) { var el = $("status"); el.textContent = t || ""; el.className = "lb-status" + (kind ? " " + kind : ""); }

  var S = load("ibom.settings", { mask: "green", sort: "bom" });
  var st = { key: null, name: "", board: null, files: [], pads: {}, lines: [], info: {}, cpl: {}, cplCount: 0, off: [0, 0], taught: {}, placed: {},
    sel: -1, focus: null, teach: false, tref: null, hist: [], bomName: "", order: [] };

  var view = new I.View($("board-wrap"), { onClick: boardClick, onHover: hover, onTeach: teachAt });

  // ================================================================ files in
  async function entriesOf(list) {
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var f = list[i], u8 = new Uint8Array(await f.arrayBuffer());
      if (/\.zip$/i.test(f.name) || (u8[0] === 0x50 && u8[1] === 0x4B)) {
        var ents = await G.unzip(u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.length));
        ents.forEach(function (e) { out.push({ name: e.name, data: e.data, zip: f.name }); });
      } else out.push({ name: f.name, data: u8 });
    }
    return out;
  }
  // sort the entries into Gerber files, BOM and pick-and-place
  function classify(entries) {
    var gerbers = [], boms = [], cpls = [], latin = new TextDecoder("latin1");
    entries.forEach(function (e) {
      if (SKIP.test(e.name) || e.data.length > 64e6) return;
      var text = latin.decode(e.data.subarray(0, Math.min(e.data.length, 200000)));
      var type = G.identify(e.name, text);
      if (type !== "ignore" || G.isGerber(text)) {
        if (type === "ignore") return;
        gerbers.push({ name: e.name, text: latin.decode(e.data), type: type, data: e.data });
        return;
      }
      var t = I.table(I.decode(e.data)), k = t && I.kind(t);
      if (k === "bom") boms.push({ name: e.name, t: t, data: e.data });
      else if (k === "cpl" || k === "cpl-eagle") cpls.push({ name: e.name, t: t, k: k });
    });
    return { gerbers: gerbers, boms: boms, cpls: cpls };
  }
  // pick-and-place data that comes with the app, found by the EasyEDA id in the Gerber header
  var bundled = null;
  // (a script, loaded when needed: it also works when the page is opened from disk)
  function bundledIndex() {
    if (!bundled) bundled = new Promise(function (resolve) {
      if (window.IBOM_DATA) { resolve(window.IBOM_DATA); return; }
      var s = document.createElement("script");
      s.src = "js/cpl-data.js";
      s.onload = function () { resolve(window.IBOM_DATA || null); };
      s.onerror = function () { bundled = null; resolve(null); };
      document.head.appendChild(s);
    });
    return bundled;
  }
  async function bundledCpl(gerbers) {
    var ids = [];
    gerbers.forEach(function (g) { var m = /G04 ([0-9a-f]{32}),[0-9a-f]{32}/.exec(g.text.slice(0, 3000)); if (m && ids.indexOf(m[1]) < 0) ids.push(m[1]); });
    if (!ids.length) return null;
    var idx = await bundledIndex(), e = null;
    ids.some(function (id) { e = idx && idx.byId[id]; return !!e; });
    if (!e) return null;
    var t = I.table(e.csv);
    return t ? { name: e.file.split("/").pop(), t: t, k: I.kind(t), bundled: true } : null;
  }
  async function open(entries, key, name, src) {
    var c = classify(entries);
    if (c.gerbers.length && !c.cpls.length) { var bc = await bundledCpl(c.gerbers); if (bc) c.cpls.push(bc); }
    if (!c.gerbers.length && !st.board) {
      status(c.boms.length || c.cpls.length ? "Open the Gerber files (ZIP) together with the BOM: the board picture comes from them." : "No Gerber files, BOM or pick-and-place file found.", "err");
      return;
    }
    if (c.gerbers.length) {
      st.key = key; st.name = name;
      st.files = c.gerbers; st.lines = []; st.cpl = {}; st.cplCount = 0; st.off = [0, 0]; st.sel = -1; st.focus = null; st.bomName = ""; st.bomData = null;
      st.src = src || {}; st.cplBundled = false;
      var saved = load("ibom:" + key, {});
      st.taught = saved.taught || {}; st.placed = {}; (saved.placed || []).forEach(function (r) { st.placed[r] = true; });
      status("Drawing the board …");
      await new Promise(function (r) { setTimeout(r, 20); });
      st.board = G.buildBoard(c.gerbers);
      if (!st.board.bbox.valid || !(st.board.bbox.x1 > st.board.bbox.x0)) { status("The Gerber files contain no board outline or copper.", "err"); st.board = null; return; }
      st.pads = {};
      ["top", "bottom"].forEach(function (side) {
        var layers = st.board.layers[side + "-mask"] || [];
        if (!layers.length) layers = c.gerbers.filter(function (f) { return f.type === side + "-paste"; }).map(function (f) { try { return G.parseGerber(f.text); } catch (e) { return null; } }).filter(Boolean);
        st.pads[side] = I.findPads(st.board, layers);
      });
      view.pads = st.pads;
      $("empty").hidden = true;
      view.fitted = false;
      view.setBoard(st.board, look());
    }
    if (c.boms.length) { st.lines = I.readBom(c.boms[0].t); st.bomName = c.boms[0].name; st.bomData = c.boms[0].data; }
    if (c.cpls.length) {
      var r = I.readCpl(c.cpls[0].t, c.cpls[0].k);
      st.cpl = r.parts; st.cplCount = r.count; st.cplName = c.cpls[0].name; st.cplBundled = !!c.cpls[0].bundled;
      align();
    }
    if (!st.lines.length && st.cplCount) linesFromCpl();
    st.info = {}; st.order = [];
    st.lines.forEach(function (l, i) { l.r = Math.hypot.apply(null, I.size(l.footprint)) / 2 + 0.35; l.refs.forEach(function (ref) { st.info[ref] = { line: i, value: l.value, footprint: l.footprint }; st.order.push(ref); }); });
    var off = load("ibom:" + st.key, {}).off;
    if (off && !c.cpls.length) st.off = off;
    var have = st.order.filter(function (r) { return pos(r); }).length, msg = [];
    msg.push(st.name + ": " + st.lines.length + " BOM lines, " + st.order.length + " parts");
    if (!st.lines.length) msg = [st.name + ": no BOM yet. Add the BOM file (drop it here)."];
    if (st.order.length) msg.push(have === st.order.length ? "all positions known" : have ? have + " positions known, " + (st.order.length - have) + " missing" : "no positions: add the pick-and-place file, or teach them");
    if (st.cplBundled && have) msg.push("positions from the pick-and-place data that comes with this app");
    status(msg.join(", ") + (st.alignMsg ? ". " + st.alignMsg : "") + ".", st.order.length && have < st.order.length ? "warn" : "");
    saveUi();
    render();
  }
  function linesFromCpl() {
    var groups = {};
    Object.keys(st.cpl).sort(I.natCmp).forEach(function (ref) {
      var p = st.cpl[ref], k = (p.value || "") + "|" + (p.footprint || "");
      (groups[k] = groups[k] || { value: p.value || "", footprint: p.footprint || "", refs: [], qty: 0, mpn: "", maker: "", lcsc: "" }).refs.push(ref);
    });
    st.lines = Object.keys(groups).map(function (k) { var g = groups[k]; g.qty = g.refs.length; return g; });
  }
  // pick-and-place files sometimes use another origin than the Gerber files: move them onto the board
  function align() {
    var b = st.board.bbox, refs = Object.keys(st.cpl), inside = function (dx, dy) {
      return refs.filter(function (r) { var p = st.cpl[r]; return p.x + dx >= b.x0 - 1 && p.x + dx <= b.x1 + 1 && p.y + dy >= b.y0 - 1 && p.y + dy <= b.y1 + 1; }).length;
    };
    st.alignMsg = "";
    if (!refs.length || inside(0, 0) >= refs.length * 0.8) return;
    var xs = refs.map(function (r) { return st.cpl[r].x; }), ys = refs.map(function (r) { return st.cpl[r].y; });
    var cx = (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2, cy = (Math.min.apply(null, ys) + Math.max.apply(null, ys)) / 2;
    var dx = (b.x0 + b.x1) / 2 - cx, dy = (b.y0 + b.y1) / 2 - cy;
    if (inside(dx, dy) > inside(0, 0)) {
      st.off = [dx, dy];
      st.alignMsg = "The pick-and-place positions did not fit the board and were moved by " + dx.toFixed(2) + " / " + dy.toFixed(2) + " mm";
    }
  }
  function look() { var m = G.MASK_COLORS[S.mask] ? S.mask : "green"; return { mask: m, silk: G.MASK_COLORS[m].silk, finish: "tin" }; }
  function pos(ref) {
    var t = st.taught[ref];
    if (t) return t;
    var c = st.cpl[ref];
    return c ? { x: c.x + st.off[0], y: c.y + st.off[1], side: c.side, rot: c.rot } : null;
  }
  function save() {
    if (!st.key) return;
    store("ibom:" + st.key, { placed: Object.keys(st.placed).filter(function (r) { return st.placed[r]; }), taught: st.taught, off: st.off });
  }

  // ---------------------------------------------------------------- local files
  $("btn-open").addEventListener("click", function () { $("file").click(); });
  $("file").addEventListener("change", function () { var l = Array.from(this.files); this.value = ""; if (l.length) openLocal(l); });
  async function openLocal(list) {
    try {
      var entries = await entriesOf(list);
      var gz = list.filter(function (f) { return /\.zip$/i.test(f.name); })[0] || list[0];
      var key = "file:" + list.map(function (f) { return f.name + ":" + f.size; }).sort().join("|");
      var name = gz.name.replace(/\.zip$/i, "").replace(/[_-]?gerber/i, "") || "Board";
      var hasGerber = classify(entries).gerbers.length;
      var zf = list.filter(function (f) { return /\.zip$/i.test(f.name); })[0];
      var src = zf ? { zipName: zf.name, zip: new Uint8Array(await zf.arrayBuffer()), from: list.map(function (f) { return f.name; }).join(", ") } : { from: list.map(function (f) { return f.name; }).join(", ") };
      await open(entries, hasGerber ? key : st.key, hasGerber ? name : st.name, hasGerber ? src : st.src);
      if (hasGerber) history.replaceState(null, "", location.pathname);
    } catch (e) { status("Cannot read the files: " + e.message, "err"); }
  }
  var depth = 0;
  window.addEventListener("dragenter", function (e) { if (isFiles(e)) { e.preventDefault(); depth++; document.body.classList.add("dragging"); } });
  window.addEventListener("dragover", function (e) { if (isFiles(e)) e.preventDefault(); });
  window.addEventListener("dragleave", function () { if (--depth <= 0) { depth = 0; document.body.classList.remove("dragging"); } });
  window.addEventListener("drop", function (e) {
    if (!isFiles(e)) return;
    e.preventDefault(); depth = 0; document.body.classList.remove("dragging");
    if (e.dataTransfer.files.length) openLocal(Array.from(e.dataTransfer.files));
  });
  function isFiles(e) { return e.dataTransfer && Array.from(e.dataTransfer.types).indexOf("Files") >= 0; }

  // ---------------------------------------------------------------- GitHub
  var gh = { repo: null, branch: null, boards: [] };
  function repoName(s) {
    var m = /github\.com\/([\w.-]+\/[\w.-]+)/i.exec(s) || /^\s*([\w.-]+\/[\w.-]+)\s*$/.exec(s);
    return m ? m[1].replace(/\.git$/, "") : null;
  }
  $("gh-form").addEventListener("submit", function (e) { e.preventDefault(); openRepo($("gh").value); });
  $("gh-board").addEventListener("change", function () { loadBoard(gh.boards[+this.value]); });
  async function openRepo(text, wanted) {
    var repo = repoName(text);
    if (!repo) { status("Enter a repository as owner/name, e.g. wagiminator/CH552-USB-OLED.", "err"); return; }
    $("gh").value = repo;
    status("Looking into " + repo + " …");
    try {
      var r;
      try { r = await I.repoBoards(repo); }
      catch (e) { r = await indexBoards(repo); if (!r) throw e; }
      gh = { repo: repo, branch: r.branch, boards: r.boards };
      if (!r.boards.length) { status("No Gerber ZIP found in " + repo + ".", "err"); $("gh-board-f").hidden = true; return; }
      $("gh-board").innerHTML = r.boards.map(function (b, i) { return '<option value="' + i + '">' + esc(b.name) + "</option>"; }).join("");
      $("gh-board-f").hidden = r.boards.length < 2;
      var i = Math.max(0, r.boards.findIndex(function (b) { return b.gerber === wanted; }));
      $("gh-board").value = String(i);
      await loadBoard(r.boards[i]);
    } catch (e) { status(e.message, "err"); }
  }
  // the boards of wagiminator's repositories as listed with the app (when GitHub does not answer)
  async function indexBoards(repo) {
    var idx = await bundledIndex(), m = /^wagiminator\/(.+)$/i.exec(repo);
    if (!idx || !m) return null;
    var key = Object.keys(idx.repos).filter(function (k) { return k.toLowerCase() === m[1].toLowerCase(); })[0];
    if (!key) return null;
    var e = idx.repos[key];
    return { branch: e.branch, boards: e.boards.map(function (b) {
      var dir = b.gerber.slice(0, b.gerber.lastIndexOf("/") + 1);
      return { name: b.gerber.split("/").pop().replace(/[_-]?gerber/i, "").replace(/\.zip$/i, "").replace(/_/g, " "), dir: dir, gerber: b.gerber, bom: b.bom || null, cpl: null };
    }) };
  }
  async function loadBoard(b) {
    status("Loading " + b.name + " from GitHub …");
    try {
      var get = async function (p) { var res = await fetch(I.raw(gh.repo, gh.branch, p)); if (!res.ok) throw new Error(p + ": " + res.status); return new Uint8Array(await res.arrayBuffer()); };
      var z = await get(b.gerber), entries = (await G.unzip(z.buffer.slice(0))).map(function (e) { return { name: e.name, data: e.data }; });
      if (b.bom) entries.push({ name: b.bom.split("/").pop(), data: await get(b.bom) });
      if (b.cpl) entries.push({ name: b.cpl.split("/").pop(), data: await get(b.cpl) });
      await open(entries, "gh:" + gh.repo + ":" + b.gerber, gh.repo.split("/")[1] + (gh.boards.length > 1 ? " · " + b.name : ""),
        { zipName: b.gerber.split("/").pop(), zip: z, from: "github.com/" + gh.repo + "/" + b.dir });
      var u = new URL(location.href);
      u.searchParams.set("repo", gh.repo);
      if (gh.boards.length > 1) u.searchParams.set("board", b.gerber); else u.searchParams.delete("board");
      history.replaceState(null, "", u.pathname + u.search.replace(/%2F/gi, "/"));
      st.ghDir = b.dir;
    } catch (e) { status("Cannot load the board: " + e.message, "err"); }
  }
  // suggestions: the projects on the start page
  fetch("../../index.html").then(function (r) { return r.ok ? r.text() : ""; }).then(function (t) {
    var seen = {}, html = "", re = /github\.com\/(wagiminator\/[\w.-]+)/g, m;
    while ((m = re.exec(t))) if (!seen[m[1]]) { seen[m[1]] = 1; html += '<option value="' + esc(m[1]) + '"></option>'; }
    $("gh-list").innerHTML = html;
  }).catch(function () { /* no suggestions */ });
  $("try").innerHTML = "<span>Try:</span>" + TRY.map(function (r) { return '<button type="button" data-repo="' + r + '">' + esc(r.split("/")[1]) + "</button>"; }).join("");
  $("try").addEventListener("click", function (e) { var b = e.target.closest("[data-repo]"); if (b) openRepo(b.getAttribute("data-repo")); });

  // ================================================================ parts list
  function visibleLines() {
    var q = $("filter").value.trim().toLowerCase(), hide = $("hide-placed").checked;
    var idx = st.lines.map(function (l, i) { return i; }).filter(function (i) {
      var l = st.lines[i];
      if (hide && done(i)) return false;
      if (!q) return true;
      return (l.value + " " + l.footprint + " " + l.refs.join(" ") + " " + l.mpn + " " + l.lcsc).toLowerCase().indexOf(q) >= 0;
    });
    var s = S.sort;
    if (s === "small") idx.sort(function (a, b) { return st.lines[a].r - st.lines[b].r || a - b; });
    else if (s === "count") idx.sort(function (a, b) { return st.lines[b].refs.length - st.lines[a].refs.length || a - b; });
    else if (s === "ref") idx.sort(function (a, b) { return I.natCmp(st.lines[a].refs[0], st.lines[b].refs[0]); });
    return idx;
  }
  function done(i) { return st.lines[i].refs.every(function (r) { return st.placed[r]; }); }
  function render() {
    var html = "";
    visibleLines().forEach(function (i) {
      var l = st.lines[i], d = done(i), refs = l.refs.map(function (r) {
        var p = pos(r), cls = "ref" + (!p ? " nopos" : "") + (st.focus === r || st.tref === r ? " focus" : "") + (p && p.side === "bottom" ? " other" : "");
        return '<button type="button" class="' + cls + '" data-ref="' + esc(r) + '" title="' + (p ? (p.side === "bottom" ? "Bottom side" : "Top side") : "Position unknown") + (st.placed[r] ? ", placed" : "") + '">' + esc(r) + "</button>";
      }).join("");
      var link = l.lcsc ? ' <a href="https://www.lcsc.com/product-detail/' + esc(l.lcsc) + '.html" target="_blank" rel="noopener">' + esc(l.lcsc) + "</a>" : "";
      html += '<div class="line' + (st.sel === i ? " sel" : "") + (d ? " done" : "") + '" role="row" data-i="' + i + '">' +
        '<input type="checkbox" aria-label="Placed"' + (d ? " checked" : "") + ">" +
        '<span class="qty">' + l.refs.length + "×</span>" +
        '<span class="val">' + esc(l.value || "–") + (l.mpn && l.mpn !== l.value ? "<small>" + esc(l.mpn) + "</small>" : "") + "</span>" +
        '<span class="refs">' + refs + "</span>" +
        '<span class="fp">' + esc(l.footprint) + link + "</span></div>";
    });
    $("bom").innerHTML = html;
    var total = st.order.length, placed = st.order.filter(function (r) { return st.placed[r]; }).length, ld = st.lines.filter(function (l, i) { return done(i); }).length;
    $("progress").hidden = !total;
    $("bar").style.width = (total ? 100 * placed / total : 0) + "%";
    $("prog-text").textContent = placed + " of " + total + " parts, " + ld + " of " + st.lines.length + " lines";
    var miss = st.order.filter(function (r) { return !pos(r); }).length;
    $("bom-foot").textContent = !st.lines.length ? "" : miss ? miss + " part" + (miss > 1 ? "s have" : " has") + " no position (dashed). Teach them on the board or add the pick-and-place file." : "";
    parts();
    teachUi();
    saveUi();
  }
  // what the board view shows
  function parts() {
    view.parts = st.order.map(function (r) {
      var p = pos(r);
      return p ? { ref: r, x: p.x, y: p.y, side: p.side || "top", r: st.lines[st.info[r].line].r, placed: !!st.placed[r] } : null;
    }).filter(Boolean);
    var sel = {};
    if (st.teach) { if (st.tref) sel[st.tref] = true; }
    else if (st.sel >= 0) st.lines[st.sel].refs.forEach(function (r) { sel[r] = true; });
    else if (st.focus) sel[st.focus] = true;
    view.sel = sel; view.focus = st.teach ? st.tref : st.focus;
    view.draw();
  }
  function select(i, focus, scroll) {
    st.sel = i; st.focus = focus || null;
    render();
    var lit = view.parts.filter(function (p) { return view.sel[p.ref]; });
    if (lit.length && !lit.some(function (p) { return p.side === view.side; })) setSide(lit[0].side);
    view.show(view.parts.filter(function (p) { return view.sel[p.ref] && p.side === view.side; }));
    if (scroll) { var row = $("bom").querySelector('.line[data-i="' + i + '"]'); if (row) row.scrollIntoView({ block: "nearest" }); }
  }
  $("bom").addEventListener("click", function (e) {
    var row = e.target.closest(".line"); if (!row) return;
    var i = +row.getAttribute("data-i"), ref = e.target.closest("[data-ref]");
    if (e.target.type === "checkbox") {
      var on = e.target.checked;
      st.lines[i].refs.forEach(function (r) { st.placed[r] = on; });
      save(); render(); return;
    }
    if (ref) {
      var r = ref.getAttribute("data-ref");
      if (st.teach) { st.tref = r; render(); return; }
      select(i, r);
      return;
    }
    if (st.teach) { st.tref = st.lines[i].refs.filter(function (x) { return !pos(x); })[0] || st.lines[i].refs[0]; render(); return; }
    select(st.sel === i && !st.focus ? -1 : i, null);
  });
  $("filter").addEventListener("input", render);
  $("hide-placed").addEventListener("change", render);
  $("sort").value = S.sort; $("sort").addEventListener("change", function () { S.sort = this.value; store("ibom.settings", S); render(); });
  function next() {
    var v = visibleLines(), cur = v.indexOf(st.sel);
    for (var k = 1; k <= v.length; k++) { var i = v[(cur + k + v.length) % v.length]; if (!done(i)) { select(i, null, true); return; } }
    select(-1);
  }
  $("btn-next").addEventListener("click", next);

  // ================================================================ board
  function boardClick(p) {
    if (!p) { if (st.sel >= 0 || st.focus) select(-1); return; }
    var i = st.info[p.ref].line;
    if ($("hide-placed").checked && done(i)) $("hide-placed").checked = false;
    if ($("filter").value) $("filter").value = "";
    select(i, p.ref, true);
  }
  function hover(p) {
    var el = $("hover");
    if (!p) { el.innerHTML = st.board ? "Click a part on the board to find it in the list." : ""; return; }
    var inf = st.info[p.ref];
    el.innerHTML = "<b>" + esc(p.ref) + "</b> " + esc(inf.value) + " · " + esc(inf.footprint) + (st.placed[p.ref] ? " · placed" : "");
  }
  function setSide(s) {
    view.side = s; view.fitted = false; view.fit();
    $("side-top").setAttribute("aria-pressed", String(s === "top"));
    $("side-bottom").setAttribute("aria-pressed", String(s === "bottom"));
  }
  $("side-top").addEventListener("click", function () { setSide("top"); });
  $("side-bottom").addEventListener("click", function () { setSide("bottom"); });
  $("labels").addEventListener("change", function () { view.labels = this.checked; view.draw(); });
  $("placed-marks").addEventListener("change", function () { view.showPlaced = this.checked; view.draw(); });
  Object.keys(G.MASK_COLORS).forEach(function (k) { $("mask").insertAdjacentHTML("beforeend", '<option value="' + k + '">' + G.MASK_COLORS[k].name + "</option>"); });
  $("mask").value = S.mask;
  $("mask").addEventListener("change", function () { S.mask = this.value; store("ibom.settings", S); if (st.board) view.setLook(look()); });
  $("z-in").addEventListener("click", function () { view.zoomAt(1.5); });
  $("z-out").addEventListener("click", function () { view.zoomAt(1 / 1.5); });
  $("z-fit").addEventListener("click", function () { view.fit(); });

  // ================================================================ teaching positions
  function missing(after) {
    var o = st.order, start = after ? o.indexOf(after) + 1 : 0;
    for (var k = 0; k < o.length; k++) { var r = o[(start + k) % o.length]; if (!pos(r) && r !== after) return r; }
    return null;
  }
  function teachUi() {
    $("teach").hidden = !st.teach;
    $("btn-teach").setAttribute("aria-pressed", String(st.teach));
    $("board-wrap").classList.toggle("teaching", st.teach);
    view.teach = st.teach;
    if (!st.teach) return;
    var r = st.tref, inf = r && st.info[r], have = st.order.filter(function (x) { return pos(x); }).length;
    view.teachR = inf ? st.lines[inf.line].r : 1.5;
    $("teach-q").innerHTML = r ? "Click <code>" + esc(r) + "</code> " + esc(inf.value) + (inf.footprint ? ", " + esc(inf.footprint) : "") + " on the " + view.side + " side. " +
      '<span style="font-weight:400">(' + have + " of " + st.order.length + " positions)</span>"
      : "All " + st.order.length + " parts have a position. Save the CPL file to keep them.";
    $("t-skip").disabled = !r; $("t-undo").disabled = !st.hist.length; $("t-del").disabled = !(r && st.taught[r]);
    $("t-save").disabled = !have;
  }
  $("btn-teach").addEventListener("click", function () {
    if (!st.board || !st.order.length) { status(st.board ? "Open the BOM first: it says which parts to teach." : "Open a board first.", "warn"); return; }
    st.teach = !st.teach;
    if (st.teach) { st.tref = missing(null) || st.order[0]; st.sel = -1; st.focus = null; }
    render();
  });
  function teachAt(x, y, side) {
    var r = st.tref;
    if (!r) return;
    st.hist.push({ ref: r, prev: st.taught[r] || null });
    st.taught[r] = { x: +x.toFixed(4), y: +y.toFixed(4), side: side, rot: 0 };
    save();
    st.tref = missing(r) || r;
    render();
  }
  $("t-skip").addEventListener("click", function () { st.tref = missing(st.tref) || st.tref; render(); });
  $("t-undo").addEventListener("click", function () {
    var h = st.hist.pop(); if (!h) return;
    if (h.prev) st.taught[h.ref] = h.prev; else delete st.taught[h.ref];
    st.tref = h.ref; save(); render();
  });
  $("t-del").addEventListener("click", function () { if (st.tref) { delete st.taught[st.tref]; save(); render(); } });
  $("t-done").addEventListener("click", function () { st.teach = false; render(); });
  $("t-save").addEventListener("click", function () {
    var list = cplList(), name = cplName();
    download(name, I.writeCpl(list));
    status("Saved " + name + " with " + list.length + " positions" + (st.ghDir ? ". Put it into " + st.ghDir + " of the repository; the app finds it there next time." : ". Open it together with the Gerber ZIP and the BOM next time."));
  });

  // ================================================================ export
  function saveUi() { ["dl-gerber", "dl-bom", "dl-cpl", "dl-sheet"].forEach(function (id) { $(id).disabled = !st.board; }); $("dl-bom").disabled = !st.board || !st.lines.length; $("dl-cpl").disabled = !st.board || !st.order.some(pos); }
  function saveBlob(name, blob) {
    var a = document.createElement("a"), url = URL.createObjectURL(blob);
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }
  function baseName() { return (st.src && st.src.zipName ? st.src.zipName.replace(/\.zip$/i, "").replace(/[_-]?gerber.*$/i, "") : "") || (st.name || "board").replace(/[^\w.-]+/g, "_"); }
  $("dl-gerber").addEventListener("click", function () {
    if (st.src && st.src.zip) { saveBlob(st.src.zipName, new Blob([st.src.zip], { type: "application/zip" })); return; }
    saveBlob(baseName() + "_gerber.zip", I.zip(st.files.map(function (f) { return { name: f.name.split("/").pop(), data: f.data }; })));
  });
  $("dl-bom").addEventListener("click", function () {
    if (st.bomData) { saveBlob(st.bomName.split("/").pop(), new Blob([st.bomData])); return; }
    var rows = [["Comment", "Designator", "Footprint", "Quantity", "LCSC"]].concat(st.lines.map(function (l) { return [l.value, l.refs.join(","), l.footprint, l.refs.length, l.lcsc]; }));
    saveBlob(baseName() + "_BOM.csv", new Blob([rows.map(function (r) { return r.map(function (v) { v = String(v == null ? "" : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(","); }).join("\r\n") + "\r\n"], { type: "text/csv" }));
  });
  function cplList() { return st.order.map(function (r) { var p = pos(r); return p ? { ref: r, x: p.x, y: p.y, side: p.side, rot: p.rot || 0 } : null; }).filter(Boolean); }
  function cplName() {
    var base = st.bomName ? st.bomName.split("/").pop().replace(/\.[^.]+$/, "").replace(/bom/i, "CPL") : baseName() + "_CPL";
    if (st.bomName && base === st.bomName.split("/").pop().replace(/\.[^.]+$/, "")) base += "_CPL";
    return base + ".csv";
  }
  $("dl-cpl").addEventListener("click", function () { var l = cplList(); saveBlob(cplName(), new Blob([I.writeCpl(l)], { type: "text/csv" })); status("Saved " + cplName() + " with " + l.length + " positions."); });
  function sheetLines() {
    var idx = st.lines.map(function (l, i) { return i; }), s = S.sort;
    if (s === "small") idx.sort(function (a, b) { return st.lines[a].r - st.lines[b].r || a - b; });
    else if (s === "count") idx.sort(function (a, b) { return st.lines[b].refs.length - st.lines[a].refs.length || a - b; });
    else if (s === "ref") idx.sort(function (a, b) { return I.natCmp(st.lines[a].refs[0], st.lines[b].refs[0]); });
    return idx;
  }
  $("dl-sheet").addEventListener("click", function () {
    var btn = this; btn.disabled = true; status("Making the A4 sheet …");
    setTimeout(function () {
      try {
        var order = sheetLines(), lines = order.map(function (i) { return st.lines[i]; }), b = st.board.bbox;
        var miss = st.order.filter(function (r) { return !pos(r); }).length;
        var blob = I.sheet({
          title: st.name || "Board", board: st.board, lines: lines, pos: pos,
          radius: function (i) { return lines[i].r; },
          info: st.order.length + " parts in " + st.lines.length + " lines · board " + (b.x1 - b.x0).toFixed(1) + " × " + (b.y1 - b.y0).toFixed(1) + " mm" + (miss ? " · " + miss + " without position" : ""),
          source: (st.src && st.src.from) || "", date: new Date().toISOString().slice(0, 10)
        });
        saveBlob(baseName() + "_soldering_sheet.pdf", blob);
        status("Saved " + baseName() + "_soldering_sheet.pdf.");
      } catch (e) { status("Cannot make the sheet: " + e.message, "err"); }
      btn.disabled = false;
    }, 30);
  });

  // ================================================================ keys
  document.addEventListener("keydown", function (e) {
    if (e.target.closest("input, select, textarea") && e.target.type !== "checkbox") return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var v = visibleLines(), k = e.key;
    if (k === "ArrowDown" || k === "ArrowUp") {
      if (!v.length) return;
      var cur = v.indexOf(st.sel), n = k === "ArrowDown" ? (cur < 0 ? 0 : Math.min(v.length - 1, cur + 1)) : (cur < 0 ? v.length - 1 : Math.max(0, cur - 1));
      select(v[n], null, true);
    } else if (k === " " && st.sel >= 0) {
      var on = !done(st.sel);
      st.lines[st.sel].refs.forEach(function (r) { st.placed[r] = on; });
      save(); render();
    } else if (k === "n" || k === "N") next();
    else if (k === "t" || k === "T") setSide("top");
    else if (k === "b" || k === "B") setSide("bottom");
    else if (k === "+" || k === "=") view.zoomAt(1.5);
    else if (k === "-") view.zoomAt(1 / 1.5);
    else if (k === "f" || k === "F") view.fit();
    else if (k === "Escape") { if (st.teach) { st.teach = false; render(); } else select(-1); }
    else return;
    e.preventDefault();
  });

  // ================================================================ start
  I.app = { st: st, view: view };        // for the browser console
  render(); hover(null); saveUi();
  var q = new URLSearchParams(location.search);
  if (q.get("repo")) openRepo(q.get("repo"), q.get("board"));
})();
