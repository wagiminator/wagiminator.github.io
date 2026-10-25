/* AVR Tiny UPDI Programmer: user interface (protocol in updi.js, files in /assets/js/firmware.js) */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const U = window.UPDI, FW = window.FIRMWARE;
  const hex = (v, n) => "0x" + v.toString(16).padStart(n || 2, "0");

  const state = {
    port: null,         // SerialPort
    busy: false,
    fw: null,           // { name, parsed } or { name, error }
    chip: null,         // { name, signature, flashSize, pageSize, series, revision, serial }
    fuses: {},          // fuse number -> value read from (or written to) the chip
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
    if (err && err.name === "NetworkError") return "The port could not be opened. Close other programs that use it (serial monitor, tinyupdi, Arduino IDE) and try again.";
    if (err && err.name === "InvalidStateError") return "The port is already open. Wait a moment and try again.";
    return err && err.message ? err.message : String(err);
  }

  /* ---------- Fuse table ---------- */

  // Plain-language reading of a fuse value
  function meaning(n, v) {
    switch (n) {
      case 0: return (v & 0x0f) ? "watchdog on at reset" : "watchdog off";
      case 1: return (v & 0x0c) ? `brown-out detector on, level ${v >> 5}` : "brown-out detector off";
      case 2: return ({ 1: "16 MHz", 2: "20 MHz" }[v & 3] || "reserved oscillator setting") + (v & 0x80 ? ", calibration locked" : "");
      case 4: return "";
      case 5: {
        const pin = ["GPIO (UPDI disabled!)", "UPDI", "RESET (UPDI disabled!)", "reserved (UPDI may be disabled!)"][(v >> 2) & 3];
        return `pin: ${pin}${v & 1 ? ", EEPROM kept on erase" : ""}`;
      }
      case 6: return `start-up time ${[0, 1, 2, 4, 8, 16, 32, 64][v & 7]} ms`;
      case 7: return v ? `application code ends at ${(v * 256).toLocaleString("en")} bytes` : "no application data section";
      case 8: return v ? `boot section ${(v * 256).toLocaleString("en")} bytes` : "no boot section";
      case 10: return v === 0xc5 ? "not locked" : "locked";
      default: return "";
    }
  }
  const dangerous = (n, v) => (n === 5 && ((v >> 2) & 3) !== 1) || (n === 10 && v !== 0xc5);

  function buildFuseRows() {
    const tb = $("fuse-rows");
    for (const f of U.FUSES) {
      const tr = document.createElement("tr");
      tr.dataset.n = f.n;
      tr.innerHTML = `<td class="num">${f.n}</td><td class="name">${f.name}<small>${f.text}</small></td><td class="cur">–</td>` +
        `<td><input type="text" inputmode="text" spellcheck="false" autocomplete="off" aria-label="New value of ${f.name}" placeholder="0x.."></td><td class="meaning"></td>`;
      tb.append(tr);
      tr.querySelector("input").addEventListener("input", () => { showFuse(f.n); update(); });
    }
  }

  // Value of the input: undefined = empty, NaN = invalid
  function inputValue(n) {
    const s = document.querySelector(`#fuse-rows tr[data-n="${n}"] input`).value.trim();
    if (!s) return undefined;
    if (!/^(0x)?[0-9a-f]{1,2}$/i.test(s)) return NaN;
    return parseInt(s.replace(/^0x/i, ""), 16);
  }

  function showFuse(n) {
    const tr = document.querySelector(`#fuse-rows tr[data-n="${n}"]`);
    const cur = state.fuses[n], v = inputValue(n), inp = tr.querySelector("input");
    tr.querySelector(".cur").textContent = cur === undefined ? "–" : hex(cur);
    inp.classList.toggle("bad", Number.isNaN(v));
    inp.classList.toggle("changed", v !== undefined && !Number.isNaN(v) && v !== cur);
    const m = tr.querySelector(".meaning"), shown = v !== undefined && !Number.isNaN(v) ? v : cur;
    m.textContent = shown === undefined ? "" : meaning(n, shown);
    m.classList.toggle("warn", shown !== undefined && dangerous(n, shown));
    const f = U.FUSES.find((x) => x.n === n);
    tr.classList.toggle("na", !!(state.chip && f.series && !f.series.includes(state.chip.series)));
  }

  // Fill the table with the values read from the chip
  function setFuses(values, fillInputs) {
    Object.assign(state.fuses, values);
    for (const [n, v] of Object.entries(values)) {
      if (fillInputs) document.querySelector(`#fuse-rows tr[data-n="${n}"] input`).value = hex(v);
    }
    U.FUSES.forEach((f) => showFuse(f.n));
  }

  // Changed fuses as [[n, value], ...]; null if an entry is invalid
  function changedFuses() {
    const out = [];
    for (const f of U.FUSES) {
      const v = inputValue(f.n);
      if (Number.isNaN(v)) return null;
      if (state.chip && f.series && !f.series.includes(state.chip.series)) continue;
      if (v !== undefined && v !== state.fuses[f.n]) out.push([f.n, v]);
    }
    return out;
  }

  // Ask before settings that lock the chip or disable UPDI
  function confirmFuses(list) {
    for (const [n, v] of list) {
      if (n === 5 && ((v >> 2) & 3) !== 1 &&
        !confirm(`SYSCFG0 = ${hex(v)} turns the UPDI pin into a ${((v >> 2) & 3) === 2 ? "RESET" : "GPIO"} pin. The chip can then NOT be programmed over UPDI any more, only with a 12 V high-voltage programmer. Write it anyway?`)) return false;
      if (n === 10 && v !== 0xc5 && !confirm(`LOCKBIT = ${hex(v)} locks the chip: flash and EEPROM can no longer be read, and only a chip erase unlocks it. Write it anyway?`)) return false;
    }
    return true;
  }

  // Clock select: every frequency trim() supports
  for (const t of U.trimFrequencies()) {
    const o = document.createElement("option");
    o.value = t.freq;
    const mhz = (t.freq / 1e6).toLocaleString("en", { maximumFractionDigits: 3 });
    o.textContent = `${mhz} MHz (${t.osc} MHz oscillator${t.div > 1 ? ` / ${t.div}` : ""})`;
    $("osc").append(o);
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

  // One session as in tinyupdi.py: connect, act, reset the chip and release UPDI.
  // unlock: a locked chip may be erased to get access (erase and flash only)
  async function run(actions, unlock, done, progress) {
    const port = state.port || (await choose());   // needs the click that started this
    if (!port) return null;
    return busy(async () => {
      const prog = new U.Programmer(port, Number($("baud").value));
      log("Connecting to the chip over UPDI …");
      await prog.connect(unlock);
      try {
        await U.runActions(prog, actions, (t) => log(t), progress);
      } finally {
        if (prog.device) showChip(prog);
      }
      // What the chip holds now
      const known = {};
      if (prog.fuses) Object.assign(known, prog.fuses);
      for (const [n, v] of actions.fuses || []) known[n] = v;
      if (actions.trim) known[2] = U.trimFor(actions.trim).fuse;
      if (prog.unlocked) known[10] = 0xc5;
      setFuses(known, !!prog.fuses);
      if (done) log(done, "ok");
    });
  }

  function showChip(prog) {
    const d = prog.device;
    state.chip = { name: d.name, signature: prog.signature, flashSize: d.flashSize, pageSize: d.pageSize, series: d.series };
    const prev = showChip.last;
    if (prev && prev.name === d.name) { state.chip.revision = prev.revision; state.chip.serial = prev.serial; }
    else state.fuses = {};
    if (prog.revision !== undefined) state.chip.revision = prog.revision;
    if (prog.serial) state.chip.serial = prog.serial;
    showChip.last = state.chip;
    const c = state.chip, dl = $("chip-facts");
    dl.textContent = "";
    const rows = [
      ["Chip", c.name], ["Series", `tinyAVR ${c.series}-series`], ["Signature", hex(c.signature, 6)],
      ["Flash", `${c.flashSize.toLocaleString("en")} bytes (${c.flashSize / 1024} KB), pages of ${c.pageSize} bytes`],
    ];
    if (c.revision !== undefined) rows.push(["Revision", String.fromCharCode(65 + c.revision)]);
    if (c.serial) rows.push(["Serial number", c.serial.map((b) => b.toString(16).padStart(2, "0")).join(" ")]);
    for (const [k, v] of rows) {
      const dt = document.createElement("dt"); dt.textContent = k;
      const dd = document.createElement("dd"); dd.textContent = v;
      dl.append(dt, dd);
    }
    U.FUSES.forEach((f) => showFuse(f.n));
  }

  $("btn-info").addEventListener("click", () => run({ info: true }, false, "Chip info and fuses read."));
  $("btn-readfuses").addEventListener("click", () => run({ info: true }, false, "Fuses read."));
  $("btn-erase").addEventListener("click", () => {
    if (confirm("Erase the chip? Flash and EEPROM are cleared.")) run({ erase: true }, true, "Chip erased.");
  });
  $("btn-writefuses").addEventListener("click", () => {
    const list = changedFuses();
    if (!list || !list.length || !confirmFuses(list)) return;
    run({ fuses: list }, false, "Fuses written and verified.");
  });
  $("btn-trim").addEventListener("click", () => {
    const f = Number($("osc").value);
    if (f) run({ trim: f }, false, `Oscillator set for ${(f / 1e6).toLocaleString("en", { maximumFractionDigits: 3 })} MHz.`);
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

  const flashSize = () => (state.chip && state.chip.flashSize) || 0x8000;   // largest tinyAVR
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
        parts.push(`addresses ${hex(lo, 4)}–${hex(hi, 4)}`);
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
    const ok = await run(actions, true, `${state.fw.name} flashed and verified.`, (phase, f) => {
      bar.style.width = `${Math.round(f * 100)}%`;
      bar.className = phase === "verify" ? "verify" : "";
      label.textContent = `${phase === "verify" ? "Verifying" : "Writing"} ${Math.round(f * 100)} %`;
    });
    if (ok === null) $("progress").hidden = true;
    label.textContent = ok ? "Done" : "Failed";
  });

  window.addEventListener("beforeunload", (ev) => { if (state.busy) { ev.preventDefault(); ev.returnValue = ""; } });

  buildFuseRows();
  U.FUSES.forEach((f) => showFuse(f.n));
  update();
})();
