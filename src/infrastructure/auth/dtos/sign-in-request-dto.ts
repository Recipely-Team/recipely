import type { DeviceContextDto } from '@infrastructure/device/device-context-dto';

// Body of `POST /auth/login`.
export interface SignInRequestDto {
  email: string;
  password: string;
  /** Absent when the install's identity could not be read; the backend accepts that. */
  device?: DeviceContextDto;
}
