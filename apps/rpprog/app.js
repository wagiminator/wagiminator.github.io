/* RP2040/RP2350 Programmer: user interface (protocol in picoboot.js) */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const P = window.PICOBOOT;
  const hex = P.hex;
  const MB = (n) => (n >= 1 << 20 ? `${n / (1 << 20)} MB` : `${n / 1024} KB`);

  const state = {
    device: null,       // USBDevice in BOOTSEL mode
    busy: false,
    fw: null,           // { name, bytes, file } or { name, error }
    chip: null,         // chip info from PICOBOOT.chipInfo
    fileInfo: null,     // binary info of the file
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
    if (err && err.name === "SecurityError") return "The browser may not access this device. On Linux add the udev rules, on Windows install the WinUSB driver for the RP2040 with Zadig (see Driver setup).";
    if (err && err.name === "NetworkError") return "The board could not be opened. Close other programs that use it (picotool) and try again; if it was just unplugged, choose it again.";
    if (err && err.name === "NotFoundError") return "The board is gone. Put it into BOOTSEL mode again.";
    return err && err.message ? err.message : String(err);
  }

  /* ---------- Controls ---------- */

  function update() {
    const ok = !!navigator.usb, idle = !state.busy && ok;
    $("btn-flash").disabled = !idle || !state.fw || fwErrors().length > 0;
    for (const id of ["btn-info", "btn-run", "btn-erase", "btn-read", "btn-port"]) $(id).disabled = !idle;
    $("btn-bootsel").disabled = state.busy || !navigator.serial;
    $("file-input").disabled = state.busy;
    $("offset").disabled = state.busy;
    const dev = state.device;
    $("btn-port").textContent = dev ? "Choose another board" : "Choose board";
    $("conn").className = "conn" + (state.busy ? " busy" : dev ? " connected" : "");
    $("conn-text").textContent = state.busy ? "Working …" : dev ? `${dev.productId === P.PID_RP2040 ? "RP2040" : "RP2350"} in BOOTSEL mode` : "No board chosen";
    $("link-note").textContent = dev ? `USB ID 2e8a:${dev.productId.toString(16).padStart(4, "0")}${dev.serialNumber ? `, serial ${dev.serialNumber}` : ""}` : "Every action asks for the board in BOOTSEL mode the first time.";
    $("unsupported").hidden = ok;
  }

  /* ---------- Choosing the board ---------- */

  // A board that was allowed before comes back without asking (e.g. after a restart)
  async function known() {
    if (!navigator.usb) return null;
    const list = (await navigator.usb.getDevices()).filter((d) => d.vendorId === P.VID && (d.productId === P.PID_RP2040 || d.productId === P.PID_RP2350));
    return list.length === 1 ? list[0] : null;
  }

  async function choose() {
    try {
      state.device = await navigator.usb.requestDevice({ filters: P.FILTERS });
      return state.device;
    } catch (e) {
      log("No board was chosen. Put it into BOOTSEL mode (hold BOOTSEL while plugging it in); it then appears in the list the browser shows.");
      return null;
    }
  }

  $("btn-port").addEventListener("click", async () => {
    if (await choose()) log(`Board chosen (${state.device.productId === P.PID_RP2040 ? "RP2040" : "RP2350"}).`);
    update();
  });

  if (navigator.usb) {
    navigator.usb.addEventListener("disconnect", (ev) => {
      if (state.device && ev.device === state.device) {
        state.device = null;
        if (!state.busy) log("The board left BOOTSEL mode.");
        update();
      }
    });
    navigator.usb.addEventListener("connect", (ev) => {
      const d = ev.device;
      if (!state.device && d.vendorId === P.VID) { state.device = d; log("A board in BOOTSEL mode is back."); update(); }
    });
    known().then((d) => { if (d && !state.device) { state.device = d; update(); } });
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

  // Open the board, run fn(pb), close it again
  async function session(fn) {
    let dev = state.device || await known();
    if (!dev) dev = await choose();      // needs the click that started this
    if (!dev) return null;
    state.device = dev;
    return busy(async () => {
      const pb = new P.Picoboot(dev);
      await pb.open();
      try {
        await fn(pb);
      } finally {
        await pb.close();
      }
    });
  }

  async function readInfo(pb) {
    log(`Reading chip info of the ${pb.chip.toUpperCase()} …`);
    state.chip = await P.chipInfo(pb);
    showChip();
    showFirmware();
  }

  function facts(dl, rows) {
    dl.textContent = "";
    for (const [k, v] of rows) {
      const dt = document.createElement("dt"); dt.textContent = k;
      const dd = document.createElement("dd"); dd.textContent = v;
      dl.append(dt, dd);
    }
  }

  function showChip() {
    const c = state.chip;
    const rows = [["Chip", c.chip.toUpperCase() + (c.package ? `, ${c.package}` : "")], ["Revision", c.revision]];
    if (c.chipId) rows.push(["Chip ID", c.chipId]);
    rows.push(["Flash", c.flashSize ? MB(c.flashSize) : c.erased ? "empty (size unknown)" : "size unknown"]);
    if (c.cpus) rows.push(["Cores", c.cpus + (c.cpu ? `; boot ROM runs on ${c.cpu}` : "")]);
    if (c.secure !== undefined) rows.push(["Secure boot", c.secure ? "on" : "off"]);
    if (c.debug !== undefined) rows.push(["Debug (SWD)", c.debug ? "allowed" : "disabled"]);
    facts($("chip-facts"), rows);
    let prog = [];
    if (c.erased) prog = [["Program", "none (flash is empty)"]];
    else if (c.program && c.program.length) prog = c.program;
    else prog = [["Program", "present, without binary info"]];
    facts($("prog-facts"), prog);
    const name = c.program && c.program.find((r) => r[0] === "Program");
    log(`${c.chip.toUpperCase()} ${c.revision}${c.flashSize ? `, ${MB(c.flashSize)} flash` : ""}${name ? `, program “${name[1]}”` : c.erased ? ", flash empty" : ""}.`, "ok");
  }

  $("btn-info").addEventListener("click", () => session(readInfo));

  $("btn-run").addEventListener("click", () => session(async (pb) => {
    await pb.reboot(false);
    log("The board restarts and runs its program.", "ok");
  }));

  const flashSize = () => Number($("flash-size").value) || (state.chip && state.chip.flashSize) || (2 << 20);

  $("btn-erase").addEventListener("click", () => {
    const size = flashSize();
    if (!confirm(`Erase the whole flash (${MB(size)})? The program and all data on the board are lost.`)) return;
    progressStart();
    session(async (pb) => {
      log(`Erasing ${MB(size)} of flash …`);
      await P.eraseAll(pb, size, progressCb);
      if (state.chip) { state.chip.erased = true; state.chip.program = null; showChip(); }
      log("Flash erased.", "ok");
    }).then(progressEnd);
  });

  $("btn-read").addEventListener("click", () => {
    const size = flashSize(), fmt = $("read-format").value;
    progressStart();
    session(async (pb) => {
      log(`Reading ${MB(size)} of flash …`);
      const data = await P.dump(pb, size, progressCb);
      const fam = pb.chip === "rp2040" ? P.FAMILY.RP2040 : P.FAMILY.RP2350_ARM_S;
      const out = fmt === "uf2" ? P.makeUf2(data, P.FLASH, fam) : data;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([out], { type: "application/octet-stream" }));
      a.download = `${pb.chip}-flash.${fmt}`;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 10000);
      log(`Flash saved as ${a.download}${fmt === "uf2" ? " (erased pages at the end left out)" : ""}.`, "ok");
    }).then(progressEnd);
  });

  /* ---------- Restart into BOOTSEL over the serial port ---------- */

  $("btn-bootsel").addEventListener("click", async () => {
    let port;
    try { port = await navigator.serial.requestPort(); } catch (e) { log("No serial port was chosen."); return; }
    try {
      await port.open({ baudRate: 1200 });
      await P.sleep(100);
      await port.close();
      log("Sent the 1200 baud signal. The board should now restart in BOOTSEL mode; then choose Flash firmware.", "ok");
    } catch (e) {
      try { await port.close(); } catch (e2) { /* ignore */ }
      log("The serial port could not be opened: " + errorText(e), "error");
    }
  });

  /* ---------- Firmware ---------- */

  function offset() {
    const t = $("offset").value.trim();
    const v = /^0x[0-9a-f]+$/i.test(t) ? parseInt(t, 16) : /^\d+$/.test(t) ? Number(t) : NaN;
    return v;
  }

  function loadFile(file) {
    if (state.busy) return;
    file.arrayBuffer().then((buf) => {
      state.fw = { name: file.name, bytes: new Uint8Array(buf) };
      parseFile();
      if (!state.fw.error) log(`Loaded ${file.name}.`);
      else log(`${file.name}: ${state.fw.error}`, "error");
      showFirmware();
      update();
    });
  }

  function parseFile() {
    const fw = state.fw;
    fw.error = null; fw.file = null;
    const off = offset();
    try {
      fw.file = P.readFile(fw.name, fw.bytes, isNaN(off) ? 0 : off);
    } catch (err) {
      fw.error = err.message;
    }
  }

  const chipName = () => (state.chip ? state.chip.chip : state.device ? (state.device.productId === P.PID_RP2040 ? "rp2040" : "rp2350") : null);
  const image = () => P.buildImage(state.fw.file, chipName());

  function fwErrors() {
    if (!state.fw) return [];
    if (state.fw.error) return [state.fw.error];
    const errs = image().errors.slice();
    if (state.fw.file.kind === "bin") {
      const off = offset();
      if (isNaN(off) || off < 0) errs.push("The flash offset is not a number (e.g. 0x10000).");
      else if (off % P.PAGE) errs.push("The flash offset must be a multiple of 256 (0x100).");
    }
    return errs;
  }

  let infoToken = 0;
  function showFirmware() {
    const fw = state.fw;
    const ul = $("fw-messages");
    ul.textContent = "";
    const msg = (cls, t) => { const li = document.createElement("li"); li.className = cls; li.textContent = t; ul.append(li); };
    $("fit").hidden = true;
    if (!fw) return;
    $("drop").classList.add("loaded");
    $("fw-name").textContent = fw.name;
    $("bin-offset").hidden = !(fw.file && fw.file.kind === "bin");
    if (fw.error) { $("fw-info").textContent = "Choose another file."; $("file-facts").hidden = true; msg("error", fw.error); return; }
    const f = fw.file, img = image();
    const parts = [`${f.kind.toUpperCase()} file`];
    if (img.size) parts.push(`${img.size.toLocaleString("en")} bytes for the flash`);
    if (img.size) parts.push(`${hex(img.low)}–${hex(img.high - 1)}`);
    if (f.kind === "uf2") {
      const fams = f.families.filter((x) => x !== P.FAMILY.DATA).map((x) => P.FAMILY_NAME[x] || hex(x));
      if (fams.length) parts.push(`for ${fams.join(" and ")}`);
    }
    $("fw-info").textContent = parts.join(", ") + ". Choose another file to replace it.";
    const size = state.chip && state.chip.flashSize;
    if (size && img.size) {
      const used = img.high - P.FLASH;
      $("fit").hidden = false;
      $("fit").classList.toggle("over", used > size);
      $("fit-used").style.width = `${Math.min(100, (used / size) * 100)}%`;
      $("fit-text").textContent = `Uses ${(used / size * 100).toFixed(1)} % of the ${MB(size)} flash.`;
      if (used > size) msg("error", `The file reaches up to ${MB(used)}, but the flash has ${MB(size)}.`);
    }
    fwErrors().forEach((e) => msg("error", e));
    img.warnings.forEach((w) => msg("warning", w));
    if (f.kind === "hex" && !f.ended) msg("warning", "The HEX file has no end record; it may be incomplete.");
    if (f.kind === "uf2" && f.families.includes(P.FAMILY.RP2350_ARM_NS)) msg("warning", "The file is for the non-secure Arm mode; it only runs from a partition set up for it.");
    // Binary info of the file (program name, version …)
    const token = ++infoToken;
    const chip = chipName() || (f.families.includes(P.FAMILY.RP2040) ? "rp2040" : f.families.length ? "rp2350" : "rp2040");
    P.readBinaryInfo(P.imageReader(img), chip).then((rows) => {
      if (token !== infoToken) return;
      const dl = $("file-facts");
      if (rows && rows.length) {
        dl.hidden = false;
        dl.textContent = "";
        for (const [k, v] of rows.filter((r) => r[0] !== "Binary end" && r[0] !== "Pins")) {
          const dt = document.createElement("dt"); dt.textContent = k;
          const dd = document.createElement("dd"); dd.textContent = v;
          dl.append(dt, dd);
        }
      } else dl.hidden = true;
    }).catch(() => { $("file-facts").hidden = true; });
  }

  $("offset").addEventListener("input", () => { if (state.fw && !state.busy) { parseFile(); showFirmware(); update(); } });

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

  /* ---------- Progress ---------- */

  function progressStart() {
    $("progress").hidden = false;
    $("progress-bar").style.width = "0%";
    $("progress-bar").className = "";
    $("progress-label").textContent = "";
  }
  function progressCb(phase, f) {
    const names = { write: "Writing", verify: "Verifying", erase: "Erasing", read: "Reading" };
    $("progress-bar").style.width = `${Math.round(f * 100)}%`;
    $("progress-bar").className = phase === "verify" ? "verify" : "";
    $("progress-label").textContent = `${names[phase]} ${Math.round(f * 100)} %`;
  }
  function progressEnd(ok) {
    if (ok === null) { $("progress").hidden = true; return; }
    $("progress-label").textContent = ok ? "Done" : "Failed";
  }

  /* ---------- Flashing ---------- */

  $("btn-flash").addEventListener("click", async () => {
    progressStart();
    const ok = await session(async (pb) => {
      if (!state.chip || state.chip.chip !== pb.chip) await readInfo(pb);
      const img = P.buildImage(state.fw.file, pb.chip);
      if (img.errors.length) throw new P.PicoError(img.errors[0]);
      if (state.chip.flashSize && img.high - P.FLASH > state.chip.flashSize) throw new P.PicoError(`The file does not fit into the ${MB(state.chip.flashSize)} flash.`);
      img.warnings.forEach((w) => log(w));
      log(`Writing ${state.fw.name} …`);
      await P.flash(pb, img, progressCb, log);
      log(`${state.fw.name} flashed and verified.`, "ok");
      state.chip.erased = false;
      if ($("opt-run").checked) {
        await pb.reboot(false);
        log("The board restarts and runs the program.", "ok");
      } else {
        try { state.chip.program = await P.readBinaryInfo(pb.reader(), pb.chip); } catch (e) { state.chip.program = null; }
        showChip();
      }
    });
    progressEnd(ok);
  });

  window.addEventListener("beforeunload", (ev) => { if (state.busy) { ev.preventDefault(); ev.returnValue = ""; } });

  update();
})();
