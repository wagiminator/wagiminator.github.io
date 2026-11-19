# wagiminator.github.io

Personal page of wagiminator with links and small browser apps, published with GitHub Pages at <https://wagiminator.github.io/>. Web apps were built with Claude Opus 5.5.

## Structure

```
index.html              Start page: web apps, games, hardware projects with search, links
assets/home/            Start page only: home.css, home.js (project search), favicon,
                        img/projects/ and img/games/ (480x300 WebP thumbnails)
assets/css/site.css     Shared styles and color tokens for the apps
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
  c64-emulator/         C64 Emulator (CPU, VIC-II, SID, CIAs, 1541 drive, datasette)
  sid-player/           C64 SID Player (music player and analyser)
  sid-tracker/          C64 SID Tracker (composing SID music)
  pixel-studio/         C64 Pixel Studio (sprites, characters, levels, bitmaps)
  c64-assembler/        C64 Assembler (6502 editor, assembler and debugger)
  c64-packer/           C64 Packer (Exomizer and TSCrunch formats, tape images)
  gameconsole/          Game Console Flasher
  rvprog/               WCH RISC-V Programmer
  chprog/               WCH USB Programmer
  puyaisp/              PUYA ISP Programmer
  stm32isp/             STM32 ISP Programmer
  swdprog/              SWD Programmer
  serialupdi/           AVR Serial UPDI Programmer
  avrisp/               AVR ISP Programmer
  tinypro/              XGecu Memory Programmer
  hex-editor/           Hex Editor (BIN, Intel HEX, S-record, UF2, ELF)
  serial-terminal/      Serial Terminal
  oscilloscope/         USB Oscilloscope (Hantek 6022BE/BL, DSO-6021, DSO-2020, DDS120)
  signal-analyzer/      Signal Analyzer (logic analyzer for Pico, FX2 and sound card)
  power-analyzer/       Power Analyzer (control program for the ATtiny814 Power Analyzer)
  power-profiler/       Power Profiler (for the Nordic Power Profiler Kit II)
  calculators/          Electronics Calculators (regulators, resistors, MCU timing, PCB)
  mt3608-sepic/         redirect to the MT3608 calculator in calculators/
  gerber-viewer/        Gerber Viewer
  interactive-bom/      Interactive BOM (parts list and board picture for hand soldering)
games/
  ironfall/             Ironfall (run-and-gun action platformer)
  x-abyss/              X-Abyss (underwater shoot'em-up)
  primordia/            Primordia (vertical shoot'em-up)
  sunset-highway/       Sunset Highway (arcade road racer)
  dreamhop/             DREAMHOP (jump-and-run)
  deep-diner/           Deep Diner (eat-and-grow game)
  bubble-puff/          Bubble Puff (bubble-blowing platformer)
  alien-armada/         Alien Armada (alien-invasion shooter)
  garden-siege/         Garden Siege (tower-defense garden game)
  feather-frenzy/       Feather Frenzy (grouse-shooting arcade game)
  starlane-command/     Starlane Command (real-time fleet command game)
  mossling-march/       Mossling March (Lemmings-style puzzle game)
  mole-mayhem/          Mole Mayhem (turn-based artillery game)
  pearl-panic/          Pearl Panic (marble-shooting puzzle game)
  woolly-wallop/        Woolly Wallop (slingshot physics game)
  starhaul/             Starhaul (3D space trading and combat game)
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

### C64 Emulator

A Commodore 64 (PAL) emulator written from scratch in plain JavaScript, no build step and no external libraries.

- 6510 CPU with all undocumented opcodes (passes Klaus Dormann's 6502 functional test), cycle-based VIC-II (bad lines, sprites with expansion, priorities and collisions, raster interrupts, border flip-flops, all graphics modes), two CIAs with timers and time-of-day clock, SID 6581/8580 with ADSR, ring modulation, sync and filter.
- Media: PRG, P00, D64 (35/40 tracks, with error bytes), G64, T64, TAP (version 0/1), CRT (normal 8K/16K/Ultimax, Ocean, Magic Desk, Fun Play, Super Games, System 3, Dinamic, Simons' BASIC, Epyx FastLoad, EasyFlash) and ZIP archives (several disks become a disk menu). Drop a file and it starts by itself.
- Real 1541 drive emulation (6502, both VIAs, GCR bit stream with SYNC and BYTE READY, stepper motor, writing) when the 1541 DOS ROM is loaded. Without it, a virtual drive is used: LOAD and SAVE go directly to the disk image, and the serial bus protocol, the command channel (`M-W`, `M-R`, `M-E`, `U3`-`U8`, status) and the DOS job queue are emulated in JavaScript, so drive code uploaded by a program runs on the emulated 1541 hardware and most drive-based fast loaders work. Changed disks can be downloaded as D64/G64.
- Datasette with PLAY/STOP/REWIND and motor control, for normal and turbo tapes. Programs in the standard KERNAL format are read from the TAP image at once; the tape then continues behind them, so turbo loaders read their data in real time.
- Keyboard mapped by character (type what you see), on-screen C64 keys, joystick on the numpad, the arrow keys or W/A/S/D, up to two gamepads, port swap, text pasting into the keyboard buffer.
- Sound through an AudioWorklet that also paces the emulation, fullscreen, warp mode, save/load state, sharp or smooth pixels, small border, and an option that keeps the screen saver off while the emulator runs.
- Monitor and debugger below the screen: break, step, step over, step out, next raster line, next frame and run to a selected line; breakpoints on addresses, memory reads and writes (also ranges) and raster lines, and optionally on IRQ, NMI, BRK and CPU jams. Disassembly with all undocumented opcodes and labels for the KERNAL jump table and the I/O registers, editable registers and flags, the stack with return addresses, memory with the C64 character set (editable), a VIC/CIA/SID overview, the last 4,096 executed instructions, and a VICE-style command line (`m`, `d`, `a`, `r`, `f`, `h`, `c`, `t`, `g`, `z`, `n`, `break`, `watch`, `save` and more). The checks around every instruction run only while the debugger is open.
- Sprite viewer: every sprite the VIC-II fetched in the last frame, also sprites reused further down the screen (multiplexing), with position, colours, mode and expansion; a collection of every different sprite image while a game runs; all 256 sprite slots of a VIC bank in hires or multicolour. Sprites (single, all collected or a whole bank) can be saved as PNG (1× to 8×, transparent), as raw 64-byte data or as assembler source.
- Character set viewer: the character sets the screen uses in this frame (also several, when a game switches them further down the screen) in the colours of the screen, with the characters in use marked and counted; any character set in memory or the character ROM in hires or multicolour. A character set or a single character can be saved as PNG, raw data, a .64c file with load address or assembler source.
- Music tools: record what the SID plays as a WAV file (also with the sound off), or rip the tune of the running program as a PSID file. The ripper follows the call stack of every SID write to find the play routine (the outermost subroutine that leads to all of them and does nothing else with the hardware), records what it executes, reads and writes and how often it is called, and saves the player memory right after a call together with a small init routine that restores the zero page, the SID registers and, for faster tunes, the CIA timer; the tune goes on from that moment.
- System ROMs: the free [MEGA65 Open ROMs](https://github.com/MEGA65/open-roms) (LGPL 3, in `roms/`) are built in. They run most games, but their BASIC is incomplete; a small bug in their serial output (`CIOUT`) is patched when they are loaded. The original KERNAL, BASIC, character and 1541 ROMs can be loaded once and are kept in the browser's IndexedDB; they are not part of this repository.

Code: `emu/cpu6502.js`, `emu/vic.js`, `emu/sid.js`, `emu/cia.js`, `emu/c64.js` (memory map, scheduler, fast loader), `emu/drive1541.js` (1541 with VIAs), `emu/media.js` (image formats, GCR), `emu/tape.js`, `emu/cart.js`, `emu/disasm.js` (disassembler and assembler); `app.js` is the user interface, `debugger.js` the monitor and debugger, `sprites.js` the sprite viewer, `charset.js` the character set viewer, `music.js` and `emu/sidrip.js` the WAV recorder and SID ripper. The emulator core also runs in Node.js.

### C64 SID Player

A player and analyser for C64 music (PSID and RSID files, versions 1 to 4), running the tunes on the C64 emulator core of the C64 Emulator app.

- PSID tunes are played like SIDPLAY does: the player calls their init and play routines on the screen interrupt (50/60 Hz) or the CIA timer. RSID tunes run in a full C64 environment (Open ROMs, CIAs, VIC-II) with their own interrupts, including BASIC programs. Tunes for two or three SIDs (PSID v3/v4) are supported; PAL and NTSC clocks, SID model 6581/8580 from the file or chosen by hand.
- A live oscilloscope for every voice (triggered on rising edges, about three periods wide), with note name, waveform, gate/sync/ring/test bits, pulse width, envelope level and ADSR; filter cutoff, resonance, mode and volume per chip.
- Keyboard view of the sounding notes, a tracker log with one row per play call (new notes, control register, ADSR, pulse width, filter), a register table that highlights changes, and a spectrum of the output.
- Mute and solo per voice (also for the WAV export), playlist with drag and drop, song selection, automatic advance after a set time, media keys, and WAV export of a chosen length.
- Includes "Blue Circuit", an original demo tune with its own small 6502 player (source and build script in `demo/`). No other music is part of the repository.

Code: `js/psid.js` (file format), `js/player.js` (machine, multi-SID routing, PSID driver, tick recording), `emu/` (CPU, VIC-II, CIAs and C64 core from the C64 Emulator; `sid.js` extended by single-voice outputs and muting), `app.js` (audio worklet, views, export).

### C64 SID Tracker

A tracker for composing music for the SID chip. The song runs as 6502 machine code on the C64 emulator core of the C64 SID Player, so what you hear in the browser is what the exported files play on a C64.

- Three voices with their own patterns (1–64 rows) and an order list of up to 100 positions with a pattern and a transpose per voice and a loop position; up to 128 patterns.
- Pattern editor with piano keys on the computer keyboard, hexadecimal entry for instrument, command and parameter, edit step, selection, copy, cut, paste, transpose, inserting and removing rows; an on-screen piano and keys for touch screens.
- Up to 31 instruments: ADSR with an envelope picture, hard restart, a wave program (waveform, sync, ring, test bit and a relative or fixed note for every frame, with stop or loop), pulse width with sweep between two limits, vibrato with delay, and the filter (low, band, high pass, resonance, cutoff, sweep).
- Commands: slide up and down, tone portamento, vibrato, attack/decay, sustain/release, waveform, arpeggio, pulse width, filter cutoff, resonance and type, volume, filter sweep, speed.
- Play the song, play from the cursor or loop one position; notes typed or played are heard right away. Changes made while the song plays are put in at the next row, and the sounding notes go on. Oscilloscope, mute and solo per voice; 6581 or 8580; 1–4 calls per frame.
- Export: PSID (.sid), the music with its load address (.prg, init and play address, no zero page used), a program to RUN on a C64 that plays the music from an interrupt, and WAV. Songs are kept in the browser and saved as JSON files. Includes the demo song "Harbour Lights".

Code: `driver/driver.asm` (the 6502 player, 64tass) and `driver/build.js` (assembles it twice and finds the bytes to relocate) make `js/driver.js`; `js/song.js` (song, file, undo), `js/build.js` (packed patterns, tables, relocation, .sid and .prg files), `js/engine.js` (audio, playing, notes from the keyboard, changes while playing, WAV), `js/demo.js` (instruments and demo song), `app.js` (user interface); `emu/`, `roms/`, `js/psid.js` and `js/player.js` come from the C64 SID Player.

### C64 Pixel Studio

A graphics editor for C64 programs: sprites, sprite objects, character sets, tiles, game levels and bitmaps in one project, with the colour rules of the VIC-II.

- Sprites: hires (24×21) and multicolour (12×21) with the shared multicolours, expand X/Y, up to 256 sprites; pen, line, rectangle, filled rectangle, ellipse, fill and colour picker with two mouse buttons, shift, flip, invert, copy and paste.
- Objects: several sprites on top of each other (for example a hires outline over a multicolour sprite, or a large figure made of four sprites), moved by mouse or keys, and frames for animations with a speed in screen frames; playback, the previous frame as onion skin, and the other sprites of the object shown while drawing one of them.
- Character set: 256 characters in hires or multicolour (colour per character, colours 8–15 multicolour like on the C64), shift, flip, rotate, invert, the C64 upper and lower case sets from the Open ROMs as a start, and a line of text to try them out.
- Tiles of 1×1 to 8×8 characters and a level (map) of up to 1024×1024 tiles, drawn with pen, line, rectangles and fill, with zoom, tile grid and the borders of C64 screens.
- Bitmaps: multicolour (160×200, background and three colours per 4×8 cell) and hires (320×200, two colours per 8×8 cell); painting keeps the limits of a cell (a new colour takes a free slot or replaces the least used one). The picture converter turns PNG, JPEG and other pictures into C64 bitmaps with fit, background, brightness, contrast and saturation, and no, ordered (Bayer) or error-diffusion (Floyd–Steinberg) dithering.
- Undo and redo for every change; the project is kept in the browser and saved as a JSON file.
- Export: sprites as raw data (64 bytes each, colour in byte 63), PRG with load address, SpritePad 1.x (.spd), assembler source and PNG; object tables as assembler source and frames as PNG; the character set as raw data, .64c with load address, colours, assembler source and PNG; tiles and levels as raw data (tile numbers, or screen codes and colours character by character), assembler source and PNG; bitmaps as Koala Painter (.koa), Art Studio (.aas), raw parts and PNG. Import reads the project, SpritePad 1.x, Koala and Art Studio pictures, pictures for the converter and raw data (sprites, characters, colours, tiles, level, with or without load address).

Code: `js/gfx.js` (C64 colours, pixel formats, bitmap colour rules), `js/model.js` (project, undo, project file), `js/editor.js` (pixel editor and tools), `js/formats.js` (file formats), `js/convert.js` (picture converter), `js/core.js` and `js/ui-*.js` (the views), `js/io.js` (export, import, converter dialog), `app.js` (tabs, keyboard); `roms/chargen.js` is the character ROM of the MEGA65 Open ROMs (LGPL-3.0).

### C64 Assembler

A 6502 assembler with an editor and a C64 next to it that runs the program.

- Editor: highlighting for instructions, undocumented opcodes, directives, labels, numbers and strings; line numbers, marks for errors and warnings, Tab and Shift+Tab to indent, auto-indent, Ctrl+/ to comment lines out; several files per project (`.include`) and binary files (`.binary`).
- Assembler (syntax close to 64tass): labels with or without colon, local labels (`_name`, `@name`), anonymous labels (`-`, `+`), constants, expressions with `<` and `>`, all 6502 addressing modes with zero page chosen by itself (`@w`/`@b` to force), the undocumented opcodes of the 6510, `.byte .word .text .screen .ascii .null .fill .align .basic .binary .include .if .elif .else .endif .macro .rept .for .logical .cpu .assert .error .warn`; several passes for labels defined later, a strict last pass with clear messages. It gives the same bytes as 64tass for the 6502 sources of this repository.
- The C64 (the core of the C64 Emulator, Open ROMs): Ctrl+Enter assembles and runs the program (RUN for a `.basic` line, else SYS), with screen, sound, keyboard and the number pad as joystick. Breakpoints by clicking a line number, pause, step, step over, step out; the source line of the PC is marked; registers, disassembly, memory, labels and listing in tabs.
- Quick reference in a floating window that stays open while typing: all instructions with addressing modes, opcodes, bytes, cycles and flags (and the undocumented opcodes); memory map, banking with $01, VIC-II banks, zero page and vectors; the KERNAL jump table with inputs and outputs; every register of the VIC-II, SID and both CIAs with the meaning of its bits, graphics modes and ADSR times; colours, PETSCII control codes, screen codes and the keyboard matrix; 17 code snippets (raster interrupts, joystick, sprites, sound, random numbers, bitmap mode, loading a file …) to insert. F1 looks up the word at the cursor (instruction, address, name or label); `+` inserts `NAME = $address`.
- Saves the program as .prg or .bin, labels for the VICE monitor, and the project as JSON; the project is kept in the browser. Five original examples (text, raster bars, a sprite, a tune, a scroller).

Code: `js/asm.js` (assembler), `js/editor.js` (code editor), `js/machine.js` (C64 with screen, sound, keyboard and debugger), `js/reference.js` (quick reference), `js/examples.js`, `app.js` (user interface); `emu/` and `roms/` are from the C64 Emulator.

### C64 Packer

Packs C64 programs in the browser. The result starts with RUN like the original, unpacks itself and starts the program.

- Two formats: the Exomizer 3 bit stream (protocol flags 39, packs smallest) and the TSCrunch byte format (unpacks fastest). Both are packed with an optimal parse; the TSCrunch packer is a port of the TSCrunch 1.3 encoder and gives the same bytes.
- Self-extracting PRG: a BASIC line SYS 2061, an unpacker that moves itself to $FC00 and the packed data right below it, unpacking in place with a safety check; programs up to $FBFF, also under the ROMs. Start with JMP to an address (a SYS line is found by itself) or with RUN for BASIC programs. Every result is unpacked on an emulated 6502 before saving, which also gives the unpack time.
- Packed data for own code: TSCrunch (like `tscrunch -p`), Exomizer raw forward and backwards (like `exomizer raw` and `exomizer raw -b`).
- Tape images (.tap) with a fast loader: a normal KERNAL file carries the loader in its header and starts it through the CHRIN vector after LOAD; the loader reads the program in turbo format (about 400 bytes per second) and starts it with JMP or RUN.
- A memory map shows where the program, the packed data and the unpacker are while unpacking.

Code: `js/tscrunch.js` and `js/exomizer.js` (the formats, packing and unpacking), `js/packer.js` (program analysis, in-place safety, self-extracting files, checks), `js/tap.js` (tape images), `js/cpu6502.js` (from the C64 Emulator), `app.js` (user interface); `asm/sfx.asm` (unpackers and start) and `asm/turbo.asm` (tape loader) for 64tass, built into `js/sfx.js` by `asm/build.js`. `js/LICENSE-tscrunch.txt` is the Apache 2.0 license of TSCrunch.

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

### Hex Editor

View and edit firmware files in the browser; nothing is uploaded.

- Formats: raw binary (at a chosen address), Intel HEX (all record types, checksums checked), Motorola S-record (S1–S3, start address), UF2 (with family ID) and ELF (32 and 64 bit, little and big endian). The format is detected from the content.
- ELF: the image shows the file bytes of the loadable segments at their load addresses (LMA), exactly as `objcopy -O binary/ihex` writes them, with sections (address, load address, size, flags) and symbols (functions and objects, clickable, underlined in the bytes, shown as `<symbol+offset>` in the status line). The *File* view shows the ELF file itself; both views change the same bytes, and *ELF (changed)* saves the patched file.
- Hex view with virtual scrolling (files of many MB), 8/16/32 bytes per row, a heading row per region with the gap before it, changed bytes marked. Overwrite in hex or text, selection with mouse or Shift+keys, undo/redo, fill the selection with a byte pattern, copy and paste as hex or text.
- Go to an address or a symbol; find hex bytes (with `??` wildcards) or text, forwards and backwards.
- Data inspector at the cursor: 8 to 64-bit integers, float, double, little or big endian, text, and the symbol a 32-bit value points to.
- Checksums of the selection or the saved regions: CRC-32, CRC-16/CCITT-FALSE, CRC-16/MODBUS, CRC-8, 8 and 32-bit sums, two's complement, XOR, SHA-256.
- Saving as binary (gaps filled), Intel HEX (16 or 32 bytes per line, with start address), S-record, UF2 (256-byte blocks, family for RP2040, RP2350, SAMD, ESP32, STM32, nRF52) or the changed ELF; only the ticked regions or only the selection.

Code: `js/formats.js` (readers and writers), `js/grid.js` (hex view and editing), `app.js` (user interface). No dependencies.

### Serial Terminal

Talks to a microcontroller through a USB-to-serial converter (CH340, CP210x, FTDI, PL2303) or a USB CDC device using the Web Serial API.

- Connection: baud rate (common rates to choose from or any value from 50 to 4,000,000), data bits, parity, stop bits and RTS/CTS flow control. Changing a setting while connected reopens the port. Known converters are named by their USB IDs.
- Control lines: DTR and RTS switches and a reset pulse for Arduino-style (DTR) and ESP32-style (RTS/DTR) auto reset circuits.
- Display: UTF-8 text (CR, LF and CR+LF start a new line, other control characters are shown by name, ANSI color codes are removed) or hex dump with ASCII column, optional timestamps, sent data in a different color. Switching the view redraws the received data. Keeps the last 10,000 lines; Save downloads them as a text file, Clear (Ctrl+L) empties the terminal.
- Send line: text with a selectable line ending (none, LF, CR, CR+LF) or hex bytes, Enter sends, ↑/↓ recall the last 50 sent lines.
- Settings and the send history are remembered in the browser. Needs Chrome, Edge or Opera on a desktop computer.

Code: `app.js` (no dependencies).

### USB Oscilloscope

An oscilloscope for the cheap two-channel USB scopes of the Hantek 6022 family over WebUSB (Chrome, Edge, Opera on the desktop): Hantek 6022BE and 6022BL, Hantek DSO-6021, Voltcraft DSO-2020 and (untested) SainSmart DDS120, with a simulator for trying it without a scope.

- Device: the scopes have a Cypress FX2 without firmware of its own; the open source firmware of [Hantek6022API](https://github.com/Ho-Ro/Hantek6022API) by Ho-Ro (also used by OpenHantek6022) is loaded into its RAM at every connect, after which the scope comes back as "OpenHantek" device. The firmware files in `fw/` are built from its source (GPL-3, licence texts and notes in `fw/`). Offsets and gains from the EEPROM of the scope are used; zero offsets of all ranges can be measured again and are kept in the browser.
- Acquisition: 20 mV … 5 V/div (probe 1× or 10×), DC/AC coupling (AC on the DDS120 and on modified Hantek scopes), 1 µs … 1 s/div; the sample rate follows the time base (up to 30 MS/s with one channel, 15 MS/s with two) or is chosen by hand. From 100 ms/div the display rolls.
- Trigger: software trigger with hysteresis and sub-sample placement on either channel, rising or falling, Auto, Normal and Single; level and trigger point can be dragged on the screen, as can the zero lines.
- Screen: 10 × 8 divisions, black or white background, min–max drawing for dense data and dots for single samples, over-range warning, two time cursors with ΔT, 1/ΔT and the voltages at the cursors, XY mode, spectrum (Hann window, dBV, peak frequency) of one channel with a selectable range.
- Measurements per channel: frequency, period, duty cycle, Vpp, minimum, maximum, mean, RMS and AC RMS. Auto set finds V/div, time/div and the trigger level.
- Files: the screen as CSV (time and volts) and as PNG.

Code: `js/hantek.js` (WebUSB, firmware upload, vendor requests, EEPROM, simulator), `js/scope.js` (acquisition, trigger, roll mode, measurements, FFT), `js/display.js` (screen), `app.js` (user interface). No dependencies.

### Signal Analyzer

A logic analyzer and simple oscilloscope in the browser for hardware that costs a few euros, with protocol decoders.

- Raspberry Pi Pico with the [sigrok-pico](https://github.com/pico-coder/sigrok-pico) firmware over Web Serial (the protocol of the raspberrypi-pico driver of libsigrok): up to 21 digital channels (GP2–GP22) and 3 analog inputs, sample rates from 5 kS/s to 120 MS/s into the Pico's memory, run-length coded transfer, streaming mode for triggered captures, check of the byte count.
- FX2 logic analyzers (the "24 MHz 8 channel" Saleae Logic clones with 0925:3881, Cypress FX2 boards with 04b4:8613 and 16 channels, sigrok fx2grok) over WebUSB: the app loads the [fx2lafw](https://sigrok.org/wiki/Fx2lafw) firmware into the chip as sigrok does (built from source, version 0.1.7, GPL; `apps/signal-analyzer/fw/`), then streams 20 kS/s to 24 MS/s (16 channels up to 12 MS/s) with up to 32 transfers in flight and warns when the computer could not keep up.
- Sound card over Web Audio: one or two analog channels at 44.1 to 192 kHz from any audio input.
- Trigger on a digital edge or level or an analog level crossing, with 0 to 75 % of the samples before the trigger; single captures or repeated ones like an oscilloscope.
- Waveform view for up to 100 million samples (block summaries for fast drawing): zoom with wheel, pinch or keys, pan by dragging, overview bar, time ruler relative to the trigger, two cursors that snap to edges with time difference and frequency, pulse width, period, frequency and duty cycle under the pointer. Channels can be renamed, recoloured (resistor colour code) and hidden; an analog channel becomes a digital one with a threshold and hysteresis.
- Decoders: UART (auto baud rate, 5–9 data bits, parity, stop bits, inverted, text lines), I²C (start, repeated start, stop, 7/8-bit addresses, ACK/NACK, transfers), SPI (modes 0–3, 4–32 bit words, chip select), 1-Wire (reset, presence, ROM commands including Search ROM, ROM codes, DS18B20 functions), WS2812/SK6812 (GRB, RGB, GRBW, RGBW with colour swatches), IR remote controls (NEC, Samsung, Sony SIRC 12/15/20, Philips RC-5; raw 38 kHz carrier is removed) and the C64 serial bus (IEC: LISTEN/TALK/OPEN/CLOSE/DATA under ATN, EOI, turnaround). Results as rows in the view and as a filterable list; tested with captures from sigrok-dumps.
- Files: sigrok sessions (.sr, read and write, for PulseView and sigrok-cli), VCD and CSV (read and write), decoded data as text, the view as PNG. Eight generated demo signals.

Code: `js/capture.js` (data model and block summaries), `js/view.js` (waveform canvas), `js/sources.js` (Pico, FX2, sound card, trigger), `js/decoders.js`, `js/files.js` (ZIP, .sr, VCD, CSV), `js/demo.js`, `app.js` (user interface); no dependencies.

### Power Profiler

A web app for the Nordic Power Profiler Kit II (PPK2) over Web Serial (Chrome, Edge, Opera on the desktop), with a simulator for trying it without the kit.

- Device: source meter (0.8–5 V, power output on/off) or ampere meter mode; the calibration of the kit is read from its metadata and applied to every sample (ranges, offsets, gains, with the usual smoothing after range switches); lost samples are found by the sample counter and shown.
- Recording: 100 000 samples per second, or 10 000 … 10 per second as averages for long recordings (hours); a limit for the length with the memory it needs. Samples are kept in chunks with a pyramid of block summaries (min, max, sum, count and the logic bits), so any stretch is summed up at once.
- Chart: current as min–max band with the average line, linear or logarithmic; the logic inputs D0–D7 below; live view of the last seconds, zoom from hours down to single 10 µs samples, selection by dragging, overview bar.
- Statistics of the visible part and of the selection: duration, average, minimum, maximum, charge (C and mAh), energy; battery runtime for a capacity.
- Trigger: current above or below a level, or a logic input rising or falling; single (stops) or repeated, with window length and pre-trigger part.
- Files: recordings saved and opened as `.pprec` (gzip), CSV export of the selection or the visible part.
- Protocol: commands for metadata (0x19), mode (0x11), voltage (0x0D), power output (0x0C), start/stop (0x06/0x07); samples are 32-bit words with 14-bit ADC value, range, 6-bit counter and the 8 logic bits. Written after the open source PPK2 libraries; not an official Nordic tool.

Code: `js/ppk2.js` (Web Serial, protocol, calibration, simulator), `js/store.js` (recording with summaries), `js/chart.js` (chart), `app.js` (user interface). No dependencies.

### Power Analyzer

The control program for the [ATtiny814 Power Analyzer](https://github.com/wagiminator/ATtiny814-Power-Analyzer), an electronic load with two INA219 power sensors, in place of the Python/Tkinter program. Uses the Web Serial API (115200 baud, the text protocol of the firmware).

- Connection: finds the analyzer by its identification string and shows the firmware version. Live readings of both sensors (load side TEST-IN and supply side PWR-IN → PWR-OUT: voltage, current, power) a few times a second, and a constant current load to switch on and off.
- All test programs of the firmware with a wiring picture and the parameter limits of the firmware:
  - load test (voltage and power over current, maximum power, internal resistance)
  - voltage regulation (load steps, voltage range, load regulation)
  - efficiency test (efficiency over current, maximum efficiency)
  - low frequency ripple test
  - battery discharge (capacity, energy, duration; can be stopped)
  - long-term multimeter (energy, charge, minimum/maximum/average; can be stopped)
  - calibration, which works out the `ILCAL`/`ULCAL` factors from the readings of a multimeter
- Live chart with two value axes and a crosshair; measurements are kept in the browser, can be renamed, drawn on top of each other for comparison, saved as CSV (with a header) and as a picture with the results. CSV files of this app and of the Python program (tab separated, the test is recognized from the columns) can be opened.
- A simulated analyzer (a USB charger, a 12 V to 5 V converter and a lithium-ion cell behind the same firmware protocol) to try the app without hardware.

Code: `js/device.js` (serial line protocol and the simulator), `js/tests.js` (test programs and their results), `js/chart.js` (chart), `app.js` (user interface); no dependencies.

### Gerber Viewer

Shows the top and bottom side of a printed circuit board from its Gerber and drill files. Everything runs in the browser; no file is uploaded.

- Input: a ZIP archive (as exported by EasyEDA, KiCad, Eagle, Altium and others) or the single Gerber and drill files, by file dialog or drag and drop. Layers are recognized by Gerber X2 file attributes, by the usual file extensions (GTL, GBL, GTS, GBS, GTO, GBO, GKO, GM1, DRL, …) and by common file names; the assignment of every file can be corrected by hand.
- Reads Gerber RS-274X (standard and macro apertures, arcs, regions, polarity, step and repeat) and Excellon drill files (inch and metric, zero suppression, slots). The board shape comes from the outline layer; without one, the extents of all layers are used.
- Looks: solder mask color as offered by JLCPCB (green, purple, red, yellow, blue, white, black), silkscreen white or black (chosen to match the mask color automatically), surface finish HASL (tin), ENIG (gold) or bare copper. Copper under the solder mask shows as lighter traces, holes are see-through, the bottom side is shown as seen from below.
- Download: each side as a PNG with a transparent background at 300, 600 or 1200 dpi (limited to about 50 megapixels).

Code: `gerber.js` reads ZIP archives, recognizes layers, parses Gerber and Excellon files and draws the board, `app.js` is the user interface (no dependencies).

### Interactive BOM

A helper for soldering a board by hand, in the spirit of InteractiveHtmlBom: the bill of materials next to a picture of the board drawn from its Gerber files. Everything runs in the browser; no file is uploaded.

- Input: Gerber ZIP (or single Gerber and drill files), BOM (EasyEDA .tsv in UTF-16 or UTF-8, KiCad .csv, JLCPCB .csv) and pick-and-place file (EasyEDA, JLCPCB CPL, KiCad .pos/.csv, Eagle .mnt; mm, mil and inch), by file dialog or drag and drop. Designator ranges like `C5-C7` are expanded; a pick-and-place file whose origin does not match the Gerber files is moved onto the board.
- GitHub: a repository name (or link) is searched for Gerber ZIP, BOM and CPL files, which are matched by folder and file name; repositories with several boards offer a choice. `?repo=wagiminator/CH552-USB-OLED` (and `&board=`) opens a project directly.
- Parts list: filter, order (BOM, small parts first, most parts first, by designator), hide placed lines, LCSC part numbers as links. Choosing a line lights up its parts on the board and dims the rest; the view switches to the side the parts are on. Clicking a part on the board selects its line. Ticked lines and the progress are kept in the browser for each board.
- Board: top and bottom side (the bottom as seen from below), solder mask colour, designators, marks for placed parts, zoom and pan with wheel, drag and pinch.
- Teach mode for boards without a pick-and-place file: the app asks for one part after the other, the click snaps to the middle of the part's pads (found on the solder mask layer), with skip, undo and forget. The taught positions are kept in the browser and can be saved as a JLCPCB-style CPL file to put next to the BOM, where the GitHub loader finds it.
- Keys: ↑/↓ choose the line, Space ticks it, N next open line, T/B side, +/−/F zoom, Esc leaves the teach mode.
- Pick-and-place data for the boards of these projects comes with the app (`js/cpl-data.js`, 198 boards, made from the EasyEDA projects). It is found by the EasyEDA id in the Gerber header, so it is used for boards loaded from GitHub and for Gerber ZIPs opened from the computer. It also lists the boards of each repository, which the app uses when the GitHub API does not answer (rate limit).
- Download: the Gerber ZIP (the original, or a new ZIP of single files), the BOM and the positions as CPL file (JLCPCB format, with the taught positions). *A4 sheet* makes a PDF for the workbench: the board picture of both sides with the parts numbered and coloured by BOM line, and the parts list with boxes to tick, in the chosen order; long lists go into two columns.

Code: `js/parts.js` (BOM and pick-and-place readers, CPL writer, part sizes, GitHub search), `js/board.js` (pad finder, snapping, board view), `js/export.js` (ZIP and PDF writer, A4 sheet), `app.js` (user interface); the board is drawn by `../gerber-viewer/gerber.js`. No other dependencies.

### Electronics Calculators

Small calculators for building the boards, in four groups (tabs); every calculator has its own link (`#feedback`, `#uart`, …), the values are kept in the browser, values can be typed as `4k7`, `100n`, `2u2`.

