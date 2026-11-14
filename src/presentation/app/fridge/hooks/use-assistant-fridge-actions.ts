import { CharConstants, ValueConstants } from '@core/constants';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionError } from '@domain/assistant/actions/assistant-action-error';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import type { FridgeIdea } from '@domain/fridge/ideas/fridge-idea';
import { FridgeDiet } from '@domain/fridge/ideas/fridge-diet';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';
import { useAssistantScreenContent } from '@presentation/base/hooks/assistant/use-assistant-screen-content';
import { useAssistantScreenReading } from '@presentation/base/hooks/assistant/use-assistant-screen-reading';
import { SCREEN_PART_SEPARATOR } from '@presentation/base/hooks/assistant/args/describing/screen-line';
import { parseKeyValue } from '@presentation/base/hooks/assistant/args/resolving/parse-key-value';
import { rowAt } from '@presentation/base/hooks/assistant/args/resolving/row-at';
import { PickSource } from '@presentation/base/utils/pick-source';
import type { useFridgeFlow } from '@presentation/app/fridge/hooks/use-fridge-flow';
import { FridgeStep } from '@presentation/app/fridge/model/flow/fridge-step';
import { fridgeFilterFromVoice } from '@presentation/app/fridge/model/filters/fridge-filter-from-voice';

/** What the fridge screen lends the assistant. */
interface AssistantFridgeDeps {
  flow: ReturnType<typeof useFridgeFlow>;
  cook: (idea: FridgeIdea) => void;
  addMissing: (idea: FridgeIdea) => Promise<boolean>;
  /** The screen's own back: walks the steps, closes on the first. */
  onBack: () => void;
}

/** The word the model says for the camera; anything else opens the library. */
const CAMERA = 'camera';
const LIST_JOIN = CharConstants.commaSpace;

/**
 * **Cook from my fridge, by voice** — every step a tap reaches.
 *
 * @remarks
 * - **Words the model already knows** where one fits: `attachPhoto` (arg
 *   `camera` or none for the library), `addIngredient` / `removeIngredient` on
 *   the chips (an ingredient said on the photo step switches to typing them),
 *   `addFilter time=15|30|60|any, diet=vegetarian|vegan|highProtein|any,
 *   servings=1..12`, `clearFilters`, `openRecipe` to cook an idea,
 *   `addToShoppingList` for an idea's missing items, and `goBack` walking
 *   the steps. Two new ones name the screen's own buttons: `scanFridge` and
 *   `showFridgeIdeas`.
 * - **Each action answers only on the step it belongs to**, so "add eggs" on
 *   the ideas step is `unavailable_here`, not a silent change behind the cards.
 */
