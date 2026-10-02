import type { DmSendStatusType } from '@domain/instagram/activity/dm-send-status';
import type { DmSendReasonType } from '@domain/instagram/activity/dm-send-reason';

/** One matched comment and what happened to its private reply — the Activity screen's row. */
export interface DmSend {
  readonly id: string;
  readonly commenterUsername: string | null;
  readonly commentText: string | null;
  readonly status: DmSendStatusType;
  /** Null unless `status` is failed (and the server named why). */
  readonly reason: DmSendReasonType | null;
  readonly publicReplied: boolean;
  readonly createdAt: Date;
}
