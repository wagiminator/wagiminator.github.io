/* Mole Mayhem: the moles (round, velvety, pink-nosed, with a helmet in their team colour),
   the weapons in their paws, gravestones, crates, barrels and mines – all drawn by code */
"use strict";

(function (MM) {
  const { U, D } = MM;
  const S = (MM.Sprites = {});
  const INK = "#1b1410";

  // mole at (x, y) = point between its feet, facing dir; opt: team, pose, t, aim, weapon
  S.mole = function (c, x, y, dir, opt) {
    const t = opt.t || 0, pose = opt.pose || "stand", team = opt.team || 0;
    const col = D.TEAM[team], dark = D.TEAM_D[team];
    c.save(); c.translate(x, y); c.scale(dir, 1);
    let bob = 0, footA = 0, footB = 0, armUp = 0;
    if (pose === "walk") { bob = Math.abs(Math.sin(t * 14)) * -1.5; footA = Math.sin(t * 14) * 3; footB = -footA; }
    else if (pose === "stand") bob = Math.sin(t * 2.5) * 0.6;
    else if (pose === "air") { armUp = 1; }
    else if (pose === "rope") { armUp = 1; }
    // feet
    for (const [fx, fy] of [[-5 + footA, 0], [3 + footB, 0]]) D.ellipse(c, fx, fy - 2, 4, 2.4, "#e98fa0", INK, 1.6);
    // tail
    D.line(c, -9, -6 + bob, -13, -4 + bob, "#5a4038", 3);
    // body
    c.translate(0, bob);
    D.ellipse(c, 0, -11, 10, 11, "#7a5b50", INK, 2.4);
    c.save(); c.beginPath(); c.ellipse(0, -11, 10, 11, 0, 0, U.TAU); c.clip();
    D.ellipse(c, -6, -7, 7, 10, "#5f443c", null);
    D.ellipse(c, 3, -6, 6, 6, "#b08a78", null);
    c.restore();
    D.ellipse(c, 0, -11, 10, 11, null, INK, 2.4);
    // snout and nose
    D.ellipse(c, 9, -11, 5, 3.6, "#9a7668", INK, 1.8);
    D.circle(c, 13.5, -11.5, 2.6, "#f27a94", INK, 1.6);
    // eye (small, a little sleepy – they live underground)
    if (opt.dead) { D.line(c, 3, -16, 7, -13, INK, 1.8); D.line(c, 3, -13, 7, -16, INK, 1.8); }
    else {
      D.ellipse(c, 5, -15, 2.6, 2.4, "#fff", INK, 1.4);
      D.circle(c, 6 + (opt.look || 0), -14.8, 1.3, INK, null);
      if (opt.hurt) D.line(c, 2.5, -18, 7.5, -17, INK, 1.6);
    }
    // whiskers
    c.lineWidth = 1; c.strokeStyle = "rgba(30,20,16,0.7)";
    c.beginPath(); c.moveTo(11, -9); c.lineTo(16, -8); c.moveTo(11, -10); c.lineTo(16.5, -10.5); c.stroke();
    // helmet in team colour
    c.beginPath(); c.moveTo(-10, -15); c.quadraticCurveTo(-9, -25, 0, -25.5); c.quadraticCurveTo(9, -25, 10.5, -16); c.closePath();
    c.fillStyle = col; c.fill(); c.lineWidth = 2.2; c.strokeStyle = INK; c.stroke();
    D.rr(c, -11, -17, 23, 3.5, 1.5, dark, INK, 1.6);
    c.fillStyle = "rgba(255,255,255,0.35)"; c.beginPath(); c.ellipse(-3, -22, 4, 1.6, -0.3, 0, U.TAU); c.fill();
    // paws and weapon
    if (opt.weapon && pose !== "air" && pose !== "rope") {
      c.save(); c.translate(3, -9); c.rotate(opt.aim || 0);
      S.weapon(c, opt.weapon, t, opt.charge || 0);
      c.restore();
      D.circle(c, 6, -8, 2.6, "#e98fa0", INK, 1.4);
    } else if (armUp) {
      D.line(c, -6, -14, -9, -24, INK, 3.2); D.line(c, 6, -14, 9, -24, INK, 3.2);
      D.circle(c, -9, -25, 2.6, "#e98fa0", INK, 1.4); D.circle(c, 9, -25, 2.6, "#e98fa0", INK, 1.4);
    } else {
      D.circle(c, 7, -7, 2.6, "#e98fa0", INK, 1.4); D.circle(c, -6, -6, 2.6, "#e98fa0", INK, 1.4);
    }
    c.restore();
  };

  // the weapon held in the paws, pointing along +x
  S.weapon = function (c, w, t, charge) {
    switch (w) {
      case "bazooka": case "homing":
        D.rr(c, -10, -4, 28, 8, 3, w === "homing" ? "#5a7aa8" : "#5d7a3a", INK, 2);
        D.rr(c, 16, -5, 4, 10, 1, "#3a3a3a", INK, 1.5);
        D.rr(c, -2, 3, 4, 6, 1, "#3a3a3a", INK, 1.5);
        break;
      case "grenade": case "cluster": case "dynamite":
        if (w === "dynamite") { D.rr(c, 4, -6, 6, 13, 2, "#d8352a", INK, 2); D.line(c, 7, -6, 9, -10, "#c8a070", 2); }
        else D.circle(c, 8, 0, 5.5, w === "cluster" ? "#7a6aa8" : "#4f6a3a", INK, 2);
        break;
      case "shotgun":
        D.rr(c, -6, -2.5, 26, 5, 2, "#6a6a72", INK, 2); D.rr(c, -10, -1, 8, 7, 2, "#7a4a2a", INK, 2);
        break;
      case "bat":
        c.save(); c.rotate(-0.6 + charge); D.rr(c, 0, -3, 26, 6, 3, "#c8955a", INK, 2); c.restore();
        break;
      case "mine": D.ellipse(c, 8, 2, 7, 3.5, "#3a3a40", INK, 2); D.circle(c, 8, -1.5, 1.6, "#ff3a2a", null); break;
      case "airstrike": case "teleport": case "girder":
        D.rr(c, 0, -6, 10, 12, 2, w === "teleport" ? "#7ad0ff" : w === "girder" ? "#c84a3a" : "#3a3a40", INK, 2);
        D.line(c, 5, -6, 5, -12, INK, 2); D.circle(c, 5, -13, 2, "#ff4a3a", null);
        break;
      case "drill": D.rr(c, 0, -4, 16, 8, 2, "#c8a83a", INK, 2); c.beginPath(); c.moveTo(16, -4); c.lineTo(24, 0); c.lineTo(16, 4); c.closePath(); c.fillStyle = "#9aa0aa"; c.fill(); c.stroke(); break;
      case "torch": D.rr(c, 0, -3, 16, 6, 2, "#e0a030", INK, 2); D.rr(c, 16, -2, 5, 4, 1, "#555", INK, 1.5); break;
      case "rope": D.circle(c, 6, 0, 6, "#c8a070", INK, 2); D.circle(c, 6, 0, 3, null, INK, 1.4); break;
      case "jetpack": break;
      default: break;
    }
  };

  S.grave = function (c, x, y, team) {
    c.save(); c.translate(x, y);
    c.beginPath(); c.moveTo(-9, 0); c.lineTo(-9, -16); c.quadraticCurveTo(-9, -24, 0, -24); c.quadraticCurveTo(9, -24, 9, -16); c.lineTo(9, 0); c.closePath();
    c.fillStyle = "#a8a8b0"; c.fill(); c.lineWidth = 2.4; c.strokeStyle = INK; c.stroke();
    D.line(c, 0, -20, 0, -8, D.TEAM[team], 2.5); D.line(c, -4, -16, 4, -16, D.TEAM[team], 2.5);
    c.restore();
  };
  S.barrel = function (c, x, y, hot) {
    c.save(); c.translate(x, y);
    D.rr(c, -9, -24, 18, 24, 4, hot ? "#ff6a2a" : "#3a7a3a", INK, 2.4);
    D.line(c, -9, -17, 9, -17, INK, 2); D.line(c, -9, -7, 9, -7, INK, 2);
    c.fillStyle = "#ffd23a"; c.beginPath(); c.moveTo(0, -15); c.lineTo(4, -9); c.lineTo(-4, -9); c.closePath(); c.fill();
    c.restore();
  };
  S.mine = function (c, x, y, t, armed, lit) {
    c.save(); c.translate(x, y);
    D.ellipse(c, 0, -3, 8, 4, "#3a3a42", INK, 2);
    D.circle(c, 0, -6, 2, lit && Math.sin(t * 20) > 0 ? "#ff3a2a" : armed ? "#c02a20" : "#3a5a3a", INK, 1.2);
    c.restore();
  };
  S.crate = function (c, x, y, kind, falling, t) {
    c.save(); c.translate(x, y);
    if (falling) {
      // parachute
      c.beginPath(); c.arc(0, -38, 20, Math.PI, 0); c.fillStyle = kind === "health" ? "#ffffff" : "#ffcf3a"; c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
      c.fillStyle = kind === "health" ? "#e8473a" : "#e8473a"; c.fillRect(-4, -57, 8, 18);
      D.line(c, -20, -38, -9, -16, INK, 1.2); D.line(c, 20, -38, 9, -16, INK, 1.2); D.line(c, 0, -38, 0, -16, INK, 1.2);
    }
    if (kind === "health") {
      D.rr(c, -11, -18, 22, 18, 3, "#f4f4f0", INK, 2.4);
      c.fillStyle = "#e8473a"; c.fillRect(-2.5, -15, 5, 12); c.fillRect(-6, -11.5, 12, 5);
    } else {
      D.rr(c, -11, -18, 22, 18, 3, "#c8955a", INK, 2.4);
      D.line(c, -11, -18, 11, 0, "#8a5a2e", 2); D.line(c, 11, -18, -11, 0, "#8a5a2e", 2);
      D.text(c, "?", 0, -9, 13, "#ffd13a", "center", { lw: 3, weight: 900 });
    }
    c.restore();
  };
})(window.MM);
