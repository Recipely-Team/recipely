/**
 * Unit tests for `useGuestGate`. Driven through a probe component (react-test-
 * renderer has no `renderHook`) that exposes the latest hook result plus a
 * "press" trigger, same pattern as `use-recipe-author.test.tsx`.
 */

import { act } from 'react-test-renderer';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { useGuestGate } from '@presentation/app/recipes/shared/hooks/use-guest-gate';
import type { UseGuestGateResult } from '@presentation/app/recipes/shared/model/use-guest-gate-result';

const driveHook = (
  userId: string | null,
): { latest: () => UseGuestGateResult } => {
  let latest!: UseGuestGateResult;
  const Probe = (): null => {
    latest = useGuestGate(userId);
    return null;
  };

  renderComponent(<Probe />);
  return { latest: () => latest };
};

describe('useGuestGate', () => {
  it('runs the action immediately when signed in, without opening the prompt', () => {
    const action = jest.fn();
    const { latest } = driveHook('user-1');

    act(() => {
      latest().requestGate(action);
    });

    expect(action).toHaveBeenCalledTimes(1);
    expect(latest().promptVisible).toBe(false);
  });

  it('opens the prompt and does NOT run the action when signed out', () => {
    const action = jest.fn();
    const { latest } = driveHook(null);

    act(() => {
      latest().requestGate(action);
    });

    expect(action).not.toHaveBeenCalled();
    expect(latest().promptVisible).toBe(true);
  });

  it('surfaces the per-action message passed to requestGate as promptMessage', () => {
    const { latest } = driveHook(null);

    act(() => {
      latest().requestGate(jest.fn(), 'Sign in to like this recipe.');
    });

    expect(latest().promptMessage).toBe('Sign in to like this recipe.');
  });

  it('overwrites promptMessage when requestGate is called again with a different message', () => {
    const { latest } = driveHook(null);

    act(() => {
      latest().requestGate(jest.fn(), 'Sign in to like this recipe.');
    });
    expect(latest().promptMessage).toBe('Sign in to like this recipe.');

    act(() => {
      latest().requestGate(jest.fn(), 'Sign in to save this recipe.');
    });
    expect(latest().promptMessage).toBe('Sign in to save this recipe.');
  });

  it('closePrompt hides the prompt', () => {
    const { latest } = driveHook(null);

    act(() => {
      latest().requestGate(jest.fn());
    });
    expect(latest().promptVisible).toBe(true);

    act(() => {
      latest().closePrompt();
    });

    expect(latest().promptVisible).toBe(false);
  });
});
