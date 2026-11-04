/*
 * The Form demo: the three looks of a field, its slots and states, the check
 * and radio controls with their cards, fieldset and form section, filters
 * and the composer. Registered through SG.demo() (styleguide/sg-core.js).
 * Size, density, shape and touch come from the options panel around it; only
 * the look is chosen here (h.variant), since a field shows meaning through
 * its state and a word, never a tone. The page-side lines a project writes
 * (a hint that follows the value, a counter, a parent checkbox) are in wire.
 */
var LOOKS = {
  outlined: { title: 'Outlined', field: 'ds-field', hint: 'The default: an outline on the surface.' },
  filled: { title: 'Filled', field: 'ds-field ds-field--filled', hint: 'On the tonal fill, without an outline at rest.' },
  inset: { title: 'Inset', field: 'ds-field ds-field--inset', hint: 'The label inside the tonal box.' },
};

function field(h, cls, label, control, hint, labelExtra) {
  var id = h.uid('field');
  var hintId = h.uid('hint');
  var described = hint ? ' aria-describedby="' + hintId + '"' : '';
  return '<div class="' + cls + '"><label class="ds-field__label" for="' + id + '">' + label + (labelExtra || '') + '</label>' +
    control.replace('%ATTRS%', 'id="' + id + '"' + described) +
    (hint ? hint.replace('%ID%', hintId) : '') + '</div>';
}

function looks(h) {
  return Object.keys(LOOKS).filter(function (name) { return !h.variant || name === h.variant; }).map(function (name) {
    var look = LOOKS[name];
    return '<div class="ds-stack" data-demo="look-' + name + '"><p class="ds-meta">' + look.title + ': ' + look.hint + '</p><div class="ds-form-grid ds-form-grid--3">' +
      field(h, look.field, 'Device name', '<input class="ds-input" %ATTRS% value="LAPTOP-0042">', '<small class="ds-field__hint" id="%ID%">As printed on the label.</small>') +
      field(h, look.field, 'Type', '<select class="ds-input" %ATTRS%><option>Laptop</option><option>Desktop</option><option>Printer</option></select>') +
      field(h, look.field, 'Website', '<div class="ds-input-group"><span class="ds-input-group__prefix" aria-hidden="true">https://</span><input class="ds-input" %ATTRS% value="example.org"></div>') +
      '</div></div>';
  }).join('');
}

function slots(h) {
  var look = LOOKS[h.variant || 'outlined'].field;
  var reveal = h.uid('secret');
  return '<div class="ds-form-grid ds-form-grid--2" data-demo="slots">' +
    field(h, look, 'Search devices', '<div class="ds-input-group"><span class="ds-input-group__leading" aria-hidden="true">' + h.icon('search', 18) + '</span><input class="ds-input" %ATTRS% placeholder="Name or serial"></div>') +
    field(h, look, 'Quota (GB)', '<div class="ds-input-group"><input class="ds-input" %ATTRS% inputmode="numeric" value="50"><span class="ds-input-group__suffix" aria-hidden="true">GB</span></div>') +
    field(h, look, 'Room', '<div class="ds-input-group"><input class="ds-input" %ATTRS% value="B 2.14"><span class="ds-input-group__trailing"><span class="ds-tag ds-tone-neutral">Suggested</span></span></div>') +
    '<div class="' + look + '"><label class="ds-field__label" for="' + reveal + '">API key</label><div class="ds-input-group"><input class="ds-input" id="' + reveal + '" type="password" value="ex_7f3a9c21" autocomplete="off">' +
    '<span class="ds-input-group__trailing"><button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-label="Show the key" aria-pressed="false" aria-controls="' + reveal + '" data-demo="reveal"><span class="ds-icon-swap"><span class="ds-icon-swap__a">' + h.icon('eye', 18) + '</span><span class="ds-icon-swap__b">' + h.icon('eyeOff', 18) + '</span></span></button></span></div></div>' +
    '</div>';
}

