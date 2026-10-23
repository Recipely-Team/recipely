import type { StoreStatus } from '@application/store/store-status';

export interface FileImportLoading {
  status: typeof StoreStatus.Loading;
}
