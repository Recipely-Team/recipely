/**
 * Contract test for `NotificationService`. It must conform to the
 * `NotificationServiceInterface` port, be a full no-op on web (where local
 * notifications are unsupported), and on native delegate permission checks and
 * scheduling to the platform notification API. `expo-notifications` is mocked so
 * nothing touches a real device or push service.
 */
/* eslint-disable import/first -- jest.mock() must be hoisted above imports */

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationCategoryAsync: jest.fn((): Promise<void> => Promise.resolve()),
  setNotificationChannelAsync: jest.fn((): Promise<void> => Promise.resolve()),
  getPermissionsAsync: jest.fn((): Promise<{ status: string }> => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn((): Promise<{ status: string }> => Promise.resolve({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn((): Promise<string> => Promise.resolve('scheduled-id')),
  dismissNotificationAsync: jest.fn((): Promise<void> => Promise.resolve()),
  cancelScheduledNotificationAsync: jest.fn((): Promise<void> => Promise.resolve()),
  AndroidImportance: { MAX: 5 },
  SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' },
}));

import { Platform } from 'react-native';
import * as ExpoNotifications from 'expo-notifications';
import { NotificationService } from '@infrastructure/notifications/notification-service';

const notifications = jest.mocked(ExpoNotifications);
const platform = Platform as { OS: string };
const originalOS = platform.OS;

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationService();
  });

  afterEach(() => {
    platform.OS = originalOS;
  });

  it('exposes the NotificationServiceInterface port shape', () => {
    expect(typeof service.init).toBe('function');
    expect(typeof service.requestPermissions).toBe('function');
    expect(typeof service.scheduleTimerComplete).toBe('function');
    expect(typeof service.cancel).toBe('function');
  });

  describe('on web', () => {
    beforeEach(() => {
      platform.OS = 'web';
    });

    it('reports permission as not granted without calling the platform API', async () => {
      await expect(service.requestPermissions()).resolves.toBe(false);
      expect(notifications.getPermissionsAsync).not.toHaveBeenCalled();
    });

    it('schedules nothing and returns no ids', async () => {
      await expect(service.scheduleTimerComplete('t1', 'Pasta', Date.now() + 60_000)).resolves.toEqual([]);
      expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it('init and cancel resolve without touching the platform API', async () => {
      await expect(service.init()).resolves.toBeUndefined();
      await expect(service.cancel(['id'])).resolves.toBeUndefined();
      expect(notifications.dismissNotificationAsync).not.toHaveBeenCalled();
    });
  });

  describe('on native', () => {
    beforeEach(() => {
      platform.OS = 'ios';
    });

    it('reports permission granted when the platform already granted it', async () => {
      notifications.getPermissionsAsync.mockResolvedValueOnce({ status: 'granted' } as never);

      await expect(service.requestPermissions()).resolves.toBe(true);
      expect(notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it('requests permission and reports denial when the user declines', async () => {
      notifications.getPermissionsAsync.mockResolvedValueOnce({ status: 'undetermined' } as never);
      notifications.requestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' } as never);

      await expect(service.requestPermissions()).resolves.toBe(false);
      expect(notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    });

    it('schedules the completion notification and returns its id', async () => {
      const ids = await service.scheduleTimerComplete('t1', 'Pasta', Date.now() + 60_000);

      expect(ids).toEqual(['scheduled-id']);
      expect(notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    });

    it('dismisses and cancels every id on cancel', async () => {
      await service.cancel(['a', 'b']);

      expect(notifications.dismissNotificationAsync).toHaveBeenCalledTimes(2);
      expect(notifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(2);
    });
  });
});
