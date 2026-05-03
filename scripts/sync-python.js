// Copies the canonical python/ folder into public/python/ so its .py
// files are served as static assets and Pyodide can fetch them at
// runtime. Wired into package.json as prestart + prebuild — runs before
// `npm start` and `npm run build`, including in CI.
//
// We sync only directories and .py files: README.md / .gitkeep don't
// need to ship to the browser.

const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', 'python');
const DEST = path.resolve(__dirname, '..', 'public', 'python');

if (!fs.existsSync(SRC)) {
  console.warn(`[sync-python] no python/ directory at ${SRC}; skipping.`);
  process.exit(0);
}

if (fs.existsSync(DEST)) fs.rmSync(DEST, { recursive: true, force: true });

fs.cpSync(SRC, DEST, {
  recursive: true,
  filter: (src) => {
    const base = path.basename(src);
    if (base === '__pycache__' || base.endsWith('.pyc')) return false;
    return fs.statSync(src).isDirectory() || src.endsWith('.py');
  },
});

console.log(`[sync-python] ${path.relative(process.cwd(), SRC)} → ${path.relative(process.cwd(), DEST)}`);
