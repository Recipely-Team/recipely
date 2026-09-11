#!/usr/bin/env node
/**
 * Writes the Android static shortcuts and their labels from the catalogue.
 *
 * WHY generated: `shortcuts.xml` names an action word and a deep link for each
 * entry, and those words already exist in `OS_INTENT_CATALOGUE`. Hand-kept, the
 * XML is a fourth place to rename something — and a launcher shortcut that
 * carries a word the app no longer answers looks, to the user, like the app
 * ignoring them.
 *
 * Two outputs, both inside the module so Gradle merges them into the app:
 *   res/xml/recipely_shortcuts.xml     — the shortcuts themselves
 *   res/values[-lang]/recipely_shortcuts_strings.xml — one label per language
 *
 * Run by `npm run shortcuts:android`; freshness is enforced by `check:structure`.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const LOCALES_DIR = path.join(ROOT, 'src/presentation/i18n/locales');
const CATALOGUE = path.join(ROOT, 'src/domain/assistant/os/os-intent-catalogue.ts');
const IDS = path.join(ROOT, 'src/domain/assistant/os/os-intent-id.ts');
const ACTIONS = path.join(ROOT, 'src/domain/assistant/actions/assistant-action-type.ts');
const RES = path.join(ROOT, 'modules/recipely-assistant-kit/android/src/main/res');

const SOURCE_LANGUAGE = 'en';
const STRING_PREFIX = 'recipely_shortcut_';

/**
 * Android's language folder for a BCP-47 code.
 *
 * Indonesian is the trap: the platform still uses ISO 639-1's 1988 code `in`,
 * and a `values-id` folder is read as the REGION Indonesia rather than the
 * language — so every Indonesian label would silently fall back to English.
 * Hebrew (`iw`) and Yiddish (`ji`) are the same story; they are listed so the
 * next person to add one finds the answer here rather than in a bug report.
 */
const ANDROID_LANGUAGE = { id: 'in', he: 'iw', yi: 'ji' };
const androidFolder = (code) =>
  code === SOURCE_LANGUAGE ? 'values' : `values-${ANDROID_LANGUAGE[code] ?? code}`;

const xmlEscape = (value) =>
  value
    .split('&').join('&amp;')
    .split('<').join('&lt;')
    .split('>').join('&gt;')
    .split('"').join('&quot;');

/** `'` and `@` are Android string-resource metacharacters, not XML ones. */
const androidEscape = (value) => xmlEscape(value).split("'").join("\\'");

