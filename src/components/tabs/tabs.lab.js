/*
 * Motion Lab: the two looks tabs gained in 3.0. The contained pill and the
 * vertical bar are the indicator of the "tabs" demo (lab.js): the same
 * stretch and landing, here on a pill with a radius and on the block axis.
 */
var NAMES = ['Details', 'History', 'Reports'];

function row(classes, label) {
  return '<div class="ds-tabs ' + classes + '" role="tablist" aria-label="' + label + '"' + (classes.indexOf('vertical') < 0 ? '' : ' aria-orientation="vertical"') + '>' + NAMES.map(function (name, index) {
    return '<button class="ds-tabs__tab" role="tab" type="button" aria-selected="' + (index === 0) + '"' + (index ? ' tabindex="-1"' : '') + ' data-label="' + name + '">' + name + '</button>';
  }).join('') + '</div>';
}

function goTo(stage, at, sg) {
  stage.querySelectorAll('.ds-tabs').forEach(function (tablist) {
    tablist.querySelectorAll('[role="tab"]').forEach(function (tab, index) {
      tab.setAttribute('aria-selected', String(index === at));
      tab.tabIndex = index === at ? 0 : -1;
    });
  });
  return sg.frames(2).then(function () {
    return Promise.all(Array.from(stage.querySelectorAll('.ds-tabs__indicator')).map(function (pill) { return DS.motion.settled(pill); }));
  });
}

function current(stage) {
  return Array.from(stage.querySelectorAll('.ds-tabs--contained [role="tab"]')).findIndex(function (tab) { return tab.getAttribute('aria-selected') === 'true'; });
}

SG_LAB.add({
  id: 'tabs-looks',
  group: 'navigation',
  title: 'Tabs: contained and vertical',
  note: 'The contained pill and the vertical bar are the same indicator as the line\'s: they stretch toward the target and land on the spring, and the labels change colour as they arrive. A new target mid-glide continues from where the indicator is.',
  shows: ['DS.indicator.create', '.ds-tabs--contained', '.ds-tabs--vertical', '.ds-tabs__indicator', '--ds-ease-spatial', '--ds-dur-medium'],
  html: '<div style="display: grid; gap: var(--ds-space-4); justify-items: start;">' + row('ds-tabs--contained', 'Contained') + row('ds-tabs--vertical', 'Vertical') + '</div>',
  height: 240,
  setup: function (stage, sg) {
    stage.querySelectorAll('.ds-tabs').forEach(function (tablist) {
      sg.indicator(tablist, { active: '[aria-selected="true"]', className: 'ds-tabs__indicator' });
    });
  },
  play: function (stage, sg) { return goTo(stage, (current(stage) + 1) % NAMES.length, sg); },
  reset: function (stage, sg) { return goTo(stage, 0, sg); },
  state: function (stage) { return current(stage) === NAMES.length - 1; },
  toggle: function (stage, on, sg) { return goTo(stage, on ? NAMES.length - 1 : 0, sg); },
});

/* DS.tabs: a row the module drives. A selection change enters the new panel
   (swap) while the indicator glides; a tab that closes hands the selection to
   its neighbour, and the indicator glides there. */
var MONTHS = ['March', 'April', 'May'];

function moduleRow() {
  return '<div class="ds-tabs__bar"><div class="ds-tabs" role="tablist" aria-label="Reports">' + MONTHS.map(function (name, index) {
    return '<span class="ds-tabs__item" role="none"><button class="ds-tabs__tab" role="tab" type="button" id="lab-tab-' + index + '" aria-controls="lab-panel-' + index + '" aria-selected="' + (index === 0) + '"' + (index ? ' tabindex="-1"' : '') + ' aria-keyshortcuts="Delete" data-label="' + name + '">' + name + '</button>' +
      '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-xs ds-tabs__close" type="button" tabindex="-1" aria-hidden="true">' + DS.icons.icon(DS.icons.close, 16) + '</button></span>';
  }).join('') + '</div></div>' + MONTHS.map(function (name, index) {
    return '<div class="ds-tabs__panel" role="tabpanel" id="lab-panel-' + index + '" aria-labelledby="lab-tab-' + index + '"' + (index ? ' hidden' : '') + ' style="padding-block-start: var(--ds-space-3);"><p class="ds-muted">The report for ' + name + '.</p></div>';
  }).join('');
}

function moduleSettled(stage, sg) {
  return sg.frames(2).then(function () {
    return Promise.all([stage.querySelector('.ds-tabs__indicator'), stage.querySelector('.ds-tabs__panel:not([hidden])')].map(function (el) { return DS.motion.settled(el); }));
  });
}

function moduleStart(stage) {
  var host = stage.querySelector('[data-lab="tabs-module"]');
  if (stage.dsTabs) stage.dsTabs.destroy();
  var template = document.createElement('template');
  template.innerHTML = moduleRow();
  host.replaceChildren(template.content);
  stage.dsTabs = DS.tabs.create(host.querySelector('.ds-tabs'));
}

SG_LAB.add({
  id: 'tabs-module',
  group: 'navigation',
  title: 'Tabs: DS.tabs selects and closes',
  note: 'Replay closes the selected tab: its neighbour takes the selection, its panel enters with <code>swap</code> and the indicator glides there. The toggle selects the last tab and the first: the indicator continues from where it is.',
  shows: ['DS.tabs.create', 'DS.motion.enter', '.ds-tabs__bar', '.ds-tabs__close', '--ds-dur-medium', '--ds-ease-spatial'],
  html: '<div data-lab="tabs-module" style="inline-size: 320px;"></div>',
  height: 200,
  setup: function (stage) { moduleStart(stage); },
  play: function (stage, sg) {
    if (stage.querySelectorAll('[role="tab"]').length < 2) return Promise.resolve();
    stage.dsTabs.close(stage.querySelector('[aria-selected="true"]'));
    return moduleSettled(stage, sg);
  },
  reset: function (stage, sg) {
    moduleStart(stage);
    return sg.frames(2);
  },
  state: function (stage) { return stage.querySelector('[role="tab"]:last-of-type[aria-selected="true"], .ds-tabs__item:last-child > [aria-selected="true"]') !== null; },
  toggle: function (stage, on, sg) {
    var all = stage.querySelectorAll('[role="tab"]');
    stage.dsTabs.set(on ? all[all.length - 1] : all[0]);
    return moduleSettled(stage, sg);
  },
});
