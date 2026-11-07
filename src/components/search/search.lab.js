/* The search field's recent searches: the list grows out of the pill through DS.overlay, as the combobox's. */
SG_LAB.add({
  id: 'search-recent',
  group: 'controls',
  title: 'Search: recent searches',
  note: '<code>DS.search.create()</code>: in an empty field the recent searches open under the pill as a combobox list (<code>DS.overlay</code>: a fade on <code>--ds-dur-fast</code>, the clip and the scale on <code>--ds-ease-spatial</code>), and close with a fade.',
  shows: ['DS.search.create', '.ds-search__popup', '.ds-search__clear', '--ds-ease-spatial'],
  // The icons come in at setup: DS is not there yet when this file registers.
  html: '<div class="ds-search" data-ds-search-recent="sg-lab">' +
    '<input class="ds-input" type="search" aria-label="Search devices" placeholder="Search devices" autocomplete="off">' +
    '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-search__clear" type="button" hidden></button></div>',
  height: 280,
  setup: function (stage) {
    var root = stage.querySelector('.ds-search');
    root.insertAdjacentHTML('afterbegin', DS.icons.icon(DS.icons.search, 20));
    root.querySelector('.ds-search__clear').innerHTML = DS.icons.icon(DS.icons.close, 18);
    stage.search = DS.search.create(root);
    ['laptop', 'router', 'printer'].reverse().forEach(function (value) { stage.search.remember(value); });
  },
  play: function (stage) {
    var input = stage.querySelector('input');
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    var popup = stage.querySelector('.ds-search__popup');
    return popup ? DS.motion.settled(popup) : Promise.resolve();
  },
  toggle: function (stage, on) {
    var input = stage.querySelector('input');
    var popup = stage.querySelector('.ds-search__popup');
    if (on) {
      input.focus();
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
      popup = stage.querySelector('.ds-search__popup');
    } else if (popup) {
      DS.overlay.close(popup);
    }
    return popup ? DS.motion.settled(popup) : Promise.resolve();
  },
  state: function (stage) {
    var popup = stage.querySelector('.ds-search__popup');
    return Boolean(popup && !popup.hidden && popup.getAttribute('data-state') === 'open');
  },
  reset: function (stage) {
    if (stage.search) stage.search.destroy();
    stage.search = DS.search.create(stage.querySelector('.ds-search'));
  },
});
