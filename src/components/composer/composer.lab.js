/*
 * The Motion Lab entries of DS.composer: the command palette at the caret,
 * and the attachment chips that pop in and out.
 */
SG_LAB.add({
  id: 'composer-palette',
  group: 'overlays',
  title: 'Composer: the command palette at the caret',
  note: 'Typing "/" opens the palette above the caret: a fade on <code>--ds-dur-fast</code> and a grow from <code>--ds-scale-popup</code> on the spring; it leaves in <code>--ds-dur-instant</code>, fading only. Closed mid-way, it turns back from where it is.',
  shows: ['DS.composer.create', '.ds-composer__palette', '--ds-scale-popup', '--ds-dur-fast', '--ds-dur-medium', '--ds-dur-instant', '--ds-ease-spatial'],
  html: '<form class="ds-composer" style="margin-block-start:180px" onsubmit="return false">' +
    '<textarea class="ds-composer__input ds-input--grow" rows="1" aria-label="Message" placeholder="Message"></textarea>' +
    '<button class="ds-btn ds-btn--filled ds-btn--icon" type="submit" aria-label="Send">' + DS.icons.icon(DS.icons.send, 20) + '</button>' +
    '<div class="ds-composer__palette" role="listbox" aria-label="Commands" data-ds-composer-trigger="/" popover="manual" hidden>' +
    '<div class="ds-composer__option" role="option" data-value="/summarize"><span class="ds-composer__option-label">/summarize</span><span class="ds-composer__option-hint">Sum up the ticket</span></div>' +
    '<div class="ds-composer__option" role="option" data-value="/assign"><span class="ds-composer__option-label">/assign</span><span class="ds-composer__option-hint">Give the ticket to someone</span></div>' +
    '</div></form>',
  height: 260,
  setup: function (stage) {
    DS.composer.create(stage.querySelector('.ds-composer'), { enter: 'send' });
  },
  subject: function (stage) { return stage.querySelector('.ds-composer__palette'); },
  state: function (stage) { return stage.querySelector('.ds-composer__palette').getAttribute('data-state') === 'open'; },
  toggle: function (stage, on) {
    var field = stage.querySelector('.ds-composer__input');
    var palette = stage.querySelector('.ds-composer__palette');
    field.focus({ preventScroll: true });
    field.value = on ? '/' : '';
    field.setSelectionRange(field.value.length, field.value.length);
    field.dispatchEvent(new Event('input', { bubbles: true }));
    return DS.motion.settled(palette);
  },
  play: function (stage) {
    var lab = this;
    return lab.toggle(stage, true).then(function () { return lab.toggle(stage, false); });
  },
});

SG_LAB.add({
  id: 'composer-attachments',
  group: 'controls',
  title: 'Composer: attachments pop in and out',
  note: 'A file attached (picked, dropped or pasted) pops in as a chip; a removed one pops out, the focus going to the next chip.',
  shows: ['DS.composer.create', '.ds-composer__attachment', '.ds-enter--pop', '.ds-leave--pop'],
  html: '<form class="ds-composer" onsubmit="return false"><ul class="ds-composer__attachments" aria-label="Attachments"></ul>' +
    '<textarea class="ds-composer__input ds-input--grow" rows="1" aria-label="Message" placeholder="Message"></textarea>' +
    '<button class="ds-btn ds-btn--filled ds-btn--icon" type="submit" aria-label="Send">' + DS.icons.icon(DS.icons.send, 20) + '</button></form>',
  height: 160,
  setup: function (stage) {
    stage.composer = DS.composer.create(stage.querySelector('.ds-composer'));
  },
  state: function (stage) { return stage.composer.get().attachments.length > 0; },
  toggle: function (stage, on) {
    var composer = stage.composer;
    var tray = stage.querySelector('.ds-composer__attachments');
    if (on && !composer.get().attachments.length) composer.add([new File(['report'], 'battery-report.pdf', { type: 'application/pdf' })]);
    if (!on) composer.get().attachments.forEach(function (item) { composer.remove(item.id); });
    return DS.motion.settled(tray, { subtree: true });
  },
  play: function (stage) {
    var lab = this;
    return lab.toggle(stage, true).then(function () { return lab.toggle(stage, false); });
  },
});
