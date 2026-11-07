/*
 * The Side sheet demo: the default and the wide panel, a head with a subtitle
 * and a foot with actions, and a busy save. Opening and closing come from the
 * system (data-ds-open, data-ds-close); wire() holds what a project writes.
 */
var DEVICES = [
  ['laptop-0042', 'LAPTOP-0042', 'Ada Lovelace', 'Building A, 1st floor', 'Laptop 14'],
  ['laptop-0043', 'LAPTOP-0043', 'Alan Turing', 'Building A, 2nd floor', 'Laptop 14'],
  ['tablet-0007', 'TABLET-0007', 'Grace Hopper', 'Building B, ground floor', 'Tablet 11'],
  ['phone-0112', 'PHONE-0112', 'Katherine Johnson', 'Building B, 1st floor', 'Phone 6'],
];

function facts(h, device) {
  return '<dl class="ds-facts ds-facts--rows"><div><dt>Owner</dt><dd>' + h.esc(device[2]) + '</dd></div>' +
    '<div><dt>Location</dt><dd>' + h.esc(device[3]) + '</dd></div><div><dt>Model</dt><dd>' + h.esc(device[4]) + '</dd></div></dl>';
}

function panel(h, id, wide, foot, resize) {
  return '<dialog class="ds-sheet" id="' + id + '" aria-labelledby="' + id + '-title"' + (resize ? ' data-ds-sheet' : '') + '>' +
    '<div class="ds-sheet__backdrop" data-ds-close></div><section class="ds-sheet__panel' + (wide ? ' ds-sheet__panel--wide' : '') + '">' +
    (resize ? '<div class="ds-sheet__resize" aria-label="Resize the sheet"></div>' : '') +
    '<div class="ds-sheet__head"><div class="ds-sheet__heading">' +
    '<h2 class="ds-sheet__title" id="' + id + '-title">LAPTOP-0042</h2>' +
    '<p class="ds-sheet__subtitle">Issued to Ada Lovelace</p></div>' +
    '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close" data-ds-close>' + h.icon('close', 20) + '</button></div>' +
    '<div class="ds-sheet__body" tabindex="0"><dl class="ds-facts"><div><dt>Owner</dt><dd>Ada Lovelace</dd></div>' +
    '<div><dt>Location</dt><dd>Building A, 1st floor</dd></div><div><dt>Model</dt><dd>Laptop 14</dd></div></dl>' +
    '<p class="ds-muted">The record of the device goes here.</p></div>' +
    (foot ? '<div class="ds-sheet__foot"><p class="ds-meta">Last saved today</p>' +
      '<button class="ds-btn ds-btn--text" type="button" data-ds-close>Cancel</button>' +
      '<button class="ds-btn ds-btn--filled" type="button" data-demo="save"><span class="ds-btn__faces"><span class="ds-btn__face">Save</span>' +
      '<span class="ds-btn__face ds-btn__face--busy" aria-hidden="true"><span class="ds-spinner ds-spinner--ink ds-sm"></span>Save</span></span></button></div>' : '') +
    '</section></dialog>';
}

