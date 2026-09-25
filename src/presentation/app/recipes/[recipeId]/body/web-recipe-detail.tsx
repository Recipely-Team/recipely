import { useState } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { InstructionCard } from '@presentation/app/recipes/[recipeId]/items/steps/instruction-card';
import { WebRecipeDetailHeader } from '@presentation/app/recipes/[recipeId]/body/web-recipe-detail-header';
import { WebRecipeDetailSidebar } from '@presentation/app/recipes/[recipeId]/body/web-recipe-detail-sidebar';
import { WebRecipeDetailComments } from '@presentation/app/recipes/[recipeId]/body/web-recipe-detail-comments';
import type { RecipeAuthorState } from '@presentation/app/recipes/[recipeId]/model/author/recipe-author-state';
import type { UseCommentHighlightResult } from '@presentation/app/recipes/[recipeId]/model/comments/use-comment-highlight-result';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { useBackLabel } from '@presentation/app/recipes/[recipeId]/hooks/use-back-label';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, fontSizes, fontWeights, letterSpacings, iconSizes, layoutSizes } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import type { MediaItem } from '@domain/recipes/media/media-item';
import type { RecipeCommentsState } from '@application/comments/list/recipe-comments-state';
import { ValueConstants } from '@core/constants';
import type { GalleryOwnerControls } from '@presentation/app/recipes/[recipeId]/model/gallery-owner-controls';
import { WebRecipeDetailHero } from '@presentation/app/recipes/[recipeId]/body/web-recipe-detail-hero';

/**
 * Weight of the reading column against the side column beside it.
 *
 * A ratio rather than two widths: rule 6b2 — the row declares its split in
 * flex weights and lets every height follow, so the two columns cannot
 * disagree about where the fold is.
 */
const MAIN_COLUMN_WEIGHT = 1.7;

export interface WebRecipeDetailProps {
  recipe: RecipeEntity;
  media: readonly MediaItem[];
  isOwner: boolean;
  /**
   * The owner's photo controls, when the viewer is the owner. Named the same as
   * the mobile layout's, because it is the same thing handed to a second
   * surface — `index.tsx` passes one object to whichever layout renders.
   */
  photos?: GalleryOwnerControls;
  authorState: RecipeAuthorState;
  liked: boolean;
  likeCount: number;
  /** The backend is still computing nutrition; the empty state says so. */
  isNutritionCalculating: boolean;
  userId: string | null;
  isSaved: boolean;
  saveDisabled: boolean;
  onBack: () => void;
  onToggleLike: () => void;
  onToggleSave: () => void;
  onCopyToDraft: () => void;
  onDelete: () => void;
  checkedIngredients: boolean[];
  onToggleIngredient: (index: number) => void;
  completedSteps: boolean[];
  onToggleStep: (index: number) => void;
  commentState: RecipeCommentsState | undefined;
  commentInput: string;
  submitError: string | null;
  onChangeCommentInput: (value: string) => void;
  onAddComment: () => void;
  onLoadMoreComments: () => void;
  onToggleCommentLike: (commentId: string) => void;
  onDeleteComment: (commentId: string) => void;
  commentHighlight: UseCommentHighlightResult;
}


// react-native-web honours CSS `position: sticky`, which RN's ViewStyle type
// omits. This component only renders on the web shell, so widen the value
// locally via a plain object (no `unknown` double-cast).
const stickyBase = { position: 'sticky', top: layoutSizes.webDetailStickyTop };
const stickyColumn = stickyBase as ViewStyle;

/**
 * Two-column SaaS recipe-detail layout for the web shell. The mobile screen
 * renders its own single-column layout; this component is only mounted when
 * `useLayout().isExpanded` is true — the web shell and the iPad alike. Store loading and handlers are owned by the
 * parent screen and passed in — this component holds only the active-image
 * selection state.
 */
export const WebRecipeDetail = (props: WebRecipeDetailProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const backLabel = useBackLabel();
  const { width } = useLayout();
  const [activeImage, setActiveImage] = useState(ValueConstants.zero);
  const { recipe, media } = props;
  const twoColumn = width >= layoutSizes.webDetailTwoColMin;

  return (
    <View style={styles.page}>
      <Pressable
        onPress={props.onBack}
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        style={styles.backLink}
      >
        <Ionicons name="chevron-back" size={iconSizes.xl} color={colors.textMuted} />
        <ThemedText variant="body" style={[styles.backLabel, { color: colors.textMuted }]}>
          {backLabel}
        </ThemedText>
      </Pressable>

      <WebRecipeDetailHeader
        recipe={recipe}
        authorState={props.authorState}
        liked={props.liked}
        likeCount={props.likeCount}
        onToggleLike={props.onToggleLike}
        isOwner={props.isOwner}
        onDelete={props.onDelete}
        isSaved={props.isSaved}
        saveDisabled={props.saveDisabled}
        onToggleSave={props.onToggleSave}
        onCopyToDraft={props.onCopyToDraft}
        photos={props.photos}
      />

      <View style={[styles.grid, twoColumn ? styles.gridRow : styles.gridColumn]}>
        <View style={styles.mainColumn}>
          <WebRecipeDetailHero
            recipe={recipe}
            media={media}
            activeImage={activeImage}
            onSelectImage={setActiveImage}
            {...(props.photos !== undefined ? { photos: props.photos } : {})}
          />

          <View style={styles.section}>
            <ThemedText style={[styles.heading, { color: colors.text }]}>
              {`${t().recipes.instructions} · ${String(recipe.instructions.length)}`}
            </ThemedText>
            <View style={styles.stepList}>
              {recipe.instructions.map((step, i) => (
                <InstructionCard
                  key={i}
                  index={i}
                  step={step}
                  completed={props.completedSteps[i] ?? false}
                  onToggle={() => props.onToggleStep(i)}
                />
              ))}
            </View>
          </View>

          <WebRecipeDetailComments
            commentState={props.commentState}
            userId={props.userId}
            commentInput={props.commentInput}
            submitError={props.submitError}
            onChangeCommentInput={props.onChangeCommentInput}
            onAddComment={props.onAddComment}
            onLoadMore={props.onLoadMoreComments}
            onToggleCommentLike={props.onToggleCommentLike}
            onDeleteComment={props.onDeleteComment}
            commentHighlight={props.commentHighlight}
          />
        </View>

        <View style={[styles.sideColumn, twoColumn ? stickyColumn : null]}>
          <WebRecipeDetailSidebar
            recipe={recipe}
            checkedIngredients={props.checkedIngredients}
            onToggleIngredient={props.onToggleIngredient}
            isNutritionCalculating={props.isNutritionCalculating}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  backLabel: {
    fontWeight: fontWeights.semibold,
  },
  grid: {
    gap: layoutSizes.webDetailColGap,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  gridColumn: {
    flexDirection: 'column',
  },
  mainColumn: {
    flex: MAIN_COLUMN_WEIGHT,
    minWidth: ValueConstants.zero,
    gap: spacing.xl,
  },
  sideColumn: {
    flex: ValueConstants.one,
    minWidth: ValueConstants.zero,
  },
  section: {
    gap: spacing.md,
  },
  heading: {
    fontSize: fontSizes.subheading,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.tight,
  },
  stepList: {
    gap: spacing.sm,
  },
});
