/*
 * The Motion Lab entry of DS.selectpanel: the panel grows from its button
 * and leaves with a fade; a close mid-way turns back.
 */
SG_LAB.add({
  id: 'selectpanel-open',
  group: 'overlays',
  title: 'Select panel opens and closes',
  note: 'It grows from the button as a menu does: a fade over <code>--ds-dur-fast</code> while its clip opens and it scales on the spring over <code>--ds-dur-medium</code>; it leaves with a fade in <code>--ds-dur-instant</code>, and a close mid-way turns back from where it is.',
  shows: ['DS.selectpanel.open', 'DS.selectpanel.close', '.ds-selectpanel__panel', '--ds-dur-fast', '--ds-dur-medium', '--ds-dur-instant', '--ds-ease-spatial'],
  html: '<div class="ds-selectpanel"><button class="ds-btn ds-btn--outlined ds-selectpanel__trigger" type="button">Labels <span class="ds-selectpanel__summary"></span></button>' +
    '<div class="ds-selectpanel__panel" role="dialog" aria-label="Labels" hidden><div class="ds-listbox ds-listbox--plain ds-selectpanel__list" role="listbox" aria-multiselectable="true" aria-label="Labels">' +
    '<div class="ds-listbox__option" role="option" aria-selected="true" data-value="bug"><span class="ds-listbox__check" aria-hidden="true"></span><span class="ds-listbox__name">Bug</span></div>' +
    '<div class="ds-listbox__option" role="option" aria-selected="false" data-value="docs"><span class="ds-listbox__check" aria-hidden="true"></span><span class="ds-listbox__name">Docs</span></div>' +
    '<div class="ds-listbox__option" role="option" aria-selected="false" data-value="urgent"><span class="ds-listbox__check" aria-hidden="true"></span><span class="ds-listbox__name">Urgent</span></div></div></div></div>',
  height: 260,
  setup: function (stage) {
    stage.querySelectorAll('.ds-listbox__check').forEach(function (box) { box.innerHTML = DS.icons.icon(DS.icons.check, 16); });
    DS.selectpanel.create(stage.querySelector('.ds-selectpanel'));
  },
  subject: function (stage) { return stage.querySelector('.ds-selectpanel__panel'); },
  state: function (stage) { return stage.querySelector('.ds-selectpanel__panel').getAttribute('data-state') === 'open'; },
  play: function (stage) {
    var el = stage.querySelector('.ds-selectpanel');
    var panel = stage.querySelector('.ds-selectpanel__panel');
    return DS.selectpanel.open(el)
      .then(function () { return DS.motion.settled(panel); })
      .then(function () { return DS.selectpanel.close(el); })
      .then(function () { return DS.motion.settled(panel); });
  },
  toggle: function (stage, on) {
    var el = stage.querySelector('.ds-selectpanel');
    return on ? DS.selectpanel.open(el) : DS.selectpanel.close(el);
  },
});
