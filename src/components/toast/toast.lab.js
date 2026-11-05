/*
 * The Motion Lab entries of the 3.0 snackbar: a waiting message that turns
 * into its outcome in place, a progress message whose bar glides, and a
 * stack that expands on a click and collapses again (the messages glide
 * through DS.motion.flip()). Their own stacking region, at the end of the
 * page's theme, so the lab's other snackbars keep theirs.
 */
var stackRegion = null;

function stackOf() {
  if (stackRegion && stackRegion.isConnected) return stackRegion;
  stackRegion = document.createElement('div');
  stackRegion.className = 'ds-toasts ds-toasts--stack';
  stackRegion.id = 'sg-lab-toast-stack';
  (document.querySelector('.ds-theme') || document.body).append(stackRegion);
  return stackRegion;
}

function wait(sg, ms) {
  return new Promise(function (resolve) { setTimeout(resolve, sg.slow(ms)); });
}

function quietStack() {
  var region = stackOf();
  return DS.toast.closeToasts(region).then(function () { return DS.motion.settled(region, { subtree: true }); });
}

SG_LAB.add({
  id: 'toast-promise',
  group: 'feedback',
  title: 'Waiting and progress snackbars',
  note: 'DS.toast.promise() shows a spinner and the waiting text, then turns into the outcome in place: the icon and the text change, the stack glides to the new height, and the success closes by itself. DS.toast.progress() glides its bar on every set() (--ds-dur-medium) and ends the same way.',
  shows: ['DS.toast.promise', 'DS.toast.progress', '.ds-toast__spinner', '.ds-toast--progress', '--ds-dur-medium', '--ds-ease-spatial'],
  html: '<div class="sg-row"><span class="ds-muted">Two messages at the bottom of the window.</span></div>',
  height: 80,
  reset: function () { return quietStack(); },
  play: function (stage, sg) {
    var region = stackOf();
    var upload = DS.toast.progress(region, 'Uploading 3 files', { value: 0 });
    var saved = DS.toast.promise(region, wait(sg, 900), { pending: 'Saving LAPTOP-0042', success: 'Saved LAPTOP-0042.' });
    return wait(sg, 300)
      .then(function () { upload.set(0.35); return wait(sg, 400); })
      .then(function () { upload.set(0.8, 'Uploading the last file'); return wait(sg, 500); })
      .then(function () { upload.done('3 files uploaded.'); return saved.closed; })
      .then(function () { return DS.motion.settled(region, { subtree: true }); });
  },
});

SG_LAB.add({
  id: 'toast-stack',
  group: 'feedback',
  title: 'A snackbar stack expands on a click',
  note: 'A .ds-toasts--stack region keeps its messages one behind the other, edges showing above the front. A click on a message or focus inside expands it (data-expanded; never hover): the messages glide apart through DS.motion.flip() and their timers pause. A press outside, or focus leaving, collapses it. Rapid toggle reverses the glide from wherever it is.',
  shows: ['.ds-toasts--stack', 'DS.motion.flip', '--ds-dur-medium', '--ds-ease-spatial'],
  html: '<div class="sg-row"><button class="ds-btn ds-btn--tonal" type="button" data-lab-stack>Expand or collapse</button></div>',
  height: 80,
  setup: function (stage) {
    stage.querySelector('[data-lab-stack]').addEventListener('click', function () {
      var region = stackOf();
      var front = region.querySelector('.ds-toast:last-child');
      if (!front) return;
      if (region.hasAttribute('data-expanded')) document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      else front.click();
    });
  },
  reset: function () { return quietStack(); },
  subject: function () { return stackOf(); },
  state: function () { return stackOf().hasAttribute('data-expanded'); },
  play: function (stage, sg) {
    var region = stackOf();
    ['Saved LAPTOP-0042.', 'Saved TABLET-0007.', 'Saved PHONE-0013.'].forEach(function (text) {
      DS.toast.toast(region, text, { persistent: true, restart: false });
    });
    return DS.motion.settled(region, { subtree: true })
      .then(function () { region.querySelector('.ds-toast:last-child').click(); return wait(sg, 50); })
      .then(function () { return DS.motion.settled(region, { subtree: true }); })
      .then(function () { document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); return wait(sg, 50); })
      .then(function () { return DS.motion.settled(region, { subtree: true }); });
  },
  toggle: function (stage, on) {
    var region = stackOf();
    if (region.querySelectorAll('.ds-toast').length < 2) {
      ['Saved LAPTOP-0042.', 'Saved TABLET-0007.'].forEach(function (text) {
        DS.toast.toast(region, text, { persistent: true, restart: false });
      });
    }
    var front = region.querySelector('.ds-toast:last-child');
    if (on) front.click();
    else document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  },
});
