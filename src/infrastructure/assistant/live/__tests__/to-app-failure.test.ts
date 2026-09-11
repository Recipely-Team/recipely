import { AssistantFailureCode } from '@live-assistant/core';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { FailureCode } from '@core/failure/failure-code';
import { toAppFailure } from '@infrastructure/assistant/live/to-app-failure';

/**
 * The library answers with codes; the session store, the notices and the
 * failure copy were written against the Failure kinds and diagnostics the app
 * produced before the library existed. Each code must land on that same pair.
 */
describe('toAppFailure', () => {
  it.each([
    [AssistantFailureCode.ConnectTimedOut, FailureCode.Network, DiagnosticMessage.assistant.connectTimedOut],
    [AssistantFailureCode.SocketFailed, FailureCode.Network, DiagnosticMessage.assistant.sessionSocketFailed],
    [AssistantFailureCode.ClosedBeforeReady, FailureCode.Network, DiagnosticMessage.assistant.sessionClosedBeforeReady],
    [AssistantFailureCode.MicrophoneDenied, FailureCode.Forbidden, DiagnosticMessage.assistant.microphoneDenied],
  ])('maps %s to the kind and diagnostic the app always reported', (code, kind, message) => {
    const failure = toAppFailure({ code });

    expect(failure.code).toBe(kind);
    expect(failure.message).toBe(message);
  });

  it('keeps the platform reason in an unavailable-device diagnostic', () => {
    expect(toAppFailure({ code: AssistantFailureCode.MicrophoneUnavailable, detail: 'busy' }).message).toBe(
      DiagnosticMessage.assistant.microphoneUnavailable('busy'),
    );
    expect(toAppFailure({ code: AssistantFailureCode.PlayerUnavailable }).message).toBe(
      DiagnosticMessage.assistant.playerUnavailable(DiagnosticMessage.crypto.unknownReason),
    );
  });
});
