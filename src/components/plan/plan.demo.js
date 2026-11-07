/*
 * The Plan card demo: a plan waiting for approval (approve, reject, or the
 * page's own Edit), one whose decision waits for the server (ds:decide),
 * an approved plan whose steps run, a rejected one, and a narrow column.
 * Registered through SG.demo() (styleguide/sg-core.js).
 */
var PLAN_STEPS = ['Find the laptops with a battery ticket', 'Order three batteries for LAPTOP-0007, -0019 and -0031', 'Book a repair slot with Ada Lovelace', 'Close the tickets once the batteries are in'];

function planSteps(h, statuses, steps) {
  return '<ol class="ds-tasks ds-plan__steps" aria-label="Steps">' + (steps || PLAN_STEPS).map(function (text, i) {
    var status = statuses ? statuses[i] || 'pending' : 'pending';
    var mark = status === 'done' ? h.icon('checkCircle', 20) : status === 'running' ? '<span class="ds-spinner ds-spinner--ink ds-sm"></span>' : '';
    var word = { done: ': done', running: ': running', pending: ': waiting' }[status];
    return '<li class="ds-tasks__item" data-status="' + status + '"><span class="ds-tasks__mark">' + mark + '</span><span class="ds-tasks__text">' + h.esc(text) + '<span class="ds-sr">' + word + '</span></span></li>';
  }).join('') + '</ol>';
}

function planFaces(h, label, busy) {
  return '<span class="ds-btn__faces"><span class="ds-btn__face">' + label + '</span>' +
    '<span class="ds-btn__face ds-btn__face--busy" aria-hidden="true"><span class="ds-spinner ds-spinner--ink ds-sm"></span>' + busy + '</span></span>';
}

function planCard(h, opts) {
  var id = h.uid('plan');
  return '<article class="ds-plan" data-ds-plan' + (opts.attrs || '') + ' aria-labelledby="' + id + '">' +
    '<div class="ds-plan__head"><span class="ds-plan__icon">' + h.icon('clipboardCheck', 20) + '</span>' +
    '<h3 class="ds-plan__title" id="' + id + '">' + h.esc(opts.title) + '</h3><span class="ds-plan__state"></span></div>' +
    (opts.lead ? '<p class="ds-plan__lead">' + h.esc(opts.lead) + '</p>' : '') +
    planSteps(h, opts.statuses, opts.steps) +
    (opts.actions === false ? '' : '<div class="ds-plan__actions">' +
      '<button class="ds-btn ds-btn--filled" type="button" data-ds-plan-action="approve">' + (opts.faces ? planFaces(h, 'Approve', 'Approving') : h.icon('check', 18) + 'Approve') + '</button>' +
      '<button class="ds-btn" type="button" data-ds-plan-action="reject">' + (opts.faces ? planFaces(h, 'Reject', 'Rejecting') : 'Reject') + '</button>' +
      (opts.edit ? '<button class="ds-btn ds-btn--text" type="button" data-demo="edit">' + h.icon('pencil', 18) + 'Edit the plan</button>' : '') +
      '</div>') +
    (opts.note ? '<p class="ds-plan__note">' + h.esc(opts.note) + '</p>' : '') +
    '</article>';
}

SG.demo('plan', {
  title: 'Plan card',
  group: 'content',
  need: 'Let a person approve or reject the plan an assistant or agent proposes before it acts, with its steps',
  lead: 'The plan, step by step, and the decision. The state is a word beside its glyph, announced once; once decided the actions go and focus moves to the title.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    return h.section('Waiting for approval', planCard(h, { attrs: ' data-demo="waiting"', title: 'Replace the swollen batteries', lead: 'Three laptops, one ticket each. Nothing changes until you approve.', edit: true, note: 'Proposed by the assistant at 09:12' }) +
        '<div class="sg-row"><button class="ds-btn ds-btn--quiet" type="button" data-demo="again">' + h.icon('reset', 16) + 'Ask again</button></div>',
        'Approve or Reject decides; Edit the plan is the page\'s own action.') +

      h.section('Decided by the server', planCard(h, { attrs: ' data-demo="server"', title: 'Archive 12 closed tickets', faces: true, steps: ['Find the tickets closed before October', 'Archive them with their attachments', 'Tell the people who opened them'], note: 'The decision waits for the server: the page cancels ds:decide, shows the button busy, then calls set().' })) +

      h.section('Approved, at work', planCard(h, { attrs: ' data-ds-plan-state="approved"', title: 'Update LAPTOP-0042', steps: ['Download the updates', 'Install them', 'Restart LAPTOP-0042', 'Check that it comes back online'], statuses: ['done', 'done', 'running', 'pending'], note: 'Approved by Ada Lovelace at 09:14' })) +

      h.section('Rejected', planCard(h, { attrs: ' data-ds-plan-state="rejected"', title: 'Wipe and reissue LAPTOP-0019', steps: ['Back up the user data', 'Wipe the disk', 'Install the image again', 'Hand it to Ada Lovelace'], note: 'Rejected by Ada Lovelace at 10:02' })) +

      h.section('Narrow', '<div style="max-inline-size: 300px">' + planCard(h, { title: 'Restart the print server', steps: ['Drain the print queue', 'Restart the service', 'Print a test page'], edit: true }) + '</div>',
        'The actions wrap; the state goes under the title when it does not fit beside it.') +

      h.section('Keyboard and screen readers', '<p class="ds-muted">Tab reaches the actions; Enter or Space decides. The card is an article named by its title; the new state is announced once, and focus moves to the title when the actions go.</p>');
  },

  wire: function (root, h) {
    var waiting = h.$('[data-demo="waiting"]', root);
    var server = h.$('[data-demo="server"]', root);
    root.addEventListener('click', function (event) {
      var button = event.target.closest('button[data-demo]');
      if (!button) return;
      if (button.getAttribute('data-demo') === 'again') DS.core.get(waiting, 'plan').set('waiting');
      if (button.getAttribute('data-demo') === 'edit') h.toast('The plan opens for editing', 'info');
    });
    server.addEventListener('ds:decide', function (event) {
      event.preventDefault();
      var decision = event.detail.decision;
      var pressed = h.$('[data-ds-plan-action="' + (decision === 'approved' ? 'approve' : 'reject') + '"]', server);
      DS.motion.busy(pressed, function () {
        return new Promise(function (resolve) { setTimeout(resolve, h.slow(900)); });
      }, { done: false }).then(function () { DS.core.get(server, 'plan').set(decision); });
    });
  },
});
