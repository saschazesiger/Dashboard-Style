/*
 * The reference app: a small device console built on Dashboard-Style the
 * way a project uses it. Every pattern here follows docs/components.md and
 * docs/motion.md; README.md in this folder maps each one to its place.
 *
 *   start-up            a skeleton while the first data loads, then the
 *                       view with DS.motion.staggerOnce()
 *   navigation          hash routes, DS.motion.transition() (fade-through),
 *                       the drawer's pill (DS.indicator), the modal drawer
 *                       (DS.overlay), data-scrolled (DS.dom.watchScrolled),
 *                       a drawer group that closes, the page head's way
 *                       back, a banner while the backend is offline
 *   Overview            tiles that count (countUp), alerts that come and go
 *                       (flip), a sync with busy faces and a progress bar,
 *                       columns that fill once (.ds-columns), a live feed
 *                       (.ds-timeline), open tickets in a row list (.ds-list)
 *   Devices             a full-page table (.ds-table-wrap--fill) with a
 *                       pinned first column (DS.dom.scrollEdges), row
 *                       actions on demand and pagination, search, filter
 *                       chips, sort, bulk selection with the selection bar,
 *                       a row menu, a confirm dialog, undo in a snackbar, an
 *                       empty state, a refresh with DS.motion.refresh(),
 *                       live status through flip({ live: true }), a side
 *                       sheet with Details and History tabs, previous and
 *                       next
 *   Tickets             expandable rows, a dialog with a form, validation
 *                       and a combobox
 *   Settings            switches that apply at once (one cuts the fake
 *                       connection), radio cards that change the theme, a
 *                       form that saves with DS.motion.busy()
 *
 * A classic script on top of dist/ds.js and data.js (window.ExampleApi),
 * so it runs from disk. Re-renders go through DS.dom.morphHtml, never
 * innerHTML; listeners are delegated once to stable containers.
 * ?live=0 stops the polling (test/browser/example.spec.js).
 */
