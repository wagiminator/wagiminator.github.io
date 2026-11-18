/* Signal Analyzer: demo signals, generated in the browser. Each one comes with the
 * decoder that reads it, so the app can be tried without hardware. */
(function (global) {
  "use strict";
  var SA = global.SA;

  // a few channels as lists of level changes in seconds
  function Gen(rate, names, idle) {
    this.rate = rate;
    this.names = names;
    this.ev = names.map(function () { return []; });
    this.lv = names.map(function (n, i) { return idle && idle[i] != null ? idle[i] : 1; });
    this.init = this.lv.slice();
    this.t = 0;
  }
  Gen.prototype.set = function (ch, v, t) {
    if (t == null) t = this.t;
    if (this.lv[ch] === v) return;
    this.lv[ch] = v;
    this.ev[ch].push(t, v);
  };
  Gen.prototype.wait = function (sec) { this.t += sec; };
  Gen.prototype.capture = function (extra, source) {
    var n = Math.ceil((this.t + (extra || 0)) * this.rate), rate = this.rate, self = this;
    var words = this.names.length <= 8 ? new Uint8Array(n) : new Uint16Array(n);
    this.ev.forEach(function (list, ci) {
      var v = self.init[ci], s = 0, m = 1 << ci;
      for (var j = 0; j <= list.length; j += 2) {
        var at = j < list.length ? Math.min(n, Math.round(list[j] * rate)) : n;
        if (v) for (; s < at; s++) words[s] |= m; else s = at;
        if (j < list.length) v = list[j + 1];
      }
    });
    return new SA.Capture({ rate: rate, n: n, words: words, source: source || "Demo",
      digital: this.names.map(function (nm, i) { return { id: "D" + i, name: nm, bit: i }; }) });
  };
  var us = 1e-6;
  function bytes(s) { return Array.prototype.map.call(s, function (c) { return c.charCodeAt(0); }); }

  // ---------------------------------------------------------------- UART
  function uart() {
    var g = new Gen(2e6, ["TX", "RX"]), T = 1 / 115200;
    function send(ch, list) {
      list.forEach(function (b) {
        g.set(ch, 0); g.wait(T);
        for (var i = 0; i < 8; i++) { g.set(ch, (b >> i) & 1); g.wait(T); }
        g.set(ch, 1); g.wait(T * 1.3);
      });
    }
    g.wait(200 * us);
    send(0, bytes("AT+NAME?\r\n"));
    g.wait(600 * us);
    send(1, bytes("+NAME:Signal Analyzer\r\nOK\r\n"));
    g.wait(300 * us);
    return { cap: g.capture(0, "Demo: UART"), dec: [{ type: "uart", ch: { rx: "D1", tx: "D0" }, opts: { fmt: "ascii" } }] };
  }

  // ---------------------------------------------------------------- I2C
  function i2c() {
    var g = new Gen(4e6, ["SCL", "SDA"]), q = 2.5 * us;     // 100 kHz
    function start() { g.set(1, 1); g.set(0, 1); g.wait(q); g.set(1, 0); g.wait(q); g.set(0, 0); g.wait(q); }
    function byte(b, ack) {
      for (var i = 7; i >= -1; i--) {
        g.set(1, i >= 0 ? (b >> i) & 1 : (ack ? 0 : 1)); g.wait(q);
        g.set(0, 1); g.wait(2 * q); g.set(0, 0); g.wait(q);
      }
      g.set(1, 1);
    }
    function stop() { g.set(1, 0); g.wait(q); g.set(0, 1); g.wait(q); g.set(1, 1); g.wait(4 * q); }
    g.wait(20 * us);
    // SSD1306 OLED: switch the display on
    start(); byte(0x3C << 1, true);
    [0x00, 0xAE, 0xD5, 0x80, 0xA8, 0x3F, 0xD3, 0x00, 0x40, 0x8D, 0x14, 0x20, 0x00, 0xA1, 0xC8, 0xDA, 0x12, 0x81, 0xCF, 0xAF].forEach(function (b) { byte(b, true); });
    stop();
    g.wait(60 * us);
    // INA219: read the bus voltage register
    start(); byte(0x40 << 1, true); byte(0x02, true);
    g.set(1, 1); g.wait(q); g.set(0, 1); g.wait(q);
    start(); byte((0x40 << 1) | 1, true); byte(0x2E, true); byte(0x7A, false); stop();
    g.wait(40 * us);
    // nobody at 0x50
    start(); byte(0x50 << 1, false); stop();
    g.wait(30 * us);
    return { cap: g.capture(0, "Demo: I²C"), dec: [{ type: "i2c", ch: { scl: "D0", sda: "D1" }, opts: {} }] };
  }

  // ---------------------------------------------------------------- SPI
  function spi() {
    var g = new Gen(8e6, ["CSN", "SCK", "MOSI", "MISO"], [1, 0, 0, 0]), h = 0.5 * us;   // 1 MHz, mode 0
    function xfer(out, inp) {
      g.set(0, 0); g.wait(2 * us);
      out.forEach(function (b, k) {
        var r = inp[k] || 0;
        for (var i = 7; i >= 0; i--) {
          g.set(2, (b >> i) & 1); g.set(3, (r >> i) & 1); g.wait(h);
          g.set(1, 1); g.wait(h); g.set(1, 0);
        }
        g.wait(h);
      });
      g.wait(2 * us); g.set(0, 1); g.set(2, 0); g.set(3, 0); g.wait(10 * us);
    }
    g.wait(5 * us);
    // nRF24L01+: read CONFIG, write CONFIG, set the channel, send a payload
    xfer([0x00, 0xFF], [0x0E, 0x08]);
    xfer([0x20, 0x0E], [0x0E, 0x00]);
    xfer([0x25, 0x4C], [0x0E, 0x00]);
    xfer([0xA0].concat(bytes("Hello")), [0x0E, 0, 0, 0, 0, 0]);
    xfer([0xFF], [0x2E]);
    return { cap: g.capture(0, "Demo: SPI"), dec: [{ type: "spi", ch: { clk: "D1", mosi: "D2", miso: "D3", cs: "D0" }, opts: {} }] };
  }

  // ---------------------------------------------------------------- 1-Wire
  function crc8(list) {
    var c = 0;
    list.forEach(function (b) { for (var i = 0; i < 8; i++) { var mix = (c ^ b) & 1; c >>= 1; if (mix) c ^= 0x8C; b >>= 1; } });
    return c;
  }
  function onewire() {
    var g = new Gen(1e6, ["DQ"]);
    function reset() { g.set(0, 0); g.wait(480 * us); g.set(0, 1); g.wait(35 * us); g.set(0, 0); g.wait(120 * us); g.set(0, 1); g.wait(325 * us); }
    function wbyte(b) { for (var i = 0; i < 8; i++) { if ((b >> i) & 1) { g.set(0, 0); g.wait(6 * us); g.set(0, 1); g.wait(64 * us); } else { g.set(0, 0); g.wait(60 * us); g.set(0, 1); g.wait(10 * us); } } }
    function rbyte(b) { for (var i = 0; i < 8; i++) { g.set(0, 0); g.wait(6 * us); if ((b >> i) & 1) { g.set(0, 1); g.wait(64 * us); } else { g.wait(24 * us); g.set(0, 1); g.wait(40 * us); } } }
    var rom = [0x28, 0xFF, 0x64, 0x1E, 0x15, 0x21, 0x03];
    rom.push(crc8(rom));
    var pad = [0x91, 0x01, 0x4B, 0x46, 0x7F, 0xFF, 0x0F, 0x10];
    pad.push(crc8(pad));
    g.wait(100 * us);
    reset(); wbyte(0xCC); wbyte(0x44);
    g.wait(800 * us);
    reset(); wbyte(0x33); rom.forEach(rbyte);
    g.wait(200 * us);
    reset(); wbyte(0x55); rom.forEach(wbyte); wbyte(0xBE); pad.forEach(rbyte);
    g.wait(300 * us);
    return { cap: g.capture(0, "Demo: 1-Wire"), dec: [{ type: "onewire", ch: { owr: "D0" }, opts: {} }] };
  }

  // ---------------------------------------------------------------- WS2812
  function ws2812() {
    var g = new Gen(8e6, ["DIN"], [0]);
    function frame(colours) {
      colours.forEach(function (c) {
        var v = (c[1] << 16) | (c[0] << 8) | c[2];            // GRB
        for (var i = 23; i >= 0; i--) {
          var one = (v >> i) & 1;
          g.set(0, 1); g.wait(one ? 0.8 * us : 0.4 * us); g.set(0, 0); g.wait(one ? 0.45 * us : 0.85 * us);
        }
      });
      g.wait(80 * us);
    }
    function hsv(h) {
      var f = function (n) { var k = (n + h / 60) % 6; return Math.round(255 * (1 - Math.max(0, Math.min(k, 4 - k, 1)))); };
      return [f(5), f(3), f(1)];
    }
    g.wait(20 * us);
    var a = [], b = [];
    for (var i = 0; i < 8; i++) { a.push(hsv(i * 45)); b.push(hsv(i * 45 + 22)); }
    frame(a); frame(b);
    return { cap: g.capture(0, "Demo: WS2812"), dec: [{ type: "ws2812", ch: { din: "D0" }, opts: {} }] };
  }

  // ---------------------------------------------------------------- IR (NEC)
  function ir() {
    var g = new Gen(1e5, ["IR"]);
    function mark(t) { g.set(0, 0); g.wait(t * us); g.set(0, 1); }
    function nec(addr, cmd) {
      mark(9000); g.wait(4500 * us);
      var v = addr | ((~addr & 0xFF) << 8) | (cmd << 16) | ((~cmd & 0xFF) << 24);
      for (var i = 0; i < 32; i++) { mark(562); g.wait(((v >>> i) & 1 ? 1687 : 562) * us); }
      mark(562);
    }
    g.wait(5e-3);
    nec(0x00, 0x45);
    g.wait(40e-3);
    mark(9000); g.wait(2250 * us); mark(562);       // repeat
    g.wait(30e-3);
    nec(0x00, 0x46);
    g.wait(10e-3);
    return { cap: g.capture(0, "Demo: IR remote"), dec: [{ type: "ir", ch: { ir: "D0" }, opts: {} }] };
  }

  // ---------------------------------------------------------------- C64 serial bus
  function iec() {
    // lines are open collector: low wins. c[]/d[] hold what C64 and drive pull down.
    var g = new Gen(5e5, ["ATN", "CLK", "DATA"]), pull = { c64: { clk: 0, data: 0, atn: 0 }, drv: { clk: 0, data: 0 } };
    function upd() {
      g.set(0, pull.c64.atn ? 0 : 1);
      g.set(1, pull.c64.clk || pull.drv.clk ? 0 : 1);
      g.set(2, pull.c64.data || pull.drv.data ? 0 : 1);
    }
    function p(who, line, v) { pull[who][line] = v; upd(); }
    function sendByte(talker, listener, b, eoi) {
      p(talker, "clk", 0); g.wait(40 * us);                // ready to send
      p(listener, "data", 0); g.wait(eoi ? 250 * us : 40 * us);
      if (eoi) { p(listener, "data", 1); g.wait(60 * us); p(listener, "data", 0); g.wait(40 * us); }
      p(talker, "clk", 1); g.wait(20 * us);
      for (var i = 0; i < 8; i++) {
        p(talker, "data", (b >> i) & 1 ? 0 : 1); g.wait(20 * us);
        p(talker, "clk", 0); g.wait(40 * us);
        p(talker, "clk", 1); g.wait(20 * us);
      }
      p(talker, "data", 0); g.wait(30 * us);
      p(listener, "data", 1); g.wait(100 * us);            // frame handshake
    }
    function atnCmds(list) {
      p("c64", "atn", 1); p("c64", "clk", 1); p("c64", "data", 0); g.wait(100 * us);
      p("drv", "data", 1); g.wait(200 * us);
      list.forEach(function (b) { sendByte("c64", "drv", b, false); });
    }
    function atnOff() { g.wait(30 * us); p("c64", "atn", 0); g.wait(100 * us); }
    g.wait(200 * us);
    // LOAD"$",8: LISTEN 8, OPEN 0, the file name
    atnCmds([0x28, 0xF0]); atnOff();
    sendByte("c64", "drv", 0x24, true);
    atnCmds([0x3F]); atnOff();
    p("c64", "clk", 0); p("drv", "data", 0); g.wait(300 * us);
    // TALK 8, DATA 0, then the drive talks
    atnCmds([0x48, 0x60]); atnOff();
    p("c64", "data", 1); p("c64", "clk", 0); g.wait(80 * us);   // turnaround
    p("drv", "clk", 1); p("drv", "data", 0); g.wait(80 * us);
    var dir = [0x01, 0x04, 0x01, 0x01, 0x00, 0x00, 0x12, 0x22, 0x44, 0x45, 0x4D, 0x4F, 0x22];
    dir.forEach(function (b, k) { sendByte("drv", "c64", b, k === dir.length - 1); });
    p("drv", "clk", 0); p("c64", "data", 0); g.wait(200 * us);
    atnCmds([0x5F]); atnOff();
    p("c64", "clk", 0); p("drv", "data", 0); g.wait(300 * us);
    atnCmds([0x28, 0xE0, 0x3F]); atnOff();
    p("c64", "clk", 0); p("drv", "data", 0); g.wait(400 * us);
    return { cap: g.capture(0, "Demo: C64 serial bus"), dec: [{ type: "iec", ch: { atn: "D0", clk: "D1", data: "D2" }, opts: {} }] };
  }

  // ---------------------------------------------------------------- analog
  function analog() {
    var rate = 48000, n = 4800, a = new Float32Array(n), b = new Float32Array(n), seed = 1;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647 - 0.5; }
    for (var i = 0; i < n; i++) {
      var t = i / rate;
      a[i] = 0.7 * Math.sin(2 * Math.PI * 440 * t) + 0.15 * Math.sin(2 * Math.PI * 1320 * t);
    }
    // a smoother square: an RC curve between the levels
    var y = 0;
    for (i = 0; i < n; i++) { var target = (Math.floor(i / rate * 1000) % 2) ? -0.6 : 0.6; y += (target - y) * 0.25; b[i] = y + 0.04 * rnd(); }
    return { cap: new SA.Capture({ rate: rate, n: n, source: "Demo: analog", analog: [
      { id: "L", name: "Left", data: a, fixedMin: -1, fixedMax: 1 }, { id: "R", name: "Right", data: b, fixedMin: -1, fixedMax: 1 }] }), dec: [] };
  }

  SA.demos = [
    { id: "uart", name: "UART: a Bluetooth module answers", make: uart },
    { id: "i2c", name: "I²C: OLED display and INA219", make: i2c },
    { id: "spi", name: "SPI: nRF24L01+ radio", make: spi },
    { id: "onewire", name: "1-Wire: DS18B20 temperature sensor", make: onewire },
    { id: "ws2812", name: "WS2812: eight NeoPixels", make: ws2812 },
    { id: "ir", name: "IR remote control (NEC)", make: ir },
    { id: "iec", name: "C64 serial bus: LOAD\"$\",8", make: iec },
    { id: "analog", name: "Analog: tone and square wave", make: analog }
  ];
})(typeof window !== "undefined" ? window : globalThis);
