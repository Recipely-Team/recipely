import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { NotificationRepositoryInterface } from '@domain/notifications/notification-repository-interface';
import type { NotificationListResult } from '@domain/notifications/notification-list-result';
import { FIRST_PAGE } from '@domain/common/first-page';
import { PageSizes } from '@application/config/page-sizes';

interface ListNotificationsInput {
  page?: number;
  pageSize?: number;
}

/** Retrieves one page of the current user's notifications (the feed's page size unless told otherwise). */
export class ListNotificationsUseCase {
  constructor(private readonly repo: NotificationRepositoryInterface) {}

  execute(input: ListNotificationsInput = {}): Promise<Result<NotificationListResult, Failure>> {
    return this.repo.list(input.page ?? FIRST_PAGE, input.pageSize ?? PageSizes.notifications);
  }
}
