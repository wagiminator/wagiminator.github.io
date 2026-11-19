/* ===================================================================
 * ESP32/ESP8266 serial bootloader (ROM loader) protocol
 * -------------------------------------------------------------------
 * Talks to the download mode in the ROM of Espressif chips through a
 * USB-to-serial converter or the USB-Serial/JTAG port of the newer
 * chips (Web Serial): SLIP frames, sync, register access, SPI flash
 * attach, flash write in 1 KB blocks, MD5 check and the DTR/RTS reset
 * sequences. Written after the serial protocol documentation of
 * esptool and esptool-js by Espressif (Apache-2.0); like esptool with
 * --no-stub it uses the ROM loader only, so no code is uploaded to
 * the chip.
 * Global: ESPROM
 * =================================================================== */
(function (global) {
  "use strict";

  const OP = {
    FLASH_BEGIN: 0x02, FLASH_DATA: 0x03, FLASH_END: 0x04, SYNC: 0x08, WRITE_REG: 0x09, READ_REG: 0x0a,
    SPI_SET_PARAMS: 0x0b, SPI_ATTACH: 0x0d, CHANGE_BAUD: 0x0f, SPI_FLASH_MD5: 0x13, GET_SECURITY_INFO: 0x14,
  };
  const ROM_ERRORS = {
    0x05: "the chip did not understand the command", 0x06: "the chip could not carry out the command", 0x07: "checksum error",
    0x08: "flash write error", 0x09: "flash read error", 0x0a: "flash read length error", 0x0b: "deflate error",
  };
  const WRITE_SIZE = 0x400, SECTOR = 0x1000;
  const ESPRESSIF_VID = 0x303a, USB_JTAG_SERIAL_PID = 0x1001;

  // Chip descriptions. spi: SPI flash controller registers for the RDID command
  // (base, usr, usr1, usr2, w0, mosiDlen, misoDlen). boot: bootloader offset.
  const SPI_C3 = { base: 0x60002000, usr: 0x18, usr1: 0x1c, usr2: 0x20, w0: 0x58, mosi: 0x24, miso: 0x28 };
  const SPI_C6 = { base: 0x60003000, usr: 0x18, usr1: 0x1c, usr2: 0x20, w0: 0x58, mosi: 0x24, miso: 0x28 };
  const CHIPS = [
    { name: "ESP8266", magic: [0xfff0c101], imageId: null, boot: 0x0, app: 0x0, spi: { base: 0x60000200, usr: 0x1c, usr1: 0x20, usr2: 0x24, w0: 0x40 }, mac: "esp8266", rom8266: true },
    { name: "ESP32", magic: [0x00f01d83], imageId: 0, boot: 0x1000, app: 0x10000, spi: { base: 0x3ff42000, usr: 0x1c, usr1: 0x20, usr2: 0x24, w0: 0x80, mosi: 0x28, miso: 0x2c }, mac: "esp32", noEncryptParam: true },
    { name: "ESP32-S2", magic: [0x000007c6], imageId: 2, boot: 0x1000, app: 0x10000, spi: { base: 0x3f402000, usr: 0x18, usr1: 0x1c, usr2: 0x20, w0: 0x58, mosi: 0x24, miso: 0x28 }, macReg: 0x3f41a044, otgPid: 0x0002 },
    { name: "ESP32-S3", magic: [0x09], imageId: 9, boot: 0x0, app: 0x10000, spi: SPI_C3, macReg: 0x60007044 },
    { name: "ESP32-C2", magic: [0x6f51306f, 0x7c41a06f, 0x0c21e06f], imageId: 12, boot: 0x0, app: 0x10000, spi: SPI_C3, macReg: 0x60008840 },
    { name: "ESP32-C3", magic: [0x6921506f, 0x1b31506f, 0x4881606f, 0x4361606f], imageId: 5, boot: 0x0, app: 0x10000, spi: SPI_C3, macReg: 0x60008844 },
    { name: "ESP32-C5", magic: [0x1101406f, 0x63e1406f, 0x5fd1406f, 0x30e1706f], imageId: 23, boot: 0x2000, app: 0x10000, spi: SPI_C6, macReg: 0x600b4844 },
    { name: "ESP32-C6", magic: [0x2ce0806f], imageId: 13, boot: 0x0, app: 0x10000, spi: SPI_C6, macReg: 0x600b0844 },
    { name: "ESP32-C61", magic: [0x2421606f, 0x33f0206f, 0x4f81606f], imageId: 20, boot: 0x0, app: 0x10000, spi: SPI_C6, macReg: 0x600b4844 },
    { name: "ESP32-H2", magic: [0xd7b73e80, 0x97e30068], imageId: 16, boot: 0x0, app: 0x10000, spi: SPI_C6, macReg: 0x600b0844 },
    { name: "ESP32-P4", magic: [0x0, 0x0addbad0, 0x7039ad9], imageId: 18, boot: 0x2000, app: 0x10000, spi: { base: 0x5008d000, usr: 0x18, usr1: 0x1c, usr2: 0x20, w0: 0x58, mosi: 0x24, miso: 0x28 }, macReg: 0x5012d044 },
  ];
  const IMAGE_CHIP = Object.fromEntries(CHIPS.filter((c) => c.imageId !== null).map((c) => [c.imageId, c.name]));

  // Flash size from the third byte of the JEDEC ID
  const FLASH_SIZES = {
    0x12: 256 << 10, 0x13: 512 << 10, 0x14: 1 << 20, 0x15: 2 << 20, 0x16: 4 << 20, 0x17: 8 << 20, 0x18: 16 << 20,
    0x19: 32 << 20, 0x1a: 64 << 20, 0x1b: 128 << 20, 0x1c: 256 << 20, 0x20: 64 << 20, 0x21: 128 << 20, 0x22: 256 << 20,
    0x32: 256 << 10, 0x33: 512 << 10, 0x34: 1 << 20, 0x35: 2 << 20, 0x36: 4 << 20, 0x37: 8 << 20, 0x38: 16 << 20,
    0x39: 32 << 20, 0x3a: 64 << 20,
  };
  const FLASH_VENDORS = { 0x20: "XMC or Micron", 0x46: "XTX", 0x5e: "Zbit", 0x68: "Boya", 0x85: "Puya", 0x9d: "ISSI", 0xa1: "Fudan", 0xc2: "Macronix", 0xc8: "GigaDevice", 0x0b: "XTX", 0xef: "Winbond", 0x1c: "EON" };

  class EspError extends Error {}
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const hex = (v, n) => "0x" + (v >>> 0).toString(16).padStart(n || 8, "0");
  const le32 = (...vals) => {
    const b = new Uint8Array(vals.length * 4), v = new DataView(b.buffer);
    vals.forEach((x, i) => v.setUint32(i * 4, x >>> 0, true));
    return b;
  };
  const cat = (...parts) => {
    const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    let o = 0;
    for (const p of parts) { out.set(p, o); o += p.length; }
    return out;
  };

  /* ---------- MD5 (for checking the written flash) ---------- */

  function md5(data) {
    const K = new Uint32Array(64), S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
    for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296);
    const n = data.length, total = ((n + 8) >> 6) + 1, m = new Uint32Array(total * 16);
    for (let i = 0; i < n; i++) m[i >> 2] |= data[i] << ((i & 3) * 8);
    m[n >> 2] |= 0x80 << ((n & 3) * 8);
    m[total * 16 - 2] = (n * 8) >>> 0;
    m[total * 16 - 1] = Math.floor(n / 0x20000000);
    let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
    for (let blk = 0; blk < total * 16; blk += 16) {
      let a = a0, b = b0, c = c0, d = d0;
      for (let i = 0; i < 64; i++) {
        let f, g;
        if (i < 16) { f = (b & c) | (~b & d); g = i; }
        else if (i < 32) { f = (d & b) | (~d & c); g = (5 * i + 1) & 15; }
        else if (i < 48) { f = b ^ c ^ d; g = (3 * i + 5) & 15; }
        else { f = c ^ (b | ~d); g = (7 * i) & 15; }
        const t = d; d = c; c = b;
        const x = (a + f + K[i] + m[blk + g]) | 0, s = S[(i >> 4) * 4 + (i & 3)];
        b = (b + ((x << s) | (x >>> (32 - s)))) | 0;
        a = t;
      }
      a0 = (a0 + a) | 0; b0 = (b0 + b) | 0; c0 = (c0 + c) | 0; d0 = (d0 + d) | 0;
    }
    return [a0, b0, c0, d0].map((w) => [0, 8, 16, 24].map((s) => ((w >>> s) & 255).toString(16).padStart(2, "0")).join("")).join("");
  }

  /* ---------- Serial link ---------- */

  // SerialLink with DTR/RTS released after opening (asserted RTS holds some
  // boards in reset) and a reader that survives framing errors.
  class EspLink extends global.SerialLink {
    async open() {
      await this.port.open(Object.assign({ baudRate: this.baud, bufferSize: 1 << 16 }, this.options));
      await this.setSignals({ dtr: false, rts: false });
      this.writer = this.port.writable.getWriter();
      this.reader = this.port.readable.getReader();
      this.loop = this.readLoop();
    }

    async readLoop() {
      for (;;) {
        try {
          for (;;) {
            const { value, done } = await this.reader.read();
            if (done) { this.closed = true; this.wake(); return; }
            if (value && value.length) { this.chunks.push(value); this.length += value.length; this.wake(); }
          }
        } catch (err) {
          // Break, framing, parity and overrun errors leave the port usable
          if (err && /BreakError|FramingError|ParityError|BufferOverrunError/.test(err.name) && this.port.readable && !this.closing) {
            try { this.reader.releaseLock(); } catch (e) { /* ignore */ }
            try { this.reader = this.port.readable.getReader(); continue; } catch (e) { /* fall through */ }
          }
          this.error = err;
          this.closed = true;
          this.wake();
          return;
        }
      }
    }

    async close() {
      this.closing = true;
      await super.close();
    }

    // Everything the chip printed outside SLIP frames (boot messages)
    noise() { const t = this.text || ""; this.text = ""; return t; }

    // One SLIP frame, or null on timeout
    async readFrame(timeout) {
      const deadline = performance.now() + timeout;
      let inFrame = false, esc = false;
      const out = [];
      for (;;) {
        if (!this.length) {
          await this.waitFor(1, deadline);
          if (!this.length) return null;
        }
        const chunk = this.take(this.length);
        for (let i = 0; i < chunk.length; i++) {
          const b = chunk[i];
          if (!inFrame) {
            if (b === 0xc0) inFrame = true;
            else this.text = ((this.text || "") + String.fromCharCode(b)).slice(-2000);
            continue;
          }
          if (b === 0xc0) {
            if (!out.length) continue;      // two frame marks in a row
            this.unread(chunk.subarray(i + 1));
            return Uint8Array.from(out);
          }
          if (esc) { out.push(b === 0xdc ? 0xc0 : b === 0xdd ? 0xdb : b); esc = false; }
          else if (b === 0xdb) esc = true;
          else out.push(b);
        }
      }
    }

    async writeFrame(data) {
      const out = [0xc0];
      for (const b of data) {
        if (b === 0xc0) out.push(0xdb, 0xdc);
        else if (b === 0xdb) out.push(0xdb, 0xdd);
        else out.push(b);
      }
      out.push(0xc0);
      await this.write(Uint8Array.from(out));
    }

    // Wait until the chip has been quiet for `ms`, dropping what it sent
    async drain(ms) {
      for (let i = 0; i < 20; i++) {
        this.flushInput();
        await sleep(ms);
        if (!this.length) return;
      }
    }
  }

  /* ---------- Loader ---------- */

  class Loader {
    constructor(port, baud, log) {
      this.port = port;
      this.baud = baud;              // baud rate for flashing
      this.log = log || (() => {});
      const info = port.getInfo ? port.getInfo() : {};
      this.vid = info.usbVendorId; this.pid = info.usbProductId;
      this.usbJtag = this.vid === ESPRESSIF_VID && this.pid === USB_JTAG_SERIAL_PID;
      this.usbOtg = this.vid === ESPRESSIF_VID && !this.usbJtag;
      this.link = null;
      this.chip = null;
    }

    async openLink(baud) {
      this.link = new EspLink(this.port, baud);
      await this.link.open();
    }

    async close() {
      if (this.link) { await this.link.close(); this.link = null; }
    }

    async command(op, data, chk, timeout) {
      const l = this.link;
      l.flushInput();
      data = data || new Uint8Array(0);
      const pkt = new Uint8Array(8 + data.length), v = new DataView(pkt.buffer);
      pkt[1] = op;
      v.setUint16(2, data.length, true);
      v.setUint32(4, (chk || 0) >>> 0, true);
      pkt.set(data, 8);
      await l.writeFrame(pkt);
      const deadline = performance.now() + (timeout || 3000);
      for (let i = 0; i < 100; i++) {
        const left = deadline - performance.now();
        if (left <= 0) break;
        const p = await l.readFrame(left);
        if (!p) break;
        if (p.length < 8 || p[0] !== 1) continue;
        if (p[1] !== op) {
          // An unknown command is answered with status 0x05
          if (p.length >= 10 && p[8] !== 0 && p[9] === 0x05) { await l.drain(30); throw new EspError("unsupported"); }
          continue;
        }
        const val = (p[4] | (p[5] << 8) | (p[6] << 16) | (p[7] << 24)) >>> 0;
        return { val, data: p.subarray(8) };
      }
      if (l.closed) throw new EspError("The serial port was closed (the board may have been unplugged or reset).");
      throw new EspError("timeout");
    }

    // Command with status check; respLen: bytes of data before the status bytes
    async check(what, op, data, chk, respLen, timeout) {
      let r;
      try { r = await this.command(op, data, chk, timeout); } catch (e) {
        if (e.message === "timeout") throw new EspError(`The chip did not answer (${what}).`);
        throw e;
      }
      respLen = respLen || 0;
      if (r.data.length < respLen + 2) {
        // Errors come without the data part
        if (r.data.length >= 2 && r.data[0] !== 0) {
          const e = new EspError(`The chip reported an error (${what}: ${ROM_ERRORS[r.data[1]] || hex(r.data[1], 2)}).`);
          e.code = r.data[1];
          throw e;
        }
        throw new EspError(`Short answer from the chip (${what}).`);
      }
      const st = r.data.subarray(respLen, respLen + 2);
      if (st[0] !== 0) {
        const e = new EspError(`The chip reported an error (${what}: ${ROM_ERRORS[st[1]] || hex(st[1], 2)}).`);
        e.code = st[1];
        throw e;
      }
      return respLen ? r.data.subarray(0, respLen) : r.val;
    }

    async readReg(addr) { return this.check("read register", OP.READ_REG, le32(addr)); }
    async writeReg(addr, value) { return this.check("write register", OP.WRITE_REG, le32(addr, value, 0xffffffff, 0)); }

    async sync() {
      const d = new Uint8Array(36);
      d.set([0x07, 0x07, 0x12, 0x20]);
      d.fill(0x55, 4);
      await this.command(OP.SYNC, d, 0, 100);
      // The ROM answers a sync with eight replies; let the rest go by
      await this.link.drain(40);
    }

    async resetToBootloader(variant) {
      const l = this.link;
      if (this.usbJtag) {
        // Sequence for the USB-Serial/JTAG port (ESP32-C3, -S3, -C6, -H2 …)
        await l.setSignals({ rts: false, dtr: false }); await sleep(100);
        await l.setSignals({ dtr: true, rts: false }); await sleep(100);
        await l.setSignals({ rts: true, dtr: false }); await sleep(100);
        await l.setSignals({ rts: false, dtr: false });
      } else {
        // Classic auto-reset circuit: RTS -> EN, DTR -> IO0 (through two transistors)
        await l.setSignals({ dtr: false, rts: true }); await sleep(100);
        await l.setSignals({ dtr: true, rts: false }); await sleep(variant ? 550 : 50);
        await l.setSignals({ dtr: false, rts: false });
      }
    }

    // Open the port, reset into download mode and synchronize
    async connect(autoReset) {
      await this.openLink(115200);
      let lastNoise = "";
      for (let attempt = 0; attempt < 7; attempt++) {
        if (autoReset) await this.resetToBootloader(attempt & 1);
        for (let i = 0; i < 5; i++) {
          this.link.flushInput();
          try {
            await this.sync();
            this.link.noise();
            return;
          } catch (e) {
            if (!(e instanceof EspError) || (e.message !== "timeout" && e.message !== "unsupported")) throw e;
          }
        }
        lastNoise = this.link.noise() || lastNoise;
        if (!autoReset && attempt >= 2) break;
      }
      const m = /boot:(0x[0-9a-fA-F]+)([\s\S]*?waiting for download)?/.exec(lastNoise);
      if (m && !m[2]) throw new EspError(`The chip started its program instead of the download mode (boot mode ${m[1]}). Hold BOOT (IO0) while pressing RESET, or check the DTR/RTS wiring.`);
      if (m && m[2]) throw new EspError("The chip is in download mode but does not answer: check the TX line from the converter to the chip (RXD0).");
      throw new EspError(autoReset
        ? "No answer from the chip. Put it into download mode by hand: hold BOOT (IO0), press and release RESET (EN), release BOOT, and try again."
        : "No answer from the chip. Is it in download mode (hold BOOT/IO0 while pressing RESET)?");
    }

    async securityInfo() {
      try {
        const d = await this.check("security info", OP.GET_SECURITY_INFO, null, 0, 20, 500);
        return { flags: (d[0] | (d[1] << 8) | (d[2] << 16) | (d[3] << 24)) >>> 0, cryptCnt: d[4], chipId: (d[12] | (d[13] << 8) | (d[14] << 16) | (d[15] << 24)) >>> 0 };
      } catch (e) {
        if (e.message === "unsupported" || e.code === 0x05 || /did not answer/.test(e.message)) {
          await this.link.drain(30);
          // The ESP32-S2 answers with 12 bytes only (no chip ID)
          try {
            const d = await this.check("security info", OP.GET_SECURITY_INFO, null, 0, 12, 500);
            return { flags: (d[0] | (d[1] << 8) | (d[2] << 16) | (d[3] << 24)) >>> 0, cryptCnt: d[4], chipId: null };
          } catch (e2) { await this.link.drain(30); return null; }
        }
        throw e;
      }
    }

    async detect() {
      const sec = await this.securityInfo();
      this.secure = sec || null;
      this.secureDownload = !!(sec && sec.flags & 4);
      let chip = null;
      if (sec && sec.chipId !== null) chip = CHIPS.find((c) => c.imageId === sec.chipId) || null;
      if (!chip && this.secureDownload && sec && sec.chipId === null) chip = CHIPS.find((c) => c.name === "ESP32-S2");
      if (!chip) {
        const magic = await this.readReg(0x40001000);
        chip = CHIPS.find((c) => c.magic.includes(magic)) || null;
        if (!chip) throw new EspError(`Unknown chip (magic value ${hex(magic)}).`);
      }
      this.chip = chip;
      return chip;
    }

    async readMac() {
      const c = this.chip;
      const b = (w, s) => (w >>> s) & 255;
      let mac;
      if (c.mac === "esp8266") {
        const m0 = await this.readReg(0x3ff00050), m1 = await this.readReg(0x3ff00054), m3 = await this.readReg(0x3ff0005c);
        let oui;
        if (m3) oui = [b(m3, 16), b(m3, 8), b(m3, 0)];
        else if (b(m1, 16) === 0) oui = [0x18, 0xfe, 0x34];
        else if (b(m1, 16) === 1) oui = [0xac, 0xd0, 0x74];
        else return null;
        mac = oui.concat([b(m1, 8), b(m1, 0), b(m0, 24)]);
      } else if (c.mac === "esp32") {
        const w1 = await this.readReg(0x3ff5a000 + 4), w2 = await this.readReg(0x3ff5a000 + 8);
        mac = [b(w2, 8), b(w2, 0), b(w1, 24), b(w1, 16), b(w1, 8), b(w1, 0)];
      } else {
        const m0 = await this.readReg(c.macReg), m1 = (await this.readReg(c.macReg + 4)) & 0xffff;
        mac = [b(m1, 8), b(m1, 0), b(m0, 24), b(m0, 16), b(m0, 8), b(m0, 0)];
      }
      return mac.map((x) => x.toString(16).padStart(2, "0")).join(":");
    }

    // Enable the SPI flash (the ROM loader does not do it by itself)
    async attachFlash() {
      const c = this.chip;
      if (c.rom8266) { await this.flashBegin(0, 0); return; }
      let value = 0;
      if (c.name === "ESP32" && !this.secureDownload) {
        // Chips with flash in the package (ESP32-PICO, -D2WD) use other pads, set in the eFuses
        const r5 = await this.readReg(0x3ff5a014), r3 = await this.readReg(0x3ff5a00c);
        const clk = r5 & 0x1f, q = (r5 >> 5) & 0x1f, d = (r5 >> 10) & 0x1f, cs = (r5 >> 15) & 0x1f, hd = (r3 >> 4) & 0x1f;
        if (clk || q || d || cs || hd) value = ((hd << 24) | (cs << 18) | (d << 12) | (q << 6) | clk) >>> 0;
      }
      await this.check("attach flash", OP.SPI_ATTACH, cat(le32(value), new Uint8Array(4)));
    }

    async setFlashSize(size) {
      if (this.chip.rom8266) return;     // not in the ESP8266 ROM, and not needed
      await this.check("set flash parameters", OP.SPI_SET_PARAMS, le32(0, size, 64 * 1024, 4096, 256, 0xffff));
    }

    // JEDEC ID of the flash chip through the SPI controller registers
    async flashId() {
      const s = this.chip.spi, base = s.base;
      const oldUsr = await this.readReg(base + s.usr), oldUsr2 = await this.readReg(base + s.usr2);
      const readBits = 24;
      if (s.miso !== undefined) await this.writeReg(base + s.miso, readBits - 1);
      else await this.writeReg(base + s.usr1, (readBits - 1) << 8);
      await this.writeReg(base + s.usr, ((1 << 31) | (1 << 28)) >>> 0);          // USR_COMMAND | USR_MISO
      await this.writeReg(base + s.usr2, ((7 << 28) | 0x9f) >>> 0);              // 8-bit command RDID
      await this.writeReg(base + s.w0, 0);
      await this.writeReg(base, 1 << 18);                                         // CMD_USR: start
      let i;
      for (i = 0; i < 10; i++) if (!((await this.readReg(base)) & (1 << 18))) break;
      if (i === 10) throw new EspError("The SPI flash command did not finish.");
      const id = (await this.readReg(base + s.w0)) & 0xffffff;
      await this.writeReg(base + s.usr, oldUsr);
      await this.writeReg(base + s.usr2, oldUsr2);
      return id;
    }

    async changeBaud(baud) {
      if (this.chip.rom8266 || this.usbJtag || this.usbOtg || baud === 115200 || this.secureDownload) return false;
      await this.check("change baud rate", OP.CHANGE_BAUD, le32(baud, 0));
      await sleep(50);
      await this.link.close();
      await this.openLink(baud);
      await sleep(50);
      try {
        await this.readReg(0x40001000);
        return true;
      } catch (e) {
        throw new EspError(`The chip does not answer at ${baud} baud. Choose a lower baud rate.`);
      }
    }

    // ESP8266 ROM bug: it erases more than asked; esptool's workaround
    eraseSize(offset, size) {
      if (!this.chip.rom8266) return size;
      const per = 16, num = Math.ceil(size / SECTOR), start = Math.floor(offset / SECTOR);
      let head = per - (start % per);
      if (num < head) head = num;
      return num < 2 * head ? Math.floor((num + 1) / 2) * SECTOR : (num - head) * SECTOR;
    }

    async flashBegin(size, offset) {
      const blocks = Math.ceil(size / WRITE_SIZE);
      let params = le32(this.eraseSize(offset, size), blocks, WRITE_SIZE, offset);
      if (!this.chip.rom8266 && !this.chip.noEncryptParam) params = cat(params, le32(0));
      const timeout = Math.max(3000, 30000 * size / 1e6);   // the ROM erases the area first
      await this.check("start writing (erase)", OP.FLASH_BEGIN, params, 0, 0, timeout);
      return blocks;
    }

    async flashBlock(data, seq) {
      let chk = 0xef;
      for (const b of data) chk ^= b;
      const pkt = cat(le32(data.length, seq, 0, 0), data);
      for (let attempt = 0; ; attempt++) {
        try {
          await this.check(`write block ${seq}`, OP.FLASH_DATA, pkt, chk, 0, 5000);
          return;
        } catch (e) {
          if (attempt >= 2) throw e;
          await sleep(150);
        }
      }
    }

    async md5(offset, size) {
      const timeout = Math.max(3000, 8000 * size / 1e6);
      const d = await this.check("compute MD5", OP.SPI_FLASH_MD5, le32(offset, size, 0, 0), 0, 32, timeout);
      return String.fromCharCode(...d).toLowerCase();
    }

    // Leave download mode: RTS pulse on EN (hard reset)
    async hardReset() {
      const l = this.link;
      await l.setSignals({ dtr: false, rts: true });
      await sleep(this.usbOtg ? 200 : 100);
      await l.setSignals({ dtr: false, rts: false });
      if (this.usbOtg) await sleep(200);
    }
  }

  /* ---------- Firmware images ---------- */

  // Header of an ESP firmware image (bootloader or application)
  function imageInfo(data) {
    if (data.length < 24 || data[0] !== 0xe9 || data[1] < 1 || data[1] > 16) return null;
    const modes = ["QIO", "QOUT", "DIO", "DOUT"];
    const sizeCode = data[3] >> 4;
    const info = { segments: data[1], mode: modes[data[2]] || `mode ${data[2]}`, sizeCode, freqCode: data[3] & 15, entry: (data[4] | (data[5] << 8) | (data[6] << 16) | (data[7] << 24)) >>> 0 };
    // Extended header of the ESP32 family: chip ID at bytes 12..13
    // (only if the reserved bytes are zero: ESP8266 images have code there)
    const id = data[12] | (data[13] << 8);
    if (id in IMAGE_CHIP && !data[19] && !data[20] && !data[21] && !data[22] && data[23] <= 1) info.chipId = id;
    return info;
  }

  // Is this a merged image (bootloader, partition table and app at their places)?
  function isMerged(data) {
    return data.length > 0x8020 && data[0x8000] === 0xaa && data[0x8001] === 0x50 && (data[0] === 0xe9 || data[0x1000] === 0xe9 || data[0x2000] === 0xe9);
  }

  // Guess where a file goes from its name and content
  // -> "boot", "app" (chip-dependent) or a fixed number, or null
  function guessOffset(name, data, count) {
    const n = name.toLowerCase();
    if (/merged|factory|combined|full|flash_image|_0x0\b|-0x0\b/.test(n) || isMerged(data)) return 0;
    if (/boot_app0/.test(n)) return 0xe000;
    if (/bootloader/.test(n)) return "boot";
    if (/partition/.test(n)) return 0x8000;
    if (/ota_?data/.test(n)) return 0xd000;
    const m = /(?:^|[_\-@ ])(0x[0-9a-f]{3,8})(?=[_\-. ]|$)/.exec(n);
    if (m) return parseInt(m[1], 16);
    if (/spiffs|littlefs|fatfs|nvs/.test(n)) return null;
    if (data[0] === 0xe9) return "app";
    return count === 1 ? "app" : null;
  }

  // Write files: [{ name, offset, data }] sorted by offset. opts: { eraseAll, flashSize }
  // progress(fileIndex, written, total, phase)
  async function writeFlash(ld, files, opts, progress) {
    const log = ld.log;
    if (opts.eraseAll) {
      log(`Erasing the whole flash (${Math.round(opts.flashSize / 1024)} KB); this takes a while …`);
      await ld.flashBegin(opts.flashSize, 0);
    }
    const total = files.reduce((n, f) => n + f.data.length, 0);
    let done = 0;
    for (let fi = 0; fi < files.length; fi++) {
      const f = files[fi];
      // The ROM writes from sector starts only: pad in front with erased bytes
      const over = f.offset % SECTOR, addr = f.offset - over;
      let image = over ? cat(new Uint8Array(over).fill(0xff), f.data) : f.data;
      if (image.length % 4) image = cat(image, new Uint8Array(4 - (image.length % 4)).fill(0xff));
      const t0 = performance.now();
      log(`Writing ${f.name} at ${hex(f.offset)} (${f.data.length.toLocaleString("en")} bytes) …`);
      progress(fi, done, total, "erase");
      const blocks = await ld.flashBegin(image.length, addr);
      for (let seq = 0; seq < blocks; seq++) {
        let block = image.subarray(seq * WRITE_SIZE, seq * WRITE_SIZE + WRITE_SIZE);
        if (block.length < WRITE_SIZE) block = cat(block, new Uint8Array(WRITE_SIZE - block.length).fill(0xff));
        await ld.flashBlock(block, seq);
        progress(fi, done + Math.min(f.data.length, (seq + 1) * WRITE_SIZE), total, "write");
      }
      done += f.data.length;
      const s = (performance.now() - t0) / 1000;
      log(`Wrote ${f.name} in ${s.toFixed(1)} s (${Math.round(image.length * 8 / s / 1000)} kbit/s).`);
      if (!ld.chip.rom8266 && !ld.secureDownload) {
        progress(fi, done, total, "verify");
        const want = md5(image), got = await ld.md5(addr, image.length);
        if (want !== got) {
          if (got === md5(new Uint8Array(image.length).fill(0xff))) throw new EspError(`Writing ${f.name} failed: the area is still empty.`);
          throw new EspError(`Verification of ${f.name} failed (MD5 of the flash ${got}, of the file ${want}).`);
        }
        log(`${f.name} verified (MD5 ${want}).`);
      }
    }
  }

  global.ESPROM = {
    CHIPS, IMAGE_CHIP, FLASH_SIZES, FLASH_VENDORS, SECTOR, ESPRESSIF_VID, USB_JTAG_SERIAL_PID,
    EspError, Loader, EspLink, md5, imageInfo, isMerged, guessOffset, writeFlash, hex, sleep,
  };
})(typeof window !== "undefined" ? window : globalThis);
