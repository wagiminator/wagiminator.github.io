# Woolly Wallop

A slingshot physics game for the browser, made as a homage to the slingshot games of the early smartphone era such as *Angry Birds* (Rovio, 2009). A flock of sheep strikes back: load a sheep into the slingshot, pull back and send it flying into the wooden, icy and stone forts of the wolves. Each level is won once every wolf is out.
The landscapes, the flock and the wolves are drawn by code, and all music and sound effects are synthesized with the Web Audio API. There are no external assets and no build step. Names, characters and tunes are original.

## Features

- **Real physics:** a small rigid-body engine of its own (boxes and circles, sequential impulses with warm starting, friction, bounce and sleeping bodies). Towers sway, topple and collapse. Every impact deals damage according to its strength.
- **Five kinds of sheep:**
  - Woolly: the all-rounder.
  - Lambkins: split into three.
  - Zoomer: a burst of speed.
  - Boomer: a thunderclap, on a tap or shortly after it hits something.
  - Bruiser: big, heavy, and stomps straight down.
  Tap or press a button in flight to use the trick.
- **Forts and wolves:**
  - Ice shatters easily, wood breaks with a good hit, and stone needs heavy blows.
  - Red firework crates explode when they break.
  - Pups, grown wolves and the tough alpha with the eye patch.
- **20 levels in four landscapes:** Green Meadow, Autumn Woods, Snowy Peaks and Dusk Farm, with towers, bridges, plateaus, pits and powder stores. Every level has been solved by a test bot.
- **Score and stars:** points for broken blocks, damage, wolves and every sheep left over. Each level gives up to three stars, and best scores and stars are saved in the browser. Each cleared level unlocks the next.
- **Camera:** shows the whole level while you aim and follows the flying sheep, with a trajectory guide and the trail of your last shot.
- **Sound:** a tracker-style soundtrack for every landscape, bleating sheep, crashing blocks, and short voice calls through the Web Speech API (can be switched off).
- **Controls:** mouse, touch, keyboard and gamepad, and fullscreen mode (F). The screen stays awake while you play.

## Running it

The game is plain HTML and JavaScript. Open `index.html` directly, or serve the folder with any static web server, for example:

```
python3 -m http.server 8000
```

and open http://localhost:8000/ in Chrome, Edge or Firefox.

## Controls

| Action | Mouse / touch | Keyboard | Gamepad |
|---|---|---|---|
| Aim | press near the slingshot (or anywhere), drag back | ← → angle, ↑ ↓ power | stick (pull) / d-pad |
| Shoot | let go | Space | A / RT |
| Trick in flight | click / tap | Space | A |
| Restart level | ↻ button | R | Y |
| Pause | ‖ button | Esc or P | Start |
| Fullscreen / mute | – | F / M | – |

## Files

- `index.html`, `style.css`: page with one canvas
- `js/util.js`: helpers, input (mouse, touch, keyboard, gamepad), storage
- `js/audio.js`: music sequencer, instruments, sound effects and voices
- `js/draw.js`: drawing helpers and UI widgets
- `js/physics.js`: the rigid-body engine (collision of boxes and circles, solver, sleeping, explosions)
- `js/levels.js`: materials, sheep and wolf types, the four landscapes and the 20 levels
- `js/game.js`: one level, covering the slingshot, flight and tricks, damage, breaking, explosions, scoring and stars
- `js/sprites.js`: the flock, the wolves, blocks, plateaus, the slingshot and the landscapes
- `js/ui.js`: screens for the title, level map, results, options and help
- `js/play.js`: the level screen, with controls, camera, drawing, HUD and pause menu
- `js/main.js`: main loop, scaling, fullscreen, screen wake lock, state machine
