/* ===================================================================
 * Preview of the cartridge menu screen
 * -------------------------------------------------------------------
 * Draws the menu the way menu.asm does (40x25 characters, colors and
 * frame characters from its tables), using the layout values that
 * cartgen.js writes into the image. Glyphs are drawn as blocks and
 * with a pixel font, so the look is close but not exact; the C64
 * character ROM is not included. The waving of the menu is not shown.
 * Global: PREVIEW.draw(canvas, screen, help)
 * =================================================================== */
(function (global) {
  "use strict";

  // C64 palette (Pepto)
  const PAL = ["#000000", "#ffffff", "#68372b", "#70a4b2", "#6f3d86", "#588d43", "#352879", "#b8c76f",
    "#6f4f25", "#433900", "#9a6759", "#444444", "#6c6c6c", "#9ad284", "#6c5eb5", "#959595"];
  const PAPER = 0, SCREEN_COL = 6, FRAME = 10, SHADOW = 2, TEXT = 5, KEY1 = 12, KEY2 = 15;
  const KEYS = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

  // Cell shapes: rectangles in 8x8 pixels [x, y, w, h]
  const SHAPES = {
    full: [[0, 0, 8, 8]],
    upper: [[0, 0, 8, 4]], lower: [[0, 4, 8, 4]], left: [[0, 0, 4, 8]], right: [[4, 0, 4, 8]],
    ul: [[0, 0, 8, 4], [0, 4, 4, 4]], ur: [[0, 0, 8, 4], [4, 4, 4, 4]],
    dl: [[0, 4, 8, 4], [0, 0, 4, 4]], dr: [[0, 4, 8, 4], [4, 0, 4, 4]],
    capL: [[3, 0, 5, 8]], capR: [[0, 0, 5, 8]],
  };

  function draw(canvas, screen, help) {
    const S = 8, W = 40, H = 25, B = 16;                 // cell size, screen size, border
    canvas.width = W * S + 2 * B;
    canvas.height = H * S + 2 * B;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = PAL[SCREEN_COL];                     // border color
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = PAL[PAPER];
    ctx.fillRect(B, B, W * S, H * S);
    ctx.font = "8px 'Press Start 2P', monospace";
    ctx.textBaseline = "top";

    const cell = (cx, cy) => [B + cx * S, B + cy * S];
    const shape = (cx, cy, name, color) => {
      if (cx < 0 || cx >= W || cy < 0 || cy >= H) return;
      const [px, py] = cell(cx, cy);
      ctx.fillStyle = PAL[color];
      for (const [x, y, w, h] of SHAPES[name]) ctx.fillRect(px + x, py + y, w, h);
    };
    const checker = (cx, cy, color) => {
      if (cx < 0 || cx >= W || cy < 0 || cy >= H) return;
      const [px, py] = cell(cx, cy);
      ctx.fillStyle = PAL[color];
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if ((x + y) % 2 === 0) ctx.fillRect(px + x, py + y, 1, 1);
    };
    const text = (cx, cy, str, color, reverse) => {
      [...str].forEach((ch, i) => {
        const x = cx + i;
        if (x < 0 || x >= W) return;
        const [px, py] = cell(x, cy);
        if (reverse) { ctx.fillStyle = PAL[color]; ctx.fillRect(px, py, S, S); }
        if (ch !== " ") {
          ctx.fillStyle = PAL[reverse ? PAPER : color];
          ctx.fillText(ch, px, py + 0.5);
        }
      });
    };

    // Screen: reversed spaces in blue, title and help line reversed
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) shape(x, y, "full", SCREEN_COL);
    if (!screen) return;
    text(0, 0, screen.title, SCREEN_COL, true);
    text(0, 24, help, SCREEN_COL, true);

    // Menu frame (draw_menu_border)
    const { x, y, width, height, spacing } = screen;
    const lines = spacing ? height * 2 - 1 : height;
    const clearCell = (cx, cy) => { if (cx >= 0 && cx < W && cy >= 0 && cy < H) { const [px, py] = cell(cx, cy); ctx.fillStyle = PAL[PAPER]; ctx.fillRect(px, py, S, S); } };
    // top line
    clearCell(x, y); shape(x, y, "ul", FRAME);
    for (let i = 1; i <= width; i++) { clearCell(x + i, y); shape(x + i, y, "upper", FRAME); }
    clearCell(x + width + 1, y); shape(x + width + 1, y, "ur", FRAME);
    // middle lines
    for (let l = 0; l < lines; l++) {
      const cy = y + 1 + l;
      clearCell(x, cy); shape(x, cy, "left", FRAME);
      for (let i = 1; i <= width; i++) clearCell(x + i, cy);
      clearCell(x + width + 1, cy); shape(x + width + 1, cy, "right", FRAME);
      clearCell(x + width + 2, cy); checker(x + width + 2, cy, SHADOW);
    }
    // bottom line and shadow line
    const by = y + 1 + lines;
    clearCell(x, by); shape(x, by, "dl", FRAME);
    for (let i = 1; i <= width; i++) { clearCell(x + i, by); shape(x + i, by, "lower", FRAME); }
    clearCell(x + width + 1, by); shape(x + width + 1, by, "dr", FRAME);
    clearCell(x + width + 2, by); checker(x + width + 2, by, SHADOW);
    for (let i = 1; i <= width + 2; i++) { clearCell(x + i, by + 1); checker(x + i, by + 1, SHADOW); }

    // Items (draw_menu_items): key cap at x+1..x+3, name from x+4
    const iwidth = width - 3;
    const visible = Math.min(height, screen.items.length);
    for (let i = 0; i < visible; i++) {
      const cy = y + 1 + i * (spacing ? 2 : 1);
      const last = i === screen.items.length - 1;
      shape(x + 1, cy, "capL", KEY1);
      text(x + 2, cy, last ? "←" : KEYS[i], KEY2, true);
      shape(x + 3, cy, "capR", KEY1);
      text(x + 4, cy, screen.items[i].slice(0, iwidth), TEXT, false);
    }
  }

  global.PREVIEW = { draw };
})(typeof window !== "undefined" ? window : globalThis);
