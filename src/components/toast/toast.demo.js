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

      h.section('Waiting, progress and the stack', '<div class="sg-row" data-demo="work">' +
        '<button class="ds-btn" type="button" data-toast-demo="promise">Save (works)</button>' +
        '<button class="ds-btn" type="button" data-toast-demo="promiseFail">Save (fails)</button>' +
        '<button class="ds-btn" type="button" data-toast-demo="progress">Upload 3 files</button>' +
        '<label class="ds-switch"><input type="checkbox" role="switch" data-toast-stack><span class="ds-switch__track" aria-hidden="true"></span><span class="ds-switch__label">Stack the messages</span></label></div>',
        'A waiting message turns into its outcome in place; a progress message moves its bar and ends the same way. Stacked, the messages sit one behind the other; focus or a click expands them, hover never does.') +

      h.section('Waiting and progress markup', '<div class="ds-stack" data-demo="work-static">' +
        '<div class="ds-toast" aria-busy="true"><span class="ds-spinner ds-toast__spinner" aria-hidden="true"></span><span class="ds-toast__text">Saving LAPTOP-0042</span>' +
        '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-toast__close" type="button" aria-label="Close" data-tip="Close">' + h.icon('close', 20) + '</button></div>' +
        '<div class="ds-toast ds-toast--progress"><div class="ds-toast__body"><span class="ds-toast__text">Uploading 3 files</span>' +
        '<div class="ds-progress ds-progress--flat" style="--ds-progress: 0.4"><div class="ds-progress__track" role="progressbar" aria-label="Uploading 3 files" aria-valuemin="0" aria-valuemax="100" aria-valuenow="40"><div class="ds-progress__bar"></div></div></div></div>' +
        '<span class="ds-toast__value" aria-hidden="true">40%</span>' +
        '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-toast__close" type="button" aria-label="Close" data-tip="Close">' + h.icon('close', 20) + '</button></div></div>') +

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
      promise: function () {
        DS.toast.promise(region(), later(1200, true), { pending: 'Saving LAPTOP-0042', success: 'Saved LAPTOP-0042.' });
      },
      promiseFail: function () {
        DS.toast.promise(region(), later(1200, false), { pending: 'Saving LAPTOP-0042', error: 'Could not save LAPTOP-0042. Try again.' });
      },
      progress: function () {
        var upload = DS.toast.progress(region(), 'Uploading 3 files', { value: 0 });
        var share = 0;
        var step = function () {
          share += 0.2;
          if (share >= 1) { upload.done('3 files uploaded.'); return; }
          upload.set(share, share > 0.6 ? 'Uploading the last file' : undefined);
          timer = setTimeout(step, h.slow(500));
        };
        var timer = setTimeout(step, h.slow(500));
        timers.push(function () { clearTimeout(timer); });
      },
    };
    var timers = [];
    // A fake save: resolves or fails after a while, at the styleguide's speed.
    var later = function (ms, works) {
      return new Promise(function (resolve, reject) {
        var id = setTimeout(function () { if (works) resolve(); else reject(new Error('offline')); }, h.slow(ms));
        timers.push(function () { clearTimeout(id); });
      });
    };
    var stack = h.$('[data-toast-stack]', root);
    stack.checked = region().classList.contains('ds-toasts--stack');
    stack.addEventListener('change', function () { region().classList.toggle('ds-toasts--stack', stack.checked); });
    root.addEventListener('click', function (event) {
      var button = event.target.closest('[data-toast-demo]');
      if (button) show[button.getAttribute('data-toast-demo')]();
    });
    return function () {
      timers.forEach(function (stop) { stop(); });
      region().classList.remove('ds-toasts--stack');
      DS.overlay.closeToasts(region());
    };
  },
});
