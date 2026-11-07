/*
 * The Motion Lab entry of DS.taginput: a tag comes and goes while the
 * other chips glide (DS.motion.flip); the message of a refused tag fades in.
 */
SG_LAB.add({
  id: 'taginput-tags',
  group: 'controls',
  title: 'Tag input: a tag comes and goes',
  note: 'A new chip fades in; a removed one leaves while the chips after it glide into its place on <code>--ds-ease-spatial</code> (<code>DS.motion.flip</code>). A refused tag\'s message fades in over <code>--ds-dur-fast</code>.',
  shows: ['DS.taginput.create', '.ds-taginput', '.ds-taginput__message', 'DS.motion.flip', '--ds-dur-fast', '--ds-ease-spatial'],
  html: '<div class="ds-taginput" style="inline-size: 320px;" data-ds-value=\'["printer","floor-2"]\'><input class="ds-input ds-taginput__input" aria-label="Labels"></div>',
  height: 160,
  setup: function (stage) { DS.taginput.create(stage.querySelector('.ds-taginput')); },
  state: function (stage) { return DS.taginput.create(stage.querySelector('.ds-taginput')).get().indexOf('shared') >= 0; },
  play: function (stage) {
    var box = stage.querySelector('.ds-taginput');
    var tags = DS.taginput.create(box);
    tags.set(['printer', 'floor-2']);
    tags.add('shared');
    return DS.motion.settled(box, { subtree: true })
      .then(function () { tags.remove('printer'); return DS.motion.settled(box, { subtree: true }); })
      .then(function () { tags.add('floor-2'); return DS.motion.settled(box.nextElementSibling || box); });
  },
  toggle: function (stage, on) {
    var box = stage.querySelector('.ds-taginput');
    var tags = DS.taginput.create(box);
    if (on) tags.add('shared');
    else tags.remove('shared');
    return DS.motion.settled(box, { subtree: true });
  },
  reset: function (stage) {
    var tags = DS.taginput.create(stage.querySelector('.ds-taginput'));
    tags.set(['printer', 'floor-2']);
  },
});
