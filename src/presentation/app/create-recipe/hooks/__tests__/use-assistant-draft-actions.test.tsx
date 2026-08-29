import { act } from 'react-test-renderer';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import { Difficulty } from '@domain/recipes/difficulty';
import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';
import type { RecipeDraft } from '@domain/drafts/recipe-draft';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import type { Stores } from '@presentation/bootstrap/stores';
import { useAssistantDraftActions } from '@presentation/app/create-recipe/hooks/use-assistant-draft-actions';

const CUISINES = [{ key: 'italian', name: 'İtalyan', emoji: '🇮🇹' }];
const CATEGORIES = [{ key: 'soup', name: 'Çorba', emoji: '🍲' }];

const emptyRecipe = (): EditableRecipe => ({
  name: 'Taslak',
  cuisine: null,
  category: '',
  difficulty: Difficulty.Easy,
  prepTimeMinutes: 0,
  cookTimeMinutes: 0,
  servings: 2,
  ingredients: ['2 yumurta'],
  instructions: ['Fırını ısıt'],
  media: [],
});

/** The one draft the prompt phase offers to continue. */
const RESUMABLE: RecipeDraft = {
  id: 'draft-1',
  prompt: 'mercimek',
  snapshot: { name: 'Mercimek çorbası' },
  chatHistory: [],
  updatedAt: new Date(0),
} as unknown as RecipeDraft;

function harness(
  loaded = true,
  phase: { isDraftVisible: boolean; resumable: RecipeDraft | null } = { isDraftVisible: true, resumable: null },
  isExitPending = false,
) {
  const registry = new AssistantActionRegistry();
  const taxonomyStore = ((selector: (state: unknown) => unknown) =>
    selector({ cuisines: loaded ? CUISINES : [], categories: loaded ? CATEGORIES : [] })) as unknown as Stores['taxonomyStore'];

  const spies = {
    onUpdateField: jest.fn(),
    onAppendIngredient: jest.fn(),
    onRemoveIngredient: jest.fn(),
    onAppendStep: jest.fn(),
    onRemoveStep: jest.fn(),
    onOpenPhotos: jest.fn(),
    onSubmitRefine: jest.fn(),
    onRegenerate: jest.fn(),
    onRequestPublish: jest.fn(),
    onResumeDraft: jest.fn(),
  };

  const Probe = (): null => {
    useAssistantDraftActions({
      isDraftVisible: phase.isDraftVisible,
      isPromptVisible: !phase.isDraftVisible,
      isExitPending,
      saveProblem: null,
      resumableDraft: phase.resumable,
      recipe: emptyRecipe(),
      ...spies,
    });
    return null;
  };

  renderComponent(
    <StoresProvider value={{ assistantActionRegistry: registry, taxonomyStore } as unknown as Stores}>
      <Probe />
    </StoresProvider>,
  );

  return { registry, spies };
}

