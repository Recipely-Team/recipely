// Body of `POST /auth/register`. The account is not created until the emailed
// code is verified — see `VerifyRegistrationRequestDto`.
export interface RegisterRequestDto {
  email: string;
  password: string;
  displayName: string;
}
