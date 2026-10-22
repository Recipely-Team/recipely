import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { BottomSheet } from '@presentation/base/widgets/sheets/bottom-sheet';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, borderWidths, controlSizes, lineHeightFor, lineHeights, layoutSizes } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import type { ImportReview } from '@presentation/app/create-recipe/model/review/import-review';
import { CharConstants } from '@core/constants';

/** The backend keeps this much of the caption and transcript; at the cap, say so. */
const SOURCE_TEXT_CAP = 4000;

export interface WhatWeReadSheetProps {
  visible: boolean;
  review: ImportReview;
  onClose: () => void;
}

/**
 * The caption and speech an import read, verbatim and in the post's own
 * language, with the original link one tap away (prototype: Import Review
 * board, "What we read"). A bottom sheet on mobile and a centred dialog on the
 * web shell, through the shared `BottomSheet` (rule 23).
 */
export const WhatWeReadSheet = ({ visible, review, onClose }: WhatWeReadSheetProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const copy = t().createRecipe.importReview;
  const text = review.sourceText ?? CharConstants.empty;
  const url = review.sourceUrl;
  return (
    <BottomSheet
      visible={visible}
      title={copy.readTitle}
      onClose={onClose}
      showCloseButton
      dialogMaxWidth={layoutSizes.dialogMaxWidth}
      footer={
        url !== undefined ? (
          <Pressable
            onPress={() => void Linking.openURL(url).catch(() => undefined)}
            style={[styles.linkBtn, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
            accessibilityRole="link"
            accessibilityLabel={copy.openLink}
          >
            <ThemedText style={[styles.linkLabel, { color: colors.text }]}>{copy.openLink}</ThemedText>
          </Pressable>
        ) : null
      }
    >
      <View style={styles.body}>
        <ThemedText variant="caption" muted>{copy.readHint}</ThemedText>
        <View style={[styles.textBox, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <ThemedText style={[styles.source, { color: colors.text }]} selectable>
            {text}
          </ThemedText>
        </View>
        {text.length >= SOURCE_TEXT_CAP ? <ThemedText variant="caption" muted>{copy.truncated}</ThemedText> : null}
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  body: { gap: spacing.sm },
  textBox: { padding: spacing.md, borderRadius: radii.lg, borderWidth: borderWidths.hairline },
  source: { fontSize: fontSizes.body, lineHeight: lineHeightFor(fontSizes.body, lineHeights.relaxed) },
  linkBtn: {
    minHeight: controlSizes.buttonSm,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  linkLabel: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
});
