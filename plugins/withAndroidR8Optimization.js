const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Switches the Android release build from ProGuard's non-optimizing default
 * config to the optimizing one during `expo prebuild`.
 *
 * The React Native template wires the release build type to
 * `getDefaultProguardFile("proguard-android.txt")`, which ships `-dontoptimize`.
 * The result is that R8 shrinks and obfuscates but never runs its optimization
 * passes, even though `minifyEnabled` and `shrinkResources` are both on — which
 * is exactly what Play Console reports as "Optimization not enabled" under its
 * R8 recommendation. Google's guidance is explicit: support for
 * `proguard-android.txt` "has been dropped, because it includes -dontoptimize,
 * which should be avoided. Instead, use proguard-android-optimize.txt".
 *
 * The committed `android/` directory is git-ignored and regenerated on every CI
 * run, so this cannot be a hand-edited gradle change — the plugin re-applies it
 * each prebuild. The patch is idempotent.
 *
 * Not covered here (both blocked on Expo SDK 54's AGP 8.11 pin, which the
 * React Native gradle plugin sets): `android.r8.optimizedResourceShrinking`
 * needs AGP 8.12+, and Play's "upgrade to AGP 9.0" item needs an SDK upgrade.
 *
 * @see https://developer.android.com/topic/performance/app-optimization/enable-app-optimization
 */
const DEFAULT_PROGUARD_FILE = 'getDefaultProguardFile("proguard-android.txt")';

const OPTIMIZED_PROGUARD_FILE =
  'getDefaultProguardFile("proguard-android-optimize.txt")';

/** Swap the default ProGuard config for the optimizing variant.
 *
 * Idempotent on the already-patched string, so it survives a prebuild that
 * reuses an existing `android/`. Throws if the template's `proguardFiles`
 * anchor is gone rather than silently shipping an unoptimized release — the
 * failure would otherwise only surface as a Play Console recommendation days
 * after the upload. */
function useOptimizedProguardFile(contents) {
  if (contents.includes(OPTIMIZED_PROGUARD_FILE)) {
    return contents;
  }
  if (!contents.includes(DEFAULT_PROGUARD_FILE)) {
    throw new Error(
      'withAndroidR8Optimization: getDefaultProguardFile("proguard-android.txt") ' +
        'anchor not found — the Expo Android template may have changed.',
    );
  }
  return contents.replace(DEFAULT_PROGUARD_FILE, OPTIMIZED_PROGUARD_FILE);
}

module.exports = function withAndroidR8Optimization(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      throw new Error(
        'withAndroidR8Optimization expected a Groovy build.gradle.',
      );
    }
    cfg.modResults.contents = useOptimizedProguardFile(
      cfg.modResults.contents,
    );
    return cfg;
  });
};

module.exports.useOptimizedProguardFile = useOptimizedProguardFile;
