import { execSync } from 'node:child_process';
import type { ConfigContext, ExpoConfig } from 'expo/config';

// Dynamic Expo config. The static base lives in app.json; this layer injects
// git-derived version numbers + variant-specific bundle identifiers so every
// build is versioned automatically and dev/prod can co-exist on the same
// device. Runs in Node at config-evaluation time (expo start / prebuild / run
// / EAS build).

type Variant = 'production' | 'development';

const ANDROID_PROD_PACKAGE = 'com.recipely.app';
const ANDROID_DEV_PACKAGE = 'com.recipely.app.dev';

// iOS uses the reverse-DNS of recipely.net: `com.recipely.app` is already
// registered to another Apple team, so the Android package name cannot be
// reused as the iOS bundle identifier.
const IOS_PROD_BUNDLE_ID = 'net.recipely.app';
const IOS_DEV_BUNDLE_ID = 'net.recipely.app.dev';

const IOS_PROD_GOOGLE_SERVICES_FILE = './GoogleService-Info.plist';
const IOS_DEV_GOOGLE_SERVICES_FILE = './GoogleService-Info.dev.plist';

// REVERSED_CLIENT_ID of each Firebase iOS app's OAuth client; must match the
// GoogleService-Info plist that ships with the same variant.
const IOS_PROD_GOOGLE_URL_SCHEME =
  'com.googleusercontent.apps.421167568469-hl9tkgpi61p1rrir349b9ild9h976kgd';
const IOS_DEV_GOOGLE_URL_SCHEME =
  'com.googleusercontent.apps.421167568469-v6qorc4n7abqbb2vteulr3424p19p72o';

const GOOGLE_SIGNIN_PLUGIN = '@react-native-google-signin/google-signin';
const ADMOB_PLUGIN = 'react-native-google-mobile-ads';

const variant: Variant =
  (process.env.APP_VARIANT as Variant | undefined) ?? 'production';

const isDev = variant === 'development';
const androidPackage = isDev ? ANDROID_DEV_PACKAGE : ANDROID_PROD_PACKAGE;
const iosBundleId = isDev ? IOS_DEV_BUNDLE_ID : IOS_PROD_BUNDLE_ID;
const iosGoogleServicesFile = isDev
  ? IOS_DEV_GOOGLE_SERVICES_FILE
  : IOS_PROD_GOOGLE_SERVICES_FILE;
const iosGoogleUrlScheme = isDev
  ? IOS_DEV_GOOGLE_URL_SCHEME
  : IOS_PROD_GOOGLE_URL_SCHEME;
const displayName = isDev ? 'Recipely (Dev)' : 'Recipely';
const scheme = isDev ? 'recipely-dev' : 'recipely';

const runGit = (command: string): string | null => {
  try {
    return execSync(command, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return null;
  }
};

/** Monotonically increasing build number.
 *
 * CI sets `BUILD_NUMBER` (e.g. from `GITHUB_RUN_NUMBER`) so we don't depend on
 * a full git history being available on the runner. Local dev falls back to
 * the commit count, which keeps `expo start` and manual builds working without
 * any environment configuration. */
const getBuildNumber = (): number => {
  const fromEnv = process.env.BUILD_NUMBER;
  if (fromEnv !== undefined && fromEnv.length > 0) {
    const parsedEnv = Number.parseInt(fromEnv, 10);
    if (Number.isFinite(parsedEnv) && parsedEnv > 0) {
      return parsedEnv;
    }
  }
  const raw = runGit('git rev-list --count HEAD');
  const parsed = raw !== null ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

/** Latest git tag across the whole repo by semantic-version sort (leading `v`
 * stripped); falls back to app.json's version when untagged.
 *
 * Deliberately not `git describe --tags`, which walks commit ancestry: tags
 * are only ever created on `main` (by the `tag-release` CI job), and `dev`
 * never merges those tag commits back in, so an ancestry-based lookup on
 * `dev` stays frozen at whatever tag predated the dev/main split instead of
 * advancing with each release. */
const getVersion = (fallback: string): string => {
  const tags = runGit("git tag --list 'v*' --sort=-v:refname");
  const latest = tags?.split('\n')[0]?.trim();
  return latest !== undefined && latest.length > 0 ? latest.replace(/^v/, '') : fallback;
};

/** Swaps the google-signin plugin's iosUrlScheme for the active variant so
 * each iOS build opens with its own Firebase OAuth client's reversed ID. */
const withVariantGoogleUrlScheme = (
  plugins: ExpoConfig['plugins'],
): ExpoConfig['plugins'] =>
  plugins?.map((plugin) =>
    Array.isArray(plugin) && plugin[0] === GOOGLE_SIGNIN_PLUGIN
      ? [
          GOOGLE_SIGNIN_PLUGIN,
          { ...(plugin[1] ?? {}), iosUrlScheme: iosGoogleUrlScheme },
        ]
      : plugin,
  );

/** Swaps the AdMob plugin's app ids for the real ones when the build supplies
 * them, leaving app.json's Google test ids in place when it does not.
 *
 * The same rule the ad UNIT ids follow in `@infrastructure/constants/ads`, and
 * for the same reason: requesting real inventory from a development build is
 * what gets an AdMob account suspended, and nothing fails when it happens — the
 * impressions simply count. So the real ids arrive only where they are set, and
 * every other build is safe by default rather than by remembering.
 *
 * No `EXPO_PUBLIC_` prefix: unlike the unit ids these are read here, at config
 * time, and written into the native manifest. They never enter the JS bundle,
 * and the prefix would claim they do. */
const withRealAdMobAppIds = (plugins: ExpoConfig['plugins']): ExpoConfig['plugins'] => {
  // An unset GitHub secret arrives as an EMPTY STRING, not as undefined, so
  // `?? fallback` would happily write '' into the manifest — and the Mobile Ads
  // SDK aborts at startup on a missing app id. Blank is unset.
  const orUnset = (value: string | undefined): string | undefined =>
    value !== undefined && value.trim().length > 0 ? value : undefined;
  const androidAppId = orUnset(process.env.ADMOB_ANDROID_APP_ID);
  const iosAppId = orUnset(process.env.ADMOB_IOS_APP_ID);
  if (androidAppId === undefined && iosAppId === undefined) return plugins;

  return plugins?.map((plugin) => {
    if (!Array.isArray(plugin) || plugin[0] !== ADMOB_PLUGIN) return plugin;
    const options = { ...(plugin[1] ?? {}) };
    if (androidAppId !== undefined) options.androidAppId = androidAppId;
    if (iosAppId !== undefined) options.iosAppId = iosAppId;
    return [ADMOB_PLUGIN, options];
  });
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const buildNumber = getBuildNumber();
  const version = getVersion(config.version ?? '1.0.0');

  return {
    ...config,
    name: displayName,
    slug: config.slug ?? 'recipely',
    version,
    scheme,
    plugins: withRealAdMobAppIds(withVariantGoogleUrlScheme(config.plugins)),
    ios: {
      ...config.ios,
      bundleIdentifier: iosBundleId,
      buildNumber: String(buildNumber),
      googleServicesFile: iosGoogleServicesFile,
    },
    android: {
      ...config.android,
      package: androidPackage,
      versionCode: buildNumber,
    },
    extra: {
      ...config.extra,
      variant,
      eas: {
        ...(config.extra?.eas ?? {}),
      },
    },
  };
};
