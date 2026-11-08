# wagiminator.github.io

Personal page of wagiminator with links and small browser apps, published with GitHub Pages at <https://wagiminator.github.io/>. Web apps were built with Claude Opus 5.5.

## Structure

```
index.html              Start page (links, the "Web Apps" and the "Games" list)
assets/css/site.css     Shared styles and color tokens for all pages
assets/js/d64edit.js    Shared D64 disk library (editor and transfer app)
assets/js/serial-link.js  Shared Web Serial connection with timeouts (transfer apps)
assets/js/tap.js        Shared TAP tape library (read, write, decode, optimize)
assets/js/firmware.js   Shared BIN/HEX firmware file handling (programmer apps)
apps/
  _template/            Starting point for a new app (not published)
  d64-viewer/           C64 Disk Viewer
  d64-editor/           C64 Disk Editor
  d64-transfer/         C64 Disk Transfer
  tap-transfer/         C64 Tape Transfer
  cart-builder/         C64 Cartridge Builder
  gameconsole/          Game Console Flasher
  rvprog/               WCH RISC-V Programmer
  chprog/               WCH USB Programmer
  puyaisp/              PUYA ISP Programmer
  stm32isp/             STM32 ISP Programmer
  swdprog/              SWD Programmer
  serialupdi/           AVR Serial UPDI Programmer
  avrisp/               AVR ISP Programmer
  tinypro/              XGecu Memory Programmer
  serial-terminal/      Serial Terminal
  mt3608-sepic/         MT3608 SEPIC Voltage Calculator
  gerber-viewer/        Gerber Viewer
games/
  x-abyss/              X-Abyss (underwater shoot'em-up)
```

Every app lives in its own folder under `apps/` and is reachable at `https://wagiminator.github.io/apps/<app-name>/`. Apps are plain HTML, CSS and JavaScript without a build step and run entirely in the browser. Browser games live in the same way under `games/<game-name>/` and are listed under "Games" on the start page.

## Adding a new app

1. Copy `apps/_template/` to `apps/<app-name>/` (lower case, words separated by `-`).
2. Replace the placeholder name and description in `index.html` and write the app in `app.js` and `style.css`.
3. Add an entry to the "Web Apps" list in `/index.html`:
   ```html
   <li>
       <a href="apps/<app-name>/">App Name</a>
       <p>One sentence about what the app does.</p>
   </li>
   ```
4. Commit and push; GitHub Pages publishes the change within a minute or two.

Folders starting with `_` are not published by GitHub Pages (Jekyll), so the template stays private.

## Apps

### C64 Disk Viewer

Turns a Commodore 64 disk image into a picture of the floppy disk. Every ring is a track (track 1 outside), every segment a sector, and every byte is drawn as eight radial stripes, one per bit. The picture can be downloaded as PNG (1024, 2048 or 4096 pixels, black or transparent background).

- Supports 35, 40 and 42 track images, with or without error info (174,848 to 206,114 bytes).
- Colors: file data green, BAM and directory blue, free sectors gray, read errors red, tracks without BAM yellow. Extra tracks 36 to 40 use a SpeedDOS or DolphinDOS BAM if one is found.
- Shows the directory in C64 style; selecting a file highlights its sectors.
- Files are read locally with the FileReader API; nothing is uploaded.

Code: `d64.js` parses and draws the image (no dependencies), `app.js` is the user interface.

### C64 Disk Editor

Edits Commodore 64 disk images: add and remove files, arrange the directory, add separator lines, defragment and save.

- Starts with an empty disk; New disk creates 35 or 40 track (SpeedDOS) images, Open loads an existing .d64 (35, 40 or 42 tracks).
- Add files by button or drag and drop; PC64 files (.P00, .S00, .U00) keep their C64 name. Files can be extracted again.
- New files are placed like the 1541 DOS does it: starting on the free track nearest to the directory track 18 where the whole file fits, then sector by sector with the chosen interleave (10 = 1541 standard).
- Directory: reorder by drag and drop, buttons or Alt+arrow keys; separator lines are DEL entries without data. Names can contain C64 graphics characters, the number of blocks shown for separators can be set freely.
- Defragment rewrites all PRG, SEQ and USR files so that each one lies on consecutive tracks next to the directory. REL files and used sectors that belong to no file (custom loaders, copy protection) stay where they are.
- Shows blocks free, directory usage, split files and a sector map of the whole disk. Undo and redo for every change.
- Saved images have no error info.

