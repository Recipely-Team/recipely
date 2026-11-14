import { CancelledFailure, UnknownFailure } from '@core/failure';
import { IapSubscriptionStore } from '@infrastructure/subscriptions/iap-subscription-store';
import type { IapModule } from '@infrastructure/subscriptions/iap-module';

type PurchaseListener = Parameters<IapModule['onPurchase']>[0];
type ErrorListener = Parameters<IapModule['onPurchaseError']>[0];

function fakeIap(overrides: Partial<IapModule> = {}) {
  const purchaseListeners = new Set<PurchaseListener>();
  const errorListeners = new Set<ErrorListener>();
  const requests: { productId: string; offerToken: string | null }[] = [];
  const iap: IapModule = {
    connect: jest.fn(async () => undefined),
    fetchSubscriptions: async () => [
      { id: 'premium_monthly', displayPrice: '$4.99', androidOfferToken: 'token-monthly' },
      { id: 'premium_yearly', displayPrice: '$39.99', androidOfferToken: null },
    ],
    requestSubscription: async (productId, offerToken) => {
      requests.push({ productId, offerToken });
    },
    onPurchase: (listener) => {
      purchaseListeners.add(listener);
      return () => purchaseListeners.delete(listener);
    },
    onPurchaseError: (listener) => {
      errorListeners.add(listener);
      return () => errorListeners.delete(listener);
    },
    finish: jest.fn(async () => undefined),
    availablePurchases: async () => [
      { id: 't1', productId: 'premium_yearly', purchaseToken: null },
      { id: 't2', productId: 'some_other_app_item', purchaseToken: null },
    ],
    ...overrides,
  };
  return {
    iap,
    requests,
    purchaseListeners,
    emitPurchase: (purchase: Parameters<PurchaseListener>[0]) => [...purchaseListeners].forEach((l) => l(purchase)),
    emitError: (error: Parameters<ErrorListener>[0]) => [...errorListeners].forEach((l) => l(error)),
  };
}

const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('IapSubscriptionStore', () => {
  it('loads products with the store price and keeps the Android offer token for the purchase', async () => {
    const fake = fakeIap();
    const store = new IapSubscriptionStore(fake.iap);

    const products = await store.loadProducts(['premium_monthly', 'premium_yearly']);
    expect(products).toEqual({
      ok: true,
      value: [
        { id: 'premium_monthly', displayPrice: '$4.99' },
        { id: 'premium_yearly', displayPrice: '$39.99' },
      ],
    });

    const pending = store.purchase('premium_monthly');
    await flush();
    fake.emitPurchase({ id: 'tx-1', productId: 'premium_monthly', purchaseToken: 'google-token' });

    expect(fake.requests).toEqual([{ productId: 'premium_monthly', offerToken: 'token-monthly' }]);
    expect(await pending).toEqual({
      ok: true,
      value: { productId: 'premium_monthly', transactionId: 'tx-1', purchaseToken: 'google-token' },
    });
  });

  it('ignores an update for another product and stops listening once settled', async () => {
    const fake = fakeIap();
    const store = new IapSubscriptionStore(fake.iap);

    const pending = store.purchase('premium_yearly');
    await flush();
    fake.emitPurchase({ id: 'tx-other', productId: 'premium_monthly', purchaseToken: null });
    fake.emitPurchase({ id: 'tx-2', productId: 'premium_yearly', purchaseToken: null });

    const result = await pending;
    expect(result.ok && result.value.transactionId).toBe('tx-2');
    expect(fake.purchaseListeners.size).toBe(0);
  });

  it('answers a cancelled purchase with CancelledFailure', async () => {
    const fake = fakeIap();
    const pending = new IapSubscriptionStore(fake.iap).purchase('premium_yearly');
    await flush();
    fake.emitError({ isCancelled: true, message: 'cancelled' });

    const result = await pending;
    expect(!result.ok && result.failure).toBeInstanceOf(CancelledFailure);
  });

  it('answers a store error with UnknownFailure', async () => {
    const fake = fakeIap();
    const pending = new IapSubscriptionStore(fake.iap).purchase('premium_yearly');
    await flush();
    fake.emitError({ isCancelled: false, message: 'billing unavailable' });

    const result = await pending;
    expect(!result.ok && result.failure).toBeInstanceOf(UnknownFailure);
  });

  it('fails when the purchase request itself is rejected', async () => {
    const fake = fakeIap({
      requestSubscription: async () => {
        throw new Error('not allowed');
      },
    });

    const result = await new IapSubscriptionStore(fake.iap).purchase('premium_yearly');

    expect(!result.ok && result.failure).toBeInstanceOf(UnknownFailure);
  });

  it('restores only this app\'s premium purchases', async () => {
    const result = await new IapSubscriptionStore(fakeIap().iap).restore(['premium_monthly', 'premium_yearly']);

    expect(result).toEqual({ ok: true, value: [{ productId: 'premium_yearly', transactionId: 't1', purchaseToken: null }] });
  });

  it('connects once across calls, and again after a failed connect', async () => {
    let attempts = 0;
    const fake = fakeIap({
      connect: async () => {
        attempts += 1;
        if (attempts === 1) throw new Error('offline');
      },
    });
    const store = new IapSubscriptionStore(fake.iap);

    expect((await store.loadProducts(['premium_yearly'])).ok).toBe(false);
    expect((await store.loadProducts(['premium_yearly'])).ok).toBe(true);
    expect((await store.restore(['premium_yearly'])).ok).toBe(true);
    expect(attempts).toBe(2);
  });

  it('finishes a purchase by its transaction', async () => {
    const fake = fakeIap();

    await new IapSubscriptionStore(fake.iap).finish({ productId: 'premium_yearly', transactionId: 't1', purchaseToken: null });

    expect(fake.iap.finish).toHaveBeenCalledWith({ id: 't1', productId: 'premium_yearly', purchaseToken: null });
  });
});
