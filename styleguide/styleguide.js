/*
 * The living styleguide: every component with the markup of
 * docs/components.md, the tokens of the active theme, motion demos and the
 * icon set. A classic script on top of dist/ds.js, so it runs from disk.
 * Overlays (dialogs, sheets, the modal drawer, menus, the combobox list,
 * snackbars and tooltips) run through DS.overlay; the rest of the small
 * behaviours here (filtering the combobox, what a menu item does) is demo
 * code, not part of the system: projects bring their own.
 *
 * Hooks for the browser tests (test/browser/), harmless when opened by hand:
 *   html[data-sg-ready]   set once render, navigation, demos and themes are
 *                         set up and a saved theme has loaded
 *   html[data-sg-theme]   the theme last applied, set once its values and
 *                         the three indicators were updated
 *   ?speed=0.1            slow motion (a factor of 1 or less), marked
 *                         html[data-sg-speed]
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

  /* ── Slow motion: ?speed=<factor> ─────────────────────────────────── */

  // --ds-time-scale multiplies every duration and delay token: at
  // ?speed=0.1 it is 10 on the root .ds-theme element (<html>), so CSS
  // motion and everything DS.motion times from the tokens run ten times
  // slower. Only the styleguide and the tests set it.
  var speed = Number(new URLSearchParams(location.search).get('speed'));
  if (speed > 0 && speed < 1) {
    document.documentElement.setAttribute('data-sg-speed', String(speed));
    document.documentElement.style.setProperty('--ds-time-scale', String(1 / speed));
  }

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
      tile('Components', '25', 'apps', 'one file each') + tile('Tokens', '120+', 'settings', 'three layers') + tile('Icons', String(glyphs().length), 'image', 'outline, 24px grid') + tile('Dependencies', '0', 'box', 'plain CSS and JS') +
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
        label('Busy, then done: spinner only after the loader delay (DS.motion.busy)') +
        '<div class="sg-row"><button class="ds-btn ds-btn--primary" type="button" data-sg="busy">' + faces('Save changes', 'Saving', 'Saved') + '</button><button class="ds-btn" type="button" data-sg="busy-fail">' + faces('Sync now', 'Syncing', 'Synced') + '</button></div>' +
        label('Icon swaps: copy to check, a pressed toggle') +
        '<div class="sg-row"><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Copy link" data-sg="copy"><span class="ds-icon-swap">' + icon('copy', 20) + '</span></button>' +
        '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Work offline" aria-pressed="false" data-sg="toggle"><span class="ds-icon-swap"><span class="ds-icon-swap__a">' + icon('wifi', 20) + '</span><span class="ds-icon-swap__b">' + icon('wifiOff', 20) + '</span></span></button>' +
        '<button class="ds-link-btn" type="button">A button that reads like a link</button></div>') +
      '</div>' +
      card('Press, focus and disabled', '<p class="ds-muted">Point at a button in the first column for its hover, press and hold it for the morph and the ripple, or Tab to it for the ring that snaps in. The second column holds the press (a static .ds-pressed).</p>' +
        '<div class="ds-table-wrap"><table class="ds-table sg-states"><caption class="ds-sr">Button states</caption><thead><tr><th scope="col">Variant</th><th scope="col">Rest</th><th scope="col">Held press</th><th scope="col">Disabled</th><th scope="col">aria-disabled</th></tr></thead><tbody>' +
        BUTTON_VARIANTS.map(function (variant) {
          var make = function (extra) {
            return '<button class="ds-btn' + variant[1] + (extra === 'pressed' ? ' ds-pressed' : '') + '" type="button"' +
              (variant[2] ? ' aria-label="' + variant[2] + '"' : '') +
              (extra === 'pressed' ? ' data-ds-ripple="off" tabindex="-1"' : '') + (extra === 'disabled' ? ' disabled' : '') + (extra === 'aria' ? ' aria-disabled="true"' : '') + '>' + variant[3] + '</button>';
          };
          return '<tr><th scope="row">' + variant[0] + '</th><td>' + make('') + '</td><td>' + make('pressed') + '</td><td>' + make('disabled') + '</td><td>' + make('aria') + '</td></tr>';
        }).join('') + '</tbody></table></div>'));
  }

  /* The rows of the button state table: name, classes, aria-label, content. */
  var BUTTON_VARIANTS = [
    ['Primary', ' ds-btn--primary', '', 'Save'],
    ['Tonal', ' ds-btn--tonal', '', 'Add entry'],
    ['Outlined', '', '', 'Export'],
    ['Text', ' ds-btn--text', '', 'Details'],
    ['Quiet', ' ds-btn--quiet', '', icon('filter', 16) + 'Filter'],
    ['Icon', ' ds-btn--quiet ds-btn--icon', 'Settings', icon('settings', 20)],
    ['Disc', ' ds-btn--quiet ds-btn--icon ds-btn--disc', 'More actions', icon('moreVertical', 20)],
  ];

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
        '<dl class="ds-facts"><div><dt>Last run</dt><dd>Today, 02:00 <span class="ds-nowrap">(1 min 35 s)</span></dd></div><div><dt>Changes</dt><dd><span class="ds-parts"><span class="ds-parts__list"><span><a href="#table">3 new</a></span><span><a href="#table">1 updated</a></span><span>250 unchanged</span></span></span></dd></div><div><dt>Next</dt><dd>Tomorrow, 02:00</dd></div></dl>' +
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
      '<div class="ds-table-wrap"><table class="ds-table" id="sg-table"><caption class="ds-sr">Devices</caption><thead><tr><th scope="col"><input type="checkbox" aria-label="Select all devices" data-sg="select-all"></th><th scope="col" aria-sort="ascending"><button class="ds-table__sort" type="button">Device' + icon('arrowUp', 16) + '</button></th><th scope="col" class="ds-col--secondary">Model</th><th scope="col" class="ds-col--secondary">Owner</th><th scope="col" class="ds-num"><button class="ds-table__sort" type="button">Age (y)</button></th><th scope="col">Status</th></tr></thead><tbody>' +
      ROWS.map(function (row, index) {
        return '<tr><td><input type="checkbox" aria-label="Select ' + row[0] + '" data-sg="select-row"' + (index === 1 ? ' checked' : '') + '></td><td class="ds-nowrap"><button class="ds-link-btn" type="button">' + row[0] + '</button></td><td class="ds-col--secondary">' + row[1] + '</td><td class="ds-col--secondary">' + (row[2] || '<span class="ds-muted">Not issued</span>') + '</td><td class="ds-num">' + row[3] + '</td><td><span class="ds-status' + (row[4][0] ? ' ds-status--' + row[4][0] : '') + '">' + icon(row[4][1], 16) + '<span>' + row[4][2] + '</span></span></td></tr>';
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
      '<div class="ds-grid-2">' +
      card('Checkboxes and radios', label('In a row (.ds-check): the halo lights on the whole row') +
        '<div class="ds-stack"><fieldset class="ds-field"><legend class="ds-field__label">Options</legend>' +
        '<label class="ds-check"><input type="checkbox" checked><span>Checked</span></label>' +
        '<label class="ds-check"><input type="checkbox"><span>Not checked</span></label>' +
        '<label class="ds-check"><input type="checkbox" data-sg="indeterminate"><span>Some of them (indeterminate)</span></label>' +
        '<label class="ds-check"><input type="checkbox" aria-invalid="true" aria-describedby="sg-terms-error"><span>I accept the terms of use</span></label>' +
        '<small class="ds-field__hint ds-field__hint--error" id="sg-terms-error">' + icon('alertCircle', 16) + 'Accept the terms to continue.</small>' +
        '<label class="ds-check"><input type="checkbox" disabled><span>Locked by policy</span></label>' +
        '<label class="ds-check"><input type="checkbox" checked disabled><span>Required by policy</span></label></fieldset>' +
        '<fieldset class="ds-field"><legend class="ds-field__label">Delivery</legend>' +
        '<label class="ds-check"><input type="radio" name="sg-delivery" checked><span>Ship to the office</span></label>' +
        '<label class="ds-check"><input type="radio" name="sg-delivery"><span>Pick up in person</span></label>' +
        '<label class="ds-check"><input type="radio" name="sg-delivery" disabled><span>Courier (not available here)</span></label></fieldset></div>' +
        label('Anywhere (.ds-checkbox, .ds-radio-input)') +
        '<div class="sg-row"><input class="ds-checkbox" type="checkbox" aria-label="Checked" checked><input class="ds-checkbox" type="checkbox" aria-label="Indeterminate" data-sg="indeterminate"><input class="ds-checkbox" type="checkbox" aria-label="Not checked"><input class="ds-checkbox" type="checkbox" aria-label="Checked, in error" aria-invalid="true" checked><input class="ds-checkbox" type="checkbox" aria-label="Disabled" disabled checked>' +
        '<input class="ds-radio-input" type="radio" name="sg-size" aria-label="Small" checked><input class="ds-radio-input" type="radio" name="sg-size" aria-label="Large"><input class="ds-radio-input" type="radio" name="sg-size" aria-label="Huge (disabled)" disabled></div>') +
      card('Focus and validation', '<p class="ds-muted">The label takes the ring\'s colour while the field has the focus. Type something other than five digits: the message fades in and its room opens; it goes at once when the number is right.</p>' +
        '<div class="ds-field"><label class="ds-field__label" for="sg-ticket">Ticket number</label><input class="ds-input" id="sg-ticket" inputmode="numeric" autocomplete="off" placeholder="12345" data-sg="validate" aria-describedby="sg-ticket-error"><small class="ds-field__hint ds-field__hint--error" id="sg-ticket-error"></small></div>' +
        '<div class="ds-field"><label class="ds-field__label" for="sg-ticket-note">Note</label><input class="ds-input" id="sg-ticket-note" placeholder="Optional"></div>') +
      '</div>' +
      card('Toolbar, action bar and inline form', '<div class="ds-toolbar"><div class="ds-filters">' +
        '<div class="ds-field ds-field--grow"><label class="ds-sr" for="f-q">Search</label><div class="ds-search">' + icon('search', 20) + '<input class="ds-input" id="f-q" type="search" placeholder="Search name, owner or serial"></div></div>' +
        '<div class="ds-field"><label class="ds-field__label" for="f-status">Status</label><select class="ds-input ds-input--filled" id="f-status"><option>All</option><option>Active</option></select></div>' +
        '<div class="ds-field"><label class="ds-field__label" for="f-since">Since</label><input class="ds-input ds-input--filled" id="f-since" type="date"></div>' +
        '</div></div>' +
        '<div class="ds-action-bar"><div class="ds-search">' + icon('search', 20) + '<input class="ds-input" type="search" aria-label="Search devices" placeholder="Search devices"></div><button class="ds-btn ds-btn--quiet" type="button" aria-pressed="false" data-sg="toggle">' + icon('filter', 16) + 'Filter</button><button class="ds-btn ds-btn--tonal" type="button">' + icon('plus', 16) + 'Add</button><p class="ds-meta">128 devices</p></div>' +
        '<div class="ds-inline-form"><div class="ds-field"><label class="ds-field__label" for="f-ticket">Ticket number</label><input class="ds-input" id="f-ticket" placeholder="12345"></div><button class="ds-btn" type="button">Look up</button></div>'));
  }

  /* Chips, switch, combobox */
  /* A switch with both state words: the CSS shows and crossfades them. */
  function switchRow(name, attributes) {
    return '<label class="ds-switch"><input type="checkbox" role="switch"' + (attributes ? ' ' + attributes : '') + '><span class="ds-switch__track" aria-hidden="true"></span><span class="ds-switch__label">' + name + '</span>' +
      '<span class="ds-switch__state" aria-hidden="true"><span class="ds-switch__on">On</span><span class="ds-switch__off">Off</span></span></label>';
  }

  function selection() {
    var chip = function (text, checked, type, disabled) {
      return '<label class="ds-chip"><input class="ds-chip__input" type="' + (type || 'checkbox') + '" name="' + (type === 'radio' ? 'age' : 'status') + '"' + (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + '><span class="ds-chip__body">' + icon('check', 18, 'ds-chip__check') + '<span>' + text + '</span></span></label>';
    };
    return section('selection', 'Chips, switch, combobox', 'Selection always shows more than the tint: a check, the label weight, a state word.',
      '<div class="ds-grid-2">' +
      card('Filter chips', '<p class="ds-muted">The room of the check opens and the check draws itself; chips that move to another line glide there.</p><div><fieldset class="ds-chips"><legend class="ds-sr">Status</legend>' + chip('Active', true) + chip('In storage') + chip('Archived') + chip('Lent out') + chip('In repair') + '<span class="ds-chips__divider" aria-hidden="true"></span>' + chip('Older than 4 years', false, 'radio') + chip('Newer than 1 year', true, 'radio') + chip('Unavailable', false, 'checkbox', true) + chip('Required', true, 'checkbox', true) + '</fieldset></div>') +
      card('Switch', '<div class="ds-stack">' + switchRow('Nightly sync', 'checked') + switchRow('Email summary', '') +
        '<label class="ds-switch"><input type="checkbox" role="switch" data-sg="switch"><span class="ds-switch__track" aria-hidden="true"></span><span class="ds-switch__label">Weekly report (one word)</span><span class="ds-switch__state" aria-hidden="true">Off</span></label>' +
        switchRow('Locked by policy', 'disabled') + switchRow('Required by policy', 'checked disabled') + '</div>') +
      '</div>' +
      card('Combobox', '<p class="ds-muted">Type or use the chevron: the list grows out of the field, the chevron turns with it, and arrow keys move the active option.</p>' +
        '<div class="ds-field" style="max-width:420px">' + comboMarkup('f-combo', 'Model') + '</div>'));
  }

  /* The models of the combobox demos. */
  var MODELS = [['Latitude 5430', '14 inch · 2022'], ['Latitude 7440', '14 inch · 2023'], ['Latitude 9450', '14 inch · 2024'], ['Precision 3581', '15 inch · 2023'], ['OptiPlex 7010', 'Desktop · 2023'], ['Surface Laptop 5', '13 inch · 2022']];

  /* A closed combobox (docs/components.md, Combobox); setupCombo() wires it. */
  function comboMarkup(id, name) {
    return '<label class="ds-field__label" for="' + id + '">' + name + '</label>' +
      '<div class="ds-combo" data-sg-combo><input class="ds-input ds-combo__input" id="' + id + '" role="combobox" aria-expanded="false" aria-controls="' + id + '-list" aria-autocomplete="list" autocomplete="off">' +
      '<button class="ds-combo__toggle" type="button" tabindex="-1" aria-label="Show all">' + icon('chevronDown', 20) + '</button>' +
      '<div class="ds-combo__popup" hidden><ul class="ds-combo__list" id="' + id + '-list" role="listbox">' +
      MODELS.map(function (model, index) {
        return '<li class="ds-combo__option" id="' + id + '-' + index + '" role="option" aria-selected="false"><span class="ds-combo__name">' + model[0] + '</span><span class="ds-combo__meta">' + model[1] + '</span></li>';
      }).join('') +
      '</ul><p class="ds-combo__status" role="status">' + MODELS.length + ' models</p></div></div>';
  }

  /* Overlays */
  function overlays() {
    var tipButton = function (glyph, name) {
      return '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="' + name + '" data-tip="' + name + '">' + icon(glyph, 20) + '</button>';
    };
    return section('overlays', 'Overlays', 'Dialogs, side sheets, menus, snackbars and tooltips float over the page and open through DS.overlay: focus moves in and back at once, Escape closes the top one, and every motion turns back from where it is. Open the real ones or inspect them in place.',
      card('Try them', '<div class="sg-row"><button class="ds-btn ds-btn--primary" type="button" data-sg="dialog">Open dialog</button><button class="ds-btn" type="button" data-sg="dialog-div">Dialog (div markup)</button><button class="ds-btn" type="button" data-sg="dialog-combo">Dialog with a list</button><button class="ds-btn" type="button" data-sg="sheet">Open side sheet</button></div>' +
        '<div class="sg-row"><button class="ds-btn" type="button" data-sg="toast">Show snackbar</button><button class="ds-btn" type="button" data-sg="toast-error">Show error</button><button class="ds-btn" type="button" data-sg="toast-many">4 messages</button><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Copy link" data-tip="Copy link">' + icon('link', 20) + '</button>' +
        '<button class="ds-btn ds-btn--text" type="button" popovertarget="sg-presence">A popover (.ds-presence)</button></div>' +
        '<div class="ds-presence sg-presence" id="sg-presence" popover><p class="ds-card__title">A plain popover</p><p class="ds-muted">Toggled by popovertarget, no script: .ds-presence fades it in and out. Escape or a click outside closes it.</p></div>') +
      '<div class="ds-grid-2">' +
      card('Dialog', '<div class="sg-inline-overlay">' + dialogMarkup(true) + '</div>') +
      card('Side sheet', '<div class="sg-inline-overlay">' + sheetMarkup(true) + '</div>') +
      '</div>' +
      '<div class="ds-grid-2">' +
      '<section class="ds-card"><div class="ds-card__row"><h3 class="ds-card__title">LAPTOP-0042</h3><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Actions for LAPTOP-0042" aria-haspopup="menu" aria-expanded="false" aria-controls="sg-menu" data-sg-menu>' + icon('moreVertical', 20) + '</button></div>' +
        '<p class="ds-muted">An overflow menu: it grows out of its button, the arrow keys move through it, Escape gives focus back.</p>' +
        '<div class="ds-menu" role="menu" id="sg-menu" aria-label="Actions for LAPTOP-0042" hidden>' +
        '<button class="ds-menu__item" role="menuitem" type="button" data-sg-item="Opened the record.">' + icon('pencil', 20) + '<span class="ds-menu__label">Edit</span></button>' +
        '<button class="ds-menu__item" role="menuitem" type="button" data-sg-item="Duplicated as LAPTOP-0043.">' + icon('copy', 20) + '<span class="ds-menu__label">Duplicate</span></button>' +
        '<button class="ds-menu__item" role="menuitemcheckbox" type="button" aria-checked="true">' + icon('check', 20, 'ds-menu__check') + '<span class="ds-menu__label">Pinned to the top</span></button>' +
        '<div class="ds-menu__divider" role="separator"></div>' +
        '<button class="ds-menu__item" role="menuitem" type="button" data-sg-item="Archived. Undo from the archive.">' + icon('archive', 20) + '<span class="ds-menu__label">Archive</span></button>' +
        '<button class="ds-menu__item" role="menuitem" type="button" aria-disabled="true">' + icon('trash', 20) + '<span class="ds-menu__label">Delete (needs admin rights)</span></button>' +
        '</div></section>' +
      card('Tooltips along a toolbar', '<p class="ds-muted">Rest on one button: its tooltip comes after a moment. Then move along the row: the next ones show at once and swap in place.</p>' +
        '<div class="sg-row" role="toolbar" aria-label="Device actions">' + tipButton('sync', 'Sync now') + tipButton('download', 'Download report') + tipButton('history', 'Show history') + tipButton('lock', 'Lock device') + tipButton('settings', 'Device settings') + '</div>') +
      '</div>' +
      card('Snackbar and tooltip', '<div class="ds-stack"><div class="ds-toast sg-toast-demo">' + icon('checkCircle', 20) + '<span class="ds-toast__text">Saved. The record is visible to everyone now.</span><button class="ds-btn ds-btn--quiet ds-btn--icon ds-toast__close" type="button" aria-label="Close">' + icon('close', 20) + '</button></div>' +
        '<div class="ds-toast ds-toast--error sg-toast-demo">' + icon('alertCircle', 20) + '<span class="ds-toast__text">Could not save. Check the connection and try again.</span></div>' +
        '<div class="ds-tooltip sg-tooltip-demo">Copy link</div></div>'));
  }

  /* The inline dialog (inspected in place, .ds-dialog--contained). */
  function dialogMarkup(inline) {
    return '<div class="ds-dialog' + (inline ? ' ds-dialog--contained' : '') + '"><div class="ds-dialog__backdrop" data-close></div>' +
      '<div class="ds-dialog__box" role="' + (inline ? 'group' : 'alertdialog') + '"' + (inline ? '' : ' aria-modal="true" aria-labelledby="sg-d-title" aria-describedby="sg-d-text"') + '>' +
      '<h2 class="ds-dialog__title"' + (inline ? '' : ' id="sg-d-title"') + '>Delete 3 devices?</h2><p class="ds-dialog__text"' + (inline ? '' : ' id="sg-d-text"') + '>They disappear from every list. This cannot be undone.</p>' +
      '<div class="ds-dialog__actions"><button class="ds-btn ds-btn--text" type="button" data-close>Cancel</button><button class="ds-btn ds-btn--primary" type="button" data-close>Delete devices</button></div></div></div>';
  }

  /* The page dialogs (docs/components.md, Dialog). The native markup is
     the preferred one: showModal() makes the page inert; autofocus puts
     the first focus on Cancel, the safe choice of a destructive dialog. */
  function nativeDialogMarkup(id, title, text, action) {
    return '<dialog class="ds-dialog" id="' + id + '" role="alertdialog" aria-labelledby="' + id + '-title" aria-describedby="' + id + '-text"><div class="ds-dialog__backdrop" data-close></div>' +
      '<div class="ds-dialog__box"><h2 class="ds-dialog__title" id="' + id + '-title">' + title + '</h2><p class="ds-dialog__text" id="' + id + '-text">' + text + '</p>' +
      '<div class="ds-dialog__actions"><button class="ds-btn ds-btn--text" type="button" data-close autofocus>Cancel</button><button class="ds-btn ds-btn--primary" type="button" data-close>' + action + '</button></div></div></dialog>';
  }

  /* The div markup: the same tree, the role on the box. */
  function divDialogMarkup() {
    return '<div class="ds-dialog" id="sg-dialog-div" hidden><div class="ds-dialog__backdrop" data-close></div>' +
      '<div class="ds-dialog__box" role="alertdialog" aria-modal="true" aria-labelledby="sg-dd-title" aria-describedby="sg-dd-text">' +
      '<h2 class="ds-dialog__title" id="sg-dd-title">Archive 3 devices?</h2><p class="ds-dialog__text" id="sg-dd-text">They leave the active lists and stay in the archive for a year.</p>' +
      '<div class="ds-dialog__actions"><button class="ds-btn ds-btn--text" type="button" data-close autofocus>Cancel</button><button class="ds-btn ds-btn--primary" type="button" data-close>Archive devices</button></div></div></div>';
  }

  /* A dialog whose last field is a combobox: its list opens in the top
     layer (anchor positioning), so the dialog's scrolling box never clips it. */
  function comboDialogMarkup() {
    return '<dialog class="ds-dialog" id="sg-dialog-combo" aria-labelledby="sg-dc-title"><div class="ds-dialog__backdrop" data-close></div>' +
      '<div class="ds-dialog__box"><h2 class="ds-dialog__title" id="sg-dc-title">Replace the device</h2><p class="ds-dialog__text">Choose the model that takes over LAPTOP-0042. Its owner and location stay.</p>' +
      '<div class="ds-field">' + comboMarkup('sg-dc-model', 'New model') + '</div>' +
      '<div class="ds-dialog__actions"><button class="ds-btn ds-btn--text" type="button" data-close>Cancel</button><button class="ds-btn ds-btn--primary" type="button" data-close>Replace</button></div></div></dialog>';
  }

  /* The side sheet: inline (div, inspected in place) or the page's native
     one, with a button that opens a dialog over it (the nested scrim). */
  function sheetMarkup(inline) {
    var tag = inline ? 'div' : 'dialog';
    return '<' + tag + ' class="ds-sheet"' + (inline ? '' : ' id="sg-sheet" aria-labelledby="sg-s-title"') + '><div class="ds-sheet__backdrop" data-close></div><section class="ds-sheet__panel">' +
      '<div class="ds-sheet__head"><h2 class="ds-sheet__title"' + (inline ? '' : ' id="sg-s-title"') + '>LAPTOP-0042</h2><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close" data-close>' + icon('close', 20) + '</button></div>' +
      '<div class="ds-sheet__body" tabindex="0"><dl class="ds-facts"><div><dt>Owner</dt><dd>Ada Lovelace</dd></div><div><dt>Location</dt><dd>Building A, 1st floor</dd></div></dl>' +
      '<div class="ds-field"><label class="ds-field__label" for="sg-sheet-note' + (inline ? '-i' : '') + '">Note</label><input class="ds-input" id="sg-sheet-note' + (inline ? '-i' : '') + '" placeholder="Add a note"></div>' +
      '<div class="ds-form-actions"><button class="ds-btn ds-btn--primary" type="button" data-close>Save</button><button class="ds-btn ds-btn--text" type="button" data-close>Cancel</button>' +
      (inline ? '' : '<button class="ds-btn ds-btn--text" type="button" data-sg="dialog-nested">Retire the device</button>') + '</div></div></section></' + tag + '>';
  }

  /* Loading and progress */
  function loading() {
    return section('loading', 'Loading and progress', 'Fast loads show nothing: indicators fade in after the loader delay and then stay long enough not to flicker. Their loops always run at their token speed.',
      '<div class="ds-grid-2">' +
      card('Spinners and loading line', '<div class="sg-row"><span class="ds-spinner" aria-hidden="true"></span><button class="ds-btn ds-btn--primary" type="button" aria-busy="true">' + faces('Save', 'Saving', 'Saved') + '</button><span class="ds-status ds-status--running"><span class="ds-spinner ds-status__spinner" aria-hidden="true"></span><span>Importing</span></span></div><div class="ds-loading" role="status"><span class="ds-spinner" aria-hidden="true"></span>Loading more devices ...</div>') +
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
  /* The pages of the view swap demo (App frame). */
  var SWAP_PAGES = [
    ['Devices', 'Every laptop and desktop, synced nightly.'],
    ['Tickets', 'Three open, one waiting for a part.'],
    ['Owners', 'Forty-two people in six teams.'],
  ];

  function swapPage(index) {
    var page = SWAP_PAGES[index % SWAP_PAGES.length];
    return '<div class="sg-swap-page"><h4 class="ds-card__title">' + page[0] + '</h4><p class="ds-muted">' + page[1] + '</p></div>';
  }

  function frame() {
    var segment = function (text, current) {
      return '<a class="ds-segmented__option" href="#frame" data-label="' + text + '"' + (current ? ' aria-current="true"' : '') + '>' + text + '</a>';
    };
    return section('frame', 'App frame', 'This page is the frame: a top bar and a navigation drawer on the backdrop, one white panel that scrolls. Below 900px the drawer becomes a modal sheet (use the menu button): it opens on the spring and closes accelerating, and crossing 900px never slides it. Scroll the page and the top bar tints with the hairline under it. The sliding pill follows the section you read; press and hold a drawer item or a segmented option and it turns squarer, then springs back.',
      card('Segmented switch', '<div class="sg-row"><nav class="ds-segmented" id="sg-segmented" aria-label="Mode" style="margin-left:0">' + segment('Live', true) + segment('Admin') + segment('Reports') + '</nav></div>' +
        '<p class="ds-muted">The tint glides between options (DS.indicator) and the labels change colour while it arrives; the current option is also set in the label weight. data-label keeps the width of the heavier weight, so the switch never changes width.</p>') +
      card('Drawer and view', '<div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" data-sg="drawer-toggle" aria-pressed="false">View without the drawer</button><button class="ds-btn ds-btn--sm" type="button" data-sg="swap-view">Swap the view</button></div>' +
        '<div class="sg-stage sg-swap-stage"><div class="sg-swap-view" id="sg-swap-view">' + swapPage(0) + '</div></div>' +
        '<p class="ds-muted">Without the drawer the panel takes the width; when the drawer comes back it slides in from the left (DS.motion.enter(drawer)). The swap fades the view\'s children out (.ds-view--leaving), waits for that fade, replaces the content and lets it enter (swap); pressing again during a swap ends on the latest view.</p>' +
        '<pre class="sg-code">const modal = matchMedia(\'(max-width: 900px)\');\nmodal.addEventListener(\'change\', () =&gt; {\n  drawer.classList.add(\'ds-drawer--instant\');\n  if (!modal.matches) {\n    app.removeAttribute(\'data-drawer-open\');\n    document.body.classList.remove(\'ds-no-scroll\');\n  }\n  requestAnimationFrame(() =&gt; requestAnimationFrame(() =&gt;\n    drawer.classList.remove(\'ds-drawer--instant\')));\n});</pre>' +
        '<p class="ds-muted">The breakpoint snippet this page runs: the drawer turns modal (or back) in place, and a modal drawer that a wider window no longer shows is closed.</p>') +
      card('Markup', '<pre class="sg-code">&lt;div class="ds-app ds-app--drawer"&gt;\n  &lt;div class="ds-topbar"&gt; menu button, .ds-brand, .ds-account &lt;/div&gt;\n  &lt;nav class="ds-drawer"&gt; .ds-drawer__list &gt; .ds-drawer__group &gt; .ds-drawer__item &lt;/nav&gt;\n  &lt;div class="ds-scrim"&gt;&lt;/div&gt;\n  &lt;div class="ds-panel"&gt;&lt;main class="ds-view"&gt;\n    &lt;div class="ds-content"&gt;&lt;div class="ds-page"&gt; ... &lt;/div&gt;&lt;/div&gt;\n  &lt;/main&gt;&lt;/div&gt;\n&lt;/div&gt;</pre><p class="ds-muted">Full markup in docs/components.md.</p>'));
  }

  /* Motion */
  function motion() {
    return section('motion', 'Motion', 'Material curves for fades, a gentle spring for movement that floats, short distances, exits faster than entrances. The same motion on every device; ?speed=0.1 in the address plays it ten times slower.',
      '<div class="ds-grid-2">' +
      card('Enter and leave', '<div class="sg-stage"><div class="ds-card sg-stage__card" id="sg-motion-card"><h3 class="ds-card__title">A card</h3><p class="ds-muted">Plays the chosen entrance or exit.</p></div></div>' +
        '<div class="sg-row">' + ['', 'fade', 'scale', 'slide', 'swap'].map(function (v) { return '<button class="ds-btn ds-btn--sm" type="button" data-enter="' + v + '">enter' + (v ? ' ' + v : '') + '</button>'; }).join('') + '</div>' +
        '<div class="sg-row">' + ['', 'sink', 'scale', 'slide', 'pop'].map(function (v) { return '<button class="ds-btn ds-btn--sm ds-btn--text" type="button" data-leave="' + v + '">leave' + (v ? ' ' + v : '') + '</button>'; }).join('') + '</div>') +
      card('Stagger and count', '<div class="sg-stage"><div class="sg-stagger-list" id="sg-stagger">' + new Array(9).join('<span></span>') + '</div></div>' +
        '<div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" data-sg="stagger">Stagger</button><button class="ds-btn ds-btn--sm" type="button" data-sg="fill">Fill as bars</button><button class="ds-btn ds-btn--sm" type="button" data-sg="count">Count up the tiles</button></div>' +
        '<div class="ds-progress sg-count-progress" id="sg-count-progress" style="--ds-progress:.6"><div class="ds-progress__track" role="progressbar" aria-label="Share counted" aria-valuemin="0" aria-valuemax="100" aria-valuenow="60"><div class="ds-progress__bar"></div></div><p class="ds-progress__label" id="sg-count-figure">60%</p><p class="ds-progress__detail">figure and bar land together</p></div>') +
      '</div>' +
      card('Indicator', '<p class="ds-muted">The pill stretches toward its target (the leading edge leads, the trailing edge follows), passes it by a hair and settles on the spring; a longer jump takes longer, up to a cap. It follows aria-pressed by itself: the buttons below only change the attribute. A new target mid-glide continues from where the pill is.</p>' +
        '<div class="sg-track" id="sg-track">' + ['Day', 'Week', 'Month', 'Quarter', 'Year', 'All time'].map(function (name, index) {
          return '<button class="ds-btn ds-btn--sm" type="button" aria-pressed="' + (index ? 'false' : 'true') + '">' + name + '</button>';
        }).join('') + '</div>' +
        '<div class="sg-row"><button class="ds-btn ds-btn--sm ds-btn--text" type="button" data-sg="track-hop">Hop to the neighbour</button><button class="ds-btn ds-btn--sm ds-btn--text" type="button" data-sg="track-jump">Jump across</button><button class="ds-btn ds-btn--sm ds-btn--text" type="button" data-sg="track-interrupt">Interrupt (two targets 80ms apart)</button><button class="ds-btn ds-btn--sm ds-btn--quiet" type="button" data-sg="track-clear" aria-pressed="false">No active item</button></div>') +
      card('Data motion', '<p class="ds-muted">A keyed list re-rendered with DS.dom.morphHtml inside DS.motion.flip: rows glide to their new places, new rows fade in, removed rows fade out of the flow. Typing filters on every keystroke. The live feed reorders every 1.5s; while the mouse is over the list or a row has focus, values change at once and the reorder waits (at most 2s).</p>' +
        '<div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" data-sg="data-add">' + icon('plus', 16) + 'Add</button><button class="ds-btn ds-btn--sm" type="button" data-sg="data-remove">Remove</button><button class="ds-btn ds-btn--sm" type="button" data-sg="data-shuffle">Shuffle</button><button class="ds-btn ds-btn--sm" type="button" data-sg="data-sort">Sort by load</button><button class="ds-btn ds-btn--sm ds-btn--quiet" type="button" data-sg="data-live" aria-pressed="false">Live feed</button></div>' +
        '<div class="ds-field sg-data-filter"><label class="ds-field__label" for="sg-data-filter">Filter</label><input class="ds-input" id="sg-data-filter" type="search" autocomplete="off" placeholder="Device name"></div>' +
        '<p class="ds-meta sg-data-status" id="sg-data-status" aria-live="polite"><span>' + dataCount() + '</span></p>' +
        '<ul class="ds-kv-list sg-data-list" id="sg-data-list">' + dataHtml() + '</ul>') +
      card('Disclosure', '<details class="ds-collapsible"><summary>Show the motion rules</summary><ol class="ds-muted"><li>Animate only transform, opacity, colours, shadows and clip-path.</li><li>Fades on the standard curve, floating movement on a gentle spring; exits accelerate.</li><li>Data changes glide: figures count from the shown value, reordered rows move to their new places; a refresh never replays an entrance.</li></ol></details>'));
  }

  /* Data motion: a keyed list, its state and its markup. */
  var data = {
    items: [
      { id: 'd1', name: 'LAPTOP-0042', load: 72 },
      { id: 'd2', name: 'LAPTOP-0017', load: 35 },
      { id: 'd3', name: 'PRINTER-0003', load: 88 },
      { id: 'd4', name: 'TABLET-0121', load: 14 },
      { id: 'd5', name: 'LAPTOP-0108', load: 51 },
      { id: 'd6', name: 'DESKTOP-0009', load: 63 },
    ],
    next: 7,
    filter: '',
    sorted: false,
    feed: 0,
  };

  function dataShown() {
    var query = data.filter.trim().toLowerCase();
    return data.items.filter(function (item) { return !query || item.name.toLowerCase().indexOf(query) !== -1; });
  }

  function dataCount() {
    var shown = dataShown().length;
    return shown === data.items.length ? data.items.length + ' devices' : shown + ' of ' + data.items.length + ' devices';
  }

  function dataHtml() {
    var shown = dataShown();
    if (!shown.length) return '<li><span class="ds-muted">No device matches "' + esc(data.filter.trim()) + '".</span></li>';
    return shown.map(function (item) {
      return '<li data-ds-key="' + item.id + '"><span>' + esc(item.name) + '</span><strong class="ds-num">' + item.load + '%</strong></li>';
    }).join('');
  }

  /* Re-renders the list through flip(); `status` (optional) rolls in below the buttons. */
  function updateData(status, live) {
    var list = $('#sg-data-list');
    if (data.sorted) data.items.sort(function (a, b) { return b.load - a.load; });
    M.flip(list, function (options) { DS.dom.morphHtml(list, dataHtml(), options); }, live ? { live: true } : {});
    M.roll($('#sg-data-status'), status ? dataCount() + ' · ' + status : dataCount());
  }

  function dataAction(action, button) {
    var names = ['LAPTOP', 'TABLET', 'DESKTOP', 'PRINTER'];
    if (action === 'data-add' && data.items.length < 12) {
      var id = data.next;
      data.next += 1;
      var item = { id: 'd' + id, name: names[id % names.length] + '-0' + (200 + id), load: Math.round(5 + Math.random() * 90) };
      data.items.splice(Math.floor(Math.random() * (data.items.length + 1)), 0, item);
      updateData('added ' + item.name);
    }
    if (action === 'data-remove' && data.items.length) {
      var gone = data.items.splice(Math.floor(Math.random() * data.items.length), 1)[0];
      updateData('removed ' + gone.name);
    }
    if (action === 'data-shuffle') {
      data.sorted = false;
      for (var i = data.items.length - 1; i > 0; i -= 1) {
        var j = Math.floor(Math.random() * (i + 1));
        var swap = data.items[i];
        data.items[i] = data.items[j];
        data.items[j] = swap;
      }
      updateData('shuffled');
    }
    if (action === 'data-sort') {
      data.sorted = true;
      updateData('sorted by load');
    }
    if (action === 'data-live') {
      var on = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(on));
      clearInterval(data.feed);
      data.feed = 0;
      if (on) {
        data.sorted = true;
        data.feed = setInterval(function () {
          data.items.forEach(function (row) {
            if (Math.random() < 0.5) row.load = Math.max(1, Math.min(99, row.load + Math.round((Math.random() - 0.5) * 40)));
          });
          updateData(null, true);
        }, 1500);
      }
      M.roll($('#sg-data-status'), dataCount() + ' · live feed ' + (on ? 'on' : 'off'));
    }
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

  /* The indicators follow aria-current and aria-pressed by themselves
     (their MutationObserver): no update() after a change. */
  function setActive(id) {
    $$('.ds-drawer__item').forEach(function (a) {
      if (a.getAttribute('href') === '#' + id) {
        if (a.getAttribute('aria-current') !== 'page') a.setAttribute('aria-current', 'page');
      } else if (a.hasAttribute('aria-current')) {
        a.removeAttribute('aria-current');
      }
    });
  }

  /* The modal drawer through DS.overlay: the scroll lock, the inert page,
     Escape, the scrim, and focus back on the menu button at once. */
  function openDrawer(open) {
    var drawer = $('#sg-drawer');
    if (open) DS.overlay.open(drawer, { opener: $('[data-sg="menu"]') });
    else DS.overlay.close(drawer);
  }

  /* Scroll-spy with a programmatic smooth scroll: a drawer link sets its
     item current at once and mutes the spy until the scroll ends, so the
     pill does not walk through every section on the way. The end is
     scrollend where it exists (Progressive), else a quiet period without
     scroll events (--ds-dur-fast) that each scroll event restarts. The
     period only starts with the first scroll event (a busy page may start
     the smooth scroll late), and a link to where the view already is mutes
     nothing, since no scroll follows. */
  var navigating = false;
  var quietTimer = 0;

  /** Whether scrolling `section` to the top of the view moves the view. */
  function scrollsTo(section) {
    var margin = parseFloat(getComputedStyle(section).scrollMarginTop) || 0;
    var top = section.getBoundingClientRect().top - view.getBoundingClientRect().top - view.clientTop - margin + view.scrollTop;
    var target = Math.max(0, Math.min(view.scrollHeight - view.clientHeight, top));
    return Math.abs(target - view.scrollTop) >= 1;
  }

  function stopNavigating() {
    navigating = false;
    clearTimeout(quietTimer);
  }

  function waitForQuiet() {
    clearTimeout(quietTimer);
    quietTimer = setTimeout(stopNavigating, M.motionDuration(view, '--ds-dur-fast'));
  }

  /* The breakpoint snippet of docs/components.md: crossing 900px changes
     the drawer in place (no slide, no scrim fade) and closes a modal
     drawer that the wider window no longer shows. */
  function setupBreakpoint() {
    var drawer = $('#sg-drawer');
    modal.addEventListener('change', function () {
      drawer.classList.add('ds-drawer--instant');
      if (!modal.matches && app.hasAttribute('data-drawer-open')) openDrawer(false);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { drawer.classList.remove('ds-drawer--instant'); });
      });
    });
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
      if (navigating) return;
      var first = $$('.sg-section').filter(function (s) { return visible[s.id]; })[0];
      if (first) setActive(first.id);
    }, { root: view, rootMargin: '0px 0px -60% 0px' });
    $$('.sg-section').forEach(function (s) { observer.observe(s); });

    view.addEventListener('scroll', function () {
      if (view.scrollTop > 0) app.setAttribute('data-scrolled', '');
      else app.removeAttribute('data-scrolled');
      if (navigating && !('onscrollend' in view)) waitForQuiet();
    }, { passive: true });
    if ('onscrollend' in view) view.addEventListener('scrollend', function () { if (navigating) stopNavigating(); });

    $('#sg-nav').addEventListener('click', function (event) {
      var link = event.target.closest('a');
      if (!link) return;
      event.preventDefault();
      var id = link.getAttribute('href').slice(1);
      var section = $('#' + id);
      setActive(id);
      stopNavigating();
      navigating = scrollsTo(section);
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', '#' + id);
      if (modal.matches) openDrawer(false);
    });
    setupBreakpoint();
    // The scrim and Escape close the drawer by themselves (DS.overlay).
    $('[data-sg="menu"]').addEventListener('click', function () { openDrawer(!app.hasAttribute('data-drawer-open')); });

    segmented = DS.indicator.createIndicator($('#sg-segmented'), { active: '[aria-current="true"]', className: 'ds-segmented__indicator' });
    $('#sg-segmented').addEventListener('click', function (event) {
      var option = event.target.closest('a');
      if (!option) return;
      event.preventDefault();
      $$('.ds-segmented__option', this).forEach(function (o) { if (o === option) o.setAttribute('aria-current', 'true'); else o.removeAttribute('aria-current'); });
    });

    track = DS.indicator.createIndicator($('#sg-track'), { active: '[aria-pressed="true"]', className: 'sg-track__indicator' });
    $('#sg-track').addEventListener('click', function (event) {
      var button = event.target.closest('button');
      if (button) pressTrack($$('#sg-track > button').indexOf(button));
    });
  }

  /* The indicator demo: the track's options and the one shown before "No
     active item" cleared it. */
  var trackLast = 0;
  var trackTimer = 0;

  function pressTrack(index) {
    clearTimeout(trackTimer);
    var clear = $('[data-sg="track-clear"]');
    if (clear) clear.setAttribute('aria-pressed', 'false');
    $$('#sg-track > button').forEach(function (b, i) { b.setAttribute('aria-pressed', String(i === index)); });
    if (index >= 0) trackLast = index;
  }

  function trackDemo(action, button) {
    var count = $$('#sg-track > button').length;
    if (action === 'track-hop') pressTrack(trackLast + 1 < count ? trackLast + 1 : trackLast - 1);
    if (action === 'track-jump') pressTrack(trackLast < count / 2 ? count - 1 : 0);
    if (action === 'track-interrupt') {
      // The second target 80ms later (slowed down with ?speed=), while the
      // first glide still runs: the pill turns from where it is.
      var far = trackLast < count / 2 ? count - 1 : 0;
      var middle = Math.floor(count / 2);
      pressTrack(far);
      trackTimer = setTimeout(function () { pressTrack(middle); }, speed > 0 && speed < 1 ? 80 / speed : 80);
    }
    if (action === 'track-clear') {
      if (button.getAttribute('aria-pressed') === 'true') {
        pressTrack(trackLast);
      } else {
        pressTrack(-1);
        button.setAttribute('aria-pressed', 'true');
      }
    }
  }

  /* Drawer and view demos (App frame). */
  var swapRun = 0;
  var swapIndex = 0;

  /* The documented swap sequence (docs/components.md, App frame): fade the
     children out, wait for that fade, replace, and let the new content
     enter in the same task; a newer swap takes over. */
  function swapView() {
    var target = $('#sg-swap-view');
    var run = swapRun += 1;
    swapIndex += 1;
    target.classList.add('ds-view--leaving');
    M.settled(target.firstElementChild, { event: 'transitionend', property: 'opacity' }).then(function () {
      if (run !== swapRun) return;
      target.innerHTML = swapPage(swapIndex);
      target.classList.remove('ds-view--leaving');
      M.enter(target.firstElementChild, 'swap');
    });
  }

  function toggleDrawer(button) {
    var drawer = $('#sg-drawer');
    var hide = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(hide));
    if (hide) {
      if (app.hasAttribute('data-drawer-open')) openDrawer(false);
      // Docked, the drawer fades out first; then the view has none.
      if (modal.matches) app.setAttribute('data-drawer-hidden', '');
      else M.leave(drawer, '', { then: 'hide' }).then(function () { if (button.getAttribute('aria-pressed') === 'true') app.setAttribute('data-drawer-hidden', ''); });
      return;
    }
    app.removeAttribute('data-drawer-hidden');
    // A view that has the drawer again: it slides in from the left.
    if (modal.matches) drawer.hidden = false;
    else M.enter(drawer);
  }

  /* ── Demo behaviours ──────────────────────────────────────────────── */

  /* The page overlays exist while they show: built on the first open,
     taken back by a second open while they close (DS.overlay continues
     the motion from where it is), and removed once DS.overlay has hidden
     them again (it drops data-state then). */
  var shownOverlays = {};

  function showOverlay(name, markup, opener) {
    var overlay = shownOverlays[name];
    if (!overlay || !overlay.isConnected) {
      var holder = document.createElement('div');
      holder.innerHTML = markup;
      overlay = shownOverlays[name] = holder.firstChild;
      document.body.appendChild(overlay);
      $$('[data-sg-combo]', overlay).forEach(setupCombo);
      new MutationObserver(function (records, observer) {
        if (overlay.hasAttribute('data-state')) return;
        observer.disconnect();
        overlay.remove();
      }).observe(overlay, { attributes: true, attributeFilter: ['data-state'] });
    }
    return DS.overlay.open(overlay, { opener: opener });
  }

  /* Snackbars through DS.overlay.toast(): at most three, the others glide;
     an error stays until it is closed. */
  function toast(text, kind) {
    var region = $('#sg-toasts');
    // Aligned with the content panel (the drawer is beside it); while a
    // side sheet has taken the region in, DS.overlay sets the edge.
    if (region.parentNode === document.body) region.style.setProperty('--ds-toast-left', Math.round($('.ds-panel').getBoundingClientRect().left + 24) + 'px');
    return DS.overlay.toast(region, text, { kind: kind === true ? 'error' : kind || 'success' });
  }

  /* "4 messages": an error that waits for its close button, then three
     that close by themselves; the fourth message replaces the oldest of
     those, and the others glide to make room. */
  function manyToasts() {
    var messages = [
      ['Could not reach the directory server. Owners may be out of date.', 'error'],
      ['Imported 128 devices.', 'success'],
      ['Synced LAPTOP-0042.', 'info'],
      ['Exported the list as CSV.', 'success'],
    ];
    var step = speed > 0 && speed < 1 ? 250 / speed : 250;
    messages.forEach(function (message, index) {
      setTimeout(function () { toast(message[0], message[1]); }, index * step);
    });
  }

  /*
   * The combobox demos: the page filters and chooses, DS.overlay opens
   * and closes the list (the chevron follows aria-expanded). Focus stays
   * in the field: a press in the list or on the chevron keeps it there.
   */
  function setupCombo(combo) {
    var input = $('.ds-combo__input', combo);
    var popup = $('.ds-combo__popup', combo);
    var list = $('.ds-combo__list', combo);
    var status = $('.ds-combo__status', combo);
    var options = $$('.ds-combo__option', list);
    var isOpen = function () { return input.getAttribute('aria-expanded') === 'true'; };
    var shown = function () { return options.filter(function (option) { return !option.hidden; }); };
    var activeOption = function () { return options.filter(function (option) { return option.hasAttribute('data-active'); })[0] || null; };
    var nameOf = function (option) { return $('.ds-combo__name', option).textContent; };

    function setActive(option) {
      options.forEach(function (each) { if (each !== option) each.removeAttribute('data-active'); });
      if (!option) { input.removeAttribute('aria-activedescendant'); return; }
      option.setAttribute('data-active', '');
      input.setAttribute('aria-activedescendant', option.id);
      if (isOpen()) option.scrollIntoView({ block: 'nearest' });
    }

    // Filtering never re-creates or re-hides the list: without a match the
    // list part hides and the status says so.
    function filter() {
      var query = input.value.trim().toLowerCase();
      options.forEach(function (option) { option.hidden = query !== '' && nameOf(option).toLowerCase().indexOf(query) === -1; });
      var count = shown().length;
      list.hidden = count === 0;
      status.textContent = count === 0 ? 'No model matches' : count === options.length ? options.length + ' models' : count + ' of ' + options.length + ' models';
      if (activeOption() && activeOption().hidden) setActive(null);
    }

    function open() { if (!isOpen()) DS.overlay.open(popup, { opener: input }); }
    function close() { if (isOpen()) DS.overlay.close(popup); }

    function choose(option) {
      options.forEach(function (each) { each.setAttribute('aria-selected', String(each === option)); });
      input.value = nameOf(option);
      close();
      filter();
    }

    function move(step) {
      var visible = shown();
      if (!visible.length) return;
      var index = visible.indexOf(activeOption());
      setActive(visible[index < 0 ? (step > 0 ? 0 : visible.length - 1) : (index + step + visible.length) % visible.length]);
    }

    input.addEventListener('input', function () { filter(); open(); });
    input.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (!isOpen()) { open(); return; }
        move(event.key === 'ArrowDown' ? 1 : -1);
      } else if (event.key === 'Enter' && isOpen() && activeOption()) {
        event.preventDefault();
        choose(activeOption());
      }
    });
    input.addEventListener('blur', close);
    // Presses in the list and on the chevron keep focus in the field.
    [popup, $('.ds-combo__toggle', combo)].forEach(function (part) {
      part.addEventListener('mousedown', function (event) { event.preventDefault(); });
    });
    $('.ds-combo__toggle', combo).addEventListener('click', function () {
      if (isOpen()) { close(); return; }
      input.focus();
      open();
    });
    list.addEventListener('pointermove', function (event) {
      var option = event.target.closest('.ds-combo__option');
      if (option && option !== activeOption()) setActive(option);
    });
    list.addEventListener('click', function (event) {
      var option = event.target.closest('.ds-combo__option');
      if (option) choose(option);
    });
  }

  /* The overflow menu: the trigger toggles it, ArrowDown and ArrowUp open
     it on the first or last item; DS.overlay does the rest. Items say what
     they did in a snackbar; the checkable one flips its check. */
  function setupMenus() {
    $$('[data-sg-menu]').forEach(function (trigger) {
      var menu = document.getElementById(trigger.getAttribute('aria-controls'));
      trigger.addEventListener('click', function () {
        if (trigger.getAttribute('aria-expanded') === 'true') DS.overlay.close(menu);
        else DS.overlay.open(menu, { opener: trigger });
      });
      trigger.addEventListener('keydown', function (event) {
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        event.preventDefault();
        DS.overlay.open(menu, { opener: trigger });
      });
      menu.addEventListener('click', function (event) {
        var item = event.target.closest('.ds-menu__item');
        if (!item || item.getAttribute('aria-disabled') === 'true') return;
        if (item.getAttribute('role') === 'menuitemcheckbox') item.setAttribute('aria-checked', String(item.getAttribute('aria-checked') !== 'true'));
        if (item.hasAttribute('data-sg-item')) toast(item.getAttribute('data-sg-item'));
      });
    });
  }

  /* The faces of a button that works (button.css): the label, the busy
     face with the small spinner, the done face with a check that draws. */
  function faces(label, busyLabel, doneLabel) {
    return '<span class="ds-btn__faces"><span class="ds-btn__face">' + esc(label) + '</span>' +
      '<span class="ds-btn__face ds-btn__face--busy" aria-hidden="true"><span class="ds-spinner ds-spinner--sm"></span>' + esc(busyLabel) + '</span>' +
      '<span class="ds-btn__face ds-btn__face--done" aria-hidden="true">' + icon('check', 16) + esc(doneLabel) + '</span></span>';
  }

  // DS.motion.busy() holds the busy face for the loader minimum and shows
  // the success face; the width never changes (the faces share one cell).
  function busy(button) {
    M.busy(button, function () {
      return new Promise(function (resolve) { setTimeout(resolve, speed > 0 && speed < 1 ? 1600 / speed : 1600); });
    }).then(function () { toast('Changes saved.'); });
  }

  // The failing twin: the busy face goes at once on the error (no success
  // face), and the page says what went wrong.
  function busyFail(button) {
    M.busy(button, function () {
      return new Promise(function (resolve, reject) {
        setTimeout(function () { reject(new Error('The sync server did not answer.')); }, speed > 0 && speed < 1 ? 1600 / speed : 1600);
      });
    }).catch(function () { toast('Could not sync. Check the connection and try again.', true); });
  }

  // Copy link: the icon swaps to a drawn check for --ds-hold-success, then
  // back (DS.motion.crossfade, kind 'icon'; a press meanwhile restarts it).
  var copyTimer = 0;
  function copied(button) {
    var swap = $('.ds-icon-swap', button);
    clearTimeout(copyTimer);
    M.crossfade(swap, icon('check', 20), { kind: 'icon' });
    copyTimer = setTimeout(function () {
      M.crossfade(swap, icon('copy', 20), { kind: 'icon' });
    }, M.motionDuration(button, '--ds-hold-success'));
  }

  function setupDemos() {
    document.addEventListener('click', function (event) {
      var el = event.target.closest('[data-sg], [data-enter], [data-leave]');
      if (!el) return;
      var action = el.getAttribute('data-sg');
      if (action === 'dialog') showOverlay('dialog', nativeDialogMarkup('sg-dialog', 'Delete 3 devices?', 'They disappear from every list. This cannot be undone.', 'Delete devices'), el);
      if (action === 'dialog-div') showOverlay('dialog-div', divDialogMarkup(), el);
      if (action === 'dialog-combo') showOverlay('dialog-combo', comboDialogMarkup(), el);
      if (action === 'dialog-nested') showOverlay('dialog-nested', nativeDialogMarkup('sg-dialog-nested', 'Retire LAPTOP-0042?', 'It leaves the active lists; its history stays.', 'Retire device'), el);
      if (action === 'sheet') showOverlay('sheet', sheetMarkup(false), el);
      if (action === 'toast') toast('Saved. The record is visible to everyone now.');
      if (action === 'toast-error') toast('Could not save. Check the connection and try again.', true);
      if (action === 'toast-many') manyToasts();
      if (action === 'busy') busy(el);
      if (action === 'busy-fail') busyFail(el);
      if (action === 'copy') copied(el);
      if (action === 'stagger') {
        // enterAll(): one batch, each square scales in one step after the
        // other; the classes and --ds-i go once each one landed.
        $('#sg-stagger').classList.remove('sg-fill');
        M.enterAll($$('#sg-stagger > span'), 'scale');
      }
      if (action === 'fill') {
        $('#sg-stagger').classList.add('sg-fill');
        M.enterAll($$('#sg-stagger > span'), 'fill-x');
      }
      if (action === 'count') countMore();
      if (action && action.indexOf('data-') === 0) dataAction(action, el);
      if (action && action.indexOf('track-') === 0) trackDemo(action, el);
      if (action === 'drawer-toggle') toggleDrawer(el);
      if (action === 'swap-view') swapView();
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
      // enter() and leave() continue from where the card is, whenever they
      // are pressed; enter() also cleans up whatever variant played before.
      // Every press is a new run: a superseded leave() still resolves (without
      // acting), so only the latest press may bring the card back.
      if (el.hasAttribute('data-enter') || el.hasAttribute('data-leave')) {
        clearTimeout(backTimer);
        leaveRun += 1;
      }
      if (el.hasAttribute('data-enter')) M.enter($('#sg-motion-card'), el.getAttribute('data-enter'));
      if (el.hasAttribute('data-leave')) {
        var card = $('#sg-motion-card');
        var run = leaveRun;
        M.leave(card, el.getAttribute('data-leave'), { then: 'keep' }).then(function () {
          if (run !== leaveRun || !card.classList.contains('ds-leave')) return;
          backTimer = setTimeout(function () {
            if (run === leaveRun) M.enter(card, 'fade');
          }, 400);
        });
      }
    });
    $('#sg-data-filter').addEventListener('input', function (event) {
      data.filter = event.target.value;
      updateData(data.filter.trim() ? 'filtered' : null);
    });
    document.addEventListener('change', function (event) {
      var input = event.target;
      if (input.getAttribute('data-sg') === 'switch') $('.ds-switch__state', input.parentNode).textContent = input.checked ? 'On' : 'Off';
      if (input.getAttribute('data-sg') === 'select-all') $$('[data-sg="select-row"]').forEach(function (row) { row.checked = input.checked; });
      if (input.getAttribute('data-sg') === 'select-row') syncSelectAll();
    });
    // The ticket field: checked on every keystroke, the message only
    // changes when the verdict does (so it fades in once).
    $('#sg-ticket').addEventListener('input', function (event) {
      var field = event.target;
      var wrong = field.value.trim() !== '' && !/^\d{5}$/.test(field.value.trim());
      if (wrong === (field.getAttribute('aria-invalid') === 'true')) return;
      if (wrong) field.setAttribute('aria-invalid', 'true');
      else field.removeAttribute('aria-invalid');
      $('#sg-ticket-error').innerHTML = wrong ? icon('alertCircle', 16) + 'A ticket number has five digits.' : '';
    });
    // The mixed state exists only as a property.
    $$('[data-sg="indeterminate"]').forEach(function (input) { input.indeterminate = true; });
    syncSelectAll();
    // Every [data-tip] of the page: delay, warm-up along a toolbar,
    // hoverable, Escape (DS.overlay.tooltips creates its own tooltip).
    DS.overlay.tooltips(document);
    $$('#sg-page [data-sg-combo]').forEach(setupCombo);
    setupMenus();
  }

  /* The header checkbox of the table: checked, mixed or empty by its rows. */
  function syncSelectAll() {
    var rows = $$('[data-sg="select-row"]');
    var checked = rows.filter(function (row) { return row.checked; }).length;
    var all = $('[data-sg="select-all"]');
    all.checked = checked === rows.length;
    all.indeterminate = checked > 0 && checked < rows.length;
  }

  /* The leave demo brings the card back 400ms after its exit, unless another press came first. */
  var leaveRun = 0;
  var backTimer = 0;

  /* Counts every tile to its data-count, from the value it shows (0 on the first render). */
  function countTiles() {
    $$('.ds-tile__value[data-count]').forEach(function (el) {
      var suffix = el.getAttribute('data-suffix') || '';
      M.countUp(el, Number(el.getAttribute('data-count')), {
        format: function (value) { return Math.round(value).toLocaleString('en-US') + suffix; },
      });
    });
  }

  /*
   * The count demo: the tiles of the cards section count up by a step from
   * the value they show (a second press retargets a running count), and
   * the figure next to the button counts with its bar, so both land
   * together (--ds-ease-value over --ds-dur-glide).
   */
  function countMore() {
    $$('#cards .ds-tile__value[data-count]').forEach(function (el) {
      var value = Number(el.getAttribute('data-count'));
      el.setAttribute('data-count', String(value + Math.max(1, Math.round(value * 0.05))));
    });
    countTiles();
    var progress = $('#sg-count-progress');
    var share = parseFloat(progress.style.getPropertyValue('--ds-progress')) || 0;
    share = share >= 0.95 ? 0.15 : Math.min(1, Math.round((share + 0.2) * 100) / 100);
    progress.style.setProperty('--ds-progress', String(share));
    $('.ds-progress__track', progress).setAttribute('aria-valuenow', String(Math.round(share * 100)));
    M.countUp($('#sg-count-figure'), Math.round(share * 100), { format: function (value) { return Math.round(value) + '%'; } });
  }

  /* ── Themes ───────────────────────────────────────────────────────── */

  var PRESETS = {
    square: '.ds-theme {\n  --ds-radius-xs: 0; --ds-radius-sm: 0; --ds-radius-md: 0; --ds-radius-lg: 0; --ds-radius-xl: 0; --ds-radius-2xl: 0;\n  --ds-radius-chip: 9999px;\n  --ds-elev-hover: none; --ds-elev-overlay: none;\n  --ds-dialog-border: 1px solid var(--ds-line);\n  --ds-backdrop: #ffffff; --ds-surface-low: #f6f6f6; --ds-surface-high: #f0f0f0;\n  --ds-text: #000000; --ds-primary: #202124; --ds-accent: #e8eaed; --ds-on-accent: #000000;\n  --ds-link-underline: rgba(0, 0, 0, .35);\n}',
    dim: '.ds-theme {\n  --ds-disabled-opacity: var(--ds-state-disabled); --ds-disabled-fill: initial; --ds-disabled-ink: initial;\n  --ds-font-body: var(--ds-weight-regular) 13px/18px var(--ds-font);\n  --ds-font-dense: var(--ds-weight-regular) 13px/18px var(--ds-font);\n  --ds-font-label: var(--ds-weight-label) 13px/18px var(--ds-font);\n  --ds-btn-height: 32px;\n}',
  };

  /* Counts theme changes: a slow load that a newer choice overtook still
     calls its `done`, but never updates or marks the page. */
  var themeRun = 0;

  /* Once a theme's rules apply: refresh the shown values, re-place the
     three indicators, then mark the theme for the tests. */
  function afterThemeChange(value) {
    readValues();
    if (indicator) indicator.update();
    if (segmented) segmented.update();
    if (track) track.update();
    document.documentElement.setAttribute('data-sg-theme', value);
  }

  /* Calls back once the theme link has its sheet: at once when the href is
     unchanged and the sheet is there (no load event follows), otherwise on
     the link's load or error event. */
  function whenLinkLoaded(link, href, callback) {
    if (link.href === new URL(href, document.baseURI).href && link.sheet) { callback(); return; }
    var finish = function () {
      link.removeEventListener('load', finish);
      link.removeEventListener('error', finish);
      callback();
    };
    link.addEventListener('load', finish);
    link.addEventListener('error', finish);
    link.href = href;
  }

  /* Applies a theme (a value of the select), then calls `done`. */
  function applyTheme(value, done) {
    var link = $('#sg-theme-link');
    var style = $('#sg-theme-style');
    var run = themeRun += 1;
    var finish = function () {
      if (run === themeRun) afterThemeChange(value);
      if (done) done();
    };
    try { localStorage.setItem('ds-styleguide-theme', value === 'file' ? 'default' : value); } catch (e) { /* storage may be blocked */ }
    style.textContent = PRESETS[value] || '';
    link.disabled = value !== 'example';
    if (value === 'example') { whenLinkLoaded(link, '../themes/example.css', finish); return; }
    // A <style> preset applies synchronously: one frame for layout.
    requestAnimationFrame(finish);
  }

  /* Wires the switcher and applies the saved theme, then calls `done`. */
  function setupThemes(done) {
    var select = $('#sg-theme-select');
    var file = $('#sg-theme-file');
    var saved = 'default';
    try { saved = localStorage.getItem('ds-styleguide-theme') || 'default'; } catch (e) { saved = 'default'; }
    select.addEventListener('change', function () {
      if (select.value === 'file') { file.click(); return; }
      applyTheme(select.value);
    });
    file.addEventListener('change', function () {
      var chosen = file.files && file.files[0];
      if (!chosen) { select.value = 'default'; applyTheme('default'); return; }
      var reader = new FileReader();
      reader.onload = function () {
        var run = themeRun += 1;
        $('#sg-theme-link').disabled = true;
        $('#sg-theme-style').textContent = String(reader.result);
        requestAnimationFrame(function () { if (run === themeRun) afterThemeChange('file'); });
        toast('Theme loaded: ' + chosen.name);
      };
      reader.readAsText(chosen);
    });
    if (saved !== 'default' && saved !== 'file') {
      select.value = saved;
      applyTheme(saved, done);
    } else {
      done();
    }
  }

  render();
  // Every action gets the pointer ripple (and iOS its :active feedback).
  DS.ripple.attach(document);
  setupNavigation();
  setupDemos();
  setupThemes(function () {
    // Tests wait for this instead of racing the first stagger.
    document.documentElement.setAttribute('data-sg-ready', '');
  });
  // First render: the sections in view stagger in once, and the key
  // figures count up from 0. The figure of the count demo starts at what
  // it shows, so its first count runs from there with its bar.
  M.staggerOnce($('#sg-page'));
  countTiles();
  M.countUp($('#sg-count-figure'), 60, { duration: 0, format: function (value) { return Math.round(value) + '%'; } });
  if (location.hash && $(location.hash)) $(location.hash).scrollIntoView();
}());
