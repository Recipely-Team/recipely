import { useStore } from 'zustand';
import { AppVersionStatus } from '@application/app-version/app-version-status';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useAppVersionCheck } from '@presentation/base/hooks/lifecycle/use-app-version-check';
import { UpdateRequiredGate } from '@presentation/base/widgets/app-update/update-required-gate';
import { UpdateAvailableSheet } from '@presentation/base/widgets/app-update/update-available-sheet';

/**
 * Root-layout chrome for the version check: the gate when this build must
 * update, the dismissible sheet when it may, nothing otherwise — and never both.
 */
export const AppUpdateHost = (): React.JSX.Element | null => {
  useAppVersionCheck();
  const { appVersionStore } = useStores();
  const state = useStore(appVersionStore, (s) => s.state);
  const dismissUpdate = useStore(appVersionStore, (s) => s.dismissUpdate);
  if (state.status === AppVersionStatus.UpdateRequired) return <UpdateRequiredGate verdict={state.verdict} />;
  if (state.status === AppVersionStatus.UpdateAvailable) {
    return <UpdateAvailableSheet verdict={state.verdict} onDismiss={() => void dismissUpdate()} />;
  }
  return null;
};
