import { ShoppingListRepository } from '@infrastructure/shopping/shopping-list-repository';
import { type Container } from '@core/di/container';
import { TOKENS } from '@application/di/tokens';
import { HttpClient } from '@infrastructure/network/http/http-client';
import type { HttpClientOptions } from '@infrastructure/network/http/http-client-options';
import { SecureTokenStorage } from '@infrastructure/storage/secure-token-storage';
import { AuthRepository } from '@infrastructure/auth/auth-repository';
import { RecipeRepository } from '@infrastructure/recipes/recipe-repository';
import { TaxonomyRepository } from '@infrastructure/recipes/taxonomy/taxonomy-repository';
import { RecipeDraftRepository } from '@infrastructure/drafts/recipe-draft-repository';
import { FavoritesRepository } from '@infrastructure/favorites/favorites-repository';
import { FoodDiaryRepository } from '@infrastructure/diary/food-diary-repository';
import { FoodCatalogRepository } from '@infrastructure/diary/foods/food-catalog-repository';
import { InstagramRepository } from '@infrastructure/instagram/instagram-repository';
import { CommentRepository } from '@infrastructure/comments/comment-repository';
import { LikeRepository } from '@infrastructure/likes/like-repository';
import { NotificationRepository } from '@infrastructure/notifications/notification-repository';
import { UserProfileRepository } from '@infrastructure/user-profile/user-profile-repository';
import { FeedbackRepository } from '@infrastructure/feedback/feedback-repository';
import { FeatureFlagRepository } from '@infrastructure/flags/feature-flag-repository';
import { FeatureFlagResolver } from '@application/config/feature-flag-resolver';
import { IS_DEV_BUILD } from '@infrastructure/constants/app-variant';
import { kvStore } from '@infrastructure/storage/kv-store';
import { NotificationService } from '@infrastructure/notifications/notification-service';
import { AlarmAudioService } from '@infrastructure/audio/alarm-audio-service';
import { AdsService } from '@infrastructure/ads/ads-service';
import { OsAssistantBridge } from '@infrastructure/assistant/os/os-assistant-bridge';
import { WindowPostureBridge } from '@infrastructure/display/window-posture-bridge';
import { AssistantMessenger } from '@infrastructure/assistant/message/assistant-messenger';
import { AssistantTokenRepository } from '@infrastructure/assistant/token/assistant-token-repository';
import { GeminiLiveSession } from '@live-assistant/gemini';
import { Microphone, PcmPlayer } from '@live-assistant/audio';
import { ExpoDeviceLocaleProvider } from '@infrastructure/i18n/expo-device-locale-provider';
import { LocaleService } from '@application/i18n/locale-service';
import { randomUUID } from 'expo-crypto';
import Constants from 'expo-constants';
import { StoredDeviceIdentity } from '@infrastructure/device/stored-device-identity';
import { DeviceRepository } from '@infrastructure/device/device-repository';
import { currentDevicePlatform } from '@infrastructure/device/current-device-platform';
import { API_BASE_URL } from '@infrastructure/constants/api/api-hosts';

/** Host-app callbacks and providers injected into the infrastructure wiring. */
interface InfrastructureOptions {
  /**
   * Invoked on every backend 401. Wired into the HTTP client so the app can
   * clear the session and route to login; the auth store gates the actual
   * logout (a 401 outside an authenticated session is a no-op).
   */
  onUnauthorized?: () => void;
}

/**
 * **Infrastructure composition** — binds every port the application resolves to its adapter.
 *
 * @remarks
 * - **Tokens:** only for what application or presentation resolve; the HTTP client, the
 *   device-locale provider and the feature-flag repository are local values here.
 * - **Use cases:** none — the application registrars build them over these ports.
 */
export const registerInfrastructure = (container: Container, opts?: InfrastructureOptions): void => {
  const storage = new SecureTokenStorage();
  const deviceIdentity = new StoredDeviceIdentity(
    kvStore,
    randomUUID,
    currentDevicePlatform(),
    Constants.expoConfig?.version ?? null,
  );

  container.register(TOKENS.KeyValueStore, () => kvStore);
  container.register(TOKENS.DeviceIdentity, () => deviceIdentity);
  // The single source of the active language.
  container.register(TOKENS.LocaleService, () => new LocaleService(kvStore, new ExpoDeviceLocaleProvider()));
  container.register(TOKENS.NotificationService, () => new NotificationService());
  container.register(TOKENS.AlarmAudioService, () => new AlarmAudioService());
  container.register(TOKENS.AdsService, () => new AdsService());
  container.register(TOKENS.AssistantSession, () => new GeminiLiveSession());
  container.register(TOKENS.AssistantMicrophone, () => new Microphone());
  container.register(TOKENS.AssistantPlayer, () => new PcmPlayer());
  // OS assistant integrations behind a port; the web half reports unavailable.
  container.register(TOKENS.OsAssistant, () => new OsAssistantBridge());
  // Fold and hinge posture; the web half reads the Viewport Segments API.
  container.register(TOKENS.WindowPosture, () => new WindowPostureBridge());

  const httpClientOptions: HttpClientOptions = {
    baseUrl: API_BASE_URL,
    tokenProvider: async () => {
      const result = await storage.loadSession();
      if (!result.ok || result.value === null) {
        return null;
      }
      return result.value.accessToken;
    },
    // Resolved per request; awaiting hydrate() stops startup requests racing the saved language.
    localeProvider: async () => {
      const localeService = container.resolve<LocaleService>(TOKENS.LocaleService);
      await localeService.hydrate();
      return localeService.getLocale();
    },
    enableLogging: __DEV__,
  };
  if (opts?.onUnauthorized) {
    httpClientOptions.onUnauthorized = opts.onUnauthorized;
  }
  const http = new HttpClient(httpClientOptions);

  container.register(TOKENS.AuthRepository, () => new AuthRepository(http, storage, deviceIdentity));
  container.register(TOKENS.DeviceRepository, () => new DeviceRepository(http));
  container.register(TOKENS.RecipeRepository, () => new RecipeRepository(http));
  container.register(TOKENS.TaxonomyRepository, () => new TaxonomyRepository(http));
  container.register(TOKENS.RecipeDraftRepository, () => new RecipeDraftRepository(http));
  container.register(TOKENS.FavoritesRepository, () => new FavoritesRepository(http));
  container.register(TOKENS.FoodDiaryRepository, () => new FoodDiaryRepository(http));
  container.register(TOKENS.FoodCatalogRepository, () => new FoodCatalogRepository(http));
  container.register(TOKENS.InstagramRepository, () => new InstagramRepository(http));
  container.register(TOKENS.CommentRepository, () => new CommentRepository(http));
  container.register(TOKENS.LikeRepository, () => new LikeRepository(http));
  container.register(TOKENS.NotificationRepository, () => new NotificationRepository(http));
  container.register(TOKENS.ShoppingListRepository, () => new ShoppingListRepository(http));
  container.register(TOKENS.UserProfileRepository, () => new UserProfileRepository(http));
  container.register(TOKENS.FeedbackRepository, () => new FeedbackRepository(http));
  container.register(TOKENS.AssistantTokenRepository, () => new AssistantTokenRepository(http));
  container.register(TOKENS.AssistantMessenger, () => new AssistantMessenger(http));
  container.register(
    TOKENS.FeatureFlagResolver,
    () => new FeatureFlagResolver(new FeatureFlagRepository(http), IS_DEV_BUILD),
  );
};
