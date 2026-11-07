/*
 * The Shortcut sheet demo: a toolbar whose buttons carry data-ds-hotkey, a
 * blocked one (listed as off), a view with a scope of its own that a switch
 * turns on, and the sheet that "?" opens; the same list rendered into a
 * card, as a help page shows it. wire() holds what a project writes: the
 * scope, its registrations and the messages after a shortcut.
 */
SG.demo('shortcuts', {
  title: 'Shortcut sheet',
  group: 'navigation',
  need: 'List every keyboard shortcut of the page when someone presses ?',
  lead: 'Press "?" anywhere outside a field: the sheet lists every shortcut registered with DS.hotkeys, by scope and group. Turn the board view on to add a scope of its own.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var id = h.uid('keys');
    var board = h.uid('board');
    return h.section('Shortcuts on the page', '<div class="sg-row" data-demo="toolbar">' +
      '<button class="ds-btn ds-btn--tonal" type="button" data-ds-open="#' + id + '" aria-keyshortcuts="?">' + h.icon('keyboard', 16) + 'Keyboard shortcuts <kbd class="ds-kbd">?</kbd></button>' +
      '<button class="ds-btn" type="button" data-ds-hotkey="mod+s" data-ds-hotkey-group="Editing" data-demo-toast="Saved LAPTOP-0042.">Save</button>' +
      '<button class="ds-btn" type="button" data-ds-hotkey="n" data-ds-hotkey-description="Open a ticket" data-ds-hotkey-group="Tickets" data-demo-toast="Opened a new ticket.">New ticket</button>' +
      '<button class="ds-btn" type="button" data-ds-hotkey="mod+shift+r" data-ds-hotkey-description="Restart the device" data-ds-hotkey-group="Devices" aria-disabled="true">Restart (offline)</button>' +
      '<input class="ds-input" type="search" aria-label="Search devices" placeholder="Search devices" data-ds-hotkey="/" data-ds-hotkey-description="Go to search" data-ds-hotkey-group="Navigation" style="max-width: 240px">' +
      '<label class="ds-switch"><input type="checkbox" role="switch" data-demo="board"><span class="ds-switch__track" aria-hidden="true"></span><span class="ds-switch__label">Board view</span></label>' +
      '</div>' +
      '<dialog class="ds-dialog ds-dialog--lg ds-shortcuts" id="' + id + '" data-ds-shortcuts aria-labelledby="' + id + '-title" data-ds-shortcuts-scopes=\'{"board":"Board view"}\' data-demo="sheet">' +
      '<div class="ds-dialog__backdrop" data-ds-close></div><div class="ds-dialog__box">' +
      '<div class="ds-dialog__head"><h2 class="ds-dialog__title" id="' + id + '-title">Keyboard shortcuts</h2>' +
      '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close" data-tip="Close" data-ds-close>' + h.icon('close', 20) + '</button></div>' +
      '<input class="ds-input ds-shortcuts__filter" type="search" aria-label="Find a shortcut" placeholder="Find a shortcut">' +
      '<div class="ds-dialog__body ds-shortcuts__list"></div></div></dialog>',
      '"Restart" is blocked while the device is offline: the sheet lists it as not available. "/" goes to the search field; "n" opens a ticket.') +

      h.section('In a help page', '<div class="ds-card" data-demo="help" id="' + board + '"><div class="ds-shortcuts__list" data-demo="inline"></div></div>',
        'DS.shortcuts.render() writes the same list into any element; this one is rendered again whenever a shortcut comes or goes.');
  },

  wire: function (root, h) {
    var scope = null;
    var registrations = [];
    var inline = h.$('[data-demo="inline"]', root);
    var paint = function () { DS.shortcuts.render(inline, { labels: { board: 'Board view' }, headingLevel: 3 }); };
    root.addEventListener('click', function (event) {
      var button = event.target.closest('[data-demo-toast]');
      if (button && button.getAttribute('aria-disabled') !== 'true') h.toast(button.getAttribute('data-demo-toast'));
    });
    h.$('[data-demo="board"]', root).addEventListener('change', function (event) {
      registrations.forEach(function (one) { one.destroy(); });
      registrations = [];
      if (scope) scope.destroy();
      scope = null;
      if (!event.target.checked) return;
      scope = DS.hotkeys.scope('board');
      registrations = [
        DS.hotkeys.register('j', function () { h.toast('Next card.', 'info'); }, { description: 'Next card', group: 'Cards', scope: 'board' }),
        DS.hotkeys.register('k', function () { h.toast('Previous card.', 'info'); }, { description: 'Previous card', group: 'Cards', scope: 'board' }),
        DS.hotkeys.register(['mod+arrowright', 'shift+l'], function () { h.toast('Moved the card to the next column.', 'info'); }, { description: 'Move the card to the next column', group: 'Cards', scope: 'board' }),
      ];
    });
    var off = DS.hotkeys.onChange(paint);
    paint();
    return function () {
      off();
      registrations.forEach(function (one) { one.destroy(); });
      if (scope) scope.destroy();
    };
  },
});
