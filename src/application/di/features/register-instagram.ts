import type { Container } from '@core/di/container';
import { TOKENS } from '@application/di/tokens';
import type { ApplicationStores } from '@application/di/application-stores';
import type { FoodCatalogRepositoryInterface } from '@domain/diary/foods/food-catalog-repository-interface';
import { SearchRecipeGroupUseCase } from '@application/diary/foods/search/search-recipe-group-use-case';
import type { InstagramRepositoryInterface } from '@domain/instagram/instagram-repository-interface';
import { configureInstagramStore } from '@application/instagram/instagram-store';
import { configureAutomationsStore } from '@application/instagram/automations-store';
import { GetInstagramConnectionUseCase } from '@application/instagram/connect/get-instagram-connection-use-case';
import { StartInstagramLoginUseCase } from '@application/instagram/connect/start-instagram-login-use-case';
import { FinalizeInstagramLinkUseCase } from '@application/instagram/connect/finalize-instagram-link-use-case';
import { DisconnectInstagramUseCase } from '@application/instagram/connect/disconnect-instagram-use-case';
import { ListDmRulesUseCase } from '@application/instagram/rules/list-dm-rules-use-case';
import { GetDmRuleUseCase } from '@application/instagram/rules/get-dm-rule-use-case';
import { SaveDmRuleUseCase } from '@application/instagram/rules/save-dm-rule-use-case';
import { SetDmRuleEnabledUseCase } from '@application/instagram/rules/set-dm-rule-enabled-use-case';
import { DeleteDmRuleUseCase } from '@application/instagram/rules/delete-dm-rule-use-case';
import { ListInstagramMediaUseCase } from '@application/instagram/rules/list-instagram-media-use-case';
import { ListDmSendsUseCase } from '@application/instagram/activity/list-dm-sends-use-case';
import { FeatureFlagResolver } from '@application/config/feature-flag-resolver';
import { FeatureFlagName } from '@application/config/feature-flag-name';
import type { FeatureFlagRepositoryInterface } from '@domain/flags/feature-flag-repository-interface';
import { IS_DEV_BUILD } from '@infrastructure/constants/app-variant';

/**
 * **Instagram composition** — the account link and the DM automations, gated by the
 * `InstagramAutomations` feature flag.
 */
export const registerInstagram = (
  container: Container,
): Pick<ApplicationStores, 'instagramStore' | 'automationsStore'> => {
  const foodCatalogRepo = container.resolve<FoodCatalogRepositoryInterface>(TOKENS.FoodCatalogRepository);
  const instagramRepo = container.resolve<InstagramRepositoryInterface>(TOKENS.InstagramRepository);
  const featureFlags = new FeatureFlagResolver(
    container.resolve<FeatureFlagRepositoryInterface>(TOKENS.FeatureFlagRepository),
    IS_DEV_BUILD,
  );
  const instagramStore = configureInstagramStore({
    isEnabled: () => featureFlags.isOn(FeatureFlagName.InstagramAutomations),
    getConnection: new GetInstagramConnectionUseCase(instagramRepo),
    startLogin: new StartInstagramLoginUseCase(instagramRepo),
    finalize: new FinalizeInstagramLinkUseCase(instagramRepo),
    disconnect: new DisconnectInstagramUseCase(instagramRepo),
  });
  const automationsStore = configureAutomationsStore({
    listRules: new ListDmRulesUseCase(instagramRepo),
    getRule: new GetDmRuleUseCase(instagramRepo),
    saveRule: new SaveDmRuleUseCase(instagramRepo),
    setEnabled: new SetDmRuleEnabledUseCase(instagramRepo),
    deleteRule: new DeleteDmRuleUseCase(instagramRepo),
    listMedia: new ListInstagramMediaUseCase(instagramRepo),
    listSends: new ListDmSendsUseCase(instagramRepo),
    searchMyRecipes: new SearchRecipeGroupUseCase(foodCatalogRepo),
  });
  return { instagramStore, automationsStore };
};
