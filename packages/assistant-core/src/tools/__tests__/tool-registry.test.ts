import { ToolError } from '../tool-error';
import { ToolRegistry } from '../tool-registry';
import type { AssistantTool } from '../assistant-tool';

const tool = (name: string, run: AssistantTool['run']): AssistantTool => ({
  definition: { name, description: `does ${name}` },
  run,
});
const call = (name: string, args: Record<string, unknown> = {}) => ({ id: 'c1', name, args });

describe('ToolRegistry', () => {
  it('runs the tool the model named, with its args, and sends back what it returned', async () => {
    const registry = new ToolRegistry([tool('setAlarm', (args) => ({ ok: true, at: args.time }))]);

    await expect(registry.run(call('setAlarm', { time: '07:30' }))).resolves.toEqual({
      ok: true,
      response: { ok: true, at: '07:30' },
    });
  });

  // An unanswered call stalls a live session with no error anywhere, so a name
  // nothing handles still gets an answer the model can talk about.
  it('answers a name nothing is registered under', async () => {
    await expect(new ToolRegistry().run(call('launchRocket'))).resolves.toEqual({
      ok: false,
      response: { ok: false, error: ToolError.UnknownTool },
    });
  });

  it('answers a tool that throws instead of stalling the turn', async () => {
    const registry = new ToolRegistry([
      tool('broken', () => {
        throw new Error('disk full');
      }),
    ]);

    await expect(registry.run(call('broken'))).resolves.toEqual({
      ok: false,
      response: { ok: false, error: ToolError.Threw, message: 'disk full' },
    });
  });

  it('treats a returned ok: false as a failure the transcript can show', async () => {
    const registry = new ToolRegistry([tool('open', () => ({ ok: false, reason: 'not found' }))]);

    expect((await registry.run(call('open'))).ok).toBe(false);
  });

  it('removes only the handler it registered', async () => {
    const registry = new ToolRegistry();
    const first = tool('open', () => ({ from: 'first' }));
    const second = tool('open', () => ({ from: 'second' }));
    const removeFirst = registry.register(first);
    registry.register(second);

    removeFirst();

    expect((await registry.run(call('open'))).response).toEqual({ from: 'second' });
    expect(registry.definitions().map((d) => d.name)).toEqual(['open']);
  });
});
