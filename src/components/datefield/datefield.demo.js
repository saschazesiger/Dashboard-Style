/*
 * The Date field demo: a date, a time, a date and time with its zone, a
 * range, each typed part by part in the locale's order; a form value; the
 * states. wire() only shows what a page hears (ds:change).
 */
function dateField(h, label, attrs, hint, extra) {
  var id = h.uid('df');
  var hintId = h.uid('hint');
  var look = h.variant === 'filled' ? ' ds-datefield--filled' : '';
  return '<div class="ds-field">' +
    '<span class="ds-field__label" id="' + id + '">' + label + '</span>' +
    '<div class="ds-datefield' + look + '" role="group" data-ds-datefield aria-labelledby="' + id + '"' + (hint ? ' aria-describedby="' + hintId + '"' : '') + ' ' + attrs + (extra || '') + '></div>' +
    (hint ? '<small class="ds-field__hint" id="' + hintId + '">' + hint + '</small>' : '') +
    '</div>';
}

SG.demo('datefield', {
  title: 'Date field',
  group: 'forms',
  need: 'Type a date, a time, a date and time or a range of dates part by part, in the locale\'s order',
  lead: 'One spinbutton per part, in the order, separators and hour cycle of the locale. The digits move on by themselves, the arrows step a part, a pasted date fills them all. The date picker, the time picker and the range picker put a button and a popover around it.',
  options: { variants: ['outlined', 'filled'], sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    return h.section('Types', '<div class="ds-form-grid ds-form-grid--2" data-demo="types">' +
        dateField(h, 'Installed on', 'data-ds-value="2026-11-04"', 'A date.') +
        dateField(h, 'Check-in at', 'data-ds-datefield-type="time" data-ds-value="09:30"', 'A time, in the locale\'s hour cycle.') +
        dateField(h, 'Patch window', 'data-ds-datefield-type="datetime" data-ds-value="2026-11-04T22:00" data-ds-datefield-zone="local"', 'A date and time; its zone at the end.') +
        dateField(h, 'Loan', 'data-ds-datefield-type="range" data-ds-value="2026-11-02/2026-11-13"', 'Two dates; the end must not come before the start.') +
        '</div>') +

      h.section('In a form', '<form class="ds-form-grid ds-form-grid--2" data-demo="form">' +
        dateField(h, 'Next inspection', 'data-ds-datefield-name="inspection" data-ds-datefield-min="2026-01-01"', 'A hidden input carries the value (name="inspection").') +
        '<div class="ds-field"><span class="ds-field__label">Submitted</span><output class="ds-meta" data-demo="form-out">(nothing yet)</output></div>' +
        '<div><button class="ds-btn ds-btn--filled" type="submit">Save</button></div>' +
        '</form>') +

      h.section('States', '<div class="ds-form-grid ds-form-grid--2" data-demo="states">' +
        dateField(h, 'Licence expires', 'data-ds-value="2025-01-31" data-ds-datefield-min="2026-01-01"', h.icon('alertCircle', 16) + ' Choose a date in 2026 or later.').replace('ds-field__hint"', 'ds-field__hint ds-field__hint--error"') +
        dateField(h, 'Registered', 'data-ds-value="2026-03-15"', 'Read-only.', ' aria-readonly="true"') +
        dateField(h, 'Returned', '', 'Disabled until the loan ends.', ' aria-disabled="true"') +
        '</div>') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">ArrowUp</kbd> and <kbd class="ds-kbd">ArrowDown</kbd> step a part (from now when it is empty), <kbd class="ds-kbd">PageUp</kbd> and <kbd class="ds-kbd">PageDown</kbd> take bigger steps, <kbd class="ds-kbd">Home</kbd> and <kbd class="ds-kbd">End</kbd> its ends, digits type it, a separator moves on, <kbd class="ds-kbd">Backspace</kbd> clears it, <kbd class="ds-kbd">ArrowLeft</kbd> and <kbd class="ds-kbd">ArrowRight</kbd> move between parts.</p>' +
        '<p class="ds-meta" data-demo="said" aria-live="polite">Type a value: what the page hears shows here.</p>');
  },

  wire: function (root, h) {
    var said = h.$('[data-demo="said"]', root);
    var form = h.$('[data-demo="form"]', root);
    root.addEventListener('ds:change', function (event) {
      if (!event.target.matches('.ds-datefield')) return;
      said.textContent = 'ds:change: ' + (event.detail.value || '(empty)') + (event.detail.valid ? '' : ' (not valid)');
    });
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      h.$('[data-demo="form-out"]', root).textContent = 'inspection=' + (new FormData(form).get('inspection') || '(empty)');
    });
  },
});