- Regulators and chargers: feedback divider of adjustable regulators with a chip list (MT3608, SX1308, SD8942, MP1584, MP2307, LM2596, LM2577, XL6009, MC34063, LM317, AMS1117) and the nearest resistor pairs of a series; it replaces the former MT3608 SEPIC calculator (`#mt3608`, the old address redirects). Charge current resistor of TP4056, TP4054/LTC4054, MCP73831, CN3058E and IP2312; heat and junction temperature of linear regulators; battery runtime with sleep current and charge time.
- Resistors and LEDs: LED series resistor (with power and package), current sense resistor of LED drivers (TPS61169, PT4115), voltage divider with ADC reading, nearest values and series/parallel pairs of the E6 … E96 series, colour code (4 and 5 bands, both ways, with picture) and SMD codes (3-digit, 4-digit, EIA-96, R notation, both ways).
- MCU timing: UART register values and baud rate error for classic AVR (UBRR, U2X), tinyAVR 0/1/2 and AVR Dx (BAUD, CLK2X), CH32V/CH32X/STM32/PY32 (BRR) and CH55x (TH1/SBAUD1), with a table of the common baud rates; prescaler and top value for timer and PWM frequencies (AVR Timer0/1/2, ATtiny85 Timer1, TCA0/TCB, CH32 timers, CH55x Timer 2) with error and PWM resolution; clock cycles and time.
- PCB and converters: trace width, resistance and voltage drop after IPC-2221, via current and number of vias, clearance for a voltage (IPC-2221 table 6-1), and duty cycle, inductor, peak currents and capacitors of buck, boost and SEPIC converters (with switching frequencies of common chips).

