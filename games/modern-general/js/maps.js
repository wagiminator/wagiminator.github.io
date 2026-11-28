/* Modern General: scenarios. The map is built from features (forests, towns, ridges, the river,
   roads) so that the terrain data and the drawn map always agree.                                  */
"use strict";

(function (MG) {
  const SC = (MG.SCENARIOS = []);

  // helpers working on S.hex through G.idx
  function tools(S, G) {
    const at = (c, r) => S.hex[G.idx(c, r)];
    const set = (list, f) => { for (const [c, r] of list) { const h = at(c, r); if (h) f(h, G.idx(c, r)); } };
    const rect = (c0, r0, c1, r1) => { const o = []; for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) o.push([c, r]); return o; };
    const road = (list) => {
      for (let k = 0; k < list.length; k++) {
        const i = G.idx(list[k][0], list[k][1]);
        S.hex[i].road = true;
        if (k) {
          const j = G.idx(list[k - 1][0], list[k - 1][1]);
          if (G.dist(i, j) !== 1) throw new Error("road gap at " + list[k]);
          S.links.add(i < j ? i + "," + j : j + "," + i);
        }
      }
    };
    // a road along a row, or a column, as a chain of neighbouring hexes
    const rowRoad = (r, c0, c1) => { const o = []; for (let c = c0; c <= c1; c++) o.push([c, r]); return o; };
    return { at, set, rect, road, rowRoad };
  }

  SC.push({
    id: "bridgehead",
    title: "Operation Brückenkopf",
    photo: "assets/map_bridgehead.webp",
    year: 2031,
    W: 28, H: 18, maxTurn: 16,
    player: "DE", first: "DE", attacker: "DE", sides: ["DE", "RU"],
    prestige: { DE: 300, RU: 200 },
    dropEdge: { DE: 0, RU: 27 },
    briefing:
      "Spring 2031. Russian forces hold the east bank of the Lauter and the ridge behind it. " +
      "Your brigade has to cross and take all four objectives – Ostwalde, Hill 312, Furtbach and the city of Kreuzfeld – within 16 turns.\n\n" +
      "The enemy will blow the bridges once you come close. Your helicopters are your trump card: Tigers and LKHs with Spike ER2 strike from behind the ridges, " +
      "two NH90s can fly infantry across, and a company of Fallschirmjäger waits at the airfield for a jump. " +
      "Keep the helicopters fed from your FARPs and keep them out of sight of Pantsir and Tor.",
    hints: [
      "Fly low behind hills and forests: air defence only fires at what it can see.",
      "A helicopter may move, fire and move on with the rest of its move.",
      "Land at a FARP to refuel, rearm and repair – it stays on the ground until your next turn.",
      "The LKH carries 2 × 4 Spike ER2: it hits targets up to 4 hexes away that any of your units spots – it does not need to see them itself.",
      "Scout the far bank first – minefields hide next to the bridges and the ford.",
    ],
    build(S, G) {
      for (let i = 0; i < S.scen.W * S.scen.H; i++) S.hex.push({ t: "clear", e: 0, road: false, river: false, ford: false, bridge: null, mine: null, obj: null, v: (i * 7919) % 13 });
      const { at, set, rect, road, rowRoad } = tools(S, G);
      const T = (t) => (h) => { h.t = t; };
      const E = (e) => (h) => { h.e = Math.max(h.e, e); };

      // ridges and heights
      set(rect(9, 6, 11, 11), E(1)); set([[10, 8], [11, 8], [10, 9], [9, 8]], E(2));
      set(rect(19, 4, 23, 12), E(1)); set(rect(20, 6, 22, 11), E(2)); set([[21, 8], [21, 9], [22, 9], [20, 9]], E(3));
      set(rect(24, 0, 27, 6), E(1)); set([[23, 1], [24, 1], [22, 2], [23, 2]], E(3));
      set(rect(0, 14, 3, 17), E(1));
      // terrain
      set([[23, 1], [24, 1], [22, 2], [23, 2]], T("mountain"));
      set([...rect(5, 1, 7, 3), [8, 2], [11, 0], [12, 0], [12, 1]], T("forest"));
      set([...rect(8, 13, 10, 15), [7, 14], [11, 13]], T("forest"));
      set([...rect(2, 14, 3, 16), [1, 15]], T("forest"));
      set([...rect(19, 13, 20, 16), [21, 14]], T("forest"));
      set([...rect(25, 2, 26, 4), [27, 3], [24, 3]], T("forest"));
      set([[22, 6], [22, 7], [23, 7], [20, 11], [21, 11]], T("forest"));
      set([[10, 6], [9, 6], [11, 10]], T("forest"));
      set([[16, 9], [17, 9], [17, 10]], T("forest"));
      set([[11, 15], [12, 15], [12, 16], [13, 16], [11, 16]], T("swamp"));
      set(rect(26, 15, 27, 17), T("water")); set([[25, 16]], T("water"));
      set([[3, 8], [4, 8], [3, 9]], T("town")); // Westheim
      set([[8, 10]], T("town")); // Hof
      set([[17, 4], [18, 4], [17, 5], [18, 5]], T("town")); // Ostwalde
      set([[17, 15], [18, 15]], T("town")); // Furtbach
      set([[22, 15]], T("town"));
      set([[24, 11], [25, 11], [24, 12], [25, 12], [26, 12]], T("city")); // Kreuzfeld
      set([[5, 5]], T("town"));

      // the river Lauter, a chain of neighbouring hexes from north to south
      const river = [[13, 0], [13, 1], [13, 2], [14, 2], [14, 3], [14, 4], [15, 4], [15, 5], [15, 6], [16, 6], [16, 7], [16, 8], [15, 8],
        [15, 9], [15, 10], [14, 10], [14, 11], [14, 12], [14, 13], [15, 13], [15, 14], [15, 15], [15, 16], [15, 17]];
      for (let k = 0; k < river.length; k++) {
        const h = at(...river[k]);
        h.river = true; h.t = "clear"; h.e = 0;
        if (k && G.dist(G.idx(...river[k]), G.idx(...river[k - 1])) !== 1) throw new Error("river gap at " + river[k]);
      }
      at(15, 15).ford = true;

      // roads: the northern highway over the Lauter bridge, the southern road to Kreuzfeld, and links
      road(rowRoad(5, 0, 27));
      road(rowRoad(12, 0, 24));
      road([[24, 12], [25, 12], [26, 12], [27, 12]]);
      road([[4, 5], [4, 6], [4, 7], [4, 8], [4, 9], [4, 10], [4, 11], [4, 12]]);
      road([[18, 5], [18, 6], [18, 7], [18, 8], [18, 9], [18, 10], [18, 11], [18, 12]]);
      road([[18, 12], [18, 13], [18, 14], [18, 15]]);
      road([[13, 12], [13, 13], [13, 14], [14, 15], [15, 15], [16, 15], [17, 15]]);
      at(15, 5).bridge = "fixed"; at(14, 12).bridge = "fixed";
      at(15, 5).bridge0 = true; at(14, 12).bridge0 = true;

      // objectives
      const obj = (c, r, name) => { at(c, r).obj = { name, owner: "RU" }; };
      obj(18, 5, "Ostwalde"); obj(21, 9, "Hill 312"); obj(17, 15, "Furtbach"); obj(24, 12, "Kreuzfeld");
      at(3, 8).name = "Westheim"; at(18, 4).name = "Ostwalde"; at(17, 15).name = "Furtbach"; at(25, 11).name = "Kreuzfeld"; at(21, 8).name = "Hill 312"; at(8, 10).name = "Hof Lindenau";

      // hidden Russian minefields by the crossings
      const mine = (c, r) => { at(c, r).mine = { side: "RU", remote: false, lane: false, expires: 0, known: { RU: true } }; };
      mine(16, 4); mine(16, 15); mine(16, 16); mine(15, 11); mine(16, 13);

      const U = (tid, side, c, r, o) => G.newUnit(tid, side, G.idx(c, r), o);
      // ---- Germany (player) ----
      U("leo2a8", "DE", 3, 5); U("leo2a8", "DE", 2, 6); U("leo2a8", "DE", 3, 11);
      U("puma", "DE", 4, 4); U("puma", "DE", 4, 12);
      U("pzgren", "DE", 5, 6);
      U("fsj", "DE", 6, 9);
      U("fsj", "DE", -1, -1, { reserve: true });
      U("pio", "DE", 5, 11);
      U("fennek", "DE", 7, 5);
      U("pzh2000", "DE", 1, 8); U("pzh2000", "DE", 1, 11);
      U("mars2", "DE", 0, 9);
      U("skyranger", "DE", 3, 7);
      U("irist", "DE", 1, 10);
      U("lmteam", "DE", 2, 9);
      U("leguan", "DE", 5, 12);
      U("kodiak", "DE", 4, 13);
      U("farp", "DE", 2, 7); U("farp", "DE", 3, 12);
      U("tiger", "DE", 2, 7); U("tiger", "DE", 3, 12);
      U("lkh", "DE", 1, 6); U("lkh", "DE", 2, 12); U("lkh", "DE", 1, 7);
      U("nh90", "DE", 5, 9); U("nh90", "DE", 2, 11);
      U("luna", "DE", 3, 9);
      // ---- Russia (computer) ----
      const dug = (n) => ({ entrench: n });
      U("t90m", "RU", 19, 5, dug(1)); U("t90m", "RU", 21, 9, dug(2)); U("t90m", "RU", 19, 12, dug(1));
      U("t80bvm", "RU", 23, 10, dug(1));
      U("bmp3", "RU", 17, 4, dug(2)); U("bmp3", "RU", 18, 14, dug(1));
      U("btr82a", "RU", 24, 11, dug(1));
      U("msr", "RU", 18, 5, dug(2)); U("msr", "RU", 17, 15, dug(2)); U("msr", "RU", 20, 8, dug(2));
      U("sappers", "RU", 16, 5, dug(1));
      U("sappers", "RU", 15, 12, dug(1));
      U("msta", "RU", 24, 7); U("msta", "RU", 25, 9);
      U("tornados", "RU", 26, 6);
      U("isdm", "RU", 25, 13);
      U("gmz3", "RU", 21, 13);
      U("pantsir", "RU", 19, 7, dug(1)); U("pantsir", "RU", 22, 13, dug(1));
      U("torm2", "RU", 23, 8, dug(1));
      U("farp", "RU", 26, 10);
      U("ka52", "RU", 26, 10);
      U("orlan", "RU", 25, 8);
      U("lancet", "RU", 24, 9);
    },
    // where the computer defender keeps its forces
    ai: {
      RU: { posture: "defend", farpFixed: true, noAirAssault: true },
      DE: { posture: "attack", farpFixed: false, noAirAssault: true },
    },
  });
})(window.MG);
