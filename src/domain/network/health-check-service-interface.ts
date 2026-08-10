import type { HealthStatus } from '@domain/network/health-status';

export interface HealthCheckServiceInterface {
  check(): Promise<HealthStatus>;
}
