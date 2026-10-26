/**
 * The feedback parts of 1.4.0 (P6) in real engines: the shape loader and
 * the arc spinner (their loops on the element and on ::before, the arc
 * within its bounds, one delay per waiting block), the skeleton wave (one
 * phase for every bone, after the entrance), linear progress (the cap at a
 * small share, the gliding value, the waiting track that keeps its room,
 * the flat finish, the classic --flat look), the loading bar (its own
 * delay only when it stands alone, the panel edges at any width, the view's
 * hairline giving way), the stale delay, the status colour timing, forced
 * colours and the D8 check; leave() on a loading bar or a skeleton keeps
 * their loops.
 *
 * Curves are read with seek-based samples: a change that starts a
 * transition runs in the same task as the pause (act()), so nothing
 * finishes before it is read. Screenshots run in Chromium only (one
 * baseline set), with every loop paused at a fixed point.
 */
import { test, expect } from './base-test.js';
import {
  ready, settle, sample, timeline, focusByKeyboard,
  series, expectMonotonic, expectWithin,
} from './helpers/motion.js';

const FIXTURES = '/test/browser/fixtures/';

/** Loads a fixture and lets its load-time motion end (loops keep running). */
async function open(page, name = 'feedback.html') {
  await page.goto(FIXTURES + name);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

/**
 * Runs `action(el)` on the element and pauses every animation of the
 * document in the same task. Chromium starts the transition of an SVG
 * glyph (a status icon) only when the glyph's own style is read, so every
 * element of the theme is read first.
 */
function act(locator, action) {
  return locator.evaluate((el, source) => {
    new Function('el', `(${source})(el)`)(el);
    for (const node of document.querySelectorAll('.ds-theme *')) void getComputedStyle(node).opacity;
    for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) animation.pause();
  }, action.toString());
}

/** A duration token of the theme in ms, as the engine resolves it. */
function tokenMs(page, name) {
  return page.evaluate((token) => {
    const probe = document.createElement('span');
    probe.style.transitionDuration = `var(${token})`;
    document.querySelector('.ds-theme').append(probe);
    const value = getComputedStyle(probe).transitionDuration;
    probe.remove();
    return parseFloat(value) * (value.endsWith('ms') ? 1 : 1000);
  }, name);
}

/** A number token of the theme (opacities). */
const tokenNumber = (page, name) => page.evaluate((token) => parseFloat(getComputedStyle(document.querySelector('.ds-theme')).getPropertyValue(token)), name);

/** Pauses every infinite animation at `progress` (0 to 1) of its loop, after its delay, for a screenshot. */
function pauseLoops(page, progress = 0) {
  return page.evaluate((at) => {
    for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) {
      const timing = animation.effect.getComputedTiming();
      if (Number.isFinite(timing.iterations)) continue;
      animation.pause();
      animation.currentTime = (animation.effect.getTiming().delay || 0) + at * Number(timing.duration);
    }
  }, progress);
}

/** Every 10ms from 0 to `end` (inclusive). */
const steps = (end, every = 10) => Array.from({ length: Math.floor(end / every) + 1 }, (_, index) => index * every);

/** Timing only: where each animation is right now differs between two reads. */
const timingOf = (entries) => entries.map(({ currentTime, playState, ...timing }) => timing);

