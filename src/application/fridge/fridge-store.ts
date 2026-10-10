import { create } from 'zustand';
import type { BoundStore } from '@application/store/bound-store';
import { FridgeAvailability } from '@application/fridge/fridge-availability';
import type { FridgeStoreState } from '@application/fridge/fridge-store-state';
import type { ScanFridgeUseCase } from '@application/fridge/scan-fridge-use-case';
import type { SuggestFridgeIdeasUseCase } from '@application/fridge/suggest-fridge-ideas-use-case';

interface FridgeStoreDeps {
  scan: ScanFridgeUseCase;
  suggestIdeas: SuggestFridgeIdeasUseCase;
  /** The `fridgeToRecipe` flag (admin override, else build value). */
  isEnabled: () => Promise<boolean>;
}

/**
 * **Cook from my fridge** — the flag that gates its entry points, and the two
 * AI calls the flow makes.
 *
 * @remarks
 * - **Page-scoped flow state.** Photos, chips, filters and ideas live in the
 *   fridge screen, like the AI create flow's prompt and phase; this store holds
 *   only what more than one screen reads — whether the feature is on.
 * - **Not user-scoped**: the flag is the same for every account, so sign-out
 *   leaves it alone (nothing to add to `clearSessionCaches`).
 */
export const configureFridgeStore = (deps: FridgeStoreDeps): BoundStore<FridgeStoreState> =>
  create<FridgeStoreState>((set, get) => {
    let asking: Promise<void> | null = null;
    return {
      availability: FridgeAvailability.Unknown,
      checkAvailability: () => {
        if (get().availability !== FridgeAvailability.Unknown) return Promise.resolve();
        asking ??= deps.isEnabled().then((on) => {
          set({ availability: on ? FridgeAvailability.On : FridgeAvailability.Off });
        });
        return asking;
      },
      scan: (input) => deps.scan.execute(input),
      suggestIdeas: (input) => deps.suggestIdeas.execute(input),
    };
  });
