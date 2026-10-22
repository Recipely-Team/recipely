import type { StoreStatus } from '@application/store/store-status';

export interface ProfileStatsError {
  status: typeof StoreStatus.Error;
  message: string;
  onRetry: () => void;
}
