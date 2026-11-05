/**
 * DS.shell without a DOM: the registrations, the text match of the drawer's
 * filter, the fold of the breadcrumbs, the colour scheme on a stand-in theme,
 * and the rules the module keeps in its source. The frame, the drawer, the
 * search sheet, the launcher and the breadcrumbs in a browser are
 * shell.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as shell from './shell.js';
import { runtime } from '../../js/core.js';
import { open as openStore } from '../../js/store.js';
import { read } from '../../../test/helpers.js';

/** An element with attributes only: what setScheme() and the switch touch. */
function element(attributes = {}) {
  const attrs = new Map(Object.entries(attributes));
  return {
    attrs,
    ownerDocument: undefined,
    getAttribute: (name) => (attrs.has(name) ? attrs.get(name) : null),
    setAttribute: (name, value) => { attrs.set(name, String(value)); },
    removeAttribute: (name) => { attrs.delete(name); },
    hasAttribute: (name) => attrs.has(name),
  };
}

describe('DS.shell', () => {
  it('registers each behaviour by its attribute', () => {
    const specs = runtime.state('core').specs;
    for (const [name, attribute] of [
      ['shell', 'data-ds-shell'],
      ['drawer', 'data-ds-drawer'],
      ['search-sheet', 'data-ds-search-sheet'],
      ['launcher', 'data-ds-launcher'],
      ['scheme-switch', 'data-ds-scheme-switch'],
      ['breadcrumbs', 'data-ds-breadcrumbs'],
    ]) {
      assert.equal(specs.get(name)?.attribute, attribute, name);
      assert.equal(typeof specs.get(name).init, 'function', name);
    }
  });

  it('says where the search turns into a sheet, as shell.css does', () => {
    assert.equal(shell.SEARCH_QUERY, '(max-width: 720px)');
    assert.match(read('src/components/shell/shell.css'), /@media \(max-width: 720px\) \{\s*\.ds-topbar__search-open/);
  });
});

describe('DS.shell.matchText', () => {
  it('matches every word, in any order and case', () => {
    assert.equal(shell.matchText('Open tickets', 'tick'), true);
    assert.equal(shell.matchText('Open tickets', 'TICKETS open'), true);
    assert.equal(shell.matchText('Open tickets', 'open closed'), false);
  });

  it('ignores accents and extra whitespace', () => {
    assert.equal(shell.matchText('Résumé archive', 'resume'), true);
    assert.equal(shell.matchText('Building\n  A', 'building a'), true);
    assert.equal(shell.matchText('Devices', 'devicé'), true);
  });

  it('lets an empty query match everything, and copes with no text', () => {
    assert.equal(shell.matchText('Anything', ''), true);
    assert.equal(shell.matchText('Anything', '   '), true);
    assert.equal(shell.matchText(undefined, 'a'), false);
    assert.equal(shell.matchText(null, ''), true);
  });
});

describe('DS.shell.fitCrumbs', () => {
  const widths = [60, 70, 90, 70, 80, 120];   // Home … Devices, the current page last

  it('folds nothing when the trail fits', () => {
    assert.deepEqual(shell.fitCrumbs(widths, 490, 32), []);
    assert.deepEqual(shell.fitCrumbs(widths, 1000, 32), []);
  });

  it('folds the middle first, from the start, counting the "more" button', () => {
    // 490 wide, 480 room: one fold of 70 leaves 420 + 32 = 452.
    assert.deepEqual(shell.fitCrumbs(widths, 480, 32), [1]);
    assert.deepEqual(shell.fitCrumbs(widths, 400, 32), [1, 2]);
    assert.deepEqual(shell.fitCrumbs(widths, 300, 32), [1, 2, 3]);
  });

  it('then the first crumb, then the parent; never the current page', () => {
    assert.deepEqual(shell.fitCrumbs(widths, 240, 32), [0, 1, 2, 3]);
    assert.deepEqual(shell.fitCrumbs(widths, 160, 32), [0, 1, 2, 3, 4]);
    assert.deepEqual(shell.fitCrumbs(widths, 10, 32), [0, 1, 2, 3, 4]);
  });

  it('handles short trails', () => {
    assert.deepEqual(shell.fitCrumbs([], 10, 32), []);
    assert.deepEqual(shell.fitCrumbs([200], 10, 32), []);
    assert.deepEqual(shell.fitCrumbs([80, 200], 150, 32), [0]);
    // Three crumbs have no middle: the first goes, then the parent.
    assert.deepEqual(shell.fitCrumbs([80, 60, 200], 300, 32), [0]);
    assert.deepEqual(shell.fitCrumbs([80, 60, 200], 250, 32), [0, 1]);
  });

  it('returns the folded indexes in order', () => {
    const folded = shell.fitCrumbs([50, 50, 50, 50, 50], 120, 20);
    assert.deepEqual(folded, [...folded].sort((a, b) => a - b));
  });
});

describe('DS.shell.setScheme', () => {
  it('pins light and dark on the theme and lets auto follow the system', () => {
    const theme = element();
    assert.equal(shell.setScheme('dark', { target: theme, remember: false }), 'dark');
    assert.equal(theme.getAttribute('data-ds-scheme'), 'dark');
    assert.equal(shell.setScheme('light', { target: theme, remember: false }), 'light');
    assert.equal(theme.getAttribute('data-ds-scheme'), 'light');
    assert.equal(shell.setScheme('auto', { target: theme, remember: false }), 'auto');
    assert.equal(theme.hasAttribute('data-ds-scheme'), false);
  });

  it('switches the media of a dark theme link', () => {
    const theme = element();
    const link = element({ media: '(prefers-color-scheme: dark)' });
    shell.setScheme('dark', { target: theme, link, remember: false });
    assert.equal(link.getAttribute('media'), 'all');
    shell.setScheme('light', { target: theme, link, remember: false });
    assert.equal(link.getAttribute('media'), 'not all');
    shell.setScheme('auto', { target: theme, link, remember: false });
    assert.equal(link.getAttribute('media'), '(prefers-color-scheme: dark)');
  });

  it('refuses an unknown value and changes nothing', () => {
    const theme = element({ 'data-ds-scheme': 'dark' });
    assert.equal(shell.setScheme('sepia', { target: theme }), null);
    assert.equal(theme.getAttribute('data-ds-scheme'), 'dark');
  });

  it('remembers the choice under its key in the shell namespace (memory without localStorage)', () => {
    const theme = element();
    shell.setScheme('dark', { target: theme, key: 'unit-scheme' });
    const prefs = openStore('shell');
    assert.equal(prefs.get('unit-scheme'), 'dark');
    shell.setScheme('auto', { target: theme, key: 'unit-scheme' });
    assert.equal(prefs.get('unit-scheme'), 'auto');
    prefs.destroy();
  });
});

describe('DS.shell source rules', () => {
  const source = read('src/components/shell/shell.js').replace(/\/\*[\s\S]*?\*\//g, '');

  it('names no timing of its own', () => {
    assert.doesNotMatch(source, /\b\d+ms\b/);
    assert.doesNotMatch(source, /setTimeout\([^,]+,\s*\d/);
    assert.match(source, /motionDuration\(nav, '--ds-delay-tooltip'\)/);
  });

  it('opens and closes every layer through DS.overlay or the menu', () => {
    assert.doesNotMatch(source, /\.showModal\(|\.showPopover\(|\.hidePopover\(/);
    assert.doesNotMatch(source, /innerHTML/);
  });

  it('remembers through DS.store only', () => {
    assert.doesNotMatch(source, /localStorage|sessionStorage/);
  });
});
