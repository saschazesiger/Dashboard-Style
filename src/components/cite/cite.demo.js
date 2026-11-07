/*
 * The Sources and citations demo: an answer with markers that open their
 * source cards (two markers share one), the list of sources, a card with a
 * long title in a narrow column. Registered through SG.demo()
 * (styleguide/sg-core.js).
 */
var SOURCES = [
  { site: 'example.com', title: 'Warranty register 2026', snippet: 'The warranty of LAPTOP-0042 ends on 28 February 2027; LAPTOP-0043 and LAPTOP-0044 end in December.', icon: 'fileText' },
  { site: 'docs.example.org', title: 'Device lifecycle policy', snippet: 'Laptops are replaced after four years or when the repair costs more than half of a new device.', icon: 'book' },
  { site: 'tickets.example.net', title: 'Ticket 4211: battery swells on LAPTOP-0007', snippet: 'Ada Lovelace reported the battery on 3 November; the device is in the repair queue.', icon: 'ticket' },
];

function citeMarker(h, n, cardId) {
  return '<button class="ds-cite" type="button" aria-controls="' + cardId + '" aria-label="Source ' + n + ': ' + h.esc(SOURCES[n - 1].title) + '" data-ds-cite>' + n + '</button>';
}

function citeCard(h, n, cardId) {
  var source = SOURCES[n - 1];
  return '<div class="ds-cite__card" id="' + cardId + '" popover="manual" hidden>' +
    '<p class="ds-cite__source"><span class="ds-cite__icon">' + h.icon(source.icon, 16) + '</span>' + h.esc(source.site) + '</p>' +
    '<a class="ds-cite__title" href="#">' + h.esc(source.title) + '</a>' +
    '<p class="ds-cite__snippet">' + h.esc(source.snippet) + '</p></div>';
}

SG.demo('cite', {
  title: 'Sources and citations',
  group: 'content',
  need: 'Mark where a generated answer\'s facts come from: numbered markers that open their source, and the list of sources',
  lead: 'Rest the pointer on a marker or press it: its card shows the source. Enter or Space opens it from the keyboard and moves focus to its link.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var ids = [h.uid('cite'), h.uid('cite'), h.uid('cite')];
    var list = '<ol class="ds-cite-list" aria-label="Sources">' + SOURCES.map(function (source, i) {
      return '<li class="ds-cite-list__item"><span class="ds-cite-list__number">' + (i + 1) + '</span>' +
        '<span class="ds-cite-list__body"><a class="ds-cite__title" href="#">' + h.esc(source.title) + '</a><span class="ds-cite__source">' + h.esc(source.site) + '</span></span></li>';
    }).join('') + '</ol>';
    return h.section('In an answer', '<div class="ds-prose" data-demo="answer">' +
        '<p>Eleven of the forty laptops leave their warranty before March' + citeMarker(h, 1, ids[0]) + '. The policy replaces a laptop after four years, or sooner when a repair costs more than half of a new one' + citeMarker(h, 2, ids[1]) + '.</p>' +
        '<p>LAPTOP-0007 is already in the repair queue with a swollen battery' + citeMarker(h, 3, ids[2]) + ', and its warranty ended last year' + citeMarker(h, 1, ids[0]) + '.</p>' +
        '</div>' + ids.map(function (id, i) { return citeCard(h, i + 1, id); }).join(''),
        'Two markers share the first card.') +

      h.section('Sources', list) +

      h.section('Narrow', '<div style="max-inline-size: 240px"><p>The battery issue is tracked' + citeMarker(h, 3, ids[2]) + '.</p></div>',
        'The card stays inside the window: it moves to fit and goes above the marker without room below.') +

      h.section('Keyboard and screen readers', '<p class="ds-muted">Tab reaches each marker; its name says the source. Enter or Space opens the card and moves focus to its link; Tab past the link closes it and moves on; Escape closes it and returns to the marker.</p>');
  },
});
