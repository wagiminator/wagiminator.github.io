# DEEP DINER

A comic underwater eat-and-grow game in the spirit of *Feeding Frenzy*. It runs completely in the browser, with no build step, no external assets and no server code. All graphics, music and sounds are generated at runtime.

## Features

- **Five worlds with two levels each:**
  - Coral Reef
  - Kelp Forest
  - Sunken Ship
  - Frozen Sea
  - The Abyss, which is dark except for the light around you
- **Eat and grow:** eat smaller fish (green outline) and avoid bigger ones (red outline). Grow through three sizes until you are the king of the level.
- **Frenzies:** eat quickly in a row for a **Feeding Frenzy** and a **Double Frenzy**.
- **Creatures:** guppies, neon tetras, shrimp, clownfish, angelfish, pufferfish that puff up, groupers, tuna, barracudas, lionfish, glowing anglerfish, sharks, orcas and rare bonus seahorses.
- **Hazards and treasure:** stinging jellyfish, sea mines, and oysters with pearls.
- **Comic style:** animated fish with mouths, blinking eyes, wagging tails and bubble trails. The worlds have light rays, caustics, swaying kelp, distant schools of fish and plankton.
- **Speech output:** spoken comments such as "Feeding frenzy!", "Growth spurt!", "Shark! Swim for your life!" or "Burp!". This uses the browser's Web Speech API and can be switched off in the options.
- **Music:** a different song for every world, plus many sound effects.
- **Highscore list** (Top Feeders), stored locally in the browser. Entering a name is optional.
- **Fullscreen**: press `F` or use the options menu.
- **Controls:** mouse, keyboard and gamepad.

## Controls

| | Mouse | Keyboard | Gamepad |
|---|---|---|---|
| Swim | move the mouse | arrows / W A S D | stick / D-pad |
| Dash | left or right button | Space / Shift | A / B / X |
| Pause | Esc | Esc / P | Start |

`F` toggles fullscreen and `M` mutes the sound.

## Testing locally

Open a terminal in the game folder and run:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Opening `index.html` directly from the file system (`file://`) also works in most browsers.

The fonts (Luckiest Guy, Nunito) come from Google Fonts. Without an internet connection, the game falls back to the system fonts. The voices depend on the browser and operating system.

## Files

```
index.html       page
style.css        fullscreen canvas
js/util.js       helpers, input (keyboard, mouse, gamepad), storage
js/audio.js      Web Audio synthesizer and speech output
js/sound.js      the songs and sound effects of this game
js/screens.js    title, options, controls, highscores, name entry
js/game.js       worlds, creatures, gameplay and drawing
js/main.js       main loop, scaling, fullscreen
```

## Publishing on GitHub Pages

Copy the folder as it is, for example to `games/deepdiner/`. All paths are relative.
