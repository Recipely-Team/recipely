import type { TranslationsType } from '@presentation/i18n';
import { PublishBlocker, type PublishBlockerType } from '@domain/recipes/publishing/publish-blocker';
import type { IoniconNameType } from '@presentation/base/errors/ionicon-name';

/** How each checklist row reads: what the owner still has to do, and its icon. */
export const blockerLook: Record<PublishBlockerType, { icon: IoniconNameType; label: (t: TranslationsType) => string }> = {
  [PublishBlocker.Photo]: { icon: 'camera-outline', label: (t) => t.publishing.needPhoto },
  [PublishBlocker.Ingredients]: { icon: 'create-outline', label: (t) => t.publishing.needIngredients },
  [PublishBlocker.Instructions]: { icon: 'create-outline', label: (t) => t.publishing.needInstructions },
};
