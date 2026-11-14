import { ok, fail } from '@core/result/result-helpers';
import { CancelledFailure } from '@core/failure';
import { configurePremiumStore } from '@application/subscriptions/premium-store';
import type { LoadPremiumPlansUseCase } from '@application/subscriptions/load-premium-plans-use-case';
import type { PurchasePremiumUseCase } from '@application/subscriptions/purchase-premium-use-case';
import type { RestorePremiumUseCase } from '@application/subscriptions/restore-premium-use-case';

const PREMIUM = { isPremium: true, expiresAt: '2027-11-14T00:00:00.000Z' };

function store(purchase: PurchasePremiumUseCase['execute'], restore: RestorePremiumUseCase['execute']) {
  return configurePremiumStore({
    loadPlans: { execute: async () => ok([]) } as unknown as LoadPremiumPlansUseCase,
    purchase: { execute: purchase } as unknown as PurchasePremiumUseCase,
    restore: { execute: restore } as unknown as RestorePremiumUseCase,
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
});
