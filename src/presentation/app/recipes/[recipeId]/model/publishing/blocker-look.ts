import { PublishBlocker, type PublishBlockerType } from '@domain/recipes/publishing/publish-blocker';
import type { IoniconName } from '@presentation/base/errors/ionicon-name';
import { t } from '@presentation/i18n';

/** How each checklist row reads: what the owner still has to do, and its icon. */
export const blockerLook: Record<PublishBlockerType, { icon: IoniconName; label: () => string }> = {
  [PublishBlocker.Photo]: { icon: 'camera-outline', label: () => t().publishing.needPhoto },
  [PublishBlocker.Ingredients]: { icon: 'create-outline', label: () => t().publishing.needIngredients },
  [PublishBlocker.Instructions]: { icon: 'create-outline', label: () => t().publishing.needInstructions },
};
