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

/*
 * A stage path whose current stage moves (DS.steps): the stages change
 * their fill and ink on --ds-dur-medium; the page sets data-status, the
 * module aria-current.
 */
var STAGE_NAMES = ['New', 'Triaged', 'In progress', 'Resolved'];

function stages(current) {
  return STAGE_NAMES.map(function (label, index) {
    var done = index < current;
    return '<li class="ds-steps__step"' + (done ? ' data-status="done"' : '') + (index === current ? ' aria-current="step"' : '') + '>' +
      '<span class="ds-steps__mark">' + (done ? DS.icons.icon(DS.icons.check, 16) : String(index + 1)) + '</span>' +
      '<span class="ds-steps__label">' + label + '</span></li>';
  }).join('');
}

function moveStage(stage, current, sg) {
  var list = stage.querySelector('.ds-steps');
  Array.from(list.children).forEach(function (step, index) {
    if (index < current) step.setAttribute('data-status', 'done');
    else step.removeAttribute('data-status');
  });
  stage.dsSteps.set(current);
  return sg.frames(2).then(function () {
    return Promise.all(Array.from(list.children).map(function (step) { return DS.motion.settled(step, { transitions: true }); }));
  });
}

SG_LAB.add({
  id: 'steps-path',
  group: 'navigation',
  title: 'Steps: a stage path moving on',
  note: 'The current stage moves: <code>DS.steps</code> moves <code>aria-current</code> (and announces the stage), the page sets the done one; fills and inks change on <code>--ds-dur-medium</code>. Toggle fast: each colour continues from where it is.',
  shows: ['DS.steps.create', '.ds-steps--path', '--ds-dur-medium', '--ds-ease-in-out'],
  html: '<ol class="ds-steps ds-steps--path" aria-label="Ticket stages" style="inline-size: 420px;">' + stages(1) + '</ol>',
  height: 120,
  setup: function (stage) {
    stage.dsSteps = DS.steps.create(stage.querySelector('.ds-steps'));
  },
  play: function (stage, sg) { return moveStage(stage, 2, sg); },
  reset: function (stage, sg) { return moveStage(stage, 1, sg); },
  state: function (stage) { return stage.dsSteps.get() === 2; },
  toggle: function (stage, on, sg) { return moveStage(stage, on ? 2 : 1, sg); },
});
