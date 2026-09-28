import { DevicePlatform } from '@domain/notifications/device-platform';
import { isAndroid, isIos } from '@infrastructure/constants/platform';

/**
 * The platform word the backend's device vocabulary knows this runtime by.
 * Anything that is neither iOS nor Android runs the web build.
 */
export const currentDevicePlatform = (): DevicePlatform => {
  if (isIos()) return DevicePlatform.Ios;
  if (isAndroid()) return DevicePlatform.Android;
  return DevicePlatform.Web;
};
