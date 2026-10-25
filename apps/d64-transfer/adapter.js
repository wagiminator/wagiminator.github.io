/* ===================================================================
 * IEC adapter library for DiskBuddy64, DiskMaster64 and DumpMaster64
 * -------------------------------------------------------------------
 * JavaScript port of software/pc/libs/adapter.py from
 * github.com/wagiminator/C64-Collection, talking to the adapter with
 * the Web Serial API. The adapters share one command set; they differ
 * in how fast blocks are transferred:
 *   DiskBuddy64:  no status byte before a block that is read; blocks
 *                 that are written are requested in chunks.
 *   DiskMaster64, DumpMaster64: a status byte before every block.
 * =================================================================== */
(function (global) {
  "use strict";

  /* ---------- USB ids and adapter names ---------- */

  const USB_FILTERS = [
    { usbVendorId: 0x1a86, usbProductId: 0x7523 },   // CH340: DiskBuddy64, DumpMaster64
    { usbVendorId: 0x16c0, usbProductId: 0x27dd },   // CDC:   DiskMaster64
  ];
  const ADAPTERS = ["DiskBuddy64", "DiskMaster64", "DumpMaster64"];
  const BAUD = 460800;

  /* ---------- Commands ---------- */

  const CMD = {
    GETIDENT: 0x69, GETVERSION: 0x76, READTRACK: 0x72, WRITETRACK: 0x77,
    FORMATDISK: 0x66, READMEM: 0x6d, IEC_CMD: 0x63, GETSTATUS: 0x74,
    WRITEFAST: 0x0c, RESET: 0x0f, SETDEVICE: 0x12,
  };
  const ADDR = {
    FASTUPLOAD: 0x0400,          // load and start address of the fast uploader
    LOAD: 0x0500,                // load address of fastread/fastwrite/fastformat
    START: 0x0503,               // their start address
    SETTRACK18: 0xd00e,          // drive ROM: move head back to track 18
  };

  // Drive identification by ROM bytes (adapted from OpenCBM)
  const DEVICES = {
    0xfeb6: "CBM 2031", 0xaaaa: "CBM 1540 or 1541", 0xf00f: "CBM 1541-II",
    0xcd18: "CBM 1541C", 0x10ca: "DolphinDOS 1541", 0x6f10: "SpeedDOS 1541",
    0x2710: "ProfDOS 1541", 0x8085: "JiffyDOS 1541", 0xaeea: "64'er DOS 1541",
    0x180d: "Turbo 1541", 0x094c: "PrologicDOS 1541", 0xfed7: "CBM 1570",
    0x02ac: "CBM 1571", 0x01ba: "CBM 1581", 0x32f0: "CBM 3040",
    0xc320: "CBM 4040", 0x20f8: "CBM 4040", 0xf2e9: "CBM 8050",
    0xc866: "CBM 8250", 0xc611: "CBM 8250",
  };
  const SUPPORTED = new Set([0xaaaa, 0xf00f, 0xcd18, 0x10ca, 0x6f10, 0x2710, 0x8085, 0xaeea, 0x180d, 0x094c]);

  /* ---------- Serial link with timeouts ---------- */

  // Buffers everything the port sends and offers pySerial-like reads:
  // read(n) waits up to `timeout` ms and may return fewer bytes.
  class SerialLink {
    constructor(port) {
      this.port = port;
      this.chunks = [];
      this.length = 0;
      this.waiter = null;
      this.closed = false;
    }

    async open() {
      await this.port.open({ baudRate: BAUD, bufferSize: 1 << 20 });
      try { await this.port.setSignals({ dataTerminalReady: true, requestToSend: true }); } catch (e) { /* not supported by every port */ }
      this.writer = this.port.writable.getWriter();
      this.reader = this.port.readable.getReader();
      this.loop = this.readLoop();
    }

    async readLoop() {
      try {
        for (;;) {
          const { value, done } = await this.reader.read();
          if (done) break;
          if (value && value.length) { this.chunks.push(value); this.length += value.length; this.wake(); }
        }
      } catch (err) {
        this.error = err;
      }
      this.closed = true;
      this.wake();
    }

    wake() { if (this.waiter) { const w = this.waiter; this.waiter = null; w(); } }

    // Wait until `n` bytes are buffered, the port closes or the deadline passes
    async waitFor(n, deadline) {
      while (this.length < n && !this.closed) {
        const left = deadline - performance.now();
        if (left <= 0) return;
        await new Promise((resolve) => {
          const t = setTimeout(resolve, left);
          this.waiter = () => { clearTimeout(t); resolve(); };
        });
      }
    }

    take(n) {
      n = Math.min(n, this.length);
      const out = new Uint8Array(n);
      let pos = 0;
      while (pos < n) {
        const c = this.chunks[0];
        const k = Math.min(c.length, n - pos);
        out.set(c.subarray(0, k), pos);
        pos += k;
        if (k === c.length) this.chunks.shift(); else this.chunks[0] = c.subarray(k);
      }
      this.length -= n;
      return out;
    }

    async read(n, timeout) {
      await this.waitFor(n, performance.now() + timeout);
      return this.take(n);
    }

    // Read up to and including "\n"; returns the line without line endings or null
    async readLine(timeout) {
      const deadline = performance.now() + timeout;
      const bytes = [];
      for (;;) {
        await this.waitFor(1, deadline);
        if (!this.length) return null;
        const b = this.take(1)[0];
        if (b === 0x0a) break;
        bytes.push(b);
      }
      return String.fromCharCode(...bytes).replace(/\r+$/, "");
    }

    async write(bytes) {
      if (this.closed) throw new Error("The adapter was disconnected.");
      await this.writer.write(bytes);
    }

    flushInput() { this.chunks = []; this.length = 0; }

    async close() {
      try { await this.reader.cancel(); } catch (e) { /* already closed */ }
      try { this.reader.releaseLock(); } catch (e) { /* ignore */ }
      try { await this.writer.close(); } catch (e) { /* ignore */ }
      try { this.writer.releaseLock(); } catch (e) { /* ignore */ }
      try { await this.port.close(); } catch (e) { /* ignore */ }
      this.closed = true;
    }
  }

  /* ---------- GCR encoding (as used by the 1541) ---------- */

  const GCR = [0x0a, 0x0b, 0x12, 0x13, 0x0e, 0x0f, 0x16, 0x17, 0x09, 0x19, 0x1a, 0x1b, 0x0d, 0x1d, 0x1e, 0x15];
  const GCR_DEC = [0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 1, 0, 12, 4, 5, 0, 0, 2, 3, 0, 15, 6, 7, 0, 9, 10, 11, 0, 13, 14, 0];

  // 256 data bytes -> 325 GCR bytes (block id 0x07, data, checksum, 2 zero bytes)
  function encodeBlock(data) {
    const raw = new Uint8Array(260);
    raw[0] = 0x07;
    raw.set(data, 1);
    let parity = 0;
    for (const b of data) parity ^= b;
    raw[257] = parity;
    const out = new Uint8Array(325);
    for (let q = 0; q < 65; q++) {
      const bits = [];
      for (let i = 0; i < 4; i++) {
        const b = raw[q * 4 + i];
        bits.push(GCR[b >> 4], GCR[b & 15]);
      }
      // pack eight 5-bit groups into 5 bytes
      let acc = 0n;
      for (const g of bits) acc = (acc << 5n) | BigInt(g);
      for (let i = 0; i < 5; i++) out[q * 5 + i] = Number((acc >> BigInt(8 * (4 - i))) & 0xffn);
    }
    return out;
  }

  // 325 GCR bytes -> 256 data bytes, or null if the checksum is wrong
  function decodeBlock(gcr) {
    const raw = new Uint8Array(260);
    for (let q = 0; q < 65; q++) {
      let acc = 0n;
      for (let i = 0; i < 5; i++) acc = (acc << 8n) | BigInt(gcr[q * 5 + i]);
      for (let i = 0; i < 4; i++) {
        const v = Number((acc >> BigInt(10 * (3 - i))) & 0x3ffn);
        raw[q * 4 + i] = (GCR_DEC[v >> 5] << 4) | GCR_DEC[v & 31];
      }
    }
    let parity = raw[257];
    const data = raw.slice(1, 257);
    for (const b of data) parity ^= b;
    return parity === 0 ? data : null;
  }

  /* ---------- Adapter ---------- */

  const ascii = (s) => Array.from(s, (c) => c.charCodeAt(0));

  class AdapterError extends Error {}

  class Adapter {
    constructor(link, kind) {
      this.link = link;
      this.kind = kind;
      this.timeout = 1000;
    }

    get chunked() { return this.kind === "DiskBuddy64"; }
    get code() { return global.DRIVE_CODE[this.kind]; }

    // Command byte, argument length, arguments
    async send(cmd, args) {
      const a = args ? Array.from(args) : [];
      await this.link.write(new Uint8Array([cmd, a.length, ...a]));
    }

    async readByte(timeout) {
      const r = await this.link.read(1, timeout || this.timeout);
      return r.length ? r[0] : -1;
    }

    // Send an IEC command; true if the adapter reports success
    async iec(cmd, args) {
      await this.send(cmd, args);
      return (await this.readByte()) === 0;
    }

    async ident() {
      this.link.flushInput();
      await this.send(CMD.GETIDENT);
      return this.link.readLine(this.timeout);
    }

    async version() {
      await this.send(CMD.GETVERSION);
      return this.link.readLine(this.timeout);
    }

    /* --- drive --- */

    async setDevice(dev) { return this.iec(CMD.SETDEVICE, [dev]); }

    async status() {
      await this.send(CMD.GETSTATUS);
      return this.link.readLine(this.timeout);
    }

    // Status string of the drive, or null if there is no drive
    async checkDevice(dev) {
      if (!(await this.setDevice(dev))) return null;
      const s = await this.status();
      return s || null;
    }

    // "Magic number" from the drive ROM that identifies the model
    async detectDevice(dev) {
      if (!(await this.setDevice(dev))) return null;
      const m = await this.readMemory(0xff40, 2);
      if (!m || m.length !== 2) return null;
      let magic = m[0] | (m[1] << 8);
      if (magic === 0xaaaa) {
        const t = await this.readMemory(0xfffe, 2);
        const v = t && t.length === 2 ? t[0] | (t[1] << 8) : 0xfe67;
        if (v !== 0xfe67) magic = v;
      }
      return magic;
    }

    async readMemory(addr, size) {
      const out = [];
      while (size > 0) {
        const len = Math.min(256, size);
        if (!(await this.iec(CMD.READMEM, [...ascii("M-R"), addr & 0xff, addr >> 8, len & 0xff]))) return null;
        const data = await this.link.read(len, this.timeout);
        await this.link.read(1, this.timeout);        // trailing byte from the drive
        out.push(...data);
        addr += len; size -= len;
      }
      return new Uint8Array(out);
    }

    async writeMemory(addr, data) {
      for (let p = 0; p < data.length; p += 32) {
        const chunk = data.subarray(p, p + 32);
        if (!(await this.iec(CMD.IEC_CMD, [...ascii("M-W"), (addr + p) & 0xff, (addr + p) >> 8, chunk.length, ...chunk]))) return false;
      }
      return true;
    }

    async execute(addr) {
      return this.iec(CMD.IEC_CMD, [...ascii("M-E"), addr & 0xff, addr >> 8]);
    }

    /* --- fast transfers --- */

    // Send a block to the drive via fast IEC
    async sendBlock(data) {
      if (this.chunked) {
        // DiskBuddy64 asks for the next n bytes until the block is done
        let pos = 0;
        while (pos < data.length) {
          const n = await this.readByte();
          if (n <= 0) return false;
          await this.link.write(data.subarray(pos, pos + n));
          pos += n;
        }
        return true;
      }
      if ((await this.readByte()) !== 0) return false;
      await this.link.write(data);
      return true;
    }

    // Receive a GCR block: Uint8Array(256), "error" (checksum) or null (no answer)
    async getBlock(timeout) {
      if (!this.chunked && (await this.readByte(timeout)) !== 0) return null;
      const gcr = await this.link.read(325, timeout);
      if (gcr.length !== 325) return null;
      return decodeBlock(gcr) || "error";
    }

    // Upload drive code: a small fast uploader the slow way, then the rest fast
    async upload(name) {
      const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
      if (!(await this.writeMemory(ADDR.FASTUPLOAD, b64(this.code.fastupload)))) return false;
      const data = b64(this.code[name]);
      for (let p = 0; p < data.length; p += 256) {
        const chunk = data.subarray(p, p + 256);
        const addr = ADDR.LOAD + p;
        if (!(await this.iec(CMD.IEC_CMD, [...ascii("M-E"), ADDR.FASTUPLOAD & 0xff, ADDR.FASTUPLOAD >> 8, addr & 0xff, addr >> 8, chunk.length & 0xff]))) return false;
        if (this.chunked) {
          await this.send(CMD.WRITEFAST, [chunk.length & 0xff]);
          if (!(await this.sendBlock(chunk))) return false;
        } else {
          if (!(await this.iec(CMD.WRITEFAST, [chunk.length & 0xff]))) return false;
          await this.link.write(chunk);
        }
        if ((await this.readByte()) !== 0) return false;
      }
      return true;
    }

    async startRead(track, sectors) {
      return this.iec(CMD.READTRACK, [...ascii("M-E"), ADDR.START & 0xff, ADDR.START >> 8, track, sectors.length, ...sectors]);
    }

    async startWrite(track, sectors) {
      return this.iec(CMD.WRITETRACK, [...ascii("M-E"), ADDR.START & 0xff, ADDR.START >> 8, track, sectors.length, ...sectors]);
    }

    // name and id are PETSCII byte arrays
    async startFormat(tracks, bump, clear, verify, name, id) {
      return this.iec(CMD.FORMATDISK, [...ascii("M-E"), ADDR.START & 0xff, ADDR.START >> 8,
        tracks, bump ? 1 : 0, clear ? 1 : 0, verify ? 1 : 0, 0x3a, ...name, 0x2c, ...id]);
    }

    // Read one sector (fastread must be uploaded); up to 3 tries
    async readBlock(track, sector) {
      for (let i = 0; i < 3; i++) {
        if (!(await this.startRead(track, [sector]))) return null;
        const b = await this.getBlock(4000);
        if (b === null) return null;
        if (b !== "error") return b;
      }
      return null;
    }

    async headToTrack18() { return this.execute(ADDR.SETTRACK18); }
  }

  /* ---------- Connecting ---------- */

  // Open a port and find out which adapter is attached. `preferred`
  // ("auto" or an adapter name) is used if the adapter does not answer
  // with a known name. Returns {adapter, ident, version}.
  async function connect(port, preferred) {
    const link = new SerialLink(port);
    await link.open();
    const probe = new Adapter(link, "DumpMaster64");
    let ident = null;
    for (let i = 0; i < 3 && !ADAPTERS.includes(ident); i++) {
      if (i) await new Promise((r) => setTimeout(r, 400));   // adapter may still be starting
      ident = await probe.ident();
    }
    let kind = ADAPTERS.includes(ident) ? ident : null;
    if (!kind && preferred && preferred !== "auto") kind = preferred;
    if (!kind) {
      await link.close();
      throw new AdapterError(ident ? `The device answered “${ident}”, which is not a supported adapter.` : "The device did not answer. Is it a DiskBuddy64, DiskMaster64 or DumpMaster64?");
    }
    const adapter = new Adapter(link, kind);
    const version = await adapter.version();
    return { adapter, ident, version };
  }

  /* ---------- Disk layout ---------- */

  function sectorsPerTrack(t) { return t <= 17 ? 21 : t <= 24 ? 19 : t <= 30 ? 18 : 17; }
  function offsetOf(t, s) {
    let n = 0;
    for (let k = 1; k < t; k++) n += sectorsPerTrack(k);
    return (n + s) * 256;
  }

  // Order in which to read/write the sectors of a track: interleave 4,
  // starting point shifted by 6 per track (like the Python frontend)
  function sectorOrder(track, wanted, interleave, trackGap) {
    const n = sectorsPerTrack(track);
    const left = new Set(wanted);
    const order = [];
    let s = (trackGap || 6) * (track - 1);
    while (left.size) {
      s %= n;
      while (!left.has(s)) { s++; if (s >= n) s = 0; }
      order.push(s);
      left.delete(s);
      s += interleave || 4;
    }
    return order;
  }

  global.IEC = {
    USB_FILTERS, ADAPTERS, DEVICES, SUPPORTED, ADDR,
    SerialLink, Adapter, AdapterError, connect,
    encodeBlock, decodeBlock, sectorsPerTrack, offsetOf, sectorOrder,
  };
})(typeof window !== "undefined" ? window : globalThis);
