/* ===================================================================
 * UART bootloader programmer for STM32 microcontrollers
 * -------------------------------------------------------------------
 * JavaScript port of stm32isp.py v0.8 by Stefan Wagner (MIT License),
 * https://github.com/wagiminator/MCU-Flash-Tools. Talks to the factory
 * USART bootloader of STM32 chips (protocol: ST application note
 * AN3155, chip data: AN2606) through a USB-to-serial converter
 * (Web Serial, 8E1, the bootloader detects the baud rate itself).
 *
 * Chips: the five lines of stm32isp.py (C011, C031, F03xx4/6, G03x/G04x,
 * L01x/L02x) plus 20 widely used STM32 lines with the same bootloader
 * protocol (F0, F1, F3, F4, G0, G4, L4). The chip is recognized by the
 * product ID the bootloader reports.
 *
 * Differences to stm32isp.py:
 * - verify compares every byte (stm32isp.py compares the sets of byte
 *   values only: set(flash) != set(data))
 * - the bootloader version shows the low nibble in full (ver & 0x0f
 *   instead of ver & 7)
 * - after unlocking, the chip resets; the app waits for the bootloader
 *   and synchronizes again with the single byte 0x7F (stm32isp.py sends
 *   0x7F 0x80 as a command)
 * - page erase sends the page count high byte as count >> 8 (stm32isp.py
 *   uses >> 16) and erases all pages of the chip as read from its flash
 *   size register (stm32isp.py always erases 128 pages on STM32L01x/02x)
 * - data is padded to a multiple of 8 bytes (64-bit flash programming
 *   on C0/G0/G4/L4); blocks that are all 0xFF are not written after an
 *   erase
 * - unlocking a chip that is not locked does nothing (as stm32isp.py),
 *   erasing is a separate action
 * Global: STM32ISP
 * =================================================================== */
