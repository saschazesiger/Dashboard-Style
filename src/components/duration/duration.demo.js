/*
 * The Duration input demo: lengths of time typed as people write them,
 * written back in the locale's words, stepped with the arrow keys; limits,
 * a form value and the states. wire() only shows what a page hears
 * (ds:change).
 */
function durationField(h, label, attrs, hint, extra) {
  var id = h.uid('du');
  var hintId = h.uid('hint');
  return '<div class="ds-field">' +
    '<span class="ds-field__label" id="' + id + '">' + label + '</span>' +
    '<input class="ds-input ds-duration" type="text" data-ds-duration aria-labelledby="' + id + '"' + (hint ? ' aria-describedby="' + hintId + '"' : '') + ' ' + attrs + (extra || '') + '>' +
    (hint ? '<small class="ds-field__hint" id="' + hintId + '">' + hint + '</small>' : '') +
    '</div>';
}

SG.demo('duration', {
  title: 'Duration input',
  group: 'forms',
  need: 'Type a length of time as people write it (1h 30m, 90 min) and keep it as ISO 8601',
  lead: 'Type "1h 30m", "90 min", "1:30" or "1.5h": once the field is left it shows the value in the locale\'s words, and the page gets ISO 8601 (PT1H30M). The arrow keys step it.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    return h.section('Lengths of time', '<div class="ds-form-grid ds-form-grid--2" data-demo="kinds">' +
        durationField(h, 'Session timeout', 'data-ds-value="PT1H30M" data-ds-duration-step="15m" data-ds-duration-min="5m" data-ds-duration-max="1d"', 'For example 1h 30m. Between 5 minutes and a day; the arrows step 15 minutes.') +
        durationField(h, 'Ticket response target', 'data-ds-value="P2DT4H" data-ds-duration-unit="h" data-ds-duration-smallest="hour" data-ds-duration-step="1h"', 'A bare number counts hours.') +
        durationField(h, 'Device sync interval', 'data-ds-value="PT45S" data-ds-duration-step="15s" data-ds-duration-min="15s"', 'Seconds count too: 45s, 1:30.') +
        durationField(h, 'Backup window', '', 'Empty: type it.') +
        '</div>') +

      h.section('In a form', '<form class="ds-form-grid ds-form-grid--2" data-demo="form">' +
        durationField(h, 'Retention', 'data-ds-value="7d" data-ds-duration-name="retention" data-ds-duration-smallest="day" data-ds-duration-step="1d"', 'A hidden input carries ISO 8601 (name="retention").') +
        '<div class="ds-field"><span class="ds-field__label">Submitted</span><output class="ds-meta" data-demo="form-out">(nothing yet)</output></div>' +
        '<div><button class="ds-btn ds-btn--filled" type="submit">Save</button></div>' +
        '</form>') +

      h.section('States', '<div class="ds-form-grid ds-form-grid--2" data-demo="states">' +
        durationField(h, 'Lock after', 'value="soon"', h.icon('alertCircle', 16) + ' Type a length of time, such as 10m.').replace('ds-field__hint"', 'ds-field__hint ds-field__hint--error"') +
        durationField(h, 'Warranty', 'data-ds-value="P365D" data-ds-duration-smallest="day"', 'Read-only.', ' readonly') +
        durationField(h, 'Grace period', 'data-ds-value="PT10M"', 'Disabled until the device is enrolled.', ' disabled') +
        '</div>') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">ArrowUp</kbd> and <kbd class="ds-kbd">ArrowDown</kbd> add and take a step, <kbd class="ds-kbd">PageUp</kbd> and <kbd class="ds-kbd">PageDown</kbd> ten, <kbd class="ds-kbd">Home</kbd> and <kbd class="ds-kbd">End</kbd> go to the limits, <kbd class="ds-kbd">Enter</kbd> writes the value back.</p>' +
        '<p class="ds-meta" data-demo="said" aria-live="polite">Type a duration: what the page hears shows here.</p>');
  },

  wire: function (root, h) {
    var said = h.$('[data-demo="said"]', root);
    var form = h.$('[data-demo="form"]', root);
    root.addEventListener('ds:change', function (event) {
      if (!event.target.matches('.ds-duration')) return;
      said.textContent = 'ds:change: ' + (event.detail.value || '(empty)') + (event.detail.valid ? '' : ' (not valid)');
    });
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      h.$('[data-demo="form-out"]', root).textContent = 'retention=' + (new FormData(form).get('retention') || '(empty)');
    });
  },
});
