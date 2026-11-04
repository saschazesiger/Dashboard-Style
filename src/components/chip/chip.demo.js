/*
 * The Chip demo: filter chips (checkboxes and radios), action and input chips,
 * wrapping labels, the states and the tones. Registered through SG.demo()
 * (styleguide/sg-core.js). Size, density, shape and touch come from the
 * options panel around it; the tone goes on the chips themselves (an
 * inherited one is ignored).
 */
var FILTERS = ['Active', 'In storage', 'Retired'];

function filter(h, type, name, label, attributes, cls) {
  return '<label class="ds-chip' + (cls ? ' ' + cls : '') + '"><input class="ds-chip__input" type="' + type + '" name="' + name + '" ' + (attributes || '') + '><span class="ds-chip__body">' + h.icon('check', 18, 'ds-chip__check') + '<span>' + label + '</span></span></label>';
}

function inputChips(h) {
  return ['Building C, second floor', 'Laptops', 'Warranty ending this quarter'].map(function (name) {
    return '<button class="ds-chip ds-chip--input" type="button" data-ds-key="' + h.esc(name) + '" data-tip="' + h.esc(name) + '"><span class="ds-chip__body"><span class="ds-chip__label"><span class="ds-sr">Remove filter </span>' + h.esc(name) + '</span>' + h.icon('close', 18, 'ds-chip__trailing') + '</span></button>';
  }).join('');
}

SG.demo('chip', {
  title: 'Chips',
  group: 'forms',
  need: 'Filter a list, pick a few options or hold entered values as small pills',
  lead: 'Small pills on native checkboxes, radios or buttons. A selected chip shows the tint and a check, never the tint alone. The options panel changes size, density, shape and touch around the demo; pick a tone to see it on the chips that carry one.',
  options: { sizes: true, density: true, shape: true, tones: true },

  render: function (h) {
    var status = h.uid('status');
    var age = h.uid('age');
    var tone = h.tone ? 'ds-tone-' + h.tone : '';
    return h.section('Filter chips', '<fieldset class="ds-chips" data-demo="filters"><legend class="ds-sr">Status</legend>' +
        FILTERS.map(function (name, index) { return filter(h, 'checkbox', status, name, index ? '' : 'checked', tone); }).join('') +
        '<span class="ds-chips__divider" aria-hidden="true"></span>' +
        filter(h, 'radio', age, 'Older than 4 years', 'checked', tone) + filter(h, 'radio', age, 'Newer', '', tone) + '</fieldset>') +

      h.section('Action and input chips', '<div class="ds-chips" role="group" aria-label="Active filters" data-demo="input-chips">' + inputChips(h) +
        '<button class="ds-btn ds-btn--text ds-sm" type="button" data-demo="clear">Clear filters</button></div>' +
        '<div class="ds-chips" role="group" aria-label="Suggestions" data-demo="action-chips">' +
        '<button class="ds-chip' + (tone ? ' ' + tone : '') + '" type="button"><span class="ds-chip__body">' + h.icon('user', 18, 'ds-chip__icon') + '<span class="ds-chip__label">Only my devices</span></span></button>' +
        '<button class="ds-chip" type="button"><span class="ds-chip__body"><span class="ds-chip__label">Not seen this month</span></span></button></div>') +

      h.section('Long suggestions', '<div class="ds-chips ds-chips--wrap" role="group" aria-label="Long suggestions">' +
        '<button class="ds-chip" type="button"><span class="ds-chip__body"><span class="ds-chip__label">Show the devices that were not seen this month and whose warranty ends this quarter</span></span></button>' +
        '<button class="ds-chip" type="button"><span class="ds-chip__body"><span class="ds-chip__label">One line</span></span></button></div>',
        '.ds-chips--wrap lets a long label wrap inside the chip; a one-line chip keeps its height. Narrow the width to see it.') +

      h.section('States', '<fieldset class="ds-chips" data-demo="states"><legend class="ds-sr">States</legend>' +
        filter(h, 'checkbox', status + '-s', 'Disabled', 'disabled') + filter(h, 'checkbox', status + '-s', 'Disabled, selected', 'disabled checked') +
        filter(h, 'checkbox', status + '-s', 'Blocked with a reason', 'aria-disabled="true" data-tip="Needs an admin"') +
        '<button class="ds-chip" type="button" disabled><span class="ds-chip__body"><span class="ds-chip__label">Disabled action</span></span></button></fieldset>') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches each chip; <kbd class="ds-kbd">Space</kbd> toggles a filter chip, the arrow keys move within radio chips; <kbd class="ds-kbd">Enter</kbd> presses an action chip.</p>');
  },

  wire: function (root, h) {
    root.addEventListener('click', function (event) {
      var row = h.$('[data-demo="input-chips"]', root);
      var chip = event.target.closest('.ds-chip--input');
      var clear = event.target.closest('[data-demo="clear"]');
      if (chip) DS.motion.flip(row, function () { chip.remove(); });
      if (clear) DS.motion.flip(row, function () { h.$$('.ds-chip--input', row).forEach(function (each) { each.remove(); }); });
      if (clear && clear.textContent === 'Clear filters') clear.textContent = 'Restore filters';
      else if (clear) { DS.dom.morphHtml(row, inputChips(h) + clear.outerHTML.replace('Restore filters', 'Clear filters')); }
    });
  },
});
