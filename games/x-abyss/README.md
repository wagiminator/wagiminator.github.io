# X-Abyss

An underwater shoot'em-up for the browser, made as a homage to the Amiga classic *X-Out* (Rainbow Arts, 1990).
All graphics are drawn by code, all music and sound effects are synthesized with the Web Audio API – no external assets, no build step.

## Features

- Eight stages, each with its own boss:
  - The first zone: Coral Shelf, Wreck Graveyard, Magma Vents and The Hive.
  - The **deep zone**: Trench Gate, Crystal Caverns, Frozen Rift and Abyss Core. These four stages are much harder:
    - Multi-layer parallax backgrounds.
    - New, tougher and faster enemies that also attack from behind, from above and from below. Red arrows at the screen edge warn you where they come from.
    - Their shots do more damage.
    - Fixed obstacles (girders, crystal and ice columns, energy pylons) block your ship and your shots.
    - Four new bosses: the Iron Leviathan, the Prism Colossus, the Cryo Kraken and the Omega Heart.
- Shipyard between the stages: main weapons (pulse cannon, spread cannon, pulse laser, wave gun), weapon power, satellites with five formations, homing missiles, depth charges, rear and side guns, deflector shield, armour, turbo engine, nova bombs, repairs and extra ships.
- Particle explosions with shock waves, debris, smoke and bubbles, screen shake and flashes.
- Tracker-style soundtrack (title, shipyard, four stages, boss) and sound effects, generated at runtime. The deep zone has its own dark techno and industrial tracks with an acid bass.
- Short voice announcements (Web Speech API) when you collect power-ups, when a boss appears and at the end of a stage. They can be switched off in the options.
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
- `js/deepgfx.js` – deep zone: themes with parallax layers, enemy sprites, obstacles
- `js/world.js` – stages, player, weapons, enemies, obstacles and bosses
- `js/deep.js` – deep zone: stages 5–8, enemies, attack patterns and bosses
- `js/ui.js` – title, options, shipyard, HUD, highscores, name entry
- `js/main.js` – main loop, scaling, fullscreen, state machine