Code: `/assets/js/d64edit.js` is the disk library (no dependencies, also runs in Node.js), `app.js` is the user interface.

### C64 Disk Transfer

Reads, writes and formats real floppy disks in a 1541 or 1541-II drive through a [DiskBuddy64](https://github.com/wagiminator/C64-Collection/tree/master/C64_DiskBuddy64), [DiskMaster64](https://github.com/wagiminator/C64-Collection/tree/master/C64_DiskMaster64) or [DumpMaster64](https://github.com/wagiminator/C64-Collection/tree/master/C64_DumpMaster64) adapter.

- Uses the Web Serial API, which Chrome, Edge and Opera offer on desktop computers (not Firefox, Safari or iOS).
- The browser asks once which USB device to use (filtered to the adapters' USB ids). After that the app reconnects by itself, identifies the adapter by asking for its name and looks for drives 8 to 11, including the drive model.
- Read disk (optionally only sectors used in the BAM, error info for unreadable sectors), write disk (optionally with read-back verify), format disk (bump, demagnetize, verify) and read the directory. A sector map shows the progress; long operations can be stopped after the current track.
- A disk that was read can be downloaded or opened directly in the Disk Editor or Disk Viewer.
- Not supported: the xu1541, which uses the OpenCBM USB protocol instead of a serial port.

Code: `adapter.js` is a port of the adapters' Python library (`software/pc/libs/adapter.py`) including both block transfer variants, `drivecode.js` contains the 6502 fast loaders that are uploaded into the drive, `app.js` is the user interface.

### C64 Tape Transfer

Reads cassettes from a Commodore Datasette into TAP files and writes TAP files back to tape through a [TapeBuddy64](https://github.com/wagiminator/C64-Collection/tree/master/C64_TapeBuddy64), [TapeDump64](https://github.com/wagiminator/C64-Collection/tree/master/C64_TapeDump64) (read only) or [DumpMaster64](https://github.com/wagiminator/C64-Collection/tree/master/C64_DumpMaster64). Opening, inspecting and optimizing TAP files also works without an adapter and in any browser.

- Uses the Web Serial API (Chrome, Edge, Opera on desktop). After the first connection the adapter is found and identified automatically.
- Pulse view: every pulse plotted by its length, live while reading and with a moving position mark while writing; zoom, drag and an overview of the whole tape. ROM loader pilot, header, data and damaged blocks are colored. Histogram of pulse lengths.
- Tape contents: files saved with the standard C64 ROM loader are decoded (name, type, addresses, size) and both copies are checked.
- Optimize (a subset of what [TAPClean](https://sourceforge.net/projects/tapclean/) does): remove glitches, join pauses, set ROM loader pulses to their ideal lengths, repair damaged ROM loader blocks from the other copy, and move the pulses of other loaders onto the centers of clearly separated length groups. Turbo loaders are not decoded individually.
- The Tapuino has no USB connection to a computer; TAP files prepared here can be copied to its SD card.

Code: `/assets/js/tap.js` is the TAP library (no dependencies, also runs in Node.js), `tapeadapter.js` is a port of the adapters' Python tape scripts, `app.js` is the user interface.

### C64 Cartridge Builder

Builds cartridge images for the [64k/256k](https://github.com/wagiminator/C64-Collection/tree/master/C64_Cartridge_64k_256k) and [512k](https://github.com/wagiminator/C64-Collection/tree/master/C64_Cartridge_512k) Magic Desk cartridges from one or more PRG files. A JavaScript port of the Magic Desk Cartridge Generator by Žarko Živanov (`crtgen.py` v3.0 as included in the C64 Collection), GPL v3.

- EPROM sizes 64 KB (27C512), 128 KB (27C010), 256 KB (27C020), 512 KB (27C040) and 1 MB (27C080).
- Add PRG files (or PC64 .P00) by button or drag and drop; rename, set start addresses, reorder (drag and drop, buttons, Alt+arrow keys) and remove them. Up to 8 menus (F1/F3/F5/F7/F2/F4/F6/F8) with up to 62 programs each; a single program can start without a menu (Single PRG modification by Feandreu).
- Shows free space, used banks and the size of the menu area, warns about programs that load where the cartridge copy routine or the I/O area is, and previews the menu screen.
- Downloads a BIN file for the EPROM and a CRT file (Magic Desk, hardware type 19) for VICE and other emulators.
- Not covered: the simple 8k cartridge, which has no bank switching and needs ready-made 8 KB ROM images instead of PRG files.

Code: `cartgen.js` creates the image (no dependencies, also runs in Node.js), `menucode.js` contains the C64 menu programs (sources in `source/`), `preview.js` draws the menu preview, `app.js` is the user interface.

### Game Console Flasher

Flashes the games of the [CH32V003 Mini Game Console](https://github.com/wagiminator/CH32V003-GameConsole) through a WCH-LinkE (or compatible) connected to the console's PROG header (VCC, GND, DIO).

- Games: Tiny Invaders, Lander, Tris, Arkanoid, Pacman, Doom, Boulder, Bubble, Karate, Run and Shooter from the game console repository, and Tiny RPG by Sergey Smirnov ([CH32V003-TinyRPG](https://github.com/fatalists/CH32V003-TinyRPG)), each with a short description and two screenshots. The selected game is kept in the address (`#tiny_run`), so a game can be linked directly.
- The firmware binaries and screenshots are loaded from the repository of each game (branch main) at raw.githubusercontent.com, with the jsDelivr mirror as fallback, so new versions of the games show up without changing this app.
- The game is written and verified with the programmer of the WCH RISC-V Programmer; the app refuses to flash anything but a CH32V003. Needs Chrome, Edge or Opera on a desktop computer, with the same driver setup as the WCH RISC-V Programmer.

Code: `games.js` holds the list of games and loads the binaries, `app.js` is the user interface; `../rvprog/rvprog.js`, `../rvprog/tables.js` and `/assets/js/firmware.js` are shared with the WCH RISC-V Programmer.

### WCH RISC-V Programmer

Flashes WCH RISC-V microcontrollers through a WCH-LinkE (also WCH-LinkW, WCH-LinkB and compatible programmers). A JavaScript port of [rvprog](https://github.com/wagiminator/MCU-Flash-Tools) v1.12 (MIT License) using the WebUSB API.

- Chips: CH32V002-V007, CH32M007, CH32V103, CH32V203/205/208, CH32V303/305/307/317, CH32V406/407/467, CH32H415/416/417, CH32X033/035, CH32X305/315, CH32L103, CH32M103, CH32M030, CH641, CH643, CH645, CH565/569, CH571/573, CH581-585, CH591/592. Unknown packages of a known family are flashed with the family settings.
- Flash BIN and Intel HEX files (written and verified), read chip info, erase, unlock (remove read protection), unbrick (power-cycle erase), lock, PD7 as GPIO or reset pin (CH32V00x, CH32M007; the setting is kept when the read protection changes), and switch the WCH-Link between RISC-V and ARM mode.
- Needs Chrome, Edge or Opera on a desktop computer. Same driver setup as rvprog: WinUSB via Zadig on Windows, udev rules on Linux. After switching from ARM to RISC-V mode the browser asks once more for the device, as it appears with a new USB id.

Code: `rvprog.js` is the programmer, `/assets/js/firmware.js` reads BIN and HEX files, `tables.js` holds the flash loaders and chip tables taken from rvprog.py, `app.js` is the user interface.

### WCH USB Programmer

Flashes WCH microcontrollers over USB with their factory bootloader (version 2.x), without a programmer. A JavaScript port of [chprog](https://github.com/wagiminator/MCU-Flash-Tools) v2.6 (MIT License) using the WebUSB API.

- Chips: CH543-CH549, CH551-CH559, CH563-CH569, CH570-CH579, CH581-CH585, CH591/592, CH643, CH32F103/203/205/207/208, CH32V103/203/208/303/305/307/317, CH32X033/035, CH32L103. Unknown types of a known family are flashed with the family's default settings, as chprog does.
- Flash BIN and Intel HEX files: the code flash is erased, written and verified, then the chip restarts. Read-protected chips are unlocked first (as chprog does), which erases them. Connect and read chip info shows type, bootloader version, flash sizes and unique ID without changing anything.
- Needs Chrome, Edge or Opera on a desktop computer. Windows needs the WinUSB driver (Zadig; the libusb-win32 driver used by chprog does not work in browsers), Linux the udev rules from chprog.
- Firmware whose length is not a multiple of 8 is padded with 0xFF bytes (as chprog does).

Code: `chprog.js` is the programmer, `tables.js` holds the chip table taken from chprog.py, `app.js` is the user interface.

### PUYA ISP Programmer

Flashes PUYA PY32 microcontrollers through a USB-to-serial converter and the UART bootloader built into the chip. A JavaScript port of [puyaisp](https://github.com/wagiminator/MCU-Flash-Tools) v1.5 (MIT License) using the Web Serial API (115200 baud by default, 8E1) and, for chips with a USB HID bootloader, the WebHID API.

- Chips: PY32F002A/F003/F030 (bootloader PID 0x440), PY32F07x/F040 (PID 0x448) and PY32F403/F303 (PID 0x413); other PIDs can be flashed, but their option bytes are not read or changed. The PY32F002B and PY32L020 have no UART bootloader.
- Flash BIN and Intel HEX files to 0x08000000: the chip is erased, written, verified byte by byte and started. Optionally lock the chip and set the nRST pin as GPIO or RESET afterwards.
- Chip actions: read chip info (bootloader version, option bytes OPTR/SDKR/WRPR, read protection, nRST mode; the PY32F403/F303 has no configurable nRST pin), erase, unlock (removes the read protection and erases the chip), lock, nRST as GPIO or RESET, reset the option bytes.
- With a CH340X converter whose DTR and RTS lines are wired to BOOT0 and nRST, the bootloader is started and the chip reset automatically, using the same control-line sequence as puyaisp.
- Needs Chrome, Edge or Opera on a desktop computer.

Code: `puyaisp.js` is the programmer, `app.js` is the user interface; `/assets/js/serial-link.js` and `/assets/js/firmware.js` are shared with other apps.

### STM32 ISP Programmer

Flashes STM32 microcontrollers through a USB-to-serial converter and the factory UART bootloader (protocol of ST's AN3155). A JavaScript port of [stm32isp](https://github.com/wagiminator/MCU-Flash-Tools) v1.0 (MIT License) using the Web Serial API (115200 baud by default, 8E1; the bootloader detects the rate).

- Chips: the 71 lines of stm32isp: STM32C0 (C011/031/051/071/091/092), F0, F1 (low/medium/high/XL density, value and connectivity line), F2, F3, F4 (F401 to F479), F7, G0, G4, H5 (H503/563/573), H7 (H72x to H7B3), L0, L1 (all categories), L4 (L41x to L4Sx), L5, U5 (U535 to U5A9), WB and WL. The chip is recognized by the product ID of its bootloader, the flash size is read from the chip (if the register cannot be read, or the family has none, the largest member of the line is assumed).
- Flash BIN and Intel HEX files to 0x08000000: a locked chip is unlocked first, the chip is erased (mass erase; page by page on STM32L0/L1, which have no mass erase), padded to the programming width (8 bytes, 16 on H5/U5, 32 on H7), written in blocks of 256 bytes, verified byte by byte and started. Optionally lock the chip afterwards. On STM32C0/G0 the BOOT0 pin is enabled in the option bytes (nBOOT_SEL = 0) after flashing as stm32isp does (can be switched off).
- Chip actions: read chip info (bootloader version, product ID, commands, flash size, read protection, option bytes), erase, unlock (removes the read protection and erases the chip), lock (read protection level 1), read the flash into a BIN file, enable the BOOT0 pin (STM32C0/G0), remove the write protection.
- In addition to stm32isp, the Erase action on STM32L0/L1 erases all pages of the chip as read from its flash size register.
- With a converter whose RTS and DTR lines are wired to nRST and BOOT0, the bootloader is started and the chip reset automatically.
- Needs Chrome, Edge or Opera on a desktop computer.

Code: `stm32isp.js` is the programmer with the chip table, `app.js` is the user interface; `/assets/js/serial-link.js` and `/assets/js/firmware.js` are shared with other apps.

### SWD Programmer

Flashes STM32, PUYA PY32 and Microchip ATSAMD microcontrollers over SWD with a CMSIS-DAP (DAPLink, Raspberry Pi Debug Probe, WCH-LinkE in DAP mode …), ST-Link or SEGGER J-Link. A JavaScript port of [tinyOCD](https://github.com/wagiminator/MCU-Flash-Tools) v1.0 (MIT License) using the WebUSB API (CMSIS-DAP v2, ST-Link V2/V2-1/V3, J-Link) and the WebHID API (CMSIS-DAP v1). The flash memory is written by tinyOCD's generic flash loader, which runs in the RAM of the chip.

- Chips: the 81 STM32 lines of tinyOCD (C0, F0, F1, F2, F3, F4, F7, G0, G4, H5, H7, L0, L1, L4, L4+, L5, U0, U3, U5, WB, WBA, WL), PY32F002A/F003/F030, PY32F002B, PY32F071/F072 (and compatible, e.g. AIR001), ATSAMD09/10/11/20/21, ATSAMDA1, ATSAML21/22, ATSAMC20/21, ATSAMD51 and ATSAME51/53/54. The programmer is recognized from its USB descriptors, the chip from CPUID, DBGMCU_IDCODE or DSU DID; the flash size is read from the chip.
- Flash BIN and Intel HEX files (BIN files to 0x08000000 on STM32/PY32, to 0 on ATSAMD): a locked chip is unlocked first (can be switched off), the chip is erased, written, verified byte by byte, reset and started. Optionally enable the BOOT0 pin and lock the chip afterwards. Dual-bank chips (F1 XL, H7) are written bank by bank. A chip whose SWD pins are disabled is connected under reset (NRST).
- Chip actions: read chip info, erase, unlock (removes the read protection or the ATSAMD security bit and erases the chip), lock, enable the BOOT0 pin (option bytes nBOOT_SEL/nSWBOOT0/nBOOT1/BOOT_SEL as tinyOCD's `-B`), NRST pin as GPIO or reset pin (`-G`/`-R`), read the flash into a BIN file, SWD clock from 100 kHz to 8 MHz.
- In addition to tinyOCD: on ATSAMD chips with a bootloader protected by the BOOTPROT fuse (e.g. Arduino boards), firmware that starts after the bootloader (a HEX file, or a BIN file with the protected area empty) is written and verified around the bootloader instead of failing; the flash can be read into a file.
- Needs Chrome, Edge or Opera on a desktop computer. On Windows a J-Link needs the WinUSB driver (J-Link Configurator or Zadig); on Linux the udev rules shown in the app.

Code: `swd.js` holds the probes (CMSIS-DAP, ST-Link, J-Link), the target control, the flash drivers, the chip tables and the flash loader; `app.js` is the user interface; `/assets/js/firmware.js` is shared with other apps.

### AVR Serial UPDI Programmer

Programs all AVR microcontrollers with UPDI through a USB-to-serial converter on their UPDI pin (TXD and RXD joined through a 470 Ω to 1 kΩ resistor). A JavaScript port of [megaupdi](https://github.com/wagiminator/MCU-Flash-Tools) v1.0 (MIT License, based on TinyUPDI, pyupdi, pymcuprog and the serialupdi programmer of AVRDUDE) using the Web Serial API: double break at 300 baud, then UPDI at 230400 baud 8E2 (lower rates selectable).

- Chips: the 133 AVRs of megaupdi's device table, detected by their signature: tinyAVR 0/1/2-series (ATtiny202 to ATtiny3227), megaAVR 0-series (ATmega808 to ATmega4809), AVR DA (also DA-S), DB, DD, DU, EA, EB, EC, LA and SD. The NVM controller variant is taken from the System Information Block (P:0 with 16-bit addresses, P:2 to P:6 with 24-bit addresses).
- Flash BIN and Intel HEX files: chip erase, page or word writes as the NVM controller needs, verify. EEPROM and fuse sections in HEX files (0x810000 and up) are skipped with a note. EEPROM, user row, boot row and the lock bits of the AVR Dx/Ex/Lx/Sx are not programmed; high-voltage UPDI activation is not supported.
- Clock: chooses the 16 or 20 MHz oscillator (fuse OSCCFG) for every frequency megaupdi's `-t` accepts (oscillator divided by 1, 2, 4, 6, 8, 10, 12, 16, 24, 32, 48 or 64) on the families that select it by fuse (tinyAVR, megaAVR 0, AVR EA, EB, LA); only the oscillator bits of the fuse are changed.
- Fuses: reads and shows the fuses of the detected family with their meaning, writes and verifies the changed ones. Settings that turn the UPDI pin into a normal pin, lock the chip (LOCKBIT) or change PDICFG need a confirmation. Fuses and clock can be written together with the firmware.
- Read chip info shows type, family, signature, flash and page size, NVM controller, revision and (tinyAVR, megaAVR 0) serial number. Erase chip also unlocks a locked chip.
- Needs Chrome, Edge or Opera on a desktop computer.

Code: `updi.js` is the programmer with the device table, `app.js` is the user interface; `/assets/js/serial-link.js` and `/assets/js/firmware.js` are shared with other apps.

### AVR ISP Programmer

Programs classic AVR microcontrollers over ISP with a USBasp or a USBtinyISP. A JavaScript port of the relevant parts of [avrdude](https://github.com/avrdudes/avrdude) 8.3 (`usbasp.c`, `usbtiny.c`, and the memory algorithms of `avr.c`, `update.c` and `main.c`) using the WebUSB API. Because it is derived from avrdude, the files of this app (`apps/avrisp/`) are licensed under the GNU General Public License v2.0 or later.

- Chips: the 175 AVRs of avrdude.conf with ISP and paged flash (ATtiny, ATmega, AT90, ATA…), detected by their signature; chips that share a signature can be chosen. Not supported: TPI chips (ATtiny4/5/9/10/20/40), AVRs without paged flash (AT90S, ATtiny12/15/22, AT89S51/52) and UPDI/PDI chips.
- Flash BIN and Intel HEX files like `avrdude -U flash:w:file`: chip erase, paged write of all pages with data (partly used pages are filled with the chip's content), verify of every byte from the file. Trailing 0xFF bytes are skipped as avrdude does. Unlike avrdude, files larger than the flash are refused instead of being cut off silently.
- Chip erase, reading signature, fuses, lock bits and calibration.
- Fuse editor: every fuse and lock byte of the chip with its bit fields and their meanings (from avrdude's avrintel.c), factory defaults, writes like `avrdude -U lfuse:w:0x..:m` with read-back and verify. Settings that disable the reset pin, enable debugWIRE, select an external clock or lock the chip need a confirmation.
- ISP clock: USBasp SCK from 500 Hz to 3 MHz or automatic, USBtinyISP SCK period from 1 to 250 µs (like `-B`).
- Needs Chrome, Edge or Opera on a desktop computer; on Windows the programmer needs the WinUSB driver (Zadig), on Linux a udev rule.

Code: `avrisp.js` is the programmer, `parts.js` holds the part data generated from avrdude.conf, `fusebits.js` the fuse fields generated from avrintel.c, `app.js` is the user interface.

### XGecu Memory Programmer

Reads, writes and verifies EPROMs, EEPROMs and flash memory with the XGecu TL866A, TL866CS, TL866II+ and T48 universal programmers. A JavaScript port of [tinyPro](https://github.com/wagiminator/MCU-Flash-Tools) v1.0, itself a port of the relevant parts of [minipro](https://gitlab.com/DavidGriffith/minipro) (programmer protocols of `tl866a.c`, `tl866iiplus.c` and `t48.c`, memory algorithms of `main.c`), using the WebUSB API. Because it is derived from minipro, the files of this app (`apps/tinypro/`) are licensed under the GNU General Public License v3.0 or later.

- Chips: all memory chips of minipro's infoic.xml (22,183 names for the TL866II+/T48, 12,735 for the TL866A/CS): parallel EPROMs, EEPROMs and flash, SPI flash, I2C and Microwire EEPROMs, DataFlash, FWH/LPC flash. Chips only supported by some programmers are marked. Not supported: MCUs, PLDs/GALs, logic tests, SRAM tests, NAND, ICSP and the T56 (which needs FPGA algorithm files).
- The programmer is detected from its system info (model, firmware with an update warning, T48 supply voltage). The chip is chosen with a search field with suggestions (part of the name, or `*`/`?` wildcards); an SPI flash is detected by its JEDEC ID (8 pin, then 16 pin), with the compatible names to choose from. The chip ID is checked when the chip has one (can be ignored).
- Shows how the chip goes into the ZIF socket: DIP chips at the top of the socket, next to the lever, with pin 1 in socket pin 1 (drawing with the socket pins used), package-to-DIP adapters for SOIC/SOP/TSSOP/WSON… and PLCC, and the XGecu adapter for TSOP/SOP44/SOP56 chips (checked on the TL866A/CS and TL866II+, as minipro does).
- Read (BIN file), write BIN or Intel HEX files (erase first if electrically erasable, padding to the write block with the blank value, verify-while-write status, then verify), verify, blank check, erase, write protection off before / on after writing, code or data memory.
- Needs Chrome, Edge or Opera on a desktop computer. On Windows the TL866II+ and T48 work with the XGecu driver, the TL866A/CS needs WinUSB (Zadig); on Linux the udev rules shown in the app.

Code: `tinypro.js` holds the programmer protocols, the memory operations and the chip database functions, `chips.js` the chip database (gzip and base64, generated from minipro's infoic.xml as in tinypro.py), `app.js` is the user interface; `/assets/js/firmware.js` is shared with other apps.

### Serial Terminal

Talks to a microcontroller through a USB-to-serial converter (CH340, CP210x, FTDI, PL2303) or a USB CDC device using the Web Serial API.

- Connection: baud rate (common rates to choose from or any value from 50 to 4,000,000), data bits, parity, stop bits and RTS/CTS flow control. Changing a setting while connected reopens the port. Known converters are named by their USB IDs.
- Control lines: DTR and RTS switches and a reset pulse for Arduino-style (DTR) and ESP32-style (RTS/DTR) auto reset circuits.
- Display: UTF-8 text (CR, LF and CR+LF start a new line, other control characters are shown by name, ANSI color codes are removed) or hex dump with ASCII column, optional timestamps, sent data in a different color. Switching the view redraws the received data. Keeps the last 10,000 lines; Save downloads them as a text file, Clear (Ctrl+L) empties the terminal.
- Send line: text with a selectable line ending (none, LF, CR, CR+LF) or hex bytes, Enter sends, ↑/↓ recall the last 50 sent lines.
- Settings and the send history are remembered in the browser. Needs Chrome, Edge or Opera on a desktop computer.

Code: `app.js` (no dependencies).

### Gerber Viewer

Shows the top and bottom side of a printed circuit board from its Gerber and drill files. Everything runs in the browser; no file is uploaded.

- Input: a ZIP archive (as exported by EasyEDA, KiCad, Eagle, Altium and others) or the single Gerber and drill files, by file dialog or drag and drop. Layers are recognized by Gerber X2 file attributes, by the usual file extensions (GTL, GBL, GTS, GBS, GTO, GBO, GKO, GM1, DRL, …) and by common file names; the assignment of every file can be corrected by hand.
- Reads Gerber RS-274X (standard and macro apertures, arcs, regions, polarity, step and repeat) and Excellon drill files (inch and metric, zero suppression, slots). The board shape comes from the outline layer; without one, the extents of all layers are used.
- Looks: solder mask color as offered by JLCPCB (green, purple, red, yellow, blue, white, black), silkscreen white or black (chosen to match the mask color automatically), surface finish HASL (tin), ENIG (gold) or bare copper. Copper under the solder mask shows as lighter traces, holes are see-through, the bottom side is shown as seen from below.
- Download: each side as a PNG with a transparent background at 300, 600 or 1200 dpi (limited to about 50 megapixels).

Code: `gerber.js` reads ZIP archives, recognizes layers, parses Gerber and Excellon files and draws the board, `app.js` is the user interface (no dependencies).

## Games

### X-Abyss

Underwater shoot'em-up as a homage to the Amiga classic X-Out (Rainbow Arts, 1990). All graphics are drawn by code, music and sound effects are synthesized with the Web Audio API.

- Four stages (Coral Shelf, Wreck Graveyard, Magma Vents, The Hive), each with its own boss, and a shipyard between the stages: four main weapons with four power levels, satellites with five formations, homing missiles, depth charges, rear and side guns, shield, armour, turbo engine, nova bombs, repairs and extra ships.
- Large particle explosions with shock waves, debris, smoke and bubbles; tracker-style soundtrack.
- Keyboard, mouse and gamepad controls, fullscreen mode (F).
- Top 10 highscore list stored in the browser; entering a name is optional.

Code: `js/world.js` (stages, weapons, enemies, bosses), `js/gfx.js` (sprites, backgrounds, particles), `js/audio.js` (music and sound), `js/ui.js` (screens, shipyard, HUD), `js/main.js` (main loop); see `games/x-abyss/README.md`.
