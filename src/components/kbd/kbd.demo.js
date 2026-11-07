/*
 * The Key combos demo: shortcuts for this platform and pinned to each, a
 * sequence, combos in a menu item and a sentence, a shortcut sheet and a
 * combo the page changes. Registered through SG.demo() (styleguide/sg-core.js).
 * Shape comes from the options panel (a key's radius).
 */
var KBD_ROWS = [['mod+k', 'Search'], ['mod+s', 'Save'], ['mod+shift+p', 'Open the command list'], ['alt+arrowup', 'Move the row up'], ['shift+?', 'Show the shortcuts'], ['g i', 'Go to the inventory'], ['escape', 'Close the layer']];

SG.demo('kbd', {
  title: 'Key combos',
  group: 'content',
  need: 'Show a keyboard shortcut as the keys of the user\'s platform (⌘ or Ctrl), read out in words',
  lead: 'One combo string, the one DS.hotkeys registers, shown as the keys of the user\'s platform and read out in words. A single key in a sentence stays a plain .ds-kbd.',
  options: { sizes: false, density: false, shape: true, tones: false },

  render: function (h) {
    var row = function (combo, label, platform) {
      return '<tr><td>' + label + '</td><td><kbd class="ds-kbd-combo" data-ds-kbd="' + combo + '"' + (platform ? ' data-ds-kbd-platform="' + platform + '"' : '') + '></kbd></td></tr>';
    };
    return h.section('This platform', '<div class="ds-card"><table class="ds-table" data-demo="sheet"><thead><tr><th scope="col">Action</th><th scope="col">Keys</th></tr></thead><tbody>' +
        KBD_ROWS.map(function (r) { return row(r[0], r[1]); }).join('') + '</tbody></table></div>',
        'The keys of the platform this page runs on; a screen reader hears them in words.') +
      h.section('Pinned to a platform', '<div class="ds-grid-2"><div class="ds-card"><h3 class="ds-card__title">Apple systems</h3><table class="ds-table" data-demo="apple"><tbody>' + KBD_ROWS.slice(0, 4).map(function (r) { return row(r[0], r[1], 'apple'); }).join('') + '</tbody></table></div>' +
        '<div class="ds-card"><h3 class="ds-card__title">Windows and Linux</h3><table class="ds-table" data-demo="other"><tbody>' + KBD_ROWS.slice(0, 4).map(function (r) { return row(r[0], r[1], 'other'); }).join('') + '</tbody></table></div></div>',
        'data-ds-kbd-platform pins one, for a page that documents both.') +
      h.section('In a sentence and a list', '<div class="ds-card"><p>Press <kbd class="ds-kbd-combo" data-ds-kbd="mod+k"></kbd> to search, or <kbd class="ds-kbd">Esc</kbd> to close a layer.</p>' +
        '<ul class="ds-list" aria-label="Edit shortcuts" data-demo="list"><li class="ds-list__item">' + h.icon('copy', 20, 'ds-list__icon') + '<span class="ds-list__text"><span class="ds-list__title">Copy</span></span><span class="ds-list__meta"><kbd class="ds-kbd-combo" data-ds-kbd="mod+c"></kbd></span></li>' +
        '<li class="ds-list__item">' + h.icon('paste', 20, 'ds-list__icon') + '<span class="ds-list__text"><span class="ds-list__title">Paste</span></span><span class="ds-list__meta"><kbd class="ds-kbd-combo" data-ds-kbd="mod+v"></kbd></span></li></ul></div>') +
      h.section('A combo the page changes', '<div class="ds-card"><p>Search: <kbd class="ds-kbd-combo" data-ds-kbd="mod+k" data-demo="live"></kbd></p><div class="sg-row"><button class="ds-btn ds-sm" type="button" data-demo="swap">Use / instead</button></div></div>',
        'set() writes the new keys and the words at once.') +
      h.section('Keyboard', '<p class="ds-muted">A combo is no stop: it describes a shortcut. The control the shortcut presses carries aria-keyshortcuts from DS.kbd.keys(combo).aria.</p>');
  },

  wire: function (root, h) {
    var onClick = function (event) {
      var button = event.target.closest('[data-demo="swap"]');
      if (!button) return;
      var combo = window.DS.get(h.$('[data-demo="live"]', root), 'kbd');
      var slash = combo.get().combo === '/';
      combo.set(slash ? 'mod+k' : '/');
      button.textContent = slash ? 'Use / instead' : 'Use the default';
    };
    root.addEventListener('click', onClick);
    return function () { root.removeEventListener('click', onClick); };
  }
});
