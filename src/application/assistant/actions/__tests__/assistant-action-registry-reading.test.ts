import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';

/**
 * "Taslağı oku" was answered with "you are on the list screen, open the draft"
 * — while the draft was open in front of the user — and then with "I can only
 * read it once it is saved".
 *
 * The registry had one describer per screen and it was the SHORT one, built to
 * ride inside every tool result: eight rows, then a count. There was nothing a
 * screen could register that meant "this is the whole of me, read it out", so
 * the model had nothing to read and explained the absence instead of reporting
 * it.
 */
describe('reading a screen', () => {
  it('reads out the innermost screen, not the one underneath it', () => {
    const registry = new AssistantActionRegistry();
    registry.registerScreenReading(() => 'feed');
    registry.registerScreenReading(() => 'draft: 1) eggs 2) flour');

    expect(registry.screenReading).toBe('draft: 1) eggs 2) flour');
  });

  it('gives the feed back when the screen over it leaves', () => {
    const registry = new AssistantActionRegistry();
    registry.registerScreenReading(() => 'feed');
    const leave = registry.registerScreenReading(() => 'draft');

    leave();

    expect(registry.screenReading).toBe('feed');
  });

  // A wait screen and a form register nothing to read. Answering with the
  // route is still an answer; answering `unavailable_here` is what sent the
  // model looking for an explanation to invent.
  it('falls back to the screen line when no screen offers a reading', () => {
    const registry = new AssistantActionRegistry();
    registry.setScreenDescriber(() => 'screen=/import-recipe');

    expect(registry.screenReading).toBe('screen=/import-recipe');
  });

  it('survives a describer that throws', () => {
    const registry = new AssistantActionRegistry();
    registry.setScreenDescriber(() => 'screen=/recipes');
    registry.registerScreenReading(() => {
      throw new Error('mid-render');
    });

    expect(registry.screenReading).toBe('screen=/recipes');
  });
});

/**
 * Asked to report a failed save, the assistant had only the user's paraphrase
 * of it: the result that carried the reason was several turns back in a window
 * that compresses, and nothing had kept it.
 */
describe('the last failure', () => {
  it('is nothing until something fails', () => {
    expect(new AssistantActionRegistry().lastFailure).toBeNull();
  });

  it('remembers the reason and the screen it happened on', async () => {
    const registry = new AssistantActionRegistry();
    registry.setScreenDescriber(() => 'screen=/create-recipe');
    registry.register(AssistantAction.PublishDraft, async () => ({ ok: false, error: 'server' }));

    await registry.run(AssistantAction.PublishDraft);

    expect(registry.lastFailure).toBe('error=server; screen=/create-recipe');
  });

  it('is not overwritten by the successes that follow it', async () => {
    const registry = new AssistantActionRegistry();
    registry.register(AssistantAction.PublishDraft, async () => ({ ok: false, error: 'server' }));
    registry.register(AssistantAction.Refresh, async () => ({ ok: true }));

    await registry.run(AssistantAction.PublishDraft);
    await registry.run(AssistantAction.Refresh);

    expect(registry.lastFailure).toBe('error=server');
  });
});
