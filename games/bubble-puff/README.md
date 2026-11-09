# BUBBLE PUFF

A cute bubble-blowing platform game in the spirit of *Bubble Bobble*. It runs completely in the browser, with no build step, no external assets and no server code. All graphics, music and sounds are generated at runtime.

## Features

- **16 rounds in six areas.** Each area has its own layouts, tiles, background and enemies:
  - **Candy Cave:** wind-up robots.
  - **Jungle Ruins:** frogs and bees.
  - **Ice Palace:** penguins and snowmen that throw snowballs.
  - **Volcano:** fire-spitting imps and lava blobs.
  - **Ghost Castle:** ghosts and bats.
  - **Grumble's Throne:** the final battle against King Grumble, who throws potions. Pop the lightning bubbles to zap him.
- **Bubbles:** blow bubbles to trap monsters, then pop them. Several at once give a chain reaction with doubling bonus points (1,000, 2,000, 4,000 and more).
- **Fruit:** popped monsters turn into fruit and treats, from cherries to diamonds.
- **Bubble riding:** bounce on bubbles by holding jump.
- **Wrap-around:** fall through the bottom gap and you come back in at the top.
- **EXTEND letters:** collect E-X-T-E-N-D for an extra life.
- **Power-ups:** pink candy for rapid bubbles, blue candy for long-range bubbles, and speed shoes.
- **Hurry up:** dawdle too long and the monsters get angry, then a skull ghost appears.
- **Comic style:** a chubby little dragon with wings, blinking eyes and a wagging tail, plus lots of animated monsters.
- **Voice lines:** little spoken comments such as "Round 3. Let's pop!", "Triple pop!", "Yummy!" or "Hurry up!". They can be switched off in the options.
- **Music:** a different song for every world, plus a boss tune and a hurry-up tune.
- **Highscore list** (Bubble Stars), stored locally in the browser. Entering a name is optional.
- **Fullscreen:** press `F` or use the options menu.
- **Controls:** keyboard, mouse and gamepad.

## Controls

| | Keyboard | Mouse | Gamepad |
|---|---|---|---|
| Walk | ← → / A D | move the cursor to the left or right of the dragon | stick / D-pad |
| Jump | ↑ / W / Space / Z | right button | A |
| Blow a bubble | X / K / C / Shift | left button | B / X |
| Pause | Esc / P | Esc | Start |

## Testing locally

Open a terminal in the game folder and run:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Opening `index.html` directly also works in most browsers.

The fonts (Fredoka, Nunito) come from Google Fonts. Without an internet connection, the game falls back to the system fonts.

## Files

```
index.html       page
style.css        fullscreen canvas
js/util.js       helpers, input, storage
js/audio.js      Web Audio synthesizer and speech output
js/sound.js      the songs and sound effects of this game
js/levels.js     the 16 round layouts
js/screens.js    title, options, controls, highscores, name entry
js/game.js       gameplay, characters, worlds and drawing
js/main.js       main loop, scaling, fullscreen
```

## Publishing on GitHub Pages

Copy the folder as it is, for example to `games/bubblepuff/`. All paths are relative.
