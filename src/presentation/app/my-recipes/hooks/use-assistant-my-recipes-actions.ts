import { machineLower } from '@presentation/base/hooks/assistant/args/resolving/machine-case';
import { rowAt } from '@presentation/base/hooks/assistant/args/resolving/row-at';
import { useCallback } from 'react';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import type { RecipeDraft } from '@domain/drafts/recipe-draft';
import { draftName } from '@presentation/app/my-recipes/model/draft-name';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { TabType } from '@presentation/app/my-recipes/model/tab-type';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';
import { CharConstants } from '@core/constants';

/** What this screen lends the assistant, named where it is consumed. */
interface AssistantMyRecipesActionsDeps {
  tab: TabType;
  items: readonly RecipeSummaryEntity[];
  drafts: readonly RecipeDraft[];
  onSwitchTab: (tab: TabType) => void;
  onOpenRecipe: (id: string) => void;
  onOpenDraft: (id: string) => void;
  onRequestDeleteDraft: (id: string) => void;
  onRefresh: () => void;
}

/**
 * My Recipes, by voice.
 *
 * @remarks
 * - **Switching tabs in place, not by navigating again.** "Now show my liked
 *   ones" while already here should move the tab, the way tapping it does —
 *   pushing the route again would stack a second copy of the screen the user
 *   is already looking at, and back would then return to the same screen.
 * - **Rows are found by name.** The user says "open the lentil soup", not an
 *   id; they are reading the list while they say it. A position works too, for
 *   "open the first one".
 * - **Deleting a draft asks.** It is the only thing on this screen that
 *   destroys something, and a draft is unrecoverable work.
 */
export const useAssistantMyRecipesActions = (deps: AssistantMyRecipesActionsDeps): void => {
  const { tab, items, drafts, onSwitchTab, onOpenRecipe, onOpenDraft, onRequestDeleteDraft, onRefresh } =
    deps;

  useAssistantAction(
    AssistantAction.SwitchTab,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const wanted = machineLower(arg ?? CharConstants.empty);
        const match = Object.values(TabType).find((value) => value === wanted);
        if (match === undefined) return { ok: false, error: 'unknown_tab' };

        onSwitchTab(match);
        return { ok: true };
      },
      [onSwitchTab],
    ),
  );

  useAssistantAction(
    AssistantAction.OpenRecipe,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const found = rowAt(items.map((r) => r.name), arg);
        // Declining rather than failing: the recipe may be one the user knows
        // from the feed, and the always-mounted handler underneath can open it
        // by name or by id. This tab only answers for the rows it is showing —
        // on Drafts, that is not even the same collection.
        if (found === null) return { ok: false, notMine: true };

        onOpenRecipe(items[found]!.id);
        return { ok: true, title: items[found]!.name };
      },
      [items, onOpenRecipe],
    ),
  );

  useAssistantAction(
    AssistantAction.OpenDraft,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const found = rowAt(drafts.map(draftName), arg);
        if (found === null) return { ok: false, error: 'not_found' };

        onOpenDraft(drafts[found]!.id);
        return { ok: true, title: draftName(drafts[found]!) };
      },
      [drafts, onOpenDraft],
    ),
  );

  useAssistantAction(
    AssistantAction.DeleteDraft,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const found = rowAt(drafts.map(draftName), arg);
        if (found === null) return { ok: false, error: 'not_found' };

        onRequestDeleteDraft(drafts[found]!.id);
        return { ok: true, awaiting: true, title: draftName(drafts[found]!) };
      },
      [drafts, onRequestDeleteDraft],
    ),
  );

  useAssistantAction(
    AssistantAction.Refresh,
    useCallback(async (): Promise<AssistantActionResultType> => {
      onRefresh();
      return { ok: true, ctx: `tab=${tab}` };
    }, [onRefresh, tab]),
  );
};