Code: `app.js` (no dependencies).

## Games

### Ironfall

Run-and-gun action platformer as a homage to the C64/Amiga classic Turrican (Rainbow Arts, 1990). All graphics are drawn by code, music and sound effects are synthesized with the Web Audio API.

- Five worlds with two large stages each (Alien Frontier, Crystal Caverns, Bio Hive, Steel Foundry, Machine Core) and five bosses: Iron Fist, Crystal Widow, Hive Mind, Titan Walker and the Overmind. Levels scroll in all directions, with climbing shafts, drops, liquids, spikes, crushers, moving platforms, checkpoints, a time limit, hidden ledges and secret tunnels.
- Five main weapons with four power levels (Spread Shot, Laser, Rebound, Flamer, Homing), the rotating lightning beam, power lines and the gyroscope; floating blocks release power-ups, diamonds and extra lives. 20 enemy types.
- Multi-layer parallax backgrounds, large particle explosions with shock waves and debris; tracker-style soundtrack with a track for every world and boss music.
- Short voice announcements for extras, checkpoints, bosses and the end of a stage (Web Speech API, can be switched off).
- Keyboard, mouse (360° aiming) and gamepad controls, fullscreen mode (F).
- Top 10 highscore list stored in the browser; entering a name is optional.

Code: `js/levels.js` (worlds, stages, level builder), `js/game.js` (player, weapons, physics, stage flow), `js/enemies.js` (enemy types), `js/bosses.js` (bosses), `js/themes.js` (parallax layers, tiles, liquids), `js/sprites.js` (suit, items, projectiles), `js/gfx.js` (drawing helpers, particles), `js/audio.js` (music, sound and voice), `js/ui.js` (screens, HUD), `js/main.js` (main loop); see `games/ironfall/README.md`.

