/**
 * The 3.0 registry model (scripts/build.mjs): every meta.json against its
 * stylesheet, the generated files of the repository (src/index.css,
 * docs/components.md, styleguide/demos.js), dist/manifest.json, the
 * minified stylesheets (parsed again, layers, registrations and curves
 * kept), ds.min.js and its stripper, and the version banners.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import vm from 'node:vm';
import { transform } from 'lightningcss';
import {
  CORE, CSS_TARGETS, LAYERS, META_KEYS, MODULES, build, componentNames, components, componentsMd, cssFacts, diffGenerated, generatedFiles,
  indexCss, moduleRequires, packageInfo, stripJs, sublayerStatement, verifyComponents, verifyModuleRequires, withBanner,
} from '../scripts/build.mjs';
import { scan, selectorList } from '../scripts/tools/css-scan.mjs';
import { filesIn, read, rules, stripComments } from './helpers.js';

const list = components();
const out = build();
const text = (path) => out.get(path).toString('utf8');
const manifest = JSON.parse(text('manifest.json'));

describe('src/components/<name>/', () => {
  it('holds one folder per component, each with its stylesheet and meta.json', () => {
    const names = componentNames();
    assert.ok(names.length >= 39, `${names.length} components`);
    for (const name of names) {
      const files = filesIn(`src/components/${name}`).map((path) => path.slice(path.lastIndexOf('/') + 1));
      assert.ok(files.includes(`${name}.css`) && files.includes('meta.json'), name);
      assert.deepEqual(files.filter((file) => ![`${name}.css`, 'meta.json', `${name}.md`, `${name}.demo.js`].includes(file)), [], `${name}: nothing else`);
    }
    for (const name of CORE) assert.ok(read(`src/core/${name}.css`).includes(LAYERS), name);
  });

  it('keeps every meta.json in step with its stylesheet (verifyComponents)', () => {
    assert.deepEqual(verifyComponents(list), []);
    for (const { name, meta } of list) {
      assert.deepEqual(Object.keys(meta), META_KEYS, `${name}: the keys in order`);
      assert.equal(meta.order % 10, 0, `${name}: order in steps of 10`);
    }
  });

  it('owns every class of ds.css exactly once: a component, or a core stylesheet', () => {
    const owners = new Map();
    for (const [name, entry] of [...Object.entries(manifest.components), ...Object.entries(manifest.pseudo)]) {
      for (const cls of entry.classes) {
        assert.ok(!owners.has(cls), `.${cls}: ${owners.get(cls)} and ${name}`);
        owners.set(cls, name);
      }
    }
    const used = new Set();
    for (const { selector } of rules(read('dist/ds.css'))) for (const match of selector.matchAll(/\.(ds-[\w-]+)/g)) used.add(match[1]);
    assert.deepEqual([...used].filter((cls) => !owners.has(cls)).sort(), []);
  });

  it('fails a meta.json that drifts from its stylesheet, with the reason', () => {
    const tamper = (name, change) => list.map((component) => (component.name === name ? { ...component, meta: change(structuredClone(component.meta)) } : component));
    const cases = [
      [tamper('badge', (meta) => ({ ...meta, classes: meta.classes.filter((cls) => cls !== 'ds-badge--ok') })), /badge\.css styles \.ds-badge--ok, which no meta\.json lists/],
      [tamper('badge', (meta) => ({ ...meta, classes: [...meta.classes, 'ds-badge--new'].sort() })), /lists \.ds-badge--new, which src\/components\/badge\/badge\.css does not style/],
      [tamper('button', (meta) => ({ ...meta, hooks: meta.hooks.slice(1) })), /button\/meta\.json: "hooks" misses --ds-btn/],
      [tamper('dialog', (meta) => ({ ...meta, keyframes: [...meta.keyframes, 'ds-spin'].sort() })), /"keyframes" lists ds-spin/],
      [tamper('chip', (meta) => ({ ...meta, ripple: false })), /chip\/meta\.json: "ripple" is false/],
      [tamper('badge', (meta) => ({ ...meta, context: [] })), /badge\.css styles \.ds-chip of chip: add "chip" to "context"/],
      [tamper('badge', (meta) => ({ ...meta, js: ['nothing'] })), /"js" names nothing/],
      [tamper('badge', (meta) => ({ ...meta, group: 'misc' })), /"group" is one of/],
      [tamper('badge', (meta) => ({ ...meta, order: 10 })), /"order" 10 is also/],
      [tamper('badge', (meta) => ({ ...meta, extra: true })), /unknown keys extra/],
      [tamper('dialog', (meta) => ({ ...meta, progressive: [] })), /"progressive" is \[\], the "Progressive:" note/],
      [tamper('table', (meta) => ({ ...meta, attributes: [] })), /table\/meta\.json: "attributes" misses data-/],
    ];
    for (const [changed, reason] of cases) {
      const problems = verifyComponents(changed);
      assert.ok(problems.some((problem) => reason.test(problem)), `${reason}: ${problems.join(' | ')}`);
    }
  });

  it('reads classes, attributes, hooks and keyframes the way the meta.json fields mean them', () => {
    const facts = cssFacts('@layer ds.components {\n  .ds-a[data-x="1"] .ds-b::before { animation: ds-spin 1s; width: var(--ds-a-w, 1px); }\n}\n@keyframes ds-own { to { opacity: 0; } }\n',
      { hooks: ['--ds-a-w', '--ds-a-h'], keyframes: ['ds-spin', 'ds-fade-in'] });
    assert.deepEqual(facts, { classes: ['ds-a', 'ds-b'], attributes: ['data-x'], hooks: ['--ds-a-w'], keyframes: ['ds-spin'], defines: ['ds-own'] });
  });
});

describe('generated files of the repository', () => {
  it('are up to date (npm run build writes them, --check compares them)', () => {
    assert.deepEqual(diffGenerated(), []);
    assert.deepEqual([...generatedFiles().keys()], ['src/index.css', 'docs/components.md', 'styleguide/demos.js', 'styleguide/registry.js']);
  });

  it('src/index.css: the layer statement, the sublayers and the imports in meta.json "order"', () => {
    const index = read('src/index.css');
    assert.equal(index, indexCss(list));
    const code = stripComments(index).trim().split('\n').filter(Boolean);
    assert.equal(code[0], LAYERS);
    assert.equal(code[1], sublayerStatement(list));
    assert.deepEqual(code[1].slice('@layer '.length, -1).split(', '), list.map(({ name }) => `ds.components.${name}`));
    assert.deepEqual(code.slice(2), [...CORE.map((name) => `@import './core/${name}.css';`), ...list.map(({ name }) => `@import './components/${name}/${name}.css';`)]);
    assert.deepEqual(list.map(({ meta }) => meta.order), [...list.map(({ meta }) => meta.order)].sort((a, b) => a - b));
  });

  it('docs/components.md: the partials around every <name>.md in "docsOrder", byte for byte', () => {
    const docs = read('docs/components.md');
    assert.equal(docs, componentsMd(list));
    assert.ok(docs.startsWith(read('src/components/_partials/intro.md')));
    assert.ok(docs.endsWith(read('src/components/_partials/motion-classes.md') + read('src/components/_partials/attributes.md')));
    let at = 0;
    for (const component of list.filter((entry) => entry.md).sort((a, b) => a.meta.docsOrder - b.meta.docsOrder)) {
      const part = read(component.md);
      assert.match(part, /^## /, `${component.md} starts with its section`);
      const found = docs.indexOf(part, at);
      assert.ok(found >= at, `${component.md} in its place`);
      at = found + part.length;
    }
  });

  it('styleguide/demos.js: every <name>.demo.js registers through SG.demo() of sg-core.js, which both styleguide pages load first', () => {
    const run = (source, context) => vm.runInNewContext(source, context);
    const context = { DS: { icons: {}, overlay: {} } };
    context.globalThis = context;
    assert.throws(() => run(read('styleguide/demos.js'), { ...context, globalThis: {} }), /load styleguide\/sg-core\.js first/);
    run(read('styleguide/sg-core.js'), context);
    run(read('styleguide/demos.js'), context);
    assert.deepEqual([...context.SG.list().map((spec) => spec.name)].sort(), list.filter((entry) => entry.demo).map((entry) => entry.name).sort());
    for (const spec of context.SG.list()) {
      const meta = list.find((entry) => entry.name === spec.name).meta;
      assert.equal(spec.group, meta.group, `${spec.name}: the demo's group is meta.json's`);
      assert.ok(spec.title && spec.need && typeof spec.render === 'function', `${spec.name}: title, need and render`);
    }
    // A demo file is a classic script: its top-level names stay inside its own function.
    assert.equal(context.DAYS, undefined);
    assert.match(read('styleguide/index.html'), /<script src="sg-core\.js"><\/script>\n<script src="registry\.js"><\/script>\n<script src="demos\.js"><\/script>\n<script src="shell\.js"><\/script>/);
    assert.match(read('styleguide/legacy.html'), /<script src="sg-core\.js"><\/script>\n<script src="demos\.js"><\/script>\n<script src="styleguide\.js"><\/script>/);
  });

  it('styleguide/registry.js: every component of meta.json, the tokens of tokens.css and the 2.x need rows', () => {
    const context = {};
    context.globalThis = context;
    vm.runInNewContext(read('styleguide/registry.js'), context);
    const registry = JSON.parse(JSON.stringify(context.SG_REGISTRY)); // out of the vm's realm
    assert.deepEqual(registry.components.map((c) => c.name), list.map((entry) => entry.name));
    for (const c of registry.components) {
      const { meta, demo } = list.find((entry) => entry.name === c.name);
      assert.deepEqual([c.group, c.classes, c.hooks, c.demo], [meta.group, meta.classes, meta.hooks, Boolean(demo)], c.name);
    }
    const tokens = registry.tokens.map(([name]) => name);
    assert.ok(tokens.includes('--ds-primary') && tokens.includes('--ds-space-4'));
    assert.equal(new Set(tokens).size, tokens.length);
    assert.ok(registry.needs.length > 50 && registry.needs.every(([need, name]) => need && list.some((entry) => entry.name === name)));
  });
});

describe('src/core/global.css: the rules for every element of .ds-theme', () => {
  const flat = (css) => scan(css).rules.map((rule) => ({ layer: rule.context[0], key: `${rule.context.join(' ')} | ${rule.selector}`, rule }));

  it('holds every rule of a stylesheet that no class or data-ds-* attribute keys, so every bundle has it', () => {
    for (const { name, css } of list) {
      for (const rule of scan(read(css)).rules) {
        if (rule.context.some((at) => /^@keyframes\b/.test(at))) continue;
        for (const selector of selectorList(rule.selector)) {
          const keyed = [...selector.matchAll(/\.(ds-[\w-]+)/g)].some((match) => !['ds-theme', 'ds-base'].includes(match[1])) || /\[\s*data-ds-/.test(selector);
          assert.ok(keyed, `${css}: ${selector} styles every element of the theme: it belongs in src/core/global.css (${name})`);
        }
      }
    }
  });

  it('keeps the cascade of ds.css: its rules lead ds.components, and its !important declarations have no rival', () => {
    const own = flat(read('src/core/global.css'));
    const all = flat(text('ds.css'));
    const components = all.filter((entry) => entry.layer === '@layer ds.components');
    // First in the layer: where the border-box rule stood in 2.x, at the top of utilities.css, the first component.
    assert.deepEqual(components.slice(0, own.length).map((entry) => entry.key), own.map((entry) => entry.key));
    assert.equal(manifest.order[0], 'utilities');
    // An !important declaration beats every normal one in its layer, so only another !important one of the same
    // property could depend on its place: there is none.
    for (const { rule } of own) {
      for (const declaration of rule.declarations.filter((d) => d.important)) {
        const rivals = all.filter((entry) => !own.some((o) => o.key === entry.key) && entry.rule.declarations.some((d) => d.important && d.property === declaration.property));
        assert.deepEqual(rivals.map((entry) => entry.key), [], `${rule.selector} { ${declaration.property} !important }`);
      }
    }
  });
});

describe('dist/manifest.json', () => {
  it('follows the documented shape', () => {
    const info = packageInfo();
    assert.deepEqual(Object.keys(manifest), ['name', 'version', 'layers', 'sublayers', 'core', 'pseudo', 'order', 'components', 'js']);
    assert.equal(manifest.name, 'dashboard-style');
    assert.equal(manifest.version, info.version);
    assert.equal(manifest.layers, LAYERS);
    assert.equal(manifest.sublayers, sublayerStatement(list));
    assert.ok(text('ds.css').includes(`\n${manifest.sublayers}\n`), 'ds.css declares the same sublayers');
    assert.deepEqual(manifest.core.css, ['css/core/tokens.css', 'css/core/base.css', 'css/core/motion.css', 'css/core/global.css']);
    assert.equal(manifest.core.properties, 'css/properties.css');
    assert.deepEqual(manifest.order, list.map(({ name }) => name));
    assert.deepEqual(Object.keys(manifest.pseudo), CORE);
    assert.ok(manifest.pseudo.tokens.classes.includes('ds-theme') && manifest.pseudo.base.classes.includes('ds-base'));
    assert.ok(manifest.pseudo.motion.keyframes.includes('ds-fade-in'), 'motion defines the keyframes');
    const KEYS = ['css', 'min', 'layer', 'group', 'requires', 'context', 'classes', 'attributes', 'keyframes', 'js', 'hooks', 'ripple', 'progressive', 'bytes', 'gzip'];
    for (const { name, meta } of list) {
      const entry = manifest.components[name];
      assert.deepEqual(Object.keys(entry), KEYS, name);
      assert.equal(entry.css, `css/components/${name}.css`);
      assert.equal(entry.min, `css/components/${name}.min.css`);
      for (const field of ['group', 'requires', 'context', 'classes', 'attributes', 'keyframes', 'js', 'hooks', 'ripple', 'progressive']) assert.deepEqual(entry[field], meta[field], `${name}.${field}`);
      assert.equal(entry.bytes, out.get(entry.min).length, `${name}: bytes of the .min.css`);
      assert.equal(entry.gzip, gzipSync(out.get(entry.min), { level: 9 }).length, `${name}: gzip -9 of the .min.css`);
      for (const path of [entry.css, entry.min]) assert.ok(out.has(path), path);
    }
    for (const path of [...manifest.core.css, ...manifest.core.min, manifest.core.properties]) assert.ok(out.has(path), path);
  });

  it('lists every module of MODULES with its imports and exports', () => {
    assert.deepEqual(Object.keys(manifest.js), MODULES);
    for (const name of MODULES) {
      const source = read(`src/js/${name}.js`);
      const entry = manifest.js[name];
      assert.deepEqual(Object.keys(entry), ['file', 'types', 'imports', 'exports', 'requires', 'exportRequires']);
      assert.ok(out.has(entry.file) && out.has(entry.types), name);
      assert.deepEqual(entry.exports, [...source.matchAll(/^export (?:const|function) ([\w$]+)/gm)].map((match) => match[1]));
      for (const other of entry.imports) assert.ok(MODULES.indexOf(other) < MODULES.indexOf(name), `${name} imports ${other}, an earlier module`);
    }
    assert.deepEqual(manifest.js.dom.imports, ['motion']);
  });

  it('writes the CSS each module needs from data: its own component (meta.json "js" inverted) and src/js/<module>.requires.json', () => {
    assert.deepEqual(verifyModuleRequires(list), []);
    assert.deepEqual(moduleRequires(list), Object.fromEntries(MODULES.map((name) => [name, { requires: manifest.js[name].requires, exportRequires: manifest.js[name].exportRequires }])));
    for (const name of MODULES) {
      const entry = manifest.js[name];
      const own = list.find((component) => component.name === name);
      if (own?.meta.js.includes(name)) assert.ok(entry.requires.includes(name), `${name}: its own stylesheet`);
      for (const [key, needs] of Object.entries(entry.exportRequires)) {
        assert.ok(entry.exports.includes(key), `${name}.${key}: an export`);
        for (const other of needs) assert.ok(other in manifest.components, `${name}.${key} needs ${other}`);
      }
    }
    assert.deepEqual(manifest.js.ripple.requires, ['ripple']);
    assert.deepEqual(manifest.js.indicator.requires, ['indicator']);
    assert.deepEqual(manifest.js.overlay.exportRequires.confirm, ['button', 'dialog', 'spinner']);
    // Every module that writes a .ds-sr live region names utilities for that export.
    assert.ok(manifest.js.overlay.exportRequires.announce.includes('utilities') && manifest.js.motion.exportRequires.sortable.includes('utilities'));
  });
});

describe('minified stylesheets', () => {
  const stylesheets = [...out.keys()].filter((path) => /\.css$/.test(path) && !path.endsWith('.min.css') && /^(ds\.css|css\/)/.test(path) && path !== 'css/index.css');
  const code = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
  const count = (css, pattern) => (code(css).match(pattern) ?? []).length;

  it('sit next to every stylesheet of css/ and ds.css, each with its source map', () => {
    assert.ok(stylesheets.length >= 45, `${stylesheets.length} stylesheets`);
    for (const path of stylesheets) {
      const min = path.replace(/\.css$/, '.min.css');
      assert.ok(out.has(min) && out.has(`${min}.map`), min);
      const name = min.slice(min.lastIndexOf('/') + 1);
      assert.ok(text(min).endsWith(`\n/*# sourceMappingURL=${name}.map */\n`), `${min}: names its map`);
      const map = JSON.parse(text(`${min}.map`));
      assert.equal(map.version, 3);
      assert.equal(map.file, name);
      assert.deepEqual(map.sources, [path.slice(path.lastIndexOf('/') + 1)], `${min}: the unminified file next to it`);
      assert.ok(text(min).length < text(path).length, `${min} is smaller`);
    }
  });

  it('parse again without an error, and keep the layer statements, every layer, @property and linear()', () => {
    const info = packageInfo();
    for (const path of stylesheets) {
      const source = text(path);
      const min = text(path.replace(/\.css$/, '.min.css'));
      const result = transform({ filename: 'min.css', code: Buffer.from(min), minify: false, targets: CSS_TARGETS, errorRecovery: false });
      assert.deepEqual(result.warnings, [], path);
      assert.ok(min.startsWith(withBanner('x.css', '', info)), `${path}: the banner first`);
      const statements = source.split('\n').filter((line) => /^@layer [\w.,\- ]+;$/.test(line));
      assert.deepEqual(min.split('\n').slice(1, 1 + statements.length), [...new Set(statements)], `${path}: the layer statements right after the banner`);
      const layers = (css) => [...new Set(code(css).match(/@layer\s+[\w.-]+\s*\{/g)?.map((match) => match.replace(/\s+/g, '').slice(6, -1)) ?? [])].sort();
      assert.deepEqual(layers(min), layers(source), `${path}: the same layer blocks`);
      for (const pattern of [/@property\s+--[\w-]+/g, /linear\(/g, /@keyframes\s+[\w-]+/g, /@supports/g, /@container/g, /!important/g, /-webkit-[\w-]+/g]) {
        assert.equal(count(min, pattern), count(source, pattern), `${path}: ${pattern}`);
      }
      assert.doesNotMatch(code(min), /&/, `${path}: no nesting`);
    }
  });

  it('keep every @property of ds.css at the top level, with its syntax and inheritance', () => {
    // lightningcss writes the values its own way ('*' as "*", 0px as 0, transparent as #0000): the same registration.
    const blocks = (css) => (code(css).match(/@property\s+--[\w-]+\s*\{[^{}]*\}/g) ?? []).map((block) => {
      const flat = block.replace(/\s+/g, '').replace(/'/g, '"');
      return `${/--[\w-]+/.exec(flat)[0]} ${/syntax:("[^"]*")/.exec(flat)[1]} ${/inherits:(\w+)/.exec(flat)[1]} ${/initial-value:/.test(flat)}`;
    });
    assert.ok(blocks(text('ds.css')).length >= 29);
    assert.deepEqual(blocks(text('ds.min.css')).sort(), blocks(text('ds.css')).sort());
    // Outside every block: nothing precedes them but the statements, and no @property sits inside a layer.
    for (const match of code(text('ds.min.css')).matchAll(/@property/g)) {
      const before = code(text('ds.min.css')).slice(0, match.index);
      assert.equal((before.match(/\{/g) ?? []).length, (before.match(/\}/g) ?? []).length, 'at the top level');
    }
  });
});

