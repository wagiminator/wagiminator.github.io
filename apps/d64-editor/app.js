/* D64 Disk Editor: user interface (disk logic lives in d64edit.js) */
(function () {
  "use strict";

  const L = window.D64Edit;
  const $ = (id) => document.getElementById(id);

  // Colors for files on the disk map (from the C64 palette)
  const FILE_COLORS = ["#56ac4d", "#edf171", "#75cec8", "#c46c71", "#a9ff9f", "#706deb", "#b38b55", "#c27fcf"];
  // Graphics characters offered below the name field
  const GLYPHS = "─│┼╭╮╰╯╱╲╳●○♥♠♣♦▒▌▐▀▄▔▁π£↑←";
  const SEPARATOR = "────────────────";

  const state = {
    disk: null,
    fileName: "",          // name of the opened .d64, or "" for a new disk
    selected: -1,          // selected directory entry
    modified: false,
    undo: [], redo: [],
    notes: [],
  };

  /* ---------- Changes with undo ---------- */

  function snapshot() {
    return { disk: state.disk.clone(), selected: state.selected, modified: state.modified };
  }

  // Run a change. On error the disk is restored and the message shown.
  function change(fn) {
    const before = snapshot();
    try {
      const msg = fn();
      state.undo.push(before);
      if (state.undo.length > 100) state.undo.shift();
      state.redo = [];
      state.modified = true;
      render();
      if (msg) status(msg);
      return true;
    } catch (err) {
      state.disk = before.disk;
      state.selected = before.selected;
      render();
      status(errorText(err), true);
      return false;
    }
  }

  function undo() {
    if (!state.undo.length) return;
    state.redo.push(snapshot());
    Object.assign(state, state.undo.pop());
    render();
    status("Undone.");
  }
  function redo() {
    if (!state.redo.length) return;
    state.undo.push(snapshot());
    Object.assign(state, state.redo.pop());
    render();
    status("Redone.");
  }

  function errorText(err) {
    if (err.message === "dirfull") return `The directory is full (${L.MAX_ENTRIES} entries). Delete an entry first.`;
    if (err.message === "full") return err.detail || "There is not enough free space on the disk.";
    return err.message;
  }

  let statusTimer;
  function status(text, isError) {
    const el = $("status");
    el.textContent = text;
    el.classList.toggle("error", !!isError);
    clearTimeout(statusTimer);
    if (!isError) statusTimer = setTimeout(() => { el.textContent = ""; }, 6000);
  }

  /* ---------- Disks ---------- */

  function setDisk(disk, fileName, notes) {
    state.disk = disk;
    state.fileName = fileName;
    state.notes = notes || [];
    state.selected = -1;
    state.modified = false;
    state.undo = [];
    state.redo = [];
    render();
  }

  function confirmDiscard() {
    return !state.modified || confirm("Your changes to this disk are not saved. Discard them?");
  }

  function openD64(file) {
    if (!confirmDiscard()) return;
    file.arrayBuffer().then((buf) => {
      try {
        const { disk, notes } = L.Disk.open(buf);
        setDisk(disk, file.name, notes);
        status(`Opened ${file.name}.`);
      } catch (err) {
        if (err.message === "size") {
          status(`“${file.name}” is not a D64 disk image (${err.size.toLocaleString("en")} bytes). A D64 image has 174,848 to 206,114 bytes.`, true);
        } else status(`“${file.name}” could not be opened: ${err.message}`, true);
      }
    });
  }

  // Add host files to the disk at directory position `at`
  async function addFiles(files, at) {
    const list = [];
    for (const f of files) list.push({ file: f, bytes: new Uint8Array(await f.arrayBuffer()) });
    let pos = at === undefined ? state.disk.entries.length : at;
    const added = [];
    let warning = "";
    const ok = change(() => {
      for (const { file, bytes } of list) {
        const imp = L.importFile(file.name, bytes);
        const need = Math.max(1, Math.ceil(imp.data.length / 254));
        if (need > state.disk.blocksFree()) {
          const err = new Error("full");
          err.detail = `Not enough space for “${file.name}”: it needs ${need} blocks, ${state.disk.blocksFree()} are free.` +
            (added.length ? " The files before it were added." : "");
          // Keep the files that fit and report the one that did not
          if (added.length) { warning = err.detail; break; }
          throw err;
        }
        state.disk.addFile(imp.name, imp.type, imp.data, interleave(), pos);
        added.push(`${imp.name} (${need} blocks)`);
        state.selected = pos;
        pos++;
      }
      return added.length === 1 ? `Added ${added[0]}.` : added.length ? `Added ${added.length} files: ${added.join(", ")}.` : "";
    });
    if (ok && warning) status(warning, true);
  }

  function save() {
    const bytes = state.disk.toBytes();
    let base = state.fileName.replace(/\.d64$/i, "");
    if (!base) base = L.petsciiToText(state.disk.name).trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "_") || "disk";
    download(bytes, `${base}.d64`);
    state.fileName = `${base}.d64`;
    state.modified = false;
    renderDocName();
    status(`Saved ${base}.d64.`);
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

  function interleave() { return parseInt($("opt-interleave").value, 10); }

  /* ---------- Rendering ---------- */

  function render() {
    renderDocName();
    renderDirectory();
    renderMap();
    renderSpace();
    renderEntry();
    renderDisk();
    $("btn-undo").disabled = !state.undo.length;
    $("btn-redo").disabled = !state.redo.length;
  }

  function renderDocName() {
    const el = $("doc-name");
    el.textContent = state.fileName || "New disk";
    el.classList.toggle("modified", state.modified);
  }

  function renderDirectory() {
    const d = state.disk;
    const header = $("dir-header");
    header.textContent = "0 ";
    const rev = document.createElement("span");
    rev.className = "reverse";
    rev.textContent = `"${L.petsciiToText(d.name, true)}" ${L.petsciiToText(d.id, true)} ${L.petsciiToText(d.dosType, true)}`;
    header.append(rev);

    const list = $("dir-list");
    const focused = document.activeElement && document.activeElement.classList.contains("dir-row");
    list.textContent = "";
    d.entries.forEach((e, i) => {
      const li = document.createElement("li");
      li.dataset.index = i;
      li.draggable = true;
      li.className = "dir-row";
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", String(i === state.selected));
      li.tabIndex = i === state.selected || (state.selected < 0 && i === 0) ? 0 : -1;
      li.textContent = L.listingLine(e);
      list.append(li);
    });
    if (!d.entries.length) {
      const li = document.createElement("li");
      li.className = "c64-line dir-empty";
      li.textContent = "NO FILES. ADD SOME!";
      list.append(li);
    }
    $("dir-footer").textContent = `${d.blocksFree()} BLOCKS FREE.`;
    if (focused && state.selected >= 0) {
      const row = list.children[state.selected];
      if (row) row.focus();
    }
  }

  function fileColor(i) { return FILE_COLORS[i % FILE_COLORS.length]; }

  function renderMap() {
    const d = state.disk;
    const map = d.sectorMap();
    const grid = $("disk-map");
    grid.textContent = "";
    grid.classList.toggle("has-selection", state.selected >= 0);
    // Number files by data-holding entries for distinct colors
    const colorIndex = new Map();
    d.entries.forEach((e, i) => { if (d.fileSectors(e).length) colorIndex.set(i, colorIndex.size); });
    for (let t = 1; t <= d.tracks; t++) {
      const label = document.createElement("span");
      label.className = "map-track";
      label.textContent = t % 5 === 0 || t === 1 ? t : "";
      grid.append(label);
      for (let s = 0; s < 21; s++) {
        const c = document.createElement("span");
        c.className = "cell";
        if (s >= L.sectorsPerTrack(t)) { c.classList.add("none"); grid.append(c); continue; }
        const owner = map[d.index(t, s)];
        let title = `Track ${t}, sector ${s}: `;
        if (owner === -1) { c.classList.add("free"); title += "free"; }
        else if (owner === -2) { c.classList.add("dir"); title += "BAM / directory"; }
        else if (owner === -3) { c.classList.add("other"); title += "used, not part of a file"; }
        else {
          c.classList.add("file");
          c.style.setProperty("--file-color", fileColor(colorIndex.get(owner) || 0));
          c.dataset.entry = owner;
          if (owner === state.selected) c.classList.add("selected");
          title += `“${L.petsciiToText(d.entries[owner].name)}”`;
        }
        c.title = title;
        grid.append(c);
      }
    }
  }

  function renderSpace() {
    const d = state.disk;
    const free = d.blocksFree(), total = d.blocksTotal();
    $("space-free").textContent = free;
    $("space-used").style.width = `${((total - free) / total) * 100}%`;
    $("space-detail").textContent =
      `${total - free} of ${total} blocks used, about ${Math.round((free * 254) / 1024)} KB free. ` +
      `Directory: ${d.entries.length} of ${L.MAX_ENTRIES} entries.`;
    const split = d.entries.filter((e) => d.isFragmented(e)).length;
    $("space-frag").textContent = split === 0 ? "No file is split across the disk."
      : split === 1 ? "1 file is split across the disk." : `${split} files are split across the disk.`;
  }

  function renderEntry() {
    const d = state.disk;
    const e = d.entries[state.selected];
    $("entry-form").hidden = !e;
    $("entry-empty").hidden = !!e;
    if (!e) return;
    const name = $("entry-name");
    const text = L.petsciiToText(e.name);
    if (document.activeElement !== name) name.value = text;
    $("entry-count").textContent = `(${[...text].length}/16)`;
    const type = $("entry-type");
    type.value = String(e.type & 7);
    type.disabled = (e.type & 7) === 4;
    $("entry-blocks").value = e.blocks;
    const sectors = d.fileSectors(e);
    $("entry-blocks").disabled = sectors.length > 0;
    $("entry-locked").checked = !!(e.type & 0x40);
    $("entry-closed").checked = !!(e.type & 0x80);
    $("entry-info").textContent = sectors.length
      ? `${sectors.length} blocks on disk, starting at track ${e.track}, sector ${e.sector}` +
        (d.isFragmented(e) ? ". The file is split across the disk." : ".")
      : "No data on disk (for example a separator line). The number of blocks shown can be set freely.";
    $("entry-up").disabled = state.selected === 0;
    $("entry-down").disabled = state.selected === d.entries.length - 1;
    $("entry-extract").disabled = !sectors.length;
  }

  function renderDisk() {
    const d = state.disk;
    if (document.activeElement !== $("disk-name")) $("disk-name").value = L.petsciiToText(d.name);
    if (document.activeElement !== $("disk-id")) $("disk-id").value = L.petsciiToText(d.id, true);
    $("disk-format").textContent = `${d.tracks} tracks, ${d.blocksTotal()} blocks for files.`;
    const notes = $("disk-notes");
    notes.textContent = "";
    for (const n of state.notes) {
      const li = document.createElement("li");
      li.textContent = n;
      notes.append(li);
    }
  }

  /* ---------- Directory interaction ---------- */

  function select(i) {
    state.selected = i;
    render();
  }

  function moveSelected(delta) {
    const i = state.selected, j = i + delta;
    if (i < 0 || j < 0 || j >= state.disk.entries.length) return;
    change(() => { state.disk.moveEntry(i, j); state.selected = j; });
  }

  function deleteSelected() {
    const i = state.selected;
    if (i < 0) return;
    const name = L.petsciiToText(state.disk.entries[i].name);
    change(() => {
      state.disk.removeEntry(i);
      state.selected = Math.min(i, state.disk.entries.length - 1);
      return `Deleted “${name}”. Use Undo to bring it back.`;
    });
  }

  const list = $("dir-list");
  list.addEventListener("click", (ev) => {
    const li = ev.target.closest("li[data-index]");
    if (li) select(parseInt(li.dataset.index, 10));
  });
  list.addEventListener("keydown", (ev) => {
    const li = ev.target.closest("li[data-index]");
    if (!li) return;
    const i = parseInt(li.dataset.index, 10);
    if (ev.key === "ArrowUp" || ev.key === "ArrowDown") {
      ev.preventDefault();
      const delta = ev.key === "ArrowUp" ? -1 : 1;
      if (ev.altKey) { state.selected = i; moveSelected(delta); }
      else if (i + delta >= 0 && i + delta < state.disk.entries.length) select(i + delta);
    } else if (ev.key === "Delete") {
      state.selected = i;
      deleteSelected();
    }
  });

  // Drag and drop to reorder entries
  let dragFrom = -1;
  list.addEventListener("dragstart", (ev) => {
    const li = ev.target.closest("li[data-index]");
    if (!li) return;
    dragFrom = parseInt(li.dataset.index, 10);
    li.classList.add("dragging");
    ev.dataTransfer.effectAllowed = "move";
    ev.dataTransfer.setData("text/plain", String(dragFrom));
  });
  list.addEventListener("dragend", () => { dragFrom = -1; clearDropMarks(); });
  list.addEventListener("dragover", (ev) => {
    const li = ev.target.closest("li[data-index]");
    if (!li) return;
    ev.preventDefault();
    clearDropMarks();
    li.classList.add(dropAfter(ev, li) ? "drop-after" : "drop-before");
  });
  list.addEventListener("drop", (ev) => {
    const li = ev.target.closest("li[data-index]");
    if (!li) return;
    ev.preventDefault();
    ev.stopPropagation();
    let to = parseInt(li.dataset.index, 10) + (dropAfter(ev, li) ? 1 : 0);
    clearDropMarks();
    document.body.classList.remove("file-drag");
    if (hasFiles(ev)) { fileDepth = 0; handleDroppedFiles(ev.dataTransfer.files, to); return; }
    const from = dragFrom;
    if (from < 0) return;
    if (to > from) to--;
    if (to !== from) change(() => { state.disk.moveEntry(from, to); state.selected = to; });
  });
  function dropAfter(ev, li) {
    const r = li.getBoundingClientRect();
    return ev.clientY > r.top + r.height / 2;
  }
  function clearDropMarks() {
    list.querySelectorAll(".drop-before, .drop-after, .dragging").forEach((el) => el.classList.remove("drop-before", "drop-after", "dragging"));
  }

  // Disk map: select the file of a sector
  $("disk-map").addEventListener("click", (ev) => {
    const c = ev.target.closest(".cell[data-entry]");
    if (c) select(parseInt(c.dataset.entry, 10));
  });

  /* ---------- Files dropped on the page ---------- */

  let fileDepth = 0;
  function hasFiles(ev) { return ev.dataTransfer && [...ev.dataTransfer.types].includes("Files"); }
  window.addEventListener("dragenter", (ev) => { if (hasFiles(ev)) { fileDepth++; document.body.classList.add("file-drag"); } });
  window.addEventListener("dragleave", (ev) => { if (hasFiles(ev) && --fileDepth <= 0) { fileDepth = 0; document.body.classList.remove("file-drag"); } });
  window.addEventListener("dragover", (ev) => { if (hasFiles(ev)) ev.preventDefault(); });
  window.addEventListener("drop", (ev) => {
    if (!hasFiles(ev)) return;
    ev.preventDefault();
    fileDepth = 0;
    document.body.classList.remove("file-drag");
    handleDroppedFiles(ev.dataTransfer.files);
  });

  // A single .d64 opens the disk; anything else is added as a file
  function handleDroppedFiles(fileList, at) {
    const files = [...fileList];
    if (files.length === 1 && /\.d64$/i.test(files[0].name)) { openD64(files[0]); return; }
    const d64 = files.filter((f) => /\.d64$/i.test(f.name));
    const rest = files.filter((f) => !/\.d64$/i.test(f.name));
    if (d64.length) status("Disk images are opened one at a time; drop a single .d64 file to open it.", true);
    if (rest.length) addFiles(rest, at);
  }

  /* ---------- Toolbar ---------- */

  $("btn-open").addEventListener("click", () => $("open-input").click());
  $("open-input").addEventListener("change", (ev) => {
    if (ev.target.files[0]) openD64(ev.target.files[0]);
    ev.target.value = "";
  });
  $("btn-add").addEventListener("click", () => $("add-input").click());
  $("add-input").addEventListener("change", (ev) => {
    if (ev.target.files.length) addFiles([...ev.target.files], state.selected >= 0 ? state.selected + 1 : undefined);
    ev.target.value = "";
  });
  $("btn-sep").addEventListener("click", () => {
    const at = state.selected >= 0 ? state.selected + 1 : state.disk.entries.length;
    change(() => {
      state.disk.addSeparator(SEPARATOR, at);
      state.selected = at;
      return "Added a separator line. Edit its text in the Entry panel.";
    });
  });
  $("btn-undo").addEventListener("click", undo);
  $("btn-redo").addEventListener("click", redo);
  $("btn-save").addEventListener("click", save);

  document.addEventListener("keydown", (ev) => {
    if (!(ev.ctrlKey || ev.metaKey) || ev.target.matches("input, textarea, select")) return;
    const k = ev.key.toLowerCase();
    if (k === "z" && !ev.shiftKey) { ev.preventDefault(); undo(); }
    else if (k === "y" || (k === "z" && ev.shiftKey)) { ev.preventDefault(); redo(); }
    else if (k === "s") { ev.preventDefault(); save(); }
  });

  // New disk dialog
  const dialog = $("new-dialog");
  $("btn-new").addEventListener("click", () => {
    if (!confirmDiscard()) return;
    $("new-name").value = "NEW DISK";
    $("new-id").value = "00";
    dialog.showModal();
  });
  dialog.addEventListener("close", () => {
    if (dialog.returnValue !== "create") return;
    const tracks = parseInt(document.querySelector('input[name="new-tracks"]:checked').value, 10);
    setDisk(L.Disk.create(tracks, $("new-name").value, $("new-id").value), "", []);
    status(`Created a new ${tracks}-track disk.`);
  });

  /* ---------- Entry panel ---------- */

  // Keep only characters that exist on the C64 and limit the length
  function cleanPetscii(input, max) {
    const pos = input.selectionStart;
    const before = input.value;
    const clean = [...before.toUpperCase()].filter(L.isPetsciiChar).slice(0, max).join("");
    if (clean !== before) {
      input.value = clean;
      const p = Math.min(clean.length, pos - (before.length - clean.length));
      input.setSelectionRange(p, p);
    }
    return clean;
  }

  // Typing in a field changes the disk; consecutive keystrokes in the
  // same field form one undo step.
  let editing = null;
  function liveEdit(field, apply) {
    if (editing !== field) {
      editing = field;
      change(apply);
    } else {
      apply();
      render();
    }
  }
  document.addEventListener("focusin", (ev) => { if (ev.target !== editing) editing = null; });

  $("entry-name").addEventListener("input", (ev) => {
    const text = cleanPetscii(ev.target, 16);
    liveEdit(ev.target, () => {
      state.disk.entries[state.selected].name = L.textToPetscii(text, 16);
      state.disk.saveDirectory();
    });
  });

  const glyphs = $("glyphs");
  for (const ch of GLYPHS) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = ch;
    b.title = `Insert ${ch}`;
    b.addEventListener("mousedown", (ev) => ev.preventDefault());   // keep the cursor in the field
    b.addEventListener("click", () => {
      const input = $("entry-name");
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? start;
      input.value = input.value.slice(0, start) + ch + input.value.slice(end);
      input.setSelectionRange(start + ch.length, start + ch.length);
      input.focus();
      input.dispatchEvent(new Event("input"));
    });
    glyphs.append(b);
  }

  function setTypeBits() {
    const e = state.disk.entries[state.selected];
    const type = parseInt($("entry-type").value, 10);
    change(() => {
      e.type = type | ($("entry-locked").checked ? 0x40 : 0) | ($("entry-closed").checked ? 0x80 : 0) | (e.type & 0x38);
      state.disk.saveDirectory();
    });
  }
  $("entry-type").addEventListener("change", setTypeBits);
  $("entry-locked").addEventListener("change", setTypeBits);
  $("entry-closed").addEventListener("change", setTypeBits);
  $("entry-blocks").addEventListener("input", (ev) => {
    const v = Math.max(0, Math.min(65535, parseInt(ev.target.value, 10) || 0));
    liveEdit(ev.target, () => {
      state.disk.entries[state.selected].blocks = v;
      state.disk.saveDirectory();
    });
  });
  $("entry-form").addEventListener("submit", (ev) => ev.preventDefault());
  $("entry-up").addEventListener("click", () => moveSelected(-1));
  $("entry-down").addEventListener("click", () => moveSelected(1));
  $("entry-delete").addEventListener("click", deleteSelected);
  $("entry-extract").addEventListener("click", () => {
    const e = state.disk.entries[state.selected];
    const name = L.petsciiToText(e.name).trim().replace(/[^A-Za-z0-9 ._-]+/g, "_") || "file";
    const ext = (L.TYPES[e.type & 7] || "prg").toLowerCase();
    download(state.disk.readFile(e), `${name.toLowerCase()}.${ext}`);
  });

  /* ---------- Disk panel ---------- */

  $("disk-name").addEventListener("input", (ev) => {
    const text = cleanPetscii(ev.target, 16);
    liveEdit(ev.target, () => { state.disk.name = L.textToPetscii(text, 16); });
  });
  $("disk-id").addEventListener("input", (ev) => {
    const text = cleanPetscii(ev.target, 2);
    liveEdit(ev.target, () => { state.disk.id = L.textToPetscii(text, 2); });
  });

  /* ---------- Free space and defragmenting ---------- */

  const il = $("opt-interleave");
  for (let i = 1; i <= 20; i++) {
    const o = document.createElement("option");
    o.value = i;
    o.textContent = i === 10 ? "10 (1541 standard)" : String(i);
    if (i === 10) o.selected = true;
    il.append(o);
  }

  $("btn-defrag").addEventListener("click", () => {
    change(() => {
      const r = state.disk.defragment(interleave(), $("opt-erase").checked);
      let msg = `Defragmented: ${r.moved} ${r.moved === 1 ? "file" : "files"} rewritten next to the directory.`;
      if (r.split) msg += ` ${r.split} still ${r.split === 1 ? "has" : "have"} to be split because no single area is large enough.`;
      if (r.skipped) msg += ` ${r.skipped} ${r.skipped === 1 ? "entry was" : "entries were"} left in place (REL, deleted or damaged files).`;
      if (r.kept) msg += ` ${r.kept} used sectors outside of files (e.g. loader data) were left untouched.`;
      return msg;
    });
  });

  window.addEventListener("beforeunload", (ev) => {
    if (state.modified) { ev.preventDefault(); ev.returnValue = ""; }
  });

  /* ---------- Start with an empty disk ---------- */

  setDisk(L.Disk.create(35, "NEW DISK", "00"), "", []);

  /* ---------- Image handed over by another app (e.g. D64 Disk Transfer) ---------- */

  if (new URLSearchParams(location.search).has("import")) {
    try {
      const h = JSON.parse(localStorage.getItem("wagiminator.d64-handoff") || "null");
      localStorage.removeItem("wagiminator.d64-handoff");
      if (h) {
        const bytes = Uint8Array.from(atob(h.data), (c) => c.charCodeAt(0));
        openD64(new File([bytes], h.name));
      }
    } catch (e) { /* nothing handed over */ }
  }
})();
