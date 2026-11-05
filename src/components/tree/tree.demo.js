/*
 * The Tree view demo: files with folder groups, a chosen row, row actions,
 * a lazy folder and one whose loader fails; permissions with tri-state
 * checks; a tree whose items move by drag; a navigation tree of links.
 * Registered through SG.demo() (styleguide/sg-core.js). Size, density,
 * shape and touch come from the options panel around it. The loaders stand
 * for what a project's data layer returns.
 */
function treeRow(h, opts) {
  var folder = Boolean(opts.folder);
  return '<li class="ds-tree__item" role="treeitem" data-ds-key="' + opts.key + '"' +
    (folder ? ' aria-expanded="' + (opts.open ? 'true' : 'false') + '"' : '') +
    (opts.lazy ? ' data-ds-tree-lazy' : '') +
    (opts.selected !== undefined ? ' aria-selected="' + opts.selected + '"' : '') +
    (opts.checked !== undefined ? ' aria-checked="' + opts.checked + '"' : '') +
    (opts.disabled ? ' aria-disabled="true"' : '') + '>' +
    '<div class="ds-tree__row">' +
      (folder ? '<span class="ds-tree__toggle" aria-hidden="true">' + h.icon('chevronRight', 16) + '</span>' : '') +
      (opts.checked !== undefined ? '<input class="ds-checkbox ds-tree__check" type="checkbox">' : '') +
      (opts.glyph !== false ? '<span class="ds-tree__icon" aria-hidden="true">' + (folder && !opts.glyph ? h.icon('folder', 20) + h.icon('folderOpen', 20) : h.icon(opts.glyph || 'fileText', 20)) + '</span>' : '') +
      (opts.href ? '<a class="ds-tree__label" href="' + opts.href + '">' + h.esc(opts.label) + '</a>' : '<span class="ds-tree__label">' + h.esc(opts.label) + '</span>') +
      (opts.meta ? '<span class="ds-tree__meta">' + h.esc(opts.meta) + '</span>' : '') +
      (opts.actions ? '<span class="ds-tree__actions"><button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" tabindex="-1" aria-label="More for ' + h.esc(opts.label) + '" data-tip="More" data-demo="more" data-name="' + h.esc(opts.label) + '">' + h.icon('moreVertical', 18) + '</button></span>' : '') +
    '</div>' +
    (opts.children ? '<ul class="ds-tree__group" role="group">' + opts.children.join('') + '</ul>' : '') +
  '</li>';
}

function fileTree(h) {
  return '<ul class="ds-tree" role="tree" aria-label="Files" data-ds-tree data-demo="files">' +
    treeRow(h, { key: 'docs', label: 'Documents', folder: true, open: true, meta: '3 items', actions: true, children: [
      treeRow(h, { key: 'plan', label: 'Rollout plan.pdf', meta: '1.2 MB', selected: 'true', actions: true }),
      treeRow(h, { key: 'inventory', label: 'Device inventory.xlsx', glyph: 'fileSpreadsheet', meta: '84 kB', selected: 'false', actions: true }),
      treeRow(h, { key: 'contracts', label: 'Contracts', folder: true, open: false, meta: '2 items', actions: true, children: [
        treeRow(h, { key: 'lease', label: 'Lease agreement.pdf', meta: '640 kB', selected: 'false' }),
        treeRow(h, { key: 'support', label: 'Support contract.pdf', meta: '410 kB', selected: 'false' })
      ] })
    ] }) +
    treeRow(h, { key: 'reports', label: 'Reports', folder: true, lazy: true, meta: 'loads on open', actions: true }) +
    treeRow(h, { key: 'shared', label: 'Shared with me', folder: true, lazy: true, glyph: 'users', meta: 'fails once' }) +
    treeRow(h, { key: 'archive', label: 'Archive 2019', glyph: 'lock', selected: 'false', disabled: true, meta: 'read only' }) +
  '</ul>';
}