describe('ds.min.js and stripJs()', () => {
  it('strips comments and indentation, never strings, template literals or regular expressions', () => {
    const source = [
      '/**',
      ' * A header.',
      ' */',
      'function a(x) {',
      '    // a comment',
      "    const s = 'not // a comment', t = \"nor /* this */\";",
      '    const u = `line one',
      '    // still the template ${x + `inner ${x}`} /* too */',
      '  end`;',
      '    const r = /\\/\\/ [/*] not a comment/g.test(s) ? x / 2 / 3 : 0; /* gone */',
      '    return /[a-z]+\\//i;',
      '}',
      '/*! kept */',
      'a(1) /* spans',
      'lines */ a(2)',
      '',
    ].join('\n');
    assert.equal(stripJs(source), [
      'function a(x) {',
      "const s = 'not // a comment', t = \"nor /* this */\";",
      'const u = `line one',
      '    // still the template ${x + `inner ${x}`} /* too */',
      '  end`;',
      'const r = /\\/\\/ [/*] not a comment/g.test(s) ? x / 2 / 3 : 0;',
      'return /[a-z]+\\//i;',
      '}',
      '/*! kept */',
      'a(1)',
      'a(2)',
      '',
    ].join('\n'));
    assert.throws(() => stripJs('const a = "open'), /unterminated string/);
    assert.throws(() => stripJs('const a = `open'), /unterminated template/);
  });

  it('runs as ds.js does: the same version, modules, exports and output', () => {
    const load = (path) => {
      const context = { console };
      context.globalThis = context;
      vm.runInNewContext(text(path), context);
      return context.DS;
    };
    const full = load('ds.js');
    const min = load('ds.min.js');
    assert.equal(min.version, full.version);
    assert.deepEqual(Object.keys(min), Object.keys(full));
    for (const name of MODULES) assert.deepEqual(Object.keys(min[name]), Object.keys(full[name]), name);
    for (const glyph of Object.keys(full.icons).filter((key) => typeof full.icons[key] === 'string')) assert.equal(min.icons[glyph], full.icons[glyph], glyph);
    assert.equal(min.icons.icon(min.icons.check, 16, 'x'), full.icons.icon(full.icons.check, 16, 'x'));
    assert.ok(text('ds.min.js').length < text('ds.js').length * 0.6, 'at most 60% of ds.js');
    assert.match(text('ds.min.js'), /^\/\*! Dashboard-Style [^\n]*\*\/\n\/\*! Icon shapes: Lucide \(ISC\) and Feather \(MIT\), see LICENSE \*\/\n/);
  });
});

describe('version banners', () => {
  it('head every CSS, JS, MJS, .d.ts and shell file of dist/ (after a #! line); JSON carries the version as data', () => {
    const info = packageInfo();
    const line = withBanner('x.css', '', info);
    for (const [path, content] of out) {
      if (/\.(css|js|mjs|ts)$/.test(path)) {
        const body = content.toString('utf8');
        assert.ok(body.replace(/^#![^\n]*\n/, '').startsWith(line), path);
      } else if (path.endsWith('.sh')) assert.match(content.toString('utf8'), new RegExp(`^#![^\\n]*\\n# Dashboard-Style ${info.version.replace(/[.-]/g, '\\$&')} `), path);
      else if (path.endsWith('.json') && !path.endsWith('.map')) assert.equal(JSON.parse(content.toString('utf8')).version, info.version, path);
    }
    assert.equal(withBanner('a.json', '{}', info), '{}');
    assert.equal(withBanner('a.mjs', '#!/usr/bin/env node\nx\n', info), `#!/usr/bin/env node\n${line}x\n`);
  });
});
