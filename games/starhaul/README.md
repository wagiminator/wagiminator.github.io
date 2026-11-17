# STARHAUL

A 3D space trading and combat game in the spirit of the 8-bit classic *Elite* (1984). It runs in the browser and needs no build step and no server code.

The models, planets, nebulae, music and sounds are all generated when the game runs. The only library is [three.js](https://threejs.org) (MIT licence). It is included in `lib/`, so the game also works offline. Only the fonts come from Google Fonts.

## Features

- **The universe:** 8 galaxies with 256 star systems each, so 2,048 worlds in total. Every system has its own economy, government, tech level, population, inhabitants and description.
- **3D worlds:** planets with procedural terrain, clouds, atmosphere, city lights or glowing lava, plus rings and moons. Every system also has a star, a nebula sky and a rotating orbital station.
- **Trading:** 17 commodities. Prices and stock depend on the economy and change on every visit. Narcotics, firearms and service droids are illegal.
- **Ships:** 7 ships to buy, from the Wren Courier to the Seraph Explorer, with trade-in of your old ship. There are also pirates, police, bounty hunters, traders, asteroids and an alien hive ship with drones.
- **Danger that grows with you:** as a beginner you meet pirates rarely and mostly alone. They show up more often, in larger groups and more aggressively as your combat rating and flight time grow. Anarchies are always rougher than safe systems.
- **Equipment:**
  - Pulse, beam, military and mining lasers, front and rear.
  - Missiles with target lock and an E.C.M. system.
  - A larger cargo bay and fuel scoops (for canisters and skimming stars).
  - An escape pod, an energy bomb and an extra energy unit.
  - A shield booster, a docking computer and a galactic hyperdrive.
- **Combat:** front and rear shields, energy banks, laser heat, cabin temperature near stars, homing missiles, and big explosions with fireballs, sparks, shockwaves, debris and smoke.
- **Flight:**
  - An in-system jump drive with mass lock and interdictions.
  - Hyperspace jumps with a tunnel effect and the occasional misjump.
  - Docking by hand into the spinning slot, or by docking computer (with a waltz, of course).
- **Career:**
  - A combat rating from *Harmless* up to *LEGEND*.
  - A legal status (clean, offender, fugitive) with fines, police and bounty hunters.
  - Bounties and a score.
  - Your career is saved automatically when you dock, and you can keep one backup save.
- **Highscore list** (Hall of Legends), stored locally in the browser. Entering a name is optional.
- **Sound:** synthesized music with different moods for title, station, quiet space, industrial and agricultural systems, anarchies, combat and the aliens. There is also an engine hum and many sound effects.
- **Fullscreen**: press `F` or use the options menu. The screen stays awake while you fly.
- **Controls:** keyboard, mouse and gamepad.
- **Graphics settings:** FAST, NICE and ULTRA in the options menu.

## Controls

**Keyboard**

| Key | Action |
|---|---|
| W / ↑, S / ↓ | dive / climb (invertible in the options) |
| A / ←, D / → | roll |
| Q / E | yaw |
| Shift / X | faster / slower |
| Space | fire laser |
| T / M | target lock / launch missile |
| Z | E.C.M. |
| J | jump drive (within a system) |
| Tab | star map (select a destination) |
| H / G | hyperspace / galactic hyperdrive |
| L | docking computer |
| B | energy bomb |
| Delete | escape pod |
| 1 – 4, 5 or C | front, rear, left and right view, chase camera |
| Esc / P | pause |
| F / N | fullscreen / mute |

**Mouse**

- The cursor's offset from the centre of the screen steers.
- Left button fires the laser, right button locks a target and fires a missile, and the middle button cycles through targets.
- The wheel controls the throttle.

**Gamepad**

| Control | Action |
|---|---|
| Left stick | pitch and roll |
| Right stick | yaw |
| RT / LT | throttle |
| A | laser |
| B | missile |
| X | target |
| Y | jump drive |
| LB | E.C.M. |
| RB | chase camera |
| D-pad ↑ / ↓ / ← / → | hyperspace / docking computer / energy bomb / rear view |
| Back | star map |
| Start | pause |

**At the station**

- Switch pages with Q / E, Tab, 1–7, LB / RB or a click.
- In the market, → buys and ← sells. Hold Shift to trade 10 units at a time.

## Getting started

1. You begin docked with 100 credits.
2. In the **MARKET**, buy goods that are cheap here. Food, textiles and furs are cheap in agricultural systems. Computers, machinery and luxuries are cheap in industrial ones.
3. Open the **STAR MAP**, pick a system of the opposite economy within range, and **LAUNCH**.
4. Fly away from the station and press `H` to jump.
5. In the new system, use `J` to cross the distance quickly. Once you are close, dock by hand or with the docking computer.
6. Sell your cargo. Repeat, and spend the profit on better lasers, a bigger cargo bay, fuel scoops and eventually a new ship.

## Testing locally

Double-click `index.html` to open it from the disk, or serve the folder with a small web server, which is the same setup as GitHub Pages:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. A recent Chrome, Edge or Firefox with WebGL is needed.

If the browser cannot start WebGL, the game shows a message instead of a black screen. This happens when graphics acceleration is switched off, or when Chrome on Linux blocks the graphics card. To fix it in Chrome:

1. Open `chrome://settings/system` and switch on "Use graphics acceleration when available", then restart Chrome.
2. Check `chrome://gpu`. "WebGL" should say "Hardware accelerated".
3. If the graphics card is blocklisted, enable `chrome://flags/#ignore-gpu-blocklist`.

## Files

```
index.html             page
style.css              the two canvases (3D view and HUD)
js/util.js             helpers, storage, input (keyboard, mouse, gamepad)
js/audio.js            Web Audio synthesizer: music, engine hum and sound effects
js/starhaul.js         the game, bundled from src/ together with three.js (built by build.sh)
src/galaxy.js          procedural galaxies, systems, descriptions, markets and ranks
src/ships.js           ship classes, equipment and the procedural 3D models (incl. the station)
src/planetworker.wjs   texture painter for planets, clouds and nebulae (runs in a web worker)
src/world.js           renderer, bloom, star systems, beams, explosions, hyperspace tunnel
src/flight.js          flight model, AI, weapons, docking, jump drive, hyperspace, encounters
src/state.js           commander, money, markets, saving, highscores
src/hud.js             cockpit HUD: 3D scanner, gauges, compass, target brackets
src/ui.js              title, station menus, star map, pause, game over, highscores, options
src/main.js            main loop, scaling, fullscreen, state machine
lib/                   three.js r169 (MIT) and the post-processing addons used for bloom
build.sh               rebuilds js/starhaul.js from src/ with esbuild
```

The game is shipped as one classic script, so it also runs from `file://` and needs no import map or module loading.

## Credits

The docking waltz is an arrangement of *The Blue Danube* by Johann Strauss II (1866, public domain), as a nod to the original. All other music, the ship designs and all names are original.
