/* Power Analyzer: the serial line to the analyzer, and a simulated analyzer.
 *
 * The firmware reads one command line at a time ("l 1000 2900\n") and answers with lines of
 * numbers separated by tabs, ending with "DONE". The simulated analyzer behaves like a Web
 * Serial port with the same firmware behind it, so the app works the same way with it. */
(function (global) {
  "use strict";
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  // ================================================================ line link
  function Link(port) {
    this.port = port;
    this.lines = [];
    this.waiter = null;
    this.part = "";
    this.dec = new TextDecoder();
    this.open = false;
    this.onClose = null;
  }
  Link.prototype.start = async function () {
    await this.port.open({ baudRate: 115200 });
    this.open = true;
    this.loop();
  };
  Link.prototype.loop = async function () {
    var self = this;
    while (this.open && this.port.readable) {
      var reader = this.port.readable.getReader();
      this.reader = reader;
      try {
        for (;;) {
          var r = await reader.read();
          if (r.done) break;
          self.feed(self.dec.decode(r.value, { stream: true }));
        }
      } catch (e) { /* unplugged or closed */ }
      finally { try { reader.releaseLock(); } catch (e) { /* released */ } }
      if (!this.open) break;
      await sleep(50);
    }
  };
  Link.prototype.feed = function (t) {
    var parts = (this.part + t).split("\n");
    this.part = parts.pop();
    for (var i = 0; i < parts.length; i++) this.lines.push(parts[i].replace(/\r$/, ""));
    if (this.lines.length && this.waiter) { var w = this.waiter; this.waiter = null; w(); }
  };
  // the next line, or null after timeout ms
  Link.prototype.line = function (timeout) {
    var self = this;
    if (this.lines.length) return Promise.resolve(this.lines.shift());
    return new Promise(function (res) {
      var t = setTimeout(function () { self.waiter = null; res(null); }, timeout || 1000);
      self.waiter = function () { clearTimeout(t); res(self.lines.shift()); };
    });
  };
  Link.prototype.flush = function () { this.lines = []; this.part = ""; };
  Link.prototype.send = async function (s) {
    var w = this.port.writable.getWriter();
    try { await w.write(new TextEncoder().encode(s + "\n")); } finally { w.releaseLock(); }
  };
  Link.prototype.close = async function () {
    this.open = false;
    try { if (this.reader) await this.reader.cancel(); } catch (e) { /* closed */ }
    try { await this.port.close(); } catch (e) { /* closed */ }
  };

  // ================================================================ simulated analyzer
  var DACCUR = [717, 1434, 1956, 3260, 5608];
  function noise(a) { return (Math.random() - 0.5) * 2 * a; }
  function q4(mv) { return Math.max(0, Math.round(mv / 4) * 4); }          // INA219 bus voltage steps
  // the "power supply" on TEST-IN: a 5 V USB charger that folds back above 2.1 A
  function supply(i) { return i <= 2100 ? 5150 - 0.11 * i : Math.max(0, 5150 - 231 - (i - 2100) * 3.2); }
  // a lithium-ion cell: open circuit voltage over the state of charge
  var OCV = [[0, 2700], [0.02, 3100], [0.05, 3350], [0.1, 3500], [0.2, 3620], [0.4, 3720], [0.6, 3820], [0.8, 3950], [0.9, 4050], [1, 4180]];
  function ocv(s) {
    for (var i = 1; i < OCV.length; i++) if (s <= OCV[i][0]) { var a = OCV[i - 1], b = OCV[i]; return a[1] + (b[1] - a[1]) * (s - a[0]) / (b[0] - a[0]); }
    return 4180;
  }
  function SimPort() {
    var self = this;
    this.readable = new ReadableStream({ start: function (c) { self.ctl = c; } });
    this.writable = new WritableStream({ write: function (ch) { self.rx(ch); } });
    this.buf = ""; this.busy = false; this.pending = null; this.load = 0; this.stop = false;
  }
  SimPort.prototype.getInfo = function () { return { usbVendorId: 0x1A86, usbProductId: 0x7523 }; };
  SimPort.prototype.open = async function () {};
  SimPort.prototype.close = async function () { this.closed = true; };
  SimPort.prototype.out = function (s) { if (!this.closed) try { this.ctl.enqueue(new TextEncoder().encode(s + "\n")); } catch (e) { /* closed */ } };
  SimPort.prototype.rx = function (ch) {
    var t = new TextDecoder().decode(ch);
    for (var i = 0; i < t.length; i++) {
      if (t[i] !== "\n") { this.buf += t[i]; continue; }
      if (!this.buf) continue;
      var line = this.buf; this.buf = "";
      if (this.busy) { if (line[0] === "x") this.stop = true; else this.pending = line; continue; }
      this.run(line);
    }
  };
  SimPort.prototype.run = async function (line) {
    var m = /^(\S)\s*(\d*)\s*(\d*)/.exec(line), c = m[1], a = +m[2] || 0, b = +m[3] || 0, self = this;
    this.busy = true; this.stop = false;
    var row = function (v) { self.out(v.map(function (x) { return Math.max(0, Math.min(65535, Math.round(x))); }).join("\t")); };
    var ref = function (ma) { var k = 0; ma = Math.min(ma, DACCUR[4]); while (ma > DACCUR[k]) k++; return DACCUR[k]; };
    await sleep(3);
    if (c === "i") this.out("Power Analyzer");
    else if (c === "v") this.out("1.1 (simulated)");
    else if (c === "t") { var i1 = this.load ? this.load + noise(2) : 0; row([i1, q4(supply(i1) + noise(3)), 0, q4(12000 + noise(4))]); }
    else if (c === "s") { this.load = Math.max(17, Math.min(5000, a)); this.out("DONE"); }
    else if (c === "r") { this.load = 0; this.out("DONE"); }
    else if (c === "l" || c === "e" || c === "f") {
      var mx = Math.min(a, 4999), full = ref(mx);
      for (var d = 0; d < 255; d++) {
        var i = Math.max(17, d / 255 * full) * (1 + noise(0.003)), u = q4(supply(i) + noise(4)), p = u * i / 1000;
        if (p > 25000 || u < b || i > mx) break;
        if (c === "l") row([i, u, p]);
        else if (c === "e") { var uo = q4(5000 - 0.06 * i + noise(3)), po = uo * i / 1000, loss = 55 + 0.04 * i + 0.00028 * i * i; row([i, uo, 1000 * po / (po + loss) + noise(2)]); }
        else row([i, 4 * Math.round((10 + 0.018 * i + Math.abs(noise(4))) / 4)]);
        await sleep(c === "f" ? 45 : 28);
      }
      this.out("DONE");
    } else if (c === "g") {
      var prof = [0, 2, 5, 7, 10, 10, 5, 0, 10, 0], t = 0, il = 17, uu = supply(17), dip = 0, cnt = 0;
      for (var k = 0; k < 10; k++) {
        var target = Math.max(17, a * prof[k] / 10);
        if (target !== il) { dip -= (target - il) * 0.16; il = target; }
        for (var s = 0; s < 100; s += 1.6) {
          dip *= 0.62; uu = supply(il) + dip;
          row([t, il + noise(4), q4(uu + noise(3))]);
          t += 1.6;
          if (++cnt % 20 === 0) await sleep(30);
        }
      }
      this.out("DONE");
    } else if (c === "b") {
      var cap = 2200 * 3600, q = 0, dac = 255 * Math.min(a, 3000) / ref(Math.min(a, 3000)), stepI = ref(Math.min(a, 3000)) / 255, ts = 0;
      while (dac > 0 && !this.stop) {
        var ib = dac * stepI, soc = Math.max(0, 1 - q / cap), ub = q4(ocv(soc) - ib * 0.07 + noise(3));
        if (ub < b) dac--;
        row([ts, ib + noise(2), ub, q / 3600]);
        q += ib; ts++;
        if (ts % 3 === 0) await sleep(4);
      }
      this.out("DONE");
    } else if (c === "m") {
      var tm = 0, end = 1000 * b, real = Math.min(a, 25);
      while (tm <= end && !this.stop) {
        var ph = (tm % 2000) < 700 ? 1 : 0, im = 82 + ph * (240 + noise(30)) + noise(3), um = q4(5020 - im * 0.05 + noise(3));
        row([tm, im, um]);
        tm += a;
        await sleep(real);
      }
      this.out("DONE");
    } else if (c === "c") {
      var n = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, e2 = Date.now() + Math.min(b, 20) * 1000 / 4;
      while (Date.now() < e2) {
        n++; var ic = a * 1.012 + noise(2);
        s1 += ic; s2 += q4(supply(a) * 0.996 + noise(4)); s3 += a * 1.004 + noise(2); s4 += q4(supply(a) + 30 + noise(4));
        row([s1 / n, s2 / n, s3 / n, s4 / n]);
        await sleep(25);
      }
      this.out("DONE");
    }
    this.busy = false;
    if (this.pending) { var p2 = this.pending; this.pending = null; this.run(p2); }
  };

  global.PA = global.PA || {};
  global.PA.Link = Link;
  global.PA.SimPort = SimPort;
})(typeof window !== "undefined" ? window : globalThis);
