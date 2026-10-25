# wagiminator.github.io

Personal page of wagiminator with links and small browser apps, published with GitHub Pages at <https://wagiminator.github.io/>.

## Structure

```
index.html              Start page (links and the "Web Apps" list)
assets/css/site.css     Shared styles and color tokens for all pages
apps/
  _template/            Starting point for a new app (not published)
  d64-viewer/           D64 Disk Viewer
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
