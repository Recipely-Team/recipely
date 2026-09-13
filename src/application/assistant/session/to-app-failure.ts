import { AssistantFailureCode } from '@live-assistant/core';
import type { AssistantFailure, AssistantFailureCodeType } from '@live-assistant/core';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import type { Failure } from '@core/failure/failure';
import { ForbiddenFailure } from '@core/failure/kinds/forbidden-failure';
import { NetworkFailure } from '@core/failure/kinds/network-failure';
import { UnknownFailure } from '@core/failure/kinds/unknown-failure';

/**
 * Every library failure code, as the `Failure` kind and diagnostic this app
 * reported before the library existed. Typed as a full record, so a code the
 * library adds stops this file compiling until it is given a meaning here.
 */
const FAILURE_BY_CODE: Readonly<Record<AssistantFailureCodeType, (reason: string) => Failure>> = {
  [AssistantFailureCode.ConnectTimedOut]: () => new NetworkFailure(DiagnosticMessage.assistant.connectTimedOut),
  [AssistantFailureCode.SocketFailed]: () => new NetworkFailure(DiagnosticMessage.assistant.sessionSocketFailed),
  [AssistantFailureCode.ClosedBeforeReady]: () =>
    new NetworkFailure(DiagnosticMessage.assistant.sessionClosedBeforeReady),
  [AssistantFailureCode.MicrophoneDenied]: () => new ForbiddenFailure(DiagnosticMessage.assistant.microphoneDenied),
  [AssistantFailureCode.MicrophoneUnavailable]: (reason) =>
    new UnknownFailure(DiagnosticMessage.assistant.microphoneUnavailable(reason)),
  [AssistantFailureCode.PlayerUnavailable]: (reason) =>
    new UnknownFailure(DiagnosticMessage.assistant.playerUnavailable(reason)),
  [AssistantFailureCode.ConnectionRefused]: (reason) =>
    new NetworkFailure(DiagnosticMessage.assistant.connectionRefused(reason)),
  [AssistantFailureCode.ConnectionLost]: () => new NetworkFailure(DiagnosticMessage.assistant.connectionLost),
  [AssistantFailureCode.NoAnswer]: () => new UnknownFailure(DiagnosticMessage.assistant.noAnswer),
};

/**
 * Maps a `@live-assistant/*` failure onto this app's `Failure` hierarchy.
 *
 * The library speaks codes and never words; this is the one place the app
 * gives them its own kinds and diagnostics — the mapping every integrator writes.
 */
export function toAppFailure(failure: AssistantFailure): Failure {
  return FAILURE_BY_CODE[failure.code](failure.detail ?? DiagnosticMessage.crypto.unknownReason);
}
