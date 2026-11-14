import { ok, fail } from '@core/result/result-helpers';
import { configurePremiumStore } from '@application/subscriptions/premium-store';
import type { LoadPremiumPlansUseCase } from '@application/subscriptions/load-premium-plans-use-case';
import type { PurchasePremiumUseCase } from '@application/subscriptions/purchase-premium-use-case';
import type { RestorePremiumUseCase } from '@application/subscriptions/restore-premium-use-case';
import type { LoadPremiumStatusUseCase } from '@application/subscriptions/load-premium-status-use-case';
import { CancelledFailure, UnknownFailure } from '@core/failure';

const PREMIUM = { isPremium: true, expiresAt: '2027-11-14T00:00:00.000Z' };

function store(
  purchase: PurchasePremiumUseCase['execute'],
  restore: RestorePremiumUseCase['execute'],
  loadStatus: LoadPremiumStatusUseCase['execute'] = async () => ok({ isPremium: false, expiresAt: null }),
) {
  return configurePremiumStore({
    loadPlans: { execute: async () => ok([]) } as unknown as LoadPremiumPlansUseCase,
    purchase: { execute: purchase } as unknown as PurchasePremiumUseCase,
    restore: { execute: restore } as unknown as RestorePremiumUseCase,
    loadStatus: { execute: loadStatus } as unknown as LoadPremiumStatusUseCase,
  });
}

describe('premium store', () => {
  it('keeps the entitlement the backend confirmed after a purchase', async () => {
    const s = store(async () => ok(PREMIUM), async () => ok(null));

    await s.getState().purchase('premium_yearly');

    expect(s.getState().entitlement).toEqual(PREMIUM);
  });

  it('keeps nothing when the purchase was cancelled', async () => {
    const s = store(async () => fail(new CancelledFailure()), async () => ok(null));

    await s.getState().purchase('premium_yearly');

    expect(s.getState().entitlement).toBeNull();
  });

  it('keeps a restored entitlement, and nothing when there was nothing to restore', async () => {
    const restored = store(async () => ok(PREMIUM), async () => ok(PREMIUM));
    const empty = store(async () => ok(PREMIUM), async () => ok(null));

    await restored.getState().restore();
    await empty.getState().restore();

    expect(restored.getState().entitlement).toEqual(PREMIUM);
    expect(empty.getState().entitlement).toBeNull();
  });

  it('forgets the entitlement on clear, for sign-out', async () => {
    const s = store(async () => ok(PREMIUM), async () => ok(null));
    await s.getState().purchase('premium_yearly');

    s.getState().clear();

    expect(s.getState().entitlement).toBeNull();
  });

  it('learns the entitlement from the backend once, with concurrent refreshes sharing one request', async () => {
    const loadStatus = jest.fn(async () => ok(PREMIUM));
    const s = store(async () => ok(PREMIUM), async () => ok(null), loadStatus);

    await Promise.all([s.getState().refresh(), s.getState().refresh()]);

    expect(loadStatus).toHaveBeenCalledTimes(1);
    expect(s.getState().entitlement).toEqual(PREMIUM);
    expect(s.getState().hasChecked).toBe(true);
  });

  it('stays unchecked after a failed status call, so the next screen asks again', async () => {
    const s = store(async () => ok(PREMIUM), async () => ok(null), async () => fail(new UnknownFailure('offline')));

    await s.getState().refresh();

    expect(s.getState().hasChecked).toBe(false);
    expect(s.getState().entitlement).toBeNull();
  });
});
