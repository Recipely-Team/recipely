const path = require('node:path');

// Every `with*` helper normally defers its callback until prebuild runs it, and
// each one is handed its OWN `modResults` — an Info.plist object, an
// entitlements object, an xcode project, a parsed manifest. The stubs below
// reproduce that: a test puts the shapes it cares about in `__mods` and asserts
// on them afterwards. Running them all against one object, the way a naive stub
// would, is not how prebuild works and hides ordering bugs.
jest.mock('@expo/config-plugins', () => {
  const run = (key) => (config, cb) => cb({ ...config, modResults: config.__mods[key] });
  return {
    withInfoPlist: run('infoPlist'),
    withEntitlementsPlist: run('entitlements'),
    withXcodeProject: run('xcode'),
    withAndroidManifest: run('manifest'),
    withDangerousMod: (config, [, cb]) => cb({ ...config, modResults: {} }),
    AndroidConfig: {
      Manifest: {
        getMainApplicationOrThrow: (manifest) => manifest.manifest.application[0],
        addMetaDataItemToMainApplication: (application, name, value) => {
          application['meta-data'] = application['meta-data'] ?? [];
          application['meta-data'].push({
            $: { 'android:name': name, 'android:value': value },
          });
        },
        removeMetaDataItemFromMainApplication: (application, name) => {
          application['meta-data'] = (application['meta-data'] ?? []).filter(
            (item) => item.$['android:name'] !== name,
          );
        },
      },
    },
  };
});

const mockFiles = new Map();
// `readdirSync` is called with `{ withFileTypes: true }` for the recursive walk
// and bare for the stale sweep, so the mock answers both shapes: an entry that
// exists as a key in `mockFiles` is a directory, anything else is a file.
jest.mock('node:fs', () => {
  const path = require('node:path');
  return {
    existsSync: (p) => mockFiles.has(p),
    readdirSync: (p, options) => {
      const names = mockFiles.get(p) ?? [];
      if (options?.withFileTypes !== true) return names;
      return names.map((name) => ({
        name,
        isDirectory: () => mockFiles.has(path.join(p, name)),
      }));
    },
    mkdirSync: jest.fn(),
    rmSync: jest.fn(),
    copyFileSync: jest.fn(),
  };
});

const fs = require('node:fs');
const withAssistantKit = require('../withAssistantKit');

const INTENTS_DIR = path.join('/repo', 'modules', 'recipely-assistant-kit', 'ios', 'AppIntents');
const TARGET_DIR = '/repo/ios/Recipely/RecipelyAssistant';
const RESOURCES_DIR = path.join('/repo', 'modules', 'recipely-assistant-kit', 'ios', 'Resources');
const LOCALES_DIR = path.join('/repo', 'src', 'presentation', 'i18n', 'locales');

function xcodeProject({ hasFile = () => false, groupKey = null, variantKey = null } = {}) {
  const added = [];
  const createGroup = jest.fn(() => 'NEWGROUP');
  const fileRefs = {};
  return {
    added,
    createGroup,
    // The real `xcode` library answers `null`, not `undefined`, when the group
    // is absent — which is exactly what the first prebuild tripped over.
    findPBXGroupKey: () => groupKey,
    pbxCreateGroup: createGroup,
    getPBXGroupByKey: () => ({ children: [] }),
    getFirstProject() {
      this.firstProject = this.firstProject ?? { mainGroup: 'MAIN', knownRegions: ['en', 'Base'] };
      return { firstProject: this.firstProject };
    },
    getFirstTarget: () => ({ uuid: 'TARGET' }),
    hasFile,
    fileRefs,
    variantChildren: [],
    createVariantGroup: jest.fn(() => 'VARIANTGROUP'),
    findPBXVariantGroupKey: () => variantKey,
    pbxCreateVariantGroup(...args) {
      return this.createVariantGroup(...args);
    },
    pbxFileReferenceSection: () => fileRefs,
    generateUuid: () => `UUID${Object.keys(fileRefs).length}`,
    addFile(relative, group, options) {
      const fileRef = `REF${Object.keys(fileRefs).length}`;
      fileRefs[fileRef] = { path: relative };
      const file = { path: relative, fileRef, group, options };
      this.variantChildren.push(file);
      return file;
    },
    addToPbxBuildFileSection: jest.fn(),
    addToPbxResourcesBuildPhase: jest.fn(),
    addSourceFile: (relative, options, groupKey) => added.push({ relative, options, groupKey }),
  };
}

