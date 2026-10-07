/** The notifications endpoint pages by `limit` / `offset`, not `page` / `pageSize`. */
export interface NotificationsQueryDto {
  limit: number;
  offset: number;
}
