/*
 * The Motion Lab entries of DS.tearsheet: the box rising from the bottom
 * edge, and a second tearsheet stacking over the first.
 */
var sheets = {};

function tearsheetOf(name, narrow) {
  if (sheets[name]) return sheets[name];
  var host = document.createElement('div');
  var id = 'sg-lab-tearsheet-' + name;
  host.innerHTML = '<dialog class="ds-dialog ds-tearsheet' + (narrow ? ' ds-tearsheet--narrow' : '') + '" id="' + id + '" aria-labelledby="' + id + '-title" data-ds-tearsheet>' +
    '<div class="ds-dialog__backdrop"></div><div class="ds-dialog__box ds-tearsheet__box">' +
    '<div class="ds-tearsheet__head"><div class="ds-tearsheet__heading"><h2 class="ds-dialog__title" id="' + id + '-title">' + (narrow ? 'Add a person' : 'Add a device') + '</h2></div>' +
    '<button class="ds-btn ds-btn--text" type="button" data-ds-close>Close</button></div>' +
    '<div class="ds-tearsheet__main"><div class="ds-tearsheet__body"><section class="ds-tearsheet__step" aria-label="Details"><p class="ds-muted">The form of the flow goes here.</p></section></div></div>' +
    '<div class="ds-tearsheet__foot"><button class="ds-btn ds-btn--text" type="button" data-ds-close>Cancel</button></div></div></dialog>';
  sheets[name] = host.firstChild;
  (document.querySelector('.ds-theme') || document.body).append(sheets[name]);
  return sheets[name];
}

SG_LAB.add({
  id: 'tearsheet-open',
  group: 'overlays',
  title: 'Tearsheet rises and drops back',
  note: 'The box rises its full height from the bottom edge over --ds-dur-long on --ds-ease-out (a box as tall as the window never springs past its rest) and fades in over --ds-dur-fast, while the scrim fades; it drops back in --ds-dur-base, accelerating.',
  shows: ['DS.tearsheet.open', 'DS.tearsheet.close', '.ds-tearsheet', '--ds-dur-long', '--ds-dur-base', '--ds-ease-out', '--ds-ease-exit', '--ds-distance-sheet'],
  html: '<div class="sg-row"><button class="ds-btn ds-btn--tonal" type="button" data-lab-open>Open a tearsheet</button></div>',
  height: 120,
  setup: function (stage) {
    stage.querySelector('[data-lab-open]').addEventListener('click', function (event) {
      DS.tearsheet.open(tearsheetOf('device'), { opener: event.currentTarget });
    });
  },
  subject: function () { return tearsheetOf('device'); },
  state: function () { return tearsheetOf('device').getAttribute('data-state') === 'open'; },
  play: function (stage) {
    var sheet = tearsheetOf('device');
    return DS.tearsheet.open(sheet, { opener: stage.querySelector('[data-lab-open]') })
      .then(function () { return DS.tearsheet.close(sheet, { force: true }); })
      .then(function () { return DS.motion.settled(sheet.querySelector('.ds-dialog__box')); });
  },
  toggle: function (stage, on) {
    var sheet = tearsheetOf('device');
    return on ? DS.tearsheet.open(sheet, { opener: stage.querySelector('[data-lab-open]') }) : DS.tearsheet.close(sheet, { force: true });
  },
});

SG_LAB.add({
  id: 'tearsheet-stacked',
  group: 'overlays',
  title: 'Tearsheets stack',
  note: 'A second tearsheet opens over the first: the lower box recedes to --ds-scale-enter and up by --ds-distance-lg on the spring over --ds-dur-slow (data-stacked), the upper one rises a little lower; closing the upper one brings the lower back the same way.',
  shows: ['--ds-scale-enter', '--ds-distance-lg', '--ds-dur-slow', '--ds-ease-spatial'],
  html: '<div class="sg-row"><button class="ds-btn ds-btn--tonal" type="button" data-lab-open>Open two tearsheets</button></div>',
  height: 120,
  setup: function (stage) {
    stage.querySelector('[data-lab-open]').addEventListener('click', function (event) {
      var lower = tearsheetOf('device');
      DS.tearsheet.open(lower, { opener: event.currentTarget }).then(function () {
        return DS.tearsheet.open(tearsheetOf('person', true), { opener: lower.querySelector('[data-ds-close]') });
      });
    });
  },
  play: function (stage) {
    var lower = tearsheetOf('device');
    var upper = tearsheetOf('person', true);
    return DS.tearsheet.open(lower, { opener: stage.querySelector('[data-lab-open]') })
      .then(function () { return DS.tearsheet.open(upper, { opener: lower.querySelector('[data-ds-close]') }); })
      .then(function () { return DS.tearsheet.close(upper, { force: true }); })
      .then(function () { return DS.motion.settled(lower.querySelector('.ds-dialog__box')); })
      .then(function () { return DS.tearsheet.close(lower, { force: true }); })
      .then(function () { return DS.motion.settled(lower.querySelector('.ds-dialog__box')); });
  },
});
