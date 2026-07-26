/**
 * Tests for `IndexRedirect`, the app's launch redirect.
 *
 * Guest-first launch (Apple App Store guideline 5.1.1(v)): once the session
 * resolves the index never sends the user to a login wall. Authenticated and
 * errored sessions — and every session on web — land on the browsable recipe
 * list (`/recipes`). The one exception is a native guest, who sees the
 * onboarding welcome screen (itself NOT a login wall — it offers "explore
 * without signing in") on every cold launch until they dismiss it or sign in.
 * While the session (or the persisted dismissal) is still resolving nothing is
 * rendered so a valid session is never bounced on a hard reload / deep link.
 *
 * `Redirect` is replaced by a prop-capturing probe so the test can assert the
 * chosen `href` without driving expo-router's real navigation. Rendered bare
 * (no theme/safe-area providers): the component consumes neither, and the
 * providers' async storage hydration would outlive the test environment.
 */

import { act, create } from 'react-test-renderer';
import { Platform } from 'react-native';
import { IndexRedirect } from '@presentation/app';

let redirectHref: string | null = null;
let mockStatus: 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error' = 'idle';
let mockOnboarding = { hydrated: true, dismissed: false };
let mockOS: 'ios' | 'web' = 'ios';

jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => {
    redirectHref = href;
    return null;
  },
}));

jest.mock('@presentation/bootstrap/use-stores', () => ({
  useStores: jest.fn(() => ({
    authStore: jest.fn((selector: (state: { state: { status: string } }) => unknown) =>
      selector({ state: { status: mockStatus } }),
    ),
  })),
}));

jest.mock('@application/onboarding/onboarding-store', () => ({
  onboardingStore: jest.fn(
    (selector: (state: { hydrated: boolean; dismissed: boolean }) => unknown) =>
      selector(mockOnboarding),
  ),
}));

const render = (): void => {
  act(() => {
    create(<IndexRedirect />);
  });
};

beforeEach(() => {
  redirectHref = null;
  mockStatus = 'idle';
  mockOnboarding = { hydrated: true, dismissed: false };
  mockOS = 'ios';
  Object.defineProperty(Platform, 'OS', { configurable: true, get: () => mockOS });
});

describe('IndexRedirect', () => {
  it('renders nothing while the session is still hydrating (idle)', () => {
    mockStatus = 'idle';
    render();
    expect(redirectHref).toBeNull();
  });

  it('renders nothing while the session is loading', () => {
    mockStatus = 'loading';
    render();
    expect(redirectHref).toBeNull();
  });

  it('redirects an authenticated session to /recipes', () => {
    mockStatus = 'authenticated';
    render();
    expect(redirectHref).toBe('/recipes');
  });

  it('redirects an errored session to /recipes', () => {
    mockStatus = 'error';
    render();
    expect(redirectHref).toBe('/recipes');
  });

  it('sends a native guest to /onboarding once the dismissal has resolved', () => {
    mockStatus = 'unauthenticated';
    mockOnboarding = { hydrated: true, dismissed: false };
    render();
    expect(redirectHref).toBe('/onboarding');
  });

  it('sends a native guest who dismissed onboarding to /recipes', () => {
    mockStatus = 'unauthenticated';
    mockOnboarding = { hydrated: true, dismissed: true };
    render();
    expect(redirectHref).toBe('/recipes');
  });

  it('waits (renders nothing) while a native guest dismissal is still resolving', () => {
    mockStatus = 'unauthenticated';
    mockOnboarding = { hydrated: false, dismissed: false };
    render();
    expect(redirectHref).toBeNull();
  });

  it('never gates on web — an unauthenticated web session goes to /recipes (Apple 5.1.1(v))', () => {
    mockStatus = 'unauthenticated';
    mockOS = 'web';
    mockOnboarding = { hydrated: true, dismissed: false };
    render();
    expect(redirectHref).toBe('/recipes');
  });
});
