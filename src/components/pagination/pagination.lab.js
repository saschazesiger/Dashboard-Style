/*
 * The Motion Lab entry of the pagination: a page change. The rows dim while
 * the page loads, the range changes at once, then the old rows go at once and
 * the new ones fade in. A classic script: the build wraps it into
 * styleguide/lab-components.js.
 */
var PAGE_SIZE = 3;

function pageRows(page) {
  var rows = '';
  for (var i = page * PAGE_SIZE; i < (page + 1) * PAGE_SIZE; i += 1) {
    rows += '<tr data-ds-key="p' + i + '"><td class="ds-nowrap">LAPTOP-' + String(1000 + i * 7) + '</td><td class="ds-num">' + ((i * 37) % 100) + '%</td></tr>';
  }
  return rows;
}

function pageRange(page) {
  return ((page * PAGE_SIZE) + 1) + '–' + ((page + 1) * PAGE_SIZE) + ' of 12';
}

function pageButton(to, name, glyph) {
  return '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="' + name + '" data-page-to="' + to + '">' + DS.icons.icon(DS.icons[glyph], 20) + '</button>';
}

/* What a project's page change does: dim, load, render through flip(). */
function goToPage(stage, page, sg) {
  var card = stage.querySelector('.ds-card');
  var tbody = stage.querySelector('tbody');
  var last = 3;
  card.classList.add('ds-stale');
  stage.querySelector('.ds-pagination__range').textContent = pageRange(page);
  stage.setAttribute('data-page', String(page));
  stage.querySelectorAll('[data-page-to]').forEach(function (button) {
    var blocked = button.getAttribute('data-page-to') === 'previous' ? page === 0 : page === last;
    if (blocked) button.setAttribute('aria-disabled', 'true');
    else button.removeAttribute('aria-disabled');
  });
  return new Promise(function (resolve) { setTimeout(resolve, sg.slow(300)); }).then(function () {
    card.classList.remove('ds-stale');
    return DS.motion.flip(tbody, function (options) { DS.dom.morphHtml(tbody, pageRows(page), options); }, { items: 'tr' });
  }).then(function () { return DS.motion.settled(tbody); });
}

SG_LAB.add({
  id: 'pagination-page',
  group: 'feedback',
  title: 'Pagination: a page change',
  note: 'Press next: the rows dim (<code>.ds-stale</code>) while the page loads and the range changes at once; then every key is new, so <code>DS.motion.flip</code> lets the old rows go at once and the new ones fade in.',
  shows: ['DS.motion.flip', 'DS.dom.morphHtml', '.ds-stale'],
  html: '<section class="ds-card"><div class="ds-table-wrap"><table class="ds-table"><caption class="ds-sr">Devices, in pages</caption><thead><tr><th scope="col">Device</th><th scope="col" class="ds-num">Load</th></tr></thead><tbody>' + pageRows(0) + '</tbody></table></div>' +
    '<nav class="ds-pagination" aria-label="Pages of devices"><p class="ds-pagination__range" aria-live="polite">' + pageRange(0) + '</p><span data-page-buttons></span></nav></section>',
  height: 320,
  setup: function (stage, sg) {
    var buttons = stage.querySelector('[data-page-buttons]');
    DS.dom.morphHtml(buttons, pageButton('previous', 'Previous page', 'chevronLeft') + pageButton('next', 'Next page', 'chevronRight'));
    buttons.style.display = 'contents';
    stage.addEventListener('click', function (event) {
      var button = event.target.closest('[data-page-to]');
      if (!button || button.getAttribute('aria-disabled') === 'true') return;
      var page = Number(stage.getAttribute('data-page') || 0);
      goToPage(stage, page + (button.getAttribute('data-page-to') === 'next' ? 1 : -1), sg);
    });
    stage.querySelector('[data-page-to="previous"]').setAttribute('aria-disabled', 'true');
  },
  play: function (stage, sg) {
    var page = Number(stage.getAttribute('data-page') || 0);
    return goToPage(stage, page === 3 ? 0 : page + 1, sg);
  },
});
