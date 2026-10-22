import type { StoreStatus } from '@application/store/store-status';

export interface FileImportIdle {
  status: typeof StoreStatus.Idle;
}
