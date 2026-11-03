import { runtime } from './core.js';

/** A duration in ms (fixture). */
export function motionDuration() {
  return runtime.overlays.length ? 150 : 150;
}

// Glides nothing in the fixture.
export function flip(element) {
  return element;
}
