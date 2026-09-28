import type { DeviceContextDto } from '@infrastructure/device/device-context-dto';

// Body of `POST /auth/register/verify` — the code the registration email carried.
export interface VerifyRegistrationRequestDto {
  email: string;
  code: string;
  /** Absent when the install's identity could not be read; the backend accepts that. */
  device?: DeviceContextDto;
}
