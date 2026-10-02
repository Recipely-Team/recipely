/** An ISO timestamp → `Date`; null for none or for one that does not parse. */
export const readDate = (raw: string | null): Date | null => {
  if (raw === null) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
};
