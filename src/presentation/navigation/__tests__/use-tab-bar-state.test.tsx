/**
 * Unit tests for `useTabBarState`, the pathname-driven state behind the
 * single root-level TabBar (hosted in `app/_layout.tsx` so Stack transitions
 * never move it). Driven through a probe component, same pattern as
 * `use-auth-guard.test.tsx`.
 */

import { act } from 'react-test-renderer';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { useTabBarState } from '@presentation/navigation/use-tab-bar-state';
import type { TabBarKey } from '@presentation/base/widgets/navigation/tab-bar-key';

const mockReplace = jest.fn();
let mockPathname = '/';

jest.mock('expo-router', () => ({
  usePathname: jest.fn(() => mockPathname),
  useRouter: jest.fn(() => ({ replace: mockReplace })),
}));

let lastState: ReturnType<typeof useTabBarState> = null;

const Probe = (): null => {
  lastState = useTabBarState();
  return null;
};

const renderAt = (pathname: string): ReturnType<typeof useTabBarState> => {
  mockPathname = pathname;
  renderComponent(<Probe />);
  return lastState;
};

beforeEach(() => {
  mockReplace.mockClear();
  lastState = null;
});

afterEach(async () => {
  // Let AppThemeProvider's async storage hydration (kicked off by
  // renderComponent) settle inside act, keeping the output free of
  // act(...) warnings — same pattern as use-scroll-to-end-on-keyboard.test.
  await act(async () => {
    await new Promise((resolve) => setImmediate(resolve));
  });
});

describe('useTabBarState', () => {
  it.each([
    ['/recipes', 'recipes'],
    ['/my-recipes', 'myRecipes'],
    ['/creators', 'chefs'],
    ['/profile', 'profile'],
    ['/settings', 'profile'],
  ] as [string, TabBarKey][])('shows the bar on %s with %s active', (pathname, active) => {
    const state = renderAt(pathname);
    expect(state).not.toBeNull();
    expect(state?.active).toBe(active);
  });

  it.each([
    ['/'],
    ['/login'],
    ['/recipes/42'],
    // A creator's page is pushed from the Chefs tab and shows no bar.
    ['/creators/u-1'],
    ['/create-recipe'],
    ['/edit-profile'],
    ['/notifications'],
    ['/ai-generate'],
  ])('hides the bar on %s', (pathname) => {
    expect(renderAt(pathname)).toBeNull();
  });

  it('replaces (not pushes) the route when another tab is pressed', () => {
    const state = renderAt('/recipes');
    state?.onChange('myRecipes');
    expect(mockReplace).toHaveBeenCalledWith('/my-recipes');
  });

  it('routes the profile tab to /profile even from /settings', () => {
    const state = renderAt('/settings');
    state?.onChange('recipes');
    expect(mockReplace).toHaveBeenCalledWith('/recipes');
  });

  it('is a no-op when the active tab is pressed again', () => {
    const state = renderAt('/my-recipes');
    state?.onChange('myRecipes');
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('treats settings as the profile tab: pressing profile navigates', () => {
    const state = renderAt('/settings');
    state?.onChange('profile');
    expect(mockReplace).toHaveBeenCalledWith('/profile');
  });

  it('opens the Chefs tab at /creators', () => {
    renderAt('/recipes')?.onChange('chefs');
    expect(mockReplace).toHaveBeenCalledWith('/creators');
  });
});
