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
