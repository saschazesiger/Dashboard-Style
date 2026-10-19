/**
 * Small CSS helpers shared by the tests (no dependencies, no real parser).
 * Style rules themselves are never nested (a test enforces it), but at-rules
 * are: `@media` inside `@supports`, everything inside `@layer`. The helpers
 * scan by brace depth, so they never assume that a block closes at column 0,
 * and indenting or wrapping a file changes none of their results (the
 * self-tests in helpers.test.js prove it).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const posix = (path) => path.split(sep).join('/');

/** File content with "\n" line ends (a Windows checkout may have CRLF). */
export const read = (path) => readFileSync(join(ROOT, path), 'utf8').replace(/\r\n/g, '\n');

/**
 * Repository-relative paths of all files below `dir` (sorted). `skip` names
 * directories the walk does not enter at all (node_modules, test output), so
 * an installed Playwright never slows the tests down.
 */
export function filesIn(dir, filter = () => true, skip = undefined) {
  return readdirSync(join(ROOT, dir)).sort().flatMap((name) => {
    const path = `${dir}/${name}`;
    if (statSync(join(ROOT, path)).isDirectory()) return skip && skip.test(name) ? [] : filesIn(path, filter, skip);
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

/** An empty block of these (e.g. after withoutAtRuleBlocks) is no style rule. */
const GROUP_AT_RULE = /^@(media|supports|layer|container)\b/;

/** At-rule statements without a block (`@import ...;`, `@layer a, b;`). */
const statements = (css) => css.replace(/@[\w-]+[^{};]*;/g, '');

/**
 * Style rules as { selector, body } (rules inside @media, @supports and
 * @layer blocks included, at any depth). Whitespace in both is collapsed.
 */
export function rules(css) {
  return [...statements(stripComments(css)).matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
    selector: match[1].replace(/\s+/g, ' ').trim(),
    body: match[2].replace(/\s+/g, ' ').trim(),
  })).filter((rule) => !GROUP_AT_RULE.test(rule.selector));
}

/** Declarations of the rules whose selector list contains `selector` exactly. */
export function declarationsOf(css, selector) {
  return rules(css)
    .filter((rule) => rule.selector.split(/\s*,\s*/).includes(selector))
    .flatMap((rule) => declarations(`${rule.body};`));
}

/**
 * Every at-rule block of the (comment-free) source as { start, open, end,
 * prelude }: `start` at the `@`, `open` after its `{`, `end` after its
 * closing `}`, found by brace depth; nested blocks are listed too.
 */
function atRules(source) {
  const found = [];
  for (const match of source.matchAll(/@[\w-]+[^{};]*\{/g)) {
    let depth = 1;
    let end = match.index + match[0].length;
    while (depth > 0 && end < source.length) {
      if (source[end] === '{') depth += 1;
      else if (source[end] === '}') depth -= 1;
      end += 1;
    }
    found.push({ start: match.index, open: match.index + match[0].length, end, prelude: match[0].slice(0, -1).replace(/\s+/g, ' ').trim() });
  }
  return found;
}

/**
 * The body of every `@media`, `@supports` or `@layer` block whose prelude
 * (e.g. "@media (hover: hover)") matches `prelude`, nested ones included.
 */
export function atRuleBlocks(css, prelude) {
  const source = stripComments(css);
  return atRules(source).filter((block) => prelude.test(block.prelude)).map((block) => source.slice(block.open, block.end - 1));
}

/** The source without the blocks atRuleBlocks() would return (prelude and braces included). */
export function withoutAtRuleBlocks(css, prelude) {
  const source = stripComments(css);
  let result = '';
  let from = 0;
  for (const block of atRules(source)) {
    // A block nested in one already removed starts before `from`.
    if (block.start < from || !prelude.test(block.prelude)) continue;
    result += source.slice(from, block.start);
    from = block.end;
  }
  return result + source.slice(from);
}

/** The body of every `@media (forced-colors: active)` block. */
export function forcedColorBlocks(css) {
  return atRuleBlocks(css, /@media\s*\(forced-colors:\s*active\)/);
}

/** Value of a custom property declared in the first `.ds-theme` rule of tokens.css. */
export function token(name) {
  const tokens = stripComments(read('src/tokens.css'));
  const match = tokens.match(new RegExp(`${name}:\\s*([^;]+);`));
  return match ? match[1].trim() : undefined;
}
