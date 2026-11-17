# Mossling March

A puzzle game for the browser, made as a homage to the classic *Lemmings* (DMA Design / Psygnosis, 1991). Little round moss sprites with a sprout on their heads march out of a hollow log and walk straight on, over cliffs and into water. Give them jobs so that enough of them reach the round door.
The terrain and the scenery are drawn by code as pixel art and the mosslings as smooth vector sprites, and all music and sound effects are synthesized with the Web Audio API. There are no external assets and no build step. The name, characters and levels are original.

## Features

- **Eight jobs**, each with a clear icon and a short label in the panel (CLIMB, FLOAT, BOMB, BLOCK, BRIDGE, BASH, MINE, DIG):
  - **Climbers** scale walls.
  - **Floaters** glide down on a leaf.
  - **Bombers** count down and blast a crater.
  - **Blockers** turn everyone around.
  - **Builders** lay a stairway of twelve bricks.
  - **Bashers** tunnel straight ahead.
  - **Miners** dig down at a slant.
  - **Diggers** dig straight down.
- **Destructible pixel terrain:** every cell of the ground can be dug, bashed, mined or blown away, except steel. Stone with arrows only gives way in the direction of the arrows. Long falls are fatal, and water and lava are deadly.
- **Twenty levels** in four ratings, each with its own landscape:
  - Sprout (meadow)
  - Sapling (forest)
  - Timber (crystal caves)
  - Ancient (frost peaks)
- **The rules of the original:** each level gives you a number of mosslings and a share you must bring home. You get a limited set of jobs, a release rate you can raise, and a clock. A double-click on the bomb button blows up everyone.
- Scrolling playfield with a minimap, pause and fast forward, level previews, and your best result for each level. Each level you complete unlocks the next one.
- Tracker-style soundtrack with a tune for every landscape, many sound effects, and a few cheerful voice lines through the Web Speech API (can be switched off).
- Mouse and touch, keyboard and gamepad controls, fullscreen mode (F), and the screen stays awake while you play.

## Running it

The game is plain HTML and JavaScript. Open `index.html` directly, or serve the folder with any static web server, for example:

```
python3 -m http.server 8000
```

and open http://localhost:8000/ in Chrome, Edge or Firefox.

## Controls

| Action | Mouse / touch | Keyboard | Gamepad |
|---|---|---|---|
| Choose a job | click / tap a button | 1–8, Q / E | LB / RB |
| Give the job | click / tap a mossling | Enter | A |
| Release rate | − / + buttons | − / + | LT / RT |
| Scroll | screen edge, minimap / drag | A / D, arrow keys | D-pad, right stick |
| Pause / fast forward | buttons | Space / X | Y / X |
| Blow up everyone | bomb button twice | N twice | Back twice |
| Menu | – | Esc | Start |
| Fullscreen / mute | – | F / M | – |

## Files

- `index.html`, `style.css`: page with one canvas
- `js/util.js`: helpers, input (mouse, touch, keyboard, gamepad), storage
- `js/audio.js`: music sequencer, instruments, sound effects and voices
- `js/draw.js`: drawing helpers, wooden boards and leafy buttons
- `js/terrain.js`: the destructible terrain, which is painted from shapes, textured by code and changed cell by cell
- `js/sprites.js`: the mosslings in every pose (smooth vector drawings), the hollow log and the home door
- `js/game.js`: the simulation, covering release, walking and falling, the eight jobs, hazards, the exit and the clock
- `js/levels.js`: the twenty levels
- `js/ui.js`: screens for the title, level choice, level intro, results, options and help
- `js/play.js`: the level screen, with the playfield and scenery, the job panel, the minimap and all input
- `js/main.js`: main loop, scaling, fullscreen, screen wake lock, state machine
