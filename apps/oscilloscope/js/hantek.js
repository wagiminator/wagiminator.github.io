/* Oscilloscope: the Hantek 6022BE/BL family over WebUSB, and a simulator with the same interface.
 *
 * The scopes have a Cypress FX2 without firmware of their own: at every start the open source
 * firmware (Hantek6022API by Ho-Ro, also used by OpenHantek6022) is written into its RAM with the
 * FX2's load request 0xA0; the chip then comes back as "OpenHantek" device. Vendor requests:
 *   0xE0 / 0xE1  gain of CH1 / CH2 (1, 2, 5, 10; DDS120 also 20)
 *   0xE2         sample rate (code, see RATES)          0xE3  start (1) / stop (0)
 *   0xE4         number of channels (1 or 2)            0xE5  coupling (bit 0 CH1, bit 4 CH2: 1 = DC)
 *   0xE6         frequency of the calibration output    0xA2  EEPROM (calibration values at 8)
 * Every request stops the sampling. The samples come on bulk endpoint 6: one byte per sample,
 * CH1/CH2 interleaved with two channels, 0x80 is about 0 V. */
(function (global) {
  "use strict";

  var PROFILES = [
    { id: "6022be", name: "Hantek 6022BE", cold: [[0x04B4, 0x6022], [0x04B5, 0x6022]], hot: [0x04B5, 0x6022], fw: "dso6022be-firmware.hex", eeprom: true },
    { id: "2020", name: "Voltcraft DSO-2020", cold: [[0x04B4, 0x2020]], hot: [0x04B5, 0x6022], fw: "dso6022be-firmware.hex", eeprom: true },
    { id: "6022bl", name: "Hantek 6022BL", cold: [[0x04B4, 0x602A], [0x04B5, 0x602A]], hot: [0x04B5, 0x602A], fw: "dso6022bl-firmware.hex", eeprom: true },
    { id: "6021", name: "Hantek DSO-6021", cold: [[0x04B4, 0x6021]], hot: [0x04B5, 0x6021], fw: "dso6021-firmware.hex", eeprom: true },
    { id: "dds120", name: "SainSmart DDS120", cold: [[0x8102, 0x8102]], hot: [0x04B5, 0x0120], fw: "dds120-firmware.hex", eeprom: false, dds: true }
  ];
  var FW_VERSION = [2, 1, 0];          // bcdDevice 0x0210 of the firmware in fw/

  // input ranges (V/div with a 1:1 probe), hardware gain and ADC counts per volt (OpenHantek6022's measured values)
  var VDIV = [0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5];
  var GAIN = { std: [10, 10, 10, 5, 2, 1, 1, 1], dds: [20, 20, 10, 5, 2, 1, 1, 1] };
  var SCALE = { std: [250, 250, 250, 126.25, 49.5, 24.75, 24.75, 24.75], dds: [400, 400, 200, 96, 43, 21, 21, 21] };
  // sample rates and their codes
  var RATES = [[48e6, 48], [30e6, 30], [24e6, 24], [16e6, 16], [15e6, 15], [12e6, 12], [10e6, 10], [8e6, 8], [6e6, 6], [5e6, 5], [4e6, 4], [3e6, 3], [2e6, 2], [1e6, 1],
    [640e3, 164], [500e3, 150], [400e3, 140], [200e3, 120], [128e3, 113], [100e3, 110], [64e3, 106], [50e3, 105], [40e3, 104], [32e3, 103], [20e3, 102]];
  var MAX_RATE = { 1: 30e6, 2: 15e6 };      // faster rates lose data over USB

  // calibration output: 32 Hz … 100 kHz, coded in one byte
  function calCode(f) {
    if (f < 1000) return Math.max(103, Math.min(200, 100 + Math.round(f / 10)));
    if (f <= 5500 && f % 1000) return 200 + Math.round(f / 100);
    return Math.max(1, Math.min(100, Math.round(f / 1000)));
  }
  var CAL_FREQS = [50, 60, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];

  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  function profileOf(dev) {
    for (var i = 0; i < PROFILES.length; i++) {
      var p = PROFILES[i];
      if (dev.vendorId === p.hot[0] && dev.productId === p.hot[1] && dev.manufacturerName === "OpenHantek") return p;
      for (var k = 0; k < p.cold.length; k++) if (dev.vendorId === p.cold[k][0] && dev.productId === p.cold[k][1]) return p;
    }
    return null;
  }
  function filters() {
    var f = [], seen = {};
    PROFILES.forEach(function (p) { p.cold.concat([p.hot]).forEach(function (v) { var k = v[0] + ":" + v[1]; if (!seen[k]) { seen[k] = 1; f.push({ vendorId: v[0], productId: v[1] }); } }); });
    return f;
  }
  // Intel HEX → [{ addr, data }]
  function parseHex(text) {
    var out = [];
    text.split(/\r?\n/).forEach(function (l) {
      l = l.trim();
      if (l[0] !== ":") return;
      var n = parseInt(l.substr(1, 2), 16), a = parseInt(l.substr(3, 4), 16), t = parseInt(l.substr(7, 2), 16);
      if (t !== 0) return;
      var d = new Uint8Array(n);
      for (var i = 0; i < n; i++) d[i] = parseInt(l.substr(9 + 2 * i, 2), 16);
      var last = out[out.length - 1];
      if (last && last.addr + last.data.length === a && last.data.length + n <= 1024) { var m = new Uint8Array(last.data.length + n); m.set(last.data); m.set(d, last.data.length); last.data = m; }
      else out.push({ addr: a, data: d });
    });
    return out;
  }

  // ================================================================ the real scope
  function Hantek() { this.dev = null; this.prof = null; this.cal = null; this.busy = Promise.resolve(); }
  Hantek.supported = function () { return "usb" in navigator; };
  var H = Hantek.prototype;
  H.connect = async function (status) {
    var dev = await navigator.usb.requestDevice({ filters: filters() });
    return this.prepare(dev, status);
  };
  H.loaded = function (dev) {
    return dev.manufacturerName === "OpenHantek" && dev.deviceVersionMajor === FW_VERSION[0] && dev.deviceVersionMinor === FW_VERSION[1];
  };
  H.prepare = async function (dev, status) {
    var prof = profileOf(dev);
    if (!prof) throw new Error("This USB device is not a supported oscilloscope.");
    await dev.open();
    if (!dev.configuration) await dev.selectConfiguration(1);
    if (!this.loaded(dev)) {
      status("Loading the firmware into the " + prof.name + " …");
      var segs = parseHex(await (await fetch("fw/" + prof.fw)).text());
      try { await dev.claimInterface(0); } catch (e) { /* not needed on every system */ }
      var ctl = function (value, data) { return dev.controlTransferOut({ requestType: "vendor", recipient: "device", request: 0xA0, value: value, index: 0 }, data); };
      await ctl(0xE600, new Uint8Array([1]));                     // hold the 8051 in reset
      for (var i = 0; i < segs.length; i++) await ctl(segs[i].addr, segs[i].data);
      await ctl(0xE600, new Uint8Array([0]));                     // run: the chip comes back as a new device
      try { await dev.close(); } catch (e) { /* gone already */ }
      status("Firmware loaded. Waiting for the oscilloscope …");
      var found = null, self = this;
      for (var t = 0; t < 30 && !found; t++) {
        await sleep(150);
        var list = await navigator.usb.getDevices();
        found = list.filter(function (d) { return profileOf(d) === prof && self.loaded(d); })[0];
      }
      if (!found) { var err = new Error("again"); err.again = true; throw err; }
      dev = found;
      await dev.open();
      if (!dev.configuration) await dev.selectConfiguration(1);
    }
    try { await dev.claimInterface(0); }
    catch (e) { throw new Error("Cannot use the oscilloscope: " + e.message + " Close other programs like OpenHantek; on Windows the WinUSB driver is needed (Zadig)."); }
    this.dev = dev; this.prof = prof;
    this.kind = prof.dds ? "dds" : "std";
    this.cal = prof.eeprom ? await this.readCalibration() : null;
    return prof.name + (this.cal ? ", calibration from the EEPROM" : "");
  };
  H.vendor = function (req, val) {
    var dev = this.dev;
    return dev.controlTransferOut({ requestType: "vendor", recipient: "device", request: req, value: 0, index: 0 }, new Uint8Array([val]));
  };
  // offsets per range from the EEPROM: raw (+ fine) for below and from 30 MS/s, gain correction
  H.readCalibration = async function () {
    try {
      var r = await this.dev.controlTransferIn({ requestType: "vendor", recipient: "device", request: 0xA2, value: 8, index: 0 }, 80);
      var b = new Uint8Array(r.data.buffer, r.data.byteOffset, r.data.byteLength);
      if (b.length < 48) return null;
      var at = function (base, g, c) { return b[base + g * 2 + c]; };
      var off = function (raw, fine) { return raw && raw !== 255 ? raw + (fine && fine !== 255 ? (fine - 128) / 250 : 0) : null; };
      var cal = { ls: [[], []], hs: [[], []], gain: [[], []] }, any = false;
      for (var g = 0; g < 8; g++) for (var c = 0; c < 2; c++) {
        var ls = off(at(0, g, c), b.length >= 64 ? at(48, g, c) : 0), hs = off(at(16, g, c), b.length >= 80 ? at(64, g, c) : 0), gn = at(32, g, c);
        cal.ls[c][g] = ls; cal.hs[c][g] = hs; cal.gain[c][g] = gn && gn !== 255 ? 1 + (gn - 128) / 500 : 1;
        if (ls != null) any = true;
      }
      return any ? cal : null;
    } catch (e) { return null; }
  };
  /* s: { channels: 1|2, gain: [i, i] (range index), rate, coupling: ["DC"|"AC", …], calFreq } */
  H.configure = async function (s) {
    var G = GAIN[this.kind];
    await this.vendor(0xE4, s.channels);
    await this.vendor(0xE0, G[s.range[0]]);
    await this.vendor(0xE1, G[s.range[1]]);
    await this.vendor(0xE2, RATES.filter(function (r) { return r[0] === s.rate; })[0][1]);
    await this.vendor(0xE5, (s.coupling[0] === "AC" ? 0 : 0x01) | (s.coupling[1] === "AC" ? 0 : 0x10));
    await this.vendor(0xE6, calCode(s.calFreq || 1000));
  };
  // one capture of n bytes (the first ones are dropped: the start of a capture is not clean)
  H.capture = async function (nBytes) {
    var dev = this.dev, skip = 4096, total = Math.ceil((nBytes + skip) / 512) * 512, chunk = 1 << 18, got = 0, parts = [];
    var pending = [], asked = 0;
    while (asked < total && pending.length < 6) { var sz = Math.min(chunk, total - asked); pending.push(dev.transferIn(6, sz)); asked += sz; }
    await this.vendor(0xE3, 1);
    try {
      while (got < total) {
        var r = await pending.shift();
        if (asked < total) { var sz2 = Math.min(chunk, total - asked); pending.push(dev.transferIn(6, sz2)); asked += sz2; }
        if (!r.data || !r.data.byteLength) { if (!pending.length) break; continue; }
        parts.push(new Uint8Array(r.data.buffer, r.data.byteOffset, r.data.byteLength));
        got += r.data.byteLength;
      }
    } finally {
      await this.vendor(0xE3, 0);
    }
    var all = new Uint8Array(got), o = 0;
    parts.forEach(function (p) { all.set(p, o); o += p.length; });
    return all.subarray(Math.min(skip, all.length), Math.min(all.length, skip + nBytes));
  };
  // continuous stream for the roll mode: calls onData(bytes) until stop() returns true
  H.stream = async function (chunkBytes, onData, stop) {
    var dev = this.dev, size = Math.max(512, Math.ceil(chunkBytes / 512) * 512), pending = [];
    for (var i = 0; i < 4; i++) pending.push(dev.transferIn(6, size));
    await this.vendor(0xE3, 1);
    try {
      var first = true;
      while (!stop()) {
        var r = await pending.shift();
        pending.push(dev.transferIn(6, size));
        if (!r.data || !r.data.byteLength) continue;
        var b = new Uint8Array(r.data.buffer, r.data.byteOffset, r.data.byteLength);
        if (first) { first = false; b = b.subarray(Math.min(b.length, 4096)); }
        onData(b);
      }
    } finally {
      await this.vendor(0xE3, 0);
      await Promise.race([Promise.allSettled(pending), sleep(500)]);
    }
  };
  H.disconnect = async function () {
    try { if (this.dev) { await this.vendor(0xE3, 0); await this.dev.releaseInterface(0); await this.dev.close(); } } catch (e) { /* gone */ }
    this.dev = null;
  };

  // ================================================================ simulator
  /* The calibration output (1 kHz square wave, 0 … 2 V) on CH1 and a sine of 3.3 kHz with a
   * small harmonic and noise on CH2, sent as the scope sends them. */
  function Sim() { this.kind = "std"; this.prof = { name: "Simulator", id: "sim" }; this.cal = null; this.t = 0; this.s = null; }
  Sim.prototype.connect = async function () { await sleep(100); return "Simulator: calibration output on CH1, a sine wave on CH2"; };
  Sim.prototype.configure = async function (s) { this.s = JSON.parse(JSON.stringify(s)); };
  Sim.prototype.gen = function (n) {
    var s = this.s, ch = s.channels, out = new Uint8Array(n), dt = 1 / s.rate, sc = SCALE.std, f = s.calFreq || 1000;
    var k1 = sc[s.range[0]], k2 = sc[s.range[1]];
    for (var i = 0; i < n / ch; i++) {
      var t = this.t; this.t += dt;
      // a square wave of 0 … 2 V with edges of about 40 ns and a little ringing
      var te = ((t * f) % 0.5) / f, hi = (t * f) % 1 < 0.5;          // time since the last edge
      var v1 = hi ? 2.0 * (1 - Math.exp(-te / 4e-8)) + 0.08 * Math.exp(-te / 3e-7) * Math.sin(te * 6e7) : 2.0 * Math.exp(-te / 4e-8);
      if (s.coupling[0] === "AC") v1 -= 1.0;
      var v2 = 1.5 * Math.sin(2 * Math.PI * 3300 * t) + 0.2 * Math.sin(2 * Math.PI * 9900 * t + 0.4) + (Math.random() - 0.5) * 0.03;
      var r1 = Math.round(128 + v1 * k1 + (Math.random() - 0.5) * 1.6), r2 = Math.round(128 + v2 * k2 + (Math.random() - 0.5) * 1.6);
      if (ch === 1) out[i] = Math.max(0, Math.min(255, r1));
      else { out[2 * i] = Math.max(0, Math.min(255, r1)); out[2 * i + 1] = Math.max(0, Math.min(255, r2)); }
    }
    return out;
  };
  Sim.prototype.capture = async function (nBytes) {
    await sleep(Math.max(8, nBytes / this.s.channels / this.s.rate * 1000));
    this.t += Math.random() * 0.01;
    return this.gen(nBytes);
  };
  Sim.prototype.stream = async function (chunkBytes, onData, stop) {
    var last = performance.now();
    while (!stop()) {
      await sleep(30);
      var now = performance.now(), n = Math.round((now - last) / 1000 * this.s.rate) * this.s.channels;
      last = now;
      if (n > 0) onData(this.gen(Math.min(n, 4e6)));
    }
  };
  Sim.prototype.disconnect = async function () {};

  global.OSC = global.OSC || {};
  Object.assign(global.OSC, { Hantek: Hantek, Sim: Sim, VDIV: VDIV, GAIN: GAIN, SCALE: SCALE, RATES: RATES, MAX_RATE: MAX_RATE, CAL_FREQS: CAL_FREQS, calCode: calCode, PROFILES: PROFILES, parseHex: parseHex });
})(window);
