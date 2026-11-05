/* The reasoning disclosure: it opens while it runs (the shimmer on its line) and closes when it ends. */
SG_LAB.add({
  id: 'reasoning-auto',
  group: 'feedback',
  title: 'Reasoning: runs, then closes',
  note: '<code>DS.reasoning.create(el, { auto: true })</code>: it opens while it runs (a <code>.ds-collapsible</code>, <code>--ds-dur-medium</code> on <code>--ds-ease-out</code>; the shimmer on "Thinking") and closes to "Thought for ..." when <code>set({ done: true })</code> ends it.',
  shows: ['DS.reasoning.create', '.ds-reasoning'],
  html: '<details class="ds-collapsible ds-disclosure ds-reasoning" data-lab-reasoning><summary><span class="ds-reasoning__summary"></span> <time class="ds-reasoning__time"></time></summary>' +
    '<div class="ds-disclosure__body ds-reasoning__body"><div class="ds-reasoning__text"><p>Forty laptops; eleven end before March.</p><p>Three of those are in repair.</p></div></div></details>',
  height: 200,
  setup: function (stage) {
    stage.reasoning = DS.reasoning.create(stage.querySelector('[data-lab-reasoning]'), { done: true, total: 4000, auto: true });
  },
  play: function (stage, sg) {
    var el = stage.querySelector('[data-lab-reasoning]');
    stage.reasoning.set({ done: false, since: Date.now() });
    return new Promise(function (resolve) {
      setTimeout(function () {
        stage.reasoning.set({ done: true });
        resolve(DS.motion.settled(el, { subtree: true }));
      }, sg.slow(1200));
    });
  },
  toggle: function (stage, on) {
    stage.reasoning.set({ done: !on, since: Date.now() });
    return DS.motion.settled(stage.querySelector('[data-lab-reasoning]'), { subtree: true });
  },
  state: function (stage) { return !stage.reasoning.get().done; },
});
