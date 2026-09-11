const fs = require('node:fs');
const path = require('node:path');
const {
  withAndroidManifest,
  withDangerousMod,
  withEntitlementsPlist,
  withInfoPlist,
  withXcodeProject,
  AndroidConfig,
} = require('@expo/config-plugins');

/**
 * Wires `modules/recipely-assistant-kit` into the generated native projects.
 *
 * WHY this exists rather than a plain Expo module: **App Intents cannot be
 * compiled in a pod here.** Xcode's `AppIntentsMetadataProcessor` does not
 * reliably extract intent metadata out of a static framework, and
 * `useFrameworks: "static"` in app.json makes every pod exactly that. An intent
 * declared in the pod builds green and is then invisible to Siri, Spotlight and
 * the Shortcuts app, with no error anywhere to say so. Expo's own
 * `expo-app-intents` reached the same conclusion — it keeps intent declarations
 * in inline Swift so Apple's build-time extraction can find them.
 *
 * So the source lives with the library, where it belongs, and this plugin
 * copies it into the app target and registers it in the pbxproj on every
 * prebuild. `ios/` and `android/` are git-ignored and rebuilt from scratch in
 * CI, so there is no hand-edited native project for any of this to live in.
 *
 * ORDER MATTERS, and backwards. Expo runs each mod and then calls the mod
 * registered BEFORE it, so the last plugin in `app.json` runs first. This one
 * has to run after `expo-share-intent`, which declares the very same App Group,
 * so it is registered immediately *before* it in the list. Registered last —
 * the obvious place for a local plugin — its de-duplication ran first and the
 * duplicate was appended afterwards, which is how the entitlement shipped the
 * group twice.
 *
 * Three variant-derived values are written into the artifact rather than
 * compiled into Swift or Kotlin, because there are two bundle identifiers and
 * two URL schemes and a constant would have pointed the dev build's intents at
 * the production container:
 *   - `RecipelyAssistantAppGroup` in Info.plist, read by `RecipelyAssistantStore`
 *   - the matching App Group entitlement
 *   - `net.recipely.assistantkit.SCHEME` manifest meta-data, read by
 *     `RecipelyAssistantConfig`
 */
const APP_GROUP_INFO_KEY = 'RecipelyAssistantAppGroup';
const API_BASE_URL_INFO_KEY = 'RecipelyAssistantApiBaseUrl';
const APP_GROUP_ENTITLEMENT = 'com.apple.security.application-groups';
const ANDROID_SCHEME_META_DATA = 'net.recipely.assistantkit.SCHEME';
const ANDROID_SHORTCUTS_META_DATA = 'android.app.shortcuts';
const ANDROID_SHORTCUTS_RESOURCE = '@xml/recipely_shortcuts';
const ENVELOPE_KEY_INFO_KEY = 'RecipelyAssistantEnvelopeKey';
const ANDROID_ENVELOPE_KEY_META_DATA = 'net.recipely.assistantkit.ENVELOPE_KEY';
const ENVELOPE_KEY_HEX_LENGTH = 64;
const XCODE_GROUP = 'RecipelyAssistant';
const INTENTS_SOURCE_DIR = path.join(
  'modules',
  'recipely-assistant-kit',
  'ios',
  'AppIntents',
);
const RESOURCES_SOURCE_DIR = path.join(
  'modules',
  'recipely-assistant-kit',
  'ios',
  'Resources',
);
const LOCALES_DIR = path.join('src', 'presentation', 'i18n', 'locales');
const SHORTCUTS_TEMPLATE = path.join(
  'modules',
  'recipely-assistant-kit',
  'android',
  'shortcuts',
  'recipely_shortcuts.xml',
);
const SHORTCUTS_SCHEME_TOKEN = '__RECIPELY_SCHEME__';
/**
 * The generated string tables, each one localized resource: the phrases the
 * user says, and the lines Siri says back (see `generate-app-shortcuts.mjs`).
 */
const STRINGS_FILES = ['AppShortcuts.strings', 'RecipelyIntents.strings'];

/**
 * `group.<bundle id>` — the convention Apple's own templates use.
 *
 * Throws rather than defaulting. A missing bundle identifier used to yield the
 * group `group.`, which is a plausible-looking string that signs, installs, and
 * then shares a container with nothing — the exact failure this plugin exists
 * to prevent, arriving silently.
 */
const appGroupFor = (bundleIdentifier) => {
  if (typeof bundleIdentifier !== 'string' || bundleIdentifier.length === 0) {
    throw new Error(
      '[withAssistantKit] ios.bundleIdentifier is not set — the App Group is derived from it',
    );
  }
  return `group.${bundleIdentifier}`;
};

