/* ===================================================================
 * PICOBOOT programmer for the RP2040 and RP2350
 * -------------------------------------------------------------------
 * Talks to the USB bootloader in the boot ROM of the Raspberry Pi
 * microcontrollers (BOOTSEL mode) through WebUSB, as picotool does:
 * 32-byte commands on the bulk OUT endpoint of the vendor interface,
 * data on the bulk endpoints and a zero-length acknowledgement in the
 * other direction. Protocol after the PICOBOOT description in the
 * RP2040/RP2350 datasheets and picotool (BSD-3-Clause).
 * Also reads UF2 files and the binary info that the Pico SDK puts
 * into programs (name, version, build date, pins).
 * Global: PICOBOOT
 * =================================================================== */
(function (global) {
  "use strict";

  const VID = 0x2e8a, PID_RP2040 = 0x0003, PID_RP2350 = 0x000f;
  const FILTERS = [{ vendorId: VID, productId: PID_RP2040 }, { vendorId: VID, productId: PID_RP2350 }];
  const MAGIC = 0x431fd10b;
  const CMD = { EXCLUSIVE: 0x01, REBOOT: 0x02, ERASE: 0x03, READ: 0x84, WRITE: 0x05, EXIT_XIP: 0x06, ENTER_XIP: 0x07, EXEC: 0x08, REBOOT2: 0x0a, GET_INFO: 0x8b, OTP_READ: 0x8c };
  const IF_RESET = 0x41, IF_STATUS = 0x42;
  const STATUS = ["ok", "unknown command", "invalid command length", "invalid transfer length", "invalid address", "bad alignment",
    "interleaved write", "rebooting", "unknown error", "invalid state", "not permitted", "invalid argument", "buffer too small",
    "precondition not met", "modified data", "invalid data", "not found", "unsupported modification"];

  const FLASH = 0x10000000, PAGE = 256, SECTOR = 4096;
  const SRAM_END = { rp2040: 0x20042000, rp2350: 0x20082000 };
  const FLASH_MAX = { rp2040: 16 << 20, rp2350: 32 << 20 };

  // UF2 family IDs
  const FAMILY = { RP2040: 0xe48bff56, ABSOLUTE: 0xe48bff57, DATA: 0xe48bff58, RP2350_ARM_S: 0xe48bff59, RP2350_RISCV: 0xe48bff5a, RP2350_ARM_NS: 0xe48bff5b };
  const FAMILY_NAME = {
    [FAMILY.RP2040]: "RP2040", [FAMILY.ABSOLUTE]: "absolute", [FAMILY.DATA]: "data",
    [FAMILY.RP2350_ARM_S]: "RP2350 Arm (secure)", [FAMILY.RP2350_RISCV]: "RP2350 RISC-V", [FAMILY.RP2350_ARM_NS]: "RP2350 Arm (non-secure)",
  };
  const ACCEPTS = {
    rp2040: [FAMILY.RP2040, FAMILY.ABSOLUTE, FAMILY.DATA],
    rp2350: [FAMILY.RP2350_ARM_S, FAMILY.RP2350_RISCV, FAMILY.RP2350_ARM_NS, FAMILY.ABSOLUTE, FAMILY.DATA],
  };

  class PicoError extends Error {}
  const hex = (v, n) => "0x" + (v >>> 0).toString(16).padStart(n || 8, "0");
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const u32 = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;

  /* ---------- Firmware files ---------- */

  // UF2 file -> { blocks: [{ addr, data, family }], families: [id], notFlash }
  function parseUf2(u8) {
    if (u8.length < 512 || u32(u8, 0) !== 0x0a324655 || u32(u8, 4) !== 0x9e5d5157) return null;
    if (u8.length % 512) throw new PicoError("The UF2 file is not a multiple of 512 bytes long; it may be incomplete.");
    const blocks = [], families = [];
    let notFlash = 0;
    for (let o = 0; o < u8.length; o += 512) {
      if (u32(u8, o) !== 0x0a324655 || u32(u8, o + 4) !== 0x9e5d5157 || u32(u8, o + 508) !== 0x0ab16f30) throw new PicoError(`Block ${o / 512} of the UF2 file is damaged.`);
      const flags = u32(u8, o + 8), addr = u32(u8, o + 12), size = u32(u8, o + 16), fam = flags & 0x2000 ? u32(u8, o + 28) : 0;
      if (flags & 1) { notFlash++; continue; }                    // "not main flash": comments and the like
      if (size > 476) throw new PicoError(`Block ${o / 512} of the UF2 file has a payload of ${size} bytes.`);
      blocks.push({ addr, data: u8.slice(o + 32, o + 32 + size), family: fam });
      if (!families.includes(fam)) families.push(fam);
    }
    if (!blocks.length) throw new PicoError("The UF2 file contains no data.");
    return { blocks, families, notFlash };
  }

  // The RP2350-E10 workaround block: one page of the absolute family at the
  // end of the first 16 MB, written by picotool next to the real image.
  const isE10Block = (b) => b.family === FAMILY.ABSOLUTE && b.addr === 0x10ffff00 && b.data.length === PAGE;

  // Firmware file -> { kind, families, segs: [{ addr, data, family }] }
  // BIN files are placed at FLASH + binOffset.
  function readFile(name, u8, binOffset) {
    const uf2 = parseUf2(u8);
    if (uf2) return { kind: "uf2", families: uf2.families, segs: uf2.blocks, notFlash: uf2.notFlash };
    if (/\.(hex|ihx|ihex)$/i.test(name) || (u8[0] === 0x3a && /^:[0-9A-Fa-f]{10}/.test(String.fromCharCode(...u8.subarray(0, 11))))) {
      const r = global.FIRMWARE.readFirmware(name, u8);
      return { kind: "hex", families: [], segs: r.segs.map((s) => ({ addr: s.addr, data: s.data, family: 0 })), ended: r.ended };
    }
    if (/\.elf$/i.test(name) || (u8[0] === 0x7f && u8[1] === 0x45 && u8[2] === 0x4c && u8[3] === 0x46)) {
      throw new PicoError("ELF files are not supported. Use the .uf2 or .bin file from the same build folder.");
    }
    if (!u8.length) throw new PicoError("The file is empty.");
    return { kind: "bin", families: [], segs: [{ addr: FLASH + (binOffset || 0), data: u8, family: 0 }] };
  }

  // Choose the segments for a chip ("rp2040", "rp2350" or null if not known
  // yet) and turn them into flash pages.
  // -> { pages: Map(pageAddr -> Uint8Array(256)), ranges: [[from, to]], family,
  //      errors, warnings, low, high, size }
  function buildImage(file, chip) {
    const errors = [], warnings = [];
    let segs = file.segs;
    if (file.kind === "uf2") {
      const real = segs.filter((b) => !isE10Block(b));
      if (real.length && real.length < segs.length) segs = real;
      const fams = [...new Set(segs.map((b) => b.family))];
      let family = fams.length === 1 ? fams[0] : null;
      if (chip) {
        const ok = fams.filter((f) => ACCEPTS[chip].includes(f) || f === 0);
        if (!ok.length) {
          errors.push(`The UF2 file is for ${fams.map((f) => FAMILY_NAME[f] || hex(f)).join(", ")}, not for the ${chip.toUpperCase()}.`);
          return { pages: new Map(), ranges: [], errors, warnings, low: 0, high: 0, size: 0 };
        }
        // Universal files hold images for several chips: take the most specific one
        const pick = ok.find((f) => f !== FAMILY.ABSOLUTE && f !== FAMILY.DATA) || ok[0];
        if (ok.length > 1 && ok.some((f) => f !== FAMILY.DATA && f !== pick)) warnings.push(`The file holds images for several chips; the ${FAMILY_NAME[pick] || hex(pick)} image is written.`);
        segs = segs.filter((b) => b.family === pick || b.family === FAMILY.DATA);
        family = pick;
      }
      file = Object.assign({}, file, { family });
    }
    const pages = new Map();
    let ram = 0, outside = 0;
    for (const s of segs) {
      for (let i = 0; i < s.data.length; ) {
        const a = s.addr + i;
        if (a >= 0x20000000 && a < 0x20100000) { ram++; break; }
        if (a < FLASH || a >= FLASH + (chip ? FLASH_MAX[chip] : 32 << 20)) { outside++; break; }
        const pa = a & ~(PAGE - 1), off = a - pa, n = Math.min(PAGE - off, s.data.length - i);
        let p = pages.get(pa);
        if (!p) { p = new Uint8Array(PAGE).fill(0xff); pages.set(pa, p); }
        p.set(s.data.subarray(i, i + n), off);
        i += n;
      }
    }
    if (ram) errors.push("The file is a program for the RAM (a no_flash build). Only programs for the flash can be written; build it for the flash.");
    if (outside) warnings.push("Parts of the file lie outside the flash and are not written.");
    const keys = [...pages.keys()].sort((a, b) => a - b);
    const ranges = [];
    for (const k of keys) {
      const last = ranges[ranges.length - 1];
      if (last && last[1] === k) last[1] = k + PAGE; else ranges.push([k, k + PAGE]);
    }
    const low = keys.length ? keys[0] : 0, high = keys.length ? keys[keys.length - 1] + PAGE : 0;
    if (!keys.length && !errors.length) errors.push("The file has no data for the flash.");
    return { pages, ranges, family: file.family, errors, warnings, low, high, size: keys.length * PAGE };
  }

  /* ---------- Binary info ---------- */

  const BI_START = 0x7188ebf2, BI_END = 0xe71aa390;
  const BI_ID = {
    0x02031c86: "Program", 0x11a9bc3a: "Version", 0x9da22254: "Build date", 0xb6a07c19: "Description",
    0x1856239a: "URL", 0xa1f4b453: "Feature", 0x5360b3ab: "SDK version", 0xb63cffbb: "Board", 0x7f8882e1: "Boot stage 2",
    0x4275f0d3: "Build attribute",
  };
  const BI_TAG_RP = 0x5052;   // 'R','P'

  // Reads the binary info block of a program. read(addr, len) -> Promise<Uint8Array|null>
  // chip: "rp2040" (skip boot stage 2) or "rp2350". -> [[label, text]] or null
  async function readBinaryInfo(read, chip) {
    const base = chip === "rp2040" ? FLASH + 0x100 : FLASH;
    const words = chip === "rp2040" ? 64 : 256;
    const head = await read(base, words * 4);
    if (!head) return null;
    let from = 0, to = 0, map = 0;
    for (let i = 0; i + 4 < words; i++) {
      if (u32(head, i * 4) === BI_START && u32(head, (i + 4) * 4) === BI_END) {
        from = u32(head, i * 4 + 4); to = u32(head, i * 4 + 8); map = u32(head, i * 4 + 12);
        break;
      }
    }
    if (!from || to <= from || to - from > 4096 || (from & 3)) return null;
    // Copy table: data that the program copies to RAM at start
    const copies = [];
    if (map) {
      for (let i = 0; i < 10; i++) {
        const e = await read(map + i * 12, 12);
        if (!e || !u32(e, 0)) break;
        copies.push({ src: u32(e, 0), start: u32(e, 4), end: u32(e, 8) });
      }
    }
    const where = (a) => {
      for (const c of copies) if (a >= c.start && a < c.end) return c.src + (a - c.start);
      return a;
    };
    const readStr = async (a) => {
      const b = await read(where(a), 256);
      if (!b) return "";
      let n = b.indexOf(0);
      if (n < 0) n = b.length;
      return new TextDecoder().decode(b.subarray(0, n));
    };
    const list = await read(where(from), to - from);
    if (!list) return null;
    const out = [], pins = new Map();
    for (let o = 0; o < list.length; o += 4) {
      const p = u32(list, o);
      const e = await read(where(p), 20);
      if (!e) continue;
      const type = e[0] | (e[1] << 8), tag = e[2] | (e[3] << 8);
      if (type === 6 && tag === BI_TAG_RP) {           // id and string
        const id = u32(e, 4), label = BI_ID[id];
        if (label) out.push([label, await readStr(u32(e, 8))]);
      } else if (type === 5 && tag === BI_TAG_RP) {    // id and int
        const id = u32(e, 4), v = u32(e, 8);
        if (id === 0x68f465de) out.push(["Binary end", hex(v)]);
      } else if (type === 9 && tag === BI_TAG_RP) {    // pins with name
        const mask = u32(e, 4), name = await readStr(u32(e, 8));
        for (let pin = 0; pin < 32; pin++) if (mask & (1 << pin)) pins.set(pin, (pins.has(pin) ? pins.get(pin) + ", " : "") + name);
      }
    }
    const order = ["Program", "Version", "Description", "Feature", "Build date", "Build attribute", "SDK version", "Board", "Boot stage 2", "URL", "Binary end"];
    out.sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
    if (pins.size) out.push(["Pins", [...pins].sort((a, b) => a[0] - b[0]).map(([p, n]) => `GP${p} ${n}`).join("; ")]);
    return out;
  }

  // read() for an image built by buildImage (pages only; RAM copies are not in files)
  function imageReader(img) {
    return async (addr, len) => {
      const out = new Uint8Array(len);
      let any = false;
      for (let i = 0; i < len; ) {
        const a = addr + i, pa = a & ~(PAGE - 1), off = a - pa, n = Math.min(PAGE - off, len - i);
        const p = img.pages.get(pa);
        if (p) { out.set(p.subarray(off, off + n), i); any = true; } else out.fill(0xff, i, i + n);
        i += n;
      }
      return any ? out : null;
    };
  }

  /* ---------- PICOBOOT connection ---------- */

  class Picoboot {
    constructor(device) {
      this.dev = device;
      this.token = 1;
      this.chip = device.productId === PID_RP2040 ? "rp2040" : "rp2350";
    }

    async open() {
      const d = this.dev;
      if (!d.opened) await d.open();
      if (!d.configuration) await d.selectConfiguration(1);
      // The PICOBOOT interface: vendor class with one bulk OUT and one bulk IN endpoint
      for (const itf of d.configuration.interfaces) {
        const alt = itf.alternates[0];
        if (alt.interfaceClass !== 0xff || alt.endpoints.length !== 2) continue;
        const out = alt.endpoints.find((e) => e.direction === "out"), inp = alt.endpoints.find((e) => e.direction === "in");
        if (!out || !inp) continue;
        this.itf = itf.interfaceNumber; this.epOut = out.endpointNumber; this.epIn = inp.endpointNumber;
      }
      if (this.itf === undefined) throw new PicoError("The device in BOOTSEL mode has no PICOBOOT interface. It may have been disabled in the OTP (RP2350).");
      try { await d.claimInterface(this.itf); } catch (e) {
        throw new PicoError("The PICOBOOT interface is in use by another program or has no WinUSB driver (Windows: install it for “RP2 Boot (Interface 1)” with Zadig).");
      }
      await this.reset();
    }

    async close() {
      try { await this.dev.releaseInterface(this.itf); } catch (e) { /* gone */ }
      try { await this.dev.close(); } catch (e) { /* gone */ }
    }

    async reset() {
      const d = this.dev;
      try { await d.clearHalt("in", this.epIn); } catch (e) { /* not halted */ }
      try { await d.clearHalt("out", this.epOut); } catch (e) { /* not halted */ }
      await d.controlTransferOut({ requestType: "vendor", recipient: "interface", request: IF_RESET, value: 0, index: this.itf });
    }

    async status() {
      const r = await this.dev.controlTransferIn({ requestType: "vendor", recipient: "interface", request: IF_STATUS, value: 0, index: this.itf }, 16);
      const b = new Uint8Array(r.data.buffer, r.data.byteOffset, r.data.byteLength);
      return { token: u32(b, 0), code: u32(b, 4), cmd: b[8], busy: b[9] };
    }

    // Wait for a USB transfer, but not forever
    async timed(promise, ms, what) {
      let t;
      const timeout = new Promise((_, rej) => { t = setTimeout(() => rej(new PicoError(`The chip did not answer (${what}).`)), ms); });
      try { return await Promise.race([promise, timeout]); } finally { clearTimeout(t); }
    }

    // Send a command; data: Uint8Array to send (OUT commands) or the number
    // of bytes to receive (IN commands). Returns the received bytes.
    async cmd(id, args, data, timeout) {
      const d = this.dev;
      const c = new Uint8Array(32), v = new DataView(c.buffer);
      const len = typeof data === "number" ? data : data ? data.length : 0;
      v.setUint32(0, MAGIC, true);
      v.setUint32(4, this.token++, true);
      c[8] = id;
      c[9] = args ? args.length : 0;
      v.setUint32(12, len, true);
      if (args) c.set(args, 16);
      timeout = timeout || 10000;
      const fail = async (what) => {
        let st = null;
        try { st = await this.status(); } catch (e) { /* no status */ }
        try { await this.reset(); } catch (e) { /* ignore */ }
        const reason = st && st.code ? STATUS[st.code] || `error ${st.code}` : what;
        throw new PicoError(`The bootloader refused the command (${reason}).`);
      };
      let r = await this.timed(d.transferOut(this.epOut, c), 3000, "command");
      if (r.status !== "ok") await fail("stall");
      let result = null;
      if (len && id & 0x80) {
        result = new Uint8Array(len);
        let got = 0;
        while (got < len) {
          r = await this.timed(d.transferIn(this.epIn, len - got), timeout, "read");
          if (r.status !== "ok") await fail("stall");
          const b = new Uint8Array(r.data.buffer, r.data.byteOffset, r.data.byteLength);
          if (!b.length) break;
          result.set(b.subarray(0, len - got), got);
          got += b.length;
        }
        if (got < len) await fail("short read");
      } else if (len) {
        r = await this.timed(d.transferOut(this.epOut, data), timeout, "write");
        if (r.status !== "ok") await fail("stall");
      }
      // Acknowledgement: a zero-length packet in the other direction
      if (id & 0x80) r = await this.timed(d.transferOut(this.epOut, new Uint8Array(0)), timeout, "acknowledge");
      else r = await this.timed(d.transferIn(this.epIn, 64), timeout, "acknowledge");
      if (r.status !== "ok") await fail("stall");
      return result;
    }

    le32(...vals) {
      const b = new Uint8Array(vals.length * 4), v = new DataView(b.buffer);
      vals.forEach((x, i) => v.setUint32(i * 4, x >>> 0, true));
      return b;
    }

    exclusive(on) { return this.cmd(CMD.EXCLUSIVE, [on ? 1 : 0]); }
    exitXip() { return this.cmd(CMD.EXIT_XIP, null); }
    enterXip() { return this.cmd(CMD.ENTER_XIP, null); }
    erase(addr, len) { return this.cmd(CMD.ERASE, this.le32(addr, len), null, 30000 + (len >> 10) * 50); }
    write(addr, data) { return this.cmd(CMD.WRITE, this.le32(addr, data.length), data, 20000); }
    read(addr, len) { return this.cmd(CMD.READ, this.le32(addr, len), len, 20000); }

    async getInfo(type, param) {
      const args = new Uint8Array(16);
      args[0] = type;
      new DataView(args.buffer).setUint32(4, param, true);
      return this.cmd(CMD.GET_INFO, args, 256);
    }

    async reboot(toBootsel) {
      if (this.chip === "rp2040") {
        // pc 0: regular boot path; sp = end of SRAM; delay 500 ms
        await this.cmd(CMD.REBOOT, this.le32(0, SRAM_END.rp2040, 500));
      } else {
        await this.cmd(CMD.REBOOT2, toBootsel ? this.le32(0x2, 500, 0, 0) : this.le32(0x0, 500, 0xffffffff, 0));
      }
    }

    // Read flash, aligned to pages (the bootloader reads flash in pages)
    async readFlash(addr, len) {
      const a = addr & ~(PAGE - 1), e = (addr + len + PAGE - 1) & ~(PAGE - 1);
      const b = await this.read(a, e - a);
      return b.subarray(addr - a, addr - a + len);
    }

    // Reader for readBinaryInfo: flash and ROM only (RAM is the bootloader's)
    reader() {
      return async (addr, len) => {
        if (addr >= FLASH && addr + len <= FLASH + FLASH_MAX[this.chip]) return this.readFlash(addr, len);
        return null;
      };
    }
  }

  /* ---------- Sessions ---------- */

  // Chip info: -> { chip, rom, revision, flashSize, chipId, package, cpu, cpus, secure, debug, programs: [...] }
  async function chipInfo(pb) {
    const info = { chip: pb.chip };
    const rom = await pb.read(0x13, 1);
    info.rom = rom[0];
    if (pb.chip === "rp2040") info.revision = { 1: "B0", 2: "B1", 3: "B2" }[rom[0]] || `ROM version ${rom[0]}`;
    else info.revision = { 2: "A2", 3: "A3", 4: "A4" }[rom[0]] || `ROM version ${rom[0]}`;
    if (pb.chip === "rp2350") {
      try {
        const b = await pb.getInfo(1, 0x0001 | 0x0002 | 0x0004 | 0x0008);
        const words = [];
        for (let i = 0; i < 64; i++) words.push(u32(b, i * 4));
        let k = 0;
        const n = words[k++], incl = words[k++];
        if (n && incl & 1) {
          info.package = words[k] ? "QFN60 (RP2350A)" : "QFN80 (RP2350B)";
          info.chipId = (words[k + 2] >>> 0).toString(16).padStart(8, "0") + (words[k + 1] >>> 0).toString(16).padStart(8, "0");
          k += 3;
        }
        let critical = 0, cpu = 0;
        if (incl & 2) critical = words[k++];
        if (incl & 4) cpu = words[k++];
        if (incl & 8) info.flashDevInfo = words[k++];
        if (incl & 4) info.cpu = cpu === 1 ? "RISC-V" : "Arm";
        if (incl & 2) {
          const cpus = [];
          if (!(critical & 0x10000)) cpus.push("Arm");           // ARM_DISABLE
          if (!(critical & 0x20000) && !(critical & 1)) cpus.push("RISC-V");   // RISCV_DISABLE, SECURE_BOOT_ENABLE
          info.cpus = cpus.join(", ");
          info.secure = !!(critical & 1);
          info.debug = !(critical & 4);
        }
      } catch (e) { /* older boot ROMs */ }
    }
    // Flash size: the flash repeats every <size> bytes; erased flash cannot tell
    await pb.exclusive(true);
    await pb.exitXip();
    const first = await pb.read(FLASH, 2 * PAGE);
    const erased = first.every((x) => x === 0xff);
    const same = (a, b) => a.every((x, i) => x === b[i]);
    if (!erased && !same(first.subarray(0, PAGE), first.subarray(PAGE))) {
      let size;
      for (size = 8 << 20; size >= 16 * PAGE; size >>= 1) {
        const p = await pb.read(FLASH + size, 2 * PAGE);
        if (!same(first, p)) break;
      }
      info.flashSize = size * 2;
    }
    info.erased = erased;
    if (!erased) {
      try { info.program = await readBinaryInfo(pb.reader(), pb.chip); } catch (e) { info.program = null; }
    }
    return info;
  }

  // Write the image: erase each 4 KB sector that holds data, write the pages,
  // read everything back. progress(phase, fraction)
  async function flash(pb, img, progress, log) {
    await pb.exclusive(true);
    await pb.exitXip();
    const sectors = [...new Set([...img.pages.keys()].map((a) => a & ~(SECTOR - 1)))].sort((a, b) => a - b);
    let done = 0;
    for (const s of sectors) {
      await pb.erase(s, SECTOR);
      // Contiguous runs of pages within the sector in one transfer
      let a = s;
      while (a < s + SECTOR) {
        if (!img.pages.has(a)) { a += PAGE; continue; }
        let e = a;
        while (e < s + SECTOR && img.pages.has(e)) e += PAGE;
        const buf = new Uint8Array(e - a);
        for (let p = a; p < e; p += PAGE) buf.set(img.pages.get(p), p - a);
        await pb.write(a, buf);
        a = e;
      }
      done++;
      if (progress) progress("write", done / sectors.length);
    }
    if (log) log(`Wrote ${img.size.toLocaleString("en")} bytes in ${sectors.length} sectors of 4 KB.`);
    // Verify
    const total = img.size;
    let checked = 0;
    for (const [from, to] of img.ranges) {
      for (let a = from; a < to; a += SECTOR) {
        const n = Math.min(SECTOR, to - a);
        const b = await pb.read(a, n);
        for (let i = 0; i < n; i++) {
          const want = img.pages.get((a + i) & ~(PAGE - 1))[(a + i) & (PAGE - 1)];
          if (b[i] !== want) throw new PicoError(`Verification failed at ${hex(a + i)}: read ${hex(b[i], 2)}, expected ${hex(want, 2)}.`);
        }
        checked += n;
        if (progress) progress("verify", checked / total);
      }
    }
  }

  // Erase the whole flash (size: bytes; 0 = 2 MB, the size of the Pico's flash)
  async function eraseAll(pb, size, progress) {
    await pb.exclusive(true);
    await pb.exitXip();
    size = size || (2 << 20);
    const step = 64 * 1024;
    for (let a = 0; a < size; a += step) {
      await pb.erase(FLASH + a, Math.min(step, size - a));
      if (progress) progress("erase", (a + step) / size);
    }
  }

  // Read the flash into a file
  async function dump(pb, size, progress) {
    await pb.exclusive(true);
    await pb.exitXip();
    const out = new Uint8Array(size), step = 16 * 1024;
    for (let a = 0; a < size; a += step) {
      out.set(await pb.read(FLASH + a, Math.min(step, size - a)), a);
      if (progress) progress("read", Math.min(1, (a + step) / size));
    }
    return out;
  }

  // Build a UF2 file from flash contents (for saving a read-out)
  function makeUf2(data, base, family) {
    // Trailing erased pages are left out
    let end = data.length;
    while (end > 0 && data[end - 1] === 0xff) end--;
    end = (end + PAGE - 1) & ~(PAGE - 1);
    const n = Math.max(1, end / PAGE), out = new Uint8Array(n * 512), v = new DataView(out.buffer);
    for (let i = 0; i < n; i++) {
      const o = i * 512;
      v.setUint32(o, 0x0a324655, true); v.setUint32(o + 4, 0x9e5d5157, true);
      v.setUint32(o + 8, 0x2000, true); v.setUint32(o + 12, base + i * PAGE, true);
      v.setUint32(o + 16, PAGE, true); v.setUint32(o + 20, i, true); v.setUint32(o + 24, n, true);
      v.setUint32(o + 28, family, true);
      out.set(data.subarray(i * PAGE, i * PAGE + PAGE), o + 32);
      v.setUint32(o + 508, 0x0ab16f30, true);
    }
    return out;
  }

  global.PICOBOOT = {
    VID, PID_RP2040, PID_RP2350, FILTERS, FLASH, PAGE, SECTOR, FAMILY, FAMILY_NAME, FLASH_MAX,
    PicoError, Picoboot, parseUf2, readFile, buildImage, readBinaryInfo, imageReader, chipInfo, flash, eraseAll, dump, makeUf2, hex, sleep,
  };
})(typeof window !== "undefined" ? window : globalThis);