function baseConfig({ xcode = xcodeProject(), entitlements = {} } = {}) {
  return {
    scheme: 'recipely-dev',
    ios: { bundleIdentifier: 'net.recipely.app.dev' },
    modRequest: {
      projectRoot: '/repo',
      platformProjectRoot: '/repo/ios',
      projectName: 'Recipely',
    },
    __mods: {
      infoPlist: {},
      entitlements,
      xcode,
      manifest: { manifest: { application: [{}] } },
    },
  };
}

beforeEach(() => {
  mockFiles.clear();
  jest.clearAllMocks();
});

describe('withAssistantKit — variant-derived identifiers', () => {
  // A compiled-in App Group would have pointed the dev build's intents at the
  // production container — the same class of mistake app.config.ts already
  // avoids for the Google URL scheme and the AdMob app ids.
  it('derives the App Group from the variant bundle identifier', () => {
    const config = baseConfig();

    withAssistantKit(config);

    expect(config.__mods.infoPlist.RecipelyAssistantAppGroup).toBe(
      'group.net.recipely.app.dev',
    );
    expect(config.__mods.entitlements['com.apple.security.application-groups']).toEqual([
      'group.net.recipely.app.dev',
    ]);
  });

  // The first prebuild shipped the group twice: `expo-share-intent` declares
  // `group.<bundle id>` too — the same container, wanted for the same reason —
  // and a repeated entitlement fails validation at signing. Checking only for
  // our own entry would have left the pair the two plugins made between them.
  it('collapses a group another plugin already declared', () => {
    const config = baseConfig({
      entitlements: {
        'com.apple.security.application-groups': ['group.net.recipely.app.dev'],
      },
    });

    withAssistantKit(config);

    expect(config.__mods.entitlements['com.apple.security.application-groups']).toEqual([
      'group.net.recipely.app.dev',
    ]);
  });

  it('keeps groups it did not add', () => {
    const config = baseConfig({
      entitlements: { 'com.apple.security.application-groups': ['group.something.else'] },
    });

    withAssistantKit(config);

    expect(config.__mods.entitlements['com.apple.security.application-groups']).toEqual([
      'group.something.else',
      'group.net.recipely.app.dev',
    ]);
  });

  // A missing bundle identifier used to yield the group `group.` — a
  // plausible-looking string that signs, installs, and shares a container with
  // nothing. Failing the prebuild is the only useful answer.
  it('refuses to build an App Group out of a missing bundle identifier', () => {
    const config = baseConfig();
    config.ios = {};

    expect(() => withAssistantKit(config)).toThrow(/bundleIdentifier/);
  });

  it('takes the first scheme when Expo was given a list of them', () => {
    const config = baseConfig();
    config.scheme = ['recipely-dev', 'recipely-legacy'];

    withAssistantKit(config);

    expect(
      config.__mods.manifest.manifest.application[0]['meta-data'][0].$['android:value'],
    ).toBe('recipely-dev');
  });

  it('writes the variant URL scheme into the Android manifest', () => {
    const config = baseConfig();

    withAssistantKit(config);

    expect(config.__mods.manifest.manifest.application[0]['meta-data']).toEqual([
      {
        $: {
          'android:name': 'net.recipely.assistantkit.SCHEME',
          'android:value': 'recipely-dev',
        },
      },
    ]);
  });
});

