/* C64 Pixel Studio: start, tabs, project bar and keyboard */
(function () {
  "use strict";

  var PS = window.PS, $ = PS.$;
  var MODE_KEY = "c64ps.mode";

  PS.setMode = function (m) {
    if (!PS.modes[m]) return;
    var old = PS.modes[PS.mode];
    if (old && old.leave && PS.mode !== m) old.leave();
    PS.mode = m;
    document.querySelectorAll("[data-mode]").forEach(function (b) {
      var on = b.getAttribute("data-mode") === m;
      b.setAttribute("aria-selected", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
    });
    document.querySelectorAll(".mode").forEach(function (s) { s.hidden = s.id !== "mode-" + m; });
    try { localStorage.setItem(MODE_KEY, m); } catch (e) { /* ignore */ }
    PS.refresh(true);
  };
  document.querySelector(".modes").addEventListener("click", function (e) {
    var b = e.target.closest("[data-mode]"); if (b) PS.setMode(b.getAttribute("data-mode"));
  });
  document.querySelector(".modes").addEventListener("keydown", function (e) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    var tabs = Array.prototype.slice.call(document.querySelectorAll("[data-mode]")), i = tabs.findIndex(function (t) { return t.getAttribute("data-mode") === PS.mode; });
    var n = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
    PS.setMode(n.getAttribute("data-mode")); n.focus();
  });

  // ---------------------------------------------------------------- project bar
  PS.refreshBar = function () { if (document.activeElement !== $("proj-name")) $("proj-name").value = PS.p.name || ""; };
  PS.nameField($("proj-name"), "Project name", function (v) { PS.p.name = v; });
  $("btn-new").addEventListener("click", function () {
    PS.checkpoint("New project");
    PS.p = PS.M.newProject();
    PS.sel = { sprite: 0, object: 0, frame: 0, layer: 0, char: 1, tile: 0, mapTile: 0 };
    PS.refreshBar(); PS.changed();
    PS.say("New project. Undo brings the old one back.");
  });
  PS.updateUndo = function () {
    var u = PS.hist.undos[PS.hist.undos.length - 1], r = PS.hist.redos[PS.hist.redos.length - 1];
    $("btn-undo").disabled = !u; $("btn-redo").disabled = !r;
    $("btn-undo").title = u ? "Undo " + u.label + " (Ctrl+Z)" : "Undo (Ctrl+Z)";
    $("btn-redo").title = r ? "Redo " + r.label + " (Ctrl+Y)" : "Redo (Ctrl+Y)";
  };
  function undo() { if (PS.hist.undo() !== null) { PS.refreshBar(); PS.changed(); } }
  function redo() { if (PS.hist.redo() !== null) { PS.refreshBar(); PS.changed(); } }
  $("btn-undo").addEventListener("click", undo);
  $("btn-redo").addEventListener("click", redo);

  // ---------------------------------------------------------------- keyboard
  document.addEventListener("keydown", function (e) {
    var t = e.target, typing = t && (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA" || t.isContentEditable);
    if (document.querySelector("dialog[open]")) return;
    var k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
    if (mod && k === "s") { e.preventDefault(); PS.saveProject(); return; }
    if (typing) return;
    if (mod && (k === "z" || k === "y")) { e.preventDefault(); if (k === "y" || e.shiftKey) redo(); else undo(); return; }
    if (mod && (k === "c" || k === "v")) {
      if (window.getSelection && String(window.getSelection())) return;
      var m0 = PS.modes[PS.mode];
      if (m0 && m0.key && m0.key(k === "c" ? "copy" : "paste")) e.preventDefault();
      return;
    }
    if (mod || e.altKey) return;
    if (PS.TOOL_KEYS[k]) { PS.setTool(PS.TOOL_KEYS[k]); return; }
    var m = PS.modes[PS.mode];
    if (m && m.key && m.key(e.key === "X" ? "x" : e.key)) e.preventDefault();
  });

  // ---------------------------------------------------------------- start
  var restored = PS.restore();
  PS.clampSel();
  PS.refreshBar();
  PS.setTool("pen");
  var mode = "sprites";
  try { mode = localStorage.getItem(MODE_KEY) || "sprites"; } catch (e) { /* ignore */ }
  PS.setMode(PS.modes[mode] ? mode : "sprites");
  PS.updateUndo();
  if (restored) PS.say("Your last project is back.");
})();
