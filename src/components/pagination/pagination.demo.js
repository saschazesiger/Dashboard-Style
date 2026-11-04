/*
 * The Pagination demo: each variant, working, and the default under a table
 * in a card. Registered through SG.demo() (styleguide/sg-core.js). Size,
 * density, shape and touch come from the options panel around it. The page
 * number and the fake rows stand for what a project's script holds: the
 * system offers the markup, not yet a controller.
 */
var VARIANTS = ['default', 'simple', 'numbered', 'cursor'];
var TOTAL = 1234;
var FIGURES = new Intl.NumberFormat('en');

function iconButton(h, to, name, glyph) {
  return '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="' + name + '" data-tip="' + name + '" data-to="' + to + '">' + h.icon(glyph, 20) + '</button>';
}

function sizeField(h) {
  var id = h.uid('size');
  return '<div class="ds-pagination__size"><label class="ds-pagination__label" for="' + id + '">Rows per page</label>' +
    '<select class="ds-input ds-input--filled" id="' + id + '" data-size><option>25</option><option selected>50</option><option>100</option></select></div>';
}

function jumpField(h) {
  var id = h.uid('jump');
  return '<div class="ds-pagination__jump"><label class="ds-pagination__label" for="' + id + '">Go to page</label>' +
    '<input class="ds-input" id="' + id + '" type="number" inputmode="numeric" min="1" value="1" data-jump></div>';
}

function rangeOf(state) {
  var start = (state.page - 1) * state.size;
  return FIGURES.format(start + 1) + '–' + FIGURES.format(Math.min(TOTAL, start + state.size)) + ' of ' + FIGURES.format(TOTAL);
}

function lastOf(state) {
  return Math.ceil(TOTAL / state.size);
}

/* The pages around the current one, the first and the last; a gap where some are left out. */
function pagesHtml(state) {
  var last = lastOf(state);
  var out = '';
  var previous = 0;
  for (var page = 1; page <= last; page += 1) {
    if (page === 1 || page === last || Math.abs(page - state.page) <= 1) {
      if (page - previous > 1) out += '<li class="ds-pagination__gap" aria-hidden="true">…</li>';
      out += '<li data-ds-key="p' + page + '"><button class="ds-btn ds-btn--quiet ds-pagination__page" type="button" aria-label="Page ' + page + '" data-to="' + page + '"' + (page === state.page ? ' aria-current="page"' : '') + '>' + page + '</button></li>';
      previous = page;
    }
  }
  return out;
}

function bar(h, variant, label, state) {
  if (variant === 'simple') {
    return '<nav class="ds-pagination ds-pagination--simple" aria-label="' + label + '" data-variant="simple"><p class="ds-pagination__range" aria-live="polite" data-range>Page 1 of ' + lastOf(state) + '</p>' +
      iconButton(h, 'previous', 'Previous page', 'chevronLeft') + iconButton(h, 'next', 'Next page', 'chevronRight') + '</nav>';
  }
  if (variant === 'numbered') {
    return '<nav class="ds-pagination ds-pagination--numbered" aria-label="' + label + '" data-variant="numbered"><p class="ds-pagination__range" aria-live="polite" data-range>' + rangeOf(state) + '</p>' + jumpField(h) +
      iconButton(h, 'previous', 'Previous page', 'chevronLeft') + '<ol class="ds-pagination__pages" data-pages>' + pagesHtml(state) + '</ol>' + iconButton(h, 'next', 'Next page', 'chevronRight') + '</nav>';
  }
  if (variant === 'cursor') {
    return '<nav class="ds-pagination ds-pagination--cursor" aria-label="' + label + '" data-variant="cursor">' +
      '<button class="ds-btn ds-btn--quiet" type="button" data-to="previous">' + h.icon('chevronLeft', 16) + 'Newer</button>' +
      '<button class="ds-btn ds-btn--quiet" type="button" data-to="next">Older' + h.icon('chevronRight', 16) + '</button></nav>';
  }
  return '<nav class="ds-pagination" aria-label="' + label + '" data-variant="default">' + sizeField(h) + '<p class="ds-pagination__range" aria-live="polite" data-range>' + rangeOf(state) + '</p>' +
    iconButton(h, 'first', 'First page', 'chevronFirst') + iconButton(h, 'previous', 'Previous page', 'chevronLeft') +
    iconButton(h, 'next', 'Next page', 'chevronRight') + iconButton(h, 'last', 'Last page', 'chevronLast') + '</nav>';
}

function rowsOf(state) {
  var rows = '';
  var start = (state.page - 1) * 5;
  for (var i = start; i < start + 5; i += 1) {
    rows += '<tr data-ds-key="r' + i + '"><td class="ds-nowrap">LAPTOP-' + String(1000 + i * 7) + '</td><td class="ds-num">' + ((i * 37) % 100) + '%</td></tr>';
  }
  return rows;
}

