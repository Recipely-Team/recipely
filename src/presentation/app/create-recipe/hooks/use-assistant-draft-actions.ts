import { machineLower, machineUpper } from '@presentation/base/hooks/assistant/args/machine-case';
import { rowAt } from '@presentation/base/hooks/assistant/args/row-at';
import { parseKeyValue } from '@presentation/base/hooks/assistant/args/parse-key-value';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useCallback, useMemo } from 'react';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { Difficulty } from '@domain/recipes/difficulty';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';
import { useAssistantScreenContent } from '@presentation/base/hooks/assistant/use-assistant-screen-content';
import { recipeRoster } from '@presentation/base/hooks/assistant/args/recipe-roster';
import { CharConstants, ValueConstants } from '@core/constants';

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

/** What the screen line says while the editor has not been reached yet. */
const NO_DRAFT = 'draft=none';
/** A generated draft can reach the editor before it has been given a name. */
const NO_NAME = 'untitled';
/** Between the facts on one screen line, matching the registry's own joiner. */
const SCREEN_PART_SEPARATOR = '; ';

const NUMERIC_FIELDS = ['prepTimeMinutes', 'cookTimeMinutes', 'servings'] as const;
/**
 * The only field that really is free text.
 *
 * Everything else the model can set is a KEY, not a label. `difficulty` is a
 * `Difficulty` enum; `cuisine` and `category` are taxonomy keys the backend
 * owns and the chips resolve through the catalogue. One cast covering all four
 * let `difficulty=easy` and `cuisine=Italian` write labels straight into the
 * draft: the chip fell back to its placeholder and publish sent the backend
 * values it rejects. Each is resolved against its own vocabulary now.
 */
