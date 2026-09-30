import type { CreatorSummaryDto } from '@infrastructure/creators/dtos/creator-summary-dto';

// `GET /users/creators` — the backend's `PageResult` envelope.
export interface CreatorsPageDto {
  items: CreatorSummaryDto[];
  total: number;
  page: number;
  pageSize: number;
}
