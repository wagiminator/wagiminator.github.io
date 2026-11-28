#!/usr/bin/env python3
"""Search engine and link preview data for wagiminator.github.io.

Run from the repository root after adding or renaming an app or game:

    python3 _tools/seo.py

For every page (start page, apps/*, games/*) it writes a block between
<!-- seo --> and <!-- /seo --> into <head>: canonical URL, Open Graph and
Twitter card tags (title, description, preview image) and structured data
(JSON-LD: WebApplication, VideoGame or WebSite, with breadcrumbs). Title and
description are taken from the page's own <title> and description meta tag;
the name is the part of the title before " – ". It also writes sitemap.xml
with the date of the last commit that changed each page's folder.

Preview images (1200x630) are expected in assets/share/; make them with
_tools/share-images.js. Folders starting with "_" are not published by
GitHub Pages, so this folder stays private.
"""
import html
import json
import os
import re
import subprocess

SITE = "https://wagiminator.github.io/"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUTHOR = {"@type": "Person", "name": "wagiminator", "url": "https://github.com/wagiminator"}
SKIP = {"_template", "mt3608-sepic"}     # template, redirect page

# applicationCategory of the apps (schema.org); default DeveloperApplication
CATEGORY = {
    "c64-emulator": "GameApplication", "sid-player": "MultimediaApplication", "sid-tracker": "MultimediaApplication",
    "pixel-studio": "DesignApplication", "display-converter": "DesignApplication", "gerber-viewer": "DesignApplication",
    "panelizer": "DesignApplication", "stencil": "DesignApplication",
    "c64-packer": "UtilitiesApplication", "d64-viewer": "UtilitiesApplication", "d64-editor": "UtilitiesApplication",
    "d64-transfer": "UtilitiesApplication", "tap-transfer": "UtilitiesApplication", "cart-builder": "UtilitiesApplication",
    "interactive-bom": "UtilitiesApplication", "calculators": "UtilitiesApplication", "oscilloscope": "UtilitiesApplication",
    "signal-analyzer": "UtilitiesApplication", "power-analyzer": "UtilitiesApplication", "power-profiler": "UtilitiesApplication",
}
GENRE = {
    "alien-armada": "Shoot 'em up", "bubble-puff": "Platformer", "deep-diner": "Arcade", "dreamhop": "Platformer",
    "feather-frenzy": "Shooting gallery", "garden-siege": "Tower defense", "ironfall": "Run and gun", "mole-mayhem": "Artillery",
    "modern-general": "Turn-based strategy", "mossling-march": "Puzzle", "pearl-panic": "Puzzle", "primordia": "Shoot 'em up", "starhaul": "Space trading and combat",
    "starlane-command": "Real-time strategy", "sunset-highway": "Racing", "woolly-wallop": "Physics puzzle", "x-abyss": "Shoot 'em up",
}


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def last_change(rel):
    out = subprocess.run(["git", "log", "-1", "--format=%cs", "--", rel], cwd=ROOT, capture_output=True, text=True).stdout.strip()
    return out or None


def meta(text, name):
    m = re.search(r'<meta name="%s" content="([^"]*)"' % name, text)
    return html.unescape(m.group(1)) if m else ""


def uses_hardware(folder):
    code = ""
    for dirpath, _, files in os.walk(folder):
        for fn in files:
            if fn.endswith(".js"):
                code += read(os.path.join(dirpath, fn))
    return bool(re.search(r"navigator\.(usb|serial|hid)\b", code))


def block(page):
    a = lambda s: html.escape(s, quote=True)
    lines = [
        "  <!-- seo: written by _tools/seo.py -->",
        f'  <link rel="canonical" href="{page["url"]}">',
        f'  <meta property="og:type" content="website">',
        f'  <meta property="og:site_name" content="wagiminator">',
        f'  <meta property="og:title" content="{a(page["og_title"])}">',
        f'  <meta property="og:description" content="{a(page["description"])}">',
        f'  <meta property="og:url" content="{page["url"]}">',
    ]
    if page.get("image"):
        lines += [
            f'  <meta property="og:image" content="{page["image"]}">',
            '  <meta property="og:image:width" content="1200">',
            '  <meta property="og:image:height" content="630">',
            f'  <meta property="og:image:alt" content="{a(page["image_alt"])}">',
            '  <meta name="twitter:card" content="summary_large_image">',
        ]
    for data in page["ld"]:
        lines.append('  <script type="application/ld+json">' + json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/") + "</script>")
    lines.append("  <!-- /seo -->")
    return "\n".join(lines)


def write_block(path, page):
    text = read(path)
    text = re.sub(r"\n  <!-- seo: .*?<!-- /seo -->", "", text, flags=re.S)
    m = re.search(r'\n  <meta name="description" content="[^"]*">', text)
    if not m:
        raise SystemExit(f"{path}: no description meta tag")
    text = text[: m.end()] + "\n" + block(page) + text[m.end():]
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)


