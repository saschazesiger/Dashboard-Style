/*
 * The Motion Lab entry of DS.bottomsheet: it rises to its smallest detent,
 * springs to the full height and drops back.
 */
var bsMade = null;

function bottomSheetOf() {
  if (bsMade) return bsMade;
  var host = document.createElement('div');
  host.innerHTML = '<dialog class="ds-sheet ds-bottomsheet" id="sg-lab-bottomsheet" aria-labelledby="sg-lab-bottomsheet-title" data-ds-bottomsheet data-ds-bottomsheet-detents="0.5 1">' +
    '<div class="ds-sheet__backdrop" data-ds-close></div><section class="ds-sheet__panel ds-bottomsheet__panel">' +
    '<button class="ds-bottomsheet__handle" type="button" aria-label="Resize the sheet"></button>' +
    '<div class="ds-sheet__head"><h2 class="ds-sheet__title" id="sg-lab-bottomsheet-title">Filters</h2>' +
    '<button class="ds-btn ds-btn--text" type="button" data-ds-close>Close</button></div>' +
    '<div class="ds-sheet__body"><p class="ds-muted">Laptops, tablets and phones.</p></div></section></dialog>';
  bsMade = host.firstChild;
  (document.querySelector('.ds-theme') || document.body).append(bsMade);
  return bsMade;
}

SG_LAB.add({
  id: 'bottomsheet-open',
  group: 'overlays',
  title: 'Bottom sheet: rise, a detent, drop',
  note: 'The panel rises to its smallest detent on the spatial spring over --ds-dur-long while the scrim fades, springs to the full height, and drops back down in --ds-dur-base, accelerating. A drag follows the finger (the named exception).',
  shows: ['DS.bottomsheet.open', 'DS.bottomsheet.close', '.ds-bottomsheet', '--ds-dur-long', '--ds-dur-base', '--ds-ease-spatial', '--ds-ease-exit'],
  html: '<div class="sg-row"><button class="ds-btn ds-btn--tonal" type="button" data-lab-open>Open a bottom sheet</button></div>',
  height: 120,
  setup: function (stage) {
    stage.querySelector('[data-lab-open]').addEventListener('click', function (event) {
      DS.bottomsheet.open(bottomSheetOf(), { opener: event.currentTarget });
    });
  },
  subject: function () { return bottomSheetOf(); },
  state: function () { return bottomSheetOf().getAttribute('data-state') === 'open'; },
  play: function (stage) {
    var sheet = bottomSheetOf();
    var panel = sheet.querySelector('.ds-bottomsheet__panel');
    return DS.bottomsheet.open(sheet, { opener: stage.querySelector('[data-lab-open]') })
      .then(function () { DS.bottomsheet.create(sheet).set({ index: 1 }); return DS.motion.settled(panel); })
      .then(function () { return DS.bottomsheet.close(sheet); })
      .then(function () { return DS.motion.settled(panel); });
  },
  toggle: function (stage, on) {
    var sheet = bottomSheetOf();
    return on ? DS.bottomsheet.open(sheet, { opener: stage.querySelector('[data-lab-open]') }) : DS.bottomsheet.close(sheet);
  },
});
