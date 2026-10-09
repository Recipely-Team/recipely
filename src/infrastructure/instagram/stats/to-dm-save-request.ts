import type { RequestMapper } from '@core/mapper/request-mapper';
import type { DmSaveRequestDto } from '@infrastructure/instagram/stats/dm-save-request-dto';

/** The saved recipe → `POST /me/instagram/dm-sends/:id/save` body. */
export const toDmSaveRequest: RequestMapper<string, DmSaveRequestDto> = (recipeId) => ({ recipeId });
