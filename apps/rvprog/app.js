/* RISC-V Programmer: user interface (protocol in rvprog.js, chip tables in tables.js) */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const R = window.RVPROG;
  const hex = (v, n) => "0x" + v.toString(16).padStart(n || 4, "0");

  const state = {
    device: null,       // USBDevice
    mode: null,         // "rv" | "arm"
    link: null,         // UsbLink (RISC-V mode)
    prog: null,         // Programmer
    busy: false,
    fw: null,           // { name, parsed }
    chip: null,         // { name, id, family, flashSize, series }
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

  /* ---------- Controls ---------- */

  function update() {
    const rv = state.mode === "rv" && !!state.prog;
    const idle = rv && !state.busy;
    for (const id of ["btn-info", "btn-erase", "btn-unlock", "btn-unbrick", "btn-lock", "btn-armmode"]) $(id).disabled = !idle;
    const v00x = !state.chip || state.chip.series === 0x00;
    $("btn-gpio").disabled = !idle || !v00x;
    $("btn-reset").disabled = !idle || !v00x;
    $("btn-flash").disabled = !idle || !state.fw || fwErrors().length > 0;
    $("btn-connect").disabled = state.busy || !navigator.usb;
    $("btn-connect").textContent = state.device ? "Disconnect" : "Connect WCH-Link";
    $("btn-rvmode").hidden = state.mode !== "arm";
    $("btn-rvmode").disabled = state.busy;
    $("file-input").disabled = state.busy;

    const conn = $("conn");
    conn.className = "conn" + (state.busy ? " busy" : state.mode === "arm" ? " arm" : rv ? " connected" : "");
    const note = $("link-note");
    note.className = "link-note";
    if (!state.device) {
      $("conn-text").textContent = "Not connected";
      note.textContent = "Connect the WCH-Link by USB and to the chip (SWDIO, GND and power).";
    } else if (state.mode === "arm") {
      $("conn-text").textContent = "WCH-Link in ARM mode";
      note.textContent = "The blue LED is on: the WCH-Link is set up for ARM chips. Switch it to RISC-V mode to use it here.";
    } else if (state.prog) {
      $("conn-text").textContent = `${state.prog.linkName} v${state.prog.linkVersion}`;
      if (state.prog.linkVerCode < 211) { note.className = "link-note warn"; note.textContent = "The firmware of the WCH-Link is old and should be updated (WCH-LinkUtility)."; }
      else note.textContent = "Ready, in RISC-V mode.";
    } else {
      $("conn-text").textContent = "Connecting …";
      note.textContent = "";
    }
  }

  /* ---------- Connecting ---------- */

  async function useDevice(dev) {
    await release();
    state.device = dev;
    if (dev.productId === R.PID_ARM) {
      state.mode = "arm";
      log("Found a WCH-Link in ARM mode.");
      update();
      return;
    }
    state.mode = "rv";
    update();
    try {
      state.link = new R.UsbLink(dev);
      await state.link.open();
      state.prog = await new R.Programmer(state.link, (t) => log(t)).init();
      log(`Found ${state.prog.linkName} v${state.prog.linkVersion} in RISC-V mode.`, "ok");
      if (state.prog.linkVerCode < 211) log("The WCH-Link firmware needs to be updated.", "error");
    } catch (err) {
      log(errorText(err), "error");
      await release();
    }
    update();
  }

  async function release() {
    if (state.link) await state.link.close();
    state.link = null;
    state.prog = null;
    state.device = null;
    state.mode = null;
  }

  function errorText(err) {
    const m = err && err.message ? err.message : String(err);
    if (err && err.name === "SecurityError") return "The browser does not allow access to this device. On Linux, add the udev rules (see Setup); on Windows, install the WinUSB driver with Zadig.";
    if (err && err.name === "NetworkError") return "The WCH-Link could not be opened. Close other programs that use it (WCH-LinkUtility, MounRiver, OpenOCD, rvprog) and try again.";
    return m;
  }

  $("btn-connect").addEventListener("click", async () => {
    if (state.device) {
      await release();
      log("WCH-Link disconnected.");
      update();
      return;
    }
    let dev;
    try {
      dev = await navigator.usb.requestDevice({ filters: R.FILTERS });
    } catch (e) {
      log("No WCH-Link was chosen. Plug it in and choose it in the list the browser shows.");
      return;
    }
    await useDevice(dev);
  });

  async function autoConnect() {
    if (!navigator.usb) {
      $("unsupported").hidden = false;
      update();
      return;
    }
    navigator.usb.addEventListener("connect", (ev) => {
      if (!state.device || state.mode === "arm") {
        if (ev.device.vendorId === R.VENDOR && (ev.device.productId === R.PID_RV || !state.device)) useDevice(ev.device);
      }
    });
    navigator.usb.addEventListener("disconnect", (ev) => {
      if (state.device && ev.device === state.device) {
        state.link = null; state.prog = null; state.device = null; state.mode = null; state.busy = false;
        log("The WCH-Link was unplugged or restarted.");
        update();
      }
    });
    const devs = (await navigator.usb.getDevices()).filter((d) => d.vendorId === R.VENDOR);
    const pick = devs.find((d) => d.productId === R.PID_RV) || devs.find((d) => d.productId === R.PID_ARM);
    if (pick) await useDevice(pick);
    update();
  }

  /* ---------- Link modes ---------- */

  $("btn-rvmode").addEventListener("click", async () => {
    const arm = state.device;
    state.busy = true;
    update();
    try {
      log("Switching WCH-Link to RISC-V mode …");
      await R.rvMode(arm);
      state.device = null; state.mode = null;
      // The WCH-Link restarts with a new USB id; wait for it if the browser already allows it
      for (let i = 0; i < 30 && !state.prog; i++) {
        await new Promise((r) => setTimeout(r, 100));
        const dev = (await navigator.usb.getDevices()).find((d) => d.productId === R.PID_RV);
        if (dev) { state.busy = false; await useDevice(dev); }
      }
      if (!state.prog) log("Switched. Choose Connect WCH-Link again and select the WCH-Link: in RISC-V mode the browser lists it as a new device.", "ok");
    } catch (err) {
      log(errorText(err), "error");
    } finally {
      state.busy = false;
      update();
    }
  });

  $("btn-armmode").addEventListener("click", () => {
    if (!confirm("Switch the WCH-Link to ARM mode? It can then no longer program RISC-V chips until it is switched back.")) return;
    run({ armMode: true }, async () => {
      await release();
      log("The WCH-Link is now in ARM mode (blue LED on).", "ok");
    });
  });

  /* ---------- Running actions ---------- */

  async function run(actions, after) {
    if (state.busy || !state.prog) return;
    state.busy = true;
    update();
    const bar = $("progress-bar");
    try {
      await R.runActions(state.prog, actions, (t) => log(t), (f) => { bar.style.width = `${Math.round(f * 100)}%`; });
      if (state.prog && state.prog.chipName) showChip(state.prog);
      if (after) await after();
      else log("Done.", "ok");
      return true;
    } catch (err) {
      log(errorText(err), "error");
      if (state.prog && state.prog.chipName) showChip(state.prog);
      return false;
    } finally {
      state.busy = false;
      update();
      showFirmware();
    }
  }

  function showChip(p) {
    state.chip = { name: p.chipName, id: p.chipId, family: p.family, flashSize: p.flashSize, series: p.chipSeries };
    const dl = $("chip-facts");
    dl.textContent = "";
    const rows = [
      ["Chip", p.chipName],
      ["Chip ID", hex(p.chipId)],
      ["Family", p.family.name],
      ["Flash", `${p.flashSize.toLocaleString("en")} bytes (${Math.round(p.flashSize / 1024)} KB)`],
      ["Code flash at", hex(p.family.codeBase, 8)],
      ["Write block", `${p.family.blockSize} bytes`],
    ];
    for (const [k, v] of rows) {
      const dt = document.createElement("dt"); dt.textContent = k;
      const dd = document.createElement("dd"); dd.textContent = v;
      dl.append(dt, dd);
    }
  }

  $("btn-info").addEventListener("click", () => run({ connect: true }));
  $("btn-erase").addEventListener("click", () => {
    if (confirm("Erase the whole flash of the chip?")) run({ erase: true });
  });
  $("btn-unlock").addEventListener("click", () => {
    if (confirm("Unlock the chip? Removing the read protection erases the chip.")) run({ unlock: true });
  });
  $("btn-unbrick").addEventListener("click", () => {
    if (confirm("Unbrick the chip? This erases it.")) run({ unbrick: true });
  });
  $("btn-lock").addEventListener("click", () => {
    if (confirm("Lock the chip? Its flash can then not be read; unlocking erases it.")) run({ lock: true });
  });
  $("btn-gpio").addEventListener("click", () => {
    if (confirm("Use PD7 as a GPIO pin? The chip then has no external reset pin.")) run({ pinGpio: true });
  });
  $("btn-reset").addEventListener("click", () => run({ pinReset: true }));

  /* ---------- Firmware ---------- */

  function loadFile(file) {
    if (state.busy) return;
    file.arrayBuffer().then((buf) => {
      try {
        const parsed = R.readFirmware(file.name, new Uint8Array(buf));
        state.fw = { name: file.name, parsed };
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
    const c = state.chip;
    return R.buildImage(state.fw.parsed, c ? c.family : null, c ? c.flashSize : 0);
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
    const r = image();
    const p = fw.parsed;
    if (r.image) {
      const parts = [`${p.kind.toUpperCase()} file`, `${r.image.length.toLocaleString("en")} bytes`];
      if (p.kind === "hex") {
        const lo = Math.min(...p.segs.map((s) => s.addr)), hi = Math.max(...p.segs.map((s) => s.addr + s.data.length)) - 1;
        parts.push(`addresses ${hex(lo, 8)}–${hex(hi, 8)}`);
      }
      $("fw-info").textContent = parts.join(", ") + ". Choose another file to replace it.";
      if (state.chip) {
        const size = state.chip.flashSize;
        $("fit").hidden = false;
        $("fit").classList.toggle("over", r.image.length > size);
        $("fit-used").style.width = `${Math.min(100, (r.image.length / size) * 100)}%`;
        $("fit-text").textContent = `${(r.image.length / size * 100).toFixed(1)} % of the ${Math.round(size / 1024)} KB flash of the ${state.chip.name}`;
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

  $("btn-flash").addEventListener("click", async () => {
    $("progress").hidden = false;
    $("progress-bar").style.width = "0%";
    const ok = await run({
      // The image depends on the chip (flash base address), so it is built after connecting
      flash: (prog) => {
        showChip(prog);
        const r = image();
        if (r.errors.length) throw new R.ProgError(r.errors[0]);
        return r.image;
      },
    }, async () => log(`${state.fw.name} flashed and verified.`, "ok"));
    if (!ok) $("progress").hidden = true;
  });

  window.addEventListener("beforeunload", (ev) => { if (state.busy) { ev.preventDefault(); ev.returnValue = ""; } });

  update();
  autoConnect();
})();
