/*
 * The live tour (demo/index.html): one page that walks through what
 * Dashboard-Style does, every demo wired the way a project wires it.
 *
 *   frame           drawer with a scroll-spy pill (DS.indicator), the modal
 *                   drawer (DS.overlay), data-scrolled, the speed switch
 *                   (--ds-time-scale, tooling like the styleguide's)
 *   press           ripple, tooltips, a toggle, an icon swap, busy and done
 *   choose          a parent checkbox with indeterminate
 *   live            a fake backend: tiles (countUp), rows (flip with
 *                   morphHtml, live), status chips, search, chips, sort,
 *                   the empty state
 *   overlays        dialog, side sheet (transition forward and back), menu,
 *                   snackbars with an undo
 *   feedback        progress with its figure, a status that changes, alerts
 *                   that come and go (flip)
 *   forms           validation on submit, a combobox, busy and done; a CSV
 *                   import (DS.dom.dropzone, a .ds-list of files through
 *                   flip, each with its progress)
 *   theme           theme.js: the choice restyles the page and shows its file
 *   icons           the set, filtered with flip, copied on click
 *
 * Re-renders go through DS.dom.morphHtml, never innerHTML; JS timing that
 * belongs to motion comes from the tokens (motionDuration). The ms in
 * `fake` are the fake backend's latency, not motion.
 */
