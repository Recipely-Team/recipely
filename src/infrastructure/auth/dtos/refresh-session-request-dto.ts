/** Body of `/auth/refresh` and `/auth/logout`; a web client sends none, its token is the cookie. */
export interface RefreshSessionRequestDto {
  refreshToken?: string;
}
