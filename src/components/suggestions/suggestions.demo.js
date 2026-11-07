/*
 * The Suggestions demo: follow-up chips over a composer (a press fills
 * it), the wrapping look, and chips set from data. Registered through
 * SG.demo() (styleguide/sg-core.js). Size, density, shape, touch and tone
 * reach the chips from the options panel; the look is the variant.
 */
var SUGGESTED = [
  ['sparkles', 'Battery report', 'Show the battery report of laptop 4'],
  ['ticket', 'Open a ticket', 'Open a ticket for laptop 4'],
  ['history', 'What changed?', 'What changed on laptop 4 this week?'],
  ['users', 'Who else?', 'Which other devices drain overnight?'],
  ['settings', 'Sleep settings', 'Show the sleep settings of laptop 4'],
  ['calendar', 'Plan a check', 'Plan a check of laptop 4 for Friday'],
];

function sgChips(h, rows) {
  return rows.map(function (row) {
    return '<button class="ds-chip" type="button" data-value="' + h.esc(row[2]) + '"><span class="ds-chip__body">' +
      h.icon(row[0], 18, 'ds-chip__icon') + '<span class="ds-chip__label">' + h.esc(row[1]) + '</span></span></button>';
  }).join('');
}

SG.demo('suggestions', {
  title: 'Suggestions',
  group: 'actions',
  need: 'Offer follow-up prompts: a row of chips that scrolls sideways and drags, or wraps; a press fills or sends the composer',
  lead: 'Follow-up prompts as action chips. The row scrolls sideways (drag it with a mouse) or wraps; a press puts the prompt into the composer.',
  options: { variants: ['scroll', 'wrap'], sizes: true, density: true, shape: true, tones: true },

  render: function (h) {
    var composer = h.uid('composer');
    var scroll = !h.variant || h.variant === 'scroll';
    var wrap = !h.variant || h.variant === 'wrap';
    return (scroll ? h.section('Over the composer', '<div class="ds-stack" style="max-inline-size:560px">' +
        '<div class="ds-suggestions ds-scroll-x" role="group" aria-label="Suggested questions" data-ds-suggestions data-ds-suggestions-for="' + composer + '">' + sgChips(h, SUGGESTED) + '</div>' +
        '<form class="ds-composer" id="' + composer + '" data-ds-composer data-demo="composer">' +
        '<textarea class="ds-composer__input ds-input--grow" rows="1" aria-label="Message" placeholder="Ask about a device"></textarea>' +
        '<button class="ds-btn ds-btn--filled ds-btn--icon" type="submit" aria-label="Send" data-tip="Send">' + h.icon('send', 20) + '</button></form>' +
        '</div>', 'More than fits: the row scrolls sideways, fades at the end that has more, and a mouse can drag it. A press fills the composer.') : '') +
      (wrap ? h.section('Wrapping', '<div class="ds-suggestions ds-suggestions--wrap" role="group" aria-label="Suggested questions" data-ds-suggestions data-demo="wrap">' + sgChips(h, SUGGESTED.slice(0, 4)) + '</div>' +
        '<p class="ds-muted" data-demo="log"></p>', 'Under a reply, where there is room: the chips wrap. Here a press only tells the page (ds:select).') : '') +
      h.section('Set from data', '<div class="ds-suggestions ds-scroll-x" role="group" aria-label="Next steps" data-demo="data"></div>' +
        '<div class="sg-row"><button class="ds-btn ds-btn--outlined" type="button" data-demo="next">Other suggestions</button></div>') +
      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> goes from chip to chip and brings each into view; <kbd class="ds-kbd">Enter</kbd> or <kbd class="ds-kbd">Space</kbd> presses it.</p>');
  },

  wire: function (root, h) {
    var wrap = h.$('[data-demo="wrap"]', root);
    var log = h.$('[data-demo="log"]', root);
    if (wrap && log) wrap.addEventListener('ds:select', function (event) { log.textContent = 'Asked: ' + event.detail.value; });
    var data = h.$('[data-demo="data"]', root);
    var row = DS.suggestions.create(data);
    var sets = [
      ['Restart the router', { value: 'Show the router log of last night', label: 'Router log', icon: DS.icons.scrollText }, 'Who uses laptop 4?'],
      [{ label: 'Order a battery', icon: DS.icons.cart }, 'Compare with laptop 7', 'Close the ticket'],
    ];
    var turn = 0;
    row.set(sets[0]);
    h.$('[data-demo="next"]', root).addEventListener('click', function () { row.set(sets[++turn % sets.length]); });
    return function () {};
  },
});