describe('withAssistantKit — the Siri phrases reach the app target', () => {
  const withLocales = (xcode) => {
    mockFiles.set(INTENTS_DIR, []);
    mockFiles.set(RESOURCES_DIR, ['tr.lproj', 'ja.lproj']);
    mockFiles.set(path.join(RESOURCES_DIR, 'tr.lproj'), ['AppShortcuts.strings', 'RecipelyIntents.strings']);
    mockFiles.set(path.join(RESOURCES_DIR, 'ja.lproj'), ['AppShortcuts.strings', 'RecipelyIntents.strings']);
    mockFiles.set(LOCALES_DIR, ['en.ts', 'ja.ts', 'tr.ts']);
    return baseConfig({ xcode });
  };

  // Fourteen copies are ONE file to Xcode. Registered individually they each
  // install to `AppShortcuts.strings` in the bundle root, where the last one
  // copied wins and the other thirteen vanish.
  it('registers the languages as children of a single variant group', () => {
    const xcode = xcodeProject();

    withAssistantKit(withLocales(xcode));

    expect(xcode.createVariantGroup).toHaveBeenCalledWith('AppShortcuts.strings');
    expect(xcode.variantChildren.map((child) => child.path)).toEqual(
      expect.arrayContaining([
        'Recipely/RecipelyAssistant/ja.lproj/AppShortcuts.strings',
        'Recipely/RecipelyAssistant/tr.lproj/AppShortcuts.strings',
      ]),
    );
  });

  // What Siri says back is a second table. Before it existed the follow-up
  // question was an English literal, so a Turkish phone asked it in English —
  // copied but unregistered, the table would compile into nothing.
  it('copies and registers the table Siri speaks from, per language', () => {
    const xcode = xcodeProject();

    withAssistantKit(withLocales(xcode));

    expect(xcode.createVariantGroup).toHaveBeenCalledWith('RecipelyIntents.strings');
    expect(xcode.variantChildren.map((child) => child.path)).toEqual(
      expect.arrayContaining([
        'Recipely/RecipelyAssistant/ja.lproj/RecipelyIntents.strings',
        'Recipely/RecipelyAssistant/tr.lproj/RecipelyIntents.strings',
      ]),
    );
    expect(fs.copyFileSync).toHaveBeenCalledWith(
      path.join(RESOURCES_DIR, 'tr.lproj', 'RecipelyIntents.strings'),
      `${TARGET_DIR}/tr.lproj/RecipelyIntents.strings`,
    );
  });

  // `pbxFile` derives basename from the path and ignores `opt.basename`, so
  // without setting it afterwards the navigator shows fourteen identical rows.
  it('names each child for its language, not for the file', () => {
    const xcode = xcodeProject();

    withAssistantKit(withLocales(xcode));

    expect(Object.values(xcode.fileRefs).map((ref) => ref.name)).toEqual(['"ja"', '"tr"', '"ja"', '"tr"']);
  });

  // A localized resource only compiles for languages the project lists, and
  // Xcode's default is `(en, Base)` — so without this the other twelve are
  // generated, copied, compiled away, and Siri answers in English everywhere.
  it('widens knownRegions to every language the app ships', () => {
    const xcode = xcodeProject();
    const config = withLocales(xcode);

    withAssistantKit(config);

    expect(xcode.getFirstProject().firstProject.knownRegions).toEqual(
      expect.arrayContaining(['en', 'Base', 'ja', 'tr']),
    );
  });

  it('does not create a second variant group when one already exists', () => {
    const xcode = xcodeProject({ variantKey: 'EXISTINGVARIANT' });

    withAssistantKit(withLocales(xcode));

    expect(xcode.createVariantGroup).not.toHaveBeenCalled();
  });

  // A language dropped from the catalogue keeps shipping its phrases otherwise,
  // because prebuild is not guaranteed to start from a clean target directory.
  it('sweeps a language folder the catalogue no longer ships', () => {
    const xcode = xcodeProject();
    mockFiles.set(TARGET_DIR, ['de.lproj']);

    withAssistantKit(withLocales(xcode));

    expect(fs.rmSync).toHaveBeenCalledWith(`${TARGET_DIR}/de.lproj`, {
      recursive: true,
      force: true,
    });
  });
});

