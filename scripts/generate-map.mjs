#!/usr/bin/env node
/**
 * Regenerates PROJECT-MAP.md — the "where does X live?" index.
 *
 * WHY: a cold session's largest cost is not reading the rules, it is finding
 * things. Answering "where do recipe use cases live" with find/grep burns far
 * more context than reading one compact map. This is that map.
 *
 * It is GENERATED because a hand-written map rots the first week. `npm run map`
 * rewrites it and `check:structure` (rule J) fails when it is stale, so it can
 * never quietly drift from the tree it describes.
 *
 * KEEP IT SMALL. The map only pays for itself while it is cheaper to read than
 * to grep — summarise folders, never enumerate every file.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'PROJECT-MAP.md');

const isCode = (n) => /\.tsx?$/.test(n);
const skip = (n) => n === '__tests__' || n === '__fixtures__' || n === '__mocks__';

const countFiles = (dir) => {
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!skip(e.name)) n += countFiles(path.join(dir, e.name));
    } else if (isCode(e.name)) n += 1;
  }
  return n;
};

const subdirs = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !skip(e.name))
    .map((e) => e.name)
    .sort();

const rootFiles = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && isCode(e.name))
    .map((e) => e.name.replace(/\.tsx?$/, ''))
    .sort();

/** `feature/ — capability, capability (n files)` */
const featureLines = (layerDir) => {
  const out = [];
  for (const feature of subdirs(layerDir)) {
    const dir = path.join(layerDir, feature);
    const caps = subdirs(dir);
    const n = countFiles(dir);
    const detail = caps.length > 0 ? ` — ${caps.join(', ')}` : '';
    out.push(`- \`${feature}/\`${detail} _(${String(n)})_`);
  }
  return out;
};

const layer = (name) => path.join(SRC, name);

// ── routes ────────────────────────────────────────────────────────────────
const appDir = path.join(SRC, 'presentation', 'app');
const routes = subdirs(appDir);
const nested = routes.filter((r) => subdirs(path.join(appDir, r)).some((s) => s.startsWith('[')));

// ── theme tokens ──────────────────────────────────────────────────────────
const tokensDir = path.join(SRC, 'presentation', 'base', 'theme', 'tokens');
const tokenGroups = subdirs(tokensDir).map(
  (g) => `  - \`${g}/\` — ${rootFiles(path.join(tokensDir, g)).join(', ')}`,
);

// ── base subsystems ───────────────────────────────────────────────────────
const baseDir = path.join(SRC, 'presentation', 'base');
const BASE_PURPOSE = {
  constants: 'cross-cutting UI values that are not measurements (animation drivers, route paths)',
  errors: 'Failure → user-facing copy/severity lookups',
  feedback: 'toast store, host and helpers',
  forms: 'shared field limits',
  hooks: 'shared hooks, grouped by capability',
  responsive: 'breakpoints, LayoutProvider, viewport metrics',
  taxonomy: 'cuisine/category/difficulty display vocabulary',
  'test-support': 'render harness for component tests',
  theme: 'design tokens, palettes, active-theme context',
  timers: 'timer control helpers',
  utils: 'small pure helpers',
  'web-shell': 'web-only shared UI state (header search query)',
  widgets: 'shared components, grouped by category',
};
const baseLines = subdirs(baseDir).map((d) => {
  const why = BASE_PURPOSE[d] ?? '';
  const kids = subdirs(path.join(baseDir, d));
  const detail = kids.length > 0 ? ` (${kids.join(', ')})` : '';
  return `- \`${d}/\`${detail} — ${why} _(${String(countFiles(path.join(baseDir, d)))})_`;
});

const total = countFiles(SRC);

const body = `# Project map

**GENERATED — do not edit.** Run \`npm run map\` after moving or adding files;
\`npm run check:structure\` fails while this file is stale.

Read this before exploring: it answers "where does X live?" without a grep.
Rules live in [CLAUDE.md](CLAUDE.md); the reasoning behind them in
[architecture.md](architecture.md). ${String(total)} source files.

## Layers

\`core\` → nothing · \`domain\` → core · \`application\` → domain, core ·
\`infrastructure\` → domain, core · \`presentation\` → application, domain, core.
Never upward. Exceptions: \`infrastructure/constants/*\` is importable anywhere;
\`*/di/\` and \`presentation/bootstrap/\` are the composition root.

## Routes — \`src/presentation/app/<segment>/index.tsx\`

${routes.filter((r) => !r.startsWith('[')).map((r) => `\`${r}\``).join(' · ')}

Nested detail pages: ${nested.map((r) => `\`${r}/[…]\``).join(', ') || '—'}.
Each page folder holds \`body/ items/ sheets/ hooks/ model/\` (+ \`shared/\` when
it has a nested page). Only \`index.tsx\`, \`_layout.tsx\`, \`+special\` and
\`[param]\` register as routes.

## \`src/domain/\` — entities, value objects, port interfaces

${featureLines(layer('domain')).join('\n')}

## \`src/application/\` — use cases, stores, DI

${featureLines(layer('application')).join('\n')}

## \`src/infrastructure/\` — repository impls, DTOs, mappers, IO

${featureLines(layer('infrastructure')).join('\n')}

## \`src/core/\` — building blocks only

${featureLines(layer('core')).join('\n')}

No app catalogues here: the DI token list is \`application/di/tokens.ts\`, the
locale list \`application/i18n/locale-constants.ts\`.

## \`src/presentation/base/\` — shared UI

${baseLines.join('\n')}

### Design tokens — \`base/theme/tokens/\`

${tokenGroups.join('\n')}

Consumed through the \`@presentation/base/theme\` barrel. \`colors/\` holds
\`palette/ surfaces/ contrast/\`; \`context/\` holds the active-theme provider.

## Where to put a new thing

| Adding… | Goes in |
|---|---|
| A screen | \`presentation/app/<segment>/index.tsx\` |
| A part of one screen | that page's \`body/ items/ sheets/ hooks/ model/\` |
| A widget two+ pages use | \`presentation/base/widgets/<category>/\` |
| A design measurement | \`presentation/base/theme/tokens/<purpose>/\` |
| A use case | \`application/<feature>/<capability>/\` |
| An entity or port interface | \`domain/<feature>/\` |
| A repository implementation | \`infrastructure/<feature>/\` |
| An API endpoint or storage key | \`infrastructure/constants/\` |
| A structural literal (\`''\`, \`0\`, a shared regex) | \`core/constants/\` |

## Commands

\`npm start\` · \`npm run web|ios|android\` · \`npm run lint\` ·
\`npm run typecheck\` · \`npm test\` · \`npm run check:structure\` ·
\`npm run map\` · \`npm run build:web\`

All four gates must be green before anything is done.
`;

/** Structural fingerprint — every folder and file name under src/. */
export const fingerprint = () => {
  const parts = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        parts.push('d:' + path.relative(SRC, p));
        walk(p);
      } else if (isCode(e.name)) parts.push('f:' + path.relative(SRC, p));
    }
  };
  walk(SRC);
  return crypto.createHash('sha256').update(parts.join('\n')).digest('hex').slice(0, 16);
};

export const render = () => `${body}\n<!-- fingerprint: ${fingerprint()} -->\n`;

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  fs.writeFileSync(OUT, render());
  const lines = render().split('\n').length;
  console.log(`PROJECT-MAP.md — ${String(lines)} lines, ~${String(Math.round(render().length / 4))} tokens`);
}
