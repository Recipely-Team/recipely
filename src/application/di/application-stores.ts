import type { BoundStore } from '@application/store/bound-store';
import type { LoadFavoritesUseCase } from '@application/favorites/load-favorites-use-case';
import type { AuthStoreState } from '@application/auth/auth-store-state';
import type { CommentsStoreState } from '@application/comments/comments-store-state';
import type { CreatedRecipesStoreState } from '@application/recipes/my-recipes/created-recipes-store-state';
import type { DraftsStoreState } from '@application/drafts/drafts-store-state';
import type { FavoritesStoreState } from '@application/favorites/favorites-store-state';
import type { ImportJobStoreState } from '@application/recipes/import/import-job-store-state';
import type { FeedbackStoreState } from '@application/feedback/feedback-store-state';
import type { LikesStoreState } from '@application/likes/likes-store-state';
import type { NotificationsStoreState } from '@application/notifications/notifications-store-state';
import type { RecipeDetailStoreState } from '@application/recipes/detail/recipe-detail-store-state';
import type { RecipeListStoreState } from '@application/recipes/list/recipe-list-store-state';
import type { LikedRecipesStoreState } from '@application/recipes/liked/liked-recipes-store-state';
import type { SavedRecipesStoreState } from '@application/recipes/saved/saved-recipes-store-state';
import type { TaxonomyStoreState } from '@application/recipes/taxonomy/taxonomy-store-state';
import type { TrendingRecipesStoreState } from '@application/recipes/trending/trending-recipes-store-state';
import type { UserProfileStoreState } from '@application/user-profile/user-profile-store-state';

/** The store bundle `registerApplication` hands to the presentation layer. */
export interface ApplicationStores {
  authStore: BoundStore<AuthStoreState>;
  recipeListStore: BoundStore<RecipeListStoreState>;
  trendingRecipesStore: BoundStore<TrendingRecipesStoreState>;
  recipeDetailStore: BoundStore<RecipeDetailStoreState>;
  savedRecipesStore: BoundStore<SavedRecipesStoreState>;
  likedRecipesStore: BoundStore<LikedRecipesStoreState>;
  createdRecipesStore: BoundStore<CreatedRecipesStoreState>;
  draftsStore: BoundStore<DraftsStoreState>;
  importJobStore: BoundStore<ImportJobStoreState>;
  favoritesStore: BoundStore<FavoritesStoreState>;
  commentsStore: BoundStore<CommentsStoreState>;
  likesStore: BoundStore<LikesStoreState>;
  notificationsStore: BoundStore<NotificationsStoreState>;
  userProfileStore: BoundStore<UserProfileStoreState>;
  taxonomyStore: BoundStore<TaxonomyStoreState>;
  feedbackStore: BoundStore<FeedbackStoreState>;
  loadFavoritesUseCase: LoadFavoritesUseCase;
}
