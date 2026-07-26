/**
 * Unit tests for `useAuthGuard`'s path-matching behavior. The hook itself has
 * no `renderHook` equivalent in react-test-renderer, so it's driven through a
 * probe component (same pattern as `use-recipe-author.test.tsx`).
 *
 * Coverage focuses on the guest-access regression this guard exists to fix:
 * the single-recipe detail route (`/recipes/:id`) must be reachable by a
 * guest, while the recipe list and every other authenticated route must
 * still redirect to `/login`.
 */

import { renderComponent } from '@presentation/base/test-support/render-component';
import { useAuthGuard } from '@presentation/navigation/use-auth-guard';

const mockReplace = jest.fn();
let mockPathname = '/';
let mockStatus: 'idle' | 'loading' | 'authenticated' | 'unauthenticated' = 'idle';

jest.mock('expo-router', () => ({
  usePathname: jest.fn(() => mockPathname),
  useRouter: jest.fn(() => ({ replace: mockReplace })),
}));

jest.mock('@presentation/bootstrap/use-stores', () => ({
  useStores: jest.fn(() => ({
    authStore: jest.fn((selector: (state: { state: { status: string } }) => unknown) =>
      selector({ state: { status: mockStatus } }),
    ),
  })),
}));

const Probe = (): null => {
  useAuthGuard();
  return null;
};

const renderGuard = (): void => {
  renderComponent(<Probe />);
};

beforeEach(() => {
  mockReplace.mockClear();
});

describe('useAuthGuard', () => {
  it('does not redirect a guest viewing a single recipe detail page', () => {
    mockPathname = '/recipes/abc123';
    mockStatus = 'unauthenticated';

    renderGuard();

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('redirects a guest on a trailing-slash detail path (not exactly one segment)', () => {
    mockPathname = '/recipes/abc123/';
    mockStatus = 'unauthenticated';

    renderGuard();

    expect(mockReplace).toHaveBeenCalledWith('/login?redirect=%2Frecipes%2Fabc123%2F');
  });

  it('redirects a guest on a nested recipe sub-route (e.g. edit)', () => {
    mockPathname = '/recipes/abc123/edit';
    mockStatus = 'unauthenticated';

    renderGuard();

    expect(mockReplace).toHaveBeenCalledWith('/login?redirect=%2Frecipes%2Fabc123%2Fedit');
  });

  it('does not redirect a guest on the recipe list route (public, no trailing segment)', () => {
    mockPathname = '/recipes';
    mockStatus = 'unauthenticated';

    renderGuard();

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('redirects a guest on /my-recipes', () => {
    mockPathname = '/my-recipes';
    mockStatus = 'unauthenticated';

    renderGuard();

    expect(mockReplace).toHaveBeenCalledWith('/login?redirect=%2Fmy-recipes');
  });

  it('redirects a guest on /settings', () => {
    mockPathname = '/settings';
    mockStatus = 'unauthenticated';

    renderGuard();

    expect(mockReplace).toHaveBeenCalledWith('/login?redirect=%2Fsettings');
  });

  it('does not redirect while the session is still hydrating (idle)', () => {
    mockPathname = '/my-recipes';
    mockStatus = 'idle';

    renderGuard();

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('does not redirect an authenticated user anywhere', () => {
    mockPathname = '/my-recipes';
    mockStatus = 'authenticated';

    renderGuard();

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('does not redirect a guest on an explicit public path (/login)', () => {
    mockPathname = '/login';
    mockStatus = 'unauthenticated';

    renderGuard();

    expect(mockReplace).not.toHaveBeenCalled();
  });
});
