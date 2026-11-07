/*
 * The Motion Lab entry of DS.calendar: a turned page slides in from its
 * side; the chosen day and the band of a range change colour.
 */
SG_LAB.add({
  id: 'calendar-turn',
  group: 'controls',
  title: 'Calendar turns a month',
  note: 'The new month slides in from its side (<code>DS.motion.enter</code> with <code>slide</code>: <code>--ds-distance-xl</code> over <code>--ds-dur-slow</code> on the spring, faded in on the way); back, it comes from the other side, mirrored right to left.',
  shows: ['DS.calendar.create', '.ds-calendar', '.ds-enter--slide', '--ds-distance-xl', '--ds-ease-spatial', '--ds-dur-slow'],
  html: '<div class="ds-calendar" data-lab-calendar style="inline-size: max-content;"></div>',
  height: 380,
  setup: function (stage) {
    DS.calendar.create(stage.querySelector('[data-lab-calendar]'), { value: '2026-11-04', show: '2026-11-04' });
  },
  reset: function (stage) {
    var calendar = DS.calendar.create(stage.querySelector('[data-lab-calendar]'));
    calendar.update({ show: '2026-11-04' });
    calendar.set('2026-11-04');
  },
  play: function (stage) {
    var element = stage.querySelector('[data-lab-calendar]');
    stage.querySelector('.ds-calendar__nav[data-step="1"]').click();
    return DS.motion.settled(element, { subtree: true });
  },
});
