import type { Container } from '@core/di/container';
import { TOKENS } from '@application/di/tokens';
import type { ApplicationStores } from '@application/di/application-stores';
import type { FridgeRepositoryInterface } from '@domain/fridge/fridge-repository-interface';
import type { FeatureFlagResolver } from '@application/config/feature-flag-resolver';
import { FeatureFlagName } from '@application/config/feature-flag-name';
import { configureFridgeStore } from '@application/fridge/fridge-store';
import { ScanFridgeUseCase } from '@application/fridge/scan-fridge-use-case';
import { SuggestFridgeIdeasUseCase } from '@application/fridge/suggest-fridge-ideas-use-case';

/** **Fridge composition** — Cook from my fridge, gated by the `fridgeToRecipe` flag. */
export const registerFridge = (container: Container): Pick<ApplicationStores, 'fridgeStore'> => {
  const repo = container.resolve<FridgeRepositoryInterface>(TOKENS.FridgeRepository);
  const featureFlags = container.resolve<FeatureFlagResolver>(TOKENS.FeatureFlagResolver);
  const fridgeStore = configureFridgeStore({
    scan: new ScanFridgeUseCase(repo),
    suggestIdeas: new SuggestFridgeIdeasUseCase(repo),
    isEnabled: () => featureFlags.isOn(FeatureFlagName.FridgeToRecipe),
  });
  return { fridgeStore };
};
