/**
 * Where the assistant is, and is not.
 *
 * Both reported from a phone: it appeared on the login screen, where every
 * action is one the user must take themselves, and it landed on top of the
 * feed's filter button — the one control that screen exists to offer.
 */

import { mockStoreReading } from '@presentation/base/test-support/mock-store-reading';
import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { RoutePaths } from '@presentation/base/constants';
import { useAssistantFloatingClearance } from '@presentation/base/hooks/assistant/use-assistant-floating-clearance';
import { useAssistantIsOffered } from '@presentation/base/hooks/assistant/use-assistant-is-offered';

// A hook runs only while a component renders (the compiled hooks read React's
// memo cache), so each assertion renders a probe and reads what it returned.
jest.mock('expo-router', () => ({
  usePathname: () => (globalThis as never as { __pathname: string }).__pathname,
}));

// The hook reads the session as well as the path now: nearly everything the
// assistant does belongs to the signed-in user.
jest.mock('@presentation/bootstrap/use-stores', () => ({
  useStores: () => ({
    authStore: mockStoreReading(() => ({ state: { status: (globalThis as never as { __auth: string }).__auth } })),
  }),
}));

const valueOf = <T>(hook: () => T): T => {
  const seen: { value?: T } = {};
  const Probe = (): null => {
    seen.value = hook();
    return null;
  };
  let view!: ReactTestRenderer;
  act(() => {
    view = create(createElement(Probe));
  });
  act(() => view.unmount());
  return seen.value as T;
};

const at = (path: string): void => {
  (globalThis as never as { __pathname: string }).__pathname = path;
};

const signedIn = (yes: boolean): void => {
  (globalThis as never as { __auth: string }).__auth = yes ? 'authenticated' : 'unauthenticated';
};

beforeEach(() => {
  at(RoutePaths.recipes);
  signedIn(true);
});

describe('where the assistant is offered', () => {
  it.each([RoutePaths.login, RoutePaths.register, RoutePaths.forgotPassword, RoutePaths.verifyCode, RoutePaths.onboarding])(
    'stays away from %s, where it cannot help',
    (route) => {
      at(route);

      expect(valueOf(useAssistantIsOffered)).toBe(false);
    },
  );

  // Nearly everything it does is the user's own — their drafts, their saved
  // recipes, their profile — so offering it to someone with no account can
  // only fail at most of it, after spending a session's minutes finding out.
  it('is not offered at all without a signed-in session', () => {
    signedIn(false);

    expect(valueOf(useAssistantIsOffered)).toBe(false);
  });

  it('is offered on the feed', () => {
    expect(valueOf(useAssistantIsOffered)).toBe(true);
  });

  it('stays away from the screen where a new password is typed', () => {
    at(RoutePaths.resetPassword);

    expect(valueOf(useAssistantIsOffered)).toBe(false);
  });

  it('is offered on a signed-out route that is not an auth screen', () => {
    at(RoutePaths.recipes + '/42');

    expect(valueOf(useAssistantIsOffered)).toBe(true);
  });
});

describe('clearing the screen own floating control', () => {
  it('lifts above the feed filter button', () => {
    expect(valueOf(useAssistantFloatingClearance)).toBeGreaterThan(0);
  });

  // `/recipes/42` is a detail screen with no filter button. Matched by prefix,
  // the assistant floated off the bottom edge there for a control that is not
  // on it — and the test above walked past this by asking the other hook.
  it('does not lift on a recipe detail screen, which has no filter button', () => {
    at(RoutePaths.recipes + '/42');

    expect(valueOf(useAssistantFloatingClearance)).toBe(0);
  });

  it('sits at the edge where nothing else is docked', () => {
    at(RoutePaths.myRecipes);

    expect(valueOf(useAssistantFloatingClearance)).toBe(0);
  });
});
