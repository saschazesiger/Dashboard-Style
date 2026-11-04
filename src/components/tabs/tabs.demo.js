/*
 * The Tabs demo: the two looks, across and down, with counts, icons and
 * tabs that close; a blocked tab; link tabs. Registered through SG.demo()
 * (styleguide/sg-core.js). Size, density, shape and touch come from the
 * options panel around it. Selecting and closing are what a project wires
 * itself: the system brings the indicator and the keyboard.
 */
var LOOKS = ['line', 'contained'];

var SECTIONS = [
  { id: 'details', label: 'Details', text: 'Latitude 7440, issued to Ada Lovelace. Synced today at 09:12.' },
  { id: 'history', label: 'History', count: 3, text: 'Three changes this week: a new owner, a battery swap, a move to Building B.' },
  { id: 'reports', label: 'Reports', blocked: true, text: 'No reports yet.' },
];

/** One tab and its panel, with ids unique on the page. */
function parts(h, entry, selected, glyph) {
  var tab = h.uid('tab');
  var panel = h.uid('panel');
  var count = entry.count ? '<span class="ds-tabs__count"><span class="ds-sr">, </span>' + entry.count + '</span>' : '';
  return {
    tab: '<button class="ds-tabs__tab" role="tab" type="button" id="' + tab + '" aria-selected="' + selected + '" aria-controls="' + panel + '"' + (selected ? '' : ' tabindex="-1"') +
      (entry.blocked ? ' aria-disabled="true" data-tip="No reports for this device yet"' : '') + ' data-label="' + h.esc(entry.label) + '">' + (glyph ? h.icon(glyph, 18) : '') + entry.label + count + '</button>',
    panel: '<div class="ds-tabs__panel" role="tabpanel" id="' + panel + '" aria-labelledby="' + tab + '" tabindex="0"' + (selected ? '' : ' hidden') + ' style="padding-block-start: var(--ds-space-4);"><p class="ds-muted">' + entry.text + '</p></div>',
  };
}

function row(h, classes, label, entries, glyphs) {
  var all = entries.map(function (entry, index) { return parts(h, entry, index === 0, glyphs && glyphs[index]); });
  return '<div class="ds-tabs' + (classes ? ' ' + classes : '') + '" role="tablist" aria-label="' + label + '" data-demo="tabs">' +
    all.map(function (part) { return part.tab; }).join('') + '</div>' +
    all.map(function (part) { return part.panel; }).join('');
}

function closable(h, entries) {
  var all = entries.map(function (entry, index) { return parts(h, entry, index === 0); });
  return '<div class="ds-tabs" role="tablist" aria-label="Open reports" data-demo="tabs" data-closable>' + all.map(function (part, index) {
    return '<span class="ds-tabs__item" role="none">' + part.tab +
      '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-xs ds-tabs__close" type="button" tabindex="-1" aria-label="Close ' + h.esc(entries[index].label) + '" data-tip="Close">' + h.icon('close', 16) + '</button></span>';
  }).join('') + '</div>' + all.map(function (part) { return part.panel; }).join('');
}