function permissionTree(h) {
  return '<ul class="ds-tree" role="tree" aria-label="Permissions of the service desk" data-ds-tree data-ds-tree-select="checkbox" data-demo="checks">' +
    treeRow(h, { key: 'devices', label: 'Devices', folder: true, open: true, glyph: 'laptop', checked: 'mixed', children: [
      treeRow(h, { key: 'devices.read', label: 'See devices', glyph: false, checked: 'true' }),
      treeRow(h, { key: 'devices.write', label: 'Change devices', glyph: false, checked: 'false' }),
      treeRow(h, { key: 'devices.retire', label: 'Retire devices', glyph: false, checked: 'false', disabled: true, meta: 'administrators only' })
    ] }) +
    treeRow(h, { key: 'tickets', label: 'Tickets', folder: true, open: false, glyph: 'ticket', checked: 'true', children: [
      treeRow(h, { key: 'tickets.read', label: 'See tickets', glyph: false, checked: 'true' }),
      treeRow(h, { key: 'tickets.close', label: 'Close tickets', glyph: false, checked: 'true' })
    ] }) +
    treeRow(h, { key: 'people', label: 'People', folder: true, lazy: true, glyph: 'users', checked: 'false' }) +
  '</ul>';
}

function dragTree(h) {
  return '<ul class="ds-tree" role="tree" aria-label="Sites and rooms" data-ds-tree data-ds-tree-drag data-demo="drag">' +
    treeRow(h, { key: 'b-a', label: 'Building A', folder: true, open: true, glyph: 'building', selected: 'false', children: [
      treeRow(h, { key: 'r-101', label: 'Room 101', glyph: 'mapPin', selected: 'false' }),
      treeRow(h, { key: 'r-102', label: 'Room 102', glyph: 'mapPin', selected: 'false' }),
      treeRow(h, { key: 'lab', label: 'Lab', folder: true, open: false, glyph: 'beaker', selected: 'false', children: [
        treeRow(h, { key: 'bench-1', label: 'Bench 1', glyph: 'mapPin', selected: 'false' })
      ] })
    ] }) +
    treeRow(h, { key: 'b-b', label: 'Building B', folder: true, open: true, glyph: 'building', selected: 'false', children: [
      treeRow(h, { key: 'r-201', label: 'Room 201', glyph: 'mapPin', selected: 'false' })
    ] }) +
    treeRow(h, { key: 'storage', label: 'Storage', folder: true, open: false, glyph: 'box', selected: 'false', children: [] }) +
  '</ul>';
}

function navTree(h) {
  return '<nav aria-label="Settings"><ul class="ds-tree" role="tree" aria-label="Settings" data-ds-tree data-ds-tree-select="none" data-demo="nav">' +
    treeRow(h, { key: 'general', label: 'General', glyph: 'settings', href: '#general' }) +
    treeRow(h, { key: 'security', label: 'Security', folder: true, open: true, glyph: 'shield', children: [
      treeRow(h, { key: 'sign-in', label: 'Sign-in', glyph: false, href: '#sign-in' }),
      treeRow(h, { key: 'keys', label: 'API keys', glyph: false, href: '#keys' })
    ] }) +
    treeRow(h, { key: 'notify', label: 'Notifications', glyph: 'bell', href: '#notifications' }) +
  '</ul></nav>';
}

