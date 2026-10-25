/* ===================================================================
 * Firmware files for microcontroller programmers
 * -------------------------------------------------------------------
 * Reads BIN and Intel HEX files and turns them into a flash image
 * (offsets from the start of the code flash). Shared by the WCH RISC-V
 * Programmer and the WCH USB Programmer.
 * Global: FIRMWARE (browser) / module.exports (Node.js)
 * =================================================================== */
(function (global) {
  "use strict";

  class FirmwareError extends Error {}


  // Intel HEX -> [{ addr, data }]; throws on syntax or checksum errors
  function parseHex(text) {
    const segs = [];
    let base = 0, line = 0, ended = false;
    for (const raw of text.split(/\r?\n/)) {
      line++;
      const s = raw.trim();
      if (!s) continue;
      if (s[0] !== ":" || !/^:[0-9a-fA-F]+$/.test(s) || s.length % 2 === 0) throw new FirmwareError(`Line ${line} is not an Intel HEX record`);
      const b = [];
      for (let i = 1; i < s.length; i += 2) b.push(parseInt(s.substr(i, 2), 16));
      const len = b[0];
      if (b.length !== len + 5) throw new FirmwareError(`Line ${line} has the wrong length`);
      if (b.reduce((a, v) => (a + v) & 255, 0) !== 0) throw new FirmwareError(`Checksum error in line ${line}`);
      const off = (b[1] << 8) | b[2], type = b[3], d = b.slice(4, 4 + len);
      if (type === 0x00) segs.push({ addr: base + off, data: Uint8Array.from(d) });
      else if (type === 0x01) { ended = true; break; }
      else if (type === 0x02) base = ((d[0] << 8) | d[1]) * 16;
      else if (type === 0x04) base = ((d[0] << 8) | d[1]) * 65536;
      // 0x03 and 0x05 (start address) are not needed for flashing
    }
    if (!segs.length) throw new FirmwareError("The HEX file contains no data");
    return { segs, ended };
  }

  // Firmware file -> { kind, segs } (BIN files are placed at offset 0)
  function readFirmware(name, data) {
    if (/\.(hex|ihx|ihex)$/i.test(name) || (data[0] === 0x3a && /^:[0-9A-Fa-f]{10}/.test(String.fromCharCode(...data.subarray(0, 11))))) {
      const { segs, ended } = parseHex(new TextDecoder().decode(data));
      return { kind: "hex", segs, ended };
    }
    if (!data.length) throw new FirmwareError("The file is empty");
    return { kind: "bin", segs: [{ addr: 0, data }] };
  }

  // Flash image: offsets from the start of the code flash. HEX addresses can
  // be absolute (0x08000000 + offset on CH32 chips) or start at 0.
  // base: address of the code flash, or null to take it from the file
  // (0x08000000 if the data lies there, else 0). flashSize: 0 if unknown.
  function buildImage(fw, base, flashSize) {
    const warnings = [];
    const lowest = Math.min(...fw.segs.map((x) => x.addr));
    if (base === null || base === undefined) base = lowest >= 0x08000000 && lowest < 0x08100000 ? 0x08000000 : 0;
    const parts = fw.segs.map((s) => ({ off: s.addr >= base && base ? s.addr - base : s.addr, data: s.data, addr: s.addr }));
    // The code flash of all supported chips lies within the first MB; data
    // beyond it (e.g. option bytes at 0x1FFFF800) is not part of the firmware.
    const WINDOW = 0x100000;
    const inside = parts.filter((p) => p.off < WINDOW);
    const outside = parts.filter((p) => p.off >= WINDOW);
    if (outside.length) warnings.push(`The file has data outside the code flash (from 0x${outside[0].addr.toString(16).padStart(8, "0")}, for example option bytes). It is not written.`);
    if (!inside.length) return { image: null, warnings, errors: ["The file has no data for the code flash."] };
    let end = 0, start = Infinity;
    for (const p of inside) { end = Math.max(end, p.off + p.data.length); start = Math.min(start, p.off); }
    const image = new Uint8Array(end).fill(0xff);
    for (const p of inside) image.set(p.data, p.off);
    const errors = [];
    if (flashSize && image.length > flashSize) errors.push(`The firmware needs ${image.length.toLocaleString("en")} bytes, but the chip has ${flashSize.toLocaleString("en")} bytes of flash.`);
    if (fw.kind === "hex" && start > 0) warnings.push(`The data starts at offset 0x${start.toString(16)}; the flash before it is filled with 0xFF (erased).`);
    return { image, start, warnings, errors };
  }

  const api = { FirmwareError, parseHex, readFirmware, buildImage };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.FIRMWARE = api;
})(typeof window !== "undefined" ? window : globalThis);
