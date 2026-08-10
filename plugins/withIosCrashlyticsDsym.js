const { withXcodeProject } = require('@expo/config-plugins');

/**
 * Uploads iOS debug symbols to Crashlytics at build time.
 *
 * WHY this exists: `@react-native-firebase/crashlytics`'s own config plugin
 * touches ANDROID ONLY (`plugin/build/index.js` applies the Gradle buildscript
 * dependency and nothing else). On iOS the SDK still CAPTURES crashes, but
 * without dSYMs Crashlytics has nothing to resolve the addresses against, so
 * every report arrives as raw hex frames marked "Missing dSYM" — present in the
 * console and useless for finding the line.
 *
 * Two halves, both required:
 *   1. Release builds must actually PRODUCE dSYMs (`dwarf-with-dsym`). Xcode's
 *      default for Release is already this, but a Debug-configured archive is
 *      not, and the run script silently uploads nothing when the files are
 *      absent.
 *   2. A build phase that runs Crashlytics' `upload-symbols` after the app is
 *      linked. It is `run`, shipped inside the pod, and it needs the
 *      GoogleService-Info.plist path — the variant-specific file, which
 *      `app.config.ts` has already placed in the bundle by this point.
 */
const PHASE_NAME = '[recipely] Upload Crashlytics dSYMs';
const SCRIPT = [
  '"${PODS_ROOT}/FirebaseCrashlytics/run"',
  '-gsp "${PROJECT_DIR}/${TARGET_NAME}/GoogleService-Info.plist"',
  '-p ios "${DWARF_DSYM_FOLDER_PATH}/${DWARF_DSYM_FILE_NAME}"',
].join(' ');

const withIosCrashlyticsDsym = (config) =>
  withXcodeProject(config, (mod) => {
    const project = mod.modResults;

    // Idempotent: a prebuild that runs twice must not stack two copies of the
    // phase, and `expo prebuild --clean` is not guaranteed between CI runs.
    const phases = project.hash.project.objects.PBXShellScriptBuildPhase ?? {};
    const exists = Object.values(phases).some(
      (phase) => typeof phase === 'object' && phase.name?.includes(PHASE_NAME),
    );
    if (!exists) {
      project.addBuildPhase([], 'PBXShellScriptBuildPhase', PHASE_NAME, null, {
        shellPath: '/bin/sh',
        shellScript: SCRIPT,
        // Quoted, and it has to be: `xcode` writes an inputPaths entry into the
        // pbxproj verbatim, and `${A}/${B}` unquoted is not one plist token.
        // CocoaPods' parser reads it as two and stops the whole build with
        // "Array missing ',' in between objects" — before a single file is
        // compiled. Same nested-quote form as SCRIPT above and the
        // DEBUG_INFORMATION_FORMAT below; this line was the one that missed it.
        inputPaths: ['"${DWARF_DSYM_FOLDER_PATH}/${DWARF_DSYM_FILE_NAME}"'],
      });
    }

    // Half 1: guarantee the symbols the script uploads are generated at all.
    const configurations = project.pbxXCBuildConfigurationSection();
    for (const key of Object.keys(configurations)) {
      const entry = configurations[key];
      if (typeof entry !== 'object' || entry.buildSettings === undefined) continue;
      if (entry.name !== 'Release') continue;
      entry.buildSettings.DEBUG_INFORMATION_FORMAT = '"dwarf-with-dsym"';
    }

    return mod;
  });

module.exports = withIosCrashlyticsDsym;
