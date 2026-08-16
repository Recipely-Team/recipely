#!/usr/bin/env node
/**
 * Structural gate for the Recipely codebase. Enforces:
 *   A. One declaration per file (architecture.md §1) and one hook per file (§8).
 *   B. Layer dependency direction (DDD layered architecture):
 *      core → nothing, domain → core, application → domain/core,
 *      presentation → application/domain/core. Infrastructure is reachable only
 *      from the composition root, `infrastructure/constants/*`, or via DI.
 *   C. Alias-only imports (`@layer/...`); `./` allowed only in barrel index.ts.
 *   D. No loose files at the base/widgets root (category folders only).
 *   E. app/ co-location convention (page code in body/items/sheets/hooks/model/).
 *   F. Smart-UI size guard (CLAUDE.md §18): no non-test .tsx over 300 lines.
 *   G. Entity naming (CLAUDE.md §21): *Entity classes in *-entity.ts files.
 *   H. Responsive sizing (CLAUDE.md §6b): no absolute lineHeight, no bare
 *      <TextInput multiline> outside the AutoGrowTextInput pair.
 *   I. Folder file counts (CLAUDE.md §14c): warn past 10, block past 15.
 *   J. PROJECT-MAP.md freshness (CLAUDE.md §15b).
 *   K. No unguarded console.* in shipped code (CLAUDE.md §22).
 *   L. No hand-rolled bottom sheets (CLAUDE.md §23) — sheets go through the
 *      shared BottomSheet, which presents as a dialog on the web shell.
 *   Q. The custom route context must admit every root `+file` expo-router reads
 *      from it (`+native-intent` carries `redirectSystemPath`).
 *   R. No `removeClippedSubviews` — it re-parents views behind Fabric's back and
 *      crashes the app on the New Architecture (CLAUDE.md §6c).
 *   S. The store hub draws no status bar — a drawn one got 1.0.43 rejected under
 *      App Store guideline 2.3.10 (fastlane/store-hub/README.md).
 *
 * KNOWN_DEBT entries are pre-existing violations tolerated until burned down.
 * Adding a NEW entry to KNOWN_DEBT requires explicit user approval in review.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
// Layer folders live under src/; all paths below (files, KNOWN_DEBT keys,
// reported violations) are relative to SRC so the layer logic stays src-free.
const SRC = path.join(ROOT, 'src');
const LAYERS = ['core', 'domain', 'application', 'infrastructure', 'presentation'];
const errors = [];

/** Pre-existing layer-rule violations. Burn down; never grow. */
const KNOWN_DEBT = new Set([]);

const ALLOWED_IMPORTS = {
  core: ['@core'],
  domain: ['@core', '@domain'],
  application: ['@core', '@domain', '@application'],
  infrastructure: ['@core', '@domain', '@infrastructure'],
  presentation: ['@core', '@domain', '@application', '@presentation'],
};

const files = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(e.name) && !e.name.endsWith('.d.ts')) files.push(path.relative(SRC, p));
  }
};
for (const l of LAYERS) if (fs.existsSync(path.join(SRC, l))) walk(path.join(SRC, l));

const isTest = (f) => /__tests__|\.test\.tsx?$/.test(f);
const isBarrel = (f) => path.basename(f) === 'index.ts';

