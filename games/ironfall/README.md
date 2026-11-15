# Ironfall

A run-and-gun action platformer for the browser, made as a homage to the C64/Amiga classic *Turrican* (Rainbow Arts, 1990).
All graphics are drawn by code, all music and sound effects are synthesized with the Web Audio API – no external assets, no build step.

## Features

- Five worlds with two large stages each, ten stages in total:
  - **Alien Frontier**: Landing Zone, Sunset Ridge – boss: the **Iron Fist**.
  - **Crystal Caverns**: Crystal Descent, Prism Depths – boss: the **Crystal Widow**.
  - **Bio Hive**: Hive Gate, Brood Chamber – boss: the **Hive Mind**.
  - **Steel Foundry**: Steel Foundry, Assembly Line – boss: the **Titan Walker**.
  - **Machine Core**: Core Access, The Overmind – final boss: **The Overmind** (three phases).
- Big levels that scroll in all directions: climbing shafts, drops, bottomless pits, pools of toxic water, acid, molten steel and plasma, spikes, cracked walls, crushers, moving platforms, hidden ledges and secret tunnels that only the gyroscope fits through. Checkpoints and a time limit.
- Multi-layer parallax backgrounds for every world (ringed planet and mesas, crystal caves, living hive, foundry, machine core) and a night variant for the second stage of a world.
- 20 enemy types: walkers, hoppers, wasps, flying swarms, turrets, hive pods and drone factories, ceiling droppers, spiked rollers, crawlers, leaping liquid creatures, worms, floating mines, bombers, shielded soldiers (the shield blocks most shots from the front), jetpack troopers, missile pods, spider mechs and acid spitters – coloured to match each world.
- Weapons:
  - Five main weapons with four power levels each: Spread Shot, Laser (pierces), Rebound (bounces off walls), Flamer and Homing missiles.
  - The **lightning beam**: hold it and sweep it around like the famous Turrican whip.
  - **Power lines**: two energy walls sweep across the whole screen.
  - **Gyroscope**: turn into an invulnerable wheel, roll through narrow tunnels and drop mines.
- Floating blocks that release weapons and power-ups when shot: power-up, energy, shield, diamonds, extra lives, time bonus, power lines and gyroscopes. 100 diamonds or every 100,000 points give an extra life.
- Large particle explosions with fireballs, shock waves, flying debris with smoke trails, screen shake and flashes; chain explosions for big enemies and bosses.
- Tracker-style soundtrack in the spirit of late-80s Amiga music: title theme, one track per world (heroic, crystal, acid, industrial, dark techno), boss and final boss music, jingles and many sound effects.
- Short voice announcements (Web Speech API) when you collect extras, reach a checkpoint, when a boss appears or is destroyed and at the end of a stage. They can be switched off in the options.
- Keyboard, mouse (360° aiming) and gamepad controls (twin-stick aiming with the right stick), fullscreen mode (F).
- Top 10 highscore list stored in the browser; entering a name is optional.

## Running it

The game is plain HTML and JavaScript. Open `index.html` directly, or serve the folder with any static web server, for example:

```
python3 -m http.server 8000
```

and open http://localhost:8000/ in Chrome, Edge or Firefox.

## Controls

| Action | Keyboard | Mouse | Gamepad |
|---|---|---|---|
| Run / aim | Arrow keys / WASD | – | left stick / D-pad |
| Aim freely | – | pointer | right stick |
| Jump | Space / K | – | A |
| Fire (hold) | J / X / N | left button | X / RT |
| Lightning beam (hold) | L / C, ↑/↓ rotates it | right button | Y / RB |
| Power line | I / V / B | middle button | LB / LT |
| Gyroscope | Shift / G / U | wheel | B |
| Crouch / drop through a platform | ↓ / ↓ + Jump | – | down / down + A |
| Pause | P / Esc | – | Start |
| Fullscreen / mute | F / M | – | – |

## Files

- `index.html`, `style.css` – page with one canvas
- `js/util.js` – helpers, input (keyboard, mouse, gamepad), storage
- `js/audio.js` – music sequencer, instruments, sound effects and voice announcements
- `js/gfx.js` – drawing helpers, sprite caches, particles and explosions
- `js/sprites.js` – the player's suit, items and projectiles
- `js/themes.js` – the five worlds: parallax layers, tiles, liquids and ambient particles
- `js/levels.js` – worlds, stages and the segment-based level builder (fixed seeds, so every stage always looks the same)
- `js/game.js` – player, physics, weapons, items, checkpoints, camera and stage flow
- `js/enemies.js` – enemy types
- `js/bosses.js` – the five bosses
- `js/ui.js` – title, options, controls, HUD, highscores, name entry
- `js/main.js` – main loop, scaling, fullscreen, state machine
