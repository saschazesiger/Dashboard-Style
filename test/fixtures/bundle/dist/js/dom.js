import { runtime } from './core.js';

export function morphHtml(element, html) {
  runtime.last = html;
  return element;
}
