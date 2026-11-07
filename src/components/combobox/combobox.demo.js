/*
 * The Combobox demo: filter by typing, groups and descriptions, clear and
 * create, several values, select-only, the states and the keys. Registered
 * through SG.demo() (styleguide/sg-core.js). Size, density, shape and touch
 * come from the options panel around it. Everything in wire() is what a
 * project writes itself: the page filters and chooses, DS.overlay opens and
 * closes the list.
 */
var MODELS = [['Laptop 13', '13 inch · 2022'], ['Laptop 14', '14 inch · 2023'], ['Laptop 16', '16 inch · 2024'], ['Workstation 15', '15 inch · 2023'], ['Mini desktop', 'Desktop · 2023'], ['Convertible 13', '13 inch · 2022']];

var GROUPS = [
  ['Laptops', [['Laptop 14', 'For most desks: light, with a full day of battery.'], ['Workstation 15', 'For drawing and video: the strong graphics card, and the weight that comes with it.']]],
  ['Desktops', [['Mini desktop', 'For shared counters: small, on a lock, and quick to replace.']]],
  ['Tablets', [['Field tablet', 'For the shop floor: scanner and pen, and a case that survives a fall.']]],
];

/* A name, a meta line and a share of the quota; one plan is blocked. */
var PLANS = [['Basic', '2 devices', 0.2, false], ['Standard', '5 devices', 0.6, false], ['Premium', 'Needs a contract', 1, true], ['Team', '25 devices', 0.36, false]];

function field(h, id, label, rest, list, status) {
  return '<div class="ds-field"><label class="ds-field__label" for="' + id + '">' + label + '</label>' +
    '<div class="ds-combo" data-demo="combo"><input class="ds-input ds-combo__input" id="' + id + '" role="combobox" aria-expanded="false" aria-controls="' + id + '-list" aria-autocomplete="list" autocomplete="off">' +
    rest + '<button class="ds-combo__toggle" type="button" tabindex="-1" aria-label="Show all">' + h.icon('chevronDown', 20) + '</button>' +
    '<div class="ds-combo__popup" hidden>' + list + '<p class="ds-combo__status" role="status">' + status + '</p></div></div></div>';
}

function modelOptions(id) {
  return MODELS.map(function (model, index) {
    return '<li class="ds-combo__option" id="' + id + '-' + index + '" role="option" aria-selected="false"><span class="ds-combo__name">' + model[0] + '</span><span class="ds-combo__meta">' + model[1] + '</span></li>';
  }).join('');
}

function modelList(id, extra) {
  return '<ul class="ds-combo__list" id="' + id + '-list" role="listbox">' + modelOptions(id) + (extra || '') + '</ul>';
}

function groupList(h, id) {
  return '<div class="ds-combo__list" id="' + id + '-list" role="listbox">' + GROUPS.map(function (group, g) {
    var heading = id + '-h' + g;
    return '<ul class="ds-combo__group" role="group" aria-labelledby="' + heading + '"><li class="ds-combo__heading" id="' + heading + '" role="presentation">' + group[0] + '</li>' +
      group[1].map(function (item, index) {
        return '<li class="ds-combo__option" id="' + id + '-' + g + '-' + index + '" role="option" aria-selected="false"><span class="ds-combo__name">' + item[0] + '</span><span class="ds-combo__description">' + item[1] + '</span></li>';
      }).join('') + '</ul>';
  }).join('') + '</div>';
}

function selectField(h, id, attrs) {
  return '<div class="ds-field"><span class="ds-field__label" id="' + id + '-label">Plan</span>' +
    '<div class="ds-combo ds-combo--select"' + (attrs || ' data-demo="select"') + '>' +
    '<button class="ds-input ds-combo__input" id="' + id + '" type="button" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-controls="' + id + '-list" aria-labelledby="' + id + '-label ' + id + '-value">' +
    '<span class="ds-combo__value" id="' + id + '-value">Standard</span><span class="ds-combo__meta">5 devices</span></button>' +
    '<button class="ds-combo__toggle" type="button" tabindex="-1" aria-label="Show plans">' + h.icon('chevronDown', 20) + '</button>' +
    '<div class="ds-combo__popup" hidden><ul class="ds-combo__list" id="' + id + '-list" role="listbox" aria-labelledby="' + id + '-label">' +
    PLANS.map(function (plan, index) {
      return '<li class="ds-combo__option" id="' + id + '-' + index + '" role="option" aria-selected="' + (index === 1) + '"' + (plan[3] ? ' aria-disabled="true"' : '') + '>' +
        '<span class="ds-combo__name">' + plan[0] + '</span><span class="ds-combo__meta">' + plan[1] + '</span>' +
        '<div class="ds-progress" style="--ds-progress:' + plan[2] + '"><div class="ds-progress__track" role="presentation"><div class="ds-progress__bar"></div></div></div></li>';
    }).join('') + '</ul></div></div></div>';
}

