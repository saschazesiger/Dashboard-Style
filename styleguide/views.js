/*
 * The views page of the styleguide (views.html): the motion between views
 * (DS.motion.transition()) and the motion that follows scrolling, in one
 * small app. A classic script on top of dist/ds.js, so it runs from disk;
 * the "Page loads (MPA)" mode needs http (cross-document View Transitions
 * are same-origin only).
 *
 *   drawer destinations      fade-through (Overview, Devices, Report)
 *   Previous / Next          shared axis X (forward, back)
 *   a card's title           container transform into its detail, and back
 *   a card's "Quick look"    DS.overlay.open(sheet, { container: true })
 *   Wall display             a destination without the drawer: the panel morphs
 *   the sheet's arrows       a record swap (forward, back); "Refresh" is a
 *                            plain DS.dom.morphHtml, never a transition
 *   Report                   a long page with .ds-reveal--scroll
 *   Devices                  a wide table whose edge fades follow its scroll
 *   ?mpa=1                   links load pages; the opt-in stylesheet
 *                            css/optional/view-transitions.css carries the
 *                            view and the drawer's pill across the load
 *
 * Without View Transitions (or in an engine without them) every
 * navigation fades the new view through with .ds-enter--swap.
 * ?speed=0.1 plays everything ten times slower, as on the styleguide.
 */
