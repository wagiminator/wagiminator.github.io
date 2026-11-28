# Aviation General

A turn-based hex strategy game for the browser in the spirit of *Panzer General* (SSI, 1994), set in a fictional conflict in 2031. A tutorial battle teaches the game: a Bundeswehr brigade has to cross a river held by Russian forces. Winning it unlocks four campaigns – Germany, Russia, the USA and China – of eight battles each. The focus is on the helicopters: attack helicopters, air assault, FARP logistics and enemy air defence.
The 33 photo maps (tutorial and campaigns), the ground textures, the title picture and the 77 unit pictures were made with an image generator (Higgsfield). Each map photo was generated from a layout plan rendered from the battle's terrain data, so picture and rules agree; if a map photo is missing, the game composites a map from the ground textures instead. The helicopters' main rotors are drawn and turned by code. All sound is synthesized with the Web Audio API. There are no other assets and no build step. The name, scenario and artwork are original, and the game has no connection to any manufacturer or armed force. Unit values are game abstractions, not real performance data.

## Features

- **Hex map with terrain that matters:** open ground, forest, towns, a city, swamp, rocky heights, a lake and a river, on four height levels.
  - **Go / Slow Go / No Go** for tracked, wheeled and foot units. Roads are faster. Forests are No Go for tracked vehicles except along a road. Rivers can only be crossed at bridges, at the ford, by amphibious vehicles, or by infantry who swim across with their whole move.
  - **Line of sight:** forests, towns and ridges block the view; from higher ground you see one hex further. Units in forests and towns are only seen from next door or when they fire. In close terrain, direct fire reaches only one hex.
- **Helicopters:** they move, fire and move on with the rest of their move (pop-up attacks), use one fuel per hex, and must land at a **FARP** to refuel, rearm and repair. While on the ground they are open to artillery and drones until your next turn.
  - **H145M LKH:** one weapon station on each side, each with a quad launcher for **Spike ER2**. It fires at targets up to four hexes away that any of your units spots, without its own line of sight. At a FARP it can swap to 70 mm rockets and a 20 mm gun.
  - **Tiger UHT** with long-range anti-tank missiles and Stinger missiles against enemy helicopters and drones (it also fires them back when one comes close), and **NH90** transport helicopters for air assault.
- **Air defence:** Skyranger 30, IRIS-T SLM, Pantsir-S1, Tor-M2 and Verba MANPADS fire on every aircraft and drone they can see in their reach. Fly low behind ridges and forests to stay hidden. Overlays show the reach of known enemy air defence, and a flight path turns orange or red where it is in danger.
- **Air assault and paratroopers:** NH90s fly infantry to a landing zone; the Fallschirmjäger jump from a transport aircraft, with air defence along the flight path and scatter from the wind.
- **Engineers:** hidden minefields, mines scattered by MARS II and ISDM that last four turns, the Kodiak mine-clearing vehicle, the Leguan bridge layer, and engineers who blow bridges. The enemy blows the bridges when you come close.
- **Loitering munitions and UAVs:** LUNA NG, Orlan-10, Lancet, and a German loitering munition team.
- **Computer opponent:** it knows only what its units spot, defends or attacks the objectives (routing along a cost map, so it crosses at bridges, fords and lanes), uses artillery, drones, mines and its attack helicopters from a fixed FARP, and makes no air assaults.
- **Tutorial – Operation Brückenkopf:** take Ostwalde, Hill 312, Furtbach and Kreuzfeld within 16 turns. A coach panel walks you through selecting, moving, the Go overlay, flying, air defence, attacking, the FARP, air assault and the parachute jump; each tip waits until you have tried it. Winning the tutorial unlocks the campaigns.
- **Four campaigns of eight battles:** Germany vs Russia, Russia vs Germany, the USA vs China and China vs the USA. The battles get harder (more and better-equipped enemies, dug-in defenders, minefields, layered air defence) on growing maps from 27 × 18 to 36 × 23 hexes. Most are attacks; two or three in each campaign are defences against an attacking computer – the Bundeswehr campaign opens with one. Win a battle to open the next; half of your prestige carries over.
  - **Generated maps:** each battle is built from a fixed seed – hills and ridges, a river with bridges where roads cross and a ford, a lake, forests, marsh, rocky tops, villages, towns and a city, roads between them. A check makes sure the attacker's tanks can reach every objective. Each battle has its own aerial photo made from its layout plan and shown faded like the tutorial map; as a fallback the map is composited from photo textures with a hillshade computed from the heights.
