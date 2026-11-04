/*
 * The combobox's motion of 3.0: the press of its clear button. The list and
 * the toggle's chevron of 2.x stay in styleguide/lab.js.
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
