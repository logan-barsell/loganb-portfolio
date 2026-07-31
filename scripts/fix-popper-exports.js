/**
 * Webpack (CRA dev) fails to re-export a default import as a named export from
 * @popperjs/core/lib/createPopper.js ("detectOverflow was not found").
 * Rewrite to `export { default as detectOverflow } from ...` after install.
 */
const fs = require('fs');
const path = require('path');

const target = path.join(
  __dirname,
  '..',
  'node_modules',
  '@popperjs',
  'core',
  'lib',
  'createPopper.js'
);

if (!fs.existsSync(target)) {
  process.exit(0);
}

let text = fs.readFileSync(target, 'utf8');
const alreadyPatched = text.includes(
  'export { default as detectOverflow } from "./utils/detectOverflow.js"'
);
if (alreadyPatched) {
  process.exit(0);
}

const next = text
  .replace('import detectOverflow from "./utils/detectOverflow.js";\n', '')
  .replace(
    'export { detectOverflow };',
    'export { default as detectOverflow } from "./utils/detectOverflow.js";'
  );

if (next === text) {
  console.warn('[fix-popper-exports] Unexpected @popperjs/core createPopper.js shape; skipped.');
  process.exit(0);
}

fs.writeFileSync(target, next);
console.log('[fix-popper-exports] Patched @popperjs/core detectOverflow export for CRA webpack.');
