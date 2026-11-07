/*
 * The Motion Lab entry of DS.timerange: the popover of the range and the
 * chevron of its trigger, which turns with it.
 */
SG_LAB.add({
  id: 'timerange-open',
  group: 'overlays',
  title: 'Time range opens its ranges',
  note: 'The popover grows from the trigger (the picker\'s motion) while the trigger\'s chevron turns half a turn on the spring over <code>--ds-dur-medium</code>; closed mid-way, both turn back from where they are.',
  shows: ['DS.timerange.create', '.ds-timerange__chevron', '--ds-dur-medium', '--ds-ease-spatial', '--ds-dur-instant'],
  html: '<div class="sg-popup-stage"><div class="ds-timerange" data-lab-timerange></div></div>',
  height: 460,
  wide: true,
  setup: function (stage) {
    DS.timerange.create(stage.querySelector('[data-lab-timerange]'), { from: 'now-1h', to: 'now', store: 'sg-lab' });
  },
  subject: function (stage) { return stage.querySelector('.ds-picker__popover'); },
  state: function (stage) { return stage.querySelector('.ds-picker__popover').getAttribute('data-state') === 'open'; },
  play: function (stage) {
    var range = DS.timerange.create(stage.querySelector('[data-lab-timerange]'));
    var panel = stage.querySelector('.ds-picker__popover');
    return range.open()
      .then(function () { return range.close(); })
      .then(function () { return DS.motion.settled(panel); });
  },
  toggle: function (stage, on) {
    var range = DS.timerange.create(stage.querySelector('[data-lab-timerange]'));
    return on ? range.open() : range.close();
  },
});
