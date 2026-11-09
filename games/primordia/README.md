# PRIMORDIA

A vertical shoot'em-up for the browser through eight ages of evolution, made as a homage to the Amiga classic *Xenon 2* (1989).
All graphics are drawn by code, all music and sound effects are synthesized with the Web Audio API – no external assets, no build step.

## Features

- Eight stages, each in two halves with a trading post in the middle and at the end, and a boss at the end of every stage:
  - The early ages: Primeval Ocean, Fossil Depths, Spore Jungle and Bio Core.
  - **The later ages**: Ice Age, Ember Age, Machine Age and Star Seed. These four stages are much harder:
    - Four parallax layers plus foreground particles.
    - New, tougher and faster enemies that also attack from the sides and from behind. Red arrows at the edge of the playfield warn you where they come from.
    - Their shots do more damage.
    - Fixed obstacles (ice, basalt, steel girders and star crystals) block your ship and your shots.
    - Four new bosses: Mammothrax, Pyrodrake, the Iron Colossus and the Astral Seed.
- Lots of add-ons that all fire at the same time: blaster (5 levels), side shot, rear shot, cannon, laser, homing missiles, electro balls, drones, mines, zapper, rapid fire, speed and armour – plus health, smart bombs, overdrive and extra lives. Add-ons can be sold back for half the price.
- Capsules during the flight: power, random weapon, speed, health, bomb and overdrive (all weapons at full power for a while).
- Parallax scrolling with detailed backgrounds and walls, large particle explosions, screen shake and flashes.
- Breakbeat-style soundtrack (title, trading post, four stages, boss) and sound effects, generated at runtime. The later ages have their own synthwave and dark-synth tracks with gated drums, sequencer bass, synth brass, bells and choir pads.
- Short voice announcements (Web Speech API) when you collect power-ups, when a boss appears and at the end of a stage. They can be switched off in the options.
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
- `js/deepgfx.js` – later ages: themes with parallax layers, enemy sprites, obstacles
- `js/world.js` – stages, ship and add-ons, enemies, obstacles and bosses
- `js/deep.js` – later ages: stages 5–8, enemies, attack patterns and bosses
- `js/ui.js` – title, options, trading post, HUD, highscores, name entry
- `js/main.js` – main loop, scaling, fullscreen, state machine
