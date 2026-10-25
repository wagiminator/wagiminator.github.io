/* C64 Disk Viewer: user interface (parsing and drawing live in d64.js) */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const app = document.querySelector(".app");
  const ui = {
    dropzone: $("dropzone"), fileInput: $("file-input"), preview: $("preview"),
    side: $("side"), error: $("error"), fileName: $("file-name"),
    openOther: $("open-other"), wrap: $("canvas-wrap"), busy: $("busy"),
    hover: $("hover-info"), size: $("opt-size"), label: $("opt-label"),
    diskName: $("opt-diskname"), download: $("download"), legend: $("legend"),
    directory: $("directory"), clear: $("clear-highlight"), facts: $("facts"),
  };

  const state = { disk: null, fileName: "", highlight: -1, canvas: null, size: 2048, job: 0 };

  /* ---------- Loading files ---------- */

  ui.fileInput.addEventListener("change", () => {
    if (ui.fileInput.files[0]) loadFile(ui.fileInput.files[0]);
    ui.fileInput.value = "";
  });
  ui.openOther.addEventListener("click", () => ui.fileInput.click());

  // Accept drops anywhere on the page
  let dragDepth = 0;
  window.addEventListener("dragenter", (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth++;
    setDragging(true);
  });
  window.addEventListener("dragover", (e) => { if (hasFiles(e)) e.preventDefault(); });
  window.addEventListener("dragleave", () => { if (--dragDepth <= 0) { dragDepth = 0; setDragging(false); } });
  window.addEventListener("drop", (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth = 0;
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  });
  function hasFiles(e) { return e.dataTransfer && [...e.dataTransfer.types].includes("Files"); }
  function setDragging(on) {
    ui.dropzone.classList.toggle("dragging", on);
    document.body.classList.toggle("dragging", on && !!state.disk);
  }

  function loadFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      let disk;
      try {
        disk = D64.parse(reader.result);
      } catch (err) {
        showError(file.name, err);
        return;
      }
      ui.error.hidden = true;
      state.disk = disk;
      state.fileName = file.name;
      state.fileSize = file.size;
      state.highlight = -1;
      ui.label.value = file.name.toLowerCase();
      showDisk();
    };
    reader.onerror = () => showError(file.name, new Error("read"));
    reader.readAsArrayBuffer(file);
  }

  function showError(name, err) {
    let msg;
    if (err.message === "size") {
      const sizes = D64.FORMATS.map((f) => f[0].toLocaleString("en")).join(", ");
      msg = `“${name}” is not a D64 disk image. It has ${err.size.toLocaleString("en")} bytes; ` +
            `a D64 image has one of these sizes: ${sizes} bytes. Choose a different file.`;
    } else if (err.message === "read") {
      msg = `“${name}” could not be read. Check that the file is still there and try again.`;
    } else {
      msg = `“${name}” could not be opened: ${err.message}`;
    }
    ui.error.textContent = msg;
    ui.error.hidden = false;
  }

  /* ---------- Showing a disk ---------- */

  function showDisk() {
    const d = state.disk;
    app.classList.add("loaded");
    ui.dropzone.hidden = true;
    ui.preview.hidden = false;
    ui.side.hidden = false;
    ui.fileName.textContent = state.fileName;
    buildDirectory(d);
    buildLegend(d);
    buildFacts(d);
    redraw();
  }

  // Draw the disk. Rendering big images takes a moment, so let the
  // browser paint the "busy" note first, and drop outdated jobs.
  function redraw() {
    if (!state.disk) return;                       // options changed before a file was opened
    const job = ++state.job;
    ui.busy.hidden = false;
    ui.download.disabled = true;
    ui.wrap.classList.toggle("transparent", background() === "transparent");
    setTimeout(() => {
      if (job !== state.job) return;
      state.size = parseInt(ui.size.value, 10);
      const canvas = D64.render(state.disk, {
        size: state.size,
        background: background(),
        label: ui.label.value.trim(),
        diskName: ui.diskName.checked,
        highlight: state.highlight >= 0 ? new Set(state.disk.files[state.highlight].sectors) : null,
      });
      canvas.setAttribute("role", "img");
      canvas.setAttribute("aria-label", `Disk picture of ${state.fileName}`);
      canvas.addEventListener("mousemove", onHover);
      canvas.addEventListener("mouseleave", () => { ui.hover.textContent = "Point at the disk to see track, sector and file."; });
      if (state.canvas) state.canvas.replaceWith(canvas); else ui.wrap.appendChild(canvas);
      state.canvas = canvas;
      ui.busy.hidden = true;
      ui.download.disabled = false;
    }, 30);
  }

  function background() { return document.querySelector('input[name="opt-bg"]:checked').value; }

  ui.size.addEventListener("change", redraw);
  document.querySelectorAll('input[name="opt-bg"]').forEach((r) => r.addEventListener("change", redraw));
  ui.diskName.addEventListener("change", redraw);
  let labelTimer;
  ui.label.addEventListener("input", () => { clearTimeout(labelTimer); labelTimer = setTimeout(redraw, 400); });

  /* ---------- Hover: which sector is under the pointer? ---------- */

  const CATEGORY_TEXT = ["file data", "BAM / directory", "free", "read error", "not covered by BAM"];

  function onHover(e) {
    const c = state.canvas, d = state.disk;
    const x = (e.offsetX / c.clientWidth) * state.size;
    const y = (e.offsetY / c.clientHeight) * state.size;
    const hit = D64.hitTest(d, state.size, x, y);
    if (!hit) { ui.hover.textContent = "Point at the disk to see track, sector and file."; return; }
    const i = d.sectorIndex(hit.track, hit.sector);
    const owner = d.owner[i];
    let text = `Track ${hit.track}, sector ${hit.sector}: `;
    if (d.category[i] === 3) text += "read error";
    else if (owner >= 0) text += `“${d.files[owner].name}” (${d.files[owner].type})`;
    else text += CATEGORY_TEXT[d.category[i]];
    ui.hover.textContent = text;
  }

  /* ---------- Directory listing in C64 style ---------- */

  function buildDirectory(d) {
    ui.directory.textContent = "";
    const header = document.createElement("div");
    header.className = "c64-line";
    header.append("0 ");
    const rev = document.createElement("span");
    rev.className = "reverse";
    rev.textContent = `"${d.name.padEnd(16)}" ${d.id.padEnd(2)} ${d.dosType.padEnd(2)}`;
    header.append(rev);
    ui.directory.append(header);

    d.files.forEach((f, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "c64-file";
      b.setAttribute("aria-pressed", "false");
      b.textContent = String(f.blocks).padEnd(5) + `"${f.name}"`.padEnd(18) +
        (f.closed ? " " : "*") + f.type + (f.locked ? "<" : "");
      b.title = `${f.sectors.length} sectors on disk`;
      b.addEventListener("click", () => setHighlight(state.highlight === i ? -1 : i));
      ui.directory.append(b);
    });
    if (!d.files.length) {
      const empty = document.createElement("div");
      empty.className = "c64-line c64-empty";
      empty.textContent = "(NO FILES)";
      ui.directory.append(empty);
    }
    const free = document.createElement("div");
    free.className = "c64-line";
    free.textContent = `${d.blocksFree} BLOCKS FREE.`;
    ui.directory.append(free);
    ui.clear.hidden = true;
  }

  function setHighlight(i) {
    state.highlight = i;
    ui.directory.querySelectorAll(".c64-file").forEach((b, k) => b.setAttribute("aria-pressed", String(k === i)));
    ui.clear.hidden = i < 0;
    redraw();
  }
  ui.clear.addEventListener("click", () => setHighlight(-1));

  /* ---------- Legend and facts ---------- */

  function buildLegend(d) {
    const counts = new Array(D64.CATEGORY_KEYS.length).fill(0);
    for (const c of d.category) counts[c]++;
    ui.legend.textContent = "";
    D64.CATEGORY_KEYS.forEach((key, i) => {
      if (i >= 3 && !counts[i]) return;           // only show errors/unknown when present
      const p = D64.PALETTE[key];
      const li = document.createElement("li");
      const sw = document.createElement("span");
      sw.className = "swatch";
      sw.style.setProperty("--on", `rgb(${p.on})`);
      sw.style.setProperty("--off", `rgb(${p.off})`);
      const label = document.createElement("span");
      label.textContent = p.label;
      const count = document.createElement("span");
      count.className = "count";
      count.textContent = `${counts[i]} sectors`;
      li.append(sw, label, count);
      ui.legend.append(li);
    });
  }

  function buildFacts(d) {
    const rows = [
      ["File size", `${state.fileSize.toLocaleString("en")} bytes`],
      ["Tracks", `${d.tracks} (${d.totalSectors} sectors)`],
      ["Error info", d.hasErrorInfo ? (d.errorCount ? `${d.errorCount} bad sectors` : "included, no errors") : "not included"],
      ["Disk name", d.name || "(empty)"],
      ["ID / DOS", `${d.id} / ${d.dosType}`],
      ["Files", String(d.files.length)],
      ["Blocks free", String(d.blocksFree)],
    ];
    if (d.tracks > 35) rows.splice(2, 0, ["Extra tracks", d.bamExtension ? `${d.bamExtension} BAM` : "no BAM found"]);
    ui.facts.textContent = "";
    for (const [k, v] of rows) {
      const dt = document.createElement("dt"); dt.textContent = k;
      const dd = document.createElement("dd"); dd.textContent = v;
      ui.facts.append(dt, dd);
    }
  }

  /* ---------- Download ---------- */

  ui.download.addEventListener("click", () => {
    if (!state.canvas) return;
    const base = state.fileName.replace(/\.d64$/i, "") || "disk";
    state.canvas.toBlob((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${base}.png`;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }, "image/png");
  });

  /* ---------- Image handed over by another app (e.g. C64 Disk Transfer) ---------- */

  if (new URLSearchParams(location.search).has("import")) {
    try {
      const h = JSON.parse(localStorage.getItem("wagiminator.d64-handoff") || "null");
      localStorage.removeItem("wagiminator.d64-handoff");
      if (h) {
        const bytes = Uint8Array.from(atob(h.data), (c) => c.charCodeAt(0));
        loadFile(new File([bytes], h.name));
      }
    } catch (e) { /* nothing handed over */ }
  }
})();