### X-Abyss

Underwater shoot'em-up as a homage to the Amiga classic X-Out (Rainbow Arts, 1990). All graphics are drawn by code, music and sound effects are synthesized with the Web Audio API.

- Eight stages, each with its own boss, and a shipyard between the stages. The first zone has Coral Shelf, Wreck Graveyard, Magma Vents and The Hive. The much harder deep zone has Trench Gate, Crystal Caverns, Frozen Rift and Abyss Core, with multi-layer parallax scrolling, faster and tougher enemies from every side, fixed obstacles and its own dark techno soundtrack. The shipyard offers four main weapons with four power levels, satellites with five formations, homing missiles, depth charges, rear and side guns, shield, armour, turbo engine, nova bombs, repairs and extra ships.
- Large particle explosions with shock waves, debris, smoke and bubbles; tracker-style soundtrack.
- Short voice announcements for power-ups, bosses and the end of a stage (Web Speech API, can be switched off).
- Keyboard, mouse and gamepad controls, fullscreen mode (F).
- Top 10 highscore list stored in the browser; entering a name is optional.

Code: `js/world.js` (stages, weapons, enemies, obstacles, bosses), `js/deep.js` (deep zone stages, enemies and bosses), `js/gfx.js` (sprites, backgrounds, particles), `js/deepgfx.js` (deep zone graphics), `js/audio.js` (music and sound), `js/ui.js` (screens, shipyard, HUD), `js/main.js` (main loop); see `games/x-abyss/README.md`.

