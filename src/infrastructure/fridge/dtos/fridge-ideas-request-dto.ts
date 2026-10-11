/** JSON body of `POST /fridge/ideas`; optional fields are left out rather than sent empty. */
export interface FridgeIdeasRequestDto {
  ingredients: string[];
  maxMinutes?: number;
  diet?: string;
  servings: number;
  exclude?: string[];
  locale?: string;
}
