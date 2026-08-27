import { assistantNoticeTone } from '@presentation/base/widgets/assistant/assistant-notice-tone';
import { AssistantDenialReason } from '@domain/assistant/session/assistant-denial-reason';
import { SeverityType } from '@presentation/base/theme/colors/surfaces/severity-type';

/**
 * "Hata tepede siyah olunca belli olmuyor." Every notice rendered as the same
 * muted caption, so a request that had FAILED looked exactly like a note that
 * voice was off — and on the dark sheet the one that mattered was the one
 * nobody saw.
 */
describe('assistantNoticeTone', () => {
  it('shouts about a failure', () => {
    expect(assistantNoticeTone(true, null)).toBe(SeverityType.Danger);
  });

  it('still shouts about a failure that arrived alongside a denial', () => {
    expect(assistantNoticeTone(true, AssistantDenialReason.UserDailyLimit)).toBe(SeverityType.Danger);
  });

  it.each([
    AssistantDenialReason.UserDailyLimit,
    AssistantDenialReason.GlobalDailyLimit,
    AssistantDenialReason.MicrophoneDenied,
  ])('warns about %s, because the advice is actionable', (reason) => {
    expect(assistantNoticeTone(false, reason)).toBe(SeverityType.Warning);
  });

  // Shouting this would train the user to ignore the surface that also carries
  // the failures.
  it('stays quiet when voice is simply not on', () => {
    expect(assistantNoticeTone(false, null)).toBe(SeverityType.Neutral);
  });
});
