/*
 * The Split button demo: an action with related actions, a choice of the
 * action's variant, the looks and the blocked states. Registered through
 * SG.demo() (styleguide/sg-core.js). The variant picks the look of both
 * halves; size, density, shape and touch come from the options panel.
 */
var LOOKS = ['filled', 'tonal', 'outlined'];

SG.demo('splitbutton', {
  title: 'Split button',
  group: 'actions',
  need: 'Offer one main action with its variants or related actions in a menu, as one pill with two targets',
  lead: 'One pill, two targets: the action, and a menu of related actions or of the action\'s variants.',
  options: { variants: LOOKS, sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var looks = h.variant ? [h.variant] : LOOKS;
    var btn = function (look) { return 'ds-btn' + (look === 'outlined' ? '' : ' ds-btn--' + look); };
    var chevron = h.icon('chevronDown', 20, 'ds-chevron');
    var split = function (look, label, menu, extra) {
      return '<div class="ds-btn-group ds-split-btn" role="group" aria-label="' + label + '" data-ds-splitbutton' + (extra || '') + '>' +
        '<button class="' + btn(look) + ' ds-split-btn__action" type="button" data-demo="action"><span class="ds-split-btn__label">' + label + '</span></button>' +
        '<button class="' + btn(look) + ' ds-split-btn__toggle" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="' + menu + '">' + chevron + '</button></div>';
    };
    var related = function (id) {
      return '<div class="ds-menu" id="' + id + '" role="menu" aria-label="Save options" hidden>' +
        '<button class="ds-menu__item" role="menuitem" type="button" data-demo-item="Saved as a draft.">' + h.icon('fileText', 20) + '<span class="ds-menu__label">Save as draft</span></button>' +
        '<button class="ds-menu__item" role="menuitem" type="button" data-demo-item="Saved as a copy.">' + h.icon('duplicate', 20) + '<span class="ds-menu__label">Save as a copy</span></button>' +
        '<button class="ds-menu__item" role="menuitem" type="button" data-demo-item="Saved and closed.">' + h.icon('logout', 20) + '<span class="ds-menu__label">Save and close</span></button></div>';
    };
    var mergeMenu = h.uid('merge');
    return h.section('Related actions', '<div class="sg-row">' + looks.map(function (look) {
      var id = h.uid('save');
      return split(look, 'Save', id) + related(id);
    }).join('') + '</div>', 'The action does the work; the toggle opens the menu under it. Its name comes from the strings: "More options for Save".') +

      h.section('A choice', '<div class="sg-row">' +
        '<div class="ds-btn-group ds-split-btn" role="group" aria-label="Merge" data-ds-splitbutton data-demo="merge">' +
        '<button class="' + btn(looks[0]) + ' ds-split-btn__action" type="button" value="merge" data-demo="merge-action"><span class="ds-split-btn__label">Merge</span></button>' +
        '<button class="' + btn(looks[0]) + ' ds-split-btn__toggle" type="button" aria-label="Merge methods" aria-haspopup="menu" aria-expanded="false" aria-controls="' + mergeMenu + '">' + chevron + '</button></div>' +
        '<div class="ds-menu" id="' + mergeMenu + '" role="menu" aria-label="Merge method" data-ds-menu-checks hidden>' +
        '<button class="ds-menu__item" role="menuitemradio" type="button" aria-checked="true" value="merge">' + h.icon('check', 20, 'ds-menu__check') + '<span class="ds-menu__content"><span class="ds-menu__label">Merge</span><span class="ds-menu__description">Keep every commit.</span></span></button>' +
        '<button class="ds-menu__item" role="menuitemradio" type="button" aria-checked="false" value="squash">' + h.icon('check', 20, 'ds-menu__check') + '<span class="ds-menu__content"><span class="ds-menu__label">Squash and merge</span><span class="ds-menu__description">One commit for the whole change.</span></span></button>' +
        '<button class="ds-menu__item" role="menuitemradio" type="button" aria-checked="false" value="rebase">' + h.icon('check', 20, 'ds-menu__check') + '<span class="ds-menu__content"><span class="ds-menu__label">Rebase and merge</span><span class="ds-menu__description">Replay the commits on top.</span></span></button></div>' +
        '</div>', 'Radio items choose the action\'s variant: the label changes, the action\'s value follows, and the page hears ds:change.') +

      h.section('States', '<div class="sg-row">' +
        '<div class="ds-btn-group ds-split-btn" role="group" aria-label="Deploy"><button class="' + btn(looks[0]) + ' ds-split-btn__action" type="button" disabled><span class="ds-split-btn__label">Deploy</span></button>' +
        '<button class="' + btn(looks[0]) + ' ds-split-btn__toggle" type="button" aria-label="More deploy options" disabled>' + chevron + '</button></div>' +
        '</div>', 'Disabled: both halves.') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches the action, then the toggle. On the toggle <kbd class="ds-kbd">Enter</kbd>, <kbd class="ds-kbd">Space</kbd> or <kbd class="ds-kbd">↓</kbd> open the menu; <kbd class="ds-kbd">Escape</kbd> closes it and focus comes back to the toggle.</p>');
  },

  wire: function (root, h) {
    root.addEventListener('click', function (event) {
      var item = event.target.closest('[data-demo-item]');
      if (item) h.toast(item.getAttribute('data-demo-item'), 'success');
      var action = event.target.closest('[data-demo="action"]');
      if (action) h.toast('Saved.', 'success');
      var merge = event.target.closest('[data-demo="merge-action"]');
      if (merge) h.toast('Started: ' + merge.value + '.', 'success');
    });
  },
});