describe('withAssistantKit — intent sources reach the app target', () => {
  // The whole reason this plugin exists: an intent left in the pod compiles and
  // is then invisible to Siri, because AppIntentsMetadataProcessor does not
  // extract metadata out of a static framework.
  it('registers each copied Swift file with the app target', () => {
    mockFiles.set(INTENTS_DIR, ['RecipelySearchIntent.swift', 'AskRecipelyIntent.swift']);
    const xcode = xcodeProject();

    withAssistantKit(baseConfig({ xcode }));

    expect(xcode.added.map((entry) => entry.relative)).toEqual([
      'Recipely/RecipelyAssistant/AskRecipelyIntent.swift',
      'Recipely/RecipelyAssistant/RecipelySearchIntent.swift',
    ]);
    expect(xcode.added.every((entry) => entry.options.target === 'TARGET')).toBe(true);
  });

  it('reuses the group when one already exists instead of creating a second', () => {
    mockFiles.set(INTENTS_DIR, ['RecipelySearchIntent.swift']);
    const xcode = xcodeProject({ groupKey: 'EXISTINGGROUP' });

    withAssistantKit(baseConfig({ xcode }));

    expect(xcode.createGroup).not.toHaveBeenCalled();
    expect(xcode.added[0].groupKey).toBe('EXISTINGGROUP');
  });

  // The symptom was `withIosXcodeprojBaseMod: Cannot read properties of null
  // (reading 'path')` on the very first prebuild. `pbxGroupByName` answers
  // `null` for an absent group, so an `!== undefined` check believed the group
  // existed, looked up a key that was never created, and passed `undefined` as
  // the group — which makes `addSourceFile` fall through to `addPluginFile`
  // and dereference a null path deep inside the `xcode` library.
  it('creates the group when the project reports null rather than undefined', () => {
    mockFiles.set(INTENTS_DIR, ['RecipelySearchIntent.swift']);
    const xcode = xcodeProject({ groupKey: null });

    withAssistantKit(baseConfig({ xcode }));

    expect(xcode.createGroup).toHaveBeenCalledTimes(1);
    expect(xcode.added[0].groupKey).toBe('NEWGROUP');
  });

  it('skips a file the project already carries, so Xcode cannot see a duplicate output', () => {
    mockFiles.set(INTENTS_DIR, ['RecipelySearchIntent.swift']);
    const xcode = xcodeProject({ hasFile: () => true });

    withAssistantKit(baseConfig({ xcode }));

    expect(xcode.added).toEqual([]);
  });

  // A renamed intent that is copied but never swept would ship twice, under
  // both names, and Siri would offer the dead one.
  it('clears stale copies out of the app target before copying', () => {
    mockFiles.set(INTENTS_DIR, ['New.swift']);
    mockFiles.set(TARGET_DIR, ['Old.swift']);

    withAssistantKit(baseConfig());

    expect(fs.rmSync).toHaveBeenCalledWith(`${TARGET_DIR}/Old.swift`);
    expect(fs.copyFileSync).toHaveBeenCalledWith(
      path.join(INTENTS_DIR, 'New.swift'),
      `${TARGET_DIR}/New.swift`,
    );
  });

  // The first real build failed with "Build input file cannot be found" on a
  // path that named the folder twice: the group carried
  // `RecipelyDev/RecipelyAssistant` as its own path AND each file reference was
  // already project-relative, so Xcode joined them. The group must be virtual.
  it('creates the group with no path of its own, so file paths are not doubled', () => {
    mockFiles.set(INTENTS_DIR, ['RecipelySearchIntent.swift']);
    const xcode = xcodeProject({ groupKey: null });

    withAssistantKit(baseConfig({ xcode }));

    expect(xcode.createGroup).toHaveBeenCalledWith('RecipelyAssistant');
    expect(xcode.createGroup.mock.calls[0]).toHaveLength(1);
  });

  // The library groups its intents into subfolders so the folder stays
  // readable; the app target is flat, and only a recursive walk finds them.
  it('finds intents nested in subfolders and copies them flat', () => {
    mockFiles.set(INTENTS_DIR, ['Entities', 'Intents']);
    mockFiles.set(path.join(INTENTS_DIR, 'Entities'), ['RecipeAppEntity.swift']);
    mockFiles.set(path.join(INTENTS_DIR, 'Intents'), ['RecipelyOpenRecipeIntent.swift']);
    const xcode = xcodeProject();

    withAssistantKit(baseConfig({ xcode }));

    expect(xcode.added.map((entry) => entry.relative)).toEqual([
      'Recipely/RecipelyAssistant/RecipeAppEntity.swift',
      'Recipely/RecipelyAssistant/RecipelyOpenRecipeIntent.swift',
    ]);
    expect(fs.copyFileSync).toHaveBeenCalledWith(
      path.join(INTENTS_DIR, 'Entities', 'RecipeAppEntity.swift'),
      `${TARGET_DIR}/RecipeAppEntity.swift`,
    );
  });

  // A flat destination cannot hold two files of one name, and the loser would
  // simply not be compiled — an intent Siri offers and nothing implements.
  it('refuses two Swift files that share a name across subfolders', () => {
    mockFiles.set(INTENTS_DIR, ['Entities', 'Intents']);
    mockFiles.set(path.join(INTENTS_DIR, 'Entities'), ['Shared.swift']);
    mockFiles.set(path.join(INTENTS_DIR, 'Intents'), ['Shared.swift']);

    expect(() => withAssistantKit(baseConfig())).toThrow(/both named Shared\.swift/);
  });

  it('does nothing to the project when the library declares no intents', () => {
    const xcode = xcodeProject();

    withAssistantKit(baseConfig({ xcode }));

    expect(xcode.added).toEqual([]);
    expect(xcode.createGroup).not.toHaveBeenCalled();
  });
});

