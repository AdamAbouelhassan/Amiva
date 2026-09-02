/**
 * `tsc` type-checks JSON imports (resolveJsonModule) but never emits the
 * .json files into `outDir`. `googlePlaceTaxonomy.ts` `require()`s two data
 * files at runtime, so the build has to copy `src/data/` → `dist/data/`
 * itself or every consumer of the compiled package (the mobile app via
 * Metro, most importantly) resolves an undefined module and crashes at
 * load ("Cannot convert undefined value to object").
 */
const { cpSync, existsSync } = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'src', 'data');
const dest = path.join(__dirname, '..', 'dist', 'data');

if (!existsSync(src)) {
  console.error(`copyData: ${src} does not exist`);
  process.exit(1);
}

cpSync(src, dest, { recursive: true });
console.log(`copyData: ${src} -> ${dest}`);
