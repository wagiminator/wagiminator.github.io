/* Aviation General: main loop, scaling, fullscreen, screen wake lock, state machine */
"use strict";

(function (MG) {
  const { U, Store, States } = MG;
  const A = MG.Audio, I = MG.Input;
  const W = U.W, H = U.H;

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const view = { scale: 1, ox: 0, oy: 0, dpr: 1 };

  const Main = (MG.Main = { state: "boot" });
  let cur = States.boot;
  Main.setState = function (name, arg) {
    Main.state = name;
    cur = States[name];
    I.mouse.clicked = I.mouse.released = false;
    if (cur.enter) cur.enter(arg);
  };

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
      const el = document.documentElement, req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req) { const p = req.call(el, { navigationUI: "hide" }); if (p && p.catch) p.catch(() => {}); }
    }
  };

  /* keep the screen awake during a battle */
  let wakeLock = null, wakeBusy = false;
  function updateWakeLock() {
    if (!navigator.wakeLock || wakeBusy) return;
    if (wakeLock && wakeLock.released) wakeLock = null;
    const want = Main.state === "play" && !document.hidden;
    if (want && !wakeLock) {
      wakeBusy = true;
      navigator.wakeLock.request("screen").then((l) => { wakeLock = l; wakeBusy = false; }).catch(() => { wakeBusy = false; });
    } else if (!want && wakeLock) { const l = wakeLock; wakeLock = null; l.release().catch(() => {}); }
  }

  const STEP = 1 / 60;
  let last = performance.now(), acc = 0, frameN = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.25) dt = 0.25;
    if (dt < 0) dt = 0;
    I.poll(dt);
    if (++frameN % 30 === 0) updateWakeLock();
    if (I.pressed.has("KeyF")) Main.toggleFullscreen();
    if (I.pressed.has("KeyM")) A.toggleMute();
    if (cur.input) cur.input(dt);
    acc += dt;
    let n = 0;
    while (acc >= STEP && n < 6) { if (cur.update) cur.update(STEP); acc -= STEP; n++; }
    if (n === 6) acc = 0;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(view.scale, 0, 0, view.scale, view.ox, view.oy);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
    cur.draw(ctx);
    if (I.showCursor()) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(I.mouse.x, I.mouse.y, 9, 0, U.TAU); ctx.moveTo(I.mouse.x - 14, I.mouse.y); ctx.lineTo(I.mouse.x + 14, I.mouse.y); ctx.moveTo(I.mouse.x, I.mouse.y - 14); ctx.lineTo(I.mouse.x, I.mouse.y + 14); ctx.stroke(); }
    ctx.restore();
    I.endFrame();
  }

  function start() { Main.setState("boot"); requestAnimationFrame(frame); }
  if (document.fonts && document.fonts.load) {
    Promise.race([
      Promise.all([document.fonts.load("900 40px Orbitron"), document.fonts.load("600 20px Rajdhani"), document.fonts.load("700 20px Rajdhani")]),
      new Promise((r) => setTimeout(r, 1500)),
    ]).then(start, start);
  } else start();
})(window.MG);
