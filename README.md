# wagiminator.github.io

Personal page of wagiminator with links and small browser apps, published with GitHub Pages at <https://wagiminator.github.io/>.

## Structure

```
index.html              Start page (links and the "Web Apps" list)
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
  rvprog/               WCH RISC-V Programmer
  chprog/               WCH USB Programmer
  puyaisp/              PUYA ISP Programmer
  tinyupdi/             AVR Tiny UPDI Programmer
  mt3608-sepic/         MT3608 SEPIC Voltage Calculator
mt3608_sepic.html       Redirect for the calculator's old address
```

Every app lives in its own folder under `apps/` and is reachable at `https://wagiminator.github.io/apps/<app-name>/`. Apps are plain HTML, CSS and JavaScript without a build step and run entirely in the browser.

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
- Tested: the BIN files are byte-identical to the ones `crtgen.py` creates for the same programs and settings, the CRT files are byte-identical to `cartconv -t md` from VICE.
- Not covered: the simple 8k cartridge, which has no bank switching and needs ready-made 8 KB ROM images instead of PRG files.

Code: `cartgen.js` creates the image (no dependencies, also runs in Node.js), `menucode.js` contains the C64 menu programs (sources in `source/`), `preview.js` draws the menu preview, `app.js` is the user interface.

### WCH RISC-V Programmer

