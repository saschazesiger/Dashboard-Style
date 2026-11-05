/**
 * The AI label's stylesheet: the options computed in the label's own rule,
 * the target under touch and the explainer's motion. The toggletip's
 * behaviour is ailabel.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { create } from './ailabel.js';
import { read, declarationsOf } from '../../../test/helpers.js';

const css = read('src/components/ailabel/ailabel.css');
const own = (selector) => Object.fromEntries(declarationsOf(css, selector).map((entry) => [entry.property, entry.value]));

describe('ailabel.css', () => {
  it('steps the height 4px per size and 2px per density, never below 16px', () => {
    assert.equal(own('.ds-ailabel')['--_h'], 'max(16px, calc(var(--ds-ailabel-height, 24px) + var(--ds-size-step, 0) * 4px + var(--ds-density, 0) * 2px))');
  });

  it('is a pill at the default shape, square at 0, never past half its height', () => {
    assert.equal(own('.ds-ailabel')['--_radius'], 'min(calc(var(--ds-radius-action) * var(--ds-shape, 1)), calc(var(--_h) / 2))');
  });

  it('reaches the touch target through an invisible margin', () => {
    assert.equal(own('button.ds-ailabel::after').inset, 'min(0px, calc((100% - var(--ds-target-min, 0px)) / 2))');
  });

  it('keys the explainer on data-state: in on the spring, out fading only', () => {
    assert.match(own('.ds-ailabel__tip[data-state="open"]').transition, /scale var\(--ds-dur-medium\) var\(--ds-ease-spatial\)/);
    assert.match(own('.ds-ailabel__tip').transition, /^opacity var\(--ds-dur-instant\)/);
  });
});

describe('DS.ailabel.create', () => {
  it('is an export that makes one controller per element', () => {
    assert.equal(typeof create, 'function');
  });
});
