/*
 * The Motion Lab entry of DS.timepicker: the list of times in its popover;
 * the active row's layer comes quickly and goes at once.
 */
SG_LAB.add({
  id: 'timepicker-list',
  group: 'overlays',
  title: 'Time picker opens its list',
  note: 'The popover grows from the button (the picker\'s motion) with the chosen time in the middle. The active row\'s layer comes in over <code>--ds-dur-micro</code> and goes at once, so a held arrow key leaves no trail.',
  shows: ['DS.timepicker.create', '--ds-dur-micro', '--ds-dur-medium', '--ds-dur-instant'],
  html: '<div class="sg-popup-stage"><div class="ds-picker" data-lab-timepicker>' +
    '<div class="ds-datefield" role="group" aria-label="Daily backup at">' +
    '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-datefield__toggle" type="button" aria-label="Choose time"></button></div></div></div>',
  height: 400,
  setup: function (stage) {
    stage.querySelector('.ds-datefield__toggle').innerHTML = DS.icons.icon(DS.icons.clock, 20);
    DS.timepicker.create(stage.querySelector('[data-lab-timepicker]'), { value: '02:30' });
  },
  subject: function (stage) { return stage.querySelector('.ds-picker__popover'); },
  play: function (stage) {
    var picker = DS.timepicker.create(stage.querySelector('[data-lab-timepicker]'));
    var panel = stage.querySelector('.ds-picker__popover');
    return picker.open()
      .then(function () { return picker.close(); })
      .then(function () { return DS.motion.settled(panel); });
  },
});
