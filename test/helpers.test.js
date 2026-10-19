/**
 * The CSS helpers the other tests stand on (test/helpers.js): they must read
 * a stylesheet the same way whether it is flat, indented inside an @layer
 * block or has its @media blocks nested in @supports, so wrapping the source
 * in layers cannot silently turn a CSS test into one that checks nothing.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { atRuleBlocks, declarationsOf, forcedColorBlocks, rules, withoutAtRuleBlocks } from './helpers.js';

const FLAT = `/* a comment with { braces } */
.ds-a { color: red; }
.ds-b:hover, .ds-c {
  opacity: .5;
  transition:
    opacity 1s,
    color 2s;
}
@media (forced-colors: active) {
.ds-a { outline: 1px solid transparent; }
}
@media (hover: hover) {
.ds-b:hover { color: blue; }
}
.ds-a { margin: 0; }
`;

const indent = (css) => css.split('\n').map((line) => (line ? `  ${line}` : line)).join('\n');

const SAMPLES = {
  flat: FLAT,
  layered: `@layer ds.tokens, ds.base, ds.components;\n@layer ds.components {\n${indent(FLAT)}}\n`,
  nested: FLAT
    .replace('@media (forced-colors: active) {', '@supports (display: grid) {\n  @media (forced-colors: active) {')
    .replace('.ds-a { outline: 1px solid transparent; }\n}', '.ds-a { outline: 1px solid transparent; }\n  }\n}'),
};

const FORCED = /@media\s*\(forced-colors:\s*active\)/;
const HOVER = /@media\s*\(hover:\s*hover\)/;
const squash = (text) => text.replace(/\s+/g, ' ').trim();

describe('test helpers', () => {
  const flatRules = rules(FLAT);

  it('reads the flat sample as expected', () => {
    assert.deepEqual(flatRules.map((rule) => rule.selector), ['.ds-a', '.ds-b:hover, .ds-c', '.ds-a', '.ds-b:hover', '.ds-a']);
    assert.deepEqual(declarationsOf(FLAT, '.ds-c'), [
      { property: 'opacity', value: '.5' },
      { property: 'transition', value: 'opacity 1s, color 2s' },
    ]);
    assert.deepEqual(atRuleBlocks(FLAT, FORCED).map(squash), ['.ds-a { outline: 1px solid transparent; }']);
    assert.deepEqual(rules(withoutAtRuleBlocks(FLAT, HOVER)).map((rule) => rule.selector), ['.ds-a', '.ds-b:hover, .ds-c', '.ds-a', '.ds-a']);
  });

  for (const [name, css] of Object.entries(SAMPLES)) {
    it(`reads the ${name} sample like the flat one`, () => {
      assert.deepEqual(rules(css), flatRules);
      for (const selector of ['.ds-a', '.ds-c', '.ds-b:hover']) assert.deepEqual(declarationsOf(css, selector), declarationsOf(FLAT, selector), selector);
      assert.deepEqual(atRuleBlocks(css, FORCED).map(squash), atRuleBlocks(FLAT, FORCED).map(squash));
      assert.deepEqual(forcedColorBlocks(css).map(squash), forcedColorBlocks(FLAT).map(squash));
      assert.deepEqual(atRuleBlocks(css, HOVER).map(squash), atRuleBlocks(FLAT, HOVER).map(squash));
      for (const prelude of [FORCED, HOVER]) {
        assert.deepEqual(rules(withoutAtRuleBlocks(css, prelude)), rules(withoutAtRuleBlocks(FLAT, prelude)), String(prelude));
      }
    });
  }

  it('lists nested blocks and removes a block with everything inside it', () => {
    const css = '@supports (x: y) { @media (min-width: 1px) { .ds-a { color: red; } } }\n.ds-b { color: blue; }';
    assert.deepEqual(atRuleBlocks(css, /@(supports|media)/).map(squash), ['@media (min-width: 1px) { .ds-a { color: red; } }', '.ds-a { color: red; }']);
    assert.deepEqual(rules(withoutAtRuleBlocks(css, /@supports/)).map((rule) => rule.selector), ['.ds-b']);
    assert.deepEqual(rules(withoutAtRuleBlocks(css, /@media/)).map((rule) => rule.selector), ['.ds-b']);
  });
});
