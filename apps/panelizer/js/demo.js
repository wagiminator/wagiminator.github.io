/* Gerber Panelizer: a small demo board as Gerber and Excellon text (40 × 25 mm, rounded corners),
 * so the panelizer can be tried without own files. Global: PANEL_DEMO */
(function (global) {
  "use strict";
  var W = 40, H = 25, R = 2.5;
  function c(v) { return String(Math.round(v * 1e6)); }
  function head(ff) { return ["%TF.FileFunction," + ff + "*%", "%FSLAX46Y46*%", "%MOMM*%", "%LPD*%", "G75*", "G01*"]; }
  function xy(x, y) { return "X" + c(x) + "Y" + c(y); }
  // pads of a SOIC-8, two 0805 parts, a pin header and a mounting hole
  var soic = [], i;
  for (i = 0; i < 4; i++) { soic.push([14 + i * 1.27, 9.2], [14 + i * 1.27, 15.8]); }
  var smd = [[27, 10], [28.9, 10], [27, 15], [28.9, 15]];
  var tht = [[6, 6], [6, 8.54], [6, 11.08], [6, 13.62]];
  function copper() {
    var L = head("Copper,L1,Top");
    L.push("%AMRRECT*21,1,$1,$2-$3x2,0,0,0*21,1,$1-$3x2,$2,0,0,0*1,1,$3x2,$1/2-$3,$2/2-$3*1,1,$3x2,-$1/2+$3,$2/2-$3*1,1,$3x2,$1/2-$3,-$2/2+$3*1,1,$3x2,-$1/2+$3,-$2/2+$3*%");
    L.push("%ADD10RRECTX0.6X1.6X0.15*%", "%ADD11R,1.0X1.3*%", "%ADD12C,1.7*%", "%ADD13R,1.7X1.7*%", "%ADD14C,0.3*%", "%ADD15C,0.5*%");
    L.push("D10*"); soic.forEach(function (p) { L.push(xy(p[0], p[1]) + "D03*"); });
    L.push("D11*"); smd.forEach(function (p) { L.push(xy(p[0], p[1]) + "D03*"); });
    L.push("D13*", xy(tht[0][0], tht[0][1]) + "D03*", "D12*"); tht.slice(1).forEach(function (p) { L.push(xy(p[0], p[1]) + "D03*"); });
    L.push("D14*", xy(6, 6) + "D02*", xy(10, 6) + "D01*", xy(14, 9.2) + "D01*");
    L.push(xy(6, 8.54) + "D02*", xy(11, 8.54) + "D01*", "G03*", xy(13.5, 11) + "I0J" + c(2.5) + "D01*", "G01*", xy(15.27, 11) + "D01*", xy(15.27, 9.2) + "D01*");
    L.push(xy(17.81, 15.8) + "D02*", xy(17.81, 18) + "D01*", xy(27, 18) + "D01*", xy(27, 15) + "D01*");
    L.push("D15*", xy(28.9, 10) + "D02*", xy(33, 10) + "D01*", xy(33, 15) + "D01*", xy(28.9, 15) + "D01*");
    // a copper area with a clearance
    L.push("G36*", xy(31, 2) + "D02*", xy(38, 2) + "D01*", xy(38, 7) + "D01*", xy(31, 7) + "D01*", xy(31, 2) + "D01*", "G37*");
    L.push("%LPC*%", "%ADD16C,1.6*%", "D16*", xy(34.5, 4.5) + "D03*", "%LPD*%");
    L.push("M02*");
    return L.join("\n");
  }
  function bottom() {
    var L = head("Copper,L2,Bot");
    L.push("%ADD10C,1.7*%", "%ADD11R,1.7X1.7*%", "%ADD12C,1.0*%");
    L.push("D11*", xy(6, 6) + "D03*", "D10*"); tht.slice(1).forEach(function (p) { L.push(xy(p[0], p[1]) + "D03*"); });
    L.push("D12*", xy(6, 13.62) + "D02*", xy(6, 20) + "D01*", xy(34, 20) + "D01*", "G02*", xy(36, 18) + "I0J" + c(-2) + "D01*", "G01*", xy(36, 4.5) + "D01*");
    L.push("M02*");
    return L.join("\n");
  }
  function mask(top) {
    var L = head("Soldermask," + (top ? "Top" : "Bot"));
    L.push("%ADD10R,0.7X1.7*%", "%ADD11R,1.1X1.4*%", "%ADD12C,1.8*%", "%ADD13R,1.8X1.8*%");
    if (top) { L.push("D10*"); soic.forEach(function (p) { L.push(xy(p[0], p[1]) + "D03*"); }); L.push("D11*"); smd.forEach(function (p) { L.push(xy(p[0], p[1]) + "D03*"); }); }
    L.push("D13*", xy(tht[0][0], tht[0][1]) + "D03*", "D12*"); tht.slice(1).forEach(function (p) { L.push(xy(p[0], p[1]) + "D03*"); });
    L.push("M02*");
    return L.join("\n");
  }
  function silk() {
    var L = head("Legend,Top");
    L.push("%ADD10C,0.15*%", "D10*");
    L.push(xy(13, 10.4) + "D02*", xy(19, 10.4) + "D01*", xy(19, 14.6) + "D01*", xy(13, 14.6) + "D01*", xy(13, 10.4) + "D01*");
    L.push(xy(13.4, 11.2) + "D02*", "G02*", xy(13.4, 11.2) + "I" + c(0.2) + "J0D01*", "G01*");
    L.push(xy(4.8, 4.8) + "D02*", xy(7.2, 4.8) + "D01*", xy(7.2, 14.9) + "D01*", xy(4.8, 14.9) + "D01*", xy(4.8, 4.8) + "D01*");
    // a small arrow and a frame for a label
    L.push(xy(24, 20.5) + "D02*", xy(38, 20.5) + "D01*", xy(38, 23) + "D01*", xy(24, 23) + "D01*", xy(24, 20.5) + "D01*");
    L.push(xy(26, 21.75) + "D02*", xy(36, 21.75) + "D01*", xy(34.8, 22.4) + "D02*", xy(36, 21.75) + "D01*", xy(34.8, 21.1) + "D01*");
    L.push("M02*");
    return L.join("\n");
  }
  function outline() {
    var L = head("Profile,NP");
    L.push("%ADD10C,0.1*%", "D10*", xy(R, 0) + "D02*", xy(W - R, 0) + "D01*", "G03*", xy(W, R) + "I0J" + c(R) + "D01*", "G01*", xy(W, H - R) + "D01*",
      "G03*", xy(W - R, H) + "I-" + c(R) + "J0D01*", "G01*", xy(R, H) + "D01*", "G03*", xy(0, H - R) + "I0J-" + c(R) + "D01*", "G01*", xy(0, R) + "D01*",
      "G03*", xy(R, 0) + "I" + c(R) + "J0D01*", "G01*");
    // a cut-out for a connector
    L.push(xy(W - 6, 11) + "D02*", xy(W - 3, 11) + "D01*", xy(W - 3, 14) + "D01*", xy(W - 6, 14) + "D01*", xy(W - 6, 11) + "D01*");
    L.push("M02*");
    return L.join("\n");
  }
  function drill(plated) {
    var L = ["M48", "METRIC,TZ", plated ? "T1C1.000" : "T1C3.200", "%", "G90", "G05", "T1"];
    if (plated) tht.forEach(function (p) { L.push("X" + p[0].toFixed(3) + "Y" + p[1].toFixed(3)); });
    else L.push("X3.500Y21.500");
    L.push("M30");
    return L.join("\n");
  }
  global.PANEL_DEMO = function () {
    return [
      { name: "demo-F_Cu.gbr", text: copper() }, { name: "demo-B_Cu.gbr", text: bottom() },
      { name: "demo-F_Mask.gbr", text: mask(true) }, { name: "demo-B_Mask.gbr", text: mask(false) },
      { name: "demo-F_Silkscreen.gbr", text: silk() }, { name: "demo-Edge_Cuts.gbr", text: outline() },
      { name: "demo-PTH.drl", text: drill(true) }, { name: "demo-NPTH.drl", text: drill(false) }
    ];
  };
})(window);
