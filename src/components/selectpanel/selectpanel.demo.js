/*
 * The Select panel demo: labels with a filter and an apply foot, an
 * assignee (one value, applied on the choice), many devices as data, and a
 * disabled button. Registered through SG.demo() (styleguide/sg-core.js). The
 * behaviour is the system's (data-ds-selectpanel); wire() only feeds data
 * and shows what was applied.
 */
var SP_LABELS = [['bug', 'Bug', 'Something does not work'], ['docs', 'Docs', 'Writing and help pages'], ['hardware', 'Hardware', 'Devices and parts'], ['network', 'Network', 'Wi-Fi, cables, VPN'], ['access', 'Access', 'Accounts and keys'], ['printer', 'Printer', 'Paper, toner, jams'], ['urgent', 'Urgent', 'Today, please'], ['question', 'Question', 'No fault, just asking']];
var SP_PEOPLE = ['Ada Lovelace', 'Alan Turing', 'Grace Hopper', 'Katherine Johnson', 'Edsger Dijkstra'];

function spOption(h, value, name, description, selected) {
  return '<div class="ds-listbox__option" role="option" aria-selected="' + Boolean(selected) + '" data-value="' + value + '">' +
    '<span class="ds-listbox__check" aria-hidden="true">' + h.icon('check', 16) + '</span><span class="ds-listbox__name">' + h.esc(name) + '</span>' +
    (description ? '<span class="ds-listbox__description">' + h.esc(description) + '</span>' : '') + '</div>';
}

function spPanel(h, opts) {
  return '<div class="ds-selectpanel" data-ds-selectpanel' + (opts.attrs || '') + '>' +
    '<button class="ds-btn ds-btn--outlined ds-selectpanel__trigger" type="button"' + (opts.disabled ? ' disabled' : '') + '>' + h.icon(opts.icon, 20) + opts.label +
    ' <span class="ds-selectpanel__summary"></span>' + h.icon('chevronDown', 20) + '</button>' +
    '<div class="ds-selectpanel__panel" role="dialog" aria-label="' + opts.label + '" hidden>' +
    (opts.search ? '<div class="ds-selectpanel__head"><input class="ds-input ds-selectpanel__search" type="search" aria-label="Filter ' + opts.label.toLowerCase() + '" placeholder="Filter ' + opts.label.toLowerCase() + '"></div>' : '') +
    '<div class="ds-listbox ds-listbox--plain ds-selectpanel__list" role="listbox"' + (opts.single ? '' : ' aria-multiselectable="true"') + ' aria-label="' + opts.label + '">' + (opts.options || '') + '</div>' +
    '<p class="ds-selectpanel__status" role="status"></p>' +
    (opts.foot ? '<div class="ds-selectpanel__foot"><button class="ds-btn ds-btn--text" type="button" data-ds-selectpanel-clear>Clear</button><button class="ds-btn ds-btn--filled" type="button" data-ds-selectpanel-apply>Apply</button></div>' : '') +
    '</div></div>';
}

SG.demo('selectpanel', {
  title: 'Select panel',
  group: 'forms',
  need: 'Pick several values in a popover with a filter and an apply foot: labels, assignees, filters',
  lead: 'A button opens a panel to filter and check; nothing changes until Apply. Escape or a press outside leaves everything as it was.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    return h.section('Labels', '<div style="display: flex; flex-wrap: wrap; gap: var(--ds-space-3); align-items: center;">' +
        spPanel(h, { label: 'Labels', icon: 'tag', search: true, foot: true, attrs: ' data-demo="labels"', options: SP_LABELS.map(function (l, i) { return spOption(h, l[0], l[1], l[2], i === 0 || i === 6); }).join('') }) +
        spPanel(h, { label: 'Assignee', icon: 'user', single: true, attrs: ' data-demo="assignee"', options: SP_PEOPLE.map(function (p, i) { return spOption(h, 'u' + i, p, '', false); }).join('') }) +
        spPanel(h, { label: 'Devices', icon: 'laptop', search: true, foot: true, attrs: ' data-demo="devices"' }) +
        spPanel(h, { label: 'Sites', icon: 'building', disabled: true, options: spOption(h, 'n', 'North building', '', true) }) +
        '</div><p class="ds-field__hint" data-demo-out>Applied: Bug, Urgent</p>',
      'Labels: filter, check, Apply (or Ctrl+Enter). Assignee: one value, applied on the choice. Devices: 2,000 as data, windowed. Sites: disabled.');
  },

  wire: function (root, h) {
    var out = h.$('[data-demo-out]', root);
    h.$('[data-demo="labels"]', root).addEventListener('ds:change', function (event) {
      out.textContent = event.detail.value.length ? 'Applied: ' + event.detail.value.join(', ') : 'Applied: none';
    });
    var kinds = ['Laptop', 'Workstation', 'Mini desktop', 'Field tablet', 'Monitor'];
    var items = [];
    for (var i = 0; i < 2000; i += 1) items.push({ value: 'd-' + i, label: kinds[i % kinds.length] + ' ' + (1000 + i), meta: 'Row ' + (i % 40 + 1) });
    DS.selectpanel.create(h.$('[data-demo="devices"]', root), { items: items });
  },
});