### Primordia

Vertical shoot'em-up as a homage to the Amiga classic Xenon 2 (The Bitmap Brothers, 1989). All graphics are drawn by code, music and sound effects are synthesized with the Web Audio API.

- Eight stages through the ages of evolution, each in two halves with a trading post in between and a boss at the end. The early ages are Primeval Ocean, Fossil Depths, Spore Jungle and Bio Core. The much harder later ages are Ice Age, Ember Age, Machine Age and Star Seed, with four parallax layers, faster and tougher enemies from the sides and from behind, fixed obstacles and their own synthwave and dark-synth soundtrack.
- Many add-ons that fire at the same time: blaster with five levels, side and rear shots, cannon, laser, homing missiles, electro balls, drones, mines, zapper, rapid fire, speed and armour; plus health, smart bombs, overdrive and extra lives. Add-ons can be sold back for half the price.
- Parallax scrolling with detailed backgrounds and walls, large particle explosions; breakbeat-style soundtrack.
- Short voice announcements for power-ups, bosses and the end of a stage (Web Speech API, can be switched off).
- Keyboard, mouse and gamepad controls, fullscreen mode (F).
- Top 10 highscore list stored in the browser; entering a name is optional.

Code: `js/world.js` (stages, ship, add-ons, enemies, obstacles, bosses), `js/deep.js` (later ages: stages, enemies and bosses), `js/gfx.js` (sprites, parallax layers, particles), `js/deepgfx.js` (later ages graphics), `js/audio.js` (music and sound), `js/ui.js` (screens, trading post, HUD), `js/main.js` (main loop); see `games/primordia/README.md`.

