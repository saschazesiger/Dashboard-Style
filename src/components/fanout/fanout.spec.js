import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

test('the fixture route renders the demo; DS.init runs the behaviour', async ({ page }) => {
  await page.goto('/test/browser/fixtures/component.html?c=fanout');
  await ready(page);
  const probe = page.locator('[data-demo="probe"]');
  await expect(probe).toHaveText('Probe');
  await probe.click();
  await expect(probe).toHaveText('1');
  expect(await page.evaluate(() => typeof window.DS.fanout.create)).toBe('function');
});
