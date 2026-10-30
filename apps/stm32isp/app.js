/* STM32 ISP Programmer: user interface (protocol in stm32isp.js, files in /assets/js/firmware.js) */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const S = window.STM32ISP, FW = window.FIRMWARE;
  const hex = (v, n) => "0x" + v.toString(16).padStart(n || 3, "0");
  const WINDOW = 0x200000;            // largest code flash: 2 MB (STM32F42x/F43x)

  const state = {
    port: null,         // SerialPort
    busy: false,
    fw: null,           // { name, parsed } or { name, error }
    chip: null,         // { pid, name, flashSize, exact, locked, ... }
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
    if (err && err.name === "NetworkError") return "The port could not be opened. Close other programs that use it (serial monitor, stm32isp, STM32CubeProgrammer) and try again.";
    if (err && err.name === "SecurityError") return "The browser may not access this device.";
    if (err && err.name === "InvalidStateError") return "The port is already open. Wait a moment and try again.";
    return err && err.message ? err.message : String(err);
  }

  /* ---------- Chip list ---------- */

  function showChipList() {
    const body = $("chip-list");
    body.textContent = "";
    for (const c of S.CHIPS) {
      const tr = document.createElement("tr");
      tr.dataset.pid = c.pid;
      const name = document.createElement("td");
      name.textContent = c.name;
      if (c.src === "stm32isp") { const t = document.createElement("span"); t.className = "tag"; t.textContent = "stm32isp"; name.append(t); }
      const pid = document.createElement("td"); pid.textContent = hex(c.pid);
      const fl = document.createElement("td"); fl.textContent = c.flash >= 1024 ? `${c.flash / 1024} MB` : `${c.flash} KB`;
      const us = document.createElement("td"); us.textContent = c.usart;
      tr.append(name, pid, fl, us);
      body.append(tr);
    }
  }

  /* ---------- Controls ---------- */

  function update() {
    const ok = !!navigator.serial, idle = !state.busy && ok;
    $("btn-flash").disabled = !idle || !state.fw || fwErrors().length > 0;
    for (const id of ["btn-info", "btn-erase", "btn-unlock", "btn-lock", "btn-read", "btn-bootpin", "btn-wunprot", "btn-port"]) $(id).disabled = !idle;
    $("file-input").disabled = state.busy;
    $("baud").disabled = state.busy;
    const dev = state.port;
    $("btn-port").textContent = dev ? "Choose another port" : "Choose serial port";
    $("conn").className = "conn" + (state.busy ? " busy" : dev ? " connected" : "");
    $("conn-text").textContent = state.busy ? "Working …" : dev ? "Serial port chosen" : "No port chosen";
    let note = "Every action asks for the serial port the first time.";
    if (dev) {
      const i = dev.getInfo ? dev.getInfo() : {};
      note = i.usbVendorId !== undefined ? `USB ID ${i.usbVendorId.toString(16).padStart(4, "0")}:${i.usbProductId.toString(16).padStart(4, "0")}, ${$("baud").value} baud, 8E1` : `${$("baud").value} baud, 8E1`;
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
      if (ev.target === state.port) { state.port = null; log("The serial converter was unplugged."); update(); }
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

  // One session as in stm32isp.py: connect, act, then start the firmware
  // or leave the chip. Returns null if no port was chosen.
  async function run(actions, done, progress) {
    let dev = state.port;
    if (!dev) dev = await choose();      // needs the click that started this
    if (!dev) return null;
    let prog = null;
    const ok = await busy(async () => {
      const t = new S.SerialTransport(dev, Number($("baud").value));
      prog = new S.Programmer(t);
      log(`Connecting through the serial converter (${$("baud").value} baud) …`);
      await prog.connect();
      if (prog.resynced) log("The bootloader was already synchronized.");
      try {
        await S.runActions(prog, actions, (t) => log(t), progress);
      } finally {
        if (prog.pid !== undefined) showChip(prog);
      }
      if (done) log(done, "ok");
    });
    return ok ? prog : false;
  }

  function showChip(prog) {
    const c = {
      pid: prog.pid, name: prog.name, known: !!prog.chip, ver: prog.verStr,
      flashSize: prog.flashSize, exact: prog.flashFromChip, locked: prog.locked,
      option: prog.option || null, bootPinOff: prog.bootPinOff, fam: prog.fam,
    };
    // after unlocking, locking or writing option bytes the values read before are stale
    if (prog.unlocked) { c.locked = false; c.option = null; }
    state.chip = c;
    const dl = $("chip-facts");
    dl.textContent = "";
    const rows = [["Chip", c.name], ["Product ID", hex(c.pid)], ["Bootloader", `v${c.ver}`]];
    if (c.known) {
      rows.push(["Flash", `${c.flashSize / 1024} KB${c.exact ? "" : " (largest of the line)"}`]);
      rows.push(["Read protection", c.locked ? "on (locked)" : "off"]);
      if (c.option) {
        if (c.fam.bootSel && c.bootPinOff !== undefined) rows.push(["BOOT0 pin", c.bootPinOff ? "disabled (nBOOT_SEL = 1)" : "enabled"]);
        rows.push(["Option bytes", c.option.map((b) => b.toString(16).padStart(2, "0")).join(" ")]);
      }
    }
    rows.push(["Commands", (prog.cmds || []).map((b) => b.toString(16).padStart(2, "0")).join(" ")]);
    for (const [k, v] of rows) {
      const dt = document.createElement("dt"); dt.textContent = k;
      const dd = document.createElement("dd"); dd.textContent = v;
      dl.append(dt, dd);
    }
    document.querySelectorAll("#chip-list tr").forEach((tr) => tr.classList.toggle("found", Number(tr.dataset.pid) === c.pid));
    showFirmware();
  }

  $("btn-info").addEventListener("click", () => run({ info: true }, "Chip info read; the chip stays in bootloader mode."));
  $("btn-erase").addEventListener("click", () => {
    if (confirm("Erase the whole flash of the chip? A locked chip is unlocked for this.")) run({ erase: true }, "Chip erased.");
  });
  $("btn-unlock").addEventListener("click", () => {
    if (confirm("Unlock the chip? Removing the read protection erases the whole flash.")) run({ unlock: true }, "Done.");
  });
  $("btn-lock").addEventListener("click", () => {
    if (confirm("Lock the chip? Its flash can then not be read; unlocking erases it.")) run({ lock: true }, "Read protection set.");
  });
  $("btn-bootpin").addEventListener("click", () => run({ bootPin: true, bootPinLog: true, bootPinOnly: true }, "Done."));
  $("btn-wunprot").addEventListener("click", () => {
    if (confirm("Remove the write protection of all flash pages? The chip resets afterwards.")) run({ wunprotect: true }, "Done.");
  });
  $("btn-read").addEventListener("click", async () => {
    const bar = startProgress();
    const prog = await run({ read: true }, null, bar);
    endProgress(prog);
    if (!prog || !prog.dump) return;
    const name = `${prog.name.replace(/[^A-Za-z0-9]+/g, "_")}_flash.bin`;
    const url = URL.createObjectURL(new Blob([prog.dump], { type: "application/octet-stream" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    log(`Flash saved as ${name}.`, "ok");
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

  const flashSize = () => (state.chip && state.chip.known ? state.chip.flashSize : 0);
  const image = () => FW.buildImage(state.fw.parsed, null, flashSize(), WINDOW);
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
        $("fit-text").textContent = state.chip.exact
          ? `${(r.image.length / size * 100).toFixed(1)} % of the ${Math.round(size / 1024)} KB flash of the connected ${state.chip.name}.`
          : `${(r.image.length / size * 100).toFixed(1)} % of the ${Math.round(size / 1024)} KB flash of the largest ${state.chip.name}; smaller chips of the line have less.`;
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

  const LABEL = { write: "Writing", verify: "Verifying", read: "Reading" };
  function startProgress() {
    $("progress").hidden = false;
    const bar = $("progress-bar"), label = $("progress-label");
    bar.style.width = "0%";
    bar.className = "";
    label.textContent = "";
    return (phase, f) => {
      bar.style.width = `${Math.round(f * 100)}%`;
      bar.className = phase === "verify" ? "verify" : "";
      label.textContent = `${LABEL[phase] || phase} ${Math.round(f * 100)} %`;
    };
  }
  function endProgress(ok) {
    if (ok === null) { $("progress").hidden = true; return; }
    $("progress-label").textContent = ok ? "Done" : "Failed";
  }

  $("btn-flash").addEventListener("click", async () => {
    const r = image();
    if (r.errors.length) { log(r.errors[0], "error"); return; }
    const actions = { flash: r.image, lock: $("opt-lock").checked, bootPin: $("opt-bootpin").checked };
    if (actions.lock && !confirm("Lock the chip after flashing? Its flash can then not be read; unlocking erases it.")) return;
    const name = state.fw.name;
    const ok = await run(actions, `${name} flashed and verified.`, startProgress());
    endProgress(ok);
  });

  window.addEventListener("beforeunload", (ev) => { if (state.busy) { ev.preventDefault(); ev.returnValue = ""; } });

  showChipList();
  update();
})();
