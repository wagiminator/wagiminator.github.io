# X-Abyss

An underwater shoot'em-up for the browser, made as a homage to the Amiga classic *X-Out* (Rainbow Arts, 1990).
All graphics are drawn by code, all music and sound effects are synthesized with the Web Audio API – no external assets, no build step.

## Features

- Four stages (Coral Shelf, Wreck Graveyard, Magma Vents, The Hive), each with its own boss.
- Shipyard between the stages: main weapons (pulse cannon, spread cannon, pulse laser, wave gun), weapon power, satellites with five formations, homing missiles, depth charges, rear and side guns, deflector shield, armour, turbo engine, nova bombs, repairs and extra ships.
- Particle explosions with shock waves, debris, smoke and bubbles, screen shake and flashes.
- Tracker-style soundtrack (title, shipyard, four stages, boss) and sound effects, generated at runtime.
- Keyboard, mouse and gamepad controls, fullscreen mode (F).
- Highscore list (top 10, stored in the browser); entering a name is optional.

## Running it

The game is plain HTML and JavaScript. Open `index.html` directly, or serve the folder with any static web server, for example:

```
python3 -m http.server 8000
```

and open http://localhost:8000/ in Chrome, Edge or Firefox.

## Controls

| Action | Keyboard | Mouse | Gamepad |
|---|---|---|---|
| Move | Arrow keys / WASD | ship follows the pointer | left stick / D-pad |
| Fire (hold) | Space / J / Y | left button | A / RT |
| Satellite formation | X / K / Shift | right button / wheel | X / Y / LB / RB |
| Nova bomb | C / L / B | middle button | B / LT |
| Pause | P / Esc | – | Start |
| Fullscreen / mute | F / M | – | – |

## Files

- `index.html`, `style.css` – page with one canvas
- `js/util.js` – helpers, input (keyboard, mouse, gamepad), storage
- `js/audio.js` – music sequencer, instruments and sound effects
- `js/gfx.js` – sprites, backgrounds, particles and explosions
- `js/world.js` – stages, player, weapons, enemies and bosses
- `js/ui.js` – title, options, shipyard, HUD, highscores, name entry
- `js/main.js` – main loop, scaling, fullscreen, state machine
