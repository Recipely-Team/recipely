import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { spacing, radii, fontSizes, fontWeights, iconSizes, controlSizes, layoutSizes, borderWidths, zIndices } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { sortKeyLabels } from '@presentation/app/recipes/model/recipe-sort';
import type { SortKey } from '@presentation/app/recipes/model/sort-key';
import { ValueConstants } from '@core/constants';

/** DOM id of the anchor wrapper, used to scope the web outside-press check. */
const ANCHOR_ID = 'web-sort-menu-anchor';

export interface WebSortMenuProps {
  /** Currently applied sort key — drives the trigger label and the checkmark. */
  current: SortKey;
  /** Selects a sort option; the parent applies it and reloads the list. */
  onChange: (key: SortKey) => void;
}

/**
 * Web-only sort control: a trigger button with an inline dropdown popover
 * anchored to its right edge. Owns its own open/close state and closes on
 * selection, an outside press, or the Escape key. Selection is delegated to
 * `onChange`, which the parent uses to apply the sort and reload.
 */
export const WebSortMenu = ({ current, onChange }: WebSortMenuProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const labels = sortKeyLabels();
  const [open, setOpen] = useState(false);

  // Outside-press + Escape close on web. The popover only renders on the web
  // shell, so the native branch is a no-op (document is unavailable there).
  // The anchor's DOM id (RN-web maps `nativeID` → `id`) scopes the outside
  // check without reaching into the View's host node.
  useEffect(() => {
    if (!open || Platform.OS !== 'web') return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onMouseDown = (event: MouseEvent): void => {
      const anchor = document.getElementById(ANCHOR_ID);
      if (anchor && event.target instanceof Node && !anchor.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [open]);

  const select = (key: SortKey): void => {
    setOpen(false);
    onChange(key);
  };

  return (
    <View nativeID={ANCHOR_ID} style={styles.anchor}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={t().recipes.sortBy}
        style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
      >
        <Ionicons name="swap-vertical" size={iconSizes.md} color={colors.textMuted} />
        <ThemedText style={[styles.muted, { color: colors.textMuted }]}>
          {t().recipes.sortBy}:
        </ThemedText>
        <ThemedText style={[styles.value, { color: colors.text }]}>
          {labels[current]}
        </ThemedText>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={iconSizes.md}
          color={colors.textMuted}
        />
      </Pressable>

      {open ? (
        <View
          style={[
            styles.menu,
            shadows.lg,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          {(Object.keys(labels) as SortKey[]).map((key) => {
            const selected = current === key;
            return (
              <Pressable
                key={key}
                onPress={() => select(key)}
                accessibilityRole="menuitem"
                accessibilityState={{ selected }}
                accessibilityLabel={labels[key]}
                style={[
                  styles.option,
                  selected ? { backgroundColor: colors.chipBackground } : null,
                ]}
              >
                <ThemedText
                  style={[
                    styles.optionLabel,
                    {
                      color: selected ? colors.chipText : colors.text,
                      fontWeight: selected ? '700' : '500',
                    },
                  ]}
                >
                  {labels[key]}
                </ThemedText>
                {selected ? (
                  <Ionicons name="checkmark" size={iconSizes.md} color={colors.primary} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  anchor: {
    position: 'relative',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: controlSizes.webSortBtn,
    paddingHorizontal: spacing.md,
    borderWidth: borderWidths.hairline,
    borderRadius: radii.lg,
  },
  muted: {
    fontSize: fontSizes.caption,
  },
  value: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
  },
  menu: {
    position: 'absolute',
    top: '100%',
    right: ValueConstants.zero,
    marginTop: spacing.sm,
    minWidth: layoutSizes.webSortMenuMinWidth,
    padding: spacing.xs2,
    borderWidth: borderWidths.hairline,
    borderRadius: radii.xl,
    zIndex: zIndices.raised,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm2,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  optionLabel: {
    fontSize: fontSizes.caption,
  },
});
