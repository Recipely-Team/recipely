/** `next` after `current`, dropping any id already shown — a row deleted meanwhile shifts the server's pages. */
export const appendById = <T extends { readonly id: string }>(current: readonly T[], next: readonly T[]): T[] => {
  const seen = new Set(current.map((item) => item.id));
  return [...current, ...next.filter((item) => !seen.has(item.id))];
};
