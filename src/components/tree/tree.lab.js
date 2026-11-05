/* A tree folder opens and closes: the group's height where interpolate-size runs, the chevron's quarter turn on the spring. */
SG_LAB.add({
  id: 'tree-folder',
  group: 'data',
  title: 'A tree folder opens and closes',
  note: '<code>DS.tree.create()</code> on a <code>.ds-tree</code>: the folder\'s <code>.ds-tree__group</code> opens with its height over <code>--ds-dur-medium</code> on <code>--ds-ease-out</code> (where <code>interpolate-size</code> runs; elsewhere at once) and closes faster on <code>--ds-dur-base</code>, accelerating; the chevron of <code>.ds-tree__toggle</code> turns a quarter on <code>--ds-ease-spatial</code>. A reversal continues from where the height and the turn are.',
  shows: ['DS.tree.create', '.ds-tree', '.ds-tree__group', '.ds-tree__toggle', '--ds-dur-medium', '--ds-dur-base', '--ds-ease-out', '--ds-ease-spatial'],
  html: '<ul class="ds-tree" role="tree" aria-label="Files" style="max-width:320px">' +
    '<li class="ds-tree__item" role="treeitem" aria-expanded="false" data-ds-key="docs"><div class="ds-tree__row"><span class="ds-tree__toggle" aria-hidden="true" data-lab-chevron></span><span class="ds-tree__label">Documents</span><span class="ds-tree__meta">3 files</span></div>' +
    '<ul class="ds-tree__group" role="group">' +
    '<li class="ds-tree__item" role="treeitem" aria-selected="false"><div class="ds-tree__row"><span class="ds-tree__label">Rollout plan.pdf</span></div></li>' +
    '<li class="ds-tree__item" role="treeitem" aria-selected="false"><div class="ds-tree__row"><span class="ds-tree__label">Device inventory.xlsx</span></div></li>' +
    '<li class="ds-tree__item" role="treeitem" aria-selected="false"><div class="ds-tree__row"><span class="ds-tree__label">Lease agreement.pdf</span></div></li>' +
    '</ul></li>' +
    '<li class="ds-tree__item" role="treeitem" aria-selected="false"><div class="ds-tree__row"><span class="ds-tree__label">Notes.txt</span></div></li></ul>',
  height: 240,
  setup: function (stage) {
    stage.querySelector('[data-lab-chevron]').insertAdjacentHTML('beforeend', DS.icons.icon(DS.icons.chevronRight, 16));
    stage.tree = DS.tree.create(stage.querySelector('.ds-tree'));
  },
  play: function (stage) {
    var folder = stage.querySelector('[data-ds-key="docs"]');
    stage.tree = stage.tree || DS.tree.create(stage.querySelector('.ds-tree'));
    stage.tree.expand('docs', folder.getAttribute('aria-expanded') !== 'true');
    return DS.motion.settled(folder, { transitions: true, subtree: true });
  },
  state: function (stage) { return stage.querySelector('[data-ds-key="docs"]').getAttribute('aria-expanded') === 'true'; },
  toggle: function (stage, on) {
    var folder = stage.querySelector('[data-ds-key="docs"]');
    stage.tree = stage.tree || DS.tree.create(stage.querySelector('.ds-tree'));
    stage.tree.expand('docs', on);
    return DS.motion.settled(folder, { transitions: true, subtree: true });
  },
});
