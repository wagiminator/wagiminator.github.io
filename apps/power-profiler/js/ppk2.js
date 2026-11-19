/* Power Profiler: the Power Profiler Kit II over Web Serial, and a simulator that sends the same bytes.
 *
 * Protocol (USB CDC, as used by Nordic's desktop app and the open source libraries):
 *   0x19            metadata as text (calibration per range, ends with "END")
 *   0x11 m          mode: 1 = ampere meter, 2 = source meter
 *   0x0D hi lo      source voltage in mV (800 … 5000)
 *   0x0C b          power of the device under test: 1 on, 0 off
 *   0x06 / 0x07     start / stop sampling (100 000 samples per second)
 * A sample is a 32-bit little endian word: bits 0–13 ADC, 14–16 measuring range (0–4),
 * 18–23 counter (to find lost samples), 24–31 the logic inputs D0–D7. */
(function (global) {
  "use strict";

  var CMD = { meta: 0x19, mode: 0x11, regulator: 0x0D, dut: 0x0C, start: 0x06, stop: 0x07 };
  var RATE = 100000;
  var ADC_MULT = 1.8 / 163840;
  var USB = { usbVendorId: 0x1915, usbProductId: 0xC00A };
  var DEFAULTS = {
    r: [1031.64, 101.65, 10.15, 0.94, 0.043], gs: [1, 1, 1, 1, 1], gi: [1, 1, 1, 1, 1],
    o: [0, 0, 0, 0, 0], s: [0, 0, 0, 0, 0], i: [0, 0, 0, 0, 0], ug: [1, 1, 1, 1, 1]
  };
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  // "R0: 1003.2\nGS0: 0.000\n…\nEND" → { r0: 1003.2, … }
  function parseMeta(text) {
    var out = {};
    text.split(/\r?\n/).forEach(function (line) {
      var m = /^\s*([A-Za-z]+\d?)\s*:\s*(\S+)\s*$/.exec(line);
      if (!m) return;
      var v = parseFloat(m[2]);
      out[m[1].toLowerCase()] = isFinite(v) ? v : m[2];
    });
    return out;
  }
  function modifiersOf(meta) {
    var mod = {};
    Object.keys(DEFAULTS).forEach(function (k) {
      mod[k] = DEFAULTS[k].map(function (d, i) {
        var v = meta[k + i];
        return typeof v === "number" && isFinite(v) && !(k === "r" && v === 0) ? v : d;
      });
    });
    return mod;
  }

  // ================================================================ samples → current
  function Parser(mod) {
    this.mod = mod;
    this.vdd = 3.3;
    this.rest = new Uint8Array(0);
    this.reset();
  }
  Parser.prototype.reset = function () {
    this.expect = null; this.lost = 0;
    this.avg = null; this.avg4 = null; this.prevRange = null; this.after = 0; this.inRange = 0;
  };
  Parser.prototype.current = function (range, adc) {
    var m = this.mod, x = (adc - m.o[range]) * ADC_MULT / m.r[range];
    var v = m.ug[range] * (x * (m.gs[range] * x + m.gi[range]) + m.s[range] * this.vdd + m.i[range]);
    // range switches give short spikes: smooth the first samples after a switch with a rolling average
    var a1 = this.avg, a4 = this.avg4;
    this.avg = a1 === null ? v : 0.18 * v + 0.82 * a1;
    this.avg4 = a4 === null ? v : 0.06 * v + 0.94 * a4;
    if (this.prevRange === null) this.prevRange = range;
    if (range !== this.prevRange) { this.after = 3; this.inRange = 0; }
    else if (this.after > 0) this.inRange++;
    if (this.after > 0) {
      if (range === 4) {
        if (this.inRange < 2) { this.avg = a1 === null ? v : a1; this.avg4 = a4 === null ? v : a4; }
        v = this.avg4;
      } else v = this.avg;
      this.after--;
    }
    this.prevRange = range;
    return v;
  };
  // bytes → { cur: Float32Array (A, NaN for lost samples), bits: Uint8Array, lost }
  Parser.prototype.feed = function (u8) {
    var buf = u8;
    if (this.rest.length) { buf = new Uint8Array(this.rest.length + u8.length); buf.set(this.rest); buf.set(u8, this.rest.length); }
    var n = buf.length >> 2, cur = [], bits = [], lost = 0;
    for (var k = 0; k < n; k++) {
      var o = k << 2, w = (buf[o] | (buf[o + 1] << 8) | (buf[o + 2] << 16) | (buf[o + 3] << 24)) >>> 0;
      var adc = (w & 0x3FFF) * 4, range = (w >>> 14) & 7, cnt = (w >>> 18) & 63, b = w >>> 24;
      if (range > 4) range = 4;
      if (this.expect !== null && cnt !== this.expect) {
        var miss = (cnt - this.expect + 64) & 63;
        for (var j = 0; j < miss; j++) { cur.push(NaN); bits.push(0); }
        lost += miss;
      }
      this.expect = (cnt + 1) & 63;
      cur.push(this.current(range, adc)); bits.push(b);
    }
    this.rest = buf.slice(n << 2);
    this.lost += lost;
    return { cur: Float32Array.from(cur), bits: Uint8Array.from(bits), lost: lost };
  };

  // ================================================================ the device
  /* port: a SerialPort (or a SimPort); h: { onData(cur, bits, lost), onClose(reason) } */
  function PPK2(port, h) {
    this.port = port; this.h = h || {};
    this.meta = null; this.mod = null; this.parser = null;
    this.mode = "source"; this.mv = 3300; this.dut = false; this.running = false;
    this.closed = false;
    this.text = null;
  }
  var P = PPK2.prototype;
  PPK2.supported = function () { return !!(navigator.serial && navigator.serial.requestPort); };
  PPK2.request = function () { return navigator.serial.requestPort({ filters: [USB] }); };
  PPK2.known = function () {
    return navigator.serial && navigator.serial.getPorts ? navigator.serial.getPorts().then(function (ps) {
      return ps.filter(function (p) { var i = p.getInfo ? p.getInfo() : {}; return i.usbVendorId === USB.usbVendorId && i.usbProductId === USB.usbProductId; });
    }) : Promise.resolve([]);
  };
  P.open = async function () {
    await this.port.open({ baudRate: 115200, bufferSize: 1 << 20 });
    this.writer = this.port.writable.getWriter();
    this.reader = this.port.readable.getReader();
    this.loop();
    await this.send([CMD.stop]);
    await wait(120);
    this.text = "";
    await this.send([CMD.meta]);
    var t0 = Date.now();
    while (this.text.indexOf("END") < 0) {
      if (Date.now() - t0 > 3000) { this.text = null; throw new Error("The PPK2 does not send its calibration data. Is it a PPK2 with current firmware?"); }
      await wait(20);
    }
    this.meta = parseMeta(this.text.slice(0, this.text.indexOf("END")));
    this.text = null;
    this.mod = modifiersOf(this.meta);
    this.parser = new Parser(this.mod);
    if (this.meta.mode === 1) this.mode = "ampere"; else if (this.meta.mode === 2) this.mode = "source";
    if (typeof this.meta.vdd === "number" && this.meta.vdd >= 800 && this.meta.vdd <= 5000) this.mv = this.meta.vdd;
    return this.meta;
  };
  P.loop = async function () {
    var reason = null;
    try {
      for (;;) {
        var r = await this.reader.read();
        if (r.done) break;
        var v = r.value;
        if (this.text !== null) { for (var i = 0; i < v.length; i++) this.text += String.fromCharCode(v[i]); continue; }
        if (!this.running || !this.parser) continue;
        var d = this.parser.feed(v);
        if (d.cur.length && this.h.onData) this.h.onData(d.cur, d.bits, d.lost);
      }
    } catch (e) { reason = e; }
    if (!this.closed) { this.closed = true; if (this.h.onClose) this.h.onClose(reason); }
  };
  P.send = function (bytes) { return this.writer.write(Uint8Array.from(bytes)); };
  P.setMode = async function (mode) {
    this.mode = mode;
    await this.send([CMD.mode, mode === "source" ? 2 : 1]);
    if (this.parser) this.parser.vdd = this.mv / 1000;
  };
  // source voltage (source meter), or the supply voltage of the device under test (ampere meter: only for the calibration)
  P.setVoltage = async function (mv) {
    mv = Math.round(Math.max(800, Math.min(5000, mv)));
    this.mv = mv;
    if (this.parser) this.parser.vdd = mv / 1000;
    await this.send([CMD.regulator, mv >> 8, mv & 255]);          // also in ampere meter mode, as the reference
  };
  P.setDut = async function (on) { this.dut = !!on; await this.send([CMD.dut, on ? 1 : 0]); };
  P.start = async function () {
    this.parser.reset(); this.parser.vdd = this.mv / 1000;
    this.running = true;
    await this.send([CMD.start]);
  };
  P.stop = async function () { this.running = false; if (!this.closed) await this.send([CMD.stop]); };
  P.close = async function () {
    if (this.closed) return;
    try { if (this.running) await this.stop(); } catch (e) { /* gone */ }
    this.closed = true;
    try { await this.reader.cancel(); } catch (e) { /* ignore */ }
    try { this.reader.releaseLock(); this.writer.releaseLock(); } catch (e) { /* ignore */ }
    try { await this.port.close(); } catch (e) { /* ignore */ }
  };
  P.info = function () {
    var m = this.meta || {};
    return { hw: m.hw, calibrated: m.calibrated === 1, ia: m.ia, sim: !!this.port.sim };
  };

  // ================================================================ simulator
  /* A small battery powered sensor node: sleeps at a few µA with a 32 kHz timer, wakes up twice a
   * second (MCU, D0 high), sends a radio packet every second wake-up (D1 high), blinks an LED every
   * 4 s (D2) and answers a button now and then (D3). Sends the same bytes as a PPK2. */
  function SimPort() {
    this.sim = true;
    this.mode = 2; this.mv = 3300; this.dut = false; this.on = false; this.t = 0; this.cnt = 0;
    this.lossAt = 0;
    var self = this;
    this.readable = new ReadableStream({
      start: function (c) { self.ctl = c; },
      cancel: function () { self.halt(); }
    });
    this.writable = new WritableStream({ write: function (chunk) { self.cmd(chunk); } });
    this.meta = { calibrated: 1, r0: 1003.17, r1: 101.83, r2: 10.09, r3: 0.954, r4: 0.0436,
      gs0: 0, gs1: 0, gs2: 0, gs3: 0, gs4: 0, gi0: 1.0, gi1: 0.998, gi2: 1.001, gi3: 1.0, gi4: 0.997,
      o0: 52, o1: 48, o2: 51, o3: 47, o4: 50, s0: 0, s1: 0, s2: 0, s3: 0, s4: 0, i0: 0, i1: 0, i2: 0, i3: 0, i4: 0,
      ug0: 1, ug1: 1, ug2: 1, ug3: 1, ug4: 1, hw: 9173, mode: 2, ia: 56 };
  }
  SimPort.prototype.getInfo = function () { return { usbVendorId: USB.usbVendorId, usbProductId: USB.usbProductId }; };
  SimPort.prototype.open = function () { return Promise.resolve(); };
  SimPort.prototype.close = function () { this.halt(); return Promise.resolve(); };
  SimPort.prototype.halt = function () { clearInterval(this.timer); this.timer = null; this.on = false; };
  SimPort.prototype.emit = function (u8) { try { this.ctl.enqueue(u8); } catch (e) { /* closed */ } };
  SimPort.prototype.cmd = function (b) {
    var self = this;
    switch (b[0]) {
      case CMD.meta:
        var m = this.meta, txt = "Calibrated: " + m.calibrated + "\n";
        ["r", "gs", "gi", "o", "s", "i", "ug"].forEach(function (k) { for (var i = 0; i < 5; i++) txt += k.toUpperCase() + i + ": " + m[k + i] + "\n"; });
        txt += "HW: " + m.hw + "\nmode: " + this.mode + "\nIA: " + m.ia + "\nEND\n";
        setTimeout(function () { self.emit(new TextEncoder().encode(txt)); }, 30);
        break;
      case CMD.mode: this.mode = b[1]; break;
      case CMD.regulator: this.mv = (b[1] << 8) | b[2]; break;
      case CMD.dut: this.dut = !!b[1]; break;
      case CMD.start:
        if (!this.timer) {
          this.on = true; this.last = performance.now();
          this.timer = setInterval(function () { self.tick(); }, 20);
        }
        break;
      case CMD.stop: this.halt(); break;
    }
  };
  // the current of the simulated device at time t (s) and its logic levels
  SimPort.prototype.model = function (t) {
    var v = this.mv / 1000, bits = 0, i;
    if (!this.dut) return [0, 0];
    i = 2.4e-6 + 0.35e-6 * v;                                  // sleep with RTC
    var tick = t % (1 / 32);
    if (tick < 60e-6) i += 18e-6;                              // timer tick
    var w = t % 0.5, n = Math.floor(t / 0.5);
    if (w < 0.0024) { i += 2.1e-3 + 0.25e-3 * v; bits |= 1; }   // MCU awake
    if (n % 2 === 0 && w >= 0.0006 && w < 0.0021) {            // radio packet
      var p = (w - 0.0006) % 0.0005;
      if (p < 0.00034) { i += 7.4e-3; bits |= 2; }
      else i += 1.2e-3;
    }
    var l = t % 4;
    if (l > 2 && l < 2.08) { i += Math.max(0, v - 1.9) / 330; bits |= 4; }       // LED with 330 Ω
    if (t % 7 > 5.2 && t % 7 < 5.6) bits |= 8;                  // button
    return [i, bits];
  };
  SimPort.prototype.tick = function () {
    if (!this.on) return;
    var now = performance.now(), n = Math.min(10000, Math.round((now - this.last) / 1000 * RATE));
    if (n <= 0) return;
    this.last += n / RATE * 1000;
    var out = new Uint8Array(n * 4), m = this.meta, dv = new DataView(out.buffer);
    for (var k = 0; k < n; k++) {
      var t = this.t / RATE, mb = this.model(t), cur = mb[0] * (1 + 0.01 * (Math.random() - 0.5)) + (Math.random() - 0.5) * 4e-8;
      if (cur < 0) cur = 0;
      var range = 4;
      for (var r = 0; r < 4; r++) if (cur < 0.85 * 65532 * ADC_MULT / m["r" + r]) { range = r; break; }
      var x = cur / m["gi" + range], adc = x * m["r" + range] / ADC_MULT + m["o" + range];
      var raw = Math.max(0, Math.min(16383, Math.round(adc / 4)));
      var w = (raw | (range << 14) | ((this.cnt & 63) << 18) | (mb[1] << 24)) >>> 0;
      dv.setUint32(k * 4, w, true);
      this.cnt++; this.t++;
    }
    this.emit(out);
  };

  global.PP = global.PP || {};
  global.PP.PPK2 = PPK2;
  global.PP.SimPort = SimPort;
  global.PP.Parser = Parser;
  global.PP.parseMeta = parseMeta;
  global.PP.modifiersOf = modifiersOf;
  global.PP.RATE = RATE;
})(window);
