import { ListState } from '@presentation/base/hooks/assistant/args/describing/list-state';
import { rowAt } from '@presentation/base/hooks/assistant/args/resolving/row-at';
import { useCallback, useMemo } from 'react';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';
import type { RecipeDraft } from '@domain/drafts/recipe-draft';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';
import { draftFacts, draftName, draftTitle, namesTheDraft, resumeLine } from '@presentation/app/create-recipe/model/assistant/draft-screen-lines';
import { useAssistantDraftField } from '@presentation/app/create-recipe/hooks/assistant/use-assistant-draft-field';
import { useAssistantScreenContent } from '@presentation/base/hooks/assistant/use-assistant-screen-content';
import { useAssistantScreenReading } from '@presentation/base/hooks/assistant/use-assistant-screen-reading';
import { useAssistantReadActions } from '@presentation/base/hooks/assistant/actions/use-assistant-read-actions';
import { recipeReading } from '@presentation/base/hooks/assistant/args/describing/recipe-reading';
import { recipeRoster } from '@presentation/base/hooks/assistant/args/describing/recipe-roster';
import { SCREEN_PART_SEPARATOR } from '@presentation/base/hooks/assistant/args/describing/screen-line';
import { CharConstants, ValueConstants } from '@core/constants';
import { AssistantActionError } from '@domain/assistant/actions/assistant-action-error';

/** The draft-editing capability this hook needs, named where it is consumed. */
interface AssistantDraftActionsDeps {
  /**
   * Whether a draft is actually on screen.
   *
   * The prompt phase has no editor and no confirmation sheets, so registering
   * there let "add two eggs" write into something invisible and report
   * success, and `publishDraft` answer `awaiting` for a sheet that phase never
   * renders — leaving the spoken "yes" with nothing to land on.
   */
  isDraftVisible: boolean;
  /**
   * Whether the prompt phase — the one with the resume card on it — is what
   * the user is looking at. The draft actions belong to the editor; this one
   * belongs to the screen before it.
   */
  isPromptVisible: boolean;
  /**
   * Whether the "keep this draft?" sheet is the question in front of the user.
   *
   * The exit sheet registers `save` too — meaning "keep it and leave" — and it
   * registers FIRST, so without this gate the editor's own `save` would sit on
   * top of it and publish a recipe in answer to a question about leaving.
   */
  isExitPending: boolean;
  /**
   * Starts the recipe the user just asked for, once this draft has been dealt
   * with. Returns whether it ASKED rather than started, which is what lets the
   * model say the question out loud instead of announcing a recipe that is
   * waiting on an answer.
   */
  onGenerateAnother: (prompt: string) => boolean;
  /**
   * The rejection the user is looking at, when a publish came back refused.
   *
   * On the screen line because the assistant is asked about it: a publish that
   * failed answered `awaiting` several turns ago and nothing since has told the
   * model what happened, so "neden kaydedilmedi" had no answer and
   * "geliştiriciye bildir" had nothing to send.
   */
  saveProblem: string | null;
  /** The draft the prompt phase offers to continue, or null when there is none. */
  resumableDraft: RecipeDraft | null;
  onResumeDraft: () => void;
  recipe: EditableRecipe;
  onUpdateField: <K extends keyof EditableRecipe>(key: K, value: EditableRecipe[K]) => void;
  onAppendIngredient: (value: string) => void;
  onRemoveIngredient: (index: number) => void;
  onAppendStep: (value: string) => void;
  onRemoveStep: (index: number) => void;
  onOpenPhotos: () => void;
  onSubmitRefine: (instruction: string) => void;
  onRegenerate: () => void;
  onRequestPublish: () => void;
}

/** How the screen line names a publish the backend refused. */
const PROBLEM = 'problem';

