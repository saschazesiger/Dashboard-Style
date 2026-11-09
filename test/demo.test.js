/**
 * The live tour (demo/) loads a project bundle, as plans/3.0.md asks of the
 * published pages: demo/ds/ is written by tools/bundle.mjs from
 * demo/ds.config.json and committed. These tests fail a stale bundle (the
 * tour names a component the bundle lacks, or dist/ changed under it) and a
 * page that links the whole of ds.css or ds.js again.
 *
 * npm run build rewrites the bundle from the dist/ it just built (and
 * --check compares it); commit it with the change. By hand:
 *
 *   node dist/tools/bundle.mjs --config demo/ds.config.json
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(ROOT, path), 'utf8');

describe('the live tour', () => {
  it('holds a bundle that matches the tour and this dist/ (tools/bundle.mjs --check)', () => {
    const run = spawnSync(process.execPath, [join(ROOT, 'dist/tools/bundle.mjs'), '--config', join(ROOT, 'demo/ds.config.json'), '--check'], { cwd: ROOT, encoding: 'utf8' });
    assert.equal(run.status, 0, `the tour's bundle is stale: run npm run build and commit demo/ds/\n${run.stdout}${run.stderr}`);
  });

  it('links its bundle and its theme, never the whole ds.css or ds.js', () => {
    const page = read('demo/index.html');
    const links = [...page.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((match) => match[1]);
    const scripts = [...page.matchAll(/<script src="([^"]+)"/g)].map((match) => match[1]);
    assert.ok(links.includes('ds/ds.bundle.css'), 'the bundle stylesheet');
    assert.ok(scripts.includes('ds/ds.bundle.js'), 'the bundle script');
    assert.deepEqual([...links, ...scripts].filter((href) => /(^|\/)ds(\.min)?\.(css|js)$/.test(href)), []);
    // The bundle comes before the tour's own theme and stylesheet, so they win (both unlayered).
    assert.ok(links.indexOf('ds/ds.bundle.css') < links.indexOf('demo.css'));
  });

  it('builds its bundle from the tour itself, minified, with every icon (the icon grid shows them all)', () => {
    const config = JSON.parse(read('demo/ds.config.json'));
    assert.deepEqual(config.content.filter((glob) => !glob.startsWith('!')).sort(), ['*.js', 'index.html']);
    assert.equal(config.out, 'ds');
    assert.equal(config.minify, true);
    assert.equal(config.icons, 'all');
    const report = JSON.parse(read('demo/ds/ds.bundle.json'));
    const version = JSON.parse(read('package.json')).version;
    assert.equal(report.version, version);
  });
});
