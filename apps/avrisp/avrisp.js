/* ===================================================================
 * ISP programmer for classic AVR microcontrollers (WebUSB)
 * -------------------------------------------------------------------
 * JavaScript port of the parts of avrdude 8.3 (https://github.com/
 * avrdudes/avrdude, GPL-2.0-or-later) that program flash and fuses of
 * classic AVRs through a USBasp (usbasp.c) or a USBtinyISP
 * (usbtiny.c): initialization, signature, chip erase, paged flash
 * write with verify, and byte writes of fuses and lock bits as in
 * avr.c, update.c and main.c. The USB traffic follows avrdude.
 * Licensed under the GNU General Public License v2.0 or later.
 * Global: AVRISP
 * =================================================================== */
(function (global) {
  "use strict";

  const DB = global.AVR_PARTS;
  const sleep = (us) => new Promise((r) => setTimeout(r, Math.ceil(us / 1000)));
  const hex = (v, n) => "0x" + v.toString(16).padStart(n || 2, "0");
  class IspError extends Error {}

  const PROGRAMMERS = {
    usbasp: { name: "USBasp", filters: [{ vendorId: 0x16c0, productId: 0x05dc }, { vendorId: 0x03eb, productId: 0xc7b4 }] },
    usbtiny: { name: "USBtinyISP", filters: [{ vendorId: 0x1781, productId: 0x0c9f }] },
  };
  const ALL_FILTERS = [...PROGRAMMERS.usbasp.filters, ...PROGRAMMERS.usbtiny.filters];
  const kindOf = (dev) => (dev.vendorId === 0x1781 ? "usbtiny" : "usbasp");

  /* ---------- SPI instruction patterns (avrpart.c) ---------- */

  // Bits of an op: [position, type, bit number]; type 0/1 fixed, a/i/o/x
  const opCache = new Map();
  function op(i, isExt) {
    if (i === undefined || i === null) return null;
    const key = i + (isExt ? "e" : "");
    if (!opCache.has(key)) {
      const s = DB.ops[i], bits = [];
      for (let k = 0; k < 32; k++) {
        const pos = 31 - k, c = s[k];
        bits.push([pos, c, c === "a" ? (pos < 8 || pos > 23 ? 0 : isExt ? pos + 8 : pos - 8) : pos % 8]);
      }
      opCache.set(key, bits);
    }
    return opCache.get(key);
  }
  function setBit(cmd, pos, v) { const j = 3 - (pos >> 3), m = 1 << (pos & 7); if (v) cmd[j] |= m; else cmd[j] &= ~m; }
  function setBits(o, cmd) { for (const [pos, c] of o) if (c === "0" || c === "1" || c === "x") setBit(cmd, pos, c === "1"); }
  function setAddr(o, cmd, addr) { for (const [pos, c, n] of o) if (c === "a") setBit(cmd, pos, (addr / 2 ** n) & 1); }
  function setInput(o, cmd, d) { for (const [pos, c, n] of o) if (c === "i") setBit(cmd, pos, (d >> n) & 1); }
  function getOutput(o, res) {
    let d = 0;
    for (const [pos, c, n] of o) if (c === "o" && ((res[3 - (pos >> 3)] >> (pos & 7)) & 1)) d |= 1 << n;
    return d;
  }
  function command(o, addr, data) {
    const cmd = new Uint8Array(4);
    setBits(o, cmd);
    if (addr !== undefined) setAddr(o, cmd, addr);
    if (data !== undefined) setInput(o, cmd, data);
    return cmd;
  }

  /* ---------- Parts ---------- */

  // A part with its memories in the form the algorithms below use
  function part(id) {
    const p = DB.parts.find((x) => x.id === id);
    if (!p) return null;
    const f = p.flash;
    const flash = {
      name: "flash", size: f.size, pageSize: f.ps, paged: true, maxWriteDelay: f.wd,
      readLo: op(f.rl), readHi: op(f.rh), loadLo: op(f.ll), loadHi: op(f.lh), writePage: op(f.wp), ext: op(f.ext, true),
    };
    const fuses = p.fuses.map((x) => ({
      name: x.n, size: 1, pageSize: 1, paged: false, read: op(x.r), write: op(x.w), maxWriteDelay: x.wd,
      initval: x.init, bitmask: x.mask, readback: x.rb || [0, 0], pwroff: !!x.pwroff,
    }));
    return {
      id: p.id, name: p.name, sig: p.sig, chipEraseDelay: p.ced, pgmEnable: op(p.pe), chipErase: op(p.ce),
      flash, fuses, signature: { name: "signature", size: 3, read: op(p.sigr) },
      calibration: p.cal ? { name: "calibration", size: p.cal[0], read: op(p.cal[1]) } : null,
      at90s1200: !!p.at90s1200,
    };
  }
  const partsBySignature = (sig) => DB.parts.filter((p) => p.sig[0] === sig[0] && p.sig[1] === sig[1] && p.sig[2] === sig[2]).map((p) => p.id);
  // Before the chip is known: program enable and signature read are the same for all parts
  const GENERIC = () => part("m328p");

  /* ---------- USB ---------- */

  function withTimeout(promise, ms) {
    let t;
    return Promise.race([promise.finally(() => clearTimeout(t)), new Promise((_, rej) => { t = setTimeout(() => rej(new IspError("USB transfer timed out")), ms); })]);
  }

  class Usb {
    constructor(device) { this.dev = device; }
    async open() {
      const d = this.dev;
      if (!d.opened) await d.open();
      if (!d.configuration) {
        try { await d.selectConfiguration(1); } catch (e) { throw new IspError("Failed to access the programmer. Check the permissions (Linux: udev rules) or the driver (Windows: WinUSB)."); }
      }
      try { await d.claimInterface(0); this.claimed = true; } catch (e) { /* control transfers to the device work without it on most systems */ }
    }
    // Vendor control transfer to the device; returns { n, data } like usb_control_msg
    async in(request, value, index, length, timeout) {
      try {
        const r = await withTimeout(this.dev.controlTransferIn({ requestType: "vendor", recipient: "device", request, value, index }, length), timeout || 5000);
        if (r.status !== "ok") return { n: -1, data: new Uint8Array(0) };
        const data = new Uint8Array(r.data.buffer, r.data.byteOffset, r.data.byteLength);
        return { n: data.length, data };
      } catch (e) {
        if (e instanceof IspError) throw e;
        return { n: -1, data: new Uint8Array(0), error: e };
      }
    }
    async out(request, value, index, data, timeout) {
      try {
        const r = await withTimeout(this.dev.controlTransferOut({ requestType: "vendor", recipient: "device", request, value, index }, data), timeout || 5000);
        return r.status === "ok" ? r.bytesWritten : -1;
      } catch (e) {
        if (e instanceof IspError) throw e;
        return -1;
      }
    }
    async close() {
      try { if (this.claimed) await this.dev.releaseInterface(0); } catch (e) { /* ignore */ }
      try { await this.dev.close(); } catch (e) { /* ignore */ }
    }
  }

  /* ---------- USBasp (usbasp.c, SPI only) ---------- */

  const ASP = { CONNECT: 1, DISCONNECT: 2, TRANSMIT: 3, READFLASH: 4, ENABLEPROG: 5, WRITEFLASH: 6, SETLONGADDRESS: 9, SETISPSCK: 10, GETCAPABILITIES: 127 };
  const ASP_SCK = [[13, 3000000], [12, 1500000], [11, 750000], [10, 375000], [9, 187500], [8, 93750], [7, 32000], [6, 16000], [5, 8000], [4, 4000], [3, 2000], [2, 1000], [1, 500]];
  const word = (b) => [(b[1] << 8) | b[0], (b[3] << 8) | b[2]];

  class UsbAsp {
    constructor(usb, opts) {
      this.usb = usb; this.name = "USBasp";
      this.sckHz = (opts && opts.sckHz) || 0;   // 0 = automatic (avrdude without -B)
      this.writeByteIsDefault = false;          // usbasp_write_byte() wraps avr_write_byte_default()
    }
    async transmit(receive, fn, send, len, data) {
      const [v, i] = word(send);
      if (receive) return this.usb.in(fn, v, i, len);
      return { n: await this.usb.out(fn, v, i, data) };
    }
    async initialize(p) {
      const caps = await this.transmit(1, ASP.GETCAPABILITIES, [0, 0, 0, 0], 4);
      this.capabilities = caps.n === 4 ? (caps.data[0] | (caps.data[1] << 8) | (caps.data[2] << 16) | (caps.data[3] << 24)) >>> 0 : 0;
      this.sck3MHz = !!(this.capabilities & (1 << 24));
      await this.setSck(this.sckHz);
      await this.transmit(1, ASP.CONNECT, [0, 0, 0, 0], 4);
      await sleep(100000);
      return this.programEnable(p);
    }
    async setSck(freq) {
      let option = 0;
      this.sckFreq = 0;
      if (freq) {
        let i = this.sck3MHz ? 0 : 1, use = 0;
        if (freq >= ASP_SCK[i][1]) { option = ASP_SCK[i][0]; use = ASP_SCK[i][1]; }
        else for (; i < ASP_SCK.length; i++) if (freq >= ASP_SCK[i][1] - 1) { option = ASP_SCK[i][0]; use = ASP_SCK[i][1]; break; }
        this.sckFreq = use;
      }
      const r = await this.transmit(1, ASP.SETISPSCK, [option, 0, 0, 0], 4);
      if (r.n !== 1 || r.data[0] !== 0) throw new IspError("Cannot set the SCK frequency; the USBasp may need a firmware update.");
    }
    async programEnable() {
      const r = await this.transmit(1, ASP.ENABLEPROG, [0, 0, 0, 0], 4);
      if (r.n !== 1 || r.data[0] !== 0) throw new IspError(`The target does not answer (program enable: ${hex(r.n === 1 ? r.data[0] : 0)}). Check the wiring and the power of the chip, or choose a slower SCK.`);
    }
    async cmd(c) {
      const r = await this.transmit(1, ASP.TRANSMIT, c, 4);
      if (r.n !== 4) throw new IspError("USBasp: wrong response size");
      return r.data;
    }
    async chipErase(p) {
      await this.transmit(1, ASP.TRANSMIT, command(p.chipErase), 4);   // answer not checked, as in avrdude
      await sleep(p.chipEraseDelay);
      await this.initialize(p);
    }
    async pagedLoad(p, m, addr, n) {
      const out = new Uint8Array(n);
      let block = this.sckFreq > 0 && this.sckFreq < 10000 ? 20 : 200, left = n, pos = 0;
      while (left) {
        if (left <= block) block = left;
        left -= block;
        await this.transmit(1, ASP.SETLONGADDRESS, [addr & 255, (addr >> 8) & 255, (addr >> 16) & 255, (addr >>> 24) & 255], 4);
        const r = await this.transmit(1, ASP.READFLASH, [addr & 255, (addr >> 8) & 255, 0, 0], block);
        if (r.n !== block) throw new IspError(`USBasp: wrong number of bytes read (${r.n})`);
        out.set(r.data, pos);
        pos += block; addr += block;
      }
      return out;
    }
    async pagedWrite(p, m, addr, data) {
      const ps = m.pageSize;
      let block = this.sckFreq > 0 && this.sckFreq < 10000 ? 20 : 200, left = data.length, pos = 0, flags = 1;
      while (left) {
        if (left <= block) block = left;
        left -= block;
        await this.transmit(1, ASP.SETLONGADDRESS, [addr & 255, (addr >> 8) & 255, (addr >> 16) & 255, (addr >>> 24) & 255], 4);
        const r = await this.transmit(0, ASP.WRITEFLASH, [addr & 255, (addr >> 8) & 255, ps & 255, (flags & 0x0f) + ((ps & 0xf00) >> 4)], 0, data.subarray(pos, pos + block));
        flags = 0;
        if (r.n !== block) throw new IspError(`USBasp: wrong number of bytes written (${r.n})`);
        pos += block; addr += block;
      }
    }
    async powerdown() { /* no powerdown for the USBasp */ }
    async close() {
      await this.transmit(1, ASP.DISCONNECT, [0, 0, 0, 0], 4);
      await this.usb.close();
    }
  }

  /* ---------- USBtinyISP (usbtiny.c, SPI only) ---------- */

  const TINY = { POWERUP: 5, POWERDOWN: 6, SPI: 7, POLL_BYTES: 8, FLASH_READ: 9, FLASH_WRITE: 10 };

  class UsbTiny {
    constructor(usb, opts) {
      this.usb = usb; this.name = "USBtinyISP";
      this.bitclock = (opts && opts.sckPeriod) || 0;   // SCK period in µs, 0 = default (10 µs)
      this.writeByteIsDefault = true;
      this.retries = 0;
    }
    async control(req, val, idx) {
      const r = await this.usb.in(req, val, idx, 0, 500);
      if (r.n < 0) throw new IspError("USBtinyISP: USB transfer failed");
    }
    async usbIn(req, val, idx, len, bitclk) {
      const timeout = 500 + (len * bitclk) / 1000;
      let r;
      for (let i = 0; i < 10; i++) {
        r = await this.usb.in(req, val, idx & 0xffff, len, timeout);   // libusb takes 16 bits
        if (r.n === len) return r.data;
        this.retries++;
      }
      throw new IspError(`USBtinyISP: USB transfer failed (expected ${len}, got ${r.n})`);
    }
    async usbOut(req, val, idx, data, bitclk) {
      const n = await this.usb.out(req, val, idx & 0xffff, data, 500 + (data.length * bitclk) / 1000);
      if (n !== data.length) throw new IspError(`USBtinyISP: USB transfer failed (expected ${data.length}, got ${n})`);
    }
    setChunkSize(period) {
      this.chunk = 128;
      while (this.chunk > 8 && period > 16) { this.chunk >>= 1; period >>= 1; }
    }
    async initialize(p) {
      if (this.bitclock > 0) {
        this.sck = Math.min(250, Math.max(1, Math.round(this.bitclock)));
      } else this.sck = 10;
      await this.control(TINY.POWERUP, this.sck, 0);
      this.setChunkSize(this.sck);
      await sleep(50000);
      for (let tries = 0; tries < 4; tries++) {
        if (await this.programEnable(p)) return;
        await this.control(TINY.POWERUP, this.sck, 1);
        await this.control(TINY.POWERUP, this.sck, 0);
        await sleep(50000);
      }
      throw new IspError("The target does not answer (program enable failed). Check the wiring and the power of the chip, or choose a slower SCK.");
    }
    async programEnable(p) {
      try { await this.cmd(command(p.pgmEnable)); return true; } catch (e) { if (e.sync) return false; throw e; }
    }
    // A 4-byte SPI instruction; the chip echoes byte 2 in byte 3 when in sync
    async cmd(c) {
      const res = await this.usbIn(TINY.SPI, (c[1] << 8) | c[0], (c[3] << 8) | c[2], 4, 8 * this.sck);
      this.retries = 0;
      if (res[2] !== c[1]) { const e = new IspError("The chip does not answer in sync (SPI echo mismatch)."); e.sync = true; throw e; }
      return res;
    }
    async chipErase(p) {
      await this.cmd(command(p.chipErase));
      await sleep(p.chipEraseDelay);
      await this.initialize(p);
    }
    async pagedLoad(p, m, addr, n) {
      if (m.ext) await this.cmd(command(m.ext, addr / 2));
      const out = new Uint8Array(n);
      if (addr >= 0x10000) {   // byte access above 64 KiB
        for (let i = 0; i < n; i++, addr++) {
          const o = addr & 1 ? m.readHi : m.readLo;
          out[i] = getOutput(o, await this.cmd(command(o, Math.floor(addr / 2))));
        }
        return out;
      }
      const max = addr + n;
      for (let pos = 0; addr < max; ) {
        const chunk = Math.min(this.chunk, max - addr);
        const d = await this.usbIn(TINY.FLASH_READ, 0, addr, chunk, 32 * this.sck);
        out.set(d, pos);
        pos += chunk; addr += chunk;
      }
      return out;
    }
    async pagedWrite(p, m, addr, data) {
      const max = addr + data.length;
      for (let pos = 0; addr < max; ) {
        let chunk = Math.min(this.chunk, max - addr);
        if (chunk > m.pageSize) chunk = m.pageSize;
        await this.usbOut(TINY.FLASH_WRITE, 0, addr, data.subarray(pos, pos + chunk), 32 * this.sck);
        const next = addr + chunk;
        if (next % m.pageSize === 0 || next === max) await writePage(this, p, m, addr);
        pos += chunk; addr = next;
      }
    }
    async powerdown() { await this.usb.in(TINY.POWERDOWN, 0, 0, 0, 500); }
    async close() { await this.usb.close(); }
  }

  /* ---------- Memory algorithms (avr.c) ---------- */

  // avr_write_page(): commit the page buffer
  async function writePage(pgm, p, m, addr) {
    addr = Math.floor(addr / 2);
    if (m.ext) await pgm.cmd(command(m.ext, addr));
    await pgm.cmd(command(m.writePage, addr));
    await sleep(m.maxWriteDelay);
  }

  // avr_read_byte_default()
  async function readByte(pgm, p, m, addr) {
    let o = m.read;
    if (m.readLo) { o = addr & 1 ? m.readHi : m.readLo; addr = Math.floor(addr / 2); }
    if (!o) throw new IspError(`Reading ${m.name} is not supported`);
    if (m.ext) await pgm.cmd(command(m.ext, addr));
    return getOutput(o, await pgm.cmd(command(o, addr)));
  }

  // avr_bitmask_data(): unused bits from the factory value
  async function bitmaskData(pgm, p, m, data) {
    const bm = m.bitmask;
    if (bm && bm !== 0xff) {
      let was = m.initval;
      if (was === -1) { try { was = await readByte(pgm, p, m, 0); } catch (e) { was = 0xff; } }
      data = (was & ~bm & 0xff) | (data & bm);
    }
    return data;
  }

  // avr_can_skip_write_byte(): is the value already there? (fuses and lock only)
  async function canSkip(pgm, p, m, data) {
    if (m.paged || p.at90s1200) return { skip: false, read: false };
    try {
      const is = await readByte(pgm, p, m, 0);
      return { skip: (is & m.bitmask) === (data & m.bitmask), read: true };
    } catch (e) {
      if (!(e instanceof IspError)) throw e;
      return { skip: false, read: false };   // avrdude then writes without read-back
    }
  }

  // avr_write_byte_default() for a fuse or lock byte
  async function writeByteDefault(pgm, p, m, data) {
    data = await bitmaskData(pgm, p, m, data);
    const s = await canSkip(pgm, p, m, data);
    if (s.skip) return;
    if (!m.write) throw new IspError(`Writing ${m.name} is not supported`);
    await pgm.cmd(command(m.write, 0, data));
    if (!s.read) { await sleep(m.maxWriteDelay); return; }
    for (let tries = 1; ; tries++) {
      await sleep(m.maxWriteDelay);   // fuses are not polled: wait, then read back
      const r = await readByte(pgm, p, m, 0);
      if ((r & m.bitmask) === (data & m.bitmask)) return;
      if (tries > 5) throw new IspError(`Writing ${m.name} failed: reads back ${hex(r)} instead of ${hex(data)}`);
    }
  }

  // avr_update_byte() as called from avr_write_mem() for -U fuse:w:...
  async function updateByte(pgm, p, m, data) {
    if (pgm.writeByteIsDefault) return writeByteDefault(pgm, p, m, data);   // via avr_write_byte()
    const s = await canSkip(pgm, p, m, data);
    if (s.skip) return;
    data = await bitmaskData(pgm, p, m, data);
    return writeByteDefault(pgm, p, m, data);
  }

  /* ---------- Firmware image with avrdude's allocation tags ---------- */

  // fw: FIRMWARE.readFirmware() result. Returns buffer and tags over the
  // whole flash, size (avr_mem_hiaddr) and lastaddr as avrdude computes them.
  function flashImage(fw, flashSize) {
    const buf = new Uint8Array(flashSize).fill(0xff), tags = new Uint8Array(flashSize);
    const warnings = [], errors = [];
    let other = null, beyond = 0;
    for (const s of fw.segs) {
      for (let i = 0; i < s.data.length; i++) {
        const a = s.addr + i;
        if (a >= 0x800000) { if (other === null || a < other) other = a; continue; }
        if (a >= flashSize) { beyond = Math.max(beyond, a + 1); continue; }
        buf[a] = s.data[i];
        tags[a] = 1;
      }
    }
    if (other !== null) warnings.push(`The file also holds EEPROM, fuse or lock bit data (from ${hex(other, 6)}). Only the flash part is written; set fuses under Fuses.`);
    if (beyond) errors.push(`The firmware needs ${beyond.toLocaleString("en")} bytes, but the chip has ${flashSize.toLocaleString("en")} bytes of flash.`);
    let size = 0, last = -1, n = 0;
    for (let i = flashSize - 1; i >= 0; i--) if (buf[i] !== 0xff) { size = i + 1 + (i & 1 ? 0 : 1); break; }
    for (let i = 0; i < flashSize; i++) if (tags[i]) { last = i; n++; }
    if (!n && !errors.length) errors.push("The file has no data for the flash.");
    return { buf, tags, size, lastaddr: last, nbytes: n, warnings, errors };
  }

  // avr_write_mem() for flash with a paged-write programmer
  async function writeFlash(pgm, p, img, progress) {
    const m = p.flash, ps = m.pageSize;
    const buf = Uint8Array.from(img.buf), tags = Uint8Array.from(img.tags);
    const wsize = Math.min(img.size, m.size), cw = Math.ceil(wsize / ps) * ps;
    // Fill holes in partly used pages with what the chip holds
    for (let pa = 0; pa < cw; pa += ps) {
      let nset = 0;
      for (let i = pa; i < pa + ps; i++) if (tags[i]) nset++;
      if (nset && nset !== ps) {
        try {
          const d = await pgm.pagedLoad(p, m, pa, ps);
          for (let i = 0; i < ps; i++) if (!tags[pa + i]) { tags[pa + i] = 1; buf[pa + i] = d[i]; }
        } catch (e) { if (!(e instanceof IspError)) throw e; }
      }
    }
    const pages = [];
    for (let pa = 0; pa < cw; pa += ps) { for (let i = pa; i < pa + ps; i++) if (tags[i]) { pages.push(pa); break; } }
    let done = 0;
    for (const pa of pages) {
      await pgm.pagedWrite(p, m, pa, buf.subarray(pa, pa + ps));
      if (progress) progress(++done / pages.length);
    }
    return pages.length;
  }

  // avr_read_mem() with verify part, then avr_verify_mem()
  async function verifyFlash(pgm, p, img, progress) {
    const m = p.flash, ps = m.pageSize, size = img.lastaddr + 1;
    const pages = [];
    for (let pa = 0; pa < m.size; pa += ps) { for (let i = pa; i < pa + ps; i++) if (img.tags[i]) { pages.push(pa); break; } }
    const read = new Uint8Array(m.size).fill(0xff);
    let done = 0;
    for (const pa of pages) {
      read.set(await pgm.pagedLoad(p, m, pa, ps), pa);
      if (progress) progress(++done / pages.length);
    }
    let errors = 0, first = -1;
    for (let i = 0; i < size; i++) {
      if (img.tags[i] && read[i] !== img.buf[i]) { if (first < 0) first = i; errors++; }
    }
    if (errors) throw new IspError(`Flash verification failed at ${hex(first, 4)}: the chip holds ${hex(read[first])}, the file ${hex(img.buf[first])} (${errors} byte${errors > 1 ? "s" : ""} differ).${read[first] === 0 && errors > 10 ? " The lock bits may protect the flash." : ""}`);
    return size;
  }

  /* ---------- Session (main.c) ---------- */

  class Session {
    constructor(device, opts) {
      this.dev = device;
      this.kind = kindOf(device);
      this.usb = new Usb(device);
      this.pgm = this.kind === "usbtiny" ? new UsbTiny(this.usb, opts) : new UsbAsp(this.usb, opts);
      this.p = GENERIC();
      this.partChoice = opts && opts.part;
    }

    async open() {
      await this.usb.open();
      this.opened = true;
      await this.pgm.initialize(this.p);
      await sleep(10000);
      const sig = [];
      for (let i = 0; i < 3; i++) sig.push(await readByte(this.pgm, this.p, this.p.signature, i));
      this.signature = sig;
      if (sig.every((b) => b === 0xff) || sig.every((b) => b === 0x00)) {
        throw new IspError(`Invalid device signature ${sig.map((b) => hex(b)).join(" ")}: the chip does not answer. Check the wiring, the power of the chip and the clock (a chip set to an external crystal needs that crystal), or choose a slower SCK.`);
      }
      this.candidates = partsBySignature(sig);
      if (!this.candidates.length) throw new IspError(`Unknown device signature ${sig.map((b) => hex(b)).join(" ")}: the chip is not in avrdude's list of ISP parts.`);
      const id = this.candidates.includes(this.partChoice) ? this.partChoice : this.candidates[0];
      this.p = part(id);
      return this.p;
    }

    async erase() { await this.pgm.chipErase(this.p); }

    fuse(name) { return this.p.fuses.find((f) => f.name === name); }

    async readFuses() {
      const out = {};
      for (const f of this.p.fuses) if (f.read) out[f.name] = await readByte(this.pgm, this.p, f, 0);
      return out;
    }
    async readCalibration() {
      const c = this.p.calibration;
      if (!c) return null;
      const out = [];
      for (let i = 0; i < c.size; i++) out.push(await readByte(this.pgm, this.p, c, i));
      return out;
    }

    // -U <fuse>:w:<value>:m with verify
    async writeFuse(name, value) {
      const m = this.fuse(name);
      if (!m) throw new IspError(`The ${this.p.name} has no ${name}`);
      await updateByte(this.pgm, this.p, m, value);
      const r = await readByte(this.pgm, this.p, m, 0);
      if ((r & m.bitmask) !== (value & m.bitmask)) throw new IspError(`${name} verification failed: reads ${hex(r)} instead of ${hex(value)}`);
    }

    async writeFlash(img, progress) { return writeFlash(this.pgm, this.p, img, progress); }
    async verifyFlash(img, progress) { return verifyFlash(this.pgm, this.p, img, progress); }

    async close() {
      if (!this.opened) return;
      this.opened = false;
      try { await this.pgm.powerdown(); } catch (e) { /* ignore */ }
      try { await this.pgm.close(); } catch (e) { /* ignore */ }
    }
  }

  // The avrdude command line the app performs:
  // avrdude -c <usbasp|usbtiny> -p <part> [-e] [-U flash:w:file] [-U <fuse>:w:0x..:m ...]
  // a: { info, erase, flash: {fw}, fuses: [[name, value], ...] }
  async function run(session, a, log, progress) {
    log = log || (() => {});
    try {
      log(`Connecting through the ${session.pgm.name} …`);
      const p = await session.open();
      log(`Found ${p.name} (signature ${session.signature.map((b) => hex(b)).join(" ")}).`);
      if (a.fuses && a.fuses.length && a.expectPart && a.expectPart !== p.id) throw new IspError(`The fuse settings were made for the ${part(a.expectPart).name}, but a ${p.name} is connected. Read the chip info again.`);
      if (a.info) {
        session.fuseValues = await session.readFuses();
        session.cal = await session.readCalibration();
        return session;
      }
      let img = null;
      if (a.flash) {
        img = flashImage(a.flash, p.flash.size);
        if (img.errors.length) throw new IspError(img.errors[0]);
      }
      if (a.erase || img) {
        log("Erasing chip …");
        await session.erase();
      }
      if (img) {
        if (img.size === 0) log("The file holds only 0xFF bytes; there is nothing to write.");
        else {
          log(`Writing ${img.nbytes.toLocaleString("en")} bytes to flash …`);
          const pages = await session.writeFlash(img, (f) => progress && progress("write", f));
          log(`${pages} page${pages === 1 ? "" : "s"} written. Verifying …`);
          await session.verifyFlash(img, (f) => progress && progress("verify", f));
          log(`${img.nbytes.toLocaleString("en")} bytes of flash written and verified.`);
        }
      }
      for (const [name, v] of a.fuses || []) {
        log(`Writing ${name} = ${hex(v)} …`);
        await session.writeFuse(name, v);
      }
      if (a.fuses && a.fuses.length) log("Fuses written and verified.");
      // Not part of the avrdude command: read the fuses again for the display
      if (a.readBack) session.fuseValues = await session.readFuses();
      return session;
    } finally {
      await session.close();
    }
  }

  global.AVRISP = { PROGRAMMERS, ALL_FILTERS, kindOf, part, partsBySignature, flashImage, Session, IspError, run, ASP_SCK };
})(typeof window !== "undefined" ? window : globalThis);
