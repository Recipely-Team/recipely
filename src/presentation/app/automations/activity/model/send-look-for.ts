import { DmSendStatus } from '@domain/instagram/activity/dm-send-status';
import { DmSendReason, type DmSendReasonType } from '@domain/instagram/activity/dm-send-reason';
import type { DmSend } from '@domain/instagram/activity/dm-send';
import { SeverityType } from '@presentation/base/theme/colors/surfaces/severity-type';
import type { SendLook } from '@presentation/app/automations/activity/model/send-look';
import { t } from '@presentation/i18n';

const REASON_KEY: Readonly<Record<DmSendReasonType, keyof ReturnType<typeof t>['instagram']['reasons']>> = {
  [DmSendReason.TooOld]: 'tooOld',
  [DmSendReason.RecipeUnavailable]: 'recipeUnavailable',
  [DmSendReason.NotConnected]: 'notConnected',
  [DmSendReason.RateLimited]: 'rateLimited',
  [DmSendReason.PermissionMissing]: 'permissionMissing',
  [DmSendReason.RecipientUnavailable]: 'recipientUnavailable',
  [DmSendReason.UpstreamError]: 'upstreamError',
};

/** Too old is the platform's window, not a fault — warning; every other failure is danger. */
const REASON_SEVERITY: Readonly<Record<DmSendReasonType, SeverityType>> = {
  [DmSendReason.TooOld]: SeverityType.Warning,
  [DmSendReason.RecipeUnavailable]: SeverityType.Danger,
  [DmSendReason.NotConnected]: SeverityType.Warning,
  [DmSendReason.RateLimited]: SeverityType.Warning,
  [DmSendReason.PermissionMissing]: SeverityType.Danger,
  [DmSendReason.RecipientUnavailable]: SeverityType.Danger,
  [DmSendReason.UpstreamError]: SeverityType.Danger,
};

/** A send's status pill (spec §4): Sent ✓ · Older than 7 days ⏱ · Can't receive messages ! — with copy for every reason code. */
export const sendLookFor = (send: DmSend): SendLook => {
  const copy = t().instagram;
  if (send.status === DmSendStatus.Sent) return { label: copy.statusSent, severity: SeverityType.Success, icon: 'checkmark' };
  if (send.status === DmSendStatus.Pending) return { label: copy.statusPending, severity: SeverityType.Neutral, icon: 'ellipsis-horizontal' };
  const reason = send.reason ?? DmSendReason.UpstreamError;
  return {
    label: copy.reasons[REASON_KEY[reason]],
    severity: REASON_SEVERITY[reason],
    icon: reason === DmSendReason.TooOld ? 'time-outline' : 'alert',
  };
};
