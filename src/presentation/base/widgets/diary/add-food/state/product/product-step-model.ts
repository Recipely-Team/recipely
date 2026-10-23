import type { ProductStepLoading } from '@presentation/base/widgets/diary/add-food/state/product/states/product-step-loading';
import type { ProductStepError } from '@presentation/base/widgets/diary/add-food/state/product/states/product-step-error';
import type { ProductStepLoaded } from '@presentation/base/widgets/diary/add-food/state/product/states/product-step-loaded';

/** What the product step renders: its product loading, failed, or ready with the chosen variant and amount. */
export type ProductStepModelType =
  | ProductStepLoading
  | ProductStepError
  | ProductStepLoaded;
