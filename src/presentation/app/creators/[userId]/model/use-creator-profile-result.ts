import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import type { CreatorProfileState } from '@application/creators/profile/creator-profile-state';
import type { CreatorRecipesState } from '@application/creators/profile/creator-recipes-state';

/** View model returned by {@link useCreatorProfile} for /creators/[userId]. */
export interface UseCreatorProfileResult {
  profileState: CreatorProfileState;
  recipes: readonly RecipeSummaryEntity[];
  recipesState: CreatorRecipesState;
  /** The signed-in user looking at their own page: no follow button. */
  isOwnProfile: boolean;
  isFollowPending: boolean;
  isPullRefreshing: boolean;
  gridColumns: number;
  /** Counts in the locale's compact notation ("12,4 B"). */
  formatCount: (value: number) => string;
  onRefresh: () => void;
  onEndReached: () => void;
  /** Follows / unfollows; a guest gets the sign-in prompt instead. */
  onToggleFollow: () => void;
  onShare: () => void;
  onOpenRecipe: (id: string) => void;
  onBack: () => void;
  promptVisible: boolean;
  promptMessage: string | undefined;
  onClosePrompt: () => void;
  onGoToSignIn: () => void;
}
