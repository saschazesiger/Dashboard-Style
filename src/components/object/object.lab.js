/*
 * Motion Lab: the object page. Edit swaps a section's view for its form,
 * Cancel swaps it back; toggled fast, each face continues from where it is.
 */
function objectMarkup() {
  return '<article class="ds-object" style="inline-size: 360px;" data-lab="object"><section class="ds-card ds-object__section" id="lab-object-general" aria-labelledby="lab-object-title">' +
    '<div class="ds-object__head"><h4 class="ds-object__title" id="lab-object-title">General</h4><button class="ds-btn ds-btn--text ds-sm ds-object__edit" type="button" data-ds-object-edit>Edit</button></div>' +
    '<div class="ds-object__view"><dl class="ds-facts ds-facts--rows"><div><dt>Name</dt><dd>LAPTOP-0042</dd></div><div><dt>Site</dt><dd>Building B</dd></div></dl></div>' +
    '<form class="ds-form ds-object__form" hidden><div class="ds-field"><label class="ds-field__label" for="lab-object-name">Name</label><input class="ds-input" id="lab-object-name" name="name" value="LAPTOP-0042"></div>' +
    '<div class="ds-form-actions"><button class="ds-btn" type="button" data-ds-object-cancel>Cancel</button><button class="ds-btn ds-btn--filled" type="submit">Save</button></div></form></section></article>';
}

SG_LAB.add({
  id: 'object-edit',
  group: 'navigation',
  title: 'Object page: a section turns into its form',
  note: 'Edit hides the view and the form enters with <code>.ds-enter--swap</code>; Cancel brings the view back the same way. Toggle fast: each face continues from where it is.',
  shows: ['DS.object.create', '.ds-object__section', '.ds-object__form', '.ds-enter--swap', '--ds-dur-medium'],
  html: objectMarkup(),
  height: 240,
  setup: function (stage) {
    stage.dsObject = DS.object.create(stage.querySelector('.ds-object'));
  },
  play: function (stage) {
    stage.dsObject.edit('lab-object-general');
    return DS.motion.settled(stage.querySelector('.ds-object__form'));
  },
  reset: function (stage) {
    stage.dsObject.cancel('lab-object-general');
    return DS.motion.settled(stage.querySelector('.ds-object__view'));
  },
  state: function (stage) { return stage.dsObject.get().length > 0; },
  toggle: function (stage, on) {
    if (on) stage.dsObject.edit('lab-object-general');
    else stage.dsObject.cancel('lab-object-general');
    return DS.motion.settled(stage.querySelector(on ? '.ds-object__form' : '.ds-object__view'));
  },
});
