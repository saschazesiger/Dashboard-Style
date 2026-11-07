/*
 * The Question card demo: one choice with an answer of one's own, several
 * choices, one answered by the server (ds:answer), one answered before
 * (from history), and a narrow column. Registered through SG.demo()
 * (styleguide/sg-core.js).
 */
function questionCard(h, opts) {
  var id = h.uid('question');
  var name = h.uid('q');
  var otherId = h.uid('q-other');
  var many = opts.many;
  var options = opts.options.map(function (option) {
    var input = '<input' + (many ? ' class="ds-checkbox" type="checkbox"' : ' type="radio"') + ' name="' + name + '" value="' + option[0] + '"' + (option[3] ? ' checked' : '') + '>';
    return '<label class="' + (many ? 'ds-check-card' : 'ds-radio') + '">' + input +
      '<span><strong>' + h.esc(option[1]) + '</strong>' + (option[2] ? '<small>' + h.esc(option[2]) + '</small>' : '') + '</span></label>';
  }).join('');
  return '<form class="ds-question" data-ds-question' + (opts.attrs || '') + ' aria-labelledby="' + id + '">' +
    '<div class="ds-question__head"><span class="ds-question__icon">' + h.icon('helpCircle', 20) + '</span>' +
    '<h3 class="ds-question__title" id="' + id + '">' + h.esc(opts.title) + '</h3></div>' +
    (opts.hint ? '<p class="ds-question__hint">' + h.esc(opts.hint) + '</p>' : '') +
    '<div class="' + (many ? 'ds-check-cards' : 'ds-radios') + ' ds-question__options" role="' + (many ? 'group' : 'radiogroup') + '" aria-labelledby="' + id + '">' + options + '</div>' +
    (opts.other ? '<div class="ds-field ds-question__other"><label class="ds-field__label" for="' + otherId + '">Your answer</label><input class="ds-input" id="' + otherId + '" name="other" autocomplete="off"></div>' : '') +
    '<p class="ds-field__hint ds-field__hint--error ds-question__error" hidden></p>' +
    '<div class="ds-question__actions"><button class="ds-btn ds-btn--filled" type="submit">' + (opts.faces ? '<span class="ds-btn__faces"><span class="ds-btn__face">Answer</span><span class="ds-btn__face ds-btn__face--busy" aria-hidden="true"><span class="ds-spinner ds-spinner--ink ds-sm"></span>Sending</span></span>' : 'Answer') + '</button>' +
    '<button class="ds-btn ds-btn--text" type="button" data-ds-question-skip>Skip</button></div>' +
    '<p class="ds-question__answer" hidden></p>' +
    '</form>';
}

var BATTERIES = [['all', 'All three', 'LAPTOP-0007, -0019 and -0031'], ['worst', 'Only LAPTOP-0007', 'Its battery swells'], ['other', 'Something else']];

SG.demo('question', {
  title: 'Question card',
  group: 'content',
  need: 'Ask a person a question while an assistant or agent works: options to choose, an answer of one\'s own, Answer and Skip',
  lead: 'The question, its options and an answer of one\'s own. Keys 1 to 9 pick an option; once answered the choice stays in view and a line says it.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    return h.section('One choice', questionCard(h, { attrs: ' data-demo="one"', title: 'Which laptops should get new batteries?', hint: 'The assistant waits for your answer before it orders anything.', options: BATTERIES, other: true }) +
        '<div class="sg-row"><button class="ds-btn ds-btn--quiet" type="button" data-demo="again">' + h.icon('reset', 16) + 'Ask again</button></div>',
        'Answer without a choice shows the message; typing your own answer picks Something else.') +

      h.section('Several choices', questionCard(h, { attrs: ' data-demo="many"', title: 'Which reports should the summary include?', many: true,
        options: [['warranty', 'Warranty', 'Devices that leave warranty this quarter', true], ['tickets', 'Open tickets', 'By device and age'], ['costs', 'Repair costs', 'Per Product line']] })) +

      h.section('Answered by the server', questionCard(h, { attrs: ' data-demo="server"', title: 'Restart LAPTOP-0042 now?', faces: true, options: [['now', 'Now', 'Ada Lovelace is not signed in'], ['tonight', 'Tonight at 22:00']] }),
        'The page cancels ds:answer, shows the button busy, then calls set({ state: \'answered\' }).') +

      h.section('Answered before', questionCard(h, { attrs: ' data-demo="history" data-ds-question-state="answered"', title: 'Which ticket queue?', options: [['hardware', 'Hardware', null, true], ['software', 'Software']] }),
        'A question from history: data-ds-question-state="answered" renders it decided, without motion or announcement.') +

      h.section('Narrow', '<div style="max-inline-size: 300px">' + questionCard(h, { title: 'Keep the old device record?', options: [['keep', 'Keep it', 'Archived for a year'], ['delete', 'Delete it']] }) + '</div>') +

      h.section('Keyboard and screen readers', '<p class="ds-muted">Tab reaches the options, the field and the actions; the arrows choose in a radio group. 1 to 9 pick an option, Enter on an option answers. The options are named by the question; the answer is announced once and takes the focus.</p>');
  },

  wire: function (root, h) {
    var one = h.$('[data-demo="one"]', root);
    var server = h.$('[data-demo="server"]', root);
    root.addEventListener('click', function (event) {
      var button = event.target.closest('button[data-demo="again"]');
      if (!button) return;
      var question = DS.core.get(one, 'question');
      question.set({ value: null, other: '', state: 'waiting' });
    });
    server.addEventListener('ds:answer', function (event) {
      if (event.detail.skipped) return;
      event.preventDefault();
      DS.motion.busy(h.$('button[type="submit"]', server), function () {
        return new Promise(function (resolve) { setTimeout(resolve, h.slow(900)); });
      }, { done: false }).then(function () { DS.core.get(server, 'question').set({ state: 'answered' }); });
    });
  },
});
