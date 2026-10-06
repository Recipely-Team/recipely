import { ValueConstants } from '@core/constants';
import { foldForMatch } from '@presentation/base/hooks/assistant/args/resolving/fold-for-match';

const WORD = /\s+/;
/** How well a name matches, best first: exact, prefix, substring, every word somewhere. */
const Score = { Exact: 3, Prefix: 2, Contains: 1, AllWords: 0.5, None: 0 } as const;

/** How well a name answers a query: 3 exact, 2 prefix, 1 contains it, 0.5 has every word, 0 none. */
const scoreOf = (name: string, needle: string): number => {
  const folded = foldForMatch(name);
  if (folded === needle) return Score.Exact;
  if (folded.startsWith(needle)) return Score.Prefix;
  if (folded.includes(needle)) return Score.Contains;
  const words = needle.split(WORD).filter((word) => word.length > ValueConstants.zero);
  return words.length > ValueConstants.one && words.every((word) => folded.includes(word)) ? Score.AllWords : Score.None;
};

/**
 * The items whose name best answers what the user said, best tier only, in
 * the order given (so the caller's source order breaks ties).
 *
 * Folded rather than locale-lowercased, like every other assistant match:
 * a model writes "menemen" for "Menemen" and "cilbir" for "Çılbır".
 */
export const rankByName = <T>(items: readonly T[], nameOf: (item: T) => string, query: string): T[] => {
  const needle = foldForMatch(query);
  if (needle.length === ValueConstants.zero) return [];
  const scored = items.map((item) => ({ item, score: scoreOf(nameOf(item), needle) }));
  const best = Math.max(ValueConstants.zero, ...scored.map((s) => s.score));
  return best === ValueConstants.zero ? [] : scored.filter((s) => s.score === best).map((s) => s.item);
};