/**
 * Expo's `scheme` may be a string or an array of them; the native side wants
 * one. The first is the canonical one — `app.config.ts` sets exactly one per
 * variant — and an array joined into the manifest would produce a scheme no
 * launcher can open.
 */
const primarySchemeOf = (scheme) => {
  const value = Array.isArray(scheme) ? scheme[0] : scheme;
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error('[withAssistantKit] expo.scheme is not set — shortcuts have no URL to open');
  }
  return value;
};

/**
 * The envelope key, as the native half will read it back, or `null`.
 *
 * Three decisions worth knowing:
 * - **Absent means absent, not zero.** `build-secrets.ts` falls back to a
 *   64-zero key so the JS client always has *something* to construct a cipher
 *   with. Mirroring that here would hand the native half a key the backend
 *   cannot match and no way to tell that from a real one — a headless answer
 *   that fails every request and blames the network. Without a key the native
 *   side reports "not configured", and the intent opens the app instead, which
 *   is a worse experience and a correct one.
 * - **Malformed throws.** A 63-character key is a typo in a secret, and the only
 *   symptom would be every headless request failing its auth tag in production.
 * - **Exposure is the same class as the JS bundle.** `Info.plist` and
 *   `AndroidManifest.xml` are both trivially readable from a shipped artifact —
 *   so is the string this key already occupies in the JS bundle. TLS is the
 *   transport protection; this envelope never was. `build-secrets.ts` says the
 *   same thing, and the two halves must not disagree about it.
 */
const envelopeKeyHex = () => {
  const raw = process.env.EXPO_PUBLIC_API_AES_KEY;
  if (typeof raw !== 'string' || raw.length === 0) return null;
  const key = raw.toLowerCase();
  if (!/^[0-9a-f]+$/.test(key) || key.length !== ENVELOPE_KEY_HEX_LENGTH) {
    throw new Error(
      `[withAssistantKit] EXPO_PUBLIC_API_AES_KEY must be ${ENVELOPE_KEY_HEX_LENGTH} hex characters (openssl rand -hex 32), got ${key.length}`,
    );
  }
  return key;
};

/**
 * Every `.swift` under `dir`, at any depth, returned as bare file names.
 *
 * The library groups its intents into `Entities/`, `Intents/` and `Shortcuts/`
 * so the folder stays readable, but the app target is flat — Xcode groups are
 * virtual and the copy lands everything side by side. Names are therefore
 * required to be unique across the tree, and a collision throws rather than
 * letting one intent silently overwrite another.
 */
const swiftFilesIn = (dir) => {
  if (!fs.existsSync(dir)) return [];
  const found = new Map();
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith('.swift')) {
        const previous = found.get(entry.name);
        if (previous !== undefined) {
          throw new Error(
            `[withAssistantKit] two Swift files are both named ${entry.name} (${previous}, ${full}) — the app target is flat`,
          );
        }
        found.set(entry.name, full);
      }
    }
  };
  walk(dir);
  return [...found.keys()].sort();
};

/**
 * The languages the app ships, read from the i18n catalogue rather than listed.
 *
 * A String Catalogue only compiles the languages named in the project's
 * `knownRegions`. Xcode's template knows `en` and `Base`, so without this the
 * fourteen translations are generated, copied, compiled away, and Siri answers
 * in English on every device — with nothing failing anywhere.
 */
const shippedLocales = (projectRoot) => {
  const dir = path.join(projectRoot, LOCALES_DIR);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.ts'))
    .map((name) => name.replace(/\.ts$/, ''))
    .sort();
};

/** The `<lang>.lproj` folders the generator wrote, as bare language codes. */
const localizedResourceDirs = (dir) =>
  fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .filter((name) => name.endsWith('.lproj'))
        .map((name) => name.replace(/\.lproj$/, ''))
        .sort()
    : [];

/** Where a given bare name actually lives, for the copy. */
const swiftSourcePath = (dir, name) => {
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.name === name) return full;
    }
  }
  return path.join(dir, name);
};

/**
 * Which backend the intents talk to — the rules `api-hosts.ts` applies.
 *
 * An App Intent runs with no JavaScript, so it cannot read `expoConfig.extra`
 * and cannot be told at runtime. The rules are applied here instead: the
 * `EXPO_PUBLIC_API_BASE_URL` override first, then `extra.variant` (which
 * `app.config.ts` sets and `api-hosts.ts` reads), then production — because a
 * dev build whose intents answered from the production backend would be wrong
 * in the one way nobody checks. One deliberate difference: an EMPTY override is
 * ignored here, where `??` there would yield a relative `/api/v1` that no
 * native caller can resolve. A test holds the two host literals together.
 */
