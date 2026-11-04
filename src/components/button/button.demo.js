/*
 * The Button demo: every variant, icons and states, then the one place a
 * button may be red. Registered through SG.demo() (styleguide/sg-core.js).
 * Size, density, shape and touch come from the options panel around it, so
 * no button here carries a size class; the tone goes on the confirmation's
 * filled button only (D10). Fake work stands for what a project's save does.
 */
var LOOKS = [
  ['outlined', 'Export'],
  ['filled', 'Save'],
  ['tonal', 'Add entry'],
  ['elevated', 'Open map'],
  ['text', 'Details'],
  ['quiet', 'Filter'],
  ['ghost', 'Dismiss'],
];

function faces(h, rest, busy, done, failed) {
  return '<span class="ds-btn__faces"><span class="ds-btn__face">' + rest + '</span>' +
    '<span class="ds-btn__face ds-btn__face--busy" aria-hidden="true"><span class="ds-spinner ds-spinner--ink ds-sm"></span>' + busy + '</span>' +
    '<span class="ds-btn__face ds-btn__face--done" aria-hidden="true">' + h.icon('check', 16) + done + '</span>' +
    '<span class="ds-btn__face ds-btn__face--failed" aria-hidden="true">' + h.icon('alertCircle', 16) + failed + '</span></span>';
}

