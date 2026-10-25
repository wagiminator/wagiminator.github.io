/* WCH USB Programmer: user interface (protocol in chprog.js, files in /assets/js/firmware.js) */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const C = window.CHPROG, FW = window.FIRMWARE;
  const hex = (v, n) => "0x" + v.toString(16).padStart(n || 4, "0");

  const state = {
    device: null,       // USBDevice of the bootloader
    link: null,         // UsbLink
    busy: false,
    fw: null,           // { name, parsed } or { name, error }
    chip: null,         // { name, id, codeSize, dataSize, bootloader, uid }
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
    if (err && err.name === "SecurityError") return "The browser may not access this device. On Linux add the udev rules, on Windows install the WinUSB driver with Zadig (see Driver setup).";
    if (err && err.name === "NetworkError") return "The bootloader could not be opened. Close other programs that use it (WCHISPTool, chprog) and try again.";
    return err && err.message ? err.message : String(err);
  }

  /* ---------- Controls ---------- */

  function update() {
    const usable = !!navigator.usb;
    $("btn-flash").disabled = state.busy || !usable || !state.fw || fwErrors().length > 0;
    $("btn-connect").disabled = state.busy || !usable;
    $("btn-connect").textContent = state.device ? "Disconnect" : "Connect and read chip info";
    $("file-input").disabled = state.busy;
    const conn = $("conn");
    conn.className = "conn" + (state.busy ? " busy" : state.device ? " connected" : "");
    $("conn-text").textContent = state.device ? (state.chip ? `${state.chip.name} in bootloader mode` : "Bootloader connected") : "Not connected";
    $("link-note").textContent = state.device
      ? `USB ID ${state.device.vendorId.toString(16).padStart(4, "0")}:${state.device.productId.toString(16).padStart(4, "0")}`
      : "Put the chip into bootloader mode and connect it.";
  }

  /* ---------- Connecting ---------- */

  async function choose() {
    try {
      return await navigator.usb.requestDevice({ filters: C.FILTERS });
    } catch (e) {
      log("No bootloader was chosen. Put the chip into bootloader mode; it then appears in the list the browser shows.");
      return null;
    }
  }

  async function open(dev) {
    await release();
    const link = new C.UsbLink(dev);
    await link.open();
    state.device = dev;
    state.link = link;
  }

  async function release() {
    if (state.link) await state.link.close();
    state.link = null;
    state.device = null;
  }

  $("btn-connect").addEventListener("click", async () => {
    if (state.device) {
      await release();
      log("Bootloader disconnected.");
      update();
      return;
    }
    const dev = await choose();
    if (!dev) return;
    await busy(async () => {
      await open(dev);
      const prog = await new C.Programmer(state.link).init();
      const info = await prog.identify();
      showChip({ name: info.name, id: info.id, codeSize: info.device && info.device.codeSize, dataSize: info.device && info.device.dataSize, bootloader: info.bootloader, uid: info.uid });
      log(`Found ${info.name} with bootloader v${info.bootloader}.`, "ok");
      if (!info.device) log("This chip is not in the chip list of chprog and cannot be flashed.", "error");
      if (info.protected) log("The chip is read-protected. Flashing removes the protection, which erases the chip.");
    });
  });

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

  if (navigator.usb) {
    navigator.usb.addEventListener("disconnect", (ev) => {
      if (state.device && ev.device === state.device) {
        state.device = null; state.link = null;
        if (!state.busy) log("The chip left bootloader mode.");
        update();
      }
    });
  } else {
    $("unsupported").hidden = false;
  }

  function showChip(c) {
    state.chip = c;
    const dl = $("chip-facts");
    dl.textContent = "";
    const rows = [
      ["Chip", c.name],
      ["Chip ID", hex(c.id)],
      ["Bootloader", `v${c.bootloader}`],
      ["Code flash", c.codeSize ? `${c.codeSize.toLocaleString("en")} bytes (${Math.round(c.codeSize / 1024)} KB)` : "unknown"],
    ];
    if (c.dataSize) rows.push(["Data flash", `${c.dataSize.toLocaleString("en")} bytes`]);
    if (c.uid) rows.push(["Unique ID", c.uid.map((b) => b.toString(16).padStart(2, "0")).join(" ")]);
    for (const [k, v] of rows) {
      const dt = document.createElement("dt"); dt.textContent = k;
      const dd = document.createElement("dd"); dd.textContent = v;
      dl.append(dt, dd);
    }
    showFirmware();
  }

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

  const flashSize = () => (state.chip && state.chip.codeSize) || 0;
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
        $("fit-text").textContent = `${(r.image.length / size * 100).toFixed(1)} % of the ${Math.round(size / 1024)} KB code flash of the ${state.chip.name}`;
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
    // Choose the bootloader first if none is connected (needs this click)
    let dev = state.device;
    if (!dev) {
      dev = await choose();
      if (!dev) return;
    }
    $("progress").hidden = false;
    const bar = $("progress-bar"), label = $("progress-label");
    bar.style.width = "0%";
    label.textContent = "";
    const ok = await busy(async () => {
      if (!state.link || state.device !== dev) await open(dev);
      const prog = await new C.Programmer(state.link).init();
      await C.program(prog, (p) => {
        showChip({ name: p.chipName, id: p.chipId, codeSize: p.codeFlashSize, dataSize: p.dataFlashSize, bootloader: p.bootloader, uid: Array.from(p.chipUid) });
        const r = image();
        if (r.errors.length) throw new C.ProgError(r.errors[0]);
        return r.image;
      }, {
        log: (t) => log(t),
        progress: (phase, f) => {
          bar.style.width = `${Math.round(f * 100)}%`;
          bar.className = phase === "verify" ? "verify" : "";
          label.textContent = `${phase === "verify" ? "Verifying" : "Writing"} ${Math.round(f * 100)} %`;
        },
      });
      log(`${state.fw.name} flashed and verified.`, "ok");
      // The chip restarts and leaves bootloader mode
      await release();
    });
    label.textContent = ok ? "Done" : "Failed";
  });

  window.addEventListener("beforeunload", (ev) => { if (state.busy) { ev.preventDefault(); ev.returnValue = ""; } });

  update();
})();
