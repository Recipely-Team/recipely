// Body of the endpoints that take nothing but the address they act on:
// `POST /auth/register/resend` and `POST /auth/forgot-password`.
//
// Shared deliberately. Two endpoints with one field each would otherwise be
// two identical interfaces, and a name that says what the body IS beats two
// that say which route it happens to travel to.
export interface EmailOnlyRequestDto {
  email: string;
}
