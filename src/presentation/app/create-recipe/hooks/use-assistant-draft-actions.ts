import { rowAt } from '@presentation/base/hooks/assistant/row-at';
import { parseKeyValue } from '@presentation/base/hooks/assistant/parse-key-value';
import { useCallback, useMemo } from 'react';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { Difficulty } from '@domain/recipes/difficulty';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';
import { useAssistantAction } from '@presentation/base/hooks/assistant/use-assistant-action';
import { CharConstants, ValueConstants } from '@core/constants';

/** The draft-editing capability this hook needs, named where it is consumed. */
interface AssistantDraftActionsDeps {
  recipe: EditableRecipe;
  onUpdateField: <K extends keyof EditableRecipe>(key: K, value: EditableRecipe[K]) => void;
  onAddIngredient: (value?: string) => void;
  onRemoveIngredient: (index: number) => void;
  onAddStep: (value?: string) => void;
  onRemoveStep: (index: number) => void;
  onOpenPhotos: () => void;
  onSubmitRefine: (instruction: string) => void;
  onRegenerate: () => void;
  onRequestPublish: () => void;
}

const NUMERIC_FIELDS = ['prepTimeMinutes', 'cookTimeMinutes', 'servings'] as const;
/**
 * The fields that really are free text.
 *
 * `difficulty` is deliberately NOT here: it is a `Difficulty` enum, and the
 * cast that used to cover all four fields let `difficulty=easy` write the
 * lower-case string straight into the draft. The chip then rendered nothing
 * selected and publish sent the backend a value it rejects. `cuisine` and
 * `category` are opaque taxonomy keys the backend owns, so they pass through
 * as given — but they pass through as the strings they are.
 */
const TEXT_FIELDS = ['name', 'cuisine', 'category'] as const;
const DIFFICULTY_FIELD = 'difficulty';

/**
 * Lets the assistant fill in the draft the user is watching.
 *
 * @remarks
 * - **This is the demonstration.** "Add two eggs" landing in the ingredient
 *   list while the user looks at it is the difference between an assistant and
 *   a chat window, and it is why the panel is a pill rather than a sheet.
 * - **Adding is ONE call, carrying the text.** The editor's "+" appends a blank
 *   row, which is what a person tapping it wants; the assistant already knows
 *   what goes in it. Appending and then writing was two state updates, and two
 *   additions in one breath — "two eggs and 200 g of flour" — arrive as two
 *   tool calls in one model turn, which run as microtasks before React has
 *   re-rendered. Both then wrote to the same index: the eggs disappeared and a
 *   blank row took their place.
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
  const {
    recipe,
    onUpdateField,
    onAddIngredient,
    onRemoveIngredient,
    onAddStep,
    onRemoveStep,
    onOpenPhotos,
    onSubmitRefine,
    onRegenerate,
    onRequestPublish,
  } = deps;

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
            (d) => d === value.trim().toLocaleUpperCase(),
          );
          if (difficulty === undefined) return { ok: false, error: 'unknown_difficulty' };
          onUpdateField(DIFFICULTY_FIELD, difficulty);
          return { ok: true, title: recipe.name, n: counts };
        }
        if ((TEXT_FIELDS as readonly string[]).includes(field)) {
          onUpdateField(field as (typeof TEXT_FIELDS)[number], value);
          return { ok: true, title: recipe.name, n: counts };
        }
        return { ok: false, error: 'unknown_field' };
      },
      [onUpdateField, counts, recipe.name],
    ),
  );

  useAssistantAction(
    AssistantAction.AddIngredient,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        if (arg === undefined || arg === CharConstants.empty) return { ok: false, error: 'empty' };
        // One state update, not an append followed by a write. Two additions in
        // one model turn run as microtasks — before React re-renders — so the
        // second still saw the old length and both wrote to the same row.
        onAddIngredient(arg);
        return { ok: true, n: { ...counts, ing: counts.ing + ValueConstants.one } };
      },
      [onAddIngredient, counts],
    ),
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
  );

  useAssistantAction(
    AssistantAction.AddStep,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        if (arg === undefined || arg === CharConstants.empty) return { ok: false, error: 'empty' };
        onAddStep(arg);
        return { ok: true, n: { ...counts, step: counts.step + ValueConstants.one } };
      },
      [onAddStep, counts],
    ),
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
  );

  useAssistantAction(
    AssistantAction.AttachPhoto,
    useCallback(async (): Promise<AssistantActionResultType> => {
      // The picker is opened; the user chooses. A model that could pick a photo
      // could publish one the user never meant to share.
      onOpenPhotos();
      return { ok: true, awaiting: true };
    }, [onOpenPhotos]),
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
  );

  useAssistantAction(
    AssistantAction.PublishDraft,
    useCallback(async (): Promise<AssistantActionResultType> => {
      onRequestPublish();
      return { ok: true, awaiting: true, title: recipe.name, n: counts };
    }, [onRequestPublish, recipe.name, counts]),
  );
};