(function () {
  'use strict';

  var DS = window.DS;
  var I = DS.icons;
  var M = DS.motion;
  var icon = function (name, size, cls) { return I.icon(I[name], size, cls); };
  var $ = function (selector, root) { return (root || document).querySelector(selector); };
  var $$ = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };
  var esc = function (text) { return String(text).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  var params = new URLSearchParams(location.search);

  /* Markup into the page through an inert <template>: parsed straight into
     the document (innerHTML with an icon's <svg>), it would make Chromium
     end the render block of <link rel="expect"> (views.html) before this
     script has created the named indicator, with a console warning. */
  function setHtml(element, html) {
    var template = document.createElement('template');
    template.innerHTML = html;
    element.replaceChildren(template.content);
  }

  // Slow motion, as on the styleguide: --ds-time-scale on <html>.
  var speed = Number(params.get('speed'));
  if (speed > 0 && speed < 1) {
    document.documentElement.setAttribute('data-sg-speed', String(speed));
    document.documentElement.style.setProperty('--ds-time-scale', String(1 / speed));
  }

  /* Page loads instead of in-page navigation: only over http, where the
     head of views.html loaded the opt-in stylesheet. */
  var HTTP = /^https?:$/.test(location.protocol);
  var MPA = HTTP && params.get('mpa') === '1';

  var PAGES = [
    { id: 'overview', title: 'Overview', glyph: 'overview', lead: 'Four devices as cards. A card\'s title opens its detail: the card grows into it (container transform). "Quick look" grows it into the side sheet instead.' },
    { id: 'devices', title: 'Devices', glyph: 'laptop', lead: 'A wide table: scroll it sideways and its edge fades follow (a fade on each side that still has columns). A row opens the side sheet, whose arrows swap the record.' },
    { id: 'report', title: 'Report', glyph: 'barChart', lead: 'A long read-only page: each block fades in and rises while it scrolls into view, tied to the scroll position (.ds-reveal--scroll). Scroll back and it reverses.' },
    { id: 'wall', title: 'Wall display', glyph: 'monitor', lead: 'A destination without the drawer: the panel morphs to the full width while the drawer leaves, and back.', noDrawer: true },
  ];

  var DEVICES = [
    ['LAPTOP-0042', 'Notebook 14', 'Ada Lovelace', 'Building A, 1st floor', 'ok', 'Release 24.2', '8 cores', '32 GB', '1 TB', 'PF-3K2L9', '10.0.4.42'],
    ['LAPTOP-0043', 'Notebook 13', 'Grace Hopper', 'Building A, 2nd floor', 'warning', 'Release 24.1', '8 cores', '16 GB', '512 GB', 'NB-ZX81Q', '10.0.4.43'],
    ['DESKTOP-0107', 'Desktop Mini', 'Alan Turing', 'Building B, lab', 'ok', 'Release 24.2', '12 cores', '64 GB', '2 TB', 'DL-77QA1', '10.0.5.107'],
    ['PRINTER-0002', 'Laser printer', 'Front desk', 'Building A, ground floor', 'error', 'Firmware 5.6', '1 core', '512 MB', '8 GB', 'PR-2Q114', '10.0.6.2'],
    ['TABLET-0019', 'Tablet 11', 'Katherine Johnson', 'Building C, 3rd floor', 'ok', 'Release 18.3', '8 cores', '8 GB', '256 GB', 'TB-QW77A', '10.0.7.19'],
    ['LAPTOP-0051', 'Notebook 15', 'Edsger Dijkstra', 'Building B, 2nd floor', 'running', 'Release 24.2', '14 cores', '32 GB', '1 TB', 'DL-8H2M0', '10.0.4.51'],
  ].map(function (row) {
    return { name: row[0], model: row[1], owner: row[2], location: row[3], status: row[4], os: row[5], cpu: row[6], memory: row[7], disk: row[8], serial: row[9], ip: row[10] };
  });

  var STATUS = { ok: ['check', 'OK'], warning: ['alert', 'Update due'], error: ['alertCircle', 'Offline'], running: ['sync', 'Syncing'] };

  var app = $('#vw-app');
  var view = $('#main');
  var page = $('#vw-page');
  var drawer = $('#vw-drawer');
  var nav = $('#vw-nav');
  var sheet = $('#vw-sheet');
  var sheetBody = $('#vw-sheet-body');
  var modal = window.matchMedia('(max-width: 900px)');

  var current = Math.max(0, PAGES.map(function (p) { return p.id; }).indexOf(params.get('page')));
  var detail = -1;            // the device shown as a detail of the overview, or -1
  var record = 0;             // the device in the sheet
  var refreshes = 0;          // "Refresh" in the sheet: a later "last seen"

  /* ── Markup ───────────────────────────────────────────────────────── */

  /* A destination's address: the same page in SPA mode (only for reloads and
     new tabs), a page load in MPA mode. `dir` tells the next page which way
     a step went (pagereveal, below). */
  function hrefFor(index, dir) {
    var query = new URLSearchParams();
    query.set('page', PAGES[index].id);
    if (MPA) query.set('mpa', '1');
    if (MPA && dir) query.set('dir', dir);
    if (speed > 0 && speed < 1) query.set('speed', String(speed));
    return 'views.html?' + query.toString();
  }

  function status(kind) {
    var s = STATUS[kind];
    return '<span class="ds-status ds-status--' + kind + '">' + icon(s[0], 16) + '<span>' + s[1] + '</span></span>';
  }

  function head(index) {
    var p = PAGES[index];
    var prev = (index + PAGES.length - 1) % PAGES.length;
    var next = (index + 1) % PAGES.length;
    return '<header class="ds-page-head"><h1 class="ds-page-head__title" tabindex="-1">' + p.title + '</h1>' +
      '<p class="ds-page-head__lead">' + p.lead + '</p></header>' +
      '<div class="sg-row"><a class="ds-btn ds-btn--sm" data-vw-step="-1" href="' + hrefFor(prev, 'back') + '">' + icon('arrowLeft', 16) + ' ' + PAGES[prev].title + '</a>' +
      '<a class="ds-btn ds-btn--sm" data-vw-step="1" href="' + hrefFor(next, 'forward') + '">' + PAGES[next].title + ' ' + icon('arrowRight', 16) + '</a></div>';
  }

  function facts(d, refreshed) {
    return '<dl class="ds-facts"><div><dt>Owner</dt><dd>' + esc(d.owner) + '</dd></div><div><dt>Location</dt><dd>' + esc(d.location) + '</dd></div>' +
      '<div><dt>Model</dt><dd>' + esc(d.model) + '</dd></div><div><dt>Last seen</dt><dd>Today, 09:' + String(12 + (refreshed || 0)).padStart(2, '0') + '</dd></div></dl>';
  }

  function overview() {
    return head(0) + '<div class="ds-grid-2">' + DEVICES.slice(0, 4).map(function (d, i) {
      return '<div class="ds-card ds-card--interactive" data-ds-key="card-' + i + '">' +
        '<div class="ds-card__row"><h2 class="ds-card__title"><a class="ds-card__action" href="#' + d.name + '" data-vw-detail="' + i + '">' + esc(d.name) + '</a></h2>' +
        '<button class="ds-btn ds-btn--sm" type="button" data-vw-quick="' + i + '">Quick look</button></div>' +
        '<p class="ds-muted">' + esc(d.model) + ', ' + esc(d.owner) + '</p>' + status(d.status) + '</div>';
    }).join('') + '</div>';
  }

  function deviceDetail(i) {
    var d = DEVICES[i];
    return '<header class="ds-page-head"><h1 class="ds-page-head__title" tabindex="-1">' + esc(d.name) + '</h1>' +
      '<p class="ds-page-head__lead">The detail of one card: it grew out of the card and goes back into it.</p></header>' +
      '<section class="ds-card" id="vw-detail"><div class="ds-card__row"><h2 class="ds-card__title">' + esc(d.model) + '</h2>' + status(d.status) + '</div>' +
      facts(d) + '<p class="ds-muted">Serial ' + esc(d.serial) + ', ' + esc(d.os) + ', ' + esc(d.cpu) + ', ' + esc(d.memory) + ' memory, ' + esc(d.disk) + ' disk.</p>' +
      '<div class="sg-row"><button class="ds-btn" type="button" data-vw-back>' + icon('arrowLeft', 16) + ' Back to the overview</button></div></section>';
  }

  function devices() {
    var columns = ['Model', 'Owner', 'Location', 'Status', 'System', 'Processor', 'Memory', 'Disk', 'Serial', 'Address'];
    return head(1) + '<section class="ds-card"><h2 class="ds-card__title">All devices</h2><div class="ds-table-wrap">' +
      '<table class="ds-table ds-table--wide ds-table--interactive"><caption class="ds-sr">Devices</caption><thead><tr><th scope="col">Device</th>' +
      columns.map(function (c) { return '<th scope="col"' + (c === 'Owner' ? ' class="ds-col--secondary"' : '') + '>' + c + '</th>'; }).join('') +
      '</tr></thead><tbody>' + DEVICES.map(function (d, i) {
        return '<tr data-ds-key="' + d.name + '"><td class="ds-nowrap"><button class="ds-link-btn ds-table__row-link" type="button" data-vw-open="' + i + '">' + esc(d.name) + '</button></td>' +
          [d.model, d.owner, d.location].map(function (v, n) { return '<td class="ds-nowrap' + (n === 1 ? ' ds-col--secondary' : '') + '">' + esc(v) + '</td>'; }).join('') +
          '<td>' + status(d.status) + '</td>' +
          [d.os, d.cpu, d.memory, d.disk, d.serial, d.ip].map(function (v) { return '<td class="ds-nowrap">' + esc(v) + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table></div></section>' +
      '<section class="ds-card"><h2 class="ds-card__title">What moves</h2><p class="ds-muted">The table fades at the card\'s edge while columns follow. Where scroll timelines exist the fades follow the scroll: a left fade grows once the table has left its start, the right one goes as it reaches its end. Elsewhere the right fade stays. In the sheet, the arrows swap the record on the shared axis; "Refresh" updates the same record in place without any motion.</p></section>';
  }

  var REPORT = [
    ['Summary', 'The fleet grew by twelve devices this quarter. Every laptop received the spring update within two weeks of its release, and the average age of the desktops fell below three years for the first time.', 'Figures as of the last day of the quarter.'],
    ['Coverage', 'Ninety-eight percent of the devices checked in at least once a day. The rest were away on longer trips or stored for new staff, and all of them were back online before the end of the quarter.', 'A device counts when it reports at least once between 00:00 and 23:59.'],
    ['Updates', 'Updates now arrive in two waves: a small group of volunteers takes them first, the rest follows a week later. The first wave caught one driver problem before it reached anyone else.', 'Twenty-four volunteers in five teams.'],
    ['Repairs', 'Fourteen repairs, most of them batteries and keyboards. The median repair took three working days, including shipping, and every owner had a loan device while theirs was away.', 'Two repairs were covered by the warranty.'],
    ['Printers', 'The printer on the ground floor was offline for two days after a firmware update; the vendor has published a fix. Print volume fell by a fifth compared with the same quarter last year.', 'The fix is installed on every printer.'],
    ['Security', 'Disk encryption covers every laptop and desktop. Two devices were reported lost; both were locked and wiped remotely within the hour, and neither held data that was not also stored centrally.', 'Both owners received a replacement the next day.'],
    ['Next quarter', 'Replace the oldest desktops in the lab, move the remaining tablets to the new management profile and retire the last two printers that cannot be updated any more.', 'Scroll back up: each block goes back the way it came.'],
  ];

  function report() {
    return head(2) + '<div class="ds-tiles ds-reveal--scroll">' + [['laptop', 'Devices', '1284', '+12 this quarter'], ['check', 'Checked in daily', '98%', 'of all devices'], ['wrench', 'Repairs', '14', 'median 3 days'], ['shield', 'Encrypted', '100%', 'laptops and desktops']].map(function (t) {
      return '<div class="ds-tile"><p class="ds-tile__label">' + icon(t[0], 20) + '<span>' + t[1] + '</span></p><p class="ds-tile__value">' + t[2] + '</p><p class="ds-tile__note">' + t[3] + '</p></div>';
    }).join('') + '</div><div class="ds-stack">' + REPORT.map(function (s) {
      return '<section class="ds-card ds-reveal--scroll"><h2 class="ds-card__title">' + s[0] + '</h2><p>' + s[1] + '</p><p class="ds-muted">' + s[2] + '</p></section>';
    }).join('') + '</div>';
  }

  function wall() {
    return head(3) + '<div class="ds-tiles">' + DEVICES.slice(0, 4).map(function (d) {
      return '<div class="ds-tile"><p class="ds-tile__label">' + icon('monitor', 20) + '<span>' + esc(d.name) + '</span></p><p class="ds-tile__value">' + STATUS[d.status][1] + '</p><p class="ds-tile__note">' + esc(d.location) + '</p></div>';
    }).join('') + '</div><section class="ds-card"><h2 class="ds-card__title">Without the drawer</h2><p class="ds-muted">This destination sets data-drawer-hidden inside the transition: the panel morphs to the full width on the spring while the drawer leaves to the left; the content keeps its size. Going back, the drawer slides in again while the panel makes room. Without View Transitions the grid jumps and the drawer slides in.</p></section>';
  }

  var RENDER = [overview, devices, report, wall];

  function recordHtml(i) {
    var d = DEVICES[i];
    return facts(d, refreshes) + '<p class="ds-muted">' + esc(d.os) + ', ' + esc(d.cpu) + ', ' + esc(d.memory) + ' memory, ' + esc(d.disk) + ' disk. Serial ' + esc(d.serial) + ', address ' + esc(d.ip) + '.</p>' +
      '<p>' + status(d.status) + '</p><div class="sg-row"><button class="ds-btn" type="button" data-vw-refresh>' + icon('sync', 16) + ' Refresh</button></div>' +
      '<p class="ds-muted">Device ' + (i + 1) + ' of ' + DEVICES.length + '. The arrows swap the record (shared axis); Refresh updates this one in place, without a transition.</p>';
  }

  /* ── Rendering ────────────────────────────────────────────────────── */

  function setActive() {
    $$('.ds-drawer__item', nav).forEach(function (item, index) {
      if (index === current) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });
  }

  /* The current view, in place: the drawer shown or hidden with it. Called
     inside the update of DS.motion.transition() (or once on load). */
  function renderView() {
    var comesBack = !PAGES[current].noDrawer && app.hasAttribute('data-drawer-hidden');
    app.toggleAttribute('data-drawer-hidden', !!PAGES[current].noDrawer);
    if (comesBack) M.enter(drawer);
    setHtml(page, detail >= 0 ? deviceDetail(detail) : RENDER[current]());
    setActive();
    view.scrollTop = 0;
  }

  function focusTitle() {
    var title = $('h1', page);
    if (title) title.focus({ preventScroll: true });
  }

  function remember() {
    if (!MPA) history.replaceState(null, '', hrefFor(current));
  }

  /* A destination: fade-through from the drawer, shared axis for a step.
     The modal drawer closes inside the update: it is still open when
     transition() looks, so the page frame stays in the root snapshot and
     the new view crossfades under the drawer and its scrim. */
  function go(index, type) {
    return M.transition(function () {
      if (modal.matches && app.hasAttribute('data-drawer-open')) DS.overlay.close(drawer);
      current = index;
      detail = -1;
      renderView();
      focusTitle();
      return page;
    }, { type: type }).then(remember);
  }

  /* A card into its detail (container transform), and the detail back into
     its card. */
  function openDetail(i, card) {
    return M.transition(function () {
      detail = i;
      renderView();
      focusTitle();
      return $('#vw-detail');
    }, { type: 'container', from: card });
  }

  function closeDetail() {
    var i = detail;
    return M.transition(function () {
      detail = -1;
      renderView();
      var card = $('[data-ds-key="card-' + i + '"]', page);
      var action = card && $('.ds-card__action', card);
      if (action) action.focus({ preventScroll: true });
      return card;
    }, { type: 'container', from: $('#vw-detail') });
  }

  /* ── The side sheet ───────────────────────────────────────────────── */

  function fillSheet(i) {
    record = i;
    $('#vw-sheet-title').textContent = DEVICES[i].name;
    DS.dom.morphHtml(sheetBody, recordHtml(i));
    sheetBody.scrollTop = 0;
  }

  function openSheet(i, opener, container) {
    fillSheet(i);
    DS.overlay.open(sheet, { opener: opener, container: !!container });
  }

  /* Previous and next: a record swap on the shared axis; the head and the
     page under the scrim stay still. */
  function stepRecord(delta) {
    var next = (record + delta + DEVICES.length) % DEVICES.length;
    return M.transition(function () {
      fillSheet(next);
      return sheetBody;
    }, { type: delta > 0 ? 'forward' : 'back' });
  }

  /* ── Wiring ───────────────────────────────────────────────────────── */

  /* Direction across page loads (the snippet of the opt-in stylesheet):
     back and forward through the history move on the axis, and so does a
     Previous or Next link (its address carries dir); the drawer's links
     fade through. Registered before the first render. */
  if (MPA) {
    window.addEventListener('pagereveal', function (event) {
      if (!event.viewTransition) return;
      var activation = window.navigation && window.navigation.activation;
      var dir = null;
      if (activation && activation.navigationType === 'traverse' && activation.from) dir = activation.entry.index < activation.from.index ? 'back' : 'forward';
      else if (activation && activation.navigationType === 'push' && /^(forward|back)$/.test(params.get('dir') || '')) dir = params.get('dir');
      if (!dir) return;
      var root = document.documentElement;
      root.setAttribute('data-ds-vt', dir);
      event.viewTransition.finished.finally(function () { root.removeAttribute('data-ds-vt'); });
    });
  }

  setHtml(nav, '<div class="ds-drawer__group"><p class="ds-drawer__heading">Destinations</p>' + PAGES.map(function (p, index) {
    return '<a class="ds-drawer__item" href="' + hrefFor(index) + '" data-vw-go="' + index + '">' + icon(p.glyph, 20) + '<span class="ds-drawer__label">' + p.title + '</span></a>';
  }).join('') + '</div>');
  setHtml($('#vw-menu'), icon('menu', 20));
  setHtml($('#vw-sheet-prev'), icon('chevronLeft', 20));
  setHtml($('#vw-sheet-next'), icon('chevronRight', 20));
  setHtml($('#vw-sheet-close'), icon('close', 20));

  renderView();
  // Before the first render, from this classic script: the pill glides
  // across page loads too (the name is unique on the page).
  DS.indicator.createIndicator(nav, { active: '[aria-current="page"]', className: 'ds-drawer__indicator', name: 'nav' });
  DS.ripple.attach(document);
  // data-scrolled: the fallback of the scroll-driven hairlines and the top bar's tint.
  DS.dom.watchScrolled(view);
  DS.dom.watchScrolled(sheetBody);

  var mpaSwitch = $('#vw-mpa');
  mpaSwitch.checked = MPA;
  mpaSwitch.disabled = !HTTP;
  if (!HTTP) $('#vw-mpa-switch').title = 'Page loads need http: serve the repository, e.g. npx serve';
  mpaSwitch.addEventListener('change', function () {
    var query = new URLSearchParams();
    query.set('page', PAGES[current].id);
    if (mpaSwitch.checked) query.set('mpa', '1');
    if (speed > 0 && speed < 1) query.set('speed', String(speed));
    location.href = 'views.html?' + query.toString();
  });

  $('#vw-menu').addEventListener('click', function () {
    if (app.hasAttribute('data-drawer-open')) DS.overlay.close(drawer);
    else DS.overlay.open(drawer, { opener: $('#vw-menu') });
  });

  nav.addEventListener('click', function (event) {
    var item = event.target.closest('[data-vw-go]');
    if (!item || MPA) return;   // MPA: the link loads the page
    event.preventDefault();
    var index = Number(item.getAttribute('data-vw-go'));
    if (index === current && detail < 0) return;
    go(index, 'fade-through');
  });

  page.addEventListener('click', function (event) {
    var target = event.target;
    var step = target.closest('[data-vw-step]');
    if (step) {
      if (MPA) return;
      event.preventDefault();
      var delta = Number(step.getAttribute('data-vw-step'));
      go((current + delta + PAGES.length) % PAGES.length, delta > 0 ? 'forward' : 'back');
      return;
    }
    var detailLink = target.closest('[data-vw-detail]');
    if (detailLink) {
      event.preventDefault();
      openDetail(Number(detailLink.getAttribute('data-vw-detail')), detailLink.closest('.ds-card'));
      return;
    }
    if (target.closest('[data-vw-back]')) { closeDetail(); return; }
    var quick = target.closest('[data-vw-quick]');
    if (quick) { openSheet(Number(quick.getAttribute('data-vw-quick')), quick.closest('.ds-card'), true); return; }
    var row = target.closest('[data-vw-open]');
    if (row) openSheet(Number(row.getAttribute('data-vw-open')), row);
  });

  $('#vw-sheet-prev').addEventListener('click', function () { stepRecord(-1); });
  $('#vw-sheet-next').addEventListener('click', function () { stepRecord(1); });
  // The same record refreshed: data, so never a transition.
  sheetBody.addEventListener('click', function (event) {
    if (!event.target.closest('[data-vw-refresh]')) return;
    refreshes = (refreshes + 1) % 40;
    DS.dom.morphHtml(sheetBody, recordHtml(record));
  });

  // Crossing 900px changes the drawer in place (docs/components.md).
  modal.addEventListener('change', function () {
    drawer.classList.add('ds-drawer--instant');
    if (!modal.matches && app.hasAttribute('data-drawer-open')) DS.overlay.close(drawer);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { drawer.classList.remove('ds-drawer--instant'); });
    });
  });

  document.documentElement.setAttribute('data-sg-ready', '');
}());
