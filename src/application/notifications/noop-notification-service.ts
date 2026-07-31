import type { NotificationServiceInterface } from '@domain/notifications/notification-service-interface';

/**
 * Null-object notification service used only when none is registered in the
 * container (unit tests that exercise timer flows without the composition root).
 * Every method is inert — the real service is always registered before the UI
 * mounts in the app.
 */
export const noopNotificationService: NotificationServiceInterface = {
  init: async () => {},
  requestPermissions: async () => false,
  scheduleTimerComplete: async () => [],
  cancel: async () => {},
};
