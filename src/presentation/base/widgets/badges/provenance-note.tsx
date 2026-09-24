import { Linking, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { ProvenanceMark, type ProvenanceMarkType } from '@domain/recipes/provenance/provenance-mark';
import { ValueConstants } from '@core/constants';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { instagramProfileUrl, tiktokProfileUrl } from '@presentation/base/constants';
import { spacing, radii, fontSizes, fontWeights } from '@presentation/base/theme';
import { ProvenanceSeal } from '@presentation/base/widgets/badges/provenance-seal';
import { provenanceSealMetrics } from '@presentation/base/widgets/badges/provenance-seal-metrics';
import { SealSurface } from '@presentation/base/widgets/badges/seal-surface';
import { t } from '@presentation/i18n';

/** The `{handle}` slot the import copy leaves for the account name. */
const HANDLE_SLOT = '{handle}';
/** Handles are shown the way the platforms write them, not the way we store them. */
const HANDLE_PREFIX = '@';

export interface ProvenanceNoteProps {
  marks: readonly ProvenanceMarkType[];
  /** The account an imported recipe was lifted from, when the server knows it. */
  sourceHandle?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * The detail screen's provenance line: the seal, and one sentence that tells
 * the whole truth — "Imported from @handle on TikTok, written by AI".
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
 * - **An AI-only recipe has no platform to name**, so it is a chip — seal and
 *   label — rather than a sentence with a missing half.
 */
export const ProvenanceNote = ({ marks, sourceHandle, style }: ProvenanceNoteProps): React.JSX.Element | null => {
  const colors = useTheme().colors;
  if (marks.length === ValueConstants.zero) return null;

  const seal = <ProvenanceSeal marks={marks} surface={SealSurface.Page} size={provenanceSealMetrics.pageSize} />;
  const platform = marks.find((mark) => mark !== ProvenanceMark.Ai);

  if (platform === undefined) {
    return (
      <View style={style}>
        <View style={[styles.aiChip, { backgroundColor: colors.chipBackground }]}>
          {seal}
          <ThemedText style={[styles.aiLabel, { color: colors.chipText }]}>
            {t().recipes.originAiDetailLabel}
          </ThemedText>
        </View>
      </View>
    );
  }

  const isTiktok = platform === ProvenanceMark.TikTok;
  const sentence = isTiktok ? t().recipes.originTiktokDetailLabel : t().recipes.originInstagramDetailLabel;
  const tail = marks.includes(ProvenanceMark.Ai) ? t().recipes.originWrittenByAiSuffix : '';
  // An import with no handle still says where it came from; `@undefined` would
  // be worse than the missing half of a sentence.
  const [before, after] =
    sourceHandle === undefined
      ? [isTiktok ? t().recipes.originTiktokA11y : t().recipes.originInstagramA11y, '']
      : sentence.split(HANDLE_SLOT);
  const shownHandle = `${HANDLE_PREFIX}${sourceHandle ?? ''}`;
  const openLabel = isTiktok ? t().recipes.originTiktokHandleA11y : t().recipes.originInstagramHandleA11y;
  const profileUrl = isTiktok ? tiktokProfileUrl : instagramProfileUrl;

  return (
    <View style={[styles.row, style]}>
      {seal}
      <ThemedText style={[styles.sentence, { color: colors.text }]}>
        {before}
        {sourceHandle !== undefined ? (
          <Text
            accessibilityRole="link"
            accessibilityLabel={openLabel.replace(HANDLE_SLOT, shownHandle)}
            onPress={() => void Linking.openURL(profileUrl(sourceHandle)).catch(() => undefined)}
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
  // No `numberOfLines`: the sentence is the point, so it wraps on a narrow
  // phone rather than truncating the fact it exists to state.
  sentence: { fontSize: fontSizes.caption, flexShrink: 1 },
  handle: { fontWeight: fontWeights.semibold, textDecorationLine: 'underline' },
});
