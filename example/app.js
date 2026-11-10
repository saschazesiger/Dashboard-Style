/*
 * The reference app: a small device console built on Z-Dash 3.0
 * the way a project uses it. Every pattern follows docs/components.md and
 * docs/motion.md; README.md in this folder maps each one to its place.
 *
 *   frame        DS.shell (data-ds-shell: the menu button, the rail, the
 *                modal drawer, the drawer's pill and remembered groups),
 *                hash routes through DS.motion.transition(), the command
 *                palette (Ctrl+K), the notification centre (the bell), the
 *                account menu with the theme switch, a banner while the
 *                backend is offline, snackbars and progress toasts
 *   Overview     the time range with refresh and an auto interval, charts
 *                (DS.chart) that morph to new data, tiles that count on,
 *                alerts that come and go, a sync in a progress toast, the
 *                feed as a timeline, open tickets in a row list
 *   Devices      saved views (DS.views), the filter bar (DS.filterbar), the
 *                data grid (DS.datagrid: sort, selection with the bar, the
 *                column chooser, the row menu, paging, CSV)
 *   Device       the object page (DS.object): a sticky head that condenses,
 *                jump links, a section that edits in place with a date
 *                picker, the device's load as a chart
 *   Tickets      facets beside a data grid with expandable rows; a dialog
 *                with a combobox and a date picker
 *   Settings     switches that apply at once, the accent as a theme preset,
 *                the appearance, a form that waits in the save bar
 *
 * A classic script on top of the project bundle (ds/ds.bundle.js, which
 * sets window.DS with only the modules this app uses) and data.js
 * (window.ExampleApi), so it runs from disk. Re-renders go through
 * DS.dom.morphHtml, never innerHTML; listeners are delegated once to stable
 * containers. ?live=0 stops the polling (test/browser/example.spec.js).
 */
