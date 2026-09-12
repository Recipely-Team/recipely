/* eslint-disable import/first -- jest.mock() must be hoisted above imports */

// The audio package reaches for the native recorder at module load, and there
// is none in a test process. The stub only has to let the module LOAD: this
// suite asks what the umbrella re-exports, never what the microphone does.
jest.mock('react-native-audio-api', () => ({
  AudioManager: {
    requestRecordingPermissions: async () => 'Granted',
    setAudioSessionOptions: () => undefined,
    setAudioSessionActivity: async () => undefined,
  },
  AudioRecorder: class {},
  AudioContext: class {},
}));

// `import/namespace` cannot enumerate this module: everything in it arrives
// through `export *` from another package, which is the one thing the rule
// does not follow — and is exactly what this suite is here to check at
// runtime instead.
// eslint-disable-next-line import/namespace
import * as kit from '../index';

/**
 * The umbrella package's only job is that every name is still reachable
 * through it.
 *
 * `export *` is silent about what it did not export: a package renamed, a
 * dependency dropped from package.json, or a member whose own index stopped
 * exporting something all leave this file compiling and the re-export simply
 * gone. An installer would find out by importing a name that is no longer
 * there.
 *
 * One name per member package, chosen as the thing an integrator reaches for
 * first — if that one survived the re-export, the package is wired in.
 */
describe('@live-assistant/react-native', () => {
  it.each([
    ['core', 'AssistantController'],
    ['gemini', 'GeminiLiveSession'],
    ['audio', 'Microphone'],
    ['react', 'AssistantProvider'],
    ['widget', 'AssistantWidget'],
  ])('re-exports %s', (_member, name) => {
    expect(kit).toHaveProperty(name);
  });

  // The token server mints credentials with an API key. It is installed where
  // it runs, and must never arrive inside an app bundle by accident.
  it('does not carry the token server into the app bundle', () => {
    expect(kit).not.toHaveProperty('mintGeminiLiveToken');
  });
});
