/* ===================================================================
 * UART/HID bootloader programmer for PUYA PY32 microcontrollers
 * -------------------------------------------------------------------
 * JavaScript port of puyaisp.py v1.5 by Stefan Wagner (MIT License),
 * https://github.com/wagiminator/MCU-Flash-Tools. Talks to the factory
 * bootloader of PY32 chips (PY32F002A/F003/F030, PY32F07x/F040,
 * PY32F403/F303) through a USB-to-serial converter (Web Serial, 8E1)
 * or, for chips with USB HID bootloader, through WebHID (64 byte
 * reports). The chip is identified by the PID of its bootloader; other
 * PY32 with the same protocol can be flashed, but their option bytes
 * are not touched.
 * Global: PUYA
 * =================================================================== */
(function (global) {
  "use strict";

  const CMD = { GET: 0x00, VER: 0x01, PID: 0x02, READ: 0x11, WRITE: 0x31, ERASE: 0x44, GO: 0x21, R_UNLOCK: 0x92 };
  const ACK = 0x79, NACK = 0x1f, BUSY = 0xaa, SYNCH = 0x7f;
  const BLOCK = 128, CODE_ADDR = 0x08000000, DEFAULT_PID = 0x440, ERASE_TIMEOUT = 10000;
  const HID_FILTER = { vendorId: 0xffff, productId: 0x0448 }, REPORT = 64;

  // Chip profiles by bootloader PID (PY_CHIP_OPTIONS of puyaisp.py)
  //   optionWords:   [name, byte offset] of the 32-bit option words, OPTR first
  //                  (lower half: value, upper half: complement)
  //   optionDefault: [byte offset, 16-bit production value] of the option words
  //   optionNrst:    NRST_MODE bit in OPTR (null: not configurable)
  const CHIPS = {
    0x440: {
      name: "PY32F002A/F003/F030", flashSize: 64 * 1024, uidAddr: 0x1fff0e00,
      optionAddr: 0x1fff0e80, optionSize: 16,
      optionWords: [["OPTR", 0], ["SDKR", 4], ["WRPR", 12]],
      optionDefault: [[0, 0xbeaa], [4, 0x00ff], [12, 0xffff]],
      optionNrst: 0x4000,
      pins: "PA2/PA3, PA9/PA10 or PA14/PA15",
    },
    0x448: {
      name: "PY32F07x/F040", flashSize: 128 * 1024, uidAddr: 0x1fff3000,
      optionAddr: 0x1fff3100, optionSize: 32,
      optionWords: [["OPTR", 0], ["SDKR", 8], ["WRPR", 24]],
      optionDefault: [[0, 0xd8aa], [8, 0x001f], [24, 0xffff]],
      optionNrst: 0x2000,
      pins: "PA9/PA10 or PA14/PA15",
    },
    0x413: {
      name: "PY32F403/F303", flashSize: 512 * 1024, uidAddr: 0x1fff5800,
      optionAddr: 0x1fff5000, optionSize: 16,
      optionWords: [["OPTR", 0], ["WRPR", 12]],
      optionDefault: [[0, 0x70aa], [12, 0x0fff]],
      optionNrst: null,
      pins: "PA9/PA10 or PB10/PB11",
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

    async getReply() {
      const r = await this.t.read(1);
      return r.length === 1 ? r[0] : null;
    }

    async checkReply() { return (await this.getReply()) === ACK; }

    // Wait for the reply of a long lasting operation (erase), skip BUSY bytes
    async waitReply(timeout) {
      const end = performance.now() + timeout;
      while (performance.now() < end) {
        const r = await this.getReply();
        if (r === BUSY || r === null) continue;
        return r === ACK;
      }
      return false;
    }

    async command(c) {
      await this.t.write([c, c ^ 0xff]);
      if (!(await this.checkReply())) throw new IspError(`Device has not acknowledged the command ${hex(c, 2)}`);
    }

    async address(addr) {
      const s = [(addr >>> 24) & 255, (addr >>> 16) & 255, (addr >>> 8) & 255, addr & 255];
      await this.t.write([...s, s[0] ^ s[1] ^ s[2] ^ s[3]]);
      if (!(await this.checkReply())) throw new IspError(`Failed to send address ${hex(addr, 8)}`);
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
      this.known = !!CHIPS[this.pid];
      if (this.known) this.chip = CHIPS[this.pid];
    }

    // Read the option bytes (the bootloader refuses Read Memory on a locked chip)
    async readOption() {
      try {
        await this.command(CMD.READ);
      } catch (e) {
        this.lockedRead = true;
        throw new IspError("Chip is locked. Unlock it first (this erases it).");
      }
      const size = this.chip.optionSize;
      await this.address(this.chip.optionAddr);
      await this.command(size - 1);
      const o = await this.t.read(size);
      if (o.length !== size) throw new IspError("Failed to read the option bytes");
      this.option = Array.from(o);
      this.decodeOption();
    }

    // 16-bit value of an option word (lower half of the 32-bit word)
    getOptWord(offset) { return this.option[offset] + (this.option[offset + 1] << 8); }
    // Set the 16-bit value of an option word together with its complement (upper half)
    setOptWord(offset, value) {
      this.option[offset] = value & 0xff;
      this.option[offset + 1] = (value >> 8) & 0xff;
      this.option[offset + 2] = ~value & 0xff;
      this.option[offset + 3] = (~value >> 8) & 0xff;
    }
    optrOffset() { return this.chip.optionWords[0][1]; }

    // Values of the option words, e.g. { OPTR: 0xbeaa, SDKR: 0x00ff, WRPR: 0xffff }
    decodeOption() {
      this.optionWords = {};
      for (const [name, offset] of this.chip.optionWords) this.optionWords[name] = this.getOptWord(offset);
      this.optionStr = this.chip.optionWords.map(([name, offset]) => `${name}: ${hex(this.getOptWord(offset), 4)}`).join(", ");
      return this.optionWords;
    }
    readProtected() { return (this.getOptWord(this.optrOffset()) & 0xff) !== 0xaa; }
    nrstIsGpio() { return this.chip.optionNrst ? !!(this.getOptWord(this.optrOffset()) & this.chip.optionNrst) : null; }

    async writeOption() { await this.writeFlash(this.chip.optionAddr, Uint8Array.from(this.option)); }
    // Default values of the defined words (reserved bytes are kept)
    resetOption() { for (const [offset, value] of this.chip.optionDefault) this.setOptWord(offset, value); }
    lock() {
      const o = this.optrOffset();
      this.setOptWord(o, (this.getOptWord(o) & 0xff00) | 0x55);
    }
    checkNrst() { if (!this.chip.optionNrst) throw new IspError("The nRST pin of this chip cannot be configured"); }
    nrstToGpio() {
      this.checkNrst();
      const o = this.optrOffset();
      this.setOptWord(o, this.getOptWord(o) | this.chip.optionNrst);
    }
    nrstToReset() {
      this.checkNrst();
      const o = this.optrOffset();
      this.setOptWord(o, this.getOptWord(o) & ~this.chip.optionNrst & 0xffff);
    }

    // Remove read protection (erases the chip)
    async unlock() {
      await this.command(CMD.R_UNLOCK);
      if (!(await this.waitReply(ERASE_TIMEOUT))) throw new IspError("Failed to unlock chip");
      this.unlocked = true;
    }

    async erase() {
      await this.command(CMD.ERASE);
      await this.t.write([0xff, 0xff]);
      await this.t.write([0x00]);
      if (!(await this.waitReply(ERASE_TIMEOUT))) throw new IspError("Failed to erase chip");
    }

    async readFlash(addr, size, progress) {
      const out = [];
      while (size > 0) {
        const n = Math.min(size, BLOCK);
        await this.command(CMD.READ);
        await this.address(addr);
        await this.command(n - 1);
        const block = await this.t.read(n);
        if (block.length !== n) throw new IspError(`Failed to read from address ${hex(addr, 8)}`);
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
      else log(`Warning: the chip with PID ${hex(prog.pid, 4)} is not a known PY32; its option bytes are not touched.`);

      if (a.unlock) {
        log("Unlocking chip …");
        await prog.unlock();
        log("Chip is unlocked (and erased). Other options are ignored.");
        await prog.reset();
        return prog;
      }

      if (prog.known) {
        log("Reading option bytes …");
        await prog.readOption();
        log(prog.optionStr + ".");
      }

      if (a.info) {                       // only show the info; stay in the bootloader
        await prog.t.disconnect(false);
        return prog;
      }

      if (prog.known && a.flash && a.flash.length > prog.chip.flashSize) {
        throw new IspError(`Not enough memory (file: ${a.flash.length.toLocaleString("en")} bytes, flash: ${prog.chip.flashSize.toLocaleString("en")} bytes)`);
      }
      if ((a.nrstGpio || a.nrstReset) && prog.known) prog.checkNrst();

      if (a.erase || a.flash) {
        log("Performing chip erase …");
        await prog.erase();
        log("Chip is erased.");
      }

      if (a.flash) {
        const data = pad(a.flash);
        log(`Writing ${data.length.toLocaleString("en")} bytes …`);
        let done = 0;
        await prog.writeFlash(CODE_ADDR, data, (n) => { done += n; if (progress) progress("write", done / data.length); });
        log("Verifying …");
        done = 0;
        await prog.verifyFlash(CODE_ADDR, data, (n) => { done += n; if (progress) progress("verify", done / data.length); });
        log(`${data.length.toLocaleString("en")} bytes written and verified.`);
      }

      if (a.rstOption || a.nrstGpio || a.nrstReset || a.lock) {
        if (!prog.known) throw new IspError("The option bytes of unknown chips cannot be changed");
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

  // Pad the firmware with 0xFF to a multiple of 4 bytes
  function pad(data) {
    if (data.length % 4 === 0) return data;
    const out = new Uint8Array(data.length + 4 - (data.length % 4)).fill(0xff);
    out.set(data);
    return out;
  }

  global.PUYA = { CHIPS, CODE_ADDR, HID_FILTER, SerialTransport, HidTransport, Programmer, IspError, runActions };
})(typeof window !== "undefined" ? window : globalThis);
