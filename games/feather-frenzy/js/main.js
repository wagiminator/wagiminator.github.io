/* Feather Frenzy: main loop, scaling, fullscreen, screen wake lock, state machine */
"use strict";

(function (FF) {
  const { U, Store, States } = FF;
  const A = FF.Audio, I = FF.Input;
  const W = U.W, H = U.H;

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const view = { scale: 1, ox: 0, oy: 0, dpr: 1 };

  const Main = (FF.Main = { state: "boot", scrollSpeed: Store.get("scrollSpeed", 1), keepAwake: Store.get("keepAwake", true) });
  let cur = States.boot;

  function setState(name, arg) {
    Main.state = name;
    cur = States[name];
    I.mouse.clicked = false;
    if (cur.enter) cur.enter(arg);
  }
  Main.setState = setState;
  FF.UI.bind(setState);

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
  I.attachPointer(canvas, (cx, cy) => ({ x: (cx * view.dpr - view.ox) / view.scale, y: (cy * view.dpr - view.oy) / view.scale }));
  I.onGesture = () => { A.init(); updateWakeLock(true); };

  Main.toggleFullscreen = function () {
    if (document.fullscreenElement) { if (document.exitFullscreen) document.exitFullscreen(); }
    else {
      const el = document.documentElement;
      const req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req) { const p = req.call(el, { navigationUI: "hide" }); if (p && p.catch) p.catch(() => {}); }
    }
  };
  Main.setCursor = function (visible) { canvas.style.cursor = visible ? "default" : "none"; };

  // pause when the page is hidden or loses focus
  document.addEventListener("visibilitychange", () => { if (document.hidden && Main.state === "play") States.play.pause(); });
  window.addEventListener("blur", () => { if (Main.state === "play") States.play.pause(); });

  /* ---------- keep the screen awake while playing (a gamepad does not reset the screen saver) ---------- */
  let wakeLock = null, wakeBusy = false, wakeRetryAt = 0;
  function updateWakeLock(force) {
    if (!navigator.wakeLock || wakeBusy) return;
    if (wakeLock && wakeLock.released) wakeLock = null;
    const want = Main.keepAwake && Main.state === "play" && !States.play.paused && !document.hidden;
    if (want && !wakeLock) {
      if (!force && performance.now() < wakeRetryAt) return;
      wakeBusy = true;
      navigator.wakeLock.request("screen").then((l) => {
        wakeLock = l; wakeBusy = false;
        l.addEventListener("release", () => { if (wakeLock === l) wakeLock = null; });
      }).catch(() => { wakeBusy = false; wakeRetryAt = performance.now() + 3000; });
    } else if (!want && wakeLock) {
      const l = wakeLock; wakeLock = null;
      l.release().catch(() => {});
    }
  }

  function globalKeys() {
    if (Main.state === "nameentry") return;
    if (I.pressed.has("KeyF")) Main.toggleFullscreen();
    if (I.pressed.has("KeyM")) A.toggleMute();
  }

  /* ---------- loop ---------- */
  const STEP = 1 / 60;
  let last = performance.now(), acc = 0, frameN = 0;

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
    if (++frameN % 10 === 0) updateWakeLock();
    globalKeys();
    if (cur.input) cur.input(dt);
    acc += dt;
    let n = 0;
    while (acc >= STEP && n < 6) { if (cur.update) cur.update(STEP); acc -= STEP; n++; }
    if (n === 6) acc = 0;
    Main.setCursor(!(Main.state === "play" && !States.play.paused) && !I.showCursor());
    render();
    I.endFrame();
  }

  // test hook: advance the simulation without rendering
  Main.simulate = function (seconds) {
    const n = Math.round(seconds / STEP);
    for (let i = 0; i < n; i++) if (cur.update) cur.update(STEP);
  };

  function start() {
    setState("boot");
    requestAnimationFrame(frame);
  }
  if (document.fonts && document.fonts.load) {
    Promise.race([
      Promise.all([document.fonts.load("40px 'Lilita One'"), document.fonts.load("800 20px Nunito")]),
      new Promise((r) => setTimeout(r, 1500)),
    ]).then(start, start);
  } else start();
})(window.FF);
