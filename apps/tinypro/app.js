/* XGecu Memory Programmer: user interface (protocols and memory operations in tinypro.js,
 * chip database in chips.js, files in /assets/js/firmware.js). GNU GPL v3.0 or later. */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const T = window.TINYPRO, FW = window.FIRMWARE;
  const hex = (v, n) => "0x" + v.toString(16).toUpperCase().padStart(n || 2, "0");
  const size = (n) => (n >= 1048576 && n % 1048576 === 0 ? `${n / 1048576} MB` : n >= 1024 && n % 1024 === 0 ? `${n / 1024} KB` : `${n.toLocaleString("en")} bytes`) + (n >= 1024 ? ` (${n.toLocaleString("en")} bytes)` : "");

  const state = {
    device: null,       // USBDevice
    prog: null,         // { model, firmwareStr, database, ... } of the last session
    busy: false,
    dbs: null,          // { INFOIC2PLUS, INFOIC }
    db: "INFOIC2PLUS",
    chip: null,         // Chip
    fw: null,           // { name, parsed } or { name, error }
  };

  /* ---------- Log ---------- */

  function log(text, cls) {
    const li = document.createElement("li");
    if (cls) li.className = cls === "warn" ? "error" : cls;
    const t = document.createElement("time");
    t.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    li.append(t, text);
    $("log").append(li);
    $("log").scrollTop = $("log").scrollHeight;
  }

  function errorText(err) {
    if (err && err.name === "NetworkError") return "The programmer could not be opened. Close other programs that use it (Xgpro, minipro, tinypro) and try again.";
    if (err && err.name === "SecurityError") return "The browser may not access this device. On Linux, add the udev rules (More options); on Windows, check the driver.";
    if (err && err.name === "NotFoundError") return "The programmer is no longer available. Plug it in again and connect it.";
    let m = err && err.message ? err.message : String(err);
    if (!/[.!?)]$/.test(m)) m += ".";
    return m;
  }

  /* ---------- Controls ---------- */

  const memory = () => (document.querySelector('input[name="memory"]:checked') || {}).value || "code";
  const memSize = () => (state.chip ? (memory() === "data" ? state.chip.dataSize : state.chip.codeSize) : 0);
  const usable = () => state.chip && (!state.prog || state.chip.availableOn(state.prog));

  function update() {
    const ok = !!navigator.usb;
    const idle = ok && !state.busy && !!state.device;
    const chip = idle && usable();
    $("btn-detect").disabled = !idle || !state.dbs;
    $("btn-read").disabled = !chip;
    $("btn-blank").disabled = !chip;
    $("btn-erase").disabled = !chip || !state.chip.canErase || memory() === "data";
    $("btn-write").disabled = !chip || !state.fw || fwErrors().length > 0;
    $("btn-verify").disabled = $("btn-write").disabled;
    $("opt-protect").disabled = !state.chip || !state.chip.protectAfter;
    if ($("opt-protect").disabled) $("opt-protect").checked = false;
    $("btn-connect").disabled = state.busy || !ok;
    $("btn-connect").textContent = state.device ? "Disconnect" : "Connect programmer";
    $("file-input").disabled = state.busy;
    $("db-select").disabled = state.busy || !!state.prog;

    $("conn").className = "conn" + (state.busy ? " busy" : state.device ? " connected" : "");
    const note = $("link-note");
    note.className = "link-note";
    if (!state.device) {
      $("conn-text").textContent = "Not connected";
      note.textContent = "Plug in the programmer by USB and connect it.";
    } else {
      const p = state.prog;
      $("conn-text").textContent = state.busy ? "Working …" : p ? p.model : "Programmer chosen";
      if (p) {
        note.textContent = `Firmware ${p.firmwareStr}` + (p.voltage ? `, supply ${p.voltage.toFixed(2)} V` : "") + ".";
        if (p.firmware < p.expectedFirmware) {
          note.className = "link-note warn";
          note.textContent = `Firmware ${p.firmwareStr} is out of date (expected ${p.expectedFirmwareStr}); update it with Xgpro.`;
        }
      } else note.textContent = "";
    }
    $("unsupported").hidden = ok;
  }

  /* ---------- Chip database and search ---------- */

  const db = () => (state.dbs ? state.dbs[state.db] : null);

  function setDatabase(name) {
    if (state.db === name) return;
    state.db = name;
    $("db-select").value = name;
    if (state.chip && state.dbs) {
      // the other database has its own entries for the same chip
      let c = null;
      try { c = state.dbs[name].find(state.chip.name, state.prog); } catch (e) { c = null; }
      if (c) selectChip(c, true);
      else { log(`${state.chip.name} is not in the chip list of the ${name === "INFOIC" ? "TL866A/CS" : "TL866II+/T48"}; choose another chip.`, "error"); selectChip(null); }
    }
    searchNote();
  }
  $("db-select").addEventListener("change", () => setDatabase($("db-select").value));

  function searchNote(text) {
    const d = db();
    $("search-note").textContent = text || (d ? `${d.index.length.toLocaleString("en")} chip names for the ${state.db === "INFOIC" ? "TL866A/CS" : "TL866II+ and T48"}. Type a part of the name; * and ? work as wildcards.` : "Loading the chip database …");
  }

  let results = [], active = -1;
  function showSuggestions() {
    const q = $("chip-search").value;
    const ul = $("suggest");
    ul.textContent = "";
    active = -1;
    const d = db();
    if (!d || !q.trim()) { ul.hidden = true; $("chip-search").setAttribute("aria-expanded", "false"); results = []; return; }
    const r = d.search(q, state.prog, 60);
    results = r.results || [];
    results.forEach((x, i) => {
      const li = document.createElement("li");
      li.setAttribute("role", "option");
      li.id = `opt-${i}`;
      if (!x.available) li.className = "na";
      const n = document.createElement("span"); n.textContent = x.name + (x.available ? "" : ` (not on the ${state.prog.model})`);
      const m = document.createElement("span"); m.className = "man"; m.textContent = x.manufacturer;
      li.append(n, m);
      li.addEventListener("mousedown", (ev) => { ev.preventDefault(); pick(i); });
      ul.append(li);
    });
    if (!results.length) {
      const li = document.createElement("li"); li.className = "more"; li.textContent = "No chip with this name.";
      ul.append(li);
    } else if (r.total > results.length) {
      const li = document.createElement("li"); li.className = "more"; li.textContent = `${r.total.toLocaleString("en")} matches, ${results.length} shown; type more of the name.`;
      ul.append(li);
    }
    ul.hidden = false;
    $("chip-search").setAttribute("aria-expanded", "true");
  }

  function setActive(i) {
    const items = [...$("suggest").querySelectorAll('li[role="option"]')];
    if (!items.length) return;
    active = (i + items.length) % items.length;
    items.forEach((li, k) => li.classList.toggle("active", k === active));
    items[active].scrollIntoView({ block: "nearest" });
    $("chip-search").setAttribute("aria-activedescendant", items[active].id);
  }

  function pick(i) {
    const x = results[i];
    if (!x) return;
    let c;
    try { c = db().find(x.name, state.prog); } catch (e) { c = db().chip(x.entry, x.name); }
    $("suggest").hidden = true;
    $("chip-search").setAttribute("aria-expanded", "false");
    $("compat").hidden = true;
    selectChip(c);
  }

  $("chip-search").addEventListener("input", showSuggestions);
  $("chip-search").addEventListener("focus", () => { if ($("chip-search").value && (!state.chip || $("chip-search").value !== state.chip.name)) showSuggestions(); });
  $("chip-search").addEventListener("blur", () => { $("suggest").hidden = true; $("chip-search").setAttribute("aria-expanded", "false"); });
  $("chip-search").addEventListener("keydown", (ev) => {
    if (ev.key === "ArrowDown") { ev.preventDefault(); if ($("suggest").hidden) showSuggestions(); setActive(active + 1); }
    else if (ev.key === "ArrowUp") { ev.preventDefault(); setActive(active - 1); }
    else if (ev.key === "Enter") {
      ev.preventDefault();
      if (active >= 0) pick(active);
      else if (results.length) {
        const q = $("chip-search").value.trim().toUpperCase();
        const i = results.findIndex((x) => x.name.toUpperCase() === q);
        pick(i >= 0 ? i : 0);
      }
    } else if (ev.key === "Escape") { $("suggest").hidden = true; }
  });

  /* ---------- Selected chip ---------- */

  const PROTO = { 0x01: "I2C EEPROM", 0x02: "Microwire EEPROM", 0x03: "SPI flash", 0x04: "DataFlash" };

  // A parallel chip that cannot be erased electrically is a UV-EPROM (serial EEPROMs are written directly)
  const isUv = (c) => !c.canErase && !PROTO[c.protocolId & 0xff];

  function selectChip(c, quiet) {
    state.chip = c;
    if (!c) {
      $("chip-info").hidden = true;
      $("mem-choice").hidden = true;
      $("chip-search").value = "";
      showFirmware();
      update();
      return;
    }
    $("chip-search").value = c.name;
    if (!quiet) log(`Selected ${c.name} (${c.manufacturer}).`);
    const rows = [["Chip", c.name], ["Manufacturer", c.manufacturer], ["Memory", size(c.codeSize) + (c.wordSize === 2 ? ", 16 bit" : "")]];
    if (c.dataSize) rows.push(["Data memory", size(c.dataSize)]);
    if (PROTO[c.protocolId & 0xff]) rows.push(["Type", PROTO[c.protocolId & 0xff]]);
    if (c.hasChipId) rows.push(["Chip ID", hex(c.chipId, c.chipIdBytes * 2)]);
    rows.push(["Erase", c.canErase ? "electrically" : isUv(c) ? "UV light (not by the programmer)" : "not needed (written directly)"]);
    if (c.protectAfter || c.offProtectBefore) rows.push(["Write protection", c.protectAfter ? "can be set after writing" : "removed before writing"]);
    if (c.blankValue !== 0xFF) rows.push(["Blank value", hex(c.blankValue)]);
    if (state.db === "INFOIC2PLUS" && c.availableStr() && c.availableStr() !== "TL866II+/T48/T56") rows.push(["Programmers", c.availableStr().replace("/T56", "").replace("T56", "–") || "–"]);
    const dl = $("chip-facts");
    dl.textContent = "";
    for (const [k, v] of rows) {
      const dt = document.createElement("dt"); dt.textContent = k;
      const dd = document.createElement("dd"); dd.textContent = v;
      dl.append(dt, dd);
    }
    showPlacement(c);
    $("chip-info").hidden = false;
    $("mem-choice").hidden = !c.dataSize;
    if (!c.dataSize) document.querySelector('input[name="memory"][value="code"]').checked = true;
    $("data-size").textContent = c.dataSize ? `(${size(c.dataSize)})` : "";
    showFirmware();
    update();
  }

  document.querySelectorAll('input[name="memory"]').forEach((r) => r.addEventListener("change", () => { showFirmware(); update(); }));

  /* ---------- Socket placement ---------- */

  function socketSvg(pins, label, adapter) {
    const W = 128, top = 44, pitch = 13, H = top + 20 * pitch + 14;
    const rows = pins / 2, first = 0;                         // chip uses the top rows (next to the lever)
    const xl = 30, xr = 98;
    let s = `<svg class="svg-socket" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">`;
    s += `<rect x="12" y="${top - 16}" width="${W - 24}" height="${20 * pitch + 24}" rx="5" class="zif"/>`;
    s += `<rect x="4" y="2" width="8" height="${top - 4}" rx="3" fill="#7a7466"/><rect x="2" y="2" width="12" height="9" rx="3" fill="#5d584c"/>`;
    s += `<text x="18" y="${top - 6}" fill="#5d584c">1</text><text x="${W - 30}" y="${top - 6}" fill="#5d584c">40</text>`;
    for (let r = 0; r < 20; r++) {
      const y = top + r * pitch + 4, used = r < rows;
      s += `<rect x="${xl - 10}" y="${y - 3}" width="20" height="6" rx="3" class="hole${used ? " used" : ""}"/>`;
      s += `<rect x="${xr - 10}" y="${y - 3}" width="20" height="6" rx="3" class="hole${used ? " used" : ""}"/>`;
    }
    if (rows) {
      const wide = pins >= 28 || adapter;
      const bx = wide ? xl + 6 : xl + 16, bw = wide ? xr - xl - 12 : xr - xl - 32;
      const by = top + first * pitch - 2, bh = rows * pitch + 2;
      s += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="3" class="body"${adapter ? ' fill="#3d6b4a" stroke-dasharray="4 2" stroke="#2c4f36"' : ""}/>`;
      s += `<path d="M ${bx + bw / 2 - 6} ${by} a 6 6 0 0 0 12 0" fill="#e8e2d0"/>`;
      s += `<circle cx="${bx + 6}" cy="${by + 8}" r="2.5" fill="#e8e2d0"/>`;
      s += `<text x="${bx + 3}" y="${by + 22}" fill="#fff">1</text>`;
      const t = adapter ? "adapter" : `DIP${pins}`;
      s += `<text x="${bx + bw / 2}" y="${by + bh / 2 + 3}" fill="#fff" text-anchor="middle" transform="rotate(-90 ${bx + bw / 2} ${by + bh / 2})">${t}</text>`;
    }
    return s + "</svg>";
  }

  function showPlacement(c) {
    const p = T.placement(c);
    const box = $("place");
    box.textContent = "";
    const para = (t, cls) => { const e = document.createElement("p"); if (cls) e.className = cls; e.textContent = t; box.append(e); };
    let pins = p.pins;
    if (!pins && p.dip && p.dip <= 40) pins = p.dip;
    if (pins) {
      const rows = pins / 2;
      const where = `at the top of the ZIF socket, next to the lever, with pin 1 (notch) towards the lever: chip pin 1 in socket pin 1, pin ${pins} in socket pin 40 (the top ${rows} rows).`;
      if (p.direct) para(`Insert the ${p.pkg} chip ${where}`);
      else para(`Put the ${p.pkg} chip into a ${p.adapter} and insert the adapter like a DIP${pins} ${where}`);
      $("socket").innerHTML = socketSvg(pins, `ZIF socket with ${p.direct ? "a " + p.pkg + " chip" : "an adapter"} in the top ${rows} rows`, !p.direct);
      $("socket").hidden = false;
    } else {
      $("socket").innerHTML = "";
      $("socket").hidden = true;
      if (p.xgecu) para(`The ${p.pkg} chip needs the XGecu ${p.adapter}. Insert the adapter into the ZIF socket as printed on it, and the chip into the adapter with pin 1 where it is marked.`);
      else if (p.adapter) para(`The ${p.pkg} chip needs a ${p.adapter}. Insert it into the ZIF socket as described for the adapter.`);
      else para("The package of this chip is not known; see Xgpro for how it is inserted.");
    }
    if (state.prog && !c.availableOn(state.prog)) para(`This chip is not supported by the ${state.prog.model} (only ${c.availableStr().replace("/T56", "")}).`, "warnline");
    if (isUv(c)) para("UV-EPROM: it must be blank before writing; erase it with UV light.");
  }

  /* ---------- Connecting ---------- */

  async function openProg() {
    const p = await T.openProgrammer(state.device);
    state.prog = { model: p.model, firmware: p.firmware, firmwareStr: p.firmwareStr, expectedFirmware: p.expectedFirmware,
      expectedFirmwareStr: p.expectedFirmwareStr, voltage: p.voltage, database: p.database };
    setDatabase(p.database);
    return p;
  }

  async function useDevice(dev) {
    state.device = dev;
    state.prog = null;
    update();
    const ok = await busy(async () => {
      const p = await openProg();
      await p.close();
      log(`Found ${p.model} with firmware ${p.firmwareStr}${p.voltage ? `, supply ${p.voltage.toFixed(2)} V` : ""}.`, "ok");
      if (p.firmware < p.expectedFirmware) log(`The firmware is out of date (expected ${p.expectedFirmwareStr}); update it with Xgpro.`, "error");
    });
    if (!ok) { state.device = null; state.prog = null; }
    if (state.chip) selectChip(state.chip, true);
    update();
  }

  $("btn-connect").addEventListener("click", async () => {
    if (state.device) {
      state.device = null; state.prog = null;
      log("Programmer disconnected.");
      if (state.chip) selectChip(state.chip, true);
      update();
      return;
    }
    let dev;
    try {
      dev = await navigator.usb.requestDevice({ filters: T.USB_FILTERS });
    } catch (e) {
      log("No programmer was chosen. Plug it in and choose it in the list the browser shows.");
      return;
    }
    await useDevice(dev);
  });

  async function autoConnect() {
    if (!navigator.usb) { update(); return; }
    navigator.usb.addEventListener("connect", (ev) => { if (!state.device && !state.busy) useDevice(ev.device); });
    navigator.usb.addEventListener("disconnect", (ev) => {
      if (ev.device === state.device) {
        state.device = null; state.prog = null; state.busy = false;
        log("The programmer was unplugged.");
        update();
      }
    });
    const devs = await navigator.usb.getDevices();
    if (devs.length) await useDevice(devs[0]);
  }

  /* ---------- Running actions ---------- */

  async function busy(fn) {
    state.busy = true;
    update();
    try {
      await fn();
      return true;
    } catch (err) {
      log(errorText(err), "error");
      return false;
    } finally {
      state.busy = false;
      update();
    }
  }

  // One session as in tinypro.py: open the programmer, act, close it
  async function run(actions, done, progress) {
    if (!state.device) { log("Connect the programmer first.", "error"); return false; }
    let result = null;
    const ok = await busy(async () => {
      const p = await openProg();
      update();
      const d = db();
      let chip = actions.detect ? null : state.chip;
      if (chip) {
        try { chip = d.find(chip.name, p); } catch (e) { await p.close(); throw e; }
      }
      result = await T.runSession(p, d, { ...actions, chip, memory: memory(), ignoreId: $("opt-ignoreid").checked }, log, progress);
      if (done) log(done, "ok");
    });
    return ok ? result : false;
  }

  $("btn-detect").addEventListener("click", async () => {
    const r = await run({ detect: true }, null);
    if (!r || !r.chip) return;
    selectChip(r.chip, true);
    const box = $("compat");
    box.textContent = "";
    if (r.others && r.others.length) {
      const t = document.createElement("span"); t.className = "small"; t.textContent = "Compatible names:";
      box.append(t);
      for (const n of r.others) {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = n;
        b.addEventListener("click", () => { try { selectChip(db().find(n, state.prog)); } catch (e) { log(errorText(e), "error"); } });
        box.append(b);
      }
      box.hidden = false;
    } else box.hidden = true;
  });

  function download(data, name) {
    const url = URL.createObjectURL(new Blob([data], { type: "application/octet-stream" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  $("btn-read").addEventListener("click", async () => {
    const bar = startProgress();
    const r = await run({ read: true }, null, bar);
    endProgress(r);
    if (!r || !r.data) return;
    const name = `${r.chip.name.replace(/[^A-Za-z0-9]+/g, "_").replace(/_+$/, "")}${memory() === "data" ? "_data" : ""}.bin`;
    download(r.data, name);
    log(`Saved as ${name}.`, "ok");
  });
  $("btn-blank").addEventListener("click", async () => { const bar = startProgress(); endProgress(await run({ blank: true }, null, bar)); });
  $("btn-erase").addEventListener("click", () => {
    if (confirm(`Erase the whole ${state.chip.name}?`)) run({ erase: true }, null);
  });

  /* ---------- File ---------- */

  function loadFile(file) {
    if (state.busy) return;
    file.arrayBuffer().then((buf) => {
      const bytes = new Uint8Array(buf);
      try {
        if (!bytes.length) throw new Error("The file is empty.");
        const hexLike = /\.(hex|ihx)$/i.test(file.name);
        state.fw = { name: file.name, parsed: hexLike ? FW.readFirmware(file.name, bytes) : { kind: "bin", segs: [{ addr: 0, data: bytes }], ended: true } };
        log(`Loaded ${file.name}.`);
      } catch (err) {
        state.fw = { name: file.name, error: err.message };
        log(`${file.name}: ${err.message}`, "error");
      }
      showFirmware();
      update();
    });
  }

  function image() {
    const fw = state.fw, n = memSize();
    if (fw.parsed.kind === "bin") {
      const d = fw.parsed.segs[0].data;
      return { image: d, errors: n && d.length > n ? [`The file has ${d.length.toLocaleString("en")} bytes, but the ${memory()} memory of the chip has ${n.toLocaleString("en")} bytes.`] : [], warnings: [] };
    }
    const r = FW.buildImage(fw.parsed, 0, 0, 0x10000000);
    if (r.image && n && r.image.length > n) r.errors.push(`The file needs ${r.image.length.toLocaleString("en")} bytes, but the ${memory()} memory of the chip has ${n.toLocaleString("en")} bytes.`);
    return r;
  }
  function fwErrors() {
    if (!state.fw) return [];
    if (state.fw.error) return [state.fw.error];
    return image().errors;
  }

  function showFirmware() {
    const fw = state.fw;
    const ul = $("fw-messages");
    ul.textContent = "";
    const msg = (cls, t) => { const li = document.createElement("li"); li.className = cls; li.textContent = t; ul.append(li); };
    $("fit").hidden = true;
    if (!fw) return;
    $("drop").classList.add("loaded");
    $("fw-name").textContent = fw.name;
    if (fw.error) { $("fw-info").textContent = "Choose another file."; msg("error", fw.error); return; }
    const r = image(), p = fw.parsed;
    if (r.image) {
      const parts = [`${p.kind.toUpperCase()} file`, `${r.image.length.toLocaleString("en")} bytes`];
      $("fw-info").textContent = parts.join(", ") + ". Choose another file to replace it.";
      const n = memSize();
      if (n) {
        $("fit").hidden = false;
        $("fit").classList.toggle("over", r.image.length > n);
        $("fit-used").style.width = `${Math.min(100, (r.image.length / n) * 100)}%`;
        $("fit-text").textContent = `${(r.image.length / n * 100).toFixed(1)} % of the ${memory()} memory of the ${state.chip.name} (${n.toLocaleString("en")} bytes).`;
      }
    }
    r.errors.forEach((e) => msg("error", e));
    r.warnings.filter((w) => !/option bytes/.test(w)).forEach((w) => msg("warning", w));
    if (p.kind === "hex" && !p.ended) msg("warning", "The HEX file has no end record; it may be incomplete.");
  }

  $("file-input").addEventListener("change", (ev) => { if (ev.target.files[0]) loadFile(ev.target.files[0]); ev.target.value = ""; });
  const isFiles = (ev) => ev.dataTransfer && [...ev.dataTransfer.types].includes("Files");
  let depth = 0;
  window.addEventListener("dragenter", (ev) => { if (isFiles(ev)) { depth++; document.body.classList.add("dragging"); } });
  window.addEventListener("dragleave", (ev) => { if (isFiles(ev) && --depth <= 0) { depth = 0; document.body.classList.remove("dragging"); } });
  window.addEventListener("dragover", (ev) => { if (isFiles(ev)) ev.preventDefault(); });
  window.addEventListener("drop", (ev) => {
    if (!isFiles(ev)) return;
    ev.preventDefault();
    depth = 0;
    document.body.classList.remove("dragging");
    if (ev.dataTransfer.files[0]) loadFile(ev.dataTransfer.files[0]);
  });

  /* ---------- Write and verify ---------- */

  const LABEL = { write: "Writing", verify: "Verifying", read: "Reading", blank: "Blank check" };
  function startProgress() {
    $("progress").hidden = false;
    const bar = $("progress-bar"), label = $("progress-label");
    bar.style.width = "0%";
    bar.className = "";
    label.textContent = "";
    return (phase, f) => {
      bar.style.width = `${Math.round(f * 100)}%`;
      bar.className = phase === "verify" || phase === "blank" ? "verify" : "";
      label.textContent = `${LABEL[phase] || phase} ${Math.round(f * 100)} %`;
    };
  }
  function endProgress(ok) {
    if (ok === null) { $("progress").hidden = true; return; }
    $("progress-label").textContent = ok ? "Done" : "Failed";
  }

  $("btn-write").addEventListener("click", async () => {
    const r = image();
    if (r.errors.length) { log(r.errors[0], "error"); return; }
    const c = state.chip;
    if (!confirm(`Write ${state.fw.name} to the ${memory()} memory of the ${c.name}?${c.canErase && memory() === "code" ? " The chip is erased first." : ""}`)) return;
    const ok = await run({ write: r.image, protect: $("opt-protect").checked }, `${state.fw.name} written and verified.`, startProgress());
    endProgress(ok);
  });
  $("btn-verify").addEventListener("click", async () => {
    const r = image();
    if (r.errors.length) { log(r.errors[0], "error"); return; }
    const ok = await run({ verify: r.image }, null, startProgress());
    endProgress(ok);
  });

  window.addEventListener("beforeunload", (ev) => { if (state.busy) { ev.preventDefault(); ev.returnValue = ""; } });

  /* ---------- Start ---------- */

  update();
  T.loadDatabase().then((dbs) => {
    state.dbs = dbs;
    searchNote();
    update();
    if ($("chip-search").value) showSuggestions();
  }).catch((err) => {
    $("search-note").textContent = `The chip database could not be loaded (${err.message}).`;
  });
  autoConnect();
})();
