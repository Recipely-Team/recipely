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
 *   U. Every assistant action offered to the model has a handler registered by
 *      some screen — a word nothing answers advertises a capability the
 *      assistant does not have (CLAUDE.md §5).
 *   V. Every action in CONFIRMED_ACTIONS raises a confirmation rather than
 *      acting — a declared safety list nothing reads is worse than none.
 *   W. No callback takes an OPTIONAL first parameter — an event prop would pass
 *      the gesture event into it and no type would object (CLAUDE.md §24).
 *   AA. Every routed screen has an analytics screen name — an unmapped route
 *      falls back to the platform's own name, which is one `MainActivity` for
 *      the whole app (CLAUDE.md §25).
 *   T. Ads only on screens carrying publisher content, and the ad loader only
 *      in the widget that mounts a unit — never in a page and never in the web
 *      shell, which wraps every route. AdSense flagged both (CLAUDE.md §23e).
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
/**
 * The folders a routed page may co-locate its parts in (CLAUDE.md §14). Named
 * once because two rules ask about it — E, which places files, and AA, which
 * walks the route tree and must not mistake a part for a page.
 */
const CO_LOCATION_FOLDERS = ['body', 'items', 'sheets', 'hooks', 'model', 'shared', '__tests__'];
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
    const isRouteFile = /^(index|_layout|_sitemap|\+[\w-]+|\[[^/\]]+\])(\.(android|ios|native|web))?$/.test(base) && rel.endsWith('.tsx');
    const inConventionFolder = new RegExp(`(^|/)(${CO_LOCATION_FOLDERS.join('|')})/`).test(rel);
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

    // react-native-audio-api carries the microphone for the voice assistant, and
    // its plugin is the worst offender of the three: BOTH switches default to on.
    // `iosBackgroundMode` adds UIBackgroundModes:audio — the exact key that cost
    // two rejections — and `androidForegroundService` adds a media-playback
    // foreground service plus the two FOREGROUND_SERVICE permissions, which Play
    // makes you justify. The assistant only ever runs on a screen the user is
    // looking at, so both are wrong for this app; a bare "react-native-audio-api"
    // string (no options object) silently means both are on, which is why the
    // entry is required to carry options at all.
    const liveAudio = optionsFor('react-native-audio-api');
    if (liveAudio !== null) {
      if (liveAudio.iosBackgroundMode !== false) {
        errors.push(
          'app.json: react-native-audio-api must set "iosBackgroundMode": false — it defaults to true and adds UIBackgroundModes:audio, which App Review rejects (CLAUDE.md §23c)',
        );
      }
      if (liveAudio.androidForegroundService !== false) {
        errors.push(
          'app.json: react-native-audio-api must set "androidForegroundService": false — it defaults to true and declares a mediaPlayback foreground service the app has no feature for (CLAUDE.md §23c)',
        );
      }
      const androidPermissions = liveAudio.androidPermissions;
      if (!Array.isArray(androidPermissions)) {
        errors.push(
          'app.json: react-native-audio-api must list "androidPermissions" explicitly — the default adds FOREGROUND_SERVICE and FOREGROUND_SERVICE_MEDIA_PLAYBACK (CLAUDE.md §23c)',
        );
      } else if (androidPermissions.some((permission) => permission.includes('FOREGROUND_SERVICE'))) {
        errors.push(
          'app.json: react-native-audio-api androidPermissions must not request FOREGROUND_SERVICE* — the app plays no audio while backgrounded (CLAUDE.md §23c)',
        );
      }
      if (liveAudio.iosMicrophonePermission !== undefined) {
        errors.push(
          'app.json: react-native-audio-api "iosMicrophonePermission" is inert here — expo-audio owns NSMicrophoneUsageDescription and overwrites it. Put the copy on expo-audio\'s "microphonePermission" instead (CLAUDE.md §23c)',
        );
      }
    }

    // The microphone has exactly ONE owner, and it is expo-audio. Its plugin runs
    // `createPermissionsPlugin`, which DELETES NSMicrophoneUsageDescription when
    // `microphonePermission` is false — beating both a static `ios.infoPlist`
    // entry and react-native-audio-api's own `iosMicrophonePermission`. So the
    // config could name the microphone in two places, read as correct in review,
    // and still prebuild an Info.plist with no usage string at all: iOS then
    // denies the first mic access with nothing to show the user. Same lesson as
    // §23c from the other direction — the config is not the artifact.
    if (audio !== null && audio.recordAudioAndroid !== false) {
      if (typeof audio.microphonePermission !== 'string' || audio.microphonePermission.trim() === '') {
        errors.push(
          'app.json: expo-audio requests RECORD_AUDIO, so its "microphonePermission" must be the iOS usage string — false or missing deletes NSMicrophoneUsageDescription and the mic is denied with no prompt (CLAUDE.md §23c)',
        );
      }
    }
  }
}

