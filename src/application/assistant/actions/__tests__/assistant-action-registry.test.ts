import { AssistantAction } from '@domain/assistant/assistant-action-type';
import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';

describe('AssistantActionRegistry', () => {
  it('routes a call to the handler registered for it', async () => {
    const registry = new AssistantActionRegistry();
    registry.register(AssistantAction.GenerateRecipe, async (arg) => ({ ok: true, title: arg }));

    await expect(registry.run(AssistantAction.GenerateRecipe, 'tavuk')).resolves.toEqual({
      ok: true,
      title: 'tavuk',
    });
  });

  // A live session stops and waits for a response to every function call it
  // makes. Anything that does not answer leaves the assistant silent
  // mid-sentence with nothing anywhere reporting why — so all three of these
  // are results, not thrown errors or undefined.
  describe('always answers', () => {
    it('answers an action the build has never heard of', async () => {
      // The enum the model chooses from is declared by the backend, so a deploy
      // there can teach it a word this app does not know. Normal, not a bug.
      await expect(new AssistantActionRegistry().run('launchRocket')).resolves.toEqual({
        ok: false,
        error: 'unknown_action',
      });
    });

    it('answers a known action with nothing registered to do it', async () => {
      await expect(new AssistantActionRegistry().run(AssistantAction.AttachPhoto)).resolves.toEqual({
        ok: false,
        error: 'unavailable_here',
      });
    });

    it('answers when a handler throws', async () => {
      const registry = new AssistantActionRegistry();
      registry.register(AssistantAction.Save, async () => {
        throw new Error('boom');
      });

      await expect(registry.run(AssistantAction.Save)).resolves.toEqual({ ok: false, error: 'failed' });
    });
  });

  describe('screen context', () => {
    // Sending the screen state as its own realtimeInput.text would start a new
    // model turn and be billed as one. Riding inside a response the model is
    // already waiting for costs about fifteen tokens.
    it('appends the screen line to every result, including failures', async () => {
      const registry = new AssistantActionRegistry();
      registry.setScreenDescriber(() => 'screen=createRecipe draft=8/6');
      registry.register(AssistantAction.Save, async () => ({ ok: true }));

      await expect(registry.run(AssistantAction.Save)).resolves.toEqual({
        ok: true,
        ctx: 'screen=createRecipe draft=8/6',
      });
      await expect(registry.run('nonsense')).resolves.toEqual({
        ok: false,
        error: 'unknown_action',
        ctx: 'screen=createRecipe draft=8/6',
      });
    });

    // The assistant navigates while it works, so a context captured at
    // registration time would describe the screen the user has already left.
    it('reads the screen at answer time, not at registration time', async () => {
      const registry = new AssistantActionRegistry();
      let screen = 'screen=recipes';
      registry.setScreenDescriber(() => screen);
      registry.register(AssistantAction.Navigate, async () => {
        screen = 'screen=createRecipe';
        return { ok: true };
      });

      await expect(registry.run(AssistantAction.Navigate)).resolves.toEqual({
        ok: true,
        ctx: 'screen=createRecipe',
      });
    });

    it('omits ctx entirely when nothing describes the screen', async () => {
      const registry = new AssistantActionRegistry();
      registry.register(AssistantAction.Stop, async () => ({ ok: true }));

      await expect(registry.run(AssistantAction.Stop)).resolves.toEqual({ ok: true });
    });
  });

  describe('unregister', () => {
    it('stops routing to a handler that has gone away', async () => {
      const registry = new AssistantActionRegistry();
      const unregister = registry.register(AssistantAction.Save, async () => ({ ok: true }));

      unregister();

      await expect(registry.run(AssistantAction.Save)).resolves.toEqual({
        ok: false,
        error: 'unavailable_here',
      });
    });

    // React unmounts the outgoing screen AFTER the incoming one has mounted, so
    // a cleanup that deleted by key alone would take the live handler with it
    // and leave the action dead on a screen that implements it.
    it('does not remove a handler that replaced it', async () => {
      const registry = new AssistantActionRegistry();
      const unregisterOld = registry.register(AssistantAction.Save, async () => ({ ok: true, title: 'old' }));
      registry.register(AssistantAction.Save, async () => ({ ok: true, title: 'new' }));

      unregisterOld();

      await expect(registry.run(AssistantAction.Save)).resolves.toEqual({ ok: true, title: 'new' });
    });
  });

  it('reports what it can currently do', () => {
    const registry = new AssistantActionRegistry();
    registry.register(AssistantAction.Save, async () => ({ ok: true }));
    registry.register(AssistantAction.Like, async () => ({ ok: true }));

    expect(registry.registeredActions).toEqual([AssistantAction.Save, AssistantAction.Like]);
  });
});
