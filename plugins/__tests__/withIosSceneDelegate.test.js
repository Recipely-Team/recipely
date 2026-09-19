const path = require('node:path');

// The mods normally defer until prebuild runs them against a real project.
// Running each callback immediately lets the plugin be driven with stubs.
jest.mock('@expo/config-plugins', () => ({
  withDangerousMod: (config, [, callback]) => callback(config),
  withXcodeProject: (config, callback) => callback(config),
  withInfoPlist: (config, callback) => callback(config),
}));

const mockFiles = new Map();
const mockPresent = new Set();

jest.mock('node:fs', () => ({
  existsSync: (p) => mockPresent.has(p),
  readFileSync: (p) => {
    if (!mockFiles.has(p)) throw new Error(`unexpected read: ${p}`);
    return mockFiles.get(p);
  },
  writeFileSync: (p, contents) => mockFiles.set(p, contents),
}));

const withIosSceneDelegate = require('../withIosSceneDelegate');

const PROJECT = 'RecipelyDev';
const PROJECT_ROOT = '/repo';
const IOS_ROOT = path.join(PROJECT_ROOT, 'ios');
const appDelegatePath = path.join(IOS_ROOT, PROJECT, 'AppDelegate.swift');
const sceneDelegatePath = path.join(IOS_ROOT, PROJECT, 'SceneDelegate.swift');
const firebaseModulePath = path.join(PROJECT_ROOT, 'node_modules', '@react-native-firebase', 'app');

// The templates themselves, byte for byte — not an approximation of them. This
// plugin's entire job is rewriting one specific generated file, so a fixture
// that merely resembles it tests the fixture. `sdk-57` is what `expo prebuild`
// writes today, with @react-native-firebase/app's block inserted exactly where
// its plugin puts it; `sdk-58` is what the template becomes, and the case where
// this plugin must do nothing at all.
const fixture = (name) =>
  jest.requireActual('node:fs').readFileSync(path.join(__dirname, '__fixtures__', `${name}.swift`), 'utf8');

const SDK_57 = fixture('sdk-57-app-delegate');
const SDK_58 = fixture('sdk-58-app-delegate');

const fakeConfig = () => ({
  modRequest: {
    projectRoot: PROJECT_ROOT,
    platformProjectRoot: IOS_ROOT,
    projectName: PROJECT,
  },
  modResults: {
    hasFile: jest.fn(() => false),
    findPBXGroupKey: jest.fn(() => 'GROUP_KEY'),
    getTarget: jest.fn(() => ({ uuid: 'APP_TARGET_UUID' })),
    addSourceFile: jest.fn(),
  },
});

const run = (appDelegate = SDK_57, { firebaseInstalled = true } = {}) => {
  mockFiles.clear();
  mockPresent.clear();
  if (firebaseInstalled) mockPresent.add(firebaseModulePath);
  mockFiles.set(appDelegatePath, appDelegate);
  const config = fakeConfig();
  withIosSceneDelegate(config);
  return config;
};

