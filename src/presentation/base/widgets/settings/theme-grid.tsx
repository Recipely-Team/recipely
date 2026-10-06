import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ThemeVariant } from '@presentation/base/theme/context/theme-variant';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { ALL_THEMES, getThemeDefinition } from '@presentation/base/theme/colors/palette/themes';
import type { ThemeIdType } from '@presentation/base/theme/context/theme-id';
import {
  spacing,
  radii,
  fontSizes,
  fontWeights,
  iconSizes,
  borderWidths,
  opacities,
  lineHeights,
  lineHeightFor,
} from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface ThemeGridProps {
  selectedThemeId: ThemeIdType;
  onSelect: (themeId: ThemeIdType) => void;
}

const CHIP_WIDTH = 76;
const SWATCH_SIZE = 56;
/** Reserve exactly this many lines of label height so switching between a short
 * (English) and long (Turkish, or any other locale) theme name never shifts the
 * section below the grid. The same count drives `numberOfLines` on the label. */
const LABEL_LINE_COUNT = ValueConstants.two;
const LABEL_LINE_HEIGHT = lineHeightFor(fontSizes.micro, lineHeights.snug);
const LABEL_MIN_HEIGHT = LABEL_LINE_HEIGHT * LABEL_LINE_COUNT;

/** Horizontal scrollable grid of colour-swatch chips for selecting the active theme. */
export const ThemeGrid = ({
  selectedThemeId,
  onSelect,
}: ThemeGridProps): React.JSX.Element => {
  const { scheme, colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {ALL_THEMES.map((id) => {
        const def = getThemeDefinition(id);
        const variant = scheme === ThemeVariant.Dark ? def.dark : def.light;
        const isActive = id === selectedThemeId;
        const label = t().settings.themeNames[id];

        return (
          <Pressable
            key={id}
            accessibilityRole="radio"
            accessibilityLabel={label}
            accessibilityState={{ selected: isActive, checked: isActive }}
            onPress={() => onSelect(id)}
            style={({ pressed }) => [
              styles.chip,
              { opacity: pressed ? opacities.pressedStrong : opacities.full },
            ]}
          >
            <View>
              <LinearGradient
                colors={[variant.primaryGradientStart, variant.primaryGradientEnd]}
                start={{ x: ValueConstants.zero, y: ValueConstants.zero }}
                end={{ x: ValueConstants.one, y: ValueConstants.one }}
                style={[
                  styles.swatch,
                  {
                    borderColor: isActive ? colors.primary : variant.cardBorder,
                    borderWidth: isActive ? borderWidths.thick : borderWidths.hairline,
                  },
                ]}
              />
              {isActive ? (
                <View
                  style={[
                    styles.checkBadge,
                    {
                      backgroundColor: colors.primary,
                      borderColor: colors.background,
                    },
                  ]}
                >
                  <Ionicons name="checkmark" size={iconSizes.xs} color={colors.primaryText} />
                </View>
              ) : null}
            </View>
            <ThemedText
              variant="caption"
              numberOfLines={LABEL_LINE_COUNT}
              style={[
                styles.label,
                { color: isActive ? colors.primary : colors.textMuted },
                isActive ? styles.labelActive : null,
              ]}
            >
              {label}
            </ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  chip: {
    width: CHIP_WIDTH,
    alignItems: 'center',
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: SWATCH_SIZE / ValueConstants.two,
    overflow: 'hidden',
  },
  checkBadge: {
    position: 'absolute',
    bottom: -borderWidths.medium,
    right: -borderWidths.medium,
    width: iconSizes.xl,
    height: iconSizes.xl,
    borderRadius: radii.round,
    borderWidth: borderWidths.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: spacing.sm,
    fontSize: fontSizes.micro,
    textAlign: 'center',
    lineHeight: LABEL_LINE_HEIGHT,
    minHeight: LABEL_MIN_HEIGHT,
  },
  labelActive: {
    fontWeight: fontWeights.bold,
  },
});