test.describe('loaders', () => {
  test('the shape loader runs ds-loader-morph and ds-loader-turn on ::before over --ds-loop-loader', async ({ page }) => {
    await open(page);
    const loop = await tokenMs(page, '--ds-loop-loader');
    expect(loop).toBe(4550);
    for (const id of ['#loader', '#loader-contained', '#loader-sm', '#boot .ds-loader']) {
      const shape = (await timeline(page.locator(id), { subtree: true })).filter((entry) => entry.pseudoElement === '::before');
      expect(shape.map((entry) => entry.name).sort(), id).toEqual(['ds-loader-morph', 'ds-loader-turn']);
      for (const entry of shape) {
        expect(entry.duration, `${id} ${entry.name}`).toBe(loop);
        expect(entry.iterations, `${id} ${entry.name}`).toBe(Infinity);
      }
      // The turn is linear; every step of the morph lands on the spring (its curve sits on the keyframes).
      expect(shape.find((entry) => entry.name === 'ds-loader-turn').keyframeEasing).toBe('linear');
      expect(shape.find((entry) => entry.name === 'ds-loader-morph').keyframeEasing).not.toBe('linear');
    }
  });

  test('the shape keeps 64 vertices and turns, the loader in a waiting block has no delay of its own', async ({ page }) => {
    await open(page);
    const shapes = await sample(page.locator('#loader'), ['rotate'], [0, 650, 1300, 2275], { pseudo: '::before' });
    const turns = series(shapes, 'rotate');
    expectMonotonic(turns.map((deg) => (deg + 360) % 360), { direction: 'up' });
    const clip = await page.locator('#loader').evaluate((el) => getComputedStyle(el, '::before').clipPath);
    expect(clip.startsWith('polygon(')).toBe(true);
    expect(clip.split(',').length).toBe(64);
    // A loader on its own fades in after --ds-delay-loader; in .ds-boot,
    // .ds-loading and .ds-skeleton the block waits, the loader does not.
    const own = await page.evaluate(() => {
      const read = (el) => ({ name: getComputedStyle(el).animationName, delay: getComputedStyle(el).animationDelay });
      const theme = document.querySelector('.ds-theme');
      theme.insertAdjacentHTML('beforeend', '<div class="ds-skeleton" id="x-skeleton"><span class="ds-loader" aria-hidden="true"></span></div>');
      const out = {
        alone: read(document.querySelector('#loader')),
        boot: read(document.querySelector('#boot .ds-loader')),
        loading: read(document.querySelector('#loading-loader .ds-loader')),
        skeleton: read(document.querySelector('#x-skeleton .ds-loader')),
      };
      document.querySelector('#x-skeleton').remove();
      return out;
    });
    expect(own.alone).toEqual({ name: 'ds-fade-in', delay: '0.2s' });
    for (const key of ['boot', 'loading', 'skeleton']) expect(own[key].name, key).toBe('none');
  });

  test('a new loader shows nothing during --ds-delay-loader, then fades in', async ({ page }) => {
    await open(page);
    const loader = page.locator('#x-loader');
    await act(page.locator('#loaders'), (el) => el.insertAdjacentHTML('beforeend', '<span class="ds-loader" id="x-loader" aria-hidden="true"></span>'));
    const fade = (await timeline(loader)).find((entry) => entry.name === 'ds-fade-in');
    expect(fade.delay).toBe(await tokenMs(page, '--ds-delay-loader'));
    const values = series(await sample(loader, ['opacity'], [0, 50, 100, 150, 199, 450]), 'opacity');
    expect(values.slice(0, 5)).toEqual([0, 0, 0, 0, 0]);
    expect(values.at(-1)).toBe(1);
  });

  test('the spinner runs ds-spinner-arc and ds-spin, its arc within [10deg, 270deg]', async ({ page }) => {
    await open(page);
    for (const id of ['#spinner', '#spinner-sm', '#status-spinner .ds-spinner']) {
      const names = (await timeline(page.locator(id))).map((entry) => entry.name).sort();
      expect(names, id).toEqual(['ds-spin', 'ds-spinner-arc']);
    }
    const loop = await tokenMs(page, '--ds-loop-arc');
    const times = Array.from({ length: 81 }, (_, index) => Math.round((index / 80) * loop));
    const arc = series(await sample(page.locator('#spinner'), ['--ds-spinner-arc'], times), '--ds-spinner-arc');
    expectWithin(arc, 10, 270, { tolerance: 0.01 });
    // It really grows and shrinks.
    expect(Math.max(...arc)).toBeGreaterThan(250);
    expect(Math.min(...arc)).toBeLessThan(20);
  });

  test('the determinate ring never spins and glides its share', async ({ page }) => {
    await open(page);
    const ring = page.locator('#ring');
    expect((await timeline(ring)).filter((entry) => entry.iterations === Infinity)).toEqual([]);
    await act(ring, (el) => el.style.setProperty('--ds-progress', '0.9'));
    const glide = (await timeline(ring)).find((entry) => entry.name === '--ds-progress');
    expect(glide.duration).toBe(await tokenMs(page, '--ds-dur-glide'));
    const values = series(await sample(ring, ['--ds-progress'], steps(600, 30)), '--ds-progress');
    expectMonotonic(values, { direction: 'up' });
    expect(values[0]).toBeCloseTo(0.4, 3);
    expect(values.at(-1)).toBeCloseTo(0.9, 3);
  });
});

