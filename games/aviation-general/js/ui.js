/* Aviation General: title, briefing and help screens */
"use strict";

(function (MG) {
  const { U, D, Input: I } = MG;
  const G = MG.G, A = MG.Audio;
  const W = U.W, H = U.H;
  const States = (MG.States = MG.States || {});
  const hit = (b) => I.mouse.x >= b.x && I.mouse.x <= b.x + b.w && I.mouse.y >= b.y && I.mouse.y <= b.y + b.h;

  // a menu: buttons, keyboard/gamepad focus, click handling
  function menu(st, items) {
    st.items = items;
    if (st.focus == null || st.focus >= items.length) st.focus = 0;
    if (I.hit("down")) st.focus = (st.focus + 1) % items.length;
    if (I.hit("up")) st.focus = (st.focus + items.length - 1) % items.length;
    if (I.mouse.moved) items.forEach((b, k) => { if (hit(b)) st.focus = k; });
    if (I.mouse.released) { for (const b of items) if (hit(b) && !b.disabled) { A.sfx("click"); b.on(); return; } }
    else if (I.hit("click") && items[st.focus] && !items[st.focus].disabled) { A.sfx("click"); items[st.focus].on(); }
  }

  // the title picture (H145M LKH and T-90M); the battle map behind the other menus if it is missing
  let title = null;
  if (typeof Image !== "undefined") { const im = new Image(); im.onload = () => { title = im; }; im.src = "assets/title.webp"; }
  function picture(c, dim) {
    if (!title) return false;
    c.imageSmoothingQuality = "high";
    c.drawImage(title, 0, 0, W, H);
    if (dim) { c.fillStyle = `rgba(14,18,22,${dim})`; c.fillRect(0, 0, W, H); }
    return true;
  }
  // the background: the battle map, slowly panning
  let bg = null, bgT = 0;
  function background(c, dt) {
    if (picture(c, 0.62)) return;
    if (!bg) { G.setup(MG.SCENARIOS[0]); bg = D.renderMap(); }
    bgT += dt || 0;
    const z = 0.95, ww = bg.width / D.mapScale, wh = bg.height / D.mapScale;
    const x = (Math.sin(bgT * 0.05) * 0.5 + 0.5) * (ww - W / z), y = (Math.cos(bgT * 0.04) * 0.5 + 0.5) * (wh - H / z);
    c.save(); c.scale(z, z); c.drawImage(bg, -x, -y, ww, wh); c.restore();
    c.fillStyle = "rgba(14,18,22,0.55)"; c.fillRect(0, 0, W, H);
  }

  States.boot = {
    enter() {
      for (const sc of MG.SCENARIOS) D.photo(sc.photo);
      D.loadTex();
      // ?unlock opens all campaigns and battles (for testing)
      if (typeof location !== "undefined" && /[?&]unlock\b/.test(location.search)) { const p = MG.Campaign.progress(); p.tut = true; for (const a of MG.Campaign.ARMIES) p.camp[a].next = 8; MG.Campaign.saveProgress(p); }
      MG.Main.setState("title");
    },
    draw() {},
  };
  const C = MG.Campaign;

  States.title = {
    enter() { this.focus = 0; },
    input() {
      const save = MG.Store.get("save", null);
      const bx = W - 400;
      const items = [];
      const prog = C.progress();
      if (save) items.push({ label: "Continue battle", on: () => MG.Main.setState("play", { load: save }) });
      items.push({ label: "Tutorial: Operation Brückenkopf", on: () => MG.Main.setState("briefing", { scen: MG.SCENARIOS[0] }) });
      items.push({ label: prog.tut ? "Campaigns" : "Campaigns (win the tutorial)", disabled: !prog.tut, on: () => MG.Main.setState("armies") });
      items.push({ label: "How to play", on: () => MG.Main.setState("help", { back: "title" }) });
      items.push({ label: "Sound: " + (A.muted ? "off" : "on") + " (M)", on: () => A.toggleMute() });
      items.forEach((b, k) => Object.assign(b, { x: bx, y: 188 + k * 40, w: 340, h: 34, size: 16 }));
      menu(this, items);
    },
    update(dt) { bgT += dt; },
    draw(c) {
      if (picture(c, 0)) {
        const g = c.createLinearGradient(0, 0, 0, 200); g.addColorStop(0, "rgba(10,12,16,0.55)"); g.addColorStop(1, "rgba(10,12,16,0)");
        c.fillStyle = g; c.fillRect(0, 0, W, 200);
        c.fillStyle = "rgba(10,12,16,0.35)"; c.fillRect(W - 420, 180, 380, (this.items || []).length * 40 + 10);
      } else background(c, 0);
      c.shadowColor = "rgba(0,0,0,0.7)"; c.shadowBlur = 14;
      D.text(c, "AVIATION GENERAL", W / 2, 78, 64, "#ffd36a", "center", 900, D.LOGO);
      D.text(c, "Hex Strategy · Combined Arms Warfare · 2031", W / 2, 136, 24, "#ffffff", "center", 700);
      D.text(c, "Attack helicopters, air assault, air defence, mines and bridges", W / 2, 166, 18, "#e8edf2", "center", 600);
      c.shadowBlur = 0;
      (this.items || []).forEach((b, k) => D.button(c, b, k === this.focus));
      c.fillStyle = "rgba(10,12,16,0.55)"; c.fillRect(0, H - 44, W, 44);
      D.text(c, "Mouse, touch, keyboard or gamepad · F fullscreen · M sound", W / 2, H - 22, 15, "#c9d2da", "center", 600);
    },
  };

  States.briefing = {
    enter(arg) {
      this.focus = 0;
      this.sc = (arg && arg.scen) || MG.SCENARIOS[0];
      this.back = this.sc.camp ? ["campaign", { army: this.sc.camp.army }] : ["title"];
      // build the battle now: the briefing shows its map, and the battle starts from it
      G.setup(this.sc); D.renderMap(); this.map = D.mapCanvas; this.mapFor = G.S;
    },
    input() {
      const go = () => {
        MG.Store.set("save", null);
        if (G.S === this.mapFor) MG.Main.setState("play", { keep: true, ready: true });
        else MG.Main.setState("play", { scen: this.sc });
      };
      const items = [
        { label: this.sc.tutorial ? "Start tutorial" : "Start battle", x: W / 2 + 20, y: H - 90, w: 260, h: 46, on: go },
        { label: "Back", x: W / 2 - 280, y: H - 90, w: 260, h: 46, on: () => MG.Main.setState(...this.back) },
      ];
      if (I.hit("back")) { MG.Main.setState(...this.back); return; }
      menu(this, items);
    },
    update(dt) { bgT += dt; },
    draw(c) {
      background(c, 0);
      const sc = this.sc, N = MG.NATIONS, me = sc.player, en = sc.sides ? sc.sides[1] : "RU";
      const att = sc.attacker === me;
      c.fillStyle = "rgba(20,26,32,0.92)"; c.fillRect(120, 50, W - 240, H - 160);
      D.text(c, sc.title.toUpperCase(), 160, 90, 32, "#ffd36a", "left", 900, D.LOGO);
      D.text(c, N[me].name + (att ? " attacks" : " defends") + " · " + sc.maxTurn + " turns · " + sc.W + " × " + sc.H + " hexes · you command the " + N[me].army + " against the " + N[en].army, 160, 128, 17, "#9fc6e8", "left", 700);
      // the map, if there is room
      let tw = W - 320;
      if (G.S === this.mapFor && D.mapCanvas) this.map = D.mapCanvas; // the photo may have arrived meanwhile
      if (this.map) {
        const mw = 380, mh = Math.min(300, (mw * this.map.height) / this.map.width), mx = W - 160 - mw, my = 150;
        c.drawImage(this.map, mx, my, mw, mh);
        c.strokeStyle = "#5d6b78"; c.lineWidth = 1; c.strokeRect(mx + 0.5, my + 0.5, mw - 1, mh - 1);
        // objectives on the small map
        const k = mw / D.worldW();
        for (const i of G.objectives()) { c.fillStyle = D.side(G.S.hex[i].obj.owner); c.fillRect(mx + D.cx(i) * k - 5, my + D.cy(i) * k - 5, 10, 10); c.strokeStyle = "#fff"; c.strokeRect(mx + D.cx(i) * k - 5, my + D.cy(i) * k - 5, 10, 10); }
        tw = mx - 30 - 160;
      }
      let y = 156;
      y += D.para(c, sc.briefing, 160, y, 17, tw, "#e8edf2", 1.33) + 12;
      D.text(c, "TIPS", 160, y + 10, 16, "#ffd36a", "left", 700); y += 26;
      for (const h of sc.hints) { y += D.para(c, "• " + h, 160, y, 15, tw, "#c7d3df", 1.28) + 2; }
      (this.items || []).forEach((b, k) => D.button(c, b, k === this.focus));
    },
  };

  /* ---------------- campaigns: choose an army, then a battle ---------------- */
  const HERO = { DE: "leo2a8", RU: "t90m", US: "m1e3", CN: "ztz100" };
  States.armies = {
    enter() { this.focus = 0; },
    input() {
      const prog = C.progress();
      const items = C.ARMIES.map((a, k) => ({ army: a, x: 90 + k * 280, y: 170, w: 260, h: 330, label: "", on: () => MG.Main.setState("campaign", { army: a }) }));
      items.push({ label: "Back", x: W / 2 - 130, y: H - 90, w: 260, h: 46, on: () => MG.Main.setState("title") });
      if (I.hit("back")) { MG.Main.setState("title"); return; }
      if (I.hit("right")) this.focus = (this.focus + 1) % items.length;
      if (I.hit("left")) this.focus = (this.focus + items.length - 1) % items.length;
      menu(this, items);
      void prog;
    },
    update(dt) { bgT += dt; },
    draw(c) {
      background(c, 0);
      const prog = C.progress();
      D.text(c, "CHOOSE YOUR ARMY", W / 2, 90, 34, "#ffd36a", "center", 900, D.LOGO);
      D.text(c, "Each army fights its own campaign of eight battles – harder enemies on ever larger maps.", W / 2, 132, 18, "#e8edf2", "center", 600);
      (this.items || []).forEach((b, k) => {
        if (!b.army) { D.button(c, b, k === this.focus); return; }
        const n = MG.NATIONS[b.army], p = prog.camp[b.army], f = k === this.focus;
        c.fillStyle = f ? "rgba(36,46,58,0.96)" : "rgba(22,28,36,0.92)"; c.fillRect(b.x, b.y, b.w, b.h);
        c.fillStyle = n.col; c.fillRect(b.x, b.y, b.w, 6);
        c.strokeStyle = f ? "#ffd36a" : "#3a4652"; c.lineWidth = f ? 2 : 1; c.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
        D.text(c, n.name.toUpperCase(), b.x + b.w / 2, b.y + 36, 26, "#ffffff", "center", 900, D.LOGO);
        D.text(c, n.army, b.x + b.w / 2, b.y + 64, 16, "#9fc6e8", "center", 700);
        const im = D.sprite(HERO[b.army]);
        if (im) { c.save(); c.fillStyle = D.rgba(n.col, 0.35); c.beginPath(); c.ellipse(b.x + b.w / 2, b.y + 170, 100, 44, 0, 0, U.TAU); c.fill(); c.drawImage(im, b.x + b.w / 2 - 95, b.y + 80, 190, 190); c.restore(); }
        D.text(c, "vs " + MG.NATIONS[C.ENEMY[b.army]].name, b.x + b.w / 2, b.y + 280, 16, "#c7d3df", "center", 600);
        const done = Math.min(8, p.next);
        D.text(c, done >= 8 ? "CAMPAIGN WON ★" : done ? "Battle " + (done + 1) + " of 8 next" : "Not started", b.x + b.w / 2, b.y + 306, 17, done >= 8 ? "#9fe08a" : "#ffd36a", "center", 700);
      });
    },
  };

  States.campaign = {
    enter(arg) { this.army = (arg && arg.army) || this.army || "DE"; const p = C.progress().camp[this.army]; this.focus = Math.min(7, p.next); },
    input() {
      const p = C.progress().camp[this.army];
      const items = C.BATTLES[this.army].map(([t], k) => ({ k, x: 150 + (k % 2) * 500, y: 160 + Math.floor(k / 2) * 92, w: 480, h: 80, label: "", disabled: k > p.next, on: () => MG.Main.setState("briefing", { scen: C.scenario(this.army, k) }) }));
      items.push({ label: "Back", x: W / 2 - 130, y: H - 80, w: 260, h: 46, on: () => MG.Main.setState("armies") });
      if (I.hit("back")) { MG.Main.setState("armies"); return; }
      menu(this, items);
    },
    update(dt) { bgT += dt; },
    draw(c) {
      background(c, 0);
      const n = MG.NATIONS[this.army], p = C.progress().camp[this.army];
      D.text(c, n.name.toUpperCase() + " CAMPAIGN", W / 2, 80, 34, "#ffd36a", "center", 900, D.LOGO);
      D.text(c, "The " + n.army + " against the " + MG.NATIONS[C.ENEMY[this.army]].army + " · win a battle to open the next · prestige carries over", W / 2, 120, 17, "#e8edf2", "center", 600);
      const sizes = C.SIZES;
      (this.items || []).forEach((b, k) => {
        if (b.k === undefined) { D.button(c, b, k === this.focus); return; }
        const [t, mode] = C.BATTLES[this.army][b.k], won = b.k < p.next, open = b.k <= p.next, f = k === this.focus;
        c.fillStyle = !open ? "rgba(18,22,28,0.85)" : f ? "rgba(40,52,64,0.96)" : "rgba(24,30,38,0.94)"; c.fillRect(b.x, b.y, b.w, b.h);
        c.fillStyle = won ? "#9fe08a" : open ? n.col : "#3a4048"; c.fillRect(b.x, b.y, 6, b.h);
        if (f && open) { c.strokeStyle = "#ffd36a"; c.lineWidth = 2; c.strokeRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2); }
        D.text(c, b.k + 1 + ". " + t, b.x + 22, b.y + 26, 22, open ? "#ffffff" : "#68717b", "left", 700);
        D.text(c, (mode === "attack" ? "Attack" : "Defence") + " · " + sizes[b.k][0] + " × " + sizes[b.k][1] + " hexes · difficulty " + "●".repeat(1 + Math.floor(b.k / 2)) + "○".repeat(3 - Math.floor(b.k / 2)), b.x + 22, b.y + 56, 15, open ? "#9fc6e8" : "#5a636c", "left", 600);
        D.text(c, won ? "WON ✓" : open ? "NEXT ▶" : "LOCKED", b.x + b.w - 16, b.y + 26, 16, won ? "#9fe08a" : open ? "#ffd36a" : "#5a636c", "right", 700);
      });
    },
  };

  const HELP = [
    ["Your turn", "Select a unit and click a lit hex to move it, or a red ring to attack. Each ground unit moves once and then may fire; it cannot move after firing. Press E or the button to end the turn, N to jump to the next unit with something to do. Units that stay put dig in a little each turn; infantry can also choose Dig in: no move or fire that turn, but two levels deeper (more defence) until it moves again."],
    ["Go · Slow Go · No Go", "Every hex is Go, Slow Go (costs two points, vehicles cannot fire afterwards) or No Go for each kind of running gear: tracked, wheeled or on foot. Forests are No Go for tracked vehicles except along a road. Roads are faster. Rivers are No Go except at bridges, at the ford, for amphibious vehicles, or for infantry who swim across with their whole move. Press G to colour the map for the selected unit."],
    ["Sight and range", "Forests, towns and higher ground block the view; from a hill you see one hex further. Units in forests and towns are only seen from next door or when they fire. In close terrain all direct fire is at one hex (two for helicopters). Artillery needs another unit to spot its target. Press V to see what the selected unit sees."],
    ["Helicopters", "Helicopters fly over everything, may move, fire and then fly on with the rest of their move, and use one fuel per hex. To fire, a helicopter pops up over the trees: it sees over forests and villages in between and has its full range into forests and towns, but air defence sees it better then. The Tiger also carries Stinger missiles (range 3) against enemy helicopters and drones and fires them back when one comes close. Land next to or on a FARP to refuel, rearm and repair – they then sit on the ground until your next turn, open to artillery and drones. Out of fuel means an emergency landing. The LKH carries one quad launcher with Spike ER2 on each side: it fires at anything a friendly unit spots, without its own line of sight. At a FARP it can swap to rockets and a 20 mm gun against soft targets. A red, struck-through crosshair marks a helicopter that has already fired this turn."],
    ["Air defence", "Skyranger, IRIS-T, Pantsir, Tor and infantry with MANPADS fire on every aircraft and drone that flies, lands or attacks within their reach – but only if they can see it. Fly low behind hills and forests. Press T to show the reach of the enemy air defence you know about; the flight path turns orange or red where it is in danger."],
    ["Air assault and parachutes", "An NH90 picks up infantry from its own or a neighbouring hex, flies them and lands them on open ground or a road. A hot landing zone costs strength. The Fallschirmjäger at the airfield jump from a transport aircraft; air defence on the flight path fires at the aircraft, and the wind may scatter the jump."],
    ["Mines and bridges", "Engineers and minelayers lay hidden minefields next to them; MARS II and ISDM scatter mines several hexes away that everyone can see and that last four turns. Reconnaissance, engineers and UAVs find mines nearby. The Kodiak clears a minefield in two steps (first a lane), engineers breach a lane. The Leguan lays an assault bridge over a river hex and can recover it. Engineers can blow bridges – the enemy will."],
    ["Winning", "The attacker must take all objectives (flags) before the last turn; the defender wins by holding at least one. Win the tutorial to unlock the campaigns: Germany, Russia, the USA and China each fight eight battles on growing maps. The battle also ends when one side has no ground forces left. Prestige comes from hits and captured objectives and pays for reinforcements and Spike ER2. The game saves itself at the start of each of your turns."],
  ];
  States.help = {
    enter(arg) { this.back = (arg && arg.back) || "title"; this.page = 0; },
    input() {
      const items = [{ label: this.back === "play" ? "Back to the battle" : "Back", x: W / 2 - 150, y: H - 70, w: 300, h: 44, on: () => MG.Main.setState(this.back, this.back === "play" ? { keep: true } : undefined) }];
      if (I.hit("back")) { items[0].on(); return; }
      menu(this, items);
    },
    update(dt) { bgT += dt; },
    draw(c) {
      background(c, 0);
      c.fillStyle = "rgba(20,26,32,0.94)"; c.fillRect(70, 30, W - 140, H - 120);
      D.text(c, "HOW TO PLAY", 100, 62, 28, "#ffd36a", "left", 900, D.LOGO);
      const colW = (W - 240) / 2;
      let y0 = 92, y1 = 92;
      HELP.forEach(([h, t], k) => {
        const left = k < 4, x = left ? 100 : 140 + colW;
        let y = left ? y0 : y1;
        D.text(c, h, x, y + 10, 18, "#9fc6e8", "left", 700); y += 22;
        y += D.para(c, t, x, y, 14, colW, "#dfe6ec", 1.24) + 10;
        if (left) y0 = y; else y1 = y;
      });
      (this.items || []).forEach((b, k) => D.button(c, b, k === this.focus));
    },
  };
})(window.MG);