(function () {
  'use strict';

  const DS = window.DS;
  const M = DS.motion;
  const api = window.ExampleApi;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const icon = (name, size = 20, className) => DS.icons.icon(DS.icons[name], size, className);

  const app = $('#app');
  const view = $('#main');
  const page = $('#page');
  const drawer = $('#drawer');
  const nav = $('#nav');
  const menuButton = $('#menu');
  const toasts = $('#toasts');
  const sheet = $('#sheet');
  const sheetBody = $('#sheet-body');
  const ticketDialog = $('#ticket-dialog');
  const ticketForm = $('#ticket-form');
  const rowMenu = $('#row-menu');

  /* ── State ────────────────────────────────────────────────────────── */

  const STATUS = {
    error: { glyph: 'alertCircle', label: 'Offline', rank: 0 },
    warning: { glyph: 'alert', label: 'Update due', rank: 1 },
    running: { glyph: null, label: 'Syncing', rank: 2 },
    ok: { glyph: 'check', label: 'OK', rank: 3 },
  };
  const TYPES = { laptop: 'Laptops', desktop: 'Desktops', tablet: 'Tablets', printer: 'Printers' };
  const TICKET_STATUS = { open: ['clock', 'Open', ''], waiting: ['history', 'Waiting', ''], closed: ['check', 'Closed', 'ok'] };
  const PRIORITY = { low: 'Low', normal: 'Normal', high: 'High' };

  const stored = (key) => { try { return localStorage.getItem(key); } catch (error) { return null; } };
  const store = (key, value) => { try { localStorage.setItem(key, value); } catch (error) { /* storage blocked */ } };

  const state = {
    devices: [],
    tickets: [],
    activity: [],
    checkins: [],
    settings: {},
    route: 'overview',
    sort: { key: 'name', dir: 'ascending' },
    page: 0,
    pageSize: 25,
    query: '',
    type: 'all',
    statuses: new Set(),
    selected: new Set(),
    ticketFilter: 'open',
    expanded: new Set(),
    dismissed: new Set(),
    sync: { running: false, done: 0, total: 0, finished: null, summary: null },
    sheetId: null,
    sheetTab: 'details',
    back: null,
    offline: false,
    menuFor: null,
    dense: stored('ex-dense') === '1',
    savedAt: null,
  };

  const byId = (id) => state.devices.find((device) => device.id === id);

  /* ── Formatting ───────────────────────────────────────────────────── */

  function ago(time) {
    const minutes = Math.round((Date.now() - time) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} h ago`;
    const days = Math.round(hours / 24);
    return days === 1 ? 'Yesterday' : `${days} days ago`;
  }

  const clock = (time) => new Date(time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const plural = (count, one, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

  /* Status chips: always icon and word; a running chip shows the spinner. */
  function status(kind) {
    const s = STATUS[kind];
    const mark = s.glyph ? icon(s.glyph, 16) : '<span class="ds-spinner ds-status__spinner" aria-hidden="true"></span>';
    return `<span class="ds-status ds-status--${kind}">${mark}<span>${s.label}</span></span>`;
  }

  function ticketStatus(kind) {
    const [glyph, label, tone] = TICKET_STATUS[kind];
    return `<span class="ds-status${tone ? ` ds-status--${tone}` : ''}">${icon(glyph, 16)}<span>${label}</span></span>`;
  }

  /* A button with the busy and done faces of DS.motion.busy(). */
  function facesButton(className, label, busyLabel, doneLabel, attributes = '') {
    return `<button class="${className}" type="button" ${attributes}><span class="ds-btn__faces">` +
      `<span class="ds-btn__face">${label}</span>` +
      `<span class="ds-btn__face ds-btn__face--busy" aria-hidden="true"><span class="ds-spinner ds-spinner--sm"></span>${busyLabel}</span>` +
      `<span class="ds-btn__face ds-btn__face--done" aria-hidden="true">${icon('check', 16)}${doneLabel}</span></span></button>`;
  }

  /* The page head: the way back (a view opened from a link of the overview),
     the title and lead, the actions at the end of the title's line. */
  function head(title, lead, actions = '', back = null) {
    return '<header class="ds-page-head">' +
      (back ? `<a class="ds-btn ds-btn--text ds-btn--sm ds-page-head__back" href="${back.href}">${icon('arrowLeft', 18)}<span class="ds-sr">Back to </span>${back.label}</a>` : '') +
      `<div class="ds-page-head__row"><div class="ds-page-head__text"><h1 class="ds-page-head__title" tabindex="-1">${title}</h1>` +
      `<p class="ds-page-head__lead">${lead}</p></div>${actions ? `<div class="ds-page-head__actions">${actions}</div>` : ''}</div></header>`;
  }

  function counts() {
    const result = { total: state.devices.length, ok: 0, warning: 0, error: 0, running: 0 };
    for (const device of state.devices) result[device.status] += 1;
    return result;
  }

  /* ── Overview ─────────────────────────────────────────────────────── */

  const TILES = [
    { key: 'total', glyph: 'laptop', label: 'Devices', href: '#/devices', value: (c) => c.total,
      note: () => Object.keys(TYPES).map((type) => `${state.devices.filter((d) => d.type === type).length} ${TYPES[type].toLowerCase()}`).slice(0, 2).join(', ') },
    { key: 'online', glyph: 'wifi', label: 'Online', href: '#/devices?status=ok,running', value: (c) => c.ok + c.running,
      note: (c) => `${c.total ? Math.round(((c.ok + c.running) / c.total) * 100) : 0}% of the fleet` },
    { key: 'warning', glyph: 'alert', label: 'Update due', href: '#/devices?status=warning', value: (c) => c.warning,
      note: () => 'Release 24.2 is out' },
    { key: 'error', glyph: 'wifiOff', label: 'Offline', href: '#/devices?status=error', value: (c) => c.error,
      note: (c) => (c.error ? 'Not seen in the last poll' : 'Every device answers') },
  ];

  function tilesHtml() {
    const c = counts();
    return `<div class="ds-tiles">${TILES.map((tile) =>
      `<a class="ds-tile" href="${tile.href}" data-ds-key="tile-${tile.key}"><span class="ds-tile__label">${icon(tile.glyph, 20)}<span>${tile.label}</span></span>` +
      `<span class="ds-tile__value" data-tile="${tile.key}">${tile.value(c)}</span><span class="ds-tile__note" data-tile-note="${tile.key}">${esc(tile.note(c))}</span></a>`).join('')}</div>`;
  }

  /* Alerts follow the data: they come and go through flip() on their stack. */
  function alertsHtml() {
    const c = counts();
    const list = [];
    if (c.error) {
      list.push(`<div class="ds-alert ds-alert--error" data-ds-key="alert-offline">${icon('alertCircle', 20)}<span class="ds-alert__text">${plural(c.error, 'device is', 'devices are')} offline.</span>` +
        '<a class="ds-btn ds-btn--text ds-btn--sm" href="#/devices?status=error">Show</a></div>');
    }
    if (!state.dismissed.has('sync')) {
      list.push(`<div class="ds-alert" data-ds-key="alert-sync">${icon('info', 20)}<span class="ds-alert__text">The nightly sync runs at 02:00. Run it now from the Sync card.</span>` +
        '<button class="ds-btn ds-btn--text ds-btn--sm" type="button" data-dismiss="sync">Dismiss</button></div>');
    }
    return list.join('');
  }

  function progressHtml() {
    const { running, done, total, finished } = state.sync;
    const share = total ? done / total : 0;
    const percent = Math.round(share * 100);
    const started = running || finished;
    const modifier = !started ? ' ds-progress--waiting' : running && !done ? ' ds-progress--indeterminate' : '';
    const value = started && (done || !running) ? `aria-valuenow="${percent}"` : `aria-valuetext="${running ? 'Preparing' : 'Waiting'}"`;
    const label = !started ? 'Idle' : running && !done ? 'Preparing' : `${percent}%`;
    const detail = !started ? 'Next run tonight at 02:00' : running ? `${done} of ${total} devices` : `Finished at ${clock(finished)}`;
    return `<div class="ds-progress${modifier}" id="sync-progress" style="--ds-progress: ${share}">` +
      `<div class="ds-progress__track" role="progressbar" aria-label="Sync" aria-valuemin="0" aria-valuemax="100" ${value}><div class="ds-progress__bar"></div></div>` +
      `<p class="ds-progress__label">${label}</p><p class="ds-progress__detail">${detail}</p></div>`;
  }

  /* Columns of the system: each sets its share (--ds-share), the fill is clipped at it. */
  function chartHtml() {
    const max = Math.max(state.devices.length, ...state.checkins.map(([, n]) => n), 1);
    return '<figure class="ds-columns"><figcaption class="ds-sr">Devices that checked in, per day</figcaption><ol class="ds-columns__plot">' + state.checkins.map(([day, n]) =>
      `<li class="ds-columns__col" style="--ds-share: ${(n / max).toFixed(3)}"><span class="ds-columns__value">${n}</span><span class="ds-columns__fill" aria-hidden="true"></span>` +
      `<span class="ds-columns__label">${day}</span></li>`).join('') + '</ol></figure>';
  }

  /* The feed as a timeline with icon markers, newest first. */
  function activityHtml() {
    return state.activity.slice(-6).reverse().map((entry) =>
      `<li class="ds-timeline__item ds-timeline__item--icon" data-ds-key="${entry.id}"><span class="ds-timeline__marker" aria-hidden="true">${icon(entry.glyph, 16)}</span>` +
      `<div class="ds-timeline__head"><p class="ds-timeline__title">${esc(entry.text)}</p></div>` +
      `<p class="ds-timeline__meta"><time datetime="${new Date(entry.at).toISOString()}">${ago(entry.at)}</time></p></li>`).join('');
  }

  /* Open tickets as a row list: each row opens its ticket. */
  function openTicketsHtml(open) {
    return '<ul class="ds-list ds-list--interactive" aria-label="Open tickets">' + open.slice(0, 4).map((ticket) =>
      `<li class="ds-list__item" data-ds-key="t${ticket.id}">${icon('ticket', 20, 'ds-list__icon')}` +
      `<span class="ds-list__text"><span class="ds-list__title"><a class="ds-list__action" href="#/tickets?open=${ticket.id}">${esc(ticket.subject)}</a></span>` +
      `<span class="ds-list__meta">#${ticket.id} · ${esc(byId(ticket.device)?.name ?? '')} · opened ${ago(ticket.opened)}</span></span>` +
      (ticket.priority === 'high' ? `<span class="ds-status ds-status--warning">${icon('flag', 16)}<span>High</span></span>` : '') +
      `${icon('chevronRight', 20, 'ds-list__chevron')}</li>`).join('') + '</ul>';
  }

  function overviewHtml() {
    const open = state.tickets.filter((ticket) => ticket.status !== 'closed');
    const summary = state.sync.summary;
    const alerts = alertsHtml();
    return head('Overview', 'The fleet at a glance. Figures, alerts and the feed update live every few seconds.') +
      `<div class="ds-stack" id="alerts"${alerts ? '' : ' hidden'}>${alerts}</div>` +
      tilesHtml() +
      '<div class="ds-grid-2">' +
        '<section class="ds-card"><div class="ds-card__row"><h2 class="ds-card__title">Sync</h2>' +
          facesButton('ds-btn ds-btn--sm', 'Run now', 'Running', 'Done', `id="sync-run"${state.sync.running ? ' aria-busy="true"' : ''}`) + '</div>' +
          '<p class="ds-muted">Every device reports its state, its system and its disks.</p>' + progressHtml() +
          (summary ? `<p><span class="ds-parts"><span class="ds-parts__list">${summary.map((part) => `<span>${part}</span>`).join('')}</span></span></p>` : '') +
        '</section>' +
        `<section class="ds-card"><h2 class="ds-card__title">Check-ins this week</h2>${chartHtml()}<p class="ds-meta">Devices that reported at least once that day.</p></section>` +
      '</div>' +
      '<div class="ds-grid-2">' +
        `<section class="ds-card"><h2 class="ds-card__title">Recent activity</h2><ol class="ds-timeline" id="activity" role="list" aria-label="Recent activity">${activityHtml()}</ol></section>` +
        '<section class="ds-card"><h2 class="ds-card__title">Open tickets</h2>' +
          (open.length ? openTicketsHtml(open) : '<p class="ds-muted">No open tickets.</p>') +
          `<nav class="ds-card__links" aria-label="Tickets"><a class="ds-btn ds-btn--text ds-card__link" href="#/tickets">All tickets ${icon('arrowRight', 16)}</a></nav>` +
        '</section>' +
      '</div>';
  }

  /* ── Devices ──────────────────────────────────────────────────────── */

  const COLUMNS = [
    { key: 'name', label: 'Device', className: 'ds-nowrap' },
    { key: 'model', label: 'Model', className: 'ds-col--secondary ds-nowrap' },
    { key: 'owner', label: 'Owner', className: 'ds-col--secondary ds-nowrap' },
    { key: 'location', label: 'Location', className: 'ds-col--secondary' },
    // Live values change width: these columns keep theirs (app.css), so nothing shifts sideways.
    { key: 'lastSeen', label: 'Last seen', className: 'ds-num ds-nowrap ex-col-time' },
    { key: 'status', label: 'Status', className: 'ex-col-status' },
  ];

  function visibleDevices() {
    const query = state.query.trim().toLowerCase();
    const { key, dir } = state.sort;
    const value = (device) => (key === 'status' ? STATUS[device.status].rank : key === 'lastSeen' ? -device.lastSeen : String(device[key]).toLowerCase());
    return state.devices
      .filter((device) => state.type === 'all' || device.type === state.type)
      .filter((device) => !state.statuses.size || state.statuses.has(device.status))
      .filter((device) => !query || [device.name, device.model, device.owner, device.location, device.serial].some((text) => text.toLowerCase().includes(query)))
      .sort((a, b) => {
        const x = value(a);
        const y = value(b);
        const order = x < y ? -1 : x > y ? 1 : a.name.localeCompare(b.name);
        return dir === 'ascending' ? order : -order;
      });
  }

  /* The page of rows on show (the page holds the page number; a smaller list pulls it back). */
  function pageCount() {
    return Math.max(1, Math.ceil(visibleDevices().length / state.pageSize));
  }

  function pageDevices() {
    state.page = Math.min(state.page, pageCount() - 1);
    const start = state.page * state.pageSize;
    return visibleDevices().slice(start, start + state.pageSize);
  }

  /* The first column is pinned (.ds-table--pin-first): it holds the row's
     checkbox and its link, so both stay while the others scroll. */
  function theadHtml() {
    const shown = pageDevices();
    const sorted = (key) => state.sort.key === key;
    const sortButton = (column) => `<button class="ds-table__sort" type="button" data-sort="${column.key}">${column.label}${sorted(column.key) ? icon('arrowUp', 16, 'ds-table__sort-arrow') : ''}</button>`;
    return '<tr>' + COLUMNS.map((column, index) => `<th scope="col" class="${index === 0 ? 'ex-pick ' : ''}${column.className || ''}"${sorted(column.key) ? ` aria-sort="${state.sort.dir}"` : ''}>` +
      (index === 0 ? '<input type="checkbox" id="select-all" aria-label="Select all shown devices"' +
        (shown.length && shown.every((d) => state.selected.has(d.id)) ? ' checked' : '') + `>${sortButton(column)}` : sortButton(column)) + '</th>').join('') +
      '<th scope="col"><span class="ds-sr">Actions</span></th></tr>';
  }

  function rowHtml(device) {
    const selected = state.selected.has(device.id);
    return `<tr data-ds-key="${device.id}">` +
      `<td class="ex-pick ds-nowrap"><input type="checkbox" data-select="${device.id}" aria-label="Select ${esc(device.name)}"${selected ? ' checked' : ''}>` +
      `<button class="ds-link-btn ds-table__row-link" type="button" data-device="${device.id}">${esc(device.name)}</button></td>` +
      `<td class="ds-col--secondary ds-nowrap">${esc(device.model)}</td>` +
      `<td class="ds-col--secondary ds-nowrap">${esc(device.owner)}</td>` +
      `<td class="ds-col--secondary">${esc(device.location)}</td>` +
      `<td class="ds-num">${ago(device.lastSeen)}</td>` +
      `<td>${status(device.status)}</td>` +
      `<td class="ds-table__actions"><span class="ds-hover-actions"><button class="ds-btn ds-btn--quiet ds-btn--icon ds-btn--sm" type="button" data-menu="${device.id}" aria-label="Actions for ${esc(device.name)}" ` +
      `aria-haspopup="menu" aria-expanded="false" aria-controls="row-menu">${icon('moreVertical', 18)}</button></span></td></tr>`;
  }

  /* The bulk slot holds the list's title and count, or the selection bar
     while rows are selected; they cross (crossfade) only when the count
     goes from 0 to 1 and back, so the table never moves. */
  function bulkToolsHtml() {
    return `<div class="ds-card__row" id="bulk-tools"><h2 class="ds-card__title" id="devices-title" tabindex="-1">Fleet</h2><p class="ds-meta" id="bulk-shown">${plural(visibleDevices().length, 'device')} shown</p></div>`;
  }

  function selectionBarHtml() {
    const count = state.selected.size;
    return '<div class="ds-selection-bar" role="toolbar" aria-label="Selected devices">' +
      `<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" data-act="clear-selection" aria-label="Clear selection" data-tip="Clear selection">${icon('close', 20)}</button>` +
      `<p class="ds-selection-bar__count" aria-live="polite" id="bulk-count">${count} selected</p>` +
      `<div class="ds-selection-bar__actions"><button class="ds-btn ds-btn--text" type="button" data-act="delete-selected">${icon('trash', 18)} Delete ${plural(count, 'device')}</button></div></div>`;
  }

  function bulkHtml() {
    return state.selected.size ? selectionBarHtml() : bulkToolsHtml();
  }

  /* One element from the app's own markup (a crossfade takes an element). */
  function element(html) {
    const holder = document.createElement('div');
    holder.insertAdjacentHTML('beforeend', html);
    return holder.firstElementChild;
  }

  /* The footer of the table: rows per page, the range, first, previous, next, last. A button
     that leads nowhere is aria-disabled: it keeps the focus, and its tooltip still names it. */
  function paginationButtonsHtml() {
    const last = pageCount() - 1;
    const button = (to, label, glyph, blocked) => `<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" data-page="${to}" aria-label="${label}" data-tip="${label}"${blocked ? ' aria-disabled="true"' : ''}>${icon(glyph, 20)}</button>`;
    return button('first', 'First page', 'chevronFirst', state.page === 0) +
      button('previous', 'Previous page', 'chevronLeft', state.page === 0) +
      button('next', 'Next page', 'chevronRight', state.page >= last) +
      button('last', 'Last page', 'chevronLast', state.page >= last);
  }

  function rangeText() {
    const total = visibleDevices().length;
    const start = state.page * state.pageSize;
    return total ? `${start + 1}–${Math.min(total, start + state.pageSize)} of ${total}` : '0 of 0';
  }

  function paginationInnerHtml() {
    return '<div class="ds-pagination__size"><label class="ds-pagination__label" for="page-size">Rows per page</label>' +
      `<select class="ds-input ds-input--filled" id="page-size">${[25, 50, 100].map((size) => `<option${size === state.pageSize ? ' selected' : ''}>${size}</option>`).join('')}</select></div>` +
      `<p class="ds-pagination__range" aria-live="polite" id="devices-range">${rangeText()}</p>${paginationButtonsHtml()}`;
  }

  function paginationHtml() {
    return `<nav class="ds-pagination" id="devices-pages" aria-label="Pages of devices">${paginationInnerHtml()}</nav>`;
  }

  function chip(name, value, label, checked, type = 'checkbox') {
    return `<label class="ds-chip"><input class="ds-chip__input" type="${type}" name="${name}" value="${value}"${checked ? ' checked' : ''}>` +
      `<span class="ds-chip__body">${icon('check', 18, 'ds-chip__check')}<span>${label}</span></span></label>`;
  }

  function devicesHtml() {
    const rows = visibleDevices();
    return head('Devices', 'Every laptop, desktop, tablet and printer. The status of each device updates live; a row opens its details.',
      `<button class="ds-btn" type="button" data-act="refresh">${icon('sync', 16)} Refresh</button>`, state.back) +
      '<section class="ds-card" id="devices-card">' +
        '<div class="ds-toolbar"><div class="ds-filters">' +
          `<div class="ds-field ds-field--grow"><label class="ds-sr" for="q">Search</label><div class="ds-search">${icon('search', 20)}` +
            `<input class="ds-input" id="q" type="search" placeholder="Search name, owner, serial" value="${esc(state.query)}" autocomplete="off"></div></div>` +
          '<div class="ds-field"><label class="ds-field__label" for="f-type">Type</label><select class="ds-input ds-input--filled" id="f-type">' +
            `<option value="all">All types</option>${Object.keys(TYPES).map((type) => `<option value="${type}"${state.type === type ? ' selected' : ''}>${TYPES[type]}</option>`).join('')}</select></div>` +
        '</div>' +
        `<fieldset class="ds-chips" id="status-chips"><legend class="ds-sr">Status</legend>${['error', 'warning', 'running', 'ok'].map((kind) => chip('status', kind, STATUS[kind].label, state.statuses.has(kind))).join('')}</fieldset>` +
        `<div class="ds-swap" id="bulk">${bulkHtml()}</div>` +
        '</div>' +
      '</section>' +
      // The last child of the page: in a .ds-view--fill it takes what is left of the view.
      '<div class="ex-list" id="devices-list">' +
        '<div class="ds-table-wrap ds-table-wrap--fill" id="devices-wrap">' +
          `<table class="ds-table ds-table--interactive ds-table--pin-first${state.dense ? ' ds-table--dense' : ''}" id="devices-table"><caption class="ds-sr">Devices</caption>` +
          `<thead id="devices-head">${theadHtml()}</thead><tbody id="devices-body">${pageDevices().map(rowHtml).join('')}</tbody></table>` +
          `<div class="ds-empty" id="devices-empty"${rows.length ? ' hidden' : ''}><span class="ds-empty__disc" aria-hidden="true">${icon('search', 24)}</span>` +
            '<p class="ds-empty__title">No device matches</p><p class="ds-empty__text">Try another search or clear the filters.</p>' +
            '<button class="ds-btn ds-btn--tonal" type="button" data-act="clear-filters">Clear filters</button></div>' +
        '</div>' +
        paginationHtml() +
      '</div>';
  }

  /* After the selection changed: the header box (indeterminate for some),
     the bulk slot. The rows take their colour from their checked box. */
  function syncSelection() {
    const all = $('#select-all');
    if (!all) return;
    const shown = pageDevices();
    const picked = shown.filter((device) => state.selected.has(device.id)).length;
    all.checked = shown.length > 0 && picked === shown.length;
    all.indeterminate = picked > 0 && picked < shown.length;
    for (const box of $$('[data-select]', page)) box.checked = state.selected.has(box.getAttribute('data-select'));
    const slot = $('#bulk');
    const bar = $(':scope > .ds-selection-bar:not([data-ds-leaving])', slot);
    const count = state.selected.size;
    if (count && !bar) M.crossfade(slot, element(selectionBarHtml()));
    else if (!count && bar) M.crossfade(slot, element(bulkToolsHtml()));
    else if (bar) {
      // The count changes at once, never with a crossfade.
      $('#bulk-count', bar).textContent = `${count} selected`;
      DS.dom.morphHtml($('.ds-selection-bar__actions', bar), `<button class="ds-btn ds-btn--text" type="button" data-act="delete-selected">${icon('trash', 18)} Delete ${plural(count, 'device')}</button>`);
    } else {
      const shownText = $('#bulk-shown', slot);
      if (shownText) shownText.textContent = `${plural(visibleDevices().length, 'device')} shown`;
    }
  }

  /* The footer follows the list: the range at once, the buttons patched in place (focus stays). */
  function syncPagination() {
    const nav = $('#devices-pages');
    if (nav) DS.dom.morphHtml(nav, paginationInnerHtml());
  }

  let emptyShown = false;

  /* Sort, filter, live data and deletions all render the rows the same way:
     keyed rows, morphHtml inside flip(). `live` only for polled data. */
  function renderRows(options = {}) {
    const body = $('#devices-body');
    if (!body) return Promise.resolve();
    const rows = visibleDevices();
    const shown = pageDevices();
    DS.dom.morphHtml($('#devices-head'), theadHtml());
    const glide = M.flip(body, (morph) => DS.dom.morphHtml(body, shown.map(rowHtml).join(''), morph), { items: 'tr', live: !!options.live });
    syncSelection();
    syncPagination();
    const empty = $('#devices-empty');
    if (!rows.length && !emptyShown) {
      emptyShown = true;
      // The rows leave first, then the empty state fades in, without a rise.
      glide.then(() => { if (emptyShown) M.enter(empty, 'fade'); });
    } else if (rows.length && emptyShown) {
      emptyShown = false;
      M.leave(empty, '', { then: 'hide' });
    }
    return glide;
  }

  /* The refresh pattern as one call (DS.motion.refresh): the list dims
     (.ds-stale), the loading bar runs at the top of the page, and both go
     once the data is in; render right after. */
  async function refreshDevices() {
    const devices = await M.refresh($('#devices-list'), () => api.devices());
    state.devices = devices;
    renderRows();
    DS.overlay.toast(toasts, 'Devices refreshed.');
  }

  /* ── Tickets ──────────────────────────────────────────────────────── */

  function visibleTickets() {
    return state.tickets.filter((ticket) => state.ticketFilter === 'all' || (state.ticketFilter === 'open' ? ticket.status !== 'closed' : ticket.status === 'closed'));
  }

  function ticketRowsHtml() {
    return visibleTickets().map((ticket) => {
      const device = byId(ticket.device);
      const open = state.expanded.has(ticket.id);
      const key = `t-${ticket.id}`;
      return `<tr data-ds-key="${key}">` +
        `<td><button class="ds-btn ds-btn--quiet ds-btn--icon ds-table__toggle" type="button" data-toggle-ticket="${ticket.id}" aria-expanded="${open}" aria-controls="${key}-detail" ` +
          `aria-label="Details of ticket ${ticket.id}">${icon('chevronDown', 20, 'ds-chevron')}</button></td>` +
        `<td class="ds-nowrap">#${ticket.id}</td>` +
        `<td class="ds-col--text">${esc(ticket.subject)}</td>` +
        `<td class="ds-col--secondary ds-nowrap">${device ? esc(device.name) : 'Removed device'}</td>` +
        `<td>${ticket.priority === 'high' ? `<span class="ds-status ds-status--warning">${icon('flag', 16)}<span>High</span></span>` : PRIORITY[ticket.priority]}</td>` +
        `<td>${ticketStatus(ticket.status)}</td>` +
        `<td class="ds-num">${ago(ticket.opened)}</td></tr>` +
        `<tr class="ds-table__detail" id="${key}-detail" data-ds-key="${key}-detail"${open ? '' : ' inert'}><td colspan="7"><div class="ds-table__expand"><div class="ex-detail">` +
          `<p>${esc(ticket.text || 'No description.')}</p><div class="ex-row">` +
          (ticket.status !== 'closed' ? facesButton('ds-btn ds-btn--sm', 'Close ticket', 'Closing', 'Closed', `data-close-ticket="${ticket.id}"`) : '') +
          (device ? `<button class="ds-link-btn" type="button" data-device="${device.id}">Open ${esc(device.name)}</button>` : '') +
        '</div></div></div></td></tr>';
    }).join('');
  }

  function ticketsHtml() {
    const shown = visibleTickets();
    return head('Tickets', 'Problems reported for a device. A row opens in place; a new ticket opens a dialog.',
      `<button class="ds-btn ds-btn--primary" type="button" data-act="new-ticket">${icon('plus', 16)} New ticket</button>`, state.back) +
      '<section class="ds-card">' +
        `<div class="ds-toolbar"><fieldset class="ds-chips" id="ticket-chips"><legend class="ds-sr">Show</legend>${
          [['open', 'Open'], ['closed', 'Closed'], ['all', 'All']].map(([value, label]) => chip('ticket-filter', value, label, state.ticketFilter === value, 'radio')).join('')}</fieldset></div>` +
        `<div class="ds-table-wrap"><table class="ds-table${state.dense ? ' ds-table--dense' : ''}"><caption class="ds-sr">Tickets</caption><thead><tr>` +
          '<th scope="col"><span class="ds-sr">Details</span></th><th scope="col">Ticket</th><th scope="col">Subject</th><th scope="col" class="ds-col--secondary">Device</th>' +
          '<th scope="col">Priority</th><th scope="col">Status</th><th scope="col" class="ds-num">Opened</th>' +
        `</tr></thead><tbody id="tickets-body">${ticketRowsHtml()}</tbody></table></div>` +
        `<p class="ds-meta" id="tickets-count">${plural(shown.length, 'ticket')}</p>` +
      '</section>';
  }

  function renderTickets() {
    const body = $('#tickets-body');
    if (!body) return Promise.resolve();
    $('#tickets-count').textContent = plural(visibleTickets().length, 'ticket');
    return M.flip(body, (morph) => DS.dom.morphHtml(body, ticketRowsHtml(), morph), { items: 'tr' });
  }

  /* ── Settings ─────────────────────────────────────────────────────── */

  function switchHtml(setting, label, checked) {
    return `<label class="ds-switch"><input type="checkbox" role="switch" data-setting="${setting}"${checked ? ' checked' : ''}>` +
      `<span class="ds-switch__track" aria-hidden="true"></span><span class="ds-switch__label">${label}</span>` +
      '<span class="ds-switch__state" aria-hidden="true"><span class="ds-switch__on">On</span><span class="ds-switch__off">Off</span></span></label>';
  }

  const ACCENTS = [
    ['default', 'Blue', 'The default theme of Dashboard-Style.'],
    ['teal', 'Teal', 'Roles overridden in theme.css.'],
    ['violet', 'Violet', 'The same roles, another hue.'],
  ];

  const APPEARANCES = [
    ['system', 'System', 'Dark when the device is (prefers-color-scheme).'],
    ['light', 'Light', 'The default palette.'],
    ['dark', 'Dark', 'themes/dark.css of the vendored copy.'],
  ];

  /* The dark theme's link media for a choice, and data-ex-dark while it applies (the accents' dark tones). */
  const DARK_QUERY = window.matchMedia('(prefers-color-scheme: dark)');
  function applyAppearance(choice) {
    const link = document.getElementById('ex-dark');
    link.media = choice === 'dark' ? 'all' : choice === 'light' ? 'not all' : DARK_QUERY.media;
    document.documentElement.toggleAttribute('data-ex-dark', window.matchMedia(link.media).matches);
  }
  DARK_QUERY.addEventListener('change', () => applyAppearance(stored('ex-appearance') || 'system'));

  function settingsHtml() {
    const s = state.settings;
    const accent = document.documentElement.getAttribute('data-ex-accent') || 'default';
    const appearance = stored('ex-appearance') || 'system';
    const option = (value, label, current) => `<option value="${value}"${value === current ? ' selected' : ''}>${label}</option>`;
    return head('Settings', 'Switches, the accent and the appearance apply at once. The organisation saves with its button.') +
      '<div class="ds-grid-2">' +
        '<section class="ds-card"><h2 class="ds-card__title">Sync</h2>' +
          switchHtml('nightlySync', 'Nightly sync at 02:00', s.nightlySync) +
          switchHtml('notifyFailures', 'Email me when a sync fails', s.notifyFailures) +
          switchHtml('dense', 'Compact tables', state.dense) +
          switchHtml('offline', 'Simulate a lost connection', state.offline) +
          '<p class="ds-muted">A switch takes effect when it flips; there is nothing to save.</p>' +
        '</section>' +
        '<section class="ds-card"><h2 class="ds-card__title" id="accent-title">Accent colour</h2>' +
          '<div class="ds-radios" role="radiogroup" aria-labelledby="accent-title">' + ACCENTS.map(([value, label, text]) =>
            `<label class="ds-radio"><input type="radio" name="accent" value="${value}"${value === accent ? ' checked' : ''}>` +
            `<span><strong><span class="ex-swatch" data-accent="${value}" aria-hidden="true"></span>${label}</strong><small>${text}</small></span></label>`).join('') +
          '</div>' +
        '</section>' +
        '<section class="ds-card"><h2 class="ds-card__title" id="appearance-title">Appearance</h2>' +
          '<div class="ds-radios" role="radiogroup" aria-labelledby="appearance-title">' + APPEARANCES.map(([value, label, text]) =>
            `<label class="ds-radio"><input type="radio" name="appearance" value="${value}"${value === appearance ? ' checked' : ''}>` +
            `<span><strong>${label}</strong><small>${text}</small></span></label>`).join('') +
          '</div>' +
        '</section>' +
      '</div>' +
      '<form class="ds-card ds-form" id="org-form" novalidate><h2 class="ds-card__title">Organisation</h2>' +
        '<div class="ds-form-grid">' +
          `<div class="ds-field"><label class="ds-field__label" for="org-name">Name</label><input class="ds-input" id="org-name" name="organisation" value="${esc(s.organisation)}" aria-describedby="org-name-hint"><small class="ds-field__hint" id="org-name-hint">Shown in reports and emails.</small></div>` +
          `<div class="ds-field"><label class="ds-field__label" for="org-contact">Contact email</label><input class="ds-input" id="org-contact" name="contact" type="email" value="${esc(s.contact)}"></div>` +
          `<div class="ds-field"><label class="ds-field__label" for="org-timezone">Time zone</label><select class="ds-input" id="org-timezone" name="timezone">${['UTC', 'Europe/London', 'America/New_York', 'Asia/Tokyo'].map((zone) => option(zone, zone, s.timezone)).join('')}</select></div>` +
          `<div class="ds-field"><label class="ds-field__label" for="org-retention">Keep history for</label><select class="ds-input" id="org-retention" name="retention">${[['30', '30 days'], ['90', '90 days'], ['365', 'One year']].map(([v, l]) => option(v, l, s.retention)).join('')}</select></div>` +
        '</div>' +
        `<details class="ds-collapsible ds-disclosure"><summary>Advanced${icon('chevronDown', 20, 'ds-chevron')}</summary>` +
          '<div class="ds-disclosure__body"><div class="ds-field"><label class="ds-field__label" for="api-key">API key</label><div class="ds-field__row">' +
            '<input class="ds-input" id="api-key" value="ex_7f3a9c21d4e8b605" readonly>' +
            `<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Copy the key" data-tip="Copy the key" data-act="copy-key"><span class="ds-icon-swap" data-swap="a"><span class="ds-icon-swap__a">${icon('copy', 20)}</span><span class="ds-icon-swap__b">${icon('check', 20)}</span></span></button>` +
          '</div></div></div>' +
        '</details>' +
        '<div class="ds-form-actions">' +
          '<button class="ds-btn ds-btn--primary" type="submit"><span class="ds-btn__faces"><span class="ds-btn__face">Save</span>' +
            `<span class="ds-btn__face ds-btn__face--busy" aria-hidden="true"><span class="ds-spinner ds-spinner--sm"></span>Saving</span><span class="ds-btn__face ds-btn__face--done" aria-hidden="true">${icon('check', 16)}Saved</span></span></button>` +
          '<button class="ds-btn ds-btn--text" type="reset">Reset</button>' +
          `<p class="ds-meta" id="org-saved">${state.savedAt ? `Last saved today, ${clock(state.savedAt)}` : 'Not changed yet'}</p>` +
        '</div>' +
      '</form>';
  }

  /* ── Validation ───────────────────────────────────────────────────── */

  /* aria-invalid and an error hint with its icon, linked by aria-describedby. */
  function setError(input, message) {
    const id = `${input.id}-error`;
    const hint = document.getElementById(id);
    const described = (input.getAttribute('aria-describedby') || '').split(' ').filter((token) => token && token !== id);
    if (!message) {
      input.removeAttribute('aria-invalid');
      if (hint) hint.remove();
      if (described.length) input.setAttribute('aria-describedby', described.join(' '));
      else input.removeAttribute('aria-describedby');
      return false;
    }
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', [...described, id].join(' '));
    if (hint) hint.lastChild.textContent = message;
    else input.closest('.ds-field').insertAdjacentHTML('beforeend', `<small class="ds-field__hint ds-field__hint--error" id="${id}">${icon('alertCircle', 16)}<span>${esc(message)}</span></small>`);
    return true;
  }

  /* ── Rendering and navigation ─────────────────────────────────────── */

  const VIEWS = {
    overview: { title: 'Overview', html: overviewHtml, after: growChart },
    devices: { title: 'Devices', html: devicesHtml, after: syncSelection },
    tickets: { title: 'Tickets', html: ticketsHtml },
    settings: { title: 'Settings', html: settingsHtml },
  };

  /* "#/devices?status=error" → { route: 'devices', params } */
  function parse(hash) {
    const match = /^#\/([a-z]+)(?:\?(.*))?$/.exec(hash || '');
    const route = match && VIEWS[match[1]] ? match[1] : 'overview';
    return { route, params: new URLSearchParams(match ? match[2] || '' : '') };
  }

  /* Filters a link carries (a tile, an alert, a ticket in the overview);
     such a view offers the way back to the overview in its head. */
  function applyParams(route, params) {
    state.back = route !== 'overview' && params.toString() ? { href: '#/overview', label: 'Overview' } : null;
    if (route === 'devices' && params.has('status')) {
      state.statuses = new Set(params.get('status').split(',').filter((kind) => STATUS[kind]));
      state.query = '';
      state.type = 'all';
      state.page = 0;
    }
    if (route === 'tickets' && params.has('open')) {
      const id = Number(params.get('open'));
      state.expanded.add(id);
      const ticket = state.tickets.find((other) => other.id === id);
      if (ticket && ticket.status === 'closed' && state.ticketFilter === 'open') state.ticketFilter = 'all';
    }
  }

  /* The table wrappers report which ends have more columns (DS.dom.scrollEdges):
     the edge fades and the pinned column's hairline where scroll timelines are
     missing, the unmasked scrollbar strip and the pinned column's width (focus
     never lands under it) everywhere. A wrapper the new view dropped lets go. */
  const edges = new Map();
  function watchEdges() {
    for (const [wrap, handle] of edges) {
      if (wrap.isConnected) continue;
      handle.destroy();
      edges.delete(wrap);
    }
    for (const wrap of $$('.ds-table-wrap', page)) if (!edges.has(wrap)) edges.set(wrap, DS.dom.scrollEdges(wrap));
  }

  function renderView() {
    // The devices view fills the window: its full-page table takes what is left (.ds-view--fill).
    view.classList.toggle('ds-view--fill', state.route === 'devices');
    DS.dom.morphHtml(page, VIEWS[state.route].html(), { replace: true });
    watchEdges();
    emptyShown = state.route === 'devices' && !visibleDevices().length;
    for (const item of $$('[data-route]', nav)) {
      if (item.getAttribute('data-route') === state.route) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    }
    document.title = `${VIEWS[state.route].title} · Example Console`;
    view.scrollTop = 0;
  }

  /* The columns fill from zero once, on the view's render (.ds-enter--fill). */
  function growChart() {
    M.enterAll($$('.ds-columns__col', page), 'fill', { stagger: false });
  }

  /* A destination: fade-through. The modal drawer closes inside the update,
     so the new view crossfades under it; focus: true puts the focus it
     took with it (the modal drawer) on the new title. */
  function go(hash, { push = true } = {}) {
    const { route, params } = parse(hash);
    if (push && location.hash !== hash) history.pushState(null, '', hash);
    applyParams(route, params);
    if (route === state.route && !params.toString() && !app.hasAttribute('data-drawer-open')) return Promise.resolve();
    // focus: true: a navigation that took the focus with it (a drawer link) lands on the new title.
    return M.transition(() => {
      if (app.hasAttribute('data-drawer-open')) DS.overlay.close(drawer);
      state.route = route;
      renderView();
      if (VIEWS[route].after) VIEWS[route].after();
      return page;
    }, { type: 'fade-through', focus: true });
  }

  /* ── Live data ────────────────────────────────────────────────────── */

  /* Figures count from what they show (countUp), notes change at once. */
  const counted = new WeakSet();
  function updateTiles() {
    const c = counts();
    for (const tile of TILES) {
      const value = $(`[data-tile="${tile.key}"]`, page);
      if (!value) continue;
      const options = counted.has(value) ? {} : { from: Number(value.textContent) };
      counted.add(value);
      M.countUp(value, tile.value(c), options);
      $(`[data-tile-note="${tile.key}"]`, page).textContent = tile.note(c);
    }
  }

  function updateAlerts(live) {
    const stack = $('#alerts');
    if (!stack) return;
    const html = alertsHtml();
    if (html) stack.hidden = false;
    // A dismissed alert's focus moves to the next alert's Dismiss (flip's refocus), else to the page title.
    M.flip(stack, (morph) => DS.dom.morphHtml(stack, html, morph), { live, refocus: () => $('h1', page) }).then(() => {
      if (!alertsHtml() && stack.isConnected) stack.hidden = true;
    });
  }

  async function poll() {
    if (document.hidden || !state.devices.length) return;
    let result;
    try {
      result = await api.poll();
    } catch (error) {
      showOffline(true);
      return;
    }
    showOffline(false);
    state.devices = result.devices;
    state.activity.push(...result.activity);
    if (state.route === 'overview') {
      updateTiles();
      updateAlerts(true);
      const feed = $('#activity');
      if (feed) M.flip(feed, (morph) => DS.dom.morphHtml(feed, activityHtml(), morph), { live: true });
    }
    // Polled data: values change at once, a reorder waits while the rows are pointed at.
    if (state.route === 'devices') renderRows({ live: true });
    // The same record refreshed: never a transition.
    if (state.sheetId && byId(state.sheetId) && sheet.open) DS.dom.morphHtml(sheetBody, sheetHtml(byId(state.sheetId)));
  }

  /* A message for the whole app: the banner above the view while the
     backend does not answer. It comes and goes through flip() on the panel,
     so the view glides and no height animates. */
  const panel = $('.ds-panel');
  let banner = null;
  function showOffline(on) {
    if (on === Boolean(banner?.isConnected)) return;
    if (!banner) {
      banner = document.createElement('div');
      banner.className = 'ds-banner';
      banner.id = 'offline-banner';
      DS.dom.morphHtml(banner, `<div class="ds-alert ds-alert--warning" role="status">${icon('wifiOff', 20)}` +
        '<span class="ds-alert__text">The console is offline. Figures stay as they were until it answers again.</span>' +
        '<button class="ds-btn ds-btn--text ds-btn--sm" type="button">Retry</button></div>');
      banner.addEventListener('click', (event) => { if (event.target.closest('button')) poll(); });
    }
    M.flip(panel, () => { if (on) panel.prepend(banner); else banner.remove(); }, { items: ':scope > *' });
  }

  /* ── The side sheet ───────────────────────────────────────────────── */

  /* Details and History: ARIA tabs; the page keeps the choice (a live
     refresh re-renders the body with it). */
  const SHEET_TABS = [['details', 'Details'], ['history', 'History']];

  function sheetHtml(device) {
    const tickets = state.tickets.filter((ticket) => ticket.device === device.id);
    const events = state.activity.filter((entry) => entry.text.startsWith(`${device.name} `)).slice(-5).reverse();
    const list = visibleDevices().length ? visibleDevices() : state.devices;
    const index = list.findIndex((other) => other.id === device.id);
    const shown = (name) => (state.sheetTab === name ? '' : ' hidden');
    return '<div class="ds-tabs" role="tablist" aria-label="Device" id="sheet-tabs">' +
      SHEET_TABS.map(([name, label]) => `<button class="ds-tabs__tab" role="tab" type="button" id="sheet-t-${name}" aria-controls="sheet-p-${name}" data-tab="${name}" data-label="${label}"` +
        ` aria-selected="${state.sheetTab === name}"${state.sheetTab === name ? '' : ' tabindex="-1"'}>${label}` +
        // The device's tickets as a count on History (an empty badge takes no room).
        `${name === 'history' ? `<span class="ds-badge">${tickets.length || ''}</span>` : ''}</button>`).join('') + '</div>' +
      `<div class="ds-tabs__panel ds-stack" role="tabpanel" id="sheet-p-details" aria-labelledby="sheet-t-details"${shown('details')}>` +
      `<dl class="ds-facts"><div><dt>Owner</dt><dd>${esc(device.owner)}</dd></div><div><dt>Location</dt><dd>${esc(device.location)}</dd></div>` +
      `<div><dt>Last seen</dt><dd>${ago(device.lastSeen)}</dd></div><div><dt>Status</dt><dd>${status(device.status)}</dd></div></dl>` +
      `<ul class="ds-kv-list"><li><span>Model</span><strong>${esc(device.model)}</strong></li><li><span>System</span><strong>${esc(device.system)}</strong></li>` +
      `<li><span>Serial</span><strong>${esc(device.serial)}</strong></li><li><span>Address</span><strong>${esc(device.address)}</strong></li>` +
      `<li><span>Bought</span><strong>${esc(device.bought)}</strong></li></ul>` +
      '<div class="ex-row">' +
        facesButton('ds-btn ds-btn--tonal', 'Restart', 'Restarting', 'Restarted', `data-sheet="restart" data-ds-key="restart-${device.id}"`) +
        `<button class="ds-btn" type="button" data-sheet="ticket">${icon('ticket', 16)} New ticket</button>` +
      '</div></div>' +
      `<div class="ds-tabs__panel ds-stack" role="tabpanel" id="sheet-p-history" aria-labelledby="sheet-t-history" tabindex="0"${shown('history')}>` +
        '<h3 class="ds-card__subtitle">Tickets</h3>' +
        (tickets.length ? `<ul class="ds-plain-list">${tickets.map((ticket) => `<li>#${ticket.id} ${esc(ticket.subject)} ${ticketStatus(ticket.status)}</li>`).join('')}</ul>` : '<p class="ds-muted">No tickets for this device.</p>') +
        '<h3 class="ds-card__subtitle">Activity</h3>' +
        (events.length ? `<ul class="ds-plain-list">${events.map((entry) => `<li>${esc(entry.text)} <span class="ds-meta">${ago(entry.at)}</span></li>`).join('')}</ul>` : '<p class="ds-muted">Nothing happened lately.</p>') +
      '</div>' +
      `<p class="ds-meta">Device ${index + 1} of ${list.length}</p>`;
  }

  function fillSheet(id) {
    state.sheetId = id;
    $('#sheet-title').textContent = byId(id).name;
    DS.dom.morphHtml(sheetBody, sheetHtml(byId(id)));
    sheetBody.scrollTop = 0;
    // The bar under the selected tab (one handle: a second call returns it).
    DS.indicator.createIndicator($('#sheet-tabs', sheetBody), { active: '[aria-selected="true"]', className: 'ds-tabs__indicator' });
  }

  /* A tab shows its panel, which enters with swap; the bar glides by itself. */
  function selectSheetTab(name) {
    if (state.sheetTab === name) return;
    state.sheetTab = name;
    for (const tab of $$('[role="tab"]', sheetBody)) {
      const selected = tab.getAttribute('data-tab') === name;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    }
    for (const panel of $$('[role="tabpanel"]', sheetBody)) {
      panel.hidden = panel.id !== `sheet-p-${name}`;
      if (!panel.hidden) M.enter(panel, 'swap');
    }
  }

  function openSheet(id, opener) {
    state.sheetTab = 'details';
    fillSheet(id);
    DS.overlay.open(sheet, { opener });
  }

  /* Previous and next: a record swap on the shared axis; the head stays. */
  function stepSheet(delta) {
    const list = visibleDevices().length ? visibleDevices() : state.devices;
    const index = list.findIndex((device) => device.id === state.sheetId);
    const next = list[(index + delta + list.length) % list.length];
    if (!next) return;
    M.transition(() => { fillSheet(next.id); return sheetBody; }, { type: delta > 0 ? 'forward' : 'back', focus: true });
  }

  /* ── Actions ──────────────────────────────────────────────────────── */

  /*
   * Asks first with DS.overlay.confirm(): the dialog is built for us, and
   * it stays open (busy, data-ds-busy) until the backend answered; a
   * failure keeps it open with an error snackbar. Then the rows go.
   */
  async function confirmDelete(ids, opener) {
    const one = ids.length === 1 ? byId(ids[0]) : null;
    let removed = [];
    const deleted = await DS.overlay.confirm({
      title: one ? `Delete ${one.name}?` : `Delete ${ids.length} devices?`,
      text: `${one ? 'It disappears' : 'They disappear'} from every list. The snackbar offers to undo it.`,
      confirmLabel: one ? 'Delete device' : `Delete ${ids.length} devices`,
      destructive: true,
      opener,
      onConfirm: async () => { removed = await api.removeDevices(ids); },
      errorText: one ? `Could not delete ${one.name}.` : 'Could not delete the devices.',
    });
    if (deleted) deleteDevices(ids, removed);
  }

  async function deleteDevices(ids, removed) {
    if (state.sheetId && ids.includes(state.sheetId) && sheet.open) DS.overlay.close(sheet);
    state.devices = state.devices.filter((device) => !ids.includes(device.id));
    for (const id of ids) state.selected.delete(id);
    await renderRows();
    // The focused control left with its row: the table's title takes focus.
    if (!document.activeElement || document.activeElement === document.body || !document.activeElement.isConnected) {
      const title = $('#devices-title') || $('h1', page);
      if (title) title.focus({ preventScroll: true });
    }
    undoToast(removed);
  }

  /* A snackbar with an action stays until it is used or closed; the
     action closes it and runs once. */
  function undoToast(removed) {
    const text = removed.length === 1 ? `${removed[0].name} deleted.` : `${removed.length} devices deleted.`;
    DS.overlay.toast(toasts, text, {
      action: {
        label: 'Undo',
        onClick: async () => {
          state.devices = await api.restoreDevices(removed);
          renderRows();
          DS.overlay.toast(toasts, removed.length === 1 ? `${removed[0].name} restored.` : `${removed.length} devices restored.`);
        },
      },
    });
  }

  async function restart(id, button) {
    const device = byId(id);
    if (!device) return;
    const work = api.restart(id);
    if (button) await M.busy(button, work);
    else await work;
    device.status = 'running';
    device.lastSeen = Date.now();
    renderRows();
    if (state.sheetId === id && sheet.open) DS.dom.morphHtml(sheetBody, sheetHtml(device));
    DS.overlay.toast(toasts, `${device.name} is restarting.`);
  }

  async function runSync(button) {
    if (state.sync.running) return;
    state.sync = { running: true, done: 0, total: state.devices.length, finished: null, summary: null };
    showSync();
    await M.busy(button, api.sync((done, total) => {
      state.sync.done = done;
      state.sync.total = total;
      showSync();
    }));
    state.sync.running = false;
    state.sync.finished = Date.now();
    state.sync.summary = ['2 new', '1 updated', `${state.sync.total - 3} unchanged`];
    showSync();
    // One error per cause: a second sync replaces the old one (key), a
    // sync without offline devices closes it.
    const offline = state.devices.filter((device) => device.status === 'error');
    if (offline.length) {
      DS.overlay.toast(toasts, offline.length === 1 ? `${offline[0].name} did not answer the sync.` : `${offline.length} devices did not answer the sync.`, { kind: 'error', key: 'sync-offline' });
    } else DS.overlay.closeToasts(toasts, { key: 'sync-offline' });
    DS.overlay.toast(toasts, 'Sync finished.');
  }

  /* The progress bar and its figure land together: --ds-progress and
     countUp() in the same task. */
  function showSync() {
    const progress = $('#sync-progress');
    if (!progress) return;
    const { running, done, total } = state.sync;
    const label = $('.ds-progress__label', progress);
    if (running && !done) {
      DS.dom.progress(progress, null, { valueText: 'Preparing' });
      label.textContent = 'Preparing';
      $('.ds-progress__detail', progress).textContent = `${total} devices`;
      return;
    }
    const share = total ? done / total : 0;
    const percent = Math.round(share * 100);
    const first = progress.classList.contains('ds-progress--indeterminate');
    // The share and its ARIA in one call, in the task of the count.
    DS.dom.progress(progress, share);
    M.countUp(label, percent, { format: (value) => `${Math.round(value)}%`, ...(first ? { from: 0 } : {}) });
    $('.ds-progress__detail', progress).textContent = running ? `${done} of ${total} devices` : `Finished at ${clock(state.sync.finished)}`;
    if (!running && state.sync.summary) DS.dom.morphHtml(page, overviewHtml());
  }

  function openTicketDialog(opener, deviceId) {
    ticketForm.reset();
    for (const input of $$('[aria-invalid]', ticketForm)) setError(input, '');
    const device = deviceId && byId(deviceId);
    $('#ticket-device').value = device ? device.name : '';
    DS.overlay.open(ticketDialog, { opener });
  }

  async function createTicket(submit) {
    const subject = $('#ticket-subject');
    const deviceInput = $('#ticket-device');
    const device = state.devices.find((other) => other.name.toLowerCase() === deviceInput.value.trim().toLowerCase());
    const bad = [
      setError(subject, subject.value.trim() ? '' : 'Enter a subject.') && subject,
      setError(deviceInput, device ? '' : deviceInput.value.trim() ? 'No device with this name.' : 'Choose a device.') && deviceInput,
    ].filter(Boolean);
    if (bad.length) {
      bad[0].focus();
      // The field says its own error; the count is said once, inside the dialog.
      DS.overlay.announce(bad.length === 1 ? 'The ticket was not created: one field needs attention.' : `The ticket was not created: ${bad.length} fields need attention.`, { assertive: true });
      return;
    }
    const data = new FormData(ticketForm);
    const ticket = await M.busy(submit, () => api.createTicket({
      subject: subject.value.trim(), device: device.id, priority: data.get('priority'), text: String(data.get('text') || '').trim(),
    }));
    state.tickets.unshift(ticket);
    DS.overlay.close(ticketDialog);
    if (state.route === 'tickets') {
      if (state.ticketFilter === 'closed') state.ticketFilter = 'open';
      renderTickets();
    }
    DS.overlay.toast(toasts, `Ticket #${ticket.id} created${data.get('notify') ? `, ${device.owner} was told` : ''}.`);
  }

  /* ── The combobox in the ticket dialog ────────────────────────────── */

  const combo = {
    input: $('#ticket-device'),
    popup: $('#ticket-combo .ds-combo__popup'),
    list: $('#ticket-device-list'),
    status: $('#ticket-combo .ds-combo__status'),
    toggle: $('#ticket-combo .ds-combo__toggle'),
    matches: [],
    active: -1,
  };

  const comboOpen = () => combo.input.getAttribute('aria-expanded') === 'true';

  function comboRender(query) {
    const q = query.trim().toLowerCase();
    combo.matches = state.devices.filter((device) => !q || [device.name, device.owner, device.model].some((text) => text.toLowerCase().includes(q)));
    combo.active = Math.min(combo.active, combo.matches.length - 1);
    // Nothing matches: the list hides, the popup stays with its status line.
    combo.list.hidden = !combo.matches.length;
    DS.dom.morphHtml(combo.list, combo.matches.map((device, index) =>
      `<li class="ds-combo__option" id="opt-${device.id}" role="option" aria-selected="${device.name === combo.input.value}"${index === combo.active ? ' data-active' : ''}>` +
      `<span class="ds-combo__name">${esc(device.name)}</span><span class="ds-combo__meta">${esc(device.owner)}</span></li>`).join(''));
    combo.status.textContent = combo.matches.length ? `${combo.matches.length} of ${state.devices.length}` : 'No match';
    const active = combo.matches[combo.active];
    if (active) {
      combo.input.setAttribute('aria-activedescendant', `opt-${active.id}`);
      document.getElementById(`opt-${active.id}`).scrollIntoView({ block: 'nearest' });
    } else combo.input.removeAttribute('aria-activedescendant');
  }

  function comboShow(query) {
    comboRender(query);
    if (!comboOpen()) DS.overlay.open(combo.popup, { opener: combo.input });
  }

  function comboChoose(device) {
    combo.input.value = device.name;
    setError(combo.input, '');
    if (comboOpen()) DS.overlay.close(combo.popup);
  }

  combo.input.addEventListener('input', () => {
    combo.active = -1;
    comboShow(combo.input.value);
  });

  combo.input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const count = comboOpen() ? combo.matches.length : state.devices.length;
      if (!count) return;
      combo.active = event.key === 'ArrowDown' ? (combo.active + 1) % count : (combo.active <= 0 ? count - 1 : combo.active - 1);
      comboShow(comboOpen() ? combo.input.value : '');
    } else if (event.key === 'Enter' && comboOpen()) {
      event.preventDefault();
      const device = combo.matches[combo.active] || (combo.matches.length === 1 ? combo.matches[0] : null);
      if (device) comboChoose(device);
    }
  });

  combo.input.addEventListener('blur', () => { if (comboOpen()) DS.overlay.close(combo.popup); });

  combo.toggle.addEventListener('click', () => {
    if (comboOpen()) DS.overlay.close(combo.popup);
    else comboShow('');
    combo.input.focus();
  });

  // Pressing an option keeps the focus in the field, then chooses it.
  combo.list.addEventListener('pointerdown', (event) => event.preventDefault());
  combo.list.addEventListener('click', (event) => {
    const option = event.target.closest('.ds-combo__option');
    if (option) comboChoose(byId(option.id.slice('opt-'.length)));
  });

  /* ── Wiring ───────────────────────────────────────────────────────── */

  /* Icons of the static markup: data-icon="name" puts the glyph first. */
  for (const element of $$('[data-icon]')) {
    element.insertAdjacentHTML('afterbegin', icon(element.getAttribute('data-icon'), 20));
    element.removeAttribute('data-icon');
  }
  for (const element of $$('[data-icon-done]')) element.insertAdjacentHTML('afterbegin', icon('check', 16));
  for (const element of $$('[data-icon-chevron]')) element.insertAdjacentHTML('afterbegin', icon('chevronDown', 20, 'ds-chevron'));

  // A drawer group that closes keeps its state across loads.
  for (const group of $$('details.ds-drawer__group[id]', nav)) {
    if (stored(`ex-${group.id}`) === 'closed') group.open = false;
    group.addEventListener('toggle', () => store(`ex-${group.id}`, group.open ? 'open' : 'closed'));
  }

  DS.ripple.attach(document);
  DS.overlay.tooltips(document);
  DS.indicator.createIndicator(nav, { active: '[aria-current="page"]', className: 'ds-drawer__indicator' });
  /* data-scrolled from a 1px sentinel (DS.dom.watchScrolled, docs/components.md, App frame). */
  DS.dom.watchScrolled(view);

  menuButton.addEventListener('click', () => {
    if (app.hasAttribute('data-drawer-open')) DS.overlay.close(drawer);
    else DS.overlay.open(drawer, { opener: menuButton });
  });

  // Links to a route ("#/devices") navigate in place; every other link loads.
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#/"]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    go(link.getAttribute('href'));
  });
  window.addEventListener('popstate', () => go(location.hash, { push: false }));

  function toggleMenu(trigger) {
    if (trigger.getAttribute('aria-expanded') === 'true') {
      DS.overlay.close(rowMenu);
      return;
    }
    state.menuFor = trigger.getAttribute('data-menu');
    DS.overlay.open(rowMenu, { opener: trigger });
  }

  page.addEventListener('click', (event) => {
    const target = event.target;
    const hit = (selector) => target.closest(selector);
    let element;
    if ((element = hit('[data-device]'))) openSheet(element.getAttribute('data-device'), element);
    else if ((element = hit('[data-menu]'))) toggleMenu(element);
    else if ((element = hit('[data-page]'))) {
      // A blocked end (aria-disabled) does nothing; its tooltip says why.
      if (element.getAttribute('aria-disabled') === 'true') return;
      const to = element.getAttribute('data-page');
      const last = pageCount() - 1;
      state.page = to === 'first' ? 0 : to === 'previous' ? Math.max(0, state.page - 1) : to === 'next' ? Math.min(last, state.page + 1) : last;
      renderRows();
    } else if ((element = hit('[data-sort]'))) {
      const key = element.getAttribute('data-sort');
      state.sort = { key, dir: state.sort.key === key && state.sort.dir === 'ascending' ? 'descending' : 'ascending' };
      state.page = 0;
      renderRows();
    } else if ((element = hit('[data-dismiss]'))) {
      state.dismissed.add(element.getAttribute('data-dismiss'));
      updateAlerts(false);
    } else if ((element = hit('[data-toggle-ticket]'))) {
      const id = Number(element.getAttribute('data-toggle-ticket'));
      const open = element.getAttribute('aria-expanded') !== 'true';
      if (open) state.expanded.add(id);
      else state.expanded.delete(id);
      element.setAttribute('aria-expanded', String(open));
      document.getElementById(`t-${id}-detail`).inert = !open;
    } else if ((element = hit('[data-close-ticket]'))) {
      const id = Number(element.getAttribute('data-close-ticket'));
      M.busy(element, () => api.closeTicket(id)).then(() => {
        state.tickets.find((ticket) => ticket.id === id).status = 'closed';
        state.expanded.delete(id);
        $('h1', page).focus({ preventScroll: true });
        renderTickets();
        DS.overlay.toast(toasts, `Ticket #${id} closed.`);
      });
    } else if ((element = hit('#sync-run'))) runSync(element);
    else if ((element = hit('[data-act]'))) {
      const act = element.getAttribute('data-act');
      if (act === 'refresh') refreshDevices();
      if (act === 'new-ticket') openTicketDialog(element);
      if (act === 'delete-selected') confirmDelete([...state.selected], element);
      if (act === 'clear-selection') {
        state.selected.clear();
        // The bar goes: focus to the header checkbox.
        $('#select-all').focus();
        syncSelection();
      }
      if (act === 'clear-filters') {
        state.query = '';
        state.type = 'all';
        state.statuses.clear();
        $('#q').value = '';
        $('#f-type').value = 'all';
        for (const box of $$('#status-chips input')) box.checked = false;
        state.page = 0;
        renderRows();
        $('#q').focus();
      }
      if (act === 'copy-key') {
        const swap = $('.ds-icon-swap', element);
        if (navigator.clipboard) navigator.clipboard.writeText($('#api-key').value).catch(() => {});
        swap.setAttribute('data-swap', 'b');
        DS.overlay.toast(toasts, 'Key copied.');
        setTimeout(() => swap.setAttribute('data-swap', 'a'), M.motionDuration(swap, '--ds-hold-success'));
      }
    }
  });

  page.addEventListener('keydown', (event) => {
    const trigger = event.target.closest('[data-menu]');
    if (!trigger || (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')) return;
    event.preventDefault();
    state.menuFor = trigger.getAttribute('data-menu');
    DS.overlay.open(rowMenu, { opener: trigger });
  });

  // Search filters per keystroke: flip() continues from where each row is.
  page.addEventListener('input', (event) => {
    if (event.target.id !== 'q') return;
    state.query = event.target.value;
    state.page = 0;
    renderRows();
  });

  page.addEventListener('change', (event) => {
    const target = event.target;
    if (target.id === 'page-size') {
      state.pageSize = Number(target.value);
      state.page = 0;
      renderRows();
    } else if (target.id === 'f-type') {
      state.type = target.value;
      state.page = 0;
      renderRows();
    } else if (target.name === 'status') {
      if (target.checked) state.statuses.add(target.value);
      else state.statuses.delete(target.value);
      state.page = 0;
      renderRows();
    } else if (target.id === 'select-all') {
      for (const device of pageDevices()) {
        if (target.checked) state.selected.add(device.id);
        else state.selected.delete(device.id);
      }
      syncSelection();
    } else if (target.hasAttribute('data-select')) {
      const id = target.getAttribute('data-select');
      if (target.checked) state.selected.add(id);
      else state.selected.delete(id);
      syncSelection();
    } else if (target.name === 'ticket-filter') {
      state.ticketFilter = target.value;
      renderTickets();
    } else if (target.name === 'accent') {
      // A theme is tokens on .ds-theme: switching it is one attribute.
      if (target.value === 'default') document.documentElement.removeAttribute('data-ex-accent');
      else document.documentElement.setAttribute('data-ex-accent', target.value);
      store('ex-accent', target.value === 'default' ? '' : target.value);
    } else if (target.name === 'appearance') {
      // Dark is the shipped theme on a link of its own: the choice sets its media.
      store('ex-appearance', target.value === 'system' ? '' : target.value);
      applyAppearance(target.value);
    } else if (target.hasAttribute('data-setting')) {
      const setting = target.getAttribute('data-setting');
      const on = target.checked;
      if (setting === 'dense') {
        state.dense = on;
        store('ex-dense', on ? '1' : '0');
      } else if (setting === 'offline') {
        // The fake backend stops answering; the next poll (at once) shows the banner.
        state.offline = on;
        api.setOnline(!on);
        poll();
      } else {
        state.settings[setting] = on;
        api.saveSettings({ [setting]: on });
      }
      const label = target.closest('.ds-switch').querySelector('.ds-switch__label').textContent;
      DS.overlay.toast(toasts, `${label}: ${on ? 'on' : 'off'}.`);
    }
  });

  page.addEventListener('submit', async (event) => {
    if (event.target.id !== 'org-form') return;
    event.preventDefault();
    const form = event.target;
    const name = $('#org-name', form);
    const contact = $('#org-contact', form);
    const bad = [
      setError(name, name.value.trim() ? '' : 'Enter a name.') && name,
      setError(contact, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.value.trim()) ? '' : 'Enter an email address like it@example.org.') && contact,
    ].filter(Boolean);
    if (bad.length) {
      bad[0].focus();
      return;
    }
    const values = Object.fromEntries(new FormData(form));
    state.settings = await M.busy(event.submitter || $('[type="submit"]', form), () => api.saveSettings(values));
    state.savedAt = Date.now();
    $('#org-saved').textContent = `Last saved today, ${clock(state.savedAt)}`;
    DS.overlay.toast(toasts, 'Organisation saved.');
  });

  page.addEventListener('reset', (event) => {
    for (const input of $$('[aria-invalid]', event.target)) setError(input, '');
  });

  // An error message goes once the field is corrected.
  document.addEventListener('input', (event) => {
    const input = event.target;
    if (input.getAttribute && input.getAttribute('aria-invalid') === 'true') setError(input, '');
  });

  rowMenu.addEventListener('click', (event) => {
    const item = event.target.closest('[data-action]');
    const device = byId(state.menuFor);
    if (!item || !device) return;
    const action = item.getAttribute('data-action');
    const trigger = $(`[data-menu="${device.id}"]`, page);
    if (action === 'open') openSheet(device.id, trigger);
    if (action === 'ticket') openTicketDialog(trigger, device.id);
    if (action === 'restart') restart(device.id);
    if (action === 'delete') confirmDelete([device.id], trigger);
  });

  $('#sheet-prev').addEventListener('click', () => stepSheet(-1));
  $('#sheet-next').addEventListener('click', () => stepSheet(1));
  sheetBody.addEventListener('click', (event) => {
    const tab = event.target.closest('[role="tab"]');
    if (tab) selectSheetTab(tab.getAttribute('data-tab'));
    const button = event.target.closest('[data-sheet]');
    if (!button) return;
    if (button.getAttribute('data-sheet') === 'restart') restart(state.sheetId, button);
    if (button.getAttribute('data-sheet') === 'ticket') openTicketDialog(button, state.sheetId);
  });

  // Arrow keys, Home and End move between the tabs and select (automatic
  // activation: DS.dom.roving() clicks the tab, the click handler above
  // selects it). Delegated on the body, so the re-rendered tabs keep it.
  DS.dom.roving(sheetBody, { items: '[role="tab"]' });

  ticketForm.addEventListener('submit', (event) => {
    event.preventDefault();
    createTicket(event.submitter || $('[type="submit"]', ticketForm));
  });

  /* ── Start ────────────────────────────────────────────────────────── */

  (async function start() {
    const skeleton = $('.ds-skeleton', page);
    const startedAt = Date.now();
    const data = await api.load();
    await M.settleLoader(startedAt, { element: skeleton });
    Object.assign(state, { devices: data.devices, tickets: data.tickets, activity: data.activity, checkins: data.checkins, settings: data.settings });
    const { route, params } = parse(location.hash);
    applyParams(route, params);
    state.route = route;
    renderView();
    if (VIEWS[route].after) VIEWS[route].after();
    M.staggerOnce(page);
    document.documentElement.setAttribute('data-ex-ready', '');
    if (new URLSearchParams(location.search).get('live') !== '0') setInterval(poll, 5000);
  }());
}());