### Sunset Highway

Pseudo-3D arcade road racer as a homage to the 1986 arcade classic Out Run. All graphics are drawn by code, music and sound effects are synthesized with the Web Audio API.

- Five rows of stages with a fork at the end of each: keep left or right to choose the next landscape. 15 stages in ten landscapes at day, sunset or night, and five different goals with their own little ending.
- Curves, hills, traffic, checkpoints with extended time, a time limit and a route map.
- Two gears with automatic or manual gearbox; three radio stations to choose from.
- A driver and a passenger who comment on the drive and get thrown out of the car in a crash.
- Keyboard, mouse and gamepad controls (analog steering and triggers), fullscreen mode (F).
- Top 10 highscore list stored in the browser; entering a name is optional.

Code: `js/race.js` (route, track, pseudo-3D renderer, physics, traffic), `js/gfx.js` (sprites, landscapes, sky), `js/audio.js` (radio, engine and sound effects), `js/ui.js` (screens, HUD, route map, goal scenes), `js/main.js` (main loop); see `games/sunset-highway/README.md`.

### DREAMHOP

Cute jump-and-run as a homage to the 1987 home computer classic The Great Giana Sisters. The heroine Lulu, all enemies, bosses, levels, graphics and music are original, drawn by code and synthesized with the Web Audio API.

- Four dream worlds with three levels each (Meadow of Naps, Crystal Caverns, Sugar Hills, Starlight Clouds); the last level of every world ends with a boss.
- Star blocks with gems, hidden blocks, bricks, springs, moving platforms, pits, lava and checkpoints.
- Power-ups: dream orb, star wand, clock, lightning, bubble and lollipops; 100 gems give an extra life.
- Pixel graphics with parallax backgrounds and many small animations; chiptune soundtrack.
- Keyboard, mouse and gamepad controls, fullscreen mode (F).
- Top 10 highscore list stored in the browser; entering a name is optional.

See `games/dreamhop/README.md`.

### Deep Diner

Comic underwater eat-and-grow game in the spirit of Feeding Frenzy. All graphics, music and sounds are generated at runtime.

- Five worlds with two levels each (Coral Reef, Kelp Forest, Sunken Ship, Frozen Sea, The Abyss).
- Eat smaller fish, avoid bigger ones and grow through three sizes; eat quickly in a row for a Feeding Frenzy.
- Many animated creatures from guppies to orcas, plus jellyfish, sea mines and oysters with pearls.
- Spoken comments (Web Speech API, can be switched off), a song for every world.
- Mouse, keyboard and gamepad controls, fullscreen mode (F).
- Highscore list stored in the browser; entering a name is optional.

See `games/deep-diner/README.md`.

### Bubble Puff

Cute bubble-blowing platform game in the spirit of Bubble Bobble. All graphics, music and sounds are generated at runtime.

- 16 rounds in six areas, each with its own layouts, tiles, background and enemies, and a final battle against King Grumble.
- Trap monsters in bubbles and pop them for chain reactions, fruit and EXTEND letters; ride on bubbles and fall through the floor to the top.
- Power-ups, a hurry-up timer and a skull ghost for dawdlers.
- Spoken comments (can be switched off), a song for every area.
- Keyboard, mouse and gamepad controls, fullscreen mode (F).
- Highscore list stored in the browser; entering a name is optional.

See `games/bubble-puff/README.md`.

### Alien Armada

Retro alien-invasion shooter in the spirit of Space Invaders, with detailed pixel graphics and techno music. All graphics, music and sounds are generated at runtime.

