import type { RequestMapper } from '@core/mapper/request-mapper';
import type { SetDayWaterRequestDto } from '@infrastructure/diary/write/set-day-water-request-dto';

/** Glasses → `PUT /diary/days/:date/water` body. */
export const toSetDayWaterRequest: RequestMapper<number, SetDayWaterRequestDto> = (glasses) => ({ glasses });
