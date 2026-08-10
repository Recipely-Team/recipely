import type { RequestMapper } from '@core/mapper/request-mapper';
import type { PageQueryDto } from '@infrastructure/network/paging/page-query-dto';
import { FIRST_PAGE } from '@infrastructure/constants/api/api-paging';

/** What a caller knows: how big a page is, and possibly which one it wants. */
interface PageRequest {
  page?: number | undefined;
  pageSize: number;
}

/** Builds the paging query, defaulting to the first page when none is asked for. */
export const toPageQuery: RequestMapper<PageRequest, PageQueryDto> = ({ page, pageSize }) => ({
  page: page ?? FIRST_PAGE,
  pageSize,
});
