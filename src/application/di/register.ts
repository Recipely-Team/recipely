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
import { GetImportJobUseCase } from '@application/recipes/import/get-import-job-use-case';
import { RefineRecipeUseCase } from '@application/recipes/refine/refine-recipe-use-case';
import { ListDraftsUseCase } from '@application/drafts/list/list-drafts-use-case';
import { GetLatestDraftUseCase } from '@application/drafts/read/get-latest-draft-use-case';
import { GetDraftUseCase } from '@application/drafts/read/get-draft-use-case';
import { UpsertDraftUseCase } from '@application/drafts/write/upsert-draft-use-case';
import { DeleteDraftUseCase } from '@application/drafts/write/delete-draft-use-case';
import { configureDraftsStore } from '@application/drafts/drafts-store';
import { configureImportJobStore } from '@application/recipes/import/import-job-store';
import { DeleteRecipeUseCase } from '@application/recipes/delete/delete-recipe-use-case';
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
  const recipeDetailStore = configureRecipeDetailStore({ getRecipe });
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
  const draftsStore = configureDraftsStore({
    listDraftsUseCase,
    getLatestDraftUseCase,
    getDraftUseCase,
    upsertDraftUseCase,
    deleteDraftUseCase,
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
    importJobStore.getState().clear();
    userProfileStore.getState().reset();
  };
  const authStore = configureAuthStore({ signIn, requestRegistration, verifyRegistration, resendRegistrationCode, signOut, getSession, loadFavorites: loadFavoritesUseCase, savedRecipesStore, signInWithGoogle, signInWithApple, requestPasswordReset, resetPassword, uploadAvatar, updateProfile, deleteAccount, clearSessionCaches });
  return {
    authStore,
    recipeListStore,
    trendingRecipesStore,
    recipeDetailStore,
    savedRecipesStore,
    likedRecipesStore,
    createdRecipesStore,
    draftsStore,
    importJobStore,
    favoritesStore,
    commentsStore,
    likesStore,
    notificationsStore,
    userProfileStore,
    taxonomyStore,
    feedbackStore,
    loadFavoritesUseCase,
  };
};
