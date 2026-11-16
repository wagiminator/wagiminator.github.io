# Feather Frenzy

A grouse-shooting arcade game for the browser, made as a homage to the PC classic *Moorhuhn* (Witan Entertainment / Phenomedia, 1999) – but with eight different hunting grounds instead of one.
All landscapes, birds and objects are drawn by code, all music and sound effects are synthesized with the Web Audio API – no external assets, no build step. Names and artwork are original.

## Features

- **Eight hunting grounds**, each a panorama three screens wide with three parallax layers (far, middle, near):
  1. Highland Moor – heather, a windmill, a signpost, a scarecrow and grazing sheep
  2. Sunny Farmyard – barn windows, haystacks, a weathervane, a tractor, a cow and a horse
  3. Deep Pine Forest – a hunting stand, tree stumps, toadstools, a beehive and a deer
  4. Silver Lake – a lighthouse, a buoy, reeds, a rowing boat and a swan
  5. Castle Ruins – towers with banners, battlements, a well and a suit of armour, at sunset
  6. Snowy Valley – white grouse in falling snow, ski gondolas, snowmen, an igloo and a hare
  7. Autumn Village – chimneys, windows, a church bell and clock, laundry, pumpkins, a cat and falling leaves
  8. Moonlit Moor – darkness, a lamp at your crosshair, lanterns to shoot on, glowing eyes, an owl and shooting stars
- **The rules of the original:** 90 seconds per round, a shotgun with 8 shells that you reload with the right mouse button, a crosshair that scrolls the landscape at the screen edges. Far grouse are worth 25 points, middle ones 10, near ones 5. Hit grouse burst into feathers and tumble down.
- **Lots to discover:** grouse peeking out of hiding places (25), a huge grouse flying past the camera (15), golden grouse (75), a plane with a banner (50), a balloon whose passenger floats down on a parachute (10 + 25), a grouse in a rowing boat or a ski gondola (25), shooting stars (50), hidden bonus targets that react when hit, trees that flush out grouse, and animals that cost 25 points if you hit them.
- **Progress:** each hunting ground has a goal score that unlocks the next one; a Top 10 high score table per level with name entry; personal bests on the level choice screen.
- Tracker-style soundtrack with a tune for every level, the title, the level choice and the results; many sound effects and short voice announcements (Web Speech API) that can be switched off.
- Mouse and touch, keyboard and gamepad controls, fullscreen mode (F); the screen stays awake while you play.

## Running it

The game is plain HTML and JavaScript. Open `index.html` directly, or serve the folder with any static web server, for example:

```
python3 -m http.server 8000
```

and open http://localhost:8000/ in Chrome, Edge or Firefox.

## Controls

| Action | Mouse / touch | Keyboard | Gamepad |
|---|---|---|---|
| Aim | pointer | arrow keys | left stick / D-pad |
| Shoot | left button / tap | Space / Enter | A / RT |
| Reload | right button / tap the shells | R / Shift | B / X / LT |
| Look around | crosshair at the screen edge / hold the edge arrows | A / D or Q / E | right stick / LB / RB |
| Pause | – | P / Esc | Start |
| Fullscreen / mute | – | F / M | – |

## Files

- `index.html`, `style.css` – page with one canvas
- `js/util.js` – helpers, input (mouse, touch, keyboard, gamepad), storage
- `js/audio.js` – music sequencer, instruments, sound effects and voice announcements
- `js/draw.js` – drawing helpers, buttons and panels, landscape painting tools
- `js/birds.js` – the grouse in all its poses, the animals you must not shoot, plane, balloon, boat, gondola, shooting star
- `js/scenes.js` – the eight levels: sky, painted layers, hiding places, bonus targets, animals and movers
- `js/game.js` – one round: camera and parallax, spawning, shooting and scoring, effects, night lighting and HUD
- `js/ui.js` – screens: title, level choice, round and pause, results, high scores, name entry, options, help
- `js/main.js` – main loop, scaling, fullscreen, screen wake lock, state machine
