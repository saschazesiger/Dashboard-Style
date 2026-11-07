/* The question card: answered, its actions leave and the answer line fades in; opened again the actions enter. */
SG_LAB.add({
  id: 'question-answer',
  group: 'feedback',
  title: 'Question card: an answer',
  note: '<code>DS.question.create()</code> and <code>set({ state })</code>: answered, the actions leave (<code>DS.motion.leave()</code>, <code>.ds-leave</code>) and the answer line fades in (<code>ds-fade-in</code>, <code>--ds-dur-fast</code>); opened again the actions enter (<code>.ds-enter</code>). Rapid toggle turns them back from where they are.',
  shows: ['DS.question.create', '.ds-question', '.ds-question__actions', '.ds-question__answer'],
  html: '<form class="ds-question" data-lab-question aria-label="Restart LAPTOP-0042 now?"><div class="ds-question__head"><h3 class="ds-question__title">Restart LAPTOP-0042 now?</h3></div>' +
    '<div class="ds-radios ds-question__options" role="radiogroup" aria-label="Restart LAPTOP-0042 now?"><label class="ds-radio"><input type="radio" name="lab-q" value="now" checked><span><strong>Now</strong></span></label><label class="ds-radio"><input type="radio" name="lab-q" value="tonight"><span><strong>Tonight</strong></span></label></div>' +
    '<div class="ds-question__actions"><button class="ds-btn ds-btn--filled" type="submit">Answer</button><button class="ds-btn ds-btn--text" type="button" data-ds-question-skip>Skip</button></div><p class="ds-question__answer" hidden></p></form>',
  height: 280,
  setup: function (stage) {
    stage.question = DS.question.create(stage.querySelector('[data-lab-question]'));
  },
  play: function (stage, sg) {
    var actions = stage.querySelector('.ds-question__actions');
    stage.question.set({ state: 'answered' });
    return new Promise(function (resolve) {
      setTimeout(function () {
        stage.question.set({ state: 'waiting' });
        resolve(DS.motion.settled(actions));
      }, sg.slow(900));
    });
  },
  toggle: function (stage, on) {
    stage.question.set({ state: on ? 'answered' : 'waiting' });
    return DS.motion.settled(stage.querySelector('.ds-question__actions'));
  },
  state: function (stage) { return stage.question.get().state === 'answered'; },
});
