/*
 * The Tabs demo: the two looks, across and down, with counts, icons, tabs
 * that close and tabs that are added, a row that overflows into a More
 * menu; a blocked tab; link tabs. Registered through SG.demo()
 * (styleguide/sg-core.js). Size, density, shape and touch come from the
 * options panel around it. data-ds-tabs brings the behaviour (selecting,
 * the keyboard, the indicator, closing, the overflow); the page listens to
 * ds:close and ds:add.
 */
var LOOKS = ['line', 'contained'];

var SECTIONS = [
  { id: 'details', label: 'Details', text: 'Laptop 14, issued to Ada Lovelace. Synced today at 09:12.' },
  { id: 'history', label: 'History', count: 3, text: 'Three changes this week: a new owner, a battery swap, a move to Building B.' },
  { id: 'reports', label: 'Reports', blocked: true, text: 'No reports yet.' },
];

var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** One tab and its panel, with ids unique on the page. */
function parts(h, entry, selected, glyph) {
  var tab = h.uid('tab');
  var panel = h.uid('panel');
  var count = entry.count ? '<span class="ds-tabs__count"><span class="ds-sr">, </span>' + entry.count + '</span>' : '';
  var action = entry.closes ? '<button class="ds-btn ds-btn--text" type="button" data-ds-tabs-close>Close ' + h.esc(entry.label) + '</button>' : '';
  return {
    tab: '<button class="ds-tabs__tab" role="tab" type="button" id="' + tab + '" aria-selected="' + selected + '" aria-controls="' + panel + '"' + (selected ? '' : ' tabindex="-1"') + (entry.closes ? ' aria-keyshortcuts="Delete"' : '') +
      (entry.blocked ? ' aria-disabled="true" data-tip="No reports for this device yet"' : '') + ' data-label="' + h.esc(entry.label) + '">' + (glyph ? h.icon(glyph, 18) : '') + entry.label + count + '</button>',
    panel: '<div class="ds-tabs__panel" role="tabpanel" id="' + panel + '" aria-labelledby="' + tab + '" tabindex="0"' + (selected ? '' : ' hidden') + ' style="padding-block-start: var(--ds-space-4);"><p class="ds-muted">' + entry.text + '</p>' + action + '</div>',
  };
}

/** A row and its panels; `extra` adds attributes to the row, `after` puts it in a bar with these buttons. */
function row(h, classes, label, entries, glyphs, extra, after) {
  var all = entries.map(function (entry, index) { return parts(h, entry, index === 0, glyphs && glyphs[index]); });
  var list = '<div class="ds-tabs' + (classes ? ' ' + classes : '') + '" role="tablist" aria-label="' + label + '" data-ds-tabs' + (extra || '') + '>' +
    all.map(function (part) { return part.tab; }).join('') + '</div>';
  return (after === undefined ? list : '<div class="ds-tabs__bar">' + list + after + '</div>') +
    all.map(function (part) { return part.panel; }).join('');
}

/** A row of tabs that close; `extra` and `after` as in row(). */
function closable(h, entries, label, extra, after) {
  var all = entries.map(function (entry, index) { entry.closes = true; return parts(h, entry, index === 0); });
  var list = '<div class="ds-tabs" role="tablist" aria-label="' + label + '" data-ds-tabs' + (extra || '') + '>' + all.map(function (part) {
    return '<span class="ds-tabs__item" role="none">' + part.tab +
      '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-xs ds-tabs__close" type="button" tabindex="-1" aria-hidden="true" data-tip="Close">' + h.icon('close', 16) + '</button></span>';
  }).join('') + '</div>';
  return (after === undefined ? list : '<div class="ds-tabs__bar">' + list + after + '</div>') +
    all.map(function (part) { return part.panel; }).join('');
}

