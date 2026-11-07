/*
 * The Tearsheet demo: adding a device in three steps (each checked before
 * the next), a stacked tearsheet opened from the last step, the narrow
 * variant for a short form, and the unsaved-changes question. Opening,
 * steps, the guard and stacking come from the system (data-ds-open,
 * data-ds-tearsheet); wire() holds what a project writes: the save.
 */
function tsField(h, id, label, attrs, hint) {
  return '<div class="ds-field"><label class="ds-field__label" for="' + id + '">' + label + '</label>' +
    '<input class="ds-input" id="' + id + '"' + attrs + '>' +
    (hint ? '<small class="ds-field__hint">' + hint + '</small>' : '') + '</div>';
}

function tsStep(id, title, body, hidden) {
  return '<section class="ds-tearsheet__step" aria-labelledby="' + id + '"' + (hidden ? ' hidden' : '') + '>' +
    '<h3 id="' + id + '" tabindex="-1">' + title + '</h3>' + body + '</section>';
}

function tsHead(h, id, label, title, description) {
  return '<div class="ds-tearsheet__head"><div class="ds-tearsheet__heading">' +
    (label ? '<p class="ds-tearsheet__label">' + label + '</p>' : '') +
    '<h2 class="ds-dialog__title" id="' + id + '-title">' + title + '</h2>' +
    (description ? '<p class="ds-tearsheet__description">' + description + '</p>' : '') +
    '<p class="ds-tearsheet__progress"></p></div>' +
    '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close" data-ds-close>' + h.icon('close', 20) + '</button></div>';
}

function tsSubmit(label, busyLabel) {
  return '<button class="ds-btn ds-btn--filled" type="submit" data-ds-tearsheet-submit><span class="ds-btn__faces"><span class="ds-btn__face">' + label + '</span>' +
    '<span class="ds-btn__face ds-btn__face--busy" aria-hidden="true"><span class="ds-spinner ds-spinner--ink ds-sm"></span>' + busyLabel + '</span></span></button>';
}

