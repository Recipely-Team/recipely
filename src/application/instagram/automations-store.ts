import { create } from 'zustand';
import type { BoundStore } from '@application/store/bound-store';
import { StoreStatus } from '@application/store/store-status';
import { ok } from '@core/result/result-helpers';
import { CharConstants } from '@core/constants';
import { FoodSearchGroup } from '@domain/diary/foods/search/food-search-group';
import type { DmRuleEntity } from '@domain/instagram/dm/dm-rule-entity';
import type { DmSend } from '@domain/instagram/activity/dm-send';
import type { InstagramMedia } from '@domain/instagram/instagram-media';
import type { RecipeFoodHit } from '@domain/diary/foods/search/recipe-food-hit';
import { PageSizes } from '@application/config/page-sizes';
import { RequestEpoch } from '@application/store/request-epoch';
import { KeyedRequestEpoch } from '@application/store/keyed-request-epoch';
import type { PagedList } from '@application/store/paging/paged-list';
import { PagedListLoader } from '@application/store/paging/paged-list-loader';
import type { AutomationsStoreState } from '@application/instagram/automations-store-state';
import type { ListDmRulesUseCase } from '@application/instagram/rules/list-dm-rules-use-case';
import type { GetDmRuleUseCase } from '@application/instagram/rules/get-dm-rule-use-case';
import type { SaveDmRuleUseCase } from '@application/instagram/rules/save-dm-rule-use-case';
import type { SetDmRuleEnabledUseCase } from '@application/instagram/rules/set-dm-rule-enabled-use-case';
import type { DeleteDmRuleUseCase } from '@application/instagram/rules/delete-dm-rule-use-case';
import type { ListInstagramMediaUseCase } from '@application/instagram/rules/list-instagram-media-use-case';
import type { ListDmSendsUseCase } from '@application/instagram/activity/list-dm-sends-use-case';
import type { SearchRecipeGroupUseCase } from '@application/diary/foods/search/search-recipe-group-use-case';

interface AutomationsStoreDeps {
  listRules: ListDmRulesUseCase;
  getRule: GetDmRuleUseCase;
  saveRule: SaveDmRuleUseCase;
  setEnabled: SetDmRuleEnabledUseCase;
  deleteRule: DeleteDmRuleUseCase;
  listMedia: ListInstagramMediaUseCase;
  listSends: ListDmSendsUseCase;
  /** The viewer's own recipes (`group=mine`), searchable and paged — the recipe picker. */
  searchMyRecipes: SearchRecipeGroupUseCase;
}

/** A loaded list with one item swapped by id; any other list unchanged. */
const replacing = (list: PagedList<DmRuleEntity>, rule: DmRuleEntity): PagedList<DmRuleEntity> =>
  list.status === StoreStatus.Loaded ? { ...list, items: list.items.map((item) => (item.id === rule.id ? rule : item)) } : list;

/**
 * Instagram automations (design spec §2–§4): the rules list, the editor's
 * post and recipe pickers, the opened rule and its activity — every list
 * paged on scroll through a `PagedListLoader`, whose generation drops a late
 * answer for a query, rule or reload the user already left.
 *
 * @remarks
 * - **The switch is optimistic.** It flips in the list and the opened rule at
 *   once; a refusal puts back the old value — unless a later flip of the same
 *   rule is already on its way, whose answer then decides.
 * - **A delete drops the row in place**; the loader re-reads the next page from
 *   the shifted offset, so no rule is skipped.
 * - **User-scoped**: cleared on sign-out.
 */
export const configureAutomationsStore = (deps: AutomationsStoreDeps): BoundStore<AutomationsStoreState> => {
  const flips = new KeyedRequestEpoch();
  const opening = new RequestEpoch();

  return create<AutomationsStoreState>((set, get) => {
    const rules = new PagedListLoader<DmRuleEntity>(() => get().rules, (list) => set({ rules: list }), (r) => r.id);
    const media = new PagedListLoader<InstagramMedia>(() => get().media, (list) => set({ media: list }), (m) => m.id);
    const recipes = new PagedListLoader<RecipeFoodHit>(() => get().recipes, (list) => set({ recipes: list }), (h) => h.key);
    const sends = new PagedListLoader<DmSend>(() => get().sends, (list) => set({ sends: list }), (s) => s.id);

    const show = (rule: DmRuleEntity): void =>
      set((s) => ({
        rules: replacing(s.rules, rule),
        ...(s.opened.status === StoreStatus.Loaded && s.opened.rule.id === rule.id ? { opened: { status: StoreStatus.Loaded, rule } } : {}),
      }));
    const loadRules = (): Promise<void> => rules.load((page) => deps.listRules.execute(page));

    return {
      rules: { status: StoreStatus.Idle },
      media: { status: StoreStatus.Idle },
      recipes: { status: StoreStatus.Idle },
      recipeQuery: CharConstants.empty,
      sends: { status: StoreStatus.Idle },
      opened: { status: StoreStatus.Idle },

      loadRules,
      loadMoreRules: () => rules.loadMore(),

      setEnabled: async (rule, enabled) => {
        const isLatestFlip = flips.start(rule.id);
        show(rule.withEnabled(enabled));
        const result = await deps.setEnabled.execute(rule.id, enabled);
        // A later flip overtook this one: its answer decides, and this one has nothing to report.
        if (!isLatestFlip()) return ok(undefined);
        if (result.ok) {
          show(result.value);
          return ok(undefined);
        }
        show(rule.withEnabled(rule.enabled));
        return result;
      },

      loadMedia: () => media.load((page) => deps.listMedia.execute(page)),
      loadMoreMedia: () => media.loadMore(),

      searchRecipes: (raw) => {
        const query = raw.trim();
        set({ recipeQuery: query });
        return recipes.load((page) => deps.searchMyRecipes.execute(query, FoodSearchGroup.Mine, page, PageSizes.dmRecipes));
      },
      loadMoreRecipes: () => recipes.loadMore(),

      openRule: async (id) => {
        const isCurrent = opening.start();
        const listed = get().rules;
        const cached = listed.status === StoreStatus.Loaded ? listed.items.find((rule) => rule.id === id) : undefined;
        set({ opened: cached === undefined ? { status: StoreStatus.Loading, id } : { status: StoreStatus.Loaded, rule: cached } });
        const result = await deps.getRule.execute(id);
        if (!isCurrent()) return;
        if (result.ok) set({ opened: { status: StoreStatus.Loaded, rule: result.value } });
        else if (cached === undefined) set({ opened: { status: StoreStatus.Error, id, failure: result.failure } });
      },

      loadSends: (ruleId) => sends.load((page) => deps.listSends.execute(ruleId, page)),
      loadMoreSends: () => sends.loadMore(),

      saveRule: async (draft, ruleId) => {
        const result = await deps.saveRule.execute(draft, ruleId);
        if (result.ok) {
          set({ opened: { status: StoreStatus.Loaded, rule: result.value } });
          void loadRules();
        }
        return result;
      },

      deleteRule: async (id) => {
        const result = await deps.deleteRule.execute(id);
        if (result.ok) {
          rules.removeItem(id);
          const opened = get().opened;
          if (opened.status === StoreStatus.Loaded && opened.rule.id === id) set({ opened: { status: StoreStatus.Idle } });
        }
        return result;
      },

      clear: () => {
        flips.invalidate();
        opening.invalidate();
        [rules, media, recipes, sends].forEach((loader) => loader.reset());
        set({ recipeQuery: CharConstants.empty, opened: { status: StoreStatus.Idle } });
      },
    };
  });
};