SG.demo('tabs', {
  title: 'Tabs',
  group: 'navigation',
  need: 'Switch between the sections of one page or record: line or contained, across or down, with counts, icons, tabs that close or are added, and a More menu for the tabs that do not fit',
  lead: 'Sections of one page or record. The selected tab is its indicator, the label weight and ARIA, never colour alone. data-ds-tabs brings the behaviour; the options panel changes size, density, shape and touch around the demo.',
  options: { variants: LOOKS, sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var looks = LOOKS.filter(function (look) { return !h.variant || look === h.variant; });
    var settings = [
      { id: 'general', label: 'General', text: 'The name and the site of the device.' },
      { id: 'access', label: 'Access', count: 2, text: 'Two people may change this device.' },
      { id: 'sync', label: 'Sync', text: 'Nightly, no remote wipe.' },
    ];
    var queues = [['Open', 12], ['Waiting', 3], ['Escalated', 1], ['Scheduled', 4], ['On hold', 0], ['Resolved', 28], ['Closed', 140], ['Spam', 0]].map(function (entry) {
      return { label: entry[0], count: entry[1], text: entry[0] + ': the tickets in this queue.' };
    });
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

      h.section('More menu', row(h, h.variant === 'contained' ? 'ds-tabs--contained' : '', 'Queues', queues, null, ' data-ds-tabs-overflow', ''),
        'data-ds-tabs-overflow in a .ds-tabs__bar: the tabs that do not fit hide, and More lists them in a menu, with their counts. The selected tab always stays in the row. Narrow the width in the options panel.') +

      h.section('Vertical', '<div class="ds-tabs__columns" data-demo="columns"><div class="ds-tabs ds-tabs--vertical' + (h.variant === 'contained' ? ' ds-tabs--contained' : '') + '" role="tablist" aria-orientation="vertical" aria-label="Settings" data-ds-tabs>' +
        settings.map(function (entry, index) { entry.part = parts(h, entry, index === 0); return entry.part.tab; }).join('') +
        '</div><div>' + settings.map(function (entry) { return entry.part.panel; }).join('') + '</div></div>',
        'A column beside its panels, over them at 600px of the content: narrow the width in the options panel. Up and Down move.') +

      h.section('Tabs that close', closable(h, [
        { id: 'r1', label: 'March', text: 'The report for March.' },
        { id: 'r2', label: 'April', text: 'The report for April.' },
        { id: 'r3', label: 'May', text: 'The report for May.' },
      ], 'Open reports'), 'The close button lies over the tab, which keeps room for it. Delete on a tab closes it, and so does the action in its panel, the way a screen reader reaches it. The focus goes to the next tab when the selected one closes, and to the selected one otherwise. The last tab stays: the page cancels ds:close.') +

      h.section('Adding tabs', closable(h, [
        { id: 'a1', label: 'January', text: 'The report for January.' },
        { id: 'a2', label: 'February', text: 'The report for February.' },
      ], 'Drafts', ' data-ds-tabs-overflow', '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-tabs__add" type="button" aria-label="New report" data-tip="New report">' + h.icon('plus', 20) + '</button>'),
        'The add button sends ds:add; the page writes the tab with add(), and the new one takes the selection and the focus. Many tabs fold into More.') +

      h.section('Link tabs', '<nav class="ds-tabs ds-tabs--flush" aria-label="Device pages" data-ds-tabs data-demo="links"><a class="ds-tabs__tab" href="#" aria-current="page" data-label="Overview">Overview</a><a class="ds-tabs__tab" href="#" data-label="Activity">Activity</a><a class="ds-tabs__tab" href="#" data-label="Settings">Settings</a></nav>',
        'Navigation between the pages of a record: aria-current, a tab stop per link. --flush drops the hairline.') +

      h.section('Full width', row(h, 'ds-tabs--fill', 'Range', [
        { id: 'day', label: 'Day', text: 'Today.' },
        { id: 'week', label: 'Week', text: 'This week.' },
        { id: 'month', label: 'Month', text: 'This month.' },
      ])) +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches the selected tab, then the More and add buttons, then the panel. <kbd class="ds-kbd">Left</kbd> and <kbd class="ds-kbd">Right</kbd> (<kbd class="ds-kbd">Up</kbd> and <kbd class="ds-kbd">Down</kbd> in a column), <kbd class="ds-kbd">Home</kbd> and <kbd class="ds-kbd">End</kbd> move and select. <kbd class="ds-kbd">Delete</kbd> closes a tab that closes. More opens its menu with <kbd class="ds-kbd">Enter</kbd>, <kbd class="ds-kbd">Space</kbd> or <kbd class="ds-kbd">Down</kbd>.</p>');
  },

  wire: function (root, h) {
    var added = 2;
    // The last report stays open: the page cancels the close and says why.
    root.addEventListener('ds:close', function (event) {
      if (!event.target.matches('[data-ds-tabs]') || event.target.querySelectorAll('[role="tab"]').length > 1) return;
      event.preventDefault();
      h.toast('The last tab stays open.', 'info');
    });
    // A new report: the system writes the tab and selects it; the page fills its panel.
    root.addEventListener('ds:add', function (event) {
      var tabs = DS.get(event.target, 'tabs');
      if (!tabs) return;
      var label = MONTHS[added % MONTHS.length];
      added += 1;
      var made = tabs.add({ label: label });
      var text = document.createElement('p');
      text.className = 'ds-muted';
      text.textContent = 'A new report for ' + label + '.';
      made.panel.style.paddingBlockStart = 'var(--ds-space-4)';
      made.panel.append(text);
    });

    var links = h.$('[data-demo="links"]', root);
    links.addEventListener('click', function (event) {
      var link = event.target.closest('a');
      if (!link) return;
      event.preventDefault();
      h.$$('a', links).forEach(function (other) {
        if (other === link) other.setAttribute('aria-current', 'page');
        else other.removeAttribute('aria-current');
      });
    });
  },
});
