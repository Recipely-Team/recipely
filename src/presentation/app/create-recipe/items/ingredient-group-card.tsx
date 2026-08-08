import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
import { t } from '@presentation/i18n';
import type { IngredientGroup } from '@presentation/app/create-recipe/model/ingredients/ingredient-group';
import { ValueConstants } from '@core/constants';

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
  const colors = useTheme().colors;
  const copy = t().createRecipe;
  const [confirming, setConfirming] = useState(false);
  const titleLineHeight = useTextLineHeight(fontSizes.medium);

  const rows = group.items.map((item, position) => (
    <IngredientRow
      key={item.index}
      value={item.value}
      onChange={(next) => onChangeItem(item.index, next)}
      onRemove={() => onRemoveItem(item.index)}
      removeLabel={t().mediaPicker.remove}
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
          onPress={() => setConfirming((open) => !open)}
          hitSlop={spacing.xs}
          style={styles.deleteBtn}
          accessibilityRole="button"
          accessibilityLabel={copy.deleteGroup}
        >
          <Ionicons
            name="trash-outline"
            size={iconSizes.md}
            color={confirming ? colors.danger : colors.textMuted}
          />
        </Pressable>
      </View>

      {confirming ? (
        <View style={[styles.confirm, { borderBottomColor: colors.border }]}>
          <ThemedText variant="caption" style={styles.confirmTitle}>
            {copy.deleteQuestion}
          </ThemedText>
          <Pressable
            onPress={() => onDeleteGroup(true)}
            style={[styles.choice, { borderColor: colors.cardBorder, backgroundColor: colors.background }]}
            accessibilityRole="button"
            accessibilityLabel={copy.keepItems}
          >
            <Ionicons name="list-outline" size={iconSizes.md} color={colors.primary} />
            <View style={styles.choiceBody}>
              <ThemedText variant="caption" style={styles.choiceLabel}>
                {copy.keepItems}
              </ThemedText>
              <ThemedText variant="caption" style={{ color: colors.textMuted }}>
                {copy.keepItemsHint}
              </ThemedText>
            </View>
          </Pressable>
          <Pressable
            onPress={() => onDeleteGroup(false)}
            style={[styles.choice, { borderColor: colors.cardBorder, backgroundColor: colors.background }]}
            accessibilityRole="button"
            accessibilityLabel={copy.deleteAll}
          >
            <Ionicons name="trash-outline" size={iconSizes.md} color={colors.danger} />
            <ThemedText variant="caption" style={[styles.choiceBody, styles.choiceLabel, { color: colors.danger }]}>
              {copy.deleteAll}
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setConfirming(false)}
            style={styles.cancel}
            accessibilityRole="button"
            accessibilityLabel={t().common.cancel}
          >
            <ThemedText variant="caption" style={{ color: colors.textMuted }}>
              {t().common.cancel}
            </ThemedText>
          </Pressable>
        </View>
      ) : null}

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
  confirm: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: borderWidths.hairline,
  },
  confirmTitle: {
    fontWeight: fontWeights.bold,
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: controlSizes.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
  },
  choiceBody: {
    flex: ValueConstants.one,
  },
  choiceLabel: {
    fontWeight: fontWeights.semibold,
  },
  cancel: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: controlSizes.chip,
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
