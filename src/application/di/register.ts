import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import type { AssistantMessengerInterface } from '@domain/assistant/session/assistant-messenger-interface';
import type { OsAssistantInterface } from '@domain/assistant/os/os-assistant-interface';
import type { AssistantMicrophone, AssistantPlayer, AssistantSession } from '@live-assistant/core';
import type { LiveSessionCredentials } from '@domain/assistant/session/live-session-credentials';
import type { AssistantTokenRepositoryInterface } from '@domain/assistant/session/assistant-token-repository-interface';
import { configureAssistantSessionStore } from '@application/assistant/session/assistant-session-store';
import type { Container } from '@core/di/container';
import { TOKENS } from '@application/di/tokens';
import type { AuthRepositoryInterface } from '@domain/auth/auth-repository-interface';
import type { RecipeRepositoryInterface } from '@domain/recipes/recipe-repository-interface';
import type { RecipeDraftRepositoryInterface } from '@domain/drafts/recipe-draft-repository-interface';
import { SignInUseCase } from '@application/auth/sign-in/sign-in-use-case';
import { RequestRegistrationUseCase } from '@application/auth/registration/request-registration-use-case';
import { VerifyRegistrationUseCase } from '@application/auth/registration/verify-registration-use-case';
import { ResendRegistrationCodeUseCase } from '@application/auth/registration/resend-registration-code-use-case';
import { SignOutUseCase } from '@application/auth/session/sign-out-use-case';
import { GetSessionUseCase } from '@application/auth/session/get-session-use-case';
import { SignInWithGoogleUseCase } from '@application/auth/sign-in/sign-in-with-google-use-case';
import { SignInWithAppleUseCase } from '@application/auth/sign-in/sign-in-with-apple-use-case';
import { RequestPasswordResetUseCase } from '@application/auth/password-reset/request-password-reset-use-case';
import { ResetPasswordUseCase } from '@application/auth/password-reset/reset-password-use-case';
import { UploadAvatarUseCase } from '@application/auth/profile/upload-avatar-use-case';
import { UpdateProfileUseCase } from '@application/auth/profile/update-profile-use-case';
import { DeleteAccountUseCase } from '@application/auth/session/delete-account-use-case';
import { ListRecipesUseCase } from '@application/recipes/list/list-recipes-use-case';
import { ListTrendingRecipesUseCase } from '@application/recipes/trending/list-trending-recipes-use-case';
import { GetRecipeUseCase } from '@application/recipes/detail/get-recipe-use-case';
import { CreateRecipeUseCase } from '@application/recipes/create/create-recipe-use-case';
import { ListMyRecipesUseCase } from '@application/recipes/my-recipes/list-my-recipes-use-case';
import { GenerateRecipeUseCase } from '@application/recipes/generate/generate-recipe-use-case';
import { ImportInstagramRecipeUseCase } from '@application/recipes/import/import-instagram-recipe-use-case';
import { EnqueueInstagramImportUseCase } from '@application/recipes/import/enqueue-instagram-import-use-case';
import { ImportRecipeFromFilesUseCase } from '@application/recipes/import-file/import-recipe-from-files-use-case';
import { configureFileImportStore } from '@application/recipes/import-file/file-import-store';
import { GetImportJobUseCase } from '@application/recipes/import/get-import-job-use-case';
import { RefineRecipeUseCase } from '@application/recipes/refine/refine-recipe-use-case';
import { ListDraftsUseCase } from '@application/drafts/list/list-drafts-use-case';
import { GetLatestDraftUseCase } from '@application/drafts/read/get-latest-draft-use-case';
import { GetDraftUseCase } from '@application/drafts/read/get-draft-use-case';
import { UpsertDraftUseCase } from '@application/drafts/write/upsert-draft-use-case';
import { DeleteDraftUseCase } from '@application/drafts/write/delete-draft-use-case';
import { configureDraftsStore } from '@application/drafts/drafts-store';
import type { FoodDiaryRepositoryInterface } from '@domain/diary/food-diary-repository-interface';
import { configureDiaryStore } from '@application/diary/diary-store';
import { LoadDiaryDayUseCase } from '@application/diary/day/load-diary-day-use-case';
import { SetDayWaterUseCase } from '@application/diary/day/set-day-water-use-case';
import { LoadDiaryMonthUseCase } from '@application/diary/month/load-diary-month-use-case';
import { AddFoodLogEntryUseCase } from '@application/diary/entries/add-food-log-entry-use-case';
import { UpdateFoodLogEntryUseCase } from '@application/diary/entries/update-food-log-entry-use-case';
import { DeleteFoodLogEntryUseCase } from '@application/diary/entries/delete-food-log-entry-use-case';
import { LoadRecentFoodsUseCase } from '@application/diary/entries/load-recent-foods-use-case';
import { BuildLoggableFoodFromRecipeUseCase } from '@application/diary/entries/build-loggable-food-from-recipe-use-case';
import { LoadNutritionGoalsUseCase } from '@application/diary/goals/load-nutrition-goals-use-case';
import { SaveNutritionGoalsUseCase } from '@application/diary/goals/save-nutrition-goals-use-case';
import type { FoodCatalogRepositoryInterface } from '@domain/diary/foods/food-catalog-repository-interface';
import { configureFoodSearchStore } from '@application/diary/foods/food-search-store';
import { configureFoodCatalogStore } from '@application/diary/foods/food-catalog-store';
import { SearchFoodsUseCase } from '@application/diary/foods/search/search-foods-use-case';
import { SearchRecipeGroupUseCase } from '@application/diary/foods/search/search-recipe-group-use-case';
import { SearchProductsUseCase } from '@application/diary/foods/search/search-products-use-case';
import { ListFoodCategoriesUseCase } from '@application/diary/foods/browse/list-food-categories-use-case';
import { ListFoodProductsUseCase } from '@application/diary/foods/browse/list-food-products-use-case';
import { ListRecentFoodPageUseCase } from '@application/diary/foods/browse/list-recent-food-page-use-case';
import { LoadFoodDetailUseCase } from '@application/diary/foods/detail/load-food-detail-use-case';
import type { InstagramRepositoryInterface } from '@domain/instagram/instagram-repository-interface';
import { configureInstagramStore } from '@application/instagram/instagram-store';
import { configureAutomationsStore } from '@application/instagram/automations-store';
import { GetInstagramConnectionUseCase } from '@application/instagram/connect/get-instagram-connection-use-case';
import { StartInstagramLoginUseCase } from '@application/instagram/connect/start-instagram-login-use-case';
import { FinalizeInstagramLinkUseCase } from '@application/instagram/connect/finalize-instagram-link-use-case';
import { DisconnectInstagramUseCase } from '@application/instagram/connect/disconnect-instagram-use-case';
import { ListDmRulesUseCase } from '@application/instagram/rules/list-dm-rules-use-case';
import { GetDmRuleUseCase } from '@application/instagram/rules/get-dm-rule-use-case';
import { SaveDmRuleUseCase } from '@application/instagram/rules/save-dm-rule-use-case';
import { SetDmRuleEnabledUseCase } from '@application/instagram/rules/set-dm-rule-enabled-use-case';
import { DeleteDmRuleUseCase } from '@application/instagram/rules/delete-dm-rule-use-case';
import { ListInstagramMediaUseCase } from '@application/instagram/rules/list-instagram-media-use-case';
import { ListDmSendsUseCase } from '@application/instagram/activity/list-dm-sends-use-case';
import { configureImportJobStore } from '@application/recipes/import/import-job-store';
import { DeleteRecipeUseCase } from '@application/recipes/delete/delete-recipe-use-case';
import { AddRecipePhotoUseCase } from '@application/recipes/photos/add-recipe-photo-use-case';
import { RemoveRecipePhotoUseCase } from '@application/recipes/photos/remove-recipe-photo-use-case';
import { RemoveRecipeCoverUseCase } from '@application/recipes/photos/remove-recipe-cover-use-case';
import { PublishRecipeUseCase } from '@application/recipes/publishing/publish-recipe-use-case';
import { UnpublishRecipeUseCase } from '@application/recipes/publishing/unpublish-recipe-use-case';
import { EditRecipeUseCase } from '@application/recipes/edit/edit-recipe-use-case';
import { configureRecipePublishingStore } from '@application/recipes/publishing/recipe-publishing-store';
import { AddFavoriteUseCase } from '@application/favorites/add-favorite-use-case';
import { RemoveFavoriteUseCase } from '@application/favorites/remove-favorite-use-case';
import { LoadFavoritesUseCase } from '@application/favorites/load-favorites-use-case';
import { configureAuthStore } from '@application/auth/auth-store';
import { configureRecipeListStore } from '@application/recipes/list/recipe-list-store';
import { configureTrendingRecipesStore } from '@application/recipes/trending/trending-recipes-store';
import { configureRecipeDetailStore } from '@application/recipes/detail/recipe-detail-store';
import { configureSavedRecipesStore } from '@application/recipes/saved/saved-recipes-store';
import { configureCreatedRecipesStore } from '@application/recipes/my-recipes/created-recipes-store';
import { LoadTaxonomyUseCase } from '@application/recipes/taxonomy/load-taxonomy-use-case';
import { configureTaxonomyStore } from '@application/recipes/taxonomy/taxonomy-store';
import { configureFavoritesStore } from '@application/favorites/favorites-store';
import { ListCommentsUseCase } from '@application/comments/list/list-comments-use-case';
import { AddCommentUseCase } from '@application/comments/add/add-comment-use-case';
import { DeleteCommentUseCase } from '@application/comments/delete/delete-comment-use-case';
import { LikeCommentUseCase } from '@application/comments/like/like-comment-use-case';
import { UnlikeCommentUseCase } from '@application/comments/like/unlike-comment-use-case';
import { configureCommentsStore } from '@application/comments/comments-store';
import type { CommentRepositoryInterface } from '@domain/comments/comment-repository-interface';
import { LikeRecipeUseCase } from '@application/likes/like-recipe-use-case';
import { UnlikeRecipeUseCase } from '@application/likes/unlike-recipe-use-case';
import { configureLikesStore } from '@application/likes/likes-store';
import { LoadLikedRecipesUseCase } from '@application/likes/load-liked-recipes-use-case';
import { configureLikedRecipesStore } from '@application/recipes/liked/liked-recipes-store';
import { ListNotificationsUseCase } from '@application/notifications/list/list-notifications-use-case';
import { MarkAllReadUseCase } from '@application/notifications/read/mark-all-read-use-case';
import { MarkOneReadUseCase } from '@application/notifications/read/mark-one-read-use-case';
import { configureNotificationsStore } from '@application/notifications/notifications-store';
import { GetUserProfileUseCase } from '@application/user-profile/get-user-profile-use-case';
import { configureUserProfileStore } from '@application/user-profile/user-profile-store';
import { SubmitFeedbackUseCase } from '@application/feedback/submit-feedback-use-case';
import { configureFeedbackStore } from '@application/feedback/feedback-store';
import type { ApplicationStores } from '@application/di/application-stores';
import type { DeviceIdentityInterface } from '@domain/device/device-identity-interface';
import type { DeviceRepositoryInterface } from '@domain/device/device-repository-interface';
import { RecordDeviceUseCase } from '@application/device/record-device-use-case';
import type { UserProfileRepositoryInterface } from '@domain/user-profile/user-profile-repository-interface';
import { RequestCreatorTagUseCase } from '@application/creators/claim/request-creator-tag-use-case';
import { RemoveCreatorTagUseCase } from '@application/creators/claim/remove-creator-tag-use-case';
import { RefreshCreatorClaimUseCase } from '@application/creators/claim/refresh-creator-claim-use-case';
import { ListCreatorsUseCase } from '@application/creators/list/list-creators-use-case';
import { configureCreatorsStore } from '@application/creators/creators-store';
import { configureCreatorProfileStore } from '@application/creators/profile/creator-profile-store';
import { GetViewedUserProfileUseCase } from '@application/user-profile/get-viewed-user-profile-use-case';
import { ListUserRecipesUseCase } from '@application/user-profile/recipes/list-user-recipes-use-case';
import { FollowUserUseCase } from '@application/user-profile/follow/follow-user-use-case';
import { UnfollowUserUseCase } from '@application/user-profile/follow/unfollow-user-use-case';
import { recordDeviceOnSessionRestore } from '@application/device/record-device-on-session-restore';