function states(h) {
  var look = LOOKS[h.variant || 'outlined'].field;
  return '<div class="ds-form-grid ds-form-grid--2" data-demo="states">' +
    field(h, look, 'Hostname', '<input class="ds-input" %ATTRS% value="laptop 0042" aria-invalid="true">', '<small class="ds-field__hint ds-field__hint--error" id="%ID%">' + h.icon('alertCircle', 16) + 'Spaces are not allowed.</small>') +
    field(h, look + ' ds-field--warning', 'Certificate', '<input class="ds-input" %ATTRS% value="internal-ca-2024">', '<small class="ds-field__hint ds-field__hint--warning" id="%ID%">' + h.icon('alert', 16) + 'Expires in 3 days.</small>') +
    field(h, look + ' ds-field--success', 'Username', '<input class="ds-input" %ATTRS% value="ada.lovelace">', '<small class="ds-field__hint ds-field__hint--success" id="%ID%">' + h.icon('checkCircle', 16) + 'Available.</small>') +
    field(h, look, 'Serial', '<input class="ds-input" %ATTRS% value="SN-0042" readonly>', '<small class="ds-field__hint" id="%ID%">Read-only: set by the device.</small>') +
    field(h, look, 'Location', '<input class="ds-input" %ATTRS% value="Building C" disabled>', '<small class="ds-field__hint" id="%ID%">Disabled: set a site first.</small>') +
    field(h, look, 'Warranty', '<select class="ds-input" %ATTRS% aria-readonly="true"><option>4 years</option></select>', '<small class="ds-field__hint" id="%ID%">A read-only select: <code>aria-readonly</code>.</small>') +
    '</div>';
}

function markers(h) {
  var note = h.uid('note');
  var noteHint = h.uid('note-hint');
  return '<div class="ds-form-grid ds-form-grid--2" data-demo="markers">' +
    field(h, 'ds-field', 'Owner', '<input class="ds-input" %ATTRS% required value="Ada Lovelace">', '', ' <span class="ds-field__required" aria-hidden="true">*</span>') +
    field(h, 'ds-field', 'Room', '<input class="ds-input" %ATTRS%>', '', ' <span class="ds-field__optional">(optional)</span>') +
    '<div class="ds-field ds-field--changed" data-demo="changed"><label class="ds-field__label" for="' + note + '">Note <span class="ds-field__changed ds-sr">(changed)</span></label><textarea class="ds-input" id="' + note + '" maxlength="60" aria-describedby="' + noteHint + '" data-demo="counted">Dock in room B 2.14</textarea>' +
    '<div class="ds-field__foot"><small class="ds-field__hint" id="' + noteHint + '">Shown to the next person.</small><span class="ds-field__counter" aria-hidden="true" data-demo="counter">19 / 40</span></div></div>' +
    '<div class="ds-field" role="group" aria-labelledby="' + note + '-value"><span class="ds-field__label" id="' + note + '-value">Serial number</span><span class="ds-field__value">SN-0042</span></div>' +
    '</div>';
}

