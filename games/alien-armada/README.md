# ALIEN ARMADA

A retro alien-invasion shooter in the spirit of *Space Invaders*, with detailed pixel graphics and techno music. It runs completely in the browser, with no build step, no external assets and no server code. All graphics, music and sounds are generated at runtime.

## Features

- **Five worlds with animated backgrounds:**
  - **Earth Orbit:** rotating planet, satellite.
  - **Moon Base:** scrolling craters, blinking domes.
  - **Neon City:** synthwave sun, skyline, moving grid.
  - **Asteroid Belt:** tumbling rocks, nebula.
  - **Alien Hive:** wormhole spiral, pulsing veins, spores.
- **Waves and motherships:** three waves per world, then a mothership with several attack patterns.
- **Aliens:** every world has its own aliens. They are pixel art generated from seeds, with two-frame animation and different shot types.
- **Classic features:** the marching formation speeds up with the famous four-note beat. There are destructible bunkers, a mystery UFO, and an extra life every 20,000 points.
- **Power-ups:** double shot, rapid fire, shield, laser beam and bomb.
- **Effects:** particle explosions, screen shake and retro scanlines.
- **Techno music:** a different track for every world, plus a boss track.
- **Voice:** short spoken announcements such as "Warning! Mothership approaching!". They can be switched off in the options.
- **Highscore list** (Top Gunners), stored locally in the browser. Entering a name is optional.
- **Fullscreen:** press `F` or use the options menu.
- **Controls:** keyboard, mouse and gamepad.

## Controls

| | Keyboard | Mouse | Gamepad |
|---|---|---|---|
| Move | ← → / A D | move the mouse | stick / D-pad |
| Fire | Space / X / K | left button (hold) | A / B / X / RT |
| Pause | Esc / P | Esc | Start |

## Testing locally

Open a terminal in the game folder and run:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Opening `index.html` directly also works in most browsers.

The fonts (Press Start 2P, Rajdhani) come from Google Fonts. Without an internet connection, the game falls back to the system fonts.

## Files

```
index.html       page
style.css        fullscreen canvas
js/util.js       helpers, input, storage
js/audio.js      Web Audio synthesizer and speech output
js/sound.js      the techno tracks and sound effects of this game
js/screens.js    title, options, controls, highscores, name entry
js/game.js       worlds, aliens, gameplay and drawing
js/main.js       main loop, scaling, fullscreen
```

## Publishing on GitHub Pages

Copy the folder as it is, for example to `games/alienarmada/`. All paths are relative.
