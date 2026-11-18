/* Signal Analyzer: protocol decoders.
 *
 * Every decoder gets the signal (sample rate, edges and values of the digital channels),
 * the channels the user assigned and its options. It returns rows of annotations
 * {s, e, t, sh, k, col}: start and end sample, text, short text, kind (0 data, 1 control,
 * 2 error, 3 other data) and an optional colour swatch; plus the list for the results table
 * and log lines. */
(function (global) {
  "use strict";
  var SA = global.SA;
  var LIST = [];
  function def(d) { LIST.push(d); }

  function hex(v, n) { return "0x" + ("00000000" + (v >>> 0).toString(16).toUpperCase()).slice(-(n || 2)); }
  var FMT = { name: "Show as", type: "select", list: [["hex", "hex"], ["dec", "decimal"], ["bin", "binary"], ["ascii", "hex and text"]], def: "hex" };
  function fmtVal(v, f, bits) {
    bits = bits || 8;
    if (f === "dec") return String(v);
    if (f === "bin") return ("0".repeat(bits) + v.toString(2)).slice(-bits);
    var h = hex(v, Math.ceil(bits / 4));
    if (f === "ascii") return v >= 32 && v < 127 ? h + " '" + String.fromCharCode(v) + "'" : h;
    return h;
  }
  function shortVal(v, f, bits) {
    bits = bits || 8;
    if (f === "dec") return String(v);
    if (f === "bin") return ("0".repeat(bits) + v.toString(2)).slice(-bits);
    if (f === "ascii" && v >= 32 && v < 127) return "'" + String.fromCharCode(v) + "'";
    return ("00000000" + v.toString(16).toUpperCase()).slice(-Math.ceil(bits / 4));
  }
  function ann(s, e, t, sh, k, col) { return { s: Math.round(s), e: Math.max(Math.round(e), Math.round(s) + 1), t: t, sh: sh == null ? t : sh, k: k || 0, col: col }; }
  // merge the edges of several channels into one sorted list of [sample, which]
  function merge(lists) {
    var idx = lists.map(function () { return 0; }), out = [];
    for (;;) {
      var best = -1, bs = Infinity;
      for (var i = 0; i < lists.length; i++) if (lists[i] && idx[i] < lists[i].length && lists[i][idx[i]] < bs) { bs = lists[i][idx[i]]; best = i; }
      if (best < 0) break;
      out.push(bs, best); idx[best]++;
    }
    return out;
  }
  function within(x, ref, tol) { return Math.abs(x - ref) <= ref * (tol || 0.3); }

  // ================================================================ UART
  var BAUDS = [300, 600, 1200, 2400, 4800, 9600, 14400, 19200, 28800, 31250, 38400, 57600, 74880, 115200, 128000, 230400, 250000, 256000,
    460800, 500000, 921600, 1000000, 1500000, 2000000, 3000000];
  function autoBaud(e, rate) {
    var d = [];
    for (var i = 1; i < e.length && i < 4000; i++) if (e[i] - e[i - 1] >= 2) d.push(e[i] - e[i - 1]);
    if (!d.length) return 0;
    d.sort(function (a, b) { return a - b; });
    var m = d[Math.floor(d.length * 0.03)], sum = 0, c = 0;
    d.forEach(function (x) { if (x < m * 1.3) { sum += x; c++; } });
    var b = rate / (sum / c);
    for (var k = 0; k < BAUDS.length; k++) if (Math.abs(BAUDS[k] - b) <= BAUDS[k] * 0.05) return BAUDS[k];
    return Math.round(b);
  }
  function uartLine(sig, id, o, rows, r0, log, label, list) {
    var e = sig.edges(id), rate = sig.rate, inv = o.invert ? 1 : 0;
    var baud = o.baud === "auto" || !+o.baud ? autoBaud(e, rate) : +o.baud;
    if (!baud) { log.push(label + ": no data."); return; }
    if (o.baud === "auto" || !+o.baud) log.push(label + ": " + baud + " baud (detected).");
    var T = rate / baud;
    if (T < 3) log.push(label + ": the sample rate is too low for " + baud + " baud; use at least " + SA.fmtRate(baud * 4) + ".");
    var nb = +o.bits, par = o.parity === "none" ? 0 : 1, stop = parseFloat(o.stop), msb = o.order === "msb";
    var lv = function (s) { return sig.at(id, Math.round(s)) ^ inv; };
    var data = rows[r0], text = rows[r0 + 1], next = 0, run = null, errs = 0;
    function flush() {
      if (!run) return;
      text.push(ann(run.s, run.e, run.t, run.t, 3));
      list.push(ann(run.s, run.e, label + " “" + run.t + "”", null, 3));
      run = null;
    }
    for (var i = 0; i < e.length; i++) {
      var s = e[i];
      if (s < next) continue;
      if (lv(s) !== 0) continue;                      // only a change to the start bit level begins a frame
      if (lv(s + T / 2) !== 0) continue;              // too short: a glitch
      var v = 0, p = 0;
      for (var b = 0; b < nb; b++) {
        var bit = lv(s + (1.5 + b) * T);
        v |= bit << (msb ? nb - 1 - b : b); p ^= bit;
      }
      var perr = false;
      if (par) { var pb = lv(s + (1.5 + nb) * T); perr = o.parity === "even" ? (p ^ pb) !== 0 : (p ^ pb) !== 1; }
      var ferr = lv(s + (1.5 + nb + par) * T) !== 1;
      var end = s + (1 + nb + par + stop) * T;
      var err = perr ? "parity error" : ferr ? "framing error" : "";
      if (err) errs++;
      data.push(ann(s, end, fmtVal(v, o.fmt, nb) + (err ? " (" + err + ")" : ""), shortVal(v, o.fmt, nb), err ? 2 : 0));
      // printable characters make up the text row
      var ch = v === 10 ? "⏎" : v === 13 ? "" : v >= 32 && v < 127 ? String.fromCharCode(v) : v === 9 ? " " : "·";
      if (run && s - run.e > 20 * T) flush();
      if (!run) run = { s: s, e: end, t: "" };
      run.t += ch; run.e = end;
      if (v === 10 || run.t.length >= 200) flush();
      next = s + (1 + nb + par + 0.5) * T;
    }
    flush();
    if (errs) log.push(label + ": " + errs + " frame" + (errs > 1 ? "s" : "") + " with errors. Check baud rate and format.");
  }
  def({
    id: "uart", name: "UART", short: "UART", info: "Asynchronous serial data, e.g. Serial.print, a USB-to-serial converter or a GPS module.",
    ch: [{ id: "rx", name: "RX" }, { id: "tx", name: "TX", opt: true }],
    opts: [
      { id: "baud", name: "Baud rate", type: "combo", list: ["auto"].concat(BAUDS.map(String)), def: "auto" },
      { id: "bits", name: "Data bits", type: "select", list: [["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"]], def: "8" },
      { id: "parity", name: "Parity", type: "select", list: [["none", "none"], ["even", "even"], ["odd", "odd"]], def: "none" },
      { id: "stop", name: "Stop bits", type: "select", list: [["1", "1"], ["1.5", "1.5"], ["2", "2"]], def: "1" },
      { id: "order", name: "Bit order", type: "select", list: [["lsb", "LSB first"], ["msb", "MSB first"]], def: "lsb" },
      { id: "invert", name: "Inverted (idle low)", type: "check", def: false },
      FMT
    ],
    rows: ["RX", "RX text", "TX", "TX text"],
    run: function (sig, ch, o) {
      var rows = [[], [], [], []], log = [], list = [];
      if (ch.rx) uartLine(sig, ch.rx, o, rows, 0, log, "RX", list);
      if (ch.tx) uartLine(sig, ch.tx, o, rows, 2, log, "TX", list);
      list.sort(function (a, b) { return a.s - b.s; });
      return { rows: rows, list: list, log: log };
    }
  });

  // ================================================================ I2C
  def({
    id: "i2c", name: "I²C", short: "I²C", info: "Two-wire bus for sensors, displays (SSD1306 OLED), EEPROMs and the INA219.",
    ch: [{ id: "scl", name: "SCL" }, { id: "sda", name: "SDA" }],
    opts: [{ id: "addr", name: "Address shown as", type: "select", list: [["7", "7 bit (0x3C)"], ["8", "8 bit (0x78)"]], def: "7" }, FMT],
    rows: ["Bytes", "Transfers"],
    run: function (sig, ch, o) {
      var rows = [[], []], log = [], list = [];
      var ev = merge([sig.edges(ch.scl), sig.edges(ch.sda)]);
      var inFrame = false, bits = 0, val = 0, first = 0, isAddr = false, rw = 0, tStart = 0, tText = "", tBytes = [], lastFall = 0, nacks = 0;
      function endTransfer(s) {
        if (!tText) return;
        var t = tText + (tBytes.length ? ": " + tBytes.join(" ") : "");
        var a = ann(tStart, s, t.length > 120 ? t.slice(0, 118) + " …" : t, tText, 3);
        rows[1].push(a); list.push(a);
        tText = ""; tBytes = [];
      }
      for (var i = 0; i < ev.length; i += 2) {
        var s = ev[i], which = ev[i + 1];
        if (which === 1) {                                     // SDA changes
          var sclHigh = sig.at(ch.scl, s) && sig.at(ch.scl, s - 1);
          if (!sclHigh) continue;
          if (sig.at(ch.sda, s) === 0) {                       // start
            if (inFrame) endTransfer(s);
            rows[0].push(ann(s, s + Math.max(2, (s - lastFall) || 2), inFrame ? "Repeated start" : "Start", inFrame ? "Sr" : "S", 1));
            inFrame = true; bits = 0; val = 0; isAddr = true; tStart = s;
          } else if (inFrame) {                                // stop
            rows[0].push(ann(s, s + Math.max(2, s - lastFall), "Stop", "P", 1));
            endTransfer(s);
            inFrame = false;
          }
        } else {                                               // SCL changes
          var up = sig.at(ch.scl, s);
          if (!up) { lastFall = s; continue; }
          if (!inFrame) continue;
          var bit = sig.at(ch.sda, s);
          if (bits < 8) {
            if (!bits) first = lastFall || s;
            val = (val << 1) | bit; bits++;
          } else {
            var ack = bit === 0, half = (s - first) / 18, end = s + half, txt, sh;
            if (isAddr) {
              rw = val & 1;
              var ad = o.addr === "8" ? val & 0xFE : val >> 1;
              txt = (rw ? "Read " : "Write ") + hex(ad) + (ack ? "" : " NACK");
              sh = (rw ? "R " : "W ") + hex(ad);
              tText = (rw ? "Read " : "Write ") + hex(ad);
              rows[0].push(ann(first, end, txt, sh, ack ? 1 : 2));
              isAddr = false;
            } else {
              txt = fmtVal(val, o.fmt) + (ack ? "" : " NACK");
              rows[0].push(ann(first, end, txt, shortVal(val, o.fmt), rw ? 3 : 0));
              tBytes.push(shortVal(val, o.fmt === "ascii" ? "hex" : o.fmt));
            }
            if (!ack) nacks++;
            bits = 0; val = 0;
          }
        }
      }
      if (inFrame) endTransfer(sig.n - 1);
      if (nacks) log.push(nacks + " byte" + (nacks > 1 ? "s" : "") + " without ACK (normal for the last byte of a read).");
      return { rows: rows, list: list, log: log };
    }
  });

  // ================================================================ SPI
  def({
    id: "spi", name: "SPI", short: "SPI", info: "Serial bus with clock, MOSI, MISO and chip select: nRF24L01+, SD cards, flash memory, displays.",
    ch: [{ id: "clk", name: "CLK" }, { id: "mosi", name: "MOSI", opt: true }, { id: "miso", name: "MISO", opt: true }, { id: "cs", name: "CS", opt: true }],
    opts: [
      { id: "mode", name: "Mode", type: "select", list: [["0", "0 (CPOL 0, CPHA 0)"], ["1", "1 (CPOL 0, CPHA 1)"], ["2", "2 (CPOL 1, CPHA 0)"], ["3", "3 (CPOL 1, CPHA 1)"]], def: "0" },
      { id: "order", name: "Bit order", type: "select", list: [["msb", "MSB first"], ["lsb", "LSB first"]], def: "msb" },
      { id: "bits", name: "Word size", type: "select", list: [["8", "8 bits"], ["16", "16 bits"], ["24", "24 bits"], ["32", "32 bits"], ["4", "4 bits"], ["9", "9 bits"], ["12", "12 bits"]], def: "8" },
      { id: "cspol", name: "CS active", type: "select", list: [["low", "low"], ["high", "high"]], def: "low" },
      FMT
    ],
    rows: ["MOSI", "MISO", "Transfers"],
    run: function (sig, ch, o) {
      var rows = [[], [], []], log = [], list = [];
      var mode = +o.mode, sampleRise = ((mode >> 1) ^ (mode & 1)) === 0, nb = +o.bits, msb = o.order === "msb";
      var csAct = o.cspol === "high" ? 1 : 0;
      var ev = merge([sig.edges(ch.clk), ch.cs ? sig.edges(ch.cs) : null]);
      var active = !ch.cs || sig.at(ch.cs, 0) === csAct, bits = 0, mo = 0, mi = 0, ws = 0, last = -1, per = 0, tS = 0, tMo = [], tMi = [];
      if (active) tS = 0;
      function closeTransfer(s) {
        if (!tMo.length && !tMi.length) return;
        var t = (ch.mosi ? "MOSI " + tMo.join(" ") : "") + (ch.mosi && ch.miso ? " · " : "") + (ch.miso ? "MISO " + tMi.join(" ") : "");
        var a = ann(tS, s, t.length > 140 ? t.slice(0, 138) + " …" : t, (tMo[0] || tMi[0] || ""), 3);
        rows[2].push(a); list.push(a);
        tMo = []; tMi = [];
      }
      for (var i = 0; i < ev.length; i += 2) {
        var s = ev[i], which = ev[i + 1];
        if (which === 1) {
          var now = sig.at(ch.cs, s) === csAct;
          if (now && !active) { tS = s; bits = 0; mo = mi = 0; }
          if (!now && active) { if (bits) rows[0].push(ann(ws, s, "incomplete word (" + bits + " bits)", "?", 2)); closeTransfer(s); bits = 0; }
          active = now;
          continue;
        }
        if (!active) continue;
        if ((sig.at(ch.clk, s) === 1) !== sampleRise) continue;
        // without CS a long pause starts a new word
        if (!ch.cs && bits && per && s - last > 8 * per) bits = 0;
        if (last >= 0 && s - last < per * 4 || !per) per = last >= 0 ? s - last : 0;
        if (!ch.cs && !bits && last >= 0 && s - last > 8 * (per || 1)) { closeTransfer(last); tS = s; }
        if (!bits) { ws = s; mo = mi = 0; }
        var bmo = ch.mosi ? sig.at(ch.mosi, s) : 0, bmi = ch.miso ? sig.at(ch.miso, s) : 0, pos = msb ? nb - 1 - bits : bits;
        mo |= bmo << pos; mi |= bmi << pos;
        bits++; last = s;
        if (bits === nb) {
          var p = nb > 1 ? (s - ws) / (nb - 1) : per || 2, a = ws - p / 2, b = s + p / 2;
          if (ch.mosi) { rows[0].push(ann(a, b, fmtVal(mo >>> 0, o.fmt, nb), shortVal(mo >>> 0, o.fmt, nb), 0)); tMo.push(shortVal(mo >>> 0, o.fmt === "ascii" ? "hex" : o.fmt, nb)); }
          if (ch.miso) { rows[1].push(ann(a, b, fmtVal(mi >>> 0, o.fmt, nb), shortVal(mi >>> 0, o.fmt, nb), 3)); tMi.push(shortVal(mi >>> 0, o.fmt === "ascii" ? "hex" : o.fmt, nb)); }
          bits = 0;
        }
      }
      closeTransfer(last >= 0 ? last + per : sig.n - 1);
      if (!ch.mosi && !ch.miso) log.push("Assign MOSI and/or MISO.");
      return { rows: rows, list: list, log: log };
    }
  });

  // ================================================================ 1-Wire
  var OW_ROM = { 0x33: "Read ROM", 0x55: "Match ROM", 0xCC: "Skip ROM", 0xF0: "Search ROM", 0xEC: "Alarm search", 0x3C: "Overdrive skip ROM", 0x69: "Overdrive match ROM", 0xA5: "Resume" };
  var OW_FN = { 0x44: "Convert T", 0xBE: "Read scratchpad", 0x4E: "Write scratchpad", 0x48: "Copy scratchpad", 0xB8: "Recall EEPROM", 0xB4: "Read power supply",
    0xF0: "Read memory", 0x0F: "Write scratchpad", 0xAA: "Read scratchpad", 0x55: "Copy scratchpad", 0xA5: "Read data/generate CRC" };
  def({
    id: "onewire", name: "1-Wire", short: "1-Wire", info: "One-wire bus: DS18B20 temperature sensors, iButtons and EEPROMs. Use 1 MS/s or more.",
    ch: [{ id: "owr", name: "DQ" }],
    opts: [],
    rows: ["Bits and bytes", "Commands"],
    run: function (sig, ch) {
      var rows = [[], []], log = [], list = [], us = sig.rate / 1e6, e = sig.edges(ch.owr), id = ch.owr;
      if (sig.rate < 2e5) log.push("The sample rate is low for 1-Wire; use 1 MS/s or more.");
      var state = "idle", bits = 0, val = 0, bStart = 0, nbytes = 0, rom = [], trip = [], tripN = 0, fn = -1, data = [], dStart = 0;
      function cmd(s, en, t, k) { var a = ann(s, en, t, t, k == null ? 1 : k); rows[1].push(a); list.push(a); }
      function romText(b) { var t = "0x"; for (var j = b.length - 1; j >= 0; j--) t += ("0" + b[j].toString(16)).slice(-2); return t; }
      function flushData(s) {
        if (data.length) { cmd(dStart, s, "Data: " + data.map(function (x) { return ("0" + x.toString(16).toUpperCase()).slice(-2); }).join(" "), 3); data = []; }
      }
      for (var i = 0; i < e.length; i++) {
        var s = e[i];
        if (sig.at(id, s) !== 0) continue;
        var rise = i + 1 < e.length ? e[i + 1] : sig.n, low = (rise - s) / us;
        if (low >= 380) {                                      // reset pulse
          flushData(s);
          rows[0].push(ann(s, rise, "Reset", "R", 1));
          var f = i + 2 < e.length ? e[i + 2] : -1, pres = false;
          if (f >= 0 && (f - rise) / us < 120) {
            var r2 = i + 3 < e.length ? e[i + 3] : sig.n, pl = (r2 - f) / us;
            if (pl >= 30 && pl <= 400) { rows[0].push(ann(f, r2, "Presence", "P", 1)); pres = true; i += 2; }
          }
          if (!pres) rows[0].push(ann(rise, rise + 60 * us, "No presence", "–", 2));
          state = "rom"; bits = 0; val = 0; nbytes = 0; rom = []; fn = -1;
          continue;
        }
        if (state === "idle") continue;
        var bit = sig.at(id, s + Math.round(15 * us));
        if (state === "search") {
          if (!trip.length) trip.s = s;
          trip.push(bit);
          if (trip.length === 3) {
            if (tripN % 8 === 0) bStart = trip.s;
            val |= trip[2] << (tripN % 8);
            tripN++;
            if (tripN % 8 === 0) { rows[0].push(ann(bStart, rise + 30 * us, "ROM byte " + hex(val), hex(val), 0)); rom.push(val); val = 0; }
            trip = [];
            if (tripN === 64) { cmd(dStart, rise, "ROM " + romText(rom), 3); state = "func"; bits = 0; val = 0; }
          }
          continue;
        }
        if (!bits) bStart = s;
        val |= bit << bits; bits++;
        if (bits < 8) continue;
        var b = val, end = rise + 45 * us;
        rows[0].push(ann(bStart, end, hex(b), hex(b), state === "rom" ? 1 : 0));
        bits = 0; val = 0;
        if (state === "rom") {
          cmd(bStart, end, OW_ROM[b] || "ROM command " + hex(b), OW_ROM[b] ? 1 : 2);
          if (b === 0xF0 || b === 0xEC) { state = "search"; tripN = 0; trip = []; rom = []; dStart = end; }
          else if (b === 0x33 || b === 0x55 || b === 0x69) { state = "romcode"; rom = []; dStart = end; }
          else state = "func";
        } else if (state === "romcode") {
          rom.push(b);
          if (rom.length === 8) { cmd(dStart, end, "ROM " + romText(rom), 3); state = "func"; }
        } else if (state === "func") {
          if (fn < 0) { fn = b; cmd(bStart, end, OW_FN[b] || "Function " + hex(b)); dStart = end; }
          else { if (!data.length) dStart = bStart; data.push(b); }
        }
      }
      flushData(sig.n - 1);
      return { rows: rows, list: list, log: log };
    }
  });

  // ================================================================ WS2812
  def({
    id: "ws2812", name: "WS2812 (NeoPixel)", short: "WS2812", info: "Addressable RGB LEDs: WS2812B, SK6812, WS2811. Use 4 MS/s or more.",
    ch: [{ id: "din", name: "DIN" }],
    opts: [{ id: "order", name: "Colour order", type: "select", list: [["GRB", "GRB (WS2812B)"], ["RGB", "RGB (WS2811)"], ["GRBW", "GRBW (SK6812 RGBW)"], ["RGBW", "RGBW"]], def: "GRB" }],
    rows: ["LEDs", "Frames"],
    run: function (sig, ch, o) {
      var rows = [[], []], log = [], list = [], us = sig.rate / 1e6, e = sig.edges(ch.din), id = ch.din;
      var nb = o.order.length * 8, bits = 0, val = 0, ls = 0, led = 0, fStart = -1, lastFall = 0, short = 0;
      if (sig.rate < 3.9e6) log.push("WS2812 needs 4 MS/s or more to tell 0 and 1 bits apart.");
      function endFrame(s) {
        if (fStart >= 0 && led) { var a = ann(fStart, s, led + " LED" + (led > 1 ? "s" : ""), String(led), 1); rows[1].push(a); }
        fStart = -1;
      }
      for (var i = 0; i < e.length; i++) {
        var s = e[i];
        if (sig.at(id, s) !== 1) { lastFall = s; continue; }
        if (lastFall && (s - lastFall) / us > 50) {
          endFrame(lastFall);
          rows[1].push(ann(lastFall, s, "Reset", "R", 0));
          led = 0; bits = 0; val = 0;
        }
        var fall = i + 1 < e.length ? e[i + 1] : sig.n, high = (fall - s) / us;
        if (high > 5) continue;
        if (!bits) ls = s;
        if (fStart < 0) fStart = s;
        val = (val * 2) + (high > 0.6 ? 1 : 0); bits++;
        if (bits === nb) {
          var c = {}, k;
          for (k = 0; k < o.order.length; k++) c[o.order[k]] = Math.floor(val / Math.pow(2, 8 * (o.order.length - 1 - k))) % 256;
          var rgb = "#" + [c.R, c.G, c.B].map(function (x) { return ("0" + x.toString(16).toUpperCase()).slice(-2); }).join("");
          var t = "LED " + (led + 1) + " " + rgb + (c.W != null ? " W" + c.W : "");
          var a = ann(ls, fall + 0.45 * us, t, String(led + 1), 0, rgb);
          rows[0].push(a); list.push(a);
          led++; bits = 0; val = 0;
          if (high < 0.15 && sig.rate > 4e6) short++;
        }
      }
      endFrame(lastFall);
      void short;
      return { rows: rows, list: list, log: log };
    }
  });

  // ================================================================ IR remote controls
  function irPulses(sig, id, activeLow) {
    var e = sig.edges(id), us = sig.rate / 1e6, out = [];   // [start, end] of marks in µs-free samples
    var on = activeLow ? 0 : 1, start = -1;
    if (sig.at(id, 0) === on) start = 0;
    for (var i = 0; i < e.length; i++) {
      var v = sig.at(id, e[i]);
      if (v === on && start < 0) start = e[i];
      else if (v !== on && start >= 0) { out.push([start, e[i]]); start = -1; }
    }
    if (start >= 0) out.push([start, sig.n]);
    // a raw carrier (36-40 kHz) becomes one mark: join marks with short gaps
    var m = [];
    for (var k = 0; k < out.length; k++) {
      if (m.length && (out[k][0] - m[m.length - 1][1]) / us < 150) m[m.length - 1][1] = out[k][1];
      else m.push([out[k][0], out[k][1]]);
    }
    return m;
  }
  function decodeNecLike(fr, us, lead, name) {
    // fr: marks [s, e]; spaces between them
    var m0 = (fr[0][1] - fr[0][0]) / us;
    if (!within(m0, lead[0], 0.3)) return null;
    if (fr.length < 2) return null;
    var s0 = (fr[1][0] - fr[0][1]) / us;
    if (name === "NEC" && within(s0, 2250, 0.3) && fr.length >= 2) return { proto: "NEC", repeat: true, bits: [], s: fr[0][0], e: fr[1][1] };
    if (!within(s0, lead[1], 0.3) || fr.length < 33) return null;
    var bits = [], v = [0, 0, 0, 0];
    for (var i = 1; i <= 32; i++) {
      var sp = ((i + 1 < fr.length ? fr[i + 1][0] : fr[i][1] + 2000 * us) - fr[i][1]) / us, b = sp > 1125 ? 1 : 0;
      bits.push([fr[i][0], i + 1 < fr.length ? fr[i + 1][0] : fr[i][1], b]);
      v[(i - 1) >> 3] |= b << ((i - 1) & 7);
    }
    return { proto: name, bytes: v, bits: bits, s: fr[0][0], e: fr[Math.min(33, fr.length - 1)][1], lead: [fr[0][0], fr[1][0]] };
  }
  function decodeSirc(fr, us) {
    if (!within((fr[0][1] - fr[0][0]) / us, 2400, 0.25)) return null;
    var bits = [], v = 0;
    for (var i = 1; i < fr.length && bits.length < 20; i++) {
      var w = (fr[i][1] - fr[i][0]) / us;
      var b = within(w, 1200, 0.35) ? 1 : within(w, 600, 0.45) ? 0 : -1;
      if (b < 0) return null;
      v |= b << bits.length;
      bits.push([fr[i][0], fr[i][1] + 600 * us, b]);
    }
    if ([12, 15, 20].indexOf(bits.length) < 0) return null;
    return { proto: "SIRC", n: bits.length, value: v, bits: bits, s: fr[0][0], e: fr[fr.length - 1][1], lead: [fr[0][0], fr[1][0]] };
  }
  function decodeRc5(fr, us) {
    var T = 889, half = [0];        // the first half of the first start bit is a space
    for (var i = 0; i < fr.length; i++) {
      var mk = (fr[i][1] - fr[i][0]) / us, n = within(mk, T, 0.35) ? 1 : within(mk, 2 * T, 0.3) ? 2 : 0;
      if (!n) return null;
      for (var k = 0; k < n; k++) half.push(1);
      if (i + 1 < fr.length) {
        var sp = (fr[i + 1][0] - fr[i][1]) / us, m = within(sp, T, 0.35) ? 1 : within(sp, 2 * T, 0.3) ? 2 : 0;
        if (!m) return null;
        for (k = 0; k < m; k++) half.push(0);
      }
    }
    if (half.length % 2) half.push(0);
    if (half.length !== 28) return null;
    var bits = [], t0 = fr[0][0] - T * us;
    for (var j = 0; j < 28; j += 2) {
      if (half[j] === half[j + 1]) return null;
      bits.push([t0 + j * T * us, t0 + (j + 2) * T * us, half[j + 1]]);
    }
    var b = bits.map(function (x) { return x[2]; }), val = function (a, n) { var v = 0; for (var q = a; q < a + n; q++) v = v * 2 + b[q]; return v; };
    return { proto: "RC-5", toggle: b[2], addr: val(3, 5), cmd: val(8, 6) + (b[1] ? 0 : 64), bits: bits, s: t0, e: fr[fr.length - 1][1] };
  }
  def({
    id: "ir", name: "IR remote control", short: "IR", info: "Infrared remote controls after an IR receiver (TSOP, VS1838) or with the raw 38 kHz carrier: NEC, Samsung, Sony SIRC, Philips RC-5.",
    ch: [{ id: "ir", name: "IR" }],
    opts: [
      { id: "proto", name: "Protocol", type: "select", list: [["auto", "automatic"], ["NEC", "NEC"], ["Samsung", "Samsung"], ["SIRC", "Sony SIRC"], ["RC-5", "Philips RC-5"]], def: "auto" },
      { id: "pol", name: "Signal", type: "select", list: [["low", "active low (IR receiver)"], ["high", "active high"]], def: "low" }
    ],
    rows: ["Bits", "Frames"],
    run: function (sig, ch, o) {
      var rows = [[], []], log = [], list = [], us = sig.rate / 1e6;
      if (sig.rate < 2e4) log.push("The sample rate is low for IR signals; use 50 kS/s or more.");
      var marks = irPulses(sig, ch.ir, o.pol === "low"), frames = [], cur = [];
      marks.forEach(function (m) {
        if (cur.length && (m[0] - cur[cur.length - 1][1]) / us > 8000) { frames.push(cur); cur = []; }
        cur.push(m);
      });
      if (cur.length) frames.push(cur);
      var unknown = 0, p = o.proto;
      frames.forEach(function (fr) {
        var r = null;
        if (p === "auto" || p === "NEC") r = decodeNecLike(fr, us, [9000, 4500], "NEC");
        if (!r && (p === "auto" || p === "Samsung")) r = decodeNecLike(fr, us, [4500, 4500], "Samsung");
        if (!r && (p === "auto" || p === "SIRC")) r = decodeSirc(fr, us);
        if (!r && (p === "auto" || p === "RC-5")) r = decodeRc5(fr, us);
        var a;
        if (!r) {
          unknown++;
          a = ann(fr[0][0], fr[fr.length - 1][1], "Unknown frame (" + fr.length + " pulses)", "?", 2);
          rows[1].push(a); list.push(a);
          return;
        }
        if (r.lead) rows[0].push(ann(r.lead[0], r.lead[1], "Start", "S", 1));
        r.bits.forEach(function (b) { rows[0].push(ann(b[0], b[1], String(b[2]), String(b[2]), 0)); });
        var t;
        if (r.repeat) t = "NEC repeat";
        else if (r.proto === "NEC" || r.proto === "Samsung") {
          var B = r.bytes, ad = (B[0] ^ B[1]) === 0xFF || r.proto === "Samsung" ? hex(B[0]) : hex(B[0] | (B[1] << 8), 4);
          t = r.proto + " address " + ad + " command " + hex(B[2]) + ((B[2] ^ B[3]) === 0xFF ? "" : " (check byte wrong)");
        } else if (r.proto === "SIRC") {
          var cmdv = r.value & 0x7F, adv = r.value >> 7;
          t = "SIRC-" + r.n + " address " + (r.n === 20 ? (adv & 0x1F) + " extended " + (adv >> 5) : adv) + " command " + cmdv;
        } else t = "RC-5 address " + r.addr + " command " + r.cmd + " toggle " + r.toggle;
        a = ann(r.s, r.e, t, r.proto, r.repeat ? 0 : 3);
        rows[1].push(a); list.push(a);
      });
      if (unknown) log.push(unknown + " frame" + (unknown > 1 ? "s" : "") + " not recognised. Try the other signal polarity or another protocol.");
      if (!frames.length) log.push("No IR signal found.");
      return { rows: rows, list: list, log: log };
    }
  });

  // ================================================================ C64 serial bus (IEC)
  function iecCommand(b) {
    if (b === 0x3F) return "UNLISTEN";
    if (b === 0x5F) return "UNTALK";
    if (b >= 0x20 && b < 0x3F) return "LISTEN " + (b & 0x1F);
    if (b >= 0x40 && b < 0x5F) return "TALK " + (b & 0x1F);
    if ((b & 0xF0) === 0x60) return "DATA " + (b & 0x0F);
    if ((b & 0xF0) === 0xE0) return "CLOSE " + (b & 0x0F);
    if ((b & 0xF0) === 0xF0) return "OPEN " + (b & 0x0F);
    return "command " + hex(b);
  }
  function petsciiChar(b) {
    if (b >= 0x41 && b <= 0x5A) return String.fromCharCode(b);
    if (b >= 0xC1 && b <= 0xDA) return String.fromCharCode(b - 0x80 + 0x20);
    if (b >= 0x20 && b < 0x41 || b === 0x5B || b === 0x5D) return String.fromCharCode(b);
    if (b === 0x0D) return "⏎";
    return "·";
  }
  def({
    id: "iec", name: "C64 serial bus (IEC)", short: "IEC", info: "The serial bus between a C64 and its 1541 floppy drive: ATN, CLK and DATA. Standard KERNAL protocol, no fast loaders.",
    ch: [{ id: "atn", name: "ATN" }, { id: "clk", name: "CLK" }, { id: "data", name: "DATA" }],
    opts: [],
    rows: ["Bytes", "Commands and data"],
    run: function (sig, ch) {
      var rows = [[], []], log = [], list = [], us = sig.rate / 1e6;
      if (sig.rate < 1e5) log.push("The sample rate is low for the serial bus; use 200 kS/s or more.");
      var ev = merge([sig.edges(ch.atn), sig.edges(ch.clk), sig.edges(ch.data)]);
      var state = "wait", bits = 0, val = 0, bStart = 0, dataReady = false, eoi = false, atn = sig.at(ch.atn, 0) === 0, lastRise = 0;
      var run = null, cmdStart = 0;
      function flush() {
        if (!run) return;
        var t = run.t.length > 100 ? run.t.slice(0, 98) + " …" : run.t;
        var a = ann(run.s, run.e, "Data “" + t + "” (" + run.n + " byte" + (run.n > 1 ? "s" : "") + ")", run.t, 3);
        rows[1].push(a); list.push(a);
        run = null;
      }
      for (var i = 0; i < ev.length; i += 2) {
        var s = ev[i], w = ev[i + 1];
        if (w === 0) {                                     // ATN
          atn = sig.at(ch.atn, s) === 0;
          if (atn) { flush(); cmdStart = s; }
          state = "wait"; bits = 0;
          continue;
        }
        var clkHigh = sig.at(ch.clk, s) === 1, dataHigh = sig.at(ch.data, s) === 1;
        if (w === 1) {                                     // CLK
          if (state === "bits" && clkHigh) {
            if (bits && (s - lastRise) / us > 2000) { state = "wait"; bits = 0; }
            else {
              val |= (dataHigh ? 1 : 0) << bits; bits++; lastRise = s;
              if (bits === 8) {
                var end = s + 60 * us;
                if (atn) {
                  var c = iecCommand(val);
                  rows[0].push(ann(bStart, end, hex(val) + " " + c, c, 1));
                  var a = ann(bStart, end, c, c, 1); rows[1].push(a); list.push(a);
                } else {
                  rows[0].push(ann(bStart, end, hex(val) + " " + petsciiChar(val) + (eoi ? " EOI" : ""), shortVal(val, "hex"), eoi ? 3 : 0));
                  if (!run) run = { s: bStart, e: end, t: "", n: 0 };
                  run.t += petsciiChar(val); run.e = end; run.n++;
                  if (eoi) flush();
                }
                state = "wait"; bits = 0;
              }
            }
          } else if (state === "wait" && clkHigh) { state = "rts"; dataReady = dataHigh; eoi = false; }
          else if (state === "rts" && !clkHigh) {
            if (dataHigh) { state = "bits"; bits = 0; val = 0; bStart = s; lastRise = s; }
            else state = "wait";
          }
        } else if (state === "rts" && clkHigh) {           // DATA while the talker is ready to send
          if (dataHigh) dataReady = true;
          else if (dataReady) eoi = true;
        }
      }
      flush();
      if (!rows[0].length) log.push("No bytes found. Check that ATN, CLK and DATA are assigned correctly.");
      void cmdStart;
      return { rows: rows, list: list, log: log };
    }
  });

  SA.decoders = LIST;
  SA.decoderById = function (id) { for (var i = 0; i < LIST.length; i++) if (LIST[i].id === id) return LIST[i]; return null; };
  SA.decoderDefaults = function (d) { var o = {}; d.opts.forEach(function (x) { o[x.id] = x.def; }); return o; };
})(typeof window !== "undefined" ? window : globalThis);
