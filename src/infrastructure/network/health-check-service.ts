import type { HealthStatus } from '@domain/network/health-status';
import type { HealthCheckServiceInterface } from '@domain/network/health-check-service-interface';
import { HEALTH_URL } from '@infrastructure/constants/api';

/**
 * Probes the backend health endpoint with a 5-second timeout to determine
 * whether the server is reachable. Returns `'connected'`, `'disconnected'`, or
 * `'unknown'` — never throws.
 */
export class HealthCheckService implements HealthCheckServiceInterface {
  async check(): Promise<HealthStatus> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5_000);

      const response = await fetch(HEALTH_URL, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return 'disconnected';
      }
      return 'connected';
    } catch {
      return 'disconnected';
    }
  }
}
