/*
 * The Error summary demo: a device form whose submit shows the summary,
 * a server-side problem through set(), and the summary as it looks.
 * Registered through SG.demo() (styleguide/sg-core.js). Size, density,
 * shape and touch come from the options panel; the tone is the error's.
 */
function errorSummaryField(h, o) {
  var id = h.uid('es-field');
  return '<div class="ds-field' + (o.full ? ' ds-field--full' : '') + '"><label class="ds-field__label" for="' + id + '">' + o.label +
    (o.optional ? ' <span class="ds-field__optional">(optional)</span>' : '') + '</label>' +
    o.control.replace('%ID%', id) +
    '<small class="ds-field__hint ds-field__hint--error" hidden></small></div>';
}

SG.demo('errorsummary', {
  title: 'Error summary',
  group: 'forms',
  need: 'Tell what is wrong with a form after a submit: every problem at the top, each a link to its field',
  lead: 'After a submit with problems, the summary counts them, links each to its field and takes the focus. Fix a field and its line goes; the summary goes with the last one.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var summary = '<div class="ds-alert ds-tone-error ds-errorsummary" data-ds-errorsummary tabindex="-1" hidden>' + h.icon('alertCircle', 20) +
      '<div class="ds-alert__text"><h2 class="ds-alert__title ds-errorsummary__title"></h2><ul class="ds-errorsummary__list"></ul></div></div>';
    return h.section('Add a device', '<form class="ds-form" novalidate data-demo="form">' + summary +
        '<div class="ds-form-grid ds-form-grid--2">' +
        errorSummaryField(h, { label: 'Device name', control: '<input class="ds-input" id="%ID%" name="name" required maxlength="20" spellcheck="false">' }) +
        errorSummaryField(h, { label: 'Serial number', control: '<input class="ds-input" id="%ID%" name="serial" required pattern="SN-[0-9]{4}" placeholder="SN-0000" data-demo="serial">' }) +
        errorSummaryField(h, { label: 'Owner email', control: '<input class="ds-input" id="%ID%" name="owner" type="email" required value="ada@">' }) +
        errorSummaryField(h, { label: 'Room', optional: true, control: '<input class="ds-input" id="%ID%" name="room">' }) +
        '</div><div class="ds-form-actions"><button class="ds-btn ds-btn--filled" type="submit">Add device</button><button class="ds-btn ds-btn--text" type="reset">Discard</button></div></form>',
      'Submit as it is: three problems. Fill them in, one by one. A serial of SN-0042 is taken on the server.') +

      h.section('As it looks', '<form class="ds-form" novalidate data-demo="static">' + summary.replace(' hidden', '') +
        errorSummaryField(h, { label: 'Asset tag', control: '<input class="ds-input" id="%ID%" name="tag" required>' }) + '</form>') +

      h.section('Keyboard', '<p class="ds-muted">After a submit the summary has the focus: <kbd class="ds-kbd">Tab</kbd> walks its links, <kbd class="ds-kbd">Enter</kbd> on one moves into its field.</p>');
  },

  wire: function (root, h) {
    var form = h.$('[data-demo="form"]', root);
    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var serial = h.$('[data-demo="serial"]', form);
        var summary = DS.core.get(h.$('.ds-errorsummary', form), 'errorsummary');
        // The server's own check, after the form's: the serial is taken.
        if (serial.value === 'SN-0042' && summary) {
          summary.set([{ field: serial, text: 'Serial number: SN-0042 is already registered to another device.' }]);
          return;
        }
        h.toast('Added (demo): nothing left the page.', 'success');
      });
    }
    var shown = h.$('[data-demo="static"] .ds-errorsummary', root);
    if (shown) {
      Promise.resolve().then(function () {
        var summary = DS.core.get(shown, 'errorsummary');
        if (summary) summary.validate({ focus: false });
      });
    }
  },
});
