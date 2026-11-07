/*
 * The Motion Lab entry of DS.shortcuts: the sheet opens and closes with the
 * dialog's motion; its list is written before the entrance starts.
 */
var sheet = null;

function sheetOf() {
  if (sheet) return sheet;
  var host = document.createElement('div');
  host.innerHTML = '<dialog class="ds-dialog ds-dialog--lg ds-shortcuts" id="sg-lab-shortcuts" aria-labelledby="sg-lab-shortcuts-title" data-ds-shortcuts-hotkey="off">' +
    '<div class="ds-dialog__backdrop" data-ds-close></div><div class="ds-dialog__box">' +
    '<div class="ds-dialog__head"><h2 class="ds-dialog__title" id="sg-lab-shortcuts-title">Keyboard shortcuts</h2>' +
    '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close" data-ds-close>' + DS.icons.icon(DS.icons.close, 20) + '</button></div>' +
    '<div class="ds-dialog__body ds-shortcuts__list"></div></div></dialog>';
  sheet = host.firstChild;
  document.body.append(sheet);
  DS.shortcuts.create(sheet);
  return sheet;
}

SG_LAB.add({
  id: 'shortcuts-open',
  group: 'overlays',
  title: 'Shortcut sheet through DS.shortcuts',
  note: 'The dialog\'s motion; the list of DS.hotkeys is written before the entrance, so nothing moves inside the box.',
  shows: ['DS.shortcuts.open', 'DS.shortcuts.close', 'DS.shortcuts.create', '--ds-dur-slow', '--ds-dur-base', '--ds-ease-spatial', '--ds-ease-exit'],
  html: '<div class="sg-row"><button class="ds-btn ds-btn--tonal" type="button" data-lab-open>Open the sheet</button></div>',
  height: 120,
  setup: function (stage) {
    stage.querySelector('[data-lab-open]').addEventListener('click', function (event) {
      DS.shortcuts.open(sheetOf(), { opener: event.currentTarget });
    });
  },
  subject: function () { return sheetOf(); },
  state: function () { return sheetOf().getAttribute('data-state') === 'open'; },
  play: function (stage) {
    var dialog = sheetOf();
    return DS.shortcuts.open(dialog, { opener: stage.querySelector('[data-lab-open]') })
      .then(function () { return DS.shortcuts.close(dialog); })
      .then(function () { return DS.motion.settled(dialog.querySelector('.ds-dialog__box')); });
  },
  toggle: function (stage, on) {
    var dialog = sheetOf();
    return on ? DS.shortcuts.open(dialog, { opener: stage.querySelector('[data-lab-open]') }) : DS.shortcuts.close(dialog);
  },
});
