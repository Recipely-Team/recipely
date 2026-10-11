/**
 * The DI key for every service this app wires up.
 *
 * Lives in `application/di/`, NOT in `core/`: `core/di/container.ts` is a
 * generic container that maps a bare `symbol` to a factory and never learns a
 * single token name — that is the reusable building block. This list, by
 * contrast, enumerates *this* application's repositories and ports (use cases are built by the registrars),
 * which is composition knowledge and belongs with the composition root.
 *
 * `infrastructure/di/register.ts` reads these too. That is the one sanctioned
 * upward import: `scripts/check-structure.mjs` exempts any file under a `di/`
 * wiring folder from the layer rule, because registering an implementation
 * against an application-level key is exactly what a composition root is for.
 */
export const TOKENS = {
  AuthRepository: Symbol.for('AuthRepository'),
  RecipeRepository: Symbol.for('RecipeRepository'),
  TaxonomyRepository: Symbol.for('TaxonomyRepository'),
  RecipeDraftRepository: Symbol.for('RecipeDraftRepository'),
  FavoritesRepository: Symbol.for('FavoritesRepository'),
  FoodDiaryRepository: Symbol.for('FoodDiaryRepository'),
  FoodCatalogRepository: Symbol.for('FoodCatalogRepository'),
  InstagramRepository: Symbol.for('InstagramRepository'),
  CommentRepository: Symbol.for('CommentRepository'),
  LikeRepository: Symbol.for('LikeRepository'),
  NotificationRepository: Symbol.for('NotificationRepository'),
  ShoppingListRepository: Symbol.for('ShoppingListRepository'),
  MealPlanRepository: Symbol.for('MealPlanRepository'),
  FridgeRepository: Symbol.for('FridgeRepository'),
  UserProfileRepository: Symbol.for('UserProfileRepository'),
  FeedbackRepository: Symbol.for('FeedbackRepository'),
  FeatureFlagResolver: Symbol.for('FeatureFlagResolver'),
  KeyValueStore: Symbol.for('KeyValueStore'),
  PreferenceStore: Symbol.for('PreferenceStore'),
  DeviceIdentity: Symbol.for('DeviceIdentity'),
  DeviceRepository: Symbol.for('DeviceRepository'),
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
