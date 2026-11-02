/* ===================================================================
 * Serial UPDI programmer for all AVRs with UPDI (Web Serial)
 * -------------------------------------------------------------------
 * JavaScript port of megaupdi.py v1.0 by Stefan Wagner (MIT License),
 * https://github.com/wagiminator/MCU-Flash-Tools, which is based on
 * TinyUPDI, pyupdi, pymcuprog and the serialupdi programmer of AVRDUDE
 * (device data and NVM controller variants). The USB-to-serial
 * converter's TX and RX are joined (through a resistor or diode) to the
 * UPDI pin, so every byte sent comes back as an echo. UPDI runs at
 * 230400 baud, 8E2; a double break at 300 baud resets the UPDI port
 * first. The System Information Block (SIB) tells the NVM controller
 * variant (P:0 = tinyAVR/megaAVR 0 with 16-bit addresses, P:2..6 = AVR
 * Dx/Ex/Lx/Sx with 24-bit addresses); the chip is then identified by its
 * signature.
 * Supported: tinyAVR 0/1/2, megaAVR 0, AVR DA/DA-S/DB/DD/DU/EA/EB/EC/
 * LA/SD (133 devices). Flash and fuses only (no EEPROM, user row, boot
 * row or lock bits of the AVR Dx/Ex/Lx/Sx).
 * Difference to megaupdi.py: connecting to a locked chip erases it only
 * for erase and flash actions (as megaupdi.py with -e or -f).
 * Global: UPDI
 * =================================================================== */
