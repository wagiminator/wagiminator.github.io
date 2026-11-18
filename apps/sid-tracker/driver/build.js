// Builds js/driver.js from driver.asm with 64tass: the player is assembled at two
// addresses, and the bytes that differ are the high bytes to move with the load address.
// Usage: node build.js /path/to/64tass
"use strict";
const fs = require("fs"), path = require("path"), cp = require("child_process");
const tass = process.argv[2] || "64tass";
const dir = __dirname, tmp = fs.mkdtempSync(path.join(require("os").tmpdir(), "drv"));
function build(base) {
  const out = path.join(tmp, base + ".bin"), lab = path.join(tmp, base + ".lab");
  cp.execFileSync(tass, ["-a", "-b", "-C", "-D", "BASE=" + base, "-o", out, "-l", lab, path.join(dir, "driver.asm")], { stdio: ["ignore", "ignore", "inherit"] });
  const labels = {};
  fs.readFileSync(lab, "utf8").split("\n").forEach(l => {
    const m = /^\s*([A-Za-z_][\w]*)\s*=\s*(\$[0-9a-fA-F]+|\d+)\s*$/.exec(l);
    if (m) labels[m[1]] = m[2][0] === "$" ? parseInt(m[2].slice(1), 16) : parseInt(m[2], 10);
  });
  return { bytes: fs.readFileSync(out), labels };
}
const a = build(0x1000), b = build(0x1100);
if (a.bytes.length !== b.bytes.length) throw new Error("size differs");
const relocs = [];
for (let i = 0; i < a.bytes.length; i++) {
  if (a.bytes[i] === b.bytes[i]) continue;
  if (b.bytes[i] - a.bytes[i] !== 1) throw new Error("odd difference at " + i);
  relocs.push(i);
}
const labels = {}, patches = [];
for (const [k, v] of Object.entries(a.labels)) {
  if (k === "BASE" || k === "SID" || k === "TAB") continue;
  const off = v - 0x1000;
  if (off < 0 || off > a.bytes.length) continue;
  const m = /^p_([a-z_]+?)_\d+$/.exec(k);
  if (m) {
    const op = a.bytes[off + 1] | (a.bytes[off + 2] << 8);
    if ((op & 0xff00) !== 0xff00) throw new Error("patch " + k + " has operand " + op.toString(16));
    patches.push([off + 1, m[1], op - 0xff00]);
  } else labels[k] = off;
}
const keep = ["keepsid", "init", "play", "jam", "startpos", "starttr", "skiprows", "initspd", "cialo", "ciahi", "autoplay", "olo", "ohi",
  "vars", "varsend", "vpos", "vrow", "looped", "speed", "tick", "songon", "ins", "base", "gate", "rows"];
const out = {};
keep.forEach(k => { if (!(k in labels)) throw new Error("no label " + k); });
for (const [k, v] of Object.entries(labels)) if (keep.includes(k) || (v >= labels.vars && v < labels.varsend)) out[k] = v;
const js = "/* C64 SID Tracker: the music player, assembled from driver/driver.asm (node driver/build.js) */\n" +
  "window.TrackerDriver = {\n" +
  "  code: \"" + a.bytes.toString("base64") + "\",\n" +
  "  relocs: " + JSON.stringify(relocs) + ",\n" +
  "  patches: " + JSON.stringify(patches) + ",\n" +
  "  labels: " + JSON.stringify(out) + "\n};\n";
fs.writeFileSync(path.join(dir, "..", "js", "driver.js"), js);
console.log("player", a.bytes.length, "bytes,", relocs.length, "relocations,", patches.length, "table operands");
