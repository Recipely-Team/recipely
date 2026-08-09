import { AppState, type AppStateStatus } from 'react-native';
import { isWeb } from '@infrastructure/constants/platform';
import { AppStateStatusValue } from '@infrastructure/constants/app-state-status';
import { recordCrash, warmUpCrashReporting } from '@infrastructure/firebase/crashlytics-service';
import { CrashSentinel } from '@infrastructure/firebase/crash-sentinel';

/** Prefix that makes a silent-death report findable in the Crashlytics list. */
const SILENT_DEATH = 'app died without running any handler, last step:';

const isForeground = (status: AppStateStatus): boolean =>
  status === AppStateStatusValue.active;
const isBackground = (status: AppStateStatus): boolean =>
  status === AppStateStatusValue.background;

/**
 * Everything the app needs in place before the first line of app code runs.
 *
 * @remarks
 * - **This is the entry point's job, not a screen's.** It is the React Native
 *   equivalent of Flutter's `runZonedGuarded` around `runApp`: called from
 *   `index.js` before `expo-router/entry`, so a throw while a module is still
 *   being evaluated is already covered. It used to happen inside `AppBootstrap`'s
 *   `useEffect`, i.e. after the tree had rendered once — everything before that
 *   was unwatched, which is exactly where a launch crash lives.
 * - **Three layers, because no one of them sees everything:**
 *   1. `@react-native-firebase/crashlytics` installs an `ErrorUtils` global
 *      handler and promise-rejection tracking the first time the module is
 *      constructed. That construction is what {@link getCrashlytics} forces
 *      here — the library is doing the work, this only stops it happening late.
 *   2. The native Crashlytics handlers catch signals and ANRs on their own.
 *   3. {@link CrashSentinel} covers what neither can see: a process killed
 *      outright runs no handler at all, so the only evidence is a session that
 *      never said goodbye. That is reported on the NEXT launch.
 * - **The React tree keeps its own boundary.** `AppErrorBoundary` still catches
 *   render-time throws, because a caught render error should show the user a
 *   screen rather than take the app down — it reports through the same sink.
 * - **Never throws.** A crash reporter that can itself fail on launch is worse
 *   than none, so every step is wrapped and a failure here is silent.
 */
export const installCrashHandlers = (): void => {
  if (isWeb()) return;
  warmUpCrashReporting();

  // Dev sessions end the way crashes do: a Metro reload, a dev-menu restart, a
  // debugger detach. Arming here would report a phantom death on nearly every
  // save, and drown the real ones.
  if (__DEV__) return;

  void (async () => {
    try {
      const diedAt = await CrashSentinel.consumePreviousSession();
      if (diedAt !== null) {
        recordCrash(new Error(`${SILENT_DEATH} ${diedAt}`), 'CrashSentinel.previousSession');
      }
      await CrashSentinel.arm();
    } catch {
      // no-op
    }
  })();

  AppState.addEventListener('change', (status) => {
    if (isBackground(status)) void CrashSentinel.disarm();
    else if (isForeground(status)) void CrashSentinel.arm();
  });
};