Flashes WCH RISC-V microcontrollers through a WCH-LinkE (also WCH-LinkW, WCH-LinkB and compatible programmers). A JavaScript port of [rvprog](https://github.com/wagiminator/MCU-Flash-Tools) (MIT License) using the WebUSB API.

- Chips: CH32V002-V007, CH32V103, CH32V203/205/208, CH32V303/305/307/317, CH32X033/035, CH32L103, CH571/573, CH581/582/583, CH591/592.
- Flash BIN and Intel HEX files (written and verified), read chip info, erase, unlock (remove read protection), unbrick (power-cycle erase), lock, PD7 as GPIO or reset pin (CH32V00x), and switch the WCH-Link between RISC-V and ARM mode.
- Needs Chrome, Edge or Opera on a desktop computer. Same driver setup as rvprog: WinUSB via Zadig on Windows, udev rules on Linux. After switching from ARM to RISC-V mode the browser asks once more for the device, as it appears with a new USB id.
- Tested against a simulated WCH-Link: for all actions the USB traffic is byte-identical to rvprog.py.

Code: `rvprog.js` is the programmer, `/assets/js/firmware.js` reads BIN and HEX files, `tables.js` holds the flash loaders and chip tables taken from rvprog.py, `app.js` is the user interface.

### WCH USB Programmer

Flashes WCH microcontrollers over USB with their factory bootloader (version 2.x), without a programmer. A JavaScript port of [chprog](https://github.com/wagiminator/MCU-Flash-Tools) (MIT License) using the WebUSB API.

- Chips: CH543-CH549, CH551-CH559, CH563-CH569, CH570-CH579, CH581-CH583, CH591/592, CH643, CH32F103/203/205/207/208, CH32V103/203/208/303/305/307, CH32X033/035, CH32L103.
- Flash BIN and Intel HEX files: the code flash is erased, written and verified, then the chip restarts. Read-protected chips are unlocked first (as chprog does), which erases them. Connect and read chip info shows type, bootloader version, flash sizes and unique ID without changing anything.
- Needs Chrome, Edge or Opera on a desktop computer. Windows needs the WinUSB driver (Zadig; the libusb-win32 driver used by chprog does not work in browsers), Linux the udev rules from chprog.
- Firmware whose length is not a multiple of 8 is padded with 0xFF bytes. chprog.py v2.5.3 appends the text "0xff" instead (`b'0xff'` instead of `b'\xff'` in `writeflash`).
- Tested against a simulated bootloader: the USB traffic is byte-identical to chprog.py (with that padding fixed for unaligned lengths).

Code: `chprog.js` is the programmer, `tables.js` holds the chip table taken from chprog.py, `app.js` is the user interface.

### PUYA ISP Programmer

Flashes PUYA PY32 microcontrollers through a USB-to-serial converter and the UART bootloader built into the chip. A JavaScript port of [puyaisp](https://github.com/wagiminator/MCU-Flash-Tools) v1.4 (MIT License) using the Web Serial API (115200 baud by default, 8E1) and, for chips with a USB HID bootloader, the WebHID API.

- Chips: PY32F0xx (PY32F002A/B, PY32F003, PY32F030, bootloader PID 0x440) and PY32F07x/F040 (PID 0x448); other PIDs can be flashed, but their option bytes are not changed.
- Flash BIN and Intel HEX files to 0x08000000: the chip is erased, written, verified byte by byte and started. Optionally lock the chip and set the nRST pin as GPIO or RESET afterwards.
- Chip actions: read chip info (bootloader version, option bytes OPTR/SDKR/WRPR, read protection, nRST mode), erase, unlock (removes the read protection and erases the chip), lock, nRST as GPIO or RESET, reset the option bytes.
- With a CH340X converter whose DTR and RTS lines are wired to BOOT0 and nRST, the bootloader is started and the chip reset automatically, using the same control-line sequence as puyaisp.
- Differences to puyaisp.py: verification compares every byte (puyaisp.py compares only the sets of byte values, `set(flash) != set(data)`, so swapped or repeated bytes pass); the bootloader version shows the full low nibble (`ver & 0x0f` instead of `ver & 7`); a NACK on the sync byte counts as "already synchronized", so a chip that stayed in bootloader mode (after Read chip info) needs no reset before the next action.
- Needs Chrome, Edge or Opera on a desktop computer.
- Tested against a simulated PY32 bootloader: bytes and control-line changes are identical to puyaisp.py for serial and HID transports.

Code: `puyaisp.js` is the programmer, `app.js` is the user interface; `/assets/js/serial-link.js` and `/assets/js/firmware.js` are shared with other apps.

### AVR Tiny UPDI Programmer

Programs tinyAVR 0-, 1- and 2-series microcontrollers through a USB-to-serial converter on their UPDI pin (TXD and RXD joined through a 470 Ω to 1 kΩ resistor). A JavaScript port of [tinyupdi](https://github.com/wagiminator/MCU-Flash-Tools) v1.5 (MIT License, based on pyupdi and pymcuprog) using the Web Serial API: double break at 300 baud, then UPDI at 230400 baud 8E2 (lower rates selectable).

- Chips: the 37 tinyAVRs of tinyupdi's device table, ATtiny202 to ATtiny3227, detected by their signature.
- Flash BIN and Intel HEX files: chip erase, page writes, verify. EEPROM and fuse sections in HEX files (0x810000 and up) are skipped with a note.
- Clock: chooses the 16 or 20 MHz oscillator (fuse OSCCFG) for every frequency tinyupdi's `-t` accepts (oscillator divided by 1, 2, 4, 6, 8, 10, 12, 16, 24, 32, 48 or 64).
- Fuses: reads and shows all fuses with their meaning, writes and verifies the changed ones. Settings that turn the UPDI pin into GPIO/RESET (SYSCFG0) or lock the chip (LOCKBIT) need a confirmation. Fuses and clock can be written together with the firmware.
- Read chip info shows type, series, signature, flash and page size, revision and serial number. Erase chip also unlocks a locked chip.
- Differences to tinyupdi.py: the last flash page is padded with 0xFF to the full page size (tinyupdi.py pads by `len(data) % pagesize` bytes instead of `-len(data) % pagesize`, so it writes up to a page of 0xFF beyond the data and, for files that nearly fill the flash, past its end); a locked chip is only erased (unlocked) for erase and flash, while tinyupdi.py erases it on every connection, even for fuse writes; after unlocking, programming mode is entered if it is not already active.
- Needs Chrome, Edge or Opera on a desktop computer.
- Tested against a simulated tinyAVR with one-wire echo: the serial traffic is byte-identical to tinyupdi.py (with the padding fixed for lengths that are not a multiple of the page size).

Code: `updi.js` is the programmer, `app.js` is the user interface; `/assets/js/serial-link.js` and `/assets/js/firmware.js` are shared with other apps.
