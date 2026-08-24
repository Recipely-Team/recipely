import { AssistantActionError } from '@domain/assistant/actions/assistant-action-error';
import { act } from 'react-test-renderer';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import { Difficulty } from '@domain/recipes/difficulty';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import type { Stores } from '@presentation/bootstrap/stores';
import type { UiFilters } from '@presentation/app/recipes/model/filtering/ui-filters';
import { useAssistantFeedActions } from '@presentation/app/recipes/hooks/use-assistant-feed-actions';

const EMPTY: UiFilters = { cuisines: [], categories: [], difficulties: [], maxTime: 0 };

const CUISINES = [
  { key: 'italian', name: 'İtalyan', emoji: '🇮🇹' },
  { key: 'turkish', name: 'Türk', emoji: '🇹🇷' },
];
const CATEGORIES = [{ key: 'soup', name: 'Çorba', emoji: '🍲' }];

function harness(filters: UiFilters = EMPTY, loaded = true) {
  const registry = new AssistantActionRegistry();
  // The feed filters on backend KEYS; the model says the name it saw. A stub
  // that returned the words back would have hidden the very defect this
  // resolution exists for.
  const taxonomyStore = ((selector: (state: unknown) => unknown) =>
    selector({
      cuisines: loaded ? CUISINES : [],
      categories: loaded ? CATEGORIES : [],
    })) as unknown as Stores['taxonomyStore'];
  const spies = {
    onToggleCuisineQuick: jest.fn(),
    onToggleCategory: jest.fn(),
    onDifficultyChange: jest.fn(),
    onSetMaxTime: jest.fn(),
    onRemoveCategory: jest.fn(),
    onRemoveDifficulty: jest.fn(),
    onRemoveMaxTime: jest.fn(),
    onClearSearch: jest.fn(),
    onClearAllFilters: jest.fn(),
    onChangeSort: jest.fn(),
  };

  const Probe = (): null => {
    useAssistantFeedActions({ filters, ...spies });
    return null;
  };

  renderComponent(
    <StoresProvider value={{ assistantActionRegistry: registry, taxonomyStore } as unknown as Stores}>
      <Probe />
    </StoresProvider>,
  );

  return { registry, spies };
}

