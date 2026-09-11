import { AssistantFailureCode, SessionEventKind } from '@live-assistant/core';
import type { AssistantFailure, SessionEvent } from '@live-assistant/core';
import { GeminiLiveSession as GeminiLiveTransport } from '@live-assistant/gemini';
import { ApiLiveTool } from '@infrastructure/constants/api/api-live-tool';
import { AssistantEventKind } from '@domain/assistant/session/assistant-event-kind';
import type { AssistantSessionEventType } from '@domain/assistant/session/assistant-session-event';
import type { AssistantSessionInterface } from '@domain/assistant/session/assistant-session-interface';
import type { LiveSessionCredentials } from '@domain/assistant/session/live-session-credentials';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import type { Failure } from '@core/failure/failure';
import { NetworkFailure } from '@core/failure/kinds/network-failure';
import { CharConstants } from '@core/constants';
import { isNonEmptyString, isString } from '@core/guards/type-guards';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';

/** The package's failure codes, in the words this app logs them with. */
const DIAGNOSTIC_BY_CODE: Readonly<Record<AssistantFailure['code'], string>> = {
  [AssistantFailureCode.ConnectTimedOut]: DiagnosticMessage.assistant.connectTimedOut,
  [AssistantFailureCode.SocketFailed]: DiagnosticMessage.assistant.sessionSocketFailed,
  [AssistantFailureCode.ClosedBeforeReady]: DiagnosticMessage.assistant.sessionClosedBeforeReady,
};

/**
 * A package event in the app's vocabulary, or null for one the app does not act on.
 *
 * The package reports a tool call as a name and raw arguments; this app's
 * contract is the backend's single `runAction` with an `action` word and an
 * optional `arg`. A withdrawn call needs nothing: the registry's answer to it
 * is simply ignored by the server.
 */
function toAppEvent(event: SessionEvent): AssistantSessionEventType | null {
  switch (event.kind) {
    case SessionEventKind.ToolCall: {
      const action = event.call.args[ApiLiveTool.actionField];
      const arg = event.call.args[ApiLiveTool.argField];
      return {
        kind: AssistantEventKind.ToolCall,
        callId: event.call.id,
        action: isString(action) ? action : CharConstants.empty,
        ...(isNonEmptyString(arg) ? { arg } : {}),
      };
    }
    case SessionEventKind.ToolCallCancelled:
      return null;
    default:
      return event;
  }
}

/**
 * The app's Live session, served by `@live-assistant/gemini`.
 *
 * @remarks
 * - **The transport lives in the package now; this is the seam every consumer of
 *   the library writes.** The package speaks failure CODES and never words, so
 *   this maps them onto the app's `Failure` kinds. Recipely writes it first so
 *   the library's integration story is one somebody has actually lived with.
 * - **The package knows nothing about this app.** Its tool calls are generic
 *   (a name and raw arguments); `toAppEvent` turns them into the backend's
 *   `runAction` contract, and every other event passes through — its kinds and
 *   speakers are the same strings as `AssistantEventKind` and `ChatRole`, which
 *   TypeScript checks structurally, so a renamed kind stops this file compiling.
 */
export class GeminiLiveSession implements AssistantSessionInterface {
  constructor(private readonly transport: GeminiLiveTransport = new GeminiLiveTransport()) {}

  /** The handle the application layer needs to continue after a `goAway`. */
  get lastResumptionHandle(): string | null {
    return this.transport.lastResumptionHandle;
  }

  async connect(credentials: LiveSessionCredentials): Promise<Result<void, Failure>> {
    const connected = await this.transport.connect(credentials);
    return connected.ok ? ok(undefined) : fail(new NetworkFailure(DIAGNOSTIC_BY_CODE[connected.failure.code]));
  }

  sendAudio(samples: Float32Array<ArrayBuffer>): void {
    this.transport.sendAudio(samples);
  }

  sendText(text: string): void {
    this.transport.sendText(text);
  }

  respondToTool(callId: string, response: Record<string, unknown>): void {
    this.transport.respondToTool({ id: callId, name: ApiLiveTool.name }, response);
  }

  subscribe(listener: (event: AssistantSessionEventType) => void): () => void {
    return this.transport.subscribe((event) => {
      const mapped = toAppEvent(event);
      if (mapped !== null) listener(mapped);
    });
  }

  close(): void {
    this.transport.close();
  }
}
