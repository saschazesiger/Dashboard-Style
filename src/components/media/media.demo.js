/*
 * The Media demo: a gallery of pictures, recordings and files with
 * selection (the toolbar of the page shows the count), the variants
 * (square, wide, bare), an icon thumbnail, a selected and a disabled card,
 * an empty gallery, and the keyboard. Registered through SG.demo()
 * (styleguide/sg-core.js). Size, density, shape and touch come from the
 * options panel.
 */

/* Generic pictures: soft shapes on a ground (no real place or product). */
function picture(ground, shape, accent) {
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120"><rect width="160" height="120" fill="' + ground + '"/>' +
    '<circle cx="118" cy="34" r="16" fill="' + accent + '"/><path d="M0 120 L52 58 L88 96 L112 72 L160 120Z" fill="' + shape + '"/></svg>';
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

var ITEMS = [
  { key: 'm1', title: 'Device 12, front panel.jpg', meta: '2.4 MB · JPEG', img: picture('#cfe0f5', '#5b7fa8', '#f5c46b') },
  { key: 'm2', title: 'Device 12, rack.jpg', meta: '1.9 MB · JPEG', img: picture('#d9ecd9', '#4f8a5b', '#f0a35c'), tag: 'RAW' },
  { key: 'm3', title: 'Inspection walkthrough.mp4', meta: '48 MB · Video', icon: 'video', tag: '0:42', cls: 'ds-media--wide' },
  { key: 'm4', title: 'Ticket TCK-1042 report.pdf', meta: '320 KB · PDF', icon: 'fileText', tag: '12 pages' },
  { key: 'm5', title: 'Product sketch.png', meta: '860 KB · PNG', img: picture('#ecdff5', '#8a5ba8', '#6bc4f5') },
  { key: 'm6', title: 'Sensor log.csv', meta: '1.1 MB · CSV', icon: 'fileSpreadsheet' },
  { key: 'm7', title: 'Floor plan.svg', meta: '96 KB · SVG', img: picture('#f5e6cf', '#a8865b', '#5bb0a8') },
  { key: 'm8', title: 'Spare parts.zip', meta: '14 MB · Archive', icon: 'fileArchive' },
];

function card(h, item, opts) {
  opts = opts || {};
  var menu = h.uid('media-menu');
  var name = h.esc(item.title);
  var thumb = item.img ? '<img src="' + item.img + '" alt="">' : h.icon(item.icon, 32);
  return '<li class="ds-media' + (item.cls ? ' ' + item.cls : '') + (opts.cls ? ' ' + opts.cls : '') + '" data-ds-key="' + item.key + '">' +
    '<span class="ds-media__thumb">' + thumb + (item.tag ? '<span class="ds-media__tag">' + h.esc(item.tag) + '</span>' : '') + '</span>' +
    '<a class="ds-media__open" href="#' + item.key + '"><span class="ds-media__title">' + name + '</span></a>' +
    '<span class="ds-media__meta">' + h.esc(item.meta) + '</span>' +
    '<span class="ds-media__select"><input class="ds-checkbox ds-media__check" type="checkbox" aria-label="Select ' + name + '"' + (opts.checked ? ' checked' : '') + (opts.disabled ? ' disabled' : '') + '></span>' +
    '<span class="ds-media__actions">' +
      '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-label="More for ' + name + '" aria-haspopup="menu" aria-expanded="false" data-ds-open="#' + menu + '">' + h.icon('moreVertical', 20) + '</button>' +
      '<div class="ds-menu" role="menu" id="' + menu + '" aria-label="' + name + '" hidden>' +
        '<button class="ds-menu__item" role="menuitem" type="button" data-demo-action="Download">' + h.icon('download', 20) + '<span class="ds-menu__label">Download</span></button>' +
        '<button class="ds-menu__item" role="menuitem" type="button" data-demo-action="Rename">' + h.icon('pencil', 20) + '<span class="ds-menu__label">Rename</span></button>' +
        '<button class="ds-menu__item" role="menuitem" type="button" data-demo-action="Delete">' + h.icon('trash', 20) + '<span class="ds-menu__label">Delete file</span></button>' +
      '</div>' +
    '</span>' +
  '</li>';
}

SG.demo('media', {
  title: 'Media',
  group: 'data',
  need: 'Show files, photos or recordings as thumbnails in a grid that can be opened, selected and acted on',
  lead: 'Each card opens as a whole, carries its own actions and can be selected: one tab stop for the grid, the arrows between cards, Space to select, Shift for a range.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    return h.section('Gallery',
      '<div class="ds-selection-bar" role="toolbar" aria-label="Selected files" data-demo="bar" hidden>' +
        '<p class="ds-selection-bar__count" aria-live="polite" data-demo="count"></p>' +
        '<div class="ds-selection-bar__actions">' +
          '<button class="ds-btn ds-btn--tonal ds-sm" type="button" data-demo-bulk="Download">' + h.icon('download', 16) + 'Download</button>' +
          '<button class="ds-btn ds-sm" type="button" data-demo="clear">Clear</button>' +
        '</div>' +
      '</div>' +
      '<ul class="ds-media-grid" aria-label="Files of device 12" data-ds-media data-demo="grid">' +
        ITEMS.map(function (item) { return card(h, item); }).join('') +
      '</ul>', 'Hover or focus a card for its checkbox; once one is selected, all show. The picture opens; the menu acts on one file.') +

      h.section('Variants and states',
        '<ul class="ds-media-grid" aria-label="Variants" data-ds-media data-demo="variants">' +
          card(h, { key: 'v1', title: 'Square: Device 7.jpg', meta: '1.2 MB · JPEG', img: picture('#cfe0f5', '#5b7fa8', '#f5c46b'), cls: 'ds-media--square' }) +
          card(h, { key: 'v2', title: 'Wide: Walkthrough.mp4', meta: '48 MB · Video', icon: 'video', tag: '0:42', cls: 'ds-media--wide' }) +
          card(h, { key: 'v3', title: 'Bare: Product photo.jpg', meta: '2 MB · JPEG', img: picture('#ecdff5', '#8a5ba8', '#6bc4f5'), cls: 'ds-media--bare' }) +
          card(h, { key: 'v4', title: 'Selected: Floor plan.svg', meta: '96 KB · SVG', img: picture('#f5e6cf', '#a8865b', '#5bb0a8') }, { checked: true }) +
          card(h, { key: 'v5', title: 'Locked: Audit export.pdf', meta: 'Read only', icon: 'lock' }, { disabled: true }) +
        '</ul>', 'Square, wide, bare (the text read but not shown), selected, and one whose checkbox is disabled.') +

      h.section('Empty',
        '<div class="ds-empty ds-empty--no-data ds-empty--section"><span class="ds-empty__disc" aria-hidden="true">' + h.icon('image', 24) + '</span>' +
        '<p class="ds-empty__title">No files yet</p><p class="ds-empty__text">Photos and documents of this device appear here.</p></div>',
        'An empty gallery is an empty state.') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> enters the grid at one card (then its checkbox and menu). <kbd class="ds-kbd">←</kbd> <kbd class="ds-kbd">→</kbd> <kbd class="ds-kbd">↑</kbd> <kbd class="ds-kbd">↓</kbd> move between cards, <kbd class="ds-kbd">Home</kbd> <kbd class="ds-kbd">End</kbd> to the ends. <kbd class="ds-kbd">Space</kbd> selects, <kbd class="ds-kbd">Shift</kbd> + <kbd class="ds-kbd">Space</kbd> a range, <kbd class="ds-kbd">Ctrl</kbd> + <kbd class="ds-kbd">A</kbd> all, <kbd class="ds-kbd">Esc</kbd> none. <kbd class="ds-kbd">Enter</kbd> opens.</p>');
  },

  wire: function (root, h) {
    var grid = h.$('[data-demo="grid"]', root);
    var bar = h.$('[data-demo="bar"]', root);
    var count = h.$('[data-demo="count"]', root);
    var show = function (selected) {
      bar.hidden = !selected.length;
      count.textContent = selected.length + ' selected';
    };
    grid.addEventListener('ds:change', function (event) { show(event.detail.selected); });
    root.addEventListener('click', function (event) {
      var open = event.target.closest('.ds-media__open');
      if (open) {
        event.preventDefault();
        h.toast('Open ' + open.textContent, 'info');
        return;
      }
      var action = event.target.closest('[data-demo-action]');
      if (action) {
        var title = action.closest('.ds-media').querySelector('.ds-media__title').textContent;
        h.toast(action.getAttribute('data-demo-action') + ' ' + title, 'info');
        return;
      }
      if (event.target.closest('[data-demo="clear"]')) DS.core.get(grid, 'media').clear();
      var bulk = event.target.closest('[data-demo-bulk]');
      if (bulk) h.toast(bulk.getAttribute('data-demo-bulk') + ' ' + DS.core.get(grid, 'media').get().length + ' files', 'info');
    });
  },
});
