/**
 * DS.avatar: the initials and the hue of a name (pure functions), and the
 * contrast of the six hue pairs of avatar.css in the default palette, the
 * shipped themes and every preset in both schemes. The controllers (the
 * label, the status dot, the group and its menu) are covered in the browser
 * (avatar.spec.js).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hue, initials } from './avatar.js';
import { contrast, pickLightDark, resolveColour } from '../../../scripts/tools/theme-rules.mjs';
import { filesIn, read, stripComments, token, withoutAtRuleBlocks } from '../../../test/helpers.js';

describe('DS.avatar.initials', () => {
  it('takes the first letter of the first and the last word, upper case', () => {
    assert.equal(initials('Ada Lovelace'), 'AL');
    assert.equal(initials('ada king lovelace'), 'AL');
    assert.equal(initials('Grace'), 'G');
    assert.equal(initials('  Joan   Clarke  '), 'JC');
  });

  it('takes one letter with max 1', () => {
    assert.equal(initials('Ada Lovelace', 1), 'A');
  });

  it('leaves out words in brackets and words without a letter', () => {
    assert.equal(initials('Ada Lovelace (admin)'), 'AL');
    assert.equal(initials('Ada [external] Lovelace'), 'AL');
    assert.equal(initials('Ada - Lovelace'), 'AL');
    assert.equal(initials('"Ada" Lovelace'), 'AL');
  });

  it('counts an e-mail address by its local part', () => {
    assert.equal(initials('ada.lovelace@example.com'), 'AL');
    assert.equal(initials('ada@example.com'), 'A');
    assert.equal(initials('grace_hopper+ops@example.com'), 'GO');
  });

  it('keeps letters of every script and combined characters whole', () => {
    assert.equal(initials('Émile Zola'), 'ÉZ');
    assert.equal(initials('Émile Zola'), 'ÉZ', 'NFC: the accent stays with its letter');
    assert.equal(initials('Øystein Ødegaard'), 'ØØ');
    assert.equal(initials('Анна Петрова'), 'АП');
    assert.equal(initials('Device 42'), 'D4');
  });

  it('is empty for no name or a name without a letter', () => {
    for (const name of ['', '   ', null, undefined, '---', '(admin)']) assert.equal(initials(name), '', String(name));
  });
});

describe('DS.avatar.hue', () => {
  it('is 1 to 6 and the same for the same name, whatever its case, spaces or composition', () => {
    const first = hue('Ada Lovelace');
    assert.ok(first >= 1 && first <= 6);
    assert.equal(hue('ada lovelace'), first);
    assert.equal(hue('  Ada Lovelace '), first);
    assert.equal(hue('Émile'), hue('Émile'));
  });

  it('is FNV-1a over the UTF-8 bytes, so a server agrees with it', () => {
    // FNV-1a 32 of "a" is 0xe40c292c (3826002220); 3826002220 % 6 = 4.
    assert.equal(hue('a'), 5);
    // Of "" the offset basis 0x811c9dc5 (2166136261); % 6 = 1.
    assert.equal(hue(''), 2);
  });

  it('spreads names over all six hues', () => {
    const names = ['Ada Lovelace', 'Grace Hopper', 'Joan Clarke', 'Alan Turing', 'Katherine Johnson', 'Margaret Hamilton',
      'Hedy Lamarr', 'Edsger Dijkstra', 'Barbara Liskov', 'Radia Perlman', 'Frances Allen', 'John Backus', 'Device 1',
      'Device 2', 'Device 3', 'Device 4', 'Product', 'Field team', 'Build service', 'Ticket bot'];
    const counts = new Map();
    for (const name of names) counts.set(hue(name), (counts.get(hue(name)) ?? 0) + 1);
    assert.equal(counts.size, 6, [...counts].join(' '));
  });
});

describe('the hue pairs of avatar.css', () => {
  const css = stripComments(read('src/components/avatar/avatar.css'));
  const hues = [...css.matchAll(/\.ds-avatar--hue-(\d)\s*\{\s*--_hue:\s*([^;]+);/g)].map((match) => [Number(match[1]), match[2].trim()]);
  const pair = /background:\s*(color-mix\([^;]*var\(--_hue\)[^;]*\));\s*color:\s*(color-mix\([^;]*var\(--_hue\)[^;]*\));/.exec(css);

  it('reads six hues and one pair from the stylesheet', () => {
    assert.deepEqual(hues.map(([n]) => n), [1, 2, 3, 4, 5, 6]);
    assert.ok(pair, 'the background and colour of the hue classes');
  });

  /** The theme declarations outside @media, as one scheme sees them. */
  const declared = (file, scheme) => {
    const text = pickLightDark(withoutAtRuleBlocks(read(file), /^@media\b/), scheme);
    return Object.fromEntries([...stripComments(text).matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((match) => [match[1], match[2].trim()]));
  };
  const stack = (scheme, ...files) => {
    const layers = files.map((file) => declared(file, scheme));
    return (name) => {
      for (const layer of [...layers].reverse()) if (name in layer) return layer[name];
      return token(name);
    };
  };
  const failing = (lookup) => hues.flatMap(([n, value]) => {
    const resolve = (text) => resolveColour(text.replaceAll('var(--_hue)', value), lookup);
    const ratio = contrast(resolve(pair[2]), resolve(pair[1]));
    return ratio !== null && ratio >= 4.5 ? [] : [`hue ${n}: ${ratio === null ? 'not resolved' : ratio.toFixed(2)}`];
  });

  const themes = [
    ['the default palette', 'light', []],
    ['dark', 'light', ['themes/dark.css']],
    ['contrast', 'light', ['themes/contrast.css']],
    ['dark + contrast', 'light', ['themes/dark.css', 'themes/contrast.css']],
    ['compact', 'light', ['themes/compact.css']],
    ...filesIn('themes/presets').flatMap((file) => ['light', 'dark'].map((scheme) => [`${file} (${scheme})`, scheme, [file]])),
  ];
  for (const [label, scheme, files] of themes) {
    it(`holds 4.5:1 for every hue: ${label}`, () => {
      assert.deepEqual(failing(stack(scheme, ...files)), []);
    });
  }

  it('gives six different colours in the default palette and the dark theme', () => {
    for (const files of [[], ['themes/dark.css']]) {
      const lookup = stack('light', ...files);
      const fills = hues.map(([, value]) => String(resolveColour(pair[1].replaceAll('var(--_hue)', value), lookup)));
      assert.equal(new Set(fills).size, 6, fills.join(' '));
    }
  });
});
