import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';

/**
 * Pause and stop sit on the timers bar on every screen, and the actions behind
 * them were registered only by the recipe detail — so walking to the feed with
 * something on the hob and saying "pause the timer" answered
 * `unavailable_here` while the button for it was on screen.
 */

interface Probe {
  timers: Record<string, { id: string; recipeName: string; isPaused: boolean }>;
  paused: string[];
  stopped: string[];
}

const probe = (): Probe => (globalThis as never as { __timers: Probe }).__timers;

jest.mock('@application/timers/timer-store', () => ({
  timerStore: { getState: () => ({ timers: (globalThis as never as { __timers: Probe }).__timers.timers }) },
}));

jest.mock('@presentation/base/timers/timer-controls', () => ({
  pauseTimer: async (id: string) => {
    (globalThis as never as { __timers: Probe }).__timers.paused.push(id);
  },
  resumeTimer: async () => undefined,
  stopTimer: async (id: string) => {
    (globalThis as never as { __timers: Probe }).__timers.stopped.push(id);
  },
}));

const registry = new AssistantActionRegistry();
jest.mock('@presentation/bootstrap/use-stores', () => ({
  useStores: () => ({ assistantActionRegistry: registryRef.current }),
}));
const registryRef = { current: registry };

// Imported after the mocks so the hook picks them up.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useAssistantTimerActions } = require('@presentation/base/hooks/assistant/actions/use-assistant-timer-actions') as typeof import('@presentation/base/hooks/assistant/actions/use-assistant-timer-actions');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createElement } = require('react') as typeof import('react');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { act, create } = require('react-test-renderer') as typeof import('react-test-renderer');

const mount = (): void => {
  act(() => {
    create(
      createElement(function Host() {
        useAssistantTimerActions();
        return null;
      }),
    );
  });
};

const timer = (id: string, recipeName: string) => ({ id, recipeName, isPaused: false });

beforeEach(() => {
  registryRef.current = new AssistantActionRegistry();
  (globalThis as never as { __timers: Probe }).__timers = { timers: {}, paused: [], stopped: [] };
});

describe('timer controls from anywhere', () => {
  it('pauses the only running timer without being told which', async () => {
    probe().timers = { a: timer('a', 'Lazanya') };
    mount();

    await registryRef.current.run(AssistantAction.PauseTimer);

    expect(probe().paused).toEqual(['a']);
  });

  it('picks by recipe name when more than one is running', async () => {
    probe().timers = { a: timer('a', 'Lazanya'), b: timer('b', 'Baklava') };
    mount();

    await registryRef.current.run(AssistantAction.StopTimer, 'baklava');

    expect(probe().stopped).toEqual(['b']);
  });

  // Reporting a stop that stopped nothing is the failure this whole area keeps
  // circling: an action claiming work it did not do.
  it('says so when nothing is running rather than claiming a stop', async () => {
    mount();

    const result = await registryRef.current.run(AssistantAction.StopTimer);

    expect(result).toMatchObject({ ok: false, error: 'no_timer' });
    expect(probe().stopped).toEqual([]);
  });

  it('does not guess between several when it is not told which', async () => {
    probe().timers = { a: timer('a', 'Lazanya'), b: timer('b', 'Baklava') };
    mount();

    const result = await registryRef.current.run(AssistantAction.PauseTimer);

    expect(result).toMatchObject({ ok: false });
    expect(probe().paused).toEqual([]);
  });
});