(function () {
  'use strict';

  const DS = window.DS;
  const M = DS.motion;
  const api = window.ExampleApi;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = (text) => String(text ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  // Every glyph name this helper draws from a variable is listed in "icons" of ds.config.json.
  const icon = (name, size = 20, className) => DS.icons.icon(DS.icons[name], size, className);

  const app = $('#app');
  const view = $('#main');
  const page = $('#page');
  const drawer = $('#drawer');
  const nav = $('#nav');
  const toasts = $('#toasts');
  const ticketDialog = $('#ticket-dialog');
  const ticketForm = $('#ticket-form');
  const rowMenu = $('#row-menu');
  const prefs = DS.store.open('example');
  // Edits of the organisation form wait here; hiding it from Discard puts the focus on the first field.
  const savebar = DS.overlay.savebar($('#savebar'), { focusTarget: () => $('#org-name', page) });

  /* ── State ────────────────────────────────────────────────────────── */

  // Status chips: always an icon (or the spinner) and a word; the tone class is written out for the bundle's scan.
  const STATUS = {
    error: { glyph: 'wifiOff', label: 'Offline', rank: 0, chip: 'ds-status ds-tone-error' },
    warning: { glyph: 'alert', label: 'Update due', rank: 1, chip: 'ds-status ds-tone-warning' },
    running: { glyph: null, label: 'Syncing', rank: 2, chip: 'ds-status ds-status--running' },
    ok: { glyph: 'check', label: 'OK', rank: 3, chip: 'ds-status ds-tone-success' },
  };
  const TYPES = { laptop: 'Laptop', desktop: 'Desktop', tablet: 'Tablet', printer: 'Printer' };
  const TICKET_STATUS = {
    open: { glyph: 'clock', label: 'Open', chip: 'ds-status' },
    waiting: { glyph: 'history', label: 'Waiting', chip: 'ds-status ds-tone-info' },
    closed: { glyph: 'check', label: 'Closed', chip: 'ds-status ds-tone-success' },
  };
  const PRIORITY = { high: 'High', normal: 'Normal', low: 'Low' };
  const PLACES = ['Building A, ground floor', 'Building A, 1st floor', 'Building A, 2nd floor', 'Building B, lab',
    'Building B, 2nd floor', 'Building C, 3rd floor', 'Remote'];

  const state = {
    devices: [],
    tickets: [],
    activity: [],
    checkins: [],
    settings: {},
    route: 'overview',
    id: null,
    params: new URLSearchParams(),
    dismissed: new Set(),
    sync: { running: false, finished: null, summary: null },
    back: null,
    offline: false,
    dense: prefs.get('dense', false),
    savedAt: null,
  };

  const byId = (id) => state.devices.find((device) => device.id === id);
  const ticketById = (id) => state.tickets.find((ticket) => ticket.id === id);
  const openTickets = () => state.tickets.filter((ticket) => ticket.status !== 'closed');

  /* ── Formatting ───────────────────────────────────────────────────── */

  const plural = (count, one, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;
  const iso = (time) => new Date(time).toISOString();
  const clock = (time) => DS.format.absolute(time, { timeStyle: 'short' });
  const day = (value) => (value ? DS.format.absolute(`${value}T12:00:00`, { dateStyle: 'medium' }) : '');

  /* A relative time that stays current (DS.format, data-ds-time); the text in the markup is the first one. */
  function timeHtml(time) {
    return `<time data-ds-time data-ds-time-smallest="minute" datetime="${iso(time)}">${esc(DS.format.relative(time, { smallest: 'minute' }))}</time>`;
  }

  /* The same time in a grid cell: the text alone. The rows render again on every poll and every sort, so a ticking
     controller per cell would cost more than it gives. */
  function cellTimeHtml(time) {
    return `<time datetime="${iso(time)}">${esc(DS.format.relative(time, { smallest: 'minute' }))}</time>`;
  }

  function statusHtml(kind) {
    const s = STATUS[kind];
    const mark = s.glyph ? icon(s.glyph, 16) : '<span class="ds-spinner ds-status__spinner" aria-hidden="true"></span>';
    return `<span class="${s.chip}">${mark}<span>${s.label}</span></span>`;
  }

  function ticketStatusHtml(kind) {
    const s = TICKET_STATUS[kind];
    return `<span class="${s.chip}">${icon(s.glyph, 16)}<span>${s.label}</span></span>`;
  }

  function priorityHtml(priority) {
    return priority === 'high' ? `<span class="ds-status ds-tone-warning">${icon('flag', 16)}<span>High</span></span>` : PRIORITY[priority];
  }

  /* A button with the busy and done faces of DS.motion.busy(). */
  function facesButton(className, label, busyLabel, doneLabel, attributes = '', glyph = '') {
    return `<button class="${className}"${attributes.includes('type=') ? '' : ' type="button"'} ${attributes}><span class="ds-btn__faces">` +
      `<span class="ds-btn__face">${glyph ? icon(glyph, 18) : ''}${label}</span>` +
      `<span class="ds-btn__face ds-btn__face--busy" aria-hidden="true"><span class="ds-spinner ds-spinner--ink ds-sm"></span>${busyLabel}</span>` +
      `<span class="ds-btn__face ds-btn__face--done" aria-hidden="true">${icon('check', 16)}${doneLabel}</span></span></button>`;
  }

  /* The page head: the way back (a view opened from a link of the overview), the title and lead, the actions. */
  function head(title, lead, actions = '', back = null) {
    return '<header class="ds-page-head" data-ds-page-head>' +
      (back ? `<a class="ds-btn ds-btn--text ds-sm ds-page-head__back" href="${back.href}">${icon('arrowLeft', 18)}<span class="ds-sr">Back to </span>${back.label}</a>` : '') +
      `<div class="ds-page-head__row"><div class="ds-page-head__text"><h1 class="ds-page-head__title" tabindex="-1">${title}</h1>` +
      `<p class="ds-page-head__lead">${lead}</p></div>${actions ? `<div class="ds-page-head__actions">${actions}</div>` : ''}</div></header>`;
  }

  function counts() {
    const result = { total: state.devices.length, ok: 0, warning: 0, error: 0, running: 0 };
    for (const device of state.devices) result[device.status] += 1;
    return result;
  }

  /* What a view mounts (grids, charts, panels) goes when the view does. */
  let mounted = [];
  function keep(controller) {
    if (controller) mounted.push(controller);
    return controller;
  }

  /* ── Overview ─────────────────────────────────────────────────────── */

  const TILES = [
    { key: 'total', glyph: 'laptop', label: 'Devices', href: '#/devices', value: (c) => c.total,
      note: () => Object.keys(TYPES).slice(0, 2).map((type) => `${state.devices.filter((d) => d.type === type).length} ${TYPES[type].toLowerCase()}s`).join(', ') },
    { key: 'online', glyph: 'wifi', label: 'Online', href: '#/devices?view=online', value: (c) => c.ok + c.running,
      note: (c) => `${c.total ? Math.round(((c.ok + c.running) / c.total) * 100) : 0}% of the fleet` },
    { key: 'warning', glyph: 'alert', label: 'Update due', href: '#/devices?view=update', value: (c) => c.warning,
      note: () => 'Release 24.2 is out' },
    { key: 'error', glyph: 'wifiOff', label: 'Offline', href: '#/devices?view=offline', value: (c) => c.error,
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
      list.push(`<div class="ds-alert ds-tone-error" data-ds-key="alert-offline">${icon('alertCircle', 20)}<span class="ds-alert__text">${plural(c.error, 'device is', 'devices are')} offline.</span>` +
        '<a class="ds-btn ds-btn--text ds-sm" href="#/devices?view=offline">Show</a></div>');
    }
    if (!state.dismissed.has('sync')) {
      list.push(`<div class="ds-alert" data-ds-key="alert-sync">${icon('info', 20)}<span class="ds-alert__text">The nightly sync runs at 02:00. Run it now from the Sync card or the command palette.</span>` +
        '<button class="ds-btn ds-btn--text ds-sm" type="button" data-dismiss="sync">Dismiss</button></div>');
    }
    return list.join('');
  }

  /* The feed as a timeline with icon markers, newest first. */
  function activityHtml() {
    return state.activity.slice(-6).reverse().map((entry) =>
      `<li class="ds-timeline__item ds-timeline__item--icon" data-ds-key="${entry.id}"><span class="ds-timeline__marker" aria-hidden="true">${icon(entry.glyph, 16)}</span>` +
      `<div class="ds-timeline__head"><p class="ds-timeline__title">${esc(entry.text)}</p></div>` +
      `<p class="ds-timeline__meta">${timeHtml(entry.at)}</p></li>`).join('');
  }

  /* Open tickets as a row list: each row opens its ticket. */
  function openTicketsHtml() {
    const open = openTickets();
    if (!open.length) return '<p class="ds-muted">No open tickets.</p>';
    return '<ul class="ds-list ds-list--interactive" aria-label="Open tickets">' + open.slice(0, 4).map((ticket) =>
      `<li class="ds-list__item" data-ds-key="t${ticket.id}">${icon('ticket', 20, 'ds-list__icon')}` +
      `<span class="ds-list__text"><span class="ds-list__title"><a class="ds-list__action" href="#/tickets?open=${ticket.id}">${esc(ticket.subject)}</a></span>` +
      `<span class="ds-list__meta">#${ticket.id} · ${esc(byId(ticket.device)?.name ?? 'Removed device')}</span></span>` +
      (ticket.priority === 'high' ? priorityHtml('high') : '') +
      `${icon('chevronRight', 20, 'ds-list__chevron')}</li>`).join('') + '</ul>';
  }

  function syncSummaryHtml() {
    const { finished, summary } = state.sync;
    if (!finished) return '<p class="ds-meta" id="sync-last">Last run tonight at 02:00.</p>';
    return `<p class="ds-meta" id="sync-last">Last run today, ${esc(clock(finished))}: <span class="ds-parts"><span class="ds-parts__list">${summary.map((part) => `<span>${part}</span>`).join('')}</span></span></p>`;
  }

  /* The time range: the address carries it (#/overview?from=now-6h&to=now&refresh=30s). */
  function rangeAttributes() {
    const from = state.params.get('from') || 'now-24h';
    const to = state.params.get('to') || 'now';
    const refresh = state.params.get('refresh') || '';
    return `data-ds-timerange-from="${esc(from)}" data-ds-timerange-to="${esc(to)}" data-ds-timerange-refresh="${esc(refresh)}"`;
  }

  function overviewHtml() {
    const alerts = alertsHtml();
    return head('Overview', 'The fleet at a glance. Figures, alerts and the feed update live every few seconds.',
      `<div class="ds-timerange" id="overview-range" data-ds-timerange data-ds-timerange-store="example-overview" ${rangeAttributes()} aria-label="Time range of the charts"></div>`) +
      `<div class="ds-stack" id="alerts"${alerts ? '' : ' hidden'}>${alerts}</div>` +
      tilesHtml() +
      '<div class="ds-grid-2">' +
        '<section class="ds-card" aria-labelledby="fleet-title"><h2 class="ds-card__title" id="fleet-title">Devices that answered</h2>' +
          '<figure class="ds-chart" id="fleet-chart" aria-labelledby="fleet-title"><figcaption class="ds-sr">Devices that answered the poll over the chosen time range</figcaption></figure></section>' +
        '<section class="ds-card" aria-labelledby="checkins-title"><h2 class="ds-card__title" id="checkins-title">Check-ins this week</h2>' +
          '<figure class="ds-chart" id="checkins-chart" aria-labelledby="checkins-title"><figcaption class="ds-sr">Devices that reported at least once, per day</figcaption></figure></section>' +
      '</div>' +
      '<div class="ds-grid-2">' +
        '<section class="ds-card"><div class="ds-card__row"><h2 class="ds-card__title">Sync</h2>' +
          facesButton('ds-btn ds-sm', 'Run now', 'Running', 'Done', `id="sync-run"${state.sync.running ? ' aria-busy="true"' : ''}`) + '</div>' +
          '<p class="ds-muted">Every device reports its state, its system and its disks. The progress shows in a snackbar, so you can work on meanwhile.</p>' +
          syncSummaryHtml() +
        '</section>' +
        '<section class="ds-card"><h2 class="ds-card__title">Open tickets</h2>' +
          `<div id="open-tickets">${openTicketsHtml()}</div>` +
          `<nav class="ds-card__links" aria-label="Tickets"><a class="ds-btn ds-btn--text ds-card__link" href="#/tickets">All tickets ${icon('arrowRight', 16)}</a></nav>` +
        '</section>' +
      '</div>' +
      `<section class="ds-card"><h2 class="ds-card__title">Recent activity</h2><ol class="ds-timeline" id="activity" role="list" aria-label="Recent activity">${activityHtml()}</ol></section>`;
  }

  let fleetChart = null;
  let metricsRun = 0;

  /* The charts after the view's render: the range's figures load at once; every ds:refresh of the range loads them
     again. `defer` (the first render): the charts, below the fold on a phone, are returned to run in the next task,
     the second one in a task after that. */
  function mountOverview(defer) {
    const range = keep(DS.timerange.create($('#overview-range', page)));
    const at = renders;
    const charts = () => {
      if (at !== renders) return;
      fleetChart = keep(DS.chart.create($('#fleet-chart', page), {
        type: 'area', labels: [], series: [{ name: 'Devices', values: [] }], curve: 'monotone', legend: false,
        y: { label: 'Devices' }, x: { format: { hour: '2-digit', minute: '2-digit' } },
      }));
      loadMetrics(range.resolve());
      // At the start the second chart takes a task of its own.
      if (defer) setTimeout(checkins, 0);
      else checkins();
    };
    const checkins = () => {
      if (at !== renders) return;
      keep(DS.chart.create($('#checkins-chart', page), {
        type: 'column', labels: state.checkins.map(([label]) => label), legend: false,
        series: [{ name: 'Check-ins', values: state.checkins.map(([, value]) => value) }],
      }));
    };
    if (defer) return charts;
    charts();
    return null;
  }

  /* Loads the range's figures; a newer load wins. The chart morphs to them. */
  async function loadMetrics({ start, end }) {
    const run = ++metricsRun;
    let data;
    try {
      data = await api.metrics({ start, end });
    } catch (error) {
      return;
    }
    if (run !== metricsRun || !fleetChart || !$('#fleet-chart', page)) return;
    const total = state.devices.length;
    fleetChart.set({
      labels: data.labels,
      series: [{ name: 'Devices', values: data.answered }],
      thresholds: [{ value: Math.round(total * 0.9), label: '90% of the fleet', tone: 'warning' }],
    });
  }

  /* ── Devices: saved views, the filter bar and the data grid ───────── */

  const STATUS_FILTERS = [['online', 'Online (OK or syncing)'], ['ok', 'OK'], ['running', 'Syncing'], ['warning', 'Update due'], ['error', 'Offline']];
  const HIDEABLE = ['model', 'owner', 'location', 'type', 'lastSeen', 'status'];
  const DEFAULT_COLUMNS = ['model', 'owner', 'lastSeen', 'status'];

  /* The built-in views of the device list: their state as a query string (DS.views.toQuery). */
  const VIEWS = [
    ['all', 'All devices', 'sort=name', true],
    ['online', 'Online', 'status=online&sort=name'],
    ['offline', 'Offline', 'status=error&sort=lastSeen&cols=model,owner,location,lastSeen,status'],
    ['update', 'Update due', 'status=warning&sort=type,name&cols=model,owner,type,status'],
    ['laptops', 'Laptops', 'type=laptop&sort=owner&cols=model,owner,location,status'],
  ];

  function viewsHtml() {
    const item = ([id, label, query, isDefault]) => `<button class="ds-menu__item" role="menuitemradio" aria-checked="false" type="button" data-ds-view="${id}" data-ds-view-state="${esc(query)}"${isDefault ? ' data-ds-view-default' : ''}>` +
      `${icon('check', 20, 'ds-menu__check')}<span class="ds-menu__label">${label}</span></button>`;
    const action = (kind, svg, label, danger) => `<button class="${danger ? 'ds-menu__item ds-menu__item--danger' : 'ds-menu__item'}" role="menuitem" type="button" data-ds-views-action="${kind}">` +
      `${svg}<span class="ds-menu__label">${label}</span></button>`;
    return '<div class="ds-views" id="devices-views" data-ds-views data-ds-views-key="devices" data-ds-views-url="off">' +
      `<button class="ds-btn ds-views__trigger" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="views-menu" data-ds-open="#views-menu">${icon('layers', 20)}` +
      `<span class="ds-sr">View: </span><span class="ds-views__name">All devices</span><span class="ds-views__edited" hidden>Edited</span>${icon('chevronDown', 20, 'ds-views__chevron')}</button>` +
      '<button class="ds-btn ds-btn--text ds-views__save" type="button" hidden>Save view</button>' +
      '<div class="ds-menu" id="views-menu" role="menu" aria-label="Views" hidden>' +
        `<div class="ds-views__list" role="group" aria-label="Views">${VIEWS.map(item).join('')}</div>` +
        '<div class="ds-menu__divider" role="separator"></div>' +
        action('save', icon('save', 20), 'Save changes') + action('create', icon('plus', 20), 'Save as new view …') + action('rename', icon('pencil', 20), 'Rename …') +
        action('default', icon('star', 20), 'Make default') +
        `<button class="ds-menu__item" role="menuitem" type="button" data-act="copy-link">${icon('link', 20)}<span class="ds-menu__label">Copy link</span></button>` +
        '<div class="ds-menu__divider" role="separator"></div>' + action('delete', icon('trash', 20), 'Delete view', true) +
      '</div></div>';
  }

  function filterbarHtml() {
    const options = (list) => list.map(([value, label]) => `<option value="${value}">${esc(label)}</option>`).join('');
    return '<div class="ds-filterbar" id="devices-filters" data-ds-filterbar data-ds-filterbar-sheet="#filters-sheet" role="search" aria-label="Filter devices">' +
      '<div class="ds-filterbar__row">' +
        `<div class="ds-search ds-filterbar__search">${icon('search', 20)}<input class="ds-input" type="search" name="q" aria-label="Search devices" placeholder="Search name, owner, serial" autocomplete="off"></div>` +
        '<div class="ds-filterbar__filters">' +
          `<div class="ds-field"><label class="ds-field__label" for="f-status">Status</label><select class="ds-input" id="f-status" name="status"><option value="">Any</option>${options(STATUS_FILTERS)}</select></div>` +
          `<div class="ds-field"><label class="ds-field__label" for="f-type">Type</label><select class="ds-input" id="f-type" name="type"><option value="">Any</option>${options(Object.entries(TYPES))}</select></div>` +
          `<div class="ds-field"><label class="ds-field__label" for="f-location">Location</label><select class="ds-input" id="f-location" name="location"><option value="">Any</option>${options(PLACES.map((place) => [place, place]))}</select></div>` +
        '</div>' +
        `<button class="ds-btn ds-filterbar__more" type="button" aria-haspopup="dialog">${icon('filter', 20)}Filters<span class="ds-badge ds-filterbar__badge" hidden></span></button>` +
        '<p class="ds-filterbar__count"></p>' +
      '</div>' +
      '<div class="ds-filterbar__applied" hidden><div class="ds-chips ds-filterbar__chips" role="group" aria-label="Applied filters"></div>' +
        '<button class="ds-btn ds-btn--text ds-filterbar__clear" type="button">Clear all</button></div>' +
    '</div>';
  }

  /* Rows per page: 25 at a desk, 10 on a phone, where the view scrolls and every row costs a slow device. */
  const pageSize = () => (matchMedia('(max-width: 600px)').matches ? 10 : 25);

  function pagerHtml() {
    const button = (to, label, svg) => `<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="${label}" data-tip="${label}" data-ds-datagrid-page="${to}">${svg}</button>`;
    return '<nav class="ds-pagination" id="devices-pages" aria-label="Pages of devices">' +
      '<div class="ds-pagination__size"><label class="ds-pagination__label" for="devices-size">Rows per page</label>' +
      `<select class="ds-input ds-input--filled" id="devices-size" data-ds-datagrid-size>${[10, 25, 50, 100].map((size) => `<option${size === pageSize() ? ' selected' : ''}>${size}</option>`).join('')}</select></div>` +
      '<p class="ds-pagination__range" aria-live="polite"></p>' +
      button('first', 'First page', icon('chevronFirst', 20)) + button('previous', 'Previous page', icon('chevronLeft', 20)) +
      button('next', 'Next page', icon('chevronRight', 20)) + button('last', 'Last page', icon('chevronLast', 20)) + '</nav>';
  }

  function devicesHtml() {
    const dense = state.dense ? ' ds-density-dense' : '';
    return head('Devices', 'Every laptop, desktop, tablet and printer. The status updates live; a row opens its device.',
      `<button class="ds-btn" type="button" data-act="refresh">${icon('sync', 18)}Refresh</button>`, state.back) +
      '<section class="ds-card" id="devices-card" aria-label="Views and filters">' +
        viewsHtml() + filterbarHtml() +
        '<div class="ds-toolbar"><div class="ds-swap">' +
          '<div class="ds-action-bar">' +
            `<button class="ds-btn ds-btn--quiet" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="devices-columns" data-ds-open="#devices-columns">${icon('columns', 18)}Columns</button>` +
            `<button class="ds-btn ds-btn--quiet" type="button" data-ds-datagrid-command="csv" aria-controls="devices-grid" data-ds-datagrid-file="devices.csv">${icon('download', 18)}Export CSV</button>` +
          '</div>' +
          '<div class="ds-selection-bar" id="devices-bar" role="toolbar" aria-label="Selected devices" hidden>' +
            `<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Clear selection" data-tip="Clear selection" data-ds-datagrid-command="clear" aria-controls="devices-grid">${icon('close', 20)}</button>` +
            '<p class="ds-selection-bar__count" aria-live="polite"></p>' +
            `<div class="ds-selection-bar__actions"><button class="ds-btn ds-btn--text" type="button" data-act="restart-selected">${icon('sync', 18)}Restart</button>` +
            `<button class="ds-btn ds-btn--text" type="button" data-act="delete-selected">${icon('trash', 18)}Delete</button></div>` +
          '</div>' +
        '</div></div>' +
        '<div class="ds-menu" role="menu" id="devices-columns" aria-label="Columns" hidden></div>' +
      '</section>' +
      // The last child of the page: in a .ds-view--fill it takes what is left of the view.
      `<div class="ex-list${dense}" id="devices-list">` +
        '<div class="ds-table-wrap ds-table-wrap--fill"><table class="ds-table ds-datagrid ds-table--interactive ds-table--pin-last" id="devices-grid" aria-label="Devices"></table></div>' +
        pagerHtml() +
      '</div>';
  }

  /* Whether a device passes the filters of the bar ({ q: ['fan'], status: ['error'] ... }). */
  function passes(device, filters) {
    const query = (filters.q?.[0] ?? '').trim().toLowerCase();
    const status = filters.status?.[0];
    if (status === 'online' ? device.status !== 'ok' && device.status !== 'running' : status && device.status !== status) return false;
    if (filters.type?.[0] && device.type !== filters.type[0]) return false;
    if (filters.location?.[0] && device.location !== filters.location[0]) return false;
    return !query || [device.name, device.model, device.owner, device.location, device.serial].some((text) => text.toLowerCase().includes(query));
  }

  const sortText = (sort) => sort.map((entry) => `${entry.dir === 'descending' ? '-' : ''}${entry.key}`).join(',');
  const sortList = (text) => String(text || 'name').split(',').filter(Boolean).map((part) => ({ key: part.replace(/^-/, ''), dir: part.startsWith('-') ? 'descending' : 'ascending' }));

  let devices = null;

  function deviceColumns() {
    return [
      { key: 'name', label: 'Device', sortable: true, hideable: false, className: 'ds-nowrap',
        render: (row) => `<a class="ds-link-btn ds-table__row-link" href="#/devices/${esc(row.id)}">${esc(row.name)}</a>` },
      { key: 'model', label: 'Model', sortable: true, className: 'ds-nowrap ds-col--secondary' },
      { key: 'owner', label: 'Owner', sortable: true, className: 'ds-nowrap ds-col--secondary' },
      { key: 'location', label: 'Location', sortable: true, hidden: true, className: 'ds-nowrap ds-col--secondary' },
      { key: 'type', label: 'Type', sortable: true, hidden: true, format: (value) => TYPES[value] ?? '' },
      // Live values change width: these columns keep theirs (app.css), so nothing shifts sideways.
      // On a phone Last seen steps aside (the device page has it).
      { key: 'lastSeen', label: 'Last seen', type: 'date', sortable: true, className: 'ds-nowrap ds-col--secondary ex-col-time', filterable: false,
        value: (row) => new Date(row.lastSeen), render: (row) => cellTimeHtml(row.lastSeen) },
      { key: 'status', label: 'Status', sortable: true, className: 'ex-col-status', filterable: false,
        sortValue: (row) => STATUS[row.status].rank, render: (row) => statusHtml(row.status), exportValue: (row) => STATUS[row.status].label },
    ];
  }

  function mountDevices() {
    const bar = keep(DS.filterbar.create($('#devices-filters', page)));
    const views = keep(DS.views.create($('#devices-views', page)));
    // The first state: a view the address names, else filters it carries (an edited view), else the default view.
    // The grid starts in it (one render, no glide); later changes go through set().
    const named = state.params.get('view');
    const given = DS.views.fromQuery(state.params)?.state;
    if (named) views.set(named);
    const first = !named && given ? given : views.get().state;
    bar.set(first.filters || {});
    const filters = bar.get();
    const shown = first.columns || DEFAULT_COLUMNS;
    const grid = keep(DS.datagrid.create($('#devices-grid', page), {
      columns: deviceColumns().map((column) => (HIDEABLE.includes(column.key) ? { ...column, hidden: !shown.includes(column.key) } : column)),
      rows: state.devices,
      filter: (row) => passes(row, filters),
      sort: sortList(first.sort),
      select: 'multiple',
      bar: $('#devices-bar', page),
      multiSort: true,
      chooser: $('#devices-columns', page),
      presets: [{ id: 'triage', label: 'Triage', columns: ['name', 'owner', 'lastSeen', 'status'] }],
      actions: (row) => `<span class="ds-hover-actions"><button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-label="Actions for ${esc(row.name)}" ` +
        `aria-haspopup="menu" aria-expanded="false" data-ds-datagrid-menu>${icon('moreVertical', 18)}</button></span>`,
      menu: rowMenu,
      page: { size: pageSize() },
      pager: $('#devices-pages', page),
      file: 'devices.csv',
      emptyText: 'No device matches. Try another search or clear the filters.',
    }));
    devices = { grid, bar, views };

    // The columns count only when they differ from the default set, as the built-in views write them.
    const current = () => {
      const columns = HIDEABLE.filter((key) => !grid.get().columns.hidden.includes(key));
      const now = { filters: bar.get(), sort: sortText(grid.get().sort) };
      return columns.join() === DEFAULT_COLUMNS.join() ? now : { ...now, columns };
    };
    const count = () => bar.count(grid.get().total, { one: '{count} device', other: '{count} devices' });
    const show = () => {
      const now = bar.get();
      grid.set({ filter: (row) => passes(row, now) });
      count();
    };
    // The address follows the list (the hash: this app's routes live there), so a link carries the view.
    const remember = () => {
      const now = current();
      views.set({ state: now });
      const query = DS.views.toQuery(now, { view: views.get().id });
      history.replaceState(history.state, '', `#/devices${query ? `?${query}` : ''}`);
    };
    // Another view: its state into the bar (which sends nothing) and the grid.
    const apply = (next) => {
      bar.set(next.filters || {});
      const columns = next.columns || DEFAULT_COLUMNS;
      grid.set({ sort: sortList(next.sort), columns: { hidden: HIDEABLE.filter((key) => !columns.includes(key)) } });
      show();
      remember();
    };
    count();
    remember();

    $('#devices-card', page).addEventListener('ds:view', (event) => apply(event.detail.state));
    bar.on('change', () => {
      show();
      remember();
    });
    grid.on('sort', remember);
    grid.on('columns', remember);
    $('#devices-grid', page).addEventListener('ds:action', (event) => rowAction(event.detail.action, event.detail.key));
  }

  /* After the data changed (a poll, a delete, a refresh): the same filters on the new rows. */
  function updateDevices() {
    if (!devices || !$('#devices-grid', page)) return;
    devices.grid.set({ rows: state.devices });
    devices.bar.count(devices.grid.get().total, { one: '{count} device', other: '{count} devices' });
  }

  function selectedIds() {
    const { selection } = devices.grid.get();
    if (!selection.all) return selection.keys;
    // "Select all N" selects every row that passes the filter, less the ones unchecked after it.
    const filters = devices.bar.get();
    return state.devices.filter((device) => passes(device, filters) && !selection.except.includes(device.id)).map((device) => device.id);
  }

  /* The refresh pattern: the grid's rows dim (.ds-stale) under the loading bar until the data is in. */
  async function refreshDevices() {
    state.devices = await M.refresh($('#devices-list', page), () => api.devices());
    updateDevices();
    DS.overlay.toast(toasts, 'Devices refreshed.');
  }

  function rowAction(action, id) {
    const device = byId(id);
    if (!device) return;
    if (action === 'open') go(`#/devices/${device.id}`);
    if (action === 'ticket') openTicketDialog(null, device.id);
    if (action === 'restart') restart([device.id]);
    if (action === 'delete') confirmDelete([device.id], null);
  }

  /* ── One device: the object page ─────────────────────────────────── */

  function deviceHeadStatusHtml(device) {
    return statusHtml(device.status);
  }

  function deviceDetailsHtml(device) {
    const detail = (label, value) => `<div class="ds-page-head__detail"><dt>${label}</dt><dd>${value}</dd></div>`;
    return detail('Owner', esc(device.owner)) + detail('Location', esc(device.location)) + detail('Last seen', timeHtml(device.lastSeen)) +
      detail('Warranty until', esc(day(device.warranty)));
  }

  function generalViewHtml(device) {
    return `<dl class="ds-facts ds-facts--rows"><div><dt>Owner</dt><dd>${esc(device.owner)}</dd></div>` +
      `<div><dt>Location</dt><dd>${esc(device.location)}</dd></div><div><dt>Warranty until</dt><dd>${esc(day(device.warranty))}</dd></div></dl>`;
  }

  function deviceTicketsHtml(device) {
    const list = state.tickets.filter((ticket) => ticket.device === device.id);
    if (!list.length) return '<p class="ds-muted">No tickets for this device.</p>';
    return '<ul class="ds-list ds-list--interactive" aria-label="Tickets of this device">' + list.map((ticket) =>
      `<li class="ds-list__item" data-ds-key="dt${ticket.id}">${icon('ticket', 20, 'ds-list__icon')}` +
      `<span class="ds-list__text"><span class="ds-list__title"><a class="ds-list__action" href="#/tickets?open=${ticket.id}">${esc(ticket.subject)}</a></span>` +
      `<span class="ds-list__meta">#${ticket.id} · opened ${timeHtml(ticket.opened)}</span></span>${ticketStatusHtml(ticket.status)}</li>`).join('') + '</ul>';
  }

  function deviceHistoryHtml(device) {
    const events = state.activity.filter((entry) => entry.text.includes(device.name)).slice(-8).reverse();
    if (!events.length) return '<p class="ds-muted">Nothing happened lately.</p>';
    return '<ol class="ds-timeline" role="list" aria-label="History of this device">' + events.map((entry) =>
      `<li class="ds-timeline__item ds-timeline__item--icon" data-ds-key="${entry.id}"><span class="ds-timeline__marker" aria-hidden="true">${icon(entry.glyph, 16)}</span>` +
      `<div class="ds-timeline__head"><p class="ds-timeline__title">${esc(entry.text)}</p></div><p class="ds-timeline__meta">${timeHtml(entry.at)}</p></li>`).join('') + '</ol>';
  }

  function section(id, title, body, form = '') {
    return `<section class="ds-card ds-object__section" id="${id}" aria-labelledby="${id}-title">` +
      `<div class="ds-object__head"><h2 class="ds-object__title" id="${id}-title">${title}</h2>` +
      (form ? `<button class="ds-btn ds-btn--text ds-sm ds-object__edit" type="button" data-ds-object-edit aria-describedby="${id}-title">Edit</button>` : '') +
      `</div><div class="ds-object__view">${body}</div>${form}</section>`;
  }

  function generalFormHtml(device) {
    const option = (value, current) => `<option${value === current ? ' selected' : ''}>${esc(value)}</option>`;
    const owners = [...new Set(state.devices.map((other) => other.owner))].sort();
    return '<form class="ds-form ds-object__form" id="general-form" novalidate hidden>' +
      '<div class="ds-form-grid ds-form-grid--2">' +
        `<div class="ds-field"><label class="ds-field__label" for="dev-owner">Owner</label><select class="ds-input" id="dev-owner" name="owner">${owners.map((owner) => option(owner, device.owner)).join('')}</select></div>` +
        `<div class="ds-field"><label class="ds-field__label" for="dev-location">Location</label><select class="ds-input" id="dev-location" name="location">${PLACES.map((place) => option(place, device.location)).join('')}</select></div>` +
        '<div class="ds-field"><span class="ds-field__label" id="dev-warranty-label">Warranty until</span>' +
          `<div class="ds-picker" id="dev-warranty" data-ds-datepicker-name="warranty" data-ds-value="${esc(device.warranty)}" data-ds-datepicker-min="${esc(device.bought)}">` +
          `<div class="ds-datefield" role="group" aria-labelledby="dev-warranty-label"><button class="ds-btn ds-btn--quiet ds-btn--icon ds-datefield__toggle" type="button" aria-label="Choose the warranty date">${icon('calendar', 20)}</button></div></div></div>` +
      '</div>' +
      '<div class="ds-form-actions"><button class="ds-btn" type="button" data-ds-object-cancel>Cancel</button>' +
        facesButton('ds-btn ds-btn--filled', 'Save', 'Saving', 'Saved', 'type="submit"') + '</div>' +
    '</form>';
  }

  function deviceHtml(device) {
    if (!device) {
      return head('Device not found', 'It may have been deleted.', '', { href: '#/devices', label: 'Devices' }) +
        `<div class="ds-empty"><span class="ds-empty__disc" aria-hidden="true">${icon('search', 24)}</span><p class="ds-empty__title">No such device</p>` +
        '<p class="ds-empty__text">It is not in the fleet any more.</p><a class="ds-btn ds-btn--tonal" href="#/devices">All devices</a></div>';
    }
    const fact = (label, value) => `<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`;
    return '<div class="ds-object" id="device-object" data-ds-object>' +
      '<header class="ds-page-head ds-page-head--sticky" data-ds-page-head>' +
        `<a class="ds-btn ds-btn--text ds-sm ds-page-head__back" href="#/devices">${icon('arrowLeft', 18)}<span class="ds-sr">Back to </span>Devices</a>` +
        '<div class="ds-page-head__row"><div class="ds-page-head__text">' +
          `<h1 class="ds-page-head__title" tabindex="-1">${esc(device.name)}</h1>` +
          `<p class="ds-page-head__lead">${esc(device.model)} · ${esc(TYPES[device.type])} · ${esc(device.system)}</p>` +
          `<div class="ds-page-head__status" id="device-status">${deviceHeadStatusHtml(device)}</div></div>` +
          '<div class="ds-page-head__actions">' +
            `<button class="ds-btn" type="button" data-act="delete-device">${icon('trash', 18)}Delete</button>` +
            `<button class="ds-btn" type="button" data-act="ticket-device">${icon('ticket', 18)}New ticket</button>` +
            facesButton('ds-btn ds-btn--filled', 'Restart', 'Restarting', 'Restarted', 'data-act="restart-device"', 'sync') +
          '</div></div>' +
        `<dl class="ds-page-head__details" id="device-details">${deviceDetailsHtml(device)}</dl>` +
      '</header>' +
      '<nav class="ds-toc ds-toc--bar ds-toc--sticky" aria-label="Sections" data-ds-toc data-ds-toc-hash="off"><ol class="ds-toc__list">' +
        [['general', 'General'], ['hardware', 'Hardware'], ['load', 'Load'], ['device-tickets', 'Tickets'], ['history', 'History']]
          .map(([id, label]) => `<li><a class="ds-toc__link" href="#${id}">${label}</a></li>`).join('') +
      '</ol></nav>' +
      section('general', 'General', generalViewHtml(device), generalFormHtml(device)) +
      section('hardware', 'Hardware', `<dl class="ds-facts ds-facts--rows">${fact('Model', device.model)}${fact('System', device.system)}${fact('Serial', device.serial)}` +
        `${fact('Address', device.address)}${fact('Bought', day(device.bought))}</dl>`) +
      section('load', 'Load, last 24 hours', '<figure class="ds-chart" id="load-chart"><figcaption class="ds-sr">Processor load per hour, last 24 hours</figcaption></figure>') +
      section('device-tickets', 'Tickets', `<div id="device-ticket-list">${deviceTicketsHtml(device)}</div>`) +
      section('history', 'History', `<div id="device-history">${deviceHistoryHtml(device)}</div>`) +
    '</div>';
  }

  function mountDevice() {
    const device = byId(state.id);
    if (!device) return;
    keep(DS.object.create($('#device-object', page)));
    const chart = keep(DS.chart.create($('#load-chart', page), {
      type: 'line', labels: [], series: [{ name: 'Load', values: [] }], legend: false, curve: 'monotone',
      y: { min: 0, max: 100, label: 'Load (%)' }, x: { format: { hour: '2-digit', minute: '2-digit' } },
      thresholds: [{ value: 80, label: 'High', tone: 'warning' }], format: { style: 'unit', unit: 'percent' },
    }));
    api.deviceLoad(device.id).then((data) => {
      if ($('#load-chart', page) && state.id === device.id) chart.set({ labels: data.labels, series: [{ name: 'Load', values: data.values }] });
    });
  }

  /* A live refresh of the record on screen: the values change in place, never with a transition. */
  function updateDevicePage() {
    const device = byId(state.id);
    if (!device || !$('#device-object', page)) return;
    DS.dom.morphHtml($('#device-status', page), deviceHeadStatusHtml(device));
    DS.dom.morphHtml($('#device-details', page), deviceDetailsHtml(device));
    DS.dom.morphHtml($('#device-history', page), deviceHistoryHtml(device));
  }

  /* ── Tickets: facets beside a data grid ───────────────────────────── */

  const FACETS = [
    ['status', 'Status', Object.entries(TICKET_STATUS).map(([value, s]) => [value, s.label])],
    ['priority', 'Priority', Object.entries(PRIORITY)],
    ['type', 'Device type', Object.entries(TYPES)],
  ];

  function ticketsHtml() {
    const checked = (key, value) => (key === 'status' && value !== 'closed' ? ' checked' : '');
    const facet = ([key, title, options]) => `<fieldset class="ds-facet"><legend class="ds-facet__title">${title}</legend><div class="ds-facet__options">` +
      options.map(([value, label]) => `<label class="ds-check"><input type="checkbox" name="${key}" value="${value}"${checked(key, value)}><span>${esc(label)}</span><span class="ds-check__count"></span></label>`).join('') +
      '</div></fieldset>';
    return head('Tickets', 'Problems reported for a device. A row opens in place; a new ticket opens a dialog.',
      `<button class="ds-btn ds-btn--filled" type="button" data-act="new-ticket">${icon('plus', 18)}New ticket</button>`, state.back) +
      '<div class="ds-facets-layout">' +
        '<section class="ds-facets" id="ticket-facets" role="complementary" data-ds-facets data-ds-facets-sheet="#facets-sheet" aria-labelledby="facets-title">' +
          '<div class="ds-facets__head"><h2 class="ds-facets__title" id="facets-title">Filters</h2><button class="ds-btn ds-btn--text ds-facets__clear" type="button">Clear all</button></div>' +
          '<div class="ds-facets__applied" hidden><div class="ds-chips ds-facets__chips" role="group" aria-label="Applied filters"></div></div>' +
          FACETS.map(facet).join('') +
        '</section>' +
        '<div class="ds-facets-layout__main"><div class="ex-main">' +
          '<div class="ex-row">' +
            `<button class="ds-btn ds-facets__toggle" type="button" aria-haspopup="dialog">${icon('filter', 20)}Filters<span class="ds-badge ds-facets__badge" hidden></span></button>` +
            '<p class="ds-facets__count"></p></div>' +
          '<div class="ds-facets__applied" hidden><div class="ds-chips ds-facets__chips" role="group" aria-label="Applied filters"></div>' +
            '<button class="ds-btn ds-btn--text ds-facets__clear" type="button">Clear all</button></div>' +
          `<div class="${state.dense ? 'ds-table-wrap ds-density-dense' : 'ds-table-wrap'}"><table class="ds-table ds-datagrid" id="tickets-grid" aria-label="Tickets"></table></div>` +
        '</div></div>' +
      '</div>';
  }

  const ticketType = (ticket) => byId(ticket.device)?.type ?? null;

  /* Whether a ticket passes the facets, leaving out one facet (its own counts). */
  function ticketPasses(ticket, filters, skip) {
    return (skip === 'status' || !filters.status || filters.status.includes(ticket.status)) &&
      (skip === 'priority' || !filters.priority || filters.priority.includes(ticket.priority)) &&
      (skip === 'type' || !filters.type || filters.type.includes(ticketType(ticket)));
  }

  function ticketCounts(filters) {
    const out = Object.fromEntries(FACETS.map(([key, , options]) => [key, Object.fromEntries(options.map(([value]) => [value, 0]))]));
    for (const ticket of state.tickets) {
      if (ticketPasses(ticket, filters, 'status')) out.status[ticket.status] += 1;
      if (ticketPasses(ticket, filters, 'priority')) out.priority[ticket.priority] += 1;
      const type = ticketType(ticket);
      if (type && ticketPasses(ticket, filters, 'type')) out.type[type] += 1;
    }
    return out;
  }

  function ticketDetailHtml(ticket) {
    const device = byId(ticket.device);
    return `<div class="ex-detail"><p>${esc(ticket.text || 'No description.')}</p>` +
      `<p class="ds-meta">Ticket #${ticket.id}, ${esc(PRIORITY[ticket.priority].toLowerCase())} priority${ticket.due ? `, due ${esc(day(ticket.due))}` : ''}</p>` +
      '<div class="ex-row">' +
      (ticket.status !== 'closed' ? facesButton('ds-btn ds-sm', 'Close ticket', 'Closing', 'Closed', `data-close-ticket="${ticket.id}"`) : '') +
      (device ? `<a class="ds-link-btn" href="#/devices/${esc(device.id)}">Open ${esc(device.name)}</a>` : '') +
      '</div></div>';
  }

  let tickets = null;

  function mountTickets() {
    const panel = keep(DS.facets.create($('#ticket-facets', page)));
    const first = panel.get();
    const grid = keep(DS.datagrid.create($('#tickets-grid', page), {
      columns: [
        { key: 'id', label: 'Ticket', type: 'number', sortable: true, className: 'ds-nowrap ds-col--secondary', format: (value) => `#${value}` },
        { key: 'subject', label: 'Subject', sortable: true, className: 'ds-col--text' },
        { key: 'device', label: 'Device', sortable: true, className: 'ds-nowrap ds-col--secondary', value: (row) => byId(row.device)?.name ?? 'Removed device' },
        // On a phone Ticket, Priority and Opened step aside (the row's detail says number and priority); Status keeps its icon and word.
        { key: 'priority', label: 'Priority', sortable: true, className: 'ds-col--secondary', sortValue: (row) => ['high', 'normal', 'low'].indexOf(row.priority), render: (row) => priorityHtml(row.priority), exportValue: (row) => PRIORITY[row.priority] },
        { key: 'status', label: 'Status', sortable: true, render: (row) => ticketStatusHtml(row.status), exportValue: (row) => TICKET_STATUS[row.status].label },
        { key: 'opened', label: 'Opened', type: 'date', sortable: true, className: 'ds-nowrap ds-col--secondary', value: (row) => new Date(row.opened), render: (row) => cellTimeHtml(row.opened) },
      ],
      rows: state.tickets,
      filter: (row) => ticketPasses(row, first),
      detail: ticketDetailHtml,
      sort: [{ key: 'opened', dir: 'descending' }],
      emptyText: 'No ticket matches these filters.',
    }));
    tickets = { panel, grid };
    countTickets();
    panel.on('change', () => {
      const filters = panel.get();
      grid.set({ filter: (row) => ticketPasses(row, filters) });
      countTickets();
    });
    const open = Number(state.params.get('open'));
    if (open && ticketById(open)) {
      const ticket = ticketById(open);
      // A closed ticket asked for by its link: the status facet lets it through.
      if (!ticketPasses(ticket, panel.get())) {
        panel.set({ ...panel.get(), status: [...new Set([...(panel.get().status ?? []), ticket.status])] });
        const filters = panel.get();
        grid.set({ filter: (row) => ticketPasses(row, filters) });
        countTickets();
      }
      grid.expand(String(open), true);
    }
  }

  /* The facets' counts and the number of tickets shown. */
  function countTickets() {
    tickets.panel.counts(ticketCounts(tickets.panel.get()));
    tickets.panel.count(tickets.grid.get().total, { one: '{count} ticket', other: '{count} tickets' });
  }

  /* After the tickets changed (one created or closed): the same filters on the new rows. */
  function renderTickets() {
    if (!tickets || !$('#tickets-grid', page)) return;
    tickets.grid.set({ rows: state.tickets });
    countTickets();
  }

  /* ── Settings ─────────────────────────────────────────────────────── */

  function switchHtml(setting, label, checked) {
    return `<label class="ds-switch"><input type="checkbox" role="switch" data-setting="${setting}"${checked ? ' checked' : ''}>` +
      `<span class="ds-switch__track" aria-hidden="true"></span><span class="ds-switch__label">${label}</span>` +
      '<span class="ds-switch__state" aria-hidden="true"><span class="ds-switch__on">On</span><span class="ds-switch__off">Off</span></span></label>';
  }

  /* The accents are the shipped presets of tools/theme.mjs; a project generates its own from its seed. */
  const ACCENTS = [
    ['default', 'Blue', 'The default preset.'],
    ['ocean', 'Ocean', 'tools/theme.mjs from #00658f.'],
    ['forest', 'Forest', 'tools/theme.mjs from #2f6b3a.'],
    ['violet', 'Violet', 'tools/theme.mjs from #6750a4.'],
  ];

  const SCHEMES = [['light', 'Light', 'sun'], ['dark', 'Dark', 'moon'], ['auto', 'Device', 'monitor']];

  // In every label of a field that can change: the word joins the label's name while the field is .ds-field--changed.
  const CHANGED = '<span class="ds-field__changed ds-sr"> (changed)</span>';

  function settingsHtml() {
    const s = state.settings;
    const accent = prefs.get('accent', 'default');
    const option = (value, label, current) => `<option value="${value}"${value === current ? ' selected' : ''}>${label}</option>`;
    return head('Settings', 'Switches, the accent and the appearance apply at once. Edits of the organisation wait in the save bar.') +
      '<div class="ds-grid-2">' +
        '<section class="ds-card"><h2 class="ds-card__title">Sync</h2>' +
          switchHtml('nightlySync', 'Nightly sync at 02:00', s.nightlySync) +
          switchHtml('notifyFailures', 'Email me when a sync fails', s.notifyFailures) +
          switchHtml('dense', 'Compact tables', state.dense) +
          switchHtml('offline', 'Simulate a lost connection', state.offline) +
          '<p class="ds-muted">A switch takes effect when it flips; there is nothing to save.</p>' +
        '</section>' +
        '<section class="ds-card"><h2 class="ds-card__title" id="appearance-title">Appearance</h2>' +
          '<div class="ds-segmented" id="appearance" role="radiogroup" aria-labelledby="appearance-title" data-ds-scheme-switch>' +
            SCHEMES.map(([value, label, glyph]) => `<button class="ds-segmented__option" type="button" role="radio" aria-checked="false" data-ds-scheme-value="${value}" data-label="${label}">${icon(glyph, 18)}${label}</button>`).join('') +
          '</div>' +
          '<p class="ds-muted">The account menu has the same switch; both follow each other and remember the choice.</p>' +
          '<h3 class="ds-card__subtitle" id="accent-title">Accent colour</h3>' +
          '<div class="ds-radios" role="radiogroup" aria-labelledby="accent-title">' + ACCENTS.map(([value, label, text]) =>
            `<label class="ds-radio"><input type="radio" name="accent" value="${value}"${value === accent ? ' checked' : ''}>` +
            `<span><strong><span class="ex-swatch" data-accent="${value}" aria-hidden="true"></span>${label}</strong><small>${text}</small></span></label>`).join('') +
          '</div>' +
        '</section>' +
      '</div>' +
      '<form class="ds-card ds-form" id="org-form" novalidate><h2 class="ds-card__title">Organisation</h2>' +
        '<div class="ds-form-grid">' +
          `<div class="ds-field"><label class="ds-field__label" for="org-name">Name${CHANGED}</label><input class="ds-input" id="org-name" name="organisation" value="${esc(s.organisation)}" aria-describedby="org-name-hint"><small class="ds-field__hint" id="org-name-hint">Shown in reports and emails.</small></div>` +
          `<div class="ds-field"><label class="ds-field__label" for="org-contact">Contact email${CHANGED}</label><input class="ds-input" id="org-contact" name="contact" type="email" value="${esc(s.contact)}"></div>` +
          `<div class="ds-field"><label class="ds-field__label" for="org-timezone">Time zone${CHANGED}</label><select class="ds-input" id="org-timezone" name="timezone">${['UTC', 'Europe/London', 'America/New_York', 'Asia/Tokyo'].map((zone) => option(zone, zone, s.timezone)).join('')}</select></div>` +
          `<div class="ds-field"><label class="ds-field__label" for="org-retention">Keep history for${CHANGED}</label><select class="ds-input" id="org-retention" name="retention">${[['30', '30 days'], ['90', '90 days'], ['365', 'One year']].map(([v, l]) => option(v, l, s.retention)).join('')}</select></div>` +
        '</div>' +
        `<details class="ds-collapsible ds-disclosure"><summary>Advanced${icon('chevronDown', 20, 'ds-chevron')}</summary>` +
          '<div class="ds-disclosure__body"><div class="ds-field"><label class="ds-field__label" for="api-key">API key</label><div class="ds-field__row">' +
            '<input class="ds-input" id="api-key" value="ex_7f3a9c21d4e8b605" readonly>' +
            `<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Copy the key" data-tip="Copy the key" data-act="copy-key"><span class="ds-icon-swap" data-swap="a"><span class="ds-icon-swap__a">${icon('copy', 20)}</span><span class="ds-icon-swap__b">${icon('check', 20)}</span></span></button>` +
          '</div></div></div>' +
        '</details>' +
        // Save and Discard live in the save bar (index.html), which submits this form (form="org-form").
        `<p class="ds-meta" id="org-saved">${state.savedAt ? `Last saved today, ${esc(clock(state.savedAt))}` : 'Not changed yet'}</p>` +
      '</form>';
  }

  function mountSettings() {
    const group = $('#appearance', page);
    keep(DS.shell.schemeSwitch(group));
    keep(DS.indicator.create(group, { active: '[aria-checked="true"]', className: 'ds-segmented__indicator' }));
  }

  /* The accent: another preset file. The new sheet loads next to the old one, which goes once it applies. */
  function applyAccent(name) {
    const old = $('#ex-preset');
    const href = `../dist/themes/presets/${name}.css`;
    if (old.getAttribute('href') === href) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.addEventListener('load', () => {
      old.remove();
      link.id = 'ex-preset';
    }, { once: true });
    old.after(link);
    prefs.set('accent', name);
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

  const ROUTES = {
    overview: { title: 'Overview', nav: 'overview', html: overviewHtml, mount: mountOverview },
    devices: { title: 'Devices', nav: 'devices', html: devicesHtml, mount: mountDevices, fill: true },
    device: { title: 'Device', nav: 'devices', html: () => deviceHtml(byId(state.id)), mount: mountDevice },
    tickets: { title: 'Tickets', nav: 'tickets', html: ticketsHtml, mount: mountTickets },
    settings: { title: 'Settings', nav: 'settings', html: settingsHtml, mount: mountSettings },
  };

  /* "#/devices?view=offline" → { route: 'devices', params }; "#/devices/laptop-0040" → { route: 'device', id } */
  function parse(hash) {
    const match = /^#\/([a-z]+)(?:\/([\w-]+))?(?:\?(.*))?$/.exec(hash || '');
    let route = match && ROUTES[match[1]] ? match[1] : 'overview';
    const id = match && match[2] && route === 'devices' ? match[2] : null;
    if (id) route = 'device';
    return { route, id, params: new URLSearchParams(match ? match[3] || '' : '') };
  }

  /* A view opened from a link of the overview (a tile, an alert, a ticket) offers the way back in its head. */
  function applyParams(route, params, from) {
    state.back = (route === 'devices' || route === 'tickets') && from === 'overview' && params.toString() ? { href: '#/overview', label: 'Overview' } : null;
  }

  /* Renders the view of the state. `defer` (the start): what the view can draw a task later comes back as a function. */
  let renders = 0;
  function renderView({ defer = false } = {}) {
    renders += 1;
    // A new render drops unsaved edits of the organisation form, and its bar with them; and what the old view mounted.
    savebar.hide();
    for (const controller of mounted) controller.destroy?.();
    mounted = [];
    devices = null;
    tickets = null;
    fleetChart = null;
    const route = ROUTES[state.route];
    // The devices view fills the window: its full-page grid takes what is left (.ds-view--fill).
    view.classList.toggle('ds-view--fill', Boolean(route.fill));
    DS.dom.morphHtml(page, route.html(), { replace: true });
    const later = route.mount(defer) ?? null;
    for (const item of $$('[data-route]', nav)) {
      if (item.getAttribute('data-route') === route.nav) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    }
    const title = state.route === 'device' ? byId(state.id)?.name ?? 'Device' : route.title;
    document.title = `${title} · Example Console`;
    // A new view starts at its top. Not at the start: the view is at its top already, and the write would lay out
    // the whole view inside this task.
    if (!defer) view.scrollTop = 0;
    return later;
  }

  /* A destination: fade-through between the drawer's views, forward into a record and back out of it. The modal
     drawer closes inside the update, so the new view crossfades under it; focus: true puts the focus it took with
     it on the new title. A choice in the modal drawer (DS.shell closed it already, the focus went back to the menu
     button) or in a dialog or sheet asks for the title too (title: true). */
  function go(hash, { push = true, title = false } = {}) {
    const { route, id, params } = parse(hash);
    if (push && location.hash !== hash) history.pushState(null, '', hash);
    const from = state.route;
    applyParams(route, params, from);
    const type = route === 'device' && from !== 'device' ? 'forward' : from === 'device' && route === 'devices' ? 'back' : 'fade-through';
    return M.transition(() => {
      if (app.hasAttribute('data-drawer-open')) DS.overlay.close(drawer);
      state.route = route;
      state.id = id;
      state.params = params;
      renderView();
      if (title) $('h1', page)?.focus({ preventScroll: true });
      return page;
    }, { type, focus: true });
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
    const stack = $('#alerts', page);
    if (!stack) return;
    const html = alertsHtml();
    if (html) stack.hidden = false;
    // A dismissed alert's focus moves to the next alert's Dismiss (flip's refocus), else to the page title.
    M.flip(stack, (morph) => DS.dom.morphHtml(stack, html, morph), { live, refocus: () => $('h1', page) }).then(() => {
      if (!alertsHtml() && stack.isConnected) stack.hidden = true;
    });
  }

  function updateTicketCount() {
    const count = openTickets().length;
    DS.dom.morphHtml($('#nav-tickets-count'), count ? `<span class="ds-sr">, </span>${count}<span class="ds-sr"> open</span>` : '');
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
      const feed = $('#activity', page);
      if (feed) M.flip(feed, (morph) => DS.dom.morphHtml(feed, activityHtml(), morph), { live: true });
    }
    // Polled data: values change at once; the grid keeps its sort, filter, page and selection.
    if (state.route === 'devices') updateDevices();
    if (state.route === 'device') updateDevicePage();
    if (result.notifications.length) centre.add(result.notifications.map(notification));
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
      DS.dom.morphHtml(banner, `<div class="ds-alert ds-tone-warning" role="status">${icon('wifiOff', 20)}` +
        '<span class="ds-alert__text">The console is offline. Figures stay as they were until it answers again.</span>' +
        '<button class="ds-btn ds-btn--text ds-sm" type="button">Retry</button></div>');
      banner.addEventListener('click', (event) => { if (event.target.closest('button')) poll(); });
    }
    M.flip(panel, () => { if (on) panel.prepend(banner); else banner.remove(); }, { items: ':scope > *' });
  }

  /* ── The notification centre ──────────────────────────────────────── */

  /* A notification of the backend as the centre takes it: the glyph itself, actions where they help. */
  function notification(item) {
    return {
      ...item,
      icon: item.icon ? DS.icons[item.icon] : undefined,
      actions: item.device ? [{ id: 'ticket', label: 'Open a ticket' }] : undefined,
    };
  }

  /* Made in a task of its own after the first paint (start()); the bell opens the sheet by data-ds-open. */
  let centre = null;
  function makeCentre() {
    const made = DS.notifications.create($('#inbox'));
    made.on('read', ({ ids, read }) => api.markRead(ids, read));
    made.on('action', ({ item, action }) => {
      if (action.id !== 'ticket') return;
      // The sheet closes first, so the dialog opens over the page and focus returns to the bell.
      made.close().then(() => openTicketDialog($('#inbox-open'), item.device));
    });
    return made;
  }

  /* ── The command palette ──────────────────────────────────────────── */

  /* Made in a task of its own after the first paint (start()); Ctrl+K works from then on. */
  const makePalette = () => DS.command.create($('#palette'), {
    commands: [
      { id: 'go-overview', label: 'Overview', group: 'Go to', icon: DS.icons.overview, keywords: ['home', 'dashboard'], run: () => go('#/overview') },
      { id: 'go-devices', label: 'Devices', group: 'Go to', icon: DS.icons.laptop, keywords: ['fleet', 'list'], run: () => go('#/devices') },
      { id: 'go-offline', label: 'Offline devices', group: 'Go to', icon: DS.icons.wifiOff, run: () => go('#/devices?view=offline') },
      { id: 'go-tickets', label: 'Tickets', group: 'Go to', icon: DS.icons.ticket, run: () => go('#/tickets') },
      { id: 'go-settings', label: 'Settings', group: 'Go to', icon: DS.icons.settings, keywords: ['preferences'], run: () => go('#/settings') },
      { id: 'new-ticket', label: 'New ticket', group: 'Actions', icon: DS.icons.plus, keywords: ['create', 'report', 'problem'], run: () => openTicketDialog($('#palette-open')) },
      { id: 'sync', label: 'Run the sync now', group: 'Actions', icon: DS.icons.sync, keywords: ['refresh', 'update'], run: () => runSync() },
      { id: 'inbox', label: 'Show notifications', group: 'Actions', icon: DS.icons.bell, run: () => centre.open({ opener: $('#inbox-open') }) },
      { id: 'theme', label: 'Change the theme', group: 'Appearance', icon: DS.icons.contrast, children: SCHEMES.map(([value, label, glyph]) => (
        { id: `theme-${value}`, label, icon: DS.icons[glyph], run: () => DS.shell.setScheme(value) })) },
      { id: 'accent', label: 'Change the accent colour', group: 'Appearance', icon: DS.icons.palette, children: ACCENTS.map(([value, label]) => (
        { id: `accent-${value}`, label, run: () => { applyAccent(value); if (state.route === 'settings') syncAccentRadios(); } })) },
      { id: 'tickets', label: 'Find a ticket', group: 'Search', icon: DS.icons.ticket, prefix: '#', placeholder: 'Ticket number or subject',
        children: () => state.tickets.map((ticket) => ({ id: `ticket-${ticket.id}`, label: `#${ticket.id} ${ticket.subject}`, description: `${TICKET_STATUS[ticket.status].label} · ${byId(ticket.device)?.name ?? 'Removed device'}`, icon: DS.icons.ticket, run: () => go(`#/tickets?open=${ticket.id}`) })) },
    ],
    // Devices are data, not commands: found as you type, never kept under Recent.
    providers: [{
      group: 'Devices',
      minLength: 2,
      search: (query) => {
        const q = query.trim().toLowerCase();
        return state.devices.filter((device) => [device.name, device.owner, device.serial, device.model].some((text) => text.toLowerCase().includes(q))).slice(0, 8)
          .map((device) => ({ id: `device-${device.id}`, label: device.name, description: `${device.model} · ${device.owner} · ${STATUS[device.status].label}`, icon: DS.icons.laptop, run: () => go(`#/devices/${device.id}`) }));
      },
    }],
  });

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

  function deleteDevices(ids, removed) {
    state.devices = state.devices.filter((device) => !ids.includes(device.id));
    if (state.route === 'device' && ids.includes(state.id)) go('#/devices');
    else if (devices) {
      devices.grid.select('none');
      updateDevices();
      // The focused control left with its row: the list's title takes focus.
      if (!document.activeElement || document.activeElement === document.body || !document.activeElement.isConnected) $('h1', page)?.focus({ preventScroll: true });
    }
    undoToast(removed);
  }

  /* A snackbar with an action stays until it is used or closed; the action closes it and runs once. */
  function undoToast(removed) {
    const text = removed.length === 1 ? `${removed[0].name} deleted.` : `${removed.length} devices deleted.`;
    DS.overlay.toast(toasts, text, {
      action: {
        label: 'Undo',
        onClick: async () => {
          state.devices = await api.restoreDevices(removed);
          updateDevices();
          DS.overlay.toast(toasts, removed.length === 1 ? `${removed[0].name} restored.` : `${removed.length} devices restored.`);
        },
      },
    });
  }

  /* A restart: the snackbar waits with a spinner and turns into the result (DS.toast.promise). */
  function restart(ids, button) {
    const names = ids.map((id) => byId(id)?.name).filter(Boolean);
    if (!names.length) return Promise.resolve();
    const work = Promise.all(ids.map((id) => api.restart(id))).then((list) => {
      for (const updated of list) if (updated) Object.assign(byId(updated.id) ?? {}, updated);
      updateDevices();
      updateDevicePage();
    });
    const label = names.length === 1 ? names[0] : `${names.length} devices`;
    DS.toast.promise(toasts, work, { pending: `Restarting ${label}`, success: `${label} restarted.`, error: `Could not restart ${label}.` });
    return button ? M.busy(button, work) : work;
  }

  /* The sync: a progress toast (it follows from every view), the card's button busy while it runs. */
  async function runSync(button = $('#sync-run', page)) {
    if (state.sync.running) return;
    state.sync.running = true;
    const total = state.devices.length;
    const progress = DS.toast.progress(toasts, `Syncing ${plural(total, 'device')}`, { value: 0, key: 'sync' });
    const work = api.sync((done, all) => progress.set(done / all, `Synced ${done} of ${all} devices`));
    if (button) M.busy(button, work);
    await work;
    state.sync = { running: false, finished: Date.now(), summary: ['2 new', '1 updated', `${total - 3} unchanged`] };
    progress.done(`Sync finished: ${plural(total, 'device')} checked.`);
    const last = $('#sync-last', page);
    if (last) DS.dom.morphHtml(last, syncSummaryHtml(), { replace: true });
    // One error per cause: a second sync replaces the old one (key), a sync without offline devices closes it.
    const offline = state.devices.filter((device) => device.status === 'error');
    if (offline.length) {
      DS.overlay.toast(toasts, offline.length === 1 ? `${offline[0].name} did not answer the sync.` : `${offline.length} devices did not answer the sync.`, { kind: 'error', key: 'sync-offline' });
    } else DS.overlay.closeToasts(toasts, { key: 'sync-offline' });
  }

  /* ── The ticket dialog ────────────────────────────────────────────── */

  /* Its date picker and combobox are made after the start, each in a task of its own (or on an earlier first open):
     nothing of the dialog shows before, so the first paint does not wait for them. */
  let due = null;
  let deviceCombo = null;
  function dueControl() {
    due ??= DS.datepicker.create($('#ticket-due'), { name: 'due' });
  }

  function ticketControls() {
    dueControl();
    if (deviceCombo) return;
    deviceCombo = DS.combobox.create($('#ticket-combo'), { items: [] });
    deviceCombo.on('change', () => setError($('#ticket-device'), ''));
  }

  function openTicketDialog(opener, deviceId) {
    ticketControls();
    ticketForm.reset();
    for (const input of $$('[aria-invalid]', ticketForm)) setError(input, '');
    // The devices of now; the device the dialog was opened for is chosen.
    deviceCombo.setItems(deviceItems());
    deviceCombo.set(deviceId && byId(deviceId) ? deviceId : null);
    due.set(null);
    DS.overlay.open(ticketDialog, { opener: opener || document.activeElement });
  }

  async function createTicket(submit) {
    const subject = $('#ticket-subject');
    const deviceInput = $('#ticket-device');
    const device = byId(deviceCombo.get());
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
      subject: subject.value.trim(), device: device.id, priority: data.get('priority'), due: due.get() || null, text: String(data.get('text') || '').trim(),
    }));
    state.tickets.unshift(ticket);
    DS.overlay.close(ticketDialog);
    updateTicketCount();
    if (state.route === 'tickets') renderTickets();
    if (state.route === 'device' && state.id === device.id) DS.dom.morphHtml($('#device-ticket-list', page), deviceTicketsHtml(device));
    if (state.route === 'overview') DS.dom.morphHtml($('#open-tickets', page), openTicketsHtml());
    DS.overlay.toast(toasts, `Ticket #${ticket.id} created${data.get('notify') ? `, ${device.owner} was told` : ''}.`);
  }

  /* ── The combobox in the ticket dialog ────────────────────────────── */

  /* DS.combobox filters, chooses and announces; the page gives the devices as items (a long list is windowed). */
  const deviceItems = () => state.devices.map((device) => ({ value: device.id, label: device.name, meta: device.owner }));

  ticketForm.addEventListener('submit', (event) => {
    event.preventDefault();
    createTicket(event.submitter || $('[type="submit"]', ticketForm));
  });

  /* ── Wiring ───────────────────────────────────────────────────────── */

  /* Icons of the static markup: data-icon="<glyph>" (with data-icon-place, beside the label) is drawn by
     DS.icons.fill(); the glyphs that carry a class of their component go in by hand. */
  DS.icons.fill(document);
  for (const element of $$('[data-ex-check]')) element.insertAdjacentHTML('afterbegin', icon('check', 20, 'ds-menu__check'));
  for (const element of $$('[data-ex-chevron]')) element.insertAdjacentHTML('afterbegin', icon('chevronDown', 20, 'ds-chevron'));

  // Every data-ds-* behaviour of the page (the frame, the drawer, the theme switch, the tooltips ...), now
  // and for the markup the views render later; and the ripple with the action guard on every action.
  DS.init(document);
  DS.ripple.attach(document);

  // Links to a route ("#/devices") navigate in place; every other link loads. A link inside an open dialog or sheet
  // (a notification) closes it first.
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#/"]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const layer = link.closest('dialog[open]');
    if (layer) DS.overlay.close(layer);
    const modal = Boolean(link.closest('#drawer')) && matchMedia(DS.overlay.DRAWER_QUERY).matches;
    go(link.getAttribute('href'), { title: modal || Boolean(layer) });
  });
  window.addEventListener('popstate', () => go(location.hash, { push: false }));

  // The drawer's New ticket (outside the page).
  drawer.addEventListener('click', (event) => {
    const button = event.target.closest('[data-act="new-ticket"]');
    if (button) openTicketDialog(button);
  });

  // Copy link of the saved views: the address carries the view and its state.
  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-act="copy-link"]')) return;
    if (navigator.clipboard) navigator.clipboard.writeText(location.href).catch(() => {});
    DS.overlay.toast(toasts, 'Link copied.');
  });

  page.addEventListener('click', (event) => {
    const target = event.target;
    const hit = (selector) => target.closest(selector);
    let element;
    if ((element = hit('[data-dismiss]'))) {
      state.dismissed.add(element.getAttribute('data-dismiss'));
      updateAlerts(false);
    } else if ((element = hit('[data-close-ticket]'))) {
      const id = Number(element.getAttribute('data-close-ticket'));
      M.busy(element, () => api.closeTicket(id)).then(() => {
        ticketById(id).status = 'closed';
        $('h1', page).focus({ preventScroll: true });
        renderTickets();
        updateTicketCount();
        DS.overlay.toast(toasts, `Ticket #${id} closed.`);
      });
    } else if ((element = hit('#sync-run'))) runSync(element);
    else if ((element = hit('[data-act]'))) {
      const act = element.getAttribute('data-act');
      if (act === 'refresh') refreshDevices();
      if (act === 'new-ticket') openTicketDialog(element);
      if (act === 'delete-selected') confirmDelete(selectedIds(), element);
      if (act === 'restart-selected') restart(selectedIds());
      if (act === 'delete-device') confirmDelete([state.id], element);
      if (act === 'ticket-device') openTicketDialog(element, state.id);
      if (act === 'restart-device') restart([state.id], element);
      if (act === 'copy-key') {
        const swap = $('.ds-icon-swap', element);
        if (navigator.clipboard) navigator.clipboard.writeText($('#api-key').value).catch(() => {});
        swap.setAttribute('data-swap', 'b');
        DS.overlay.toast(toasts, 'Key copied.');
        setTimeout(() => swap.setAttribute('data-swap', 'a'), M.motionDuration(swap, '--ds-hold-success'));
      }
    }
  });

  // The time range: a new range or interval goes into the address; every refresh (a new range, the button, the
  // interval) loads the charts again.
  page.addEventListener('ds:change', (event) => {
    if (event.target.id !== 'overview-range') return;
    history.replaceState(history.state, '', `#/overview?${event.detail.query}`);
  });
  page.addEventListener('ds:refresh', (event) => {
    if (event.target.id === 'overview-range') loadMetrics(event.detail);
  });

  // The date picker of the device's General form is made when the section starts to edit (ds:edit comes before
  // the form shows): a device page that is only read does not pay for it.
  const pickers = new WeakSet();
  page.addEventListener('ds:edit', (event) => {
    const picker = event.detail.section.id === 'general' ? $('#dev-warranty', page) : null;
    if (!picker || pickers.has(picker)) return;
    pickers.add(picker);
    keep(DS.datepicker.create(picker));
  });

  // The device's General section: the page validates nothing more than the form's own fields and saves on the
  // backend (ds:save cancelled, the busy faces, then done()).
  page.addEventListener('ds:save', (event) => {
    const { section: part, form, values } = event.detail;
    const device = byId(state.id);
    if (!device || part.id !== 'general') return;
    event.preventDefault();
    const record = DS.get($('#device-object', page), 'object');
    const patch = { owner: values.owner, location: values.location, warranty: values.warranty || device.warranty };
    M.busy($('[type="submit"]', form), () => api.updateDevice(device.id, patch)).then((saved) => {
      Object.assign(device, saved);
      DS.dom.morphHtml($('.ds-object__view', part), generalViewHtml(device));
      DS.dom.morphHtml($('#device-details', page), deviceDetailsHtml(device));
      for (const field of $$('select', form)) for (const option of field.options) option.defaultSelected = option.selected;
      record.done(part);
      DS.overlay.toast(toasts, `${device.name} saved.`);
    });
  });

  page.addEventListener('change', (event) => {
    const target = event.target;
    if (target.name === 'accent') applyAccent(target.value);
    else if (target.hasAttribute('data-setting')) {
      const setting = target.getAttribute('data-setting');
      const on = target.checked;
      if (setting === 'dense') {
        state.dense = on;
        prefs.set('dense', on);
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

  function syncAccentRadios() {
    const accent = prefs.get('accent', 'default');
    for (const radio of $$('input[name="accent"]', page)) radio.checked = radio.value === accent;
  }

  /* The organisation form: a field whose value differs from the saved one is
     .ds-field--changed, and the save bar shows while any is (its count
     changes at once, or after its exit while it leaves). */
  function syncOrgChanges() {
    const form = $('#org-form', page);
    const changed = form ? $$('[name]', form).filter((field) => {
      const differs = field.value !== String(state.settings[field.name] ?? '');
      field.closest('.ds-field').classList.toggle('ds-field--changed', differs);
      return differs;
    }).length : 0;
    if (!changed) {
      savebar.hide();
      return;
    }
    savebar.update(() => { $('#savebar-text').textContent = changed === 1 ? '1 unsaved change' : `${changed} unsaved changes`; });
    savebar.show();
  }

  page.addEventListener('input', (event) => {
    if (event.target.closest('#org-form')) syncOrgChanges();
  });

  $('#savebar-discard').addEventListener('click', () => {
    const form = $('#org-form', page);
    if (form) form.reset();
    syncOrgChanges();
  });

  page.addEventListener('submit', async (event) => {
    if (event.target.id !== 'org-form') return;
    event.preventDefault();
    // Enter in a field submits through the bar's Save (the form's default button): nothing to save without an edit.
    if (!savebar.shown) return;
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
    state.settings = await M.busy($('#savebar-save'), () => api.saveSettings(values));
    state.savedAt = Date.now();
    if (!form.isConnected) return;
    // The saved values are the form's new defaults, so Discard returns to them.
    for (const field of $$('[name]', form)) {
      if (field.tagName === 'SELECT') for (const option of field.options) option.defaultSelected = option.selected;
      else field.defaultValue = field.value;
    }
    $('#org-saved', form).textContent = `Last saved today, ${clock(state.savedAt)}`;
    syncOrgChanges();
    DS.overlay.toast(toasts, 'Organisation saved.');
  });

  page.addEventListener('reset', (event) => {
    for (const input of $$('[aria-invalid]', event.target)) setError(input, '');
  });

  // An error message goes once the field is corrected.
  document.addEventListener('input', (event) => {
    const input = event.target;
    if (input.getAttribute && input.getAttribute('aria-invalid') === 'true' && input.id) setError(input, '');
  });

  /* ── Start ────────────────────────────────────────────────────────── */

  /* A task boundary: the browser paints and handles input between the pieces of the start, so none of them is a
     long task on a slow phone. */
  const nextTask = () => new Promise((resolve) => { setTimeout(resolve, 0); });

  (async function start() {
    const skeleton = $('.ds-skeleton', page);
    const startedAt = Date.now();
    const loading = api.load();
    // The frame and the skeleton paint first; the centre and the palette (ready before the data: its commands read
    // the state when they run) follow, each in its own task, while the data loads.
    await nextTask();
    centre = makeCentre();
    await nextTask();
    makePalette();
    // The first relative time builds the engine's Intl formatter, which costs a slow phone a long task: it is made
    // here, in a task of its own while the data loads, not inside the first render of the feed and the grids.
    await nextTask();
    DS.format.relative(Date.now(), { smallest: 'minute' });
    const data = await loading;
    await M.settleLoader(startedAt, { element: skeleton });
    Object.assign(state, { devices: data.devices, tickets: data.tickets, activity: data.activity, checkins: data.checkins, settings: data.settings });
    updateTicketCount();
    const { route, id, params } = parse(location.hash);
    Object.assign(state, { route, id, params });
    const later = renderView({ defer: true });
    M.staggerOnce(page);
    await nextTask();
    later?.();
    await nextTask();
    // The backlog arrives quietly; what the poll brings later is announced.
    centre.add(data.notifications.map(notification), { announce: false });
    document.documentElement.setAttribute('data-ex-ready', '');
    if (new URLSearchParams(location.search).get('live') !== '0') setInterval(poll, 5000);
    await nextTask();
    dueControl();
    await nextTask();
    ticketControls();
  }());
}());
