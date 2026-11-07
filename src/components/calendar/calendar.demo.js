/*
 * The Calendar demo: the month grid every date picker shares, inline on the
 * page: one day, a range over two months with its preview, limits, blocked
 * days and week numbers, another first day of the week. wire() only shows
 * what a page hears (ds:change).
 */
function isoDay(date) {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}

SG.demo('calendar', {
  title: 'Calendar',
  group: 'forms',
  need: 'Show a month and let someone pick a day or a range in it, in the page\'s locale',
  lead: 'The month grid of every date picker, also on its own: a day or a range, limits and blocked days, week numbers. Names, the first day of the week and the week numbering follow the locale through Intl.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var now = new Date();
    var today = isoDay(now);
    var start = isoDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3));
    var end = isoDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 9));
    var min = isoDay(new Date(now.getFullYear(), now.getMonth(), 3));
    var max = isoDay(new Date(now.getFullYear(), now.getMonth() + 1, 20));
    var holiday = isoDay(new Date(now.getFullYear(), now.getMonth(), 12));
    return h.section('One day', '<div class="sg-row" data-demo="single">' +
        '<div class="ds-card"><div class="ds-calendar" data-ds-calendar data-ds-value="' + today + '" aria-label="Delivery date"></div></div>' +
        '</div>', 'Click a day, or move with the arrow keys and press Enter. The month title is announced when the page turns.') +

      h.section('A range over two months', '<div class="sg-row" data-demo="range">' +
        '<div class="ds-card"><div class="ds-calendar" data-ds-calendar data-ds-calendar-mode="range" data-ds-calendar-months="2" data-ds-value="' + start + '/' + end + '"></div></div>' +
        '</div>', 'The first pick starts a range; the pointer and the keys preview it; the second pick ends it.') +

      h.section('Limits, blocked days, week numbers, Monday first', '<div class="sg-row" data-demo="limits">' +
        '<div class="ds-card"><div class="ds-calendar" data-ds-calendar data-ds-value="' + today + '" data-ds-calendar-min="' + min + '" data-ds-calendar-max="' + max + '" data-ds-calendar-disabled="6,7,' + holiday + '" data-ds-calendar-weeks data-ds-calendar-first-day="1"></div></div>' +
        '</div>', 'Weekends and one holiday are blocked: still focusable, so their names are read, never picked.') +

      h.section('What the page hears', '<p class="ds-meta" data-demo="said" aria-live="polite">Pick a day.</p>');
  },

  wire: function (root, h) {
    var said = h.$('[data-demo="said"]', root);
    root.addEventListener('ds:change', function (event) {
      if (event.target.matches('.ds-calendar')) said.textContent = 'ds:change: ' + event.detail.value;
    });
  },
});
