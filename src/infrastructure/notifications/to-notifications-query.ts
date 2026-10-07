import type { RequestMapper } from '@core/mapper/request-mapper';
import { ValueConstants } from '@core/constants';
import type { NotificationsQueryDto } from '@infrastructure/notifications/dtos/notifications-query-dto';

/** A 1-based page of the feed. */
interface NotificationsPageRequest {
  page: number;
  pageSize: number;
}

/** A 1-based page → the endpoint's `limit` / `offset` query. */
export const toNotificationsQuery: RequestMapper<NotificationsPageRequest, NotificationsQueryDto> = ({ page, pageSize }) => ({
  limit: pageSize,
  offset: (page - ValueConstants.one) * pageSize,
});
