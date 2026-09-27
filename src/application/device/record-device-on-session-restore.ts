import type { RecordDeviceUseCase } from '@application/device/record-device-use-case';

/**
 * Builds the device heartbeat the auth store fires when `hydrate` RESTORES a
 * stored session on cold start.
 *
 * @remarks
 * - **Restore only, never sign-in.** An interactive sign-in (password, Google,
 *   Apple, registration code) already carries `device` in its request body and
 *   the backend records it there; a heartbeat after it was a second upsert of
 *   the same row. A restored session sends no auth request at all, so this is
 *   the only way the device's `lastLoginAt` moves on a cold start.
 * - **Why the store calls it.** Both paths go `loading` → `authenticated`, so a
 *   subscriber watching the status cannot tell them apart; `hydrate` can.
 * - **Fire-and-forget.** The result is dropped and a rejection is swallowed:
 *   the device list is bookkeeping, and nothing about it is the user's
 *   problem or worth a dialog.
 */
export const recordDeviceOnSessionRestore =
  (recordDevice: RecordDeviceUseCase): (() => void) =>
  () => {
    recordDevice.execute().catch(() => undefined);
  };
