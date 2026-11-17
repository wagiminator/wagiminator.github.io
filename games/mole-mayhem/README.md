# Mole Mayhem

A turn-based artillery game for the browser, made as a homage to the classic *Worms* (Team17, 1995). Two to four teams of moles fight on a crumbling island, one turn at a time. Use rockets, grenades, air strikes and grappling hooks, and knock the other teams into the sea.
The island, the moles and all effects are drawn by code, and all music and sound effects are synthesized with the Web Audio API. There are no external assets and no build step. The name and characters are original. The moles are round and pink-nosed and wear helmets in their team colour.

## Features

- **Destructible islands**, generated from noise in four landscapes (meadow, desert, arctic, volcano), with caves, floating rocks, barrels and optional mines. Every blast tears a crater and throws moles around. Falls hurt, and the sea is deadly.
- **Turn-based battles** for 2 to 4 teams with 2 to 6 moles each, played by humans on one device or by computer players at three levels. Each turn has a clock and a short retreat after your shot. The wind changes every turn. Crates with health or weapons drop from the sky, and in sudden death the sea rises a little every turn.
- **Seventeen weapons and tools:**
  - Bazooka (pushed by the wind)
  - Homing missile
  - Grenade and cluster bomb (fuse 1–5 s)
  - Shotgun (two shots)
  - Baseball bat
  - Dynamite
  - Mine
  - Air strike
  - Drill
  - Blowtorch
  - Girder
  - Teleport
  - Jetpack
  - Grappling hook (swing, climb, let go)
  - Skip turn
  - Surrender
- **Computer players** fly every possible shot in advance with the same physics as the game. They weigh the damage to rivals against the damage to their own team, and then aim with a level-dependent error.
- Tracker-style soundtracks for each landscape and for sudden death, many sound effects, and short voice calls through the Web Speech API (can be switched off). A computer match plays behind the menus.
- Keyboard, mouse, touch (on-screen buttons) and gamepad controls, zoom, a map you can drag, and fullscreen mode (F). The screen stays awake while you play.

## Running it

The game is plain HTML and JavaScript. Open `index.html` directly, or serve the folder with any static web server, for example:

```
python3 -m http.server 8000
```

and open http://localhost:8000/ in Chrome, Edge or Firefox.

## Controls

| Action | Keyboard | Mouse / touch | Gamepad |
|---|---|---|---|
| Walk | ← → | ◀ ▶ buttons | stick / d-pad |
| Aim | ↑ ↓ | ▲ ▼ buttons | stick / d-pad |
| Jump / back-flip | Enter / Backspace | JUMP button | A / B |
| Fire (hold for power) | Space | FIRE button | X |
| Weapons | W or Tab | right click / ARMS button | Y |
| Grenade fuse | 1–5 | – | – |
| Targets (air strike, teleport, girder, homing) | – | click / tap | cursor + A |
| Look around / zoom | + / − | drag the map / wheel | right stick / LT RT |
| Pause | Esc | – | Start |
| Fullscreen / mute | F / M | – | – |

With the grappling hook, left and right swing, up and down change the length, and jump lets go. With the jetpack, up gives thrust and fire again stops it.

## Files

- `index.html`, `style.css`: page with one canvas
- `js/util.js`: helpers, input (mouse, touch, keyboard, gamepad), storage
- `js/audio.js`: music sequencer, instruments, sound effects and voices
- `js/draw.js`: drawing helpers and comic-style widgets
- `js/terrain.js`: island generator, textures, craters, girders
- `js/moles.js`: the moles, the weapons in their paws, graves, crates, barrels and mines
- `js/game.js`: the simulation, covering teams and turns, movement and physics, weapons, explosions, objects, water and sudden death
- `js/ai.js`: the computer players
- `js/ui.js`: screens for the title, match setup, results, options and help
- `js/play.js`: the match screen, with camera, drawing, HUD, weapon menu and controls
- `js/main.js`: main loop, scaling, fullscreen, screen wake lock, state machine
