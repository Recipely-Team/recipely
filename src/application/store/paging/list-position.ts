/** Where `PagedListLoader.upsertItem` puts a row the list does not hold yet. */
export const ListPosition = {
  Start: 'start',
  End: 'end',
} as const;
export type ListPositionType = (typeof ListPosition)[keyof typeof ListPosition];
