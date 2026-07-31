import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { NotificationRepositoryInterface } from '@domain/notifications/notification-repository-interface';

/** Marks a single notification as read for the current user. */
export class MarkOneReadUseCase {
  constructor(private readonly repo: NotificationRepositoryInterface) {}

  execute(id: string): Promise<Result<void, Failure>> {
    return this.repo.markOneRead(id);
  }
}
