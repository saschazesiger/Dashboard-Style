import { motionDuration } from './motion.js';

export function attach(root) {
  return { root, duration: motionDuration() };
}