(function (global) {
  "use strict";

  const CMD = {
    GET: 0x00, VER: 0x01, PID: 0x02, READ: 0x11, GO: 0x21, WRITE: 0x31,
    ERASE: 0x43, ERASE_X: 0x44, W_LOCK: 0x63, W_UNLOCK: 0x73, R_LOCK: 0x82, R_UNLOCK: 0x92,
  };
  const ACK = 0x79, NACK = 0x1f, SYNCH = 0x7f;
  const BLOCK = 256, CODE_ADDR = 0x08000000;
  const T_NORMAL = 1000, T_WRITE = 2000, T_ERASE = 120000, T_BOOT = 4000;   // ms

  // Chip families: option byte area, flash size register (F_SIZE, KB as
  // 16-bit value), default page size for page-wise erase.
  //   bootSel: option bit nBOOT_SEL (STM32C0/G0) can switch the BOOT0 pin off
  //   noMassErase: the bootloader has no mass erase (STM32L0, AN2606 4.4)
  const FAMILIES = {
    C0: { name: "STM32C0", optAddr: 0x1fff7800, optLen: 8,  fsize: 0x1fff75a0, page: 2048, bootSel: true },
    F0: { name: "STM32F0", optAddr: 0x1ffff800, optLen: 16, fsize: 0x1ffff7cc, page: 1024 },
    F1: { name: "STM32F1", optAddr: 0x1ffff800, optLen: 16, fsize: 0x1ffff7e0, page: 1024 },
    F3: { name: "STM32F3", optAddr: 0x1ffff800, optLen: 16, fsize: 0x1ffff7cc, page: 2048 },
    F4: { name: "STM32F4", optAddr: 0x1fffc000, optLen: 16, fsize: 0x1fff7a22, page: 0 },
    G0: { name: "STM32G0", optAddr: 0x1fff7800, optLen: 8,  fsize: 0x1fff75e0, page: 2048, bootSel: true },
    G4: { name: "STM32G4", optAddr: 0x1fff7800, optLen: 8,  fsize: 0x1fff75e0, page: 2048 },
    L0: { name: "STM32L0", optAddr: 0x1ff80000, optLen: 8,  fsize: 0x1ff8007c, page: 128, noMassErase: true },
    L4: { name: "STM32L4", optAddr: 0x1fff7800, optLen: 8,  fsize: 0x1fff75e0, page: 2048 },
  };

  // Chip lines by bootloader product ID (AN2606 Rev 59, table 174 and the
  // chapters of the devices). flash: largest member in KB (used if the
  // F_SIZE register cannot be read); page: page size if it differs from
  // the family; usart: bootloader USART pins (TX/RX of the chip);
  // src: "stm32isp" = also supported by stm32isp.py.
  const CHIPS = [
    // the chips of stm32isp.py
    { pid: 0x443, name: "STM32C011xx",                   fam: "C0", flash: 32,   usart: "PA9/PA10 (PA11/PA12 on small packages)", src: "stm32isp" },
    { pid: 0x453, name: "STM32C031xx",                   fam: "C0", flash: 32,   usart: "PA9/PA10 (PA11/PA12 on small packages)", src: "stm32isp" },
    { pid: 0x444, name: "STM32F03xx4/6",                 fam: "F0", flash: 32,   usart: "PA9/PA10 or PA14/PA15", src: "stm32isp" },
    { pid: 0x466, name: "STM32G03x/G04x",                fam: "G0", flash: 64,   usart: "PA9/PA10 (PA11/PA12 on small packages) or PA2/PA3", src: "stm32isp" },
    { pid: 0x457, name: "STM32L01x/L02x",                fam: "L0", flash: 32,   usart: "PA9/PA10 or PA2/PA3 (USART2)", src: "stm32isp" },
    // 20 widely used lines with the same UART bootloader
    { pid: 0x440, name: "STM32F030x8/F05x",              fam: "F0", flash: 64,   usart: "PA9/PA10 or PA14/PA15 (USART2)" },
    { pid: 0x442, name: "STM32F030xC/F09x",              fam: "F0", flash: 256,  page: 2048, usart: "PA9/PA10, PA2/PA3 or PA14/PA15 (USART2)" },
    { pid: 0x445, name: "STM32F04x/F070x6",              fam: "F0", flash: 32,   usart: "PA9/PA10 or PA14/PA15 (USART2)" },
    { pid: 0x448, name: "STM32F07x/F070xB",              fam: "F0", flash: 128,  page: 2048, usart: "PA9/PA10 or PA14/PA15 (USART2)" },
    { pid: 0x412, name: "STM32F10x low-density",         fam: "F1", flash: 32,   usart: "PA9/PA10" },
    { pid: 0x410, name: "STM32F10x medium-density",      fam: "F1", flash: 128,  usart: "PA9/PA10" },
    { pid: 0x414, name: "STM32F10x high-density",        fam: "F1", flash: 512,  page: 2048, usart: "PA9/PA10" },
    { pid: 0x422, name: "STM32F302xB/C/F303xB/C",        fam: "F3", flash: 256,  usart: "PA9/PA10, PA2/PA3 or PD5/PD6 (USART2)" },
    { pid: 0x438, name: "STM32F303x4/6/8/F334/F328",     fam: "F3", flash: 64,   usart: "PA9/PA10 or PA2/PA3 (USART2)" },
    { pid: 0x423, name: "STM32F401xB/C",                 fam: "F4", flash: 256,  usart: "PA9/PA10 or PA2/PA3, PD5/PD6 (USART2)" },
    { pid: 0x433, name: "STM32F401xD/E",                 fam: "F4", flash: 512,  usart: "PA9/PA10 or PA2/PA3, PD5/PD6 (USART2)" },
    { pid: 0x431, name: "STM32F411xx",                   fam: "F4", flash: 512,  usart: "PA9/PA10 or PA2/PA3, PD5/PD6 (USART2)" },
    { pid: 0x413, name: "STM32F405/407/415/417",         fam: "F4", flash: 1024, usart: "PA9/PA10 or PB10/PB11, PC10/PC11 (USART3)" },
    { pid: 0x419, name: "STM32F42x/F43x",                fam: "F4", flash: 2048, usart: "PA9/PA10 or PB10/PB11, PC10/PC11 (USART3)" },
    { pid: 0x421, name: "STM32F446xx",                   fam: "F4", flash: 512,  usart: "PA9/PA10 or PB10/PB11, PC10/PC11 (USART3)" },
    { pid: 0x460, name: "STM32G07x/G08x",                fam: "G0", flash: 128,  usart: "PA9/PA10, PA2/PA3 (USART2) or PC10/PC11 (USART3)" },
    { pid: 0x467, name: "STM32G0B0/G0B1/G0C1",           fam: "G0", flash: 512,  usart: "PA9/PA10, PA2/PA3 (USART2) or PC10/PC11 (USART3)" },
    { pid: 0x468, name: "STM32G431/G441",                fam: "G4", flash: 128,  usart: "PA9/PA10, PA2/PA3 (USART2) or PC10/PC11 (USART3)" },
    { pid: 0x469, name: "STM32G47x/G48x",                fam: "G4", flash: 512,  page: 0, usart: "PA9/PA10, PA2/PA3 (USART2) or PC10/PC11 (USART3)" },
    { pid: 0x435, name: "STM32L43x/L44x",                fam: "L4", flash: 256,  usart: "PA9/PA10, PA2/PA3 (USART2) or PC10/PC11 (USART3)" },
  ];

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const hex = (v, n) => "0x" + v.toString(16).padStart(n, "0");
  class IspError extends Error {}

  /* ---------- Transport ---------- */

  // USB-to-serial converter via Web Serial (class Programmer in stm32isp.py)
  class SerialTransport {
    constructor(port, baud) {
      this.link = new global.SerialLink(port, baud || 115200, { parity: "even", dataBits: 8, stopBits: 1 });
      this.name = "USB-to-serial converter";
    }
    async open() { await this.link.open(); }
    async write(bytes) { await this.link.write(Uint8Array.from(bytes)); }
    async read(n, timeout) { return this.link.read(n, timeout || T_NORMAL); }
    flush() { this.link.flushInput(); }
    // Optional automatic bootloader start with a converter whose RTS line is
    // wired to nRST and DTR to BOOT0 (same sequence as the PUYA ISP
    // Programmer); without these connections it does nothing
    async boot() {
      await this.link.setSignals({ rts: false });
      await this.link.setSignals({ dtr: false });
      await this.link.setSignals({ rts: true });
      await sleep(10);
      await this.link.setSignals({ rts: false });
      await sleep(100);
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

  /* ---------- Programmer ---------- */

  class Programmer {
    constructor(transport) {
      this.t = transport;
    }

    // Open the port, start the bootloader (if wired) and synchronize
    async connect() {
      await this.t.open();
      await this.t.boot();
      if (await this.sync(4)) return this;
      await this.t.disconnect(false);
      throw new IspError("No STM32 in bootloader mode found. Check the wiring (converter RXD to chip TX, TXD to chip RX, GND), put the chip into bootloader mode and try again");
    }

    // Send the sync byte 0x7F (the bootloader measures the baud rate on it).
    // ACK = synchronized; NACK = the bootloader was already synchronized by
    // an earlier session, which is fine as well.
    async sync(tries, timeout) {
      for (let i = 0; i < tries; i++) {
        this.t.flush();
        await this.t.write([SYNCH]);
        const r = await this.t.read(1, timeout || 300);
        if (r.length === 1 && (r[0] === ACK || r[0] === NACK)) { this.resynced = r[0] === NACK; return true; }
        await sleep(50);
      }
      return false;
    }

    // After a system reset of the chip (lock, unlock, option bytes): wait
    // for the bootloader to start again and synchronize
    async reconnect() {
      const end = performance.now() + T_BOOT;
      await sleep(200);
      while (performance.now() < end) {
        if (await this.sync(1, 200)) return true;
      }
      return false;
    }

    async reply(timeout) {
      const r = await this.t.read(1, timeout || T_NORMAL);
      return r.length === 1 ? r[0] : null;
    }

    async checkReply(timeout) { return (await this.reply(timeout)) === ACK; }

    // Command byte with its complement; throws (with e.nack) if not accepted
    async command(c, what) {
      await this.t.write([c, c ^ 0xff]);
      const r = await this.reply();
      if (r !== ACK) {
        const e = new IspError(`${what || "Command " + hex(c, 2)} was not accepted by the bootloader${r === NACK ? " (NACK)" : r === null ? " (no reply)" : ""}`);
        e.nack = r === NACK;
        throw e;
      }
    }

    async address(addr) {
      const s = [(addr >>> 24) & 255, (addr >>> 16) & 255, (addr >>> 8) & 255, addr & 255];
      await this.t.write([...s, s[0] ^ s[1] ^ s[2] ^ s[3]]);
      const r = await this.reply();
      if (r !== ACK) {
        const e = new IspError(`The address ${hex(addr, 8)} was not accepted${r === NACK ? " (NACK)" : ""}`);
        e.nack = r === NACK;
        throw e;
      }
    }

    // Get: bootloader version and commands; Get ID: product ID
    async readInfo() {
      const get = await this.infoStream(CMD.GET, "Get");
      this.ver = get[0];
      this.verStr = `${(this.ver >> 4).toString(16)}.${(this.ver & 0x0f).toString(16)}`;
      this.cmds = Array.from(get.subarray(1));
      const id = await this.infoStream(CMD.PID, "Get ID");
      this.pid = id.reduce((a, b) => (a << 8) | b, 0);
      this.chip = CHIPS.find((c) => c.pid === this.pid) || null;
      this.fam = this.chip ? FAMILIES[this.chip.fam] : null;
      this.flashSize = this.chip ? this.chip.flash * 1024 : 0;
      this.flashFromChip = false;
      this.pageSize = this.chip ? (this.chip.page !== undefined ? this.chip.page : this.fam.page) : 0;
      this.name = this.chip ? this.chip.name : `Unknown STM32 (PID ${hex(this.pid, 3)})`;
    }

    async infoStream(c, what) {
      await this.command(c, what);
      const n = await this.t.read(1);
      if (!n.length) throw new IspError(`${what}: no reply`);
      const data = await this.t.read(n[0] + 1);
      if (data.length !== n[0] + 1 || !(await this.checkReply())) throw new IspError(`${what}: incomplete reply`);
      return data;
    }

    has(c) { return !!this.cmds && this.cmds.includes(c); }

    // Read protection: with level 1 the bootloader refuses Read Memory
    async checkLocked() {
      try {
        await this.readFlash(CODE_ADDR, 4);
        this.locked = false;
      } catch (e) {
        if (!e.nack) throw e;
        this.locked = true;
      }
      return this.locked;
    }

    // Option bytes (raw) and flash size; only possible on unlocked chips
    async readDetails() {
      this.option = null;
      if (!this.fam || this.locked) return;
      try { this.option = Array.from(await this.readFlash(this.fam.optAddr, this.fam.optLen)); } catch (e) { if (!e.nack) throw e; }
      if (this.option && this.fam.bootSel) {
        // OPTR byte 3: bit 0 nBOOT_SEL, bit 1 nBOOT1, bit 2 nBOOT0
        this.bootPinOff = (this.option[3] & 0x01) === 0x01;
      }
      try {
        const b = await this.readFlash(this.fam.fsize, 2);
        const kb = b[0] | (b[1] << 8);
        if (kb > 0 && kb <= 2048) { this.flashSize = kb * 1024; this.flashFromChip = true; }
      } catch (e) { if (!e.nack) throw e; }       // keep the value from the table
    }

    async readFlash(addr, size, progress) {
      const out = new Uint8Array(size);
      let pos = 0;
      while (pos < size) {
        const n = Math.min(size - pos, BLOCK);
        await this.command(CMD.READ, "Read Memory");
        await this.address(addr + pos);
        await this.command(n - 1, "The read length");      // N-1 and its complement
        const block = await this.t.read(n);
        if (block.length !== n) throw new IspError(`The chip sent too few bytes at ${hex(addr + pos, 8)}`);
        out.set(block, pos);
        pos += n;
        if (progress) progress(n);
      }
      return out;
    }

    async writeBlock(addr, block) {
      let parity = block.length - 1;
      for (const b of block) parity ^= b;
      await this.command(CMD.WRITE, "Write Memory");
      await this.address(addr);
      await this.t.write([block.length - 1, ...block, parity]);
      const r = await this.reply(T_WRITE);
      if (r !== ACK) throw new IspError(`Failed to write to address ${hex(addr, 8)}${r === NACK ? " (the page may be write protected)" : ""}`);
    }

    // Write data in blocks of 256 bytes; skipEmpty: leave out blocks that
    // contain only 0xFF (the flash is erased)
    async writeFlash(addr, data, progress, skipEmpty) {
      let pos = 0, written = 0;
      while (pos < data.length) {
        const n = Math.min(data.length - pos, BLOCK);
        const block = data.subarray(pos, pos + n);
        if (!skipEmpty || block.some((b) => b !== 0xff)) { await this.writeBlock(addr + pos, block); written += n; }
        pos += n;
        if (progress) progress(n);
      }
      return written;
    }

    // Verify every byte
    async verifyFlash(addr, data, progress) {
      const flash = await this.readFlash(addr, data.length, progress);
      for (let i = 0; i < data.length; i++) {
        if (flash[i] !== data[i]) throw new IspError(`Verification failed at address ${hex(addr + i, 8)} (read ${hex(flash[i], 2)}, expected ${hex(data[i], 2)})`);
      }
    }

    // Erase the whole flash (mass erase). If the bootloader has none
    // (STM32L0) or refuses it, the pages are erased one by one.
    async eraseChip(log) {
      if (!(this.fam && this.fam.noMassErase)) {
        let r;
        if (this.has(CMD.ERASE_X)) {
          await this.command(CMD.ERASE_X, "Extended Erase");
          await this.t.write([0xff, 0xff, 0x00]);            // special erase 0xFFFF: mass erase
          r = await this.reply(T_ERASE);
        } else if (this.has(CMD.ERASE)) {
          await this.command(CMD.ERASE, "Erase");
          await this.t.write([0xff, 0x00]);                  // global erase
          r = await this.reply(T_ERASE);
        } else {
          throw new IspError("The bootloader has no erase command");
        }
        if (r === ACK) return;
        if (r !== NACK || !this.pageSize || !this.flashSize) throw new IspError("Failed to erase the chip" + (r === null ? " (no reply)" : " (NACK)"));
        if (log) log("The bootloader refused the mass erase; erasing page by page …");
      }
      await this.erasePages(0, this.pageCount(this.flashSize));
    }

    pageCount(bytes) {
      if (!this.pageSize) throw new IspError("This chip cannot be erased page by page (unknown page layout)");
      return Math.ceil(bytes / this.pageSize);
    }

    // Erase only the pages that the firmware covers (if no mass erase)
    async eraseFor(length, log) {
      if (this.fam && this.fam.noMassErase) {
        if (log) log(`Erasing the ${this.pageCount(length)} pages of ${this.pageSize} bytes that the firmware needs …`);
        await this.erasePages(0, this.pageCount(length));
        return;
      }
      await this.eraseChip(log);
    }

    // Erase pages first .. first+count-1 in groups
    async erasePages(first, count, progress) {
      const ext = this.has(CMD.ERASE_X);
      if (!ext && !this.has(CMD.ERASE)) throw new IspError("The bootloader has no erase command");
      const GROUP = ext ? 64 : 128;
      const last = first + count;
      for (let p0 = first; p0 < last; p0 += GROUP) {
        const n = Math.min(GROUP, last - p0);
        let bytes;
        if (ext) {
          await this.command(CMD.ERASE_X, "Extended Erase");
          bytes = [(n - 1) >> 8, (n - 1) & 255];
          for (let p = p0; p < p0 + n; p++) bytes.push(p >> 8, p & 255);
        } else {
          if (p0 + n > 256) throw new IspError("Too many pages for the Erase command");
          await this.command(CMD.ERASE, "Erase");
          bytes = [n - 1];
          for (let p = p0; p < p0 + n; p++) bytes.push(p);
        }
        bytes.push(bytes.reduce((a, b) => a ^ b, 0));
        await this.t.write(bytes);
        if (!(await this.checkReply(T_ERASE))) throw new IspError(`Failed to erase pages ${p0} to ${p0 + n - 1}`);
        if (progress) progress(p0 + n - first, count);
      }
    }

    // Readout Unprotect: removes the read protection, erases the flash and
    // resets the chip
    async unlock() {
      await this.command(CMD.R_UNLOCK, "Readout Unprotect");
      if (!(await this.checkReply(T_ERASE))) throw new IspError("Failed to unlock the chip");
    }

    // Readout Protect: read protection level 1, then the chip resets
    async lock() {
      await this.command(CMD.R_LOCK, "Readout Protect");
      if (!(await this.checkReply(T_ERASE))) throw new IspError("Failed to lock the chip");
    }

    // Write Unprotect: removes the write protection of all pages, then the
    // chip resets
    async writeUnprotect() {
      await this.command(CMD.W_UNLOCK, "Write Unprotect");
      if (!(await this.checkReply(T_ERASE))) throw new IspError("Failed to remove the write protection");
    }

    // STM32C0/G0: nBOOT_SEL = 0, nBOOT1 = 1, nBOOT0 = 1, so that the BOOT0
    // pin selects the boot mode again (as stm32isp.py). The option word is
    // written with its complement; the chip then resets.
    async enableBootPin() {
      const o = this.option.slice(0, 8);
      o[3] = (o[3] & 0b11111000) | 0b00000110;
      for (let i = 0; i < 4; i++) o[i + 4] = o[i] ^ 0xff;
      await this.writeBlock(this.fam.optAddr, Uint8Array.from(o));
    }

    // Start the firmware and disconnect
    async run() {
      await this.command(CMD.GO, "Go");
      await this.address(CODE_ADDR);
      await this.t.disconnect(false);
    }

    async close(reset) { await this.t.disconnect(reset); }
  }

  // Pad to a multiple of 8 bytes (writes must be a multiple of 4 bytes,
  // C0/G0/G4/L4 program 64 bits at a time)
  function pad(data) {
    const n = Math.ceil(data.length / 8) * 8;
    if (n === data.length) return data;
    const out = new Uint8Array(n).fill(0xff);
    out.set(data);
    return out;
  }

  // The steps of stm32isp.py's main function, plus info, read and the
  // option byte actions.
  // a: { info, read, erase, unlock, lock, flash (Uint8Array), bootPin, wunprotect }
  // Returns the programmer; prog.dump holds the flash content for a.read.
  async function runActions(prog, a, log, progress) {
    log = log || (() => {});
    let open = true;
    const done = async (reset) => { if (open) { open = false; await prog.close(reset); } };
    const again = async (what) => {
      if (!(await prog.reconnect())) throw new IspError(`The chip did not return to the bootloader after ${what}. Put it into bootloader mode again and repeat the action`);
      await prog.readInfo();
    };
    try {
      log("Getting chip info …");
      await prog.readInfo();
      if (prog.chip) log(`Found ${prog.chip.name} with bootloader v${prog.verStr}.`);
      else log(`Warning: the chip with PID ${hex(prog.pid, 3)} (bootloader v${prog.verStr}) is not in the chip list; only reading the info is possible.`);

      await prog.checkLocked();
      if (prog.locked) log("The chip is read protected (locked).");

      if (prog.locked && (a.unlock || a.erase || a.flash)) {
        if (!prog.chip) throw new IspError("Unknown chip; refusing to change it");
        log("Unlocking the chip (this erases the flash) …");
        await prog.unlock();
        log("Chip is unlocked and erased; it restarts.");
        prog.unlocked = true;
        if (!(a.flash || a.lock || a.bootPin)) { await done(false); return prog; }
        await again("unlocking");
        await prog.checkLocked();
      } else if (a.unlock) {
        log("The chip is already unlocked.");
      }

      await prog.readDetails();
      if (prog.option) log(`Option bytes at ${hex(prog.fam.optAddr, 8)}: ${prog.option.map((b) => b.toString(16).padStart(2, "0")).join(" ")}.`);
      if (prog.chip && !prog.locked) log(`Flash: ${prog.flashSize / 1024} KB${prog.flashFromChip ? "" : " (the largest chip of this line; the flash size register could not be read)"}.`);

      if (a.info) { await done(false); return prog; }        // the chip stays in the bootloader
      if (a.unlock && !(a.flash || a.lock || a.bootPin || a.erase)) { await done(false); return prog; }
      if (!prog.chip) throw new IspError("Unknown chip; refusing to change it");
      if (prog.locked && (a.read || a.bootPin)) throw new IspError("The chip is locked. Unlock it first (this erases it)");

      if (a.read) {
        log(`Reading ${prog.flashSize.toLocaleString("en")} bytes of flash …`);
        let n = 0;
        prog.dump = await prog.readFlash(CODE_ADDR, prog.flashSize, (k) => { n += k; if (progress) progress("read", n / prog.flashSize); });
        log("Flash read.");
        await done(false);
        return prog;
      }

      if (a.wunprotect) {
        if (!prog.has(CMD.W_UNLOCK)) throw new IspError("The bootloader has no Write Unprotect command");
        log("Removing the write protection …");
        await prog.writeUnprotect();
        log("Write protection removed; the chip restarts.");
        if (!(a.flash || a.erase || a.lock || a.bootPin)) { await done(false); return prog; }
        await again("removing the write protection");
      }

      if (a.flash && prog.flashSize && a.flash.length > prog.flashSize) {
        throw new IspError(`The firmware needs ${a.flash.length.toLocaleString("en")} bytes, but the chip has ${prog.flashSize.toLocaleString("en")} bytes of flash`);
      }

      if (a.erase && !prog.unlocked) {
        log("Performing chip erase …");
        await prog.eraseChip(log);
        log("Chip is erased.");
      } else if (a.flash && !prog.unlocked) {
        log("Performing chip erase …");
        await prog.eraseFor(a.flash.length, log);
        log("Chip is erased.");
      }

      if (a.flash) {
        const data = pad(a.flash);
        log(`Writing ${a.flash.length.toLocaleString("en")} bytes …`);
        let n = 0;
        const written = await prog.writeFlash(CODE_ADDR, data, (k) => { n += k; if (progress) progress("write", n / data.length); }, true);
        if (written < data.length) log(`${(data.length - written).toLocaleString("en")} bytes are 0xFF and were skipped (the flash is erased).`);
        log("Verifying …");
        n = 0;
        await prog.verifyFlash(CODE_ADDR, data, (k) => { n += k; if (progress) progress("verify", n / data.length); });
        log(`${a.flash.length.toLocaleString("en")} bytes written and verified.`);
      }

      // Enable the BOOT0 pin in the option bytes (nBOOT_SEL = 0), STM32C0/G0
      if (a.bootPinOnly && !prog.fam.bootSel) throw new IspError(`${prog.fam.name} chips always use the BOOT0 pin; nothing to change`);
      if (a.bootPinOnly && !prog.option) throw new IspError("The option bytes could not be read");
      if (a.bootPin && prog.fam.bootSel && prog.option) {
        if (prog.bootPinOff) {
          log("Enabling the BOOT0 pin in the option bytes (nBOOT_SEL = 0) …");
          await prog.enableBootPin();
          log(a.flash && !a.lock
            ? "Option bytes written; the chip restarts and runs the firmware (if BOOT0 is low)."
            : "Option bytes written; the chip restarts.");
          prog.bootPinOff = false;
          if (!a.lock) { await done(false); return prog; }
          await again("writing the option bytes");
        } else if (a.bootPinLog) {
          log("The BOOT0 pin is already enabled.");
        }
      }

      if (a.lock) {
        log("Locking the chip (read protection level 1) …");
        await prog.lock();
        log("Chip is locked. It restarts; a power-on reset may be needed before the firmware runs.");
        await done(false);
        return prog;
      }

      if (!a.flash) { await done(false); return prog; }        // nothing to start
      log("Starting the firmware …");
      await prog.run();
      open = false;
      return prog;
    } catch (err) {
      try { await done(false); } catch (e) { /* the port may be gone */ }
      throw err;
    }
  }

  global.STM32ISP = { CHIPS, FAMILIES, CMD, CODE_ADDR, SerialTransport, Programmer, IspError, runActions, pad };
})(typeof window !== "undefined" ? window : globalThis);
