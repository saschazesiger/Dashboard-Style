/*
 * The Dashboard panel demo: one panel per state its data goes through
 * (ready, loading, refreshing, failed, no data, stale), the variants, and a
 * flush list. The states are markup the page writes; the menus open through
 * the system (data-ds-open). wire() holds what a page does itself: the fake
 * loads behind Refresh and Try again (DS.motion.refresh, DS.dom.morphHtml).
 */
var DP_DAYS = [['Mon', 12], ['Tue', 18], ['Wed', 9], ['Thu', 22], ['Fri', 15], ['Sat', 4], ['Sun', 6]];

function dpColumns(h, label, values) {
  var max = Math.max.apply(null, values.map(function (day) { return day[1]; }));
  return '<figure class="ds-columns"><figcaption class="ds-sr">' + label + '</figcaption><ol class="ds-columns__plot">' + values.map(function (day) {
    return '<li class="ds-columns__col" style="--ds-share: ' + (day[1] / max).toFixed(2) + '"><span class="ds-columns__value">' + day[1] + '</span>' +
      '<span class="ds-columns__fill" aria-hidden="true"></span><span class="ds-columns__label">' + day[0] + '</span></li>';
  }).join('') + '</ol></figure>';
}

function dpMenu(h, id, title) {
  return '<button class="ds-btn ds-btn--icon ds-btn--quiet ds-sm" type="button" aria-label="Actions for ' + title + '" data-tip="Actions" aria-haspopup="menu" aria-expanded="false" aria-controls="' + id + '" data-ds-open="#' + id + '">' + h.icon('moreVertical', 18) + '</button>' +
    '<div class="ds-menu" id="' + id + '" role="menu" aria-label="' + title + '" hidden>' +
    '<button class="ds-menu__item" role="menuitem" type="button" data-dp-refresh>' + h.icon('refresh', 20) + '<span class="ds-menu__label">Refresh</span></button>' +
    '<button class="ds-menu__item" role="menuitem" type="button">' + h.icon('download', 20) + '<span class="ds-menu__label">Export CSV</span></button>' +
    '<button class="ds-menu__item" role="menuitem" type="button">' + h.icon('fullscreen', 20) + '<span class="ds-menu__label">View full screen</span></button></div>';
}

function dpPanel(h, o) {
  var title = h.uid('dp-title');
  return '<section class="ds-dashpanel' + (o.cls ? ' ' + o.cls : '') + '" aria-labelledby="' + title + '"' + (o.busy ? ' aria-busy="true"' : '') + ' data-demo="' + o.demo + '">' +
    '<header class="ds-dashpanel__head"><div class="ds-dashpanel__heading"><h3 class="ds-dashpanel__title" id="' + title + '">' + o.title + '</h3>' +
    (o.subtitle ? '<p class="ds-dashpanel__subtitle">' + o.subtitle + '</p>' : '') + '</div>' +
    '<div class="ds-dashpanel__actions">' + (o.actions || '') + dpMenu(h, h.uid('dp-menu'), o.title) + '</div>' +
    '<span class="ds-loadbar" aria-hidden="true"><span class="ds-loadbar__bar"></span></span></header>' +
    '<div class="ds-dashpanel__body' + (o.flush ? ' ds-dashpanel__body--flush' : '') + '">' + o.body + '</div>' +
    (o.foot ? '<div class="ds-dashpanel__foot">' + o.foot + '</div>' : '') + '</section>';
}

function dpSkeleton() {
  return '<div class="ds-skeleton" role="status"><span class="ds-sr">Loading</span><span class="ds-skeleton__line ds-skeleton__line--title"></span>' +
    '<span class="ds-skeleton__media"></span></div>';
}

function dpEmpty(h, kind, icon, title, text, action) {
  return '<div class="ds-empty ds-empty--' + kind + '"><span class="ds-empty__disc" aria-hidden="true">' + h.icon(icon, 24) + '</span>' +
    '<p class="ds-empty__title">' + title + '</p><p class="ds-empty__text">' + text + '</p>' + (action || '') + '</div>';
}