const apiBaseUrl = (config) => {
  const override = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
  if (override !== undefined && override.length > 0) return `${override}/api/v1`;
  const host =
    config.extra?.variant === 'development'
      ? 'https://dev-api.recipely.net'
      : 'https://api.recipely.net';
  return `${host}/api/v1`;
};

const withAppGroupInfoPlist = (config) =>
  withInfoPlist(config, (mod) => {
    mod.modResults[APP_GROUP_INFO_KEY] = appGroupFor(mod.ios?.bundleIdentifier);
    mod.modResults[API_BASE_URL_INFO_KEY] = apiBaseUrl(mod);
    const key = envelopeKeyHex();
    // Deleted rather than left behind when there is no key: a stale value from a
    // previous prebuild is the one failure mode worse than none, because it
    // looks configured.
    if (key) {
      mod.modResults[ENVELOPE_KEY_INFO_KEY] = key;
    } else {
      delete mod.modResults[ENVELOPE_KEY_INFO_KEY];
    }
    return mod;
  });

const withAppGroupEntitlement = (config) =>
  withEntitlementsPlist(config, (mod) => {
    const group = appGroupFor(mod.ios?.bundleIdentifier);
    const existing = mod.modResults[APP_GROUP_ENTITLEMENT];
    const groups = Array.isArray(existing) ? existing : [];
    // De-duplicates the WHOLE list, not just this plugin's own addition.
    // `expo-share-intent` already declares `group.<bundle id>` — the very same
    // group, because both want the container the app itself owns — and a first
    // prebuild produced it twice. A repeated entitlement is not cosmetic: it
    // fails validation at signing. Checking only for our own entry would have
    // left the pair that two plugins created between them.
    mod.modResults[APP_GROUP_ENTITLEMENT] = [...new Set([...groups, group])];
    return mod;
  });

/** Copies the library's intent sources into the app target's folder on disk. */
const withCopiedIntentSources = (config) =>
  withDangerousMod(config, [
    'ios',
    (mod) => {
      const from = path.join(mod.modRequest.projectRoot, INTENTS_SOURCE_DIR);
      const to = path.join(
        mod.modRequest.platformProjectRoot,
        mod.modRequest.projectName ?? '',
        XCODE_GROUP,
      );
      fs.mkdirSync(to, { recursive: true });
      // Files deleted from the library must disappear from the app target too,
      // or a renamed intent ships twice under two names — and a language
      // dropped from `i18n/locales/` keeps shipping its phrases.
      for (const stale of swiftFilesIn(to)) fs.rmSync(path.join(to, stale));
      for (const entry of fs.readdirSync(to)) {
        if (entry.endsWith('.lproj')) fs.rmSync(path.join(to, entry), { recursive: true, force: true });
      }
      for (const name of swiftFilesIn(from)) {
        fs.copyFileSync(swiftSourcePath(from, name), path.join(to, name));
      }

      const resourcesFrom = path.join(mod.modRequest.projectRoot, RESOURCES_SOURCE_DIR);
      for (const code of localizedResourceDirs(resourcesFrom)) {
        const lproj = `${code}.lproj`;
        fs.mkdirSync(path.join(to, lproj), { recursive: true });
        for (const name of STRINGS_FILES) {
          fs.copyFileSync(path.join(resourcesFrom, lproj, name), path.join(to, lproj, name));
        }
      }
      return mod;
    },
  ]);

