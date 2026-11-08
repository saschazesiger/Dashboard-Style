/*
 * The live tour (demo/index.html): one page that walks through what
 * Dashboard-Style 3.0 does, every demo wired the way a project wires it,
 * on a bundle of only the components the page uses (ds/, written by
 * tools/bundle.mjs from ds.config.json).
 *
 *   frame       DS.core.init(document): the shell (rail, modal drawer, the
 *               drawer's pill, data-scrolled), the scheme switches, the
 *               ripple, the guard and the tooltips; the scroll spy, the
 *               speed switch, the command palette (Ctrl+K)
 *   lazy stops  every stop below the welcome waits inside data-ds-managed
 *               until it comes near the viewport: then its icons are drawn,
 *               DS.core.init() takes it over part by part (each part a task of
 *               its own, so no task runs long on a slow phone) and its
 *               setup steps run. Its CSS skips rendering while it is far
 *               away (content-visibility, demo.css).
 *   actions     busy and done, an icon swap, toggle groups, split and menu
 *               buttons, the priority bar, copy
 *   forms       a parent checkbox, the slider, dates and times, numbers,
 *               tags, password, a code field; a form with validation and a
 *               combobox; a CSV import (DS.dom.dropzone, a list through flip)
 *   data        the data grid, charts with new data, a tracker, a tree, JSON
 *   live        a fake backend: tiles (countUp), rows (flip with morphHtml,
 *               live), status chips, search, chips, sort, the empty state;
 *               it polls only while the stop is in view
 *   overlays    dialog, side sheet (transition forward and back), menu,
 *               snackbars with an undo; popover and toggletip by markup
 *   feedback    progress with its figure, a status that changes, alerts that
 *               come and go (flip), the steps of a job
 *   navigation  steps driven by Back and Next, a segmented mode, pages
 *   layout      a dashboard panel that refreshes
 *   people      personas, a group that grows
 *   content     Markdown as you type, a log that streams while in view
 *   chat        a transcript with a composer, a streamed reply
 *   theme       theme.js plus the generator (styleguide/theme-generator.js,
 *               loaded on the first colour of the visitor's own)
 *   icons       the set, filtered with flip, copied on click
 *
 * Re-renders go through DS.dom.morphHtml, never innerHTML; JS timing that
 * belongs to motion comes from the tokens (motionDuration). The ms in
 * `fake` are the fake backend's latency, not motion.
 */
