import { CancelledFailure, UnknownFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import { LoadPremiumPlansUseCase } from '@application/subscriptions/load-premium-plans-use-case';
import { PurchasePremiumUseCase } from '@application/subscriptions/purchase-premium-use-case';
import { RestorePremiumUseCase } from '@application/subscriptions/restore-premium-use-case';
import { PREMIUM_PRODUCT_IDS } from '@application/subscriptions/premium-product-ids';
import type { SubscriptionStoreInterface } from '@domain/subscriptions/subscription-store-interface';
import type { SubscriptionVerifierInterface } from '@domain/subscriptions/subscription-verifier-interface';
import type { SubscriptionPurchase } from '@domain/subscriptions/subscription-purchase';

const purchase = (transactionId: string, productId = 'premium_yearly'): SubscriptionPurchase => ({
  productId,
  transactionId,
  purchaseToken: null,
});
const PREMIUM = { isPremium: true, expiresAt: '2027-11-14T00:00:00.000Z' };
const EXPIRED = { isPremium: false, expiresAt: null };

function setup(store: Partial<SubscriptionStoreInterface>, verify: SubscriptionVerifierInterface['verify']) {
  const calls: string[] = [];
  const fullStore: SubscriptionStoreInterface = {
    loadProducts: jest.fn(async () => ok([])),
    purchase: async () => ok(purchase('tx')),
    restore: async () => ok([]),
    finish: async (p) => {
      calls.push(`finish:${p.transactionId}`);
      return ok(undefined);
    },
    ...store,
  };
  const verifier: SubscriptionVerifierInterface = {
    verify: async (p) => {
      calls.push(`verify:${p.transactionId}`);
      return verify(p);
    },
  };
  return { fullStore, verifier, calls };
}

describe('LoadPremiumPlansUseCase', () => {
  it('asks the store for both premium plans', async () => {
    const { fullStore } = setup({}, async () => ok(PREMIUM));

    await new LoadPremiumPlansUseCase(fullStore).execute();

    expect(fullStore.loadProducts).toHaveBeenCalledWith(PREMIUM_PRODUCT_IDS);
  });
});

describe('PurchasePremiumUseCase', () => {
  it('verifies with the backend before finishing the purchase', async () => {
    const { fullStore, verifier, calls } = setup({}, async () => ok(PREMIUM));

    const result = await new PurchasePremiumUseCase(fullStore, verifier).execute('premium_yearly');

    expect(result).toEqual(ok(PREMIUM));
    expect(calls).toEqual(['verify:tx', 'finish:tx']);
  });

  it('passes a cancelled store sheet through, without verifying', async () => {
    const { fullStore, verifier, calls } = setup({ purchase: async () => fail(new CancelledFailure()) }, async () => ok(PREMIUM));

    const result = await new PurchasePremiumUseCase(fullStore, verifier).execute('premium_yearly');

    expect(!result.ok && result.failure).toBeInstanceOf(CancelledFailure);
    expect(calls).toEqual([]);
  });

  it('leaves the purchase unfinished when the backend cannot verify it, so a restore can retry', async () => {
    const { fullStore, verifier, calls } = setup({}, async () => fail(new UnknownFailure('offline')));

    const result = await new PurchasePremiumUseCase(fullStore, verifier).execute('premium_yearly');

    expect(result.ok).toBe(false);
    expect(calls).toEqual(['verify:tx']);
  });
});

describe('RestorePremiumUseCase', () => {
  it('answers null when the store holds nothing to restore', async () => {
    const { fullStore, verifier } = setup({}, async () => ok(PREMIUM));

    expect(await new RestorePremiumUseCase(fullStore, verifier).execute()).toEqual(ok(null));
  });

  it('restores from the purchase that still grants premium, past an expired one', async () => {
    const { fullStore, verifier, calls } = setup(
      { restore: async () => ok([purchase('old'), purchase('current')]) },
      async (p) => ok(p.transactionId === 'current' ? PREMIUM : EXPIRED),
    );

    const result = await new RestorePremiumUseCase(fullStore, verifier).execute();

    expect(result).toEqual(ok(PREMIUM));
    expect(calls).toEqual(['verify:old', 'finish:old', 'verify:current', 'finish:current']);
  });

  it('reports the failure when no purchase could be verified', async () => {
    const { fullStore, verifier } = setup(
      { restore: async () => ok([purchase('a')]) },
      async () => fail(new UnknownFailure('offline')),
    );

    const result = await new RestorePremiumUseCase(fullStore, verifier).execute();

    expect(result.ok).toBe(false);
  });
});
