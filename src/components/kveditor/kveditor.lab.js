/* A key-value editor's rows: a row added fades in through DS.motion.flip, a removed one fades out while the rows after it close the gap; a duplicate key's hint fades in. */
SG_LAB.add({
  id: 'kveditor-rows',
  group: 'controls',
  title: 'Key-value rows',
  note: '<code>DS.kveditor.create()</code>: Add brings a row in through <code>DS.motion.flip()</code> (it fades in over <code>--ds-dur-fast</code>), Remove takes one out while the others close the gap. The added row repeats a key, so its warning fades in (<code>ds-fade-in</code>).',
  shows: ['DS.kveditor.create', '.ds-kveditor', '.ds-kveditor__row', '.ds-kveditor__hint', 'ds-fade-in', 'DS.motion.flip'],
  html: '<fieldset class="ds-kveditor ds-kveditor--code" style="inline-size: min(100%, 560px)"><legend class="ds-fieldset__legend">Variables</legend><ul class="ds-kveditor__rows"></ul><div class="ds-kveditor__foot"></div></fieldset>',
  height: 300,
  setup: function (stage) {
    stage.editor = DS.kveditor.create(stage.querySelector('.ds-kveditor'), { value: { API_URL: 'https://api.example.test', LOG_LEVEL: 'info' } });
  },
  play: function (stage) {
    var editor = stage.editor;
    var list = stage.querySelector('.ds-kveditor__rows');
    editor.add({ key: 'API_URL', value: 'https://staging.example.test' }, 1);
    return DS.motion.settled(list).then(function () { return editor.remove(1); });
  },
  toggle: function (stage, on) {
    var editor = stage.editor;
    var list = stage.querySelector('.ds-kveditor__rows');
    var rows = editor.get();
    if (on && rows.length < 3) editor.add({ key: 'API_URL', value: 'https://staging.example.test' }, 1);
    else if (!on && rows.length > 2) return editor.remove(1);
    return DS.motion.settled(list);
  },
  state: function (stage) {
    return Boolean(stage.editor && stage.editor.get().length > 2);
  },
  reset: function (stage) {
    stage.editor.set({ API_URL: 'https://api.example.test', LOG_LEVEL: 'info' });
  },
});
