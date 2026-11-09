/* DREAMHOP: main loop, scaling, fullscreen, state machine */
"use strict";

(function (XA) {
  const { U, Gfx, Store, States } = XA;
  const G = XA.G;
  const A = XA.Audio, I = XA.Input;
  const W = U.W, H = U.H;

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const view = { scale: 1, ox: 0, oy: 0, dpr: 1 };

  const Main = (XA.Main = { state: "boot" });
  let cur = States.boot;

  function setState(name, arg) {
    Main.state = name;
    cur = States[name];
    if (cur.enter) cur.enter(arg);
  }
  Main.setState = setState;
  XA.UI.bind(setState);

  function resize() {
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = window.innerWidth, ch = window.innerHeight;
    dpr = Math.min(dpr, 2560 / Math.max(1, cw));
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    canvas.style.width = cw + "px"; canvas.style.height = ch + "px";
    view.dpr = dpr;
    view.scale = Math.min(canvas.width / W, canvas.height / H);
    view.ox = (canvas.width - W * view.scale) / 2;
    view.oy = (canvas.height - H * view.scale) / 2;
  }
  window.addEventListener("resize", resize);
  resize();
  I.attachMouse(canvas, (cx, cy) => ({ x: (cx * view.dpr - view.ox) / view.scale, y: (cy * view.dpr - view.oy) / view.scale }));
  I.onGesture = () => A.init();

  Main.toggleFullscreen = function () {
    if (document.fullscreenElement) { if (document.exitFullscreen) document.exitFullscreen(); }
    else {
      const el = document.documentElement;
      const req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req) { const p = req.call(el, { navigationUI: "hide" }); if (p && p.catch) p.catch(() => {}); }
    }
  };
  Main.setCursor = function (visible) { canvas.style.cursor = visible ? "default" : "none"; };

  // Pause when the page is hidden or loses focus
  document.addEventListener("visibilitychange", () => { if (document.hidden && Main.state === "play") States.play.pause(); });
  window.addEventListener("blur", () => { if (Main.state === "play") States.play.pause(); });

  /* ---------- Secret ---------- */
  let typedBuf = "";
  const SECRET = [68, 65, 89, 68, 82, 69, 65, 77].map((c) => String.fromCharCode(c)).join("");
  const PADSEQ = ["p12", "p12", "p13", "p13", "p14", "p15", "p14", "p15", "p1", "p0"].join(",");
  function toggleSecret() {
    G.cheat = !G.cheat;
    if (G.cheat && G.run) G.run.cheated = true;
    A.sfx(G.cheat ? "secret" : "secretOff");
  }
  function checkSecret() {
    if (Main.state === "nameentry") { typedBuf = ""; return; }
    for (const ch of I.typed) typedBuf = (typedBuf + ch.toUpperCase()).slice(-12);
    if (typedBuf.endsWith(SECRET)) { typedBuf = ""; toggleSecret(); }
    if (I.seq.length >= 10 && I.seq.slice(-10).join(",") === PADSEQ) { I.seq.length = 0; toggleSecret(); }
  }

  function globalKeys() {
    if (Main.state === "nameentry") return;
    if (I.pressed.has("KeyF")) Main.toggleFullscreen();
    if (I.pressed.has("KeyM")) A.toggleMute();
  }

  /* ---------- Loop ---------- */
  const STEP = 1 / 60;
  let last = performance.now(), acc = 0;

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(view.scale, 0, 0, view.scale, view.ox, view.oy);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
    cur.draw(ctx);
    ctx.restore();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.25) dt = 0.25;
    if (dt < 0) dt = 0;
    I.poll(dt);
    checkSecret();
    globalKeys();
    if (cur.input) cur.input(dt);
    acc += dt;
    let n = 0;
    while (acc >= STEP && n < 6) { if (cur.update) cur.update(STEP); acc -= STEP; n++; }
    if (n === 6) acc = 0;
    render();
    I.endFrame();
  }

  // Test hook: advance the simulation without rendering
  Main.simulate = function (seconds) {
    const n = Math.round(seconds / STEP);
    for (let i = 0; i < n; i++) if (cur.update) cur.update(STEP);
  };

  function start() {
    Gfx.init();
    setState("boot");
    requestAnimationFrame(frame);
  }
  if (document.fonts && document.fonts.load) {
    Promise.race([
      Promise.all([document.fonts.load("20px \"Press Start 2P\""), document.fonts.load("600 20px Rajdhani")]),
      new Promise((r) => setTimeout(r, 1500)),
    ]).then(start, start);
  } else start();
})(window.XA);
