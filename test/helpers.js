/**
 * Small CSS helpers shared by the tests (no dependencies, no real parser:
 * the stylesheets are plain, unnested CSS, which a test also enforces).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const posix = (path) => path.split(sep).join('/');

/** File content with "\n" line ends (a Windows checkout may have CRLF). */
export const read = (path) => readFileSync(join(ROOT, path), 'utf8').replace(/\r\n/g, '\n');

/** Repository-relative paths of all files below `dir` (sorted). */
export function filesIn(dir, filter = () => true) {
  return readdirSync(join(ROOT, dir)).sort().flatMap((name) => {
    const path = `${dir}/${name}`;
    if (statSync(join(ROOT, path)).isDirectory()) return filesIn(path, filter);
    return filter(path) ? [path] : [];
  });
}

/** Every stylesheet of src/ in cascade order (the @imports of src/index.css). */
export function cssBundle() {
  return [...stripComments(read('src/index.css')).matchAll(/@import '([^']+)'/g)]
    .map((match) => posix(relative(ROOT, join(ROOT, 'src', match[1]))));
}

export const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** `property: value` pairs (multi-line values joined). */
export function declarations(css) {
  const result = [];
  for (const match of stripComments(css).matchAll(/([-\w]+)\s*:\s*([^;{}]+);/g)) {
    result.push({ property: match[1], value: match[2].replace(/\s+/g, ' ').trim() });
  }
  return result;
}

/** Removes var(...), calc(...) and url(...) so only literal values remain. */
export function literalPart(value) {
  let previous;
  let current = value.replace(/url\("[^"]*"\)/g, '').replace(/url\('[^']*'\)/g, '');
  do {
    previous = current;
    current = current.replace(/var\([^()]*\)/g, '').replace(/calc\([^()]*\)/g, '');
  } while (current !== previous);
  return current;
}

/** Style rules as { selector, body } (rules inside @media and @supports included). */
export function rules(css) {
  return [...stripComments(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
    selector: match[1].replace(/\s+/g, ' ').trim(),
    body: match[2],
  }));
}

/** Declarations of the rules whose selector list contains `selector` exactly. */
export function declarationsOf(css, selector) {
  return rules(css)
    .filter((rule) => rule.selector.split(/\s*,\s*/).includes(selector))
    .flatMap((rule) => declarations(`${rule.body};`));
}

/** The body of every `@media (forced-colors: active)` block. */
export function forcedColorBlocks(css) {
  const source = stripComments(css);
  const blocks = [];
  for (const match of source.matchAll(/@media\s*\(forced-colors:\s*active\)\s*\{/g)) {
    let depth = 1;
    let end = match.index + match[0].length;
    while (depth > 0 && end < source.length) {
      if (source[end] === '{') depth += 1;
      else if (source[end] === '}') depth -= 1;
      end += 1;
    }
    blocks.push(source.slice(match.index + match[0].length, end - 1));
  }
  return blocks;
}

/** Value of a custom property declared in the first `.ds-theme` rule of tokens.css. */
export function token(name) {
  const tokens = stripComments(read('src/tokens.css'));
  const match = tokens.match(new RegExp(`${name}:\\s*([^;]+);`));
  return match ? match[1].trim() : undefined;
}
