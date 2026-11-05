/*
 * The Inline edit demo: device facts edited in place (a name, a room, a
 * note in a textarea), a save that fails, and the states. Registered through
 * SG.demo() (styleguide/sg-core.js). Size, density, shape and touch come
 * from the options panel; no tone.
 */
function inlineEdit(h, o) {
  var label = h.uid('ie-label');
  var control = o.multiline
    ? '<textarea class="ds-input ds-inlineedit__input" rows="3" aria-labelledby="' + label + '"' + (o.attrs || '') + '></textarea>'
    : '<input class="ds-input ds-inlineedit__input" aria-labelledby="' + label + '"' + (o.attrs || '') + '>';
  return '<div><dt id="' + label + '">' + o.label + '</dt><dd>' +
    '<div class="ds-inlineedit" data-ds-inlineedit' + (o.demo ? ' data-demo="' + o.demo + '"' : '') + (o.root || '') + '>' +
    '<div class="ds-inlineedit__view"><span class="ds-inlineedit__value">' + h.esc(o.value) + '</span>' +
    '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm ds-inlineedit__edit" type="button" aria-label="Edit ' + o.label.toLowerCase() + '">' + h.icon('pencil', 18) + '</button></div>' +
    '<div class="ds-inlineedit__form">' + control +
    '<span class="ds-inlineedit__actions"><button class="ds-btn ds-btn--tonal ds-sm ds-inlineedit__save" type="button"><span class="ds-btn__faces"><span class="ds-btn__face">Save</span>' +
    '<span class="ds-btn__face ds-btn__face--busy" aria-hidden="true"><span class="ds-spinner ds-spinner--ink ds-sm"></span>Saving</span></span></button>' +
    '<button class="ds-btn ds-btn--text ds-sm ds-inlineedit__cancel" type="button">Cancel</button></span></div>' +
    '<small class="ds-field__hint ds-field__hint--error ds-inlineedit__error" hidden></small></div></dd></div>';
}

SG.demo('inlineedit', {
  title: 'Inline edit',
  group: 'forms',
  need: 'Change one value where it is shown: text that turns into a field, saved with Enter, left with Escape',
  lead: 'A value turns into a field in place. Enter or Save saves (busy while the server answers), Escape or Cancel leaves it; a failed save keeps the field open with the reason in words.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    return h.section('Device facts', '<dl class="ds-facts" data-demo="facts">' +
        inlineEdit(h, { label: 'Device name', value: 'LAPTOP-0042', attrs: ' required maxlength="20" spellcheck="false"', demo: 'name' }) +
        inlineEdit(h, { label: 'Room', value: 'B 2.14', demo: 'room', root: ' data-ds-inlineedit-trim' }) +
        inlineEdit(h, { label: 'Owner', value: 'Ada Lovelace', demo: 'fail' }) +
        inlineEdit(h, { label: 'Note', value: 'Dock on the left desk.', multiline: true, demo: 'note' }) +
        '</dl>',
      'Edit the name and press Enter: the save takes a moment. A save of the owner fails, to show the error. An empty name is refused by the field itself.') +

      h.section('States', '<dl class="ds-facts" data-demo="states">' +
        inlineEdit(h, { label: 'Asset tag', value: 'AT-1042', demo: 'editing' }) +
        inlineEdit(h, { label: 'Serial number', value: 'SN-0042', demo: 'error' }) +
        inlineEdit(h, { label: 'Cost centre', value: '', demo: 'empty' }) +
        '</dl>') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Enter</kbd> on the edit button opens the field; <kbd class="ds-kbd">Enter</kbd> saves (<kbd class="ds-kbd">Ctrl</kbd>+<kbd class="ds-kbd">Enter</kbd> in a note), <kbd class="ds-kbd">Escape</kbd> leaves it. The focus returns to the edit button.</p>');
  },

  wire: function (root, h) {
    var later = function (ok, reason) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () { if (ok) resolve(); else reject(new Error(reason)); }, h.slow(900));
      });
    };
    root.addEventListener('ds:save', function (event) {
      var host = event.target.closest('[data-demo]');
      if (!host) return;
      if (host.getAttribute('data-demo') === 'fail') event.detail.wait(later(false, 'The directory did not answer. Try again in a minute.'));
      else event.detail.wait(later(true));
    });
    root.addEventListener('ds:save', function (event) {
      var host = event.target.closest('[data-demo]');
      if (host && host.getAttribute('data-demo') !== 'fail') setTimeout(function () { h.toast('Saved (demo).', 'success'); }, h.slow(950));
    });
    // The states: one open, one with an error.
    Promise.resolve().then(function () {
      var get = function (name) { var el = h.$('[data-demo="' + name + '"]', root); return el && DS.core.get(el, 'inlineedit'); };
      var editing = get('editing');
      if (editing) editing.edit();
      var error = h.$('[data-demo="error"]', root);
      if (error && DS.core.get(error, 'inlineedit')) {
        DS.core.get(error, 'inlineedit').edit();
        var input = h.$('input', error);
        input.value = 'SN-00?';
        input.setAttribute('aria-invalid', 'true');
        var message = h.$('.ds-inlineedit__error', error);
        message.id = h.uid('ie-error');
        input.setAttribute('aria-describedby', message.id);
        message.innerHTML = h.icon('alertCircle', 16) + 'Use letters, digits and dashes only.';
        message.hidden = false;
      }
      if (document.activeElement && root.contains(document.activeElement)) document.activeElement.blur();
    });
  },
});
