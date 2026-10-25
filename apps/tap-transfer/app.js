/* C64 Tape Transfer: user interface (TAP logic in /assets/js/tap.js, protocol in tapeadapter.js) */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const UNIT = TAP.UNIT, CLOCK = TAP.PAL_CLOCK;

  /* ---------- Pulse store (grows while reading) ---------- */

  class PulseStore {
    constructor(pulses) {
      this.n = 0;
      this.buf = new Uint32Array(Math.max(1024, pulses ? pulses.length : 0));
      this.time = new Float64Array(this.buf.length + 1);      // cycles before pulse i
      this.hist = new Uint32Array(256);
      if (pulses) this.append(pulses);
    }
    append(arr) {
      if (this.n + arr.length > this.buf.length) {
        const cap = Math.max(this.buf.length * 2, this.n + arr.length);
        const b = new Uint32Array(cap); b.set(this.buf.subarray(0, this.n)); this.buf = b;
        const t = new Float64Array(cap + 1); t.set(this.time.subarray(0, this.n + 1)); this.time = t;
      }
      for (const c of arr) {
        this.buf[this.n] = c;
        this.time[this.n + 1] = this.time[this.n] + c;
        const u = Math.round(c / UNIT);
        if (u < 256) this.hist[u]++;
        this.n++;
      }
    }
    get pulses() { return this.buf.subarray(0, this.n); }
    seconds(i) { return this.time[Math.min(i, this.n)] / CLOCK; }
  }

  /* ---------- State ---------- */

  const state = {
    port: null, adapter: null, kind: "", version: "", busy: false,
    tape: null,          // { name, store, blocks, classes, source }
    optimized: null,     // { store, blocks, classes, report }
    show: "original",
  };
  const shown = () => (state.show === "optimized" && state.optimized ? state.optimized : state.tape);

  /* ---------- Log, prompt ---------- */

  function log(text, isError) {
    const li = document.createElement("li");
    if (isError) li.className = "error";
    const t = document.createElement("time");
    t.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    li.append(t, text);
    $("log").append(li);
    $("log").scrollTop = $("log").scrollHeight;
  }

  function prompt(main, sub, kind) {
    const p = $("prompt");
    p.hidden = !main;
    p.className = "prompt" + (kind ? " " + kind : "");
    $("prompt-main").textContent = main || "";
    $("prompt-sub").textContent = sub || "";
  }

  const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const hex = (v) => "0x" + v.toString(16).toUpperCase().padStart(2, "0");

  /* ---------- Classes per pulse (for colors) ---------- */

  // 0 other, 1 pilot, 2 header, 3 data, 4 damaged
  function classesFor(n, blocks) {
    const c = new Uint8Array(n);
    for (const b of blocks) {
      c.fill(1, b.pilot, b.sync);
      c.fill(!b.checksumOk ? 4 : b.kind === "header" ? 2 : 3, b.sync, b.end);
      c.fill(1, b.end, b.trailerEnd);
    }
    return c;
  }

  /* ---------- Pulse scope ---------- */

  const YMAX = 0x80;                                   // highest TAP value shown
  const COLORS = [[207, 216, 207], [125, 154, 132], [157, 146, 242], [95, 211, 107], [255, 90, 95], [255, 200, 60]];

  const scope = {
    canvas: $("scope"), over: $("overview"),
    a: 0, b: 1000, follow: true, cursor: -1, pending: false, overCache: null, overN: -1,

    data() { return shown(); },
    size(c) {
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(100, Math.round(c.clientWidth * dpr)), h = Math.round(c.clientHeight * dpr);
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      return [w, h, dpr];
    },
    request() {
      if (this.pending) return;
      this.pending = true;
      requestAnimationFrame(() => { this.pending = false; this.draw(); });
    },
    clamp() {
      const d = this.data();
      const n = d ? d.store.n : 0;
      const span = Math.max(40, this.b - this.a);
      if (this.follow && state.busy) {
        this.b = Math.max(n, span); this.a = this.b - span;
      } else {
        if (this.a < 0) this.a = 0;
        this.b = this.a + span;
        if (n && this.b > n) { this.a = Math.max(0, n - span); this.b = this.a + span; }
      }
    },
    fit() {
      const d = this.data();
      this.a = 0; this.b = d ? Math.max(40, d.store.n) : 1000;
      this.request();
    },
    zoom(f, at) {
      const span = this.b - this.a;
      const center = at === undefined ? this.a + span / 2 : at;
      const ns = Math.max(40, span * f);
      const rel = (center - this.a) / span;
      this.a = center - ns * rel; this.b = this.a + ns;
      this.follow = false; $("follow").checked = false;
      this.request();
    },
    show(from, to) {
      const pad = (to - from) * 0.05;
      this.a = Math.max(0, from - pad); this.b = to + pad;
      this.follow = false; $("follow").checked = false;
      this.request();
    },

    draw() {
      const [w, h, dpr] = this.size(this.canvas);
      const ctx = this.canvas.getContext("2d");
      ctx.fillStyle = "#101512";
      ctx.fillRect(0, 0, w, h);
      const d = this.data();
      this.grid(ctx, w, h, dpr);
      if (!d || !d.store.n) { this.drawOverview(); return; }
      this.clamp();
      const p = d.store.buf, cls = d.classes;
      const a = Math.floor(this.a), b = Math.ceil(Math.min(this.b, d.store.n));
      const span = this.b - this.a;
      const img = ctx.getImageData(0, 0, w, h);
      const px = img.data;
      const plotH = h - 18 * dpr;                      // room for the time axis
      const yOf = (c) => Math.round(plotH - 2 - Math.min(c / UNIT, YMAX) / YMAX * (plotH - 6));
      const dot = span < w / 3 ? Math.max(2, Math.round(2 * dpr)) : 1;
      // count hits per pixel and keep the most important class
      const hits = new Uint16Array(w * h), kind = new Uint8Array(w * h);
      const PRIO = [0, 1, 2, 3, 5, 4];                 // damaged above everything, pauses next
      for (let i = a; i < b; i++) {
        const x = Math.floor((i - this.a) / span * w);
        if (x < 0 || x >= w) continue;
        const y = yOf(p[i]);
        const k = p[i] / UNIT > YMAX ? 5 : cls && cls.length > i ? cls[i] : 0;
        for (let dx = 0; dx < dot; dx++) for (let dy = 0; dy < dot; dy++) {
          const xx = x + dx, yy = y - dy;
          if (xx >= w || yy < 0) continue;
          const o = yy * w + xx;
          if (hits[o] < 65535) hits[o]++;
          if (PRIO[k] > PRIO[kind[o]]) kind[o] = k;
        }
      }
      for (let o = 0; o < hits.length; o++) {
        if (!hits[o]) continue;
        const col = COLORS[kind[o]];
        const f = Math.min(1, 0.45 + 0.18 * Math.log2(hits[o]));
        px[o * 4] = col[0] * f; px[o * 4 + 1] = col[1] * f; px[o * 4 + 2] = col[2] * f;
      }
      ctx.putImageData(img, 0, 0);
      // write position
      if (this.cursor >= 0 && this.cursor >= this.a && this.cursor <= this.b) {
        const x = (this.cursor - this.a) / span * w;
        ctx.fillStyle = "#edf171";
        ctx.fillRect(Math.round(x), 0, Math.max(1, Math.round(dpr)), plotH);
      }
      // time axis
      ctx.fillStyle = "#8aa092";
      ctx.font = `${11 * dpr}px Chivo, Arial, sans-serif`;
      ctx.textBaseline = "bottom";
      ctx.textAlign = "left";
      ctx.fillText(mmss(d.store.seconds(a)), 4 * dpr, h - 2 * dpr);
      ctx.textAlign = "right";
      ctx.fillText(mmss(d.store.seconds(b)), w - 4 * dpr, h - 2 * dpr);
      ctx.textAlign = "center";
      ctx.fillText(`pulses ${a.toLocaleString("en")} to ${b.toLocaleString("en")}`, w / 2, h - 2 * dpr);
      this.drawOverview();
    },

    grid(ctx, w, h, dpr) {
      const plotH = h - 18 * dpr;
      const yOf = (u) => Math.round(plotH - 2 - u / YMAX * (plotH - 6));
      ctx.font = `${10 * dpr}px Chivo, Arial, sans-serif`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "right";
      for (const u of [0x20, 0x40, 0x60, 0x80]) {
        ctx.fillStyle = "#233028";
        ctx.fillRect(0, yOf(u), w, Math.max(1, Math.round(dpr)));
        ctx.fillStyle = "#62786a";
        ctx.fillText(hex(u), w - 3 * dpr, yOf(u) + 7 * dpr);
      }
      // ideal ROM loader pulses
      ctx.setLineDash([4 * dpr, 6 * dpr]);
      ctx.strokeStyle = "#3e5a48";
      ctx.lineWidth = dpr;
      ctx.textAlign = "left";
      for (const [k, u] of Object.entries(TAP.IDEAL)) {
        ctx.beginPath(); ctx.moveTo(0, yOf(u) + 0.5); ctx.lineTo(w, yOf(u) + 0.5); ctx.stroke();
        ctx.fillStyle = "#62786a";
        ctx.fillText(k, 3 * dpr, yOf(u) - 6 * dpr);
      }
      ctx.setLineDash([]);
    },

    drawOverview() {
      const [w, h] = this.size(this.over);
      const ctx = this.over.getContext("2d");
      const d = this.data();
      ctx.fillStyle = "#0b0f0c";
      ctx.fillRect(0, 0, w, h);
      if (!d || !d.store.n) return;
      const n = d.store.n;
      // cache the overview image; while reading, refresh at most every second
      const now = performance.now();
      if (!this.overCache || this.overCache.d !== d || this.overCache.w !== w || (this.overN !== n && now - this.overCache.at > 1000)) {
        const img = ctx.createImageData(w, h);
        const px = img.data;
        const p = d.store.buf, cls = d.classes;
        for (let i = 0; i < n; i++) {
          const x = Math.floor(i / n * w);
          const y = Math.round(h - 2 - Math.min(p[i] / UNIT, YMAX) / YMAX * (h - 4));
          const col = COLORS[cls && cls.length > i ? cls[i] : 0];
          const o = (y * w + x) * 4;
          px[o] = Math.max(px[o], col[0] * 0.85);
          px[o + 1] = Math.max(px[o + 1], col[1] * 0.85);
          px[o + 2] = Math.max(px[o + 2], col[2] * 0.85);
          px[o + 3] = 255;
        }
        this.overCache = { d, w, img, at: now };
        this.overN = n;
      }
      ctx.putImageData(this.overCache.img, 0, 0);
      const span = this.overN;
      ctx.strokeStyle = "#edf171";
      ctx.lineWidth = 1.5;
      const x0 = this.a / span * w, x1 = Math.min(this.b, span) / span * w;
      ctx.strokeRect(Math.max(0.75, x0), 0.75, Math.max(2, x1 - x0), h - 1.5);
    },

    indexAt(ev) {
      const r = this.canvas.getBoundingClientRect();
      return Math.floor(this.a + (ev.clientX - r.left) / r.width * (this.b - this.a));
    },
  };

  // Scope interaction: wheel zoom, drag to pan, hover info, keys
  let drag = null;
  scope.canvas.addEventListener("wheel", (ev) => {
    ev.preventDefault();
    scope.zoom(ev.deltaY > 0 ? 1.25 : 0.8, scope.indexAt(ev));
  }, { passive: false });
  scope.canvas.addEventListener("pointerdown", (ev) => {
    drag = { x: ev.clientX, a: scope.a, b: scope.b };
    scope.canvas.setPointerCapture(ev.pointerId);
  });
  scope.canvas.addEventListener("pointermove", (ev) => {
    if (drag) {
      const r = scope.canvas.getBoundingClientRect();
      const shift = (ev.clientX - drag.x) / r.width * (drag.b - drag.a);
      scope.a = drag.a - shift; scope.b = drag.b - shift;
      if (Math.abs(ev.clientX - drag.x) > 3) { scope.follow = false; $("follow").checked = false; }
      scope.request();
      return;
    }
    hoverInfo(scope.indexAt(ev));
  });
  scope.canvas.addEventListener("pointerup", () => { drag = null; });
  scope.canvas.addEventListener("keydown", (ev) => {
    const span = scope.b - scope.a;
    if (ev.key === "+" || ev.key === "=") scope.zoom(0.8);
    else if (ev.key === "-") scope.zoom(1.25);
    else if (ev.key === "ArrowRight") { scope.a += span * 0.2; scope.b += span * 0.2; scope.follow = false; scope.request(); }
    else if (ev.key === "ArrowLeft") { scope.a -= span * 0.2; scope.b -= span * 0.2; scope.follow = false; scope.request(); }
    else return;
    ev.preventDefault();
  });
  function overviewJump(ev) {
    const d = scope.data();
    if (!d) return;
    const r = scope.over.getBoundingClientRect();
    const center = (ev.clientX - r.left) / r.width * d.store.n;
    const span = scope.b - scope.a;
    scope.a = center - span / 2; scope.b = center + span / 2;
    scope.follow = false; $("follow").checked = false;
    scope.request();
  }
  let overDrag = false;
  scope.over.addEventListener("pointerdown", (ev) => { overDrag = true; scope.over.setPointerCapture(ev.pointerId); overviewJump(ev); });
  scope.over.addEventListener("pointermove", (ev) => { if (overDrag) overviewJump(ev); });
  scope.over.addEventListener("pointerup", () => { overDrag = false; });
  $("zoom-in").addEventListener("click", () => scope.zoom(0.5));
  $("zoom-out").addEventListener("click", () => scope.zoom(2));
  $("zoom-fit").addEventListener("click", () => { scope.follow = false; $("follow").checked = false; scope.fit(); });
  $("follow").addEventListener("change", (ev) => { scope.follow = ev.target.checked; scope.request(); });
  window.addEventListener("resize", () => { scope.overCache = null; scope.request(); drawHist(); });

  const KIND_TEXT = ["", "ROM loader pilot", "ROM loader header", "ROM loader data", "damaged ROM loader block"];
  function hoverInfo(i) {
    const d = scope.data();
    if (!d || i < 0 || i >= d.store.n) return;
    const c = d.store.buf[i];
    const u = c / UNIT;
    const len = u > 0xff ? `pause of ${(c / CLOCK * 1000).toFixed(1)} ms` : `${hex(Math.round(u))} (${Math.round(c / CLOCK * 1e6)} µs)`;
    const k = d.classes && d.classes[i] ? `, ${KIND_TEXT[d.classes[i]]}` : "";
    $("scope-info").textContent = `Pulse ${i.toLocaleString("en")} at ${mmss(d.store.seconds(i))}: ${len}${k}`;
  }

  /* ---------- Histogram ---------- */

  function drawHist() {
    const c = $("hist");
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(100, Math.round(c.clientWidth * dpr)), h = Math.round(c.clientHeight * dpr);
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#101512";
    ctx.fillRect(0, 0, w, h);
    const d = scope.data();
    if (!d || !d.store.n) { $("hist-info").textContent = ""; return; }
    const hist = d.store.hist;
    const axis = 16 * dpr;
    let max = 1;
    for (let u = 1; u < YMAX; u++) max = Math.max(max, hist[u]);
    const lmax = Math.log10(max + 1);
    const bw = w / YMAX;
    for (let u = 1; u < YMAX; u++) {
      if (!hist[u]) continue;
      const bh = Math.log10(hist[u] + 1) / lmax * (h - axis - 4 * dpr);
      ctx.fillStyle = Object.values(TAP.IDEAL).includes(u) ? "#9d92f2" : "#5fd36b";
      ctx.fillRect(u * bw, h - axis - bh, Math.max(1, bw - 1), bh);
    }
    ctx.fillStyle = "#8aa092";
    ctx.font = `${10 * dpr}px Chivo, Arial, sans-serif`;
    ctx.textBaseline = "bottom";
    ctx.textAlign = "center";
    for (let u = 0x10; u < YMAX; u += 0x10) ctx.fillText(hex(u), u * bw, h - 2 * dpr);
    // peaks
    const peaks = [];
    for (let u = 2; u < YMAX - 1; u++) if (hist[u] >= max * 0.05 && hist[u] >= hist[u - 1] && hist[u] > hist[u + 1]) peaks.push(u);
    const total = d.store.n;
    let pauses = 0;
    for (let i = 0; i < d.store.n; i++) if (d.store.buf[i] >= TAP.LONG) pauses++;
    $("hist-info").textContent = `${total.toLocaleString("en")} pulses, ${pauses} pauses. Most common lengths: ${peaks.slice(0, 6).map(hex).join(", ") || "none"}. Log scale; purple bars mark the ideal ROM loader lengths.`;
  }

  /* ---------- Tape contents ---------- */

  const FILE_TYPES = { 1: "BASIC program", 2: "SEQ data", 3: "Program", 4: "SEQ file", 5: "End of tape" };
  const petscii = (bytes) => Array.from(bytes, (b) => (b >= 0x20 && b < 0x5f ? String.fromCharCode(b) : b === 0xa0 ? " " : "?")).join("").replace(/\s+$/, "");

  function showContents() {
    const d = shown();
    const body = $("contents").querySelector("tbody");
    body.textContent = "";
    const blocks = d ? d.blocks : [];
    $("contents").hidden = !blocks.length;
    $("contents-empty").hidden = !!blocks.length;
    // One row per header with its data blocks; data without header gets its own row
    const rows = [];
    let cur = null;
    for (const b of blocks) {
      if (b.kind === "header") {
        if (cur && cur.header && cur.header.copy === 1 && b.copy === 2 && cur.header.payload.length === b.payload.length) { cur.headers.push(b); continue; }
        cur = { header: b, headers: [b], data: [] };
        rows.push(cur);
      } else {
        if (!cur || cur.data.length >= 2) { cur = { header: null, headers: [], data: [] }; rows.push(cur); }
        cur.data.push(b);
      }
    }
    for (const r of rows) {
      const tr = document.createElement("tr");
      tr.tabIndex = 0;
      const all = [...r.headers, ...r.data];
      const from = Math.min(...all.map((b) => b.pilot)), to = Math.max(...all.map((b) => b.trailerEnd));
      const h = r.headers.find((x) => x.checksumOk) || r.header;
      const okData = r.data.find((x) => x.checksumOk);
      const cell = (text, cls) => { const td = document.createElement("td"); td.textContent = text; if (cls) td.className = cls; tr.append(td); return td; };
      cell(mmss(d.store.seconds(from)));
      cell(h ? petscii(h.name) : "(no header)", "name");
      cell(h ? FILE_TYPES[h.type] || "?" : "Data");
      cell(h && h.type !== 5 ? `$${h.start.toString(16).toUpperCase().padStart(4, "0")}–$${h.endAddr.toString(16).toUpperCase().padStart(4, "0")}` : "");
      cell(r.data.length ? String((okData || r.data[0]).payload.length) : "");
      const copies = (list) => list.map((b) => (b.checksumOk ? "✓" : "✗")).join(" ");
      const anyOk = (list) => !list.length || list.some((b) => b.checksumOk);
      const good = anyOk(r.headers) && anyOk(r.data);
      const st = cell(`${good ? "OK" : "Damaged"}  ${r.headers.length ? "H " + copies(r.headers) : ""}${r.data.length ? "  D " + copies(r.data) : ""}`, good ? "ok" : "bad");
      st.title = "✓/✗ per copy: H = header, D = data. One good copy is enough to load the file.";
      const go = () => scope.show(from, to);
      tr.addEventListener("click", go);
      tr.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); go(); } });
      body.append(tr);
    }
  }

  /* ---------- Loading a tape into the app ---------- */

  function setTape(name, pulses, source, version) {
    const store = new PulseStore(pulses);
    const blocks = TAP.analyze(store.pulses);
    state.tape = { name, store, blocks, classes: classesFor(store.n, blocks), source, version };
    state.optimized = null;
    state.show = "original";
    $("show-which").value = "original";
    $("show-wrap").hidden = true;
    $("opt-report").hidden = true;
    $("btn-save-opt").hidden = true;
    $("tap-name").value = name;
    refresh();
    scope.fit();
  }

  function refresh() {
    showFacts();
    showContents();
    drawHist();
    scope.overCache = null;
    scope.request();
    updateControls();
  }

  function showFacts() {
    const t = state.tape;
    const dl = $("facts");
    dl.textContent = "";
    if (!t) { dl.innerHTML = "<dt>File</dt><dd>None yet</dd>"; return; }
    const ok = t.blocks.filter((b) => b.checksumOk).length;
    const rows = [
      ["Source", t.source],
      ["Pulses", t.store.n.toLocaleString("en")],
      ["Length", mmss(t.store.seconds(t.store.n))],
      ["ROM blocks", t.blocks.length ? `${t.blocks.length} found, ${ok} OK` : "none"],
    ];
    if (t.version !== undefined) rows.splice(1, 0, ["TAP version", String(t.version)]);
    for (const [k, v] of rows) {
      const dt = document.createElement("dt"); dt.textContent = k;
      const dd = document.createElement("dd"); dd.textContent = v;
      dl.append(dt, dd);
    }
  }

  /* ---------- Opening files ---------- */

  function openFile(file) {
    if (state.busy) return;
    file.arrayBuffer().then((buf) => {
      try {
        const tap = TAP.parse(new Uint8Array(buf));
        setTape(file.name, tap.pulses, "file", tap.version);
        log(`Opened ${file.name}: ${tap.pulses.length.toLocaleString("en")} pulses.`);
        if (!tap.sizeOk) log("The size in the file header does not match the file; the data was read anyway.", true);
        if (tap.machine !== 0) log("This TAP file is not marked as a C64 tape; the pulses are shown anyway.", true);
      } catch (err) {
        const msg = err.message === "signature" ? `“${file.name}” is not a TAP file (it does not start with C64-TAPE-RAW).`
          : err.message === "version" ? `“${file.name}” is a TAP version 2 file (C16/Plus4 half waves), which is not supported.`
          : `“${file.name}” could not be opened: ${err.message}`;
        log(msg, true);
        prompt("Cannot open file", msg, "error");
      }
    });
  }
  $("file-input").addEventListener("change", (ev) => { if (ev.target.files[0]) openFile(ev.target.files[0]); ev.target.value = ""; });
  const drop = $("drop");
  drop.addEventListener("dragover", (ev) => { ev.preventDefault(); drop.classList.add("dragging"); });
  drop.addEventListener("dragleave", () => drop.classList.remove("dragging"));
  drop.addEventListener("drop", (ev) => { ev.preventDefault(); drop.classList.remove("dragging"); if (ev.dataTransfer.files[0]) openFile(ev.dataTransfer.files[0]); });
  // Files dropped anywhere on the page
  window.addEventListener("dragover", (ev) => { if (ev.dataTransfer && [...ev.dataTransfer.types].includes("Files")) ev.preventDefault(); });
  window.addEventListener("drop", (ev) => {
    if (!ev.dataTransfer || !ev.dataTransfer.files.length || ev.defaultPrevented) return;
    ev.preventDefault();
    openFile(ev.dataTransfer.files[0]);
  });

  /* ---------- Saving ---------- */

  function tapName(suffix) {
    let n = $("tap-name").value.trim() || "tape.tap";
    if (!/\.tap$/i.test(n)) n += ".tap";
    return suffix ? n.replace(/\.tap$/i, suffix + ".tap") : n;
  }
  function download(bytes, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([bytes], { type: "application/octet-stream" }));
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  $("btn-save").addEventListener("click", () => download(TAP.build(state.tape.store.pulses), tapName()));
  $("btn-save-opt").addEventListener("click", () => download(TAP.build(state.optimized.store.pulses), tapName("_optimized")));

  /* ---------- Optimizing ---------- */

  $("btn-optimize").addEventListener("click", () => {
    const t = state.tape;
    const r = TAP.optimize(t.store.pulses, {
      glitches: $("opt-glitches").checked, pauses: $("opt-pauses").checked,
      cbm: $("opt-cbm").checked, repair: $("opt-cbm").checked, generic: $("opt-generic").checked,
    });
    const store = new PulseStore(r.pulses);
    const blocks = TAP.analyze(store.pulses);
    state.optimized = { store, blocks, classes: classesFor(store.n, blocks), report: r.report };
    state.show = "optimized";
    $("show-which").value = "optimized";
    $("show-wrap").hidden = false;
    $("btn-save-opt").hidden = false;
    const rep = r.report;
    const okBefore = t.blocks.filter((b) => b.checksumOk).length, okAfter = blocks.filter((b) => b.checksumOk).length;
    const items = [
      `${rep.glitches} glitches removed, ${rep.pauses} pause fragments joined.`,
      rep.cbmBlocks ? `ROM loader: ${rep.cbmBlocks} blocks, ${rep.cbmIdeal.toLocaleString("en")} pulses set to ideal lengths, ${rep.repaired} ${rep.repaired === 1 ? "block" : "blocks"} repaired from the second copy${rep.stillBad ? `, ${rep.stillBad} still damaged (left unchanged)` : ""}.` : "No ROM loader blocks found.",
      rep.clusterSegments ? `Other loaders: ${rep.snapped.toLocaleString("en")} pulses moved onto the center of their group in ${rep.clusterSegments} ${rep.clusterSegments === 1 ? "section" : "sections"}.` : "Other loaders: no section with clearly separated pulse groups.",
      `Readable ROM loader blocks: ${okBefore} before, ${okAfter} after.`,
    ];
    const ul = $("opt-report");
    ul.textContent = "";
    for (const it of items) { const li = document.createElement("li"); li.textContent = it; ul.append(li); }
    ul.hidden = false;
    log(`Optimized: ${rep.cbmIdeal + rep.snapped} pulses adjusted, ${rep.repaired} blocks repaired.`);
    refresh();
  });
  $("show-which").addEventListener("change", (ev) => { state.show = ev.target.value; refresh(); });

  /* ---------- Adapter ---------- */

  function updateControls() {
    const ready = !!state.adapter && !state.busy;
    $("btn-read").disabled = !ready;
    $("btn-write").disabled = !ready || !state.tape || !state.adapter.canWrite;
    $("btn-connect").disabled = state.busy || !navigator.serial;
    $("btn-connect").textContent = state.adapter ? "Disconnect" : "Connect adapter";
    $("adapter-kind").disabled = !!state.adapter;
    $("btn-optimize").disabled = !state.tape || state.busy;
    $("btn-save").disabled = !state.tape || state.busy;
    $("file-input").disabled = state.busy;
    const conn = $("conn");
    conn.classList.toggle("connected", !!state.adapter && !state.busy);
    conn.classList.toggle("busy", state.busy);
    $("conn-text").textContent = state.adapter ? `${state.kind} (firmware ${state.version || "?"})` : "Not connected";
    $("write-source").hidden = !state.optimized;
    $("write-intro").textContent = !state.tape ? "Open or read a TAP file first."
      : state.adapter && !state.adapter.canWrite ? "The TapeDump64 can only read tapes. Connect a TapeBuddy64 or DumpMaster64 to write."
      : `Writes “${state.tape.name}” (${mmss(state.tape.store.seconds(state.tape.store.n))}) to the tape.`;
  }

  const matches = (port) => {
    const i = port.getInfo ? port.getInfo() : {};
    return TAPE.USB_FILTERS.some((f) => f.usbVendorId === i.usbVendorId && f.usbProductId === i.usbProductId);
  };

  async function connectPort(port, quiet) {
    try {
      state.busy = true;
      updateControls();
      const { adapter, ident, version } = await TAPE.connect(port, $("adapter-kind").value);
      state.port = port; state.adapter = adapter; state.kind = adapter.kind; state.version = version;
      log(ident === adapter.kind ? `Found ${adapter.kind}, firmware ${version}.` : `Using the adapter as ${adapter.kind} (it answered “${ident || "nothing"}”).`);
      return true;
    } catch (err) {
      if (!quiet) {
        const msg = err instanceof TAPE.TapeError ? err.message
          : err && err.name === "NetworkError" ? "The port could not be opened. Close other programs that use the adapter and try again."
          : `Could not connect: ${err && err.message ? err.message : err}`;
        log(msg, true);
        prompt("Adapter not ready", msg, "error");
      }
      return false;
    } finally {
      state.busy = false;
      updateControls();
    }
  }

  $("btn-connect").addEventListener("click", async () => {
    if (state.adapter) {
      try { await state.adapter.link.close(); } catch (e) { /* ignore */ }
      state.adapter = null; state.port = null;
      log("Adapter disconnected.");
      updateControls();
      return;
    }
    let port;
    try { port = await navigator.serial.requestPort({ filters: TAPE.USB_FILTERS }); }
    catch (e) { prompt("No adapter chosen", "Plug in the adapter and choose it in the list your browser shows.", "error"); return; }
    prompt("");
    await connectPort(port, false);
  });

  async function autoConnect() {
    if (!navigator.serial) { $("unsupported").hidden = false; updateControls(); return; }
    navigator.serial.addEventListener("connect", (ev) => { if (!state.adapter && matches(ev.target)) connectPort(ev.target, true); });
    navigator.serial.addEventListener("disconnect", (ev) => {
      if (state.port && ev.target === state.port) {
        state.adapter = null; state.port = null; state.busy = false;
        log("The adapter was unplugged.", true);
        updateControls();
      }
    });
    for (const p of (await navigator.serial.getPorts()).filter(matches)) if (await connectPort(p, true)) return;
    updateControls();
  }

  /* ---------- Reading from tape ---------- */

  const ERRORS = {
    timeout: "The button was not pressed within 10 seconds.",
    noanswer: "The adapter did not answer. Check the cable and the UART switch.",
    disconnected: "The adapter was disconnected.",
    noend: "The adapter did not send its final report.",
    stalled: "The adapter stopped asking for data.",
    readonly: "This adapter can only read tapes.",
  };
  const errText = (err) => ERRORS[err.message] || err.message || String(err);

  $("btn-read").addEventListener("click", async () => {
    if (state.busy) return;
    state.busy = true;
    updateControls();
    const store = new PulseStore();
    state.tape = { name: "tape.tap", store, blocks: [], classes: null, source: `read with ${state.kind}`, version: state.adapter.wide ? 1 : 0 };
    state.optimized = null; state.show = "original";
    $("show-wrap").hidden = true; $("opt-report").hidden = true; $("btn-save-opt").hidden = true;
    scope.follow = true; $("follow").checked = true;
    scope.a = 0; scope.b = 20000;
    refresh();
    const start = performance.now();
    let lastUi = 0;
    try {
      log("Reading from tape.");
      prompt("PRESS PLAY ON TAPE", "Waiting for PLAY…");
      const r = await state.adapter.read({
        onWaiting: (s) => prompt("PRESS PLAY ON TAPE", `${s} seconds left`),
        onPlay: () => prompt("SEARCHING", "Waiting for the first pulses. Press STOP on the Datasette to finish."),
        onPulses: (arr) => {
          store.append(arr);
          const now = performance.now();
          if (now - lastUi > 250) {
            lastUi = now;
            prompt("LOADING", `${store.n.toLocaleString("en")} pulses, tape position ${mmss(store.seconds(store.n))}, reading for ${mmss((now - start) / 1000)}. Press STOP on the Datasette to finish.`);
            scope.request();
            drawHist();
            showFacts();
          }
        },
      });
      // Final analysis
      const blocks = TAP.analyze(store.pulses);
      state.tape.blocks = blocks;
      state.tape.classes = classesFor(store.n, blocks);
      const problems = [];
      if (r.overflow) problems.push("the adapter's buffer overflowed (pulses were lost)");
      if (!r.checksumOk) problems.push("the transfer checksum does not match");
      if (!store.n) problems.push("no pulses were received");
      if (problems.length) {
        prompt("READ WITH PROBLEMS", `${store.n.toLocaleString("en")} pulses, but ${problems.join(" and ")}. You can still save and inspect the result.`, "error");
        log(`Reading finished with problems: ${problems.join(", ")}.`, true);
      } else {
        prompt("PRESS STOP ON TAPE", `Done: ${store.n.toLocaleString("en")} pulses, ${mmss(store.seconds(store.n))} of tape, checksum OK. Optimize the result or save it.`, "done");
        log(`Read ${store.n.toLocaleString("en")} pulses, checksum OK.`);
      }
    } catch (err) {
      prompt("READING FAILED", errText(err), "error");
      log(errText(err), true);
      if (!store.n) state.tape = null;
    } finally {
      state.busy = false;
      scope.follow = false; $("follow").checked = false;
      refresh();
      scope.fit();
    }
  });

  /* ---------- Writing to tape ---------- */

  $("btn-write").addEventListener("click", async () => {
    if (state.busy) return;
    const which = document.querySelector('input[name="write-which"]:checked').value;
    const src = which === "optimized" && state.optimized ? state.optimized : state.tape;
    state.show = src === state.optimized ? "optimized" : "original";
    $("show-which").value = state.show;
    state.busy = true;
    updateControls();
    refresh();
    scope.a = 0; scope.b = Math.min(src.store.n, 20000);
    scope.follow = false;
    const total = src.store.seconds(src.store.n);
    try {
      log(`Writing ${state.tape.name}${src === state.optimized ? " (optimized)" : ""} to tape.`);
      prompt("PRESS RECORD & PLAY ON TAPE", "Waiting for RECORD…");
      let lastUi = 0;
      const r = await state.adapter.write(src.store.pulses, {
        onWaiting: (s) => prompt("PRESS RECORD & PLAY ON TAPE", `${s} seconds left`),
        onRecord: () => prompt("RECORDING", "Starting…"),
        onProgress: (i) => {
          scope.cursor = i;
          const now = performance.now();
          if (now - lastUi < 200) return;
          lastUi = now;
          // keep the write position in view
          const span = scope.b - scope.a;
          if (i > scope.a + span * 0.8 || i < scope.a) { scope.a = Math.max(0, i - span * 0.2); scope.b = scope.a + span; }
          prompt("RECORDING", `${mmss(src.store.seconds(i))} of ${mmss(total)} written. Do not stop the tape.`);
          scope.request();
        },
      });
      scope.cursor = -1;
      if (!r.complete || r.stopped) {
        prompt("RECORDING STOPPED", "The tape was stopped before everything was written.", "error");
        log("Recording stopped before the end.", true);
      } else if (r.underrun) {
        prompt("RECORDING DAMAGED", "The computer did not send data fast enough (buffer underrun). Try again and keep this tab in front.", "error");
        log("Buffer underrun while recording.", true);
      } else if (!r.checksumOk) {
        prompt("CHECKSUM ERROR", "The data arrived at the adapter with errors. Try again.", "error");
        log("Checksum mismatch while recording.", true);
      } else {
        prompt("PRESS STOP ON TAPE", `Done: ${mmss(total)} recorded, checksum OK.`, "done");
        log("Recording finished, checksum OK.");
      }
    } catch (err) {
      scope.cursor = -1;
      prompt("RECORDING FAILED", errText(err), "error");
      log(errText(err), true);
    } finally {
      state.busy = false;
      refresh();
    }
  });

  /* ---------- Tabs ---------- */

  const tabs = [...document.querySelectorAll('[role="tab"]')];
  function selectTab(tab) {
    for (const t of tabs) {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      $(t.getAttribute("aria-controls")).hidden = !on;
    }
  }
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => selectTab(t));
    t.addEventListener("keydown", (ev) => {
      const d = ev.key === "ArrowRight" ? 1 : ev.key === "ArrowLeft" ? -1 : 0;
      if (!d) return;
      const next = tabs[(i + d + tabs.length) % tabs.length];
      selectTab(next);
      next.focus();
    });
  });

  window.addEventListener("beforeunload", (ev) => { if (state.busy) { ev.preventDefault(); ev.returnValue = ""; } });

  updateControls();
  scope.request();
  drawHist();
  autoConnect();
})();
