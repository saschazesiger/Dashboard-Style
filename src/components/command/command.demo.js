/*
 * The Command palette demo: the palette of a device console, with groups,
 * recent commands, shortcuts, a page (the theme), a prefix page whose
 * results come from a slow fake search (tickets), a provider that finds
 * devices, a blocked command and the empty state. Opening, the keys and
 * running come from the system (data-ds-command, data-ds-open); wire()
 * holds what a project writes: the commands and the fake searches.
 */
var DEVICES = ['LAPTOP-0042', 'LAPTOP-0043', 'TABLET-0207', 'PHONE-0311', 'DESKTOP-0012', 'MONITOR-0120'];
var TICKETS = [
  ['T-1024', 'Screen flickers after the update'],
  ['T-1031', 'Battery drains overnight'],
  ['T-1047', 'Cannot reach the printer'],
  ['T-1052', 'Replace the fan of DESKTOP-0012'],
];

function palette(h, id, inputId) {
  return '<dialog class="ds-dialog ds-command" id="' + id + '" data-ds-command aria-label="Command palette" data-demo="palette">' +
    '<div class="ds-dialog__backdrop" data-ds-close></div><div class="ds-dialog__box">' +
    '<div class="ds-command__search">' + h.icon('search', 20) +
    '<input class="ds-command__input" id="' + inputId + '" type="text" aria-label="Search commands" placeholder="Search or run a command">' +
    '<kbd class="ds-kbd">Esc</kbd><button class="ds-btn ds-btn--text ds-command__close" type="button" data-ds-close>Cancel</button></div>' +
    '<div class="ds-command__list" aria-label="Commands"></div>' +
    '<div class="ds-command__foot"><span><span><kbd class="ds-kbd">↑</kbd> <kbd class="ds-kbd">↓</kbd> Move</span>' +
    '<span><kbd class="ds-kbd">Enter</kbd> Run</span><span><kbd class="ds-kbd">&gt;</kbd> Actions</span><span><kbd class="ds-kbd">#</kbd> Tickets</span></span></div>' +
    '</div></dialog>';
}

