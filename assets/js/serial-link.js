/* ===================================================================
 * Serial link for the Web Serial API
 * -------------------------------------------------------------------
 * Buffers everything a serial port sends and offers pySerial-like
 * reads with timeouts. Shared by the apps that talk to USB adapters.
 * Global: SerialLink
 * =================================================================== */
(function (global) {
  "use strict";


  // Buffers everything the port sends and offers pySerial-like reads:
  // read(n) waits up to `timeout` ms and may return fewer bytes.
  class SerialLink {
    // options: extra settings for port.open(), e.g. { parity: "even" }
    constructor(port, baud, options) {
      this.port = port;
      this.baud = baud || 460800;
      this.options = options || {};
      this.chunks = [];
      this.length = 0;
      this.waiter = null;
      this.closed = false;
    }

    async open() {
      await this.port.open(Object.assign({ baudRate: this.baud, bufferSize: 1 << 20 }, this.options));
      // DTR and RTS on after opening, as pySerial does
      await this.setSignals({ dtr: true, rts: true });
      this.writer = this.port.writable.getWriter();
      this.reader = this.port.readable.getReader();
      this.loop = this.readLoop();
    }

    async readLoop() {
      try {
        for (;;) {
          const { value, done } = await this.reader.read();
          if (done) break;
          if (value && value.length) { this.chunks.push(value); this.length += value.length; this.wake(); }
        }
      } catch (err) {
        this.error = err;
      }
      this.closed = true;
      this.wake();
    }

    wake() { if (this.waiter) { const w = this.waiter; this.waiter = null; w(); } }

    // Wait until `n` bytes are buffered, the port closes or the deadline passes
    async waitFor(n, deadline) {
      while (this.length < n && !this.closed) {
        const left = deadline - performance.now();
        if (left <= 0) return;
        await new Promise((resolve) => {
          const t = setTimeout(resolve, left);
          this.waiter = () => { clearTimeout(t); resolve(); };
        });
      }
    }

    take(n) {
      n = Math.min(n, this.length);
      const out = new Uint8Array(n);
      let pos = 0;
      while (pos < n) {
        const c = this.chunks[0];
        const k = Math.min(c.length, n - pos);
        out.set(c.subarray(0, k), pos);
        pos += k;
        if (k === c.length) this.chunks.shift(); else this.chunks[0] = c.subarray(k);
      }
      this.length -= n;
      return out;
    }

    async read(n, timeout) {
      await this.waitFor(n, performance.now() + timeout);
      return this.take(n);
    }

    // Read up to and including "\n"; returns the line without line endings or null
    async readLine(timeout) {
      const deadline = performance.now() + timeout;
      const bytes = [];
      for (;;) {
        await this.waitFor(1, deadline);
        if (!this.length) return null;
        const b = this.take(1)[0];
        if (b === 0x0a) break;
        bytes.push(b);
      }
      return String.fromCharCode(...bytes).replace(/\r+$/, "");
    }

    async write(bytes) {
      if (this.closed) throw new Error("The adapter was disconnected.");
      await this.writer.write(bytes);
    }

    flushInput() { this.chunks = []; this.length = 0; }

    // Set control lines: { dtr, rts } (true = asserted, as in pySerial)
    async setSignals(sig) {
      const s = {};
      if (sig.dtr !== undefined) s.dataTerminalReady = !!sig.dtr;
      if (sig.rts !== undefined) s.requestToSend = !!sig.rts;
      try { await this.port.setSignals(s); return true; } catch (e) { return false; }   // not supported by every port
    }

    // Put bytes back in front of the buffer (read too far)
    unread(bytes) {
      if (!bytes.length) return;
      this.chunks.unshift(Uint8Array.from(bytes));
      this.length += bytes.length;
    }

    async close() {
      try { await this.reader.cancel(); } catch (e) { /* already closed */ }
      try { this.reader.releaseLock(); } catch (e) { /* ignore */ }
      try { await this.writer.close(); } catch (e) { /* ignore */ }
      try { this.writer.releaseLock(); } catch (e) { /* ignore */ }
      try { await this.port.close(); } catch (e) { /* ignore */ }
      this.closed = true;
    }
  }

  global.SerialLink = SerialLink;
})(typeof window !== "undefined" ? window : globalThis);
