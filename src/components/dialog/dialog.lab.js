/*
 * The Motion Lab entry of the dialog's sizes: the same motion at every width,
 * through DS.dialog. The dialog's other entries (native, div, nested, full
 * screen, action sheet, busy) sit in styleguide/lab.js, shared with the
 * overlay table of docs/motion.md.
 */
var made = null;

function dialogOf() {
  if (made) return made;
  var host = document.createElement('div');
  host.innerHTML = '<dialog class="ds-dialog ds-dialog--xl" id="sg-lab-dialog-xl" aria-labelledby="sg-lab-dialog-xl-title">' +
    '<div class="ds-dialog__backdrop" data-ds-close></div><div class="ds-dialog__box">' +
    '<h2 class="ds-dialog__title" id="sg-lab-dialog-xl-title">Archive LAPTOP-0042?</h2>' +
    '<p class="ds-dialog__text">The widest box: it stays in the archive for a year.</p>' +
    '<div class="ds-dialog__actions"><button class="ds-btn ds-btn--filled" type="button" data-ds-close>Keep it</button></div></div></dialog>';
  made = host.firstChild;
  document.body.append(made);
  return made;
}

SG_LAB.add({
  id: 'dialog-sizes',
  group: 'overlays',
  title: 'Dialog through DS.dialog, the widest size',
  note: 'The sizes change the width of the box, not its motion: the scrim fades while the box fades, grows and rises on the spring.',
  shows: ['DS.dialog.open', 'DS.dialog.close', '--ds-dur-slow', '--ds-dur-base', '--ds-ease-spatial', '--ds-ease-exit'],
  html: '<div class="sg-row"><button class="ds-btn ds-btn--tonal" type="button" data-lab-open>Open a large dialog</button></div>',
  height: 120,
  setup: function (stage) {
    stage.querySelector('[data-lab-open]').addEventListener('click', function (event) {
      DS.dialog.open(dialogOf(), { opener: event.currentTarget });
    });
  },
  subject: function () { return dialogOf(); },
  state: function () { return dialogOf().getAttribute('data-state') === 'open'; },
  play: function (stage) {
    var dialog = dialogOf();
    return DS.dialog.open(dialog, { opener: stage.querySelector('[data-lab-open]') })
      .then(function () { return DS.dialog.close(dialog); })
      .then(function () { return DS.motion.settled(dialog.querySelector('.ds-dialog__box')); });
  },
  toggle: function (stage, on) {
    var dialog = dialogOf();
    return on ? DS.dialog.open(dialog, { opener: stage.querySelector('[data-lab-open]') }) : DS.dialog.close(dialog);
  },
});

/* The non-modal box: no frame, no scrim, the page stays usable. */
var floating = null;

function modelessOf() {
  if (floating) return floating;
  var host = document.createElement('div');
  host.innerHTML = '<section class="ds-dialog__box ds-dialog__box--modeless" id="sg-lab-dialog-modeless" role="dialog" aria-labelledby="sg-lab-dialog-modeless-title" hidden>' +
    '<h2 class="ds-dialog__title" id="sg-lab-dialog-modeless-title">Export running</h2>' +
    '<p class="ds-dialog__text">240 devices, about a minute. The page stays usable meanwhile.</p>' +
    '<div class="ds-dialog__actions"><button class="ds-btn ds-btn--text" type="button" data-ds-close>Hide</button></div></section>';
  floating = host.firstChild;
  (document.querySelector('.ds-theme') || document.body).append(floating);
  return floating;
}

SG_LAB.add({
  id: 'dialog-modeless',
  group: 'overlays',
  title: 'Non-modal dialog',
  note: 'The box alone floats in at the end of the window: it fades, grows from --ds-scale-enter and rises --ds-distance-md on the spring, without a scrim; it leaves the same way back, accelerating.',
  shows: ['.ds-dialog__box--modeless', '--ds-dur-slow', '--ds-dur-base', '--ds-distance-md', '--ds-scale-enter', '--ds-ease-spatial', '--ds-ease-exit'],
  html: '<div class="sg-row"><button class="ds-btn ds-btn--tonal" type="button" data-lab-open>Open a non-modal dialog</button></div>',
  height: 120,
  setup: function (stage) {
    stage.querySelector('[data-lab-open]').addEventListener('click', function (event) {
      DS.overlay.open(modelessOf(), { opener: event.currentTarget });
    });
  },
  subject: function () { return modelessOf(); },
  state: function () { return modelessOf().getAttribute('data-state') === 'open'; },
  play: function (stage) {
    var box = modelessOf();
    return DS.overlay.open(box, { opener: stage.querySelector('[data-lab-open]') })
      .then(function () { return DS.overlay.close(box); })
      .then(function () { return DS.motion.settled(box); });
  },
  toggle: function (stage, on) {
    var box = modelessOf();
    return on ? DS.overlay.open(box, { opener: stage.querySelector('[data-lab-open]') }) : DS.overlay.close(box);
  },
});
