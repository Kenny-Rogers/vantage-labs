// Prerender every route in build/ to static HTML so non-JS crawlers
// (most AI crawlers, plus older Bing / DuckDuckGo / archive bots) get
// real content instead of an empty <div id="root">.
//
// Approach: spin up a tiny static server pointed at build/, drive
// headless Chrome around each route, capture the fully-rendered HTML,
// and write it back as build/<route>/index.html. React-helmet-async
// has already populated each page's <title> and <meta> by the time we
// snapshot. On the client, src/index.js detects a non-empty root and
// switches from createRoot to hydrateRoot.
//
// Runs as a `postbuild` step so every CRA build automatically gets
// prerendered output.

const fs = require('fs');
const path = require('path');
const http = require('http');
const handler = require('serve-handler');
const puppeteer = require('puppeteer');

// Order matters: `/` LAST.
//
// All non-root routes hit the SPA rewrite below and end up being served
// from build/index.html. If we prerender `/` first, every later route
// would inherit Home's <title>/<meta>/<link canonical> from the static
// HTML and end up with duplicates after Helmet adds its own. Saving `/`
// for last keeps build/index.html clean (CRA's untitled template) for
// the rest of the run.
const ROUTES = [
  '/frame-extractor',
  '/sharpness-scorer',
  '/color-segmentation',
  '/object-detection',
  '/traffic-analysis',
  '/aerial-mapper',
  '/',
];

const BUILD = path.resolve(__dirname, '..', 'build');
const PORT = 5500;

(async () => {
  if (!fs.existsSync(BUILD)) {
    console.error(`[prerender] no build directory at ${BUILD}; run npm run build first.`);
    process.exit(0);
  }

  const server = http.createServer((req, res) =>
    handler(req, res, {
      public: BUILD,
      // Mirror Cloudflare's SPA fallback so any 404 inside the
      // prerender server still serves index.html — keeps the puppeteer
      // navigation predictable.
      rewrites: [{ source: '**', destination: '/index.html' }],
    })
  );
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`[prerender] static server on :${PORT}`);

  // Cloudflare Pages' build container ships without GUI shared libs
  // (libatk, libnss, libgbm, …), so Puppeteer's bundled Chrome can't
  // launch there. Skip prerender on launch failure instead of killing
  // the deploy — the SPA still ships, just without crawler-friendly
  // pre-rendered HTML for this build. Local builds (where Chrome works)
  // continue to prerender normally.
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  } catch (err) {
    console.warn(
      `[prerender] skipping — Chrome launch failed (${err.message.split('\n')[0]}). ` +
        `Build will ship as SPA without prerendered HTML.`
    );
    server.close();
    return;
  }

  let ok = 0;
  let fail = 0;

  for (const route of ROUTES) {
    try {
      const page = await browser.newPage();
      // Block analytics and external font requests during prerender so
      // the snapshot doesn't capture beacon scripts mid-load.
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const url = req.url();
        if (
          url.includes('cloudflareinsights.com') ||
          url.includes('fonts.googleapis.com') ||
          url.includes('fonts.gstatic.com')
        ) {
          req.abort();
        } else {
          req.continue();
        }
      });

      await page.goto(`http://localhost:${PORT}${route}`, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      // Give React a tick to flush Helmet writes into <head>.
      await new Promise((r) => setTimeout(r, 200));

      const html = await page.content();

      const outDir = route === '/' ? BUILD : path.join(BUILD, route);
      const outFile = path.join(outDir, 'index.html');
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(outFile, html);
      console.log(`[prerender] ${route} → ${path.relative(BUILD, outFile)} (${html.length} bytes)`);
      ok++;
      await page.close();
    } catch (err) {
      console.error(`[prerender] FAILED ${route}: ${err.message}`);
      fail++;
    }
  }

  await browser.close();
  server.close();

  console.log(`[prerender] done — ${ok} ok, ${fail} failed (of ${ROUTES.length})`);
  // Don't exit non-zero on partial failure — keep the deploy alive.
  // The unprerendered routes still ship as the regular CRA SPA.
})().catch((err) => {
  console.error('[prerender] fatal:', err);
  process.exit(1);
});
