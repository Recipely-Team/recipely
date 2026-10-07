import { AssistantFailureCode } from '@live-assistant/core';
import { AssistantFailurePolicy } from '@application/assistant/session/assistant-failure-policy';
import { AssistantDenialReason } from '@domain/assistant/session/assistant-denial-reason';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { ServerFailure } from '@core/failure/kinds/server-failure';

const refused = AssistantFailurePolicy.refusal(AssistantDenialReason.UserDailyLimit, 0);
const backendDown = new ServerFailure('mint failed');

/**
 * Refusals are reasons the pill explains; only real failures reach the error
 * notice. Each branch here was a store-local rule before it moved.
 */
describe('AssistantFailurePolicy.toSessionError', () => {
  it('raises nothing for a refused microphone, a dropped socket or a Denied grant', () => {
    expect(AssistantFailurePolicy.toSessionError(null)).toBeNull();
    expect(AssistantFailurePolicy.toSessionError({ code: AssistantFailureCode.MicrophoneDenied })).toBeNull();
    expect(AssistantFailurePolicy.toSessionError({ code: AssistantFailureCode.ConnectionLost })).toBeNull();
    expect(
      AssistantFailurePolicy.toSessionError({ code: AssistantFailureCode.ConnectionRefused, cause: refused }),
    ).toBeNull();
  });

  it('surfaces a backend failure while minting as itself', () => {
    expect(
      AssistantFailurePolicy.toSessionError({ code: AssistantFailureCode.ConnectionRefused, cause: backendDown }),
    ).toBe(backendDown);
  });

  it('maps anything else through toAppFailure', () => {
    expect(AssistantFailurePolicy.toSessionError({ code: AssistantFailureCode.NoAnswer })?.message).toBe(
      DiagnosticMessage.assistant.noAnswer,
    );
  });
});

describe('AssistantFailurePolicy.toStartDenial', () => {
  it('names the microphone for a refused permission', () => {
    expect(AssistantFailurePolicy.toStartDenial({ code: AssistantFailureCode.MicrophoneDenied })).toEqual({
      deniedReason: AssistantDenialReason.MicrophoneDenied,
    });
  });

  it('carries the reason and the budget of a Denied grant', () => {
    const denied = AssistantFailurePolicy.refusal(AssistantDenialReason.GlobalDailyLimit, 12);
    expect(
      AssistantFailurePolicy.toStartDenial({ code: AssistantFailureCode.ConnectionRefused, cause: denied }),
    ).toEqual({ deniedReason: AssistantDenialReason.GlobalDailyLimit, remainingSeconds: 12, isUnlimited: false });
  });

  it('leaves the pill unavailable without a reason when minting itself failed', () => {
    expect(
      AssistantFailurePolicy.toStartDenial({ code: AssistantFailureCode.ConnectionRefused, cause: backendDown }),
    ).toEqual({});
  });

  it('is no refusal for any other failed start', () => {
    expect(AssistantFailurePolicy.toStartDenial({ code: AssistantFailureCode.ConnectTimedOut })).toBeNull();
    expect(AssistantFailurePolicy.toStartDenial({ code: AssistantFailureCode.ConnectionRefused })).toBeNull();
  });
});
