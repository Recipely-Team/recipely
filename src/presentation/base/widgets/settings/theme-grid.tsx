import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { ALL_THEMES, getThemeDefinition } from '@presentation/base/theme/colors/palette/themes';
import type { ThemeId } from '@presentation/base/theme/context/theme-id';
import { spacing, radii, fontSizes, fontWeights, iconSizes, borderWidths } from '@presentation/base/theme';
import { getLocale } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface ThemeGridProps {
  selectedThemeId: ThemeId;
  onSelect: (themeId: ThemeId) => void;
}

const CHIP_WIDTH = 76;
const SWATCH_SIZE = 56;
const LABEL_LINE_HEIGHT = 13;
/** Reserve exactly two lines of label height so switching between a short
 * (English) and long (Turkish, or any other locale) theme name never shifts
 * the section below the grid — see `numberOfLines={2}` on the label below. */
const LABEL_MIN_HEIGHT = LABEL_LINE_HEIGHT * 2;

/** Horizontal scrollable grid of colour-swatch chips for selecting the active theme. */
export const ThemeGrid = ({
  selectedThemeId,
  onSelect,
}: ThemeGridProps): React.JSX.Element => {
  const { scheme, colors } = useTheme();
  const lang = getLocale() === 'tr' ? 'tr' : 'en';

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {ALL_THEMES.map((id) => {
        const def = getThemeDefinition(id);
        const variant = scheme === 'dark' ? def.dark : def.light;
        const isActive = id === selectedThemeId;
        const label = lang === 'tr' ? def.nameTr : def.name;

        return (
          <Pressable
            key={id}
            onPress={() => onSelect(id)}
            style={({ pressed }) => [styles.chip, { opacity: pressed ? 0.7 : 1 }]}
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
                    borderWidth: isActive ? 2.5 : 1,
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
                  <Ionicons name="checkmark" size={12} color={colors.primaryText} />
                </View>
              ) : null}
            </View>
            <ThemedText
              variant="caption"
              numberOfLines={2}
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
    borderRadius: SWATCH_SIZE / 2,
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
