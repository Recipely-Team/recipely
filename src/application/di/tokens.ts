/**
 * The DI key for every service this app wires up.
 *
 * Lives in `application/di/`, NOT in `core/`: `core/di/container.ts` is a
 * generic container that maps a bare `symbol` to a factory and never learns a
 * single token name — that is the reusable building block. This list, by
 * contrast, enumerates *this* application's repositories, use cases and ports,
 * which is composition knowledge and belongs with the composition root.
 *
 * `infrastructure/di/register.ts` reads these too. That is the one sanctioned
 * upward import: `scripts/check-structure.mjs` exempts any file under a `di/`
 * wiring folder from the layer rule, because registering an implementation
 * against an application-level key is exactly what a composition root is for.
 */
export const TOKENS = {
  HttpClient: Symbol.for('HttpClient'),
  AuthRepository: Symbol.for('AuthRepository'),
  RecipeRepository: Symbol.for('RecipeRepository'),
  TaxonomyRepository: Symbol.for('TaxonomyRepository'),
  LoadTaxonomyUseCase: Symbol.for('LoadTaxonomyUseCase'),
  RecipeDraftRepository: Symbol.for('RecipeDraftRepository'),
  FavoritesRepository: Symbol.for('FavoritesRepository'),
  FoodDiaryRepository: Symbol.for('FoodDiaryRepository'),
  FoodCatalogRepository: Symbol.for('FoodCatalogRepository'),
  InstagramRepository: Symbol.for('InstagramRepository'),
  AddFavoriteUseCase: Symbol.for('AddFavoriteUseCase'),
  RemoveFavoriteUseCase: Symbol.for('RemoveFavoriteUseCase'),
  LoadFavoritesUseCase: Symbol.for('LoadFavoritesUseCase'),
  CommentRepository: Symbol.for('CommentRepository'),
  LikeRepository: Symbol.for('LikeRepository'),
  LikeRecipeUseCase: Symbol.for('LikeRecipeUseCase'),
  UnlikeRecipeUseCase: Symbol.for('UnlikeRecipeUseCase'),
  LoadLikedRecipesUseCase: Symbol.for('LoadLikedRecipesUseCase'),
  NotificationRepository: Symbol.for('NotificationRepository'),
  UserProfileRepository: Symbol.for('UserProfileRepository'),
  ListNotificationsUseCase: Symbol.for('ListNotificationsUseCase'),
  MarkAllReadUseCase: Symbol.for('MarkAllReadUseCase'),
  MarkOneReadUseCase: Symbol.for('MarkOneReadUseCase'),
  RegisterDeviceTokenUseCase: Symbol.for('RegisterDeviceTokenUseCase'),
  GetUserProfileUseCase: Symbol.for('GetUserProfileUseCase'),
  FeedbackRepository: Symbol.for('FeedbackRepository'),
  FeatureFlagRepository: Symbol.for('FeatureFlagRepository'),
  FeatureFlagResolver: Symbol.for('FeatureFlagResolver'),
  SubmitFeedbackUseCase: Symbol.for('SubmitFeedbackUseCase'),
  KeyValueStore: Symbol.for('KeyValueStore'),
  DeviceIdentity: Symbol.for('DeviceIdentity'),
  DeviceRepository: Symbol.for('DeviceRepository'),
  DeviceLocaleProvider: Symbol.for('DeviceLocaleProvider'),
  LocaleService: Symbol.for('LocaleService'),
  NotificationService: Symbol.for('NotificationService'),
  AlarmAudioService: Symbol.for('AlarmAudioService'),
  AdsService: Symbol.for('AdsService'),
  AssistantSession: Symbol.for('AssistantSession'),
  AssistantMicrophone: Symbol.for('AssistantMicrophone'),
  AssistantPlayer: Symbol.for('AssistantPlayer'),
  AssistantTokenRepository: Symbol.for('AssistantTokenRepository'),
  AssistantMessenger: Symbol.for('AssistantMessenger'),
  OsAssistant: Symbol.for('OsAssistant'),
  WindowPosture: Symbol.for('WindowPosture'),
} as const;
