import type { Router } from 'expo-router';
import { enterApp } from '@presentation/navigation/enter-app';

/**
 * The bug: continuing without an account left the auth flow underneath the app.
 * `replace` swaps only the top entry, so `/onboarding` → push `/login` →
 * replace `/recipes` produced `[onboarding, recipes]` — one back gesture put a
 * guest who had just declined to sign in back on the screen asking them to.
 */

const makeRouter = (canDismiss: boolean): Router =>
  ({
    canDismiss: jest.fn(() => canDismiss),
    dismissAll: jest.fn(),
    replace: jest.fn(),
  }) as unknown as Router;

describe('enterApp', () => {
  it('pops the auth screens off before landing, so back cannot return to them', () => {
    const router = makeRouter(true);

    enterApp(router, '/recipes');

    expect(router.dismissAll).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith('/recipes');
  });

  it('pops before it replaces — the other order would swap the wrong entry', () => {
    const calls: string[] = [];
    const router = {
      canDismiss: () => true,
      dismissAll: () => calls.push('dismissAll'),
      replace: () => calls.push('replace'),
    } as unknown as Router;

    enterApp(router, '/recipes');

    expect(calls).toEqual(['dismissAll', 'replace']);
  });

  it('still lands when there is nothing to pop', () => {
    // Entering straight from the launch redirect: the stack is one screen deep
    // and `dismissAll` treats that as an error rather than a no-op.
    const router = makeRouter(false);

    enterApp(router, '/recipes');

    expect(router.dismissAll).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith('/recipes');
  });
});
