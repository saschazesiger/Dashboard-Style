/*
 * The Ordered choice demo: the columns of a device table, checked and put
 * in order, capped at five; a narrow one. Registered through SG.demo()
 * (styleguide/sg-core.js). Size, density, shape and touch come from the
 * options panel around it. The behaviour is the system's
 * (data-ds-orderedchoice); wire() only shows the value.
 */
var OC_COLUMNS = [['name', 'Name', true], ['status', 'Status', true], ['owner', 'Owner', true], ['site', 'Site', false], ['model', 'Model', false], ['seen', 'Last seen', false], ['serial', 'Serial number', false]];

function ocList(h, label, rows, attrs) {
  return '<ol class="ds-orderedchoice" data-ds-orderedchoice aria-label="' + label + '"' + (attrs || '') + '>' + rows.map(function (row) {
    return '<li class="ds-orderedchoice__item"><button class="ds-btn ds-btn--quiet ds-btn--icon ds-grip" type="button" aria-label="Move ' + h.esc(row[1]) + '">' + h.icon('grip', 20) + '</button>' +
      '<label class="ds-check"><input type="checkbox" name="column" value="' + row[0] + '"' + (row[2] ? ' checked' : '') + (row[3] ? ' disabled' : '') + '><span>' + h.esc(row[1]) + '</span></label>' +
      '<span class="ds-orderedchoice__rank"></span></li>';
  }).join('') + '</ol>';
}

SG.demo('orderedchoice', {
  title: 'Ordered choice',
  group: 'forms',
  need: 'Choose several options and put them in order: table columns, fallbacks, priorities; by drag and by keys',
  lead: 'Check what counts and drag it into place by its grip. On the keyboard: Space on a grip lifts the row, the arrows move it, Space drops it; Alt with an arrow moves the row of the focused box at once.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    return '<div class="ds-form-grid ds-form-grid--2">' +
      h.section('Columns of the device table', '<div class="ds-form"><div class="ds-field"><span class="ds-field__label" id="' + h.uid('oc') + '">Columns, up to 5</span>' +
        ocList(h, 'Columns', OC_COLUMNS, ' data-ds-orderedchoice-max="5" data-demo="columns"') +
        '<p class="ds-field__hint" data-demo-out>Name, Status, Owner</p></div></div>',
        'The checked columns show their place. At five the others wait.') +
      h.section('Fallback printers', '<div class="ds-form" style="max-inline-size: 320px;"><div class="ds-field"><span class="ds-field__label">Print on the first that answers</span>' +
        ocList(h, 'Fallback printers', [['p1', 'Second floor, by the kitchen', true], ['p2', 'Lab', true], ['p3', 'Front desk', false], ['p4', 'Archive (out of service)', false, true]]) +
        '</div></div>',
        'Long names wrap; a box the page disabled stays disabled.') +
      '</div>';
  },

  wire: function (root, h) {
    var list = h.$('[data-demo="columns"]', root);
    var out = h.$('[data-demo-out]', root);
    list.addEventListener('ds:change', function (event) {
      var names = event.detail.value.map(function (value) {
        return OC_COLUMNS.filter(function (row) { return row[0] === value; })[0][1];
      });
      out.textContent = names.length ? names.join(', ') : 'No columns';
    });
  },
});
