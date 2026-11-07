/**
 * Image: the rules the states hang on. The browser side (the states
 * themselves, the fallback, the fit) is image.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { read, declarationsOf, ms } from '../../../test/helpers.js';

const css = read('src/components/image/image.css');
const value = (selector, property) => declarationsOf(css, selector).filter((d) => d.property === property).map((d) => d.value).at(-1);

describe('image.css', () => {
  it('fades a picture in on --ds-dur-medium and out on --ds-dur-fast, within 0.3-0.8 of the entrance', () => {
    assert.equal(value('.ds-image__frame > img', 'transition'), 'opacity var(--ds-dur-medium) var(--ds-ease-in-out)');
    assert.equal(value('.ds-image__frame[data-state="loading"] > img', 'opacity'), '0');
    assert.equal(value('.ds-image__frame[data-state="loading"] > img', 'transition-duration'), 'var(--ds-dur-fast)');
    const ratio = ms('--ds-dur-fast') / ms('--ds-dur-medium');
    assert.ok(ratio >= 0.3 && ratio <= 0.8, String(ratio));
  });

  it('shows the fallback only where the picture failed, and takes the picture out there', () => {
    assert.equal(value('.ds-image__fallback', 'display'), 'none');
    assert.equal(value('.ds-image__frame[data-state="error"] > .ds-image__fallback', 'display'), 'grid');
    assert.equal(value('.ds-image__frame[data-state="error"] > img', 'display'), 'none');
  });

  it('gives every shape modifier its ratio, overridable by --ds-image-ratio', () => {
    assert.equal(value('.ds-image__frame', 'aspect-ratio'), 'var(--ds-image-ratio, auto)');
    for (const [modifier, ratio] of [['square', '1 / 1'], ['photo', '4 / 3'], ['wide', '16 / 9']]) {
      assert.equal(value(`.ds-image--${modifier} .ds-image__frame`, 'aspect-ratio'), `var(--ds-image-ratio, ${ratio})`);
    }
  });
});
