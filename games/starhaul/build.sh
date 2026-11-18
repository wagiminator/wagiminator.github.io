#!/bin/sh
# Bundles the game modules in src/ (plus three.js from lib/) into one classic script, js/starhaul.js.
# A classic script also runs when index.html is opened directly from the disk (file://).
# Needs esbuild (https://esbuild.github.io), e.g.: npx esbuild ...
cd "$(dirname "$0")"
${ESBUILD:-npx esbuild} src/main.js --bundle --format=iife --minify --legal-comments=eof \
  --alias:three=./lib/three.module.min.js --loader:.wjs=text \
  --outfile=js/starhaul.js