(function () {
  'use strict';

  const M = DS.motion;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const icon = (name, size = 20, className) => DS.icons.icon(DS.icons[name], size, className);
  const esc = (text) => String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  /* The fake backend: answers after a latency. */
  const fake = (ms, value) => new Promise((resolve) => setTimeout(() => resolve(value), ms));
  /* Gives the main thread back between two steps of work (a task each): the browser paints and answers input. */
  const breathe = () => (globalThis.scheduler?.yield ? globalThis.scheduler.yield() : new Promise((resolve) => setTimeout(resolve)));
  const params = new URLSearchParams(location.search);
  const TIMING = params.has('timing');

  const root = document.documentElement;
  const app = $('#app');
  const view = $('#main');
  const drawer = $('#drawer');
  const nav = $('#nav');
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

  /* Icons of the static markup: data-icon through DS.icons.fill(); data-glyph="name size class" for a glyph
     that carries a class of its own (a chevron, a menu or chip check, a fillable icon). */
  function drawIcons(scope) {
    DS.icons.fill(scope);
    for (const holder of $$('[data-glyph]', scope)) {
      const [name, size, ...classes] = holder.getAttribute('data-glyph').split(' ');
      holder.replaceWith(DS.icons.iconElement(DS.icons[name], Number(size) || 20, classes.join(' ') || undefined));
    }
  }

  /* ── Frame ─────────────────────────────────────────────────────────── */

  for (const part of [$('.ds-topbar'), drawer, $('#welcome'), $('#palette'), $('#confirm'), $('#sheet'), $('#demo-menu')]) drawIcons(part);
  $('#version').textContent = DS.version;

  // The ripple with the action guard, and the tooltips, for the whole page; then DS.core.init(): the shell,
  // the scheme switches and every behaviour of the frame now, of each stop once it leaves data-ds-managed.
  DS.ripple.attach(document);
  DS.overlay.tooltips(document);
  DS.core.init(document);

  /* The appearance switches (top bar and Theme it) pin the scheme; the tour keeps the choice with its theme. */
  document.addEventListener('ds:change', (event) => {
    if (event.target.matches?.('[data-ds-scheme-switch]')) DemoTheme.appearance(event.detail.value);
  });

  const sections = $$('.demo-section');
  const tourItems = $$('.ds-drawer__item[href^="#"]', nav);

  function setCurrent(id) {
    for (const item of tourItems) {
      if (item.getAttribute('href') === `#${id}`) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    }
  }

  /* While a link scrolls the view smoothly, the spy keeps still (otherwise the pill walks through every
     stop) and no stop on the way sets itself up. */
  let jumping = false;
  let jumpTimer = 0;
  function whenScrollEnds(done) {
    if ('onscrollend' in view) {
      view.addEventListener('scrollend', done, { once: true });
      return;
    }
    const quiet = () => {
      clearTimeout(jumpTimer);
      jumpTimer = setTimeout(() => { view.removeEventListener('scroll', quiet); done(); }, M.motionDuration(view, '--ds-dur-fast'));
    };
    view.addEventListener('scroll', quiet);
    quiet();
  }

  /* The current stop: the last one whose top passed the upper third of the view (the last one at the bottom). */
  function spy() {
    if (jumping) return;
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

  const offsetOf = (section) => section.getBoundingClientRect().top - view.getBoundingClientRect().top;

  function goTo(id, options = {}) {
    const section = document.getElementById(id);
    if (!section) return;
    if (app.hasAttribute('data-drawer-open')) DS.overlay.close(drawer);
    setCurrent(id);
    const ready = setUp(section);
    const before = view.scrollTop;
    section.scrollIntoView({ behavior: options.instant ? 'auto' : 'smooth', block: 'start' });
    const title = $('h1, h2', section);
    if (title) {
      title.setAttribute('tabindex', '-1');
      title.focus({ preventScroll: true });
    }
    history.replaceState(null, '', `${location.search}#${id}`);
    // Stops above the target that render on the way may change its place (a phone has no scroll anchoring
    // everywhere): once the scroll and the stop's setup are done, the view lines it up again, at once.
    const align = () => ready.then(() => {
      jumping = false;
      if (Math.abs(offsetOf(section) - scrollMargin(section)) > 2) section.scrollIntoView({ behavior: 'auto', block: 'start' });
      spy();
      observeAll();
    });
    if (options.instant || Math.abs(offsetOf(section) - scrollMargin(section)) < 2 && Math.abs(view.scrollTop - before) < 1) {
      align();
      return;
    }
    jumping = true;
    whenScrollEnds(align);
  }
  const scrollMargin = (section) => parseFloat(getComputedStyle(section).scrollMarginTop) || 0;

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const id = link.getAttribute('href').slice(1);
    if (!id || id === 'main' || !document.getElementById(id)?.classList.contains('demo-section')) return;
    event.preventDefault();
    goTo(id);
  });

  /* ── Speed: --ds-time-scale, like the styleguide's speed select ───── */

  const speedNav = $('#speed');
  DS.indicator.create(speedNav, { active: '[aria-current="true"]', className: 'ds-segmented__indicator' });

  function setSpeed(factor, announce) {
    for (const option of $$('.ds-segmented__option', speedNav)) {
      if (Number(option.getAttribute('data-speed')) === factor) option.setAttribute('aria-current', 'true');
      else option.removeAttribute('aria-current');
    }
    if (factor < 1) root.style.setProperty('--ds-time-scale', String(1 / factor));
    else root.style.removeProperty('--ds-time-scale');
    const next = new URLSearchParams(location.search);
    if (factor < 1) next.set('speed', String(factor));
    else next.delete('speed');
    history.replaceState(null, '', `${next.size ? `?${next}` : location.pathname}${location.hash}`);
    if (announce) toast(factor < 1 ? 'Slow motion: every animation runs at a fifth of its speed.' : 'Back to normal speed.', { kind: 'info' });
  }

  speedNav.addEventListener('click', (event) => {
    const option = event.target.closest('.ds-segmented__option');
    if (!option) return;
    event.preventDefault();
    setSpeed(Number(option.getAttribute('data-speed')), true);
  });
  const askedSpeed = Number(params.get('speed'));
  if (askedSpeed > 0 && askedSpeed < 1) setSpeed(askedSpeed, false);

  /* ── Welcome: the tiles count up once ─────────────────────────────── */

  for (const value of $$('#facts .ds-tile__value[data-count]')) {
    const suffix = value.getAttribute('data-suffix') || '';
    M.countUp(value, Number(value.getAttribute('data-count')), { format: (n) => `${Math.round(n)}${suffix}`, from: 0 });
  }

  /* ── Lazy stops ────────────────────────────────────────────────────── */

  /* The parts of a stop that DS.core.init() takes over one at a time: each card, and inside one each date or
     time field (their Intl work is the heaviest of a stop). */
  const PARTS = ['.ds-grid-2 > *', '.ds-grid > *', '.demo-section > .ds-card', '.demo-section > figure', '.demo-section > .ds-splitpane', '.demo-chat > *',
    '.ds-picker', '.ds-timerange', '.ds-combo', '.ds-message', '[data-ds-chart]', '[data-ds-tree]', '[data-ds-jsonview]', '[data-ds-diff]', '[data-ds-logview]',
    '[data-ds-taginput]', '[data-ds-number]', '[data-ds-password]', '[data-ds-otp]', '[data-ds-tabs]', '[data-ds-breadcrumbs]', '[data-ds-steps]',
    '[data-ds-prioritybar]', '[data-ds-splitbutton]', '[data-ds-menubutton]', '[data-ds-toggle-group]', '[data-ds-avatar-group]', '[data-ds-code]'].join(', ');

  /* What each stop wires once DS.core.init() took it over: a list of steps, each a task of its own. */
  const SETUP = {};
  /* The stops in view (no margin): live data and streams run only there. */
  const inView = new Set();
  const started = new Map();
  let queue = Promise.resolve();

  /* Sets a stop up once: icons, then DS.core.init() on the stop and on each of its parts that waits in a
     data-ds-managed of its own, then the stop's steps. Stops set up one after the other. */
  function setUp(section) {
    if (started.has(section.id)) return started.get(section.id);
    if (!section.hasAttribute('data-ds-managed')) {
      const done = Promise.resolve();
      started.set(section.id, done);
      section.setAttribute('data-demo-ready', '');
      return done;
    }
    nearby.unobserve(section);
    const done = queue = queue.then(async () => {
      await breathe();
      let t = performance.now();
      const lap = (what) => { const now = performance.now(); if (TIMING) console.log(`TIMING ${section.id} ${what} ${Math.round(now - t)}ms`); t = now; };
      drawIcons(section);
      lap('icons');
      // Each part waits on its own, so DS.core.init() takes the stop over one part per task.
      for (const part of $$(PARTS, section)) part.setAttribute('data-ds-managed', '');
      section.removeAttribute('data-ds-managed');
      DS.core.init(section);
      lap('init');
      for (const part of $$('[data-ds-managed]', section)) {
        await breathe();
        t = performance.now();
        part.removeAttribute('data-ds-managed');
        DS.core.init(part);
        lap(`init ${part.id || part.className}`);
      }
      for (const [index, step] of (SETUP[section.id] || []).entries()) {
        await breathe();
        t = performance.now();
        try { step(section); } catch (error) { reportError(error); }
        lap(`step ${index}`);
      }
      section.setAttribute('data-demo-ready', '');
    });
    started.set(section.id, done);
    return done;
  }

  /* Half a view ahead: a stop is ready by the time it scrolls in. */
  const nearby = new IntersectionObserver((entries) => {
    if (jumping) return;
    for (const entry of entries) if (entry.isIntersecting) setUp(entry.target);
  }, { root: view, rootMargin: '50% 0px' });
  const watcher = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) inView.add(entry.target.id);
      else inView.delete(entry.target.id);
      entry.target.dispatchEvent(new CustomEvent('demo:view', { detail: { visible: entry.isIntersecting } }));
    }
  }, { root: view });
  function observeAll() {
    for (const section of sections) if (!started.has(section.id)) nearby.observe(section);
  }
  for (const section of sections) watcher.observe(section);

  /* ── Actions ───────────────────────────────────────────────────────── */

  /* Any [data-say] action of a stop says what it did in a snackbar. */
  function sayOnPress(section) {
    section.addEventListener('click', (event) => {
      const action = event.target.closest('[data-say]');
      if (action && action.getAttribute('aria-disabled') !== 'true') toast(action.getAttribute('data-say'));
    });
  }

  SETUP.actions = [
    (section) => {
      sayOnPress(section);
      $('#save-demo').addEventListener('click', (event) => {
        M.busy(event.currentTarget, () => fake(1400)).then(() => toast('Changes saved.'));
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
      $('#view-toggle').addEventListener('ds:change', (event) => {
        $('#view-out').textContent = `View: ${event.detail.value}`;
      });
      $('#sort-button').addEventListener('ds:change', (event) => {
        toast(`Sorted by ${event.detail.item.textContent.trim().toLowerCase()}.`);
      });
    },
  ];

  /* ── Forms ─────────────────────────────────────────────────────────── */

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

  const MODELS = ['Laptop 13 Air', 'Laptop 14', 'Laptop 14 Pro', 'Laptop 16 Pro', 'Desktop Mini', 'Workstation 7', 'Office Printer C4', 'Rack Server 1U', 'Rack Server 2U'];

  SETUP.forms = [
    () => {
      const checkAll = $('#check-all');
      const channels = $$('[data-channel]');
      const syncParent = () => {
        const on = channels.filter((box) => box.checked).length;
        checkAll.checked = on === channels.length;
        checkAll.indeterminate = on > 0 && on < channels.length;
      };
      checkAll.addEventListener('change', () => {
        for (const box of channels) box.checked = checkAll.checked;
        syncParent();
      });
      for (const box of channels) box.addEventListener('change', syncParent);
      syncParent();

      // The slider's active part and its words follow the value (docs: Slider).
      const slider = $('#volume');
      const output = $('#volume-value');
      const share = () => {
        slider.style.setProperty('--ds-share', String((slider.value - slider.min) / (slider.max - slider.min)));
        output.value = `${slider.value}%`;
      };
      slider.addEventListener('input', share);
      share();

      $('#time-range').addEventListener('ds:change', (event) => { $('#range-said').textContent = `?${event.detail.query}`; });
      $('#otp').addEventListener('ds:complete', (event) => {
        const right = event.detail.value === '123456';
        toast(right ? 'Code accepted.' : 'That code is not right: try 123456.', right ? undefined : { kind: 'error' });
      });
    },
    () => {
      const form = $('#demo-form');
      const model = $('#f-model');
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const name = $('#f-name');
        const owner = $('#f-owner');
        const errors = [
          setError(name, name.value.trim() ? '' : 'Give the device a name.'),
          setError(owner, !owner.value.trim() || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(owner.value.trim()) ? '' : 'This does not look like an email address.'),
          setError(model, !model.value.trim() || MODELS.includes(model.value) ? '' : 'Pick a model from the list.'),
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
        DS.core.get($('#model-combo'), 'combobox')?.set(null);
      });
      for (const input of $$('.ds-input', form)) input.addEventListener('input', () => { if (input.hasAttribute('aria-invalid')) setError(input, ''); });
      $('#model-combo').addEventListener('ds:change', () => setError(model, ''));
    },
    () => {
      /* A CSV import: a row of the list (.ds-list) per file, its upload progress, a remove button. */
      const csv = { files: [], next: 1 };
      const list = $('#csv-files');
      const zone = $('#csv-zone');
      const html = () => csv.files.map((file) => {
        const percent = Math.round(file.share * 100);
        return `<li class="ds-list__item" data-ds-key="${file.id}">${icon('fileText', 20, 'ds-list__icon')}` +
          `<span class="ds-list__text"><span class="ds-list__title">${esc(file.name)}</span><span class="ds-list__meta">${percent === 100 ? 'Uploaded' : `${percent}%`}</span></span>` +
          `<div class="ds-progress ds-progress--flat demo-file__progress" style="--ds-progress: ${file.share}"><div class="ds-progress__track" role="progressbar" aria-label="Upload of ${esc(file.name)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><div class="ds-progress__bar"></div></div></div>` +
          `<span class="ds-list__actions"><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Remove ${esc(file.name)}" data-tip="Remove" data-remove="${file.id}">${icon('close', 20)}</button></span></li>`;
      }).join('');
      const render = () => M.flip(list, (morph) => DS.dom.morphHtml(list, html(), morph), { refocus: () => $('.ds-dropzone__input', zone) });
      const upload = async (file) => {
        for (const share of [0.3, 0.65, 1]) {
          await fake(500 + Math.random() * 500);
          if (!csv.files.includes(file)) return;
          file.share = share;
          DS.dom.morphHtml(list, html());
        }
      };
      // Files by drop, by the file dialog and, with the focus in the zone, from the clipboard: one handler.
      DS.dom.dropzone(zone, {
        paste: true,
        onFiles: (files) => {
          const added = files.map((file) => ({ id: `f${csv.next++}`, name: file.name, share: 0 }));
          csv.files.push(...added);
          render();
          added.forEach(upload);
        },
      });
      list.addEventListener('click', (event) => {
        const button = event.target.closest('[data-remove]');
        if (!button) return;
        csv.files = csv.files.filter((file) => file.id !== button.getAttribute('data-remove'));
        render();
      });
    },
  ];

  /* ── Data display ──────────────────────────────────────────────────── */

  const OWNERS = ['Ada Lovelace', 'Alan Turing', 'Grace Hopper', 'Katherine Johnson', 'Edsger Dijkstra', 'Barbara Liskov'];
  const GRID_MODELS = ['Laptop 14', 'Laptop 13', 'Desktop 7', 'Laptop 15', 'Tablet 13', 'Tablet 11'];
  const PLACES = ['Building A, 1st floor', 'Building A, 2nd floor', 'Server room', 'Building B, ground floor', 'Storage'];
  const STATE_OF = (load) => (load >= 90 ? ['error', 'alert', 'Overloaded'] : load >= 75 ? ['warning', 'alert', 'High load'] : load < 10 ? ['neutral', 'clock', 'Idle'] : ['success', 'check', 'Active']);
  const TONES = { error: 'ds-tone-error', warning: 'ds-tone-warning', neutral: 'ds-tone-neutral', success: 'ds-tone-success' };

  /* A deterministic fleet: every visit shows the same rows. */
  function fleet(count) {
    const rows = [];
    for (let i = 0; i < count; i += 1) {
      rows.push({
        id: `d${i + 1}`,
        name: `${i % 3 === 2 ? 'DESKTOP-' : 'LAPTOP-'}${String(100 + i * 7).padStart(4, '0')}`,
        model: GRID_MODELS[i % GRID_MODELS.length],
        owner: OWNERS[(i * 5) % OWNERS.length],
        place: PLACES[(i * 7) % PLACES.length],
        load: (i * 37 + 11) % 100,
        tickets: (i * 13) % 9,
      });
    }
    return rows;
  }

  /* Smooth, repeatable values around `base`. */
  const wave = (count, base, swing, phase) => Array.from({ length: count }, (_, i) => Math.round(base + swing * Math.sin((i + phase) / 3.2) + swing * 0.4 * Math.cos((i + phase) * 1.7)));

  SETUP.data = [
    () => {
      // The selection bar waits outside the page until a row is selected: its buttons are taken now.
      const retire = $('#grid-retire');
      const grid = DS.datagrid.create($('#grid'), {
        columns: [
          { key: 'name', label: 'Device', sortable: true, className: 'ds-nowrap' },
          { key: 'model', label: 'Model', sortable: true, className: 'ds-nowrap' },
          { key: 'owner', label: 'Owner', sortable: true, className: 'ds-nowrap', edit: { type: 'select', options: OWNERS } },
          { key: 'place', label: 'Location', sortable: true, hidden: true, className: 'ds-nowrap' },
          { key: 'tickets', label: 'Tickets', type: 'number', sortable: true, summary: 'sum' },
          { key: 'load', label: 'Load', type: 'number', sortable: true, summary: 'avg', format: (value) => (value === null || value === undefined ? '' : `${Math.round(value)}%`) },
          { key: 'status', label: 'Status', value: (row) => row.load, filterable: false,
            render: (row) => { const [tone, glyph, word] = STATE_OF(row.load); return `<span class="ds-status ${TONES[tone]}">${icon(glyph, 16)}<span>${word}</span></span>`; },
            export: true, exportValue: (row) => STATE_OF(row.load)[2] },
        ],
        rows: fleet(40),
        select: 'multiple',
        bar: $('#grid-bar'),
        multiSort: true,
        resize: true,
        chooser: $('#grid-columns'),
        actions: (row) => `<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Actions for ${esc(row.name)}" aria-haspopup="menu" aria-expanded="false" data-ds-datagrid-menu>${icon('moreVertical', 20)}</button>`,
        menu: $('#grid-menu'),
        sort: [{ key: 'name', dir: 'ascending' }],
        page: { size: 8 },
        pager: $('#grid-pages'),
      });
      $('#grid').addEventListener('ds:action', (event) => {
        const { action, row } = event.detail;
        toast(`${{ open: 'Opened', ticket: 'New ticket for', retire: 'Retiring stays a demo:' }[action]} ${row.name}.`, { kind: 'info' });
      });
      $('#grid').addEventListener('ds:edit', (event) => toast(`Saved the ${event.detail.column} of ${event.detail.row.name}.`));
      $('#grid-filter').addEventListener('input', (event) => grid.set({ filter: event.target.value }));
      retire.addEventListener('click', () => toast(`Retiring ${grid.get().selection.count} devices stays a demo.`, { kind: 'info' }));
    },
    () => {
      // The tracker: one cell per day, each state with its shape and its words.
      const WORDS = { success: 'up', warning: 'degraded', error: 'down' };
      const CELLS = { success: 'ds-tracker__cell--success', warning: 'ds-tracker__cell--warning', error: 'ds-tracker__cell--error' };
      const special = { 12: 'warning', 13: 'warning', 31: 'error', 47: 'warning' };
      const days = Array.from({ length: 60 }, (_, i) => {
        const date = new Date(Date.UTC(2026, 10, 4 - (59 - i)));
        const state = special[i] || 'success';
        return { state, label: `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}: ${WORDS[state]}` };
      });
      DS.dom.morphHtml($('#tracker'), days.map((day) => `<span class="ds-tracker__cell ${CELLS[day.state]}" role="img" aria-label="${day.label}" data-tip="${day.label}"></span>`).join(''));
      const counts = DS.tracker.counts(days);
      $('#tracker-summary').textContent = `${((counts.success + counts.warning * 0.5) / counts.total * 100).toFixed(1)}% uptime, ${counts.error} failure in ${counts.total} days`;

      let tick = 0;
      $('#chart-new').addEventListener('click', () => {
        tick += 1;
        DS.core.get($('#chart-line'), 'chart')?.set({ series: [{ name: 'API', values: wave(24, 220 + (tick % 3) * 30, 50, tick * 2) }, { name: 'Web', values: wave(24, 320 - (tick % 2) * 40, 60, tick * 3 + 4) }] });
        DS.core.get($('#chart-columns'), 'chart')?.set({ series: [{ name: 'Low', values: wave(7, 7, 3, tick) }, { name: 'Normal', values: wave(7, 12, 4, tick + 2) }, { name: 'High', values: wave(7, 3, 2, tick + 1) }] });
      });
    },
  ];

  /* ── Live data ─────────────────────────────────────────────────────── */

  const STATUS = {
    ok: { label: 'OK', className: 'ds-tone-success', glyph: 'check' },
    warning: { label: 'Busy', className: 'ds-tone-warning', glyph: 'alert' },
    running: { label: 'Updating', className: 'ds-status--running', glyph: null },
    error: { label: 'Offline', className: 'ds-tone-error', glyph: 'wifiOff' },
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
    on: params.get('live') !== '0',
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

  function activeHtml() {
    const chip = (key, text) => '<button class="ds-chip ds-chip--input" type="button" data-ds-key="' + key + '" data-remove="' + key + '" data-tip="' + esc(text) + '">' +
      '<span class="ds-chip__body"><span class="ds-chip__label"><span class="ds-sr">Remove filter </span>' + esc(text) + '</span>' + icon('close', 18, 'ds-chip__trailing') + '</span></button>';
    const chips = [];
    if (live.query.trim()) chips.push(chip('query', '"' + live.query.trim() + '"'));
    for (const box of $$('#live-chips input:checked')) chips.push(chip('status-' + box.value, box.nextElementSibling.textContent.trim()));
    if (chips.length) chips.push('<button class="ds-btn ds-btn--text ds-sm" type="button" data-ds-key="clear" data-clear-filters>Clear filters</button>');
    return chips.join('');
  }

  function renderRows(options = {}) {
    const rows = visibleDevices();
    const body = $('#live-body');
    const empty = $('#live-empty');
    DS.dom.morphHtml($('#live-head'), theadHtml());
    // The first render has nothing to glide from: the rows simply arrive.
    if (options.first) {
      DS.dom.morphHtml(body, rows.map(rowHtml).join(''));
      return;
    }
    if (!options.live) M.flip($('#live-active'), (morph) => DS.dom.morphHtml($('#live-active'), activeHtml(), morph));
    M.flip(body, (morph) => DS.dom.morphHtml(body, rows.map(rowHtml).join(''), morph), { items: 'tr', live: !!options.live });
    // The empty state follows the rows: in with a fade when nothing is left, out when rows come back.
    const shown = $('.ds-empty', empty);
    if (!rows.length && !shown) {
      DS.dom.morphHtml(empty, '<div class="ds-empty"><span class="ds-empty__disc" aria-hidden="true">' + icon('search', 24) + '</span>' +
        '<p class="ds-empty__title">No device matches</p><p class="ds-empty__text">Try another word or clear the filters.</p>' +
        '<button class="ds-btn ds-btn--tonal" type="button" data-clear-filters>Clear filters</button></div>');
      M.enter($('.ds-empty', empty), 'fade');
    } else if (rows.length && shown && !shown.classList.contains('ds-leave')) {
      M.leave(shown);
    }
  }

  function clearFilters() {
    live.query = '';
    live.statuses.clear();
    $('#live-search').value = '';
    for (const box of $$('#live-chips input')) box.checked = false;
    $('#live-search').focus();
    renderRows();
  }

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
    if (sheetId && $('#sheet').open) DS.dom.morphHtml($('#sheet-body'), sheetHtml(byId(sheetId)));
  }

  let pollTimer = 0;
  /* The backend is asked only while the stop is in view and the page shows. */
  function schedule() {
    clearTimeout(pollTimer);
    if (live.on && inView.has('live')) pollTimer = setTimeout(() => { if (!document.hidden) tick(); schedule(); }, 2800);
  }

  SETUP.live = [
    () => {
      if (!live.on) $('#live-switch').checked = false;
      renderTiles();
    },
    () => renderRows({ first: true }),
    (section) => {
      // The wrapper says which ends have more columns: on a phone it fades at the side that still has some.
      DS.dom.scrollEdges($('#live-body').closest('.ds-table-wrap'));
      $('#live-switch').addEventListener('change', (event) => {
        live.on = event.target.checked;
        schedule();
      });
      section.addEventListener('demo:view', schedule);
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
      $('#live-body').addEventListener('click', (event) => {
        const button = event.target.closest('[data-device]');
        if (button) openSheet(button.getAttribute('data-device'), button);
      });
      $('#live-empty').addEventListener('click', (event) => {
        if (event.target.closest('[data-clear-filters]')) clearFilters();
      });
      $('#live-active').addEventListener('click', (event) => {
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
      schedule();
    },
  ];

  /* ── Overlays ──────────────────────────────────────────────────────── */

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

  for (const button of $$('[data-step]', sheet)) {
    button.addEventListener('click', () => {
      const delta = Number(button.getAttribute('data-step'));
      const list = live.devices;
      const next = list[(list.findIndex((device) => device.id === sheetId) + delta + list.length) % list.length];
      M.transition(() => { fillSheet(next.id); return sheetBody; }, { type: delta > 0 ? 'forward' : 'back', focus: true });
    });
  }

  /* A snackbar with an action stays until it is used or closed; the action closes it and runs once. */
  const undoToast = (text) => toast(text, { action: { label: 'Undo', onClick: () => toast('Restored. Nothing was lost.') } });

  const confirmDialog = $('#confirm');
  // While the delete runs the dialog stays open (data-ds-busy): Escape, the backdrop and Cancel wait; the
  // button shows that it works. Then it closes with its reason, and the snackbar offers the undo.
  $('#confirm-delete').addEventListener('click', async (event) => {
    if (event.detail > 1 || confirmDialog.hasAttribute('data-ds-busy')) return;
    const button = event.currentTarget;
    const cancel = $('#confirm-cancel');
    confirmDialog.setAttribute('data-ds-busy', '');
    cancel.setAttribute('aria-disabled', 'true');
    try {
      await M.busy(button, () => new Promise((resolve) => { setTimeout(resolve, M.motionDuration(button, '--ds-dur-glide')); }), { done: false });
    } finally {
      confirmDialog.removeAttribute('data-ds-busy');
      cancel.removeAttribute('aria-disabled');
    }
    DS.overlay.close(confirmDialog, { reason: 'confirm' });
    undoToast('3 devices deleted.');
  });

  /* The menu: DS.overlay does the keyboard, focus and placement. */
  const menu = $('#demo-menu');
  menu.addEventListener('click', (event) => {
    const item = event.target.closest('.ds-menu__item');
    if (!item || item.getAttribute('aria-disabled') === 'true') return;
    if (item.getAttribute('role') === 'menuitemcheckbox') {
      const on = item.getAttribute('aria-checked') !== 'true';
      item.setAttribute('aria-checked', String(on));
      toast(on ? 'Pinned.' : 'Unpinned.');
    } else toast(`${$('.ds-menu__label', item).textContent}: a demo, so nothing happens.`, { kind: 'info' });
  });

  SETUP.overlays = [
    (section) => {
      sayOnPress(section);
      $('#open-dialog').addEventListener('click', (event) => DS.overlay.open(confirmDialog, { opener: event.currentTarget }));
      $('#open-sheet').addEventListener('click', (event) => openSheet(visibleDevices()[0]?.id || live.devices[0].id, event.currentTarget));
      const trigger = $('#open-menu');
      trigger.addEventListener('click', () => {
        if (trigger.getAttribute('aria-expanded') === 'true') DS.overlay.close(menu);
        else DS.overlay.open(menu, { opener: trigger });
      });
      trigger.addEventListener('keydown', (event) => {
        // ArrowDown opens on the first item, ArrowUp on the last.
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        event.preventDefault();
        DS.overlay.open(menu, { opener: trigger });
      });
      for (const button of $$('[data-toast]', section)) {
        button.addEventListener('click', () => {
          const kind = button.getAttribute('data-toast');
          if (kind === 'ok') toast('Saved. This message closes by itself.');
          else if (kind === 'error') toast('Could not reach the server. Errors stay until you close them.', { kind: 'error' });
          else undoToast('Ticket #4211 archived.');
        });
      }
    },
  ];

  /* ── Feedback ──────────────────────────────────────────────────────── */

  const ALERT_POOL = [
    { kind: 'warning', glyph: 'alert', text: 'The certificate of the build server expires in 5 days.' },
    { kind: 'success', glyph: 'checkCircle', text: 'All laptops installed this week\'s updates.' },
    { kind: '', glyph: 'info', text: 'The nightly sync runs at 02:00.' },
    { kind: 'error', glyph: 'alertCircle', text: 'The warehouse scanner has not checked in for 2 hours.' },
  ];
  const ALERT_TONES = { warning: 'ds-tone-warning', success: 'ds-tone-success', error: 'ds-tone-error', '': '' };
  const TASKS = ['Copy the image', 'Join the domain', 'Install updates', 'Restart'];
  const TASK_MARKS = { done: () => icon('checkCircle', 20), running: () => '<span class="ds-spinner ds-spinner--ink ds-sm"></span>', pending: () => '' };
  const TASK_WORDS = { done: 'done', running: 'running', pending: 'waiting' };

  SETUP.feedback = [
    () => {
      const progress = $('#import-progress');
      const ring = $('#import-ring');
      const label = $('#import-label');
      const detail = $('#import-detail');
      const ROWS = 2030;
      const setShare = (share, first) => {
        const percent = Math.round(share * 100);
        // The bar, the ring and the figure, in one task: they land on the same frame.
        DS.dom.progress(progress, share);
        DS.dom.progress(ring, share);
        M.countUp(label, percent, { format: (n) => `${Math.round(n)}%`, ...(first ? { from: 0 } : {}) });
        detail.textContent = `${Math.round(share * ROWS).toLocaleString('en-US')} of ${ROWS.toLocaleString('en-US')} rows`;
      };
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
        ok: `<span class="ds-status ds-tone-success">${icon('check', 16)}<span>Live</span></span>`,
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
    },
    () => {
      const alerts = { list: [ALERT_POOL[2], ALERT_POOL[0]].map((alert, index) => ({ ...alert, id: `a${index}` })), next: 2, pool: 1 };
      const stack = $('#alerts');
      const html = () => alerts.list.map((alert) =>
        `<div class="ds-alert ${ALERT_TONES[alert.kind]}" data-ds-key="${alert.id}"${alert.kind === 'error' ? ' role="alert"' : ''}>${icon(alert.glyph, 20)}` +
        `<span class="ds-alert__text">${esc(alert.text)}</span><button class="ds-btn ds-btn--text ds-sm" type="button" data-dismiss="${alert.id}">Dismiss</button></div>`).join('');
      DS.dom.morphHtml(stack, html());
      $('#add-alert').addEventListener('click', () => {
        alerts.pool = (alerts.pool + 1) % ALERT_POOL.length;
        alerts.list.unshift({ ...ALERT_POOL[alerts.pool], id: `a${alerts.next++}` });
        if (alerts.list.length > 4) alerts.list.pop();
        M.flip(stack, (morph) => DS.dom.morphHtml(stack, html(), morph));
      });
      stack.addEventListener('click', (event) => {
        const button = event.target.closest('[data-dismiss]');
        if (!button) return;
        alerts.list = alerts.list.filter((alert) => alert.id !== button.getAttribute('data-dismiss'));
        // flip() moves the focus to the next alert's Dismiss, and to "Add alert" once none is left.
        M.flip(stack, (morph) => DS.dom.morphHtml(stack, html(), morph), { refocus: () => $('#add-alert') });
      });

      // The steps of a job: each turns running, then done; the count follows.
      const tasks = $('#tasks');
      const status = TASKS.map(() => 'pending');
      const render = () => {
        DS.dom.morphHtml(tasks, TASKS.map((text, i) => `<li class="ds-tasks__item" data-status="${status[i]}"><span class="ds-tasks__mark">${TASK_MARKS[status[i]]()}</span><span class="ds-tasks__text">${text}<span class="ds-sr">: ${TASK_WORDS[status[i]]}</span></span></li>`).join(''));
        $('#tasks-count').textContent = `${status.filter((s) => s === 'done').length} of ${TASKS.length}`;
      };
      render();
      $('#run-tasks').addEventListener('click', (event) => {
        M.busy(event.currentTarget, async () => {
          status.fill('pending');
          render();
          for (let i = 0; i < TASKS.length; i += 1) {
            status[i] = 'running';
            render();
            await fake(900);
            status[i] = 'done';
            render();
          }
        }).then(() => toast('LAPTOP-0042 is set up.'));
      });
    },
  ];

  /* ── Navigation ────────────────────────────────────────────────────── */

  SETUP.navigation = [
    () => {
      // Steps: Back and Next move the current step; the page marks the steps behind it done.
      const list = $('#steps');
      const steps = DS.core.get(list, 'steps');
      const items = $$('.ds-steps__step', list);
      const mark = (index) => {
        items.forEach((item, i) => {
          const optional = item.hasAttribute('data-demo-optional');
          const done = i < index;
          if (done) item.setAttribute('data-status', 'done');
          else if (optional) item.setAttribute('data-status', 'optional');
          else item.removeAttribute('data-status');
          const markEl = $('.ds-steps__mark', item);
          DS.dom.morphHtml(markEl, done ? icon('check', 16) : String(i + 1));
          const label = $('.ds-steps__label', item);
          const word = $('.ds-sr', label);
          const said = done ? ', done' : optional ? ', optional' : '';
          if (word && !said) word.remove();
          else if (word) word.textContent = said;
          else if (said) label.insertAdjacentHTML('beforeend', `<span class="ds-sr">${said}</span>`);
        });
        $('#steps-back').setAttribute('aria-disabled', String(index === 0));
        $('#steps-next').setAttribute('aria-disabled', String(index === items.length - 1));
      };
      list.addEventListener('ds:change', (event) => mark(event.detail.index));
      $('#steps-back').addEventListener('click', () => { const at = Math.max(0, steps.get() - 1); steps.set(at); mark(at); });
      $('#steps-next').addEventListener('click', () => { const at = Math.min(items.length - 1, steps.get() + 1); steps.set(at); mark(at); });
      mark(steps.get());

      // A segmented mode: one tab stop, the arrow keys choose (the APG radio group); the pill follows.
      const mode = $('#ticket-mode');
      DS.indicator.create(mode, { active: '[aria-checked="true"]', className: 'ds-segmented__indicator' });
      const choose = (option) => {
        for (const each of $$('[role="radio"]', mode)) {
          each.setAttribute('aria-checked', String(each === option));
          each.setAttribute('tabindex', each === option ? '0' : '-1');
        }
      };
      DS.a11y.roving(mode, { items: '[role="radio"]', orientation: 'horizontal', onActivate: choose });
      mode.addEventListener('click', (event) => {
        const option = event.target.closest('[role="radio"]');
        if (option) choose(option);
      });

      // Simple pages: the range says where, the ends block their button.
      const pager = $('#ticket-pages');
      let page = 1;
      pager.addEventListener('click', (event) => {
        const button = event.target.closest('[data-page]');
        if (!button || button.getAttribute('aria-disabled') === 'true') return;
        page = Math.min(12, Math.max(1, page + Number(button.getAttribute('data-page'))));
        $('.ds-pagination__range', pager).textContent = `Page ${page} of 12`;
        $('[data-page="-1"]', pager).setAttribute('aria-disabled', String(page === 1));
        $('[data-page="1"]', pager).setAttribute('aria-disabled', String(page === 12));
      });
    },
  ];

  /* ── Layout ────────────────────────────────────────────────────────── */

  SETUP.layout = [
    () => {
      // A panel refreshes: its head's load bar runs while the panel is busy, the content keeps its place.
      $('#panel-refresh').addEventListener('click', (event) => {
        const panel = event.currentTarget.closest('.ds-dashpanel');
        M.busy(event.currentTarget, async () => {
          panel.setAttribute('aria-busy', 'true');
          await fake(1600);
          panel.removeAttribute('aria-busy');
        }, { done: false });
      });
    },
  ];

  /* ── People ────────────────────────────────────────────────────────── */

  const TEAM = [
    ['Ada Lovelace', 'Field engineer', 'online', 'Online'],
    ['Grace Hopper', 'Support lead', 'away', 'Away'],
    ['Joan Clarke', 'Network operator', 'busy', 'Busy'],
    ['Alan Turing', 'Release manager', 'offline', 'Offline'],
  ];
  const HUES = ['ds-avatar--hue-1', 'ds-avatar--hue-2', 'ds-avatar--hue-3', 'ds-avatar--hue-4', 'ds-avatar--hue-5', 'ds-avatar--hue-6'];
  const PRESENCE = { online: 'ds-presence-dot--online', away: 'ds-presence-dot--away', busy: 'ds-presence-dot--busy', offline: 'ds-presence-dot--offline' };
  const NEWCOMERS = ['Katherine Johnson', 'Edsger Dijkstra', 'Barbara Liskov', 'Annie Easley', 'Frances Allen'];

  SETUP.people = [
    () => {
      DS.dom.morphHtml($('#team'), TEAM.map(([name, role, status, word]) =>
        `<div class="ds-persona"><span class="ds-avatar ${HUES[DS.avatar.hue(name) - 1] || HUES[0]}" aria-hidden="true">${esc(DS.avatar.initials(name))}<span class="ds-presence-dot ${PRESENCE[status]}"></span></span>` +
        `<span class="ds-persona__text"><span class="ds-persona__name">${esc(name)}</span><span class="ds-persona__role">${esc(role)}</span>` +
        `<span class="ds-persona__status"><span class="ds-presence-label"><span class="ds-presence-dot ${PRESENCE[status]}"></span>${word}</span></span></span></div>`).join(''));
      let next = 0;
      $('#add-person').addEventListener('click', () => {
        const name = NEWCOMERS[next++ % NEWCOMERS.length];
        const group = $('#people-group');
        const avatar = document.createElement('span');
        avatar.className = 'ds-avatar';
        avatar.setAttribute('data-ds-avatar', name);
        $('.ds-avatar-group__more', group).before(avatar);
        toast(`${name} joined.`);
      });
    },
  ];

  /* ── Content ───────────────────────────────────────────────────────── */

  const LOG_EVENTS = [
    ['INFO ', 'Heartbeat ok'], ['DEBUG', 'Next sync in 600 s'], ['INFO ', 'Synced 4 settings, 1 ticket'], ['WARN ', 'Battery at 14%: syncing less often'],
    ['INFO ', 'Fan speed back to normal'], ['ERROR', 'Printer 7 did not answer within 5000 ms'], ['INFO ', 'Printer 7 back online'], ['TRACE', 'Disk check: 38% used'],
  ];

  SETUP.content = [
    () => {
      // Markdown, rendered on every input and patched in place; in-page links stay in the card.
      const source = $('#md-source');
      const preview = DS.markdown.create($('#md-preview'), { source: source.value });
      source.addEventListener('input', () => preview.set(source.value));
      $('#md-preview').addEventListener('click', (event) => { if (event.target.closest('a[href^="http"]')) event.preventDefault(); });
    },
    (section) => {
      // The log: new lines arrive while the switch is on and the stop is in view.
      const log = DS.core.get($('#log'), 'logview');
      let at = 0;
      let timer = 0;
      const stream = () => {
        clearTimeout(timer);
        if (!$('#log-live').checked || !inView.has('content') || document.hidden) return;
        timer = setTimeout(() => {
          const [level, text] = LOG_EVENTS[at++ % LOG_EVENTS.length];
          log?.append(`${new Date().toISOString()} ${level} ${text}`);
          stream();
        }, 900);
      };
      $('#log-live').addEventListener('change', stream);
      section.addEventListener('demo:view', stream);
    },
  ];

  /* ── Chat and AI ───────────────────────────────────────────────────── */

  const REPLIES = [
    'Open the settings of the network adapter, then **Power management**, and clear *Allow this device to wake the computer*. A policy can do it for every laptop at once.',
    'Two more: `LAPTOP-0117` (Grace Hopper) and `LAPTOP-0203`, both with wake for network access on.',
    'Ticket **T-4212** is open for LAPTOP-0042 and assigned to the service desk.',
    'The battery of LAPTOP-0042 holds 81% of its design capacity: no replacement is due yet.',
  ];
  const STEPS = ['Reading the question', 'Looking at the device data', 'Writing the answer'];
  let messageCount = 2;

  function messageHtml(role, html) {
    const id = `m${++messageCount}-author`;
    const mine = role === 'user';
    return `<article class="ds-message ${mine ? 'ds-message--user' : 'ds-message--assistant'}" data-ds-message${mine ? '' : '="streaming"'} aria-labelledby="${id}">` +
      (mine ? '' : `<div class="ds-message__avatar" aria-hidden="true">${icon('bot', 20)}</div>`) +
      `<div class="ds-message__main"><header class="ds-message__head"><span class="ds-message__author" id="${id}">${mine ? 'Ada Lovelace' : 'Assistant'}</span></header>` +
      `<div class="ds-message__content ${mine ? '' : 'ds-prose ds-prose--compact'}">${html}</div></div></article>`;
  }

  SETUP.chat = [
    () => {
      const list = $('#messages');
      const form = $('#composer');
      const composer = DS.core.get(form, 'composer');
      const transcript = DS.core.get($('#transcript'), 'transcript');
      const thinking = $('#thinking');
      let turn = 0;
      let timers = [];
      const later = (ms, fn) => timers.push(setTimeout(fn, ms));

      form.addEventListener('ds:send', (event) => {
        list.insertAdjacentHTML('beforeend', messageHtml('user', esc(event.detail.text)));
        transcript?.stick();
        composer?.set({ busy: true });
        thinking.hidden = false;
        let step = 0;
        DS.core.get(thinking, 'thinking')?.set({ step: STEPS[0], since: Date.now(), tokens: 120, done: false });
        const next = () => {
          step += 1;
          if (step < STEPS.length) {
            DS.core.get(thinking, 'thinking')?.set({ step: STEPS[step], tokens: 120 + step * 640 });
            later(700, next);
            return;
          }
          thinking.hidden = true;
          stream(REPLIES[turn++ % REPLIES.length]);
        };
        later(700, next);
      });

      // The reply streams in: its Markdown grows word by word; then the page renders it complete (data-ds-message
      // empty), and DS.message drops the cursor.
      function stream(text) {
        list.insertAdjacentHTML('beforeend', messageHtml('assistant', ''));
        const article = list.lastElementChild;
        const content = $('.ds-message__content', article);
        const words = text.split(' ');
        const markdown = DS.markdown.create(content, { source: '' });
        words.forEach((word, i) => {
          later(70 * (i + 1), () => {
            markdown.set(words.slice(0, i + 1).join(' '));
            transcript?.stick();
            if (i === words.length - 1) {
              article.setAttribute('data-ds-message', '');
              composer?.set({ busy: false });
            }
          });
        });
      }

      form.addEventListener('ds:stop', () => {
        timers.forEach(clearTimeout);
        timers = [];
        thinking.hidden = true;
        const last = list.lastElementChild;
        if (last?.getAttribute('data-ds-message') === 'streaming') last.setAttribute('data-ds-message', 'partial');
        composer?.set({ busy: false });
      });
      $('#chat').addEventListener('click', (event) => {
        if (event.target.closest('.ds-cite__title')) event.preventDefault();
      });
    },
  ];

  /* ── Theme it ──────────────────────────────────────────────────────── */

  /* The generator runs in the browser from one classic script, the one the styleguide uses; it loads with
     the first colour of the visitor's own. A project runs tools/theme.mjs once and ships the file. */
  let generator = null;
  function loadGenerator() {
    if (!generator) {
      generator = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '../styleguide/theme-generator.js';
        script.onload = () => resolve(window.SG_THEME_GENERATOR);
        script.onerror = () => reject(new Error('The theme generator did not load.'));
        document.head.appendChild(script);
      });
    }
    return generator;
  }

  let themeCss = null;
  function showTheme(choice) {
    $('#theme-code').textContent = DemoTheme.file(choice, themeCss);
    const form = $('#theme-form');
    for (const radio of $$('input[name="seed"]', form)) radio.checked = radio.value === (choice.preset || 'custom');
    $('#theme-scheme').value = choice.scheme;
    $('#theme-contrast').value = choice.contrast;
    $('#theme-shape').value = choice.shape;
    $('#theme-density').value = choice.density;
    if (choice.seed) {
      $('#theme-colour').value = choice.seed;
      $('#theme-hex').value = choice.seed;
    }
  }

  /* A choice of the visitor's own colour goes through the generator; a preset is a file that ships. */
  async function chooseTheme(next) {
    const choice = { ...DemoTheme.saved(), ...next };
    if (!choice.preset) {
      try {
        const tool = await loadGenerator();
        const result = tool.generateTheme({ seed: choice.seed, scheme: choice.scheme, contrast: choice.contrast, name: 'tour' });
        themeCss = result.css;
        const moved = result.moves.length;
        $('#theme-report').textContent = `Generated from ${choice.seed}: every pair passes in light and dark${moved ? `, ${moved} tone${moved === 1 ? '' : 's'} moved to get there` : ''}.`;
      } catch (error) {
        toast(error.message, { kind: 'error' });
        return;
      }
    } else {
      themeCss = null;
      $('#theme-report').textContent = `The ${DemoTheme.presetOf(choice.preset).label.toLowerCase()} preset, checked in both schemes when it was generated.`;
    }
    showTheme(DemoTheme.apply(choice, themeCss));
  }

  SETUP.theme = [
    () => {
      const form = $('#theme-form');
      DS.dom.morphHtml($('#theme-seeds'), DemoTheme.PRESETS.map((preset) =>
        `<label class="ds-radio"><input type="radio" name="seed" value="${preset.name}"><span><strong><span class="demo-swatch" style="--demo-seed: ${preset.seed}" aria-hidden="true"></span>${preset.label}</strong></span></label>`).join('') +
        '<label class="ds-radio"><input type="radio" name="seed" value="custom"><span><strong><span class="demo-swatch demo-swatch--custom" aria-hidden="true"></span>Your colour</strong></span></label>');
      const saved = DemoTheme.saved();
      themeCss = null;
      showTheme(saved);
      $('#theme-report').textContent = saved.preset ? 'Presets ship in themes/presets/; your colour goes through the generator.' : '';
      form.addEventListener('change', (event) => {
        const target = event.target;
        if (target.name === 'seed') {
          if (target.value === 'custom') chooseTheme({ preset: null, seed: $('#theme-hex').value.trim() || '#0b57d0' });
          else chooseTheme({ preset: target.value });
        } else if (target.id === 'theme-scheme') {
          // A palette style of its own makes the seed the visitor's: the preset's file holds its own style.
          chooseTheme({ preset: null, seed: DemoTheme.saved().seed, scheme: target.value });
        } else if (['theme-contrast', 'theme-shape', 'theme-density'].includes(target.id)) {
          chooseTheme({ [target.name]: target.value });
        }
      });
      $('#theme-colour').addEventListener('input', (event) => { $('#theme-hex').value = event.target.value; });
      $('#theme-colour').addEventListener('change', (event) => chooseTheme({ preset: null, seed: event.target.value }));
      $('#theme-use').addEventListener('click', () => {
        const hex = $('#theme-hex').value.trim();
        if (/^#[0-9a-f]{6}$/i.test(hex)) chooseTheme({ preset: null, seed: hex });
        else toast('A colour as #rrggbb, such as #00658f.', { kind: 'error' });
      });
      form.addEventListener('reset', (event) => {
        event.preventDefault();
        DS.shell.setScheme('auto', { remember: false });
        chooseTheme({ preset: 'default', contrast: 'standard', shape: '1', density: '0', appearance: 'auto' });
      });
      $('#copy-theme').addEventListener('click', (event) => {
        const swap = $('.ds-icon-swap', event.currentTarget);
        swap.setAttribute('data-swap', 'b');
        copy($('#theme-code').textContent, 'Theme copied: save it as theme.css.');
        setTimeout(() => swap.setAttribute('data-swap', 'a'), 2 * M.motionDuration(swap, '--ds-hold-success'));
      });
      // A saved colour of the visitor's own shows its file: the generator runs once more for it.
      if (!saved.preset) chooseTheme({});
    },
  ];

  /* ── Icons ─────────────────────────────────────────────────────────── */

  const NAMES = Object.keys(DS.icons).filter((name) => typeof DS.icons[name] === 'string' && DS.icons[name].startsWith('<')).sort();
  const iconItem = (name) => `<li data-ds-key="${name}"><button class="demo-icon ds-pressable" type="button" data-name="${name}" aria-label="Copy ${name}">${icon(name, 24)}<span>${name}</span></button></li>`;

  SETUP.icons = [
    () => {
      const grid = $('#icon-grid');
      const empty = $('#icon-empty');
      DS.dom.morphHtml(grid, NAMES.map(iconItem).join(''));
      $('#icon-search').addEventListener('input', (event) => {
        const q = event.target.value.trim().toLowerCase();
        const shown = NAMES.filter((name) => name.toLowerCase().includes(q));
        M.flip(grid, (morph) => DS.dom.morphHtml(grid, shown.map(iconItem).join(''), morph), { items: 'li' });
        const note = $('.ds-empty', empty);
        if (!shown.length && !note) {
          DS.dom.morphHtml(empty, `<div class="ds-empty"><span class="ds-empty__disc" aria-hidden="true">${icon('image', 24)}</span><p class="ds-empty__title">No icon by that name</p></div>`);
          M.enter($('.ds-empty', empty), 'fade');
        } else if (shown.length && note && !note.classList.contains('ds-leave')) M.leave(note);
      });
      grid.addEventListener('click', (event) => {
        const button = event.target.closest('[data-name]');
        if (!button) return;
        const line = 'DS.icons.icon(DS.icons.' + button.getAttribute('data-name') + ', 20)';
        copy(line, `Copied ${line}.`);
      });
    },
  ];

  /* ── Command palette (Ctrl+K) ──────────────────────────────────────── */

  const go = (id) => () => goTo(id);
  const STOPS = sections.map((section) => ({ id: `go-${section.id}`, label: $('h1, h2', section).textContent.trim(), section }));
  const STOP_ICONS = { welcome: 'sparkles', actions: 'thumbUp', forms: 'compose', data: 'table', live: 'activity', overlays: 'columns', feedback: 'sync', navigation: 'compass', layout: 'layoutGrid', people: 'users', content: 'fileText', chat: 'bot', theme: 'palette', icons: 'apps', start: 'download' };
  const appearance = (value) => () => {
    DS.shell.setScheme(value, { remember: false });
    DemoTheme.appearance(value);
  };
  const palette = DS.command.create($('#palette'), {
    commands: [
      ...STOPS.map((stop) => ({ id: stop.id, label: stop.section.id === 'welcome' ? 'Welcome' : stop.label, group: 'Tour', icon: DS.icons[STOP_ICONS[stop.section.id]], run: go(stop.section.id) })),
      { id: 'light', label: 'Light appearance', group: 'Appearance', icon: DS.icons.sun, keywords: ['theme', 'scheme', 'bright'], run: appearance('light') },
      { id: 'dark', label: 'Dark appearance', group: 'Appearance', icon: DS.icons.moon, keywords: ['theme', 'scheme', 'night'], run: appearance('dark') },
      { id: 'auto', label: 'Appearance as the device', group: 'Appearance', icon: DS.icons.monitor, keywords: ['theme', 'scheme', 'system'], run: appearance('auto') },
      { id: 'presets', label: 'Theme preset', group: 'Appearance', icon: DS.icons.palette, keywords: ['colour', 'color', 'seed'], children: DemoTheme.PRESETS.map((preset) => ({ id: `preset-${preset.name}`, label: preset.label, run: () => { chooseTheme({ preset: preset.name }); toast(`The ${preset.label.toLowerCase()} preset.`); } })) },
      { id: 'actions', label: 'Run an action', group: 'Actions', icon: DS.icons.zap, prefix: '>', children: [
        { id: 'slow', label: 'Slow motion', icon: DS.icons.clock, keywords: ['speed', 'animation'], run: () => setSpeed(0.2, true) },
        { id: 'normal', label: 'Normal speed', icon: DS.icons.play, keywords: ['speed', 'animation'], run: () => setSpeed(1, true) },
        { id: 'chart', label: 'New data in the charts', icon: DS.icons.barChart, run: () => goTo('data') },
        { id: 'message', label: 'Show a message', icon: DS.icons.info, run: () => toast('Hello from the command palette.') },
      ] },
      { id: 'source', label: 'Open the source', group: 'Explore', icon: DS.icons.fileCode, href: 'https://github.com/saschazesiger/Dashboard-Style' },
      { id: 'styleguide', label: 'Open the styleguide', group: 'Explore', icon: DS.icons.overview, href: '../styleguide/index.html' },
      { id: 'example', label: 'Open the reference app', group: 'Explore', icon: DS.icons.laptop, href: '../example/index.html' },
    ],
  });
  void palette;

  /* ── Start ─────────────────────────────────────────────────────────── */

  // A link to a stop (#theme) lands there at once; else the stops near the top set up as they come.
  const asked = location.hash.length > 1 ? document.getElementById(location.hash.slice(1)) : null;
  if (asked?.classList.contains('demo-section')) goTo(asked.id, { instant: true });
  else observeAll();
  root.setAttribute('data-demo-ready', '');
})();
