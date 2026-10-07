import type { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import type { AssistantSessionStoreState } from '@application/assistant/session/assistant-session-store-state';
import type { BoundStore } from '@application/store/bound-store';
import type { LoadFavoritesUseCase } from '@application/favorites/load-favorites-use-case';
import type { AuthStoreState } from '@application/auth/auth-store-state';
import type { CommentsStoreState } from '@application/comments/comments-store-state';
import type { CreatedRecipesStoreState } from '@application/recipes/my-recipes/created-recipes-store-state';
import type { DraftsStoreState } from '@application/drafts/drafts-store-state';
import type { DiaryStoreState } from '@application/diary/diary-store-state';
import type { BuildLoggableFoodFromRecipeUseCase } from '@application/diary/entries/build-loggable-food-from-recipe-use-case';
import type { ParseMealUseCase } from '@application/diary/meal/parse-meal-use-case';
import type { FoodSearchStoreState } from '@application/diary/foods/food-search-store-state';
import type { FoodCatalogStoreState } from '@application/diary/foods/food-catalog-store-state';
import type { SearchFoodsUseCase } from '@application/diary/foods/search/search-foods-use-case';
import type { InstagramStoreState } from '@application/instagram/instagram-store-state';
import type { AutomationsStoreState } from '@application/instagram/automations-store-state';
import type { ShoppingListStoreState } from '@application/shopping/shopping-list-store-state';
import type { ListRecentFoodPageUseCase } from '@application/diary/foods/browse/list-recent-food-page-use-case';
import type { FavoritesStoreState } from '@application/favorites/favorites-store-state';
import type { ImportJobStoreState } from '@application/recipes/import/import-job-store-state';
import type { FileImportStoreState } from '@application/recipes/import-file/file-import-store-state';
import type { FeedbackStoreState } from '@application/feedback/feedback-store-state';
import type { LikesStoreState } from '@application/likes/likes-store-state';
import type { StepProgressStoreState } from '@application/recipes/cooking/step-progress-store-state';
import type { PortionChoiceStoreState } from '@application/recipes/cooking/portion-choice-store-state';
import type { NotificationsStoreState } from '@application/notifications/notifications-store-state';
import type { RecipeDetailStoreState } from '@application/recipes/detail/recipe-detail-store-state';
import type { RecipePublishingStoreState } from '@application/recipes/publishing/recipe-publishing-store-state';
import type { RecipeListStoreState } from '@application/recipes/list/recipe-list-store-state';
import type { LikedRecipesStoreState } from '@application/recipes/liked/liked-recipes-store-state';
import type { SavedRecipesStoreState } from '@application/recipes/saved/saved-recipes-store-state';
import type { AssistantTokenRepositoryInterface } from '@domain/assistant/session/assistant-token-repository-interface';
import type { OsAssistantInterface } from '@domain/assistant/os/os-assistant-interface';
import type { TaxonomyStoreState } from '@application/recipes/taxonomy/taxonomy-store-state';
import type { TrendingRecipesStoreState } from '@application/recipes/trending/trending-recipes-store-state';
import type { UserProfileStoreState } from '@application/user-profile/user-profile-store-state';
import type { CreatorsStoreState } from '@application/creators/creators-store-state';
import type { CreatorProfileStoreState } from '@application/creators/profile/creator-profile-store-state';
import type { GetUserProfileUseCase } from '@application/user-profile/get-user-profile-use-case';
import type { RegisterDeviceTokenUseCase } from '@application/notifications/register-device-token-use-case';
import type { RefreshRemindersUseCase } from '@application/notifications/reminders/refresh-reminders-use-case';
import type { SetRemindersChoiceUseCase } from '@application/notifications/reminders/set-reminders-choice-use-case';
import type { GetRemindersEnabledUseCase } from '@application/notifications/reminders/get-reminders-enabled-use-case';
import type { ShouldOfferRemindersUseCase } from '@application/notifications/reminders/should-offer-reminders-use-case';

/** The store bundle `registerApplication` hands to the presentation layer. */
export interface ApplicationStores {
  assistantSessionStore: BoundStore<AssistantSessionStoreState>;
  /** Screens register the actions only they can perform (navigate, focus, pick). */
  assistantActionRegistry: AssistantActionRegistry;
  /** Siri, Spotlight and the launcher — the assistant's entry points from outside. */
  osAssistant: OsAssistantInterface;
  /** Mints the narrow token those entry points answer with. */
  assistantTokens: AssistantTokenRepositoryInterface;
  authStore: BoundStore<AuthStoreState>;
  recipeListStore: BoundStore<RecipeListStoreState>;
  trendingRecipesStore: BoundStore<TrendingRecipesStoreState>;
  recipeDetailStore: BoundStore<RecipeDetailStoreState>;
  /** Publish, take back and edit a recipe the user owns. */
  recipePublishingStore: BoundStore<RecipePublishingStoreState>;
  savedRecipesStore: BoundStore<SavedRecipesStoreState>;
  likedRecipesStore: BoundStore<LikedRecipesStoreState>;
  createdRecipesStore: BoundStore<CreatedRecipesStoreState>;
  draftsStore: BoundStore<DraftsStoreState>;
  importJobStore: BoundStore<ImportJobStoreState>;
  /** One synchronous reading of photos or a PDF into a draft. */
  fileImportStore: BoundStore<FileImportStoreState>;
  favoritesStore: BoundStore<FavoritesStoreState>;
  commentsStore: BoundStore<CommentsStoreState>;
  likesStore: BoundStore<LikesStoreState>;
  /** Ticked instruction steps per recipe, shared by the recipe page and cook mode. */
  stepProgressStore: BoundStore<StepProgressStoreState>;
  portionChoiceStore: BoundStore<PortionChoiceStoreState>;
  notificationsStore: BoundStore<NotificationsStoreState>;
  userProfileStore: BoundStore<UserProfileStoreState>;
  taxonomyStore: BoundStore<TaxonomyStoreState>;
  feedbackStore: BoundStore<FeedbackStoreState>;
  /** The Explore creators strip. Public, so it survives sign-out. */
  creatorsStore: BoundStore<CreatorsStoreState>;
  /** One creator's page: profile, recipes, follow. Viewer-scoped, cleared on sign-out. */
  creatorProfileStore: BoundStore<CreatorProfileStoreState>;
  /** The food diary: days, months, recent foods, goals. User-scoped. */
  diaryStore: BoundStore<DiaryStoreState>;
  /** The Add food sheet's server-side search, four paged groups. User-scoped. */
  foodSearchStore: BoundStore<FoodSearchStoreState>;
  /** The Add food sheet's shelves, products, recent foods and opened product. User-scoped. */
  foodCatalogStore: BoundStore<FoodCatalogStoreState>;
  /** The viewer's Instagram link. User-scoped. */
  instagramStore: BoundStore<InstagramStoreState>;
  /** Instagram comment-to-DM rules, their pickers and activity. User-scoped. */
  automationsStore: BoundStore<AutomationsStoreState>;
  /** The viewer's shopping list. User-scoped. */
  shoppingListStore: BoundStore<ShoppingListStoreState>;
  /** The food search without a store, for the assistant's `logFood` / `searchFood`. */
  searchFoods: SearchFoodsUseCase;
  /** Recent foods, product-aware, for the assistant's name matching. */
  listRecentFoods: ListRecentFoodPageUseCase;
  /** Recipe → one serving the Add food sheet can log; synchronous, no I/O. */
  buildLoggableFoodFromRecipe: BuildLoggableFoodFromRecipeUseCase;
  /** A described or photographed meal → candidate items for the Add food sheet's confirm list. */
  parseMeal: ParseMealUseCase;
  loadFavoritesUseCase: LoadFavoritesUseCase;
  /** Another user's public profile, for the recipe page's author card. */
  getUserProfile: GetUserProfileUseCase;
  /** Hands the push token to the backend once signed in. */
  registerDeviceToken: RegisterDeviceTokenUseCase;
  /** Restarts the come-back reminder series; run on launch and on every return to the foreground. */
  refreshReminders: RefreshRemindersUseCase;
  /** Stores the answer to "may we remind you?" (asking the OS on a yes) and applies it. */
  setRemindersChoice: SetRemindersChoiceUseCase;
  /** Whether reminders are really on, for the Settings switch. */
  getRemindersEnabled: GetRemindersEnabledUseCase;
  /** Whether to ask "may we remind you?" now; records the first open. */
  shouldOfferReminders: ShouldOfferRemindersUseCase;
}
