import type { Nutrients } from '@domain/diary/nutrition/nutrients';

/** One variant chip or radio row of the product step. */
export interface VariantOption {
  key: string;
  name: string;
  per100: Nutrients;
}
