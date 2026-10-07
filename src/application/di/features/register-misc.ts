import type { Container } from '@core/di/container';
import { TOKENS } from '@application/di/tokens';
import type { ApplicationStores } from '@application/di/application-stores';
import type { ListNotificationsUseCase } from '@application/notifications/list/list-notifications-use-case';
import type { MarkAllReadUseCase } from '@application/notifications/read/mark-all-read-use-case';
import type { MarkOneReadUseCase } from '@application/notifications/read/mark-one-read-use-case';
import { configureNotificationsStore } from '@application/notifications/notifications-store';
import type { GetUserProfileUseCase } from '@application/user-profile/get-user-profile-use-case';
import { configureUserProfileStore } from '@application/user-profile/user-profile-store';
import type { LoadTaxonomyUseCase } from '@application/recipes/taxonomy/load-taxonomy-use-case';
import { configureTaxonomyStore } from '@application/recipes/taxonomy/taxonomy-store';
import type { SubmitFeedbackUseCase } from '@application/feedback/submit-feedback-use-case';
import { configureFeedbackStore } from '@application/feedback/feedback-store';

/**
 * **Small-feature composition** — notifications, the signed-in user's profile, the recipe
 * taxonomy and feedback: each one store over use cases the infrastructure registers.
 */
export const registerMisc = (
  container: Container,
): Pick<
  ApplicationStores,
  'notificationsStore' | 'userProfileStore' | 'taxonomyStore' | 'feedbackStore'
> => {
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
  return { notificationsStore, userProfileStore, taxonomyStore, feedbackStore };
};
