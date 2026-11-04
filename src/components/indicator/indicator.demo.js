/*
 * The Indicator demo: the pill under a switch of links, a group of radio
 * buttons, tabs and a vertical list, each with the look of its component, and
 * the empty state. Declarative (data-ds-indicator and DS.init()); wire() only
 * moves the active item, as a project would. Size, density, shape and touch
 * come from the options panel: the pill follows what it measures.
 */
var MODES = ['Live', 'Admin', 'Reports'];
var VIEWS = ['List', 'Cards', 'Map'];
var TABS = ['Details', 'History', 'Tickets'];
var PAGES = ['Overview', 'Devices', 'People'];

SG.demo('indicator', {
  title: 'Indicator',
  group: 'motion',
  need: 'Slide one pill between the items of a tab bar or segmented switch',
  lead: 'One pill behind the items of a track glides to the active one, stretching toward it and landing on the spring; a longer jump takes longer. It follows the attribute by itself, so the page only moves aria-current, aria-checked or aria-selected.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var tabs = h.uid('tabs');
    return h.section('A switch of links', '<nav class="ds-segmented" aria-label="Mode" data-ds-indicator=\'[aria-current="true"]\' data-ds-indicator-class="ds-segmented__indicator" data-demo="links">' +
      MODES.map(function (name, index) {
        return '<a class="ds-segmented__option" href="#' + name.toLowerCase() + '"' + (index === 0 ? ' aria-current="true"' : '') + ' data-label="' + name + '">' + name + '</a>';
      }).join('') + '</nav>') +

      h.section('A radio group', '<div class="ds-segmented" role="radiogroup" aria-label="View" data-ds-indicator=\'[aria-checked="true"]\' data-ds-indicator-class="ds-segmented__indicator" data-demo="radios">' +
        VIEWS.map(function (name, index) {
          return '<button class="ds-segmented__option" type="button" role="radio" aria-checked="' + (index === 0) + '" tabindex="' + (index === 0 ? 0 : -1) + '" data-label="' + name + '">' + name + '</button>';
        }).join('') + '</div><p class="ds-muted"><kbd class="ds-kbd">Arrow</kbd> keys, <kbd class="ds-kbd">Home</kbd> and <kbd class="ds-kbd">End</kbd> move and choose (DS.dom.roving()); the pill follows.</p>') +

      h.section('Tabs: only the bottom edge is painted', '<div class="ds-tabs" role="tablist" aria-label="Device" data-ds-indicator=\'[aria-selected="true"]\' data-ds-indicator-class="ds-tabs__indicator" data-demo="tabs">' +
        TABS.map(function (name, index) {
          return '<button class="ds-tabs__tab" role="tab" type="button" id="' + tabs + '-' + index + '" aria-selected="' + (index === 0) + '" tabindex="' + (index === 0 ? 0 : -1) + '" data-label="' + name + '">' + name + '</button>';
        }).join('') + '</div>') +

      h.section('Vertically, in a list', '<div class="ds-drawer__group" data-ds-indicator=\'[aria-current="page"]\' data-ds-indicator-class="ds-drawer__indicator" data-demo="list">' +
        PAGES.map(function (name, index) {
          return '<a class="ds-drawer__item" href="#' + name.toLowerCase() + '"' + (index === 0 ? ' aria-current="page"' : '') + '>' + h.icon(index === 0 ? 'home' : index === 1 ? 'laptop' : 'user', 20) + '<span class="ds-drawer__label">' + name + '</span></a>';
        }).join('') + '</div>') +

      h.section('No active item', '<div class="sg-row"><button class="ds-btn" type="button" aria-pressed="false" data-demo="clear">No current mode</button></div>' +
        '<p class="ds-muted">The pill contracts to its centre and fades; an item after that grows from its centre, and one that comes while it still contracts turns it from where it is.</p>');
  },

  wire: function (root, h) {
    var links = h.$('[data-demo="links"]', root);
    var clear = h.$('[data-demo="clear"]', root);
    var last = 0;

    function currentLink(index) {
      h.$$('a', links).forEach(function (link, at) {
        if (at === index) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    }

    links.addEventListener('click', function (event) {
      var link = event.target.closest('a');
      if (!link) return;
      event.preventDefault();
      last = h.$$('a', links).indexOf(link);
      clear.setAttribute('aria-pressed', 'false');
      currentLink(last);
    });

    clear.addEventListener('click', function () {
      var on = clear.getAttribute('aria-pressed') !== 'true';
      clear.setAttribute('aria-pressed', String(on));
      currentLink(on ? -1 : last);
    });

    /* A group of one choice: the arrow keys move and click the item (DS.dom.roving()), the click chooses. */
    [['[data-demo="radios"]', '.ds-segmented__option', 'aria-checked'], ['[data-demo="tabs"]', '.ds-tabs__tab', 'aria-selected']].forEach(function (group) {
      var track = h.$(group[0], root);
      DS.dom.roving(track, { items: group[1] });
      track.addEventListener('click', function (event) {
        var item = event.target.closest(group[1]);
        if (!item) return;
        h.$$(group[1], track).forEach(function (other) { other.setAttribute(group[2], String(other === item)); });
      });
    });

    var list = h.$('[data-demo="list"]', root);
    list.addEventListener('click', function (event) {
      var item = event.target.closest('a');
      if (!item) return;
      event.preventDefault();
      h.$$('a', list).forEach(function (other) {
        if (other === item) other.setAttribute('aria-current', 'page');
        else other.removeAttribute('aria-current');
      });
    });
  },
});
