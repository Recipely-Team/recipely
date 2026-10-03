import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { DmRuleEntity } from "@domain/instagram/dm/dm-rule-entity";
import { ValueConstants } from "@core/constants";
import { useTheme } from "@presentation/base/theme/context/use-theme";
import { useLayout } from "@presentation/base/responsive/use-layout";
import { SizedText } from "@presentation/base/widgets/text/sized-text";
import { AutomationMetrics } from "@presentation/base/widgets/instagram/automation-metrics";
import { formatWholeNumber } from "@presentation/base/utils/diary/format-whole-number";
import { RuleThumb } from "@presentation/app/automations/shared/items/rule-thumb";
import { KeywordChips } from "@presentation/app/automations/shared/items/keyword-chips";
import { AutomationSwitch } from "@presentation/app/automations/shared/items/automation-switch";
import { ruleMeta } from "@presentation/app/automations/shared/model/rule-meta";
import {
  borderWidths,
  controlSizes,
  fontSizes,
  fontWeights,
  iconSizes,
  opacities,
  radii,
  spacing,
} from "@presentation/base/theme";
import { t, useLocale } from "@presentation/i18n";

export interface RuleCardProps {
  rule: DmRuleEntity;
  /** The connection expired: the switch is disabled and the meta says Paused. */
  isPaused: boolean;
  onOpen: (rule: DmRuleEntity) => void;
  onToggle: (rule: DmRuleEntity, enabled: boolean) => void;
  onDelete: (rule: DmRuleEntity) => void;
}

/** One automation (spec §2 → Rule card): the post, its keywords, the recipe, "124 sent · Off", and its switch. Tap opens Activity. */
export const RuleCard = ({
  rule,
  isPaused,
  onOpen,
  onToggle,
  onDelete,
}: RuleCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const locale = useLocale();
  const { isExpanded } = useLayout();
  return (
    <Pressable
      onPress={() => onOpen(rule)}
      accessibilityRole="button"
      accessibilityLabel={[
        rule.recipe?.name ?? rule.media.caption,
        ...rule.keywords,
      ]
        .filter((part) => part !== null)
        .join(", ")}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.cardBorder,
          opacity: pressed ? opacities.pressedSubtle : opacities.full,
        },
      ]}
    >
      <RuleThumb
        uri={rule.media.thumbnailUrl}
        size={
          isExpanded
            ? AutomationMetrics.ruleThumbWeb
            : AutomationMetrics.ruleThumb
        }
      />
      <View style={styles.body}>
        <KeywordChips
          keywords={rule.keywords}
          limit={AutomationMetrics.keywordsShown}
        />
        <View style={styles.recipe}>
          <Ionicons
            name="restaurant-outline"
            size={iconSizes.sm}
            color={colors.textSubtle}
          />
          <SizedText
            size={fontSizes.medium}
            weight={fontWeights.bold}
            numberOfLines={ValueConstants.one}
            style={styles.name}
          >
            {rule.recipe?.name ?? rule.media.caption ?? rule.recipeId}
          </SizedText>
        </View>
        <SizedText
          size={fontSizes.small}
          color={isPaused ? colors.danger : colors.textSubtle}
          numberOfLines={ValueConstants.one}
        >
          {ruleMeta(rule, isPaused, (n) => formatWholeNumber(n, locale))}
        </SizedText>
      </View>
      <View style={styles.actions}>
        <AutomationSwitch
          value={rule.enabled}
          disabled={isPaused}
          onChange={(enabled) => onToggle(rule, enabled)}
        />
        <Pressable
          onPress={() => onDelete(rule)}
          accessibilityRole="button"
          accessibilityLabel={t().instagram.deleteRule}
          hitSlop={spacing.sm}
          style={({ pressed }) => [
            styles.delete,
            {
              backgroundColor: colors.chipBackground,
              opacity: pressed ? opacities.pressedSubtle : opacities.full,
            },
          ]}
        >
          <Ionicons
            name="trash-outline"
            size={iconSizes.sm}
            color={colors.danger}
          />
        </Pressable>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
  },
  body: {
    flex: ValueConstants.one,
    minWidth: ValueConstants.zero,
    gap: spacing.xs,
  },
  recipe: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  name: { flexShrink: ValueConstants.one },
  actions: { alignItems: "center", gap: spacing.sm },
  delete: {
    width: controlSizes.iconBtnSm,
    height: controlSizes.iconBtnSm,
    borderRadius: radii.round,
    alignItems: "center",
    justifyContent: "center",
  },
});
