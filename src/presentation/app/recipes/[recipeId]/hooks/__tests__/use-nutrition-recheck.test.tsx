/**
 * Reported: a recipe published from the app showed "no nutritional info for
 * this recipe yet", and the figures turned up on their own a moment later.
 *
 * Publishing sends no nutrition — `CreateRecipeInput` has no such field —
 * because the backend computes it after the recipe is saved. The detail
 * endpoint answers before that finishes, so the screen stated as a fact about
 * the recipe what was really a fact about the clock, and then never looked
 * again: the open page went on saying no while the data sat on the server.
 */
import { act } from 'react-test-renderer';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { useNutritionRecheck } from '@presentation/app/recipes/[recipeId]/hooks/use-nutrition-recheck';

const RECIPE_ID = 'recipe-1';

/** Drives the hook and records every value it returned, in order. */
const drive = (
  hasNutrition: boolean,
  reload: (id: string) => Promise<void>,
): { waiting: () => boolean; rerender: (next: boolean) => void; unmount: () => void } => {
  let latest = false;
  const Probe = ({ has }: { has: boolean }): null => {
    latest = useNutritionRecheck(RECIPE_ID, has, reload);
    return null;
  };
  const { renderer } = renderComponent(<Probe has={hasNutrition} />);
  return {
    waiting: () => latest,
    rerender: (next: boolean) => {
      act(() => {
        renderer.update(<Probe has={next} />);
      });
    },
    unmount: () => {
      act(() => {
        renderer.unmount();
      });
    },
  };
};

describe('useNutritionRecheck', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('asks the server again when the recipe arrived without nutrition', async () => {
    const reload = jest.fn(async () => {});

    drive(false, reload);
    expect(reload).not.toHaveBeenCalled();

    await act(async () => {
      jest.runAllTimers();
    });

    expect(reload).toHaveBeenCalledWith(RECIPE_ID);
  });

  it('says it is waiting from the moment it decides to ask', async () => {
    // The caption has to change immediately, not once the timer fires: the
    // whole complaint was a screen stating an absence it could not yet know.
    const probe = drive(false, jest.fn(async () => {}));

    expect(probe.waiting()).toBe(true);
  });

  it('keeps waiting across the request, not just the timer', async () => {
    let settle = (): void => {};
    const reload = jest.fn(
      async () =>
        new Promise<void>((resolve) => {
          settle = resolve;
        }),
    );
    const probe = drive(false, reload);

    await act(async () => {
      jest.runAllTimers();
    });
    // Clearing the flag when the timer fired would flip the caption to "not
    // available" and then, a beat later, to real numbers.
    expect(probe.waiting()).toBe(true);

    await act(async () => {
      settle();
    });
    expect(probe.waiting()).toBe(false);
  });

  it('never asks for a recipe that already has figures', () => {
    const reload = jest.fn(async () => {});

    const probe = drive(true, reload);
    act(() => {
      jest.runAllTimers();
    });

    expect(reload).not.toHaveBeenCalled();
    expect(probe.waiting()).toBe(false);
  });

  it('asks only once, however the answer comes back', async () => {
    // A recipe the calculator never ran for must not become a poll: one
    // request, then the screen accepts the absence.
    const reload = jest.fn(async () => {});
    drive(false, reload);

    await act(async () => {
      jest.runAllTimers();
    });
    await act(async () => {
      jest.runAllTimers();
    });

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('does not ask for a viewer who left before the delay was up', () => {
    const reload = jest.fn(async () => {});
    const probe = drive(false, reload);

    probe.unmount();
    act(() => {
      jest.runAllTimers();
    });

    expect(reload).not.toHaveBeenCalled();
  });

  it('stops waiting the moment the figures arrive', async () => {
    const probe = drive(false, jest.fn(async () => {}));
    expect(probe.waiting()).toBe(true);

    probe.rerender(true);

    expect(probe.waiting()).toBe(false);
  });
});
