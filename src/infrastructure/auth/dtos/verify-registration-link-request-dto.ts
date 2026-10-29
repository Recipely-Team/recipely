import type { DeviceContextDto } from '@infrastructure/device/device-context-dto';

// Body of `POST /auth/register/verify-link` — the token the registration email's link carried.
export interface VerifyRegistrationLinkRequestDto {
  token: string;
  /** Absent when the install's identity could not be read; the backend accepts that. */
  device?: DeviceContextDto;
}
