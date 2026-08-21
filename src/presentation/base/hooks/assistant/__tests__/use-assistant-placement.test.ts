/**
 * Where the assistant is, and is not.
 *
 * Both reported from a phone: it appeared on the login screen, where every
 * action is one the user must take themselves, and it landed on top of the
 * feed's filter button — the one control that screen exists to offer.
 */

import { RoutePaths } from '@presentation/base/constants';
import { useAssistantFloatingClearance } from '@presentation/base/hooks/assistant/use-assistant-floating-clearance';
import { useAssistantIsOffered } from '@presentation/base/hooks/assistant/use-assistant-is-offered';

// Both hooks are pure functions of the path — they hold no state and call no
// other hook — so they are called directly rather than through a renderer.
jest.mock('expo-router', () => ({
  usePathname: () => (globalThis as never as { __pathname: string }).__pathname,
}));

const at = (path: string): void => {
  (globalThis as never as { __pathname: string }).__pathname = path;
};

beforeEach(() => at(RoutePaths.recipes));

describe('where the assistant is offered', () => {
  it.each([RoutePaths.login, RoutePaths.register, RoutePaths.forgotPassword, RoutePaths.verifyCode, RoutePaths.onboarding])(
    'stays away from %s, where it cannot help',
    (route) => {
      at(route);

      expect(useAssistantIsOffered()).toBe(false);
    },
  );

  it('is offered on the feed', () => {
    expect(useAssistantIsOffered()).toBe(true);
  });

  it('stays away from the screen where a new password is typed', () => {
    at(RoutePaths.resetPassword);

    expect(useAssistantIsOffered()).toBe(false);
  });

  it('is offered on a signed-out route that is not an auth screen', () => {
    at(RoutePaths.recipes + '/42');

    expect(useAssistantIsOffered()).toBe(true);
  });
});

describe('clearing the screen own floating control', () => {
  it('lifts above the feed filter button', () => {
    expect(useAssistantFloatingClearance()).toBeGreaterThan(0);
  });

  // `/recipes/42` is a detail screen with no filter button. Matched by prefix,
  // the assistant floated off the bottom edge there for a control that is not
  // on it — and the test above walked past this by asking the other hook.
  it('does not lift on a recipe detail screen, which has no filter button', () => {
    at(RoutePaths.recipes + '/42');

    expect(useAssistantFloatingClearance()).toBe(0);
  });

  it('sits at the edge where nothing else is docked', () => {
    at(RoutePaths.myRecipes);

    expect(useAssistantFloatingClearance()).toBe(0);
  });
});
