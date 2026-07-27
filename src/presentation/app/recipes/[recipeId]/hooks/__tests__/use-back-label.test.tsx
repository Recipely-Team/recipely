/**
 * Reported: tapping a notification opens the recipe, and the link back says
 * "Back to recipes" — but pressing it returns to the notifications list,
 * because it is a plain `router.back()`. The label now names where back
 * actually goes: the specific wording only when the feed is what pushed this
 * screen.
 */
/* eslint-disable import/first -- jest.mock() must be hoisted above imports */

let mockState: { index: number; routes: { name: string }[] } | undefined;

jest.mock('expo-router', () => ({
  useRootNavigationState: () => mockState,
}));

import { renderComponent } from '@presentation/base/test-support/render-component';
import { useBackLabel } from '@presentation/app/recipes/[recipeId]/hooks/use-back-label';
import { t } from '@presentation/i18n';
import { act } from 'react-test-renderer';

const labelFor = (state: typeof mockState): string => {
  mockState = state;
  let label = '';
  const Probe = (): null => {
    label = useBackLabel();
    return null;
  };
  const { renderer } = renderComponent(<Probe />);
  act(() => {
    renderer.unmount();
  });
  return label;
};

describe('useBackLabel', () => {
  afterEach(async () => {
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  });

  it('names the feed when the feed pushed the detail', () => {
    const label = labelFor({ index: 1, routes: [{ name: 'recipes/index' }, { name: 'recipes/[recipeId]/index' }] });

    expect(label).toBe(t().recipes.backToRecipes);
  });

  it('stays generic when a notification pushed the detail', () => {
    const label = labelFor({
      index: 1,
      routes: [{ name: 'notifications/index' }, { name: 'recipes/[recipeId]/index' }],
    });

    expect(label).toBe(t().common.back);
  });

  it('stays generic when My Recipes pushed the detail', () => {
    const label = labelFor({
      index: 1,
      routes: [{ name: 'my-recipes/index' }, { name: 'recipes/[recipeId]/index' }],
    });

    expect(label).toBe(t().common.back);
  });

  it('stays generic for a cold open with nothing behind it', () => {
    const label = labelFor({ index: 0, routes: [{ name: 'recipes/[recipeId]/index' }] });

    expect(label).toBe(t().common.back);
  });

  it('survives a navigation state that is not ready yet', () => {
    expect(labelFor(undefined)).toBe(t().common.back);
  });
});