/** Registers those copies with the app target so they are actually compiled. */
const withIntentSourcesInTarget = (config) =>
  withXcodeProject(config, (mod) => {
    const project = mod.modResults;
    const projectName = mod.modRequest.projectName ?? '';
    const names = swiftFilesIn(
      path.join(mod.modRequest.projectRoot, INTENTS_SOURCE_DIR),
    );
    const locales = localizedResourceDirs(
      path.join(mod.modRequest.projectRoot, RESOURCES_SOURCE_DIR),
    );
    // Both halves, not just the Swift: a library with phrases and no intents
    // still has resources to register, and skipping on the Swift count alone
    // would silently drop them.
    if (names.length === 0 && locales.length === 0) return mod;

    // Truthiness, not `!== undefined`. `pbxGroupByName` answers `null` for a
    // group that does not exist, so an `undefined` check reported the group as
    // present on a clean prebuild, asked for a key that was never there, and
    // handed `addSourceFile` no group at all — which silently falls through to
    // `addPluginFile` and dies inside the `xcode` library on a null path.
    const groupKey =
      project.findPBXGroupKey({ name: XCODE_GROUP }) || createGroup(project);

    const target = project.getFirstTarget().uuid;
    for (const name of names) {
      const relative = `${projectName}/${XCODE_GROUP}/${name}`;
      // `addSourceFile` happily adds a second build-phase entry for a path it
      // already has, and Xcode then fails with "duplicate output file".
      if (project.hasFile(relative)) continue;
      project.addSourceFile(relative, { target }, groupKey);
    }

    // Localized strings are a RESOURCE, not a source, and the fourteen copies
    // are ONE file to Xcode: a variant group, keyed by language. Added
    // individually they would each try to install at the same bundle path and
    // only the last would survive.
    for (const name of STRINGS_FILES) addLocalizedStrings(project, projectName, target, locales, name);

    addKnownRegions(project, shippedLocales(mod.modRequest.projectRoot));
    return mod;
  });

/**
 * Creates a VIRTUAL group — one with no `path` of its own.
 *
 * A group that carries a path is the folder its children are relative to, and
 * the file references added below are already project-relative. Giving the
 * group `RecipelyDev/RecipelyAssistant` too made Xcode look for
 * `RecipelyDev/RecipelyAssistant/RecipelyDev/RecipelyAssistant/…` and fail with
 * "Build input file cannot be found" — a path that exists nowhere, named twice.
 */
const createGroup = (project) => {
  const key = project.pbxCreateGroup(XCODE_GROUP);
  const mainGroup = project.getPBXGroupByKey(
    project.getFirstProject().firstProject.mainGroup,
  );
  mainGroup.children.push({ value: key, comment: XCODE_GROUP });
  return key;
};

/**
 * Registers `<lang>.lproj/<name>` as one localized resource.
 *
 * A variant group is how Xcode models "one file, many languages": the group
 * carries the base name and each child is a language. Registering the children
 * as ordinary resources instead would have them all install to
 * `AppShortcuts.strings` in the bundle root, where the last one copied wins and
 * the other thirteen vanish.
 */
const addLocalizedStrings = (project, projectName, target, locales, name) => {
  if (locales.length === 0) return;
  const existing = project.findPBXVariantGroupKey({ name });
  const groupKey = existing || project.pbxCreateVariantGroup(name);

  if (!existing) {
    const mainGroup = project.getPBXGroupByKey(
      project.getFirstProject().firstProject.mainGroup,
    );
    mainGroup.children.push({ value: groupKey, comment: name });
    addResourceToTarget(project, name, target, null, groupKey);
  }

  for (const code of locales) {
    const relative = `${projectName}/${XCODE_GROUP}/${code}.lproj/${name}`;
    if (project.hasFile(relative)) continue;
    const file = project.addFile(relative, groupKey, { target });
    if (!file) continue;
    // `pbxFile` derives `basename` from the path and ignores an `opt.basename`,
    // so the name has to be set afterwards. Xcode's convention is that a
    // variant child is named for its LANGUAGE — fourteen children all called
    // `AppShortcuts.strings` build, because XCBuild reads the region off the
    // path, but the project navigator then shows fourteen identical rows.
    file.basename = code;
    project.pbxFileReferenceSection()[file.fileRef].name = `"${code}"`;
  }
};

/**
 * Puts one file in the target's resources phase, the long way round.
 *
 * `xcode`'s own `addResourceFile` cannot be used: it calls
 * `pbxGroupByName('Resources').path`, and an Expo-generated project has no
 * group by that name, so the lookup answers `null` and the library dereferences
 * it. That is the same null-for-absent trap the group lookup sprang earlier in
 * this plugin, one function along. Everything below is public API and never
 * reaches the path-correcting branch.
 */
const addResourceToTarget = (project, relative, target, groupKey, fileRef) => {
  const file = fileRef === undefined ? project.addFile(relative, groupKey, { target }) : { path: relative, fileRef, basename: relative, group: 'Resources' };
  if (!file) return;
  file.uuid = project.generateUuid();
  file.target = target;
  project.addToPbxBuildFileSection(file);
  project.addToPbxResourcesBuildPhase(file);
};

