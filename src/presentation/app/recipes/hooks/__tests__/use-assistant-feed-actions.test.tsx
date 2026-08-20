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

function harness(filters: UiFilters = EMPTY, activeFilterCount = 0) {
  const registry = new AssistantActionRegistry();
  const spies = {
    onToggleCuisineQuick: jest.fn(),
    onToggleCategory: jest.fn(),
    onDifficultyChange: jest.fn(),
    onSetMaxTime: jest.fn(),
    onRemoveCategory: jest.fn(),
    onRemoveDifficulty: jest.fn(),
    onRemoveMaxTime: jest.fn(),
    onResetFilters: jest.fn(),
    onChangeSort: jest.fn(),
  };

  const Probe = (): null => {
    useAssistantFeedActions({ filters, activeFilterCount, ...spies });
    return null;
  };

  renderComponent(
    <StoresProvider value={{ assistantActionRegistry: registry } as unknown as Stores}>
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
      await registry.run(AssistantAction.AddFilter, 'cuisine=italian');
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

  it('clears every filter at once', async () => {
    const { registry, spies } = harness({ ...EMPTY, cuisines: ['italian'] }, 1);

    await act(async () => {
      await registry.run(AssistantAction.ClearFilters);
    });

    expect(spies.onResetFilters).toHaveBeenCalled();
  });

  // Resetting an already-clean feed would blank the rows and refetch for
  // nothing — an outcome that already holds is a success, not work to do.
  it('does not reload when there was nothing to clear', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await expect(registry.run(AssistantAction.ClearFilters)).resolves.toMatchObject({ ok: true });
    });

    expect(spies.onResetFilters).not.toHaveBeenCalled();
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
