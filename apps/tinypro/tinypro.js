/* XGecu Memory Programmer: programmer protocols, memory operations and chip database.
 * A port of tinyPro v1.0 (https://github.com/wagiminator/MCU-Flash-Tools), which is a port of the
 * relevant parts of minipro (https://gitlab.com/DavidGriffith/minipro).
 * License: GNU General Public License v3.0 or later (derived from minipro).
 * Supports the TL866A, TL866CS, TL866II+ and T48 through WebUSB; the order of the USB
 * transfers is the same as in tinypro.py. */
(function (global) {
  "use strict";

  /* ================================================================================
   * Helpers
   * ================================================================================ */

  class ProgrammerError extends Error { constructor(m) { super(m); this.name = "ProgrammerError"; } }

  const TIMEOUT = 5000;                 // USB write timeout in ms
  const READ_TIMEOUT = 360000;          // USB read timeout in ms (erase can take long)

  const le = (v, n) => { const a = new Array(n); for (let i = 0; i < n; i++) a[i] = Math.floor(v / 2 ** (8 * i)) & 0xff; return a; };
  const fromLe = (d) => { let v = 0; for (let i = d.length - 1; i >= 0; i--) v = v * 256 + d[i]; return v; };
  const fromBe = (d) => { let v = 0; for (let i = 0; i < d.length; i++) v = v * 256 + d[i]; return v; };
  const hx = (v, n) => "0x" + v.toString(16).toUpperCase().padStart(n || 2, "0");
  const pad2 = (v) => String(v).padStart(2, "0");

  function withTimeout(promise, ms, msg) {
    let timer;
    return Promise.race([
      promise.finally(() => clearTimeout(timer)),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new ProgrammerError(msg)), ms); }),
    ]);
  }

  // Random bytes (TSOP adapter check)
  function randomBytes(n) {
    const b = new Uint8Array(n);
    if (global.crypto && global.crypto.getRandomValues) global.crypto.getRandomValues(b);
    else for (let i = 0; i < n; i++) b[i] = Math.floor(Math.random() * 256);
    return b;
  }

  /* ================================================================================
   * USB device (WebUSB)
   * ================================================================================ */

  const TL866A_VID = 0x04D8, TL866A_PID = 0xE11C;          // TL866A, TL866CS
  const TL866II_VID = 0xA466, TL866II_PID = 0x0A53;        // TL866II+, T48, T56
  const USB_FILTERS = [{ vendorId: TL866A_VID, productId: TL866A_PID }, { vendorId: TL866II_VID, productId: TL866II_PID }];
  const MP_TL866A = 1, MP_TL866CS = 2, MP_TL866IIPLUS = 5, MP_T56 = 6, MP_T48 = 7;

  class Usb {
    constructor(device) { this.dev = device; this.claimed = false; }
    async open() {
      const d = this.dev;
      try {
        if (!d.opened) await d.open();
        if (!d.configuration) await d.selectConfiguration(1);
        await d.claimInterface(0);
        this.claimed = true;
      } catch (err) {
        if (d.opened) { try { await d.close(); } catch (e) { /* ignore */ } }
        throw new ProgrammerError(`The programmer could not be opened (${err.message}). Close Xgpro, minipro or tinypro, and on Windows check the driver.`);
      }
    }
    async write(ep, data, timeout) {
      const r = await withTimeout(this.dev.transferOut(ep & 0x7f, data), timeout || TIMEOUT, "USB write timed out");
      if (r.status !== "ok") throw new ProgrammerError(`USB write failed (${r.status})`);
      if (r.bytesWritten !== undefined && r.bytesWritten !== data.length) {
        throw new ProgrammerError(`USB write error (expected ${data.length} bytes, ${r.bytesWritten} transferred)`);
      }
    }
    async read(ep, size, timeout) {
      const r = await withTimeout(this.dev.transferIn(ep & 0x7f, size), timeout || READ_TIMEOUT, "USB read timed out");
      if (r.status !== "ok") throw new ProgrammerError(`USB read failed (${r.status})`);
      return new Uint8Array(r.data.buffer, r.data.byteOffset, r.data.byteLength).slice();
    }
    async close() {
      if (this.claimed) { try { await this.dev.releaseInterface(0); } catch (e) { /* ignore */ } }
      this.claimed = false;
      try { await this.dev.close(); } catch (e) { /* ignore */ }
    }
  }

  // Open the programmer, read the system info and create the matching programmer object
  async function openProgrammer(device) {
    const usb = new Usb(device);
    await usb.open();
    try {
      await usb.write(0x01, new Uint8Array(5));            // get system info
      let info = await usb.read(0x81, 80, TIMEOUT);
      if (info.length < 80) { const x = new Uint8Array(80); x.set(info); info = x; }
      const version = info[6];
      let prog;
      if (version === MP_TL866A || version === MP_TL866CS) prog = new TL866A(usb, info);
      else if (version === MP_TL866IIPLUS) prog = new TL866IIPlus(usb, info);
      else if (version === MP_T48) prog = new T48(usb, info);
      else if (version === MP_T56) throw new ProgrammerError("The T56 is not supported by this app (it needs FPGA algorithm files); use tinypro.py or minipro");
      else throw new ProgrammerError(`Unknown programmer model (${hx(version)})`);
      if (prog.bootloader) throw new ProgrammerError(`The ${prog.model} is in bootloader mode (update or restart it with Xgpro)`);
      return prog;
    } catch (err) {
      await usb.close();
      throw err;
    }
  }

  /* ================================================================================
   * Programmer base class
   * ================================================================================ */

  class Programmer {
    constructor(usb) {
      this.usb = usb;
      this.chip = null;
      this.active = false;
      this.voltage = 0;
      this.database = "INFOIC2PLUS";
    }
    close() { return this.usb.close(); }

    send(data, ep = 0x01, timeout) { return this.usb.write(ep, data instanceof Uint8Array ? data : Uint8Array.from(data), timeout); }

    // Receive message (padded with zeros to the requested size)
    async recv(size, ep = 0x81) {
      const d = await this.usb.read(ep, size);
      if (d.length >= size) return d.subarray(0, size);
      const x = new Uint8Array(size);
      x.set(d);
      return x;
    }

    // Read chip ID, returns [id_type, chip_id]
    async getChipId() {
      const msg = await this._chipIdMsg();
      const idType = msg[0];
      const n = Math.min(4, this.chip.chipIdBytes);
      if (!n) return [idType, 0];
      const raw = msg.subarray(2, 2 + n);
      return [idType, idType === 3 || idType === 4 ? fromLe(raw) : fromBe(raw)];
    }

    // Check status after a block transfer, returns [error, address, c1, c2]
    async checkStatus() {
      const [error, address, c1, c2, ovc] = await this.getStatus();
      if (ovc) throw new ProgrammerError("Overcurrent protection (check the chip orientation and package)");
      return [error, address, c1, c2];
    }

    // Auto-detect SPI flash (8 pin first, then 16 pin)
    async autodetect(db, log) {
      for (const pins of [8, 16]) {
        const id = await this.spiAutodetect(pins);
        await this.endTransaction(true);
        if (id === 0 || id === 0xFFFFFF) continue;
        const chips = db.findById(id, pins, this);
        if (chips.length) {
          log(`Found SPI flash with JEDEC ID ${hx(id, 6)}.`, "ok");
          const names = [];
          const first = chips[0].name.split("@")[0];
          for (const c of chips) {
            for (let n of c.entry.names) {
              n = n.split("@")[0];
              if (!names.includes(n) && n !== first) names.push(n);
            }
          }
          return [chips[0], names.slice(0, 10), id];
        }
        throw new ProgrammerError(`Unknown SPI flash with JEDEC ID ${hx(id, 6)}, select the chip from the list`);
      }
      throw new ProgrammerError("No SPI flash detected (check the chip and its position in the socket), or select the chip from the list");
    }
  }

  /* ================================================================================
   * TL866A / TL866CS
   * ================================================================================ */

  class TL866A extends Programmer {
    constructor(usb, info) {
      super(usb);
      this.database = "INFOIC";
      this.expectedFirmware = 0x0256;
      this.expectedFirmwareStr = "03.2.86";
      this.model = info[6] === MP_TL866A ? "TL866A" : "TL866CS";
      this.bootloader = info[1] === 2;
      this.hw = info[39];
      this.firmware = fromLe(info.subarray(4, 6));
      this.firmwareStr = `${pad2(this.hw)}.${info[5]}.${pad2(info[4])}`;
      this.canCheckTsop = true;
    }

    // Message header with protocol and variant of the selected chip
    _msg(cmd, length = 64) {
      const m = new Uint8Array(length);
      m[0] = cmd;
      if (this.chip) { m[1] = this.chip.protocolId & 0xff; m[2] = this.chip.variant & 0xff; }
      return m;
    }

    async beginTransaction() {
      const c = this.chip;
      const m = this._msg(0x03);
      m.set(le(c.dataSize, 2), 3);
      m[5] = (c.vpp << 4) & 0xff;
      m.set(le(c.pageSize, 2), 6);
      m[8] = ((c.vdd << 4) | c.vcc) & 0xff;
      m.set(le(c.pulseDelay, 2), 9);
      m[11] = 0x00;                                         // no ICSP
      m.set(le(c.codeSize, 3), 12);
      await this.send(m.subarray(0, 48));
      this.active = true;
      await this.checkStatus();
    }

    async endTransaction(force = false) {
      if (this.active || force) {
        await this.send(this._msg(0x04).subarray(0, 4));
        this.active = false;
      }
    }

    async readBlock(data, addr, size) {
      const m = this._msg(data ? 0x30 : 0x21);
      m.set(le(size, 2), 2);
      m.set(le(addr, 3), 4);
      await this.send(m.subarray(0, 18));
      return this.recv(size);
    }

    async writeBlock(data, addr, buf) {
      const m = this._msg(data ? 0x31 : 0x20, 7);
      m.set(le(buf.length, 2), 2);
      m.set(le(addr, 3), 4);
      const out = new Uint8Array(7 + buf.length);
      out.set(m);
      out.set(buf, 7);
      await this.send(out);
    }

    async _chipIdMsg() {
      await this.send(this._msg(0x05).subarray(0, 8));
      return this.recv(32);
    }

    async spiAutodetect(pins) {
      const m = new Uint8Array(10);
      m[0] = 0xFC;
      m[7] = pins === 16 ? 1 : 0;
      await this.send(m);
      return fromBe((await this.recv(16)).subarray(2, 5));
    }

    protectOff() { return this.send(this._msg(0x44).subarray(0, 10)); }
    protectOn() { return this.send(this._msg(0x45).subarray(0, 10)); }

    async erase() {
      const m = this._msg(0x22);
      m[2] = 1;
      await this.send(m.subarray(0, 15));
      await this.recv(64);
    }

    async getStatus() {
      await this.send(this._msg(0xFE).subarray(0, 5));
      const m = await this.recv(64);
      return [m[0], fromLe(m.subarray(6, 9)), fromLe(m.subarray(2, 4)), fromLe(m.subarray(4, 6)), m[9]];
    }

    async unlockTsop48() {
      const m = new Uint8Array(17);
      m[0] = 0xFD;
      const seed = randomBytes(8);
      m.set(seed, 7);
      const crc = crc16Tsop(seed);
      m[15] = m[9]; m[16] = m[11];
      m[9] = crc & 0xff; m[11] = crc >> 8;
      await this.send(m);
      return (await this.recv(64))[1];
    }
  }

  // CRC16 used for unlocking the TSOP48 adapter
  function crc16Tsop(data) {
    let crc = 0;
    for (const b of data) {
      crc = ((crc >> 8) | (crc << 8)) & 0xFFFF;
      crc ^= b;
      crc ^= (crc & 0xFF) >> 4;
      crc ^= (crc << 12) & 0xFFFF;
      crc ^= ((crc & 0xFF) << 5) & 0xFFFF;
    }
    return crc;
  }

  /* ================================================================================
   * TL866II+
   * ================================================================================ */

  class TL866IIPlus extends Programmer {
    constructor(usb, info) {
      super(usb);
      this.expectedFirmware = 0x0284;
      this.expectedFirmwareStr = "04.2.132";
      this.chipIdSize = 6;
      this.autodetectSize = 16;
      this.model = "TL866II+";
      this.bootloader = info[4] === 0;
      this.hw = info[40];
      this.firmware = fromLe(info.subarray(4, 6));
      this.firmwareStr = `${pad2(this.hw)}.${info[5]}.${pad2(info[4])}`;
      this.canCheckTsop = true;
    }

    async beginTransaction() {
      const c = this.chip, v = c.voltages;
      const m = new Uint8Array(64);
      m[0] = 0x03;
      m[1] = c.protocolId & 0xff;
      m[2] = c.variant & 0xff;
      m[3] = 0x00;                                          // no ICSP
      m.set(le(v, 2), 4);
      m[6] = c.chipInfo & 0xff;
      m[7] = c.pinMap & 0xff;
      m.set(le(c.dataSize, 2), 8);
      m.set(le(c.pageSize, 2), 10);
      m.set(le(c.pulseDelay, 2), 12);
      m.set(le(c.data2Size, 2), 14);
      m.set(le(c.codeSize, 4), 16);
      m[20] = Math.floor(v / 0x10000) & 0xff;
      if ((v & 0xF0) === 0xF0) {
        m[22] = v & 0xff;
      } else {
        m[21] = v & 0x0F;
        m[22] = v & 0xF0;
      }
      if (v >= 0x80000000) m[22] = Math.floor(v / 0x10000) & 0x0F;
      m.set(le(c.package, 4), 40);
      m.set(le(c.readBufferSize, 2), 44);
      m.set(le(c.flags, 4), 56);
      await this.send(m);
      this.active = true;
      await this.checkStatus();
    }

    async endTransaction(force = false) {
      if (this.active || force) {
        const m = new Uint8Array(8);
        m[0] = 0x04;
        await this.send(m);
        this.active = false;
      }
    }

    _blockMsg(cmd, addr, size) {
      const m = new Uint8Array(8);
      m[0] = cmd;
      m.set(le(size, 2), 2);
      m.set(le(addr, 4), 4);
      return m;
    }

    async readBlock(data, addr, size) {
      await this.send(this._blockMsg(data ? 0x10 : 0x0D, addr, size));
      return this._readPayload(size);
    }

    // Payloads larger than 64 bytes are read interleaved from endpoints 2 and 3
    async _readPayload(size) {
      if (size < 64) return (await this.recv(64, 0x82)).subarray(0, size);
      if (size === 64) return this.recv(64, 0x82);
      const half = size >> 1;
      const [a, b] = await Promise.all([this.recv(half, 0x82), this.recv(half, 0x83)]);
      const out = new Uint8Array(size);
      for (let i = 0; i < size >> 6; i++) {
        const src = i % 2 === 0 ? a : b;
        const o = (i >> 1) * 64;
        out.set(src.subarray(o, o + 64), i * 64);
      }
      return out;
    }

    async writeBlock(data, addr, buf) {
      const m = this._blockMsg(data ? 0x11 : 0x0C, addr, buf.length);
      if (buf.length < 57) {                               // header and payload fit into 64 bytes
        const out = new Uint8Array(8 + buf.length);
        out.set(m);
        out.set(buf, 8);
        await this.send(out);
      } else {
        await this.send(m);
        await this._writePayload(this._pad(buf));
      }
    }

    // Payload is always the size of the write buffer
    _pad(buf) {
      const size = this.chip.writeBufferSize;
      if (buf.length >= size) return buf;
      const out = new Uint8Array(size).fill(this.chip.blankValue);
      out.set(buf);
      return out;
    }

    // Payloads larger than 64 bytes are split onto endpoints 2 and 3 (as XGPro does)
    async _writePayload(buf) {
      const length = buf.length;
      if (length <= 64) { await this.send(buf, 0x02); return; }
      const j = length % 128;
      let ep2;
      if (j) { const k = (length - j) / 2; ep2 = j > 64 ? k + 64 : k; } else ep2 = length / 2;
      await Promise.all([this.send(buf.subarray(0, ep2), 0x02), this.send(buf.subarray(ep2), 0x03)]);
    }

    async _chipIdMsg() {
      const m = new Uint8Array(8);
      m[0] = 0x05;
      await this.send(m);
      const r = await this.recv(this.chipIdSize);
      const out = new Uint8Array(r.length + 32);
      out.set(r);
      return out;
    }

    async spiAutodetect(pins) {
      const m = new Uint8Array(10);
      m[0] = 0x37;
      m[8] = pins === 16 ? 1 : 0;
      await this.send(m);
      return fromBe((await this.recv(this.autodetectSize)).subarray(2, 5));
    }

    protectOff() { const m = new Uint8Array(8); m[0] = 0x18; return this.send(m); }
    protectOn() { const m = new Uint8Array(8); m[0] = 0x19; return this.send(m); }

    async erase() {
      const m = new Uint8Array(15);
      m[0] = 0x0E;
      m[2] = 1;
      await this.send(m);
      await this.recv(64);
    }

    async getStatus() {
      const m = new Uint8Array(8);
      m[0] = 0x39;
      await this.send(m);
      const r = await this.recv(32);
      return [r[0], fromLe(r.subarray(8, 12)), fromLe(r.subarray(2, 4)), fromLe(r.subarray(4, 6)), r[12]];
    }

    async unlockTsop48() {
      const m = new Uint8Array(48);
      m[0] = 0x38;
      const seed = randomBytes(8);
      m.set(seed, 8);
      const crc = crc16Tsop(seed);
      m[16] = m[10]; m[17] = m[12];
      m[10] = crc & 0xff; m[12] = crc >> 8;
      await this.send(m);
      return (await this.recv(8))[1];
    }
  }

  /* ================================================================================
   * T48
   * ================================================================================ */

  class T48 extends TL866IIPlus {
    constructor(usb, info) {
      super(usb, info);
      this.expectedFirmware = 0x011F;
      this.expectedFirmwareStr = "01.1.31";
      this.chipIdSize = 32;
      this.autodetectSize = 32;
      this.model = "T48";
      this.hw = 0;
      this.firmwareStr = `${pad2(this.hw)}.${info[5]}.${pad2(info[4])}`;
      this.voltage = Math.floor(fromLe(info.subarray(56, 60)) * 0xCCF6 / 0x27000) / 100;
      this.canCheckTsop = false;                            // the T48 has no TSOP48 adapter check
    }

    // T48 transfers payloads on endpoint 2 only
    async _readPayload(size) {
      if (size < 64) return (await this.recv(64, 0x82)).subarray(0, size);
      return this.recv(size, 0x82);
    }

    async writeBlock(data, addr, buf) {
      await this.send(this._blockMsg(data ? 0x11 : 0x0C, addr, buf.length));
      await this._writePayload(this._pad(buf));
    }

    _writePayload(buf) { return this.send(buf, 0x02); }
  }

  /* ================================================================================
   * Memory operations
   * ================================================================================ */

  class TinyPro {
    constructor(prog, chip, memory = "code", log = null, db = null) {
      this.prog = prog;
      this.chip = chip;
      this.data = memory === "data";
      this.size = this.data ? chip.dataSize : chip.codeSize;
      this.log = log || (() => {});
      this.db = db;
      prog.chip = chip;
    }

    // Check programmer support and adapters
    async prepare() {
      const chip = this.chip, prog = this.prog;
      if (!chip.availableOn(prog)) throw new ProgrammerError(`${chip.name} is not supported by the ${prog.model} (only ${chip.availableStr()})`);
      if (chip.adapterName) this.log(`Note: ${chip.name} needs a ${chip.adapterName} adapter.`);
      if ([1, 2, 6].includes(chip.adapter)) {               // TSOP48, SOP44, SOP56 adapter check
        if (!prog.canCheckTsop) {
          this.log(`Warning: the ${chip.adapterName} adapter cannot be checked with the ${prog.model}.`, "warn");
        } else {
          const status = await prog.unlockTsop48();
          await prog.endTransaction(true);
          if (status === 0x01) throw new ProgrammerError(`${chip.adapterName} adapter not found`);
          if (status === 0x03 || status === 0x04) this.log(`Warning: fake ${chip.adapterName} adapter found.`, "warn");
        }
      }
    }

    // Check chip ID
    async checkId(ignore = false) {
      const chip = this.chip, prog = this.prog;
      if (!chip.hasChipId) return null;
      await prog.beginTransaction();
      const [idType, id] = await prog.getChipId();
      await prog.endTransaction();
      const shift = idType === 3 || idType === 4 ? 5 : 0;
      const sh = (v) => Math.floor(v / 2 ** shift);
      if (sh(id) === sh(chip.chipId)) {
        this.log(`Chip ID ${hx(id, 4)} is correct.`, "ok");
        return id;
      }
      const other = this.db ? this.db.nameById(sh(id) * 2 ** shift) : null;
      const msg = `Chip ID mismatch: expected ${hx(sh(chip.chipId), 4)}, got ${hx(sh(id), 4)} (${other || "unknown or no chip"})`;
      if (!ignore) throw new ProgrammerError(msg + `. Check the chip and its position, or tick "Ignore chip ID mismatch"`);
      this.log(`Warning: ${msg}.`, "warn");
      return id;
    }

    checkImage(data) {
      if (data.length > this.size) throw new ProgrammerError(`The file (${data.length} bytes) exceeds the memory size (${this.size} bytes)`);
    }

    _addr(offset) { return this.chip.hasWord && !this.data ? Math.floor(offset / 2) : offset; }

    // Read memory (size bytes, rounded up to read blocks)
    async _read(size, progress) {
      const bs = Math.min(this.size, this.chip.readBufferSize);
      const out = new Uint8Array(Math.ceil(size / bs) * bs);
      let offset = 0;
      while (offset < size) {
        out.set(await this.prog.readBlock(this.data, this._addr(offset), bs), offset);
        await this.prog.checkStatus();
        offset += bs;
        if (progress) progress(Math.min(offset, size) / size);
      }
      return out.subarray(0, size);
    }

    async read(progress) {
      await this.prog.beginTransaction();
      const data = await this._read(this.size, progress);
      await this.prog.endTransaction();
      return data;
    }

    async erase() {
      await this.prog.beginTransaction();
      await this.prog.erase();
      await this.prog.endTransaction();
    }

    // Write memory (file size rounded up to write blocks, padded with the blank value)
    async write(data, progress) {
      const chip = this.chip, prog = this.prog;
      const bs = chip.writeBufferSize;
      const size = Math.min(this.size, Math.ceil(data.length / bs) * bs);
      const buf = new Uint8Array(size).fill(chip.blankValue);
      buf.set(data.subarray(0, size));
      await prog.beginTransaction();
      if (chip.offProtectBefore) await prog.protectOff();
      let offset = 0;
      while (offset < size) {
        const block = buf.subarray(offset, offset + bs);
        await prog.writeBlock(this.data, this._addr(offset), block);
        const [error, address, c1, c2] = await prog.checkStatus();
        if (error) {
          const mask = chip.wordSize === 2 ? 0xFFFF : 0xFF;
          throw new ProgrammerError(`Write failed at address ${hx(address, 4)}: file ${hx(c2 & mask)}, chip ${hx(c1 & mask)}${this._hint()}`);
        }
        offset += block.length;
        if (progress) progress(offset / size);
      }
      await prog.endTransaction();
    }

    // Verify memory against data (optionally enable write protection afterwards)
    async verify(data, protect = false, progress) {
      await this.prog.beginTransaction();
      const chip = await this._read(data.length, progress);
      if (protect) await this.prog.protectOn();
      await this.prog.endTransaction();
      this._compare(data, chip);
    }

    async blankCheck(progress) {
      await this.prog.beginTransaction();
      const chip = await this._read(this.size, progress);
      await this.prog.endTransaction();
      const b = this.chip.blankValue;
      for (let i = 0; i < this.size; i++) {
        if (chip[i] !== b) throw new ProgrammerError(`The memory is not blank at address ${hx(i, 4)} (${hx(chip[i])})`);
      }
    }

    _compare(data, chip) {
      for (let i = 0; i < data.length; i++) {
        if (data[i] !== chip[i]) throw new ProgrammerError(`Verification failed at address ${hx(i, 4)}: file ${hx(data[i])}, chip ${hx(chip[i])}${this._hint()}`);
      }
    }

    _hint() {
      if (!this.chip.canErase) return " (chip not blank?)";
      if (this.chip.offProtectBefore) return " (chip write-protected?)";
      return "";
    }
  }

  /* ================================================================================
   * Chip database
   * ================================================================================ */

  const ADAPTERS = { 1: "TSOP48", 2: "SOP44", 3: "TSOP40", 4: "VSOP40", 5: "TSOP32", 6: "SOP56" };
  const FIELDS = ["protocolId", "variant", "readBufferSize", "writeBufferSize", "codeSize", "dataSize", "data2Size",
    "pageSize", "chipId", "voltages", "pulseDelay", "flags", "chipInfo", "pinMap", "package"];

  function chipIdBytes(id) {
    for (let n = 4; n >= 1; n--) if (Math.floor(id / 2 ** (8 * (n - 1))) & 0xff) return n;
    return 0;
  }

  function pinCount(pkg) {
    const top = Math.floor(pkg / 0x1000000);
    if (top === 0xFF) return 32;
    if (top === 0xFD) return 44;
    return top & 0x7F;
  }

  class Chip {
    constructor(entry, name) {
      this.entry = entry;
      this.name = name;
      this.manufacturer = entry.manufacturer;
      const f = entry.fields;
      FIELDS.forEach((k, i) => { this[k] = f[i] ? parseInt(f[i], 16) : 0; });
      this.blankValue = f[15] ? parseInt(f[15], 16) : 0xFF;
      const fl = this.flags;
      this.reversedPackage = !!(fl & 0x00000002);
      this.canErase = !!(fl & 0x00000010);
      this.hasChipId = !!(fl & 0x00000020);
      this.hasWord = !!(fl & 0x00002000);
      this.offProtectBefore = !!(fl & 0x00004000);
      this.protectAfter = !!(fl & 0x00008000);
      this.wordSize = (fl & 0x03000000) === 0x01000000 ? 2 : 1;
      this.chipIdBytes = chipIdBytes(this.chipId);
      this.vdd = (this.voltages >> 12) & 0x0F;
      this.vcc = (this.voltages >> 8) & 0x0F;
      this.vpp = this.voltages & 0xFF;
      this.pinCount = pinCount(this.package);
      this.adapter = this.package & 0xFF;
      this.adapterName = ADAPTERS[this.adapter] || (this.adapter ? "special" : null);
      const top = Math.floor(this.package / 0x1000000);
      if (top === 0xFF || top === 0xFD) this.adapterName = `PLCC${this.pinCount}`;
    }

    // Check if the chip is supported by the programmer
    availableOn(prog) {
      const fl = Math.floor(this.pinMap / 2 ** 28) & 0x07;
      if (!prog || prog.database !== "INFOIC2PLUS" || !fl) return true;
      return !!(fl & { "TL866II+": 0x02, T48: 0x04, T56: 0x01 }[prog.model]);
    }

    availableStr() {
      const fl = Math.floor(this.pinMap / 2 ** 28) & 0x07;
      return [[0x02, "TL866II+"], [0x04, "T48"], [0x01, "T56"]].filter(([b]) => fl & b).map(([, n]) => n).join("/");
    }

    describe() {
      let s = `${this.codeSize} bytes`;
      if (this.dataSize) s += ` + ${this.dataSize} bytes data memory`;
      return s;
    }
  }

  class ChipDB {
    constructor(text, database) {
      this.database = database;
      this.entries = [];
      let section = null, man = null;
      for (const line of text.split("\n")) {
        if (line.startsWith("%")) { section = line.slice(1); continue; }
        if (section !== database || !line) continue;
        if (line.startsWith("#")) { man = line.slice(1); continue; }
        const f = line.split("\t");
        this.entries.push({ names: f[0].split(","), manufacturer: man, fields: f.slice(1), _chip: null });
      }
      this.index = [];                                      // all names for the search
      this.entries.forEach((e, i) => { for (const n of e.names) this.index.push({ name: n, upper: n.toUpperCase(), e: i }); });
    }

    chip(e, name) { return new Chip(e, name || e.names[0]); }
    _first(e) { if (!e._chip) e._chip = new Chip(e, e.names[0]); return e._chip; }

    // Find chip by name (as tinypro -d: exact name, else name without package; entries
    // available on the programmer first, DIP preferred if the package is ambiguous)
    find(name, prog) {
      const key = name.trim().toUpperCase();
      const exact = [], base = [];
      for (const x of this.index) {
        if (x.upper === key) exact.push(new Chip(this.entries[x.e], x.name));
        else if (x.upper.split("@")[0] === key) base.push(new Chip(this.entries[x.e], x.name));
      }
      for (const found of [exact, base]) {
        if (!found.length) continue;
        let cand = found.filter((c) => c.availableOn(prog));
        if (!cand.length) cand = found;
        if (found === base && new Set(cand.map((c) => c.name.toUpperCase())).size > 1) {
          const dip = cand.filter((c) => c.name.toUpperCase().includes("@DIP"));
          if (new Set(dip.map((c) => c.name.toUpperCase())).size === 1) return dip[0];
          const names = [...new Set(base.map((c) => c.name))].sort();
          throw new ProgrammerError(`${name} is ambiguous, please choose one of: ${names.slice(0, 12).join(", ")}${names.length > 12 ? ", ..." : ""}`);
        }
        return cand[0];
      }
      throw new ProgrammerError(`Unknown chip ${name}`);
    }

    // Names matching a query (substring or wildcards * ?), best matches first
    search(query, prog, limit = 50) {
      const q = query.trim().toUpperCase();
      if (!q) return [];
      const wild = /[*?]/.test(q);
      const re = wild ? new RegExp("^" + q.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$") : null;
      const out = [];
      for (const x of this.index) {
        let rank;
        if (wild) { if (!re.test(x.upper)) continue; rank = 2; }
        else {
          const p = x.upper.indexOf(q);
          if (p < 0) continue;
          rank = x.upper === q ? 0 : x.upper.split("@")[0] === q ? 1 : p === 0 ? 2 : 3;
        }
        out.push({ rank, x });
      }
      out.sort((a, b) => a.rank - b.rank || a.x.upper.length - b.x.upper.length || (a.x.upper < b.x.upper ? -1 : 1));
      const res = [];
      for (const { x } of out) {
        const e = this.entries[x.e];
        const ok = this._first(e).availableOn(prog);
        res.push({ name: x.name, manufacturer: e.manufacturer, available: ok, entry: e });
        if (res.length >= limit) break;
      }
      return { results: res, total: out.length };
    }

    // Find SPI flash chips by JEDEC ID and pin count
    // (chips of the manufacturer that is most common for the JEDEC manufacturer ID first)
    findById(id, pins, prog) {
      const result = [];
      const vendors = new Map();
      for (const e of this.entries) {
        const c = this._first(e);
        if (Math.floor(c.chipId / 0x10000) === Math.floor(id / 0x10000) && c.chipId <= 0xFFFFFF) vendors.set(e.manufacturer, (vendors.get(e.manufacturer) || 0) + 1);
        if (c.chipId === id && c.hasChipId && c.pinCount === pins && c.availableOn(prog)) result.push(c);
      }
      let vendor = null, best = -1;
      for (const [v, n] of vendors) if (n > best) { best = n; vendor = v; }
      return result.map((c, i) => [c, i]).sort((a, b) => (a[0].entry.manufacturer !== vendor) - (b[0].entry.manufacturer !== vendor) || a[1] - b[1]).map((x) => x[0]);
    }

    // Find chip name by chip ID (for error messages)
    nameById(id) {
      if (!id) return null;
      for (const e of this.entries) if (this._first(e).chipId === id) return e.names[0];
      return null;
    }
  }

  // Load both databases from chips.js (gzip + base64)
  let dbText = null;
  async function loadDatabase() {
    if (dbText === null) {
      const b64 = global.TINYPRO_DB;
      if (!b64) throw new Error("The chip database (chips.js) is missing");
      const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const stream = new Blob([bin]).stream().pipeThrough(new DecompressionStream("gzip"));
      dbText = await new Response(stream).text();
    }
    return { INFOIC2PLUS: new ChipDB(dbText, "INFOIC2PLUS"), INFOIC: new ChipDB(dbText, "INFOIC") };
  }

  /* ================================================================================
   * Package and socket placement (for the app)
   * ================================================================================ */

  const PKG_CODES = { 0x21: "BGA48", 0x22: "BGA63", 0x23: "BGA64", 0x24: "EBGA64", 0x29: "BGA24", 0x2D: "BGA64",
    0x37: "TSOP28", 0x38: "PLCC20", 0x39: "TQFP44", 0x3C: "TQFP32", 0x3D: "PLCC44", 0x3F: "PLCC32" };
  const ADAPTER_PKG = { 1: "TSOP48", 2: "SOP44", 3: "TSOP40", 4: "VSOP40", 5: "TSOP32", 6: "SOP56", 10: "LQFP128", 11: "TSOP56", 13: "TSOP32" };

  // How the chip goes into the 40-pin ZIF socket: { pins, direct, adapter, pkg }
  //   pins: number of socket pins used (top of the socket: chip pin 1 in socket pin 1, the last pin in socket pin 40) or 0
  function placement(chip) {
    const suffix = chip.name.includes("@") ? chip.name.split("@")[1].toUpperCase() : "";
    const pkgName = suffix.replace(/[(-].*$/, "");
    const top = Math.floor(chip.package / 0x1000000) & 0xFF;
    const ad = chip.package & 0xFF;
    if (ad) {
      const p = ADAPTER_PKG[ad] || pkgName || "special";
      return { pins: 0, direct: false, pkg: pkgName || p, adapter: `${p} adapter${ad === 13 ? " (pin 9 to pin 1 variant)" : ""}`, xgecu: true };
    }
    if (top === 0xFF || top === 0xFD) return { pins: 0, direct: false, pkg: `PLCC${chip.pinCount}`, adapter: `PLCC${chip.pinCount} to DIP${chip.pinCount} adapter`, dip: chip.pinCount };
    if (PKG_CODES[top]) {
      const p = pkgName || PKG_CODES[top];
      return { pins: 0, direct: false, pkg: p, adapter: `${p} adapter` };
    }
    const pins = top;
    if (!pins) return { pins: 0, direct: false, pkg: pkgName || "unknown", adapter: null };
    if (pins > 40) return { pins: 0, direct: false, pkg: pkgName || `DIP${pins}`, adapter: `DIP${pins} adapter (the ZIF socket has 40 pins)` };
    const isDip = !pkgName || /^(P|C)?DIP/.test(pkgName);
    if (isDip) return { pins, direct: true, pkg: pkgName || `DIP${pins}`, adapter: null };
    return { pins, direct: false, pkg: pkgName, adapter: `${pkgName} to DIP${pins} adapter (or a test clip)` };
  }

  /* ================================================================================
   * One session (as the main function of tinypro.py)
   * ================================================================================ */

  // a: { chip (Chip or null: detect SPI flash), memory, read, erase, write: Uint8Array, verify: Uint8Array,
  //      blank, protect, ignoreId }; log(text, cls), progress(phase, fraction)
  async function runSession(prog, db, a, log, progress) {
    log = log || (() => {});
    const result = { prog };
    try {
      let chip = a.chip || null;
      if (!chip) {
        log("Detecting SPI flash …");
        const [c, others, id] = await prog.autodetect(db, log);
        chip = c;
        result.jedec = id;
        result.others = others;
        if (others.length) log(`Compatible: ${others.join(", ")}`);
      }
      result.chip = chip;
      const memory = a.memory || "code";
      if (memory === "data" && !chip.dataSize) throw new ProgrammerError(`${chip.name} has no data memory`);
      if (!a.chip) log(`Selected ${chip.name} with ${chip.describe()}.`, "ok");

      const pro = new TinyPro(prog, chip, memory, log, db);
      await pro.prepare();
      result.id = await pro.checkId(a.ignoreId);

      if (a.protect && !chip.protectAfter) throw new ProgrammerError("Write protection is not supported by this chip");
      if (a.erase && !chip.canErase) throw new ProgrammerError("This chip cannot be erased electrically (UV-EPROM?)");
      if (a.write) pro.checkImage(a.write);
      if (a.verify) pro.checkImage(a.verify);

      const p = (ph) => (progress ? (f) => progress(ph, f) : null);
      if (a.read) {
        log(`Reading the ${memory} memory (${pro.size.toLocaleString("en")} bytes) …`);
        result.data = await pro.read(p("read"));
        log(`${result.data.length.toLocaleString("en")} bytes read.`, "ok");
      }
      if (a.erase) {
        log("Erasing the chip …");
        await pro.erase();
        log("The chip is erased.", "ok");
      }
      if (a.write) {
        if (memory === "code" && chip.canErase && !a.erase) {
          log("Erasing the chip …");
          await pro.erase();
        }
        log(`Writing ${a.write.length.toLocaleString("en")} bytes to the ${memory} memory …`);
        await pro.write(a.write, p("write"));
        log("Verifying …");
        await pro.verify(a.write, !!a.protect, p("verify"));
        log(`${a.write.length.toLocaleString("en")} bytes written and verified.`, "ok");
        if (a.protect) log("Write protection is enabled.", "ok");
      }
      if (a.verify) {
        log(`Verifying the ${memory} memory …`);
        await pro.verify(a.verify, false, p("verify"));
        log(`${a.verify.length.toLocaleString("en")} bytes verified, the chip matches the file.`, "ok");
      }
      if (a.blank) {
        log("Blank check …");
        await pro.blankCheck(p("blank"));
        log(`The ${memory} memory is blank.`, "ok");
      }
      await prog.close();
    } catch (err) {
      try { await prog.endTransaction(); } catch (e) { /* ignore */ }
      await prog.close();
      err.result = result;
      throw err;
    }
    return result;
  }

  const api = {
    ProgrammerError, openProgrammer, runSession, loadDatabase, placement, ChipDB, Chip, TinyPro,
    TL866A, TL866IIPlus, T48, USB_FILTERS, TL866A_VID, TL866II_VID, ADAPTERS,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.TINYPRO = api;
})(typeof window !== "undefined" ? window : globalThis);
