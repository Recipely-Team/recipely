import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, letterSpacings, iconSizes, controlSizes, borderWidths } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface ResumeDraftCardProps {
  draftName: string | undefined;
  onPress: () => void;
}

/** "Resume your draft" card shown on the prompt phase when a draft exists. */
export const ResumeDraftCard = ({ draftName, onPress }: ResumeDraftCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const name = draftName !== undefined && draftName.length > ValueConstants.zero ? draftName : t().drafts.untitled;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.resumeCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
      accessibilityRole="button"
      accessibilityLabel={t().createRecipe.resumeDraft}
    >
      <View style={[styles.resumeIcon, { backgroundColor: colors.chipBackground }]}>
        <Ionicons name="bookmark" size={iconSizes.md} color={colors.primary} />
      </View>
      <View style={styles.resumeBody}>
        <ThemedText variant="caption" style={[styles.resumeKicker, { color: colors.primary }]}>
          {t().createRecipe.resumeDraft}
        </ThemedText>
        <ThemedText variant="body" style={[styles.resumeName, { color: colors.text }]} numberOfLines={1}>
          {name}
        </ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={iconSizes.lg} color={colors.textMuted} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  resumeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm2,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
  },
  resumeIcon: {
    width: controlSizes.floatingBtn,
    height: controlSizes.floatingBtn,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeBody: {
    flex: ValueConstants.one,
  },
  resumeKicker: {
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.micro,
    letterSpacing: letterSpacings.wide,
    textTransform: 'uppercase',
  },
  resumeName: {
    fontWeight: fontWeights.semibold,
  },
});
