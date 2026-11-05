/*
 * The Page demo: a record's head with its back link, status, actions, key
 * facts and tabs; a sticky head that condenses in a scrolling box; actions
 * that fold into More; breadcrumbs; the layout helpers; the page states; a
 * sign-in page in a box. Registered through SG.demo() (styleguide/sg-core.js). The
 * options panel reaches the controls inside: the page's own rhythm is layout.
 */
function head(h, tabs, extra, actions) {
  return '<header class="ds-page-head' + (extra || '') + '">' +
    '<a class="ds-btn ds-btn--text ds-sm ds-page-head__back" href="#">' + h.icon('arrowLeft', 18) + '<span class="ds-sr">Back to </span>Devices</a>' +
    '<div class="ds-page-head__row"><div class="ds-page-head__text">' +
      '<h3 class="ds-page-head__title">LAPTOP-0042</h3>' +
      '<p class="ds-page-head__lead">Laptop 14 · issued to Ada Lovelace · 2 of 128</p>' +
      '<div class="ds-page-head__status"><span class="ds-status ds-tone-success">' + h.icon('check', 16) + '<span>Synced</span></span></div>' +
    '</div><div class="ds-page-head__actions">' + (actions || '<button class="ds-btn" type="button">Retire</button><button class="ds-btn ds-btn--filled" type="button">Edit</button>') + '</div></div>' +
    '<dl class="ds-page-head__details">' +
      '<div class="ds-page-head__detail"><dt>Owner</dt><dd>Ada Lovelace</dd></div>' +
      '<div class="ds-page-head__detail"><dt>Site</dt><dd>Building B</dd></div>' +
      '<div class="ds-page-head__detail"><dt>Last sync</dt><dd>Today, 09:12</dd></div>' +
      '<div class="ds-page-head__detail"><dt>Serial</dt><dd>SN-7440-0042</dd></div>' +
    '</dl>' +
    (tabs ? '<div class="ds-page-head__tabs"><nav class="ds-tabs" aria-label="LAPTOP-0042" data-ds-tabs data-demo="tabs"><a class="ds-tabs__tab" href="#" aria-current="page" data-label="Overview">Overview</a><a class="ds-tabs__tab" href="#" data-label="Activity">Activity</a><a class="ds-tabs__tab" href="#" data-label="Settings">Settings</a></nav></div>' : '') +
  '</header>';
}

/** Four actions: they fold into More from the first, the filled one last. */
function many(h) {
  return '<button class="ds-btn" type="button" data-demo="action">' + h.icon('copy', 18) + 'Duplicate</button>' +
    '<a class="ds-btn" href="#" data-demo="action">' + h.icon('download', 18) + 'Export</a>' +
    '<button class="ds-btn" type="button" aria-disabled="true" data-tip="Only an admin may retire a device">Retire</button>' +
    '<button class="ds-btn ds-btn--filled" type="button" data-demo="action">' + h.icon('pencil', 18) + 'Edit</button>';
}

var SCROLL_BOX = 'block-size: 440px; overflow-y: auto; border: 1px solid var(--ds-line); border-radius: calc(var(--ds-radius-md) * var(--ds-shape, 1)); padding: 0 var(--ds-space-4) var(--ds-space-4); background: var(--ds-backdrop);';

