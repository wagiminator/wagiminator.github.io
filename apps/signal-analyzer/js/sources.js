/* Signal Analyzer: where samples come from.
 *
 *  Pico:  Raspberry Pi Pico with the sigrok-pico firmware, over Web Serial
 *         (protocol as in the raspberrypi-pico driver of libsigrok). The same protocol
 *         is spoken by the logic analyzer firmware for the CH32X033 development board
 *         (8 channels PA0..PA7, sample rates 48 MHz / n).
 *  FX2:   the cheap "24 MHz 8 channel" logic analyzers with a Cypress FX2, over WebUSB.
 *         The free fx2lafw firmware is loaded into the chip at every start, as sigrok does.
 *  Sound: the microphone or line input, through Web Audio.
 *
 * All of them feed a Recorder, which looks for the trigger and keeps the samples. */
(function (global) {
  "use strict";
  var SA = global.SA;
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  // ================================================================ recorder with trigger
  /* o: { n, wordType (typed array class or null), digital (names), analog (count),
   *      trig: null | { kind: "d", bit, type } | { kind: "a", index, type, level }, pre (0..0.9) } */
  function Recorder(o) {
    this.n = o.n;
    this.W = o.wordType ? new o.wordType(o.n) : null;
    this.A = [];
    for (var i = 0; i < (o.analog || 0); i++) this.A.push(new Float32Array(o.n));
    this.trig = o.trig || null;
    this.pre = this.trig ? Math.floor(o.n * (o.pre || 0)) : 0;
    this.count = 0;
    this.seen = 0;
    this.fired = !this.trig;
    this.at = null;
    if (this.trig && this.pre) {
      this.rW = this.W ? new o.wordType(this.pre) : null;
      this.rA = this.A.map(function () { return new Float32Array(this.pre); }, this);
    }
    this.prev = null;
  }
  Recorder.prototype.done = function () { return this.count >= this.n; };
  // words: typed array chunk or null; analog: array of Float32Array chunks or null
  Recorder.prototype.push = function (words, analog) {
    var len = words ? words.length : analog[0].length, i = 0, t = this.trig;
    if (!this.fired) {
      var pre = this.pre, rW = this.rW, rA = this.rA, prev = this.prev;
      if (t.kind === "d") {
        var b = t.bit, ty = t.type;
        for (; i < len; i++) {
          var v = (words[i] >>> b) & 1, hit = false;
          if (ty === "high") hit = v === 1; else if (ty === "low") hit = v === 0;
          else if (prev !== null) hit = ty === "rise" ? prev === 0 && v === 1 : ty === "fall" ? prev === 1 && v === 0 : prev !== v;
          if (hit) break;
          prev = v;
          if (pre) { var k = this.seen % pre; if (rW) rW[k] = words[i]; if (rA) for (var a = 0; a < rA.length; a++) rA[a][k] = analog[a][i]; }
          this.seen++;
        }
      } else {
        var ch = analog[t.index], lev = t.level;
        for (; i < len; i++) {
          var x = ch[i], h2 = false;
          if (prev !== null) h2 = t.type === "rise" ? prev < lev && x >= lev : t.type === "fall" ? prev > lev && x <= lev : (prev < lev) !== (x < lev);
          if (h2) break;
          prev = x;
          if (pre) { var k2 = this.seen % pre; if (rW) rW[k2] = words[i]; for (var a2 = 0; a2 < rA.length; a2++) rA[a2][k2] = analog[a2][i]; }
          this.seen++;
        }
      }
      this.prev = prev;
      if (i >= len) return false;
      // fired: copy the samples before the trigger, oldest first
      this.fired = true;
      var have = Math.min(pre, this.seen), first = this.seen - have;
      for (var j = 0; j < have; j++) {
        var src = (first + j) % (pre || 1);
        if (this.W) this.W[j] = rW[src];
        for (var a3 = 0; a3 < this.A.length; a3++) this.A[a3][j] = rA[a3][src];
      }
      this.count = have;
      this.at = have;
    }
    var take = Math.min(len - i, this.n - this.count);
    if (take > 0) {
      if (this.W) this.W.set(words.subarray(i, i + take), this.count);
      for (var a4 = 0; a4 < this.A.length; a4++) this.A[a4].set(analog[a4].subarray(i, i + take), this.count);
      this.count += take;
    }
    return this.done();
  };
  // what was recorded, as a capture
  Recorder.prototype.capture = function (rate, digital, analog, source) {
    var n = this.count;
    if (!n) return null;
    return new SA.Capture({ rate: rate, n: n, trigger: this.at, source: source,
      words: this.W ? (n < this.n ? this.W.slice(0, n) : this.W) : null, digital: digital,
      analog: (analog || []).map(function (a, i) { return Object.assign({}, a, { data: n < this.n ? this.A[i].slice(0, n) : this.A[i] }); }, this) });
  };

  // ================================================================ Raspberry Pi Pico (sigrok-pico) and CH32X033
  function Pico() {
    this.port = null; this.rx = []; this.rxLen = 0; this.waiter = null; this.info = null; this.parser = null; this.ch32 = false;
  }
  Pico.prototype.name = "Raspberry Pi Pico or CH32X033 board";
  // the CH32X033 logic analyzer firmware uses the shared VID/PID of V-USB for CDC-ACM
  var CH32_ID = { usbVendorId: 0x16C0, usbProductId: 0x27DD };
  Pico.prototype.supported = function () { return "serial" in navigator; };
  Pico.prototype.connect = async function (status) {
    var port = await navigator.serial.requestPort({ filters: [{ usbVendorId: 0x2E8A }, CH32_ID] });
    await port.open({ baudRate: 115200, bufferSize: 1 << 20 });
    this.port = port;
    var pi = port.getInfo ? port.getInfo() : {};
    this.ch32 = pi.usbVendorId === CH32_ID.usbVendorId && pi.usbProductId === CH32_ID.usbProductId;
    var who = this.ch32 ? "CH32X033 board" : "Pico";
    this.loop();
    status("Asking the " + who + " who it is …");
    var info = null;
    for (var tries = 0; tries < 2 && !info; tries++) {
      this.write("*"); await sleep(120); this.flush();
      this.write("i\n");
      var r = await this.readFor(400, 17);
      var m = /SRPICO,A(\d\d)(\d)D(\d\d),(\d\d)/.exec(r);
      if (m) info = { analog: +m[1], asize: +m[2], digital: +m[3], version: m[4] };
    }
    if (!info) { await this.disconnect(); throw new Error(this.ch32 ? "This serial port does not answer like a CH32X033 board with the logic analyzer firmware." : "This serial port does not answer like a Pico with the sigrok-pico firmware."); }
    this.info = info;
    if (this.ch32) return "CH32X033 logic analyzer: " + info.digital + " channels (PA0–PA" + (info.digital - 1) + ")";
    return "Pico with sigrok-pico firmware: " + info.digital + " digital, " + info.analog + " analog channels";
  };
  Pico.prototype.loop = async function () {
    var self = this;
    while (this.port && this.port.readable) {
      var reader = this.port.readable.getReader();
      this.reader = reader;
      try {
        for (;;) {
          var r = await reader.read();
          if (r.done) break;
          if (self.parser) self.parser(r.value);
          else { self.rx.push(r.value); self.rxLen += r.value.length; if (self.waiter) self.waiter(); }
        }
      } catch (e) { /* the port went away */ }
      finally { reader.releaseLock(); }
      if (this.closing) break;
    }
  };
  Pico.prototype.write = function (s) {
    var w = this.port.writable.getWriter();
    var p = w.write(new TextEncoder().encode(s));
    w.releaseLock();
    return p;
  };
  Pico.prototype.flush = function () { this.rx = []; this.rxLen = 0; };
  Pico.prototype.take = function () { var all = new Uint8Array(this.rxLen), p = 0; this.rx.forEach(function (c) { all.set(c, p); p += c.length; }); this.flush(); return all; };
  // read what arrives within ms (or until count bytes are there)
  Pico.prototype.readFor = function (ms, count) {
    var self = this;
    return new Promise(function (res) {
      var done = false, t = setTimeout(fin, ms);
      function fin() { if (done) return; done = true; clearTimeout(t); self.waiter = null; res(new TextDecoder().decode(self.take())); }
      self.waiter = function () { if (count && self.rxLen >= count) fin(); };
      self.waiter();                                   // the answer may be here already
    });
  };
  Pico.prototype.ack = async function (cmd) {
    this.flush();
    await this.write(cmd);
    var r = await this.readFor(1000, 1);
    if (r[0] !== "*") throw new Error("The " + (this.ch32 ? "board" : "Pico") + " did not accept “" + cmd.trim() + "”.");
  };
  Pico.prototype.rates = function (cfg) {
    var a = cfg && cfg.analog ? cfg.analog.length : 0;
    // CH32X033: 48 MHz divided by an integer, up to 8 MS/s
    if (this.ch32) return [5e3, 10e3, 20e3, 50e3, 100e3, 200e3, 250e3, 500e3, 1e6, 2e6, 3e6, 4e6];   // the DMA of the CH32X033 cannot go faster
    var list = [5e3, 10e3, 20e3, 50e3, 100e3, 200e3, 250e3, 500e3, 1e6, 2e6, 4e6, 5e6, 10e6, 20e6, 25e6, 40e6, 50e6, 100e6, 120e6];
    if (a) list = list.filter(function (r) { return r <= [0, 500e3, 250e3, 160e3][a] && 24e6 % r === 0; });
    return list;
  };
  Pico.prototype.maxSamples = function () { return 10e6; };
  Pico.prototype.channels = function () {
    var i = this.info || { digital: 21, analog: 3 }, d = [], a = [];
    for (var k = 0; k < i.digital; k++) d.push({ id: "D" + k, name: this.ch32 ? "PA" + k : "GP" + (k + 2), bit: k });
    for (k = 0; k < i.analog; k++) a.push({ id: "A" + k, name: "ADC" + k, unit: "V" });
    return { digital: d, analog: a };
  };
  /* cfg: { rate, n, digital: number of digital channels (from GP2 on), analog: [indices], trig, pre } */
  Pico.prototype.capture = async function (cfg, status, stopFlag) {
    var info = this.info, self = this, nd = Math.min(cfg.digital, info.digital), asz = info.asize;
    var aEn = cfg.analog.filter(function (k) { return k < info.analog; });
    this.write("*"); await sleep(60); this.flush();
    for (var a = 0; a < info.analog; a++) await this.ack("A" + (aEn.indexOf(a) >= 0 ? 1 : 0) + a + "\n");
    for (var d = 0; d < info.digital; d++) await this.ack("D" + (d < nd ? 1 : 0) + d + "\n");
    await this.ack("L" + cfg.n + "\n");
    var scale = [], off = [];
    for (a = 0; a < info.analog; a++) {
      this.flush(); await this.write("a" + a + "\n");
      var r = await this.readFor(150), m = /(-?\d+)x(-?\d+)/.exec(r);
      scale[a] = m ? +m[1] / 1e6 : 0.0257; off[a] = m ? +m[2] / 1e6 : 0;
    }
    this.flush(); await this.write("R" + cfg.rate + "\n");
    var rr = await this.readFor(300, 1);
    if (rr[0] !== "*") throw new Error("The " + (this.ch32 ? "board" : "Pico") + " refused the sample rate" + (rr ? ": " + rr.trim() : "."));
    await sleep(30); this.flush();
    var wt = nd <= 8 ? Uint8Array : nd <= 16 ? Uint16Array : Uint32Array;
    var rec = new Recorder({ n: cfg.n, wordType: nd ? wt : null, analog: aEn.length, trig: cfg.trig, pre: cfg.pre });
    var aList = aEn.slice().sort();
    var d4 = !aList.length && nd <= 4, dmask = nd ? (nd >= 32 ? 0xFFFFFFFF : (1 << nd) - 1) : 0;
    var groups = [];
    for (var g = 0; g < info.digital; g += 7) if ((dmask >>> g) & 0x7F) groups.push(g);
    var slice = aList.length * asz + groups.length;
    var last = 0, lastA = aList.map(function () { return 0; }), rest = new Uint8Array(0), ended = false, aborted = false, endText = "", bytes = 0;
    var stopSent = false;
    // output buffers, grown when needed
    var cap = 65536, oW = nd ? new wt(cap) : null, oA = aList.map(function () { return new Float32Array(cap); }), cnt = 0;
    function emit(w, av, times) {
      while (times > 0) {
        if (cnt === cap) flushOut();
        var k = Math.min(times, cap - cnt);
        if (oW) oW.fill(w, cnt, cnt + k);
        for (var q = 0; q < oA.length; q++) oA[q].fill(av[q], cnt, cnt + k);
        cnt += k; times -= k;
      }
    }
    function flushOut() {
      if (!cnt) return;
      if (!rec.done()) rec.push(oW ? oW.subarray(0, cnt) : null, oA.map(function (x) { return x.subarray(0, cnt); }));
      cnt = 0;
    }
    var finished;
    var whenDone = new Promise(function (res) { finished = res; });
    function stopDevice() { if (!stopSent && cfg.trig) { stopSent = true; self.write("+"); } }
    this.parser = function (chunk) {
      if (ended) { endText += new TextDecoder().decode(chunk); if (/\+/.test(endText)) finished(); return; }
      var b = rest.length ? concat(rest, chunk) : chunk, i = 0, L = b.length;
      while (i < L) {
        var c = b[i];
        if (d4) {
          if (c >= 48 && c <= 127) { emit(last, lastA, (c - 47) * 8); i++; bytes++; continue; }
          if (c >= 0x80) { emit(last, lastA, (c & 0x70) >> 4); last = c & 0xF; emit(last, lastA, 1); i++; bytes++; continue; }
        } else {
          if (c >= 0x30 && c < 0x80) { emit(last, lastA, c <= 79 ? c - 47 : (c - 78) * 32); i++; bytes++; continue; }
          if (c >= 0x80) {
            if (i + slice > L) break;                      // the rest of the slice comes with the next chunk
            var w = 0, p = i;
            for (var gi = 0; gi < groups.length; gi++) { w |= (b[p++] & 0x7F) << groups[gi]; }
            for (var ai = 0; ai < aList.length; ai++) {
              var v = 0;
              for (var z = 0; z < asz; z++) v += (b[p++] - 0x80) << (7 * z);
              lastA[ai] = v * scale[aList[ai]] + off[aList[ai]];
            }
            last = w & dmask;
            emit(last, lastA, 1);
            bytes += slice; i = p;
            continue;
          }
        }
        // anything else ends the data: "$<byte count>+" or an abort
        ended = true;
        if (c !== 36) aborted = true;
        endText = new TextDecoder().decode(b.subarray(i));
        break;
      }
      rest = !ended && i < L ? b.slice(i) : new Uint8Array(0);
      flushOut();
      if (rec.done()) stopDevice();
      status(rec.fired ? "Receiving: " + Math.round(100 * rec.count / rec.n) + " %" : "Waiting for the trigger …");
      if (ended && /\+/.test(endText)) finished();
      if (aborted) finished();
    };
    function concat(a, b) { var o = new Uint8Array(a.length + b.length); o.set(a); o.set(b, a.length); return o; }
    await this.write(cfg.trig ? "C\n" : "F\n");
    status(cfg.trig ? "Waiting for the trigger …" : "Capturing …");
    var poll = setInterval(function () { if (stopFlag()) { stopDevice(); if (!cfg.trig) { self.write("*"); finished(); } } }, 100);
    await whenDone;
    clearInterval(poll);
    this.parser = null;
    var m2 = /\$(\d+)\+/.exec(endText), warn = "";
    if (aborted) warn = "The " + (this.ch32 ? "board" : "Pico") + " stopped early: it could not " + (this.ch32 ? "take or send the samples" : "send the data") + " fast enough. Use a lower sample rate, fewer channels or no trigger" + (this.ch32 ? " (without trigger, up to 16384 samples are taken into its memory at full speed)." : ".");
    else if (m2 && +m2[1] !== bytes) warn = "Some data got lost on the way (" + m2[1] + " bytes sent, " + bytes + " received).";
    var chs = this.channels();
    var res = rec.capture(cfg.rate, chs.digital.slice(0, nd), aList.map(function (k) { return chs.analog[k]; }), this.ch32 ? "CH32X033 logic analyzer" : "Raspberry Pi Pico");
    return { capture: res, warn: warn, noTrigger: !rec.fired };
  };
  Pico.prototype.disconnect = async function () {
    this.closing = true;
    try { if (this.reader) await this.reader.cancel(); } catch (e) { /* closed */ }
    try { if (this.port) await this.port.close(); } catch (e) { /* closed */ }
    this.port = null; this.closing = false;
  };

  // ================================================================ FX2 logic analyzers (fx2lafw)
  var FX2_IDS = [
    { vendorId: 0x0925, productId: 0x3881, fw: "fx2lafw-saleae-logic.fw", name: "Saleae Logic compatible (8 channels)", wide: false },
    { vendorId: 0x04B4, productId: 0x8613, fw: "fx2lafw-cypress-fx2.fw", name: "Cypress FX2 board (16 channels)", wide: true },
    { vendorId: 0x1D50, productId: 0x608C, fw: "fx2lafw-sigrok-fx2-8ch.fw", name: "sigrok FX2 (8 channels)", wide: false },
    { vendorId: 0x1D50, productId: 0x608D, fw: "fx2lafw-sigrok-fx2-16ch.fw", name: "sigrok FX2 (16 channels)", wide: true }
  ];
  function profileOf(dev) {
    for (var i = 0; i < FX2_IDS.length; i++) if (FX2_IDS[i].vendorId === dev.vendorId && FX2_IDS[i].productId === dev.productId) return FX2_IDS[i];
    return null;
  }
  function FX2() { this.dev = null; this.prof = null; }
  FX2.prototype.name = "FX2 logic analyzer";
  FX2.prototype.supported = function () { return "usb" in navigator; };
  FX2.prototype.connect = async function (status) {
    var dev = await navigator.usb.requestDevice({ filters: FX2_IDS.map(function (f) { return { vendorId: f.vendorId, productId: f.productId }; }) });
    return this.prepare(dev, status);
  };
  FX2.prototype.hasFirmware = function (dev) { return dev.manufacturerName === "sigrok" && dev.productName === "fx2lafw"; };
  FX2.prototype.prepare = async function (dev, status) {
    var prof = profileOf(dev);
    await dev.open();
    if (!dev.configuration) await dev.selectConfiguration(1);
    if (!this.hasFirmware(dev)) {
      status("Loading the fx2lafw firmware into the analyzer …");
      var fw = new Uint8Array(await (await fetch("fw/" + prof.fw)).arrayBuffer());
      try { await dev.claimInterface(0); } catch (e) { /* not needed on every system */ }
      var ctl = function (value, data) { return dev.controlTransferOut({ requestType: "vendor", recipient: "device", request: 0xA0, value: value, index: 0 }, data); };
      await ctl(0xE600, new Uint8Array([1]));                     // hold the 8051 in reset
      for (var off = 0; off < fw.length; off += 4096) await ctl(off, fw.subarray(off, Math.min(fw.length, off + 4096)));
      await ctl(0xE600, new Uint8Array([0]));                     // run: the chip starts again as a new device
      try { await dev.close(); } catch (e) { /* it is gone already */ }
      status("Firmware loaded. Waiting for the analyzer to come back …");
      var found = null;
      for (var t = 0; t < 30 && !found; t++) {
        await sleep(150);
        var list = await navigator.usb.getDevices();
        found = list.filter(function (d) { return profileOf(d) && d.productName === "fx2lafw"; })[0];
      }
      if (!found) { var err = new Error("again"); err.again = true; throw err; }
      dev = found;
      await dev.open();
      if (!dev.configuration) await dev.selectConfiguration(1);
    }
    try { await dev.claimInterface(0); } catch (e) { throw new Error("Cannot use the analyzer: " + e.message + " Close other programs like PulseView; on Windows the WinUSB driver is needed."); }
    var v = await dev.controlTransferIn({ requestType: "vendor", recipient: "device", request: 0xB0, value: 0, index: 0 }, 2);
    var major = v.data.getUint8(0), minor = v.data.getUint8(1);
    if (major !== 1) throw new Error("Unexpected firmware version " + major + "." + minor + ".");
    this.dev = dev; this.prof = profileOf(dev) || prof;
    return this.prof.name + ", fx2lafw " + major + "." + minor;
  };
  FX2.prototype.rates = function (cfg) {
    var list = [20e3, 25e3, 50e3, 100e3, 200e3, 250e3, 500e3, 1e6, 2e6, 3e6, 4e6, 6e6, 8e6, 12e6, 16e6, 24e6];
    if (cfg && cfg.digital > 8) list = list.filter(function (r) { return r <= 12e6; });
    return list;
  };
  FX2.prototype.maxSamples = function () { return 100e6; };
  FX2.prototype.channels = function () {
    var n = this.prof && this.prof.wide ? 16 : 8, d = [];
    for (var k = 0; k < n; k++) d.push({ id: "D" + k, name: "CH" + (k + 1), bit: k });
    return { digital: d, analog: [] };
  };
  FX2.prototype.capture = async function (cfg, status, stopFlag) {
    var dev = this.dev, rate = cfg.rate, wide = cfg.digital > 8 && this.prof.wide;
    // clock and delay as in libsigrok: 48 MHz or 30 MHz divided by delay + 1
    var flags = 0, delay = 0;
    if (48e6 % rate === 0) { flags = 1 << 6; delay = 48e6 / rate - 1; if (delay > 1536) delay = 0; }
    if (delay === 0 && 30e6 % rate === 0) { flags = 0; delay = 30e6 / rate - 1; }
    if (delay < 0 || delay > 1536) throw new Error("The analyzer cannot sample at this rate.");
    if (wide) flags |= 1 << 5;
    var bpms = rate / 1000 * (wide ? 2 : 1), size = Math.max(512, Math.ceil(10 * bpms / 512) * 512);
    var num = Math.max(2, Math.min(32, Math.floor(500 * bpms / size)));
    var rec = new Recorder({ n: cfg.n, wordType: wide ? Uint16Array : Uint8Array, analog: 0, trig: cfg.trig, pre: cfg.pre });
    var pending = [], self = this, empty = 0, t0 = performance.now(), got = 0;
    for (var i = 0; i < num; i++) pending.push(dev.transferIn(2, size));
    await dev.controlTransferOut({ requestType: "vendor", recipient: "device", request: 0xB1, value: 0, index: 0 },
      new Uint8Array([flags, (delay >> 8) & 0xFF, delay & 0xFF]));
    status(cfg.trig ? "Waiting for the trigger …" : "Capturing …");
    var lastUi = 0;
    try {
      while (!rec.done() && !stopFlag()) {
        var r = await pending.shift();
        pending.push(dev.transferIn(2, size));
        var dv = r.data;
        if (!dv || !dv.byteLength) { if (++empty > 2 * num) throw new Error("The analyzer sends no data."); continue; }
        empty = 0; got += dv.byteLength;
        var words = wide ? new Uint16Array(dv.buffer.slice(dv.byteOffset, dv.byteOffset + (dv.byteLength & ~1)))
          : new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength);
        rec.push(words, null);
        var now = performance.now();
        if (now - lastUi > 150) { lastUi = now; status(rec.fired ? "Capturing: " + Math.round(100 * rec.count / rec.n) + " %" : "Waiting for the trigger …"); }
      }
    } finally {
      // the transfers still waiting finish as the data keeps coming; then the device is idle
      await Promise.race([Promise.allSettled(pending), sleep(1500)]);
    }
    var secs = (performance.now() - t0) / 1000, warn = "";
    if (rec.fired && got / secs < 0.8 * bpms * 1000 && secs > 0.3) warn = "The computer received the data slower than it was sampled; parts of the capture may be missing. Try a lower sample rate.";
    var chs = this.channels();
    return { capture: rec.capture(rate, chs.digital.slice(0, wide ? 16 : 8), [], "FX2 logic analyzer"), warn: warn, noTrigger: !rec.fired };
  };
  FX2.prototype.disconnect = async function () {
    try { if (this.dev) { await this.dev.releaseInterface(0); await this.dev.close(); } } catch (e) { /* gone */ }
    this.dev = null;
  };

  // ================================================================ sound card
  var TAP = "class SaTap extends AudioWorkletProcessor{constructor(){super();this.on=false;this.b=[[],[]];this.n=0;this.port.onmessage=e=>{this.on=e.data};}" +
    "process(i){const x=i[0];if(this.on&&x&&x.length){const l=x[0],r=x[1]||x[0];this.b[0].push(l.slice(0));this.b[1].push(r.slice(0));this.n+=l.length;" +
    "if(this.n>=2048){const m=c=>{const o=new Float32Array(this.n);let p=0;for(const a of c){o.set(a,p);p+=a.length}return o};const L=m(this.b[0]),R=m(this.b[1]);" +
    "this.port.postMessage([L,R],[L.buffer,R.buffer]);this.b=[[],[]];this.n=0}}return true}}registerProcessor('sa-tap',SaTap);";
  function Sound() { this.ctx = null; this.stream = null; this.node = null; this.rate = 48000; this.wanted = 48000; }
  Sound.prototype.name = "Sound card";
  Sound.prototype.supported = function () { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && global.AudioWorkletNode); };
  Sound.prototype.connect = async function (status, opts) {
    this.wanted = (opts && opts.rate) || this.wanted;
    var dev = opts && opts.deviceId;
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: dev ? { exact: dev } : undefined, channelCount: { ideal: 2 },
      echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    try { this.ctx = new AudioContext({ sampleRate: this.wanted, latencyHint: "interactive" }); }
    catch (e) { this.ctx = new AudioContext(); }
    var url = URL.createObjectURL(new Blob([TAP], { type: "text/javascript" }));
    await this.ctx.audioWorklet.addModule(url);
    URL.revokeObjectURL(url);
    var src = this.ctx.createMediaStreamSource(this.stream);
    this.node = new AudioWorkletNode(this.ctx, "sa-tap", { numberOfInputs: 1, numberOfOutputs: 0, channelCount: 2, channelCountMode: "explicit" });
    src.connect(this.node);
    this.rate = this.ctx.sampleRate;
    await this.ctx.suspend();
    var tr = this.stream.getAudioTracks()[0], set = tr.getSettings ? tr.getSettings() : {};
    this.stereo = (set.channelCount || 2) >= 2;
    return (tr.label || "Audio input") + ", " + (this.rate / 1000) + " kHz, " + (this.stereo ? "stereo" : "mono");
  };
  Sound.prototype.devices = async function () {
    var l = await navigator.mediaDevices.enumerateDevices();
    return l.filter(function (d) { return d.kind === "audioinput"; });
  };
  Sound.prototype.rates = function () { return [this.rate]; };
  Sound.prototype.maxSamples = function () { return 20e6; };
  Sound.prototype.channels = function () {
    return { digital: [], analog: this.stereo === false ? [{ id: "L", name: "Input", fixedMin: -1, fixedMax: 1 }] :
      [{ id: "L", name: "Left", fixedMin: -1, fixedMax: 1 }, { id: "R", name: "Right", fixedMin: -1, fixedMax: 1 }] };
  };
  Sound.prototype.capture = async function (cfg, status, stopFlag) {
    var chs = this.channels(), na = chs.analog.length, self = this;
    var rec = new Recorder({ n: cfg.n, wordType: null, analog: na, trig: cfg.trig, pre: cfg.pre });
    var finished, done = new Promise(function (r) { finished = r; });
    this.node.port.onmessage = function (e) {
      if (rec.done()) return;
      rec.push(null, e.data.slice(0, na));
      status(rec.fired ? "Recording: " + Math.round(100 * rec.count / rec.n) + " %" : "Waiting for the trigger …");
      if (rec.done()) finished();
    };
    await this.ctx.resume();
    this.node.port.postMessage(true);
    status(cfg.trig ? "Waiting for the trigger …" : "Recording …");
    var poll = setInterval(function () { if (stopFlag()) finished(); }, 100);
    await done;
    clearInterval(poll);
    this.node.port.postMessage(false);
    await this.ctx.suspend();
    return { capture: rec.capture(self.rate, [], chs.analog, "Sound card"), warn: "", noTrigger: !rec.fired };
  };
  Sound.prototype.disconnect = async function () {
    try { if (this.stream) this.stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) { /* stopped */ }
    try { if (this.ctx) await this.ctx.close(); } catch (e) { /* closed */ }
    this.ctx = null; this.stream = null; this.node = null;
  };

  SA.Recorder = Recorder;
  SA.sources = { pico: Pico, fx2: FX2, sound: Sound };
  SA.FX2_IDS = FX2_IDS;
})(window);
