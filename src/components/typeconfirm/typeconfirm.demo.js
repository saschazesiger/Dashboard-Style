/*
 * The Type-to-confirm demo: deleting a device from its page (a dialog
 * opened with data-ds-open), a delete that fails, and the dialog's states
 * shown inline. Registered through SG.demo() (styleguide/sg-core.js). Size,
 * density, shape and touch come from the options panel; the confirm
 * button's error tone is the D10 exception, not an option.
 */
function typeConfirmBox(h, o) {
  var title = h.uid('tc-title');
  var text = h.uid('tc-text');
  var field = h.uid('tc-field');
  return '<form class="ds-dialog__box ds-typeconfirm" data-ds-typeconfirm="' + h.esc(o.name) + '"' + (o.box || '') + '>' +
    '<h2 class="ds-dialog__title" id="' + title + '">Delete ' + h.esc(o.name) + '?</h2>' +
    '<p class="ds-dialog__text" id="' + text + '">' + o.text + '</p>' +
    '<div class="ds-field"><label class="ds-field__label ds-typeconfirm__label" for="' + field + '"></label>' +
    '<input class="ds-input ds-typeconfirm__input" id="' + field + '" autocomplete="off" spellcheck="false" autocapitalize="off"' + (o.value ? ' value="' + h.esc(o.value) + '"' : '') + '>' +
    '<small class="ds-field__hint ds-field__hint--error ds-typeconfirm__error" hidden></small></div>' +
    '<div class="ds-dialog__actions"><button class="ds-btn ds-btn--text" type="button" data-ds-close autofocus>Cancel</button>' +
    '<button class="ds-btn ds-btn--filled ds-tone-error ds-typeconfirm__confirm" type="submit"><span class="ds-btn__faces"><span class="ds-btn__face">' + o.action + '</span>' +
    '<span class="ds-btn__face ds-btn__face--busy" aria-hidden="true"><span class="ds-spinner ds-spinner--ink ds-sm"></span>Deleting</span></span></button></div></form>';
}

function typeConfirmDialog(h, o) {
  var id = h.uid('tc-dialog');
  var box = typeConfirmBox(h, o);
  var title = /id="([^"]+)"/.exec(box.slice(box.indexOf('ds-dialog__title')))[1];
  var text = /id="([^"]+)"/.exec(box.slice(box.indexOf('ds-dialog__text')))[1];
  return '<button class="ds-btn ds-btn--outlined" type="button" data-ds-open="#' + id + '">' + h.icon('trash', 18) + o.open + '</button>' +
    '<dialog class="ds-dialog" id="' + id + '" role="alertdialog" aria-labelledby="' + title + '" aria-describedby="' + text + '" data-demo="' + o.demo + '">' +
    '<div class="ds-dialog__backdrop" data-ds-close></div>' + box + '</dialog>';
}

SG.demo('typeconfirm', {
  title: 'Type-to-confirm',
  group: 'forms',
  need: 'Guard a destructive action: the person types the name of what goes before the red button works',
  lead: 'For what cannot be undone: the red button of the confirm dialog waits until the name has been typed. It stays in the tab order and says it is unavailable; paste works.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    return h.section('Delete a device', '<div class="ds-action-bar">' +
        typeConfirmDialog(h, { name: 'LAPTOP-0042', open: 'Delete device', action: 'Delete device', demo: 'delete', text: 'Its history and its 3 open tickets go with it. This cannot be undone.' }) +
        typeConfirmDialog(h, { name: 'ROUTER-B', open: 'Delete router (fails)', action: 'Delete router', demo: 'fail', text: 'Every device behind it goes offline. This cannot be undone.' }) +
        '</div>', 'The second delete fails, to show the error in the dialog.') +

      h.section('The dialog, inline', '<div class="ds-form-grid ds-form-grid--2" data-demo="inline">' +
        '<div style="position:relative;block-size:380px;overflow:hidden"><div class="ds-dialog ds-dialog--contained" data-demo="waiting"><div class="ds-dialog__backdrop"></div>' + typeConfirmBox(h, { name: 'LAPTOP-0042', action: 'Delete device', text: 'Waiting for the name: the red button is unavailable.', box: ' role="alertdialog" aria-label="Delete LAPTOP-0042, waiting"' }) + '</div></div>' +
        '<div style="position:relative;block-size:380px;overflow:hidden"><div class="ds-dialog ds-dialog--contained" data-demo="matched"><div class="ds-dialog__backdrop"></div>' + typeConfirmBox(h, { name: 'LAPTOP-0042', action: 'Delete device', value: 'LAPTOP-0042', text: 'The name matches: the red button works.', box: ' role="alertdialog" aria-label="Delete LAPTOP-0042, matched"' }) + '</div></div>' +
        '</div>') +

      h.section('Keyboard', '<p class="ds-muted">The dialog opens on Cancel. <kbd class="ds-kbd">Tab</kbd> reaches the field; type the name, then <kbd class="ds-kbd">Enter</kbd> deletes. <kbd class="ds-kbd">Escape</kbd> closes the dialog.</p>');
  },

  wire: function (root, h) {
    root.addEventListener('ds:confirm', function (event) {
      var dialog = event.target.closest('dialog');
      if (!dialog) {
        // The inline boxes stand for the dialog: nothing goes.
        event.preventDefault();
        h.toast('Deleted (demo): nothing left the page.', 'success');
        return;
      }
      var fail = dialog.getAttribute('data-demo') === 'fail';
      event.detail.wait(new Promise(function (resolve, reject) {
        setTimeout(function () {
          if (fail) reject(new Error('The router is still in use by 12 devices. Move them first.'));
          else {
            resolve();
            h.toast('Deleted LAPTOP-0042 (demo).', 'success');
          }
        }, h.slow(900));
      }));
    });
  },
});
