import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';

/**
 * Screen-scoped handlers register on mount, so an action asked for from
 * anywhere else found nothing and came back `unavailable_here` — "update the
 * about section of my profile" was refused by an app that supports exactly
 * that. The fallback that fixes it has to navigate and then WAIT, because
 * pushing a route and looking immediately always finds nothing.
 */
describe('waiting for the screen that answers an action', () => {
  const fallback = async (): Promise<{ ok: true }> => ({ ok: true });
  const owner = async (): Promise<{ ok: true }> => ({ ok: true });

  it('resolves when the screen registers after the wait began', async () => {
    const registry = new AssistantActionRegistry();
    registry.register(AssistantAction.UpdateProfile, fallback);

    const waiting = registry.waitForHandlerOtherThan(AssistantAction.UpdateProfile, fallback, 1_000);
    registry.register(AssistantAction.UpdateProfile, owner);

    await expect(waiting).resolves.toBe(true);
  });

  it('answers at once when the screen is already open', async () => {
    const registry = new AssistantActionRegistry();
    registry.register(AssistantAction.UpdateProfile, fallback);
    registry.register(AssistantAction.UpdateProfile, owner);

    await expect(
      registry.waitForHandlerOtherThan(AssistantAction.UpdateProfile, fallback, 1_000),
    ).resolves.toBe(true);
  });

  // An auth guard can send the push somewhere else entirely. An assistant that
  // says it filled a field it never reached is worse than one that says it
  // could not.
  it('gives up when nothing arrives, rather than waiting for ever', async () => {
    jest.useFakeTimers();
    try {
      const registry = new AssistantActionRegistry();
      registry.register(AssistantAction.UpdateProfile, fallback);

      const waiting = registry.waitForHandlerOtherThan(AssistantAction.UpdateProfile, fallback, 1_000);
      await jest.advanceTimersByTimeAsync(2_000);

      await expect(waiting).resolves.toBe(false);
    } finally {
      jest.useRealTimers();
    }
  });

  it('never offers the asking handler back to itself', () => {
    const registry = new AssistantActionRegistry();
    registry.register(AssistantAction.UpdateProfile, fallback);

    expect(registry.handlerOtherThan(AssistantAction.UpdateProfile, fallback)).toBeNull();
  });
});
