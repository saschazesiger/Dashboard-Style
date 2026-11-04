/*
 * The Save bar demo: a small view with a form whose first change shows the
 * floating bar through DS.overlay.savebar(), the bar at rest, and the bar in
 * the flow for a form outside a card. Registered through SG.demo()
 * (styleguide/sg-core.js). Size, density, shape and touch come from the
 * options panel around it. Tracking what changed and the fake save are what a
 * project writes itself.
 */
function faces(h) {
  return '<span class="ds-btn__faces"><span class="ds-btn__face">Save</span>' +
    '<span class="ds-btn__face ds-btn__face--busy" aria-hidden="true"><span class="ds-spinner ds-spinner--ink ds-sm"></span>Saving</span>' +
    '<span class="ds-btn__face ds-btn__face--done" aria-hidden="true">' + h.icon('check', 16) + 'Saved</span></span>';
}

function formFields(h, count) {
  var fields = [['Device name', 'LAPTOP-0042'], ['Owner', 'Ada Lovelace'], ['Room', 'Second floor'], ['Serial number', 'SN-3381-77'], ['Asset tag', 'A-1093'], ['Cost centre', '4410']];
  return fields.slice(0, count).map(function (entry) {
    var id = h.uid('savebar');
    return '<div class="ds-field"><label class="ds-field__label" for="' + id + '">' + entry[0] + '</label><input class="ds-input" id="' + id + '" value="' + entry[1] + '"></div>';
  }).join('');
}

function actions(h) {
  return '<div class="ds-savebar__actions"><button class="ds-btn ds-btn--text" type="button" data-demo="discard">Discard</button>' +
    '<button class="ds-btn ds-btn--filled" type="button" data-demo="save">' + faces(h) + '</button></div>';
}

SG.demo('savebar', {
  title: 'Save bar',
  group: 'forms',
  need: 'Save or discard unsaved changes from a bar that appears when something changed, or keep a form\'s actions in reach',
  lead: 'The unsaved edits of a view, saved or discarded together. It floats at the bottom of the view and takes no room; a field under it scrolls clear. The options panel changes size, density, shape and touch around the demo.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    return h.section('On a view', '<div class="ds-view" data-demo="view" style="block-size: 340px; border: 1px solid var(--ds-line); view-transition-name: none;">' +
        '<div class="ds-content"><form class="ds-form" data-demo="form">' + formFields(h, 6) + '</form></div>' +
        '<div class="ds-savebar"><div class="ds-savebar__bar ds-presence" role="region" aria-label="Unsaved changes" data-demo="bar" hidden>' +
        '<p class="ds-savebar__text" data-demo="text"></p>' + actions(h) + '</div></div></div>',
      'Change a field: the bar rises, and the snackbar after a save rises above it. Discard or Save hides it, and focus goes back into the form.') +

      h.section('At rest', '<div data-demo="rest" style="position: relative; block-size: 88px; --ds-savebar-inset: 0px; --ds-savebar-offset: var(--ds-space-2);">' +
        '<div class="ds-savebar__bar" role="group" aria-label="Unsaved changes, at rest"><p class="ds-savebar__text">2 unsaved changes</p>' +
        '<div class="ds-savebar__actions"><button class="ds-btn ds-btn--text" type="button">Discard</button><button class="ds-btn ds-btn--filled" type="button">Save</button></div></div></div>') +

      h.section('In the flow', '<div class="ds-savebar-scroller" data-demo="flow" style="max-block-size: 300px; overflow-y: auto; border: 1px solid var(--ds-line); --ds-savebar-bleed: var(--ds-space-4);">' +
        '<form class="ds-form" style="padding-inline: var(--ds-space-4); padding-block-start: var(--ds-space-4);">' + formFields(h, 6) +
        '<div class="ds-savebar ds-savebar--inline"><div class="ds-savebar__bar" role="group" aria-label="Form actions"><p class="ds-savebar__text">Changes apply after a restart</p>' +
        '<div class="ds-savebar__actions"><button class="ds-btn ds-btn--text" type="button">Cancel</button><button class="ds-btn ds-btn--filled" type="submit">Save</button></div></div></div></form></div>',
      'The actions of a long form outside a card stay in reach at every width: the bar takes its own room and sticks to the bottom of the scroller while the form is on screen, and a focused field scrolls clear of it. No script.') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches the bar\'s buttons after the form; a focused field the bar would cover scrolls clear of it. Hiding the bar moves focus from inside it back into the form, so it is never lost.</p>');
  },

  wire: function (root, h) {
    var form = h.$('[data-demo="form"]', root);
    var text = h.$('[data-demo="text"]', root);
    var inputs = h.$$('input', form);
    var bar = DS.overlay.savebar(h.$('.ds-savebar', root), { focusTarget: function () { return inputs[0]; } });
    var changes = function () { return inputs.filter(function (input) { return input.value !== input.defaultValue; }).length; };

    form.addEventListener('submit', function (event) { event.preventDefault(); });
    form.addEventListener('input', function () {
      var count = changes();
      if (!count) { bar.hide(); return; }
      bar.update(function () { text.textContent = count === 1 ? '1 unsaved change' : count + ' unsaved changes'; });
      bar.show();
    });
    root.addEventListener('click', function (event) {
      var button = event.target.closest('[data-demo="discard"], [data-demo="save"]');
      if (!button) return;
      if (button.getAttribute('data-demo') === 'discard') {
        form.reset();
        bar.hide();
        return;
      }
      DS.motion.busy(button, function () {
        return new Promise(function (resolve) { setTimeout(resolve, h.slow(900)); });
      }).then(function () {
        inputs.forEach(function (input) { input.defaultValue = input.value; });
        bar.hide();
        h.toast('Changes saved.', 'success');
      });
    });
    h.$('[data-demo="flow"] form', root).addEventListener('submit', function (event) {
      event.preventDefault();
      h.toast('Changes saved.', 'success');
    });
    return function () { bar.destroy(); };
  },
});
