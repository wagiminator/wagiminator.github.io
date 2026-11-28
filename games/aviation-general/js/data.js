/* Aviation General: unit types of the two armies in 2031.
   Values are game abstractions (0–20 scale), not real-world performance data.
   mob: track | wheel | foot | air.  range: direct fire in hexes.  ind: indirect fire range.
   aaRange/air: air-defence reach and attack.  armor: false for soft-skinned trucks.             */
"use strict";

(function (MG) {
  const T = (MG.TYPES = {
    /* ---------------- Germany ---------------- */
    leo2a8: { nat: "DE", name: "Leopard 2A8", cls: "Main battle tank", icon: "tank", mob: "track", move: 6, sight: 3, range: 2, soft: 10, hard: 18, def: 17, ammo: 8, cost: 300, aps: true },
    puma: { nat: "DE", name: "Puma S1", cls: "Infantry fighting vehicle", icon: "ifv", mob: "track", move: 6, sight: 3, range: 2, soft: 13, hard: 12, air: 2, def: 13, ammo: 8, cost: 220, atgm: true },
    pzgren: { nat: "DE", name: "Panzergrenadiere", cls: "Mechanized infantry", icon: "inf", mob: "foot", move: 3, sight: 2, range: 1, soft: 11, hard: 9, def: 9, ammo: 6, cost: 120, airmobile: true },
    fsj: { nat: "DE", name: "Fallschirmjäger", cls: "Airborne infantry", icon: "para", mob: "foot", move: 3, sight: 2, range: 1, soft: 12, hard: 10, def: 9, ammo: 6, cost: 160, airmobile: true, para: true, atgm: true },
    pio: { nat: "DE", name: "Pioniere", cls: "Combat engineers", icon: "eng", mob: "foot", move: 3, sight: 2, range: 1, soft: 8, hard: 7, def: 8, ammo: 4, cost: 120, airmobile: true, engineer: true, mineLay: true, mines: 2, clear: "lane" },
    fennek: { nat: "DE", name: "Fennek", cls: "Reconnaissance vehicle", icon: "recon", mob: "wheel", move: 8, sight: 5, range: 1, soft: 5, hard: 3, def: 7, ammo: 4, cost: 130, recon: true },
    pzh2000: { nat: "DE", name: "PzH 2000", cls: "Self-propelled howitzer", icon: "arty", mob: "track", move: 5, sight: 1, ind: 6, soft: 14, hard: 9, def: 7, ammo: 6, cost: 260 },
    mars2: { nat: "DE", name: "MARS II", cls: "Rocket artillery (AT2 mines)", icon: "mlrs", mob: "track", move: 5, sight: 1, ind: 8, soft: 16, hard: 8, def: 5, ammo: 3, cost: 300, mineRemote: 7, mines: 2 },
    skyranger: { nat: "DE", name: "Skyranger 30", cls: "Short-range air defence", icon: "spaag", mob: "wheel", move: 7, sight: 3, airSight: 4, aaRange: 2, air: 15, range: 1, soft: 6, hard: 3, def: 9, ammo: 12, cost: 220 },
    irist: { nat: "DE", name: "IRIS-T SLM", cls: "Medium-range air defence", icon: "sam", mob: "wheel", move: 5, sight: 2, airSight: 7, aaRange: 5, air: 18, def: 4, ammo: 6, cost: 300, armor: false, missile: true },
    tiger: { nat: "DE", name: "Tiger UHT", cls: "Attack helicopter", icon: "tiger", mob: "air", heli: true, move: 12, sight: 4, range: 3, soft: 11, hard: 15, airDef: 11, ammo: 3, fuel: 55, cost: 360, atgm: true, air: 13, aaRange: 3, aam: 4 }, // aam: Stinger against aircraft
    // LKH: one weapon station per side; standard load 2 × 4 Spike ER2 (ammo 4 = two missiles per attack)
    lkh: { nat: "DE", name: "H145M LKH", cls: "Light attack helicopter – 8 × Spike ER2", icon: "lkh", mob: "air", heli: true, move: 12, sight: 4, range: 4, soft: 12, hard: 19, airDef: 8, ammo: 4, fuel: 52, cost: 300, atgm: true, nlos: true, loadout: "lkh_rkt", loadoutName: "rockets + 20 mm" },
    lkh_rkt: { nat: "DE", name: "H145M LKH (rockets)", cls: "Light attack helicopter – 70 mm rockets, 20 mm gun", icon: "lkh", mob: "air", heli: true, move: 12, sight: 4, range: 2, soft: 16, hard: 9, airDef: 8, ammo: 3, fuel: 52, cost: 300, loadout: "lkh", loadoutName: "Spike ER2" },
    nh90: { nat: "DE", name: "NH90 TTH", cls: "Transport helicopter", icon: "nh90", mob: "air", heli: true, move: 13, sight: 3, airDef: 9, fuel: 55, cost: 220, cap: 1 },
    luna: { nat: "DE", name: "LUNA NG", cls: "Reconnaissance UAV", icon: "uav", mob: "air", uav: true, move: 10, sight: 5, airDef: 4, fuel: 30, cost: 100, recon: true },
    lmteam: { nat: "DE", name: "Loitering munition team", cls: "Loitering munition", icon: "lm", mob: "wheel", move: 5, sight: 2, drone: 6, soft: 10, hard: 14, def: 4, ammo: 3, cost: 180, armor: false },
    leguan: { nat: "DE", name: "Leguan", cls: "Bridge layer", icon: "bridge", mob: "track", move: 6, sight: 2, def: 12, cost: 150, bridge: true },
    kodiak: { nat: "DE", name: "Kodiak", cls: "Mine-clearing engineer vehicle", icon: "clear", mob: "track", move: 5, sight: 2, range: 1, soft: 4, hard: 2, def: 14, ammo: 3, cost: 180, clear: "full" },
    /* ---------------- Russia ---------------- */
    t90m: { nat: "RU", name: "T-90M", cls: "Main battle tank", icon: "tank", mob: "track", move: 6, sight: 3, range: 2, soft: 10, hard: 16, def: 15, ammo: 8, cost: 260 },
    t80bvm: { nat: "RU", name: "T-80BVM", cls: "Main battle tank", icon: "tank", mob: "track", move: 7, sight: 3, range: 2, soft: 9, hard: 14, def: 13, ammo: 8, cost: 220 },
    bmp3: { nat: "RU", name: "BMP-3", cls: "Infantry fighting vehicle", icon: "ifv", mob: "track", amph: true, move: 6, sight: 3, range: 2, soft: 13, hard: 10, air: 2, def: 9, ammo: 8, cost: 160, atgm: true },
    btr82a: { nat: "RU", name: "BTR-82A", cls: "Armoured personnel carrier", icon: "apc", mob: "wheel", amph: true, move: 7, sight: 3, range: 1, soft: 10, hard: 5, air: 2, def: 7, ammo: 6, cost: 110 },
    msr: { nat: "RU", name: "Motor rifles", cls: "Motor rifle infantry (Verba MANPADS)", icon: "inf", mob: "foot", move: 3, sight: 2, range: 1, soft: 10, hard: 8, air: 9, aaRange: 1, def: 8, ammo: 6, cost: 110 },
    sappers: { nat: "RU", name: "Sappers", cls: "Combat engineers", icon: "eng", mob: "foot", move: 3, sight: 2, range: 1, soft: 8, hard: 7, def: 8, ammo: 4, cost: 110, engineer: true, mineLay: true, mines: 2, clear: "lane" },
    msta: { nat: "RU", name: "2S19M2 Msta-S", cls: "Self-propelled howitzer", icon: "arty", mob: "track", move: 5, sight: 1, ind: 6, soft: 14, hard: 9, def: 7, ammo: 6, cost: 240 },
    tornados: { nat: "RU", name: "Tornado-S", cls: "Rocket artillery", icon: "mlrs", mob: "wheel", move: 6, sight: 1, ind: 9, soft: 17, hard: 8, def: 4, ammo: 2, cost: 300, armor: false },
    isdm: { nat: "RU", name: "ISDM Zemledelie", cls: "Remote mine-laying system", icon: "mlrs", mob: "wheel", move: 6, sight: 1, def: 4, cost: 200, armor: false, mineRemote: 7, mines: 2 },
    gmz3: { nat: "RU", name: "GMZ-3", cls: "Tracked minelayer", icon: "minelayer", mob: "track", move: 6, sight: 2, def: 8, cost: 120, mineLay: true, mines: 3 },
    pantsir: { nat: "RU", name: "Pantsir-S1", cls: "Short/medium-range air defence", icon: "spaag", mob: "wheel", move: 6, sight: 3, airSight: 6, aaRange: 3, air: 16, range: 1, soft: 7, hard: 3, def: 6, ammo: 12, cost: 280 },
    torm2: { nat: "RU", name: "Tor-M2", cls: "Medium-range air defence", icon: "sam", mob: "track", move: 5, sight: 2, airSight: 7, aaRange: 4, air: 17, def: 6, ammo: 8, cost: 300, missile: true },
    ka52: { nat: "RU", name: "Ka-52M", cls: "Attack helicopter", icon: "ka52", mob: "air", heli: true, move: 12, sight: 4, range: 3, soft: 12, hard: 15, airDef: 11, ammo: 3, fuel: 55, cost: 340, atgm: true },
    orlan: { nat: "RU", name: "Orlan-10", cls: "Reconnaissance UAV", icon: "uav", mob: "air", uav: true, move: 9, sight: 5, airDef: 3, fuel: 30, cost: 90, recon: true },
    lancet: { nat: "RU", name: "Lancet team", cls: "Loitering munition", icon: "lm", mob: "wheel", move: 5, sight: 2, drone: 7, soft: 10, hard: 15, def: 4, ammo: 3, cost: 180, armor: false },
    /* ---------------- Russia: additions for the Russian campaign ---------------- */
    mi8: { nat: "RU", name: "Mi-8AMTSh", cls: "Transport helicopter", icon: "nh90", mob: "air", heli: true, move: 12, sight: 3, airDef: 9, fuel: 55, cost: 200, cap: 1 },
    vdv: { nat: "RU", name: "VDV paratroopers", cls: "Airborne infantry (Verba MANPADS)", icon: "para", mob: "foot", move: 3, sight: 2, range: 1, soft: 12, hard: 10, air: 8, aaRange: 1, def: 9, ammo: 6, cost: 160, airmobile: true, para: true, atgm: true },
    tigr: { nat: "RU", name: "Tigr-M", cls: "Reconnaissance vehicle", icon: "recon", mob: "wheel", move: 8, sight: 5, range: 1, soft: 6, hard: 3, def: 7, ammo: 4, cost: 120, recon: true },
    mtu72: { nat: "RU", name: "MTU-72", cls: "Bridge layer", icon: "bridge", mob: "track", move: 6, sight: 2, def: 12, cost: 140, bridge: true },
    bmr3: { nat: "RU", name: "BMR-3M", cls: "Mine-clearing vehicle", icon: "clear", mob: "track", move: 5, sight: 2, range: 1, soft: 4, hard: 2, def: 13, ammo: 3, cost: 170, clear: "full" },
    /* ---------------- USA ---------------- */
    m1e3: { nat: "US", name: "M1E3 Abrams", cls: "Main battle tank", icon: "tank", mob: "track", move: 7, sight: 3, range: 2, soft: 11, hard: 19, def: 17, ammo: 8, cost: 320, aps: true },
    m1a2: { nat: "US", name: "M1A2 SEPv3", cls: "Main battle tank", icon: "tank", mob: "track", move: 6, sight: 3, range: 2, soft: 10, hard: 18, def: 17, ammo: 8, cost: 290, aps: true },
    m2a4: { nat: "US", name: "M2A4 Bradley", cls: "Infantry fighting vehicle", icon: "ifv", mob: "track", move: 6, sight: 3, range: 2, soft: 13, hard: 12, air: 2, def: 12, ammo: 8, cost: 210, atgm: true },
    stryker: { nat: "US", name: "M1126 Stryker", cls: "Armoured personnel carrier", icon: "apc", mob: "wheel", move: 8, sight: 3, range: 1, soft: 10, hard: 6, air: 2, def: 8, ammo: 6, cost: 130 },
    usinf: { nat: "US", name: "Infantry", cls: "Infantry (Javelin, Stinger)", icon: "inf", mob: "foot", move: 3, sight: 2, range: 1, soft: 11, hard: 10, air: 9, aaRange: 1, def: 9, ammo: 6, cost: 130, airmobile: true, atgm: true },
    usab: { nat: "US", name: "82nd Airborne", cls: "Airborne infantry", icon: "para", mob: "foot", move: 3, sight: 2, range: 1, soft: 12, hard: 10, def: 9, ammo: 6, cost: 160, airmobile: true, para: true, atgm: true },
    useng: { nat: "US", name: "Combat engineers", cls: "Combat engineers", icon: "eng", mob: "foot", move: 3, sight: 2, range: 1, soft: 8, hard: 7, def: 8, ammo: 4, cost: 120, airmobile: true, engineer: true, mineLay: true, mines: 2, clear: "lane" },
    jltv: { nat: "US", name: "JLTV recon", cls: "Reconnaissance vehicle", icon: "recon", mob: "wheel", move: 9, sight: 5, range: 1, soft: 6, hard: 3, def: 7, ammo: 4, cost: 120, recon: true },
    m109a7: { nat: "US", name: "M109A7 Paladin", cls: "Self-propelled howitzer", icon: "arty", mob: "track", move: 5, sight: 1, ind: 6, soft: 14, hard: 9, def: 7, ammo: 6, cost: 250 },
    himars: { nat: "US", name: "M142 HIMARS", cls: "Rocket artillery", icon: "mlrs", mob: "wheel", move: 7, sight: 1, ind: 10, soft: 17, hard: 9, def: 4, ammo: 2, cost: 310, armor: false },
    volcano: { nat: "US", name: "Volcano", cls: "Mine-dispensing system", icon: "mlrs", mob: "wheel", move: 6, sight: 1, def: 4, cost: 180, armor: false, mineRemote: 5, mines: 2 },
    mshorad: { nat: "US", name: "M-SHORAD", cls: "Short-range air defence", icon: "spaag", mob: "wheel", move: 8, sight: 3, airSight: 5, aaRange: 2, air: 15, range: 1, soft: 7, hard: 4, def: 8, ammo: 12, cost: 230 },
    nasams: { nat: "US", name: "NASAMS", cls: "Medium-range air defence", icon: "sam", mob: "wheel", move: 5, sight: 2, airSight: 7, aaRange: 5, air: 17, def: 4, ammo: 6, cost: 300, armor: false, missile: true },
    ah64e: { nat: "US", name: "AH-64E Apache", cls: "Attack helicopter – Hellfire, 30 mm", icon: "tiger", mob: "air", heli: true, move: 12, sight: 4, range: 3, soft: 13, hard: 17, airDef: 12, ammo: 3, fuel: 55, cost: 380, atgm: true },
    uh60m: { nat: "US", name: "UH-60M Black Hawk", cls: "Transport helicopter", icon: "nh90", mob: "air", heli: true, move: 13, sight: 3, airDef: 9, fuel: 55, cost: 210, cap: 1 },
    mq1c: { nat: "US", name: "MQ-1C Gray Eagle", cls: "Reconnaissance UAV", icon: "uav", mob: "air", uav: true, move: 11, sight: 6, airDef: 4, fuel: 40, cost: 120, recon: true },
    swblade: { nat: "US", name: "Switchblade 600 team", cls: "Loitering munition", icon: "lm", mob: "wheel", move: 6, sight: 2, drone: 7, soft: 10, hard: 15, def: 4, ammo: 3, cost: 180, armor: false },
    m1074: { nat: "US", name: "M1074 JAB", cls: "Bridge layer", icon: "bridge", mob: "track", move: 6, sight: 2, def: 14, cost: 160, bridge: true },
    m1150: { nat: "US", name: "M1150 ABV", cls: "Assault breacher vehicle", icon: "clear", mob: "track", move: 5, sight: 2, range: 1, soft: 4, hard: 2, def: 15, ammo: 3, cost: 190, clear: "full" },
    /* ---------------- China ---------------- */
    ztz100: { nat: "CN", name: "Type 100 (ZTZ-100)", cls: "Main battle tank", icon: "tank", mob: "track", move: 7, sight: 4, range: 2, soft: 10, hard: 17, def: 15, ammo: 8, cost: 300, aps: true },
    ztz99a: { nat: "CN", name: "ZTZ-99A", cls: "Main battle tank", icon: "tank", mob: "track", move: 6, sight: 3, range: 2, soft: 10, hard: 16, def: 15, ammo: 8, cost: 260 },
    zbd04a: { nat: "CN", name: "ZBD-04A", cls: "Infantry fighting vehicle", icon: "ifv", mob: "track", amph: true, move: 6, sight: 3, range: 2, soft: 13, hard: 10, air: 2, def: 9, ammo: 8, cost: 170, atgm: true },
    zbl08: { nat: "CN", name: "ZBL-08", cls: "Wheeled infantry fighting vehicle", icon: "apc", mob: "wheel", amph: true, move: 8, sight: 3, range: 1, soft: 10, hard: 6, air: 2, def: 8, ammo: 6, cost: 130 },
    plainf: { nat: "CN", name: "Mechanised infantry", cls: "Infantry (FN-16 MANPADS)", icon: "inf", mob: "foot", move: 3, sight: 2, range: 1, soft: 10, hard: 8, air: 9, aaRange: 1, def: 8, ammo: 6, cost: 110, airmobile: true },
    plaab: { nat: "CN", name: "Airborne infantry", cls: "Airborne infantry", icon: "para", mob: "foot", move: 3, sight: 2, range: 1, soft: 12, hard: 10, def: 9, ammo: 6, cost: 160, airmobile: true, para: true, atgm: true },
    plaeng: { nat: "CN", name: "Combat engineers", cls: "Combat engineers", icon: "eng", mob: "foot", move: 3, sight: 2, range: 1, soft: 8, hard: 7, def: 8, ammo: 4, cost: 110, airmobile: true, engineer: true, mineLay: true, mines: 2, clear: "lane" },
    csk: { nat: "CN", name: "CSK-181", cls: "Reconnaissance vehicle", icon: "recon", mob: "wheel", move: 8, sight: 5, range: 1, soft: 6, hard: 3, def: 7, ammo: 4, cost: 120, recon: true },
    pcl181: { nat: "CN", name: "PCL-181", cls: "Truck-mounted howitzer", icon: "arty", mob: "wheel", move: 7, sight: 1, ind: 6, soft: 14, hard: 9, def: 5, ammo: 6, cost: 230, armor: false },
    phl16: { nat: "CN", name: "PHL-16", cls: "Rocket artillery", icon: "mlrs", mob: "wheel", move: 6, sight: 1, ind: 10, soft: 17, hard: 9, def: 4, ammo: 2, cost: 310, armor: false },
    plamine: { nat: "CN", name: "Remote minelayer", cls: "Rocket mine-laying system", icon: "mlrs", mob: "wheel", move: 6, sight: 1, def: 4, cost: 190, armor: false, mineRemote: 7, mines: 2 },
    pgl625: { nat: "CN", name: "PGL-625", cls: "Short-range air defence", icon: "spaag", mob: "wheel", move: 7, sight: 3, airSight: 5, aaRange: 2, air: 15, range: 1, soft: 7, hard: 3, def: 6, ammo: 12, cost: 230 },
    hq17a: { nat: "CN", name: "HQ-17A", cls: "Medium-range air defence", icon: "sam", mob: "wheel", move: 6, sight: 2, airSight: 7, aaRange: 4, air: 17, def: 5, ammo: 8, cost: 300, missile: true },
    z10: { nat: "CN", name: "Z-10ME", cls: "Attack helicopter", icon: "tiger", mob: "air", heli: true, move: 12, sight: 4, range: 3, soft: 11, hard: 15, airDef: 10, ammo: 3, fuel: 55, cost: 330, atgm: true },
    z20: { nat: "CN", name: "Z-20", cls: "Transport helicopter", icon: "nh90", mob: "air", heli: true, move: 13, sight: 3, airDef: 9, fuel: 55, cost: 210, cap: 1 },
    ch4: { nat: "CN", name: "CH-4", cls: "Reconnaissance UAV", icon: "uav", mob: "air", uav: true, move: 10, sight: 6, airDef: 4, fuel: 40, cost: 110, recon: true },
    plalm: { nat: "CN", name: "Loitering munition team", cls: "Loitering munition", icon: "lm", mob: "wheel", move: 6, sight: 2, drone: 7, soft: 10, hard: 14, def: 4, ammo: 3, cost: 180, armor: false },
    plabridge: { nat: "CN", name: "Bridge layer", cls: "Bridge layer", icon: "bridge", mob: "track", move: 6, sight: 2, def: 12, cost: 140, bridge: true },
    placlear: { nat: "CN", name: "Mine-clearing vehicle", cls: "Mine-clearing vehicle", icon: "clear", mob: "track", move: 5, sight: 2, range: 1, soft: 4, hard: 2, def: 13, ammo: 3, cost: 170, clear: "full" },
    /* ---------------- both ---------------- */
    lrauv: { nat: "*", name: "Long Range Attack UAV", cls: "One-way attack drones (special)", icon: "uav", mob: "air", uav: true, move: 0, sight: 0, soft: 14, hard: 16, airDef: 3, def: 2, cost: 300, strike: true },
    farp: { nat: "*", name: "FARP", cls: "Forward arming and refuelling point", icon: "farp", mob: "wheel", move: 5, sight: 1, def: 4, cost: 120, farp: true, armor: false },
  });

  for (const k in T) {
    const t = T[k];
    t.id = k;
    t.air = t.air || 0; t.soft = t.soft || 0; t.hard = t.hard || 0;
    t.range = t.range || 0; t.ind = t.ind || 0; t.aaRange = t.aaRange || 0;
    t.ammo = t.ammo || 0; t.aam = t.aam || 0;
    t.isAir = t.mob === "air";
    if (t.armor === undefined) t.armor = t.mob === "track" || t.mob === "wheel";
    if (!t.airSight) t.airSight = t.sight;
  }

  // photo sprites that exist in assets/units/ (top-down, facing right, transparent WebP)
  MG.SPRITES = ["a400m", "ah64e", "bmp3", "bmr3", "btr82a", "c17", "ch4", "csk", "farp", "fennek", "fsj", "gmz3", "himars", "hq17a", "il76", "irist", "isdm", "jltv", "ka52", "kodiak", "lancet", "leguan", "leo2a8", "lkh", "lkh_rkt", "lmteam", "lrauv", "luna", "m1074", "m109a7", "m1150", "m1a2", "m1e3", "m2a4", "mars2", "mi8", "mq1c", "mshorad", "msr", "msta", "mtu72", "nasams", "nh90", "orlan", "pantsir", "pcl181", "pgl625", "phl16", "pio", "plaab", "plabridge", "placlear", "plaeng", "plainf", "plalm", "plamine", "puma", "pzgren", "pzh2000", "sappers", "skyranger", "stryker", "swblade", "t80bvm", "t90m", "tiger", "tigr", "torm2", "tornados", "uh60m", "usab", "useng", "usinf", "vdv", "volcano", "y20", "z10", "z20", "zbd04a", "zbl08", "ztz100", "ztz99a"];

  // rotor hubs in the 256 × 256 helicopter pictures (the blades are drawn and turned by code)
  MG.ROTORS = {
    lkh: [{ x: 140, y: 104, r: 108, ry: 0.72, n: 5 }],
    lkh_rkt: [{ x: 148, y: 104, r: 108, ry: 0.72, n: 5 }],
    tiger: [{ x: 143, y: 108, r: 104, ry: 0.68, n: 4 }],
    nh90: [{ x: 147, y: 121, r: 100, ry: 0.66, n: 4 }],
    ka52: [{ x: 130, y: 112, r: 112, ry: 0.6, n: 3, dir: -1 }, { x: 131, y: 76, r: 112, ry: 0.6, n: 3 }],
    mi8: [{ x: 148, y: 100, r: 118, ry: 0.64, n: 5 }],
    ah64e: [{ x: 150, y: 118, r: 104, ry: 0.66, n: 4 }],
    uh60m: [{ x: 152, y: 126, r: 106, ry: 0.66, n: 4 }],
    z10: [{ x: 146, y: 111, r: 104, ry: 0.66, n: 5 }],
    z20: [{ x: 157, y: 119, r: 106, ry: 0.66, n: 5 }],
  };

  MG.NATIONS = {
    DE: { name: "Germany", army: "Bundeswehr", adj: "German", col: "#2f6fd6", dark: "#173a72" },
    RU: { name: "Russia", army: "Russian Ground Forces", adj: "Russian", col: "#c8382e", dark: "#5e1813" },
    US: { name: "USA", army: "US Army", adj: "US", col: "#1f9a8a", dark: "#0d4a42" },
    CN: { name: "China", army: "People's Liberation Army", adj: "Chinese", col: "#e0a020", dark: "#6b4a08" },
  };
  // which unit type fills each role in an army
  MG.ROLES = {
    DE: { mbt: "leo2a8", mbt2: "leo2a8", ifv: "puma", apc: "puma", inf: "pzgren", para: "fsj", eng: "pio", recon: "fennek", arty: "pzh2000", mlrs: "mars2", rmine: "mars2", shorad: "skyranger", sam: "irist", atk: "tiger", atk2: "lkh", trans: "nh90", uav: "luna", lm: "lmteam", bridge: "leguan", clear: "kodiak", mlayer: "pio", lrauv: "lrauv" },
    RU: { mbt: "t90m", mbt2: "t80bvm", ifv: "bmp3", apc: "btr82a", inf: "msr", para: "vdv", eng: "sappers", recon: "tigr", arty: "msta", mlrs: "tornados", rmine: "isdm", shorad: "pantsir", sam: "torm2", atk: "ka52", atk2: "ka52", trans: "mi8", uav: "orlan", lm: "lancet", bridge: "mtu72", clear: "bmr3", mlayer: "gmz3", lrauv: "lrauv" },
    US: { mbt: "m1e3", mbt2: "m1a2", ifv: "m2a4", apc: "stryker", inf: "usinf", para: "usab", eng: "useng", recon: "jltv", arty: "m109a7", mlrs: "himars", rmine: "volcano", shorad: "mshorad", sam: "nasams", atk: "ah64e", atk2: "ah64e", trans: "uh60m", uav: "mq1c", lm: "swblade", bridge: "m1074", clear: "m1150", mlayer: "useng", lrauv: "lrauv" },
    CN: { mbt: "ztz100", mbt2: "ztz99a", ifv: "zbd04a", apc: "zbl08", inf: "plainf", para: "plaab", eng: "plaeng", recon: "csk", arty: "pcl181", mlrs: "phl16", rmine: "plamine", shorad: "pgl625", sam: "hq17a", atk: "z10", atk2: "z10", trans: "z20", uav: "ch4", lm: "plalm", bridge: "plabridge", clear: "placlear", mlayer: "plaeng", lrauv: "lrauv" },
  };
})(window.MG);