const TEXT_FIELDS = ['name'] as const;
const DIFFICULTY_FIELD = 'difficulty';
const CUISINE_FIELD = 'cuisine';
const CATEGORY_FIELD = 'category';

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
 * - **`setDraftField` parses `field=value`** because the tool has one string
 *   argument. Only the fields a person would name out loud are writable:
 *   `media` is not one of them, and a model that could write it could clear
 *   the user's photos with a typo.
 * - **`refineDraft` is the way through for anything not directly editable.**
 *   The fields with their own setters are set outright — that is faster, exact,
 *   and the user watches it land. Everything else ("make it spicier", "halve
 *   it") has no field to write to, so it goes to the same AI refine the chat
 *   box drives, and comes back as a proposal the user accepts or rejects.
 * - **`publishDraft` asks; it does not publish.** A misheard "yayınla" that
 *   published immediately is not a mistake anyone can take back, and voice
 *   mishears. It opens the screen's confirm sheet and answers `awaiting`, so
 *   the model says so out loud while the user reads what is about to go out
 *   under their name.
 */
export const useAssistantDraftActions = (deps: AssistantDraftActionsDeps): void => {
  const { taxonomyStore } = useStores();
  const cuisines = taxonomyStore((state) => state.cuisines);
  const categories = taxonomyStore((state) => state.categories);

  const {
    isDraftVisible,
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

  // The ingredients by NAME, not just a count — the one screen line in the app
  // that carries content rather than numbers, and for the same reason
  // `readStep` does: the user asked the assistant to read the draft's
  // ingredients out loud, and it had no way to know what they were. Bounded to
  // the first eight by `recipeRoster`, and only while the editor is open, so
  // what it costs is paid on the screen that needs it.
  useAssistantScreenContent(() =>
    !isDraftVisible
      ? NO_DRAFT
      : [
          `draft=${recipe.name === CharConstants.empty ? NO_NAME : recipe.name}`,
          recipeRoster('ingredients', recipe.ingredients),
          `steps=${recipe.instructions.length}`,
        ].join(SCREEN_PART_SEPARATOR),
  );

  // Memoised because every handler below carries it into a `useCallback`
  // dependency list; a fresh object per render would re-create all six on
  // every keystroke the user types into the draft.
  const counts = useMemo(
    () => ({ ing: recipe.ingredients.length, step: recipe.instructions.length }),
    [recipe.ingredients.length, recipe.instructions.length],
  );

  useAssistantAction(
    AssistantAction.SetDraftField,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const parsed = parseKeyValue(arg);
        if (parsed === null) return { ok: false, error: 'expected_field_equals_value' };

        const { key: field, value } = parsed;

        if ((NUMERIC_FIELDS as readonly string[]).includes(field)) {
          const parsed = Number.parseInt(value, 10);
          if (!Number.isFinite(parsed)) return { ok: false, error: 'not_a_number' };
          onUpdateField(field as (typeof NUMERIC_FIELDS)[number], parsed);
          return { ok: true, n: counts };
        }
        if (field === DIFFICULTY_FIELD) {
          const difficulty = Object.values(Difficulty).find(
            (d) => d === machineUpper(value),
          );
          if (difficulty === undefined) return { ok: false, error: 'unknown_difficulty' };
          onUpdateField(DIFFICULTY_FIELD, difficulty);
          return { ok: true, title: recipe.name, n: counts };
        }
        if (field === CUISINE_FIELD || field === CATEGORY_FIELD) {
          // The model says "Italian"; the draft holds the backend's key. Both
          // the key and the name are accepted, because the model has seen
          // whichever the screen showed it.
          const options = field === CUISINE_FIELD ? cuisines : categories;
          // An empty catalogue is not the same as an unrecognised value: the
          // app has simply not loaded it yet, and telling the model the
          // cuisine does not exist would have it say something untrue out loud.
          if (options.length === ValueConstants.zero) {
            return { ok: false, error: 'taxonomy_not_loaded' };
          }
          const wanted = machineLower(value);
          const match = options.find(
            (item) => machineLower(item.key) === wanted || machineLower(item.name) === wanted,
          );
          if (match === undefined) return { ok: false, error: `unknown_${field}` };

          onUpdateField(field, match.key);
          return { ok: true, title: recipe.name, n: counts };
        }
        if ((TEXT_FIELDS as readonly string[]).includes(field)) {
          onUpdateField(field as (typeof TEXT_FIELDS)[number], value);
          return { ok: true, title: recipe.name, n: counts };
        }
        return { ok: false, error: 'unknown_field' };
      },
      [onUpdateField, counts, recipe.name, cuisines, categories],
    ),
    isDraftVisible,
  );

  useAssistantAction(
    AssistantAction.AddIngredient,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        if (arg === undefined || arg === CharConstants.empty) return { ok: false, error: 'empty' };
        // One state update, not an append followed by a write. Two additions in
        // one model turn run as microtasks — before React re-renders — so the
        // second still saw the old length and both wrote to the same row.
        onAppendIngredient(arg);
        return { ok: true, n: { ...counts, ing: counts.ing + ValueConstants.one } };
      },
      [onAppendIngredient, counts],
    ),
    isDraftVisible,
  );

  useAssistantAction(
    AssistantAction.RemoveIngredient,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const index = rowAt(recipe.ingredients, arg);
        if (index === null) return { ok: false, error: 'not_found' };
        onRemoveIngredient(index);
        return { ok: true, n: { ...counts, ing: counts.ing - ValueConstants.one } };
      },
      [recipe.ingredients, onRemoveIngredient, counts],
    ),
    isDraftVisible,
  );

  useAssistantAction(
    AssistantAction.AddStep,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        if (arg === undefined || arg === CharConstants.empty) return { ok: false, error: 'empty' };
        onAppendStep(arg);
        return { ok: true, n: { ...counts, step: counts.step + ValueConstants.one } };
      },
      [onAppendStep, counts],
    ),
    isDraftVisible,
  );

  useAssistantAction(
    AssistantAction.RemoveStep,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const index = rowAt(recipe.instructions, arg);
        if (index === null) return { ok: false, error: 'not_found' };
        onRemoveStep(index);
        return { ok: true, n: { ...counts, step: counts.step - ValueConstants.one } };
      },
      [recipe.instructions, onRemoveStep, counts],
    ),
    isDraftVisible,
  );

  useAssistantAction(
    AssistantAction.AttachPhoto,
    useCallback(async (): Promise<AssistantActionResultType> => {
      // The picker is opened; the user chooses. A model that could pick a photo
      // could publish one the user never meant to share.
      onOpenPhotos();
      return { ok: true, awaiting: true };
    }, [onOpenPhotos]),
    isDraftVisible,
  );

  useAssistantAction(
    AssistantAction.RefineDraft,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        if (arg === undefined || arg === CharConstants.empty) return { ok: false, error: 'empty' };
        onSubmitRefine(arg);
        // The refine answers with a PROPOSAL the user accepts or rejects, so
        // this is awaiting even though nothing was destroyed — telling the
        // model it is done would have it announce a change that has not landed.
        return { ok: true, awaiting: true, n: counts };
      },
      [onSubmitRefine, counts],
    ),
    isDraftVisible,
  );

  useAssistantAction(
    AssistantAction.Regenerate,
    useCallback(async (): Promise<AssistantActionResultType> => {
      // "Start over" — the same button the preview offers. It replaces the
      // draft outright, so it goes through the screen's own control rather
      // than being assembled from a prompt here.
      onRegenerate();
      return { ok: true };
    }, [onRegenerate]),
    isDraftVisible,
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