test.describe('skeleton', () => {
  test('every bone reads the same --ds-skeleton-x at the same instant, on a fixed band', async ({ page }) => {
    await open(page);
    const reads = await page.evaluate(() => {
      const bones = [document.querySelector('#skeleton .ds-skeleton__line--heading'), document.querySelector('#skeleton .ds-skeleton__card .ds-skeleton__line--short')];
      const wave = document.querySelector('#skeleton').getAnimations().find((animation) => animation.animationName === 'ds-skeleton-wave');
      const cycle = Number(wave.effect.getComputedTiming().duration);
      const delay = wave.effect.getTiming().delay;
      for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) animation.pause();
      return [0.1, 0.3, 0.5].map((share) => {
        wave.currentTime = delay + share * cycle;
        return bones.map((bone) => {
          const style = getComputedStyle(bone);
          // The band (2.0): a fixed ::after on a layer of its own, moved by translate.
          const band = getComputedStyle(bone, '::after');
          return { x: style.getPropertyValue('--ds-skeleton-x').trim(), attachment: band.position, translate: band.translate.split(' ')[0], left: bone.getBoundingClientRect().left, top: bone.getBoundingClientRect().top };
        });
      });
    });
    for (const [a, b] of reads) {
      expect(a.attachment).toBe('fixed');
      expect(b.attachment).toBe('fixed');
      expect(b.x).toBe(a.x);
      expect(b.translate).toBe(a.translate);
      expect(Math.abs(a.left - b.left) + Math.abs(a.top - b.top), 'two bones at different places').toBeGreaterThan(20);
    }
    // The band moves.
    expect(new Set(reads.map(([a]) => a.x)).size).toBe(3);
  });

  test('the wave starts only after the skeleton\'s entrance', async ({ page }) => {
    await open(page);
    await act(page.locator('.ds-theme'), (el) => el.insertAdjacentHTML('beforeend', '<div class="ds-skeleton" id="x-skeleton" role="status"><span class="ds-skeleton__line"></span></div>'));
    const entries = await timeline(page.locator('#x-skeleton'));
    const fade = entries.find((entry) => entry.name === 'ds-fade-in');
    const wave = entries.find((entry) => entry.name === 'ds-skeleton-wave');
    expect(fade.delay).toBe(await tokenMs(page, '--ds-delay-loader'));
    expect(wave.delay).toBeGreaterThanOrEqual(fade.delay + fade.duration);
    expect(wave.iterations).toBe(Infinity);
    expect(wave.duration).toBe(await tokenMs(page, '--ds-loop-skeleton'));
    // The bones run no wave of their own.
    expect(await timeline(page.locator('#x-skeleton .ds-skeleton__line'))).toEqual([]);
  });

  test('leave() keeps the wave where it is; without the wave the band rests off screen', async ({ page }) => {
    await open(page);
    const result = await page.locator('#skeleton').evaluate((el) => {
      const x = () => parseFloat(getComputedStyle(el).getPropertyValue('--ds-skeleton-x'));
      const bone = el.querySelector('.ds-skeleton__line');
      // A fixed point of the sweep, the band on screen (still running).
      const wave = el.getAnimations().find((animation) => animation.animationName === 'ds-skeleton-wave');
      wave.currentTime = wave.effect.getTiming().delay + 0.3 * Number(wave.effect.getComputedTiming().duration);
      const before = { x: x(), position: getComputedStyle(bone).backgroundPositionX };
      DS.motion.leave(el, '', { then: 'keep' });
      const after = { x: x(), position: getComputedStyle(bone).backgroundPositionX };
      const names = el.getAnimations().map((animation) => animation.animationName);
      for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) animation.pause();
      // An entrance (or anything) that replaces the wave: the resting value.
      el.style.animation = 'none';
      const rest = x();
      return { before, after, names, rest, width: innerWidth };
    });
    expect(result.after.x).toBeCloseTo(result.before.x, 0);
    expect(parseFloat(result.after.position)).toBeCloseTo(parseFloat(result.before.position), 0);
    expect(result.before.x).toBeGreaterThan(-result.width);
    expect(result.names).toEqual(expect.arrayContaining(['ds-skeleton-wave', 'ds-fade-out']));
    expect(result.rest).toBeLessThanOrEqual(-result.width);
  });
});

