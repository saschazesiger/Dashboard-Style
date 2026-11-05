/*
 * The Transfer list demo: the permissions of a role, with filters, one of
 * them blocked; and many devices as data. Registered through SG.demo()
 * (styleguide/sg-core.js). Size, density, shape and touch come from the
 * options panel around it. The behaviour is the system's (data-ds-transfer);
 * wire() only feeds data and shows the value.
 */
var TR_PERMISSIONS = [['read', 'Read devices', 'See the list and every record'], ['edit', 'Edit devices', 'Change names, sites and owners'], ['restart', 'Restart devices', 'From the console, one at a time'], ['wipe', 'Wipe devices', 'Erase a lost device'], ['tickets', 'Answer tickets', 'Reply and close'], ['reports', 'Export reports', 'CSV and PDF'], ['billing', 'See billing', 'Invoices and plans'], ['owner', 'Transfer ownership', 'Only the owner can grant this', true]];

function trOption(h, row) {
  return '<div class="ds-listbox__option" role="option" aria-selected="false" data-value="' + row[0] + '"' + (row[3] ? ' aria-disabled="true"' : '') + '>' +
    '<span class="ds-listbox__check" aria-hidden="true">' + h.icon('check', 16) + '</span><span class="ds-listbox__name">' + h.esc(row[1]) + '</span>' +
    '<span class="ds-listbox__description">' + h.esc(row[2]) + '</span></div>';
}

function trSide(h, side, title, options, search) {
  var id = h.uid('transfer');
  return '<div class="ds-transfer__side" data-ds-transfer-side="' + side + '"><span class="ds-transfer__title" id="' + id + '">' + title + '</span>' +
    (search ? '<input class="ds-input ds-transfer__search" type="search" aria-label="Filter ' + title.toLowerCase() + '" placeholder="Filter" aria-controls="' + id + '-list">' : '') +
    '<div class="ds-listbox ds-transfer__list" id="' + id + '-list" role="listbox" aria-multiselectable="true" aria-labelledby="' + id + '">' + (options || '') + '</div></div>';
}

function trActions(h) {
  return '<div class="ds-transfer__actions" role="group" aria-label="Move">' +
    '<button class="ds-btn ds-btn--outlined ds-btn--icon" type="button" data-ds-transfer-add aria-label="Add the marked" data-tip="Add the marked">' + h.icon('arrowRight', 20) + '</button>' +
    '<button class="ds-btn ds-btn--outlined ds-btn--icon" type="button" data-ds-transfer-remove aria-label="Remove the marked" data-tip="Remove the marked">' + h.icon('arrowLeft', 20) + '</button></div>';
}

SG.demo('transfer', {
  title: 'Transfer list',
  group: 'forms',
  need: 'Move options between two lists, available and chosen: permissions, group members; with filters and keys',
  lead: 'Mark options in one list and move them across with the buttons, Enter or a double-click. The chosen side keeps the order in which they came.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    return h.section('Permissions of a role', '<div class="ds-transfer" data-ds-transfer data-demo="role">' +
        trSide(h, 'source', 'Available', TR_PERMISSIONS.slice(1).map(function (row) { return trOption(h, row); }).join(''), true) +
        trActions(h) +
        trSide(h, 'target', 'Granted', trOption(h, TR_PERMISSIONS[0]), true) +
        '</div><p class="ds-field__hint" data-demo-out>Granted: read</p>',
        'Transfer ownership cannot be granted here. Narrower than 560px the lists stack.') +
      h.section('3,000 devices as data', '<div class="ds-transfer" data-demo="devices">' +
        trSide(h, 'source', 'All devices', '', true) + trActions(h) + trSide(h, 'target', 'In the group', '', false) + '</div>',
        'Each side is windowed; a filter narrows the source.');
  },

  wire: function (root, h) {
    var role = h.$('[data-demo="role"]', root);
    var out = h.$('[data-demo-out]', root);
    role.addEventListener('ds:change', function (event) {
      out.textContent = event.detail.value.length ? 'Granted: ' + event.detail.value.join(', ') : 'Granted: nothing';
    });
    var kinds = ['Laptop', 'Workstation', 'Mini desktop', 'Field tablet', 'Monitor'];
    var items = [];
    for (var i = 0; i < 3000; i += 1) items.push({ value: 'd-' + i, label: kinds[i % kinds.length] + ' ' + (1000 + i), meta: 'Row ' + (i % 40 + 1) });
    DS.transfer.create(h.$('[data-demo="devices"]', root), { items: items, value: ['d-3', 'd-7'] });
  },
});
