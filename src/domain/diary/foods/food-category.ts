/** One shelf of the curated catalogue (dairy, drinks, …), named in the reader's language by the server. */
export interface FoodCategory {
  readonly key: string;
  readonly name: string;
  readonly productCount: number;
}