SG.demo('button', {
  title: 'Button',
  group: 'actions',
  need: 'Start an action: one look per weight, any size and density, busy and done states',
  lead: 'One component for every action: a pill at the default shape. The options panel changes size, density, shape and touch around the demo; the tone applies to a filled button in a confirmation, nowhere else.',
  options: { variants: LOOKS.map(function (look) { return look[0]; }), sizes: true, density: true, shape: true, tones: ['error'] },

  render: function (h) {
    var looks = LOOKS.filter(function (look) { return !h.variant || look[0] === h.variant; });
    var reason = h.uid('why');
    var panel = h.uid('filters');
    return h.section('Variants', '<div class="sg-row" data-demo="variants">' + looks.map(function (look) {
      return '<button class="ds-btn ds-btn--' + look[0] + '" type="button" title="' + h.esc(look[2]) + '">' + look[1] + '</button>';
    }).join('') + '</div>') +

      h.section('With icons', '<div class="sg-row" data-demo="icons">' +
        '<button class="ds-btn ds-btn--filled" type="button">' + h.icon('plus', 16) + 'New device</button>' +
        '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Edit" data-tip="Edit">' + h.icon('pencil', 20) + '</button>' +
        '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-btn--disc" type="button" aria-label="Minimize" data-tip="Minimize">' + h.icon('minimize', 20) + '</button>' +
        '<button class="ds-btn ds-btn--adaptive" type="button" data-tip="Download">' + h.icon('download', 16) + '<span class="ds-btn__label">Download</span></button>' +
        '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Copy link" data-demo="copy"><span class="ds-icon-swap" data-swap="a"><span class="ds-icon-swap__a">' + h.icon('copy', 20) + '</span><span class="ds-icon-swap__b">' + h.icon('check', 20) + '</span></span></button>' +
        '</div><p class="ds-muted">The adaptive button folds to its icon in a panel of 600px or less: narrow the width in the options panel.</p>') +

      h.section('States', '<div class="sg-row" data-demo="states">' +
        '<button class="ds-btn ds-btn--filled" type="button" disabled>Disabled</button>' +
        '<button class="ds-btn ds-btn--filled" type="button" aria-disabled="true" aria-describedby="' + reason + '">Publish</button>' +
        '<button class="ds-btn ds-btn--filled" type="button" data-demo="save">' + faces(h, 'Save changes', 'Saving', 'Saved', 'Not saved') + '</button>' +
        '<button class="ds-btn" type="button" data-demo="sync">' + faces(h, 'Sync now', 'Syncing', 'Synced', 'Not synced') + '</button>' +
        '<button class="ds-btn ds-btn--quiet" type="button" aria-pressed="false" data-demo="toggle">' + h.icon('filter', 16) + 'Only open</button>' +
        '<button class="ds-btn" type="button" aria-pressed="true" aria-disabled="true">' + h.icon('check', 16) + 'Approved</button>' +
        '</div><p class="ds-meta" id="' + reason + '">Publish stays focusable, so it can say why: fill in the serial number first.</p>') +

      h.section('Held press', '<div class="sg-row" data-demo="pressed">' + looks.map(function (look) {
        return '<button class="ds-btn ds-btn--' + look[0] + ' ds-pressed" type="button" data-ds-ripple="off" tabindex="-1">' + look[1] + '</button>';
      }).join('') + '</div>', 'The press as DS.ripple holds it (a static .ds-pressed): the squarer shape and the pressed layer. Press and hold a button above for the real one.') +

      h.section('Opens something', '<div class="sg-row">' +
        '<button class="ds-btn ds-btn--disclosure" type="button" aria-expanded="false" aria-controls="' + panel + '" data-demo="expand">' + h.icon('filter', 16) + 'Filters</button>' +
        '<button class="ds-btn" type="button" aria-haspopup="dialog" aria-expanded="true">Details (its sheet is open)</button>' +
        '<button class="ds-link-btn" type="button">Printer on floor 2</button>' +
        '<button class="ds-link-btn ds-link-btn--quiet" type="button">Edit columns</button>' +
        '<a class="ds-link--quiet" href="#">Show history</a>' +
        '</div><p class="ds-muted" id="' + panel + '" hidden>The filters of the list go here.</p>') +

      h.section('Full width', '<button class="ds-btn ds-btn--filled ds-btn--block" type="button">Sign in</button>') +

      h.section('Confirmation', '<div class="ds-card" data-demo="confirm" role="group" aria-label="Delete 3 devices?">' +
        '<h3 class="ds-card__title">Delete 3 devices?</h3><p class="ds-muted">Their history goes with them. This cannot be undone.</p>' +
        '<div class="ds-dialog__actions"><button class="ds-btn ds-btn--text" type="button">Cancel</button>' +
        '<button class="ds-btn ds-btn--filled' + (h.tone === 'error' ? ' ds-tone-error' : '') + '" type="button" data-demo="confirm-action">Delete 3 devices</button></div></div>',
        'The one red button: a destructive confirmation, in a confirm dialog or a type-to-confirm only, its label naming the consequence. Pick the error tone in the options panel.') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches each button; <kbd class="ds-kbd">Enter</kbd> or <kbd class="ds-kbd">Space</kbd> presses it. A busy, done or <code>aria-disabled</code> button ignores both.</p>');
  },

  wire: function (root, h) {
    var wait = function (fail) {
      return function () {
        return new Promise(function (resolve, reject) {
          setTimeout(function () { if (fail) reject(new Error('The device did not answer.')); else resolve(); }, h.slow(900));
        });
      };
    };
    root.addEventListener('click', function (event) {
      var button = event.target.closest('[data-demo]');
      if (!button) return;
      var kind = button.getAttribute('data-demo');
      if (kind === 'save') DS.motion.busy(button, wait(false));
      if (kind === 'sync') DS.motion.busy(button, wait(true), { failed: true }).catch(function (error) { h.toast(error.message, 'error'); });
      if (kind === 'toggle') button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true'));
      if (kind === 'copy') {
        var swap = h.$('.ds-icon-swap', button);
        swap.setAttribute('data-swap', 'b');
        setTimeout(function () { swap.setAttribute('data-swap', 'a'); }, h.slow(1200));
      }
      if (kind === 'expand') {
        var open = button.getAttribute('aria-expanded') !== 'true';
        button.setAttribute('aria-expanded', String(open));
        h.$('#' + button.getAttribute('aria-controls'), root).hidden = !open;
      }
      if (kind === 'confirm-action') h.toast('Deleted 3 devices.', 'success');
    });
  },
});
