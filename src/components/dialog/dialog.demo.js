/*
 * The Dialog demo: every size, the full-screen and bottom forms, a form
 * dialog, the promise dialogs and a dialog whose action is busy. Opening and
 * closing come from the system (data-ds-open, data-ds-close); wire() holds
 * only what a project writes: the fake work and the messages after it.
 */
var SIZES = [
  ['sm', 'Small', 'ds-dialog--sm', 'A short question: 320px.'],
  ['md', 'Default', '', 'The default: 400px.'],
  ['lg', 'Large', 'ds-dialog--lg', 'A list, a form or a confirmation with a field: 560px.'],
  ['xl', 'Extra large', 'ds-dialog--xl', 'A table or a long form: 720px.'],
];

function plain(h, id, classes, title, text) {
  var titleId = id + '-title';
  return '<dialog class="ds-dialog' + (classes ? ' ' + classes : '') + '" id="' + id + '" aria-labelledby="' + titleId + '">' +
    '<div class="ds-dialog__backdrop" data-ds-close></div><div class="ds-dialog__box">' +
    '<h2 class="ds-dialog__title" id="' + titleId + '">' + h.esc(title) + '</h2>' +
    '<p class="ds-dialog__text">' + h.esc(text) + '</p>' +
    '<div class="ds-dialog__actions"><button class="ds-btn ds-btn--text" type="button" data-ds-close>Cancel</button>' +
    '<button class="ds-btn ds-btn--filled" type="button" data-ds-close>Keep it</button></div></div></dialog>';
}

