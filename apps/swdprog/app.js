/* SWD Programmer: user interface (probes, target and flash drivers in swd.js, files in /assets/js/firmware.js) */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const S = window.SWDPROG, FW = window.FIRMWARE;
  const hex = (v, n) => "0x" + (v >>> 0).toString(16).toUpperCase().padStart(n || 8, "0");
  const WINDOW = 0x400000;            // largest code flash: 4 MB (STM32U59x/5Ax)
  const KIND = { "cmsis-dap": "CMSIS-DAP", stlink: "ST-Link", jlink: "J-Link" };

  const state = {
    device: null,       // USBDevice or HIDDevice
    hid: false,         // true: CMSIS-DAP v1 through WebHID
    probe: null,        // { name, voltage, kind } of the last session
    busy: false,
    fw: null,           // { name, parsed } or { name, error }
    chip: null,         // { name, flashBase, flashSize, flashSpan, ... }
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
    if (err && err.name === "NetworkError") return "The programmer could not be opened. Close other programs that use it (STM32CubeProgrammer, J-Link software, OpenOCD, pyOCD, tinyOCD) and try again.";
    if (err && err.name === "SecurityError") return "The browser may not access this device. On Linux, add the udev rules (More options); on Windows, check the driver.";
    if (err && err.name === "NotFoundError") return "The programmer is no longer available. Plug it in again and connect it.";
    let m = err && err.message ? err.message : String(err);
    if (!/[.!?)]$/.test(m)) m += ".";
    return m;
  }

  /* ---------- Chip list ---------- */

  const BOOT = { fixed: "always usable", option: "option bytes" };
  function showChipList() {
    const body = $("chip-list");
    body.textContent = "";
    for (const c of S.chipList()) {
      const tr = document.createElement("tr");
      tr.dataset.name = c.name;
      tr.dataset.search = `${c.family} ${c.name} ${c.id}`.toLowerCase();
      const cells = [c.name, c.id || "–", c.flash >= 1024 ? `${c.flash / 1024} MB` : `${c.flash} KB`, BOOT[c.bootpin] || "–", c.nrst ? "configurable" : "–"];
      for (const v of cells) { const td = document.createElement("td"); td.textContent = v; tr.append(td); }
      if (!c.lock) { const tag = document.createElement("span"); tag.className = "tag"; tag.textContent = "no lock"; tr.firstChild.append(tag); }
      body.append(tr);
    }
    filterChips();
  }

  function filterChips() {
    const q = $("chip-filter").value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let n = 0;
    document.querySelectorAll("#chip-list tr").forEach((tr) => {
      const show = q.every((w) => tr.dataset.search.includes(w));
      tr.hidden = !show;
      if (show) n++;
    });
    $("chip-count").textContent = `${n} chip lines`;
  }
  $("chip-filter").addEventListener("input", filterChips);

  /* ---------- Controls ---------- */

  function update() {
    const ok = !!(navigator.usb || navigator.hid);
    const idle = !state.busy && !!state.device;
    for (const id of ["btn-info", "btn-erase", "btn-unlock", "btn-lock", "btn-read", "btn-bootpin"]) $(id).disabled = !idle;
    const c = state.chip;
    $("btn-gpio").disabled = !idle || (c && !c.hasNrst);
    $("btn-reset").disabled = !idle || (c && !c.hasNrst);
    $("btn-flash").disabled = !idle || !state.fw || fwErrors().length > 0;
    $("btn-connect").disabled = state.busy || !navigator.usb;
    $("btn-hid").disabled = state.busy || !navigator.hid;
    $("btn-connect").textContent = state.device ? "Disconnect" : "Connect programmer";
    $("btn-hid").hidden = !!state.device;
    $("file-input").disabled = state.busy;
    $("speed").disabled = state.busy;

    $("conn").className = "conn" + (state.busy ? " busy" : state.device ? " connected" : "");
    const note = $("link-note");
    note.className = "link-note";
    if (!state.device) {
      $("conn-text").textContent = "Not connected";
      note.textContent = "Plug in the programmer by USB and connect it.";
    } else {
      const p = state.probe;
      $("conn-text").textContent = state.busy ? "Working …" : p ? p.name : "Programmer chosen";
      const parts = [];
      if (p && p.voltage) parts.push(`target voltage ${p.voltage.toFixed(2)} V`);
      parts.push(`SWD clock ${Number($("speed").value) >= 1000 ? Number($("speed").value) / 1000 + " MHz" : $("speed").value + " kHz"}`);
      note.textContent = parts.join(", ").replace(/^./, (x) => x.toUpperCase()) + ".";
      if (p && p.voltage !== null && p.voltage !== undefined && p.voltage < 1.5) {
        note.className = "link-note warn";
        note.textContent = `No target voltage (${p.voltage.toFixed(2)} V): is the chip powered?`;
      }
    }
    $("unsupported").hidden = ok;
  }

  $("speed").addEventListener("change", update);

  /* ---------- Connecting ---------- */

  async function openProbe() {
    const p = state.hid ? await S.openHidProbe(state.device) : await S.openUsbProbe(state.device);
    state.probe = { name: p.name, voltage: p.voltage, kind: p.kind };
    return p;
  }

  // Use a programmer: identify it, and detect the chip if asked
  async function useDevice(dev, hid, detect) {
    state.device = dev;
    state.hid = hid;
    state.probe = null;
    state.chip = null;
    showChip(null);
    update();
    const ok = await busy(async () => {
      const p = await openProbe();
      await p.close();
      log(`Found ${p.name}${p.voltage ? `, target voltage ${p.voltage.toFixed(2)} V` : ""}.`, "ok");
    });
    if (!ok) {
      state.device = null;
      update();
      return;
    }
    if (detect) await run({}, null);
  }

  $("btn-connect").addEventListener("click", async () => {
    if (state.device) {
      state.device = null; state.probe = null; state.chip = null;
      showChip(null);
      log("Programmer disconnected.");
      update();
      return;
    }
    let dev;
    try {
      dev = await navigator.usb.requestDevice({ filters: $("opt-all").checked ? [] : S.USB_FILTERS });
    } catch (e) {
      log("No programmer was chosen. Plug it in and choose it in the list the browser shows (More options: list all USB devices).");
      return;
    }
    await useDevice(dev, false, true);
  });

  $("btn-hid").addEventListener("click", async () => {
    let devs;
    try {
      devs = await navigator.hid.requestDevice({ filters: $("opt-all").checked ? [] : S.HID_FILTERS });
    } catch (e) {
      devs = [];
    }
    if (!devs.length) { log("No CMSIS-DAP v1 programmer was chosen."); return; }
    const dev = devs.find((d) => /CMSIS-DAP/i.test(d.productName)) || devs[0];
    await useDevice(dev, true, true);
  });

  async function autoConnect() {
    if (!navigator.usb && !navigator.hid) { update(); return; }
    if (navigator.usb) {
      navigator.usb.addEventListener("connect", (ev) => { if (!state.device && !state.busy) useDevice(ev.device, false, false); });
      navigator.usb.addEventListener("disconnect", (ev) => {
        if (ev.device === state.device) {
          state.device = null; state.probe = null; state.busy = false;
          log("The programmer was unplugged.");
          update();
        }
      });
      const devs = await navigator.usb.getDevices();
      const dev = devs.find((d) => S.usbKind(d)) || devs[0];
      if (dev) { await useDevice(dev, false, false); return; }
    }
    if (navigator.hid) {
      navigator.hid.addEventListener("disconnect", (ev) => {
        if (ev.device === state.device) {
          state.device = null; state.probe = null; state.busy = false;
          log("The programmer was unplugged.");
          update();
        }
      });
      const devs = (await navigator.hid.getDevices()).filter((d) => /CMSIS-DAP/i.test(d.productName));
      if (devs.length) { await useDevice(devs[0], true, false); return; }
    }
    update();
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

  // One session as in tinyocd.py: open the programmer, connect to the chip,
  // act, reset the chip and close the programmer.
  async function run(actions, done, progress) {
    if (!state.device) { log("Connect the programmer first.", "error"); return false; }
    let target = null;
    const ok = await busy(async () => {
      const probe = await openProbe();
      update();
      try {
        target = await S.runSession(probe, { ...actions, speed: Number($("speed").value) }, log, progress);
      } catch (err) {
        if (err.target && err.target.chip) showChip(err.target);
        throw err;
      }
      showChip(target);
      if (done) log(done, "ok");
    });
    return ok ? target : false;
  }

  function showChip(t) {
    const dl = $("chip-facts");
    dl.textContent = "";
    if (!t || !t.chip) {
      state.chip = null;
      dl.innerHTML = "<dt>Chip</dt><dd>Not read yet</dd>";
      document.querySelectorAll("#chip-list tr").forEach((tr) => tr.classList.remove("found"));
      showFirmware();
      update();
      return;
    }
    const c = t.chip;
    state.chip = c;
    const rows = [["Chip", c.name]];
    if (t.cpu) rows.push(["Core", t.cpu]);
    if (t.devid !== undefined) rows.push(["DEV_ID", hex(t.devid, 3) + (t.idcode ? ` (REV_ID ${hex(t.idcode >>> 16, 4)})` : "")]);
    else if (t.idcode) rows.push(["ID", hex(t.idcode)]);
    if (c.flashSize) rows.push(["Flash", `${c.flashSize / 1024} KB at ${hex(c.flashBase)}` + (c.regions.length > 1 ? `, ${c.regions.length} banks` : "")]);
    else rows.push(["Flash", "unknown while locked"]);
    rows.push(["Read protection", t.locked ? "on (locked)" : "off"]);
    rows.push(["BOOT0 pin", c.hasBootpin === "fixed" ? "always usable" : c.hasBootpin === "option" ? "set by option bytes" : "not configurable"]);
    rows.push(["NRST pin", c.hasNrst ? "configurable (GPIO or reset)" : "reset pin"]);
    if (t.dpidr) rows.push(["DPIDR", hex(t.dpidr)]);
    if (t.underReset) rows.push(["Connection", "under reset (NRST)"]);
    if (state.probe) rows.push(["Programmer", state.probe.name]);
    for (const [k, v] of rows) {
      const dt = document.createElement("dt"); dt.textContent = k;
      const dd = document.createElement("dd"); dd.textContent = v;
      dl.append(dt, dd);
    }
    document.querySelectorAll("#chip-list tr").forEach((tr) => tr.classList.toggle("found", tr.dataset.name === c.name));
    showFirmware();
    update();
  }

  $("btn-info").addEventListener("click", () => run({}, "Chip info read; the chip was reset and runs its firmware."));
  $("btn-erase").addEventListener("click", () => {
    if (confirm("Erase the whole flash of the chip? A locked chip is unlocked for this.")) run({ erase: true, unlock: true, unlockQuiet: true }, "Done.");
  });
  $("btn-unlock").addEventListener("click", () => {
    if (confirm("Unlock the chip? Removing the read protection erases the whole flash.")) run({ unlock: true }, "Done.");
  });
  $("btn-lock").addEventListener("click", () => {
    if (confirm("Lock the chip? Its flash can then not be read; unlocking erases it.")) run({ lock: true }, "Done.");
  });
  $("btn-bootpin").addEventListener("click", () => run({ bootpin: true }, "Done."));
  $("btn-gpio").addEventListener("click", () => {
    if (confirm("Make the NRST pin a GPIO pin? The chip can then not be reset by the NRST pin.")) run({ gpio: true }, "Done.");
  });
  $("btn-reset").addEventListener("click", () => run({ reset: true }, "Done."));
  $("btn-read").addEventListener("click", async () => {
    const bar = startProgress();
    const t = await run({ read: true }, null, bar);
    endProgress(t);
    if (!t || !t.dump) return;
    const name = `${t.chip.name.replace(/[^A-Za-z0-9]+/g, "_")}_flash.bin`;
    const url = URL.createObjectURL(new Blob([t.dump], { type: "application/octet-stream" }));
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

  const flashSpan = () => (state.chip && state.chip.flashSize ? state.chip.flashSpan : 0);
  const image = () => FW.buildImage(state.fw.parsed, state.chip ? state.chip.flashBase : null, flashSpan(), WINDOW);
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
      const size = flashSpan();
      if (size) {
        $("fit").hidden = false;
        $("fit").classList.toggle("over", r.image.length > size);
        $("fit-used").style.width = `${Math.min(100, (r.image.length / size) * 100)}%`;
        $("fit-text").textContent = `${(r.image.length / size * 100).toFixed(1)} % of the ${Math.round(state.chip.flashSize / 1024)} KB flash of the connected ${state.chip.name}.`;
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
    const actions = {
      flash: r.image,
      unlock: $("opt-unlock").checked, unlockQuiet: true,
      bootpin: $("opt-bootpin").checked, bootpinSoft: true,
      lock: $("opt-lock").checked,
    };
    if (actions.lock && !confirm("Lock the chip after flashing? Its flash can then not be read; unlocking erases it.")) return;
    const name = state.fw.name;
    const ok = await run(actions, `${name} flashed and verified.`, startProgress());
    endProgress(ok);
  });

  window.addEventListener("beforeunload", (ev) => { if (state.busy) { ev.preventDefault(); ev.returnValue = ""; } });

  showChipList();
  update();
  autoConnect();
})();
