/*
 * The Expandable text demo: a long description, a short one that needs no
 * toggle, two lines in a list of comments, one open at the start, and a
 * width the reader can change. Registered through SG.demo().
 */
var EXPAND_LONG = 'Every printer on the second floor reports low toner. Replace the cartridges from the store room, then reset the counters on the device page so the alerts stop. If a printer still reports low toner after the reset, open a ticket for the service desk with its asset number and the page count, and attach a test print. The service desk answers within a day; until then, send jobs to the printer by the north stairs.';

SG.demo('expandable', {
  title: 'Expandable text',
  group: 'content',
  need: 'Show the first lines of a long text with a Show more button that reveals the rest',
  lead: 'A long text shows its first lines and a Show more button; the button shows only while the text is longer than those lines, measured again on every resize.',
  options: { sizes: false, density: false, shape: false, tones: false },

  render: function (h) {
    return h.section('A long description', '<div class="ds-card" style="max-inline-size: 560px"><h3 class="ds-card__title">Ticket 4,127</h3><div class="ds-expandable" data-ds-expandable data-demo="long"><div class="ds-expandable__text">' + EXPAND_LONG + '</div></div></div>') +
      h.section('A short one', '<div class="ds-card" style="max-inline-size: 560px"><div class="ds-expandable" data-ds-expandable data-demo="short"><div class="ds-expandable__text">Printer 7 is back online.</div></div></div>', 'It fits: no toggle.') +
      h.section('Two lines in a list', '<div class="ds-card" style="max-inline-size: 560px"><ul class="ds-list" aria-label="Comments">' +
        [['Ada Lovelace', EXPAND_LONG], ['Service desk', 'Cartridges ordered. They arrive on Thursday morning, and we will replace them the same day. The old cartridges go back to the supplier in the same box; leave them at the store room door with the return label on top, and we collect them on Friday.']].map(function (row, index) {
          return '<li class="ds-list__item"><span class="ds-list__text"><span class="ds-list__title">' + row[0] + '</span><span class="ds-expandable" data-ds-expandable' + (index === 1 ? '="open"' : '') + ' style="--ds-expandable-lines: 2"><span class="ds-expandable__text ds-list__description">' + row[1] + '</span></span></span></li>';
        }).join('') + '</ul></div>', '--ds-expandable-lines: 2. data-ds-expandable="open" starts open.') +
      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches the toggle after the text; <kbd class="ds-kbd">Enter</kbd> or <kbd class="ds-kbd">Space</kbd> opens and closes it, and focus stays on it. A screen reader reads the whole text either way.</p>');
  }
});
