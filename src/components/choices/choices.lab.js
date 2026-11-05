/*
 * The Motion Lab entry of DS.choices: "select all" turns every box on and
 * off; each box wipes its check in (form.css), "some" shows the dash.
 */
SG_LAB.add({
  id: 'choices-all',
  group: 'controls',
  title: 'Choice list: select all',
  note: '"Select all" checks every box that shows: each check wipes in after <code>--ds-dur-micro</code> on <code>--ds-ease-out</code>; taken back, they fade. With only some checked the box shows the dash.',
  shows: ['DS.choices.create', '.ds-choices', '.ds-choices__list', '--ds-dur-micro', '--ds-ease-out'],
  html: '<div class="ds-choices" style="inline-size: 280px;"><div class="ds-choices__tools"><label class="ds-check"><input type="checkbox" data-ds-choices-all><span>All channels</span></label><span class="ds-choices__count"></span></div>' +
    '<div class="ds-choices__list" role="group" aria-label="Channels"><label class="ds-check"><input type="checkbox" value="mail"><span>Email</span></label>' +
    '<label class="ds-check"><input type="checkbox" value="chat"><span>Chat</span></label><label class="ds-check"><input type="checkbox" value="text"><span>Text message</span></label></div></div>',
  height: 220,
  setup: function (stage) { DS.choices.create(stage.querySelector('.ds-choices')); },
  state: function (stage) { return DS.choices.create(stage.querySelector('.ds-choices')).get().length === 3; },
  play: function (stage) {
    var all = stage.querySelector('[data-ds-choices-all]');
    DS.choices.create(stage.querySelector('.ds-choices')).set([]);
    all.click();
    return DS.motion.settled(stage.querySelector('.ds-choices__list'), { subtree: true, transitions: true });
  },
  toggle: function (stage, on) {
    DS.choices.create(stage.querySelector('.ds-choices')).set(on ? ['mail', 'chat', 'text'] : []);
    return DS.motion.settled(stage.querySelector('.ds-choices__list'), { subtree: true, transitions: true });
  },
  reset: function (stage) { DS.choices.create(stage.querySelector('.ds-choices')).set([]); },
});
