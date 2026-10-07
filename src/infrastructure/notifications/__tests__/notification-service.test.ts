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
  getAllScheduledNotificationsAsync: jest.fn((): Promise<unknown[]> => Promise.resolve([])),
  AndroidImportance: { MAX: 5, DEFAULT: 3 },
  SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval', DATE: 'date' },
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
    expect(typeof service.hasPermission).toBe('function');
    expect(typeof service.scheduleTimerWarnings).toBe('function');
    expect(typeof service.replaceReminders).toBe('function');
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
      await expect(
        service.scheduleTimerComplete('t1', 'Pasta', Date.now() + 60_000, 'Timer is done!'),
      ).resolves.toEqual([]);
      expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it('init and cancel resolve without touching the platform API', async () => {
      await expect(service.init({ dismissAction: 'Dismiss', channelName: 'Cooking timer', timerDoneBody: 'Timer is done!', warningChannelName: 'Heads-up', reminderChannelName: 'Ideas' })).resolves.toBeUndefined();
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
      const ids = await service.scheduleTimerComplete(
        't1',
        'Pasta',
        Date.now() + 60_000,
        'Timer is done!',
      );

      expect(ids).toEqual(['scheduled-id']);
      expect(notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    });

    it('dismisses and cancels every id on cancel', async () => {
      await service.cancel(['a', 'b']);

      expect(notifications.dismissNotificationAsync).toHaveBeenCalledTimes(2);
      expect(notifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(2);
    });

    it('checks permission without ever prompting', async () => {
      notifications.getPermissionsAsync.mockResolvedValueOnce({ status: 'undetermined' } as never);
      await expect(service.hasPermission()).resolves.toBe(false);
      expect(notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it('schedules a silent heads-up per alert, tagged as a timer warning', async () => {
      const ids = await service.scheduleTimerWarnings('t1', 'Pasta', [
        { fireAtMs: Date.now() + 300_000, body: '5 minutes left' },
        { fireAtMs: Date.now() + 540_000, body: '1 minute left' },
      ]);
      expect(ids).toEqual(['scheduled-id', 'scheduled-id']);
      const [first] = notifications.scheduleNotificationAsync.mock.calls[0]!;
      expect(first.content).toMatchObject({ body: '5 minutes left', data: { type: 'timer-warning', timerId: 't1' } });
      expect(first.content.sound).toBeUndefined();
    });

    it('replaces only pending reminders, leaving timer alarms alone', async () => {
      notifications.getAllScheduledNotificationsAsync.mockResolvedValueOnce([
        { identifier: 'old-reminder', content: { data: { type: 'engagement-reminder' } } },
        { identifier: 'timer-alarm', content: { data: { type: 'timer-complete' } } },
      ] as never);
      await service.replaceReminders([{ fireAtMs: Date.now() + 86_400_000, title: 'T', body: 'B', day: 2, variant: 0 }]);
      expect(notifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(1);
      expect(notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('old-reminder');
      const [request] = notifications.scheduleNotificationAsync.mock.calls[0]!;
      expect(request.trigger).toMatchObject({ type: 'date' });
      expect(request.content.data).toEqual({ type: 'engagement-reminder', day: 2, variant: 0 });
    });

    it('keeps heads-ups quiet and reminders hidden while the app is open', async () => {
      await service.init({ dismissAction: 'Dismiss', channelName: 'Cooking timer', timerDoneBody: 'Timer is done!', warningChannelName: 'Heads-up', reminderChannelName: 'Ideas' });
      const { handleNotification } = notifications.setNotificationHandler.mock.calls[0]![0]!;
      const of = (type: string) => handleNotification({ request: { content: { data: { type } } } } as never);
      await expect(of('timer-complete')).resolves.toMatchObject({ shouldPlaySound: true, shouldShowBanner: true });
      await expect(of('timer-warning')).resolves.toMatchObject({ shouldPlaySound: false, shouldShowBanner: true });
      await expect(of('engagement-reminder')).resolves.toMatchObject({ shouldPlaySound: false, shouldShowBanner: false });
    });
  });
});