describe('useAssistantFeedActions', () => {
  // The tool has one string argument, and "add Italian" is ambiguous between a
  // cuisine and a category. Guessing would need a taxonomy the model does not
  // have and would silently filter on the wrong axis.
  it('needs the filter kind named, not guessed', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await expect(registry.run(AssistantAction.AddFilter, 'italian')).resolves.toEqual({
        ok: false,
        error: 'expected_kind_equals_value',
      });
    });
    expect(spies.onToggleCuisineQuick).not.toHaveBeenCalled();
  });

  it('adds a cuisine through the same quick toggle the chip row uses', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await registry.run(AssistantAction.AddFilter, 'cuisine=İtalyan');
    });

    expect(spies.onToggleCuisineQuick).toHaveBeenCalledWith('italian');
  });

  // A single `toggle` would have made "add Italian" turn Italian OFF whenever
  // it was already on — the opposite of what was asked.
  it('leaves an already-applied cuisine alone instead of toggling it off', async () => {
    const { registry, spies } = harness({ ...EMPTY, cuisines: ['italian'] });

    await act(async () => {
      await expect(registry.run(AssistantAction.AddFilter, 'cuisine=italian')).resolves.toMatchObject({
        ok: true,
      });
    });

    expect(spies.onToggleCuisineQuick).not.toHaveBeenCalled();
  });

  it('removes an applied cuisine', async () => {
    const { registry, spies } = harness({ ...EMPTY, cuisines: ['italian'] });

    await act(async () => {
      await registry.run(AssistantAction.RemoveFilter, 'cuisine=italian');
    });

    expect(spies.onToggleCuisineQuick).toHaveBeenCalledWith('italian');
  });

  it('says so rather than silently toggling a cuisine that was never applied', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await expect(registry.run(AssistantAction.RemoveFilter, 'cuisine=italian')).resolves.toEqual({
        ok: false,
        error: 'not_applied',
      });
    });

    expect(spies.onToggleCuisineQuick).not.toHaveBeenCalled();
  });

  // The wire values are upper-case (`EASY`); a person says "easy". Matching
  // case-sensitively would tell the model its own vocabulary was wrong.
  it('accepts a difficulty the way a person says it', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await registry.run(AssistantAction.AddFilter, 'difficulty=easy');
    });

    expect(spies.onDifficultyChange).toHaveBeenCalledWith(Difficulty.Easy);
  });

  it('refuses a difficulty that is not one', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await expect(registry.run(AssistantAction.AddFilter, 'difficulty=trivial')).resolves.toEqual({
        ok: false,
        error: 'unknown_difficulty',
      });
    });

    expect(spies.onDifficultyChange).not.toHaveBeenCalled();
  });

  it('caps the time', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await registry.run(AssistantAction.AddFilter, 'maxTime=30');
    });

    expect(spies.onSetMaxTime).toHaveBeenCalledWith(30);
  });

  it('refuses a time that is not a number', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await expect(registry.run(AssistantAction.AddFilter, 'maxTime=quick')).resolves.toEqual({
        ok: false,
        error: 'not_a_number',
      });
    });

    expect(spies.onSetMaxTime).not.toHaveBeenCalled();
  });

  // The model says the name the screen showed it; the feed filters on the
  // backend's key. Passing the word through produced a filter that matched
  // nothing, an empty feed, and `ok: true` reported to the model.
  describe('taxonomy resolution', () => {
    it('turns the name the model saw into the key the feed filters on', async () => {
      const { registry, spies } = harness();

      await act(async () => {
        await registry.run(AssistantAction.AddFilter, 'cuisine=İtalyan');
      });

      expect(spies.onToggleCuisineQuick).toHaveBeenCalledWith('italian');
    });

    it('accepts the key itself, which is what a second turn would send back', async () => {
      const { registry, spies } = harness();

      await act(async () => {
        await registry.run(AssistantAction.AddFilter, 'cuisine=italian');
      });

      expect(spies.onToggleCuisineQuick).toHaveBeenCalledWith('italian');
    });

    it('resolves a category by name too', async () => {
      const { registry, spies } = harness();

      await act(async () => {
        await registry.run(AssistantAction.AddFilter, 'category=Çorba');
      });

      expect(spies.onToggleCategory).toHaveBeenCalledWith('soup');
    });

    it('refuses a cuisine the catalogue does not have', async () => {
      const { registry, spies } = harness();

      await act(async () => {
        await expect(registry.run(AssistantAction.AddFilter, 'cuisine=Marslı')).resolves.toEqual({
          ok: false,
          error: 'unknown_cuisine',
        });
      });

      expect(spies.onToggleCuisineQuick).not.toHaveBeenCalled();
    });

    // An empty catalogue means the app has not loaded it, not that Italian
    // stopped being a cuisine — telling the model otherwise has it say
    // something untrue out loud.
    it('says the list is not loaded rather than calling the cuisine unknown', async () => {
      const { registry, spies } = harness(EMPTY, false);

      await act(async () => {
        await expect(registry.run(AssistantAction.AddFilter, 'cuisine=İtalyan')).resolves.toEqual({
          ok: false,
          error: AssistantActionError.NotReady,
        });
      });

      expect(spies.onToggleCuisineQuick).not.toHaveBeenCalled();
    });
  });

  it('clears every filter at once', async () => {
    const { registry, spies } = harness({ ...EMPTY, cuisines: ['italian'] });

    await act(async () => {
      await registry.run(AssistantAction.ClearFilters);
    });

    expect(spies.onClearAllFilters).toHaveBeenCalled();
  });

  // The bug the user watched: the feed was narrowed by a SEARCH, "clear the
  // filters" answered ok, and nothing on screen moved. The count this handler
  // used to guard on counts chips, not the query — and it is read from the
  // previous render, so it is also zero for a filter the same turn just
  // applied. Clearing is cheap; being told it happened when it did not is not.
  it('clears a feed narrowed only by a search, instead of reporting a no-op', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await expect(registry.run(AssistantAction.ClearFilters)).resolves.toMatchObject({ ok: true });
    });

    expect(spies.onClearAllFilters).toHaveBeenCalled();
  });

  // "Take the search off but keep the Italian filter" — one query box, so the
  // value after `search=` is whatever the model heard and is not read.
  it('removes the search on its own', async () => {
    const { registry, spies } = harness({ ...EMPTY, cuisines: ['italian'] });

    await act(async () => {
      await expect(registry.run(AssistantAction.RemoveFilter, 'search=tavuk')).resolves.toMatchObject({
        ok: true,
      });
    });

    expect(spies.onClearSearch).toHaveBeenCalled();
    expect(spies.onToggleCuisineQuick).not.toHaveBeenCalled();
  });

  it('sorts by a key the UI offers, and refuses one it does not', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await registry.run(AssistantAction.Sort, 'newest');
      await expect(registry.run(AssistantAction.Sort, 'by-vibes')).resolves.toEqual({
        ok: false,
        error: 'unknown_sort',
      });
    });

    expect(spies.onChangeSort).toHaveBeenCalledTimes(1);
    expect(spies.onChangeSort).toHaveBeenCalledWith('newest');
  });
});