SG.demo('pagination', {
  title: 'Pagination',
  group: 'navigation',
  need: 'Move through the pages of a long table or list',
  lead: 'The footer of a table whose records come in pages. Its buttons are ordinary buttons, so size, density, shape and touch in the options panel reach them. When the content area is at most 600px wide the size and jump fields drop, and a numbered bar keeps only the current page between previous and next: narrow the width.',
  options: { variants: VARIANTS, sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var variants = VARIANTS.filter(function (variant) { return !h.variant || variant === h.variant; });
    var names = { default: 'Rows per page, range, first and last', simple: 'Simple: previous and next', numbered: 'Numbered, with a jump', cursor: 'Cursor: no total' };
    return h.section('Variants', variants.map(function (variant) {
      return '<section class="ds-card" data-demo="' + variant + '"><h3 class="ds-card__title">' + names[variant] + '</h3>' +
        bar(h, variant, 'Pages, ' + variant, { page: 1, size: 50 }) + '</section>';
    }).join('')) +

      h.section('Under a table', '<section class="ds-card" data-demo="table"><div class="ds-table-wrap"><table class="ds-table"><caption class="ds-sr">Devices, in pages</caption><thead><tr><th scope="col">Device</th><th scope="col" class="ds-num">Load</th></tr></thead><tbody>' +
        rowsOf({ page: 1 }) + '</tbody></table></div>' + bar(h, 'default', 'Pages of devices', { page: 1, size: 50 }) + '</section>',
        'Right under the table with a hairline, out to the card\'s edges. A page change dims the rows while the page loads, then the new ones fade in.') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> goes through the fields and buttons; <kbd class="ds-kbd">Enter</kbd> or <kbd class="ds-kbd">Space</kbd> presses a button. A button that leads nowhere is <code>aria-disabled</code>: it keeps the focus and still says what it is.</p>');
  },

  wire: function (root, h) {
    /* A project's own script: it holds the page and writes the bar. */
    function wireBar(nav, onPage) {
      var variant = nav.getAttribute('data-variant');
      var state = { page: 1, size: 50 };
      var cursor = variant === 'cursor';
      function sync() {
        var last = cursor ? 6 : lastOf(state);
        var range = h.$('[data-range]', nav);
        if (range) range.textContent = variant === 'simple' ? 'Page ' + state.page + ' of ' + last : rangeOf(state);
        var pages = h.$('[data-pages]', nav);
        if (pages) DS.dom.morphHtml(pages, pagesHtml(state));
        var jump = h.$('[data-jump]', nav);
        if (jump) {
          jump.max = String(last);
          jump.value = String(state.page);
        }
        h.$$('[data-to]', nav).forEach(function (button) {
          var to = button.getAttribute('data-to');
          var blocked = ((to === 'first' || to === 'previous') && state.page === 1) || ((to === 'last' || to === 'next') && state.page === last);
          if (blocked) button.setAttribute('aria-disabled', 'true');
          else button.removeAttribute('aria-disabled');
        });
      }
      function go(page) {
        state.page = Math.max(1, Math.min(cursor ? 6 : lastOf(state), page));
        sync();
        if (onPage) onPage(state);
      }
      nav.addEventListener('click', function (event) {
        var button = event.target.closest('[data-to]');
        if (!button) return;
        var to = button.getAttribute('data-to');
        go(to === 'first' ? 1 : to === 'previous' ? state.page - 1 : to === 'next' ? state.page + 1 : to === 'last' ? lastOf(state) : Number(to));
      });
      nav.addEventListener('change', function (event) {
        if (event.target.matches('[data-size]')) {
          state.size = Number(event.target.value);
          go(1);
        }
        if (event.target.matches('[data-jump]')) go(Number(event.target.value) || 1);
      });
      sync();
    }

    var tableCard = h.$('[data-demo="table"]', root);
    var timer = 0;
    h.$$('nav.ds-pagination', root).forEach(function (nav) {
      wireBar(nav, nav.closest('[data-demo="table"]') ? function (state) {
        var tbody = h.$('tbody', tableCard);
        tableCard.classList.add('ds-stale');
        tableCard.setAttribute('aria-busy', 'true');
        clearTimeout(timer);
        timer = setTimeout(function () {
          DS.motion.flip(tbody, function (options) { DS.dom.morphHtml(tbody, rowsOf(state), options); }, { items: 'tr' });
          tableCard.classList.remove('ds-stale');
          tableCard.removeAttribute('aria-busy');
        }, h.slow(300));
      } : null);
    });
    return function () { clearTimeout(timer); };
  },
});
