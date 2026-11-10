/* The thinking indicator: its step rolls on the wheel with the shimmer; the time ticks in place. */
SG_LAB.add({
  id: 'thinking-step',
  group: 'feedback',
  title: 'Thinking indicator: the next step',
  note: '<code>DS.thinking.create()</code> and <code>set({ step })</code>: the step rolls on the wheel (<code>--ds-dur-slow</code>, <code>--ds-ease-in-out</code>, the hold <code>--ds-hold-status</code>) with the shimmer; the time and the tokens change in place. Rapid toggle rolls once, to the last.',
  shows: ['DS.thinking.create', '.ds-thinking', '.ds-thinking__step'],
  html: '<div class="ds-thinking" data-lab-thinking><span class="ds-thinking__step"><span class="ds-wheel"></span></span><span class="ds-thinking__meta"><time class="ds-thinking__time"></time><span class="ds-thinking__tokens"></span></span></div>',
  height: 120,
  setup: function (stage) {
    stage.thinking = DS.thinking.create(stage.querySelector('[data-lab-thinking]'), { step: 'Thinking', tokens: 120 });
    stage.at = 0;
  },
  play: function (stage) {
    var steps = ['Thinking', 'Reading the device list', 'Writing the summary'];
    stage.at = (stage.at + 1) % steps.length;
    stage.thinking.set({ step: steps[stage.at], tokens: 120 + stage.at * 900 });
    return DS.motion.settled(stage.querySelector('.ds-wheel'), { subtree: true });
  },
  toggle: function (stage, on) {
    stage.at = on ? 1 : 0;
    stage.thinking.set({ step: on ? 'Reading the device list' : 'Thinking' });
    // Done once the wheel holds its one line again (a turn waits out its hold; the line it pushed out goes after its exit).
    var slot = stage.querySelector('.ds-wheel');
    var left = 600;
    return new Promise(function (resolve) {
      (function check() {
        left -= 1;
        if (left <= 0 || (!slot.querySelector('[data-ds-leaving]') && slot.querySelectorAll('.ds-wheel__line').length === 1)) {
          resolve(DS.motion.settled(slot, { subtree: true }));
        } else requestAnimationFrame(check);
      }());
    });
  },
  state: function (stage) { return stage.at === 1; },
  reset: function (stage) {
    stage.thinking.destroy();
    stage.querySelector('.ds-wheel').textContent = '';
    stage.thinking = DS.thinking.create(stage.querySelector('[data-lab-thinking]'), { step: 'Thinking', tokens: 120 });
    stage.at = 0;
  },
});
