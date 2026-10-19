/**
 * Browser tests (Playwright) for Chromium, Firefox and WebKit: npm run
 * test:browser. The node --test unit tests never load this file, so
 * `npm run check` still needs nothing installed.
 *
 * Paths here resolve from this file's folder (test/browser/). The server is
 * started from the repository root, so fixtures load /dist/... and the
 * styleguide at /styleguide/index.html. It listens on DS_TEST_PORT (default
 * 4173) and is never reused: a server already on that port may belong to
 * another checkout (a worktree, a second run) or stop mid-run, so a busy
 * port fails the run at once instead of testing someone else's files.
 *
 * Screenshots: the committed set in __screenshots__/ comes from the official
 * Playwright container of the pinned version (see README.md). DS_SHOTS=local
 * switches screenshots (toHaveScreenshot) to the gitignored
 * __screenshots-local__/ for machines whose fonts and rasteriser differ from
 * that container. Text snapshots (toMatchSnapshot: the JSON timelines) do not
 * depend on the rasteriser and always use the committed folder.
 */
import { defineConfig } from '@playwright/test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const PORT = Number(process.env.DS_TEST_PORT || 4173);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const SHOTS = process.env.DS_SHOTS === 'local' ? '__screenshots-local__' : '__screenshots__';

export default defineConfig({
  testDir: HERE,
  testMatch: '*.spec.js',
  outputDir: resolve(ROOT, 'test-results'),
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{testFilePath}/{arg}{ext}',
  forbidOnly: !!process.env.CI,
  // A flaky motion test is a bug in the test or in the motion: never retry.
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never', outputFolder: resolve(ROOT, 'playwright-report') }]] : 'list',
  expect: {
    // 'disabled' only suits settled shots; mid-animation shots pass
    // animations: 'allow' after freeze()/seek() (helpers/motion.js).
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.002,
      animations: 'disabled',
      caret: 'hide',
      pathTemplate: `{testDir}/${SHOTS}/{projectName}/{testFilePath}/{arg}{ext}`,
    },
  },
  use: {
    baseURL: ORIGIN,
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    locale: 'en-US',
    timezoneId: 'UTC',
    colorScheme: 'light',
    reducedMotion: 'no-preference',
  },
  // The shared `use` above applies to every engine: no device presets, so
  // viewport, scale and user agent stay the same across projects. The
  // `fallback` project (progressive features stripped) arrives in P2.
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
  webServer: {
    command: `node test/browser/serve.js ${PORT}`,
    cwd: ROOT,
    url: `${ORIGIN}/styleguide/index.html`,
    reuseExistingServer: false,
  },
});
