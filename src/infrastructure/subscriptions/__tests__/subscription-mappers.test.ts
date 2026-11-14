import { toVerifySubscriptionRequest } from '@infrastructure/subscriptions/to-verify-subscription-request';
import { toPremiumEntitlement } from '@infrastructure/subscriptions/to-premium-entitlement';

describe('subscription mappers', () => {
  it('sends the purchase with the store it came from', () => {
    expect(
      toVerifySubscriptionRequest({
        purchase: { productId: 'premium_monthly', transactionId: 'tx-1', purchaseToken: 'google-token' },
        platform: 'android',
      }),
    ).toEqual({ platform: 'android', productId: 'premium_monthly', transactionId: 'tx-1', purchaseToken: 'google-token' });
  });

  it('reads the entitlement, treating a missing expiry as none', () => {
    expect(toPremiumEntitlement({ isPremium: false })).toEqual({ ok: true, value: { isPremium: false, expiresAt: null } });
    expect(toPremiumEntitlement({ isPremium: true, expiresAt: '2027-01-01T00:00:00.000Z' })).toEqual({
      ok: true,
      value: { isPremium: true, expiresAt: '2027-01-01T00:00:00.000Z' },
    });
  });
});
