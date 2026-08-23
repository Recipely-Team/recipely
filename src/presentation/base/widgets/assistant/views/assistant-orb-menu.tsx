import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AssistantOrbMenuItem } from '@presentation/base/widgets/assistant/views/assistant-orb-menu-item';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { assistantMetrics } from '@presentation/base/widgets/assistant/assistant-metrics';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, controlSizes, fontWeights, iconSizes, radii, spacing } from '@presentation/base/theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { ValueConstants } from '@core/constants';

export interface AssistantOrbMenuProps {
  items: readonly AssistantOrbMenuItem[];
}

/**
 * What the orb offers when it is tapped.
 *
 * @remarks
 * - **Labelled, not iconographic.** Three unlabelled circles around a sphere
 *   are a puzzle; the words cost a few pixels on a surface that has the room.
 * - **Stacked upward from the orb**, so the thumb that opened it does not
 *   cover what it opened.
 * - **The end control is the only red one.** It is the one choice here that
 *   cannot be undone by tapping again.
 */
export const AssistantOrbMenu = ({ items }: AssistantOrbMenuProps): React.JSX.Element => {
  const { colors } = useTheme();

  return (
    <View style={styles.stack}>
      {items.map((item) => (
        <Pressable
          key={item.key}
          onPress={item.onPress}
          accessibilityRole="button"
          accessibilityLabel={item.label}
          style={[
            styles.pill,
            shadows.md,
            {
              backgroundColor: item.isOn === true ? colors.primary : colors.cardBackground,
              borderColor: item.isOn === true ? colors.primary : colors.cardBorder,
            },
          ]}
        >
          <ThemedText
            variant="caption"
            style={[
              styles.label,
              item.isDanger === true
                ? { color: colors.danger }
                : item.isOn === true
                  ? { color: colors.primaryText }
                  : undefined,
            ]}
          >
            {item.label}
          </ThemedText>
          <View
            style={[
              styles.icon,
              { backgroundColor: item.isOn === true ? colors.primaryLight : colors.surface },
            ]}
          >
            <Ionicons
              name={item.icon}
              size={iconSizes.xs}
              color={item.isDanger === true ? colors.danger : colors.text}
            />
          </View>
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  // Bottom-up: the first item sits nearest the orb, where the thumb already is.
  stack: { alignItems: 'flex-end', gap: spacing.sm, flexDirection: 'column-reverse' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: assistantMetrics.menuPillHeight,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
  },
  label: { fontWeight: fontWeights.bold },
  // Pinned: a circle, not a text box.
  icon: {
    width: controlSizes.checkboxSm,
    height: controlSizes.checkboxSm,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: ValueConstants.zero,
  },
});
