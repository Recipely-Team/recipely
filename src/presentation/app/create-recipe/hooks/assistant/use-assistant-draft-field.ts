import { useStore } from 'zustand';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionError } from '@domain/assistant/actions/assistant-action-error';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { Difficulty } from '@domain/recipes/difficulty';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';
import { resolveTargetName } from '@presentation/base/hooks/assistant/args/resolving/resolve-target-name';
import { machineLower, machineUpper } from '@presentation/base/hooks/assistant/args/resolving/machine-case';
import { parseKeyValue } from '@presentation/base/hooks/assistant/args/resolving/parse-key-value';
import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';
import { ValueConstants } from '@core/constants';

/**
 * The numbers that stand alone.
 *
 * Prep and cook time describe the recipe; nothing else in it is computed from
 * them, so writing one outright leaves the draft consistent. {@link SERVINGS_FIELD}
 * is the one that is NOT like this.
 */
const NUMERIC_FIELDS = ['prepTimeMinutes', 'cookTimeMinutes'] as const;
/**
 * Servings, which is a SCALE and not a label.
 *
 * Every quantity in the ingredient list is a function of it, so writing the
 * number on its own produces a recipe that contradicts itself — "8 kişilik"
 * over ingredients for four. That is exactly what shipped: asked to make a
 * draft serve more people, the assistant set the field, reported success, and
 * left the quantities alone. Re-scaling is an AI job, so this answers with the
 * way through rather than doing half of it.
 */
const SERVINGS_FIELD = 'servings';
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
/** Named so the model can act on it: re-scaling goes to `refineDraft`. */
/** A generate call with nothing to generate from; the same word the global handler uses. */
const CUISINE_FIELD = 'cuisine';
const CATEGORY_FIELD = 'category';

/** Every field SetDraftField accepts, for matching the name a model sends however it spells it. */
const DRAFT_FIELDS: readonly string[] = [
  SERVINGS_FIELD,
  ...NUMERIC_FIELDS,
  DIFFICULTY_FIELD,
  CUISINE_FIELD,
  CATEGORY_FIELD,
  ...TEXT_FIELDS,
];

/** The draft and the setter the field action writes through. */
interface AssistantDraftFieldArgs {
  recipe: EditableRecipe;
  onUpdateField: <K extends keyof EditableRecipe>(key: K, value: EditableRecipe[K]) => void;
  isDraftVisible: boolean;
}

/**
 * `setDraftField`: the assistant writes one named field of the draft on screen.
 *
 * @remarks
 * - **It parses `field=value`** because the tool has one string argument. Only
 *   the fields a person would name out loud are writable: `media` is not one of
 *   them, and a model that could write it could clear the user's photos with a
 *   typo.
 * - **Servings is a scale, not a label.** It sat with the other numbers and was
 *   written outright, so "make it for eight" set the number and left the
 *   ingredient quantities where they were — a recipe that contradicts itself,
 *   reported as success. It answers `servings_needs_refine` now, and the refine
 *   re-scales the list.
 * - **Keys, not labels**: difficulty, cuisine and category resolve against
 *   their own vocabularies; an empty catalogue answers "not loaded", not
 *   "unknown".
 */
export const useAssistantDraftField = ({ recipe, onUpdateField, isDraftVisible }: AssistantDraftFieldArgs): void => {
  const { taxonomyStore } = useStores();
  const cuisines = useStore(taxonomyStore, (state) => state.cuisines);
  const categories = useStore(taxonomyStore, (state) => state.categories);
  const counts = { ing: recipe.ingredients.length, step: recipe.instructions.length };

  useAssistantAction(
    AssistantAction.SetDraftField,
    async (arg?: string): Promise<AssistantActionResultType> => {
      const parsed = parseKeyValue(arg);
      if (parsed === null) return { ok: false, error: AssistantActionError.ExpectedFieldEqualsValue };

      const { value } = parsed;
      // "Prep Time Minutes=10" and "prep_time_minutes=10" name the same field.
      const field = resolveTargetName(parsed.key, DRAFT_FIELDS) ?? parsed.key;

      // Servings changes quantities too, so they go through refine.
      if (field === SERVINGS_FIELD) return { ok: false, error: AssistantActionError.ServingsNeedsRefine };

      if ((NUMERIC_FIELDS as readonly string[]).includes(field)) {
        const parsed = Number.parseInt(value, 10);
        if (!Number.isFinite(parsed)) return { ok: false, error: AssistantActionError.NotANumber };
        onUpdateField(field as (typeof NUMERIC_FIELDS)[number], parsed);
        return { ok: true, n: counts };
      }
      if (field === DIFFICULTY_FIELD) {
        const difficulty = Object.values(Difficulty).find(
          (d) => d === machineUpper(value),
        );
        if (difficulty === undefined) return { ok: false, error: AssistantActionError.UnknownDifficulty };
        onUpdateField(DIFFICULTY_FIELD, difficulty);
        return { ok: true, title: recipe.name, n: counts };
      }
      if (field === CUISINE_FIELD || field === CATEGORY_FIELD) {
        // Accepts the backend key or the shown name.
        const options = field === CUISINE_FIELD ? cuisines : categories;
        // An empty catalogue means not loaded yet, not an unknown value.
        if (options.length === ValueConstants.zero) {
          return { ok: false, error: AssistantActionError.TaxonomyNotLoaded };
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
      return { ok: false, error: AssistantActionError.UnknownField };
    },
    isDraftVisible,
  );
};
