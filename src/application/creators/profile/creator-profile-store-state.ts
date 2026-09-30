import type { Failure } from '@core/failure';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import type { CreatorProfileState } from '@application/creators/profile/creator-profile-state';
import type { CreatorRecipesState } from '@application/creators/profile/creator-recipes-state';

export interface CreatorProfileStoreState {
  /** Whose page is loaded; `null` before the first `open`. */
  userId: string | null;
  profileState: CreatorProfileState;
  recipes: RecipeSummaryEntity[];
  recipesState: CreatorRecipesState;
  /** True while a follow or unfollow is on its way; the button waits for it. */
  isFollowPending: boolean;
  /**
   * Loads a user's page: profile and first recipe page. Opening the user
   * already shown re-reads both without a skeleton, so focus refreshes the
   * follow standing after a sign-in.
   */
  open: (userId: string) => Promise<void>;
  /** Re-reads the open page; a no-op before `open`. */
  refresh: () => Promise<void>;
  /** Appends the next recipe page when there is one. */
  loadMoreRecipes: () => Promise<void>;
  /**
   * Follows or unfollows the open profile, showing the answer at once and
   * putting it back if the server refuses. Returns null or the Failure.
   */
  toggleFollow: () => Promise<Failure | null>;
  /** Forgets the page — on sign-out, since the follow standing was the old viewer's. */
  clear: () => void;
}
