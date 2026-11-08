# PRIMORDIA

A vertical shoot'em-up for the browser through four ages of evolution, made as a homage to the Amiga classic *Xenon 2* (1989).
All graphics are drawn by code, all music and sound effects are synthesized with the Web Audio API – no external assets, no build step.

## Features

- Four stages (Primeval Ocean, Fossil Depths, Spore Jungle, Bio Core), each in two halves with a trading post in the middle and at the end, and a boss at the end of every stage.
- Lots of add-ons that all fire at the same time: blaster (5 levels), side shot, rear shot, cannon, laser, homing missiles, electro balls, drones, mines, zapper, rapid fire, speed and armour – plus health, smart bombs, overdrive and extra lives. Add-ons can be sold back for half the price.
- Capsules during the flight: power, random weapon, speed, health, bomb and overdrive (all weapons at full power for a while).
- Parallax scrolling with detailed backgrounds and walls, large particle explosions, screen shake and flashes.
- Breakbeat-style soundtrack (title, trading post, four stages, boss) and sound effects, generated at runtime.
- Keyboard, mouse and gamepad controls, fullscreen mode (F).
- Highscore list (top 10, stored in the browser); entering a name is optional.

## Running it

Open `index.html` directly in Chrome, Edge or Firefox, or serve the folder with any static web server, for example `python3 -m http.server 8000`, and open http://localhost:8000/.

## Controls

| Action | Keyboard | Mouse | Gamepad |
|---|---|---|---|
| Move | Arrow keys / WASD | ship follows the pointer | left stick / D-pad |
| Fire (hold) | Space / J / Y | left button | A / RT |
| Smart bomb | C / L / B / X | right button | B / X / LT |
| Pause | P / Esc | – | Start |
| Fullscreen / mute | F / M | – | – |

In the trading post, the bomb key or the right mouse button switches between buying and selling.

## Files

- `index.html`, `style.css` – page with one canvas
- `js/util.js` – helpers, input (keyboard, mouse, gamepad), storage
- `js/audio.js` – music sequencer, instruments and sound effects
- `js/gfx.js` – sprites, parallax layers, walls, particles and explosions
- `js/world.js` – stages, ship and add-ons, enemies and bosses
- `js/ui.js` – title, options, trading post, HUD, highscores, name entry
- `js/main.js` – main loop, scaling, fullscreen, state machine
