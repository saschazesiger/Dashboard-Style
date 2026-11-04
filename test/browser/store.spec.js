/**
 * DS.store in real engines: real localStorage across a reload, the change event
 * and ds:store, cross-tab changes between two pages of one context, and the
 * memory fallback when the browser refuses. Runs in the `fallback` project too.
 */
import { test, expect } from './base-test.js';
import { ready } from './helpers/motion.js';

const open = async (page) => {
  await page.goto('/test/browser/fixtures/format.html');
  await ready(page);
};

test('a value survives a reload, in its namespace, as JSON', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    localStorage.clear();
    const prefs = DS.store.open('devices');
    prefs.set('columns', ['name', 'status']);
    DS.store.open('tickets').set('columns', ['title']);
  });
  await page.reload();
  await ready(page);
  const result = await page.evaluate(() => ({
    available: DS.store.available(),
    raw: localStorage.getItem('ds:devices:columns'),
    columns: DS.store.open('devices').get('columns'),
    other: DS.store.open('tickets').get('columns'),
    fallback: DS.store.open('devices').get('width', 320),
    keys: DS.store.open('devices').keys(),
  }));
  expect(result).toEqual({
    available: true,
    raw: '["name","status"]',
    columns: ['name', 'status'],
    other: ['title'],
    fallback: 320,
    keys: ['columns'],
  });
});

test('a change tells the listener and dispatches a bubbling ds:store on the document', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(() => {
    localStorage.clear();
    const seen = [];
    const events = [];
    document.addEventListener('ds:store', (event) => events.push(event.detail));
    const prefs = DS.store.open('devices');
    const off = prefs.on('change', (detail) => seen.push(detail));
    prefs.set('density', 'compact');
    prefs.set('density', 'compact');
    prefs.remove('density');
    off();
    prefs.set('density', 'dense');
    return { seen, events };
  });
  expect(result.seen).toEqual([
    { namespace: 'devices', key: 'density', value: 'compact', external: false },
    { namespace: 'devices', key: 'density', previous: 'compact', external: false },
  ]);
  expect(result.events.length).toBe(3);
});

test('another tab hears a change as external; a clear there arrives as key null', async ({ context, page }) => {
  const other = await context.newPage();
  await open(page);
  await open(other);
  await page.evaluate(() => {
    localStorage.clear();
    window.fxSeen = [];
    window.fxPrefs = DS.store.open('devices');
    window.fxPrefs.on('change', (detail) => window.fxSeen.push(detail));
    document.addEventListener('ds:store', (event) => { window.fxEvent = event.detail; });
  });
  await other.evaluate(() => DS.store.open('devices').set('columns', ['name']));
  await expect.poll(() => page.evaluate(() => window.fxSeen.length)).toBe(1);
  expect(await page.evaluate(() => window.fxSeen[0])).toMatchObject({ namespace: 'devices', key: 'columns', value: ['name'], external: true });
  expect(await page.evaluate(() => window.fxEvent?.external)).toBe(true);
  expect(await page.evaluate(() => window.fxPrefs.get('columns'))).toEqual(['name']);
  await other.evaluate(() => localStorage.clear());
  await expect.poll(() => page.evaluate(() => window.fxSeen.length)).toBe(2);
  expect(await page.evaluate(() => window.fxSeen[1].key)).toBeNull();
  await other.close();
});

test('where the browser refuses, the choice holds in memory and nothing throws', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(() => {
    const storage = {
      get length() { return 0; },
      key: () => null,
      getItem: () => { throw new DOMException('blocked', 'SecurityError'); },
      setItem: () => { throw new DOMException('full', 'QuotaExceededError'); },
      removeItem: () => { throw new DOMException('blocked', 'SecurityError'); },
    };
    const prefs = DS.store.open('memory-case', { storage });
    const before = prefs.get('x', 'fallback');
    prefs.set('x', { a: 1 });
    const out = { before, after: prefs.get('x'), keys: prefs.keys(), available: DS.store.available({ storage }) };
    prefs.clear();
    out.cleared = prefs.get('x', 'fallback');
    return out;
  });
  expect(result).toEqual({ before: 'fallback', after: { a: 1 }, keys: ['x'], available: false, cleared: 'fallback' });
});
