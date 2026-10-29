import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useStores } from '@presentation/bootstrap/use-stores';

/**
 * Asks the backend what this build must do — on launch and every time the app
 * returns to the foreground.
 *
 * @remarks
 * - **The foreground check matters most**: it is how the gate lifts after the
 *   user comes back from the store, and how a release pulled while the app sat
 *   in the background reaches a running app.
 */
export const useAppVersionCheck = (): void => {
  const { appVersionStore } = useStores();
  useEffect(() => {
    void appVersionStore.getState().check();
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') void appVersionStore.getState().check();
    });
    return () => subscription.remove();
  }, [appVersionStore]);
};
