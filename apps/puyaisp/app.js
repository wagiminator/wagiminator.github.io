/* PUYA ISP Programmer: user interface (protocol in puyaisp.js, files in /assets/js/firmware.js) */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const P = window.PUYA, FW = window.FIRMWARE;
  const hex = (v, n) => "0x" + v.toString(16).padStart(n || 4, "0");
  const FLASH_SIZE = { 0x440: 0x10000, 0x448: 0x20000 };   // largest family member

  const state = {
    port: null,         // SerialPort
    hid: null,          // HIDDevice
    busy: false,
    fw: null,           // { name, parsed } or { name, error }
    chip: null,         // { pid, name, ver, option, words, locked }
  };

  const transportKind = () => document.querySelector('input[name="transport"]:checked').value;
  const usable = () => (transportKind() === "hid" ? !!navigator.hid : !!navigator.serial);

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
    if (err && err.name === "NetworkError") return "The port could not be opened. Close other programs that use it (serial monitor, puyaisp) and try again.";
    if (err && err.name === "SecurityError") return "The browser may not access this device.";
    if (err && err.name === "InvalidStateError") return "The port is already open. Wait a moment and try again.";
    return err && err.message ? err.message : String(err);
  }

  /* ---------- Controls ---------- */

  function update() {
    const ok = usable(), idle = !state.busy && ok;
    $("btn-flash").disabled = !idle || !state.fw || fwErrors().length > 0;
    for (const id of ["btn-info", "btn-erase", "btn-unlock", "btn-lock", "btn-gpio", "btn-reset", "btn-rstopt", "btn-port"]) $(id).disabled = !idle;
    $("file-input").disabled = state.busy;
    $("baud").disabled = state.busy || transportKind() === "hid";
    document.querySelectorAll('input[name="transport"]').forEach((r) => { r.disabled = state.busy; });
    const hid = transportKind() === "hid";
    const dev = hid ? state.hid : state.port;
    $("btn-port").textContent = hid ? (dev ? "Choose another HID device" : "Choose HID device") : (dev ? "Choose another port" : "Choose serial port");
    $("conn").className = "conn" + (state.busy ? " busy" : dev ? " connected" : "");
    $("conn-text").textContent = state.busy ? "Working …" : dev ? (hid ? "HID bootloader chosen" : "Serial port chosen") : (hid ? "No HID device chosen" : "No port chosen");
    let note = "Every action asks for the serial port the first time.";
    if (hid) note = dev ? `USB ID ${dev.vendorId.toString(16).padStart(4, "0")}:${dev.productId.toString(16).padStart(4, "0")}` : "Every action asks for the HID bootloader the first time.";
    else if (dev) {
      const i = dev.getInfo ? dev.getInfo() : {};
      note = i.usbVendorId !== undefined ? `USB ID ${i.usbVendorId.toString(16).padStart(4, "0")}:${i.usbProductId.toString(16).padStart(4, "0")}, ${$("baud").value} baud, 8E1` : `${$("baud").value} baud, 8E1`;
    }
    $("link-note").textContent = note;
    $("unsupported").hidden = ok;
    $("unsupported").textContent = hid
      ? "This browser cannot access HID devices. Open this page in Chrome, Edge or Opera on a desktop computer."
      : "This browser cannot access serial ports. Open this page in Chrome, Edge or Opera on a desktop computer.";
  }

  document.querySelectorAll('input[name="transport"]').forEach((r) => r.addEventListener("change", update));
  $("baud").addEventListener("change", update);

  /* ---------- Choosing the port ---------- */

  async function choose() {
    if (transportKind() === "hid") {
      try {
        const devs = await navigator.hid.requestDevice({ filters: [P.HID_FILTER] });
        if (devs[0]) { state.hid = devs[0]; return devs[0]; }
      } catch (e) { /* cancelled */ }
      log("No HID bootloader was chosen.");
      return null;
    }
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
  }
  if (navigator.hid) {
    navigator.hid.addEventListener("disconnect", (ev) => {
      if (ev.device === state.hid) { state.hid = null; if (!state.busy) log("The HID bootloader left."); update(); }
    });
  }

  /* ---------- Running actions ---------- */

  // Run an operation with the controls locked
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

  // One session as in puyaisp.py: connect, act, then start or reset the chip.
  // actions: see PUYA.runActions; make(prog) may build them after connecting.
  async function run(actions, done, progress) {
    const hid = transportKind() === "hid";
    let dev = hid ? state.hid : state.port;
    if (!dev) dev = await choose();      // needs the click that started this
    if (!dev) return null;
    return busy(async () => {
      const t = hid ? new P.HidTransport(dev) : new P.SerialTransport(dev, Number($("baud").value));
      const prog = new P.Programmer(t);
      log(hid ? "Connecting to the HID bootloader …" : "Connecting through the serial converter …");
      await prog.connect();
      if (prog.resynced) log("The bootloader was already synchronized.");
      try {
        await P.runActions(prog, actions, (t) => log(t), progress);

      } finally {
        if (prog.pid !== undefined) showChip(prog);
      }
      if (done) log(done, "ok");
    });
  }

  function showChip(prog) {
    const c = {
      pid: prog.pid, known: prog.known, ver: prog.verStr,
      name: prog.known ? prog.chip.name : `Unknown chip (PID ${hex(prog.pid)})`,
      option: prog.option || null, words: prog.option ? prog.decodeOption() : null,
    };
    // Unlocking resets the option bytes; the old ones read before are stale
    if (prog.unlocked) c.option = null;
    state.chip = c;
    const dl = $("chip-facts");
    dl.textContent = "";
    const rows = [["Chip", c.name], ["Bootloader PID", hex(c.pid)], ["Bootloader", `v${c.ver}`]];
    if (c.option && c.known) {
      const o = c.option, chip = P.CHIPS[c.pid];
      rows.push(["Read protection", o[0] === 0xaa ? "off" : "on"]);
      rows.push(["nRST pin", o[1] & chip.optionNrst ? "GPIO" : "RESET"]);
      for (const k of ["OPTR", "SDKR", "WRPR"]) rows.push([k, hex(c.words[k])]);
    } else if (prog.lockedRead) {
      rows.push(["Read protection", "on (option bytes cannot be read)"]);
    }
    for (const [k, v] of rows) {
      const dt = document.createElement("dt"); dt.textContent = k;
      const dd = document.createElement("dd"); dd.textContent = v;
      dl.append(dt, dd);
    }
    showFirmware();
  }

  $("btn-info").addEventListener("click", () => run({ info: true }, "Chip info read; the chip stays in bootloader mode."));
  $("btn-erase").addEventListener("click", () => {
    if (confirm("Erase the whole flash of the chip?")) run({ erase: true }, "Chip erased.");
  });
  $("btn-unlock").addEventListener("click", () => {
    if (confirm("Unlock the chip? Removing the read protection erases the chip.")) run({ unlock: true }, "Chip unlocked.");
  });
  $("btn-lock").addEventListener("click", () => {
    if (confirm("Lock the chip? Its flash can then not be read; unlocking erases it.")) run({ lock: true }, "Read protection set.");
  });
  $("btn-gpio").addEventListener("click", () => {
    if (confirm("Use the nRST pin as a GPIO pin? The chip then has no external reset pin.")) run({ nrstGpio: true }, "nRST is now a GPIO pin.");
  });
  $("btn-reset").addEventListener("click", () => run({ nrstReset: true }, "nRST is now the reset pin."));
  $("btn-rstopt").addEventListener("click", () => {
    if (confirm("Write the default option bytes? This also removes a read protection setting and makes nRST the reset pin.")) run({ rstOption: true }, "Option bytes reset to their defaults.");
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

  const flashSize = () => (state.chip && FLASH_SIZE[state.chip.pid]) || 0;
  const image = () => FW.buildImage(state.fw.parsed, null, flashSize());
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
        const lo = Math.min(...p.segs.map((s) => s.addr)), hi = Math.max(...p.segs.map((s) => s.addr + s.data.length)) - 1;
        parts.push(`addresses ${hex(lo, lo > 0xffff ? 8 : 4)}–${hex(hi, hi > 0xffff ? 8 : 4)}`);
      }
      $("fw-info").textContent = parts.join(", ") + ". Choose another file to replace it.";
      const size = flashSize();
      if (size) {
        $("fit").hidden = false;
        $("fit").classList.toggle("over", r.image.length > size);
        $("fit-used").style.width = `${Math.min(100, (r.image.length / size) * 100)}%`;
        $("fit-text").textContent = `${(r.image.length / size * 100).toFixed(1)} % of the ${Math.round(size / 1024)} KB flash of the largest ${state.chip.name}; smaller chips of the family have less.`;
      }
    }
    r.errors.forEach((e) => msg("error", e));
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
    const r = image();
    if (r.errors.length) { log(r.errors[0], "error"); return; }
    const nrst = $("opt-nrst").value;
    const actions = { flash: r.image, lock: $("opt-lock").checked, nrstGpio: nrst === "gpio", nrstReset: nrst === "reset" };
    if (actions.lock && !confirm("Lock the chip after flashing? Its flash can then not be read; unlocking erases it.")) return;
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

  update();
})();
