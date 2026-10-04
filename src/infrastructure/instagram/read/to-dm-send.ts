import type { Mapper } from '@core/mapper/mapper';
import { ok } from '@core/result/result-helpers';
import type { ValidationFailure } from '@core/failure';
import { ValueConstants } from '@core/constants';
import { DmSendStatus } from '@domain/instagram/activity/dm-send-status';
import { DmSendReason } from '@domain/instagram/activity/dm-send-reason';
import type { DmSend } from '@domain/instagram/activity/dm-send';
import type { DmSendDto } from '@infrastructure/instagram/dtos/dm-send-dto';
import { readOneOf } from '@infrastructure/instagram/read/read-one-of';
import { readDate } from '@infrastructure/instagram/read/read-date';

/**
 * A send → `DmSend`. An unknown status skips the row; an unknown reason reads
 * as "upstream error" rather than hiding a failure the user should see.
 */
export const toDmSend: Mapper<DmSendDto, DmSend, ValidationFailure> = (dto) => {
  const status = readOneOf(DmSendStatus, dto.status, 'status');
  if (!status.ok) return status;
  const reason = dto.reason === null ? null : readOneOf(DmSendReason, dto.reason, 'reason');
  return ok({
    id: dto.id,
    commenterUsername: dto.commenterUsername,
    commentText: dto.commentText,
    status: status.value,
    reason: reason === null ? null : reason.ok ? reason.value : DmSendReason.UpstreamError,
    publicReplied: dto.publicReplied,
    createdAt: readDate(dto.createdAt) ?? new Date(ValueConstants.zero),
  });
};
