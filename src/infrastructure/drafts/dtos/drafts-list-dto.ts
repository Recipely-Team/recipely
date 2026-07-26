import type { RecipeDraftDto } from '@infrastructure/drafts/dtos/recipe-draft-dto';

// Recipely paged envelope for drafts. Mirrors the recipes list envelope shape
// (`{ items, total, page, pageSize }`).
export interface DraftsListDto {
  items: RecipeDraftDto[];
  total: number;
  page: number;
  pageSize: number;
}
