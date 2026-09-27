import type { RequestMapper } from '@core/mapper/request-mapper';
import type { DeviceIdentity } from '@domain/device/device-identity';
import type { DeviceContextDto } from '@infrastructure/device/device-context-dto';

/** An unknown app version is left off the wire; the backend column is nullable. */
export const toDeviceContextDto: RequestMapper<DeviceIdentity, DeviceContextDto> = ({
  deviceId,
  platform,
  appVersion,
}) => ({
  deviceId,
  platform,
  ...(appVersion !== null ? { appVersion } : {}),
});