function checks(h) {
  var plan = h.uid('plan');
  var kind = h.uid('kind');
  var size = h.uid('size');
  return '<div class="ds-form-grid ds-form-grid--2" data-demo="checks"><fieldset class="ds-field"><legend class="ds-field__label">Notify by</legend>' +
    '<div class="ds-check-group" data-demo="group"><label class="ds-check"><input type="checkbox" data-demo="all"><span>All channels</span></label>' +
    '<div class="ds-check-group__children" role="group" aria-label="Channels"><label class="ds-check"><input type="checkbox" checked><span>Email</span></label><label class="ds-check"><input type="checkbox"><span>Chat</span></label></div></div></fieldset>' +
    '<fieldset class="ds-field"><legend class="ds-field__label">Status</legend><div class="ds-check-list">' +
    [['Active', 47, true], ['In storage', 12], ['Retired', 3], ['In repair', 2]].map(function (row) {
      return '<label class="ds-check"><input type="checkbox"' + (row[2] ? ' checked' : '') + '><span>' + row[0] + '</span><span class="ds-check__count">' + row[1] + '</span></label>';
    }).join('') + '</div></fieldset></div>' +
    '<div class="sg-row"><label class="ds-check"><input type="checkbox" disabled checked><span>Disabled</span></label>' +
    '<label class="ds-check"><input type="checkbox" aria-disabled="true"><span>Blocked (aria-disabled)</span></label>' +
    '<label class="ds-check"><input type="checkbox" aria-invalid="true"><span>Invalid</span></label>' +
    '<input class="ds-checkbox" type="checkbox" aria-label="A checkbox on its own"><input class="ds-radio-input" type="radio" name="' + size + '" aria-label="Small" checked><input class="ds-radio-input" type="radio" name="' + size + '" aria-label="Large"></div>' +

    '<h4 class="sg-label">Radio cards</h4><div class="ds-radios" role="radiogroup" aria-label="Plan" data-demo="radios">' +
    '<label class="ds-radio"><input type="radio" name="' + plan + '" checked><span><strong>Standard</strong><small>Replaced after four years.</small></span></label>' +
    '<label class="ds-radio"><input type="radio" name="' + plan + '"><span><strong>Extended</strong><small>Six years, with a longer warranty.</small></span></label>' +
    '<label class="ds-radio ds-radio--disabled"><input type="radio" name="' + plan + '" disabled><span><strong>Premium</strong><small class="ds-radio__note">' + h.icon('alert', 16) + 'Needs a licence.</small></span></label></div>' +

    '<h4 class="sg-label">Checkbox cards</h4><div class="ds-check-cards" role="group" aria-label="Add-ons" data-demo="check-cards">' +
    '<label class="ds-check-card"><input class="ds-checkbox" type="checkbox" checked><span><strong>Backups</strong><small>Every night, kept for 30 days.</small></span></label>' +
    '<label class="ds-check-card"><input class="ds-checkbox" type="checkbox"><span><strong>Remote wipe</strong><small>Erase a lost device from here.</small></span></label>' +
    '<label class="ds-check-card"><input class="ds-checkbox" type="checkbox" disabled><span><strong>Audit log</strong><small class="ds-radio__note">' + h.icon('alert', 16) + 'Needs a licence.</small></span></label></div>' +

    '<h4 class="sg-label">Radio tiles</h4><div class="ds-radios ds-radios--tiles" role="radiogroup" aria-label="Device type" data-demo="tiles">' +
    [['laptop', 'Laptop', 'With a dock.', true], ['monitor', 'Desktop', 'At one desk.'], ['printer', 'Printer', 'On a floor.']].map(function (tile) {
      return '<label class="ds-radio"><input type="radio" name="' + kind + '"' + (tile[3] ? ' checked' : '') + '><span class="ds-radio__icon" aria-hidden="true">' + h.icon(tile[0], 20) + '</span><span><strong>' + tile[1] + '</strong><small>' + tile[2] + '</small></span><span class="ds-radio__mark" aria-hidden="true">' + h.icon('check', 14) + '</span></label>';
    }).join('') + '</div>';
}

function sections(h) {
  var alerts = h.uid('alerts');
  var general = h.uid('general');
  return '<form class="ds-form" data-demo="sections" onsubmit="return false">' +
    '<section class="ds-form-section ds-form-section--columns" aria-labelledby="' + general + '"><div class="ds-form-section__head"><h3 class="ds-form-section__title" id="' + general + '">General</h3><p class="ds-form-section__text">How the device shows up in the list.</p></div>' +
    '<div class="ds-form-section__body">' + field(h, 'ds-field', 'Name', '<input class="ds-input" %ATTRS% value="LAPTOP-0042">') +
    '<fieldset class="ds-fieldset"><legend class="ds-fieldset__legend">Place</legend><p class="ds-fieldset__hint">Where it stands, for the next person.</p><div class="ds-form-grid ds-form-grid--2">' +
    field(h, 'ds-field', 'Building', '<input class="ds-input" %ATTRS% value="Building C">') + field(h, 'ds-field', 'Room', '<input class="ds-input" %ATTRS% value="B 2.14">') + '</div></fieldset></div></section>' +
    '<section class="ds-form-section ds-form-section--columns" aria-labelledby="' + alerts + '"><div class="ds-form-section__head"><h3 class="ds-form-section__title" id="' + alerts + '">Alerts</h3><p class="ds-form-section__text">Who hears about a device that went offline.</p></div>' +
    '<div class="ds-form-section__body"><fieldset class="ds-fieldset ds-fieldset--outlined"><legend class="ds-fieldset__legend">Channels</legend><label class="ds-check"><input type="checkbox" checked><span>Email</span></label><label class="ds-check"><input type="checkbox"><span>Chat</span></label></fieldset></div></section>' +
    '<div class="ds-form-actions ds-form-actions--sticky"><button class="ds-btn ds-btn--filled" type="submit" data-demo="save">Save</button><button class="ds-btn ds-btn--text" type="button">Cancel</button><p class="ds-meta">Last saved today, 09:12</p></div>' +
    '</form>';
}

