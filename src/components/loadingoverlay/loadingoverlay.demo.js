/*
 * The Loading overlay demo: a card blocked while it saves, an import with
 * a determinate ring, a detail line and a cancel button, the opaque veil,
 * and the overlay shown in place (its look, without the delay). The page
 * around stays usable. wire() holds what a project writes: the fake work.
 */
function loFields(h, id) {
  return '<div class="ds-field"><label class="ds-field__label" for="' + id + '-owner">Owner</label><input class="ds-input" id="' + id + '-owner" value="Ada Lovelace"></div>' +
    '<div class="ds-field"><label class="ds-field__label" for="' + id + '-place">Location</label><input class="ds-input" id="' + id + '-place" value="Building A, 1st floor"></div>';
}

SG.demo('loadingoverlay', {
  title: 'Loading overlay',
  group: 'feedback',
  need: 'Block one region while work on it runs, with a spinner and a message, and keep the rest of the page usable',
  lead: 'A veil over one card, table or pane while its work runs: the region is blocked and busy, the rest of the page stays usable. It shows only after the loader delay, so a fast save shows nothing, and once shown it stays long enough to read.',
  options: { variants: ['default', 'opaque'], sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var save = h.uid('save');
    var opaque = h.variant === 'opaque' ? ' ds-loadingoverlay--opaque' : '';
    return h.section('Saving a card', '<div class="ds-grid-2">' +
      '<section class="ds-card" aria-labelledby="' + save + '-title" style="position:relative" data-demo="save-card">' +
      '<h2 class="ds-card__title" id="' + save + '-title">LAPTOP-0042</h2>' + loFields(h, save) +
      '<div class="sg-row"><button class="ds-btn ds-btn--filled" type="button" data-demo="save">Save</button></div>' +
      '<div class="ds-loadingoverlay' + opaque + '" hidden data-ds-loadingoverlay data-demo="save-overlay"><div class="ds-loadingoverlay__box" role="status">' +
      '<span class="ds-spinner" aria-hidden="true"></span><p class="ds-loadingoverlay__message">Saving LAPTOP-0042 ...</p></div></div></section>' +
      '<section class="ds-card" aria-labelledby="' + save + '-other"><h2 class="ds-card__title" id="' + save + '-other">Elsewhere on the page</h2>' +
      '<p class="ds-muted">This card stays usable while the other one saves.</p>' +
      '<div class="sg-row"><button class="ds-btn" type="button" data-demo="other">Still works</button></div></section></div>',
      'Save blocks the card: its fields are inert and the card says it is busy; focus moves to the overlay and comes back.') +

      h.section('Progress and cancel', '<section class="ds-card" aria-labelledby="' + save + '-import" style="position:relative" data-demo="import-card">' +
        '<h2 class="ds-card__title" id="' + save + '-import">Devices</h2><p class="ds-muted">2,030 devices in the list.</p>' +
        '<div class="sg-row"><button class="ds-btn" type="button" data-demo="import">' + h.icon('upload', 18) + 'Import devices</button></div>' +
        '<div class="ds-loadingoverlay' + opaque + '" hidden data-ds-loadingoverlay data-demo="import-overlay"><div class="ds-loadingoverlay__box" role="status">' +
        '<span class="ds-spinner ds-spinner--determinate" role="progressbar" aria-label="Import" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" style="--ds-progress: 0"></span>' +
        '<p class="ds-loadingoverlay__message">Importing devices ...</p><p class="ds-loadingoverlay__detail">0 of 2,030 rows</p>' +
        '<button class="ds-btn ds-btn--text" type="button" data-ds-loadingoverlay-cancel>Cancel</button></div></div></section>',
        'A known share as a ring, the figure in the detail line, and a cancel button (Escape cancels too).') +

      h.section('In place', '<section class="ds-card" aria-label="Preview" style="position:relative;min-block-size:220px">' +
        '<p class="ds-muted">The overlay as it shows, without the delay.</p>' +
        '<div class="ds-loadingoverlay' + opaque + '"><div class="ds-loadingoverlay__box" role="status">' +
        '<span class="ds-spinner" aria-hidden="true"></span><p class="ds-loadingoverlay__message">Loading the tickets ...</p>' +
        '<p class="ds-loadingoverlay__detail">Page 2 of 5</p></div></div></section>',
        'Markup without data-state shows after the loader delay on its own.') +

      h.section('Keyboard', '<p class="ds-muted">While a region is blocked nothing inside it takes focus; focus that was there moves to the cancel button or the overlay and comes back after. <kbd class="ds-kbd">Escape</kbd> cancels an overlay with a cancel button.</p>');
  },

  wire: function (root, h) {
    var save = h.$('[data-demo="save"]', root);
    var card = h.$('[data-demo="save-card"]', root);
    save.addEventListener('click', function () {
      DS.loadingoverlay.wait(card, new Promise(function (resolve) { setTimeout(resolve, h.slow(1600)); }), { done: 'Saved' })
        .then(function () { h.toast('Saved LAPTOP-0042.'); });
    });
    h.$('[data-demo="other"]', root).addEventListener('click', function () { h.toast('The rest of the page stays usable.'); });

    var importCard = h.$('[data-demo="import-card"]', root);
    var overlay = h.$('[data-demo="import-overlay"]', root);
    var timer = 0;
    h.$('[data-demo="import"]', root).addEventListener('click', function () {
      var veil = DS.loadingoverlay.show(importCard, { progress: 0, detail: '0 of 2,030 rows' });
      var rows = 0;
      clearInterval(timer);
      timer = setInterval(function () {
        rows = Math.min(2030, rows + 290);
        veil.set({ progress: rows / 2030, detail: rows.toLocaleString('en') + ' of 2,030 rows' });
        if (rows >= 2030) {
          clearInterval(timer);
          veil.set({ shown: false, done: 'Imported 2,030 devices' }).then(function () { h.toast('Imported 2,030 devices.'); });
        }
      }, h.slow(500));
    });
    overlay.addEventListener('ds:cancel', function () {
      clearInterval(timer);
      h.toast('Import cancelled.', 'info');
    });
    return function () { clearInterval(timer); };
  },
});
