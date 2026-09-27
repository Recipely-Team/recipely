import type { BoundStore } from '@application/store/bound-store';
import type { AuthStoreState } from '@application/auth/auth-store-state';
import { StoreStatus } from '@application/store/store-status';
import type { RecordDeviceUseCase } from '@application/device/record-device-use-case';

/**
 * Reports the device each time the session BECOMES authenticated — the cold
 * start that finds a stored session, and every sign-in after it.
 *
 * @remarks
 * - **A transition, not a status.** Avatar and profile updates re-set an
 *   authenticated state; reacting to the status alone would send a heartbeat
 *   for each of them.
 * - **Fire-and-forget.** The result is dropped and a rejection is swallowed:
 *   the device list is bookkeeping, and nothing about it is the user's
 *   problem or worth a dialog.
 *
 * @returns the unsubscribe handle.
 */
export const recordDeviceOnSignIn = (
  authStore: BoundStore<AuthStoreState>,
  recordDevice: RecordDeviceUseCase,
): (() => void) =>
  authStore.subscribe((next, previous) => {
    const becameAuthenticated =
      next.state.status === StoreStatus.Authenticated &&
      previous.state.status !== StoreStatus.Authenticated;
    if (becameAuthenticated) {
      recordDevice.execute().catch(() => undefined);
    }
  });
