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

describe('withIosCrashlyticsDsym — build graph', () => {
  // Two failures, one line. Declaring the dSYM as an input first broke
  // `pod install` (unquoted `${A}/${B}` is two plist tokens, so CocoaPods threw
  // "Array missing ',' in between objects"). Quoting it fixed the parse and
  // exposed the real problem underneath: with a share extension in the target,
  // embedding the .appex waits on this phase, this phase waits on the dSYM, and
  // the dSYM waits on the linked app — "Cycle inside Recipely", no archive.
  //
  // The script already receives the dSYM path in its own arguments, so the
  // input declaration bought nothing and cost the cycle.
  it('declares no build inputs, so embedding the share extension cannot cycle', () => {
    const mod = fakeProject();

    withIosCrashlyticsDsym(mod);

    expect(addedPhaseOptions(mod).inputPaths).toEqual([]);
  });

  it('still passes the dSYM path to the upload script itself', () => {
    const mod = fakeProject();

    withIosCrashlyticsDsym(mod);

    expect(addedPhaseOptions(mod).shellScript).toContain(
      '-p ios "${DWARF_DSYM_FOLDER_PATH}/${DWARF_DSYM_FILE_NAME}"',
    );
  });

  // Whatever the phase does emit into the pbxproj still has to be quoted — that
  // is what the `pod install` failure taught, and it stays true for the script.
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
