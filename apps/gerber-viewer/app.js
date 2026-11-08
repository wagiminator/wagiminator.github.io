/* Gerber Viewer: user interface (parsing and drawing live in gerber.js) */
(function () {
  "use strict";

  const G = window.GERBER;
  const $ = (id) => document.getElementById(id);
  const app = document.querySelector(".app");
  const ui = {
    dropzone: $("dropzone"), fileInput: $("file-input"), preview: $("preview"), side: $("side"),
    error: $("error"), fileName: $("file-name"), openOther: $("open-other"),
    wrapTop: $("wrap-top"), wrapBottom: $("wrap-bottom"), busyTop: $("busy-top"), busyBottom: $("busy-bottom"),
    dlTop: $("download-top"), dlBottom: $("download-bottom"),
    mask: $("opt-mask"), dpi: $("opt-dpi"), imageSize: $("image-size"),
    layers: $("layers"), facts: $("facts"), warnings: $("warnings"),
  };

  const state = { files: [], board: null, base: "pcb", canvases: {}, job: 0 };
  const SHOWN = ["top-copper", "top-mask", "top-silk", "bottom-copper", "bottom-mask", "bottom-silk", "outline", "drill"];
  const TEXT_EXT = /\.(zip|pdf|png|jpe?g|gif|bmp|xlsx?|docx?|step|stp|wrl|3mf|stl)$/i;

  /* ---------- Options ---------- */

  for (const [key, c] of Object.entries(G.MASK_COLORS)) {
    const label = document.createElement("label");
    label.className = "swatch";
    label.innerHTML = `<input type="radio" name="opt-mask" value="${key}"${key === "green" ? " checked" : ""}>` +
      `<span class="chip" style="background: rgb(${c.bare.join(",")})"></span><span class="label">${c.name}</span>`;
    ui.mask.appendChild(label);
  }
  const opt = (name) => (document.querySelector(`input[name="${name}"]:checked`) || {}).value;

  ui.mask.addEventListener("change", () => {
    // JLCPCB: white solder mask with black silkscreen, all other colors with white silkscreen
    const silk = G.MASK_COLORS[opt("opt-mask")].silk;
    document.querySelector(`input[name="opt-silk"][value="${silk}"]`).checked = true;
    redraw();
  });
  for (const el of document.querySelectorAll('input[name="opt-silk"], input[name="opt-finish"]')) el.addEventListener("change", redraw);
  ui.dpi.addEventListener("change", () => { if (state.board) showImageSize(); });

  /* ---------- Loading files ---------- */

  ui.fileInput.addEventListener("change", () => {
    if (ui.fileInput.files.length) loadFiles([...ui.fileInput.files]);
    ui.fileInput.value = "";
  });
  ui.openOther.addEventListener("click", () => ui.fileInput.click());

  let dragDepth = 0;
  window.addEventListener("dragenter", (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault(); dragDepth++; setDragging(true);
  });
  window.addEventListener("dragover", (e) => { if (hasFiles(e)) e.preventDefault(); });
  window.addEventListener("dragleave", () => { if (--dragDepth <= 0) { dragDepth = 0; setDragging(false); } });
  window.addEventListener("drop", (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault(); dragDepth = 0; setDragging(false);
    if (e.dataTransfer.files.length) loadFiles([...e.dataTransfer.files]);
  });
  function hasFiles(e) { return e.dataTransfer && [...e.dataTransfer.types].includes("Files"); }
  function setDragging(on) {
    ui.dropzone.classList.toggle("dragging", on);
    document.body.classList.toggle("dragging", on && !!state.board);
  }

  async function loadFiles(list) {
    const files = [];
    try {
      for (const f of list) {
        const buf = await f.arrayBuffer();
        const u8 = new Uint8Array(buf);
        if (/\.zip$/i.test(f.name) || (u8[0] === 0x50 && u8[1] === 0x4b)) {
          let entries;
          try { entries = await G.unzip(buf); } catch (err) { throw new Error(`“${f.name}” is not a valid ZIP archive.`); }
          for (const e of entries) files.push({ name: e.name, data: e.data });
        } else files.push({ name: f.name, data: u8 });
      }
    } catch (err) {
      showError(err.message);
      return;
    }
    const decoder = new TextDecoder("latin1");
    state.files = files
      .filter((f) => !TEXT_EXT.test(f.name) && f.data.length < 64 * 1024 * 1024)
      .map((f) => {
        const text = decoder.decode(f.data);
        return { name: f.name, text, type: G.identify(f.name, text) };
      })
      .sort((a, b) => order(a.type) - order(b.type) || a.name.localeCompare(b.name));
    if (!state.files.some((f) => ["top-copper", "bottom-copper", "outline", "drill"].includes(f.type))) {
      showError(list.length === 1
        ? `No Gerber or drill files were found in “${list[0].name}”. Choose a ZIP archive with Gerber files or the Gerber files themselves.`
        : "No Gerber or drill files were found. Choose a ZIP archive with Gerber files or the Gerber files themselves.");
      return;
    }
    state.base = list.length === 1 ? list[0].name.replace(/\.[^.]+$/, "") : "pcb";
    ui.fileName.textContent = list.length === 1 ? list[0].name : `${list.length} files`;
    ui.error.hidden = true;
    showLayers();
    build();
  }

  function order(type) { const i = SHOWN.indexOf(type); return i < 0 ? 99 : i; }

  function showError(msg) {
    ui.error.textContent = msg;
    ui.error.hidden = false;
  }

  /* ---------- Layers ---------- */

  function showLayers() {
    ui.layers.textContent = "";
    state.files.forEach((f, i) => {
      const li = document.createElement("li");
      li.classList.toggle("unused", !SHOWN.includes(f.type));
      const name = document.createElement("span");
      name.className = "fname"; name.textContent = f.name;
      const sel = document.createElement("select");
      sel.setAttribute("aria-label", "Layer of " + f.name);
      for (const [key, label] of Object.entries(G.LAYERS)) {
        const o = document.createElement("option");
        o.value = key; o.textContent = label; o.selected = key === f.type;
        sel.appendChild(o);
      }
      sel.addEventListener("change", () => {
        state.files[i].type = sel.value;
        li.classList.toggle("unused", !SHOWN.includes(sel.value));
        build();
      });
      li.append(name, sel);
      ui.layers.appendChild(li);
    });
  }

  /* ---------- Board ---------- */

  function build() {
    setBusy(true);
    setTimeout(() => {
      try {
        state.board = G.buildBoard(state.files);
      } catch (err) {
        setBusy(false);
        showError("The files could not be read: " + err.message);
        return;
      }
      if (!state.board.bbox.valid()) {
        setBusy(false);
        showError("The files contain no drawing that could be shown. Check the layer assignment.");
        return;
      }
      app.classList.add("loaded");
      ui.dropzone.hidden = true;
      ui.preview.hidden = false;
      ui.side.hidden = false;
      showFacts();
      draw();
    }, 30);
  }

  function showFacts() {
    const b = state.board, bb = b.bbox;
    const w = bb.x1 - bb.x0, h = bb.y1 - bb.y0;
    const count = (t) => state.files.filter((f) => f.type === t).length;
    const rows = [
      ["Size", `${w.toFixed(2)} × ${h.toFixed(2)} mm`],
      ["Outline", b.noOutline ? "not found, extents used" : `${b.loops.length} contour${b.loops.length > 1 ? "s" : ""}`],
      ["Copper", [count("top-copper") && "top", count("bottom-copper") && "bottom"].filter(Boolean).join(", ") || "none"],
      ["Holes", b.holes.toLocaleString("en")],
      ["Files", `${state.files.length} (${state.files.filter((f) => SHOWN.includes(f.type)).length} shown)`],
    ];
    ui.facts.textContent = "";
    for (const [k, v] of rows) {
      const dt = document.createElement("dt"); dt.textContent = k;
      const dd = document.createElement("dd"); dd.textContent = v;
      ui.facts.append(dt, dd);
    }
    ui.warnings.textContent = "";
    for (const w of b.warnings.slice(0, 8)) { const li = document.createElement("li"); li.textContent = w; ui.warnings.appendChild(li); }
    ui.warnings.hidden = !b.warnings.length;
  }

  /* ---------- Drawing ---------- */

  let redrawTimer = 0;
  function redraw() {
    if (!state.board) return;
    clearTimeout(redrawTimer);
    redrawTimer = setTimeout(draw, 60);
  }

  function setBusy(on) {
    ui.busyTop.hidden = ui.busyBottom.hidden = !on;
    ui.dlTop.disabled = ui.dlBottom.disabled = on;
  }

  // Scale for the downloaded pictures (px per mm), limited to about 50 megapixels
  function downloadScale() {
    const b = state.board.bbox, w = b.x1 - b.x0, h = b.y1 - b.y0;
    let s = +ui.dpi.value / 25.4;
    const max = Math.sqrt(50e6 / Math.max(1, w * h));
    return Math.min(s, max);
  }

  function options() {
    return { mask: opt("opt-mask"), silk: opt("opt-silk"), finish: opt("opt-finish") };
  }

  function draw() {
    const job = ++state.job;
    setBusy(true);
    // The preview is drawn with about 1600 px on the long side, independent of the download resolution
    const b = state.board.bbox, long = Math.max(b.x1 - b.x0, b.y1 - b.y0);
    const scale = Math.max(4, Math.min(80, 1600 / long));
    setTimeout(() => {
      if (job !== state.job) return;
      try {
        for (const side of ["top", "bottom"]) {
          const c = G.render(state.board, Object.assign({ side, scale }, options()));
          c.setAttribute("role", "img");
          c.setAttribute("aria-label", `${side === "top" ? "Top" : "Bottom"} side of the board`);
          const wrap = side === "top" ? ui.wrapTop : ui.wrapBottom;
          const old = wrap.querySelector("canvas");
          if (old) old.replaceWith(c); else wrap.prepend(c);
          state.canvases[side] = c;
        }
        showImageSize();
      } catch (err) {
        showError("The board could not be drawn: " + err.message);
      }
      setBusy(false);
    }, 20);
  }

  function showImageSize() {
    const b = state.board.bbox, s = downloadScale();
    const w = Math.ceil((b.x1 - b.x0) * s), h = Math.ceil((b.y1 - b.y0) * s);
    const dpi = Math.round(s * 25.4);
    ui.imageSize.textContent = `Download size: ${w.toLocaleString("en")} × ${h.toLocaleString("en")} px` +
      (dpi < +ui.dpi.value ? ` (limited to ${dpi} dpi)` : "") + ", transparent background.";
  }

  /* ---------- Download ---------- */

  function download(side) {
    if (!state.board) return;
    setBusy(true);
    setTimeout(() => {
      let c;
      try {
        c = G.render(state.board, Object.assign({ side, scale: downloadScale() }, options()));
      } catch (err) {
        setBusy(false);
        showError("The picture could not be created: " + err.message);
        return;
      }
      c.toBlob((blob) => {
        setBusy(false);
        if (!blob) { showError("The picture is too large for this browser. Choose a lower resolution."); return; }
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${state.base}_${side}.png`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      }, "image/png");
    }, 30);
  }
  ui.dlTop.addEventListener("click", () => download("top"));
  ui.dlBottom.addEventListener("click", () => download("bottom"));
})();
