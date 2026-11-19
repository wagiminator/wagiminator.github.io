/* STC ISP Programmer: user interface (protocol in stc.js, models in models.js, files in /assets/js/firmware.js) */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const S = window.STCISP, FW = window.FIRMWARE;
  const kb = (n) => `${+(n / 1024).toFixed(2)} KB`;

  const state = {
    port: null,
    busy: false,
    cancel: false,
    fw: null,           // { name, parsed } or { name, error }
    chip: null,         // { model, family, clock, bsl, ... }
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
    if (err && err.name === "NetworkError") return "The port could not be opened. Close other programs that use it (serial monitor, STC-ISP, stcgal) and try again.";
    if (err && err.name === "SecurityError") return "The browser may not access this port.";
    if (err && err.name === "InvalidStateError") return "The port is already open. Wait a moment and try again.";
    if (err && err.message === "timeout") return "The chip stopped answering. Lower the baud rate under More options and try again.";
    if (err && err.message === "framing") return "The answer of the chip was garbled. Lower the baud rate under More options and try again.";
    return err && err.message ? err.message : String(err);
  }

  /* ---------- Controls ---------- */

  function update() {
    const ok = !!navigator.serial, idle = !state.busy && ok;
    $("btn-flash").disabled = !idle || !state.fw || fwErrors().length > 0;
    for (const id of ["btn-info", "btn-erase", "btn-port"]) $(id).disabled = !idle;
    for (const id of ["file-input", "baud", "reset", "freq"]) $(id).disabled = state.busy;
    const p = state.port;
    $("btn-port").textContent = p ? "Choose another port" : "Choose serial port";
    $("conn").className = "conn" + (state.busy ? " busy" : p ? " connected" : "");
    $("conn-text").textContent = state.busy ? "Working …" : p ? "Serial port chosen" : "No port chosen";
    let note = "Every action asks for the serial port the first time.";
    if (p) {
      const i = p.getInfo ? p.getInfo() : {};
      note = (i.usbVendorId !== undefined ? `USB ID ${i.usbVendorId.toString(16).padStart(4, "0")}:${i.usbProductId.toString(16).padStart(4, "0")}, ` : "") + `${$("baud").value} baud, 8E1`;
    }
    $("link-note").textContent = note;
    $("unsupported").hidden = ok;
  }

  $("baud").addEventListener("change", update);

  /* ---------- Choosing the port ---------- */

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
      if (ev.target === state.port && !state.busy) { state.port = null; log("The serial converter was unplugged."); update(); }
    });
  }

  /* ---------- Frequency ---------- */

  function frequency() {
    const t = $("freq").value.trim().replace(",", ".");
    if (!t) return 0;
    const v = Number(t);
    return isFinite(v) ? Math.round(v * 1e6) : NaN;
  }
  function freqError() {
    const f = frequency();
    if (isNaN(f)) return "The clock is not a number (MHz, e.g. 24 or 11.0592).";
    if (f && (f < 1e6 || f > 50e6)) return "The clock must lie between 1 and 50 MHz.";
    return null;
  }
  $("freq").addEventListener("input", () => { showFirmware(); update(); });

  /* ---------- Running actions ---------- */

  async function busy(fn) {
    state.busy = true;
    state.cancel = false;
    update();
    try {
      await fn();
      return true;
    } catch (err) {
      log(errorText(err), "error");
      return false;
    } finally {
      state.busy = false;
      $("btn-cancel").hidden = true;
      update();
      showFirmware();
    }
  }

  $("btn-cancel").addEventListener("click", () => { state.cancel = true; });

  // Wait for the chip, identify it, run fn(stc), leave the bootloader
  async function run(fn) {
    let port = state.port;
    if (!port) port = await choose();      // needs the click that started this
    if (!port) return null;
    return busy(async () => {
      const stc = new S.Stc(port, { baud: Number($("baud").value), frequency: frequency() || 0, reset: $("reset").value }, log);
      try {
        $("btn-cancel").hidden = false;
        if ($("reset").value === "none") log("Now switch the chip's power off and on …");
        else log("Cycling the power of the chip …");
        const m = await stc.connect(null, () => state.cancel);
        $("btn-cancel").hidden = true;
        state.chip = { model: m, family: stc.family, clock: stc.clock, bsl: stc.bslText, info: stc.info || {}, external: stc.external, magic: stc.magic, msr: stc.msr };
        showChip();
        showFirmware();
        if (m.unknown) throw new S.StcError(`Unknown model (ID ${stc.magic.toString(16).toUpperCase()}). It is not in the model list of stcgal.`);
        if (!S.SUPPORTED.includes(stc.family)) {
          throw new S.StcError(`The ${m.name} (${S.FAMILY_TEXT[stc.family] || "unknown"} series) uses a protocol this app does not support. Use stcgal or STC-ISP for it.`);
        }
        await fn(stc);
      } finally {
        await stc.close();
      }
    });
  }

  function showChip() {
    const c = state.chip, m = c.model, dl = $("chip-facts");
    const rows = [["Chip", m.name], ["ID", c.magic.toString(16).toUpperCase().padStart(4, "0")], ["Series", S.FAMILY_TEXT[c.family] || "unknown"]];
    rows.push(["Code flash", kb(m.code)]);
    if (m.eeprom) rows.push(["EEPROM", kb(m.eeprom) + (m.iap ? " (or more, as set in the options)" : "")]);
    if (c.clock !== undefined) rows.push(["Clock", c.clock ? `${(c.clock / 1e6).toFixed(3)} MHz${c.external ? " (crystal)" : ""}` : "not calibrated yet"]);
    if (c.bsl) rows.push(["Bootloader", c.bsl]);
    if (c.info.wakeup) rows.push(["Wake-up timer", `${(c.info.wakeup / 1000).toFixed(3)} kHz`]);
    if (c.info.vref) rows.push(["Reference voltage", `${c.info.vref} mV`]);
    if (c.info.date) rows.push(["Made", c.info.date]);
    if (c.msr) rows.push(["Option bytes", S.hexs(c.msr)]);
    if (c.uid) rows.push(["UID", c.uid]);
    dl.textContent = "";
    for (const [k, v] of rows) {
      const dt = document.createElement("dt"); dt.textContent = k;
      const dd = document.createElement("dd"); dd.textContent = v;
      dl.append(dt, dd);
    }
    if (!c.logged) {
      c.logged = true;
      log(`${m.name} found${c.clock ? `, ${(c.clock / 1e6).toFixed(3)} MHz` : ""}, bootloader ${c.bsl || "?"}.`, "ok");
    }
  }

  $("btn-info").addEventListener("click", () => run(async (stc) => {
    await stc.disconnect();
    log("The chip restarts and runs its program.");
  }));

  $("btn-erase").addEventListener("click", () => {
    if (!confirm("Erase the chip? The program is lost.")) return;
    run(async (stc) => {
      await stc.handshake();
      await stc.erase(stc.model.code, stc.model.code);
      if (stc.uid) { state.chip.uid = S.hexs(stc.uid); showChip(); }
      log("Chip erased.", "ok");
      await stc.disconnect();
    });
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

  const model = () => state.chip && state.chip.model && !state.chip.model.unknown ? state.chip.model : null;
  const image = () => FW.buildImage(state.fw.parsed, 0, model() ? model().total : 0, 0x1000000);

  function fwErrors() {
    const errs = [];
    if (freqError()) errs.push(freqError());
    if (!state.fw) return errs;
    if (state.fw.error) return [state.fw.error];
    return errs.concat(image().errors);
  }

  function showFirmware() {
    const fw = state.fw;
    const ul = $("fw-messages");
    ul.textContent = "";
    const msg = (cls, t) => { const li = document.createElement("li"); li.className = cls; li.textContent = t; ul.append(li); };
    $("fit").hidden = true;
    if (freqError()) msg("error", freqError());
    if (!fw) return;
    $("drop").classList.add("loaded");
    $("fw-name").textContent = fw.name;
    if (fw.error) { $("fw-info").textContent = "Choose another file."; msg("error", fw.error); return; }
    const r = image(), p = fw.parsed;
    if (r.image) {
      const parts = [`${p.kind.toUpperCase()} file`, `${r.image.length.toLocaleString("en")} bytes`];
      if (p.kind === "hex") {
        const lo = Math.min(...p.segs.map((s) => s.addr)), hi = Math.max(...p.segs.map((s) => s.addr + s.data.length)) - 1;
        parts.push(`addresses 0x${lo.toString(16).padStart(4, "0")}–0x${hi.toString(16).padStart(4, "0")}`);
      }
      $("fw-info").textContent = parts.join(", ") + ". Choose another file to replace it.";
      const m = model();
      if (m) {
        $("fit").hidden = false;
        $("fit").classList.toggle("over", r.image.length > m.code);
        $("fit-used").style.width = `${Math.min(100, (r.image.length / m.code) * 100)}%`;
        $("fit-text").textContent = `${(r.image.length / m.code * 100).toFixed(1)} % of the ${kb(m.code)} code flash of the ${m.name}.`;
        if (r.image.length > m.code && r.image.length <= m.total) msg("warning", "The program reaches into the EEPROM area.");
      }
    }
    r.errors.forEach((e) => msg("error", e));
    r.warnings.forEach((w) => msg("warning", w));
    if (p.kind === "hex" && !p.ended) msg("warning", "The HEX file has no end record; it may be incomplete.");
    if (frequency() && state.chip && state.chip.external) msg("note", "The chip runs from a crystal; the clock setting is not used.");
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
    $("progress").hidden = false;
    const bar = $("progress-bar"), label = $("progress-label");
    bar.style.width = "0%";
    bar.className = "wait";
    label.textContent = "Waiting for the chip …";
    const ok = await run(async (stc) => {
      const m = stc.model;
      const r = FW.buildImage(state.fw.parsed, 0, m.total, 0x1000000);
      if (r.errors.length) throw new S.StcError(r.errors[0]);
      // Pad to 512 bytes, as stcgal does
      let data = r.image;
      if (data.length % 512) { const d = new Uint8Array(Math.ceil(data.length / 512) * 512).fill(0xff); d.set(data); data = d; }
      if (data.length > m.total) data = data.subarray(0, m.total);
      bar.className = "";
      label.textContent = "Trimming …";
      log(stc.is12() ? `Switching to ${stc.transferBaud} baud …` : `Trimming the oscillator${stc.trimFrequency ? ` to ${(stc.trimFrequency / 1e6).toFixed(3)} MHz` : ""} and switching to ${stc.transferBaud} baud …`);
      await stc.handshake();
      if (stc.trimmed && !stc.is12()) log(`Oscillator set to ${(stc.trimmed / 1e6).toFixed(3)} MHz.`);
      label.textContent = "Erasing …";
      await stc.erase(data.length, m.code);
      if (stc.uid) { state.chip.uid = S.hexs(stc.uid); showChip(); }
      log(`Writing ${state.fw.name} (${r.image.length.toLocaleString("en")} bytes) …`);
      await stc.program(data, (f) => { bar.style.width = `${Math.round(f * 100)}%`; label.textContent = `Writing ${Math.round(f * 100)} %`; });
      await stc.writeOptions();
      if (stc.trimmed && !stc.is12()) { state.chip.clock = stc.trimmed; showChip(); }
      log(`${state.fw.name} flashed.`, "ok");
      await stc.disconnect();
      log("The chip restarts and runs the program.", "ok");
    });
    if (ok === null) $("progress").hidden = true;
    bar.className = ok ? "" : "failed";
    if (ok) bar.style.width = "100%";
    label.textContent = ok ? "Done" : "Failed";
  });

  window.addEventListener("beforeunload", (ev) => { if (state.busy) { ev.preventDefault(); ev.returnValue = ""; } });

  update();
})();
