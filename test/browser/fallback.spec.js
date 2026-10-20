/**
 * The `fallback` project itself (base-test.js): Chromium playing an engine
 * on the browser floor. The sampled curves compute to their cubic
 * fallbacks, the progressive APIs are gone and el.animate() rejects
 * linear(), so the specs that import base-test.js prove the fallback paths.
 * Runs in the `fallback` project only.
 */
import { test, expect } from './base-test.js';
import { ready } from './helpers/motion.js';

test('the floor engine: cubic curves, no progressive APIs, animate() rejects linear()', async ({ page, dsFallback }) => {
  test.skip(!dsFallback, 'the fallback project only');
  await page.goto('/test/browser/fixtures/motion.html');
  await ready(page);
  const result = await page.evaluate(() => {
    const theme = document.querySelector('.ds-theme');
    const style = getComputedStyle(theme);
    let rejected = false;
    try {
      document.body.animate([{ opacity: 1 }, { opacity: 1 }], { duration: 1, easing: 'linear(0, 1)' });
    } catch (error) {
      rejected = error instanceof TypeError;
    }
    return {
      spatial: style.getPropertyValue('--ds-ease-spatial').trim(),
      emphasized: style.getPropertyValue('--ds-ease-emphasized').trim(),
      motionEasing: DS.motion.motionEasing(theme, '--ds-ease-spatial'),
      startViewTransition: typeof document.startViewTransition,
      showPopover: typeof HTMLElement.prototype.showPopover,
      moveBefore: typeof Element.prototype.moveBefore,
      supportsLinear: CSS.supports('transition-timing-function', 'linear(0, 1)'),
      supportsAnchor: CSS.supports('anchor-name: --x'),
      rejected,
    };
  });
  expect(result).toEqual({
    spatial: 'cubic-bezier(.05, .7, .1, 1)',
    emphasized: 'cubic-bezier(.2, 0, 0, 1)',
    motionEasing: 'cubic-bezier(.05, .7, .1, 1)',
    startViewTransition: 'undefined',
    showPopover: 'undefined',
    moveBefore: 'undefined',
    supportsLinear: false,
    supportsAnchor: false,
    rejected: true,
  });
});
