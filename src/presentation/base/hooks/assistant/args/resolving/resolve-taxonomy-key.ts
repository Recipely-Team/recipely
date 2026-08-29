import { foldForMatch } from '@presentation/base/hooks/assistant/args/resolving/fold-for-match';
import { machineLower } from '@presentation/base/hooks/assistant/args/resolving/machine-case';
import { ValueConstants } from '@core/constants';

/** The shape every taxonomy list shares: a machine key and the name a user reads. */
interface TaxonomyOption {
  key: string;
  name: string;
}

/**
 * Finds the cuisine or category a spoken phrase meant.
 *
 * @remarks
 * - **A key is matched exactly; a NAME is matched inside a sentence.** People
 *   do not say "Türk", they say "Türk mutfağı" — and an equality test against
 *   the taxonomy name "Türk" answered `unknown_cuisine` while the chip for it
 *   was on screen. Folding fixed the letters (see {@link foldForMatch}); it did
 *   not fix the fact that the user says more words than the label carries.
 * - **A whole word beats a word with something stuck to it.** Turkish glues
 *   suffixes on — "en yüksek puan" is spoken as "puanlı" — so a match has to be
 *   allowed to end inside a word. But allowing that alone made "orta zorlukta"
 *   ambiguous, because `zor` starts a word inside `zorlukta` and `orta` is
 *   right there as itself. So standalone matches are considered first, and the
 *   suffix tier is consulted only when no name stands alone in the phrase.
 * - **The left boundary is never relaxed**, which is what keeps `Çin` out of
 *   `Hindiçini`: the `cin` inside it does not begin a word.
 * - **A name swallowed by a longer one loses**, which is what would keep an
 *   `Orta` apart from `Orta Doğu` if both were listed: the longer name is the
 *   more specific reading of the same words.
 * - **Two names that are genuinely both there is `null`, never a guess.** "Çin
 *   ve Hint arasında karar veremedim" names two cuisines and this action sets
 *   one; answering with whichever is longer drops the other silently, which is
 *   the failure a speaker cannot see coming.
 * - **Noise falls out for free.** A phrase the transcriber padded — "Türk
 *   mutfağı. Giysinler." was a real one — still contains the name, so the
 *   filter lands instead of the whole utterance being rejected.
 */
export function resolveTaxonomyKey(
  options: readonly TaxonomyOption[],
  value: string,
): string | null {
  const wantedKey = machineLower(value);
  const wantedName = foldForMatch(value);

  const exact = options.find(
    (item) => machineLower(item.key) === wantedKey || foldForMatch(item.name) === wantedName,
  );
  if (exact !== undefined) return exact.key;

  const standalone: { key: string; name: string }[] = [];
  const suffixed: { key: string; name: string }[] = [];
  for (const item of options) {
    const name = foldForMatch(item.name);
    if (name.length === ValueConstants.zero) continue;
    const hit = matchIn(wantedName, name);
    if (hit === MatchKind.Whole) standalone.push({ key: item.key, name });
    else if (hit === MatchKind.Suffixed) suffixed.push({ key: item.key, name });
  }

  const found = standalone.length > ValueConstants.zero ? standalone : suffixed;

  // A name contained in another match is the same words read less specifically,
  // so it is not a second cuisine — it is the same one, spelled shorter.
  const distinct = found.filter(
    (candidate) =>
      !found.some(
        (other) => other.key !== candidate.key && matchIn(other.name, candidate.name) !== MatchKind.None,
      ),
  );

  return distinct.length === ValueConstants.one ? (distinct[ValueConstants.zero]?.key ?? null) : null;
}

/** How well a name sits inside a phrase. */
const MatchKind = { None: 0, Suffixed: 1, Whole: 2 } as const;
type MatchKindType = (typeof MatchKind)[keyof typeof MatchKind];

/** The best way `needle` occurs in `haystack`, always starting a word. */
function matchIn(haystack: string, needle: string): MatchKindType {
  let best: MatchKindType = MatchKind.None;
  let from = ValueConstants.zero;
  for (;;) {
    const at = haystack.indexOf(needle, from);
    if (at === ValueConstants.minusOne) return best;
    const before = at === ValueConstants.zero ? undefined : haystack[at - ValueConstants.one];
    if (!isLetter(before)) {
      if (!isLetter(haystack[at + needle.length])) return MatchKind.Whole;
      best = MatchKind.Suffixed;
    }
    from = at + ValueConstants.one;
  }
}

function isLetter(char: string | undefined): boolean {
  return char !== undefined && /[a-z0-9]/.test(char);
}
