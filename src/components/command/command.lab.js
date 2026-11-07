/*
 * The Motion Lab entry of DS.command: the palette opens and closes with the
 * dialog's motion, near the top of the window; its results change in place.
 */
var palette = null;

function paletteOf() {
  if (palette) return palette;
  var host = document.createElement('div');
  host.innerHTML = '<dialog class="ds-dialog ds-command" id="sg-lab-command" aria-label="Command palette" data-ds-command-hotkey="off">' +
    '<div class="ds-dialog__backdrop" data-ds-close></div><div class="ds-dialog__box">' +
    '<div class="ds-command__search">' + DS.icons.icon(DS.icons.search, 20) +
    '<input class="ds-command__input" type="text" aria-label="Search commands" placeholder="Search or run a command"></div>' +
    '<div class="ds-command__list" aria-label="Commands"></div></div></dialog>';
  palette = host.firstChild;
  document.body.append(palette);
  DS.command.create(palette, {
    recent: 0,
    commands: [
      { id: 'add', label: 'Add a device', group: 'Devices', icon: DS.icons.plus, shortcut: 'mod+shift+a' },
      { id: 'devices', label: 'Open devices', group: 'Devices', icon: DS.icons.laptop },
      { id: 'ticket', label: 'Open a ticket', group: 'Tickets', icon: DS.icons.ticket },
      { id: 'theme', label: 'Change the theme', group: 'Settings', icon: DS.icons.palette, children: [{ id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }] },
    ],
    shortcuts: false,
  });
  return palette;
}

SG_LAB.add({
  id: 'command-open',
  group: 'overlays',
  title: 'Command palette through DS.command',
  note: 'The dialog\'s motion, near the top of the window, so the box keeps its place while the results change under the field. The active option\'s layer comes in over --ds-dur-micro and goes at once.',
  shows: ['DS.command.open', 'DS.command.close', 'DS.command.create', '--ds-dur-slow', '--ds-dur-base', '--ds-dur-micro', '--ds-ease-spatial', '--ds-ease-exit'],
  html: '<div class="sg-row"><button class="ds-btn ds-btn--tonal" type="button" data-lab-open>Open the palette</button></div>',
  height: 120,
  setup: function (stage) {
    stage.querySelector('[data-lab-open]').addEventListener('click', function (event) {
      DS.command.open(paletteOf(), { opener: event.currentTarget });
    });
  },
  subject: function () { return paletteOf(); },
  state: function () { return paletteOf().getAttribute('data-state') === 'open'; },
  play: function (stage) {
    var dialog = paletteOf();
    return DS.command.open(dialog, { opener: stage.querySelector('[data-lab-open]') })
      .then(function () { return DS.command.close(dialog); })
      .then(function () { return DS.motion.settled(dialog.querySelector('.ds-dialog__box')); });
  },
  toggle: function (stage, on) {
    var dialog = paletteOf();
    return on ? DS.command.open(dialog, { opener: stage.querySelector('[data-lab-open]') }) : DS.command.close(dialog);
  },
});
