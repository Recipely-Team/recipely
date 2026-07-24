const {
  withAppBuildGradle,
  withGradleProperties,
} = require('@expo/config-plugins');

/**
 * Applies the two Android release-build optimizations Play Console asks for
 * under its R8 recommendation, during `expo prebuild`.
 *
 * **1. Optimization enabled.** The React Native template wires the release
 * build type to
 * `getDefaultProguardFile("proguard-android.txt")`, which ships `-dontoptimize`.
 * The result is that R8 shrinks and obfuscates but never runs its optimization
 * passes, even though `minifyEnabled` and `shrinkResources` are both on — which
 * is exactly what Play Console reports as "Optimization not enabled" under its
 * R8 recommendation. Google's guidance is explicit: support for
 * `proguard-android.txt` "has been dropped, because it includes -dontoptimize,
 * which should be avoided. Instead, use proguard-android-optimize.txt".
 *
 * **2. Optimized resource shrinking**, which Play reports separately as
 * "Optimized removal of unused resources not enabled". It needs AGP 8.12+ —
 * available since the SDK 55 upgrade (React Native 0.83 pins AGP 8.12.0) — and
 * becomes the default in AGP 9.0, at which point this property can be dropped.
 *
 * The committed `android/` directory is git-ignored and regenerated on every CI
 * run, so neither can be a hand-edited gradle change — the plugin re-applies
 * both each prebuild. Both patches are idempotent.
 *
 * Play's remaining R8 sub-item, "upgrade to AGP 9.0", is still out of reach:
 * even SDK 57 / React Native 0.86 pins AGP 8.12.0.
 *
 * @see https://developer.android.com/topic/performance/app-optimization/enable-app-optimization
 * @see https://android-developers.googleblog.com/2025/09/improve-app-performance-with-optimized-resource-shrinking.html
 */
const DEFAULT_PROGUARD_FILE = 'getDefaultProguardFile("proguard-android.txt")';

const OPTIMIZED_PROGUARD_FILE =
  'getDefaultProguardFile("proguard-android-optimize.txt")';

const OPTIMIZED_RESOURCE_SHRINKING_KEY = 'android.r8.optimizedResourceShrinking';

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

/** Set `android.r8.optimizedResourceShrinking=true` in `gradle.properties`.
 *
 * Overwrites an existing entry rather than appending a duplicate, since the
 * last occurrence would otherwise be the one Gradle honours. */
function enableOptimizedResourceShrinking(properties) {
  const existing = properties.find(
    (item) => item.type === 'property' && item.key === OPTIMIZED_RESOURCE_SHRINKING_KEY,
  );
  if (existing) {
    existing.value = 'true';
    return properties;
  }
  return [
    ...properties,
    {
      type: 'property',
      key: OPTIMIZED_RESOURCE_SHRINKING_KEY,
      value: 'true',
    },
  ];
}

module.exports = function withAndroidR8Optimization(config) {
  const withProguard = withAppBuildGradle(config, (cfg) => {
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

  return withGradleProperties(withProguard, (cfg) => {
    cfg.modResults = enableOptimizedResourceShrinking(cfg.modResults);
    return cfg;
  });
};

module.exports.useOptimizedProguardFile = useOptimizedProguardFile;
module.exports.enableOptimizedResourceShrinking = enableOptimizedResourceShrinking;
