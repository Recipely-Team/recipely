/**
 * Regression tests for `useScreenTracking`.
 *
 * The bug: nothing in the app ever called `logScreen`, so every screen reached
 * Firebase Analytics under whatever name the platform invented for it — one
 * `MainActivity` for all of Android, one shared `<title>` for the whole web
 * export. The console showed "garip adlar" and no report could tell the recipe
 * feed from the settings page. These fail against the unfixed tree, where the
 * hook did not exist at all.
 */

import { useState } from 'react';
import { act } from 'react-test-renderer';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { AnalyticsScreen } from '@infrastructure/constants/analytics/analytics-screen';
import { useScreenTracking } from '@presentation/bootstrap/use-screen-tracking';

let mockPathname = '/';

jest.mock('expo-router', () => ({
  usePathname: jest.fn(() => mockPathname),
}));

const mockLogScreen = jest.fn(async () => undefined);

jest.mock('@infrastructure/firebase/analytics-service', () => ({
  analyticsService: {
    logScreen: (...args: readonly unknown[]) => mockLogScreen(...(args as [])),
  },
}));

/** Re-renders itself on demand, so a render can be told apart from a visit. */
let rerender: (() => void) | null = null;

const Probe = (): null => {
  const [, setTick] = useState(0);
  rerender = () => setTick((tick) => tick + 1);
  useScreenTracking();
  return null;
};

const renderAt = (pathname: string): void => {
  mockPathname = pathname;
  renderComponent(<Probe />);
};

const settle = async (): Promise<void> => {
  await act(async () => {
    await new Promise((resolve) => setImmediate(resolve));
  });
};

beforeEach(() => {
  mockLogScreen.mockClear();
  rerender = null;
});

afterEach(settle);

describe('useScreenTracking', () => {
  it('reports the recipe feed under the name its component has in the code', () => {
    renderAt('/recipes');
    expect(mockLogScreen).toHaveBeenCalledWith(AnalyticsScreen.recipeList);
  });

  it.each([
    ['/my-recipes', AnalyticsScreen.myRecipes],
    ['/create-recipe', AnalyticsScreen.createRecipe],
    ['/import-recipe', AnalyticsScreen.importRecipe],
    ['/notifications', AnalyticsScreen.notifications],
    ['/profile', AnalyticsScreen.profile],
    ['/edit-profile', AnalyticsScreen.editProfile],
    ['/settings', AnalyticsScreen.settings],
    ['/onboarding', AnalyticsScreen.onboarding],
    ['/login', AnalyticsScreen.login],
    ['/register', AnalyticsScreen.register],
    ['/verify-code', AnalyticsScreen.verifyCode],
    ['/forgot-password', AnalyticsScreen.forgotPassword],
    ['/reset-password', AnalyticsScreen.resetPassword],
  ])('names %s', (pathname, expected) => {
    renderAt(pathname);
    expect(mockLogScreen).toHaveBeenCalledWith(expected);
  });

  // The id must never reach the name: a screen name is a report dimension, and
  // one row per recipe is a dimension nobody can read.
  it('reports one detail screen for every recipe, never the id', () => {
    renderAt('/recipes/abc-123');
    expect(mockLogScreen).toHaveBeenCalledWith(AnalyticsScreen.recipeDetail);
  });

  // `/` and `/ai-generate` render a Redirect and nothing else. A view logged
  // for them would count a screen that was never on the display.
  it.each(['/', '/ai-generate', '/_sitemap'])('reports nothing for %s', (pathname) => {
    renderAt(pathname);
    expect(mockLogScreen).not.toHaveBeenCalled();
  });

  // A screen the user never left is one visit. My Recipes re-renders on every
  // tab tap and every store update — `?tab=drafts` is a state of that screen,
  // not a destination — and a view logged per render would report a session
  // that navigated hundreds of times.
  it('reports one visit however often the screen re-renders', () => {
    renderAt('/my-recipes');

    act(() => {
      rerender?.();
      rerender?.();
    });

    expect(mockLogScreen).toHaveBeenCalledTimes(1);
    expect(mockLogScreen).toHaveBeenCalledWith(AnalyticsScreen.myRecipes);
  });
});