test.describe('progress', () => {
  test('at .05 the bar keeps its round cap (a clip with a round end, never a scale)', async ({ page }, testInfo) => {
    await open(page);
    const bar = page.locator('#progress-05 .ds-progress__bar');
    const style = await bar.evaluate((el) => ({ transform: getComputedStyle(el).transform, clip: getComputedStyle(el).clipPath, scale: getComputedStyle(el).scale }));
    expect(style.transform).toBe('none');
    expect(style.scale).toBe('none');
    expect(style.clip).toMatch(/^inset\(.* round /);
    test.skip(testInfo.project.name !== 'chromium', 'screenshots in Chromium only (one baseline)');
    await pauseLoops(page);
    await expect(page.locator('#progress-05 .ds-progress__track')).toHaveScreenshot('progress-cap-05.png', { animations: 'allow' });
  });

  test('short bars and arcs are flat: the wave cross-fades in between 6% and 11% of the share', async ({ page }) => {
    await open(page);
    const layers = await page.evaluate((shares) => {
      const bar = document.querySelector('#progress-05');
      const ring = document.querySelector('#ring');
      bar.style.transition = 'none';
      ring.style.transition = 'none';
      return shares.map((share) => {
        bar.style.setProperty('--ds-progress', String(share));
        ring.style.setProperty('--ds-progress', String(share));
        void getComputedStyle(bar.querySelector('.ds-progress__bar'), '::before').opacity;
        void getComputedStyle(ring, '::after').opacity;
        // A layer's own opacity transition (a static change) ends at once.
        for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) {
          if (Number.isFinite(animation.effect.getComputedTiming().iterations)) animation.finish();
        }
        const of = (el, pseudo) => Number(getComputedStyle(el, pseudo).opacity);
        const inner = bar.querySelector('.ds-progress__bar');
        return { share, wave: of(inner, '::before'), flat: of(inner, '::after'), ring: of(ring, '::after') };
      });
    }, [0.01, 0.05, 0.085, 0.3]);
    for (const { share, wave, flat, ring } of layers) {
      const expected = Math.min(1, Math.max(0, (share - 0.06) / 0.05));
      expect(wave, `wave at ${share}`).toBeCloseTo(expected, 2);
      expect(flat, `flat fill at ${share}`).toBeCloseTo(1 - expected, 2);
      expect(ring, `wavy arc at ${share}`).toBeCloseTo(expected, 2);
    }
  });

  test('a bar at .01 and .05 looks the same at every phase of the wave, and a ring at .03 shows its flat arc', async ({ page }, testInfo) => {
    await open(page);
    /** Sets the share at once and seeks the wave of every part to `phase` (0 to 1 of its loop). */
    const shoot = async (target, share, phase) => {
      await page.evaluate(({ selector, value, at }) => {
        const el = document.querySelector(selector);
        el.style.transition = 'none';
        el.style.setProperty('--ds-progress', String(value));
        for (const node of document.querySelectorAll('.ds-theme *')) void getComputedStyle(node).opacity;
        for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) {
          const timing = animation.effect.getComputedTiming();
          if (Number.isFinite(timing.iterations)) { animation.finish(); continue; }
          animation.pause();
          animation.currentTime = (animation.effect.getTiming().delay || 0) + at * Number(timing.duration);
        }
      }, { selector: target.selector, value: share, at: phase });
      return page.locator(target.shot).screenshot({ animations: 'allow' });
    };
    /**
     * The largest difference of one colour channel between two shots. A
     * busy machine can rasterise an antialiased edge a few levels apart
     * from one frame to the next, so "the same" allows SAME levels; a
     * travelling wave moves whole crests (checked below with the same bound).
     */
    const SAME = 8;
    const difference = (one, two) => page.evaluate(async (pngs) => {
      const pixels = await Promise.all(pngs.map(async (png) => {
        const image = new Image();
        image.src = `data:image/png;base64,${png}`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context2d = canvas.getContext('2d');
        context2d.drawImage(image, 0, 0);
        return context2d.getImageData(0, 0, image.width, image.height).data;
      }));
      if (pixels[0].length !== pixels[1].length) return Infinity;
      let most = 0;
      for (let index = 0; index < pixels[0].length; index += 1) most = Math.max(most, Math.abs(pixels[0][index] - pixels[1][index]));
      return most;
    }, [one.toString('base64'), two.toString('base64')]);
    const bar = { selector: '#progress-05', shot: '#progress-05 .ds-progress__track' };
    const ring = { selector: '#ring', shot: '#ring' };
    // Crest and trough of the wave at the bar's start, and the two crossings.
    const phases = [0, 0.25, 0.5, 0.75];
    for (const [target, share] of [[bar, 0.01], [bar, 0.05]]) {
      const shots = [];
      for (const phase of phases) shots.push(await shoot(target, share, phase));
      for (const [index, shot] of shots.entries()) expect(await difference(shot, shots[0]), `${target.selector} at ${share}, phase ${phases[index]}`).toBeLessThanOrEqual(SAME);
    }
    // The ring's wave does not travel; its short arc is the flat one.
    await shoot(ring, 0.03, 0);
    expect(await page.locator('#ring').evaluate((el) => Number(getComputedStyle(el, '::after').opacity))).toBe(0);
    // The check can see a travelling wave: at .3 the phases differ.
    const wavy = [await shoot(bar, 0.3, 0), await shoot(bar, 0.3, 0.5)];
    expect(await difference(wavy[0], wavy[1])).toBeGreaterThan(SAME);
    test.skip(testInfo.project.name !== 'chromium', 'screenshots in Chromium only (one baseline)');
    await shoot(bar, 0.01, 0.25);
    await expect(page.locator(bar.shot)).toHaveScreenshot('progress-short-01.png', { animations: 'allow' });
    await shoot(bar, 0.05, 0.75);
    await expect(page.locator(bar.shot)).toHaveScreenshot('progress-short-05.png', { animations: 'allow' });
    await shoot(ring, 0.03, 0);
    await expect(page.locator(ring.shot)).toHaveScreenshot('ring-short-03.png', { animations: 'allow' });
  });

  test('--ds-progress rises monotonically to its new share on --ds-dur-glide', async ({ page }) => {
    await open(page);
    const progress = page.locator('#progress-40');
    await act(progress, (el) => el.style.setProperty('--ds-progress', '0.8'));
    const glide = (await timeline(progress)).find((entry) => entry.name === '--ds-progress');
    expect(glide.duration).toBe(await tokenMs(page, '--ds-dur-glide'));
    const values = series(await sample(progress, ['--ds-progress'], steps(600, 20)), '--ds-progress');
    expectMonotonic(values, { direction: 'up' });
    expect(values[0]).toBeCloseTo(0.4, 3);
    expect(values.at(-1)).toBeCloseTo(0.8, 3);
  });

  test('--waiting keeps the track\'s room: the label stays put when the wait ends, and the track fades in', async ({ page }) => {
    await open(page);
    const progress = page.locator('#progress-queued');
    const label = progress.locator('.ds-progress__label');
    const track = progress.locator('.ds-progress__track');
    const waiting = await track.evaluate((el) => ({ visibility: getComputedStyle(el).visibility, opacity: getComputedStyle(el).opacity, height: el.getBoundingClientRect().height }));
    expect(waiting).toEqual({ visibility: 'hidden', opacity: '0', height: 4 });
    const before = (await label.boundingBox()).y;
    await act(progress, (el) => {
      el.classList.remove('ds-progress--waiting');
      el.style.setProperty('--ds-progress', '0.3');
      const bar = el.querySelector('.ds-progress__track');
      bar.removeAttribute('aria-valuetext');
      bar.setAttribute('aria-valuenow', '30');
    });
    expect((await label.boundingBox()).y).toBe(before);
    const fade = (await timeline(track)).find((entry) => entry.name === 'opacity');
    expect(fade.duration).toBe(await tokenMs(page, '--ds-dur-fast'));
    const values = series(await sample(track, ['opacity'], steps(150, 15)), 'opacity');
    expectMonotonic(values, { direction: 'up' });
    expect(values[0]).toBe(0);
    expect(values.at(-1)).toBe(1);
    expect(await track.evaluate((el) => getComputedStyle(el).visibility)).toBe('visible');
  });

  test('at aria-valuenow="100" the wave fades out and the flat fill fades in', async ({ page }) => {
    await open(page);
    const progress = page.locator('#progress-40');
    const bar = progress.locator('.ds-progress__bar');
    await act(progress, (el) => {
      el.style.setProperty('--ds-progress', '1');
      el.querySelector('.ds-progress__track').setAttribute('aria-valuenow', '100');
    });
    // Both layers in one pass: a seek to the end finishes a transition, and
    // a finished one leaves getAnimations().
    const layers = await bar.evaluate((el, times) => times.map((time) => {
      for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) animation.currentTime = time;
      return { wave: Number(getComputedStyle(el, '::before').opacity), flat: Number(getComputedStyle(el, '::after').opacity) };
    }), steps(250, 25));
    const wave = layers.map((entry) => entry.wave);
    const flat = layers.map((entry) => entry.flat);
    expectMonotonic(wave, { direction: 'down' });
    expectMonotonic(flat, { direction: 'up' });
    expect(wave[0]).toBe(1);
    expect(wave.at(-1)).toBe(0);
    expect(flat[0]).toBe(0);
    expect(flat.at(-1)).toBe(1);
    // The wave stops travelling.
    expect(await bar.evaluate((el) => getComputedStyle(el, '::before').animationPlayState)).toBe('paused');
  });

  test('--flat shows no stop dot, no gap and no wave', async ({ page }) => {
    await open(page);
    const flat = await page.locator('#progress-flat').evaluate((el) => {
      const track = el.querySelector('.ds-progress__track');
      const bar = el.querySelector('.ds-progress__bar');
      return {
        image: getComputedStyle(track).backgroundImage,
        color: getComputedStyle(track).backgroundColor,
        wave: getComputedStyle(bar, '::before').display,
        fill: getComputedStyle(bar, '::after').opacity,
      };
    });
    const accent = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--ds-accent)';
      document.querySelector('.ds-theme').append(probe);
      const value = getComputedStyle(probe).color;
      probe.remove();
      return value;
    });
    expect(flat).toEqual({ image: 'none', color: accent, wave: 'none', fill: '1' });
    // The default look has the gap and the stop dot (background layers of the track).
    const layers = await page.locator('#progress-40 .ds-progress__track').evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(layers.match(/gradient\(/g)).toHaveLength(3);
  });
});

