/*
 * The combobox's motion of 3.0: the press of its clear button, and the list
 * of a combobox the system drives (DS.combobox). The list and the toggle's
 * chevron of 2.x stay in styleguide/lab.js.
 */
SG_LAB.add({
  id: 'combobox-clear',
  group: 'controls',
  title: 'Combobox clear button',
  note: 'The twin of the toggle, but in the tab order. Pressed it turns squarer to <code>--ds-radius-action-pressed</code> in <code>--ds-dur-micro</code> and springs back over <code>--ds-dur-medium</code>. Tab to it for the focus ring, which rests one width further out and snaps in on <code>--ds-dur-fast</code>.',
  shows: ['.ds-combo__clear', '--ds-radius-action-pressed', '--ds-dur-micro', '--ds-dur-medium', '--ds-dur-fast', '--ds-ease-spatial'],
  html: '<div class="ds-combo" style="inline-size: 280px;"><input class="ds-input ds-combo__input" role="combobox" aria-label="Model" aria-expanded="false" value="Laptop 14"><button class="ds-combo__clear" type="button" aria-label="Clear model"></button><button class="ds-combo__toggle" type="button" tabindex="-1" aria-label="Show all"></button></div>',
  setup: function (stage) {
    stage.querySelector('.ds-combo__clear').innerHTML = DS.icons.icon(DS.icons.close, 20);
    stage.querySelector('.ds-combo__toggle').innerHTML = DS.icons.icon(DS.icons.chevronDown, 20);
  },
  play: function (stage) {
    var clear = stage.querySelector('.ds-combo__clear');
    clear.classList.add('ds-pressed');
    return DS.motion.settled(clear, { transitions: true }).then(function () {
      clear.classList.remove('ds-pressed');
      return DS.motion.settled(clear, { transitions: true });
    });
  },
});

/* The list of a combobox the system drives (data-ds-combobox): DS.combobox opens and closes it through DS.overlay. */
SG_LAB.add({
  id: 'combobox-system',
  group: 'overlays',
  title: 'Combobox list through DS.combobox',
  note: 'It grows out of the field: a fade over <code>--ds-dur-fast</code> while its clip opens and it grows on the spring over <code>--ds-dur-medium</code>; it leaves with a fade in <code>--ds-dur-instant</code>, and a close mid-way turns back from where it is. The matched letters are marked by weight and a line.',
  shows: ['DS.combobox.open', 'DS.combobox.close', '.ds-combo__match', '--ds-dur-fast', '--ds-dur-medium', '--ds-dur-instant', '--ds-ease-spatial'],
  html: '<div class="ds-combo" style="inline-size: 280px;"><input class="ds-input ds-combo__input" role="combobox" aria-label="Model" aria-expanded="false" aria-autocomplete="list" value="lap">' +
    '<div class="ds-combo__popup" hidden><ul class="ds-combo__list" role="listbox" aria-label="Models">' +
    '<li class="ds-combo__option" role="option" aria-selected="false"><span class="ds-combo__name">Laptop 14</span></li>' +
    '<li class="ds-combo__option" role="option" aria-selected="false"><span class="ds-combo__name">Laptop 16</span></li>' +
    '<li class="ds-combo__option" role="option" aria-selected="false"><span class="ds-combo__name">Mini desktop</span></li></ul></div></div>',
  height: 240,
  setup: function (stage) { DS.combobox.create(stage.querySelector('.ds-combo')); },
  subject: function (stage) { return stage.querySelector('.ds-combo__popup'); },
  state: function (stage) { return stage.querySelector('.ds-combo__popup').getAttribute('data-state') === 'open'; },
  play: function (stage) {
    var combo = stage.querySelector('.ds-combo');
    var popup = stage.querySelector('.ds-combo__popup');
    return DS.combobox.open(combo)
      .then(function () { return DS.motion.settled(popup); })
      .then(function () { return DS.combobox.close(combo); })
      .then(function () { return DS.motion.settled(popup); });
  },
  toggle: function (stage, on) {
    var combo = stage.querySelector('.ds-combo');
    return on ? DS.combobox.open(combo) : DS.combobox.close(combo);
  },
});
