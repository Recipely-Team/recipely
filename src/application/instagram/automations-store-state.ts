import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { DmRuleEntity } from '@domain/instagram/dm/dm-rule-entity';
import type { DmRuleDraft } from '@domain/instagram/dm/dm-rule-draft';
import type { DmSend } from '@domain/instagram/activity/dm-send';
import type { InstagramMedia } from '@domain/instagram/instagram-media';
import type { RecipeFoodHit } from '@domain/diary/foods/search/recipe-food-hit';
import type { PagedList } from '@application/store/paging/paged-list';
import type { OpenedRuleState } from '@application/instagram/rules/opened-rule-state';

export interface AutomationsStoreState {
  rules: PagedList<DmRuleEntity>;
  /** The editor's post picker. */
  media: PagedList<InstagramMedia>;
  /** The editor's recipe picker: the viewer's own recipes, searched by `recipeQuery`. */
  recipes: PagedList<RecipeFoodHit>;
  recipeQuery: string;
  /** The opened rule's activity. */
  sends: PagedList<DmSend>;
  opened: OpenedRuleState;
  loadRules: () => Promise<void>;
  loadMoreRules: () => Promise<void>;
  /** Flips the switch at once; puts it back when the server refuses, if no later flip overtook it — an overtaken flip reports nothing. */
  setEnabled: (rule: DmRuleEntity, enabled: boolean) => Promise<Result<void, Failure>>;
  loadMedia: () => Promise<void>;
  loadMoreMedia: () => Promise<void>;
  /** Searches the viewer's recipes from the first page; the newest query wins. */
  searchRecipes: (query: string) => Promise<void>;
  loadMoreRecipes: () => Promise<void>;
  /** Opens a rule by id — from the list at once when it is there, then fresh from the server. */
  openRule: (id: string) => Promise<void>;
  loadSends: (ruleId: string) => Promise<void>;
  loadMoreSends: () => Promise<void>;
  /** Creates (ruleId null) or rewrites a rule; the list reloads from page 1 on success. */
  saveRule: (draft: DmRuleDraft, ruleId: string | null) => Promise<Result<DmRuleEntity, Failure>>;
  deleteRule: (id: string) => Promise<Result<void, Failure>>;
  /** Drops everything. Called when the session ends. */
  clear: () => void;
}
