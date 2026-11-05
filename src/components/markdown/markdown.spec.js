/**
 * Markdown on its demo: the live editor renders in place (DS.dom.morphHtml
 * keeps the nodes), the attribute path with anchors, hostile input as text,
 * a streamed answer in compact prose with code blocks that DS.code takes
 * over, footnotes and anchors by keyboard, the source readable before the
 * module runs. Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, focusByKeyboard } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=markdown');
  await ready(page);
}

test('the live editor: every bare element of the source, rendered into prose', async ({ page }) => {
  await open(page);
  const preview = page.locator('[data-demo="preview"]');
  await expect(preview.getByRole('heading', { level: 2, name: 'Retire a device' })).toBeVisible();
  await expect(preview.getByRole('heading', { level: 2, name: 'Footnotes' })).toHaveClass('ds-sr');
  await expect(preview.locator('strong')).toHaveText('asset tag');
  await expect(preview.getByRole('note')).toContainText('Warning');
  await expect(preview.getByRole('checkbox', { name: 'Charger packed' })).toBeChecked();
  await expect(preview.getByRole('checkbox', { name: 'Label printed' })).not.toBeChecked();
  await expect(preview.locator('pre code.language-sh .ds-highlight__function')).toHaveText('ds-cli');
  await expect(preview.locator('td[data-align="end"]').first()).toHaveCSS('text-align', 'end');
  await expect(preview.locator('del')).toHaveText('active');
  await expect(preview.getByRole('link', { name: 'retirement policy' })).toHaveAttribute('rel', 'noopener');
  await expect(preview.getByRole('link', { name: 'it-support@example.com' })).toHaveAttribute('href', 'mailto:it-support@example.com');
  await expect(preview.locator('[data-ds-markdown], script, iframe')).toHaveCount(0);
});

test('typing renders in place: unchanged blocks keep their nodes', async ({ page }) => {
  await open(page);
  const kept = await page.evaluate(() => {
    const preview = document.querySelector('[data-demo="preview"]');
    const heading = preview.querySelector('h2');
    window.sgHeading = heading;
    return Boolean(heading);
  });
  expect(kept).toBe(true);
  const source = page.locator('[data-demo="source"]');
  await source.focus();
  await page.keyboard.press('Control+End');
  await page.keyboard.type('\n\nA new **line**.');
  await expect(page.locator('[data-demo="preview"] > p').last()).toContainText('A new line.');
  expect(await page.evaluate(() => window.sgHeading === document.querySelector('[data-demo="preview"] h2'))).toBe(true);
});

test('heading anchors: the heading\'s text is the link\'s name; the icon shows on focus', async ({ page }) => {
  await open(page);
  const section = page.locator('[data-demo="attribute"]');
  await expect(section).toHaveAttribute('data-state', 'rendered');
  const heading = section.getByRole('heading', { name: 'Setup' });
  const link = heading.getByRole('link');
  await expect(link).toHaveAccessibleName('Setup');
  expect(await link.getAttribute('href')).toBe(`#${await heading.getAttribute('id')}`);
  const icon = link.locator('svg');
  await expect(icon).toHaveCSS('opacity', '0');
  await focusByKeyboard(page, link);
  await expect(icon).toHaveCSS('opacity', '1');
  await expect(link).toHaveCSS('outline-style', 'solid');
});

test('footnotes: the reference jumps to its note, the note back to the reference', async ({ page }) => {
  await open(page);
  const preview = page.locator('[data-demo="preview"]');
  const ref = preview.locator('.ds-prose__fnref a');
  await expect(ref).toHaveText('1');
  await expect(preview.locator('.ds-prose__footnotes')).toHaveAccessibleName('Footnotes');
  const back = preview.locator('.ds-prose__fnback');
  await expect(back).toHaveAccessibleName('Back to reference 1');
  await focusByKeyboard(page, ref);
  await page.keyboard.press('Enter');
  await expect(back).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(ref).toBeFocused();
});

test('hostile input: tags and other schemes are text', async ({ page }) => {
  await open(page);
  const hostile = page.locator('[data-demo="hostile"]');
  await expect(hostile).toContainText('<script>alert("x")</script>');
  await expect(hostile.locator('script, img, iframe')).toHaveCount(0);
  const links = await hostile.locator('a').evaluateAll((els) => els.map((el) => el.getAttribute('href')));
  expect(links).toEqual(['https://example.com']);
});

test('a streamed answer: compact prose, code blocks in a frame DS.code takes over, the copy button aimed at the code', async ({ page }) => {
  await open(page);
  await page.evaluate(() => document.querySelector('.ds-theme').style.setProperty('--ds-time-scale', '0.1'));
  await page.locator('[data-demo="stream"]').click();
  const answer = page.locator('[data-demo="answer"]');
  await expect(answer.getByRole('note')).toContainText('Reminders go out at 09:00.', { timeout: 15000 });
  const frame = answer.locator('.ds-code');
  await expect(frame.locator('.ds-code__line')).toHaveCount(1);
  await expect(frame.locator('.ds-code__lang')).toHaveText('sh');
  const id = await frame.locator('code').getAttribute('id');
  expect(await frame.locator('[data-ds-copy]').getAttribute('data-ds-copy')).toBe(`#${id}`);
  await expect(frame.locator('[data-ds-copy]')).toHaveAccessibleName('Copy code');
  await expect(answer.locator('ol > li')).toHaveCount(3);
});

test('before the module renders, the source keeps its line breaks', async ({ page }) => {
  await open(page);
  const look = await page.evaluate(() => {
    const el = document.createElement('div');
    el.className = 'ds-prose';
    el.setAttribute('data-ds-markdown', '');
    el.setAttribute('data-ds-managed', '');
    el.textContent = '# A\nB';
    document.getElementById('fx-component').append(el);
    const before = getComputedStyle(el).whiteSpace;
    el.removeAttribute('data-ds-managed');
    const view = DS.markdown.create(el);
    const after = getComputedStyle(el).whiteSpace;
    const html = el.innerHTML;
    view.destroy();
    el.remove();
    return { before, after, html };
  });
  expect(look.before).toBe('pre-line');
  expect(look.after).toBe('normal');
  expect(look.html).toContain('<h1 id="md');
});
