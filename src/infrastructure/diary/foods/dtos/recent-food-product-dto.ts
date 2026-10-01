import type { KcalNutrientsDto } from '@infrastructure/diary/foods/dtos/kcal-nutrients-dto';

// The product part of a recent food: what to re-log it as, and the unrounded
// nutrients of ONE of its unit. Keep in sync with recipely-backend
// `application/diary/dtos/recent-product.dto.ts`.
export interface RecentFoodProductDto {
  source: string;
  foodVariantId: string | null;
  offBarcode: string | null;
  unitKey: string;
  unitAmount: number;
  foodId: string | null;
  /** `{ kcal, … }` like `per100` (backend `recent-product.dto.ts`), not the entries' `calories`. */
  perUnit: KcalNutrientsDto;
}
