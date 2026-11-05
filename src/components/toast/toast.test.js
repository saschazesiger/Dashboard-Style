/**
 * The split of DS.overlay (3.0): js/overlay.js alone names the module a
 * function needs, and works once that module is loaded. Runs in its own process
 * (node --test), so nothing has registered yet when it starts.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as overlay from '../../js/overlay.js';

describe('DS.overlay without its component modules', () => {
  it('says which file each function needs', () => {
    assert.throws(() => overlay.toast(null, 'Saved.'), /DS\.overlay\.toast\(\) needs the toast module: import js\/toast\.js/);
    assert.throws(() => overlay.announce('Saved.'), /js\/toast\.js/);
    assert.throws(() => overlay.closeToasts(), /js\/toast\.js/);
    assert.throws(() => overlay.toastRegion(), /js\/toast\.js/);
    assert.throws(() => overlay.tooltips(), /DS\.overlay\.tooltips\(\) needs the tooltip module: import js\/tooltip\.js/);
    assert.throws(() => overlay.confirm(), /DS\.overlay\.confirm\(\) needs the dialog module: import js\/dialog\.js/);
    assert.throws(() => overlay.alert(), /js\/dialog\.js/);
    assert.throws(() => overlay.prompt(), /js\/dialog\.js/);
  });

  it('keeps every 2.x export, whichever module holds its behaviour', () => {
    for (const name of ['open', 'close', 'topmost', 'lockScroll', 'unlockScroll', 'confirm', 'alert', 'prompt', 'toast', 'toastRegion', 'announce', 'closeToasts', 'tooltips', 'savebar']) {
      assert.equal(typeof overlay[name], 'function', name);
    }
    for (const name of ['TOAST_MS', 'TOAST_MAX_MS', 'TOAST_LIMIT', 'TOOLTIP_DELAY_MS', 'TOOLTIP_SKIP_MS', 'TOOLTIP_HIDE_MS', 'DISMISS_DELAY_MS', 'DRAWER_QUERY']) {
      assert.notEqual(overlay[name], undefined, name);
    }
  });

  it('calls the module once it is loaded', async () => {
    const toast = await import('./toast.js');
    // Without a DOM and without content: the empty handle of toast(), from either door.
    assert.equal(overlay.toast(null, null).el, null);
    assert.equal(toast.toast(null, null).el, null);
    assert.equal(overlay.toastRegion(null), null);
    assert.throws(() => overlay.tooltips(), /js\/tooltip\.js/, 'the others still say so');
  });
});

describe('DS.toast.promise() and progress() without a DOM', () => {
  it('return a handle that does nothing, and leave no unhandled rejection', async () => {
    const toast = await import('./toast.js');
    const waiting = toast.promise(null, Promise.reject(new Error('offline')));
    assert.equal(waiting.el, null);
    await waiting.close();
    const thrown = toast.promise(null, () => { throw new Error('at once'); });
    assert.equal(thrown.el, null);
    const upload = toast.progress(null, 'Uploading');
    assert.equal(upload.el, null);
    for (const name of ['set', 'done', 'fail', 'close']) assert.equal(typeof upload[name], 'function', name);
    upload.set(0.5);
    upload.done();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
});