function multiField(h, id) {
  return '<div class="ds-field"><label class="ds-field__label" for="' + id + '">Models to order</label>' +
    '<div class="ds-combo ds-combo--multi" data-demo="multi">' +
    '<input class="ds-input ds-combo__input" id="' + id + '" role="combobox" aria-expanded="false" aria-controls="' + id + '-list" aria-autocomplete="list" autocomplete="off">' +
    '<button class="ds-combo__toggle" type="button" tabindex="-1" aria-label="Show all">' + h.icon('chevronDown', 20) + '</button>' +
    '<div class="ds-combo__popup" hidden><ul class="ds-combo__list" id="' + id + '-list" role="listbox" aria-multiselectable="true">' + modelOptions(id) + '</ul>' +
    '<p class="ds-combo__status" role="status">' + MODELS.length + ' models</p></div></div></div>';
}

/* Disabled, with its values: the page sets `disabled` on the chips too, since CSS cannot block their keys. */
function multiDisabled(h) {
  var id = h.uid('combo');
  return '<div class="ds-field"><label class="ds-field__label" for="' + id + '">Disabled, several values</label><div class="ds-combo ds-combo--multi">' +
    '<button class="ds-chip ds-chip--input" type="button" disabled><span class="ds-chip__body"><span class="ds-chip__label"><span class="ds-sr">Remove </span>Laptop 14</span>' + h.icon('close', 18, 'ds-chip__trailing') + '</span></button>' +
    '<input class="ds-input ds-combo__input" id="' + id + '" role="combobox" aria-expanded="false" aria-autocomplete="list" disabled>' +
    '<button class="ds-combo__toggle" type="button" tabindex="-1" aria-label="Show all" disabled>' + h.icon('chevronDown', 20) + '</button></div></div>';
}

/* Disabled select-only: the value and its meta take the button's disabled ink. */
function selectDisabled(h) {
  var id = h.uid('combo');
  return '<div class="ds-field"><span class="ds-field__label" id="' + id + '-label">Plan, disabled</span><div class="ds-combo ds-combo--select" data-demo="select-disabled">' +
    '<button class="ds-input ds-combo__input" id="' + id + '" type="button" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="' + id + '-label ' + id + '-value" disabled>' +
    '<span class="ds-combo__value" id="' + id + '-value">Standard</span><span class="ds-combo__meta">5 devices</span></button>' +
    '<button class="ds-combo__toggle" type="button" tabindex="-1" aria-label="Show plans" disabled>' + h.icon('chevronDown', 20) + '</button></div></div>';
}

/* A list inspected in place: the same parts, in the flow of the page, each option in a fixed state. */
function statesList(h) {
  return '<div class="ds-combo__popup" style="position: static;"><ul class="ds-combo__list" role="listbox" aria-label="Option states">' +
    '<li class="ds-combo__option" role="option" aria-selected="false"><span class="ds-combo__name">At rest</span><span class="ds-combo__meta">A line of meta</span></li>' +
    '<li class="ds-combo__option" role="option" aria-selected="false" data-active><span class="ds-combo__name">Active</span><span class="ds-combo__meta">Keyboard or pointer</span></li>' +
    '<li class="ds-combo__option" role="option" aria-selected="true"><span class="ds-combo__name">Chosen</span><span class="ds-combo__description">The tint and the label weight, never the colour alone.</span></li>' +
    '<li class="ds-combo__option" role="option" aria-selected="true" data-active><span class="ds-combo__name">Chosen and active</span></li>' +
    '<li class="ds-combo__option" role="option" aria-selected="false" aria-disabled="true"><span class="ds-combo__name">Blocked</span><span class="ds-combo__meta">Needs a contract</span></li>' +
    '<li class="ds-combo__option" role="option" aria-selected="true" aria-disabled="true"><span class="ds-combo__name">Chosen and blocked</span><span class="ds-combo__meta">No longer offered</span></li>' +
    '<li class="ds-combo__option ds-combo__option--create" role="option" aria-selected="false">' + h.icon('plus', 20) + '<span class="ds-combo__name">Create "Laptop 15"</span></li>' +
    '</ul></div>';
}

