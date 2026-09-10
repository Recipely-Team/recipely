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
      },
    },
  };
});

const mockFiles = new Map();
jest.mock('node:fs', () => ({
  existsSync: (p) => mockFiles.has(p),
  readdirSync: (p) => mockFiles.get(p) ?? [],
  mkdirSync: jest.fn(),
  rmSync: jest.fn(),
  copyFileSync: jest.fn(),
}));

const fs = require('node:fs');
const withAssistantKit = require('../withAssistantKit');

const INTENTS_DIR = path.join('/repo', 'modules', 'recipely-assistant-kit', 'ios', 'AppIntents');
const TARGET_DIR = '/repo/ios/Recipely/RecipelyAssistant';

function xcodeProject({ hasFile = () => false, groupKey = null } = {}) {
  const added = [];
  const createGroup = jest.fn(() => 'NEWGROUP');
  return {
    added,
    createGroup,
    // The real `xcode` library answers `null`, not `undefined`, when the group
    // is absent — which is exactly what the first prebuild tripped over.
    findPBXGroupKey: () => groupKey,
    pbxCreateGroup: createGroup,
    getPBXGroupByKey: () => ({ children: [] }),
    getFirstProject: () => ({ firstProject: { mainGroup: 'MAIN' } }),
    getFirstTarget: () => ({ uuid: 'TARGET' }),
    hasFile,
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

  it('does nothing to the project when the library declares no intents', () => {
    const xcode = xcodeProject();

    withAssistantKit(baseConfig({ xcode }));

    expect(xcode.added).toEqual([]);
    expect(xcode.createGroup).not.toHaveBeenCalled();
  });
});
