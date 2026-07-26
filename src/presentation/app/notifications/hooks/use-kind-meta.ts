import { useTheme } from '@presentation/base/theme/context/use-theme';
import type { NotifKind } from '@presentation/app/notifications/model/notif-kind';
import type { KindMeta } from '@presentation/app/notifications/model/kind-meta';

export const useKindMeta = (kind: NotifKind): KindMeta => {
  const colors = useTheme().colors;
  const map: Record<NotifKind, KindMeta> = {
    comment: { icon: 'chatbubble-outline', color: colors.primary },
    like: { icon: 'heart', color: colors.danger },
    favorite: { icon: 'bookmark', color: colors.primary },
    ai_done: { icon: 'sparkles-outline', color: colors.primary },
    moderation_approved: { icon: 'shield-checkmark-outline', color: colors.success },
    moderation_pending: { icon: 'alert-circle-outline', color: colors.warning },
    follow: { icon: 'person-add-outline', color: colors.primary },
    generic: { icon: 'notifications-outline', color: colors.primary },
  };
  return map[kind];
};
