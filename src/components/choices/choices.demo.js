/*
 * The Choice list demo: a short set with "select all", a long set in
 * columns with a filter and a scrolling box, the states. Registered through
 * SG.demo() (styleguide/sg-core.js). Size, density, shape and touch come
 * from the options panel around it. The behaviour is the system's
 * (data-ds-choices); wire() only shows the value.
 */
var CH_SITES = ['North building', 'South building', 'Lab', 'Warehouse', 'Front desk', 'Workshop', 'Server room', 'Meeting rooms', 'Library', 'Cafeteria', 'Loading bay', 'Garage', 'Studio', 'Archive', 'Reception', 'Training room', 'Print room', 'Rooftop', 'East wing', 'West wing', 'Basement', 'Annex', 'Car park', 'Gym', 'Kitchen', 'Mail room', 'Nursery', 'Observatory', 'Pharmacy', 'Quiet room', 'Records office', 'Security desk', 'Test bench', 'Utility room', 'Visitor centre', 'Yard'];

function chRow(h, name, value, checked, extra) {
  return '<label class="ds-check"><input type="checkbox" name="' + name + '" value="' + value + '"' + (checked ? ' checked' : '') + (extra || '') + '><span>' + h.esc(value) + '</span></label>';
}

SG.demo('choices', {
  title: 'Choice list',
  group: 'forms',
  need: 'Check several of a set of options: "select all", a count, a filter and columns for long sets',
  lead: 'Native checkboxes with "select all" (checked, unchecked or some), a count, and for long sets a filter, columns and a box that scrolls on its own.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var short = h.uid('choices');
    var long = h.uid('choices');
    return '<div class="ds-form-grid ds-form-grid--2">' +
      h.section('Select all', '<fieldset class="ds-field"><legend class="ds-field__label">Notify by</legend>' +
        '<div class="ds-choices" data-ds-choices data-demo="short">' +
        '<div class="ds-choices__tools"><label class="ds-check"><input type="checkbox" data-ds-choices-all><span>All channels</span></label><span class="ds-choices__count"></span></div>' +
        '<div class="ds-choices__list" role="group" aria-label="Channels" id="' + short + '">' +
        chRow(h, 'channel', 'Email', true) + chRow(h, 'channel', 'Chat', false) + chRow(h, 'channel', 'Text message', true) + chRow(h, 'channel', 'Phone call', false, ' disabled') +
        '</div></div></fieldset>' +
        '<p class="ds-field__hint" data-demo-out="short">Email, Text message</p>',
        'Some checked: the box shows a dash. Phone call cannot change, so "all" leaves it out.') +
      h.section('Without tools', '<fieldset class="ds-field"><legend class="ds-field__label">Status</legend>' +
        '<div class="ds-choices" data-ds-choices><div class="ds-choices__list">' +
        chRow(h, 'status', 'Active', true) + chRow(h, 'status', 'In storage', false) + chRow(h, 'status', 'Retired', false, ' aria-disabled="true"') +
        '</div></div></fieldset>',
        'A list alone: the checked rows take the label weight.') +
      '</div>' +
      h.section('A long set: filter, columns, scrolling', '<fieldset class="ds-field"><legend class="ds-field__label">Sites</legend>' +
        '<div class="ds-choices ds-choices--columns ds-choices--scroll" data-ds-choices data-demo="long">' +
        '<div class="ds-choices__tools"><input class="ds-input ds-choices__search" type="search" aria-label="Filter sites" placeholder="Filter sites" aria-controls="' + long + '">' +
        '<label class="ds-check"><input type="checkbox" data-ds-choices-all><span>Select all shown</span></label><span class="ds-choices__count"></span></div>' +
        '<div class="ds-choices__list" role="group" aria-label="Sites" id="' + long + '">' +
        CH_SITES.map(function (site, index) { return chRow(h, 'site', site, index % 5 === 0); }).join('') +
        '</div><p class="ds-choices__empty" role="status" hidden>No sites match.</p></div></fieldset>',
        'Columns fill row by row, as Tab moves. The filter matches words in any order ("wing ea") and marks the letters; "select all" then acts on what shows.');
  },

  wire: function (root, h) {
    var short = h.$('[data-demo="short"]', root);
    var out = h.$('[data-demo-out="short"]', root);
    short.addEventListener('ds:change', function (event) {
      out.textContent = event.detail.value.length ? event.detail.value.join(', ') : 'Nothing checked';
    });
  },
});
