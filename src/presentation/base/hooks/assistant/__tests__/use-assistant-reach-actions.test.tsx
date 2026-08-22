/**
 * The fallback that carries an action to the screen that answers it.
 *
 * @remarks
 * Every defect this feature shipped lived on a line no test executed, and this
 * function held three of them at once: the pathname skip, the failure path and
 * the re-entry guard. It is exercised through the real registry, because what
 * is being tested is how the two behave together — a fake registry would agree
 * with whatever this file assumed.
 */

import { createElement } from 'react';
import { act, create } from 'react-test-renderer';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionError } from '@domain/assistant/actions/assistant-action-error';
import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import { useAssistantReachActions } from '@presentation/base/hooks/assistant/use-assistant-reach-actions';

interface Probe {
  pathname: string;
  navigated: string[];
  wentBack: number;
  registry: AssistantActionRegistry;
}

const probe = (): Probe => (globalThis as never as { __probe: Probe }).__probe;

jest.mock('expo-router', () => ({
  usePathname: () => (globalThis as never as { __probe: Probe }).__probe.pathname,
  router: {
    navigate: (to: string) => (globalThis as never as { __probe: Probe }).__probe.navigated.push(to),
    back: () => {
      (globalThis as never as { __probe: Probe }).__probe.wentBack += 1;
    },
  },
}));

jest.mock('@presentation/bootstrap/use-stores', () => ({
  useStores: () => ({
    assistantActionRegistry: (globalThis as never as { __probe: Probe }).__probe.registry,
  }),
}));

const SETTINGS_ACTION = AssistantAction.SetPreference;

/**
 * Mounts the hook and lets its effect run.
 *
 * Deliberately bare: the hook reads only the router and the registry, both
 * mocked above, so the theme and safe-area providers `renderComponent` supplies
 * would add setup that could fail for reasons this file is not about.
 */
const mountReach = (): void => {
  act(() => {
    create(createElement(function Host() {
      useAssistantReachActions();
      return null;
    }));
  });
};

beforeEach(() => {
  (globalThis as never as { __probe: Probe }).__probe = {
    pathname: '/recipes',
    navigated: [],
    wentBack: 0,
    registry: new AssistantActionRegistry(),
  };
});

describe('reaching the screen that answers an action', () => {
  it('takes the action to its screen and runs what that screen registered', async () => {
    mountReach();
    const owner = jest.fn(async () => ({ ok: true as const }));

    const running = probe().registry.run(SETTINGS_ACTION, 'metric');
    probe().registry.register(SETTINGS_ACTION, owner);

    await expect(running).resolves.toMatchObject({ ok: true });
    expect(probe().navigated).toEqual(['/settings']);
    expect(owner).toHaveBeenCalledWith('metric');
  });

  // Navigating to where the user already stands leaves a second copy of that
  // screen on the stack, and back stops leaving it.
  it('does not navigate when the user is already there', async () => {
    probe().pathname = '/settings';
    mountReach();
    probe().registry.register(SETTINGS_ACTION, async () => ({ ok: true as const }));

    await probe().registry.run(SETTINGS_ACTION, 'metric');

    expect(probe().navigated).toEqual([]);
  });

  // The failure is known up to four seconds later, by which time the user has
  // often navigated themselves — undoing a move they made is worse than
  // leaving them where they were taken.
  it('reports a screen that never arrived without navigating back', async () => {
    jest.useFakeTimers();
    try {
      mountReach();

      const running = probe().registry.run(SETTINGS_ACTION, 'metric');
      await jest.advanceTimersByTimeAsync(10_000);

      await expect(running).resolves.toMatchObject({ ok: false, error: 'screen_did_not_open' });
      expect(probe().wentBack).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });

  // A screen registers its handlers on mount, which is before its data lands.
  it('asks again once a screen that was still loading has had a moment', async () => {
    jest.useFakeTimers();
    try {
      mountReach();
      const owner = jest
        .fn()
        .mockResolvedValueOnce({ ok: false, error: AssistantActionError.NotReady })
        .mockResolvedValueOnce({ ok: true });

      const running = probe().registry.run(SETTINGS_ACTION, 'metric');
      probe().registry.register(SETTINGS_ACTION, owner);
      await jest.advanceTimersByTimeAsync(2_000);

      await expect(running).resolves.toMatchObject({ ok: true });
      expect(owner).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
    }
  });

  // `not_found` is a final answer, not a state to wait out.
  it('does not retry a screen that answered', async () => {
    mountReach();
    const owner = jest.fn(async () => ({ ok: false as const, error: 'not_found' }));

    const running = probe().registry.run(SETTINGS_ACTION, 'metric');
    probe().registry.register(SETTINGS_ACTION, owner);

    await expect(running).resolves.toMatchObject({ error: 'not_found' });
    expect(owner).toHaveBeenCalledTimes(1);
  });

  // The reach asks the registry to run the action again and the registry falls
  // back here, so a screen that declines with `notMine` would loop for ever.
  it('terminates when the only screen declines the action as not its own', async () => {
    mountReach();

    const running = probe().registry.run(SETTINGS_ACTION, 'metric');
    probe().registry.register(SETTINGS_ACTION, async () => ({ ok: false as const, notMine: true }));

    await expect(running).resolves.toMatchObject({ ok: false, error: 'not_found' });
  });
});