SG.demo('dialog', {
  title: 'Dialog',
  group: 'overlays',
  need: 'Ask for a decision or a short task that blocks the page until it is done',
  lead: 'A modal box over the whole window. The options panel changes density and shape around it; its size is the width of the box, because a size class would also change every control inside.',
  options: { variants: SIZES.map(function (size) { return size[0]; }), sizes: false, density: true, shape: true, tones: false },

  render: function (h) {
    var sizes = SIZES.filter(function (size) { return !h.variant || size[0] === h.variant; });
    var full = h.uid('full');
    var narrow = h.uid('narrow');
    var bottom = h.uid('bottom');
    var form = h.uid('form');
    var name = h.uid('name');
    var busy = h.uid('busy');
    var typed = h.uid('type');
    var sizeIds = sizes.map(function (size) { return h.uid('size-' + size[0]); });
    return h.section('Sizes', '<div class="sg-row" data-demo="sizes">' + sizes.map(function (size, index) {
      return '<button class="ds-btn" type="button" data-ds-open="#' + sizeIds[index] + '">' + size[1] + '</button>';
    }).join('') + '</div>' + sizes.map(function (size, index) {
      return plain(h, sizeIds[index], size[2], 'Archive LAPTOP-0042?', size[3] + ' It stays in the archive for a year.');
    }).join('')) +

      h.section('Questions', '<div class="sg-row" data-demo="questions">' +
        '<button class="ds-btn" type="button" data-demo="confirm">Confirm</button>' +
        '<button class="ds-btn" type="button" data-demo="destructive">Destructive</button>' +
        '<button class="ds-btn" type="button" data-demo="alert">Alert</button>' +
        '<button class="ds-btn" type="button" data-demo="prompt">Prompt</button></div>',
        'A destructive confirmation is the one place a filled button is red; its label names the consequence.') +

      h.section('Form', '<div class="sg-row"><button class="ds-btn" type="button" data-ds-open="#' + form + '">Rename the device</button></div>' +
        '<dialog class="ds-dialog" id="' + form + '" aria-labelledby="' + form + '-title" data-demo="form">' +
        '<div class="ds-dialog__backdrop" data-ds-close></div><form class="ds-dialog__box" data-ds-dialog-form>' +
        '<h2 class="ds-dialog__title" id="' + form + '-title">Rename the device</h2>' +
        '<div class="ds-dialog__body"><div class="ds-field"><label class="ds-field__label" for="' + name + '">Name</label>' +
        '<input class="ds-input" id="' + name + '" name="name" required autofocus value="LAPTOP-0042"></div></div>' +
        '<div class="ds-dialog__actions"><button class="ds-btn ds-btn--text" type="button" data-ds-close>Cancel</button>' +
        '<button class="ds-btn ds-btn--filled" type="submit"><span class="ds-btn__faces"><span class="ds-btn__face">Save</span>' +
        '<span class="ds-btn__face ds-btn__face--busy" aria-hidden="true"><span class="ds-spinner ds-spinner--ink ds-sm"></span>Save</span></span></button></div>' +
        '</form></dialog>',
        'The box is the form: Enter submits, the browser validates first, and it stays open while the save runs.') +

      h.section('Full screen and action sheet', '<div class="sg-row">' +
        '<button class="ds-btn" type="button" data-ds-open="#' + full + '">Full screen</button>' +
        '<button class="ds-btn" type="button" data-ds-open="#' + narrow + '">Full screen on phones</button>' +
        '<button class="ds-btn" type="button" data-ds-open="#' + bottom + '">Action sheet</button></div>' +
        [[full, 'ds-dialog--full'], [narrow, 'ds-dialog--full-narrow']].map(function (entry) {
          return '<dialog class="ds-dialog ' + entry[1] + '" id="' + entry[0] + '" aria-labelledby="' + entry[0] + '-title">' +
            '<div class="ds-dialog__backdrop" data-ds-close></div><div class="ds-dialog__box"><div class="ds-dialog__head">' +
            '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close" data-ds-close>' + h.icon('close', 20) + '</button>' +
            '<h2 class="ds-dialog__title" id="' + entry[0] + '-title">New ticket</h2>' +
            '<button class="ds-btn ds-btn--text" type="button" data-ds-close>Save</button></div>' +
            '<div class="ds-dialog__body"><p class="ds-dialog__text">The form of the ticket goes here.</p></div></div></dialog>';
        }).join('') +
        '<dialog class="ds-dialog ds-dialog--bottom" id="' + bottom + '" aria-labelledby="' + bottom + '-title">' +
        '<div class="ds-dialog__backdrop" data-ds-close></div><div class="ds-dialog__box">' +
        '<h2 class="ds-dialog__title" id="' + bottom + '-title">LAPTOP-0042</h2><div class="ds-dialog__list">' +
        '<button class="ds-menu__item" type="button" data-ds-close>' + h.icon('pencil', 20) + '<span class="ds-menu__label">Edit</span></button>' +
        '<button class="ds-menu__item" type="button" data-ds-close>' + h.icon('archive', 20) + '<span class="ds-menu__label">Archive</span></button></div>' +
        '<div class="ds-dialog__actions"><button class="ds-btn ds-btn--text" type="button" data-ds-close>Cancel</button></div></div></dialog>') +

      h.section('Busy', '<div class="sg-row"><button class="ds-btn" type="button" data-ds-open="#' + busy + '">Delete 3 devices</button></div>' +
        '<dialog class="ds-dialog" role="alertdialog" id="' + busy + '" aria-labelledby="' + busy + '-title" aria-describedby="' + busy + '-text" data-demo="busy">' +
        '<div class="ds-dialog__backdrop" data-ds-close></div><div class="ds-dialog__box">' +
        '<h2 class="ds-dialog__title" id="' + busy + '-title">Delete 3 devices?</h2>' +
        '<p class="ds-dialog__text" id="' + busy + '-text">They disappear from every list. This cannot be undone.</p>' +
        '<div class="ds-dialog__actions"><button class="ds-btn ds-btn--text" type="button" data-ds-close autofocus>Cancel</button>' +
        '<button class="ds-btn ds-btn--filled ds-tone-error" type="button" data-demo="busy-action"><span class="ds-btn__faces"><span class="ds-btn__face">Delete 3 devices</span>' +
        '<span class="ds-btn__face ds-btn__face--busy" aria-hidden="true"><span class="ds-spinner ds-spinner--ink ds-sm"></span>Delete 3 devices</span></span></button></div></div></dialog>',
        'Escape, the backdrop and Cancel do nothing while the action runs.') +

      h.section('Type the name to confirm', '<div class="sg-row"><button class="ds-btn" type="button" data-ds-open="#' + typed + '" data-demo="type-open">Delete LAPTOP-0042</button></div>' +
        '<dialog class="ds-dialog ds-dialog--lg" id="' + typed + '" role="alertdialog" aria-labelledby="' + typed + '-title" aria-describedby="' + typed + '-text" data-demo="type"><div class="ds-dialog__backdrop" data-ds-close></div>' +
        '<div class="ds-dialog__box"><h2 class="ds-dialog__title" id="' + typed + '-title">Delete LAPTOP-0042 for good?</h2>' +
        '<div class="ds-dialog__body"><p class="ds-dialog__text" id="' + typed + '-text">Its history, tickets and documents go with it. This cannot be undone.</p>' +
        '<div class="ds-alert ds-tone-warning">' + h.icon('alert', 20) + '<span class="ds-alert__text">The device is still assigned to Ada Lovelace.</span></div>' +
        '<div class="ds-field"><label class="ds-field__label" for="' + typed + '-field">Type LAPTOP-0042 to confirm</label><input class="ds-input" id="' + typed + '-field" autocomplete="off" spellcheck="false" autocapitalize="off" autofocus data-demo="type-field"></div></div>' +
        '<div class="ds-dialog__actions"><button class="ds-btn ds-btn--text" type="button" data-ds-close data-demo="type-cancel">Cancel</button>' +
        '<button class="ds-btn ds-btn--filled ds-tone-error" type="button" aria-disabled="true" data-tip="Type the name first" data-demo="type-ok"><span class="ds-btn__faces"><span class="ds-btn__face">Delete for good</span>' +
        '<span class="ds-btn__face ds-btn__face--busy" aria-hidden="true"><span class="ds-spinner ds-spinner--ink ds-sm"></span>Deleting</span></span></button></div></div></dialog>',
        'The action stays blocked (aria-disabled, with its reason) until the name is typed; Enter runs it. While it runs, Escape and Cancel wait and the field is read-only.') +

      h.section('Contained, in a 360px frame', '<div style="position:relative;block-size:360px;overflow:hidden" data-demo="contained">' +
        '<div class="ds-dialog ds-dialog--contained"><div class="ds-dialog__backdrop" data-ds-close></div>' +
        '<div class="ds-dialog__box" role="group" aria-label="Notify people"><h2 class="ds-dialog__title">Notify people</h2>' +
        '<div class="ds-dialog__body"><p class="ds-dialog__text">They get an email when LAPTOP-0042 is back.</p>' +
        ['Ada Lovelace', 'Alan Turing', 'Grace Hopper', 'Katherine Johnson', 'Margaret Hamilton', 'Edsger Dijkstra', 'Barbara Liskov', 'Donald Knuth', 'Frances Allen', 'John Backus', 'Ada Lovelace (deputy)', 'Alan Turing (deputy)'].map(function (name, index) {
          return '<label class="ds-check"><input type="checkbox"' + (index < 2 ? ' checked' : '') + '><span>' + name + '</span></label>';
        }).join('') + '</div>' +
        '<div class="ds-dialog__actions"><button class="ds-btn ds-btn--text" type="button">Cancel</button><button class="ds-btn ds-btn--filled" type="button">Notify 2 people</button></div></div></div></div>',
        'Div markup covers its positioned container instead of the window (a dialog inside an embedded widget), shown here in place: only the body scrolls, title and actions stay.') +

      h.section('Keyboard', '<p class="ds-muted">Focus moves in at once and <kbd class="ds-kbd">Tab</kbd> stays inside; <kbd class="ds-kbd">Escape</kbd> closes and focus is back on the button; <kbd class="ds-kbd">Enter</kbd> submits a form dialog; the arrow keys move through an action sheet.</p>');
  },

  wire: function (root, h) {
    var work = function (fail) {
      return function () {
        return new Promise(function (resolve, reject) {
          setTimeout(function () { if (fail) reject(new Error('The device did not answer.')); else resolve(); }, h.slow(800));
        });
      };
    };
    var on = function (name, run) {
      h.$('[data-demo="' + name + '"]', root).addEventListener('click', function (event) { run(event.currentTarget); });
    };
    on('confirm', function (button) {
      DS.overlay.confirm({ title: 'Archive 3 devices?', text: 'They stay in the archive for a year.', confirmLabel: 'Archive devices', opener: button })
        .then(function (yes) { if (yes) h.toast('Archived 3 devices.'); });
    });
    on('destructive', function (button) {
      DS.overlay.confirm({ title: 'Delete 3 devices?', text: 'They disappear from every list. This cannot be undone.', confirmLabel: 'Delete devices', destructive: true, opener: button, onConfirm: work(false) })
        .then(function (yes) { if (yes) h.toast('Deleted 3 devices.'); });
    });
    on('alert', function (button) {
      DS.overlay.alert({ title: 'Export ready', text: 'The file is in your downloads.', opener: button });
    });
    on('prompt', function (button) {
      DS.overlay.prompt({ title: 'Rename', label: 'Name', value: 'LAPTOP-0042', input: { required: true }, opener: button })
        .then(function (value) { if (value) h.toast('Renamed to ' + value + '.'); });
    });
    var form = h.$('[data-demo="form"]', root);
    DS.dialog.form(form, { onSubmit: work(false), errorText: 'Could not rename the device.' });
    form.addEventListener('ds:close', function (event) {
      if (event.target === form && event.detail.reason === 'submit') h.toast('Saved.');
    });
    // Type the name to confirm: what a page writes around the dialog (dialog.md, the type-to-confirm pattern).
    var typedDialog = h.$('[data-demo="type"]', root);
    var typedField = h.$('[data-demo="type-field"]', root);
    var typedOk = h.$('[data-demo="type-ok"]', root);
    var typedCancel = h.$('[data-demo="type-cancel"]', root);
    var typedReady = function () { return typedField.value.trim() === 'LAPTOP-0042'; };
    typedField.addEventListener('input', function () {
      typedOk.setAttribute('aria-disabled', String(!typedReady()));
      if (typedReady()) typedOk.removeAttribute('data-tip'); else typedOk.setAttribute('data-tip', 'Type the name first');
    });
    var typedRun = function () {
      if (!typedReady() || typedDialog.hasAttribute('data-ds-busy')) return;
      typedDialog.setAttribute('data-ds-busy', '');
      typedField.readOnly = true;
      typedCancel.setAttribute('aria-disabled', 'true');
      DS.motion.busy(typedOk, work(false), { done: false }).then(function () {
        typedDialog.removeAttribute('data-ds-busy');
        typedField.readOnly = false;
        typedCancel.removeAttribute('aria-disabled');
        DS.overlay.close(typedDialog, { reason: 'confirm' });
        h.toast('LAPTOP-0042 deleted.');
      });
    };
    typedField.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' && !event.isComposing) { event.preventDefault(); typedRun(); }
    });
    typedOk.addEventListener('click', function (event) { if (event.detail < 2) typedRun(); });
    var busy = h.$('[data-demo="busy"]', root);
    var action = h.$('[data-demo="busy-action"]', root);
    var cancel = h.$('.ds-dialog__actions [data-ds-close]', busy);
    action.addEventListener('click', function () {
      busy.setAttribute('data-ds-busy', '');
      cancel.setAttribute('aria-disabled', 'true');
      DS.motion.busy(action, work(false), { done: false }).then(function () {
        busy.removeAttribute('data-ds-busy');
        cancel.removeAttribute('aria-disabled');
        DS.overlay.close(busy, { reason: 'confirm' });
        h.toast('Deleted 3 devices.');
      });
    });
    return function () {
      for (const open of root.querySelectorAll('dialog[open]')) open.close();
    };
  },
});
