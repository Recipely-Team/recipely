/**
 * `getNotificationService` accessor tests: it must return the container-registered
 * service when the composition root wired one, and fall back to the inert no-op
 * service (never throw) when nothing is registered.
 */
import { container } from '@core/di/container-instance';
import { TOKENS } from '@application/di/tokens';
import { getNotificationService } from '@application/notifications/get-notification-service';
import { noopNotificationService } from '@application/notifications/noop-notification-service';
import { FakeNotificationService } from '@application/__fixtures__/fake-notification-service';

describe('getNotificationService', () => {
  beforeEach(() => {
    container.reset();
  });

  it('returns the container-registered service when one is registered', () => {
    const fake = new FakeNotificationService();
    container.register(TOKENS.NotificationService, () => fake);

    const resolved = getNotificationService();

    expect(resolved).toBe(fake);
  });

  it('returns the no-op service when the container has no registration', () => {
    expect(container.has(TOKENS.NotificationService)).toBe(false);

    const resolved = getNotificationService();

    expect(resolved).toBe(noopNotificationService);
  });

  it('falls back to a service whose methods are inert and grant nothing', async () => {
    const service = getNotificationService();

    await expect(service.init({ dismissAction: 'Dismiss', channelName: 'Cooking timer', timerDoneBody: 'Timer is done!' })).resolves.toBeUndefined();
    await expect(service.requestPermissions()).resolves.toBe(false);
    await expect(
      service.scheduleTimerComplete('t1', 'Pasta', Date.now(), 'Timer is done!'),
    ).resolves.toEqual([]);
    await expect(service.cancel(['notif-1'])).resolves.toBeUndefined();
  });
});
