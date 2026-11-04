/*
 * The Tasks demo: the steps of a job, advanced by hand. Registered through
 * SG.demo() (styleguide/sg-core.js). Size and density come from the options
 * panel around it and only space the steps; the shape reaches the pending
 * ring. A project's job would report
 * the status; here the buttons stand for it.
 */
var STEPS = ['Copy the image', 'Install updates', 'Join the domain', 'Restart'];

function stepsHtml(h, state) {
  return STEPS.map(function (text, index) {
    var status = index < state.done ? 'done' : index === state.done ? (state.failed ? 'failed' : 'running') : 'pending';
    var mark = status === 'done' ? h.icon('checkCircle', 20) : status === 'failed' ? h.icon('alertCircle', 20) : status === 'running' ? '<span class="ds-spinner ds-spinner--ink ds-sm"></span>' : '';
    var word = { done: ': done', running: ': running', pending: ': waiting' }[status];
    return '<li class="ds-tasks__item" data-status="' + status + '" data-ds-key="t' + index + '"><span class="ds-tasks__mark">' + mark + '</span><span class="ds-tasks__text">' + text +
      (status === 'failed' ? ': failed, the server did not answer' : '<span class="ds-sr">' + word + '</span>') + '</span></li>';
  }).join('');
}

SG.demo('tasks', {
  title: 'Tasks',
  group: 'data',
  need: 'Follow the steps of a job: pending, running, done or failed',
  lead: 'The steps of a job, each pending, running, done or failed. The status shows in the shape of the mark and the weight of the text, never in colour alone, and a step that turns done in place draws its tick.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var state = { done: 1, failed: false };
    return h.section('A job', '<div class="ds-tasks__head"><h3 class="ds-card__title">Set up LAPTOP-0042</h3><p class="ds-meta" data-demo="count">1 of ' + STEPS.length + '</p></div>' +
      '<ol class="ds-tasks" aria-label="Steps" data-demo="steps">' + stepsHtml(h, state) + '</ol>' +
      '<div class="sg-row"><button class="ds-btn ds-sm" type="button" data-demo="next">Advance</button><button class="ds-btn ds-sm" type="button" data-demo="fail">Fail the running step</button><button class="ds-btn ds-btn--text ds-sm" type="button" data-demo="reset">Start over</button></div>') +

      h.section('Every status', '<ol class="ds-tasks" aria-label="Every status" data-demo="all">' +
        '<li class="ds-tasks__item" data-status="pending"><span class="ds-tasks__mark"></span><span class="ds-tasks__text">Pending: a ring<span class="ds-sr">: waiting</span></span></li>' +
        '<li class="ds-tasks__item" data-status="running"><span class="ds-tasks__mark"><span class="ds-spinner ds-spinner--ink ds-sm"></span></span><span class="ds-tasks__text">Running: the small spinner and the label weight<span class="ds-sr">: running</span></span></li>' +
        '<li class="ds-tasks__item" data-status="done"><span class="ds-tasks__mark">' + h.icon('checkCircle', 20) + '</span><span class="ds-tasks__text">Done: the check in a circle<span class="ds-sr">: done</span></span></li>' +
        '<li class="ds-tasks__item" data-status="failed"><span class="ds-tasks__mark">' + h.icon('alertCircle', 20) + '</span><span class="ds-tasks__text">Join the domain: failed, the server did not answer</span></li>' +
        '</ol>') +

      h.section('Empty', '<ol class="ds-tasks" aria-label="No steps"></ol><p class="ds-muted">An empty list takes no room.</p>') +

      h.section('Keyboard', '<p class="ds-muted">A step is no target, so the list adds no tab stop; a link in a step\'s text is reached as usual. Each step says its status in words.</p>');
  },

  // What a page writes itself: the status of each step, the count in the head.
  wire: function (root, h) {
    var state = { done: 1, failed: false };
    var onClick = function (event) {
      var target = event.target.closest('[data-demo="next"], [data-demo="fail"], [data-demo="reset"]');
      if (!target || !root.contains(target)) return;
      var action = target.getAttribute('data-demo');
      if (action === 'next') {
        if (state.failed) state.failed = false;
        else state.done = Math.min(STEPS.length, state.done + 1);
      }
      if (action === 'fail' && state.done < STEPS.length) state.failed = true;
      if (action === 'reset') state = { done: 0, failed: false };
      window.DS.dom.morphHtml(h.$('[data-demo="steps"]', root), stepsHtml(h, state));
      h.$('[data-demo="count"]', root).textContent = state.done + ' of ' + STEPS.length;
    };
    root.addEventListener('click', onClick);
    return function () { root.removeEventListener('click', onClick); };
  }
});