function toolbar(h) {
  var q = h.uid('q');
  var type = h.uid('type');
  var ticket = h.uid('ticket');
  return '<div class="ds-toolbar" data-demo="toolbar"><div class="ds-filters"><div class="ds-field ds-field--grow"><label class="ds-sr" for="' + q + '">Search</label><div class="ds-search">' + h.icon('search', 20) + '<input class="ds-input" id="' + q + '" type="search" aria-keyshortcuts="/" placeholder="Search devices"><kbd class="ds-kbd ds-search__key" aria-hidden="true">/</kbd></div></div>' +
    '<div class="ds-field"><label class="ds-field__label" for="' + type + '">Type</label><select class="ds-input ds-input--filled" id="' + type + '"><option>All</option><option>Laptop</option></select></div></div></div>' +
    '<div class="ds-action-bar"><div class="ds-search">' + h.icon('search', 20) + '<input class="ds-input" type="search" aria-label="Search the list" placeholder="Search"></div><button class="ds-btn ds-btn--quiet" type="button" aria-pressed="false">' + h.icon('filter', 16) + 'Filter</button><p class="ds-meta">128 devices</p></div>' +
    '<div class="ds-inline-form"><div class="ds-field"><label class="ds-field__label" for="' + ticket + '">Ticket</label><input class="ds-input" id="' + ticket + '"></div><button class="ds-btn" type="button">Look up</button></div>';
}

SG.demo('form', {
  title: 'Form',
  group: 'forms',
  need: 'Collect input: labelled fields in three looks, slots, states, checks and cards, form sections, filters, action bars and a composer',
  lead: 'Labels above their fields, a 2px focus ring at once, states in words. The options panel changes size, density, shape and touch around the demo; field text stays 16px on phones at every size.',
  options: { variants: Object.keys(LOOKS), sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    return h.section('Looks', looks(h)) +
      h.section('Slots', slots(h), 'Leading and trailing hold an icon, a tag or a button; prefix and suffix text that belongs to the value.') +
      h.section('States', states(h), 'A warning and a success colour the control and say what they mean in words; aria-invalid stays the only error.') +
      h.section('Markers, counter, changed, read value', markers(h)) +
      h.section('Checkboxes and radios', checks(h)) +
      h.section('Fieldset and form section', sections(h), 'In a narrow panel the head of a section falls above its fields.') +
      h.section('Toolbar, search and inline form', toolbar(h)) +
      h.section('Growing textarea and composer', '<textarea class="ds-input ds-input--grow" rows="1" aria-label="Note" placeholder="A note that grows with its text"></textarea>' +
        '<form class="ds-composer" onsubmit="return false"><textarea class="ds-composer__input ds-input--grow" rows="1" aria-label="Message" placeholder="Write a message"></textarea><button class="ds-btn ds-btn--filled ds-btn--icon" type="submit" aria-label="Send" data-tip="Send">' + h.icon('send', 20) + '</button></form>') +
      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> walks the fields; <kbd class="ds-kbd">Space</kbd> toggles a checkbox; the arrow keys move within a radio group. A read-only field stays in the tab order; a blocked checkbox says why and ignores <kbd class="ds-kbd">Space</kbd>.</p>');
  },

  wire: function (root, h) {
    function sync(group) {
      var all = h.$('[data-demo="all"]', group);
      var children = h.$$('.ds-check-group__children input', group);
      var on = children.filter(function (child) { return child.checked; }).length;
      all.checked = on === children.length;
      all.indeterminate = on > 0 && on < children.length;
    }
    h.$$('[data-demo="group"]', root).forEach(sync);
    root.addEventListener('change', function (event) {
      var group = event.target.closest('[data-demo="group"]');
      if (!group) return;
      if (event.target.matches('[data-demo="all"]')) h.$$('.ds-check-group__children input', group).forEach(function (child) { child.checked = event.target.checked; });
      sync(group);
    });
    var limit = 40;
    root.addEventListener('input', function (event) {
      if (!event.target.matches('[data-demo="counted"]')) return;
      var counter = h.$('[data-demo="counter"]', root);
      counter.textContent = event.target.value.length + ' / ' + limit;
      counter.classList.toggle('ds-field__counter--over', event.target.value.length > limit);
      event.target.closest('.ds-field').classList.add('ds-field--changed');
    });
    root.addEventListener('click', function (event) {
      var reveal = event.target.closest('[data-demo="reveal"]');
      if (reveal) {
        var on = reveal.getAttribute('aria-pressed') !== 'true';
        reveal.setAttribute('aria-pressed', String(on));
        h.$('#' + reveal.getAttribute('aria-controls'), root).type = on ? 'text' : 'password';
      }
      if (event.target.closest('[data-demo="save"]')) h.toast('Saved.', 'success');
    });
  },
});
