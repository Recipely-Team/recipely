import type { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import type { AssistantSessionStore } from '@application/assistant/session/assistant-session-store-contract';
import type { StoreApi } from 'zustand/vanilla';
import type { LoadFavoritesUseCase } from '@application/favorites/load-favorites-use-case';
import type { AuthStore } from '@application/auth/auth-store-contract';
import type { CommentsStore } from '@application/comments/comments-store-contract';
import type { MyRecipesStore } from '@application/recipes/my-recipes/my-recipes-store-contract';
import type { RecipeAuthoringStore } from '@application/recipes/create/recipe-authoring-store-contract';
import type { DraftsStore } from '@application/drafts/drafts-store-contract';
import type { DiaryStore } from '@application/diary/diary-store-contract';
import type { BuildLoggableFoodFromRecipeUseCase } from '@application/diary/entries/build-loggable-food-from-recipe-use-case';
import type { ParseMealUseCase } from '@application/diary/meal/parse-meal-use-case';
import type { FoodSearchStore } from '@application/diary/foods/food-search-store-contract';
import type { FoodCatalogStore } from '@application/diary/foods/food-catalog-store-contract';
import type { SearchFoodsUseCase } from '@application/diary/foods/search/search-foods-use-case';
import type { InstagramStore } from '@application/instagram/instagram-store-contract';
import type { AutomationsStore } from '@application/instagram/automations-store-contract';
import type { CreatorStatsStore } from '@application/instagram/stats/creator-stats-store-contract';
import type { DmArrivalStore } from '@application/instagram/stats/dm-arrival-store-contract';
import type { ShoppingListStore } from '@application/shopping/shopping-list-store-contract';
import type { MealPlanStore } from '@application/meal-plan/meal-plan-store-contract';
import type { FridgeStore } from '@application/fridge/fridge-store-contract';
import type { ListRecentFoodPageUseCase } from '@application/diary/foods/browse/list-recent-food-page-use-case';
import type { FavoritesStore } from '@application/favorites/favorites-store-contract';
import type { ImportJobStore } from '@application/recipes/import/import-job-store-contract';
import type { FileImportStore } from '@application/recipes/import-file/file-import-store-contract';
import type { FeedbackStore } from '@application/feedback/feedback-store-contract';
import type { LikesStore } from '@application/likes/likes-store-contract';
import type { StepProgressStore } from '@application/recipes/cooking/step-progress-store-contract';
import type { PortionChoiceStore } from '@application/recipes/cooking/portion-choice-store-contract';
import type { NotificationsStore } from '@application/notifications/notifications-store-contract';
import type { RecipeDetailStore } from '@application/recipes/detail/recipe-detail-store-contract';
import type { RecipePublishingStore } from '@application/recipes/publishing/recipe-publishing-store-contract';
import type { RecipeListStore } from '@application/recipes/list/recipe-list-store-contract';
import type { LikedRecipesStore } from '@application/recipes/liked/liked-recipes-store-contract';
import type { SavedRecipesStore } from '@application/recipes/saved/saved-recipes-store-contract';
import type { AssistantTokenRepositoryInterface } from '@domain/assistant/session/assistant-token-repository-interface';
import type { OsAssistantInterface } from '@domain/assistant/os/os-assistant-interface';
import type { TaxonomyStore } from '@application/recipes/taxonomy/taxonomy-store-contract';
import type { TrendingRecipesStore } from '@application/recipes/trending/trending-recipes-store-contract';
import type { UserProfileStore } from '@application/user-profile/user-profile-store-contract';
import type { CreatorsStore } from '@application/creators/creators-store-contract';
import type { CreatorProfileStore } from '@application/creators/profile/creator-profile-store-contract';
import type { GetUserProfileUseCase } from '@application/user-profile/get-user-profile-use-case';
import type { RegisterDeviceTokenUseCase } from '@application/notifications/register-device-token-use-case';
import type { RefreshRemindersUseCase } from '@application/notifications/reminders/refresh-reminders-use-case';
import type { SetRemindersChoiceUseCase } from '@application/notifications/reminders/set-reminders-choice-use-case';
import type { GetRemindersEnabledUseCase } from '@application/notifications/reminders/get-reminders-enabled-use-case';
import type { ShouldOfferRemindersUseCase } from '@application/notifications/reminders/should-offer-reminders-use-case';

/** The store bundle `registerApplication` hands to the presentation layer. */
export interface ApplicationStores {
  assistantSessionStore: StoreApi<AssistantSessionStore>;
  /** Screens register the actions only they can perform (navigate, focus, pick). */
  assistantActionRegistry: AssistantActionRegistry;
  /** Siri, Spotlight and the launcher — the assistant's entry points from outside. */
  osAssistant: OsAssistantInterface;
  /** Mints the narrow token those entry points answer with. */
  assistantTokens: AssistantTokenRepositoryInterface;
  authStore: StoreApi<AuthStore>;
  recipeListStore: StoreApi<RecipeListStore>;
  trendingRecipesStore: StoreApi<TrendingRecipesStore>;
  recipeDetailStore: StoreApi<RecipeDetailStore>;
  /** Publish, take back and edit a recipe the user owns. */
  recipePublishingStore: StoreApi<RecipePublishingStore>;
  savedRecipesStore: StoreApi<SavedRecipesStore>;
  likedRecipesStore: StoreApi<LikedRecipesStore>;
  recipeAuthoringStore: StoreApi<RecipeAuthoringStore>;
  /** The viewer's own recipes, the Created tab. */
  myRecipesStore: StoreApi<MyRecipesStore>;
  draftsStore: StoreApi<DraftsStore>;
  importJobStore: StoreApi<ImportJobStore>;
  /** One synchronous reading of photos or a PDF into a draft. */
  fileImportStore: StoreApi<FileImportStore>;
  favoritesStore: StoreApi<FavoritesStore>;
  commentsStore: StoreApi<CommentsStore>;
  likesStore: StoreApi<LikesStore>;
  /** Ticked instruction steps per recipe, shared by the recipe page and cook mode. */
  stepProgressStore: StoreApi<StepProgressStore>;
  portionChoiceStore: StoreApi<PortionChoiceStore>;
  notificationsStore: StoreApi<NotificationsStore>;
  userProfileStore: StoreApi<UserProfileStore>;
  taxonomyStore: StoreApi<TaxonomyStore>;
  feedbackStore: StoreApi<FeedbackStore>;
  /** The Explore creators strip. Public, so it survives sign-out. */
  creatorsStore: StoreApi<CreatorsStore>;
  /** One creator's page: profile, recipes, follow. Viewer-scoped, cleared on sign-out. */
  creatorProfileStore: StoreApi<CreatorProfileStore>;
  /** The food diary: days, months, recent foods, goals. User-scoped. */
  diaryStore: StoreApi<DiaryStore>;
  /** The Add food sheet's server-side search, four paged groups. User-scoped. */
  foodSearchStore: StoreApi<FoodSearchStore>;
  /** The Add food sheet's shelves, products, recent foods and opened product. User-scoped. */
  foodCatalogStore: StoreApi<FoodCatalogStore>;
  /** The viewer's Instagram link. User-scoped. */
  instagramStore: StoreApi<InstagramStore>;
  /** Instagram comment-to-DM rules, their pickers and activity. User-scoped. */
  automationsStore: StoreApi<AutomationsStore>;
  /** The creator stats panel, one answer per range. */
  creatorStatsStore: StoreApi<CreatorStatsStore>;
  /** Recipes reached through a creator's DM; app-session scoped so a sign-in in between still counts the save. */
  dmArrivalStore: StoreApi<DmArrivalStore>;
  /** The viewer's shopping list. User-scoped. */
  shoppingListStore: StoreApi<ShoppingListStore>;
  /** The weekly meal plan, one state per week, and the add sheet's recipe list. User-scoped. */
  mealPlanStore: StoreApi<MealPlanStore>;
  /** Cook from my fridge: its flag and its two AI calls. Not user-scoped. */
  fridgeStore: StoreApi<FridgeStore>;
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
