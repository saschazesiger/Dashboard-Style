/**
 * The `fallback` project itself (base-test.js): Chromium playing an engine
 * on the browser floor (Safari 17.5, Chrome/Edge 123, Firefox 130). What
 * the floor has stays (the spring linear() curves compute, popover,
 * linear() in el.animate()); the progressive APIs are gone (View
 * Transitions, moveBefore, anchor positioning), so the specs that import
 * base-test.js prove the fallback paths of the progressive features.
 * Runs in the `fallback` project only.
 */
import { test, expect } from './base-test.js';
import { ready } from './helpers/motion.js';

test('the floor engine: spring curves, popover and linear() in animate(), no progressive APIs', async ({ page, dsFallback }) => {
  test.skip(!dsFallback, 'the fallback project only');
  await page.goto('/test/browser/fixtures/motion.html');
  await ready(page);
  const result = await page.evaluate(() => {
    const theme = document.querySelector('.ds-theme');
    const style = getComputedStyle(theme);
    let accepted = false;
    try {
      const animation = document.body.animate([{ opacity: 1 }, { opacity: 1 }], { duration: 1, easing: 'linear(0, 1)' });
      accepted = animation.effect.getTiming().easing.startsWith('linear(');
      animation.cancel();
    } catch {
      accepted = false;
    }
    return {
      spatial: style.getPropertyValue('--ds-ease-spatial').trim().startsWith('linear('),
      emphasized: style.getPropertyValue('--ds-ease-emphasized').trim().startsWith('linear('),
      motionEasing: DS.motion.motionEasing(theme, '--ds-ease-spatial').startsWith('linear('),
      startViewTransition: typeof document.startViewTransition,
      showPopover: typeof HTMLElement.prototype.showPopover,
      hidePopover: typeof HTMLElement.prototype.hidePopover,
      moveBefore: typeof Element.prototype.moveBefore,
      supportsLinear: CSS.supports('transition-timing-function', 'linear(0, 1)'),
      supportsAllowDiscrete: CSS.supports('transition-behavior: allow-discrete'),
      supportsAnchor: CSS.supports('anchor-name: --x'),
      supportsPositionArea: CSS.supports('position-area: block-end'),
      supportsInterpolateSize: CSS.supports('interpolate-size: allow-keywords'),
      supportsScrollTimeline: CSS.supports('animation-timeline: scroll()'),
      accepted,
    };
  });
  expect(result).toEqual({
    spatial: true,
    emphasized: true,
    motionEasing: true,
    startViewTransition: 'undefined',
    showPopover: 'function',
    hidePopover: 'function',
    moveBefore: 'undefined',
    supportsLinear: true,
    supportsAllowDiscrete: true,
    supportsAnchor: false,
    supportsPositionArea: false,
    supportsInterpolateSize: false,
    supportsScrollTimeline: false,
    accepted: true,
  });
});
