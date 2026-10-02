import { StyleSheet, Text, View } from 'react-native';
import { CreatorPlatform } from '@domain/creators/creator-platform';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { RecipeImage } from '@presentation/base/widgets/media/recipe-image';
import { CreatorPlatformMark } from '@presentation/base/widgets/creators/creator-platform-mark';
import { AutomationMetrics } from '@presentation/base/widgets/instagram/automation-metrics';
import { upperCase } from '@presentation/i18n/upper-case';
import { dmPreviewParts } from '@presentation/app/automations/edit/model/dm-preview-parts';
import { borderWidths, fontSizes, fontWeights, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface DmPreviewProps {
  handle: string;
  dmText: string;
  recipeName: string | null;
  recipeImage: string | null;
  /** The public reply when it is on; null when off. */
  publicReply: string | null;
}

/**
 * How the private reply will look (spec step 4 → Preview): the comment it
 * answers, the DM bubble with `{name}` and `{link}` filled in, the recipe
 * card under it, and the public reply below a dashed rule.
 */
export const DmPreview = ({ handle, dmText, recipeName, recipeImage, publicReply }: DmPreviewProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const copy = t().instagram;
  const parts = dmPreviewParts(dmText, copy.previewName, copy.previewLink);
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
      <View style={styles.header}>
        <SizedText size={fontSizes.micro} weight={fontWeights.bold} muted>
          {upperCase(copy.preview)}
        </SizedText>
        <CreatorPlatformMark platform={CreatorPlatform.Instagram} size={AutomationMetrics.previewAvatar} />
        <SizedText size={fontSizes.small} weight={fontWeights.bold}>
          {handle}
        </SizedText>
      </View>
      <SizedText size={fontSizes.small} color={colors.textSubtle}>
        {copy.previewContext.replace('{c}', copy.previewComment)}
      </SizedText>
      <View style={[styles.bubble, { backgroundColor: colors.primary }]}>
        <SizedText size={fontSizes.caption} color={colors.primaryText}>
          {parts.map((part, index) => (
            <Text key={`${index}:${part.text}`} style={part.isLink ? styles.link : null}>
              {part.text}
            </Text>
          ))}
        </SizedText>
      </View>
      {recipeName === null ? null : (
        <View style={[styles.recipe, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
          <View style={styles.recipeImage}>
            <RecipeImage uri={recipeImage} placeholderCompact style={StyleSheet.absoluteFill} />
          </View>
          <View style={styles.recipeText}>
            <SizedText size={fontSizes.caption} weight={fontWeights.bold} numberOfLines={ValueConstants.two}>
              {recipeName}
            </SizedText>
            <SizedText size={fontSizes.micro} color={colors.textSubtle} numberOfLines={ValueConstants.one}>
              {copy.previewLink}
            </SizedText>
          </View>
        </View>
      )}
      {publicReply === null ? null : (
        <View style={[styles.reply, { borderTopColor: colors.border }]}>
          <SizedText size={fontSizes.small} color={colors.textSubtle}>
            {copy.replyLabel}
          </SizedText>
          <SizedText size={fontSizes.caption}>{publicReply}</SizedText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { gap: spacing.md, padding: spacing.md, borderRadius: radii.xl, borderWidth: borderWidths.hairline },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bubble: {
    alignSelf: 'flex-end',
    maxWidth: AutomationMetrics.bubbleMaxShare,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopLeftRadius: AutomationMetrics.bubbleRadius,
    borderTopRightRadius: AutomationMetrics.bubbleRadius,
    borderBottomLeftRadius: AutomationMetrics.bubbleRadius,
    borderBottomRightRadius: AutomationMetrics.bubbleTail,
  },
  link: { textDecorationLine: 'underline' },
  recipe: { alignSelf: 'flex-end', width: AutomationMetrics.previewCardWidth, borderRadius: radii.lg, borderWidth: borderWidths.hairline, overflow: 'hidden' },
  recipeImage: { aspectRatio: ValueConstants.two },
  recipeText: { padding: spacing.sm, gap: spacing.xxs },
  reply: { borderTopWidth: borderWidths.hairline, borderStyle: 'dashed', paddingTop: spacing.sm, gap: spacing.xxs },
});