- Five worlds with animated backgrounds, three waves each and a mothership with several attack patterns.
- Marching formation with the classic four-note beat, destructible bunkers, a mystery UFO and extra lives.
- Power-ups: double shot, rapid fire, shield, laser beam and bomb.
- Spoken announcements (can be switched off), a techno track for every world.
- Keyboard, mouse and gamepad controls, fullscreen mode (F).
- Highscore list stored in the browser; entering a name is optional.

See `games/alien-armada/README.md`.

### Garden Siege

Tower-defense garden game as a homage to the PC classic Plants vs. Zombies (PopCap Games, 2009). All graphics are drawn by code, music and sound effects are synthesized with the Web Audio API; names and artwork are original.

- Adventure with 50 levels in five areas (Front Yard, Night Yard, Backyard Pool, Foggy Pool, Rooftop), special levels, conveyor-belt levels and the final fight against Dr. Zed and his robot.
- 48 plants (shooters, catapults, mushrooms that sleep by day, water and roof plants, instant-use plants and shop upgrades such as the Corn Cannon) and 29 zombie types, from the Walker to the Gargantuar with its Imp, with the rules of the original: sun, recharge, lawn mowers, huge waves, armour, screen doors, graves, ice trails, fog and the roof slope.
- 18 mini-games, Vasebreaker and "I, Zombie" puzzles, Survival in every area (normal, hard, endless with a Top 10 list), an almanac and a shop for seed slots, upgrades, pool and roof cleaners.
- Tracker-style soundtrack, sound effects and short voice announcements (Web Speech API, can be switched off).
- Mouse and touch, keyboard and gamepad controls, fullscreen mode (F); progress is saved in the browser.

Code: `js/plants.js` (plants), `js/zombies.js` (zombies and boss), `js/levels.js` (areas, levels, modes, waves, save game), `js/game.js` (board, rules, special modes), `js/draw.js` (backgrounds and drawing helpers), `js/audio.js` (music, sound and voice), `js/ui.js` (screens), `js/main.js` (main loop); see `games/garden-siege/README.md`.

### Feather Frenzy

Grouse-shooting arcade game as a homage to the PC classic Moorhuhn (Witan Entertainment / Phenomedia, 1999), with eight different hunting grounds instead of one. All graphics are drawn by code, music and sound effects are synthesized with the Web Audio API; names and artwork are original.

- Eight levels (Highland Moor, Sunny Farmyard, Deep Pine Forest, Silver Lake, Castle Ruins, Snowy Valley, Autumn Village, Moonlit Moor), each a panorama three screens wide with three parallax layers; move the crosshair to the screen edge to scroll.
- 90 seconds per round and a shotgun with 8 shells (right click to reload). Far grouse are worth 25 points, middle ones 10, near ones 5; grouse peeking out of hiding places, a huge grouse flying past the camera, golden grouse, a plane with a banner, a balloon with a parachuting grouse, a rowing boat, ski gondolas and shooting stars give extra points.
- Hidden bonus targets in every level (windmill, signpost, scarecrow, weathervane, tractor, beehive, lighthouse, banners, a suit of armour, snowmen, church bell and clock, pumpkins …), trees that flush out grouse, animals that cost points when hit, falling snow and leaves, and a night level lit only by your lamp.
- A goal score unlocks the next level; a Top 10 high score table per level with name entry.
- Tracker-style soundtrack for every level, sound effects and short voice announcements (Web Speech API, can be switched off).
- Mouse and touch, keyboard and gamepad controls, fullscreen mode (F); progress and scores are saved in the browser.

Code: `js/scenes.js` (levels, layers, props), `js/birds.js` (grouse, animals and other sprites), `js/game.js` (round, shooting, scoring, HUD), `js/draw.js` (drawing and landscape helpers), `js/audio.js` (music, sound and voice), `js/ui.js` (screens), `js/main.js` (main loop); see `games/feather-frenzy/README.md`.

### Starlane Command

Real-time fleet command game as a homage to SPACECOM (Flow Combine / 11 bit studios, 2014). All graphics are drawn by code, music and sound effects are synthesized with the Web Audio API; names, missions and artwork are original.

- Star systems linked by starlanes: shipyards build ships, mining colonies send supply convoys to the nearest shipyard, repair docks mend damaged ships, outposts are stepping stones; every system has a garrison.
- Three fleet types, shown as triangles with a stripe for their role: battle fleets fight other fleets, siege fleets break shields and battle stations and can raze a system for good, invasion fleets defeat the garrison and capture the system.
- Supply builds ships and buys shields and battle stations; enemy fleets seize convoys that pass through their system; orders are final, and fleets stop only where enemy ships or a station block the lane. Pause at any time, or play at 2× or 4× speed.
- A campaign of eight operations (take a sector, deliver supply, first contact, hold a choke point, raze enemy mines, two fronts, a fortified gauntlet, a final battle against three powers) and skirmishes against one to three computer commanders on generated maps in three sizes and three difficulty levels.
- Tracker-style soundtrack, sound effects and short voice reports (Web Speech API, can be switched off).
- Mouse and touch (drag to send fleets), keyboard and gamepad controls, fullscreen mode (F); progress is saved in the browser.

Code: `js/game.js` (simulation), `js/ai.js` (computer commanders), `js/maps.js` (operations and map generator), `js/play.js` (tactical map, command panel, orders), `js/draw.js` (display style and widgets), `js/audio.js` (music, sound and voice), `js/ui.js` (screens), `js/main.js` (main loop); see `games/starlane-command/README.md`.

### Mossling March

Puzzle game as a homage to the classic Lemmings (DMA Design / Psygnosis, 1991). Little round moss sprites with a sprout on their heads march out of a hollow log and walk straight on; give them jobs so that enough of them reach the round door. All graphics are drawn by code, music and sound effects are synthesized with the Web Audio API; names, characters and levels are original.

- Eight jobs, each with a clear icon and label in the panel: climber, floater, bomber, blocker, builder (bridge), basher, miner and digger.
- Destructible terrain: every cell can be dug, bashed, mined or blown away – except steel; stone with arrows only gives way in their direction; long falls, water and lava are deadly.
- Twenty levels in four ratings with their own landscapes (meadow, forest, crystal caves, frost peaks); each level gives a number of mosslings, the share to bring home, a limited set of jobs, a release rate and a clock. A double click on the bomb button blows up everyone.
- Scrolling playfield with minimap, pause and fast forward, level previews, best result per level; completing a level unlocks the next.
- Tracker-style soundtrack for every landscape, sound effects and a few voice lines (Web Speech API, can be switched off).
- Mouse and touch, keyboard and gamepad controls, fullscreen mode (F); progress is saved in the browser.

Code: `js/terrain.js` (destructible terrain), `js/sprites.js` (mosslings, hatch and door), `js/game.js` (simulation and jobs), `js/levels.js` (levels), `js/play.js` (playfield, job panel, minimap, input), `js/draw.js` (drawing helpers and widgets), `js/audio.js` (music, sound and voice), `js/ui.js` (screens), `js/main.js` (main loop); see `games/mossling-march/README.md`.

### Mole Mayhem

Turn-based artillery game as a homage to the classic Worms (Team17, 1995). Teams of round, pink-nosed moles in coloured helmets fight on a crumbling island. All graphics are drawn by code, music and sound effects are synthesized with the Web Audio API; names and characters are original.