/**
 * Lets the assistant fill in the draft the user is watching.
 *
 * @remarks
 * - **This is the demonstration.** "Add two eggs" landing in the ingredient
 *   list while the user looks at it is the difference between an assistant and
 *   a chat window, and it is why the panel is a pill rather than a sheet.
 * - **Adding is ONE call that carries the text**, and a DIFFERENT function from
 *   the one the "+" button uses. Appending and then writing was two state
 *   updates, and two additions in one breath — "two eggs and 200 g of flour" —
 *   arrive as two tool calls in one model turn, which run as microtasks before
 *   React re-renders: both wrote to the same index and the eggs disappeared.
 *   Giving the button's own handler an optional value instead would have been
 *   worse than the bug: `onPress` calls it with the gesture event, so a plain
 *   tap pushed a `GestureResponderEvent` into a `string[]`.
 * - **`refineDraft` is the way through for anything not directly editable.**
 *   The fields with their own setters are set outright — that is faster, exact,
 *   and the user watches it land. Everything else ("make it spicier", "halve
 *   it") has no field to write to, so it goes to the same AI refine the chat
 *   box drives, and comes back as a proposal the user accepts or rejects.
 * - **`save` and `publishDraft` are the same act here.** The button says
 *   Publish and a person says "kaydet"; with nothing registered under `save`,
 *   the word fell through to a recipe handler that was not mounted and the
 *   model, told only `unavailable_here`, started guessing out loud that the
 *   button might be further down the screen.
 * - **`publishDraft` asks; it does not publish.** A misheard "yayınla" that
 *   published immediately is not a mistake anyone can take back, and voice
 *   mishears. It opens the screen's confirm sheet and answers `awaiting`, so
 *   the model says so out loud while the user reads what is about to go out
 *   under their name.
 */
