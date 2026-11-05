/*
 * The Motion Lab entry of DS.picker: the popover of the date and time
 * pickers, opened from its button as a menu is.
 */
SG_LAB.add({
  id: 'picker-popover',
  group: 'overlays',
  title: 'Picker popover through DS.picker',
  note: 'It grows from its button on the spring (<code>--ds-scale-popup</code>, its clip opening from the button\'s edge) over <code>--ds-dur-medium</code> and leaves with a fade over <code>--ds-dur-instant</code>; closed mid-way, it turns back from where it is.',
  shows: ['DS.picker.create', 'DS.picker.open', 'DS.picker.close', '.ds-picker__popover', '--ds-scale-popup', '--ds-dur-medium', '--ds-dur-fast', '--ds-dur-instant', '--ds-ease-spatial'],
  html: '<div class="sg-popup-stage"><div class="ds-picker" data-lab-picker>' +
    '<button class="ds-btn" type="button" data-ds-picker-toggle>Status: Any</button>' +
    '<div class="ds-picker__popover" aria-label="Status" hidden><div class="ds-picker__presets">' +
    '<button class="ds-picker__preset" type="button" aria-current="true">Any status</button>' +
    '<button class="ds-picker__preset" type="button">Online</button>' +
    '<button class="ds-picker__preset" type="button">Offline</button></div></div></div></div>',
  height: 220,
  setup: function (stage) {
    DS.picker.create(stage.querySelector('[data-lab-picker]'));
  },
  subject: function (stage) { return stage.querySelector('.ds-picker__popover'); },
  state: function (stage) { return stage.querySelector('.ds-picker__popover').getAttribute('data-state') === 'open'; },
  play: function (stage) {
    var root = stage.querySelector('[data-lab-picker]');
    var panel = stage.querySelector('.ds-picker__popover');
    return DS.picker.open(root)
      .then(function () { return DS.picker.close(root); })
      .then(function () { return DS.motion.settled(panel); });
  },
  toggle: function (stage, on) {
    var root = stage.querySelector('[data-lab-picker]');
    return on ? DS.picker.open(root) : DS.picker.close(root);
  },
});
