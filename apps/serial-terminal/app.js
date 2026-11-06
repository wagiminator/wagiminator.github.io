/* Serial Terminal: Web Serial connection, terminal view and send line */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const MAX_LINES = 10000;              // lines kept in the terminal view
  const MAX_HISTORY = 2 << 20;          // bytes of received/sent data kept for redrawing
  const REDRAW_BYTES = 256 << 10;       // bytes redrawn when the view changes
  const SEND_HISTORY = 50;              // remembered sent lines
  const STORE = "serial-terminal";      // localStorage key

  // Known USB-to-serial converters (VID:PID)
  const CHIPS = {
    "1a86:7523": "CH340", "1a86:5523": "CH341", "1a86:7522": "CH340K", "1a86:55d3": "CH343",
    "1a86:55d4": "CH9102", "1a86:55d2": "CH342", "10c4:ea60": "CP210x", "10c4:ea70": "CP2105",
    "0403:6001": "FT232R", "0403:6010": "FT2232", "0403:6014": "FT232H", "0403:6015": "FT231X",
    "067b:2303": "PL2303", "067b:23a3": "PL2303GC", "2e8a:000a": "Raspberry Pi Pico", "1209:0001": "CDC device",
  };

  const state = {
    port: null,
    open: false,
    busy: false,
    keepReading: false,
    reader: null,
    readLoop: null,
    rx: 0,
    tx: 0,
    history: [],                      // { t, dir: "rx" | "tx" | "sys" | "err", data }
    historyBytes: 0,
    pending: [],                      // records waiting to be drawn
    frame: 0,
    sent: [],                         // send history
    sentPos: -1,
  };

  /* ---------- Settings ---------- */

  function loadSettings() {
    let s = {};
    try { s = JSON.parse(localStorage.getItem(STORE) || "{}") || {}; } catch (e) { s = {}; }
    if (s.baud) $("baud").value = s.baud;
    if (s.dataBits) $("data-bits").value = s.dataBits;
    if (s.parity) $("parity").value = s.parity;
    if (s.stopBits) $("stop-bits").value = s.stopBits;
    if (s.flow) $("flow").value = s.flow;
    if (typeof s.eol === "string") $("send-eol").value = s.eol;
    if (s.view === "hex") document.querySelector('input[name="view"][value="hex"]').checked = true;
    if (typeof s.time === "boolean") $("opt-time").checked = s.time;
    if (typeof s.echo === "boolean") $("opt-echo").checked = s.echo;
    if (Array.isArray(s.sent)) state.sent = s.sent.filter((x) => typeof x === "string").slice(-SEND_HISTORY);
  }

  function saveSettings() {
    const s = {
      baud: $("baud").value, dataBits: $("data-bits").value, parity: $("parity").value,
      stopBits: $("stop-bits").value, flow: $("flow").value, eol: $("send-eol").value,
      view: view(), time: $("opt-time").checked, echo: $("opt-echo").checked, sent: state.sent,
    };
    try { localStorage.setItem(STORE, JSON.stringify(s)); } catch (e) { /* private mode */ }
  }

  function view() { return document.querySelector('input[name="view"]:checked').value; }

  function baudRate() {
    const v = Number($("baud").value);
    return Number.isInteger(v) && v >= 50 && v <= 4000000 ? v : 0;
  }

  function formatText() {
    const p = { none: "N", even: "E", odd: "O" }[$("parity").value];
    return `${baudRate()} ${$("data-bits").value}${p}${$("stop-bits").value}` + ($("flow").value === "hardware" ? " RTS/CTS" : "");
  }

  /* ---------- Terminal view ---------- */

  const term = $("term");
  const CTRL_RE = /\r\n|\r|\n|[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g;
  const ANSI_RE = /\x1b\[[0-?]*[ -\/]*[@-~]|\x1b[@-Z\\-_]/g;
  const ANSI_TAIL_RE = /\x1b(\[[0-?]*[ -\/]*)?$/;

  function two(n) { return String(n).padStart(2, "0"); }
  function stamp(t) {
    const d = new Date(t);
    return `${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, "0")} `;
  }
  const CTL_NAMES = ["NUL", "SOH", "STX", "ETX", "EOT", "ENQ", "ACK", "BEL", "BS", "HT", "LF", "VT", "FF", "CR", "SO", "SI",
    "DLE", "DC1", "DC2", "DC3", "DC4", "NAK", "SYN", "ETB", "CAN", "EM", "SUB", "ESC", "FS", "GS", "RS", "US"];
  function ctlPicture(ch) {
    const c = ch.charCodeAt(0);
    return `<${c === 0x7f ? "DEL" : CTL_NAMES[c]}>`;
  }
  function hex2(b) { return b.toString(16).toUpperCase().padStart(2, "0"); }

  // Draws records as text or hex dump; keeps the state of the current line
  const view_ = {
    reset() {
      term.textContent = "";
      this.line = null;                 // open line element (text mode)
      this.lineDir = null;
      this.lastCR = { rx: false, tx: false };
      this.carry = { rx: "", tx: "" };
      this.dec = { rx: new TextDecoder("utf-8"), tx: new TextDecoder("utf-8") };
      this.row = null;                  // open hex row
    },

    newLine(t, cls) {
      const el = document.createElement("div");
      el.className = "l" + (cls ? " " + cls : "");
      if ($("opt-time").checked) {
        const ts = document.createElement("span");
        ts.className = "ts";
        ts.textContent = stamp(t);
        el.append(ts);
      }
      term.append(el);
      return el;
    },

    endLine() { this.line = null; this.row = null; },

    // Text mode: open line (a line of received data continues after sent data)
    lineFor(t, dir) {
      if (!this.line) { this.line = this.newLine(t, ""); this.lineDir = dir; }
      return this.line;
    },

    appendText(t, dir, s) {
      const el = this.lineFor(t, dir);
      const cls = dir === "tx" ? "tx" : "";
      const last = el.lastChild;
      if (last && last.nodeType === 1 && last.dataset.k === cls) { last.textContent += s; return; }
      if (!cls && last && last.nodeType === 3) { last.data += s; return; }
      if (!cls) { el.append(document.createTextNode(s)); return; }
      const sp = document.createElement("span");
      sp.className = cls;
      sp.dataset.k = cls;
      sp.textContent = s;
      el.append(sp);
    },

    appendCtl(t, dir, ch) {
      const el = this.lineFor(t, dir);
      const sp = document.createElement("span");
      sp.className = dir === "tx" ? "ctl tx" : "ctl";
      sp.textContent = ctlPicture(ch);
      el.append(sp);
    },

    text(rec) {
      const dir = rec.dir;
      let s = this.carry[dir] + this.dec[dir].decode(rec.data, { stream: true });
      this.carry[dir] = "";
      const tail = s.match(ANSI_TAIL_RE);         // escape sequence split over two chunks
      if (tail && tail[0].length < 32) { this.carry[dir] = tail[0]; s = s.slice(0, -tail[0].length); }
      s = s.replace(ANSI_RE, "");
      if (this.lastCR[dir] && s[0] === "\n") s = s.slice(1);
      if (!s.length) return;
      this.lastCR[dir] = s[s.length - 1] === "\r";
      if (this.line && this.lineDir !== dir && dir === "rx" && this.lineDir === "tx") this.endLine();
      let pos = 0, m;
      CTRL_RE.lastIndex = 0;
      while ((m = CTRL_RE.exec(s))) {
        if (m.index > pos) this.appendText(rec.t, dir, s.slice(pos, m.index));
        const c = m[0];
        if (c === "\n" || c === "\r" || c === "\r\n") {
          if (dir === "tx") this.appendText(rec.t, dir, " \u21b5");   // sent line ending
          this.lineFor(rec.t, dir);
          this.endLine();
        } else {
          this.appendCtl(rec.t, dir, c);
        }
        pos = m.index + c.length;
      }
      if (pos < s.length) this.appendText(rec.t, dir, s.slice(pos));
    },

    hex(rec) {
      const d = rec.data;
      for (let i = 0; i < d.length; i++) {
        if (!this.row || this.row.n === 16 || this.row.dir !== rec.dir) {
          if (this.row && this.row.dirty) this.flushRow();
          const el = this.newLine(rec.t, rec.dir === "tx" ? "tx" : "");
          const h = document.createElement("span");
          const a = document.createElement("span");
          a.className = "asc";
          el.append(h, a);
          this.row = { el, h, a, n: 0, dir: rec.dir, hex: "", asc: "" };
        }
        const r = this.row;
        const b = d[i];
        r.hex += hex2(b) + " ";
        r.asc += b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : ".";
        r.n++;
        r.dirty = true;
      }
      if (this.row && this.row.dirty) this.flushRow();
    },

    flushRow() {
      const r = this.row;
      r.h.textContent = r.hex.padEnd(48, " ") + " ";
      r.a.textContent = r.asc;
      r.dirty = false;
    },

    message(rec) {
      this.endLine();
      const el = this.newLine(rec.t, rec.dir === "err" ? "err" : "sys");
      el.append(rec.data);
      this.endLine();
    },

    add(rec) {
      if (rec.dir === "sys" || rec.dir === "err") { this.message(rec); return; }
      if (rec.dir === "tx" && !$("opt-echo").checked) return;
      if (view() === "hex") this.hex(rec); else this.text(rec);
    },
  };

  function atBottom() { return term.scrollTop + term.clientHeight >= term.scrollHeight - 8; }

  function trimLines() {
    let n = term.childElementCount - MAX_LINES;
    while (n-- > 0) term.firstElementChild.remove();
  }

  function draw() {
    state.frame = 0;
    const stick = atBottom();
    const recs = state.pending;
    state.pending = [];
    for (const r of recs) view_.add(r);
    trimLines();
    if (stick) term.scrollTop = term.scrollHeight;
    else if (recs.length) $("btn-end").hidden = false;
    $("counts").textContent = `RX ${state.rx.toLocaleString("en")} · TX ${state.tx.toLocaleString("en")}`;
  }

  function schedule() { if (!state.frame) state.frame = requestAnimationFrame(draw); }

  function record(dir, data) {
    const rec = { t: Date.now(), dir, data };
    state.history.push(rec);
    state.historyBytes += data.length;
    while (state.historyBytes > MAX_HISTORY && state.history.length > 1) state.historyBytes -= state.history.shift().data.length;
    state.pending.push(rec);
    schedule();
  }

  function message(text, error) { record(error ? "err" : "sys", text); }

  // Draw the newest part of the history again (view or timestamp setting changed)
  function redraw() {
    if (state.frame) { cancelAnimationFrame(state.frame); state.frame = 0; }
    state.pending = [];
    view_.reset();
    let i = state.history.length, bytes = 0;
    while (i > 0 && bytes < REDRAW_BYTES) bytes += state.history[--i].data.length;
    for (; i < state.history.length; i++) view_.add(state.history[i]);
    trimLines();
    term.scrollTop = term.scrollHeight;
    $("btn-end").hidden = true;
  }

  function clearTerminal() {
    state.history = [];
    state.historyBytes = 0;
    state.rx = 0;
    state.tx = 0;
    redraw();
    $("counts").textContent = "RX 0 · TX 0";
  }

  function saveTerminal() {
    const lines = [];
    for (const el of term.children) lines.push(el.textContent.replace(/\s+$/, ""));
    const blob = new Blob([lines.join("\n") + "\n"], { type: "text/plain" });
    const d = new Date();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `serial-${d.getFullYear()}${two(d.getMonth() + 1)}${two(d.getDate())}-${two(d.getHours())}${two(d.getMinutes())}${two(d.getSeconds())}.txt`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  /* ---------- Serial port ---------- */

  function portName(port) {
    const info = port.getInfo ? port.getInfo() : {};
    if (info.usbVendorId === undefined) return "Serial port";
    const id = `${info.usbVendorId.toString(16).padStart(4, "0")}:${info.usbProductId.toString(16).padStart(4, "0")}`;
    return `${CHIPS[id] || "USB serial"} (${id.toUpperCase()})`;
  }

  async function openPort() {
    const baud = baudRate();
    if (!baud) throw new Error("Enter a baud rate between 50 and 4000000.");
    await state.port.open({
      baudRate: baud,
      dataBits: Number($("data-bits").value),
      stopBits: Number($("stop-bits").value),
      parity: $("parity").value,
      flowControl: $("flow").value,
      bufferSize: 1 << 16,
    });
    state.open = true;
    await setSignals();
    state.keepReading = true;
    state.readLoop = readLoop();
  }

  async function readLoop() {
    const port = state.port;
    while (state.keepReading && port.readable) {
      const reader = port.readable.getReader();
      state.reader = reader;
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value && value.length) { state.rx += value.length; record("rx", value); }
        }
      } catch (err) {
        // framing, parity, break and overrun errors are not fatal: the port reads on
        if (state.keepReading) message(`${err.name || "Error"}: ${err.message}`, true);
        if (err.name === "NetworkError") break;
      } finally {
        reader.releaseLock();
        state.reader = null;
      }
    }
    if (state.keepReading) lost();
  }

  async function closePort() {
    state.keepReading = false;
    if (state.reader) { try { await state.reader.cancel(); } catch (e) { /* closed */ } }
    if (state.readLoop) { try { await state.readLoop; } catch (e) { /* ignored */ } }
    state.readLoop = null;
    if (state.open) { try { await state.port.close(); } catch (e) { /* lost */ } }
    state.open = false;
  }

  async function lost() {
    await closePort();
    message("Connection lost (device unplugged?).", true);
    setStatus("lost");
  }

  async function setSignals() {
    if (!state.open) return;
    try {
      await state.port.setSignals({ dataTerminalReady: $("sig-dtr").checked, requestToSend: $("sig-rts").checked });
    } catch (err) {
      message(`Control lines: ${err.message}`, true);
    }
  }

  async function connect() {
    if (state.busy) return;
    if (state.open) { await run(async () => { await closePort(); message("Disconnected."); setStatus("idle"); }); return; }
    let port;
    try {
      port = await navigator.serial.requestPort();
    } catch (err) {
      if (err.name !== "NotFoundError") message(err.message, true);
      return;
    }
    state.port = port;
    await run(async () => {
      try {
        await openPort();
        message(`Connected: ${portName(port)}, ${formatText()}.`);
        setStatus("open");
        $("send-input").focus();
      } catch (err) {
        state.open = false;
        message(`Could not open the port: ${err.message}` + (err.name === "InvalidStateError" ? "" : " Is it used by another program?"), true);
        setStatus("idle");
      }
    });
  }

  // Settings changed while connected: open the port again
  async function reopen() {
    saveSettings();
    if (!state.open || state.busy) { setStatus(state.open ? "open" : "idle"); return; }
    if (!baudRate()) { setStatus("open"); return; }
    await run(async () => {
      await closePort();
      try {
        await openPort();
        message(`Settings changed: ${formatText()}.`);
        setStatus("open");
      } catch (err) {
        message(`Could not reopen the port: ${err.message}`, true);
        setStatus("idle");
      }
    });
  }

  async function run(fn) {
    state.busy = true;
    setStatus("busy");
    try { await fn(); } finally { state.busy = false; update(); }
  }

  async function resetPulse() {
    if (!state.open) return;
    await run(async () => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      try {
        // ESP32-style auto reset (RTS = EN) and Arduino-style (DTR via capacitor)
        await state.port.setSignals({ dataTerminalReady: false, requestToSend: true });
        await wait(100);
        await state.port.setSignals({ dataTerminalReady: false, requestToSend: false });
        await wait(50);
        await setSignals();
        message("Reset pulse sent (DTR/RTS).");
      } catch (err) {
        message(`Reset pulse: ${err.message}`, true);
      }
    });
  }

  /* ---------- Sending ---------- */

  function parseHex(s) {
    const clean = s.replace(/0x/gi, "").replace(/[\s,;:-]+/g, " ").trim();
    if (!clean) return new Uint8Array(0);
    const parts = clean.split(" ");
    const out = [];
    for (const p of parts) {
      if (!/^[0-9a-f]+$/i.test(p)) return null;
      if (p.length <= 2) out.push(parseInt(p, 16));
      else if (p.length % 2 === 0) for (let i = 0; i < p.length; i += 2) out.push(parseInt(p.slice(i, i + 2), 16));
      else return null;
    }
    return new Uint8Array(out);
  }

  function sendData() {
    const input = $("send-input");
    const s = input.value;
    let data;
    if ($("send-hex").checked) {
      data = parseHex(s);
      if (!data) { showSendError("Hex bytes like 01 A0 FF or 01A0FF."); return null; }
    } else {
      const eol = { "": "", "\\n": "\n", "\\r": "\r", "\\r\\n": "\r\n" }[$("send-eol").value];
      data = new TextEncoder().encode(s + eol);
    }
    return data;
  }

  function showSendError(text) {
    $("send-error").textContent = text;
    $("send-error").hidden = !text;
    $("send-input").classList.toggle("invalid", !!text);
  }

  async function send(ev) {
    ev.preventDefault();
    if (!state.open || state.busy) return;
    const s = $("send-input").value;
    const data = sendData();
    if (!data) return;
    showSendError("");
    if (data.length) {
      const writer = state.port.writable.getWriter();
      record("tx", data);                         // shown before the answer of the device
      try {
        await writer.write(data);
        state.tx += data.length;
      } catch (err) {
        message(`Send: ${err.message}`, true);
        return;
      } finally {
        writer.releaseLock();
      }
    }
    if (s && state.sent[state.sent.length - 1] !== s) {
      state.sent.push(s);
      if (state.sent.length > SEND_HISTORY) state.sent.shift();
      saveSettings();
    }
    state.sentPos = -1;
    $("send-input").value = "";
  }

  function historyKey(ev) {
    if (ev.key !== "ArrowUp" && ev.key !== "ArrowDown") return;
    if (!state.sent.length) return;
    ev.preventDefault();
    const n = state.sent.length;
    if (ev.key === "ArrowUp") state.sentPos = state.sentPos < 0 ? n - 1 : Math.max(0, state.sentPos - 1);
    else state.sentPos = state.sentPos < 0 ? -1 : state.sentPos + 1;
    if (state.sentPos >= n) state.sentPos = -1;
    const input = $("send-input");
    input.value = state.sentPos < 0 ? "" : state.sent[state.sentPos];
    input.setSelectionRange(input.value.length, input.value.length);
  }

  /* ---------- Status ---------- */

  let status = "idle";
  function setStatus(s) { status = s; update(); }

  function update() {
    const open = state.open;
    const conn = $("conn");
    conn.className = "conn" + (state.busy ? " busy" : open ? " connected" : "");
    const note = $("link-note");
    note.className = "link-note";
    if (state.busy) {
      $("conn-text").textContent = open ? "Working …" : "Connecting …";
    } else if (open) {
      $("conn-text").textContent = `Connected, ${formatText()}`;
      note.textContent = portName(state.port);
    } else {
      $("conn-text").textContent = "Not connected";
      if (status === "lost") { note.className = "link-note warn"; note.textContent = "The connection was lost. Plug the converter in again and connect."; }
      else note.textContent = "Choose the settings, then connect and select the serial port.";
    }
    $("btn-connect").textContent = open ? "Disconnect" : "Connect";
    $("btn-connect").disabled = state.busy || !navigator.serial;
    $("baud").classList.toggle("invalid", !baudRate());
    for (const id of ["send-input", "send-eol", "send-hex", "btn-send", "sig-dtr", "sig-rts", "btn-reset"]) $(id).disabled = !open || state.busy;
    $("send-eol").disabled = !open || state.busy || $("send-hex").checked;
    $("send-input").placeholder = $("send-hex").checked ? "Hex bytes to send, e.g. 01 A0 FF" : "Text to send, Enter sends, ↑/↓ for history";
  }

  /* ---------- Events ---------- */

  function init() {
    loadSettings();
    view_.reset();
    if (!navigator.serial) $("unsupported").hidden = false;

    $("btn-connect").addEventListener("click", connect);
    $("send-form").addEventListener("submit", send);
    $("send-input").addEventListener("keydown", historyKey);
    $("send-input").addEventListener("input", () => showSendError(""));
    $("send-hex").addEventListener("change", () => { showSendError(""); update(); });
    $("send-eol").addEventListener("change", saveSettings);
    $("btn-clear").addEventListener("click", clearTerminal);
    $("btn-save").addEventListener("click", saveTerminal);
    $("btn-reset").addEventListener("click", resetPulse);
    $("sig-dtr").addEventListener("change", setSignals);
    $("sig-rts").addEventListener("change", setSignals);
    $("baud").addEventListener("input", update);
    for (const id of ["baud", "data-bits", "parity", "stop-bits", "flow"]) $(id).addEventListener("change", reopen);
    for (const el of document.querySelectorAll('input[name="view"]')) el.addEventListener("change", () => { saveSettings(); redraw(); });
    $("opt-time").addEventListener("change", () => { saveSettings(); redraw(); });
    $("opt-echo").addEventListener("change", () => { saveSettings(); redraw(); });

    term.addEventListener("scroll", () => { if (atBottom()) $("btn-end").hidden = true; });
    $("btn-end").addEventListener("click", () => { term.scrollTop = term.scrollHeight; $("btn-end").hidden = true; });
    document.addEventListener("keydown", (ev) => {
      if (ev.ctrlKey && !ev.altKey && !ev.shiftKey && (ev.key === "l" || ev.key === "L")) { ev.preventDefault(); clearTerminal(); }
    });

    if (navigator.serial) {
      navigator.serial.addEventListener("disconnect", (ev) => {
        if (state.port && ev.target === state.port && state.open) lost();
      });
    }
    window.addEventListener("beforeunload", () => { if (state.open) closePort(); });
    update();
  }

  init();
})();
