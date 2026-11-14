import { createStore } from 'zustand/vanilla';
import type { StoreApi } from 'zustand/vanilla';
import type { PremiumStore } from '@application/subscriptions/premium-store-contract';
import type { LoadPremiumPlansUseCase } from '@application/subscriptions/load-premium-plans-use-case';
import type { PurchasePremiumUseCase } from '@application/subscriptions/purchase-premium-use-case';
import type { RestorePremiumUseCase } from '@application/subscriptions/restore-premium-use-case';

interface PremiumStoreDeps {
  loadPlans: LoadPremiumPlansUseCase;
  purchase: PurchasePremiumUseCase;
  restore: RestorePremiumUseCase;
}

/**
 * Premium: the plans, buying and restoring, and the entitlement the backend confirmed.
 *
 * @remarks
 * - **Thin on purpose.** The paywall's flow (selected plan, spinners, errors) is the
 *   screen's own; this keeps only what other screens read, the entitlement.
 * - **Cleared with the session**, because premium belongs to one account.
 */
export const configurePremiumStore = (deps: PremiumStoreDeps): StoreApi<PremiumStore> =>
  createStore<PremiumStore>((set) => ({
    entitlement: null,
    loadPlans: () => deps.loadPlans.execute(),
    purchase: async (productId) => {
      const result = await deps.purchase.execute(productId);
      if (result.ok) set({ entitlement: result.value });
      return result;
    },
    restore: async () => {
      const result = await deps.restore.execute();
      if (result.ok && result.value !== null) set({ entitlement: result.value });
      return result;
    },
    clear: () => set({ entitlement: null }),
  }));
