/*
 * The Tag input demo: free labels, recipients checked against a pattern and
 * capped, the states. Registered through SG.demo() (styleguide/sg-core.js).
 * Size, density, shape and touch come from the options panel around it. The
 * behaviour is the system's (data-ds-taginput); wire() only shows the value.
 */
function tiField(h, id, label, hint, attrs, inputAttrs) {
  return '<div class="ds-field"><label class="ds-field__label" for="' + id + '">' + label + '</label>' +
    '<div class="ds-taginput"' + (attrs || '') + '><input class="ds-input ds-taginput__input" id="' + id + '" aria-describedby="' + id + '-hint"' + (inputAttrs || '') + '></div>' +
    '<p class="ds-field__hint" id="' + id + '-hint">' + hint + '</p></div>';
}

SG.demo('taginput', {
  title: 'Tag input',
  group: 'forms',
  need: 'Type free values as tags: labels, recipients, keywords; paste a list, check each, cap the count',
  lead: 'Enter or a comma turns the text into a chip; a pasted list becomes several. Backspace in the empty field removes the last one, and the arrow keys walk the chips.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var labels = h.uid('tags');
    var mails = h.uid('tags');
    var off = h.uid('tags');
    var ro = h.uid('tags');
    var bad = h.uid('tags');
    return '<div class="ds-form-grid ds-form-grid--2">' +
      h.section('Free labels', '<div class="ds-form">' +
        tiField(h, labels, 'Labels', 'Enter or a comma adds a label. A repeat is refused.', ' data-ds-taginput data-ds-value=\'["printer","floor-2","shared"]\' data-demo="labels"', ' placeholder="Add a label"') +
        '<p class="ds-field__hint" data-demo-out="labels" aria-live="off">printer, floor-2, shared</p></div>',
        'Paste "lab, kiosk; spare" to add three at once.') +
      h.section('Checked and capped', '<div class="ds-form">' +
        tiField(h, mails, 'Notify', 'Addresses only, up to 4.', ' data-ds-taginput data-ds-taginput-max="4" data-ds-taginput-pattern="[^@\\s]+@[^@\\s]+\\.[^@\\s]+" data-ds-value=\'["ada@example.com"]\' data-demo="mails"', ' type="email" inputmode="email" placeholder="name@example.com"') +
        '</div>',
        'A text that is no address stays typed and the message says why; at four the box is full.') +
      '</div>' +
      h.section('States', '<div class="ds-form-grid ds-form-grid--2">' +
        tiField(h, off, 'Disabled', 'The chips go with the field.', ' data-ds-taginput data-ds-value=\'["printer","floor-2"]\'', ' disabled') +
        tiField(h, ro, 'Read-only', 'The tags show, nothing changes.', ' data-ds-taginput data-ds-value=\'["printer","floor-2"]\'', ' readonly') +
        '<div class="ds-field"><label class="ds-field__label" for="' + bad + '">With an error</label>' +
        '<div class="ds-taginput" data-ds-taginput><input class="ds-input ds-taginput__input" id="' + bad + '" aria-invalid="true" aria-describedby="' + bad + '-error"></div>' +
        '<p class="ds-field__hint ds-field__hint--error" id="' + bad + '-error">' + h.icon('alertCircle', 16) + 'Add at least one label.</p></div>' +
        '</div>') +
      h.section('Narrow', '<div class="ds-form" style="max-inline-size: 320px;">' +
        tiField(h, h.uid('tags'), 'Keywords', 'The chips wrap; the field keeps a line of its own when it must.', ' data-ds-taginput data-ds-value=\'["battery","screen","keyboard","charger","dock station"]\'') + '</div>');
  },

  wire: function (root, h) {
    var labels = h.$('[data-demo="labels"]', root);
    var out = h.$('[data-demo-out="labels"]', root);
    labels.addEventListener('ds:change', function (event) {
      out.textContent = event.detail.value.length ? event.detail.value.join(', ') : 'No labels';
    });
  },
});