SG.demo('tabs', {
  title: 'Tabs',
  group: 'navigation',
  need: 'Switch between the sections of one page or record: line or contained, across or down, with counts, icons and tabs that close',
  lead: 'Sections of one page or record. The selected tab is its indicator, the label weight and ARIA, never colour alone. The options panel changes size, density, shape and touch around the demo.',
  options: { variants: LOOKS, sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var looks = LOOKS.filter(function (look) { return !h.variant || look === h.variant; });
    var settings = [
      { id: 'general', label: 'General', text: 'The name and the site of the device.' },
      { id: 'access', label: 'Access', count: 2, text: 'Two people may change this device.' },
      { id: 'sync', label: 'Sync', text: 'Nightly, no remote wipe.' },
    ];
    var look = function (name) { return 'ds-tabs--' + name; };
    return looks.map(function (name) {
      return h.section(name === 'line' ? 'Line' : 'Contained', row(h, look(name), name === 'line' ? 'Device' : 'Device, contained', SECTIONS),
        name === 'line' ? 'A row over a hairline, a bar under the selected tab. Reports is aria-disabled: it takes the focus and keeps its panel.' : 'A tray, the selected tab a surface pill that glides inside it; the row keeps its height.');
    }).join('') +

      h.section('Icons and counts', row(h, '', 'Inbox', [
        { id: 'open', label: 'Open', count: 12, text: 'Twelve open tickets.' },
        { id: 'waiting', label: 'Waiting', count: 3, text: 'Three tickets wait for an answer.' },
        { id: 'closed', label: 'Closed', text: 'Closed this week.' },
      ], ['inbox', 'clock', 'check']), 'An icon before the label, a count after it: data-label keeps the width of the heavier weight under the text.') +

      h.section('Vertical', '<div class="ds-tabs__columns" data-demo="columns"><div class="ds-tabs ds-tabs--vertical' + (h.variant === 'contained' ? ' ds-tabs--contained' : '') + '" role="tablist" aria-orientation="vertical" aria-label="Settings" data-demo="tabs" data-orientation="vertical">' +
        settings.map(function (entry, index) { entry.part = parts(h, entry, index === 0); return entry.part.tab; }).join('') +
        '</div><div>' + settings.map(function (entry) { return entry.part.panel; }).join('') + '</div></div>',
        'A column beside its panels, over them at 600px of the content: narrow the width in the options panel. Up and Down move.') +

      h.section('Tabs that close', closable(h, [
        { id: 'r1', label: 'March', text: 'The report for March.' },
        { id: 'r2', label: 'April', text: 'The report for April.' },
        { id: 'r3', label: 'May', text: 'The report for May.' },
      ]), 'The close button lies over the tab, which keeps room for it. Delete on a tab closes it too; the page picks the next tab and moves the focus.') +

      h.section('Link tabs', '<nav class="ds-tabs ds-tabs--flush" aria-label="Device pages" data-demo="links"><a class="ds-tabs__tab" href="#" aria-current="page" data-label="Overview">Overview</a><a class="ds-tabs__tab" href="#" data-label="Activity">Activity</a><a class="ds-tabs__tab" href="#" data-label="Settings">Settings</a></nav>',
        'Navigation between the pages of a record: aria-current, a tab stop per link. --flush drops the hairline.') +

      h.section('Full width', row(h, 'ds-tabs--fill', 'Range', [
        { id: 'day', label: 'Day', text: 'Today.' },
        { id: 'week', label: 'Week', text: 'This week.' },
        { id: 'month', label: 'Month', text: 'This month.' },
      ])) +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches the selected tab, then its panel. <kbd class="ds-kbd">Left</kbd> and <kbd class="ds-kbd">Right</kbd> (<kbd class="ds-kbd">Up</kbd> and <kbd class="ds-kbd">Down</kbd> in a column), <kbd class="ds-kbd">Home</kbd> and <kbd class="ds-kbd">End</kbd> move and select. <kbd class="ds-kbd">Delete</kbd> closes a tab that closes.</p>');
  },

  wire: function (root, h) {
    var handles = [];
    var select = function (tablist, tab, focus) {
      h.$$('[role="tab"]', tablist).forEach(function (other) {
        var selected = other === tab;
        other.setAttribute('aria-selected', String(selected));
        other.tabIndex = selected ? 0 : -1;
        var panel = h.$('#' + other.getAttribute('aria-controls'), root);
        if (panel.hidden === selected) {
          panel.hidden = !selected;
          if (selected) DS.motion.enter(panel, 'swap');
        }
      });
      if (focus) tab.focus();
    };
    var close = function (tablist, tab) {
      var tabs = h.$$('[role="tab"]', tablist);
      if (tabs.length < 2) { h.toast('The last tab stays open.', 'info'); return; }
      var at = tabs.indexOf(tab);
      var next = tabs[at + 1] || tabs[at - 1];
      var wasSelected = tab.getAttribute('aria-selected') === 'true';
      if (wasSelected) select(tablist, next, true);
      h.$('#' + tab.getAttribute('aria-controls'), root).remove();
      tab.closest('.ds-tabs__item').remove();
    };

    h.$$('[data-demo="tabs"]', root).forEach(function (tablist) {
      var vertical = tablist.getAttribute('data-orientation') === 'vertical';
      handles.push(DS.indicator.createIndicator(tablist, { active: '[aria-selected="true"]', className: 'ds-tabs__indicator', reveal: true }));
      handles.push(DS.dom.roving(tablist, vertical ? { orientation: 'vertical' } : {}));
      tablist.addEventListener('click', function (event) {
        var closer = event.target.closest('.ds-tabs__close');
        if (closer) { close(tablist, h.$('[role="tab"]', closer.parentNode)); return; }
        var tab = event.target.closest('[role="tab"]');
        if (!tab || tab.getAttribute('aria-disabled') === 'true' || tab.getAttribute('aria-selected') === 'true') return;
        select(tablist, tab);
      });
      if (tablist.hasAttribute('data-closable')) {
        tablist.addEventListener('keydown', function (event) {
          var tab = event.target.closest('[role="tab"]');
          if (event.key === 'Delete' && tab) { event.preventDefault(); close(tablist, tab); }
        });
      }
    });

    var links = h.$('[data-demo="links"]', root);
    handles.push(DS.indicator.createIndicator(links, { active: '[aria-current="page"]', className: 'ds-tabs__indicator' }));
    links.addEventListener('click', function (event) {
      var link = event.target.closest('a');
      if (!link) return;
      event.preventDefault();
      h.$$('a', links).forEach(function (other) {
        if (other === link) other.setAttribute('aria-current', 'page');
        else other.removeAttribute('aria-current');
      });
    });

    return function () { handles.forEach(function (handle) { handle.destroy(); }); };
  },
});
