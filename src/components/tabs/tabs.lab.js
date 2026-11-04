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
  shows: ['DS.indicator.createIndicator', '.ds-tabs--contained', '.ds-tabs--vertical', '.ds-tabs__indicator', '--ds-ease-spatial', '--ds-dur-medium'],
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
