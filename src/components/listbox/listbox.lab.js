/*
 * The Motion Lab entry of DS.listbox: the check box of several values fills
 * and draws its check, and goes again; the active layer comes in over
 * --ds-dur-micro and leaves at once.
 */
SG_LAB.add({
  id: 'listbox-check',
  group: 'controls',
  title: 'Listbox: choosing several values',
  note: 'The box fills over <code>--ds-dur-fast</code> while its check is drawn from left to right over <code>--ds-dur-medium</code> on <code>--ds-ease-out</code>; taken back, the check fades and the box empties. The active option\'s layer comes in over <code>--ds-dur-micro</code> and goes at once, so a held arrow key leaves no trail.',
  shows: ['DS.listbox.create', '.ds-listbox', '.ds-listbox__check', '--ds-dur-fast', '--ds-dur-medium', '--ds-dur-micro', '--ds-ease-out'],
  html: '<div class="ds-listbox" role="listbox" aria-multiselectable="true" aria-label="Models" style="inline-size: 280px;">' +
    '<div class="ds-listbox__option" role="option" aria-selected="false" data-value="a"><span class="ds-listbox__check" aria-hidden="true"></span><span class="ds-listbox__name">Laptop 14</span></div>' +
    '<div class="ds-listbox__option" role="option" aria-selected="false" data-value="b"><span class="ds-listbox__check" aria-hidden="true"></span><span class="ds-listbox__name">Mini desktop</span></div></div>',
  setup: function (stage) {
    stage.querySelectorAll('.ds-listbox__check').forEach(function (box) { box.innerHTML = DS.icons.icon(DS.icons.check, 16); });
    DS.listbox.create(stage.querySelector('.ds-listbox'));
  },
  state: function (stage) { return stage.querySelector('.ds-listbox__option').getAttribute('aria-selected') === 'true'; },
  play: function (stage) {
    var list = DS.listbox.create(stage.querySelector('.ds-listbox'));
    list.set([]);
    list.activate('a');
    list.pick();
    return DS.motion.settled(stage.querySelector('.ds-listbox__option'), { subtree: true, transitions: true });
  },
  toggle: function (stage, on) {
    var list = DS.listbox.create(stage.querySelector('.ds-listbox'));
    list.set(on ? ['a'] : []);
    return DS.motion.settled(stage.querySelector('.ds-listbox__option'), { subtree: true, transitions: true });
  },
  reset: function (stage) {
    var list = DS.listbox.create(stage.querySelector('.ds-listbox'));
    list.set([]);
    list.activate(null);
    return DS.motion.settled(stage.querySelector('.ds-listbox__option'), { subtree: true, transitions: true });
  },
});
