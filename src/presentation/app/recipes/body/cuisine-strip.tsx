import { useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Platform } from 'react-native';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, avatarSizes, borderWidths } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { useTaxonomyLabel } from '@presentation/base/taxonomy/use-taxonomy-label';
import { useTaxonomyOptions } from '@presentation/app/recipes/hooks/use-taxonomy-options';
import { ValueConstants } from '@core/constants';

export interface CuisineStripProps {
  selectedCuisines: string[];
  onToggle: (cuisine: string) => void;
}

/**
 * Single-row horizontal quick-filter strip showing the full backend cuisine
 * catalog (with a local enum fallback before the taxonomy store is `ready`).
 * On native it scrolls by touch; on web a horizontal `ScrollView` ignores the
 * vertical mouse wheel, so we translate vertical wheel delta into horizontal
 * scrolling on the underlying DOM node. Each chip's name + emoji is resolved
 * through {@link useTaxonomyLabel}, so the display comes from the backend
 * taxonomy (localized) with a local fallback.
 */
export const CuisineStrip = ({ selectedCuisines, onToggle }: CuisineStripProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const { cuisineLabel } = useTaxonomyLabel();
  const { cuisineKeys } = useTaxonomyOptions();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = scrollRef.current?.getScrollableNode() as unknown as HTMLElement | undefined;
    if (!node) return;
    const onWheel = (event: WheelEvent): void => {
      if (event.deltaY === ValueConstants.zero) return;
      event.preventDefault();
      node.scrollLeft += event.deltaY;
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, []);

  const chips = cuisineKeys.map((cuisine) => {
    const active = selectedCuisines.includes(cuisine);
    const { name, emoji } = cuisineLabel(cuisine);
    return (
      <Pressable
        key={cuisine}
        onPress={() => onToggle(cuisine)}
        accessibilityRole="button"
        accessibilityLabel={name}
        style={styles.item}
      >
        <View
          style={[
            styles.circle,
            {
              backgroundColor: active ? colors.primary : colors.surface,
              borderColor: active ? colors.primary : colors.border,
            },
          ]}
        >
          <ThemedText style={styles.emoji}>{emoji}</ThemedText>
        </View>
        <ThemedText
          variant="caption"
          style={[styles.label, { color: active ? colors.primary : colors.textMuted }]}
          numberOfLines={1}
        >
          {name}
        </ThemedText>
      </Pressable>
    );
  });

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedText variant="body" style={styles.sectionTitle}>
          {t().recipes.browseCuisines}
        </ThemedText>
      </View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {chips}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontWeight: fontWeights.bold,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  item: {
    alignItems: 'center',
    gap: spacing.xs,
    width: avatarSizes.lg,
  },
  circle: {
    width: avatarSizes.lg,
    height: avatarSizes.lg,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: borderWidths.thin,
  },
  emoji: {
    fontSize: fontSizes.subheading,
  },
  label: {
    fontSize: fontSizes.micro,
    textAlign: 'center',
    fontWeight: fontWeights.medium,
  },
});
