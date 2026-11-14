import type { Container } from '@core/di/container';
import { TOKENS } from '@application/di/tokens';
import type { ApplicationStores } from '@application/di/application-stores';
import type { SubscriptionStoreInterface } from '@domain/subscriptions/subscription-store-interface';
import type { SubscriptionVerifierInterface } from '@domain/subscriptions/subscription-verifier-interface';
import { configurePremiumStore } from '@application/subscriptions/premium-store';
import { LoadPremiumPlansUseCase } from '@application/subscriptions/load-premium-plans-use-case';
import { PurchasePremiumUseCase } from '@application/subscriptions/purchase-premium-use-case';
import { RestorePremiumUseCase } from '@application/subscriptions/restore-premium-use-case';
import { LoadPremiumStatusUseCase } from '@application/subscriptions/load-premium-status-use-case';

export const registerPremium = (container: Container): Pick<ApplicationStores, 'premiumStore'> => {
  const store = container.resolve<SubscriptionStoreInterface>(TOKENS.SubscriptionStore);
  const verifier = container.resolve<SubscriptionVerifierInterface>(TOKENS.SubscriptionVerifier);
  const premiumStore = configurePremiumStore({
    loadPlans: new LoadPremiumPlansUseCase(store),
    purchase: new PurchasePremiumUseCase(store, verifier),
    restore: new RestorePremiumUseCase(store, verifier),
    loadStatus: new LoadPremiumStatusUseCase(verifier),
  });
  return { premiumStore };
};
