const path = require('node:path');

// The mods normally defer until prebuild runs them against a real project.
// Running each callback immediately lets the plugin be driven with stubs.
jest.mock('@expo/config-plugins', () => ({
  withDangerousMod: (config, [, callback]) => callback(config),
  withXcodeProject: (config, callback) => callback(config),
  withInfoPlist: (config, callback) => callback(config),
}));

const mockFiles = new Map();

jest.mock('node:fs', () => ({
  readFileSync: (p) => {
    if (!mockFiles.has(p)) throw new Error(`unexpected read: ${p}`);
    return mockFiles.get(p);
  },
  writeFileSync: (p, contents) => mockFiles.set(p, contents),
}));

const withIosSceneDelegate = require('../withIosSceneDelegate');

const PROJECT = 'RecipelyDev';
const IOS_ROOT = '/repo/ios';
const appDelegatePath = path.join(IOS_ROOT, PROJECT, 'AppDelegate.swift');
const sceneDelegatePath = path.join(IOS_ROOT, PROJECT, 'SceneDelegate.swift');

// The SDK 57 prebuild template, after @react-native-firebase/app has inserted
// its block — which is the order this plugin requires, and the reason the whole
// `#if` is reproduced here rather than trimmed to the interesting lines.
const TEMPLATE_APP_DELEGATE = `internal import Expo
import FirebaseCore
import React

@main
class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let factory = ExpoReactNativeFactory(delegate: delegate)
    reactNativeFactory = factory

#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
// @generated begin @react-native-firebase/app-didFinishLaunchingWithOptions
FirebaseApp.configure()
// @generated end @react-native-firebase/app-didFinishLaunchingWithOptions
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
`;

const fakeConfig = () => ({
  modRequest: { platformProjectRoot: IOS_ROOT, projectName: PROJECT },
  modResults: {
    hasFile: jest.fn(() => false),
    findPBXGroupKey: jest.fn(() => 'GROUP_KEY'),
    getFirstTarget: jest.fn(() => ({ uuid: 'TARGET_UUID' })),
    addSourceFile: jest.fn(),
  },
});

const run = (appDelegate = TEMPLATE_APP_DELEGATE) => {
  mockFiles.clear();
  mockFiles.set(appDelegatePath, appDelegate);
  const config = fakeConfig();
  withIosSceneDelegate(config);
  return config;
};

describe('withIosSceneDelegate — the black screen on iOS 27', () => {
  // The symptom: on iOS 27 the app launched to a black screen. A complete
  // UIApplicationSceneManifest stopped the launch assertion but changed
  // nothing on screen, because AppDelegate still built the window itself and
  // UIKit never presented it under the scene life cycle.
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
  // survive — removing it along with the assignment would not compile.
  it('keeps the window property the protocol requires', () => {
    run();

    expect(mockFiles.get(appDelegatePath)).toContain('var window: UIWindow?');
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

    expect(mockFiles.get(sceneDelegatePath)).toContain(
      'class SceneDelegate: ExpoAppSceneDelegate',
    );
  });

  it('registers the SceneDelegate in the target, or Xcode never compiles it', () => {
    const config = run();

    expect(config.modResults.addSourceFile).toHaveBeenCalledWith(
      `${PROJECT}/SceneDelegate.swift`,
      { target: 'TARGET_UUID' },
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
    mockFiles.set(appDelegatePath, TEMPLATE_APP_DELEGATE);
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

describe('withIosSceneDelegate — a template it no longer recognises', () => {
  // Silence here would ship a black screen with a config that still reads
  // right, which is the one outcome this plugin exists to prevent.
  it('throws rather than leaving the app delegate as it found it', () => {
    const renamed = TEMPLATE_APP_DELEGATE.replace(
      'class AppDelegate: ExpoAppDelegate {',
      'class AppDelegate: SomethingElse {',
    );

    expect(() => run(renamed)).toThrow(/does not declare/);
  });

  it('throws when the window creation it removes is already gone', () => {
    const noWindow = TEMPLATE_APP_DELEGATE.replace(
      '    window = UIWindow(frame: UIScreen.main.bounds)\n',
      '',
    );

    expect(() => run(noWindow)).toThrow(/never created the window/);
  });

  it('throws when startReactNative is missing, which also means Firebase lost its anchor', () => {
    const noStart = TEMPLATE_APP_DELEGATE.replace(
      /    factory\.startReactNative\([\s\S]*?launchOptions\)\n/,
      '',
    );

    expect(() => run(noStart)).toThrow(/plugin order/);
  });
});
