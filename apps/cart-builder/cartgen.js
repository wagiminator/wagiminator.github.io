/* ===================================================================
 * Magic Desk cartridge image generator
 * -------------------------------------------------------------------
 * JavaScript port of crtgen.py v3.0 of the Magic Desk Cartridge
 * Generator, (c) 2013-2019 Zarko Zivanov, cartridge hardware
 * (c) Marko Solajic, as included in github.com/wagiminator/C64-Collection.
 * Licensed under the GNU General Public License v3 like the original.
 *
 * Image layout (all in the first 8 KB bank, which appears at $8000):
 *   menu program | configuration and menu texts | program table
 * followed by the programs, one after the other across the 8 KB
 * banks. Bank switching is done by writing the bank to $DE00.
 * Differences to crtgen.py: a program that appears in several menus
 * is stored once and all its entries point to that copy; the original
 * stored the first such program twice.
 * Works in the browser (global `CART`) and in Node.js.
 * =================================================================== */
(function (global) {
  "use strict";

  const SIZES = [64, 128, 256, 512, 1024];   // KB
  const MAX_MENUS = 8;
  const MAX_ITEMS = 10 + 26 * 2;             // keys 1-9, 0, a-z, A-Z
  const BANK = 0x2000;

  // C64 screen codes of the lower case character set (index = code)
  const SCR = "@abcdefghijklmnopqrstuvwxyz[|]|| !\"#$%&'()*+,-./0123456789:;<=>?|ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const SCR_MAP = new Map();
  [...SCR].forEach((ch, i) => { if (ch !== "|") SCR_MAP.set(ch, i); });
  const isValidChar = (ch) => SCR_MAP.has(ch);
  const screenCodes = (text) => [...text].map((ch) => SCR_MAP.get(ch) ?? 0x20);

  const centerText = (text) => {
    const pos = Math.floor((40 - text.length) / 2);
    return " ".repeat(Math.max(0, pos)) + text + " ".repeat(Math.max(0, 40 - pos - text.length));
  };

  const b64 = (s) => (typeof atob === "function"
    ? Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
    : new Uint8Array(Buffer.from(s, "base64")));

  // PRG file: 2 byte load address, then the data
  function parsePrg(bytes) {
    if (bytes.length < 3) throw new Error("short");
    const load = bytes[0] | (bytes[1] << 8);
    return { load, data: bytes.subarray(2), end: load + bytes.length - 2 };
  }

  /* options:
   *   sizeKB      64 | 128 | 256 | 512 | 1024
   *   menus       [{ title, spacing, items: [{ name, prg (Uint8Array incl. load address), run, id }] }]
   *   help        text on the last screen line (max 40)
   *   wave, sound 0/1
   *   border, background, character   colors set before a program starts (0-15)
   *   single      true: start the first program without a menu
   * returns { bin, length, size, free, menuSize, errors, warnings, layout,
   *           screens (menu layout per menu), help (bottom line) }
   */
  function build(o) {
    const errors = [], warnings = [];
    const size = (o.sizeKB || 64) * 1024;
    const menuPrg = parsePrg(b64(global.MENU_CODE[o.single ? "single" : "multi"]));
    const menuCode = menuPrg.data;

    const menus = o.menus.filter((m) => m.items.length).slice(0, MAX_MENUS);
    if (!menus.length) errors.push("Add at least one program.");
    if (o.menus.filter((m) => m.items.length).length > MAX_MENUS) errors.push(`At most ${MAX_MENUS} menus are possible.`);

    // Per menu: items with the "Basic" entry at the end, size and position
    let namesLen = 0;
    const list = menus.map((m, mi) => {
      if (m.items.length > MAX_ITEMS) errors.push(`Menu ${mi + 1} has ${m.items.length} programs; ${MAX_ITEMS} is the maximum.`);
      const title = (m.title || "").slice(0, 40);
      const items = m.items.map((it) => {
        const p = parsePrg(it.prg);
        return { name: (it.name || "").slice(0, 31), id: it.id, prg: p, load: p.load, run: it.run || p.load, len: p.data.length };
      });
      items.push({ name: "Basic", id: null, prg: null, load: 0, run: 0xfce2, len: 0 });
      const spacing = m.spacing ? 1 : 0;
      const width = Math.min(Math.max(...items.map((x) => x.name.length + 3)), 34);
      const height = Math.min(spacing ? 10 : 20, items.length);
      const x = Math.floor((40 - width - 3 - 3) / 2) + 1;
      const y = Math.floor((25 - height - spacing * (height - 1) - 3) / 2);
      const menu = { title: centerText(title), items, spacing, width, height, offset: x + 40 * y, itemsOffset: namesLen };
      namesLen += items.reduce((s, it) => s + it.name.length + 1, 0);
      return menu;
    });

    // Sizes and addresses
    const menusNo = list.length;
    const namesOffset = 2 + 5 + 8 * (1 + 2 + 1 + 1 + 1 + 2 + 2) + 40;
    const itemsTextOffset = namesOffset + menusNo * 40;
    const dataSize = itemsTextOffset + namesLen;
    const tableSize = 9 * list.reduce((s, m) => s + m.items.length, 0);
    const prgLen = menuCode.length;
    const menuSize = prgLen + dataSize + tableSize;            // must fit in the first bank
    if (menuSize > BANK) errors.push(`The menu needs ${menuSize.toLocaleString("en")} bytes, but only 8,192 fit into the first 8 KB bank. Shorten the program names or use fewer programs.`);
    const tableAddr = prgLen + dataSize + 0x8000;
    const namesAddr = prgLen + namesOffset + 0x8000;
    const itemsAddr = namesAddr + menusNo * 40;

    // Program table and data placement
    const table = [];
    const layout = [];
    const stored = new Map();                                 // program id -> table entry
    const blobs = [];
    let bank = 0, address = menuSize + 0x8000, offset = menuSize;
    for (const m of list) {
      for (const it of m.items) {
        if (it.prg && it.id != null && stored.has(it.id)) {
          table.push(...stored.get(it.id));
          continue;
        }
        const entry = [bank, address & 0xff, address >> 8, it.len & 0xff, it.len >> 8, it.load & 0xff, it.load >> 8];
        const run = it.run === 0x0801 ? 0 : it.run;           // 0 = start with RUN
        entry.push(run & 0xff, run >> 8);
        table.push(...entry);
        if (it.prg) {
          if (it.id != null) stored.set(it.id, entry);
          blobs.push(it.prg.data);
          layout.push({ id: it.id, name: it.name, bank, address, offset, length: it.len, load: it.load, run: it.run });
          checkProgram(it, warnings, errors);
        }
        address += it.len;
        offset += it.len;
        while (address > 0x9fff) { address -= BANK; bank++; }
      }
    }

    // Assemble
    const out = [...menuCode];
    const byte = (v) => out.push(v & 0xff);
    const word = (v) => { out.push(v & 0xff, (v >> 8) & 0xff); };
    const text = (t, zero) => { out.push(...screenCodes(t)); if (zero) out.push(0); };
    const perMenu = (fn, pad) => { list.forEach(fn); for (let i = list.length; i < 8; i++) pad(); };
    word(tableAddr);
    byte(o.border ?? 14); byte(o.background ?? 6); byte(o.character ?? 14);
    byte(o.wave ?? 1); byte(o.sound ?? 0);
    perMenu((m) => byte(m.items.length), () => byte(0));
    perMenu((m) => word(m.offset), () => word(0));
    perMenu((m) => byte(m.width), () => byte(0));
    perMenu((m) => byte(m.height), () => byte(0));
    perMenu((m) => byte(m.spacing), () => byte(0));
    list.forEach((m, i) => word(namesAddr + 40 * i)); for (let i = list.length; i < 8; i++) word(0);
    perMenu((m) => word(itemsAddr + m.itemsOffset), () => word(0));
    text(centerText((o.help ?? "(Shift)CRSR: Scroll, Fn/Ret: Menu select").slice(0, 40)));
    for (const m of list) text(m.title);
    for (const m of list) for (const it of m.items) text(it.name, true);
    out.push(...table);
    for (const d of blobs) for (let i = 0; i < d.length; i++) out.push(d[i]);

    const length = out.length;
    if (length > size) errors.push(`The programs need ${length.toLocaleString("en")} bytes, ${(length - size).toLocaleString("en")} more than the ${o.sizeKB} KB EPROM holds.`);
    let bin = null;
    if (!errors.length) {
      bin = new Uint8Array(size).fill(0xff);
      bin.set(out);
    }
    // Screen layout of each menu as the menu program draws it (for previews)
    const screens = list.map((m) => ({
      title: m.title, width: m.width, height: m.height, spacing: m.spacing,
      x: m.offset % 40, y: Math.floor(m.offset / 40), items: m.items.map((it) => it.name),
    }));
    const help = centerText((o.help ?? "(Shift)CRSR: Scroll, Fn/Ret: Menu select").slice(0, 40));
    return { bin, length, size, free: size - length, menuSize, errors, warnings, layout, screens, help };
  }

  // Programs the copy routine cannot start safely
  function checkProgram(it, warnings, errors) {
    const from = it.load, to = it.load + it.len;
    if (to > 0x10000) errors.push(`“${it.name}” ends beyond $FFFF and cannot be loaded. Check that it is a real PRG file.`);
    else if (from < 0x0400 && to > 0x0340) warnings.push(`“${it.name}” loads over $0340-$03FF, where the cartridge copies programs from. It will probably not start.`);
    else if (from < 0xe000 && to > 0xd000) warnings.push(`“${it.name}” loads into $D000-$DFFF (I/O area). It will probably not start.`);
  }

  // VICE CRT file: Magic Desk (type 19), EXROM=0, GAME=1, one CHIP per 8 KB bank
  function toCRT(bin, name) {
    const banks = bin.length / BANK;
    const out = new Uint8Array(0x40 + banks * (0x10 + BANK));
    const sig = "C64 CARTRIDGE   ";
    for (let i = 0; i < 16; i++) out[i] = sig.charCodeAt(i);
    out[0x13] = 0x40;                       // header length
    out[0x14] = 1; out[0x15] = 0;           // version 1.0
    out[0x16] = 0; out[0x17] = 19;          // hardware type: Magic Desk
    out[0x18] = 0;                          // EXROM line
    out[0x19] = 1;                          // GAME line
    const n = (name || "MAGIC DESK").toUpperCase().replace(/[^\x20-\x7e]/g, "").slice(0, 32);
    for (let i = 0; i < n.length; i++) out[0x20 + i] = n.charCodeAt(i);
    for (let b = 0; b < banks; b++) {
      const p = 0x40 + b * (0x10 + BANK);
      out.set([0x43, 0x48, 0x49, 0x50], p);                  // "CHIP"
      out[p + 6] = (BANK + 0x10) >> 8; out[p + 7] = (BANK + 0x10) & 0xff;
      out[p + 9] = 0;                                        // ROM
      out[p + 10] = b >> 8; out[p + 11] = b & 0xff;          // bank
      out[p + 12] = 0x80; out[p + 13] = 0x00;                // load address $8000
      out[p + 14] = BANK >> 8; out[p + 15] = BANK & 0xff;    // size
      out.set(bin.subarray(b * BANK, (b + 1) * BANK), p + 0x10);
    }
    return out;
  }

  const api = { SIZES, MAX_MENUS, MAX_ITEMS, BANK, build, toCRT, parsePrg, isValidChar, screenCodes };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else global.CART = api;
})(typeof window !== "undefined" ? window : globalThis);
