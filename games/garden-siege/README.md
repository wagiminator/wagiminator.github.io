# Garden Siege

A tower-defense garden game for the browser, made as a homage to the PC classic *Plants vs. Zombies* (PopCap Games, 2009).
All plants, zombies and backgrounds are drawn by code, all music and sound effects are synthesized with the Web Audio API – no external assets, no build step. Names and artwork are original.

## Features

- **Adventure** with 50 levels in five areas: Front Yard (day), Night Yard (graves, no sun from the sky), Backyard Pool (six lanes, two of them water), Foggy Pool (fog hides the right side of the lawn) and Rooftop (plants need clay pots, straight shots from the left half hit the slope). Every fifth level is a special one (Nut Bowling, Whack-a-Zombie, Little Big Trouble, Vasebreaker, Bungee Blitz), every tenth runs on a conveyor belt, and 5-10 is the fight against **Dr. Zed** and his giant robot (fireballs, iceballs, stomps, a thrown camper van, bungee drops and reinforcements).
- **48 plants**, one new plant after almost every level:
  - Day: Pea Popper, Sunbloom, Cherry Blast, Stone Nut, Spud Mine, Frost Popper, Snapjaw, Double Popper.
  - Night: Puffcap, Dawncap, Fumecap, Grave Muncher, Swirlcap, Shycap, Frostcap, Doomcap. Mushrooms sleep in daylight unless a Wake Bean wakes them.
  - Pool: Lily Raft, Squasher, Trio Popper, Kelp Snare, Fire Pepper, Spikegrass, Torchstump, Tower Nut.
  - Fog: Seacap, Lantern Bloom, Needle Cactus, Gust Clover, Twin Popper, Star Fruit, Gourd Shell, Magnetcap.
  - Roof: Clay Pot, Cabbage Catapult, Corn Catapult (butter stuns), Wake Bean, Garlic Clove, Shield Leaf, Coin Flower, Melon Catapult.
  - Upgrades from the shop, planted on top of their base plant: Twin Sunbloom, Quad Popper, Gloomcap, Reed Cat, Frost Melon, Gold Magnet, Spike Rock and the two-tile Corn Cannon (click it, then click the target).
- **29 zombie types**: Walker, Flag Bearer, Cone Walker, Pole Jumper, Pail Walker, Paper Reader, Door Shield, Linebacker, Disco Dancer with Backup Dancers, Floatie, Snorkeler, Ice Resurfacer (ice trail), Bobsled Crew, Dolphin Rider, Jack-in-the-Box, Balloon Floater, Miner, Pogo Hopper, Yeti (drops diamonds), Bungee Dropper, Ladder Carrier, Basket Catapult, Gargantuar with Imp, Red-Eye Gargantuar, Pea Head, Nut Head and Dr. Zed.
- The rules of the original: sun from the sky and from sun plants, seed packets with cost and recharge, the shovel, one lawn mower (pool cleaner, roof cleaner) per lane, huge waves with flag zombies and a final wave, armour (cone, pail, helmet), screen doors that block straight shots, lobbed and fume attacks that get past them, slowing, freezing, butter, hypnotized zombies that fight for you, jumping, digging, flying and swimming zombies, graves, craters, ice trails, fog, the roof slope and plants that protect each other (Gourd Shell, Shield Leaf, Garlic Clove, Tower Nut).
- **18 mini-games**: Nut Bowling, Slot Machine, Raining Seeds, Whack-a-Zombie, Column Gardening, Invisi-Ghouls, Nimble Zombies, Quick!, Zombotany, Dark Stormy Night, Grave Danger, Little Big Trouble, Last Stand, Bobsled Bash, Dig It Up, Air Raid, Bungee Blitz, Pogo Party and Dr. Zed's Revenge.
- **Puzzles**: nine Vasebreaker rooms plus Vasebreaker Endless, nine "I, Zombie" levels (you send the zombies and eat the five brains) plus I, Zombie Endless.
- **Survival**: every area with 5 flags and as a hard version with 10 flags (choose new plants after each flag), plus Endless Survival with a Top 10 high score table.
- **Almanac** with all plants and zombies, **Gus's Garden Shop** for seed slots 7 to 10, upgrade plants, pool cleaners and roof cleaners, paid with the coins and diamonds the zombies drop.
- Seed chooser with a preview of the zombies waiting on the street; progress, coins and options are saved in the browser.
- Tracker-style soundtrack with a tune for every area, the seed chooser, the shop, the mini-games and the boss; many sound effects and short voice announcements (Web Speech API) that can be switched off.
- Mouse and touch, keyboard and gamepad controls, fullscreen mode (F); the screen stays awake while you play.

Not included: the Zen Garden, the Imitater, the match-three and aquarium mini-games, and achievements.

## Running it

The game is plain HTML and JavaScript. Open `index.html` directly, or serve the folder with any static web server, for example:

```
python3 -m http.server 8000
```

and open http://localhost:8000/ in Chrome, Edge or Firefox.

## Controls

| Action | Mouse / touch | Keyboard | Gamepad |
|---|---|---|---|
| Move the cursor | pointer | arrow keys (tile by tile; up from the top row reaches the seed bank) | left stick / D-pad |
| Click: collect sun, pick a packet, plant | left button / tap | Enter / Space | A |
| Pick a seed packet | click | 1 … 0, Q / E cycle | LB / RB cycle |
| Shovel | click the shovel | S | X |
| Collect all sun and coins | – | C | Y |
| Cancel | right button | Esc / Backspace | B |
| Pause | Menu button | P / Esc | Start |
| Fullscreen / mute | – | F / M | – |

## Files

- `index.html`, `style.css` – page with one canvas
- `js/util.js` – helpers, input (mouse, touch, keyboard, gamepad), storage
- `js/audio.js` – music sequencer, instruments, sound effects and voice announcements
- `js/draw.js` – drawing helpers, backgrounds of the five areas, fog, sun, coins, mowers, buttons
- `js/plants.js` – all plants: stats, behaviour and drawing
- `js/zombies.js` – all zombies: stats, special behaviour and drawing; the boss Dr. Zed
- `js/levels.js` – board geometry, areas, adventure levels, mini-games, puzzles, survival, wave generator, save game
- `js/game.js` – the board: plants, zombies, shots, sun and coins, waves, special modes, play input and drawing
- `js/ui.js` – screens: title, adventure map, lists, seed chooser, play, pause, results, almanac, shop, options, help, high scores
- `js/main.js` – main loop, scaling, fullscreen, screen wake lock, state machine
