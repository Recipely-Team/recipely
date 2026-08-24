import { AssistantDenialReason } from '@domain/assistant/session/assistant-denial-reason';
import { AssistantStatus } from '@application/assistant/session/assistant-status';
import { assistantNotice } from '@presentation/base/widgets/assistant/assistant-notice';
import { t } from '@presentation/i18n';

describe('assistantNotice', () => {
  it('says nothing while voice is working', () => {
    expect(assistantNotice(AssistantStatus.Listening, null)).toBeNull();
    expect(assistantNotice(AssistantStatus.Idle, null)).toBeNull();
    expect(assistantNotice(AssistantStatus.Speaking, null)).toBeNull();
  });

  it('names the user\'s own limit when that is what was hit', () => {
    expect(assistantNotice(AssistantStatus.Unavailable, AssistantDenialReason.UserDailyLimit)).toBe(
      t().assistant.outOfMinutes,
    );
  });

  // Everyone shares one free-tier key, so this user may have spent nothing.
  it('names the app-wide cap separately', () => {
    expect(assistantNotice(AssistantStatus.Unavailable, AssistantDenialReason.GlobalDailyLimit)).toBe(
      t().assistant.busyEverywhere,
    );
  });

  // Found on screen: with the backend unreachable the panel told the user they
  // had used up today's minutes, which they had not — and "come back tomorrow"
  // was wrong twice over, since an outage can clear in a second. A refusal and
  // an outage share the Unavailable status; only a stated reason may claim a
  // limit.
  it('does not blame a limit for an outage', () => {
    const notice = assistantNotice(AssistantStatus.Unavailable, null);

    expect(notice).toBe(t().assistant.unavailable);
    expect(notice).not.toBe(t().assistant.outOfMinutes);
  });
});
