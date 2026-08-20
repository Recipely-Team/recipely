import { rowAt } from '@presentation/base/hooks/assistant/row-at';
import { useCallback, useMemo } from 'react';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';
import { useAssistantAction } from '@presentation/base/hooks/assistant/use-assistant-action';
import { CharConstants, ValueConstants } from '@core/constants';

/** The draft-editing capability this hook needs, named where it is consumed. */
interface AssistantDraftActionsDeps {
  recipe: EditableRecipe;
  onUpdateField: <K extends keyof EditableRecipe>(key: K, value: EditableRecipe[K]) => void;
  onAddIngredient: () => void;
  onChangeIngredient: (index: number, value: string) => void;
  onRemoveIngredient: (index: number) => void;
  onAddStep: () => void;
  onChangeStep: (index: number, value: string) => void;
  onRemoveStep: (index: number) => void;
  onOpenPhotos: () => void;
  onSubmitRefine: (instruction: string) => void;
  onRegenerate: () => void;
  onRequestPublish: () => void;
}

/**
 * Lets the assistant fill in the draft the user is watching.
 *
 * @remarks
 * - **This is the demonstration.** "Add two eggs" landing in the ingredient
 *   list while the user looks at it is the difference between an assistant and
 *   a chat window, and it is why the panel is a pill rather than a sheet.
 * - **Adding is two calls, not one.** The editor's `onAdd*` appends an EMPTY
 *   row — that is what a human tapping "+" wants — so the assistant appends
 *   and then writes into the row it just made. Doing only the first left a
 *   blank line the user had to fill in themselves, which is precisely the
 *   dictation this assistant exists not to be.
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
const FIELD_SEPARATOR = '=';
const NUMERIC_FIELDS = ['prepTimeMinutes', 'cookTimeMinutes', 'servings'] as const;
const TEXT_FIELDS = ['name', 'cuisine', 'category', 'difficulty'] as const;

export const useAssistantDraftActions = (deps: AssistantDraftActionsDeps): void => {
  const {
    recipe,
    onUpdateField,
    onAddIngredient,
    onChangeIngredient,
    onRemoveIngredient,
    onAddStep,
    onChangeStep,
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
        const at = (arg ?? CharConstants.empty).indexOf(FIELD_SEPARATOR);
        if (at < ValueConstants.zero) return { ok: false, error: 'expected_field_equals_value' };

        const field = (arg ?? CharConstants.empty).slice(ValueConstants.zero, at).trim();
        const value = (arg ?? CharConstants.empty).slice(at + FIELD_SEPARATOR.length).trim();

        if ((NUMERIC_FIELDS as readonly string[]).includes(field)) {
          const parsed = Number.parseInt(value, 10);
          if (!Number.isFinite(parsed)) return { ok: false, error: 'not_a_number' };
          onUpdateField(field as (typeof NUMERIC_FIELDS)[number], parsed);
          return { ok: true, n: counts };
        }
        if ((TEXT_FIELDS as readonly string[]).includes(field)) {
          onUpdateField(field as 'name', value);
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
        onAddIngredient();
        onChangeIngredient(recipe.ingredients.length, arg);
        return { ok: true, n: { ...counts, ing: counts.ing + ValueConstants.one } };
      },
      [onAddIngredient, onChangeIngredient, recipe.ingredients.length, counts],
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
        onAddStep();
        onChangeStep(recipe.instructions.length, arg);
        return { ok: true, n: { ...counts, step: counts.step + ValueConstants.one } };
      },
      [onAddStep, onChangeStep, recipe.instructions.length, counts],
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
