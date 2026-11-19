/* Signal Analyzer: the user interface */
(function () {
  "use strict";

  var SA = window.SA;
  var $ = function (id) { return document.getElementById(id); };
  var KEY = "sa.settings";
  var HUES = [205, 28, 145, 285, 345, 95, 245, 175];
  var SAMPLES = [1e3, 2e3, 5e3, 1e4, 2e4, 5e4, 1e5, 2e5, 5e5, 1e6, 2e6, 5e6, 1e7, 2e7, 5e7, 1e8];
  var SOUND_RATES = [44100, 48000, 96000, 192000];
  var NOTES = {
    pico: "Raspberry Pi Pico with the sigrok-pico firmware, over USB serial.",
    fx2: "The small “24 MHz 8 channel” analyzers and FX2 boards. The firmware is loaded automatically.",
    sound: "Two analog channels from the microphone or line input."
  };

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* not kept */ } }
  function download(name, blob) {
    var a = document.createElement("a"), url = URL.createObjectURL(blob);
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  var S = load();
  S.rate = S.rate || {}; S.samples = S.samples || {}; S.names = S.names || {}; S.opts = S.opts || {};
  S.src = S.src || "pico";
  var st = {
    cap: null, ctx: null, decs: [], uid: 1,
    src: { pico: new SA.sources.pico(), fx2: new SA.sources.fx2(), sound: new SA.sources.sound() },
    on: { pico: false, fx2: false, sound: false },
    info: {}, running: false, stop: false
  };

  // ---------------------------------------------------------------- the view
  var view = new SA.View($("wave"), {
    onHover: hover, onCursor: cursors, onLabel: openPop,
    onAnn: function () { /* the readout shows it */ }
  });
  // background of the chart: black or white
  function bgUi() {
    var light = S.bg === "light";
    $("bg-dark").setAttribute("aria-pressed", String(!light)); $("bg-light").setAttribute("aria-pressed", String(light));
    $("wave").classList.toggle("light", light);
    view.theme = light ? "light" : "dark";
    view.overCache = null; view.redraw();
  }
  $("bg-dark").addEventListener("click", function () { S.bg = "dark"; save(); bgUi(); });
  $("bg-light").addEventListener("click", function () { S.bg = "light"; save(); bgUi(); });
  bgUi();
  function rows() {
    var r = [];
    if (!st.cap) return r;
    st.cap.channels.forEach(function (ch) {
      if (ch.visible) r.push({ kind: ch.kind, ch: ch, name: ch.name, color: ch.color, h: ch.kind === "a" ? 100 : 30 });
    });
    st.decs.forEach(function (d) {
      if (!d.result) return;
      var def = SA.decoderById(d.type), shown = [];
      d.result.rows.forEach(function (l, i) { if (l.length && !(d.hide || []).includes(i)) shown.push(i); });
      if (!shown.length && !(d.hide || []).includes(0)) shown.push(0);
      shown.forEach(function (i) {
        r.push({ kind: "dec", dec: d, ri: i, list: d.result.rows[i], name: def.short + " " + def.rows[i],
          hue: d.hue, color: "hsl(" + d.hue + ",60%,58%)", h: 24 });
      });
    });
    var hidden = st.cap.channels.filter(function (c) { return !c.visible; }).length;
    $("btn-hidden").hidden = !hidden;
    $("btn-hidden").textContent = "Show " + hidden + " hidden";
    return r;
  }
  function refreshRows() { view.setRows(rows()); }

  // ---------------------------------------------------------------- captures
  // ctx: "hw" (from the hardware), "demo" or "file"
  function chanSig(c) { return c ? c.channels.map(function (x) { return x.kind + x.id + x.name; }).join("|") : ""; }
  function setCapture(cap, ctx, decs) {
    var keep = !!(st.cap && ctx === "hw" && st.ctx === "hw"), oldSig = chanSig(st.cap), oldCtx = st.ctx;
    st.cap = cap; st.ctx = ctx;
    if (ctx === "hw") {
      var names = S.names[S.src] || {};
      cap.channels.forEach(function (c) { var n = names[c.id]; if (n) { if (n.name) c.name = n.name; if (n.color) c.color = n.color; if (n.hidden) c.visible = false; } });
      // digital channels made from analog ones come back with the same threshold
      (S.thr && S.thr[S.src] || []).forEach(function (t) { if (cap.channel(t.from)) { var ch = cap.addThreshold(t.from, t.level, t.hyst); if (names[ch.id] && names[ch.id].name) ch.name = names[ch.id].name; } });
      S.hw = true; save();
      if (oldCtx !== "hw") setDecoders(S.decoders || []);
      else if (chanSig(cap) !== oldSig) renderDecoders();
    } else if (decs) setDecoders(decs);
    else if (oldCtx === "demo") setDecoders([]);      // the demo's decoders belong to the demo
    else renderDecoders();
    view.hover = null; view.hoverRow = null;
    view.setCapture(cap, keep);
    decodeAll();
    info();
    cursors(); hover(null);
  }
  function info(warn) {
    var c = st.cap, el = $("cap-info");
    el.classList.toggle("warn", !!warn);
    if (warn) { el.textContent = warn; return; }
    if (!c) { el.textContent = ""; return; }
    el.textContent = c.source + ": " + c.n.toLocaleString("en") + " samples at " + SA.fmtRate(c.rate) + ", " + SA.fmtTime(c.duration()) +
      (c.trigger != null ? ", trigger at " + SA.fmtTime(c.trigger / c.rate) : "") + ".";
  }

  // ---------------------------------------------------------------- decoders
  function setDecoders(list) {
    st.decs = list.map(function (d, i) {
      var def = SA.decoderById(d.type);
      return def ? { uid: st.uid++, type: d.type, ch: Object.assign({}, d.ch), opts: Object.assign(SA.decoderDefaults(def), d.opts || {}), hue: HUES[i % HUES.length], hide: [] } : null;
    }).filter(Boolean);
    renderDecoders();
  }
  function saveDecoders() {
    if (st.ctx !== "hw") return;
    S.decoders = st.decs.map(function (d) { return { type: d.type, ch: d.ch, opts: d.opts }; });
    save();
  }
  function decode(d) {
    var def = SA.decoderById(d.type), cap = st.cap;
    if (!cap) { d.result = null; return; }
    var sig = cap.signal(), ch = {}, missing = [];
    def.ch.forEach(function (c) {
      var id = d.ch[c.id];
      if (id && sig.has(id)) ch[c.id] = id;
      else if (!c.opt) missing.push(c.name);
    });
    if (missing.length) { d.result = { rows: def.rows.map(function () { return []; }), list: [], log: ["Choose the channel for " + missing.join(" and ") + "."] }; return; }
    try { d.result = def.run(sig, ch, d.opts); }
    catch (e) { d.result = { rows: def.rows.map(function () { return []; }), list: [], log: ["Error: " + e.message] }; }
  }
  function decodeAll() {
    st.decs.forEach(decode);
    refreshRows();
    renderDecLogs();
    results();
  }
  function digitalOptions(sel) {
    var html = '<option value="">–</option>';
    if (st.cap) st.cap.channels.forEach(function (c) { if (c.kind === "d") html += '<option value="' + esc(c.id) + '"' + (c.id === sel ? " selected" : "") + ">" + esc(c.name) + "</option>"; });
    else if (sel) html += '<option value="' + esc(sel) + '" selected>' + esc(sel) + "</option>";
    return html;
  }
  function renderDecoders() {
    var box = $("dec-list");
    box.innerHTML = st.decs.map(function (d) {
      var def = SA.decoderById(d.type), h = "";
      def.ch.forEach(function (c) {
        h += '<label class="field"><span>' + esc(c.name) + (c.opt ? " (optional)" : "") + '</span><select data-ch="' + c.id + '">' + digitalOptions(d.ch[c.id]) + "</select></label>";
      });
      def.opts.forEach(function (o) {
        var v = d.opts[o.id];
        if (o.type === "check") h += '<label class="field chk"><input type="checkbox" data-opt="' + o.id + '"' + (v ? " checked" : "") + "> " + esc(o.name) + "</label>";
        else if (o.type === "combo") {
          h += '<label class="field"><span>' + esc(o.name) + '</span><input type="text" list="dl-' + d.uid + o.id + '" data-opt="' + o.id + '" value="' + esc(v) + '" spellcheck="false">' +
            '<datalist id="dl-' + d.uid + o.id + '">' + o.list.map(function (x) { return '<option value="' + esc(x) + '"></option>'; }).join("") + "</datalist></label>";
        } else h += '<label class="field"><span>' + esc(o.name) + '</span><select data-opt="' + o.id + '">' +
          o.list.map(function (x) { return '<option value="' + esc(x[0]) + '"' + (String(x[0]) === String(v) ? " selected" : "") + ">" + esc(x[1]) + "</option>"; }).join("") + "</select></label>";
      });
      return '<div class="dec" data-uid="' + d.uid + '" style="--hue: hsl(' + d.hue + ',55%,48%)">' +
        '<div class="dec-t"><b title="' + esc(def.info) + '">' + esc(def.name) + '</b><button type="button" class="x" aria-label="Remove ' + esc(def.name) + '" title="Remove">×</button></div>' +
        '<div class="dec-g">' + h + '</div><p class="dec-log"></p></div>';
    }).join("");
    renderDecLogs();
  }
  function renderDecLogs() {
    st.decs.forEach(function (d) {
      var el = $("dec-list").querySelector('.dec[data-uid="' + d.uid + '"] .dec-log');
      if (!el) return;
      var r = d.result, n = r ? r.list.length : 0, log = r ? r.log : [];
      el.classList.toggle("ok", !log.length || /detected/.test(log.join(" ")) && log.length === 1);
      el.textContent = !st.cap ? "" : log.length ? log.join(" ") : n + (n === 1 ? " item" : " items") + " found.";
    });
  }
  $("dec-list").addEventListener("change", function (e) {
    var card = e.target.closest(".dec"); if (!card) return;
    var d = st.decs.filter(function (x) { return x.uid === +card.getAttribute("data-uid"); })[0]; if (!d) return;
    var t = e.target;
    if (t.hasAttribute("data-ch")) d.ch[t.getAttribute("data-ch")] = t.value;
    else if (t.hasAttribute("data-opt")) d.opts[t.getAttribute("data-opt")] = t.type === "checkbox" ? t.checked : t.value;
    decode(d); refreshRows(); renderDecLogs(); results(); saveDecoders();
  });
  $("dec-list").addEventListener("click", function (e) {
    var x = e.target.closest(".x"); if (!x) return;
    var uid = +x.closest(".dec").getAttribute("data-uid");
    st.decs = st.decs.filter(function (d) { return d.uid !== uid; });
    renderDecoders(); refreshRows(); results(); saveDecoders();
  });
  SA.decoders.forEach(function (d) { $("dec-add").insertAdjacentHTML("beforeend", '<option value="' + d.id + '">' + esc(d.name) + "</option>"); });
  $("dec-add").addEventListener("change", function () {
    var def = SA.decoderById(this.value); this.value = "";
    if (!def) return;
    // guess channels by name, otherwise the first digital channels in order
    var dig = st.cap ? st.cap.channels.filter(function (c) { return c.kind === "d"; }) : [], used = {}, ch = {};
    def.ch.forEach(function (c) {
      var m = dig.filter(function (x) { return !used[x.id] && x.name.toUpperCase().replace(/[^A-Z]/g, "").indexOf(c.name.toUpperCase().replace(/[^A-Z]/g, "")) >= 0; })[0];
      if (m) { ch[c.id] = m.id; used[m.id] = 1; }
    });
    def.ch.forEach(function (c) { if (!ch[c.id] && !c.opt) { var f = dig.filter(function (x) { return !used[x.id]; })[0]; if (f) { ch[c.id] = f.id; used[f.id] = 1; } } });
    var used2 = st.decs.map(function (d) { return d.hue; }), hue = HUES.filter(function (h) { return used2.indexOf(h) < 0; })[0] || HUES[st.decs.length % HUES.length];
    var d = { uid: st.uid++, type: def.id, ch: ch, opts: SA.decoderDefaults(def), hue: hue, hide: [] };
    st.decs.push(d);
    decode(d); renderDecoders(); refreshRows(); results(); saveDecoders();
  });

  // ---------------------------------------------------------------- decoded data table
  function results() {
    var all = [];
    st.decs.forEach(function (d) {
      var def = SA.decoderById(d.type);
      if (d.result) d.result.list.forEach(function (a) { all.push({ a: a, n: def.name.replace(/ \(.*\)$/, ""), hue: d.hue }); });
    });
    all.sort(function (x, y) { return x.a.s - y.a.s; });
    st.list = all;
    renderResults();
  }
  function renderResults() {
    var q = $("res-filter").value.trim().toLowerCase(), all = st.list || [], cap = st.cap;
    var list = q ? all.filter(function (x) { return (x.a.t + " " + x.n).toLowerCase().indexOf(q) >= 0; }) : all, MAX = 2000, html = "";
    for (var i = 0; i < list.length && i < MAX; i++) {
      var x = list[i];
      html += '<div class="rr' + (x.a.k === 2 ? " err" : "") + '" role="row" data-i="' + all.indexOf(x) + '"><span class="t" role="cell">' + esc(SA.fmtTime(view.timeOf(x.a.s), 3)) +
        '</span><span class="d" role="cell" style="color:hsl(' + x.hue + ',50%,38%)">' + esc(x.n) + '</span><span class="v" role="cell">' +
        (x.a.col ? '<span class="sw" style="background:' + x.a.col + '"></span>' : "") + esc(x.a.t) + "</span></div>";
    }
    if (list.length > MAX) html += '<div class="res-more">… and ' + (list.length - MAX).toLocaleString("en") + " more. Use the filter or export the decoded data.</div>";
    $("res-table").innerHTML = html;
    $("res-count").textContent = all.length ? (q ? list.length + " of " : "") + all.length.toLocaleString("en") + " items" : "";
    void cap;
  }
  $("res-filter").addEventListener("input", renderResults);
  $("res-table").addEventListener("click", function (e) {
    var r = e.target.closest(".rr"); if (!r) return;
    var x = st.list[+r.getAttribute("data-i")]; if (!x) return;
    var w = x.a.e - x.a.s;
    view.showRange(x.a.s - w * 2, x.a.e + w * 2, 0.05);
    view.setCursor(0, x.a.s);
  });

  // ---------------------------------------------------------------- readout
  function cursors() {
    var c = view.cur, el = $("ro-cur");
    $("z-cur").disabled = !(c[0] != null && c[1] != null);
    if (!st.cap || (c[0] == null && c[1] == null)) { el.textContent = "Click to place cursor A, Shift+click for B. Wheel or pinch zooms, drag moves."; return; }
    var h = "";
    if (c[0] != null) h += '<b class="ca">A</b> ' + esc(SA.fmtTime(view.timeOf(c[0]))) + "  ";
    if (c[1] != null) h += '<b class="cb">B</b> ' + esc(SA.fmtTime(view.timeOf(c[1]))) + "  ";
    if (c[0] != null && c[1] != null) {
      var dt = Math.abs(c[1] - c[0]) / st.cap.rate;
      h += "<b>Δ</b> " + esc(SA.fmtTime(dt)) + (dt > 0 ? " = " + esc(SA.fmtFreq(1 / dt)) : "") + " (" + Math.abs(c[1] - c[0]).toLocaleString("en") + " samples)";
    }
    el.innerHTML = h;
  }
  function hover(s, row) {
    var el = $("ro-hover");
    if (s == null || !row || !st.cap || s < 0 || s >= st.cap.n) { el.textContent = ""; return; }
    var t = SA.fmtTime(view.timeOf(s)), rate = st.cap.rate, h = "<b>" + esc(row.name) + "</b> at " + esc(t) + ": ";
    if (row.kind === "d") {
      var m = view.measure(row.ch, s);
      h += m.level ? "high" : "low";
      if (m.width) h += ", pulse " + esc(SA.fmtTime(m.width / rate));
      if (m.period) h += ", period " + esc(SA.fmtTime(m.period / rate)) + " = " + esc(SA.fmtFreq(rate / m.period)) + ", duty " + Math.round(100 * m.high / m.period) + " %";
    } else if (row.kind === "a") {
      var v = row.ch.store.data[Math.floor(s)];
      h += (+v.toFixed(4)) + (row.ch.unit ? " " + row.ch.unit : "");
    } else {
      var a = view.annAt(row, s);
      if (!a) { el.innerHTML = ""; return; }
      h = "<b>" + esc(row.name) + "</b> " + esc(a.t) + " (" + esc(SA.fmtTime((a.e - a.s) / rate)) + ")";
    }
    el.innerHTML = h;
  }

  // ---------------------------------------------------------------- toolbar
  $("z-in").addEventListener("click", function () { view.zoomAt(0.5); });
  $("z-out").addEventListener("click", function () { view.zoomAt(2); });
  $("z-fit").addEventListener("click", function () { view.fit(); });
  $("z-cur").addEventListener("click", function () { var c = view.cur; if (c[0] != null && c[1] != null) view.showRange(Math.min(c[0], c[1]), Math.max(c[0], c[1])); });
  $("btn-hidden").addEventListener("click", function () {
    if (!st.cap) return;
    st.cap.channels.forEach(function (c) { c.visible = true; rememberChannel(c); });
    refreshRows();
  });
  SA.demos.forEach(function (d) { $("demo").insertAdjacentHTML("beforeend", '<option value="' + d.id + '">' + esc(d.name) + "</option>"); });
  $("demo").insertAdjacentHTML("afterbegin", '<option value="">Choose …</option>');
  $("demo").value = "";
  function loadDemo(id) {
    var d = SA.demos.filter(function (x) { return x.id === id; })[0];
    if (!d) return;
    var r = d.make();
    setCapture(r.cap, "demo", r.dec);
  }
  $("demo").addEventListener("change", function () { loadDemo(this.value); this.value = ""; });
  $("btn-open").addEventListener("click", function () { $("file").click(); });
  $("file").addEventListener("change", function () { if (this.files[0]) openFile(this.files[0]); this.value = ""; });
  function openFile(f) {
    status("Reading " + f.name + " …");
    SA.files.read(f).then(function (cap) {
      cap.source = f.name;
      setCapture(cap, "file");
      status("");
    }).catch(function (e) { status("Cannot read " + f.name + ": " + e.message, "err"); });
  }
  var wp = document.querySelector(".wave-panel");
  wp.addEventListener("dragover", function (e) { e.preventDefault(); });
  wp.addEventListener("drop", function (e) { e.preventDefault(); var f = e.dataTransfer.files[0]; if (f) openFile(f); });
  function baseName() {
    var d = new Date(), p = function (n) { return ("0" + n).slice(-2); };
    return "capture-" + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "-" + p(d.getHours()) + p(d.getMinutes());
  }
  $("btn-save").addEventListener("click", function () {
    if (!st.cap) return;
    SA.files.writeSr(st.cap).then(function (b) { download(baseName() + ".sr", b); });
  });
  $("export").addEventListener("change", function () {
    var k = this.value; this.value = "";
    if (!st.cap) return;
    try {
      if (k === "vcd") download(baseName() + ".vcd", SA.files.writeVcd(st.cap));
      else if (k === "csv") download(baseName() + ".csv", SA.files.writeCsv(st.cap));
      else if (k === "txt") {
        var lines = (st.list || []).map(function (x) { return (x.a.s / st.cap.rate).toFixed(9) + "\t" + x.n + "\t" + x.a.t; });
        download(baseName() + "-decoded.txt", new Blob(["time [s]\tdecoder\tdata\n" + lines.join("\n") + "\n"], { type: "text/plain" }));
      } else if (k === "png") {
        var r = view.ruler, m = view.main, c = document.createElement("canvas");
        c.width = m.width; c.height = r.height + m.height;
        var g = c.getContext("2d"); g.drawImage(r, 0, 0); g.drawImage(m, 0, r.height);
        c.toBlob(function (b) { download(baseName() + ".png", b); });
      }
    } catch (e) { status(e.message, "err"); }
  });

  // ---------------------------------------------------------------- channel popover
  var pop = $("pop"), popRow = null;
  function rememberChannel(c) {
    if (st.ctx !== "hw") return;
    var n = S.names[S.src] = S.names[S.src] || {};
    n[c.id] = { name: c.name, color: c.color, hidden: !c.visible };
    save();
  }
  function rememberThresholds() {
    if (st.ctx !== "hw" || !st.cap) return;
    S.thr = S.thr || {};
    S.thr[S.src] = st.cap.channels.filter(function (c) { return c.from; }).map(function (c) { return { from: c.from, level: c.level, hyst: c.hyst }; });
    save();
  }
  function openPop(row, rect) {
    popRow = row;
    var h;
    if (row.kind === "dec") {
      var def = SA.decoderById(row.dec.type);
      h = '<h3 id="pop-title">' + esc(row.name) + '<button type="button" data-a="close" aria-label="Close">×</button></h3><p>' + esc(def.info) + "</p>" +
        '<div class="pop-row"><button type="button" class="btn btn-small" data-a="hide-row">Hide this row</button>' +
        '<button type="button" class="btn btn-small" data-a="remove-dec">Remove decoder</button></div>';
    } else {
      var ch = row.ch;
      h = '<h3 id="pop-title">' + esc(ch.id) + (ch.from ? " (from " + esc(ch.from) + ")" : "") + '<button type="button" data-a="close" aria-label="Close">×</button></h3>' +
        '<label class="field"><span>Name</span><input type="text" id="pop-name" value="' + esc(ch.name) + '" maxlength="24" spellcheck="false"></label>' +
        '<div class="swatches" role="group" aria-label="Colour">' + SA.COLOURS.map(function (c, i) {
          return '<button type="button" data-col="' + c + '" style="background:' + c + '" aria-pressed="' + (c === ch.color) + '" aria-label="Colour ' + (i + 1) + '"></button>';
        }).join("") + "</div>";
      if (ch.kind === "a") {
        var lo = ch.store.min, hi = ch.store.max, mid = +((lo + hi) / 2).toPrecision(3), hy = +((hi - lo) / 10).toPrecision(2);
        var ex = st.cap.channel(ch.id + "~");
        h += "<p>A digital channel from this one, for the decoders:</p><div class=\"pop-row\">" +
          '<label class="field"><span>Threshold</span><input type="number" id="pop-lvl" step="any" value="' + (ex ? ex.level : mid) + '"></label>' +
          '<label class="field"><span>Hysteresis</span><input type="number" id="pop-hy" step="any" min="0" value="' + (ex ? ex.hyst : hy) + '"></label></div>' +
          '<div class="pop-row"><button type="button" class="btn btn-small btn-primary" data-a="thr">' + (ex ? "Update" : "Make digital channel") + "</button></div>";
      }
      h += '<div class="pop-row" style="margin-top:0.5rem"><button type="button" class="btn btn-small" data-a="hide">Hide channel</button>' +
        (ch.from ? '<button type="button" class="btn btn-small" data-a="remove">Remove</button>' : "") + "</div>";
    }
    pop.innerHTML = h;
    pop.hidden = false;
    var x = rect.left + rect.width + 6, y = rect.top - 4, w = pop.offsetWidth, hh = pop.offsetHeight;
    if (x + w > innerWidth - 8) x = Math.max(8, innerWidth - w - 8);
    if (y + hh > innerHeight - 8) y = Math.max(8, innerHeight - hh - 8);
    pop.style.left = x + "px"; pop.style.top = y + "px";
    var inp = $("pop-name"); if (inp) inp.focus();
  }
  function closePop() { pop.hidden = true; popRow = null; }
  pop.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b || !popRow) return;
    var a = b.getAttribute("data-a"), ch = popRow.ch;
    if (b.hasAttribute("data-col")) {
      ch.color = b.getAttribute("data-col");
      pop.querySelectorAll("[data-col]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      rememberChannel(ch); refreshRows(); return;
    }
    if (a === "close") closePop();
    else if (a === "hide") { ch.visible = false; rememberChannel(ch); refreshRows(); closePop(); }
    else if (a === "remove") { st.cap.removeChannel(ch.id); rememberThresholds(); renderDecoders(); decodeAll(); closePop(); }
    else if (a === "thr") {
      var lvl = parseFloat($("pop-lvl").value), hy = Math.max(0, parseFloat($("pop-hy").value) || 0);
      if (isNaN(lvl)) return;
      var nc = st.cap.addThreshold(ch.id, lvl, hy);
      rememberThresholds();
      renderDecoders(); decodeAll(); closePop();
      status("“" + nc.name + "” can now be used by the decoders.");
    } else if (a === "hide-row") { popRow.dec.hide = (popRow.dec.hide || []).concat([popRow.ri]); refreshRows(); closePop(); }
    else if (a === "remove-dec") { var u = popRow.dec.uid; st.decs = st.decs.filter(function (d) { return d.uid !== u; }); renderDecoders(); refreshRows(); results(); saveDecoders(); closePop(); }
  });
  pop.addEventListener("input", function (e) {
    if (e.target.id === "pop-name" && popRow && popRow.ch) {
      popRow.ch.name = e.target.value || popRow.ch.id;
      rememberChannel(popRow.ch); refreshRows();
      renderDecoders();
    }
  });
  pop.addEventListener("keydown", function (e) { if (e.key === "Escape" || (e.key === "Enter" && e.target.id === "pop-name")) { closePop(); view.main.focus(); } });
  document.addEventListener("pointerdown", function (e) { if (!pop.hidden && !pop.contains(e.target) && e.target !== view.main) closePop(); });

  // ---------------------------------------------------------------- capture settings
  function src() { return st.src[S.src]; }
  function status(t, kind) { var el = $("status"); el.textContent = t || ""; el.className = "status" + (kind ? " " + kind : ""); }
  function opt(k, d) { var o = S.opts[S.src] = S.opts[S.src] || {}; return o[k] != null ? o[k] : d; }
  function setOpt(k, v) { (S.opts[S.src] = S.opts[S.src] || {})[k] = v; save(); }
  function cfgChannels() {
    // the channels the next capture will have, with ids as in the capture
    var s = src(), c = s.channels(), names = S.names[S.src] || {}, out = [];
    var nm = function (x) { return (names[x.id] && names[x.id].name) || x.name; };
    if (S.src === "pico") {
      var nd = +opt("dig", 8), an = opt("ana", []);
      c.digital.slice(0, nd).forEach(function (x) { out.push({ id: x.id, name: nm(x), kind: "d", bit: x.bit }); });
      an.forEach(function (k, i) { var x = c.analog[k]; if (x) out.push({ id: x.id, name: nm(x), kind: "a", index: i }); });
    } else if (S.src === "fx2") {
      c.digital.slice(0, +opt("dig", 8)).forEach(function (x) { out.push({ id: x.id, name: nm(x), kind: "d", bit: x.bit }); });
    } else c.analog.forEach(function (x, i) { out.push({ id: x.id, name: nm(x), kind: "a", index: i }); });
    return out;
  }
  function renderSource() {
    document.querySelectorAll(".seg [data-src]").forEach(function (b) { b.setAttribute("aria-selected", String(b.getAttribute("data-src") === S.src)); });
    var s = src(), on = st.on[S.src];
    $("src-note").textContent = s.supported() ? NOTES[S.src] : "This browser cannot use " + s.name + ". Use Chrome, Edge or Opera on a computer.";
    $("conn-text").textContent = on ? st.info[S.src] : "Not connected";
    $("conn-dot").parentNode.className = "conn" + (on ? " connected" : "");
    $("btn-connect").textContent = on ? "Disconnect" : "Connect";
    $("btn-connect").disabled = !s.supported() || st.running;
    // source options
    var h = "";
    if (S.src === "pico") {
      var max = (s.info && s.info.digital) || 21, na = (s.info && s.info.analog) || 3, nd = Math.min(+opt("dig", 8), max), an = opt("ana", []);
      h += '<label class="field"><span>Digital channels</span><select id="o-dig">' + [0, 1, 2, 4, 8, 12, 16, 21].filter(function (x) { return x <= max; }).map(function (x) {
        return '<option value="' + x + '"' + (x === nd ? " selected" : "") + ">" + (x ? x + " (GP2–GP" + (x + 1) + ")" : "none") + "</option>";
      }).join("") + "</select></label>";
      h += '<div class="field"><span>Analog inputs</span><div class="chk-row">';
      for (var a = 0; a < na; a++) h += '<label class="check"><input type="checkbox" data-ana="' + a + '"' + (an.indexOf(a) >= 0 ? " checked" : "") + "> ADC" + a + " (GP" + (26 + a) + ")</label>";
      h += "</div></div>";
    } else if (S.src === "fx2") {
      if (s.prof && s.prof.wide) h += '<label class="field"><span>Channels</span><select id="o-dig"><option value="8"' + (+opt("dig", 8) === 8 ? " selected" : "") + '>8 (up to 24 MS/s)</option><option value="16"' + (+opt("dig", 8) === 16 ? " selected" : "") + ">16 (up to 12 MS/s)</option></select></label>";
    } else {
      h += '<label class="field"><span>Input</span><select id="o-dev"><option value="">Default input</option>' + (st.audioDevs || []).map(function (d) {
        return '<option value="' + esc(d.deviceId) + '"' + (d.deviceId === opt("dev", "") ? " selected" : "") + ">" + esc(d.label || "Input") + "</option>";
      }).join("") + "</select></label>";
    }
    $("src-opts").innerHTML = h;
    renderRates();
    renderTrigger();
    $("btn-run").disabled = !on || st.running;
    $("btn-stop").disabled = !st.running;
    $("repeat").checked = !!S.repeat;
  }
  function renderRates() {
    var s = src(), list, cur;
    if (S.src === "sound") { list = st.on.sound ? [s.rate] : SOUND_RATES; cur = st.on.sound ? s.rate : +S.rate.sound || 48000; }
    else { list = s.rates({ digital: +opt("dig", 8), analog: opt("ana", []) }); cur = +S.rate[S.src] || (S.src === "pico" ? 1e6 : 4e6); }
    if (list.indexOf(cur) < 0) cur = list.reduce(function (b, x) { return Math.abs(x - cur) < Math.abs(b - cur) ? x : b; }, list[0]);
    $("rate").innerHTML = list.map(function (r) { return '<option value="' + r + '"' + (r === cur ? " selected" : "") + ">" + SA.fmtRate(r) + "</option>"; }).join("");
    $("rate").disabled = S.src === "sound" && st.on.sound;
    var max = s.maxSamples(), n = +S.samples[S.src] || (S.src === "sound" ? 96000 : S.src === "fx2" ? 2e6 : 2e5);
    var sl = SAMPLES.filter(function (x) { return x <= max; });
    if (S.src === "sound") sl = sl.concat([48000, 96000, 240000, 480000]).sort(function (a, b) { return a - b; });
    if (sl.indexOf(n) < 0) n = sl.reduce(function (b, x) { return Math.abs(x - n) < Math.abs(b - n) ? x : b; }, sl[0]);
    $("samples").innerHTML = sl.map(function (x) { return '<option value="' + x + '"' + (x === n ? " selected" : "") + ">" + x.toLocaleString("en") + "</option>"; }).join("");
    duration();
  }
  function duration() {
    var r = +$("rate").value, n = +$("samples").value;
    $("dur").textContent = r && n ? "That is " + SA.fmtTime(n / r) + " of signal." : "";
  }
  function renderTrigger() {
    var chs = cfgChannels(), cur = opt("trig", "");
    $("trig-ch").innerHTML = '<option value="">none: start at once</option>' + chs.map(function (c) {
      return '<option value="' + esc(c.id) + '"' + (c.id === cur ? " selected" : "") + ">" + esc(c.name) + "</option>";
    }).join("");
    if ($("trig-ch").value !== cur) setOpt("trig", "");
    var c = chs.filter(function (x) { return x.id === $("trig-ch").value; })[0], type = opt("ttype", "fall");
    var types = c && c.kind === "a" ? [["rise", "rises above"], ["fall", "falls below"], ["edge", "crosses"]] :
      [["fall", "falling edge"], ["rise", "rising edge"], ["edge", "any edge"], ["low", "is low"], ["high", "is high"]];
    $("trig-type").innerHTML = types.map(function (t) { return '<option value="' + t[0] + '"' + (t[0] === type ? " selected" : "") + ">" + t[1] + "</option>"; }).join("");
    $("trig-type").disabled = $("trig-pre").disabled = !c;
    $("trig-level-f").hidden = !(c && c.kind === "a");
    $("trig-level").value = opt("tlevel", 0);
    $("trig-pre").value = String(opt("pre", 0.1));
  }
  document.querySelectorAll(".seg [data-src]").forEach(function (b) {
    b.addEventListener("click", function () { if (st.running) return; S.src = b.getAttribute("data-src"); save(); renderSource(); status(""); });
  });
  $("src-opts").addEventListener("change", function (e) {
    var t = e.target;
    if (t.id === "o-dig") setOpt("dig", +t.value);
    else if (t.hasAttribute("data-ana")) {
      var an = [];
      $("src-opts").querySelectorAll("[data-ana]").forEach(function (x) { if (x.checked) an.push(+x.getAttribute("data-ana")); });
      setOpt("ana", an);
    } else if (t.id === "o-dev") { setOpt("dev", t.value); if (st.on.sound) reconnectSound(); return; }
    renderRates(); renderTrigger();
  });
  $("rate").addEventListener("change", function () { S.rate[S.src] = +this.value; save(); duration(); });
  $("samples").addEventListener("change", function () { S.samples[S.src] = +this.value; save(); duration(); });
  $("trig-ch").addEventListener("change", function () { setOpt("trig", this.value); renderTrigger(); });
  $("trig-type").addEventListener("change", function () { setOpt("ttype", this.value); });
  $("trig-level").addEventListener("change", function () { setOpt("tlevel", parseFloat(this.value) || 0); });
  $("trig-pre").addEventListener("change", function () { setOpt("pre", +this.value); });
  $("repeat").addEventListener("change", function () { S.repeat = this.checked; save(); });

  // ---------------------------------------------------------------- connecting
  async function connect() {
    var s = src(), key = S.src;
    if (st.on[key]) { await s.disconnect(); st.on[key] = false; renderSource(); status("Disconnected."); return; }
    status("Choose the device in the browser's list …");
    try {
      var text = await s.connect(function (t) { status(t); }, { rate: +S.rate.sound || 48000, deviceId: opt("dev", "") });
      st.on[key] = true; st.info[key] = text;
      if (key === "sound") { try { st.audioDevs = await s.devices(); } catch (e) { st.audioDevs = []; } }
      renderSource();
      status("Ready. Set the sample rate and press Capture.");
    } catch (e) {
      if (e.again) status("The analyzer has its firmware now and shows up as a new device. Press Connect once more and choose it.", "warn");
      else if (e.name === "NotFoundError" || e.name === "AbortError") status("");
      else if (e.name === "NotAllowedError" && key === "sound") status("The browser did not allow access to the microphone input.", "err");
      else if (e.name === "SecurityError" || /Access denied/i.test(e.message)) status("Access denied. Another program may use the device, or on Windows the WinUSB driver is missing (Zadig).", "err");
      else status(e.message, "err");
      try { await s.disconnect(); } catch (x) { /* nothing to close */ }
      st.on[key] = false; renderSource();
    }
  }
  async function reconnectSound() {
    var s = st.src.sound;
    await s.disconnect();
    try { st.info.sound = await s.connect(function (t) { status(t); }, { rate: +S.rate.sound || 48000, deviceId: opt("dev", "") }); st.on.sound = true; }
    catch (e) { st.on.sound = false; status(e.message, "err"); }
    renderSource();
  }
  $("btn-connect").addEventListener("click", connect);
  if ("serial" in navigator) navigator.serial.addEventListener("disconnect", function (e) {
    if (st.src.pico.port === e.target) { st.src.pico.port = null; st.on.pico = false; st.stop = true; renderSource(); status("The Pico was unplugged.", "warn"); }
  });
  if ("usb" in navigator) navigator.usb.addEventListener("disconnect", function (e) {
    if (st.src.fx2.dev === e.device) { st.src.fx2.dev = null; st.on.fx2 = false; st.stop = true; renderSource(); status("The analyzer was unplugged.", "warn"); }
  });

  // ---------------------------------------------------------------- capturing
  function buildCfg() {
    var chs = cfgChannels(), tid = opt("trig", ""), tc = chs.filter(function (c) { return c.id === tid; })[0], trig = null;
    if (tc) trig = tc.kind === "d" ? { kind: "d", bit: tc.bit, type: opt("ttype", "fall") } : { kind: "a", index: tc.index, type: opt("ttype", "rise"), level: +opt("tlevel", 0) };
    return { rate: +$("rate").value, n: +$("samples").value, digital: chs.filter(function (c) { return c.kind === "d"; }).length,
      analog: S.src === "pico" ? opt("ana", []).slice().sort() : [], trig: trig, pre: trig ? +opt("pre", 0.1) : 0 };
  }
  async function run() {
    var s = src(), key = S.src;
    if (!st.on[key] || st.running) return;
    var cfg = buildCfg();
    if (!cfg.digital && !(cfg.analog.length) && key !== "sound") { status("Choose at least one channel.", "warn"); return; }
    st.running = true; st.stop = false; renderSource();
    try {
      do {
        var r = await s.capture(cfg, function (t) { status(t); }, function () { return st.stop; });
        if (r.capture) setCapture(r.capture, "hw");
        if (r.noTrigger && !r.capture) status("Stopped. The trigger did not come.", "warn");
        else if (r.warn) { status(r.warn, "warn"); info(); }
        else status(r.noTrigger ? "Stopped before the trigger came." : st.stop ? "Stopped." : "Done.");
        if (r.warn) break;
      } while ($("repeat").checked && !st.stop && st.on[key]);
    } catch (e) {
      status(e.message || String(e), "err");
      if (/disconnect|device|lost|closed/i.test(e.message || "") && key !== "sound") { try { await s.disconnect(); } catch (x) { /* gone */ } st.on[key] = false; }
    }
    st.running = false; renderSource();
  }
  $("btn-run").addEventListener("click", run);
  $("btn-stop").addEventListener("click", function () { st.stop = true; status("Stopping …"); });
  document.addEventListener("keydown", function (e) {
    if (e.target.closest("input, select, textarea")) return;
    if (e.key === " " && document.activeElement === view.main) { e.preventDefault(); if (st.running) st.stop = true; else run(); }
  });

  // ---------------------------------------------------------------- start
  if (!("serial" in navigator) && !("usb" in navigator)) $("unsupported").hidden = false;
  renderSource();
  if (S.hw) { setDecoders(S.decoders || []); view.setRows([]); info(); }
  else loadDemo("i2c");
  cursors();
})();
