/*
 * The Form wizard demo: a problem report in four steps and a review, with
 * required fields, a radio group, an optional step and the summary; the
 * steps as a row, a bar or a column. Registered through SG.demo()
 * (styleguide/sg-core.js). Size, density, shape and touch come from the
 * options panel around it. Sending is the page's (a snackbar); checking,
 * moving, the steps and the summary are DS.wizard.
 */
function wizardField(h, label, control, hint) {
  var id = h.uid('wizard');
  return '<div class="ds-field"><label class="ds-field__label" for="' + id + '">' + label + '</label>' + control.replace('{id}', id) +
    (hint ? '<small class="ds-field__hint">' + hint + '</small>' : '') + '</div>';
}

function wizardForm(h, steps) {
  var title = h.uid('wizard-title');
  var panel = function (name, body, attributes) {
    var id = h.uid('wizard-step');
    return '<section class="ds-wizard__panel" aria-labelledby="' + id + '"' + (attributes || '') + '><h3 class="ds-wizard__title" id="' + id + '">' + name + '</h3>' + body + '</section>';
  };
  var what = h.uid('wizard-what');
  return '<form class="ds-wizard" data-ds-wizard aria-labelledby="' + title + '" data-demo="wizard" style="max-inline-size: 720px;">' +
    '<h2 class="ds-sr" id="' + title + '">Report a problem</h2>' +
    '<ol class="ds-steps ds-wizard__steps' + (steps ? ' ds-steps--' + steps : '') + '" aria-label="Report a problem"></ol>' +
    panel('Device', '<div class="ds-form-grid ds-form-grid--2">' +
      wizardField(h, 'Device', '<select class="ds-input" id="{id}" name="device" required><option value="">Choose a device</option><option>LAPTOP-0042</option><option>DESKTOP-0107</option><option>PRINTER-0003</option></select>') +
      wizardField(h, 'Serial number', '<input class="ds-input" id="{id}" name="serial" required pattern="SN-[0-9]{4}-[0-9]{2}" placeholder="SN-0000-00">', 'As printed on the label: SN-3381-77') +
      '</div>') +
    panel('Problem', '<fieldset class="ds-fieldset" aria-describedby="' + what + '-hint"><legend class="ds-fieldset__legend" id="' + what + '">What happened</legend>' +
      '<label class="ds-check"><input type="radio" name="kind" value="power" required><span>It does not start</span></label>' +
      '<label class="ds-check"><input type="radio" name="kind" value="slow"><span>It is slow</span></label>' +
      '<label class="ds-check"><input type="radio" name="kind" value="broken"><span>Something is broken</span></label></fieldset>' +
      wizardField(h, 'Description', '<textarea class="ds-input" id="{id}" name="description" required minlength="10" rows="3"></textarea>', 'At least 10 characters.'), ' hidden') +
    panel('Contact', '<div class="ds-form-grid ds-form-grid--2">' +
      wizardField(h, 'Name', '<input class="ds-input" id="{id}" name="name" required autocomplete="name" value="Ada Lovelace">') +
      wizardField(h, 'Email', '<input class="ds-input" id="{id}" name="email" type="email" required autocomplete="email">') +
      '</div><label class="ds-check"><input type="checkbox" name="callback"><span>Call me back</span></label>', ' hidden') +
    panel('Photos', wizardField(h, 'Photos of the device', '<input class="ds-input" id="{id}" name="photos" type="file" accept="image/*" multiple>', 'Optional: they help the technician bring the right part.'), ' data-ds-wizard-optional hidden') +
    panel('Review', '<p class="ds-muted" style="margin: 0;">Check what you entered; Edit goes back to a step.</p><div class="ds-wizard__summary"></div>', ' data-ds-wizard-summary hidden') +
    '<div class="ds-wizard__actions"><button class="ds-btn ds-wizard__back" type="button">' + h.icon('arrowLeft', 16) + 'Back</button>' +
    '<button class="ds-btn ds-btn--filled ds-wizard__next" type="button">Next' + h.icon('arrowRight', 16) + '</button>' +
    '<button class="ds-btn ds-btn--filled ds-wizard__submit" type="submit" hidden><span class="ds-btn__faces">' +
    '<span class="ds-btn__face">' + h.icon('send', 16) + 'Send report</span>' +
    '<span class="ds-btn__face ds-btn__face--busy" aria-hidden="true"><span class="ds-spinner ds-spinner--ink ds-sm"></span>Sending</span>' +
    '<span class="ds-btn__face ds-btn__face--done" aria-hidden="true">' + h.icon('check', 16) + 'Sent</span></span></button></div></form>';
}

SG.demo('wizard', {
  title: 'Form wizard',
  group: 'forms',
  need: 'Split a long form into steps, each checked before the next, with Back, Next and a summary to review before sending',
  lead: 'A form in steps: Next checks the step and says in words what is missing, Back never checks, and the last step shows what will be sent, with an Edit button per step. Built on Steps.',
  options: { variants: ['row', 'bar', 'vertical'], sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var steps = h.variant === 'bar' ? 'bar' : h.variant === 'vertical' ? 'vertical' : '';
    var others = h.variant ? '' :
      h.section('Steps as a bar', wizardForm(h, 'bar'), 'For many steps or little room: one segment per step, and the list is named "Step 1 of 5".') +
      h.section('Steps in a column', wizardForm(h, 'vertical'), 'For wordy steps; the labels wrap and all of them stay at every width.');
    return h.section('Report a problem', wizardForm(h, steps),
      'Press Next without filling anything in: each missing field says so and the first one takes the focus. Sending shows the busy face, then the done face.') + others +
      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> goes through the fields of the open step, then Back and Next. <kbd class="ds-kbd">Enter</kbd> in a field goes on, as Next. When a step opens, its title takes the focus and a screen reader hears "Step 2 of 5: Problem".</p>');
  },

  wire: function (root, h) {
    h.$$('[data-demo="wizard"]', root).forEach(function (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var send = new Promise(function (resolve) { setTimeout(resolve, h.slow(1200)); });
        DS.motion.busy(form.querySelector('.ds-wizard__submit'), send).then(function () {
          h.toast('Report sent. A technician gets back to you today.', 'success');
        });
      });
    });
  },
});
