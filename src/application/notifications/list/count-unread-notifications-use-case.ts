import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { mapResult } from '@core/result/result-helpers';
import type { NotificationRepositoryInterface } from '@domain/notifications/notification-repository-interface';
import { FIRST_PAGE } from '@domain/common/first-page';
import { PageSizes } from '@application/config/page-sizes';

/**
 * **Count unread notifications** — the app-wide bell badge.
 *
 * @remarks
 * - The backend sends `unreadCount` with any page, so this asks for the
 *   smallest one (`PageSizes.unreadProbe`) and keeps only the count.
 */
export class CountUnreadNotificationsUseCase {
  constructor(private readonly repo: NotificationRepositoryInterface) {}

  async execute(): Promise<Result<number, Failure>> {
    const result = await this.repo.list(FIRST_PAGE, PageSizes.unreadProbe);
    return mapResult(result, (list) => list.unreadCount);
  }
}
