/* SWD Programmer: probes, target control and flash drivers.
 * A port of tinyOCD (https://github.com/wagiminator/MCU-Flash-Tools, MIT License)
 * for WebUSB (CMSIS-DAP v2, ST-Link, J-Link) and WebHID (CMSIS-DAP v1).
 * Everything is async; the order of the USB transfers is the same as in tinyocd.py. */
(function (global) {
  "use strict";

  /* ================================================================================
   * Errors and helpers
   * ================================================================================ */

  class ProbeError extends Error { constructor(m) { super(m); this.name = "ProbeError"; } }
  class TransferFault extends Error { constructor(m) { super(m); this.name = "TransferFault"; } }
  class UsbError extends Error { constructor(m, timeout) { super(m); this.name = "UsbError"; this.timeout = !!timeout; } }
  const isLink = (e) => e instanceof ProbeError || e instanceof TransferFault;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const now = () => Date.now() / 1000;
  const h8 = (v) => "0x" + (v >>> 0).toString(16).padStart(8, "0");
  const h2 = (v) => "0x" + (v & 0xff).toString(16).padStart(2, "0");
  const u16 = (b, o) => b[o] | (b[o + 1] << 8);
  const u32 = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
  const p16 = (v) => [v & 0xff, (v >>> 8) & 0xff];
  const p32 = (v) => [v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff];
  const popcount = (v) => { v >>>= 0; let n = 0; while (v) { n += v & 1; v >>>= 1; } return n; };

  function bytes(...parts) {
    let n = 0;
    for (const p of parts) n += p.length;
    const out = new Uint8Array(n);
    let o = 0;
    for (const p of parts) { out.set(p, o); o += p.length; }
    return out;
  }
  function words(data, off, n) {
    const w = new Array(n);
    for (let i = 0; i < n; i++) w[i] = u32(data, off + 4 * i);
    return w;
  }
  function packWords(ws) {
    const out = new Uint8Array(4 * ws.length);
    for (let i = 0; i < ws.length; i++) out.set(p32(ws[i]), 4 * i);
    return out;
  }
  const allFF = (d, s, e) => { for (let i = s; i < e && i < d.length; i++) if (d[i] !== 0xff) return false; return true; };

  // USB timeouts in ms (generous: a long ST-Link or J-Link transfer on a slow hub must not abort)
  const TIMEOUTS = { write: 5000, read: 5000 };

  function withTimeout(promise, ms, msg) {
    let timer;
    return Promise.race([
      promise.finally(() => clearTimeout(timer)),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new UsbError(msg, true)), ms); }),
    ]);
  }

  /* ================================================================================
   * WebUSB device wrapper (a read that timed out stays pending and is reused)
   * ================================================================================ */

  class UsbDev {
    constructor(device) {
      this.dev = device;
      this.pending = {};
      this.claimed = [];
    }
    get vendorId() { return this.dev.vendorId; }
    get productId() { return this.dev.productId; }
    get productName() { return this.dev.productName || ""; }
    async open() {
      const d = this.dev;
      try {
        if (!d.opened) await d.open();
        if (!d.configuration) await d.selectConfiguration(1);
      } catch (err) {
        throw new ProbeError(`The programmer could not be opened (${err.message}). Close other programs that use it and try again.`);
      }
    }
    interfaces() {
      return this.dev.configuration.interfaces.map((itf) => {
        const alt = itf.alternate || itf.alternates[0];
        return { num: itf.interfaceNumber, cls: alt.interfaceClass, name: alt.interfaceName || "", eps: alt.endpoints };
      });
    }
    async claim(num) {
      try {
        await this.dev.claimInterface(num);
      } catch (err) {
        throw new ProbeError("The programmer's USB interface could not be claimed. It is in use by another program, or it needs a WinUSB driver (Windows).");
      }
      this.claimed.push(num);
    }
    async write(ep, data, timeout) {
      const r = await withTimeout(this.dev.transferOut(ep, data), timeout || TIMEOUTS.write, "USB write timed out");
      if (r.status !== "ok") throw new UsbError(`USB write failed (${r.status})`);
    }
    async read(ep, size, timeout) {
      if (!this.pending[ep]) this.pending[ep] = this.dev.transferIn(ep, size);
      const r = await withTimeout(this.pending[ep], timeout || TIMEOUTS.read, "USB read timed out");
      this.pending[ep] = null;
      if (r.status !== "ok") throw new UsbError(`USB read failed (${r.status})`);
      return new Uint8Array(r.data.buffer, r.data.byteOffset, r.data.byteLength).slice();
    }
    // read and drop stale responses
    async flush(ep, size) {
      for (let i = 0; i < 100; i++) {
        try { await this.read(ep, size, 10); } catch (e) { return; }
      }
    }
    async close() {
      for (const n of this.claimed) { try { await this.dev.releaseInterface(n); } catch (e) { /* ignore */ } }
      this.claimed = [];
      try { await this.dev.close(); } catch (e) { /* ignore */ }
      this.pending = {};
    }
  }

  /* ================================================================================
   * Probe base class
   * ================================================================================ */

  class Probe {
    constructor() { this.name = "probe"; this.voltage = null; this.kind = ""; }
    async read32(addr) { return u32(await this.readMem(addr, 4), 0); }
    async write32(addr, value) { await this.writeMem(addr, new Uint8Array(p32(value))); }
  }

  // Split transfers at 1 KB boundaries (TAR auto-increment limit)
  function chunks(addr, size, maxsize) {
    const out = [];
    while (size) {
      const n = Math.min(size, maxsize, 0x400 - (addr & 0x3ff));
      out.push([addr, n]);
      addr += n;
      size -= n;
    }
    return out;
  }

  /* ================================================================================
   * Raw SWD probe (ADIv5 DP/MEM-AP access on top of DAP transfers)
   * ================================================================================ */

  const DP_DPIDR = 0x00, DP_ABORT = 0x00, DP_CTRLSTAT = 0x04, DP_SELECT = 0x08, DP_RDBUFF = 0x0C;
  const AP_CSW = 0x00, AP_TAR = 0x04, AP_DRW = 0x0C;
  const ABORT_CLEAR = 0x1E;
  const CSW_DEFAULT = 0x23000000, CSW_INC = 0x10, CSW_SIZE = { 1: 0, 2: 1, 4: 2 };

  class RawSWDProbe extends Probe {
    constructor() {
      super();
      this._select = null;
      this._csw = null;
      this.ap = 0;
      this.ORUNDETECT = 0;
    }

    async _writeBlock(ap, reg, ws) { await this._transfer(ws.map((w) => [ap, 0, reg, w])); }
    async _readBlock(ap, reg, count) { return this._transfer(new Array(count).fill([ap, 1, reg, 0])); }

    async _swdSwitch() {
      const ff = new Array(7).fill(0xff);
      await this._swj(56, ff);                  // line reset
      await this._swj(16, [0x9e, 0xe7]);        // JTAG to SWD
      await this._swj(56, ff);                  // line reset
      await this._swj(16, [0x00, 0x00]);        // idle cycles
    }

    async dpConnect() {
      this._select = null;
      this._csw = null;
      let dpidr = null;
      for (let i = 0; i < 3; i++) {
        try {
          await this._swdSwitch();
          dpidr = (await this._transfer([[0, 1, DP_DPIDR, 0]]))[0];
          break;
        } catch (e) {
          if (!isLink(e)) throw e;
          await sleep(10);
        }
      }
      if (dpidr === null || dpidr === 0 || dpidr === 0xffffffff) throw new ProbeError("No target found (check the SWD connection and the target power)");
      await this._transfer([[0, 0, DP_ABORT, ABORT_CLEAR]]);
      await this._transfer([[0, 0, DP_CTRLSTAT, (0x50000000 | this.ORUNDETECT) >>> 0]]);
      for (let i = 0; ; i++) {
        if (i >= 100) throw new ProbeError("Target debug power-up failed");
        if (((await this._transfer([[0, 1, DP_CTRLSTAT, 0]]))[0] & 0xA0000000) >>> 0 === 0xA0000000) break;
        await sleep(1);
      }
      return dpidr;
    }

    async clearErrors() {
      try { await this._transfer([[0, 0, DP_ABORT, ABORT_CLEAR]]); } catch (e) { /* ignore */ }
      this._select = null;
      this._csw = null;
    }

    _selOps(reg) {
      const sel = ((this.ap << 24) | (reg & 0xF0)) >>> 0;
      if (sel !== this._select) { this._select = sel; return [[0, 0, DP_SELECT, sel]]; }
      return [];
    }

    async readDp(reg) { return (await this._transfer([[0, 1, reg, 0]]))[0]; }

    async readAp(ap, reg) {
      const old = this.ap;
      this.ap = ap;
      try {
        const ops = this._selOps(reg).concat([[1, 1, reg & 0x0C, 0]]);
        const r = await this._transfer(ops);
        return r[r.length - 1];
      } finally {
        this.ap = old;
      }
    }

    _cswOps(size, inc = true) {
      const csw = (CSW_DEFAULT | CSW_SIZE[size] | (inc ? CSW_INC : 0)) >>> 0;
      const ops = this._selOps(AP_CSW);
      if (csw !== this._csw) { this._csw = csw; ops.push([1, 0, AP_CSW, csw]); }
      return ops;
    }

    async _safe(fn) {
      try {
        return await fn();
      } catch (e) {
        if (e instanceof TransferFault) await this.clearErrors();
        throw e;
      }
    }

    readMem(addr, size) { return this._safe(() => this._readMem(addr, size)); }
    async _readMem(addr, size) {
      const out = new Uint8Array(size);
      let pos = 0;
      for (const [a, n] of chunks(addr, size, 0x400)) {
        await this._transfer(this._cswOps(4).concat([[1, 0, AP_TAR, a >>> 0]]));
        const ws = await this._readBlock(1, AP_DRW, n >> 2);
        out.set(packWords(ws), pos);
        pos += n;
      }
      return out;
    }

    writeMem(addr, data) { return this._safe(() => this._writeMem(addr, data)); }
    async _writeMem(addr, data) {
      if (data.length === 4) {                  // single word: one transfer incl. error check
        const ops = this._cswOps(4).concat([[1, 0, AP_TAR, addr >>> 0], [1, 0, AP_DRW, u32(data, 0)], [0, 1, DP_CTRLSTAT, 0]]);
        const r = await this._transfer(ops);
        this._checkSticky(r[r.length - 1]);
        return;
      }
      let pos = 0;
      for (const [a, n] of chunks(addr, data.length, 0x400)) {
        const ws = words(data, pos, n >> 2);
        await this._transfer(this._cswOps(4).concat([[1, 0, AP_TAR, a >>> 0]]));
        await this._writeBlock(1, AP_DRW, ws);
        pos += n;
      }
      this._checkSticky(await this.readDp(DP_CTRLSTAT));
    }

    // Write errors may be reported delayed (STICKYERR in CTRL/STAT)
    _checkSticky(ctrlstat) { if (ctrlstat & 0x22) throw new TransferFault("memory write fault"); }

    async _readSized(addr, size) {
      const ops = this._cswOps(size, false).concat([[1, 0, AP_TAR, addr >>> 0], [1, 1, AP_DRW, 0]]);
      const r = await this._transfer(ops);
      return (r[r.length - 1] >>> (8 * (addr & 3))) & ((1 << (8 * size)) - 1);
    }
    async _writeSized(addr, size, value) {
      const ops = this._cswOps(size, false).concat([[1, 0, AP_TAR, addr >>> 0], [1, 0, AP_DRW, (value << (8 * (addr & 3))) >>> 0], [0, 1, DP_CTRLSTAT, 0]]);
      const r = await this._transfer(ops);
      this._checkSticky(r[r.length - 1]);
    }
    read16(addr) { return this._safe(() => this._readSized(addr, 2)); }
    write16(addr, v) { return this._safe(() => this._writeSized(addr, 2, v & 0xffff)); }
    read8(addr) { return this._safe(() => this._readSized(addr, 1)); }
    write8(addr, v) { return this._safe(() => this._writeSized(addr, 1, v & 0xff)); }

    reconnect() { return this.dpConnect(); }
  }

  /* ================================================================================
   * CMSIS-DAP probe (v2 bulk via WebUSB, v1 HID via WebHID)
   * ================================================================================ */

  class CMSISDAP extends RawSWDProbe {
    constructor(transport, name) {
      super();
      this.t = transport;
      this.packetSize = 64;
      this.name = name;
      this.kind = "cmsis-dap";
    }

    static async create(transport, name) {
      const p = new CMSISDAP(transport, name);
      try {
        const r = await p._info(0xFF);
        if (r.length < 2) throw new Error("short");
        p.packetSize = Math.max(64, u16(r, 0));
      } catch (e) {
        p.packetSize = 64;
      }
      p.t.packetSize = p.packetSize;
      try {
        p.fw = String.fromCharCode(...(await p._info(0x04))).replace(/[^\x00-\x7f]/g, "").replace(/^\0+|\0+$/g, "");
      } catch (e) {
        p.fw = "";
      }
      if (p.fw) p.name += ` (firmware ${p.fw})`;
      return p;
    }

    async _cmd(data) {
      const resp = await this.t.xfer(Uint8Array.from(data));
      if (resp.length < 1 || resp[0] !== data[0]) throw new ProbeError(`CMSIS-DAP: unexpected response to command ${h2(data[0])}`);
      return resp;
    }

    async _info(id) {
      const r = await this._cmd([0x00, id]);
      return r.slice(2, 2 + r[1]);
    }

    async connect(speedKhz) {
      if ((await this._cmd([0x02, 0x01]))[1] !== 0x01) throw new ProbeError("CMSIS-DAP: SWD mode not supported");
      await this._cmd([0x11, ...p32(speedKhz * 1000)]);           // DAP_SWJ_Clock
      await this._cmd([0x04, 0x02, 0x80, 0x00, 0x00, 0x00]);       // DAP_TransferConfigure
      await this._cmd([0x13, 0x00]);                               // DAP_SWD_Configure
      return this.dpConnect();
    }

    async close() {
      try { await this._cmd([0x03]); } catch (e) { /* ignore */ }
      await this.t.close();
    }

    async setReset(asserted) { await this._cmd([0x10, asserted ? 0x00 : 0x80, 0x80, 0, 0, 0, 0]); }

    async _swj(nbits, data) { await this._cmd([0x12, nbits & 0xff, ...data]); }

    _checkAck(ack) {
      if (ack === 1) return;
      if (ack === 2) throw new TransferFault("SWD WAIT timeout");
      if (ack === 4) throw new TransferFault("SWD FAULT");
      if (ack & 0x08) throw new ProbeError("SWD parity error");
      throw new ProbeError("SWD no response from target (check the wiring and the target power)");
    }

    async _transfer(ops) {
      const result = [];
      let i = 0;
      while (i < ops.length) {
        const req = [0x05, 0x00, 0x00];
        let nreads = 0, n = 0;
        while (i + n < ops.length) {
          const [ap, rnw, reg, val] = ops[i + n];
          const need = 1 + (rnw ? 0 : 4);
          if (req.length + need > this.packetSize || 3 + 4 * (nreads + rnw) > this.packetSize || n >= 255) break;
          req.push(ap | (rnw << 1) | (reg & 0x0C));
          if (!rnw) req.push(...p32(val));
          nreads += rnw;
          n++;
        }
        req[2] = n;
        const resp = await this._cmd(req);
        if (resp[1] !== n) {
          this._checkAck(resp[2]);
          throw new ProbeError("CMSIS-DAP transfer incomplete");
        }
        this._checkAck(resp[2]);
        for (let k = 0; k < nreads; k++) result.push(u32(resp, 3 + 4 * k));
        i += n;
      }
      return result;
    }

    async _writeBlock(ap, reg, ws) {
      const maxw = (this.packetSize - 5) >> 2;
      for (let i = 0; i < ws.length; i += maxw) {
        const chunk = ws.slice(i, i + maxw);
        const req = [0x06, 0x00, ...p16(chunk.length), ap | (reg & 0x0C)];
        for (const w of chunk) req.push(...p32(w));
        const resp = await this._cmd(req);
        if (u16(resp, 1) !== chunk.length) {
          this._checkAck(resp[3]);
          throw new ProbeError("CMSIS-DAP block transfer incomplete");
        }
        this._checkAck(resp[3]);
      }
    }

    async _readBlock(ap, reg, count) {
      const maxw = (this.packetSize - 4) >> 2;
      const result = [];
      while (count) {
        const n = Math.min(count, maxw);
        const resp = await this._cmd([0x06, 0x00, ...p16(n), ap | 0x02 | (reg & 0x0C)]);
        if (u16(resp, 1) !== n) {
          this._checkAck(resp[3]);
          throw new ProbeError("CMSIS-DAP block transfer incomplete");
        }
        this._checkAck(resp[3]);
        for (let k = 0; k < n; k++) result.push(u32(resp, 4 + 4 * k));
        count -= n;
      }
      return result;
    }
  }

  // CMSIS-DAP v2 transport (bulk endpoints)
  class DapBulk {
    constructor(usb, itf, epOut, epIn) {
      this.usb = usb; this.itf = itf; this.epOut = epOut; this.epIn = epIn;
      this.packetSize = 64;
    }
    async init() {
      await this.usb.claim(this.itf);
      await this.usb.flush(this.epIn, 1024);
    }
    async xfer(data) {
      await this.usb.write(this.epOut, data);
      // a response is never longer than one DAP packet
      return this.usb.read(this.epIn, Math.max(this.packetSize, 64));
    }
    async close() { await this.usb.close(); }
  }

  // CMSIS-DAP v1 transport (HID reports via WebHID)
  class DapHid {
    constructor(hid) {
      this.dev = hid;
      this.packetSize = 64;
      this.queue = [];
      this.waiter = null;
      this.onReport = (ev) => {
        const d = new Uint8Array(ev.data.buffer, ev.data.byteOffset, ev.data.byteLength).slice();
        if (this.waiter) { const w = this.waiter; this.waiter = null; w(d); } else this.queue.push(d);
      };
    }
    async init() {
      try {
        if (!this.dev.opened) await this.dev.open();
      } catch (err) {
        throw new ProbeError(`The programmer could not be opened (${err.message}). Close other programs that use it and try again.`);
      }
      this.dev.addEventListener("inputreport", this.onReport);
      await sleep(10);
      this.queue = [];                          // drop stale responses
    }
    async xfer(data) {
      const buf = new Uint8Array(Math.max(this.packetSize, data.length));
      buf.set(data);
      this.queue = [];
      await this.dev.sendReport(0, buf);
      if (this.queue.length) return this.queue.shift();
      let timer;
      try {
        return await new Promise((resolve, reject) => {
          this.waiter = resolve;
          timer = setTimeout(() => { this.waiter = null; reject(new ProbeError("CMSIS-DAP v1: no response")); }, TIMEOUTS.read);
        });
      } finally {
        clearTimeout(timer);
      }
    }
    async close() {
      this.dev.removeEventListener("inputreport", this.onReport);
      try { await this.dev.close(); } catch (e) { /* ignore */ }
    }
  }

  /* ================================================================================
   * SEGGER J-Link probe (SWD via native USB protocol)
   * ================================================================================ */

  const JLINK_VID = 0x1366;

  class JLink extends RawSWDProbe {
    constructor(usb) {
      super();
      this.usb = usb;
      this.ORUNDETECT = 1;
      this.kind = "jlink";
    }

    static async create(usb) {
      const p = new JLink(usb);
      let found = null;
      for (const itf of usb.interfaces()) {
        const eps = itf.eps.filter((e) => e.type === "bulk");
        if (itf.cls === 0xFF && eps.length === 2) { found = itf; break; }
      }
      if (!found) throw new ProbeError("J-Link: no vendor interface found (Windows: switch the J-Link to WinUSB in the J-Link Configurator)");
      p.itf = found.num;
      for (const ep of found.eps) {
        if (ep.direction === "in") { p.epIn = ep.endpointNumber; p.mps = ep.packetSize || 64; } else p.epOut = ep.endpointNumber;
      }
      await usb.claim(p.itf);
      await usb.flush(p.epIn, 4096);
      p.caps = u32(await p._cmd([0xE8], 4), 0);                 // GET_CAPS
      const n = u16(await p._cmd([0x01], 2), 0);                // GET_VERSION
      const v = await p._read(n);
      const z = v.indexOf(0);
      p.fw = String.fromCharCode(...(z >= 0 ? v.slice(0, z) : v)).replace(/[^\x00-\x7f]/g, "");
      p.name = p.fw ? `J-Link (${p.fw})` : "J-Link";
      try {
        const hw = await p._cmd([0x07], 8);                     // GET_HW_STATUS
        p.voltage = u16(hw, 0) / 1000;
      } catch (e) {
        p.voltage = null;
      }
      return p;
    }

    async _write(data) { await this.usb.write(this.epOut, Uint8Array.from(data)); }

    async _read(size) {
      const parts = [];
      let got = 0;
      const rsize = size % this.mps === 0 ? size + 1 : size;
      while (got < size) {
        const d = await this.usb.read(this.epIn, Math.max(rsize - got, 1));
        parts.push(d);
        got += d.length;
      }
      return bytes(...parts).slice(0, size);
    }

    async _cmd(data, rsize = 0) {
      await this._write(data);
      return rsize ? this._read(rsize) : new Uint8Array(0);
    }

    async connect(speedKhz) {
      if (this.caps & (1 << 17)) await this._cmd([0xC7, 0x01], 4);           // SELECT_IF SWD
      await this._cmd([0x05, ...p16(Math.min(speedKhz, 0xFFFE))]);         // SET_SPEED
      return this.dpConnect();
    }

    async close() { await this.usb.close(); }

    async setReset(asserted) { await this._cmd([asserted ? 0xDC : 0xDD]); }

    // SWD I/O: array of [direction, value] bits -> array of input bits
    async _swdIo(bits) {
      const n = bits.length, nb = (n + 7) >> 3;
      const dirb = new Uint8Array(nb), outb = new Uint8Array(nb);
      for (let i = 0; i < n; i++) {
        if (bits[i][0]) dirb[i >> 3] |= 1 << (i & 7);
        if (bits[i][1]) outb[i >> 3] |= 1 << (i & 7);
      }
      const resp = await this._cmd(bytes([0xCF, 0x00, ...p16(n)], dirb, outb), nb + 1);
      if (resp[nb] !== 0) throw new ProbeError(`J-Link SWD I/O error ${h2(resp[nb])}`);
      const inp = new Array(n);
      for (let i = 0; i < n; i++) inp[i] = (resp[i >> 3] >> (i & 7)) & 1;
      return inp;
    }

    async _swj(nbits, data) {
      const bits = [];
      for (let i = 0; i < nbits; i++) bits.push([1, (data[i >> 3] >> (i & 7)) & 1]);
      await this._swdIo(bits);
    }

    static _req(ap, rnw, reg, val, bits) {
      const a2 = (reg >> 2) & 1, a3 = (reg >> 3) & 1;
      const par = (ap + rnw + a2 + a3) & 1;
      bits.push([1, 1], [1, ap], [1, rnw], [1, a2], [1, a3], [1, par], [1, 0], [1, 1], [0, 0], [0, 0], [0, 0], [0, 0]);
      if (rnw) {
        for (let i = 0; i < 34; i++) bits.push([0, 0]);
      } else {
        bits.push([0, 0]);
        for (let i = 0; i < 32; i++) bits.push([1, (val >>> i) & 1]);
        bits.push([1, popcount(val) & 1]);
      }
    }

    // Expand ops into SWD transactions, handle posted AP reads via RDBUFF
    async _transfer(ops) {
      let nr = 0;
      for (const op of ops) nr += op[1];
      const results = new Array(nr).fill(null);
      const trans = [];
      let pending = null, ridx = 0;
      for (const [ap, rnw, reg, val] of ops) {
        if (ap && rnw) {
          trans.push([1, 1, reg, 0, pending]);
          pending = ridx++;
          continue;
        }
        if (pending !== null) { trans.push([0, 1, DP_RDBUFF, 0, pending]); pending = null; }
        if (rnw) trans.push([0, 1, reg, 0, ridx++]);
        else trans.push([ap, 0, reg, val, null]);
      }
      if (pending !== null) trans.push([0, 1, DP_RDBUFF, 0, pending]);
      let i = 0, retries = 0;
      while (i < trans.length) {
        const chunk = trans.slice(i, i + 48);
        const bits = [];
        for (const [ap, rnw, reg, val] of chunk) JLink._req(ap, rnw, reg, val, bits);
        for (let k = 0; k < 8; k++) bits.push([1, 0]);
        const inp = await this._swdIo(bits);
        let pos = 0, broke = false;
        for (let k = 0; k < chunk.length; k++) {
          const [ap, rnw, reg, val, deliver] = chunk[k];
          const ack = inp[pos + 9] | (inp[pos + 10] << 1) | (inp[pos + 11] << 2);
          if (ack !== 1) {
            i += k;
            if (ack === 2 && retries < 1000) {
              retries++;
              await this._single(0, 0, DP_ABORT, 0x10);
              if (ap && rnw && deliver !== null) {
                results[deliver] = await this._single(0, 1, DP_RDBUFF, 0);
                trans[i] = [ap, rnw, reg, val, null];
              }
              broke = true;
              break;
            }
            if (ack === 4) {
              await this._single(0, 0, DP_ABORT, ABORT_CLEAR);
              throw new TransferFault("SWD FAULT");
            }
            if (ack === 2) throw new TransferFault("SWD WAIT timeout");
            throw new ProbeError("SWD no response from target (check the wiring and the target power)");
          }
          if (rnw) {
            let d = 0;
            for (let b = 0; b < 32; b++) d |= inp[pos + 12 + b] << b;
            d >>>= 0;
            if ((popcount(d) & 1) !== inp[pos + 44]) throw new ProbeError("SWD parity error");
            if (deliver !== null) results[deliver] = d;
          }
          pos += 46;
        }
        if (!broke) i += chunk.length;
      }
      return results;
    }

    // Single transaction (used for error recovery)
    async _single(ap, rnw, reg, val) {
      const bits = [];
      JLink._req(ap, rnw, reg, val, bits);
      for (let k = 0; k < 8; k++) bits.push([1, 0]);
      const inp = await this._swdIo(bits);
      if ((inp[9] | (inp[10] << 1) | (inp[11] << 2)) !== 1) throw new ProbeError("SWD error during recovery");
      if (!rnw) return null;
      let d = 0;
      for (let b = 0; b < 32; b++) d |= inp[12 + b] << b;
      return d >>> 0;
    }
  }

  /* ================================================================================
   * ST-Link probe (V2, V2-1, V3)
   * ================================================================================ */

  const STLINK_VID = 0x0483;
  const STLINK_PIDS = {                 // PID: [name, OUT endpoint, IN endpoint]
    0x3748: ["ST-Link V2", 2, 1],
    0x374a: ["ST-Link V2-1", 1, 1],
    0x374b: ["ST-Link V2-1", 1, 1],
    0x3752: ["ST-Link V2-1", 1, 1],
    0x374e: ["ST-Link V3", 1, 1],
    0x374f: ["ST-Link V3", 1, 1],
    0x3753: ["ST-Link V3", 1, 1],
    0x3754: ["ST-Link V3", 1, 1],
    0x3755: ["ST-Link V3", 1, 1],
    0x3757: ["ST-Link V3", 1, 1],
  };
  const STLINK_OK = 0x80;
  const STLINK_FAULTS = [0x01, 0x10, 0x11, 0x12, 0x14, 0x15, 0x16, 0x18, 0x19, 0x1a];
  const STLINK_V2_FREQ = [[4600, 0], [1800, 1], [1200, 2], [950, 3], [650, 5], [480, 7],
    [400, 9], [360, 10], [240, 15], [150, 25], [125, 31], [100, 40]];

  class STLink extends Probe {
    constructor(usb) {
      super();
      this.usb = usb;
      this.kind = "stlink";
    }

    static async create(usb) {
      const p = new STLink(usb);
      const [pname, out, inp] = STLINK_PIDS[usb.productId];
      p.pname = pname; p.epOut = out; p.epIn = inp;
      await usb.claim(0);
      await usb.flush(p.epIn, 64);
      await p._idle();
      const r = await p._cmd([0xF1], 6);                       // GET_VERSION
      const ver = (r[0] << 8) | r[1];
      p.hw = (ver >> 12) & 0xF;
      p.jtag = (ver >> 6) & 0x3F;
      if (p.hw >= 3) {
        const x = await p._cmd([0xFB], 12);                    // GET_VERSION_EXT
        p.jtag = x[2];
        p.version = `V${p.hw}J${p.jtag}M${x[3]}`;
      } else {
        p.version = `V${p.hw}J${p.jtag}M${ver & 0x3F}`;
      }
      if (p.hw < 3 && p.jtag < 24) throw new ProbeError(`ST-Link firmware ${p.version} is too old, please update it (STLinkUpgrade or STM32CubeProgrammer)`);
      p.name = `${p.pname} (firmware ${p.version})`;
      try {
        const v = await p._cmd([0xF7], 8);                     // GET_TARGET_VOLTAGE
        const a0 = u32(v, 0), a1 = u32(v, 4);
        p.voltage = a0 ? 2 * a1 * 1.2 / a0 : null;
      } catch (e) {
        p.voltage = null;
      }
      p.maxrw = 1024;
      return p;
    }

    _versionOk(v2, v3) { return this.jtag >= (this.hw >= 3 ? v3 : v2); }

    async _cmd(cmd, rsize = 0, data = null) {
      const c = new Uint8Array(16);
      c.set(cmd);
      await this.usb.write(this.epOut, c);
      if (data && data.length) await this.usb.write(this.epOut, data);
      if (rsize) return this.usb.read(this.epIn, rsize);
      return new Uint8Array(0);
    }

    _status(resp) {
      if (resp[0] !== STLINK_OK) {
        if (STLINK_FAULTS.includes(resp[0])) throw new TransferFault(`ST-Link transfer error ${h2(resp[0])}`);
        throw new ProbeError(`ST-Link error ${h2(resp[0])}`);
      }
    }

    async _idle() {
      const mode = (await this._cmd([0xF5], 2))[0];           // GET_CURRENT_MODE
      if (mode === 0x00) await this._cmd([0xF3, 0x07]);        // DFU exit
      else if (mode === 0x02) await this._cmd([0xF2, 0x21]);   // debug exit
      else if (mode === 0x03) await this._cmd([0xF4, 0x01]);   // SWIM exit
    }

    async connect(speedKhz) {
      await this._idle();
      if (this.hw >= 3) {
        this._status(await this._cmd([0xF2, 0x61, 0x00, 0x00, ...p32(speedKhz)], 8));
      } else {
        let div = STLINK_V2_FREQ[STLINK_V2_FREQ.length - 1][1];
        for (const [f, d] of STLINK_V2_FREQ) if (speedKhz >= f) { div = d; break; }
        this._status(await this._cmd([0xF2, 0x43, div], 2));
      }
      return this.reconnect();
    }

    async reconnect() {
      await this._idle();
      this._status(await this._cmd([0xF2, 0x30, 0xA3, 0x00], 2));          // enter SWD
      if (this._versionOk(28, 2)) this._status(await this._cmd([0xF2, 0x4B, 0x00, 0x00], 2));  // init AP 0
      return this.readDp(DP_DPIDR);
    }

    async close() {
      try { await this._idle(); } catch (e) { /* ignore */ }
      await this.usb.close();
    }

    async setReset(asserted) { this._status(await this._cmd([0xF2, 0x3C, asserted ? 0x00 : 0x01], 2)); }

    async readDp(reg) {
      const r = await this._cmd([0xF2, 0x45, ...p16(0xFFFF), ...p16(reg)], 8);
      this._status(r);
      return u32(r, 4);
    }
    async readAp(ap, reg) {
      const r = await this._cmd([0xF2, 0x45, ...p16(ap), ...p16(reg)], 8);
      this._status(r);
      return u32(r, 4);
    }

    async _rwstatus() { this._status(await this._cmd([0xF2, 0x3E], 12)); }

    async readMem(addr, size) {
      const out = new Uint8Array(size);
      let pos = 0;
      for (const [a, n] of chunks(addr, size, this.maxrw)) {
        const d = await this._cmd([0xF2, 0x07, ...p32(a), ...p16(n)], n);
        out.set(d.subarray(0, n), pos);
        await this._rwstatus();
        pos += n;
      }
      return out;
    }
    async writeMem(addr, data) {
      let pos = 0;
      for (const [a, n] of chunks(addr, data.length, this.maxrw)) {
        await this._cmd([0xF2, 0x08, ...p32(a), ...p16(n)], 0, data.subarray(pos, pos + n));
        await this._rwstatus();
        pos += n;
      }
    }
    async read16(addr) {
      if (this._versionOk(26, 1)) {
        const r = await this._cmd([0xF2, 0x47, ...p32(addr), ...p16(2)], 2);
        await this._rwstatus();
        return u16(r, 0);
      }
      return (await this.read8(addr)) | ((await this.read8(addr + 1)) << 8);
    }
    async write16(addr, value) {
      if (this._versionOk(26, 1)) {
        await this._cmd([0xF2, 0x48, ...p32(addr), ...p16(2)], 0, new Uint8Array(p16(value & 0xffff)));
        await this._rwstatus();
      } else {
        await this.write8(addr, value & 0xff);
        await this.write8(addr + 1, (value >> 8) & 0xff);
      }
    }
    async read8(addr) {
      const r = await this._cmd([0xF2, 0x0C, ...p32(addr), ...p16(1)], 2);
      await this._rwstatus();
      return r[0];
    }
    async write8(addr, value) {
      await this._cmd([0xF2, 0x0D, ...p32(addr), ...p16(1)], 0, new Uint8Array([value & 0xff]));
      await this._rwstatus();
    }
  }

  /* ================================================================================
   * Opening a programmer
   * ================================================================================ */

  // CMSIS-DAP vendor IDs for the device chooser (any other probe: "show all USB devices")
  const DAP_VIDS = [0x0d28, 0x2e8a, 0xc251, 0x1a86, 0x03eb, 0x1fc9, 0x1209, 0x16c0, 0x0483, 0x1366];
  const USB_FILTERS = [
    ...Object.keys(STLINK_PIDS).map((pid) => ({ vendorId: STLINK_VID, productId: Number(pid) })),
    { vendorId: JLINK_VID },
    ...DAP_VIDS.filter((v) => v !== STLINK_VID && v !== JLINK_VID).map((v) => ({ vendorId: v })),
  ];
  const HID_FILTERS = [...DAP_VIDS.map((v) => ({ vendorId: v })), { usagePage: 0xFF00 }];

  // Kind of programmer from the USB descriptors (null: not a known programmer)
  function usbKind(device) {
    if (device.vendorId === STLINK_VID && STLINK_PIDS[device.productId]) return "stlink";
    if (device.vendorId === JLINK_VID) return "jlink";
    const has = (s) => (s || "").toUpperCase().includes("CMSIS-DAP");
    if (has(device.productName)) return "cmsis-dap";
    try {
      for (const itf of device.configuration ? device.configuration.interfaces : []) {
        for (const alt of itf.alternates) if (has(alt.interfaceName)) return "cmsis-dap";
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  // Open a WebUSB programmer (as find_probe in tinyocd.py, for one device)
  async function openUsbProbe(device) {
    const usb = new UsbDev(device);
    await usb.open();
    try {
      if (device.vendorId === STLINK_VID && STLINK_PIDS[device.productId]) return await STLink.create(usb);
      if (device.vendorId === JLINK_VID) return await JLink.create(usb);
      const product = usb.productName;
      let hid = false;
      for (const itf of usb.interfaces()) {
        if (!itf.name.toUpperCase().includes("CMSIS-DAP") && !product.toUpperCase().includes("CMSIS-DAP")) continue;
        if (itf.cls === 0xFF) {
          const eps = itf.eps.filter((e) => e.type === "bulk");
          if (eps.length >= 2) {
            const o = eps.find((e) => e.direction === "out"), i = eps.find((e) => e.direction === "in");
            const t = new DapBulk(usb, itf.num, o.endpointNumber, i.endpointNumber);
            await t.init();
            return await CMSISDAP.create(t, `CMSIS-DAP v2 "${product}"`);
          }
        } else if (itf.cls === 0x03) hid = true;
      }
      if (hid) throw new ProbeError("This CMSIS-DAP programmer only has a HID interface (CMSIS-DAP v1). Connect it with \"CMSIS-DAP v1 (HID)\" instead.");
      throw new ProbeError(`${product || "This USB device"} is not a supported programmer (no CMSIS-DAP, ST-Link or J-Link interface)`);
    } catch (err) {
      await usb.close();
      throw err;
    }
  }

  // Open a CMSIS-DAP v1 programmer through WebHID
  async function openHidProbe(device) {
    const t = new DapHid(device);
    await t.init();
    try {
      return await CMSISDAP.create(t, `CMSIS-DAP v1 "${device.productName || "HID"}"`);
    } catch (err) {
      await t.close();
      throw err;
    }
  }

  /* ================================================================================
   * Target (Cortex-M core control, chip detection, flash programming)
   * ================================================================================ */

  const DHCSR = 0xE000EDF0, DCRSR = 0xE000EDF4, DCRDR = 0xE000EDF8, DEMCR = 0xE000EDFC;
  const AIRCR = 0xE000ED0C, CPUID = 0xE000ED00, DBGKEY = 0xA05F0000;
  const C_DEBUGEN = 1, C_HALT = 2, C_MASKINTS = 8, S_REGRDY = 1 << 16, S_HALT = 1 << 17;
  const CPU_NAMES = { 0xC20: "Cortex-M0", 0xC60: "Cortex-M0+", 0xC23: "Cortex-M3", 0xC24: "Cortex-M4", 0xC27: "Cortex-M7", 0xD21: "Cortex-M33", 0xD20: "Cortex-M23" };

  class Chip {
    constructor(name, driver, flashBase, flashSize, ramBase = 0x20000000, ramSize = 0x1000, o = {}) {
      this.name = name;
      this.driver = driver;
      this.flashBase = flashBase;
      this.flashSize = flashSize;
      this.ramBase = ramBase;
      this.ramSize = ramSize;
      this.regions = o.regions || [[flashBase, flashSize, 0]];
      this.hasBootpin = o.bootpin === undefined ? null : o.bootpin;   // null, "fixed" or "option"
      this.hasNrst = !!o.nrst;
      this.hasLock = o.lock === undefined ? true : o.lock;
      const last = this.regions[this.regions.length - 1];
      this.flashSpan = last[0] + last[1] - flashBase;     // address range of the flash (with gaps between banks)
    }
  }

  async function ignoreLink(p) {
    try { await p; } catch (e) { if (!isLink(e)) throw e; }
  }

  class Target {
    constructor(probe, speed = 1000, log = null) {
      this.probe = probe;
      this.speed = speed;
      this.log = log || (() => {});
      this.chip = null;
      this.locked = false;
      this.halted = false;
      this.underReset = false;
    }

    /* ---------- connection and core control ---------- */

    async connect() {
      try {
        this.dpidr = await this.probe.connect(this.speed);
        await this.halt();
      } catch (e) {
        await this._connectUnderReset();        // e.g. SWD pins disabled or low-power mode
      }
      await this.detect();
      if (this.chip.driver && !this.locked) await this.resetHalt();
    }

    async _connectUnderReset() {
      this.underReset = true;
      await this.probe.setReset(true);
      await sleep(50);
      try {
        this.dpidr = await this.probe.reconnect();
        try {
          await this.write32(DEMCR, 1);
          await this.write32(DHCSR, DBGKEY | C_DEBUGEN | C_HALT);
        } catch (e) {
          if (!(e instanceof TransferFault)) throw e;
        }
      } finally {
        await this.probe.setReset(false);
      }
      await sleep(50);
      try {
        await this.halt();
      } catch (e) {
        this.halted = false;                    // possibly locked (e.g. SAMD security bit)
      }
    }

    read32(a) { return this.probe.read32(a); }
    write32(a, v) { return this.probe.write32(a, v); }
    readMem(a, n) { return this.probe.readMem(a, n); }
    writeMem(a, d) { return this.probe.writeMem(a, d); }

    async tryRead32(addr) {
      try {
        return await this.read32(addr);
      } catch (e) {
        if (!isLink(e)) throw e;
        if (this.probe.clearErrors) await this.probe.clearErrors();
        return null;
      }
    }

    async wait(addr, mask, value = 0, timeout = 10.0, kick = null) {
      const start = now();
      for (;;) {
        const v = await this.read32(addr);
        if (((v & mask) >>> 0) === (value >>> 0)) return v;
        if (kick) await kick();
        if (now() - start > timeout) throw new Error(`Timeout waiting for target (${h8(addr)} = ${h8(v)})`);
      }
    }

    async halt() {
      await this.write32(DHCSR, DBGKEY | C_DEBUGEN | C_HALT);
      await this.wait(DHCSR, S_HALT, S_HALT, 0.5);
      this.halted = true;
    }

    async resetHalt() {
      await this.write32(DEMCR, (await this.read32(DEMCR)) | 1);           // VC_CORERESET
      await ignoreLink(this.write32(AIRCR, 0x05FA0004));                   // SYSRESETREQ
      await sleep(50);
      let ok = false;
      for (let i = 0; i < 20; i++) {
        try {
          if ((await this.read32(DHCSR)) & S_HALT) { ok = true; break; }
        } catch (e) {
          if (!isLink(e)) throw e;
          await this.reconnect();
        }
        await sleep(10);
      }
      if (!ok) throw new Error("Target did not halt after reset");
      await this.write32(DEMCR, (await this.read32(DEMCR)) & ~1);
      this.halted = true;
      await this.freezeWatchdog();
    }

    async reconnect() {
      let last = null;
      for (let i = 0; i < 20; i++) {
        try {
          await this.probe.reconnect();
          await this.halt();
          return;
        } catch (e) {
          if (!isLink(e)) throw e;
          last = e;
          await sleep(100);
        }
      }
      throw new Error(`Lost connection to target (${last && last.message})`);
    }

    // Reconnect after the chip was reset by an option byte reload
    async reconnectAfterReset() {
      await sleep(200);
      try {
        await this.reconnect();
      } catch (e) {
        await this._connectUnderReset();
      }
      this.locked = await this.chip.driver.isLocked();
      if (!this.locked) await this.resetHalt();
    }

    async writeReg(reg, value) {
      await this.write32(DCRDR, value);
      await this.write32(DCRSR, reg | (1 << 16));
      await this.wait(DHCSR, S_REGRDY, S_REGRDY, 0.5);
    }
    async readReg(reg) {
      await this.write32(DCRSR, reg);
      await this.wait(DHCSR, S_REGRDY, S_REGRDY, 0.5);
      return this.read32(DCRDR);
    }

    async freezeWatchdog() {
      const fz = this.chip && this.chip.driver ? this.chip.driver.iwdgFreeze : null;
      if (fz) {
        const v = await this.tryRead32(fz[0]);
        if (v !== null) await ignoreLink(this.write32(fz[0], v | fz[1]));
      }
    }

    async exit(run = true) {
      try {
        if (run && this.halted) {
          await this.write32(DEMCR, 0);
          await this.write32(DHCSR, DBGKEY | C_DEBUGEN);
          await ignoreLink(this.write32(AIRCR, 0x05FA0004));
          await sleep(10);
          await ignoreLink(this.write32(DHCSR, DBGKEY));
        }
      } finally {
        try { await this.probe.setReset(false); } catch (e) { /* ignore */ }
        await this.probe.close();
      }
    }

    /* ---------- chip detection ---------- */

    async detect() {
      if (!this.halted) {
        // Core not accessible: check for a locked SAMD (DSU external access)
        const did = await this.tryRead32(SAMD_DSU + 0x100 + 0x18);
        const chip = did ? await samdChip(this, did) : null;
        if (!chip) throw new Error("Cannot access the target core");
        this.chip = chip;
        this.idcode = did;
        this.locked = true;
        return;
      }
      const cpuid = await this.read32(CPUID);
      const part = (cpuid >>> 4) & 0xFFF;
      this.cpu = CPU_NAMES[part] || `CPUID ${h8(cpuid)}`;
      const idcodes = [];
      let found = false;
      for (const addr of STM32_IDCODE_ADDR[part] || []) {
        const idcode = await this.tryRead32(addr);
        if (idcode === null) continue;
        idcodes.push(idcode);
        const dev = STM32_DEVICES[idcode & 0xFFF];
        if (dev && dev[0] === addr) {
          this.chip = await stm32Chip(this, part, idcode & 0xFFF, dev);
          this.idcode = idcode;
          this.devid = idcode & 0xFFF;
          found = true;
          break;
        }
      }
      if (!found) {
        let chip = null;
        if (part === 0xC20 || part === 0xC60) {
          const id = await this.tryRead32(0x40015800);
          chip = await py32Chip(this, id);
          if (chip) this.idcode = id;
        }
        if (!chip && (part === 0xC60 || part === 0xC24)) {
          const did = await this.tryRead32(SAMD_DSU + 0x18);
          chip = await samdChip(this, did);
          if (chip) this.idcode = did;
        }
        if (!chip) throw new Error(`Unsupported chip (${this.cpu}, IDCODE ${idcodes.map(h8).join(", ") || "n/a"})`);
        this.chip = chip;
      }
      this.locked = await this.chip.driver.isLocked();
    }

    /* ---------- flash loader ---------- */

    _layout() {
      const base = this.chip.ramBase;
      return [base, base + 0xA0, base + 0x100, Math.min(this.chip.ramSize - 0x100, 0x4000)];
    }

    async loadLoader() {
      const code = new Uint8Array(LOADER_CODE.length * 2 + ((LOADER_CODE.length * 2) % 4 ? 2 : 0));
      LOADER_CODE.forEach((h, i) => { code[2 * i] = h & 0xff; code[2 * i + 1] = h >> 8; });
      await this.writeMem(this.chip.ramBase, code);
    }

    // Run loader for count units of data (already in RAM buffer at src)
    async runLoader(p, src, dst, count, timeout = null) {
      const [code, params] = this._layout();
      const unit = p.unit;
      const g = (k, d) => (p[k] === undefined ? d : p[k]);
      const block = packWords([src, dst, count, unit, g("stride", unit), p.sr, p.busy, g("xor", 0), g("err", 0),
        g("cr", 0), g("trig", 0), g("pos", 0xFFFFFFFF), g("flags", 0), g("set", 0), g("kick", 0), g("kickval", 0), 0]);
      await this.writeMem(params, block);
      await this.writeReg(0, params);
      await this.writeReg(13, params);
      await this.writeReg(14, code | 1);
      await this.writeReg(15, code);
      await this.writeReg(16, 0x01000000);
      await this.write32(DHCSR, DBGKEY | C_DEBUGEN | C_HALT | C_MASKINTS);
      await this.write32(DHCSR, DBGKEY | C_DEBUGEN | C_MASKINTS);
      if (timeout === null) timeout = 2.0 + 0.05 * count;
      const start = now();
      while (!((await this.read32(DHCSR)) & S_HALT)) {
        if (now() - start > timeout) {
          await this.halt();
          throw new Error(`Flash loader timeout at ${h8(await this.readReg(2))}`);
        }
      }
      const result = await this.readReg(0);
      if (result) {
        const fail = await this.read32(params + 0x40);
        throw new Error(`Flash operation failed at ${h8(fail)} (status ${h8(result)})`);
      }
    }

    // Write data to target using the loader (data length must be a multiple of unit)
    async loaderWrite(p, dst, data, stride = null, progress = null) {
      await this.loadLoader();
      const [, , buf, bufsize] = this._layout();
      const unit = p.unit;
      const step = stride || unit;
      const chunk = Math.max(unit, Math.floor(bufsize / unit) * unit);
      let pos = 0;
      while (pos < data.length) {
        const block = data.subarray(pos, pos + chunk);
        const padded = new Uint8Array(block.length + ((4 - (block.length % 4)) % 4)).fill(0xff);
        padded.set(block);
        await this.writeMem(buf, padded);
        const count = Math.floor(block.length / unit);
        await this.runLoader(p, buf, dst, count);
        dst += count * step;
        pos += block.length;
        if (progress) progress(block.length);
      }
    }

    /* ---------- high-level functions ---------- */

    async checkImage(data) {
      const c = this.chip, last = c.regions[c.regions.length - 1];
      const end = last[0] + last[1];
      if (data.length > end - c.flashBase) throw new Error(`Not enough memory (file: ${data.length} bytes, flash: ${c.flashSize} bytes)`);
      let pos = 0;
      for (const [addr, size] of c.regions) {
        const off = addr - c.flashBase;
        if (off > pos && !allFF(data, pos, off)) throw new Error(`The firmware contains data outside of the flash (offset 0x${pos.toString(16)})`);
        pos = off + size;
      }
      await c.driver.checkImage(data);
    }

    async unlock() {
      if (!this.locked) { this.log("The chip is not locked, nothing to do."); return false; }
      await this.chip.driver.unlock();
      await this.reconnectAfterReset();
      if (this.locked) throw new Error("Unlocking failed");
      await this.detect();                      // update chip information
      await this.resetHalt();
      return true;
    }

    async lock() {
      await this.chip.driver.lock();
      await this.reconnectAfterReset();
    }

    erase() { return this.chip.driver.erase(); }

    async flashData(data, progress) {
      const drv = this.chip.driver, unit = drv.unit;
      const padded = new Uint8Array(data.length + ((unit - (data.length % unit)) % unit)).fill(0xff);
      padded.set(data);
      let done = 0;
      const total = padded.length;
      const skip = drv.skip || 0;                              // ATSAMD: area protected by BOOTPROT (checked to be empty)
      for (const [addr, size, bank] of this.chip.regions) {
        const off = addr - this.chip.flashBase;
        const s = Math.max(0, Math.min(size, skip - off));
        const seg = padded.subarray(off + s, off + size);
        if (!seg.length) continue;
        if (s) this.log(`Skipping the first ${skip} bytes (bootloader area protected by BOOTPROT).`);
        await drv.prepare(bank);
        try {
          await this.loaderWrite(drv.loaderParams(bank), addr + s, seg, null,
            progress ? (n) => { done += n; progress(Math.min(1, done / total)); } : null);
        } finally {
          await drv.finish(bank);
        }
      }
    }

    // Read memory regions of the image (same transfers as one read, in 4 KB steps for the progress bar)
    async readRegions(length, progress, skip = 0) {
      const out = new Uint8Array(length).fill(0xff);
      let done = 0;
      for (const [addr, size] of this.chip.regions) {
        const off = addr - this.chip.flashBase;
        const n = Math.min(size, Math.max(0, length - off));
        if (n <= 0) continue;
        const total = n + ((4 - (n % 4)) % 4);
        for (let p = Math.max(0, Math.min(total, skip - off)) & ~0x3FF; p < total; p += 0x1000) {
          const k = Math.min(0x1000, total - p);
          const d = await this.readMem(addr + p, k);
          out.set(d.subarray(0, Math.min(k, n - p)), off + p);
          done += Math.min(k, n - p);
          if (progress) progress(Math.min(1, done / length));
        }
      }
      return out;
    }

    async verifyData(data, progress) {
      const skip = this.chip.driver.skip || 0;
      const back = await this.readRegions(data.length, progress, skip);
      for (const [addr, size] of this.chip.regions) {
        const off = addr - this.chip.flashBase;
        for (let i = Math.max(off, skip); i < Math.min(off + size, data.length); i++) {
          if (back[i] !== data[i]) throw new Error(`Verification failed at ${h8(addr + i - off)}`);
        }
      }
    }

    async setBootpin() {
      if (this.chip.hasBootpin === "fixed") { this.log("The BOOT0 pin is always usable on this chip, nothing to do."); return false; }
      await this.chip.driver.bootpin();
      await this.reconnectAfterReset();
      return true;
    }

    async setNrst(gpio) {
      await this.chip.driver.nrst(gpio);
      await this.reconnectAfterReset();
    }
  }

  /* ================================================================================
   * Flash drivers
   * ================================================================================ */

  class FlashDriver {
    constructor(t) { this.t = t; this.unit = 4; this.iwdgFreeze = null; }
    async isLocked() { return false; }
    async checkImage(data) { /* nothing */ }
    async prepare(bank) { /* nothing */ }
    async finish(bank) { /* nothing */ }
    async unlock() { throw new Error("Unlocking is not supported on this chip"); }
    async lock() { throw new Error("Locking is not supported on this chip"); }
    async bootpin() { throw new Error("BOOT0 pin configuration is not supported on this chip"); }
    async nrst(gpio) { throw new Error("NRST pin configuration is not supported on this chip"); }
    r(reg) { return this.t.read32(this.base + reg); }
    w(reg, v) { return this.t.write32(this.base + reg, v); }
    async _unlockKeys(cr, lockbit, keyr, keys = [0x45670123, 0xCDEF89AB]) {
      if ((await this.r(cr)) & lockbit) {
        await this.w(keyr, keys[0]);
        await this.w(keyr, keys[1]);
        if ((await this.r(cr)) & lockbit) throw new Error("Unlocking the flash controller failed");
      }
    }
  }

  /* ---------- STM32F0/F1/F3 ---------- */

  class STM32F1Flash extends FlashDriver {
    constructor(t, part, devid, size) {
      super(t);
      this.unit = 2;
      this.base = 0x40022000;
      this.f1 = part === 0xC23;
      this.defaultRdp = this.f1 ? 0xA5 : 0xAA;
      this.bootsel = devid === 0x445 || devid === 0x442;
      this.iwdgFreeze = this.f1 ? [0xE0042004, 1 << 8] : (part === 0xC20 ? [0x40015808, 1 << 12] : [0xE0042008, 1 << 12]);
    }
    _bank(b) { return this.base + 0x40 * b; }
    async _wait(bank, timeout = 10.0) {
      const sr = await this.t.wait(this._bank(bank) + 0x0C, 0x01, 0, timeout);
      if (sr & 0x14) {
        await this.t.write32(this._bank(bank) + 0x0C, 0x34);
        throw new Error(`Flash error (SR ${h8(sr)})`);
      }
    }
    async _unlock(bank) {
      const b = this._bank(bank);
      if ((await this.t.read32(b + 0x10)) & 0x80) {
        await this.t.write32(b + 0x04, 0x45670123);
        await this.t.write32(b + 0x04, 0xCDEF89AB);
      }
    }
    banks() { return [...new Set(this.t.chip.regions.map((r) => r[2]))].sort(); }
    async isLocked() {
      const obr = await this.r(0x1C);
      return this.f1 ? !!(obr & 0x02) : !!((obr >> 1) & 0x03);
    }
    async erase() {
      for (const bank of this.banks()) {
        const b = this._bank(bank);
        await this._unlock(bank);
        await this._wait(bank);
        await this.t.write32(b + 0x0C, 0x34);
        await this.t.write32(b + 0x10, 0x04);                  // MER
        await this.t.write32(b + 0x10, 0x44);                  // MER | STRT
        await this._wait(bank, 60.0);
        await this.t.write32(b + 0x10, 0x80);                  // LOCK
      }
    }
    async prepare(bank) {
      const b = this._bank(bank);
      await this._unlock(bank);
      await this._wait(bank);
      await this.t.write32(b + 0x0C, 0x34);
      await this.t.write32(b + 0x10, 0x01);                    // PG
    }
    loaderParams(bank) { return { unit: 2, flags: 1, sr: this._bank(bank) + 0x0C, busy: 0x01, err: 0x14 }; }
    async finish(bank) { await this.t.write32(this._bank(bank) + 0x10, 0x80); }
    async _options(rdp = null, userSet = 0) {
      const obr = await this.r(0x1C);
      const wrp = await this.r(0x20);
      let user, data;
      if (this.f1) { user = (obr >>> 2) & 0xFF; data = (obr >>> 10) & 0xFFFF; } else { user = (obr >>> 8) & 0xFF; data = (obr >>> 16) & 0xFFFF; }
      if (rdp === null) rdp = (await this.isLocked()) ? 0x00 : this.defaultRdp;
      user |= userSet;
      const ob = [rdp, user, data & 0xFF, data >> 8, wrp & 0xFF, (wrp >>> 8) & 0xFF, (wrp >>> 16) & 0xFF, wrp >>> 24];
      await this._unlock(0);
      await this.w(0x08, 0x45670123);                          // OPTKEYR
      await this.w(0x08, 0xCDEF89AB);
      await this.w(0x10, 0x220);                               // OPTER | OPTWRE
      await this.w(0x10, 0x260);                               // OPTER | OPTWRE | STRT
      await this._wait(0, 60.0);
      await this.w(0x10, 0x210);                               // OPTPG | OPTWRE
      const obData = new Uint8Array(16);
      ob.forEach((v, i) => { obData[2 * i] = v & 0xff; obData[2 * i + 1] = (v >> 8) & 0xff; });
      await this.t.loaderWrite(this.loaderParams(0), 0x1FFFF800, obData);
      if (this.f1) {
        await this.w(0x10, 0x80);
        await ignoreLink(this.t.write32(AIRCR, 0x05FA0004));   // reload option bytes by reset
      } else {
        await ignoreLink(this.w(0x10, 0x2200));                // OBL_LAUNCH | OPTWRE
      }
    }
    unlock() { return this._options(this.defaultRdp); }
    lock() { return this._options(0x00); }
    async bootpin() {
      if (this.f1) return super.bootpin();
      await this._options(null, this.bootsel ? 0x90 : 0x10);   // (BOOT_SEL) | nBOOT1
    }
  }

  /* ---------- STM32F2/F4/F7 ---------- */

  class STM32F4Flash extends FlashDriver {
    constructor(t) {
      super(t);
      this.unit = 2;
      this.base = 0x40023C00;
      this.iwdgFreeze = [0xE0042008, 1 << 12];
    }
    static async create(t, part, devid, size) {
      const d = new STM32F4Flash(t);
      const optcr = await t.read32(d.base + 0x14);
      if (devid === 0x419 || devid === 0x434) d.dual = size >= 2048 * 1024 || (size === 1024 * 1024 && !!(optcr & (1 << 30)));
      else if (devid === 0x451) d.dual = !(optcr & (1 << 29));
      else d.dual = false;
      return d;
    }
    async _wait(timeout = 10.0) {
      const sr = await this.t.wait(this.base + 0x0C, 1 << 16, 0, timeout);
      if (sr & 0xF2) { await this.w(0x0C, 0xF3); throw new Error(`Flash error (SR ${h8(sr)})`); }
    }
    _unlock() { return this._unlockKeys(0x10, 1 << 31, 0x04); }
    async isLocked() { return (((await this.r(0x14)) >>> 8) & 0xFF) !== 0xAA; }
    async erase() {
      await this._unlock();
      await this._wait();
      await this.w(0x0C, 0xF3);
      const cr = 0x04 | (this.dual ? 1 << 15 : 0) | (1 << 8);  // MER (| MER1) | PSIZE x16
      await this.w(0x10, cr);
      await this.w(0x10, cr | (1 << 16));                      // STRT
      await this._wait(120.0);
      await this.w(0x10, 1 << 31);
    }
    async prepare() {
      await this._unlock();
      await this._wait();
      await this.w(0x0C, 0xF3);
      await this.w(0x10, 0x101);                               // PG | PSIZE x16
    }
    loaderParams() { return { unit: 2, flags: 1, sr: this.base + 0x0C, busy: 1 << 16, err: 0xF2 }; }
    async finish() { await this.w(0x10, 1 << 31); }
    async _setRdp(rdp) {
      await this._unlock();
      if ((await this.r(0x14)) & 1) {
        await this.w(0x08, 0x08192A3B);
        await this.w(0x08, 0x4C5D6E7F);
      }
      await this._wait();
      const optcr = ((await this.r(0x14)) & ~0xFF03) | (rdp << 8);
      await this.w(0x14, optcr);
      await this.w(0x14, optcr | 0x02);                        // OPTSTRT
      await this._wait(300.0);
      await this.w(0x14, optcr | 0x01);                        // OPTLOCK
      await ignoreLink(this.t.write32(AIRCR, 0x05FA0004));
    }
    unlock() { return this._setRdp(0xAA); }
    lock() { return this._setRdp(0xBB); }
  }

  /* ---------- STM32L0/L1 ---------- */

  class STM32L0Flash extends FlashDriver {
    constructor(t, part, devid, size) {
      super(t);
      this.l1 = part === 0xC23;
      this.base = this.l1 ? 0x40023C00 : 0x40022000;
      this.page = this.l1 ? 256 : 128;
      this.unit = this.page / 2;                               // half page
      this.size = size;
      this.iwdgFreeze = [this.l1 ? 0xE0042008 : 0x40015808, 1 << 12];
    }
    async _unlock() {
      if ((await this.r(0x04)) & 0x01) {
        await this.w(0x0C, 0x89ABCDEF);
        await this.w(0x0C, 0x02030405);
      }
      if ((await this.r(0x04)) & 0x02) {
        await this.w(0x10, 0x8C9DAEBF);
        await this.w(0x10, 0x13141516);
      }
      if ((await this.r(0x04)) & 0x03) throw new Error("Unlocking the flash controller failed");
    }
    async _lock() { await this.w(0x04, ((await this.r(0x04)) & ~0x608) | 0x01); }
    async _wait(timeout = 10.0) {
      const sr = await this.t.wait(this.base + 0x18, 0x01, 0, timeout);
      if (sr & 0x32700) { await this.w(0x18, 0x32F00); throw new Error(`Flash error (SR ${h8(sr)})`); }
    }
    async isLocked() { return ((await this.r(0x1C)) & 0xFF) !== 0xAA; }
    async erase() {
      await this._unlock();
      await this._wait();
      await this.w(0x18, 0x32F00);
      await this.w(0x04, ((await this.r(0x04)) & ~0x400) | 0x208);        // ERASE | PROG
      const p = { unit: 4, stride: this.page, sr: this.base + 0x18, busy: 0x01, err: 0x32700 };
      try {
        await this.t.loaderWrite(p, 0x08000000, new Uint8Array(4 * Math.floor(this.size / this.page)), this.page);
      } finally {
        await this._lock();
      }
    }
    async prepare() {
      await this._unlock();
      await this._wait();
      await this.w(0x18, 0x32F00);
      await this.w(0x04, ((await this.r(0x04)) & ~0x200) | 0x408);        // FPRG | PROG
    }
    loaderParams() { return { unit: this.unit, sr: this.base + 0x18, busy: 0x01, err: 0x32700 }; }
    finish() { return this._lock(); }
    async _setRdp(rdp) {
      await this._unlock();
      await this.w(0x14, 0xFBEAD9C8);                          // OPTKEYR
      await this.w(0x14, 0x24252627);
      await this._wait();
      const lo = ((await this.r(0x1C)) & 0x100) | rdp;
      await this.t.write32(0x1FF80000, lo | ((~lo & 0xFFFF) << 16));
      await this._wait(120.0);
      try {
        await this.w(0x04, (await this.r(0x04)) | (1 << 18));  // OBL_LAUNCH
      } catch (e) { if (!isLink(e)) throw e; }
    }
    unlock() { return this._setRdp(0xAA); }
    lock() { return this._setRdp(0xBB); }
  }

  /* ---------- STM32 C0/G0/G4/L4/L4+/L5/U0/U3/U5/WB/WBA/WL ---------- */

  class STM32L4Flash extends FlashDriver {
    constructor(t, part, devid, size, opts) {
      super(t);
      this.base = opts.base || 0x40022000;
      this.l5 = !!opts.l5;
      this.dual = !!opts.dual;
      this.unit = opts.quad ? 16 : 8;
      this.boot = opts.boot || null;
      this.nrststyle = opts.nrst || null;
      this.busy = (1 << 16) | (1 << 18) | (devid === 0x467 ? 1 << 17 : 0);
      [this.KEYR, this.OPTKEYR, this.SR, this.CR, this.OPTR] = this.l5 ? [0x08, 0x10, 0x20, 0x28, 0x40] : [0x08, 0x0C, 0x10, 0x14, 0x20];
      this.iwdgFreeze = opts.fz ? [opts.fz, 1 << 12] : null;
      this.opts = opts;
    }
    static async create(t, part, devid, size, opts) {
      const d = new STM32L4Flash(t, part, devid, size, opts);
      if (opts.tz && ((await d.r(d.OPTR)) & (1 << 31))) throw new Error("TrustZone is enabled on this chip, this is not supported");
      return d;
    }
    async _wait(timeout = 10.0) {
      const sr = await this.t.wait(this.base + this.SR, this.busy, 0, timeout);
      if (sr & 0x3FA) { await this.w(this.SR, 0x3FB); throw new Error(`Flash error (SR ${h8(sr)})`); }
    }
    _unlock() { return this._unlockKeys(this.CR, 1 << 31, this.KEYR); }
    async isLocked() { return ((await this.r(this.OPTR)) & 0xFF) !== 0xAA; }
    async erase() {
      await this._unlock();
      await this._wait();
      await this.w(this.SR, 0x3FB);
      const cr = 0x04 | (this.dual ? 1 << 15 : 0);              // MER1 (| MER2)
      await this.w(this.CR, cr);
      await this.w(this.CR, cr | (1 << 16));                   // STRT
      await this._wait(120.0);
      await this.w(this.CR, 1 << 31);
    }
    async prepare() {
      await this._unlock();
      await this._wait();
      await this.w(this.SR, 0x3FB);
      await this.w(this.CR, 0x01);                             // PG
    }
    loaderParams() { return { unit: this.unit, sr: this.base + this.SR, busy: this.busy, err: 0x3FA }; }
    async finish() { await this.w(this.CR, 1 << 31); }
    async _setOptr(fn) {
      await this._unlock();
      if ((await this.r(this.CR)) & (1 << 30)) {
        await this.w(this.OPTKEYR, 0x08192A3B);
        await this.w(this.OPTKEYR, 0x4C5D6E7F);
        if ((await this.r(this.CR)) & (1 << 30)) throw new Error("Unlocking the option bytes failed");
      }
      await this._wait();
      await this.w(this.SR, 0x3FB | (1 << 15));
      await this.w(this.OPTR, fn(await this.r(this.OPTR)));
      await this.w(this.CR, (await this.r(this.CR)) | (1 << 17));          // OPTSTRT
      await this._wait(300.0);
      try {
        await this.w(this.CR, (await this.r(this.CR)) | (1 << 27));        // OBL_LAUNCH
      } catch (e) { if (!isLink(e)) throw e; }
    }
    unlock() { return this._setOptr((v) => (v & ~0xFF) | 0xAA); }
    lock() { return this._setOptr((v) => (v & ~0xFF) | 0xBB); }
    async bootpin() {
      if (this.boot === "sel") return this._setOptr((v) => (v & ~(1 << 24)) | (1 << 25));     // nBOOT_SEL=0, nBOOT1=1
      if (this.boot === "sw") return this._setOptr((v) => v | (1 << 26) | (1 << 23));         // nSWBOOT0=1, nBOOT1=1
      if (this.boot === "sw5") return this._setOptr((v) => v | (1 << 26));                    // nSWBOOT0=1
      return super.bootpin();
    }
    async nrst(gpio) {
      const mode = gpio ? 0b10 : 0b11;
      if (this.nrststyle === "g0") return this._setOptr((v) => (v & ~(3 << 27)) | (mode << 27));
      if (this.nrststyle === "g4") return this._setOptr((v) => (v & ~(3 << 28)) | (mode << 28));
      return super.nrst(gpio);
    }
  }

  /* ---------- STM32H7 ---------- */

  class STM32H7Flash extends FlashDriver {
    constructor(t, part, devid) {
      super(t);
      this.base = 0x52002000;
      this.h7a = devid === 0x480;
      this.unit = this.h7a ? 16 : 32;
      this.iwdgFreeze = [0x5C001054, 1 << 18];
    }
    _b(bank) { return this.base + 0x100 * bank; }
    async _wait(bank, timeout = 10.0) {
      const sr = await this.t.wait(this._b(bank) + 0x10, 0x05, 0, timeout);
      if (sr & 0x07EE0000) { await this.t.write32(this._b(bank) + 0x14, 0x07EE0000); throw new Error(`Flash error (SR ${h8(sr)})`); }
    }
    async _unlock(bank) {
      const b = this._b(bank);
      if ((await this.t.read32(b + 0x0C)) & 1) {
        await this.t.write32(b + 0x04, 0x45670123);
        await this.t.write32(b + 0x04, 0xCDEF89AB);
        if ((await this.t.read32(b + 0x0C)) & 1) throw new Error("Unlocking the flash controller failed");
      }
    }
    async isLocked() { return (((await this.r(0x1C)) >>> 8) & 0xFF) !== 0xAA; }
    async erase() {
      for (const bank of [...new Set(this.t.chip.regions.map((r) => r[2]))].sort()) {
        const b = this._b(bank);
        await this._unlock(bank);
        await this._wait(bank);
        await this.t.write32(b + 0x14, 0x07EF0000);
        const [cr, start] = this.h7a ? [0x08, 1 << 5] : [0x08 | (3 << 4), 1 << 7];  // BER (| PSIZE x64), START
        await this.t.write32(b + 0x0C, cr);
        await this.t.write32(b + 0x0C, cr | start);
        await this._wait(bank, 120.0);
        await this.t.write32(b + 0x0C, 0x01);
      }
    }
    async prepare(bank) {
      const b = this._b(bank);
      await this._unlock(bank);
      await this._wait(bank);
      await this.t.write32(b + 0x14, 0x07EF0000);
      await this.t.write32(b + 0x0C, 0x02);                    // PG
    }
    loaderParams(bank) { return { unit: this.unit, sr: this._b(bank) + 0x10, busy: 0x05, err: 0x07EE0000 }; }
    async finish(bank) { await this.t.write32(this._b(bank) + 0x0C, 0x01); }
    async _setRdp(rdp) {
      if ((await this.r(0x18)) & 1) {
        await this.w(0x08, 0x08192A3B);
        await this.w(0x08, 0x4C5D6E7F);
        if ((await this.r(0x18)) & 1) throw new Error("Unlocking the option bytes failed");
      }
      await this.w(0x24, 1 << 30);                             // clear OPTCHANGEERR
      await this.w(0x20, ((await this.r(0x20)) & ~0xFF00) | (rdp << 8));
      await this.w(0x18, (await this.r(0x18)) | 0x02);         // OPTSTART
      const cur = await this.t.wait(this.base + 0x1C, 0x01, 0, 300.0);
      await this.w(0x18, (await this.r(0x18)) | 0x01);         // OPTLOCK
      if (cur & (1 << 30)) throw new Error("Option byte change error");
      await ignoreLink(this.t.write32(AIRCR, 0x05FA0004));
    }
    unlock() { return this._setRdp(0xAA); }
    lock() { return this._setRdp(0xBB); }
  }

  /* ---------- STM32H5 ---------- */

  class STM32H5Flash extends FlashDriver {
    constructor(t) {
      super(t);
      this.unit = 16;
      this.iwdgFreeze = [0x44024008, 1 << 12];
      this.base = 0x40022000;
    }
    async _wait(timeout = 10.0) {
      const sr = await this.t.wait(this.base + 0x20, 0x0B, 0, timeout);
      if (sr & 0x00FC0000) { await this.w(0x30, 0x00FF0000); throw new Error(`Flash error (SR ${h8(sr)})`); }
    }
    _unlock() { return this._unlockKeys(0x28, 0x01, 0x04); }
    async erase() {
      await this._unlock();
      await this._wait();
      await this.w(0x30, 0x00FF0000);
      await this.w(0x28, 1 << 15);                             // MER
      await this.w(0x28, (1 << 15) | (1 << 5));                // MER | START
      await this._wait(120.0);
      await this.w(0x28, 0x01);
    }
    async prepare() {
      await this._unlock();
      await this._wait();
      await this.w(0x30, 0x00FF0000);
      await this.w(0x28, 0x02);                                // PG
    }
    loaderParams() { return { unit: 16, sr: this.base + 0x20, busy: 0x0B, err: 0x00FC0000 }; }
    async finish() { await this.w(0x28, 0x01); }
  }

  /* ---------- PUYA PY32 ---------- */

  const PY32_VARIANTS = {
    //       timing params, stride, word step, IWDG_SW, NRST_MODE, nBOOT1, RDP
    f0xx: [0x1FFF0F1C, 0x14, 4, 12, 14, 15, true],
    f07x: [0x1FFF3238, 0x28, 8, 11, 13, 14, true],
    f002b: [0x1FFF011C, 0x00, 4, 12, 14, null, false],
  };

  class PY32Flash extends FlashDriver {
    constructor(t, variant) {
      super(t);
      this.unit = 128;
      this.base = 0x40022000;
      this.variant = variant;
      [this.tbase, this.tstride, this.tstep, this.iwdgBit, this.nrstBit, this.nboot1Bit, this.rdp] = PY32_VARIANTS[variant];
      this.iwdgFreeze = [0x40015808, 1 << 12];
    }
    _kick() { return this.t.write32(0x40003000, 0xAAAA); }     // reload IWDG
    async _wait(timeout = 10.0) {
      const sr = await this.t.wait(this.base + 0x10, 1 << 16, 0, timeout, () => this._kick());
      if (sr & 0x10) { await this.w(0x10, 0x11); throw new Error("Flash write protection error"); }
    }
    async _setup() {
      await this._unlockKeys(0x14, 1 << 31, 0x08);
      // Flash timing according to the current HSI frequency (from the factory configuration)
      let hsi = ((await this.t.read32(0x40021004)) >>> 13) & 0x07;
      const e = [];
      let ts;
      if (this.variant === "f002b") {
        const addr = hsi === 5 ? 0x1FFF0130 : 0x1FFF011C;
        for (let i = 0; i < 5; i++) e.push(await this.t.read32(addr + 4 * i));
        ts = [[0x100, e[0] & 0x1FF], [0x104, (e[0] >>> 18) & 0x3FF], [0x110, (e[0] >>> 9) & 0x1FF],
          [0x108, e[1] & 0x1FF], [0x10C, (e[1] >>> 16) & 0xFFF], [0x114, e[2] & 0x3FFFF],
          [0x118, e[3] & 0x3FFFF], [0x11C, e[4] & 0xFFFF], [0x120, (e[4] >>> 16) & 0x3FFF]];
      } else {
        if (hsi > 4) hsi = 0;
        const addr = this.tbase + hsi * this.tstride;
        for (let i = 0; i < 5; i++) e.push(await this.t.read32(addr + this.tstep * i));
        ts = [[0x100, e[0] & 0xFF], [0x104, (e[0] >>> 16) & 0x1FF], [0x110, (e[0] >>> 8) & 0xFF],
          [0x108, e[1] & 0xFF], [0x10C, (e[1] >>> 16) & 0x7FF], [0x114, e[2] & 0x1FFFF],
          [0x118, e[3] & 0x1FFFF], [0x11C, e[4] & 0xFFFF], [0x120, (e[4] >>> 16) & 0x3FFF]];
      }
      for (const [reg, value] of ts) await this.w(reg, value);
      // Configure the hardware watchdog for a long timeout
      if (!(((await this.r(0x20)) >>> this.iwdgBit) & 1)) {
        await this.t.write32(0x40003000, 0x5555);
        await this.t.write32(0x40003004, 0x06);
        await this.t.write32(0x40003008, 0xFFF);
        await this._kick();
      }
      await this._wait();
      await this.w(0x10, 0x11);                                // clear EOP, WRPERR
    }
    async isLocked() { return this.rdp && ((await this.r(0x20)) & 0xFF) !== 0xAA; }
    async erase() {
      await this._setup();
      await this.w(0x14, (1 << 2) | (1 << 24));                // MER | EOPIE
      await this.t.write32(0x08000000, 0xFFFFFFFF);
      await this._wait(60.0);
      await this.w(0x14, 1 << 31);
    }
    async prepare() {
      await this._setup();
      await this.w(0x14, 0);
    }
    loaderParams() {
      return { unit: 128, sr: this.base + 0x10, busy: 1 << 16, err: 0x10, cr: this.base + 0x14, trig: 1 << 19, pos: 124, flags: 2,
        set: (1 << 0) | (1 << 24), kick: 0x40003000, kickval: 0xAAAA };
    }
    async finish() { await this.w(0x14, 1 << 31); }
    async _setOptr(fn) {
      await this._setup();
      if ((await this.r(0x14)) & (1 << 30)) {
        await this.w(0x0C, 0x08192A3B);
        await this.w(0x0C, 0x4C5D6E7F);
      }
      const optr = await this.r(0x20), sdkr = await this.r(0x24), wrpr = await this.r(0x2C);
      const btcr = this.variant === "f002b" ? await this.r(0x28) : null;
      await this.w(0x20, fn(optr) & 0xFFFF);
      await this.w(0x24, sdkr & 0xFFFF);
      await this.w(0x2C, wrpr & 0xFFFF);
      if (btcr !== null) await this.w(0x28, btcr & 0xFFFF);
      await this.w(0x14, (await this.r(0x14)) | (1 << 17) | (1 << 24));     // OPTSTRT | EOPIE
      await this.t.write32(0x40022080, 0xFF);
      await this._wait(120.0);
      await this.w(0x14, (await this.r(0x14)) & ~((1 << 17) | (1 << 24)));
      try {
        await this.w(0x14, (await this.r(0x14)) | (1 << 27));  // OBL_LAUNCH
      } catch (e) { if (!isLink(e)) throw e; }
    }
    unlock() { return this._setOptr((v) => (v & ~0xFF) | 0xAA); }
    async lock() {
      if (!this.rdp) return super.lock();
      return this._setOptr((v) => (v & ~0xFF) | 0x55);
    }
    async bootpin() {
      if (this.nboot1Bit === null) return super.bootpin();
      return this._setOptr((v) => v | (1 << this.nboot1Bit));
    }
    nrst(gpio) { return this._setOptr((v) => (v & ~(1 << this.nrstBit)) | ((gpio ? 1 : 0) << this.nrstBit)); }
  }

  /* ---------- Microchip/ATMEL SAMD ---------- */

  const SAMD_DSU = 0x41002000, SAMD_NVMCTRL = 0x41004000;

  class SAMDFlash extends FlashDriver {
    constructor(t, d5x) {
      super(t);
      this.base = SAMD_NVMCTRL;
      this.d5x = d5x;
      this.unit = 64;
      this.size = 0;
    }
    static async create(t, d5x) {
      const d = new SAMDFlash(t, d5x);
      const param = await d.r(0x08);
      d.unit = 8 << ((param >>> 16) & 0x07);                   // page size
      d.size = (param & 0xFFFF) * d.unit;
      return d;
    }
    async isLocked() {
      const status = await this.t.tryRead32(SAMD_DSU + 0x100);
      if (status === null) return true;
      return !!((status >>> 16) & 0x01);                       // STATUSB.PROT
    }
    async _cmd(cmd) {
      const p = this.t.probe;
      if (this.d5x) {
        await p.write16(this.base + 0x10, 0xFFFF);
        await this.w(0x04, 0xA500 | cmd);
        await this.t.wait(this.base + 0x10, 1 << 16, 1 << 16, 2.0);       // STATUS.READY
        const flags = await p.read16(this.base + 0x10);
        if (flags & 0x4E) throw new Error(`NVM controller error (INTFLAG 0x${flags.toString(16).padStart(4, "0")})`);
      } else {
        await this.w(0x18, 0x1C);
        await this.w(0x14, 0x02);
        await this.w(0x00, 0xA500 | cmd);
        const flags = await this.t.wait(this.base + 0x14, 0x01, 0x01, 2.0); // INTFLAG.READY
        if (flags & 0x02) throw new Error(`NVM controller error (STATUS 0x${((await this.r(0x18)) & 0xFFFF).toString(16).padStart(4, "0")})`);
      }
    }
    async _bootprot() {
      const user = await this.t.read32(0x00804000);
      if (this.d5x) return (15 - ((user >>> 26) & 0x0F)) * 8192;
      const v = user & 0x07;
      return v === 7 ? 0 : 256 << (7 - v);
    }
    async checkImage(data) {
      if (this.t.locked) return;
      const bp = await this._bootprot();
      this.skip = bp;                                          // not written and not verified (bootloader)
      if (bp && !allFF(data, 0, bp)) throw new Error(`The first ${bp} bytes of the flash are protected by the BOOTPROT fuse (bootloader)`);
    }
    async erase() {
      const p = this.t.probe;
      try {                                                    // disable DSU write protection
        if (this.d5x) await this.t.write32(0x40000000, (1 << 16) | (1 << 5) | (1 << 1));
        else await this.t.write32(0x41000000, 1 << 1);
      } catch (e) {
        if (!isLink(e)) throw e;
        if (p.clearErrors) await p.clearErrors();
      }
      await p.write8(SAMD_DSU + 0x101, 0x1F);                  // clear STATUSA
      await p.write8(SAMD_DSU + 0x100, 0x10);                  // CTRL.CE (chip erase)
      const start = now();
      while (!((await p.read8(SAMD_DSU + 0x101)) & 0x01)) {    // STATUSA.DONE
        if (now() - start > 5.0) throw new Error("Chip erase timeout");
        await sleep(10);
      }
      if ((await p.read8(SAMD_DSU + 0x101)) & 0x08) throw new Error("Chip erase failed");
      await this.t.reconnectAfterReset();
    }
    async prepare() {
      const p = this.t.probe;
      if (this.d5x) {
        await p.write16(this.base, (await p.read16(this.base)) & ~0x30);  // WMODE = MAN
        const regions = 32, lock = await this.r(0x18);
        for (let i = 0; i < regions; i++) {
          if (!((lock >>> i) & 1)) {
            await this.w(0x14, i * Math.floor(this.size / regions));
            await this._cmd(0x12);                             // UR
          }
        }
        await this._cmd(0x15);                                 // PBC
      } else {
        await this.w(0x04, (await this.r(0x04)) | 0x80);       // CTRLB.MANW
        const regions = 16, lock = (await this.r(0x20)) & 0xFFFF;
        for (let i = 0; i < regions; i++) {
          if (!((lock >> i) & 1)) {
            await this.w(0x1C, (i * Math.floor(this.size / regions)) >> 1);
            await this._cmd(0x41);                             // UR
          }
        }
        await this._cmd(0x44);                                 // PBC
      }
    }
    loaderParams() {
      if (this.d5x) return { unit: this.unit, sr: this.base + 0x10, busy: 1 << 16, xor: 1 << 16, err: 0x4E, cr: this.base + 0x04, trig: 0xA503, pos: this.unit };
      return { unit: this.unit, sr: this.base + 0x14, busy: 0x01, xor: 0x01, err: 0x02, cr: this.base, trig: 0xA504, pos: this.unit };
    }
    unlock() { return this.erase(); }
    async lock() {
      await this._cmd(this.d5x ? 0x16 : 0x45);                 // SSB
      await ignoreLink(this.t.write32(AIRCR, 0x05FA0004));
    }
  }

  /* ================================================================================
   * Chip definitions and detection
   * ================================================================================ */

  // DBGMCU_IDCODE addresses depending on CPU core
  const STM32_IDCODE_ADDR = {
    0xC20: [0x40015800], 0xC60: [0x40015800], 0xC23: [0xE0042000], 0xC24: [0xE0042000],
    0xC27: [0x5C001000, 0xE0042000], 0xD21: [0xE0044000, 0x44024000],
  };

  const _M0 = 0x40015800, _M4 = 0xE0042000, _M33 = 0xE0044000;
  const _L4 = { boot: "sw", fz: 0xE0042008 };
  const _G0 = { boot: "sel", nrst: "g0", fz: 0x40015808 };
  const _L5 = { l5: true, tz: true, dual: true, fz: 0xE0044008 };
  const _G4 = { boot: "sw", nrst: "g4", fz: 0xE0042008 };
  const _WB = { base: 0x58004000, boot: "sw" };

  // DEV_ID: [IDCODE address, name, driver, flash size register, max flash KB, min RAM KB, options, family]
  const STM32_DEVICES = {
    0x444: [_M0, "STM32F03x", "f1", 0x1FFFF7CC, 32, 4, {}, "F0"],
    0x445: [_M0, "STM32F04x/F070x6", "f1", 0x1FFFF7CC, 32, 6, {}, "F0"],
    0x440: [_M0, "STM32F05x/F030x8", "f1", 0x1FFFF7CC, 64, 8, {}, "F0"],
    0x448: [_M0, "STM32F07x/F070xB", "f1", 0x1FFFF7CC, 128, 16, {}, "F0"],
    0x442: [_M0, "STM32F09x/F030xC", "f1", 0x1FFFF7CC, 256, 32, {}, "F0"],
    0x412: [_M4, "STM32F10x (low density)", "f1", 0x1FFFF7E0, 32, 4, {}, "F1"],
    0x410: [_M4, "STM32F10x (medium density)", "f1", 0x1FFFF7E0, 128, 10, {}, "F1"],
    0x414: [_M4, "STM32F10x (high density)", "f1", 0x1FFFF7E0, 512, 32, {}, "F1"],
    0x430: [_M4, "STM32F10x (XL density)", "f1", 0x1FFFF7E0, 1024, 64, {}, "F1"],
    0x418: [_M4, "STM32F105/F107", "f1", 0x1FFFF7E0, 256, 64, {}, "F1"],
    0x420: [_M4, "STM32F100 (low/medium density)", "f1", 0x1FFFF7E0, 128, 4, {}, "F1"],
    0x428: [_M4, "STM32F100 (high density)", "f1", 0x1FFFF7E0, 512, 24, {}, "F1"],
    0x422: [_M4, "STM32F302xB/C/F303xB/C/F358", "f1", 0x1FFFF7CC, 256, 32, {}, "F3"],
    0x446: [_M4, "STM32F302xD/E/F303xD/E/F398", "f1", 0x1FFFF7CC, 512, 64, {}, "F3"],
    0x432: [_M4, "STM32F37x", "f1", 0x1FFFF7CC, 256, 16, {}, "F3"],
    0x438: [_M4, "STM32F303x6/8/F334/F328", "f1", 0x1FFFF7CC, 64, 12, {}, "F3"],
    0x439: [_M4, "STM32F301/F302x6/8/F318", "f1", 0x1FFFF7CC, 64, 16, {}, "F3"],
    0x411: [_M4, "STM32F2xx", "f4", 0x1FFF7A22, 1024, 64, {}, "F2"],
    0x413: [_M4, "STM32F40x/F41x", "f4", 0x1FFF7A22, 1024, 128, {}, "F4"],
    0x419: [_M4, "STM32F42x/F43x", "f4", 0x1FFF7A22, 2048, 192, {}, "F4"],
    0x434: [_M4, "STM32F469/F479", "f4", 0x1FFF7A22, 2048, 320, {}, "F4"],
    0x423: [_M4, "STM32F401xB/C", "f4", 0x1FFF7A22, 256, 64, {}, "F4"],
    0x433: [_M4, "STM32F401xD/E", "f4", 0x1FFF7A22, 512, 96, {}, "F4"],
    0x431: [_M4, "STM32F411", "f4", 0x1FFF7A22, 512, 128, {}, "F4"],
    0x441: [_M4, "STM32F412", "f4", 0x1FFF7A22, 1024, 256, {}, "F4"],
    0x458: [_M4, "STM32F410", "f4", 0x1FFF7A22, 128, 32, {}, "F4"],
    0x421: [_M4, "STM32F446", "f4", 0x1FFF7A22, 512, 128, {}, "F4"],
    0x463: [_M4, "STM32F413/F423", "f4", 0x1FFF7A22, 1536, 320, {}, "F4"],
    0x449: [_M4, "STM32F74x/F75x", "f4", 0x1FF0F442, 1024, 320, {}, "F7"],
    0x451: [_M4, "STM32F76x/F77x", "f4", 0x1FF0F442, 2048, 512, {}, "F7"],
    0x452: [_M4, "STM32F72x/F73x", "f4", 0x1FF07A22, 512, 256, {}, "F7"],
    0x457: [_M0, "STM32L01x/L02x", "l0", 0x1FF8007C, 16, 2, {}, "L0"],
    0x425: [_M0, "STM32L031/L041", "l0", 0x1FF8007C, 32, 8, {}, "L0"],
    0x417: [_M0, "STM32L05x/L06x", "l0", 0x1FF8007C, 64, 8, {}, "L0"],
    0x447: [_M0, "STM32L07x/L08x", "l0", 0x1FF8007C, 192, 20, {}, "L0"],
    0x416: [_M4, "STM32L1xx (Cat.1)", "l0", 0x1FF8004C, 128, 10, {}, "L1"],
    0x429: [_M4, "STM32L1xx (Cat.2)", "l0", 0x1FF8004C, 128, 16, {}, "L1"],
    0x427: [_M4, "STM32L1xx (Cat.3)", "l0", 0x1FF800CC, 256, 32, {}, "L1"],
    0x436: [_M4, "STM32L1xx (Cat.4)", "l0", 0x1FF800CC, 384, 48, {}, "L1"],
    0x437: [_M4, "STM32L1xx (Cat.5/6)", "l0", 0x1FF800CC, 512, 80, {}, "L1"],
    0x443: [_M0, "STM32C01x", "l4", 0x1FFF75A0, 32, 6, _G0, "C0"],
    0x453: [_M0, "STM32C03x", "l4", 0x1FFF75A0, 32, 12, _G0, "C0"],
    0x44C: [_M0, "STM32C05x", "l4", 0x1FFF75A0, 64, 12, _G0, "C0"],
    0x493: [_M0, "STM32C071", "l4", 0x1FFF75A0, 128, 24, _G0, "C0"],
    0x44D: [_M0, "STM32C09x", "l4", 0x1FFF75A0, 256, 36, _G0, "C0"],
    0x466: [_M0, "STM32G03x/G04x", "l4", 0x1FFF75E0, 64, 8, _G0, "G0"],
    0x456: [_M0, "STM32G05x/G06x", "l4", 0x1FFF75E0, 64, 18, _G0, "G0"],
    0x460: [_M0, "STM32G07x/G08x", "l4", 0x1FFF75E0, 128, 36, _G0, "G0"],
    0x467: [_M0, "STM32G0Bx/G0Cx", "l4", 0x1FFF75E0, 512, 144, { ..._G0, dual: true }, "G0"],
    0x459: [_M0, "STM32U031", "l4", 0x1FFF3EA0, 64, 12, _G0, "U0"],
    0x489: [_M0, "STM32U073/U083", "l4", 0x1FFF6EA0, 256, 40, _G0, "U0"],
    0x468: [_M4, "STM32G43x/G44x", "l4", 0x1FFF75E0, 128, 32, _G4, "G4"],
    0x469: [_M4, "STM32G47x/G48x", "l4", 0x1FFF75E0, 512, 128, { ..._G4, dual: true }, "G4"],
    0x479: [_M4, "STM32G49x/G4Ax", "l4", 0x1FFF75E0, 512, 112, _G4, "G4"],
    0x415: [_M4, "STM32L47x/L48x", "l4", 0x1FFF75E0, 1024, 96, { ..._L4, dual: true }, "L4"],
    0x435: [_M4, "STM32L43x/L44x", "l4", 0x1FFF75E0, 256, 48, _L4, "L4"],
    0x461: [_M4, "STM32L49x/L4Ax", "l4", 0x1FFF75E0, 1024, 256, { ..._L4, dual: true }, "L4"],
    0x462: [_M4, "STM32L45x/L46x", "l4", 0x1FFF75E0, 512, 128, _L4, "L4"],
    0x464: [_M4, "STM32L41x/L42x", "l4", 0x1FFF75E0, 128, 40, _L4, "L4"],
    0x470: [_M4, "STM32L4Rx/L4Sx", "l4", 0x1FFF75E0, 2048, 192, { ..._L4, dual: true }, "L4+"],
    0x471: [_M4, "STM32L4Px/L4Qx", "l4", 0x1FFF75E0, 1024, 192, { ..._L4, dual: true }, "L4+"],
    0x494: [_M4, "STM32WB1x", "l4", 0x1FFF75E0, 320, 12, _WB, "WB"],
    0x495: [_M4, "STM32WB5x", "l4", 0x1FFF75E0, 1024, 192, _WB, "WB"],
    0x496: [_M4, "STM32WB3x", "l4", 0x1FFF75E0, 512, 96, _WB, "WB"],
    0x497: [_M4, "STM32WLE/WL5x", "l4", 0x1FFF75E0, 256, 32, _WB, "WL"],
    0x472: [_M33, "STM32L55x/L56x", "l4", 0x0BFA05E0, 512, 192, { ..._L5, boot: "sw5" }, "L5"],
    0x455: [_M33, "STM32U535/U545", "l4", 0x0BFA07A0, 512, 192, { ..._L5, quad: true, boot: "sw5" }, "U5"],
    0x482: [_M33, "STM32U57x/U58x", "l4", 0x0BFA07A0, 2048, 192, { ..._L5, quad: true, boot: "sw5" }, "U5"],
    0x481: [_M33, "STM32U59x/U5Ax", "l4", 0x0BFA07A0, 4096, 192, { ..._L5, quad: true, boot: "sw5" }, "U5"],
    0x476: [_M33, "STM32U5Fx/U5Gx", "l4", 0x0BFA07A0, 4096, 192, { ..._L5, quad: true, boot: "sw5" }, "U5"],
    0x454: [_M33, "STM32U37x/U38x", "l4", 0x0BFA07A0, 1024, 64, _L5, "U3"],
    0x42A: [_M33, "STM32U3Bx/U3Cx", "l4", 0x0BFA07A0, 2048, 64, _L5, "U3"],
    0x492: [_M33, "STM32WBA5x", "l4", 0x0BF907A0, 1024, 64, { ..._L5, quad: true, dual: false }, "WBA"],
    0x4B0: [_M33, "STM32WBA6x", "l4", 0x0BFA07A0, 2048, 64, { ..._L5, quad: true }, "WBA"],
    0x4B2: [_M33, "STM32WBA2x", "l4", 0x0BF8D7A0, 512, 32, { ..._L5, dual: false }, "WBA"],
    0x474: [0x44024000, "STM32H503", "h5", 0x08FFF80C, 128, 32, {}, "H5"],
    0x478: [0x44024000, "STM32H52x/H53x", "h5", 0x08FFF80C, 512, 128, {}, "H5"],
    0x484: [0x44024000, "STM32H56x/H57x", "h5", 0x08FFF80C, 2048, 256, {}, "H5"],
    0x450: [0x5C001000, "STM32H74x/H75x", "h7", 0x1FF1E880, 2048, 128, {}, "H7"],
    0x480: [0x5C001000, "STM32H7Ax/H7Bx", "h7", 0x08FFF80C, 2048, 128, {}, "H7"],
    0x483: [0x5C001000, "STM32H72x/H73x", "h7", 0x1FF1E880, 1024, 128, {}, "H7"],
  };

  async function stm32Chip(t, part, devid, dev) {
    const [, name, kind, fsizeAddr, maxkb, ramkb, opts] = dev;
    const v = await t.tryRead32((fsizeAddr & ~3) >>> 0);
    let kb = v === null ? 0 : (v >>> (8 * (fsizeAddr & 2))) & 0xFFFF;
    if (devid === 0x436) kb = kb === 1 ? 256 : 384;           // L1 Cat.4: 0 = 384 KB, 1 = 256 KB
    if (kb === 0 || kb === 0xFFFF || kb > maxkb) kb = maxkb;
    const size = kb * 1024, base = 0x08000000;
    let regions = null, bootpin = "fixed", nrst = false, lock = true, drv;
    if (kind === "f1") {
      drv = new STM32F1Flash(t, part, devid, size);
      if (devid === 0x430 && size > 0x80000) regions = [[base, 0x80000, 0], [base + 0x80000, size - 0x80000, 1]];
      if (part !== 0xC23) bootpin = "option";
    } else if (kind === "f4") {
      drv = await STM32F4Flash.create(t, part, devid, size);
    } else if (kind === "l0") {
      drv = new STM32L0Flash(t, part, devid, size);
    } else if (kind === "l4") {
      drv = await STM32L4Flash.create(t, part, devid, size, opts);
      bootpin = opts.boot ? "option" : null;
      nrst = !!opts.nrst;
    } else if (kind === "h7") {
      drv = new STM32H7Flash(t, part, devid);
      if ((devid === 0x450 || devid === 0x480) && size >= 0x100000) { const half = size / 2; regions = [[base, half, 0], [base + 0x100000, half, 1]]; }
    } else {
      drv = new STM32H5Flash(t);
      lock = false;
    }
    return new Chip(name, drv, base, size, 0x20000000, ramkb * 1024, { regions, bootpin, nrst, lock });
  }

  const bad = (v) => v === null || v === 0 || v === 0xFFFFFFFF;

  async function py32Chip(t, idcode) {
    if (idcode === null) return null;
    if (idcode === 0x06188061) {
      const v = await t.tryRead32(0x1FFF31FC);
      if (v === null) return null;
      const flash = ((v & 7) + 1) << 14;                      // 16 KB units (max. 128 KB)
      return new Chip("PY32F07x", new PY32Flash(t, "f07x"), 0x08000000, flash, 0x20000000, 0x2000, { bootpin: "option", nrst: true });
    }
    if ((idcode & 0xFFF) !== 0 || idcode === 0 || idcode === 0xFFFFFFFF) return null;
    const v = await t.tryRead32(0x1FFF0FFC);
    let tm = await t.tryRead32(0x1FFF0F1C);
    if (!bad(v) && !bad(tm)) {
      const flash = ((v & 7) + 1) << 13, ram = (((v >>> 4) & 3) + 1) << 11;
      return new Chip("PY32F002A/F003/F030", new PY32Flash(t, "f0xx"), 0x08000000, flash, 0x20000000, ram, { bootpin: "option", nrst: true });
    }
    tm = await t.tryRead32(0x1FFF011C);
    if (!bad(tm)) return new Chip("PY32F002B", new PY32Flash(t, "f002b"), 0x08000000, 0x6000, 0x20000000, 0xC00, { bootpin: null, nrst: true, lock: false });
    return null;
  }

  const SAMD_FAMILIES = {   // "processor,family,series": name
    "1,0,0": "ATSAMD20", "1,0,1": "ATSAMD21", "1,0,2": "ATSAMD10", "1,0,3": "ATSAMD11",
    "1,0,4": "ATSAMD09", "1,1,1": "ATSAML21", "1,1,2": "ATSAML22", "1,2,0": "ATSAMC20",
    "1,2,1": "ATSAMC21", "6,0,6": "ATSAMD51", "6,3,1": "ATSAME51", "6,3,3": "ATSAME53",
    "6,3,4": "ATSAME54",
  };

  async function samdChip(t, did) {
    if (did === null || did === undefined) return null;
    const key = [did >>> 28, (did >>> 23) & 0x1F, (did >>> 16) & 0x3F];
    const name = SAMD_FAMILIES[key.join(",")];
    if (!name) return null;
    const d5x = key[0] === 6;
    const drv = t.halted ? await SAMDFlash.create(t, d5x) : new SAMDFlash(t, d5x);    // locked: size unknown
    return new Chip(name, drv, 0x00000000, drv.size, 0x20000000, d5x ? 0x10000 : 0x1000, { bootpin: null });
  }

  /* ================================================================================
   * Generic flash loader (Thumb code, Cortex-M0 compatible, see loader.S of tinyOCD)
   * ================================================================================ */

  const LOADER_CODE = [
    0x6801, 0x6842, 0x6883, 0x2B00, 0xD03A, 0x6B45, 0x2D00, 0xD003, 0x6A46, 0x6837,
    0x432F, 0x6037, 0x2400, 0x6AC5, 0x42AC, 0xD101, 0xF000, 0xF833, 0x68C5, 0x42AC,
    0xD20A, 0x6B05, 0x086D, 0xD203, 0x590D, 0x5115, 0x3404, 0xE7F0, 0x5B0D, 0x5315,
    0x3402, 0xE7EC, 0xF3BF, 0x8F4F, 0x6B86, 0x2E00, 0xD001, 0x6BC7, 0x6037, 0x6946,
    0x6836, 0x69C7, 0x407E, 0x6987, 0x423E, 0xD1F3, 0x6946, 0x6836, 0x6A07, 0x423E,
    0xD10E, 0x6B45, 0x2D00, 0xD003, 0x6A46, 0x6837, 0x43AF, 0x6037, 0x68C5, 0x1949,
    0x6905, 0x1952, 0x3B01, 0xE7C2, 0x2000, 0xBE00, 0x6402, 0x0030, 0xBE00, 0x6A46,
    0x6A87, 0x6B05, 0x08AD, 0xD301, 0x6835, 0x432F, 0x6037, 0x4770,
  ];

  /* ================================================================================
   * One session (as the main function of tinyocd.py)
   * ================================================================================ */

  // a: { speed, unlock, lock, erase, bootpin, bootpinSoft, gpio, reset, flash: Uint8Array, read }
  // log(text, cls), progress(phase, fraction)
  async function runSession(probe, a, log, progress) {
    log = log || (() => {});
    const ocd = new Target(probe, a.speed || 1000, (t) => log(t));
    try {
      await ocd.connect();
      const c = ocd.chip;
      log(c.flashSize ? `Connected to ${c.name} (${ocd.cpu || "Cortex-M"}) with ${c.flashSize / 1024} KB of flash.` : `Connected to ${c.name}.`, "ok");
      if (ocd.underReset) log("The chip was connected under reset (NRST).");
      if (ocd.locked) log("The chip is read protected (locked).");

      // Check option support before doing anything
      let bootpin = a.bootpin;
      if (bootpin && !c.hasBootpin) {
        if (!a.bootpinSoft) throw new Error("BOOT0 pin configuration is not supported on this chip");
        bootpin = false;
      }
      if ((a.gpio || a.reset) && !c.hasNrst) throw new Error("NRST pin configuration is not supported on this chip");
      if (a.lock && !c.hasLock) throw new Error("Read protection is not supported on this chip");
      const data = a.flash || null;
      if (ocd.locked && !a.unlock && (a.erase || data || bootpin || a.gpio || a.reset || a.read)) {
        throw new Error("The chip is locked. Unlock it first (this erases the chip)");
      }
      if (data && !ocd.locked) await ocd.checkImage(data);

      if (a.unlock && (ocd.locked || !a.unlockQuiet)) {
        if (ocd.locked) log("Unlocking the chip …");
        if (await ocd.unlock()) log("The chip is unlocked (and erased).", "ok");
        if (data) await ocd.checkImage(data);
      }

      if (a.erase || data) {
        log("Erasing the whole chip …");
        await ocd.erase();
        if (!data) log("The chip is erased.", "ok");
      }

      if (data) {
        log(`Writing ${data.length.toLocaleString("en")} bytes …`);
        await ocd.flashData(data, progress ? (f) => progress("write", f) : null);
        log("Verifying …");
        await ocd.verifyData(data, progress ? (f) => progress("verify", f) : null);
        log(`${data.length.toLocaleString("en")} bytes written and verified.`, "ok");
      }

      if (a.read) {
        log(`Reading ${c.flashSize / 1024} KB of flash …`);
        ocd.dump = await ocd.readRegions(c.flashSpan, progress ? (f) => progress("read", f) : null);
      }

      if (a.bootpin && !bootpin) log("This chip has no BOOT0 option; nothing to do.");
      if (bootpin) {
        log("Making the BOOT0 pin usable for the embedded bootloader …");
        if (await ocd.setBootpin()) log("The BOOT0 pin is now usable.", "ok");
      }
      if (a.gpio) {
        log("Configuring the NRST pin as GPIO pin …");
        await ocd.setNrst(true);
        log("NRST is now a GPIO pin.", "ok");
      }
      if (a.reset) {
        log("Configuring the NRST pin as reset pin …");
        await ocd.setNrst(false);
        log("NRST is now a reset pin.", "ok");
      }
      if (a.lock) {
        log("Locking the chip …");
        await ocd.lock();
        log("The chip is locked.", "ok");
      }
      await ocd.exit();
    } catch (err) {
      try { await ocd.exit(false); } catch (e) { /* ignore */ }
      err.target = ocd;
      throw err;
    }
    return ocd;
  }

  // Supported chips for the list in the app
  function chipList() {
    const rows = [];
    for (const [id, d] of Object.entries(STM32_DEVICES)) {
      rows.push({ family: d[7], name: d[1], id: "0x" + Number(id).toString(16).toUpperCase().padStart(3, "0"), flash: d[4], ram: d[5],
        bootpin: d[2] === "f1" ? (d[7] === "F1" ? "fixed" : "option") : d[2] === "l4" ? (d[6].boot ? "option" : null) : "fixed",
        nrst: !!d[6].nrst, lock: d[2] !== "h5" });
    }
    rows.sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));
    rows.push({ family: "PY32", name: "PY32F002A/F003/F030", id: "", flash: 64, bootpin: "option", nrst: true, lock: true });
    rows.push({ family: "PY32", name: "PY32F002B", id: "", flash: 24, bootpin: null, nrst: true, lock: false });
    rows.push({ family: "PY32", name: "PY32F071/F072", id: "0x06188061", flash: 128, bootpin: "option", nrst: true, lock: true });
    const sam = [...new Set(Object.values(SAMD_FAMILIES))];
    for (const n of sam) rows.push({ family: "SAM", name: n, id: "", flash: /D5|E5/.test(n) ? 1024 : 256, bootpin: null, nrst: false, lock: true });
    return rows;
  }

  const api = {
    TIMEOUTS, ProbeError, TransferFault, UsbError, UsbDev, CMSISDAP, DapBulk, DapHid, JLink, STLink, Target, Chip,
    openUsbProbe, openHidProbe, usbKind, runSession, chipList,
    USB_FILTERS, HID_FILTERS, STLINK_VID, STLINK_PIDS, JLINK_VID, DAP_VIDS, STM32_DEVICES, SAMD_FAMILIES, LOADER_CODE,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.SWDPROG = api;
})(typeof window !== "undefined" ? window : globalThis);
