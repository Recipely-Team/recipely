import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { NotificationRepositoryInterface } from '@domain/notifications/notification-repository-interface';

/** Marks every notification for the current user as read in a single request. */
export class MarkAllReadUseCase {
  constructor(private readonly repo: NotificationRepositoryInterface) {}

  execute(): Promise<Result<void, Failure>> {
    return this.repo.markAllRead();
  }
}