(function (global) {
  "use strict";

  const BAUD = 230400;
  const C = {
    BREAK: 0x00, LDS: 0x00, STS: 0x40, LD: 0x20, ST: 0x60, LDCS: 0x80, STCS: 0xc0, REPEAT: 0xa0, KEY: 0xe0,
    PTR_INC: 0x04, PTR_ADDRESS: 0x08, ADDRESS_16: 0x04, ADDRESS_24: 0x08, DATA_8: 0x00, DATA_16: 0x01, DATA_24: 0x02,
    SYNC: 0x55, ACK: 0x40, REPEAT_BYTE: 0x00,
    CS_STATUSA: 0x00, CS_CTRLA: 0x02, CS_CTRLB: 0x03,
    CTRLA_RSD_BIT: 3, CTRLA_IBDLY_BIT: 7, CTRLB_CCDETDIS_BIT: 3, CTRLB_UPDIDIS_BIT: 2,
    ASI_KEY_STATUS: 0x07, ASI_RESET_REQ: 0x08, ASI_SYS_STATUS: 0x0b,
    KEY_STATUS_CHIPERASE: 3, KEY_STATUS_NVMPROG: 4,
    SYS_STATUS_RSTSYS: 5, SYS_STATUS_NVMPROG: 3, SYS_STATUS_LOCKSTATUS: 0,
    RESET_REQ_VALUE: 0x59, MAX_REPEAT: 0x100, READ_BLOCK: 256,
    KEY_SIB: 0x04, KEY_KEY: 0x00, KEY_64: 0x00, SIB_32BYTES: 0x02,
    NVMCTRL_CTRLA: 0x00, NVM_BUSY_MASK: 0x03,
    // NVM controller P:0 (tinyAVR, megaAVR 0)
    V0_DATAL: 0x06, V0_ADDRL: 0x08, V0_ADDRH: 0x09,
    V0_WRITE_PAGE: 0x01, V0_PAGE_BUFFER_CLR: 0x04, V0_CHIP_ERASE: 0x05, V0_WRITE_FUSE: 0x07,
    // NVM controller P:2..6 (AVR Dx, Ex, ...)
    NOCMD: 0x00, FLASH_WRITE: 0x02, FLASH_PAGE_WRITE: 0x04, FLASH_PAGE_BUFFER_CLEAR: 0x0f,
    EEPROM_ERASE_WRITE: 0x13, EEPROM_PAGE_ERASE_WRITE: 0x15, EEPROM_PAGE_BUFFER_CLEAR: 0x1f, CHIP_ERASE: 0x20,
    V0_FUSE_LOCKBIT: 0x0a, V0_LOCKBIT_UNLOCKED: 0xc5,
  };
  const KEY_NVM = Array.from("NVMProg ", (c) => c.charCodeAt(0));
  const KEY_CHIPERASE = Array.from("NVMErase", (c) => c.charCodeAt(0));
  const NVMCTRL = 0x1000, SYSCFG = 0x0f00;

  // Device families of megaupdi.py (generated from avrdude.conf and avrintel.c
  // of AVRDUDE v8.3): flash address in the data space, signature row, fuse 0,
  // valid fuse numbers, oscillator select (fuse, mask, shift, MHz -> value; null
  // if not selectable by fuse) and UPDI pin setting (fuse, mask, shift, values
  // that keep UPDI; null if the UPDI pin is fixed)
  const FAMILIES = {
    "tiny0": { flashStart: 0x008000, sigrow: 0x1100, fuses: 0x1280, fuseList: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], osc: {"fuse": 2, "mask": 3, "shift": 0, "values": {"16": 1, "20": 2}}, updiPin: {"fuse": 5, "mask": 12, "shift": 2, "values": [1]} },
    "tiny1": { flashStart: 0x008000, sigrow: 0x1100, fuses: 0x1280, fuseList: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], osc: {"fuse": 2, "mask": 3, "shift": 0, "values": {"16": 1, "20": 2}}, updiPin: {"fuse": 5, "mask": 12, "shift": 2, "values": [1]} },
    "tiny1-auto": { flashStart: 0x008000, sigrow: 0x1100, fuses: 0x1280, fuseList: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], osc: {"fuse": 2, "mask": 3, "shift": 0, "values": {"16": 1}}, updiPin: {"fuse": 5, "mask": 12, "shift": 2, "values": [1]} },
    "tiny2": { flashStart: 0x008000, sigrow: 0x1100, fuses: 0x1280, fuseList: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], osc: {"fuse": 2, "mask": 3, "shift": 0, "values": {"16": 1, "20": 2}}, updiPin: {"fuse": 5, "mask": 12, "shift": 2, "values": [1, 3]} },
    "mega0": { flashStart: 0x004000, sigrow: 0x1100, fuses: 0x1280, fuseList: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], osc: {"fuse": 2, "mask": 3, "shift": 0, "values": {"16": 1, "20": 2}}, updiPin: null },
    "DA": { flashStart: 0x800000, sigrow: 0x1100, fuses: 0x1050, fuseList: [0, 1, 2, 5, 6, 7, 8], osc: null, updiPin: null },
    "DA-S": { flashStart: 0x800000, sigrow: 0x1100, fuses: 0x1050, fuseList: [0, 1, 2, 5, 6, 7, 8, 10], osc: null, updiPin: null },
    "DB": { flashStart: 0x800000, sigrow: 0x1100, fuses: 0x1050, fuseList: [0, 1, 2, 5, 6, 7, 8], osc: null, updiPin: null },
    "DD": { flashStart: 0x800000, sigrow: 0x1100, fuses: 0x1050, fuseList: [0, 1, 2, 5, 6, 7, 8], osc: null, updiPin: {"fuse": 5, "mask": 16, "shift": 4, "values": [1]} },
    "DU": { flashStart: 0x800000, sigrow: 0x1080, fuses: 0x1050, fuseList: [0, 1, 2, 5, 6, 7, 8, 10], osc: null, updiPin: {"fuse": 5, "mask": 16, "shift": 4, "values": [1]} },
    "EA": { flashStart: 0x800000, sigrow: 0x1100, fuses: 0x1050, fuseList: [0, 1, 2, 5, 6, 7, 8], osc: {"fuse": 2, "mask": 8, "shift": 3, "values": {"16": 1, "20": 0}}, updiPin: {"fuse": 5, "mask": 16, "shift": 4, "values": [1]} },
    "EB": { flashStart: 0x800000, sigrow: 0x1080, fuses: 0x1050, fuseList: [0, 1, 2, 5, 6, 7, 8, 10], osc: {"fuse": 2, "mask": 8, "shift": 3, "values": {"16": 1, "20": 0}}, updiPin: {"fuse": 5, "mask": 16, "shift": 4, "values": [1]} },
    "EC": { flashStart: 0x800000, sigrow: 0x1080, fuses: 0x1050, fuseList: [0, 1, 2, 5, 6, 7, 8, 10], osc: null, updiPin: {"fuse": 5, "mask": 16, "shift": 4, "values": [1]} },
    "LA": { flashStart: 0x800000, sigrow: 0x1080, fuses: 0x1050, fuseList: [0, 1, 2, 3, 4, 5, 6, 7, 8, 10], osc: {"fuse": 2, "mask": 8, "shift": 3, "values": {"16": 1, "20": 0}}, updiPin: {"fuse": 3, "mask": 2, "shift": 1, "values": [1]} },
    "SD": { flashStart: 0x800000, sigrow: 0x1080, fuses: 0x1050, fuseList: [0, 1, 5, 6, 7, 8, 10], osc: null, updiPin: null },
  };

  // Device table of megaupdi.py: [name, signature, family, flash size, page size]
  const DEVICES = [
    ["ATtiny202", 0x1E9123, "tiny0", 0x00800, 0x040],
    ["ATtiny204", 0x1E9122, "tiny0", 0x00800, 0x040],
    ["ATtiny402", 0x1E9227, "tiny0", 0x01000, 0x040],
    ["ATtiny404", 0x1E9226, "tiny0", 0x01000, 0x040],
    ["ATtiny406", 0x1E9225, "tiny0", 0x01000, 0x040],
    ["ATtiny804", 0x1E9325, "tiny0", 0x02000, 0x040],
    ["ATtiny806", 0x1E9324, "tiny0", 0x02000, 0x040],
    ["ATtiny807", 0x1E9323, "tiny0", 0x02000, 0x040],
    ["ATtiny1604", 0x1E9425, "tiny0", 0x04000, 0x040],
    ["ATtiny1606", 0x1E9424, "tiny0", 0x04000, 0x040],
    ["ATtiny1607", 0x1E9423, "tiny0", 0x04000, 0x040],
    ["ATtiny212", 0x1E9121, "tiny1", 0x00800, 0x040],
    ["ATtiny214", 0x1E9120, "tiny1", 0x00800, 0x040],
    ["ATtiny412", 0x1E9223, "tiny1", 0x01000, 0x040],
    ["ATtiny414", 0x1E9222, "tiny1", 0x01000, 0x040],
    ["ATtiny416", 0x1E9221, "tiny1", 0x01000, 0x040],
    ["ATtiny417", 0x1E9220, "tiny1", 0x01000, 0x040],
    ["ATtiny814", 0x1E9322, "tiny1", 0x02000, 0x040],
    ["ATtiny816", 0x1E9321, "tiny1", 0x02000, 0x040],
    ["ATtiny817", 0x1E9320, "tiny1", 0x02000, 0x040],
    ["ATtiny1614", 0x1E9422, "tiny1", 0x04000, 0x040],
    ["ATtiny1616", 0x1E9421, "tiny1", 0x04000, 0x040],
    ["ATtiny1617", 0x1E9420, "tiny1", 0x04000, 0x040],
    ["ATtiny3216", 0x1E9521, "tiny1", 0x08000, 0x080],
    ["ATtiny3217", 0x1E9522, "tiny1", 0x08000, 0x080],
    ["ATtiny416auto", 0x1E9228, "tiny1-auto", 0x01000, 0x040],
    ["ATtiny424", 0x1E922C, "tiny2", 0x01000, 0x040],
    ["ATtiny426", 0x1E922B, "tiny2", 0x01000, 0x040],
    ["ATtiny427", 0x1E922A, "tiny2", 0x01000, 0x040],
    ["ATtiny824", 0x1E9329, "tiny2", 0x02000, 0x040],
    ["ATtiny826", 0x1E9328, "tiny2", 0x02000, 0x040],
    ["ATtiny827", 0x1E9327, "tiny2", 0x02000, 0x040],
    ["ATtiny1624", 0x1E942A, "tiny2", 0x04000, 0x040],
    ["ATtiny1626", 0x1E9429, "tiny2", 0x04000, 0x040],
    ["ATtiny1627", 0x1E9428, "tiny2", 0x04000, 0x040],
    ["ATtiny3224", 0x1E9528, "tiny2", 0x08000, 0x080],
    ["ATtiny3226", 0x1E9527, "tiny2", 0x08000, 0x080],
    ["ATtiny3227", 0x1E9526, "tiny2", 0x08000, 0x080],
    ["ATmega808", 0x1E9326, "mega0", 0x02000, 0x040],
    ["ATmega809", 0x1E932A, "mega0", 0x02000, 0x040],
    ["ATmega1608", 0x1E9427, "mega0", 0x04000, 0x040],
    ["ATmega1609", 0x1E9426, "mega0", 0x04000, 0x040],
    ["ATmega3208", 0x1E9530, "mega0", 0x08000, 0x080],
    ["ATmega3209", 0x1E9531, "mega0", 0x08000, 0x080],
    ["ATmega4808", 0x1E9650, "mega0", 0x0C000, 0x080],
    ["ATmega4809", 0x1E9651, "mega0", 0x0C000, 0x080],
    ["AVR32DA28", 0x1E9534, "DA", 0x08000, 0x200],
    ["AVR32DA32", 0x1E9533, "DA", 0x08000, 0x200],
    ["AVR32DA48", 0x1E9532, "DA", 0x08000, 0x200],
    ["AVR64DA28", 0x1E9615, "DA", 0x10000, 0x200],
    ["AVR64DA32", 0x1E9614, "DA", 0x10000, 0x200],
    ["AVR64DA48", 0x1E9613, "DA", 0x10000, 0x200],
    ["AVR64DA64", 0x1E9612, "DA", 0x10000, 0x200],
    ["AVR128DA28", 0x1E970A, "DA", 0x20000, 0x200],
    ["AVR128DA32", 0x1E9709, "DA", 0x20000, 0x200],
    ["AVR128DA48", 0x1E9708, "DA", 0x20000, 0x200],
    ["AVR128DA64", 0x1E9707, "DA", 0x20000, 0x200],
    ["AVR32DA28S", 0x1E9572, "DA-S", 0x08000, 0x200],
    ["AVR32DA32S", 0x1E9571, "DA-S", 0x08000, 0x200],
    ["AVR32DA48S", 0x1E9570, "DA-S", 0x08000, 0x200],
    ["AVR64DA28S", 0x1E962E, "DA-S", 0x10000, 0x200],
    ["AVR64DA32S", 0x1E962D, "DA-S", 0x10000, 0x200],
    ["AVR64DA48S", 0x1E962C, "DA-S", 0x10000, 0x200],
    ["AVR64DA64S", 0x1E962B, "DA-S", 0x10000, 0x200],
    ["AVR128DA28S", 0x1E9712, "DA-S", 0x20000, 0x200],
    ["AVR128DA32S", 0x1E9711, "DA-S", 0x20000, 0x200],
    ["AVR128DA48S", 0x1E9710, "DA-S", 0x20000, 0x200],
    ["AVR128DA64S", 0x1E970F, "DA-S", 0x20000, 0x200],
    ["AVR32DB28", 0x1E9537, "DB", 0x08000, 0x200],
    ["AVR32DB32", 0x1E9536, "DB", 0x08000, 0x200],
    ["AVR32DB48", 0x1E9535, "DB", 0x08000, 0x200],
    ["AVR64DB28", 0x1E9619, "DB", 0x10000, 0x200],
    ["AVR64DB32", 0x1E9618, "DB", 0x10000, 0x200],
    ["AVR64DB48", 0x1E9617, "DB", 0x10000, 0x200],
    ["AVR64DB64", 0x1E9616, "DB", 0x10000, 0x200],
    ["AVR128DB28", 0x1E970E, "DB", 0x20000, 0x200],
    ["AVR128DB32", 0x1E970D, "DB", 0x20000, 0x200],
    ["AVR128DB48", 0x1E970C, "DB", 0x20000, 0x200],
    ["AVR128DB64", 0x1E970B, "DB", 0x20000, 0x200],
    ["AVR16DD14", 0x1E9434, "DD", 0x04000, 0x200],
    ["AVR16DD20", 0x1E9433, "DD", 0x04000, 0x200],
    ["AVR16DD28", 0x1E9432, "DD", 0x04000, 0x200],
    ["AVR16DD32", 0x1E9431, "DD", 0x04000, 0x200],
    ["AVR32DD14", 0x1E953B, "DD", 0x08000, 0x200],
    ["AVR32DD20", 0x1E953A, "DD", 0x08000, 0x200],
    ["AVR32DD28", 0x1E9539, "DD", 0x08000, 0x200],
    ["AVR32DD32", 0x1E9538, "DD", 0x08000, 0x200],
    ["AVR64DD14", 0x1E961D, "DD", 0x10000, 0x200],
    ["AVR64DD20", 0x1E961C, "DD", 0x10000, 0x200],
    ["AVR64DD28", 0x1E961B, "DD", 0x10000, 0x200],
    ["AVR64DD32", 0x1E961A, "DD", 0x10000, 0x200],
    ["AVR16DU14", 0x1E943B, "DU", 0x04000, 0x200],
    ["AVR16DU20", 0x1E943A, "DU", 0x04000, 0x200],
    ["AVR16DU28", 0x1E9439, "DU", 0x04000, 0x200],
    ["AVR16DU32", 0x1E9438, "DU", 0x04000, 0x200],
    ["AVR32DU14", 0x1E954F, "DU", 0x08000, 0x200],
    ["AVR32DU20", 0x1E954E, "DU", 0x08000, 0x200],
    ["AVR32DU28", 0x1E9540, "DU", 0x08000, 0x200],
    ["AVR32DU32", 0x1E953F, "DU", 0x08000, 0x200],
    ["AVR64DU28", 0x1E9622, "DU", 0x10000, 0x200],
    ["AVR64DU32", 0x1E9621, "DU", 0x10000, 0x200],
    ["AVR8EA28", 0x1E932C, "EA", 0x02000, 0x040],
    ["AVR8EA32", 0x1E932B, "EA", 0x02000, 0x040],
    ["AVR16EA28", 0x1E9437, "EA", 0x04000, 0x040],
    ["AVR16EA32", 0x1E9436, "EA", 0x04000, 0x040],
    ["AVR16EA48", 0x1E9435, "EA", 0x04000, 0x040],
    ["AVR32EA28", 0x1E953E, "EA", 0x08000, 0x040],
    ["AVR32EA32", 0x1E953D, "EA", 0x08000, 0x040],
    ["AVR32EA48", 0x1E953C, "EA", 0x08000, 0x040],
    ["AVR64EA28", 0x1E9620, "EA", 0x10000, 0x080],
    ["AVR64EA32", 0x1E961F, "EA", 0x10000, 0x080],
    ["AVR64EA48", 0x1E961E, "EA", 0x10000, 0x080],
    ["AVR16EB14", 0x1E9449, "EB", 0x04000, 0x040],
    ["AVR16EB20", 0x1E9440, "EB", 0x04000, 0x040],
    ["AVR16EB28", 0x1E943F, "EB", 0x04000, 0x040],
    ["AVR16EB32", 0x1E943E, "EB", 0x04000, 0x040],
    ["AVR32EB14", 0x1E952D, "EB", 0x08000, 0x040],
    ["AVR32EB20", 0x1E952C, "EB", 0x08000, 0x040],
    ["AVR32EB28", 0x1E952B, "EB", 0x08000, 0x040],
    ["AVR32EB32", 0x1E952A, "EB", 0x08000, 0x040],
    ["AVR64EC28", 0x1E962A, "EC", 0x10000, 0x080],
    ["AVR64EC48", 0x1E9628, "EC", 0x10000, 0x080],
    ["AVR16LA14", 0x1E9454, "LA", 0x04000, 0x040],
    ["AVR16LA20", 0x1E9453, "LA", 0x04000, 0x040],
    ["AVR16LA28", 0x1E9452, "LA", 0x04000, 0x040],
    ["AVR16LA32", 0x1E9451, "LA", 0x04000, 0x040],
    ["AVR32LA14", 0x1E9529, "LA", 0x08000, 0x040],
    ["AVR32LA20", 0x1E9560, "LA", 0x08000, 0x040],
    ["AVR32LA28", 0x1E9559, "LA", 0x08000, 0x040],
    ["AVR32LA32", 0x1E9558, "LA", 0x08000, 0x040],
    ["AVR32SD20", 0x1E9554, "SD", 0x08000, 0x200],
    ["AVR32SD28", 0x1E9553, "SD", 0x08000, 0x200],
    ["AVR32SD32", 0x1E9552, "SD", 0x08000, 0x200],
  ].map(([name, id, family, flashSize, pageSize]) => ({ name, id, family, flashSize, pageSize }));

  // NVM controller variants (SIB "P:x"): [STATUS register offset, write error mask]
  const NVM_PARAMS = { "0": [0x02, 0x04], "2": [0x02, 0x30], "3": [0x06, 0x70], "4": [0x06, 0x70], "5": [0x06, 0x70], "6": [0x07, 0x70] };
  const NVM_PAGE_ORIENTED = "35";

  // Names of the families and of their fuses (for the user interface)
  const FAMILY_NAMES = {
    "tiny0": "tinyAVR 0-series", "tiny1": "tinyAVR 1-series", "tiny1-auto": "tinyAVR 1-series (automotive)",
    "tiny2": "tinyAVR 2-series", "mega0": "megaAVR 0-series", "DA": "AVR DA", "DA-S": "AVR DA (S)", "DB": "AVR DB",
    "DD": "AVR DD", "DU": "AVR DU", "EA": "AVR EA", "EB": "AVR EB", "EC": "AVR EC", "LA": "AVR LA", "SD": "AVR SD",
  };
  const isV0 = (family) => FAMILIES[family].fuses === 0x1280;
  function fuseInfo(family) {
    const fam = FAMILIES[family], v0 = isV0(family);
    const block = ["DA", "DA-S", "DB", "DD", "DU"].includes(family) ? 512 : v0 ? 256 : 0;
    const names = v0 ? {
      0: ["WDTCFG", "Watchdog period and window"], 1: ["BODCFG", "Brown-out detector"],
      2: ["OSCCFG", "Main clock: 0x01 = 16 MHz, 0x02 = 20 MHz"], 4: ["TCD0CFG", "TCD0 outputs"],
      5: ["SYSCFG0", "CRC, UPDI/reset pin, EEPROM save"], 6: ["SYSCFG1", "Start-up time"],
      7: ["APPEND", "End of the application code (in 256-byte blocks)"], 8: ["BOOTEND", "End of the boot section (in 256-byte blocks)"],
      10: ["LOCKBIT", "0xC5 = unlocked, any other value locks the chip"],
    } : {
      0: ["WDTCFG", "Watchdog period and window"], 1: ["BODCFG", "Brown-out detector"],
      2: ["OSCCFG", fam.osc ? "Oscillator (16 or 20 MHz)" : "Oscillator configuration"],
      3: ["FUSE3", fam.updiPin && fam.updiPin.fuse === 3 ? "Includes the UPDI pin setting (see datasheet)" : "See the datasheet"],
      4: ["FUSE4", "See the datasheet"],
      5: ["SYSCFG0", fam.updiPin && fam.updiPin.fuse === 5 ? "CRC, UPDI and reset pin, EEPROM save" : "CRC, reset pin, EEPROM save"],
      6: ["SYSCFG1", "Start-up time"],
      7: ["CODESIZE", block ? `Application code section (in ${block}-byte blocks)` : "Application code section (see datasheet)"],
      8: ["BOOTSIZE", block ? `Boot section (in ${block}-byte blocks)` : "Boot section (see datasheet)"],
      10: ["PDICFG", "Programming interface configuration: can lock UPDI permanently!"],
    };
    // only the fuses megaupdi.py accepts; on P:0 not the reserved ones (3, 9)
    const list = fam.fuseList.filter((n) => names[n] && !(v0 && n === 4 && !family.startsWith("tiny1")));
    return list.map((n) => ({ n, name: names[n][0], text: names[n][1], block }));
  }

  // Oscillator (16 or 20 MHz) for a system frequency (prescaler values of the AVRs)
  const DIVIDERS = [1, 2, 4, 8, 16, 32, 64, 6, 10, 12, 24, 48];
  function oscillatorFor(freq) {
    for (const x of DIVIDERS) {
      if (Math.round(20000000 / x) === freq) return { osc: 20, div: x };
      if (Math.round(16000000 / x) === freq) return { osc: 16, div: x };
    }
    return null;
  }
  function trimFrequencies() {
    const set = new Map();
    for (const x of DIVIDERS) for (const f of [20000000, 16000000]) {
      const v = Math.round(f / x), t = oscillatorFor(v);
      if (!set.has(v)) set.set(v, t);
    }
    return [...set.entries()].sort((a, b) => b[0] - a[0]).map(([freq, t]) => ({ freq, ...t }));
  }

  const hex = (v, n) => "0x" + v.toString(16).padStart(n, "0");
  class UpdiError extends Error {}
  class LockedError extends UpdiError {}

  /* ---------- Physical and data link layer ---------- */

  class Programmer {
    constructor(port, baud, timeout) {
      this.port = port;
      this.baud = baud || BAUD;
      this.timeout = timeout || 1000;
      this.addr24 = false;
      this.locked = false;
      this.family = null;
      this.flashSize = 0x0800;
      this.pageSize = 64;
      this.now = () => performance.now();   // clock for the timeouts (replaceable in tests)
    }

    async openMain() {
      this.link = new global.SerialLink(this.port, this.baud, { parity: "even", dataBits: 8, stopBits: 2 });
      await this.link.open();
    }

    // Send a double break (two 0x00 at 300 baud) to reset the UPDI port
    async doubleBreak() {
      await this.link.close();
      const tmp = new global.SerialLink(this.port, 300, { parity: "none", dataBits: 8, stopBits: 1 });
      await tmp.open();
      await tmp.write(Uint8Array.from([C.BREAK, C.BREAK]));
      await tmp.read(2, this.timeout);
      await tmp.close();
      await this.openMain();
    }

    // Send bytes and swallow their echo
    async send(bytes) {
      await this.link.write(Uint8Array.from(bytes));
      await this.link.read(bytes.length, this.timeout);
    }
    receive(n) { return this.link.read(n, this.timeout); }

    // Address bytes and size flags of the current address mode
    addr(a) { return this.addr24 ? [a & 0xff, (a >> 8) & 0xff, (a >> 16) & 0xff] : [a & 0xff, (a >> 8) & 0xff]; }
    asize() { return this.addr24 ? C.ADDRESS_24 : C.ADDRESS_16; }

    async ldcs(a) {
      await this.send([C.SYNC, C.LDCS | (a & 0x0f)]);
      const r = await this.receive(1);
      return r.length === 1 ? r[0] : 0;
    }
    async stcs(a, v) { await this.send([C.SYNC, C.STCS | (a & 0x0f), v]); }

    async ack(what) {
      const r = await this.receive(1);
      if (r.length !== 1 || r[0] !== C.ACK) throw new UpdiError(`Failed to communicate with device (${what})`);
    }

    async ld(a) {
      await this.send([C.SYNC, C.LDS | this.asize() | C.DATA_8, ...this.addr(a)]);
      const r = await this.receive(1);
      if (r.length !== 1) throw new UpdiError("Failed to communicate with device (ld)");
      return r[0];
    }
    async st(a, v) {
      await this.send([C.SYNC, C.STS | this.asize() | C.DATA_8, ...this.addr(a)]);
      await this.ack("st");
      await this.send([v & 0xff]);
      await this.ack("st");
    }
    async st16(a, v) {
      await this.send([C.SYNC, C.STS | this.asize() | C.DATA_16, ...this.addr(a)]);
      await this.ack("st16");
      await this.send([v & 0xff, (v >> 8) & 0xff]);
      await this.ack("st16");
    }
    async ldPtrInc(n) {
      await this.send([C.SYNC, C.LD | C.PTR_INC | C.DATA_8]);
      const r = await this.receive(n);
      if (r.length !== n) throw new UpdiError("Failed to communicate with device (ld_ptr_inc)");
      return r;
    }
    async ldPtrInc16(words) {
      await this.send([C.SYNC, C.LD | C.PTR_INC | C.DATA_16]);
      const r = await this.receive(words << 1);
      if (r.length !== words << 1) throw new UpdiError("Failed to communicate with device (ld_ptr_inc16)");
      return r;
    }
    async stPtr(a) {
      await this.send([C.SYNC, C.ST | C.PTR_ADDRESS | (this.addr24 ? C.DATA_24 : C.DATA_16), ...this.addr(a)]);
      await this.ack("st_ptr");
    }
    // Word writes with response signature disabled (no ACK per word)
    async stPtrInc16(data) {
      const on = 1 << C.CTRLA_IBDLY_BIT, off = on | (1 << C.CTRLA_RSD_BIT);
      await this.stcs(C.CS_CTRLA, off);
      await this.send([C.SYNC, C.ST | C.PTR_INC | C.DATA_16]);
      await this.send(data);
      await this.stcs(C.CS_CTRLA, on);
    }
    async repeat(n) {
      if (n < 1 || n > C.MAX_REPEAT) throw new UpdiError("Invalid repeat count");
      await this.send([C.SYNC, C.REPEAT | C.REPEAT_BYTE, (n - 1) & 0xff]);
    }
    async key(key) {
      await this.send([C.SYNC, C.KEY | C.KEY_KEY | C.KEY_64]);
      await this.send(key.slice().reverse());
    }

    // System Information Block: string or null
    async readSib() {
      await this.send([C.SYNC, C.KEY | C.KEY_SIB | C.SIB_32BYTES]);
      const r = await this.receive(32);
      if (r.some((b) => b > 0x7f)) return null;
      const sib = String.fromCharCode(...r);
      if (sib.length < 19 || sib.slice(8, 10) !== "P:") return null;
      return sib;
    }

    /* ---------- Application layer ---------- */

    async reset(apply) { await this.stcs(C.ASI_RESET_REQ, apply ? C.RESET_REQ_VALUE : 0x00); }
    async inProgMode() { return !!(await this.ldcs(C.ASI_SYS_STATUS) & (1 << C.SYS_STATUS_NVMPROG)); }
    async waitUnlocked(ms) {
      const start = this.now();
      while (!(this.now() - start > ms)) {
        if (!(await this.ldcs(C.ASI_SYS_STATUS) & (1 << C.SYS_STATUS_LOCKSTATUS))) return true;
      }
      return false;
    }
    async enterProgMode() {
      if (await this.inProgMode()) return;
      await this.reset(true);
      await this.key(KEY_NVM);
      if (!(await this.ldcs(C.ASI_KEY_STATUS) & (1 << C.KEY_STATUS_NVMPROG))) {
        await this.reset(false);
        throw new UpdiError("Key not accepted");
      }
      await this.reset(true);
      await this.reset(false);
      if (!(await this.waitUnlocked(100))) throw new LockedError("Failed to enter NVM programming mode: device is locked");
      const start = this.now();
      while (!(await this.inProgMode())) {
        if (this.now() - start > 500) throw new UpdiError("Failed to enter NVM programming mode");
      }
    }
    // Chip erase with the key: removes the lock (erases flash and EEPROM)
    async eraseByKey() {
      await this.key(KEY_CHIPERASE);
      if (!(await this.ldcs(C.ASI_KEY_STATUS) & (1 << C.KEY_STATUS_CHIPERASE))) throw new UpdiError("Key not accepted");
      await this.reset(true);
      await this.reset(false);
      if (!(await this.waitUnlocked(500))) throw new UpdiError("Failed to chip erase using key");
    }
    async initLink() {
      await this.stcs(C.CS_CTRLB, 1 << C.CTRLB_CCDETDIS_BIT);
      await this.stcs(C.CS_CTRLA, 1 << C.CTRLA_IBDLY_BIT);
    }

    // Open the port, reset UPDI, read the SIB and enter programming mode
    // (identify() in megaupdi.py); a locked chip sets this.locked
    async connect() {
      await this.openMain();
      try {
        await this.doubleBreak();
        await this.initLink();
        if ((await this.ldcs(C.CS_STATUSA)) === 0) throw new UpdiError("No chip answers on UPDI. Check the wiring (TX and RX joined through a resistor to UPDI, GND, power).");
        if (await this.ldcs(C.ASI_SYS_STATUS) & (1 << C.SYS_STATUS_RSTSYS)) await this.reset(false);
        const sib = await this.readSib();
        if (sib === null) throw new UpdiError("The chip sent no valid System Information Block");
        this.sib = sib;
        this.sibFamily = sib.slice(0, 7).trim();
        this.nvmVersion = sib[10];
        if (!(this.nvmVersion in NVM_PARAMS)) throw new UpdiError(`Unsupported NVM controller version P:${this.nvmVersion} (SIB: ${sib.trim()})`);
        this.addr24 = this.nvmVersion !== "0";
        try {
          await this.enterProgMode();
        } catch (e) {
          if (!(e instanceof LockedError)) throw e;
          this.locked = true;
        }
      } catch (e) {
        try { await this.link.close(); } catch (x) { /* ignore */ }
        throw e;
      }
      return this;
    }

    // Unlock by chip erase and enter programming mode
    async unlock() {
      await this.eraseByKey();
      await this.initLink();
      await this.enterProgMode();
      this.locked = false;
      this.unlocked = true;
    }

    // Reset the chip, disable UPDI and close the port
    async exit() {
      await this.reset(true);
      await this.reset(false);
      await this.stcs(C.CS_CTRLB, (1 << C.CTRLB_UPDIDIS_BIT) | (1 << C.CTRLB_CCDETDIS_BIT));
      await this.link.close();
    }

    async readData(a, size) {
      if (size > C.MAX_REPEAT) throw new UpdiError("Can't read that many bytes in one go");
      await this.stPtr(a);
      if (size > 1) await this.repeat(size);
      return this.ldPtrInc(size);
    }
    async readDataWords(a, words) {
      if (words > C.MAX_REPEAT) throw new UpdiError("Can't read that many words in one go");
      await this.stPtr(a);
      if (words > 1) await this.repeat(words);
      return this.ldPtrInc16(words);
    }
    async writeDataWords(a, data) {
      if (data.length === 2) return this.st16(a, data[0] + (data[1] << 8));
      if (data.length > C.MAX_REPEAT << 1) throw new UpdiError("Invalid data length");
      await this.stPtr(a);
      await this.repeat(data.length >> 1);
      await this.stPtrInc16(data);
    }

    // Identify the chip by its signature (the signature row address depends on the family)
    async detect() {
      const candidates = "023".includes(this.nvmVersion) ? [0x1100, 0x1080] : [0x1080, 0x1100];
      const ids = [];
      for (const a of candidates) {
        const sig = await this.readData(a, 3);
        const id = (sig[0] << 16) | (sig[1] << 8) | sig[2];
        ids.push(id);
        const dev = DEVICES.find((d) => d.id === id && FAMILIES[d.family].sigrow === a);
        if (dev) {
          this.device = dev;
          this.family = FAMILIES[dev.family];
          this.familyKey = dev.family;
          this.signature = id;
          this.sigrow = a;
          this.flashSize = dev.flashSize;
          this.pageSize = dev.pageSize;
          return dev;
        }
      }
      throw new UpdiError(`Unknown or unsupported device (ID ${hex(ids[0], 6).toUpperCase().replace("0X", "0x")})`);
    }

    // Extra information for the chip panel (not in megaupdi.py)
    async readDetails() {
      this.revision = await this.ld(SYSCFG + 1);
      this.serial = isV0(this.familyKey) ? Array.from(await this.readData(this.sigrow + 3, 10)) : null;
      this.fuses = {};
      for (const f of fuseInfo(this.familyKey)) this.fuses[f.n] = await this.readFuse(f.n);
    }

    // Wait for the NVM controller, optionally remove the command afterwards
    async waitNvmReady(when, clear) {
      const [statusReg, errorMask] = NVM_PARAMS[this.nvmVersion];
      const start = this.now();
      let result = `Timeout waiting for NVM controller ${when}`;
      while (!(this.now() - start > 10000)) {
        const s = await this.ld(NVMCTRL + statusReg);
        if (s & errorMask) { result = `NVM controller error (STATUS ${hex(s, 2).toUpperCase().replace("0X", "0x")}) ${when}`; break; }
        if (!(s & C.NVM_BUSY_MASK)) { result = null; break; }
      }
      if (clear) await this.nvmCommand(C.NOCMD);
      if (result !== null) throw new UpdiError(result);
    }
    async nvmCommand(cmd) { await this.st(NVMCTRL + C.NVMCTRL_CTRLA, cmd); }

    async erase() {
      await this.waitNvmReady("before chip erase");
      if (this.nvmVersion === "0") {
        await this.nvmCommand(C.V0_CHIP_ERASE);
        await this.waitNvmReady("after chip erase");
      } else {
        await this.nvmCommand(C.CHIP_ERASE);
        await this.waitNvmReady("after chip erase", true);
      }
    }

    // Write a page (NVM controller variant according to the SIB)
    async writePage(a, page) {
      const v = this.nvmVersion;
      if (v === "0") {                                  // tinyAVR, megaAVR 0: page buffer
        await this.waitNvmReady("before page buffer clear");
        await this.nvmCommand(C.V0_PAGE_BUFFER_CLR);
        await this.waitNvmReady("after page buffer clear");
        await this.writeDataWords(a, page);
        await this.nvmCommand(C.V0_WRITE_PAGE);
        await this.waitNvmReady("after page write");
      } else if (NVM_PAGE_ORIENTED.includes(v)) {       // AVR EA, EB: page buffer
        await this.waitNvmReady("before page buffer clear");
        await this.nvmCommand(C.FLASH_PAGE_BUFFER_CLEAR);
        await this.waitNvmReady("after page buffer clear");
        await this.writeDataWords(a, page);
        await this.nvmCommand(C.FLASH_PAGE_WRITE);
        await this.waitNvmReady("after page write", true);
      } else {                                          // AVR DA, DB, DD, DU, ...: word write
        await this.waitNvmReady("before flash write");
        await this.nvmCommand(C.FLASH_WRITE);
        await this.writeDataWords(a, page);
        await this.waitNvmReady("after flash write", true);
      }
    }

    padded(data) {
      const len = Math.ceil(data.length / this.pageSize) * this.pageSize;
      const out = new Uint8Array(len).fill(0xff);
      out.set(data);
      return out;
    }

    async flashData(data, progress) {
      if (data.length > this.flashSize) throw new UpdiError("Not enough memory");
      const buf = this.padded(data), start = this.family.flashStart;
      for (let off = 0; off < buf.length; off += this.pageSize) {
        await this.writePage(start + off, buf.subarray(off, off + this.pageSize));
        if (progress) progress(Math.min(1, (off + this.pageSize) / buf.length));
      }
    }

    // Read the flash in blocks of up to 256 bytes
    async readFlash(offset, size, progress) {
      const out = new Uint8Array(size);
      const start = this.family.flashStart;
      let a = start + offset, pos = 0;
      const end = a + size;
      while (a < end) {
        const words = Math.min(C.READ_BLOCK, end - a + 1) >> 1;
        const r = await this.readDataWords(a, words);
        out.set(r.subarray(0, Math.min(r.length, size - pos)), pos);
        pos += words << 1;
        a += words << 1;
        if (progress) progress(Math.min(1, pos / size));
      }
      return out;
    }

    async verifyData(data, progress) {
      if (data.length > this.flashSize) throw new UpdiError("Not enough memory");
      const r = await this.readFlash(0, data.length, progress);
      for (let i = 0; i < data.length; i++) {
        if (r[i] !== data[i]) throw new UpdiError(`Flash verification failure at address ${hex(i, 4)}`);
      }
    }

    // Check fuse number and value for the detected device; returns warnings
    checkFuse(n, v) {
      const fam = this.family;
      if (!fam.fuseList.includes(n)) throw new UpdiError(`Fuse ${n} does not exist on this device (valid: ${fam.fuseList.join(", ")})`);
      const warn = [];
      const pin = fam.updiPin;
      if (pin && n === pin.fuse && !pin.values.includes((v & pin.mask) >> pin.shift)) warn.push(`Fuse ${n} disables the UPDI pin, further programming requires a HV programmer!`);
      if (this.nvmVersion === "0" && n === C.V0_FUSE_LOCKBIT && v !== C.V0_LOCKBIT_UNLOCKED) warn.push(`Fuse ${n} (LOCKBIT) locks the device, unlocking requires a chip erase!`);
      return warn;
    }

    readFuse(n) { return this.ld(this.family.fuses + n); }
    // Write one fuse value (NVM controller variant according to the SIB)
    async setFuse(n, value) {
      const a = this.family.fuses + n, v = this.nvmVersion;
      if (v === "0") {                                  // fuses are written by command
        await this.waitNvmReady("before fuse write");
        await this.st(NVMCTRL + C.V0_ADDRL, a & 0xff);
        await this.st(NVMCTRL + C.V0_ADDRH, (a >> 8) & 0xff);
        await this.st(NVMCTRL + C.V0_DATAL, value & 0xff);
        await this.nvmCommand(C.V0_WRITE_FUSE);
        await this.waitNvmReady("after fuse write");
      } else if (NVM_PAGE_ORIENTED.includes(v)) {       // EEPROM-based fuses (page buffer)
        await this.waitNvmReady("before fuse write");
        await this.nvmCommand(C.EEPROM_PAGE_BUFFER_CLEAR);
        await this.waitNvmReady("after page buffer clear");
        await this.st(a, value);
        await this.nvmCommand(C.EEPROM_PAGE_ERASE_WRITE);
        await this.waitNvmReady("after fuse write", true);
      } else {                                          // EEPROM-based fuses
        await this.waitNvmReady("before fuse write");
        await this.nvmCommand(C.EEPROM_ERASE_WRITE);
        await this.st(a, value);
        await this.waitNvmReady("after fuse write", true);
      }
    }
    async verifyFuse(n, v) {
      if ((await this.readFuse(n)) !== v) throw new UpdiError(`Fuse ${n} verification failure`);
    }

    // Oscillator for a system frequency on the detected device
    checkTrim(freq) {
      const t = oscillatorFor(freq);
      if (!t) throw new UpdiError("Unsupported frequency");
      if (!this.family.osc) throw new UpdiError("The oscillator frequency cannot be selected by fuse on this device");
      if (!(t.osc in this.family.osc.values)) throw new UpdiError(`The ${t.osc} MHz oscillator is not available on this device`);
      return t.osc;
    }
    // Value of the oscillator fuse for a frequency, from the current fuse value
    trimValue(freq, current) {
      const osc = this.checkTrim(freq), o = this.family.osc;
      return (current & ~o.mask & 0xff) | (o.values[osc] << o.shift);
    }
    async trim(freq) {
      const osc = this.checkTrim(freq), o = this.family.osc;
      const value = this.trimValue(freq, await this.readFuse(o.fuse));
      await this.setFuse(o.fuse, value);
      await this.verifyFuse(o.fuse, value);
      this.trimmed = { fuse: o.fuse, value };
      return osc;
    }
  }

  // The steps of megaupdi.py's main function.
  // a: { info, erase, flash (Uint8Array), fuses: [[n, value], ...], trim (Hz), device (name) }
  // The programmer must be connected; a locked chip is unlocked (erased) for erase and flash.
  async function runActions(prog, a, log, progress) {
    log = log || (() => {});
    try {
      if (prog.locked) {
        if (!(a.erase || a.flash)) throw new UpdiError("The chip is locked. Erase chip unlocks it (this erases flash and EEPROM).");
        log("The chip is locked, unlocking with chip erase …");
        await prog.unlock();
        log("The chip is unlocked.");
      }
      log("Detecting target MCU …");
      const dev = await prog.detect();
      log(`Found ${dev.name} with ${dev.flashSize.toLocaleString("en")} bytes of flash.`);
      if (a.device && a.device.toLowerCase() !== dev.name.toLowerCase()) throw new UpdiError(`Found device is not ${a.device}`);

      if (a.info) {
        await prog.readDetails();
        await prog.exit();
        return prog;
      }
      // Check everything device-specific before anything is erased or written
      if (a.flash && a.flash.length > prog.flashSize) throw new UpdiError(`Not enough memory (file: ${a.flash.length.toLocaleString("en")} bytes, flash: ${prog.flashSize.toLocaleString("en")} bytes)`);
      for (const [n, v] of a.fuses || []) for (const w of prog.checkFuse(n, v)) log("Warning: " + w);
      if (a.trim) prog.checkTrim(a.trim);

      if (a.erase || a.flash) {
        log("Performing chip erase …");
        await prog.erase();
      }
      if (a.flash) {
        log(`Flashing ${a.flash.length.toLocaleString("en")} bytes to ${dev.name} …`);
        await prog.flashData(a.flash, (f) => progress && progress("write", f));
        log("Verifying …");
        await prog.verifyData(a.flash, (f) => progress && progress("verify", f));
        log(`${a.flash.length.toLocaleString("en")} bytes written and verified.`);
      }
      if (a.fuses && a.fuses.length) {
        log("Writing fuses …");
        for (const [n, v] of a.fuses) await prog.setFuse(n, v);
        log("Verifying fuses …");
        for (const [n, v] of a.fuses) await prog.verifyFuse(n, v);
        log("Fuses written and verified.");
      }
      if (a.trim) {
        log(`Setting oscillator for ${a.trim.toLocaleString("en")} Hz …`);
        const osc = await prog.trim(a.trim);
        log(`Oscillator runs at ${osc} MHz with its factory calibration; the firmware sets the prescaler.`);
      }
      await prog.exit();
      return prog;
    } catch (err) {
      try { await prog.exit(); } catch (e) { /* port may be gone */ }
      throw err;
    }
  }

  global.UPDI = { FAMILIES, FAMILY_NAMES, DEVICES, BAUD, Programmer, UpdiError, runActions, fuseInfo, isV0, oscillatorFor, trimFrequencies };
})(typeof window !== "undefined" ? window : globalThis);
