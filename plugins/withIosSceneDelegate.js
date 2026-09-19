const fs = require('node:fs');
const path = require('node:path');
const { withDangerousMod, withInfoPlist, withXcodeProject } = require('@expo/config-plugins');

/**
 * Adopts the iOS scene life cycle, which the iOS 27 SDK requires.
 *
 * @remarks
 * - **Why this is a plugin and not a native edit.** `ios/` is git-ignored and
 *   rebuilt from scratch by every prebuild and every CI build, so the only
 *   place a native change can live is here.
 * - **Why it exists at all.** iOS 27 asserts at launch unless the app adopts
 *   the scene life cycle. Declaring `UIApplicationSceneManifest` alone stops
 *   the crash and then shows a BLACK SCREEN, because the window is still
 *   created in `didFinishLaunchingWithOptions` and nothing owns the scene —
 *   the app launches into a window UIKit never presents. Expo 57 ships the
 *   missing half, `ExpoAppSceneDelegate`, but its SDK 57 prebuild template
 *   still generates the app-life-cycle `AppDelegate`; the template adopts the
 *   scene delegate in SDK 58. This plugin applies the SDK 58 wiring to the
 *   SDK 57 template, using classes that are already in `expo@57`.
 * - **Three parts, and all three are needed.** The scene delegate class, the
 *   Info.plist entry naming it, and an `AppDelegate` that stops creating the
 *   window itself. Any two without the third is still a black screen.
 * - **ORDER MATTERS, and backwards.** Expo runs each mod and then the mod
 *   registered BEFORE it, so the LAST plugin in `app.json` runs FIRST — and
 *   this one has to run LAST, so it is registered FIRST. The reason is
 *   `@react-native-firebase/app`: it anchors `FirebaseApp.configure()` on the
 *   `factory.startReactNative(` call, which is the very call removed below.
 *   Run this one first and Firebase finds no anchor, logs a warning nobody
 *   reads, and never initialises — Auth, Analytics and Crashlytics all
 *   silently dead in a build that compiles green.
 * - **It throws rather than skipping.** A no-op here is a black screen on the
 *   only OS this exists for, and the config would still look right. Config is
 *   not the artifact, so each edit is asserted against the text it produced.
 */
const SCENE_DELEGATE_FILENAME = 'SceneDelegate.swift';
const SCENE_DELEGATE_CLASS = '$(PRODUCT_MODULE_NAME).SceneDelegate';
const SCENE_CONFIGURATION_NAME = 'Default Configuration';
const APPLICATION_SESSION_ROLE = 'UIWindowSceneSessionRoleApplication';
const FACTORY_PROVIDER_PROTOCOL = 'ExpoReactNativeFactoryProvider';

const SCENE_DELEGATE_SOURCE = `internal import Expo

// Created by ./plugins/withIosSceneDelegate.js on every prebuild.
//
// \`ExpoAppSceneDelegate\` creates the window from the connecting UIWindowScene
// and starts React Native into it — the work \`AppDelegate\` used to do in
// \`didFinishLaunchingWithOptions\`, which iOS 27 no longer presents.
@objc(SceneDelegate)
class SceneDelegate: ExpoAppSceneDelegate {
  // Extension point for config plugins.
}
`;

/** Drops the `factory.startReactNative(...)` call, however many lines it spans. */
const removeStartReactNative = (lines) => {
  const start = lines.findIndex((line) => line.includes('factory.startReactNative('));
  if (start === -1) return null;

  let end = start;
  while (end < lines.length && !lines[end].trimEnd().endsWith(')')) end += 1;
  if (end === lines.length) return null;

  return [...lines.slice(0, start), ...lines.slice(end + 1)];
};

const rewriteAppDelegate = (source) => {
  // Already rewritten — a prebuild without --clean runs over its own output.
  if (source.includes(FACTORY_PROVIDER_PROTOCOL)) return source;

  const declaration = 'class AppDelegate: ExpoAppDelegate {';
  if (!source.includes(declaration)) {
    throw new Error(
      `withIosSceneDelegate: AppDelegate.swift does not declare "${declaration}". ` +
        'The prebuild template changed; re-derive this plugin against it rather than ' +
        'shipping a build that launches to a black screen on iOS 27.',
    );
  }

  const conformed = source.replace(
    declaration,
    `class AppDelegate: ExpoAppDelegate, ${FACTORY_PROVIDER_PROTOCOL} {`,
  );

  const withoutWindow = conformed
    .split('\n')
    .filter((line) => !line.includes('window = UIWindow(frame: UIScreen.main.bounds)'));
  if (withoutWindow.length === conformed.split('\n').length) {
    throw new Error(
      'withIosSceneDelegate: AppDelegate.swift never created the window, so this plugin ' +
        'no longer knows what it is removing. Re-derive it against the template.',
    );
  }

  const withoutStart = removeStartReactNative(withoutWindow);
  if (withoutStart === null) {
    throw new Error(
      'withIosSceneDelegate: could not find a complete factory.startReactNative(...) call ' +
        'in AppDelegate.swift. If @react-native-firebase/app ran after this plugin it has ' +
        'also just lost its anchor — check the plugin order in app.json.',
    );
  }

  return withoutStart.join('\n');
};

const withSceneDelegateSource = (config) =>
  withDangerousMod(config, [
    'ios',
    (mod) => {
      const targetDir = path.join(mod.modRequest.platformProjectRoot, mod.modRequest.projectName);

      fs.writeFileSync(path.join(targetDir, SCENE_DELEGATE_FILENAME), SCENE_DELEGATE_SOURCE);

      const appDelegatePath = path.join(targetDir, 'AppDelegate.swift');
      const rewritten = rewriteAppDelegate(fs.readFileSync(appDelegatePath, 'utf8'));
      fs.writeFileSync(appDelegatePath, rewritten);

      return mod;
    },
  ]);

const withSceneDelegateInProject = (config) =>
  withXcodeProject(config, (mod) => {
    const project = mod.modResults;
    const relative = `${mod.modRequest.projectName}/${SCENE_DELEGATE_FILENAME}`;
    // `addSourceFile` adds a second build-phase entry for a path it already
    // has, and Xcode then fails with "duplicate output file".
    if (project.hasFile(relative)) return mod;

    const groupKey = project.findPBXGroupKey({ name: mod.modRequest.projectName });
    project.addSourceFile(relative, { target: project.getFirstTarget().uuid }, groupKey);
    return mod;
  });

const withSceneManifest = (config) =>
  withInfoPlist(config, (mod) => {
    mod.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        [APPLICATION_SESSION_ROLE]: [
          {
            UISceneConfigurationName: SCENE_CONFIGURATION_NAME,
            UISceneDelegateClassName: SCENE_DELEGATE_CLASS,
          },
        ],
      },
    };
    return mod;
  });

module.exports = (config) =>
  withSceneManifest(withSceneDelegateInProject(withSceneDelegateSource(config)));