export const useAssistantDraftActions = (deps: AssistantDraftActionsDeps): void => {
  const {
    isDraftVisible,
    isPromptVisible,
    onGenerateAnother,
    isExitPending,
    saveProblem,
    resumableDraft,
    onResumeDraft,
    recipe,
    onUpdateField,
    onAppendIngredient,
    onRemoveIngredient,
    onAppendStep,
    onRemoveStep,
    onOpenPhotos,
    onSubmitRefine,
    onRegenerate,
    onRequestPublish,
  } = deps;

  // Ingredient names (first eight), so the assistant can read the draft aloud.
  useAssistantScreenContent(() =>
    !isDraftVisible
      ? resumeLine(resumableDraft)
      : [
          `draft=${draftName(recipe)}`,
          recipeRoster('ingredients', recipe.ingredients, ListState.Ready),
          `steps=${recipe.instructions.length}`,
          ...(saveProblem === null ? [] : [`${PROBLEM}=${saveProblem}`]),
        ].join(SCREEN_PART_SEPARATOR),
  );

  // The whole draft for readScreen; editor only — the prompt phase has nothing to read.
  useAssistantScreenReading(() =>
    !isDraftVisible
      ? resumeLine(resumableDraft)
      : recipeReading(draftName(recipe), recipe.ingredients, recipe.instructions, draftFacts(recipe)),
  );

  useAssistantReadActions(recipe.ingredients, recipe.instructions, isDraftVisible);

  // Resume-card press by voice; only where the card is shown.
  useAssistantAction(
    AssistantAction.OpenDraft,
    async (arg?: string): Promise<AssistantActionResultType> => {
      if (resumableDraft === null) return { ok: false, notMine: true };
      // A different draft belongs to the drafts list: pass it outward.
      if (!namesTheDraft(arg, resumableDraft)) return { ok: false, notMine: true };
      onResumeDraft();
      return { ok: true, title: draftTitle(resumableDraft) };
    },
    isPromptVisible && resumableDraft !== null,
  );

  // Memoised: every handler below depends on it.
  const counts = useMemo(
    () => ({ ing: recipe.ingredients.length, step: recipe.instructions.length }),
    [recipe.ingredients.length, recipe.instructions.length],
  );

  useAssistantDraftField({ recipe, onUpdateField, isDraftVisible });

  useAssistantAction(
    AssistantAction.AddIngredient,
    async (arg?: string): Promise<AssistantActionResultType> => {
      if (arg === undefined || arg === CharConstants.empty) return { ok: false, error: AssistantActionError.Empty };
      // One state update, so two additions in one turn do not overwrite each other.
      onAppendIngredient(arg);
      return { ok: true, n: { ...counts, ing: counts.ing + ValueConstants.one } };
    },
    isDraftVisible,
  );

  useAssistantAction(
    AssistantAction.RemoveIngredient,
    async (arg?: string): Promise<AssistantActionResultType> => {
      const index = rowAt(recipe.ingredients, arg);
      if (index === null) return { ok: false, error: AssistantActionError.NotFound };
      onRemoveIngredient(index);
      return { ok: true, n: { ...counts, ing: counts.ing - ValueConstants.one } };
    },
    isDraftVisible,
  );

  useAssistantAction(
    AssistantAction.AddStep,
    async (arg?: string): Promise<AssistantActionResultType> => {
      if (arg === undefined || arg === CharConstants.empty) return { ok: false, error: AssistantActionError.Empty };
      onAppendStep(arg);
      return { ok: true, n: { ...counts, step: counts.step + ValueConstants.one } };
    },
    isDraftVisible,
  );

  useAssistantAction(
    AssistantAction.RemoveStep,
    async (arg?: string): Promise<AssistantActionResultType> => {
      const index = rowAt(recipe.instructions, arg);
      if (index === null) return { ok: false, error: AssistantActionError.NotFound };
      onRemoveStep(index);
      return { ok: true, n: { ...counts, step: counts.step - ValueConstants.one } };
    },
    isDraftVisible,
  );

  useAssistantAction(
    AssistantAction.AttachPhoto,
    useCallback(async (): Promise<AssistantActionResultType> => {
      // Opens the picker only; the user chooses the photo.
      onOpenPhotos();
      return { ok: true, awaiting: true };
    }, [onOpenPhotos]),
    isDraftVisible,
  );

  useAssistantAction(
    AssistantAction.RefineDraft,
    async (arg?: string): Promise<AssistantActionResultType> => {
      if (arg === undefined || arg === CharConstants.empty) return { ok: false, error: AssistantActionError.Empty };
      onSubmitRefine(arg);
      // awaiting: the refine is a proposal the user still accepts or rejects.
      return { ok: true, awaiting: true, n: counts };
    },
    isDraftVisible,
  );

  useAssistantAction(
    AssistantAction.Regenerate,
    useCallback(async (): Promise<AssistantActionResultType> => {
      onRegenerate();
      return { ok: true };
    }, [onRegenerate]),
    isDraftVisible,
  );

  // Generating from the editor would discard this draft, so the screen asks first.
  useAssistantAction(
    AssistantAction.GenerateRecipe,
    async (arg?: string): Promise<AssistantActionResultType> => {
      if (arg === undefined || arg === CharConstants.empty) return { ok: false, error: AssistantActionError.EmptyPrompt };
      return onGenerateAnother(arg) ? { ok: true, awaiting: true } : { ok: true };
    },
    isDraftVisible,
  );

  // "save" here means publish: the same confirmation as publishDraft.
  useAssistantAction(
    AssistantAction.Save,
    useCallback(async (): Promise<AssistantActionResultType> => {
      onRequestPublish();
      return { ok: true, awaiting: true, title: recipe.name, n: counts };
    }, [onRequestPublish, recipe.name, counts]),
    isDraftVisible && !isExitPending,
  );

  useAssistantAction(
    AssistantAction.PublishDraft,
    useCallback(async (): Promise<AssistantActionResultType> => {
      onRequestPublish();
      return { ok: true, awaiting: true, title: recipe.name, n: counts };
    }, [onRequestPublish, recipe.name, counts]),
    isDraftVisible,
  );
};
