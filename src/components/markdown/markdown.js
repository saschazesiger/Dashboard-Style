/**
 * Markdown renderer: a small, safe renderer of a CommonMark subset plus the
 * GFM tables, task lists, strikethrough and autolinks, footnotes and
 * callouts, writing the bare markup .ds-prose styles. No HTML passes
 * through: every character of the source is escaped, and only http, https
 * and mailto links (and relative ones) become links.
 *
 *   DS.markdown.render('# Retire\nBack up **first**.');        '<h1 id="retire">...</h1><p>Back up <strong>first</strong>.</p>'
 *   DS.markdown.render(text, { anchors: true, breaks: true, code: 'block', idPrefix: 'm1-' });
 *   <div class="ds-prose" data-ds-markdown>## Notes ...</div>        rendered by DS.init() from its text
 *   const view = DS.markdown.create(el, { source }); view.set(source + chunk);   a streamed answer, patched in place
 *   DS.markdown.use({ sanitize: (html) => DOMPurify.sanitize(html) });          the page's own sanitiser, everywhere
 *   DS.markdown.use({ renderer: (source) => marked.parse(source), sanitize });  or its own renderer
 *
 * Blocks: ATX and setext headings, paragraphs, block quotes, bullet and
 * ordered lists (tight and loose, a start number, nesting), task list items
 * ([ ] and [x]: a disabled checkbox in a label), fenced and indented code
 * (highlighted by DS.highlight, the info string's first word the
 * language), thematic breaks, GFM tables (alignment as data-align), link
 * reference definitions, footnote definitions ([^id]: text) and callouts
 * (> [!NOTE], [!TIP], [!IMPORTANT], [!WARNING], [!CAUTION]: a
 * .ds-prose__callout in a tone, with its icon and word). Raw HTML is text.
 *
 * Inlines: backslash escapes, entities, code spans, emphasis and strong
 * (* and _, by the CommonMark delimiter rules), ~~strikethrough~~, links
 * and images (inline, full, collapsed and shortcut references), autolinks
 * (<https://...>, <name@example.com>) and the GFM extended ones (www.,
 * http://, https://, an e-mail address), footnote references, hard breaks
 * (two spaces or a backslash before the line end; every line break with
 * `breaks`).
 *
 * Safety: text and attributes are escaped; a link or image whose URL names
 * another scheme (javascript:, data:, vbscript:, file:, ... also hidden by
 * entities, control characters or case) is written as its text; links take
 * rel="noopener" (and target with `target`); images load lazily and only
 * from http, https or a relative URL (`images: false` writes their alt
 * text as a link). A page that needs more passes its own sanitiser
 * (`sanitize(html)`, run on every result) or its own renderer
 * (`renderer(source)`, whose markup the sanitiser then gets), per call or
 * for the page with use().
 *
 * The attribute path: data-ds-markdown renders the element's text (or a
 * <script type="text/markdown"> inside it, which needs no escaping) into
 * the element through DS.dom.morphHtml, so set() patches in place (a
 * streamed answer keeps its nodes); options from data-ds-markdown-anchors,
 * -breaks, -code ("block": code blocks with a header and a copy button) and
 * -images ("off"). Until it renders, markdown.css keeps the source's line
 * breaks, so the text reads without the module.
 *
 * ES2022. Progressive: none.
 */
import { define, emit, runtime, t } from '../../js/core.js';
import { morphHtml } from '../../js/dom.js';
import { alert, alertCircle, check, copy, cornerUpLeft, flag, icon, info, lightbulb, link } from '../../js/icons.js';
import { highlight, language as knownLanguage } from '../highlight/highlight.js';
import { linesHtml } from '../code/code.js';

/** The page's defaults (use()): renderer, sanitize and any render option. */
const shared = runtime.state('markdown', () => ({ defaults: {}, ids: 0 }));

