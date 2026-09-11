import { AssistantFailureCode, SessionEventKind, fail, ok } from '@live-assistant/core';
import type { GeminiLiveSession as GeminiLiveTransport } from '@live-assistant/gemini';
import { AssistantEventKind } from '@domain/assistant/session/assistant-event-kind';
import type { AssistantSessionEventType } from '@domain/assistant/session/assistant-session-event';
import { ChatRole } from '@domain/drafts/chat-role';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { GeminiLiveSession } from '@infrastructure/assistant/live/gemini-live-session';

/**
 * The seam between the app and `@live-assistant/gemini`: the package answers
 * with failure codes and provider-neutral events, and the app's assistant must
 * behave exactly as it did when the transport lived here.
 */
const credentials = { token: 't', model: 'm', wsUrl: 'wss://x', expiresAt: '2030-01-01T00:00:00Z' };

function fakeTransport(connectResult: Awaited<ReturnType<GeminiLiveTransport['connect']>>) {
  let listener: ((event: never) => void) | null = null;
  return {
    lastResumptionHandle: null,
    connect: jest.fn(async () => connectResult),
    sendAudio: jest.fn(),
    sendText: jest.fn(),
    respondToTool: jest.fn(),
    close: jest.fn(),
    subscribe: jest.fn((next: (event: never) => void) => {
      listener = next;
      return () => undefined;
    }),
    emit: (event: unknown) => listener?.(event as never),
  };
}

const over = (transport: ReturnType<typeof fakeTransport>) =>
  new GeminiLiveSession(transport as unknown as GeminiLiveTransport);

describe('GeminiLiveSession — the app over the package', () => {
  it('connects when the package does', async () => {
    await expect(over(fakeTransport(ok(undefined))).connect(credentials)).resolves.toEqual({
      ok: true,
      value: undefined,
    });
  });

  it.each([
    [AssistantFailureCode.ConnectTimedOut, DiagnosticMessage.assistant.connectTimedOut],
    [AssistantFailureCode.SocketFailed, DiagnosticMessage.assistant.sessionSocketFailed],
    [AssistantFailureCode.ClosedBeforeReady, DiagnosticMessage.assistant.sessionClosedBeforeReady],
  ])('turns %s into the network failure the app already reported', async (code, message) => {
    const result = await over(fakeTransport(fail({ code }))).connect(credentials);

    expect(result.ok).toBe(false);
    expect(!result.ok && result.failure.message).toBe(message);
  });

  it('hands the package events to the app unchanged', () => {
    const transport = fakeTransport(ok(undefined));
    const seen: AssistantSessionEventType[] = [];
    over(transport).subscribe((event) => seen.push(event));

    transport.emit({ kind: SessionEventKind.Transcript, speaker: 'user', text: 'tavuk var' });
    transport.emit({ kind: SessionEventKind.TurnComplete });

    expect(seen).toEqual([
      { kind: AssistantEventKind.Transcript, speaker: ChatRole.User, text: 'tavuk var' },
      { kind: AssistantEventKind.TurnComplete },
    ]);
  });

  // The package reports a call as a name and raw args; the app's registry
  // expects the backend's runAction word and argument, exactly as before.
  it('reads the runAction word and argument out of a generic tool call', () => {
    const transport = fakeTransport(ok(undefined));
    const seen: AssistantSessionEventType[] = [];
    over(transport).subscribe((event) => seen.push(event));

    transport.emit({
      kind: SessionEventKind.ToolCall,
      call: { id: 'c1', name: 'runAction', args: { action: 'search', arg: 'mercimek' } },
    });
    transport.emit({ kind: SessionEventKind.ToolCall, call: { id: 'c2', name: 'runAction', args: { arg: '' } } });
    transport.emit({ kind: SessionEventKind.ToolCallCancelled, callIds: ['c1'] });

    expect(seen).toEqual([
      { kind: AssistantEventKind.ToolCall, callId: 'c1', action: 'search', arg: 'mercimek' },
      { kind: AssistantEventKind.ToolCall, callId: 'c2', action: '' },
    ]);
  });

  it('passes audio, text and close straight through, and answers under runAction', () => {
    const transport = fakeTransport(ok(undefined));
    const session = over(transport);
    const frame = new Float32Array(4);

    session.sendAudio(frame);
    session.sendText('merhaba');
    session.respondToTool('c1', { ok: true });
    session.close();

    expect(transport.sendAudio).toHaveBeenCalledWith(frame);
    expect(transport.sendText).toHaveBeenCalledWith('merhaba');
    expect(transport.respondToTool).toHaveBeenCalledWith({ id: 'c1', name: 'runAction' }, { ok: true });
    expect(transport.close).toHaveBeenCalled();
  });
});
