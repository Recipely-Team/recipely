// The product an entry was logged from — on `FoodLogEntry` reads and in the
// `POST /diary/entries` body. Keep in sync with recipely-backend
// `application/diary/dtos/food-log-entry.dto.ts`.
export interface FoodLogProductDto {
  source: string;
  foodVariantId: string | null;
  offBarcode: string | null;
  unitKey: string;
  unitAmount: number;
}
