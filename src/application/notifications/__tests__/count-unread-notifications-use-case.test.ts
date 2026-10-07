import { CountUnreadNotificationsUseCase } from '@application/notifications/list/count-unread-notifications-use-case';
import { PageSizes } from '@application/config/page-sizes';
import { NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { NotificationRepositoryInterface } from '@domain/notifications/notification-repository-interface';

describe('CountUnreadNotificationsUseCase', () => {
  it('asks for the smallest first page and keeps only the unread count', async () => {
    const list = jest.fn().mockResolvedValue(
      ok({ page: { items: [], total: 0, page: 1, pageSize: 1, hasMore: false }, unreadCount: 6 }),
    );
    const useCase = new CountUnreadNotificationsUseCase({ list } as unknown as NotificationRepositoryInterface);

    const result = await useCase.execute();

    expect(list).toHaveBeenCalledWith(1, PageSizes.unreadProbe);
    expect(result).toEqual(ok(6));
  });

  it('passes a failure through', async () => {
    const failure = new NetworkFailure('offline');
    const list = jest.fn().mockResolvedValue(fail(failure));
    const useCase = new CountUnreadNotificationsUseCase({ list } as unknown as NotificationRepositoryInterface);

    expect(await useCase.execute()).toEqual(fail(failure));
  });
});
