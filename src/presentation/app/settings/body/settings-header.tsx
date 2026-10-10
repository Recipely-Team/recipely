import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, iconSizes, controlSizes } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';


/** Grows the 36 pt round button to the 44 pt minimum touch target. */
const TARGET_SLOP = (controlSizes.touchTarget - controlSizes.iconBtn) / ValueConstants.two;
export interface SettingsHeaderProps {
  onBack: () => void;
}

/** The settings title bar: back button, centred title, and a spacer that keeps the title centred. */
export const SettingsHeader = ({ onBack }: SettingsHeaderProps): React.JSX.Element => {
  const { colors } = useTheme();
  return (
    <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <Pressable
        onPress={onBack}
        hitSlop={TARGET_SLOP}
        style={[styles.backBtn, { backgroundColor: colors.surface }]}
        accessibilityRole="button"
        accessibilityLabel={t().navigation.settings}
      >
        <Ionicons name="chevron-back" size={iconSizes.xl} color={colors.text} />
      </Pressable>
      <ThemedText variant="subtitle" style={styles.headerTitle}>
        {t().settings.title}
      </ThemedText>
      <View style={styles.headerSpacer} />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: controlSizes.iconBtn,
    height: controlSizes.iconBtn,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: ValueConstants.one,
    textAlign: 'center',
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.heading,
  },
  headerSpacer: {
    width: controlSizes.iconBtn,
  },
});
