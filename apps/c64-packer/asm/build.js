// Builds js/sfx.js from sfx.asm with 64tass: the self-extracting start for both formats.
// Usage: node build.js /path/to/64tass
"use strict";
const fs = require("fs"), path = require("path"), cp = require("child_process"), os = require("os");
const tass = process.argv[2] || "64tass", tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sfx"));
const out = {};
for (const [name, fmt] of [["tscrunch", 0], ["exomizer", 1]]) {
  const bin = path.join(tmp, name + ".prg"), lab = path.join(tmp, name + ".lab");
  cp.execFileSync(tass, ["-a", "-C", "-D", "FORMAT=" + fmt, "-o", bin, "-l", lab, path.join(__dirname, "sfx.asm")], { stdio: ["ignore", "ignore", "inherit"] });
  const L = {};
  fs.readFileSync(lab, "utf8").split("\n").forEach(l => {
    const m = /^\s*([A-Za-z_]\w*)\s*=\s*(\$[0-9a-fA-F]+|\d+)\s*$/.exec(l);
    if (m) L[m[1]] = m[2][0] === "$" ? parseInt(m[2].slice(1), 16) : parseInt(m[2], 10);
  });
  const bytes = fs.readFileSync(bin);           // with the load address $0801
  const imgOff = L.image - 0x0801 + 2;
  const off = a => (a >= L.TOP ? imgOff + a - L.TOP : a - 0x0801 + 2);
  const fields = {};
  for (const k of Object.keys(L)) if (k.startsWith("p_")) fields[k.slice(2)] = off(L[k]);
  if (L.iend - L.TOP > 0x300) throw new Error(name + ": the unpacker is too long");
  out[name] = { code: bytes.toString("base64"), top: L.TOP, image: L.image, imageEnd: L.imgend, iend: L.iend, fields };
  console.log(name, bytes.length - 2, "bytes, unpacker", L.iend - L.TOP, "bytes at $" + L.TOP.toString(16));
}
// the tape turbo loader: in the tape header ($0351-$03FB); the file is the CHRIN vector
{
  const bin = path.join(tmp, "turbo.bin"), lab = path.join(tmp, "turbo.lab");
  cp.execFileSync(tass, ["-a", "-C", "-b", "-o", bin, "-l", lab, path.join(__dirname, "turbo.asm")], { stdio: ["ignore", "ignore", "inherit"] });
  const L = {};
  fs.readFileSync(lab, "utf8").split("\n").forEach(l => {
    const m = /^\s*([A-Za-z_]\w*)\s*=\s*(\$[0-9a-fA-F]+|\d+)\s*$/.exec(l);
    if (m) L[m[1]] = m[2][0] === "$" ? parseInt(m[2].slice(1), 16) : parseInt(m[2], 10);
  });
  const b = fs.readFileSync(bin);                // flat from $0110
  const at = a => a - 0x0110;
  const header = b.subarray(at(0x0351), at(L.hdrend)), file = b.subarray(at(0x0324), at(0x0326));
  const stage2 = b.subarray(at(0x0110), at(L.stage2end));
  const hb = Buffer.alloc(171); header.copy(hb, 0, 0, Math.min(171, header.length));
  out.turbo = { header: hb.toString("base64"), file: Buffer.from(file).toString("base64"), fileStart: 0x0324,
    stage2: Buffer.from(stage2).toString("base64"), stage2Start: 0x0110,
    fields: { mode: L.p_mode - 0x0110, start: L.p_start - 0x0110 } };
  console.log("turbo loader", L.hdrend - 0x0351, "bytes in the header,", L.stage2end - 0x0110, "in the second part");
}
fs.writeFileSync(path.join(__dirname, "..", "js", "sfx.js"),
  "/* C64 Packer: the self-extracting start and the tape loader, assembled from asm/sfx.asm and asm/turbo.asm (node asm/build.js) */\nwindow.PackerSFX = " + JSON.stringify(out, null, 1) + ";\n");
