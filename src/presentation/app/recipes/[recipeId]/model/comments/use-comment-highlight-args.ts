import type { RefObject } from 'react';
import type { ScrollView } from 'react-native';
import type { RecipeCommentsState } from '@application/comments/list/recipe-comments-state';

/** Inputs {@link useCommentHighlight} needs from the recipe-detail view model. */
export interface UseCommentHighlightArgs {
  recipeId: string;
  commentState: RecipeCommentsState | undefined;
  scrollViewRef: RefObject<ScrollView | null>;
}
