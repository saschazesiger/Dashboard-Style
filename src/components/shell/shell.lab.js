/*
 * Motion Lab: the pill across the levels of a nested drawer group. The indent
 * is padding, so the pill keeps the row's full width and only travels; the
 * labels change colour on its timing. The rail, the modal drawer, the switch
 * and the drawer with a view have their demos in lab.js.
 */
function row(glyph, label, current) {
  return '<a class="ds-drawer__item" href="#navigation"' + (current ? ' aria-current="page"' : '') + '><span data-glyph="' + glyph + '"></span><span class="ds-drawer__label">' + label + '</span></a>';
}

function goTo(stage, last, sg) {
  var rows = Array.from(stage.querySelectorAll('.ds-drawer__item'));
  rows.forEach(function (item, index) {
    if (index === (last ? rows.length - 1 : 0)) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
  return sg.frames(2).then(function () { return DS.motion.settled(stage.querySelector('.ds-drawer__indicator')); });
}

function atLast(stage) {
  var rows = stage.querySelectorAll('.ds-drawer__item');
  return rows[rows.length - 1].getAttribute('aria-current') === 'page';
}

SG_LAB.add({
  id: 'drawer-nested',
  group: 'navigation',
  title: 'Drawer: the pill across nested groups',
  note: 'A group inside a group indents its rows by padding (<code>--ds-drawer-indent</code>), so the pill keeps the row\'s width and only travels, on the spring, its time growing with the distance.',
  shows: ['DS.indicator.create', '.ds-drawer__indicator', '--ds-ease-spatial', '--ds-dur-medium', '--ds-dur-slow'],
  html: '<div class="ds-drawer__list" style="inline-size: 256px; overflow: visible;">' +
    '<div class="ds-drawer__group">' + row('home', 'Overview', true) +
      '<div class="ds-drawer__group"><p class="ds-drawer__heading">Tickets</p>' + row('ticket', 'Open') +
        '<div class="ds-drawer__group"><p class="ds-drawer__heading">Archive</p>' + row('history', 'This year') + '</div>' +
      '</div>' +
    '</div></div>',
  height: 300,
  setup: function (stage, sg) {
    // The icons come with DS: this file loads before the lab runs, on any page.
    stage.querySelectorAll('[data-glyph]').forEach(function (slot) {
      slot.replaceWith(DS.icons.iconElement(DS.icons[slot.getAttribute('data-glyph')], 20));
    });
    sg.indicator(stage.querySelector('.ds-drawer__list'), { active: '[aria-current="page"]', className: 'ds-drawer__indicator' });
    stage.addEventListener('click', function (event) { if (event.target.closest('a')) event.preventDefault(); });
  },
  play: function (stage, sg) { return goTo(stage, !atLast(stage), sg); },
  reset: function (stage, sg) { return goTo(stage, false, sg); },
  state: atLast,
  toggle: function (stage, on, sg) { return goTo(stage, on, sg); },
});

/*
 * The top bar's layers: the phone search sheet, the app launcher and the
 * account menu. Each opens and closes through DS.overlay, so a close mid-way
 * turns back from where it is.
 */
function glyphs(stage) {
  stage.querySelectorAll('[data-glyph]').forEach(function (slot) {
    slot.replaceWith(DS.icons.iconElement(DS.icons[slot.getAttribute('data-glyph')], Number(slot.getAttribute('data-size') || 20)));
  });
}

function opened(el) { return el.getAttribute('data-state') === 'open'; }

function layerTo(el, on, opener) {
  if (on) return opened(el) ? Promise.resolve() : DS.overlay.open(el, { opener: opener });
  return el.hasAttribute('data-state') ? DS.overlay.close(el) : Promise.resolve();
}

function hold(sg) { return new Promise(function (resolve) { setTimeout(resolve, sg.slow(400)); }); }

/* The sheet is fixed to the window in a page; layout containment makes the
   stage its window here, a phone's width. The breakpoint and the inert page
   around it are DS.shell.searchSheet()'s (labExempt): the lab plays the motion. */
SG_LAB.add({
  id: 'shell-search-sheet',
  group: 'overlays',
  title: 'Top bar: the phone search sheet',
  note: 'At 720px and below the top bar\'s search is a sheet over the whole frame: it fades in while it slides down by <code>--ds-distance-md</code> on the spring over <code>--ds-dur-medium</code>, and leaves faster (<code>--ds-dur-fast</code>, accelerating). <code>data-state</code> drives it, so a close mid-way turns back from where it is.',
  shows: ['.ds-topbar__search', '.ds-topbar__search-open', '.ds-topbar__search-back', '.ds-topbar__results', 'DS.overlay.open', 'DS.overlay.close', '--ds-dur-medium', '--ds-dur-fast', '--ds-distance-md', '--ds-ease-spatial', '--ds-ease-in'],
  html: '<div style="position: relative; contain: layout paint; inline-size: 360px; max-inline-size: 100%; block-size: 300px; margin-inline: auto; overflow: hidden; border-radius: var(--ds-radius-card); background: var(--ds-backdrop);">' +
    '<div class="ds-topbar" style="padding-inline: var(--ds-space-4) var(--ds-space-2);"><span class="ds-brand"><span class="ds-brand__name">Product</span></span>' +
      '<div class="ds-topbar__search" data-lab-sheet hidden>' +
        '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-topbar__search-back" type="button" aria-label="Close search" data-ds-close><span data-glyph="arrowLeft"></span></button>' +
        '<div class="ds-search"><span data-glyph="search"></span><input class="ds-input" type="search" aria-label="Search devices" placeholder="Search devices" value="lap"></div>' +
        '<div class="ds-topbar__results"><ul class="ds-list" aria-label="Devices"><li class="ds-list__item"><span class="ds-list__text"><span class="ds-list__title">LAPTOP-0042</span></span></li><li class="ds-list__item"><span class="ds-list__text"><span class="ds-list__title">LAPTOP-0017</span></span></li></ul></div>' +
      '</div>' +
      '<div class="ds-topbar__actions"><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Search" data-lab-open><span data-glyph="search"></span></button></div>' +
    '</div></div>',
  height: 320,
  setup: function (stage) {
    glyphs(stage);
    var sheet = stage.querySelector('[data-lab-sheet]');
    var opener = stage.querySelector('[data-lab-open]');
    opener.addEventListener('click', function () { layerTo(sheet, !opened(sheet), opener); });
  },
  subject: function (stage) { return stage.querySelector('[data-lab-sheet]'); },
  play: function (stage, sg) {
    var sheet = stage.querySelector('[data-lab-sheet]');
    var opener = stage.querySelector('[data-lab-open]');
    return layerTo(sheet, true, opener).then(function () { return hold(sg); }).then(function () { return layerTo(sheet, false); });
  },
  state: function (stage) { return opened(stage.querySelector('[data-lab-sheet]')); },
  toggle: function (stage, on) { return layerTo(stage.querySelector('[data-lab-sheet]'), on, stage.querySelector('[data-lab-open]')); },
});

function app(glyph, label, current) {
  return '<a class="ds-menu__item ds-launcher__app" role="menuitem" href="#overlays"' + (current ? ' aria-current="true"' : '') + '>' +
    '<span class="ds-launcher__icon"><span data-glyph="' + glyph + '" data-size="24"></span></span><span class="ds-launcher__label">' + label + '</span></a>';
}

SG_LAB.add({
  id: 'shell-launcher',
  group: 'overlays',
  title: 'Top bar: the app launcher',
  note: 'The app switcher is a menu laid out as a grid: it grows out of its button like every menu (<code>DS.shell.launcher(menu).set(true)</code> opens it), and the arrow keys move in two dimensions over it. The current app keeps its tinted disc and the label weight.',
  shows: ['DS.shell.launcher', '.ds-launcher', '.ds-launcher__app', '--ds-scale-popup', '--ds-dur-medium', '--ds-dur-instant', '--ds-ease-spatial'],
  html: '<div style="display: flex; justify-content: center; align-items: flex-start; align-self: start; inline-size: 100%; min-block-size: 248px; padding-block-start: var(--ds-space-2);"><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Apps" aria-haspopup="menu" aria-expanded="false" aria-controls="sg-lab-launcher" data-lab-apps><span data-glyph="apps"></span></button>' +
    '<div class="ds-menu ds-launcher" role="menu" id="sg-lab-launcher" aria-label="Apps" hidden>' +
      app('laptop', 'Devices', true) + app('ticket', 'Tickets') + app('users', 'People') + app('barChart', 'Reports') + app('calendar', 'Schedule') + app('mail', 'Mail') +
    '</div></div>',
  height: 300,
  setup: function (stage) {
    glyphs(stage);
    var menu = stage.querySelector('.ds-launcher');
    var trigger = stage.querySelector('[data-lab-apps]');
    stage.__launcher = DS.shell.launcher(menu);
    trigger.addEventListener('click', function () { layerTo(menu, !opened(menu), trigger); });
    menu.addEventListener('click', function (event) { if (event.target.closest('a')) event.preventDefault(); });
  },
  subject: function (stage) { return stage.querySelector('.ds-launcher'); },
  play: function (stage, sg) {
    var menu = stage.querySelector('.ds-launcher');
    var trigger = stage.querySelector('[data-lab-apps]');
    return layerTo(menu, true, trigger).then(function () { return hold(sg); }).then(function () { return layerTo(menu, false); });
  },
  state: function (stage) { return opened(stage.querySelector('.ds-launcher')); },
  toggle: function (stage, on) { return layerTo(stage.querySelector('.ds-launcher'), on, stage.querySelector('[data-lab-apps]')); },
});

SG_LAB.add({
  id: 'shell-account',
  group: 'overlays',
  title: 'Top bar: the account menu',
  note: 'The avatar opens a menu with the name and email at its head, the theme switch and sign out. It moves as every menu does; choosing a theme changes the colours at once, nothing moves.',
  shows: ['.ds-account__trigger', '.ds-account__menu', '.ds-account__head', '--ds-scale-popup', '--ds-dur-medium', '--ds-dur-instant'],
  html: '<div class="ds-account" style="justify-content: center; align-items: flex-start; align-self: start; inline-size: 100%; min-block-size: 248px; margin: 0; padding-block-start: var(--ds-space-2);"><button class="ds-btn ds-btn--quiet ds-btn--icon ds-account__trigger" type="button" aria-label="Account: Ada Lovelace" aria-haspopup="menu" aria-expanded="false" aria-controls="sg-lab-account" data-lab-account><span class="ds-account__avatar" aria-hidden="true">A</span></button>' +
    '<div class="ds-menu ds-account__menu" role="menu" id="sg-lab-account" aria-labelledby="sg-lab-account-head" hidden>' +
      '<div class="ds-account__head" id="sg-lab-account-head" aria-hidden="true"><span class="ds-account__avatar ds-lg">A</span><div class="ds-account__name">Ada Lovelace</div><div class="ds-account__email">ada@example.org</div></div>' +
      '<div class="ds-menu__divider" role="separator"></div>' +
      '<button class="ds-menu__item" role="menuitem" type="button"><span data-glyph="logout"></span><span class="ds-menu__label">Sign out</span></button>' +
    '</div></div>',
  height: 280,
  setup: function (stage) {
    glyphs(stage);
    var menu = stage.querySelector('.ds-account__menu');
    var trigger = stage.querySelector('[data-lab-account]');
    trigger.addEventListener('click', function () { layerTo(menu, !opened(menu), trigger); });
  },
  subject: function (stage) { return stage.querySelector('.ds-account__menu'); },
  play: function (stage, sg) {
    var menu = stage.querySelector('.ds-account__menu');
    var trigger = stage.querySelector('[data-lab-account]');
    return layerTo(menu, true, trigger).then(function () { return hold(sg); }).then(function () { return layerTo(menu, false); });
  },
  state: function (stage) { return opened(stage.querySelector('.ds-account__menu')); },
  toggle: function (stage, on) { return layerTo(stage.querySelector('.ds-account__menu'), on, stage.querySelector('[data-lab-account]')); },
});
