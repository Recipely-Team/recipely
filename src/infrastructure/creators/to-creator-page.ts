import type { Failure } from '@core/failure';
import type { Mapper } from '@core/mapper/mapper';
import { ok } from '@core/result/result-helpers';
import type { CreatorPage } from '@domain/creators/creator-page';
import type { CreatorSummaryEntity } from '@domain/creators/creator-summary-entity';
import type { CreatorsPageDto } from '@infrastructure/creators/dtos/creators-page-dto';
import { toCreatorSummary } from '@infrastructure/creators/to-creator-summary';

/**
 * `GET /users/creators` envelope -> `CreatorPage`.
 *
 * @remarks
 * - **An unreadable item is skipped, not fatal.** One creator on a platform
 *   this build has no word for must not empty the whole strip.
 * - **`hasMore` comes from the backend's own counts**, as in `toRecipePage`,
 *   so a skipped item cannot make the list look finished.
 */
export const toCreatorPage: Mapper<CreatorsPageDto, CreatorPage, Failure> = (dto) => {
  const items: CreatorSummaryEntity[] = [];
  for (const item of dto.items) {
    const mapped = toCreatorSummary(item);
    if (mapped.ok) items.push(mapped.value);
  }
  return ok({
    items,
    total: dto.total,
    page: dto.page,
    pageSize: dto.pageSize,
    hasMore: dto.page * dto.pageSize < dto.total,
  });
};