SG.demo('tearsheet', {
  title: 'Tearsheet',
  group: 'overlays',
  need: 'Create or edit something in a tall flow of steps over the page, with its own head and foot',
  lead: 'A tall modal for a flow of a few steps: its own head, a rail of steps, a body that scrolls and a foot with the actions. Each step is checked before the next, unsaved changes are guarded, and a second tearsheet stacks over the first. The options panel changes density and shape around it.',
  options: { variants: ['default', 'narrow'], sizes: false, density: true, shape: true, tones: false },

  render: function (h) {
    var add = h.uid('add');
    var person = h.uid('person');
    var note = h.uid('note');
    var wide = h.variant !== 'narrow';
    var narrow = h.variant !== 'default';
    var s1 = h.uid('s1');
    var s2 = h.uid('s2');
    var s3 = h.uid('s3');
    var rail = '<nav class="ds-tearsheet__steps" aria-label="Steps"><ol class="ds-steps ds-steps--vertical">' +
      ['Device', 'Network', 'Owner'].map(function (label, index) {
        return '<li class="ds-steps__step"' + (index === 0 ? ' aria-current="step"' : '') + '><span class="ds-steps__mark">' + (index + 1) + '</span><span class="ds-steps__label">' + label + '</span></li>';
      }).join('') + '</ol></nav>';
    var addSheet = '<dialog class="ds-dialog ds-tearsheet" id="' + add + '" aria-labelledby="' + add + '-title" data-ds-tearsheet data-demo="add">' +
      '<div class="ds-dialog__backdrop"></div><form class="ds-dialog__box ds-tearsheet__box" novalidate>' +
      tsHead(h, add, 'Devices', 'Add a device', 'Register it, connect it to the network and hand it over to its owner.') +
      '<div class="ds-tearsheet__main">' + rail + '<div class="ds-tearsheet__body">' +
      tsStep(s1, 'Device', tsField(h, add + '-name', 'Name', ' name="name" required autocomplete="off" placeholder="LAPTOP-0042"', 'As printed on the label.') +
        '<div class="ds-field"><label class="ds-field__label" for="' + add + '-model">Model</label><select class="ds-input" id="' + add + '-model" name="model"><option>Laptop 14</option><option>Laptop 16</option><option>Tablet 11</option></select></div>' +
        tsField(h, add + '-serial', 'Serial number', ' name="serial" autocomplete="off"', 'Optional.'), false) +
      tsStep(s2, 'Network', tsField(h, add + '-host', 'Host name', ' name="host" required autocomplete="off" pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="laptop-0042"', 'Lower case letters, digits and hyphens.') +
        '<label class="ds-check"><input type="checkbox" name="vpn" checked><span>Connect to the VPN on start</span></label>', true) +
      tsStep(s3, 'Owner', tsField(h, add + '-owner', 'Owner', ' name="owner" required autocomplete="off" value="Ada Lovelace"') +
        '<div class="sg-row"><button class="ds-btn ds-btn--outlined" type="button" data-ds-open="#' + person + '">' + h.icon('userPlus', 18) + 'Add a person</button></div>', true) +
      '</div></div><div class="ds-tearsheet__foot">' +
      '<button class="ds-btn ds-btn--text" type="button" data-ds-close>Cancel</button>' +
      '<button class="ds-btn ds-btn--outlined" type="button" data-ds-tearsheet-back>Back</button>' +
      '<button class="ds-btn ds-btn--filled" type="button" data-ds-tearsheet-next>Next</button>' +
      tsSubmit('Add device', 'Adding') + '</div></form></dialog>' +
      // The stacked one: a narrow tearsheet opened from the last step.
      '<dialog class="ds-dialog ds-tearsheet ds-tearsheet--narrow" id="' + person + '" aria-labelledby="' + person + '-title" data-ds-tearsheet data-demo="person">' +
      '<div class="ds-dialog__backdrop"></div><form class="ds-dialog__box ds-tearsheet__box" novalidate>' +
      tsHead(h, person, 'People', 'Add a person', '') +
      '<div class="ds-tearsheet__main"><div class="ds-tearsheet__body">' +
      tsStep(h.uid('p1'), 'Contact', tsField(h, person + '-name', 'Name', ' name="name" required autocomplete="off"') +
        tsField(h, person + '-mail', 'Email', ' name="email" type="email" required autocomplete="off"'), false) +
      '</div></div><div class="ds-tearsheet__foot"><button class="ds-btn ds-btn--text" type="button" data-ds-close>Cancel</button>' +
      tsSubmit('Add person', 'Adding') + '</div></form></dialog>';

    var noteSheet = '<dialog class="ds-dialog ds-tearsheet ds-tearsheet--narrow" id="' + note + '" aria-labelledby="' + note + '-title" data-ds-tearsheet data-demo="note">' +
      '<div class="ds-dialog__backdrop"></div><form class="ds-dialog__box ds-tearsheet__box" novalidate>' +
      tsHead(h, note, 'Ticket #1042', 'Edit the ticket', 'Changes are guarded: close it after typing and it asks first.') +
      '<div class="ds-tearsheet__main"><div class="ds-tearsheet__body">' +
      tsStep(h.uid('n1'), 'Details', tsField(h, note + '-title-field', 'Title', ' name="title" required value="The fan of LAPTOP-0042 is loud"') +
        '<div class="ds-field"><label class="ds-field__label" for="' + note + '-text">Description</label><textarea class="ds-input" id="' + note + '-text" name="text" rows="5">It starts as soon as the laptop wakes up.</textarea></div>', false) +
      '</div></div><div class="ds-tearsheet__foot"><p class="ds-meta">Saved 2 minutes ago</p><button class="ds-btn ds-btn--text" type="button" data-ds-close>Cancel</button>' +
      tsSubmit('Save', 'Saving') + '</div></form></dialog>';

    return h.section('A flow of steps', '<div class="sg-row">' +
      (wide ? '<button class="ds-btn ds-btn--filled" type="button" data-ds-open="#' + add + '">' + h.icon('plus', 18) + 'Add a device</button>' : '') +
      (narrow ? '<button class="ds-btn ds-btn--outlined" type="button" data-ds-open="#' + note + '">' + h.icon('pencil', 18) + 'Edit the ticket</button>' : '') +
      '</div>' + (wide ? addSheet : '') + (narrow ? noteSheet : ''),
      'Next checks the step (try it with the name left empty); the rail and the progress line follow. On the last step, "Add a person" opens a second tearsheet stacked over the first. Type something and press Escape: it asks before the changes go.') +

      h.section('Keyboard', '<p class="ds-muted">Focus moves into the first field and <kbd class="ds-kbd">Tab</kbd> stays inside; <kbd class="ds-kbd">Enter</kbd> in a field goes to the next step and submits on the last; the heading of a new step takes focus; <kbd class="ds-kbd">Escape</kbd> closes, and asks first while there are changes.</p>');
  },

  wire: function (root, h) {
    var save = function (sheet, message) {
      if (!sheet) return;
      sheet.addEventListener('ds:submit', function (event) {
        if (event.target !== sheet) return;
        var data = event.detail.data;
        event.detail.wait(new Promise(function (resolve) { setTimeout(resolve, h.slow(900)); }).then(function () {
          h.toast(message(data));
        }));
      });
    };
    save(h.$('[data-demo="add"]', root), function (data) { return (data.get('name') || 'The device') + ' added.'; });
    save(h.$('[data-demo="person"]', root), function (data) { return (data.get('name') || 'The person') + ' added.'; });
    save(h.$('[data-demo="note"]', root), function () { return 'Ticket #1042 saved.'; });
    var person = h.$('[data-demo="person"]', root);
    if (person) {
      person.addEventListener('ds:close', function (event) {
        if (event.target !== person || event.detail.reason !== 'submit') return;
        var owner = h.$('[data-demo="add"] [name="owner"]', root);
        var name = h.$('[name="name"]', person).value;
        if (owner && name) owner.value = name;
      });
    }
    return function () {
      for (const open of root.querySelectorAll('dialog[open]')) {
        var flow = DS.get(open, 'tearsheet');
        if (flow) flow.set({ dirty: false });
        open.close();
      }
    };
  },
});