describe('withIosSceneDelegate — the black screen on iOS 27', () => {
  // The symptom: on iOS 27 the app launched to a black screen. A complete
  // UIApplicationSceneManifest stopped the launch assertion and changed
  // nothing on screen, because AppDelegate still built the window itself and
  // UIKit never presents it under the scene life cycle.
  it('stops the app delegate creating the window and starting React Native', () => {
    run();
    const rewritten = mockFiles.get(appDelegatePath);

    expect(rewritten).not.toContain('UIWindow(frame: UIScreen.main.bounds)');
    expect(rewritten).not.toContain('factory.startReactNative(');
    // The whole multi-line call goes, not just its first line.
    expect(rewritten).not.toContain('withModuleName: "main"');
  });

  it('declares the conformance ExpoAppSceneDelegate looks for', () => {
    run();

    expect(mockFiles.get(appDelegatePath)).toContain(
      'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {',
    );
  });

  // `provider.window` is assigned by the scene delegate, so the property has to
  // survive — removing it with the assignment would not compile.
  it('keeps the window property the protocol requires', () => {
    run();

    expect(mockFiles.get(appDelegatePath)).toContain('var window: UIWindow?');
  });

  // A mis-scan that stopped at the wrong `)` would take these with it and still
  // produce something that looks like a Swift file.
  it('leaves the rest of didFinishLaunchingWithOptions standing', () => {
    run();
    const rewritten = mockFiles.get(appDelegatePath);

    expect(rewritten).toContain('return super.application(application, didFinishLaunchingWithOptions: launchOptions)');
    expect(rewritten).toContain('#endif');
    expect(rewritten).toContain('delegate.dependencyProvider = RCTAppDependencyProvider()');
  });

  // Firebase anchors FirebaseApp.configure() on the very call removed above. If
  // this plugin ever runs BEFORE it, Firebase finds no anchor and never
  // initialises, in a build that still compiles green.
  it('leaves the Firebase initialisation it runs after', () => {
    run();

    expect(mockFiles.get(appDelegatePath)).toContain('FirebaseApp.configure()');
  });

  it('writes a SceneDelegate that subclasses the Expo one', () => {
    run();

    expect(mockFiles.get(sceneDelegatePath)).toContain('class SceneDelegate: ExpoAppSceneDelegate');
  });

  // BY PRODUCT TYPE. expo-share-intent adds a second native target, and a
  // SceneDelegate compiled into the extension does not exist at launch.
  it('registers the SceneDelegate in the application target, not merely the first', () => {
    const config = run();

    expect(config.modResults.getTarget).toHaveBeenCalledWith('com.apple.product-type.application');
    expect(config.modResults.addSourceFile).toHaveBeenCalledWith(
      `${PROJECT}/SceneDelegate.swift`,
      { target: 'APP_TARGET_UUID' },
      'GROUP_KEY',
    );
  });

  it('names that class in the scene manifest, or UIKit has nothing to ask', () => {
    const config = run();

    expect(config.modResults.UIApplicationSceneManifest).toEqual({
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
          },
        ],
      },
    });
  });

  it('adds the source file only once, so Xcode gets no duplicate output', () => {
    mockFiles.clear();
    mockPresent.clear();
    mockPresent.add(firebaseModulePath);
    mockFiles.set(appDelegatePath, SDK_57);
    const config = fakeConfig();
    config.modResults.hasFile = jest.fn(() => true);

    withIosSceneDelegate(config);

    expect(config.modResults.addSourceFile).not.toHaveBeenCalled();
  });

  // A prebuild without --clean runs the plugin over its own output.
  it('is safe to run twice', () => {
    run();
    const once = mockFiles.get(appDelegatePath);
    mockFiles.set(appDelegatePath, once);
    withIosSceneDelegate(fakeConfig());

    expect(mockFiles.get(appDelegatePath)).toBe(once);
  });
});

describe('withIosSceneDelegate — the SDK 58 template, which does this itself', () => {
  // The next real input this code sees. When the repo moves to SDK 58 the
  // template already adopts the scene delegate, and this plugin must leave it
  // alone — an idempotency check that got this wrong would ship a black screen.
  it('leaves an app delegate that already adopts the scene life cycle', () => {
    run(SDK_58, { firebaseInstalled: false });

    expect(mockFiles.get(appDelegatePath)).toBe(SDK_58);
  });
});

describe('withIosSceneDelegate — a template it no longer recognises', () => {
  // Silence here would ship a black screen with a config that still reads
  // right, which is the one outcome this plugin exists to prevent.
  it('throws rather than leaving the app delegate as it found it', () => {
    const renamed = SDK_57.replace(
      'class AppDelegate: ExpoAppDelegate {',
      'class AppDelegate: SomethingElse {',
    );

    expect(() => run(renamed)).toThrow(/does not declare/);
  });

  it('throws when the window creation it removes is already gone', () => {
    const noWindow = SDK_57.replace('    window = UIWindow(frame: UIScreen.main.bounds)\n', '');

    expect(() => run(noWindow)).toThrow(/never created the window/);
  });

  it('throws when startReactNative is missing, which also means Firebase lost its anchor', () => {
    const noStart = SDK_57.replace(
      /    factory\.startReactNative\([\s\S]*?launchOptions\)\n/,
      '',
    );

    expect(() => run(noStart)).toThrow(/plugin order/);
  });

  // Conformance alone is not proof the rewrite happened.
  it('throws on a delegate that conforms and still starts React Native itself', () => {
    const halfway = SDK_57.replace(
      'class AppDelegate: ExpoAppDelegate {',
      'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {',
    );

    expect(() => run(halfway)).toThrow(/black screen/);
  });
});

describe('withIosSceneDelegate — the ordering hazard check:structure rule AH guards', () => {
  // The failure this plugin cannot see from where it stands: run it BEFORE
  // @react-native-firebase/app and Firebase finds no anchor, warns into a log
  // nobody reads, and never initialises. The AppDelegate still looks correct.
  it('throws when Firebase is installed but never initialised in the delegate', () => {
    const noFirebase = SDK_57.replace(/^\/\/ @generated begin[\s\S]*?@generated end.*\n/m, '');

    expect(() => run(noFirebase)).toThrow(/must run AFTER it/);
  });

  it('says nothing about Firebase when Firebase is not installed', () => {
    const noFirebase = SDK_57.replace(/^\/\/ @generated begin[\s\S]*?@generated end.*\n/m, '');

    expect(() => run(noFirebase, { firebaseInstalled: false })).not.toThrow();
  });
});
