/* ===================================================================
 * UPDI programmer for tinyAVR 0-, 1- and 2-series (Web Serial)
 * -------------------------------------------------------------------
 * JavaScript port of tinyupdi.py v1.5 by Stefan Wagner (MIT License),
 * https://github.com/wagiminator/MCU-Flash-Tools, which is based on
 * pyupdi and pymcuprog. The USB-to-serial converter's TX and RX are
 * joined (through a resistor or diode) to the UPDI pin, so every byte
 * sent comes back as an echo. UPDI runs at 230400 baud, 8E2; a double
 * break at 300 baud resets the UPDI port first.
 * Differences to tinyupdi.py:
 * - the last flash page is padded with 0xFF up to the full page size
 *   (tinyupdi.py appends len(data) % pagesize bytes, which only gives
 *   whole pages by chance)
 * - connecting to a locked chip erases it only for erase and flash;
 *   tinyupdi.py always unlocks (erases) a locked chip when connecting
 * - after unlocking, programming mode is entered if it is not active
 * Global: UPDI
 * =================================================================== */
(function (global) {
  "use strict";

  const BAUD = 230400;
  const C = {
    BREAK: 0x00, LDS: 0x00, STS: 0x40, LD: 0x20, ST: 0x60, LDCS: 0x80, STCS: 0xc0, REPEAT: 0xa0, KEY: 0xe0,
    PTR_INC: 0x04, PTR_ADDRESS: 0x08, ADDRESS_16: 0x04, DATA_8: 0x00, DATA_16: 0x01,
    SYNC: 0x55, ACK: 0x40, REPEAT_BYTE: 0x00,
    CS_STATUSA: 0x00, CS_CTRLA: 0x02, CS_CTRLB: 0x03,
    CTRLA_RSD_BIT: 3, CTRLA_IBDLY_BIT: 7, CTRLB_CCDETDIS_BIT: 3, CTRLB_UPDIDIS_BIT: 2,
    ASI_KEY_STATUS: 0x07, ASI_RESET_REQ: 0x08, ASI_SYS_STATUS: 0x0b,
    KEY_STATUS_CHIPERASE: 3, KEY_STATUS_NVMPROG: 4, SYS_STATUS_NVMPROG: 3, SYS_STATUS_LOCKSTATUS: 0,
    RESET_REQ_VALUE: 0x59, MAX_REPEAT: 0x100, KEY_64: 0x00,
    NVMCTRL_CTRLA: 0x00, NVMCTRL_STATUS: 0x02, NVMCTRL_DATAL: 0x06, NVMCTRL_ADDRL: 0x08, NVMCTRL_ADDRH: 0x09,
    NVM_WRITE_PAGE: 0x01, NVM_PAGE_BUFFER_CLR: 0x04, NVM_CHIP_ERASE: 0x05, NVM_WRITE_FUSE: 0x07,
    STATUS_WRITE_ERROR: 2, STATUS_EEPROM_BUSY: 1, STATUS_FLASH_BUSY: 0,
  };
  const KEY_NVM = Array.from("NVMProg ", (c) => c.charCodeAt(0));
  const KEY_CHIPERASE = Array.from("NVMErase", (c) => c.charCodeAt(0));
  const ADDR = { syscfg: 0x0f00, nvmctrl: 0x1000, sigrow: 0x1100, fuses: 0x1280, flash: 0x8000 };

  // Device table of tinyupdi.py: [name, signature, flash size, page size]
  const DEVICES = [
    ["ATtiny202", 0x1e9123, 0x0800, 0x40], ["ATtiny402", 0x1e9227, 0x1000, 0x40], ["ATtiny212", 0x1e9121, 0x0800, 0x40],
    ["ATtiny412", 0x1e9223, 0x1000, 0x40], ["ATtiny204", 0x1e9122, 0x0800, 0x40], ["ATtiny404", 0x1e9226, 0x1000, 0x40],
    ["ATtiny804", 0x1e9325, 0x2000, 0x40], ["ATtiny1604", 0x1e9425, 0x4000, 0x40], ["ATtiny214", 0x1e9120, 0x0800, 0x40],
    ["ATtiny414", 0x1e9222, 0x1000, 0x40], ["ATtiny814", 0x1e9322, 0x2000, 0x40], ["ATtiny1614", 0x1e9422, 0x4000, 0x40],
    ["ATtiny424", 0x1e922c, 0x1000, 0x40], ["ATtiny824", 0x1e9329, 0x2000, 0x40], ["ATtiny1624", 0x1e942a, 0x4000, 0x40],
    ["ATtiny3224", 0x1e9528, 0x8000, 0x80], ["ATtiny406", 0x1e9225, 0x1000, 0x40], ["ATtiny806", 0x1e9324, 0x2000, 0x40],
    ["ATtiny1606", 0x1e9424, 0x4000, 0x40], ["ATtiny416", 0x1e9221, 0x1000, 0x40], ["ATtiny816", 0x1e9321, 0x2000, 0x40],
    ["ATtiny1616", 0x1e9421, 0x4000, 0x40], ["ATtiny3216", 0x1e9521, 0x8000, 0x80], ["ATtiny426", 0x1e922b, 0x1000, 0x40],
    ["ATtiny826", 0x1e9328, 0x2000, 0x40], ["ATtiny1626", 0x1e9429, 0x4000, 0x40], ["ATtiny3226", 0x1e9527, 0x8000, 0x80],
    ["ATtiny417", 0x1e9220, 0x1000, 0x40], ["ATtiny427", 0x1e922a, 0x1000, 0x40], ["ATtiny807", 0x1e9323, 0x2000, 0x40],
    ["ATtiny817", 0x1e9320, 0x2000, 0x40], ["ATtiny827", 0x1e9327, 0x2000, 0x40], ["ATtiny1607", 0x1e9423, 0x4000, 0x40],
    ["ATtiny1617", 0x1e9420, 0x4000, 0x40], ["ATtiny1627", 0x1e9428, 0x4000, 0x40], ["ATtiny3217", 0x1e9522, 0x8000, 0x80],
    ["ATtiny3227", 0x1e9526, 0x8000, 0x80],
  ].map(([name, id, flashSize, pageSize]) => ({ name, id, flashSize, pageSize, series: Number(name[name.length - 2]) }));

  // The fuses of the tinyAVR 0/1/2-series (fuse number = offset from 0x1280)
  const FUSES = [
    { n: 0, name: "WDTCFG", text: "Watchdog period and window" },
    { n: 1, name: "BODCFG", text: "Brown-out detector" },
    { n: 2, name: "OSCCFG", text: "Main clock: 0x01 = 16 MHz, 0x02 = 20 MHz" },
    { n: 4, name: "TCD0CFG", text: "TCD0 outputs (1-series only)", series: [1] },
    { n: 5, name: "SYSCFG0", text: "CRC, UPDI/reset pin, EEPROM save" },
    { n: 6, name: "SYSCFG1", text: "Start-up time" },
    { n: 7, name: "APPEND", text: "End of the application code (in 256-byte blocks)" },
    { n: 8, name: "BOOTEND", text: "End of the boot section (in 256-byte blocks)" },
    { n: 10, name: "LOCKBIT", text: "0xC5 = unlocked, any other value locks the chip" },
  ];

  // Frequencies that the oscillator setting supports, in the search order
  // of tinyupdi.py's trim(): clock prescaler values of the tinyAVR
  const DIVIDERS = [1, 2, 4, 8, 16, 32, 64, 6, 10, 12, 24, 48];
  function trimFor(freq) {
    for (const x of DIVIDERS) {
      if (Math.round(20000000 / x) === freq) return { osc: 20, fuse: 0x02, div: x };
      if (Math.round(16000000 / x) === freq) return { osc: 16, fuse: 0x01, div: x };
    }
    return null;
  }
  function trimFrequencies() {
    const set = new Map();
    for (const x of DIVIDERS) for (const f of [20000000, 16000000]) {
      const v = Math.round(f / x), t = trimFor(v);
      if (!set.has(v)) set.set(v, t);
    }
    return [...set.entries()].sort((a, b) => b[0] - a[0]).map(([freq, t]) => ({ freq, ...t }));
  }

  const hex = (v, n) => "0x" + v.toString(16).padStart(n, "0");
  class UpdiError extends Error {}

  /* ---------- Physical and data link layer ---------- */

  class Programmer {
    constructor(port, baud, timeout) {
      this.port = port;
      this.baud = baud || BAUD;
      this.timeout = timeout || 1000;
      this.flashSize = 0x0800;
      this.pageSize = 64;
      this.now = () => performance.now();   // clock for the timeouts (replaceable in tests)
    }

    async openMain() {
      this.link = new global.SerialLink(this.port, this.baud, { parity: "even", dataBits: 8, stopBits: 2 });
      await this.link.open();
    }

    // Send a double break (two 0x00 at 300 baud) to reset the UPDI port
    async doubleBreak() {
      await this.link.close();
      const tmp = new global.SerialLink(this.port, 300, { parity: "none", dataBits: 8, stopBits: 1 });
      await tmp.open();
      await tmp.write(Uint8Array.from([C.BREAK, C.BREAK]));
      await tmp.read(2, this.timeout);
      await tmp.close();
      await this.openMain();
    }

    // Send bytes and swallow their echo
    async send(bytes) {
      await this.link.write(Uint8Array.from(bytes));
      await this.link.read(bytes.length, this.timeout);
    }
    receive(n) { return this.link.read(n, this.timeout); }

    async ldcs(a) {
      await this.send([C.SYNC, C.LDCS | (a & 0x0f)]);
      const r = await this.receive(1);
      return r.length === 1 ? r[0] : 0;
    }
    async stcs(a, v) { await this.send([C.SYNC, C.STCS | (a & 0x0f), v]); }

    async ack(what) {
      const r = await this.receive(1);
      if (r.length !== 1 || r[0] !== C.ACK) throw new UpdiError(`Failed to communicate with device (${what})`);
    }

    async ld(addr) {
      await this.send([C.SYNC, C.LDS | C.ADDRESS_16 | C.DATA_8, addr & 0xff, (addr >> 8) & 0xff]);
      const r = await this.receive(1);
      if (r.length !== 1) throw new UpdiError("No answer from the chip");
      return r[0];
    }
    async st(addr, v) {
      await this.send([C.SYNC, C.STS | C.ADDRESS_16 | C.DATA_8, addr & 0xff, (addr >> 8) & 0xff]);
      await this.ack("st");
      await this.send([v & 0xff]);
      await this.ack("st");
    }
    async st16(addr, v) {
      await this.send([C.SYNC, C.STS | C.ADDRESS_16 | C.DATA_16, addr & 0xff, (addr >> 8) & 0xff]);
      await this.ack("st");
      await this.send([v & 0xff, (v >> 8) & 0xff]);
      await this.ack("st");
    }
    async ldPtrInc(n) {
      await this.send([C.SYNC, C.LD | C.PTR_INC | C.DATA_8]);
      return this.receive(n);
    }
    async ldPtrInc16(words) {
      await this.send([C.SYNC, C.LD | C.PTR_INC | C.DATA_16]);
      return this.receive(words << 1);
    }
    async stPtr(addr) {
      await this.send([C.SYNC, C.ST | C.PTR_ADDRESS | C.DATA_16, addr & 0xff, (addr >> 8) & 0xff]);
      await this.ack("st_ptr");
    }
    async stPtrInc(data) {
      await this.send([C.SYNC, C.ST | C.PTR_INC | C.DATA_8, data[0]]);
      await this.ack("ACK st_ptr_inc");
      for (let n = 1; n < data.length; n++) {
        await this.send([data[n]]);
        await this.ack("st_ptr_inc");
      }
    }
    // Word writes with response signature disabled (no ACK per word)
    async stPtrInc16(data) {
      const on = 1 << C.CTRLA_IBDLY_BIT, off = on | (1 << C.CTRLA_RSD_BIT);
      await this.stcs(C.CS_CTRLA, off);
      await this.send([C.SYNC, C.ST | C.PTR_INC | C.DATA_16]);
      await this.send(data);
      await this.stcs(C.CS_CTRLA, on);
    }
    async repeat(n) {
      if (n - 1 > C.MAX_REPEAT) throw new UpdiError("Invalid repeat count");
      await this.send([C.SYNC, C.REPEAT | C.REPEAT_BYTE, (n - 1) & 0xff]);
    }
    async key(key) {
      await this.send([C.SYNC, C.KEY | C.KEY_64]);
      await this.send(key.slice().reverse());
    }

    /* ---------- Application layer ---------- */

    async reset(apply) { await this.stcs(C.ASI_RESET_REQ, apply ? C.RESET_REQ_VALUE : 0x00); }
    async inProgMode() { return !!(await this.ldcs(C.ASI_SYS_STATUS) & (1 << C.SYS_STATUS_NVMPROG)); }
    async waitUnlocked(ms) {
      const start = this.now();
      while (!(this.now() - start > ms)) {
        if (!(await this.ldcs(C.ASI_SYS_STATUS) & (1 << C.SYS_STATUS_LOCKSTATUS))) return true;
      }
      return false;
    }
    async enterProgMode() {
      if (await this.inProgMode()) return;
      await this.key(KEY_NVM);
      if (!(await this.ldcs(C.ASI_KEY_STATUS) & (1 << C.KEY_STATUS_NVMPROG))) throw new UpdiError("Key not accepted");
      await this.reset(true);
      await this.reset(false);
      if (!(await this.waitUnlocked(100))) { this.locked = true; throw new UpdiError("Failed to enter NVM programming mode: device is locked"); }
      if (!(await this.inProgMode())) throw new UpdiError("Failed to enter NVM programming mode");
    }
    // Chip erase with the key: removes the lock bits (erases flash and EEPROM)
    async unlock() {
      await this.key(KEY_CHIPERASE);
      if (!(await this.ldcs(C.ASI_KEY_STATUS) & (1 << C.KEY_STATUS_CHIPERASE))) throw new UpdiError("Key not accepted");
      await this.reset(true);
      await this.reset(false);
      if (!(await this.waitUnlocked(500))) throw new UpdiError("Failed to chip erase using key");
      this.locked = false;
      this.unlocked = true;
    }

    // Open the port, reset UPDI and enter programming mode (identify() in
    // tinyupdi.py). allowUnlock: erase a locked chip to get access.
    async connect(allowUnlock) {
      await this.openMain();
      await this.doubleBreak();
      await this.stcs(C.CS_CTRLB, 1 << C.CTRLB_CCDETDIS_BIT);
      await this.stcs(C.CS_CTRLA, 1 << C.CTRLA_IBDLY_BIT);
      if ((await this.ldcs(C.CS_STATUSA)) === 0) {
        await this.link.close();
        throw new UpdiError("No chip answers on UPDI. Check the wiring (TX and RX joined through a resistor to UPDI, GND, power).");
      }
      try {
        await this.enterProgMode();
      } catch (err) {
        try {
          if (!allowUnlock) {
            if (this.locked) throw new UpdiError("The chip is locked. Erase chip unlocks it (this erases flash and EEPROM).");
            throw err;
          }
          await this.unlock();
          if (!(await this.inProgMode())) await this.enterProgMode();
        } catch (e) {
          try { await this.exit(); } catch (x) { /* ignore */ }
          throw e;
        }
      }
      return this;
    }

    // Reset the chip, disable UPDI and close the port
    async exit() {
      await this.reset(true);
      await this.reset(false);
      await this.stcs(C.CS_CTRLB, (1 << C.CTRLB_UPDIDIS_BIT) | (1 << C.CTRLB_CCDETDIS_BIT));
      await this.link.close();
    }

    async readData(addr, size) {
      if (size > C.MAX_REPEAT) throw new UpdiError("Can't read that many bytes in one go");
      await this.stPtr(addr);
      if (size > 1) await this.repeat(size);
      return this.ldPtrInc(size);
    }
    async readDataWords(addr, words) {
      if (words > C.MAX_REPEAT) throw new UpdiError("Can't read that many words in one go");
      await this.stPtr(addr);
      if (words > 1) await this.repeat(words);
      return this.ldPtrInc16(words);
    }
    async writeDataWords(addr, data) {
      if (data.length === 2) return this.st16(addr, data[0] + (data[1] << 8));
      if (data.length > C.MAX_REPEAT << 1) throw new UpdiError("Invalid data length");
      await this.stPtr(addr);
      await this.repeat(data.length >> 1);
      await this.stPtrInc16(data);
    }

    async detect() {
      const sig = await this.readData(ADDR.sigrow, 3);
      this.signature = sig.length === 3 ? (sig[0] << 16) | (sig[1] << 8) | sig[2] : -1;
      const dev = DEVICES.find((d) => d.id === this.signature);
      if (!dev) throw new UpdiError(`Unknown or unsupported device (signature ${sig.length === 3 ? hex(this.signature, 6) : "not readable"})`);
      this.device = dev;
      this.flashSize = dev.flashSize;
      this.pageSize = dev.pageSize;
      return dev;
    }

    // Extra information for the chip panel (not in tinyupdi.py)
    async readDetails() {
      this.revision = await this.ld(ADDR.syscfg + 1);
      this.serial = Array.from(await this.readData(ADDR.sigrow + 3, 10));
      this.fuses = {};
      for (const f of FUSES) {
        if (f.series && !f.series.includes(this.device.series)) continue;
        this.fuses[f.n] = await this.readFuse(f.n);
      }
    }

    async waitNvmReady() {
      const start = this.now();
      while (!(this.now() - start > 10000)) {
        const s = await this.ld(ADDR.nvmctrl + C.NVMCTRL_STATUS);
        if (s & (1 << C.STATUS_WRITE_ERROR)) return false;
        if (!(s & ((1 << C.STATUS_EEPROM_BUSY) | (1 << C.STATUS_FLASH_BUSY)))) return true;
      }
      return false;
    }
    async nvmCommand(cmd) { await this.st(ADDR.nvmctrl + C.NVMCTRL_CTRLA, cmd); }

    async erase() {
      if (!(await this.waitNvmReady())) throw new UpdiError("Timeout waiting for flash ready before erase");
      await this.nvmCommand(C.NVM_CHIP_ERASE);
      if (!(await this.waitNvmReady())) throw new UpdiError("Timeout waiting for flash ready after erase");
    }

    async writeNvm(addr, page) {
      if (!(await this.waitNvmReady())) throw new UpdiError("Timeout waiting for flash ready before page buffer clear");
      await this.nvmCommand(C.NVM_PAGE_BUFFER_CLR);
      if (!(await this.waitNvmReady())) throw new UpdiError("Timeout waiting for flash ready after page buffer clear");
      await this.writeDataWords(addr, page);
      await this.nvmCommand(C.NVM_WRITE_PAGE);
      if (!(await this.waitNvmReady())) throw new UpdiError("Timeout waiting for flash ready after page write");
    }

    padded(data) {
      const len = Math.ceil(data.length / this.pageSize) * this.pageSize;
      const out = new Uint8Array(len).fill(0xff);
      out.set(data);
      return out;
    }

    async flashData(data, progress) {
      if (data.length > this.flashSize) throw new UpdiError("Not enough memory");
      const buf = this.padded(data);
      for (let off = 0; off < buf.length; off += this.pageSize) {
        await this.writeNvm(ADDR.flash + off, buf.subarray(off, off + this.pageSize));
        if (progress) progress(Math.min(1, (off + this.pageSize) / buf.length));
      }
    }

    async verifyData(data, progress) {
      if (data.length > this.flashSize) throw new UpdiError("Not enough memory");
      const pages = Math.ceil(data.length / this.pageSize);
      for (let p = 0; p < pages; p++) {
        const off = p * this.pageSize;
        const r = await this.readDataWords(ADDR.flash + off, this.pageSize >> 1);
        for (let i = 0; i < this.pageSize && off + i < data.length; i++) {
          if (r[i] !== data[off + i]) throw new UpdiError(`Flash verification failure at address ${hex(off + i, 4)}`);
        }
        if (progress) progress((p + 1) / pages);
      }
    }

    readFuse(n) { return this.ld(ADDR.fuses + n); }
    async setFuse(n, v) {
      if (!(await this.waitNvmReady())) throw new UpdiError("Timeout waiting for NVM controller to be ready before fuse write");
      const a = ADDR.fuses + n;
      await this.st(ADDR.nvmctrl + C.NVMCTRL_ADDRL, a & 0xff);
      await this.st(ADDR.nvmctrl + C.NVMCTRL_ADDRH, (a >> 8) & 0xff);
      await this.st(ADDR.nvmctrl + C.NVMCTRL_DATAL, v & 0xff);
      await this.nvmCommand(C.NVM_WRITE_FUSE);
      if (!(await this.waitNvmReady())) throw new UpdiError("Timeout waiting for NVM controller to be ready after fuse write");
    }
    async verifyFuse(n, v) {
      if ((await this.readFuse(n)) !== v) throw new UpdiError(`Fuse ${n} verification failure`);
    }

    async trim(freq) {
      const t = trimFor(freq);
      if (!t) throw new UpdiError("Unsupported frequency");
      await this.setFuse(0x02, t.fuse);
      await this.verifyFuse(0x02, t.fuse);
      return t.osc;
    }
  }

  // The steps of tinyupdi.py's main function.
  // a: { info, erase, flash (Uint8Array), fuses: [[n, value], ...], trim (Hz) }
  async function runActions(prog, a, log, progress) {
    log = log || (() => {});
    try {
      log("Detecting target MCU …");
      const dev = await prog.detect();
      log(`Found ${dev.name} with ${dev.flashSize.toLocaleString("en")} bytes of flash.`);
      if (prog.unlocked) log("The chip was locked and has been erased to unlock it.");

      if (a.info) {
        await prog.readDetails();
        await prog.exit();
        return prog;
      }
      if (a.erase || a.flash) {
        log("Performing chip erase …");
        await prog.erase();
      }
      if (a.flash) {
        log(`Flashing ${a.flash.length.toLocaleString("en")} bytes to ${dev.name} …`);
        await prog.flashData(a.flash, (f) => progress && progress("write", f));
        log("Verifying …");
        await prog.verifyData(a.flash, (f) => progress && progress("verify", f));
        log(`${a.flash.length.toLocaleString("en")} bytes written and verified.`);
      }
      if (a.fuses && a.fuses.length) {
        log("Writing fuses …");
        for (const [n, v] of a.fuses) await prog.setFuse(n, v);
        log("Verifying fuses …");
        for (const [n, v] of a.fuses) await prog.verifyFuse(n, v);
        log("Fuses written and verified.");
      }
      if (a.trim) {
        log(`Setting oscillator for ${a.trim.toLocaleString("en")} Hz …`);
        const osc = await prog.trim(a.trim);
        log(`Oscillator runs at ${osc} MHz with its factory calibration; the firmware sets the prescaler.`);
      }
      await prog.exit();
      return prog;
    } catch (err) {
      try { await prog.exit(); } catch (e) { /* port may be gone */ }
      throw err;
    }
  }

  global.UPDI = { DEVICES, FUSES, BAUD, Programmer, UpdiError, runActions, trimFor, trimFrequencies };
})(typeof window !== "undefined" ? window : globalThis);