export const useAssistantFridgeActions = ({ flow, cook, addMissing, onBack }: AssistantFridgeDeps): void => {
  const { state } = flow;
  const { view } = state;
  const ideas = view.step === FridgeStep.Ideas ? view.ideas : [];
  const chips = state.chips.map((chip) => chip.name);
  const isCapture = view.step === FridgeStep.Capture;
  const isIngredients = view.step === FridgeStep.Ingredients;
  const isIdeas = view.step === FridgeStep.Ideas;

  const describe = (): string =>
    [
      `fridge step=${view.step}`,
      `photos=${String(state.photos.length)}`,
      ...(state.note.length > ValueConstants.zero ? [`note=${state.note}`] : []),
      `ingredients=${chips.join(LIST_JOIN)}`,
      `filters=time:${state.filters.maxMinutes === null ? 'any' : String(state.filters.maxMinutes)} diet:${state.filters.diet} servings:${String(state.filters.servings)}`,
      ...(isIdeas ? [`ideas=${ideas.map((idea, i) => `${String(i + ValueConstants.one)}) ${idea.title}`).join(CharConstants.space)}`] : []),
    ].join(SCREEN_PART_SEPARATOR);
  useAssistantScreenContent(describe);
  useAssistantScreenReading(describe);

  const ideaAt = (arg?: string): FridgeIdea | undefined => {
    const at = rowAt(ideas.map((idea) => idea.title), arg);
    return at === null ? undefined : ideas[at];
  };

  useAssistantAction(
    AssistantAction.AttachPhoto,
    async (arg?: string): Promise<AssistantActionResultType> => {
      void flow.addPhotos(arg?.trim().toLowerCase() === CAMERA ? PickSource.Camera : PickSource.Library);
      return { ok: true, awaiting: true };
    },
    isCapture,
  );

  useAssistantAction(
    AssistantAction.ScanFridge,
    async (): Promise<AssistantActionResultType> => {
      if (state.photos.length === ValueConstants.zero) return { ok: false, error: AssistantActionError.NotReady };
      void flow.findIngredients();
      return { ok: true, awaiting: true };
    },
    isCapture,
  );

  useAssistantAction(
    AssistantAction.AddIngredient,
    async (arg?: string): Promise<AssistantActionResultType> => {
      const name = arg?.trim() ?? CharConstants.empty;
      if (name.length === ValueConstants.zero) return { ok: false, error: AssistantActionError.Empty };
      if (isCapture) flow.typeInstead();
      flow.addChip(name);
      return { ok: true, title: name };
    },
    isCapture || isIngredients,
  );

  useAssistantAction(
    AssistantAction.RemoveIngredient,
    async (arg?: string): Promise<AssistantActionResultType> => {
      const at = rowAt(chips, arg);
      const chip = at === null ? undefined : state.chips[at];
      if (chip === undefined) return { ok: false, error: AssistantActionError.NotFound };
      flow.removeChip(chip);
      return { ok: true, title: chip.name };
    },
    isIngredients,
  );

  useAssistantAction(
    AssistantAction.AddFilter,
    async (arg?: string): Promise<AssistantActionResultType> => {
      const pair = parseKeyValue(arg);
      if (pair === null) return { ok: false, error: AssistantActionError.ExpectedKeyEqualsValue };
      const change = fridgeFilterFromVoice(pair.key, pair.value);
      if (change === null) return { ok: false, error: AssistantActionError.UnknownFilter };
      flow.changeFilters(change);
      return { ok: true };
    },
    isIngredients,
  );

  useAssistantAction(
    AssistantAction.ClearFilters,
    async (): Promise<AssistantActionResultType> => {
      flow.changeFilters({ maxMinutes: null, diet: FridgeDiet.None });
      return { ok: true };
    },
    isIngredients,
  );

  useAssistantAction(
    AssistantAction.ShowFridgeIdeas,
    async (): Promise<AssistantActionResultType> => {
      if (isIdeas) {
        flow.showMore();
        return { ok: true, awaiting: true };
      }
      if (chips.length === ValueConstants.zero) return { ok: false, error: AssistantActionError.NoIngredients };
      flow.showIdeas();
      return { ok: true, awaiting: true };
    },
    isIngredients || isIdeas,
  );

  useAssistantAction(
    AssistantAction.OpenRecipe,
    async (arg?: string): Promise<AssistantActionResultType> => {
      const idea = ideaAt(arg);
      if (idea === undefined) return { ok: false, error: AssistantActionError.NotFound };
      cook(idea);
      return { ok: true, title: idea.title };
    },
    isIdeas,
  );

  useAssistantAction(
    AssistantAction.AddToShoppingList,
    async (arg?: string): Promise<AssistantActionResultType> => {
      const idea = ideaAt(arg);
      if (idea === undefined) return { ok: false, error: AssistantActionError.NotFound };
      return (await addMissing(idea)) ? { ok: true, title: idea.title } : { ok: false, error: AssistantActionError.Failed };
    },
    isIdeas,
  );

  useAssistantAction(
    AssistantAction.GoBack,
    async (): Promise<AssistantActionResultType> => {
      onBack();
      return { ok: true };
    },
  );
};
