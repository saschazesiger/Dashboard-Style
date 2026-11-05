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

/* A docked panel: the content beside it narrows while its width opens. */
SG_LAB.add({
  id: 'sheet-push',
  group: 'overlays',
  title: 'Docked side sheet: push',
  note: 'No scrim: the list narrows while the panel\'s width opens from 0 on --ds-ease-out (a size that pushes never overshoots), its parts uncovered from the end; it gives the width back in --ds-dur-base, accelerating.',
  shows: ['.ds-sheet__panel--push', '.ds-sheet__panel--inspector', '.ds-sheet__layout', '--ds-dur-long', '--ds-dur-base', '--ds-ease-out', '--ds-ease-exit'],
  html: '<div class="ds-sheet__layout" style="block-size:200px;border:1px solid var(--ds-line);border-radius:var(--ds-radius-card);overflow:hidden">' +
    '<div class="ds-sheet__main"><ul class="ds-list"><li class="ds-list__item"><span class="ds-list__text"><span class="ds-list__title">LAPTOP-0042</span><span class="ds-list__meta">Ada Lovelace</span></span></li>' +
    '<li class="ds-list__item"><span class="ds-list__text"><span class="ds-list__title">LAPTOP-0043</span><span class="ds-list__meta">Alan Turing</span></span></li></ul></div>' +
    '<section class="ds-sheet__panel ds-sheet__panel--push" id="sg-lab-sheet-push" aria-labelledby="sg-lab-sheet-push-title" hidden data-lab-panel>' +
    '<div class="ds-sheet__head"><h2 class="ds-sheet__title" id="sg-lab-sheet-push-title">Filters</h2></div>' +
    '<div class="ds-sheet__body"><p class="ds-muted">Laptops, tablets</p></div></section></div>',
  height: 220,
  wide: true,
  subject: function (stage) { return stage.querySelector('[data-lab-panel]'); },
  state: function (stage) { return stage.querySelector('[data-lab-panel]').getAttribute('data-state') === 'open'; },
  play: function (stage) {
    var panel = stage.querySelector('[data-lab-panel]');
    return DS.sheet.open(panel)
      .then(function () { return DS.sheet.close(panel); })
      .then(function () { return DS.motion.settled(panel); });
  },
  toggle: function (stage, on) {
    var panel = stage.querySelector('[data-lab-panel]');
    return on ? DS.sheet.open(panel) : DS.sheet.close(panel);
  },
});
