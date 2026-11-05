/*
 * The Unsaved-changes guard demo: a device form in a small view, guarded by
 * data-ds-unsaved: a change shows the save bar with the count and the
 * field's dot, Ctrl+S or Save saves (a fake request that fails once in a
 * while is the page's), Discard puts the values back, and "Go to devices"
 * asks before it leaves. Registered through SG.demo() (styleguide/sg-core.js).
 * The small view keeps out of the styleguide frame's View Transitions and
 * scroll timeline, as the Save bar demo does.
 */
function unsavedField(h, label, control) {
  var id = h.uid('unsaved');
  return '<div class="ds-field"><label class="ds-field__label" for="' + id + '">' + label + ' <span class="ds-field__changed ds-sr">(changed)</span></label>' +
    control.replace('{id}', id) + '</div>';
}

function unsavedFaces(h) {
  return '<span class="ds-btn__faces"><span class="ds-btn__face">Save</span>' +
    '<span class="ds-btn__face ds-btn__face--busy" aria-hidden="true"><span class="ds-spinner ds-spinner--ink ds-sm"></span>Saving</span>' +
    '<span class="ds-btn__face ds-btn__face--done" aria-hidden="true">' + h.icon('check', 16) + 'Saved</span>' +
    '<span class="ds-btn__face ds-btn__face--failed" aria-hidden="true">' + h.icon('alertCircle', 16) + 'Not saved</span></span>';
}

SG.demo('unsaved', {
  title: 'Unsaved-changes guard',
  group: 'forms',
  need: 'Keep a form\'s edits from getting lost: a save bar while something changed, Ctrl+S, a warning before leaving',
  lead: 'Dirty tracking for a form: the save bar shows what changed, Ctrl+S (Command+S) saves, Discard puts the values back, and leaving asks first. The look is the Save bar\'s and Form\'s.',
  options: { sizes: true, density: true, shape: true, tones: false, variants: false },

  render: function (h) {
    var bar = h.uid('unsaved-bar');
    var kind = h.uid('unsaved-kind');
    return h.section('A device', '<div class="ds-view" data-demo="view" style="block-size: 420px; border: 1px solid var(--ds-line); view-transition-name: none; scroll-timeline: none;">' +
        '<div class="ds-content"><div style="display: flex; flex-wrap: wrap; gap: var(--ds-space-2); align-items: center; justify-content: space-between; margin-block-end: var(--ds-space-4);">' +
        '<h3 style="margin: 0; font: var(--ds-font-title);">LAPTOP-0042</h3>' +
        '<button class="ds-btn ds-btn--text" type="button" data-demo="leave">' + h.icon('arrowLeft', 16) + 'Go to devices</button></div>' +
        '<form class="ds-form" data-ds-unsaved data-ds-unsaved-savebar="#' + bar + '" data-demo="form" aria-label="Device">' +
        '<div class="ds-form-grid ds-form-grid--2">' +
        unsavedField(h, 'Device name', '<input class="ds-input" id="{id}" name="name" value="LAPTOP-0042">') +
        unsavedField(h, 'Owner', '<input class="ds-input" id="{id}" name="owner" value="Ada Lovelace" autocomplete="off">') +
        unsavedField(h, 'Room', '<select class="ds-input" id="{id}" name="room"><option>Second floor</option><option>Lab</option><option>Store room</option></select>') +
        unsavedField(h, 'Asset tag', '<input class="ds-input" id="{id}" name="tag" value="A-1093">') +
        '</div><fieldset class="ds-field" aria-labelledby="' + kind + '"><legend class="ds-field__label" id="' + kind + '">Status <span class="ds-field__changed ds-sr">(changed)</span></legend>' +
        '<label class="ds-check"><input type="radio" name="status" value="active" checked><span>Active</span></label>' +
        '<label class="ds-check"><input type="radio" name="status" value="repair"><span>In repair</span></label>' +
        '<label class="ds-check"><input type="radio" name="status" value="retired"><span>Retired</span></label></fieldset>' +
        '<label class="ds-check"><input type="checkbox" name="alerts" checked><span>Send alerts to the owner</span></label>' +
        '</form></div>' +
        '<div class="ds-savebar" id="' + bar + '"><div class="ds-savebar__bar ds-presence" role="region" aria-label="Unsaved changes" hidden>' +
        '<p class="ds-savebar__text" data-ds-unsaved-count></p><div class="ds-savebar__actions">' +
        '<button class="ds-btn ds-btn--text" type="button" data-ds-unsaved-discard>Discard</button>' +
        '<button class="ds-btn ds-btn--filled" type="button" data-ds-unsaved-save>' + unsavedFaces(h) + '</button></div></div></div></div>',
      'Change a field: its label shows a dot, and the bar rises with the count. Change it back and the bar goes. Save, or Ctrl+S (Command+S) from a field, saves; every third save fails, and the changes stay. "Go to devices" asks first while something is unsaved.') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Ctrl</kbd> + <kbd class="ds-kbd">S</kbd> (<kbd class="ds-kbd">⌘</kbd> <kbd class="ds-kbd">S</kbd> on Apple systems) saves from anywhere in the form. <kbd class="ds-kbd">Tab</kbd> reaches the bar\'s buttons after the form. The leave dialog opens on "Keep editing"; <kbd class="ds-kbd">Escape</kbd> keeps editing too.</p>');
  },

  wire: function (root, h) {
    var form = h.$('[data-demo="form"]', root);
    var saves = 0;
    form.addEventListener('ds:save', function (event) {
      saves += 1;
      var fails = saves % 3 === 0;
      event.detail.waitUntil(new Promise(function (resolve, reject) {
        setTimeout(function () { (fails ? reject : resolve)(new Error('The server did not answer.')); }, h.slow(900));
      }));
    });
    form.addEventListener('ds:saved', function () { h.toast('Device saved', 'success'); });
    form.addEventListener('ds:error', function () { h.toast('Not saved: the server did not answer. Try again.', 'error'); });
    form.addEventListener('submit', function (event) { event.preventDefault(); });
    h.$('[data-demo="leave"]', root).addEventListener('click', function (event) {
      DS.unsaved.navigate(function () { h.toast('This is where the device list would open.', 'info'); }, { opener: event.currentTarget });
    });
  },
});
