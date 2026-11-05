/*
 * The Motion Lab entry of DS.datepicker: the calendar's popover grows from
 * the field's button; a pick closes it with a fade.
 */
SG_LAB.add({
  id: 'datepicker-open',
  group: 'overlays',
  title: 'Date picker opens its calendar',
  note: 'The popover grows from the button on the spring over <code>--ds-dur-medium</code> (the picker\'s motion) with focus on the chosen day; a pick or Escape closes it with a fade over <code>--ds-dur-instant</code>, and focus is back on the button at once.',
  shows: ['DS.datepicker.create', '--ds-dur-medium', '--ds-dur-instant', '--ds-ease-spatial'],
  html: '<div class="sg-popup-stage"><div class="ds-picker" data-lab-datepicker>' +
    '<div class="ds-datefield" role="group" aria-label="Due date">' +
    '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-datefield__toggle" type="button" aria-label="Choose date"></button></div></div></div>',
  height: 440,
  setup: function (stage) {
    stage.querySelector('.ds-datefield__toggle').innerHTML = DS.icons.icon(DS.icons.calendar, 20);
    DS.datepicker.create(stage.querySelector('[data-lab-datepicker]'), { value: '2026-11-07' });
  },
  subject: function (stage) { return stage.querySelector('.ds-picker__popover'); },
  play: function (stage) {
    var picker = DS.datepicker.create(stage.querySelector('[data-lab-datepicker]'));
    var panel = stage.querySelector('.ds-picker__popover');
    return picker.open()
      .then(function () { return picker.close(); })
      .then(function () { return DS.motion.settled(panel); });
  },
});