SG.demo('page', {
  title: 'Page',
  group: 'navigation',
  need: 'Lay out a page: its head, breadcrumbs, columns of cards, and a sign-in page',
  lead: 'The padded content area, one page of cards and its head. The options panel reaches the controls inside; the page\'s own rhythm and padding are layout.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var email = h.uid('auth-email');
    return h.section('A record\'s head', head(h, true),
      'The way back, the title with its lead and status, the actions on the title\'s centre line (under the title at 600px of the content), a row of key facts and the record\'s tabs.') +

      h.section('Sticky, condensing', '<div style="' + SCROLL_BOX + '" data-demo="sticky-box">' + head(h, true, ' ds-page-head--sticky" data-ds-page-head data-demo="sticky', many(h)) +
        '<div class="ds-stack">' + ['Hardware', 'Software', 'Network', 'History', 'Notes'].map(function (title) {
          return h.card(title, '<p class="ds-muted" style="min-block-size: 96px;">The ' + title.toLowerCase() + ' of LAPTOP-0042.</p>');
        }).join('') + '</div></div>',
        'Scroll inside the box: once the way back, the lead, the status and the key facts have scrolled past, the head condenses (data-scrolled) and keeps the title, the actions and the tabs; the content stays where it was. The hairline fades in with the scroll.') +

      h.section('Actions that fold', '<div style="inline-size: min(100%, 360px);">' + head(h, false, '" data-ds-page-head data-demo="folding', many(h)) + '</div>',
        'In a narrow row the actions that do not fit go into More, the first ones first and the filled one last. A blocked action stays blocked in the menu. The row is 360px wide here, as on a phone.') +

      h.section('A plain head', '<header class="ds-page-head"><h3 class="ds-page-head__title">Devices</h3><p class="ds-page-head__lead">Every laptop and desktop, synced nightly.</p></header>') +

      h.section('Breadcrumbs', '<nav class="ds-breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="#">Inventory</a></li><li><a href="#">Devices</a></li><li><a href="#" aria-current="page">LAPTOP-0042</a></li></ol></nav>',
        'In place of the back link. At 600px of the content only the parent shows: the way up.') +

      h.section('Columns', '<div class="ds-page" style="inline-size: 100%;">' +
        '<div class="ds-grid-2">' + h.card('Devices', '<p class="ds-muted">128 devices.</p>') + h.card('Tickets', '<p class="ds-muted">3 open.</p>') + '</div>' +
        '<div class="ds-stack">' + h.card('Sites', '<p class="ds-muted">Building A and Building B.</p>') + h.card('People', '<p class="ds-muted">Grace Hopper joined on Monday.</p>') + '</div>' +
        '<button class="ds-btn" type="button">Add a card</button>' +
        '</div>', '.ds-grid-2 is two columns (one below 900px), .ds-stack one; a stack directly in the page keeps the page\'s rhythm, and a lone button keeps its own width.') +

      h.section('States', '<div class="ds-stack">' +
        '<div class="ds-alert ds-tone-error" role="alert">' + h.icon('alertCircle', 20) + '<span class="ds-alert__text">The device list did not load.</span><button class="ds-btn ds-btn--text ds-sm" type="button">Retry</button></div>' +
        '<div class="ds-empty"><p class="ds-empty__title">This device is gone</p><p class="ds-empty__text">It was deleted on Monday.</p><a class="ds-btn" href="#">Back to devices</a></div>' +
        '</div>', 'A page that fails or is gone says so in its body; the head stays where it can.') +

      h.section('Empty parts', '<header class="ds-page-head"><div class="ds-page-head__row"><div class="ds-page-head__text"><h3 class="ds-page-head__title">No status yet</h3><p class="ds-page-head__lead"></p><div class="ds-page-head__status"></div></div><div class="ds-page-head__actions"></div></div><dl class="ds-page-head__details"></dl><div class="ds-page-head__tabs"></div></header>',
        'Empty parts take no room, so a page may render them before it has their content.') +

      h.section('Sign-in page', '<div style="overflow: hidden; border-radius: var(--ds-radius-card);"><div class="ds-auth" style="min-height: 0;">' +
        '<div class="ds-auth__alert"><div class="ds-alert ds-tone-error" role="alert">' + h.icon('alertCircle', 20) + '<span class="ds-alert__text">The password is wrong.</span></div></div>' +
        '<section class="ds-card ds-card--elevated ds-auth__card" aria-label="Sign in"><h3 class="ds-card__title">Sign in</h3><form class="ds-form" data-demo="auth">' +
          '<div class="ds-field"><label class="ds-field__label" for="' + email + '">Email</label><input class="ds-input" id="' + email + '" type="email" autocomplete="off" value="ada@example.org"></div>' +
          '<div class="ds-form-actions"><button class="ds-btn ds-btn--filled" type="submit">Sign in</button></div>' +
        '</form></section></div></div>', '.ds-auth is a page that is one centred card on the backdrop; shown in a box here.') +

      h.section('Keyboard', '<p class="ds-muted">The title takes the focus after a page change (<code>tabindex="-1"</code>); the back link, breadcrumbs and actions are tab stops in reading order. More opens its menu with <kbd class="ds-kbd">Enter</kbd>, <kbd class="ds-kbd">Space</kbd> or <kbd class="ds-kbd">Down</kbd>; <kbd class="ds-kbd">Escape</kbd> returns to it.</p>');
  },

  wire: function (root, h) {
    root.addEventListener('click', function (event) {
      var link = event.target.closest('a[href="#"]');
      if (link) event.preventDefault();
      var nav = link && link.closest('[data-demo="tabs"]');
      if (nav) {
        h.$$('a', nav).forEach(function (other) {
          if (other === link) other.setAttribute('aria-current', 'page');
          else other.removeAttribute('aria-current');
        });
      }
      var action = event.target.closest('[data-demo="action"]');
      if (action && root.contains(action) && action.getAttribute('aria-disabled') !== 'true') h.toast(action.textContent.trim() + ': done.', 'success');
    });
    h.$('[data-demo="auth"]', root).addEventListener('submit', function (event) {
      event.preventDefault();
      h.toast('Signed in.', 'success');
    });
  },
});
