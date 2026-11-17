# Pearl Panic

A marble-shooting puzzle game for the browser, made as a homage to the classic *Zuma* (PopCap, 2003). Chains of pearls roll along winding grooves towards a giant clam. Puff the pufferfish spits pearls into the chains, and three or more of the same colour pop. Clear every chain before a pearl slips into the clam.
The underwater worlds, the pearls and all effects are drawn by code, and all music and sound effects are synthesized with the Web Audio API. There are no external assets and no build step. The name and characters are original: Puff is a round, spiky pufferfish who carries the next pearl in a little shell on his head.

## Features

- **20 levels in four worlds:** Coral Reef, Kelp Forest, Sunken Ruins and The Abyss. Tracks are spirals, snakes, starfish swirls and square mazes, and some levels have two chains at once. New worlds bring more colours and faster chains.
- **Chain reactions:** when a gap closes and the pearls on both sides have the same colour, the front part rolls back. If that makes another match, it counts as a combo. Pearls often come in pairs, and Puff only offers colours that are still on the board.
- **Power pearls:** Slow down, Reverse, Sharp eye (a laser sight and faster shots) and Blast. Gold coins appear now and then for extra points, and every 10,000 points give an extra life.
- **Stars and bonuses:** each level gives up to three stars (cleared, no life lost, ace time) plus a clear bonus, a time bonus and a perfect bonus. Best scores and stars are saved in the browser, and each cleared level unlocks the next.
- A tracker-style soundtrack for each world, a fast tune when the chain gets close to the clam, many sound effects, and short voice calls through the Web Speech API (can be switched off).
- Mouse, touch, keyboard and gamepad controls, and fullscreen mode (F). The screen stays awake while you play. Every pearl colour also carries its own symbol, so the colours can be told apart without colour vision.

## Running it

The game is plain HTML and JavaScript. Open `index.html` directly, or serve the folder with any static web server, for example:

```
python3 -m http.server 8000
```

and open http://localhost:8000/ in Chrome, Edge or Firefox.

## Controls

| Action | Mouse / touch | Keyboard | Gamepad |
|---|---|---|---|
| Aim | move the pointer | ← → (↑ ↓), Shift for fine aiming | either stick, d-pad |
| Shoot | left click / tap where you want to shoot | Space | A / RT |
| Swap the two pearls | right click / click or tap on Puff | S or Tab | B, X / LT |
| Pause | ‖ button | Esc or P | Start |
| Fullscreen / mute | – | F / M | – |

## Files

- `index.html`, `style.css`: page with one canvas
- `js/util.js`: helpers, input (mouse, touch, keyboard, gamepad), storage
- `js/audio.js`: music sequencer, instruments, sound effects and voices
- `js/draw.js`: drawing helpers and UI widgets
- `js/levels.js`: track shapes, the four worlds and the 20 levels
- `js/game.js`: the simulation, covering rolling chains, shots and insertion, matches and combos, power pearls, coins and the clam
- `js/sprites.js`: pearls, Puff, the clam, coins, power icons, underwater backdrops and grooves
- `js/ui.js`: screens for the title, level map, results, options and help
- `js/play.js`: the level screen, with controls, drawing, HUD and pause menu
- `js/main.js`: main loop, scaling, fullscreen, screen wake lock, state machine