SG.demo('sheet', {
  title: 'Side sheet',
  group: 'overlays',
  need: 'Show details or a form beside the page, in a panel from the side',
  options: { variants: ['default', 'wide'], sizes: false, density: true, shape: true, tones: false },
  lead: 'A panel beside the page: over it with a scrim (the modal sheet, from the bottom on phones), or docked next to the content, which narrows (push) or stays usable (inspector). The options panel changes density and shape around it; a sheet shows no meaning of its own, so it has no tone.',

  render: function (h) {
    var plain = h.uid('sheet');
    var wide = h.uid('wide');
    var foot = h.uid('foot');
    var sized = h.uid('sized');
    var push = h.uid('push');
    var inspector = h.uid('inspector');
    return h.section('Variants', '<div class="sg-row">' +
      (h.variant === 'wide' ? '' : '<button class="ds-btn" type="button" data-ds-open="#' + plain + '">Open a sheet</button>') +
      (h.variant === 'default' ? '' : '<button class="ds-btn" type="button" data-ds-open="#' + wide + '">Wide</button>') +
      '</div>' +
      (h.variant === 'wide' ? '' : panel(h, plain, false, false)) +
      (h.variant === 'default' ? '' : panel(h, wide, true, false))) +

      h.section('With a foot, busy while it saves', '<div class="sg-row"><button class="ds-btn" type="button" data-ds-open="#' + foot + '">Edit the record</button></div>' +
        panel(h, foot, false, true),
        'data-ds-busy keeps it open while the save runs: Escape, the backdrop and Cancel do nothing.') +

      h.section('Resizable', '<div class="sg-row"><button class="ds-btn" type="button" data-ds-open="#' + sized + '">Open a resizable sheet</button></div>' +
        panel(h, sized, false, false, true),
        'Drag the edge, or focus it and use the arrow keys, Home and End; a double click goes back to 560px. In a project data-ds-sheet-remember keeps the width for the next visit.') +

      h.section('Push', '<div class="sg-row"><button class="ds-btn" type="button" data-ds-open="#' + push + '" aria-expanded="false" aria-controls="' + push + '">' + h.icon('filter', 18) + 'Filters</button></div>' +
        '<div class="ds-sheet__layout" style="block-size:320px;border:1px solid var(--ds-line);border-radius:var(--ds-radius-card);overflow:hidden" data-demo="push-layout">' +
        '<div class="ds-sheet__main" style="padding:var(--ds-space-4)"><ul class="ds-list">' + DEVICES.map(function (device) {
          return '<li class="ds-list__item"><span class="ds-list__text"><span class="ds-list__title">' + device[1] + '</span><span class="ds-list__meta">' + h.esc(device[2]) + ', ' + h.esc(device[4]) + '</span></span></li>';
        }).join('') + '</ul></div>' +
        '<section class="ds-sheet__panel ds-sheet__panel--push" id="' + push + '" aria-labelledby="' + push + '-title" hidden>' +
        '<div class="ds-sheet__head"><h2 class="ds-sheet__title" id="' + push + '-title">Filters</h2>' +
        '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close" data-ds-close>' + h.icon('close', 20) + '</button></div>' +
        '<div class="ds-sheet__body"><label class="ds-check"><input type="checkbox" checked><span>Laptops</span></label>' +
        '<label class="ds-check"><input type="checkbox" checked><span>Tablets</span></label>' +
        '<label class="ds-check"><input type="checkbox"><span>Phones</span></label></div></section></div>',
        'The list narrows while the panel opens beside it; nothing is inert and focus moves into the panel. Escape closes it and focus goes back to the button.') +

      h.section('Inspector', '<div class="ds-sheet__layout" style="block-size:320px;border:1px solid var(--ds-line);border-radius:var(--ds-radius-card);overflow:hidden" data-demo="inspector-layout">' +
        '<div class="ds-sheet__main" style="padding:var(--ds-space-4)"><ul class="ds-list ds-list--interactive" aria-label="Devices" data-demo="inspector-list">' + DEVICES.map(function (device) {
          return '<li class="ds-list__item" data-ds-key="' + device[0] + '"><span class="ds-list__text"><span class="ds-list__title">' +
            '<button class="ds-list__action" type="button" data-device="' + device[0] + '" aria-controls="' + inspector + '">' + device[1] + '</button></span>' +
            '<span class="ds-list__meta">' + h.esc(device[2]) + '</span></span></li>';
        }).join('') + '</ul></div>' +
        '<section class="ds-sheet__panel ds-sheet__panel--inspector" id="' + inspector + '" aria-labelledby="' + inspector + '-title" hidden data-ds-sheet data-demo="inspector">' +
        '<div class="ds-sheet__resize" aria-label="Resize the details"></div>' +
        '<div class="ds-sheet__head"><div class="ds-sheet__heading"><h2 class="ds-sheet__title" id="' + inspector + '-title" aria-live="polite">' + DEVICES[0][1] + '</h2>' +
        '<p class="ds-sheet__subtitle">Device details</p></div>' +
        '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close" data-ds-close>' + h.icon('close', 20) + '</button></div>' +
        '<div class="ds-sheet__body" tabindex="0" data-demo="inspector-body">' + facts(h, DEVICES[0]) + '</div></section></div>',
        'Choose a row: the details show beside the list, which stays usable, and focus stays on the row. Another row only swaps the content; drag the edge to resize it.') +

      h.section('Keyboard', '<p class="ds-muted">Modal: focus moves in at once and <kbd class="ds-kbd">Tab</kbd> stays inside; <kbd class="ds-kbd">Escape</kbd> closes and focus is back on the button; the body scrolls with the arrow keys when it has focus. Docked: nothing is held, <kbd class="ds-kbd">Escape</kbd> closes the panel. The separator moves with <kbd class="ds-kbd">←</kbd> <kbd class="ds-kbd">→</kbd>, <kbd class="ds-kbd">Home</kbd> and <kbd class="ds-kbd">End</kbd>.</p>');
  },

  wire: function (root, h) {
    // The inspector: a row's action shows its device beside the list, which keeps focus.
    var inspector = h.$('[data-demo="inspector"]', root);
    var list = h.$('[data-demo="inspector-list"]', root);
    if (inspector && list) {
      list.addEventListener('click', function (event) {
        var action = event.target.closest('[data-device]');
        if (!action) return;
        var device = DEVICES.filter(function (entry) { return entry[0] === action.getAttribute('data-device'); })[0];
        h.$$('.ds-list__item', list).forEach(function (row) {
          if (row.getAttribute('data-ds-key') === device[0]) row.setAttribute('aria-current', 'true');
          else row.removeAttribute('aria-current');
        });
        h.$('.ds-sheet__title', inspector).textContent = device[1];
        DS.dom.morphHtml(h.$('[data-demo="inspector-body"]', inspector), facts(h, device));
        DS.overlay.open(inspector, { opener: action });
      });
      inspector.addEventListener('ds:close', function (event) {
        if (event.target !== inspector) return;
        h.$$('.ds-list__item', list).forEach(function (row) { row.removeAttribute('aria-current'); });
      });
    }
    var save = h.$('[data-demo="save"]', root);
    var sheet = save.closest('.ds-sheet');
    save.addEventListener('click', function () {
      sheet.setAttribute('data-ds-busy', '');
      DS.motion.busy(save, function () {
        return new Promise(function (resolve) { setTimeout(resolve, h.slow(800)); });
      }, { done: false }).then(function () {
        sheet.removeAttribute('data-ds-busy');
        DS.overlay.close(sheet, { reason: 'confirm' });
        h.toast('Saved LAPTOP-0042.');
      });
    });
    return function () {
      for (const docked of root.querySelectorAll('.ds-sheet__panel--push, .ds-sheet__panel--inspector')) {
        if (docked.getAttribute('data-state') === 'open') DS.overlay.close(docked);
      }
      for (const open of root.querySelectorAll('dialog[open]')) open.close();
    };
  },
});