/* The same markup, its behaviour by the system: data-ds-combobox (DS.combobox). */
function sysField(h, id, label, attrs, classes, rest, list) {
  return '<div class="ds-field"><label class="ds-field__label" for="' + id + '">' + label + '</label>' +
    '<div class="ds-combo' + (classes || '') + '" data-ds-combobox' + (attrs || '') + '>' +
    '<input class="ds-input ds-combo__input" id="' + id + '" role="combobox" aria-expanded="false" aria-controls="' + id + '-list" aria-autocomplete="list">' +
    (rest || '') + '<button class="ds-combo__toggle" type="button" tabindex="-1" aria-label="Show all">' + h.icon('chevronDown', 20) + '</button>' +
    '<div class="ds-combo__popup" hidden>' + (list || '<ul class="ds-combo__list" id="' + id + '-list" role="listbox"></ul>') + '<p class="ds-combo__status" role="status"></p></div></div></div>';
}

function sysOptions(id) {
  return '<ul class="ds-combo__list" id="' + id + '-list" role="listbox">' + MODELS.map(function (model, index) {
    return '<li class="ds-combo__option" id="' + id + '-' + index + '" role="option" aria-selected="false"><span class="ds-combo__name">' + model[0] + '</span><span class="ds-combo__meta">' + model[1] + '</span></li>';
  }).join('') + '</ul>';
}

function sysClear(h, label) {
  return '<button class="ds-combo__clear" type="button" aria-label="Clear ' + label + '" hidden>' + h.icon('close', 20) + '</button>';
}

function systemSections(h) {
  var fuzzy = h.uid('combo');
  var remote = h.uid('combo');
  var many = h.uid('combo');
  var tags = h.uid('combo');
  var plan = h.uid('combo');
  return h.section('By the system: filter, clear and create', '<div class="ds-form" data-demo="sys">' +
      sysField(h, fuzzy, 'Model', ' data-ds-combobox-creatable data-demo="sys-fuzzy"', '', sysClear(h, 'model'), sysOptions(fuzzy)) +
      '<p class="ds-field__hint" data-demo-out="sys-fuzzy">Nothing chosen</p></div>',
    'The same markup with data-ds-combobox: the system filters the options in place as you type, words in any order and letters in order ("lp 16"), and marks the letters. A name no model has gets a last option that creates it. The clear button shows while there is something to clear; after a choice the chevron shows every model.') +
    h.section('By the system: a search on a server', '<div class="ds-form">' +
      sysField(h, remote, 'Assignee', ' data-demo="sys-remote"', '', sysClear(h, 'assignee')) + '</div>',
    'A source asked after a pause in typing: a spinner while it runs, a newer query aborts the older one, the status line counts what came back. Try "ada", or "zz" for nothing found.') +
    h.section('By the system: several values', '<div class="ds-form">' +
      sysField(h, tags, 'Models to order', ' data-ds-combobox-creatable data-demo="sys-multi"', ' ds-combo--multi', '', sysOptions(tags).replace('role="listbox"', 'role="listbox" aria-multiselectable="true"')) + '</div>',
    'Choosing keeps the list open; each value becomes an input chip, and a press on a chip or Backspace in the empty field removes it, which a screen reader hears.') +
    h.section('By the system: 5,000 options', '<div class="ds-form">' +
      sysField(h, many, 'Device', ' data-demo="sys-many"', '', sysClear(h, 'device')) + '</div>',
    'Only the options near the viewport exist (DS.virtual through DS.listbox), so a long list opens and filters at once.') +
    h.section('By the system: select-only', '<div class="ds-form">' + selectField(h, plan, ' data-ds-combobox data-demo="sys-select"') + '</div>',
    'The same rich options, each with its share of the quota: the system opens on the choice (Enter, Space, the arrows; Home and End on the ends), jumps by the typed letters, and Enter, Space or Tab chooses. Premium cannot be chosen.');
}

