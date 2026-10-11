import { CountBadgeTone } from '@presentation/base/widgets/text/count-badge-tone';

const OVERFLOW = {
  [CountBadgeTone.Alert]: { max: 9, label: '9+' },
  [CountBadgeTone.Tally]: { max: 99, label: '99+' },
  [CountBadgeTone.ToDo]: { max: 99, label: '99+' },
} as const;

/**
 * What a count badge reads: the number, or its tone's overflow label past the
 * tone's cap ("9+" for an alert, "99+" for a tally). Shared by `CountBadge` and
 * the badges drawn inline on the web header bell and the filter FAB, so every
 * badge overflows at the same point.
 */
export function countBadgeLabel(count: number, tone: CountBadgeTone = CountBadgeTone.Alert): string {
  const { max, label } = OVERFLOW[tone];
  return count > max ? label : String(count);
}
