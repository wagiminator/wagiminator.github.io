/* AVR ISP Programmer: user interface (protocol in avrisp.js, chip data in parts.js and fusebits.js) */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const A = window.AVRISP, FW = window.FIRMWARE, BITS = window.AVR_FUSEBITS;
  const hex = (v, n) => "0x" + v.toString(16).padStart(n || 2, "0");

  const state = {
    device: null,       // USBDevice of the programmer
    busy: false,
    fw: null,           // { name, parsed } or { name, error }
    chip: null,         // { id, name, signature, candidates, cal }
    fuses: {},          // fuse name -> value read from (or written to) the chip
  };

  /* ---------- Log ---------- */

  function log(text, cls) {
    const li = document.createElement("li");
    if (cls) li.className = cls;
    const t = document.createElement("time");
    t.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    li.append(t, text);
    $("log").append(li);
    $("log").scrollTop = $("log").scrollHeight;
  }

  function errorText(err) {
    if (err && err.name === "SecurityError") return "The browser may not access this programmer. On Linux add the udev rules, on Windows install the WinUSB driver with Zadig (see More options).";
    if (err && err.name === "NetworkError") return "The programmer could not be opened. Close other programs that use it (avrdude, Arduino IDE) and try again. On Windows it needs the WinUSB driver.";
    return err && err.message ? err.message : String(err);
  }

  /* ---------- Controls ---------- */

  function update() {
    const ok = !!navigator.usb, idle = !state.busy && ok;
    const fuses = changedFuses();
    const withFuses = $("opt-fuses").checked;
    $("btn-flash").disabled = !idle || !state.fw || fwErrors().length > 0 || (withFuses && fuses === null);
    for (const id of ["btn-info", "btn-erase", "btn-dev", "btn-readfuses"]) $(id).disabled = !idle;
    $("btn-writefuses").disabled = !idle || !fuses || !fuses.length;
    $("btn-defaults").disabled = state.busy || !state.chip;
    $("opt-fuses").disabled = state.busy || !state.chip;
    $("file-input").disabled = state.busy;
    $("variant").disabled = state.busy;
    const kind = state.device && A.kindOf(state.device);
    $("sck-asp").disabled = state.busy || kind === "usbtiny";
    $("sck-tiny").disabled = state.busy || kind === "usbasp";
    $("conn").className = "conn" + (state.busy ? " busy" : state.device ? " connected" : "");
    $("conn-text").textContent = state.busy ? "Working …" : state.device ? `${A.PROGRAMMERS[kind].name} chosen` : "No programmer chosen";
    $("link-note").textContent = state.device
      ? `USB ID ${state.device.vendorId.toString(16).padStart(4, "0")}:${state.device.productId.toString(16).padStart(4, "0")}${state.device.productName ? `, ${state.device.productName}` : ""}`
      : "USBasp (16C0:05DC) or USBtinyISP (1781:0C9F).";
    $("btn-dev").textContent = state.device ? "Choose another programmer" : "Choose programmer";
  }

  /* ---------- Programmer ---------- */

  async function choose() {
    try {
      state.device = await navigator.usb.requestDevice({ filters: A.ALL_FILTERS });
      return state.device;
    } catch (e) {
      log("No programmer was chosen. Plug in the USBasp or USBtinyISP; it then appears in the list the browser shows.");
      return null;
    }
  }
  $("btn-dev").addEventListener("click", async () => { if (await choose()) log(`${A.PROGRAMMERS[A.kindOf(state.device)].name} chosen.`); update(); });

  if (navigator.usb) {
    navigator.usb.addEventListener("disconnect", (ev) => {
      if (ev.device === state.device) { state.device = null; log("The programmer was unplugged."); update(); }
    });
    // A programmer allowed before is ready without asking
    navigator.usb.getDevices().then((devs) => {
      const d = devs.find((x) => A.ALL_FILTERS.some((f) => f.vendorId === x.vendorId && f.productId === x.productId));
      if (d && !state.device) { state.device = d; update(); }
    }).catch(() => {});
  } else {
    $("unsupported").hidden = false;
  }

  /* ---------- Running avrdude-like sessions ---------- */

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
      showFirmware();
    }
  }

  function options() {
    return { sckHz: Number($("sck-asp").value), sckPeriod: Number($("sck-tiny").value), part: state.chip && state.chip.id };
  }

  async function run(actions, done, progress) {
    const dev = state.device || (await choose());   // needs the click that started this
    if (!dev) return null;
    return busy(async () => {
      const s = new A.Session(dev, options());
      try {
        await A.run(s, actions, (t) => log(t), progress);
      } finally {
        if (s.candidates) showChip(s);
      }
      if (s.fuseValues) setFuses(s.fuseValues, true);
      if (done) log(done, "ok");
    });
  }

  function showChip(s) {
    const p = s.p, changed = !state.chip || state.chip.id !== p.id;
    state.chip = { id: p.id, name: p.name, signature: s.signature, candidates: s.candidates, cal: s.cal || (state.chip && !changed ? state.chip.cal : null), part: p };
    if (changed) { state.fuses = {}; buildFuseEditor(); }
    const dl = $("chip-facts");
    dl.textContent = "";
    const f = p.flash, rows = [
      ["Chip", p.name], ["Signature", s.signature.map((b) => hex(b)).join(" ")],
      ["Flash", `${f.size.toLocaleString("en")} bytes (${f.size / 1024} KB), pages of ${f.pageSize} bytes`],
      ["avrdude part", `-p ${p.id}`],
    ];
    if (state.chip.cal) rows.push(["Calibration", state.chip.cal.map((b) => hex(b)).join(" ")]);
    for (const [k, v] of rows) {
      const dt = document.createElement("dt"); dt.textContent = k;
      const dd = document.createElement("dd"); dd.textContent = v;
      dl.append(dt, dd);
    }
    const sel = $("variant");
    sel.textContent = "";
    for (const id of s.candidates) {
      const o = document.createElement("option");
      o.value = id; o.textContent = A.part(id).name; o.selected = id === p.id;
      sel.append(o);
    }
    $("variant-row").hidden = s.candidates.length < 2;
    showFirmware();
  }

  $("variant").addEventListener("change", () => {
    const id = $("variant").value, p = A.part(id);
    if (!state.chip || !p) return;
    state.chip.id = id; state.chip.name = p.name; state.chip.part = p;
    const keep = state.fuses;
    buildFuseEditor();
    setFuses(keep, true);
    $("chip-facts").querySelector("dd").textContent = p.name;
    log(`Chip type set to ${p.name}.`);
    showFirmware();
    update();
  });

  $("btn-info").addEventListener("click", () => run({ info: true }, "Chip info read."));
  $("btn-readfuses").addEventListener("click", () => run({ info: true }, "Fuses read."));
  $("btn-erase").addEventListener("click", () => {
    if (confirm("Erase the chip? Flash, EEPROM (unless EESAVE is set) and lock bits are cleared.")) run({ erase: true }, "Chip erased.");
  });

  /* ---------- Fuse editor ---------- */

  // Fuse memories of the chip with their bit fields from avrintel.c
  function fuseLayout() {
    if (!state.chip) return [];
    const p = state.chip.part, t = BITS.tables[BITS.byPart[p.id]] || [];
    return p.fuses.filter((m) => m.read && m.write).map((m) => ({
      m, fields: t.filter((f) => f[1] === m.name).map(([name, mem, mask, lsh, init, text, values]) => ({ name, mask, lsh, init, text, values })),
    }));
  }

  function buildFuseEditor() {
    const box = $("fuse-bytes");
    box.textContent = "";
    const layout = fuseLayout();
    $("fuse-empty").hidden = layout.length > 0;
    for (const { m, fields } of layout) {
      const div = document.createElement("div");
      div.className = "fuse-byte";
      div.dataset.fuse = m.name;
      div.innerHTML = `<div class="fuse-head"><h3>${m.name}</h3><input type="text" spellcheck="false" autocomplete="off" aria-label="New value of ${m.name}" placeholder="0x.."><span class="cur">chip: –</span></div>`;
      const grid = document.createElement("div");
      grid.className = "fields";
      for (const f of fields) {
        const id = `f-${m.name}-${f.name}`;
        const lab = document.createElement("label");
        lab.htmlFor = id;
        lab.innerHTML = `<b>${f.name.toUpperCase()}</b> ${f.text}`;
        const sel = document.createElement("select");
        sel.id = id; sel.dataset.field = f.name;
        for (const [v, t] of f.values) {
          const o = document.createElement("option");
          o.value = v; o.textContent = `${t} (${v})`;
          sel.append(o);
        }
        sel.addEventListener("change", () => {
          const cur = inputValue(m.name);
          const base = cur === undefined || Number.isNaN(cur) ? (state.fuses[m.name] !== undefined ? state.fuses[m.name] : defaultValue(m, fields)) : cur;
          setInput(m.name, (base & ~f.mask & 0xff) | ((Number(sel.value) << f.lsh) & f.mask));
        });
        grid.append(lab, sel);
      }
      div.append(grid);
      if (!fields.length) {
        const p = document.createElement("p");
        p.className = "small"; p.textContent = "No field descriptions for this fuse; enter the value as hex.";
        div.append(p);
      }
      div.querySelector("input").addEventListener("input", () => { showFuse(m.name); update(); });
      box.append(div);
    }
    layout.forEach(({ m }) => showFuse(m.name));
  }

  function defaultValue(m, fields) {
    if (m.initval >= 0) return m.initval;
    let v = 0xff;
    for (const f of fields) if (f.init >= 0) v = (v & ~f.mask) | ((f.init << f.lsh) & f.mask);
    return v;
  }

  const box = (name) => document.querySelector(`.fuse-byte[data-fuse="${name}"]`);
  function inputValue(name) {
    const b = box(name);
    if (!b) return undefined;
    const s = b.querySelector("input").value.trim();
    if (!s) return undefined;
    if (!/^(0x)?[0-9a-f]{1,2}$/i.test(s)) return NaN;
    return parseInt(s.replace(/^0x/i, ""), 16);
  }
  function setInput(name, v) { box(name).querySelector("input").value = hex(v); showFuse(name); update(); }

  function showFuse(name) {
    const b = box(name);
    if (!b) return;
    const L = fuseLayout().find((x) => x.m.name === name), cur = state.fuses[name], v = inputValue(name), inp = b.querySelector("input");
    b.querySelector(".cur").textContent = cur === undefined ? "chip: –" : `chip: ${hex(cur)}`;
    inp.classList.toggle("bad", Number.isNaN(v));
    inp.classList.toggle("changed", v !== undefined && !Number.isNaN(v) && v !== cur);
    const shown = v !== undefined && !Number.isNaN(v) ? v : cur;
    for (const f of L.fields) {
      const sel = b.querySelector(`select[data-field="${f.name}"]`);
      sel.querySelectorAll("option.other").forEach((o) => o.remove());
      if (shown === undefined) { sel.selectedIndex = -1; sel.classList.remove("warn"); continue; }
      const fv = (shown & f.mask) >> f.lsh;
      if (!f.values.some(([x]) => x === fv)) {
        const o = document.createElement("option");
        o.className = "other"; o.value = fv; o.textContent = `other value (${fv})`;
        sel.append(o);
      }
      sel.value = String(fv);
      sel.classList.toggle("warn", !!danger(f, fv));
    }
  }

  // Why a field value is risky, or null
  function danger(f, v) {
    const text = (f.values.find(([x]) => x === v) || [0, ""])[1];
    if (f.name === "rstdisbl" && v === 0) return "turns the reset pin into an I/O pin: ISP is then no longer possible (only with a high-voltage programmer)";
    if (f.name === "dwen" && v === 0) return "turns on debugWIRE: ISP is then no longer possible until debugWIRE is switched off with a debugger";
    if (f.name === "spien" && v === 1) return "disables serial programming (ISP)";
    if ((f.name === "sut_cksel" || f.name === "cksel") && /^ext/.test(text)) return `selects "${text}": the chip then only runs, and can only be programmed, with that external clock source`;
    if (f.name === "lb" && v !== 3) return "locks the chip: flash and EEPROM can no longer be read or programmed until a chip erase";
    return null;
  }

  function setFuses(values, fillInputs) {
    Object.assign(state.fuses, values);
    for (const [n, v] of Object.entries(values)) if (fillInputs && box(n)) box(n).querySelector("input").value = hex(v);
    fuseLayout().forEach(({ m }) => showFuse(m.name));
    update();
  }

  // Changed fuses as [[name, value], ...] in avrdude's order; null if an entry is invalid
  function changedFuses() {
    const out = [];
    for (const { m } of fuseLayout()) {
      const v = inputValue(m.name);
      if (Number.isNaN(v)) return null;
      if (v !== undefined && v !== state.fuses[m.name]) out.push([m.name, v]);
    }
    // lock bits last, so fuses can still be written
    out.sort((a, b) => (a[0] === "lock") - (b[0] === "lock"));
    return out;
  }

  function confirmFuses(list) {
    const L = fuseLayout(), warn = [];
    for (const [name, v] of list) {
      const { fields } = L.find((x) => x.m.name === name);
      const old = state.fuses[name];
      for (const f of fields) {
        const fv = (v & f.mask) >> f.lsh;
        if (old !== undefined && ((old & f.mask) >> f.lsh) === fv) continue;
        const d = danger(f, fv);
        if (d) warn.push(`${name} ${f.name.toUpperCase()}: ${d}.`);
      }
    }
    if (!warn.length) return true;
    return confirm(`Careful:\n\n${warn.join("\n\n")}\n\nWrite these fuses anyway?`);
  }

  $("btn-defaults").addEventListener("click", () => {
    for (const { m, fields } of fuseLayout()) setInput(m.name, defaultValue(m, fields));
    log("Factory default values entered; choose Write changed fuses to program them.");
  });

  $("btn-writefuses").addEventListener("click", () => {
    const list = changedFuses();
    if (!list || !list.length || !confirmFuses(list)) return;
    run({ fuses: list, expectPart: state.chip.id, readBack: true }, "Fuses written and verified.");
  });

  /* ---------- Firmware ---------- */

  function loadFile(file) {
    if (state.busy) return;
    file.arrayBuffer().then((buf) => {
      try {
        state.fw = { name: file.name, parsed: FW.readFirmware(file.name, new Uint8Array(buf)) };
        log(`Loaded ${file.name}.`);
      } catch (err) {
        state.fw = { name: file.name, error: err.message };
        log(`${file.name}: ${err.message}`, "error");
      }
      showFirmware();
      update();
    });
  }

  const LARGEST = 0x40000;   // ATmega2560/2561: 256 KB
  const image = () => A.flashImage(state.fw.parsed, state.chip ? state.chip.part.flash.size : LARGEST);
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
    const flashSegs = p.segs.filter((s) => s.addr < 0x800000);
    const parts = [`${p.kind.toUpperCase()} file`, `${r.nbytes.toLocaleString("en")} bytes for the flash`];
    if (p.kind === "hex" && flashSegs.length) {
      const lo = Math.min(...flashSegs.map((s) => s.addr)), hi = Math.max(...flashSegs.map((s) => s.addr + s.data.length)) - 1;
      parts.push(`addresses ${hex(lo, 4)}–${hex(hi, hi > 0xffff ? 5 : 4)}`);
    }
    $("fw-info").textContent = parts.join(", ") + ". Choose another file to replace it.";
    if (state.chip) {
      const size = state.chip.part.flash.size, used = r.lastaddr + 1;
      $("fit").hidden = false;
      $("fit").classList.toggle("over", r.errors.length > 0);
      $("fit-used").style.width = `${Math.min(100, (used / size) * 100)}%`;
      $("fit-text").textContent = `${(used / size * 100).toFixed(1)} % of the ${size / 1024} KB flash of the ${state.chip.name}`;
    }
    r.errors.forEach((e) => msg("error", state.chip ? e : e.replace("the chip has", "the largest AVR has")));
    r.warnings.forEach((w) => msg("warning", w));
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

  /* ---------- Flashing ---------- */

  $("btn-flash").addEventListener("click", async () => {
    const actions = { flash: state.fw.parsed, readBack: false };
    if ($("opt-fuses").checked && state.chip) {
      const list = changedFuses();
      if (list === null) { log("A fuse value is not a valid hex byte.", "error"); return; }
      if (list.length && !confirmFuses(list)) return;
      if (list.length) { actions.fuses = list; actions.expectPart = state.chip.id; actions.readBack = true; }
    }
    $("progress").hidden = false;
    const bar = $("progress-bar"), label = $("progress-label");
    bar.style.width = "0%";
    bar.className = "";
    label.textContent = "";
    const ok = await run(actions, `${state.fw.name} flashed and verified.`, (phase, f) => {
      bar.style.width = `${Math.round(f * 100)}%`;
      bar.className = phase === "verify" ? "verify" : "";
      label.textContent = `${phase === "verify" ? "Verifying" : "Writing"} ${Math.round(f * 100)} %`;
    });
    if (ok === null) $("progress").hidden = true;
    label.textContent = ok ? "Done" : "Failed";
  });

  $("opt-fuses").addEventListener("change", update);
  window.addEventListener("beforeunload", (ev) => { if (state.busy) { ev.preventDefault(); ev.returnValue = ""; } });

  update();
})();