// The headless path (finding D2) has no JS bridge, so it cannot read
// `build-secrets.ts`: the key has to arrive in the artifact. Info.plist and the
// manifest are the same exposure class as the JS bundle string it already lives
// in — that is stated in both places on purpose, so the two halves cannot come
// to different conclusions about it.
describe('withAssistantKit — the envelope key reaches the native half', () => {
  const KEY = 'a'.repeat(64);
  const metaDataNamed = (config, name) =>
    (config.__mods.manifest.manifest.application[0]['meta-data'] ?? []).find(
      (item) => item.$['android:name'] === name,
    );

  // Deleted BEFORE each case, not only after. Cleared only afterwards, the
  // "built without a key" case passed because the machine running it happened to
  // have no `EXPO_PUBLIC_API_AES_KEY` — which is the D15 trap biting the test
  // rather than the build: locally `.env.local` supplies one, and CI's test job is
  // the one job that does not.
  beforeEach(() => {
    delete process.env.EXPO_PUBLIC_API_AES_KEY;
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_API_AES_KEY;
  });

  it('writes the key into Info.plist and the Android manifest', () => {
    process.env.EXPO_PUBLIC_API_AES_KEY = KEY;
    const config = baseConfig();

    withAssistantKit(config);

    expect(config.__mods.infoPlist.RecipelyAssistantEnvelopeKey).toBe(KEY);
    expect(metaDataNamed(config, 'net.recipely.assistantkit.ENVELOPE_KEY').$['android:value']).toBe(KEY);
  });

  // `build-secrets.ts` lowercases the same value. If one half lowercased and the
  // other did not, a key typed in capitals would produce two different 32-byte
  // arrays and only the headless path would fail — on every request, with an
  // auth-tag error that looks like tampering.
  it('lowercases the key, because the JS half does', () => {
    process.env.EXPO_PUBLIC_API_AES_KEY = 'ABCDEF'.repeat(10) + 'abcd';
    const config = baseConfig();

    withAssistantKit(config);

    expect(config.__mods.infoPlist.RecipelyAssistantEnvelopeKey).toBe(
      ('ABCDEF'.repeat(10) + 'abcd').toLowerCase(),
    );
  });

  // A zero key would be worse than none: the native half cannot tell a wrong key
  // from a right one, so every request would fail its auth tag while the code
  // reported a network problem. Absent means "open the app instead".
  it('writes no key at all when the build was made without one', () => {
    const config = baseConfig();

    withAssistantKit(config);

    expect(config.__mods.infoPlist.RecipelyAssistantEnvelopeKey).toBeUndefined();
    expect(metaDataNamed(config, 'net.recipely.assistantkit.ENVELOPE_KEY')).toBeUndefined();
  });

  // A value from an earlier prebuild is the one state worse than none, because
  // it looks configured. Both artifacts are regenerated, but neither is
  // guaranteed to be empty when this mod runs.
  it('clears a key a previous prebuild left behind', () => {
    const config = baseConfig();
    config.__mods.infoPlist.RecipelyAssistantEnvelopeKey = 'b'.repeat(64);
    config.__mods.manifest.manifest.application[0]['meta-data'] = [
      { $: { 'android:name': 'net.recipely.assistantkit.ENVELOPE_KEY', 'android:value': 'b'.repeat(64) } },
    ];

    withAssistantKit(config);

    expect(config.__mods.infoPlist.RecipelyAssistantEnvelopeKey).toBeUndefined();
    expect(metaDataNamed(config, 'net.recipely.assistantkit.ENVELOPE_KEY')).toBeUndefined();
  });

  // A 63-character key is a typo in a secret, and the only symptom would be
  // every headless request failing in production. Better to fail the build.
  it('refuses a key that is not 64 hex characters', () => {
    process.env.EXPO_PUBLIC_API_AES_KEY = 'a'.repeat(63);

    expect(() => withAssistantKit(baseConfig())).toThrow(/64 hex characters/);

    process.env.EXPO_PUBLIC_API_AES_KEY = 'z'.repeat(64);

    expect(() => withAssistantKit(baseConfig())).toThrow(/64 hex characters/);
  });
});

