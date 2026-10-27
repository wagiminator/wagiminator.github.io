/* ===================================================================
 * Games of the CH32V003 Mini Game Console
 * -------------------------------------------------------------------
 * Descriptions after the README of the game console project. The
 * firmware binaries and screenshots are loaded from the repository
 * https://github.com/wagiminator/CH32V003-GameConsole (branch main).
 * Global: GAMECONSOLE
 * =================================================================== */
(function (global) {
  "use strict";

  const REPO = "wagiminator/CH32V003-GameConsole";
  const BRANCH = "main";
  // raw.githubusercontent.com first, the jsDelivr mirror if it can't be reached
  const SOURCES = [
    (path) => `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${path}`,
    (path) => `https://cdn.jsdelivr.net/gh/${REPO}@${BRANCH}/${path}`,
  ];

  const GAMES = [
    { id: "tiny_invaders", name: "Tiny Invaders", genre: "Shoot'em up", shots: ["invaders_1", "invaders_2"],
      by: "Daniel Champagne",
      text: "An adaptation of Space Invaders. Move the laser cannon along the bottom of the screen and shoot the waves of aliens before they reach the ground. The aliens get faster and shoot back." },
    { id: "tiny_lander", name: "Tiny Lander", genre: "Simulation", shots: ["lander_1", "lander_2"],
      by: "tscha70",
      text: "An adaptation of Lunar Lander. Control thrust and direction of the lunar lander and land it safely on the moon without crashing or running out of fuel.",
      tip: "Hold UP while pressing fire on the start screen to start in a later level, or DOWN for 255 lives." },
    { id: "tiny_tris", name: "Tiny Tris", genre: "Puzzle", shots: ["tris_1", "tris_2"],
      by: "Daniel Champagne",
      text: "An adaptation of Tetris. Turn and move the falling pieces to complete horizontal lines. The pieces fall faster and faster; the game ends when the stack reaches the top." },
    { id: "tiny_arkanoid", name: "Tiny Arkanoid", genre: "Breakout", shots: ["arkanoid_1", "arkanoid_2"],
      by: "Daniel Champagne",
      text: "An adaptation of Arkanoid. Keep the ball in play with your paddle and destroy all the bricks of the wall at the top." },
    { id: "tiny_pacman", name: "Tiny Pacman", genre: "Maze", shots: ["pacman_1", "pacman_3"],
      by: "Daniel Champagne",
      text: "Guide Pacman through the maze, eat all the pellets and avoid the ghosts." },
    { id: "tiny_doom", name: "Tiny Doom", genre: "First person shooter", shots: ["doom_1", "doom_3"],
      text: "A small Doom-like first person shooter. Fight your way through three levels full of zombies, demons and a cacodemon, open the doors, pick up medkits and ammo, and find the blinking exit switch of each level." },
    { id: "tiny_boulder", name: "Tiny Boulder", genre: "Digging", shots: ["boulder_1", "boulder_2"],
      text: "A small Boulder Dash-like game. Dig through six scrolling caves, collect enough diamonds before the time runs out and escape through the exit. Watch out for falling boulders, fireflies and butterflies." },
    { id: "tiny_bubble", name: "Tiny Bubble", genre: "Platform", shots: ["bubble_1", "bubble_2"],
      text: "A small Bubble Bobble-like platform game. As a little dragon you catch the monsters in bubbles, burst the bubbles and collect the fruit. Hurry: after a while the monsters get angry and the invincible skull comes for you." },
    { id: "tiny_karate", name: "Tiny Karate", genre: "Fighting", shots: ["karate_1", "karate_2"],
      text: "A small International Karate-like fighting game. Score points against the computer with punches and kicks, block or dodge its attacks and earn a new belt with every won bout." },
    { id: "tiny_run", name: "Tiny Run", genre: "Racing", shots: ["run_1", "run_3"],
      text: "A small Out Run-like racing game. Race along the coast, through the desert, the mountains and the city, and reach each checkpoint before the time runs out. At every fork, the road you take decides the next stage." },
    { id: "tiny_shooter", name: "Tiny Shooter", genre: "Shoot'em up", shots: ["shooter_1", "shooter_3"],
      text: "A small horizontally scrolling shoot'em up. Fly through space, over hills and through caves, shoot down waves of enemies, collect power capsules and defeat the guardian at the end of each stage." },
  ];

  for (const g of GAMES) {
    g.binPath = `software/${g.id}/bin/${g.id}.bin`;
    g.srcUrl = `https://github.com/${REPO}/tree/${BRANCH}/software/${g.id}`;
    g.shotUrls = g.shots.map((s) => SOURCES[0](`documentation/GameConsole_${s}.png`));
  }

  // Load the firmware binary of a game (tries the sources one after another)
  async function fetchBinary(game) {
    let last = null;
    for (const src of SOURCES) {
      try {
        const res = await fetch(src(game.binPath), { cache: "no-cache" });
        if (!res.ok) { last = new Error(`HTTP ${res.status}`); continue; }
        const data = new Uint8Array(await res.arrayBuffer());
        if (!data.length) { last = new Error("empty file"); continue; }
        return data;
      } catch (err) {
        last = err;
      }
    }
    throw new Error(`The firmware of ${game.name} could not be downloaded (${last ? last.message : "no source"}). Check the internet connection.`);
  }

  global.GAMECONSOLE = { REPO, BRANCH, GAMES, fetchBinary, repoUrl: `https://github.com/${REPO}` };
})(typeof window !== "undefined" ? window : globalThis);
