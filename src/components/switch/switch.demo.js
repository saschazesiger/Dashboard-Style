/*
 * The Switch demo: on and off with their words, icons, busy, blocked, locked,
 * a hint and a list of settings. Registered through SG.demo()
 * (styleguide/sg-core.js). Size, density, shape and touch come from the
 * options panel around it. Fake work stands for what a project's save does.
 */
var WORDS = '<span class="ds-switch__state" aria-hidden="true"><span class="ds-switch__on">On</span><span class="ds-switch__off">Off</span></span>';

function row(name, attributes, track) {
  return '<label class="ds-switch"><input type="checkbox" role="switch" ' + (attributes || '') + '><span class="ds-switch__track" aria-hidden="true">' + (track || '') + '</span><span class="ds-switch__label">' + name + '</span>' + WORDS + '</label>';
}

function listRow(h, name, hint, meta, checked) {
  var label = h.uid('switch-name');
  var note = h.uid('switch-hint');
  return '<label class="ds-switch"><input type="checkbox" role="switch"' + (checked ? ' checked' : '') + ' aria-labelledby="' + label + '" aria-describedby="' + note + '"><span class="ds-switch__track" aria-hidden="true"></span>' +
    '<span class="ds-switch__label" id="' + label + '">' + name + '</span><small class="ds-switch__hint" id="' + note + '">' + hint + '</small>' +
    (meta ? '<span class="ds-switch__meta">' + meta + '</span>' : '') + WORDS + '</label>';
}

SG.demo('switch', {
  title: 'Switch',
  group: 'forms',
  need: 'Turn a setting on or off, alone or in a list of settings',
  lead: 'One setting, on or off, with its name and the state in a word, so it never shows through the handle alone. The options panel changes size, density, shape and touch around the demo.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var reason = h.uid('why');
    var icons = h.icon('close', 16, 'ds-switch__icon ds-switch__icon--off') + h.icon('check', 16, 'ds-switch__icon ds-switch__icon--on');
    return h.section('On and off', '<div class="ds-stack" data-demo="plain">' + row('Nightly sync', 'checked') + row('Email summary') + '</div>') +

      h.section('With icons', '<div class="ds-stack" data-demo="icons">' +
        '<label class="ds-switch ds-switch--icons"><input type="checkbox" role="switch" checked><span class="ds-switch__track" aria-hidden="true">' + icons + '</span><span class="ds-switch__label">Automatic updates</span></label>' +
        '<label class="ds-switch ds-switch--icons"><input type="checkbox" role="switch"><span class="ds-switch__track" aria-hidden="true">' + icons + '</span><span class="ds-switch__label">Beta channel</span></label>' +
        '<label class="ds-switch ds-switch--icons"><input type="checkbox" role="switch" checked disabled><span class="ds-switch__track" aria-hidden="true">' + icons + '</span><span class="ds-switch__label">Disabled, on</span></label></div>') +

      h.section('Busy', '<div class="ds-stack" data-demo="busy">' + row('Remote access', 'data-demo="save"', '<span class="ds-spinner ds-switch__spinner"></span>') +
        row('Remote access, waiting', 'checked aria-busy="true" aria-disabled="true"', '<span class="ds-spinner ds-switch__spinner"></span>') + '</div>',
        'While the page waits for the answer: aria-busy with aria-disabled on the input. The spinner shows after a moment, so a fast answer shows nothing.') +

      h.section('Blocked and locked', '<div class="ds-stack" data-demo="states">' + row('Disabled', 'disabled') + row('Disabled, on', 'checked disabled') +
        row('Blocked with a reason', 'aria-disabled="true" data-tip="Needs an admin"') +
        '<label class="ds-switch ds-switch--locked"><input type="checkbox" role="switch" checked aria-disabled="true" aria-describedby="' + reason + '"><span class="ds-switch__track" aria-hidden="true">' + h.icon('lock', 16, 'ds-switch__icon') + '</span><span class="ds-switch__label">Disk encryption</span><small class="ds-switch__hint" id="' + reason + '">Set by the device policy</small></label>' +
        '</div>') +

      h.section('List of settings', '<div class="ds-switch-list" data-demo="list">' +
        listRow(h, 'Email reports', 'Every Monday at 08:00', '<span class="ds-tag ds-tag--neutral">3 recipients</span>', true) +
        listRow(h, 'Push notifications', 'On this device only', '', false) +
        listRow(h, 'A weekly digest of every device that changed its owner, its place or its warranty', 'Long names wrap', '<span class="ds-badge ds-badge--neutral">12</span>', false) +
        '</div>', 'Narrow the width in the options panel: at 560px the extras wrap under the name.') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches each switch; <kbd class="ds-kbd">Space</kbd> toggles it. A blocked, busy or locked switch keeps its ring and ignores <kbd class="ds-kbd">Space</kbd>.</p>');
  },

  wire: function (root, h) {
    root.addEventListener('change', function (event) {
      var input = event.target;
      if (!input.matches('[data-demo="save"]')) return;
      input.setAttribute('aria-busy', 'true');
      input.setAttribute('aria-disabled', 'true');
      setTimeout(function () {
        input.removeAttribute('aria-busy');
        input.removeAttribute('aria-disabled');
      }, h.slow(1500));
    });
  },
});
