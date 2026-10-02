import type { Mapper } from '@core/mapper/mapper';
import { ok } from '@core/result/result-helpers';
import type { ValidationFailure } from '@core/failure';
import { InstagramConnection } from '@domain/instagram/connect/instagram-connection';
import { InstagramConnectionStatus } from '@domain/instagram/connect/instagram-connection-status';
import type { InstagramConnectionDto } from '@infrastructure/instagram/dtos/instagram-connection-dto';
import { readOneOf } from '@infrastructure/instagram/read/read-one-of';
import { readDate } from '@infrastructure/instagram/read/read-date';

/** `GET /me/instagram` → `InstagramConnection`; an unknown status fails it. */
export const toInstagramConnection: Mapper<InstagramConnectionDto, InstagramConnection, ValidationFailure> = (dto) => {
  const status = dto.status === null ? null : readOneOf(InstagramConnectionStatus, dto.status, 'status');
  if (status !== null && !status.ok) return status;
  return ok(
    InstagramConnection.of({
      available: dto.available,
      connected: dto.connected,
      username: dto.username,
      status: status === null ? null : status.value,
      tokenExpiresAt: readDate(dto.tokenExpiresAt),
      connectedAt: readDate(dto.connectedAt),
    }),
  );
};
