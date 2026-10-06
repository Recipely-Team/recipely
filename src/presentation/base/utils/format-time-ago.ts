import { t } from '@presentation/i18n';
import { TimeConstants, ValueConstants } from '@core/constants';

/**
 * Formats a past date as a short relative "time ago" string in the active
 * locale (e.g. "just now", "5m ago", "2h ago", "3d ago"). Future dates and
 * clock skew are clamped to zero so they never render a negative duration.
 */
export const formatTimeAgo = (date: Date): string => {
  const r = t().relativeTime;
  const seconds = Math.max(ValueConstants.zero, Math.floor((Date.now() - date.getTime()) / TimeConstants.millisecondsPerSecond));
  if (seconds < TimeConstants.secondsPerMinute) return r.justNow;
  const minutes = Math.floor(seconds / TimeConstants.secondsPerMinute);
  if (minutes < TimeConstants.minutesPerHour) return r.minutesAgo.replace('{n}', String(minutes));
  const hours = Math.floor(minutes / TimeConstants.minutesPerHour);
  if (hours < TimeConstants.hoursPerDay) return r.hoursAgo.replace('{n}', String(hours));
  const days = Math.floor(hours / TimeConstants.hoursPerDay);
  return r.daysAgo.replace('{n}', String(days));
};
