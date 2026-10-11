import { useState } from 'react';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import type { RecipeDraft } from '@domain/drafts/recipe-draft';
import { TabType } from '@presentation/app/my-recipes/model/tab-type';
import { draftName } from '@presentation/app/my-recipes/model/draft-name';
import { useAssistantMyRecipesActions } from '@presentation/app/my-recipes/hooks/use-assistant-my-recipes-actions';
import { useAssistantConfirmation } from '@presentation/base/hooks/assistant/actions/use-assistant-confirmation';
import { useAssistantListRecipeActions } from '@presentation/base/hooks/assistant/actions/use-assistant-list-recipe-actions';
import { useAssistantScreenContent } from '@presentation/base/hooks/assistant/use-assistant-screen-content';
import { useAssistantScreenReading } from '@presentation/base/hooks/assistant/use-assistant-screen-reading';
import { useAssistantScrollable } from '@presentation/base/hooks/assistant/actions/use-assistant-scrollable';
import type { ListStateType } from '@presentation/base/hooks/assistant/args/describing/list-state';
import { listReading } from '@presentation/base/hooks/assistant/args/describing/list-reading';
import { recipeRoster } from '@presentation/base/hooks/assistant/args/describing/recipe-roster';

/** Stable identity, so the Drafts tab does not hand the hook a new array a render. */
const EMPTY_ROWS: readonly { id: string; name: string }[] = [];

interface MyRecipesAssistantArgs {
  tab: TabType;
  items: readonly RecipeSummaryEntity[];
  drafts: readonly RecipeDraft[];
  tabListState: ListStateType;
  isTabSettled: boolean;
  setTab: (tab: TabType) => void;
  openRecipe: (id: string) => void;
  openDraft: (id: string) => void;
  deleteDraft: (id: string) => Promise<void>;
  onRefresh: () => void;
}

/**
 * Wires My Recipes to the voice assistant: tab switching, opening rows, the screen
 * description, scrolling, and the spoken answer to "delete this draft?".
 *
 * @remarks
 * - **Deleting a draft asks first — by voice AND by touch.** The pending draft lives here so
 *   the screen's sheet and the spoken confirmation read the same value; the draft row's trash
 *   icon calls `requestDraftDelete` too (it used to delete on the first tap, so a touch user got
 *   less protection than a voice user).
 * - **The tab decides which list a name refers to**; Drafts exposes no recipe rows.
 */
export const useMyRecipesAssistant = ({
  tab,
  items,
  drafts,
  tabListState,
  isTabSettled,
  setTab,
  openRecipe,
  openDraft,
  deleteDraft,
  onRefresh,
}: MyRecipesAssistantArgs) => {
  const [draftPendingDelete, setDraftPendingDelete] = useState<string | null>(null);
  useAssistantMyRecipesActions({
    tab,
    items,
    drafts,
    onSwitchTab: setTab,
    onOpenRecipe: openRecipe,
    onOpenDraft: openDraft,
    onRequestDeleteDraft: setDraftPendingDelete,
    onRefresh,
    isTabSettled,
  });
  useAssistantListRecipeActions(tab === TabType.Drafts ? EMPTY_ROWS : items);
  const scrollable = useAssistantScrollable();
  // Report rows only once the tab has loaded.
  useAssistantScreenContent(() =>
    tab === TabType.Drafts
      ? recipeRoster(TabType.Drafts, drafts.map(draftName), tabListState)
      : recipeRoster(tab, items.map((recipe) => recipe.name), tabListState),
  );
  // The whole tab for readScreen (the screen line above is capped at eight).
  useAssistantScreenReading(() =>
    tab === TabType.Drafts
      ? listReading(TabType.Drafts, drafts.map(draftName), tabListState)
      : listReading(tab, items.map((recipe) => recipe.name), tabListState),
  );
  const confirmDraftDelete = (): void => {
    if (draftPendingDelete !== null) void deleteDraft(draftPendingDelete);
    setDraftPendingDelete(null);
  };
  const cancelDraftDelete = (): void => setDraftPendingDelete(null);
  useAssistantConfirmation(draftPendingDelete !== null, confirmDraftDelete, cancelDraftDelete);

  return {
    scrollable,
    isDraftDeletePending: draftPendingDelete !== null,
    requestDraftDelete: setDraftPendingDelete,
    confirmDraftDelete,
    cancelDraftDelete,
  };
};
