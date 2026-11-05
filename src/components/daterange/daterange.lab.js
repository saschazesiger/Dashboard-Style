/*
 * The Motion Lab entry of DS.daterange: the band of a range and its
 * preview, which change colour as the pointer or the keys move.
 */
SG_LAB.add({
  id: 'daterange-preview',
  group: 'controls',
  title: 'Date range picker previews the range',
  note: 'The first pick starts a range; the band follows the pointer or the arrow keys, its tint changing over <code>--ds-dur-fast</code>, and the second pick ends it. Nothing moves: the days keep their places.',
  shows: ['DS.daterange.create', '--ds-dur-fast'],
  html: '<div class="sg-popup-stage"><div class="ds-picker" data-lab-daterange>' +
    '<div class="ds-datefield" role="group" aria-label="Report period">' +
    '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-datefield__toggle" type="button" aria-label="Choose dates"></button></div></div></div>',
  height: 460,
  wide: true,
  setup: function (stage) {
    stage.querySelector('.ds-datefield__toggle').innerHTML = DS.icons.icon(DS.icons.calendarRange, 20);
    DS.daterange.create(stage.querySelector('[data-lab-daterange]'), { value: '2026-11-02/2026-11-06', presets: [] });
  },
  subject: function (stage) { return stage.querySelector('.ds-picker__popover'); },
  play: function (stage) {
    var range = DS.daterange.create(stage.querySelector('[data-lab-daterange]'));
    var panel = stage.querySelector('.ds-picker__popover');
    return range.open().then(function () {
      var start = panel.querySelector('.ds-calendar__day[data-date="2026-11-09"]');
      var end = panel.querySelector('.ds-calendar__day[data-date="2026-11-20"]');
      if (!start || !end) return range.close();
      start.click();
      end.dispatchEvent(new PointerEvent('pointerover', { bubbles: true }));
      return DS.motion.settled(end.parentElement, { transitions: true }).then(function () {
        range.set('2026-11-02/2026-11-06');
        return range.close();
      });
    }).then(function () { return DS.motion.settled(panel); });
  },
});