/** Teaches the project which languages its catalogues are allowed to compile. */
const addKnownRegions = (project, locales) => {
  if (locales.length === 0) return;
  const root = project.getFirstProject().firstProject;
  const existing = Array.isArray(root.knownRegions) ? root.knownRegions : [];
  const merged = new Set(existing);
  for (const locale of locales) merged.add(locale);
  root.knownRegions = [...merged];
};

const withSchemeMetaData = (config) =>
  withAndroidManifest(config, (mod) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(mod.modResults);
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      application,
      ANDROID_SCHEME_META_DATA,
      primarySchemeOf(mod.scheme),
    );
    const key = envelopeKeyHex();
    if (key) {
      AndroidConfig.Manifest.addMetaDataItemToMainApplication(
        application,
        ANDROID_ENVELOPE_KEY_META_DATA,
        key,
      );
    } else {
      AndroidConfig.Manifest.removeMetaDataItemFromMainApplication(
        application,
        ANDROID_ENVELOPE_KEY_META_DATA,
      );
    }
    addShortcutsMetaData(application);
    return mod;
  });

/**
 * Points the launcher at the generated shortcuts.
 *
 * The meta-data has to sit on the launcher ACTIVITY, not on `<application>` —
 * Android reads it from the activity answering `MAIN`/`LAUNCHER`, and on
 * `<application>` it is ignored with no warning, which looks exactly like a
 * `shortcuts.xml` that failed to merge.
 */
const addShortcutsMetaData = (application) => {
  const launcher = (application.activity ?? []).find((activity) =>
    (activity['intent-filter'] ?? []).some((filter) =>
      (filter.action ?? []).some(
        (action) => action.$?.['android:name'] === 'android.intent.action.MAIN',
      ),
    ),
  );
  if (launcher === undefined) return;

  launcher['meta-data'] = launcher['meta-data'] ?? [];
  const already = launcher['meta-data'].some(
    (item) => item.$?.['android:name'] === ANDROID_SHORTCUTS_META_DATA,
  );
  if (already) return;
  launcher['meta-data'].push({
    $: {
      'android:name': ANDROID_SHORTCUTS_META_DATA,
      'android:resource': ANDROID_SHORTCUTS_RESOURCE,
    },
  });
};

/**
 * Writes the launcher shortcuts into the APP's resources, scheme resolved.
 *
 * The generator leaves the scheme as a token because it differs per variant and
 * is not known until prebuild. It cannot ship the resolved file in the library's
 * own `res/` either — two `recipely_shortcuts.xml` would collide at merge — so
 * the template lives outside `res/` and lands here instead.
 *
 * A scheme-less `android:data` is not a smaller failure than a wrong one: it
 * matches `NO_MATCH_DATA` against every filter on the launcher activity, so the
 * shortcut shows in the menu and does nothing at all when tapped.
 */
const withResolvedShortcuts = (config) =>
  withDangerousMod(config, [
    'android',
    (mod) => {
      const template = path.join(mod.modRequest.projectRoot, SHORTCUTS_TEMPLATE);
      if (!fs.existsSync(template)) return mod;

      const scheme = primarySchemeOf(mod.scheme);
      const resolved = fs
        .readFileSync(template, 'utf8')
        .split(SHORTCUTS_SCHEME_TOKEN)
        .join(scheme);

      const out = path.join(
        mod.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'xml',
      );
      fs.mkdirSync(out, { recursive: true });
      fs.writeFileSync(path.join(out, 'recipely_shortcuts.xml'), resolved);
      return mod;
    },
  ]);

const withAssistantKit = (config) => {
  let next = withAppGroupInfoPlist(config);
  next = withAppGroupEntitlement(next);
  next = withCopiedIntentSources(next);
  next = withIntentSourcesInTarget(next);
  next = withSchemeMetaData(next);
  next = withResolvedShortcuts(next);
  return next;
};

module.exports = withAssistantKit;
module.exports.appGroupFor = appGroupFor;
module.exports.APP_GROUP_INFO_KEY = APP_GROUP_INFO_KEY;
module.exports.API_BASE_URL_INFO_KEY = API_BASE_URL_INFO_KEY;
module.exports.APP_GROUP_ENTITLEMENT = APP_GROUP_ENTITLEMENT;
module.exports.ANDROID_SCHEME_META_DATA = ANDROID_SCHEME_META_DATA;
module.exports.ENVELOPE_KEY_INFO_KEY = ENVELOPE_KEY_INFO_KEY;
module.exports.ANDROID_ENVELOPE_KEY_META_DATA = ANDROID_ENVELOPE_KEY_META_DATA;
module.exports.XCODE_GROUP = XCODE_GROUP;