/* ── Text helpers ───────────────────────────────────── */

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const SPECIAL = /[&<>"']/;
/** Text for markup: every &, <, >, " and ' escaped. */
const escape = (text) => (SPECIAL.test(text) ? text.replace(/[&<>"']/g, (char) => ESCAPES[char]) : text);

/** The named entities decoded (a small set; any other stays as written, escaped). */
const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0', copy: '\u00a9', reg: '\u00ae', trade: '\u2122', hellip: '\u2026', mdash: '\u2014', ndash: '\u2013', laquo: '\u00ab', raquo: '\u00bb', larr: '\u2190', rarr: '\u2192', times: '\u00d7', middot: '\u00b7', deg: '\u00b0', euro: '\u20ac',
  // The punctuation a URL could hide a scheme behind.
  colon: ':', Tab: '\t', NewLine: '\n', sol: '/', lpar: '(', rpar: ')', period: '.', comma: ',', excl: '!', quest: '?', num: '#', percnt: '%', ast: '*', plus: '+', equals: '=', semi: ';', bsol: '\\' };
const ENTITY = /&(?:#(\d{1,7})|#[xX]([\da-fA-F]{1,6})|([A-Za-z][A-Za-z\d]{1,31}));/g;

function decodeEntities(text) {
  if (!text.includes('&')) return text;
  return text.replace(ENTITY, (whole, dec, hex, name) => {
    if (name) return Object.hasOwn(NAMED, name) ? NAMED[name] : whole;
    const code = dec ? Number.parseInt(dec, 10) : Number.parseInt(hex, 16);
    return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : '\ufffd';
  });
}

const PUNCTUATION = /[!-/:-@[-`{-~\p{P}\p{S}]/u;
const ESCAPABLE = /[!-/:-@[-`{-~]/;
const isSpace = (char) => char === undefined || /\s/u.test(char);
const isPunct = (char) => char !== undefined && PUNCTUATION.test(char);

/** A label as references compare it: case and runs of white space folded. */
const normalizeLabel = (label) => label.trim().replace(/\s+/g, ' ').toLowerCase();

/** An id from heading text: lower case, words joined by hyphens, punctuation dropped. */
export function slug(text) {
  return String(text ?? '').toLowerCase().trim()
    .replace(/<[^>]*>/g, '')
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '') || 'section';
}

/* ── URLs ───────────────────────────────────────────── */

const DEFAULT_SCHEMES = ['http', 'https', 'mailto'];

/**
 * The URL to write, or null when it names a scheme outside `schemes`. Control
 * characters and white space (which browsers drop from a scheme) and entities
 * are taken out before the scheme is read, so `java&#x09;script:` is caught.
 */
function safeUrl(raw, schemes) {
  const url = decodeEntities(String(raw ?? '').trim());
  const probe = url.replace(/[\u0000-\u0020\u007f-\u009f\u00ad\u200b-\u200f\u2028\u2029\ufeff]/g, '').toLowerCase();
  const scheme = /^([a-z][a-z\d+.-]*):/.exec(probe);
  if (scheme && !schemes.includes(scheme[1])) return null;
  // Spaces and characters a URL cannot hold, percent-encoded (CommonMark's normalisation, roughly).
  return url.replace(/[\s<>"`{}|\\^]/g, (char) => encodeURIComponent(char));
}

const isExternal = (url) => /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(url) && !/^mailto:/i.test(url);

/* ── Inlines ────────────────────────────────────────── */

/**
 * The inline parser: one scan into text, markup and delimiter tokens, the
 * links and images resolved at their closing bracket, then emphasis by the
 * CommonMark delimiter algorithm.
 */
function inline(source, ctx) {
  const text = source;
  /** @type {any[]} */
  const tokens = [];
  const brackets = [];
  let pos = 0;
  let plain = '';
  const flush = () => {
    if (plain) tokens.push({ type: 'text', value: plain });
    plain = '';
  };
  const markup = (html) => {
    flush();
    tokens.push({ type: 'html', value: html });
  };

  while (pos < text.length) {
    const char = text[pos];

    if (char === '\\') {
      const next = text[pos + 1];
      if (next === '\n') {
        markup('<br>\n');
        pos += 2;
        continue;
      }
      if (next !== undefined && ESCAPABLE.test(next)) {
        plain += next;
        pos += 2;
        continue;
      }
      plain += char;
      pos += 1;
      continue;
    }

    if (char === '`') {
      const run = /`+/y;
      run.lastIndex = pos;
      const ticks = run.exec(text)[0];
      const close = findCodeClose(text, pos + ticks.length, ticks.length);
      if (close < 0) {
        plain += ticks;
        pos += ticks.length;
        continue;
      }
      let code = text.slice(pos + ticks.length, close).replace(/\n/g, ' ');
      if (/^ .*[^ ].* $|^ [^ ] $/s.test(code)) code = code.slice(1, -1);
      markup(`<code>${escape(code)}</code>`);
      pos = close + ticks.length;
      continue;
    }

    if (char === '&') {
      ENTITY.lastIndex = pos;
      const match = ENTITY.exec(text);
      if (match && match.index === pos) {
        plain += decodeEntities(match[0]);
        pos += match[0].length;
        continue;
      }
    }

    if (char === '<') {
      const auto = autolinkAt(text, pos, ctx);
      if (auto) {
        markup(auto.html);
        pos += auto.length;
        continue;
      }
    }

    if (char === '\n') {
      // Two spaces (or more) before the break: a hard break. The spaces go either way.
      const hard = / {2,}$/.test(plain) || (!plain && tokens.at(-1)?.type === 'text' && / {2,}$/.test(tokens.at(-1).value));
      plain = plain.replace(/ +$/, '');
      if (!plain && tokens.at(-1)?.type === 'text') tokens.at(-1).value = tokens.at(-1).value.replace(/ +$/, '');
      markup(hard || ctx.options.breaks ? '<br>\n' : '\n');
      pos += 1;
      while (text[pos] === ' ') pos += 1;
      continue;
    }

    // GFM's extended autolinks, before emphasis can split them: at the start of a word.
    if (/[A-Za-z\d]/.test(char) && (pos === 0 || /[\s*_~(]/.test(text[pos - 1]))) {
      const auto = extendedAt(text, pos, ctx, brackets.length > 0);
      if (auto) {
        flush();
        tokens.push({ type: 'autolink', value: auto.text, html: auto.html });
        pos += auto.text.length;
        continue;
      }
    }

    if (char === '*' || char === '_' || char === '~') {
      const run = new RegExp(`\\${char}+`, 'y');
      run.lastIndex = pos;
      const length = run.exec(text)[0].length;
      const before = pos > 0 ? text[pos - 1] : undefined;
      const after = text[pos + length];
      const left = !isSpace(after) && (!isPunct(after) || isSpace(before) || isPunct(before));
      const right = !isSpace(before) && (!isPunct(before) || isSpace(after) || isPunct(after));
      flush();
      let canOpen = left;
      let canClose = right;
      if (char === '_') {
        canOpen = left && (!right || isPunct(before));
        canClose = right && (!left || isPunct(after));
      }
      if (char === '~' && length > 2) canOpen = canClose = false;
      tokens.push({ type: 'delim', char, count: length, length, canOpen, canClose, before: [], after: [], active: true });
      pos += length;
      continue;
    }

    if (char === '!' && text[pos + 1] === '[') {
      flush();
      brackets.push({ index: tokens.length, image: true, start: pos + 2, active: true });
      tokens.push({ type: 'text', value: '![', bracket: true });
      pos += 2;
      continue;
    }

    if (char === '[') {
      // A footnote reference: [^id] with a definition.
      const note = /\[\^([^\]\s]+)\]/y;
      note.lastIndex = pos;
      const found = note.exec(text);
      if (found && ctx.footnotes.has(normalizeLabel(found[1]))) {
        markup(footnoteRef(normalizeLabel(found[1]), ctx));
        pos += found[0].length;
        continue;
      }
      flush();
      brackets.push({ index: tokens.length, image: false, start: pos + 1, active: true });
      tokens.push({ type: 'text', value: '[', bracket: true });
      pos += 1;
      continue;
    }

    if (char === ']') {
      const opener = brackets.pop();
      if (!opener) {
        plain += char;
        pos += 1;
        continue;
      }
      flush();
      if (!opener.active) {
        tokens.push({ type: 'text', value: ']' });
        pos += 1;
        continue;
      }
      const label = text.slice(opener.start, pos);
      const target = linkTarget(text, pos + 1, label, ctx);
      if (!target) {
        tokens.push({ type: 'text', value: ']' });
        pos += 1;
        continue;
      }
      // The tokens between the brackets become the link's content.
      const inner = tokens.splice(opener.index);
      inner.shift();
      emphasis(inner);
      const content = renderTokens(inner, ctx, true);
      tokens.push({ type: 'html', value: opener.image ? imageHtml(target, content, ctx) : linkHtml(target, content, ctx) });
      // No link inside a link: earlier openers become text.
      if (!opener.image) for (const earlier of brackets) if (!earlier.image) earlier.active = false;
      pos = target.end;
      continue;
    }

    plain += char;
    pos += 1;
  }
  flush();
  emphasis(tokens);
  return renderTokens(tokens, ctx, false);
}

/** The end of a code span opened by `count` backticks: a run of exactly that many, or -1. */
function findCodeClose(text, from, count) {
  const run = /`+/g;
  run.lastIndex = from;
  for (let match = run.exec(text); match; match = run.exec(text)) if (match[0].length === count) return match.index;
  return -1;
}

const AUTOLINK_URI = /<([A-Za-z][A-Za-z\d+.-]{1,31}:[^\s<>]*)>/y;
const AUTOLINK_MAIL = /<([A-Za-z\d.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z\d](?:[A-Za-z\d-]{0,61}[A-Za-z\d])?(?:\.[A-Za-z\d](?:[A-Za-z\d-]{0,61}[A-Za-z\d])?)*)>/y;

function autolinkAt(text, pos, ctx) {
  AUTOLINK_URI.lastIndex = pos;
  const uri = AUTOLINK_URI.exec(text);
  if (uri) {
    const href = safeUrl(uri[1], ctx.schemes);
    return { length: uri[0].length, html: href ? anchor(href, escape(uri[1]), null, ctx) : escape(uri[0]) };
  }
  AUTOLINK_MAIL.lastIndex = pos;
  const mail = AUTOLINK_MAIL.exec(text);
  if (mail) return { length: mail[0].length, html: anchor(`mailto:${mail[1]}`, escape(mail[1]), null, ctx) };
  return null;
}

/**
 * What follows a closing bracket: an inline destination `(url "title")`, a
 * full `[ref]`, a collapsed `[]` or a shortcut reference. Returns { href,
 * title, end } or null.
 */
function linkTarget(text, at, label, ctx) {
  if (text[at] === '(') {
    let pos = at + 1;
    const skip = () => {
      while (pos < text.length && /[ \t\n]/.test(text[pos])) pos += 1;
    };
    skip();
    let href = '';
    if (text[pos] === '<') {
      const close = text.indexOf('>', pos);
      const inside = close < 0 ? null : text.slice(pos + 1, close);
      if (inside === null || /[\n<]/.test(inside)) return null;
      href = inside;
      pos = close + 1;
    } else {
      let depth = 0;
      const start = pos;
      while (pos < text.length) {
        const char = text[pos];
        if (char === '\\' && ESCAPABLE.test(text[pos + 1] ?? '')) {
          pos += 2;
          continue;
        }
        if (/\s/.test(char)) break;
        if (char === '(') depth += 1;
        if (char === ')') {
          if (depth === 0) break;
          depth -= 1;
        }
        pos += 1;
      }
      href = text.slice(start, pos).replace(/\\([!-/:-@[-`{-~])/g, '$1');
    }
    const beforeTitle = pos;
    skip();
    let title = null;
    const quote = text[pos];
    if (pos > beforeTitle && (quote === '"' || quote === "'" || quote === '(')) {
      const end = quote === '(' ? ')' : quote;
      let close = pos + 1;
      while (close < text.length && text[close] !== end) close += text[close] === '\\' ? 2 : 1;
      if (close >= text.length) return null;
      title = text.slice(pos + 1, close).replace(/\\([!-/:-@[-`{-~])/g, '$1');
      pos = close + 1;
      skip();
    }
    if (text[pos] !== ')') return null;
    return { href, title, end: pos + 1 };
  }
  // References: [text][label], [label][], [label].
  if (text[at] === '[') {
    const close = text.indexOf(']', at + 1);
    if (close > at) {
      const ref = text.slice(at + 1, close);
      const found = ctx.refs.get(normalizeLabel(ref || label));
      if (found) return { ...found, end: close + 1 };
      if (ref) return null;
    }
  }
  const found = ctx.refs.get(normalizeLabel(label));
  return found ? { ...found, end: at } : null;
}

function anchor(href, content, title, ctx) {
  const attributes = [`href="${escape(href)}"`];
  if (title) attributes.push(`title="${escape(title)}"`);
  if (isExternal(href)) {
    if (ctx.options.target) attributes.push(`target="${escape(ctx.options.target)}"`);
    attributes.push(`rel="${escape(ctx.options.rel ?? (ctx.options.target ? 'noopener noreferrer' : 'noopener'))}"`);
  }
  return `<a ${attributes.join(' ')}>${content}</a>`;
}

function linkHtml(target, content, ctx) {
  const href = safeUrl(target.href, ctx.schemes);
  return href === null ? content : anchor(href, content, target.title, ctx);
}

const IMAGE_SCHEMES = ['http', 'https'];

function imageHtml(target, content, ctx) {
  const alt = content.replace(/<[^>]*>/g, '');
  const src = safeUrl(target.href, IMAGE_SCHEMES);
  if (src === null) return alt;
  if (ctx.options.images === false) return anchor(src, alt || escape(target.href), target.title, ctx);
  const title = target.title ? ` title="${escape(target.title)}"` : '';
  return `<img src="${escape(src)}" alt="${alt}"${title} loading="lazy" decoding="async">`;
}

function footnoteRef(id, ctx) {
  let number = ctx.noteOrder.indexOf(id) + 1;
  if (!number) {
    ctx.noteOrder.push(id);
    number = ctx.noteOrder.length;
  }
  const uses = (ctx.noteUses.get(id) ?? 0) + 1;
  ctx.noteUses.set(id, uses);
  const ref = `${ctx.prefix}fnref-${slug(id)}${uses > 1 ? `-${uses}` : ''}`;
  return `<sup class="ds-prose__fnref"><a href="#${ctx.prefix}fn-${slug(id)}" id="${ref}" aria-describedby="${ctx.prefix}footnotes">${number}</a></sup>`;
}

/**
 * CommonMark's "process emphasis": closers find the nearest opener of the
 * same character (the rule of three for * and _); ~ pairs only runs of the
 * same length (GFM). The tags go onto the delimiter tokens.
 */
function emphasis(tokens) {
  const delims = tokens.filter((token) => token.type === 'delim');
  const bottom = { '*': -1, _: -1, '~': -1 };
  for (let c = 0; c < delims.length; c += 1) {
    const closer = delims[c];
    if (!closer.canClose || !closer.active || !closer.count) continue;
    let found = -1;
    for (let o = c - 1; o > bottom[closer.char]; o -= 1) {
      const opener = delims[o];
      if (!opener.active || !opener.canOpen || opener.char !== closer.char || !opener.count) continue;
      if (closer.char === '~') {
        if (opener.count !== closer.count) continue;
      } else if ((opener.canClose || closer.canOpen) && (opener.length + closer.length) % 3 === 0 && (opener.length % 3 || closer.length % 3)) continue;
      found = o;
      break;
    }
    if (found < 0) {
      bottom[closer.char] = c - 1;
      continue;
    }
    const opener = delims[found];
    const n = closer.char === '~' ? closer.count : opener.count >= 2 && closer.count >= 2 ? 2 : 1;
    const tag = closer.char === '~' ? 'del' : n === 2 ? 'strong' : 'em';
    opener.after.unshift(`<${tag}>`);
    closer.before.push(`</${tag}>`);
    opener.count -= n;
    closer.count -= n;
    for (let between = found + 1; between < c; between += 1) delims[between].active = false;
    if (closer.count) c -= 1;
  }
}

const EXTENDED = /(?:https?:\/\/|www\.)[^\s<]*|[A-Za-z\d._+-]+@[A-Za-z\d_-]+(?:\.[A-Za-z\d_-]+)+/y;

/**
 * A GFM extended autolink at `pos` (www., http://, https://, an e-mail
 * address): trailing punctuation and an unbalanced ) stay outside, and in
 * brackets a ] ends it. Returns
 * { text, html } or null.
 */
function extendedAt(text, pos, ctx, bracketed) {
  EXTENDED.lastIndex = pos;
  const match = EXTENDED.exec(text);
  if (!match) return null;
  // Inside brackets the link's text ends at ]: the autolink does too.
  let url = bracketed ? match[0].split(']')[0] : match[0];
  const mail = !/^(?:https?:\/\/|www\.)/i.test(url);
  if (mail) {
    url = url.replace(/\.+$/, '');
    if (/[-_]$/.test(url) || !/@[^.]+\./.test(url)) return null;
  } else {
    for (;;) {
      let next = url.replace(/[?!.,:*_~'"]+$/, '').replace(/&[A-Za-z\d]+;$/, '');
      if (next.endsWith(')') && (next.match(/\(/g)?.length ?? 0) < (next.match(/\)/g)?.length ?? 0)) next = next.slice(0, -1);
      if (next === url) break;
      url = next;
    }
    if (!/[A-Za-z\d]/.test(url.replace(/^(?:https?:\/\/|www\.)/i, ''))) return null;
  }
  const href = mail ? `mailto:${url}` : /^www\./i.test(url) ? `http://${url}` : url;
  const safe = safeUrl(href, ctx.schemes);
  return safe === null ? null : { text: url, html: anchor(safe, escape(url), null, ctx) };
}

function renderTokens(tokens, ctx, inLink) {
  let out = '';
  for (const token of tokens) {
    if (token.type === 'html') out += token.value;
    else if (token.type === 'text') out += escape(token.value);
    // No link inside a link: an autolink in a link's text is text.
    else if (token.type === 'autolink') out += inLink ? escape(token.value) : token.html;
    else out += token.before.join('') + escape(token.char.repeat(token.count)) + token.after.join('');
  }
  return out;
}

/* ── Blocks ─────────────────────────────────────────── */

const FENCE = /^ {0,3}(`{3,}|~{3,})[ \t]*([^\n]*)$/;
const ATX = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/;
const HR = /^ {0,3}(?:(?:\*[ \t]*){3,}|(?:-[ \t]*){3,}|(?:_[ \t]*){3,})$/;
const SETEXT = /^ {0,3}(=+|-+)[ \t]*$/;
const QUOTE = /^ {0,3}>[ \t]?/;
const BULLET = /^( {0,3})([*+-])(?:([ \t]+)(.*))?$/;
const ORDERED = /^( {0,3})(\d{1,9})([.)])(?:([ \t]+)(.*))?$/;
const TABLE_DELIMITER = /^ {0,3}\|?[ \t]*:?-+:?[ \t]*(?:\|[ \t]*:?-+:?[ \t]*)*\|?[ \t]*$/;
const REFERENCE = /^ {0,3}\[([^\]]+)\]:[ \t]*<?([^\s>]*)>?(?:[ \t]+(?:"([^"]*)"|'([^']*)'|\(([^)]*)\)))?[ \t]*$/;
const FOOTNOTE = /^ {0,3}\[\^([^\]\s]+)\]:[ \t]?(.*)$/;
const CALLOUT = /^\[!(note|tip|important|warning|caution)\][ \t]*$/i;

const isBlank = (line) => /^[ \t]*$/.test(line);
/** Tabs as spaces to the next stop of 4, so indentation can be counted. */
const expandTabs = (line) => (line.includes('\t') ? line.replace(/^[ \t]+/, (lead) => {
  let width = 0;
  for (const char of lead) width = char === '\t' ? width + 4 - (width % 4) : width + 1;
  return ' '.repeat(width);
}) : line);
const indentOf = (line) => /^ */.exec(line)[0].length;

/** Whether a line starts a block that ends a paragraph (no lazy continuation through it). */
function interrupts(line) {
  return FENCE.test(line) || ATX.test(line) || HR.test(line) || QUOTE.test(line)
    || (BULLET.test(line) && BULLET.exec(line)[4]?.trim()) || (ORDERED.test(line) && ORDERED.exec(line)[2] === '1' && ORDERED.exec(line)[5]?.trim());
}

/** The cells of a table row: split at unescaped pipes, the outer ones dropped. */
function cells(line) {
  let row = line.trim();
  if (row.startsWith('|')) row = row.slice(1);
  if (row.endsWith('|') && !row.endsWith('\\|')) row = row.slice(0, -1);
  const out = [''];
  for (let index = 0; index < row.length; index += 1) {
    if (row[index] === '\\' && row[index + 1] === '|') {
      out[out.length - 1] += '|';
      index += 1;
    } else if (row[index] === '|') out.push('');
    else out[out.length - 1] += row[index];
  }
  return out.map((cell) => cell.trim());
}

/**
 * The blocks of `lines` as nodes: { type, ... }. Footnote and link
 * reference definitions go into ctx.
 */
function blocks(lines, ctx) {
  const nodes = [];
  let para = null;
  const close = () => {
    if (para) nodes.push(para);
    para = null;
  };
  let index = 0;
  while (index < lines.length) {
    const line = expandTabs(lines[index]);

    if (isBlank(line)) {
      close();
      index += 1;
      continue;
    }

    // Indented code: four spaces, never in the middle of a paragraph.
    if (!para && indentOf(line) >= 4) {
      const body = [];
      while (index < lines.length && (isBlank(lines[index]) || indentOf(expandTabs(lines[index])) >= 4)) {
        body.push(expandTabs(lines[index]).slice(4));
        index += 1;
      }
      while (body.length && isBlank(body.at(-1))) body.pop();
      nodes.push({ type: 'code', lang: '', text: body.join('\n') });
      continue;
    }

    const fence = FENCE.exec(line);
    if (fence && !(fence[1][0] === '`' && fence[2].includes('`'))) {
      close();
      const marker = fence[1];
      const indent = indentOf(line);
      const body = [];
      index += 1;
      while (index < lines.length) {
        const inner = expandTabs(lines[index]);
        const end = /^ {0,3}(`{3,}|~{3,})[ \t]*$/.exec(inner);
        if (end && end[1][0] === marker[0] && end[1].length >= marker.length) {
          index += 1;
          break;
        }
        body.push(inner.replace(new RegExp(`^ {0,${indent}}`), ''));
        index += 1;
      }
      nodes.push({ type: 'code', lang: decodeEntities(fence[2].trim().split(/\s+/)[0] ?? ''), text: body.join('\n') });
      continue;
    }

    const atx = ATX.exec(line);
    if (atx) {
      close();
      nodes.push({ type: 'heading', level: atx[1].length, text: (atx[2] ?? '').trim() });
      index += 1;
      continue;
    }

    const setext = para && SETEXT.exec(line);
    if (setext) {
      nodes.push({ type: 'heading', level: setext[1][0] === '=' ? 1 : 2, text: para.text });
      para = null;
      index += 1;
      continue;
    }

    if (HR.test(line)) {
      close();
      nodes.push({ type: 'hr' });
      index += 1;
      continue;
    }

    if (QUOTE.test(line)) {
      close();
      const body = [];
      while (index < lines.length) {
        const inner = expandTabs(lines[index]);
        if (QUOTE.test(inner)) body.push(inner.replace(QUOTE, ''));
        else if (!isBlank(inner) && body.length && !isBlank(body.at(-1)) && !interrupts(inner)) body.push(inner);
        else break;
        index += 1;
      }
      const callout = CALLOUT.exec(body[0]?.trim() ?? '');
      nodes.push(callout
        ? { type: 'callout', kind: callout[1].toLowerCase(), children: blocks(body.slice(1), ctx) }
        : { type: 'quote', children: blocks(body, ctx) });
      continue;
    }

    // A table: a header row and a delimiter row with as many cells.
    if (line.includes('|') && index + 1 < lines.length && TABLE_DELIMITER.test(lines[index + 1])) {
      const head = cells(line);
      const align = cells(lines[index + 1]).map((cell) => (cell.startsWith(':') && cell.endsWith(':') ? 'center' : cell.endsWith(':') ? 'end' : cell.startsWith(':') ? 'start' : ''));
      if (head.length === align.length) {
        close();
        const rows = [];
        index += 2;
        while (index < lines.length && !isBlank(lines[index]) && !interrupts(expandTabs(lines[index]))) {
          const row = cells(lines[index]);
          rows.push(head.map((_, column) => row[column] ?? ''));
          index += 1;
        }
        nodes.push({ type: 'table', head, align, rows });
        continue;
      }
    }

    const bullet = BULLET.exec(line);
    const ordered = !bullet && ORDERED.exec(line);
    const item = bullet || ordered;
    // A list may interrupt a paragraph only with content, an ordered one only from 1.
    if (item && (!para || ((bullet ? bullet[4] : ordered[5])?.trim() && (bullet || ordered[2] === '1')))) {
      close();
      const list = listAt(lines, index, ctx);
      nodes.push(list.node);
      index = list.end;
      continue;
    }

    if (!para) {
      const footnote = FOOTNOTE.exec(line);
      if (footnote) {
        const body = [footnote[2]];
        index += 1;
        while (index < lines.length) {
          const inner = expandTabs(lines[index]);
          if (isBlank(inner) ? index + 1 < lines.length && indentOf(expandTabs(lines[index + 1])) >= 4 : indentOf(inner) >= 4) body.push(inner.slice(4));
          else if (!isBlank(inner) && !isBlank(body.at(-1)) && !interrupts(inner) && !FOOTNOTE.test(inner)) body.push(inner);
          else break;
          index += 1;
        }
        const id = normalizeLabel(footnote[1]);
        if (!ctx.footnotes.has(id)) ctx.footnotes.set(id, { id: footnote[1], lines: body });
        continue;
      }
      const reference = REFERENCE.exec(line);
      if (reference && !/^\^/.test(reference[1])) {
        const label = normalizeLabel(reference[1]);
        if (!ctx.refs.has(label)) ctx.refs.set(label, { href: reference[2], title: reference[3] ?? reference[4] ?? reference[5] ?? null });
        index += 1;
        continue;
      }
    }

    const content = line.replace(/^ +/, '');
    if (para) para.text += `\n${content}`;
    else para = { type: 'paragraph', text: content };
    index += 1;
  }
  close();
  return nodes;
}

/** A list from `start`: its items (with their own blocks), tight or loose. */
function listAt(lines, start, ctx) {
  const first = expandTabs(lines[start]);
  const bullet = BULLET.exec(first);
  const ordered = !bullet && ORDERED.exec(first);
  const kind = bullet ? bullet[2] : ordered[3];
  const items = [];
  let index = start;
  let loose = false;
  let blankBetween = false;
  while (index < lines.length) {
    const line = expandTabs(lines[index]);
    const match = bullet ? BULLET.exec(line) : ORDERED.exec(line);
    if (!match || (bullet ? match[2] : match[3]) !== kind || HR.test(line)) break;
    if (blankBetween) loose = true;
    const lead = match[1].length + (bullet ? 1 : match[2].length + 1);
    const gap = (bullet ? match[3] : match[4]) ?? '';
    const rest = (bullet ? match[4] : match[5]) ?? '';
    // Content indent: the marker and its spaces (1 to 4; more is code, counted as 1).
    const width = !rest ? lead + 1 : gap.length > 4 ? lead + 1 : lead + gap.length;
    const body = [rest ? (gap.length > 4 ? ' '.repeat(gap.length - 1) + rest : rest) : ''];
    index += 1;
    let blank = false;
    let lastBlankInside = false;
    while (index < lines.length) {
      const inner = expandTabs(lines[index]);
      if (isBlank(inner)) {
        blank = true;
        body.push('');
        index += 1;
        continue;
      }
      if (indentOf(inner) >= width) {
        if (blank) lastBlankInside = true;
        blank = false;
        body.push(inner.slice(width));
        index += 1;
        continue;
      }
      // Lazy continuation of the item's paragraph.
      if (!blank && !interrupts(inner) && !BULLET.test(inner) && !ORDERED.test(inner) && !isBlank(body.at(-1))) {
        body.push(inner.trim());
        index += 1;
        continue;
      }
      break;
    }
    while (body.length > 1 && isBlank(body.at(-1))) body.pop();
    if (lastBlankInside && body.some((part, at) => at > 0 && isBlank(part))) loose = true;
    blankBetween = blank;
    let task = null;
    const box = /^\[([ xX])\](?:[ \t]+|$)/.exec(body[0]);
    if (box) {
      task = box[1] !== ' ';
      body[0] = body[0].slice(box[0].length);
    }
    items.push({ task, children: blocks(body, ctx) });
  }
  return { node: { type: 'list', ordered: Boolean(ordered), start: ordered ? Number(ordered[2]) : 1, loose, items }, end: index };
}

/* ── Rendering ──────────────────────────────────────── */

const CALLOUTS = {
  note: { tone: 'info', glyph: info, key: 'calloutNote' },
  tip: { tone: 'success', glyph: lightbulb, key: 'calloutTip' },
  important: { tone: 'primary', glyph: flag, key: 'calloutImportant' },
  warning: { tone: 'warning', glyph: alert, key: 'calloutWarning' },
  caution: { tone: 'error', glyph: alertCircle, key: 'calloutCaution' },
};

function headingHtml(node, ctx) {
  const level = Math.min(6, node.level + (ctx.options.headingOffset ?? 0));
  const content = inline(node.text, ctx);
  const plainText = content.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ');
  let id = `${ctx.prefix}${slug(plainText)}`;
  const seen = ctx.slugs.get(id) ?? 0;
  ctx.slugs.set(id, seen + 1);
  if (seen) id = `${id}-${seen}`;
  if (!ctx.options.anchors) return `<h${level} id="${escape(id)}">${content}</h${level}>`;
  return `<h${level} id="${escape(id)}"><a class="ds-prose__anchor" href="#${escape(id)}">${content}${icon(link, 16)}</a></h${level}>`;
}

function codeHtml(node, ctx) {
  const lang = node.lang;
  const known = lang && knownLanguage(lang);
  const body = ctx.options.highlight !== false && lang ? highlight(node.text, lang) : escape(node.text);
  const cls = lang ? ` class="language-${escape(lang.replace(/[^\w+#.-]/g, ''))}"` : '';
  if (ctx.options.code !== 'block') return `<pre><code${cls}>${body}</code></pre>`;
  ctx.codes += 1;
  const id = `${ctx.prefix}code-${ctx.codes}`;
  const label = lang ? `<span class="ds-code__lang">${escape(lang)}</span>` : '';
  const copyLabel = escape(t('copyCode'));
  // The lines as DS.code renders them, so a later render (a streamed answer) patches nothing back.
  return `<figure class="ds-code" data-ds-code${known ? ` data-ds-code-lang="${escape(lang)}"` : ''}>`
    + `<div class="ds-code__head ds-sm">${label}<span class="ds-code__actions">`
    + `<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" data-ds-copy="#${id}" aria-label="${copyLabel}" data-tip="${copyLabel}">`
    + `<span class="ds-icon-swap"><span class="ds-icon-swap__a">${icon(copy, 20)}</span><span class="ds-icon-swap__b">${icon(check, 20)}</span></span></button>`
    + `</span></div><pre class="ds-code-block" tabindex="0"${lang ? ` aria-label="${escape(lang)}"` : ''}><code id="${id}"${cls}>${linesHtml(node.text, { language: ctx.options.highlight !== false && known ? lang : '' })}</code></pre></figure>`;
}

function listHtml(node, ctx) {
  const tag = node.ordered ? 'ol' : 'ul';
  const start = node.ordered && node.start !== 1 ? ` start="${node.start}"` : '';
  const items = node.items.map((item) => {
    let inner = item.children.map((child) => (!node.loose && child.type === 'paragraph' ? inline(child.text, ctx) : blockHtml(child, ctx))).join('\n');
    if (item.task !== null) {
      const box = `<input type="checkbox" disabled${item.task ? ' checked' : ''}>`;
      // The label names the box; a loose item keeps its paragraph around the label.
      const first = item.children[0];
      if (first?.type === 'paragraph') {
        const text = inline(first.text, ctx);
        const rest = item.children.slice(1).map((child) => blockHtml(child, ctx)).join('\n');
        const labelled = `<label>${box} ${text}</label>`;
        inner = (node.loose ? `<p>${labelled}</p>` : labelled) + (rest ? `\n${rest}` : '');
      } else inner = `<label>${box}</label>${inner ? `\n${inner}` : ''}`;
    }
    return `<li>${inner}</li>`;
  }).join('\n');
  return `<${tag}${start}>\n${items}\n</${tag}>`;
}

function tableHtml(node, ctx) {
  const cell = (tag, text, column) => `<${tag}${node.align[column] ? ` data-align="${node.align[column]}"` : ''}>${inline(text, ctx)}</${tag}>`;
  const head = `<thead><tr>${node.head.map((text, column) => cell('th', text, column)).join('')}</tr></thead>`;
  const body = node.rows.length ? `<tbody>${node.rows.map((row) => `<tr>${row.map((text, column) => cell('td', text, column)).join('')}</tr>`).join('')}</tbody>` : '';
  return `<table>${head}${body}</table>`;
}

function blockHtml(node, ctx) {
  switch (node.type) {
    case 'heading': return headingHtml(node, ctx);
    case 'paragraph': return `<p>${inline(node.text, ctx)}</p>`;
    case 'code': return codeHtml(node, ctx);
    case 'hr': return '<hr>';
    case 'quote': return `<blockquote>\n${node.children.map((child) => blockHtml(child, ctx)).join('\n')}\n</blockquote>`;
    case 'callout': {
      const kind = CALLOUTS[node.kind];
      const body = node.children.map((child) => blockHtml(child, ctx)).join('\n');
      return `<div class="ds-prose__callout ds-tone-${kind.tone}" role="note"><p class="ds-prose__callout-title">${icon(kind.glyph, 16)}${escape(t(kind.key))}</p>${body ? `\n${body}` : ''}</div>`;
    }
    case 'list': return listHtml(node, ctx);
    case 'table': return tableHtml(node, ctx);
    default: return '';
  }
}

function footnotesHtml(ctx) {
  if (!ctx.noteOrder.length) return '';
  const items = [];
  // A definition may reference another one; render until no new reference turns up.
  for (let at = 0; at < ctx.noteOrder.length; at += 1) {
    const id = ctx.noteOrder[at];
    const note = ctx.footnotes.get(id);
    const children = blocks(note.lines, ctx);
    const uses = ctx.noteUses.get(id) ?? 1;
    const backs = Array.from({ length: uses }, (_, use) => {
      const ref = `${ctx.prefix}fnref-${slug(id)}${use ? `-${use + 1}` : ''}`;
      return ` <a class="ds-prose__fnback" href="#${ref}" aria-label="${escape(t('footnoteBack', { number: at + 1 }))}">${icon(cornerUpLeft, 16)}</a>`;
    }).join('');
    let html = children.map((child) => blockHtml(child, ctx)).join('\n');
    if (html.endsWith('</p>')) html = `${html.slice(0, -4)}${backs}</p>`;
    else html += `<p>${backs.trim()}</p>`;
    items.push(`<li id="${ctx.prefix}fn-${slug(id)}">${html}</li>`);
  }
  return `<section class="ds-prose__footnotes" aria-labelledby="${ctx.prefix}footnotes"><h2 class="ds-sr" id="${ctx.prefix}footnotes">${escape(t('footnotes'))}</h2>\n<ol>\n${items.join('\n')}\n</ol>\n</section>`;
}

/* ── Public API ─────────────────────────────────────── */

/** The options of a call over the page's defaults (use()). */
const optionsOf = (options) => ({ ...shared.defaults, ...options });

/**
 * Markdown as safe markup for .ds-prose (see the header). Options: anchors
 * (headings link to themselves), breaks (every line break a <br>), code
 * ('block': a code block with a header and a copy button for DS.code),
 * highlight (false: code stays plain), images (false: an image becomes a
 * link), idPrefix (before every id), headingOffset (added to heading
 * levels), schemes (link schemes, default http, https, mailto), target and
 * rel (of external links), renderer and sanitize (the page's own).
 * @param {string} source
 * @param {object} [options]
 * @returns {string}
 */
export function render(source, options = {}) {
  const settings = optionsOf(options);
  const text = String(source ?? '').replace(/\r\n?/g, '\n').replace(/\u0000/g, '\ufffd');
  let html;
  if (typeof settings.renderer === 'function') html = String(settings.renderer(text) ?? '');
  else {
    const ctx = {
      options: settings,
      prefix: String(settings.idPrefix ?? '').replace(/[^\w-]/g, ''),
      schemes: (settings.schemes ?? DEFAULT_SCHEMES).map((scheme) => String(scheme).toLowerCase()),
      refs: new Map(),
      footnotes: new Map(),
      noteOrder: [],
      noteUses: new Map(),
      slugs: new Map(),
      codes: 0,
    };
    const tree = blocks(text.split('\n'), ctx);
    html = tree.map((node) => blockHtml(node, ctx)).join('\n');
    const notes = footnotesHtml(ctx);
    if (notes) html += `\n${notes}`;
  }
  return typeof settings.sanitize === 'function' ? String(settings.sanitize(html) ?? '') : html;
}

/**
 * The page's defaults for every render: { renderer, sanitize } and any
 * option of render(); null clears them. Elements already rendered keep their
 * markup until they render again.
 * @param {object|null} defaults
 */
export function use(defaults) {
  shared.defaults = defaults && typeof defaults === 'object' ? { ...defaults } : {};
}

/** The source an element holds: a <script type="text/markdown"> inside it, else its text, de-indented. */
function sourceOf(el) {
  const script = el.querySelector?.(':scope > script[type="text/markdown"]');
  const raw = String((script ?? el).textContent ?? '').replace(/\r\n?/g, '\n').replace(/^\n+|\s+$/g, '');
  const indents = raw.split('\n').filter((line) => line.trim()).map((line) => /^[ \t]*/.exec(line)[0].length);
  const cut = indents.length ? Math.min(...indents) : 0;
  return cut ? raw.split('\n').map((line) => line.slice(cut)).join('\n') : raw;
}

/** The options an element's attributes give. */
function attributeOptions(el) {
  const options = {};
  if (el.hasAttribute?.('data-ds-markdown-anchors')) options.anchors = true;
  if (el.hasAttribute?.('data-ds-markdown-breaks')) options.breaks = true;
  const code = el.getAttribute?.('data-ds-markdown-code');
  if (code) options.code = code;
  if (el.getAttribute?.('data-ds-markdown-images') === 'off') options.images = false;
  return options;
}

function controller(el, start, signal) {
  let source = start.source;
  let options = start.options;
  const listeners = new Set();
  if (!options.idPrefix) {
    shared.ids += 1;
    options = { ...options, idPrefix: `md${shared.ids}-` };
  }
  const write = () => {
    morphHtml(el, render(source, options));
    if (el.setAttribute) el.setAttribute('data-state', 'rendered');
  };
  write();
  return {
    get() { return source; },
    set(next) {
      const text = String(next ?? '');
      if (text === source) return;
      source = text;
      write();
      if (signal?.aborted) return;
      emit(el, 'change', { source });
      listeners.forEach((fn) => fn({ source }));
    },
    on(type, fn) {
      if (type !== 'change') return () => {};
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    update() {
      options = { ...start.options, ...attributeOptions(el), idPrefix: options.idPrefix };
      write();
    },
    destroy() { listeners.clear(); },
  };
}

define('markdown', {
  attribute: 'data-ds-markdown',
  attributes: ['data-ds-markdown-anchors', 'data-ds-markdown-breaks', 'data-ds-markdown-code', 'data-ds-markdown-images'],
  init(el, ctx) {
    return controller(el, { source: sourceOf(el), options: attributeOptions(el) }, ctx.signal);
  },
});

/**
 * Renders Markdown into an element and keeps it there: the same controller
 * the attribute path makes. `source` (default: the element's text) and any
 * option of render().
 * @param {Element} el
 * @param {{ source?: string } & Record<string, any>} [options]
 */
export function create(el, options = {}) {
  const { source, ...rest } = options;
  return controller(el, { source: source ?? sourceOf(el), options: { ...attributeOptions(el), ...rest } });
}
