/*
 * The Time picker demo: a time typed part by part or picked from a list,
 * in the locale's hour cycle or a named one, with a step, limits and
 * seconds; the states. wire() only shows what a page hears (ds:change).
 */
function timePicker(h, label, attrs, hint, extra) {
  var id = h.uid('time');
  var hintId = h.uid('hint');
  var look = h.variant === 'filled' ? ' ds-datefield--filled' : '';
  return '<div class="ds-field">' +
    '<span class="ds-field__label" id="' + id + '">' + label + '</span>' +
    '<div class="ds-picker" data-ds-timepicker ' + attrs + '>' +
    '<div class="ds-datefield' + look + '" role="group" aria-labelledby="' + id + '"' + (hint ? ' aria-describedby="' + hintId + '"' : '') + (extra || '') + '>' +
    '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-datefield__toggle" type="button" aria-label="Choose time"' + (extra && extra.indexOf('disabled') >= 0 ? ' disabled' : '') + '>' + h.icon('clock', 20) + '</button>' +
    '</div></div>' +
    (hint ? '<small class="ds-field__hint" id="' + hintId + '">' + hint + '</small>' : '') +
    '</div>';
}

SG.demo('timepicker', {
  title: 'Time picker',
  group: 'forms',
  need: 'Pick a time of day: type it or choose it from a list, in 12 or 24 hours as the locale has it',
  lead: 'A time typed part by part, or picked from a list that opens from the button. The hour cycle (12 or 24 hours) and the words of the day periods come from the locale through Intl, unless the markup names a cycle.',
  options: { variants: ['outlined', 'filled'], sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    return h.section('Time', '<div class="ds-form-grid ds-form-grid--2" data-demo="basic">' +
        timePicker(h, 'Daily backup at', 'data-ds-value="02:30"', 'Every 30 minutes in the list; type any minute.') +
        timePicker(h, 'Quiet hours start', '', 'Empty: type it, or pick it from the list.') +
        '</div>') +

      h.section('Hour cycle, step, limits, seconds', '<div class="ds-form-grid ds-form-grid--2" data-demo="options">' +
        timePicker(h, 'Shift starts (24 hours)', 'data-ds-value="07:45" data-ds-timepicker-hour-cycle="h23" data-ds-timepicker-step="15" data-ds-timepicker-min="06:00" data-ds-timepicker-max="20:00"', 'Every 15 minutes between 06:00 and 20:00.') +
        timePicker(h, 'Alarm (12 hours, seconds)', 'data-ds-value="18:05:30" data-ds-timepicker-hour-cycle="h12" data-ds-timepicker-seconds data-ds-timepicker-step="60"', 'With seconds; the list steps by the hour.') +
        '</div>') +

      h.section('States', '<div class="ds-form-grid ds-form-grid--2" data-demo="states">' +
        timePicker(h, 'Maintenance ends', 'data-ds-value="05:00" data-ds-timepicker-min="06:00"', h.icon('alertCircle', 16) + ' Pick a time after 06:00.').replace('ds-field__hint"', 'ds-field__hint ds-field__hint--error"') +
        timePicker(h, 'Last seen', 'data-ds-value="14:12"', 'Read-only: reported by the device.', ' aria-readonly="true"') +
        timePicker(h, 'Wake time', '', 'Disabled while the device is off.', ' aria-disabled="true"') +
        '</div>') +

      h.section('Keyboard', '<p class="ds-muted">In the field: <kbd class="ds-kbd">ArrowUp</kbd> and <kbd class="ds-kbd">ArrowDown</kbd> step a part, the digits type it, <kbd class="ds-kbd">a</kbd> or <kbd class="ds-kbd">p</kbd> sets the day period, <kbd class="ds-kbd">Alt</kbd>+<kbd class="ds-kbd">ArrowDown</kbd> opens the list. In the list: the arrows move, <kbd class="ds-kbd">PageUp</kbd> and <kbd class="ds-kbd">PageDown</kbd> an hour, digits jump, <kbd class="ds-kbd">Enter</kbd> picks, <kbd class="ds-kbd">Escape</kbd> closes.</p>' +
        '<p class="ds-meta" data-demo="said" aria-live="polite">Pick a time: what the page hears shows here.</p>');
  },

  wire: function (root, h) {
    var said = h.$('[data-demo="said"]', root);
    root.addEventListener('ds:change', function (event) {
      if (!event.target.closest('[data-ds-timepicker]')) return;
      said.textContent = 'ds:change: ' + (event.detail.value || '(empty)') + (event.detail.valid ? '' : ' (not valid)');
    });
  },
});
