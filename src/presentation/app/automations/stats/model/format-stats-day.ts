/** A `YYYY-MM-DD` stats day as "6 Sep" / "6 Eyl" — read in UTC, the day the backend counted it in. */
export const formatStatsDay = (day: string, locale: string): string =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' });
