import type { StoreApi } from 'zustand/vanilla';
import { createStore } from 'zustand/vanilla';
import type { AppVersionStore } from '@application/app-version/app-version-store-contract';
import type { AppVersionState } from '@application/app-version/app-version-state';
import { AppVersionStatus } from '@application/app-version/app-version-status';
import type { CheckAppVersionUseCase } from '@application/app-version/check-app-version-use-case';
import type { DismissUpdateUseCase } from '@application/app-version/dismiss-update-use-case';
import type { VersionVerdict } from '@domain/app-version/version-verdict';
import { VersionCheckStatus } from '@domain/app-version/version-check-status';

interface AppVersionStoreDeps {
  checkAppVersion: CheckAppVersionUseCase;
  dismissUpdate: DismissUpdateUseCase;
}

const stateFor = (verdict: VersionVerdict): AppVersionState => {
  switch (verdict.status) {
    case VersionCheckStatus.UpdateRequired:
      return { status: AppVersionStatus.UpdateRequired, verdict };
    case VersionCheckStatus.UpdateAvailable:
      return { status: AppVersionStatus.UpdateAvailable, verdict };
    case VersionCheckStatus.UpToDate:
      return { status: AppVersionStatus.UpToDate };
  }
};

/**
 * Holds whether this build is current, may update, or must update.
 *
 * @remarks
 * - **Fails open, never closed.** A check that cannot reach the backend leaves
 *   the state as it was: offline never locks a user out, and a gate already up
 *   stays up (the server's 426 is what enforces it either way).
 * - **One check at a time.** Launch, foreground and a burst of 426 replies all
 *   share the request in flight.
 */
export const configureAppVersionStore = (deps: AppVersionStoreDeps): StoreApi<AppVersionStore> => {
  let inFlight: Promise<void> | null = null;

  return createStore<AppVersionStore>((set, get) => ({
    state: { status: AppVersionStatus.Unchecked },
    check: () => {
      inFlight ??= deps.checkAppVersion
        .execute()
        .then((result) => {
          if (result.ok) set({ state: stateFor(result.value) });
        })
        .finally(() => {
          inFlight = null;
        });
      return inFlight;
    },
    dismissUpdate: async () => {
      const { state } = get();
      if (state.status !== AppVersionStatus.UpdateAvailable) return;
      set({ state: { status: AppVersionStatus.UpToDate } });
      await deps.dismissUpdate.execute();
    },
  }));
};