- Destructible islands generated from noise in four landscapes (meadow, desert, arctic, volcano) with caves, floating rocks, barrels and optional mines; every blast tears a crater and throws moles around; falls hurt and the sea is deadly.
- Two to four teams with two to six moles each, played by humans on one device or by computer players at three levels; a turn clock with a short retreat after firing, wind that changes every turn, crates with health or weapons, and sudden death with a rising sea.
- Seventeen weapons and tools: bazooka, homing missile, grenade, cluster bomb, shotgun, baseball bat, dynamite, mine, air strike, drill, blowtorch, girder, teleport, jetpack, grappling hook, skip turn and surrender.
- Computer players fly every possible shot with the game's own physics, weigh damage to rivals against damage to their own team and aim with a level-dependent error.
- Tracker-style soundtracks for every landscape and for sudden death, sound effects and short voice calls (Web Speech API, can be switched off).
- Keyboard, mouse, touch (on-screen buttons) and gamepad controls, zoom, drag the map to look around, fullscreen mode (F).

Code: `js/terrain.js` (island generator, textures, craters), `js/moles.js` (moles, weapons, objects), `js/game.js` (turns, physics, weapons, explosions), `js/ai.js` (computer players), `js/play.js` (camera, HUD, weapon menu, controls), `js/draw.js` (drawing helpers and widgets), `js/audio.js` (music, sound and voice), `js/ui.js` (screens), `js/main.js` (main loop); see `games/mole-mayhem/README.md`.

### Pearl Panic

Marble-shooting puzzle game as a homage to the classic Zuma (PopCap, 2003). Chains of pearls roll along winding grooves towards a giant clam; Puff the pufferfish spits pearls into the chains, and three or more of the same colour pop. All graphics are drawn by code, music and sound effects are synthesized with the Web Audio API; names and characters are original.

- 20 levels in four worlds (Coral Reef, Kelp Forest, Sunken Ruins, The Abyss) with spirals, snakes, starfish swirls, square mazes and levels with two chains; later worlds bring more colours and faster chains.
- Chain reactions: when a gap closes with the same colour on both sides, the front part rolls back, and a new match counts as a combo; Puff only offers colours that are still on the board.
- Power pearls (slow down, reverse, sharp eye with a laser sight, blast), gold coins and an extra life every 10,000 points.
- Up to three stars per level (cleared, no life lost, ace time), clear, time and perfect bonuses; best scores and stars are saved in the browser, and every cleared level unlocks the next.
- Tracker-style soundtrack for every world, a fast tune when the chain gets close to the clam, sound effects and short voice calls (Web Speech API, can be switched off).
- Mouse, touch, keyboard and gamepad controls, fullscreen mode (F); every pearl colour also carries its own symbol.

Code: `js/levels.js` (track shapes, worlds, levels), `js/game.js` (chains, shots, matches, combos, power pearls), `js/sprites.js` (pearls, Puff, clam, backdrops, grooves), `js/play.js` (level screen, HUD, controls), `js/draw.js` (drawing helpers and widgets), `js/audio.js` (music, sound and voice), `js/ui.js` (screens), `js/main.js` (main loop); see `games/pearl-panic/README.md`.

### Woolly Wallop

Slingshot physics game as a homage to the slingshot games of the early smartphone era such as Angry Birds (Rovio, 2009). A flock of sheep strikes back: load a sheep into the slingshot, pull back and send it flying into the forts of the wolves; a level is won once every wolf is out. All graphics are drawn by code, music and sound effects are synthesized with the Web Audio API; names, characters and tunes are original.

- A small rigid-body physics engine of its own (boxes and circles, sequential impulses with warm starting, friction, bounce, sleeping bodies); towers sway, topple and collapse, and every impact deals damage according to its strength.
- Five kinds of sheep with tricks in flight: Woolly, Lambkins (split into three), Zoomer (burst of speed), Boomer (thunderclap) and the heavy Bruiser (stomp).
- Forts of ice, wood and stone, exploding firework crates, and pups, wolves and a tough alpha.
- 20 levels in four landscapes (Green Meadow, Autumn Woods, Snowy Peaks, Dusk Farm), each one solved by a test bot.
- Points for broken blocks, damage, wolves and every sheep left over, up to three stars per level; best scores and stars are saved in the browser, and every cleared level unlocks the next.
- Camera that shows the whole level while aiming and follows the flying sheep, a trajectory guide and the trail of the last shot.
- Tracker-style soundtrack for every landscape, bleating sheep and crashing blocks, short voice calls (Web Speech API, can be switched off).
- Mouse, touch, keyboard and gamepad controls, fullscreen mode (F).

Code: `js/physics.js` (rigid-body engine), `js/levels.js` (materials, sheep and wolves, landscapes, levels), `js/game.js` (slingshot, flight, tricks, damage, scoring), `js/sprites.js` (flock, wolves, blocks, landscapes), `js/play.js` (level screen, camera, HUD, controls), `js/draw.js` (drawing helpers and widgets), `js/audio.js` (music, sound and voice), `js/ui.js` (screens), `js/main.js` (main loop); see `games/woolly-wallop/README.md`.

### Starhaul

3D space trading and combat game as a homage to the 8-bit classic Elite (Acornsoft, 1984). Trade between star systems, fight pirates, earn a combat rating and work your way up to a better ship. Rendered with three.js (WebGL); models, planets, nebulae, music and sound effects are generated while the game runs; names, ships and tunes are original (the docking waltz is an arrangement of The Blue Danube, public domain).

- Eight galaxies with 256 star systems each, every one with its own economy, government, tech level and description; 3D planets with terrain, clouds, atmosphere, rings and moons, a star, a nebula sky and a rotating orbital station.
- Trading with 17 commodities (some of them illegal), seven ships to buy and a full set of equipment: four kinds of lasers, missiles, E.C.M., cargo bay, fuel scoops, escape pod, energy bomb, docking computer and a galactic hyperdrive.
- Pirates, police, bounty hunters, traders, asteroids and an alien hive ship; pirates come rarely and alone at first and grow bolder with the combat rating and the flight time.
- In-system jump drive, hyperspace with the occasional misjump, docking by hand into the spinning slot or by docking computer.
- Combat rating from Harmless to LEGEND, legal status with fines and bounty hunters, automatic saving when docked, a backup save and a highscore list.
- Synthesized music with moods for the title, the station, quiet and lawless systems, combat and the aliens, engine hum and sound effects.
- Keyboard, mouse and gamepad controls, three graphics settings, fullscreen mode (F).

Code: `src/galaxy.js` (galaxies, systems, markets, ranks), `src/ships.js` (ships, equipment, 3D models), `src/world.js` (renderer, star systems, effects), `src/flight.js` (flight model, AI, weapons, docking, encounters), `src/state.js` (commander, saving, highscores), `src/hud.js` (cockpit HUD and scanner), `src/ui.js` (screens), `src/main.js` (main loop), bundled with three.js into `js/starhaul.js` by `build.sh`; `js/audio.js` (music and sound); see `games/starhaul/README.md`.

## Start page

The start page is plain static HTML; `assets/home/home.js` only filters the hardware project list. To add a hardware project, copy one `<li class="proj">` block in the matching category of `index.html`, change the link, name, chip (`<span class="part">`), description, `data-fam` (microcontroller family used by the drop-down) and `data-s` (lower-case search words), and add a 480x300 WebP picture to `assets/home/img/projects/`. Then update the counts in the category heading and the category button. A search can be linked directly, e.g. `https://wagiminator.github.io/?q=usb-c` or `?mcu=CH32V003`.