SG.demo('dashpanel', {
  title: 'Dashboard panel',
  group: 'layout',
  need: 'Hold one chart, table or list of a dashboard under a title, with a menu and its loading, error and no-data states',
  lead: 'A titled block of a dashboard with its menu at the end and the states its data goes through. Panels fill their grid cell, so a row lines up whatever each one shows; a state that replaces the content keeps the place. The options panel changes the padding and the head (density), the corners (shape) and the targets (touch).',
  options: { sizes: false, density: true, shape: true, tones: false, variants: ['outlined', 'filled', 'elevated'] },

  render: function (h) {
    var look = h.variant && h.variant !== 'outlined' ? 'ds-dashpanel--' + h.variant : '';
    var updated = '<span>Updated 09:12</span><a class="ds-link--quiet" href="#tickets">All tickets</a>';
    var refresh = '<button class="ds-btn ds-btn--icon ds-btn--quiet ds-sm" type="button" aria-label="Refresh devices online" data-tip="Refresh" data-dp-refresh>' + h.icon('refresh', 18) + '</button>';
    var tryAgain = '<button class="ds-btn ds-btn--tonal" type="button" data-dp-retry>' + h.icon('refresh', 16) + 'Try again</button>';
    var states = '<div class="ds-grid-2">' +
      dpPanel(h, { demo: 'ready', cls: look, title: 'Tickets per day', subtitle: 'Last 7 days', body: dpColumns(h, 'Tickets opened per day, last 7 days', DP_DAYS), foot: updated }) +
      dpPanel(h, { demo: 'loading', cls: look, busy: true, title: 'Devices by building', subtitle: 'Today', body: dpSkeleton() }) +
      dpPanel(h, { demo: 'refresh', cls: look, title: 'Devices online', subtitle: 'Per hour', actions: refresh, body: dpColumns(h, 'Devices online per hour', [['8', 40], ['9', 62], ['10', 71], ['11', 68], ['12', 55], ['13', 66]]) }) +
      dpPanel(h, { demo: 'failed', cls: look, title: 'Warranty ends', subtitle: 'Next 90 days', body: dpEmpty(h, 'error', 'alertCircle', 'Could not load the warranties', 'The inventory service did not answer.', tryAgain) }) +
      dpPanel(h, { demo: 'empty', cls: look, title: 'Open repairs', subtitle: 'This week', body: dpEmpty(h, 'no-data', 'wrench', 'No open repairs', 'Repairs show up here once a ticket asks for one.') }) +
      dpPanel(h, { demo: 'stale', cls: look, title: 'Latest check-ins', subtitle: 'Live', flush: true,
        actions: '<span class="ds-status ds-tone-warning">' + h.icon('clock', 16) + '<span>Stale</span></span>',
        body: '<ul class="ds-list" aria-label="Latest check-ins">' + [['LAPTOP-0042', 'Ada Lovelace · 09:12'], ['TABLET-0121', 'Service desk · 08:40'], ['LAPTOP-0017', 'Alan Turing · 08:02']].map(function (row) {
          return '<li class="ds-list__item"><span class="ds-list__text"><span class="ds-list__title">' + row[0] + '</span><span class="ds-list__meta">' + row[1] + '</span></span></li>';
        }).join('') + '</ul>' }) +
      '</div>';
    var variants = h.variant ? '' : h.section('Variants', '<div class="ds-grid-2">' + [['outlined', '', 'Outlined: the hairline on the surface.'], ['filled', 'ds-dashpanel--filled', 'Filled: the low surface, for a panel inside a card.'], ['elevated', 'ds-dashpanel--elevated', 'Elevated: a shadow instead of the hairline.']].map(function (item) {
      return dpPanel(h, { demo: 'variant-' + item[0], cls: item[1], title: item[0].charAt(0).toUpperCase() + item[0].slice(1), subtitle: 'Variant', body: '<p class="ds-muted">' + item[2] + '</p>' });
    }).join('') + '</div>');
    return h.section('States', states,
      'Ready with its foot; loading (aria-busy on the panel, a skeleton); refreshing (Refresh, or Refresh in the menu: the body dims and the loading bar runs along the head after the loader delay); failed with Try again; no data; stale data told by a status with its word.') +
      variants +
      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches the actions of each panel; the menu button opens its menu (<kbd class="ds-kbd">Enter</kbd>, <kbd class="ds-kbd">Space</kbd> or <kbd class="ds-kbd">ArrowDown</kbd>), <kbd class="ds-kbd">Escape</kbd> closes it and the focus is back on the button. The panel is a region named by its title.</p>');
  },

  wire: function (root, h) {
    function load(ms, fail) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () { if (fail) reject(new Error('The inventory service did not answer.')); else resolve(); }, h.slow(ms));
      });
    }
    root.addEventListener('click', function (event) {
      var refresh = event.target.closest('[data-dp-refresh]');
      if (refresh) {
        var body = h.$('.ds-dashpanel__body', refresh.closest('.ds-dashpanel'));
        DS.motion.refresh(body, function () { return load(1400); }, { loadbar: false }).then(function () { h.toast('Refreshed.', 'success'); });
        return;
      }
      var retry = event.target.closest('[data-dp-retry]');
      if (!retry) return;
      var failed = retry.closest('.ds-dashpanel');
      var place = h.$('.ds-dashpanel__body', failed);
      failed.setAttribute('aria-busy', 'true');
      DS.dom.morphHtml(place, dpSkeleton());
      load(1200).then(function () {
        failed.removeAttribute('aria-busy');
        DS.dom.morphHtml(place, dpColumns(h, 'Warranties that end per month', [['Dec', 4], ['Jan', 9], ['Feb', 2]]));
      });
    });
  },
});
