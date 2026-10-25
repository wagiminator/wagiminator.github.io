/* ===================================================================
 * Datasette adapters: TapeBuddy64, TapeDump64, DumpMaster64
 * -------------------------------------------------------------------
 * JavaScript port of the tape scripts in
 * github.com/wagiminator/C64-Collection (tape-read.py, tape-write.py,
 * tapedump.py), using SerialLink from /assets/js/serial-link.js.
 *   TapeBuddy64:  commands 'r'/'w', pulses as 16-bit values
 *   DumpMaster64: commands 'R'/'W' followed by a length byte (0),
 *                 pulses as 16-bit values
 *   TapeDump64:   command 'r', read only, pulses as 8-bit values
 * Pulse lengths are TAP values (8 µs each); the app works in cycles
 * (TAP value * 8).
 * =================================================================== */
(function (global) {
  "use strict";

  const USB_FILTERS = [{ usbVendorId: 0x1a86, usbProductId: 0x7523 }];   // CH340
  const ADAPTERS = ["TapeBuddy64", "TapeDump64", "DumpMaster64"];
  const MAX_CHUNK = 32640;           // longest pulse the adapters can write in one value

  class TapeError extends Error {}

  class TapeAdapter {
    constructor(link, kind) {
      this.link = link;
      this.kind = kind;
    }

    get canWrite() { return this.kind !== "TapeDump64"; }
    get wide() { return this.kind !== "TapeDump64"; }      // 16-bit pulse values

    async command(ch) {
      const c = ch.charCodeAt(0);
      // DumpMaster64 expects a length byte after every command
      await this.link.write(new Uint8Array(this.kind === "DumpMaster64" ? [c, 0] : [c]));
    }

    async version() {
      await this.command("v");
      return this.link.readLine(1000);
    }

    // Wait for the answer to PLAY/RECORD; the adapter gives up after 10 s
    async waitForButton(onWaiting) {
      const until = performance.now() + 15000;
      while (performance.now() < until) {
        const r = await this.link.read(1, 500);
        if (r.length) {
          if (r[0] !== 0) throw new TapeError("timeout");
          return;
        }
        if (onWaiting) onWaiting(Math.max(0, Math.ceil((until - 5000 - performance.now()) / 1000)));
      }
      throw new TapeError("noanswer");
    }

    /* --- reading from tape --- */

    // Reads until the adapter reports the end (STOP pressed, end of
    // tape or 25 s without pulses). onPulses(cyclesArray) is called with
    // new pulses as they arrive.
    async read({ onPlay, onPulses, onWaiting }) {
      this.link.flushInput();
      await this.command(this.kind === "DumpMaster64" ? "R" : "r");
      await this.waitForButton(onWaiting);
      if (onPlay) onPlay();

      let checksum = 0, started = !this.wide, done = false, odd = null;
      while (!done) {
        const avail = Math.max(1, Math.min(this.link.length, 8192));
        const chunk = await this.link.read(avail, 1000);
        if (!chunk.length) {
          if (this.link.closed) throw new TapeError("disconnected");
          continue;                                   // waiting for pulses
        }
        const pulses = [];
        let i = 0;
        if (this.wide) {
          // 16-bit little endian values; a chunk may end in the middle of one
          let bytes = chunk;
          if (odd !== null) { bytes = new Uint8Array(chunk.length + 1); bytes[0] = odd; bytes.set(chunk, 1); odd = null; }
          for (; i + 1 < bytes.length; i += 2) {
            const v = bytes[i] | (bytes[i + 1] << 8);
            checksum = (checksum + bytes[i] + bytes[i + 1]) & 0xffff;
            if (v === 0) { done = true; i += 2; break; }
            // leading noise is skipped until the first pulse that looks like data
            if (!started && v > 32 && v < 64) started = true;
            if (started) pulses.push(v * 8);
          }
          if (!done && i < bytes.length) odd = bytes[i];
          else if (done && i < bytes.length) this.link.unread(bytes.subarray(i));
        } else {
          for (; i < chunk.length; i++) {
            const v = chunk[i];
            if (v === 0) { done = true; i++; break; }
            checksum = (checksum + v) & 0xffff;
            pulses.push(v === 255 ? 20000 : v * 8);    // 255 = pause (TAP version 0 "00")
          }
          if (i < chunk.length) this.link.unread(chunk.subarray(i));
        }
        if (pulses.length && onPulses) onPulses(pulses);
      }
      const tail = await this.link.read(3, 3000);
      if (tail.length < 3) throw new TapeError("noend");
      const testsum = tail[0] | (tail[1] << 8);
      return { checksumOk: testsum === checksum, overflow: tail[2] !== 0 };
    }

    /* --- writing to tape --- */

    // Pulses (cycles) -> 16-bit values for the adapter, and for each
    // value the index of its pulse (for showing the position)
    static values(pulses) {
      const vals = [], at = [];
      pulses.forEach((c, i) => {
        const u = Math.round(c / 8);
        if (u >= 1 && u <= 0xff) { vals.push(u); at.push(i); return; }
        let d = Math.max(1, Math.floor(c / 8));
        while (d > 0) {
          let part = d % MAX_CHUNK;
          if (part === 0) part = MAX_CHUNK;
          vals.push(part); at.push(i);
          d -= part;
        }
      });
      return { vals: Uint16Array.from(vals), at: Uint32Array.from(at) };
    }

    // Write pulses to tape. onProgress(pulseIndex) while recording.
    async write(pulses, { onRecord, onProgress, onWaiting }) {
      if (!this.canWrite) throw new TapeError("readonly");
      const { vals, at } = TapeAdapter.values(pulses);
      this.link.flushInput();
      await this.command(this.kind === "DumpMaster64" ? "W" : "w");
      await this.waitForButton(onWaiting);
      if (onRecord) onRecord();

      let pos = 0, checksum = 0;
      for (;;) {
        // The adapter asks for the next package (number of bytes); 0 = finished
        const r = await this.link.read(1, 15000);
        if (!r.length) throw new TapeError("stalled");
        let size = r[0];
        if (size === 0) break;
        const out = [];
        const push = (v) => { out.push(v & 0xff, v >> 8); checksum = (checksum + (v & 0xff) + (v >> 8)) & 0xffff; };
        if (pos >= vals.length) push(0);
        while (size > 0 && pos < vals.length) {
          push(vals[pos++]);
          size -= 2;
          if (size > 0 && pos >= vals.length) push(0);
        }
        await this.link.write(Uint8Array.from(out));
        if (onProgress) onProgress(at[Math.max(0, Math.min(pos, at.length) - 1)] || 0, pos / vals.length);
      }
      const tail = await this.link.read(4, 3000);
      if (tail.length < 4) throw new TapeError("noend");
      return {
        checksumOk: (tail[0] | (tail[1] << 8)) === checksum,
        underrun: tail[2] !== 0,
        stopped: tail[3] !== 0,
        complete: pos >= vals.length,
      };
    }
  }

  // Open the port and identify the adapter. `preferred` is used if the
  // adapter answers with an unknown name.
  async function connect(port, preferred) {
    const link = new global.SerialLink(port, 460800);
    await link.open();
    let ident = null;
    for (let i = 0; i < 3 && !ADAPTERS.includes(ident); i++) {
      if (i) await new Promise((r) => setTimeout(r, 400));
      link.flushInput();
      // "i" plus a zero length byte: DumpMaster64 needs it, the others ignore it
      await link.write(new Uint8Array([0x69, 0x00]));
      ident = await link.readLine(1000);
    }
    let kind = ADAPTERS.includes(ident) ? ident : null;
    if (!kind && preferred && preferred !== "auto") kind = preferred;
    if (!kind) {
      await link.close();
      if (["DiskBuddy64", "DiskMaster64"].includes(ident)) throw new TapeError(`This is a ${ident}, which works with disk drives only. Use the D64 Disk Transfer app for it.`);
      throw new TapeError(ident ? `The device answered “${ident}”, which is not a tape adapter.` : "The device did not answer. Is it a TapeBuddy64, TapeDump64 or DumpMaster64 with its switch set to UART?");
    }
    const adapter = new TapeAdapter(link, kind);
    const version = await adapter.version();
    return { adapter, ident, version };
  }

  global.TAPE = { USB_FILTERS, ADAPTERS, TapeAdapter, TapeError, connect };
})(typeof window !== "undefined" ? window : globalThis);
