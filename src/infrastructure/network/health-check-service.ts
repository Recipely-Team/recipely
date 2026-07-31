import { HealthStatus } from '@domain/network/health-status';
import type { HealthCheckServiceInterface } from '@domain/network/health-check-service-interface';
import { HEALTH_URL } from '@infrastructure/constants/api';
import { HttpMethod } from '@infrastructure/network/http/http-method';

/** A health probe that has not answered in five seconds is not healthy. */
const HEALTH_TIMEOUT_MS = 5_000;

/**
 * Probes the backend health endpoint with a 5-second timeout to determine
 * whether the server is reachable. Returns `'connected'`, `'disconnected'`, or
 * `'unknown'` — never throws.
 */
export class HealthCheckService implements HealthCheckServiceInterface {
  async check(): Promise<HealthStatus> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

      const response = await fetch(HEALTH_URL, {
        method: HttpMethod.Get,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return HealthStatus.Disconnected;
      }
      return HealthStatus.Connected;
    } catch {
      return HealthStatus.Disconnected;
    }
  }
}
