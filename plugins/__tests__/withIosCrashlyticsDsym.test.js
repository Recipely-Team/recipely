// `withXcodeProject` normally defers the callback until prebuild runs it against
// a real project. Running it immediately lets the plugin be driven with a stub.
jest.mock('@expo/config-plugins', () => ({
  withXcodeProject: (config, callback) => callback(config),
}));

const withIosCrashlyticsDsym = require('../withIosCrashlyticsDsym');

// The parts of the `xcode` project object this plugin actually touches.
function fakeProject({ existingPhases = {}, configurations = {} } = {}) {
  return {
    modResults: {
      hash: { project: { objects: { PBXShellScriptBuildPhase: existingPhases } } },
      addBuildPhase: jest.fn(),
      pbxXCBuildConfigurationSection: () => configurations,
    },
  };
}

const addedPhaseOptions = (mod) => mod.modResults.addBuildPhase.mock.calls[0][4];

describe('withIosCrashlyticsDsym — pbxproj syntax', () => {
  // The iOS production build died in `pod install`, before compiling anything:
  //   Nanaimo::Reader::ParseError - [!] Array missing ',' in between objects
  // `xcode` writes an inputPaths entry into the pbxproj verbatim, and
  // `${A}/${B}` without quotes is two plist tokens, not one. Nobody caught it
  // because dev iOS builds are opt-in, so no iOS build ran this plugin between
  // the day it landed and the day it shipped to TestFlight.
  it('quotes the dSYM input path so CocoaPods can parse the project', () => {
    const mod = fakeProject();

    withIosCrashlyticsDsym(mod);

    const [inputPath] = addedPhaseOptions(mod).inputPaths;
    expect(inputPath).toBe('"${DWARF_DSYM_FOLDER_PATH}/${DWARF_DSYM_FILE_NAME}"');
  });

  // The rule the case above is an instance of: any pbxproj value carrying a
  // build-setting reference or a path separator has to arrive already quoted.
  it('quotes every emitted value that interpolates a build setting', () => {
    const mod = fakeProject();

    withIosCrashlyticsDsym(mod);

    const { inputPaths, shellScript } = addedPhaseOptions(mod);
    for (const value of [...inputPaths, shellScript]) {
      for (const token of value.match(/\S*\$\{[^}]+\}\S*/g) ?? []) {
        expect(token).toMatch(/^"|"$/);
      }
    }
  });
});

describe('withIosCrashlyticsDsym — build phase', () => {
  it('does not stack a second copy when a prebuild reruns', () => {
    const mod = fakeProject({
      existingPhases: { abc123: { name: '"[recipely] Upload Crashlytics dSYMs"' } },
    });

    withIosCrashlyticsDsym(mod);

    expect(mod.modResults.addBuildPhase).not.toHaveBeenCalled();
  });
});

describe('withIosCrashlyticsDsym — debug information format', () => {
  it('forces dwarf-with-dsym on Release so there are symbols to upload', () => {
    const release = { name: 'Release', buildSettings: {} };
    const debug = { name: 'Debug', buildSettings: {} };
    const mod = fakeProject({ configurations: { r: release, d: debug } });

    withIosCrashlyticsDsym(mod);

    expect(release.buildSettings.DEBUG_INFORMATION_FORMAT).toBe('"dwarf-with-dsym"');
    expect(debug.buildSettings.DEBUG_INFORMATION_FORMAT).toBeUndefined();
  });

  it('skips entries that carry no build settings', () => {
    const mod = fakeProject({ configurations: { comment: 'PBXProject section', empty: {} } });

    expect(() => withIosCrashlyticsDsym(mod)).not.toThrow();
  });
});