const readBlock = (file, name) => {
  const src = fs.readFileSync(file, 'utf8');
  const block = new RegExp(`${name}:\\s*\\{([\\s\\S]*?)\\n {2}\\},`).exec(src);
  if (block === null) throw new Error(`${path.basename(file)} has no ${name} block`);
  const out = {};
  for (const m of block[1].matchAll(/^ {4}(\w+):\s*(['"])([\s\S]*?)\2,$/gm)) out[m[1]] = m[3];
  return out;
};

const constValues = (file) =>
  new Map(
    [...fs.readFileSync(file, 'utf8').matchAll(/^ {2}(\w+): '([\w]+)',/gm)].map((m) => [m[1], m[2]]),
  );

const intentIds = constValues(IDS);
const actionValues = constValues(ACTIONS);

/** The catalogue entries marked `launcherShortcut: true`, in declared order. */
const launcherEntries = () => {
  const src = fs.readFileSync(CATALOGUE, 'utf8');
  const entries = [];
  for (const block of src.matchAll(/\{\s*\n\s*id: OsIntentId\.(\w+),[\s\S]*?\n {2}\},/g)) {
    const body = block[0];
    if (!/launcherShortcut:\s*true/.test(body)) continue;
    const idName = /id: OsIntentId\.(\w+)/.exec(body)[1];
    const actionName = /action:\s*AssistantAction\.(\w+)/.exec(body)?.[1] ?? null;
    const arg = /arg:\s*'([^']*)'/.exec(body)?.[1] ?? null;

    const id = intentIds.get(idName);
    if (id === undefined) throw new Error(`OsIntentId.${idName} has no value`);
    const action = actionName === null ? null : actionValues.get(actionName);
    if (actionName !== null && action === undefined) {
      throw new Error(`AssistantAction.${actionName} has no value`);
    }
    entries.push({ id, action, arg });
  }
  return entries;
};

const localeCodes = fs
  .readdirSync(LOCALES_DIR)
  .filter((name) => name.endsWith('.ts'))
  .map((name) => name.replace(/\.ts$/, ''))
  .sort();

const entries = launcherEntries();
if (entries.length === 0) throw new Error('No catalogue entry is marked launcherShortcut');

const english = readBlock(path.join(LOCALES_DIR, `${SOURCE_LANGUAGE}.ts`), 'osShortcutLabels');
for (const entry of entries) {
  if (english[entry.id] === undefined) {
    throw new Error(
      `osShortcutLabels has no entry for '${entry.id}' — a launcher shortcut with no label ` +
        'renders as a blank row',
    );
  }
}
const unused = Object.keys(english).filter((id) => !entries.some((e) => e.id === id));
if (unused.length > 0) {
  throw new Error(`osShortcutLabels has entries no launcher shortcut uses: ${unused.join(', ')}`);
}

/**
 * The deep link a shortcut opens, spelled the way `parseOsIntentLink` reads it.
 *
 * The scheme is deliberately absent: `shortcuts.xml` targets the app by
 * component, and the variant's scheme is not known at generation time.
 */
const deepLink = ({ id, action, arg }) => {
  // The id is always present and the action is not: the open-ended entry has
  // none, and writing its absence as the text `null` would ask the app to run
  // a word called "null".
  const parts = [`id=${id}`];
  if (action !== null) parts.push(`action=${action}`);
  if (arg !== null) parts.push(`arg=${encodeURIComponent(arg)}`);
  return `assistant/run?${parts.join('&')}`;
};

const shortcutsXml = `<?xml version="1.0" encoding="utf-8"?>
<!-- Generated by scripts/generate-android-shortcuts.mjs. Do not edit. -->
<shortcuts xmlns:android="http://schemas.android.com/apk/res/android">
${entries
  .map(
    (entry) => `  <shortcut
    android:shortcutId="${xmlEscape(entry.id)}"
    android:enabled="true"
    android:shortcutShortLabel="@string/${STRING_PREFIX}${entry.id}"
    android:shortcutLongLabel="@string/${STRING_PREFIX}${entry.id}">
    <intent
      android:action="android.intent.action.VIEW"
      android:data="${xmlEscape(deepLink(entry))}" />
  </shortcut>`,
  )
  .join('\n')}
</shortcuts>
`;

const stringsXml = (labels) => `<?xml version="1.0" encoding="utf-8"?>
<!-- Generated by scripts/generate-android-shortcuts.mjs. Do not edit. -->
<resources>
${entries
  .map((entry) => `  <string name="${STRING_PREFIX}${entry.id}">${androidEscape(labels[entry.id])}</string>`)
  .join('\n')}
</resources>
`;

let wasStale = false;
const write = (file, contents) => {
  const previous = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (previous === contents) return;
  wasStale = true;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
};

write(path.join(RES, 'xml', 'recipely_shortcuts.xml'), shortcutsXml);

for (const code of localeCodes) {
  const labels = readBlock(path.join(LOCALES_DIR, `${code}.ts`), 'osShortcutLabels');
  for (const entry of entries) {
    if (labels[entry.id] === undefined || labels[entry.id].length === 0) {
      throw new Error(`${code}.ts is missing osShortcutLabels.${entry.id}`);
    }
  }
  write(path.join(RES, androidFolder(code), 'recipely_shortcuts_strings.xml'), stringsXml(labels));
}

export const isFresh = () => !wasStale;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(
    `recipely_shortcuts.xml — ${entries.length} shortcuts x ${localeCodes.length} languages`,
  );
}
