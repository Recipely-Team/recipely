import type { Mapper } from '@core/mapper/mapper';
import { fail, ok } from '@core/result/result-helpers';
import { ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { StatsRange, type StatsRangeType } from '@domain/instagram/stats/stats-range';
import type { CreatorStats } from '@domain/instagram/stats/creator-stats';
import type { CreatorStatsDto } from '@infrastructure/instagram/stats/creator-stats-dto';

const isStatsRange = (days: number): days is StatsRangeType => (Object.values(StatsRange) as number[]).includes(days);

/**
 * `GET /me/instagram/stats` → `CreatorStats`. A range the app does not offer
 * is refused; everything else is read as sent (the backend zero-fills days).
 */
export const toCreatorStats: Mapper<CreatorStatsDto, CreatorStats, ValidationFailure> = (dto) => {
  if (!isStatsRange(dto.days)) return fail(new ValidationFailure(DiagnosticMessage.instagram.sourceInvalid('days', String(dto.days)), 'days'));
  return ok({
    days: dto.days,
    from: dto.from,
    connected: dto.connected,
    totals: dto.totals,
    previous: dto.previous,
    daily: dto.daily,
    followers: dto.followers,
    posts: dto.posts.map((post) => ({
      ruleId: post.ruleId,
      mediaId: post.mediaId,
      thumbnailUrl: post.thumbnailUrl,
      keywords: post.keywords,
      enabled: post.enabled,
      matched: post.matched,
      sent: post.sent,
      opened: post.opened,
      saved: post.saved,
    })),
  });
};
