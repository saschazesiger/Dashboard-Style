import { flip, motionDuration } from './motion.js';
import { close as closeGlyph, iconElement } from './icons.js';

export function open(element) {
  element.setAttribute('data-state', 'open');
  return flip(element);
}

export function close(element) {
  element.setAttribute('data-state', 'closed');
  return motionDuration();
}

export function toast(region, text) {
  const item = region.ownerDocument.createElement('div');
  item.className = 'ds-toast';
  item.textContent = text;
  item.append(iconElement(closeGlyph, 16));
  region.append(item);
  return item;
}

export function confirm(text) {
  return Promise.resolve(Boolean(text));
}