describe('useAssistantDraftActions', () => {
  // Two calls arrive in ONE model turn and run as microtasks, before React has
  // re-rendered. Appending a blank row and then writing into it made the second
  // call read the same pre-render length, so both wrote to the same index: the
  // first ingredient disappeared and a blank row took its place.
  it('adds each ingredient in one call, so two in a breath both land', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await registry.run(AssistantAction.AddIngredient, '2 yumurta');
      await registry.run(AssistantAction.AddIngredient, '200 g un');
    });

    expect(spies.onAppendIngredient.mock.calls).toEqual([['2 yumurta'], ['200 g un']]);
  });

  it('adds each step in one call too', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await registry.run(AssistantAction.AddStep, 'Yoğur');
      await registry.run(AssistantAction.AddStep, 'Pişir');
    });

    expect(spies.onAppendStep.mock.calls).toEqual([['Yoğur'], ['Pişir']]);
  });

  describe('setDraftField', () => {
    // The draft holds a `Difficulty` enum. One cast covering four fields let
    // the lower-case word straight in: the chip rendered nothing selected and
    // publish sent the backend a value it rejects.
    it('resolves a difficulty to its enum value', async () => {
      const { registry, spies } = harness();

      await act(async () => {
        await registry.run(AssistantAction.SetDraftField, 'difficulty=easy');
      });

      expect(spies.onUpdateField).toHaveBeenCalledWith('difficulty', Difficulty.Easy);
    });

    // On a Turkish device `'medium'.toLocaleUpperCase()` is `MEDİUM`, which
    // never equals `MEDIUM` — every difficulty the assistant set would have
    // failed on exactly the devices this app is built for.
    it('matches a difficulty regardless of the device locale', async () => {
      const { registry, spies } = harness();

      await act(async () => {
        await registry.run(AssistantAction.SetDraftField, 'difficulty=MEDIUM');
        await registry.run(AssistantAction.SetDraftField, 'difficulty=medium');
      });

      expect(spies.onUpdateField).toHaveBeenNthCalledWith(1, 'difficulty', Difficulty.Medium);
      expect(spies.onUpdateField).toHaveBeenNthCalledWith(2, 'difficulty', Difficulty.Medium);
    });

    it('refuses a difficulty that is not one', async () => {
      const { registry, spies } = harness();

      await act(async () => {
        await expect(registry.run(AssistantAction.SetDraftField, 'difficulty=trivial')).resolves.toMatchObject({
          ok: false,
          error: 'unknown_difficulty',
        });
      });

      expect(spies.onUpdateField).not.toHaveBeenCalled();
    });

    // `cuisine` is a backend KEY, not the label the model saw. Writing the
    // label made the chip fall back to its placeholder and publish send a
    // value the backend rejects.
    it('turns a cuisine name into the key the draft holds', async () => {
      const { registry, spies } = harness();

      await act(async () => {
        await registry.run(AssistantAction.SetDraftField, 'cuisine=İtalyan');
      });

      expect(spies.onUpdateField).toHaveBeenCalledWith('cuisine', 'italian');
    });

    it('accepts the key itself as well', async () => {
      const { registry, spies } = harness();

      await act(async () => {
        await registry.run(AssistantAction.SetDraftField, 'category=soup');
      });

      expect(spies.onUpdateField).toHaveBeenCalledWith('category', 'soup');
    });

    // An empty catalogue means the app has not loaded it, not that Italian
    // stopped being a cuisine.
    it('says the list is not loaded rather than calling the cuisine unknown', async () => {
      const { registry, spies } = harness(false);

      await act(async () => {
        await expect(registry.run(AssistantAction.SetDraftField, 'cuisine=İtalyan')).resolves.toMatchObject({
          ok: false,
          error: 'taxonomy_not_loaded',
        });
      });

      expect(spies.onUpdateField).not.toHaveBeenCalled();
    });

    it('sets the name, which really is free text', async () => {
      const { registry, spies } = harness();

      await act(async () => {
        await registry.run(AssistantAction.SetDraftField, 'name=Yoğurtlu Tavuk');
      });

      expect(spies.onUpdateField).toHaveBeenCalledWith('name', 'Yoğurtlu Tavuk');
    });

    it('refuses a field the draft does not have', async () => {
      const { registry, spies } = harness();

      await act(async () => {
        await expect(registry.run(AssistantAction.SetDraftField, 'colour=blue')).resolves.toMatchObject({
          ok: false,
          error: 'unknown_field',
        });
      });

      expect(spies.onUpdateField).not.toHaveBeenCalled();
    });
  });

  // Publishing is not undoable and voice mishears; the picker names a photo
  // that goes out under the user's name.
  it('asks before publishing and before attaching a photo', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await expect(registry.run(AssistantAction.PublishDraft)).resolves.toMatchObject({ awaiting: true });
      await expect(registry.run(AssistantAction.AttachPhoto)).resolves.toMatchObject({ awaiting: true });
    });

    expect(spies.onRequestPublish).toHaveBeenCalled();
    expect(spies.onOpenPhotos).toHaveBeenCalled();
  });

  // "Taslağıma devam et", said to the screen showing the resume card, reached
  // nothing: `openDraft` was registered by My Recipes and by no one else, so
  // the one screen that offers a draft to continue could not continue it.
  /**
   * Said in the editor with the draft on screen, "kaydet" answered
   * `unavailable_here` — nothing here registered the word — and the model,
   * left to explain that, told the user the save button was "probably further
   * down the page". There is no such button: the screen publishes.
   */
  describe('saving the draft the user is looking at', () => {
    it('asks to publish when the user says save', async () => {
      const { registry, spies } = harness();

      const result = await act(async () => registry.run(AssistantAction.Save));

      expect(spies.onRequestPublish).toHaveBeenCalled();
      expect(result).toMatchObject({ ok: true, awaiting: true });
    });

    // The exit sheet's own `save` means "keep this draft and leave", and it
    // registers first — so without the gate the editor's would sit on top of it
    // and publish a recipe in answer to a question about leaving.
    it('stands down while the exit sheet is asking', async () => {
      const { registry, spies } = harness(true, { isDraftVisible: true, resumable: null }, true);

      await act(async () => registry.run(AssistantAction.Save));

      expect(spies.onRequestPublish).not.toHaveBeenCalled();
    });
  });

  /**
   * "Taslağı oku" was answered with "you are on the list screen" and then "I
   * can read it once it is saved". The read actions were registered by the
   * recipe detail and by nothing else, so a draft — which has its ingredients
   * and its steps the moment it is generated — could not be read at all.
   */
  describe('reading the draft', () => {
    it('reads the ingredients out without publishing anything first', async () => {
      const { registry } = harness();

      await expect(registry.run(AssistantAction.ReadIngredients)).resolves.toMatchObject({
        ok: true,
        title: '2 yumurta',
      });
    });

    it('reads a step out', async () => {
      const { registry } = harness();

      await expect(registry.run(AssistantAction.ReadStep)).resolves.toMatchObject({
        ok: true,
        title: 'Fırını ısıt',
      });
    });

    it('offers the whole draft to readScreen', () => {
      const { registry } = harness();

      expect(registry.screenReading).toContain('1) 2 yumurta');
      expect(registry.screenReading).toContain('1) Fırını ısıt');
    });
  });

  describe('the resume card', () => {
    it('continues the draft on offer', async () => {
      const { registry, spies } = harness(true, { isDraftVisible: false, resumable: RESUMABLE });

      await act(async () => {
        await expect(registry.run(AssistantAction.OpenDraft)).resolves.toMatchObject({ ok: true });
      });

      expect(spies.onResumeDraft).toHaveBeenCalled();
    });

    it('matches it by the words the user said', async () => {
      const { registry, spies } = harness(true, { isDraftVisible: false, resumable: RESUMABLE });

      await act(async () => {
        await registry.run(AssistantAction.OpenDraft, 'mercimek');
      });

      expect(spies.onResumeDraft).toHaveBeenCalled();
    });

    // A different draft belongs to the drafts list, not to this card — the
    // handler declines instead of opening the wrong recipe.
    it('declines a draft that is not the one on offer', async () => {
      const { registry, spies } = harness(true, { isDraftVisible: false, resumable: RESUMABLE });

      await act(async () => {
        await expect(registry.run(AssistantAction.OpenDraft, 'karnıyarık')).resolves.toMatchObject({
          ok: false,
        });
      });

      expect(spies.onResumeDraft).not.toHaveBeenCalled();
    });

    it('is not offered in the editor, where there is no card', async () => {
      const { registry, spies } = harness();

      await act(async () => {
        await expect(registry.run(AssistantAction.OpenDraft)).resolves.toMatchObject({ ok: false });
      });

      expect(spies.onResumeDraft).not.toHaveBeenCalled();
    });

    // The screen line is how the model learns there is anything to continue.
    it('names the resumable draft on the screen line', async () => {
      const { registry } = harness(true, { isDraftVisible: false, resumable: RESUMABLE });

      await act(async () => {
        const result = await registry.run(AssistantAction.OpenDraft);
        expect(result.ctx).toContain('resumable=Mercimek çorbası');
      });
    });
  });
});
