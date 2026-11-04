SG_LAB.add({
  id: 'fanout-in',
  group: 'feedback',
  title: 'Fan-out probe',
  shows: ['ds-fanout-in', 'DS.fanout.create'],
  html: '<div class="ds-fanout">Probe</div>',
  play: function (stage) { return DS.motion.settled(stage.querySelector('.ds-fanout')); },
});
