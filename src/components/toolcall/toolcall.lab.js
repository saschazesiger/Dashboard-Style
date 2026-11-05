/* The tool call: its status swaps at once; the body opens as a disclosure. */
SG_LAB.add({
  id: 'toolcall-status',
  group: 'feedback',
  title: 'Tool call: running to done',
  note: '<code>DS.toolcall.create()</code> and <code>set({ status })</code>: the spinner gives way to the check at once and the time stops; the row opens and closes as a <code>.ds-collapsible</code> (<code>--ds-dur-medium</code>, <code>--ds-ease-out</code>).',
  shows: ['DS.toolcall.create', '.ds-toolcall'],
  html: '<details class="ds-collapsible ds-disclosure ds-disclosure--row ds-toolcall" data-status="running" data-lab-toolcall><summary>' +
    '<span class="ds-toolcall__icon"></span><span class="ds-disclosure__title ds-toolcall__title"><span class="ds-toolcall__name">run_tests</span> <span class="ds-toolcall__args">npm test</span></span>' +
    '<span class="ds-toolcall__status"><span class="ds-toolcall__mark"><span class="ds-spinner"></span></span><span class="ds-toolcall__word">Running</span></span><time class="ds-toolcall__time"></time></summary>' +
    '<div class="ds-disclosure__body ds-toolcall__body"><div class="ds-toolcall__part"><p class="ds-toolcall__label">Output</p><pre class="ds-toolcall__code"><code>42 passing (1s)</code></pre></div></div></details>',
  height: 200,
  setup: function (stage) {
    var row = stage.querySelector('[data-lab-toolcall]');
    row.querySelector('.ds-toolcall__icon').append(DS.icons.iconElement(DS.icons.terminal, 20));
    stage.call = DS.toolcall.create(row, { since: Date.now() });
  },
  play: function (stage) {
    var row = stage.querySelector('[data-lab-toolcall]');
    var running = stage.call.get().status === 'running';
    stage.call.set(running ? { status: 'done', label: 'Done' } : { status: 'running', label: 'Running', since: Date.now() });
    row.open = running;
    return DS.motion.settled(row, { subtree: true });
  },
  toggle: function (stage, on) {
    var row = stage.querySelector('[data-lab-toolcall]');
    row.open = on;
    return DS.motion.settled(row, { subtree: true });
  },
  state: function (stage) { return stage.querySelector('[data-lab-toolcall]').open; },
});
