export interface ListUserRecipesInput {
  userId: string;
  /** 1-based, as the API counts. */
  page: number;
  pageSize: number;
}
