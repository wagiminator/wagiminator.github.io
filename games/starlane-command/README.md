# Starlane Command

A real-time fleet command game for the browser, made as a homage to *SPACECOM* (Flow Combine / 11 bit studios, 2014). The sector is a network of star systems joined by starlanes. You win by moving fleets with a plan, not by clicking fast.
The tactical map, the ships and the icons are all drawn by code, and all music and sound effects are synthesized with the Web Audio API. There are no external assets and no build step. The name, missions and artwork are original.

## Features

- **Systems and starlanes:** fleets and supply travel only along the lanes. There are four kinds of systems:
  - Shipyards build ships.
  - Mining colonies send supply convoys to your nearest shipyard.
  - Repair docks mend damaged ships.
  - Outposts are stepping stones.
- **Three fleet types**, all drawn as one triangle. A stripe marks the role:
  - **Battle** (stripe at the tip) destroys other fleets.
  - **Siege** (stripe across the middle) breaks shields and battle stations, and can raze a system for good.
  - **Invasion** (stripe at the base) defeats the garrison and captures the system once no defences or enemy ships are left.
- **Supply and defences:** every shipyard builds the fleet type you choose as long as there is supply. With supply you can also buy recharging shields and battle stations. A station shoots at enemy fleets and stops fleets from passing through. An enemy fleet seizes any convoy that enters its system.
- **Orders are final:** a fleet only stops where it was sent, or where enemy ships or a station block its way. You can pause at any time and plan, or run at 2× or 4× speed.
- **Campaign of eight operations:** a sector with no enemies, supply runs past pirate stations, first contact, holding a chokepoint, razing enemy mines, a war on two fronts, a fortified gauntlet, and a final battle against three powers. Each operation unlocks the next and records your best time.
- **Skirmish** against 1 to 3 computer commanders on generated maps of three sizes and three difficulty levels.
- A live battle between computer commanders plays behind the menus.
- A tracker-style soundtrack, sound effects for every event, and short voice reports through the Web Speech API (can be switched off).
- Mouse and touch, keyboard and gamepad controls, fullscreen mode (F), and the screen stays awake while you play.

## Running it

The game is plain HTML and JavaScript. Open `index.html` directly, or serve the folder with any static web server, for example:

```
python3 -m http.server 8000
```

and open http://localhost:8000/ in Chrome, Edge or Firefox.

## Controls

| Action | Mouse / touch | Keyboard | Gamepad |
|---|---|---|---|
| Select a system | click / tap | arrow keys, Enter | stick, A |
| Send fleets | drag to the target, or right-click it | S, then pick the target | X, then A on the target |
| Send half / all | ½ button | H | LT / RT |
| Next system with fleets | – | Tab | Y |
| Pause / speed | buttons in the panel | Space, + / − | Back, LB / RB |
| Menu | Menu button | Esc | Start |
| Fullscreen / mute | – | F / M | – |

## Files

- `index.html`, `style.css`: page with one canvas
- `js/util.js`: helpers, input (mouse, touch, keyboard, gamepad), storage
- `js/audio.js`: music sequencer, instruments, sound effects and voice reports
- `js/draw.js`: the look of the tactical display, icons, fleet triangles, panels and buttons
- `js/game.js`: the simulation, covering lanes and paths, fleets, convoys, production, combat, invasion, razing, and victory and defeat
- `js/maps.js`: the eight campaign operations and the skirmish map generator
- `js/ai.js`: the computer commanders
- `js/ui.js`: screens for the title, campaign, briefing, skirmish setup, results, options and help
- `js/play.js`: the tactical map, with drawing, the command panel and orders
- `js/main.js`: main loop, scaling, fullscreen, screen wake lock, state machine