SG.demo('command', {
  title: 'Command palette',
  group: 'overlays',
  need: 'Find and run any command of the app from one search field (Ctrl+K)',
  lead: 'One search field over every command, in a dialog near the top of the window. Ctrl+K (Command+K on Apple systems) opens it here too. The options panel changes the rows through size, density, touch and shape.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var id = h.uid('palette');
    return h.section('Try it', '<div class="sg-row" data-demo="buttons">' +
      '<button class="ds-btn ds-btn--tonal" type="button" data-ds-open="#' + id + '" data-demo="open">' + h.icon('search', 16) + 'Search or run a command</button>' +
      '<button class="ds-btn" type="button" data-demo="theme">Open on a page</button>' +
      '<button class="ds-btn" type="button" data-demo="tickets">Search tickets (slow)</button>' +
      '<button class="ds-btn" type="button" data-demo="nothing">Nothing found</button></div>' +
      palette(h, id, h.uid('palette-input')),
      'Type "adddev" or "dev" to see the fuzzy search and its marks, "&gt;" for the actions page, "#" for tickets (a slow search), "lap" for devices from a provider.') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Ctrl</kbd> <kbd class="ds-kbd">K</kbd> opens and closes it. ' +
        '<kbd class="ds-kbd">↑</kbd> <kbd class="ds-kbd">↓</kbd> move the active option, <kbd class="ds-kbd">Page Down</kbd> <kbd class="ds-kbd">Page Up</kbd> jump between groups, ' +
        '<kbd class="ds-kbd">Enter</kbd> runs it. <kbd class="ds-kbd">Esc</kbd> and <kbd class="ds-kbd">Backspace</kbd> in an empty field go back one page; Esc on the first page closes it. Focus stays in the field.</p>');
  },

  wire: function (root, h) {
    var dialog = h.$('[data-demo="palette"]', root);
    var done = function (text) { return function () { h.toast(text); }; };
    var wait = function (ms, signal) {
      return new Promise(function (resolve, reject) {
        var timer = setTimeout(resolve, h.slow(ms));
        if (signal) signal.addEventListener('abort', function () { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); });
      });
    };
    var match = function (list, query, label) {
      return list.filter(function (item) { return !query || DS.command.fuzzy(query, label(item)); });
    };
    var commands = [
      { id: 'add-device', label: 'Add a device', group: 'Devices', icon: DS.icons.plus, shortcut: 'mod+shift+a', keywords: ['new', 'create', 'laptop'], description: 'Register a laptop, tablet or phone', run: done('Opened the new device form.') },
      { id: 'devices', label: 'Open devices', group: 'Devices', icon: DS.icons.laptop, run: done('Opened the devices.') },
      { id: 'import', label: 'Import devices from a file', group: 'Devices', icon: DS.icons.upload, keywords: ['csv', 'upload'], run: done('Opened the import.') },
      { id: 'retire', label: 'Retire devices (needs admin rights)', group: 'Devices', icon: DS.icons.archive, disabled: true },
      { id: 'new-ticket', label: 'Open a ticket', group: 'Tickets', icon: DS.icons.ticket, shortcut: 'mod+shift+t', keywords: ['support', 'issue'], run: done('Opened a new ticket for Ada Lovelace.') },
      { id: 'tickets', label: 'Search tickets', group: 'Tickets', icon: DS.icons.search, prefix: '#', placeholder: 'Ticket number or title',
        children: function (query, context) {
          return wait(700, context.signal).then(function () {
            return match(TICKETS, query, function (ticket) { return ticket[0] + ' ' + ticket[1]; }).map(function (ticket) {
              return { id: ticket[0], label: ticket[1], description: ticket[0], icon: DS.icons.ticket, run: done('Opened ' + ticket[0] + '.') };
            });
          });
        } },
      { id: 'actions', label: 'Run an action', group: 'Actions', icon: DS.icons.zap, prefix: '>', children: [
        { id: 'sync', label: 'Sync every device now', icon: DS.icons.sync, run: done('Syncing 240 devices.') },
        { id: 'export', label: 'Export the inventory', icon: DS.icons.download, shortcut: 'mod+shift+e', run: done('Exported 240 devices.') },
        { id: 'report', label: 'Send the weekly report', icon: DS.icons.send, run: done('Sent the weekly report.') },
      ] },
      { id: 'theme', label: 'Change the theme', group: 'Settings', icon: DS.icons.palette, keywords: ['dark', 'light', 'colour'], children: [
        { id: 'theme-light', label: 'Light', icon: DS.icons.sun, run: done('The theme is light.') },
        { id: 'theme-dark', label: 'Dark', icon: DS.icons.moon, run: done('The theme is dark.') },
        { id: 'theme-system', label: 'As the system', icon: DS.icons.monitor, run: done('The theme follows the system.') },
      ] },
      { id: 'settings', label: 'Open the settings', group: 'Settings', icon: DS.icons.settings, shortcut: 'mod+,', run: done('Opened the settings.') },
      { id: 'shortcuts', label: 'Show the keyboard shortcuts', group: 'Help', icon: DS.icons.keyboard, run: done('The shortcut sheet opens with "?".') },
    ];
    var command = DS.command.create(dialog, {
      commands: commands,
      providers: [{ group: 'Devices found', minLength: 2, search: function (query, context) {
        return wait(300, context.signal).then(function () {
          return match(DEVICES, query, function (name) { return name; }).map(function (name) {
            return { id: 'device-' + name, label: name, description: 'Issued to Ada Lovelace', icon: DS.icons.laptop, run: done('Opened ' + name + '.') };
          });
        });
      } }],
    });
    var opener = function (event) { return event.target.closest('button'); };
    root.addEventListener('click', function (event) {
      var button = event.target.closest('[data-demo]');
      if (!button) return;
      var which = button.getAttribute('data-demo');
      if (which === 'theme') command.open({ opener: opener(event), page: 'theme' });
      else if (which === 'tickets') command.open({ opener: opener(event), page: 'tickets' });
      else if (which === 'nothing') command.open({ opener: opener(event), query: 'zzz' });
    });
    return function () { DS.overlay.close(dialog); };
  },
});
