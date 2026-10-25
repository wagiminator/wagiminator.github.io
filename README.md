# wagiminator.github.io

Personal page of wagiminator with links and small browser apps, published with GitHub Pages at <https://wagiminator.github.io/>.

## Structure

```
index.html              Start page (links and the "Web Apps" list)
assets/css/site.css     Shared styles and color tokens for all pages
assets/js/d64edit.js    Shared D64 disk library (editor and transfer app)
assets/js/serial-link.js  Shared Web Serial connection with timeouts (transfer apps)
assets/js/tap.js        Shared TAP tape library (read, write, decode, optimize)
apps/
  _template/            Starting point for a new app (not published)
  d64-viewer/           D64 Disk Viewer
  d64-editor/           D64 Disk Editor
  d64-transfer/         D64 Disk Transfer
  tap-transfer/         TAP Tape Transfer
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

### D64 Disk Viewer

Turns a Commodore 64 disk image into a picture of the floppy disk. Every ring is a track (track 1 outside), every segment a sector, and every byte is drawn as eight radial stripes, one per bit. The picture can be downloaded as PNG (1024, 2048 or 4096 pixels, black or transparent background).

- Supports 35, 40 and 42 track images, with or without error info (174,848 to 206,114 bytes).
- Colors: file data green, BAM and directory blue, free sectors gray, read errors red, tracks without BAM yellow. Extra tracks 36 to 40 use a SpeedDOS or DolphinDOS BAM if one is found.
- Shows the directory in C64 style; selecting a file highlights its sectors.
- Files are read locally with the FileReader API; nothing is uploaded.

Code: `d64.js` parses and draws the image (no dependencies), `app.js` is the user interface.

### D64 Disk Editor

Edits Commodore 64 disk images: add and remove files, arrange the directory, add separator lines, defragment and save.

- Starts with an empty disk; New disk creates 35 or 40 track (SpeedDOS) images, Open loads an existing .d64 (35, 40 or 42 tracks).
- Add files by button or drag and drop; PC64 files (.P00, .S00, .U00) keep their C64 name. Files can be extracted again.
- New files are placed like the 1541 DOS does it: starting on the free track nearest to the directory track 18 where the whole file fits, then sector by sector with the chosen interleave (10 = 1541 standard).
- Directory: reorder by drag and drop, buttons or Alt+arrow keys; separator lines are DEL entries without data. Names can contain C64 graphics characters, the number of blocks shown for separators can be set freely.
- Defragment rewrites all PRG, SEQ and USR files so that each one lies on consecutive tracks next to the directory. REL files and used sectors that belong to no file (custom loaders, copy protection) stay where they are.
- Shows blocks free, directory usage, split files and a sector map of the whole disk. Undo and redo for every change.
- Saved images have no error info.

Code: `/assets/js/d64edit.js` is the disk library (no dependencies, also runs in Node.js), `app.js` is the user interface.

### D64 Disk Transfer

Reads, writes and formats real floppy disks in a 1541 or 1541-II drive through a [DiskBuddy64](https://github.com/wagiminator/C64-Collection/tree/master/C64_DiskBuddy64), [DiskMaster64](https://github.com/wagiminator/C64-Collection/tree/master/C64_DiskMaster64) or [DumpMaster64](https://github.com/wagiminator/C64-Collection/tree/master/C64_DumpMaster64) adapter.

- Uses the Web Serial API, which Chrome, Edge and Opera offer on desktop computers (not Firefox, Safari or iOS).
- The browser asks once which USB device to use (filtered to the adapters' USB ids). After that the app reconnects by itself, identifies the adapter by asking for its name and looks for drives 8 to 11, including the drive model.
- Read disk (optionally only sectors used in the BAM, error info for unreadable sectors), write disk (optionally with read-back verify), format disk (bump, demagnetize, verify) and read the directory. A sector map shows the progress; long operations can be stopped after the current track.
- A disk that was read can be downloaded or opened directly in the Disk Editor or Disk Viewer.
- Not supported: the xu1541, which uses the OpenCBM USB protocol instead of a serial port.

Code: `adapter.js` is a port of the adapters' Python library (`software/pc/libs/adapter.py`) including both block transfer variants, `drivecode.js` contains the 6502 fast loaders that are uploaded into the drive, `app.js` is the user interface.

### TAP Tape Transfer

Reads cassettes from a Commodore Datasette into TAP files and writes TAP files back to tape through a [TapeBuddy64](https://github.com/wagiminator/C64-Collection/tree/master/C64_TapeBuddy64), [TapeDump64](https://github.com/wagiminator/C64-Collection/tree/master/C64_TapeDump64) (read only) or [DumpMaster64](https://github.com/wagiminator/C64-Collection/tree/master/C64_DumpMaster64). Opening, inspecting and optimizing TAP files also works without an adapter and in any browser.

- Uses the Web Serial API (Chrome, Edge, Opera on desktop). After the first connection the adapter is found and identified automatically.
- Pulse view: every pulse plotted by its length, live while reading and with a moving position mark while writing; zoom, drag and an overview of the whole tape. ROM loader pilot, header, data and damaged blocks are colored. Histogram of pulse lengths.
- Tape contents: files saved with the standard C64 ROM loader are decoded (name, type, addresses, size) and both copies are checked.
- Optimize (a subset of what [TAPClean](https://sourceforge.net/projects/tapclean/) does): remove glitches, join pauses, set ROM loader pulses to their ideal lengths, repair damaged ROM loader blocks from the other copy, and move the pulses of other loaders onto the centers of clearly separated length groups. Turbo loaders are not decoded individually.
- The Tapuino has no USB connection to a computer; TAP files prepared here can be copied to its SD card.

Code: `/assets/js/tap.js` is the TAP library (no dependencies, also runs in Node.js), `tapeadapter.js` is a port of the adapters' Python tape scripts, `app.js` is the user interface.
