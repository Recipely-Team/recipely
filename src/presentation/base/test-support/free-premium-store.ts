import { createStore, type StoreApi } from 'zustand/vanilla';
import { ok } from '@core/result/result-helpers';
import type { PremiumStore } from '@application/subscriptions/premium-store-contract';

/** A premium store for a free account that never calls a store or the backend — the render harness's default. */
export const freePremiumStore = (): StoreApi<PremiumStore> =>
  createStore<PremiumStore>(() => ({
    entitlement: null,
    hasChecked: true,
    refresh: async () => undefined,
    loadPlans: async () => ok([]),
    purchase: async () => ok({ isPremium: false, expiresAt: null }),
    restore: async () => ok(null),
    clear: () => undefined,
  }));
