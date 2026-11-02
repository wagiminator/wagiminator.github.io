/* ===================================================================
 * WCH-Link programmer for WCH RISC-V microcontrollers (WebUSB)
 * -------------------------------------------------------------------
 * JavaScript port of rvprog.py v1.12 by Stefan Wagner (MIT License),
 * https://github.com/wagiminator/MCU-Flash-Tools, using the WebUSB API.
 * Commands go to endpoint 1 and are answered on endpoint 0x81; flash
 * loader and firmware are sent as raw data to endpoint 2, the result
 * comes back on endpoint 0x82. Chip tables and loaders: tables.js.
 * Global: RVPROG
 * =================================================================== */
(function (global) {
  "use strict";

  const T = global.RV_TABLES;
  const VENDOR = 0x1a86;
  const PID_RV = 0x8010;               // WCH-Link in RISC-V mode
  const PID_ARM = 0x8012;              // WCH-Link in ARM mode
  const EP_CMD = 1, EP_RAW = 2;        // endpoint numbers (OUT 0x01/0x02, IN 0x81/0x82)
  const PACKET = 1024, TIMEOUT = 5000;
  const FILTERS = [{ vendorId: VENDOR, productId: PID_RV }, { vendorId: VENDOR, productId: PID_ARM }];

  const LINK_NAMES = T.LINK_NAMES;

  const b64 = (s) => (typeof atob === "function" ? Uint8Array.from(atob(s), (c) => c.charCodeAt(0)) : new Uint8Array(Buffer.from(s, "base64")));
  const bytes = (...parts) => Uint8Array.from(parts.flatMap((p) => (typeof p === "number" ? [p] : Array.from(p))));
  const be32 = (v) => [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const hex4 = (v) => "0x" + v.toString(16).padStart(4, "0");

  class ProgError extends Error {}

  /* ---------- USB transport ---------- */

  // WebUSB has no timeouts. A read that times out stays pending and
  // delivers the next packet of that endpoint to the next read.
  class UsbLink {
    constructor(device) {
      this.dev = device;
      this.pending = {};
    }

    async open() {
      const d = this.dev;
      if (!d.opened) await d.open();
      if (!d.configuration) await d.selectConfiguration(1);
      // interface with bulk endpoints 1 (commands) and 2 (raw data)
      let found = null;
      for (const itf of d.configuration.interfaces) {
        const eps = itf.alternates[0].endpoints;
        const has = (n, dir) => eps.some((e) => e.endpointNumber === n && e.direction === dir);
        if (has(EP_RAW, "out") && (has(EP_CMD, "out") || d.productId === PID_ARM)) { found = itf.interfaceNumber; break; }
      }
      if (found === null) throw new ProgError("The WCH-Link does not offer the expected USB interface.");
      this.itf = found;
      try {
        await d.claimInterface(found);
      } catch (err) {
        throw new ProgError("The WCH-Link is in use by another program or has no WinUSB driver (Windows: install it with Zadig).");
      }
    }

    async write(ep, data) {
      const t = this.dev.transferOut(ep, data);
      const r = await withTimeout(t, TIMEOUT, "USB write timed out");
      if (r.status !== "ok") throw new ProgError(`USB write failed (${r.status})`);
    }

    async read(ep, timeout) {
      if (!this.pending[ep]) this.pending[ep] = this.dev.transferIn(ep, PACKET);
      const p = this.pending[ep];
      const r = await withTimeout(p, timeout ?? TIMEOUT, "USB read timed out");
      this.pending[ep] = null;
      if (r.status !== "ok") throw new ProgError(`USB read failed (${r.status})`);
      return new Uint8Array(r.data.buffer, r.data.byteOffset, r.data.byteLength);
    }

    async close() {
      try { await this.dev.releaseInterface(this.itf); } catch (e) { /* ignore */ }
      try { await this.dev.close(); } catch (e) { /* ignore */ }
      this.pending = {};
    }

    // Close and open again: drops USB reads still waiting from the last run
    async reopen() {
      await this.close();
      await this.open();
    }
  }

  function withTimeout(promise, ms, msg) {
    let timer;
    return Promise.race([
      promise.finally(() => clearTimeout(timer)),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new ProgError(msg)), ms); }),
    ]);
  }

  /* ---------- Programmer (class Programmer in rvprog.py) ---------- */

  class Programmer {
    constructor(link, log) {
      this.link = link;
      this.log = log || (() => {});
    }

    // Programmer info (Programmer.__init__)
    async init() {
      this.used = false;
      await this.clearReply();
      const r = await this.command(bytes(0x81, 0x0d, 0x01, 0x01));
      if (r.length < 5 || r[0] !== 0x82) throw new ProgError("Failed to get the WCH-Link info");
      this.linkDevice = r.length > 5 ? r[5] : 0x01;
      this.linkName = LINK_NAMES[this.linkDevice] || `Unknown WCH programmer (code: ${this.linkDevice})`;
      this.linkVerCode = r[3] * 100 + r[4];
      const packed = (r[3] << 4) + r[4];       // firmware v3.0 and later reports e.g. 2.22 for v3.6
      this.linkVersion = packed >= 0x30 ? `${packed >> 4}.${packed & 0x0f}` : `${r[3]}.${r[4]}`;
      this.nrstGpio = null;
      return this;
    }

    async command(stream) {
      await this.link.write(EP_CMD, stream);
      return this.link.read(EP_CMD);
    }

    async clearReply() {
      try { await this.link.read(EP_CMD, 1); } catch (e) { /* nothing waiting */ }
      try { await this.link.read(EP_RAW, 1); } catch (e) { /* nothing waiting */ }
    }

    // Connect to the target MCU and identify it
    async connect() {
      this.chipId = null;
      this.family = null;
      for (let i = 0; i < 3; i++) {
        if (i > 0) {
          this.log("Failed to connect, retrying …");
          await sleep(200);
        }
        const r = await this.command(bytes(0x81, 0x0d, 0x01, 0x02));
        if (r.length < 8 || r[0] !== 0x82) continue;
        this.chipMark = r[3];
        this.chipSeries = r[4];
        this.chipType = r[5];
        this.chipId = (r[4] << 8) + r[5];
        this.chipFamily = this.chipId >> 4;
        break;
      }
      if (this.chipId === null) throw new ProgError("Failed to identify the chip. Check the wiring (SWDIO, GND, power) and try Unbrick.");
      this.family = T.FAMILIES.find((f) => f.id === this.chipFamily) || null;
      if (!this.family) throw new ProgError(`Unsupported chip (ID: ${hex4(this.chipId)}, type: 0x${this.chipMark.toString(16).padStart(2, "0")})`);
      // Unknown package/variant of a known family: use the family settings
      this.device = T.DEVICES.find((d) => d.id === this.chipId) || { name: `${this.family.name} (ID ${hex4(this.chipId)})` };
      this.chipName = this.device.name;
      this.flashSize = this.device.codeSize || this.family.codeSize || 0;
      if (this.family.esig) {
        const r = await this.command(bytes(0x81, 0x11, 0x01, this.chipMark));
        if (r.length >= 4) {
          const size = (r[2] << 8) | r[3];
          if (![0x0000, 0xffff, 0xe339].includes(size)) this.flashSize = size * 1024;   // not programmed
        }
      }
    }

    async unbrick() { await this.command(bytes(0x81, 0x0d, 0x01, 0x0f, 0x09)); }

    // Reattach the MCU (required after changing the read protection)
    async reattach() {
      await this.command(bytes(0x81, 0x0d, 0x01, 0xff));
      await this.command(bytes(0x81, 0x0d, 0x01, 0x02));
    }

    checkProtect() {
      if (this.family.protect === null) throw new ProgError("Read protection is not supported for this MCU");
    }

    // Option bytes for the read protection commands (keep the nRST setting)
    optionBytes() {
      let opt = this.family.protect;
      if (opt && opt.length && this.family.nrst && this.nrstGpio !== null) {
        opt = [this.nrstGpio ? (opt[0] | 0x18) : ((opt[0] & 0xe7) | 0x10), ...opt.slice(1)];
      }
      return opt;
    }

    // Set read protection
    async lock() {
      this.checkProtect();
      const opt = this.optionBytes();
      if (opt.length) await this.command(bytes(0x81, 0x06, 0x08, 0x03, opt));
      else await this.command(bytes(0x81, 0x06, 0x01, 0x03));
      await this.reattach();
    }

    async isLocked() {
      if (this.family.protect === null) return false;
      const r = await this.command(bytes(0x81, 0x06, 0x01, 0x01));
      return r.length >= 4 && r[3] === 0x01;
    }

    // Remove read protection (erases the chip)
    async unlock() {
      this.checkProtect();
      if (await this.isLocked()) {
        const opt = this.optionBytes();
        if (opt.length) await this.command(bytes(0x81, 0x06, 0x08, 0x02, opt));
        else await this.command(bytes(0x81, 0x06, 0x01, 0x02));
        await this.reattach();
      }
    }

    async erase() {
      if (await this.isLocked()) await this.unlock();
      await this.command(bytes(0x81, 0x02, 0x01, 0x01));
      await this.command(bytes(0x81, 0x0d, 0x01, 0x02));
    }

    // nRST pin (PD7) as GPIO (true) or reset pin (false)
    async setNrstAsGpio(gpio) {
      if (!this.family.nrst) throw new ProgError("The reset pin option is not available for this MCU");
      await this.command(bytes(0x81, 0x06, 0x08, 0x02, gpio ? 0xff : 0xf7, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff));
      this.nrstGpio = gpio;
    }

    async exit() {
      await this.command(bytes(0x81, 0x0b, 0x01, 0x01));
      await this.command(bytes(0x81, 0x0d, 0x01, 0xff));
    }

    // Switch the WCH-Link to ARM mode (it disconnects afterwards)
    async armMode() {
      await this.exit();
      await this.link.write(EP_CMD, bytes(0x81, 0xff, 0x01, 0x41));
    }

    static pages(data, size) {
      const n = Math.ceil(data.length / size) || 0;
      const out = [];
      for (let i = 0; i < n; i++) {
        const p = new Uint8Array(size).fill(0xff);
        p.set(data.subarray(i * size, (i + 1) * size));
        out.push(p);
      }
      return out;
    }

    async writeBinaryBlob(addr, blockSize, loader, data, progress, packSize) {
      packSize = packSize || 4096;
      if (addr & (blockSize - 1)) throw new ProgError(`Blob is not ${blockSize} byte aligned`);
      if (this.family.protect !== null) await this.unlock();
      const padded = Math.ceil(data.length / blockSize) * blockSize;
      await this.command(bytes(0x81, 0x01, 0x08, be32(addr), be32(padded)));
      await this.command(bytes(0x81, 0x02, 0x01, 0x05));
      for (const page of Programmer.pages(loader, 128)) await this.link.write(EP_RAW, page);
      let loaded = false;
      for (let i = 0; i < 10 && !loaded; i++) {
        const r = await this.command(bytes(0x81, 0x02, 0x01, 0x07));
        loaded = r[0] === 0x82 && r[1] === 0x02 && r[2] === 0x01 && r[3] === 0x07;
      }
      if (!loaded) throw new ProgError("Failed to load the flash loader");
      await this.command(bytes(0x81, 0x02, 0x01, 0x04));
      const pages = Programmer.pages(data, blockSize);
      const perPack = Math.max(1, Math.floor(packSize / blockSize));
      for (let off = 0; off < pages.length; off += perPack) {
        for (const page of pages.slice(off, off + perPack)) await this.link.write(EP_RAW, page);
        const r = await this.link.read(EP_RAW);
        if (!(r[0] === 0x41 && r[1] === 0x01 && r[2] === 0x01 && r[3] === 0x04)) {
          throw new ProgError(`Failed writing/verifying the data at address 0x${(addr + off * blockSize).toString(16).padStart(8, "0")}`);
        }
        if (progress) progress(Math.min(pages.length, off + perPack) / pages.length);
      }
      try { await this.command(bytes(0x81, 0x02, 0x01, 0x08)); } catch (e) { /* older WCH-Links do not answer */ }
    }

    async flashData(data, progress) {
      if (this.flashSize > 0 && data.length > this.flashSize) throw new ProgError(`Not enough memory: the firmware has ${data.length.toLocaleString("en")} bytes, the chip ${this.flashSize.toLocaleString("en")} bytes of flash`);
      await this.writeBinaryBlob(this.family.codeBase, this.family.blockSize, b64(T.LOADERS[this.family.loader]), data, progress, this.family.packSize);
    }
  }

  // Run actions in the order of rvprog.py's main function.
  // actions: { unbrick, connect, unlock, erase, flash (Uint8Array or prog => Uint8Array),
  //            pinGpio, pinReset, lock, armMode }
  // log(text) reports steps; progress(fraction) while flashing. Returns the programmer.
  async function runActions(prog, actions, log, progress) {
    const a = actions;
    log = log || (() => {});
    // Every call works like a new run of rvprog.py: rvprog.py opens the USB
    // device, clears the receive buffers and asks for the programmer info
    // before it connects to the chip. A run ends with exit(), which detaches
    // the chip; going on with the next run on the same connection without
    // this start sequence made every run after the first one fail (until the
    // WCH-Link was plugged in again, which reconnects the app).
    if (prog.used) {
      await prog.link.reopen();
      await prog.init();
    }
    prog.used = true;
    try {
      if (a.unbrick) {
        log("Unbricking chip …");
        await prog.unbrick();
        log("Chip is unbricked.");
      }
      if (a.unlock || a.lock || a.erase || a.flash || a.pinGpio || a.pinReset || a.connect) {
        log("Connecting to MCU …");
        await prog.connect();
        log(`Connected to ${prog.chipName} with ${prog.flashSize.toLocaleString("en")} bytes of flash.`);
        if ((prog.family.minLink || 0) > prog.linkVerCode) log("Warning: the WCH-Link firmware may be too old for this MCU; update it with the WCH-LinkUtility.");
      }
      if (a.unlock) {
        log("Unlocking chip …");
        await prog.unlock();
        log("Chip is unlocked.");
      }
      if (a.erase) {
        log("Performing whole chip erase …");
        await prog.erase();
        log("Chip is erased.");
      }
      if (a.flash) {
        // a.flash: data, or a function that builds the data for the connected chip
        const data = typeof a.flash === "function" ? a.flash(prog) : a.flash;
        log(`Flashing ${data.length.toLocaleString("en")} bytes to ${prog.chipName} …`);
        await prog.flashData(data, progress);
        log(`${data.length.toLocaleString("en")} bytes written and verified.`);
      }
      if (a.pinGpio) {
        log("Configuring PD7 as GPIO pin …");
        await prog.setNrstAsGpio(true);
        log("PD7 is now a GPIO pin.");
      }
      if (a.pinReset) {
        log("Configuring PD7 as reset pin …");
        await prog.setNrstAsGpio(false);
        log("PD7 is now a reset pin.");
      }
      if (a.lock) {
        log("Locking chip …");
        await prog.lock();
        log("Chip is locked.");
      }
      if (a.armMode) {
        log("Switching WCH-Link to ARM mode …");
        await prog.armMode();
        log("Done: the blue LED on the WCH-Link should light up now.");
        return prog;
      }
      await prog.exit();
      return prog;
    } catch (err) {
      try { await prog.exit(); } catch (e) { /* the link may be gone */ }
      throw err;
    }
  }

  // Switch a WCH-Link in ARM mode (PID 0x8012) to RISC-V mode
  async function rvMode(device) {
    const link = new UsbLink(device);
    await link.open();
    await link.write(EP_RAW, bytes(0x81, 0xff, 0x01, 0x52));
    await link.close();
  }

  /* ---------- Firmware files (shared: /assets/js/firmware.js) ---------- */

  const FW = global.FIRMWARE;
  const parseHex = FW.parseHex, readFirmware = FW.readFirmware;
  const buildImage = (fw, family, flashSize) => FW.buildImage(fw, family ? family.codeBase : null, flashSize);

  global.RVPROG = { VENDOR, PID_RV, PID_ARM, FILTERS, UsbLink, Programmer, ProgError, rvMode, runActions, parseHex, readFirmware, buildImage, TABLES: T };
})(typeof window !== "undefined" ? window : globalThis);
