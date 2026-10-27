/* Game Console Flasher: user interface (games in games.js, programmer in ../rvprog/rvprog.js) */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const R = window.RVPROG;
  const GC = window.GAMECONSOLE;
  const GAMES = GC.GAMES;

  const state = {
    game: null,         // selected game
    bins: {},           // downloaded binaries by game id
    device: null,       // USBDevice
    mode: null,         // "rv" | "arm"
    link: null,         // UsbLink
    prog: null,         // Programmer
    busy: false,
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

  /* ---------- Games ---------- */

  function buildList() {
    const box = $("games");
    for (const g of GAMES) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "game-card";
      b.setAttribute("role", "radio");
      b.dataset.id = g.id;
      const img = document.createElement("img");
      img.src = g.shotUrls[0];
      img.alt = "";
      img.loading = "lazy";
      img.width = 128; img.height = 64;
      const name = document.createElement("strong");
      name.textContent = g.name;
      const genre = document.createElement("span");
      genre.textContent = g.genre;
      b.append(img, name, genre);
      b.addEventListener("click", () => select(g.id, true));
      b.addEventListener("keydown", (ev) => {
        const i = GAMES.indexOf(g);
        let j = -1;
        if (ev.key === "ArrowRight" || ev.key === "ArrowDown") j = (i + 1) % GAMES.length;
        if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") j = (i + GAMES.length - 1) % GAMES.length;
        if (j >= 0) { ev.preventDefault(); select(GAMES[j].id, true); box.children[j].focus(); }
      });
      box.append(b);
    }
  }

  function select(id, user) {
    const g = GAMES.find((x) => x.id === id) || GAMES[0];
    state.game = g;
    for (const b of $("games").children) {
      const on = b.dataset.id === g.id;
      b.classList.toggle("selected", on);
      b.setAttribute("aria-checked", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
    }
    $("game-name").textContent = g.name;
    $("game-meta").textContent = g.genre + (g.by ? ` · originally by ${g.by} for the ATtiny85` : "");
    $("game-text").textContent = g.text;
    $("game-tip").hidden = !g.tip;
    $("game-tip").textContent = g.tip || "";
    $("game-src").href = g.srcUrl;
    const shots = $("shots");
    shots.textContent = "";
    g.shotUrls.forEach((url, i) => {
      const fig = document.createElement("figure");
      const img = document.createElement("img");
      img.src = url;
      img.alt = `${g.name}, screenshot ${i + 1}`;
      img.width = 384; img.height = 192;
      img.addEventListener("error", () => { fig.classList.add("missing"); });
      fig.append(img);
      shots.append(fig);
    });
    showFlashGame();
    if (user) {
      try { history.replaceState(null, "", "#" + g.id); } catch (e) { /* file:// */ }
    }
    update();
  }

  function showFlashGame() {
    const g = state.game;
    const bin = state.bins[g.id];
    $("flash-game").textContent = bin ? `${g.name}, ${bin.length.toLocaleString("en")} bytes` : g.name;
    $("btn-flash").textContent = `Flash ${g.name}`;
  }

  /* ---------- Controls ---------- */

  function update() {
    const rv = state.mode === "rv" && !!state.prog;
    $("btn-flash").disabled = !rv || state.busy || !state.game;
    $("btn-connect").disabled = state.busy || !navigator.usb;
    $("btn-connect").textContent = state.device ? "Disconnect" : "Connect WCH-Link";
    $("btn-rvmode").hidden = state.mode !== "arm";
    $("btn-rvmode").disabled = state.busy;

    const conn = $("conn");
    conn.className = "conn" + (state.busy ? " busy" : state.mode === "arm" ? " arm" : rv ? " connected" : "");
    const note = $("link-note");
    note.className = "link-note";
    if (!state.device) {
      $("conn-text").textContent = "Not connected";
      note.textContent = "Plug the WCH-LinkE into USB and wire it to the PROG header of the console.";
    } else if (state.mode === "arm") {
      $("conn-text").textContent = "WCH-Link in ARM mode";
      note.textContent = "The blue LED is on: the WCH-Link is set up for ARM chips. Switch it to RISC-V mode.";
    } else if (state.prog) {
      $("conn-text").textContent = `${state.prog.linkName} v${state.prog.linkVersion}`;
      if (state.prog.linkVerCode < 211) { note.className = "link-note warn"; note.textContent = "The firmware of the WCH-Link is old and should be updated (WCH-LinkUtility)."; }
      else note.textContent = "Ready.";
    } else {
      $("conn-text").textContent = "Connecting …";
      note.textContent = "";
    }
  }

  /* ---------- Connecting (as in the WCH RISC-V Programmer) ---------- */

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
      log(`Found ${state.prog.linkName} v${state.prog.linkVersion}.`, "ok");
      if (state.prog.linkVerCode < 211) log("The WCH-Link firmware needs to be updated.", "error");
    } catch (err) {
      log(errorText(err), "error");
      await release();
    }
    update();
  }

  async function release() {
    if (state.link) await state.link.close();
    state.link = null; state.prog = null; state.device = null; state.mode = null;
  }

  function errorText(err) {
    const m = err && err.message ? err.message : String(err);
    if (err && err.name === "SecurityError") return "The browser does not allow access to this device. On Linux, add the udev rules (see Setup); on Windows, install the WinUSB driver with Zadig.";
    if (err && err.name === "NetworkError") return "The WCH-Link could not be opened. Close other programs that use it (WCH-LinkUtility, MounRiver, OpenOCD, rvprog) and try again.";
    if (/^Failed to identify the chip/.test(m)) return "The chip does not answer. Check the wiring to the PROG header (VCC, GND, DIO) and that the console has power. If it still fails, unbrick the chip with the WCH RISC-V Programmer.";
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

  $("btn-rvmode").addEventListener("click", async () => {
    const arm = state.device;
    state.busy = true;
    update();
    try {
      log("Switching WCH-Link to RISC-V mode …");
      await R.rvMode(arm);
      state.device = null; state.mode = null;
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

  /* ---------- Flashing ---------- */

  $("btn-flash").addEventListener("click", async () => {
    if (state.busy || !state.prog) return;
    const g = state.game;
    state.busy = true;
    update();
    const bar = $("progress-bar");
    $("progress").hidden = false;
    bar.style.width = "0%";
    try {
      let bin = state.bins[g.id];
      if (!bin) {
        log(`Downloading ${g.name} …`);
        bin = await GC.fetchBinary(g);
        state.bins[g.id] = bin;
        log(`${g.name}: ${bin.length.toLocaleString("en")} bytes.`);
        showFlashGame();
      }
      const fw = R.readFirmware(g.id + ".bin", bin);
      await R.runActions(state.prog, {
        flash: (prog) => {
          if (!/^CH32V003/.test(prog.chipName || "")) {
            throw new R.ProgError(`The connected chip is a ${prog.chipName || "unknown chip"}, not the CH32V003 of the game console.`);
          }
          const r = R.buildImage(fw, prog.family, prog.flashSize);
          if (r.errors.length) throw new R.ProgError(r.errors[0]);
          return r.image;
        },
      }, (t) => log(t), (f) => { bar.style.width = `${Math.round(f * 100)}%`; });
      log(`${g.name} is on the console. Have fun!`, "ok");
    } catch (err) {
      log(errorText(err), "error");
      $("progress").hidden = true;
    } finally {
      state.busy = false;
      update();
    }
  });

  window.addEventListener("beforeunload", (ev) => { if (state.busy) { ev.preventDefault(); ev.returnValue = ""; } });

  /* ---------- Start ---------- */

  buildList();
  const fromHash = decodeURIComponent((location.hash || "").slice(1));
  select(GAMES.some((g) => g.id === fromHash) ? fromHash : GAMES[0].id, false);
  window.addEventListener("hashchange", () => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (GAMES.some((g) => g.id === id) && (!state.game || state.game.id !== id)) select(id, false);
  });
  update();
  autoConnect();
})();
