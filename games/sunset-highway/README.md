# Sunset Highway

A pseudo-3D arcade road racer for the browser, made as a homage to the 1986 arcade classic *Out Run*.
All graphics are drawn by code, all music and sound effects are synthesized with the Web Audio API – no external assets, no build step.

## Features

- Five rows of stages with a fork at the end of each: keep left or right to choose the next landscape. 15 stages in ten landscapes (beach, desert, forest, canyon, farmland, alps, volcano, city, autumn lake, sunset coast) at day, sunset or night, and five different goals with their own little ending.
- Curves, hills, traffic (cars, taxis, vans, trucks), checkpoints with extended time, a time limit and a route map.
- Two gears (LOW pulls hard, HIGH is fast) with automatic or manual gearbox.
- Retro graphics in a low-resolution frame buffer, parallax backgrounds, animated windmills, crowds, seagulls and tumbleweeds.
- A driver and a passenger who comment on the drive, cheer on hill tops, get thrown out of the car in a crash and take it out on each other afterwards.
- Three radio stations to choose from before the start (and during the race), plus engine, tyre and wind sounds.
- Keyboard, mouse and gamepad controls (analog steering and triggers), fullscreen mode (F).
- Highscore list (top 10, stored in the browser); entering a name is optional.

## Running it

Open `index.html` directly in Chrome, Edge or Firefox, or serve the folder with any static web server, for example `python3 -m http.server 8000`, and open http://localhost:8000/.

## Controls

| Action | Keyboard | Mouse | Gamepad |
|---|---|---|---|
| Steer | ← → / A D | pointer left / right | left stick / D-pad |
| Accelerate | ↑ / W / Space | left button | A / RT |
| Brake | ↓ / S / K | right button | B / LT |
| Gear (manual gearbox) | Shift / X / G | wheel / middle button | X / Y / LB / RB |
| Next radio station | R | – | Back / Select |
| Pause | P / Esc | – | Start |
| Fullscreen / mute | F / M | – | – |

## Files

- `index.html`, `style.css` – page with one canvas
- `js/util.js` – helpers, input (keyboard, mouse, gamepad), storage
- `js/audio.js` – radio stations, engine sound and sound effects
- `js/gfx.js` – sprites, landscapes and sky
- `js/race.js` – route, track building, pseudo-3D renderer, physics, traffic, the car and its passengers
- `js/ui.js` – title, radio selection, HUD, route map, goal scenes, highscores, name entry
- `js/main.js` – main loop, scaling, fullscreen, state machine