- **The armies:** Bundeswehr (Leopard 2A8, Puma, PzH 2000, Skyranger, IRIS-T SLM, Tiger, LKH, NH90 …), Russian Ground Forces (T-90M, T-80BVM, BMP-3, Msta-S, Tornado-S, Pantsir, Tor-M2, Ka-52M, Mi-8AMTSh, VDV …), US Army (M1E3, M1A2 SEPv3, M2A4 Bradley, Stryker, Paladin, HIMARS, Volcano, M-SHORAD, NASAMS, AH-64E, UH-60M, Gray Eagle, Switchblade 600, JAB, ABV …) and People's Liberation Army (Type 100, ZTZ-99A, ZBD-04A, ZBL-08, PCL-181, PHL-16, PGL-625, HQ-17A, Z-10ME, Z-20, CH-4 …).
- A red, struck-through crosshair marks your helicopters that have already fired this turn. Helicopters look into forests and towns from above and fire into them from up to two hexes; ground units only from next door.
- A defence also ends with a victory when the attacker has no tanks, infantry or other manoeuvre units left on the ground.
- **Menu button** in the top bar (or Esc): resume, help, restart, back to the campaign or the main menu.
- **Digging in:** units that stay put dig in a little each turn. Infantry can also choose *Dig in*: no move and no fire that turn, but two entrenchment levels deeper (more defence) until it moves again.
- Prestige for hits and objectives pays for reinforcements. The game saves itself at the start of each of your turns.
- Mouse and touch (drag to scroll, wheel or pinch to zoom), keyboard and gamepad, fullscreen.

## Running it

The game is plain HTML and JavaScript. Serve the folder with any static web server, for example:

```
python3 -m http.server 8000
```

and open http://localhost:8000/ in Chrome, Edge or Firefox. Opening `index.html` directly from the disk also works, but then the browser may block the pictures. Adding `?unlock` to the address (`index.html?unlock`) opens all campaigns and battles for testing.

## Controls

| Action | Mouse / touch | Keyboard | Gamepad |
|---|---|---|---|
| Select a unit | click / tap | Tab or N for the next unit | Y |
| Move / attack | click a lit hex / a red ring | – | A |
| Cancel, deselect | right-click | Esc | B |
| Scroll / zoom | drag / wheel or pinch | arrow keys or WASD / + − | right stick / LB RB |
| Overlays | buttons in the panel | P plates, G Go/No Go, V sight, T air defence | – |
| End turn | button | E | Start |
| Fullscreen / mute | – | F / M | – |

## Unit pictures

Every unit type has a transparent 256 × 256 WebP picture in `assets/units/` (top-down three-quarter view, facing right; the enemy's pictures are mirrored). A type that is not listed in `MG.SPRITES` in `js/data.js` falls back to a silhouette drawn by code.

## Files

- `index.html`, `style.css`: page with one canvas
- `assets/title.webp`: title picture
- `assets/map_bridgehead.webp`: photo map of the scenario (shown faded so the units stand out)
- `assets/units/*.webp`: unit pictures
- `assets/maps/camp-*.webp`: photo maps of the 32 campaign battles
- `assets/tex/*`: ground textures and village/town pictures for the campaign maps
- `js/util.js`: helpers, input (mouse, touch, keyboard, gamepad), storage
- `js/data.js`: the unit types of the four armies and the role table used to build their forces
- `js/rules.js`: the rules – hex grid, mobility, line of sight, spotting, combat, FARP, mines, bridges, air defence, air assault, turns, saving
- `js/maps.js`: the tutorial scenario, built from terrain features
- `js/campaign.js`: the campaigns – map generator, battles, orders of battle, progress
- `js/ai.js`: the computer commander
- `js/audio.js`: sound effects and a quiet music loop
- `js/draw.js`: the map, units, markers and effects
- `js/play.js`: the battle screen – camera, orders, overlays, panel, playback of events, the computer's turn
- `js/ui.js`: title, army choice, campaign, briefing and help screens
- `js/main.js`: main loop, scaling, fullscreen, screen wake lock, state machine
