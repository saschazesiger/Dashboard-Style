/*
 * The Jump links demo: a table of contents beside a device record and a bar
 * of anchors over it, each in a scrolling box of its own, so the scroll-spy
 * runs whatever the page around does. Registered through SG.demo()
 * (styleguide/sg-core.js). data-ds-toc brings the behaviour; the hash stays
 * the styleguide's (data-ds-toc-hash="off"). Size, density, shape and touch
 * come from the options panel.
 */
var RECORD = [
  { id: 'overview', title: 'Overview', text: 'Laptop 14, issued to Ada Lovelace in Building B. Synced today at 09:12; the next check runs tonight.' },
  { id: 'hardware', title: 'Hardware', text: 'A 14-inch laptop with 16 GB of memory.', children: [
    { id: 'storage', title: 'Storage', text: '512 GB, 61 % used. Encryption is on.' },
    { id: 'battery', title: 'Battery', text: 'Health 92 %, 214 cycles. Replaced once, in March.' },
  ] },
  { id: 'network', title: 'Network', text: 'Office network, on the device subnet. The last address was seen at 09:12.' },
  { id: 'software', title: 'Software', count: 3, text: 'Three updates wait for the next restart: the system, the browser and the office suite.' },
  { id: 'history', title: 'History', text: 'Issued in January. A new owner in March, a battery swap in April, a move to Building B in May.' },
  { id: 'notes', title: 'Notes', text: 'The charger stays at the desk. Ask Ada Lovelace before a remote wipe.' },
];

/** Ids unique on the page for every section, made once per render. */
function ids(h) {
  var map = {};
  var walk = function (list) { list.forEach(function (entry) { map[entry.id] = h.uid('toc-' + entry.id); if (entry.children) walk(entry.children); }); };
  walk(RECORD);
  return map;
}

function links(h, map, list) {
  return '<ol class="ds-toc__list">' + list.map(function (entry) {
    var count = entry.count ? '<span class="ds-toc__count"><span class="ds-sr">, </span>' + entry.count + '</span>' : '';
    return '<li><a class="ds-toc__link" href="#' + map[entry.id] + '">' + entry.title + count + '</a>' + (entry.children ? links(h, map, entry.children) : '') + '</li>';
  }).join('') + '</ol>';
}

function sections(h, map, list, level) {
  return list.map(function (entry) {
    return '<section aria-labelledby="' + map[entry.id] + '"><h' + level + ' id="' + map[entry.id] + '" style="margin: var(--ds-space-5) 0 var(--ds-space-2); font: var(--ds-font-' + (level === 3 ? 'title' : 'subtitle') + '); scroll-margin-top: var(--ds-space-2);">' + entry.title + '</h' + level + '>' +
      '<p class="ds-muted" style="margin: 0; min-block-size: 120px;">' + entry.text + '</p>' + (entry.children ? sections(h, map, entry.children, level + 1) : '') + '</section>';
  }).join('');
}

var BOX = 'block-size: 360px; overflow-y: auto; border: 1px solid var(--ds-line); border-radius: calc(var(--ds-radius-md) * var(--ds-shape, 1)); padding: 0 var(--ds-space-4);';

SG.demo('toc', {
  title: 'Jump links',
  group: 'navigation',
  need: 'Jump between the sections of a long page and see which one is being read: a table of contents beside the content or a bar of anchors over it, sticky',
  lead: 'The sections of a long page, the one being read marked as the reader scrolls (aria-current="location", the label weight and a bar, never colour alone). A link scrolls to its section and moves the focus there. Scroll inside each box.',
  options: { variants: ['column', 'bar'], sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var column = !h.variant || h.variant === 'column';
    var bar = !h.variant || h.variant === 'bar';
    var out = '';
    if (column) {
      var a = ids(h);
      var title = h.uid('toc-title');
      out += h.section('Table of contents', '<div style="' + BOX + '" data-demo="column-box"><div style="display: flex; flex-wrap: wrap; align-items: start; gap: 0 var(--ds-space-5); padding-block-end: var(--ds-space-5);">' +
        '<nav class="ds-toc ds-toc--sticky" aria-labelledby="' + title + '" data-ds-toc data-ds-toc-hash="off" style="flex: 1 1 10rem; max-inline-size: 14rem; padding-block-start: var(--ds-space-4);"><p class="ds-toc__title" id="' + title + '">On this page</p>' + links(h, a, RECORD) + '</nav>' +
        '<article style="flex: 999 1 18rem; min-inline-size: 0;">' + sections(h, a, RECORD, 3) + '</article></div></div>',
        'A column beside the content, sticky inside its scroller; nested sections are indented and the bar stays on the line. A count after a label reads with it. On a narrow page the column sits above the text and stops sticking.');
    }
    if (bar) {
      var b = ids(h);
      out += h.section('Bar of anchors', '<div style="' + BOX + ' padding-block-start: 0;" data-demo="bar-box">' +
        '<nav class="ds-toc ds-toc--bar ds-toc--sticky" aria-label="Sections" data-ds-toc data-ds-toc-hash="off" style="margin-inline: calc(-1 * var(--ds-space-4)); padding-inline: var(--ds-space-2);">' + links(h, b, RECORD) + '</nav>' +
        '<article style="padding-block-end: var(--ds-space-5);">' + sections(h, b, RECORD, 3) + '</article></div>',
        'A row of anchors over the content, as the section anchors of an object page: it sticks at the top on --ds-toc-bg, scrolls sideways when narrow and keeps the current one in view. Only the first level shows.');
    }
    return out + h.section('Keyboard', '<p class="ds-muted">Every link is a tab stop. <kbd class="ds-kbd">Enter</kbd> on a link scrolls its section to the top and moves the focus there, so <kbd class="ds-kbd">Tab</kbd> goes on inside the section. A screen reader hears the current link as the current location.</p>');
  },
});