SG.demo('tree', {
  title: 'Tree view',
  group: 'data',
  need: 'Show a hierarchy that opens and closes: folders, groups, nested records; pick one or check many',
  lead: 'The APG tree: one tab stop, the arrow keys walk and open the rows, letters jump by label. Choose one row, or check many with tri-state checks; folders may load their children when they first open, and items move by drag. A row is 40px at the default size and density.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    return h.section('Files', '<div class="sg-row" style="align-items:flex-start"><div style="flex:1 1 20rem;min-width:0">' + fileTree(h) + '</div>' +
        '<p class="ds-muted" style="flex:1 1 14rem;margin:0" data-demo="files-out" aria-live="polite">Chosen: Rollout plan.pdf</p></div>',
        'Folder groups switch their glyph while open. "Reports" loads its children on first open, "Shared with me" fails once and then loads; the archive is read only. Row buttons are reached with Tab from the focused row.') +

      h.section('Checkboxes', '<div class="sg-row" style="align-items:flex-start"><div style="flex:1 1 20rem;min-width:0">' + permissionTree(h) + '</div>' +
        '<p class="ds-muted" style="flex:1 1 14rem;margin:0" data-demo="checks-out">Checked: devices.read, tickets, tickets.read, tickets.close</p></div>',
        'A check reaches every child; a folder shows what its children hold (mixed for some). The disabled right stays as it is. "People" loads its rows unchecked, as its folder.') +

      h.section('Drag to move', dragTree(h),
        'Drag a grip, or Tab to it, press Space, choose a place with the arrow keys and press Space again. A pointer that rests on a closed folder opens it.') +

      h.section('Navigation', navTree(h),
        'data-ds-tree-select="none": rows open and follow their links; nothing stays chosen (mark the page with aria-current in the link).') +

      h.section('Empty', '<ul class="ds-tree" role="tree" aria-label="No files"></ul><p class="ds-muted">An empty tree takes no room: show an empty state instead.</p>') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">↑</kbd> <kbd class="ds-kbd">↓</kbd> move, <kbd class="ds-kbd">→</kbd> opens or enters a folder, <kbd class="ds-kbd">←</kbd> closes it or goes up, <kbd class="ds-kbd">Home</kbd> <kbd class="ds-kbd">End</kbd> jump, <kbd class="ds-kbd">*</kbd> opens the siblings, <kbd class="ds-kbd">Enter</kbd> activates, <kbd class="ds-kbd">Space</kbd> chooses or checks, letters jump by label.</p>');
  },

  // What a page writes itself: the loaders, what the row buttons do, saving a move.
  wire: function (root, h) {
    var failed = false;
    var files = h.$('[data-demo="files"]', root);
    var wait = function (ms) { return new Promise(function (resolve) { setTimeout(resolve, h.slow(ms)); }); };
    window.DS.tree.create(files, {
      load: function (item, context) {
        return wait(900).then(function () {
          if (context.key === 'shared' && !failed) {
            failed = true;
            throw new Error('offline');
          }
          if (context.key === 'shared') return [{ id: 'handbook', label: 'Handbook.pdf', icon: 'book', meta: '3.4 MB', selected: false }];
          return [
            { id: 'q3', label: 'Q3 devices.pdf', icon: 'fileText', meta: '220 kB', selected: false },
            { id: 'q4', label: 'Q4 devices.pdf', icon: 'fileText', meta: '231 kB', selected: false },
            { id: 'monthly', label: 'Monthly', children: true, meta: 'loads on open' }
          ];
        });
      }
    });
    window.DS.tree.create(h.$('[data-demo="checks"]', root), {
      load: function () {
        return wait(600).then(function () {
          return [{ id: 'people.read', label: 'See people' }, { id: 'people.invite', label: 'Invite people' }];
        });
      }
    });
    var onSelect = function (event) {
      var out = h.$('[data-demo="files-out"]', root);
      if (out && event.target === files) out.textContent = 'Chosen: ' + event.detail.item.querySelector('.ds-tree__label').textContent;
    };
    var onChange = function (event) {
      var out = h.$('[data-demo="checks-out"]', root);
      if (out) out.textContent = 'Checked: ' + (event.detail.keys.join(', ') || 'nothing');
    };
    var onDrop = function (event) {
      var to = event.detail.to;
      var where = to.parent ? to.parent.querySelector('.ds-tree__label').textContent : 'the top level';
      h.toast('Moved ' + event.detail.item.querySelector('.ds-tree__label').textContent + ' to ' + where + '.', 'success');
    };
    var onClick = function (event) {
      var more = event.target.closest('[data-demo="more"]');
      if (more && root.contains(more)) h.toast('More for ' + more.getAttribute('data-name') + '.', 'info');
      var link = event.target.closest('[data-demo="nav"] a');
      if (link && root.contains(link)) {
        event.preventDefault();
        h.toast('Opened ' + link.textContent + '.', 'info');
      }
    };
    root.addEventListener('ds:select', onSelect);
    root.addEventListener('ds:change', onChange);
    root.addEventListener('ds:drop', onDrop);
    root.addEventListener('click', onClick);
    return function () {
      root.removeEventListener('ds:select', onSelect);
      root.removeEventListener('ds:change', onChange);
      root.removeEventListener('ds:drop', onDrop);
      root.removeEventListener('click', onClick);
    };
  }
});
