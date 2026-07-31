// Body of `POST /auth/register/verify` — the code the registration email carried.
export interface VerifyRegistrationRequestDto {
  email: string;
  code: string;
}
