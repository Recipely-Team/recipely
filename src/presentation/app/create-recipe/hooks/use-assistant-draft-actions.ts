import { machineLower, machineUpper } from '@presentation/base/hooks/assistant/args/resolving/machine-case';
import { rowAt } from '@presentation/base/hooks/assistant/args/resolving/row-at';
import { parseKeyValue } from '@presentation/base/hooks/assistant/args/resolving/parse-key-value';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useCallback, useMemo } from 'react';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { Difficulty } from '@domain/recipes/difficulty';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';
import type { RecipeDraft } from '@domain/drafts/recipe-draft';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';
import { useAssistantScreenContent } from '@presentation/base/hooks/assistant/use-assistant-screen-content';
import { useAssistantScreenReading } from '@presentation/base/hooks/assistant/use-assistant-screen-reading';
import { useAssistantReadActions } from '@presentation/base/hooks/assistant/actions/use-assistant-read-actions';
import { recipeReading } from '@presentation/base/hooks/assistant/args/describing/recipe-reading';
import { recipeRoster } from '@presentation/base/hooks/assistant/args/describing/recipe-roster';
import { SCREEN_PART_SEPARATOR } from '@presentation/base/hooks/assistant/args/describing/screen-line';
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

/** What the screen line says while the editor has not been reached yet. */
const NO_DRAFT = 'draft=none';
/** How the screen line names a publish the backend refused. */
const PROBLEM = 'problem';
/** A generated draft can reach the editor before it has been given a name. */
const NO_NAME = 'untitled';

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
const SERVINGS_NEEDS_REFINE = 'servings_needs_refine';
/** Why a new recipe cannot be started from on top of an unsaved draft. */
const DRAFT_ALREADY_OPEN = 'draft_open_would_be_lost';
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
 * - **Servings is a scale, not a label.** It sat with the other numbers and was
 *   written outright, so "make it for eight" set the number and left the
 *   ingredient quantities where they were — a recipe that contradicts itself,
 *   reported as success. It answers `servings_needs_refine` now, and the refine
 *   re-scales the list.
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
  const { taxonomyStore } = useStores();
  const cuisines = taxonomyStore((state) => state.cuisines);
  const categories = taxonomyStore((state) => state.categories);

  const {
    isDraftVisible,
    isPromptVisible,
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

  // The ingredients by NAME, not just a count — the one screen line in the app
  // that carries content rather than numbers, and for the same reason
  // `readStep` does: the user asked the assistant to read the draft's
  // ingredients out loud, and it had no way to know what they were. Bounded to
  // the first eight by `recipeRoster`, and only while the editor is open, so
  // what it costs is paid on the screen that needs it.
  useAssistantScreenContent(() =>
    !isDraftVisible
      ? resumeLine(resumableDraft)
      : [
          `draft=${draftName(recipe)}`,
          recipeRoster('ingredients', recipe.ingredients),
          `steps=${recipe.instructions.length}`,
          ...(saveProblem === null ? [] : [`${PROBLEM}=${saveProblem}`]),
        ].join(SCREEN_PART_SEPARATOR),
  );

  // The draft, in full, for `readScreen`. Registered on the editor and nowhere
  // else: the prompt phase has nothing to read.
  useAssistantScreenReading(() =>
    !isDraftVisible
      ? resumeLine(resumableDraft)
      : recipeReading(draftName(recipe), recipe.ingredients, recipe.instructions, draftFacts(recipe)),
  );

  // The same two the recipe screen registers. A generated draft has its
  // ingredients and its steps the moment it lands, and the user asking to hear
  // them back was told to publish it first and open it again.
  useAssistantReadActions(recipe.ingredients, recipe.instructions, isDraftVisible);

  // The resume card's own press, by voice. Registered only where the card is:
  // in the editor `openDraft` would mean some OTHER draft, and there is no
  // list here to choose one from.
  useAssistantAction(
    AssistantAction.OpenDraft,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        if (resumableDraft === null) return { ok: false, notMine: true };
        // A named draft that is not the one on offer belongs to the drafts
        // list, not to this card — declining passes the request outward
        // instead of opening the wrong recipe.
        if (!namesTheDraft(arg, resumableDraft)) return { ok: false, notMine: true };
        onResumeDraft();
        return { ok: true, title: draftTitle(resumableDraft) };
      },
      [resumableDraft, onResumeDraft],
    ),
    isPromptVisible && resumableDraft !== null,
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

        // Before the numeric branch it used to sit in: the answer is a
        // redirect, not a write. The model reads the reason and asks the
        // refine to do it properly, quantities and all.
        if (field === SERVINGS_FIELD) return { ok: false, error: SERVINGS_NEEDS_REFINE };

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

  // Generating from the editor would push a second create screen over this one
  // and leave the draft the user is looking at behind — reported as "şöyle yap
  // diyorum, gidip yeniden tarif oluşturuyor". The always-mounted handler is
  // shadowed here, and the reason is named so the model can say what it is:
  // changing this draft is `refineDraft`, and starting the same request again
  // is `regenerate`.
  useAssistantAction(
    AssistantAction.GenerateRecipe,
    useCallback(
      async (): Promise<AssistantActionResultType> => ({ ok: false, error: DRAFT_ALREADY_OPEN }),
      [],
    ),
    isDraftVisible,
  );

  // "Kaydet" is what a person says about the thing they have just written, and
  // this screen's button says Publish. With nothing registered under `save`
  // here, the word fell through to a recipe handler that was not mounted, came
  // back `unavailable_here`, and left the model guessing out loud that the
  // button might be somewhere further down the page. It is the publish
  // confirmation, same as `publishDraft` — never a silent publish.
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

/** What the screen line says before the editor: nothing open, and what is on offer. */
function resumeLine(draft: RecipeDraft | null): string {
  return draft === null
    ? NO_DRAFT
    : [NO_DRAFT, `resumable=${draftTitle(draft)}`].join(SCREEN_PART_SEPARATOR);
}

/** The draft's name, or a stand-in: a generated draft reaches the editor unnamed. */
function draftName(recipe: EditableRecipe): string {
  return recipe.name === CharConstants.empty ? NO_NAME : recipe.name;
}

/** The numbers printed beside the draft, for the reading only. */
function draftFacts(recipe: EditableRecipe): string[] {
  return [
    `servings=${recipe.servings}`,
    `prep=${recipe.prepTimeMinutes}`,
    `cook=${recipe.cookTimeMinutes}`,
    `difficulty=${recipe.difficulty}`,
  ];
}

function draftTitle(draft: RecipeDraft): string {
  const name = draft.snapshot.name?.trim() ?? CharConstants.empty;
  return name === CharConstants.empty ? NO_NAME : name;
}

/**
 * Whether what the model said refers to the one draft on offer.
 *
 * Loose on purpose: the model passes back the words it heard, and "the lentil
 * soup" is how a person names "Mercimek çorbası (taslak)". An empty argument —
 * "continue my draft" — is the common case and always matches.
 */
function namesTheDraft(arg: string | undefined, draft: RecipeDraft): boolean {
  const said = machineLower(arg ?? CharConstants.empty);
  if (said === CharConstants.empty) return true;
  const name = machineLower(draftTitle(draft));
  return name.includes(said) || said.includes(name);
}
