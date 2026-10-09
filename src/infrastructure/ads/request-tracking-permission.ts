import { AppState } from 'react-native';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { AppStateStatusValue } from '@infrastructure/constants/app-state-status';

/**
 * Asks iOS for App Tracking Transparency permission, once the app is in front.
 *
 * @remarks
 * - **Why it exists.** App Review rejected 1.2.0 (5.1.2(i)): the consent form
 *   speaks of personalised ads, and iOS requires the ATT prompt before any data
 *   used for tracking is collected. The ads SDK reads the answer itself; a
 *   decline leaves ads contextual.
 * - **It waits for `active`.** iOS silently drops the request (answering
 *   "not determined", no prompt) while the app is still launching, and this
 *   runs from the launch warm-up.
 * - **No platform check.** The library answers "granted" on Android and the
 *   web without a prompt, and the system shows the prompt only once per install.
 */
export const requestTrackingPermission = async (): Promise<void> => {
  if (AppState.currentState !== AppStateStatusValue.active) {
    await new Promise<void>((resolve) => {
      const subscription = AppState.addEventListener('change', (state) => {
        if (state !== AppStateStatusValue.active) return;
        subscription.remove();
        resolve();
      });
    });
  }
  await requestTrackingPermissionsAsync();
};
