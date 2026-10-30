import { PermissionStatus } from 'expo-modules-core';
import { registerPushToken } from '@infrastructure/notifications/push-token-registrar';
import { DevicePlatform } from '@domain/notifications/device-platform';

/**
 * Reported 2026-10-30: the Android app asked for notification permission on
 * every open. `registerPushToken` runs at every signed-in launch and requested
 * permission whenever it was not granted, so a user who dismissed the prompt,
 * or declined it once, met it again on the next launch.
 */
const mockGetPermissions = jest.fn();
const mockRequestPermissions = jest.fn();
const mockGetDevicePushToken = jest.fn();

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: () => mockGetPermissions() as unknown,
  requestPermissionsAsync: () => mockRequestPermissions() as unknown,
  getDevicePushTokenAsync: () => mockGetDevicePushToken() as unknown,
}));
jest.mock('@infrastructure/constants/platform', () => ({
  ...jest.requireActual<object>('@infrastructure/constants/platform'),
  isAndroid: () => true,
}));

describe('registerPushToken (Android)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDevicePushToken.mockResolvedValue({ data: 'fcm-token' });
  });

  it.each([PermissionStatus.UNDETERMINED, PermissionStatus.DENIED])(
    'never shows the permission prompt at launch (permission %s)',
    async (status) => {
      mockGetPermissions.mockResolvedValue({ status });
      const register = jest.fn();

      await registerPushToken(register);

      expect(mockRequestPermissions).not.toHaveBeenCalled();
      expect(register).not.toHaveBeenCalled();
    },
  );

  it('registers the token when notifications are already allowed', async () => {
    mockGetPermissions.mockResolvedValue({ status: PermissionStatus.GRANTED });
    const register = jest.fn().mockResolvedValue({ ok: true, value: undefined });

    await registerPushToken(register);

    expect(mockRequestPermissions).not.toHaveBeenCalled();
    expect(register).toHaveBeenCalledWith('fcm-token', DevicePlatform.Android);
  });
});
