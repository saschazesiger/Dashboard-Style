/*
 * The Result page demo: every cause in a frame of its own, the picture
 * slot, a narrow width. Registered through SG.demo() (styleguide/sg-core.js).
 * Size, density and shape come from the options panel; the panel's tone
 * overrides the cause's colours on the first frame, since a result reads
 * only its own.
 */
var RESULTS = [
  ['success', 'checkCircle', '', 'Device added', 'Laptop 0042 is in the inventory now.', ['Open the device', 'Add another'], ''],
  ['forbidden', 'lock', '403', 'You need access', 'Only an administrator can see this report. Ask one for access.', ['Request access', 'Go back'], ''],
  ['not-found', 'mapPin', '404', 'Page not found', 'The address may be mistyped, or the page has moved.', ['Go to the overview', 'Search'], ''],
  ['error', 'alert', '500', 'Something went wrong', 'The server could not finish the request. Try again in a moment.', ['Try again', 'Status page'], 'Reference 9F2C-118A, 14:02'],
  ['maintenance', 'wrench', '', 'Back at 14:00', 'The inventory is down for planned maintenance. Your data is safe.', ['Status page'], ''],
  ['offline', 'wifiOff', '', 'You are offline', 'Check the connection; the page reloads when it is back.', ['Try again'], '']
];

function resultHtml(h, row, extra) {
  var id = h.uid('result');
  return '<section class="ds-result ds-result--' + row[0] + (extra || '') + '" aria-labelledby="' + id + '" data-demo="' + row[0] + '">' +
    (row[0] === 'not-found' && extra === ' sg-picture' ? '' : '<span class="ds-result__disc" aria-hidden="true">' + h.icon(row[1], 32) + '</span>') +
    (row[2] ? '<p class="ds-result__code">' + row[2] + '</p>' : '') +
    '<h2 class="ds-result__title" id="' + id + '" tabindex="-1">' + row[3] + '</h2><p class="ds-result__text">' + row[4] + '</p>' +
    '<div class="ds-result__actions">' + row[5].map(function (label, index) {
      return '<button class="ds-btn ' + (index === 0 ? 'ds-btn--filled' : 'ds-btn--text') + '" type="button">' + label + '</button>';
    }).join('') + '</div>' + (row[6] ? '<p class="ds-result__meta">' + row[6] + '</p>' : '') + '</section>';
}

SG.demo('result', {
  title: 'Result page',
  group: 'feedback',
  need: 'Fill a page with how a request ended: done, 403, 404, 500, maintenance or offline, and the way out',
  lead: 'A whole page or panel that says how a request ended: a disc with the cause\'s icon, the code for support, a title in words, one line of what to do and the way out.',
  options: { sizes: true, density: true, shape: true, tones: true },

  render: function (h) {
    var picture = '<svg viewBox="0 0 240 160" width="240" height="160" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="40" y="30" width="160" height="100" rx="12"/><path d="M40 54h160"/><circle cx="56" cy="42" r="3"/><circle cx="68" cy="42" r="3"/><path d="M96 104l24-24 24 24"/><path d="M120 80v40"/></svg>';
    return h.section('Causes', '<div class="ds-grid-2">' + RESULTS.map(function (row, index) {
        return '<div class="ds-card">' + resultHtml(h, row, index === 0 && h.tone ? ' ds-tone-' + h.tone : '') + '</div>';
      }).join('') + '</div>', 'Each fills a page in a project; here a card holds each. The icon and the title say what happened, never the colour or the code alone.') +
      h.section('With a picture', (function (id) { return '<div class="ds-card"><section class="ds-result ds-result--not-found" aria-labelledby="' + id + '">' +
        '<span class="ds-result__media" aria-hidden="true">' + picture + '</span><p class="ds-result__code">404</p>' +
        '<h2 class="ds-result__title" id="' + id + '" tabindex="-1">Nothing at this address</h2><p class="ds-result__text">The page\'s own illustration takes the disc\'s place.</p>' +
        '<div class="ds-result__actions"><button class="ds-btn ds-btn--filled" type="button">Go to the overview</button></div></section></div>'; }(h.uid('result-pic')))) +
      h.section('Narrow', '<div class="ds-card" style="max-inline-size: 360px; container-type: inline-size">' + resultHtml(h, RESULTS[3]) + '</div>', 'At a phone\'s width the actions stack, full width.') +
      h.section('Keyboard', '<p class="ds-muted">After a request the page moves focus to the title, so the result is read; <kbd class="ds-kbd">Tab</kbd> then reaches the actions.</p>');
  }
});
