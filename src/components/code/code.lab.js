/* A folded code block: Show more glides the height open on --ds-ease-out, Show less folds it back faster on --ds-ease-in, from wherever it is. */
SG_LAB.add({
  id: 'code-fold',
  group: 'data',
  title: 'Code block folds',
  note: '<code>DS.code.create()</code> on a <code>.ds-code</code> with <code>data-ds-code-max="4"</code>: the block\'s height opens over <code>--ds-dur-medium</code> on <code>--ds-ease-out</code> (it pushes the page, so it never overshoots) and folds over <code>--ds-dur-base</code> on <code>--ds-ease-in</code>, set from the height it has, so a reversal continues. The fade and the chevron follow.',
  shows: ['DS.code.create', '.ds-code', '.ds-code__foot', '.ds-code__expand-label', '.ds-chevron', '--ds-dur-medium', '--ds-dur-base', '--ds-ease-out', '--ds-ease-in', '--ds-dur-fast'],
  html: '<figure class="ds-code ds-code--lines" data-lab-code data-ds-code-max="4" style="inline-size: min(100%, 420px)"><pre class="ds-code-block" tabindex="0" aria-label="Schedule" data-ds-code-lang="yaml"><code>schedule:\n  at: "02:00"\n  retries: 3\n  notify: true\ndevices:\n  - LAPTOP-0042\n  - PRINTER-7\n  - TABLET-12\nowner: Ada Lovelace</code></pre>' +
    '<div class="ds-code__foot"><button class="ds-btn ds-btn--text" type="button" data-ds-code-expand aria-expanded="false"><span class="ds-code__expand-label">Show more</span></button></div></figure>',
  height: 300,
  setup: function (stage) {
    stage.querySelector('[data-ds-code-expand]').insertAdjacentHTML('beforeend', DS.icons.icon(DS.icons.chevronDown, 20, 'ds-chevron'));
    stage.code = DS.code.create(stage.querySelector('[data-lab-code]'));
  },
  play: function (stage) {
    var el = stage.querySelector('[data-lab-code]');
    stage.code = stage.code || DS.code.create(el);
    stage.code.expand(el.getAttribute('data-state') !== 'expanded');
    return DS.motion.settled(el, { transitions: true, subtree: true });
  },
  toggle: function (stage, on) {
    var el = stage.querySelector('[data-lab-code]');
    stage.code = stage.code || DS.code.create(el);
    stage.code.expand(on);
    return DS.motion.settled(el, { transitions: true, subtree: true });
  },
  state: function (stage) {
    return stage.querySelector('[data-lab-code]').getAttribute('data-state') === 'expanded';
  },
  reset: function (stage) {
    var el = stage.querySelector('[data-lab-code]');
    if (stage.code) stage.code.expand(false);
    return DS.motion.settled(el, { transitions: true, subtree: true });
  },
  subject: function (stage) {
    return stage.querySelector('.ds-code-block');
  },
});
