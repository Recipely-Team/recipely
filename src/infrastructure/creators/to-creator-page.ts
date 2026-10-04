import type { Failure } from '@core/failure';
import type { Mapper } from '@core/mapper/mapper';
import { ok } from '@core/result/result-helpers';
import type { CreatorSummaryEntity } from '@domain/creators/creator-summary-entity';
import { toCreatorSummary } from '@infrastructure/creators/to-creator-summary';
import { toPage } from '@infrastructure/network/paging/to-page';
import type { Page } from '@domain/common/page';
import type { PageDto } from '@infrastructure/network/paging/page-dto';
import type { CreatorSummaryDto } from '@infrastructure/creators/dtos/creator-summary-dto';

/**
 * `GET /users/creators` envelope -> `Page<CreatorSummaryEntity>`.
 *
 * @remarks
 * - **An unreadable item is skipped, not fatal.** One creator on a platform
 *   this build has no word for must not empty the whole strip.
 * - **`hasMore` comes from the backend's own counts**, as in `toRecipePage`,
 *   so a skipped item cannot make the list look finished.
 */
export const toCreatorPage: Mapper<PageDto<CreatorSummaryDto>, Page<CreatorSummaryEntity>, Failure> = (dto) => ok(toPage(dto, toCreatorSummary));
