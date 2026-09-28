import { ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { ValueConstants } from '@core/constants';
import type { DevicePlatform } from '@domain/notifications/device-platform';
import type { DeviceIdentity } from '@domain/device/device-identity';
import type { DeviceIdentityInterface } from '@domain/device/device-identity-interface';
import type { KeyValueStoreInterface } from '@domain/storage/key-value-store-interface';
import { DEVICE_ID_STORAGE_KEY } from '@infrastructure/constants/storage';
import { ApiLimits } from '@infrastructure/constants/api/api-limits';

/**
 * The install's identity, minted on first use and kept in the key-value store.
 *
 * @remarks
 * - **One id per install.** The first call that finds no stored id generates
 *   one and writes it; every later call — this launch or the next — reads it
 *   back. The in-flight lookup is shared, so a login and the heartbeat racing
 *   at start-up cannot mint two ids.
 * - **A failed write is a failure, not an id.** Answering an id that was never
 *   persisted would register a fresh device on every launch; the caller sends
 *   nothing instead, which the backend accepts.
 * - **Web counts.** It is the same port over `localStorage`; a cleared browser
 *   is simply a new device.
 */
export class StoredDeviceIdentity implements DeviceIdentityInterface {
  private pending: Promise<Result<DeviceIdentity, Failure>> | null = null;

  constructor(
    private readonly store: KeyValueStoreInterface,
    private readonly generateId: () => string,
    private readonly platform: DevicePlatform,
    private readonly appVersion: string | null,
  ) {}

  current(): Promise<Result<DeviceIdentity, Failure>> {
    if (this.pending === null) {
      this.pending = this.resolve().then((result) => {
        if (!result.ok) this.pending = null;
        return result;
      });
    }
    return this.pending;
  }

  private async resolve(): Promise<Result<DeviceIdentity, Failure>> {
    const stored = await this.store.getItem(DEVICE_ID_STORAGE_KEY);
    if (!stored.ok) {
      return stored;
    }
    if (stored.value !== null && StoredDeviceIdentity.isUsableId(stored.value)) {
      return ok(this.identityOf(stored.value));
    }
    const deviceId = this.generateId();
    const saved = await this.store.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
    if (!saved.ok) {
      return saved;
    }
    return ok(this.identityOf(deviceId));
  }

  private static isUsableId(value: string): boolean {
    return value.length > ValueConstants.zero && value.length <= ApiLimits.deviceId;
  }

  private identityOf(deviceId: string): DeviceIdentity {
    return { deviceId, platform: this.platform, appVersion: this.appVersion };
  }
}