test.describe('loading bar', () => {
  test('a loading bar on its own shows nothing for 150ms; in a skeleton it has no fade of its own', async ({ page }) => {
    await open(page);
    await act(page.locator('.ds-theme'), (el) => el.insertAdjacentHTML('beforeend',
      '<div class="ds-content" id="x-content"><span class="ds-loadbar" id="x-loadbar" aria-hidden="true"><span class="ds-loadbar__bar"></span></span><p>Devices</p></div>'));
    const bar = page.locator('#x-loadbar');
    const names = (await timeline(bar)).map((entry) => entry.name);
    expect(names).toEqual(['ds-fade-in', 'ds-progress-head', 'ds-progress-tail']);
    const values = series(await sample(bar, ['opacity'], [0, 50, 100, 150, 450]), 'opacity');
    expect(values.slice(0, 4)).toEqual([0, 0, 0, 0]);
    expect(values.at(-1)).toBe(1);
    // It reaches the content panel's edges (the read-only padding properties).
    const edges = await page.locator('#x-content').evaluate((content) => {
      const loadbar = content.querySelector('.ds-loadbar').getBoundingClientRect();
      const box = content.getBoundingClientRect();
      return { top: loadbar.top - box.top, left: loadbar.left - box.left, right: box.right - loadbar.right };
    });
    expect(Object.values(edges).map(Math.round)).toEqual([0, 0, 0]);
    // Inside the skeleton only the loops run.
    expect((await timeline(page.locator('#loadbar'))).map((entry) => entry.name)).toEqual(['ds-progress-head', 'ds-progress-tail']);
  });

  for (const width of [1920, 1000, 600]) {
    test(`in a page's skeleton or above its content, the bar spans the panel's edges at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await open(page, 'shell.html');
      const bar = '<span class="ds-loadbar" aria-hidden="true"><span class="ds-loadbar__bar"></span></span>';
      const placements = {
        skeleton: `<div class="ds-skeleton" role="status"><span class="ds-sr">Loading ...</span>${bar}<span class="ds-skeleton__line ds-skeleton__line--heading" aria-hidden="true"></span></div>`,
        refresh: bar,
        content: null,
      };
      for (const [name, markup] of Object.entries(placements)) {
        const edges = await page.locator('#main .ds-content').evaluate((content, [html, inPage]) => {
          const host = inPage ? content.querySelector('.ds-page') : content;
          const holder = document.createElement('div');
          holder.innerHTML = html;
          const node = holder.firstElementChild;
          host.prepend(node);
          const loadbar = (node.matches('.ds-loadbar') ? node : node.querySelector('.ds-loadbar')).getBoundingClientRect();
          const box = content.getBoundingClientRect();
          const view = content.closest('.ds-view');
          const result = { top: loadbar.top - box.top, left: loadbar.left - box.left, right: box.right - loadbar.right, overflow: view.scrollWidth - view.clientWidth };
          node.remove();
          return result;
        }, [markup ?? bar, markup !== null]);
        expect(Object.values(edges).map(Math.round), name).toEqual([0, 0, 0, 0]);
      }
    });
  }

  test('leave() fades the bar out with its segments still moving', async ({ page }) => {
    await open(page);
    await page.locator('.ds-theme').evaluate((el) => el.insertAdjacentHTML('beforeend',
      '<div class="ds-content"><span class="ds-loadbar" id="x-loadbar" aria-hidden="true"><span class="ds-loadbar__bar"></span></span></div>'));
    await settle(page);
    const result = await page.locator('#x-loadbar').evaluate((el) => {
      const clips = () => [getComputedStyle(el.firstElementChild).clipPath, getComputedStyle(el, '::after').clipPath];
      // A fixed point of the loop with both segments on screen (still running).
      for (const animation of el.getAnimations()) if (animation.effect.getComputedTiming().iterations === Infinity) animation.currentTime = 1100;
      const before = clips();
      DS.motion.leave(el, '', { then: 'keep' });
      const after = clips();
      const loops = el.getAnimations().filter((animation) => animation.effect.getComputedTiming().iterations === Infinity);
      const exit = el.getAnimations().find((animation) => animation.animationName === 'ds-fade-out');
      return { before, after, loops: loops.map((animation) => [animation.animationName, animation.playState]), exit: exit && exit.effect.getComputedTiming().iterations };
    });
    expect(result.after).toEqual(result.before);
    expect(result.before[0]).not.toMatch(/inset\(0px 100% 0px 0%/);
    expect(result.loops).toEqual([['ds-progress-head', 'running'], ['ds-progress-tail', 'running']]);
    expect(result.exit).toBe(1);
  });

  test('the view\'s scroll hairline gives way while a loading bar is present', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 800 });
    await open(page, 'shell.html');
    const view = page.locator('#main');
    await view.evaluate((el) => { el.scrollTop = 120; });
    await expect(page.locator('#app')).toHaveAttribute('data-scrolled', '');
    await settle(page);
    const hairline = () => view.evaluate((el) => getComputedStyle(el, '::before').opacity);
    expect(await hairline()).toBe('1');
    await view.evaluate((el) => el.querySelector('.ds-content').insertAdjacentHTML('afterbegin',
      '<span class="ds-loadbar" id="x-loadbar" aria-hidden="true"><span class="ds-loadbar__bar"></span></span>'));
    await settle(page);
    expect(await hairline()).toBe('0');
    await page.locator('#x-loadbar').evaluate((el) => el.remove());
    await settle(page);
    expect(await hairline()).toBe('1');
  });
});

test.describe('stale', () => {
  test('.ds-stale removed after 150ms never dimmed; after 400ms it has dimmed; removal is instant', async ({ page }) => {
    await open(page);
    const stale = page.locator('#stale');
    await act(stale, (el) => el.classList.add('ds-stale'));
    const early = series(await sample(stale, ['opacity'], [0, 50, 100, 150]), 'opacity');
    expect(early).toEqual([1, 1, 1, 1]);
    // Taken off at 150ms (the answer came): nothing ran, nothing runs.
    const removed = await stale.evaluate((el) => {
      el.classList.remove('ds-stale');
      return { opacity: getComputedStyle(el).opacity, running: el.getAnimations().length };
    });
    expect(removed).toEqual({ opacity: '1', running: 0 });
    // A slow answer: dimmed by 400ms.
    await act(stale, (el) => el.classList.add('ds-stale'));
    const [late] = await sample(stale, ['opacity'], [400]);
    expect(late.opacity).toBeCloseTo(await tokenNumber(page, '--ds-state-stale'), 2);
    // And the fresh values show at once.
    const back = await stale.evaluate((el) => {
      el.classList.remove('ds-stale');
      return getComputedStyle(el).opacity;
    });
    expect(back).toBe('1');
  });
});

test.describe('status', () => {
  test('a status change colours the chip and its icon over --ds-dur-medium', async ({ page }) => {
    await open(page);
    const chip = page.locator('#status-live');
    await act(page.locator('#status-toggle'), (el) => el.click());
    const medium = await tokenMs(page, '--ds-dur-medium');
    const container = (await timeline(chip)).filter((entry) => entry.type === 'transition').map((entry) => entry.duration);
    const icon = (await timeline(chip.locator('svg'))).filter((entry) => entry.name === 'color').map((entry) => entry.duration);
    expect(container.length).toBeGreaterThan(0);
    expect(new Set(container)).toEqual(new Set([medium]));
    expect(icon).toEqual([medium]);
  });
});

test.describe('collapsible', () => {
  test('the ring of a button flush with the content edge of an open .ds-collapsible is fully painted', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'screenshots in Chromium only (one baseline); only Chromium clips the content box');
    await open(page, 'motion.html');
    await page.locator('#collapsible summary').click();
    await settle(page);
    const action = page.locator('#collapsible-action');
    await focusByKeyboard(page, action);
    await settle(page);
    const box = await action.boundingBox();
    await expect(page).toHaveScreenshot('collapsible-ring.png', {
      clip: { x: Math.floor(box.x - 8), y: Math.floor(box.y - 8), width: Math.ceil(box.width + 16), height: Math.ceil(box.height + 16) },
    });
  });
});

test.describe('forced colours', () => {
  test('spinner, loader, progress and skeleton in system colours', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'forced colours are emulated in Chromium only (one baseline)');
    await page.emulateMedia({ forcedColors: 'active' });
    await open(page);
    // 15 % into every loop: the spinner arcs are long, the shape is between
    // two steps and the first indeterminate segment is under way.
    await pauseLoops(page, 0.15);
    await expect(page.locator('#spinner').locator('..')).toHaveScreenshot('forced-spinners.png', { animations: 'allow' });
    await expect(page.locator('#loaders')).toHaveScreenshot('forced-loaders.png', { animations: 'allow' });
    for (const id of ['progress-40', 'progress-indeterminate', 'progress-flat', 'skeleton']) {
      await expect(page.locator(`#${id}`)).toHaveScreenshot(`forced-${id}.png`, { animations: 'allow' });
    }
  });
});

test('reduced motion gives the loader, skeleton and progress the same timelines (D8)', async ({ page }) => {
  const collect = async () => {
    await open(page);
    const out = {};
    for (const id of ['loader', 'boot', 'spinner', 'skeleton', 'loadbar', 'progress-indeterminate', 'progress-40', 'ring']) {
      out[id] = timingOf(await timeline(page.locator(`#${id}`), { subtree: true }));
    }
    await act(page.locator('#progress-40'), (el) => el.style.setProperty('--ds-progress', '0.9'));
    out.glide = timingOf(await timeline(page.locator('#progress-40'), { subtree: true }));
    return out;
  };
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const full = await collect();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reduced = await collect();
  expect(full.loader.length).toBeGreaterThan(0);
  expect(full.glide.some((entry) => entry.name === '--ds-progress')).toBe(true);
  expect(reduced).toEqual(full);
});
