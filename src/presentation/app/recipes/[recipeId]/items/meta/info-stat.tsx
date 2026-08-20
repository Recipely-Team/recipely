import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, iconSizes, controlSizes } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

interface InfoStatProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}

export const InfoStat = ({ icon, value, label }: InfoStatProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View style={styles.stat}>
      <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
        <Ionicons name={icon} size={iconSizes.lg} color={colors.primary} />
      </View>
      <ThemedText style={[styles.statValue, { color: colors.text }]} numberOfLines={ValueConstants.one}>
        {value}
      </ThemedText>
      <ThemedText variant="label" muted style={styles.statLabel} numberOfLines={ValueConstants.one}>
        {label}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  stat: {
    flex: ValueConstants.one,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  badge: {
    width: controlSizes.iconBtn,
    height: controlSizes.iconBtn,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.bold,
  },
  statLabel: {
    fontSize: fontSizes.micro,
    textAlign: 'center',
  },
});
