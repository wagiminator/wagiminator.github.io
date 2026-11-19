// Preview images (1200x630 JPEG) for link previews and search results.
// Serve the repository root first (python3 -m http.server 8123), then:
//   NODE_PATH=$(npm root -g) node _tools/share-images.js [name ...]
// Without names every app and game is shot; afterwards run _tools/seo.py.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const BASE = process.env.BASE || "http://localhost:8123/";
const SKIP = new Set(["_template", "mt3608-sepic"]);

(async () => {
  const only = process.argv.slice(2);
  const jobs = [["home", "", "assets/share/home.jpg"]];
  for (const kind of ["apps", "games"]) {
    for (const name of fs.readdirSync(path.join(ROOT, kind)).sort()) {
      if (SKIP.has(name) || name.startsWith("_") || !fs.existsSync(path.join(ROOT, kind, name, "index.html"))) continue;
      jobs.push([name, `${kind}/${name}/`, `assets/share/${kind}/${name}.jpg`]);
    }
  }
  const browser = await chromium.launch();
  // Apps at 960x504 CSS pixels and scale 1.25 (larger text), games at 1200x630
  const appPage = await browser.newPage({ viewport: { width: 960, height: 504 }, deviceScaleFactor: 1.25 });
  const gamePage = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  for (const [name, url, out] of jobs) {
    if (only.length && !only.includes(name)) continue;
    const page = url.startsWith("games/") ? gamePage : appPage;
    fs.mkdirSync(path.join(ROOT, path.dirname(out)), { recursive: true });
    await page.goto(BASE + url, { waitUntil: "load" });
    await page.waitForTimeout(url.startsWith("games/") ? 2500 : 600);
    await page.screenshot({ path: path.join(ROOT, out), type: "jpeg", quality: 80 });
    console.log(out, fs.statSync(path.join(ROOT, out)).size);
  }
  await browser.close();
})();
