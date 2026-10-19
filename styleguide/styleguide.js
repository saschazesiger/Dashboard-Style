/*
 * The living styleguide: every component with the markup of
 * docs/components.md, the tokens of the active theme, motion demos and the
 * icon set. A classic script on top of dist/ds.js, so it runs from disk.
 * The small behaviours here (dialogs, sheets, snackbars, tooltips) are
 * demo code, not part of the system: projects bring their own.
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

  /* ── Sections ─────────────────────────────────────────────────────── */

  var NAV = [
    { group: 'Start', items: [['overview', 'Overview', 'overview']] },
    { group: 'Foundations', items: [['colour', 'Colour', 'image'], ['type', 'Type', 'fileText'], ['shape', 'Space and shape', 'columns']] },
    { group: 'Components', items: [['buttons', 'Buttons', 'plus'], ['status', 'Status and alerts', 'alertCircle'], ['cards', 'Cards and lists', 'list'], ['table', 'Table', 'rows'], ['forms', 'Forms', 'pencil'], ['selection', 'Chips, switch, combobox', 'check'], ['overlays', 'Overlays', 'copy'], ['loading', 'Loading and progress', 'sync'], ['frame', 'App frame', 'monitor']] },
    { group: 'Motion and icons', items: [['motion', 'Motion', 'activity'], ['icons', 'Icons', 'apps']] },
  ];

  function section(id, title, lead, body) {
    return '<section class="sg-section" id="' + id + '" aria-labelledby="' + id + '-title">' +
      '<header class="ds-page-head"><h2 class="ds-page-head__title" id="' + id + '-title">' + title + '</h2>' +
      (lead ? '<p class="ds-page-head__lead">' + lead + '</p>' : '') + '</header>' + body + '</section>';
  }

  function card(title, body, extra) {
    return '<section class="ds-card"' + (extra || '') + '>' + (title ? '<h3 class="ds-card__title">' + title + '</h3>' : '') + body + '</section>';
  }

  function label(text) { return '<p class="sg-label">' + text + '</p>'; }

  /* Overview */
  function overview() {
    return '<section class="sg-section" id="overview" aria-labelledby="overview-title">' +
      '<div class="sg-hero"><h1 id="overview-title">A calm, themeable system for dashboards</h1>' +
      '<p>White panels on a tinted backdrop, hairlines instead of shadows, pill-shaped actions and quiet motion. Every value comes from a token, so one theme file restyles everything below.</p>' +
      '<div class="sg-row"><a class="ds-btn ds-btn--primary" href="../README.md">Get started</a><a class="ds-btn" href="../docs/theming.md">Theming guide</a><a class="ds-btn ds-btn--text" href="../docs/components.md">Component markup ' + icon('arrowRight', 16) + '</a></div></div>' +
      '<div class="ds-tiles">' +
      tile('Components', '23', 'apps', 'one file each') + tile('Tokens', '120+', 'settings', 'three layers') + tile('Icons', String(glyphs().length), 'image', 'outline, 24px grid') + tile('Dependencies', '0', 'box', 'plain CSS and JS') +
      '</div></section>';
  }

  function tile(name, value, glyph, note) {
    return '<div class="ds-tile"><p class="ds-tile__label">' + icon(glyph, 20) + '<span>' + name + '</span></p><p class="ds-tile__value" data-count="' + parseInt(value, 10) + '" data-suffix="' + value.replace(/\d+/, '') + '">' + value + '</p><p class="ds-tile__note">' + note + '</p></div>';
  }

  /* Colour */
  var COLOURS = [
    ['Surfaces', ['--ds-backdrop', '--ds-surface', '--ds-surface-low', '--ds-surface-high', '--ds-surface-highest']],
    ['Text and lines', ['--ds-text', '--ds-text-2', '--ds-text-3', '--ds-line', '--ds-line-2', '--ds-outline']],
    ['Primary and tint', ['--ds-primary', '--ds-on-primary', '--ds-accent', '--ds-on-accent', '--ds-action-ink', '--ds-focus']],
    ['Status', ['--ds-success', '--ds-success-container', '--ds-on-success-container', '--ds-warning', '--ds-warning-container', '--ds-warning-surface', '--ds-error', '--ds-error-container', '--ds-on-error-container']],
    ['Inverse and overlays', ['--ds-inverse', '--ds-on-inverse', '--ds-inverse-primary', '--ds-scrim', '--ds-fill-round', '--ds-disabled-fill']],
  ];

  function colour() {
    return section('colour', 'Colour', 'Roles of the active theme. Text roles pass WCAG AA on the surfaces they are meant for; the tint never carries a state alone.',
      COLOURS.map(function (group) {
        return card(group[0], '<div class="sg-swatches">' + group[1].map(function (name) {
          return '<div class="sg-swatch"><span class="sg-swatch__chip" style="background:var(' + name + ')"></span><code>' + name + '</code><span class="ds-meta" data-value="' + name + '"></span></div>';
        }).join('') + '</div>');
      }).join(''));
  }

  /* Type */
  var TYPE = [
    ['--ds-font-display', 'Key figure 1,284'], ['--ds-font-headline', 'Page title'], ['--ds-font-title', 'Dialog and section title'],
    ['--ds-font-subtitle', 'Card title'], ['--ds-font-reading', 'Running text meant to be read, at a comfortable size.'],
    ['--ds-font-body', 'Default UI text, fields and descriptions.'], ['--ds-font-dense', 'Table cell text'], ['--ds-font-label', 'Button and label'],
    ['--ds-font-chip', 'Chip'], ['--ds-font-meta', 'Hint, timestamp, tooltip'], ['--ds-font-caption', 'Status chip, field label'], ['--ds-font-code', 'const code = true;'],
  ];

  function type() {
    return section('type', 'Type', 'Roles are font shorthands: size, line height, weight and family in one token. Headings are regular weight; the label weight marks buttons and labels.',
      card('', TYPE.map(function (role) {
        return '<div class="sg-type"><p style="font:var(' + role[0] + ')">' + role[1] + '</p><code>' + role[0] + '</code><span class="ds-meta" data-font="' + role[0] + '"></span></div>';
      }).join('')));
  }

  /* Space, radii, elevation */
  function shape() {
    var spaces = ['1', '2', '3', '4', '5', '6', '7', '8', '10', '12'];
    var radii = ['--ds-radius-xs', '--ds-radius-sm', '--ds-radius-md', '--ds-radius-lg', '--ds-radius-xl', '--ds-radius-2xl', '--ds-radius-action'];
    var roles = ['--ds-radius-card', '--ds-radius-dialog', '--ds-radius-panel', '--ds-radius-field', '--ds-radius-chip'];
    var elevations = ['--ds-elev-hover', '--ds-elev-popover', '--ds-elev-overlay'];
    return section('shape', 'Space and shape', 'A 4px spacing grid, a radius scale with roles (every action is a pill), and three elevation roles for floating layers only.',
      card('Spacing', '<div class="sg-spaces">' + spaces.map(function (n) {
        return '<div class="sg-space"><span class="sg-space__bar" style="height:var(--ds-space-' + n + ')"></span><code>' + n + '</code></div>';
      }).join('') + '</div>') +
      card('Radius scale and roles', '<div class="sg-shapes">' + radii.concat(roles).map(function (name) {
        return '<div class="sg-shape" style="border-radius:var(' + name + ')"><code>' + name.replace('--ds-radius-', '') + '</code></div>';
      }).join('') + '</div>') +
      card('Elevation', '<div class="sg-shapes">' + elevations.map(function (name) {
        return '<div class="sg-shape sg-shape--raised" style="box-shadow:var(' + name + ');border-radius:var(--ds-radius-card)"><code>' + name.replace('--ds-elev-', '') + '</code></div>';
      }).join('') + '</div>'));
  }

  /* Buttons */
  function buttons() {
    return section('buttons', 'Buttons', 'Every action is a pill. One filled button per area; no red buttons: the main action names the consequence.',
      '<div class="ds-grid-2">' +
      card('Variants', label('Primary, tonal, outlined, text, quiet') +
        '<div class="sg-row"><button class="ds-btn ds-btn--primary" type="button">Save</button><button class="ds-btn ds-btn--tonal" type="button">Add entry</button><button class="ds-btn" type="button">Export</button><button class="ds-btn ds-btn--text" type="button">Details</button><button class="ds-btn ds-btn--quiet" type="button">' + icon('filter', 16) + 'Filter</button></div>' +
        label('With icons, small, icon only, disc') +
        '<div class="sg-row"><button class="ds-btn ds-btn--primary" type="button">' + icon('plus', 16) + 'New device</button><button class="ds-btn ds-btn--sm" type="button">' + icon('download', 16) + 'CSV</button><button class="ds-btn ds-btn--text ds-btn--sm" type="button">Undo</button><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Settings" data-tip="Settings">' + icon('settings', 20) + '</button><button class="ds-btn ds-btn--quiet ds-btn--icon ds-btn--disc" type="button" aria-label="More" data-tip="More actions">' + icon('moreVertical', 20) + '</button><button class="ds-btn ds-btn--quiet ds-btn--icon ds-btn--sm" type="button" aria-label="Edit" data-tip="Edit">' + icon('pencil', 18) + '</button></div>' +
        label('Toggle (aria-pressed)') +
        '<div class="sg-row"><button class="ds-btn ds-btn--quiet" type="button" aria-pressed="true" data-sg="toggle">' + icon('filter', 16) + 'Filter</button><button class="ds-btn" type="button" aria-pressed="false" data-sg="toggle">Only active</button></div>') +
      card('States', label('Disabled') +
        '<div class="sg-row"><button class="ds-btn ds-btn--primary" type="button" disabled>Save</button><button class="ds-btn ds-btn--tonal" type="button" disabled>Add entry</button><button class="ds-btn" type="button" disabled>Export</button><button class="ds-btn ds-btn--text" type="button" disabled>Details</button></div>' +
        label('aria-disabled: focusable, the tooltip says why') +
        '<div class="sg-row"><button class="ds-btn ds-btn--primary" type="button" aria-disabled="true" data-tip="Fill in the serial number first">Publish</button></div>' +
        label('Busy: blocked at once, spinner only after the loader delay') +
        '<div class="sg-row"><button class="ds-btn ds-btn--primary" type="button" data-sg="busy">Save changes</button><button class="ds-link-btn" type="button">A button that reads like a link</button></div>') +
      '</div>');
  }

  /* Status and alerts */
  function status() {
    return section('status', 'Status and alerts', 'Status is never colour alone: always an icon and a word, on the tonal container of its status.',
      card('Status chips', '<div class="sg-row">' +
        '<span class="ds-status ds-status--ok">' + icon('check', 16) + '<span>Synced</span></span>' +
        '<span class="ds-status ds-status--warning">' + icon('alert', 16) + '<span>Expires soon</span></span>' +
        '<span class="ds-status ds-status--error">' + icon('alert', 16) + '<span>Failed</span></span>' +
        '<span class="ds-status ds-status--running"><span class="ds-spinner ds-status__spinner" aria-hidden="true"></span><span>Running</span></span>' +
        '<span class="ds-status">' + icon('clock', 16) + '<span>Waiting</span></span>' +
        '<span class="ds-status">' + icon('ban', 16) + '<span>Off</span></span></div>') +
      card('Alerts',
        '<div class="ds-alert ds-alert--info" role="status">' + icon('info', 20) + '<span class="ds-alert__text">The nightly sync runs at 02:00. Changes made now appear tomorrow.</span></div>' +
        '<div class="ds-alert ds-alert--success">' + icon('checkCircle', 20) + '<span class="ds-alert__text">All 128 devices are up to date.</span></div>' +
        '<div class="ds-alert ds-alert--warning">' + icon('alert', 20) + '<span class="ds-alert__text">The certificate expires in 5 days.</span><button class="ds-btn ds-btn--text ds-btn--sm" type="button">Renew</button></div>' +
        '<div class="ds-alert ds-alert--error" role="alert">' + icon('alertCircle', 20) + '<span class="ds-alert__text">Could not reach the directory server.</span><button class="ds-btn ds-btn--text ds-btn--sm" type="button">Try again</button></div>' +
        '<details class="ds-errors"><summary>' + icon('alertCircle', 16) + '2 rows were skipped' + icon('chevronDown', 16, 'ds-errors__chevron') + '</summary><ul><li>Row 4: unknown model "XPS 13 9999"</li><li>Row 9: duplicate serial number</li></ul></details>'));
  }

  /* Cards, tiles, lists, empty state */
  function cards() {
    return section('cards', 'Cards and lists', 'White cards with a hairline; hierarchy from type and tonal tiles. Key figures never take a colour and never wrap.',
      '<div class="ds-tiles">' +
      '<div class="ds-tile"><p class="ds-tile__label">' + icon('laptop', 20) + '<span>Devices</span></p><p class="ds-tile__value" data-count="1284">1284</p><p class="ds-tile__note">+12 this week</p></div>' +
      '<button class="ds-tile" type="button"><span class="ds-tile__label">' + icon('alert', 20) + '<span>Overdue</span></span><span class="ds-tile__value" data-count="7">7</span><span class="ds-tile__note">clickable tile</span></button>' +
      '<div class="ds-tile"><p class="ds-tile__label"><span>In storage</span></p><p class="ds-tile__value" data-count="42">42</p></div>' +
      '<div class="ds-tile"><p class="ds-tile__label"><span>Average age</span></p><p class="ds-tile__value">3.1 y</p></div>' +
      '</div>' +
      '<div class="ds-grid-2">' +
      '<section class="ds-card"><div class="ds-card__row"><h3 class="ds-card__title">LAPTOP-0042</h3><span class="ds-status ds-status--ok">' + icon('check', 16) + '<span>Managed</span></span></div>' +
        '<p class="ds-muted">Issued to Ada Lovelace. <a href="#cards">Open the record</a> or copy the serial <code>5CD1234XYZ</code>.</p>' +
        '<ul class="ds-kv-list"><li><span>Model</span><strong>Latitude 7440</strong></li><li><span>Warranty until</span><strong>2027-03-31</strong></li><li><span>Storage</span><strong>512 GB</strong></li></ul>' +
        '<nav class="ds-card__links" aria-label="Related"><a class="ds-btn ds-btn--text ds-card__link" href="#cards">History ' + icon('arrowRight', 16) + '</a><a class="ds-btn ds-btn--text ds-card__link" href="#cards">Tickets ' + icon('arrowRight', 16) + '</a></nav></section>' +
      '<section class="ds-card"><div class="ds-card__row"><h3 class="ds-card__title">Sync</h3><label class="ds-switch"><input type="checkbox" role="switch" checked data-sg="switch"><span class="ds-switch__track" aria-hidden="true"></span><span class="ds-switch__label ds-sr">Nightly sync</span><span class="ds-switch__state" aria-hidden="true">On</span></label></div>' +
        '<dl class="ds-facts"><div><dt>Last run</dt><dd>Today, 02:00 <span class="ds-nowrap">(1 min 35 s)</span></dd></div><div><dt>Changes</dt><dd><span class="ds-parts"><span class="ds-parts__list"><span>3 new</span><span>1 updated</span><span>250 unchanged</span></span></span></dd></div><div><dt>Next</dt><dd>Tomorrow, 02:00</dd></div></dl>' +
        '<div class="ds-subsection"><h3 class="ds-card__subtitle">Sources</h3><p class="ds-muted">Directory (users, groups) and device management (hardware).</p></div>' +
        '<p class="ds-meta">Last saved today, 09:12 by Ada Lovelace</p></section>' +
      '</div>' +
      '<div class="ds-grid-2">' +
      card('Empty state', '<div class="ds-empty"><span class="ds-empty__disc" aria-hidden="true">' + icon('box', 24) + '</span><p class="ds-empty__title">No devices in storage</p><p class="ds-empty__text">Devices you take back appear here until they are issued again.</p><button class="ds-btn ds-btn--tonal" type="button">' + icon('plus', 16) + 'Add device</button></div>') +
      '<section class="ds-card ds-card--filled"><h3 class="ds-card__title">Filled card</h3><p class="ds-muted">A quieter block inside a card or form, for example a test result.</p><ul class="ds-plain-list"><li><span class="ds-status ds-status--ok">' + icon('check', 16) + '<span>Server reachable</span></span></li><li><span class="ds-status ds-status--ok">' + icon('check', 16) + '<span>Signed in</span></span></li><li><span class="ds-status ds-status--error">' + icon('alert', 16) + '<span>No write access</span></span></li></ul><div class="ds-more"><button class="ds-btn" type="button">Show more</button></div></section>' +
      '</div>');
  }

  /* Table */
  var ROWS = [
    ['LAPTOP-0042', 'Latitude 7440', 'Ada Lovelace', '3.2', ['ok', 'check', 'Active']],
    ['LAPTOP-0043', 'ThinkPad T14', 'Alan Turing', '1.4', ['ok', 'check', 'Active']],
    ['DESKTOP-0107', 'OptiPlex 7010', '', '5.8', ['error', 'alert', 'Replacement overdue']],
    ['LAPTOP-0051', 'EliteBook 840', 'Grace Hopper', '4.1', ['warning', 'alert', 'Warranty ends']],
    ['LAPTOP-0060', 'Surface Pro 9', '', '0.6', ['', 'box', 'In storage']],
  ];

  function table() {
    return section('table', 'Table', 'A 48px header, 52px rows, hairlines and a quiet hover; no zebra. In a card the table runs to the edges; secondary columns drop on phones.',
      '<section class="ds-card"><div class="ds-card__row"><h3 class="ds-card__title">Devices</h3><div class="sg-row"><button class="ds-btn ds-btn--quiet ds-btn--sm" type="button" aria-pressed="false" data-sg="dense">Dense</button><button class="ds-btn ds-btn--sm" type="button">' + icon('download', 16) + 'CSV</button></div></div>' +
      '<div class="ds-table-wrap"><table class="ds-table" id="sg-table"><caption class="ds-sr">Devices</caption><thead><tr><th scope="col" aria-sort="ascending"><button class="ds-table__sort" type="button">Device' + icon('arrowUp', 16) + '</button></th><th scope="col" class="ds-col--secondary">Model</th><th scope="col" class="ds-col--secondary">Owner</th><th scope="col" class="ds-num"><button class="ds-table__sort" type="button">Age (y)</button></th><th scope="col">Status</th></tr></thead><tbody>' +
      ROWS.map(function (row) {
        return '<tr><td class="ds-nowrap"><button class="ds-link-btn" type="button">' + row[0] + '</button></td><td class="ds-col--secondary">' + row[1] + '</td><td class="ds-col--secondary">' + (row[2] || '<span class="ds-muted">Not issued</span>') + '</td><td class="ds-num">' + row[3] + '</td><td><span class="ds-status' + (row[4][0] ? ' ds-status--' + row[4][0] : '') + '">' + icon(row[4][1], 16) + '<span>' + row[4][2] + '</span></span></td></tr>';
      }).join('') + '</tbody></table></div></section>');
  }

  /* Forms */
  function forms() {
    return section('forms', 'Forms', 'Outlined 40px fields with the label above, a 2px focus ring that appears at once, errors with an icon and a message. Field text is 16px on phones.',
      '<form class="ds-card ds-form" onsubmit="return false">' +
      '<div class="ds-card__row"><h3 class="ds-card__title">Device</h3></div>' +
      '<div class="ds-form-grid">' +
      '<div class="ds-field"><label class="ds-field__label" for="f-name">Name</label><input class="ds-input" id="f-name" value="LAPTOP-0042" aria-describedby="f-name-hint"><small class="ds-field__hint" id="f-name-hint">As printed on the label.</small></div>' +
      '<div class="ds-field"><label class="ds-field__label" for="f-type">Type</label><select class="ds-input" id="f-type"><option>Laptop</option><option>Desktop</option><option>Tablet</option></select></div>' +
      '<div class="ds-field"><label class="ds-field__label" for="f-date">Bought</label><input class="ds-input" id="f-date" type="date" value="2024-03-12"></div>' +
      '<div class="ds-field"><label class="ds-field__label" for="f-serial">Serial number</label><input class="ds-input" id="f-serial" value="5CD1234XYZ" aria-invalid="true" aria-describedby="f-serial-error"><small class="ds-field__hint ds-field__hint--error" id="f-serial-error">' + icon('alertCircle', 16) + 'Already used by LAPTOP-0017.</small></div>' +
      '<div class="ds-field"><label class="ds-field__label" for="f-model">Model</label><input class="ds-input" id="f-model" list="f-models" placeholder="Start typing"><datalist id="f-models"><option>Latitude 7440</option><option>ThinkPad T14</option></datalist></div>' +
      '<div class="ds-field"><label class="ds-field__label" for="f-id">Asset ID</label><input class="ds-input" id="f-id" value="A-000042" readonly aria-describedby="f-id-hint"><small class="ds-field__hint" id="f-id-hint">Read-only: set by the system.</small></div>' +
      '<div class="ds-field"><label class="ds-field__label" for="f-retired">Retired on</label><input class="ds-input" id="f-retired" type="date" disabled></div>' +
      '<div class="ds-field"><label class="ds-field__label" for="f-cost">Cost centre</label><input class="ds-input" id="f-cost" value="4100"></div>' +
      '<div class="ds-field"><label class="ds-field__label" for="f-room">Room</label><input class="ds-input" id="f-room" placeholder="e.g. B 2.14"></div>' +
      '<div class="ds-field ds-field--full"><label class="ds-field__label" for="f-notes">Notes</label><textarea class="ds-input" id="f-notes" rows="3" placeholder="Anything the next person should know"></textarea></div>' +
      '</div>' +
      '<label class="ds-check"><input type="checkbox" checked><span>Managed by device management</span></label>' +
      '<label class="ds-check ds-check--sm"><input type="checkbox"><span>Delete the saved recovery key</span></label>' +
      '<div class="ds-radios" role="radiogroup" aria-label="Plan"><label class="ds-radio"><input type="radio" name="plan" checked><span><strong>Standard</strong><small>Replaced after four years.</small></span></label><label class="ds-radio"><input type="radio" name="plan"><span><strong>Extended</strong><small>Replaced after six years, with an extended warranty.</small></span></label><label class="ds-radio ds-radio--disabled"><input type="radio" name="plan" disabled><span><strong>Leasing</strong><small class="ds-radio__note">' + icon('alert', 16) + 'Needs a contract first.</small></span></label></div>' +
      '<button class="ds-btn ds-btn--text ds-add-row" type="button">' + icon('plus', 16) + 'Add an accessory</button>' +
      '<div class="ds-form-actions"><button class="ds-btn ds-btn--primary" type="submit">Save</button><button class="ds-btn ds-btn--text" type="button">Discard</button><p class="ds-meta">Last saved today, 09:12</p></div>' +
      '</form>' +
      card('Toolbar, action bar and inline form', '<div class="ds-toolbar"><div class="ds-filters">' +
        '<div class="ds-field ds-field--grow"><label class="ds-sr" for="f-q">Search</label><div class="ds-search">' + icon('search', 20) + '<input class="ds-input" id="f-q" type="search" placeholder="Search name, owner or serial"></div></div>' +
        '<div class="ds-field"><label class="ds-field__label" for="f-status">Status</label><select class="ds-input ds-input--filled" id="f-status"><option>All</option><option>Active</option></select></div>' +
        '<div class="ds-field"><label class="ds-field__label" for="f-since">Since</label><input class="ds-input ds-input--filled" id="f-since" type="date"></div>' +
        '</div></div>' +
        '<div class="ds-action-bar"><div class="ds-search">' + icon('search', 20) + '<input class="ds-input" type="search" aria-label="Search devices" placeholder="Search devices"></div><button class="ds-btn ds-btn--quiet" type="button" aria-pressed="false" data-sg="toggle">' + icon('filter', 16) + 'Filter</button><button class="ds-btn ds-btn--tonal" type="button">' + icon('plus', 16) + 'Add</button><p class="ds-meta">128 devices</p></div>' +
        '<div class="ds-inline-form"><div class="ds-field"><label class="ds-field__label" for="f-ticket">Ticket number</label><input class="ds-input" id="f-ticket" placeholder="12345"></div><button class="ds-btn" type="button">Look up</button></div>'));
  }

  /* Chips, switch, combobox */
  function selection() {
    var chip = function (text, checked, type, disabled) {
      return '<label class="ds-chip"><input class="ds-chip__input" type="' + (type || 'checkbox') + '" name="' + (type === 'radio' ? 'age' : 'status') + '"' + (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + '><span class="ds-chip__body">' + icon('check', 18, 'ds-chip__check') + '<span>' + text + '</span></span></label>';
    };
    return section('selection', 'Chips, switch, combobox', 'Selection always shows more than the tint: a check, the label weight, a state word.',
      '<div class="ds-grid-2">' +
      card('Filter chips', '<div><fieldset class="ds-chips"><legend class="ds-sr">Status</legend>' + chip('Active', true) + chip('In storage') + chip('Archived') + '<span class="ds-chips__divider" aria-hidden="true"></span>' + chip('Older than 4 years', false, 'radio') + chip('Unavailable', false, 'checkbox', true) + '</fieldset></div>') +
      card('Switch', '<div class="ds-stack"><label class="ds-switch"><input type="checkbox" role="switch" checked data-sg="switch"><span class="ds-switch__track" aria-hidden="true"></span><span class="ds-switch__label">Nightly sync</span><span class="ds-switch__state" aria-hidden="true">On</span></label>' +
        '<label class="ds-switch"><input type="checkbox" role="switch" data-sg="switch"><span class="ds-switch__track" aria-hidden="true"></span><span class="ds-switch__label">Email summary</span><span class="ds-switch__state" aria-hidden="true">Off</span></label>' +
        '<label class="ds-switch"><input type="checkbox" role="switch" disabled><span class="ds-switch__track" aria-hidden="true"></span><span class="ds-switch__label">Locked by policy</span><span class="ds-switch__state" aria-hidden="true">Off</span></label></div>') +
      '</div>' +
      card('Combobox (open)', '<div class="ds-field" style="max-width:420px"><label class="ds-field__label" for="f-combo">Model</label>' +
        '<div class="ds-combo" data-open><input class="ds-input ds-combo__input" id="f-combo" role="combobox" aria-expanded="true" aria-controls="f-combo-list" aria-activedescendant="f-combo-2" value="lat">' +
        '<button class="ds-combo__toggle" type="button" tabindex="-1" aria-label="Show all">' + icon('chevronDown', 20) + '</button>' +
        '<div class="ds-combo__popup"><ul class="ds-combo__list" id="f-combo-list" role="listbox">' +
        '<li class="ds-combo__option" id="f-combo-1" role="option" aria-selected="false"><span class="ds-combo__name">Latitude 5430</span><span class="ds-combo__meta">14 inch · 2022</span></li>' +
        '<li class="ds-combo__option" id="f-combo-2" role="option" aria-selected="false" data-active><span class="ds-combo__name">Latitude 7440</span><span class="ds-combo__meta">14 inch · 2023</span></li>' +
        '<li class="ds-combo__option" id="f-combo-3" role="option" aria-selected="true"><span class="ds-combo__name">Latitude 9450</span><span class="ds-combo__meta">14 inch · 2024</span></li>' +
        '</ul><p class="ds-combo__status" role="status">3 of 38 models</p></div></div></div><div style="height:212px"></div>'));
  }

  /* Overlays */
  function overlays() {
    return section('overlays', 'Overlays', 'Dialogs, side sheets, snackbars and tooltips float on the overlay elevation over a plain scrim. Open the real ones or inspect them in place.',
      card('Try them', '<div class="sg-row"><button class="ds-btn ds-btn--primary" type="button" data-sg="dialog">Open dialog</button><button class="ds-btn" type="button" data-sg="sheet">Open side sheet</button><button class="ds-btn" type="button" data-sg="toast">Show snackbar</button><button class="ds-btn" type="button" data-sg="toast-error">Show error</button><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Copy link" data-tip="Copy link">' + icon('link', 20) + '</button></div>') +
      '<div class="ds-grid-2">' +
      card('Dialog', '<div class="sg-inline-overlay">' + dialogMarkup(true) + '</div>') +
      card('Side sheet', '<div class="sg-inline-overlay">' + sheetMarkup(true) + '</div>') +
      '</div>' +
      card('Snackbar and tooltip', '<div class="ds-stack"><div class="ds-toast sg-toast-demo">' + icon('checkCircle', 20) + '<span class="ds-toast__text">Saved. The record is visible to everyone now.</span><button class="ds-btn ds-btn--quiet ds-btn--icon ds-toast__close" type="button" aria-label="Close">' + icon('close', 20) + '</button></div>' +
        '<div class="ds-toast ds-toast--error sg-toast-demo">' + icon('alertCircle', 20) + '<span class="ds-toast__text">Could not save. Check the connection and try again.</span></div>' +
        '<div class="ds-tooltip sg-tooltip-demo">Copy link</div></div>'));
  }

  function dialogMarkup(inline) {
    return '<div class="ds-dialog' + (inline ? ' ds-dialog--contained' : '') + '"><div class="ds-dialog__backdrop" data-close></div>' +
      '<div class="ds-dialog__box" role="' + (inline ? 'group' : 'alertdialog') + '"' + (inline ? '' : ' aria-modal="true" aria-labelledby="sg-d-title" aria-describedby="sg-d-text"') + '>' +
      '<h2 class="ds-dialog__title"' + (inline ? '' : ' id="sg-d-title"') + '>Delete 3 devices?</h2><p class="ds-dialog__text"' + (inline ? '' : ' id="sg-d-text"') + '>They disappear from every list. This cannot be undone.</p>' +
      '<div class="ds-dialog__actions"><button class="ds-btn ds-btn--text" type="button" data-close>Cancel</button><button class="ds-btn ds-btn--primary" type="button" data-close>Delete devices</button></div></div></div>';
  }

  function sheetMarkup(inline) {
    return '<div class="ds-sheet"' + (inline ? '' : ' role="dialog" aria-modal="true" aria-labelledby="sg-s-title"') + '><div class="ds-sheet__backdrop" data-close></div><section class="ds-sheet__panel">' +
      '<div class="ds-sheet__head"><h2 class="ds-sheet__title"' + (inline ? '' : ' id="sg-s-title"') + '>LAPTOP-0042</h2><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close" data-close>' + icon('close', 20) + '</button></div>' +
      '<div class="ds-sheet__body" tabindex="0"><dl class="ds-facts"><div><dt>Owner</dt><dd>Ada Lovelace</dd></div><div><dt>Location</dt><dd>Building A, 1st floor</dd></div></dl>' +
      '<div class="ds-field"><label class="ds-field__label" for="sg-sheet-note' + (inline ? '-i' : '') + '">Note</label><input class="ds-input" id="sg-sheet-note' + (inline ? '-i' : '') + '" placeholder="Add a note"></div>' +
      '<div class="ds-form-actions"><button class="ds-btn ds-btn--primary" type="button" data-close>Save</button><button class="ds-btn ds-btn--text" type="button" data-close>Cancel</button></div></div></section></div>';
  }

  /* Loading and progress */
  function loading() {
    return section('loading', 'Loading and progress', 'Fast loads show nothing: indicators fade in after the loader delay and then stay long enough not to flicker. With reduced motion they keep running, slower.',
      '<div class="ds-grid-2">' +
      card('Spinners and loading line', '<div class="sg-row"><span class="ds-spinner" aria-hidden="true"></span><button class="ds-btn ds-btn--primary" type="button" aria-disabled="true" aria-busy="true"><span class="ds-btn__swap"><span class="ds-spinner ds-spinner--sm" aria-hidden="true"></span>Saving</span></button><span class="ds-status ds-status--running"><span class="ds-spinner ds-status__spinner" aria-hidden="true"></span><span>Importing</span></span></div><div class="ds-loading" role="status"><span class="ds-spinner" aria-hidden="true"></span>Loading more devices ...</div>') +
      card('Progress', '<div class="ds-progress" id="sg-progress" style="--ds-progress:.4"><div class="ds-progress__track" role="progressbar" aria-label="Import" aria-valuemin="0" aria-valuemax="100" aria-valuenow="40"><div class="ds-progress__bar"></div></div><p class="ds-progress__label">40%</p><p class="ds-progress__detail">812 of 2,030 rows</p></div>' +
        '<div class="ds-progress ds-progress--indeterminate"><div class="ds-progress__track" role="progressbar" aria-label="Preparing"><div class="ds-progress__bar"></div></div><p class="ds-progress__label">Preparing the import ...</p></div>' +
        '<div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" data-sg="progress">Advance</button></div>') +
      '</div>' +
      card('Page skeleton', '<div class="ds-skeleton" role="status" style="position:relative"><span class="ds-sr">Loading the page ...</span>' +
        '<span class="ds-skeleton__line ds-skeleton__line--heading" aria-hidden="true"></span><span class="ds-skeleton__line ds-skeleton__line--lead" aria-hidden="true"></span>' +
        '<div class="ds-skeleton__card"><span class="ds-skeleton__line ds-skeleton__line--title"></span><span class="ds-skeleton__line"></span><span class="ds-skeleton__line ds-skeleton__line--short"></span></div>' +
        '<div class="ds-skeleton__card"><span class="ds-skeleton__line ds-skeleton__line--title"></span><span class="ds-skeleton__line"></span><span class="ds-skeleton__line ds-skeleton__line--mid"></span></div></div>'));
  }

  /* App frame */
  function frame() {
    return section('frame', 'App frame', 'This page is the frame: a top bar and a navigation drawer on the backdrop, one white panel that scrolls. Below 900px the drawer becomes a modal sheet (use the menu button). The sliding pill follows the section you read.',
      card('Segmented switch', '<div class="sg-row"><nav class="ds-segmented" id="sg-segmented" aria-label="Mode" style="margin-left:0"><a class="ds-segmented__option" href="#frame" aria-current="true">Live</a><a class="ds-segmented__option" href="#frame">Admin</a><a class="ds-segmented__option" href="#frame">Reports</a></nav></div>' +
        '<p class="ds-muted">The tint glides between options (DS.indicator); the current option is also set in the label weight.</p>') +
      card('Markup', '<pre class="sg-code">&lt;div class="ds-app ds-app--drawer"&gt;\n  &lt;div class="ds-topbar"&gt; menu button, .ds-brand, .ds-account &lt;/div&gt;\n  &lt;nav class="ds-drawer"&gt; .ds-drawer__list &gt; .ds-drawer__group &gt; .ds-drawer__item &lt;/nav&gt;\n  &lt;div class="ds-scrim"&gt;&lt;/div&gt;\n  &lt;div class="ds-panel"&gt;&lt;main class="ds-view"&gt;\n    &lt;div class="ds-content"&gt;&lt;div class="ds-page"&gt; ... &lt;/div&gt;&lt;/div&gt;\n  &lt;/main&gt;&lt;/div&gt;\n&lt;/div&gt;</pre><p class="ds-muted">Full markup in docs/components.md.</p>'));
  }

  /* Motion */
  function motion() {
    return section('motion', 'Motion', 'Material curves, short distances, exits faster than entrances, nothing that bounces. Everything slows to near-instant with reduced motion, except loaders.',
      '<div class="ds-grid-2">' +
      card('Enter and leave', '<div class="sg-stage"><div class="ds-card sg-stage__card" id="sg-motion-card"><h3 class="ds-card__title">A card</h3><p class="ds-muted">Plays the chosen entrance or exit.</p></div></div>' +
        '<div class="sg-row">' + ['', 'fade', 'scale', 'slide', 'swap'].map(function (v) { return '<button class="ds-btn ds-btn--sm" type="button" data-enter="' + v + '">enter' + (v ? ' ' + v : '') + '</button>'; }).join('') + '</div>' +
        '<div class="sg-row">' + ['', 'sink', 'scale', 'slide'].map(function (v) { return '<button class="ds-btn ds-btn--sm ds-btn--text" type="button" data-leave="' + v + '">leave' + (v ? ' ' + v : '') + '</button>'; }).join('') + '</div>') +
      card('Stagger, count, indicator', '<div class="sg-stage"><div class="sg-stagger-list" id="sg-stagger">' + new Array(9).join('<span></span>') + '</div></div>' +
        '<div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" data-sg="stagger">Stagger</button><button class="ds-btn ds-btn--sm" type="button" data-sg="fill">Fill as bars</button><button class="ds-btn ds-btn--sm" type="button" data-sg="count">Count up the tiles</button></div>' +
        '<div class="sg-track" id="sg-track"><button class="ds-btn ds-btn--sm" type="button" aria-pressed="true">Day</button><button class="ds-btn ds-btn--sm" type="button" aria-pressed="false">Week</button><button class="ds-btn ds-btn--sm" type="button" aria-pressed="false">Month</button><button class="ds-btn ds-btn--sm" type="button" aria-pressed="false">Year</button></div>') +
      '</div>' +
      card('Disclosure', '<details class="ds-collapsible"><summary>Show the motion rules</summary><ol class="ds-muted"><li>Animate only transform, opacity, colours, shadows and clip-path.</li><li>Opacity on the standard curve; entering movement decelerates, exits accelerate.</li><li>Updated data never animates; only first renders and user actions move.</li></ol></details>'));
  }

  /* Icons */
  function glyphs() {
    return Object.keys(I).filter(function (name) { return typeof I[name] === 'string' && I[name].charAt(0) === '<'; });
  }

  function icons() {
    return section('icons', 'Icons', glyphs().length + ' outline glyphs on a 24px grid, stroke 2, colour from currentColor. DS.icons.icon(DS.icons.name, size).',
      card('', '<div class="sg-icons">' + glyphs().map(function (name) {
        return '<div class="sg-icon">' + icon(name, 20) + '<span>' + name + '</span></div>';
      }).join('') + '</div>'));
  }

  /* ── Render ──────────────────────────────────────────────────────── */

  function render() {
    $('#sg-version').textContent = 'v' + DS.version;
    $('[data-sg="menu"]').innerHTML = icon('menu', 20);
    $('#sg-nav').innerHTML = NAV.map(function (group) {
      return '<div class="ds-drawer__group"><p class="ds-drawer__heading">' + group.group + '</p>' + group.items.map(function (item) {
        return '<a class="ds-drawer__item" href="#' + item[0] + '">' + icon(item[2], 20) + '<span class="ds-drawer__label">' + item[1] + '</span></a>';
      }).join('') + '</div>';
    }).join('');
    $('#sg-page').innerHTML = overview() + colour() + type() + shape() + buttons() + status() + cards() + table() + forms() + selection() + overlays() + loading() + frame() + motion() + icons();
    readValues();
  }

  /* Current values of the colour and type roles (they change with the theme). */
  function readValues() {
    var style = getComputedStyle(document.documentElement);
    $$('[data-value]').forEach(function (el) { el.textContent = style.getPropertyValue(el.dataset.value).trim(); });
    $$('[data-font]').forEach(function (el) {
      var sample = el.parentNode.firstChild;
      var s = getComputedStyle(sample);
      el.textContent = s.fontWeight + ' ' + s.fontSize + '/' + s.lineHeight;
    });
  }

  /* ── Navigation: drawer, active section, modal drawer ──────────────── */

  var app = $('#sg-app');
  var view = $('#main');
  var modal = window.matchMedia('(max-width: 900px)');
  var indicator = null;
  var segmented = null;
  var track = null;

  function setActive(id) {
    $$('.ds-drawer__item').forEach(function (a) {
      if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    if (indicator) indicator.update();
  }

  function openDrawer(open) {
    if (open) app.setAttribute('data-drawer-open', '');
    else app.removeAttribute('data-drawer-open');
    $('[data-sg="menu"]').setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('ds-no-scroll', open);
    if (open) $('#sg-drawer').focus();
  }

  function setupNavigation() {
    indicator = DS.indicator.createIndicator($('#sg-nav'), { active: '[aria-current="page"]', className: 'ds-drawer__indicator' });
    setActive('overview');
    var list = $('#sg-nav');
    var overflow = function () { list.classList.toggle('ds-drawer__list--overflow', list.scrollHeight > list.clientHeight + 1); };
    overflow();
    window.addEventListener('resize', overflow);
    var visible = {};
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { visible[entry.target.id] = entry.isIntersecting; });
      var first = $$('.sg-section').filter(function (s) { return visible[s.id]; })[0];
      if (first) setActive(first.id);
    }, { root: view, rootMargin: '0px 0px -60% 0px' });
    $$('.sg-section').forEach(function (s) { observer.observe(s); });

    view.addEventListener('scroll', function () {
      if (view.scrollTop > 0) app.setAttribute('data-scrolled', '');
      else app.removeAttribute('data-scrolled');
    }, { passive: true });

    $('#sg-nav').addEventListener('click', function (event) {
      var link = event.target.closest('a');
      if (!link) return;
      event.preventDefault();
      var target = $(link.getAttribute('href'));
      target.scrollIntoView({ behavior: M.prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', link.getAttribute('href'));
      if (modal.matches) openDrawer(false);
    });
    $('[data-sg="menu"]').addEventListener('click', function () { openDrawer(!app.hasAttribute('data-drawer-open')); });
    $('[data-sg="close-drawer"]').addEventListener('click', function () { openDrawer(false); });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && app.hasAttribute('data-drawer-open')) openDrawer(false);
    });

    segmented = DS.indicator.createIndicator($('#sg-segmented'), { active: '[aria-current="true"]', className: 'ds-segmented__indicator' });
    $('#sg-segmented').addEventListener('click', function (event) {
      var option = event.target.closest('a');
      if (!option) return;
      event.preventDefault();
      $$('.ds-segmented__option', this).forEach(function (o) { if (o === option) o.setAttribute('aria-current', 'true'); else o.removeAttribute('aria-current'); });
      segmented.update();
    });

    track = DS.indicator.createIndicator($('#sg-track'), { active: '[aria-pressed="true"]', className: 'sg-track__indicator' });
    $('#sg-track').addEventListener('click', function (event) {
      var button = event.target.closest('button');
      if (!button) return;
      $$('button', this).forEach(function (b) { b.setAttribute('aria-pressed', String(b === button)); });
      track.update();
    });
  }

  /* ── Demo behaviours ──────────────────────────────────────────────── */

  function openOverlay(markup, boxSelector, closingClass) {
    var holder = document.createElement('div');
    holder.innerHTML = markup;
    var overlay = holder.firstChild;
    var opener = document.activeElement;
    document.body.appendChild(overlay);
    document.body.classList.add('ds-no-scroll');
    var focusable = $('.ds-btn--primary, .ds-btn', $(boxSelector, overlay));
    if (focusable) focusable.focus();
    function close() {
      overlay.classList.add(closingClass);
      document.removeEventListener('keydown', onKey);
      M.settled($(boxSelector, overlay)).then(function () {
        overlay.remove();
        document.body.classList.remove('ds-no-scroll');
        if (opener) opener.focus();
      });
    }
    function onKey(event) { if (event.key === 'Escape') close(); }
    overlay.addEventListener('click', function (event) { if (event.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', onKey);
  }

  function toast(text, error) {
    var region = $('#sg-toasts');
    // Align the snackbars with the content panel (the drawer is beside it).
    var panel = $('.ds-panel').getBoundingClientRect();
    region.style.setProperty('--ds-toast-left', Math.round(panel.left + 24) + 'px');
    var el = document.createElement('div');
    el.className = 'ds-toast' + (error ? ' ds-toast--error' : '');
    if (error) el.setAttribute('role', 'alert');
    el.innerHTML = icon(error ? 'alertCircle' : 'checkCircle', 20) + '<span class="ds-toast__text">' + esc(text) + '</span>' +
      (error ? '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-toast__close" type="button" aria-label="Close">' + icon('close', 20) + '</button>' : '');
    region.appendChild(el);
    var close = function () { M.leave(el); };
    if (error) $('.ds-toast__close', el).addEventListener('click', close);
    else setTimeout(close, 4000);
  }

  function busy(button) {
    if (button.getAttribute('aria-busy') === 'true') return;
    var original = button.innerHTML;
    var width = button.offsetWidth;
    var startedAt = Date.now();
    button.setAttribute('aria-disabled', 'true');
    button.setAttribute('aria-busy', 'true');
    var timer = setTimeout(function () {
      button.style.minWidth = width + 'px';
      button.innerHTML = '<span class="ds-btn__swap ds-enter ds-enter--fade"><span class="ds-spinner ds-spinner--sm" aria-hidden="true"></span>Saving</span>';
    }, M.LOADER_DELAY_MS);
    setTimeout(function () {
      clearTimeout(timer);
      M.settleLoader(startedAt).then(function () {
        button.innerHTML = original;
        button.style.minWidth = '';
        button.removeAttribute('aria-disabled');
        button.removeAttribute('aria-busy');
        toast('Changes saved.');
      });
    }, 1600);
  }

  var tip = $('#sg-tooltip');
  var tipTimer = 0;
  function showTip(target, delay) {
    clearTimeout(tipTimer);
    tipTimer = setTimeout(function () {
      tip.textContent = target.getAttribute('data-tip');
      tip.hidden = false;
      var r = target.getBoundingClientRect();
      var w = tip.offsetWidth;
      tip.style.transform = 'translate(' + Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + 'px,' + (r.bottom + 8) + 'px)';
    }, delay);
  }
  function hideTip() {
    clearTimeout(tipTimer);
    if (!tip.hidden) M.leave(tip, '', { then: 'hide' });
  }

  function setupDemos() {
    document.addEventListener('click', function (event) {
      var el = event.target.closest('[data-sg], [data-enter], [data-leave]');
      if (!el) return;
      var action = el.getAttribute('data-sg');
      if (action === 'dialog') openOverlay(dialogMarkup(false), '.ds-dialog__box', 'ds-dialog--closing');
      if (action === 'sheet') openOverlay(sheetMarkup(false), '.ds-sheet__panel', 'ds-sheet--closing');
      if (action === 'toast') toast('Saved. The record is visible to everyone now.');
      if (action === 'toast-error') toast('Could not save. Check the connection and try again.', true);
      if (action === 'busy') busy(el);
      if (action === 'stagger') { var items = $$('#sg-stagger > span'); $('#sg-stagger').classList.remove('sg-fill'); M.stagger(items); items.forEach(function (i) { M.enter(i, 'scale'); }); }
      if (action === 'fill') { var bars = $$('#sg-stagger > span'); $('#sg-stagger').classList.add('sg-fill'); M.stagger(bars); bars.forEach(function (i) { M.enter(i, 'fill-x'); }); }
      if (action === 'count') countTiles();
      if (action === 'toggle' || action === 'dense') el.setAttribute('aria-pressed', String(el.getAttribute('aria-pressed') !== 'true'));
      if (action === 'dense') $('#sg-table').classList.toggle('ds-table--dense', el.getAttribute('aria-pressed') === 'true');
      if (action === 'progress') {
        var p = $('#sg-progress');
        var value = Math.min(1, (parseFloat(p.style.getPropertyValue('--ds-progress')) || 0) + 0.2);
        if (value >= 1 && parseFloat(p.style.getPropertyValue('--ds-progress')) >= 1) value = 0.1;
        p.style.setProperty('--ds-progress', String(value));
        $('.ds-progress__track', p).setAttribute('aria-valuenow', String(Math.round(value * 100)));
        $('.ds-progress__label', p).textContent = Math.round(value * 100) + '%';
        $('.ds-progress__detail', p).textContent = Math.round(value * 2030).toLocaleString('en-US') + ' of 2,030 rows';
      }
      if (el.hasAttribute('data-enter')) M.enter($('#sg-motion-card'), el.getAttribute('data-enter'));
      if (el.hasAttribute('data-leave')) {
        var card = $('#sg-motion-card');
        M.leave(card, el.getAttribute('data-leave'), { then: 'keep' }).then(function () {
          setTimeout(function () { card.classList.remove('ds-leave', 'ds-leave--sink', 'ds-leave--scale', 'ds-leave--slide'); M.enter(card, 'fade'); }, 400);
        });
      }
    });
    document.addEventListener('change', function (event) {
      var input = event.target;
      if (input.getAttribute('data-sg') === 'switch') $('.ds-switch__state', input.parentNode).textContent = input.checked ? 'On' : 'Off';
    });
    document.addEventListener('mouseover', function (event) { var t = event.target.closest('[data-tip]'); if (t) showTip(t, 500); });
    document.addEventListener('mouseout', function (event) { if (event.target.closest('[data-tip]')) hideTip(); });
    document.addEventListener('focusin', function (event) { var t = event.target.closest('[data-tip]'); if (t && t.matches(':focus-visible')) showTip(t, 0); });
    document.addEventListener('focusout', function (event) { if (event.target.closest('[data-tip]')) hideTip(); });
  }

  function countTiles() {
    $$('.ds-tile__value[data-count]').forEach(function (el) {
      var suffix = el.getAttribute('data-suffix') || '';
      M.countUp(el, Number(el.getAttribute('data-count')), {
        format: function (value) { return Math.round(value).toLocaleString('en-US') + suffix; },
      });
    });
  }

  /* ── Themes ───────────────────────────────────────────────────────── */

  var PRESETS = {
    square: '.ds-theme {\n  --ds-radius-xs: 0; --ds-radius-sm: 0; --ds-radius-md: 0; --ds-radius-lg: 0; --ds-radius-xl: 0; --ds-radius-2xl: 0;\n  --ds-radius-chip: 9999px;\n  --ds-elev-hover: none; --ds-elev-overlay: none;\n  --ds-dialog-border: 1px solid var(--ds-line);\n  --ds-backdrop: #ffffff; --ds-surface-low: #f6f6f6; --ds-surface-high: #f0f0f0;\n  --ds-text: #000000; --ds-primary: #202124; --ds-accent: #e8eaed; --ds-on-accent: #000000;\n  --ds-link-underline: rgba(0, 0, 0, .35);\n}',
    dim: '.ds-theme {\n  --ds-disabled-opacity: var(--ds-state-disabled); --ds-disabled-fill: initial; --ds-disabled-ink: initial;\n  --ds-font-body: var(--ds-weight-regular) 13px/18px var(--ds-font);\n  --ds-font-dense: var(--ds-weight-regular) 13px/18px var(--ds-font);\n  --ds-font-label: var(--ds-weight-label) 13px/18px var(--ds-font);\n  --ds-btn-height: 32px;\n}',
  };

  function applyTheme(value) {
    var link = $('#sg-theme-link');
    var style = $('#sg-theme-style');
    link.disabled = value !== 'example';
    if (value === 'example') link.href = '../themes/example.css';
    style.textContent = PRESETS[value] || '';
    try { localStorage.setItem('ds-styleguide-theme', value === 'file' ? 'default' : value); } catch (e) { /* storage may be blocked */ }
    setTimeout(function () { readValues(); if (indicator) indicator.update(); if (segmented) segmented.update(); if (track) track.update(); }, 120);
  }

  function setupThemes() {
    var select = $('#sg-theme-select');
    var file = $('#sg-theme-file');
    var saved = 'default';
    try { saved = localStorage.getItem('ds-styleguide-theme') || 'default'; } catch (e) { saved = 'default'; }
    if (saved !== 'default' && saved !== 'file') { select.value = saved; applyTheme(saved); }
    select.addEventListener('change', function () {
      if (select.value === 'file') { file.click(); return; }
      applyTheme(select.value);
    });
    file.addEventListener('change', function () {
      var chosen = file.files && file.files[0];
      if (!chosen) { select.value = 'default'; applyTheme('default'); return; }
      var reader = new FileReader();
      reader.onload = function () {
        $('#sg-theme-link').disabled = true;
        $('#sg-theme-style').textContent = String(reader.result);
        setTimeout(readValues, 120);
        toast('Theme loaded: ' + chosen.name);
      };
      reader.readAsText(chosen);
    });
  }

  render();
  setupNavigation();
  setupDemos();
  setupThemes();
  // First render: the page staggers in and the key figures count up once.
  M.stagger($$('#sg-page > .sg-section'));
  $('#sg-page').classList.add('ds-stagger');
  countTiles();
  if (location.hash && $(location.hash)) $(location.hash).scrollIntoView();
}());