// --- U: every assistant action has a handler (CLAUDE.md §5) ----------------
// The action list is offered to the model as the enum of its one tool, and a
// word nothing answers is the worst kind of bug this feature has: the model is
// told it can do a thing, tries, and gets `unavailable_here` — so the assistant
// looks broken for a capability it was advertised. Nothing catches that at
// build time, and on a device it looks like the model misunderstood.
//
// Handlers are registered from screens via `useAssistantAction`, so the check
// is a set comparison between the vocabulary and the registrations.
{
  const vocabularyPath = path.join(SRC, 'domain/assistant/actions/assistant-action-type.ts');
  if (fs.existsSync(vocabularyPath)) {
    const vocabulary = [...fs.readFileSync(vocabularyPath, 'utf8').matchAll(/^ {2}\w+: '(\w+)',/gm)].map(
      (m) => m[1],
    );
    const registered = new Set();
    for (const file of files) {
      const src = fs.readFileSync(path.join(SRC, file), 'utf8');
      // Two shapes of registration: the plain hook, and a conditional
      // `register` for actions that only exist while something is on screen
      // (the confirm/cancel pair a sheet owns).
      const registrations = [
        ...src.matchAll(/useAssistantAction\(\s*AssistantAction\.(\w+)/g),
        ...src.matchAll(/\.register\(\s*AssistantAction\.(\w+)/g),
      ];
      for (const m of registrations) {
        const value = new RegExp(`^ {2}${m[1]}: '(\\w+)',`, 'm').exec(
          fs.readFileSync(vocabularyPath, 'utf8'),
        )?.[1];
        if (value !== undefined) registered.add(value);
      }
    }
    const unhandled = vocabulary.filter((action) => !registered.has(action));
    if (unhandled.length > 0) {
      errors.push(
        `assistant actions with no handler: ${unhandled.join(', ')} — every action offered to the model must be registered by some screen via useAssistantAction, or the assistant is advertised a capability it does not have (CLAUDE.md §5)`,
      );
    }
  }
}

// --- V: a confirmed action must actually ask (CLAUDE.md §5) ----------------
// `CONFIRMED_ACTIONS` names what the assistant must never do on a model's
// say-so. It previously sat beside the vocabulary as a statement of intent
// that nothing read, and `unsave` was on the list while running unconfirmed —
// a declared invariant no code enforces is worse than none, because it reads
// as though the question had been settled.
//
// The check is shallow on purpose: a handler for one of these must answer
// `awaiting`, which is what a sheet-raising handler returns and what a
// straight-through one never does.
{
  const listPath = path.join(SRC, 'domain/assistant/actions/confirmed-actions.ts');
  const vocabularyPath = path.join(SRC, 'domain/assistant/actions/assistant-action-type.ts');
  if (fs.existsSync(listPath) && fs.existsSync(vocabularyPath)) {
    const vocabulary = fs.readFileSync(vocabularyPath, 'utf8');
    const confirmed = [...fs.readFileSync(listPath, 'utf8').matchAll(/AssistantAction\.(\w+)/g)]
      .map((m) => m[1])
      .filter((name, at, all) => all.indexOf(name) === at);

    for (const member of confirmed) {
      // Both registration shapes count, the same two rule U accepts: a
      // confirmed action registered through `registry.register` was invisible
      // to the first version of this, which is the shape the confirm/cancel
      // pair itself uses.
      const pattern = new RegExp(
        `(?:useAssistantAction|\\.register)\\(\\s*AssistantAction\\.${member}\\b`,
        'g',
      );
      let registrations = 0;
      let acting = 0;
      for (const file of files) {
        if (isTest(file)) continue;
        const src = fs.readFileSync(path.join(SRC, file), 'utf8');
        for (const match of src.matchAll(pattern)) {
          registrations += 1;
          // The handler runs from this registration to the next one, or to the
          // end of the file. Bounding it matters: without the bound, an
          // unrelated `awaiting` further down the file satisfied the check.
          const rest = src.slice(match.index ?? 0);
          const nextAt = rest.slice(1).search(/(?:useAssistantAction|\.register)\(/);
          const body = nextAt === -1 ? rest : rest.slice(0, nextAt + 1);
          if (!/awaiting:\s*true/.test(body)) acting += 1;
        }
      }
      // EVERY registration must ask, not merely one of them — the action is
      // implemented by more than one screen for several of these, and one
      // screen doing it right says nothing about the others.
      if (registrations > 0 && acting > 0) {
        const spelled = new RegExp(`^ {2}${member}: '(\\w+)',`, 'm').exec(vocabulary)?.[1] ?? member;
        errors.push(
          `assistant action '${spelled}' is in CONFIRMED_ACTIONS but ${acting} of its ${registrations} handler(s) act without asking — each must raise a confirmation and answer awaiting (CLAUDE.md §5)`,
        );
      }
    }
  }
}

// --- W: no optional leading parameter on a callback (CLAUDE.md §24) -------
// React Native calls `onPress` WITH the gesture event, and a prop declared
// `() => void` accepts a handler that takes parameters — TypeScript allows a
// function of fewer parameters where more are expected, and this is the mirror
// of that rule. So a handler with an OPTIONAL first parameter silently
// receives a `GestureResponderEvent` on an ordinary tap: that is how one ended
// up inside `instructions: string[]` and rode into publish.
//
// `onPress={handler}` is idiomatic and safe when the handler takes nothing, so
// the check is on the declaration rather than the call site. Two handlers —
// one that takes nothing, one that takes the value — is the fix, and it makes
// the hazard unrepresentable rather than merely absent.
{
  const OPTIONAL_FIRST_PARAM = /useCallback\(\s*(?:async\s*)?\(\s*(\w+)\s*(?::[^),=]+)?=\s*[^),]/g;
  for (const file of files) {
    if (isTest(file)) continue;
    const src = fs.readFileSync(path.join(SRC, file), 'utf8');
    for (const m of src.matchAll(OPTIONAL_FIRST_PARAM)) {
      errors.push(
        `${file}: useCallback with an optional first parameter '${m[1]}' — an event prop would pass the gesture event into it and no type would object. Split it into one handler that takes nothing and one that takes the value (CLAUDE.md §24)`,
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

// --- Z: the dev sitemap must stay out of the shipped app ---------------------
// expo-router appends its own `_sitemap` route whenever the route context does
// not supply one, and that screen reads `window.location.origin` — which does
// not exist on native. Reaching `/_sitemap` on a device is therefore a fatal
// TypeError, and nothing in the app links to it: a route crawler found it and
// Crashlytics logged the crash. There is no config switch (qualified-entry
// renders <ExpoRoot> with no `config` prop), so the override file IS the fix.
// Delete it, or hide it from the context, and the crashing screen comes back.
{
  const OVERRIDE = 'presentation/app/_sitemap.tsx';
  const CTX_FILE = 'presentation/navigation/route-context.js';
  if (!fs.existsSync(path.join(SRC, OVERRIDE))) {
    errors.push(
      `src/${OVERRIDE}: missing — expo-router then ships its own _sitemap, which reads window.location.origin and crashes on native`,
    );
  } else {
    const literal = /require\.context\([\s\S]*?,\s*(?:true|false),\s*(\/.*\/)[gimsuy]*\s*,/.exec(
      fs.readFileSync(path.join(SRC, CTX_FILE), 'utf8'),
    )?.[1];
    if (literal !== undefined && !new RegExp(literal.slice(1, -1)).test('./_sitemap.tsx')) {
      errors.push(`${CTX_FILE}: excludes app/_sitemap.tsx, so expo-router falls back to its crashing dev screen`);
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

// --- T: an ad needs a screen with something on it ----------------------------
// AdSense served notice on recipely.net for "ads on screens without publisher
// content". Two causes, both of them ours:
//
//   1. `+html.tsx` loaded the AdSense script into the shell that wraps EVERY
//      route, and the site declares no ad unit of its own — so every ad it ever
//      served was an Auto Ad placed on /login, /settings, /verify-code and the
//      rest, none of which hold any content.
//   2. `AdSlot` sat on the generate checklist and the import queue. Both are
//      wait screens — a spinner, a stage list, a progress bar — which is the
//      same violation in the app, under the same rule in AdMob's version of it.
//
// So: a slot may only be rendered from a placement listed here, and the loader
// may only be fetched by the widget that mounts a unit — never by a route, and
// above all never by the shell. Adding to either list is a policy decision
// about whether the screen shows the user something they came to read; it is
// deliberately a one-line diff someone has to justify.
{
  const AD_PLACEMENTS = new Set([
    'presentation/app/recipes/items/feed-row-view.tsx',
    'presentation/app/recipes/body/web-recipe-feed.tsx',
  ]);
  // The one folder allowed to name the loader: it is where a unit is built, so
  // the script it needs arrives with it rather than with the page.
  const AD_WIDGETS = 'presentation/base/widgets/ads/';
  const LOADER = /adsbygoogle|pagead2\.googlesyndication\.com/;
  const RENDERS_SLOT = /<(AdSlot|WebBannerAd)[\s/>]/;
  const isComment = (line) => /^\s*(\/\/|\*|\/\*)/.test(line);

  for (const file of files) {
    if (isTest(file) || file.startsWith(AD_WIDGETS)) continue;
    const src = fs.readFileSync(path.join(SRC, file), 'utf8');
    const code = src.split('\n').filter((line) => !isComment(line)).join('\n');

    if (LOADER.test(code)) {
      errors.push(
        `${file}: loads the AdSense script — it belongs to the unit in ${AD_WIDGETS}, not to a page, and in the shell it runs on every route (CLAUDE.md §23e)`,
      );
    }
    if (RENDERS_SLOT.test(code) && !AD_PLACEMENTS.has(file)) {
      errors.push(
        `${file}: renders an ad outside an approved placement — a wait, form or auth screen carries no publisher content (CLAUDE.md §23e)`,
      );
    }
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

/** The text of a JSX opening tag, brace-balanced so `=>` inside a prop does not end it. */
function openingTag(src, at) {
  let depth = 0;
  for (let i = at; i < src.length; i += 1) {
    const ch = src[i];
    if (ch === '{') depth += 1;
    else if (ch === '}') depth -= 1;
    else if (ch === '>' && depth === 0 && src[i - 1] !== '=') return src.slice(at, i);
  }
  return src.slice(at, at + 400);
}

// --- X: every page with a scroller must be reachable by the assistant (§24)
// "Asistan sayfalarda scroll yapamıyor" was reported for most of the app, and
// the cause was not forgetfulness: `useAssistantAction` reads `useStores`,
// which throws outside a provider, so adopting the scroll hook turned a
// screen's component tests red. The harness now supplies stores, which removed
// the cost — this rule removes the option of forgetting.
//
// **The question is asked of the PAGE, not the file.** A screen splits its list
// across body/ and items/, and there are three wirings in the tree already: the
// route component calling `useAssistantScroll` with a view-model callback, a
// child receiving `AssistantScrollableProps` down a prop, and `ScreenContainer`
// wiring it for whatever it wraps. Asking each file produced nine false alarms
// for lists that move perfectly well. Asking whether ANY file in the page
// registers scroll catches the regression that matters — a new page shipped
// with a scroller nothing can move — and nothing else.
{
  const APP = path.join(SRC, 'presentation/app');

  // Pages the assistant is not offered on at all. Derived from the source so
  // the two lists cannot drift: it is closed there on purpose — it cannot type
  // a password — so registering scroll would be dead code.
  const closedSegments = new Set();
  const offeredPath = path.join(SRC, 'presentation/base/hooks/assistant/use-assistant-is-offered.ts');
  if (fs.existsSync(offeredPath)) {
    const routesPath = path.join(SRC, 'presentation/base/constants/route-paths.ts');
    const routes = fs.existsSync(routesPath) ? fs.readFileSync(routesPath, 'utf8') : '';
    const closedSrc = /CLOSED_TO_ASSISTANT[^=]*=\s*\[([^\]]*)\]/s.exec(fs.readFileSync(offeredPath, 'utf8'));
    for (const m of (closedSrc?.[1] ?? '').matchAll(/RoutePaths\.(\w+)/g)) {
      const value = new RegExp(`^\\s*${m[1]}: '/([\\w-]+)'`, 'm').exec(routes)?.[1];
      if (value !== undefined) closedSegments.add(value);
    }
  }

  const COVERAGE = /useAssistantScroll\b|useAssistantScrollable\b|\{\.\.\.scrollable\}|AssistantScrollableProps|<ScreenContainer(?![^>]*scrollable=\{false\})[^>]*\sscrollable\b/;
  const SCROLLERS = /<(?:Animated\.)?(ScrollView|FlatList|SectionList)\b/g;

  const pageFiles = (dir, into) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== '__tests__') pageFiles(full, into);
      } else if (entry.name.endsWith('.tsx')) into.push(full);
    }
    return into;
  };

  if (fs.existsSync(APP)) {
    for (const entry of fs.readdirSync(APP, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name === '__tests__') continue;
      if (closedSegments.has(entry.name)) continue;

      const sources = pageFiles(path.join(APP, entry.name), []).map((f) => ({
        rel: path.relative(APP, f).split(path.sep).join('/'),
        text: fs.readFileSync(f, 'utf8'),
      }));
      if (sources.some((f) => COVERAGE.test(f.text))) continue;

      // Not covered anywhere on the page — is there anything to scroll?
      for (const file of sources) {
        const found = [...file.text.matchAll(SCROLLERS)].find(
          // A horizontal strip (chip rows, carousels) is not page content. The
          // opening tag is brace-balanced rather than read to the next '>':
          // an arrow function in an earlier prop ends in one, and stopping
          // there hid the `horizontal` that came after it.
          (m) => !/\bhorizontal\b/.test(openingTag(file.text, m.index)),
        );
        if (found === undefined) continue;
        errors.push(
          `presentation/app/${file.rel}: <${found[1]}> is a page scroller the assistant cannot move — no file under app/${entry.name}/ registers scroll (CLAUDE.md §24)`,
        );
        break;
      }
    }
  }
}

// --- Y: no unnamed numeric literal in a style or a JSX prop (CLAUDE.md §5) --
// Rule 5 forbids magic values, and until now nothing checked it — the tree was
// clean because people were careful, which is not a guarantee. The three
// `scrollEventThrottle={16}` this found were the instructive case: a fourth
// site spelled the same idea `100`, so what looked like one repeated constant
// was actually two different decisions nobody had named.
//
// **Unnamed is the target, not "a number".** A value only one file reads may
// live in that file (rule 5 says the test is reuse, not type), so a named
// `const RING_START_ROTATION = -90` passes and only the literal at the point of
// use fails. That keeps the rule enforcing readability rather than churning
// every number into a distant module.
{
  const PRESENTATION = path.join(SRC, 'presentation');

  // Value modules: holding numbers IS their job. A geometry table or a token
  // ladder is the destination this rule pushes things toward, so flagging it
  // would be circular.
  const isValueModule = (rel) =>
    rel.startsWith('base/theme/') ||
    rel.startsWith('base/constants/') ||
    rel.startsWith('i18n/locales/') ||
    /(^|\/)model\//.test(rel) ||
    /-geometry\.ts$/.test(rel) ||
    /-constants\.ts$/.test(rel) ||
    /-tuning\.ts$/.test(rel);

  // 0 and 1 are structural rather than designed — `flex: 1`, `opacity: 1`,
  // `zIndex: 0`. Rule 5 routes those to ValueConstants, which is a separate
  // (and much noisier) argument than the one this rule is making.
  const STRUCTURAL = new Set(['0', '1', '-1']);

  const STYLE_PROP =
    '(?:width|height|minWidth|maxWidth|minHeight|maxHeight|top|bottom|left|right|' +
    'margin\\w*|padding\\w*|borderRadius|border\\w*Width|fontSize|lineHeight|opacity|' +
    'zIndex|gap|rowGap|columnGap|flexBasis|elevation|letterSpacing|aspectRatio|' +
    'shadowRadius|shadowOpacity)';
  const styleLiteral = new RegExp(`\\b${STYLE_PROP}:\\s*(-?\\d+(?:\\.\\d+)?)\\b`, 'g');
  const jsxLiteral = /\s([a-z]\w*)=\{(-?\d+(?:\.\d+)?)\}/g;

  // Props whose number IS the meaning and has no name worth inventing.
  const PLAIN_PROPS = new Set(['key', 'index', 'tabIndex', 'span', 'colSpan', 'rowSpan']);

  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!['__tests__', '__fixtures__', '__mocks__'].includes(entry.name)) walk(full);
        continue;
      }
      if (!entry.name.endsWith('.ts') && !entry.name.endsWith('.tsx')) continue;

      const rel = path.relative(PRESENTATION, full).split(path.sep).join('/');
      if (isValueModule(rel)) continue;

      const src = fs.readFileSync(full, 'utf8');
      const found = [];
      for (const m of src.matchAll(styleLiteral)) {
        if (!STRUCTURAL.has(m[1])) found.push(`${m[0].trim()}`);
      }
      for (const m of src.matchAll(jsxLiteral)) {
        if (STRUCTURAL.has(m[2]) || PLAIN_PROPS.has(m[1])) continue;
        found.push(`${m[1]}={${m[2]}}`);
      }
      if (found.length > 0) {
        const shown = [...new Set(found)].slice(0, 3).join(', ');
        errors.push(
          `presentation/${rel}: unnamed numeric literal(s) — ${shown} — name it in a theme token, a constants module, or a local const (CLAUDE.md §5)`,
        );
      }
    }
  };

  if (fs.existsSync(PRESENTATION)) walk(PRESENTATION);
}

// --- AA: every routed screen reports its own name to analytics (CLAUDE.md §25)
// Nothing logged a screen view, so the only screen names Firebase ever had were
// the ones the platforms invent: one `MainActivity` for the whole Android app,
// and — because `+html.tsx` serves one `<title>` for the entire web export —
// one page for the whole site. Adding a route and forgetting the map would put
// that screen back into the same nameless bucket, silently, so the map is
// checked against the routes that exist rather than trusted.
{
  const APP = path.join(SRC, 'presentation/app');
  const TRACKER = 'presentation/bootstrap/use-screen-tracking.ts';
  const PATHS_FILE = 'presentation/base/constants/route-paths.ts';
  const trackerPath = path.join(SRC, TRACKER);
  // Comments are stripped everywhere below: a route named only in a `// TODO:
  // restore RoutePaths.settings` satisfied a substring search while reporting
  // nothing, which is the exact failure this rule exists to prevent.
  const stripComments = (src) =>
    src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '');

  if (!fs.existsSync(trackerPath)) {
    errors.push(`src/${TRACKER}: missing — no route would report a screen name and every screen collapses into one row`);
  } else {
    const tracker = stripComments(fs.readFileSync(trackerPath, 'utf8'));
    const routePaths = fs.readFileSync(path.join(SRC, PATHS_FILE), 'utf8');
    // Static entries only: a builder function (`recipeDetail: (id) => …`) is not
    // a path this gate can compare against a folder.
    const pathByKey = new Map(
      [...routePaths.matchAll(/^\s{2}(\w+):\s*'([^']+)',/gm)].map((m) => [m[1], m[2]]),
    );
    const mentionsKey = (key) => new RegExp(`RoutePaths\\.${key}\\b`).test(tracker);
    const covered = new Set(
      [...pathByKey].filter(([key]) => mentionsKey(key)).map(([, value]) => value),
    );

    // A route that only renders <Redirect> is not a screen — logging a view for
    // it would count an impression of a page that was never on screen. The `<`
    // must not follow a word character, or `new Set<RoutePathsKey>()` would read
    // as a second tag and the route would be demanded a name it cannot have.
    const isRedirectOnly = (src) => {
      const tags = [...stripComments(src).matchAll(/(?<![\w])<([A-Z]\w*)/g)].map((m) => m[1]);
      return tags.length > 0 && tags.every((tag) => tag === 'Redirect');
    };

    const walkRoutes = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!CO_LOCATION_FOLDERS.includes(entry.name)) walkRoutes(full);
          continue;
        }
        if (entry.name !== 'index.tsx') continue;
        const relDir = path.relative(APP, dir).split(path.sep).join('/');
        const segments = relDir === '' ? [] : relDir.split('/');
        const src = fs.readFileSync(full, 'utf8');
        if (isRedirectOnly(src)) continue;

        const dynamicAt = segments.findIndex((s) => s.startsWith('['));
        if (dynamicAt === -1) {
          const routePath = `/${segments.join('/')}`;
          if (!covered.has(routePath)) {
            errors.push(
              `src/${TRACKER}: no analytics screen name for route ${routePath} — add it to SCREEN_BY_PATH (CLAUDE.md §25)`,
            );
          }
          continue;
        }
        // A parameterised route is matched by the prefix of its parent, because
        // the parameter itself must never become part of the screen name. The
        // check is on coverage, not on spelling: how the prefix is built is the
        // hook's business.
        const parent = `/${segments.slice(0, dynamicAt).join('/')}`;
        const parentKey = [...pathByKey].find(([, value]) => value === parent)?.[0];
        if (parentKey === undefined || !mentionsKey(parentKey) || !/startsWith\(/.test(tracker)) {
          errors.push(
            `src/${TRACKER}: no analytics screen name for the ${parent === '/' ? '' : parent}/<param> route — match it by prefix (CLAUDE.md §25)`,
          );
        }
      }
    };

    if (fs.existsSync(APP)) walkRoutes(APP);
  }

  // The other half of the same concern: with automatic reporting left on,
  // Android keeps reporting its single Activity ALONGSIDE the names above, and
  // the console shows both. The flag reaches the artifact late — a build-phase
  // script writes `FirebaseAutomaticScreenReportingEnabled` into the iOS plist,
  // and a manifest placeholder writes the meta-data into Android's merged
  // manifest — so neither is visible after `expo prebuild`. What IS checkable
  // here is that the switch has not quietly gone missing from the config.
  {
    const FIREBASE_JSON = 'firebase.json';
    const KEY = 'google_analytics_automatic_screen_reporting_enabled';
    const config = JSON.parse(fs.readFileSync(path.join(ROOT, FIREBASE_JSON), 'utf8'));
    if (config['react-native']?.[KEY] !== false) {
      errors.push(
        `${FIREBASE_JSON}: ${KEY} must be false — otherwise Android reports its Activity next to the real screen names (CLAUDE.md §25)`,
      );
    }
  }
}

if (errors.length) {
  console.error(`check:structure — ${errors.length} violation(s):\n`);
  for (const e of [...new Set(errors)].sort()) console.error('  ' + e);
  process.exit(1);
}
console.log('check:structure — OK');
