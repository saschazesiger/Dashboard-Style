/**
 * Icons (fixture): glyphs as named exports, a GLYPHS map for fill().
 */

export const check = '<path d="M20 6 9 17l-5-5"/>';
export const close = '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>';
export const bell = '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>';
export const info = '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/>';
export const plus = '<path d="M5 12h14"/><path d="M12 5v14"/>';

export const ICON_SIZE = 20;

export function icon(body, size) {
  return '<svg width="' + (size || ICON_SIZE) + '" viewBox="0 0 24 24" aria-hidden="true">' + body + '</svg>';
}

export function iconElement(body, size, className, doc) {
  const svg = (doc || document).createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', String(size || ICON_SIZE));
  if (className) svg.setAttribute('class', className);
  svg.dataset.body = body;
  return svg;
}

const GLYPHS = {
  check, close, bell, info,
  plus
};

export function fill(root) {
  let drawn = 0;
  for (const target of root.querySelectorAll('[data-icon]')) {
    const body = GLYPHS[target.getAttribute('data-icon')];
    if (!body) throw new Error('Unknown icon');
    target.replaceChildren(iconElement(body, 20));
    drawn += 1;
  }
  return drawn;
}
