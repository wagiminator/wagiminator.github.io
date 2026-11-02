/* AVR Serial UPDI Programmer: user interface (protocol in updi.js, files in /assets/js/firmware.js) */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const U = window.UPDI, FW = window.FIRMWARE;
  const hex = (v, n) => "0x" + v.toString(16).padStart(n || 2, "0");
  const DEFAULT_FAMILY = "tiny1";            // fuse table shown before a chip was read
  const MAX_FLASH = Math.max(...U.DEVICES.map((d) => d.flashSize));

  const state = {
    port: null,         // SerialPort
    busy: false,
    fw: null,           // { name, parsed } or { name, error }
    chip: null,         // { name, family, signature, flashSize, pageSize, sib, nvm, revision, serial }
    family: DEFAULT_FAMILY,
    fuses: {},          // fuse number -> value read from (or written to) the chip
  };
  const fam = () => U.FAMILIES[state.family];
  const fuseList = () => U.fuseInfo(state.family);

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
    if (err && err.name === "NetworkError") return "The port could not be opened. Close other programs that use it (serial monitor, megaupdi, Arduino IDE) and try again.";
    if (err && err.name === "InvalidStateError") return "The port is already open. Wait a moment and try again.";
    return err && err.message ? err.message : String(err);
  }

  /* ---------- Fuse table ---------- */

  // UPDI pin setting of a fuse value: true = UPDI stays enabled, null = fuse has no UPDI setting
  function updiKept(n, v) {
    const p = fam().updiPin;
    if (!p || p.fuse !== n) return null;
    return p.values.includes((v & p.mask) >> p.shift);
  }

  // Plain-language reading of a fuse value
  function meaning(n, v) {
    const f = fam(), v0 = U.isV0(state.family);
    const info = fuseList().find((x) => x.n === n);
    switch (info ? info.name : "") {
      case "WDTCFG": return (v & 0x0f) ? "watchdog on at reset" : "watchdog off";
      case "BODCFG": return (v & 0x0c) ? `brown-out detector on, level ${v >> 5}` : "brown-out detector off";
      case "OSCCFG": {
        if (!f.osc) return "";
        const sel = (v & f.osc.mask) >> f.osc.shift;
        const mhz = Object.keys(f.osc.values).find((k) => f.osc.values[k] === sel);
        return (mhz ? `${mhz} MHz oscillator` : "reserved oscillator setting") + (v0 && v & 0x80 ? ", calibration locked" : "");
      }
      case "SYSCFG0": {
        const parts = [];
        if (v0 && f.updiPin) parts.push(`pin: ${["GPIO (UPDI disabled!)", "UPDI", "RESET (UPDI disabled!)", "reserved (UPDI may be disabled!)"][(v >> 2) & 3]}`);
        else if (updiKept(n, v) !== null) parts.push(updiKept(n, v) ? "UPDI pin: UPDI" : "UPDI pin: GPIO (UPDI disabled!)");
        if (v & 1) parts.push("EEPROM kept on erase");
        return parts.join(", ");
      }
      case "SYSCFG1": return `start-up time ${[0, 1, 2, 4, 8, 16, 32, 64][v & 7]} ms`;
      case "APPEND": case "CODESIZE":
        if (!v) return info.name === "APPEND" ? "no application data section" : "whole flash for code";
        return info.block ? `application code ends at ${(v * info.block).toLocaleString("en")} bytes` : `${v} blocks`;
      case "BOOTEND": case "BOOTSIZE":
        if (!v) return "no boot section";
        return info.block ? `boot section ${(v * info.block).toLocaleString("en")} bytes` : `${v} blocks`;
      case "LOCKBIT": return v === 0xc5 ? "not locked" : "locked";
      default: {
        const k = updiKept(n, v);
        return k === null ? "" : k ? "UPDI pin enabled" : "UPDI disabled!";
      }
    }
  }
  const dangerous = (n, v) => updiKept(n, v) === false || (U.isV0(state.family) && n === 10 && v !== 0xc5);

  function buildFuseRows() {
    const tb = $("fuse-rows");
    tb.textContent = "";
    for (const f of fuseList()) {
      const tr = document.createElement("tr");
      tr.dataset.n = f.n;
      tr.innerHTML = `<td class="num">${f.n}</td><td class="name">${f.name}<small>${f.text}</small></td><td class="cur">–</td>` +
        `<td><input type="text" inputmode="text" spellcheck="false" autocomplete="off" aria-label="New value of ${f.name}" placeholder="0x.."></td><td class="meaning"></td>`;
      tb.append(tr);
      tr.querySelector("input").addEventListener("input", () => { showFuse(f.n); update(); });
    }
    $("fuse-family").textContent = state.chip ? `Fuses of the ${U.FAMILY_NAMES[state.family]} (${state.chip.name}).` : `Fuses of the ${U.FAMILY_NAMES[state.family]}; the table changes to the connected chip once it has been read.`;
    fuseList().forEach((f) => showFuse(f.n));
  }

  // Value of the input: undefined = empty, NaN = invalid
  function inputValue(n) {
    const el = document.querySelector(`#fuse-rows tr[data-n="${n}"] input`);
    const s = el ? el.value.trim() : "";
    if (!s) return undefined;
    if (!/^(0x)?[0-9a-f]{1,2}$/i.test(s)) return NaN;
    return parseInt(s.replace(/^0x/i, ""), 16);
  }

  function showFuse(n) {
    const tr = document.querySelector(`#fuse-rows tr[data-n="${n}"]`);
    if (!tr) return;
    const cur = state.fuses[n], v = inputValue(n), inp = tr.querySelector("input");
    tr.querySelector(".cur").textContent = cur === undefined ? "–" : hex(cur);
    inp.classList.toggle("bad", Number.isNaN(v));
    inp.classList.toggle("changed", v !== undefined && !Number.isNaN(v) && v !== cur);
    const m = tr.querySelector(".meaning"), shown = v !== undefined && !Number.isNaN(v) ? v : cur;
    m.textContent = shown === undefined ? "" : meaning(n, shown);
    m.classList.toggle("warn", shown !== undefined && dangerous(n, shown));
  }

  // Show the values read from the chip
  function setFuses(values, fillInputs) {
    Object.assign(state.fuses, values);
    for (const [n, v] of Object.entries(values)) {
      const el = document.querySelector(`#fuse-rows tr[data-n="${n}"] input`);
      if (fillInputs && el) el.value = hex(v);
    }
    fuseList().forEach((f) => showFuse(f.n));
  }

  // Changed fuses as [[n, value], ...]; null if an entry is invalid
  function changedFuses() {
    const out = [];
    for (const f of fuseList()) {
      const v = inputValue(f.n);
      if (Number.isNaN(v)) return null;
      if (v !== undefined && v !== state.fuses[f.n]) out.push([f.n, v]);
    }
    return out;
  }

  // Ask before settings that disable UPDI, lock the chip or change PDICFG
  function confirmFuses(list) {
    const v0 = U.isV0(state.family);
    for (const [n, v] of list) {
      const name = (fuseList().find((f) => f.n === n) || {}).name || `Fuse ${n}`;
      if (updiKept(n, v) === false &&
        !confirm(`${name} = ${hex(v)} turns the UPDI pin into a normal pin. The chip can then NOT be programmed over UPDI any more, only with a high-voltage programmer. Write it anyway?`)) return false;
      if (v0 && n === 10 && v !== 0xc5 && !confirm(`LOCKBIT = ${hex(v)} locks the chip: flash and EEPROM can no longer be read, and only a chip erase unlocks it. Write it anyway?`)) return false;
      if (!v0 && name === "PDICFG" && !confirm(`PDICFG = ${hex(v)} configures the programming interface. Some values lock UPDI permanently and the chip can never be programmed again. Write it anyway?`)) return false;
    }
    return true;
  }

  // Clock select: every frequency the oscillator setting supports
  for (const t of U.trimFrequencies()) {
    const o = document.createElement("option");
    o.value = t.freq;
    const mhz = (t.freq / 1e6).toLocaleString("en", { maximumFractionDigits: 3 });
    o.textContent = `${mhz} MHz (${t.osc} MHz oscillator${t.div > 1 ? ` / ${t.div}` : ""})`;
    $("osc").append(o);
  }

  /* ---------- Supported chips ---------- */

  function showChipList() {
    const body = $("chip-list");
    body.textContent = "";
    for (const [key, name] of Object.entries(U.FAMILY_NAMES)) {
      const devs = U.DEVICES.filter((d) => d.family === key);
      if (!devs.length) continue;
      const tr = document.createElement("tr");
      tr.dataset.family = key;
      const a = document.createElement("td"); a.textContent = name;
      const b = document.createElement("td"); b.textContent = devs.map((d) => d.name).join(", ");
      tr.append(a, b);
      body.append(tr);
    }
    $("chip-count").textContent = U.DEVICES.length;
  }

  /* ---------- Controls ---------- */

  function update() {
    const ok = !!navigator.serial, idle = !state.busy && ok;
    const fuses = changedFuses();
    const settings = $("opt-settings").checked;
    $("btn-flash").disabled = !idle || !state.fw || fwErrors().length > 0 || (settings && fuses === null);
    for (const id of ["btn-info", "btn-erase", "btn-readfuses", "btn-port"]) $(id).disabled = !idle;
    $("btn-trim").disabled = !idle || !$("osc").value;
    $("btn-writefuses").disabled = !idle || !fuses || !fuses.length;
    $("file-input").disabled = state.busy;
    $("baud").disabled = state.busy;
    $("conn").className = "conn" + (state.busy ? " busy" : state.port ? " connected" : "");
    $("conn-text").textContent = state.busy ? "Working …" : state.port ? "Serial port chosen" : "No port chosen";
    let note = "Every action asks for the serial port the first time.";
    if (state.port) {
      const i = state.port.getInfo ? state.port.getInfo() : {};
      note = (i.usbVendorId !== undefined ? `USB ID ${i.usbVendorId.toString(16).padStart(4, "0")}:${i.usbProductId.toString(16).padStart(4, "0")}, ` : "") + `UPDI at ${$("baud").value} baud`;
    }
    $("link-note").textContent = note;
  }

  $("baud").addEventListener("change", update);
  $("osc").addEventListener("change", update);
  $("opt-settings").addEventListener("change", update);

  /* ---------- Port ---------- */

  async function choose() {
    try {
      state.port = await navigator.serial.requestPort();
      return state.port;
    } catch (e) {
      log("No serial port was chosen. Plug in the USB-to-serial converter; it then appears in the list the browser shows.");
      return null;
    }
  }
  $("btn-port").addEventListener("click", async () => { if (await choose()) log("Port chosen."); update(); });

  if (navigator.serial) {
    navigator.serial.addEventListener("disconnect", (ev) => {
      if (ev.target === state.port) { state.port = null; log("The serial converter was unplugged."); update(); }
    });
  } else {
    $("unsupported").hidden = false;
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
      showFirmware();
    }
  }

  // One session as in megaupdi.py: connect, act, reset the chip and release UPDI.
  // A locked chip is unlocked (erased) only for erase and flash.
  async function run(actions, done, progress) {
    const port = state.port || (await choose());   // needs the click that started this
    if (!port) return null;
    return busy(async () => {
      const prog = new U.Programmer(port, Number($("baud").value));
      log("Connecting to the chip over UPDI …");
      await prog.connect();
      log(`Found ${prog.sibFamily} with NVM controller P:${prog.nvmVersion}${prog.locked ? " (locked)" : ""}.`);
      try {
        await U.runActions(prog, actions, (t) => log(t, /^Warning/.test(t) ? "error" : undefined), progress);
      } finally {
        if (prog.device) showChip(prog);
      }
      // What the chip holds now
      const known = {};
      if (prog.fuses) Object.assign(known, prog.fuses);
      for (const [n, v] of actions.fuses || []) known[n] = v;
      if (prog.trimmed) known[prog.trimmed.fuse] = prog.trimmed.value;
      if (prog.unlocked && U.isV0(state.family)) known[10] = 0xc5;
      setFuses(known, !!prog.fuses);
      if (done) log(done, "ok");
    });
  }

  function showChip(prog) {
    const d = prog.device;
    const prev = showChip.last;
    state.chip = { name: d.name, family: d.family, signature: prog.signature, flashSize: d.flashSize, pageSize: d.pageSize, sib: prog.sib, nvm: prog.nvmVersion };
    if (prev && prev.name === d.name) { state.chip.revision = prev.revision; state.chip.serial = prev.serial; }
    else state.fuses = {};
    if (prog.revision !== undefined) state.chip.revision = prog.revision;
    if (prog.serial) state.chip.serial = prog.serial;
    showChip.last = state.chip;
    if (state.family !== d.family || !prev) { state.family = d.family; buildFuseRows(); }
    const c = state.chip, dl = $("chip-facts");
    dl.textContent = "";
    const rows = [
      ["Chip", c.name], ["Family", U.FAMILY_NAMES[c.family]], ["Signature", hex(c.signature, 6)],
      ["Flash", `${c.flashSize.toLocaleString("en")} bytes (${c.flashSize / 1024} KB), pages of ${c.pageSize} bytes`],
      ["UPDI", `NVM controller P:${c.nvm}, ${c.nvm === "0" ? "16" : "24"}-bit addresses`],
    ];
    if (c.revision !== undefined) {
      // REVID: tinyAVR/megaAVR 0: 0 = A, 1 = B, ...; AVR Dx/Ex/...: major (A, B, ...) and minor number
      const rv = c.nvm === "0" ? String.fromCharCode(65 + c.revision) : String.fromCharCode(65 + (c.revision >> 4)) + (c.revision & 0x0f);
      rows.push(["Revision", rv]);
    }
    if (c.serial) rows.push(["Serial number", c.serial.map((b) => b.toString(16).padStart(2, "0")).join(" ")]);
    for (const [k, v] of rows) {
      const dt = document.createElement("dt"); dt.textContent = k;
      const dd = document.createElement("dd"); dd.textContent = v;
      dl.append(dt, dd);
    }
    for (const tr of document.querySelectorAll("#chip-list tr")) tr.classList.toggle("found", tr.dataset.family === c.family);
    fuseList().forEach((f) => showFuse(f.n));
  }

  $("btn-info").addEventListener("click", () => run({ info: true }, "Chip info and fuses read."));
  $("btn-readfuses").addEventListener("click", () => run({ info: true }, "Fuses read."));
  $("btn-erase").addEventListener("click", () => {
    if (confirm("Erase the chip? Flash and EEPROM are cleared.")) run({ erase: true }, "Chip erased.");
  });
  $("btn-writefuses").addEventListener("click", () => {
    const list = changedFuses();
    if (!list || !list.length || !confirmFuses(list)) return;
    run({ fuses: list }, "Fuses written and verified.");
  });
  $("btn-trim").addEventListener("click", () => {
    const f = Number($("osc").value);
    if (f) run({ trim: f }, `Oscillator set for ${(f / 1e6).toLocaleString("en", { maximumFractionDigits: 3 })} MHz.`);
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

  const flashSize = () => (state.chip && state.chip.flashSize) || MAX_FLASH;   // largest supported AVR
  const image = () => FW.buildImage(state.fw.parsed, 0, flashSize());
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
      if (p.kind === "hex") {
        const segs = p.segs.filter((s) => s.addr < 0x100000);
        const lo = Math.min(...segs.map((s) => s.addr)), hi = Math.max(...segs.map((s) => s.addr + s.data.length)) - 1;
        parts.push(`addresses ${hex(lo, 4)}–${hex(hi, hi > 0xffff ? 5 : 4)}`);
      }
      $("fw-info").textContent = parts.join(", ") + ". Choose another file to replace it.";
      if (state.chip) {
        const size = state.chip.flashSize;
        $("fit").hidden = false;
        $("fit").classList.toggle("over", r.image.length > size);
        $("fit-used").style.width = `${Math.min(100, (r.image.length / size) * 100)}%`;
        $("fit-text").textContent = `${(r.image.length / size * 100).toFixed(1)} % of the ${size / 1024} KB flash of the ${state.chip.name}`;
      }
    }
    r.errors.forEach((e) => msg("error", e));
    // avr-gcc puts EEPROM data at 0x810000 and fuses at 0x820000
    r.warnings.forEach((w) => msg("warning", /outside the code flash/.test(w)
      ? "The file also holds EEPROM, fuse or lock bit data (from 0x810000 upwards). Only the flash part is written; set fuses under Clock and fuses."
      : w));
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
    const r = image();
    if (r.errors.length) { log(r.errors[0], "error"); return; }
    const actions = { flash: r.image };
    if ($("opt-settings").checked) {
      const list = changedFuses();
      if (list === null) { log("A fuse value is not a valid hex byte.", "error"); return; }
      if (list.length && !confirmFuses(list)) return;
      if (list.length) actions.fuses = list;
      if ($("osc").value) actions.trim = Number($("osc").value);
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

  window.addEventListener("beforeunload", (ev) => { if (state.busy) { ev.preventDefault(); ev.returnValue = ""; } });

  showChipList();
  buildFuseRows();
  update();
})();
