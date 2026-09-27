import type { DeviceContextDto } from '@infrastructure/device/device-context-dto';

// Body of `POST /auth/social` — the Firebase ID token from Google or Apple,
// which the backend verifies before issuing its own session.
export interface SocialSignInRequestDto {
  idToken: string;
  /** Absent when the install's identity could not be read; the backend accepts that. */
  device?: DeviceContextDto;
}
