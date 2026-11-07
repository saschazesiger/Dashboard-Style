/*
 * The Date range picker demo: a range typed or picked in two months with a
 * preview, the relative presets, limits and week numbers, the states.
 * wire() only shows what a page hears (ds:change).
 */
function rangePicker(h, label, attrs, hint, extra) {
  var id = h.uid('range');
  var hintId = h.uid('hint');
  var look = h.variant === 'filled' ? ' ds-datefield--filled' : '';
  return '<div class="ds-field">' +
    '<span class="ds-field__label" id="' + id + '">' + label + '</span>' +
    '<div class="ds-picker" data-ds-daterange ' + attrs + '>' +
    '<div class="ds-datefield' + look + '" role="group" aria-labelledby="' + id + '"' + (hint ? ' aria-describedby="' + hintId + '"' : '') + (extra || '') + '>' +
    '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-datefield__toggle" type="button" aria-label="Choose dates"' + (extra && extra.indexOf('disabled') >= 0 ? ' disabled' : '') + '>' + h.icon('calendarRange', 20) + '</button>' +
    '</div></div>' +
    (hint ? '<small class="ds-field__hint" id="' + hintId + '">' + hint + '</small>' : '') +
    '</div>';
}

SG.demo('daterange', {
  title: 'Date range picker',
  group: 'forms',
  need: 'Pick a range of dates, or a relative one such as the last 7 days, with presets and two months',
  lead: 'Two dates in one field, or a relative range from the presets that stays relative: a saved "Last 7 days" is the last seven days tomorrow too. The popover shows two months on a wide screen and previews the range under the pointer.',
  options: { variants: ['outlined', 'filled'], sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    return h.section('Range and presets', '<div class="ds-stack" data-demo="basic">' +
        rangePicker(h, 'Report period', 'data-ds-value="last-7-days"', 'A relative range: it moves with today.') +
        rangePicker(h, 'Audit window', 'data-ds-value="" data-ds-daterange-presets="this-week,last-week,this-month,last-month,last-90-days"', 'Pick the first day, then the last; the range shows as you go.') +
        '</div>') +

      h.section('Limits and week numbers', '<div class="ds-stack" data-demo="limits">' +
        rangePicker(h, 'Leave', 'data-ds-value="" data-ds-daterange-presets="" data-ds-daterange-weeks data-ds-daterange-disabled="6,7"', 'No presets; weekends cannot start or end a range.') +
        '</div>') +

      h.section('States', '<div class="ds-stack" data-demo="states">' +
        rangePicker(h, 'Contract term', 'data-ds-value="this-year"', 'Read-only: from the contract.', ' aria-readonly="true"') +
        rangePicker(h, 'Loan period', 'data-ds-value=""', 'Disabled until a device is chosen.', ' aria-disabled="true"') +
        '</div>') +

      h.section('Keyboard', '<p class="ds-muted">In the field: the parts of both dates as in a date field. In the popover: <kbd class="ds-kbd">Tab</kbd> moves between the presets and the calendar; in the calendar <kbd class="ds-kbd">Enter</kbd> on the first day starts the range, the arrows preview it, <kbd class="ds-kbd">Enter</kbd> on the last day ends it. <kbd class="ds-kbd">Escape</kbd> closes without a change.</p>' +
        '<p class="ds-meta" data-demo="said" aria-live="polite">Pick a range: what the page hears shows here.</p>');
  },

  wire: function (root, h) {
    var said = h.$('[data-demo="said"]', root);
    root.addEventListener('ds:change', function (event) {
      if (!event.target.closest('[data-ds-daterange]')) return;
      var d = event.detail;
      said.textContent = 'ds:change: ' + (d.value || '(empty)') + (d.preset ? ' = ' + d.start + '/' + d.end : '');
    });
  },
});
