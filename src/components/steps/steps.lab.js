/*
 * Motion Lab: a column of steps moving on in place. The mark stays (a
 * re-render through DS.dom.morphHtml patches it), so its colours glide and a
 * new check draws itself; the connector leaving a done step turns with them.
 */
var NAMES = ['Device', 'Problem', 'Contact'];

function items(current) {
  return NAMES.map(function (label, index) {
    var done = index < current;
    return '<li class="ds-steps__step"' + (done ? ' data-status="done"' : '') + (index === current ? ' aria-current="step"' : '') + '>' +
      '<span class="ds-steps__mark">' + (done ? DS.icons.icon(DS.icons.check, 16) : String(index + 1)) + '</span>' +
      '<span class="ds-steps__label">' + label + (done ? '<span class="ds-sr">, done</span>' : '') + '</span></li>';
  }).join('');
}

function goTo(stage, current, sg) {
  DS.dom.morphHtml(stage.querySelector('.ds-steps'), items(current));
  return sg.frames(2).then(function () {
    return Promise.all(Array.from(stage.querySelectorAll('.ds-steps__mark')).map(function (mark) { return DS.motion.settled(mark); }));
  });
}

function at(stage) {
  return Array.from(stage.querySelectorAll('.ds-steps__step')).findIndex(function (step) { return step.getAttribute('aria-current') === 'step'; });
}

SG_LAB.add({
  id: 'steps-column',
  group: 'navigation',
  title: 'Steps: a column moving on',
  note: 'A step that turns done in place: the disc takes the primary colour and the check draws itself over <code>--ds-dur-medium</code>, after <code>--ds-dur-micro</code>; the connector under it turns on the same timing. A list rendered with done steps stays still on load.',
  shows: ['DS.dom.morphHtml', '.ds-steps--vertical', '--ds-dur-medium', '--ds-dur-micro', '--ds-ease-out', '--ds-ease-in-out'],
  html: '<ol class="ds-steps ds-steps--vertical" aria-label="Report a problem" style="inline-size: 240px;">' + items(0) + '</ol>',
  height: 200,
  play: function (stage, sg) { return goTo(stage, 1, sg); },
  reset: function (stage, sg) { return goTo(stage, 0, sg); },
  state: function (stage) { return at(stage) === 1; },
  toggle: function (stage, on, sg) { return goTo(stage, on ? 1 : 0, sg); },
});
