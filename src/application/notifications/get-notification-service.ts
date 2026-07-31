import { container } from '@core/di/container-instance';
import { TOKENS } from '@application/di/tokens';
import type { NotificationServiceInterface } from '@domain/notifications/notification-service-interface';
import { noopNotificationService } from '@application/notifications/noop-notification-service';

/**
 * Resolves the notification service from the DI container, falling back to an
 * inert no-op service when none is registered (DI-less unit test mounts). This
 * keeps presentation/application code off a concrete `@infrastructure` import.
 */
export const getNotificationService = (): NotificationServiceInterface =>
  container.has(TOKENS.NotificationService)
    ? container.resolve<NotificationServiceInterface>(TOKENS.NotificationService)
    : noopNotificationService;
