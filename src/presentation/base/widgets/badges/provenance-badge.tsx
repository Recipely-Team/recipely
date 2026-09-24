import { Linking, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecipeOrigin, type RecipeOriginType } from '@domain/recipes/recipe-origin';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { HoverTooltip } from '@presentation/base/widgets/tooltip/hover-tooltip';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { instagramProfileUrl } from '@presentation/base/constants';
import {
  ProvenanceBadgeVariant,
  type ProvenanceBadgeVariantType,
} from '@presentation/base/widgets/badges/provenance-badge-variant';
import { spacing, radii, fontSizes, fontWeights, iconSizes } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

/** The `{handle}` slot the import copy leaves for the account name. */
const HANDLE_SLOT = '{handle}';
/** Handles are shown the way Instagram writes them, not the way we store them. */
const HANDLE_PREFIX = '@';

export interface ProvenanceBadgeProps {
  origin: RecipeOriginType;
  variant: ProvenanceBadgeVariantType;
  /** The account an imported recipe was lifted from. Absent on feed cards. */
  sourceHandle?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Says where a recipe's text came from — and says nothing at all when a person wrote it.
 *
 * @remarks
 * - **Nothing for `User`, before reading any other prop**, the way `CountBadge`
 *   draws nothing at zero. The ordinary case is most recipes, and a marker on
 *   every one of them is noise rather than provenance.
 * - **The compact variant cannot name the account.** The list endpoint sends
 *   `origin` and not `sourceHandle`, so the accessible name there says
 *   "Imported from Instagram" and stops — honest about what a card knows.
 * - **The handle is a nested `Text`, not a `Pressable`.** It sits inside a
 *   sentence, and a `Pressable` cannot be nested in `Text` without breaking the
 *   inline flow. That also means no `hitSlop` — a bounded exception to the
 *   44x44 floor that WCAG 2.5.5 grants any link inline within a run of text,
 *   the same one every hyperlink in a paragraph relies on.
 * - **The tooltip deliberately does not cover the handle.** That segment
 *   already carries its own affordance; a second hover behaviour on it, for a
 *   different purpose, is one element doing two jobs badly.
 */
export const ProvenanceBadge = ({
  origin,
  variant,
  sourceHandle,
  style,
}: ProvenanceBadgeProps): React.JSX.Element | null => {
  const colors = useTheme().colors;

  if (origin === RecipeOrigin.User) return null;

  const isAi = origin === RecipeOrigin.Ai;
  const compact = variant === ProvenanceBadgeVariant.Compact;

  if (compact) {
    return (
      <HoverTooltip
        label={isAi ? t().recipes.originAiTooltip : t().recipes.originImportTooltip}
        accessibilityLabel={isAi ? t().recipes.originAiA11y : t().recipes.originImportA11y}
      >
        <Ionicons
          name={isAi ? 'sparkles' : 'logo-instagram'}
          size={iconSizes.sm}
          color={isAi ? colors.chipText : colors.text}
        />
      </HoverTooltip>
    );
  }

  if (isAi) {
    return (
      <View style={style}>
        <HoverTooltip
          label={t().recipes.originAiTooltip}
          accessibilityLabel={t().recipes.originAiA11y}
        >
          <View style={[styles.aiPill, { backgroundColor: colors.chipBackground }]}>
            <Ionicons name="sparkles" size={iconSizes.xs} color={colors.chipText} />
            <ThemedText style={[styles.aiLabel, { color: colors.chipText }]}>
              {t().recipes.originAiDetailLabel}
            </ThemedText>
          </View>
        </HoverTooltip>
      </View>
    );
  }

  // An import with no handle still says it was imported. `@undefined` would be
  // worse than the missing half of a sentence.
  const [before, after] =
    sourceHandle === undefined
      ? [t().recipes.originImportA11y, '']
      : t().recipes.originImportDetailLabel.split(HANDLE_SLOT);
  const shownHandle = `${HANDLE_PREFIX}${sourceHandle ?? ''}`;

  return (
    <View style={[styles.importRow, style]}>
      <HoverTooltip
        label={t().recipes.originImportTooltip}
        accessibilityLabel={t().recipes.originImportA11y}
      >
        <Ionicons name="logo-instagram" size={iconSizes.md} color={colors.text} />
      </HoverTooltip>

      <ThemedText style={[styles.importText, { color: colors.text }]}>
        {before}
        {sourceHandle !== undefined ? (
          <Text
            accessibilityRole="link"
            accessibilityLabel={t().recipes.originImportHandleA11y.replace(
              HANDLE_SLOT,
              shownHandle,
            )}
            onPress={() => void Linking.openURL(instagramProfileUrl(sourceHandle)).catch(() => undefined)}
            style={[styles.handle, { color: colors.chipText }]}
          >
            {shownHandle}
          </Text>
        ) : null}
        {after}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  aiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xxs,
    borderRadius: radii.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  aiLabel: { fontSize: fontSizes.micro, fontWeight: fontWeights.bold },
  importRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  // No `numberOfLines`: the sentence is the whole point of the badge, so it
  // wraps on a narrow phone rather than truncating the fact it exists to state.
  importText: { fontSize: fontSizes.caption, flexShrink: 1 },
  handle: { fontWeight: fontWeights.semibold, textDecorationLine: 'underline' },
});
