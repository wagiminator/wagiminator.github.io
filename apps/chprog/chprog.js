/* ===================================================================
 * USB bootloader programmer for WCH microcontrollers (WebUSB)
 * -------------------------------------------------------------------
 * JavaScript port of chprog.py v2.6 by Stefan Wagner (MIT License),
 * https://github.com/wagiminator/MCU-Flash-Tools, which is based on
 * isp55e0 (Frank Zago), chflasher (Aaron Christophel) and wchprog
 * (juliuswwj). Talks to the factory bootloader (versions 2.x) of
 * CH55x, CH56x, CH57x, CH58x, CH59x, CH64x, CH32F, CH32V, CH32X and
 * CH32L chips over bulk endpoint 2 (OUT 0x02, IN 0x82). Chip IDs and
 * family parameters (tables.js) were checked against wchisp in chprog.py.
 * Global: CHPROG
 * =================================================================== */
(function (global) {
  "use strict";

  const T = global.CH_TABLES;
  const FILTERS = [{ vendorId: 0x4348, productId: 0x55e0 }, { vendorId: 0x1a86, productId: 0x55e0 }];
  const EP = 2, PACKET = 64, TIMEOUT = 5000, TIMEOUT_ERASE = 10000, TIMEOUT_REBOOT = 500, KEY_LEN = 8;

  const CMD = { CHIP_TYPE: 0xa1, REBOOT: 0xa2, KEY_SET: 0xa3, CODE_ERASE: 0xa4, CODE_WRITE: 0xa5, CODE_VERIFY: 0xa6, CONFIG_READ: 0xa7, CONFIG_WRITE: 0xa8 };
  const STR_CHIP_DETECT = [0xa1, 0x12, 0x00, 0x52, 0x11, ...Array.from("MCU ISP & WCH.CN", (c) => c.charCodeAt(0))];
  const STR_CONFIG_READ = [0xa7, 0x02, 0x00, 0x1f, 0x00];
  const STR_REBOOT = [0xa2, 0x01, 0x00, 0x01];

  const le32 = (v) => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255];
  const hex4 = (v) => "0x" + v.toString(16).padStart(4, "0");

  class ProgError extends Error {}

  function withTimeout(promise, ms, msg) {
    let timer;
    return Promise.race([
      promise.finally(() => clearTimeout(timer)),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new ProgError(msg)), ms); }),
    ]);
  }

  /* ---------- USB transport ---------- */

  // A read that times out stays pending and delivers the next packet later
  class UsbLink {
    constructor(device) { this.dev = device; this.pending = null; }

    async open() {
      const d = this.dev;
      if (!d.opened) await d.open();
      try { await d.selectConfiguration(1); } catch (e) {
        if (!d.configuration) throw new ProgError("Failed to access the USB device. Check the permissions (Linux: udev rules).");
      }
      const itf = d.configuration.interfaces.find((i) => i.alternates[0].endpoints.some((e) => e.endpointNumber === EP && e.direction === "out"));
      if (!itf) throw new ProgError("The device does not offer the bootloader interface.");
      this.itf = itf.interfaceNumber;
      try { await d.claimInterface(this.itf); } catch (e) {
        throw new ProgError("The bootloader is in use by another program or has no WinUSB driver (Windows: install it with Zadig).");
      }
    }

    async write(data) {
      const r = await withTimeout(this.dev.transferOut(EP, Uint8Array.from(data)), TIMEOUT, "USB write timed out");
      if (r.status !== "ok") throw new ProgError(`USB write failed (${r.status})`);
    }

    // Returns the reply or null if none arrives in time
    async read(timeout) {
      if (!this.pending) this.pending = this.dev.transferIn(EP, PACKET);
      try {
        const r = await withTimeout(this.pending, timeout ?? TIMEOUT, "timeout");
        this.pending = null;
        if (r.status !== "ok") return null;
        return new Uint8Array(r.data.buffer, r.data.byteOffset, r.data.byteLength);
      } catch (e) {
        if (e instanceof ProgError && e.message === "timeout") return null;
        this.pending = null;
        throw e;
      }
    }

    async close() {
      try { await this.dev.releaseInterface(this.itf); } catch (e) { /* ignore */ }
      try { await this.dev.close(); } catch (e) { /* ignore */ }
    }
  }

  /* ---------- Programmer (class Programmer in chprog.py) ---------- */

  class Programmer {
    constructor(link) {
      this.link = link;
      this.device = null;
      this.uidLen = 8;
      this.minErase = 8;
      this.lastWrite = false;
      this.wpRemove = false;
      this.xorKey = new Uint8Array(KEY_LEN);
    }

    async init() {
      await this.link.read(1);              // clear the receive buffer
      return this;
    }

    async command(stream, timeout) {
      await this.link.write(stream);
      return this.link.read(timeout);
    }

    // Chip by ID, or the default of its family (type 0xff) for unknown types
    static findDevice(family, type) {
      const id = (family << 8) + type;
      return T.DEVICES.find((d) => d.id === id) || T.DEVICES.find((d) => d.id === (family << 8) + 0xff) || null;
    }

    // Read chip type and configuration only (changes nothing on the chip;
    // detect() also sets the key and may remove the read protection)
    async identify() {
      const ident = await this.command(STR_CHIP_DETECT);
      if (!ident || ident.length !== 6) throw new ProgError("Failed to identify the chip");
      const cfg = await this.command(STR_CONFIG_READ);
      if (!cfg || cfg.length !== 30) throw new ProgError("Failed to read the chip configuration");
      const id = (ident[5] << 8) + ident[4];
      const dev = Programmer.findDevice(ident[5], ident[4]);
      const uidLen = T.UID4.includes(ident[5]) ? 4 : 8;
      return {
        id, device: dev, name: dev ? dev.name : `Unknown chip (ID ${hex4(id)})`,
        bootloader: `${cfg[19]}.${cfg[20]}.${cfg[21]}`,
        uid: Array.from(cfg.subarray(22, 22 + uidLen)),
        protected: T.WPREMOVE.includes(ident[5]) && cfg[6] === 0xff,
      };
    }

    // Detect, identify and set up the chip
    async detect() {
      const ident = await this.command(STR_CHIP_DETECT);
      if (!ident || ident.length !== 6) throw new ProgError("Failed to identify the chip");
      const cfg = await this.command(STR_CONFIG_READ);
      if (!cfg || cfg.length !== 30) throw new ProgError("Failed to read the chip configuration");

      this.configData = Uint8Array.from(cfg.subarray(6, 18));
      this.bootloader = `${cfg[19]}.${cfg[20]}.${cfg[21]}`;
      this.chipType = ident[4];
      this.chipFamily = ident[5];
      this.chipId = (this.chipFamily << 8) + this.chipType;
      this.device = Programmer.findDevice(this.chipFamily, this.chipType);
      if (!this.device) throw new ProgError(`Unsupported chip (ID: ${hex4(this.chipId)})`);

      this.chipName = this.device.name;
      this.codeFlashSize = this.device.codeSize;
      this.dataFlashSize = this.device.dataSize;
      if (T.UID4.includes(this.chipFamily)) this.uidLen = 4;
      if (T.LASTWRITE.includes(this.chipFamily)) this.lastWrite = true;
      if (T.WPREMOVE.includes(this.chipFamily)) this.wpRemove = true;
      if (T.MINERASE4.includes(this.chipFamily)) this.minErase = 4;
      this.chipUid = Uint8Array.from(cfg.subarray(22, 22 + this.uidLen));

      // Local encryption key from the chip's unique ID
      let sum = 0;
      for (let x = 0; x < this.uidLen; x++) sum += this.chipUid[x];
      for (let x = 0; x < KEY_LEN - 1; x++) this.xorKey[x] = sum & 0xff;
      this.xorKey[KEY_LEN - 1] = (sum + this.chipType) & 0xff;

      await this.sendKey();

      // Remove read protection
      this.unlocked = false;
      if (this.wpRemove && this.configData[0] === 0xff) {
        this.configData[0] = 0xa5;
        await this.command([0xa8, 0x0e, 0x00, 0x07, 0x00, ...this.configData]);
        this.unlocked = true;
      }
      if (this.chipId === 0x1379) {
        this.configData[8] &= 0x7f;
        await this.command([0xa8, 0x0e, 0x00, 0x07, 0x00, ...this.configData]);
      }
    }

    // Send the encryption key (the key seed is zero, the bootloader derives
    // the key from the chip UID the same way)
    async sendKey() {
      let sum = 0;
      for (let x = 0; x < KEY_LEN; x++) sum += this.xorKey[x];
      const reply = await this.command([CMD.KEY_SET, 0x1e, 0x00, ...new Array(0x1e).fill(0)]);
      if (!reply || reply[4] !== (sum & 0xff)) throw new ProgError("Failed to set the encryption key");
    }

    notEnough(size) {
      return new ProgError(`Not enough memory (${size.toLocaleString("en")} bytes, the chip has ${this.codeFlashSize.toLocaleString("en")} bytes)`);
    }

    async erase(size) {
      if (size > this.codeFlashSize) throw this.notEnough(size);
      size = Math.floor((size + 1023) / 1024);
      if (size < this.minErase) size = this.minErase;
      const reply = await this.command([CMD.CODE_ERASE, 0x04, 0x00, size & 0xff, size >> 8, 0x00, 0x00], TIMEOUT_ERASE);
      if (!reply || reply[4] !== 0x00) throw new ProgError("Failed to erase the chip");
    }

    async flash(data, progress) {
      await this.erase(data.length);
      await this.writeFlash(data, CMD.CODE_WRITE, progress);
    }

    async verify(data, progress) {
      if (data.length > this.codeFlashSize) throw this.notEnough(data.length);
      await this.sendKey();
      await this.writeFlash(data, CMD.CODE_VERIFY, progress);
    }

    // Reboot (old bootloaders do not reply)
    async exit() {
      await this.command(STR_REBOOT, TIMEOUT_REBOOT);
    }

    // Write or verify: encrypted data in packets of 56 bytes
    async writeFlash(data, mode, progress) {
      const padded = Math.ceil(data.length / KEY_LEN) * KEY_LEN;
      const buf = new Uint8Array(padded).fill(0xff);
      buf.set(data);
      for (let x = 0; x < buf.length; x++) buf[x] ^= this.xorKey[x % KEY_LEN];

      let rest = buf.length, offset = 0;
      while (rest > 0) {
        const len = Math.min(rest, 0x38);
        const reply = await this.command([mode, len + 5, 0, ...le32(offset), rest & 0xff, ...buf.subarray(offset, offset + len)]);
        const at = `offset 0x${offset.toString(16).padStart(8, "0")}`;
        if (!reply) throw new ProgError(`No reply from the bootloader at ${at}`);
        if (mode === CMD.CODE_WRITE) {
          if (![0x00, 0xfe, 0xf5].includes(reply[4])) throw new ProgError(`Failed to write at ${at}`);
        } else if (reply[4] !== 0x00) {
          throw new ProgError(`Failed to verify at ${at}`);
        }
        offset += len;
        rest -= len;
        if (progress) progress(offset / buf.length);
      }
      // Some chips need a last empty write
      if (this.lastWrite && mode === CMD.CODE_WRITE) await this.command([mode, 5, 0, ...le32(offset), 0x00]);
    }
  }

  // The steps of chprog.py's main function: detect, flash, verify, reboot.
  // data: firmware bytes, or a function that builds them for the detected chip.
  async function program(prog, data, { log, progress } = {}) {
    log = log || (() => {});
    log("Detecting chip …");
    await prog.detect();
    log(`Found ${prog.chipName} with bootloader v${prog.bootloader}.`);
    if (prog.unlocked) log("Read protection removed.");
    if (typeof data === "function") data = data(prog);
    log(`Flashing ${data.length.toLocaleString("en")} bytes to ${prog.chipName} …`);
    await prog.flash(data, (f) => progress && progress("write", f));
    log(`Verifying ${data.length.toLocaleString("en")} bytes …`);
    await prog.verify(data, (f) => progress && progress("verify", f));
    await prog.exit();
    log("Flashed and verified; the chip restarts with the new firmware.");
    return prog;
  }

  global.CHPROG = { FILTERS, UsbLink, Programmer, ProgError, program, TABLES: T };
})(typeof window !== "undefined" ? window : globalThis);