export const registerApplication = (container: Container): ApplicationStores => {
  const authRepo = container.resolve<AuthRepositoryInterface>(TOKENS.AuthRepository);
  const recipeRepo = container.resolve<RecipeRepositoryInterface>(TOKENS.RecipeRepository);
  const draftRepo = container.resolve<RecipeDraftRepositoryInterface>(TOKENS.RecipeDraftRepository);
  const signIn = new SignInUseCase(authRepo);
  const requestRegistration = new RequestRegistrationUseCase(authRepo);
  const verifyRegistration = new VerifyRegistrationUseCase(authRepo);
  const resendRegistrationCode = new ResendRegistrationCodeUseCase(authRepo);
  const signOut = new SignOutUseCase(authRepo);
  const getSession = new GetSessionUseCase(authRepo);
  const signInWithGoogle = new SignInWithGoogleUseCase(authRepo);
  const signInWithApple = new SignInWithAppleUseCase(authRepo);
  const requestPasswordReset = new RequestPasswordResetUseCase(authRepo);
  const resetPassword = new ResetPasswordUseCase(authRepo);
  const uploadAvatar = new UploadAvatarUseCase(authRepo);
  const updateProfile = new UpdateProfileUseCase(authRepo);
  const deleteAccount = new DeleteAccountUseCase(authRepo);
  const listRecipes = new ListRecipesUseCase(recipeRepo);
  const listTrendingRecipes = new ListTrendingRecipesUseCase(recipeRepo);
  const getRecipe = new GetRecipeUseCase(recipeRepo);
  const createRecipeUseCase = new CreateRecipeUseCase(recipeRepo);
  const listMyRecipesUseCase = new ListMyRecipesUseCase(recipeRepo);
  const generateRecipeUseCase = new GenerateRecipeUseCase(recipeRepo);
  const importInstagramRecipeUseCase = new ImportInstagramRecipeUseCase(recipeRepo);
  const enqueueInstagramImportUseCase = new EnqueueInstagramImportUseCase(recipeRepo);
  const getImportJobUseCase = new GetImportJobUseCase(recipeRepo);
  const refineRecipeUseCase = new RefineRecipeUseCase(recipeRepo);
  const deleteRecipeUseCase = new DeleteRecipeUseCase(recipeRepo);
  const listDraftsUseCase = new ListDraftsUseCase(draftRepo);
  const getLatestDraftUseCase = new GetLatestDraftUseCase(draftRepo);
  const getDraftUseCase = new GetDraftUseCase(draftRepo);
  const upsertDraftUseCase = new UpsertDraftUseCase(draftRepo);
  const deleteDraftUseCase = new DeleteDraftUseCase(draftRepo);
  const commentRepo = container.resolve<CommentRepositoryInterface>(TOKENS.CommentRepository);
  const listCommentsUseCase = new ListCommentsUseCase(commentRepo);
  const addCommentUseCase = new AddCommentUseCase(commentRepo);
  const deleteCommentUseCase = new DeleteCommentUseCase(commentRepo);
  const likeCommentUseCase = new LikeCommentUseCase(commentRepo);
  const unlikeCommentUseCase = new UnlikeCommentUseCase(commentRepo);

  const addFavoriteUseCase = container.resolve<AddFavoriteUseCase>(TOKENS.AddFavoriteUseCase);
  const removeFavoriteUseCase = container.resolve<RemoveFavoriteUseCase>(TOKENS.RemoveFavoriteUseCase);
  const loadFavoritesUseCase = container.resolve<LoadFavoritesUseCase>(TOKENS.LoadFavoritesUseCase);
  const likeRecipeUseCase = container.resolve<LikeRecipeUseCase>(TOKENS.LikeRecipeUseCase);
  const unlikeRecipeUseCase = container.resolve<UnlikeRecipeUseCase>(TOKENS.UnlikeRecipeUseCase);
  const loadLikedRecipesUseCase = container.resolve<LoadLikedRecipesUseCase>(TOKENS.LoadLikedRecipesUseCase);

  const savedRecipesStore = configureSavedRecipesStore({ loadFavoritesUseCase });
  const likedRecipesStore = configureLikedRecipesStore({ loadLikedRecipesUseCase });
  const recipeListStore = configureRecipeListStore({ listRecipes });
  const trendingRecipesStore = configureTrendingRecipesStore({ listTrendingRecipes });
  const addRecipePhotoUseCase = new AddRecipePhotoUseCase(recipeRepo);
  const removeRecipePhotoUseCase = new RemoveRecipePhotoUseCase(recipeRepo);
  const recipeDetailStore = configureRecipeDetailStore({
    getRecipe,
    addRecipePhoto: addRecipePhotoUseCase,
    removeRecipePhoto: removeRecipePhotoUseCase,
    removeRecipeCover: new RemoveRecipeCoverUseCase(recipeRepo),
  });
  const recipePublishingStore = configureRecipePublishingStore({
    publishRecipe: new PublishRecipeUseCase(recipeRepo),
    unpublishRecipe: new UnpublishRecipeUseCase(recipeRepo),
    editRecipe: new EditRecipeUseCase(recipeRepo),
    recipeDetailStore,
  });
  const favoritesStore = configureFavoritesStore({
    addFavoriteUseCase,
    removeFavoriteUseCase,
    savedRecipesStore,
  });
  const createdRecipesStore = configureCreatedRecipesStore({
    createRecipeUseCase,
    listMyRecipesUseCase,
    generateRecipeUseCase,
    importInstagramRecipeUseCase,
    refineRecipeUseCase,
    deleteRecipeUseCase,
    recipeListStore,
    recipeDetailStore,
  });
  const importJobStore = configureImportJobStore({
    enqueueInstagramImportUseCase,
    getImportJobUseCase,
  });
  const fileImportStore = configureFileImportStore({
    importRecipeFromFilesUseCase: new ImportRecipeFromFilesUseCase(recipeRepo),
  });
  const draftsStore = configureDraftsStore({
    listDraftsUseCase,
    getLatestDraftUseCase,
    getDraftUseCase,
    upsertDraftUseCase,
    deleteDraftUseCase,
  });
  const diaryRepo = container.resolve<FoodDiaryRepositoryInterface>(TOKENS.FoodDiaryRepository);
  const diaryStore = configureDiaryStore({
    loadDay: new LoadDiaryDayUseCase(diaryRepo),
    loadMonth: new LoadDiaryMonthUseCase(diaryRepo),
    loadRecent: new LoadRecentFoodsUseCase(diaryRepo),
    addEntry: new AddFoodLogEntryUseCase(diaryRepo),
    updateEntry: new UpdateFoodLogEntryUseCase(diaryRepo),
    deleteEntry: new DeleteFoodLogEntryUseCase(diaryRepo),
    setWater: new SetDayWaterUseCase(diaryRepo),
    loadGoals: new LoadNutritionGoalsUseCase(diaryRepo),
    saveGoals: new SaveNutritionGoalsUseCase(diaryRepo),
  });
  const foodCatalogRepo = container.resolve<FoodCatalogRepositoryInterface>(TOKENS.FoodCatalogRepository);
  const searchFoods = new SearchFoodsUseCase(foodCatalogRepo);
  const listRecentFoods = new ListRecentFoodPageUseCase(foodCatalogRepo);
  const foodSearchStore = configureFoodSearchStore({
    searchFoods,
    searchRecipeGroup: new SearchRecipeGroupUseCase(foodCatalogRepo),
    searchProducts: new SearchProductsUseCase(foodCatalogRepo),
  });
  const foodCatalogStore = configureFoodCatalogStore({
    listCategories: new ListFoodCategoriesUseCase(foodCatalogRepo),
    listProducts: new ListFoodProductsUseCase(foodCatalogRepo),
    listRecent: listRecentFoods,
    loadDetail: new LoadFoodDetailUseCase(foodCatalogRepo),
  });
  const instagramRepo = container.resolve<InstagramRepositoryInterface>(TOKENS.InstagramRepository);
  const instagramStore = configureInstagramStore({
    getConnection: new GetInstagramConnectionUseCase(instagramRepo),
    startLogin: new StartInstagramLoginUseCase(instagramRepo),
    finalize: new FinalizeInstagramLinkUseCase(instagramRepo),
    disconnect: new DisconnectInstagramUseCase(instagramRepo),
  });
  const automationsStore = configureAutomationsStore({
    listRules: new ListDmRulesUseCase(instagramRepo),
    getRule: new GetDmRuleUseCase(instagramRepo),
    saveRule: new SaveDmRuleUseCase(instagramRepo),
    setEnabled: new SetDmRuleEnabledUseCase(instagramRepo),
    deleteRule: new DeleteDmRuleUseCase(instagramRepo),
    listMedia: new ListInstagramMediaUseCase(instagramRepo),
    listSends: new ListDmSendsUseCase(instagramRepo),
    searchMyRecipes: new SearchRecipeGroupUseCase(foodCatalogRepo),
  });
  const commentsStore = configureCommentsStore({
    listComments: listCommentsUseCase,
    addComment: addCommentUseCase,
    deleteComment: deleteCommentUseCase,
    likeComment: likeCommentUseCase,
    unlikeComment: unlikeCommentUseCase,
  });
  const likesStore = configureLikesStore({
    likeRecipe: likeRecipeUseCase,
    unlikeRecipe: unlikeRecipeUseCase,
    likedRecipesStore,
  });
  const listNotificationsUseCase = container.resolve<ListNotificationsUseCase>(
    TOKENS.ListNotificationsUseCase,
  );
  const markAllReadUseCase = container.resolve<MarkAllReadUseCase>(
    TOKENS.MarkAllReadUseCase,
  );
  const markOneReadUseCase = container.resolve<MarkOneReadUseCase>(
    TOKENS.MarkOneReadUseCase,
  );
  const notificationsStore = configureNotificationsStore({
    listNotifications: listNotificationsUseCase,
    markAllRead: markAllReadUseCase,
    markOneRead: markOneReadUseCase,
  });
  const getUserProfileUseCase = container.resolve<GetUserProfileUseCase>(
    TOKENS.GetUserProfileUseCase,
  );
  const userProfileStore = configureUserProfileStore({
    getUserProfile: getUserProfileUseCase,
  });
  const loadTaxonomyUseCase = container.resolve<LoadTaxonomyUseCase>(
    TOKENS.LoadTaxonomyUseCase,
  );
  const taxonomyStore = configureTaxonomyStore({ loadTaxonomyUseCase });
  const submitFeedbackUseCase = container.resolve<SubmitFeedbackUseCase>(
    TOKENS.SubmitFeedbackUseCase,
  );
  const feedbackStore = configureFeedbackStore({ submitFeedbackUseCase });
  // Public, like the strip it feeds: not in `clearSessionCaches`.
  const userProfileRepo = container.resolve<UserProfileRepositoryInterface>(TOKENS.UserProfileRepository);
  const creatorsStore = configureCreatorsStore({
    listCreators: new ListCreatorsUseCase(userProfileRepo),
  });
  // Viewer-dependent (the follow standing), so it IS cleared on sign-out.
  const creatorProfileStore = configureCreatorProfileStore({
    getViewedProfile: new GetViewedUserProfileUseCase(userProfileRepo),
    listUserRecipes: new ListUserRecipesUseCase(userProfileRepo),
    follow: new FollowUserUseCase(userProfileRepo),
    unfollow: new UnfollowUserUseCase(userProfileRepo),
  });
  // The registry is created here and handed to the presentation layer, because
  // half of what the assistant does — navigate, focus a field, open the photo
  // picker — only a screen can perform. Screens register those on mount.
  const assistantActionRegistry = new AssistantActionRegistry();
  const assistantSessionStore = configureAssistantSessionStore({
    session: container.resolve<AssistantSession<LiveSessionCredentials>>(TOKENS.AssistantSession),
    microphone: container.resolve<AssistantMicrophone>(TOKENS.AssistantMicrophone),
    player: container.resolve<AssistantPlayer>(TOKENS.AssistantPlayer),
    tokens: container.resolve<AssistantTokenRepositoryInterface>(TOKENS.AssistantTokenRepository),
    messenger: container.resolve<AssistantMessengerInterface>(TOKENS.AssistantMessenger),
    registry: assistantActionRegistry,
  });
  // WHY: built after every session-scoped store exists so sign-out / account
  // deletion / session expiry can wipe all of them in one place — a cache that
  // survives an account switch shows the previous user's data (stale comments,
  // likes, notifications) until a manual refresh.
  const clearSessionCaches = (): void => {
    savedRecipesStore.getState().clear();
    likedRecipesStore.getState().clear();
    commentsStore.getState().clear();
    likesStore.getState().clear();
    recipeDetailStore.getState().clear();
    notificationsStore.getState().clear();
    createdRecipesStore.getState().clear();
    draftsStore.getState().clear();
    diaryStore.getState().clear();
    foodSearchStore.getState().clear();
    foodCatalogStore.getState().clear();
    instagramStore.getState().clear();
    automationsStore.getState().clear();
    importJobStore.getState().clear();
    fileImportStore.getState().clear();
    userProfileStore.getState().reset();
    creatorProfileStore.getState().clear();
    // The transcript is the previous user's conversation, and a live socket
    // outlives a sign-out unless something closes it.
    assistantSessionStore.getState().reset();
  };
  const onSessionRestored = recordDeviceOnSessionRestore(
    new RecordDeviceUseCase(
      container.resolve<DeviceIdentityInterface>(TOKENS.DeviceIdentity),
      container.resolve<DeviceRepositoryInterface>(TOKENS.DeviceRepository),
    ),
  );
  const authStore = configureAuthStore({ signIn, requestRegistration, verifyRegistration, resendRegistrationCode, signOut, getSession, loadFavorites: loadFavoritesUseCase, savedRecipesStore, signInWithGoogle, signInWithApple, requestPasswordReset, resetPassword, uploadAvatar, updateProfile, deleteAccount, requestCreatorTag: new RequestCreatorTagUseCase(authRepo), removeCreatorTag: new RemoveCreatorTagUseCase(authRepo), refreshCreatorClaim: new RefreshCreatorClaimUseCase(authRepo), clearSessionCaches, onSessionRestored });
  return {
    assistantSessionStore,
    assistantActionRegistry,
    osAssistant: container.resolve<OsAssistantInterface>(TOKENS.OsAssistant),
    assistantTokens: container.resolve<AssistantTokenRepositoryInterface>(
      TOKENS.AssistantTokenRepository,
    ),
    authStore,
    recipeListStore,
    trendingRecipesStore,
    recipeDetailStore,
    recipePublishingStore,
    savedRecipesStore,
    likedRecipesStore,
    createdRecipesStore,
    draftsStore,
    importJobStore,
    fileImportStore,
    favoritesStore,
    commentsStore,
    likesStore,
    notificationsStore,
    userProfileStore,
    taxonomyStore,
    feedbackStore,
    creatorsStore,
    creatorProfileStore,
    diaryStore,
    foodSearchStore,
    foodCatalogStore,
    instagramStore,
    automationsStore,
    searchFoods,
    listRecentFoods,
    buildLoggableFoodFromRecipe: new BuildLoggableFoodFromRecipeUseCase(),
    loadFavoritesUseCase,
  };
};
