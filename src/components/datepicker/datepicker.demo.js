/*
 * The Date picker demo: a date typed part by part or picked in the calendar
 * popover; min, max, blocked days and week numbers; a date and a time with
 * the zone of its wall time; the states; the locale. Everything the reader
 * sees comes from the system (data-ds-datepicker, Intl); wire() only shows
 * what a page hears (ds:change).
 */
function picker(h, label, attrs, hint, extra) {
  var id = h.uid('date');
  var hintId = h.uid('hint');
  var look = h.variant === 'filled' ? ' ds-datefield--filled' : '';
  return '<div class="ds-field">' +
    '<span class="ds-field__label" id="' + id + '">' + label + '</span>' +
    '<div class="ds-picker" data-ds-datepicker ' + attrs + '>' +
    '<div class="ds-datefield' + look + '" role="group" aria-labelledby="' + id + '"' + (hint ? ' aria-describedby="' + hintId + '"' : '') + (extra || '') + '>' +
    '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-datefield__toggle" type="button" aria-label="Choose date">' + h.icon('calendar', 20) + '</button>' +
    '</div></div>' +
    (hint ? '<small class="ds-field__hint" id="' + hintId + '">' + hint + '</small>' : '') +
    '</div>';
}

function iso(date) {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}

SG.demo('datepicker', {
  title: 'Date picker',
  group: 'forms',
  need: 'Pick one date, or a date and a time: type it or choose it in a calendar',
  lead: 'A date typed part by part in the order of the page\'s locale, or picked in a calendar that opens from the button. Month names, weekdays, the first day of the week and week numbers all come from Intl.',
  options: { variants: ['outlined', 'filled'], sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var now = new Date();
    var today = iso(now);
    var soon = iso(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3));
    var min = iso(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 10));
    var max = iso(new Date(now.getFullYear(), now.getMonth() + 2, now.getDate()));
    return h.section('Date', '<div class="ds-form-grid ds-form-grid--2" data-demo="basic">' +
        picker(h, 'Due date', 'data-ds-value="' + soon + '"', 'When the ticket must be closed.') +
        picker(h, 'Purchase date', '', 'Empty: type it, or open the calendar.') +
        '</div>',
        'Type the digits (the field moves on by itself), step a part with the arrow keys, or open the calendar: its arrows move a day or a week, PageUp and PageDown a month, Enter picks.') +

      h.section('Limits, blocked days, week numbers', '<div class="ds-form-grid ds-form-grid--2" data-demo="limits">' +
        picker(h, 'Maintenance window', 'data-ds-value="' + today + '" data-ds-datepicker-min="' + min + '" data-ds-datepicker-max="' + max + '" data-ds-datepicker-disabled="6,7" data-ds-datepicker-weeks', 'Weekdays only, within the next two months. Week numbers on the side.') +
        '</div>') +

      h.section('Date and time', '<div class="ds-form-grid ds-form-grid--2" data-demo="datetime">' +
        picker(h, 'Restart the device at', 'data-ds-value="' + soon + 'T22:00" data-ds-datepicker-type="datetime" data-ds-datepicker-zone="local" data-ds-datepicker-step="30"', 'In your time zone: the offset at the field\'s end names it.') +
        picker(h, 'Backup window (UTC)', 'data-ds-value="' + soon + 'T02:30" data-ds-datepicker-type="datetime" data-ds-datepicker-zone="UTC" data-ds-datepicker-hour-cycle="h23"', 'A wall time in UTC, on a 24-hour clock.') +
        '</div>') +

      h.section('States', '<div class="ds-form-grid ds-form-grid--2" data-demo="states">' +
        picker(h, 'Warranty ends', 'data-ds-value="' + min + '" data-ds-datepicker-min="' + today + '"', h.icon('alertCircle', 16) + ' The date must not be in the past.') .replace('ds-field__hint"', 'ds-field__hint ds-field__hint--error"') +
        picker(h, 'Handed over', 'data-ds-value="' + today + '"', 'Read-only: set when the device was signed for.', ' aria-readonly="true"') +
        picker(h, 'Retired on', '', 'Disabled until the device is retired.', ' aria-disabled="true"').replace('ds-datefield__toggle"', 'ds-datefield__toggle" disabled') +
        '</div>') +

      h.section('Another locale', '<div class="ds-form-grid ds-form-grid--2" data-demo="locale">' +
        picker(h, 'Datum', 'data-ds-value="' + today + '" lang="de"', 'DS.core.config({ locale }) sets the page\'s locale; this one passes its own (locale: \'de\').').replace('data-ds-datepicker ', 'data-demo-locale ') +
        '</div>') +

      h.section('Keyboard', '<p class="ds-muted">In the field: <kbd class="ds-kbd">ArrowUp</kbd> and <kbd class="ds-kbd">ArrowDown</kbd> step a part, <kbd class="ds-kbd">ArrowLeft</kbd> and <kbd class="ds-kbd">ArrowRight</kbd> move between parts, <kbd class="ds-kbd">Backspace</kbd> clears one, <kbd class="ds-kbd">Alt</kbd>+<kbd class="ds-kbd">ArrowDown</kbd> opens the calendar. In the calendar: the arrows move a day or a week, <kbd class="ds-kbd">Home</kbd> and <kbd class="ds-kbd">End</kbd> the week\'s ends, <kbd class="ds-kbd">PageUp</kbd> and <kbd class="ds-kbd">PageDown</kbd> a month (with <kbd class="ds-kbd">Shift</kbd> a year), <kbd class="ds-kbd">Enter</kbd> picks, <kbd class="ds-kbd">Escape</kbd> closes.</p>' +
        '<p class="ds-meta" data-demo="said" aria-live="polite">Pick a date: what the page hears shows here.</p>');
  },

  wire: function (root, h) {
    var said = h.$('[data-demo="said"]', root);
    // A picker that reads its own locale: the page passes it in (DS.core.config sets the page's).
    var german = h.$('[data-demo-locale]', root);
    if (german && window.DS && DS.datepicker) DS.datepicker.create(german, { locale: 'de' });
    root.addEventListener('ds:change', function (event) {
      if (!event.target.closest('[data-ds-datepicker]')) return;
      said.textContent = 'ds:change: ' + (event.detail.value || '(empty)') + (event.detail.valid ? '' : ' (not valid)');
    });
  },
});
