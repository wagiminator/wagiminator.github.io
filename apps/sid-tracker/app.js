/* C64 SID Tracker: the user interface */
(function () {
  "use strict";

  var S = window.TrackerSong, B = window.TrackerBuild, E = window.TrackerEngine, Demo = window.TrackerDemo;
  var $ = function (id) { return document.getElementById(id); };
  var VCOL = ["#ff7a5c", "#4fd68a", "#5aaeff"];
  var KEY = "c64trk.song";
  var NOTE_KEYS = { z: 0, s: 1, x: 2, d: 3, c: 4, v: 5, g: 6, b: 7, h: 8, n: 9, j: 10, m: 11, ",": 12, l: 13, ".": 14, ";": 15, "/": 16,
    q: 12, 2: 13, w: 14, 3: 15, e: 16, r: 17, 5: 18, t: 19, 6: 20, y: 21, 7: 22, u: 23, i: 24, 9: 25, o: 26, 0: 27, p: 28 };
  var HEX = "0123456789ABCDEF";
  var WAVES = [[0, "keep"], [1, "Triangle"], [2, "Sawtooth"], [4, "Pulse"], [8, "Noise"], [3, "Tri + saw"], [5, "Tri + pulse"], [6, "Saw + pulse"], [7, "Tri + saw + pulse"], [16, "none"]];

  var st = {
    song: null, pos: 0, cur: { v: 0, f: 0, r: 0 }, sel: null, anchor: null, ins: 1,
    oct: 3, step: 1, follow: true, clip: null, mute: [false, false, false], solo: -1,
    held: {}, playRow: -1, rowEls: [], dirtyPattern: true
  };

  // ---------------------------------------------------------------- history and saving
  var hist = new S.History(function () { return st.song; }, function (s) { st.song = s; afterLoad(); }, updateUndo);
  function checkpoint(label, merge) { hist.checkpoint(label, merge); }
  var saveTimer = null;
  function changed(what) {
    E.changed(st.song);
    if (what !== "ins") st.dirtyPattern = true;
    renderAll(what);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(autosave, 700);
  }
  function autosave() {
    try { localStorage.setItem(KEY, S.toJSON(st.song)); say("Saved in this browser", true); } catch (e) { /* storage full or blocked */ }
  }
  function updateUndo() {
    $("btn-undo").disabled = !hist.undoStack.length;
    $("btn-redo").disabled = !hist.redoStack.length;
  }
  var sayTimer = null;
  function say(text, quiet) {
    var el = $("saved");
    el.textContent = text;
    el.classList.toggle("note-on", !quiet);
    clearTimeout(sayTimer);
    sayTimer = setTimeout(function () { el.textContent = ""; }, quiet ? 1500 : 5000);
  }
  var msgTimer = null;
  function message(text, err) {
    var m = $("msg");
    m.hidden = !text; m.textContent = text || "";
    m.classList.toggle("error", !!err);
    clearTimeout(msgTimer);
    if (text) msgTimer = setTimeout(function () { m.hidden = true; }, err ? 9000 : 5000);
  }
  E.onError = function (e) { message(e.message || String(e), true); };
  E.onStop = function () { updateTransport(); };

  function hex(v, n) { return ("000" + v.toString(16).toUpperCase()).slice(-n); }
  function download(name, data, type) {
    var blob = data instanceof Blob ? data : new Blob([data], { type: type || "application/octet-stream" });
    var url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
  }
  function fileBase() {
    return (st.song.name || "song").trim().replace(/[^\w\- ]+/g, "").replace(/\s+/g, "-").toLowerCase() || "song";
  }
  function patOf(v, pos) { var o = st.song.order[pos == null ? st.pos : pos]; return st.song.patterns[o.p[v]]; }

  // ---------------------------------------------------------------- song settings
  function renderSettings() {
    var s = st.song;
    [["s-name", s.name], ["s-author", s.author], ["s-released", s.released]].forEach(function (f) {
      if (document.activeElement !== $(f[0])) $(f[0]).value = f[1];
    });
    if (document.activeElement !== $("s-speed")) $("s-speed").value = s.speed;
    if (document.activeElement !== $("s-rows")) $("s-rows").value = s.rows;
    $("s-multi").value = String(s.multi);
    $("s-model").value = String(s.model);
    if (document.activeElement !== $("s-load")) $("s-load").value = hex(s.load, 4);
    var info = $("size-info");
    try {
      var b = B.build(s);
      info.textContent = "Player " + (b.bytes.length - b.dataSize).toLocaleString("en") + " + song " + b.dataSize.toLocaleString("en") +
        " bytes · $" + hex(b.load, 4) + "–$" + hex(b.end, 4);
      info.style.color = "";
    } catch (e) {
      info.textContent = e.message; info.style.color = "var(--danger)";
    }
  }
  function textField(id, key) {
    $(id).addEventListener("input", function () { checkpoint(id, true); st.song[key] = $(id).value.slice(0, 32); changed("info"); });
  }
  textField("s-name", "name"); textField("s-author", "author"); textField("s-released", "released");
  function numField(id, min, max, apply) {
    $(id).addEventListener("change", function () {
      var v = Math.round(+$(id).value);
      if (!isFinite(v)) { renderSettings(); return; }
      v = Math.max(min, Math.min(max, v));
      checkpoint(id); apply(v); changed();
    });
  }
  numField("s-speed", 1, 31, function (v) { st.song.speed = v; });
  numField("s-rows", 1, 64, function (v) { st.song.rows = v; st.cur.r = Math.min(st.cur.r, v - 1); st.sel = null; });
  $("s-multi").addEventListener("change", function () { checkpoint("multi"); st.song.multi = +$("s-multi").value; changed(); });
  $("s-model").addEventListener("change", function () { checkpoint("model"); st.song.model = +$("s-model").value; E.setModel(st.song.model); changed("info"); });
  $("s-load").addEventListener("change", function () {
    var v = parseInt($("s-load").value.replace(/^\$/, ""), 16);
    if (!isFinite(v) || v < 0x0800 || v > 0xF000) { message("The load address goes from $0800 to $F000.", true); renderSettings(); return; }
    checkpoint("load"); st.song.load = v & 0xFF00; changed("info");
  });

  // ---------------------------------------------------------------- order list
  function renderOrder() {
    var s = st.song, box = $("order"), html = "";
    s.order.forEach(function (o, i) {
      html += '<div class="orow' + (i === st.pos ? " on" : "") + '" role="option" aria-selected="' + (i === st.pos) + '" data-p="' + i + '">' +
        '<span class="pn">' + hex(i, 2) + (i === s.loop ? '<span class="lp" title="The song loops back to here"> ↺</span>' : "") + "</span>";
      for (var v = 0; v < 3; v++) {
        var t = o.t[v];
        html += "<span>" + hex(o.p[v], 2) + (t ? "<small>" + (t > 0 ? "+" : "") + t + "</small>" : "") + "</span>";
      }
      html += "</div>";
    });
    box.innerHTML = html;
    $("order-count").textContent = s.order.length + (s.order.length === 1 ? " position" : " positions");
    var on = box.querySelector(".on");
    if (on) {
      var r = on.getBoundingClientRect(), b = box.getBoundingClientRect();
      if (r.top < b.top || r.bottom > b.bottom) box.scrollTop = on.offsetTop - box.clientHeight / 2;
    }
    $("ord-up").disabled = st.pos === 0;
    $("ord-down").disabled = st.pos >= s.order.length - 1;
    $("ord-del").disabled = s.order.length < 2;
    $("ord-add").disabled = $("ord-new").disabled = s.order.length >= S.MAXPOS;
    renderOrderEdit();
  }
  function usage(p) {
    var n = 0;
    st.song.order.forEach(function (o) { o.p.forEach(function (q) { if (q === p) n++; }); });
    return n;
  }
  function renderOrderEdit() {
    var s = st.song, o = s.order[st.pos], grid = $("oe-grid");
    $("oe-pos").textContent = hex(st.pos, 2);
    $("oe-loop").checked = s.loop === st.pos;
    if (!grid.children.length) {
      var html = "";
      for (var v = 0; v < 3; v++) {
        html += '<div class="oe-v"><span class="vl v' + (v + 1) + '">V' + (v + 1) + "</span>" +
          '<div class="oe-row"><span class="lbl">Pattern</span>' +
          '<button type="button" class="icon-btn" data-oe="dec" data-v="' + v + '" aria-label="Pattern before" title="Pattern before">−</button>' +
          '<input type="text" class="hexin" maxlength="2" spellcheck="false" data-oe="pat" data-v="' + v + '" aria-label="Pattern of voice ' + (v + 1) + ' (hexadecimal)">' +
          '<button type="button" class="icon-btn" data-oe="inc" data-v="' + v + '" aria-label="Next pattern" title="Next pattern">+</button>' +
          '<small data-oe="use" data-v="' + v + '" title="Positions that use this pattern"></small></div>' +
          '<div class="oe-row"><span class="lbl">Transpose</span>' +
          '<input type="number" min="-32" max="31" data-oe="tr" data-v="' + v + '" aria-label="Transpose of voice ' + (v + 1) + ' (semitones)">' +
          '<span class="push"></span>' +
          '<button type="button" class="icon-btn" data-oe="new" data-v="' + v + '" aria-label="A new empty pattern" title="A new empty pattern">◻</button>' +
          '<button type="button" class="icon-btn" data-oe="copy" data-v="' + v + '" aria-label="Copy to a new pattern" title="Copy to a new pattern (changes stay at this position)">⧉</button>' +
          "</div></div>";
      }
      grid.innerHTML = html;
    }
    for (var k = 0; k < 3; k++) {
      var pi = grid.querySelector('[data-oe="pat"][data-v="' + k + '"]'), ti = grid.querySelector('[data-oe="tr"][data-v="' + k + '"]');
      if (document.activeElement !== pi) pi.value = hex(o.p[k], 2);
      if (document.activeElement !== ti) ti.value = o.t[k];
      var u = usage(o.p[k]);
      grid.querySelector('[data-oe="use"][data-v="' + k + '"]').textContent = u > 1 ? u + "×" : "";
      grid.querySelector('[data-oe="new"][data-v="' + k + '"]').disabled = !canNewPattern();
      grid.querySelector('[data-oe="copy"][data-v="' + k + '"]').disabled = !canNewPattern();
    }
  }
  function isEmpty(p) { return p.every(function (r) { return !r[0] && !r[1] && !r[2] && !r[3]; }); }
  function canNewPattern() { return freePattern(true) >= 0; }
  // an empty pattern no position uses, or a new one
  function freePattern(test) {
    var s = st.song;
    for (var i = 0; i < s.patterns.length; i++) if (!usage(i) && isEmpty(s.patterns[i])) return i;
    if (s.patterns.length >= S.MAXPAT) return -1;
    if (test) return s.patterns.length;
    s.patterns.push(S.emptyRows());
    return s.patterns.length - 1;
  }
  $("oe-grid").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-oe]"); if (!b) return;
    var v = +b.getAttribute("data-v"), what = b.getAttribute("data-oe"), o = st.song.order[st.pos];
    if (what === "dec" || what === "inc") {
      var n = o.p[v] + (what === "inc" ? 1 : -1);
      if (n < 0) return;
      checkpoint("Pattern");
      if (n >= st.song.patterns.length) { if (n >= S.MAXPAT) return; st.song.patterns.push(S.emptyRows()); }
      o.p[v] = n;
    } else if (what === "new") {
      checkpoint("New pattern");
      var f = freePattern(); if (f < 0) return;
      o.p[v] = f;
    } else if (what === "copy") {
      checkpoint("Copy pattern");
      var src = st.song.patterns[o.p[v]], c = freePattern(); if (c < 0) return;
      st.song.patterns[c] = src.map(function (r) { return r.slice(); });
      o.p[v] = c;
      say("Pattern " + hex(c, 2) + " is a copy: changes to it stay at this position.");
    }
    changed();
  });
  $("oe-grid").addEventListener("change", function (e) {
    var inp = e.target.closest("input[data-oe]"); if (!inp) return;
    var v = +inp.getAttribute("data-v"), o = st.song.order[st.pos], pat = inp.getAttribute("data-oe") === "pat";
    var val = pat ? parseInt(inp.value, 16) : Math.round(+inp.value);
    if (!isFinite(val)) { renderOrderEdit(); return; }
    if (pat) {
      val = Math.max(0, Math.min(S.MAXPAT - 1, val));
      checkpoint("Pattern");
      while (st.song.patterns.length <= val) st.song.patterns.push(S.emptyRows());
      o.p[v] = val;
    } else {
      checkpoint("Transpose");
      o.t[v] = Math.max(-32, Math.min(31, val));
    }
    changed();
  });
  $("oe-loop").addEventListener("change", function () {
    checkpoint("Loop"); st.song.loop = $("oe-loop").checked ? st.pos : 0; changed();
  });
  $("order").addEventListener("click", function (e) {
    var r = e.target.closest("[data-p]"); if (!r) return;
    selectPos(+r.getAttribute("data-p"));
  });
  $("order").addEventListener("keydown", function (e) {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); selectPos(st.pos + (e.key === "ArrowUp" ? -1 : 1)); }
    else if (e.key === "Enter") { e.preventDefault(); $("pattern").focus(); }
  });
  function selectPos(p) {
    p = Math.max(0, Math.min(st.song.order.length - 1, p));
    if (p === st.pos) return;
    st.pos = p; st.sel = null; st.dirtyPattern = true;
    renderOrder(); renderPattern();
  }
  $("ord-add").addEventListener("click", function () {
    checkpoint("Add position");
    var o = st.song.order[st.pos];
    st.song.order.splice(st.pos + 1, 0, { p: o.p.slice(), t: o.t.slice() });
    if (st.song.loop > st.pos) st.song.loop++;
    st.pos++; changed();
  });
  $("ord-new").addEventListener("click", function () {
    var free = [], s = st.song, i;
    // three empty patterns nobody uses
    for (i = 0; i < s.patterns.length && free.length < 3; i++) if (!usage(i) && isEmpty(s.patterns[i])) free.push(i);
    if (free.length + (S.MAXPAT - s.patterns.length) < 3) { message("There is no room for more patterns (128 at most).", true); return; }
    checkpoint("Add position");
    while (free.length < 3) { s.patterns.push(S.emptyRows()); free.push(s.patterns.length - 1); }
    s.order.splice(st.pos + 1, 0, { p: free, t: [0, 0, 0] });
    if (s.loop > st.pos) s.loop++;
    st.pos++; changed();
  });
  $("ord-del").addEventListener("click", function () {
    var s = st.song;
    if (s.order.length < 2) return;
    checkpoint("Remove position");
    s.order.splice(st.pos, 1);
    if (s.loop > st.pos || s.loop >= s.order.length) s.loop = Math.max(0, s.loop - 1);
    st.pos = Math.min(st.pos, s.order.length - 1); changed();
  });
  function movePos(d) {
    var s = st.song, j = st.pos + d;
    if (j < 0 || j >= s.order.length) return;
    checkpoint("Move position");
    var t = s.order[st.pos]; s.order[st.pos] = s.order[j]; s.order[j] = t;
    if (s.loop === st.pos) s.loop = j; else if (s.loop === j) s.loop = st.pos;
    st.pos = j; changed();
  }
  $("ord-up").addEventListener("click", function () { movePos(-1); });
  $("ord-down").addEventListener("click", function () { movePos(1); });

  // ---------------------------------------------------------------- voices (scopes, mute)
  function buildVoices() {
    var box = $("voices"), html = '<span aria-hidden="true"></span>';
    for (var v = 0; v < 3; v++) {
      html += '<div class="vh" id="vh' + v + '" style="--vc:' + VCOL[v] + '">' +
        '<div class="vh-top"><span class="vh-dot"></span><span class="vh-title">Voice ' + (v + 1) + '</span><span class="vh-pat" id="vh-pat' + v + '"></span></div>' +
        '<canvas width="240" height="38" id="scope' + v + '" aria-hidden="true"></canvas>' +
        '<div class="vh-btns"><button type="button" class="v-btn" data-mute="' + v + '" aria-pressed="false" title="Mute">Mute</button>' +
        '<button type="button" class="v-btn" data-solo="' + v + '" aria-pressed="false" title="Only this voice">Solo</button></div></div>';
    }
    box.innerHTML = html;
    box.addEventListener("click", function (e) {
      var m = e.target.closest("[data-mute]"), s = e.target.closest("[data-solo]");
      if (m) { var v = +m.getAttribute("data-mute"); st.mute[v] = !st.mute[v]; st.solo = -1; }
      else if (s) { var w = +s.getAttribute("data-solo"); st.solo = st.solo === w ? -1 : w; }
      else return;
      applyMute();
    });
  }
  function applyMute() {
    var mask = 0;
    for (var v = 0; v < 3; v++) {
      var off = st.solo >= 0 ? v !== st.solo : st.mute[v];
      if (off) mask |= 1 << v;
      $("vh" + v).classList.toggle("muted", off);
      $("vh" + v).querySelector("[data-mute]").setAttribute("aria-pressed", st.solo < 0 && st.mute[v] ? "true" : "false");
      $("vh" + v).querySelector("[data-solo]").setAttribute("aria-pressed", st.solo === v ? "true" : "false");
    }
    E.setMute(mask);
  }
  var scopeBuf = new Float32Array(2048), SPAN = 960;
  function drawScopes() {
    for (var v = 0; v < 3; v++) {
      var cv = $("scope" + v), g = cv.getContext("2d"), w = cv.width, h = cv.height;
      g.fillStyle = "#0d1220"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#1c2438"; g.fillRect(0, h >> 1, w, 1);
      if (!E.scope(v, scopeBuf)) continue;
      // about 20 ms, starting where the wave rises through its middle, so it stands still
      var lo = 1, hi = -1, i;
      for (i = 0; i < scopeBuf.length; i++) { lo = Math.min(lo, scopeBuf[i]); hi = Math.max(hi, scopeBuf[i]); }
      var mid = (lo + hi) / 2, start = 0, last = scopeBuf.length - SPAN;
      for (i = 1; i < last; i++) if (scopeBuf[i - 1] < mid && scopeBuf[i] >= mid) { start = i; break; }
      g.strokeStyle = VCOL[v]; g.lineWidth = 1.5; g.beginPath();
      for (var x = 0; x < w; x++) {
        var s = scopeBuf[start + Math.floor(x * SPAN / w)] - mid, y = h / 2 - s * h * 0.45;
        if (x) g.lineTo(x, y); else g.moveTo(x, y);
      }
      g.stroke();
    }
  }

  // ---------------------------------------------------------------- the pattern
  function cellHTML(r) {
    var n = r[0], i = r[1], c = r[2], p = r[3];
    var nt = n ? '<i data-f="0" class="nt' + (n === S.NOTE_OFF ? " off" : "") + '">' + S.noteName(n) + "</i>" : '<i data-f="0" class="dim">···</i>';
    var ins = i ? '<span class="in"><i data-f="1">' + HEX[i >> 4] + '</i><i data-f="2">' + HEX[i & 15] + "</i></span>"
      : '<span class="dim"><i data-f="1">·</i><i data-f="2">·</i></span>';
    var cm = c || p ? '<span class="cm"><i data-f="3">' + HEX[c] + "</i></span>" : '<span class="dim"><i data-f="3">·</i></span>';
    var pa = c || p ? '<span class="pa"><i data-f="4">' + HEX[p >> 4] + '</i><i data-f="5">' + HEX[p & 15] + "</i></span>"
      : '<span class="dim"><i data-f="4">·</i><i data-f="5">·</i></span>';
    return nt + ins + cm + pa;
  }
  function renderPattern() {
    var s = st.song, box = $("pattern"), o = s.order[st.pos], html = "";
    if (st.dirtyPattern) {
      for (var r = 0; r < s.rows; r++) {
        html += '<div class="prow' + (r % 16 === 0 ? " bar" : r % 4 === 0 ? " beat" : "") + '" data-r="' + r + '"><span class="rn">' + hex(r, 2) + "</span>";
        for (var v = 0; v < 3; v++) html += '<span class="cell" data-v="' + v + '">' + cellHTML(s.patterns[o.p[v]][r]) + "</span>";
        html += "</div>";
      }
      box.innerHTML = html;
      st.rowEls = Array.prototype.slice.call(box.children);
      st.dirtyPattern = false;
      st.playRow = -1;
      $("voices").style.paddingRight = (box.offsetWidth - box.clientWidth) + "px";
    }
    for (var k = 0; k < 3; k++) {
      var t = o.t[k];
      $("vh-pat" + k).textContent = "Pattern " + hex(o.p[k], 2) + (t ? (t > 0 ? " +" : " ") + t : "");
    }
    showCursor();
  }
  function fieldEl(r, v, f) {
    var row = st.rowEls[r];
    return row ? row.children[1 + v].querySelector('[data-f="' + f + '"]') : null;
  }
  var curEl = null;
  function showCursor(scroll) {
    if (curEl) curEl.classList.remove("cur");
    var c = st.cur;
    curEl = fieldEl(c.r, c.v, c.f);
    if (curEl) curEl.classList.add("cur");
    // selection
    st.rowEls.forEach(function (row, r) {
      for (var v = 0; v < 3; v++) {
        var on = !!st.sel && r >= st.sel.r0 && r <= st.sel.r1 && v >= st.sel.v0 && v <= st.sel.v1;
        row.children[1 + v].classList.toggle("sel", on);
      }
    });
    if (scroll !== false) scrollToRow(c.r);
    status();
  }
  function scrollToRow(r, center) {
    var box = $("pattern"), row = st.rowEls[r];
    if (!row) return;
    var top = row.offsetTop, h = row.offsetHeight;
    if (center) box.scrollTop = top - box.clientHeight / 2 + h / 2;
    else if (top < box.scrollTop + h * 2) box.scrollTop = top - h * 2;
    else if (top + h > box.scrollTop + box.clientHeight - h * 2) box.scrollTop = top + h * 3 - box.clientHeight;
  }
  var CMD_TEXT = [
    "", "slide up by $xx per frame", "slide down by $xx per frame", "slide to the note, speed $xx", "vibrato: speed x, depth y",
    "attack x, decay y", "sustain x, release y", "waveform $xx", "arpeggio: +x and +y semitones", "pulse width $xx × 16",
    "filter cutoff $xx", "filter resonance x, type y", "volume", "filter sweep", "", "speed: $xx frames per row"
  ];
  function status() {
    var c = st.cur, o = st.song.order[st.pos], row = patOf(c.v)[c.r], t = "Voice " + (c.v + 1) + " · row " + hex(c.r, 2) + " · pattern " + hex(o.p[c.v], 2);
    if (row[1]) {
      var ins = st.song.instruments[row[1] - 1];
      t += " · instrument " + hex(row[1], 2) + (ins ? " " + ins.name : " (none)");
    }
    if (row[2]) t += " · " + HEX[row[2]] + hex(row[3], 2) + ": " + (CMD_TEXT[row[2]] || "no command");
    else if (c.f >= 3) t += " · command: 1–F, see the table below";
    $("pat-status").textContent = t;
  }
  function moveCur(dr, dv, df, extend) {
    var c = st.cur, rows = st.song.rows;
    if (extend) { if (!st.anchor) st.anchor = { r: c.r, v: c.v }; }
    else { st.anchor = null; st.sel = null; }
    if (df) {
      c.f += df;
      if (c.f > 5) { c.f = 0; c.v = (c.v + 1) % 3; }
      if (c.f < 0) { c.f = 5; c.v = (c.v + 2) % 3; }
    }
    if (dv) c.v = (c.v + dv + 3) % 3;
    if (dr) c.r = ((c.r + dr) % rows + rows) % rows;
    if (extend) {
      st.sel = { r0: Math.min(st.anchor.r, c.r), r1: Math.max(st.anchor.r, c.r), v0: Math.min(st.anchor.v, c.v), v1: Math.max(st.anchor.v, c.v) };
    }
    showCursor();
  }
  function setCell(v, r, fn, label) {
    checkpoint(label || "Edit", label === "Type");
    fn(patOf(v)[r]);
    // only this cell changed: draw it alone
    var row = st.rowEls[r];
    if (row) row.children[1 + v].innerHTML = cellHTML(patOf(v)[r]);
    E.changed(st.song);
    renderOrderEdit();
    clearTimeout(saveTimer); saveTimer = setTimeout(autosave, 700);
    curEl = null;
    showCursor(false);
  }
  // the same pattern can be at this position more than once: draw all of them
  function redrawPattern() { st.dirtyPattern = true; renderPattern(); E.changed(st.song); clearTimeout(saveTimer); saveTimer = setTimeout(autosave, 700); }
  function samePatternTwice() { var p = st.song.order[st.pos].p; return p[0] === p[1] || p[1] === p[2] || p[0] === p[2]; }

  function enterNote(n) {
    var c = st.cur, v = c.v, r = c.r;
    setCell(v, r, function (row) { row[0] = n; if (n !== S.NOTE_OFF && n) row[1] = st.ins; }, "Note");
    if (samePatternTwice()) redrawPattern();
    if (st.step) moveCur(st.step, 0, 0);
  }
  function enterHex(d) {
    var c = st.cur, f = c.f;
    setCell(c.v, c.r, function (row) {
      if (f === 1) row[1] = Math.min(S.MAXINS, (d << 4) | (row[1] & 15));
      else if (f === 2) row[1] = Math.min(S.MAXINS, (row[1] & 0xF0) | d);
      else if (f === 3) row[2] = d;
      else if (f === 4) row[3] = (d << 4) | (row[3] & 15);
      else if (f === 5) row[3] = (row[3] & 0xF0) | d;
    }, "Type");
    if (samePatternTwice()) redrawPattern();
    if (f === 1 || f === 4 || f === 3) { c.f++; showCursor(); }
    else { c.f--; moveCur(st.step, 0, 0); }
  }
  function clearField() {
    if (st.sel) { clearSel(); return; }
    var c = st.cur;
    setCell(c.v, c.r, function (row) {
      if (c.f === 0) { row[0] = 0; row[1] = 0; }
      else if (c.f <= 2) row[1] = 0;
      else { row[2] = 0; row[3] = 0; }
    }, "Clear");
    if (samePatternTwice()) redrawPattern();
    moveCur(st.step, 0, 0);
  }
  function shiftRows(ins) {
    checkpoint(ins ? "Insert row" : "Remove row");
    var c = st.cur, p = patOf(c.v), rows = st.song.rows;
    if (ins) { p.splice(rows - 1, 1); p.splice(c.r, 0, [0, 0, 0, 0]); }
    else { p.splice(c.r, 1); p.splice(rows - 1, 0, [0, 0, 0, 0]); }
    redrawPattern();
  }

  // selection, clipboard, transpose
  function area() {
    if (st.sel) return st.sel;
    return { r0: 0, r1: st.song.rows - 1, v0: st.cur.v, v1: st.cur.v };
  }
  function copySel() {
    var a = area(), out = [];
    for (var v = a.v0; v <= a.v1; v++) out.push(patOf(v).slice(a.r0, a.r1 + 1).map(function (r) { return r.slice(); }));
    st.clip = out;
    say("Copied " + (a.r1 - a.r0 + 1) + " rows of " + out.length + (out.length > 1 ? " voices" : " voice"));
  }
  function clearSel() {
    var a = area();
    checkpoint("Clear");
    for (var v = a.v0; v <= a.v1; v++) for (var r = a.r0; r <= a.r1; r++) patOf(v)[r] = [0, 0, 0, 0];
    redrawPattern();
  }
  function paste() {
    if (!st.clip) { say("Copy something first."); return; }
    checkpoint("Paste");
    var c = st.cur;
    st.clip.forEach(function (rows, k) {
      var v = c.v + k; if (v > 2) return;
      rows.forEach(function (row, i) { if (c.r + i < st.song.rows) patOf(v)[c.r + i] = row.slice(); });
    });
    redrawPattern();
  }
  function transpose(d) {
    var a = area(), seen = {};
    checkpoint("Transpose");
    for (var v = a.v0; v <= a.v1; v++) {
      var pn = st.song.order[st.pos].p[v];
      if (seen[pn] && !st.sel) continue;
      seen[pn] = true;
      for (var r = a.r0; r <= a.r1; r++) {
        var row = patOf(v)[r];
        if (row[0] >= 1 && row[0] <= 95) row[0] = Math.max(1, Math.min(95, row[0] + d));
      }
    }
    redrawPattern();
  }
  $("pt-copy").addEventListener("click", copySel);
  $("pt-cut").addEventListener("click", function () { copySel(); clearSel(); });
  $("pt-paste").addEventListener("click", paste);
  $("pt-clear").addEventListener("click", clearSel);
  $("pt-up1").addEventListener("click", function () { transpose(1); });
  $("pt-down1").addEventListener("click", function () { transpose(-1); });
  $("pt-up12").addEventListener("click", function () { transpose(12); });
  $("pt-down12").addEventListener("click", function () { transpose(-12); });
  $("pt-ins").addEventListener("click", function () { shiftRows(true); });
  $("pt-delrow").addEventListener("click", function () { shiftRows(false); });

  // mouse and touch on the pattern
  var dragSel = null;
  function hit(e) {
    var el = document.elementFromPoint(e.clientX, e.clientY);
    var cell = el && el.closest && el.closest(".cell"), row = el && el.closest && el.closest(".prow");
    if (!cell || !row) return null;
    var f = el.closest("[data-f]");
    return { r: +row.getAttribute("data-r"), v: +cell.getAttribute("data-v"), f: f ? +f.getAttribute("data-f") : 0 };
  }
  $("pattern").addEventListener("pointerdown", function (e) {
    var h = hit(e); if (!h) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (E.playing() && st.follow) {
      st.follow = false; $("o-follow").checked = false;
      say("Follow the song is off, so the cursor stays where you edit.");
    }
    if (e.shiftKey && st.cur) {
      st.anchor = st.anchor || { r: st.cur.r, v: st.cur.v };
    } else { st.anchor = { r: h.r, v: h.v }; st.sel = null; }
    st.cur = { v: h.v, f: h.f, r: h.r };
    dragSel = e.pointerType === "mouse";
    if (e.shiftKey) st.sel = { r0: Math.min(st.anchor.r, h.r), r1: Math.max(st.anchor.r, h.r), v0: Math.min(st.anchor.v, h.v), v1: Math.max(st.anchor.v, h.v) };
    showCursor(false);
    $("pattern").focus({ preventScroll: true });
    e.preventDefault();
  });
  window.addEventListener("pointermove", function (e) {
    if (!dragSel || !(e.buttons & 1)) return;
    var h = hit(e); if (!h || !st.anchor) return;
    if (h.r === st.cur.r && h.v === st.cur.v) return;
    st.cur.r = h.r; st.cur.v = h.v; st.cur.f = h.f;
    st.sel = { r0: Math.min(st.anchor.r, h.r), r1: Math.max(st.anchor.r, h.r), v0: Math.min(st.anchor.v, h.v), v1: Math.max(st.anchor.v, h.v) };
    if (st.sel.r0 === st.sel.r1 && st.sel.v0 === st.sel.v1) st.sel = null;
    showCursor();
  });
  window.addEventListener("pointerup", function () { dragSel = null; });

  // keys in the pattern
  function patternKey(e) {
    var k = e.key, lower = k.length === 1 ? k.toLowerCase() : k, c = st.cur, ctrl = e.ctrlKey || e.metaKey;
    if (ctrl) {
      if (lower === "c") { copySel(); return true; }
      if (lower === "x") { copySel(); clearSel(); return true; }
      if (lower === "v") { paste(); return true; }
      if (lower === "a") { st.anchor = { r: 0, v: c.v }; st.sel = { r0: 0, r1: st.song.rows - 1, v0: c.v, v1: c.v }; showCursor(false); return true; }
      if (k === "ArrowLeft") { selectPos(st.pos - 1); return true; }
      if (k === "ArrowRight") { selectPos(st.pos + 1); return true; }
      if (k === "F1") { transpose(-1); return true; }
      if (k === "F2") { transpose(1); return true; }
      return false;
    }
    if (e.altKey) return false;
    switch (k) {
      case "ArrowUp": moveCur(-1, 0, 0, e.shiftKey); return true;
      case "ArrowDown": moveCur(1, 0, 0, e.shiftKey); return true;
      case "ArrowLeft": moveCur(0, e.shiftKey ? -1 : 0, e.shiftKey ? 0 : -1, e.shiftKey); return true;
      case "ArrowRight": moveCur(0, e.shiftKey ? 1 : 0, e.shiftKey ? 0 : 1, e.shiftKey); return true;
      case "PageUp": moveCur(-Math.min(16, c.r || st.song.rows), 0, 0, e.shiftKey); return true;
      case "PageDown": moveCur(Math.min(16, st.song.rows - 1 - c.r || 1), 0, 0, e.shiftKey); return true;
      case "Home": moveCur(-c.r, 0, 0, e.shiftKey); return true;
      case "End": moveCur(st.song.rows - 1 - c.r, 0, 0, e.shiftKey); return true;
      case "Tab": c.f = 0; moveCur(0, e.shiftKey ? -1 : 1, 0); return true;
      case "Delete": clearField(); return true;
      case "Insert": shiftRows(true); return true;
      case "Backspace": shiftRows(false); return true;
    }
    if (k === "[" || k === "]") { selectIns(st.ins + (k === "[" ? -1 : 1)); return true; }
    if (e.code === "NumpadMultiply" || e.code === "NumpadDivide") { setOctave(st.oct + (e.code === "NumpadMultiply" ? 1 : -1)); return true; }
    if (c.f === 0) {
      if (lower === "a" || lower === "1" || lower === "`" || lower === "^") { enterNote(S.NOTE_OFF); return true; }
      if (lower in NOTE_KEYS && !e.repeat) {
        var n = st.oct * 12 + NOTE_KEYS[lower] + 1;
        if (n < 1 || n > 95) return true;
        noteOn(lower, c.v, n);
        enterNote(n);
        return true;
      }
      if (lower in NOTE_KEYS) return true;
    } else if (k.length === 1 && HEX.indexOf(k.toUpperCase()) >= 0) {
      enterHex(HEX.indexOf(k.toUpperCase()));
      return true;
    }
    return false;
  }
  $("pattern").addEventListener("keydown", function (e) {
    if (patternKey(e)) { e.preventDefault(); e.stopPropagation(); }
  });
  $("pattern").addEventListener("keyup", function (e) {
    var lower = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    noteOff(lower);
  });
  $("pattern").addEventListener("blur", function () { Object.keys(st.held).forEach(noteOff); });

  // notes that sound while a key is held (when the song does not play)
  function noteOn(key, v, n) {
    if (E.playing()) return;
    st.held[key] = v;
    E.jam(st.song, v, n, st.ins);
  }
  function noteOff(key) {
    if (!(key in st.held)) return;
    var v = st.held[key];
    delete st.held[key];
    var still = Object.keys(st.held).some(function (k) { return st.held[k] === v; });
    if (!still) E.release(v);
  }

  // ---------------------------------------------------------------- octave, step, instrument choice
  function setOctave(o) {
    st.oct = Math.max(0, Math.min(7, o));
    $("o-oct").value = String(st.oct);
    buildPiano();
  }
  $("o-oct").innerHTML = [0, 1, 2, 3, 4, 5, 6, 7].map(function (o) { return '<option value="' + o + '">' + o + "</option>"; }).join("");
  $("o-oct").addEventListener("change", function () { setOctave(+$("o-oct").value); });
  $("o-step").addEventListener("change", function () { st.step = Math.max(0, Math.min(16, Math.round(+$("o-step").value) || 0)); $("o-step").value = st.step; });
  $("o-follow").addEventListener("change", function () { st.follow = $("o-follow").checked; });
  $("o-vol").addEventListener("input", function () { E.setVolume(+$("o-vol").value / 100); });

  // ---------------------------------------------------------------- instruments
  function curIns() { return st.song.instruments[st.ins - 1]; }
  function selectIns(n) {
    st.ins = Math.max(1, Math.min(st.song.instruments.length, n));
    renderInsList(); renderInsEdit();
  }
  function renderInsList() {
    var box = $("ins-list"), html = "";
    st.song.instruments.forEach(function (ins, i) {
      var on = i + 1 === st.ins;
      html += '<li><button type="button" data-i="' + (i + 1) + '" class="' + (on ? "on" : "") + '" aria-pressed="' + on + '"><b>' + hex(i + 1, 2) + "</b><span></span></button></li>";
    });
    box.innerHTML = html;
    box.querySelectorAll("button span").forEach(function (sp, i) { sp.textContent = st.song.instruments[i].name; });
    var on = box.querySelector(".on");
    if (on) { var r = on.getBoundingClientRect(), b = box.getBoundingClientRect(); if (r.top < b.top || r.bottom > b.bottom) box.scrollTop = on.parentNode.offsetTop - 4; }
    $("ins-new").disabled = $("ins-dup").disabled = st.song.instruments.length >= S.MAXINS;
    $("ins-del").disabled = st.song.instruments.length < 2;
  }
  $("ins-list").addEventListener("click", function (e) { var b = e.target.closest("[data-i]"); if (b) selectIns(+b.getAttribute("data-i")); });
  $("ins-new").addEventListener("click", function () {
    checkpoint("New instrument");
    st.song.instruments.push(S.newInstrument("Instrument " + hex(st.song.instruments.length + 1, 2)));
    st.ins = st.song.instruments.length; changed("ins");
  });
  $("ins-dup").addEventListener("click", function () {
    checkpoint("Copy instrument");
    var c = structuredClone(curIns()); c.name = (c.name + " copy").slice(0, 24);
    st.song.instruments.push(c);
    st.ins = st.song.instruments.length; changed("ins");
  });
  $("ins-del").addEventListener("click", function () {
    var s = st.song, k = st.ins;
    if (s.instruments.length < 2) return;
    checkpoint("Delete instrument");
    s.instruments.splice(k - 1, 1);
    // the rows that use instruments after it move down by one
    s.patterns.forEach(function (p) { p.forEach(function (r) { if (r[1] === k) r[1] = 0; else if (r[1] > k) r[1]--; }); });
    st.ins = Math.min(k, s.instruments.length);
    say("Instrument deleted. The rows that used it play without an instrument.");
    changed();
  });

  var ADS_MS = [2, 8, 16, 24, 38, 56, 68, 80, 100, 250, 500, 800, 1000, 3000, 5000, 8000];
  function drawEnvelope(ins) {
    var cv = $("ie-env"), g = cv.getContext("2d"), w = cv.width, h = cv.height;
    var a = ins.ad >> 4, d = ins.ad & 15, s = ins.sr >> 4, r = ins.sr & 15;
    g.fillStyle = "#0d1220"; g.fillRect(0, 0, w, h);
    // times on a square root scale, so short and long times both show
    var ta = Math.sqrt(ADS_MS[a]), td = Math.sqrt(ADS_MS[d] * 3), tr = Math.sqrt(ADS_MS[r] * 3), hold = 40;
    var k = (w - 12) / (ta + td + tr + hold), top = 6, bot = h - 6, lv = bot - (bot - top) * s / 15;
    var x0 = 6, x1 = x0 + ta * k, x2 = x1 + td * k, x3 = x2 + hold * k, x4 = x3 + tr * k;
    g.fillStyle = "rgba(120,105,196,0.35)"; g.strokeStyle = "#a99cf0"; g.lineWidth = 2;
    g.beginPath(); g.moveTo(x0, bot); g.lineTo(x1, top); g.lineTo(x2, lv); g.lineTo(x3, lv); g.lineTo(x4, bot); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = "#8590ad"; g.font = "10px sans-serif";
    g.fillText("gate off", Math.min(x3 + 4, w - 44), 12);
    g.fillStyle = "#3d4763"; g.fillRect(x3, 0, 1, h);
  }
  function renderInsEdit() {
    var ins = curIns();
    $("ie-num").textContent = hex(st.ins, 2);
    if (document.activeElement !== $("ie-name")) $("ie-name").value = ins.name;
    var adsr = [ins.ad >> 4, ins.ad & 15, ins.sr >> 4, ins.sr & 15];
    ["a", "d", "s", "r"].forEach(function (n, i) { $("ie-" + n).value = adsr[i]; $("ie-" + n + "-v").textContent = HEX[adsr[i]]; });
    drawEnvelope(ins);
    $("ie-hr").checked = ins.hr;
    [["ie-pw", ins.pw], ["ie-ps", ins.pspeed], ["ie-pmin", ins.pmin], ["ie-pmax", ins.pmax], ["ie-vdel", ins.vdel], ["ie-vspd", ins.vspd], ["ie-vdep", ins.vdep]]
      .forEach(function (f) { if (document.activeElement !== $(f[0])) $(f[0]).value = f[1]; });
    $("ie-filter").checked = ins.filter;
    $("ie-filt").hidden = !ins.filter;
    $("ie-flp").checked = !!(ins.ftype & 1); $("ie-fbp").checked = !!(ins.ftype & 2); $("ie-fhp").checked = !!(ins.ftype & 4);
    $("ie-fcut").value = ins.fcut; $("ie-fcut-v").textContent = ins.fcut;
    $("ie-fres").value = ins.fres; $("ie-fres-v").textContent = HEX[ins.fres];
    $("ie-fswp").value = ins.fsweep; $("ie-fswp-v").textContent = ins.fsweep;
    renderWave(ins);
  }
  function insEdit(label, fn, merge) {
    checkpoint(label + st.ins, merge !== false);
    fn(curIns());
    E.changed(st.song);
    clearTimeout(saveTimer); saveTimer = setTimeout(autosave, 700);
    renderInsEdit();
    renderSettings();
  }
  $("ie-name").addEventListener("input", function () {
    insEdit("name", function (i) { i.name = $("ie-name").value.slice(0, 24); });
    renderInsList();
  });
  ["a", "d", "s", "r"].forEach(function (n, k) {
    $("ie-" + n).addEventListener("input", function () {
      var v = +$("ie-" + n).value;
      insEdit("adsr", function (i) {
        if (k === 0) i.ad = (i.ad & 15) | (v << 4); else if (k === 1) i.ad = (i.ad & 0xF0) | v;
        else if (k === 2) i.sr = (i.sr & 15) | (v << 4); else i.sr = (i.sr & 0xF0) | v;
      });
    });
  });
  $("ie-hr").addEventListener("change", function () { insEdit("hr", function (i) { i.hr = $("ie-hr").checked; }, false); });
  [["ie-pw", "pw", 0, 4095], ["ie-ps", "pspeed", 0, 255], ["ie-pmin", "pmin", 0, 4095], ["ie-pmax", "pmax", 0, 4095],
    ["ie-vdel", "vdel", 0, 255], ["ie-vspd", "vspd", 0, 31], ["ie-vdep", "vdep", 0, 15]].forEach(function (f) {
    $(f[0]).addEventListener("change", function () {
      var v = Math.round(+$(f[0]).value);
      if (!isFinite(v)) { renderInsEdit(); return; }
      insEdit(f[1], function (i) { i[f[1]] = Math.max(f[2], Math.min(f[3], v)); }, false);
    });
  });
  $("ie-filter").addEventListener("change", function () { insEdit("filter", function (i) { i.filter = $("ie-filter").checked; }, false); });
  [["ie-flp", 1], ["ie-fbp", 2], ["ie-fhp", 4]].forEach(function (f) {
    $(f[0]).addEventListener("change", function () { insEdit("ftype", function (i) { i.ftype = $(f[0]).checked ? i.ftype | f[1] : i.ftype & ~f[1]; }, false); });
  });
  [["ie-fcut", "fcut"], ["ie-fres", "fres"], ["ie-fswp", "fsweep"]].forEach(function (f) {
    $(f[0]).addEventListener("input", function () { var v = +$(f[0]).value; insEdit(f[1], function (i) { i[f[1]] = v; }); });
  });

  // the wave program
  function noteOptions(sel) {
    var h = "";
    for (var n = 0; n < 95; n++) h += '<option value="' + n + '"' + (n === sel ? " selected" : "") + ">" + S.noteName(n + 1) + "</option>";
    return h;
  }
  function renderWave(ins) {
    var box = $("ie-wave"), html = "";
    ins.wave.forEach(function (w, k) {
      var base = w.w === 0 ? 0 : (w.w >> 4) || 16;
      html += '<div class="wstep" data-k="' + k + '"><span class="wn">' + (k + 1) + "</span><div class=\"wctl\">" +
        '<select data-w="wave" aria-label="Waveform of step ' + (k + 1) + '">' + WAVES.map(function (o) {
          return '<option value="' + o[0] + '"' + (o[0] === base ? " selected" : "") + ">" + o[1] + "</option>";
        }).join("") + "</select>" +
        '<span class="wbits">' + [[2, "S", "Sync"], [4, "R", "Ring modulation"], [8, "T", "Test bit"]].map(function (b) {
          return '<button type="button" class="wbit" data-w="bit" data-b="' + b[0] + '" aria-pressed="' + !!(w.w & b[0]) + '" title="' + b[2] + '"' + (w.w === 0 ? " disabled" : "") + ">" + b[1] + "</button>";
        }).join("") + "</span>" +
        '<select data-w="mode" aria-label="Note of step ' + (k + 1) + '"><option value="rel"' + (w.abs ? "" : " selected") + '>note +</option><option value="abs"' + (w.abs ? " selected" : "") + ">fixed</option></select>" +
        (w.abs ? '<select data-w="abs" aria-label="Fixed note">' + noteOptions(w.n) + "</select>"
          : '<input type="number" min="-64" max="63" value="' + w.n + '" data-w="rel" aria-label="Semitones">') +
        "</div>" +
        '<button type="button" class="icon-btn remove" data-w="del" aria-label="Remove step ' + (k + 1) + '" title="Remove the step"' + (ins.wave.length < 2 ? " disabled" : "") + ">✕</button></div>";
    });
    box.innerHTML = html;
    var loop = $("ie-loop"), opts = '<option value="-1">stop</option>';
    ins.wave.forEach(function (w, k) { opts += '<option value="' + k + '">go to step ' + (k + 1) + "</option>"; });
    loop.innerHTML = opts;
    loop.value = String(ins.loop);
    $("ie-wadd").disabled = ins.wave.length >= 32;
  }
  $("ie-wave").addEventListener("change", function (e) {
    var el = e.target.closest("[data-w]"), row = e.target.closest("[data-k]");
    if (!el || !row) return;
    var k = +row.getAttribute("data-k"), what = el.getAttribute("data-w");
    insEdit("wave" + k + what, function (ins) {
      var w = ins.wave[k];
      if (what === "wave") {
        var b = +el.value;
        w.w = b === 0 ? 0 : b === 16 ? (w.w & 0x0E) || 0x08 : (b << 4) | (w.w & 0x0E);
      } else if (what === "mode") {
        w.abs = el.value === "abs";
        w.n = w.abs ? 48 : 0;
      } else if (what === "abs") w.n = +el.value;
      else if (what === "rel") w.n = Math.max(-64, Math.min(63, Math.round(+el.value) || 0));
    }, false);
  });
  $("ie-wave").addEventListener("click", function (e) {
    var el = e.target.closest("button[data-w]"), row = e.target.closest("[data-k]");
    if (!el || !row) return;
    var k = +row.getAttribute("data-k");
    if (el.getAttribute("data-w") === "bit") {
      var b = +el.getAttribute("data-b");
      insEdit("wbit", function (ins) {
        var w = ins.wave[k];
        w.w ^= b;
        if (!w.w) w.w = 0x08;      // all bits off: the test bit keeps the voice quiet
      }, false);
    } else if (el.getAttribute("data-w") === "del") {
      insEdit("wdel", function (ins) {
        ins.wave.splice(k, 1);
        if (ins.loop >= ins.wave.length) ins.loop = ins.wave.length - 1;
        else if (ins.loop > k) ins.loop--;
      }, false);
    }
  });
  $("ie-wadd").addEventListener("click", function () {
    insEdit("wadd", function (ins) {
      var last = ins.wave[ins.wave.length - 1];
      ins.wave.push({ w: last ? last.w || 0x41 : 0x41, n: 0, abs: false });
    }, false);
  });
  $("ie-loop").addEventListener("change", function () { insEdit("loop", function (ins) { ins.loop = +$("ie-loop").value; }, false); });

  // ---------------------------------------------------------------- on-screen keyboard
  var BLACK = { 1: 1, 3: 1, 6: 1, 8: 1, 10: 1 };
  function buildPiano() {
    var box = $("piano"), html = "", whites = 0, n, k;
    var total = window.innerWidth < 600 ? 13 : 25;
    for (k = 0; k < total; k++) if (!BLACK[k % 12]) whites++;
    var wi = 0;
    for (k = 0; k < total; k++) {
      n = st.oct * 12 + k + 1;
      if (n > 95) break;
      if (BLACK[k % 12]) {
        var left = (wi / whites) * 100 - (100 / whites) * 0.32;
        html += '<button type="button" class="pk black" data-n="' + n + '" style="left:' + left + "%;width:" + (100 / whites) * 0.64 + '%" aria-label="' + S.noteName(n) + '" tabindex="-1"></button>';
      } else {
        html += '<button type="button" class="pk' + (k % 12 === 0 ? " c-key" : "") + '" data-n="' + n + '" aria-label="' + S.noteName(n) + '" tabindex="-1">' + (k % 12 === 0 ? "C" + (st.oct + k / 12) : "") + "</button>";
        wi++;
      }
    }
    box.innerHTML = html;
  }
  var pianoDown = null;
  function pianoPress(el) {
    if (!el || !el.hasAttribute("data-n")) return;
    if (pianoDown === el) return;
    if (pianoDown) pianoDown.classList.remove("down");
    pianoDown = el;
    el.classList.add("down");
    var n = +el.getAttribute("data-n");
    if (!E.playing()) E.jam(st.song, st.cur.v, n, st.ins);
    if ($("k-write").checked) enterNote(n);
  }
  function pianoRelease() {
    if (!pianoDown) return;
    pianoDown.classList.remove("down");
    pianoDown = null;
    if (!E.playing()) E.release(st.cur.v);
  }
  $("piano").addEventListener("pointerdown", function (e) {
    e.preventDefault();
    $("piano").setPointerCapture(e.pointerId);
    pianoPress(e.target.closest(".pk"));
  });
  $("piano").addEventListener("pointermove", function (e) {
    if (!pianoDown) return;
    var el = document.elementFromPoint(e.clientX, e.clientY);
    pianoPress(el && el.closest && el.closest(".pk"));
  });
  $("piano").addEventListener("pointerup", pianoRelease);
  $("piano").addEventListener("pointercancel", pianoRelease);

  // keys for touch screens
  function buildHexpad() {
    var keys = HEX.split("").map(function (h) { return [h, h]; }).concat([["off", "==="], ["del", "Del"], ["ins", "Ins"], ["bs", "⌫"], ["up", "↑"], ["down", "↓"], ["left", "←"], ["right", "→"]]);
    $("hexpad").innerHTML = keys.map(function (k) { return '<button type="button" class="btn sm" data-hk="' + k[0] + '">' + k[1] + "</button>"; }).join("");
  }
  $("hexpad").addEventListener("click", function (e) {
    var b = e.target.closest("[data-hk]"); if (!b) return;
    var k = b.getAttribute("data-hk"), c = st.cur;
    if (k.length === 1) { if (c.f === 0) { message("Choose a column right of the note to type numbers."); return; } enterHex(HEX.indexOf(k)); }
    else if (k === "off") { c.f = 0; enterNote(S.NOTE_OFF); }
    else if (k === "del") clearField();
    else if (k === "ins") shiftRows(true);
    else if (k === "bs") shiftRows(false);
    else if (k === "up") moveCur(-1, 0, 0);
    else if (k === "down") moveCur(1, 0, 0);
    else if (k === "left") moveCur(0, 0, -1);
    else if (k === "right") moveCur(0, 0, 1);
  });

  // ---------------------------------------------------------------- playing
  function updateTransport() {
    $("b-play").setAttribute("aria-pressed", "false");
    $("b-loop").setAttribute("aria-pressed", E.mode === "pattern" ? "true" : "false");
    $("b-playhere").setAttribute("aria-pressed", E.mode === "song" ? "true" : "false");
    if (!E.playing()) {
      markPlayRow(-1);
      $("order").querySelectorAll(".play").forEach(function (el) { el.classList.remove("play"); });
    }
  }
  function play(how) {
    Object.keys(st.held).forEach(noteOff);
    E.setModel(st.song.model);
    E.play(st.song, how).then(updateTransport).catch(function (e) { message(e.message || String(e), true); });
  }
  $("b-play").addEventListener("click", function () { play({ pos: 0, row: 0 }); });
  $("b-playhere").addEventListener("click", function () { play({ pos: st.pos, row: st.cur.r }); });
  $("b-loop").addEventListener("click", function () { play({ pos: st.pos, row: 0, pattern: true }); });
  $("b-stop").addEventListener("click", function () { E.stop(); updateTransport(); });
  function markPlayRow(r) {
    if (st.playRow === r) return;
    var old = st.rowEls[st.playRow];
    if (old) old.classList.remove("play");
    st.playRow = r;
    var el = st.rowEls[r];
    if (el) el.classList.add("play");
  }
  var lastShown = { pos: -1, row: -1 };
  function frame() {
    requestAnimationFrame(frame);
    drawScopes();
    var p = E.position();
    if (!p) return;
    if (p.pos !== lastShown.pos || p.row !== lastShown.row) {
      $("w-pos").textContent = hex(p.pos, 2);
      $("w-row").textContent = hex(p.row, 2);
      if (p.pos !== lastShown.pos) {
        var rows = $("order").children;
        for (var i = 0; i < rows.length; i++) rows[i].classList.toggle("play", i === p.pos);
      }
      lastShown = { pos: p.pos, row: p.row };
      if (st.follow && p.pos !== st.pos && p.pos < st.song.order.length) {
        st.pos = p.pos; st.dirtyPattern = true; st.sel = null;
        renderOrder(); renderPattern();
      }
      if (p.pos === st.pos) {
        markPlayRow(p.row);
        if (st.follow) {
          st.cur.r = Math.min(p.row, st.song.rows - 1);
          showCursor(false);
          scrollToRow(st.cur.r, true);
        }
      } else markPlayRow(-1);
    }
  }

  // ---------------------------------------------------------------- files
  $("btn-new").addEventListener("click", function () {
    E.stop();
    checkpoint("New song");
    st.song = Demo.fresh();
    afterLoad();
    say("A new song. Undo brings the old one back.");
  });
  $("btn-demo").addEventListener("click", function () {
    E.stop();
    checkpoint("Demo song");
    st.song = Demo.demo();
    afterLoad();
    say("The demo song. Undo brings your song back.");
  });
  $("btn-save").addEventListener("click", saveSong);
  function saveSong() { download(fileBase() + ".json", S.toJSON(st.song), "application/json"); say("Song saved as a file"); }
  $("btn-open").addEventListener("click", function () { $("file-open").click(); });
  $("file-open").addEventListener("change", function () {
    var f = $("file-open").files[0];
    if (f) openFile(f);
    $("file-open").value = "";
  });
  function openFile(f) {
    f.text().then(function (t) {
      var s = S.fromJSON(t);
      E.stop();
      checkpoint("Open");
      st.song = s;
      afterLoad();
      say("Opened " + f.name);
    }).catch(function (e) { message(e.message || "This file could not be read.", true); });
  }
  document.addEventListener("dragover", function (e) { e.preventDefault(); document.body.classList.add("dragging"); });
  document.addEventListener("dragleave", function (e) { if (!e.relatedTarget) document.body.classList.remove("dragging"); });
  document.addEventListener("drop", function (e) {
    e.preventDefault(); document.body.classList.remove("dragging");
    var f = e.dataTransfer.files[0]; if (f) openFile(f);
  });

  // export
  $("btn-export").addEventListener("click", function () {
    var b;
    try { b = B.build(st.song); } catch (e) { message(e.message, true); return; }
    $("ex-prg-hint").textContent = "Loads at $" + hex(b.load, 4) + ". JSR $" + hex(b.init, 4) + " once to start the song, then JSR $" + hex(b.play, 4) +
      (st.song.multi > 1 ? " " + st.song.multi + " times a frame (with a CIA timer)." : " once a frame.") + " The player uses no zero page.";
    $("ex-msg").hidden = true;
    $("dlg-export").showModal();
  });
  function exMsg(text, err) { var m = $("ex-msg"); m.hidden = !text; m.textContent = text; m.classList.toggle("error", !!err); }
  function exportFile(ext, fn) {
    try { download(fileBase() + ext, fn(st.song)); exMsg(""); } catch (e) { exMsg(e.message, true); }
  }
  $("ex-sid").addEventListener("click", function () { exportFile(".sid", B.psid); });
  $("ex-prg").addEventListener("click", function () { exportFile("-music.prg", B.prg); });
  $("ex-run").addEventListener("click", function () { exportFile(".prg", B.runnable); });
  $("ex-wav").addEventListener("click", function () {
    var prog = $("ex-prog"), btn = $("ex-wav");
    btn.disabled = true; prog.hidden = false; prog.removeAttribute("value");
    exMsg("Making the sound file …");
    E.renderWav(st.song, +$("ex-wavlen").value, function (sec) { exMsg("Making the sound file … " + Math.floor(sec) + " s"); })
      .then(function (data) { download(fileBase() + ".wav", data, "audio/wav"); exMsg(""); })
      .catch(function (e) { exMsg(e.message || String(e), true); })
      .then(function () { btn.disabled = false; prog.hidden = true; });
  });

  // ---------------------------------------------------------------- global keys
  document.addEventListener("keydown", function (e) {
    var t = e.target, typing = t && (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA");
    var ctrl = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
    if (ctrl && k === "s") { e.preventDefault(); saveSong(); return; }
    if (typing) return;
    if (ctrl && (k === "z" || k === "y")) {
      e.preventDefault();
      if (k === "y" || e.shiftKey) hist.redo(); else hist.undo();
      return;
    }
    if (e.key === "F5") { e.preventDefault(); $("b-play").click(); return; }
    if (e.key === "F6") { e.preventDefault(); $("b-playhere").click(); return; }
    if (e.key === "F7") { e.preventDefault(); $("b-loop").click(); return; }
    if (e.key === "F8" || e.key === "Escape") { if (E.mode !== "off") { e.preventDefault(); E.stop(); updateTransport(); } return; }
    if (e.key === " " && !ctrl && (t === document.body || t.id === "pattern" || t.id === "order" || t.closest(".transport"))) {
      e.preventDefault();
      if (E.playing()) { E.stop(); updateTransport(); } else $("b-playhere").click();
    }
  });
  $("btn-undo").addEventListener("click", function () { hist.undo(); });
  $("btn-redo").addEventListener("click", function () { hist.redo(); });

  // ---------------------------------------------------------------- start
  function renderAll(what) {
    if (what === "info") { renderSettings(); return; }
    if (st.pos >= st.song.order.length) st.pos = st.song.order.length - 1;
    if (st.ins > st.song.instruments.length) st.ins = st.song.instruments.length;
    if (st.cur.r >= st.song.rows) st.cur.r = st.song.rows - 1;
    renderSettings();
    renderOrder();
    if (what !== "ins") renderPattern();
    renderInsList();
    renderInsEdit();
  }
  function afterLoad() {
    st.pos = Math.min(st.pos, st.song.order.length - 1);
    st.ins = Math.max(1, Math.min(st.ins, st.song.instruments.length));
    st.sel = null; st.dirtyPattern = true;
    E.setModel(st.song.model);
    E.changed(st.song);
    renderAll();
    clearTimeout(saveTimer); saveTimer = setTimeout(autosave, 700);
  }
  function restore() {
    try {
      var t = localStorage.getItem(KEY);
      if (t) return S.fromJSON(t);
    } catch (e) { /* ignore */ }
    return null;
  }

  if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) {
    document.body.classList.add("touch");
    $("k-write").checked = true;
  } else $("k-write").checked = false;
  st.song = restore() || Demo.demo();
  buildVoices();
  buildHexpad();
  setOctave(3);
  updateUndo();
  renderAll();
  var lastW = window.innerWidth;
  window.addEventListener("resize", function () { if ((window.innerWidth < 600) !== (lastW < 600)) buildPiano(); lastW = window.innerWidth; });
  requestAnimationFrame(frame);
})();
