# DREAMHOP

A cute jump-and-run for the browser through four dream worlds, made as a homage to the 1987 home computer classic *The Great Giana Sisters*.
The heroine Lulu, all enemies, bosses, levels, graphics and music are original. Everything is drawn by code and synthesized with the Web Audio API – no external assets, no build step.

## Features

- Four worlds with three levels each: Meadow of Naps, Crystal Caverns, Sugar Hills and Starlight Clouds. The last level of every world ends with a boss.
- Star blocks with gems, hidden blocks, bricks, springs, moving platforms, spikes, pits, lava and chocolate, pillows as checkpoints and a time limit.
- Power-ups: the dream orb (wild hair that smashes bricks), the star wand (bouncing star shots), clock (freezes enemies), lightning (clears the screen), bubble (invincibility) and lollipops (extra life). 100 gems give an extra life.
- Cute pixel graphics with parallax backgrounds and lots of small animations: Lulu yawns and falls asleep when you wait, enemies get squashed with little stars, blocks bounce, bricks crumble.
- Chiptune soundtrack with a theme for each world, a boss theme and jingles.
- Keyboard, mouse and gamepad controls, fullscreen mode (F).
- Highscore list (top 10, stored in the browser); entering a name is optional.

## Running it

Open `index.html` directly in Chrome, Edge or Firefox, or serve the folder with any static web server, for example `python3 -m http.server 8000`, and open http://localhost:8000/.

## Controls

| Action | Keyboard | Mouse | Gamepad |
|---|---|---|---|
| Walk | ← → / A D | point left or right of Lulu | stick / D-pad |
| Jump (hold = higher) | ↑ / W / Space / Y / J | left button | A / Y / stick up |
| Shoot stars (with the wand) | X / K / C / Shift | right button | B / X / RB / RT |
| Pause | P / Esc | – | Start |
| Fullscreen / mute | F / M | – | – |

## Files

- `index.html`, `style.css` – page with one canvas
- `js/util.js` – helpers, input (keyboard, mouse, gamepad), storage
- `js/audio.js` – music sequencer, instruments and sound effects
- `js/gfx.js` – pixel graphics for Lulu, enemies, items, tiles and backgrounds
- `js/levels.js` – level building blocks and the level builder
- `js/game.js` – physics, blocks, items, enemies, bosses and rendering
- `js/ui.js` – title, world intro, HUD, game over, ending, highscores, name entry
- `js/main.js` – main loop, scaling, fullscreen, state machine