SG.demo('combobox', {
  title: 'Combobox',
  group: 'forms',
  need: 'Choose a value from a long list by typing to filter it: groups, descriptions, several values',
  lead: 'A searchable list under a field. The field keeps its look; the page filters and chooses, DS.overlay opens and closes the list. The options panel changes size, density, shape and touch around the demo.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var plain = h.uid('combo');
    var grouped = h.uid('combo');
    var clearable = h.uid('combo');
    var multi = h.uid('combo');
    var select = h.uid('combo');
    var disabled = h.uid('combo');
    var invalid = h.uid('combo');
    var error = h.uid('combo-error');
    return h.section('Filter by typing', '<div class="ds-form" data-demo="plain">' + field(h, plain, 'Model', '', modelList(plain), MODELS.length + ' models') + '</div>',
      'Type to filter. When nothing matches, the list part hides and the status says so; the list stays open.') +

      h.section('Groups and descriptions', '<div class="ds-form" data-demo="grouped">' + field(h, grouped, 'Device type', '', groupList(h, grouped), '4 models') + '</div>',
      'Headings name the groups and are never active; a group with no match goes with its heading. A description wraps, a meta line stays on one line.') +

      h.section('Clearable and creatable', '<div class="ds-form" data-demo="clearable">' +
        field(h, clearable, 'Model, or a new one', '<button class="ds-combo__clear" type="button" aria-label="Clear model" hidden>' + h.icon('close', 20) + '</button>',
          modelList(clearable, '<li class="ds-combo__option ds-combo__option--create" id="' + clearable + '-create" role="option" aria-selected="false" hidden>' + h.icon('plus', 20) + '<span class="ds-combo__name"></span></li>'),
          MODELS.length + ' models') + '</div>',
      'The clear button shows while there is something to clear, and is in the tab order. Type a name no model has: the last option creates it.') +

      h.section('Several values', '<div class="ds-form">' + multiField(h, multi) + '</div>',
      'The chosen values are input chips in the field box, which grows. The list stays open while choosing; Backspace in the empty field removes the last value.') +

      h.section('Select-only', '<div class="ds-form">' + selectField(h, select) + '</div>',
      'A button shows the choice with its meta: pick one of a few rich options without typing. Premium cannot be chosen.') +

      systemSections(h) +

      h.section('States', '<div class="ds-form">' +
        '<div class="ds-field"><label class="ds-field__label" for="' + disabled + '">Disabled</label><div class="ds-combo"><input class="ds-input ds-combo__input" id="' + disabled + '" role="combobox" aria-expanded="false" aria-autocomplete="list" value="Laptop 14" disabled><button class="ds-combo__toggle" type="button" tabindex="-1" aria-label="Show all" disabled>' + h.icon('chevronDown', 20) + '</button></div></div>' +
        '<div class="ds-field"><label class="ds-field__label" for="' + invalid + '">With an error</label><div class="ds-combo"><input class="ds-input ds-combo__input" id="' + invalid + '" role="combobox" aria-expanded="false" aria-autocomplete="list" aria-invalid="true" aria-describedby="' + error + '" value="Laptop"><button class="ds-combo__toggle" type="button" tabindex="-1" aria-label="Show all">' + h.icon('chevronDown', 20) + '</button></div><p class="ds-field__hint ds-field__hint--error" id="' + error + '">' + h.icon('alertCircle', 16) + 'Choose one of the models.</p></div>' +
        multiDisabled(h) +
        selectDisabled(h) +
        '</div>' +
        '<h3 class="ds-field__label">The options</h3>' + statesList(h) +
        '<h3 class="ds-field__label">Nothing found</h3>' +
        '<div class="ds-combo__popup" style="position: static;"><ul class="ds-combo__list" role="listbox" aria-label="Models" hidden></ul><p class="ds-combo__status" role="status">No model matches "Tower 5"</p></div>' +
        '<h3 class="ds-field__label">Loading</h3>' +
        '<div class="ds-combo__popup" style="position: static;"><ul class="ds-combo__list" role="listbox" aria-label="Models" aria-busy="true" hidden></ul><p class="ds-combo__status" role="status"><span class="ds-spinner ds-spinner--ink ds-sm" aria-hidden="true"></span>Searching the models</p></div>') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">ArrowDown</kbd> or <kbd class="ds-kbd">ArrowUp</kbd> opens the list and moves through the options, passing headings and blocked options by; <kbd class="ds-kbd">Enter</kbd> chooses; <kbd class="ds-kbd">Escape</kbd> closes. Focus stays in the field. On the select-only button, <kbd class="ds-kbd">Space</kbd> opens and chooses too, <kbd class="ds-kbd">Home</kbd> and <kbd class="ds-kbd">End</kbd> go to the ends, and a letter jumps to the option that starts with it.</p>');
  },

  wire: function (root, h) {
    /* The part every combobox shares: the active option, and what keeps focus in the field. */
    function base(combo) {
      var input = h.$('.ds-combo__input', combo);
      var popup = h.$('.ds-combo__popup', combo);
      var toggle = h.$('.ds-combo__toggle', combo);
      var options = h.$$('.ds-combo__option', popup);
      var self = {
        input: input, popup: popup, options: options,
        isOpen: function () { return input.getAttribute('aria-expanded') === 'true'; },
        open: function () { if (!self.isOpen()) DS.overlay.open(popup, { opener: input }); },
        // A closed list has no active option: aria-activedescendant never names a hidden one.
        close: function () { self.setActive(null); if (self.isOpen()) DS.overlay.close(popup); },
        active: function () { return options.filter(function (option) { return option.hasAttribute('data-active'); })[0] || null; },
        setActive: function (option) {
          options.forEach(function (each) { if (each !== option) each.removeAttribute('data-active'); });
          if (!option) { input.removeAttribute('aria-activedescendant'); return; }
          option.setAttribute('data-active', '');
          input.setAttribute('aria-activedescendant', option.id);
          if (self.isOpen()) option.scrollIntoView({ block: 'nearest' });
        },
      };
      // Escape closes through DS.overlay, after this handler; the active option goes first.
      input.addEventListener('keydown', function (event) { if (event.key === 'Escape') self.setActive(null); });
      // Presses in the list and on the chevron keep focus in the field.
      [popup, toggle].forEach(function (part) {
        part.addEventListener('mousedown', function (event) { event.preventDefault(); });
      });
      popup.addEventListener('pointermove', function (event) {
        var option = event.target.closest('.ds-combo__option');
        if (option && option.getAttribute('aria-disabled') !== 'true' && option !== self.active()) self.setActive(option);
      });
      return self;
    }

    function nameOf(option) { return h.$('.ds-combo__name', option).textContent; }

    function setupCombo(combo) {
      var parts = base(combo);
      var input = parts.input;
      var list = h.$('.ds-combo__list', combo);
      var status = h.$('.ds-combo__status', combo);
      var clear = h.$('.ds-combo__clear', combo);
      var create = h.$('.ds-combo__option--create', combo);
      var models = parts.options.filter(function (option) { return option !== create; });
      var shown = function () { return parts.options.filter(function (option) { return !option.hidden; }); };

      // Filtering only hides options: a group with none left goes by itself, and without a match the list part hides.
      function filter() {
        var query = input.value.trim().toLowerCase();
        models.forEach(function (option) { option.hidden = query !== '' && nameOf(option).toLowerCase().indexOf(query) === -1; });
        var exact = models.some(function (option) { return nameOf(option).toLowerCase() === query; });
        if (create) {
          create.hidden = query === '' || exact;
          h.$('.ds-combo__name', create).textContent = 'Create "' + input.value.trim() + '"';
        }
        var count = models.filter(function (option) { return !option.hidden; }).length;
        list.hidden = shown().length === 0;
        status.textContent = count === 0 ? 'No model matches' : count === models.length ? models.length + ' models' : count + ' of ' + models.length + ' models';
        if (clear) clear.hidden = input.value === '';
        if (parts.active() && parts.active().hidden) parts.setActive(null);
      }

      function choose(option) {
        models.forEach(function (each) { each.setAttribute('aria-selected', String(each === option)); });
        if (option === create) h.toast('Created ' + input.value.trim() + '.', 'success');
        else input.value = nameOf(option);
        parts.close();
        filter();
      }

      function move(step) {
        var visible = shown();
        if (!visible.length) return;
        var index = visible.indexOf(parts.active());
        parts.setActive(visible[index < 0 ? (step > 0 ? 0 : visible.length - 1) : (index + step + visible.length) % visible.length]);
      }

      input.addEventListener('input', function () { filter(); parts.open(); });
      input.addEventListener('keydown', function (event) {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          if (!parts.isOpen()) { parts.open(); return; }
          move(event.key === 'ArrowDown' ? 1 : -1);
        } else if (event.key === 'Enter' && parts.isOpen() && parts.active()) {
          event.preventDefault();
          choose(parts.active());
        }
      });
      input.addEventListener('blur', parts.close);
      h.$('.ds-combo__toggle', combo).addEventListener('click', function () {
        if (parts.isOpen()) { parts.close(); return; }
        input.focus();
        parts.open();
      });
      if (clear) {
        clear.addEventListener('mousedown', function (event) { event.preventDefault(); });
        clear.addEventListener('click', function () {
          input.value = '';
          filter();
          input.focus();
        });
      }
      list.addEventListener('click', function (event) {
        var option = event.target.closest('.ds-combo__option');
        if (option) choose(option);
      });
    }

    function setupMulti(combo) {
      var parts = base(combo);
      var input = parts.input;
      var status = h.$('.ds-combo__status', combo);
      var list = h.$('.ds-combo__list', combo);
      var chips = [];
      var shown = function () { return parts.options.filter(function (option) { return !option.hidden; }); };

      function filter() {
        var query = input.value.trim().toLowerCase();
        parts.options.forEach(function (option) { option.hidden = query !== '' && nameOf(option).toLowerCase().indexOf(query) === -1; });
        var count = shown().length;
        list.hidden = count === 0;
        status.textContent = count === 0 ? 'No model matches' : chips.length + ' chosen, ' + count + ' models';
      }

      function remove(option) {
        var entry = chips.filter(function (chip) { return chip.option === option; })[0];
        chips.splice(chips.indexOf(entry), 1);
        entry.element.remove();
        option.setAttribute('aria-selected', 'false');
        filter();
      }

      function toggle(option) {
        if (option.getAttribute('aria-selected') === 'true') { remove(option); return; }
        option.setAttribute('aria-selected', 'true');
        input.insertAdjacentHTML('beforebegin', '<button class="ds-chip ds-chip--input" type="button"><span class="ds-chip__body"><span class="ds-chip__label"><span class="ds-sr">Remove </span>' + h.esc(nameOf(option)) + '</span>' + h.icon('close', 18, 'ds-chip__trailing') + '</span></button>');
        var element = input.previousElementSibling;
        element.addEventListener('click', function () { remove(option); input.focus(); });
        chips.push({ option: option, element: element });
        input.value = '';
        filter();
      }

      function move(step) {
        var visible = shown();
        if (!visible.length) return;
        var index = visible.indexOf(parts.active());
        parts.setActive(visible[index < 0 ? (step > 0 ? 0 : visible.length - 1) : (index + step + visible.length) % visible.length]);
      }

      input.addEventListener('input', function () { filter(); parts.open(); });
      input.addEventListener('keydown', function (event) {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          if (!parts.isOpen()) { parts.open(); return; }
          move(event.key === 'ArrowDown' ? 1 : -1);
        } else if (event.key === 'Enter' && parts.isOpen() && parts.active()) {
          event.preventDefault();
          toggle(parts.active());
        } else if (event.key === 'Backspace' && input.value === '' && chips.length) {
          remove(chips[chips.length - 1].option);
        }
      });
      input.addEventListener('blur', parts.close);
      // The box looks like one field, so a press on an empty part of it goes to the field.
      combo.addEventListener('mousedown', function (event) {
        if (event.target !== combo) return;
        event.preventDefault();
        input.focus();
      });
      h.$('.ds-combo__toggle', combo).addEventListener('click', function () {
        if (parts.isOpen()) { parts.close(); return; }
        input.focus();
        parts.open();
      });
      list.addEventListener('click', function (event) {
        var option = event.target.closest('.ds-combo__option');
        if (option) toggle(option);
      });
    }

    /* The keys of the WAI select-only pattern. Focus stays on the button; blocked options are passed by. */
    function setupSelect(combo) {
      var parts = base(combo);
      var button = parts.input;
      var usable = function () { return parts.options.filter(function (option) { return option.getAttribute('aria-disabled') !== 'true'; }); };
      var chosen = function () { return parts.options.filter(function (option) { return option.getAttribute('aria-selected') === 'true'; })[0] || usable()[0]; };
      var typed = '';
      var typedAt = 0;

      function open() {
        if (parts.isOpen()) return;
        parts.open();
        parts.setActive(chosen());
      }
      var close = parts.close;
      function choose(option) {
        if (!option || option.getAttribute('aria-disabled') === 'true') return;
        parts.options.forEach(function (each) { each.setAttribute('aria-selected', String(each === option)); });
        h.$('.ds-combo__value', button).textContent = nameOf(option);
        h.$('.ds-combo__meta', button).textContent = h.$('.ds-combo__meta', option).textContent;
        close();
      }
      function move(step) {
        var list = usable();
        var index = list.indexOf(parts.active());
        parts.setActive(list[Math.max(0, Math.min(list.length - 1, index + step))]);
      }

      button.addEventListener('click', function (event) {
        if (event.detail > 1) return;
        if (parts.isOpen()) close(); else open();
      });
      button.addEventListener('keydown', function (event) {
        var key = event.key;
        if (key === 'ArrowDown' || key === 'ArrowUp') {
          event.preventDefault();
          if (!parts.isOpen()) open(); else move(key === 'ArrowDown' ? 1 : -1);
        } else if ((key === 'Home' || key === 'End') && parts.isOpen()) {
          event.preventDefault();
          var list = usable();
          parts.setActive(key === 'Home' ? list[0] : list[list.length - 1]);
        } else if ((key === 'Enter' || key === ' ') && parts.isOpen()) {
          event.preventDefault();
          choose(parts.active());
        } else if (key.length === 1 && key !== ' ') {
          // Type-ahead: the next usable option whose name starts with the letters.
          var now = Date.now();
          typed = now - typedAt > DS.motion.motionDuration(button, '--ds-delay-tooltip') ? key.toLowerCase() : typed + key.toLowerCase();
          typedAt = now;
          var match = usable().filter(function (option) { return nameOf(option).toLowerCase().indexOf(typed) === 0; })[0];
          if (!match) return;
          open();
          parts.setActive(match);
        }
      });
      button.addEventListener('blur', close);
      h.$('.ds-combo__toggle', combo).addEventListener('click', function () {
        button.focus();
        if (parts.isOpen()) close(); else open();
      });
      parts.popup.addEventListener('click', function (event) { choose(event.target.closest('.ds-combo__option')); });
    }

    h.$$('[data-demo="combo"]', root).forEach(setupCombo);
    h.$$('[data-demo="multi"]', root).forEach(setupMulti);
    h.$$('[data-demo="select"]', root).forEach(setupSelect);

    /* By the system: only data and what the page does with a choice. */
    var fuzzy = h.$('[data-demo="sys-fuzzy"]', root);
    var out = h.$('[data-demo-out="sys-fuzzy"]', root);
    fuzzy.addEventListener('ds:change', function (event) { out.textContent = event.detail.value ? 'Chosen: ' + event.detail.value : 'Nothing chosen'; });
    fuzzy.addEventListener('ds:create', function (event) { h.toast('Created ' + event.detail.text + '.', 'success'); });

    var PEOPLE = ['Ada Lovelace', 'Alan Turing', 'Grace Hopper', 'Katherine Johnson', 'Edsger Dijkstra', 'Barbara Liskov', 'Donald Knuth', 'Margaret Hamilton', 'Frances Allen', 'Dorothy Vaughan'];
    var timers = [];
    DS.combobox.create(h.$('[data-demo="sys-remote"]', root), {
      source: function (query, context) {
        return new Promise(function (resolve, reject) {
          var timer = setTimeout(function () {
            resolve(PEOPLE.filter(function (person) { return DS.listbox.fuzzy(query, person); }).map(function (person, index) {
              return { value: 'u-' + index, label: person, meta: person.split(' ')[0].toLowerCase() + '@example.com' };
            }));
          }, h.slow(700));
          timers.push(timer);
          context.signal.addEventListener('abort', function () { clearTimeout(timer); reject(new DOMException('aborted', 'AbortError')); });
        });
      },
    });

    var kinds = ['Laptop', 'Workstation', 'Mini desktop', 'Field tablet', 'Monitor'];
    var devices = [];
    for (var i = 0; i < 5000; i += 1) devices.push({ value: 'd-' + i, label: kinds[i % kinds.length] + ' ' + (1000 + i), meta: 'Row ' + (i % 40 + 1) });
    DS.combobox.create(h.$('[data-demo="sys-many"]', root), { items: devices });
    return function () { timers.forEach(clearTimeout); };
  },
});
