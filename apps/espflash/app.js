/* ESP32/ESP8266 Flasher: user interface (protocol in esp.js) */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const E = window.ESPROM;
  const hex = E.hex;
  const size = (n) => (n >= 1 << 20 ? `${+(n / (1 << 20)).toFixed(2)} MB` : n >= 1024 ? `${+(n / 1024).toFixed(1)} KB` : `${n} bytes`);

  const state = {
    port: null,
    busy: false,
    files: [],          // { id, name, data, offset (text), auto: "boot"|"app"|null, edited }
    chip: null,         // { chip (table entry), mac, flashId, flashSize, ... }
  };
  let nextId = 1;

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
    if (err && err.name === "NetworkError") return "The port could not be opened. Close other programs that use it (serial monitor, Arduino IDE, esptool) and try again.";
    if (err && err.name === "SecurityError") return "The browser may not access this port.";
    if (err && err.name === "InvalidStateError") return "The port is already open. Wait a moment and try again.";
    return err && err.message ? err.message : String(err);
  }

  /* ---------- Controls ---------- */

  const autoReset = () => document.querySelector('input[name="reset"]:checked').value === "auto";

  function update() {
    const ok = !!navigator.serial, idle = !state.busy && ok;
    $("btn-flash").disabled = !idle || !state.files.length || fileErrors().length > 0;
    for (const id of ["btn-info", "btn-erase", "btn-reset", "btn-port"]) $(id).disabled = !idle;
    $("btn-reset").disabled = !idle || !autoReset();
    $("file-input").disabled = state.busy;
    $("baud").disabled = state.busy;
    document.querySelectorAll('input[name="reset"]').forEach((r) => { r.disabled = state.busy; });
    document.querySelectorAll("#file-rows input, #file-rows button").forEach((el) => { el.disabled = state.busy; });
    const p = state.port;
    $("btn-port").textContent = p ? "Choose another port" : "Choose serial port";
    $("conn").className = "conn" + (state.busy ? " busy" : p ? " connected" : "");
    $("conn-text").textContent = state.busy ? "Working …" : p ? "Serial port chosen" : "No port chosen";
    let note = "Every action asks for the serial port the first time.";
    if (p) {
      const i = p.getInfo ? p.getInfo() : {};
      if (i.usbVendorId === E.ESPRESSIF_VID) note = i.usbProductId === E.USB_JTAG_SERIAL_PID ? "Built-in USB-Serial/JTAG port of the chip" : "Built-in USB port of the chip (USB-OTG)";
      else if (i.usbVendorId !== undefined) note = `USB ID ${i.usbVendorId.toString(16).padStart(4, "0")}:${i.usbProductId.toString(16).padStart(4, "0")}, writing at ${$("baud").value} baud`;
      else note = `Writing at ${$("baud").value} baud`;
    }
    $("link-note").textContent = note;
    $("unsupported").hidden = ok;
  }

  document.querySelectorAll('input[name="reset"]').forEach((r) => r.addEventListener("change", () => {
    $("opt-reset").disabled = !autoReset();
    if (!autoReset()) $("opt-reset").checked = false;
    update();
  }));
  $("baud").addEventListener("change", update);

  /* ---------- Choosing the port ---------- */

  async function choose() {
    try {
      state.port = await navigator.serial.requestPort();
      return state.port;
    } catch (e) {
      log("No serial port was chosen. Plug in the board; its port then appears in the list the browser shows.");
      return null;
    }
  }

  $("btn-port").addEventListener("click", async () => { if (await choose()) log("Port chosen."); update(); });

  if (navigator.serial) {
    navigator.serial.addEventListener("disconnect", (ev) => {
      if (ev.target === state.port && !state.busy) { state.port = null; log("The serial port was unplugged."); update(); }
    });
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
      showFiles();
    }
  }

  // Connect, identify the chip, prepare the flash, run fn(ld), reset or not
  async function run(fn, opts) {
    let port = state.port;
    if (!port) port = await choose();      // needs the click that started this
    if (!port) return null;
    opts = opts || {};
    return busy(async () => {
      const ld = new E.Loader(port, Number($("baud").value), log);
      const manual = !autoReset();
      log(manual ? "Connecting (the chip should be in download mode) …" : "Resetting the chip into download mode …");
      try {
        await ld.connect(!manual);
        const chip = await ld.detect();
        const c = { chip, usbJtag: ld.usbJtag, usbOtg: ld.usbOtg, secureDownload: ld.secureDownload, sec: ld.secure };
        if (!ld.secureDownload) {
          try { c.mac = await ld.readMac(); } catch (e) { c.mac = null; }
          await ld.attachFlash();
          try {
            c.flashId = await ld.flashId();
            c.flashSize = E.FLASH_SIZES[(c.flashId >> 16) & 0xff] || 0;
          } catch (e) { c.flashId = null; }
        } else {
          await ld.attachFlash();
        }
        if (c.flashId === 0xffffff || c.flashId === 0) { c.flashSize = 0; c.noFlash = true; }
        await ld.setFlashSize(c.flashSize || 4 << 20);
        state.chip = c;
        showChip();
        showFiles();
        if (opts.fast && await ld.changeBaud(ld.baud)) log(`Switched to ${ld.baud} baud.`);
        await fn(ld, c);
        if (opts.reset && !manual) {
          await ld.hardReset();
          log(ld.usbOtg ? "Press RESET on the board to start the program." : "The chip restarts and runs its program.", "ok");
        } else if (opts.stayNote) {
          log("The chip stays in download mode; press RESET to start the program.");
        }
      } finally {
        await ld.close();
      }
    });
  }

  function showChip() {
    const c = state.chip, dl = $("chip-facts");
    const rows = [["Chip", c.chip.name]];
    if (c.mac) rows.push(["MAC address", c.mac]);
    if (c.flashId !== undefined && c.flashId !== null) {
      const vendor = E.FLASH_VENDORS[c.flashId & 0xff];
      const jedec = [c.flashId & 0xff, (c.flashId >> 8) & 0xff, (c.flashId >> 16) & 0xff].map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase();
      rows.push(["Flash", c.noFlash ? "no answer from the flash chip" : `${c.flashSize ? size(c.flashSize) : "size unknown"}${vendor ? `, ${vendor}` : ""} (JEDEC ID ${jedec})`]);
    }
    rows.push(["Connection", c.usbJtag ? "built-in USB-Serial/JTAG" : c.usbOtg ? "built-in USB (OTG)" : "serial converter"]);
    if (c.sec) {
      const crypt = c.sec.cryptCnt ? c.sec.cryptCnt.toString(2).split("").filter((x) => x === "1").length % 2 === 1 : false;
      rows.push(["Secure boot", c.sec.flags & 1 ? "on" : "off"]);
      rows.push(["Flash encryption", crypt ? "on" : "off"]);
      if (c.secureDownload) rows.push(["Download mode", "secure (limited)"]);
    }
    dl.textContent = "";
    for (const [k, v] of rows) {
      const dt = document.createElement("dt"); dt.textContent = k;
      const dd = document.createElement("dd"); dd.textContent = v;
      dl.append(dt, dd);
    }
    log(`${c.chip.name}${c.mac ? `, MAC ${c.mac}` : ""}${c.flashSize ? `, ${size(c.flashSize)} flash` : ""}.`, "ok");
    if (c.noFlash) log("The flash chip does not answer. Check its wiring and supply, or GPIOs used by other hardware.", "error");
    if (c.secureDownload) log("The chip is in secure download mode: chip info and the check after writing are not available.");
  }

  $("btn-info").addEventListener("click", () => run(async () => {}, { reset: true }));

  $("btn-erase").addEventListener("click", () => {
    if (!confirm("Erase the whole flash? The program, Wi-Fi settings and all stored data are lost.")) return;
    progressStart("Erasing …");
    run(async (ld, c) => {
      const sz = c.flashSize || 4 << 20;
      log(`Erasing ${size(sz)} of flash; this can take a minute …`);
      const t = performance.now();
      await ld.flashBegin(sz, 0);
      log(`Flash erased in ${((performance.now() - t) / 1000).toFixed(1)} s.`, "ok");
    }, { reset: false, stayNote: true }).then((ok) => progressEnd(ok, true));
  });

  $("btn-reset").addEventListener("click", async () => {
    let port = state.port || await choose();
    if (!port) return;
    busy(async () => {
      const ld = new E.Loader(port, 115200, log);
      await ld.openLink(115200);
      try { await ld.hardReset(); } finally { await ld.close(); }
      log(ld.usbOtg ? "Reset sent; with the built-in USB-OTG port press RESET on the board." : "The chip restarts and runs its program.", "ok");
    });
  });

  /* ---------- Firmware files ---------- */

  function parseOffset(t) {
    t = String(t).trim();
    if (/^0x[0-9a-f]+$/i.test(t)) return parseInt(t, 16);
    if (/^\d+$/.test(t)) return Number(t);
    return NaN;
  }

  // Offset of a file: the guessed one follows the chip until it is edited
  function resolve(f, chip) {
    if (f.edited || !f.auto) return parseOffset(f.offset);
    if (!chip) return parseOffset(f.offset);
    const solo = state.files.length === 1;
    return f.auto === "boot" ? chip.boot : solo && chip.rom8266 ? 0 : chip.app;
  }

  function addFiles(list) {
    if (state.busy) return;
    Promise.all([...list].map((file) => file.arrayBuffer().then((buf) => ({ file, data: new Uint8Array(buf) })))).then((items) => {
      for (const { file, data } of items) {
        if (!data.length) { log(`${file.name} is empty.`, "error"); continue; }
        const g = E.guessOffset(file.name, data, state.files.length + items.length);
        const f = { id: nextId++, name: file.name, data, auto: typeof g === "string" ? g : null, edited: false };
        f.label = g === "boot" ? "bootloader" : g === "app" ? "program" : g === 0x8000 ? "partition table" : g === 0xe000 ? "OTA selector (boot_app0)" : g === 0xd000 ? "OTA data" : g === 0 && E.isMerged(data) ? "merged image" : "";
        f.offset = g === null ? "" : typeof g === "number" ? hex(g, 1) : g === "boot" ? hex(0x1000, 1) : hex(0x10000, 1);
        // Replace a file of the same name
        const i = state.files.findIndex((x) => x.name === f.name);
        if (i >= 0) state.files[i] = f; else state.files.push(f);
        log(`Loaded ${file.name} (${size(data.length)}).`);
      }
      showFiles();
      update();
    });
  }

  function fileErrors() {
    const errs = [], chip = state.chip && state.chip.chip, fsz = state.chip && state.chip.flashSize;
    const placed = [];
    for (const f of state.files) {
      const off = resolve(f, chip);
      if (isNaN(off)) { errs.push(`Enter the address for ${f.name} (e.g. 0x10000).`); continue; }
      if (fsz && off + f.data.length > fsz) errs.push(`${f.name} does not fit: it ends at ${hex(off + f.data.length)}, the flash has ${size(fsz)}.`);
      for (const p of placed) if (off < p.end && p.off < off + f.data.length) errs.push(`${f.name} overlaps ${p.name}.`);
      placed.push({ name: f.name, off, end: off + f.data.length });
      const info = E.imageInfo(f.data);
      if (chip && !chip.rom8266 && info && info.chipId !== undefined && E.IMAGE_CHIP[info.chipId] !== chip.name && (off === chip.boot || off === chip.app)) {
        errs.push(`${f.name} is built for the ${E.IMAGE_CHIP[info.chipId]}, but the chip is an ${chip.name}.`);
      }
    }
    return errs;
  }

  function showFiles() {
    const tb = $("file-rows"), chip = state.chip && state.chip.chip;
    $("files").hidden = !state.files.length;
    $("drop").classList.toggle("loaded", state.files.length > 0);
    // Keep the focused input while typing
    const focused = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.id : null;
    if (!focused) {
      tb.textContent = "";
      for (const f of state.files) {
        const tr = document.createElement("tr");
        const name = document.createElement("td");
        const info = E.imageInfo(f.data);
        let what = f.label;
        if (info && info.chipId !== undefined && !(chip && chip.rom8266)) what += (what ? ", " : "") + `for ${E.IMAGE_CHIP[info.chipId]}`;
        name.innerHTML = "";
        const b = document.createElement("span"); b.className = "fname"; b.textContent = f.name;
        name.append(b);
        if (what) { const s = document.createElement("small"); s.textContent = what; name.append(s); }
        const sz = document.createElement("td"); sz.className = "num"; sz.textContent = size(f.data.length);
        const ad = document.createElement("td");
        const inp = document.createElement("input");
        inp.value = f.edited || !f.auto || !chip ? f.offset : hex(resolve(f, chip), 1);
        inp.dataset.id = f.id;
        inp.spellcheck = false;
        inp.setAttribute("aria-label", `Address of ${f.name}`);
        inp.placeholder = "0x…";
        inp.addEventListener("input", () => { f.offset = inp.value; f.edited = true; showMessages(); update(); });
        inp.addEventListener("blur", () => showFiles());
        ad.append(inp);
        const rm = document.createElement("td");
        const x = document.createElement("button");
        x.type = "button"; x.className = "rm"; x.textContent = "×"; x.title = `Remove ${f.name}`;
        x.setAttribute("aria-label", `Remove ${f.name}`);
        x.addEventListener("click", () => { state.files = state.files.filter((y) => y !== f); showFiles(); update(); });
        rm.append(x);
        tr.append(name, sz, ad, rm);
        tb.append(tr);
      }
    }
    showMessages();
  }

  function showMessages() {
    const ul = $("fw-messages");
    ul.textContent = "";
    const msg = (cls, t) => { const li = document.createElement("li"); li.className = cls; li.textContent = t; ul.append(li); };
    fileErrors().forEach((e) => msg("error", e));
    const chip = state.chip && state.chip.chip;
    if (!chip && state.files.some((f) => f.auto === "boot" && !f.edited)) msg("note", "The bootloader address depends on the chip (0x1000 on the ESP32 and ESP32-S2, 0x0 on most newer chips, 0x2000 on the ESP32-C5 and -P4); it is set when the chip is known.");
    const sorted = state.files.map((f) => resolve(f, chip)).filter((x) => !isNaN(x));
    if (state.files.length > 1 && !sorted.includes(chip ? chip.boot : 0x1000) && !sorted.includes(0)) msg("warning", "There is no file at the bootloader address. That is fine for updating only the program.");
  }

  $("file-input").addEventListener("change", (ev) => { if (ev.target.files.length) addFiles(ev.target.files); ev.target.value = ""; });
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
    if (ev.dataTransfer.files.length) addFiles(ev.dataTransfer.files);
  });

  /* ---------- Progress ---------- */

  function progressStart(text) {
    $("progress").hidden = false;
    $("progress-bar").style.width = "0%";
    $("progress-bar").className = text ? "busy" : "";
    $("progress-label").textContent = text || "";
  }
  function progressEnd(ok, full) {
    if (ok === null) { $("progress").hidden = true; return; }
    $("progress-bar").className = ok ? "" : "failed";
    if (full || ok) $("progress-bar").style.width = "100%";
    $("progress-label").textContent = ok ? "Done" : "Failed";
  }

  /* ---------- Flashing ---------- */

  $("btn-flash").addEventListener("click", async () => {
    if (fileErrors().length) return;
    if ($("opt-erase").checked && !confirm("Erase the whole flash before writing? Wi-Fi settings and stored data are lost.")) return;
    progressStart();
    const ok = await run(async (ld, c) => {
      const errs = fileErrors();
      if (errs.length) throw new E.EspError(errs[0]);
      const files = state.files.map((f) => ({ name: f.name, offset: resolve(f, c.chip), data: f.data })).sort((a, b) => a.offset - b.offset);
      for (const f of state.files) if (f.auto && !f.edited) log(`${f.name} goes to ${hex(resolve(f, c.chip), 1)} on the ${c.chip.name}.`);
      await E.writeFlash(ld, files, { eraseAll: $("opt-erase").checked, flashSize: c.flashSize || 4 << 20 }, (i, done, total, phase) => {
        const fr = total ? done / total : 1;
        $("progress-bar").style.width = `${Math.round(fr * 100)}%`;
        $("progress-bar").className = phase === "verify" ? "verify" : phase === "erase" ? "busy" : "";
        $("progress-label").textContent = phase === "erase" ? "Erasing …" : phase === "verify" ? "Checking …" : `Writing ${Math.round(fr * 100)} %`;
      });
      log(`${files.length === 1 ? files[0].name : `${files.length} files`} written${c.chip.rom8266 || c.secureDownload ? "" : " and verified"}.`, "ok");
    }, { fast: true, reset: $("opt-reset").checked, stayNote: true });
    progressEnd(ok);
  });

  window.addEventListener("beforeunload", (ev) => { if (state.busy) { ev.preventDefault(); ev.returnValue = ""; } });

  update();
})();