(function () {
  'use strict';

  const M = DS.motion;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const icon = (name, size = 20, className) => DS.icons.icon(DS.icons[name], size, className);
  const esc = (text) => String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  /* The fake backend: answers after a latency. */
  const fake = (ms, value) => new Promise((resolve) => setTimeout(() => resolve(value), ms));

  const root = document.documentElement;
  const app = $('#app');
  const view = $('#main');
  const drawer = $('#drawer');
  const nav = $('#nav');
  const menuButton = $('#menu');
  const toasts = $('#toasts');

  function toast(text, options) {
    return DS.overlay.toast(toasts, text, options);
  }

  async function copy(text, message) {
    try {
      await navigator.clipboard.writeText(text);
      toast(message);
    } catch (error) {
      toast('The browser did not allow copying here.', { kind: 'info' });
    }
  }

  /* ── Icons of the static markup ───────────────────────────────────── */

  for (const element of $$('[data-icon]')) {
    element.insertAdjacentHTML('afterbegin', icon(element.getAttribute('data-icon'), 20));
    element.removeAttribute('data-icon');
  }
  for (const element of $$('[data-icon-sm]')) {
    element.insertAdjacentHTML('afterbegin', icon(element.getAttribute('data-icon-sm'), 16));
    element.removeAttribute('data-icon-sm');
  }
  for (const element of $$('[data-icon-inline]')) {
    const [name, size] = element.getAttribute('data-icon-inline').split(' ');
    const holder = element.classList.length ? element : null;
    if (holder) {
      holder.innerHTML = icon(name, Number(size) || 20);
      holder.removeAttribute('data-icon-inline');
    } else element.outerHTML = icon(name, Number(size) || 20);
  }
  for (const element of $$('[data-icon-check]')) element.outerHTML = icon('check', 16);
  for (const element of $$('[data-chip-check]')) element.outerHTML = icon('check', 18, 'ds-chip__check');
  for (const element of $$('[data-icon-chevron]')) element.outerHTML = icon('chevronDown', 16, element.getAttribute('data-icon-chevron'));
  for (const element of $$('[data-menu-check]')) element.insertAdjacentHTML('afterbegin', icon('check', 20, 'ds-menu__check'));

  $('#version').textContent = DS.version;

  DS.ripple.attach(document);
  DS.overlay.tooltips(document);
  // aria-disabled, busy and done actions ignore every input (click, Enter, Space, a submission): no own guard.
  DS.motion.guard(document);

  /* ── Frame: drawer, scroll spy, modal drawer, data-scrolled ───────── */

  DS.indicator.createIndicator(nav, { active: '[aria-current="page"]', className: 'ds-drawer__indicator' });

  /* data-scrolled from a 1px sentinel (DS.dom.watchScrolled, docs/components.md, App frame). */
  DS.dom.watchScrolled(view);

  const sections = $$('.demo-section');
  const tourItems = $$('.ds-drawer__item[href^="#"]', nav);

  function setCurrent(id) {
    for (const item of tourItems) {
      if (item.getAttribute('href') === `#${id}`) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    }
  }

  /* While a link scrolls the view smoothly, the spy keeps still: otherwise the pill walks through every section. */
  let spyMuted = false;
  let muteTimer = 0;
  function muteSpy() {
    spyMuted = true;
    const release = () => { spyMuted = false; spy(); };
    if ('onscrollend' in view) {
      view.addEventListener('scrollend', release, { once: true });
      return;
    }
    const quiet = () => {
      clearTimeout(muteTimer);
      muteTimer = setTimeout(() => { view.removeEventListener('scroll', quiet); release(); }, M.motionDuration(view, '--ds-dur-fast'));
    };
    view.addEventListener('scroll', quiet);
  }

  /* The current section: the last one whose top passed the upper third of the view (the last one at the bottom). */
  function spy() {
    if (spyMuted) return;
    const top = view.getBoundingClientRect().top + view.clientHeight / 3;
    let current = sections[0];
    for (const section of sections) if (section.getBoundingClientRect().top <= top) current = section;
    if (view.scrollTop + view.clientHeight >= view.scrollHeight - 2) current = sections.at(-1);
    setCurrent(current.id);
  }
  let spyFrame = 0;
  view.addEventListener('scroll', () => {
    if (!spyFrame) spyFrame = requestAnimationFrame(() => { spyFrame = 0; spy(); });
  }, { passive: true });

  function goTo(id, options = {}) {
    const section = document.getElementById(id);
    if (!section) return;
    const before = view.scrollTop;
    if (app.hasAttribute('data-drawer-open')) DS.overlay.close(drawer);
    setCurrent(id);
    section.scrollIntoView({ behavior: options.instant ? 'auto' : 'smooth', block: 'start' });
    // A link to where the view already is mutes nothing: no scroll follows.
    if (!options.instant && Math.abs(view.scrollTop - before) < 1 && Math.abs(section.getBoundingClientRect().top - view.getBoundingClientRect().top) > 32) muteSpy();
    const title = $('h1, h2', section);
    if (title) {
      title.setAttribute('tabindex', '-1');
      title.focus({ preventScroll: true });
    }
    history.replaceState(null, '', `${location.search}#${id}`);
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const id = link.getAttribute('href').slice(1);
    if (!id || id === 'main' || !document.getElementById(id)?.classList.contains('demo-section')) return;
    event.preventDefault();
    goTo(id);
  });

  menuButton.addEventListener('click', () => {
    if (app.hasAttribute('data-drawer-open')) DS.overlay.close(drawer);
    else DS.overlay.open(drawer, { opener: menuButton });
  });

  /* ── Speed: --ds-time-scale, like the styleguide's speed select ───── */

  const speedNav = $('#speed');
  DS.indicator.createIndicator(speedNav, { active: '[aria-current="true"]', className: 'ds-segmented__indicator' });

  function setSpeed(factor) {
    for (const option of $$('.ds-segmented__option', speedNav)) {
      if (Number(option.getAttribute('data-speed')) === factor) option.setAttribute('aria-current', 'true');
      else option.removeAttribute('aria-current');
    }
    if (factor < 1) root.style.setProperty('--ds-time-scale', String(1 / factor));
    else root.style.removeProperty('--ds-time-scale');
  }

  speedNav.addEventListener('click', (event) => {
    const option = event.target.closest('.ds-segmented__option');
    if (!option) return;
    event.preventDefault();
    const factor = Number(option.getAttribute('data-speed'));
    setSpeed(factor);
    const params = new URLSearchParams(location.search);
    if (factor < 1) params.set('speed', String(factor));
    else params.delete('speed');
    history.replaceState(null, '', `${params.size ? `?${params}` : location.pathname}${location.hash}`);
    toast(factor < 1 ? 'Slow motion: every animation runs at a fifth of its speed.' : 'Back to normal speed.', { kind: 'info' });
  });

  const askedSpeed = Number(new URLSearchParams(location.search).get('speed'));
  if (askedSpeed > 0 && askedSpeed < 1) setSpeed(askedSpeed);

  /* ── Welcome: the tiles count up once ─────────────────────────────── */

  for (const value of $$('#facts .ds-tile__value[data-count]')) {
    const suffix = value.getAttribute('data-suffix') || '';
    M.countUp(value, Number(value.getAttribute('data-count')), { format: (n) => `${Math.round(n)}${suffix}`, from: 0 });
  }

  /* ── Press and focus ──────────────────────────────────────────────── */

  $('#filter-toggle').addEventListener('click', (event) => {
    const button = event.currentTarget;
    button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true'));
  });

  let copyBack = 0;
  $('#copy-link').addEventListener('click', (event) => {
    const swap = $('.ds-icon-swap', event.currentTarget);
    swap.setAttribute('data-swap', 'b');
    copy(location.href.split('#')[0], 'Link copied.');
    clearTimeout(copyBack);
    // The check stays for the success hold, twice over, then turns back.
    copyBack = setTimeout(() => swap.setAttribute('data-swap', 'a'), 2 * M.motionDuration(swap, '--ds-hold-success') + M.motionDuration(swap, '--ds-dur-medium'));
  });

  $('#save-demo').addEventListener('click', (event) => {
    M.busy(event.currentTarget, () => fake(1400)).then(() => toast('Changes saved.'));
  });

  /* ── Choose: a parent checkbox ────────────────────────────────────── */

  const checkAll = $('#check-all');
  const channels = $$('[data-channel]');
  function syncParent() {
    const on = channels.filter((box) => box.checked).length;
    checkAll.checked = on === channels.length;
    checkAll.indeterminate = on > 0 && on < channels.length;
  }
  checkAll.addEventListener('change', () => {
    for (const box of channels) box.checked = checkAll.checked;
    syncParent();
  });
  for (const box of channels) box.addEventListener('change', syncParent);
  syncParent();

  /* ── Live data ────────────────────────────────────────────────────── */

  const STATUS = {
    ok: { label: 'OK', className: 'ds-status--ok', glyph: 'check' },
    warning: { label: 'Busy', className: 'ds-status--warning', glyph: 'alert' },
    running: { label: 'Updating', className: 'ds-status--running', glyph: null },
    error: { label: 'Offline', className: 'ds-status--error', glyph: 'wifiOff' },
  };
  const STATUS_ORDER = ['error', 'warning', 'running', 'ok'];

  const live = {
    devices: [
      { id: 'd1', name: 'Printer on floor 2', type: 'Printer', model: 'Office Printer C4', owner: 'Facilities', load: 12, status: 'ok' },
      { id: 'd2', name: 'LAPTOP-0042', type: 'Laptop', model: 'Laptop 14 Pro', owner: 'Ada Lovelace', load: 64, status: 'warning' },
      { id: 'd3', name: 'Reception desk', type: 'Desktop', model: 'Desktop Mini', owner: 'Front office', load: 23, status: 'ok' },
      { id: 'd4', name: 'Build server', type: 'Server', model: 'Rack Server 1U', owner: 'Engineering', load: 81, status: 'running' },
      { id: 'd5', name: 'Meeting room tablet', type: 'Tablet', model: 'Tablet 11', owner: 'Facilities', load: 5, status: 'ok' },
      { id: 'd6', name: 'LAPTOP-0117', type: 'Laptop', model: 'Laptop 13 Air', owner: 'Grace Hopper', load: 37, status: 'ok' },
      { id: 'd7', name: 'Warehouse scanner', type: 'Phone', model: 'Handheld Scanner 5', owner: 'Logistics', load: 0, status: 'error' },
    ],
    query: '',
    statuses: new Set(),
    sort: { key: 'load', dir: 'descending' },
    on: true,
    first: true,
  };
  const byId = (id) => live.devices.find((device) => device.id === id);

  const statusHtml = (status) => {
    const s = STATUS[status];
    const glyph = s.glyph ? icon(s.glyph, 16) : '<span class="ds-spinner ds-status__spinner" aria-hidden="true"></span>';
    return `<span class="ds-status ${s.className}">${glyph}<span>${s.label}</span></span>`;
  };

  const TILES = [
    { key: 'online', glyph: 'wifi', label: 'Online', value: (d) => d.filter((x) => x.status !== 'error').length, note: (d) => `of ${d.length} devices` },
    { key: 'busy', glyph: 'alert', label: 'Busy', value: (d) => d.filter((x) => x.status === 'warning').length, note: () => 'load above 60%' },
    { key: 'updating', glyph: 'sync', label: 'Updating', value: (d) => d.filter((x) => x.status === 'running').length, note: () => 'installing updates' },
    { key: 'load', glyph: 'cpu', label: 'Average load', value: (d) => Math.round(d.reduce((sum, x) => sum + x.load, 0) / d.length), note: () => 'across every device', suffix: '%' },
  ];

  function renderTiles() {
    const tiles = $('#live-tiles');
    if (!tiles.children.length) {
      DS.dom.morphHtml(tiles, TILES.map((tile) =>
        `<div class="ds-tile" data-ds-key="${tile.key}"><p class="ds-tile__label">${icon(tile.glyph, 16)}<span>${tile.label}</span></p>` +
        `<p class="ds-tile__value" data-tile="${tile.key}">0${tile.suffix || ''}</p><p class="ds-tile__note" data-note="${tile.key}"></p></div>`).join(''));
    }
    for (const tile of TILES) {
      M.countUp($(`[data-tile="${tile.key}"]`, tiles), tile.value(live.devices), { format: (n) => `${Math.round(n)}${tile.suffix || ''}` });
      $(`[data-note="${tile.key}"]`, tiles).textContent = tile.note(live.devices);
    }
  }

  const COLUMNS = [
    { key: 'name', label: 'Device', className: 'ds-col--text' },
    { key: 'type', label: 'Type', className: 'ds-col--secondary', sortable: false },
    { key: 'load', label: 'Load', className: 'ds-num' },
    { key: 'status', label: 'Status', className: 'demo-col-status' },
  ];

  function theadHtml() {
    return '<tr>' + COLUMNS.map((column) => {
      const sorted = live.sort.key === column.key;
      const attrs = `${column.className ? ` class="${column.className}"` : ''}${sorted ? ` aria-sort="${live.sort.dir}"` : ''}`;
      if (column.sortable === false) return `<th scope="col"${attrs}>${column.label}</th>`;
      return `<th scope="col"${attrs}><button class="ds-table__sort" type="button" data-sort="${column.key}">${column.label}${sorted ? icon('arrowUp', 16, 'ds-table__sort-arrow') : ''}</button></th>`;
    }).join('') + '</tr>';
  }

  function visibleDevices() {
    const q = live.query.trim().toLowerCase();
    const rows = live.devices.filter((device) =>
      (!q || [device.name, device.type, device.owner].some((text) => text.toLowerCase().includes(q))) &&
      (!live.statuses.size || live.statuses.has(device.status)));
    const { key, dir } = live.sort;
    const value = (device) => (key === 'status' ? STATUS_ORDER.indexOf(device.status) : device[key]);
    rows.sort((a, b) => {
      const x = value(a);
      const y = value(b);
      const order = typeof x === 'string' ? x.localeCompare(y) : x - y;
      return dir === 'ascending' ? order : -order;
    });
    return rows;
  }

  const rowHtml = (device) => `<tr data-ds-key="${device.id}">` +
    `<td class="ds-col--text"><button class="ds-link-btn" type="button" data-device="${device.id}">${esc(device.name)}</button></td>` +
    `<td class="ds-col--secondary">${esc(device.type)}</td>` +
    `<td class="ds-num">${device.load}%</td>` +
    `<td class="demo-col-status">${statusHtml(device.status)}</td></tr>`;

  const liveBody = $('#live-body');
  const liveEmpty = $('#live-empty');

  /* The active filters as input chips: each removes its filter; Clear filters removes them all. */
  const liveActive = $('#live-active');

  function activeHtml() {
    const chip = (key, text) => '<button class="ds-chip ds-chip--input" type="button" data-ds-key="' + key + '" data-remove="' + key + '" data-tip="' + esc(text) + '">' +
      '<span class="ds-chip__body"><span class="ds-chip__label"><span class="ds-sr">Remove filter </span>' + esc(text) + '</span>' + icon('close', 18, 'ds-chip__trailing') + '</span></button>';
    const chips = [];
    if (live.query.trim()) chips.push(chip('query', '"' + live.query.trim() + '"'));
    for (const box of $$('#live-chips input:checked')) chips.push(chip('status-' + box.value, box.nextElementSibling.textContent.trim()));
    if (chips.length) chips.push('<button class="ds-btn ds-btn--text ds-btn--sm" type="button" data-ds-key="clear" data-clear-filters>Clear filters</button>');
    return chips.join('');
  }

  function renderActive() {
    M.flip(liveActive, (morph) => DS.dom.morphHtml(liveActive, activeHtml(), morph));
  }

  function clearFilters() {
    live.query = '';
    live.statuses.clear();
    $('#live-search').value = '';
    for (const box of $$('#live-chips input')) box.checked = false;
    $('#live-search').focus();
    renderRows();
  }

  liveActive.addEventListener('click', (event) => {
    if (event.target.closest('[data-clear-filters]')) {
      clearFilters();
      return;
    }
    const chip = event.target.closest('[data-remove]');
    if (!chip) return;
    // Focus moves on before the chip goes: to a neighbouring chip, else the search field.
    const next = chip.nextElementSibling?.matches('.ds-chip') ? chip.nextElementSibling : chip.previousElementSibling;
    (next || $('#live-search')).focus();
    const key = chip.getAttribute('data-remove');
    if (key === 'query') {
      live.query = '';
      $('#live-search').value = '';
    } else {
      const box = $(`#live-chips input[value="${key.slice('status-'.length)}"]`);
      box.checked = false;
      live.statuses.delete(box.value);
    }
    renderRows();
  });

  function renderRows(options = {}) {
    const rows = visibleDevices();
    if (!options.live) renderActive();
    DS.dom.morphHtml($('#live-head'), theadHtml());
    M.flip(liveBody, (morph) => DS.dom.morphHtml(liveBody, rows.map(rowHtml).join(''), morph), { items: 'tr', live: !!options.live });
    // The empty state follows the rows: in with a fade when nothing is left, out when rows come back.
    const empty = $('.ds-empty', liveEmpty);
    if (!rows.length && !empty) {
      DS.dom.morphHtml(liveEmpty, '<div class="ds-empty"><span class="ds-empty__disc" aria-hidden="true">' + icon('search', 24) + '</span>' +
        '<p class="ds-empty__title">No device matches</p><p class="ds-empty__text">Try another word or clear the filters.</p>' +
        '<button class="ds-btn ds-btn--tonal" type="button" data-clear-filters>Clear filters</button></div>');
      M.enter($('.ds-empty', liveEmpty), 'fade');
    } else if (rows.length && empty && !empty.classList.contains('ds-leave')) {
      M.leave(empty);
    }
  }

  liveEmpty.addEventListener('click', (event) => {
    if (event.target.closest('[data-clear-filters]')) clearFilters();
  });

  $('#live-search').addEventListener('input', (event) => {
    live.query = event.target.value;
    renderRows();
  });

  $('#live-chips').addEventListener('change', () => {
    live.statuses = new Set($$('#live-chips input:checked').map((box) => box.value));
    renderRows();
  });

  $('#live-head').addEventListener('click', (event) => {
    const button = event.target.closest('[data-sort]');
    if (!button) return;
    const key = button.getAttribute('data-sort');
    live.sort = { key, dir: live.sort.key === key && live.sort.dir === 'ascending' ? 'descending' : 'ascending' };
    renderRows();
  });

  liveBody.addEventListener('click', (event) => {
    const button = event.target.closest('[data-device]');
    if (button) openSheet(button.getAttribute('data-device'), button);
  });

  /* One poll of the fake backend: loads wander, a status changes now and then. */
  function tick() {
    for (const device of live.devices) {
      if (device.status === 'error') {
        if (Math.random() < 0.25) { device.status = 'ok'; device.load = 8; }
        continue;
      }
      device.load = Math.max(1, Math.min(99, Math.round(device.load + (Math.random() - 0.5) * 34)));
      if (device.status === 'running') {
        if (Math.random() < 0.35) device.status = 'ok';
      } else {
        device.status = device.load > 60 ? 'warning' : 'ok';
        if (Math.random() < 0.06) device.status = 'running';
        else if (Math.random() < 0.04) { device.status = 'error'; device.load = 0; }
      }
    }
    renderTiles();
    renderRows({ live: true });
    if (sheetId && sheet.open) DS.dom.morphHtml(sheetBody, sheetHtml(byId(sheetId)));
  }

  let pollTimer = 0;
  function schedule() {
    clearTimeout(pollTimer);
    if (live.on) pollTimer = setTimeout(() => { if (!document.hidden) tick(); schedule(); }, 2800);
  }
  $('#live-switch').addEventListener('change', (event) => {
    live.on = event.target.checked;
    schedule();
  });
  // ?live=0 starts with the updates off (the browser tests click rows that must not move).
  if (new URLSearchParams(location.search).get('live') === '0') {
    live.on = false;
    $('#live-switch').checked = false;
  }

  renderTiles();
  renderRows();
  schedule();

  /* ── Overlays ─────────────────────────────────────────────────────── */

  const confirmDialog = $('#confirm');
  $('#open-dialog').addEventListener('click', (event) => DS.overlay.open(confirmDialog, { opener: event.currentTarget }));
  // While the delete runs the dialog stays open (data-ds-busy): Escape, the
  // backdrop and Cancel wait; the button shows that it works. Then it closes
  // with its reason, and the snackbar offers the undo.
  $('#confirm-delete').addEventListener('click', async (event) => {
    if (event.detail > 1 || confirmDialog.hasAttribute('data-ds-busy')) return;
    const button = event.currentTarget;
    const cancel = $('#confirm-cancel');
    confirmDialog.setAttribute('data-ds-busy', '');
    cancel.setAttribute('aria-disabled', 'true');
    try {
      await DS.motion.busy(button, () => new Promise((resolve) => { setTimeout(resolve, DS.motion.motionDuration(button, '--ds-dur-glide')); }), { done: false });
    } finally {
      confirmDialog.removeAttribute('data-ds-busy');
      cancel.removeAttribute('aria-disabled');
    }
    DS.overlay.close(confirmDialog, { reason: 'confirm' });
    undoToast('3 devices deleted.');
  });

  /* A snackbar with an action stays until it is used or closed; the
     action closes it and runs once. */
  function undoToast(text) {
    toast(text, { action: { label: 'Undo', onClick: () => toast('Restored. Nothing was lost.') } });
  }

  for (const button of $$('[data-toast]')) {
    button.addEventListener('click', () => {
      const kind = button.getAttribute('data-toast');
      if (kind === 'ok') toast('Saved. This message closes by itself.');
      else if (kind === 'error') toast('Could not reach the server. Errors stay until you close them.', { kind: 'error' });
      else undoToast('Ticket #4211 archived.');
    });
  }

  /* The side sheet: one device, previous and next with a shared-axis transition. */
  const sheet = $('#sheet');
  const sheetBody = $('#sheet-body');
  let sheetId = null;

  function sheetHtml(device) {
    return `<p class="ds-meta">${esc(device.type)} · ${esc(device.model)}</p>` +
      `<p>${statusHtml(device.status)}</p>` +
      '<dl class="ds-facts">' +
      `<div><dt>Owner</dt><dd>${esc(device.owner)}</dd></div>` +
      `<div><dt>Load</dt><dd>${device.load}%</dd></div>` +
      `<div><dt>Model</dt><dd>${esc(device.model)}</dd></div>` +
      `<div><dt>Device ID</dt><dd class="ds-nowrap">${esc(device.id.toUpperCase())}-${device.name.length * 97}</dd></div>` +
      '</dl>' +
      '<div class="ds-alert" role="status">' + icon('info', 20) + '<span class="ds-alert__text">The figures above stay live while the sheet is open: data updates patch in place, without a transition.</span></div>' +
      '<p class="ds-muted">Use the arrows in the head to step through the devices: the body slides along the axis you move on.</p>';
  }

  function fillSheet(id) {
    sheetId = id;
    const device = byId(id);
    $('#sheet-title').textContent = device.name;
    DS.dom.morphHtml(sheetBody, sheetHtml(device));
  }

  function openSheet(id, opener) {
    fillSheet(id);
    DS.overlay.open(sheet, { opener });
  }

  $('#open-sheet').addEventListener('click', (event) => openSheet(visibleDevices()[0]?.id || live.devices[0].id, event.currentTarget));
  for (const button of $$('[data-step]', sheet)) {
    button.addEventListener('click', () => {
      const delta = Number(button.getAttribute('data-step'));
      const list = live.devices;
      const next = list[(list.findIndex((device) => device.id === sheetId) + delta + list.length) % list.length];
      M.transition(() => { fillSheet(next.id); return sheetBody; }, { type: delta > 0 ? 'forward' : 'back', focus: true });
    });
  }

  /* The menu: DS.overlay does the keyboard, focus and placement. */
  const menu = $('#demo-menu');
  const menuTrigger = $('#open-menu');
  menuTrigger.addEventListener('click', () => {
    if (menuTrigger.getAttribute('aria-expanded') === 'true') DS.overlay.close(menu);
    else DS.overlay.open(menu, { opener: menuTrigger });
  });
  menuTrigger.addEventListener('keydown', (event) => {
    // ArrowDown opens on the first item, ArrowUp on the last.
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    DS.overlay.open(menu, { opener: menuTrigger });
  });
  menu.addEventListener('click', (event) => {
    const item = event.target.closest('.ds-menu__item');
    if (!item || item.getAttribute('aria-disabled') === 'true') return;
    if (item.getAttribute('role') === 'menuitemcheckbox') {
      const on = item.getAttribute('aria-checked') !== 'true';
      item.setAttribute('aria-checked', String(on));
      toast(on ? 'Pinned.' : 'Unpinned.');
    } else toast(`${$('.ds-menu__label', item).textContent}: a demo, so nothing happens.`, { kind: 'info' });
  });

  /* ── Feedback ─────────────────────────────────────────────────────── */

  const progress = $('#import-progress');
  const ring = $('#import-ring');
  const label = $('#import-label');
  const detail = $('#import-detail');
  const ROWS = 2030;

  function setShare(share, first) {
    const percent = Math.round(share * 100);
    // The bar, the ring and the figure, in one task: they land on the same frame.
    // DS.dom.progress() sets the share and its ARIA (and drops --indeterminate).
    DS.dom.progress(progress, share);
    DS.dom.progress(ring, share);
    M.countUp(label, percent, { format: (n) => `${Math.round(n)}%`, ...(first ? { from: 0 } : {}) });
    detail.textContent = `${Math.round(share * ROWS).toLocaleString('en-US')} of ${ROWS.toLocaleString('en-US')} rows`;
  }

  $('#run-import').addEventListener('click', (event) => {
    M.busy(event.currentTarget, async () => {
      // From 0, so the first share grows from the start; then unknown until the file is read.
      DS.dom.progress(progress, 0);
      DS.dom.progress(progress, null, { valueText: 'Preparing' });
      DS.dom.progress(ring, 0);
      label.textContent = 'Preparing';
      detail.textContent = 'Reading the file';
      await fake(1300);
      const steps = [0.14, 0.38, 0.55, 0.81, 1];
      for (let i = 0; i < steps.length; i += 1) {
        setShare(steps[i], i === 0);
        await fake(900);
      }
    }).then(() => toast('Import finished: 2,030 rows.'));
  });

  const deployStatus = $('#deploy-status');
  const deployHtml = (state) => ({
    waiting: `<span class="ds-status">${icon('clock', 16)}<span>Waiting</span></span>`,
    running: '<span class="ds-status ds-status--running"><span class="ds-spinner ds-status__spinner" aria-hidden="true"></span><span>Deploying</span></span>',
    ok: `<span class="ds-status ds-status--ok">${icon('check', 16)}<span>Live</span></span>`,
  })[state];
  DS.dom.morphHtml(deployStatus, deployHtml('waiting'));
  $('#deploy').addEventListener('click', (event) => {
    M.busy(event.currentTarget, async () => {
      DS.dom.morphHtml(deployStatus, deployHtml('running'));
      await fake(2200);
      DS.dom.morphHtml(deployStatus, deployHtml('ok'));
      await fake(2600);
      DS.dom.morphHtml(deployStatus, deployHtml('waiting'));
    });
  });

  const ALERT_POOL = [
    { kind: 'warning', glyph: 'alert', text: 'The certificate of the build server expires in 5 days.' },
    { kind: 'success', glyph: 'checkCircle', text: 'All laptops installed this week\'s updates.' },
    { kind: '', glyph: 'info', text: 'The nightly sync runs at 02:00.' },
    { kind: 'error', glyph: 'alertCircle', text: 'The warehouse scanner has not checked in for 2 hours.' },
  ];
  const alerts = { list: [ALERT_POOL[2], ALERT_POOL[0]].map((alert, index) => ({ ...alert, id: `a${index}` })), next: 2, pool: 1 };
  const alertStack = $('#alerts');

  function alertsHtml() {
    return alerts.list.map((alert) =>
      `<div class="ds-alert${alert.kind ? ` ds-alert--${alert.kind}` : ''}" data-ds-key="${alert.id}"${alert.kind === 'error' ? ' role="alert"' : ''}>${icon(alert.glyph, 20)}` +
      `<span class="ds-alert__text">${esc(alert.text)}</span><button class="ds-btn ds-btn--text ds-btn--sm" type="button" data-dismiss="${alert.id}">Dismiss</button></div>`).join('');
  }
  const renderAlerts = () => M.flip(alertStack, (morph) => DS.dom.morphHtml(alertStack, alertsHtml(), morph));
  DS.dom.morphHtml(alertStack, alertsHtml());

  $('#add-alert').addEventListener('click', () => {
    alerts.pool = (alerts.pool + 1) % ALERT_POOL.length;
    alerts.list.unshift({ ...ALERT_POOL[alerts.pool], id: `a${alerts.next++}` });
    if (alerts.list.length > 4) alerts.list.pop();
    renderAlerts();
  });
  alertStack.addEventListener('click', (event) => {
    const button = event.target.closest('[data-dismiss]');
    if (!button) return;
    alerts.list = alerts.list.filter((alert) => alert.id !== button.getAttribute('data-dismiss'));
    // flip() moves the focus to the next alert's Dismiss, and to "Add an alert" once none is left.
    M.flip(alertStack, (morph) => DS.dom.morphHtml(alertStack, alertsHtml(), morph), { refocus: () => $('#add-alert') });
  });

  /* ── Forms ────────────────────────────────────────────────────────── */

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

  const form = $('#demo-form');
  const MODELS = [
    ['Laptop 13 Air', 'Laptop, 13", 2024'], ['Laptop 14', 'Laptop, 14", 2022'], ['Laptop 14 Pro', 'Laptop, 14", 2023'],
    ['Laptop 16 Pro', 'Laptop, 16", 2023'], ['Desktop Mini', 'Desktop, 2023'], ['Workstation 7', 'Desktop, 2022'],
    ['Office Printer C4', 'Printer, colour'], ['Office Printer M2', 'Printer, black and white'], ['Tablet 11', 'Tablet, 11"'],
    ['Handheld Scanner 5', 'Scanner phone'], ['Rack Server 1U', 'Server, 1U'], ['Rack Server 2U', 'Server, 2U'],
  ];

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = $('#f-name');
    const owner = $('#f-owner');
    const model = $('#f-model');
    const errors = [
      setError(name, name.value.trim() ? '' : 'Give the device a name.'),
      setError(owner, !owner.value.trim() || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(owner.value.trim()) ? '' : 'This does not look like an email address.'),
      setError(model, !model.value.trim() || MODELS.some(([m]) => m === model.value) ? '' : 'Pick a model from the list.'),
    ];
    const first = [name, owner, model].find((input, index) => errors[index]);
    if (first) {
      first.focus();
      return;
    }
    const added = name.value.trim();
    await M.busy(event.submitter || $('[type="submit"]', form), () => fake(1200));
    toast(`${added} added.`);
    form.reset();
  });
  form.addEventListener('reset', () => {
    for (const input of $$('[aria-invalid]', form)) setError(input, '');
  });
  for (const input of $$('.ds-input', form)) input.addEventListener('input', () => { if (input.hasAttribute('aria-invalid')) setError(input, ''); });

  /* The combobox: the page filters and chooses; DS.overlay opens and closes the list. */
  const combo = {
    input: $('#f-model'),
    popup: $('#model-combo .ds-combo__popup'),
    list: $('#model-list'),
    status: $('#model-combo .ds-combo__status'),
    toggle: $('#model-combo .ds-combo__toggle'),
    matches: [],
    active: -1,
  };
  const comboOpen = () => combo.input.getAttribute('aria-expanded') === 'true';

  function comboRender(query) {
    const q = query.trim().toLowerCase();
    combo.matches = MODELS.map(([name, meta], index) => ({ name, meta, id: `model-${index}` }))
      .filter((model) => !q || model.name.toLowerCase().includes(q) || model.meta.toLowerCase().includes(q));
    combo.active = Math.min(combo.active, combo.matches.length - 1);
    // Nothing matches: the list hides, the popup stays with its status line.
    combo.list.hidden = !combo.matches.length;
    DS.dom.morphHtml(combo.list, combo.matches.map((model, index) =>
      `<li class="ds-combo__option" id="${model.id}" role="option" aria-selected="${model.name === combo.input.value}"${index === combo.active ? ' data-active' : ''}>` +
      `<span class="ds-combo__name">${esc(model.name)}</span><span class="ds-combo__meta">${esc(model.meta)}</span></li>`).join(''));
    combo.status.textContent = combo.matches.length ? `${combo.matches.length} of ${MODELS.length}` : 'No match';
    const active = combo.matches[combo.active];
    if (active) {
      combo.input.setAttribute('aria-activedescendant', active.id);
      document.getElementById(active.id).scrollIntoView({ block: 'nearest' });
    } else combo.input.removeAttribute('aria-activedescendant');
  }

  function comboShow(query) {
    comboRender(query);
    if (!comboOpen()) DS.overlay.open(combo.popup, { opener: combo.input });
  }

  function comboChoose(model) {
    combo.input.value = model.name;
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
      if (!comboOpen()) comboRender('');
      const count = combo.matches.length;
      if (!count) return;
      combo.active = event.key === 'ArrowDown' ? (combo.active + 1) % count : (combo.active <= 0 ? count - 1 : combo.active - 1);
      comboShow(comboOpen() ? combo.input.value : '');
    } else if (event.key === 'Enter' && comboOpen()) {
      event.preventDefault();
      const model = combo.matches[combo.active] || (combo.matches.length === 1 ? combo.matches[0] : null);
      if (model) comboChoose(model);
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
    const model = option && combo.matches.find((m) => m.id === option.id);
    if (model) comboChoose(model);
  });

  /* ── Forms: a CSV import ──────────────────────────────────────────── */

  const csv = { files: [], next: 1 };
  const csvList = $('#csv-files');
  const csvZone = $('#csv-zone');

  /* A row of the list (.ds-list) per file: its name and state, its upload
     progress (the share in the template, so a re-render keeps it) and a
     remove button. */
  function csvHtml() {
    return csv.files.map((file) => {
      const percent = Math.round(file.share * 100);
      return `<li class="ds-list__item" data-ds-key="${file.id}">${icon('fileText', 20, 'ds-list__icon')}` +
        `<span class="ds-list__text"><span class="ds-list__title">${esc(file.name)}</span><span class="ds-list__meta">${percent === 100 ? 'Uploaded' : `${percent}%`}</span></span>` +
        `<div class="ds-progress ds-progress--flat demo-file__progress" style="--ds-progress: ${file.share}"><div class="ds-progress__track" role="progressbar" aria-label="Upload of ${esc(file.name)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><div class="ds-progress__bar"></div></div></div>` +
        `<span class="ds-list__actions"><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Remove ${esc(file.name)}" data-tip="Remove" data-remove="${file.id}">${icon('close', 20)}</button></span></li>`;
    }).join('');
  }
  const renderCsv = () => M.flip(csvList, (morph) => DS.dom.morphHtml(csvList, csvHtml(), morph), { refocus: () => $('.ds-dropzone__input', csvZone) });

  async function upload(file) {
    for (const share of [0.3, 0.65, 1]) {
      await fake(500 + Math.random() * 500);
      if (!csv.files.includes(file)) return;
      file.share = share;
      DS.dom.morphHtml(csvList, csvHtml());
    }
  }

  // Files by drop, by the file dialog and, with the focus in the zone, from the clipboard: one handler.
  DS.dom.dropzone(csvZone, {
    paste: true,
    onFiles: (files) => {
      const added = files.map((file) => ({ id: `f${csv.next++}`, name: file.name, share: 0 }));
      csv.files.push(...added);
      renderCsv();
      added.forEach(upload);
    },
  });
  csvList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove]');
    if (!button) return;
    csv.files = csv.files.filter((file) => file.id !== button.getAttribute('data-remove'));
    renderCsv();
  });

  /* ── Theme it ─────────────────────────────────────────────────────── */

  const themeForm = $('#theme-form');
  const themeCode = $('#theme-code');

  function showTheme(choice) {
    themeCode.textContent = DemoTheme.css(choice);
    for (const name in choice) {
      const input = $(`input[name="${name}"][value="${choice[name]}"]`, themeForm);
      if (input) input.checked = true;
    }
  }

  themeForm.addEventListener('change', () => {
    const data = new FormData(themeForm);
    showTheme(DemoTheme.apply({ accent: data.get('accent'), shape: data.get('shape'), density: data.get('density'), scheme: data.get('scheme') }));
  });
  themeForm.addEventListener('reset', (event) => {
    event.preventDefault();
    showTheme(DemoTheme.apply({}));
  });
  $('#copy-theme').addEventListener('click', () => copy(themeCode.textContent, 'Theme copied: save it as theme.css.'));
  showTheme(DemoTheme.saved());

  /* ── Icons ────────────────────────────────────────────────────────── */

  const NAMES = Object.keys(DS.icons).filter((name) => typeof DS.icons[name] === 'string' && DS.icons[name].startsWith('<')).sort();
  const grid = $('#icon-grid');
  const iconEmpty = $('#icon-empty');

  function renderIcons(query = '') {
    const q = query.trim().toLowerCase();
    const shown = NAMES.filter((name) => name.toLowerCase().includes(q));
    const html = shown.map((name) => `<li data-ds-key="${name}"><button class="demo-icon" type="button" data-ds-ripple data-name="${name}" aria-label="Copy ${name}">${icon(name, 24)}<span>${name}</span></button></li>`).join('');
    M.flip(grid, (morph) => DS.dom.morphHtml(grid, html, morph), { items: 'li' });
    const empty = $('.ds-empty', iconEmpty);
    if (!shown.length && !empty) {
      DS.dom.morphHtml(iconEmpty, `<div class="ds-empty"><span class="ds-empty__disc" aria-hidden="true">${icon('image', 24)}</span><p class="ds-empty__title">No icon by that name</p></div>`);
      M.enter($('.ds-empty', iconEmpty), 'fade');
    } else if (shown.length && empty && !empty.classList.contains('ds-leave')) M.leave(empty);
  }
  DS.dom.morphHtml(grid, NAMES.map((name) => `<li data-ds-key="${name}"><button class="demo-icon" type="button" data-ds-ripple data-name="${name}" aria-label="Copy ${name}">${icon(name, 24)}<span>${name}</span></button></li>`).join(''));
  $('#icon-search').addEventListener('input', (event) => renderIcons(event.target.value));
  grid.addEventListener('click', (event) => {
    const button = event.target.closest('[data-name]');
    if (button) copy(`DS.icons.icon(DS.icons.${button.getAttribute('data-name')}, 20)`, `Copied DS.icons.${button.getAttribute('data-name')}.`);
  });

  /* ── Get started ──────────────────────────────────────────────────── */

  $('#copy-start').addEventListener('click', () => copy($('#start-code').textContent, 'Snippet copied.'));

  /* A link to a section (#theme) lands there at once. */
  if (location.hash.length > 1 && document.getElementById(location.hash.slice(1))?.classList.contains('demo-section')) {
    goTo(location.hash.slice(1), { instant: true });
  }
  root.setAttribute('data-demo-ready', '');
})();
