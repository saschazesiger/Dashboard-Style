/*
 * The Side sheet demo: the default and the wide panel, a head with a subtitle
 * and a foot with actions, and a busy save. Opening and closing come from the
 * system (data-ds-open, data-ds-close); wire() holds what a project writes.
 */
function panel(h, id, wide, foot) {
  return '<dialog class="ds-sheet" id="' + id + '" aria-labelledby="' + id + '-title">' +
    '<div class="ds-sheet__backdrop" data-ds-close></div><section class="ds-sheet__panel' + (wide ? ' ds-sheet__panel--wide' : '') + '">' +
    '<div class="ds-sheet__head"><div class="ds-sheet__heading">' +
    '<h2 class="ds-sheet__title" id="' + id + '-title">LAPTOP-0042</h2>' +
    '<p class="ds-sheet__subtitle">Issued to Ada Lovelace</p></div>' +
    '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close" data-ds-close>' + h.icon('close', 20) + '</button></div>' +
    '<div class="ds-sheet__body" tabindex="0"><dl class="ds-facts"><div><dt>Owner</dt><dd>Ada Lovelace</dd></div>' +
    '<div><dt>Location</dt><dd>Building A, 1st floor</dd></div><div><dt>Model</dt><dd>Latitude 7440</dd></div></dl>' +
    '<p class="ds-muted">The record of the device goes here.</p></div>' +
    (foot ? '<div class="ds-sheet__foot"><p class="ds-meta">Last saved today</p>' +
      '<button class="ds-btn ds-btn--text" type="button" data-ds-close>Cancel</button>' +
      '<button class="ds-btn ds-btn--filled" type="button" data-demo="save"><span class="ds-btn__faces"><span class="ds-btn__face">Save</span>' +
      '<span class="ds-btn__face ds-btn__face--busy" aria-hidden="true"><span class="ds-spinner ds-spinner--sm"></span>Save</span></span></button></div>' : '') +
    '</section></dialog>';
}

SG.demo('sheet', {
  title: 'Side sheet',
  group: 'overlays',
  need: 'Show details or a form beside the page, in a panel from the side',
  lead: 'A panel that slides in from the side, from the bottom on phones. The options panel changes density and shape around it; a sheet shows no meaning of its own, so it has no tone.',
  options: { variants: ['default', 'wide'], sizes: false, density: true, shape: true, tones: false },

  render: function (h) {
    var plain = h.uid('sheet');
    var wide = h.uid('wide');
    var foot = h.uid('foot');
    return h.section('Variants', '<div class="sg-row">' +
      (h.variant === 'wide' ? '' : '<button class="ds-btn" type="button" data-ds-open="#' + plain + '">Open a sheet</button>') +
      (h.variant === 'default' ? '' : '<button class="ds-btn" type="button" data-ds-open="#' + wide + '">Wide</button>') +
      '</div>' +
      (h.variant === 'wide' ? '' : panel(h, plain, false, false)) +
      (h.variant === 'default' ? '' : panel(h, wide, true, false))) +

      h.section('With a foot, busy while it saves', '<div class="sg-row"><button class="ds-btn" type="button" data-ds-open="#' + foot + '">Edit the record</button></div>' +
        panel(h, foot, false, true),
        'data-ds-busy keeps it open while the save runs: Escape, the backdrop and Cancel do nothing.') +

      h.section('Keyboard', '<p class="ds-muted">Focus moves in at once and <kbd class="ds-kbd">Tab</kbd> stays inside; <kbd class="ds-kbd">Escape</kbd> closes and focus is back on the button; the body scrolls with the arrow keys when it has focus.</p>');
  },

  wire: function (root, h) {
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
      for (const open of root.querySelectorAll('dialog[open]')) open.close();
    };
  },
});
