import { ok } from '../../result/result';
import type { AssistantFailure } from '../../result/failure';
import type { Result } from '../../result/result';
import type { AssistantSession } from '../../session/session';
import type { SessionEvent } from '../../session/session-event';
import type { ToolCall } from '../../tools/tool-call';

/** A session whose wire is the test: it records what was sent and emits what the test says. */
export class FakeSession implements AssistantSession<string> {
  readonly audioFormat = { inputSampleRate: 16_000, outputSampleRate: 24_000 };
  readonly connectedWith: string[] = [];
  readonly audio: Float32Array[] = [];
  readonly texts: string[] = [];
  readonly responses: { call: Pick<ToolCall, 'id' | 'name'>; response: unknown }[] = [];
  closes = 0;
  connectResult: Result<void, AssistantFailure> = ok(undefined);
  connectGate: Promise<void> | null = null;
  private listener: ((event: SessionEvent) => void) | null = null;

  async connect(connection: string): Promise<Result<void, AssistantFailure>> {
    this.connectedWith.push(connection);
    if (this.connectGate !== null) await this.connectGate;
    return this.connectResult;
  }
  sendAudio(samples: Float32Array<ArrayBuffer>): void {
    this.audio.push(samples);
  }
  sendText(text: string): void {
    this.texts.push(text);
  }
  respondToTool(call: Pick<ToolCall, 'id' | 'name'>, response: Readonly<Record<string, unknown>>): void {
    this.responses.push({ call, response });
  }
  subscribe(listener: (event: SessionEvent) => void): () => void {
    this.listener = listener;
    return () => {
      this.listener = null;
    };
  }
  close(): void {
    this.closes += 1;
  }
  emit(event: SessionEvent): void {
    this.listener?.(event);
  }
  get isSubscribed(): boolean {
    return this.listener !== null;
  }
}
