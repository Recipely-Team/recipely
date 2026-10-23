import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { IngredientRow } from '@presentation/app/create-recipe/items/ingredient-row';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import {
  spacing,
  radii,
  fontSizes,
  fontWeights,
  iconSizes,
  controlSizes,
  borderWidths,
} from '@presentation/base/theme';
import { useTextLineHeight } from '@presentation/base/theme/tokens/typography/use-text-line-height';
import { useTranslations } from '@presentation/i18n';
import type { IngredientGroup } from '@domain/recipes/ingredients/ingredient-group';
import { ValueConstants } from '@core/constants';
import { useStableKeys } from '@presentation/app/create-recipe/hooks/use-stable-keys';
import { GroupDeleteConfirm } from '@presentation/app/create-recipe/items/group-delete-confirm';

export interface IngredientGroupCardProps {
  group: IngredientGroup;
  onChangeItem: (index: number, value: string) => void;
  onRemoveItem: (index: number) => void;
  onMoveItem: (index: number, direction: number) => void;
  onAddItem: () => void;
  onRenameGroup: (label: string) => void;
  /** `keepItems` ungroups them; otherwise the whole card goes. */
  onDeleteGroup: (keepItems: boolean) => void;
}

const ACCENT_WIDTH = 3;

/**
 * One named part of a recipe — a syrup, a dough, a marinade — as its own card.
 *
 * @remarks
 * - **The card is the group.** A heading printed between rows of a single flat
 *   list gave no sense of where a part started or ended; a bordered card with
 *   its own title, count and "add ingredient" does, and it makes adding to the
 *   RIGHT group a matter of tapping inside it rather than adding to the end and
 *   dragging.
 * - **Deleting a group is two different intentions.** "I mis-grouped these" and
 *   "these ingredients are gone" are opposite, and a single destructive button
 *   forces the user to guess which one it means. The card asks, inline, and
 *   names both outcomes.
 */
export const IngredientGroupCard = ({
  group,
  onChangeItem,
  onRemoveItem,
  onMoveItem,
  onAddItem,
  onRenameGroup,
  onDeleteGroup,
}: IngredientGroupCardProps): React.JSX.Element => {
  const t = useTranslations();
  const colors = useTheme().colors;
  const copy = t.createRecipe;
  const [isConfirming, setConfirming] = useState(false);
  const titleLineHeight = useTextLineHeight(fontSizes.medium);
  const rowKeys = useStableKeys(group.items.map((item) => item.value));

  const rows = group.items.map((item, position) => (
    <IngredientRow
      key={rowKeys[position]}
      value={item.value}
      onChange={(next) => onChangeItem(item.index, next)}
      onRemove={() => onRemoveItem(item.index)}
      removeLabel={t.mediaPicker.remove}
      onMoveUp={position > ValueConstants.zero ? () => onMoveItem(item.index, ValueConstants.minusOne) : undefined}
      onMoveDown={
        position < group.items.length - ValueConstants.one
          ? () => onMoveItem(item.index, ValueConstants.one)
          : undefined
      }
    />
  ));

  const addButton = (
    <Pressable
      onPress={onAddItem}
      style={[styles.addItem, { borderColor: colors.primary }]}
      accessibilityRole="button"
      accessibilityLabel={copy.addIngredient}
    >
      <Ionicons name="add" size={iconSizes.md} color={colors.primary} />
      <ThemedText variant="caption" style={[styles.addItemLabel, { color: colors.primary }]}>
        {copy.addIngredient}
      </ThemedText>
    </Pressable>
  );

  // The ungrouped run is the plain, common case: no chrome, no heading.
  if (group.headerIndex === ValueConstants.minusOne) {
    return (
      <View>
        <View style={styles.rows}>{rows}</View>
        {addButton}
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={[styles.accent, { backgroundColor: colors.primary }]} />
        <TextInput
          value={group.label ?? undefined}
          onChangeText={onRenameGroup}
          placeholder={copy.groupPlaceholder}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={copy.groupPlaceholder}
          style={[styles.title, { color: colors.text, lineHeight: titleLineHeight }]}
        />
        <View style={[styles.count, { backgroundColor: colors.chipBackground }]}>
          <ThemedText variant="caption" style={[styles.countLabel, { color: colors.chipText }]}>
            {group.items.length}
          </ThemedText>
        </View>
        <Pressable
          onPress={() => setConfirming((isOpen) => !isOpen)}
          hitSlop={spacing.xs}
          style={styles.deleteBtn}
          accessibilityRole="button"
          accessibilityLabel={copy.deleteGroup}
        >
          <Ionicons
            name="trash-outline"
            size={iconSizes.md}
            color={isConfirming ? colors.danger : colors.textMuted}
          />
        </Pressable>
      </View>

      {isConfirming ? <GroupDeleteConfirm onDelete={onDeleteGroup} onCancel={() => setConfirming(false)} /> : null}

      <View style={styles.body}>
        {group.items.length === ValueConstants.zero ? (
          <View style={[styles.empty, { borderColor: colors.border }]}>
            <ThemedText variant="caption" style={[styles.emptyLabel, { color: colors.textMuted }]}>
              {copy.emptyGroup}
            </ThemedText>
          </View>
        ) : (
          <View style={styles.rows}>{rows}</View>
        )}
        {addButton}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: borderWidths.hairline,
  },
  accent: {
    width: ACCENT_WIDTH,
    alignSelf: 'stretch',
    minHeight: spacing.lg,
    borderRadius: radii.sm,
  },
  title: {
    flex: ValueConstants.one,
    fontSize: fontSizes.medium,
    fontWeight: fontWeights.bold,
  },
  count: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.round,
  },
  countLabel: {
    fontWeight: fontWeights.bold,
  },
  deleteBtn: {
    width: controlSizes.iconBtnSm,
    height: controlSizes.iconBtnSm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: spacing.sm,
    gap: spacing.xs,
  },
  rows: {
    gap: spacing.xxs,
  },
  empty: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
    borderStyle: 'dashed',
  },
  emptyLabel: {
    textAlign: 'center',
  },
  addItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: controlSizes.chip,
    marginTop: spacing.xs,
    borderRadius: radii.lg,
    borderWidth: borderWidths.thin,
    borderStyle: 'dashed',
  },
  addItemLabel: {
    fontWeight: fontWeights.semibold,
  },
});
