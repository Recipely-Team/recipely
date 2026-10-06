import { Linking, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { ProvenanceMark, type ProvenanceMarkType } from '@domain/recipes/provenance/provenance-mark';
import { CharConstants, ValueConstants } from '@core/constants';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { instagramProfileUrl, tiktokProfileUrl } from '@presentation/base/constants';
import { spacing, radii, fontSizes, fontWeights, lineHeightFor } from '@presentation/base/theme';
import { ProvenanceSeal } from '@presentation/base/widgets/badges/provenance-seal';
import { provenanceSealMetrics } from '@presentation/base/widgets/badges/provenance-seal-metrics';
import { SealSurface } from '@presentation/base/widgets/badges/seal-surface';
import { t } from '@presentation/i18n';

/** The `{handle}` slot the import copy leaves for the account name. */
const HANDLE_SLOT = '{handle}';
/** Handles are shown the way the platforms write them, not the way we store them. */
const HANDLE_PREFIX = '@';
const WEB_SCHEME = 'https://';

/** The marks that name an outside source; the AI mark qualifies one and Recipely Kitchen is ours. */
type SourceMarkType = Exclude<ProvenanceMarkType, typeof ProvenanceMark.Ai | typeof ProvenanceMark.Curated>;

const SOURCE_WORDS: Record<SourceMarkType, {
  sentence: () => string;
  fallback: () => string;
  open: () => string;
  prefix: string;
  /** Where the name links, or `null` when there is nowhere honest to send it. */
  href: (handle: string, sourceUrl: string | undefined) => string | null;
}> = {
  [ProvenanceMark.Instagram]: {
    sentence: () => t().recipes.originInstagramDetailLabel,
    fallback: () => t().recipes.originInstagramA11y,
    open: () => t().recipes.originInstagramHandleA11y,
    prefix: HANDLE_PREFIX,
    href: (handle, sourceUrl) => sourceUrl ?? instagramProfileUrl(handle),
  },
  [ProvenanceMark.TikTok]: {
    sentence: () => t().recipes.originTiktokDetailLabel,
    fallback: () => t().recipes.originTiktokA11y,
    open: () => t().recipes.originTiktokHandleA11y,
    prefix: HANDLE_PREFIX,
    href: (handle, sourceUrl) => sourceUrl ?? tiktokProfileUrl(handle),
  },
  // Pages and channels are named without @.
  [ProvenanceMark.Facebook]: {
    sentence: () => t().recipes.originFacebookDetailLabel,
    fallback: () => t().recipes.originFacebookA11y,
    open: () => t().recipes.originFacebookHandleA11y,
    prefix: CharConstants.empty,
    href: (_page, sourceUrl) => sourceUrl ?? null,
  },
  [ProvenanceMark.YouTube]: {
    sentence: () => t().recipes.originYoutubeDetailLabel,
    fallback: () => t().recipes.originYoutubeA11y,
    open: () => t().recipes.originYoutubeHandleA11y,
    prefix: CharConstants.empty,
    href: (_channel, sourceUrl) => sourceUrl ?? null,
  },
  // A site is named as a site, and its link is the page the recipe came from.
  [ProvenanceMark.Web]: {
    sentence: () => t().recipes.originWebDetailLabel,
    fallback: () => t().recipes.originWebA11y,
    open: () => t().recipes.originWebHandleA11y,
    prefix: CharConstants.empty,
    href: (host, sourceUrl) => sourceUrl ?? `${WEB_SCHEME}${host}`,
  },
};

export interface ProvenanceNoteProps {
  marks: readonly ProvenanceMarkType[];
  /** The account an imported recipe was lifted from, or the site for a web page. */
  sourceHandle?: string;
  /** The page a web import was read from; the site's link goes there. */
  sourceUrl?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * The detail screen's provenance line: the seal, and one sentence that tells
 * the whole truth — "Imported from @handle on TikTok, edited with AI".
 *
 * @remarks
 * - **Nothing for a hand-written recipe**, the same silence as the seal.
 * - **One sentence, not two rows.** An import a model wrote is the ordinary
 *   import, so the AI half is a clause on the platform sentence rather than a
 *   second line that reads as a second fact about a different thing.
 * - **The handle is the only link, and a nested `Text`.** It sits inside a
 *   sentence, where a `Pressable` would break the inline flow — the bounded
 *   exception WCAG 2.5.5 grants every link inside a run of text.
 * - **The sentence is in `text`, never `textMuted`**, which measures 2.52:1 on
 *   pearl-white dark. The handle keeps `chipText`, which the palette suite
 *   holds at 4.5:1 on both `background` and `surface` in every theme.
 * - **The link opens the video itself**, named by its account: the recipe came
 *   from that post, not from everything the account has made. The profile is
 *   the fallback only when the post's address is unknown.
 * - **Facebook and YouTube name the page or channel**, as it calls itself —
 *   "Imported from the Tasty channel on YouTube" — with no `@`, since a
 *   display name is not a handle. Every import a model rewrote says "edited";
 *   only a recipe a model wrote from a prompt says "written".
 * - **A web page is named by its site**, without an `@`, and the site links to
 *   the page itself — the one address that recipe actually came from.
 * - **An AI-only recipe has no platform to name**, so it is a chip — seal and
 *   label — rather than a sentence with a missing half. A Recipely Kitchen
 *   recipe is the same chip, with the logo and "Recipely Kitchen".
 */
export const ProvenanceNote = ({ marks, sourceHandle, sourceUrl, style }: ProvenanceNoteProps): React.JSX.Element | null => {
  const colors = useTheme().colors;
  if (marks.length === ValueConstants.zero) return null;

  const seal = <ProvenanceSeal marks={marks} surface={SealSurface.Page} size={provenanceSealMetrics.pageSize} />;
  const curated = marks.includes(ProvenanceMark.Curated);
  const platform = marks.find(
    (mark): mark is SourceMarkType => mark !== ProvenanceMark.Ai && mark !== ProvenanceMark.Curated,
  );

  if (curated || platform === undefined) {
    return (
      <View style={style}>
        <View style={[styles.aiChip, { backgroundColor: colors.chipBackground }]}>
          {seal}
          <ThemedText style={[styles.aiLabel, { color: colors.chipText }]}>
            {curated ? t().recipes.originCuratedDetailLabel : t().recipes.originAiDetailLabel}
          </ThemedText>
        </View>
      </View>
    );
  }

  const words = SOURCE_WORDS[platform];
  const tail = marks.includes(ProvenanceMark.Ai) ? t().recipes.originEditedByAiSuffix : '';
  // No handle: still say where it came from.
  const [before, after] =
    sourceHandle === undefined ? [words.fallback(), ''] : words.sentence().split(HANDLE_SLOT);
  const shownHandle = `${words.prefix}${sourceHandle ?? ''}`;
  const href = sourceHandle === undefined ? null : words.href(sourceHandle, sourceUrl);

  return (
    <View style={[styles.row, style]}>
      {seal}
      <ThemedText style={[styles.sentence, { color: colors.text }]}>
        {before}
        {sourceHandle !== undefined && href === null ? shownHandle : null}
        {href !== null ? (
          <Text
            accessibilityRole="link"
            accessibilityLabel={words.open().replace(HANDLE_SLOT, shownHandle)}
            onPress={() => void Linking.openURL(href).catch(() => undefined)}
            style={[styles.handle, { color: colors.chipText }]}
          >
            {shownHandle}
          </Text>
        ) : null}
        {after}
        {tail}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  aiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs2,
    borderRadius: radii.round,
    paddingVertical: spacing.xxs,
    paddingLeft: spacing.xxs,
    paddingRight: spacing.md,
  },
  aiLabel: { fontSize: fontSizes.small, fontWeight: fontWeights.semibold },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  // Wraps rather than truncates.
  sentence: { fontSize: fontSizes.caption, lineHeight: lineHeightFor(fontSizes.caption), flexShrink: 1 },
  handle: { fontWeight: fontWeights.semibold, textDecorationLine: 'underline' },
});
