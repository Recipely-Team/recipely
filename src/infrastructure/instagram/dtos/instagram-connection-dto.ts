// `GET /me/instagram` and the `connection` of a finalize. Keep in sync with
// recipely-backend `application/instagram/dtos/instagram-connection.dto.ts`.
export interface InstagramConnectionDto {
  connected: boolean;
  available: boolean;
  username: string | null;
  igUserId: string | null;
  status: string | null;
  tokenExpiresAt: string | null;
  connectedAt: string | null;
}