// An intent answers with no JavaScript running, so it cannot ask `api-hosts.ts`
// which backend to use. A dev build whose Siri answers came from production
// would pass every check anyone runs by hand — the answer would simply be right.
describe('withAssistantKit — the intents reach the same backend the app does', () => {
  beforeEach(() => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
  });

  it('points a production build at production', () => {
    const config = baseConfig();

    withAssistantKit(config);

    expect(config.__mods.infoPlist.RecipelyAssistantApiBaseUrl).toBe('https://api.recipely.net/api/v1');
  });

  it('points the dev variant at the dev backend', () => {
    const config = { ...baseConfig(), extra: { variant: 'development' } };

    withAssistantKit(config);

    expect(config.__mods.infoPlist.RecipelyAssistantApiBaseUrl).toBe('https://dev-api.recipely.net/api/v1');
  });

  it('lets the override win over the variant, as api-hosts.ts does', () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'http://192.168.1.20:3000/';
    const config = { ...baseConfig(), extra: { variant: 'development' } };

    withAssistantKit(config);

    expect(config.__mods.infoPlist.RecipelyAssistantApiBaseUrl).toBe('http://192.168.1.20:3000/api/v1');
  });
});

// Both hosts are spelled twice — here for the intents, in `api-hosts.ts` for the
// app — and the Info.plist keys twice — here and in `RecipelyAssistantStore`.
// Either pair drifting fails silently: a wrong host answers from the wrong
// backend, a wrong key reads `nil` and every Siri answer quietly opens the app.
describe('withAssistantKit — the literals it shares with other files agree', () => {
  const realFs = jest.requireActual('node:fs');
  const read = (relative) => realFs.readFileSync(path.join(__dirname, '..', '..', relative), 'utf8');

  it('names the same two hosts api-hosts.ts does', () => {
    const hosts = read('src/infrastructure/constants/api/api-hosts.ts');
    const prod = hosts.match(/PROD_SERVER_URL = "([^"]+)"/)?.[1];
    const dev = hosts.match(/DEV_SERVER_URL = "([^"]+)"/)?.[1];

    const production = baseConfig();
    withAssistantKit(production);
    const development = { ...baseConfig(), extra: { variant: 'development' } };
    withAssistantKit(development);

    expect(production.__mods.infoPlist.RecipelyAssistantApiBaseUrl).toBe(`${prod}/api/v1`);
    expect(development.__mods.infoPlist.RecipelyAssistantApiBaseUrl).toBe(`${dev}/api/v1`);
  });

  it('writes the Info.plist keys the Swift store reads', () => {
    const store = read('modules/recipely-assistant-kit/ios/RecipelyAssistantStore.swift');

    for (const key of [
      withAssistantKit.APP_GROUP_INFO_KEY,
      withAssistantKit.API_BASE_URL_INFO_KEY,
      withAssistantKit.ENVELOPE_KEY_INFO_KEY,
    ]) {
      expect(store).toContain(`"${key}"`);
    }
  });
});
