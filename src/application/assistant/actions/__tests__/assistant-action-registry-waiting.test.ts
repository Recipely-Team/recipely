import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';

/**
 * Screen-scoped handlers register on mount, so an action asked for from
 * anywhere else found nothing — "update the about section of my profile" was
 * refused by an app that does exactly that. The fallback that carries an action
 * to its screen has to run LAST and has to WAIT, and neither can rest on the
 * order two components happen to mount in.
 */
describe('the fallback tier', () => {
  const ACTION = AssistantAction.UpdateProfile;

  it('runs only when no screen answered', async () => {
    const registry = new AssistantActionRegistry();
    const screen = jest.fn(async () => ({ ok: true as const }));
    const fallback = jest.fn(async () => ({ ok: true as const }));
    registry.registerFallback(ACTION, fallback);
    registry.register(ACTION, screen);

    await registry.run(ACTION);

    expect(screen).toHaveBeenCalledTimes(1);
    expect(fallback).not.toHaveBeenCalled();
  });

  // The order matters: a fallback registered INTO the stack was outermost only
  // by accident of React's effect order, and a screen mounting in the same
  // commit as the root put it innermost — where it answered for a screen the
  // user was already on, by pushing a second copy of it.
  it('still runs last when it was registered after the screen', async () => {
    const registry = new AssistantActionRegistry();
    const screen = jest.fn(async () => ({ ok: true as const }));
    const fallback = jest.fn(async () => ({ ok: true as const }));
    registry.register(ACTION, screen);
    registry.registerFallback(ACTION, fallback);

    await registry.run(ACTION);

    expect(fallback).not.toHaveBeenCalled();
  });

  it('runs when the screen declines the action as not its own', async () => {
    const registry = new AssistantActionRegistry();
    const fallback = jest.fn(async () => ({ ok: true as const }));
    registry.register(ACTION, async () => ({ ok: false as const, notMine: true }));
    registry.registerFallback(ACTION, fallback);

    await registry.run(ACTION);

    expect(fallback).toHaveBeenCalledTimes(1);
  });

  it('resolves the wait when the screen registers after it began', async () => {
    const registry = new AssistantActionRegistry();

    const waiting = registry.waitForScreenHandler(ACTION, 1_000);
    registry.register(ACTION, async () => ({ ok: true as const }));

    await expect(waiting).resolves.toBe(true);
  });

  // An auth guard can send the push somewhere else entirely. An assistant that
  // says it filled a field it never reached is worse than one that says it
  // could not.
  it('gives up when nothing arrives, rather than waiting for ever', async () => {
    jest.useFakeTimers();
    try {
      const registry = new AssistantActionRegistry();

      const waiting = registry.waitForScreenHandler(ACTION, 1_000);
      await jest.advanceTimersByTimeAsync(2_000);

      await expect(waiting).resolves.toBe(false);
    } finally {
      jest.useRealTimers();
    }
  });
});
