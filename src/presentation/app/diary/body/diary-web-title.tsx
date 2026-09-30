import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { borderWidths, controlSizes, diarySizes, fontSizes, fontWeights, iconSizes, opacities, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface DiaryWebTitleProps {
  onOpenGoals: () => void;
}

/** The web page heading: "Diary" and a ghost "Daily goals" button. The site header carries the bell. */
export const DiaryWebTitle = ({ onOpenGoals }: DiaryWebTitleProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const strings = t().diary;
  return (
    <View style={styles.row}>
      <SizedText accessibilityRole="header" size={diarySizes.pageTitleWeb} weight={fontWeights.heavy} style={styles.title}>
        {strings.title}
      </SizedText>
      <Pressable
        onPress={onOpenGoals}
        accessibilityRole="button"
        style={({ pressed }) => [styles.ghost, { borderColor: colors.cardBorder, opacity: pressed ? opacities.pressedSubtle : opacities.full }]}
      >
        <Ionicons name="locate-outline" size={iconSizes.md} color={colors.text} />
        <SizedText size={fontSizes.medium} weight={fontWeights.semibold}>
          {strings.dailyGoals}
        </SizedText>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { flex: ValueConstants.one },
  ghost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs2,
    minHeight: controlSizes.floatingBtn,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
  },
});