for (const file of files) {
  const src = fs.readFileSync(path.join(SRC, file), 'utf8');
  const layer = file.split(path.sep)[0];

  // --- B + C: import rules -------------------------------------------------
  const importRe = /from\s+['"]([^'"]+)['"]/g;
  for (const m of src.matchAll(importRe)) {
    const spec = m[1];
    if (spec.startsWith('../')) {
      errors.push(`${file}: relative parent import '${spec}' — use the @layer alias`);
    } else if (spec.startsWith('./') && !isBarrel(file)) {
      errors.push(`${file}: relative import '${spec}' — use the @layer alias`);
    }
    const target = LAYERS.map((l) => `@${l}`).find((a) => spec === a || spec.startsWith(a + '/'));
    if (!target) continue;
    const allowed = ALLOWED_IMPORTS[layer] ?? [];
    if (allowed.includes(target)) continue;
    // Composition-root exception: DI wiring modules assemble across layers.
    if (/^(application|infrastructure)\/di\//.test(file)) continue;
    // Sanctioned exceptions to the layer line:
    if (target === '@infrastructure') {
      if (spec.startsWith('@infrastructure/constants/')) continue; // CLAUDE.md rule 5
      if (file.startsWith('presentation/bootstrap/')) continue; // composition root
      if (isTest(file)) continue; // tests may mock infrastructure modules
      if (KNOWN_DEBT.has(`${file} -> ${spec}`)) continue;
    }
    errors.push(`${file}: layer violation — ${layer} may not import '${spec}'`);
  }

  // --- A: one declaration per file ------------------------------------------
  if (isTest(file) || isBarrel(file)) continue;
  const declRe = /^export\s+(?:default\s+)?(interface|type|class|enum|abstract class|const|function)\s+([A-Za-z0-9_]+)/gm;
  const decls = [...src.matchAll(declRe)].map((m) => ({ kind: m[1].replace('abstract ', ''), name: m[2] }));
  const names = new Set(decls.map((d) => d.name));
  const classes = decls.filter((d) => d.kind === 'class');
  const comps = file.endsWith('.tsx')
    ? decls.filter(
        (d) =>
          (d.kind === 'const' || d.kind === 'function') &&
          /^[A-Z]/.test(d.name) &&
          !/^[A-Z0-9_]+$/.test(d.name) &&
          // React context objects (`const XContext = createContext(...)`) are not components.
          !new RegExp(`const\\s+${d.name}\\s*(:[^=]+)?=\\s*createContext`).test(src),
      )
    : [];
  const hooks = decls.filter((d) => (d.kind === 'const' || d.kind === 'function') && /^use[A-Z]/.test(d.name));

  let typeLike = decls.filter((d) => d.kind === 'interface' || d.kind === 'type' || d.kind === 'enum');
  // Exception: ComponentNameProps alongside exactly one component.
  if (comps.length === 1) typeLike = typeLike.filter((d) => d.name !== `${comps[0].name}Props`);
  // Exception: helper types alongside a class (architecture.md §1, exception 3).
  if (classes.length >= 1) typeLike = [];
  // Exception: same-name const+type merge, and unions derived via `typeof <local const>`.
  typeLike = typeLike.filter((d) => {
    if (d.kind !== 'type') return true;
    const body = new RegExp(`^export\\s+type\\s+${d.name}\\b[^=]*=([\\s\\S]*?)(;|$)`, 'm').exec(src)?.[1] ?? '';
    const derived = [...body.matchAll(/typeof\s+([A-Za-z0-9_]+)/g)].some((t) => names.has(t[1]));
    const merged = decls.some((o) => o !== d && o.kind === 'const' && o.name === d.name);
    return !derived && !merged;
  });

  const primaryCount = typeLike.length + classes.length + Math.max(comps.length, 0);
  if (primaryCount > 1) {
    errors.push(`${file}: one-declaration-per-file violation — ${[...typeLike, ...classes, ...comps].map((d) => `${d.kind} ${d.name}`).join(', ')}`);
  }
  if (hooks.length > 1) {
    errors.push(`${file}: one-hook-per-file violation — ${hooks.map((h) => h.name).join(', ')}`);
  }
  if (hooks.length >= 1 && comps.length >= 1) {
    errors.push(`${file}: hook and component share a file — extract ${hooks.map((h) => h.name).join(', ')}`);
  }
  if (typeLike.length >= 1 && (hooks.length >= 1 || (classes.length === 0 && decls.some((d) => (d.kind === 'const' || d.kind === 'function') && !typeLike.includes(d) && !comps.includes(d) && !/^[A-Z0-9_]+$/.test(d.name))))) {
    errors.push(`${file}: type/interface shares a file with runtime code — move ${typeLike.map((d) => `${d.kind} ${d.name}`).join(', ')} to its own file`);
  }

  // --- G: entity naming (CLAUDE.md §21) -------------------------------------
  // A class extending BaseEntity must be named `*Entity` and live in a
  // `*-entity.ts` file, so entities are recognizable by name and file alike.
  const entityRe = /export\s+(?:default\s+)?(?:abstract\s+)?class\s+([A-Za-z0-9_]+)\s+extends\s+BaseEntity\b/g;
  for (const m of src.matchAll(entityRe)) {
    const name = m[1];
    const base = path.basename(file).replace(/\.tsx?$/, '');
    if (!name.endsWith('Entity')) {
      errors.push(`${file}: '${name}' extends BaseEntity but is not named '*Entity' (CLAUDE.md §21)`);
    }
    if (!base.endsWith('-entity')) {
      errors.push(`${file}: entity '${name}' must live in a '*-entity.ts' file (CLAUDE.md §21)`);
    }
  }

  // --- H: responsive sizing guard (CLAUDE.md §6b) ---------------------------
  // The two sizing mistakes that silently break at a large OS font scale or on
  // the web build, both invisible in a normal simulator run.
  if (file.startsWith('presentation' + path.sep) && !isTest(file)) {
    // React Native scales `fontSize` by the system font setting but never
    // `lineHeight`, so an absolute line box clips its own glyphs at large
    // accessibility sizes. Derive it instead.
    for (const m of src.matchAll(/^\s*lineHeight: (-?\d+(?:\.\d+)?)\b/gm)) {
      errors.push(
        `${file}: absolute lineHeight ${m[1]} — derive it with lineHeightFor() / useTextLineHeight() (CLAUDE.md §6b)`,
      );
    }
    // react-native-web renders `multiline` as a real <textarea>, which does not
    // grow with its content — it keeps its box and shows a scrollbar.
    const isAutoGrowWidget = path.basename(file).startsWith('auto-grow-text-input');
    if (!isAutoGrowWidget && /^\s*multiline\b/m.test(src)) {
      errors.push(
        `${file}: bare <TextInput multiline> — use AutoGrowTextInput from base/widgets/inputs (CLAUDE.md §6b)`,
      );
    }
  }

  // --- F: Smart-UI size guard (CLAUDE.md §18) --------------------------------
  // A .tsx over 300 lines is a blocking violation: split it into body/items/
  // sheets/hooks/model parts (or a hook) instead of growing the component.
  if (file.endsWith('.tsx')) {
    const lines = src.split('\n').length;
    if (lines > 300) {
      errors.push(`${file}: ${lines} lines — .tsx files must stay under 300 lines (CLAUDE.md §18); split into parts`);
    }
  }

  // --- D: widgets root must stay categorized --------------------------------
  if (/^presentation\/base\/widgets\/[^/]+\.(ts|tsx)$/.test(file)) {
    errors.push(`${file}: loose file at base/widgets root — place it in a category folder`);
  }

  // --- E: app/ co-location convention ----------------------------------------
  // The custom route context (presentation/navigation/route-context.js) only
  // registers index/_layout/+special/[param] files, so a flat app/<page>.tsx
  // would silently NOT become a route. Co-located page code must live in the
  // convention subfolders so tooling (web-export prune) can recognize it.
  if (file.startsWith('presentation/app/')) {
    const rel = file.slice('presentation/app/'.length);
    const base = path.basename(rel).replace(/\.(ts|tsx)$/, '');
    const isRouteFile = /^(index|_layout|\+[\w-]+|\[[^/\]]+\])(\.(android|ios|native|web))?$/.test(base) && rel.endsWith('.tsx');
    const inConventionFolder = /(^|\/)(body|items|sheets|hooks|model|shared|__tests__)\//.test(rel);
    // An index/_layout file INSIDE a convention folder would still match the
    // route-context regex and silently register as a route — never allow it.
    if (inConventionFolder && /^(index|_layout|\+|\[)/.test(base)) {
      errors.push(`${file}: route-shaped filename inside a co-location folder would register as a route — rename it`);
    }
    if (!isRouteFile && !inConventionFolder) {
      errors.push(
        rel.includes('/')
          ? `${file}: co-located page code must live in body/, items/, sheets/, hooks/, model/, shared/, or __tests__/`
          : `${file}: flat file at the app root will not register as a route — use app/<segment>/index.tsx`,
      );
    }
  }
}

// --- I: folder file-count guard (CLAUDE.md §14c) ----------------------------
// A folder is a unit of meaning, not a bucket. Past ~10 sibling files nobody
// reads the folder any more, they grep it — and that is exactly how the old
// 46-file `base/theme/` and the 90-key `sizes` object happened.
//
// Two tiers on purpose. The soft limit is guidance for review, because some
// flat lists are FORCED by another rule (rule 1 puts one Failure subclass per
// file) and whether a split helps is a judgement about meaning, not something a
// file count can make. The hard limit is where a folder has stopped being
// scannable no matter what is in it.
const SOFT_FILE_LIMIT = 10;
const HARD_FILE_LIMIT = 15;
// Test and fixture folders mirror the shape of the code they cover; splitting
// them independently would only decouple them from that shape.
const COUNT_EXEMPT = /(^|\/)(__tests__|__fixtures__|__mocks__)(\/|$)/;

const folderCounts = new Map();
for (const file of files) {
  const dir = path.dirname(file);
  if (COUNT_EXEMPT.test(dir)) continue;
  folderCounts.set(dir, (folderCounts.get(dir) ?? 0) + 1);
}
const crowded = [];
for (const [dir, count] of folderCounts) {
  if (count > HARD_FILE_LIMIT) {
    errors.push(
      `${dir}/: ${String(count)} files — over the ${String(HARD_FILE_LIMIT)}-file hard limit (CLAUDE.md §14c); group the related ones into subfolders`,
    );
  } else if (count > SOFT_FILE_LIMIT) {
    crowded.push(`${dir}/ (${String(count)})`);
  }
}
if (crowded.length > 0 && process.env.CI !== 'true') {
  console.warn(
    `check:structure — ${String(crowded.length)} folder(s) past the ${String(SOFT_FILE_LIMIT)}-file soft limit; look for a grouping before adding another:\n` +
      crowded.sort().map((c) => '  · ' + c).join('\n'),
  );
}

// --- K: no unguarded console.* in shipped code (CLAUDE.md §22) --------------
// Two problems with an unguarded call. In a dev build `console.error` /
// `console.warn` raise a LogBox panel over the running app, which is how a
// batch of leftover favorites tracing ended up looking like a production
// crash to the user. In a RELEASE build the call still executes — it just
// writes to logcat / Console.app instead — so anything passed to it leaks,
// and those calls were logging user ids and saved-recipe ids.
//
// The guard must be lexically visible: `__DEV__` on the same line, or an
// enclosing `if (__DEV__)` / `if (enableLogging)` opened within the previous
// two non-comment lines. That is a heuristic, not a parser — deliberately, so
// the rule stays readable. Nest deeper than that and you must repeat the
// guard on the call's own line.
{
  const GUARD = /__DEV__|enableLogging/;
  const isComment = (line) => /^\s*(\/\/|\/\*|\*)/.test(line);

  for (const file of files) {
    if (isTest(file)) continue;
    const lines = fs.readFileSync(path.join(SRC, file), 'utf8').split('\n');

    lines.forEach((line, i) => {
      if (isComment(line) || !/\bconsole\.(log|warn|error|info|debug)\s*\(/.test(line)) return;
      if (GUARD.test(line)) return;
      // Nearest two preceding lines that are not comments/blank.
      const preceding = [];
      for (let j = i - 1; j >= 0 && preceding.length < 2; j--) {
        if (lines[j].trim() === '' || isComment(lines[j])) continue;
        preceding.push(lines[j]);
      }
      if (preceding.some((p) => GUARD.test(p))) return;
      errors.push(
        `${file}:${String(i + 1)}: unguarded console.* — wrap it in \`if (__DEV__)\` or delete it (CLAUDE.md §22)`,
      );
    });
  }
}

// --- L: sheets come from the shared widget (CLAUDE.md §23) -----------------
// A bottom sheet is a touch idiom: on a desktop browser a panel glued to the
// bottom edge has nothing to reach for it, and its grabber promises a drag a
// mouse never performs. `base/widgets/sheets/bottom-sheet.tsx` is the one
// place that knows to present as a centred dialog on the web shell, so a
// hand-rolled `Modal` that slides up from the bottom bypasses the rule for
// every screen that copies it. Detected by the two things such a modal always
// carries: a slide animation, or a top-only corner radius on its panel.
{
  const SHEET_WIDGET = 'presentation/base/widgets/sheets/';

  for (const file of files) {
    if (isTest(file) || file.includes(SHEET_WIDGET)) continue;
    const src = fs.readFileSync(path.join(SRC, file), 'utf8');
    if (!/<Modal[\s>]/.test(src)) continue;
    const slides = /animationType=["']slide["']/.test(src);
    const topOnlyRadius = /borderTopLeftRadius:/.test(src);
    if (!slides && !topOnlyRadius) continue;
    errors.push(
      `${file}: hand-rolled bottom sheet — render it through @presentation/base/widgets/sheets/bottom-sheet (CLAUDE.md §23)`,
    );
  }
}

// --- M: every Modal is status-bar translucent (CLAUDE.md §23b) --------------
// `edgeToEdgeEnabled` is on, and without this prop Android re-lays-out the
// window around the status bar as a modal opens — the screen underneath jumps
// by the inset height and back. It cost a "the layout shifts when I leave a
// draft" report: the exit dialog was a hand-rolled `Modal` that faded rather
// than slid, so rule L above never looked at it. Rule L asks whether a modal
// is a sheet in disguise; this one asks the question that applies to all of
// them, so nothing gets through by not looking like a sheet.
{
  for (const file of files) {
    if (isTest(file)) continue;
    const src = fs.readFileSync(path.join(SRC, file), 'utf8');
    if (!/<Modal[\s>]/.test(src)) continue;
    if (/statusBarTranslucent/.test(src)) continue;
    errors.push(
      `${file}: <Modal> without statusBarTranslucent — the screen under it jumps on Android edge-to-edge (CLAUDE.md §23b)`,
    );
  }
}

// --- N: no background-audio capability in the Expo config (CLAUDE.md §23c) ---
// App Review rejected two builds under guideline 2.5.4 for declaring background
// audio with no feature behind it. The first fix deleted the key from
// `ios.infoPlist` and did nothing: expo-audio's config plugin defaults
// `enableBackgroundPlayback` to TRUE and re-adds it on every prebuild, so the
// app.json diff read correctly while the shipped Info.plist was unchanged.
//
// CI asserts on the generated Info.plist, which is the complete check — but the
// iOS jobs are opt-in on `dev`, so without this the regression would surface
// only at release. This one is cheap and immediate: the plugins that can add
// the capability must say, in app.json, that they are not adding it.
{
  const appJsonPath = path.join(ROOT, 'app.json');
  if (fs.existsSync(appJsonPath)) {
    const plugins = JSON.parse(fs.readFileSync(appJsonPath, 'utf8')).expo?.plugins ?? [];
    const optionsFor = (name) => {
      const entry = plugins.find((p) => (Array.isArray(p) ? p[0] : p) === name);
      if (entry === undefined) return null;
      return Array.isArray(entry) ? (entry[1] ?? {}) : {};
    };

    const audio = optionsFor('expo-audio');
    if (audio !== null && audio.enableBackgroundPlayback !== false) {
      errors.push(
        'app.json: expo-audio must set "enableBackgroundPlayback": false — it defaults to true and adds UIBackgroundModes:audio, which App Review rejects (CLAUDE.md §23c)',
      );
    }

    const video = optionsFor('expo-video');
    if (video !== null && (video.supportsBackgroundPlayback === true || video.supportsPictureInPicture === true)) {
      errors.push(
        'app.json: expo-video background playback / picture-in-picture adds UIBackgroundModes:audio, which App Review rejects without a qualifying feature (CLAUDE.md §23c)',
      );
    }
  }
}

// --- O: port interfaces are *Interface, never I* (CLAUDE.md §21) -----------
// A leading `I` is Hungarian notation: it reads as noise at the point of use
// (`repo: IRecipeRepository`) and it sorted every port away from the thing it
// describes in a file listing. The suffix says the same thing where a reader
// is already looking — at the end of the name.
{
  for (const file of files) {
    if (isTest(file)) continue;
    const src = fs.readFileSync(path.join(SRC, file), 'utf8');
    for (const m of src.matchAll(/^export interface (I[A-Z]\w+)/gm)) {
      errors.push(`${file}: port interface ${m[1]} — name it ${m[1].slice(1)}Interface in a *-interface.ts file (CLAUDE.md §21)`);
    }
  }
}

// --- P: no vocabulary spelled out where a name exists (CLAUDE.md §5) -------
// The same word was written down in eleven stores, three layers, or both, and
// nothing tied the copies together. These two are the ones that kept coming
// back, so they are checked rather than remembered:
//   - a status literal outside the one file that defines the vocabulary;
//   - a `Failure` built from a sentence typed at the call site instead of the
//     `DiagnosticMessage` catalogue;
//   - a hand-written `typeof x === 'object'`, whose companion `x !== null` is the
//     half a reader skims past — `typeof null` is 'object'.
{
  const STATUS_DEF = 'application/store/store-status.ts';
  const MESSAGE_DEF = 'core/failure/diagnostic-message.ts';
  const GUARDS_DEF = 'core/guards/type-guards.ts';
  for (const file of files) {
    // Fixtures and mocks exist to stand in for real failures; their strings are the test data.
    if (isTest(file) || /__fixtures__|__mocks__/.test(file)) continue;
    if (file.endsWith(STATUS_DEF) || file.endsWith(MESSAGE_DEF) || file.endsWith(GUARDS_DEF)) continue;
    const src = fs.readFileSync(path.join(SRC, file), 'utf8');
    for (const m of src.matchAll(/status(?::| ===| !==) '([a-z]+)'/g)) {
      errors.push(`${file}: status literal '${m[1]}' — use StoreStatus (CLAUDE.md §5)`);
    }
    for (const m of src.matchAll(/typeof \w[\w.]* === '(string|object)'/g)) {
      errors.push(`${file}: ${m[0]} — use the guards in @core/guards/type-guards (CLAUDE.md §5)`);
    }
    for (const m of src.matchAll(/new (\w*Failure)\(\s*['"`]([^'"`]{4,})/g)) {
      errors.push(`${file}: ${m[1]} built from an inline message "${m[2].slice(0, 32)}…" — add it to DiagnosticMessage (CLAUDE.md §5)`);
    }
  }
}

// --- R: no removeClippedSubviews (CLAUDE.md §6c) ------------------------------
// The prop detaches and re-attaches child views behind Fabric's back, and on the
// New Architecture that is a crash, not an optimisation: opening a finished
// Instagram import killed the app with `addViewAt: failed to insert view [332]
// into parent [338]` thrown from `ReactClippingViewManager.addView` — the class
// that exists to implement this prop. The feed carrying it was the screen UNDER
// the import, so it re-clipped as the stack transition finished and handed
// Fabric a child it had already parented somewhere else.
//
// FlatList's own windowing (`windowSize`, `maxToRenderPerBatch`,
// `initialNumToRender`) is the supported way to bound mounted rows, and it was
// already tuned on the one list that had this.
{
  // Matches the prop being SET (`removeClippedSubviews={…}` / `: …`), not the
  // word. Comment lines are dropped first, so the note at the one call site
  // explaining why it must never come back does not itself trip the rule —
  // which is exactly what happened the first time this ran.
  const SET_PROP = /removeClippedSubviews\s*[=:]/;
  const isComment = (line) => /^\s*(\/\/|\*|\/\*)/.test(line);
  for (const file of files) {
    if (isTest(file)) continue;
    const src = fs.readFileSync(path.join(SRC, file), 'utf8');
    const code = src.split('\n').filter((line) => !isComment(line)).join('\n');
    if (!SET_PROP.test(code)) continue;
    errors.push(`${file}: removeClippedSubviews — crashes Fabric mounting (CLAUDE.md §6c)`);
  }
}

// --- Q: the custom route context must not hide a `+file` from expo-router ----
// `route-context.js` replaces `expo-router/_ctx` so co-located page code does
// not become routes. But expo-router reads more than routes out of that
// context: `getLinkingConfig` looks up `./+native-intent` in it to find
// `redirectSystemPath`. Excluding that file therefore did not skip a route, it
// silently unplugged the hook that rewrites the iOS share-extension URL — and
// every "Share to Recipely" landed on Unmatched Route with nothing logged.
//
// So: every root-level `+file` the STOCK native context would admit must be
// admitted by ours too. The three names below are the ones upstream's
// `_ctx.ios.js` / `_ctx.android.js` exclude; anything else is ours to pass on.
{
  const CTX = 'presentation/navigation/route-context.js';
  const APP_DIR = path.join(SRC, 'presentation/app');
  const STOCK_EXCLUDES = /^\+(html|middleware)\.[tj]sx?$|\+api\.[tj]sx?$/;
  const ctxPath = path.join(SRC, CTX);
  const literal = /require\.context\([\s\S]*?,\s*(?:true|false),\s*(\/.*\/)[gimsuy]*\s*,/.exec(
    fs.readFileSync(ctxPath, 'utf8'),
  )?.[1];
  if (literal === undefined) {
    errors.push(`${CTX}: cannot read the require.context regex — rule Q cannot check it`);
  } else {
    const admits = new RegExp(literal.slice(1, -1));
    for (const name of fs.readdirSync(APP_DIR)) {
      if (!/^\+[\w-]+\.[tj]sx?$/.test(name) || STOCK_EXCLUDES.test(name)) continue;
      if (admits.test(`./${name}`)) continue;
      errors.push(`${CTX}: excludes app/${name}, which expo-router reads from the context`);
    }
  }
}

// --- S: the store hub must not draw a status bar -----------------------------
// App Review rejected 1.0.43 (694) under guideline 2.3.10 — "remove non-iOS
// status bar images". The frames drew `9:41` + `5G` + a battery in the app's own
// webfont, with no signal or wifi glyph and in an order iOS never uses, painted
// over the app's back and bookmark buttons. Chrome that is drawn instead of
// captured can only ever be some other platform's, so none is drawn: the band
// above each capture is an empty spacer and the island is the only device chrome.
{
  const HUB = 'fastlane/store-hub';
  const hubDir = path.join(ROOT, HUB);
  // A clock (`9:41`) or a radio label is what a status bar says and nothing else
  // in this page does. Comments are stripped so the note explaining the rule —
  // and any `a ? 1024 : 512` — cannot trip it.
  const CHROME = /\b\d{1,2}:\d{2}\b|\b(?:3G|4G|5G|LTE)\b/;
  const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '');
  if (fs.existsSync(hubDir)) {
    for (const name of fs.readdirSync(hubDir)) {
      if (!/\.(js|css|html)$/.test(name)) continue;
      const hit = CHROME.exec(strip(fs.readFileSync(path.join(hubDir, name), 'utf8')));
      if (hit) errors.push(`${HUB}/${name}: draws status-bar chrome (${hit[0]}) — see fastlane/store-hub/README.md`);
    }
  }
}

// --- T: a native-only package needs a `.web` sibling to keep it out of the ---
//        web bundle
// `AdsService` was split into a native/web pair and the web build answered
// "no ads", so the ad slot rendered nothing on the web — but it still imported
// `react-native-google-mobile-ads` at module scope, and that package reaches
// `codegenNativeComponent`, which has no web target. A static export does not
// degrade on a native-only module, it FAILS: the dev web deploy went down on
// the commit that added the slot, and neither tsc nor jest nor lint noticed,
// because all three resolve the native file quite happily.
//
// So the rule is the pair, not the render: any module importing one of these
// packages must be a `.web.*` file itself or have a `.web.*` sibling for the
// resolver to pick first. The list is short on purpose — add to it when the web
// export teaches you another one, since only the bundler can really know.
{
  const NATIVE_ONLY = ['react-native-google-mobile-ads'];
  const imports = (code, pkg) =>
    new RegExp(`from\\s+['"]${pkg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`).test(code);
  for (const file of files) {
    if (isTest(file) || /\.web\.[jt]sx?$/.test(file)) continue;
    const code = fs.readFileSync(path.join(SRC, file), 'utf8');
    const pkg = NATIVE_ONLY.find((name) => imports(code, name));
    if (pkg === undefined) continue;
    const base = path.join(SRC, file).replace(/\.[jt]sx?$/, '');
    const hasWebSibling = ['.web.ts', '.web.tsx', '.web.js', '.web.jsx'].some((ext) =>
      fs.existsSync(base + ext),
    );
    if (hasWebSibling) continue;
    errors.push(`${file}: imports ${pkg} with no .web sibling — breaks the web export (CLAUDE.md §13)`);
  }
}

// --- J: PROJECT-MAP.md must describe the tree that exists --------------------
// The map only saves anyone time while it is true. It carries a fingerprint of
// every folder and file name under src/; if the tree moved and the map did not,
// fail here rather than letting a confidently wrong index rot in the repo.
{
  const mapPath = path.join(ROOT, 'PROJECT-MAP.md');
  if (!fs.existsSync(mapPath)) {
    errors.push('PROJECT-MAP.md is missing — run `npm run map`');
  } else {
    const { fingerprint } = await import('./generate-map.mjs');
    const recorded = /<!-- fingerprint: ([a-f0-9]+) -->/.exec(fs.readFileSync(mapPath, 'utf8'))?.[1];
    if (recorded !== fingerprint()) {
      errors.push('PROJECT-MAP.md is stale — run `npm run map` (CLAUDE.md §15b)');
    }
  }
}

if (errors.length) {
  console.error(`check:structure — ${errors.length} violation(s):\n`);
  for (const e of [...new Set(errors)].sort()) console.error('  ' + e);
  process.exit(1);
}
console.log('check:structure — OK');
