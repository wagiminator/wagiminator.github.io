/* ===================================================================
 * STC 8051 ISP programmer (serial bootloader)
 * -------------------------------------------------------------------
 * JavaScript port of the STC10/11/12, STC15 and STC8 protocols of
 * stcgal by Grigori Goronzy (MIT License), https://github.com/grigorig/stcgal:
 * power-on handshake with 0x7F pulses, status packet with the model ID,
 * frequency trimming of the internal RC oscillator, baud rate switch,
 * erase, write in blocks, option bytes and frequency calibration.
 * Uses the Web Serial API (8E1). The option bytes are written back as
 * the chip reported them; only the trimmed frequency changes.
 * Global: STCISP
 * =================================================================== */
(function (global) {
  "use strict";

  const START = [0x46, 0xb9], MCU = 0x68, HOST = 0x6a, END = 0x16;
  class StcError extends Error {}
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const hexs = (b) => [...b].map((x) => x.toString(16).padStart(2, "0").toUpperCase()).join(" ");
  const be16 = (b, o) => (b[o] << 8) | b[o + 1];
  const be32 = (b, o) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
  const bcd = (x) => (x >> 4) * 10 + (x & 15);

  // Protocol family from the model name (protocol database of stcgal)
  const FAMILIES = [
    ["stc89", /^STC(89|90)(C|LE)\d/], ["stc12a", /^STC12(C|LE)\d052/], ["stc12b", /^STC12(C|LE)(52|56)/],
    ["stc12", /^(STC|IAP)(10|11|12)\D/], ["stc15a", /^(STC|IAP)15[FL][012]0\d(E|EA|)$/], ["stc15", /^(STC|IAP|IRC)15\D/],
    ["stc8g", /^STC8H1K\d\d$/], ["stc8g", /^STC8G/], ["stc8d", /^STC8H/], ["stc8d", /^STC32/], ["stc8d", /^STC8A8K\d\dD\d/], ["stc8", /^STC8\D/],
  ];
  const SUPPORTED = ["stc12", "stc12b", "stc15", "stc8", "stc8d", "stc8g"];

  // IAP wait states for a clock (STC12A and later)
  function iapDelay(hz) {
    if (hz < 1e6) return 0x87;
    if (hz < 2e6) return 0x86;
    if (hz < 3e6) return 0x85;
    if (hz < 6e6) return 0x84;
    if (hz < 12e6) return 0x83;
    if (hz < 20e6) return 0x82;
    if (hz < 24e6) return 0x81;
    return 0x80;
  }

  /* ---------- Serial link ---------- */

  class StcLink extends global.SerialLink {
    constructor(port, baud, signals) {
      super(port, baud, { parity: "even" });
      this.idle = signals || { dtr: false, rts: false };
    }

    async open() {
      await this.port.open(Object.assign({ baudRate: this.baud, bufferSize: 1 << 16 }, this.options));
      await this.setSignals(this.idle);
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
          // Framing and parity errors (e.g. from noise at power-up) leave the port usable
          if (err && /BreakError|FramingError|ParityError|BufferOverrunError/.test(err.name) && this.port.readable && !this.closing) {
            try { this.reader.releaseLock(); } catch (e) { /* ignore */ }
            try { this.reader = this.port.readable.getReader(); continue; } catch (e) { /* fall through */ }
          }
          this.error = err; this.closed = true; this.wake();
          return;
        }
      }
    }

    async close() { this.closing = true; await super.close(); }
  }

  /* ---------- Programmer ---------- */

  class Stc {
    constructor(port, opts, log) {
      this.port = port;
      this.handshakeBaud = opts.handshake || 2400;
      this.transferBaud = opts.baud || 115200;
      this.trimFrequency = opts.frequency || 0;      // Hz, 0 = keep
      this.reset = opts.reset || "none";            // none, dtr, rts, dtr_inverted, rts_inverted
      this.log = log || (() => {});
      this.uid = null;
    }

    idleSignals() {
      // The power is on while the reset line is in its idle state
      return { dtr: this.reset === "dtr_inverted", rts: this.reset === "rts_inverted" };
    }

    async openLink(baud) {
      this.link = new StcLink(this.port, baud, this.idleSignals());
      await this.link.open();
    }

    async setBaud(baud) {
      await this.link.close();
      await this.openLink(baud);
    }

    async close() { if (this.link) { await this.link.close(); this.link = null; } }

    async write(bytes) { await this.link.write(Uint8Array.from(bytes)); }

    // Packet: 46 B9 6A len16 payload csum16 16 [0x66 x epilogue]
    async writePacket(payload, epilogue) {
      const p = [...START, HOST, 0, 0, ...payload];
      const len = payload.length + 6;
      p[3] = len >> 8; p[4] = len & 255;
      let sum = 0;
      for (let i = 2; i < p.length; i++) sum += p[i];
      p.push((sum >> 8) & 255, sum & 255, END);
      for (let i = 0; i < (epilogue || 0); i++) p.push(0x66);
      await this.write(p);
    }

    async readBytes(n, timeout) {
      const b = await this.link.read(n, timeout);
      if (b.length !== n) {
        if (this.link.closed) throw new StcError("The serial port was closed.");
        throw new StcError("timeout");
      }
      return b;
    }

    // Read a packet from the MCU and return its payload (checksum checked)
    async readPacket(timeout) {
      timeout = timeout || 5000;
      let head = await this.readBytes(1, timeout);
      let pkt;
      if (head[0] === MCU) pkt = [...START, MCU];   // some BSLs leave out the start marks
      else {
        if (head[0] !== START[0]) throw new StcError("framing");
        const b = await this.readBytes(2, 500);
        if (b[0] !== START[1] || b[1] !== MCU) throw new StcError("framing");
        pkt = [head[0], ...b];
      }
      const l = await this.readBytes(2, 500);
      const len = be16(l, 0);
      if (len < 6 || len > 1024) throw new StcError("framing");
      const rest = await this.readBytes(len - 3, 1000);
      pkt.push(...l, ...rest);
      if (pkt[pkt.length - 1] !== END) throw new StcError("framing");
      let sum = 0;
      for (let i = 2; i < pkt.length - 3; i++) sum += pkt[i];
      if ((sum & 0xffff) !== be16(pkt, pkt.length - 3)) throw new StcError("framing");
      return Uint8Array.from(pkt.slice(5, -3));
    }

    // Send a byte until the MCU answers
    async pulse(ch, timeout) {
      const t0 = performance.now();
      for (;;) {
        if (timeout && performance.now() - t0 > timeout) throw new StcError("timeout");
        await this.write([ch]);
        await this.link.waitFor(1, performance.now() + 30);
        if (this.link.length) return;
      }
    }

    async powerCycle() {
      const on = this.idleSignals(), off = { dtr: !on.dtr, rts: !on.rts };
      const sig = this.reset.startsWith("dtr") ? { dtr: off.dtr } : { rts: off.rts };
      await this.link.setSignals(sig);
      await sleep(500);
      await this.link.setSignals(on);
      await sleep(30);
    }

    // Wait for the power-on handshake: pulses of 0x7F until a status packet comes
    async connect(onWait, abort) {
      await this.openLink(this.handshakeBaud);
      if (this.reset !== "none") await this.powerCycle();
      else if (onWait) onWait();
      this.link.flushInput();
      const t0 = performance.now();
      let status = null;
      while (!status) {
        if (abort && abort()) throw new StcError("Cancelled.");
        if (performance.now() - t0 > 60000) throw new StcError("No answer from the chip within a minute. Check the wiring (converter TXD to P3.0, RXD to P3.1) and switch the power off and on.");
        try {
          await this.pulse(0x7f, 500);
          status = await this.readPacket(800);
          if (status[0] === 0x80) {
            // Some BSLs want an acknowledge first
            await this.write([...START, HOST, 0x00, 0x07, 0x80, 0x00, 0xf1, END]);
            await this.pulse(0x7f, 1000);
            status = await this.readPacket(1000);
          }
          if (status.length < 23) status = null;
        } catch (e) {
          if (!(e instanceof StcError) || (e.message !== "timeout" && e.message !== "framing")) throw e;
          status = null;
          await sleep(5);
          this.link.flushInput();
        }
      }
      this.status = status;
      this.magic = be16(status, 20);
      let m = global.STC_MODELS.get(this.magic);
      if (!m) m = { name: "UNKNOWN", magic: this.magic, total: 63488, code: 63488, eeprom: 0, iap: false, calibrate: false, mcs251: false, unknown: true };
      if (this.magic === 0xf294 || this.magic === 0xf2d4) m = Object.assign({}, m, { name: m.name.slice(0, -1) + (status[17] < 0x70 ? "E" : "W") });
      this.model = m;
      const fam = FAMILIES.find(([, re]) => re.test(m.name));
      this.family = fam ? fam[0] : null;
      if (this.family === "stc8d" && m.mcs251) this.family = "stc32";
      if (SUPPORTED.includes(this.family)) this.initStatus();
      return m;
    }

    initStatus() {
      const s = this.status, f = this.family;
      this.info = {};
      if (f === "stc12" || f === "stc12b") {
        let c = 0;
        for (let i = 0; i < 8; i++) c += be16(s, 1 + 2 * i);
        c /= 8;
        this.clock = (this.handshakeBaud * c * 12) / 7;
        this.bsl = s[17];
        this.bslText = `${s[17] >> 4}.${s[17] & 15}${String.fromCharCode(s[18])}`;
        if (s.length < 29) throw new StcError("The status packet has no option bytes.");
        this.msr = Uint8Array.from([...s.subarray(23, 26), s[27]]);
      } else if (f === "stc15") {
        this.external = (s[7] & 1) === 0;
        if (this.external) this.clock = this.handshakeBaud * be16(s, 13);
        else { this.clock = be32(s, 8); if (this.clock === 0xffffffff) this.clock = 0; }
        this.freqCount24 = s[4];
        this.info.wakeup = be16(s, 1);
        this.bsl = s[17];
        this.bslText = `${s[17] >> 4}.${s[17] & 15}.${s[22] & 15}${String.fromCharCode(s[18])}`;
        this.msr = Uint8Array.from([...s.subarray(5, 8), s[12], s[37]]);
      } else {
        if (s.length < 40) throw new StcError("The status packet is too short.");
        this.clock = be32(s, 1);
        if (this.clock === 0xffffffff) this.clock = 0;
        this.external = false;
        this.info.wakeup = be16(s, 23);
        this.info.vref = be16(s, 35);
        this.info.date = `${2000 + bcd(s[37])}-${String(bcd(s[38])).padStart(2, "0")}-${String(bcd(s[39])).padStart(2, "0")}`;
        this.bsl = s[17];
        this.bslText = `${s[17] >> 4}.${s[17] & 15}.${s[22] & 15}${String.fromCharCode(s[18])}`;
        this.msr = Uint8Array.from([...s.subarray(9, 12), ...s.subarray(15, 17)]);
      }
    }

    /* ----- STC10/11/12 ----- */

    async handshake12() {
      const brt = 256 - Math.round(this.clock / (this.transferBaud * 16));
      if (brt <= 1 || brt > 255) throw new StcError(`${this.transferBaud} baud cannot be set at ${(this.clock / 1e6).toFixed(3)} MHz; choose another baud rate.`);
      const brtCsum = (2 * (256 - brt)) & 0xff;
      const actual = this.clock / (16 * (256 - brt)), err = Math.abs(this.transferBaud - actual) * 100 / this.transferBaud;
      if (err > 5) this.log(`The baud rate is off by ${err.toFixed(1)} %; choose a lower rate if writing fails.`);
      const iap = iapDelay(this.clock), delay = 0x80;
      await this.writePacket([0x50, 0x00, 0x00, 0x36, 0x01, this.magic >> 8, this.magic & 255]);
      let r = await this.readPacket();
      if (r[0] !== 0x8f) throw new StcError("Unexpected answer in the baud rate handshake.");
      await this.writePacket([0x8f, 0xc0, brt, 0x3f, brtCsum, delay, iap]);
      await sleep(100);
      await this.setBaud(this.transferBaud);
      r = await this.readPacket();
      await this.setBaud(this.handshakeBaud);
      if (r[0] !== 0x8f) throw new StcError("The chip did not accept the baud rate.");
      await this.writePacket([0x8e, 0xc0, brt, 0x3f, brtCsum, delay]);
      await sleep(100);
      await this.setBaud(this.transferBaud);
      r = await this.readPacket();
      if (r[0] !== 0x84) throw new StcError("Unexpected answer when switching the baud rate.");
    }

    async erase12(eraseSize, flashSize) {
      const blks = Math.ceil(eraseSize / 512) * 2, size = Math.ceil(flashSize / 512) * 2;
      const p = [0x84, 0xff, 0x00, blks & 255, 0x00, 0x00, size & 255, ...new Array(12).fill(0)];
      for (let i = 0x80; i > 0x0d; i--) p.push(i);
      await this.writePacket(p);
      const r = await this.readPacket(30000);
      if (r[0] !== 0x00) throw new StcError("Unexpected answer to the erase command.");
      if (r.length >= 8) this.uid = r.subarray(1, 8);
    }

    async program12(data, progress) {
      const B = 128;
      for (let i = 0; i < data.length; i += B) {
        const p = [0, 0, 0, i >> 8, i & 255, 0, B];
        for (let k = 0; k < B; k++) p.push(i + k < data.length ? data[i + k] : 0);
        await this.writePacket(p);
        const r = await this.readPacket();
        if (r[0] !== 0x00) throw new StcError(`Writing failed at 0x${i.toString(16)}.`);
        if (progress) progress(Math.min(1, (i + B) / data.length));
      }
      await this.writePacket([0x69, 0x00, 0x00, 0x36, 0x01, this.magic >> 8, this.magic & 255]);
      const r = await this.readPacket();
      if (r[0] !== 0x8d) throw new StcError("Unexpected answer when finishing the write.");
    }

    async options12() {
      const m = this.msr, hz = Math.round(this.clock) >>> 0;
      const clk = [hz >>> 24, (hz >> 16) & 255, (hz >> 8) & 255, hz & 255];
      let p, want;
      if (this.family === "stc12") {
        p = [0x8d, m[0], m[1], m[2], m[3], 0xff, 0xff, 0xff, 0xff, m[3], 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, ...clk];
        want = 0x50;
      } else {
        p = [0x8d, m[0], m[1], m[2], 0xff, m[3], ...clk, m[3], 0xff, m[0], m[1], 0xff, 0xff, 0xff, 0xff, m[2], 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, ...clk, 0xff, 0xff, 0xff];
        want = 0x80;
      }
      await this.writePacket(p);
      let r = await this.readPacket();
      if (r[0] !== want) throw new StcError("Unexpected answer to the option bytes.");
      if (this.family === "stc12" && !this.uid && r.length >= 25) this.uid = r.subarray(18, 25);
      if (this.family === "stc12b" && this.bsl >= 0x66) {
        await this.writePacket([0x50]);
        r = await this.readPacket();
        if (r[0] !== 0x10) throw new StcError("Unexpected answer to the option bytes.");
      }
    }

    /* ----- STC15 and STC8: frequency trimming ----- */

    // Trim value pair for a target count from a first round of challenges
    chooseRange15(packet, response, target) {
      const calib = response.subarray(2), ch = packet.slice(2), n = response[1];
      if (calib.length < 2 * n) throw new StcError("Calibration data missing.");
      for (let i = 0; i < n - 1; i++) {
        const ca = be16(calib, 2 * i), cb = be16(calib, 2 * i + 2);
        const ta = ch[2 * i], tb = ch[2 * i + 2], range = ch[2 * i + 3];
        if ((ca <= target && cb >= target) || (cb <= target && ca >= target)) {
          const m = (tb - ta) / (cb - ca), nn = ta - m * ca, t = Math.round(m * target + nn);
          if (t > 65536 || t < 0) throw new StcError("Frequency trimming failed.");
          return [t, range];
        }
      }
      return null;
    }

    chooseRange8d(packet, response, target) {
      const calib = response.subarray(2), ch = packet.slice(2), n = response[1];
      if (calib.length < 2 * n) throw new StcError("Calibration data missing.");
      for (let i = 0; i < n >> 1; i++) {
        const ca = be16(calib, 4 * i), cb = be16(calib, 4 * i + 2);
        const ta = ch[4 * i], tb = ch[4 * i + 2], range = ch[4 * i + 3];
        if (ca <= target && cb >= target) {
          const t = Math.round((target - ca) * (tb - ta) / (cb - ca) + ta);
          if (t < 6 || t > 255 - 5) throw new StcError("Frequency trimming failed.");
          return [t, range];
        }
      }
      return null;
    }

    chooseTrim(packet, response, target) {
      const calib = response.subarray(2), ch = packet.slice(2), n = response[1];
      if (calib.length < 2 * n) throw new StcError("Calibration data missing.");
      let best = null, bestDiff = Infinity;
      for (let i = 0; i < n; i++) {
        const c = be16(calib, 2 * i);
        if (Math.abs(c - target) < bestDiff) { bestDiff = Math.abs(c - target); best = { trim: [ch[2 * i], ch[2 * i + 1]], count: c }; }
      }
      if (!best) throw new StcError("Frequency trimming failed.");
      return best;
    }

    async challenge(payload, epilogue) {
      await this.writePacket(payload, epilogue);
      await this.pulse(0xfe, 1000);
      const r = await this.readPacket();
      if (r.length < 2 || r[0] !== 0x00) throw new StcError("Unexpected answer in the frequency trimming.");
      return r;
    }

    async switchBaud(packet) {
      await this.writePacket(packet);
      const r = await this.readPacket();
      if (r.length < 1 || r[0] !== 0x01) throw new StcError("Unexpected answer when switching the baud rate.");
      await sleep(100);
      await this.setBaud(this.transferBaud);
    }

    targetSpeed() {
      if (!this.clock && !this.trimFrequency) throw new StcError("The chip has never been calibrated: enter the frequency it should run at.");
      return this.trimFrequency || this.clock;
    }

    async calibrate15() {
      const user = this.targetSpeed(), prog = 22118400, hb = this.handshakeBaud;
      const tUser = Math.round(user / (hb / 2)), tProg = Math.round(prog / (hb / 2));
      let p = [0x00, 12, 0x00, 0xc0, 0x80, 0xc0, 0xff, 0xc0, 0x00, 0x80, 0x80, 0x80, 0xff, 0x80, 0x00, 0x40, 0x80, 0x40, 0xff, 0x40, 0x00, 0x00, 0x80, 0x00, 0xc0, 0x00];
      let r = await this.challenge(p);
      let userTrim = this.chooseRange15(p, r, tUser), progTrim = this.chooseRange15(p, r, tProg);
      if (!userTrim || !progTrim) throw new StcError("Frequency trimming failed: the frequency is out of range.");
      p = [0x00, 12];
      for (let i = userTrim[0] - 3; i < userTrim[0] + 3; i++) p.push(i & 255, userTrim[1]);
      for (let i = progTrim[0] - 3; i < progTrim[0] + 3; i++) p.push(i & 255, progTrim[1]);
      r = await this.challenge(p);
      const u = this.chooseTrim(p, r, tUser), g = this.chooseTrim(p, r, tProg);
      this.trimValue = u.trim;
      this.trimmed = Math.round(u.count * (hb / 2));
      const sw = [0x01, ...g.trim];
      if ((this.magic >> 8) === 0xf2) {
        // Models without a hardware UART
        const a = Math.floor(65536 - prog / this.transferBaud), b = Math.floor(65536 - prog / 2 * 3 / this.transferBaud);
        sw.push(a >> 8 & 255, a & 255, b >> 8 & 255, b & 255);
      } else {
        const a = Math.floor(65536 - prog / (this.transferBaud * 4));
        sw.push(a >> 8 & 255, a & 255, u.trim[1], u.trim[0]);
      }
      sw.push(iapDelay(prog));
      await this.switchBaud(sw);
    }

    async switchBaudExt15() {
      const bauds = Math.floor(65536 - this.clock / this.transferBaud / 4);
      if (bauds >= 65536 || bauds < 0) throw new StcError("The baud rate cannot be set with this crystal.");
      await this.switchBaud([0x01, this.freqCount24, 0x40, bauds >> 8, bauds & 255, 0x00, 0x00, iapDelay(this.clock)]);
      this.trimValue = [this.freqCount24, 0x40];
      this.trimmed = 24000000;
    }

    async calibrate8() {
      const user = this.targetSpeed(), hb = this.handshakeBaud;
      const target = Math.round(user / (hb / 2));
      let p = [0x00, 12, 0x00, 0x00, 23, 0x00, 46, 0x00, 69, 0x00, 92, 0x00, 115, 0x00, 138, 0x00, 161, 0x00, 184, 0x00, 207, 0x00, 230, 0x00, 255, 0x00];
      let r = await this.challenge(p);
      let userTrim = null;
      for (let d = 1; d <= 5 && !userTrim; d++) { userTrim = this.chooseRange15(p, r, target * d); if (userTrim) this.trimDivider = d; }
      if (!userTrim) throw new StcError("Frequency trimming failed: the frequency is out of range.");
      p = [0x00, 12];
      for (let k = 0; k < 4; k++) for (let i = userTrim[0] - 1; i < userTrim[0] + 2; i++) p.push(i & 255, k);
      r = await this.challenge(p);
      const u = this.chooseTrim(p, r, target);
      this.trimValue = u.trim;
      this.trimmed = Math.round(u.count * (hb / 2) / this.trimDivider);
      const a = Math.round(65536 - 24e6 / (this.transferBaud * 4));
      await this.switchBaud([0x01, 0x00, 0x00, a >> 8 & 255, a & 255, u.trim[1], u.trim[0], iapDelay(24e6)]);
    }

    async calibrate8d(g) {
      const user = this.targetSpeed(), hb = this.handshakeBaud;
      const target = Math.round(user / hb);
      let p = g ? [0x00, 0x05, 0x00, 0x00, 0x80, 0x00, 0x00, 0x80, 0x80, 0x80, 0xff, 0x00]
        : [0x00, 0x08, 0x00, 0x00, 0xff, 0x00, 0x00, 0x10, 0xff, 0x10, 0x00, 0x20, 0xff, 0x20, 0x00, 0x30, 0xff, 0x30];
      let r = await this.challenge(p, g ? 12 : 0);
      let userTrim = null;
      for (let d = 1; d <= 5 && !userTrim; d++) { userTrim = this.chooseRange8d(p, r, target * d); if (userTrim) this.trimDivider = d; }
      if (!userTrim) throw new StcError("Frequency trimming failed: the frequency is out of range.");
      p = [0x00, 0x0c];
      for (let i = -6; i < 6; i++) p.push((userTrim[0] + i) & 255, userTrim[1]);
      r = await this.challenge(p, g ? 19 : 0);
      const u = this.chooseTrim(p, r, target * this.trimDivider);
      this.trimValue = u.trim;
      this.trimmed = Math.round(u.count * hb / this.trimDivider);
      const a = Math.round(65536 - 24e6 / (this.transferBaud * 4));
      await this.switchBaud([0x01, 0x00, 0x00, a >> 8 & 255, a & 255, u.trim[1], u.trim[0], 0x98]);
    }

    async handshake15() {
      const f = this.family;
      if (f === "stc15") {
        if (this.external) await this.switchBaudExt15(); else await this.calibrate15();
      } else if (f === "stc8") await this.calibrate8();
      else await this.calibrate8d(f === "stc8g" && this.trimFrequency >= 27360000);   // as stcgal: STC8G method only above 27.36 MHz
      const p = [0x05];
      if (this.bsl >= 0x72) p.push(0x00, 0x00, 0x5a, 0xa5);
      await this.writePacket(p);
      const r = await this.readPacket();
      if (r.length === 1 && r[0] === 0x0f) throw new StcError("The chip is locked.");
      if (r.length < 1 || r[0] !== 0x05) throw new StcError("Unexpected answer after the baud rate switch.");
    }

    async erase15(eraseSize, flashSize) {
      const p = [0x03, eraseSize <= flashSize ? 0x00 : 0x01];
      if (this.bsl >= 0x72) p.push(0x00, 0x5a, 0xa5);
      await this.writePacket(p);
      const r = await this.readPacket(30000);
      if (r.length < 1 || r[0] !== 0x03) throw new StcError("Unexpected answer to the erase command.");
      if (r.length >= 8) this.uid = r.subarray(1, 8);
    }

    async program15(data, progress) {
      const B = 64;
      for (let i = 0; i < data.length; i += B) {
        const p = [i === 0 ? 0x22 : 0x02, i >> 8 & 255, i & 255];
        if (this.bsl >= 0x72) p.push(0x5a, 0xa5);
        for (let k = 0; k < B; k++) p.push(i + k < data.length ? data[i + k] : 0);
        await this.writePacket(p);
        const r = await this.readPacket();
        if (r.length < 2 || r[0] !== 0x02 || r[1] !== 0x54) throw new StcError(`Writing failed at 0x${i.toString(16)}.`);
        if (progress) progress(Math.min(1, (i + B) / data.length));
      }
      if (this.bsl >= 0x72) {
        await this.writePacket([0x07, 0x00, 0x00, 0x5a, 0xa5]);
        const r = await this.readPacket();
        if (r.length < 2 || r[0] !== 0x07 || r[1] !== 0x54) throw new StcError("Unexpected answer when finishing the write.");
      }
    }

    buildOptions() {
      const m = this.msr, f = this.trimmed >>> 0;
      if (this.family === "stc15") {
        const p = new Array(23).fill(0xff);
        p.push(f >>> 24, 0xff, (f >> 16) & 255, 0xff, (f >> 8) & 255, 0xff, f & 255, 0xff);
        p.push(m[3], ...new Array(23).fill(0xff), m.length > 4 ? m[4] : 0xff, 0xff, 0xff, 0xff);
        p.push(this.trimValue[0], (this.trimValue[1] + 0x3f) & 255, m[0], m[1], m[2]);
        return p;
      }
      const p = new Array(40).fill(0xff);
      p[3] = 0; p[6] = 0; p[22] = 0;
      p[24] = f >>> 24; p[25] = (f >> 16) & 255; p[26] = (f >> 8) & 255; p[27] = f & 255;
      p[28] = this.trimValue[0]; p[29] = this.trimValue[1];
      p[30] = this.trimDivider;
      p[32] = m[0];
      p[36] = m[1]; p[37] = m[2]; p[38] = m[3]; p[39] = m[4];
      return p;
    }

    async options15() {
      const p = [0x04, 0x00, 0x00];
      if (this.bsl >= 0x72) p.push(0x5a, 0xa5);
      p.push(...this.buildOptions());
      await this.writePacket(p);
      const r = await this.readPacket();
      if (r.length < 2 || r[0] !== 0x04 || r[1] !== 0x54) throw new StcError("Unexpected answer to the option bytes.");
    }

    /* ----- Common flow ----- */

    is12() { return this.family === "stc12" || this.family === "stc12b"; }

    async handshake() { if (this.is12()) await this.handshake12(); else await this.handshake15(); }
    async erase(eraseSize, flashSize) { if (this.is12()) await this.erase12(eraseSize, flashSize); else await this.erase15(eraseSize, flashSize); }
    async program(data, progress) { if (this.is12()) await this.program12(data, progress); else await this.program15(data, progress); }
    async writeOptions() { if (this.is12()) await this.options12(); else await this.options15(); }

    // Leave the bootloader (the chip resets and starts the program)
    async disconnect() {
      try { await this.writePacket([this.family && this.family.startsWith("stc8") ? 0xff : 0x82]); await sleep(50); } catch (e) { /* ignore */ }
    }
  }

  const FAMILY_TEXT = { stc89: "STC89/STC90", stc12a: "STC12C2052", stc12b: "STC12C52/56", stc12: "STC10/11/12", stc15a: "STC15F/L10x and 20x", stc15: "STC15", stc8: "STC8A/8F", stc8d: "STC8A8K-D/STC8H", stc8g: "STC8G/STC8H1K", stc32: "STC32" };

  global.STCISP = { Stc, StcError, FAMILIES, FAMILY_TEXT, SUPPORTED, hexs };
})(typeof window !== "undefined" ? window : globalThis);
