// Body of `POST /auth/reset-password`. The token comes from the emailed
// universal link, not from the session.
export interface ResetPasswordRequestDto {
  token: string;
  newPassword: string;
}
