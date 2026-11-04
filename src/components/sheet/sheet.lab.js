/*
 * The Motion Lab entry of DS.sheet: the wide panel. The sheet's other entries
 * (native, div, on a phone) sit in styleguide/lab.js, shared with the overlay
 * table of docs/motion.md.
 */
var made = null;

function sheetOf() {
  if (made) return made;
  var host = document.createElement('div');
  host.innerHTML = '<dialog class="ds-sheet" id="sg-lab-sheet-wide" aria-labelledby="sg-lab-sheet-wide-title">' +
    '<div class="ds-sheet__backdrop" data-ds-close></div><section class="ds-sheet__panel ds-sheet__panel--wide">' +
    '<div class="ds-sheet__head"><h2 class="ds-sheet__title" id="sg-lab-sheet-wide-title">LAPTOP-0042</h2>' +
    '<button class="ds-btn ds-btn--text" type="button" data-ds-close>Close</button></div>' +
    '<div class="ds-sheet__body" tabindex="0"><p class="ds-muted">The record of the device goes here.</p></div></section></dialog>';
  made = host.firstChild;
  document.body.append(made);
  return made;
}

SG_LAB.add({
  id: 'sheet-wide',
  group: 'overlays',
  title: 'Side sheet through DS.sheet, the wide panel',
  note: 'The panel slides its full width in from the edge on the spring and goes back accelerating, while the scrim fades.',
  shows: ['DS.sheet.open', 'DS.sheet.close', '--ds-dur-long', '--ds-dur-base', '--ds-ease-spatial', '--ds-ease-exit'],
  html: '<div class="sg-row"><button class="ds-btn ds-btn--tonal" type="button" data-lab-open>Open a wide sheet</button></div>',
  height: 120,
  setup: function (stage) {
    stage.querySelector('[data-lab-open]').addEventListener('click', function (event) {
      DS.sheet.open(sheetOf(), { opener: event.currentTarget });
    });
  },
  subject: function () { return sheetOf(); },
  state: function () { return sheetOf().getAttribute('data-state') === 'open'; },
  play: function (stage) {
    var sheet = sheetOf();
    return DS.sheet.open(sheet, { opener: stage.querySelector('[data-lab-open]') })
      .then(function () { return DS.sheet.close(sheet); })
      .then(function () { return DS.motion.settled(sheet.querySelector('.ds-sheet__panel')); });
  },
  toggle: function (stage, on) {
    var sheet = sheetOf();
    return on ? DS.sheet.open(sheet, { opener: stage.querySelector('[data-lab-open]') }) : DS.sheet.close(sheet);
  },
});
