import { toAssistantSessionGrant } from '@infrastructure/assistant/token/assistant-session-mapper';
import { AssistantGrantStatus } from '@domain/assistant/session/assistant-grant-status';
import { AssistantDenialReason } from '@domain/assistant/session/assistant-denial-reason';

describe('toAssistantSessionGrant', () => {
  it('grants when token, model and socket URL are all present', () => {
    const grant = toAssistantSessionGrant({ token: 't', model: 'm', wsUrl: 'wss://x', budgetRemainingSec: 90, unlimited: true });
    expect(grant).toEqual({
      status: AssistantGrantStatus.Granted,
      credentials: { token: 't', model: 'm', wsUrl: 'wss://x', expiresAt: '' },
      remainingSeconds: 90,
      isUnlimited: true,
    });
  });

  it('denies a partial grant, keeping the global-limit reason and defaulting the rest to the user limit', () => {
    expect(toAssistantSessionGrant({ token: 't', reason: AssistantDenialReason.GlobalDailyLimit })).toEqual({
      status: AssistantGrantStatus.Denied, reason: AssistantDenialReason.GlobalDailyLimit, remainingSeconds: 0,
    });
    expect(toAssistantSessionGrant({ reason: 'something_new' })).toMatchObject({ reason: AssistantDenialReason.UserDailyLimit });
  });
});
