/**
 * What makes two builds "the same native app" for over-the-air updates
 * (runtimeVersion policy `fingerprint`, app.config.ts).
 *
 * Version fields are skipped: app.config.ts stamps every build with its own
 * build number and the version from the last git tag, so with Expo's defaults
 * every build would be a runtime of its own and no update could ever reach it.
 * What still counts is everything that changes the native binary — native
 * dependencies, config plugins, native config.
 *
 * The Firebase config files are skipped too: CI restores them from secrets, so
 * the update publisher would need every secret file byte-identical to compute
 * the same runtime, and no JS bundle depends on their contents.
 */
const { SourceSkips } = require('expo/fingerprint');

/** @type {import('expo/fingerprint').Config} */
module.exports = {
  ignorePaths: ['google-services.json', 'GoogleService-Info.plist', 'GoogleService-Info.dev.plist'],
  sourceSkips: SourceSkips.ExpoConfigVersions | SourceSkips.PackageJsonAndroidAndIosScriptsIfNotContainRun,
};
