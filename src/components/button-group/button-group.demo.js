/*
 * The Button group demo: the three looks, icon buttons, toggles in a
 * group, the full-width group and the blocked states. Registered through
 * SG.demo() (styleguide/sg-core.js). Size, density, shape and touch come
 * from the options panel around the demo; the variant picks the look.
 */
var LOOKS = ['outlined', 'filled', 'tonal'];

SG.demo('button-group', {
  title: 'Button group',
  group: 'actions',
  need: 'Join related actions or toggles into one pill outline',
  lead: 'Related actions in one pill: the ends follow the shape, the inner corners are square and neighbours share one line.',
  options: { variants: LOOKS, sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var looks = h.variant ? [h.variant] : LOOKS;
    var btn = function (look) { return 'ds-btn' + (look === 'outlined' ? '' : ' ds-btn--' + look); };
    return h.section('Looks', looks.map(function (look) {
      return '<div class="sg-row"><div class="ds-btn-group" role="group" aria-label="Zoom (' + look + ')" data-demo="' + look + '">' +
        '<button class="' + btn(look) + '" type="button">' + h.icon('minimize', 16) + 'Out</button>' +
        '<button class="' + btn(look) + '" type="button">Fit</button>' +
        '<button class="' + btn(look) + '" type="button">' + h.icon('plus', 16) + 'In</button></div></div>';
    }).join('')) +

      h.section('Icon buttons', '<div class="sg-row">' + looks.map(function (look) {
        return '<div class="ds-btn-group" role="group" aria-label="Device (' + look + ')">' +
          '<button class="' + btn(look) + ' ds-btn--icon" type="button" aria-label="Restart" data-tip="Restart">' + h.icon('refresh', 20) + '</button>' +
          '<button class="' + btn(look) + ' ds-btn--icon" type="button" aria-label="Lock" data-tip="Lock">' + h.icon('lock', 20) + '</button>' +
          '<button class="' + btn(look) + ' ds-btn--icon" type="button" aria-label="Locate" data-tip="Locate">' + h.icon('mapPin', 20) + '</button></div>';
      }).join('') + '</div>') +

      h.section('Toggles', '<div class="sg-row"><div class="ds-btn-group ds-toggle-group" role="group" aria-label="View" data-ds-toggle-group="single" data-ds-toggle-group-required data-demo="toggles">' +
        '<button class="' + btn(looks[0]) + '" type="button" aria-pressed="true" value="day">Day</button>' +
        '<button class="' + btn(looks[0]) + '" type="button" aria-pressed="false" value="week">Week</button>' +
        '<button class="' + btn(looks[0]) + '" type="button" aria-pressed="false" value="month">Month</button></div></div>',
        'A toggle group (data-ds-toggle-group) with .ds-btn-group: the one that is on takes the tint inside the shared outline.') +

      h.section('Full width', '<div class="ds-btn-group ds-btn-group--block" role="group" aria-label="Ticket" data-demo="block">' +
        '<button class="' + btn(looks[0]) + '" type="button"><span class="ds-btn__label">Assign to me</span></button>' +
        '<button class="' + btn(looks[0]) + '" type="button"><span class="ds-btn__label">Waiting for reply</span></button>' +
        '<button class="' + btn(looks[0]) + '" type="button"><span class="ds-btn__label">Close ticket</span></button></div>',
        'The buttons share the line; a label that does not fit ends in an ellipsis. Narrow the width in the options panel.') +

      h.section('States', '<div class="sg-row"><div class="ds-btn-group" role="group" aria-label="Sync">' +
        '<button class="' + btn(looks[0]) + '" type="button">Sync now</button>' +
        '<button class="' + btn(looks[0]) + '" type="button" disabled>Pause</button>' +
        '<button class="' + btn(looks[0]) + '" type="button" aria-disabled="true" data-tip="Nothing to undo">Undo</button></div></div>') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches each button; <kbd class="ds-kbd">Enter</kbd> or <kbd class="ds-kbd">Space</kbd> presses it. The ring of the focused button lies over its neighbours.</p>');
  },
});