def image(rel):
    return SITE + rel if os.path.exists(os.path.join(ROOT, rel)) else None


def main():
    pages = []
    free = {"@type": "Offer", "price": "0", "priceCurrency": "EUR"}

    # Start page
    path = os.path.join(ROOT, "index.html")
    text = read(path)
    title = html.unescape(re.search(r"<title>(.*?)</title>", text).group(1))
    desc = meta(text, "description")
    home = {
        "path": path, "url": SITE, "og_title": title, "description": desc,
        "image": image("assets/share/home.jpg"), "image_alt": "Start page of wagiminator.github.io",
        "lastmod": last_change("index.html"), "priority": "1.0",
        "ld": [{
            "@context": "https://schema.org", "@type": "WebSite", "name": "wagiminator", "url": SITE, "description": desc,
            "inLanguage": "en", "author": dict(AUTHOR, sameAs=[
                "https://github.com/wagiminator", "https://hackaday.io/projects/hacker/769247",
                "https://www.youtube.com/channel/UCXu_GP5cqQrj-q8A8ie5CIA", "https://oshwlab.com/wagiminator"]),
        }],
    }
    pages.append(home)

    for kind in ("apps", "games"):
        for name in sorted(os.listdir(os.path.join(ROOT, kind))):
            folder = os.path.join(ROOT, kind, name)
            path = os.path.join(folder, "index.html")
            if name in SKIP or name.startswith("_") or not os.path.isfile(path):
                continue
            text = read(path)
            title = html.unescape(re.search(r"<title>(.*?)</title>", text).group(1))
            short = title.split(" – ")[0]
            desc = meta(text, "description")
            url = f"{SITE}{kind}/{name}/"
            img = image(f"assets/share/{kind}/{name}.jpg")
            crumbs = {
                "@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "wagiminator", "item": SITE},
                    {"@type": "ListItem", "position": 2, "name": "Apps" if kind == "apps" else "Games", "item": SITE + ("#apps" if kind == "apps" else "#games")},
                    {"@type": "ListItem", "position": 3, "name": short, "item": url},
                ]}
            if kind == "apps":
                hw = uses_hardware(folder)
                ld = {
                    "@context": "https://schema.org", "@type": "WebApplication", "name": short, "url": url, "description": desc,
                    "applicationCategory": CATEGORY.get(name, "DeveloperApplication"), "operatingSystem": "Windows, macOS, Linux, ChromeOS",
                    "browserRequirements": "Requires Chrome, Edge or Opera on a desktop computer (WebUSB / Web Serial)" if hw else "Requires JavaScript; runs in any current browser",
                    "isAccessibleForFree": True, "offers": free, "author": AUTHOR, "inLanguage": "en",
                }
            else:
                ld = {
                    "@context": "https://schema.org", "@type": "VideoGame", "name": short, "url": url, "description": desc,
                    "genre": GENRE.get(name, "Arcade"), "gamePlatform": "Web browser", "playMode": "SinglePlayer",
                    "applicationCategory": "Game", "operatingSystem": "Any", "isAccessibleForFree": True, "offers": free,
                    "author": AUTHOR, "inLanguage": "en",
                }
            if img:
                ld["image"] = img
            pages.append({
                "path": path, "url": url, "og_title": title, "description": desc, "image": img,
                "image_alt": f"Screenshot of {short}", "lastmod": last_change(f"{kind}/{name}"),
                "priority": "0.8", "ld": [ld, crumbs],
            })

    for p in pages:
        write_block(p["path"], p)

    # Sitemap
    out = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for p in pages:
        out.append("  <url>")
        out.append(f"    <loc>{p['url']}</loc>")
        if p["lastmod"]:
            out.append(f"    <lastmod>{p['lastmod']}</lastmod>")
        out.append(f"    <priority>{p['priority']}</priority>")
        out.append("  </url>")
    out.append("</urlset>")
    with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write("\n".join(out) + "\n")
    print(f"{len(pages)} pages, {sum(1 for p in pages if p['image'])} with preview image; sitemap.xml written.")


if __name__ == "__main__":
    main()
