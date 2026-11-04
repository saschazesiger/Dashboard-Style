/*
 * The Snackbar demo: each kind, an action, a message that stays, a stack and
 * replacing by key, shown through DS.overlay.toast as a project shows them;
 * the static messages show the markup toast() builds. Fake failures stand for
 * what a project's save does.
 */
SG.demo('toast', {
  title: 'Snackbar',
  group: 'overlays',
  need: 'Confirm or report something briefly in a snackbar, with an optional action',
  lead: 'A short message at the bottom of the content panel. It keeps one size whatever the density around it; the options panel changes its shape.',
  options: { sizes: false, density: false, shape: true, tones: ['error', 'info'] },

  render: function (h) {
    var tone = h.tone === 'error' || h.tone === 'info' ? ' ds-tone-' + h.tone : '';
    var glyph = h.tone === 'error' ? 'alertCircle' : h.tone === 'info' ? 'info' : 'checkCircle';
    return h.section('Try them', '<div class="sg-row" data-demo="buttons">' +
      '<button class="ds-btn" type="button" data-toast-demo="saved">Saved</button>' +
      '<button class="ds-btn" type="button" data-toast-demo="info">Info</button>' +
      '<button class="ds-btn" type="button" data-toast-demo="error">Error, stays</button>' +
      '<button class="ds-btn" type="button" data-toast-demo="undo">With undo</button>' +
      '<button class="ds-btn" type="button" data-toast-demo="many">Four at once</button>' +
      '<button class="ds-btn" type="button" data-toast-demo="retry">A retry keeps one error</button>' +
      '<button class="ds-btn ds-btn--text" type="button" data-toast-demo="clear">Close all</button></div>') +

      h.section('The markup', '<div class="ds-stack" data-demo="static">' +
        '<div class="ds-toast' + tone + '">' + h.icon(glyph, 20) + '<span class="ds-toast__text">Saved. The record is visible to everyone now.</span></div>' +
        '<div class="ds-toast ds-toast--error">' + h.icon('alertCircle', 20) + '<span class="ds-toast__text">Could not save. Check the connection and try again.</span>' +
        '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-toast__close" type="button" aria-label="Close" data-tip="Close">' + h.icon('close', 20) + '</button></div>' +
        '<div class="ds-toast">' + h.icon('checkCircle', 20) + '<span class="ds-toast__text">3 devices deleted.</span>' +
        '<button class="ds-btn ds-btn--text ds-sm ds-toast__action" type="button">Undo</button>' +
        '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-toast__close" type="button" aria-label="Close" data-tip="Close">' + h.icon('close', 20) + '</button></div></div>',
        'Status is never colour alone: an icon and a word. A message is never focused by itself, and its text is announced.') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches a message\'s buttons where the region sits; focus inside the region pauses the timers, and a message that leaves hands focus on, never to the body.</p>');
  },

  wire: function (root, h) {
    var attempts = 0;
    var region = function () { return DS.overlay.toastRegion(document); };
    var show = {
      saved: function () { DS.overlay.toast(region(), 'Saved LAPTOP-0042.'); },
      info: function () { DS.overlay.toast(region(), 'The nightly sync runs at 02:30.', { kind: 'info' }); },
      error: function () { DS.overlay.toast(region(), 'Could not save the changes.', { kind: 'error' }); },
      undo: function () {
        DS.overlay.toast(region(), '3 devices deleted.', { action: { label: 'Undo', onClick: function () { DS.overlay.toast(region(), 'Restored 3 devices.'); } } });
      },
      many: function () {
        ['First', 'Second', 'Third', 'Fourth'].forEach(function (name) { DS.overlay.toast(region(), name + ' device saved.', { restart: false }); });
      },
      retry: function () {
        attempts += 1;
        DS.overlay.toast(region(), 'Could not save (attempt ' + attempts + ').', { kind: 'error', key: 'demo-save' });
      },
      clear: function () { DS.overlay.closeToasts(region()); },
    };
    root.addEventListener('click', function (event) {
      var button = event.target.closest('[data-toast-demo]');
      if (button) show[button.getAttribute('data-toast-demo')]();
    });
    return function () { DS.overlay.closeToasts(region()); };
  },
});
