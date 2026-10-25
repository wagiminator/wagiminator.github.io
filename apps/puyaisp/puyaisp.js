/* ===================================================================
 * UART/HID bootloader programmer for PUYA PY32 microcontrollers
 * -------------------------------------------------------------------
 * JavaScript port of puyaisp.py v1.4 by Stefan Wagner (MIT License),
 * https://github.com/wagiminator/MCU-Flash-Tools. Talks to the factory
 * bootloader of PY32F0xx (and PY32F07x/F040) chips through a
 * USB-to-serial converter (Web Serial, 8E1) or, for chips with USB HID
 * bootloader, through WebHID (64 byte reports).
 * Differences to puyaisp.py:
 * - verify compares every byte (puyaisp.py compares the sets of byte
 *   values only: set(flash) != set(data))
 * - the bootloader version shows the low nibble in full (ver & 0x0f)
 * - a NACK on the sync byte counts as "already synchronized", so the
 *   chip need not be reset between two actions
 * Global: PUYA
 * =================================================================== */
(function (global) {
  "use strict";

  const CMD = { GET: 0x00, VER: 0x01, PID: 0x02, READ: 0x11, WRITE: 0x31, ERASE: 0x44, GO: 0x21, R_UNLOCK: 0x92 };
  const ACK = 0x79, NACK = 0x1f, SYNCH = 0x7f;
  const BLOCK = 128, CODE_ADDR = 0x08000000, DEFAULT_PID = 0x440;
  const HID_FILTER = { vendorId: 0xffff, productId: 0x0448 }, REPORT = 64;

  // Option byte layout by bootloader PID (PY_CHIP_OPTIONS)
  const CHIPS = {
    0x440: {
      name: "PY32F0xx", optionAddr: 0x1fff0e80,
      optionDefault: [0xaa, 0xbe, 0x55, 0x41, 0xff, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x00, 0x00],
      optionNrst: 0x40, optionComp: true, optionWords: [0, 4, 12],
    },
    0x448: {
      name: "PY32F07x/F040-E", optionAddr: 0x1fff3100,
      optionDefault: [0xaa, 0xd8, ...new Array(6).fill(0xff), 0x00, 0x00, ...new Array(14).fill(0xff), 0xff, 0xff, ...new Array(6).fill(0xff)],
      optionNrst: 0x20, optionComp: false, optionWords: [0, 8, 24],
    },
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const hex = (v, n) => "0x" + v.toString(16).padStart(n, "0");
  class IspError extends Error {}

  /* ---------- Transports ---------- */

  // USB-to-serial converter via Web Serial (class Programmer in puyaisp.py)
  class SerialTransport {
    constructor(port, baud, timeout) {
      this.link = new global.SerialLink(port, baud || 115200, { parity: "even", dataBits: 8, stopBits: 1 });
      this.timeout = timeout || 1000;
      this.name = "USB-to-serial converter";
    }
    async open() { await this.link.open(); }
    async write(bytes) { await this.link.write(Uint8Array.from(bytes)); }
    async read(n) { return this.link.read(n, this.timeout); }
    flush() { this.link.flushInput(); }
    // Control lines of a CH340X wired to nRST and BOOT0 start the bootloader
    async boot() {
      await this.link.setSignals({ rts: false });
      await this.link.setSignals({ dtr: false });
      await this.link.setSignals({ rts: true });
      await sleep(10);
      await this.link.setSignals({ rts: false });
      await sleep(10);
    }
    async readInfoResponse() {
      const size = await this.read(1);
      if (!size.length) throw new IspError("Failed to read info");
      const rest = await this.read(size[0] + 1);
      const ack = await this.read(1);
      return Uint8Array.from([...size, ...rest, ...ack]);
    }
    async disconnect(reset) {
      await this.link.setSignals({ dtr: true });
      if (reset) {
        await this.link.setSignals({ rts: true });
        await sleep(10);
        await this.link.setSignals({ rts: false });
      }
      await this.link.close();
    }
  }

  // USB HID bootloader via WebHID (class HIDProgrammer in puyaisp.py)
  class HidTransport {
    constructor(device, timeout) {
      this.dev = device;
      this.timeout = timeout || 1000;
      this.reports = [];
      this.waiter = null;
      this.name = `USB HID ${device.vendorId.toString(16).padStart(4, "0")}:${device.productId.toString(16).padStart(4, "0")}`;
      this.onReport = (ev) => {
        this.reports.push(new Uint8Array(ev.data.buffer, ev.data.byteOffset, ev.data.byteLength));
        if (this.waiter) { const w = this.waiter; this.waiter = null; w(); }
      };
    }
    async open() {
      if (!this.dev.opened) await this.dev.open();
      this.dev.addEventListener("inputreport", this.onReport);
    }
    async nextReport(timeout) {
      if (!this.reports.length) {
        await new Promise((resolve) => {
          const t = setTimeout(() => { this.waiter = null; resolve(); }, timeout);
          this.waiter = () => { clearTimeout(t); resolve(); };
        });
      }
      return this.reports.shift() || null;
    }
    async writeReport(data) {
      const r = new Uint8Array(REPORT);
      r.set(data.slice(0, REPORT));
      await this.dev.sendReport(0, r);
    }
    async write(bytes) {
      const d = Array.from(bytes);
      for (let i = 0; i < d.length; i += REPORT) await this.writeReport(d.slice(i, i + REPORT));
    }
    async read(n) {
      const out = [];
      while (out.length < n) {
        const r = await this.nextReport(this.timeout);
        if (!r) break;
        out.push(...r.subarray(0, n - out.length));
      }
      return Uint8Array.from(out);
    }
    flush() { this.reports = []; }
    async boot() {
      // drain pending reports, then send a report full of sync bytes
      for (let i = 0; i < 8; i++) { if (!(await this.nextReport(10))) break; }
      await this.writeReport(new Array(REPORT).fill(SYNCH));
    }
    async readInfoResponse() {
      const r = await this.nextReport(this.timeout);
      if (!r) throw new IspError("Failed to read info");
      return r;
    }
    async disconnect() {
      this.dev.removeEventListener("inputreport", this.onReport);
      try { await this.dev.close(); } catch (e) { /* ignore */ }
    }
  }

  /* ---------- Programmer ---------- */

  class Programmer {
    constructor(transport) {
      this.t = transport;
      this.chip = CHIPS[DEFAULT_PID];
    }

    // Enter the bootloader and synchronize
    async connect() {
      const t = this.t;
      await t.open();
      if (t instanceof HidTransport) {
        await t.boot();
        if (!(await this.checkReply())) { await t.disconnect(false); throw new IspError("No MCU in HID boot mode found"); }
        return this;
      }
      await t.boot();
      t.flush();
      await t.write([SYNCH]);
      const r = await t.read(1);
      if (r.length === 1 && (r[0] === ACK || r[0] === NACK)) { this.resynced = r[0] === NACK; return this; }
      await t.link.close();
      throw new IspError("No MCU in boot mode found. Check the wiring (RX, TX, GND) and put the chip into bootloader mode.");
    }

    async checkReply() {
      const r = await this.t.read(1);
      return r.length === 1 && r[0] === ACK;
    }

    async command(c) {
      await this.t.write([c, c ^ 0xff]);
      if (!(await this.checkReply())) throw new IspError(`Device has not acknowledged the command ${hex(c, 2)}`);
    }

    async address(addr) {
      const s = [(addr >>> 24) & 255, (addr >>> 16) & 255, (addr >>> 8) & 255, addr & 255];
      await this.t.write([...s, s[0] ^ s[1] ^ s[2] ^ s[3]]);
      if (!(await this.checkReply())) throw new IspError("Failed to send address");
    }

    async reset() { await this.t.disconnect(true); }

    // Start the firmware and disconnect
    async run() {
      await this.command(CMD.GO);
      await this.address(CODE_ADDR);
      await this.t.disconnect(false);
    }

    async infoStream(c) {
      await this.command(c);
      const r = await this.t.readInfoResponse();
      const size = r[0];
      if (r.length <= size + 2 || r[size + 2] !== ACK) throw new IspError("Failed to read info");
      return r.subarray(1, size + 2);
    }

    async readInfo() {
      this.ver = (await this.infoStream(CMD.GET))[0];
      this.verStr = `${(this.ver >> 4).toString(16)}.${(this.ver & 0x0f).toString(16)}`;
      const p = await this.infoStream(CMD.PID);
      this.pid = p.reduce((a, b) => (a << 8) | b, 0);
      if (CHIPS[this.pid]) this.chip = CHIPS[this.pid];
      this.known = !!CHIPS[this.pid];
    }

    async readOption() {
      try {
        this.option = Array.from(await this.readFlash(this.chip.optionAddr, this.chip.optionDefault.length));
      } catch (e) {
        this.lockedRead = true;
        throw new IspError("Chip is locked. Unlock it first (this erases it).");
      }
      this.decodeOption();
    }

    // OPTR, SDKR and WRPR of the current option bytes
    decodeOption() {
      const [o, s, w] = this.chip.optionWords, b = this.option;
      this.optionWords = { OPTR: (b[o] << 8) + b[o + 1], SDKR: (b[s] << 8) + b[s + 1], WRPR: (b[w] << 8) + b[w + 1] };
      this.optionStr = `OPTR: ${hex(this.optionWords.OPTR, 4)}, SDKR: ${hex(this.optionWords.SDKR, 4)}, WRPR: ${hex(this.optionWords.WRPR, 4)}`;
      return this.optionWords;
    }

    async writeOption() { await this.writeFlash(this.chip.optionAddr, Uint8Array.from(this.option)); }
    resetOption() { this.option = this.chip.optionDefault.slice(); }
    lock() {
      this.option[0] = 0x55;
      if (this.chip.optionComp) this.option[2] = 0xaa;
    }
    nrstToGpio() {
      this.option[1] |= this.chip.optionNrst;
      if (this.chip.optionComp) this.option[3] &= this.chip.optionNrst ^ 0xff;
    }
    nrstToReset() {
      this.option[1] &= this.chip.optionNrst ^ 0xff;
      if (this.chip.optionComp) this.option[3] |= this.chip.optionNrst;
    }

    // Remove read protection (erases the chip)
    async unlock() {
      await this.command(CMD.R_UNLOCK);
      if (!(await this.checkReply())) throw new IspError("Failed to unlock chip");
      this.unlocked = true;
    }

    async erase() {
      await this.command(CMD.ERASE);
      await this.t.write([0xff, 0xff]);
      await this.t.write([0x00]);
      if (!(await this.checkReply())) throw new IspError("Failed to erase chip");
    }

    async readFlash(addr, size, progress) {
      const out = [];
      while (size > 0) {
        const n = Math.min(size, BLOCK);
        await this.command(CMD.READ);
        await this.address(addr);
        await this.command(n - 1);
        const block = await this.t.read(n);
        out.push(...block);
        if (progress) progress(block.length);
        addr += n;
        size -= n;
      }
      return Uint8Array.from(out);
    }

    async writeFlash(addr, data, progress) {
      let pos = 0;
      while (pos < data.length) {
        const n = Math.min(data.length - pos, BLOCK);
        const block = data.subarray(pos, pos + n);
        let parity = n - 1;
        for (const b of block) parity ^= b;
        await this.command(CMD.WRITE);
        await this.address(addr);
        await this.t.write([n - 1]);
        await this.t.write([...block, parity]);
        if (!(await this.checkReply())) throw new IspError(`Failed to write to address ${hex(addr, 8)}`);
        if (progress) progress(n);
        pos += n;
        addr += n;
      }
    }

    // Verify every byte
    async verifyFlash(addr, data, progress) {
      const flash = await this.readFlash(addr, data.length, progress);
      if (flash.length !== data.length) throw new IspError("Verification failed: the chip sent too few bytes");
      for (let i = 0; i < data.length; i++) {
        if (flash[i] !== data[i]) throw new IspError(`Verification failed at address ${hex(addr + i, 8)}`);
      }
    }
  }

  // The steps of puyaisp.py's main function.
  // actions: { unlock, erase, flash (Uint8Array), rstOption, nrstGpio, nrstReset, lock, info }
  async function runActions(prog, a, log, progress) {
    log = log || (() => {});
    try {
      log("Getting chip info …");
      await prog.readInfo();
      if (prog.known) log(`Found ${prog.chip.name} with bootloader v${prog.verStr}.`);
      else log(`Warning: the chip with PID ${hex(prog.pid, 4)} is not a known PY32.`);

      if (a.unlock) {
        log("Unlocking chip …");
        await prog.unlock();
        log("Chip is unlocked (and erased). Other options are ignored.");
        await prog.reset();
        return prog;
      }

      log("Reading option bytes …");
      await prog.readOption();
      log(prog.optionStr + ".");

      if (a.info) {                       // only show the info; stay in the bootloader
        await prog.t.disconnect(false);
        return prog;
      }

      if (a.erase || a.flash) {
        log("Performing chip erase …");
        await prog.erase();
        log("Chip is erased.");
      }

      if (a.flash) {
        const data = a.flash;
        log(`Writing ${data.length.toLocaleString("en")} bytes …`);
        let done = 0;
        await prog.writeFlash(CODE_ADDR, data, (n) => { done += n; if (progress) progress("write", done / data.length); });
        log("Verifying …");
        done = 0;
        await prog.verifyFlash(CODE_ADDR, data, (n) => { done += n; if (progress) progress("verify", done / data.length); });
        log(`${data.length.toLocaleString("en")} bytes written and verified.`);
      }

      if (prog.known && (a.rstOption || a.nrstGpio || a.nrstReset || a.lock)) {
        if (a.rstOption) { log("Setting option bytes to default values …"); prog.resetOption(); }
        if (a.nrstGpio) { log("Setting the nRST pin as GPIO …"); prog.nrstToGpio(); }
        if (a.nrstReset) { log("Setting the nRST pin as RESET …"); prog.nrstToReset(); }
        if (a.lock) { log("Setting read protection …"); prog.lock(); }
        log("Writing option bytes …");
        await prog.writeOption();
        log("Option bytes written.");
        await prog.reset();
      } else {
        await prog.run();
      }
      return prog;
    } catch (err) {
      try { await prog.reset(); } catch (e) { /* port may be gone */ }
      throw err;
    }
  }

  global.PUYA = { CHIPS, CODE_ADDR, HID_FILTER, SerialTransport, HidTransport, Programmer, IspError, runActions };
})(typeof window !== "undefined" ? window : globalThis);
