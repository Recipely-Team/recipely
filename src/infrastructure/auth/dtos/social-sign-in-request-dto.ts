// Body of `POST /auth/social` — the Firebase ID token from Google or Apple,
// which the backend verifies before issuing its own session.
export interface SocialSignInRequestDto {
  idToken: string;
}
