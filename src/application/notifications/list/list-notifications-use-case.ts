import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { NotificationRepositoryInterface } from '@domain/notifications/notification-repository-interface';
import type { ListNotificationsResult } from '@application/notifications/list/list-notifications-result';

interface ListNotificationsInput {
  limit?: number;
  offset?: number;
}

/** Retrieves a paginated list of notifications for the current user. */
export class ListNotificationsUseCase {
  constructor(private readonly repo: NotificationRepositoryInterface) {}

  execute(input: ListNotificationsInput = {}): Promise<Result<ListNotificationsResult, Failure>> {
    return this.repo.list(input.limit, input.offset);
  }
}
