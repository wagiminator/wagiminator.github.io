/* C64 Disk Transfer: user interface (protocol in adapter.js, drive code in drivecode.js) */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const L = window.D64Edit;
  const spt = IEC.sectorsPerTrack;
  const HANDOFF_KEY = "wagiminator.d64-handoff";

  const state = {
    port: null, adapter: null, kind: "", version: "",
    busy: false, cancel: false,
    image: null, imageName: "",        // last image read from a disk
    writeImage: null, writeName: "",   // image chosen for writing
  };

  /* ---------- Log and status ---------- */

  function log(text, isError) {
    const li = document.createElement("li");
    if (isError) li.className = "error";
    const t = document.createElement("time");
    t.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    li.append(t, text);
    $("log").append(li);
    $("log").scrollTop = $("log").scrollHeight;
  }

  function activity(text, isError) {
    $("activity").textContent = text;
    $("activity").classList.toggle("error", !!isError);
    if (isError) log(text, true);
  }

  function updateControls() {
    const ready = !!state.adapter && !state.busy;
    for (const id of ["btn-read", "btn-format", "btn-dir", "btn-detect", "drive"]) $(id).disabled = !ready;
    $("btn-write").disabled = !ready || !state.writeImage;
    $("btn-connect").disabled = state.busy || !navigator.serial;
    $("btn-connect").textContent = state.adapter ? "Disconnect" : "Connect adapter";
    $("adapter-kind").disabled = !!state.adapter;
    $("btn-cancel").hidden = !state.busy;
    const conn = $("conn");
    conn.classList.toggle("connected", !!state.adapter && !state.busy);
    conn.classList.toggle("busy", state.busy);
    $("conn-text").textContent = state.adapter ? `${state.kind} (firmware ${state.version || "?"})` : "Not connected";
  }

  /* ---------- Connecting ---------- */

  const matches = (port) => {
    const i = port.getInfo ? port.getInfo() : {};
    return IEC.USB_FILTERS.some((f) => f.usbVendorId === i.usbVendorId && f.usbProductId === i.usbProductId);
  };

  async function connectPort(port, quiet) {
    try {
      state.busy = true;
      updateControls();
      const { adapter, ident, version } = await IEC.connect(port, $("adapter-kind").value);
      state.port = port;
      state.adapter = adapter;
      state.kind = adapter.kind;
      state.version = version;
      log(ident === adapter.kind ? `Found ${adapter.kind}, firmware ${version}.` : `Using the adapter as ${adapter.kind} (it answered “${ident || "nothing"}”).`);
      await findDrives();
      return true;
    } catch (err) {
      if (!quiet) activity(connectError(err), true);
      return false;
    } finally {
      state.busy = false;
      updateControls();
    }
  }

  function connectError(err) {
    if (err instanceof IEC.AdapterError) return err.message;
    if (err && err.name === "NetworkError") return "The port could not be opened. Close other programs that use the adapter (for example the Python tools) and try again.";
    return `Could not connect: ${err && err.message ? err.message : err}`;
  }

  async function disconnect() {
    if (state.adapter) { try { await state.adapter.link.close(); } catch (e) { /* ignore */ } }
    state.adapter = null;
    state.port = null;
    $("drive-info").textContent = "No drive checked yet.";
    log("Adapter disconnected.");
    updateControls();
  }

  $("btn-connect").addEventListener("click", async () => {
    if (state.adapter) { await disconnect(); return; }
    let port;
    try {
      port = await navigator.serial.requestPort({ filters: IEC.USB_FILTERS });
    } catch (err) {
      activity("No adapter was chosen. Plug in the adapter and choose it in the list your browser shows.");
      return;
    }
    await connectPort(port, false);
  });

  // Reconnect automatically to adapters the browser already knows
  async function autoConnect() {
    if (!navigator.serial) {
      $("unsupported").hidden = false;
      activity("This browser cannot use USB serial devices.", false);
      updateControls();
      return;
    }
    navigator.serial.addEventListener("connect", (ev) => { if (!state.adapter && matches(ev.target)) connectPort(ev.target, true); });
    navigator.serial.addEventListener("disconnect", (ev) => {
      if (state.port && ev.target === state.port) {
        state.adapter = null; state.port = null; state.busy = false;
        log("The adapter was unplugged.", true);
        updateControls();
      }
    });
    const ports = (await navigator.serial.getPorts()).filter(matches);
    for (const p of ports) if (await connectPort(p, true)) return;
    updateControls();
  }

  /* ---------- Drives ---------- */

  async function findDrives() {
    const a = state.adapter;
    activity("Looking for drives…");
    const found = [];
    for (let dev = 8; dev <= 11; dev++) {
      const status = await a.checkDevice(dev);
      if (!status) continue;
      const magic = await a.detectDevice(dev);
      found.push({ dev, status, magic, model: IEC.DEVICES[magic] || "Unknown drive", supported: IEC.SUPPORTED.has(magic) });
    }
    const sel = $("drive");
    if (!found.length) {
      $("drive-info").textContent = "No drive found. Switch the drive on, check the cable and choose Find drives.";
      activity("Connected. No drive found yet.");
      return;
    }
    const pick = found.find((d) => d.supported) || found[0];
    sel.value = String(pick.dev);
    showDrive(pick);
    for (const d of found) log(`Drive ${d.dev}: ${d.model}${d.supported ? "" : " (not supported)"}.`);
    activity(pick.supported ? `Ready: ${pick.model} as drive ${pick.dev}.` : `Drive ${pick.dev} is a ${pick.model}, which is not supported. Only 1541 drives work.`, !pick.supported);
  }

  function showDrive(d) {
    const info = $("drive-info");
    info.textContent = `${d.model} as drive ${d.dev}`;
    const small = document.createElement("small");
    small.textContent = `Status: ${d.status}`;
    info.append(small);
  }

  $("btn-detect").addEventListener("click", () => task(findDrives));
  $("drive").addEventListener("change", () => task(async () => {
    const dev = device();
    const status = await state.adapter.checkDevice(dev);
    if (!status) { $("drive-info").textContent = `No drive answers as device ${dev}.`; return; }
    const magic = await state.adapter.detectDevice(dev);
    showDrive({ dev, status, model: IEC.DEVICES[magic] || "Unknown drive" });
  }));

  function device() { return parseInt($("drive").value, 10); }

  /* ---------- Running operations ---------- */

  async function task(fn) {
    if (state.busy || !state.adapter) return;
    state.busy = true;
    state.cancel = false;
    $("btn-cancel").disabled = false;
    updateControls();
    try {
      await fn();
    } catch (err) {
      activity(err.message || String(err), true);
      try { await state.adapter.headToTrack18(); } catch (e) { /* drive may be busy */ }
    } finally {
      if (state.adapter) state.adapter.timeout = 1000;
      state.busy = false;
      updateControls();
    }
  }

  $("btn-cancel").addEventListener("click", () => {
    state.cancel = true;
    $("btn-cancel").disabled = true;
    activity("Stopping after this track…");
  });

  // Check the drive and upload a fast routine into its memory
  async function prepare(code) {
    const a = state.adapter;
    // Drop anything left over from an interrupted transfer
    await new Promise((r) => setTimeout(r, 50));
    a.link.flushInput();
    const status = await a.checkDevice(device());
    if (!status) throw new Error(`No drive answers as device ${device()}. Is it switched on and connected?`);
    activity("Uploading the fast loader to the drive…");
    if (!(await a.upload(code))) throw new Error("The fast loader could not be uploaded to the drive. Switch the drive off and on and try again.");
  }

  /* ---------- Progress map ---------- */

  let cells = [];
  function buildMap(tracks) {
    const grid = $("disk-map");
    grid.textContent = "";
    cells = [null];
    for (let t = 1; t <= tracks; t++) {
      const label = document.createElement("span");
      label.className = "map-track";
      label.textContent = t % 5 === 0 || t === 1 ? t : "";
      grid.append(label);
      cells[t] = [];
      for (let s = 0; s < 21; s++) {
        const c = document.createElement("span");
        c.className = s < spt(t) ? "cell" : "cell none";
        if (s < spt(t)) { c.title = `Track ${t}, sector ${s}`; cells[t][s] = c; }
        grid.append(c);
      }
    }
  }
  function mark(t, s, cls) { const c = cells[t] && cells[t][s]; if (c) c.className = "cell " + cls; }
  function markTrack(t, cls) { for (let s = 0; s < spt(t); s++) mark(t, s, cls); }
  buildMap(35);

  function stats(done, total, errors, start) {
    const sec = (performance.now() - start) / 1000;
    $("stats").textContent = `${done} of ${total} sectors, ${errors} ${errors === 1 ? "error" : "errors"}, ${Math.round(sec)} s`;
  }

  /* ---------- Disk layout helpers ---------- */

  const totalSectors = (tracks) => { let n = 0; for (let t = 1; t <= tracks; t++) n += spt(t); return n; };
  const sectorIndex = (t, s) => IEC.offsetOf(t, s) / 256;
  const isFreeInBam = (bam, t, s) => !!(bam[4 * t + 1 + (s >> 3)] & (1 << (s & 7)));

  // Sectors to transfer per track: all, or only those used in the BAM (tracks 1-35)
  function plan(tracks, bam) {
    const list = [null];
    for (let t = 1; t <= tracks; t++) {
      const all = [...Array(spt(t)).keys()];
      list[t] = bam && t <= 35 ? all.filter((s) => !isFreeInBam(bam, t, s)) : all;
    }
    return list;
  }

  // Read the sectors in `want` (per track); calls onBlock(t, s, data|null)
  async function readSectors(tracks, want, onBlock, progressText) {
    const a = state.adapter;
    let total = 0, done = 0, errors = 0, stopped = 0;
    for (let t = 1; t <= tracks; t++) total += want[t].length;
    const start = performance.now();
    for (let t = 1; t <= tracks; t++) {
      if (state.cancel) { stopped = t; break; }
      const order = IEC.sectorOrder(t, want[t]);
      if (!order.length) continue;
      activity(`${progressText}: track ${t} of ${tracks}`);
      if (!(await a.startRead(t, order))) throw new Error(`The drive did not start reading track ${t}.`);
      for (let i = 0; i < order.length; i++) {
        const s = order[i];
        mark(t, s, "busy");
        const block = await a.getBlock(3000);
        if (block === null) {
          // The adapter gives up on the rest of the track
          for (const r of order.slice(i)) { onBlock(t, r, null, "lost"); mark(t, r, "error"); errors++; }
          throw Object.assign(new Error(`Track ${t}, sector ${s} could not be read; the transfer stopped there.`), { partial: true, done, errors });
        }
        if (block === "error") { errors++; mark(t, s, "error"); onBlock(t, s, null, "checksum"); }
        else onBlock(t, s, block);
        done++;
        stats(done, total, errors, start);
      }
    }
    return { done, total, errors, stopped, seconds: (performance.now() - start) / 1000 };
  }

  /* ---------- Read disk ---------- */

  $("btn-read").addEventListener("click", () => task(async () => {
    const tracks = parseInt(document.querySelector('input[name="read-tracks"]:checked').value, 10);
    const bamOnly = $("read-bam").checked;
    buildMap(tracks);
    $("stats").textContent = "";
    await prepare("fastread");
    const a = state.adapter;

    const n = totalSectors(tracks);
    const image = new Uint8Array(n * 256);
    for (let i = 0; i < image.length; i += 256) { image[i] = 0x4b; image.fill(0x01, i + 1, i + 256); }
    const errorInfo = new Uint8Array(n).fill(0x01);

    let bam = null;
    if (bamOnly) {
      activity("Reading the BAM…");
      bam = await a.readBlock(18, 0);
      if (!bam) throw new Error("The BAM (track 18, sector 0) could not be read. Try again without “Only read sectors marked as used”.");
    }
    const want = plan(tracks, bam);
    for (let t = 1; t <= tracks; t++) for (let s = 0; s < spt(t); s++) if (!want[t].includes(s)) mark(t, s, "skip");
    log(`Reading ${tracks} tracks from drive ${device()}${bamOnly ? " (used sectors only)" : ""}.`);

    const onBlock = (t, s, data, why) => {
      if (data) { image.set(data, IEC.offsetOf(t, s)); mark(t, s, "ok"); }
      else errorInfo[sectorIndex(t, s)] = why === "checksum" ? 0x05 : 0x02;
    };
    let r, failed = null;
    try {
      r = await readSectors(tracks, want, onBlock, "Reading");
    } catch (err) {
      if (!err.partial) throw err;
      failed = err;
    }
    await a.headToTrack18();

    const errors = failed ? failed.errors : r.errors;
    const withErrors = errors > 0 && $("read-errinfo").checked;
    const result = withErrors ? new Uint8Array([...image, ...errorInfo]) : image;
    showResult(result);
    if (failed) {
      activity(`${failed.message} The image contains what was read so far.`, true);
    } else if (r.stopped) {
      activity(`Stopped before track ${r.stopped}. The image contains tracks 1 to ${r.stopped - 1}.`);
      log(`Reading stopped by you before track ${r.stopped}.`);
    } else {
      activity(errors ? `Done with ${errors} unreadable ${errors === 1 ? "sector" : "sectors"}${withErrors ? " (marked in the error info)" : ""}.` : `Done: ${r.done} sectors read in ${Math.round(r.seconds)} s.`, errors > 0);
      log(`Read ${r.done} sectors, ${errors} ${errors === 1 ? "error" : "errors"}, ${Math.round(r.seconds)} s.`);
    }
  }));

  function showResult(bytes) {
    state.image = bytes;
    let name = "disk";
    try {
      const { disk } = L.Disk.open(bytes.slice().buffer);
      showListing($("result-screen"), disk.name, disk.id, disk.dosType, disk.entries, disk.blocksFree());
      name = L.petsciiToText(disk.name).trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "_").replace(/^[_.]+|[_.]+$/g, "") || "disk";
    } catch (e) {
      $("result-screen").textContent = "";
    }
    $("result-name").value = `${name}.d64`;
    $("result").hidden = false;
  }

  // Directory listing in C64 style
  function showListing(screen, name, id, dos, entries, blocksFree) {
    screen.textContent = "";
    const line = (text) => { const d = document.createElement("div"); d.className = "c64-line"; d.textContent = text; screen.append(d); return d; };
    const head = line("0 ");
    const rev = document.createElement("span");
    rev.className = "reverse";
    rev.textContent = `"${L.petsciiToText(name, true)}" ${L.petsciiToText(id, true)} ${L.petsciiToText(dos, true)}`;
    head.append(rev);
    for (const e of entries) line(L.listingLine(e));
    line(`${blocksFree} BLOCKS FREE.`);
    screen.hidden = false;
  }

  /* ---------- Result actions ---------- */

  function resultFileName() {
    let n = $("result-name").value.trim() || "disk.d64";
    if (!/\.d64$/i.test(n)) n += ".d64";
    return n;
  }

  $("btn-download").addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([state.image], { type: "application/octet-stream" }));
    a.download = resultFileName();
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  // Hand the image to another app on this site via localStorage
  function handOff(path) {
    let bin = "";
    for (const b of state.image) bin += String.fromCharCode(b);
    try {
      localStorage.setItem(HANDOFF_KEY, JSON.stringify({ name: resultFileName(), data: btoa(bin) }));
    } catch (e) {
      activity("The browser did not allow passing the image to the other app. Download it instead.", true);
      return;
    }
    window.open(`${path}?import=transfer`, "_blank");
  }
  $("btn-to-editor").addEventListener("click", () => handOff("../d64-editor/"));
  $("btn-to-viewer").addEventListener("click", () => handOff("../d64-viewer/"));

  /* ---------- Write disk ---------- */

  const WRITE_SIZES = { 174848: 35, 175531: 35, 196608: 40, 197376: 40 };

  function chooseWriteFile(file) {
    file.arrayBuffer().then((buf) => {
      const tracks = WRITE_SIZES[buf.byteLength];
      if (!tracks) {
        state.writeImage = null;
        $("write-file").textContent = `“${file.name}” cannot be written`;
        $("write-info").textContent = `It has ${buf.byteLength.toLocaleString("en")} bytes; only 35 and 40 track images can be written.`;
        updateControls();
        return;
      }
      state.writeImage = new Uint8Array(buf, 0, totalSectors(tracks) * 256);
      state.writeTracks = tracks;
      state.writeName = file.name;
      const bam = state.writeImage.subarray(IEC.offsetOf(18, 0), IEC.offsetOf(18, 0) + 256);
      const used = plan(tracks, bam).reduce((n, l) => n + (l ? l.length : 0), 0);
      $("write-file").textContent = file.name;
      $("write-info").textContent = `${tracks} tracks, disk name “${L.petsciiToText(bam.subarray(0x90, 0xa0))}”, ${used} sectors in use. Choose another file to replace it.`;
      updateControls();
    });
  }
  $("write-input").addEventListener("change", (ev) => { if (ev.target.files[0]) chooseWriteFile(ev.target.files[0]); ev.target.value = ""; });
  const drop = $("write-drop");
  drop.addEventListener("dragover", (ev) => { ev.preventDefault(); drop.classList.add("dragging"); });
  drop.addEventListener("dragleave", () => drop.classList.remove("dragging"));
  drop.addEventListener("drop", (ev) => {
    ev.preventDefault();
    drop.classList.remove("dragging");
    if (ev.dataTransfer.files[0]) chooseWriteFile(ev.dataTransfer.files[0]);
  });

  $("btn-write").addEventListener("click", () => {
    if (!confirm(`Write “${state.writeName}” to the disk in drive ${device()}? Everything on that disk will be overwritten.`)) return;
    task(async () => {
      const image = state.writeImage, tracks = state.writeTracks;
      const bamOnly = $("write-bam").checked;
      buildMap(tracks);
      $("stats").textContent = "";
      await prepare("fastwrite");
      const a = state.adapter;
      a.timeout = 4000;
      const bam = bamOnly ? image.subarray(IEC.offsetOf(18, 0), IEC.offsetOf(18, 0) + 256) : null;
      const want = plan(tracks, bam);
      for (let t = 1; t <= tracks; t++) for (let s = 0; s < spt(t); s++) if (!want[t].includes(s)) mark(t, s, "skip");
      let total = 0, done = 0;
      for (let t = 1; t <= tracks; t++) total += want[t].length;
      log(`Writing ${state.writeName} to drive ${device()}${bamOnly ? " (used sectors only)" : ""}.`);
      const start = performance.now();
      let stoppedAt = 0;
      for (let t = 1; t <= tracks; t++) {
        if (state.cancel) { stoppedAt = t; break; }
        const order = IEC.sectorOrder(t, want[t]);
        if (!order.length) continue;
        activity(`Writing: track ${t} of ${tracks}`);
        if (!(await a.startWrite(t, order))) throw new Error(`The drive did not start writing track ${t}.`);
        for (const s of order) {
          mark(t, s, "busy");
          const off = IEC.offsetOf(t, s);
          if (!(await a.sendBlock(IEC.encodeBlock(image.subarray(off, off + 256))))) {
            mark(t, s, "error");
            throw new Error(`Writing track ${t}, sector ${s} failed. Is the disk write-protected?`);
          }
          mark(t, s, "ok");
          stats(++done, total, 0, start);
        }
        const result = await a.readByte(4000);
        if (result !== 0) {
          markTrack(t, "error");
          throw new Error(`The drive reported an error while writing track ${t}. Is the disk write-protected or damaged?`);
        }
      }
      a.timeout = 1000;
      await a.headToTrack18();
      if (stoppedAt) {
        activity(`Stopped before track ${stoppedAt}. The disk is only partly written.`, true);
        return;
      }
      log(`Wrote ${done} sectors in ${Math.round((performance.now() - start) / 1000)} s.`);
      if (!$("write-verify").checked) { activity(`Done: ${done} sectors written.`); return; }

      // Verify: read everything back and compare
      await prepare("fastread");
      let mismatches = 0;
      const r = await readSectors(tracks, want, (t, s, data) => {
        const off = IEC.offsetOf(t, s);
        const same = data && data.every((b, i) => b === image[off + i]);
        if (!same) mismatches++;
        mark(t, s, same ? "verified" : "error");
      }, "Verifying");
      await a.headToTrack18();
      if (r.stopped) { activity(`Writing done; verifying stopped before track ${r.stopped}.`); return; }
      if (mismatches) activity(`Written, but ${mismatches} ${mismatches === 1 ? "sector differs" : "sectors differ"} when read back.`, true);
      else { activity(`Done: ${done} sectors written and verified.`); log("Verified without differences."); }
    });
  });

  /* ---------- Format disk ---------- */

  // Disk name and ID as PETSCII bytes without padding
  function petscii(text, max) {
    const clean = [...text.toUpperCase()].filter((c) => c >= " " && c <= "_" && !",:\"*?=".includes(c)).slice(0, max).join("");
    return Array.from(L.textToPetscii(clean, clean.length));
  }

  $("btn-format").addEventListener("click", () => {
    const name = petscii($("format-name").value, 16);
    const id = petscii($("format-id").value, 2);
    if (!name.length || id.length !== 2) {
      activity("Enter a disk name and an ID of exactly 2 characters (no , : \" * ? =).", true);
      return;
    }
    if (!confirm(`Format the disk in drive ${device()}? Everything on that disk will be erased.`)) return;
    task(async () => {
      const tracks = parseInt(document.querySelector('input[name="format-tracks"]:checked').value, 10);
      buildMap(tracks);
      $("stats").textContent = "";
      await prepare("fastformat");
      const a = state.adapter;
      const start = performance.now();
      log(`Formatting the disk in drive ${device()} as “${L.petsciiToText(name)}”, ID ${L.petsciiToText(id)}, ${tracks} tracks.`);
      activity("Formatting…");
      if (!(await a.startFormat(tracks, $("format-bump").checked, $("format-clear").checked, $("format-verify").checked, name, id))) {
        throw new Error("The drive did not start formatting.");
      }
      for (let x = 0; x <= tracks; x++) {
        if (x > 0) markTrack(x, "busy");
        const r = await a.readByte(20000);
        if (r !== 0) {
          if (x > 0) markTrack(x, "error");
          throw new Error(r < 0 ? "The drive stopped answering while formatting." : `Formatting failed${x > 0 ? ` on track ${x}` : ""}. Is the disk write-protected?`);
        }
        if (x > 0) {
          markTrack(x, "ok");
          activity(`Formatting: track ${x} of ${tracks}`);
          $("stats").textContent = `${x} of ${tracks} tracks, ${Math.round((performance.now() - start) / 1000)} s`;
        }
      }
      activity(`Done: ${tracks} tracks formatted.`);
      log(`Formatted ${tracks} tracks in ${Math.round((performance.now() - start) / 1000)} s.`);
    });
  });

  /* ---------- Directory ---------- */

  $("btn-dir").addEventListener("click", () => task(async () => {
    await prepare("fastread");
    const a = state.adapter;
    activity("Reading the directory…");
    const bam = await a.readBlock(18, 0);
    if (!bam) throw new Error("The BAM (track 18, sector 0) could not be read. Is there a formatted disk in the drive?");
    const entries = [];
    let t = bam[0], s = bam[1];
    const seen = new Set();
    while (t === 18 && s < spt(18) && !seen.has(s)) {
      seen.add(s);
      const block = await a.readBlock(t, s);
      if (!block) throw new Error(`Directory sector 18/${s} could not be read.`);
      for (let i = 0; i < 8; i++) {
        const p = i * 32;
        if (!block[p + 2]) continue;
        entries.push({ type: block[p + 2], name: block.slice(p + 5, p + 21), blocks: block[p + 30] | (block[p + 31] << 8) });
      }
      t = block[0]; s = block[1];
    }
    await a.headToTrack18();
    let free = 0;
    for (let k = 1; k <= 35; k++) if (k !== 18) free += bam[4 * k];
    showListing($("dir-screen"), bam.slice(0x90, 0xa0), bam.slice(0xa2, 0xa4), bam.slice(0xa5, 0xa7), entries, free);
    activity(`Directory read: ${entries.length} ${entries.length === 1 ? "entry" : "entries"}, ${free} blocks free.`);
  }));

  /* ---------- Tabs ---------- */

  const tabs = [...document.querySelectorAll('[role="tab"]')];
  function selectTab(tab) {
    for (const t of tabs) {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      $(t.getAttribute("aria-controls")).hidden = !on;
    }
  }
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => selectTab(t));
    t.addEventListener("keydown", (ev) => {
      const d = ev.key === "ArrowRight" ? 1 : ev.key === "ArrowLeft" ? -1 : 0;
      if (!d) return;
      const next = tabs[(i + d + tabs.length) % tabs.length];
      selectTab(next);
      next.focus();
    });
  });

  window.addEventListener("beforeunload", (ev) => { if (state.busy) { ev.preventDefault(); ev.returnValue = ""; } });

  updateControls();
  autoConnect();
})();
